const { Game } = require('@/core/game.js');
const { GameModes } = require('@/systems/GameModes.js');
const { ModeSelector } = require('@/ui/ModeSelector.js');

// Mock ScorePersistence to ensure consistent test behavior
jest.mock('./scorePersistence.js', () => ({
    ScorePersistence: {
        loadHighScore: jest.fn(() => 0),
        saveHighScore: jest.fn(() => true)
    }
}));

// Mock performance.now for consistent timing tests
const mockPerformanceNow = jest.fn();
global.performance = { now: mockPerformanceNow };

// Mock DOM for UI components
const mockElement = {
    remove: jest.fn(),
    classList: { add: jest.fn(), remove: jest.fn() },
    style: { display: '' },
    textContent: '',
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
};

global.document = {
    createElement: jest.fn(() => mockElement),
    body: { appendChild: jest.fn() },
    head: { appendChild: jest.fn() },
    getElementById: jest.fn(() => null)
};

global.localStorage = {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn()
};

describe('Time Trial Backward Compatibility Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockPerformanceNow.mockReturnValue(0);
    });

    describe('Classic Mode Functionality Preservation', () => {
        let classicGame;

        beforeEach(() => {
            classicGame = new Game(GameModes.CLASSIC);
        });

        it('should maintain original Classic mode behavior', () => {
            // Verify Classic mode initialization
            expect(classicGame.gameMode).toBe(GameModes.CLASSIC);
            expect(classicGame.survivalTimer).toBeNull();
            expect(classicGame.ai).toBeDefined();
            expect(classicGame.aiDirection).toBeDefined();
            expect(classicGame.aiTrail).toBeDefined();
        });

        it('should preserve AI functionality in Classic mode', () => {
            const initialAIPosition = { ...classicGame.ai };
            const initialAIDirection = { ...classicGame.aiDirection };

            classicGame.update();

            // AI should have moved
            expect(classicGame.ai.x).not.toBe(initialAIPosition.x);
            expect(classicGame.aiTrail.length).toBeGreaterThan(0);
            
            // AI direction should be maintained or changed based on AI logic
            expect(classicGame.aiDirection).toBeDefined();
            expect(typeof classicGame.aiDirection.x).toBe('number');
            expect(typeof classicGame.aiDirection.y).toBe('number');
            expect(typeof classicGame.aiDirection.z).toBe('number');
        });

        it('should maintain original scoring system in Classic mode', () => {
            const initialState = classicGame.getGameState();
            expect(initialState.playerScore).toBe(0);
            expect(initialState.aiScore).toBe(0);

            // Simulate AI collision
            const collisionResult = { playerCollided: false, aiCollided: true };
            classicGame.handleRoundEnd(collisionResult);

            const finalState = classicGame.getGameState();
            expect(finalState.playerScore).toBe(1);
            expect(finalState.aiScore).toBe(0);
        });

        it('should preserve original game state structure in Classic mode', () => {
            const gameState = classicGame.getGameState();

            // Verify all original properties exist
            expect(gameState).toHaveProperty('player');
            expect(gameState).toHaveProperty('ai');
            expect(gameState).toHaveProperty('playerDirection');
            expect(gameState).toHaveProperty('aiDirection');
            expect(gameState).toHaveProperty('playerTrail');
            expect(gameState).toHaveProperty('aiTrail');
            expect(gameState).toHaveProperty('playerScore');
            expect(gameState).toHaveProperty('aiScore');
            expect(gameState).toHaveProperty('gameStarted');
            expect(gameState).toHaveProperty('isPaused');

            // Verify Time Trial properties are not present
            expect(gameState).not.toHaveProperty('survivalTime');
            expect(gameState).not.toHaveProperty('formattedSurvivalTime');
            expect(gameState).not.toHaveProperty('timerRunning');
        });

        it('should maintain original pause/resume behavior in Classic mode', () => {
            classicGame.update(); // Start game
            expect(classicGame.getGameState().gameStarted).toBe(true);

            // Test pause
            classicGame.pause();
            expect(classicGame.isPaused).toBe(true);

            // Test resume
            classicGame.resume();
            expect(classicGame.isPaused).toBe(false);

            // Should not throw errors or affect non-existent timer
            expect(() => {
                classicGame.pause();
                classicGame.resume();
            }).not.toThrow();
        });

        it('should preserve original restart functionality in Classic mode', () => {
            // Run game for a bit
            classicGame.update();
            classicGame.update();
            classicGame.update();

            const stateBeforeRestart = classicGame.getGameState();
            expect(stateBeforeRestart.playerTrail.length).toBeGreaterThan(0);
            expect(stateBeforeRestart.aiTrail.length).toBeGreaterThan(0);

            // Restart
            classicGame.restart();

            const stateAfterRestart = classicGame.getGameState();
            expect(stateAfterRestart.playerTrail.length).toBe(0);
            expect(stateAfterRestart.aiTrail.length).toBe(0);
            expect(stateAfterRestart.gameStarted).toBe(false);
            expect(stateAfterRestart.gameMode).toBe(GameModes.CLASSIC);
        });

        it('should maintain original collision handling in Classic mode', () => {
            // Test that collision handling still works as expected
            classicGame.update();

            // Verify handleRoundEnd method exists and works
            expect(typeof classicGame.handleRoundEnd).toBe('function');
            
            // Test collision handling
            const mockCollisionResult = { playerCollided: false, aiCollided: true };
            expect(() => {
                classicGame.handleRoundEnd(mockCollisionResult);
            }).not.toThrow();
            
            // Verify score was updated correctly
            const state = classicGame.getGameState();
            expect(state.playerScore).toBe(1);
        });
    });

    describe('Mode Switching Without Side Effects', () => {
        it('should switch between modes without affecting existing mechanics', () => {
            // Start with Classic mode
            const classicGame = new Game(GameModes.CLASSIC);
            classicGame.update();
            const classicState = classicGame.getGameState();

            // Create Time Trial mode
            const timeTrialGame = new Game(GameModes.TIME_TRIAL);
            timeTrialGame.update();
            const timeTrialState = timeTrialGame.getGameState();

            // Create another Classic mode to verify no contamination
            const classicGame2 = new Game(GameModes.CLASSIC);
            classicGame2.update();
            const classicState2 = classicGame2.getGameState();

            // Verify Classic mode behavior is consistent
            expect(classicState2.ai).toBeDefined();
            expect(classicState2.aiDirection).toBeDefined();
            expect(classicState2.aiTrail).toBeDefined();
            expect(classicState2.survivalTime).toBeUndefined();

            // Verify Time Trial mode is isolated
            expect(timeTrialState.ai).toBeUndefined();
            expect(timeTrialState.survivalTime).toBeDefined();
        });

        it('should handle rapid mode switching efficiently', () => {
            const games = [];
            const startTime = Date.now();

            // Create alternating game modes rapidly
            for (let i = 0; i < 100; i++) {
                const mode = i % 2 === 0 ? GameModes.CLASSIC : GameModes.TIME_TRIAL;
                games.push(new Game(mode));
            }

            const endTime = Date.now();

            // Should complete efficiently
            expect(endTime - startTime).toBeLessThan(100);

            // Verify all games are properly initialized
            games.forEach((game, index) => {
                const expectedMode = index % 2 === 0 ? GameModes.CLASSIC : GameModes.TIME_TRIAL;
                expect(game.gameMode).toBe(expectedMode);

                if (expectedMode === GameModes.CLASSIC) {
                    expect(game.ai).toBeDefined();
                    expect(game.survivalTimer).toBeNull();
                } else {
                    expect(game.ai).toBeNull();
                    expect(game.survivalTimer).toBeDefined();
                }
            });
        });

        it('should maintain mode isolation during concurrent operations', () => {
            const classicGame = new Game(GameModes.CLASSIC);
            const timeTrialGame = new Game(GameModes.TIME_TRIAL);

            // Run both games concurrently
            mockPerformanceNow.mockReturnValue(1000);
            classicGame.update();
            timeTrialGame.update();

            mockPerformanceNow.mockReturnValue(2000);
            classicGame.update();
            timeTrialGame.update();

            // Verify isolation
            const classicState = classicGame.getGameState();
            const timeTrialState = timeTrialGame.getGameState();

            expect(classicState.ai).toBeDefined();
            expect(classicState.survivalTime).toBeUndefined();
            expect(timeTrialState.ai).toBeUndefined();
            expect(timeTrialState.survivalTime).toBeDefined();

            // Operations on one should not affect the other
            classicGame.pause();
            expect(classicGame.isPaused).toBe(true);
            expect(timeTrialGame.isPaused).toBe(false);

            timeTrialGame.pause();
            expect(timeTrialGame.isPaused).toBe(true);
            expect(classicGame.isPaused).toBe(true); // Still paused from before
        });
    });

    describe('Existing Controls and Features Compatibility', () => {
        it('should maintain all existing control methods in both modes', () => {
            const classicGame = new Game(GameModes.CLASSIC);
            const timeTrialGame = new Game(GameModes.TIME_TRIAL);

            // Verify all control methods exist and work
            const controlMethods = [
                'update', 'pause', 'resume', 'restart', 
                'changePlayerDirection', 'getGameState', 'handleRoundEnd'
            ];

            controlMethods.forEach(method => {
                expect(typeof classicGame[method]).toBe('function');
                expect(typeof timeTrialGame[method]).toBe('function');
            });

            // Test that methods work without throwing
            expect(() => {
                classicGame.update();
                classicGame.pause();
                classicGame.resume();
                classicGame.getGameState();
            }).not.toThrow();

            expect(() => {
                timeTrialGame.update();
                timeTrialGame.pause();
                timeTrialGame.resume();
                timeTrialGame.getGameState();
            }).not.toThrow();
        });

        it('should preserve direction change functionality in both modes', () => {
            const classicGame = new Game(GameModes.CLASSIC);
            const timeTrialGame = new Game(GameModes.TIME_TRIAL);

            // Test direction changes using key inputs (as per actual API)
            expect(() => {
                classicGame.changePlayerDirection('ArrowUp');
                timeTrialGame.changePlayerDirection('ArrowUp');
            }).not.toThrow();

            // Verify direction change method exists and works
            expect(typeof classicGame.changePlayerDirection).toBe('function');
            expect(typeof timeTrialGame.changePlayerDirection).toBe('function');
        });

        it('should maintain collision handling consistency across modes', () => {
            const classicGame = new Game(GameModes.CLASSIC);
            const timeTrialGame = new Game(GameModes.TIME_TRIAL);

            // Run games to generate trails
            for (let i = 0; i < 5; i++) {
                classicGame.update();
                timeTrialGame.update();
            }

            // Test collision handling works in both modes
            const mockCollisionResult = { playerCollided: true, aiCollided: false };
            
            expect(() => {
                classicGame.handleRoundEnd(mockCollisionResult);
                timeTrialGame.handleRoundEnd(mockCollisionResult);
            }).not.toThrow();

            // Verify different behavior: Classic updates scores, Time Trial stops timer
            const classicState = classicGame.getGameState();
            const timeTrialState = timeTrialGame.getGameState();
            
            // Classic mode should have updated AI score
            expect(classicState.aiScore).toBe(1);
            
            // Time Trial mode should have stopped timer
            expect(timeTrialGame.survivalTimer.isRunning).toBe(false);
        });

        it('should preserve game state consistency across restarts in both modes', () => {
            const classicGame = new Game(GameModes.CLASSIC);
            const timeTrialGame = new Game(GameModes.TIME_TRIAL);

            // Run and restart multiple times
            for (let i = 0; i < 3; i++) {
                classicGame.update();
                timeTrialGame.update();
                
                classicGame.restart();
                timeTrialGame.restart();

                // Verify clean state after restart
                const classicState = classicGame.getGameState();
                const timeTrialState = timeTrialGame.getGameState();

                expect(classicState.playerTrail.length).toBe(0);
                expect(classicState.gameStarted).toBe(false);
                expect(timeTrialState.playerTrail.length).toBe(0);
                expect(timeTrialState.gameStarted).toBe(false);

                // Mode-specific checks
                expect(classicState.aiTrail.length).toBe(0);
                if (timeTrialState.survivalTime !== undefined) {
                    expect(timeTrialState.survivalTime).toBe(0);
                }
            }
        });
    });

    describe('ModeSelector Backward Compatibility', () => {
        let modeSelector;

        beforeEach(() => {
            const mockGame = new Game(GameModes.CLASSIC);
            modeSelector = new ModeSelector(mockGame);
        });

        it('should default to Classic mode for backward compatibility', () => {
            expect(modeSelector.getSelectedMode()).toBe(GameModes.CLASSIC);
        });

        it('should not interfere with existing game initialization', () => {
            // Test that games can still be created without mode selector
            const gameWithoutSelector = new Game();
            expect(gameWithoutSelector.gameMode).toBe(GameModes.CLASSIC);

            const explicitClassicGame = new Game(GameModes.CLASSIC);
            expect(explicitClassicGame.gameMode).toBe(GameModes.CLASSIC);
        });

        it('should handle missing localStorage gracefully', () => {
            // Mock localStorage failure
            const originalGetItem = global.localStorage.getItem;
            global.localStorage.getItem = jest.fn(() => {
                throw new Error('localStorage not available');
            });

            expect(() => {
                const mockGame = new Game(GameModes.CLASSIC);
                const selector = new ModeSelector(mockGame);
                expect(selector.getSelectedMode()).toBe(GameModes.CLASSIC);
            }).not.toThrow();

            // Restore
            global.localStorage.getItem = originalGetItem;
        });

        it('should maintain mode selection persistence without breaking existing functionality', () => {
            // Select Time Trial mode
            modeSelector.selectMode(GameModes.TIME_TRIAL);
            expect(modeSelector.getSelectedMode()).toBe(GameModes.TIME_TRIAL);

            // Should be able to switch back to Classic
            modeSelector.selectMode(GameModes.CLASSIC);
            expect(modeSelector.getSelectedMode()).toBe(GameModes.CLASSIC);
            
            // Test that mode selection works without throwing errors
            expect(() => {
                modeSelector.selectMode(GameModes.TIME_TRIAL);
                modeSelector.selectMode(GameModes.CLASSIC);
            }).not.toThrow();
        });
    });

    describe('API Compatibility', () => {
        it('should maintain all existing public methods', () => {
            const classicGame = new Game(GameModes.CLASSIC);
            const timeTrialGame = new Game(GameModes.TIME_TRIAL);

            // List of methods that should exist for backward compatibility
            const requiredMethods = [
                'update', 'pause', 'resume', 'restart',
                'changePlayerDirection', 'getGameState',
                'handleRoundEnd', 'init', 'setGameSpeed'
            ];

            requiredMethods.forEach(method => {
                expect(classicGame[method]).toBeDefined();
                expect(typeof classicGame[method]).toBe('function');
                expect(timeTrialGame[method]).toBeDefined();
                expect(typeof timeTrialGame[method]).toBe('function');
            });
        });

        it('should maintain existing method signatures', () => {
            const game = new Game(GameModes.CLASSIC);

            // Test method signatures haven't changed
            expect(() => {
                game.changePlayerDirection({ x: 1, y: 0, z: 0 });
                game.handleRoundEnd({ playerCollided: false, aiCollided: true });
            }).not.toThrow();

            // getGameState should return object with expected structure
            const state = game.getGameState();
            expect(typeof state).toBe('object');
            expect(state).not.toBeNull();
        });

        it('should add new methods without breaking existing code', () => {
            const timeTrialGame = new Game(GameModes.TIME_TRIAL);

            // New Time Trial methods should exist
            expect(typeof timeTrialGame.getSurvivalTime).toBe('function');
            expect(typeof timeTrialGame.getFormattedSurvivalTime).toBe('function');
            expect(typeof timeTrialGame.isTimeTrialMode).toBe('function');

            // But calling them on Classic mode should not break
            const classicGame = new Game(GameModes.CLASSIC);
            expect(() => {
                classicGame.getSurvivalTime();
                classicGame.getFormattedSurvivalTime();
                classicGame.isTimeTrialMode();
            }).not.toThrow();

            // Should return sensible defaults
            expect(classicGame.getSurvivalTime()).toBe(0);
            expect(classicGame.getFormattedSurvivalTime()).toBe('00:00.00');
            expect(classicGame.isTimeTrialMode()).toBe(false);
        });
    });
});