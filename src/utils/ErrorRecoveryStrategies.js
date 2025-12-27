/**
 * Error recovery strategies for game initialization
 */

const {
    DOMNotReadyError,
    CanvasCreationError,
    ModeSelectorError,
} = require('./InitializationErrors.js');
const { logger } = require('./Logger.js');

class ErrorRecoveryStrategies {
    constructor() {
        this.maxDOMRetries = 3;
        this.domRetryDelay = 500; // ms
        this.domRetryCount = 0;
    }

    /**
     * Attempt to recover from DOM not ready error
     * @param {Function} initCallback - Initialization callback to retry
     * @returns {Promise<boolean>} True if recovery successful
     */
    async recoverFromDOMNotReady(initCallback) {
        if (this.domRetryCount >= this.maxDOMRetries) {
            return false;
        }

        this.domRetryCount++;
        logger.info(
            `Retrying initialization (attempt ${this.domRetryCount}/${this.maxDOMRetries})...`
        );

        return new Promise((resolve) => {
            setTimeout(async () => {
                try {
                    await initCallback();
                    resolve(true);
                } catch (error) {
                    resolve(false);
                }
            }, this.domRetryDelay);
        });
    }

    /**
     * Get user agent string (extracted for testability)
     * @returns {string} User agent string
     */
    getUserAgent() {
        return navigator.userAgent;
    }

    /**
     * Get browser compatibility message for WebGL errors
     * @returns {Object} Compatibility information
     */
    getWebGLCompatibilityMessage() {
        const userAgent = this.getUserAgent().toLowerCase();
        let browserName = 'your browser';
        let updateLink = '';

        // Check Edge before Chrome since Edge UA contains 'chrome'
        if (userAgent.includes('edg')) {
            browserName = 'Edge';
            updateLink = 'https://www.microsoft.com/edge';
        } else if (userAgent.includes('chrome')) {
            browserName = 'Chrome';
            updateLink = 'https://www.google.com/chrome/';
        } else if (userAgent.includes('firefox')) {
            browserName = 'Firefox';
            updateLink = 'https://www.mozilla.org/firefox/';
        } else if (userAgent.includes('safari')) {
            browserName = 'Safari';
            updateLink = 'https://www.apple.com/safari/';
        }

        return {
            browserName,
            updateLink,
            message: `WebGL is not available in ${browserName}. This game requires WebGL to run.`,
            actionableSteps: [
                `Update ${browserName} to the latest version`,
                'Enable hardware acceleration in browser settings',
                'Try a different browser if the issue persists',
                'Visit https://get.webgl.org/ to test WebGL support',
            ],
        };
    }

    /**
     * Create fallback mode selector
     * @param {Function} onModeSelected - Callback when mode is selected
     * @returns {HTMLElement} Fallback mode selector element
     */
    createFallbackModeSelector(onModeSelected) {
        const fallback = document.createElement('div');
        fallback.id = 'fallback-mode-selector';
        fallback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid #0ff;
            padding: 30px;
            border-radius: 8px;
            z-index: 10000;
            font-family: 'Courier New', monospace;
            color: #0ff;
        `;

        fallback.innerHTML = `
            <h2 style="margin: 0 0 20px 0; text-align: center;">Select Game Mode</h2>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button class="fallback-mode-btn" data-mode="classic" style="
                    background: #0ff;
                    color: #000;
                    border: none;
                    padding: 15px;
                    font-size: 16px;
                    font-family: 'Courier New', monospace;
                    font-weight: bold;
                    cursor: pointer;
                    border-radius: 4px;
                ">Classic Mode</button>
                <button class="fallback-mode-btn" data-mode="time_trial" style="
                    background: #0ff;
                    color: #000;
                    border: none;
                    padding: 15px;
                    font-size: 16px;
                    font-family: 'Courier New', monospace;
                    font-weight: bold;
                    cursor: pointer;
                    border-radius: 4px;
                ">Time Trial</button>
                <button class="fallback-mode-btn" data-mode="survival" style="
                    background: #0ff;
                    color: #000;
                    border: none;
                    padding: 15px;
                    font-size: 16px;
                    font-family: 'Courier New', monospace;
                    font-weight: bold;
                    cursor: pointer;
                    border-radius: 4px;
                ">Survival</button>
            </div>
        `;

        const buttons = fallback.querySelectorAll('.fallback-mode-btn');
        buttons.forEach(
            /** @param {HTMLElement} btn */ (btn) => {
                btn.addEventListener('mouseenter', () => {
                    btn.style.background = '#0cc';
                });
                btn.addEventListener('mouseleave', () => {
                    btn.style.background = '#0ff';
                });
                btn.addEventListener('click', () => {
                    const mode = btn.getAttribute('data-mode');
                    fallback.remove();
                    onModeSelected(mode);
                });
            }
        );

        return fallback;
    }

    /**
     * Attempt to recover from mode selector error
     * @param {Function} onModeSelected - Callback when mode is selected
     * @returns {boolean} True if fallback created
     */
    recoverFromModeSelectorError(onModeSelected) {
        try {
            const fallback = this.createFallbackModeSelector(onModeSelected);
            document.body.appendChild(fallback);
            logger.info('Fallback mode selector created');
            return true;
        } catch (error) {
            logger.error('Failed to create fallback mode selector:', error);
            return false;
        }
    }

    /**
     * Reset retry counters
     */
    reset() {
        this.domRetryCount = 0;
    }
}

module.exports = { ErrorRecoveryStrategies };
