/**
 * MotionBlurController Tests
 * 
 * Comprehensive test suite for the MotionBlurController class,
 * covering initialization, performance optimization, WebGL capability detection,
 * and integration with the Three.js post-processing pipeline.
 */

// Mock Three.js classes and WebGL context
global.THREE = {
    EffectComposer: jest.fn().mockImplementation(() => ({
        setSize: jest.fn(),
        addPass: jest.fn(),
        render: jest.fn(),
        dispose: jest.fn(),
        passes: []
    })),
    RenderPass: jest.fn().mockImplementation(() => ({
        scene: null,
        camera: null,
        dispose: jest.fn()
    })),
    ShaderPass: jest.fn().mockImplementation((shader) => ({
        uniforms: {
            tDiffuse: { value: null },
            velocityFactor: { value: 0.5 },
            intensity: { value: 0.0 },
            samples: { value: 32 }
        },
        renderToScreen: false,
        dispose: jest.fn()
    })),
    Vector2: jest.fn().mockImplementation((x, y) => ({ x: x || 0, y: y || 0 }))
};

// Mock WebGL context
const mockWebGLContext = {
    getParameter: jest.fn((param) => {
        const GL_MAX_TEXTURE_SIZE = 0x0D33;
        const GL_MAX_RENDERBUFFER_SIZE = 0x84E8;

        if (param === GL_MAX_TEXTURE_SIZE) return 4096;
        if (param === GL_MAX_RENDERBUFFER_SIZE) return 4096;
        return 1;
    }),
    getExtension: jest.fn((name) => {
        // Mock extension support
        if (name === 'OES_texture_float') return {};
        if (name === 'WEBGL_depth_texture') return {};
        return null;
    })
};

// Mock canvas and context
const mockCanvas = {
    getContext: jest.fn(() => mockWebGLContext)
};

// Mock document.createElement
global.document = {
    createElement: jest.fn((tagName) => {
        if (tagName === 'canvas') return mockCanvas;
        return {};
    })
};

// Mock HTMLCanvasElement.prototype.getContext to avoid jsdom errors
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    value: jest.fn(() => mockWebGLContext),
    writable: true
});

// Mock window object
global.window = {
    innerWidth: 1920,
    innerHeight: 1080,
    devicePixelRatio: 1
};

// Mock navigator for mobile detection
global.navigator = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

const { MotionBlurController } = require('@/effects/MotionBlurController.js');

describe('MotionBlurController', () => {
    let motionBlurController;
    let mockRenderer;
    let mockScene;
    let mockCamera;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Reset canvas context mock
        mockCanvas.getContext.mockReturnValue(mockWebGLContext);
        HTMLCanvasElement.prototype.getContext = jest.fn(() => mockWebGLContext);

        // Create mock renderer
        mockRenderer = {
            render: jest.fn(),
            getSize: jest.fn(() => ({ x: 1920, y: 1080 }))
        };

        // Create mock scene and camera
        mockScene = {};
        mockCamera = {};

        // Create MotionBlurController instance
        motionBlurController = new MotionBlurController(mockRenderer);
    });

    describe('Constructor', () => {
        it('should initialize with default configuration', () => {
            expect(motionBlurController.renderer).toBe(mockRenderer);
            expect(motionBlurController.initialized).toBe(false);
            expect(motionBlurController.enabled).toBe(true);
            expect(motionBlurController.currentQuality).toBe('medium');
            expect(motionBlurController.fallbackMode).toBe(false);
        });

        it('should have correct default blur configuration', () => {
            const config = motionBlurController.getBlurConfig();
            expect(config.intensity).toBe(0.0);
            expect(config.maxIntensity).toBe(0.8);
            expect(config.speedThreshold).toBe(1.5);
            expect(config.samples).toBe(32);
            expect(config.velocityFactor).toBe(0.5);
        });

        it('should have quality settings for all levels', () => {
            expect(motionBlurController.qualitySettings).toHaveProperty('high');
            expect(motionBlurController.qualitySettings).toHaveProperty('medium');
            expect(motionBlurController.qualitySettings).toHaveProperty('low');
        });
    });

    describe('WebGL Capability Detection', () => {
        it('should detect WebGL capabilities successfully', () => {
            const result = motionBlurController.detectWebGLCapabilities();

            expect(result).toBe(true);
            expect(motionBlurController.capabilities.webglSupported).toBe(true);
            expect(motionBlurController.capabilities.maxTextureSize).toBe(4096);
            expect(motionBlurController.capabilities.floatTextureSupport).toBe(true);
        });

        it('should handle missing WebGL context', () => {
            // Mock both canvas.getContext and HTMLCanvasElement.prototype.getContext
            mockCanvas.getContext.mockReturnValue(null);
            HTMLCanvasElement.prototype.getContext = jest.fn(() => null);

            const result = motionBlurController.detectWebGLCapabilities();

            expect(result).toBe(false);
            expect(motionBlurController.capabilities.webglSupported).toBe(false);
        });

        it('should handle insufficient texture size', () => {
            mockWebGLContext.getParameter.mockImplementation((param) => {
                const GL_MAX_TEXTURE_SIZE = 0x0D33;
                if (param === GL_MAX_TEXTURE_SIZE) return 512; // Below minimum
                return 1;
            });

            const result = motionBlurController.detectWebGLCapabilities();

            expect(result).toBe(false);
        });

        it('should detect mobile devices and adjust settings', () => {
            global.navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';

            const result = motionBlurController.detectWebGLCapabilities();

            expect(result).toBe(true);
            expect(motionBlurController.currentQuality).toBe('low');
        });
    });

    describe('Initialization', () => {
        it('should initialize successfully with WebGL support', () => {
            const result = motionBlurController.initialize();

            expect(result).toBe(true);
            expect(motionBlurController.initialized).toBe(true);
            expect(motionBlurController.fallbackMode).toBe(false);
            expect(THREE.EffectComposer).toHaveBeenCalledWith(mockRenderer);
        });

        it('should use fallback mode when WebGL is not supported', () => {
            mockCanvas.getContext.mockReturnValue(null);

            const result = motionBlurController.initialize();

            expect(result).toBe(true);
            expect(motionBlurController.fallbackMode).toBe(true);
        });

        it('should handle post-processing initialization errors', () => {
            THREE.EffectComposer.mockImplementation(() => {
                throw new Error('EffectComposer error');
            });

            const result = motionBlurController.initialize();

            expect(result).toBe(false);
            expect(motionBlurController.fallbackMode).toBe(true);
        });
    });

    describe('Motion Blur Pass Creation', () => {
        beforeEach(() => {
            motionBlurController.initialize();
        });

        it('should create motion blur pass with custom shader', () => {
            const pass = motionBlurController.createMotionBlurPass();

            expect(pass).toBeDefined();
            expect(THREE.ShaderPass).toHaveBeenCalled();
            expect(pass.uniforms).toHaveProperty('intensity');
            expect(pass.uniforms).toHaveProperty('velocityFactor');
            expect(pass.uniforms).toHaveProperty('samples');
        });

        it('should handle shader pass creation errors', () => {
            THREE.ShaderPass.mockImplementation(() => {
                throw new Error('Shader error');
            });

            const pass = motionBlurController.createMotionBlurPass();

            expect(pass).toBeNull();
        });
    });

    describe('Blur Intensity Updates', () => {
        beforeEach(() => {
            motionBlurController.initialize();
        });

        it('should update blur intensity based on speed', () => {
            const initialIntensity = motionBlurController.getBlurConfig().intensity;

            // Speed below threshold should not activate blur
            motionBlurController.updateBlurIntensity(1.0);
            expect(motionBlurController.getBlurConfig().intensity).toBe(initialIntensity);

            // Speed above threshold should activate blur
            motionBlurController.updateBlurIntensity(3.0);
            // Note: Due to smoothing, intensity won't immediately reach target
            expect(motionBlurController.getBlurConfig().intensity).toBeGreaterThan(initialIntensity);
        });

        it('should clamp intensity to maximum value', () => {
            // Very high speed should not exceed max intensity
            for (let i = 0; i < 100; i++) {
                motionBlurController.updateBlurIntensity(10.0);
            }

            const config = motionBlurController.getBlurConfig();
            expect(config.intensity).toBeLessThanOrEqual(config.maxIntensity);
        });

        it('should handle fallback mode gracefully', () => {
            motionBlurController.fallbackMode = true;

            expect(() => {
                motionBlurController.updateBlurIntensity(5.0);
            }).not.toThrow();
        });

        it('should not update when disabled', () => {
            motionBlurController.setEnabled(false);
            const initialIntensity = motionBlurController.getBlurConfig().intensity;

            motionBlurController.updateBlurIntensity(5.0);

            expect(motionBlurController.getBlurConfig().intensity).toBe(initialIntensity);
        });
    });

    describe('Quality Management', () => {
        beforeEach(() => {
            motionBlurController.initialize();
        });

        it('should set quality levels correctly', () => {
            motionBlurController.setQuality('high');
            expect(motionBlurController.getCurrentQuality()).toBe('high');

            motionBlurController.setQuality('low');
            expect(motionBlurController.getCurrentQuality()).toBe('low');
        });

        it('should handle invalid quality levels', () => {
            const originalQuality = motionBlurController.getCurrentQuality();

            motionBlurController.setQuality('invalid');

            expect(motionBlurController.getCurrentQuality()).toBe(originalQuality);
        });

        it('should update shader uniforms when quality changes', () => {
            motionBlurController.setQuality('low');

            const config = motionBlurController.getBlurConfig();
            expect(config.samples).toBe(8); // Low quality samples
        });
    });

    describe('Performance Monitoring', () => {
        beforeEach(() => {
            motionBlurController.initialize();
            // Mock Date.now for consistent timing
            jest.spyOn(Date, 'now').mockReturnValue(1000);
        });

        afterEach(() => {
            Date.now.mockRestore();
        });

        it('should track performance metrics', () => {
            motionBlurController.updatePerformanceMetrics();

            const metrics = motionBlurController.getPerformanceMetrics();
            expect(metrics.frameCount).toBe(1);
            expect(metrics.currentFPS).toBeGreaterThan(0);
        });

        it('should maintain performance history', () => {
            // Simulate multiple frame updates
            for (let i = 0; i < 5; i++) {
                Date.now.mockReturnValue(1000 + i * 16); // 60fps timing
                motionBlurController.updatePerformanceMetrics();
            }

            const metrics = motionBlurController.getPerformanceMetrics();
            expect(metrics.frameCount).toBe(5);
            expect(motionBlurController.performanceMetrics.performanceHistory.length).toBe(4); // First frame has no previous time
        });

        it('should limit performance history size', () => {
            const maxHistory = motionBlurController.performanceMetrics.maxHistoryLength;

            // Simulate more updates than max history
            for (let i = 0; i < maxHistory + 10; i++) {
                Date.now.mockReturnValue(1000 + i * 16);
                motionBlurController.updatePerformanceMetrics();
            }

            expect(motionBlurController.performanceMetrics.performanceHistory.length).toBeLessThanOrEqual(maxHistory);
        });
    });

    describe('Auto-scaling', () => {
        beforeEach(() => {
            motionBlurController.initialize();
            motionBlurController.setAutoScalingEnabled(true);
            jest.spyOn(Date, 'now').mockReturnValue(1000);
        });

        afterEach(() => {
            Date.now.mockRestore();
        });

        it('should downscale quality on poor performance', () => {
            motionBlurController.setQuality('high');

            // Simulate poor performance (low FPS)
            for (let i = 0; i < 100; i++) {
                Date.now.mockReturnValue(1000 + i * 50); // 20fps timing
                motionBlurController.updatePerformanceMetrics();
                motionBlurController.autoScaleQuality();
            }

            expect(motionBlurController.getCurrentQuality()).toBe('low');
        });

        it('should respect cooldown period between adjustments', () => {
            motionBlurController.setQuality('high');

            // Simulate poor performance but within cooldown
            Date.now.mockReturnValue(1000);
            for (let i = 0; i < 100; i++) {
                motionBlurController.updatePerformanceMetrics();
            }

            Date.now.mockReturnValue(1500); // Only 500ms later (less than 2s cooldown)
            motionBlurController.autoScaleQuality();

            expect(motionBlurController.getCurrentQuality()).toBe('high'); // Should not change
        });

        it('should not auto-scale when disabled', () => {
            motionBlurController.setAutoScalingEnabled(false);
            motionBlurController.setQuality('high');

            // Simulate poor performance
            for (let i = 0; i < 100; i++) {
                Date.now.mockReturnValue(1000 + i * 50);
                motionBlurController.updatePerformanceMetrics();
                motionBlurController.autoScaleQuality();
            }

            expect(motionBlurController.getCurrentQuality()).toBe('high');
        });
    });

    describe('Rendering', () => {
        beforeEach(() => {
            motionBlurController.initialize();
        });

        it('should render through post-processing pipeline when initialized', () => {
            motionBlurController.render(mockScene, mockCamera);

            expect(motionBlurController.composer.render).toHaveBeenCalled();
        });

        it('should fallback to standard rendering in fallback mode', () => {
            motionBlurController.fallbackMode = true;

            motionBlurController.render(mockScene, mockCamera);

            expect(mockRenderer.render).toHaveBeenCalledWith(mockScene, mockCamera);
        });

        it('should handle rendering errors gracefully', () => {
            motionBlurController.composer.render.mockImplementation(() => {
                throw new Error('Render error');
            });

            expect(() => {
                motionBlurController.render(mockScene, mockCamera);
            }).not.toThrow();

            expect(mockRenderer.render).toHaveBeenCalledWith(mockScene, mockCamera);
        });
    });

    describe('Window Resize', () => {
        beforeEach(() => {
            motionBlurController.initialize();
        });

        it('should handle window resize correctly', () => {
            motionBlurController.resize(1024, 768);

            // Should resize composer based on current quality
            const settings = motionBlurController.qualitySettings[motionBlurController.currentQuality];
            const expectedWidth = Math.floor(1024 * settings.resolution);
            const expectedHeight = Math.floor(768 * settings.resolution);

            expect(motionBlurController.composer.setSize).toHaveBeenCalledWith(expectedWidth, expectedHeight);
        });

        it('should handle resize in fallback mode', () => {
            motionBlurController.fallbackMode = true;

            expect(() => {
                motionBlurController.resize(1024, 768);
            }).not.toThrow();
        });
    });

    describe('Enable/Disable', () => {
        beforeEach(() => {
            motionBlurController.initialize();
        });

        it('should enable and disable motion blur', () => {
            motionBlurController.setEnabled(false);
            expect(motionBlurController.enabled).toBe(false);

            motionBlurController.setEnabled(true);
            expect(motionBlurController.enabled).toBe(true);
        });

        it('should reset blur intensity when disabled', () => {
            motionBlurController.updateBlurIntensity(5.0);

            motionBlurController.setEnabled(false);

            expect(motionBlurController.getBlurConfig().intensity).toBe(0.0);
        });
    });

    describe('Performance Analysis', () => {
        beforeEach(() => {
            motionBlurController.initialize();
            jest.spyOn(Date, 'now').mockReturnValue(1000);
        });

        afterEach(() => {
            Date.now.mockRestore();
        });

        it('should provide performance analysis when data is available', () => {
            // Generate performance data
            for (let i = 0; i < 100; i++) {
                Date.now.mockReturnValue(1000 + i * 16);
                motionBlurController.updatePerformanceMetrics();
            }

            const analysis = motionBlurController.getPerformanceAnalysis();

            expect(analysis.available).toBe(true);
            expect(analysis.fps).toBeDefined();
            expect(analysis.performance).toBeDefined();
            expect(analysis.capabilities).toBeDefined();
        });

        it('should handle insufficient data gracefully', () => {
            const analysis = motionBlurController.getPerformanceAnalysis();

            expect(analysis.available).toBe(false);
            expect(analysis.message).toBe('Insufficient performance data');
        });

        it('should recommend appropriate quality levels', () => {
            const highPerfQuality = motionBlurController.getRecommendedQuality(70, 65, 5);
            expect(highPerfQuality).toBe('high');

            const lowPerfQuality = motionBlurController.getRecommendedQuality(25, 20, 10);
            expect(lowPerfQuality).toBe('low');

            const mediumPerfQuality = motionBlurController.getRecommendedQuality(50, 45, 8);
            expect(mediumPerfQuality).toBe('medium');
        });
    });

    describe('Pause/Resume', () => {
        beforeEach(() => {
            motionBlurController.initialize();
        });

        it('should pause and reset blur intensity', () => {
            motionBlurController.updateBlurIntensity(5.0);

            motionBlurController.pause();

            expect(motionBlurController.getBlurConfig().intensity).toBe(0.0);
        });

        it('should resume and reset timing', () => {
            jest.spyOn(Date, 'now').mockReturnValue(2000);

            motionBlurController.resume();

            expect(motionBlurController.performanceMetrics.lastFrameTime).toBe(2000);

            Date.now.mockRestore();
        });
    });

    describe('Resource Management', () => {
        beforeEach(() => {
            motionBlurController.initialize();
        });

        it('should dispose of resources properly', () => {
            motionBlurController.destroy();

            expect(motionBlurController.composer.dispose).toHaveBeenCalled();
            expect(motionBlurController.initialized).toBe(false);
            expect(motionBlurController.composer).toBeNull();
        });

        it('should handle disposal errors gracefully', () => {
            motionBlurController.composer.dispose.mockImplementation(() => {
                throw new Error('Disposal error');
            });

            expect(() => {
                motionBlurController.destroy();
            }).not.toThrow();
        });
    });

    describe('Status and Configuration', () => {
        beforeEach(() => {
            motionBlurController.initialize();
        });

        it('should provide comprehensive status information', () => {
            const status = motionBlurController.getStatus();

            expect(status).toHaveProperty('initialized');
            expect(status).toHaveProperty('enabled');
            expect(status).toHaveProperty('fallbackMode');
            expect(status).toHaveProperty('quality');
            expect(status).toHaveProperty('blurIntensity');
            expect(status).toHaveProperty('capabilities');
            expect(status).toHaveProperty('performanceMetrics');
        });

        it('should allow configuration retrieval', () => {
            const config = motionBlurController.getBlurConfig();

            expect(config).toHaveProperty('intensity');
            expect(config).toHaveProperty('maxIntensity');
            expect(config).toHaveProperty('speedThreshold');
            expect(config).toHaveProperty('samples');
            expect(config).toHaveProperty('velocityFactor');
        });
    });
});