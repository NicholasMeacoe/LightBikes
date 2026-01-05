const { createLogger } = require('./Logger.js');
const logger = createLogger('PerformanceDegradation');
const { DeviceCapabilityDetector } = require('./DeviceCapabilityDetector.js');
const { PerformanceMonitor } = require('./PerformanceMonitor.js');

/**
 * PerformanceDegradationManager - Handles graceful degradation for camera effects
 *
 * This class orchestrates performance management by:
 * 1. Detecting device capabilities via DeviceCapabilityDetector
 * 2. Monitoring real-time performance via PerformanceMonitor
 * 3. Adjusting quality settings based on data from both
 *
 * @class PerformanceDegradationManager
 * @author LightBikes Development Team
 * @version 2.0.0
 * @since 2024
 */
class PerformanceDegradationManager {
    constructor(arg1 = null, arg2 = null) {
        // Component references
        this.cameraEffectsManager = null;
        this.motionBlurController = null;
        this.shakeController = null;

        let detector = null;
        let monitor = null;

        // Handle legacy signature: new PerformanceDegradationManager(game, performanceMonitor)
        // We check if arg2 looks like a PerformanceMonitor
        if (
            arg2 &&
            (arg2.constructor.name === 'PerformanceMonitor' || typeof arg2.update === 'function')
        ) {
            monitor = arg2;
        }

        // Handle new signature: new PerformanceDegradationManager(detector, monitor)
        // Check if arg1 is a detector
        if (
            arg1 &&
            (arg1.constructor.name === 'DeviceCapabilityDetector' ||
                typeof arg1.detect === 'function')
        ) {
            detector = arg1;
        }
        // Check if arg1 is a monitor (if passed as single arg)
        else if (
            arg1 &&
            (arg1.constructor.name === 'PerformanceMonitor' || typeof arg1.update === 'function')
        ) {
            monitor = arg1;
        }

        // Sub-systems
        this.detector = detector || new DeviceCapabilityDetector();
        this.externalMonitor = !!monitor;
        this.monitor = monitor || new PerformanceMonitor();

        // Cache capabilities
        this.capabilities = this.detector.capabilities;

        // Degradation state
        this.degradationState = {
            currentLevel: 0, // 0 = no degradation, 3 = maximum degradation
            maxLevel: 3,
            effectsEnabled: true,
            motionBlurEnabled: true,
            shakeEnabled: true,
            qualityLevel: 'medium',

            // Degradation levels
            levels: [
                {
                    // Level 0 - No degradation
                    name: 'full',
                    motionBlur: true,
                    shake: true,
                    quality: 'high',
                    description: 'All effects enabled at high quality',
                },
                {
                    // Level 1 - Reduce quality
                    name: 'reduced_quality',
                    motionBlur: true,
                    shake: true,
                    quality: 'medium',
                    description: 'Effects enabled at medium quality',
                },
                {
                    // Level 2 - Disable motion blur
                    name: 'shake_only',
                    motionBlur: false,
                    shake: true,
                    quality: 'low',
                    description: 'Camera shake only, motion blur disabled',
                },
                {
                    // Level 3 - Disable all effects
                    name: 'disabled',
                    motionBlur: false,
                    shake: false,
                    quality: 'low',
                    description: 'All camera effects disabled',
                },
            ],
        };

        // Error tracking
        this.errorState = {
            webglErrors: 0,
            postProcessingErrors: 0,
            memoryErrors: 0,
            lastError: null,
            errorCooldown: 5000, // 5 seconds
            lastErrorTime: 0,
            maxErrors: 3, // Max errors before fallback
        };

        // User notifications
        this.notifications = {
            shown: new Set(),
            queue: [],
            maxQueueSize: 5,
        };

        // Initialization state
        this.initialized = false;
        this.enabled = true;

        // Callbacks
        this.onDegradation = null;
        this.onRecovery = null;

        // Quality adjustment tracking
        this.lastQualityAdjustment = 0;
        this.qualityAdjustmentCooldown = 3000; // 3 seconds
    }

    /**
     * Set degradation callback
     * @param {Function} callback - Callback function
     */
    setOnDegradation(callback) {
        this.onDegradation = callback;
    }

    /**
     * Set recovery callback
     * @param {Function} callback - Callback function
     */
    setOnRecovery(callback) {
        this.onRecovery = callback;
    }

    /**
     * Initialize the performance degradation manager
     * @param {CameraEffectsManager} cameraEffectsManager - Camera effects manager instance
     * @param {MotionBlurController} motionBlurController - Motion blur controller instance
     * @param {CameraShakeController} shakeController - Camera shake controller instance
     * @returns {boolean} Success status
     */
    initialize(cameraEffectsManager, motionBlurController = null, shakeController = null) {
        try {
            this.cameraEffectsManager = cameraEffectsManager;
            this.motionBlurController = motionBlurController;
            this.shakeController = shakeController;

            // Detect capabilities
            this.capabilities = this.detector.detect();

            // Set initial degradation level based on capabilities
            this.setInitialDegradationLevel();

            // Reset monitor
            this.monitor.reset();

            this.initialized = true;
            logger.info('Initialized successfully');
            logger.debug('Device capabilities', this.detector.getSummary());

            return true;
        } catch (error) {
            logger.error('Initialization failed', error);
            this.handleError('initialization', error);
            return false;
        }
    }

    /**
     * Set initial degradation level based on detected capabilities
     */
    setInitialDegradationLevel() {
        let initialLevel = 0;

        // Start with degradation if capabilities are limited
        if (!this.capabilities.webglSupported) {
            initialLevel = 3; // Disable all effects
        } else if (!this.capabilities.postProcessingSupported) {
            initialLevel = 2; // Disable motion blur
        } else if (this.capabilities.isLowEndDevice) {
            initialLevel = 1; // Reduce quality
        } else if (this.capabilities.gpuTier === 'low') {
            initialLevel = 1; // Reduce quality
        }

        this.setDegradationLevel(initialLevel);

        if (initialLevel > 0) {
            this.queueNotification(
                'performance',
                `Camera effects adjusted for your device: ${this.degradationState.levels[initialLevel].description}`
            );
        }
    }

    /**
     * Update performance monitoring and automatic degradation
     * @param {number} deltaTime - Time elapsed since last update in seconds
     */
    update(deltaTime) {
        if (!this.initialized || !this.enabled) {
            return;
        }

        try {
            // Update performance monitor only if we own it (not shared)
            if (!this.externalMonitor) {
                this.monitor.update(deltaTime);
            }

            // Check for automatic quality adjustment
            this.checkPerformanceAdjustment();

            // Process notification queue
            this.processNotificationQueue();
        } catch (error) {
            logger.error('Update error:', error);
            this.handleError('update', error);
        }
    }

    /**
     * Check if performance adjustment is needed
     */
    checkPerformanceAdjustment() {
        const currentTime = Date.now();

        // Only adjust after cooldown period
        if (currentTime - this.lastQualityAdjustment < this.qualityAdjustmentCooldown) {
            return;
        }

        const metrics = this.monitor.getPerformanceMetrics();

        // Need sufficient frame history for reliable analysis
        if (metrics.frameCount < 60) {
            return;
        }

        // Determine if degradation is needed
        let targetLevel = this.degradationState.currentLevel;

        // Degrade if performance is consistently poor
        if (metrics.consecutivePoorFrames > 30) {
            if (this.degradationState.currentLevel < this.degradationState.maxLevel) {
                targetLevel = this.degradationState.currentLevel + 1;
                logger.info(
                    `Performance degradation triggered. FPS: ${metrics.currentFPS.toFixed(1)}`
                );
            }
        }
        // Improve if performance is consistently good
        else if (metrics.consecutiveGoodFrames > 120) {
            if (this.degradationState.currentLevel > 0) {
                targetLevel = this.degradationState.currentLevel - 1;
                logger.info(
                    `Performance improvement detected. FPS: ${metrics.currentFPS.toFixed(1)}`
                );
            }
        }

        // Apply level change if needed
        if (targetLevel !== this.degradationState.currentLevel) {
            this.setDegradationLevel(targetLevel);
            this.lastQualityAdjustment = currentTime;
        }
    }

    /**
     * Set degradation level and apply changes
     * @param {number} level - Degradation level (0-3)
     */
    setDegradationLevel(level) {
        if (level < 0 || level > this.degradationState.maxLevel) {
            logger.warn(`Invalid degradation level: ${level}`);
            return;
        }

        const previousLevel = this.degradationState.currentLevel;
        this.degradationState.currentLevel = level;

        const config = this.degradationState.levels[level];
        this.degradationState.effectsEnabled = config.motionBlur || config.shake;
        this.degradationState.motionBlurEnabled = config.motionBlur;
        this.degradationState.shakeEnabled = config.shake;
        this.degradationState.qualityLevel = config.quality;

        // Apply changes to components
        this.applyDegradationSettings();

        // Log change
        if (level !== previousLevel) {
            logger.info(
                `Degradation level changed from ${previousLevel} to ${level}: ${config.description}`
            );

            // Queue user notification for significant changes
            if (level > previousLevel) {
                if (level > 0) {
                    this.queueNotification(
                        'degradation',
                        `Camera effects reduced to maintain performance: ${config.description}`
                    );
                }

                // Trigger degradation callback
                if (this.onDegradation) {
                    this.onDegradation('degrade', { level, config });
                }
            } else if (level < previousLevel) {
                this.queueNotification(
                    'improvement',
                    `Camera effects restored: ${config.description}`
                );

                // Trigger recovery callback
                if (this.onRecovery) {
                    this.onRecovery('recover', { level, config });
                }
            }
        }
    }

    /**
     * Apply current degradation settings to components
     */
    applyDegradationSettings() {
        try {
            // Apply to camera effects manager
            if (this.cameraEffectsManager) {
                this.cameraEffectsManager.setEnabled(this.degradationState.effectsEnabled);
            }

            // Apply to motion blur controller
            if (this.motionBlurController) {
                this.motionBlurController.setEnabled(this.degradationState.motionBlurEnabled);
                // Always update quality level to reflect current degradation state
                this.motionBlurController.setQuality(this.degradationState.qualityLevel);
            }

            // Apply to shake controller
            if (this.shakeController) {
                this.shakeController.setEnabled(this.degradationState.shakeEnabled);
            }
        } catch (error) {
            logger.error('Error applying degradation settings', error);
            this.handleError('degradation', error);
        }
    }

    /**
     * Trigger memory cleanup
     */
    triggerMemoryCleanup() {
        try {
            // Force garbage collection if available
            if (typeof window !== 'undefined' && window.gc) {
                window.gc();
            }

            // Clean up component caches
            if (
                this.motionBlurController &&
                typeof this.motionBlurController.resetPerformanceMetrics === 'function'
            ) {
                this.motionBlurController.resetPerformanceMetrics();
            }

            // Clean up monitor history
            this.monitor.cleanup();

            logger.info('Memory cleanup triggered');
        } catch (error) {
            logger.error('Memory cleanup failed', error);
            this.handleError('memory', error);
        }
    }

    /**
     * Handle errors and implement recovery strategies
     * @param {string} context - Error context
     * @param {Error} error - Error object
     */
    handleError(context, error) {
        const currentTime = Date.now();

        // Rate limit error handling
        if (currentTime - this.errorState.lastErrorTime < this.errorState.errorCooldown) {
            return;
        }

        this.errorState.lastError = { context, error, timestamp: currentTime };
        this.errorState.lastErrorTime = currentTime;

        // Increment error counters
        switch (context) {
            case 'webgl':
                this.errorState.webglErrors++;
                break;
            case 'postprocessing':
                this.errorState.postProcessingErrors++;
                break;
            case 'memory':
                this.errorState.memoryErrors++;
                break;
        }

        // Check if we should trigger fallback mode
        const totalErrors =
            this.errorState.webglErrors +
            this.errorState.postProcessingErrors +
            this.errorState.memoryErrors;

        if (totalErrors >= this.errorState.maxErrors) {
            logger.warn('Maximum errors reached, entering fallback mode');
            this.setDegradationLevel(this.degradationState.maxLevel);

            this.queueNotification('error', 'Camera effects disabled due to technical issues');
        }
    }

    /**
     * Queue a user notification
     * @param {string} type - Notification type
     * @param {string} message - Notification message
     */
    queueNotification(type, message) {
        const notificationId = `${type}:${message}`;

        // Don't show duplicate notifications
        if (this.notifications.shown.has(notificationId)) {
            return;
        }

        // Add to queue
        if (this.notifications.queue.length < this.notifications.maxQueueSize) {
            this.notifications.queue.push({
                type,
                message,
                id: notificationId,
                timestamp: Date.now(),
            });
        }
    }

    /**
     * Process notification queue
     */
    processNotificationQueue() {
        if (this.notifications.queue.length === 0) {
            return;
        }

        // Process one notification per update to avoid spam
        const notification = this.notifications.queue.shift();
        this.showNotification(notification);
        this.notifications.shown.add(notification.id);
    }

    /**
     * Show notification to user
     * @param {Object} notification - Notification object
     */
    showNotification(notification) {
        logger.info(`Camera Effects: ${notification.message}`);

        // Could dispatch custom event for UI to handle
        if (typeof window !== 'undefined') {
            window.dispatchEvent(
                new CustomEvent('cameraEffectsNotification', {
                    detail: notification,
                })
            );
        }
    }

    /**
     * Check if effects should be enabled based on current state
     * @returns {boolean} True if effects should be enabled
     */
    shouldEnableEffects() {
        return (
            this.initialized &&
            this.enabled &&
            this.degradationState.effectsEnabled &&
            this.capabilities.webglSupported
        );
    }

    /**
     * Check if motion blur should be enabled
     * @returns {boolean} True if motion blur should be enabled
     */
    shouldEnableMotionBlur() {
        return (
            this.shouldEnableEffects() &&
            this.degradationState.motionBlurEnabled &&
            this.capabilities.postProcessingSupported
        );
    }

    /**
     * Check if camera shake should be enabled
     * @returns {boolean} True if camera shake should be enabled
     */
    shouldEnableShake() {
        return this.shouldEnableEffects() && this.degradationState.shakeEnabled;
    }

    /**
     * Get current performance metrics
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        return this.monitor.getPerformanceMetrics();
    }

    /**
     * Get capabilities summary
     * @returns {Object} Capabilities summary
     */
    getCapabilitiesSummary() {
        return this.detector.getSummary();
    }

    /**
     * Get current degradation state
     * @returns {Object} Degradation state
     */
    getDegradationState() {
        return {
            level: this.degradationState.currentLevel,
            description:
                this.degradationState.levels[this.degradationState.currentLevel].description,
            effectsEnabled: this.degradationState.effectsEnabled,
            motionBlurEnabled: this.degradationState.motionBlurEnabled,
            shakeEnabled: this.degradationState.shakeEnabled,
            qualityLevel: this.degradationState.qualityLevel,
        };
    }

    /**
     * Reset performance metrics
     */
    resetPerformanceMetrics() {
        this.monitor.reset();
    }
}

module.exports = { PerformanceDegradationManager };
