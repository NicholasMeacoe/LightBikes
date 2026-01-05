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

const { MUSIC_SYSTEM_CONFIG } = require('../../src/audio/MusicConfig');
const { logger } = require('../../src/utils/Logger.js');
// Import MusicBufferManager AFTER mocks are set up
const { MusicBufferManager } = require('../../src/audio/MusicBufferManager');

describe('MusicBufferManager', () => {
    let musicBufferManager;
    let mockPerformanceMonitor;

    // Helper to create a mock AudioBuffer
    const createMockAudioBuffer = ({
        numberOfChannels = 2,
        length = 44100,
        sampleRate = 44100,
    } = {}) => {
        return {
            numberOfChannels,
            length,
            sampleRate,
            duration: length / sampleRate,
            getChannelData: jest.fn(() => new Float32Array(length)),
        };
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Use modern fake timers which mock Date
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2023-01-01T00:00:00Z'));

        mockPerformanceMonitor = {
            recordLoadingComplete: jest.fn(),
        };

        // Set a long interval to prevent auto-cleanup interfering with manual cleanup tests
        if (MUSIC_SYSTEM_CONFIG) {
            MUSIC_SYSTEM_CONFIG.AUDIO_BUFFER_CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
        }

        musicBufferManager = new MusicBufferManager(mockPerformanceMonitor);
    });

    afterEach(() => {
        if (musicBufferManager) {
            musicBufferManager.cleanup();
        }
        jest.useRealTimers();
    });

    describe('Initialization', () => {
        test('should initialize with correct default values', () => {
            expect(musicBufferManager.buffers).toBeInstanceOf(Map);
            expect(musicBufferManager.loadingQueue).toEqual([]);
            expect(musicBufferManager.memoryThreshold).toBe(50 * 1024 * 1024);
            expect(musicBufferManager.preloadStrategy).toBe('selective');
            expect(musicBufferManager.performanceMonitor).toBe(mockPerformanceMonitor);
        });

        test('should start cleanup interval', () => {
            expect(musicBufferManager.cleanupInterval).not.toBeNull();
        });
    });

    describe('Buffer Management', () => {
        test('should register a buffer correctly', () => {
            const trackId = 'test-track';
            const mockBuffer = createMockAudioBuffer();
            const metadata = { custom: 'data' };

            musicBufferManager.registerBuffer(trackId, mockBuffer, metadata);

            expect(musicBufferManager.hasBuffer(trackId)).toBe(true);
            const info = musicBufferManager.getBufferInfo(trackId);
            expect(info).toBeDefined();
            expect(info.metadata.custom).toBe('data');
            expect(info.metadata.duration).toBe(1); // 44100/44100
            expect(mockPerformanceMonitor.recordLoadingComplete).toHaveBeenCalledWith(
                trackId,
                true,
                mockBuffer
            );
        });

        test('should calculate buffer size correctly', () => {
            const trackId = 'test-track';
            // 2 channels * 1000 length * 4 bytes
            const mockBuffer = createMockAudioBuffer({ numberOfChannels: 2, length: 1000 });

            musicBufferManager.registerBuffer(trackId, mockBuffer);
            const info = musicBufferManager.getBufferInfo(trackId);

            expect(info.size).toBe(2 * 1000 * 4);
        });

        test('should retrieve a buffer and update access stats', () => {
            const trackId = 'test-track';
            const mockBuffer = createMockAudioBuffer();
            musicBufferManager.registerBuffer(trackId, mockBuffer);

            const initialAccessTime = musicBufferManager.getBufferInfo(trackId).lastAccessed;

            // Advance time
            jest.advanceTimersByTime(1000);

            const buffer = musicBufferManager.getBuffer(trackId);
            const newInfo = musicBufferManager.getBufferInfo(trackId);

            expect(buffer).toBe(mockBuffer);
            expect(newInfo.accessCount).toBe(1);
            expect(newInfo.lastAccessed).toBeGreaterThan(initialAccessTime);
        });

        test('should return null for non-existent buffer', () => {
            expect(musicBufferManager.getBuffer('non-existent')).toBeNull();
            expect(musicBufferManager.getBufferInfo('non-existent')).toBeNull();
        });

        test('should remove a buffer', () => {
            const trackId = 'test-track';
            const mockBuffer = createMockAudioBuffer();
            musicBufferManager.registerBuffer(trackId, mockBuffer);

            const removed = musicBufferManager.removeBuffer(trackId);

            expect(removed).toBe(true);
            expect(musicBufferManager.hasBuffer(trackId)).toBe(false);
            expect(logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Removed audio buffer')
            );
        });
    });

    describe('Memory Management', () => {
        test('should calculate total memory usage', () => {
            const buffer1 = createMockAudioBuffer({ length: 1000 }); // 8000 bytes
            const buffer2 = createMockAudioBuffer({ length: 2000 }); // 16000 bytes

            musicBufferManager.registerBuffer('track1', buffer1);
            musicBufferManager.registerBuffer('track2', buffer2);

            const usage = musicBufferManager.getMemoryUsage();

            expect(usage.totalSize).toBe(24000);
            expect(usage.bufferCount).toBe(2);
        });

        test('should perform cleanup based on age', () => {
            const trackId = 'old-track';
            const mockBuffer = createMockAudioBuffer();
            musicBufferManager.registerBuffer(trackId, mockBuffer);

            // simulate access to meet minAccessCount = 1 (default)
            musicBufferManager.getBuffer(trackId);

            // Advance time past maxAge (default 30 mins)
            jest.advanceTimersByTime(31 * 60 * 1000);

            const result = musicBufferManager.performCleanup();

            expect(result.removedBuffers).toHaveLength(1);
            expect(result.removedBuffers[0].trackId).toBe(trackId);
            expect(musicBufferManager.hasBuffer(trackId)).toBe(false);
        });

        test('should perform cleanup when memory threshold exceeded', () => {
            // 50MB threshold
            const largeBuffer = createMockAudioBuffer({ length: 7000000 }); // ~56MB

            // Verify log on threshold check
            musicBufferManager.registerBuffer('large-track', largeBuffer);
            expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('exceeds threshold'));

            // Add an older buffer to be cleaned up
            const oldBuffer = createMockAudioBuffer({ length: 100 });
            musicBufferManager.registerBuffer('old-victim', oldBuffer);

            // Advance time to satisfy maxAge/2 requirement (default maxAge=15min in _checkMemoryUsage -> 7.5min)
            jest.advanceTimersByTime(8 * 60 * 1000);

            const result = musicBufferManager.performCleanup({
                maxAge: 15 * 60 * 1000,
                forceCleanup: false,
            });

            // old-victim is 8 mins old > 7.5 mins. Current memory > threshold.
            expect(musicBufferManager.hasBuffer('old-victim')).toBe(false);
        });

        test('should force cleanup', () => {
            const trackId = 'track';
            musicBufferManager.registerBuffer(trackId, createMockAudioBuffer());

            const result = musicBufferManager.performCleanup({ forceCleanup: true });

            expect(result.removedBuffers).toHaveLength(1);
            expect(musicBufferManager.hasBuffer(trackId)).toBe(false);
        });

        test('should set memory threshold', () => {
            musicBufferManager.setMemoryThreshold(20 * 1024 * 1024);
            expect(musicBufferManager.memoryThreshold).toBe(20 * 1024 * 1024);
            expect(logger.info).toHaveBeenCalledWith(
                expect.stringContaining('memory threshold set')
            );
        });
    });

    describe('Optimization Strategies', () => {
        let originalPerformance;
        let originalNavigator;

        beforeEach(() => {
            originalPerformance = global.performance;
            originalNavigator = global.navigator;

            Object.defineProperty(global, 'performance', {
                value: {
                    ...originalPerformance,
                    memory: {
                        jsHeapSizeLimit: 1000 * 1024 * 1024,
                        usedJSHeapSize: 10 * 1024 * 1024,
                    },
                },
                writable: true,
            });

            Object.defineProperty(global, 'navigator', {
                value: {
                    ...originalNavigator,
                    connection: {
                        effectiveType: '4g',
                    },
                },
                writable: true,
            });
        });

        afterEach(() => {
            Object.defineProperty(global, 'performance', {
                value: originalPerformance,
                writable: true,
            });
            Object.defineProperty(global, 'navigator', {
                value: originalNavigator,
                writable: true,
            });
        });

        test('should update preload strategy', () => {
            musicBufferManager.setPreloadStrategy('on-demand');
            expect(musicBufferManager.preloadStrategy).toBe('on-demand');

            musicBufferManager.setPreloadStrategy('invalid-strategy');
            expect(logger.warn).toHaveBeenCalledWith(
                expect.stringContaining('Invalid preload strategy')
            );
            expect(musicBufferManager.preloadStrategy).toBe('on-demand');
        });

        test('should recommend strategy based on memory', () => {
            // Low memory
            global.performance.memory.jsHeapSizeLimit = 100 * 1024 * 1024;
            global.performance.memory.usedJSHeapSize = 60 * 1024 * 1024; // 40MB avail

            expect(musicBufferManager.getRecommendedPreloadStrategy()).toBe('on-demand');

            // Medium memory
            global.performance.memory.usedJSHeapSize = 20 * 1024 * 1024; // 80MB avail
            expect(musicBufferManager.getRecommendedPreloadStrategy()).toBe('selective');

            // High memory
            global.performance.memory.jsHeapSizeLimit = 1000 * 1024 * 1024;
            global.performance.memory.usedJSHeapSize = 100 * 1024 * 1024; // 900MB avail
            expect(musicBufferManager.getRecommendedPreloadStrategy()).toBe('all');
        });

        test('should recommend strategy based on connection if memory api missing', () => {
            // Remove memory from performance
            const { memory, ...perfWithoutMemory } = global.performance;
            global.performance = perfWithoutMemory;

            global.navigator.connection.effectiveType = 'slow-2g';
            expect(musicBufferManager.getRecommendedPreloadStrategy()).toBe('on-demand');

            global.navigator.connection.effectiveType = '3g';
            expect(musicBufferManager.getRecommendedPreloadStrategy()).toBe('selective');

            global.navigator.connection.effectiveType = '4g';
            expect(musicBufferManager.getRecommendedPreloadStrategy()).toBe('selective');
        });

        test('should optimize loading strategy', () => {
            musicBufferManager.setPreloadStrategy('on-demand');

            // High memory available -> should switch to 'all'
            global.performance.memory = {
                jsHeapSizeLimit: 1000 * 1024 * 1024,
                usedJSHeapSize: 100 * 1024 * 1024,
            };

            const result = musicBufferManager.optimizeLoadingStrategy();

            expect(result.optimizations.length).toBeGreaterThan(0);
            expect(musicBufferManager.preloadStrategy).toBe('all');
        });
    });

    describe('Statistics', () => {
        test('should provide valid statistics', () => {
            const trackId = 'stat-track';
            musicBufferManager.registerBuffer(trackId, createMockAudioBuffer());

            const stats = musicBufferManager.getStatistics();

            expect(stats.totalBuffers).toBe(1);
            expect(stats.memoryUsage).toBeDefined();
            expect(stats.preloadStrategy).toBeDefined();
            expect(stats.accessPatterns).toBeDefined();
            expect(stats.ageDistribution).toBeDefined();
        });
    });
});
