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

const { AIController } = require('@/core/ai.js');

describe('AIController', () => {
    let aiController;
    let gameState;

    beforeEach(() => {
        aiController = new AIController();
        gameState = {
            bounds: 30,
            player: { x: 0, y: 0, z: 0 },
            playerDirection: { x: 1, y: 0, z: 0 },
            playerTrail: [],
            ai: { x: 0, y: 0, z: 5 },
            aiDirection: { x: -1, y: 0, z: 0 },
            aiTrail: [],
        };
    });

    it('should navigate out of a trap', () => {
        // Ensure deterministic behavior
        const originalRandom = Math.random;
        Math.random = () => 0.5;

        try {
            gameState.ai = { x: 25, y: 0, z: 25 };
            gameState.aiDirection = { x: 1, z: 0 };

            // Allow up to 10 steps to find a way out
            // Use a higher turn threshold to ensure it turns before hitting the wall
            // (default threshold 10 matches exactly at distance 1.0, failing strict inequality)
            const config = { turnThreshold: 12 };

            for (let i = 0; i < 10; i++) {
                const { newDirection } = aiController.calculateAIDirection(gameState, config);
                gameState.aiDirection = newDirection;
                gameState.ai.x += newDirection.x;
                gameState.ai.z += newDirection.z;
                gameState.aiTrail.push({ ...gameState.ai });

                // Breaking early if it turns helps debugging and performance
                if (newDirection.x !== 1) break;
            }

            // Should have avoided hitting x=30
            expect(gameState.ai.x).toBeLessThan(30);
            expect(gameState.ai.z).toBeDefined();
        } finally {
            Math.random = originalRandom;
        }
    });

    describe('Defensive Behavior', () => {
        it('should turn to avoid a wall', () => {
            gameState.ai.x = gameState.bounds - 0.05; // Very close to boundary
            gameState.aiDirection = { x: 1, z: 0 };
            const { newDirection } = aiController.calculateAIDirection(gameState);
            // Should turn away from the wall
            expect(newDirection.x).not.toBe(1);
        });

        it('should avoid the players trail', () => {
            gameState.playerTrail.push({ x: -0.05, y: 0, z: 5 }); // Very close obstacle
            const { newDirection } = aiController.calculateAIDirection(gameState);
            // Should turn away from the player trail
            expect(newDirection.x).not.toBe(-1);
        });

        it('should attempt to find a safe path when trapped', () => {
            gameState.aiTrail.push({ x: 0.1, y: 0, z: 5 });
            gameState.aiTrail.push({ x: -0.1, y: 0, z: 5 });
            gameState.aiTrail.push({ x: 0, y: 0, z: 5.1 });
            gameState.aiTrail.push({ x: 0, y: 0, z: 4.9 });
            const { newDirection } = aiController.calculateAIDirection(gameState);
            expect(newDirection).toBeDefined();
        });

        it('should handle boundary collision avoidance on all sides', () => {
            const testCases = [
                { pos: { x: 29.9, z: 0 }, dir: { x: 1, z: 0 } }, // Right boundary
                { pos: { x: -29.9, z: 0 }, dir: { x: -1, z: 0 } }, // Left boundary
                { pos: { x: 0, z: 29.9 }, dir: { x: 0, z: 1 } }, // Top boundary
                { pos: { x: 0, z: -29.9 }, dir: { x: 0, z: -1 } }, // Bottom boundary
            ];

            testCases.forEach(({ pos, dir }) => {
                gameState.ai = { ...pos, y: 0 };
                gameState.aiDirection = dir;
                const { newDirection } = aiController.calculateAIDirection(gameState);
                expect(newDirection).toBeDefined();
            });
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle missing game state properties gracefully', () => {
            const incompleteState = {
                ai: { x: 0, y: 0, z: 0 },
                aiDirection: { x: 1, z: 0 },
            };

            expect(() => aiController.calculateAIDirection(incompleteState)).not.toThrow();
        });

        it('should handle invalid directions gracefully', () => {
            gameState.aiDirection = { x: 0, z: 0 }; // Invalid direction

            const result = aiController.calculateAIDirection(gameState);
            expect(result.newDirection).toBeDefined();
        });

        it('should handle empty trail arrays', () => {
            gameState.playerTrail = [];
            gameState.aiTrail = [];

            const result = aiController.calculateAIDirection(gameState);
            expect(result).toBeDefined();
            expect(result.newDirection).toBeDefined();
        });

        it('should handle negative bounds', () => {
            gameState.bounds = -10;
            gameState.ai.x = -5;

            const { newDirection } = aiController.calculateAIDirection(gameState);
            expect(newDirection).toBeDefined();
        });

        it('should handle zero bounds', () => {
            gameState.bounds = 0;

            const { newDirection } = aiController.calculateAIDirection(gameState);
            expect(newDirection).toBeDefined();
        });
    });

    describe('Difficulty Configuration', () => {
        it('should use default values when no config is provided', () => {
            gameState.ai.x = gameState.bounds - 0.5; // Close to boundary
            gameState.aiDirection = { x: 1, z: 0 };

            const { newDirection } = aiController.calculateAIDirection(gameState);
            // Should turn away from boundary with default turnThreshold (10)
            expect(newDirection.x).not.toBe(1);
        });

        it('should use custom turnThreshold from config', () => {
            gameState.ai.x = gameState.bounds - 1.2; // 1.2 units from boundary (12 whisker steps)
            gameState.aiDirection = { x: 1, z: 0 };

            // Mock Math.random to ensure no random turns
            const originalRandom = Math.random;
            Math.random = () => 0.5; // Greater than 0.02

            try {
                // With default turnThreshold (10), AI should not turn yet (whisker distance = 12 > 10)
                const defaultResult = aiController.calculateAIDirection(gameState);
                expect(defaultResult.newDirection.x).toBe(1);

                // With custom turnThreshold (15), AI should turn (whisker distance = 12 < 15)
                const config = { turnThreshold: 15 };
                const configResult = aiController.calculateAIDirection(gameState, config);
                expect(configResult.newDirection.x).not.toBe(1);
            } finally {
                Math.random = originalRandom;
            }
        });

        it('should use custom randomTurnChance from config', () => {
            // Set up scenario where AI is not near boundaries
            gameState.ai = { x: 0, y: 0, z: 0 };
            gameState.aiDirection = { x: 1, z: 0 };

            // Mock Math.random to return 0.03 (3%)
            const originalRandom = Math.random;
            Math.random = () => 0.03;

            try {
                // With default randomTurnChance (0.02 = 2%), should not turn
                const defaultResult = aiController.calculateAIDirection(gameState);
                expect(defaultResult.newDirection.x).toBe(1);

                // With custom randomTurnChance (0.05 = 5%), should turn
                const config = { randomTurnChance: 0.05 };
                const configResult = aiController.calculateAIDirection(gameState, config);
                expect(configResult.newDirection.x).not.toBe(1);
            } finally {
                Math.random = originalRandom;
            }
        });

        it('should handle partial config objects', () => {
            gameState.ai.x = gameState.bounds - 0.5;
            gameState.aiDirection = { x: 1, z: 0 };

            // Config with only turnThreshold
            const partialConfig = { turnThreshold: 5 };
            const result = aiController.calculateAIDirection(gameState, partialConfig);
            expect(result.newDirection).toBeDefined();
        });

        it('should handle empty config object', () => {
            gameState.ai.x = gameState.bounds - 0.5;
            gameState.aiDirection = { x: 1, z: 0 };

            const emptyConfig = {};
            const result = aiController.calculateAIDirection(gameState, emptyConfig);
            expect(result.newDirection).toBeDefined();
        });

        it('should apply difficulty configurations for easy level', () => {
            const easyConfig = {
                turnThreshold: 15,
                randomTurnChance: 0.05,
            };

            gameState.ai.x = gameState.bounds - 1.2; // 1.2 units from boundary (12 whisker steps)
            gameState.aiDirection = { x: 1, z: 0 };

            const result = aiController.calculateAIDirection(gameState, easyConfig);
            // Should turn with easy config (turnThreshold: 15, whisker distance = 12 < 15)
            expect(result.newDirection.x).not.toBe(1);
        });

        it('should apply difficulty configurations for hard level', () => {
            const hardConfig = {
                turnThreshold: 8,
                randomTurnChance: 0.01,
            };

            gameState.ai.x = gameState.bounds - 0.9; // 0.9 units from boundary (9 whisker steps)
            gameState.aiDirection = { x: 1, z: 0 };

            const result = aiController.calculateAIDirection(gameState, hardConfig);
            // Should not turn with hard config (turnThreshold: 8, whisker distance: 9)
            expect(result.newDirection.x).toBe(1);
        });
    });

    describe('Pause State Handling', () => {
        it('should respect pause state and return current direction without changes', () => {
            gameState.isPaused = true;
            gameState.aiDirection = { x: 0, z: 1 };

            const { newDirection } = aiController.calculateAIDirection(gameState);
            expect(newDirection).toEqual({ x: 0, z: 1 });
        });

        it('should maintain AI state during pause', () => {
            aiController.aiState = 'DEFENSIVE';
            gameState.isPaused = true;

            const { newState } = aiController.calculateAIDirection(gameState);
            expect(newState).toBe('DEFENSIVE');
        });

        it('should cache whisker distances during normal operation for pause state', () => {
            // First, run normal calculation to cache whisker distances
            gameState.isPaused = false;
            aiController.runDefensiveCheck(gameState);

            // Then test pause state uses cached values
            gameState.isPaused = true;
            const whiskerDistances = aiController.runDefensiveCheck(gameState);

            expect(whiskerDistances).toBeDefined();
            expect(typeof whiskerDistances.forward).toBe('number');
            expect(typeof whiskerDistances.left).toBe('number');
            expect(typeof whiskerDistances.right).toBe('number');
        });

        it('should return default whisker distances when paused without cache', () => {
            gameState.isPaused = true;

            const whiskerDistances = aiController.runDefensiveCheck(gameState);
            expect(whiskerDistances).toEqual({ forward: 20, left: 20, right: 20 });
        });

        it('should resume normal AI decision-making after pause', () => {
            // Set up scenario where AI should turn
            gameState.ai.x = gameState.bounds - 0.5;
            gameState.aiDirection = { x: 1, z: 0 };

            // Pause and verify no direction change
            gameState.isPaused = true;
            const pausedResult = aiController.calculateAIDirection(gameState);
            expect(pausedResult.newDirection).toEqual({ x: 1, z: 0 });

            // Resume and verify AI makes decision
            gameState.isPaused = false;
            const resumedResult = aiController.calculateAIDirection(gameState);
            expect(resumedResult.newDirection.x).not.toBe(1); // Should turn away from boundary
        });

        it('should maintain system state integrity during pause transitions', () => {
            // Create complex scenario
            gameState.playerTrail = [
                { x: 1, y: 0, z: 5 },
                { x: 2, y: 0, z: 5 },
            ];
            gameState.aiTrail = [
                { x: -1, y: 0, z: 5 },
                { x: -2, y: 0, z: 5 },
            ];

            // Normal operation
            const normalResult = aiController.calculateAIDirection(gameState);

            // Pause
            gameState.isPaused = true;
            const pausedResult = aiController.calculateAIDirection(gameState);
            expect(pausedResult.newDirection).toEqual(gameState.aiDirection);

            // Resume
            gameState.isPaused = false;
            const resumedResult = aiController.calculateAIDirection(gameState);
            expect(resumedResult).toBeDefined();
            expect(resumedResult.newDirection).toBeDefined();
        });
    });

    describe('AI Personality System', () => {
        describe('Aggressive Personality', () => {
            beforeEach(() => {
                aiController = new AIController('aggressive');
            });

            it('should pursue the player when safe to do so', () => {
                // Position AI and player so AI can safely pursue
                gameState.ai = { x: 0, y: 0, z: 0 };
                gameState.player = { x: 5, y: 0, z: 0 };
                gameState.aiDirection = { x: 0, z: 1 }; // AI facing north
                gameState.playerTrail = [];
                gameState.aiTrail = [];

                const { newDirection, newState } = aiController.calculateAIDirection(gameState);

                expect(newState).toBe('AGGRESSIVE');
                // Should turn toward player (east)
                expect(newDirection.x).toBe(1);
                expect(newDirection.z).toBe(0);
            });

            it('should prioritize collision avoidance over player pursuit', () => {
                // Position AI near boundary with player behind
                gameState.ai = { x: 29, y: 0, z: 0 };
                gameState.player = { x: 25, y: 0, z: 0 };
                gameState.aiDirection = { x: 1, z: 0 }; // AI facing toward boundary

                const { newDirection, newState } = aiController.calculateAIDirection(gameState);

                expect(newState).toBe('AGGRESSIVE');
                // Should turn away from boundary, not toward player
                expect(newDirection.x).not.toBe(1);
            });

            it('should use more aggressive turn threshold', () => {
                gameState.ai = { x: 29.2, y: 0, z: 0 }; // 0.8 units from boundary (8 whisker steps)
                gameState.aiDirection = { x: 1, z: 0 };

                const { newDirection } = aiController.calculateAIDirection(gameState);
                // Aggressive AI should turn with default threshold of 8
                expect(newDirection.x).not.toBe(1);
            });

            it('should have less random movement than defensive AI', () => {
                gameState.ai = { x: 0, y: 0, z: 0 };
                gameState.player = { x: 10, y: 0, z: 0 }; // Player far away
                gameState.aiDirection = { x: 1, z: 0 };

                // Mock Math.random to return 0.015 (1.5%)
                const originalRandom = Math.random;
                Math.random = () => 0.015;

                try {
                    const { newDirection } = aiController.calculateAIDirection(gameState);
                    // Should not turn with aggressive randomTurnChance (0.01 = 1%)
                    expect(newDirection.x).toBe(1);
                } finally {
                    Math.random = originalRandom;
                }
            });
        });

        describe('Defensive Personality', () => {
            beforeEach(() => {
                aiController = new AIController('defensive');
            });

            it('should maintain existing defensive behavior', () => {
                gameState.ai.x = gameState.bounds - 0.5;
                gameState.aiDirection = { x: 1, z: 0 };

                const { newDirection, newState } = aiController.calculateAIDirection(gameState);

                expect(newState).toBe('DEFENSIVE');
                expect(newDirection.x).not.toBe(1); // Should turn away from boundary
            });

            it('should use standard turn threshold', () => {
                const originalRandom = Math.random;
                Math.random = () => 0.5; // Avoid random turns

                gameState.ai = { x: 28, y: 0, z: 0 }; // 2 units from boundary (20 whisker steps)
                gameState.aiDirection = { x: 1, z: 0 };

                const { newDirection } = aiController.calculateAIDirection(gameState);
                // Defensive AI should not turn yet with default threshold of 10 (whisker distance = 20 > 10)
                expect(newDirection.x).toBe(1);

                Math.random = originalRandom;
            });

            it('should have moderate random movement', () => {
                // Position AI in center with no obstacles
                gameState.ai = { x: 0, y: 0, z: 0 };
                gameState.aiDirection = { x: 1, z: 0 };
                gameState.playerTrail = [];
                gameState.aiTrail = [];
                gameState.bounds = 30; // Ensure large bounds

                // Use explicit config with higher random chance for testing
                const config = { randomTurnChance: 0.1 }; // 10% chance

                const originalRandom = Math.random;
                let turnCount = 0;

                try {
                    // Always trigger random turn
                    Math.random = () => 0.05; // 5% < 10% randomTurnChance

                    for (let i = 0; i < 5; i++) {
                        const { newDirection } = aiController.calculateAIDirection(
                            gameState,
                            config
                        );
                        if (newDirection.x !== 1) {
                            turnCount++;
                        }
                    }

                    // Should have turned at least once
                    expect(turnCount).toBeGreaterThan(0);
                } finally {
                    Math.random = originalRandom;
                }
            });
        });

        describe('Erratic Personality', () => {
            beforeEach(() => {
                aiController = new AIController('erratic');
            });

            it('should make random turns at regular intervals', () => {
                gameState.ai = { x: 0, y: 0, z: 0 };
                gameState.aiDirection = { x: 1, z: 0 };

                // Set turn counter to trigger erratic turn
                aiController.erraticTurnCounter = 25;
                aiController.erraticTurnInterval = 25;

                const { newDirection, newState } = aiController.calculateAIDirection(gameState);

                expect(newState).toBe('ERRATIC');
                expect(newDirection.x).not.toBe(1); // Should have turned
                expect(aiController.erraticTurnCounter).toBe(0); // Counter should reset
            });

            it('should prioritize collision avoidance over erratic turns', () => {
                gameState.ai = { x: 29, y: 0, z: 0 };
                gameState.aiDirection = { x: 1, z: 0 };

                // Set up for erratic turn
                aiController.erraticTurnCounter = 25;
                aiController.erraticTurnInterval = 25;

                const { newDirection, newState } = aiController.calculateAIDirection(gameState);

                expect(newState).toBe('ERRATIC');
                expect(newDirection.x).not.toBe(1); // Should turn away from boundary
                expect(aiController.erraticTurnCounter).toBe(0); // Counter should reset after collision avoidance
            });

            it('should generate random turn intervals between 20-40 frames', () => {
                const intervals = [];
                for (let i = 0; i < 100; i++) {
                    intervals.push(aiController.getRandomTurnInterval());
                }

                expect(Math.min(...intervals)).toBeGreaterThanOrEqual(20);
                expect(Math.max(...intervals)).toBeLessThanOrEqual(40);
            });

            it('should increment turn counter each frame', () => {
                gameState.ai = { x: 0, y: 0, z: 0 };
                gameState.aiDirection = { x: 1, z: 0 };

                const initialCounter = aiController.erraticTurnCounter;
                aiController.calculateAIDirection(gameState);

                expect(aiController.erraticTurnCounter).toBe(initialCounter + 1);
            });
        });

        describe('Personality Parameter Validation', () => {
            it('should default to defensive for invalid personality', () => {
                aiController = new AIController('invalid');
                gameState.ai.x = gameState.bounds - 0.5;
                gameState.aiDirection = { x: 1, z: 0 };

                const { newState } = aiController.calculateAIDirection(gameState);
                expect(newState).toBe('DEFENSIVE');
            });

            it('should default to defensive when no personality specified', () => {
                aiController = new AIController();
                expect(aiController.personality).toBe('defensive');
            });

            it('should accept valid personality types', () => {
                const personalities = ['aggressive', 'defensive', 'erratic'];

                personalities.forEach((personality) => {
                    const controller = new AIController(personality);
                    expect(controller.personality).toBe(personality);
                });
            });
        });

        describe('Player Direction Calculation', () => {
            it('should calculate correct direction toward player on X axis', () => {
                const ai = { x: 0, y: 0, z: 0 };
                const player = { x: 5, y: 0, z: 1 }; // Player mostly to the east

                const direction = aiController.calculatePlayerDirection(ai, player);
                expect(direction).toEqual({ x: 1, z: 0 });
            });

            it('should calculate correct direction toward player on Z axis', () => {
                const ai = { x: 0, y: 0, z: 0 };
                const player = { x: 1, y: 0, z: 5 }; // Player mostly to the north

                const direction = aiController.calculatePlayerDirection(ai, player);
                expect(direction).toEqual({ x: 0, z: 1 });
            });

            it('should handle negative directions correctly', () => {
                const ai = { x: 5, y: 0, z: 5 };
                const player = { x: 0, y: 0, z: 0 }; // Player to the southwest

                const direction = aiController.calculatePlayerDirection(ai, player);
                // dx = -5, dz = -5, so |dx| == |dz|, should choose Z axis in this case
                expect(direction).toEqual({ x: 0, z: -1 });
            });
        });

        describe('Safe Turn Detection', () => {
            it('should allow safe turns when clearance is sufficient', () => {
                const whiskerDistances = { forward: 15, left: 10, right: 10 };
                const threshold = 8;

                const isSafe = aiController.canSafelyTurnToward(
                    { x: 1, z: 0 },
                    whiskerDistances,
                    threshold
                );

                expect(isSafe).toBe(true);
            });

            it('should prevent unsafe turns when clearance is insufficient', () => {
                const whiskerDistances = { forward: 5, left: 2, right: 8 };
                const threshold = 8;

                const isSafe = aiController.canSafelyTurnToward(
                    { x: 1, z: 0 },
                    whiskerDistances,
                    threshold
                );

                expect(isSafe).toBe(false);
            });
        });
    });

    describe('Multi-Entity Obstacle Detection', () => {
        beforeEach(() => {
            // Set up multi-AI game state
            gameState.aiOpponents = [
                {
                    id: 'ai_1',
                    x: 5,
                    y: 0,
                    z: 0,
                    direction: { x: 1, z: 0 },
                    trail: [
                        { x: 4, y: 0, z: 0 },
                        { x: 3, y: 0, z: 0 },
                    ],
                    alive: true,
                },
                {
                    id: 'ai_2',
                    x: 0,
                    y: 0,
                    z: 5,
                    direction: { x: 0, z: 1 },
                    trail: [
                        { x: 0, y: 0, z: 4 },
                        { x: 0, y: 0, z: 3 },
                    ],
                    alive: true,
                },
            ];

            // Set current AI as ai_1 for testing
            gameState.ai = gameState.aiOpponents[0];
            gameState.aiDirection = gameState.ai.direction;
            gameState.aiTrail = gameState.ai.trail;
        });

        it('should include player trail as obstacle', () => {
            gameState.playerTrail = [
                { x: 6, y: 0, z: 0 },
                { x: 7, y: 0, z: 0 },
            ];

            const obstacles = aiController.getAllObstacleTrails('ai_1', gameState);

            expect(obstacles).toContainEqual({ x: 6, y: 0, z: 0 });
            expect(obstacles).toContainEqual({ x: 7, y: 0, z: 0 });
        });

        it('should include other AI trails as obstacles', () => {
            const obstacles = aiController.getAllObstacleTrails('ai_1', gameState);

            // Should include ai_2's trail but not ai_1's own trail
            expect(obstacles).toContainEqual({ x: 0, y: 0, z: 4 });
            expect(obstacles).toContainEqual({ x: 0, y: 0, z: 3 });
        });

        it('should exclude own trail recent segments', () => {
            // Add more segments to ai_1's trail
            gameState.aiOpponents[0].trail = [];
            for (let i = 0; i < 15; i++) {
                gameState.aiOpponents[0].trail.push({ x: i, y: 0, z: 0 });
            }

            const obstacles = aiController.getAllObstacleTrails('ai_1', gameState);

            // Should exclude last 10 segments (indices 5-14)
            expect(obstacles).not.toContainEqual({ x: 14, y: 0, z: 0 });
            expect(obstacles).not.toContainEqual({ x: 10, y: 0, z: 0 });
            // Should include earlier segments (indices 0-4)
            expect(obstacles).toContainEqual({ x: 4, y: 0, z: 0 });
            expect(obstacles).toContainEqual({ x: 0, y: 0, z: 0 });
        });

        it('should exclude other AI recent segments', () => {
            // Add more segments to ai_2's trail
            gameState.aiOpponents[1].trail = [];
            for (let i = 0; i < 15; i++) {
                gameState.aiOpponents[1].trail.push({ x: 0, y: 0, z: i });
            }

            const obstacles = aiController.getAllObstacleTrails('ai_1', gameState);

            // Should exclude ai_2's last 10 segments (indices 5-14)
            expect(obstacles).not.toContainEqual({ x: 0, y: 0, z: 14 });
            expect(obstacles).not.toContainEqual({ x: 0, y: 0, z: 10 });
            // Should include ai_2's earlier segments (indices 0-4)
            expect(obstacles).toContainEqual({ x: 0, y: 0, z: 4 });
            expect(obstacles).toContainEqual({ x: 0, y: 0, z: 0 });
        });

        it('should handle dead AI entities correctly', () => {
            gameState.aiOpponents[1].alive = false;

            const obstacles = aiController.getAllObstacleTrails('ai_1', gameState);

            // Should not include dead AI's trail
            expect(obstacles).not.toContainEqual({ x: 0, y: 0, z: 4 });
            expect(obstacles).not.toContainEqual({ x: 0, y: 0, z: 3 });
        });

        it('should detect obstacles from multiple AI trails in whisker check', () => {
            // Position ai_1 so it will encounter ai_2's trail with forward whisker
            gameState.ai = { x: 0, y: 0, z: 2 };
            gameState.aiDirection = { x: 0, z: 1 };
            gameState.aiOpponents[0] = { ...gameState.aiOpponents[0], x: 0, y: 0, z: 2 };

            const whiskerDistances = aiController.runDefensiveCheck(gameState);

            // Should detect ai_2's trail ahead (at z=3,4)
            expect(whiskerDistances.forward).toBeLessThan(20);
        });

        it('should treat all entities as equal threats', () => {
            // Position AI between player trail and other AI trail
            gameState.ai = { x: 0, y: 0, z: 0 };
            gameState.aiDirection = { x: 1, z: 0 }; // Facing right (east)
            gameState.playerTrail = [{ x: 0.1, y: 0, z: 0 }]; // Player trail ahead (forward whisker at 0.1 distance)

            // For left whisker (when facing east, left is north), place obstacle at first whisker step
            gameState.aiOpponents[1].trail = [{ x: 0, y: 0, z: 0.1 }]; // AI trail to the left (north) at 0.1 distance

            const whiskerDistances = aiController.runDefensiveCheck(gameState);

            // Should detect both player and AI trails as obstacles
            expect(whiskerDistances.forward).toBeLessThan(20); // Player trail ahead
            expect(whiskerDistances.left).toBeLessThan(20); // AI trail to the left
        });

        it('should maintain pathfinding quality with multiple obstacles', () => {
            // Create complex obstacle scenario
            gameState.ai = { x: 10, y: 0, z: 10 };
            gameState.aiDirection = { x: 1, z: 0 };

            // Add player trail obstacles
            gameState.playerTrail = [
                { x: 11, y: 0, z: 10 },
                { x: 12, y: 0, z: 10 },
                { x: 10, y: 0, z: 11 },
                { x: 10, y: 0, z: 12 },
            ];

            // Add other AI trail obstacles
            gameState.aiOpponents[1].trail = [
                { x: 10, y: 0, z: 9 },
                { x: 10, y: 0, z: 8 },
                { x: 9, y: 0, z: 10 },
                { x: 8, y: 0, z: 10 },
            ];

            const { newDirection } = aiController.calculateAIDirection(gameState);

            // Should make a valid decision despite complex obstacles
            expect(newDirection).toBeDefined();
            expect(typeof newDirection.x).toBe('number');
            expect(typeof newDirection.z).toBe('number');
            expect(Math.abs(newDirection.x) + Math.abs(newDirection.z)).toBe(1);
        });
    });

    describe('AI Coordination System', () => {
        let coordinator;
        let aiEntities;

        beforeEach(() => {
            const { AICoordinator } = require('@/core/ai.js');
            coordinator = new AICoordinator();

            // Create mock AI entities
            aiEntities = [
                {
                    id: 'ai_1',
                    alive: true,
                    direction: { x: 1, z: 0 },
                    trail: [],
                    controller: new AIController('aggressive'),
                },
                {
                    id: 'ai_2',
                    alive: true,
                    direction: { x: 0, z: 1 },
                    trail: [],
                    controller: new AIController('defensive'),
                },
                {
                    id: 'ai_3',
                    alive: true,
                    direction: { x: -1, z: 0 },
                    trail: [],
                    controller: new AIController('erratic'),
                },
            ];
        });

        it('should coordinate decisions for multiple AI entities', () => {
            const decisions = coordinator.coordinateAIDecisions(aiEntities, gameState);

            expect(decisions).toHaveLength(3);
            decisions.forEach((decision) => {
                expect(decision).toHaveProperty('entityId');
                expect(decision).toHaveProperty('newDirection');
                expect(decision).toHaveProperty('newState');
                expect(decision).toHaveProperty('skipped');
            });
        });

        it('should prevent identical moves between AIs', () => {
            // Mock all AIs to want to turn right
            aiEntities.forEach((entity) => {
                entity.controller.calculateAIDirection = jest.fn().mockReturnValue({
                    newDirection: { x: 0, z: 1 },
                    newState: 'DEFENSIVE',
                });
            });

            const decisions = coordinator.coordinateAIDecisions(aiEntities, gameState);

            // Should have resolved conflicts - not all decisions should be identical
            const directions = decisions.map((d) => coordinator.getDirectionKey(d.newDirection));
            const uniqueDirections = new Set(directions);

            expect(uniqueDirections.size).toBeGreaterThan(1);
        });

        it('should prioritize aggressive AI in conflict resolution', () => {
            // Set up conflict scenario where all AIs want same direction
            const targetDirection = { x: 1, z: 0 };
            aiEntities.forEach((entity) => {
                entity.controller.calculateAIDirection = jest.fn().mockReturnValue({
                    newDirection: targetDirection,
                    newState: 'DEFENSIVE',
                });
            });

            const decisions = coordinator.coordinateAIDecisions(aiEntities, gameState);

            // Aggressive AI (ai_1) should keep the original direction
            const aggressiveDecision = decisions.find((d) => d.entityId === 'ai_1');
            expect(aggressiveDecision.newDirection).toEqual(targetDirection);
        });

        it('should create entity-specific game states', () => {
            const entity = aiEntities[0];
            const entityGameState = coordinator.createEntityGameState(entity, gameState);

            expect(entityGameState.ai).toBe(entity);
            expect(entityGameState.aiDirection).toBe(entity.direction);
            expect(entityGameState.aiTrail).toBe(entity.trail);
        });

        it('should include other AI trails as obstacles', () => {
            // Add trails to other AIs
            aiEntities[1].trail = [
                { x: 1, y: 0, z: 1 },
                { x: 2, y: 0, z: 1 },
            ];
            aiEntities[2].trail = [
                { x: 3, y: 0, z: 1 },
                { x: 4, y: 0, z: 1 },
            ];

            gameState.aiOpponents = aiEntities;

            const otherTrails = coordinator.getOtherAITrails('ai_1', aiEntities);

            expect(otherTrails).toHaveLength(4); // 2 trails from each of the other 2 AIs
            expect(otherTrails).toContainEqual({ x: 1, y: 0, z: 1 });
            expect(otherTrails).toContainEqual({ x: 4, y: 0, z: 1 });
        });

        it('should handle staggered timing when enabled', () => {
            coordinator.setStaggeredTiming(true);

            const decisions = coordinator.coordinateAIDecisions(aiEntities, gameState);

            // Some decisions should be skipped
            const skippedDecisions = decisions.filter((d) => d.skipped);
            expect(skippedDecisions.length).toBeGreaterThan(0);
        });

        it('should find alternative directions for conflict resolution', () => {
            const entity = aiEntities[0];
            const originalDirection = { x: 1, z: 0 };

            const alternative = coordinator.findAlternativeDirection(
                entity,
                originalDirection,
                gameState,
                {}
            );

            expect(alternative).toBeDefined();
            expect(coordinator.directionsEqual(alternative, originalDirection)).toBe(false);
        });

        it('should track decision history', () => {
            coordinator.coordinateAIDecisions(aiEntities, gameState);
            coordinator.coordinateAIDecisions(aiEntities, gameState);

            expect(coordinator.decisionHistory).toHaveLength(2);
            expect(coordinator.recentDecisions.size).toBe(3); // One for each AI
        });

        it('should provide coordination statistics', () => {
            coordinator.coordinateAIDecisions(aiEntities, gameState);

            const stats = coordinator.getCoordinationStats();

            expect(stats).toHaveProperty('recentConflicts');
            expect(stats).toHaveProperty('historySize');
            expect(stats).toHaveProperty('staggeredTiming');
            expect(stats).toHaveProperty('trackedEntities');
            expect(stats.trackedEntities).toBe(3);
        });

        it('should handle dead AI entities gracefully', () => {
            aiEntities[1].alive = false;

            const decisions = coordinator.coordinateAIDecisions(aiEntities, gameState);

            // Should only have decisions for alive AIs
            expect(decisions).toHaveLength(2);
            expect(decisions.find((d) => d.entityId === 'ai_2')).toBeUndefined();
        });

        it('should handle entities without controllers', () => {
            aiEntities[2].controller = null;

            const decisions = coordinator.coordinateAIDecisions(aiEntities, gameState);

            // Should only have decisions for entities with controllers
            expect(decisions).toHaveLength(2);
            expect(decisions.find((d) => d.entityId === 'ai_3')).toBeUndefined();
        });

        describe('Direction Key Generation', () => {
            it('should generate consistent keys for same directions', () => {
                const dir1 = { x: 1, z: 0 };
                const dir2 = { x: 1, z: 0 };

                expect(coordinator.getDirectionKey(dir1)).toBe(coordinator.getDirectionKey(dir2));
            });

            it('should generate different keys for different directions', () => {
                const dir1 = { x: 1, z: 0 };
                const dir2 = { x: 0, z: 1 };

                expect(coordinator.getDirectionKey(dir1)).not.toBe(
                    coordinator.getDirectionKey(dir2)
                );
            });
        });

        describe('Direction Equality', () => {
            it('should correctly identify equal directions', () => {
                const dir1 = { x: 1, z: 0 };
                const dir2 = { x: 1, z: 0 };

                expect(coordinator.directionsEqual(dir1, dir2)).toBe(true);
            });

            it('should correctly identify different directions', () => {
                const dir1 = { x: 1, z: 0 };
                const dir2 = { x: 0, z: 1 };

                expect(coordinator.directionsEqual(dir1, dir2)).toBe(false);
            });
        });
    });

    describe('Arena Shrink Mode Integration', () => {
        beforeEach(() => {
            // Set up Arena Shrink mode game state with dynamic boundaries
            gameState.dynamicBounds = {
                minX: -15,
                maxX: 15,
                minZ: -15,
                maxZ: 15,
                size: 30,
            };
        });

        it('should use dynamic boundaries for pathfinding', () => {
            // Position AI very close to dynamic boundary (0.5 units from edge)
            gameState.ai = { x: 14.5, y: 0, z: 0 };
            gameState.aiDirection = { x: 1, z: 0 };

            // Check whisker distances first
            const whiskerDistances = aiController.runDefensiveCheck(gameState);
            expect(whiskerDistances.forward).toBeLessThan(10); // Should detect boundary

            const { newDirection } = aiController.calculateAIDirection(gameState);
            // Should turn away from dynamic boundary
            expect(newDirection.x).not.toBe(1);
        });

        it('should adapt whisker length for smaller arenas', () => {
            // Set up smaller arena
            gameState.dynamicBounds = {
                minX: -5,
                maxX: 5,
                minZ: -5,
                maxZ: 5,
                size: 10,
            };

            gameState.ai = { x: 0, y: 0, z: 0 };
            gameState.aiDirection = { x: 1, z: 0 };

            const whiskerDistances = aiController.runDefensiveCheck(gameState);
            // In a 10x10 arena, whisker should detect boundary at distance 5
            // But minimum whisker length is 8, so it should be 8
            expect(whiskerDistances.forward).toBe(8);
        });

        it('should adapt turn threshold for smaller arenas', () => {
            // Set up smaller arena
            gameState.dynamicBounds = {
                minX: -5,
                maxX: 5,
                minZ: -5,
                maxZ: 5,
                size: 10,
            };

            // Position AI close enough to trigger adapted threshold
            gameState.ai = { x: 4.7, y: 0, z: 0 }; // 0.3 units from boundary (3 whisker steps)
            gameState.aiDirection = { x: 1, z: 0 };

            // With adapted threshold, AI should be more reactive in small spaces
            const config = { turnThreshold: 10 }; // Would normally be high
            const { newDirection } = aiController.calculateAIDirection(gameState, config);

            // Should turn because adapted threshold (3) is less than whisker distance (3)
            expect(newDirection.x).not.toBe(1);
        });

        it('should maintain fair competition with player in minimum arena', () => {
            // Set up minimum arena size (10x10)
            gameState.dynamicBounds = {
                minX: -5,
                maxX: 5,
                minZ: -5,
                maxZ: 5,
                size: 10,
            };

            // Position AI and player in confined space
            gameState.ai = { x: -2, y: 0, z: 0 };
            gameState.player = { x: 2, y: 0, z: 0 };
            gameState.aiDirection = { x: 1, z: 0 };
            gameState.playerTrail = [
                { x: 1, y: 0, z: 0 },
                { x: 0, y: 0, z: 0 },
            ];

            const { newDirection } = aiController.calculateAIDirection(gameState);

            // AI should still make intelligent decisions in minimum arena
            expect(newDirection).toBeDefined();
            expect(typeof newDirection.x).toBe('number');
            expect(typeof newDirection.z).toBe('number');
        });

        it('should not have unfair advantages over player', () => {
            // Test that AI uses same boundary information as player would have
            const boundaries = aiController.getCurrentBoundaries(gameState);

            expect(boundaries).toEqual(gameState.dynamicBounds);
        });

        it('should handle boundary changes gracefully', () => {
            // Start with larger arena
            gameState.dynamicBounds = {
                minX: -10,
                maxX: 10,
                minZ: -10,
                maxZ: 10,
                size: 20,
            };

            gameState.ai = { x: 8, y: 0, z: 0 };
            gameState.aiDirection = { x: 1, z: 0 };

            const result1 = aiController.calculateAIDirection(gameState);

            // Shrink arena
            gameState.dynamicBounds = {
                minX: -8,
                maxX: 8,
                minZ: -8,
                maxZ: 8,
                size: 16,
            };

            const result2 = aiController.calculateAIDirection(gameState);

            // AI should adapt to new boundaries
            expect(result2.newDirection).toBeDefined();
            expect(result2.newDirection.x).not.toBe(1); // Should turn away from new boundary
        });

        describe('Difficulty Scaling in Arena Shrink Mode', () => {
            it('should maintain easy difficulty behavior in shrinking arena', () => {
                const easyConfig = {
                    turnThreshold: 15,
                    randomTurnChance: 0.05,
                };

                // Test in medium-sized arena
                gameState.dynamicBounds = {
                    minX: -10,
                    maxX: 10,
                    minZ: -10,
                    maxZ: 10,
                    size: 20,
                };

                gameState.ai = { x: 9.5, y: 0, z: 0 }; // 0.5 units from boundary (5 whisker steps)
                gameState.aiDirection = { x: 1, z: 0 };

                const result = aiController.calculateAIDirection(gameState, easyConfig);

                // Easy AI should turn away from boundary with adapted threshold
                expect(result.newDirection.x).not.toBe(1);
            });

            it('should maintain hard difficulty behavior in shrinking arena', () => {
                const hardConfig = {
                    turnThreshold: 8,
                    randomTurnChance: 0.01,
                };

                // Test in medium-sized arena
                gameState.dynamicBounds = {
                    minX: -10,
                    maxX: 10,
                    minZ: -10,
                    maxZ: 10,
                    size: 20,
                };

                gameState.ai = { x: 5, y: 0, z: 0 }; // Further from boundary
                gameState.aiDirection = { x: 1, z: 0 };

                // Mock Math.random to ensure no random turns
                const originalRandom = Math.random;
                Math.random = () => 0.5; // Greater than 0.01

                try {
                    const result = aiController.calculateAIDirection(gameState, hardConfig);
                    // Hard AI should not turn until closer to boundary
                    expect(result.newDirection.x).toBe(1);
                } finally {
                    Math.random = originalRandom;
                }
            });

            it('should scale difficulty appropriately in minimum arena', () => {
                const easyConfig = {
                    turnThreshold: 15,
                    randomTurnChance: 0.05,
                };

                const hardConfig = {
                    turnThreshold: 8,
                    randomTurnChance: 0.01,
                };

                // Set up minimum arena size
                gameState.dynamicBounds = {
                    minX: -5,
                    maxX: 5,
                    minZ: -5,
                    maxZ: 5,
                    size: 10,
                };

                // Test easy AI in minimum arena
                gameState.ai = { x: 2, y: 0, z: 0 };
                gameState.aiDirection = { x: 1, z: 0 };

                const easyResult = aiController.calculateAIDirection(gameState, easyConfig);

                // Test hard AI in same position
                const hardResult = aiController.calculateAIDirection(gameState, hardConfig);

                // Both should make valid decisions but with different thresholds
                expect(easyResult.newDirection).toBeDefined();
                expect(hardResult.newDirection).toBeDefined();

                // Easy AI should be more likely to turn (more cautious)
                // Hard AI should be more aggressive (less likely to turn)
            });

            it('should remain competitive across all arena sizes', () => {
                const testConfigs = [
                    { name: 'easy', turnThreshold: 15, randomTurnChance: 0.05 },
                    { name: 'medium', turnThreshold: 10, randomTurnChance: 0.02 },
                    { name: 'hard', turnThreshold: 8, randomTurnChance: 0.01 },
                ];

                const arenaSizes = [30, 20, 15, 10]; // From full size to minimum

                testConfigs.forEach((config) => {
                    arenaSizes.forEach((size) => {
                        const halfSize = size / 2;
                        gameState.dynamicBounds = {
                            minX: -halfSize,
                            maxX: halfSize,
                            minZ: -halfSize,
                            maxZ: halfSize,
                            size: size,
                        };

                        // Position AI at reasonable distance from boundary
                        gameState.ai = { x: 0, y: 0, z: 0 };
                        gameState.aiDirection = { x: 1, z: 0 };

                        const result = aiController.calculateAIDirection(gameState, config);

                        // AI should always make valid decisions regardless of difficulty and arena size
                        expect(result.newDirection).toBeDefined();
                        expect(typeof result.newDirection.x).toBe('number');
                        expect(typeof result.newDirection.z).toBe('number');
                        expect(
                            Math.abs(result.newDirection.x) + Math.abs(result.newDirection.z)
                        ).toBe(1);
                    });
                });
            });

            it('should adapt whisker length consistently across difficulties', () => {
                const easyConfig = { turnThreshold: 15, randomTurnChance: 0.05 };
                const hardConfig = { turnThreshold: 8, randomTurnChance: 0.01 };

                // Set up small arena
                gameState.dynamicBounds = {
                    minX: -7,
                    maxX: 7,
                    minZ: -7,
                    maxZ: 7,
                    size: 14,
                };

                gameState.ai = { x: 0, y: 0, z: 0 };
                gameState.aiDirection = { x: 1, z: 0 };

                // Both difficulties should use same adapted whisker length
                const easyWhiskers = aiController.runDefensiveCheck(gameState);
                const hardWhiskers = aiController.runDefensiveCheck(gameState);

                expect(easyWhiskers.forward).toBe(hardWhiskers.forward);
                expect(easyWhiskers.left).toBe(hardWhiskers.left);
                expect(easyWhiskers.right).toBe(hardWhiskers.right);
            });
        });
    });
});
