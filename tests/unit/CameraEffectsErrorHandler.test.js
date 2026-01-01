/**
 * CameraEffectsErrorHandler test suite
 */

jest.mock('@/utils/Logger.js', () => {
    const mockLoggerInstance = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    };
    const MockLoggerClass = jest.fn(() => mockLoggerInstance);
    MockLoggerClass.create = jest.fn(() => mockLoggerInstance);
    return {
        Logger: MockLoggerClass,
        logger: mockLoggerInstance,
        createLogger: jest.fn(() => mockLoggerInstance),
    };
});

let { logger: mockLogger } = require('@/utils/Logger.js');

describe('CameraEffectsErrorHandler', () => {
    let CameraEffectsErrorHandler;
    let errorHandler;
    let mockCameraEffectsManager,
        mockDegradationManager,
        mockMotionBlurController,
        mockShakeController;

    beforeEach(() => {
        jest.resetModules();
        jest.useFakeTimers();

        CameraEffectsErrorHandler =
            require('@/effects/CameraEffectsErrorHandler.js').CameraEffectsErrorHandler;

        mockCameraEffectsManager = {
            setEnabled: jest.fn(),
        };

        mockDegradationManager = {
            setDegradationLevel: jest.fn(),
            getDegradationState: jest.fn(() => ({ level: 0 })),
            resetPerformanceMetrics: jest.fn(),
            getStatus: jest.fn(() => ({ level: 0, effectsEnabled: true })),
        };

        mockMotionBlurController = {
            setEnabled: jest.fn(),
            setQuality: jest.fn(),
            getCurrentQuality: jest.fn(() => 'medium'),
            initialize: jest.fn(() => true),
            resetPerformanceMetrics: jest.fn(),
            getStatus: jest.fn(() => ({ quality: 'medium', enabled: true })),
        };

        mockShakeController = {
            setEnabled: jest.fn(),
            getStatus: jest.fn(() => ({ activeShakes: 0 })),
        };

        errorHandler = new CameraEffectsErrorHandler();
        errorHandler.initialize(
            mockCameraEffectsManager,
            mockDegradationManager,
            mockMotionBlurController,
            mockShakeController
        );

        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should initialize successfully', () => {
        expect(errorHandler.initialized).toBe(true);
    });

    it('should handle WebGL errors and trigger degradation', () => {
        const error = new Error('WebGL error');

        // Trigger errors
        for (let i = 0; i < 4; i++) {
            jest.advanceTimersByTime(6000); // Beyond cooldown
            errorHandler.handleWebGLError(error, 'Test context');
        }

        expect(mockDegradationManager.setDegradationLevel).toHaveBeenCalled();
    });

    it('should execute recovery strategies', () => {
        const result = errorHandler.attemptRecovery('webgl');
        expect(result).toBe(true);
    });

    it('should enter fallback mode after too many errors', () => {
        const error = new Error('Fatal error');
        for (let i = 0; i < 6; i++) {
            jest.advanceTimersByTime(6000);
            errorHandler.handleRuntimeError(error, 'context');
        }
        expect(errorHandler.getStatus().fallbackMode).toBe(true);
    });
});
