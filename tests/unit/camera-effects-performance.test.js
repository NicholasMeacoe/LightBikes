/**
 * Performance and Compatibility Tests for Camera Effects System
 */

const { CameraEffectsManager } = require('@/effects/CameraEffectsManager.js');
const { MotionBlurController } = require('@/effects/MotionBlurController.js');
const { CameraShakeController } = require('@/effects/CameraShakeController.js');

// Setup global THREE mock robustly
global.THREE = {
    PerspectiveCamera: class {
        constructor() {
            this.position = {
                x: 0,
                y: 0,
                z: 0,
                set: jest.fn(),
                copy: jest.fn(),
                clone: () => ({ x: 0, y: 0, z: 0 }),
            };
        }
    },
    Vector2: class {
        constructor(x = 0, y = 0) {
            this.x = x;
            this.y = y;
        }
    },
    Vector3: class {
        constructor(x = 0, y = 0, z = 0) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.set = jest.fn();
            this.copy = jest.fn();
            this.clone = () => new global.THREE.Vector3(this.x, this.y, this.z);
        }
    },
    WebGLRenderer: class {
        constructor() {
            this.render = jest.fn();
            this.setSize = jest.fn();
            this.setClearColor = jest.fn();
            this.getSize = jest.fn((v) => {
                if (v) {
                    v.x = 1920;
                    v.y = 1080;
                    return v;
                }
                return { x: 1920, y: 1080 };
            });
            this.domElement = document.createElement('canvas');
            this.info = { render: { calls: 0 }, memory: { geometries: 0, textures: 0 } };
        }
    },
    EffectComposer: class {
        constructor() {
            this.setSize = jest.fn();
            this.addPass = jest.fn();
            this.render = jest.fn();
            this.dispose = jest.fn();
            this.passes = [];
        }
    },
    RenderPass: class {
        constructor() {
            this.dispose = jest.fn();
        }
    },
    ShaderPass: class {
        constructor(shader) {
            this.uniforms = shader.uniforms || {
                intensity: { value: 0.0 },
                velocityFactor: { value: 0.5 },
                samples: { value: 32 },
            };
            this.dispose = jest.fn();
        }
    },
};

describe('Camera Effects Performance Tests', () => {
    let cameraEffectsManager;
    let mockCamera;
    let mockRenderer;
    let currentTime = 0;
    let performanceNowSpy;
    let dateNowSpy;

    beforeEach(() => {
        currentTime = 0;
        performanceNowSpy = jest.spyOn(performance, 'now').mockImplementation(() => currentTime);
        dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => currentTime);

        // Ensure navigator is mocked
        if (typeof navigator === 'undefined') {
            global.navigator = { userAgent: 'desktop' };
        }

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
            if (tag === 'canvas') {
                return {
                    getContext: jest.fn().mockReturnValue(mockGL),
                    style: {},
                    appendChild: jest.fn(),
                    innerHTML: '',
                    width: 1920,
                    height: 1080,
                };
            }
            return {
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
