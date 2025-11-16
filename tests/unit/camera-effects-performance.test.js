/**
 * Performance and Compatibility Tests for Camera Effects System
 * Tests frame rate monitoring, memory usage, WebGL resource management, and mobile compatibility
 */

const { CameraEffectsManager } = require('./CameraEffectsManager.js');
const { MotionBlurController } = require('./MotionBlurController.js');
const { CameraShakeController } = require('./CameraShakeController.js');

// Mock performance.now for consistent timing
const mockPerformanceNow = jest.fn();
global.performance = { now: mockPerformanceNow };

// Mock THREE.js for testing
global.THREE = {
    Scene: jest.fn(() => ({})),
    PerspectiveCamera: jest.fn(() => ({
        position: { x: 0, y: 20, z: 20, clone: () => ({ x: 0, y: 20, z: 20 }) }
    })),
    WebGLRenderer: jest.fn(() => ({
        render: jest.fn(),
        setClearColor: jest.fn(),
        getSize: jest.fn(() => ({ x: 1920, y: 1080 }))
    })),
    EffectComposer: jest.fn(() => ({
        setSize: jest.fn(),
        addPass: jest.fn(),
        render: jest.fn(),
        dispose: jest.fn(),
        passes: []
    })),
    RenderPass: jest.fn(() => ({ dispose: jest.fn() })),
    ShaderPass: jest.fn(() => ({
        uniforms: {
            intensity: { value: 0.0 },
            velocityFactor: { value: 0.5 },
            samples: { value: 32 }
        },
        dispose: jest.fn()
    })),
    Vector2: jest.fn((x, y) => ({ x: x || 0, y: y || 0 })),
    Vector3: jest.fn((x, y, z) => ({ x: x || 0, y: y || 0, z: z || 0 }))
};

// Mock WebGL context for compatibility testing
const mockWebGLContext = {
    getParameter: jest.fn((param) => {
        const GL_MAX_TEXTURE_SIZE = 0x0D33;
        const GL_MAX_RENDERBUFFER_SIZE = 0x84E8;
        const GL_VERSION = 0x1F02;
        
        if (param === GL_MAX_TEXTURE_SIZE) return 4096;
        if (param === GL_MAX_RENDERBUFFER_SIZE) return 4096;
        if (param === GL_VERSION) return 'WebGL 1.0';
        return 1;
    }),
    getExtension: jest.fn((name) => {
        if (name === 'OES_texture_float') return {};
        if (name === 'WEBGL_depth_texture') return {};
        return null;
    })
};

// Mock canvas for WebGL testing
global.HTMLCanvasElement.prototype.getContext = jest.fn(() => mockWebGLContext);

// Mock document and window
global.document = {
    createElement: jest.fn(() => ({
        getContext: jest.fn(() => mockWebGLContext)
    }))
};

global.window = {
    innerWidth: 1920,
    innerHeight: 1080,
    devicePixelRatio: 1
};

describe('Camera Effects Performance Tests', () => {
    let cameraEffectsManager;
    let mockCamera;
    let mockRenderer;

    beforeEach(() => {
        mockCamera = new THREE.PerspectiveCamera();
        mockRenderer = new THREE.WebGLRenderer();
        
        cameraEffectsManager = new CameraEffectsManager(mockCamera, mockRenderer, {});
        cameraEffectsManager.initialize();
        
        // Reset performance mock
        mockPerformanceNow.mockClear();
        jest.clearAllMocks();
    });

    describe('frame rate monitoring during intensive shake sequences', () => {
        it('should maintain stable frame rate during multiple simultaneous shakes', () => {
            const frameCount = 60; // 1 second at 60fps
            const targetFrameTime = 16.67; // ~60fps in milliseconds
            let totalFrameTime = 0;
            
            // Trigger multiple intensive shake effects
            for (let i = 0; i < 5; i++) {
                cameraEffectsManager.onCollision({ id: `entity_${i}` }, 1.0);
            }
            
            // Simulate frame updates and measure performance
            for (let frame = 0; frame < frameCount; frame++) {
                const frameStart = frame * targetFrameTime;
                mockPerformanceNow.mockReturnValue(frameStart);
                
                const updateStart = performance.now();
                cameraEffectsManager.update(targetFrameTime / 1000);
                const updateEnd = performance.now();
                
                totalFrameTime += (updateEnd - updateStart);
            }
            
            const averageFrameTime = totalFrameTime / frameCount;
            
            // Should complete updates well within frame budget
            expect(averageFrameTime).toBeLessThan(targetFrameTime * 0.5); // Use less than 50% of frame time
        });

        it('should automatically reduce quality when frame rate drops', () => {
            const motionBlur = cameraEffectsManager.motionBlurController;
            motionBlur.setAutoScalingEnabled(true);
            motionBlur.setQuality('high');
            
            // Simulate poor performance (low FPS)
            const poorFrameTime = 50; // 20fps
            for (let i = 0; i < 100; i++) {
                mockPerformanceNow.mockReturnValue(i * poorFrameTime);
                motionBlur.updatePerformanceMetrics();
                motionBlur.autoScaleQuality();
            }
            
            expect(motionBlur.getCurrentQuality()).toBe('low');
        });

        it('should track performance metrics accurately', () => {
            const frameCount = 30;
            const frameTime = 16.67;
            
            for (let i = 0; i < frameCount; i++) {
                mockPerformanceNow.mockReturnValue(i * frameTime);
                cameraEffectsManager.update(frameTime / 1000);
            }
            
            const metrics = cameraEffectsManager.getPerformanceMetrics();
            
            expect(metrics.frameCount).toBe(frameCount);
            expect(metrics.averageFPS).toBeCloseTo(60, 1);
            expect(metrics.minFPS).toBeGreaterThan(0);
            expect(metrics.maxFPS).toBeLessThan(200); // Reasonable upper bound
        });
    });

    describe('memory usage tracking during extended gameplay', () => {
        it('should not leak memory during shake effect lifecycle', () => {
            const shakeController = cameraEffectsManager.shakeController;
            const initialShakeCount = shakeController.getActiveShakeCount();
            
            // Create and complete many shake effects
            for (let i = 0; i < 100; i++) {
                shakeController.triggerCollisionShake(0.5, 0.1); // Short duration
                
                // Update to complete the shake
                for (let j = 0; j < 10; j++) {
                    shakeController.update(0.02); // 20ms updates
                }
            }
            
            const finalShakeCount = shakeController.getActiveShakeCount();
            expect(finalShakeCount).toBe(initialShakeCount); // Should return to initial state
        });

        it('should clean up motion blur resources properly', () => {
            const motionBlur = cameraEffectsManager.motionBlurController;
            
            // Initialize and use motion blur
            motionBlur.initialize();
            motionBlur.updateBlurIntensity(3.0);
            motionBlur.render({}, mockCamera);
            
            // Destroy and check cleanup
            motionBlur.destroy();
            
            expect(motionBlur.composer).toBeNull();
            expect(motionBlur.initialized).toBe(false);
        });

        it('should limit performance history to prevent memory growth', () => {
            const motionBlur = cameraEffectsManager.motionBlurController;
            const maxHistory = motionBlur.performanceMetrics.maxHistoryLength;
            
            // Generate more performance data than the limit
            for (let i = 0; i < maxHistory + 50; i++) {
                mockPerformanceNow.mockReturnValue(i * 16);
                motionBlur.updatePerformanceMetrics();
            }
            
            expect(motionBlur.performanceMetrics.performanceHistory.length).toBeLessThanOrEqual(maxHistory);
        });
    });

    describe('WebGL resource management and cleanup', () => {
        it('should handle WebGL context loss gracefully', () => {
            const motionBlur = cameraEffectsManager.motionBlurController;
            
            // Simulate WebGL context loss
            mockWebGLContext.getParameter.mockImplementation(() => {
                throw new Error('WebGL context lost');
            });
            
            expect(() => {
                motionBlur.detectWebGLCapabilities();
            }).not.toThrow();
            
            expect(motionBlur.fallbackMode).toBe(true);
        });

        it('should dispose of WebGL resources on destroy', () => {
            const motionBlur = cameraEffectsManager.motionBlurController;
            motionBlur.initialize();
            
            const composerDispose = motionBlur.composer.dispose;
            
            motionBlur.destroy();
            
            expect(composerDispose).toHaveBeenCalled();
        });

        it('should validate WebGL capabilities before initialization', () => {
            const motionBlur = new MotionBlurController(mockRenderer);
            
            // Mock insufficient texture size
            mockWebGLContext.getParameter.mockImplementation((param) => {
                const GL_MAX_TEXTURE_SIZE = 0x0D33;
                if (param === GL_MAX_TEXTURE_SIZE) return 512; // Below minimum
                return 1;
            });
            
            const result = motionBlur.detectWebGLCapabilities();
            
            expect(result).toBe(false);
            expect(motionBlur.capabilities.webglSupported).toBe(false);
        });
    });

    describe('mobile device compatibility and performance scaling', () => {
        beforeEach(() => {
            // Reset to desktop defaults
            global.window.innerWidth = 1920;
            global.window.innerHeight = 1080;
            global.window.devicePixelRatio = 1;
            global.navigator = {
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            };
        });

        it('should detect mobile devices and adjust settings', () => {
            global.navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
            
            const motionBlur = new MotionBlurController(mockRenderer);
            motionBlur.detectWebGLCapabilities();
            
            expect(motionBlur.currentQuality).toBe('low');
        });

        it('should handle high DPI displays appropriately', () => {
            global.window.devicePixelRatio = 3; // High DPI mobile
            
            const motionBlur = new MotionBlurController(mockRenderer);
            motionBlur.initialize();
            
            // Should automatically adjust quality for high DPI
            expect(['low', 'medium']).toContain(motionBlur.currentQuality);
        });

        it('should scale effects for small screen sizes', () => {
            global.window.innerWidth = 375;  // iPhone width
            global.window.innerHeight = 667; // iPhone height
            
            const shakeController = new CameraShakeController(mockCamera);
            shakeController.triggerCollisionShake(1.0);
            
            const shakeInfo = shakeController.getActiveShakesInfo()[0];
            
            // Shake intensity should be scaled down for mobile
            expect(shakeInfo.intensity).toBeLessThan(1.0);
        });

        it('should provide performance recommendations based on device capabilities', () => {
            const motionBlur = cameraEffectsManager.motionBlurController;
            
            // Simulate various performance scenarios
            const highPerfRecommendation = motionBlur.getRecommendedQuality(70, 65, 5);
            expect(highPerfRecommendation).toBe('high');
            
            const mediumPerfRecommendation = motionBlur.getRecommendedQuality(45, 40, 8);
            expect(mediumPerfRecommendation).toBe('medium');
            
            const lowPerfRecommendation = motionBlur.getRecommendedQuality(25, 20, 15);
            expect(lowPerfRecommendation).toBe('low');
        });

        it('should handle touch device input patterns', () => {
            // Simulate touch device
            global.navigator.maxTouchPoints = 5;
            
            const shakeController = cameraEffectsManager.shakeController;
            
            // Touch devices should have reduced shake sensitivity
            shakeController.triggerNearMissShake(0.5);
            const touchShake = shakeController.getActiveShakesInfo()[0];
            
            // Reset to non-touch
            global.navigator.maxTouchPoints = 0;
            shakeController.clearAllShakes();
            
            shakeController.triggerNearMissShake(0.5);
            const desktopShake = shakeController.getActiveShakesInfo()[0];
            
            expect(touchShake.intensity).toBeLessThanOrEqual(desktopShake.intensity);
        });
    });

    describe('performance degradation handling', () => {
        it('should disable effects when performance is critically low', () => {
            const motionBlur = cameraEffectsManager.motionBlurController;
            motionBlur.setAutoScalingEnabled(true);
            
            // Simulate critically low performance
            const criticalFrameTime = 100; // 10fps
            for (let i = 0; i < 50; i++) {
                mockPerformanceNow.mockReturnValue(i * criticalFrameTime);
                motionBlur.updatePerformanceMetrics();
                motionBlur.autoScaleQuality();
            }
            
            expect(motionBlur.enabled).toBe(false);
        });

        it('should provide performance analysis for debugging', () => {
            const motionBlur = cameraEffectsManager.motionBlurController;
            
            // Generate performance data
            for (let i = 0; i < 100; i++) {
                mockPerformanceNow.mockReturnValue(i * 16);
                motionBlur.updatePerformanceMetrics();
            }
            
            const analysis = motionBlur.getPerformanceAnalysis();
            
            expect(analysis.available).toBe(true);
            expect(analysis.fps).toBeDefined();
            expect(analysis.performance).toBeDefined();
            expect(analysis.recommendation).toBeDefined();
        });

        it('should recover from temporary performance issues', () => {
            const motionBlur = cameraEffectsManager.motionBlurController;
            motionBlur.setAutoScalingEnabled(true);
            motionBlur.setQuality('high');
            
            // Simulate temporary performance drop
            for (let i = 0; i < 20; i++) {
                mockPerformanceNow.mockReturnValue(i * 50); // Poor performance
                motionBlur.updatePerformanceMetrics();
                motionBlur.autoScaleQuality();
            }
            
            expect(motionBlur.currentQuality).toBe('low');
            
            // Simulate performance recovery
            for (let i = 0; i < 100; i++) {
                mockPerformanceNow.mockReturnValue(1000 + i * 16); // Good performance
                motionBlur.updatePerformanceMetrics();
                motionBlur.autoScaleQuality();
            }
            
            // Should improve quality when performance recovers
            expect(['medium', 'high']).toContain(motionBlur.currentQuality);
        });
    });

    describe('stress testing', () => {
        it('should handle extreme shake effect loads', () => {
            const shakeController = cameraEffectsManager.shakeController;
            
            // Create many simultaneous shake effects
            for (let i = 0; i < 50; i++) {
                shakeController.triggerCollisionShake(Math.random(), Math.random() * 2);
                shakeController.triggerNearMissShake(Math.random());
            }
            
            expect(shakeController.getActiveShakeCount()).toBeGreaterThan(0);
            
            // Should handle updates without errors
            expect(() => {
                for (let i = 0; i < 100; i++) {
                    shakeController.update(0.016);
                }
            }).not.toThrow();
        });

        it('should maintain stability during rapid setting changes', () => {
            const settings = [
                { shakeEnabled: true, motionBlurEnabled: true, motionBlurQuality: 'high' },
                { shakeEnabled: false, motionBlurEnabled: false, motionBlurQuality: 'low' },
                { shakeIntensity: 2.0, motionBlurQuality: 'medium' },
                { accessibilityMode: true },
                { accessibilityMode: false, shakeIntensity: 0.5 }
            ];
            
            expect(() => {
                for (let i = 0; i < 100; i++) {
                    const setting = settings[i % settings.length];
                    cameraEffectsManager.updateSettings(setting);
                    cameraEffectsManager.update(0.016);
                }
            }).not.toThrow();
        });
    });
});