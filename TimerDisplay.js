/**
 * TimerDisplay - UI component for displaying survival timer in Time Trial mode
 * Handles real-time timer updates and integration with game pause functionality
 */
class TimerDisplay {
    constructor() {
        this.timerElement = null;
        this.isVisible = false;
        this.lastDisplayedTime = '';
    }

    /**
     * Create and show the timer display
     */
    show() {
        if (this.isVisible) {
            return;
        }

        this.createTimerUI();
        this.isVisible = true;
    }

    /**
     * Hide the timer display
     */
    hide() {
        if (!this.isVisible) {
            return;
        }

        if (this.timerElement) {
            this.timerElement.style.display = 'none';
        }
        this.isVisible = false;
    }

    /**
     * Create the timer UI element
     */
    createTimerUI() {
        // Remove existing timer if present
        const existing = document.getElementById('survival-timer');
        if (existing) {
            existing.remove();
        }

        // Create timer display element
        this.timerElement = document.createElement('div');
        this.timerElement.id = 'survival-timer';
        this.timerElement.className = 'timer-display';
        this.timerElement.textContent = '00:00.00';

        // Add styles if not already present
        this.addTimerStyles();

        // Add to document
        document.body.appendChild(this.timerElement);
    }

    /**
     * Update the timer display with current time
     * @param {string} formattedTime - Time in MM:SS.SS format
     */
    updateTime(formattedTime) {
        if (!this.isVisible || !this.timerElement) {
            return;
        }

        // Only update DOM if time has changed to reduce overhead
        if (formattedTime !== this.lastDisplayedTime) {
            this.timerElement.textContent = formattedTime;
            this.lastDisplayedTime = formattedTime;
        }
    }

    /**
     * Update timer display based on game state
     * @param {Object} gameState - Current game state
     */
    update(gameState) {
        if (!gameState) {
            return;
        }

        // Show timer only in Time Trial mode
        if (gameState.gameMode === 'time_trial') {
            if (!this.isVisible) {
                this.show();
            }

            // Update time display
            const timeToDisplay = gameState.formattedSurvivalTime || '00:00.00';
            this.updateTime(timeToDisplay);

            // Add paused indicator if game is paused
            if (gameState.isPaused) {
                this.showPausedState();
            } else {
                this.hidePausedState();
            }
        } else {
            // Hide timer in Classic mode
            if (this.isVisible) {
                this.hide();
            }
        }
    }

    /**
     * Show paused state indicator
     */
    showPausedState() {
        if (this.timerElement) {
            this.timerElement.classList.add('paused');
        }
    }

    /**
     * Hide paused state indicator
     */
    hidePausedState() {
        if (this.timerElement) {
            this.timerElement.classList.remove('paused');
        }
    }

    /**
     * Reset timer display to initial state
     */
    reset() {
        this.lastDisplayedTime = '';
        if (this.timerElement) {
            this.timerElement.textContent = '00:00.00';
            this.timerElement.classList.remove('paused');
        }
    }

    /**
     * Add CSS styles for the timer display
     */
    addTimerStyles() {
        // Check if styles already exist
        if (document.getElementById('timer-display-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'timer-display-styles';
        style.textContent = `
            .timer-display {
                position: absolute;
                top: 50px;
                left: 50%;
                transform: translateX(-50%);
                background-color: rgba(0, 0, 0, 0.8);
                border: 2px solid #00ffff;
                border-radius: 10px;
                padding: 15px 25px;
                color: #00ffff;
                font-size: 2.5em;
                font-weight: bold;
                font-family: 'Courier New', monospace;
                text-shadow: 0 0 15px rgba(0, 255, 255, 0.8);
                box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
                z-index: 500;
                user-select: none;
                pointer-events: none;
                min-width: 200px;
                text-align: center;
                transition: opacity 0.3s ease;
            }

            .timer-display.paused {
                opacity: 0.6;
                animation: pulse-paused 1s infinite;
            }

            @keyframes pulse-paused {
                0%, 100% { opacity: 0.6; }
                50% { opacity: 0.3; }
            }

            /* Responsive design for smaller screens */
            @media (max-width: 768px) {
                .timer-display {
                    font-size: 2em;
                    padding: 12px 20px;
                    top: 30px;
                }
            }

            @media (max-width: 480px) {
                .timer-display {
                    font-size: 1.5em;
                    padding: 10px 15px;
                    top: 20px;
                    min-width: 150px;
                }
            }

            /* High contrast mode support */
            @media (prefers-contrast: high) {
                .timer-display {
                    background-color: rgba(0, 0, 0, 0.95);
                    border-color: #ffffff;
                    color: #ffffff;
                    text-shadow: none;
                    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
                }
            }

            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
                .timer-display {
                    transition: none;
                }
                
                .timer-display.paused {
                    animation: none;
                    opacity: 0.6;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Check if timer display is currently visible
     * @returns {boolean} True if visible
     */
    isShowing() {
        return this.isVisible;
    }

    /**
     * Get current displayed time
     * @returns {string} Currently displayed time
     */
    getCurrentDisplayedTime() {
        return this.lastDisplayedTime;
    }

    /**
     * Cleanup method to remove event listeners and DOM elements
     */
    destroy() {
        this.hide();
        if (this.timerElement) {
            this.timerElement.remove();
            this.timerElement = null;
        }
        
        const styles = document.getElementById('timer-display-styles');
        if (styles) {
            styles.remove();
        }
        
        this.isVisible = false;
        this.lastDisplayedTime = '';
    }
}

module.exports = { TimerDisplay };