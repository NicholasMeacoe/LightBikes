/**
 * MultiplayerGameOverUI - UI component for multiplayer game over screen
 * Handles winner announcements, final scores, and restart options for local 2-player mode
 */
class MultiplayerGameOverUI {
    /**
     * Create a new MultiplayerGameOverUI instance
     */
    constructor() {
        this.gameOverElement = null;
        this.isInitialized = false;
        this.addStyles();
    }

    /**
     * Add CSS styles for multiplayer game over UI
     */
    addStyles() {
        if (document.getElementById('multiplayerGameOverStyles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'multiplayerGameOverStyles';
        style.textContent = `
            .multiplayer-game-over-container {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.95);
                border: 3px solid #ffffff;
                border-radius: 15px;
                padding: 40px;
                color: white;
                font-family: 'Courier New', monospace;
                text-align: center;
                z-index: 1000;
                min-width: 400px;
                max-width: 600px;
                box-shadow: 0 0 30px rgba(0, 0, 0, 0.8);
            }

            .multiplayer-game-over-title {
                font-size: 3em;
                font-weight: bold;
                margin-bottom: 30px;
                text-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
            }

            .multiplayer-game-over-title.player1-wins {
                color: #00ff41;
                text-shadow: 0 0 20px rgba(0, 255, 65, 0.8);
            }

            .multiplayer-game-over-title.player2-wins {
                color: #00bfff;
                text-shadow: 0 0 20px rgba(0, 191, 255, 0.8);
            }

            .multiplayer-game-over-title.tie {
                color: #ffff00;
                text-shadow: 0 0 20px rgba(255, 255, 0, 0.8);
            }

            .multiplayer-final-scores {
                background: rgba(255, 255, 255, 0.1);
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 10px;
                padding: 20px;
                margin: 20px 0;
            }

            .multiplayer-score-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 20px;
                margin: 5px 0;
                font-size: 1.5em;
            }

            .multiplayer-score-label {
                color: #cccccc;
            }

            .multiplayer-score-value {
                font-weight: bold;
                font-size: 1.2em;
            }

            .multiplayer-score-value.player1 {
                color: #00ff41;
                text-shadow: 0 0 10px rgba(0, 255, 65, 0.6);
            }

            .multiplayer-score-value.player2 {
                color: #00bfff;
                text-shadow: 0 0 10px rgba(0, 191, 255, 0.6);
            }

            .multiplayer-score-separator {
                border-top: 1px solid rgba(255, 255, 255, 0.2);
                margin: 15px 0;
            }

            .multiplayer-round-info {
                color: #aaaaaa;
                font-size: 1.1em;
                margin: 15px 0;
            }

            .multiplayer-game-over-buttons {
                display: flex;
                gap: 15px;
                justify-content: center;
                margin-top: 30px;
            }

            .multiplayer-game-over-btn {
                padding: 15px 30px;
                font-size: 1.2em;
                font-family: 'Courier New', monospace;
                font-weight: bold;
                border: 2px solid;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                min-width: 150px;
                text-transform: uppercase;
            }

            .multiplayer-game-over-btn.restart {
                background: rgba(0, 255, 65, 0.2);
                border-color: #00ff41;
                color: #00ff41;
            }

            .multiplayer-game-over-btn.restart:hover {
                background: rgba(0, 255, 65, 0.4);
                box-shadow: 0 0 15px rgba(0, 255, 65, 0.5);
            }

            .multiplayer-game-over-btn.reset {
                background: rgba(255, 165, 0, 0.2);
                border-color: #ffa500;
                color: #ffa500;
            }

            .multiplayer-game-over-btn.reset:hover {
                background: rgba(255, 165, 0, 0.4);
                box-shadow: 0 0 15px rgba(255, 165, 0, 0.5);
            }

            .multiplayer-game-over-btn.single-player {
                background: rgba(0, 191, 255, 0.2);
                border-color: #00bfff;
                color: #00bfff;
            }

            .multiplayer-game-over-btn.single-player:hover {
                background: rgba(0, 191, 255, 0.4);
                box-shadow: 0 0 15px rgba(0, 191, 255, 0.5);
            }

            /* Mobile responsive styles */
            @media (max-width: 768px) {
                .multiplayer-game-over-container {
                    min-width: 300px;
                    padding: 30px 20px;
                }

                .multiplayer-game-over-title {
                    font-size: 2em;
                    margin-bottom: 20px;
                }

                .multiplayer-score-row {
                    font-size: 1.2em;
                    padding: 8px 15px;
                }

                .multiplayer-game-over-buttons {
                    flex-direction: column;
                    gap: 10px;
                }

                .multiplayer-game-over-btn {
                    padding: 12px 20px;
                    font-size: 1em;
                    min-width: 120px;
                }
            }

            /* Extra small screens */
            @media (max-width: 480px) {
                .multiplayer-game-over-container {
                    min-width: 250px;
                    padding: 20px 15px;
                }

                .multiplayer-game-over-title {
                    font-size: 1.5em;
                    margin-bottom: 15px;
                }

                .multiplayer-score-row {
                    font-size: 1em;
                    padding: 6px 10px;
                }

                .multiplayer-round-info {
                    font-size: 0.9em;
                }

                .multiplayer-game-over-btn {
                    padding: 10px 15px;
                    font-size: 0.9em;
                    min-width: 100px;
                }
            }

            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
                .multiplayer-game-over-btn {
                    transition: none;
                }
            }
        `;
        document.head.appendChild(style);
        this.isInitialized = true;
    }

    /**
     * Show game over screen with winner announcement and final scores
     * @param {Object} gameState - Current game state with scoring information
     * @param {Function} onRestart - Callback for restart button
     * @param {Function} onResetScores - Callback for reset scores button
     * @param {Function} onReturnToSinglePlayer - Callback for return to single player button
     */
    show(gameState, onRestart, onResetScores, onReturnToSinglePlayer) {
        // Remove existing game over element if present
        this.hide();

        // Get scoring details
        const localScoring = gameState.localScoring || {};
        const player1Wins = localScoring.player1Wins || 0;
        const player2Wins = localScoring.player2Wins || 0;
        const totalRounds = localScoring.totalRounds || 0;

        // Determine winner
        let winnerClass = 'tie';
        let winnerText = 'Tie Game!';
        
        if (player1Wins > player2Wins) {
            winnerClass = 'player1-wins';
            winnerText = 'Player 1 Wins!';
        } else if (player2Wins > player1Wins) {
            winnerClass = 'player2-wins';
            winnerText = 'Player 2 Wins!';
        }

        // Create game over container
        this.gameOverElement = document.createElement('div');
        this.gameOverElement.className = 'multiplayer-game-over-container';
        this.gameOverElement.innerHTML = `
            <div class="multiplayer-game-over-title ${winnerClass}">
                ${winnerText}
            </div>
            
            <div class="multiplayer-final-scores">
                <div class="multiplayer-score-row">
                    <span class="multiplayer-score-label">Player 1</span>
                    <span class="multiplayer-score-value player1">${player1Wins}</span>
                </div>
                <div class="multiplayer-score-separator"></div>
                <div class="multiplayer-score-row">
                    <span class="multiplayer-score-label">Player 2</span>
                    <span class="multiplayer-score-value player2">${player2Wins}</span>
                </div>
            </div>
            
            <div class="multiplayer-round-info">
                Total Rounds: ${totalRounds}
            </div>
            
            <div class="multiplayer-game-over-buttons">
                <button class="multiplayer-game-over-btn restart" id="multiplayerRestartBtn">
                    Next Round
                </button>
                <button class="multiplayer-game-over-btn reset" id="multiplayerResetBtn">
                    Reset Scores
                </button>
                <button class="multiplayer-game-over-btn single-player" id="multiplayerSinglePlayerBtn">
                    Single Player
                </button>
            </div>
        `;

        document.body.appendChild(this.gameOverElement);

        // Attach event listeners
        const restartBtn = document.getElementById('multiplayerRestartBtn');
        const resetBtn = document.getElementById('multiplayerResetBtn');
        const singlePlayerBtn = document.getElementById('multiplayerSinglePlayerBtn');

        if (restartBtn && onRestart) {
            restartBtn.addEventListener('click', () => {
                this.hide();
                onRestart();
            });
        }

        if (resetBtn && onResetScores) {
            resetBtn.addEventListener('click', () => {
                this.hide();
                onResetScores();
            });
        }

        if (singlePlayerBtn && onReturnToSinglePlayer) {
            singlePlayerBtn.addEventListener('click', () => {
                this.hide();
                onReturnToSinglePlayer();
            });
        }
    }

    /**
     * Hide and remove game over screen
     */
    hide() {
        if (this.gameOverElement && this.gameOverElement.parentNode) {
            this.gameOverElement.parentNode.removeChild(this.gameOverElement);
            this.gameOverElement = null;
        }
    }

    /**
     * Check if game over screen is currently visible
     * @returns {boolean} True if visible
     */
    isVisible() {
        return this.gameOverElement !== null && this.gameOverElement.parentNode !== null;
    }

    /**
     * Clean up and remove all UI elements
     */
    destroy() {
        this.hide();
        
        const styleElement = document.getElementById('multiplayerGameOverStyles');
        if (styleElement && styleElement.parentNode) {
            styleElement.parentNode.removeChild(styleElement);
        }
        
        this.isInitialized = false;
    }
}

module.exports = { MultiplayerGameOverUI };
