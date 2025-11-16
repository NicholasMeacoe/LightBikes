/**
 * IntensityConfigManager - Manages intensity configuration for camera effects
 * Handles shake intensity settings with proportional scaling and immediate application
 */

class IntensityConfigManager {
    constructor() {
        this.intensityLevels = {
            'off': 0.0,
            'low': 0.3,
            'medium': 1.0,
            'high': 2.0
        };
        
        this.currentIntensityLevel = 'medium';
        this.customIntensityValue = null;
        this.changeListeners = [];
        
        // Effect type multipliers for different shake types
        this.effectMultipliers = {
            collision: 1.0,      // Base multiplier for collision shakes
            nearMiss: 0.2        // Near-miss shakes are 20% of collision intensity
        };
    }

    /**
     * Set intensity level using predefined levels
     * @param {string} level - Intensity level ('off', 'low', 'medium', 'high')
     * @returns {boolean} True if level was valid and applied
     */
    setIntensityLevel(level) {
        if (!this.intensityLevels.hasOwnProperty(level)) {
            console.warn(`Invalid intensity level: ${level}. Valid levels:`, Object.keys(this.intensityLevels));
            return false;
        }
        
        const previousLevel = this.currentIntensityLevel;
        const previousValue = this.getEffectiveIntensity();
        
        this.currentIntensityLevel = level;
        this.customIntensityValue = null; // Clear custom value when using preset
        
        const newValue = this.getEffectiveIntensity();
        
        if (previousLevel !== level || previousValue !== newValue) {
            this.notifyListeners(level, newValue, previousLevel, previousValue);
        }
        
        return true;
    }

    /**
     * Set custom intensity value
     * @param {number} intensity - Custom intensity value (0.0 to 2.0)
     * @returns {boolean} True if intensity was valid and applied
     */
    setCustomIntensity(intensity) {
        const numericIntensity = Number(intensity);
        
        if (isNaN(numericIntensity) || numericIntensity < 0.0 || numericIntensity > 2.0) {
            console.warn(`Invalid custom intensity: ${intensity}. Must be between 0.0 and 2.0`);
            return false;
        }
        
        const previousLevel = this.currentIntensityLevel;
        const previousValue = this.getEffectiveIntensity();
        
        this.customIntensityValue = numericIntensity;
        this.currentIntensityLevel = 'custom';
        
        this.notifyListeners('custom', numericIntensity, previousLevel, previousValue);
        
        return true;
    }

    /**
     * Get current intensity level
     * @returns {string} Current intensity level
     */
    getIntensityLevel() {
        return this.currentIntensityLevel;
    }

    /**
     * Get effective intensity value (considering custom values)
     * @returns {number} Current effective intensity value
     */
    getEffectiveIntensity() {
        if (this.currentIntensityLevel === 'custom' && this.customIntensityValue !== null) {
            return this.customIntensityValue;
        }
        
        return this.intensityLevels[this.currentIntensityLevel] || this.intensityLevels.medium;
    }

    /**
     * Get intensity value for specific effect type
     * @param {string} effectType - Type of effect ('collision', 'nearMiss')
     * @returns {number} Scaled intensity for the effect type
     */
    getIntensityForEffect(effectType) {
        const baseIntensity = this.getEffectiveIntensity();
        const multiplier = this.effectMultipliers[effectType] || 1.0;
        
        return baseIntensity * multiplier;
    }

    /**
     * Check if effects are effectively disabled (intensity is 0 or 'off')
     * @returns {boolean} True if effects are disabled
     */
    isEffectsDisabled() {
        return this.getEffectiveIntensity() === 0.0;
    }

    /**
     * Get all available intensity levels
     * @returns {Object} Object mapping level names to values
     */
    getAvailableLevels() {
        return { ...this.intensityLevels };
    }

    /**
     * Get intensity configuration for UI display
     * @returns {Object} Configuration object for UI
     */
    getConfigurationForUI() {
        return {
            currentLevel: this.currentIntensityLevel,
            currentValue: this.getEffectiveIntensity(),
            availableLevels: this.getAvailableLevels(),
            isCustom: this.currentIntensityLevel === 'custom',
            customValue: this.customIntensityValue,
            isDisabled: this.isEffectsDisabled()
        };
    }

    /**
     * Apply intensity scaling to shake parameters
     * @param {Object} shakeParams - Original shake parameters
     * @param {string} effectType - Type of effect ('collision', 'nearMiss')
     * @returns {Object} Scaled shake parameters
     */
    applyIntensityScaling(shakeParams, effectType = 'collision') {
        if (!shakeParams || typeof shakeParams !== 'object') {
            return shakeParams;
        }
        
        const intensityMultiplier = this.getIntensityForEffect(effectType);
        const scaledParams = { ...shakeParams };
        
        // Scale intensity-related parameters
        if ('intensity' in scaledParams) {
            scaledParams.intensity = scaledParams.intensity * intensityMultiplier;
        }
        
        if ('amplitude' in scaledParams) {
            scaledParams.amplitude = scaledParams.amplitude * intensityMultiplier;
        }
        
        if ('magnitude' in scaledParams) {
            scaledParams.magnitude = scaledParams.magnitude * intensityMultiplier;
        }
        
        // Duration might be slightly affected by intensity for very low values
        if ('duration' in scaledParams && intensityMultiplier < 0.1) {
            scaledParams.duration = scaledParams.duration * Math.max(0.5, intensityMultiplier * 2);
        }
        
        return scaledParams;
    }

    /**
     * Set effect type multipliers
     * @param {Object} multipliers - Object mapping effect types to multipliers
     */
    setEffectMultipliers(multipliers) {
        if (multipliers && typeof multipliers === 'object') {
            this.effectMultipliers = { ...this.effectMultipliers, ...multipliers };
        }
    }

    /**
     * Get current effect multipliers
     * @returns {Object} Current effect multipliers
     */
    getEffectMultipliers() {
        return { ...this.effectMultipliers };
    }

    /**
     * Add listener for intensity changes
     * @param {Function} listener - Callback function (level, value, previousLevel, previousValue) => void
     */
    addChangeListener(listener) {
        if (typeof listener === 'function') {
            this.changeListeners.push(listener);
        }
    }

    /**
     * Remove intensity change listener
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
     * @param {string} newLevel - New intensity level
     * @param {number} newValue - New intensity value
     * @param {string} previousLevel - Previous intensity level
     * @param {number} previousValue - Previous intensity value
     */
    notifyListeners(newLevel, newValue, previousLevel, previousValue) {
        this.changeListeners.forEach(listener => {
            try {
                listener(newLevel, newValue, previousLevel, previousValue);
            } catch (error) {
                console.error('Error in intensity change listener:', error);
            }
        });
    }

    /**
     * Create intensity settings for persistence
     * @returns {Object} Settings object for storage
     */
    getSettingsForPersistence() {
        return {
            intensityLevel: this.currentIntensityLevel,
            customIntensityValue: this.customIntensityValue,
            effectMultipliers: this.effectMultipliers
        };
    }

    /**
     * Load intensity settings from persistence
     * @param {Object} settings - Settings object from storage
     * @returns {boolean} True if settings were valid and applied
     */
    loadSettingsFromPersistence(settings) {
        if (!settings || typeof settings !== 'object') {
            return false;
        }
        
        let applied = false;
        
        // Load effect multipliers
        if (settings.effectMultipliers && typeof settings.effectMultipliers === 'object') {
            this.setEffectMultipliers(settings.effectMultipliers);
            applied = true;
        }
        
        // Load custom intensity value first
        if (settings.customIntensityValue !== null && settings.customIntensityValue !== undefined) {
            const customValue = Number(settings.customIntensityValue);
            if (!isNaN(customValue) && customValue >= 0.0 && customValue <= 2.0) {
                this.customIntensityValue = customValue;
                applied = true;
            }
        }
        
        // Load intensity level
        if (settings.intensityLevel) {
            if (settings.intensityLevel === 'custom' && this.customIntensityValue !== null) {
                this.currentIntensityLevel = 'custom';
                applied = true;
            } else if (this.intensityLevels.hasOwnProperty(settings.intensityLevel)) {
                this.currentIntensityLevel = settings.intensityLevel;
                applied = true;
            }
        }
        
        return applied;
    }

    /**
     * Get user-friendly description of current intensity setting
     * @returns {string} Description of current intensity
     */
    getIntensityDescription() {
        const level = this.getIntensityLevel();
        const value = this.getEffectiveIntensity();
        
        if (level === 'off') {
            return 'Camera effects disabled';
        } else if (level === 'custom') {
            return `Custom intensity: ${(value * 100).toFixed(0)}%`;
        } else {
            return `${level.charAt(0).toUpperCase() + level.slice(1)} intensity (${(value * 100).toFixed(0)}%)`;
        }
    }
}

module.exports = { IntensityConfigManager };