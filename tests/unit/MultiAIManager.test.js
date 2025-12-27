/**
 * MultiAIManager Tests
 * Tests for managing multiple AI opponents and their coordination
 */

// Mock dependencies first
jest.mock('../../src/core/ai', () => ({
    AIController: jest.fn(),
    AICoordinator: jest.fn(),
}));
jest.mock('../../src/utils/Logger', () => ({
    Logger: {
        create: jest.fn(() => ({
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
        })),
    },
}));

const { MultiAIManager } = require('../../src/systems/MultiAIManager');
const { AIController, AICoordinator } = require('../../src/core/ai');

describe('MultiAIManager', () => {
    let manager;
    let mockGame;
    let mockDifficultyManager;
    let mockPerformanceMonitor;
    let mockAIController;
    let mockAICoordinator;

    beforeEach(() => {
        // Mock AI Controller - create new instance for each call
        AIController.mockImplementation(() => ({
            aiState: 'defensive',
            calculateAIDirection: jest.fn(),
        }));

        // Mock AI Coordinator
        mockAICoordinator = {
            coordinateAIDecisions: jest.fn(() => []),
        };
        AICoordinator.mockImplementation(() => mockAICoordinator);

        // Mock game
        mockGame = {
            getGameState: jest.fn(() => ({
                player: { x: 5, y: 5, direction: 'right', alive: true },
                aiOpponents: [{ id: 'ai_0', x: 10, y: 10, direction: 'left', alive: true }],
                gameOver: false,
            })),
            aiDirection: 'left',
            gameOver: false,
            scoreManager: {
                incrementPlayerScore: jest.fn(),
                incrementAIScore: jest.fn(),
            },
        };

        // Mock difficulty manager
        mockDifficultyManager = {
            setAIController: jest.fn(),
        };

        // Mock performance monitor
        mockPerformanceMonitor = {
            startAICalculation: jest.fn(),
            endAICalculation: jest.fn(),
        };

        manager = new MultiAIManager(mockGame, mockDifficultyManager, mockPerformanceMonitor);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Constructor', () => {
        it('should initialize with provided dependencies', () => {
            expect(manager.game).toBe(mockGame);
            expect(manager.difficultyManager).toBe(mockDifficultyManager);
            expect(manager.performanceMonitor).toBe(mockPerformanceMonitor);
        });

        it('should initialize empty AI controllers array', () => {
            expect(manager.aiControllers).toEqual([]);
        });

        it('should set default AI count to 1', () => {
            expect(manager.currentAICount).toBe(1);
        });

        it('should create AI coordinator', () => {
            expect(manager.aiCoordinator).toBeDefined();
            expect(AICoordinator).toHaveBeenCalled();
        });
    });

    describe('initializeAIControllers', () => {
        it('should create specified number of AI controllers', () => {
            manager.initializeAIControllers(3);
            expect(manager.aiControllers).toHaveLength(3);
            expect(manager.currentAICount).toBe(3);
        });

        it('should create 1 AI controller by default', () => {
            manager.initializeAIControllers();
            expect(manager.aiControllers).toHaveLength(1);
            expect(manager.currentAICount).toBe(1);
        });

        it('should limit AI count to maximum of 4', () => {
            manager.initializeAIControllers(10);
            expect(manager.aiControllers).toHaveLength(4);
            expect(manager.currentAICount).toBe(4);
        });

        it('should enforce minimum of 1 AI', () => {
            manager.initializeAIControllers(0);
            expect(manager.aiControllers).toHaveLength(1);
            expect(manager.currentAICount).toBe(1);
        });

        it('should enforce minimum of 1 for negative values', () => {
            manager.initializeAIControllers(-5);
            expect(manager.aiControllers).toHaveLength(1);
            expect(manager.currentAICount).toBe(1);
        });

        it('should floor decimal values', () => {
            manager.initializeAIControllers(2.7);
            expect(manager.aiControllers).toHaveLength(2);
            expect(manager.currentAICount).toBe(2);
        });

        it('should create controllers with different personalities', () => {
            manager.initializeAIControllers(3);
            expect(AIController).toHaveBeenCalledWith('aggressive');
            expect(AIController).toHaveBeenCalledWith('defensive');
            expect(AIController).toHaveBeenCalledWith('erratic');
        });

        it('should cycle personalities for more than 3 AIs', () => {
            manager.initializeAIControllers(4);
            expect(AIController).toHaveBeenCalledTimes(4);
            // Fourth AI should cycle back to aggressive
            expect(AIController).toHaveBeenNthCalledWith(4, 'aggressive');
        });

        it('should clear existing controllers before creating new ones', () => {
            manager.initializeAIControllers(2);
            const firstControllers = [...manager.aiControllers];
            manager.initializeAIControllers(3);
            expect(manager.aiControllers).not.toEqual(firstControllers);
            expect(manager.aiControllers).toHaveLength(3);
        });

        it('should update difficulty manager with first controller', () => {
            manager.initializeAIControllers(3);
            expect(mockDifficultyManager.setAIController).toHaveBeenCalledWith(
                manager.aiControllers[0]
            );
        });

        it('should not update difficulty manager if none provided', () => {
            const managerNoDiff = new MultiAIManager(mockGame, null, mockPerformanceMonitor);
            managerNoDiff.initializeAIControllers(2);
            // Should not throw error
            expect(managerNoDiff.aiControllers).toHaveLength(2);
        });

        it('should not update difficulty manager if no controllers created', () => {
            manager.aiControllers = [];
            manager.initializeAIControllers(0); // Will create 1 due to minimum
            expect(mockDifficultyManager.setAIController).toHaveBeenCalled();
        });
    });

    describe('calculateMultiAIDirections', () => {
        const gameState = {
            player: { x: 5, y: 5, direction: 'right', alive: true },
            aiOpponents: [
                { id: 'ai_0', x: 10, y: 10, direction: 'left', alive: true },
                { id: 'ai_1', x: 15, y: 15, direction: 'up', alive: true },
            ],
        };
        const difficultyConfig = { level: 'medium' };

        beforeEach(() => {
            manager.initializeAIControllers(2);
        });

        it('should return empty array if no AI opponents', () => {
            const emptyState = { aiOpponents: [] };
            const result = manager.calculateMultiAIDirections(emptyState, difficultyConfig);
            expect(result).toEqual([]);
        });

        it('should return empty array if aiOpponents is undefined', () => {
            const emptyState = {};
            const result = manager.calculateMultiAIDirections(emptyState, difficultyConfig);
            expect(result).toEqual([]);
        });

        it('should call coordinator with AI entities', () => {
            mockAICoordinator.coordinateAIDecisions.mockReturnValue([
                { newDirection: 'right', newState: 'defensive' },
                { newDirection: 'down', newState: 'aggressive' },
            ]);

            manager.calculateMultiAIDirections(gameState, difficultyConfig);

            expect(mockAICoordinator.coordinateAIDecisions).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: 'ai_0',
                        controller: expect.any(Object),
                    }),
                    expect.objectContaining({
                        id: 'ai_1',
                        controller: expect.any(Object),
                    }),
                ]),
                gameState,
                difficultyConfig
            );
        });

        it('should attach controllers to AI entities', () => {
            manager.calculateMultiAIDirections(gameState, difficultyConfig);

            const callArgs = mockAICoordinator.coordinateAIDecisions.mock.calls[0][0];
            expect(callArgs[0].controller).toBe(manager.aiControllers[0]);
            expect(callArgs[1].controller).toBe(manager.aiControllers[1]);
        });

        it('should fallback to first controller if not enough controllers', () => {
            const mockController = { aiState: 'defensive', calculateAIDirection: jest.fn() };
            manager.aiControllers = [mockController]; // Only 1 controller
            manager.calculateMultiAIDirections(gameState, difficultyConfig);

            const callArgs = mockAICoordinator.coordinateAIDecisions.mock.calls[0][0];
            expect(callArgs[0].controller).toBe(mockController);
            expect(callArgs[1].controller).toBe(mockController); // Fallback
        });

        it('should return decisions from coordinator', () => {
            const expectedDecisions = [
                { newDirection: 'right', newState: 'defensive' },
                { newDirection: 'down', newState: 'aggressive' },
            ];
            mockAICoordinator.coordinateAIDecisions.mockReturnValue(expectedDecisions);

            const result = manager.calculateMultiAIDirections(gameState, difficultyConfig);
            expect(result).toEqual(expectedDecisions);
        });

        it('should start performance monitoring', () => {
            manager.calculateMultiAIDirections(gameState, difficultyConfig);
            expect(mockPerformanceMonitor.startAICalculation).toHaveBeenCalledWith('multi-ai');
        });

        it('should end performance monitoring', () => {
            manager.calculateMultiAIDirections(gameState, difficultyConfig);
            expect(mockPerformanceMonitor.endAICalculation).toHaveBeenCalledWith('multi-ai');
        });

        it('should end performance monitoring even if error occurs', () => {
            mockAICoordinator.coordinateAIDecisions.mockImplementation(() => {
                throw new Error('Coordination failed');
            });

            expect(() => {
                manager.calculateMultiAIDirections(gameState, difficultyConfig);
            }).toThrow('Coordination failed');

            expect(mockPerformanceMonitor.endAICalculation).toHaveBeenCalledWith('multi-ai');
        });

        it('should work without performance monitor', () => {
            const managerNoPerf = new MultiAIManager(mockGame, mockDifficultyManager, null);
            managerNoPerf.initializeAIControllers(2);
            managerNoPerf.aiCoordinator = mockAICoordinator;

            mockAICoordinator.coordinateAIDecisions.mockReturnValue([]);
            const result = managerNoPerf.calculateMultiAIDirections(gameState, difficultyConfig);
            expect(result).toEqual([]);
        });
    });

    describe('applyAIDecisions', () => {
        beforeEach(() => {
            manager.initializeAIControllers(2);
        });

        it('should update AI directions from decisions', () => {
            const decisions = [
                { newDirection: 'right', newState: 'defensive' },
                { newDirection: 'down', newState: 'aggressive' },
            ];

            const gameState = {
                aiOpponents: [
                    { id: 'ai_0', direction: 'left', alive: true },
                    { id: 'ai_1', direction: 'up', alive: true },
                ],
            };
            mockGame.getGameState.mockReturnValue(gameState);

            manager.applyAIDecisions(decisions);

            expect(gameState.aiOpponents[0].direction).toBe('right');
            expect(gameState.aiOpponents[1].direction).toBe('down');
        });

        it('should update controller states', () => {
            const decisions = [
                { newDirection: 'right', newState: 'defensive' },
                { newDirection: 'down', newState: 'aggressive' },
            ];

            const gameState = {
                aiOpponents: [
                    { id: 'ai_0', direction: 'left', alive: true },
                    { id: 'ai_1', direction: 'up', alive: true },
                ],
            };
            mockGame.getGameState.mockReturnValue(gameState);

            manager.applyAIDecisions(decisions);

            expect(manager.aiControllers[0].aiState).toBe('defensive');
            expect(manager.aiControllers[1].aiState).toBe('aggressive');
        });

        it('should skip dead AI opponents', () => {
            const decisions = [
                { newDirection: 'right', newState: 'defensive' },
                { newDirection: 'down', newState: 'aggressive' },
            ];

            const gameState = {
                aiOpponents: [
                    { id: 'ai_0', direction: 'left', alive: false },
                    { id: 'ai_1', direction: 'up', alive: true },
                ],
            };
            mockGame.getGameState.mockReturnValue(gameState);

            const originalDirection = gameState.aiOpponents[0].direction;
            manager.applyAIDecisions(decisions);

            expect(gameState.aiOpponents[0].direction).toBe(originalDirection);
            expect(gameState.aiOpponents[1].direction).toBe('down');
        });

        it('should handle empty decisions array', () => {
            manager.applyAIDecisions([]);
            // Should not throw error
            expect(mockGame.getGameState).toHaveBeenCalled();
        });

        it('should handle more decisions than AI opponents', () => {
            const decisions = [
                { newDirection: 'right', newState: 'defensive' },
                { newDirection: 'down', newState: 'aggressive' },
                { newDirection: 'up', newState: 'erratic' },
            ];

            const gameState = {
                aiOpponents: [{ id: 'ai_0', direction: 'left', alive: true }],
            };
            mockGame.getGameState.mockReturnValue(gameState);

            manager.applyAIDecisions(decisions);
            expect(gameState.aiOpponents[0].direction).toBe('right');
        });

        it('should update legacy aiDirection property', () => {
            const decisions = [{ newDirection: 'right', newState: 'defensive' }];

            const gameState = {
                aiOpponents: [{ id: 'ai_0', direction: 'left', alive: true }],
            };
            mockGame.getGameState.mockReturnValue(gameState);

            manager.applyAIDecisions(decisions);
            expect(mockGame.aiDirection).toBe('right');
        });

        it('should handle missing aiOpponents', () => {
            const decisions = [{ newDirection: 'right', newState: 'defensive' }];
            mockGame.getGameState.mockReturnValue({});

            manager.applyAIDecisions(decisions);
            // Should not throw error
            expect(mockGame.getGameState).toHaveBeenCalled();
        });

        it('should not update controller state if controller missing', () => {
            const decisions = [
                { newDirection: 'right', newState: 'defensive' },
                { newDirection: 'down', newState: 'aggressive' },
            ];

            const gameState = {
                aiOpponents: [
                    { id: 'ai_0', direction: 'left', alive: true },
                    { id: 'ai_1', direction: 'up', alive: true },
                ],
            };
            mockGame.getGameState.mockReturnValue(gameState);

            const mockController = { aiState: 'defensive', calculateAIDirection: jest.fn() };
            manager.aiControllers = [mockController]; // Only 1 controller

            manager.applyAIDecisions(decisions);
            expect(gameState.aiOpponents[0].direction).toBe('right');
            expect(gameState.aiOpponents[1].direction).toBe('down');
        });
    });

    describe('handleMultiAICollisions', () => {
        let updateDisplayCallback;

        beforeEach(() => {
            updateDisplayCallback = jest.fn();
            manager.initializeAIControllers(2);
        });

        it('should mark crashed AI entities as dead', () => {
            const collisionResult = {
                crashedEntities: ['ai_0'],
                survivingEntities: ['player', 'ai_1'],
                winner: null,
            };

            const gameState = {
                aiOpponents: [
                    { id: 'ai_0', alive: true },
                    { id: 'ai_1', alive: true },
                ],
            };
            mockGame.getGameState.mockReturnValue(gameState);

            manager.handleMultiAICollisions(collisionResult, updateDisplayCallback);

            expect(gameState.aiOpponents[0].alive).toBe(false);
            expect(gameState.aiOpponents[1].alive).toBe(true);
        });

        it('should handle multiple crashed AI entities', () => {
            const collisionResult = {
                crashedEntities: ['ai_0', 'ai_1'],
                survivingEntities: ['player'],
                winner: 'player',
            };

            const gameState = {
                aiOpponents: [
                    { id: 'ai_0', alive: true },
                    { id: 'ai_1', alive: true },
                ],
            };
            mockGame.getGameState.mockReturnValue(gameState);

            manager.handleMultiAICollisions(collisionResult, updateDisplayCallback);

            expect(gameState.aiOpponents[0].alive).toBe(false);
            expect(gameState.aiOpponents[1].alive).toBe(false);
        });

        it('should ignore non-AI crashed entities', () => {
            const collisionResult = {
                crashedEntities: ['player'],
                survivingEntities: ['ai_0', 'ai_1'],
                winner: null,
            };

            const gameState = mockGame.getGameState();
            gameState.aiOpponents = [
                { id: 'ai_0', alive: true },
                { id: 'ai_1', alive: true },
            ];

            manager.handleMultiAICollisions(collisionResult, updateDisplayCallback);

            expect(gameState.aiOpponents[0].alive).toBe(true);
            expect(gameState.aiOpponents[1].alive).toBe(true);
        });

        it('should end game when player is last survivor', () => {
            const collisionResult = {
                crashedEntities: ['ai_0', 'ai_1'],
                survivingEntities: ['player'],
                winner: 'player',
            };

            const gameState = mockGame.getGameState();
            gameState.aiOpponents = [
                { id: 'ai_0', alive: true },
                { id: 'ai_1', alive: true },
            ];

            manager.handleMultiAICollisions(collisionResult, updateDisplayCallback);

            expect(mockGame.gameOver).toBe(true);
        });

        it('should end game when player crashes', () => {
            const collisionResult = {
                crashedEntities: ['player'],
                survivingEntities: ['ai_0', 'ai_1'],
                winner: null,
            };

            manager.handleMultiAICollisions(collisionResult, updateDisplayCallback);

            expect(mockGame.gameOver).toBe(true);
        });

        it('should not end game when multiple entities survive', () => {
            const collisionResult = {
                crashedEntities: ['ai_0'],
                survivingEntities: ['player', 'ai_1'],
                winner: null,
            };

            manager.handleMultiAICollisions(collisionResult, updateDisplayCallback);

            expect(mockGame.gameOver).toBe(false);
        });

        it('should call update display callback', () => {
            const collisionResult = {
                crashedEntities: ['ai_0'],
                survivingEntities: ['player', 'ai_1'],
                winner: null,
            };

            manager.handleMultiAICollisions(collisionResult, updateDisplayCallback);

            expect(updateDisplayCallback).toHaveBeenCalledWith(['player', 'ai_1']);
        });

        it('should work without update display callback', () => {
            const collisionResult = {
                crashedEntities: ['ai_0'],
                survivingEntities: ['player', 'ai_1'],
                winner: null,
            };

            manager.handleMultiAICollisions(collisionResult, null);
            // Should not throw error
            expect(mockGame.gameOver).toBe(false);
        });

        it('should handle empty crashed entities', () => {
            const collisionResult = {
                crashedEntities: [],
                survivingEntities: ['player', 'ai_0', 'ai_1'],
                winner: null,
            };

            manager.handleMultiAICollisions(collisionResult, updateDisplayCallback);

            expect(mockGame.gameOver).toBe(false);
        });

        it('should handle missing aiOpponents', () => {
            const collisionResult = {
                crashedEntities: ['ai_0'],
                survivingEntities: ['player'],
                winner: 'player',
            };

            mockGame.getGameState.mockReturnValue({});

            manager.handleMultiAICollisions(collisionResult, updateDisplayCallback);
            // Should not throw error
        });
    });

    describe('determineGameEnd', () => {
        it('should end game when player crashes', () => {
            const result = manager.determineGameEnd(['ai_0', 'ai_1'], null);
            expect(result).toBe(true);
        });

        it('should end game when player is last survivor', () => {
            const result = manager.determineGameEnd(['player'], 'player');
            expect(result).toBe(true);
        });

        it('should continue game when multiple entities survive', () => {
            const result = manager.determineGameEnd(['player', 'ai_0'], null);
            expect(result).toBe(false);
        });

        it('should continue game when player and multiple AIs survive', () => {
            const result = manager.determineGameEnd(['player', 'ai_0', 'ai_1'], null);
            expect(result).toBe(false);
        });

        it('should handle empty surviving entities', () => {
            const result = manager.determineGameEnd([], null);
            expect(result).toBe(true);
        });
    });

    describe('updateMultiAIScores', () => {
        it('should increment player score when last survivor', () => {
            manager.updateMultiAIScores('player', ['player']);
            expect(mockGame.scoreManager.incrementPlayerScore).toHaveBeenCalled();
            expect(mockGame.scoreManager.incrementAIScore).not.toHaveBeenCalled();
        });

        it('should increment AI score when player crashes', () => {
            manager.updateMultiAIScores(null, ['ai_0', 'ai_1']);
            expect(mockGame.scoreManager.incrementAIScore).toHaveBeenCalled();
            expect(mockGame.scoreManager.incrementPlayerScore).not.toHaveBeenCalled();
        });

        it('should increment AI score when player not last survivor', () => {
            manager.updateMultiAIScores('player', ['player', 'ai_0']);
            expect(mockGame.scoreManager.incrementAIScore).toHaveBeenCalled();
            expect(mockGame.scoreManager.incrementPlayerScore).not.toHaveBeenCalled();
        });

        it('should not crash if score manager missing', () => {
            mockGame.scoreManager = null;
            manager.updateMultiAIScores('player', ['player']);
            // Should not throw error
        });

        it('should handle empty survivors', () => {
            manager.updateMultiAIScores(null, []);
            expect(mockGame.scoreManager.incrementAIScore).toHaveBeenCalled();
        });
    });

    describe('getAIControllers', () => {
        it('should return AI controllers array', () => {
            manager.initializeAIControllers(3);
            const controllers = manager.getAIControllers();
            expect(controllers).toHaveLength(3);
            expect(controllers).toBe(manager.aiControllers);
        });

        it('should return empty array if not initialized', () => {
            const controllers = manager.getAIControllers();
            expect(controllers).toEqual([]);
        });
    });

    describe('getCurrentAICount', () => {
        it('should return current AI count', () => {
            manager.initializeAIControllers(3);
            expect(manager.getCurrentAICount()).toBe(3);
        });

        it('should return default count if not initialized', () => {
            expect(manager.getCurrentAICount()).toBe(1);
        });

        it('should update after reinitialization', () => {
            manager.initializeAIControllers(2);
            expect(manager.getCurrentAICount()).toBe(2);
            manager.initializeAIControllers(4);
            expect(manager.getCurrentAICount()).toBe(4);
        });
    });

    describe('Integration Scenarios', () => {
        it('should handle full game cycle with 3 AIs', () => {
            manager.initializeAIControllers(3);

            const gameState = {
                player: { x: 5, y: 5, direction: 'right', alive: true },
                aiOpponents: [
                    { id: 'ai_0', x: 10, y: 10, direction: 'left', alive: true },
                    { id: 'ai_1', x: 15, y: 15, direction: 'up', alive: true },
                    { id: 'ai_2', x: 20, y: 20, direction: 'down', alive: true },
                ],
            };

            mockGame.getGameState.mockReturnValue(gameState);
            mockAICoordinator.coordinateAIDecisions.mockReturnValue([
                { newDirection: 'right', newState: 'defensive' },
                { newDirection: 'down', newState: 'aggressive' },
                { newDirection: 'left', newState: 'erratic' },
            ]);

            const decisions = manager.calculateMultiAIDirections(gameState, {});
            manager.applyAIDecisions(decisions);

            expect(gameState.aiOpponents[0].direction).toBe('right');
            expect(gameState.aiOpponents[1].direction).toBe('down');
            expect(gameState.aiOpponents[2].direction).toBe('left');
        });

        it('should handle progressive AI elimination', () => {
            manager.initializeAIControllers(3);

            const gameState = mockGame.getGameState();
            gameState.aiOpponents = [
                { id: 'ai_0', alive: true },
                { id: 'ai_1', alive: true },
                { id: 'ai_2', alive: true },
            ];

            // First collision - one AI crashes
            manager.handleMultiAICollisions(
                {
                    crashedEntities: ['ai_0'],
                    survivingEntities: ['player', 'ai_1', 'ai_2'],
                    winner: null,
                },
                jest.fn()
            );
            expect(mockGame.gameOver).toBe(false);

            // Second collision - another AI crashes
            manager.handleMultiAICollisions(
                {
                    crashedEntities: ['ai_1'],
                    survivingEntities: ['player', 'ai_2'],
                    winner: null,
                },
                jest.fn()
            );
            expect(mockGame.gameOver).toBe(false);

            // Final collision - last AI crashes, player wins
            manager.handleMultiAICollisions(
                {
                    crashedEntities: ['ai_2'],
                    survivingEntities: ['player'],
                    winner: 'player',
                },
                jest.fn()
            );
            expect(mockGame.gameOver).toBe(true);
            expect(mockGame.scoreManager.incrementPlayerScore).toHaveBeenCalled();
        });

        it('should handle player crash with multiple AIs surviving', () => {
            manager.initializeAIControllers(3);

            manager.handleMultiAICollisions(
                {
                    crashedEntities: ['player'],
                    survivingEntities: ['ai_0', 'ai_1', 'ai_2'],
                    winner: null,
                },
                jest.fn()
            );

            expect(mockGame.gameOver).toBe(true);
            expect(mockGame.scoreManager.incrementAIScore).toHaveBeenCalled();
        });
    });
});
