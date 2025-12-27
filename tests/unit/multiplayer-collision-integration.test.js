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

const { MultiplayerGame } = require('@/multiplayer/MultiplayerGame.js');
const { PlayerCollisionHandler } = require('@/multiplayer/PlayerCollisionHandler.js');

describe('Multiplayer Collision Integration', () => {
    let multiplayerGame;
    let playerCollisionHandler;

    beforeEach(() => {
        multiplayerGame = new MultiplayerGame();
        playerCollisionHandler = new PlayerCollisionHandler();

        // Initialize the game
        multiplayerGame.init();

        // Advance past grace period
        for (let i = 0; i < 15; i++) {
            multiplayerGame.update();
        }
    });

    describe('Integration with MultiplayerGame', () => {
        it('should detect no collisions in normal gameplay', () => {
            const gameState = multiplayerGame.getGameState();
            const result = playerCollisionHandler.checkMultiplayerCollisions(
                gameState,
                multiplayerGame
            );

            expect(result.player1Collided).toBe(false);
            expect(result.player2Collided).toBe(false);
            expect(result.winner).toBe(null);
            expect(result.collisionType).toBe('no_collision');
        });

        it('should detect player collision with boundary', () => {
            // Move player 1 to boundary
            multiplayerGame.player1.position.x = -31;

            const gameState = multiplayerGame.getGameState();
            const result = playerCollisionHandler.checkMultiplayerCollisions(
                gameState,
                multiplayerGame
            );

            expect(result.player1Collided).toBe(true);
            expect(result.player2Collided).toBe(false);
            expect(result.winner).toBe('P2');
            expect(result.collisionType).toBe('player1_crash');
        });

        it('should detect player collision with opponent trail', () => {
            // Create a trail for player 2 at player 1's position
            multiplayerGame.player2.trail = [
                {
                    x: multiplayerGame.player1.position.x,
                    y: 0,
                    z: multiplayerGame.player1.position.z,
                },
            ];

            const gameState = multiplayerGame.getGameState();
            const result = playerCollisionHandler.checkMultiplayerCollisions(
                gameState,
                multiplayerGame
            );

            expect(result.player1Collided).toBe(true);
            expect(result.player2Collided).toBe(false);
            expect(result.winner).toBe('P2');
            expect(result.collisionType).toBe('player1_crash');
        });

        it('should detect direct player vs player collision', () => {
            // Move players to same position
            multiplayerGame.player1.position = { x: 0, y: 0, z: 0 };
            multiplayerGame.player2.position = { x: 0.05, y: 0, z: 0 };

            const gameState = multiplayerGame.getGameState();
            const result = playerCollisionHandler.checkMultiplayerCollisions(
                gameState,
                multiplayerGame
            );

            expect(result.directCollision).toBe(true);
            expect(result.winner).toBe('tie');
            expect(result.collisionType).toBe('direct_collision');
        });

        it('should handle simultaneous crashes correctly', () => {
            // Move both players to boundaries
            multiplayerGame.player1.position.x = -31;
            multiplayerGame.player2.position.x = 31;

            const gameState = multiplayerGame.getGameState();
            const result = playerCollisionHandler.checkMultiplayerCollisions(
                gameState,
                multiplayerGame
            );

            expect(result.player1Collided).toBe(true);
            expect(result.player2Collided).toBe(true);
            expect(result.winner).toBe('tie');
            expect(result.collisionType).toBe('simultaneous_crash');
        });

        it('should respect game state properties', () => {
            // Test with paused game
            multiplayerGame.isPaused = true;
            multiplayerGame.player1.position.x = -31; // Should collide but paused

            const gameState = multiplayerGame.getGameState();
            const result = playerCollisionHandler.checkMultiplayerCollisions(
                gameState,
                multiplayerGame
            );

            expect(result.player1Collided).toBe(false);
            expect(result.player2Collided).toBe(false);
            expect(result.winner).toBe(null);
        });

        it('should work with game instance methods', () => {
            // Test that game instance methods are called correctly
            const getBoundsSpy = jest.spyOn(multiplayerGame, 'getBounds');
            const isGracePeriodActiveSpy = jest.spyOn(multiplayerGame, 'isGracePeriodActive');

            const gameState = multiplayerGame.getGameState();
            playerCollisionHandler.checkMultiplayerCollisions(gameState, multiplayerGame);

            expect(getBoundsSpy).toHaveBeenCalled();
            expect(isGracePeriodActiveSpy).toHaveBeenCalled();

            getBoundsSpy.mockRestore();
            isGracePeriodActiveSpy.mockRestore();
        });

        it('should provide collision statistics for multiplayer game', () => {
            const gameState = multiplayerGame.getGameState();
            const stats = playerCollisionHandler.getCollisionStats(gameState);

            expect(stats.valid).toBe(true);
            expect(stats.player1).toBeDefined();
            expect(stats.player2).toBeDefined();
            expect(stats.playerDistance).toBeGreaterThan(0);
            expect(stats.frameCount).toBeGreaterThan(10);
        });
    });

    describe('Game State Compatibility', () => {
        it('should work with multiplayer game state format', () => {
            const gameState = multiplayerGame.getGameState();

            // Verify multiplayer game state has expected properties
            expect(gameState.player1).toBeDefined();
            expect(gameState.player2).toBeDefined();
            expect(gameState.gameMode).toBe('local-multiplayer');
            expect(gameState.localScoring).toBeDefined();

            // Verify collision handler can process this state
            const result = playerCollisionHandler.checkMultiplayerCollisions(
                gameState,
                multiplayerGame
            );
            expect(result).toBeDefined();
            expect(result.collisionType).toBeDefined();
        });

        it('should handle player entity state correctly', () => {
            const gameState = multiplayerGame.getGameState();

            // Verify player entities have required properties
            expect(gameState.player1.position).toBeDefined();
            expect(gameState.player1.trail).toBeDefined();
            expect(gameState.player2.position).toBeDefined();
            expect(gameState.player2.trail).toBeDefined();

            // Test collision detection with this state
            const result = playerCollisionHandler.checkMultiplayerCollisions(
                gameState,
                multiplayerGame
            );
            expect(result.player1Collided).toBe(false);
            expect(result.player2Collided).toBe(false);
        });
    });

    describe('Performance and Edge Cases', () => {
        it('should handle large trail arrays efficiently', () => {
            // Create large trails
            const largeTrail = [];
            for (let i = 0; i < 1000; i++) {
                largeTrail.push({ x: i, y: 0, z: 0 });
            }

            multiplayerGame.player1.trail = largeTrail;
            multiplayerGame.player2.trail = largeTrail;

            const gameState = multiplayerGame.getGameState();
            const startTime = performance.now();
            const result = playerCollisionHandler.checkMultiplayerCollisions(
                gameState,
                multiplayerGame
            );
            const endTime = performance.now();

            expect(result).toBeDefined();
            expect(endTime - startTime).toBeLessThan(50); // Should complete within 50ms
        });

        it('should handle rapid position changes', () => {
            // Simulate rapid movement
            for (let i = 0; i < 100; i++) {
                multiplayerGame.player1.position.x += 0.1;
                multiplayerGame.player2.position.x -= 0.1;
                multiplayerGame.update();
            }

            const gameState = multiplayerGame.getGameState();
            const result = playerCollisionHandler.checkMultiplayerCollisions(
                gameState,
                multiplayerGame
            );

            expect(result).toBeDefined();
            expect(result.collisionType).toBeDefined();
        });

        it('should maintain accuracy with complex trail patterns', () => {
            // Create complex trail patterns
            const complexTrail1 = [];
            const complexTrail2 = [];

            for (let i = 0; i < 50; i++) {
                complexTrail1.push({
                    x: Math.sin(i * 0.1) * 10,
                    y: 0,
                    z: Math.cos(i * 0.1) * 10,
                });
                complexTrail2.push({
                    x: Math.cos(i * 0.1) * 10,
                    y: 0,
                    z: Math.sin(i * 0.1) * 10,
                });
            }

            multiplayerGame.player1.trail = complexTrail1;
            multiplayerGame.player2.trail = complexTrail2;

            const gameState = multiplayerGame.getGameState();
            const result = playerCollisionHandler.checkMultiplayerCollisions(
                gameState,
                multiplayerGame
            );

            expect(result).toBeDefined();
            expect(typeof result.player1Collided).toBe('boolean');
            expect(typeof result.player2Collided).toBe('boolean');
        });
    });
});
