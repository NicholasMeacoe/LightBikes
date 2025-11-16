/**
 * Particle Settings Management System
 * Handles user preferences, localStorage persistence, and settings validation
 * Provides interface for particle density and individual effect toggles
 */

/**
 * ParticleSettings class for managing user preferences
 * Handles settings persistence, validation, and integration with ParticleSystem
 */
class ParticleSettings {
    constructor() {
        // Default settings configuration
        this.defaultSettings = {
            enabled: true,
            quality: 'medium', // 'low', 'medium', 'high'
            effects: {
                trailSparks: true,
                explosions: true,
                collections: true
            },
            performance: {
                maxParticles: 200,
                adaptiveQuality: true,
                targetFPS: 60
            },
            advanced: {
                particleDensity: 1.0, // 0.5 = 50%, 1.0 = 100%, 1.5 = 150%
                emissionRateMultiplier: 1.0,
                lifetimeMultiplier: 1.0
            }
        };

        // Current settings (loaded from localStorage or defaults)
        this.currentSettings = {};

        // Settings validation rules
        this.validationRules = {
            enabled: (value) => typeof value === 'boolean',
            quality: (value) => ['low', 'medium', 'high'].includes(value),
            'effects.trailSparks': (value) => typeof value === 'boolean',
            'effects.explosions': (value) => typeof value === 'boolean',
            'effects.collections': (value) => typeof value === 'boolean',
            'performance.maxParticles': (value) => Number.isInteger(value) && value >= 25 && value <= 500,
            'performance.adaptiveQuality': (value) => typeof value === 'boolean',
            'performance.targetFPS': (value) => Number.isInteger(value) && value >= 30 && value <= 120,
            'advanced.particleDensity': (value) => typeof value === 'number' && value >= 0.1 && value <= 3.0,
            'advanced.emissionRateMultiplier': (value) => typeof value === 'number' && value >= 0.1 && value <= 5.0,
            'advanced.lifetimeMultiplier': (value) => typeof value === 'number' && value >= 0.1 && value <= 3.0
        };

        // Quality presets for easy configuration
        this.qualityPresets = {
            low: {
                quality: 'low',
                performance: {
                    maxParticles: 100,
                    adaptiveQuality: true,
                    targetFPS: 60
                },
                advanced: {
                    particleDensity: 0.7,
                    emissionRateMultiplier: 0.8,
                    lifetimeMultiplier: 0.9
                }
            },
            medium: {
                quality: 'medium',
                performance: {
                    maxParticles: 200,
                    adaptiveQuality: true,
                    targetFPS: 60
                },
                advanced: {
                    particleDensity: 1.0,
                    emissionRateMultiplier: 1.0,
                    lifetimeMultiplier: 1.0
                }
            },
            high: {
                quality: 'high',
                performance: {
                    maxParticles: 300,
                    adaptiveQuality: false,
                    targetFPS: 60
                },
                advanced: {
                    particleDensity: 1.3,
                    emissionRateMultiplier: 1.2,
                    lifetimeMultiplier: 1.1
                }
            }
        };

        // Storage key for localStorage
        this.storageKey = 'lightbikes_particle_settings';

        // Event listeners for settings changes
        this.changeListeners = [];

        // Initialize settings
        this.loadSettings();
    }

    /**
     * Load settings from localStorage or use defaults
     */
    loadSettings() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsedSettings = JSON.parse(stored);
                this.currentSettings = this.mergeSettings(this.defaultSettings, parsedSettings);
                
                // Validate loaded settings
                this.validateAndFixSettings();
            } else {
                // Use default settings
                this.currentSettings = this.deepClone(this.defaultSettings);
            }
        } catch (error) {
            console.warn('ParticleSettings: Failed to load settings from localStorage:', error);
            this.currentSettings = this.deepClone(this.defaultSettings);
        }
    }

    /**
     * Save current settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.currentSettings));
        } catch (error) {
            console.error('ParticleSettings: Failed to save settings to localStorage:', error);
        }
    }

    /**
     * Get current settings (read-only copy)
     * @returns {Object} Current settings object
     */
    getSettings() {
        return this.deepClone(this.currentSettings);
    }

    /**
     * Update a specific setting
     * @param {string} path - Setting path (e.g., 'effects.trailSparks', 'quality')
     * @param {*} value - New value
     * @returns {boolean} True if setting was updated successfully
     */
    setSetting(path, value) {
        // Validate the setting
        if (!this.validateSetting(path, value)) {
            console.warn(`ParticleSettings: Invalid value for setting '${path}':`, value);
            return false;
        }

        // Update the setting
        this.setNestedProperty(this.currentSettings, path, value);

        // Save to localStorage
        this.saveSettings();

        // Notify listeners
        this.notifyChange(path, value);

        return true;
    }

    /**
     * Update multiple settings at once
     * @param {Object} settings - Settings object to merge
     * @returns {boolean} True if all settings were updated successfully
     */
    updateSettings(settings) {
        const oldSettings = this.deepClone(this.currentSettings);
        let success = true;

        try {
            // Merge new settings
            this.currentSettings = this.mergeSettings(this.currentSettings, settings);

            // Validate all settings
            if (!this.validateAndFixSettings()) {
                success = false;
            }

            // Save to localStorage
            this.saveSettings();

            // Notify listeners of bulk change
            this.notifyChange('bulk', this.currentSettings);

        } catch (error) {
            console.error('ParticleSettings: Failed to update settings:', error);
            this.currentSettings = oldSettings; // Restore previous settings
            success = false;
        }

        return success;
    }

    /**
     * Apply a quality preset
     * @param {string} preset - Preset name ('low', 'medium', 'high')
     * @returns {boolean} True if preset was applied successfully
     */
    applyQualityPreset(preset) {
        if (!this.qualityPresets[preset]) {
            console.warn(`ParticleSettings: Unknown quality preset '${preset}'`);
            return false;
        }

        const presetSettings = this.qualityPresets[preset];
        return this.updateSettings(presetSettings);
    }

    /**
     * Reset settings to defaults
     */
    resetToDefaults() {
        this.currentSettings = this.deepClone(this.defaultSettings);
        this.saveSettings();
        this.notifyChange('reset', this.currentSettings);
    }

    /**
     * Enable or disable particle system entirely
     * @param {boolean} enabled - Whether to enable particle system
     */
    setEnabled(enabled) {
        return this.setSetting('enabled', enabled);
    }

    /**
     * Set quality level
     * @param {string} quality - Quality level ('low', 'medium', 'high')
     */
    setQuality(quality) {
        if (this.setSetting('quality', quality)) {
            // Apply quality preset settings
            return this.applyQualityPreset(quality);
        }
        return false;
    }

    /**
     * Enable or disable specific effect types
     * @param {string} effectType - Effect type ('trailSparks', 'explosions', 'collections')
     * @param {boolean} enabled - Whether to enable the effect
     */
    setEffectEnabled(effectType, enabled) {
        return this.setSetting(`effects.${effectType}`, enabled);
    }

    /**
     * Set particle density multiplier
     * @param {number} density - Density multiplier (0.1 to 3.0)
     */
    setParticleDensity(density) {
        return this.setSetting('advanced.particleDensity', density);
    }

    /**
     * Set maximum particle count
     * @param {number} maxParticles - Maximum particles (25 to 500)
     */
    setMaxParticles(maxParticles) {
        return this.setSetting('performance.maxParticles', maxParticles);
    }

    /**
     * Enable or disable adaptive quality
     * @param {boolean} enabled - Whether to enable adaptive quality
     */
    setAdaptiveQuality(enabled) {
        return this.setSetting('performance.adaptiveQuality', enabled);
    }

    /**
     * Get settings formatted for ParticleSystem constructor
     * @returns {Object} Settings object compatible with ParticleSystem
     */
    getParticleSystemSettings() {
        const settings = this.getSettings();
        
        // Apply density multiplier to max particles
        const adjustedMaxParticles = Math.floor(
            settings.performance.maxParticles * settings.advanced.particleDensity
        );

        return {
            enabled: settings.enabled,
            quality: settings.quality,
            maxParticles: Math.max(25, Math.min(500, adjustedMaxParticles)),
            effects: { ...settings.effects },
            adaptiveQuality: settings.performance.adaptiveQuality,
            targetFPS: settings.performance.targetFPS,
            emissionRateMultiplier: settings.advanced.emissionRateMultiplier,
            lifetimeMultiplier: settings.advanced.lifetimeMultiplier
        };
    }

    /**
     * Add a change listener
     * @param {Function} listener - Callback function (path, value) => void
     */
    addChangeListener(listener) {
        if (typeof listener === 'function') {
            this.changeListeners.push(listener);
        }
    }

    /**
     * Remove a change listener
     * @param {Function} listener - Callback function to remove
     */
    removeChangeListener(listener) {
        const index = this.changeListeners.indexOf(listener);
        if (index !== -1) {
            this.changeListeners.splice(index, 1);
        }
    }

    /**
     * Get available quality presets
     * @returns {Array} Array of preset names
     */
    getAvailablePresets() {
        return Object.keys(this.qualityPresets);
    }

    /**
     * Get current quality preset name (if settings match a preset)
     * @returns {string|null} Preset name or null if custom settings
     */
    getCurrentPreset() {
        for (const [presetName, presetSettings] of Object.entries(this.qualityPresets)) {
            if (this.settingsMatchPreset(presetSettings)) {
                return presetName;
            }
        }
        return null; // Custom settings
    }

    /**
     * Export settings as JSON string
     * @returns {string} JSON string of current settings
     */
    exportSettings() {
        return JSON.stringify(this.currentSettings, null, 2);
    }

    /**
     * Import settings from JSON string
     * @param {string} jsonString - JSON string of settings
     * @returns {boolean} True if import was successful
     */
    importSettings(jsonString) {
        try {
            const importedSettings = JSON.parse(jsonString);
            return this.updateSettings(importedSettings);
        } catch (error) {
            console.error('ParticleSettings: Failed to import settings:', error);
            return false;
        }
    }

    // Private helper methods

    /**
     * Validate a single setting
     * @private
     * @param {string} path - Setting path
     * @param {*} value - Value to validate
     * @returns {boolean} True if valid
     */
    validateSetting(path, value) {
        const validator = this.validationRules[path];
        return validator ? validator(value) : true;
    }

    /**
     * Validate and fix all current settings
     * @private
     * @returns {boolean} True if all settings are valid
     */
    validateAndFixSettings() {
        let allValid = true;

        for (const [path, validator] of Object.entries(this.validationRules)) {
            const currentValue = this.getNestedProperty(this.currentSettings, path);
            
            if (currentValue !== undefined && !validator(currentValue)) {
                console.warn(`ParticleSettings: Invalid setting '${path}', resetting to default`);
                const defaultValue = this.getNestedProperty(this.defaultSettings, path);
                this.setNestedProperty(this.currentSettings, path, defaultValue);
                allValid = false;
            }
        }

        return allValid;
    }

    /**
     * Check if current settings match a preset
     * @private
     * @param {Object} presetSettings - Preset settings to compare
     * @returns {boolean} True if settings match
     */
    settingsMatchPreset(presetSettings) {
        const currentQuality = this.currentSettings.quality;
        const currentPerformance = this.currentSettings.performance;
        const currentAdvanced = this.currentSettings.advanced;

        return (
            currentQuality === presetSettings.quality &&
            currentPerformance.maxParticles === presetSettings.performance.maxParticles &&
            currentPerformance.adaptiveQuality === presetSettings.performance.adaptiveQuality &&
            Math.abs(currentAdvanced.particleDensity - presetSettings.advanced.particleDensity) < 0.01 &&
            Math.abs(currentAdvanced.emissionRateMultiplier - presetSettings.advanced.emissionRateMultiplier) < 0.01 &&
            Math.abs(currentAdvanced.lifetimeMultiplier - presetSettings.advanced.lifetimeMultiplier) < 0.01
        );
    }

    /**
     * Notify all change listeners
     * @private
     * @param {string} path - Changed setting path
     * @param {*} value - New value
     */
    notifyChange(path, value) {
        this.changeListeners.forEach(listener => {
            try {
                listener(path, value);
            } catch (error) {
                console.error('ParticleSettings: Error in change listener:', error);
            }
        });
    }

    /**
     * Deep clone an object
     * @private
     * @param {Object} obj - Object to clone
     * @returns {Object} Cloned object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }

        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }

        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        return cloned;
    }

    /**
     * Merge two settings objects
     * @private
     * @param {Object} target - Target object
     * @param {Object} source - Source object
     * @returns {Object} Merged object
     */
    mergeSettings(target, source) {
        const result = this.deepClone(target);

        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    result[key] = this.mergeSettings(result[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }

        return result;
    }

    /**
     * Get nested property value
     * @private
     * @param {Object} obj - Object to search
     * @param {string} path - Property path (e.g., 'effects.trailSparks')
     * @returns {*} Property value or undefined
     */
    getNestedProperty(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    /**
     * Set nested property value
     * @private
     * @param {Object} obj - Object to modify
     * @param {string} path - Property path (e.g., 'effects.trailSparks')
     * @param {*} value - Value to set
     */
    setNestedProperty(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        
        const target = keys.reduce((current, key) => {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            return current[key];
        }, obj);

        target[lastKey] = value;
    }
}

module.exports = { ParticleSettings };