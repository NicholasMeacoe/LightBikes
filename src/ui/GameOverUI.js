/**
 * GameOverUI - Manages game over screens for all game modes
 * Handles display of game over information and mode-specific results
 */
class GameOverUI {
    constructor() {
        this.styleManager = null;
        this.multiplayerGameOverUI = null;
        this.localScoringUI = null;
    }

    /**
     * Initialize with dependencies
     * @param {Object} dependencies - Required dependencies
     */
    initialize(dependencies) {
        this.styleManager = dependencies.styleManager;
        this.multiplayerGameOverUI = dependencies.multiplayerGameOverUI;
        this.localScoringUI = dependencies.localScoringUI;
        this.scoreDisplay = dependencies.scoreDisplay;
        this.survivalTimer = dependencies.survivalTimer;
        this.leaderboardSystem = dependencies.leaderboardSystem;
        this.hideRemainingEntitiesDisplay = dependencies.hideRemainingEntitiesDisplay;
        this.showModeSelector = dependencies.showModeSelector;
        this.game = dependencies.game;
    }

    /**
     * Show game over screen based on mode
     * @param {Object} gameState - Current game state
     * @param {string} mode - Game mode
     * @param {Object} callbacks - Callbacks for game actions
     */
    show(gameState, mode, callbacks = {}) {
        switch (mode) {
            case 'TIME_TRIAL':
                this.showTimeTrialGameOver();
                break;
            case 'ARENA_SHRINK':
                this.showArenaShrinkGameOver();
                break;
            case 'LOCAL_MULTIPLAYER':
                this.showMultiplayerGameOver(callbacks);
                break;
            case 'CLASSIC':
            default:
                this.showMultiAIGameOver();
                break;
        }
    }

    /**
     * Hide all game over screens
     */
    hide() {
        const gameOverElement = document.getElementById('gameOver');
        if (gameOverElement) {
            gameOverElement.style.display = 'none';
        }
        const restartBtn = document.getElementById('restart');
        if (restartBtn) {
            restartBtn.style.display = 'none';
        }

        if (this.multiplayerGameOverUI && this.multiplayerGameOverUI.isVisible()) {
            this.multiplayerGameOverUI.hide();
        }
    }

    /**
     * Show multi-AI game over screen with enhanced information
     */
    showMultiAIGameOver() {
        const finalGameState = this.game.getGameState();
        const gameOverElement = document.getElementById('gameOver');

        // Hide remaining entities display
        if (this.hideRemainingEntitiesDisplay) {
            this.hideRemainingEntitiesDisplay();
        }

        if (gameOverElement) {
            // Determine victory message based on final scores
            const playerWon = finalGameState.playerScore > finalGameState.aiScore;
            const isNewHighScore = finalGameState.isNewHighScore;

            // Count final AI opponents
            const totalAIs = finalGameState.aiOpponents ? finalGameState.aiOpponents.length : 1;
            const aliveAIs = finalGameState.aiOpponents
                ? finalGameState.aiOpponents.filter((ai) => ai.alive).length
                : finalGameState.ai
                  ? 1
                  : 0;

            // Create victory/defeat message
            let resultMessage = '';
            if (playerWon) {
                resultMessage =
                    totalAIs > 1
                        ? `Victory! You defeated ${totalAIs} AI opponents!`
                        : 'Victory! You defeated the AI!';
            } else {
                resultMessage =
                    totalAIs > 1 ? `Defeated by ${totalAIs} AI opponents` : 'Defeated by AI';
            }

            // Build game over display
            gameOverElement.innerHTML = `
                <div class="multi-ai-game-over">
                    <h2 class="${playerWon ? 'victory' : 'defeat'}">${resultMessage}</h2>
                    <div class="score-summary">
                        <div class="score-row">
                            <span class="score-label">Your Score:</span>
                            <span class="score-value player-score">${finalGameState.playerScore}</span>
                        </div>
                        <div class="score-row">
                            <span class="score-label">AI Score:</span>
                            <span class="score-value ai-score">${finalGameState.aiScore}</span>
                        </div>
                        <div class="score-row">
                            <span class="score-label">High Score:</span>
                            <span class="score-value high-score">${finalGameState.highScore}</span>
                        </div>
                    </div>
                    ${isNewHighScore ? '<div class="new-high-score">New High Score!</div>' : ''}
                    <div class="game-stats">
                        <div class="stat-item">
                            <span class="stat-label">AI Opponents:</span>
                            <span class="stat-value">${totalAIs}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Rounds Played:</span>
                            <span class="stat-value">${finalGameState.roundsPlayed || finalGameState.playerScore + finalGameState.aiScore}</span>
                        </div>
                    </div>
                    <button id="changeModeButton" onclick="showModeSelector()" class="mode-change-btn">
                        Change Mode
                    </button>
                </div>
            `;

            // Add styles for multi-AI game over
            this.addMultiAIGameOverStyles();
        }

        // Also update the score display for consistency
        if (this.scoreDisplay) {
            this.scoreDisplay.showGameOverScores(
                finalGameState.playerScore,
                finalGameState.aiScore,
                finalGameState.highScore,
                finalGameState.isNewHighScore
            );
        }
    }

    /**
     * Add CSS styles for multi-AI game over display
     */
    addMultiAIGameOverStyles() {
        if (!this.styleManager) {
            return;
        }

        const styles = `
            .multi-ai-game-over {
                text-align: center;
                color: white;
                font-family: 'Courier New', monospace;
            }

            .multi-ai-game-over h2 {
                font-size: 2.5em;
                margin-bottom: 30px;
                text-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
            }

            .multi-ai-game-over h2.victory {
                color: #00ff00;
                text-shadow: 0 0 20px rgba(0, 255, 0, 0.8);
            }

            .multi-ai-game-over h2.defeat {
                color: #ff4444;
                text-shadow: 0 0 20px rgba(255, 68, 68, 0.8);
            }

            .score-summary {
                background: rgba(0, 0, 0, 0.7);
                border: 2px solid #ffffff;
                border-radius: 10px;
                padding: 20px;
                margin: 20px auto;
                max-width: 300px;
            }

            .score-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 10px 0;
                font-size: 1.2em;
            }

            .score-label {
                color: #cccccc;
            }

            .player-score {
                color: #00ffff;
                font-weight: bold;
            }

            .ai-score {
                color: #ff6666;
                font-weight: bold;
            }

            .high-score {
                color: #ffff00;
                font-weight: bold;
            }

            .new-high-score {
                color: #ffff00;
                font-size: 1.5em;
                font-weight: bold;
                margin: 15px 0;
                text-shadow: 0 0 15px rgba(255, 255, 0, 0.8);
                animation: highScoreGlow 1s ease-in-out infinite alternate;
            }

            .game-stats {
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid #666666;
                border-radius: 8px;
                padding: 15px;
                margin: 20px auto;
                max-width: 250px;
            }

            .stat-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 8px 0;
                font-size: 1em;
            }

            .stat-label {
                color: #aaaaaa;
            }

            .stat-value {
                color: #ffffff;
                font-weight: bold;
            }

            .mode-change-btn {
                margin-top: 20px;
                padding: 12px 24px;
                font-size: 1.2em;
                background: rgba(0, 255, 255, 0.2);
                border: 2px solid #00ffff;
                color: white;
                border-radius: 8px;
                cursor: pointer;
                font-family: 'Courier New', monospace;
                transition: all 0.3s ease;
            }

            .mode-change-btn:hover {
                background: rgba(0, 255, 255, 0.4);
                box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
            }

            @keyframes highScoreGlow {
                from {
                    text-shadow: 0 0 15px rgba(255, 255, 0, 0.8);
                }
                to {
                    text-shadow: 0 0 25px rgba(255, 255, 0, 1.0);
                }
            }

            @media (max-width: 768px) {
                .multi-ai-game-over h2 {
                    font-size: 1.8em;
                    margin-bottom: 20px;
                }
                
                .score-summary {
                    max-width: 250px;
                    padding: 15px;
                }
                
                .score-row {
                    font-size: 1em;
                    margin: 8px 0;
                }
                
                .game-stats {
                    max-width: 200px;
                    padding: 12px;
                }
                
                .mode-change-btn {
                    padding: 10px 20px;
                    font-size: 1em;
                }
            }
        `;

        this.styleManager.addStyles('multi-ai-game-over-styles', styles);
    }

    /**
     * Show Time Trial game over screen
     */
    showTimeTrialGameOver() {
        const finalTime = this.survivalTimer.getElapsedTime();
        const formattedTime = this.survivalTimer.formatTime(finalTime);

        // Update game over display for Time Trial
        const gameOverElement = document.getElementById('gameOver');
        if (gameOverElement) {
            gameOverElement.innerHTML = `
                <h2>Time Trial Complete!</h2>
                <p>Survival Time: ${formattedTime}</p>
                ${this.leaderboardSystem.isNewRecord(finalTime) ? '<p class="new-record">New Personal Best!</p>' : ''}
                <button id="changeModeButton" onclick="showModeSelector()" style="
                    margin-top: 20px;
                    padding: 10px 20px;
                    font-size: 1.2em;
                    background: rgba(0, 255, 255, 0.2);
                    border: 2px solid #00ffff;
                    color: white;
                    border-radius: 5px;
                    cursor: pointer;
                ">Change Mode</button>
            `;
        }
    }

    /**
     * Show Arena Shrink game over screen
     */
    showArenaShrinkGameOver() {
        const finalTime = this.game.getSurvivalTime();
        const formattedTime = this.game.getFormattedSurvivalTime();
        const shrinksSurvived = this.game.getShrinksSurvived();
        const finalArenaSize = this.game.getBounds().size;

        // Update game over display for Arena Shrink
        const gameOverElement = document.getElementById('gameOver');
        if (gameOverElement) {
            const gameState = this.game.getGameState();
            const winner = gameState.playerScore > gameState.aiScore ? 'You Win!' : 'AI Wins!';

            gameOverElement.innerHTML = `
                <h2>${winner}</h2>
                <p>Survival Time: ${formattedTime}</p>
                <p>Shrinks Survived: ${shrinksSurvived}</p>
                <p>Final Arena: ${finalArenaSize}x${finalArenaSize}</p>
                <button id="changeModeButton" onclick="showModeSelector()" style="
                    margin-top: 20px;
                    padding: 10px 20px;
                    font-size: 1.2em;
                    background: rgba(0, 255, 255, 0.2);
                    border: 2px solid #00ffff;
                    color: white;
                    border-radius: 5px;
                    cursor: pointer;
                ">Change Mode</button>
            `;
        }
    }

    /**
     * Show multiplayer game over screen with winner announcement
     * @param {Object} callbacks - Callbacks for multiplayer actions
     */
    showMultiplayerGameOver(callbacks = {}) {
        // Initialize multiplayer game over UI if not already created
        if (!this.multiplayerGameOverUI) {
            const { MultiplayerGameOverUI } = require('./MultiplayerGameOverUI.js');
            this.multiplayerGameOverUI = new MultiplayerGameOverUI();
        }

        // Get current game state
        const gameState = this.game.getGameState();

        // Show multiplayer game over UI with callbacks
        this.multiplayerGameOverUI.show(
            gameState,
            // Restart callback - next round
            () => {
                this.game.restart();
                this.game.gameOver = false;

                // Update local scoring UI if it exists
                if (this.localScoringUI) {
                    this.localScoringUI.updateScores();
                }

                if (callbacks.onRestart) {
                    callbacks.onRestart();
                }
            },
            // Reset scores callback
            () => {
                this.game.resetScores();
                this.game.gameOver = false;

                // Update local scoring UI if it exists
                if (this.localScoringUI) {
                    this.localScoringUI.updateScores();
                }

                if (callbacks.onResetScores) {
                    callbacks.onResetScores();
                }
            },
            // Return to single player callback
            () => {
                // Hide multiplayer UI
                if (this.localScoringUI) {
                    this.localScoringUI.hideScores();
                }

                // Show mode selector to switch back to single player
                if (this.showModeSelector) {
                    this.showModeSelector();
                }

                if (callbacks.onReturnToSinglePlayer) {
                    callbacks.onReturnToSinglePlayer();
                }
            }
        );

        // Hide standard game over elements
        const gameOverElement = document.getElementById('gameOver');
        if (gameOverElement) {
            gameOverElement.style.display = 'none';
        }
        const restartBtn = document.getElementById('restart');
        if (restartBtn) {
            restartBtn.style.display = 'none';
        }
    }
}

module.exports = { GameOverUI };
