/**
 * @jest-environment jsdom
 */

const { PostProcessingPipeline } = require('@/rendering/PostProcessingPipeline.js');

describe('PostProcessingPipeline', () => {
    let pipeline;
    let mockRenderer;
    let mockScene;
    let mockCamera;
    let mockComposer;
    let mockRenderPass;
    let mockBloomPass;

    beforeAll(() => {
        // Mock window dimensions
        global.window.innerWidth = 1920;
        global.window.innerHeight = 1080;

        // Mock EffectComposer
        mockComposer = {
            addPass: jest.fn(),
            render: jest.fn(),
            setSize: jest.fn(),
            dispose: jest.fn(),
            passes: [],
        };
        global.THREE.EffectComposer = jest.fn().mockImplementation(() => mockComposer);

        // Mock RenderPass
        mockRenderPass = {
            dispose: jest.fn(),
        };
        global.THREE.RenderPass = jest.fn().mockImplementation(() => mockRenderPass);

        // Mock UnrealBloomPass
        mockBloomPass = {
            strength: 1.0,
            radius: 0.4,
            threshold: 0.85,
            resolution: { x: 1920, y: 1080 },
            renderToScreen: false,
            dispose: jest.fn(),
        };
        global.THREE.UnrealBloomPass = jest.fn().mockImplementation(() => mockBloomPass);

        // Mock Vector2
        global.THREE.Vector2 = jest.fn().mockImplementation((x, y) => ({
            x: x || 0,
            y: y || 0,
        }));
    });

    beforeEach(() => {
        // Reset mock call counts
        jest.clearAllMocks();

        // Create fresh mock objects that will be returned by constructors
        mockComposer = {
            addPass: jest.fn(),
            render: jest.fn(),
            setSize: jest.fn(),
            dispose: jest.fn(),
            passes: [],
        };

        mockRenderPass = {
            dispose: jest.fn(),
        };

        mockBloomPass = {
            strength: 1.0,
            radius: 0.4,
            threshold: 0.85,
            resolution: { x: 1920, y: 1080 },
            renderToScreen: false,
            dispose: jest.fn(),
        };

        // Update constructor mocks to return our fresh objects
        global.THREE.EffectComposer.mockReturnValue(mockComposer);
        global.THREE.RenderPass.mockReturnValue(mockRenderPass);
        global.THREE.UnrealBloomPass.mockReturnValue(mockBloomPass);

        // Mock renderer
        mockRenderer = {
            getSize: jest.fn((v) => {
                if (v) {
                    v.x = 1920;
                    v.y = 1080;
                    return v;
                }
                return { x: 1920, y: 1080 };
            }),
            render: jest.fn(),
            getContext: jest.fn().mockReturnValue({
                getError: () => 0,
                NO_ERROR: 0,
            }),
        };

        mockScene = {};
        mockCamera = {};

        pipeline = new PostProcessingPipeline(mockRenderer, mockScene, mockCamera);
    });

    describe('Initialization', () => {
        test('should initialize successfully', () => {
            const result = pipeline.initialize();

            expect(result).toBe(true);
            expect(pipeline.initialized).toBe(true);
            expect(pipeline.composer).toBeDefined();
            expect(pipeline.composer).toBe(mockComposer);
            expect(THREE.EffectComposer).toHaveBeenCalledWith(mockRenderer);
            expect(mockComposer.setSize).toHaveBeenCalledWith(1920, 1080);
        });

        test('should create render pass and bloom pass', () => {
            pipeline.initialize();

            expect(THREE.RenderPass).toHaveBeenCalledWith(mockScene, mockCamera);
            expect(THREE.UnrealBloomPass).toHaveBeenCalled();
            expect(mockComposer.addPass).toHaveBeenCalledTimes(2);
            expect(pipeline.renderPass).toBe(mockRenderPass);
            expect(pipeline.bloomPass).toBe(mockBloomPass);
        });

        test('should handle initialization failure gracefully', () => {
            // Temporarily remove EffectComposer to trigger error
            const originalComposer = global.THREE.EffectComposer;
            global.THREE.EffectComposer = undefined;

            const result = pipeline.initialize();

            expect(result).toBe(false);
            expect(pipeline.initialized).toBe(false);

            // Restore
            global.THREE.EffectComposer = originalComposer;
        });
    });

    describe('Quality Settings', () => {
        beforeEach(() => {
            pipeline.initialize();
        });

        test('should set quality to medium', () => {
            pipeline.setQuality('medium');

            expect(pipeline.currentQuality).toBe('medium');
            // Check that Vector2 was called with correct dimensions
            const vector2Calls = THREE.Vector2.mock.calls;
            const lastCall = vector2Calls[vector2Calls.length - 1];
            expect(lastCall[0]).toBe(1440); // 1920 * 0.75
            expect(lastCall[1]).toBe(810); // 1080 * 0.75
        });

        test('should set quality to low', () => {
            pipeline.setQuality('low');

            expect(pipeline.currentQuality).toBe('low');
            // Check that Vector2 was called with correct dimensions
            const vector2Calls = THREE.Vector2.mock.calls;
            const lastCall = vector2Calls[vector2Calls.length - 1];
            expect(lastCall[0]).toBe(960); // 1920 * 0.5
            expect(lastCall[1]).toBe(540); // 1080 * 0.5
        });

        test('should handle invalid quality level', () => {
            const originalQuality = pipeline.currentQuality;
            pipeline.setQuality('invalid');

            expect(pipeline.currentQuality).toBe(originalQuality);
        });
    });

    describe('Bloom Configuration', () => {
        beforeEach(() => {
            pipeline.initialize();
        });

        test('should set bloom strength', () => {
            pipeline.setBloomStrength(1.5);

            expect(pipeline.bloomPass.strength).toBe(1.5);
            expect(pipeline.bloomConfig.strength).toBe(1.5);
        });

        test('should clamp bloom strength to valid range', () => {
            pipeline.setBloomStrength(3.0);
            expect(pipeline.bloomPass.strength).toBe(2.0);

            pipeline.setBloomStrength(-1.0);
            expect(pipeline.bloomPass.strength).toBe(0);
        });

        test('should configure bloom parameters', () => {
            pipeline.configureBloomParameters({
                threshold: 0.9,
                radius: 0.5,
            });

            expect(pipeline.bloomPass.threshold).toBe(0.9);
            expect(pipeline.bloomPass.radius).toBe(0.5);
        });

        test('should get bloom config', () => {
            const config = pipeline.getBloomConfig();

            expect(config.strength).toBe(1.0);
            expect(config.threshold).toBe(0.85);
            expect(config.radius).toBe(0.4);
        });
    });

    describe('Rendering', () => {
        test('should render through composer when initialized', () => {
            pipeline.initialize();
            pipeline.render();

            expect(mockComposer.render).toHaveBeenCalled();
            expect(mockRenderer.render).not.toHaveBeenCalled();
        });

        test('should fallback to renderer when not initialized', () => {
            pipeline.render();

            expect(mockRenderer.render).toHaveBeenCalledWith(mockScene, mockCamera);
        });

        test('should fallback to renderer on composer failure', () => {
            pipeline.initialize();
            mockComposer.render.mockImplementation(() => {
                throw new Error('Composer error');
            });

            pipeline.render();

            expect(mockRenderer.render).toHaveBeenCalledWith(mockScene, mockCamera);
        });
    });

    describe('Resize Handling', () => {
        beforeEach(() => {
            pipeline.initialize();
        });

        test('should handle resize', () => {
            pipeline.resize(1280, 720);

            expect(mockComposer.setSize).toHaveBeenCalledWith(1280, 720);
            // Check that Vector2 was called with correct dimensions
            const vector2Calls = THREE.Vector2.mock.calls;
            const lastCall = vector2Calls[vector2Calls.length - 1];
            expect(lastCall[0]).toBe(1280);
            expect(lastCall[1]).toBe(720);
        });

        test('should apply quality scaling on resize', () => {
            pipeline.setQuality('medium');
            jest.clearAllMocks(); // Clear previous Vector2 calls
            pipeline.resize(1600, 900);

            // Check that Vector2 was called with scaled dimensions
            const vector2Calls = THREE.Vector2.mock.calls;
            const lastCall = vector2Calls[vector2Calls.length - 1];
            expect(lastCall[0]).toBe(1200); // 1600 * 0.75
            expect(lastCall[1]).toBe(675); // 900 * 0.75
        });

        test('should not resize if not initialized', () => {
            const uninitializedPipeline = new PostProcessingPipeline(
                mockRenderer,
                mockScene,
                mockCamera
            );
            jest.clearAllMocks(); // Clear mocks from construction
            uninitializedPipeline.resize(1280, 720);

            // Should not throw or call composer methods
            expect(mockComposer.setSize).not.toHaveBeenCalled();
        });
    });

    describe('State Management', () => {
        beforeEach(() => {
            pipeline.initialize();
        });

        test('should get current quality', () => {
            expect(pipeline.getCurrentQuality()).toBe('high');

            pipeline.setQuality('low');
            expect(pipeline.getCurrentQuality()).toBe('low');
        });

        test('should get status', () => {
            const status = pipeline.getStatus();

            expect(status.initialized).toBe(true);
            expect(status.enabled).toBe(true);
            expect(status.quality).toBe('high');
            expect(status.bloomStrength).toBe(1.0);
        });

        test('should enable/disable pipeline', () => {
            pipeline.setEnabled(false);
            expect(pipeline.enabled).toBe(false);

            pipeline.setEnabled(true);
            expect(pipeline.enabled).toBe(true);
        });

        test('should reset to default settings', () => {
            pipeline.setBloomStrength(1.5);
            pipeline.setQuality('low');

            pipeline.reset();

            expect(pipeline.bloomPass.strength).toBe(1.0);
            expect(pipeline.currentQuality).toBe('high');
        });
    });

    describe('Resource Cleanup', () => {
        test('should dispose resources', () => {
            pipeline.initialize();

            const composer = pipeline.composer;
            const renderPass = pipeline.renderPass;
            const bloomPass = pipeline.bloomPass;

            // Add passes to composer.passes for disposal
            composer.passes = [renderPass, bloomPass];

            pipeline.dispose();

            expect(renderPass.dispose).toHaveBeenCalled();
            expect(bloomPass.dispose).toHaveBeenCalled();
            expect(composer.dispose).toHaveBeenCalled();
            expect(pipeline.composer).toBeNull();
            expect(pipeline.initialized).toBe(false);
        });

        test('should handle disposal errors gracefully', () => {
            pipeline.initialize();
            const composerRef = pipeline.composer;
            composerRef.dispose.mockImplementation(() => {
                throw new Error('Disposal error');
            });

            expect(() => pipeline.dispose()).not.toThrow();
            // Composer is NOT nulled when disposal throws
            expect(pipeline.composer).not.toBeNull();
        });
    });
});
