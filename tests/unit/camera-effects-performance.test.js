/**
 * Performance and Compatibility Tests for Camera Effects System
 */

// Use existing jsdom environment
const { CameraEffectsManager } = require('@/effects/CameraEffectsManager.js');
const { MotionBlurController } = require('@/effects/MotionBlurController.js');
const { CameraShakeController } = require('@/effects/CameraShakeController.js');

describe('Camera Effects Performance Tests', () => {
    let cameraEffectsManager;
    let mockCamera;
    let mockRenderer;
    let currentTime = 0;
    let performanceNowSpy;
    let dateNowSpy;

    beforeAll(() => {
        // Add missing classes to THREE mock for post-processing
        global.THREE.EffectComposer = jest.fn().mockImplementation(() => ({
            setSize: jest.fn(),
            addPass: jest.fn(),
            render: jest.fn(),
            dispose: jest.fn(),
            passes: [],
        }));
        global.THREE.RenderPass = jest.fn().mockImplementation(() => ({ dispose: jest.fn() }));
        global.THREE.ShaderPass = jest.fn().mockImplementation((shader) => ({
            uniforms: shader.uniforms || {
                intensity: { value: 0.0 },
                velocityFactor: { value: 0.5 },
                samples: { value: 32 },
            },
            dispose: jest.fn(),
        }));
        global.THREE.Vector2 = jest.fn().mockImplementation((x, y) => ({ x: x || 0, y: y || 0 }));
        global.THREE.WebGLRenderer = jest.fn().mockImplementation(() => ({
            render: jest.fn(),
            setClearColor: jest.fn(),
            setSize: jest.fn(),
            getSize: jest.fn((v) => {
                if (v) {
                    v.x = 1920;
                    v.y = 1080;
                    return v;
                }
                return { x: 1920, y: 1080 };
            }),
            info: { render: { calls: 0 }, memory: { geometries: 0, textures: 0 } },
        }));
    });

    beforeEach(() => {
        currentTime = 0;
        performanceNowSpy = jest.spyOn(performance, 'now').mockImplementation(() => currentTime);
        dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => currentTime);

        // Ensure navigator is mocked
        if (typeof navigator === 'undefined') {
            global.navigator = { userAgent: 'desktop' };
        }
        jest.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        );

        mockCamera = new THREE.PerspectiveCamera();
        mockRenderer = new THREE.WebGLRenderer();

        // Mock getParameter for common constants
        const mockGL = {
            getParameter: jest.fn().mockImplementation((param) => {
                if (param === 0x0d33) return 4096; // MAX_TEXTURE_SIZE
                if (param === 0x84e8) return 4096; // MAX_RENDERBUFFER_SIZE
                if (param === 0x1f02) return 'WebGL 1.0'; // VERSION
                if (param === 0x1f01) return 'Mock Renderer'; // RENDERER
                return 1;
            }),
            getExtension: jest.fn().mockReturnValue({}),
            MAX_TEXTURE_SIZE: 0x0d33,
            MAX_RENDERBUFFER_SIZE: 0x84e8,
            VERSION: 0x1f02,
            RENDERER: 0x1f01,
        };

        jest.spyOn(document, 'createElement').mockImplementation((tag) => {
            return {
                getContext: jest.fn().mockReturnValue(mockGL),
                style: {},
                appendChild: jest.fn(),
                innerHTML: '',
            };
        });

        cameraEffectsManager = new CameraEffectsManager(mockCamera, mockRenderer, {});
        cameraEffectsManager.initialize();
        cameraEffectsManager.motionBlurController.initialize();

        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should track performance metrics accurately', () => {
        const frameCount = 30;
        const frameTime = 16.67;

        currentTime = 0;
        cameraEffectsManager.update(0);

        for (let i = 1; i <= frameCount; i++) {
            currentTime += frameTime;
            cameraEffectsManager.update(frameTime / 1000);
        }

        const metrics = cameraEffectsManager.getPerformanceMetrics();
        // currentFPS is 1000 / averageFrameTime. averageFrameTime should be around 16.67
        expect(metrics.currentFPS).toBeCloseTo(60, 0);
    });

    it('should automatically reduce quality when frame rate drops', () => {
        const motionBlur = cameraEffectsManager.motionBlurController;
        motionBlur.setEnabled(true);
        motionBlur.setQuality('high');

        const poorFrameTime = 100; // 10fps
        for (let i = 0; i < 200; i++) {
            currentTime += poorFrameTime;
            cameraEffectsManager.update(poorFrameTime / 1000);

            if (i % 50 === 0) {
                const metrics =
                    cameraEffectsManager.degradationManager.monitor.getPerformanceMetrics();
                console.log(
                    `DEBUG: i=${i} currentTime=${currentTime} fps=${metrics.currentFPS} poorFrames=${metrics.consecutivePoorFrames} level=${cameraEffectsManager.degradationManager.degradationState.currentLevel}`
                );
            }
        }

        // Level 2 reached, quality set to low
        expect(motionBlur.getCurrentQuality()).toBe('low');
    });

    it('should handle WebGL context loss gracefully', () => {
        const motionBlur = new MotionBlurController(mockRenderer);

        jest.spyOn(document, 'createElement').mockImplementation(() => ({
            getContext: () => ({
                getParameter: () => {
                    throw new Error('lost');
                },
                MAX_TEXTURE_SIZE: 0x0d33,
            }),
        }));

        motionBlur.initialize();
        expect(motionBlur.fallbackMode).toBe(true);
    });

    it('should dispose of WebGL resources on destroy', () => {
        const motionBlur = new MotionBlurController(mockRenderer);
        motionBlur.initialize();
        const composer = motionBlur.composer;
        const spy = jest.spyOn(composer, 'dispose');
        motionBlur.destroy();
        expect(spy).toHaveBeenCalled();
    });

    it('should detect mobile devices and adjust settings', () => {
        jest.spyOn(navigator, 'userAgent', 'get').mockReturnValue('iPhone');
        const motionBlur = new MotionBlurController(mockRenderer);
        motionBlur.detectWebGLCapabilities();
        expect(motionBlur.currentQuality).toBe('low');
    });

    it('should disable effects when performance is critically low', () => {
        const motionBlur = cameraEffectsManager.motionBlurController;
        motionBlur.setEnabled(true);

        const criticalFrameTime = 100;
        for (let i = 0; i < 150; i++) {
            currentTime += criticalFrameTime;
            cameraEffectsManager.update(criticalFrameTime / 1000);
        }

        expect(motionBlur.enabled).toBe(false);
    });

    it('should recover from temporary performance issues', () => {
        const motionBlur = cameraEffectsManager.motionBlurController;
        motionBlur.setEnabled(true);
        motionBlur.setQuality('high');

        for (let i = 0; i < 150; i++) {
            currentTime += 50;
            cameraEffectsManager.update(0.05);
        }
        expect(motionBlur.currentQuality).toBe('low');

        for (let i = 0; i < 500; i++) {
            currentTime += 16;
            cameraEffectsManager.update(0.016);
        }
        expect(['medium', 'high']).toContain(motionBlur.currentQuality);
    });
});
