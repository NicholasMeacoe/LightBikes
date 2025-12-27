/**
 * Comprehensive Tests for GlowEffectManager
 * Tests initialization, update logic, material creation, and error handling
 */

// Mock Logger
const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
};

jest.mock('@/utils/Logger.js', () => ({
    logger: mockLogger,
}));

// Stable mock instances for sub-systems
const mockPostProcessing = {
    initialize: jest.fn(),
    render: jest.fn(),
    resize: jest.fn(),
    configureBloomParameters: jest.fn(),
    dispose: jest.fn(),
    setBloomStrength: jest.fn(),
    getStatus: jest.fn(),
    setBloomThreshold: jest.fn(),
    setBloomRadius: jest.fn(),
};

const mockMaterialSystem = {
    createBikeMaterial: jest.fn(),
    createTrailMaterial: jest.fn(),
    updatePulseAnimation: jest.fn(),
    pausePulse: jest.fn(),
    resumePulse: jest.fn(),
    dispose: jest.fn(),
    materials: new Map(),
    pulseState: { time: 0, paused: false, intensity: 1.0 },
    setEmissiveIntensity: jest.fn(),
    setGlobalIntensityMultiplier: jest.fn(),
};

const mockPerformanceScaler = {
    monitorPerformance: jest.fn(),
    currentQuality: 'high',
    setQuality: jest.fn(),
    dispose: jest.fn(),
    setOnQualityChange: jest.fn(),
    setOnPerformanceWarning: jest.fn(),
    scalingEnabled: true,
};

const mockSettings = {
    load: jest.fn(),
    setIntensity: jest.fn(),
    getIntensity: jest.fn(),
    apply: jest.fn(),
};

// Apply mocks before requiring GlowEffectManager
jest.mock('@/rendering/PostProcessingPipeline.js', () => ({
    PostProcessingPipeline: jest.fn(),
}));

jest.mock('@/rendering/EmissiveMaterialSystem.js', () => ({
    EmissiveMaterialSystem: jest.fn(),
}));

jest.mock('@/utils/PerformanceScaler.js', () => ({
    PerformanceScaler: jest.fn(),
}));

jest.mock('@/systems/GlowSettings.js', () => ({
    GlowSettings: jest.fn(),
}));

const { GlowEffectManager } = require('@/rendering/GlowEffectManager.js');

describe('GlowEffectManager', () => {
    let glowEffectManager;
    let mockRenderer;
    let mockScene = {};
    let mockCamera = {};

    beforeEach(() => {
        // Re-apply mock implementations because of resetMocks: true
        const { PostProcessingPipeline } = require('@/rendering/PostProcessingPipeline.js');
        PostProcessingPipeline.mockImplementation(() => mockPostProcessing);

        const { EmissiveMaterialSystem } = require('@/rendering/EmissiveMaterialSystem.js');
        EmissiveMaterialSystem.mockImplementation(() => mockMaterialSystem);

        const { PerformanceScaler } = require('@/utils/PerformanceScaler.js');
        PerformanceScaler.mockImplementation(() => mockPerformanceScaler);

        const { GlowSettings } = require('@/systems/GlowSettings.js');
        GlowSettings.mockImplementation(() => mockSettings);

        // Reset sub-system method implementations
        jest.clearAllMocks();

        mockPostProcessing.initialize.mockReturnValue(true);
        mockPostProcessing.render.mockImplementation(() => {});
        mockPostProcessing.setBloomStrength.mockImplementation(() => {});
        mockPostProcessing.configureBloomParameters.mockImplementation(() => {});
        mockPostProcessing.dispose.mockImplementation(() => {});

        mockMaterialSystem.pausePulse.mockImplementation(() => {});
        mockMaterialSystem.resumePulse.mockImplementation(() => {});
        mockMaterialSystem.updatePulseAnimation.mockImplementation(() => {});
        mockMaterialSystem.setGlobalIntensityMultiplier.mockImplementation(() => {});
        mockMaterialSystem.dispose.mockImplementation(() => {});

        mockSettings.getIntensity.mockReturnValue('MEDIUM');
        mockSettings.apply.mockReturnValue(true);

        mockRenderer = {
            render: jest.fn(),
            getSize: jest.fn(() => ({ x: 800, y: 600 })),
        };

        // WebGL Mock
        const mockContext = {
            getParameter: jest.fn((param) => {
                if (param === 0x1f01) return 'Test Renderer';
                return 4096;
            }),
            getSupportedExtensions: jest.fn(() => [
                'OES_texture_float',
                'OES_texture_half_float',
                'WEBGL_color_buffer_float',
            ]),
            getExtension: jest.fn().mockReturnValue({}),
            RENDERER: 0x1f01,
            MAX_TEXTURE_SIZE: 0x0d33,
            MAX_RENDERBUFFER_SIZE: 0x84e8,
        };

        const mockCanvas = {
            getContext: jest.fn().mockReturnValue(mockContext),
            style: {},
        };

        jest.spyOn(document, 'createElement').mockImplementation((tag) => {
            if (tag === 'canvas') return mockCanvas;
            return {
                style: {},
                appendChild: jest.fn(),
                removeChild: jest.fn(),
                id: '',
            };
        });

        jest.spyOn(document, 'getElementById').mockReturnValue(null);

        glowEffectManager = new GlowEffectManager(mockRenderer, mockScene, mockCamera);
    });

    describe('Constructor', () => {
        it('should initialize with correct default values', () => {
            expect(glowEffectManager.renderer).toBe(mockRenderer);
            expect(glowEffectManager.initialized).toBe(false);
            expect(glowEffectManager.enabled).toBe(true);
        });
    });

    describe('Initialization', () => {
        it('should initialize successfully with WebGL support', () => {
            const result = glowEffectManager.initialize();
            expect(result).toBe(true);
            expect(glowEffectManager.initialized).toBe(true);
            expect(glowEffectManager.postProcessing).toBe(mockPostProcessing);
        });

        it('should handle WebGL failure gracefully', () => {
            jest.spyOn(document, 'createElement').mockImplementation((tag) => {
                if (tag === 'canvas') return { getContext: jest.fn().mockReturnValue(null) };
                return {};
            });

            const result = glowEffectManager.initialize();
            expect(result).toBe(true);
            expect(glowEffectManager.fallbackMode).toBe(true);
            expect(glowEffectManager.enabled).toBe(false);
        });

        it('should handle post-processing initialization failure', () => {
            mockPostProcessing.initialize.mockReturnValue(false);

            const result = glowEffectManager.initialize();
            expect(result).toBe(true);
            expect(glowEffectManager.fallbackMode).toBe(true);
        });
    });

    describe('Update Logic', () => {
        beforeEach(() => {
            glowEffectManager.initialize();
        });

        it('should update subsystems correctly', () => {
            glowEffectManager.update(0.016, { isPaused: false });
            expect(mockMaterialSystem.updatePulseAnimation).toHaveBeenCalled();
            expect(mockPerformanceScaler.monitorPerformance).toHaveBeenCalled();
        });

        it('should handle pause state changes correctly', () => {
            glowEffectManager.update(0.016, { isPaused: true });
            expect(glowEffectManager.isPaused).toBe(true);
            expect(mockMaterialSystem.pausePulse).toHaveBeenCalled();

            glowEffectManager.update(0.016, { isPaused: false });
            expect(glowEffectManager.isPaused).toBe(false);
            expect(mockMaterialSystem.resumePulse).toHaveBeenCalled();
        });

        it('should validate inputs before update', () => {
            expect(glowEffectManager.validateUpdateInputs(0.016, { isPaused: false })).toBe(true);
            expect(glowEffectManager.validateUpdateInputs(-1, { isPaused: false })).toBe(false);
            expect(glowEffectManager.validateUpdateInputs(0.016, null)).toBe(false);
        });
    });

    describe('Rendering', () => {
        beforeEach(() => {
            glowEffectManager.initialize();
        });

        it('should render with post-processing when enabled', () => {
            glowEffectManager.render();
            expect(mockPostProcessing.render).toHaveBeenCalled();
        });

        it('should fallback to standard rendering when disabled', () => {
            glowEffectManager.enabled = false;
            glowEffectManager.render();
            expect(mockRenderer.render).toHaveBeenCalled();
        });

        it('should handle rendering errors gracefully', () => {
            mockPostProcessing.render.mockImplementation(() => {
                throw new Error('Render error');
            });

            expect(() => glowEffectManager.render()).not.toThrow();
            expect(mockRenderer.render).toHaveBeenCalled();
        });
    });

    describe('Intensity Settings', () => {
        beforeEach(() => {
            glowEffectManager.initialize();
        });

        it('should set valid intensity levels', () => {
            const result = glowEffectManager.setIntensity('HIGH');
            expect(result).toBe(true);
            expect(mockPostProcessing.setBloomStrength).toHaveBeenCalled();
            expect(mockMaterialSystem.setGlobalIntensityMultiplier).toHaveBeenCalled();
        });

        it('should validate intensity levels correctly', () => {
            expect(glowEffectManager.validateIntensityLevel('HIGH')).toBe(true);
            expect(glowEffectManager.validateIntensityLevel('INVALID')).toBe(false);
        });

        it('should get correct intensity configurations', () => {
            const config = glowEffectManager.getIntensityConfig('HIGH');
            expect(config.emissive).toBe(0.8);
            expect(config.bloom).toBe(1.5);
        });
    });

    describe('Material Creation', () => {
        beforeEach(() => {
            glowEffectManager.initialize();
        });

        it('should proxy material creation to material system', () => {
            glowEffectManager.createBikeMaterial('p1', 0xff0000);
            expect(mockMaterialSystem.createBikeMaterial).toHaveBeenCalledWith('p1', 0xff0000);

            glowEffectManager.createTrailMaterial('t1', 0x00ff00);
            expect(mockMaterialSystem.createTrailMaterial).toHaveBeenCalledWith('t1', 0x00ff00);
        });
    });

    describe('Cleanup', () => {
        it('should dispose resources properly', () => {
            glowEffectManager.initialize();
            glowEffectManager.dispose();
            expect(mockPostProcessing.dispose).toHaveBeenCalled();
            expect(mockMaterialSystem.dispose).toHaveBeenCalled();
            expect(glowEffectManager.initialized).toBe(false);
        });
    });
});
