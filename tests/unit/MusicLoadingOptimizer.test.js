// Explicit mock setup for Logger - MUST be before imports
jest.mock('../../src/audio/MusicConfig');
// Mocking with .js extension to match require in source exactly
jest.mock('../../src/utils/Logger.js', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
    Logger: jest.fn(),
}));

const { MusicLoadingOptimizer } = require('../../src/audio/MusicLoadingOptimizer');
const { logger } = require('../../src/utils/Logger.js');

describe('MusicLoadingOptimizer', () => {
    let optimizer;
    let mockPerformanceMonitor;
    let originalNavigator;
    let originalPerformance;

    beforeEach(() => {
        jest.clearAllMocks();
        // Use modern fake timers which mock Date.
        jest.useFakeTimers({
            doNotFake: ['nextTick', 'setImmediate'],
        });

        mockPerformanceMonitor = {
            recordLoadingStart: jest.fn(),
            recordLoadingComplete: jest.fn(),
        };

        // Mock Navigator and Performance
        originalNavigator = global.navigator;
        originalPerformance = global.performance;

        // Setup default navigator with connection API
        const mockNavigator = {
            ...originalNavigator,
            userAgent:
                'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36',
            connection: {
                effectiveType: '4g',
                downlink: 10,
                rtt: 50,
                saveData: false,
                addEventListener: jest.fn(),
            },
            hardwareConcurrency: 8,
        };

        // Define navigator on global with property descriptor to allow overwriting if needed
        Object.defineProperty(global, 'navigator', {
            value: mockNavigator,
            writable: true,
            configurable: true,
        });

        // Setup performance memory
        const mockPerformance = {
            ...originalPerformance,
            memory: {
                jsHeapSizeLimit: 2 * 1024 * 1024 * 1024, // 2GB
                usedJSHeapSize: 500 * 1024 * 1024,
                totalJSHeapSize: 1024 * 1024 * 1024,
            },
            now: jest.fn(() => Date.now()),
        };

        Object.defineProperty(global, 'performance', {
            value: mockPerformance,
            writable: true,
            configurable: true,
        });

        optimizer = new MusicLoadingOptimizer(mockPerformanceMonitor);
    });

    afterEach(() => {
        optimizer.cleanup();
        jest.useRealTimers();

        // Restore globals
        Object.defineProperty(global, 'navigator', {
            value: originalNavigator,
            writable: true,
        });
        Object.defineProperty(global, 'performance', {
            value: originalPerformance,
            writable: true,
        });
    });

    describe('Initialization', () => {
        test('should initialize with valid network and device capabilities', () => {
            expect(optimizer.networkConditions.effectiveType).toBe('4g');
            expect(optimizer.deviceCapabilities.memory).toBe('medium');
            expect(optimizer.performanceMonitor).toBe(mockPerformanceMonitor);
        });

        test('should detect mobile devices', () => {
            // Re-initialize with mobile user agent
            global.navigator = {
                ...global.navigator,
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X)',
            };

            optimizer = new MusicLoadingOptimizer();
            expect(optimizer.deviceCapabilities.isMobile).toBe(true);
        });
    });

    describe('Strategy Selection', () => {
        const mockTracks = [
            { id: 'track1', estimatedSize: 500 * 1024, energyLevel: 'ambient' }, // Small, ambient -> Background
            { id: 'track2', estimatedSize: 5 * 1024 * 1024, energyLevel: 'high' }, // Large, non-ambient -> Deferred
            { id: 'track3', estimatedSize: 2 * 1024 * 1024, preload: true }, // Preload -> Background
        ];

        test('should categorize tracks correctly', () => {
            const strategy = optimizer.optimizeLoadingStrategy(mockTracks);

            // track1 (background - small & ambient), track3 (background - preload)
            expect(strategy.background.map((t) => t.id)).toEqual(
                expect.arrayContaining(['track1', 'track3'])
            );
            // track2 (deferred)
            expect(strategy.deferred.map((t) => t.id)).toEqual(['track2']);
        });

        test('should prioritize specific track', () => {
            const strategy = optimizer.optimizeLoadingStrategy(mockTracks, {
                priorityTrack: 'track2',
            });

            expect(strategy.immediate[0].id).toBe('track2');
            expect(strategy.deferred.length).toBe(0);
        });

        test('should respect data saver mode', () => {
            optimizer.networkConditions.saveData = true;
            const strategy = optimizer.optimizeLoadingStrategy(mockTracks);

            expect(strategy.onDemand.length).toBe(3);
            expect(strategy.background.length).toBe(0);
            expect(strategy.deferred.length).toBe(0);
        });

        test('should adapt to slow network', () => {
            optimizer.networkConditions.effectiveType = '2g';
            const strategy = optimizer.optimizeLoadingStrategy(mockTracks);

            // On slow network:
            // track1 (500KB) -> background (size < 1MB check is before slow network check)
            // track2 (5MB) -> onDemand (hits slow network check)
            // track3 (2MB, preload) -> background (preload check is before slow network check)
            // So we expect 1 onDemand track, 2 background
            expect(strategy.onDemand.length).toBe(1);
            expect(strategy.onDemand[0].id).toBe('track2');
            expect(strategy.background.length).toBe(2);
        });
    });

    describe('Progressive Loading', () => {
        const tracks = [
            { id: 't1', estimatedSize: 100 * 1024 }, // small
            { id: 't2', estimatedSize: 200 * 1024 }, // small
        ];

        test('should execute loading phases', async () => {
            const onProgress = jest.fn();
            const onTrackLoaded = jest.fn();

            // Mock simulate loading to resolve immediately
            optimizer._simulateTrackLoading = jest.fn().mockResolvedValue();

            // Run progressive load
            const resultPromise = optimizer.progressiveLoad(tracks, onProgress, onTrackLoaded);

            // Await result immediately.
            // Because we force tracks to background, prompt return happens.
            const results = await resultPromise;

            // Wait for background tasks processing.
            // Since background processing uses floating promises, we must flush the microtask queue.
            // We loop heavily to ensure microtasks propagate through the promise chain.
            for (let i = 0; i < 20; i++) {
                await Promise.resolve();
            }
            jest.runAllTimers(); // just in case

            expect(results.loaded).toContain('t1');
            expect(results.loaded).toContain('t2');
            expect(onProgress).toHaveBeenCalled();
            expect(onTrackLoaded).toHaveBeenCalled();
        });

        test('should handle loading failures', async () => {
            optimizer._simulateTrackLoading = jest
                .fn()
                .mockRejectedValue(new Error('Simulated Fail'));

            const resultPromise = optimizer.progressiveLoad(tracks);
            const results = await resultPromise;

            for (let i = 0; i < 20; i++) {
                await Promise.resolve();
            }
            jest.runAllTimers();

            expect(results.failed.length).toBeGreaterThan(0);
        });
    });

    describe('Adaptation and Optimization', () => {
        test('should adapt strategy based on conditions', () => {
            const strategy = {
                onDemand: [],
                background: [{ id: 't1' }],
                deferred: [],
                concurrency: 4,
            };

            // Enable data saver
            optimizer.networkConditions.saveData = true;

            const newStrategy = optimizer.adaptStrategy(strategy);

            expect(newStrategy.background.length).toBe(0);
            expect(newStrategy.onDemand.length).toBe(1);
            // Verify string inclusion manually
            expect(newStrategy.adaptations.some((a) => a.includes('data saver'))).toBe(true);
        });

        test('should reduce concurrency on low memory', () => {
            optimizer.deviceCapabilities.memory = 'low';

            const strategy = {
                onDemand: [],
                background: [],
                deferred: [],
                concurrency: 4,
            };

            const newStrategy = optimizer.adaptStrategy(strategy);
            expect(newStrategy.concurrency).toBeLessThan(4);
        });
    });

    describe('History and Statistics', () => {
        test('should track loading history', () => {
            optimizer._recordLoadingResult('t1', true, 100);
            optimizer._recordLoadingResult('t1', false, 100);

            const history = optimizer._getTrackLoadingHistory('t1');
            expect(history.attempts).toBe(2);
            expect(history.successes).toBe(1);
            expect(history.successRate).toBe(0.5);
        });
    });
});
