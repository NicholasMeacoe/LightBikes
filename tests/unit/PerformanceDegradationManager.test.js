const { PerformanceDegradationManager } = require('./PerformanceDegradationManager.js');

// Mock components
const mockCameraEffectsManager = {
    setEnabled: jest.fn()
};

const mockMotionBlurController = {
    setEnabled: jest.fn(),
    setQuality: jest.fn(),
    getCurrentQuality: jest.fn(() => 'medium'),
    resetPerformanceMetrics: jest.fn()
};

const mockShakeController = {
    setEnabled: jest.fn()
};

// Mock WebGL context
const mockWebGLContext = {
    getParameter: jest.fn((param) => {
        switch (param) {
            case 'MAX_TEXTURE_SIZE': return 4096;
            case 'MAX_RENDERBUFFER_SIZE': return 4096;
            case 'VERSION': return 'WebGL 1.0';
            case 'VENDOR': return 'Mock Vendor';
            case 'RENDERER': return 'Mock Renderer';
            case 'SHADING_LANGUAGE_VERSION': return 'WebGL GLSL ES 1.0';
            case 'MAX_VIEWPORT_DIMS': return [4096, 4096];
            default: return null;
        }
    }),
    getExtension: jest.fn(() => ({})),
    getSupportedExtensions: jest.fn(() => ['OES_texture_float', 'WEBGL_depth_texture'])
};

// Mock canvas and WebGL
Object.defineProperty(document, 'createElement', {
    value: jest.fn(() => ({
        getContext: jest.fn(() => mockWebGLContext),
        width: 1,
        height: 1
    }))
});

// Mock performance.memory
Object.defineProperty(performance, 'memory', {
    value: {
        usedJSHeapSize: 50 * 1024 * 1024,
        totalJSHeapSize: 100 * 1024 * 1024,
        jsHeapSizeLimit: 200 * 1024 * 1024
    },
    configurable: true
});

// Mock navigator properties
Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8, configurable: true });
Object.defineProperty(navigator, 'deviceMemory', { value: 8, configurable: true });

describe('PerformanceDegradationManager', () => {
    let degradationManager;

    beforeEach(() => {
        degradationManager = new PerformanceDegradationManager();
        jest.clearAllMocks();
    });

    describe('initialization', () => {
        it('should initialize successfully with valid components', () => {
            const result = degradationManager.initialize(
                mockCameraEffectsManager,
                mockMotionBlurController,
                mockShakeController
            );

            expect(result).toBe(true);
            expect(degradationManager.initialized).toBe(true);
        });

        it('should detect WebGL capabilities', () => {
            degradationManager.initialize(mockCameraEffectsManager);

            const capabilities = degradationManager.getCapabilitiesSummary();
            expect(capabilities.webgl).toBe(true);
            expect(capabilities.maxTextureSize).toBe(4096);
        });

        it('should set initial degradation level based on capabilities', () => {
            degradationManager.initialize(mockCameraEffectsManager);

            const state = degradationManager.getDegradationState();
            expect(state.level).toBeGreaterThanOrEqual(0);
            expect(state.level).toBeLessThanOrEqual(3);
        });
    });

    describe('performance monitoring', () => {
        beforeEach(() => {
            degradationManager.initialize(mockCameraEffectsManager, mockMotionBlurController);
        });

        it('should update performance metrics', () => {
            const deltaTime = 0.016; // 60 FPS
            
            degradationManager.update(deltaTime);
            
            const metrics = degradationManager.getPerformanceMetrics();
            expect(metrics.frameCount).toBe(1);
            expect(metrics.averageFrameTime).toBeCloseTo(16, 1);
        });

        it('should track consecutive poor frames', () => {
            const poorDeltaTime = 0.05; // 20 FPS
            
            for (let i = 0; i < 5; i++) {
                degradationManager.update(poorDeltaTime);
            }
            
            const metrics = degradationManager.getPerformanceMetrics();
            expect(metrics.consecutivePoorFrames).toBe(5);
        });

        it('should track consecutive good frames', () => {
            const goodDeltaTime = 0.01; // 100 FPS
            
            for (let i = 0; i < 5; i++) {
                degradationManager.update(goodDeltaTime);
            }
            
            const metrics = degradationManager.getPerformanceMetrics();
            expect(metrics.consecutiveGoodFrames).toBe(5);
        });
    });

    describe('degradation levels', () => {
        beforeEach(() => {
            degradationManager.initialize(mockCameraEffectsManager, mockMotionBlurController, mockShakeController);
        });

        it('should set degradation level and apply settings', () => {
            degradationManager.setDegradationLevel(2);

            const state = degradationManager.getDegradationState();
            expect(state.level).toBe(2);
            expect(state.motionBlurEnabled).toBe(false);
            expect(state.shakeEnabled).toBe(true);

            expect(mockMotionBlurController.setEnabled).toHaveBeenCalledWith(false);
            expect(mockShakeController.setEnabled).toHaveBeenCalledWith(true);
        });

        it('should not allow invalid degradation levels', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            degradationManager.setDegradationLevel(-1);
            degradationManager.setDegradationLevel(5);

            expect(consoleSpy).toHaveBeenCalledTimes(2);
            consoleSpy.mockRestore();
        });

        it('should disable all effects at maximum degradation', () => {
            degradationManager.setDegradationLevel(3);

            const state = degradationManager.getDegradationState();
            expect(state.effectsEnabled).toBe(false);
            expect(state.motionBlurEnabled).toBe(false);
            expect(state.shakeEnabled).toBe(false);

            expect(mockCameraEffectsManager.setEnabled).toHaveBeenCalledWith(false);
        });
    });

    describe('automatic quality adjustment', () => {
        beforeEach(() => {
            degradationManager.initialize(mockCameraEffectsManager, mockMotionBlurController);
            // Reset performance metrics to ensure clean state
            degradationManager.resetPerformanceMetrics();
        });

        it('should degrade quality on poor performance', () => {
            const poorDeltaTime = 0.04; // 25 FPS
            
            // Build up frame history
            for (let i = 0; i < 100; i++) {
                degradationManager.update(poorDeltaTime);
            }
            
            // Wait for cooldown and trigger adjustment
            jest.advanceTimersByTime(4000);
            degradationManager.update(poorDeltaTime);
            
            const state = degradationManager.getDegradationState();
            expect(state.level).toBeGreaterThan(0);
        });

        it('should improve quality on good performance', () => {
            // Start with degraded state
            degradationManager.setDegradationLevel(2);
            
            const goodDeltaTime = 0.01; // 100 FPS
            
            // Build up good performance history
            for (let i = 0; i < 150; i++) {
                degradationManager.update(goodDeltaTime);
            }
            
            // Wait for cooldown and trigger adjustment
            jest.advanceTimersByTime(4000);
            degradationManager.update(goodDeltaTime);
            
            const state = degradationManager.getDegradationState();
            expect(state.level).toBeLessThan(2);
        });
    });

    describe('memory management', () => {
        beforeEach(() => {
            degradationManager.initialize(mockCameraEffectsManager, mockMotionBlurController);
        });

        it('should monitor memory usage', () => {
            degradationManager.update(0.016);
            
            const metrics = degradationManager.getPerformanceMetrics();
            expect(metrics.memoryUsage.used).toBe(50 * 1024 * 1024);
            expect(metrics.memoryUsage.total).toBe(100 * 1024 * 1024);
        });

        it('should trigger memory cleanup on high usage', () => {
            // Mock high memory usage
            Object.defineProperty(performance, 'memory', {
                value: {
                    usedJSHeapSize: 190 * 1024 * 1024, // 95% usage
                    totalJSHeapSize: 200 * 1024 * 1024,
                    jsHeapSizeLimit: 200 * 1024 * 1024
                },
                configurable: true
            });

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            degradationManager.update(0.016);
            
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('High memory usage detected'),
                expect.stringContaining('95.0%')
            );
            
            consoleSpy.mockRestore();
        });
    });

    describe('capability detection', () => {
        it('should detect mobile devices', () => {
            // Mock mobile user agent
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
                configurable: true
            });

            const manager = new PerformanceDegradationManager();
            manager.initialize(mockCameraEffectsManager);

            const capabilities = manager.getCapabilitiesSummary();
            expect(capabilities.isMobile).toBe(true);
        });

        it('should detect low-end devices', () => {
            // Mock low-end device characteristics
            Object.defineProperty(navigator, 'hardwareConcurrency', { value: 2, configurable: true });
            Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true });

            const manager = new PerformanceDegradationManager();
            manager.initialize(mockCameraEffectsManager);

            const capabilities = manager.getCapabilitiesSummary();
            expect(capabilities.isLowEndDevice).toBe(true);
        });
    });

    describe('effect enablement checks', () => {
        beforeEach(() => {
            degradationManager.initialize(mockCameraEffectsManager, mockMotionBlurController, mockShakeController);
        });

        it('should return correct effect enablement status', () => {
            expect(degradationManager.shouldEnableEffects()).toBe(true);
            expect(degradationManager.shouldEnableMotionBlur()).toBe(true);
            expect(degradationManager.shouldEnableShake()).toBe(true);
        });

        it('should disable effects when degraded', () => {
            degradationManager.setDegradationLevel(3);

            expect(degradationManager.shouldEnableEffects()).toBe(false);
            expect(degradationManager.shouldEnableMotionBlur()).toBe(false);
            expect(degradationManager.shouldEnableShake()).toBe(false);
        });

        it('should disable motion blur only at level 2', () => {
            degradationManager.setDegradationLevel(2);

            expect(degradationManager.shouldEnableEffects()).toBe(true);
            expect(degradationManager.shouldEnableMotionBlur()).toBe(false);
            expect(degradationManager.shouldEnableShake()).toBe(true);
        });
    });

    describe('status and debugging', () => {
        beforeEach(() => {
            degradationManager.initialize(mockCameraEffectsManager, mockMotionBlurController);
        });

        it('should provide comprehensive status information', () => {
            const status = degradationManager.getStatus();

            expect(status).toHaveProperty('initialized', true);
            expect(status).toHaveProperty('enabled', true);
            expect(status).toHaveProperty('capabilities');
            expect(status).toHaveProperty('performance');
            expect(status).toHaveProperty('degradation');
        });

        it('should provide capabilities summary', () => {
            const capabilities = degradationManager.getCapabilitiesSummary();

            expect(capabilities).toHaveProperty('webgl');
            expect(capabilities).toHaveProperty('postProcessing');
            expect(capabilities).toHaveProperty('maxTextureSize');
            expect(capabilities).toHaveProperty('gpuTier');
        });

        it('should provide degradation state', () => {
            const state = degradationManager.getDegradationState();

            expect(state).toHaveProperty('level');
            expect(state).toHaveProperty('description');
            expect(state).toHaveProperty('effectsEnabled');
            expect(state).toHaveProperty('motionBlurEnabled');
            expect(state).toHaveProperty('shakeEnabled');
        });
    });

    describe('cleanup', () => {
        it('should clean up resources on destroy', () => {
            degradationManager.initialize(mockCameraEffectsManager, mockMotionBlurController);
            
            degradationManager.destroy();

            expect(degradationManager.initialized).toBe(false);
            expect(degradationManager.cameraEffectsManager).toBeNull();
            expect(degradationManager.motionBlurController).toBeNull();
        });
    });
});

// Mock timers for testing
jest.useFakeTimers();