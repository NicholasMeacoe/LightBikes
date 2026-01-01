/**
 * RecoveryManager - Consolidated error handling and recovery system
 * Merges ErrorHandler, ErrorRecovery, and ErrorRecoveryStrategies into a unified interface
 * Provides error display, recovery mechanisms, and graceful degradation
 */
const { Logger } = require('../utils/Logger.js');
const {
    DOMNotReadyError,
    CanvasCreationError,
    ModeSelectorError,
} = require('../utils/InitializationErrors.js');

class RecoveryManager {
    constructor() {
        // Logger
        console.log('RecoveryManager: Logger class:', Logger);
        console.log('RecoveryManager: Logger.create:', Logger && Logger.create);
        this.logger = Logger.create('RecoveryManager');
        console.log('RecoveryManager: this.logger:', this.logger);

        // Error display state (from ErrorHandler)
        this.errorContainer = null;
        this.activeErrors = new Map();
        this.errorCount = 0;
        this.maxRetries = 3;
        this.retryAttempts = new Map();
        this.initialized = false;

        // Recovery state (from ErrorRecovery)
        this.recoveryStrategies = new Map();
        this.failedComponents = new Set();
        this.fallbackMode = false;
        this.disabledFeatures = new Set();

        // Recovery strategies state (from ErrorRecoveryStrategies)
        this.maxDOMRetries = 3;
        this.domRetryDelay = 500; // ms
        this.domRetryCount = 0;
    }

    // ==================== INITIALIZATION (from ErrorHandler) ====================

    /**
     * Initialize the recovery manager
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

    // ==================== ERROR DISPLAY (from ErrorHandler) ====================

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
    showError(message, options = /** @type {any} */ ({})) {
        if (!this.initialized) {
            this.init();
        }

        const {
            type = 'error',
            title = this.getDefaultTitle(type),
            duration = type === 'critical' ? 0 : 5000,
            actions = [],
            id = `error-${this.errorCount++}`,
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
            actions.forEach((action) => {
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
        /** @type {HTMLElement} */
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
        const logMsg = `[${type.toUpperCase()}] ${title}: ${message}`;
        if (type === 'info') {
            this.logger.info(logMsg);
        } else if (type === 'warning') {
            this.logger.warn(logMsg);
        } else {
            this.logger.error(logMsg);
        }

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
            critical: 'Critical Error',
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
     * Show a warning message
     * @param {string} message - Warning message
     * @param {Object} options - Warning options
     * @returns {string} Error ID
     */
    showWarning(message, options = {}) {
        return this.showError(message, {
            ...options,
            type: 'warning',
            duration: options.duration || 5000,
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
            duration: options.duration || 4000,
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

    // ==================== SPECIALIZED ERROR HANDLERS (from ErrorHandler) ====================

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
                primary: true,
            });
        }

        // Add reload button
        actions.push({
            label: 'Reload Page',
            callback: () => window.location.reload(),
        });

        return this.showError(`Failed to initialize ${componentName}: ${error.message}`, {
            type: attempts >= this.maxRetries ? 'critical' : 'error',
            title: `${componentName} Initialization Failed`,
            duration: 0,
            actions,
            id: errorId,
        });
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
                        callback: () => window.open('https://get.webgl.org/', '_blank'),
                    },
                ],
                id: 'webgl-error',
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
                primary: true,
            });
        }

        return this.showError(
            `Rendering error: ${error.message}. Try using simplified graphics mode.`,
            {
                type: 'error',
                title: 'Rendering Error',
                duration: 0,
                actions,
                id: 'rendering-error',
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
                primary: true,
            });
        }

        return this.showError(
            `${featureName} encountered an error and may not work correctly: ${error.message}`,
            {
                type: 'warning',
                title: `${featureName} Error`,
                duration: 8000,
                actions,
                id: `feature-${featureName}`,
            }
        );
    }

    // ==================== RECOVERY STRATEGIES (from ErrorRecovery) ====================

    /**
     * Register a recovery strategy for a component
     * @param {string} componentName - Name of the component
     * @param {Object} strategy - Recovery strategy
     * @param {Function} strategy.initialize - Initialization function
     * @param {Function} strategy.fallback - Fallback function (optional)
     * @param {boolean} strategy.critical - Whether component is critical
     * @param {number} strategy.maxRetries - Maximum retry attempts
     */
    registerStrategy(componentName, strategy) {
        this.recoveryStrategies.set(componentName, {
            initialize: strategy.initialize,
            fallback: strategy.fallback || null,
            critical: strategy.critical !== false,
            maxRetries: strategy.maxRetries || 3,
            retryCount: 0,
        });
    }

    /**
     * Initialize a component with error recovery
     * @param {string} componentName - Name of the component
     * @returns {Promise<any>} Initialized component or null
     */
    async initializeWithRecovery(componentName) {
        const strategy = this.recoveryStrategies.get(componentName);

        if (!strategy) {
            throw new Error(`No recovery strategy registered for ${componentName}`);
        }

        try {
            const component = await strategy.initialize();

            // Reset retry count on success
            strategy.retryCount = 0;
            this.failedComponents.delete(componentName);

            return component;
        } catch (error) {
            this.logger.error(`Failed to initialize ${componentName}:`, error);

            // Track failed component
            this.failedComponents.add(componentName);

            // Attempt recovery
            return await this.attemptRecovery(componentName, error, strategy);
        }
    }

    /**
     * Attempt to recover from initialization failure
     * @param {string} componentName - Name of the component
     * @param {Error} error - Error that occurred
     * @param {Object} strategy - Recovery strategy
     * @returns {Promise<any>} Recovered component or null
     */
    async attemptRecovery(componentName, error, strategy) {
        strategy.retryCount++;

        // Check if we should retry
        if (strategy.retryCount < strategy.maxRetries) {
            // Show error with retry option
            this.handleInitializationError(
                error,
                () => this.retryInitialization(componentName),
                componentName
            );

            // Wait before retry
            await this.delay(1000 * strategy.retryCount);

            // Retry initialization
            return await this.retryInitialization(componentName);
        }

        // Max retries reached - try fallback
        if (strategy.fallback) {
            this.logger.warn(`Using fallback for ${componentName}`);

            try {
                const fallbackComponent = await strategy.fallback();
                this.fallbackMode = true;

                this.showWarning(
                    `${componentName} is running in simplified mode due to initialization errors.`,
                    { duration: 8000 }
                );

                return fallbackComponent;
            } catch (fallbackError) {
                this.logger.error(`Fallback failed for ${componentName}:`, fallbackError);
            }
        }

        // No fallback or fallback failed
        if (strategy.critical) {
            // Critical component - show critical error
            this.handleInitializationError(error, null, componentName);
            throw error;
        } else {
            // Non-critical component - disable feature
            this.disableFeature(componentName);
            return null;
        }
    }

    /**
     * Retry initialization for a component
     * @param {string} componentName - Name of the component
     * @returns {Promise<any>} Initialized component
     */
    async retryInitialization(componentName) {
        const strategy = this.recoveryStrategies.get(componentName);

        if (!strategy) {
            throw new Error(`No recovery strategy registered for ${componentName}`);
        }

        try {
            const component = await strategy.initialize();

            // Reset retry count on success
            strategy.retryCount = 0;
            this.failedComponents.delete(componentName);

            // Reset error handler retries
            this.resetRetries(componentName);

            this.showInfo(`${componentName} initialized successfully.`, { duration: 3000 });

            return component;
        } catch (error) {
            this.logger.error(`Retry failed for ${componentName}:`, error);
            return await this.attemptRecovery(componentName, error, strategy);
        }
    }

    /**
     * Disable a non-critical feature
     * @param {string} featureName - Name of the feature to disable
     */
    disableFeature(featureName) {
        this.disabledFeatures.add(featureName);

        this.showWarning(
            `${featureName} has been disabled due to errors. The game will continue without this feature.`,
            { duration: 8000 }
        );

        this.logger.warn(`Feature disabled: ${featureName}`);
    }

    /**
     * Check if a feature is disabled
     * @param {string} featureName - Name of the feature
     * @returns {boolean} True if disabled
     */
    isFeatureDisabled(featureName) {
        return this.disabledFeatures.has(featureName);
    }

    /**
     * Enable a previously disabled feature
     * @param {string} featureName - Name of the feature
     */
    enableFeature(featureName) {
        this.disabledFeatures.delete(featureName);
        this.logger.info(`Feature enabled: ${featureName}`);
    }

    /**
     * Check if in fallback mode
     * @returns {boolean} True if in fallback mode
     */
    isInFallbackMode() {
        return this.fallbackMode;
    }

    /**
     * Get list of failed components
     * @returns {Array<string>} Array of component names
     */
    getFailedComponents() {
        return Array.from(this.failedComponents);
    }

    /**
     * Get list of disabled features
     * @returns {Array<string>} Array of feature names
     */
    getDisabledFeatures() {
        return Array.from(this.disabledFeatures);
    }

    /**
     * Delay helper for retry logic
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Handle rendering errors with fallback to simple mode
     * @param {Error} error - Rendering error
     * @param {Function} simplifiedRenderer - Simplified rendering function
     * @returns {boolean} True if fallback successful
     */
    handleRenderingErrorWithFallback(error, simplifiedRenderer) {
        this.logger.error('Rendering error:', error);

        if (simplifiedRenderer) {
            try {
                simplifiedRenderer();
                this.fallbackMode = true;

                this.handleRenderingError(error, () => {
                    simplifiedRenderer();
                    this.showInfo('Switched to simplified graphics mode.', { duration: 3000 });
                });

                return true;
            } catch (fallbackError) {
                this.logger.error('Simplified renderer also failed:', fallbackError);
                this.showError('Unable to initialize graphics. Please reload the page.', {
                    type: 'critical',
                    duration: 0,
                });
                return false;
            }
        }

        this.handleRenderingError(error, null);
        return false;
    }

    /**
     * Handle feature runtime errors
     * @param {string} featureName - Name of the feature
     * @param {Error} error - Error that occurred
     * @param {Function} disableCallback - Function to disable the feature
     */
    handleFeatureRuntimeError(featureName, error, disableCallback) {
        this.logger.error(`Runtime error in ${featureName}:`, error);

        // Check if feature is already disabled
        if (this.isFeatureDisabled(featureName)) {
            return;
        }

        // Show error with option to disable
        this.handleFeatureError(featureName, error, () => {
            if (disableCallback) {
                disableCallback();
            }
            this.disableFeature(featureName);
        });
    }

    /**
     * Wrap a function with error recovery
     * @param {Function} fn - Function to wrap
     * @param {string} featureName - Name of the feature
     * @param {Function} fallback - Fallback function (optional)
     * @returns {Function} Wrapped function
     */
    wrapWithRecovery(fn, featureName, fallback = null) {
        return (...args) => {
            // Skip if feature is disabled
            if (this.isFeatureDisabled(featureName)) {
                if (fallback) {
                    return fallback(...args);
                }
                return null;
            }

            try {
                return fn(...args);
            } catch (error) {
                this.logger.error(`Error in ${featureName}:`, error);

                // Use fallback if available
                if (fallback) {
                    try {
                        return fallback(...args);
                    } catch (fallbackError) {
                        this.logger.error(
                            `Fallback also failed for ${featureName}:`,
                            fallbackError
                        );
                    }
                }

                // Disable feature after error
                this.handleFeatureRuntimeError(featureName, error, null);
                return null;
            }
        };
    }

    /**
     * Create a safe update loop wrapper
     * @param {Function} updateFn - Update function
     * @param {string} componentName - Component name
     * @returns {Function} Safe update function
     */
    createSafeUpdateLoop(updateFn, componentName) {
        let errorCount = 0;
        const maxErrors = 5;
        const errorWindow = 10000; // 10 seconds
        let errorTimestamps = [];

        return (...args) => {
            try {
                // Check if feature is disabled
                if (this.isFeatureDisabled(componentName)) {
                    return;
                }

                updateFn(...args);

                // Reset error count on successful update
                if (errorCount > 0) {
                    errorCount = 0;
                    errorTimestamps = [];
                }
            } catch (error) {
                const now = Date.now();
                errorTimestamps.push(now);

                // Remove old timestamps outside the error window
                errorTimestamps = errorTimestamps.filter(
                    (timestamp) => now - timestamp < errorWindow
                );

                errorCount = errorTimestamps.length;

                this.logger.error(`Error in ${componentName} update:`, error);

                // Disable feature if too many errors
                if (errorCount >= maxErrors) {
                    const error = new Error(`Too many errors (${errorCount} in ${errorWindow}ms)`);
                    this.logger.error(`Disabling ${componentName} due to excessive errors:`, error);
                    this.disableFeature(componentName);
                }
            }
        };
    }

    // ==================== RECOVERY STRATEGIES (from ErrorRecoveryStrategies) ====================

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
        this.logger.info(
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
            this.logger.info('Fallback mode selector created');
            return true;
        } catch (error) {
            this.logger.error('Failed to create fallback mode selector:', error);
            return false;
        }
    }

    // ==================== STATE MANAGEMENT ====================

    /**
     * Reset recovery state
     */
    reset() {
        this.failedComponents.clear();
        this.disabledFeatures.clear();
        this.fallbackMode = false;
        this.domRetryCount = 0;

        // Reset retry counts
        this.recoveryStrategies.forEach((strategy) => {
            strategy.retryCount = 0;
        });
    }

    /**
     * Get recovery status report
     * @returns {Object} Status report
     */
    getStatus() {
        return {
            fallbackMode: this.fallbackMode,
            failedComponents: this.getFailedComponents(),
            disabledFeatures: this.getDisabledFeatures(),
            registeredStrategies: Array.from(this.recoveryStrategies.keys()),
        };
    }
}

module.exports = { RecoveryManager };
