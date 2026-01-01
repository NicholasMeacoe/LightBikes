/**
 * Customization Visual Integration Tests
 */

jest.mock('@/utils/Logger.js', () => {
    const mockLoggerInstance = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    };
    const MockLoggerClass = jest.fn(() => mockLoggerInstance);
    MockLoggerClass.create = jest.fn(() => mockLoggerInstance);
    return {
        Logger: MockLoggerClass,
        logger: mockLoggerInstance,
        createLogger: jest.fn(() => mockLoggerInstance),
    };
});

// Setup global THREE mock robustly
global.THREE = {
    Scene: class {
        add = jest.fn();
        remove = jest.fn();
        traverse = jest.fn();
    },
    Vector3: class {
        constructor(x = 0, y = 0, z = 0) {
            this.x = x;
            this.y = y;
            this.z = z;
        }
        set = jest.fn();
        copy = jest.fn();
        clone = function () {
            return new global.THREE.Vector3(this.x, this.y, this.z);
        };
    },
    Color: jest.fn(() => ({ getHex: () => 0x00ff00, setHex: jest.fn() })),
    BoxGeometry: class {},
    SphereGeometry: class {},
    MeshBasicMaterial: class {},
    MeshLambertMaterial: class {
        dispose = jest.fn();
    },
    Mesh: class {
        constructor() {
            this.position = { set: jest.fn(), copy: jest.fn() };
            this.material = { dispose: jest.fn() };
        }
    },
};

jest.mock('@/systems/ThemeEngine.js', () => ({
    ThemeEngine: jest.fn().mockImplementation(() => ({
        loadTheme: jest.fn(),
        isValidTheme: jest.fn(() => true),
        getAvailableThemes: jest.fn(() => ['classic-grid', 'neon-city']),
    })),
}));

describe('Customization Visual Integration', () => {
    let CustomizationManager, PreferenceStorage;
    let customizationManager, preferenceStorage;
    let mockRenderingEngine;

    beforeEach(() => {
        jest.resetModules();
        CustomizationManager = require('@/systems/CustomizationManager.js').CustomizationManager;
        PreferenceStorage = require('@/systems/PreferenceStorage.js').PreferenceStorage;

        mockRenderingEngine = {
            scene: new global.THREE.Scene(),
            renderer: { setClearColor: jest.fn() },
            emissiveMaterialSystem: {
                updateBikeMaterial: jest.fn(),
                updateTrailMaterialTemplate: jest.fn(),
            },
            trailStyleRenderer: { setTrailStyle: jest.fn(), getTrailStyle: jest.fn(() => 'solid') },
            camera: { position: { x: 0, y: 0, z: 0 } },
        };

        preferenceStorage = new PreferenceStorage();
        customizationManager = new CustomizationManager(mockRenderingEngine, preferenceStorage);
    });

    it('should initialize successfully', () => {
        expect(customizationManager).toBeDefined();
    });

    it('should set bike color', () => {
        const result = customizationManager.setBikeColor('player', '#FF0000');
        expect(result).toBe(true);
    });
});
