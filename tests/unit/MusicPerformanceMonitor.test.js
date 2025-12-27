/**
 * Tests for MusicPerformanceMonitor class
 * Verifies performance tracking, memory monitoring, and optimization recommendations
 */

const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
};

const MockLoggerClass = jest.fn().mockImplementation(() => mockLogger);
MockLoggerClass.create = jest.fn((namespace) => mockLogger);

jest.mock('@/utils/Logger.js', () => ({
    Logger: MockLoggerClass,
    logger: mockLogger,
    createLogger: jest.fn(() => mockLogger),
}));

const { MusicPerformanceMonitor } = require('@/audio/MusicPerformanceMonitor.js');

// Mock performance API
global.performance = {
    now: jest.fn(() => Date.now()),
    memory: {
        usedJSHeapSize: 50 * 1024 * 1024, // 50MB
        totalJSHeapSize: 100 * 1024 * 1024, // 100MB
        jsHeapSizeLimit: 2 * 1024 * 1024 * 1024, // 2GB
    },
};

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
    setTimeout(callback, 16); // ~60fps
    return 1;
});

global.cancelAnimationFrame = jest.fn();

// Mock PerformanceObserver
global.PerformanceObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    disconnect: jest.fn(),
}));

describe('MusicPerformanceMonitor', () => {
    let monitor;

    beforeEach(() => {
        jest.clearAllMocks();
        monitor = new MusicPerformanceMonitor();
    });

    afterEach(() => {
        if (monitor) {
            monitor.cleanup();
        }
    });

    describe('constructor', () => {
        it('should initialize with default metrics', () => {
            expect(monitor.metrics.memory.audioBuffers).toBe(0);
            expect(monitor.metrics.loading.totalTracks).toBe(0);
            expect(monitor.metrics.playback.fadeOperations).toBe(0);
            expect(monitor.metrics.frameRate.baseline).toBe(0);
        });
    });

    describe('monitoring control', () => {
        it('should start monitoring successfully', () => {
            monitor.startMonitoring();

            // Check that monitoring was started (interval may not be exposed)
            expect(requestAnimationFrame).toHaveBeenCalled();
        });

        it('should stop monitoring successfully', () => {
            monitor.startMonitoring();
            monitor.stopMonitoring();

            expect(cancelAnimationFrame).toHaveBeenCalled();
        });
    });

    describe('loading performance tracking', () => {
        it('should record loading start', () => {
            monitor.recordLoadingStart('test-track', 1024 * 1024); // 1MB

            expect(monitor.metrics.loading.totalTracks).toBe(1);
            expect(monitor.metrics.loading.loadTimes).toHaveLength(1);
            expect(monitor.metrics.loading.loadTimes[0].trackId).toBe('test-track');
            expect(monitor.metrics.loading.loadTimes[0].fileSize).toBe(1024 * 1024);
        });

        it('should record successful loading completion', () => {
            const mockAudioBuffer = {
                duration: 120,
                numberOfChannels: 2,
                length: 5292000,
            };

            monitor.recordLoadingStart('test-track', 1024 * 1024);
            monitor.recordLoadingComplete('test-track', true, mockAudioBuffer);

            expect(monitor.metrics.loading.loadedTracks).toBe(1);
            expect(monitor.metrics.loading.failedTracks).toBe(0);
            expect(monitor.metrics.memory.audioBuffers).toBe(1);
            expect(monitor.metrics.memory.totalAllocated).toBeGreaterThan(0);
        });

        it('should record failed loading completion', () => {
            monitor.recordLoadingStart('test-track', 1024 * 1024);
            monitor.recordLoadingComplete('test-track', false);

            expect(monitor.metrics.loading.loadedTracks).toBe(0);
            expect(monitor.metrics.loading.failedTracks).toBe(1);
            expect(monitor.metrics.memory.audioBuffers).toBe(0);
        });

        it('should calculate average load time', () => {
            // Mock performance.now to return predictable values
            let timeCounter = 0;
            const originalNow = performance.now;
            performance.now = jest.fn(() => {
                timeCounter += 1000; // 1 second increments
                return timeCounter;
            });

            monitor.recordLoadingStart('track1');
            monitor.recordLoadingComplete('track1', true);

            monitor.recordLoadingStart('track2');
            monitor.recordLoadingComplete('track2', true);

            expect(monitor.metrics.loading.averageLoadTime).toBe(1000);

            // Restore original function
            performance.now = originalNow;
        });
    });

    describe('playback operation tracking', () => {
        it('should record fade operations', () => {
            monitor.recordFadeOperation('in', 0.5);
            monitor.recordFadeOperation('out', 1.0);

            expect(monitor.metrics.playback.fadeOperations).toBe(2);
        });

        it('should warn about excessive fade operations', () => {
            // Record more than the maximum allowed concurrent fades
            for (let i = 0; i < 5; i++) {
                monitor.recordFadeOperation('in', 0.5);
            }

            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.stringContaining('High number of concurrent fade operations'),
                { count: 5 }
            );
        });

        it('should record ducking operations', () => {
            monitor.recordDuckingOperation(0.3, 0.2);
            monitor.recordDuckingOperation(0.5, 0.1);

            expect(monitor.metrics.playback.duckingOperations).toBe(2);
        });

        it('should record context switches', () => {
            monitor.recordContextSwitch();
            monitor.recordContextSwitch();

            expect(monitor.metrics.playback.contextSwitches).toBe(2);
        });

        it('should warn about frequent context switches', () => {
            // Record more than 5 context switches
            for (let i = 0; i < 6; i++) {
                monitor.recordContextSwitch();
            }

            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.stringContaining('Frequent audio context switches')
            );
        });
    });

    describe('memory usage tracking', () => {
        it('should calculate audio buffer memory usage', () => {
            const mockAudioBuffer = {
                duration: 60,
                numberOfChannels: 2,
                length: 2646000, // 60 seconds at 44.1kHz
            };

            monitor.recordLoadingStart('test-track');
            monitor.recordLoadingComplete('test-track', true, mockAudioBuffer);

            const memoryUsage = monitor.getMemoryUsage();

            expect(memoryUsage.audioBuffers).toBe(1);
            expect(memoryUsage.totalAllocated).toBe(2646000 * 2 * 4); // channels * length * 4 bytes
            expect(memoryUsage.peakUsage).toBe(memoryUsage.totalAllocated);
        });

        it('should track peak memory usage', () => {
            const buffer1 = { numberOfChannels: 2, length: 1000000 };
            const buffer2 = { numberOfChannels: 2, length: 2000000 };

            monitor.recordLoadingComplete('track1', true, buffer1);
            const firstUsage = monitor.getMemoryUsage().totalAllocated;

            monitor.recordLoadingComplete('track2', true, buffer2);
            const secondUsage = monitor.getMemoryUsage().totalAllocated;

            expect(monitor.getMemoryUsage().peakUsage).toBe(secondUsage);
            expect(secondUsage).toBeGreaterThanOrEqual(firstUsage);
        });
    });

    describe('performance metrics', () => {
        it('should provide comprehensive metrics', () => {
            monitor.recordLoadingStart('test-track');
            monitor.recordLoadingComplete('test-track', true);
            monitor.recordFadeOperation('in', 0.5);

            const metrics = monitor.getMetrics();

            expect(metrics).toHaveProperty('memory');
            expect(metrics).toHaveProperty('loading');
            expect(metrics).toHaveProperty('playback');
            expect(metrics).toHaveProperty('frameRate');
            expect(metrics).toHaveProperty('timestamp');
            expect(metrics).toHaveProperty('recommendations');
        });

        it('should provide loading performance summary', () => {
            monitor.recordLoadingStart('track1');
            monitor.recordLoadingComplete('track1', true);
            monitor.recordLoadingStart('track2');
            monitor.recordLoadingComplete('track2', false);

            const loadingPerf = monitor.getLoadingPerformance();

            expect(loadingPerf.totalTracks).toBe(2);
            expect(loadingPerf.loadedTracks).toBe(1);
            expect(loadingPerf.failedTracks).toBe(1);
            expect(loadingPerf.successRate).toBe(50);
        });

        it('should provide frame rate impact assessment', () => {
            monitor._recordFrameRate(60); // Set baseline
            monitor._recordFrameRate(45); // Simulate drop

            const frameRateImpact = monitor.getFrameRateImpact();

            expect(frameRateImpact.baseline).toBe(60);
            expect(frameRateImpact.current).toBe(45);
            expect(frameRateImpact.impactDetected).toBe(true);
            expect(frameRateImpact.impactPercentage).toBe(25);
        });
    });

    describe('optimization recommendations', () => {
        it('should recommend memory cleanup when threshold exceeded', () => {
            // Force high memory usage
            monitor.metrics.memory.totalAllocated = 60 * 1024 * 1024; // 60MB
            monitor.metrics.memory.lastCleanup = Date.now() - 40 * 60 * 1000; // 40 minutes ago

            const recommendations = monitor.getOptimizationRecommendations();

            expect(recommendations).toContainEqual(
                expect.objectContaining({
                    type: 'memory',
                    action: 'cleanup_buffers',
                })
            );
        });

        it('should recommend file optimization for slow loading', () => {
            monitor.metrics.loading.averageLoadTime = 6000; // 6 seconds

            const recommendations = monitor.getOptimizationRecommendations();

            expect(recommendations).toContainEqual(
                expect.objectContaining({
                    type: 'loading',
                    action: 'optimize_files',
                })
            );
        });

        it('should recommend complexity reduction for frame rate impact', () => {
            monitor.metrics.frameRate.impactDetected = true;

            const recommendations = monitor.getOptimizationRecommendations();

            expect(recommendations).toContainEqual(
                expect.objectContaining({
                    type: 'performance',
                    action: 'reduce_complexity',
                })
            );
        });

        it('should recommend context handling fixes for frequent switches', () => {
            monitor.metrics.playback.contextSwitches = 5;

            const recommendations = monitor.getOptimizationRecommendations();

            expect(recommendations).toContainEqual(
                expect.objectContaining({
                    type: 'stability',
                    action: 'fix_context_handling',
                })
            );
        });

        it('should recommend reliability improvements for high failure rate', () => {
            monitor.metrics.loading.totalTracks = 10;
            monitor.metrics.loading.failedTracks = 3; // 30% failure rate

            const recommendations = monitor.getOptimizationRecommendations();

            expect(recommendations).toContainEqual(
                expect.objectContaining({
                    type: 'reliability',
                    action: 'improve_reliability',
                })
            );
        });
    });

    describe('memory cleanup', () => {
        it('should perform memory cleanup', () => {
            monitor.metrics.memory.totalAllocated = 50 * 1024 * 1024; // 50MB

            const cleanupResult = monitor.performMemoryCleanup();

            expect(cleanupResult).toHaveProperty('freedMemory');
            expect(cleanupResult).toHaveProperty('beforeCleanup');
            expect(cleanupResult).toHaveProperty('afterCleanup');
            expect(cleanupResult).toHaveProperty('timestamp');
            expect(monitor.metrics.memory.lastCleanup).toBeGreaterThan(0);
        });
    });

    describe('optimization needs assessment', () => {
        it('should detect when optimization is needed', () => {
            // Create conditions that require optimization
            monitor.metrics.memory.totalAllocated = 60 * 1024 * 1024; // High memory usage
            monitor.metrics.memory.lastCleanup = Date.now() - 40 * 60 * 1000; // Old cleanup

            expect(monitor.needsOptimization()).toBe(true);
        });

        it('should detect when optimization is not needed', () => {
            // Keep default low values
            expect(monitor.needsOptimization()).toBe(false);
        });
    });

    describe('metrics reset', () => {
        it('should reset all metrics to initial state', () => {
            // Add some data
            monitor.recordLoadingStart('test-track');
            monitor.recordFadeOperation('in', 0.5);
            monitor.recordContextSwitch();

            monitor.resetMetrics();

            expect(monitor.metrics.memory.audioBuffers).toBe(0);
            expect(monitor.metrics.loading.totalTracks).toBe(0);
            expect(monitor.metrics.playback.fadeOperations).toBe(0);
            expect(monitor.metrics.frameRate.baseline).toBe(0);
        });
    });

    describe('frame rate monitoring', () => {
        it('should detect significant frame rate impact', () => {
            monitor._recordFrameRate(60); // Set baseline
            monitor._recordFrameRate(40); // Significant drop

            expect(monitor.metrics.frameRate.impactDetected).toBe(true);
            expect(monitor._calculateFrameRateImpact()).toBeCloseTo(33.33, 1);
        });

        it('should not detect minor frame rate variations', () => {
            monitor._recordFrameRate(60); // Set baseline
            monitor._recordFrameRate(58); // Minor drop

            expect(monitor.metrics.frameRate.impactDetected).toBe(false);
            expect(monitor._calculateFrameRateImpact()).toBeCloseTo(3.33, 1);
        });

        it('should provide appropriate frame rate recommendations', () => {
            monitor._recordFrameRate(60);
            monitor._recordFrameRate(30); // 50% drop

            const recommendation = monitor._getFrameRateRecommendation();

            expect(recommendation).toContain('Significant frame rate impact');
        });
    });

    describe('cleanup', () => {
        it('should clean up all monitoring resources', () => {
            monitor.startMonitoring();
            monitor.cleanup();

            expect(cancelAnimationFrame).toHaveBeenCalled();
        });
    });
});
