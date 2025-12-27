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

const { PlayerEntity } = require('@/multiplayer/PlayerEntity.js');

describe('PlayerEntity', () => {
    let playerEntity;
    const startPosition = { x: 0, y: 0, z: 0 };
    const controlScheme = {
        up: 'ArrowUp',
        down: 'ArrowDown',
        left: 'ArrowLeft',
        right: 'ArrowRight',
    };

    beforeEach(() => {
        playerEntity = new PlayerEntity('P1', 'green', startPosition, controlScheme);
    });

    describe('constructor', () => {
        it('should initialize with correct properties', () => {
            expect(playerEntity.id).toBe('P1');
            expect(playerEntity.color).toBe('green');
            expect(playerEntity.type).toBe('human');
            expect(playerEntity.position).toEqual(startPosition);
            expect(playerEntity.isAlive).toBe(true);
            expect(playerEntity.trail).toEqual([]);
            expect(playerEntity.controlScheme).toEqual(controlScheme);
        });

        it('should identify AI players correctly', () => {
            const aiPlayer = new PlayerEntity('ai_1', 'red', startPosition);
            expect(aiPlayer.type).toBe('ai');
            expect(aiPlayer.isAI()).toBe(true);
            expect(aiPlayer.isHuman()).toBe(false);
        });

        it('should initialize starting direction toward center', () => {
            const rightPlayer = new PlayerEntity('P1', 'green', { x: -10, y: 0, z: 0 });
            expect(rightPlayer.direction).toEqual({ x: 1, y: 0, z: 0 });

            const leftPlayer = new PlayerEntity('P2', 'blue', { x: 10, y: 0, z: 0 });
            expect(leftPlayer.direction).toEqual({ x: -1, y: 0, z: 0 });
        });
    });

    describe('reset', () => {
        it('should reset player to initial state', () => {
            playerEntity.trail = [{ x: 1, y: 0, z: 0 }];
            playerEntity.isAlive = false;
            playerEntity.frameCount = 10;

            playerEntity.reset();

            expect(playerEntity.trail).toEqual([]);
            expect(playerEntity.isAlive).toBe(true);
            expect(playerEntity.frameCount).toBe(0);
        });

        it('should reset to new position when provided', () => {
            const newPosition = { x: 5, y: 0, z: 5 };
            playerEntity.reset(newPosition);

            expect(playerEntity.position).toEqual(newPosition);
            expect(playerEntity.previousPosition).toEqual(newPosition);
        });
    });

    describe('update', () => {
        it('should update position based on direction and speed', () => {
            playerEntity.direction = { x: 1, y: 0, z: 0 };
            playerEntity.update(0.1, 1.0);

            expect(playerEntity.position.x).toBe(0.1);
            expect(playerEntity.position.z).toBe(0);
            expect(playerEntity.frameCount).toBe(1);
        });

        it('should add trail segment on update', () => {
            playerEntity.update(0.1, 1.0);
            expect(playerEntity.trail).toHaveLength(1);
            expect(playerEntity.trail[0]).toEqual(playerEntity.position);
        });

        it('should not update when player is dead', () => {
            playerEntity.isAlive = false;
            const initialPosition = { ...playerEntity.position };

            playerEntity.update(0.1, 1.0);

            expect(playerEntity.position).toEqual(initialPosition);
            expect(playerEntity.frameCount).toBe(0);
        });

        it('should apply speed multiplier correctly', () => {
            playerEntity.direction = { x: 1, y: 0, z: 0 };
            playerEntity.update(0.1, 2.0);

            expect(playerEntity.position.x).toBe(0.2); // 0.1 * 2.0
            expect(playerEntity.speedMultiplier).toBe(2.0);
        });
    });

    describe('changeDirection', () => {
        it('should change direction when valid', () => {
            // Set a known initial direction
            playerEntity.direction = { x: 1, y: 0, z: 0 };
            const newDirection = { x: 0, y: 0, z: 1 };
            const result = playerEntity.changeDirection(newDirection);

            expect(result).toBe(true);
            expect(playerEntity.direction).toEqual(newDirection);
        });

        it('should prevent 180-degree turns', () => {
            playerEntity.direction = { x: 1, y: 0, z: 0 };
            const oppositeDirection = { x: -1, y: 0, z: 0 };
            const result = playerEntity.changeDirection(oppositeDirection);

            expect(result).toBe(false);
            expect(playerEntity.direction).toEqual({ x: 1, y: 0, z: 0 });
        });

        it('should prevent same direction changes', () => {
            playerEntity.direction = { x: 1, y: 0, z: 0 };
            const sameDirection = { x: 1, y: 0, z: 0 };
            const result = playerEntity.changeDirection(sameDirection);

            expect(result).toBe(false);
        });

        it('should not change direction when player is dead', () => {
            playerEntity.isAlive = false;
            const newDirection = { x: 0, y: 0, z: 1 };
            const result = playerEntity.changeDirection(newDirection);

            expect(result).toBe(false);
        });
    });

    describe('crash', () => {
        it('should mark player as dead', () => {
            playerEntity.crash();
            expect(playerEntity.isAlive).toBe(false);
        });
    });

    describe('getState', () => {
        it('should return complete player state', () => {
            const state = playerEntity.getState();

            expect(state).toHaveProperty('id', 'P1');
            expect(state).toHaveProperty('type', 'human');
            expect(state).toHaveProperty('color', 'green');
            expect(state).toHaveProperty('position');
            expect(state).toHaveProperty('direction');
            expect(state).toHaveProperty('trail');
            expect(state).toHaveProperty('isAlive', true);
            expect(state).toHaveProperty('controlScheme');
        });
    });

    describe('utility methods', () => {
        it('should return correct display name for human players', () => {
            expect(playerEntity.getDisplayName()).toBe('P1');
        });

        it('should return correct display name for AI players', () => {
            const aiPlayer = new PlayerEntity('ai_1', 'red', startPosition);
            expect(aiPlayer.getDisplayName()).toBe('AI 1');
        });

        it('should calculate effective speed correctly', () => {
            playerEntity.gameSpeed = 0.1;
            playerEntity.speedMultiplier = 2.0;
            expect(playerEntity.getEffectiveSpeed()).toBe(0.2);
        });

        it('should return trail length', () => {
            playerEntity.trail = [
                { x: 0, y: 0, z: 0 },
                { x: 1, y: 0, z: 0 },
            ];
            expect(playerEntity.getTrailLength()).toBe(2);
        });

        it('should clear trail', () => {
            playerEntity.trail = [{ x: 0, y: 0, z: 0 }];
            playerEntity.clearTrail();
            expect(playerEntity.trail).toEqual([]);
        });
    });
});
