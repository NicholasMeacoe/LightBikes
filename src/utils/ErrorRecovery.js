/**
 * ErrorRecovery - Error recovery mechanisms for game initialization and runtime
 * Provides retry logic, fallback modes, and graceful degradation
 */
const { Logger } = require('./Logger');

class ErrorRecovery {
    constructor(errorHandler) {
        this.errorHandler = errorHandler;
        this.logger = Logger.create ? Logger.create('ErrorRecovery') : new Logger('ErrorRecovery');
        this.recoveryStrategies = new Map();
        this.failedComponents = new Set();
        this.fallbackMode = false;
        this.disabledFeatures = new Set();
    }

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
            this.errorHandler.handleInitializationError(
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

                this.errorHandler.showWarning(
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
            this.errorHandler.handleInitializationError(error, null, componentName);
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
            this.errorHandler.resetRetries(componentName);

            this.errorHandler.showInfo(`${componentName} initialized successfully.`, {
                duration: 3000,
            });

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

        this.errorHandler.showWarning(
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
    handleRenderingError(error, simplifiedRenderer) {
        this.logger.error('Rendering error:', error);

        if (simplifiedRenderer) {
            try {
                simplifiedRenderer();
                this.fallbackMode = true;

                this.errorHandler.handleRenderingError(error, () => {
                    simplifiedRenderer();
                    this.errorHandler.showInfo('Switched to simplified graphics mode.', {
                        duration: 3000,
                    });
                });

                return true;
            } catch (fallbackError) {
                this.logger.error('Simplified renderer also failed:', fallbackError);
                this.errorHandler.showError(
                    'Unable to initialize graphics. Please reload the page.',
                    { type: 'critical', duration: 0 }
                );
                return false;
            }
        }

        this.errorHandler.handleRenderingError(error, null);
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
        this.errorHandler.handleFeatureError(featureName, error, () => {
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

    /**
     * Reset recovery state
     */
    reset() {
        this.failedComponents.clear();
        this.disabledFeatures.clear();
        this.fallbackMode = false;

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

module.exports = { ErrorRecovery };
