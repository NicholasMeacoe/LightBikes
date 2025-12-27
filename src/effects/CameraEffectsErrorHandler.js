/**
 * CameraEffectsErrorHandler - Comprehensive error recovery for camera effects
 *
 * This class provides error handlers for WebGL and post-processing failures,
 * implements user notifications for feature availability, and adds logging
 * and debugging capabilities for troubleshooting camera effects issues.
 *
 * Key Features:
 * - WebGL error detection and recovery
 * - Post-processing failure handling
 * - User-friendly error notifications
 * - Comprehensive logging system
 * - Automatic fallback strategies
 * - Debug information collection
 *
 * Usage Example:
 * ```javascript
 * const errorHandler = new CameraEffectsErrorHandler();
 *
 * // Initialize with components
 * errorHandler.initialize(cameraEffectsManager, degradationManager);
 *
 * // Handle WebGL errors
 * errorHandler.handleWebGLError(error, 'Motion blur initialization failed');
 *
 * // Check error state
 * if (errorHandler.hasRecoverableErrors()) {
 *     errorHandler.attemptRecovery();
 * }
 * ```
 *
 * @class CameraEffectsErrorHandler
 * @author LightBikes Development Team
 * @version 1.0.0
 * @since 2024
 */
const { createLogger } = require('../utils/Logger.js');
const logger = createLogger('CameraEffectsErrorHandler');
const { ErrorRecoveryStrategies } = require('./ErrorRecoveryStrategies.js');
const { PerformanceDegradationManager } = require('../utils/PerformanceDegradationManager.js');

class CameraEffectsErrorHandler {
    constructor() {
        // Component references
        this.cameraEffectsManager = null;
        this.degradationManager = null;
        this.motionBlurController = null;
        this.shakeController = null;

        // Recovery strategies
        this.recoveryStrategies = new ErrorRecoveryStrategies();

        // Error tracking
        this.errorLog = [];
        this.maxLogEntries = 100;

        // Error categories and counters
        this.errorCounters = {
            webgl: 0,
            postProcessing: 0,
            shader: 0,
            memory: 0,
            initialization: 0,
            runtime: 0,
            recovery: 0,
        };

        // Error thresholds for different actions
        this.errorThresholds = {
            warning: 1, // Show warning after 1 error
            degradation: 3, // Trigger degradation after 3 errors
            fallback: 5, // Enter fallback mode after 5 errors
            disable: 10, // Disable effects after 10 errors
        };

        // Recovery attempt tracking
        this.recoveryAttempts = {
            total: 0,
            successful: 0,
            failed: 0,
            lastAttempt: 0,
            cooldownPeriod: 5000, // 5 seconds between recovery attempts
            maxAttempts: 3,
        };

        // User notification system
        this.notifications = {
            shown: new Set(),
            queue: [],
            maxQueueSize: 5,
            suppressDuplicates: true,
            notificationCooldown: 10000, // 10 seconds between similar notifications
        };

        // Debug information collection
        this.debugInfo = {
            browserInfo: this.collectBrowserInfo(),
            systemInfo: this.collectSystemInfo(),
            webglInfo: null, // Will be populated when WebGL context is available
            performanceInfo: null,
            lastErrorContext: null,
        };

        // Logging configuration
        this.loggingConfig = {
            enabled: true,
            logLevel: 'info', // 'debug', 'info', 'warn', 'error'
            includeStackTrace: true,
            includeTimestamp: true,
            includeContext: true,
        };

        // State tracking
        this.initialized = false;
        this.fallbackMode = false;
        this.effectsDisabled = false;

        // Bind methods for event listeners
        this.handleWebGLContextLost = this.handleWebGLContextLost.bind(this);
        this.handleWebGLContextRestored = this.handleWebGLContextRestored.bind(this);
        this.handleUnhandledError = this.handleUnhandledError.bind(this);
    }

    /**
     * Initialize the error handler
     * @param {CameraEffectsManager} cameraEffectsManager - Camera effects manager
     * @param {PerformanceDegradationManager} degradationManager - Degradation manager
     * @param {MotionBlurController} motionBlurController - Motion blur controller
     * @param {CameraShakeController} shakeController - Shake controller
     * @returns {boolean} Success status
     */
    initialize(
        cameraEffectsManager,
        degradationManager = null,
        motionBlurController = null,
        shakeController = null
    ) {
        try {
            this.cameraEffectsManager = cameraEffectsManager;
            this.degradationManager = degradationManager;
            this.motionBlurController = motionBlurController;
            this.shakeController = shakeController;

            // Initialize recovery strategies
            this.recoveryStrategies.initialize({
                cameraEffectsManager,
                degradationManager,
                motionBlurController,
                shakeController,
            });

            // Set up global error handlers
            this.setupGlobalErrorHandlers();

            // Collect WebGL debug information
            this.collectWebGLInfo();

            // Initialize logging
            this.log('info', 'CameraEffectsErrorHandler initialized', {
                browserInfo: this.debugInfo.browserInfo,
                systemInfo: this.debugInfo.systemInfo,
            });

            this.initialized = true;
            return true;
        } catch (error) {
            logger.error('Initialization failed', error);
            return false;
        }
    }

    /**
     * Set up global error handlers
     */
    setupGlobalErrorHandlers() {
        // WebGL context lost/restored handlers
        if (typeof window !== 'undefined') {
            window.addEventListener('webglcontextlost', this.handleWebGLContextLost, false);
            window.addEventListener('webglcontextrestored', this.handleWebGLContextRestored, false);

            // Global error handler for unhandled errors
            window.addEventListener('error', this.handleUnhandledError, false);
            window.addEventListener('unhandledrejection', this.handleUnhandledError, false);
        }
    }

    /**
     * Handle WebGL context lost event
     * @param {Event} event - WebGL context lost event
     */
    handleWebGLContextLost(event) {
        /** @type {any} */
        const e = event;
        e.preventDefault();

        this.log('error', 'WebGL context lost', {
            reason: e.statusMessage || 'Unknown',
            timestamp: Date.now(),
        });

        this.handleWebGLError(new Error('WebGL context lost'), 'Context lost event');

        // Notify user
        this.queueNotification(
            'error',
            'Graphics context lost. Camera effects temporarily disabled.'
        );
    }

    /**
     * Handle WebGL context restored event
     * @param {Event} event - WebGL context restored event
     */
    handleWebGLContextRestored(event) {
        this.log('info', 'WebGL context restored', {
            timestamp: Date.now(),
        });

        // Attempt to recover
        this.attemptRecovery('webgl');

        // Notify user
        this.queueNotification(
            'info',
            'Graphics context restored. Attempting to re-enable camera effects.'
        );
    }

    /**
     * Handle unhandled errors that might affect camera effects
     * @param {Event} event - Error event
     */
    handleUnhandledError(event) {
        /** @type {any} */
        const e = event;
        const error = e.error || e.reason;

        // Only handle errors that seem related to camera effects
        if (
            error &&
            error.message &&
            (error.message.includes('WebGL') ||
                error.message.includes('THREE') ||
                error.message.includes('shader') ||
                error.message.includes('texture') ||
                error.message.includes('framebuffer'))
        ) {
            this.log('error', 'Unhandled error affecting camera effects', {
                message: error.message,
                stack: error.stack,
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno,
            });

            this.handleRuntimeError(error, 'Unhandled error');
        }
    }

    /**
     * Handle WebGL-specific errors
     * @param {Error} error - Error object
     * @param {string} context - Error context description
     * @param {Object} additionalInfo - Additional error information
     */
    handleWebGLError(error, context = 'Unknown WebGL error', additionalInfo = {}) {
        this.errorCounters.webgl++;

        const errorEntry = {
            type: 'webgl',
            error: error,
            context: context,
            timestamp: Date.now(),
            counter: this.errorCounters.webgl,
            additionalInfo: additionalInfo,
            webglInfo: this.debugInfo.webglInfo,
        };

        this.addToErrorLog(errorEntry);

        this.log('error', `WebGL Error: ${context}`, {
            message: error.message,
            stack: error.stack,
            additionalInfo: additionalInfo,
            errorCount: this.errorCounters.webgl,
        });

        // Determine response based on error count
        if (this.errorCounters.webgl >= this.errorThresholds.disable) {
            this.disableAllEffects('Too many WebGL errors');
        } else if (this.errorCounters.webgl >= this.errorThresholds.fallback) {
            this.enterFallbackMode('WebGL errors');
        } else if (this.errorCounters.webgl >= this.errorThresholds.degradation) {
            this.triggerDegradation('WebGL errors');
        } else if (this.errorCounters.webgl >= this.errorThresholds.warning) {
            this.queueNotification(
                'warning',
                'Graphics issues detected. Camera effects may be reduced.'
            );
        }

        // Attempt recovery if not too many attempts
        if (this.canAttemptRecovery()) {
            this.attemptRecovery('webgl');
        }
    }

    /**
     * Handle post-processing errors
     * @param {Error} error - Error object
     * @param {string} context - Error context description
     * @param {Object} additionalInfo - Additional error information
     */
    handlePostProcessingError(error, context = 'Post-processing error', additionalInfo = {}) {
        this.errorCounters.postProcessing++;

        const errorEntry = {
            type: 'postProcessing',
            error: error,
            context: context,
            timestamp: Date.now(),
            counter: this.errorCounters.postProcessing,
            additionalInfo: additionalInfo,
        };

        this.addToErrorLog(errorEntry);

        this.log('error', `Post-processing Error: ${context}`, {
            message: error.message,
            stack: error.stack,
            additionalInfo: additionalInfo,
            errorCount: this.errorCounters.postProcessing,
        });

        // Post-processing errors usually mean motion blur should be disabled
        if (this.errorCounters.postProcessing >= this.errorThresholds.degradation) {
            this.disableMotionBlur('Post-processing errors');
        } else if (this.errorCounters.postProcessing >= this.errorThresholds.warning) {
            this.queueNotification('warning', 'Motion blur effects may be unstable.');
        }

        // Attempt recovery
        if (this.canAttemptRecovery()) {
            this.attemptRecovery('postProcessing');
        }
    }

    /**
     * Handle shader compilation/linking errors
     * @param {Error} error - Error object
     * @param {string} context - Error context description
     * @param {Object} shaderInfo - Shader information
     */
    handleShaderError(error, context = 'Shader error', shaderInfo = {}) {
        this.errorCounters.shader++;

        const errorEntry = {
            type: 'shader',
            error: error,
            context: context,
            timestamp: Date.now(),
            counter: this.errorCounters.shader,
            shaderInfo: shaderInfo,
        };

        this.addToErrorLog(errorEntry);

        this.log('error', `Shader Error: ${context}`, {
            message: error.message,
            shaderInfo: shaderInfo,
            errorCount: this.errorCounters.shader,
        });

        // Shader errors usually affect motion blur
        if (this.errorCounters.shader >= this.errorThresholds.degradation) {
            this.disableMotionBlur('Shader compilation errors');
        }

        // Attempt recovery
        if (this.canAttemptRecovery()) {
            this.attemptRecovery('shader');
        }
    }

    /**
     * Handle memory-related errors
     * @param {Error} error - Error object
     * @param {string} context - Error context description
     * @param {Object} memoryInfo - Memory information
     */
    handleMemoryError(error, context = 'Memory error', memoryInfo = {}) {
        this.errorCounters.memory++;

        const errorEntry = {
            type: 'memory',
            error: error,
            context: context,
            timestamp: Date.now(),
            counter: this.errorCounters.memory,
            memoryInfo: memoryInfo,
        };

        this.addToErrorLog(errorEntry);

        this.log('error', `Memory Error: ${context}`, {
            message: error.message,
            memoryInfo: memoryInfo,
            errorCount: this.errorCounters.memory,
        });

        // Memory errors require immediate action
        if (this.errorCounters.memory >= this.errorThresholds.degradation) {
            this.triggerDegradation('Memory pressure');
        }

        // Always attempt memory recovery
        this.attemptRecovery('memory');
    }

    /**
     * Handle runtime errors during effect execution
     * @param {Error} error - Error object
     * @param {string} context - Error context description
     */
    handleRuntimeError(error, context = 'Runtime error') {
        this.errorCounters.runtime++;

        const errorEntry = {
            type: 'runtime',
            error: error,
            context: context,
            timestamp: Date.now(),
            counter: this.errorCounters.runtime,
        };

        this.addToErrorLog(errorEntry);

        this.log('error', `Runtime Error: ${context}`, {
            message: error.message,
            stack: error.stack,
            errorCount: this.errorCounters.runtime,
        });

        // Runtime errors may indicate instability
        if (this.errorCounters.runtime >= this.errorThresholds.fallback) {
            this.enterFallbackMode('Runtime instability');
        }
    }

    /**
     * Attempt recovery using appropriate strategy
     * @param {string} errorType - Type of error to recover from
     * @returns {boolean} Success status
     */
    attemptRecovery(errorType) {
        if (!this.canAttemptRecovery()) {
            return false;
        }

        this.recoveryAttempts.total++;
        this.recoveryAttempts.lastAttempt = Date.now();

        const strategies = this.recoveryStrategies.getStrategiesForType(errorType);

        this.log('info', `Attempting recovery for ${errorType} error`, {
            attempt: this.recoveryAttempts.total,
            strategies: strategies,
        });

        let recovered = false;

        for (const strategy of strategies) {
            try {
                if (this.recoveryStrategies.executeStrategy(strategy)) {
                    recovered = true;

                    // Special handling for fallback mode state
                    if (strategy === 'fallbackRendering') {
                        this.fallbackMode = true;
                        this.queueNotification(
                            'warning',
                            'Camera effects running in compatibility mode.'
                        );
                    }

                    break;
                }
            } catch (strategyError) {
                this.log('warn', `Recovery strategy ${strategy} failed`, {
                    error: strategyError.message,
                });
            }
        }

        if (recovered) {
            this.recoveryAttempts.successful++;
            this.log('info', `Recovery successful using strategy`, {
                errorType: errorType,
                attempt: this.recoveryAttempts.total,
            });

            this.queueNotification('info', 'Camera effects recovered successfully.');
        } else {
            this.recoveryAttempts.failed++;
            this.log('error', `Recovery failed for ${errorType}`, {
                attempt: this.recoveryAttempts.total,
                strategiesTried: strategies,
            });
        }

        return recovered;
    }

    /**
     * Disable all effects
     * @param {string} reason - Reason for disabling
     * @returns {boolean} Success status
     */
    disableAllEffects(reason) {
        return this.recoveryStrategies.disableAllEffects(reason);
    }

    /**
     * Enter fallback mode
     * @param {string} reason - Reason for fallback
     * @returns {boolean} Success status
     */
    enterFallbackMode(reason) {
        this.fallbackMode = true;
        this.queueNotification('warning', 'Camera effects running in compatibility mode.');
        return this.recoveryStrategies.enterFallbackMode(reason);
    }

    /**
     * Disable motion blur
     * @param {string} reason - Reason for disabling
     * @returns {boolean} Success status
     */
    disableMotionBlur(reason) {
        return this.recoveryStrategies.disableMotionBlur(reason);
    }

    /**
     * Trigger degradation through degradation manager
     * @param {string} reason - Reason for degradation
     */
    triggerDegradation(reason) {
        if (this.degradationManager) {
            const currentLevel = this.degradationManager.getDegradationState().level;
            if (currentLevel < 2) {
                this.degradationManager.setDegradationLevel(currentLevel + 1);
                this.log('info', `Triggered degradation: ${reason}`);
            }
        }
    }

    /**
     * Check if recovery can be attempted
     * @returns {boolean} True if recovery can be attempted
     */
    canAttemptRecovery() {
        const now = Date.now();
        return (
            this.recoveryAttempts.total < this.recoveryAttempts.maxAttempts &&
            now - this.recoveryAttempts.lastAttempt > this.recoveryAttempts.cooldownPeriod
        );
    }

    /**
     * Queue a user notification
     * @param {string} type - Notification type
     * @param {string} message - Notification message
     */
    queueNotification(type, message) {
        const notificationId = `${type}:${message}`;

        // Check for duplicates if suppression is enabled
        if (this.notifications.suppressDuplicates) {
            // Check if already in queue (not just shown)
            const alreadyQueued = this.notifications.queue.some((n) => n.id === notificationId);
            if (alreadyQueued || this.notifications.shown.has(notificationId)) {
                return;
            }
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
        while (this.notifications.queue.length > 0) {
            const notification = this.notifications.queue.shift();
            this.showNotification(notification);
            this.notifications.shown.add(notification.id);
        }
    }

    /**
     * Show notification to user
     * @param {Object} notification - Notification object
     */
    showNotification(notification) {
        // Console notification
        const logLevel =
            notification.type === 'error'
                ? 'error'
                : notification.type === 'warning'
                  ? 'warn'
                  : 'info';
        if (logger[logLevel]) {
            logger[logLevel](`Camera Effects: ${notification.message}`);
        } else {
            logger.info(`Camera Effects: ${notification.message}`);
        }

        // Dispatch custom event for UI integration
        if (typeof window !== 'undefined') {
            window.dispatchEvent(
                new CustomEvent('cameraEffectsError', {
                    detail: notification,
                })
            );
        }
    }

    /**
     * Add entry to error log
     * @param {Object} errorEntry - Error entry object
     */
    addToErrorLog(errorEntry) {
        this.errorLog.push(errorEntry);

        // Limit log size
        if (this.errorLog.length > this.maxLogEntries) {
            this.errorLog.shift();
        }

        // Update debug context
        this.debugInfo.lastErrorContext = {
            type: errorEntry.type,
            context: errorEntry.context,
            timestamp: errorEntry.timestamp,
            message: errorEntry.error.message,
        };
    }

    /**
     * Log message with context
     * @param {string} level - Log level
     * @param {string} message - Log message
     * @param {Object} context - Additional context
     */
    log(level, message, context = {}) {
        if (!this.loggingConfig.enabled) {
            return;
        }

        const logEntry = {
            level: level,
            message: message,
            timestamp: this.loggingConfig.includeTimestamp ? new Date().toISOString() : undefined,
            context: this.loggingConfig.includeContext ? context : undefined,
        };

        // Use the logger instance
        const loggerMethod = logger[level] || logger.info; // Fallback to info if level is not directly supported by logger
        if (this.loggingConfig.includeContext && Object.keys(context).length > 0) {
            loggerMethod(message, context);
        } else {
            loggerMethod(message);
        }
    }

    /**
     * Collect browser information for debugging
     * @returns {Object} Browser information
     */
    collectBrowserInfo() {
        const info = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            hardwareConcurrency: navigator.hardwareConcurrency,
            deviceMemory: navigator.deviceMemory,
            connection: null,
        };

        /** @type {any} */
        const nav = navigator;
        if (nav.connection) {
            info.connection = {
                effectiveType: nav.connection.effectiveType,
                saveData: nav.connection.saveData,
                rtt: nav.connection.rtt,
                downlink: nav.connection.downlink,
            };
        }
        return info;
    }

    /**
     * Collect system information for debugging
     * @returns {Object} System information
     */
    collectSystemInfo() {
        return {
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth,
            },
            window: {
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight,
                devicePixelRatio: window.devicePixelRatio,
            },
            performance: {
                memory: performance.memory
                    ? {
                          usedJSHeapSize: performance.memory.usedJSHeapSize,
                          totalJSHeapSize: performance.memory.totalJSHeapSize,
                          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                      }
                    : null,
                timing: performance.timing
                    ? {
                          navigationStart: performance.timing.navigationStart,
                          loadEventEnd: performance.timing.loadEventEnd,
                      }
                    : null,
            },
        };
    }

    /**
     * Collect WebGL information for debugging
     */
    collectWebGLInfo() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

            if (gl) {
                /** @type {any} */
                const glAny = gl;
                const debugInfoExtension = glAny.getExtension('WEBGL_debug_renderer_info');

                this.debugInfo.webglInfo = {
                    renderer: glAny.getParameter(glAny.RENDERER),
                    vendor: glAny.getParameter(glAny.VENDOR),
                    version: glAny.getParameter(glAny.VERSION),
                    shadingLanguageVersion: glAny.getParameter(glAny.SHADING_LANGUAGE_VERSION),
                    maxTextureSize: glAny.getParameter(glAny.MAX_TEXTURE_SIZE),
                    maxRenderBufferSize: glAny.getParameter(glAny.MAX_RENDERBUFFER_SIZE),
                    maxViewportDims: glAny.getParameter(glAny.MAX_VIEWPORT_DIMS),
                    extensions: glAny.getSupportedExtensions(),
                    unmaskedRenderer: debugInfoExtension
                        ? glAny.getParameter(debugInfoExtension.UNMASKED_RENDERER_WEBGL)
                        : undefined,
                    unmaskedVendor: debugInfoExtension
                        ? glAny.getParameter(debugInfoExtension.UNMASKED_VENDOR_WEBGL)
                        : undefined,
                };
            }
        } catch (error) {
            this.log('warn', 'Failed to collect WebGL info', { error: error.message });
        }
    }

    /**
     * Get error statistics
     * @returns {Object} Error statistics
     */
    getErrorStatistics() {
        return {
            counters: { ...this.errorCounters },
            totalErrors: Object.values(this.errorCounters).reduce((sum, count) => sum + count, 0),
            recoveryAttempts: { ...this.recoveryAttempts },
            recoverySuccessRate:
                this.recoveryAttempts.total > 0
                    ? (this.recoveryAttempts.successful / this.recoveryAttempts.total) * 100
                    : 0,
            recentErrors: this.errorLog.slice(-10),
            fallbackMode: this.fallbackMode,
            effectsDisabled: this.effectsDisabled,
        };
    }

    /**
     * Get debug information
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        return {
            ...this.debugInfo,
            errorStatistics: this.getErrorStatistics(),
            loggingConfig: { ...this.loggingConfig },
        };
    }

    /**
     * Check if there are recoverable errors
     * @returns {boolean} True if there are recoverable errors
     */
    hasRecoverableErrors() {
        const totalErrors = Object.values(this.errorCounters).reduce(
            (sum, count) => sum + count,
            0
        );
        return (
            totalErrors > 0 && totalErrors < this.errorThresholds.disable && !this.effectsDisabled
        );
    }

    /**
     * Reset error counters
     */
    resetErrorCounters() {
        Object.keys(this.errorCounters).forEach((key) => {
            this.errorCounters[key] = 0;
        });

        this.recoveryAttempts.total = 0;
        this.recoveryAttempts.successful = 0;
        this.recoveryAttempts.failed = 0;

        this.log('info', 'Error counters reset');
    }

    /**
     * Get comprehensive status
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            initialized: this.initialized,
            fallbackMode: this.fallbackMode,
            effectsDisabled: this.effectsDisabled,
            errorStatistics: this.getErrorStatistics(),
            canAttemptRecovery: this.canAttemptRecovery(),
            notificationQueueSize: this.notifications.queue.length,
        };
    }

    /**
     * Clean up resources
     */
    destroy() {
        try {
            // Remove event listeners
            if (typeof window !== 'undefined') {
                window.removeEventListener('webglcontextlost', this.handleWebGLContextLost);
                window.removeEventListener('webglcontextrestored', this.handleWebGLContextRestored);
                window.removeEventListener('error', this.handleUnhandledError);
                window.removeEventListener('unhandledrejection', this.handleUnhandledError);
            }

            // Clear references
            this.cameraEffectsManager = null;
            this.degradationManager = null;
            this.motionBlurController = null;
            this.shakeController = null;

            // Clear data
            this.errorLog = [];
            this.notifications.queue = [];
            this.notifications.shown.clear();

            this.initialized = false;

            this.log('info', 'CameraEffectsErrorHandler destroyed');
        } catch (error) {
            logger.error('Error during destruction', error);
        }
    }
}

module.exports = { CameraEffectsErrorHandler };
