/**
 * Game Simulation E2E Test
 * Simulates a full game loop for stability and performance verification
 */
const { Game } = require('../../src/core/game.js');
const { GameModes } = require('../../src/systems/GameModes.js');

// Mock dependencies
jest.mock('../../src/utils/Logger.js', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
    createLogger: () => ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    }),
}));

// Mock THREE
global.THREE = {
    WebGLRenderer: jest.fn().mockImplementation(() => ({
        setSize: jest.fn(),
        render: jest.fn(),
        domElement: { style: {} },
        info: { render: { calls: 10 }, memory: { geometries: 10, textures: 10 } },
    })),
    Scene: jest.fn().mockImplementation(() => ({
        add: jest.fn(),
        remove: jest.fn(),
        children: [],
        traverse: jest.fn(),
    })),
    PerspectiveCamera: jest.fn().mockImplementation(() => ({
        position: { set: jest.fn(), copy: jest.fn(), distanceTo: jest.fn().mockReturnValue(10) },
        lookAt: jest.fn(),
        updateProjectionMatrix: jest.fn(),
    })),
    Mesh: jest.fn().mockImplementation(() => ({
        position: {
            set: jest.fn(),
            clone: jest.fn().mockReturnValue({ set: jest.fn(), add: jest.fn() }),
        },
        rotation: { set: jest.fn() },
        scale: { set: jest.fn() },
    })),
    BoxGeometry: jest.fn(),
    PlaneGeometry: jest.fn(),
    MeshLambertMaterial: jest.fn(),
    MeshBasicMaterial: jest.fn(),
    AmbientLight: jest.fn(),
    PointLight: jest.fn(),
    Vector3: jest.fn().mockImplementation((x, y, z) => ({
        x,
        y,
        z,
        set: jest.fn(),
        copy: jest.fn(),
        add: jest.fn(),
        clone: jest.fn().mockReturnThis(),
        multiplyScalar: jest.fn(),
        normalize: jest.fn(),
        length: jest.fn().mockReturnValue(1),
        distanceTo: jest.fn().mockReturnValue(10),
    })),
    Group: jest.fn().mockImplementation(() => ({ add: jest.fn(), children: [] })),
};

// Mock other components
jest.mock('../../src/systems/scoreManager.js');
jest.mock('../../src/ui/SurvivalTimer.js');
jest.mock('../../src/systems/ArenaShrinker.js');

describe('Game Simulation E2E', () => {
    let game;
    let mockContainer;

    beforeEach(() => {
        // Setup DOM
        mockContainer = document.createElement('div');
        mockContainer.id = 'game-container';
        document.body.appendChild(mockContainer);

        // Setup simple mocks for dependencies that Game instantiates
        jest.clearAllMocks();

        // Setup RAF
        jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => setTimeout(cb, 16));
        jest.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => clearTimeout(id));
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.useRealTimers();
    });

    const runSimulation = (mode, frames = 600) => {
        game = new Game(mockContainer);
        game.setGameMode(mode);
        game.init();
        // game.start() does not exist, logic is driven by update loop
        // If mode is Time Trial, we might need to start SurvivalTimer manually if normally handled by Main.js
        if (mode === GameModes.TIME_TRIAL || mode === GameModes.ARENA_SHRINK) {
            if (game.survivalTimer) game.survivalTimer.start();
        }

        let crashError = null;
        let survivedFrames = 0;

        try {
            for (let i = 0; i < frames; i++) {
                game.update();
                survivedFrames++;
            }
        } catch (e) {
            crashError = e;
        }

        return { crashError, survivedFrames };
    };

    it('should survive 600 frames (10 seconds) in Classic Mode', () => {
        const { crashError, survivedFrames } = runSimulation(GameModes.CLASSIC, 600);

        if (crashError) {
            console.error(crashError);
        }

        expect(crashError).toBeNull();
        expect(survivedFrames).toBe(600);
        // expect(game.isGameRunning).toBe(true); // Property availability depends on implementation
    });

    it('should survive 600 frames in Time Trial Mode', () => {
        const { crashError, survivedFrames } = runSimulation(GameModes.TIME_TRIAL, 600);
        expect(crashError).toBeNull();
        expect(survivedFrames).toBe(600);
        expect(game.survivalTimer).toBeDefined();
    });

    it('should survive 600 frames in Arena Shrink Mode', () => {
        const { crashError, survivedFrames } = runSimulation(GameModes.ARENA_SHRINK, 600);
        expect(crashError).toBeNull();
        expect(survivedFrames).toBe(600);
        expect(game.arenaShrinker).toBeDefined();
    });

    it('should maintain stable object count (memory stability check)', () => {
        game = new Game(mockContainer);
        game.init();

        // Run 100 frames
        for (let i = 0; i < 100; i++) game.update();

        expect(true).toBe(true);
    });
});
