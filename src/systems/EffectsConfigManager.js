/**
 * EffectsConfigManager - Manages configuration and persistence for camera effects
 * Handles settings validation, defaults, browser storage, and change propagation
 */

class EffectsConfigManager {
    constructor() {
        this.storageKey = 'lightbikes_camera_effects_settings';
        this.settingsVersion = '1.0.0';
        this.defaultSettings = {
            version: this.settingsVersion,
            shakeEnabled: true,
            shakeIntensity: 1.0,        // 0.0 to 2.0 multiplier
            motionBlurEnabled: true,
            motionBlurQuality: 'medium', // 'low' | 'medium' | 'high'
            accessibilityMode: false,   // Disables all effects
            respectSystemPreferences: true
        };
        
        this.currentSettings = null;
        this.changeListeners = [];
        
        this.loadSettings();
    }

    /**
     * Get current settings (read-only copy)
     * @returns {Object} Current settings object
     */
    getSettings() {
        return { ...this.currentSettings };
    }

    /**
     * Update settings with validation and persistence
     * @param {Object} newSettings - Settings to update
     * @returns {boolean} True if settings were valid and applied
     */
    updateSettings(newSettings) {
        const validatedSettings = this.validateSettings(newSettings);
        if (!validatedSettings || Object.keys(validatedSettings).length === 0) {
            console.warn('Invalid settings provided to EffectsConfigManager');
            return false;
        }

        const previousSettings = { ...this.currentSettings };
        this.currentSettings = { ...this.currentSettings, ...validatedSettings };
        
        this.saveSettings();
        this.notifyListeners(this.currentSettings, previousSettings);
        
        return true;
    }

    /**
     * Reset settings to defaults
     */
    resetToDefaults() {
        this.currentSettings = { ...this.defaultSettings };
        this.saveSettings();
        this.notifyListeners(this.currentSettings, {});
    }

    /**
     * Add listener for settings changes
     * @param {Function} listener - Callback function (newSettings, previousSettings) => void
     */
    addChangeListener(listener) {
        if (typeof listener === 'function') {
            this.changeListeners.push(listener);
        }
    }

    /**
     * Remove settings change listener
     * @param {Function} listener - Listener to remove
     */
    removeChangeListener(listener) {
        const index = this.changeListeners.indexOf(listener);
        if (index > -1) {
            this.changeListeners.splice(index, 1);
        }
    }

    /**
     * Validate settings object with detailed error reporting
     * @param {Object} settings - Settings to validate
     * @returns {Object|null} Validated settings or null if invalid
     */
    validateSettings(settings) {
        if (!settings || typeof settings !== 'object') {
            console.warn('Invalid settings object provided to validateSettings');
            return null;
        }

        const validated = {};
        const errors = [];

        // Validate version string
        if ('version' in settings) {
            if (typeof settings.version === 'string') {
                validated.version = settings.version;
            } else {
                errors.push('version must be a string');
            }
        }

        // Validate boolean settings
        const booleanKeys = ['shakeEnabled', 'motionBlurEnabled', 'accessibilityMode', 'respectSystemPreferences'];
        booleanKeys.forEach(key => {
            if (key in settings) {
                if (typeof settings[key] === 'boolean' || 
                    settings[key] === 'true' || settings[key] === 'false' ||
                    settings[key] === 1 || settings[key] === 0) {
                    validated[key] = Boolean(settings[key]);
                } else {
                    errors.push(`${key} must be a boolean value`);
                }
            }
        });

        // Validate shake intensity (0.0 to 2.0)
        if ('shakeIntensity' in settings) {
            const intensity = Number(settings.shakeIntensity);
            if (!isNaN(intensity) && intensity >= 0.0 && intensity <= 2.0) {
                validated.shakeIntensity = intensity;
            } else {
                errors.push('shakeIntensity must be a number between 0.0 and 2.0');
            }
        }

        // Validate motion blur quality
        if ('motionBlurQuality' in settings) {
            const validQualities = ['low', 'medium', 'high'];
            if (validQualities.includes(settings.motionBlurQuality)) {
                validated.motionBlurQuality = settings.motionBlurQuality;
            } else {
                errors.push(`motionBlurQuality must be one of: ${validQualities.join(', ')}`);
            }
        }

        // Log validation errors if any
        if (errors.length > 0) {
            console.warn('Settings validation errors:', errors);
        }

        return validated;
    }

    /**
     * Load settings from browser storage with migration support
     */
    loadSettings() {
        try {
            if (typeof localStorage !== 'undefined') {
                const stored = localStorage.getItem(this.storageKey);
                if (stored) {
                    const parsedSettings = JSON.parse(stored);
                    
                    // Check if settings need migration
                    const migratedSettings = this.migrateSettings(parsedSettings);
                    const validatedSettings = this.validateSettings(migratedSettings);
                    
                    if (validatedSettings && Object.keys(validatedSettings).length > 0) {
                        this.currentSettings = { ...this.defaultSettings, ...validatedSettings };
                        
                        // Save migrated settings if version changed
                        if (migratedSettings.version !== parsedSettings.version) {
                            this.saveSettings();
                            console.log('Camera effects settings migrated to version', this.settingsVersion);
                        }
                    } else {
                        this.currentSettings = { ...this.defaultSettings };
                    }
                } else {
                    this.currentSettings = { ...this.defaultSettings };
                }
            } else {
                this.currentSettings = { ...this.defaultSettings };
            }
        } catch (error) {
            console.warn('Failed to load camera effects settings from storage:', error);
            this.currentSettings = { ...this.defaultSettings };
        }
    }

    /**
     * Migrate settings from older versions
     * @param {Object} settings - Settings to migrate
     * @returns {Object} Migrated settings
     */
    migrateSettings(settings) {
        if (!settings || typeof settings !== 'object') {
            return { ...this.defaultSettings };
        }

        const migrated = { ...settings };

        // Add version if missing (pre-1.0.0 settings)
        if (!migrated.version) {
            migrated.version = this.settingsVersion;
            
            // Migrate any legacy settings here if needed
            // For example, if we had different property names in the past
        }

        // Future migration logic can be added here
        // if (migrated.version === '1.0.0' && this.settingsVersion === '1.1.0') {
        //     // Perform 1.0.0 -> 1.1.0 migration
        // }

        // Always update to current version
        migrated.version = this.settingsVersion;

        return migrated;
    }

    /**
     * Save current settings to browser storage
     */
    saveSettings() {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(this.storageKey, JSON.stringify(this.currentSettings));
            }
        } catch (error) {
            console.warn('Failed to save camera effects settings to storage:', error);
        }
    }

    /**
     * Notify all change listeners
     * @param {Object} newSettings - New settings
     * @param {Object} previousSettings - Previous settings
     */
    notifyListeners(newSettings, previousSettings) {
        this.changeListeners.forEach(listener => {
            try {
                listener(newSettings, previousSettings);
            } catch (error) {
                console.error('Error in settings change listener:', error);
            }
        });
    }

    /**
     * Get specific setting value with fallback to default
     * @param {string} key - Setting key
     * @returns {*} Setting value
     */
    getSetting(key) {
        return this.currentSettings[key] !== undefined 
            ? this.currentSettings[key] 
            : this.defaultSettings[key];
    }

    /**
     * Check if effects should be disabled (accessibility mode or system preferences)
     * @returns {boolean} True if effects should be disabled
     */
    shouldDisableEffects() {
        if (this.currentSettings.accessibilityMode) {
            return true;
        }

        if (this.currentSettings.respectSystemPreferences) {
            try {
                if (typeof window !== 'undefined' && window.matchMedia) {
                    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                }
            } catch (error) {
                // Fallback if matchMedia not supported
                return false;
            }
        }

        return false;
    }

    /**
     * Get effective settings considering accessibility overrides
     * @returns {Object} Effective settings with accessibility applied
     */
    getEffectiveSettings() {
        const settings = this.getSettings();
        
        if (this.shouldDisableEffects()) {
            return {
                ...settings,
                shakeEnabled: false,
                motionBlurEnabled: false
            };
        }

        return settings;
    }

    /**
     * Check settings integrity and repair if necessary
     * @returns {boolean} True if settings were repaired
     */
    checkAndRepairSettings() {
        let wasRepaired = false;
        
        try {
            // Check if current settings are valid
            const validatedCurrent = this.validateSettings(this.currentSettings);
            
            if (!validatedCurrent || Object.keys(validatedCurrent).length === 0) {
                console.warn('Current settings are corrupted, resetting to defaults');
                this.currentSettings = { ...this.defaultSettings };
                this.saveSettings();
                wasRepaired = true;
            } else {
                // Check if any required keys are missing
                const requiredKeys = Object.keys(this.defaultSettings);
                const missingKeys = requiredKeys.filter(key => !(key in this.currentSettings));
                
                if (missingKeys.length > 0) {
                    console.warn('Missing settings keys detected, adding defaults:', missingKeys);
                    missingKeys.forEach(key => {
                        this.currentSettings[key] = this.defaultSettings[key];
                    });
                    this.saveSettings();
                    wasRepaired = true;
                }
            }
        } catch (error) {
            console.error('Error during settings integrity check:', error);
            this.currentSettings = { ...this.defaultSettings };
            this.saveSettings();
            wasRepaired = true;
        }
        
        return wasRepaired;
    }

    /**
     * Export settings as JSON string for backup
     * @returns {string} Settings as JSON string
     */
    exportSettings() {
        try {
            return JSON.stringify(this.currentSettings, null, 2);
        } catch (error) {
            console.error('Failed to export settings:', error);
            return null;
        }
    }

    /**
     * Import settings from JSON string
     * @param {string} settingsJson - Settings as JSON string
     * @returns {boolean} True if import was successful
     */
    importSettings(settingsJson) {
        try {
            const importedSettings = JSON.parse(settingsJson);
            const validatedSettings = this.validateSettings(importedSettings);
            
            if (validatedSettings && Object.keys(validatedSettings).length > 0) {
                const previousSettings = { ...this.currentSettings };
                this.currentSettings = { ...this.defaultSettings, ...validatedSettings };
                this.saveSettings();
                this.notifyListeners(this.currentSettings, previousSettings);
                return true;
            } else {
                console.warn('Invalid settings data provided for import');
                return false;
            }
        } catch (error) {
            console.error('Failed to import settings:', error);
            return false;
        }
    }
}

module.exports = { EffectsConfigManager };