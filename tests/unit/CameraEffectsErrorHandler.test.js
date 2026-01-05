/**
 * CameraEffectsErrorHandler test suite
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

// Mock ErrorRecoveryStrategies with exposed methods for control
// Defining methods outside to ensure they persist across requires if strictly mocking
const mockMethods = {
    initialize: jest.fn(),
    getStrategiesForType: jest.fn(() => []),
    executeStrategy: jest.fn(),
    disableAllEffects: jest.fn(),
    enterFallbackMode: jest.fn(),
    disableMotionBlur: jest.fn(),
};

jest.mock('../../src/effects/ErrorRecoveryStrategies.js', () => {
    return {
        ErrorRecoveryStrategies: jest.fn().mockImplementation(() => mockMethods),
        __mockMethods: mockMethods,
    };
});

// We don't require CameraEffectsErrorHandler at top level to allow resetModules to work effectively
// const { CameraEffectsErrorHandler } = require('../../src/effects/CameraEffectsErrorHandler.js');
const { __mockMethods } = require('../../src/effects/ErrorRecoveryStrategies.js');

describe('CameraEffectsErrorHandler', () => {
    let errorHandler;
    let mockCameraEffectsManager;
    let mockDegradationManager;
    let mockMotionBlurController;
    let mockShakeController;
    let CameraEffectsErrorHandler;

    beforeEach(() => {
        jest.resetModules(); // Critical: clear cache so we get fresh module with mocks
        jest.clearAllMocks();
        jest.useFakeTimers();

        // Re-require module under test
        CameraEffectsErrorHandler =
            require('../../src/effects/CameraEffectsErrorHandler.js').CameraEffectsErrorHandler;

        // Setup mock components
        mockCameraEffectsManager = {
            setEnabled: jest.fn(),
        };

        mockDegradationManager = {
            getDegradationState: jest.fn().mockReturnValue({ level: 0 }),
            setDegradationLevel: jest.fn(),
        };

        mockMotionBlurController = {
            setEnabled: jest.fn(),
            setQuality: jest.fn(),
        };

        mockShakeController = {
            setEnabled: jest.fn(),
        };

        // Reset default mock behaviors
        __mockMethods.getStrategiesForType.mockReturnValue(['mockStrategy']);
        __mockMethods.executeStrategy.mockReturnValue(true);

        errorHandler = new CameraEffectsErrorHandler();
        errorHandler.initialize(
            mockCameraEffectsManager,
            mockDegradationManager,
            mockMotionBlurController,
            mockShakeController
        );
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('Initialization', () => {
        it('should initialize correctly', () => {
            expect(errorHandler.initialized).toBe(true);
            expect(__mockMethods.initialize).toHaveBeenCalled();
            expect(mockLogger.info).toHaveBeenCalledWith(
                'CameraEffectsErrorHandler initialized',
                expect.any(Object)
            );
        });

        it('should setup global error handlers', () => {
            const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
            errorHandler.setupGlobalErrorHandlers();
            expect(addEventListenerSpy).toHaveBeenCalledWith(
                'webglcontextlost',
                expect.any(Function),
                false
            );
            expect(addEventListenerSpy).toHaveBeenCalledWith(
                'webglcontextrestored',
                expect.any(Function),
                false
            );
            expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function), false);
        });
    });

    describe('WebGL Error Handling', () => {
        it('should handle WebGL errors', () => {
            const error = new Error('WebGL failed');
            __mockMethods.executeStrategy.mockReturnValue(true);

            errorHandler.handleWebGLError(error, 'Test context');

            expect(errorHandler.errorCounters.webgl).toBe(1);
            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('WebGL Error'),
                expect.any(Object)
            );

            expect(errorHandler.notifications.queue.length).toBeGreaterThan(0);
        });

        it('should trigger degradation on multiple WebGL errors', () => {
            const error = new Error('WebGL failed');
            for (let i = 0; i < 3; i++) {
                jest.advanceTimersByTime(6000);
                errorHandler.handleWebGLError(error, 'Test context');
            }

            expect(mockDegradationManager.setDegradationLevel).toHaveBeenCalledWith(1);
        });

        it('should enter fallback mode on many WebGL errors', () => {
            const error = new Error('WebGL failed');
            for (let i = 0; i < 5; i++) {
                jest.advanceTimersByTime(6000);
                errorHandler.handleWebGLError(error, 'Test context');
            }

            expect(__mockMethods.enterFallbackMode).toHaveBeenCalled();
        });

        it('should handle context lost event', () => {
            const event = new Event('webglcontextlost');
            event.preventDefault = jest.fn();

            errorHandler.handleWebGLContextLost(event);
            expect(event.preventDefault).toHaveBeenCalled();
            expect(mockLogger.error).toHaveBeenCalledWith('WebGL context lost', expect.any(Object));
        });

        it('should handle context restored event', () => {
            errorHandler.handleWebGLContextRestored({});
            expect(mockLogger.info).toHaveBeenCalledWith(
                'WebGL context restored',
                expect.any(Object)
            );
            expect(__mockMethods.executeStrategy).toHaveBeenCalled();
        });
    });

    describe('Post-Processing Error Handling', () => {
        it('should handle post-processing errors', () => {
            const error = new Error('PP Failed');
            errorHandler.handlePostProcessingError(error);
            expect(errorHandler.errorCounters.postProcessing).toBe(1);
        });

        it('should disable motion blur on degradation threshold', () => {
            const error = new Error('PP Failed');
            for (let i = 0; i < 3; i++) {
                jest.advanceTimersByTime(6000);
                errorHandler.handlePostProcessingError(error);
            }
            expect(__mockMethods.disableMotionBlur).toHaveBeenCalled();
        });
    });

    describe('Shader Error Handling', () => {
        it('should handle shader errors', () => {
            const error = new Error('Shader Failed');
            errorHandler.handleShaderError(error);
            expect(errorHandler.errorCounters.shader).toBe(1);
        });

        it('should disable motion blur on shader errors', () => {
            const error = new Error('Shader Failed');
            for (let i = 0; i < 3; i++) {
                jest.advanceTimersByTime(6000);
                errorHandler.handleShaderError(error);
            }
            expect(__mockMethods.disableMotionBlur).toHaveBeenCalled();
        });
    });

    describe('Memory Error Handling', () => {
        it('should handle memory errors and trigger degradation immediately', () => {
            const error = new Error('OOM');
            for (let i = 0; i < 3; i++) {
                jest.advanceTimersByTime(6000);
                errorHandler.handleMemoryError(error);
            }
            expect(mockDegradationManager.setDegradationLevel).toHaveBeenCalled();
        });
    });

    describe('Runtime Error Handling', () => {
        it('should handle generic runtime errors', () => {
            const error = new Error('Boom');
            errorHandler.handleRuntimeError(error);
            expect(errorHandler.errorCounters.runtime).toBe(1);
        });

        it('should catch unhandled errors that are relevant', () => {
            const event = {
                error: new Error('WebGL failure in depth buffer'),
                filename: 'test.js',
            };
            errorHandler.handleUnhandledError(event);
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Unhandled error affecting camera effects',
                expect.any(Object)
            );
        });

        it('should ignore irrelevant unhandled errors', () => {
            const event = { error: new Error('Some random UI error'), filename: 'test.js' };
            errorHandler.handleUnhandledError(event);
            expect(errorHandler.errorCounters.runtime).toBe(0);
        });
    });

    describe('Recovery Logic', () => {
        it('should return false if cooldown active', () => {
            errorHandler.recoveryAttempts.total = 1;
            errorHandler.recoveryAttempts.lastAttempt = Date.now();

            const result = errorHandler.attemptRecovery('webgl');
            expect(result).toBe(false);
        });

        it('should try all strategies until success', () => {
            __mockMethods.getStrategiesForType.mockReturnValue(['strat1', 'strat2']);
            __mockMethods.executeStrategy.mockReturnValueOnce(false).mockReturnValueOnce(true);

            errorHandler.recoveryAttempts.total = 0;

            const result = errorHandler.attemptRecovery('webgl');

            expect(result).toBe(true);
            expect(__mockMethods.executeStrategy).toHaveBeenCalledTimes(2);
            expect(errorHandler.recoveryAttempts.successful).toBe(1);
        });

        it('should return false if all strategies fail', () => {
            __mockMethods.getStrategiesForType.mockReturnValue(['strat1']);
            __mockMethods.executeStrategy.mockReturnValue(false);

            errorHandler.recoveryAttempts.total = 0;

            const result = errorHandler.attemptRecovery('webgl');
            expect(result).toBe(false);
            expect(errorHandler.recoveryAttempts.failed).toBe(1);
        });
    });

    describe('Notifications', () => {
        it('should queue notifications', () => {
            errorHandler.queueNotification('info', 'Test info');
            expect(errorHandler.notifications.queue.length).toBe(1);
        });

        it('should suppress duplicates', () => {
            errorHandler.queueNotification('info', 'Test info');
            errorHandler.queueNotification('info', 'Test info');
            expect(errorHandler.notifications.queue.length).toBe(1);
        });

        it('should process queue and show notifications', () => {
            errorHandler.queueNotification('info', 'Test info');

            // Custom event listener mock
            const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

            errorHandler.processNotificationQueue();

            expect(errorHandler.notifications.queue.length).toBe(0);
            expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
        });
    });

    describe('Statistics and Debug', () => {
        it('should collect browser info', () => {
            const info = errorHandler.collectBrowserInfo();
            expect(info.userAgent).toBeDefined();
        });

        it('should provide error stats', () => {
            errorHandler.handleRuntimeError(new Error('test'));
            const stats = errorHandler.getErrorStatistics();
            expect(stats.counters.runtime).toBe(1);
            expect(stats.totalErrors).toBe(1);
        });
    });
});
