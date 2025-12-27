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

const { PlayerCollisionHandler } = require('@/multiplayer/PlayerCollisionHandler.js');

describe('PlayerCollisionHandler', () => {
    let playerCollisionHandler;
    let multiplayerGameState;
    let mockGame;

    beforeEach(() => {
        playerCollisionHandler = new PlayerCollisionHandler();

        // Mock game instance for dynamic boundaries and grace period
        mockGame = {
            getBounds: jest.fn(() => null),
            isGracePeriodActive: jest.fn(() => false),
        };

        // Standard multiplayer game state
        multiplayerGameState = {
            bounds: 30,
            frameCount: 10,
            isPaused: false,
            player1: {
                position: { x: -5, y: 0, z: 0 },
                trail: [],
            },
            player2: {
                position: { x: 5, y: 0, z: 0 },
                trail: [],
            },
        };
    });

    describe('Basic Multiplayer Collision Detection', () => {
        it('should detect no collisions when players are in safe positions', () => {
            const result = playerCollisionHandler.checkMultiplayerCollisions(
                multiplayerGameState,
                mockGame
            );

            expect(result.player1Collided).toBe(false);
            expect(result.player2Collided).toBe(false);
            expect(result.winner).toBe(null);
            expect(result.collisionType).toBe('no_collision');
        });

        it('should detect player 1 boundary collision', () => {
            multiplayerGameState.player1.position.x = -31; // Beyond boundary

            const result = playerCollisionHandler.checkMultiplayerCollisions(
                multiplayerGameState,
                mockGame
            );

            expect(result.player1Collided).toBe(true);
            expect(result.player2Collided).toBe(false);
            expect(result.winner).toBe('P2');
            expect(result.collisionType).toBe('player1_crash');
        });

        it('should detect player 2 boundary collision', () => {
            multiplayerGameState.player2.position.z = 31; // Beyond boundary

            const result = playerCollisionHandler.checkMultiplayerCollisions(
                multiplayerGameState,
                mockGame
            );

            expect(result.player1Collided).toBe(false);
            expect(result.player2Collided).toBe(true);
            expect(result.winner).toBe('P1');
            expect(result.collisionType).toBe('player2_crash');
        });

        it('should detect player 1 collision with player 2 trail', () => {
            multiplayerGameState.player2.trail = [
                { x: -5, y: 0, z: 0 }, // Player 1's position
                { x: 4, y: 0, z: 0 },
                { x: 3, y: 0, z: 0 },
            ];

            const result = playerCollisionHandler.checkMultiplayerCollisions(
                multiplayerGameState,
                mockGame
            );

            expect(result.player1Collided).toBe(true);
            expect(result.player2Collided).toBe(false);
            expect(result.winner).toBe('P2');
            expect(result.collisionType).toBe('player1_crash');
        });

        it('should detect player 2 collision with player 1 trail', () => {
            multiplayerGameState.player1.trail = [
                { x: 5, y: 0, z: 0 }, // Player 2's position
                { x: -4, y: 0, z: 0 },
                { x: -3, y: 0, z: 0 },
            ];

            const result = playerCollisionHandler.checkMultiplayerCollisions(
                multiplayerGameState,
                mockGame
            );

            expect(result.player1Collided).toBe(false);
            expect(result.player2Collided).toBe(true);
            expect(result.winner).toBe('P1');
            expect(result.collisionType).toBe('player2_crash');
        });
    });

    describe('Direct Player vs Player Collision', () => {
        it('should detect direct collision between players', () => {
            multiplayerGameState.player1.position = { x: 0, y: 0, z: 0 };
            multiplayerGameState.player2.position = { x: 0.05, y: 0, z: 0 }; // Within collision tolerance

            const result = playerCollisionHandler.checkMultiplayerCollisions(
                multiplayerGameState,
                mockGame
            );

            expect(result.directCollision).toBe(true);
            expect(result.winner).toBe('tie');
            expect(result.collisionType).toBe('direct_collision');
        });

        it('should not detect direct collision when players are far apart', () => {
            const result = playerCollisionHandler.checkMultiplayerCollisions(
                multiplayerGameState,
                mockGame
            );

            expect(result.directCollision).toBe(false);
        });

        it('should detect direct collision at exact collision tolerance', () => {
            multiplayerGameState.player1.position = { x: 0, y: 0, z: 0 };
            multiplayerGameState.player2.position = { x: 0.09, y: 0, z: 0 }; // Just within tolerance

            const result = playerCollisionHandler.checkMultiplayerCollisions(
                multiplayerGameState,
                mockGame
            );

            expect(result.directCollision).toBe(true);
            expect(result.winner).toBe('tie');
        });

        it('should not detect direct collision just outside tolerance', () => {
            multiplayerGameState.player1.position = { x: 0, y: 0, z: 0 };
            multiplayerGameState.player2.position = { x: 0.11, y: 0, z: 0 }; // Just outside tolerance

            const result = playerCollisionHandler.checkMultiplayerCollisions(
                multiplayerGameState,
                mockGame
            );

            expect(result.directCollision).toBe(false);
        });
    });

    describe('Simultaneous Crash Detection', () => {
        it('should detect simultaneous boundary crashes as tie', () => {
            multiplayerGameState.player1.position.x = -31; // Beyond boundary
            multiplayerGameState.player2.position.x = 31; // Beyond boundary

            const result = playerCollisionHandler.checkMultiplayerCollisions(
                multiplayerGameState,
                mockGame
            );

            expect(result.player1Collided).toBe(true);
            expect(result.player2Collided).toBe(true);
            expect(result.winner).toBe('tie');
            expect(result.collisionType).toBe('simultaneous_crash');
        });

        it('should detect simultaneous trail crashes as tie', () => {
            // Both players crash into each other's trails
            multiplayerGameState.player1.trail = [
                { x: 5, y: 0, z: 0 }, // Player 2's position
            ];
            multiplayerGameState.player2.trail = [
                { x: -5, y: 0, z: 0 }, // Player 1's position
            ];

            const result = playerCollisionHandler.checkMultiplayerCollisions(
                multiplayerGameState,
                mockGame
            );

            expect(result.player1Collided).toBe(true);
            expect(result.player2Collided).toBe(true);
            expect(result.winner).toBe('tie');
            expect(result.collisionType).toBe('simultaneous_crash');
        });

        it('should handle mixed collision types as tie', () => {
            // Player 1 hits boundary, Player 2 hits trail
            multiplayerGameState.player1.position.x = -31; // Boundary collision
            multiplayerGameState.player1.trail = [
                { x: 5, y: 0, z: 0 }, // Player 2's position - trail collision
            ];

            const result = playerCollisionHandler.checkMultiplayerCollisions(
                multiplayerGameState,
                mockGame
            );

            expect(result.player1Collided).toBe(true);
            expect(result.player2Collided).toBe(true);
            expect(result.winner).toBe('tie');
            expect(result.collisionType).toBe('simultaneous_crash');
        });
    });

    describe('Grace Period Handling', () => {
        it('should respect grace period and return no collisions', () => {
            multiplayerGameState.frameCount = 5; // Within grace period
            multiplayerGameState.player1.position.x = -31; // Should collide but grace period prevents it
            multiplayerGameState.player2.position.x = 31; // Should collide but grace period prevents it

            const result = playerCollisionHandler.checkMultiplayerCollisions(
                multiplayerGameState,
                mockGame
            );

            expect(result.player1Collided).toBe(false);
            expect(result.player2Collided).toBe(false);
            expect(result.winner).toBe(null);
        });

        it('should detect collisions after grace period ends', () => {
            multiplayerGameState.frameCount = 10; // Grace period ended
            multiplayerGameState.player1.position.x = -31; // Beyond boundary

            const result = playerCollisionHandler.checkMultiplayerCollisions(
                multiplayerGameState,
                mockGame
            );

            expect(result.player1Collided).toBe(true);
            expect(result.winner).toBe('P2');
        });

        it('should handle dynamic grace period from game instance', () => {
            mockGame.isGracePeriodActive.mockReturnValue(true);
            multiplayerGameState.frameCount = 15; // Past frame-based grace period
            multiplayerGameState.player1.position.x = -31; // Should collide

            const result = playerCollisionHandler.checkMultiplayerCollisions(
                multiplayerGameState,
                mockGame
            );

            expect(result.player1Collided).toBe(false); // Grace period from game instance
            expect(mockGame.isGracePeriodActive).toHaveBeenCalled();
        });
    });

    describe('Pause State Handling', () => {
        it('should respect pause state and return no collisions', () => {
            multiplayerGameState.isPaused = true;
            multiplayerGameState.player1.position.x = -31; // Should collide
            multiplayerGameState.player2.position.x = 31; // Should collide

            const result = playerCollisionHandler.checkMultiplayerCollisions(
                multiplayerGameState,
                mockGame
            );

            expect(result.player1Collided).toBe(false);
            expect(result.player2Collided).toBe(false);
            expect(result.winner).toBe(null);
        });

        it('should detect collisions when not paused', () => {
            multiplayerGameState.isPaused = false;
            multiplayerGameState.player1.position.x = -31; // Beyond boundary

            const result = playerCollisionHandler.checkMultiplayerCollisions(
                multiplayerGameState,
                mockGame
            );

            expect(result.player1Collided).toBe(true);
            expect(result.winner).toBe('P2');
        });
    });

    describe('Dynamic Boundaries Support', () => {
        it('should use dynamic boundaries when provided by game instance', () => {
            const dynamicBounds = {
                minX: -20,
                maxX: 20,
                minZ: -20,
                maxZ: 20,
            };
            mockGame.getBounds.mockReturnValue(dynamicBounds);

            multiplayerGameState.player1.position.x = -25; // Within static bounds but outside dynamic

            const result = playerCollisionHandler.checkMultiplayerCollisions(
                multiplayerGameState,
                mockGame
            );

            expect(result.player1Collided).toBe(true);
            expect(result.winner).toBe('P2');
            expect(mockGame.getBounds).toHaveBeenCalled();
        });

        it('should fall back to static boundaries when no dynamic bounds', () => {
            mockGame.getBounds.mockReturnValue(null);
            multiplayerGameState.player1.position.x = -31; // Beyond static boundary

            const result = playerCollisionHandler.checkMultiplayerCollisions(
                multiplayerGameState,
                mockGame
            );

            expect(result.player1Collided).toBe(true);
            expect(result.winner).toBe('P2');
        });
    });

    describe('Trail Collision Accuracy', () => {
        it('should ignore recent trail segments for self-collision', () => {
            // Create trail with recent segments that should be ignored
            multiplayerGameState.player1.trail = [
                { x: -6, y: 0, z: 0 }, // Old segment - should be checked
                { x: -5.5, y: 0, z: 0 }, // Recent segment 1
                { x: -5.4, y: 0, z: 0 }, // Recent segment 2
                { x: -5.3, y: 0, z: 0 }, // Recent segment 3
                { x: -5.2, y: 0, z: 0 }, // Recent segment 4
                { x: -5.1, y: 0, z: 0 }, // Recent segment 5 (last 5 excluded)
            ];

            const result = playerCollisionHandler.checkMultiplayerCollisions(
                multiplayerGameState,
                mockGame
            );

            expect(result.player1Collided).toBe(false); // Should not collide with recent segments
        });

        it('should detect collision with older trail segments', () => {
            // Create trail where player collides with older segment
            multiplayerGameState.player1.position = { x: -5, y: 0, z: 0 };
            multiplayerGameState.player1.trail = [
                { x: -5.05, y: 0, z: 0 }, // Old segment at player position - should collide
                { x: -6, y: 0, z: 0 },
                { x: -7, y: 0, z: 0 },
                { x: -8, y: 0, z: 0 },
                { x: -9, y: 0, z: 0 },
                { x: -10, y: 0, z: 0 }, // Recent segments
            ];

            const result = playerCollisionHandler.checkMultiplayerCollisions(
                multiplayerGameState,
                mockGame
            );

            expect(result.player1Collided).toBe(true);
            expect(result.winner).toBe('P2');
        });

        it('should handle collision tolerance correctly', () => {
            // Position player just within collision tolerance of opponent trail
            multiplayerGameState.player1.position = { x: -5, y: 0, z: 0 };
            multiplayerGameState.player2.trail = [
                { x: -5.05, y: 0, z: 0 }, // Within 0.1 tolerance
            ];

            const result = playerCollisionHandler.checkMultiplayerCollisions(
                multiplayerGameState,
                mockGame
            );

            expect(result.player1Collided).toBe(true);
            expect(result.winner).toBe('P2');
        });

        it('should not detect collision just outside tolerance', () => {
            multiplayerGameState.player1.position = { x: -5, y: 0, z: 0 };
            multiplayerGameState.player2.trail = [
                { x: -5.15, y: 0, z: 0 }, // Outside 0.1 tolerance
            ];

            const result = playerCollisionHandler.checkMultiplayerCollisions(
                multiplayerGameState,
                mockGame
            );

            expect(result.player1Collided).toBe(false);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle missing player1', () => {
            delete multiplayerGameState.player1;

            const result = playerCollisionHandler.checkMultiplayerCollisions(
                multiplayerGameState,
                mockGame
            );

            expect(result.player1Collided).toBe(false);
            expect(result.player2Collided).toBe(false);
            expect(result.winner).toBe(null);
            expect(result.collisionType).toBe('invalid_state');
        });

        it('should handle missing player2', () => {
            delete multiplayerGameState.player2;

            const result = playerCollisionHandler.checkMultiplayerCollisions(
                multiplayerGameState,
                mockGame
            );

            expect(result.player1Collided).toBe(false);
            expect(result.player2Collided).toBe(false);
            expect(result.winner).toBe(null);
            expect(result.collisionType).toBe('invalid_state');
        });

        it('should handle empty trails', () => {
            const result = playerCollisionHandler.checkMultiplayerCollisions(
                multiplayerGameState,
                mockGame
            );

            expect(result.player1Collided).toBe(false);
            expect(result.player2Collided).toBe(false);
            expect(result.winner).toBe(null);
        });

        it('should handle invalid trail segments', () => {
            multiplayerGameState.player1.trail = [
                null,
                { x: 'invalid', y: 0, z: 0 },
                { x: 5, y: 0 }, // Missing z
                { x: 5, y: 0, z: 0 }, // Valid segment
            ];

            const result = playerCollisionHandler.checkMultiplayerCollisions(
                multiplayerGameState,
                mockGame
            );

            expect(result.player1Collided).toBe(false); // Should handle invalid segments gracefully
        });

        it('should handle game instance without methods', () => {
            const invalidGame = {};

            const result = playerCollisionHandler.checkMultiplayerCollisions(
                multiplayerGameState,
                invalidGame
            );

            expect(result.player1Collided).toBe(false);
            expect(result.player2Collided).toBe(false);
        });
    });

    describe('Collision Statistics', () => {
        it('should provide collision statistics for valid game state', () => {
            const stats = playerCollisionHandler.getCollisionStats(multiplayerGameState);

            expect(stats.valid).toBe(true);
            expect(stats.player1).toBeDefined();
            expect(stats.player2).toBeDefined();
            expect(stats.playerDistance).toBeGreaterThan(0);
            expect(stats.collisionTolerance).toBe(0.1);
            expect(stats.frameCount).toBe(10);
        });

        it('should handle invalid game state in statistics', () => {
            delete multiplayerGameState.player1;

            const stats = playerCollisionHandler.getCollisionStats(multiplayerGameState);

            expect(stats.valid).toBe(false);
            expect(stats.reason).toBe('missing_players');
        });

        it('should calculate player distance correctly', () => {
            multiplayerGameState.player1.position = { x: 0, y: 0, z: 0 };
            multiplayerGameState.player2.position = { x: 3, y: 0, z: 4 };

            const stats = playerCollisionHandler.getCollisionStats(multiplayerGameState);

            expect(stats.playerDistance).toBeCloseTo(5.0); // 3-4-5 triangle
        });
    });

    describe('Near-Miss Detection', () => {
        it('should detect near-miss between players', () => {
            const mockTriggerNearMiss = jest
                .spyOn(playerCollisionHandler, 'triggerNearMiss')
                .mockImplementation(() => {});

            const player1Pos = { x: 0, y: 0, z: 0 };
            const player2Pos = { x: 0.5, y: 0, z: 0 }; // Close but not colliding

            playerCollisionHandler.checkPlayerNearMiss(player1Pos, player2Pos, 'P1');

            expect(mockTriggerNearMiss).toHaveBeenCalledWith(player1Pos, 0.5, 'P1');

            mockTriggerNearMiss.mockRestore();
        });

        it('should not trigger near-miss for distant players', () => {
            const mockTriggerNearMiss = jest
                .spyOn(playerCollisionHandler, 'triggerNearMiss')
                .mockImplementation(() => {});

            const player1Pos = { x: 0, y: 0, z: 0 };
            const player2Pos = { x: 2, y: 0, z: 0 }; // Too far

            playerCollisionHandler.checkPlayerNearMiss(player1Pos, player2Pos, 'P1');

            expect(mockTriggerNearMiss).not.toHaveBeenCalled();

            mockTriggerNearMiss.mockRestore();
        });

        it('should not trigger near-miss for colliding players', () => {
            const mockTriggerNearMiss = jest
                .spyOn(playerCollisionHandler, 'triggerNearMiss')
                .mockImplementation(() => {});

            const player1Pos = { x: 0, y: 0, z: 0 };
            const player2Pos = { x: 0.05, y: 0, z: 0 }; // Colliding

            playerCollisionHandler.checkPlayerNearMiss(player1Pos, player2Pos, 'P1');

            expect(mockTriggerNearMiss).not.toHaveBeenCalled();

            mockTriggerNearMiss.mockRestore();
        });
    });
});
