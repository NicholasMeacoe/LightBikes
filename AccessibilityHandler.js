/**
 * AccessibilityHandler - Manages accessibility preferences for camera effects
 * Handles system preference detection, user overrides, and effect disabling
 */

class AccessibilityHandler {
    constructor() {
        this.systemPreference = null;
        this.userOverride = null;
        this.mediaQueryList = null;
        this.changeListeners = [];
        
        this.initializeSystemPreferenceDetection();
    }

    /**
     * Initialize system preference detection with media query
     */
    initializeSystemPreferenceDetection() {
        try {
            if (typeof window !== 'undefined' && window.matchMedia) {
                this.mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');
                this.systemPreference = this.mediaQueryList.matches;
                
                // Listen for changes to system preference
                const handleChange = (e) => {
                    const previousPreference = this.systemPreference;
                    this.systemPreference = e.matches;
                    
                    if (previousPreference !== this.systemPreference) {
                        this.notifyListeners();
                    }
                };
                
                // Use modern addEventListener if available, fallback to addListener
                if (this.mediaQueryList.addEventListener) {
                    this.mediaQueryList.addEventListener('change', handleChange);
                } else if (this.mediaQueryList.addListener) {
                    this.mediaQueryList.addListener(handleChange);
                }
            } else {
                // Fallback for environments without matchMedia
                this.systemPreference = false;
            }
        } catch (error) {
            console.warn('Failed to initialize system preference detection:', error);
            this.systemPreference = false;
        }
    }

    /**
     * Get current system preference for reduced motion
     * @returns {boolean} True if system prefers reduced motion
     */
    getSystemPreference() {
        return this.systemPreference;
    }

    /**
     * Set user override for motion preferences
     * @param {boolean|null} override - True to disable effects, false to enable, null to use system preference
     */
    setUserOverride(override) {
        const previousOverride = this.userOverride;
        
        if (override === null || typeof override === 'boolean') {
            this.userOverride = override;
            
            if (previousOverride !== this.userOverride) {
                this.notifyListeners();
            }
        } else {
            console.warn('Invalid user override value. Must be boolean or null.');
        }
    }

    /**
     * Get current user override setting
     * @returns {boolean|null} User override setting
     */
    getUserOverride() {
        return this.userOverride;
    }

    /**
     * Determine if effects should be disabled based on preferences
     * @returns {boolean} True if effects should be disabled
     */
    shouldDisableEffects() {
        // User override takes precedence
        if (this.userOverride !== null) {
            return this.userOverride;
        }
        
        // Fall back to system preference
        return this.systemPreference;
    }

    /**
     * Check if accessibility mode is active (effects disabled)
     * @returns {boolean} True if in accessibility mode
     */
    isAccessibilityModeActive() {
        return this.shouldDisableEffects();
    }

    /**
     * Get accessibility status information
     * @returns {Object} Status object with detailed information
     */
    getAccessibilityStatus() {
        return {
            systemPreference: this.systemPreference,
            userOverride: this.userOverride,
            effectsDisabled: this.shouldDisableEffects(),
            source: this.userOverride !== null ? 'user' : 'system'
        };
    }

    /**
     * Add listener for accessibility preference changes
     * @param {Function} listener - Callback function () => void
     */
    addChangeListener(listener) {
        if (typeof listener === 'function') {
            this.changeListeners.push(listener);
        }
    }

    /**
     * Remove accessibility preference change listener
     * @param {Function} listener - Listener to remove
     */
    removeChangeListener(listener) {
        const index = this.changeListeners.indexOf(listener);
        if (index > -1) {
            this.changeListeners.splice(index, 1);
        }
    }

    /**
     * Notify all change listeners
     */
    notifyListeners() {
        this.changeListeners.forEach(listener => {
            try {
                listener();
            } catch (error) {
                console.error('Error in accessibility change listener:', error);
            }
        });
    }

    /**
     * Apply accessibility settings to effect controllers
     * @param {Object} effectControllers - Object containing effect controllers
     */
    applyToEffectControllers(effectControllers) {
        const shouldDisable = this.shouldDisableEffects();
        
        try {
            // Disable camera shake if controller exists
            if (effectControllers.shakeController && typeof effectControllers.shakeController.setEnabled === 'function') {
                effectControllers.shakeController.setEnabled(!shouldDisable);
            }
            
            // Disable motion blur if controller exists
            if (effectControllers.motionBlurController && typeof effectControllers.motionBlurController.setEnabled === 'function') {
                effectControllers.motionBlurController.setEnabled(!shouldDisable);
            }
            
            // Apply to any other effect controllers
            Object.keys(effectControllers).forEach(key => {
                const controller = effectControllers[key];
                if (controller && typeof controller.setEnabled === 'function' && key !== 'shakeController' && key !== 'motionBlurController') {
                    controller.setEnabled(!shouldDisable);
                }
            });
        } catch (error) {
            console.error('Error applying accessibility settings to effect controllers:', error);
        }
    }

    /**
     * Create accessibility-aware settings object
     * @param {Object} baseSettings - Base settings object
     * @returns {Object} Settings with accessibility overrides applied
     */
    applyAccessibilityOverrides(baseSettings) {
        if (!baseSettings || typeof baseSettings !== 'object') {
            return baseSettings;
        }
        
        const settings = { ...baseSettings };
        
        if (this.shouldDisableEffects()) {
            // Override effect-related settings
            if ('shakeEnabled' in settings) {
                settings.shakeEnabled = false;
            }
            if ('motionBlurEnabled' in settings) {
                settings.motionBlurEnabled = false;
            }
            // Add accessibility flag for UI indication
            settings._accessibilityOverride = true;
        }
        
        return settings;
    }

    /**
     * Get user-friendly description of current accessibility state
     * @returns {string} Description of current state
     */
    getAccessibilityDescription() {
        const status = this.getAccessibilityStatus();
        
        if (status.userOverride === true) {
            return 'Effects disabled by user preference';
        } else if (status.userOverride === false) {
            return 'Effects enabled by user preference (overriding system)';
        } else if (status.systemPreference) {
            return 'Effects disabled by system preference (prefers-reduced-motion)';
        } else {
            return 'Effects enabled (no accessibility restrictions)';
        }
    }

    /**
     * Cleanup resources and event listeners
     */
    destroy() {
        try {
            if (this.mediaQueryList) {
                // Remove event listener if it was added
                if (this.mediaQueryList.removeEventListener) {
                    this.mediaQueryList.removeEventListener('change', this.handleChange);
                } else if (this.mediaQueryList.removeListener) {
                    this.mediaQueryList.removeListener(this.handleChange);
                }
            }
        } catch (error) {
            console.warn('Error during AccessibilityHandler cleanup:', error);
        }
        
        this.changeListeners = [];
        this.mediaQueryList = null;
    }
}

module.exports = { AccessibilityHandler };