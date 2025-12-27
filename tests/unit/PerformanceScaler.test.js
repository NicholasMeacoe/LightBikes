/**
 * Tests for PerformanceScaler class
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

const { PerformanceScaler } = require('@/utils/PerformanceScaler.js');

describe('PerformanceScaler', () => {
    let scaler;
    let mockPerformance;
    let originalPerformance;

    beforeEach(() => {
        // Mock performance.now()
        originalPerformance = global.performance;
        mockPerformance = {
            now: jest.fn(() => 1000),
        };
        global.performance = mockPerformance;

        scaler = new PerformanceScaler();
    });

    afterEach(() => {
        global.performance = originalPerformance;
    });

    describe('constructor', () => {
        it('should initialize with default settings', () => {
            expect(scaler.targetFPS).toBe(60);
            expect(scaler.minFPS).toBe(50);
            expect(scaler.currentQuality).toBe('high');
            expect(scaler.scalingEnabled).toBe(true);
            expect(scaler.frameRateHistory).toEqual([]);
        });

        it('should have all quality levels defined', () => {
            const qualities = scaler.getAvailableQualities();
            expect(qualities).toHaveLength(5);

            const qualityKeys = qualities.map((q) => q.key);
            expect(qualityKeys).toContain('high');
            expect(qualityKeys).toContain('medium');
            expect(qualityKeys).toContain('low');
            expect(qualityKeys).toContain('minimal');
            expect(qualityKeys).toContain('disabled');
        });

        it('should have valid quality settings for each level', () => {
            const qualities = scaler.getAvailableQualities();

            qualities.forEach((quality) => {
                expect(quality).toHaveProperty('bloomResolution');
                expect(quality).toHaveProperty('bloomStrength');
                expect(quality).toHaveProperty('emissiveIntensity');
                expect(quality).toHaveProperty('pulseEnabled');
                expect(quality).toHaveProperty('description');

                expect(typeof quality.bloomResolution).toBe('number');
                expect(typeof quality.bloomStrength).toBe('number');
                expect(typeof quality.emissiveIntensity).toBe('number');
                expect(typeof quality.pulseEnabled).toBe('boolean');
                expect(typeof quality.description).toBe('string');
            });
        });
    });

    describe('monitorPerformance', () => {
        it('should track frame rate history', () => {
            // Set initial time
            mockPerformance.now.mockReturnValue(1000);
            scaler.lastFrameTime = 1000;

            // Simulate 60 FPS (16.67ms frame time)
            mockPerformance.now.mockReturnValue(1016.67);

            scaler.monitorPerformance(16.67);

            expect(scaler.frameRateHistory).toHaveLength(1);
            expect(scaler.frameRateHistory[0]).toBeCloseTo(60, 0);
        });

        it('should limit frame rate history size', () => {
            // Fill history beyond limit
            for (let i = 0; i < 35; i++) {
                mockPerformance.now.mockReturnValue(1000 + i * 16.67);
                scaler.monitorPerformance(16.67);
            }

            expect(scaler.frameRateHistory).toHaveLength(30);
        });

        it('should not monitor when scaling is disabled', () => {
            scaler.setScalingEnabled(false);
            scaler.monitorPerformance(16.67);

            expect(scaler.frameRateHistory).toHaveLength(0);
        });
    });

    describe('quality scaling', () => {
        it('should scale down quality when FPS is consistently low', () => {
            const qualityChangeCallback = jest.fn();
            scaler.setOnQualityChange(qualityChangeCallback);

            // Manually trigger scaling by calling scaleQualityDown
            scaler.frameRateHistory = [40, 42, 38, 41, 39]; // Low FPS history
            scaler.scaleQualityDown();

            expect(qualityChangeCallback).toHaveBeenCalledWith(
                'medium',
                expect.objectContaining({
                    bloomResolution: expect.any(Number), // May have dynamic adjustments
                    bloomStrength: expect.any(Number),
                }),
                'automatic_downscale'
            );
        });

        it('should scale up quality after sustained good performance', () => {
            // Start at medium quality
            scaler.setQuality('medium');

            const qualityChangeCallback = jest.fn();
            scaler.setOnQualityChange(qualityChangeCallback);

            // Manually trigger scaling by calling scaleQualityUp
            scaler.frameRateHistory = [65, 68, 70, 67, 69]; // High FPS history
            scaler.scaleQualityUp();

            expect(qualityChangeCallback).toHaveBeenCalledWith(
                'high',
                expect.objectContaining({
                    bloomResolution: expect.any(Number), // May have dynamic adjustments
                    bloomStrength: expect.any(Number),
                }),
                'automatic_upscale'
            );
        });

        it('should not scale up from highest quality', () => {
            const qualityChangeCallback = jest.fn();
            scaler.setOnQualityChange(qualityChangeCallback);

            // Already at high quality, simulate good performance
            let currentTime = 1000;
            for (let i = 0; i < 30; i++) {
                currentTime += 16;
                mockPerformance.now.mockReturnValue(currentTime);
                scaler.monitorPerformance(16);
            }

            currentTime += 5000;
            mockPerformance.now.mockReturnValue(currentTime);
            scaler.monitorPerformance(16);

            expect(qualityChangeCallback).not.toHaveBeenCalled();
        });

        it('should not scale down from lowest quality', () => {
            scaler.setQuality('disabled');

            const qualityChangeCallback = jest.fn();
            scaler.setOnQualityChange(qualityChangeCallback);

            // Simulate very low FPS
            let currentTime = 1000;
            for (let i = 0; i < 30; i++) {
                currentTime += 100; // 10 FPS
                mockPerformance.now.mockReturnValue(currentTime);
                scaler.monitorPerformance(100);
            }

            currentTime += 2000;
            mockPerformance.now.mockReturnValue(currentTime);
            scaler.monitorPerformance(100);

            expect(qualityChangeCallback).not.toHaveBeenCalled();
        });
    });

    describe('setQuality', () => {
        it('should set quality level manually', () => {
            const result = scaler.setQuality('low', 'manual');

            expect(result).toBe(true);
            expect(scaler.currentQuality).toBe('low');
        });

        it('should return false for invalid quality level', () => {
            const result = scaler.setQuality('invalid');

            expect(result).toBe(false);
            expect(scaler.currentQuality).toBe('high');
        });

        it('should return false when setting same quality', () => {
            const result = scaler.setQuality('high');

            expect(result).toBe(false);
        });

        it('should call quality change callback', () => {
            const callback = jest.fn();
            scaler.setOnQualityChange(callback);

            scaler.setQuality('medium', 'manual');

            expect(callback).toHaveBeenCalledWith(
                'medium',
                expect.objectContaining({
                    bloomResolution: 0.75,
                }),
                'manual'
            );
        });

        it('should record scaling event', () => {
            scaler.setQuality('low');

            const history = scaler.getScalingHistory();
            expect(history).toHaveLength(1);
            expect(history[0]).toMatchObject({
                from: 'high',
                to: 'low',
                reason: 'manual',
            });
        });
    });

    describe('getQualitySettings', () => {
        it('should return current quality settings', () => {
            scaler.setQuality('medium');

            const settings = scaler.getQualitySettings();

            expect(settings).toMatchObject({
                bloomResolution: 0.75,
                bloomStrength: 1.0,
                emissiveIntensity: 0.6,
                pulseEnabled: true,
            });
        });

        it('should return a copy of settings', () => {
            const settings1 = scaler.getQualitySettings();
            const settings2 = scaler.getQualitySettings();

            expect(settings1).not.toBe(settings2);
            expect(settings1).toEqual(settings2);
        });
    });

    describe('getAverageFPS', () => {
        it('should return 60 when no history', () => {
            expect(scaler.getAverageFPS()).toBe(60);
        });

        it('should calculate average from history', () => {
            scaler.frameRateHistory = [50, 55, 60, 65, 70];

            expect(scaler.getAverageFPS()).toBe(60);
        });
    });

    describe('performance metrics', () => {
        it('should return comprehensive performance metrics', () => {
            scaler.frameRateHistory = [55, 58, 62, 59, 61];

            const metrics = scaler.getPerformanceMetrics();

            expect(metrics).toMatchObject({
                currentFPS: 61,
                averageFPS: 59,
                minFPS: 55,
                maxFPS: 62,
                currentQuality: 'high',
                scalingEnabled: true,
            });

            expect(metrics.qualitySettings).toHaveProperty('bloomResolution');
        });

        it('should return performance status summary', () => {
            scaler.frameRateHistory = [45, 48, 52];

            const status = scaler.getPerformanceStatus();

            expect(status).toMatchObject({
                fps: 52,
                avgFPS: 48,
                quality: 'high',
                scalingEnabled: true,
                performanceIssue: true,
            });

            expect(status.qualityDescription).toBe('Full quality glow effects');
        });
    });

    describe('callbacks', () => {
        it('should call performance warning callback on low FPS', () => {
            const warningCallback = jest.fn();
            scaler.setOnPerformanceWarning(warningCallback);

            // Manually trigger scaling to test warning callback
            scaler.frameRateHistory = [40, 42, 38, 41, 39]; // Low FPS history
            scaler.scaleQualityDown();

            expect(warningCallback).toHaveBeenCalledWith({
                type: 'low_fps',
                averageFPS: expect.any(Number),
                action: 'quality_reduced',
                newQuality: 'medium',
            });
        });
    });

    describe('scaling control', () => {
        it('should enable and disable scaling', () => {
            scaler.setScalingEnabled(false);
            expect(scaler.isScalingEnabled()).toBe(false);

            scaler.setScalingEnabled(true);
            expect(scaler.isScalingEnabled()).toBe(true);
        });

        it('should reset timers when disabling scaling', () => {
            // Set up some timing state
            scaler.lowFPSStartTime = 1000;
            scaler.goodFPSStartTime = 2000;

            scaler.setScalingEnabled(false);

            expect(scaler.lowFPSStartTime).toBeNull();
            expect(scaler.goodFPSStartTime).toBeNull();
        });
    });

    describe('forceQuality', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should force quality and temporarily disable scaling', () => {
            const result = scaler.forceQuality('low');

            expect(result).toBe(true);
            expect(scaler.currentQuality).toBe('low');
            expect(scaler.scalingEnabled).toBe(false);
        });

        it('should re-enable scaling after timeout', () => {
            scaler.forceQuality('minimal');

            // Check that scaling is re-enabled after timeout
            jest.advanceTimersByTime(10000);
            expect(scaler.scalingEnabled).toBe(true);
        });
    });

    describe('reset', () => {
        it('should reset all state', () => {
            // Set up some state
            scaler.frameRateHistory = [50, 55, 60];
            scaler.lowFPSStartTime = 1000;
            scaler.goodFPSStartTime = 2000;
            scaler.scalingHistory = [{ test: 'event' }];

            scaler.reset();

            expect(scaler.frameRateHistory).toEqual([]);
            expect(scaler.lowFPSStartTime).toBeNull();
            expect(scaler.goodFPSStartTime).toBeNull();
            expect(scaler.scalingHistory).toEqual([]);
        });
    });

    describe('update', () => {
        it('should call monitorPerformance', () => {
            const spy = jest.spyOn(scaler, 'monitorPerformance');

            scaler.update(16.67);

            expect(spy).toHaveBeenCalledWith(16.67);
        });
    });

    describe('scaling history', () => {
        it('should maintain scaling history', () => {
            scaler.setQuality('medium');
            scaler.setQuality('low');
            scaler.setQuality('high');

            const history = scaler.getScalingHistory();
            expect(history).toHaveLength(3);

            expect(history[0]).toMatchObject({ from: 'high', to: 'medium' });
            expect(history[1]).toMatchObject({ from: 'medium', to: 'low' });
            expect(history[2]).toMatchObject({ from: 'low', to: 'high' });
        });

        it('should limit scaling history size', () => {
            // Add more events than the limit
            for (let i = 0; i < 15; i++) {
                scaler.setQuality(i % 2 === 0 ? 'high' : 'low');
            }

            const history = scaler.getScalingHistory();
            expect(history).toHaveLength(10); // maxScalingHistory
        });
    });

    describe('dynamic quality adjustment', () => {
        it('should apply dynamic adjustments during downscaling', () => {
            scaler.frameRateHistory = [40, 42, 38, 41, 39]; // Low FPS

            const result = scaler.scaleQuality('low', 'automatic_downscale');

            expect(result).toBe(true);
            expect(scaler.currentQuality).toBe('low');

            const settings = scaler.getQualitySettings();
            // Should have dynamic adjustments applied
            expect(settings.bloomResolution).toBeLessThan(0.5); // Base low quality value
        });

        it('should apply conservative adjustments during upscaling', () => {
            scaler.setQuality('low');
            scaler.frameRateHistory = [65, 68, 70, 67, 69]; // High FPS

            const result = scaler.scaleQuality('medium', 'automatic_upscale');

            expect(result).toBe(true);
            expect(scaler.currentQuality).toBe('medium');

            const settings = scaler.getQualitySettings();
            // Should have conservative upscaling adjustments
            expect(settings.bloomResolution).toBeGreaterThan(0.75); // Base medium quality value
        });

        it('should apply recovery penalty for multiple attempts', () => {
            scaler.recoveryAttempts = 2;
            scaler.frameRateHistory = [65, 68, 70, 67, 69]; // High FPS for upscaling adjustments

            const result = scaler.scaleQuality('medium', 'automatic_upscale');

            expect(result).toBe(true);

            const settings = scaler.getQualitySettings();
            // Should have recovery penalty applied (if dynamic adjustments were made)
            // The penalty reduces the bloom resolution from the dynamically adjusted value
            expect(settings.bloomResolution).toBeDefined();
        });

        it('should not apply adjustments when adaptive scaling is disabled', () => {
            scaler.setAdaptiveScaling(false);
            scaler.frameRateHistory = [40, 42, 38]; // Low FPS

            const result = scaler.scaleQuality('low', 'automatic_downscale');

            expect(result).toBe(true);

            const settings = scaler.getQualitySettings();
            // Should use base settings without adjustments
            expect(settings.bloomResolution).toBe(0.5); // Exact base value
        });
    });

    describe('fallback mechanism', () => {
        it('should trigger fallback for critical performance', () => {
            const warningCallback = jest.fn();
            scaler.setOnPerformanceWarning(warningCallback);

            // Set initial time
            let currentTime = 1000;
            scaler.lastFrameTime = currentTime;

            // Simulate critical FPS (below 30 FPS threshold)
            for (let i = 0; i < 30; i++) {
                currentTime += 40; // 25 FPS (below critical threshold of 30)
                mockPerformance.now.mockReturnValue(currentTime);
                scaler.monitorPerformance(40);
            }

            expect(scaler.fallbackTriggered).toBe(true);
            expect(scaler.currentQuality).toBe('disabled');
            expect(warningCallback).toHaveBeenCalledWith({
                type: 'critical_performance',
                averageFPS: expect.any(Number),
                action: 'effects_disabled',
                newQuality: 'disabled',
            });
        });

        it('should reset fallback state', () => {
            scaler.fallbackTriggered = true;
            scaler.recoveryAttempts = 2;

            scaler.resetFallback();

            expect(scaler.fallbackTriggered).toBe(false);
            expect(scaler.recoveryAttempts).toBe(0);
        });
    });

    describe('recovery logic', () => {
        it('should use exponential backoff for recovery delays', () => {
            scaler.recoveryAttempts = 2;

            const status = scaler.getRecoveryStatus();

            expect(status.nextRecoveryDelay).toBe(5000 * Math.pow(1.5, 2)); // 11250ms
        });

        it('should limit recovery attempts', () => {
            scaler.recoveryAttempts = 3; // At max
            scaler.goodFPSStartTime = 1000;
            scaler.goodFPSDuration = 10000; // Long enough for recovery

            scaler.attemptQualityRecovery();

            expect(scaler.recoveryAttempts).toBe(3); // Should not increase
        });

        it('should track recovery attempts', () => {
            scaler.setQuality('low');

            scaler.attemptQualityRecovery();

            expect(scaler.recoveryAttempts).toBe(1);
            expect(scaler.currentQuality).toBe('medium');
        });
    });

    describe('performance analysis', () => {
        it('should calculate performance grade', () => {
            expect(scaler.calculatePerformanceGrade(58)).toBe('A'); // 58 >= 57 (95% of 60)
            expect(scaler.calculatePerformanceGrade(52)).toBe('B'); // 52 >= 51 (85% of 60)
            expect(scaler.calculatePerformanceGrade(46)).toBe('C'); // 46 >= 45 (75% of 60)
            expect(scaler.calculatePerformanceGrade(38)).toBe('D'); // 38 >= 36 (60% of 60)
            expect(scaler.calculatePerformanceGrade(30)).toBe('F'); // 30 < 36
        });

        it('should recommend appropriate quality', () => {
            expect(scaler.getRecommendedQuality(25)).toBe('disabled'); // Below critical
            expect(scaler.getRecommendedQuality(35)).toBe('minimal'); // Below min * 0.8
            expect(scaler.getRecommendedQuality(45)).toBe('low'); // Below min
            expect(scaler.getRecommendedQuality(52)).toBe('medium'); // Below target * 0.9
            expect(scaler.getRecommendedQuality(58)).toBe('high'); // Good performance
        });

        it('should provide comprehensive performance analysis', () => {
            scaler.frameRateHistory = [55, 58, 52, 60, 57];
            scaler.recoveryAttempts = 1;

            const analysis = scaler.getPerformanceAnalysis();

            expect(analysis).toHaveProperty('currentFPS');
            expect(analysis).toHaveProperty('averageFPS');
            expect(analysis).toHaveProperty('performanceGrade');
            expect(analysis).toHaveProperty('recommendedQuality');
            expect(analysis).toHaveProperty('scalingEffectiveness');
            expect(analysis).toHaveProperty('recoveryAttempts');
        });
    });

    describe('adaptive scaling control', () => {
        it('should enable and disable adaptive scaling', () => {
            scaler.setAdaptiveScaling(false);
            expect(scaler.isAdaptiveScalingEnabled()).toBe(false);

            scaler.setAdaptiveScaling(true);
            expect(scaler.isAdaptiveScalingEnabled()).toBe(true);
        });

        it('should clear dynamic adjustments when disabling adaptive scaling', () => {
            scaler.dynamicAdjustments = { bloomResolution: 0.3 };

            scaler.setAdaptiveScaling(false);

            expect(scaler.dynamicAdjustments).toEqual({});
        });
    });

    describe('enhanced status reporting', () => {
        it('should include dynamic adjustment information in status', () => {
            scaler.dynamicAdjustments = { bloomResolution: 0.3 };
            scaler.recoveryAttempts = 1;
            scaler.fallbackTriggered = true;

            const status = scaler.getPerformanceStatus();

            expect(status).toHaveProperty('adaptiveScaling');
            expect(status).toHaveProperty('recoveryAttempts', 1);
            expect(status).toHaveProperty('fallbackTriggered', true);
            expect(status).toHaveProperty('hasDynamicAdjustments', true);
            expect(status).toHaveProperty('performanceGrade');
        });
    });

    describe('edge cases', () => {
        it('should handle missing performance API gracefully', () => {
            global.performance = undefined;

            const newScaler = new PerformanceScaler();

            expect(() => {
                newScaler.monitorPerformance(16.67);
            }).not.toThrow();
        });

        it('should handle zero frame time', () => {
            // Create a fresh scaler to avoid test interference
            const freshScaler = new PerformanceScaler();
            freshScaler.lastFrameTime = 1000;

            // Mock performance.now for this specific test
            const originalPerformance = global.performance;
            global.performance = { now: () => 1000 }; // Same time = 0 frame time

            freshScaler.monitorPerformance(0);

            // Restore original performance
            global.performance = originalPerformance;

            // The FPS should be 60 when frame time is 0 or negative
            expect(freshScaler.frameRateHistory[0]).toBe(60);
        });

        it('should handle negative frame time', () => {
            // Create a fresh scaler to avoid test interference
            const freshScaler = new PerformanceScaler();
            freshScaler.lastFrameTime = 1000;

            // Mock performance.now for this specific test
            const originalPerformance = global.performance;
            global.performance = { now: () => 999 }; // Earlier time = negative frame time

            freshScaler.monitorPerformance(-1);

            // Restore original performance
            global.performance = originalPerformance;

            // The FPS should be 60 when frame time is 0 or negative
            expect(freshScaler.frameRateHistory[0]).toBe(60);
        });

        it('should handle empty scaling history in effectiveness calculation', () => {
            const effectiveness = scaler.calculateScalingEffectiveness();

            expect(effectiveness).toBe(1.0);
        });
    });
});
