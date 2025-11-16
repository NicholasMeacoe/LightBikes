/**
 * CountdownTimer - Handles 3-2-1-GO countdown sequence for Time Trial mode
 * Provides visual countdown with proper timing and game start integration
 */
class CountdownTimer {
    constructor() {
        this.isRunning = false;
        this.currentCount = 0;
        this.countdownElement = null;
        this.onCountdownComplete = null;
        this.timeoutId = null;
        
        // Countdown sequence configuration
        this.sequence = [
            { text: '3', duration: 1000 },
            { text: '2', duration: 1000 },
            { text: '1', duration: 1000 },
            { text: 'GO!', duration: 500 }
        ];
    }

    /**
     * Start the countdown sequence
     * @param {function} onComplete - Callback function to call when countdown completes
     */
    start(onComplete) {
        if (this.isRunning) {
            return;
        }

        this.onCountdownComplete = onComplete;
        this.isRunning = true;
        this.currentCount = 0;
        
        this.createCountdownUI();
        this.showNextCount();
    }

    /**
     * Stop the countdown sequence
     */
    stop() {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;
        this.clearTimeout();
        this.hideCountdownUI();
        this.currentCount = 0;
    }

    /**
     * Create the countdown UI element
     */
    createCountdownUI() {
        // Remove existing countdown if present
        this.hideCountdownUI();

        // Create countdown container
        this.countdownElement = document.createElement('div');
        this.countdownElement.id = 'countdown-display';
        this.countdownElement.className = 'countdown-container';
        
        // Add styles if not already present
        this.addCountdownStyles();
        
        // Add to document
        document.body.appendChild(this.countdownElement);
    }

    /**
     * Show the next count in the sequence
     */
    showNextCount() {
        if (!this.isRunning || this.currentCount >= this.sequence.length) {
            this.completeCountdown();
            return;
        }

        const currentStep = this.sequence[this.currentCount];
        
        // Update display
        if (this.countdownElement) {
            this.countdownElement.textContent = currentStep.text;
            this.countdownElement.className = 'countdown-container countdown-show';
        }

        // Schedule next step
        this.timeoutId = setTimeout(() => {
            this.currentCount++;
            this.showNextCount();
        }, currentStep.duration);
    }

    /**
     * Complete the countdown sequence
     */
    completeCountdown() {
        this.isRunning = false;
        this.hideCountdownUI();
        
        // Call completion callback
        if (this.onCountdownComplete) {
            this.onCountdownComplete();
        }
    }

    /**
     * Hide and remove the countdown UI
     */
    hideCountdownUI() {
        if (this.countdownElement) {
            this.countdownElement.remove();
            this.countdownElement = null;
        }
    }

    /**
     * Clear any active timeout
     */
    clearTimeout() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    /**
     * Add CSS styles for the countdown display
     */
    addCountdownStyles() {
        // Check if styles already exist
        if (document.getElementById('countdown-timer-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'countdown-timer-styles';
        style.textContent = `
            .countdown-container {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 2000;
                font-size: 120px;
                font-weight: bold;
                color: #00ffff;
                text-shadow: 
                    0 0 20px rgba(0, 255, 255, 0.8),
                    0 0 40px rgba(0, 255, 255, 0.6),
                    0 0 60px rgba(0, 255, 255, 0.4);
                text-align: center;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.2s ease-in-out;
                font-family: 'Arial', sans-serif;
                user-select: none;
            }

            .countdown-container.countdown-show {
                opacity: 1;
            }

            @media (max-width: 768px) {
                .countdown-container {
                    font-size: 80px;
                }
            }

            @media (max-width: 480px) {
                .countdown-container {
                    font-size: 60px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Check if countdown is currently running
     * @returns {boolean} True if countdown is active
     */
    isActive() {
        return this.isRunning;
    }

    /**
     * Get current countdown state for debugging/testing
     * @returns {object} Current state object
     */
    getState() {
        return {
            isRunning: this.isRunning,
            currentCount: this.currentCount,
            hasElement: !!this.countdownElement,
            hasTimeout: !!this.timeoutId
        };
    }

    /**
     * Cleanup method to remove event listeners and DOM elements
     */
    destroy() {
        this.stop();
        const styles = document.getElementById('countdown-timer-styles');
        if (styles) {
            styles.remove();
        }
    }
}

module.exports = { CountdownTimer };