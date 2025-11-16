const { PerformanceDegradationManager } = require('../utils/PerformanceDegradationManager.js');
const { CameraEffectsErrorHandler } = require('./CameraEffectsErrorHandler.js');

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
        
        // Initialize subsystems (will be implemented in later tasks)
        this.shakeController = null; // Will be CameraShakeController
        this.motionBlurController = null; // Will be MotionBlurController
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
            speedChange: []
        };
        
        // Integration state with RenderingEngine
        this.originalCameraPosition = null;
        this.originalUpdateCamera = null;
        
        // Performance monitoring
        this.performanceMetrics = {
            lastFrameTime: 0,
            averageFrameTime: 16.67, // 60fps baseline
            frameCount: 0
        };
        
        // Effect pooling for performance optimization
        this.effectPool = {
            shakeInstances: [],
            maxPoolSize: 10
        };
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
                console.error('CameraEffectsManager: Missing required camera or renderer');
                return false;
            }

            // Initialize error handler first
            if (!this.errorHandler.initialize(this, this.degradationManager, this.motionBlurController, this.shakeController)) {
                console.warn('CameraEffectsManager: Error handler initialization failed, continuing without error handling');
            }

            // Initialize degradation manager
            if (!this.degradationManager.initialize(this, this.motionBlurController, this.shakeController)) {
                console.warn('CameraEffectsManager: Degradation manager initialization failed, continuing with basic functionality');
            }

            // Store original camera position for shake offset calculations
            this.originalCameraPosition = this.camera.position.clone();
            
            // Initialize performance tracking
            this.lastUpdateTime = Date.now();
            this.performanceMetrics.lastFrameTime = this.lastUpdateTime;
            
            this.initialized = true;
            console.log('CameraEffectsManager: Successfully initialized with error handling and performance monitoring');
            return true;
            
        } catch (error) {
            console.error('CameraEffectsManager: Initialization failed:', error);
            
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
            
            if (this.motionBlurController && this.degradationManager?.shouldEnableMotionBlur()) {
                this.motionBlurController.update(deltaTime);
            }
            
            // Apply camera effects to the rendering pipeline
            this.applyCameraEffects();
            
        } catch (error) {
            console.error('CameraEffectsManager: Update error:', error);
            
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
                console.warn('CameraEffectsManager: Invalid collision parameters');
                return;
            }

            // Clamp intensity to valid range
            const clampedIntensity = Math.max(0.0, Math.min(1.0, intensity));
            
            // Notify registered event handlers
            this.notifyEventHandlers('collision', { entity, intensity: clampedIntensity });
            
            // Log for debugging (will be removed in production)
            console.debug(`CameraEffectsManager: Collision event - entity: ${entity.id || 'unknown'}, intensity: ${clampedIntensity}`);
            
        } catch (error) {
            console.error('CameraEffectsManager: Collision handling error:', error);
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
                console.warn('CameraEffectsManager: Invalid near-miss parameters');
                return;
            }

            // Only process near misses within reasonable range (0-2 units)
            if (distance < 0 || distance > 2.0) {
                return;
            }
            
            // Notify registered event handlers
            this.notifyEventHandlers('nearMiss', { entity, distance });
            
            // Log for debugging (will be removed in production)
            console.debug(`CameraEffectsManager: Near-miss event - entity: ${entity.id || 'unknown'}, distance: ${distance}`);
            
        } catch (error) {
            console.error('CameraEffectsManager: Near-miss handling error:', error);
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
                console.warn('CameraEffectsManager: Invalid speed change parameters');
                return;
            }

            // Only process reasonable speed values
            if (newSpeed < 0 || newSpeed > 10.0) {
                return;
            }
            
            // Notify registered event handlers
            this.notifyEventHandlers('speedChange', { entity, newSpeed });
            
            // Log for debugging (will be removed in production)
            console.debug(`CameraEffectsManager: Speed change event - entity: ${entity.id || 'unknown'}, speed: ${newSpeed}`);
            
        } catch (error) {
            console.error('CameraEffectsManager: Speed change handling error:', error);
        }
    }

    /**
     * Register event handler for camera effects events
     * @param {string} eventType - Type of event ('collision', 'nearMiss', 'speedChange')
     * @param {Function} handler - Event handler function
     */
    addEventListener(eventType, handler) {
        if (!this.eventHandlers[eventType]) {
            console.warn(`CameraEffectsManager: Unknown event type: ${eventType}`);
            return;
        }

        if (typeof handler !== 'function') {
            console.warn('CameraEffectsManager: Event handler must be a function');
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

        this.eventHandlers[eventType].forEach(handler => {
            try {
                handler(eventData);
            } catch (error) {
                console.error(`CameraEffectsManager: Event handler error for ${eventType}:`, error);
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
        const currentTime = Date.now();
        const frameTime = currentTime - this.performanceMetrics.lastFrameTime;
        
        // Update running average (simple exponential moving average)
        this.performanceMetrics.averageFrameTime = 
            (this.performanceMetrics.averageFrameTime * 0.9) + (frameTime * 0.1);
        
        this.performanceMetrics.lastFrameTime = currentTime;
        this.performanceMetrics.frameCount++;
    }

    /**
     * Get current performance metrics
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            currentFPS: 1000 / this.performanceMetrics.averageFrameTime,
            isPerformanceGood: this.performanceMetrics.averageFrameTime < 20 // 50+ FPS
        };
    }

    /**
     * Enable or disable camera effects
     * @param {boolean} enabled - Whether to enable effects
     */
    setEnabled(enabled) {
        this.enabled = Boolean(enabled);
        
        if (!this.enabled) {
            // Reset camera to original position when disabled
            this.resetCameraPosition();
        }
        
        console.log(`CameraEffectsManager: ${this.enabled ? 'Enabled' : 'Disabled'}`);
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
        if (this.shakeController && typeof this.shakeController.pause === 'function') {
            this.shakeController.pause();
        }
        
        if (this.motionBlurController && typeof this.motionBlurController.pause === 'function') {
            this.motionBlurController.pause();
        }
        
        console.debug('CameraEffectsManager: Paused');
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
        if (this.shakeController && typeof this.shakeController.resume === 'function') {
            this.shakeController.resume();
        }
        
        if (this.motionBlurController && typeof this.motionBlurController.resume === 'function') {
            this.motionBlurController.resume();
        }
        
        // Reset timing to prevent large delta time jumps
        this.lastUpdateTime = Date.now();
        this.performanceMetrics.lastFrameTime = this.lastUpdateTime;
        
        console.debug('CameraEffectsManager: Resumed');
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
            Object.keys(this.eventHandlers).forEach(eventType => {
                this.eventHandlers[eventType] = [];
            });
            
            // Destroy subsystems when implemented
            if (this.shakeController && typeof this.shakeController.destroy === 'function') {
                this.shakeController.destroy();
            }
            
            if (this.motionBlurController && typeof this.motionBlurController.destroy === 'function') {
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
            if (this.degradationManager && typeof this.degradationManager.destroy === 'function') {
                this.degradationManager.destroy();
            }
            
            if (this.errorHandler && typeof this.errorHandler.destroy === 'function') {
                this.errorHandler.destroy();
            }
            
            // Reset state
            this.initialized = false;
            this.enabled = false;
            this.originalCameraPosition = null;
            
            console.log('CameraEffectsManager: Destroyed');
            
        } catch (error) {
            console.error('CameraEffectsManager: Destruction error:', error);
            
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
            hasCamera: !!this.camera,
            hasRenderer: !!this.renderer,
            eventHandlerCounts: Object.keys(this.eventHandlers).reduce((counts, eventType) => {
                counts[eventType] = this.eventHandlers[eventType].length;
                return counts;
            }, {}),
            performanceMetrics: this.getPerformanceMetrics(),
            subsystems: {
                shakeController: !!this.shakeController,
                motionBlurController: !!this.motionBlurController,
                configManager: !!this.configManager,
                degradationManager: !!this.degradationManager,
                errorHandler: !!this.errorHandler
            },
            degradationState: this.degradationManager ? this.degradationManager.getDegradationState() : null,
            errorStatistics: this.errorHandler ? this.errorHandler.getErrorStatistics() : null,
            capabilities: this.degradationManager ? this.degradationManager.getCapabilitiesSummary() : null
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
}

module.exports = { CameraEffectsManager };