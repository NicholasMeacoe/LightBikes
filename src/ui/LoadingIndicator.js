/**
 * LoadingIndicator - Provides visual feedback during game initialization
 */
class LoadingIndicator {
    constructor() {
        this.element = null;
        this.messageElement = null;
        this.stylesAdded = false;
    }

    /**
     * Show loading overlay with message
     * @param {string} message - Initial loading message
     */
    show(message = 'Loading...') {
        if (!this.element) {
            this.element = document.createElement('div');
            this.element.id = 'loading-indicator';
            this.element.className = 'loading-indicator';
            this.element.innerHTML = `
                <div class="loading-spinner"></div>
                <div class="loading-message">${message}</div>
            `;
            document.body.appendChild(this.element);
            this.messageElement = this.element.querySelector('.loading-message');

            if (!this.stylesAdded) {
                this._addStyles();
                this.stylesAdded = true;
            }
        } else {
            // If element exists but was transformed to error display, recreate loading UI
            if (!this.element.querySelector('.loading-spinner')) {
                this.element.innerHTML = `
                    <div class="loading-spinner"></div>
                    <div class="loading-message">${message}</div>
                `;
                this.messageElement = this.element.querySelector('.loading-message');
            } else if (this.messageElement) {
                this.messageElement.textContent = message;
            }
        }

        this.element.style.display = 'flex';
    }

    /**
     * Update progress with step and message
     * @param {string} step - Current initialization step
     * @param {string} message - Progress message
     */
    updateProgress(step, message) {
        if (this.messageElement) {
            this.messageElement.textContent = message || step;
        }
    }

    /**
     * Hide loading indicator with fade-out animation
     */
    hide() {
        if (this.element) {
            this.element.style.opacity = '0';
            setTimeout(() => {
                this.element.style.display = 'none';
                this.element.style.opacity = '1';
            }, 300);
        }
    }

    /**
     * Transform loading overlay into error display
     * @param {Error} error - Error object
     * @param {Function} retryCallback - Optional retry callback
     */
    showError(error, retryCallback = null) {
        if (!this.element) {
            this.show('Error');
        }

        const errorTitle =
            error.name && error.name !== 'Error' ? error.name : 'Initialization Error';
        const errorMessage = error.message || 'An unexpected error occurred';
        const technicalDetails = error.stack ? `<pre>${error.stack}</pre>` : '';

        const actionableSteps = this._getActionableSteps(error);
        const stepsHTML =
            actionableSteps.length > 0
                ? `<ul>${actionableSteps.map((step) => `<li>${step}</li>`).join('')}</ul>`
                : '';

        const retryButton = retryCallback
            ? `<button class="error-retry-button" id="error-retry-button">Retry</button>`
            : '';

        this.element.innerHTML = `
            <div class="error-display">
                <div class="error-title">${errorTitle}</div>
                <div class="error-message">${errorMessage}</div>
                ${stepsHTML ? `<div class="error-steps"><strong>What you can do:</strong>${stepsHTML}</div>` : ''}
                ${technicalDetails ? `<details class="error-details"><summary>Technical Details</summary>${technicalDetails}</details>` : ''}
                ${retryButton}
            </div>
        `;

        this.element.style.display = 'flex';

        if (retryCallback) {
            const button = document.getElementById('error-retry-button');
            if (button) {
                button.addEventListener('click', /** @type {EventListener} */ (retryCallback));
            }
        }
    }

    /**
     * Get actionable steps based on error type
     * @param {Error} error - Error object
     * @returns {Array<string>} Array of actionable steps
     * @private
     */
    _getActionableSteps(error) {
        // Check if error has custom actionableSteps property
        if (error.actionableSteps && Array.isArray(error.actionableSteps)) {
            return error.actionableSteps;
        }

        // Fallback to message-based detection
        const message = error.message || '';
        const steps = [];

        if (message.includes('WebGL')) {
            steps.push('Update your browser to the latest version');
            steps.push('Enable hardware acceleration in browser settings');
            steps.push('Try a different browser (Chrome, Firefox, or Edge)');
        } else if (message.includes('DOM') || message.includes('canvas')) {
            steps.push('Refresh the page');
            steps.push('Clear your browser cache');
            steps.push('Disable browser extensions that might interfere');
        } else if (message.includes('Mode Selector')) {
            steps.push('Refresh the page');
            steps.push('Check if JavaScript is enabled');
        } else {
            steps.push('Refresh the page');
            steps.push('Try again in a few moments');
        }

        return steps;
    }

    /**
     * Add CSS styles for loading indicator
     * @private
     */
    _addStyles() {
        if (document.getElementById('loading-indicator-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'loading-indicator-styles';
        style.textContent = `
            .loading-indicator {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                transition: opacity 0.3s ease;
            }

            .loading-spinner {
                width: 50px;
                height: 50px;
                border: 4px solid rgba(0, 255, 255, 0.3);
                border-top-color: #0ff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            .loading-message {
                margin-top: 20px;
                color: #0ff;
                font-size: 18px;
                font-family: 'Courier New', monospace;
                text-align: center;
            }

            .error-display {
                max-width: 600px;
                padding: 30px;
                background: rgba(20, 20, 20, 0.95);
                border: 2px solid #f00;
                border-radius: 8px;
                color: #fff;
                font-family: 'Courier New', monospace;
            }

            .error-title {
                font-size: 24px;
                color: #f00;
                margin-bottom: 15px;
                font-weight: bold;
            }

            .error-message {
                font-size: 16px;
                margin-bottom: 20px;
                line-height: 1.5;
            }

            .error-steps {
                margin-bottom: 20px;
            }

            .error-steps ul {
                margin-top: 10px;
                padding-left: 20px;
            }

            .error-steps li {
                margin: 5px 0;
                line-height: 1.4;
            }

            .error-details {
                margin-bottom: 20px;
                font-size: 12px;
            }

            .error-details summary {
                cursor: pointer;
                color: #0ff;
                margin-bottom: 10px;
            }

            .error-details pre {
                background: rgba(0, 0, 0, 0.5);
                padding: 10px;
                border-radius: 4px;
                overflow-x: auto;
                font-size: 11px;
                max-height: 200px;
                overflow-y: auto;
            }

            .error-retry-button {
                background: #0ff;
                color: #000;
                border: none;
                padding: 12px 30px;
                font-size: 16px;
                font-family: 'Courier New', monospace;
                font-weight: bold;
                cursor: pointer;
                border-radius: 4px;
                transition: all 0.2s;
            }

            .error-retry-button:hover {
                background: #0cc;
                transform: scale(1.05);
            }

            .error-retry-button:active {
                transform: scale(0.95);
            }
        `;
        document.head.appendChild(style);
    }
}

module.exports = { LoadingIndicator };
