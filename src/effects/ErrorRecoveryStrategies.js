const { createLogger } = require('../utils/Logger.js');
const logger = createLogger('ErrorRecoveryStrategies');

/**
 * ErrorRecoveryStrategies - Handles recovery logic for camera effects errors
 *
 * Extracts recovery strategies and their execution from CameraEffectsErrorHandler
 * to separate concerns and improve maintainability.
 */
class ErrorRecoveryStrategies {
    constructor() {
        // Component references
        this.cameraEffectsManager = null;
        this.degradationManager = null;
        this.motionBlurController = null;
        this.shakeController = null;

        // Recovery strategies definition
        this.strategies = {
            webgl: [
                'reduceQuality',
                'disableMotionBlur',
                'disablePostProcessing',
                'fallbackRendering',
            ],
            postProcessing: [
                'recreateComposer',
                'simplifyShaders',
                'disableMotionBlur',
                'fallbackRendering',
            ],
            memory: ['clearCaches', 'reduceQuality', 'forceGarbageCollection', 'disableEffects'],
            shader: [
                'recompileShaders',
                'useSimpleShaders',
                'disableMotionBlur',
                'fallbackRendering',
            ],
        };
    }

    /**
     * Initialize with component references
     * @param {Object} components - Component references
     */
    initialize(components) {
        this.cameraEffectsManager = components.cameraEffectsManager;
        this.degradationManager = components.degradationManager;
        this.motionBlurController = components.motionBlurController;
        this.shakeController = components.shakeController;
    }

    /**
     * Get strategies for a specific error type
     * @param {string} errorType - Type of error
     * @returns {Array<string>} List of strategies
     */
    getStrategiesForType(errorType) {
        return this.strategies[errorType] || [];
    }

    /**
     * Execute a specific recovery strategy
     * @param {string} strategy - Recovery strategy name
     * @returns {boolean} Success status
     */
    executeStrategy(strategy) {
        switch (strategy) {
            case 'reduceQuality':
                return this.reduceQuality();

            case 'disableMotionBlur':
                return this.disableMotionBlur('Recovery strategy');

            case 'disablePostProcessing':
                return this.disablePostProcessing();

            case 'fallbackRendering':
                return this.enterFallbackMode('Recovery strategy');

            case 'recreateComposer':
                return this.recreateComposer();

            case 'simplifyShaders':
                return this.simplifyShaders();

            case 'clearCaches':
                return this.clearCaches();

            case 'forceGarbageCollection':
                return this.forceGarbageCollection();

            case 'recompileShaders':
                return this.recompileShaders();

            case 'useSimpleShaders':
                return this.useSimpleShaders();

            case 'disableEffects':
                return this.disableAllEffects('Recovery strategy');

            default:
                logger.warn(`Unknown recovery strategy: ${strategy}`);
                return false;
        }
    }

    /**
     * Reduce quality as recovery strategy
     * @returns {boolean} Success status
     */
    reduceQuality() {
        try {
            if (this.degradationManager) {
                const currentLevel = this.degradationManager.getDegradationState().level;
                if (currentLevel < 2) {
                    this.degradationManager.setDegradationLevel(currentLevel + 1);
                    return true;
                }
            }

            if (this.motionBlurController) {
                const currentQuality = this.motionBlurController.getCurrentQuality();
                if (currentQuality === 'high') {
                    this.motionBlurController.setQuality('medium');
                    return true;
                } else if (currentQuality === 'medium') {
                    this.motionBlurController.setQuality('low');
                    return true;
                }
            }

            return false;
        } catch (error) {
            logger.error('Failed to reduce quality', error);
            return false;
        }
    }

    /**
     * Disable motion blur as recovery strategy
     * @param {string} reason - Reason for disabling
     * @returns {boolean} Success status
     */
    disableMotionBlur(reason) {
        try {
            if (this.motionBlurController) {
                this.motionBlurController.setEnabled(false);
                logger.info(`Motion blur disabled: ${reason}`);
                return true;
            }
            return false;
        } catch (error) {
            logger.error('Failed to disable motion blur', error);
            return false;
        }
    }

    /**
     * Disable post-processing as recovery strategy
     * @returns {boolean} Success status
     */
    disablePostProcessing() {
        try {
            if (this.motionBlurController) {
                this.motionBlurController.setEnabled(false);
                logger.info('Post-processing disabled for recovery');
                return true;
            }
            return false;
        } catch (error) {
            logger.error('Failed to disable post-processing', error);
            return false;
        }
    }

    /**
     * Enter fallback mode
     * @param {string} reason - Reason for fallback
     * @returns {boolean} Success status
     */
    enterFallbackMode(reason) {
        try {
            if (this.motionBlurController) {
                this.motionBlurController.setEnabled(false);
            }

            if (this.degradationManager) {
                this.degradationManager.setDegradationLevel(2); // Shake only
            }

            logger.info(`Entered fallback mode: ${reason}`);
            return true;
        } catch (error) {
            logger.error('Failed to enter fallback mode', error);
            return false;
        }
    }

    /**
     * Disable all effects
     * @param {string} reason - Reason for disabling
     * @returns {boolean} Success status
     */
    disableAllEffects(reason) {
        try {
            if (this.cameraEffectsManager) {
                this.cameraEffectsManager.setEnabled(false);
            }

            if (this.degradationManager) {
                this.degradationManager.setDegradationLevel(3); // All disabled
            }

            logger.info(`All camera effects disabled: ${reason}`);
            return true;
        } catch (error) {
            logger.error('Failed to disable all effects', error);
            return false;
        }
    }

    /**
     * Recreate effect composer
     * @returns {boolean} Success status
     */
    recreateComposer() {
        try {
            if (
                this.motionBlurController &&
                typeof this.motionBlurController.initialize === 'function'
            ) {
                return this.motionBlurController.initialize();
            }
            return false;
        } catch (error) {
            logger.error('Failed to recreate composer', error);
            return false;
        }
    }

    /**
     * Simplify shaders
     * @returns {boolean} Success status
     */
    simplifyShaders() {
        try {
            if (this.motionBlurController) {
                this.motionBlurController.setQuality('low');
                return true;
            }
            return false;
        } catch (error) {
            logger.error('Failed to simplify shaders', error);
            return false;
        }
    }

    /**
     * Clear caches
     * @returns {boolean} Success status
     */
    clearCaches() {
        try {
            if (
                this.motionBlurController &&
                typeof this.motionBlurController.resetPerformanceMetrics === 'function'
            ) {
                this.motionBlurController.resetPerformanceMetrics();
            }

            if (
                this.degradationManager &&
                typeof this.degradationManager.resetPerformanceMetrics === 'function'
            ) {
                this.degradationManager.resetPerformanceMetrics();
            }

            return true;
        } catch (error) {
            logger.error('Failed to clear caches', error);
            return false;
        }
    }

    /**
     * Force garbage collection
     * @returns {boolean} Success status
     */
    forceGarbageCollection() {
        try {
            if (typeof window !== 'undefined' && window.gc) {
                window.gc();
                logger.info('Forced garbage collection');
                return true;
            }
            return false;
        } catch (error) {
            logger.error('Failed to force garbage collection', error);
            return false;
        }
    }

    /**
     * Recompile shaders
     * @returns {boolean} Success status
     */
    recompileShaders() {
        // This would require access to shader compilation system
        // For now, just try to reinitialize motion blur
        return this.recreateComposer();
    }

    /**
     * Use simple shaders
     * @returns {boolean} Success status
     */
    useSimpleShaders() {
        return this.simplifyShaders();
    }
}

module.exports = { ErrorRecoveryStrategies };
