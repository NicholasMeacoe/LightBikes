/**
 * Customization Feature Integration Tests
 * Tests customization system integration with existing game features
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

let { logger: mockLogger } = require('@/utils/Logger.js');

// Mock ThemeEngine
jest.mock('@/systems/ThemeEngine.js', () => {
    return {
        ThemeEngine: jest.fn().mockImplementation(() => ({
            isValidTheme: jest.fn(() => true),
            loadTheme: jest.fn(),
            getAvailableThemes: jest.fn(() => [
                'classic-grid',
                'neon-city',
                'space',
                'tron-legacy',
            ]),
        })),
    };
});

// Setup global THREE mock
global.THREE = {
    Scene: class {
        add = jest.fn();
        remove = jest.fn();
        traverse = jest.fn();
    },
    Vector3: class {
        set = jest.fn();
        copy = jest.fn();
        clone = function () {
            return { x: 0, y: 0, z: 0 };
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

describe('Customization Feature Integration', () => {
    let CustomizationManager, PreferenceStorage, Game, GameModes;
    let customizationManager, preferenceStorage, game;
    let mockRenderingEngine;

    beforeEach(() => {
        jest.resetModules();

        CustomizationManager = require('@/systems/CustomizationManager.js').CustomizationManager;
        PreferenceStorage = require('@/systems/PreferenceStorage.js').PreferenceStorage;
        Game = require('@/core/game.js').Game;
        GameModes = require('@/systems/GameModes.js').GameModes;

        mockRenderingEngine = {
            emissiveMaterialSystem: {
                updateBikeMaterial: jest.fn(),
                updateTrailMaterialTemplate: jest.fn(),
            },
            trailStyleRenderer: {
                setTrailStyle: jest.fn(),
                getTrailStyle: jest.fn(() => 'solid'),
                applyStyleToSegment: jest.fn(),
            },
            scene: new global.THREE.Scene(),
            renderer: { setClearColor: jest.fn() },
        };

        preferenceStorage = new PreferenceStorage();
        customizationManager = new CustomizationManager(mockRenderingEngine, preferenceStorage);
    });

    it('should initialize successfully', () => {
        expect(customizationManager).toBeDefined();
    });

    it('should apply arena theme', () => {
        const result = customizationManager.setArenaTheme('neon-city');
        expect(result).toBe(true);
    });
});
