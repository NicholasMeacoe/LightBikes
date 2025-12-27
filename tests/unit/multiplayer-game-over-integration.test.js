/**
 * Integration tests for multiplayer game over and restart functionality
 * Tests the complete flow from game end to restart
 */

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
const { MultiplayerGameOverUI } = require('@/ui/MultiplayerGameOverUI.js');
const { LocalScoringUI } = require('@/ui/LocalScoringUI.js');
const { PlayerCollisionHandler } = require('@/multiplayer/PlayerCollisionHandler.js');

describe('Multiplayer Game Over and Restart Integration', () => {
    let multiplayerGame;
    let gameOverUI;
    let scoringUI;
    let collisionHandler;

    beforeEach(() => {
        // Clear document
        document.body.innerHTML = '';

        // Remove existing styles
        ['multiplayerGameOverStyles', 'localScoringStyles'].forEach((id) => {
            const existing = document.getElementById(id);
            if (existing) existing.remove();
        });

        // Initialize components
        multiplayerGame = new MultiplayerGame();
        gameOverUI = new MultiplayerGameOverUI();
        scoringUI = new LocalScoringUI(multiplayerGame.localScoring);
        collisionHandler = new PlayerCollisionHandler();
    });

    afterEach(() => {
        if (gameOverUI) gameOverUI.destroy();
        if (scoringUI) scoringUI.destroy();
    });

    describe('Game Over Flow', () => {
        it('should display winner announcement when Player 1 wins', () => {
            // Simulate Player 2 crash
            multiplayerGame.player2.isAlive = false;

            const collisionResult = {
                player1Collided: false,
                player2Collided: true,
            };

            multiplayerGame.handleRoundEnd(collisionResult);
            multiplayerGame.gameOver = true;

            // Show game over UI
            const gameState = multiplayerGame.getGameState();
            gameOverUI.show(gameState, jest.fn(), jest.fn(), jest.fn());

            expect(gameOverUI.isVisible()).toBe(true);
            const title = document.querySelector('.multiplayer-game-over-title');
            expect(title.textContent).toContain('Player 1 Wins!');
        });

        it('should display winner announcement when Player 2 wins', () => {
            // Simulate Player 1 crash
            multiplayerGame.player1.isAlive = false;

            const collisionResult = {
                player1Collided: true,
                player2Collided: false,
            };

            multiplayerGame.handleRoundEnd(collisionResult);
            multiplayerGame.gameOver = true;

            // Show game over UI
            const gameState = multiplayerGame.getGameState();
            gameOverUI.show(gameState, jest.fn(), jest.fn(), jest.fn());

            expect(gameOverUI.isVisible()).toBe(true);
            const title = document.querySelector('.multiplayer-game-over-title');
            expect(title.textContent).toContain('Player 2 Wins!');
        });

        it('should display tie when both players crash', () => {
            // Simulate both players crash
            multiplayerGame.player1.isAlive = false;
            multiplayerGame.player2.isAlive = false;

            const collisionResult = {
                player1Collided: true,
                player2Collided: true,
            };

            multiplayerGame.handleRoundEnd(collisionResult);
            multiplayerGame.gameOver = true;

            // Show game over UI
            const gameState = multiplayerGame.getGameState();
            gameOverUI.show(gameState, jest.fn(), jest.fn(), jest.fn());

            expect(gameOverUI.isVisible()).toBe(true);
            const title = document.querySelector('.multiplayer-game-over-title');
            expect(title.textContent).toContain('Tie Game!');
        });

        it('should display correct scores after multiple rounds', () => {
            // Play multiple rounds
            for (let i = 0; i < 3; i++) {
                multiplayerGame.player2.isAlive = false;
                multiplayerGame.handleRoundEnd({
                    player1Collided: false,
                    player2Collided: true,
                });
                multiplayerGame.restart();
            }

            for (let i = 0; i < 2; i++) {
                multiplayerGame.player1.isAlive = false;
                multiplayerGame.handleRoundEnd({
                    player1Collided: true,
                    player2Collided: false,
                });
                multiplayerGame.restart();
            }

            multiplayerGame.gameOver = true;

            // Show game over UI
            const gameState = multiplayerGame.getGameState();
            gameOverUI.show(gameState, jest.fn(), jest.fn(), jest.fn());

            const scoreValues = document.querySelectorAll('.multiplayer-score-value');
            expect(scoreValues[0].textContent).toBe('3'); // Player 1
            expect(scoreValues[1].textContent).toBe('2'); // Player 2
        });
    });

    describe('Restart Functionality', () => {
        it('should restart game and maintain scores', () => {
            // Play one round
            multiplayerGame.player2.isAlive = false;
            multiplayerGame.handleRoundEnd({
                player1Collided: false,
                player2Collided: true,
            });

            const scoresBefore = multiplayerGame.localScoring.getScoreDetails();

            // Restart
            multiplayerGame.restart();

            const scoresAfter = multiplayerGame.localScoring.getScoreDetails();

            expect(scoresAfter.player1Wins).toBe(scoresBefore.player1Wins);
            expect(scoresAfter.player2Wins).toBe(scoresBefore.player2Wins);
            expect(multiplayerGame.player1.isAlive).toBe(true);
            expect(multiplayerGame.player2.isAlive).toBe(true);
        });

        it('should call restart callback when restart button is clicked', () => {
            const restartCallback = jest.fn();

            multiplayerGame.gameOver = true;
            const gameState = multiplayerGame.getGameState();

            gameOverUI.show(gameState, restartCallback, jest.fn(), jest.fn());

            const restartBtn = document.getElementById('multiplayerRestartBtn');
            restartBtn.click();

            expect(restartCallback).toHaveBeenCalled();
            expect(gameOverUI.isVisible()).toBe(false);
        });

        it('should reset scores when reset button is clicked', () => {
            // Play some rounds
            multiplayerGame.player2.isAlive = false;
            multiplayerGame.handleRoundEnd({
                player1Collided: false,
                player2Collided: true,
            });

            const resetCallback = jest.fn(() => {
                multiplayerGame.resetScores();
            });

            multiplayerGame.gameOver = true;
            const gameState = multiplayerGame.getGameState();

            gameOverUI.show(gameState, jest.fn(), resetCallback, jest.fn());

            const resetBtn = document.getElementById('multiplayerResetBtn');
            resetBtn.click();

            expect(resetCallback).toHaveBeenCalled();

            const scores = multiplayerGame.localScoring.getScoreDetails();
            expect(scores.player1Wins).toBe(0);
            expect(scores.player2Wins).toBe(0);
        });

        it('should call single player callback when single player button is clicked', () => {
            const singlePlayerCallback = jest.fn();

            multiplayerGame.gameOver = true;
            const gameState = multiplayerGame.getGameState();

            gameOverUI.show(gameState, jest.fn(), jest.fn(), singlePlayerCallback);

            const singlePlayerBtn = document.getElementById('multiplayerSinglePlayerBtn');
            singlePlayerBtn.click();

            expect(singlePlayerCallback).toHaveBeenCalled();
            expect(gameOverUI.isVisible()).toBe(false);
        });
    });

    describe('Score Display Integration', () => {
        it('should update score display during gameplay', () => {
            scoringUI.showScores();

            // Play a round
            multiplayerGame.player2.isAlive = false;
            multiplayerGame.handleRoundEnd({
                player1Collided: false,
                player2Collided: true,
            });

            scoringUI.updateScores();

            const player1Score = document.getElementById('player1Score');
            const player2Score = document.getElementById('player2Score');

            expect(player1Score.textContent).toContain('P1: 1');
            expect(player2Score.textContent).toContain('P2: 0');
        });

        it('should show round indicator', () => {
            scoringUI.showScores();

            const roundIndicator = document.getElementById('roundIndicator');
            expect(roundIndicator.textContent).toContain('Round 1');
        });

        it('should hide scores when requested', () => {
            scoringUI.showScores();
            scoringUI.hideScores();

            const player1Score = document.getElementById('player1Score');
            const player2Score = document.getElementById('player2Score');

            expect(player1Score.style.display).toBe('none');
            expect(player2Score.style.display).toBe('none');
        });
    });

    describe('Complete Game Flow', () => {
        it('should handle complete game flow from start to restart', () => {
            // Start game
            scoringUI.showScores();
            expect(multiplayerGame.gameOver).toBe(false);

            // Play round 1 - Player 1 wins
            multiplayerGame.player2.isAlive = false;
            multiplayerGame.handleRoundEnd({
                player1Collided: false,
                player2Collided: true,
            });
            multiplayerGame.gameOver = true;

            // Show game over
            let gameState = multiplayerGame.getGameState();
            expect(gameState.localScoring.player1Wins).toBe(1);
            expect(gameState.localScoring.player2Wins).toBe(0);

            // Restart for round 2
            multiplayerGame.restart();
            multiplayerGame.gameOver = false;
            scoringUI.updateScores();

            // Play round 2 - Player 2 wins
            multiplayerGame.player1.isAlive = false;
            multiplayerGame.handleRoundEnd({
                player1Collided: true,
                player2Collided: false,
            });
            multiplayerGame.gameOver = true;

            // Check final scores
            gameState = multiplayerGame.getGameState();
            expect(gameState.localScoring.player1Wins).toBe(1);
            expect(gameState.localScoring.player2Wins).toBe(1);
            expect(gameState.localScoring.totalRounds).toBe(2);
        });

        it('should maintain player customizations through restart', () => {
            // Set player colors (simulating customization)
            const player1ColorBefore = multiplayerGame.player1.color;
            const player2ColorBefore = multiplayerGame.player2.color;

            // Play and restart
            multiplayerGame.player2.isAlive = false;
            multiplayerGame.handleRoundEnd({
                player1Collided: false,
                player2Collided: true,
            });
            multiplayerGame.restart();

            // Colors should be maintained
            expect(multiplayerGame.player1.color).toBe(player1ColorBefore);
            expect(multiplayerGame.player2.color).toBe(player2ColorBefore);
        });

        it('should handle rapid restart cycles', () => {
            for (let i = 0; i < 5; i++) {
                multiplayerGame.player2.isAlive = false;
                multiplayerGame.handleRoundEnd({
                    player1Collided: false,
                    player2Collided: true,
                });
                multiplayerGame.restart();
            }

            const gameState = multiplayerGame.getGameState();
            expect(gameState.localScoring.player1Wins).toBe(5);
            expect(gameState.localScoring.totalRounds).toBe(5);
            expect(multiplayerGame.player1.isAlive).toBe(true);
            expect(multiplayerGame.player2.isAlive).toBe(true);
        });
    });

    describe('UI State Management', () => {
        it('should properly clean up UI elements on destroy', () => {
            scoringUI.showScores();
            gameOverUI.show(multiplayerGame.getGameState(), jest.fn(), jest.fn(), jest.fn());

            scoringUI.destroy();
            gameOverUI.destroy();

            expect(document.getElementById('player1Score')).toBeNull();
            expect(document.getElementById('player2Score')).toBeNull();
            expect(document.getElementById('multiplayerGameOverStyles')).toBeNull();
            expect(document.getElementById('localScoringStyles')).toBeNull();
        });

        it('should handle multiple show/hide cycles', () => {
            const gameState = multiplayerGame.getGameState();

            for (let i = 0; i < 3; i++) {
                gameOverUI.show(gameState, jest.fn(), jest.fn(), jest.fn());
                expect(gameOverUI.isVisible()).toBe(true);

                gameOverUI.hide();
                expect(gameOverUI.isVisible()).toBe(false);
            }
        });
    });
});
