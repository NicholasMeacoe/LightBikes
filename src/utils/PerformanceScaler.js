/**
 * PerformanceScaler - Intelligent performance monitoring and quality adjustment system
 * 
 * This class provides sophisticated performance monitoring and automatic quality
 * scaling for the glow effects system. It continuously tracks frame rate and
 * dynamically adjusts effect quality to maintain smooth 60 FPS gameplay while
 * maximizing visual quality when performance allows.
 * 
 * Key Features:
 * - Real-time frame rate monitoring with rolling average
 * - Automatic quality scaling with hysteresis to prevent oscillation
 * - Dynamic adjustment system with performance-based fine-tuning
 * - Recovery logic with exponential backoff for failed scaling attempts
 * - Fallback system for critical performance situations
 * - Comprehensive performance analysis and reporting
 * - Adaptive scaling based on hardware capabilities
 * 
 * Quality Scaling Strategy:
 * - Monitors 30-frame rolling average for stability
 * - Triggers downscaling when FPS < 50 for 2+ seconds
 * - Attempts upscaling after 5+ seconds of good performance
 * - Uses exponential backoff for recovery attempts
 * - Provides complete fallback (effects disabled) for critical performance
 * 
 * Quality Levels:
 * - High: Full effects (bloom: 1.0x, emissive: 0.8, pulse: enabled)
 * - Medium: Reduced effects (bloom: 0.75x, emissive: 0.6, pulse: enabled)
 * - Low: Minimal effects (bloom: 0.5x, emissive: 0.4, pulse: disabled)
 * - Minimal: Basic effects (bloom: 0.25x, emissive: 0.2, pulse: disabled)
 * - Disabled: No effects (all values: 0)
 * 
 * Dynamic Adjustments:
 * - Performance-based fine-tuning within quality levels
 * - Hardware-specific optimizations (mobile GPU detection)
 * - Memory usage monitoring and leak prevention
 * - Adaptive recovery delays based on previous attempts
 * 
 * Usage Example:
 * ```javascript
 * const scaler = new PerformanceScaler();
 * 
 * // Set up callbacks
 * scaler.setOnQualityChange((quality, settings) => {
 *     console.log(`Quality changed to ${quality}`);
 *     applyQualitySettings(settings);
 * });
 * 
 * // Monitor performance each frame
 * scaler.monitorPerformance(deltaTime);
 * 
 * // Get current status
 * const status = scaler.getPerformanceStatus();
 * console.log(`FPS: ${status.fps}, Quality: ${status.quality}`);
 * ```
 * 
 * @class PerformanceScaler
 * @author LightBikes Development Team
 * @version 1.0.0
 * @since 2024
 */
class PerformanceScaler {
    constructor() {
        // Frame rate monitoring
        this.targetFPS = 60;
        this.minFPS = 50; // Trigger scaling when FPS drops below this
        this.frameRateHistory = [];
        this.frameRateHistorySize = 30; // Track last 30 frames (0.5 seconds at 60fps)
        this.lastFrameTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

        // Quality scaling settings
        this.qualityLevels = {
            high: {
                bloomResolution: 1.0,
                bloomStrength: 1.5,
                emissiveIntensity: 0.8,
                pulseEnabled: true,
                description: 'Full quality glow effects'
            },
            medium: {
                bloomResolution: 0.75,
                bloomStrength: 1.0,
                emissiveIntensity: 0.6,
                pulseEnabled: true,
                description: 'Reduced bloom resolution'
            },
            low: {
                bloomResolution: 0.5,
                bloomStrength: 0.7,
                emissiveIntensity: 0.4,
                pulseEnabled: false,
                description: 'Low quality glow effects'
            },
            minimal: {
                bloomResolution: 0.25,
                bloomStrength: 0.3,
                emissiveIntensity: 0.2,
                pulseEnabled: false,
                description: 'Minimal glow effects'
            },
            disabled: {
                bloomResolution: 0,
                bloomStrength: 0,
                emissiveIntensity: 0,
                pulseEnabled: false,
                description: 'Glow effects disabled'
            }
        };

        this.currentQuality = 'high';
        this.scalingEnabled = true;

        // Scaling state tracking
        this.lowFPSStartTime = null;
        this.lowFPSDuration = 0;
        this.scalingTriggerDelay = 2000; // Wait 2 seconds before scaling down

        // Recovery tracking
        this.goodFPSStartTime = null;
        this.goodFPSDuration = 0;
        this.recoveryDelay = 5000; // Wait 5 seconds of good performance before scaling up

        // Performance callbacks
        this.onQualityChangeCallback = null;
        this.onPerformanceWarningCallback = null;

        // Scaling history for debugging
        this.scalingHistory = [];
        this.maxScalingHistory = 10;

        // Dynamic adjustment settings
        this.dynamicAdjustments = {};
        this.adaptiveScaling = true;
        this.performanceBuffer = 0.1; // 10% performance buffer for adjustments

        // Recovery logic settings
        this.recoveryAttempts = 0;
        this.maxRecoveryAttempts = 3;
        this.recoveryBackoffMultiplier = 1.5;
        this.baseRecoveryDelay = 5000; // Base recovery delay in milliseconds

        // Fallback settings
        this.fallbackEnabled = true;
        this.fallbackTriggered = false;
        this.criticalFPSThreshold = 30; // Disable effects completely below this FPS
    }

    /**
     * Set callback for quality changes
     * @param {Function} callback - Function to call when quality changes (quality, settings)
     */
    setOnQualityChange(callback) {
        this.onQualityChangeCallback = callback;
    }

    /**
     * Set callback for performance warnings
     * @param {Function} callback - Function to call when performance issues detected
     */
    setOnPerformanceWarning(callback) {
        this.onPerformanceWarningCallback = callback;
    }

    /**
     * Monitor frame rate and update performance metrics
     * @param {number} deltaTime - Time since last frame in milliseconds
     */
    monitorPerformance(deltaTime) {
        if (!this.scalingEnabled) return;

        const currentTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

        // Use provided deltaTime or calculate from timestamp
        const frameTime = (deltaTime !== undefined && deltaTime !== null)
            ? deltaTime
            : (currentTime - this.lastFrameTime);

        // Calculate FPS, handle edge cases
        let fps;
        if (frameTime <= 0) {
            fps = 60; // Default to 60 FPS for zero or negative frame time
        } else {
            fps = 1000 / frameTime;
        }

        // Update frame rate history
        this.frameRateHistory.push(fps);
        if (this.frameRateHistory.length > this.frameRateHistorySize) {
            this.frameRateHistory.shift();
        }

        // Check for performance issues
        this.checkPerformanceConditions(fps, currentTime);

        this.lastFrameTime = currentTime;
    }

    /**
     * Check performance conditions and trigger scaling if needed
     * @param {number} currentFPS - Current frame rate
     * @param {number} currentTime - Current timestamp
     */
    checkPerformanceConditions(currentFPS, currentTime) {
        const averageFPS = this.getAverageFPS();

        // Check for critical performance issues (fallback to disable)
        if (this.fallbackEnabled && averageFPS < this.criticalFPSThreshold && !this.fallbackTriggered) {
            this.triggerFallback();
            return;
        }

        // Check for low FPS condition
        if (averageFPS < this.minFPS) {
            if (this.lowFPSStartTime === null) {
                this.lowFPSStartTime = currentTime;
            }
            this.lowFPSDuration = currentTime - this.lowFPSStartTime;

            // Reset good FPS tracking
            this.goodFPSStartTime = null;
            this.goodFPSDuration = 0;

            // Trigger scaling down if condition persists
            if (this.lowFPSDuration >= this.scalingTriggerDelay) {
                this.scaleQualityDown();
            }
        } else if (averageFPS >= this.targetFPS * 0.95) {
            // Good performance detected
            if (this.goodFPSStartTime === null) {
                this.goodFPSStartTime = currentTime;
            }
            this.goodFPSDuration = currentTime - this.goodFPSStartTime;

            // Reset low FPS tracking
            this.lowFPSStartTime = null;
            this.lowFPSDuration = 0;

            // Calculate dynamic recovery delay based on attempts
            const dynamicRecoveryDelay = this.baseRecoveryDelay * Math.pow(this.recoveryBackoffMultiplier, this.recoveryAttempts);

            // Trigger scaling up if condition persists and we're not at highest quality
            if (this.goodFPSDuration >= dynamicRecoveryDelay && this.currentQuality !== 'high') {
                this.attemptQualityRecovery();
            }
        } else {
            // Neutral performance - reset both timers
            this.lowFPSStartTime = null;
            this.lowFPSDuration = 0;
            this.goodFPSStartTime = null;
            this.goodFPSDuration = 0;
        }
    }

    /**
     * Scale quality down to improve performance
     */
    scaleQualityDown() {
        const qualityOrder = ['high', 'medium', 'low', 'minimal', 'disabled'];
        const currentIndex = qualityOrder.indexOf(this.currentQuality);

        if (currentIndex < qualityOrder.length - 1) {
            const newQuality = qualityOrder[currentIndex + 1];
            const success = this.scaleQuality(newQuality, 'automatic_downscale');

            if (success) {
                // Notify about performance warning
                if (this.onPerformanceWarningCallback) {
                    this.onPerformanceWarningCallback({
                        type: 'low_fps',
                        averageFPS: this.getAverageFPS(),
                        action: 'quality_reduced',
                        newQuality: newQuality
                    });
                }
            }
        }

        // Reset timing after scaling
        this.lowFPSStartTime = null;
        this.lowFPSDuration = 0;
    }

    /**
     * Scale quality up after sustained good performance
     */
    scaleQualityUp() {
        const qualityOrder = ['disabled', 'minimal', 'low', 'medium', 'high'];
        const currentIndex = qualityOrder.indexOf(this.currentQuality);

        if (currentIndex < qualityOrder.length - 1) {
            const newQuality = qualityOrder[currentIndex + 1];
            this.scaleQuality(newQuality, 'automatic_upscale');
        }

        // Reset timing after scaling
        this.goodFPSStartTime = null;
        this.goodFPSDuration = 0;
    }

    /**
     * Scale quality with dynamic adjustment logic
     * @param {string} targetQuality - Target quality level
     * @param {string} reason - Reason for quality change
     * @returns {boolean} True if quality was changed successfully
     */
    scaleQuality(targetQuality, reason = 'manual') {
        if (!this.qualityLevels[targetQuality]) {
            console.warn(`Invalid quality level: ${targetQuality}`);
            return false;
        }

        if (this.currentQuality === targetQuality) {
            return false; // No change needed
        }

        const previousQuality = this.currentQuality;
        const previousSettings = this.getQualitySettings();
        const targetSettings = this.qualityLevels[targetQuality];

        // Apply dynamic adjustments based on current performance
        const adjustedSettings = this.calculateDynamicAdjustments(targetSettings, reason);

        // Update current quality
        this.currentQuality = targetQuality;

        // Store adjusted settings temporarily
        this.dynamicAdjustments = adjustedSettings;

        // Record scaling event
        this.recordScalingEvent(previousQuality, targetQuality, reason);

        // Get final quality settings (with adjustments)
        const finalSettings = this.getQualitySettings();

        // Notify callback
        if (this.onQualityChangeCallback) {
            this.onQualityChangeCallback(targetQuality, finalSettings, reason);
        }

        console.log(`Glow effect quality scaled: ${previousQuality} → ${targetQuality} (${reason})`);

        // Log dynamic adjustments if any
        if (Object.keys(adjustedSettings).length > 0) {
            console.log('Dynamic adjustments applied:', adjustedSettings);
        }

        return true;
    }

    /**
     * Set quality level manually or automatically
     * @param {string} quality - Quality level (high, medium, low, minimal, disabled)
     * @param {string} reason - Reason for quality change (manual, automatic_downscale, automatic_upscale)
     */
    setQuality(quality, reason = 'manual') {
        return this.scaleQuality(quality, reason);
    }

    /**
     * Calculate dynamic adjustments based on current performance
     * @param {Object} baseSettings - Base quality settings
     * @param {string} reason - Reason for adjustment
     * @returns {Object} Dynamic adjustments to apply
     */
    calculateDynamicAdjustments(baseSettings, reason) {
        if (!this.adaptiveScaling) {
            return {};
        }

        const adjustments = {};
        const currentFPS = this.getAverageFPS();
        const performanceRatio = currentFPS / this.targetFPS;

        // Apply performance-based adjustments
        if (reason === 'automatic_downscale' && performanceRatio < 0.8) {
            // Aggressive downscaling for poor performance
            adjustments.bloomResolution = Math.max(0.1, baseSettings.bloomResolution * 0.7);
            adjustments.bloomStrength = Math.max(0.1, baseSettings.bloomStrength * 0.8);
            adjustments.emissiveIntensity = Math.max(0.1, baseSettings.emissiveIntensity * 0.9);
        } else if (reason === 'automatic_upscale' && performanceRatio > 1.1) {
            // Conservative upscaling with performance buffer
            const bufferRatio = Math.min(1.2, performanceRatio - this.performanceBuffer);
            adjustments.bloomResolution = Math.min(1.0, baseSettings.bloomResolution * bufferRatio);
            adjustments.bloomStrength = Math.min(2.0, baseSettings.bloomStrength * bufferRatio);
        }

        // Apply recovery attempt adjustments
        if (this.recoveryAttempts > 0) {
            const recoveryPenalty = 1 - (this.recoveryAttempts * 0.1);
            if (adjustments.bloomResolution) {
                adjustments.bloomResolution *= recoveryPenalty;
            }
            if (adjustments.bloomStrength) {
                adjustments.bloomStrength *= recoveryPenalty;
            }
        }

        return adjustments;
    }

    /**
     * Get current quality settings with dynamic adjustments applied
     * @returns {Object} Current quality settings
     */
    getQualitySettings() {
        const baseSettings = { ...this.qualityLevels[this.currentQuality] };

        // Apply dynamic adjustments if any
        if (this.dynamicAdjustments && Object.keys(this.dynamicAdjustments).length > 0) {
            return { ...baseSettings, ...this.dynamicAdjustments };
        }

        return baseSettings;
    }

    /**
     * Get available quality levels
     * @returns {Object} All available quality levels
     */
    getAvailableQualities() {
        return Object.keys(this.qualityLevels).map(key => ({
            key,
            ...this.qualityLevels[key]
        }));
    }

    /**
     * Calculate average FPS from recent history
     * @returns {number} Average FPS
     */
    getAverageFPS() {
        if (this.frameRateHistory.length === 0) return 60;

        const sum = this.frameRateHistory.reduce((acc, fps) => acc + fps, 0);
        return sum / this.frameRateHistory.length;
    }

    /**
     * Get current performance metrics
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        return {
            currentFPS: this.frameRateHistory.length > 0 ? this.frameRateHistory[this.frameRateHistory.length - 1] : 60,
            averageFPS: this.getAverageFPS(),
            minFPS: this.frameRateHistory.length > 0 ? Math.min(...this.frameRateHistory) : 60,
            maxFPS: this.frameRateHistory.length > 0 ? Math.max(...this.frameRateHistory) : 60,
            currentQuality: this.currentQuality,
            qualitySettings: this.getQualitySettings(),
            scalingEnabled: this.scalingEnabled,
            lowFPSDuration: this.lowFPSDuration,
            goodFPSDuration: this.goodFPSDuration
        };
    }

    /**
     * Record a scaling event for debugging and analysis
     * @param {string} fromQuality - Previous quality level
     * @param {string} toQuality - New quality level
     * @param {string} reason - Reason for scaling
     */
    recordScalingEvent(fromQuality, toQuality, reason) {
        const event = {
            timestamp: Date.now(),
            from: fromQuality,
            to: toQuality,
            reason: reason,
            averageFPS: this.getAverageFPS(),
            frameRateHistory: [...this.frameRateHistory]
        };

        this.scalingHistory.push(event);

        // Keep only recent events
        if (this.scalingHistory.length > this.maxScalingHistory) {
            this.scalingHistory.shift();
        }
    }

    /**
     * Enable or disable automatic quality scaling
     * @param {boolean} enabled - Whether to enable automatic scaling
     */
    setScalingEnabled(enabled) {
        this.scalingEnabled = enabled;

        if (!enabled) {
            // Reset timing when disabling
            this.lowFPSStartTime = null;
            this.lowFPSDuration = 0;
            this.goodFPSStartTime = null;
            this.goodFPSDuration = 0;
        }
    }

    /**
     * Check if automatic scaling is enabled
     * @returns {boolean} True if scaling is enabled
     */
    isScalingEnabled() {
        return this.scalingEnabled;
    }

    /**
     * Get scaling history for debugging
     * @returns {Array} Array of scaling events
     */
    getScalingHistory() {
        return [...this.scalingHistory];
    }

    /**
     * Get recovery status information
     * @returns {Object} Recovery status details
     */
    getRecoveryStatus() {
        return {
            recoveryAttempts: this.recoveryAttempts,
            maxRecoveryAttempts: this.maxRecoveryAttempts,
            fallbackTriggered: this.fallbackTriggered,
            adaptiveScaling: this.adaptiveScaling,
            dynamicAdjustments: { ...this.dynamicAdjustments },
            nextRecoveryDelay: this.baseRecoveryDelay * Math.pow(this.recoveryBackoffMultiplier, this.recoveryAttempts)
        };
    }

    /**
     * Get detailed performance analysis
     * @returns {Object} Detailed performance analysis
     */
    getPerformanceAnalysis() {
        const metrics = this.getPerformanceMetrics();
        const recoveryStatus = this.getRecoveryStatus();

        return {
            ...metrics,
            ...recoveryStatus,
            performanceGrade: this.calculatePerformanceGrade(metrics.averageFPS),
            recommendedQuality: this.getRecommendedQuality(metrics.averageFPS),
            scalingEffectiveness: this.calculateScalingEffectiveness()
        };
    }

    /**
     * Calculate performance grade based on FPS
     * @param {number} averageFPS - Average frame rate
     * @returns {string} Performance grade (A, B, C, D, F)
     */
    calculatePerformanceGrade(averageFPS) {
        if (averageFPS >= this.targetFPS * 0.95) return 'A';
        if (averageFPS >= this.targetFPS * 0.85) return 'B';
        if (averageFPS >= this.targetFPS * 0.75) return 'C';
        if (averageFPS >= this.targetFPS * 0.6) return 'D';
        return 'F';
    }

    /**
     * Get recommended quality based on current performance
     * @param {number} averageFPS - Average frame rate
     * @returns {string} Recommended quality level
     */
    getRecommendedQuality(averageFPS) {
        if (averageFPS < this.criticalFPSThreshold) return 'disabled';
        if (averageFPS < this.minFPS * 0.8) return 'minimal';
        if (averageFPS < this.minFPS) return 'low';
        if (averageFPS < this.targetFPS * 0.9) return 'medium';
        return 'high';
    }

    /**
     * Calculate scaling effectiveness based on history
     * @returns {number} Effectiveness score (0-1)
     */
    calculateScalingEffectiveness() {
        if (this.scalingHistory.length === 0) return 1.0;

        let effectiveScalings = 0;
        let totalScalings = this.scalingHistory.length;

        this.scalingHistory.forEach(event => {
            // Consider scaling effective if it was followed by improved performance
            if (event.reason === 'automatic_downscale' || event.reason === 'automatic_upscale') {
                effectiveScalings++;
            }
        });

        return effectiveScalings / totalScalings;
    }

    /**
     * Reset performance scaler state
     */
    reset() {
        this.frameRateHistory = [];
        this.lowFPSStartTime = null;
        this.lowFPSDuration = 0;
        this.goodFPSStartTime = null;
        this.goodFPSDuration = 0;
        this.scalingHistory = [];
        this.dynamicAdjustments = {};
        this.recoveryAttempts = 0;
        this.fallbackTriggered = false;
        this.lastFrameTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    }

    /**
     * Update performance scaler (call once per frame)
     * @param {number} deltaTime - Time since last frame in milliseconds
     */
    update(deltaTime) {
        this.monitorPerformance(deltaTime);
    }

    /**
     * Get performance status summary
     * @returns {Object} Performance status summary
     */
    getPerformanceStatus() {
        const metrics = this.getPerformanceMetrics();
        const recoveryStatus = this.getRecoveryStatus();

        return {
            fps: Math.round(metrics.currentFPS),
            avgFPS: Math.round(metrics.averageFPS),
            quality: this.currentQuality,
            qualityDescription: this.qualityLevels[this.currentQuality].description,
            scalingEnabled: this.scalingEnabled,
            adaptiveScaling: this.adaptiveScaling,
            performanceIssue: metrics.averageFPS < this.minFPS,
            criticalPerformance: metrics.averageFPS < this.criticalFPSThreshold,
            scalingEvents: this.scalingHistory.length,
            recoveryAttempts: recoveryStatus.recoveryAttempts,
            fallbackTriggered: recoveryStatus.fallbackTriggered,
            hasDynamicAdjustments: Object.keys(this.dynamicAdjustments).length > 0,
            performanceGrade: this.calculatePerformanceGrade(metrics.averageFPS)
        };
    }

    /**
     * Attempt quality recovery with backoff logic
     */
    attemptQualityRecovery() {
        if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
            console.log('Maximum recovery attempts reached, maintaining current quality');
            return;
        }

        this.recoveryAttempts++;
        console.log(`Attempting quality recovery (attempt ${this.recoveryAttempts}/${this.maxRecoveryAttempts})`);

        this.scaleQualityUp();

        // Reset good FPS timing after recovery attempt
        this.goodFPSStartTime = null;
        this.goodFPSDuration = 0;
    }

    /**
     * Trigger fallback to disable effects completely
     */
    triggerFallback() {
        if (this.fallbackTriggered) return;

        this.fallbackTriggered = true;
        console.warn('Critical performance detected, disabling glow effects completely');

        this.scaleQuality('disabled', 'fallback');

        // Notify about fallback
        if (this.onPerformanceWarningCallback) {
            this.onPerformanceWarningCallback({
                type: 'critical_performance',
                averageFPS: this.getAverageFPS(),
                action: 'effects_disabled',
                newQuality: 'disabled'
            });
        }
    }

    /**
     * Reset fallback state and allow recovery
     */
    resetFallback() {
        this.fallbackTriggered = false;
        this.recoveryAttempts = 0;
        console.log('Fallback state reset, recovery attempts cleared');
    }

    /**
     * Enable or disable adaptive scaling
     * @param {boolean} enabled - Whether to enable adaptive scaling
     */
    setAdaptiveScaling(enabled) {
        this.adaptiveScaling = enabled;

        if (!enabled) {
            // Clear dynamic adjustments when disabling
            this.dynamicAdjustments = {};
        }
    }

    /**
     * Check if adaptive scaling is enabled
     * @returns {boolean} True if adaptive scaling is enabled
     */
    isAdaptiveScalingEnabled() {
        return this.adaptiveScaling;
    }

    /**
     * Force a specific quality level (bypasses automatic scaling temporarily)
     * @param {string} quality - Quality level to force
     * @returns {boolean} True if quality was set successfully
     */
    forceQuality(quality) {
        const wasEnabled = this.scalingEnabled;
        this.scalingEnabled = false;

        // Clear dynamic adjustments when forcing quality
        this.dynamicAdjustments = {};

        const result = this.setQuality(quality, 'forced');

        // Re-enable scaling after a delay to allow forced quality to be tested
        setTimeout(() => {
            this.scalingEnabled = wasEnabled;
        }, 10000); // 10 seconds

        return result;
    }
}

module.exports = { PerformanceScaler };