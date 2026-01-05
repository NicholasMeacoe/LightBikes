/**
 * Tests for MultiAIManager
 */

// Define mock factories at the top
jest.mock('../../src/core/ai.js', () => ({
    AIController: jest.fn(),
    AICoordinator: jest.fn(),
}));

jest.mock('../../src/utils/Logger.js', () => ({
    Logger: {
        create: jest.fn(() => ({
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
        })),
    },
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
    createLogger: jest.fn(),
}));

describe('MultiAIManager', () => {
    let MultiAIManager;
    let AIController, AICoordinator;
    let Logger;

    let multiAIManager;
    let mockGame;
    let mockDifficultyManager;
    let mockPerformanceMonitor;
    let mockAICoordinator;
    let mockAIControllerInstances;

    beforeEach(() => {
        // Reset modules and mocks to ensure clean state
        jest.resetModules();
        jest.clearAllMocks();

        // Re-require modules to pick up fresh mocks/state
        MultiAIManager = require('../../src/systems/MultiAIManager.js').MultiAIManager;
        const aiModule = require('../../src/core/ai.js');
        AIController = aiModule.AIController;
        AICoordinator = aiModule.AICoordinator;
        Logger = require('../../src/utils/Logger.js').Logger;

        mockAIControllerInstances = [];

        // Debug Logger return
        // console.log('DEBUG: Logger.create returns:', Logger.create('test'));

        // Setup AI Controller mock
        AIController.mockImplementation((personality) => {
            const instance = {
                personality,
                aiState: 'neutral',
                calculateAIDirection: jest.fn(),
                runDefensiveCheck: jest.fn(),
            };
            mockAIControllerInstances.push(instance);
            return instance;
        });

        // Setup AI Coordinator mock
        mockAICoordinator = {
            coordinateAIDecisions: jest.fn().mockReturnValue([]),
        };
        AICoordinator.mockImplementation(() => mockAICoordinator);

        // Setup Game Mocks
        mockGame = {
            getGameState: jest.fn(),
            scoreManager: {
                incrementPlayerScore: jest.fn(),
                incrementAIScore: jest.fn(),
            },
            aiDirection: null,
            gameOver: false,
        };

        // Setup Difficulty Manager Mock
        mockDifficultyManager = {
            setAIController: jest.fn(),
        };

        // Setup Performance Monitor Mock
        mockPerformanceMonitor = {
            startAICalculation: jest.fn(),
            endAICalculation: jest.fn(),
        };

        // Initialize System
        multiAIManager = new MultiAIManager(
            mockGame,
            mockDifficultyManager,
            mockPerformanceMonitor
        );
    });

    describe('Initialization', () => {
        it('should initialize with default values', () => {
            expect(multiAIManager.currentAICount).toBe(1);
            expect(multiAIManager.aiControllers).toEqual([]);
            expect(AICoordinator).toHaveBeenCalled();
            // Logger check
            expect(Logger.create).toHaveBeenCalledWith('MultiAIManager');
        });

        it('should initialize a single AI controller by default', () => {
            multiAIManager.initializeAIControllers(); // Default to 1
            expect(multiAIManager.currentAICount).toBe(1);
            expect(AIController).toHaveBeenCalledTimes(1);
            expect(mockDifficultyManager.setAIController).toHaveBeenCalledWith(
                mockAIControllerInstances[0]
            );
        });

        it('should initialize specific number of AI controllers', () => {
            multiAIManager.initializeAIControllers(3);
            expect(multiAIManager.currentAICount).toBe(3);
            expect(AIController).toHaveBeenCalledTimes(3);
            expect(multiAIManager.aiControllers).toHaveLength(3);
        });

        it('should clamp AI count between 1 and 4', () => {
            multiAIManager.initializeAIControllers(0);
            expect(multiAIManager.currentAICount).toBe(1);

            multiAIManager.initializeAIControllers(5);
            expect(multiAIManager.currentAICount).toBe(4);

            multiAIManager.initializeAIControllers(-1);
            expect(multiAIManager.currentAICount).toBe(1);
        });

        it('should assign personalities in rotation', () => {
            multiAIManager.initializeAIControllers(4);
            const personalities = mockAIControllerInstances.map((c) => c.personality);
            expect(personalities[0]).toBe('aggressive');
            expect(personalities[1]).toBe('defensive');
            expect(personalities[2]).toBe('erratic');
            expect(personalities[3]).toBe('aggressive'); // Wraps around
        });

        it('should handle missing difficulty manager', () => {
            const managerNoDiff = new MultiAIManager(mockGame, null, mockPerformanceMonitor);
            expect(() => managerNoDiff.initializeAIControllers(1)).not.toThrow();
        });
    });

    describe('AI Coordination', () => {
        beforeEach(() => {
            multiAIManager.initializeAIControllers(2);
        });

        it('should return empty array if no opponents', () => {
            const gameState = { aiOpponents: [] };
            const decisions = multiAIManager.calculateMultiAIDirections(gameState, {});
            expect(decisions).toEqual([]);
            expect(mockPerformanceMonitor.startAICalculation).not.toHaveBeenCalled();
        });

        it('should coordinate decisions for valid opponents', () => {
            const gameState = {
                aiOpponents: [
                    { id: 'ai_0', alive: true },
                    { id: 'ai_1', alive: true },
                ],
            };
            const difficultyConfig = { speed: 10 };

            const expectedDecisions = [
                { id: 'ai_0', newDirection: { x: 1, y: 0 } },
                { id: 'ai_1', newDirection: { x: 0, y: 1 } },
            ];
            mockAICoordinator.coordinateAIDecisions.mockReturnValue(expectedDecisions);

            const result = multiAIManager.calculateMultiAIDirections(gameState, difficultyConfig);

            expect(mockPerformanceMonitor.startAICalculation).toHaveBeenCalledWith('multi-ai');
            expect(mockAICoordinator.coordinateAIDecisions).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: 'ai_0',
                        controller: mockAIControllerInstances[0],
                    }),
                    expect.objectContaining({
                        id: 'ai_1',
                        controller: mockAIControllerInstances[1],
                    }),
                ]),
                gameState,
                difficultyConfig
            );
            expect(mockPerformanceMonitor.endAICalculation).toHaveBeenCalledWith('multi-ai');
            expect(result).toBe(expectedDecisions);
        });

        it('should handle monitoring during errors', () => {
            mockAICoordinator.coordinateAIDecisions.mockImplementation(() => {
                throw new Error('AI Error');
            });

            const gameState = { aiOpponents: [{ id: 'ai_0' }] };

            expect(() => {
                multiAIManager.calculateMultiAIDirections(gameState, {});
            }).toThrow('AI Error');

            expect(mockPerformanceMonitor.startAICalculation).toHaveBeenCalled();
            expect(mockPerformanceMonitor.endAICalculation).toHaveBeenCalled(); // Should still be called (finally block)
        });

        it('should fallback to first controller if fewer controllers than opponents', () => {
            // Re-init with only 1 controller
            multiAIManager.initializeAIControllers(1);

            const gameState = {
                aiOpponents: [
                    { id: 'ai_0', alive: true },
                    { id: 'ai_1', alive: true },
                ],
            };

            multiAIManager.calculateMultiAIDirections(gameState, {});

            // Both entities should use the single controller (instance 0)
            const passedEntities = mockAICoordinator.coordinateAIDecisions.mock.calls[0][0];
            expect(passedEntities[0].controller).toBe(multiAIManager.aiControllers[0]);
            expect(passedEntities[1].controller).toBe(multiAIManager.aiControllers[0]);
        });
    });

    describe('Application of Decisions', () => {
        beforeEach(() => {
            multiAIManager.initializeAIControllers(2);
        });

        it('should apply decisions to game state', () => {
            const gameState = {
                aiOpponents: [
                    { id: 'ai_0', alive: true, direction: { x: 0, y: 0 } },
                    { id: 'ai_1', alive: true, direction: { x: 0, y: 0 } },
                ],
            };
            mockGame.getGameState.mockReturnValue(gameState);

            const decisions = [
                { newDirection: { x: 1, y: 0 }, newState: 'attack' },
                { newDirection: { x: 0, y: 1 }, newState: 'defend' },
            ];

            multiAIManager.applyAIDecisions(decisions);

            expect(gameState.aiOpponents[0].direction).toEqual({ x: 1, y: 0 });
            expect(gameState.aiOpponents[1].direction).toEqual({ x: 0, y: 1 });

            // Check controller state updates
            expect(multiAIManager.aiControllers[0].aiState).toBe('attack');
            expect(multiAIManager.aiControllers[1].aiState).toBe('defend');

            // Check legacy compatibility
            expect(mockGame.aiDirection).toEqual({ x: 1, y: 0 });
        });

        it('should not update dead opponents', () => {
            const gameState = {
                aiOpponents: [{ id: 'ai_0', alive: false, direction: { x: 0, y: 0 } }],
            };
            mockGame.getGameState.mockReturnValue(gameState);

            const decisions = [{ newDirection: { x: 1, y: 0 } }];
            multiAIManager.applyAIDecisions(decisions);

            expect(gameState.aiOpponents[0].direction).toEqual({ x: 0, y: 0 }); // Unchanged
        });

        it('should apply decisions safely if AI count mismatch', () => {
            const gameState = {
                aiOpponents: [{ id: 'ai_0', alive: true }],
            };
            mockGame.getGameState.mockReturnValue(gameState);

            // More decisions than opponents
            const decisions = [{ newDirection: { x: 1, y: 0 } }, { newDirection: { x: 0, y: 1 } }];

            expect(() => multiAIManager.applyAIDecisions(decisions)).not.toThrow();
            expect(gameState.aiOpponents[0].direction).toEqual({ x: 1, y: 0 });
        });
    });

    describe('Collision Handling', () => {
        let gameState;

        beforeEach(() => {
            gameState = {
                aiOpponents: [
                    { id: 'ai_0', alive: true },
                    { id: 'ai_1', alive: true },
                ],
            };
            mockGame.getGameState.mockReturnValue(gameState);
        });

        it('should mark crashed AI as dead', () => {
            const collisionResult = {
                crashedEntities: ['ai_0'],
                survivingEntities: ['player', 'ai_1'],
                winner: null,
            };

            multiAIManager.handleMultiAICollisions(collisionResult, jest.fn());

            expect(gameState.aiOpponents[0].alive).toBe(false);
            expect(gameState.aiOpponents[1].alive).toBe(true);
        });

        it('should ignore non-AI crashes for marking dead', () => {
            const collisionResult = {
                crashedEntities: ['player'],
                survivingEntities: ['ai_0'],
                winner: 'ai_0',
            };

            multiAIManager.handleMultiAICollisions(collisionResult, jest.fn());

            expect(gameState.aiOpponents[0].alive).toBe(true);
            expect(gameState.aiOpponents[1].alive).toBe(true);
        });

        it('should end game if player crashes', () => {
            const collisionResult = {
                crashedEntities: ['player'],
                survivingEntities: ['ai_0'],
                winner: 'ai_0',
            };

            multiAIManager.handleMultiAICollisions(collisionResult, jest.fn());
            expect(mockGame.gameOver).toBe(true);
        });

        it('should end game if player is last survivor', () => {
            const collisionResult = {
                crashedEntities: ['ai_0', 'ai_1'],
                survivingEntities: ['player'],
                winner: 'player',
            };

            multiAIManager.handleMultiAICollisions(collisionResult, jest.fn());
            expect(mockGame.gameOver).toBe(true);
        });

        it('should invoke display callback', () => {
            const callback = jest.fn();
            const collisionResult = { survivingEntities: ['player'] };
            multiAIManager.handleMultiAICollisions(collisionResult, callback);
            expect(callback).toHaveBeenCalledWith(['player']);
        });
    });

    describe('Scoring Logic', () => {
        beforeEach(() => {
            // Ensure ScoreManager is present
            mockGame.scoreManager = {
                incrementPlayerScore: jest.fn(),
                incrementAIScore: jest.fn(),
            };
        });

        it('should award point to player if they win as last survivor', () => {
            // condition: winner = player, survivors = [player]
            multiAIManager.updateMultiAIScores('player', ['player']);
            expect(mockGame.scoreManager.incrementPlayerScore).toHaveBeenCalled();
            expect(mockGame.scoreManager.incrementAIScore).not.toHaveBeenCalled();
        });

        it('should award point to AI if player is not last survivor', () => {
            // Player crashed
            multiAIManager.updateMultiAIScores('ai_0', ['ai_0']);
            expect(mockGame.scoreManager.incrementAIScore).toHaveBeenCalled();
            expect(mockGame.scoreManager.incrementPlayerScore).not.toHaveBeenCalled();
        });

        it('should award point to AI if player wins but others survive (technically incomplete)', () => {
            // This case is unlikely given determineGameEnd logic, but testing the else branch
            // logic: winner='player' but survivors > 1
            multiAIManager.updateMultiAIScores('player', ['player', 'ai_0']);
            expect(mockGame.scoreManager.incrementAIScore).toHaveBeenCalled();
        });

        it('should do nothing if scoreManager is missing', () => {
            mockGame.scoreManager = null;
            expect(() => {
                multiAIManager.updateMultiAIScores('player', ['player']);
            }).not.toThrow();
        });
    });

    describe('Getters', () => {
        it('should return controllers', () => {
            multiAIManager.initializeAIControllers(2);
            expect(multiAIManager.getAIControllers()).toHaveLength(2);
        });

        it('should return current count', () => {
            multiAIManager.initializeAIControllers(3);
            expect(multiAIManager.getCurrentAICount()).toBe(3);
        });
    });
});
