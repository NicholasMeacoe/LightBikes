/**
 * PerformanceDegradationManager - Handles graceful degradation for camera effects
 * 
 * This class provides WebGL compatibility checking, performance monitoring with automatic
 * quality adjustment, and memory management for camera effects. It ensures the game
 * remains playable even when advanced effects aren't supported or performance degrades.
 * 
 * Key Features:
 * - WebGL capability detection and fallback handling
 * - Real-time performance monitoring with automatic quality scaling
 * - Memory usage tracking and cleanup
 * - Progressive degradation strategies
 * - Error recovery and user notifications
 * 
 * Usage Example:
 * ```javascript
 * const degradationManager = new PerformanceDegradationManager();
 * 
 * // Initialize with camera effects components
 * degradationManager.initialize(cameraEffectsManager, motionBlurController);
 * 
 * // Monitor performance in game loop
 * degradationManager.update(deltaTime);
 * 
 * // Check if effects should be disabled
 * if (!degradationManager.shouldEnableEffects()) {
 *     cameraEffectsManager.setEnabled(false);
 * }
 * ```
 * 
 * @class PerformanceDegradationManager
 * @author LightBikes Development Team
 * @version 1.0.0
 * @since 2024
 */
class PerformanceDegradationManager {
    constructor() {
        // Component references
        this.cameraEffectsManager = null;
        this.motionBlurController = null;
        this.shakeController = null;
        
        // WebGL capability detection
        this.capabilities = {
            webglSupported: false,
            webgl2Supported: false,
            postProcessingSupported: false,
            floatTextureSupport: false,
            depthTextureSupport: false,
            maxTextureSize: 0,
            maxRenderBufferSize: 0,
            devicePixelRatio: window.devicePixelRatio || 1,
            isMobile: false,
            isLowEndDevice: false,
            gpuTier: 'unknown' // 'high', 'medium', 'low', 'unknown'
        };
        
        // Performance monitoring
        this.performanceMetrics = {
            frameCount: 0,
            totalFrameTime: 0,
            averageFrameTime: 16.67, // 60fps baseline
            minFrameTime: Infinity,
            maxFrameTime: 0,
            lastFrameTime: 0,
            frameHistory: [],
            maxHistoryLength: 300, // 5 seconds at 60fps
            
            // Performance thresholds (in ms)
            criticalFrameTime: 40,    // 25 FPS
            poorFrameTime: 28.57,     // 35 FPS
            acceptableFrameTime: 20,  // 50 FPS
            goodFrameTime: 16.67,     // 60 FPS
            
            // Quality adjustment tracking
            lastQualityAdjustment: 0,
            qualityAdjustmentCooldown: 3000, // 3 seconds
            consecutivePoorFrames: 0,
            consecutiveGoodFrames: 0,
            
            // Memory tracking
            memoryUsage: {
                used: 0,
                total: 0,
                limit: 0
            }
        };
        
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
                { // Level 0 - No degradation
                    name: 'full',
                    motionBlur: true,
                    shake: true,
                    quality: 'high',
                    description: 'All effects enabled at high quality'
                },
                { // Level 1 - Reduce quality
                    name: 'reduced_quality',
                    motionBlur: true,
                    shake: true,
                    quality: 'medium',
                    description: 'Effects enabled at medium quality'
                },
                { // Level 2 - Disable motion blur
                    name: 'shake_only',
                    motionBlur: false,
                    shake: true,
                    quality: 'low',
                    description: 'Camera shake only, motion blur disabled'
                },
                { // Level 3 - Disable all effects
                    name: 'disabled',
                    motionBlur: false,
                    shake: false,
                    quality: 'low',
                    description: 'All camera effects disabled'
                }
            ]
        };
        
        // Error tracking
        this.errorState = {
            webglErrors: 0,
            postProcessingErrors: 0,
            memoryErrors: 0,
            lastError: null,
            errorCooldown: 5000, // 5 seconds
            lastErrorTime: 0,
            maxErrors: 3 // Max errors before fallback
        };
        
        // User notifications
        this.notifications = {
            shown: new Set(),
            queue: [],
            maxQueueSize: 5
        };
        
        // Initialization state
        this.initialized = false;
        this.enabled = true;
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
            
            // Detect WebGL capabilities
            this.detectWebGLCapabilities();
            
            // Detect device characteristics
            this.detectDeviceCharacteristics();
            
            // Initialize memory monitoring if available
            this.initializeMemoryMonitoring();
            
            // Set initial degradation level based on capabilities
            this.setInitialDegradationLevel();
            
            // Start performance monitoring
            this.resetPerformanceMetrics();
            
            this.initialized = true;
            console.log('PerformanceDegradationManager: Initialized successfully');
            console.log('Device capabilities:', this.getCapabilitiesSummary());
            
            return true;
            
        } catch (error) {
            console.error('PerformanceDegradationManager: Initialization failed:', error);
            this.handleError('initialization', error);
            return false;
        }
    }

    /**
     * Detect WebGL capabilities and extensions
     */
    detectWebGLCapabilities() {
        try {
            const canvas = document.createElement('canvas');
            
            // Test WebGL 1.0
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            this.capabilities.webglSupported = !!gl;
            
            if (gl) {
                // Get basic parameters
                this.capabilities.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
                this.capabilities.maxRenderBufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
                
                // Test extensions
                this.capabilities.floatTextureSupport = !!(
                    gl.getExtension('OES_texture_float') || 
                    gl.getExtension('OES_texture_half_float')
                );
                this.capabilities.depthTextureSupport = !!gl.getExtension('WEBGL_depth_texture');
                
                // Test WebGL 2.0
                const gl2 = canvas.getContext('webgl2');
                this.capabilities.webgl2Supported = !!gl2;
                
                // Test post-processing support
                this.capabilities.postProcessingSupported = !!(
                    window.THREE && 
                    THREE.EffectComposer && 
                    THREE.RenderPass && 
                    THREE.ShaderPass
                );
                
                // Estimate GPU tier based on capabilities
                this.estimateGPUTier(gl);
            }
            
            // Clean up test canvas
            canvas.width = 1;
            canvas.height = 1;
            
        } catch (error) {
            console.warn('PerformanceDegradationManager: WebGL capability detection failed:', error);
            this.capabilities.webglSupported = false;
        }
    }

    /**
     * Estimate GPU performance tier
     * @param {WebGLRenderingContext} gl - WebGL context
     */
    estimateGPUTier(gl) {
        try {
            const renderer = gl.getParameter(gl.RENDERER);
            const vendor = gl.getParameter(gl.VENDOR);
            
            // Handle null values gracefully
            if (!renderer || !vendor) {
                this.capabilities.gpuTier = 'unknown';
                return;
            }
            
            // Simple heuristic based on common GPU patterns
            const rendererLower = renderer.toLowerCase();
            const vendorLower = vendor.toLowerCase();
            
            // High-end indicators
            if (rendererLower.includes('rtx') || 
                rendererLower.includes('gtx 1060') ||
                rendererLower.includes('gtx 1070') ||
                rendererLower.includes('gtx 1080') ||
                rendererLower.includes('rx 580') ||
                rendererLower.includes('rx 6') ||
                rendererLower.includes('rx 7')) {
                this.capabilities.gpuTier = 'high';
            }
            // Medium-end indicators
            else if (rendererLower.includes('gtx') ||
                     rendererLower.includes('rx ') ||
                     rendererLower.includes('radeon') ||
                     rendererLower.includes('geforce') ||
                     this.capabilities.maxTextureSize >= 4096) {
                this.capabilities.gpuTier = 'medium';
            }
            // Low-end indicators
            else if (rendererLower.includes('intel') ||
                     rendererLower.includes('integrated') ||
                     this.capabilities.maxTextureSize < 2048) {
                this.capabilities.gpuTier = 'low';
            }
            
            console.log(`GPU detected: ${renderer} (${vendor}) - Tier: ${this.capabilities.gpuTier}`);
            
        } catch (error) {
            console.warn('PerformanceDegradationManager: GPU tier estimation failed:', error);
            this.capabilities.gpuTier = 'unknown';
        }
    }

    /**
     * Detect device characteristics
     */
    detectDeviceCharacteristics() {
        // Mobile detection
        this.capabilities.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Low-end device detection
        this.capabilities.isLowEndDevice = (
            this.capabilities.isMobile ||
            this.capabilities.gpuTier === 'low' ||
            this.capabilities.maxTextureSize < 2048 ||
            navigator.hardwareConcurrency < 4 ||
            (navigator.deviceMemory && navigator.deviceMemory < 4)
        );
        
        console.log(`Device characteristics: Mobile: ${this.capabilities.isMobile}, Low-end: ${this.capabilities.isLowEndDevice}`);
    }

    /**
     * Initialize memory monitoring if available
     */
    initializeMemoryMonitoring() {
        if (performance.memory) {
            this.performanceMetrics.memoryUsage.limit = performance.memory.jsHeapSizeLimit;
            console.log(`Memory monitoring enabled. Limit: ${(this.performanceMetrics.memoryUsage.limit / 1024 / 1024).toFixed(1)}MB`);
        } else {
            console.log('Memory monitoring not available in this browser');
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
            // Update performance metrics
            this.updatePerformanceMetrics(deltaTime);
            
            // Update memory usage if available
            this.updateMemoryUsage();
            
            // Check for automatic quality adjustment
            this.checkPerformanceAdjustment();
            
            // Process notification queue
            this.processNotificationQueue();
            
        } catch (error) {
            console.error('PerformanceDegradationManager: Update error:', error);
            this.handleError('update', error);
        }
    }

    /**
     * Update performance metrics
     * @param {number} deltaTime - Time elapsed since last update in seconds
     */
    updatePerformanceMetrics(deltaTime) {
        const frameTime = deltaTime * 1000; // Convert to milliseconds
        
        // Update basic metrics
        this.performanceMetrics.frameCount++;
        this.performanceMetrics.totalFrameTime += frameTime;
        this.performanceMetrics.averageFrameTime = 
            this.performanceMetrics.totalFrameTime / this.performanceMetrics.frameCount;
        
        this.performanceMetrics.minFrameTime = Math.min(this.performanceMetrics.minFrameTime, frameTime);
        this.performanceMetrics.maxFrameTime = Math.max(this.performanceMetrics.maxFrameTime, frameTime);
        
        // Add to frame history
        const currentTime = Date.now();
        this.performanceMetrics.frameHistory.push({
            frameTime: frameTime,
            timestamp: currentTime,
            fps: 1000 / frameTime
        });
        
        // Limit history size
        if (this.performanceMetrics.frameHistory.length > this.performanceMetrics.maxHistoryLength) {
            this.performanceMetrics.frameHistory.shift();
        }
        
        // Track consecutive poor/good frames
        if (frameTime > this.performanceMetrics.poorFrameTime) {
            this.performanceMetrics.consecutivePoorFrames++;
            this.performanceMetrics.consecutiveGoodFrames = 0;
        } else if (frameTime < this.performanceMetrics.acceptableFrameTime) {
            this.performanceMetrics.consecutiveGoodFrames++;
            this.performanceMetrics.consecutivePoorFrames = 0;
        } else {
            this.performanceMetrics.consecutivePoorFrames = 0;
            this.performanceMetrics.consecutiveGoodFrames = 0;
        }
        
        this.performanceMetrics.lastFrameTime = currentTime;
    }

    /**
     * Update memory usage metrics
     */
    updateMemoryUsage() {
        if (performance.memory) {
            this.performanceMetrics.memoryUsage.used = performance.memory.usedJSHeapSize;
            this.performanceMetrics.memoryUsage.total = performance.memory.totalJSHeapSize;
            
            // Check for memory pressure
            const memoryUsageRatio = this.performanceMetrics.memoryUsage.used / this.performanceMetrics.memoryUsage.limit;
            
            if (memoryUsageRatio > 0.9) {
                console.warn('PerformanceDegradationManager: High memory usage detected:', 
                    `${(memoryUsageRatio * 100).toFixed(1)}%`);
                
                // Trigger memory cleanup
                this.triggerMemoryCleanup();
            }
        }
    }

    /**
     * Check if performance adjustment is needed
     */
    checkPerformanceAdjustment() {
        const currentTime = Date.now();
        
        // Only adjust after cooldown period
        if (currentTime - this.performanceMetrics.lastQualityAdjustment < 
            this.performanceMetrics.qualityAdjustmentCooldown) {
            return;
        }
        
        // Need sufficient frame history for reliable analysis
        if (this.performanceMetrics.frameHistory.length < 60) {
            return;
        }
        
        const recentFrames = this.performanceMetrics.frameHistory.slice(-60);
        const averageRecentFrameTime = recentFrames.reduce((sum, frame) => sum + frame.frameTime, 0) / recentFrames.length;
        const worstRecentFrameTime = Math.max(...recentFrames.map(frame => frame.frameTime));
        
        // Determine if degradation is needed
        let targetLevel = this.degradationState.currentLevel;
        
        // Degrade if performance is consistently poor
        if (averageRecentFrameTime > this.performanceMetrics.poorFrameTime ||
            worstRecentFrameTime > this.performanceMetrics.criticalFrameTime ||
            this.performanceMetrics.consecutivePoorFrames > 30) {
            
            if (this.degradationState.currentLevel < this.degradationState.maxLevel) {
                targetLevel = this.degradationState.currentLevel + 1;
                console.log(`PerformanceDegradationManager: Performance degradation triggered. Avg: ${averageRecentFrameTime.toFixed(1)}ms, Worst: ${worstRecentFrameTime.toFixed(1)}ms`);
            }
        }
        // Improve if performance is consistently good
        else if (averageRecentFrameTime < this.performanceMetrics.goodFrameTime &&
                 worstRecentFrameTime < this.performanceMetrics.acceptableFrameTime &&
                 this.performanceMetrics.consecutiveGoodFrames > 120) {
            
            if (this.degradationState.currentLevel > 0) {
                targetLevel = this.degradationState.currentLevel - 1;
                console.log(`PerformanceDegradationManager: Performance improvement detected. Avg: ${averageRecentFrameTime.toFixed(1)}ms`);
            }
        }
        
        // Apply level change if needed
        if (targetLevel !== this.degradationState.currentLevel) {
            this.setDegradationLevel(targetLevel);
            this.performanceMetrics.lastQualityAdjustment = currentTime;
        }
    }

    /**
     * Set degradation level and apply changes
     * @param {number} level - Degradation level (0-3)
     */
    setDegradationLevel(level) {
        if (level < 0 || level > this.degradationState.maxLevel) {
            console.warn(`PerformanceDegradationManager: Invalid degradation level: ${level}`);
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
            console.log(`PerformanceDegradationManager: Degradation level changed from ${previousLevel} to ${level}: ${config.description}`);
            
            // Queue user notification for significant changes
            if (level > previousLevel && level > 0) {
                this.queueNotification(
                    'degradation',
                    `Camera effects reduced to maintain performance: ${config.description}`
                );
            } else if (level < previousLevel) {
                this.queueNotification(
                    'improvement',
                    `Camera effects restored: ${config.description}`
                );
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
                if (this.degradationState.motionBlurEnabled) {
                    this.motionBlurController.setQuality(this.degradationState.qualityLevel);
                }
            }
            
            // Apply to shake controller
            if (this.shakeController) {
                this.shakeController.setEnabled(this.degradationState.shakeEnabled);
            }
            
        } catch (error) {
            console.error('PerformanceDegradationManager: Error applying degradation settings:', error);
            this.handleError('settings', error);
        }
    }

    /**
     * Trigger memory cleanup
     */
    triggerMemoryCleanup() {
        try {
            // Force garbage collection if available
            if (window.gc) {
                window.gc();
            }
            
            // Clean up component caches
            if (this.motionBlurController && typeof this.motionBlurController.resetPerformanceMetrics === 'function') {
                this.motionBlurController.resetPerformanceMetrics();
            }
            
            // Clean up our own history
            if (this.performanceMetrics.frameHistory.length > 60) {
                this.performanceMetrics.frameHistory = this.performanceMetrics.frameHistory.slice(-60);
            }
            
            console.log('PerformanceDegradationManager: Memory cleanup triggered');
            
        } catch (error) {
            console.error('PerformanceDegradationManager: Memory cleanup failed:', error);
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
        const totalErrors = this.errorState.webglErrors + 
                           this.errorState.postProcessingErrors + 
                           this.errorState.memoryErrors;
        
        if (totalErrors >= this.errorState.maxErrors) {
            console.warn('PerformanceDegradationManager: Maximum errors reached, entering fallback mode');
            this.setDegradationLevel(this.degradationState.maxLevel);
            
            this.queueNotification(
                'error',
                'Camera effects disabled due to technical issues'
            );
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
                timestamp: Date.now()
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
        // Simple console notification for now
        // In a full implementation, this would show UI notifications
        console.info(`Camera Effects: ${notification.message}`);
        
        // Could dispatch custom event for UI to handle
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('cameraEffectsNotification', {
                detail: notification
            }));
        }
    }

    /**
     * Check if effects should be enabled based on current state
     * @returns {boolean} True if effects should be enabled
     */
    shouldEnableEffects() {
        return this.initialized && 
               this.enabled && 
               this.degradationState.effectsEnabled &&
               this.capabilities.webglSupported;
    }

    /**
     * Check if motion blur should be enabled
     * @returns {boolean} True if motion blur should be enabled
     */
    shouldEnableMotionBlur() {
        return this.shouldEnableEffects() && 
               this.degradationState.motionBlurEnabled &&
               this.capabilities.postProcessingSupported;
    }

    /**
     * Check if camera shake should be enabled
     * @returns {boolean} True if camera shake should be enabled
     */
    shouldEnableShake() {
        return this.shouldEnableEffects() && 
               this.degradationState.shakeEnabled;
    }

    /**
     * Get current performance metrics
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        const recentFrames = this.performanceMetrics.frameHistory.slice(-60);
        const currentFPS = recentFrames.length > 0 ? 
            recentFrames.reduce((sum, frame) => sum + frame.fps, 0) / recentFrames.length : 0;
        
        return {
            frameCount: this.performanceMetrics.frameCount,
            averageFrameTime: this.performanceMetrics.averageFrameTime,
            currentFPS: currentFPS,
            minFrameTime: this.performanceMetrics.minFrameTime,
            maxFrameTime: this.performanceMetrics.maxFrameTime,
            consecutivePoorFrames: this.performanceMetrics.consecutivePoorFrames,
            consecutiveGoodFrames: this.performanceMetrics.consecutiveGoodFrames,
            memoryUsage: { ...this.performanceMetrics.memoryUsage }
        };
    }

    /**
     * Get capabilities summary
     * @returns {Object} Capabilities summary
     */
    getCapabilitiesSummary() {
        return {
            webgl: this.capabilities.webglSupported,
            webgl2: this.capabilities.webgl2Supported,
            postProcessing: this.capabilities.postProcessingSupported,
            maxTextureSize: this.capabilities.maxTextureSize,
            gpuTier: this.capabilities.gpuTier,
            isMobile: this.capabilities.isMobile,
            isLowEndDevice: this.capabilities.isLowEndDevice
        };
    }

    /**
     * Get current degradation state
     * @returns {Object} Degradation state
     */
    getDegradationState() {
        return {
            level: this.degradationState.currentLevel,
            description: this.degradationState.levels[this.degradationState.currentLevel].description,
            effectsEnabled: this.degradationState.effectsEnabled,
            motionBlurEnabled: this.degradationState.motionBlurEnabled,
            shakeEnabled: this.degradationState.shakeEnabled,
            qualityLevel: this.degradationState.qualityLevel
        };
    }

    /**
     * Reset performance metrics
     */
    resetPerformanceMetrics() {
        this.performanceMetrics.frameCount = 0;
        this.performanceMetrics.totalFrameTime = 0;
        this.performanceMetrics.averageFrameTime = 16.67;
        this.performanceMetrics.minFrameTime = Infinity;
        this.performanceMetrics.maxFrameTime = 0;
        this.performanceMetrics.frameHistory = [];
        this.performanceMetrics.consecutivePoorFrames = 0;
        this.performanceMetrics.consecutiveGoodFrames = 0;
        this.performanceMetrics.lastQualityAdjustment = 0;
    }

    /**
     * Enable or disable the degradation manager
     * @param {boolean} enabled - Whether to enable the manager
     */
    setEnabled(enabled) {
        this.enabled = Boolean(enabled);
        
        if (!this.enabled) {
            // Reset to no degradation when disabled
            this.setDegradationLevel(0);
        }
    }

    /**
     * Get comprehensive status information
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            initialized: this.initialized,
            enabled: this.enabled,
            capabilities: this.getCapabilitiesSummary(),
            performance: this.getPerformanceMetrics(),
            degradation: this.getDegradationState(),
            errors: {
                webgl: this.errorState.webglErrors,
                postProcessing: this.errorState.postProcessingErrors,
                memory: this.errorState.memoryErrors,
                lastError: this.errorState.lastError
            }
        };
    }

    /**
     * Clean up resources
     */
    destroy() {
        try {
            this.cameraEffectsManager = null;
            this.motionBlurController = null;
            this.shakeController = null;
            
            this.performanceMetrics.frameHistory = [];
            this.notifications.queue = [];
            this.notifications.shown.clear();
            
            this.initialized = false;
            
            console.log('PerformanceDegradationManager: Destroyed');
            
        } catch (error) {
            console.error('PerformanceDegradationManager: Error during destruction:', error);
        }
    }
}

module.exports = { PerformanceDegradationManager };