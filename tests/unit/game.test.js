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

const { Game } = require('@/core/game.js');
const { ScoreManager } = require('@/systems/scoreManager.js');
const { ScorePersistence } = require('@/systems/scorePersistence.js');

describe('Game', () => {
    let game;

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();

        // Spy on ScorePersistence methods to ensure consistent test behavior
        // using spyOn ensures we catch calls even if the module was required via different paths
        jest.spyOn(ScorePersistence, 'loadHighScore').mockReturnValue(0);
        jest.spyOn(ScorePersistence, 'saveHighScore').mockReturnValue(true);

        game = new Game();
    });

    function advanceFrames(frameCount) {
        for (let i = 0; i < frameCount && !game.gameOver; i++) {
            game.update();
        }
    }

    describe('Initialization', () => {
        it('should initialize with default values', () => {
            expect(game.gameOver).toBe(false);
            expect(game.frameCount).toBe(0);
            expect(game.player).toEqual({ x: 0, y: 0, z: 0 });
            expect(game.bounds).toBe(30);
            expect(game.gameSpeed).toBe(0.1);
            expect(game.playerDirection).toEqual({ x: 1, y: 0, z: 0 });
            expect(game.playerTrail).toEqual([]);

            // Test multi-AI structure
            expect(game.aiOpponents).toHaveLength(1);
            expect(game.aiOpponents[0]).toMatchObject({
                x: 0,
                y: 0,
                z: -10,
                alive: true,
                personality: 'aggressive',
                color: 'red',
            });

            // Test backward compatibility properties
            expect(game.ai).toMatchObject({ x: 0, y: 0, z: -10 });
            expect(game.aiDirection).toEqual({ x: 1, y: 0, z: 0 });
            expect(game.aiTrail).toEqual([]);
        });

        it('should initialize with scoreManager', () => {
            expect(game.scoreManager).toBeInstanceOf(ScoreManager);
            expect(game.scoreManager.getScoreState()).toEqual({
                playerScore: 0,
                aiScore: 0,
                highScore: 0,
                isNewHighScore: false,
                roundsPlayed: 0,
            });
        });

        it('should initialize with custom bounds', () => {
            const customGame = new Game();
            customGame.bounds = 50;
            expect(customGame.bounds).toBe(50);
        });
    });

    describe('Player Movement', () => {
        it('should update player position', () => {
            game.update();
            expect(game.player.x).toBeCloseTo(0.1);
            expect(game.player.z).toBeCloseTo(0);
        });

        it('should create player trail', () => {
            game.update();
            expect(game.playerTrail).toHaveLength(1);
            expect(game.playerTrail[0]).toEqual({ x: 0.1, y: 0, z: 0 });
        });

        it('should accumulate player trail over multiple frames', () => {
            advanceFrames(5);
            expect(game.playerTrail).toHaveLength(5);
            expect(game.player.x).toBeCloseTo(0.5);
        });
    });

    describe('AI Movement', () => {
        it('should update AI position', () => {
            game.update();
            expect(game.ai.x).toBeCloseTo(0.1);
            expect(game.ai.z).toBeCloseTo(-10);
        });

        it('should create AI trail', () => {
            game.update();
            expect(game.aiTrail).toHaveLength(1);
            expect(game.aiTrail[0].x).toBeCloseTo(0.1);
            expect(game.aiTrail[0].z).toBeCloseTo(-10);
        });
    });

    describe('Player Direction Changes', () => {
        it('should change player direction to up', () => {
            game.changePlayerDirection('ArrowUp');
            expect(game.playerDirection).toEqual({ x: 0, y: 0, z: -1 });
        });

        it('should change player direction to down', () => {
            game.changePlayerDirection('ArrowDown');
            expect(game.playerDirection).toEqual({ x: 0, y: 0, z: 1 });
        });

        it('should change player direction to left', () => {
            game.playerDirection = { x: 0, y: 0, z: 1 };
            game.changePlayerDirection('ArrowLeft');
            expect(game.playerDirection).toEqual({ x: -1, y: 0, z: 0 });
        });

        it('should change player direction to right', () => {
            game.playerDirection = { x: 0, y: 0, z: 1 };
            game.changePlayerDirection('ArrowRight');
            expect(game.playerDirection).toEqual({ x: 1, y: 0, z: 0 });
        });

        it('should not allow reverse direction changes', () => {
            game.playerDirection = { x: 1, y: 0, z: 0 };
            game.changePlayerDirection('ArrowLeft'); // Should not change
            expect(game.playerDirection).toEqual({ x: 1, y: 0, z: 0 });
        });

        it('should not allow reverse direction changes for vertical movement', () => {
            game.playerDirection = { x: 0, y: 0, z: 1 };
            game.changePlayerDirection('ArrowUp'); // Should not change
            expect(game.playerDirection).toEqual({ x: 0, y: 0, z: 1 });
        });

        it('should handle invalid key inputs gracefully', () => {
            const originalDirection = { ...game.playerDirection };
            game.changePlayerDirection('InvalidKey');
            expect(game.playerDirection).toEqual(originalDirection);
        });

        it('should handle undefined key inputs gracefully', () => {
            const originalDirection = { ...game.playerDirection };
            game.changePlayerDirection(undefined);
            expect(game.playerDirection).toEqual(originalDirection);
        });
    });

    describe('Game State Management', () => {
        it('should restart the game', () => {
            game.gameOver = true;
            game.frameCount = 100;
            game.player.x = 10;
            game.playerTrail = [{ x: 1, y: 0, z: 1 }];
            game.restart();
            expect(game.gameOver).toBe(false);
            expect(game.frameCount).toBe(0);
            expect(game.player).toEqual({ x: 0, y: 0, z: 0 });
            expect(game.playerTrail).toEqual([]);
        });

        it('should reset current scores on restart while preserving high score', () => {
            // Set up some scores
            game.scoreManager.incrementPlayerScore();
            game.scoreManager.incrementPlayerScore();
            game.scoreManager.incrementAIScore();
            const highScore = game.scoreManager.highScore;

            game.restart();

            const scoreState = game.scoreManager.getScoreState();
            expect(scoreState.playerScore).toBe(0);
            expect(scoreState.aiScore).toBe(0);
            expect(scoreState.highScore).toBe(highScore);
        });

        it('should not update when game is over', () => {
            game.gameOver = true;
            const initialFrameCount = game.frameCount;
            const initialPlayerPos = { ...game.player };
            game.update();
            expect(game.frameCount).toBe(initialFrameCount);
            expect(game.player).toEqual(initialPlayerPos);
        });

        it('should increment frame count on update', () => {
            expect(game.frameCount).toBe(0);
            game.update();
            expect(game.frameCount).toBe(1);
            game.update();
            expect(game.frameCount).toBe(2);
        });
    });

    describe('Pause Functionality', () => {
        it('should initialize with isPaused as false', () => {
            expect(game.isPaused).toBe(false);
        });

        it('should include pause state in getGameState', () => {
            const gameState = game.getGameState();
            expect(gameState.isPaused).toBe(false);

            game.pause();
            const pausedState = game.getGameState();
            expect(pausedState.isPaused).toBe(true);
        });

        it('should include gameSpeed in getGameState', () => {
            const gameState = game.getGameState();
            expect(gameState.gameSpeed).toBe(0.1);

            game.setGameSpeed(0.15);
            const updatedState = game.getGameState();
            expect(updatedState.gameSpeed).toBe(0.15);
        });

        it('should include score information in getGameState', () => {
            const gameState = game.getGameState();
            expect(gameState.playerScore).toBe(0);
            expect(gameState.aiScore).toBe(0);
            expect(gameState.highScore).toBe(0);
            expect(gameState.isNewHighScore).toBe(false);
            expect(gameState.roundsPlayed).toBe(0);
            expect(gameState.frameCount).toBe(0);
        });

        it('should include updated score information in getGameState after score changes', () => {
            game.scoreManager.incrementPlayerScore();
            game.scoreManager.incrementAIScore();

            const gameState = game.getGameState();
            expect(gameState.playerScore).toBe(1);
            expect(gameState.aiScore).toBe(1);
            expect(gameState.highScore).toBe(1);
            expect(gameState.roundsPlayed).toBe(2);
        });

        it('should pause the game', () => {
            game.pause();
            expect(game.isPaused).toBe(true);
        });

        it('should resume the game', () => {
            game.pause();
            game.resume();
            expect(game.isPaused).toBe(false);
        });

        it('should toggle pause state', () => {
            expect(game.isPaused).toBe(false);
            game.togglePause();
            expect(game.isPaused).toBe(true);
            game.togglePause();
            expect(game.isPaused).toBe(false);
        });

        it('should skip updates when paused', () => {
            const initialPlayer = { ...game.player };
            const initialAI = { ...game.ai };
            const initialFrameCount = game.frameCount;

            game.pause();
            game.update();

            expect(game.player).toEqual(initialPlayer);
            expect(game.ai).toEqual(initialAI);
            expect(game.frameCount).toBe(initialFrameCount);
            expect(game.playerTrail).toHaveLength(0);
            expect(game.aiTrail).toHaveLength(0);
        });

        it('should resume updates after unpausing', () => {
            game.pause();
            game.update(); // Should not update

            game.resume();
            game.update(); // Should update

            expect(game.player.x).toBeCloseTo(0.1);
            expect(game.frameCount).toBe(1);
            expect(game.playerTrail).toHaveLength(1);
        });

        it('should preserve game state during pause/resume cycles', () => {
            // Advance game to create some state
            advanceFrames(5);
            const stateBeforePause = {
                player: { ...game.player },
                ai: { ...game.ai },
                frameCount: game.frameCount,
                playerTrailLength: game.playerTrail.length,
                aiTrailLength: game.aiTrail.length,
            };

            // Pause and try to update
            game.pause();
            game.update();
            game.update();

            // State should be preserved
            expect(game.player).toEqual(stateBeforePause.player);
            expect(game.ai).toEqual(stateBeforePause.ai);
            expect(game.frameCount).toBe(stateBeforePause.frameCount);
            expect(game.playerTrail).toHaveLength(stateBeforePause.playerTrailLength);
            expect(game.aiTrail).toHaveLength(stateBeforePause.aiTrailLength);

            // Resume and verify updates continue
            game.resume();
            game.update();
            expect(game.frameCount).toBe(stateBeforePause.frameCount + 1);
        });

        it('should handle multiple pause/resume cycles', () => {
            for (let i = 0; i < 3; i++) {
                game.pause();
                expect(game.isPaused).toBe(true);
                game.update(); // Should not update

                game.resume();
                expect(game.isPaused).toBe(false);
                game.update(); // Should update
                expect(game.frameCount).toBe(i + 1);
            }
        });

        it('should maintain pause state after restart', () => {
            game.pause();
            game.restart();
            expect(game.isPaused).toBe(false); // Restart should reset pause state
        });

        it('should not update when both paused and game over', () => {
            game.pause();
            game.gameOver = true;
            const initialFrameCount = game.frameCount;

            game.update();
            expect(game.frameCount).toBe(initialFrameCount);
        });
    });

    describe('Pause Error Handling and Edge Cases', () => {
        it('should handle multiple pause attempts gracefully', () => {
            // First pause should succeed
            const result1 = game.pause();
            expect(result1).toBe(true);
            expect(game.isPaused).toBe(true);

            // Second pause should return true but not change state
            const result2 = game.pause();
            expect(result2).toBe(true);
            expect(game.isPaused).toBe(true);

            // Multiple pause attempts should all succeed
            for (let i = 0; i < 5; i++) {
                const result = game.pause();
                expect(result).toBe(true);
                expect(game.isPaused).toBe(true);
            }
        });

        it('should prevent pause during game over conditions', () => {
            game.gameOver = true;

            const result = game.pause();
            expect(result).toBe(false);
            expect(game.isPaused).toBe(false);
        });

        it('should prevent resume during game over conditions', () => {
            // First pause the game
            game.pause();
            expect(game.isPaused).toBe(true);

            // Then set game over
            game.gameOver = true;

            const result = game.resume();
            expect(result).toBe(false);
            expect(game.isPaused).toBe(true); // Should remain paused
        });

        it('should prevent toggle during game over conditions', () => {
            game.gameOver = true;

            const result = game.togglePause();
            expect(result).toBe(false);
            expect(game.isPaused).toBe(false);
        });

        it('should validate resume operations', () => {
            // Try to resume when not paused
            const result1 = game.resume();
            expect(result1).toBe(false);
            expect(game.isPaused).toBe(false);

            // Pause first, then resume should work
            game.pause();
            const result2 = game.resume();
            expect(result2).toBe(true);
            expect(game.isPaused).toBe(false);
        });

        it('should ensure pause state consistency across game restarts', () => {
            // Pause the game
            game.pause();
            expect(game.isPaused).toBe(true);

            // Restart should reset pause state
            game.restart();
            expect(game.isPaused).toBe(false);

            // Test multiple restart cycles with different pause states
            for (let i = 0; i < 3; i++) {
                game.pause();
                expect(game.isPaused).toBe(true);

                game.restart();
                expect(game.isPaused).toBe(false);
                expect(game.gameOver).toBe(false);
                expect(game.frameCount).toBe(0);
            }
        });

        it('should handle rapid pause/resume cycles', () => {
            for (let i = 0; i < 10; i++) {
                const pauseResult = game.pause();
                expect(pauseResult).toBe(true);
                expect(game.isPaused).toBe(true);

                const resumeResult = game.resume();
                expect(resumeResult).toBe(true);
                expect(game.isPaused).toBe(false);
            }
        });

        it('should handle toggle operations correctly', () => {
            // Start unpaused
            expect(game.isPaused).toBe(false);

            // Toggle to pause
            let result = game.togglePause();
            expect(result).toBe(true);
            expect(game.isPaused).toBe(true);

            // Toggle to resume
            result = game.togglePause();
            expect(result).toBe(true);
            expect(game.isPaused).toBe(false);

            // Multiple toggles
            for (let i = 0; i < 5; i++) {
                result = game.togglePause();
                expect(result).toBe(true);
                expect(game.isPaused).toBe(i % 2 === 0); // Alternates true/false
            }
        });

        it('should maintain game state integrity during error conditions', () => {
            // Set up some game state
            advanceFrames(5);
            const stateBeforeError = {
                player: { ...game.player },
                ai: { ...game.ai },
                frameCount: game.frameCount,
                playerTrailLength: game.playerTrail.length,
            };

            // Pause the game
            game.pause();

            // Set game over and try operations
            game.gameOver = true;

            // Failed operations should not corrupt state
            game.pause();
            game.resume();
            game.togglePause();

            // Game state should be preserved
            expect(game.player).toEqual(stateBeforeError.player);
            expect(game.ai).toEqual(stateBeforeError.ai);
            expect(game.frameCount).toBe(stateBeforeError.frameCount);
            expect(game.playerTrail).toHaveLength(stateBeforeError.playerTrailLength);
        });
    });

    describe('Score Integration', () => {
        describe('handleRoundEnd', () => {
            it('should increment AI score when player crashes', () => {
                const collisionResult = { playerCollided: true, aiCollided: false };
                game.handleRoundEnd(collisionResult);

                const scoreState = game.scoreManager.getScoreState();
                expect(scoreState.playerScore).toBe(0);
                expect(scoreState.aiScore).toBe(1);
            });

            it('should increment player score when AI crashes', () => {
                const collisionResult = { playerCollided: false, aiCollided: true };
                game.handleRoundEnd(collisionResult);

                const scoreState = game.scoreManager.getScoreState();
                expect(scoreState.playerScore).toBe(1);
                expect(scoreState.aiScore).toBe(0);
                expect(scoreState.highScore).toBe(1);
            });

            it('should not increment any score when both crash', () => {
                const collisionResult = { playerCollided: true, aiCollided: true };
                game.handleRoundEnd(collisionResult);

                const scoreState = game.scoreManager.getScoreState();
                expect(scoreState.playerScore).toBe(0);
                expect(scoreState.aiScore).toBe(0);
            });

            it('should not increment any score when neither crashes', () => {
                const collisionResult = { playerCollided: false, aiCollided: false };
                game.handleRoundEnd(collisionResult);

                const scoreState = game.scoreManager.getScoreState();
                expect(scoreState.playerScore).toBe(0);
                expect(scoreState.aiScore).toBe(0);
            });

            it('should handle null collision result gracefully', () => {
                game.handleRoundEnd(null);

                const scoreState = game.scoreManager.getScoreState();
                expect(scoreState.playerScore).toBe(0);
                expect(scoreState.aiScore).toBe(0);
            });

            it('should handle undefined collision result gracefully', () => {
                game.handleRoundEnd(undefined);

                const scoreState = game.scoreManager.getScoreState();
                expect(scoreState.playerScore).toBe(0);
                expect(scoreState.aiScore).toBe(0);
            });

            it('should handle multiple round ends correctly', () => {
                // Player wins first round
                game.handleRoundEnd({ playerCollided: false, aiCollided: true });
                // AI wins second round
                game.handleRoundEnd({ playerCollided: true, aiCollided: false });
                // Tie in third round
                game.handleRoundEnd({ playerCollided: true, aiCollided: true });

                const scoreState = game.scoreManager.getScoreState();
                expect(scoreState.playerScore).toBe(1);
                expect(scoreState.aiScore).toBe(1);
                expect(scoreState.roundsPlayed).toBe(2);
            });
        });
    });

    describe('Game Speed Management', () => {
        it('should initialize with default game speed of 0.1', () => {
            expect(game.gameSpeed).toBe(0.1);
        });

        it('should update game speed with setGameSpeed method', () => {
            game.setGameSpeed(0.15);
            expect(game.gameSpeed).toBe(0.15);
        });

        it('should validate positive speed values', () => {
            game.setGameSpeed(-0.1);
            expect(game.gameSpeed).toBe(0.1); // Should remain unchanged

            game.setGameSpeed(0);
            expect(game.gameSpeed).toBe(0.1); // Should remain unchanged
        });

        it('should validate numeric speed values', () => {
            game.setGameSpeed('invalid');
            expect(game.gameSpeed).toBe(0.1); // Should remain unchanged

            game.setGameSpeed(null);
            expect(game.gameSpeed).toBe(0.1); // Should remain unchanged
        });

        it('should use gameSpeed for player movement', () => {
            game.setGameSpeed(0.2);
            game.update();
            expect(game.player.x).toBeCloseTo(0.2);
            expect(game.player.z).toBeCloseTo(0);
        });

        it('should use gameSpeed for AI movement', () => {
            game.setGameSpeed(0.2);
            game.update();
            expect(game.ai.x).toBeCloseTo(0.2);
            expect(game.ai.z).toBeCloseTo(-10);
        });

        it('should apply speed changes immediately to both entities', () => {
            // Move with default speed
            game.update();
            expect(game.player.x).toBeCloseTo(0.1);
            expect(game.ai.x).toBeCloseTo(0.1);

            // Change speed and move again
            game.setGameSpeed(0.05);
            game.update();
            expect(game.player.x).toBeCloseTo(0.15); // 0.1 + 0.05
            expect(game.ai.x).toBeCloseTo(0.15); // 0.1 + 0.05
        });

        it('should maintain speed setting across multiple updates', () => {
            game.setGameSpeed(0.08);

            for (let i = 1; i <= 3; i++) {
                game.update();
                expect(game.player.x).toBeCloseTo(0.08 * i);
                expect(game.ai.x).toBeCloseTo(0.08 * i);
            }
        });

        it('should preserve speed setting after direction changes', () => {
            game.setGameSpeed(0.12);
            game.changePlayerDirection('ArrowUp');
            game.update();

            expect(game.player.x).toBeCloseTo(0);
            expect(game.player.z).toBeCloseTo(-0.12);
        });
    });

    describe('Arena Shrink Mode Integration', () => {
        let arenaShrinkGame;

        beforeEach(() => {
            const { GameModes } = require('@/systems/GameModes.js');
            arenaShrinkGame = new Game(GameModes.ARENA_SHRINK);
        });

        it('should initialize with arena shrinker in Arena Shrink mode', () => {
            expect(arenaShrinkGame.isArenaShrinkMode()).toBe(true);
            expect(arenaShrinkGame.getArenaShrinker()).not.toBeNull();
        });

        it('should provide survival statistics in Arena Shrink mode', () => {
            const stats = arenaShrinkGame.getArenaShrinkSurvivalStats();
            expect(stats).not.toBeNull();
            expect(stats).toHaveProperty('survivalTime');
            expect(stats).toHaveProperty('formattedSurvivalTime');
            expect(stats).toHaveProperty('shrinksSurvived');
            expect(stats).toHaveProperty('finalArenaSize');
        });

        it('should provide arena size history in Arena Shrink mode', () => {
            const history = arenaShrinkGame.getArenaSizeHistory();
            expect(history).not.toBeNull();
            expect(Array.isArray(history)).toBe(true);
        });

        it('should track shrinks survived in Arena Shrink mode', () => {
            expect(arenaShrinkGame.getShrinksSurvived()).toBe(0);
        });

        it('should return null for Arena Shrink methods in Classic mode', () => {
            const classicGame = new Game();
            expect(classicGame.getArenaShrinkSurvivalStats()).toBeNull();
            expect(classicGame.getArenaSizeHistory()).toBeNull();
            expect(classicGame.getShrinksSurvived()).toBe(0);
        });

        it('should stop survival tracking when game ends', () => {
            // Start the game
            arenaShrinkGame.update();

            // Simulate game end
            const collisionResult = { playerCollided: true, aiCollided: false };
            arenaShrinkGame.handleRoundEnd(collisionResult);

            const arenaShrinker = arenaShrinkGame.getArenaShrinker();
            expect(arenaShrinker.isTrackingSurvival).toBe(false);
        });

        it('should include arena state in game state for Arena Shrink mode', () => {
            const gameState = arenaShrinkGame.getGameState();
            expect(gameState).toHaveProperty('arenaState');
            expect(gameState).toHaveProperty('dynamicBounds');
            expect(gameState.arenaState).toHaveProperty('survivalTime');
            expect(gameState.arenaState).toHaveProperty('arenaSizeHistory');
        });
    });

    describe('Multi-AI Support', () => {
        describe('Game Configuration', () => {
            it('should initialize with configurable AI count', () => {
                const multiAIGame = new Game(undefined, { aiCount: 3 });
                expect(multiAIGame.gameConfig.aiCount).toBe(3);
                expect(multiAIGame.aiOpponents).toHaveLength(3);
            });

            it('should validate AI count within acceptable range', () => {
                const invalidGame1 = new Game(undefined, { aiCount: 0 });
                expect(invalidGame1.gameConfig.aiCount).toBe(1);

                const invalidGame2 = new Game(undefined, { aiCount: 5 });
                expect(invalidGame2.gameConfig.aiCount).toBe(1);

                const validGame = new Game(undefined, { aiCount: 4 });
                expect(validGame.gameConfig.aiCount).toBe(4);
            });

            it('should include game configuration in game state', () => {
                const multiAIGame = new Game(undefined, { aiCount: 2 });
                const gameState = multiAIGame.getGameState();
                expect(gameState.gameConfig).toBeDefined();
                expect(gameState.gameConfig.aiCount).toBe(2);
                expect(gameState.gameConfig.maxEntities).toBe(5);
            });
        });

        describe('AI Opponent Initialization', () => {
            it('should create AI opponents with unique properties', () => {
                const multiAIGame = new Game(undefined, { aiCount: 3 });
                const opponents = multiAIGame.aiOpponents;

                expect(opponents).toHaveLength(3);

                // Check unique IDs
                const ids = opponents.map((ai) => ai.id);
                expect(new Set(ids).size).toBe(3);

                // Check unique colors
                const colors = opponents.map((ai) => ai.color);
                expect(colors).toEqual(['red', 'blue', 'yellow']);

                // Check personalities are assigned
                opponents.forEach((ai) => {
                    expect(['aggressive', 'defensive', 'erratic']).toContain(ai.personality);
                });
            });

            it('should assign starting positions around arena perimeter for multiple AIs', () => {
                const multiAIGame = new Game(undefined, { aiCount: 4 });
                const opponents = multiAIGame.aiOpponents;

                // All opponents should have different positions
                const positions = opponents.map((ai) => `${ai.x},${ai.z}`);
                expect(new Set(positions).size).toBe(4);

                // All should be alive initially
                opponents.forEach((ai) => {
                    expect(ai.alive).toBe(true);
                    expect(ai.trail).toEqual([]);
                });
            });

            it('should maintain backward compatibility with single AI', () => {
                const singleAIGame = new Game(undefined, { aiCount: 1 });
                expect(singleAIGame.aiOpponents).toHaveLength(1);
                expect(singleAIGame.aiOpponents[0]).toMatchObject({
                    x: 0,
                    y: 0,
                    z: -10,
                });
            });
        });

        describe('Entity Management Methods', () => {
            it('should add AI opponents dynamically', () => {
                const initialCount = game.aiOpponents.length;
                const success = game.addAI({ personality: 'defensive', color: 'blue' });

                expect(success).toBe(true);
                expect(game.aiOpponents).toHaveLength(initialCount + 1);
                expect(game.gameConfig.aiCount).toBe(initialCount + 1);

                const newAI = game.aiOpponents[game.aiOpponents.length - 1];
                expect(newAI.personality).toBe('defensive');
                expect(newAI.color).toBe('blue');
                expect(newAI.alive).toBe(true);
            });

            it('should prevent adding more than 4 AI opponents', () => {
                // Add AIs to reach maximum
                while (game.aiOpponents.length < 4) {
                    game.addAI();
                }

                const success = game.addAI();
                expect(success).toBe(false);
                expect(game.aiOpponents).toHaveLength(4);
            });

            it('should remove AI opponents by ID', () => {
                game.addAI({ id: 'test_ai' });
                const initialCount = game.aiOpponents.length;

                const success = game.removeAI('test_ai');
                expect(success).toBe(true);
                expect(game.aiOpponents).toHaveLength(initialCount - 1);
                expect(game.gameConfig.aiCount).toBe(initialCount - 1);

                // Should not find the removed AI
                const removedAI = game.aiOpponents.find((ai) => ai.id === 'test_ai');
                expect(removedAI).toBeUndefined();
            });

            it('should handle removal of non-existent AI', () => {
                const initialCount = game.aiOpponents.length;
                const success = game.removeAI('non_existent_ai');

                expect(success).toBe(false);
                expect(game.aiOpponents).toHaveLength(initialCount);
            });

            it('should get all alive entities', () => {
                const multiAIGame = new Game(undefined, { aiCount: 2 });
                const aliveEntities = multiAIGame.getAliveEntities();

                expect(aliveEntities).toHaveLength(3); // player + 2 AIs

                const player = aliveEntities.find((entity) => entity.type === 'player');
                expect(player).toBeDefined();
                expect(player.id).toBe('player');

                const aiEntities = aliveEntities.filter((entity) => entity.type === 'ai');
                expect(aiEntities).toHaveLength(2);
                aiEntities.forEach((ai) => {
                    expect(ai.alive).toBe(true);
                    expect(ai.personality).toBeDefined();
                    expect(ai.color).toBeDefined();
                });
            });

            it('should exclude dead AI opponents from alive entities', () => {
                const multiAIGame = new Game(undefined, { aiCount: 2 });

                // Mark one AI as dead
                multiAIGame.aiOpponents[0].alive = false;

                const aliveEntities = multiAIGame.getAliveEntities();
                expect(aliveEntities).toHaveLength(2); // player + 1 alive AI

                const aliveAIs = aliveEntities.filter((entity) => entity.type === 'ai');
                expect(aliveAIs).toHaveLength(1);
                expect(aliveAIs[0].id).toBe(multiAIGame.aiOpponents[1].id);
            });
        });

        describe('Multi-AI Game State', () => {
            it('should include aiOpponents array in game state', () => {
                const multiAIGame = new Game(undefined, { aiCount: 3 });
                const gameState = multiAIGame.getGameState();

                expect(gameState.aiOpponents).toBeDefined();
                expect(gameState.aiOpponents).toHaveLength(3);

                gameState.aiOpponents.forEach((ai) => {
                    expect(ai).toHaveProperty('id');
                    expect(ai).toHaveProperty('personality');
                    expect(ai).toHaveProperty('color');
                    expect(ai).toHaveProperty('alive');
                    expect(ai).toHaveProperty('trail');
                });
            });

            it('should maintain backward compatibility properties in game state', () => {
                const multiAIGame = new Game(undefined, { aiCount: 2 });
                const gameState = multiAIGame.getGameState();

                // Should still have legacy AI properties for backward compatibility
                expect(gameState.ai).toBeDefined();
                expect(gameState.aiDirection).toBeDefined();
                expect(gameState.aiTrail).toBeDefined();

                // Legacy properties should reference first AI
                expect(gameState.ai).toBe(multiAIGame.aiOpponents[0]);
                expect(gameState.aiDirection).toBe(multiAIGame.aiOpponents[0].direction);
                expect(gameState.aiTrail).toBe(multiAIGame.aiOpponents[0].trail);
            });
        });

        describe('Multi-AI Movement Updates', () => {
            it('should update all alive AI opponents during game update', () => {
                const multiAIGame = new Game(undefined, { aiCount: 3 });
                const initialPositions = multiAIGame.aiOpponents.map((ai) => ({
                    x: ai.x,
                    z: ai.z,
                }));

                multiAIGame.update();

                multiAIGame.aiOpponents.forEach((ai, index) => {
                    if (ai.alive) {
                        // Position should have changed based on direction and speed
                        const expectedX =
                            initialPositions[index].x + ai.direction.x * multiAIGame.gameSpeed;
                        const expectedZ =
                            initialPositions[index].z + ai.direction.z * multiAIGame.gameSpeed;

                        expect(ai.x).toBeCloseTo(expectedX);
                        expect(ai.z).toBeCloseTo(expectedZ);
                        expect(ai.trail).toHaveLength(1);
                    }
                });
            });

            it('should not update dead AI opponents', () => {
                const multiAIGame = new Game(undefined, { aiCount: 2 });

                // Mark one AI as dead
                multiAIGame.aiOpponents[1].alive = false;
                const deadAIInitialPos = {
                    x: multiAIGame.aiOpponents[1].x,
                    z: multiAIGame.aiOpponents[1].z,
                };

                multiAIGame.update();

                // Dead AI should not move
                expect(multiAIGame.aiOpponents[1].x).toBe(deadAIInitialPos.x);
                expect(multiAIGame.aiOpponents[1].z).toBe(deadAIInitialPos.z);
                expect(multiAIGame.aiOpponents[1].trail).toHaveLength(0);

                // Alive AI should move
                expect(multiAIGame.aiOpponents[0].trail).toHaveLength(1);
            });

            it('should update backward compatibility properties during multi-AI updates', () => {
                const multiAIGame = new Game(undefined, { aiCount: 2 });

                multiAIGame.update();

                // Legacy properties should be updated to match first AI
                expect(multiAIGame.ai).toBe(multiAIGame.aiOpponents[0]);
                expect(multiAIGame.aiDirection).toBe(multiAIGame.aiOpponents[0].direction);
                expect(multiAIGame.aiTrail).toBe(multiAIGame.aiOpponents[0].trail);
            });
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle very small movements', () => {
            const originalSpeed = 0.1;
            // Simulate very small movement
            game.playerDirection = { x: 0.001, z: 0 };
            game.update();
            expect(game.player.x).toBeCloseTo(0.0001);
        });

        it('should handle zero movement', () => {
            game.playerDirection = { x: 0, z: 0 };
            const initialPos = { ...game.player };
            game.update();
            expect(game.player.x).toBe(initialPos.x);
            expect(game.player.z).toBe(initialPos.z);
        });

        it('should maintain game state consistency after multiple restarts', () => {
            for (let i = 0; i < 5; i++) {
                advanceFrames(10);
                game.restart();
                expect(game.gameOver).toBe(false);
                expect(game.frameCount).toBe(0);
                expect(game.playerTrail).toEqual([]);
                expect(game.aiTrail).toEqual([]);
            }
        });

        it('should handle multi-AI game restarts correctly', () => {
            const multiAIGame = new Game(undefined, { aiCount: 3 });

            // Advance game and modify AI states
            multiAIGame.update();
            multiAIGame.aiOpponents[1].alive = false;

            multiAIGame.restart();

            // All AIs should be reset and alive
            expect(multiAIGame.aiOpponents).toHaveLength(3);
            multiAIGame.aiOpponents.forEach((ai) => {
                expect(ai.alive).toBe(true);
                expect(ai.trail).toEqual([]);
            });
        });
    });
});
