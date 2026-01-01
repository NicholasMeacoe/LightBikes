/**
 * Cross-Mode Customization Compatibility Tests
 * Tests customization system functionality across all game modes
 */

jest.mock('@/utils/Logger.js', () => {
    const mockLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    };

    const MockLoggerClass = jest.fn(() => mockLogger);
    MockLoggerClass.create = jest.fn(() => mockLogger);

    return {
        Logger: MockLoggerClass,
        logger: mockLogger,
        createLogger: jest.fn(() => mockLogger),
    };
});

const { logger: mockLogger } = require('@/utils/Logger.js');

// Mock Storage prototype for reliable localStorage testing
const store = {};
const getItemSpy = jest
    .spyOn(Storage.prototype, 'getItem')
    .mockImplementation((key) => store[key] || null);
const setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
    store[key] = value;
});
const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => {
    delete store[key];
});
const clearSpy = jest.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
    Object.keys(store).forEach((k) => delete store[k]);
});

// Mock ThemeEngine before requiring CustomizationManager
jest.mock('@/systems/ThemeEngine.js', () => ({
    ThemeEngine: jest.fn().mockImplementation(() => ({
        isValidTheme: jest.fn((themeName) => {
            const validThemes = ['classic-grid', 'neon-city', 'space', 'tron-legacy'];
            return validThemes.includes(themeName);
        }),
        loadTheme: jest.fn(),
        getAvailableThemes: jest.fn(() => ['classic-grid', 'neon-city', 'space', 'tron-legacy']),
    })),
}));

// Remove top-level requires to avoid capturing un-mocked modules
// const { Game } = require('@/core/game.js');
// const { CustomizationManager } = require('@/systems/CustomizationManager.js');
// const { PreferenceStorage } = require('@/systems/PreferenceStorage.js');

// Mock THREE.js
global.THREE = {
    Scene: jest.fn(() => ({
        add: jest.fn(),
        remove: jest.fn(),
        traverse: jest.fn(),
        children: [],
    })),
    WebGLRenderer: jest.fn(() => ({
        setSize: jest.fn(),
        setClearColor: jest.fn(),
        render: jest.fn(),
        domElement: document.createElement('canvas'),
    })),
    PerspectiveCamera: jest.fn(() => ({
        position: { set: jest.fn(), copy: jest.fn(), clone: jest.fn(() => ({ x: 0, y: 0, z: 0 })) },
        lookAt: jest.fn(),
        updateProjectionMatrix: jest.fn(),
    })),
    BoxGeometry: jest.fn(() => ({ dispose: jest.fn() })),
    MeshBasicMaterial: jest.fn(() => ({ dispose: jest.fn() })),
    MeshLambertMaterial: jest.fn(() => ({ dispose: jest.fn() })),
    Mesh: jest.fn(() => ({ position: { set: jest.fn(), copy: jest.fn() }, material: {} })),
    DirectionalLight: jest.fn(() => ({ position: { set: jest.fn() } })),
    AmbientLight: jest.fn(() => ({})),
    GridHelper: jest.fn(() => ({ material: { dispose: jest.fn() } })),
    Color: jest.fn((color) => ({
        getHex: () => (typeof color === 'number' ? color : 0x00ff00),
        setHex: jest.fn(),
    })),
    Vector3: jest.fn(() => ({
        set: jest.fn(),
        copy: jest.fn(),
        add: jest.fn(),
        multiplyScalar: jest.fn(),
    })),
    SphereGeometry: jest.fn(() => ({ dispose: jest.fn() })),
    LineBasicMaterial: jest.fn(() => ({ dispose: jest.fn() })),
    LineSegments: jest.fn(() => ({ position: { set: jest.fn() }, material: {} })),
    BufferGeometry: jest.fn(() => ({
        setAttribute: jest.fn(),
        setIndex: jest.fn(),
        dispose: jest.fn(),
    })),
    BufferAttribute: jest.fn(() => ({})),
    Group: jest.fn(() => ({ add: jest.fn(), remove: jest.fn(), children: [] })),
    BoxHelper: jest.fn(() => ({ material: {}, visible: true })),
};

describe('Cross-Mode Customization Compatibility', () => {
    let CustomizationManager, PreferenceStorage, Game, GameModes;
    let classicGame, timeTrialGame, arenaShrinkGame;
    let renderingEngine, preferenceStorage;
    let classicCustomization, timeTrialCustomization, arenaShrinkCustomization;

    beforeEach(() => {
        jest.resetModules();

        // Re-require modules
        CustomizationManager = require('@/systems/CustomizationManager.js').CustomizationManager;
        PreferenceStorage = require('@/systems/PreferenceStorage.js').PreferenceStorage;
        Game = require('@/core/game.js').Game;
        GameModes = require('@/systems/GameModes.js').GameModes;

        Object.keys(store).forEach((k) => delete store[k]);
        jest.clearAllMocks();

        classicGame = new Game(GameModes.CLASSIC);
        timeTrialGame = new Game(GameModes.TIME_TRIAL);
        arenaShrinkGame = new Game(GameModes.ARENA_SHRINK);

        renderingEngine = {
            emissiveMaterialSystem: {
                updateBikeMaterial: jest.fn(),
                updateTrailMaterialTemplate: jest.fn(),
            },
            trailStyleRenderer: {
                setTrailStyle: jest.fn(),
            },
            scene: { traverse: jest.fn() },
            renderer: { setClearColor: jest.fn() },
        };

        preferenceStorage = new PreferenceStorage();

        classicCustomization = new CustomizationManager(renderingEngine, preferenceStorage);
        timeTrialCustomization = new CustomizationManager(renderingEngine, preferenceStorage);
        arenaShrinkCustomization = new CustomizationManager(renderingEngine, preferenceStorage);
    });

    afterAll(() => {
        getItemSpy.mockRestore();
        setItemSpy.mockRestore();
        removeItemSpy.mockRestore();
        clearSpy.mockRestore();
    });

    it('should apply customizations correctly in each mode', () => {
        const testColor = '#FF0000';
        expect(classicCustomization.setBikeColor('player', testColor)).toBe(true);
        expect(timeTrialCustomization.setBikeColor('player', testColor)).toBe(true);
        expect(arenaShrinkCustomization.setBikeColor('player', testColor)).toBe(true);
    });

    it('should persist customizations across restarts', () => {
        classicCustomization.setBikeColor('player', '#FF0000');
        classicCustomization.saveCurrentPreferences();

        const newCustomization = new CustomizationManager(renderingEngine, preferenceStorage);
        expect(newCustomization.getCurrentState().bikeColor).toBe('#FF0000');
    });

    it('should share preferences across all game modes', () => {
        classicCustomization.setBikeColor('player', '#123456');
        classicCustomization.saveCurrentPreferences();

        const newTimeTrialCustomization = new CustomizationManager(
            renderingEngine,
            preferenceStorage
        );
        expect(newTimeTrialCustomization.getCurrentState().bikeColor).toBe('#123456');
    });
});
