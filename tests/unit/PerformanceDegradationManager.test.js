/**
 * PerformanceDegradationManager test suite
 */

const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
};

jest.mock('../../src/utils/Logger.js', () => ({
    createLogger: jest.fn(() => mockLogger),
    logger: mockLogger,
}));

const {
    PerformanceDegradationManager,
} = require('../../src/utils/PerformanceDegradationManager.js');

describe('PerformanceDegradationManager', () => {
    let degradationManager;
    let mockDetector;
    let mockMonitor;
    let mockCameraEffectsManager;
    let mockMotionBlurController;
    let mockShakeController;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();

        // Mock dependencies
        mockDetector = {
            detect: jest.fn().mockReturnValue({
                webglSupported: true,
                postProcessingSupported: true,
                isLowEndDevice: false,
                gpuTier: 'high',
            }),
            getSummary: jest.fn().mockReturnValue({}),
            capabilities: {
                webglSupported: true,
                postProcessingSupported: true,
            },
        };

        mockMonitor = {
            reset: jest.fn(),
            update: jest.fn(),
            cleanup: jest.fn(),
            getPerformanceMetrics: jest.fn().mockReturnValue({
                currentFPS: 60,
                frameCount: 100,
                consecutivePoorFrames: 0,
                consecutiveGoodFrames: 0,
            }),
        };

        mockCameraEffectsManager = {
            setEnabled: jest.fn(),
        };

        mockMotionBlurController = {
            setEnabled: jest.fn(),
            setQuality: jest.fn(),
            resetPerformanceMetrics: jest.fn(),
        };

        mockShakeController = {
            setEnabled: jest.fn(),
        };

        // Create instance with mocked dependencies
        degradationManager = new PerformanceDegradationManager(mockDetector, mockMonitor);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('Initialization', () => {
        it('should initialize successfully with valid capabilities', () => {
            const success = degradationManager.initialize(
                mockCameraEffectsManager,
                mockMotionBlurController,
                mockShakeController
            );

            expect(success).toBe(true);
            expect(mockDetector.detect).toHaveBeenCalled();
            expect(mockMonitor.reset).toHaveBeenCalled();
            expect(degradationManager.degradationState.currentLevel).toBe(0);
        });

        it('should start with degradation on low-end devices', () => {
            mockDetector.detect.mockReturnValue({
                webglSupported: true,
                postProcessingSupported: true,
                isLowEndDevice: true,
                gpuTier: 'low',
            });

            degradationManager.initialize(
                mockCameraEffectsManager,
                mockMotionBlurController,
                mockShakeController
            );
            expect(degradationManager.degradationState.currentLevel).toBe(1);
        });

        it('should fallback if WebGL is unsupported', () => {
            mockDetector.detect.mockReturnValue({
                webglSupported: false,
            });

            degradationManager.initialize(
                mockCameraEffectsManager,
                mockMotionBlurController,
                mockShakeController
            );
            expect(degradationManager.degradationState.currentLevel).toBe(3);
        });
    });

    describe('Performance Monitoring & Adjustment', () => {
        beforeEach(() => {
            degradationManager.initialize(
                mockCameraEffectsManager,
                mockMotionBlurController,
                mockShakeController
            );
        });

        it('should NOT update external monitor metrics', () => {
            degradationManager.update(0.016);
            expect(mockMonitor.update).not.toHaveBeenCalled();
        });

        it('should trigger degradation on poor performance', () => {
            // Setup poor performance
            mockMonitor.getPerformanceMetrics.mockReturnValue({
                currentFPS: 20,
                frameCount: 100,
                consecutivePoorFrames: 31, // > 30 threshold
                consecutiveGoodFrames: 0,
            });

            // Advance time to bypass cooldown
            degradationManager.lastQualityAdjustment = 0;

            degradationManager.update(0.016);

            expect(degradationManager.degradationState.currentLevel).toBe(1);
            expect(mockCameraEffectsManager.setEnabled).toHaveBeenCalled();
        });

        it('should trigger recovery on good performance', () => {
            // First degrade to level 1
            degradationManager.setDegradationLevel(1);

            // Setup good performance
            mockMonitor.getPerformanceMetrics.mockReturnValue({
                currentFPS: 60,
                frameCount: 200,
                consecutivePoorFrames: 0,
                consecutiveGoodFrames: 121, // > 120 threshold
            });

            degradationManager.lastQualityAdjustment = 0;
            degradationManager.update(0.016);

            expect(degradationManager.degradationState.currentLevel).toBe(0);
        });

        it('should respect cooldown period', () => {
            // Trigger first change
            degradationManager.setDegradationLevel(1);
            degradationManager.lastQualityAdjustment = Date.now();

            // Try to trigger recovery immediately
            mockMonitor.getPerformanceMetrics.mockReturnValue({
                currentFPS: 60,
                frameCount: 200,
                consecutivePoorFrames: 0,
                consecutiveGoodFrames: 200,
            });

            degradationManager.update(0.016);
            expect(degradationManager.degradationState.currentLevel).toBe(1);
        });
    });

    describe('Degradation State Management', () => {
        beforeEach(() => {
            degradationManager.initialize(
                mockCameraEffectsManager,
                mockMotionBlurController,
                mockShakeController
            );
        });

        it('should apply level 1 settings (Reduced Quality)', () => {
            degradationManager.setDegradationLevel(1);
            expect(degradationManager.degradationState.qualityLevel).toBe('medium');
            expect(mockMotionBlurController.setQuality).toHaveBeenCalledWith('medium');
            expect(mockMotionBlurController.setEnabled).toHaveBeenCalledWith(true);
        });

        it('should apply level 2 settings (No Motion Blur)', () => {
            degradationManager.setDegradationLevel(2);
            expect(mockMotionBlurController.setEnabled).toHaveBeenCalledWith(false);
            expect(mockShakeController.setEnabled).toHaveBeenCalledWith(true);
        });

        it('should apply level 3 settings (Disabled)', () => {
            degradationManager.setDegradationLevel(3);
            expect(mockCameraEffectsManager.setEnabled).toHaveBeenCalledWith(false); // Likely implied or handled
            // check state
            expect(degradationManager.degradationState.effectsEnabled).toBe(false);
        });

        it('should invoke callbacks on change', () => {
            const onDegrade = jest.fn();
            degradationManager.setOnDegradation(onDegrade);

            degradationManager.setDegradationLevel(1);
            expect(onDegrade).toHaveBeenCalledWith('degrade', expect.any(Object));
        });
    });

    describe('Memory Cleanup', () => {
        it('should trigger cleanup on components', () => {
            degradationManager.initialize(
                mockCameraEffectsManager,
                mockMotionBlurController,
                mockShakeController
            );
            degradationManager.triggerMemoryCleanup();

            expect(mockMotionBlurController.resetPerformanceMetrics).toHaveBeenCalled();
            expect(mockMonitor.cleanup).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should escalate errors to fallback', () => {
            degradationManager.initialize(
                mockCameraEffectsManager,
                mockMotionBlurController,
                mockShakeController
            );

            const error = new Error('Test Error');
            // Trigger max errors (3)
            degradationManager.handleError('webgl', error);
            jest.advanceTimersByTime(5001);
            degradationManager.handleError('webgl', error);
            jest.advanceTimersByTime(5001);
            degradationManager.handleError('webgl', error);
            jest.advanceTimersByTime(5001);
            degradationManager.handleError('webgl', error);

            expect(degradationManager.degradationState.currentLevel).toBe(3);
        });
    });

    describe('Notifications', () => {
        it('should queue and process notifications', () => {
            const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
            degradationManager.queueNotification('warning', 'test');
            degradationManager.processNotificationQueue();
            expect(dispatchSpy).toHaveBeenCalled();
        });
    });
});
