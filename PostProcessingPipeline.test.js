/**
 * PostProcessingPipeline Tests
 * Tests for the post-processing pipeline implementation
 */

// Mock Three.js components
const mockVector2 = jest.fn().mockImplementation((x, y) => ({ x, y }));
const mockRenderPass = jest.fn().mockImplementation(() => ({
    renderToScreen: false
}));
const mockUnrealBloomPass = jest.fn().mockImplementation(() => ({
    strength: 1.0,
    radius: 0.4,
    threshold: 0.85,
    resolution: new mockVector2(1920, 1080),
    renderToScreen: false
}));
const mockEffectComposer = jest.fn().mockImplementation(() => ({
    setSize: jest.fn(),
    addPass: jest.fn(),
    render: jest.fn(),
    dispose: jest.fn(),
    passes: []
}));

// Mock THREE.js globals
global.THREE = {
    Vector2: mockVector2,
    RenderPass: mockRenderPass,
    UnrealBloomPass: mockUnrealBloomPass,
    EffectComposer: mockEffectComposer
};

const { PostProcessingPipeline } = require('./PostProcessingPipeline.js');

describe('PostProcessingPipeline', () => {
    let pipeline;
    let mockRenderer;
    let mockScene;
    let mockCamera;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Create mock objects
        mockRenderer = {
            getSize: jest.fn().mockReturnValue({ x: 1920, y: 1080 }),
            render: jest.fn()
        };
        
        mockScene = {};
        mockCamera = {};
        
        // Create pipeline instance
        pipeline = new PostProcessingPipeline(mockRenderer, mockScene, mockCamera);
    });

    describe('constructor', () => {
        it('should initialize with correct properties', () => {
            expect(pipeline.renderer).toBe(mockRenderer);
            expect(pipeline.scene).toBe(mockScene);
            expect(pipeline.camera).toBe(mockCamera);
            expect(pipeline.initialized).toBe(false);
            expect(pipeline.currentQuality).toBe('high');
        });

        it('should have correct bloom configuration defaults', () => {
            expect(pipeline.bloomConfig.strength).toBe(1.0);
            expect(pipeline.bloomConfig.radius).toBe(0.4);
            expect(pipeline.bloomConfig.threshold).toBe(0.85);
        });
    });

    describe('initialize', () => {
        it('should initialize successfully with valid Three.js components', () => {
            const result = pipeline.initialize();
            
            expect(result).toBe(true);
            expect(pipeline.initialized).toBe(true);
            expect(mockEffectComposer).toHaveBeenCalledWith(mockRenderer);
            expect(mockRenderPass).toHaveBeenCalledWith(mockScene, mockCamera);
            expect(mockUnrealBloomPass).toHaveBeenCalled();
        });

        it('should fail gracefully when Three.js components are missing', () => {
            // Temporarily remove Three.js components
            const originalEffectComposer = global.THREE.EffectComposer;
            delete global.THREE.EffectComposer;
            
            const result = pipeline.initialize();
            
            expect(result).toBe(false);
            expect(pipeline.initialized).toBe(false);
            
            // Restore
            global.THREE.EffectComposer = originalEffectComposer;
        });

        it('should handle initialization errors', () => {
            // Make EffectComposer throw an error
            global.THREE.EffectComposer = jest.fn().mockImplementation(() => {
                throw new Error('Mock initialization error');
            });
            
            const result = pipeline.initialize();
            
            expect(result).toBe(false);
            expect(pipeline.initialized).toBe(false);
        });
    });

    describe('setBloomStrength', () => {
        beforeEach(() => {
            pipeline.initialize();
        });

        it('should set bloom strength correctly', () => {
            pipeline.setBloomStrength(1.5);
            
            expect(pipeline.bloomPass.strength).toBe(1.5);
            expect(pipeline.bloomConfig.strength).toBe(1.5);
        });

        it('should clamp strength to valid range', () => {
            pipeline.setBloomStrength(-0.5);
            expect(pipeline.bloomPass.strength).toBe(0);
            
            pipeline.setBloomStrength(3.0);
            expect(pipeline.bloomPass.strength).toBe(2.0);
        });

        it('should handle missing bloom pass gracefully', () => {
            pipeline.bloomPass = null;
            
            expect(() => {
                pipeline.setBloomStrength(1.0);
            }).not.toThrow();
        });
    });

    describe('configureBloomParameters', () => {
        beforeEach(() => {
            pipeline.initialize();
        });

        it('should configure threshold parameter', () => {
            pipeline.configureBloomParameters({ threshold: 0.9 });
            
            expect(pipeline.bloomPass.threshold).toBe(0.9);
            expect(pipeline.bloomConfig.threshold).toBe(0.9);
        });

        it('should configure radius parameter', () => {
            pipeline.configureBloomParameters({ radius: 0.6 });
            
            expect(pipeline.bloomPass.radius).toBe(0.6);
            expect(pipeline.bloomConfig.radius).toBe(0.6);
        });

        it('should configure both parameters', () => {
            pipeline.configureBloomParameters({ threshold: 0.8, radius: 0.5 });
            
            expect(pipeline.bloomPass.threshold).toBe(0.8);
            expect(pipeline.bloomPass.radius).toBe(0.5);
        });

        it('should clamp parameters to valid ranges', () => {
            pipeline.configureBloomParameters({ threshold: 1.5, radius: -0.2 });
            
            expect(pipeline.bloomPass.threshold).toBe(1.0);
            expect(pipeline.bloomPass.radius).toBe(0);
        });
    });

    describe('setQuality', () => {
        beforeEach(() => {
            pipeline.initialize();
        });

        it('should set quality to medium', () => {
            pipeline.setQuality('medium');
            
            expect(pipeline.currentQuality).toBe('medium');
            expect(pipeline.bloomPass.resolution.x).toBe(1440); // 1920 * 0.75
            expect(pipeline.bloomPass.resolution.y).toBe(810);  // 1080 * 0.75
        });

        it('should set quality to low', () => {
            pipeline.setQuality('low');
            
            expect(pipeline.currentQuality).toBe('low');
            expect(pipeline.bloomPass.resolution.x).toBe(960);  // 1920 * 0.5
            expect(pipeline.bloomPass.resolution.y).toBe(540);  // 1080 * 0.5
        });

        it('should handle invalid quality levels', () => {
            const originalQuality = pipeline.currentQuality;
            pipeline.setQuality('invalid');
            
            expect(pipeline.currentQuality).toBe(originalQuality);
        });
    });

    describe('render', () => {
        it('should render with post-processing when initialized', () => {
            pipeline.initialize();
            
            pipeline.render();
            
            expect(pipeline.composer.render).toHaveBeenCalled();
            expect(mockRenderer.render).not.toHaveBeenCalled();
        });

        it('should fallback to standard rendering when not initialized', () => {
            pipeline.render();
            
            expect(mockRenderer.render).toHaveBeenCalledWith(mockScene, mockCamera);
        });

        it('should fallback to standard rendering on error', () => {
            pipeline.initialize();
            pipeline.composer.render = jest.fn().mockImplementation(() => {
                throw new Error('Render error');
            });
            
            pipeline.render();
            
            expect(mockRenderer.render).toHaveBeenCalledWith(mockScene, mockCamera);
        });
    });

    describe('resize', () => {
        beforeEach(() => {
            pipeline.initialize();
        });

        it('should resize composer and bloom pass', () => {
            pipeline.resize(1280, 720);
            
            expect(pipeline.composer.setSize).toHaveBeenCalledWith(1280, 720);
            expect(pipeline.bloomPass.resolution.x).toBe(1280); // high quality = 1.0 resolution
            expect(pipeline.bloomPass.resolution.y).toBe(720);
        });

        it('should handle resize with different quality levels', () => {
            pipeline.setQuality('medium');
            pipeline.resize(1280, 720);
            
            expect(pipeline.bloomPass.resolution.x).toBe(960);  // 1280 * 0.75
            expect(pipeline.bloomPass.resolution.y).toBe(540);  // 720 * 0.75
        });

        it('should handle resize when not initialized', () => {
            pipeline.initialized = false;
            
            expect(() => {
                pipeline.resize(1280, 720);
            }).not.toThrow();
        });
    });

    describe('getStatus', () => {
        it('should return correct status when initialized', () => {
            pipeline.initialize();
            pipeline.setBloomStrength(1.2);
            
            const status = pipeline.getStatus();
            
            expect(status.initialized).toBe(true);
            expect(status.enabled).toBe(true);
            expect(status.quality).toBe('high');
            expect(status.bloomStrength).toBe(1.2);
        });

        it('should return correct status when not initialized', () => {
            const status = pipeline.getStatus();
            
            expect(status.initialized).toBe(false);
            expect(status.enabled).toBe(true);
        });
    });

    describe('dispose', () => {
        it('should dispose of resources properly', () => {
            pipeline.initialize();
            
            pipeline.dispose();
            
            expect(pipeline.composer.dispose).toHaveBeenCalled();
            expect(pipeline.initialized).toBe(false);
            expect(pipeline.composer).toBeNull();
        });

        it('should handle disposal errors gracefully', () => {
            pipeline.initialize();
            pipeline.composer.dispose = jest.fn().mockImplementation(() => {
                throw new Error('Disposal error');
            });
            
            expect(() => {
                pipeline.dispose();
            }).not.toThrow();
        });
    });

    describe('reset', () => {
        beforeEach(() => {
            pipeline.initialize();
        });

        it('should reset to default settings', () => {
            // Change settings
            pipeline.setBloomStrength(2.0);
            pipeline.setQuality('low');
            
            // Reset
            pipeline.reset();
            
            expect(pipeline.bloomConfig.strength).toBe(1.0);
            expect(pipeline.bloomConfig.radius).toBe(0.4);
            expect(pipeline.bloomConfig.threshold).toBe(0.85);
            expect(pipeline.currentQuality).toBe('high');
        });
    });
});