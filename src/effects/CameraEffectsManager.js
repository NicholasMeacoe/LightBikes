const { PerformanceDegradationManager } = require('../utils/PerformanceDegradationManager.js');
const { CameraEffectsErrorHandler } = require('./CameraEffectsErrorHandler.js');
const { CameraShakeController } = require('./CameraShakeController.js');
const { MotionBlurController } = require('./MotionBlurController.js');
const { createLogger } = require('../utils/Logger.js');
const logger = createLogger('CameraEffectsManager');

/**
 * CameraEffectsManager - Core camera effects infrastructure
 * Manages camera shake and motion blur effects for LightBikes
 * Integrates with existing RenderingEngine camera system
 */

class CameraEffectsManager {
    constructor(camera, renderer, gameState) {
        this.camera = camera;
        this.renderer = renderer;
        this.gameState = gameState;

        // Initialize subsystems
        this.shakeController = new CameraShakeController(camera);
        this.motionBlurController = new MotionBlurController(renderer);
        this.configManager = null; // Will be EffectsConfigManager

        // Error handling and performance management
        this.degradationManager = new PerformanceDegradationManager();
        this.errorHandler = new CameraEffectsErrorHandler();

        // Core state management
        this.enabled = true;
        this.initialized = false;
        this.lastUpdateTime = 0;

        // Event handler registry for collision and speed change notifications
        this.eventHandlers = {
            collision: [],
            nearMiss: [],
            speedChange: [],
        };

        // Integration state with RenderingEngine
        this.originalCameraPosition = null;
        this.originalUpdateCamera = null;

        // Performance monitoring
        this.performanceMetrics = {
            lastFrameTime: 0,
            averageFrameTime: 16.67, // 60fps baseline
            frameCount: 0,
        };

        // Effect pooling for performance optimization
        this.effectPool = {
            shakeInstances: [],
            maxPoolSize: 10,
        };

        // Current settings state
        this.settings = {};
    }

    /**
     * Initialize the camera effects system
     * Sets up integration points with existing RenderingEngine
     * @returns {boolean} Success status
     */
    initialize() {
        try {
            // Validate required dependencies
            if (!this.camera || !this.renderer) {
                logger.error('Missing required camera or renderer');
                return false;
            }

            // Initialize error handler first
            if (
                !this.errorHandler.initialize(
                    this,
                    this.degradationManager,
                    this.motionBlurController,
                    this.shakeController
                )
            ) {
                logger.warn(
                    'Error handler initialization failed, continuing without error handling'
                );
            }

            // Initialize Motion Blur Controller
            if (this.motionBlurController) {
                this.motionBlurController.initialize(this.errorHandler);
                if (this.gameState && this.gameState.speedTracker) {
                    this.motionBlurController.setSpeedTracker(this.gameState.speedTracker);
                }
            }

            // Initialize degradation manager
            if (
                !this.degradationManager.initialize(
                    this,
                    this.motionBlurController,
                    this.shakeController
                )
            ) {
                logger.warn(
                    'Degradation manager initialization failed, continuing with basic functionality'
                );
            }

            // Store original camera position for shake offset calculations
            this.originalCameraPosition = this.camera.position.clone();

            // Initialize performance tracking
            this.lastUpdateTime = performance.now();
            this.performanceMetrics.lastFrameTime = this.lastUpdateTime;

            this.initialized = true;
            logger.info('Successfully initialized with error handling and performance monitoring');
            return true;
        } catch (error) {
            logger.error('Initialization failed', error);

            // Handle initialization error through error handler
            if (this.errorHandler) {
                this.errorHandler.handleRuntimeError(error, 'CameraEffectsManager initialization');
            }

            this.initialized = false;
            return false;
        }
    }

    /**
     * Update camera effects system
     * Called from main game loop with delta time
     * @param {number} deltaTime - Time elapsed since last update in seconds
     */
    update(deltaTime) {
        if (!this.initialized || !this.enabled) {
            return;
        }

        try {
            // Update performance metrics
            this.updatePerformanceMetrics(deltaTime);

            // Update degradation manager for performance monitoring
            if (this.degradationManager) {
                this.degradationManager.update(deltaTime);

                // Check if effects should be enabled based on performance
                if (!this.degradationManager.shouldEnableEffects()) {
                    this.setEnabled(false);
                    return;
                }
            }

            // Update subsystems when they are implemented
            if (this.shakeController && this.degradationManager?.shouldEnableShake()) {
                this.shakeController.update(deltaTime);
            }

            // MotionBlurController updates are handled via onSpeedChange and render,
            // but we might need to update internal state if needed.
            // For now, we rely on onSpeedChange.

            // Apply camera effects to the rendering pipeline
            this.applyCameraEffects();
        } catch (error) {
            logger.error('Update error', error);

            // Handle error through error handler
            if (this.errorHandler) {
                this.errorHandler.handleRuntimeError(error, 'CameraEffectsManager update');
            } else {
                // Fallback: disable effects on error
                this.setEnabled(false);
            }
        }
    }

    /**
     * Handle collision events for camera shake
     * @param {Object} entity - Entity that collided
     * @param {number} intensity - Collision intensity (0.0 to 1.0)
     */
    onCollision(entity, intensity = 1.0) {
        if (!this.initialized || !this.enabled) {
            return;
        }

        try {
            // Validate parameters
            if (!entity || typeof intensity !== 'number') {
                logger.warn('Invalid collision parameters');
                return;
            }

            // Clamp intensity to valid range
            const clampedIntensity = Math.max(0.0, Math.min(1.0, intensity));

            // Notify registered event handlers
            this.notifyEventHandlers('collision', { entity, intensity: clampedIntensity });

            // Trigger shake effect
            if (this.shakeController) {
                this.shakeController.triggerCollisionShake(clampedIntensity);
            }

            // Log for debugging (will be removed in production)
            logger.debug(
                `Collision event - entity: ${entity.id || 'unknown'}, intensity: ${clampedIntensity}`
            );
        } catch (error) {
            logger.error('Collision handling error', error);
        }
    }

    /**
     * Handle near-miss events for subtle camera shake
     * @param {Object} entity - Entity that had near miss
     * @param {number} distance - Distance of near miss in game units
     */
    onNearMiss(entity, distance) {
        if (!this.initialized || !this.enabled) {
            return;
        }

        try {
            // Validate parameters
            if (!entity || typeof distance !== 'number') {
                logger.warn('Invalid near-miss parameters');
                return;
            }

            // Only process near misses within reasonable range (0-2 units)
            if (distance < 0 || distance > 2.0) {
                return;
            }

            // Notify registered event handlers
            this.notifyEventHandlers('nearMiss', { entity, distance });

            // Trigger shake effect
            if (this.shakeController) {
                this.shakeController.triggerNearMissShake(distance);
            }

            // Log for debugging (will be removed in production)
            logger.debug(
                `Near-miss event - entity: ${entity.id || 'unknown'}, distance: ${distance}`
            );
        } catch (error) {
            logger.error('Near-miss handling error', error);
        }
    }

    /**
     * Handle speed change events for motion blur
     * @param {Object} entity - Entity with speed change
     * @param {number} newSpeed - New speed value
     */
    onSpeedChange(entity, newSpeed) {
        if (!this.initialized || !this.enabled) {
            return;
        }

        try {
            // Validate parameters
            if (!entity || typeof newSpeed !== 'number') {
                logger.warn('Invalid speed change parameters');
                return;
            }

            // Only process reasonable speed values
            if (newSpeed < 0 || newSpeed > 10.0) {
                return;
            }

            // Notify registered event handlers
            this.notifyEventHandlers('speedChange', { entity, newSpeed });

            // Update motion blur
            if (this.motionBlurController) {
                this.motionBlurController.updateBlurIntensity(newSpeed);
            }

            // Log for debugging (will be removed in production)
            logger.debug(
                `Speed change event - entity: ${entity.id || 'unknown'}, speed: ${newSpeed}`
            );
        } catch (error) {
            logger.error('Speed change handling error', error);
        }
    }

    /**
     * Register event handler for camera effects events
     * @param {string} eventType - Type of event ('collision', 'nearMiss', 'speedChange')
     * @param {Function} handler - Event handler function
     */
    addEventListener(eventType, handler) {
        if (!this.eventHandlers[eventType]) {
            logger.warn(`Unknown event type: ${eventType}`);
            return;
        }

        if (typeof handler !== 'function') {
            logger.warn('Event handler must be a function');
            return;
        }

        this.eventHandlers[eventType].push(handler);
    }

    /**
     * Remove event handler
     * @param {string} eventType - Type of event
     * @param {Function} handler - Event handler function to remove
     */
    removeEventListener(eventType, handler) {
        if (!this.eventHandlers[eventType]) {
            return;
        }

        const index = this.eventHandlers[eventType].indexOf(handler);
        if (index !== -1) {
            this.eventHandlers[eventType].splice(index, 1);
        }
    }

    /**
     * Notify all registered event handlers
     * @param {string} eventType - Type of event
     * @param {Object} eventData - Event data to pass to handlers
     */
    notifyEventHandlers(eventType, eventData) {
        if (!this.eventHandlers[eventType]) {
            return;
        }

        this.eventHandlers[eventType].forEach((handler) => {
            try {
                handler(eventData);
            } catch (error) {
                logger.error(`Event handler error for ${eventType}`, error);
            }
        });
    }

    /**
     * Apply camera effects to the rendering pipeline
     * Integrates with existing camera positioning system
     */
    applyCameraEffects() {
        if (!this.camera || !this.originalCameraPosition) {
            return;
        }

        // This method will coordinate with shake and motion blur controllers
        // For now, it maintains the existing camera behavior

        // Future implementation will:
        // 1. Apply shake offset to camera position
        // 2. Update motion blur parameters based on camera movement
        // 3. Ensure effects don't interfere with existing camera following logic
    }

    /**
     * Update performance metrics for monitoring
     * @param {number} deltaTime - Time elapsed since last update
     */
    updatePerformanceMetrics(deltaTime) {
        const currentTime = performance.now();
        const frameTime = currentTime - this.performanceMetrics.lastFrameTime;

        // Update running average (simple exponential moving average)
        this.performanceMetrics.averageFrameTime =
            this.performanceMetrics.averageFrameTime * 0.9 + frameTime * 0.1;

        this.performanceMetrics.lastFrameTime = currentTime;
        this.performanceMetrics.frameCount++;
    }

    /**
     * Get current performance metrics
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        const currentFPS = 1000 / this.performanceMetrics.averageFrameTime;

        // Update min/max FPS
        if (!this.performanceMetrics.minFPS || currentFPS < this.performanceMetrics.minFPS) {
            this.performanceMetrics.minFPS = currentFPS;
        }
        if (!this.performanceMetrics.maxFPS || currentFPS > this.performanceMetrics.maxFPS) {
            this.performanceMetrics.maxFPS = currentFPS;
        }

        return {
            ...this.performanceMetrics,
            currentFPS: currentFPS,
            minFPS: this.performanceMetrics.minFPS,
            maxFPS: this.performanceMetrics.maxFPS,
            isPerformanceGood: this.performanceMetrics.averageFrameTime < 20, // 50+ FPS
        };
    }

    /**
     * Enable or disable camera effects
     * @param {boolean} enabled - Whether to enable effects
     */
    setEnabled(enabled) {
        this.enabled = Boolean(enabled);

        if (this.shakeController) {
            this.shakeController.setEnabled(this.enabled);
        }

        if (this.motionBlurController) {
            this.motionBlurController.setEnabled(this.enabled);
        }

        if (!this.enabled) {
            // Reset camera to original position when disabled
            this.resetCameraPosition();
        }

        logger.info(`${this.enabled ? 'Enabled' : 'Disabled'}`);
    }

    /**
     * Check if camera effects are enabled
     * @returns {boolean} True if enabled
     */
    isEnabled() {
        return this.enabled && this.initialized;
    }

    /**
     * Reset camera to original position
     * Used when disabling effects or handling errors
     */
    resetCameraPosition() {
        if (this.camera && this.originalCameraPosition) {
            // Reset position while preserving existing camera following logic
            // This ensures compatibility with the existing updateCamera method in RenderingEngine
            this.camera.position.copy(this.originalCameraPosition);
        }
    }

    /**
     * Pause camera effects
     * Called when game is paused
     */
    pause() {
        if (!this.initialized) {
            return;
        }

        // Pause subsystems when implemented
        if (
            this.shakeController &&
            typeof (/** @type {any} */ (this.shakeController).pause) === 'function'
        ) {
            /** @type {any} */ (this.shakeController).pause();
        }

        if (this.motionBlurController && typeof this.motionBlurController.pause === 'function') {
            this.motionBlurController.pause();
        }

        logger.debug('Paused');
    }

    /**
     * Resume camera effects
     * Called when game is resumed
     */
    resume() {
        if (!this.initialized) {
            return;
        }

        // Resume subsystems when implemented
        if (
            this.shakeController &&
            typeof (/** @type {any} */ (this.shakeController).resume) === 'function'
        ) {
            /** @type {any} */ (this.shakeController).resume();
        }

        if (this.motionBlurController && typeof this.motionBlurController.resume === 'function') {
            this.motionBlurController.resume();
        }

        // Reset timing to prevent large delta time jumps
        this.lastUpdateTime = performance.now();
        this.performanceMetrics.lastFrameTime = this.lastUpdateTime;

        logger.debug('Resumed');
    }

    /**
     * Clean up resources and reset state
     * Called when game is restarted or effects are destroyed
     */
    destroy() {
        try {
            // Reset camera position
            this.resetCameraPosition();

            // Clear event handlers
            Object.keys(this.eventHandlers).forEach((eventType) => {
                this.eventHandlers[eventType] = [];
            });

            // Destroy subsystems when implemented
            if (
                this.shakeController &&
                typeof (/** @type {any} */ (this.shakeController).destroy) === 'function'
            ) {
                /** @type {any} */ (this.shakeController).destroy();
            }

            if (
                this.motionBlurController &&
                typeof this.motionBlurController.destroy === 'function'
            ) {
                this.motionBlurController.destroy();
            }

            if (this.configManager && typeof this.configManager.destroy === 'function') {
                this.configManager.destroy();
            }

            // Clean up effect pool
            if (this.effectPool) {
                this.effectPool.shakeInstances = [];
            }

            // Destroy error handling and performance management
            if (
                this.degradationManager &&
                typeof (/** @type {any} */ (this.degradationManager).destroy) === 'function'
            ) {
                /** @type {any} */ (this.degradationManager).destroy();
            }

            if (this.errorHandler && typeof this.errorHandler.destroy === 'function') {
                this.errorHandler.destroy();
            }

            // Reset state
            this.initialized = false;
            this.enabled = false;
            this.originalCameraPosition = null;

            logger.info('Destroyed');
        } catch (error) {
            logger.error('Destruction error', error);

            // Handle destruction error
            if (this.errorHandler) {
                this.errorHandler.handleRuntimeError(error, 'CameraEffectsManager destruction');
            }
        }
    }

    /**
     * Get current system status for debugging
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            initialized: this.initialized,
            enabled: this.enabled,
            settings: { ...this.settings },
            hasCamera: !!this.camera,
            hasRenderer: !!this.renderer,
            eventHandlerCounts: Object.keys(this.eventHandlers).reduce((counts, eventType) => {
                counts[eventType] = this.eventHandlers[eventType].length;
                return counts;
            }, {}),
            performanceMetrics: this.getPerformanceMetrics(),
            subsystems: {
                shake: this.shakeController
                    ? {
                          enabled: this.shakeController.isEnabled(),
                          activeEffects: this.shakeController.getActiveShakeCount(),
                          currentOffset: this.shakeController.getCurrentOffset(),
                      }
                    : null,
                motionBlur: this.motionBlurController
                    ? {
                          enabled: this.motionBlurController.enabled,
                          intensity: this.motionBlurController.getBlurConfig().intensity,
                          quality: this.motionBlurController.getCurrentQuality(),
                      }
                    : null,
                configManager: !!this.configManager,
                degradationManager: !!this.degradationManager,
                errorHandler: !!this.errorHandler,
            },
            degradationState: this.degradationManager
                ? this.degradationManager.getDegradationState()
                : null,
            errorStatistics: this.errorHandler ? this.errorHandler.getErrorStatistics() : null,
            capabilities: this.degradationManager
                ? this.degradationManager.getCapabilitiesSummary()
                : null,
        };
    }

    /**
     * Get error handler for external error reporting
     * @returns {CameraEffectsErrorHandler} Error handler instance
     */
    getErrorHandler() {
        return this.errorHandler;
    }

    /**
     * Get degradation manager for external monitoring
     * @returns {PerformanceDegradationManager} Degradation manager instance
     */
    getDegradationManager() {
        return this.degradationManager;
    }

    /**
     * Check if effects are running in fallback mode
     * @returns {boolean} True if in fallback mode
     */
    isInFallbackMode() {
        return this.errorHandler ? this.errorHandler.getStatus().fallbackMode : false;
    }

    /**
     * Force recovery attempt for error conditions
     * @returns {boolean} True if recovery was attempted
     */
    attemptRecovery() {
        if (this.errorHandler && this.errorHandler.hasRecoverableErrors()) {
            return this.errorHandler.attemptRecovery('runtime');
        }
        return false;
    }
    /**
     * Update camera effects settings
     * @param {Object} settings - New settings to apply
     */
    updateSettings(settings) {
        if (!settings) return;

        // Update local settings tracking
        this.settings = { ...this.settings, ...settings };

        if (this.configManager && typeof this.configManager.updateSettings === 'function') {
            this.configManager.updateSettings(settings);
        }

        // Handle specific settings that might affect the manager directly
        if (settings.accessibilityMode !== undefined) {
            // If accessibility mode is enabled, we might want to disable effects
            // or pass this to controllers
            if (settings.accessibilityMode) {
                if (this.shakeController) this.shakeController.setEnabled(false);
                if (this.motionBlurController) this.motionBlurController.setEnabled(false);
            } else {
                if (this.shakeController) this.shakeController.setEnabled(true);
                if (this.motionBlurController) this.motionBlurController.setEnabled(true);
            }
        }

        if (settings.shakeIntensity !== undefined && this.shakeController) {
            // Map numeric intensity to 'low', 'medium', 'high' if needed, or set multiplier
            // For now assuming the controller handles it or we map it
            // The controller expects setIntensitySetting('low'|'medium'|'high') or setIntensityMultiplier(number)
            if (typeof settings.shakeIntensity === 'number') {
                this.shakeController.setIntensityMultiplier(settings.shakeIntensity);
            }
        }

        if (settings.shakeEnabled !== undefined && this.shakeController) {
            this.shakeController.setEnabled(settings.shakeEnabled);
        }

        if (settings.motionBlurEnabled !== undefined && this.motionBlurController) {
            this.motionBlurController.setEnabled(settings.motionBlurEnabled);
        }

        if (settings.motionBlurQuality !== undefined && this.motionBlurController) {
            this.motionBlurController.setQuality(settings.motionBlurQuality);
        }

        if (settings.respectSystemPreferences !== undefined) {
            if (settings.respectSystemPreferences && window.matchMedia) {
                const prefersReducedMotion = window.matchMedia(
                    '(prefers-reduced-motion: reduce)'
                ).matches;
                if (prefersReducedMotion) {
                    if (this.shakeController) this.shakeController.setEnabled(false);
                    if (this.motionBlurController) this.motionBlurController.setEnabled(false);
                }
            }
        }

        logger.debug('Settings updated', settings);
    }

    /**
     * Reset all camera effects
     * Clears all active effects and returns to initial state
     */
    reset() {
        if (this.shakeController) {
            this.shakeController.clearAllShakes();
        }

        if (this.motionBlurController) {
            this.motionBlurController.setEnabled(false);
            this.motionBlurController.setEnabled(this.enabled);
        }

        this.resetCameraPosition();

        logger.debug('Reset');
    }

    /**
     * Update the game state reference
     * @param {Object} newGameState - New game state object
     */
    updateGameState(newGameState) {
        this.gameState = newGameState;
        logger.debug('Game state updated');
    }

    /**
     * Check if the system has active post-processing effects
     * @returns {boolean} True if post-processing is active
     */
    hasPostProcessing() {
        return (
            this.motionBlurController &&
            this.motionBlurController.enabled &&
            !this.motionBlurController.fallbackMode
        );
    }

    /**
     * Render the scene with active camera effects
     * @param {THREE.Scene} scene - Scene to render
     * @param {THREE.Camera} camera - Camera to use
     */
    render(scene, camera) {
        if (this.hasPostProcessing()) {
            this.motionBlurController.render(scene, camera);
        } else {
            this.renderer.render(scene, camera);
        }
    }
}

module.exports = { CameraEffectsManager };
