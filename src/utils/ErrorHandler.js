/**
 * ErrorHandler - Comprehensive error display and recovery system
 * Provides user-friendly error messages and recovery mechanisms
 */
class ErrorHandler {
    constructor() {
        this.errorContainer = null;
        this.activeErrors = new Map();
        this.errorCount = 0;
        this.maxRetries = 3;
        this.retryAttempts = new Map();
        this.initialized = false;
    }

    /**
     * Initialize the error handler
     */
    init() {
        if (this.initialized) return;
        
        this.createErrorContainer();
        this.addStyles();
        this.initialized = true;
    }

    /**
     * Create the error container element
     */
    createErrorContainer() {
        this.errorContainer = document.createElement('div');
        this.errorContainer.id = 'error-container';
        this.errorContainer.className = 'error-container';
        document.body.appendChild(this.errorContainer);
    }

    /**
     * Add CSS styles for error display
     */
    addStyles() {
        if (document.getElementById('error-handler-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'error-handler-styles';
        style.textContent = `
            .error-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                pointer-events: none;
            }

            .error-message {
                background: rgba(220, 53, 69, 0.95);
                color: white;
                padding: 16px 20px;
                border-radius: 8px;
                margin-bottom: 10px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                font-family: 'Courier New', monospace;
                font-size: 14px;
                line-height: 1.5;
                pointer-events: auto;
                animation: slideIn 0.3s ease-out;
                border-left: 4px solid #dc3545;
            }

            .error-message.warning {
                background: rgba(255, 193, 7, 0.95);
                color: #333;
                border-left-color: #ffc107;
            }

            .error-message.info {
                background: rgba(23, 162, 184, 0.95);
                color: white;
                border-left-color: #17a2b8;
            }

            .error-message.critical {
                background: rgba(139, 0, 0, 0.95);
                border-left-color: #8b0000;
                font-weight: bold;
            }

            .error-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }

            .error-title {
                font-weight: bold;
                font-size: 16px;
            }

            .error-close {
                background: none;
                border: none;
                color: inherit;
                font-size: 20px;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0.7;
                transition: opacity 0.2s;
            }

            .error-close:hover {
                opacity: 1;
            }

            .error-body {
                margin-bottom: 8px;
            }

            .error-actions {
                display: flex;
                gap: 8px;
                margin-top: 12px;
            }

            .error-action-btn {
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.4);
                color: inherit;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                transition: background 0.2s;
            }

            .error-action-btn:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            .error-action-btn.primary {
                background: rgba(255, 255, 255, 0.9);
                color: #333;
            }

            .error-action-btn.primary:hover {
                background: rgba(255, 255, 255, 1);
            }

            @keyframes slideIn {
                from {
                    transform: translateX(120%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(120%);
                    opacity: 0;
                }
            }

            .error-message.removing {
                animation: slideOut 0.3s ease-in forwards;
            }

            @media (max-width: 768px) {
                .error-container {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }

                .error-message {
                    padding: 12px 16px;
                    font-size: 13px;
                }

                .error-title {
                    font-size: 14px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Show an error message to the user
     * @param {string} message - Error message to display
     * @param {Object} options - Error options
     * @param {string} options.type - Error type: 'error', 'warning', 'info', 'critical'
     * @param {string} options.title - Error title
     * @param {number} options.duration - Auto-dismiss duration in ms (0 = no auto-dismiss)
     * @param {Array} options.actions - Array of action buttons {label, callback, primary}
     * @param {string} options.id - Unique error ID for deduplication
     * @returns {string} Error ID
     */
    showError(message, options = {}) {
        if (!this.initialized) {
            this.init();
        }

        const {
            type = 'error',
            title = this.getDefaultTitle(type),
            duration = type === 'critical' ? 0 : 5000,
            actions = [],
            id = `error-${this.errorCount++}`
        } = options;

        // Prevent duplicate errors
        if (this.activeErrors.has(id)) {
            return id;
        }

        // Create error element
        const errorElement = document.createElement('div');
        errorElement.className = `error-message ${type}`;
        errorElement.dataset.errorId = id;

        // Build error HTML
        errorElement.innerHTML = `
            <div class="error-header">
                <div class="error-title">${this.escapeHtml(title)}</div>
                <button class="error-close" aria-label="Close">×</button>
            </div>
            <div class="error-body">${this.escapeHtml(message)}</div>
            ${actions.length > 0 ? '<div class="error-actions"></div>' : ''}
        `;

        // Add action buttons
        if (actions.length > 0) {
            const actionsContainer = errorElement.querySelector('.error-actions');
            actions.forEach(action => {
                const button = document.createElement('button');
                button.className = `error-action-btn ${action.primary ? 'primary' : ''}`;
                button.textContent = action.label;
                button.onclick = () => {
                    if (action.callback) {
                        action.callback();
                    }
                    this.dismissError(id);
                };
                actionsContainer.appendChild(button);
            });
        }

        // Add close button handler
        const closeButton = errorElement.querySelector('.error-close');
        closeButton.onclick = () => this.dismissError(id);

        // Add to container
        this.errorContainer.appendChild(errorElement);
        this.activeErrors.set(id, errorElement);

        // Auto-dismiss if duration is set
        if (duration > 0) {
            setTimeout(() => this.dismissError(id), duration);
        }

        // Log to console
        console.error(`[${type.toUpperCase()}] ${title}: ${message}`);

        return id;
    }

    /**
     * Dismiss an error message
     * @param {string} errorId - Error ID to dismiss
     */
    dismissError(errorId) {
        const errorElement = this.activeErrors.get(errorId);
        if (!errorElement) return;

        errorElement.classList.add('removing');
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.parentNode.removeChild(errorElement);
            }
            this.activeErrors.delete(errorId);
        }, 300);
    }

    /**
     * Clear all error messages
     */
    clearAll() {
        this.activeErrors.forEach((_, id) => this.dismissError(id));
    }

    /**
     * Get default title for error type
     * @param {string} type - Error type
     * @returns {string} Default title
     */
    getDefaultTitle(type) {
        const titles = {
            error: 'Error',
            warning: 'Warning',
            info: 'Information',
            critical: 'Critical Error'
        };
        return titles[type] || 'Error';
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Handle initialization errors with retry capability
     * @param {Error} error - Error object
     * @param {Function} retryCallback - Function to call on retry
     * @param {string} componentName - Name of component that failed
     * @returns {string} Error ID
     */
    handleInitializationError(error, retryCallback, componentName = 'Component') {
        const errorId = `init-${componentName}`;
        const attempts = this.retryAttempts.get(errorId) || 0;

        const actions = [];
        
        // Add retry button if under max retries
        if (attempts < this.maxRetries && retryCallback) {
            actions.push({
                label: `Retry (${this.maxRetries - attempts} left)`,
                callback: () => {
                    this.retryAttempts.set(errorId, attempts + 1);
                    retryCallback();
                },
                primary: true
            });
        }

        // Add reload button
        actions.push({
            label: 'Reload Page',
            callback: () => window.location.reload()
        });

        return this.showError(
            `Failed to initialize ${componentName}: ${error.message}`,
            {
                type: attempts >= this.maxRetries ? 'critical' : 'error',
                title: `${componentName} Initialization Failed`,
                duration: 0,
                actions,
                id: errorId
            }
        );
    }

    /**
     * Handle WebGL errors
     * @param {Error} error - Error object
     * @returns {string} Error ID
     */
    handleWebGLError(error) {
        return this.showError(
            'Your browser does not support WebGL or it is disabled. Please use a modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+) or enable WebGL in your browser settings.',
            {
                type: 'critical',
                title: 'WebGL Not Supported',
                duration: 0,
                actions: [
                    {
                        label: 'Learn More',
                        callback: () => window.open('https://get.webgl.org/', '_blank')
                    }
                ],
                id: 'webgl-error'
            }
        );
    }

    /**
     * Handle rendering errors with fallback
     * @param {Error} error - Error object
     * @param {Function} fallbackCallback - Fallback rendering function
     * @returns {string} Error ID
     */
    handleRenderingError(error, fallbackCallback) {
        const actions = [];
        
        if (fallbackCallback) {
            actions.push({
                label: 'Use Simple Graphics',
                callback: fallbackCallback,
                primary: true
            });
        }

        return this.showError(
            `Rendering error: ${error.message}. Try using simplified graphics mode.`,
            {
                type: 'error',
                title: 'Rendering Error',
                duration: 0,
                actions,
                id: 'rendering-error'
            }
        );
    }

    /**
     * Handle feature errors (non-critical)
     * @param {string} featureName - Name of the feature
     * @param {Error} error - Error object
     * @param {Function} disableCallback - Function to disable the feature
     * @returns {string} Error ID
     */
    handleFeatureError(featureName, error, disableCallback) {
        const actions = [];
        
        if (disableCallback) {
            actions.push({
                label: 'Disable Feature',
                callback: disableCallback,
                primary: true
            });
        }

        return this.showError(
            `${featureName} encountered an error and may not work correctly: ${error.message}`,
            {
                type: 'warning',
                title: `${featureName} Error`,
                duration: 8000,
                actions,
                id: `feature-${featureName}`
            }
        );
    }

    /**
     * Show a warning message
     * @param {string} message - Warning message
     * @param {Object} options - Warning options
     * @returns {string} Error ID
     */
    showWarning(message, options = {}) {
        return this.showError(message, {
            ...options,
            type: 'warning',
            duration: options.duration || 5000
        });
    }

    /**
     * Show an info message
     * @param {string} message - Info message
     * @param {Object} options - Info options
     * @returns {string} Error ID
     */
    showInfo(message, options = {}) {
        return this.showError(message, {
            ...options,
            type: 'info',
            duration: options.duration || 4000
        });
    }

    /**
     * Reset retry attempts for a component
     * @param {string} componentName - Component name
     */
    resetRetries(componentName) {
        this.retryAttempts.delete(`init-${componentName}`);
    }

    /**
     * Get number of retry attempts for a component
     * @param {string} componentName - Component name
     * @returns {number} Number of attempts
     */
    getRetryAttempts(componentName) {
        return this.retryAttempts.get(`init-${componentName}`) || 0;
    }
}

module.exports = { ErrorHandler };
