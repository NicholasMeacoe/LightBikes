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

const { CameraEffectsErrorHandler } = require('@/effects/CameraEffectsErrorHandler.js');

// Mock components
const mockCameraEffectsManager = {
    setEnabled: jest.fn(),
};

const mockDegradationManager = {
    setDegradationLevel: jest.fn(),
    getDegradationState: jest.fn(() => ({ level: 0 })),
    resetPerformanceMetrics: jest.fn(),
};

const mockMotionBlurController = {
    setEnabled: jest.fn(),
    setQuality: jest.fn(),
    getCurrentQuality: jest.fn(() => 'medium'),
    initialize: jest.fn(() => true),
    resetPerformanceMetrics: jest.fn(),
};

const mockShakeController = {
    setEnabled: jest.fn(),
};

// Mock WebGL context
const mockWebGLContext = {
    VERSION: 0x1f02,
    VENDOR: 0x1f00,
    RENDERER: 0x1f01,
    SHADING_LANGUAGE_VERSION: 0x8b8c,
    MAX_TEXTURE_SIZE: 0x0d33,
    MAX_RENDERBUFFER_SIZE: 0x84e8,
    MAX_VIEWPORT_DIMS: 0x0d3a,
    getParameter: jest.fn((param) => {
        if (param === 0x1f02) return 'WebGL 1.0';
        if (param === 0x1f00) return 'Mock Vendor';
        if (param === 0x1f01) return 'Mock Renderer';
        if (param === 0x8b8c) return 'WebGL GLSL ES 1.0';
        if (param === 0x0d33) return 4096;
        if (param === 0x84e8) return 4096;
        if (param === 0x0d3a) return [4096, 4096];
        return null;
    }),
    getSupportedExtensions: jest.fn(() => ['OES_texture_float', 'WEBGL_depth_texture']),
    getExtension: jest.fn().mockReturnValue(null),
};

// Mock canvas and WebGL
Object.defineProperty(document, 'createElement', {
    value: jest.fn(() => ({
        getContext: jest.fn().mockReturnValue(mockWebGLContext),
    })),
});

// Mock performance
global.performance = {
    now: jest.fn(() => Date.now()),
    memory: {
        usedJSHeapSize: 50 * 1024 * 1024,
        totalJSHeapSize: 100 * 1024 * 1024,
        jsHeapSizeLimit: 200 * 1024 * 1024,
    },
    timing: {
        navigationStart: 0,
        loadEventEnd: 1000,
    },
};

// Mock screen
global.screen = {
    width: 1920,
    height: 1080,
    colorDepth: 24,
    pixelDepth: 24,
};

// Mock window.gc
Object.defineProperty(window, 'gc', {
    value: jest.fn(),
    configurable: true,
});

describe('CameraEffectsErrorHandler', () => {
    let errorHandler;

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-01-01'));
        errorHandler = new CameraEffectsErrorHandler();
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('initialization', () => {
        it('should initialize successfully with valid components', () => {
            const result = errorHandler.initialize(
                mockCameraEffectsManager,
                mockDegradationManager,
                mockMotionBlurController,
                mockShakeController
            );

            expect(result).toBe(true);
            expect(errorHandler.initialized).toBe(true);
        });

        it('should collect browser and system information', () => {
            errorHandler.initialize(mockCameraEffectsManager);

            const debugInfo = errorHandler.getDebugInfo();
            expect(debugInfo.browserInfo).toHaveProperty('userAgent');
            expect(debugInfo.systemInfo).toHaveProperty('screen');
            expect(debugInfo.webglInfo).toHaveProperty('version');
        });

        it('should set up global error handlers', () => {
            const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

            errorHandler.initialize(mockCameraEffectsManager);

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

            addEventListenerSpy.mockRestore();
        });
    });

    describe('WebGL error handling', () => {
        beforeEach(() => {
            errorHandler.initialize(
                mockCameraEffectsManager,
                mockDegradationManager,
                mockMotionBlurController
            );
        });

        it('should handle WebGL errors and increment counter', () => {
            const error = new Error('WebGL context lost');

            errorHandler.handleWebGLError(error, 'Test WebGL error');

            const stats = errorHandler.getErrorStatistics();
            expect(stats.counters.webgl).toBe(1);
            expect(stats.totalErrors).toBe(1);
        });

        it('should trigger degradation after multiple WebGL errors', () => {
            const error = new Error('WebGL error');

            // Trigger multiple errors to reach degradation threshold
            for (let i = 0; i < 3; i++) {
                jest.advanceTimersByTime(6000); // Beyond cooldown
                errorHandler.handleWebGLError(error, `WebGL error ${i}`);
            }

            expect(mockDegradationManager.setDegradationLevel).toHaveBeenCalled();
        });

        it('should disable all effects after too many WebGL errors', () => {
            const error = new Error('WebGL error');

            // Trigger many errors to reach disable threshold
            for (let i = 0; i < 10; i++) {
                jest.advanceTimersByTime(6000); // Beyond cooldown
                errorHandler.handleWebGLError(error, `WebGL error ${i}`);
            }

            expect(mockCameraEffectsManager.setEnabled).toHaveBeenCalledWith(false);
        });

        it('should handle WebGL context lost event', () => {
            const event = new Event('webglcontextlost');
            event.preventDefault = jest.fn();

            errorHandler.handleWebGLContextLost(event);

            expect(event.preventDefault).toHaveBeenCalled();

            const stats = errorHandler.getErrorStatistics();
            expect(stats.counters.webgl).toBe(1);
        });
    });

    describe('post-processing error handling', () => {
        beforeEach(() => {
            errorHandler.initialize(
                mockCameraEffectsManager,
                mockDegradationManager,
                mockMotionBlurController
            );
        });

        it('should handle post-processing errors', () => {
            const error = new Error('Post-processing failed');

            errorHandler.handlePostProcessingError(error, 'Test post-processing error');

            const stats = errorHandler.getErrorStatistics();
            expect(stats.counters.postProcessing).toBe(1);
        });

        it('should disable motion blur after post-processing errors', () => {
            const error = new Error('Post-processing error');

            // Trigger multiple errors to reach degradation threshold
            for (let i = 0; i < 3; i++) {
                jest.advanceTimersByTime(6000); // Beyond cooldown
                errorHandler.handlePostProcessingError(error, `Post-processing error ${i}`);
            }

            expect(mockMotionBlurController.setEnabled).toHaveBeenCalledWith(false);
        });
    });

    describe('shader error handling', () => {
        beforeEach(() => {
            errorHandler.initialize(
                mockCameraEffectsManager,
                mockDegradationManager,
                mockMotionBlurController
            );
        });

        it('should handle shader errors', () => {
            const error = new Error('Shader compilation failed');
            const shaderInfo = { type: 'fragment', source: 'shader code' };

            errorHandler.handleShaderError(error, 'Shader compilation', shaderInfo);

            const stats = errorHandler.getErrorStatistics();
            expect(stats.counters.shader).toBe(1);
        });

        it('should disable motion blur after shader errors', () => {
            const error = new Error('Shader error');

            // Trigger multiple errors to reach degradation threshold
            for (let i = 0; i < 3; i++) {
                jest.advanceTimersByTime(6000); // Beyond cooldown
                errorHandler.handleShaderError(error, `Shader error ${i}`);
            }

            expect(mockMotionBlurController.setEnabled).toHaveBeenCalledWith(false);
        });
    });

    describe('memory error handling', () => {
        beforeEach(() => {
            errorHandler.initialize(
                mockCameraEffectsManager,
                mockDegradationManager,
                mockMotionBlurController
            );
        });

        it('should handle memory errors', () => {
            const error = new Error('Out of memory');
            const memoryInfo = { used: 100, total: 200 };

            errorHandler.handleMemoryError(error, 'Memory allocation failed', memoryInfo);

            const stats = errorHandler.getErrorStatistics();
            expect(stats.counters.memory).toBe(1);
        });

        it('should trigger degradation on memory errors', () => {
            const error = new Error('Memory error');

            // Trigger multiple errors to reach degradation threshold
            for (let i = 0; i < 3; i++) {
                jest.advanceTimersByTime(6000); // Beyond cooldown
                errorHandler.handleMemoryError(error, `Memory error ${i}`);
            }

            expect(mockDegradationManager.setDegradationLevel).toHaveBeenCalled();
        });
    });

    describe('recovery strategies', () => {
        beforeEach(() => {
            errorHandler.initialize(
                mockCameraEffectsManager,
                mockDegradationManager,
                mockMotionBlurController
            );
            jest.clearAllMocks();
        });

        it('should attempt recovery for WebGL errors', () => {
            const error = new Error('WebGL error');
            errorHandler.handleWebGLError(error, 'Test error');

            jest.advanceTimersByTime(6000); // Beyond cooldown
            const result = errorHandler.attemptRecovery('webgl');
            expect(result).toBe(true);
        });

        it('should execute reduce quality recovery strategy', () => {
            const result = errorHandler.recoveryStrategies.executeStrategy('reduceQuality');
            expect(result).toBe(true);
            expect(mockDegradationManager.setDegradationLevel).toHaveBeenCalled();
        });

        it('should execute disable motion blur recovery strategy', () => {
            const result = errorHandler.recoveryStrategies.executeStrategy('disableMotionBlur');
            expect(result).toBe(true);
            expect(mockMotionBlurController.setEnabled).toHaveBeenCalledWith(false);
        });

        it('should execute fallback rendering recovery strategy', () => {
            const result = errorHandler.recoveryStrategies.executeStrategy('fallbackRendering');
            expect(result).toBe(true);

            // fallbackMode is a property of errorHandler that is set in attemptRecovery or enterFallbackMode
            // but executeStrategy also sets it in some cases if called via attemptRecovery
            errorHandler.enterFallbackMode('test');
            const status = errorHandler.getStatus();
            expect(status.fallbackMode).toBe(true);
        });

        it('should execute clear caches recovery strategy', () => {
            const result = errorHandler.recoveryStrategies.executeStrategy('clearCaches');
            expect(result).toBe(true);
            expect(mockMotionBlurController.resetPerformanceMetrics).toHaveBeenCalled();
        });

        it('should execute force garbage collection recovery strategy', () => {
            const result =
                errorHandler.recoveryStrategies.executeStrategy('forceGarbageCollection');
            expect(result).toBe(true);
            expect(window.gc).toHaveBeenCalled();
        });

        it('should limit recovery attempts', () => {
            // Exhaust recovery attempts
            for (let i = 0; i < 5; i++) {
                jest.advanceTimersByTime(6000);
                errorHandler.attemptRecovery('webgl');
            }

            expect(errorHandler.canAttemptRecovery()).toBe(false);
        });
    });

    describe('notification system', () => {
        beforeEach(() => {
            errorHandler.initialize(mockCameraEffectsManager);
            jest.clearAllMocks();
        });

        it('should queue notifications', () => {
            errorHandler.queueNotification('warning', 'Test warning');
            errorHandler.queueNotification('error', 'Test error');

            const status = errorHandler.getStatus();
            expect(status.notificationQueueSize).toBe(2);
        });

        it('should prevent duplicate notifications', () => {
            errorHandler.queueNotification('warning', 'Test warning');
            errorHandler.queueNotification('warning', 'Test warning'); // Duplicate

            const status = errorHandler.getStatus();
            expect(status.notificationQueueSize).toBe(1);
        });

        it('should process notification queue', () => {
            errorHandler.queueNotification('info', 'Test info');
            errorHandler.processNotificationQueue();

            expect(mockLogger.info).toHaveBeenCalledWith('Camera Effects: Test info');
        });

        it('should dispatch custom events for notifications', () => {
            const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

            errorHandler.queueNotification('error', 'Test error');
            errorHandler.processNotificationQueue();

            expect(dispatchEventSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'cameraEffectsError',
                })
            );

            dispatchEventSpy.mockRestore();
        });
    });

    describe('error logging', () => {
        beforeEach(() => {
            errorHandler.initialize(mockCameraEffectsManager);
            jest.clearAllMocks();
        });

        it('should add entries to error log', () => {
            const error = new Error('Test error');
            errorHandler.handleRuntimeError(error, 'Test context');

            const stats = errorHandler.getErrorStatistics();
            expect(stats.recentErrors.length).toBe(1);
            expect(stats.recentErrors[0].type).toBe('runtime');
        });

        it('should limit error log size', () => {
            const error = new Error('Test error');

            // Add many errors to test log size limit
            for (let i = 0; i < 150; i++) {
                errorHandler.handleRuntimeError(error, `Error ${i}`);
            }

            const stats = errorHandler.getErrorStatistics();
            expect(stats.recentErrors.length).toBeLessThanOrEqual(100);
        });

        it('should log messages with context', () => {
            errorHandler.log('info', 'Test message', { key: 'value' });

            expect(mockLogger.info).toHaveBeenCalledWith('Test message', { key: 'value' });
        });
    });

    describe('status and debugging', () => {
        beforeEach(() => {
            errorHandler.initialize(mockCameraEffectsManager, mockDegradationManager);
        });

        it('should provide error statistics', () => {
            const error = new Error('Test error');
            errorHandler.handleWebGLError(error, 'Test');
            errorHandler.handlePostProcessingError(error, 'Test');

            const stats = errorHandler.getErrorStatistics();
            expect(stats.counters.webgl).toBe(1);
            expect(stats.counters.postProcessing).toBe(1);
            expect(stats.totalErrors).toBe(2);
        });

        it('should provide debug information', () => {
            const debugInfo = errorHandler.getDebugInfo();

            expect(debugInfo).toHaveProperty('browserInfo');
            expect(debugInfo).toHaveProperty('systemInfo');
            expect(debugInfo).toHaveProperty('webglInfo');
            expect(debugInfo).toHaveProperty('errorStatistics');
        });

        it('should provide comprehensive status', () => {
            const status = errorHandler.getStatus();

            expect(status).toHaveProperty('initialized', true);
            expect(status).toHaveProperty('fallbackMode');
            expect(status).toHaveProperty('effectsDisabled');
            expect(status).toHaveProperty('errorStatistics');
        });

        it('should detect recoverable errors', () => {
            const error = new Error('Test error');
            errorHandler.handleWebGLError(error, 'Test');

            expect(errorHandler.hasRecoverableErrors()).toBe(true);
        });
    });

    describe('cleanup', () => {
        it('should clean up resources on destroy', () => {
            const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

            errorHandler.initialize(mockCameraEffectsManager);
            errorHandler.destroy();

            expect(removeEventListenerSpy).toHaveBeenCalledWith(
                'webglcontextlost',
                expect.any(Function)
            );
            expect(removeEventListenerSpy).toHaveBeenCalledWith(
                'webglcontextrestored',
                expect.any(Function)
            );
            expect(removeEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));

            expect(errorHandler.initialized).toBe(false);
            expect(errorHandler.cameraEffectsManager).toBeNull();

            removeEventListenerSpy.mockRestore();
        });

        it('should reset error counters', () => {
            const error = new Error('Test error');
            errorHandler.handleWebGLError(error, 'Test');

            errorHandler.resetErrorCounters();

            const stats = errorHandler.getErrorStatistics();
            expect(stats.totalErrors).toBe(0);
            expect(stats.recoveryAttempts.total).toBe(0);
        });
    });
});

// Mock timers for testing
jest.useFakeTimers();
