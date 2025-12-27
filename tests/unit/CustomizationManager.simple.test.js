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

const { CustomizationManager } = require('@/systems/CustomizationManager.js');

// Mock Three.js
global.THREE = {
    MeshBasicMaterial: jest.fn().mockImplementation(() => ({})),
    BoxGeometry: jest.fn().mockImplementation(() => ({ dispose: jest.fn() })),
    SphereGeometry: jest.fn().mockImplementation(() => ({ dispose: jest.fn() })),
    OctahedronGeometry: jest.fn().mockImplementation(() => ({ dispose: jest.fn() })),
    ConeGeometry: jest.fn().mockImplementation(() => ({ dispose: jest.fn() })),
    IcosahedronGeometry: jest.fn().mockImplementation(() => ({ dispose: jest.fn() })),
    MeshLambertMaterial: jest.fn().mockImplementation((options) => ({
        color: options.color,
        dispose: jest.fn(),
        needsUpdate: false,
    })),
    LineBasicMaterial: jest.fn().mockImplementation((options) => ({
        color: options.color,
        opacity: options.opacity,
        transparent: options.transparent,
        dispose: jest.fn(),
    })),
    GridHelper: jest.fn().mockImplementation(() => ({
        material: {
            color: { setHex: jest.fn() },
            opacity: 0.3,
            transparent: true,
            emissive: { setHex: jest.fn() },
            emissiveIntensity: 0,
        },
    })),
    BoxHelper: jest.fn().mockImplementation(() => ({
        material: {
            color: 0x00ffff,
            opacity: 0.3,
            transparent: true,
        },
    })),
    Mesh: jest.fn().mockImplementation(() => ({})),
    Color: jest.fn().mockImplementation(() => ({})),
    AmbientLight: jest.fn().mockImplementation(() => ({
        color: { setHex: jest.fn() },
        intensity: 0.6,
        isAmbientLight: true,
    })),
    DirectionalLight: jest.fn().mockImplementation(() => ({
        color: { setHex: jest.fn() },
        intensity: 0.8,
        position: { set: jest.fn() },
        isDirectionalLight: true,
    })),
};

// Mock performance.now
global.performance = { now: jest.fn().mockReturnValue(1000) };

// Mock dependencies
const mockRenderingEngine = {
    emissiveMaterialSystem: {
        updateBikeMaterial: jest.fn(),
        updateTrailMaterialTemplate: jest.fn(),
    },
    scene: {
        add: jest.fn(),
        remove: jest.fn(),
        traverse: jest.fn(),
        background: null,
    },
    renderer: {
        info: {
            render: { calls: 10, setClearColor: jest.fn() },
            memory: { geometries: 5, textures: 3 },
        },
    },
    camera: { position: { x: 0, y: 20, z: 20 } },
    player: { material: null },
    trailStyleRenderer: {
        setTrailStyle: jest.fn(),
    },
};

const mockPreferenceStorage = {
    loadPreferences: jest.fn(),
    savePreferences: jest.fn(),
};

describe('CustomizationManager', () => {
    let customizationManager;

    beforeEach(() => {
        jest.clearAllMocks();
        customizationManager = new CustomizationManager(mockRenderingEngine, mockPreferenceStorage);
    });

    describe('constructor', () => {
        it('should initialize with default state', () => {
            const state = customizationManager.getCurrentState();

            expect(state.bikeColor).toBe('#00FF00');
            expect(state.trailColor).toBe('#00FF00');
            expect(state.trailStyle).toBe('solid');
            expect(state.arenaTheme).toBe('classic-grid');
        });

        it('should initialize performance optimizer when rendering engine is available', () => {
            expect(customizationManager.performanceOptimizer).toBeDefined();
        });
    });

    describe('setBikeColor', () => {
        it('should set valid bike color for player', () => {
            const result = customizationManager.setBikeColor('player', '#FF0000');

            expect(result).toBe(true);
            expect(customizationManager.getCurrentState().bikeColor).toBe('#FF0000');
        });

        it('should reject invalid bike color format', () => {
            const result = customizationManager.setBikeColor('player', 'invalid-color');

            expect(result).toBe(false);
            expect(customizationManager.getCurrentState().bikeColor).toBe('#00FF00');
        });
    });

    describe('setTrailColor', () => {
        it('should set valid trail color for player', () => {
            const result = customizationManager.setTrailColor('player', '#0000FF');

            expect(result).toBe(true);
            expect(customizationManager.getCurrentState().trailColor).toBe('#0000FF');
        });
    });

    describe('setTrailStyle', () => {
        it('should set valid trail style', () => {
            const result = customizationManager.setTrailStyle('player', 'glowing');

            expect(result).toBe(true);
            expect(customizationManager.getCurrentState().trailStyle).toBe('glowing');
        });
    });

    describe('performance optimization integration', () => {
        it('should get performance metrics', () => {
            if (!customizationManager.performanceOptimizer) {
                customizationManager.performanceOptimizer = {};
            }

            customizationManager.performanceOptimizer.getPerformanceMetrics = jest
                .fn()
                .mockReturnValue({
                    frameTime: 16,
                    drawCalls: 10,
                    materialCount: 5,
                });

            const metrics = customizationManager.getPerformanceMetrics();

            expect(metrics).toEqual({
                frameTime: 16,
                drawCalls: 10,
                materialCount: 5,
            });
        });

        it('should check performance acceptability', () => {
            if (!customizationManager.performanceOptimizer) {
                customizationManager.performanceOptimizer = {};
            }

            customizationManager.performanceOptimizer.isPerformanceAcceptable = jest
                .fn()
                .mockReturnValue(true);

            const isAcceptable = customizationManager.isPerformanceAcceptable();

            expect(isAcceptable).toBe(true);
        });
    });

    describe('utility methods', () => {
        it('should validate color format', () => {
            expect(customizationManager.validateColor('#FF0000')).toBe(true);
            expect(customizationManager.validateColor('#00ff00')).toBe(true);
            expect(customizationManager.validateColor('FF0000')).toBe(false);
            expect(customizationManager.validateColor('#GG0000')).toBe(false);
            expect(customizationManager.validateColor(null)).toBe(false);
        });

        it('should get color presets', () => {
            const presets = customizationManager.getColorPresets();

            expect(presets).toHaveProperty('red', '#FF0000');
            expect(presets).toHaveProperty('green', '#00FF00');
            expect(presets).toHaveProperty('blue', '#0000FF');
        });
    });
});
