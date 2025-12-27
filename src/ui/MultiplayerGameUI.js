/**
 * MultiplayerGameUI - Handles UI elements for multiplayer and multi-AI games
 * Manages remaining entities display, game over screens, and styling
 */

const { LocalScoringUI } = require('./LocalScoringUI.js');
const { MultiplayerGameOverUI } = require('./MultiplayerGameOverUI.js');

class MultiplayerGameUI {
    constructor(game, scoreDisplay) {
        this.game = game;
        this.scoreDisplay = scoreDisplay;

        // UI Components
        this.localScoringUI = null;
        this.multiplayerGameOverUI = null;
    }

    /**
     * Initialize multiplayer UI components
     * @param {Object} multiplayerGame - Multiplayer game instance
     */
    initializeMultiplayerUI(multiplayerGame) {
        // Initialize local scoring UI
        if (!this.localScoringUI) {
            this.localScoringUI = new LocalScoringUI(multiplayerGame.localScoring);
        }

        // Show scores
        this.localScoringUI.showScores();
    }

    /**
     * Clean up multiplayer UI components
     */
    cleanupMultiplayerUI() {
        if (this.localScoringUI) {
            this.localScoringUI.hideScores();
        }

        if (this.multiplayerGameOverUI && this.multiplayerGameOverUI.isVisible()) {
            this.multiplayerGameOverUI.hide();
        }
    }

    /**
     * Show multiplayer game over screen with winner announcement
     */
    showMultiplayerGameOver() {
        // Initialize multiplayer game over UI if not already created
        if (!this.multiplayerGameOverUI) {
            this.multiplayerGameOverUI = new MultiplayerGameOverUI();
        }

        // Use existing methods from main logic that would be passed or accessible
        // Implementation might need specific data passed in
    }

    /**
     * Update display showing remaining entities during gameplay
     * @param {Array} survivingEntities - List of surviving entity IDs
     */
    updateRemainingEntityDisplay(survivingEntities) {
        // Create or update remaining entities display
        let remainingDisplay = document.getElementById('remaining-entities-display');

        if (!remainingDisplay) {
            remainingDisplay = document.createElement('div');
            remainingDisplay.id = 'remaining-entities-display';
            remainingDisplay.className = 'remaining-entities-display';
            document.body.appendChild(remainingDisplay);

            // Add styles for the display
            this.addRemainingEntitiesStyles();
        }

        // Count remaining entities by type
        const playerAlive = survivingEntities.includes('player');
        const aliveAICount = survivingEntities.filter((id) => id.startsWith('ai_')).length;
        const totalRemaining = survivingEntities.length;

        // Update display content
        if (totalRemaining > 1) {
            remainingDisplay.innerHTML = `
                <div class="remaining-count">Remaining: ${totalRemaining}</div>
                <div class="remaining-breakdown">
                    ${playerAlive ? '<span class="player-status alive">You</span>' : '<span class="player-status dead">You</span>'}
                    <span class="ai-status">${aliveAICount} AI${aliveAICount !== 1 ? 's' : ''}</span>
                </div>
            `;
            remainingDisplay.style.display = 'block';
        } else {
            // Hide display when only one entity remains (game ending)
            remainingDisplay.style.display = 'none';
        }
    }

    /**
     * Add CSS styles for remaining entities display
     */
    addRemainingEntitiesStyles() {
        // Check if styles already exist
        if (document.getElementById('remaining-entities-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'remaining-entities-styles';
        style.textContent = `
            .remaining-entities-display {
                position: fixed;
                top: 100px;
                left: 20px;
                background-color: rgba(0, 0, 0, 0.8);
                border: 2px solid #ffffff;
                border-radius: 8px;
                padding: 12px 16px;
                color: white;
                font-family: 'Courier New', monospace;
                font-size: 16px;
                z-index: 100;
                min-width: 120px;
            }

            .remaining-count {
                font-weight: bold;
                font-size: 18px;
                margin-bottom: 8px;
                text-align: center;
                color: #00ffff;
            }

            .remaining-breakdown {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 12px;
            }

            .player-status {
                font-weight: bold;
            }

            .player-status.alive {
                color: #00ff00;
            }

            .player-status.dead {
                color: #ff4444;
                text-decoration: line-through;
            }

            .ai-status {
                color: #ffaa00;
            }

            @media (max-width: 768px) {
                .remaining-entities-display {
                    font-size: 14px;
                    padding: 8px 12px;
                    top: 80px;
                    left: 10px;
                }
                
                .remaining-count {
                    font-size: 16px;
                    margin-bottom: 6px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Hide remaining entities display
     */
    hideRemainingEntitiesDisplay() {
        const remainingDisplay = document.getElementById('remaining-entities-display');
        if (remainingDisplay) {
            remainingDisplay.style.display = 'none';
        }
    }

    /**
     * Show multi-AI game over screen with enhanced information
     */
    showMultiAIGameOver() {
        const finalGameState = this.game.getGameState();
        const gameOverElement = document.getElementById('gameOver');

        // Hide remaining entities display
        this.hideRemainingEntitiesDisplay();

        if (gameOverElement) {
            // Determine victory message based on final scores
            const playerWon = finalGameState.playerScore > finalGameState.aiScore;
            const isNewHighScore = finalGameState.isNewHighScore;

            // Count final AI opponents
            const totalAIs = finalGameState.aiOpponents ? finalGameState.aiOpponents.length : 1;
            // Use fallback if no aiOpponents data
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
        // Check if styles already exist
        if (document.getElementById('multi-ai-game-over-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'multi-ai-game-over-styles';
        style.textContent = `
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
        document.head.appendChild(style);
    }
}

module.exports = { MultiplayerGameUI };
