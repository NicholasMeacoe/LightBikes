/**
 * CompatibilityWarningUI.js
 * UI component for displaying browser compatibility warnings
 */

class CompatibilityWarningUI {
    constructor() {
        this.warningElement = null;
        this.isVisible = false;
    }

    /**
     * Show compatibility warning with details
     * @param {Object} compatibilityReport - Report from BrowserCompatibility
     */
    showWarning(compatibilityReport) {
        if (this.warningElement) {
            this.hide();
        }

        this.warningElement = document.createElement('div');
        this.warningElement.id = 'compatibility-warning';
        this.warningElement.className = 'compatibility-warning';

        // Provide safe defaults for potentially null values
        const browserInfo = compatibilityReport.browserInfo || {
            name: 'Unknown',
            version: 'Unknown',
        };
        const errors = compatibilityReport.errors || [];
        const warnings = compatibilityReport.warnings || [];

        // Build warning content
        let content = `
            <div class="compatibility-warning-content">
                <div class="compatibility-warning-header">
                    <h2>⚠ Browser Compatibility Warning</h2>
                    <button class="compatibility-close-btn" id="compatibilityCloseBtn">×</button>
                </div>
                <div class="compatibility-warning-body">
                    <p class="browser-info">
                        <strong>Detected Browser:</strong> ${browserInfo.name} ${browserInfo.version}
                    </p>
        `;

        // Add critical errors
        if (errors.length > 0) {
            content += `
                <div class="compatibility-errors">
                    <h3>Critical Issues:</h3>
                    <ul>
                        ${errors.map((error) => `<li>${error}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        // Add warnings
        if (warnings.length > 0) {
            content += `
                <div class="compatibility-warnings">
                    <h3>Warnings:</h3>
                    <ul>
                        ${warnings.map((warning) => `<li>${warning}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        // Add recommended browsers
        content += `
                    <div class="compatibility-recommendations">
                        <h3>Recommended Browsers:</h3>
                        <ul class="browser-list">
                            <li>Chrome 90+ <a href="https://www.google.com/chrome/" target="_blank" rel="noopener">Download</a></li>
                            <li>Firefox 88+ <a href="https://www.mozilla.org/firefox/" target="_blank" rel="noopener">Download</a></li>
                            <li>Safari 14+ <a href="https://www.apple.com/safari/" target="_blank" rel="noopener">Learn More</a></li>
                            <li>Edge 90+ <a href="https://www.microsoft.com/edge" target="_blank" rel="noopener">Download</a></li>
                        </ul>
                    </div>
        `;

        // Add action buttons
        if (errors.length === 0) {
            // Only warnings - allow user to continue
            content += `
                    <div class="compatibility-actions">
                        <button class="compatibility-btn compatibility-btn-primary" id="compatibilityContinueBtn">
                            Continue Anyway
                        </button>
                        <p class="compatibility-disclaimer">
                            Some features may not work correctly.
                        </p>
                    </div>
            `;
        } else {
            // Critical errors - don't allow continuation
            content += `
                    <div class="compatibility-actions">
                        <p class="compatibility-error-message">
                            The game cannot run without these critical features.
                            Please upgrade your browser or try a different one.
                        </p>
                    </div>
            `;
        }

        content += `
                </div>
            </div>
        `;

        this.warningElement.innerHTML = content;

        // Add styles
        this.addStyles();

        // Append to body
        document.body.appendChild(this.warningElement);

        // Set up event listeners
        this.setupEventListeners(errors.length === 0);

        this.isVisible = true;
    }

    /**
     * Show a simple error message for critical failures
     * @param {string} message - Error message
     */
    showCriticalError(message) {
        if (this.warningElement) {
            this.hide();
        }

        this.warningElement = document.createElement('div');
        this.warningElement.id = 'compatibility-warning';
        this.warningElement.className = 'compatibility-warning compatibility-critical';

        this.warningElement.innerHTML = `
            <div class="compatibility-warning-content">
                <div class="compatibility-warning-header">
                    <h2>❌ Critical Error</h2>
                </div>
                <div class="compatibility-warning-body">
                    <p class="compatibility-error-message">${message}</p>
                    <div class="compatibility-recommendations">
                        <h3>Recommended Browsers:</h3>
                        <ul class="browser-list">
                            <li>Chrome 90+ <a href="https://www.google.com/chrome/" target="_blank" rel="noopener">Download</a></li>
                            <li>Firefox 88+ <a href="https://www.mozilla.org/firefox/" target="_blank" rel="noopener">Download</a></li>
                            <li>Safari 14+ <a href="https://www.apple.com/safari/" target="_blank" rel="noopener">Learn More</a></li>
                            <li>Edge 90+ <a href="https://www.microsoft.com/edge" target="_blank" rel="noopener">Download</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        `;

        this.addStyles();
        document.body.appendChild(this.warningElement);
        this.isVisible = true;
    }

    /**
     * Set up event listeners for warning UI
     * @param {boolean} allowContinue - Whether to allow user to continue
     */
    setupEventListeners(allowContinue) {
        const closeBtn = document.getElementById('compatibilityCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }

        if (allowContinue) {
            const continueBtn = document.getElementById('compatibilityContinueBtn');
            if (continueBtn) {
                continueBtn.addEventListener('click', () => {
                    this.hide();
                    // Store user's decision to not show again this session
                    sessionStorage.setItem('lightbikes_compatibility_acknowledged', 'true');
                });
            }
        }
    }

    /**
     * Hide the warning UI
     */
    hide() {
        if (this.warningElement && this.warningElement.parentNode) {
            this.warningElement.parentNode.removeChild(this.warningElement);
        }
        this.warningElement = null;
        this.isVisible = false;
    }

    /**
     * Check if warning is currently visible
     * @returns {boolean}
     */
    isShowing() {
        return this.isVisible;
    }

    /**
     * Add CSS styles for compatibility warning UI
     */
    addStyles() {
        // Check if styles already exist
        if (document.getElementById('compatibility-warning-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'compatibility-warning-styles';
        style.textContent = `
            .compatibility-warning {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: Arial, sans-serif;
                animation: fadeIn 0.3s ease-in-out;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .compatibility-warning-content {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 3px solid #ff6b6b;
                border-radius: 15px;
                max-width: 600px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 10px 40px rgba(255, 107, 107, 0.3);
            }

            .compatibility-critical .compatibility-warning-content {
                border-color: #ff0000;
                box-shadow: 0 10px 40px rgba(255, 0, 0, 0.5);
            }

            .compatibility-warning-header {
                background: rgba(255, 107, 107, 0.2);
                padding: 20px;
                border-bottom: 2px solid #ff6b6b;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .compatibility-warning-header h2 {
                margin: 0;
                color: #ff6b6b;
                font-size: 1.8em;
                text-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
            }

            .compatibility-close-btn {
                background: none;
                border: none;
                color: #ffffff;
                font-size: 2em;
                cursor: pointer;
                padding: 0;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.3s ease;
            }

            .compatibility-close-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                transform: rotate(90deg);
            }

            .compatibility-warning-body {
                padding: 25px;
                color: #ffffff;
            }

            .browser-info {
                background: rgba(255, 255, 255, 0.05);
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
                border-left: 4px solid #4ecdc4;
            }

            .compatibility-errors,
            .compatibility-warnings {
                margin: 20px 0;
            }

            .compatibility-errors h3 {
                color: #ff6b6b;
                margin: 0 0 10px 0;
                font-size: 1.2em;
            }

            .compatibility-warnings h3 {
                color: #ffd93d;
                margin: 0 0 10px 0;
                font-size: 1.2em;
            }

            .compatibility-errors ul,
            .compatibility-warnings ul {
                margin: 0;
                padding-left: 20px;
            }

            .compatibility-errors li {
                color: #ffb3b3;
                margin: 8px 0;
                line-height: 1.5;
            }

            .compatibility-warnings li {
                color: #ffe699;
                margin: 8px 0;
                line-height: 1.5;
            }

            .compatibility-recommendations {
                margin: 20px 0;
                background: rgba(78, 205, 196, 0.1);
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid #4ecdc4;
            }

            .compatibility-recommendations h3 {
                color: #4ecdc4;
                margin: 0 0 15px 0;
                font-size: 1.2em;
            }

            .browser-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .browser-list li {
                padding: 10px;
                margin: 8px 0;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 5px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: background 0.3s ease;
            }

            .browser-list li:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            .browser-list a {
                color: #4ecdc4;
                text-decoration: none;
                font-weight: bold;
                padding: 5px 15px;
                border: 1px solid #4ecdc4;
                border-radius: 5px;
                transition: all 0.3s ease;
            }

            .browser-list a:hover {
                background: #4ecdc4;
                color: #1a1a2e;
            }

            .compatibility-actions {
                margin-top: 25px;
                text-align: center;
            }

            .compatibility-btn {
                padding: 12px 30px;
                font-size: 1.1em;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s ease;
                font-family: Arial, sans-serif;
            }

            .compatibility-btn-primary {
                background: linear-gradient(135deg, #4ecdc4 0%, #44a8a0 100%);
                color: #1a1a2e;
                box-shadow: 0 4px 15px rgba(78, 205, 196, 0.3);
            }

            .compatibility-btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(78, 205, 196, 0.4);
            }

            .compatibility-disclaimer {
                margin-top: 15px;
                color: #ffd93d;
                font-size: 0.9em;
                font-style: italic;
            }

            .compatibility-error-message {
                color: #ffb3b3;
                font-size: 1.1em;
                line-height: 1.6;
                text-align: center;
                padding: 20px;
                background: rgba(255, 107, 107, 0.1);
                border-radius: 8px;
                border: 1px solid rgba(255, 107, 107, 0.3);
            }

            @media (max-width: 768px) {
                .compatibility-warning-content {
                    width: 95%;
                    max-height: 95vh;
                }

                .compatibility-warning-header {
                    padding: 15px;
                }

                .compatibility-warning-header h2 {
                    font-size: 1.4em;
                }

                .compatibility-warning-body {
                    padding: 15px;
                }

                .browser-list li {
                    flex-direction: column;
                    gap: 10px;
                    text-align: center;
                }

                .compatibility-btn {
                    padding: 10px 20px;
                    font-size: 1em;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CompatibilityWarningUI };
}
