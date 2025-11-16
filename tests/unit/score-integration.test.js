/**
 * Integration tests for the complete score tracking system
 * Tests end-to-end workflows combining ScoreManager, ScorePersistence, ScoreDisplay, and Game integration
 */

const { Game } = require('./game.js');
const { ScoreManager } = require('./scoreManager.js');
const { ScorePersistence } = require('./scorePersistence.js');
const { ScoreDisplay } = require('./scoreDisplay.js');
const { CollisionDetectionEngine } = require('./collision.js');

// Mock localStorage for consistent testing
const mockLocalStorage = {
    store: {},
    getItem: function(key) {
        return this.store[key] || null;
    },
    setItem: function(key, value) {
        this.store[key] = value;
    },
    removeItem: function(key) {
        delete this.store[key];
    },
    clear: function() {
        this.store = {};
    }
};

// Mock DOM environment for ScoreDisplay
const mockElement = {
    style: {},
    textContent: '',
    id: '',
    className: '',
    appendChild: jest.fn(),
    parentNode: {
        removeChild: jest.fn()
    }
};

const mockDocument = {
    createElement: jest.fn(() => ({ ...mockElement })),
    body: { appendChild: jest.fn() },
    head: { appendChild: jest.fn() },
    getElementById: jest.fn(() => null)
};

const mockWindow = {
    innerWidth: 1024,
    addEventListener: jest.fn()
};

// Setup global mocks
global.localStorage = mockLocalStorage;
global.document = mockDocument;
global.window = mockWindow;

describe('Score Tracking Integration', () => {
    let game;
    let scoreDisplay;
    let collisionEngine;
    let mockRenderer;

    beforeEach(() => {
        // Clear localStorage completely
        mockLocalStorage.clear();
        
        // Reset mocks
        jest.clearAllMocks();
        mockDocument.createElement.mockReturnValue({ ...mockElement });
        
        // Clear any cached high scores by clearing the store completely
        mockLocalStorage.store = {};
        
        // Initialize components
        game = new Game();
        collisionEngine = new CollisionDetectionEngine();
        mockRenderer = {
            renderer: { domElement: mockElement }
        };
        scoreDisplay = new ScoreDisplay(mockRenderer);
    });

    afterEach(() => {
        if (scoreDisplay) {
            scoreDisplay.destroy();
        }
    });

    describe('Complete Game Session Workflow', () => {
        it('should handle a complete game session with score persistence', () => {
            // Initial state - no high score stored
            expect(ScorePersistence.loadHighScore()).toBe(0);
            expect(game.scoreManager.getScoreState()).toEqual({
                playerScore: 0,
                aiScore: 0,
                highScore: 0,
                isNewHighScore: false,
                roundsPlayed: 0
            });

            // Simulate player winning first round
            let collisionResult = { playerCollided: false, aiCollided: true };
            game.handleRoundEnd(collisionResult);
            
            let scoreState = game.scoreManager.getScoreState();
            expect(scoreState.playerScore).toBe(1);
            expect(scoreState.aiScore).toBe(0);
            expect(scoreState.highScore).toBe(1);
            expect(scoreState.isNewHighScore).toBe(true);
            
            // Verify persistence
            expect(ScorePersistence.loadHighScore()).toBe(1);

            // Update display and verify
            scoreDisplay.updateGameplayScores(scoreState.playerScore, scoreState.aiScore);
            expect(scoreDisplay.scoreElements.playerScore.textContent).toBe('Player: 1');
            expect(scoreDisplay.scoreElements.aiScore.textContent).toBe('AI: 0');

            // Simulate AI winning next round
            collisionResult = { playerCollided: true, aiCollided: false };
            game.handleRoundEnd(collisionResult);
            
            scoreState = game.scoreManager.getScoreState();
            expect(scoreState.playerScore).toBe(1);
            expect(scoreState.aiScore).toBe(1);
            expect(scoreState.highScore).toBe(1); // High score unchanged
            expect(scoreState.isNewHighScore).toBe(true); // Still tied with high score

            // Player wins several more rounds to set new high score
            for (let i = 0; i < 3; i++) {
                collisionResult = { playerCollided: false, aiCollided: true };
                game.handleRoundEnd(collisionResult);
            }

            scoreState = game.scoreManager.getScoreState();
            expect(scoreState.playerScore).toBe(4);
            expect(scoreState.aiScore).toBe(1);
            expect(scoreState.highScore).toBe(4);
            expect(scoreState.isNewHighScore).toBe(true);
            expect(scoreState.roundsPlayed).toBe(5);

            // Verify high score persistence
            expect(ScorePersistence.loadHighScore()).toBe(4);

            // Show game over screen
            scoreDisplay.showGameOverScores(
                scoreState.playerScore,
                scoreState.aiScore,
                scoreState.highScore,
                scoreState.isNewHighScore
            );
            
            expect(scoreDisplay.scoreElements.playerScore.textContent).toBe('Player: 4');
            expect(scoreDisplay.scoreElements.aiScore.textContent).toBe('AI: 1');
            expect(scoreDisplay.scoreElements.highScore.textContent).toBe('High Score: 4');
            expect(scoreDisplay.scoreElements.newHighScore.textContent).toBe('New High Score!');
            expect(scoreDisplay.scoreElements.newHighScore.style.display).toBe('block');
        });

        it('should handle game restart preserving high score', () => {
            // Clear any existing high score and create fresh game
            ScorePersistence.clearHighScore();
            game = new Game();
            
            // Set up initial scores
            game.scoreManager.incrementPlayerScore();
            game.scoreManager.incrementPlayerScore();
            game.scoreManager.incrementAIScore();
            
            const initialHighScore = game.scoreManager.highScore;
            expect(initialHighScore).toBe(2);

            // Restart game
            game.restart();

            // Verify current scores reset but high score preserved
            const scoreState = game.scoreManager.getScoreState();
            expect(scoreState.playerScore).toBe(0);
            expect(scoreState.aiScore).toBe(0);
            expect(scoreState.highScore).toBe(initialHighScore);
            expect(scoreState.isNewHighScore).toBe(false);
            expect(scoreState.roundsPlayed).toBe(0);

            // Verify persistence maintained
            expect(ScorePersistence.loadHighScore()).toBe(initialHighScore);

            // Update display after restart
            scoreDisplay.updateGameplayScores(0, 0);
            expect(scoreDisplay.scoreElements.playerScore.textContent).toBe('Player: 0');
            expect(scoreDisplay.scoreElements.aiScore.textContent).toBe('AI: 0');
        });

        it('should handle multiple game sessions with persistent high score', () => {
            // Clear any existing high score and create fresh game
            ScorePersistence.clearHighScore();
            game = new Game();
            
            // First session - player achieves score of 3
            for (let i = 0; i < 3; i++) {
                game.handleRoundEnd({ playerCollided: false, aiCollided: true });
            }
            expect(game.scoreManager.highScore).toBe(3);
            expect(ScorePersistence.loadHighScore()).toBe(3);

            // Simulate new game session (new Game instance)
            const newGame = new Game();
            expect(newGame.scoreManager.highScore).toBe(3); // Should load from storage

            // Second session - player achieves lower score
            newGame.handleRoundEnd({ playerCollided: false, aiCollided: true });
            newGame.handleRoundEnd({ playerCollided: false, aiCollided: true });
            
            let scoreState = newGame.scoreManager.getScoreState();
            expect(scoreState.playerScore).toBe(2);
            expect(scoreState.highScore).toBe(3); // High score unchanged
            expect(scoreState.isNewHighScore).toBe(false);

            // Third session - player achieves new high score
            const thirdGame = new Game();
            for (let i = 0; i < 5; i++) {
                thirdGame.handleRoundEnd({ playerCollided: false, aiCollided: true });
            }

            scoreState = thirdGame.scoreManager.getScoreState();
            expect(scoreState.playerScore).toBe(5);
            expect(scoreState.highScore).toBe(5);
            expect(scoreState.isNewHighScore).toBe(true);
            expect(ScorePersistence.loadHighScore()).toBe(5);
        });
    });

    describe('Collision Integration with Score Updates', () => {
        it('should integrate collision detection with score updates correctly', () => {
            // Clear any existing high score and create fresh game
            ScorePersistence.clearHighScore();
            game = new Game();
            
            const gameState = {
                bounds: 30,
                player: { x: 0, y: 0, z: 0 },
                playerTrail: [],
                ai: { x: 0, y: 0, z: -10 },
                aiTrail: [],
                frameCount: 15,
                isPaused: false
            };

            // Test player boundary collision -> AI wins
            gameState.player.x = 31; // Beyond boundary
            let collisionResult = collisionEngine.checkCollisions(gameState);
            expect(collisionResult.winner).toBe('ai');
            
            game.handleRoundEnd(collisionResult);
            let scoreState = game.scoreManager.getScoreState();
            expect(scoreState.playerScore).toBe(0);
            expect(scoreState.aiScore).toBe(1);

            // Reset positions
            gameState.player.x = 0;
            gameState.ai.x = 31; // AI beyond boundary
            
            collisionResult = collisionEngine.checkCollisions(gameState);
            expect(collisionResult.winner).toBe('player');
            
            game.handleRoundEnd(collisionResult);
            scoreState = game.scoreManager.getScoreState();
            expect(scoreState.playerScore).toBe(1);
            expect(scoreState.aiScore).toBe(1);
            expect(scoreState.highScore).toBe(1);

            // Test simultaneous collision -> tie (no score change)
            gameState.player.x = 31;
            gameState.ai.x = 31;
            
            collisionResult = collisionEngine.checkCollisions(gameState);
            expect(collisionResult.winner).toBe('tie');
            
            game.handleRoundEnd(collisionResult);
            scoreState = game.scoreManager.getScoreState();
            expect(scoreState.playerScore).toBe(1); // No change
            expect(scoreState.aiScore).toBe(1); // No change
            expect(scoreState.roundsPlayed).toBe(2); // Tie doesn't count as round
        });

        it('should handle trail collision scenarios with score updates', () => {
            // Clear any existing high score and create fresh game
            ScorePersistence.clearHighScore();
            game = new Game();
            
            const gameState = {
                bounds: 30,
                player: { x: 0, y: 0, z: 0 },
                playerTrail: [],
                ai: { x: 0, y: 0, z: -10 },
                aiTrail: [{ x: 0, y: 0, z: 0 }], // AI trail at player position
                frameCount: 15,
                isPaused: false
            };

            // Player collides with AI trail
            let collisionResult = collisionEngine.checkCollisions(gameState);
            expect(collisionResult.playerCollided).toBe(true);
            expect(collisionResult.aiCollided).toBe(false);
            expect(collisionResult.winner).toBe('ai');

            game.handleRoundEnd(collisionResult);
            let scoreState = game.scoreManager.getScoreState();
            expect(scoreState.playerScore).toBe(0);
            expect(scoreState.aiScore).toBe(1);

            // AI collides with player trail
            gameState.aiTrail = [];
            gameState.playerTrail = [{ x: 0, y: 0, z: -10 }]; // Player trail at AI position
            
            collisionResult = collisionEngine.checkCollisions(gameState);
            expect(collisionResult.playerCollided).toBe(false);
            expect(collisionResult.aiCollided).toBe(true);
            expect(collisionResult.winner).toBe('player');

            game.handleRoundEnd(collisionResult);
            scoreState = game.scoreManager.getScoreState();
            expect(scoreState.playerScore).toBe(1);
            expect(scoreState.aiScore).toBe(1);
            expect(scoreState.highScore).toBe(1);
        });
    });

    describe('Display Integration with Score Updates', () => {
        it('should synchronize display updates with score changes', () => {
            // Clear any existing high score and create fresh game
            ScorePersistence.clearHighScore();
            game = new Game();
            
            // Initial display
            scoreDisplay.updateGameplayScores(0, 0);
            expect(scoreDisplay.scoreElements.playerScore.textContent).toBe('Player: 0');
            expect(scoreDisplay.scoreElements.aiScore.textContent).toBe('AI: 0');

            // Player scores
            game.handleRoundEnd({ playerCollided: false, aiCollided: true });
            let scoreState = game.scoreManager.getScoreState();
            
            scoreDisplay.updateGameplayScores(scoreState.playerScore, scoreState.aiScore);
            expect(scoreDisplay.scoreElements.playerScore.textContent).toBe('Player: 1');
            expect(scoreDisplay.scoreElements.aiScore.textContent).toBe('AI: 0');

            // AI scores
            game.handleRoundEnd({ playerCollided: true, aiCollided: false });
            scoreState = game.scoreManager.getScoreState();
            
            scoreDisplay.updateGameplayScores(scoreState.playerScore, scoreState.aiScore);
            expect(scoreDisplay.scoreElements.playerScore.textContent).toBe('Player: 1');
            expect(scoreDisplay.scoreElements.aiScore.textContent).toBe('AI: 1');

            // Game over display with high score
            scoreDisplay.showGameOverScores(
                scoreState.playerScore,
                scoreState.aiScore,
                scoreState.highScore,
                scoreState.isNewHighScore
            );
            
            expect(scoreDisplay.scoreElements.highScore.textContent).toBe('High Score: 1');
            expect(scoreDisplay.scoreElements.newHighScore.style.display).toBe('block');
        });

        it('should handle display updates during rapid score changes', () => {
            // Rapid score updates
            for (let i = 1; i <= 5; i++) {
                game.handleRoundEnd({ playerCollided: false, aiCollided: true });
                let scoreState = game.scoreManager.getScoreState();
                
                scoreDisplay.updateGameplayScores(scoreState.playerScore, scoreState.aiScore);
                expect(scoreDisplay.scoreElements.playerScore.textContent).toBe(`Player: ${i}`);
                expect(scoreDisplay.scoreElements.aiScore.textContent).toBe('AI: 0');
            }

            // Final state verification
            const finalState = game.scoreManager.getScoreState();
            expect(finalState.playerScore).toBe(5);
            expect(finalState.highScore).toBe(5);
            expect(finalState.isNewHighScore).toBe(true);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle localStorage errors gracefully in complete workflow', () => {
            // Clear any existing high score and create fresh game
            ScorePersistence.clearHighScore();
            game = new Game();
            
            // Mock localStorage to throw errors
            const originalSetItem = mockLocalStorage.setItem;
            mockLocalStorage.setItem = jest.fn(() => {
                throw new Error('Storage quota exceeded');
            });

            // Score updates should still work even if persistence fails
            game.handleRoundEnd({ playerCollided: false, aiCollided: true });
            
            const scoreState = game.scoreManager.getScoreState();
            expect(scoreState.playerScore).toBe(1);
            expect(scoreState.highScore).toBe(1); // High score updated in memory
            
            // Display should still work
            scoreDisplay.updateGameplayScores(scoreState.playerScore, scoreState.aiScore);
            expect(scoreDisplay.scoreElements.playerScore.textContent).toBe('Player: 1');

            // Restore localStorage
            mockLocalStorage.setItem = originalSetItem;
        });

        it('should handle invalid collision results gracefully', () => {
            const initialState = game.scoreManager.getScoreState();
            
            // Test various invalid inputs
            game.handleRoundEnd(null);
            game.handleRoundEnd(undefined);
            game.handleRoundEnd({});
            game.handleRoundEnd({ invalidProperty: true });
            
            // Scores should remain unchanged
            const finalState = game.scoreManager.getScoreState();
            expect(finalState).toEqual(initialState);
        });

        it('should maintain consistency during component failures', () => {
            // Clear any existing high score and create fresh game
            ScorePersistence.clearHighScore();
            game = new Game();
            
            // Set up initial state
            game.handleRoundEnd({ playerCollided: false, aiCollided: true });
            const scoreState = game.scoreManager.getScoreState();
            
            // Simulate display failure
            scoreDisplay.destroy();
            scoreDisplay = null;
            
            // Score system should continue working
            game.handleRoundEnd({ playerCollided: false, aiCollided: true });
            const newScoreState = game.scoreManager.getScoreState();
            
            expect(newScoreState.playerScore).toBe(2);
            expect(newScoreState.highScore).toBe(2);
            expect(ScorePersistence.loadHighScore()).toBe(2);
        });
    });

    describe('Performance and Memory Management', () => {
        it('should handle multiple game sessions without memory leaks', () => {
            // Clear any existing high score
            ScorePersistence.clearHighScore();
            
            // Simulate multiple game sessions
            for (let session = 0; session < 10; session++) {
                const sessionGame = new Game();
                const sessionDisplay = new ScoreDisplay(mockRenderer);
                
                // Play some rounds
                for (let round = 0; round < 5; round++) {
                    sessionGame.handleRoundEnd({ playerCollided: false, aiCollided: true });
                    const state = sessionGame.scoreManager.getScoreState();
                    sessionDisplay.updateGameplayScores(state.playerScore, state.aiScore);
                }
                
                // Clean up
                sessionDisplay.destroy();
            }
            
            // Verify final high score is correct
            expect(ScorePersistence.loadHighScore()).toBe(5);
        });

        it('should handle rapid score updates efficiently', () => {
            const startTime = Date.now();
            
            // Perform many rapid updates
            for (let i = 0; i < 100; i++) {
                game.handleRoundEnd({ playerCollided: false, aiCollided: true });
                const state = game.scoreManager.getScoreState();
                scoreDisplay.updateGameplayScores(state.playerScore, state.aiScore);
            }
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            // Should complete quickly (less than 100ms for 100 updates)
            expect(duration).toBeLessThan(100);
            
            // Verify final state is correct
            const finalState = game.scoreManager.getScoreState();
            expect(finalState.playerScore).toBe(100);
            expect(finalState.highScore).toBe(100);
        });
    });
});