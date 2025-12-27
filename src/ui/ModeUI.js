/**
 * ModeUI - Manages mode-specific UI elements
 * Handles Time Trial, Arena Shrink, and remaining entities displays
 */
class ModeUI {
    constructor() {
        this.styleManager = null;
        this.game = null;
        this.survivalTimer = null;
    }

    /**
     * Initialize with dependencies
     * @param {Object} dependencies - Required dependencies
     */
    initialize(dependencies) {
        this.styleManager = dependencies.styleManager;
        this.game = dependencies.game;
        this.survivalTimer = dependencies.survivalTimer;
    }

    /**
     * Create UI for specific mode
     * @param {string} mode - Game mode
     */
    createUI(mode) {
        switch (mode) {
            case 'TIME_TRIAL':
                this.createTimeTrialUI();
                break;
            case 'ARENA_SHRINK':
                this.createArenaShrinkUI();
                break;
            default:
                break;
        }
    }

    /**
     * Update display for specific mode
     * @param {string} mode - Game mode
     * @param {Object} gameState - Current game state
     */
    updateDisplay(mode, gameState) {
        switch (mode) {
            case 'TIME_TRIAL':
                this.updateTimeTrialDisplay();
                break;
            case 'ARENA_SHRINK':
                this.updateArenaShrinkDisplay();
                break;
            default:
                break;
        }
    }

    /**
     * Hide UI for specific mode
     * @param {string} mode - Game mode
     */
    hideUI(mode) {
        switch (mode) {
            case 'TIME_TRIAL':
                this.hideTimeTrialUI();
                break;
            case 'ARENA_SHRINK':
                this.hideArenaShrinkUI();
                break;
            default:
                break;
        }
    }

    /**
     * Hide all mode-specific UI
     */
    hideAllModeUI() {
        this.hideTimeTrialUI();
        this.hideArenaShrinkUI();
        this.hideRemainingEntitiesDisplay();
    }

    // ========== Time Trial UI ==========

    /**
     * Create Time Trial UI elements
     */
    createTimeTrialUI() {
        // Create timer display
        let timerElement = document.getElementById('timer-display');
        if (!timerElement) {
            timerElement = document.createElement('div');
            timerElement.id = 'timer-display';
            timerElement.className = 'timer-display';
            timerElement.textContent = '00:00.00';
            document.body.appendChild(timerElement);
        }

        // Add timer display styles
        this.addTimeTrialStyles();
    }

    /**
     * Update Time Trial mode display
     */
    updateTimeTrialDisplay() {
        // Update timer display
        const timerElement = document.getElementById('timer-display');
        if (timerElement && this.survivalTimer) {
            timerElement.textContent = this.survivalTimer.getCurrentFormattedTime();
        } else if (!timerElement) {
            // Create timer display if it doesn't exist
            this.createTimeTrialUI();
        }
    }

    /**
     * Hide Time Trial UI elements
     */
    hideTimeTrialUI() {
        const timerElement = document.getElementById('timer-display');
        if (timerElement) {
            timerElement.remove();
        }
    }

    /**
     * Add CSS styles for Time Trial UI
     */
    addTimeTrialStyles() {
        if (!this.styleManager) {
            return;
        }

        const styles = `
            .timer-display {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 36px;
                font-weight: bold;
                color: #00ffff;
                text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
                z-index: 100;
                font-family: 'Courier New', monospace;
                background: rgba(0, 0, 0, 0.7);
                padding: 10px 20px;
                border-radius: 5px;
                border: 2px solid #00ffff;
            }

            .new-record {
                color: #ffff00;
                font-weight: bold;
                text-shadow: 0 0 10px rgba(255, 255, 0, 0.8);
            }

            .ui-hidden {
                display: none !important;
            }

            @media (max-width: 768px) {
                .timer-display {
                    font-size: 24px;
                    top: 10px;
                    padding: 8px 16px;
                }
            }
        `;

        this.styleManager.addStyles('time-trial-styles', styles);
    }

    // ========== Arena Shrink UI ==========

    /**
     * Create Arena Shrink UI elements
     */
    createArenaShrinkUI() {
        // Create survival timer display (similar to Time Trial)
        let timerElement = document.getElementById('arena-timer-display');
        if (!timerElement) {
            timerElement = document.createElement('div');
            timerElement.id = 'arena-timer-display';
            timerElement.className = 'arena-timer-display';
            timerElement.textContent = '00:00.00';
            document.body.appendChild(timerElement);
        }

        // Create arena info display
        let arenaInfoElement = document.getElementById('arena-info-display');
        if (!arenaInfoElement) {
            arenaInfoElement = document.createElement('div');
            arenaInfoElement.id = 'arena-info-display';
            arenaInfoElement.className = 'arena-info-display';
            arenaInfoElement.innerHTML = `
                <div class="arena-size">Arena: 30x30</div>
                <div class="shrink-countdown">Next shrink: 5.0s</div>
            `;
            document.body.appendChild(arenaInfoElement);
        }

        // Add Arena Shrink display styles
        this.addArenaShrinkStyles();
    }

    /**
     * Update Arena Shrink mode display
     */
    updateArenaShrinkDisplay() {
        if (!this.game) {
            return;
        }

        const gameState = this.game.getGameState();

        // Update survival timer display
        const timerElement = document.getElementById('arena-timer-display');
        if (timerElement && gameState.formattedSurvivalTime) {
            timerElement.textContent = gameState.formattedSurvivalTime;
        }

        // Update arena information
        const arenaInfoElement = document.getElementById('arena-info-display');
        if (arenaInfoElement && gameState.arenaState) {
            const arenaState = gameState.arenaState;
            const arenaSizeElement = arenaInfoElement.querySelector('.arena-size');
            const shrinkCountdownElement = arenaInfoElement.querySelector('.shrink-countdown');

            if (arenaSizeElement) {
                arenaSizeElement.textContent = `Arena: ${arenaState.currentSize}x${arenaState.currentSize}`;
            }

            if (shrinkCountdownElement) {
                if (arenaState.isAtMinimum) {
                    shrinkCountdownElement.textContent = 'FINAL ARENA';
                    shrinkCountdownElement.classList.add('final-arena');
                } else if (arenaState.warningActive) {
                    const countdown = (arenaState.timeUntilShrink / 1000).toFixed(1);
                    shrinkCountdownElement.textContent = `Shrinking in: ${countdown}s`;
                    shrinkCountdownElement.classList.add('warning-active');
                } else {
                    const countdown = (arenaState.timeUntilShrink / 1000).toFixed(1);
                    shrinkCountdownElement.textContent = `Next shrink: ${countdown}s`;
                    shrinkCountdownElement.classList.remove('warning-active', 'final-arena');
                }
            }
        }
    }

    /**
     * Hide Arena Shrink UI elements
     */
    hideArenaShrinkUI() {
        const timerElement = document.getElementById('arena-timer-display');
        if (timerElement) {
            timerElement.remove();
        }

        const arenaInfoElement = document.getElementById('arena-info-display');
        if (arenaInfoElement) {
            arenaInfoElement.remove();
        }
    }

    /**
     * Add CSS styles for Arena Shrink UI
     */
    addArenaShrinkStyles() {
        if (!this.styleManager) {
            return;
        }

        const styles = `
            .arena-timer-display {
                position: fixed;
                top: 20px;
                left: 20px;
                font-size: 24px;
                font-weight: bold;
                color: #00ffff;
                text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
                z-index: 100;
                font-family: 'Courier New', monospace;
                background: rgba(0, 0, 0, 0.7);
                padding: 8px 16px;
                border-radius: 5px;
                border: 2px solid #00ffff;
            }

            .arena-info-display {
                position: fixed;
                top: 20px;
                right: 20px;
                font-size: 18px;
                font-weight: bold;
                color: #ffffff;
                text-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
                z-index: 100;
                font-family: 'Courier New', monospace;
                background: rgba(0, 0, 0, 0.7);
                padding: 12px 20px;
                border-radius: 5px;
                border: 2px solid #ffffff;
                text-align: right;
            }

            .arena-info-display .arena-size {
                margin-bottom: 8px;
                color: #00ff00;
            }

            .arena-info-display .shrink-countdown {
                color: #ffff00;
                transition: color 0.3s ease;
            }

            .arena-info-display .shrink-countdown.warning-active {
                color: #ff4444;
                animation: warningPulse 0.5s ease-in-out infinite alternate;
            }

            .arena-info-display .shrink-countdown.final-arena {
                color: #ff0000;
                font-weight: bold;
                animation: finalArenaPulse 1s ease-in-out infinite alternate;
            }

            @keyframes warningPulse {
                from { opacity: 0.7; }
                to { opacity: 1.0; }
            }

            @keyframes finalArenaPulse {
                from { 
                    opacity: 0.8;
                    text-shadow: 0 0 8px rgba(255, 0, 0, 0.6);
                }
                to { 
                    opacity: 1.0;
                    text-shadow: 0 0 15px rgba(255, 0, 0, 1.0);
                }
            }

            @media (max-width: 768px) {
                .arena-timer-display {
                    font-size: 18px;
                    top: 10px;
                    left: 10px;
                    padding: 6px 12px;
                }
                
                .arena-info-display {
                    font-size: 14px;
                    top: 10px;
                    right: 10px;
                    padding: 8px 16px;
                }
            }

            @media (max-width: 480px) {
                .arena-timer-display {
                    font-size: 16px;
                    padding: 4px 8px;
                }
                
                .arena-info-display {
                    font-size: 12px;
                    padding: 6px 12px;
                }
            }
        `;

        this.styleManager.addStyles('arena-shrink-styles', styles);
    }

    /**
     * Show Final Arena message when minimum arena size is reached
     */
    showFinalArenaMessage() {
        // Create final arena message element
        let finalArenaElement = document.getElementById('final-arena-message');
        if (!finalArenaElement) {
            finalArenaElement = document.createElement('div');
            finalArenaElement.id = 'final-arena-message';
            finalArenaElement.className = 'final-arena-message';
            document.body.appendChild(finalArenaElement);
        }

        // Set message content
        finalArenaElement.innerHTML = '<span class="final-arena-text">FINAL ARENA</span>';

        // Show message with animation
        finalArenaElement.style.display = 'block';
        finalArenaElement.style.opacity = '0';

        // Fade in animation
        setTimeout(() => {
            finalArenaElement.style.opacity = '1';
        }, 50);

        // Auto-hide after 3 seconds
        setTimeout(() => {
            this.hideFinalArenaMessage();
        }, 3000);

        // Add styles if not already present
        this.addFinalArenaStyles();
    }

    /**
     * Hide Final Arena message
     */
    hideFinalArenaMessage() {
        const finalArenaElement = document.getElementById('final-arena-message');
        if (finalArenaElement) {
            finalArenaElement.style.opacity = '0';
            setTimeout(() => {
                finalArenaElement.style.display = 'none';
            }, 500);
        }
    }

    /**
     * Add CSS styles for Final Arena message
     */
    addFinalArenaStyles() {
        if (!this.styleManager) {
            return;
        }

        const styles = `
            .final-arena-message {
                position: fixed;
                top: 30%;
                left: 50%;
                transform: translateX(-50%);
                z-index: 200;
                display: none;
                opacity: 0;
                transition: opacity 0.5s ease-in-out;
                pointer-events: none;
            }

            .final-arena-text {
                font-size: 48px;
                font-weight: bold;
                color: #ff4444;
                text-shadow: 
                    0 0 10px rgba(255, 68, 68, 0.8),
                    0 0 20px rgba(255, 68, 68, 0.6),
                    0 0 30px rgba(255, 68, 68, 0.4);
                font-family: 'Courier New', monospace;
                background: rgba(0, 0, 0, 0.8);
                padding: 20px 40px;
                border-radius: 10px;
                border: 3px solid #ff4444;
                animation: finalArenaGlow 2s ease-in-out infinite alternate;
            }

            @keyframes finalArenaGlow {
                from {
                    text-shadow: 
                        0 0 10px rgba(255, 68, 68, 0.8),
                        0 0 20px rgba(255, 68, 68, 0.6),
                        0 0 30px rgba(255, 68, 68, 0.4);
                    border-color: #ff4444;
                }
                to {
                    text-shadow: 
                        0 0 15px rgba(255, 68, 68, 1.0),
                        0 0 25px rgba(255, 68, 68, 0.8),
                        0 0 35px rgba(255, 68, 68, 0.6);
                    border-color: #ff6666;
                }
            }

            @media (max-width: 768px) {
                .final-arena-text {
                    font-size: 32px;
                    padding: 15px 30px;
                }
            }

            @media (max-width: 480px) {
                .final-arena-text {
                    font-size: 24px;
                    padding: 10px 20px;
                }
            }
        `;

        this.styleManager.addStyles('final-arena-styles', styles);
    }

    // ========== Remaining Entities Display ==========

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
        if (!this.styleManager) {
            return;
        }

        const styles = `
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

        this.styleManager.addStyles('remaining-entities-styles', styles);
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
}

module.exports = { ModeUI };
