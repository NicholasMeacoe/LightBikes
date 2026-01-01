/**
 * Integration test for multiplayer visual distinction system
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

describe('Multiplayer Visual Integration', () => {
    let RenderingEngine;
    let renderer;
    const bounds = { minX: -15, maxX: 15, minZ: -15, maxZ: 15 };

    beforeEach(() => {
        jest.resetModules();
        RenderingEngine = require('@/rendering/renderer.js').RenderingEngine;

        // Mock THREE for this test if needed, but let's try with setup.js mock first
        // If we need to override anything:
        // global.THREE.PerspectiveCamera.mockImplementation(...)

        renderer = new RenderingEngine(bounds);
        jest.clearAllMocks();
    });

    it('should initialize successfully', () => {
        expect(renderer).toBeDefined();
        expect(renderer.camera).toBeDefined();
    });

    it('should render multiplayer game state', () => {
        const gameState = {
            player1: { id: 'P1', x: -10, z: 0, isAlive: true, trail: [] },
            player2: { id: 'P2', x: 10, z: 0, isAlive: true, trail: [] },
        };

        expect(() => renderer.draw(gameState)).not.toThrow();
    });
});
