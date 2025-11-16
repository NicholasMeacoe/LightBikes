/**
 * MusicSettings - Manages user preferences for background music
 * Handles localStorage persistence, validation, and default settings
 */
class MusicSettings {
    constructor() {
        // Settings schema for validation
        this.schema = {
            musicVolume: {
                type: 'number',
                min: 0.0,
                max: 1.0,
                default: 0.7
            },
            selectedTrack: {
                type: 'string',
                enum: ['ambient-space', 'cyber-pulse', 'neon-rush', 'none'],
                default: 'ambient-space'
            },
            fadeInDuration: {
                type: 'number',
                min: 0.1,
                max: 2.0,
                default: 0.5
            },
            fadeOutDuration: {
                type: 'number',
                min: 0.1,
                max: 2.0,
                default: 0.5
            },
            duckingLevel: {
                type: 'number',
                min: 0.0,
                max: 1.0,
                default: 0.3
            },
            duckingDuration: {
                type: 'number',
                min: 0.1,
                max: 1.0,
                default: 0.2
            }
        };
        
        // Current settings version for migration
        this.settingsVersion = 1;
        
        // Current settings
        this.settings = {};
        
        // Storage key for localStorage
        this.storageKey = 'lightbikes_music_settings';
        
        // Load settings from storage or use defaults
        this.load();
    }
    
    /**
     * Get the music volume level
     * @returns {number} Volume level (0.0 to 1.0)
     */
    getMusicVolume() {
        return this.settings.musicVolume;
    }
    
    /**
     * Set the music volume level
     * @param {number} level - Volume level (0.0 to 1.0)
     * @returns {boolean} True if setting was valid and applied
     */
    setMusicVolume(level) {
        if (!this._validateSetting('musicVolume', level)) {
            return false;
        }
        
        this.settings.musicVolume = level;
        this.save();
        return true;
    }
    
    /**
     * Get the selected music track ID
     * @returns {string} Track ID
     */
    getSelectedTrack() {
        return this.settings.selectedTrack;
    }
    
    /**
     * Set the selected music track
     * @param {string} trackId - Track identifier
     * @returns {boolean} True if setting was valid and applied
     */
    setSelectedTrack(trackId) {
        if (!this._validateSetting('selectedTrack', trackId)) {
            return false;
        }
        
        this.settings.selectedTrack = trackId;
        this.save();
        return true;
    }
    
    /**
     * Get the fade-in duration in seconds
     * @returns {number} Fade-in duration
     */
    getFadeInDuration() {
        return this.settings.fadeInDuration;
    }
    
    /**
     * Set the fade-in duration
     * @param {number} duration - Duration in seconds
     * @returns {boolean} True if setting was valid and applied
     */
    setFadeInDuration(duration) {
        if (!this._validateSetting('fadeInDuration', duration)) {
            return false;
        }
        
        this.settings.fadeInDuration = duration;
        this.save();
        return true;
    }
    
    /**
     * Get the fade-out duration in seconds
     * @returns {number} Fade-out duration
     */
    getFadeOutDuration() {
        return this.settings.fadeOutDuration;
    }
    
    /**
     * Set the fade-out duration
     * @param {number} duration - Duration in seconds
     * @returns {boolean} True if setting was valid and applied
     */
    setFadeOutDuration(duration) {
        if (!this._validateSetting('fadeOutDuration', duration)) {
            return false;
        }
        
        this.settings.fadeOutDuration = duration;
        this.save();
        return true;
    }
    
    /**
     * Get the ducking level (volume reduction during sound effects)
     * @returns {number} Ducking level (0.0 to 1.0)
     */
    getDuckingLevel() {
        return this.settings.duckingLevel;
    }
    
    /**
     * Set the ducking level
     * @param {number} level - Ducking level (0.0 to 1.0)
     * @returns {boolean} True if setting was valid and applied
     */
    setDuckingLevel(level) {
        if (!this._validateSetting('duckingLevel', level)) {
            return false;
        }
        
        this.settings.duckingLevel = level;
        this.save();
        return true;
    }
    
    /**
     * Get the ducking transition duration
     * @returns {number} Ducking duration in seconds
     */
    getDuckingDuration() {
        return this.settings.duckingDuration;
    }
    
    /**
     * Set the ducking transition duration
     * @param {number} duration - Duration in seconds
     * @returns {boolean} True if setting was valid and applied
     */
    setDuckingDuration(duration) {
        if (!this._validateSetting('duckingDuration', duration)) {
            return false;
        }
        
        this.settings.duckingDuration = duration;
        this.save();
        return true;
    }
    
    /**
     * Get all current settings
     * @returns {Object} Complete settings object
     */
    getAllSettings() {
        return { ...this.settings };
    }
    
    /**
     * Update multiple settings at once
     * @param {Object} newSettings - Object containing settings to update
     * @returns {boolean} True if all settings were valid and applied
     */
    updateSettings(newSettings) {
        const validatedSettings = {};
        
        // Validate all settings first
        for (const [key, value] of Object.entries(newSettings)) {
            if (!this.schema[key]) {
                console.warn(`Unknown music setting: ${key}`);
                continue;
            }
            
            if (!this._validateSetting(key, value)) {
                console.warn(`Invalid value for music setting ${key}:`, value);
                return false;
            }
            
            validatedSettings[key] = value;
        }
        
        // Apply all validated settings
        Object.assign(this.settings, validatedSettings);
        this.save();
        return true;
    }
    
    /**
     * Save settings to localStorage
     * @returns {boolean} True if save was successful
     */
    save() {
        try {
            const dataToSave = {
                version: this.settingsVersion,
                settings: this.settings
            };
            const settingsJson = JSON.stringify(dataToSave);
            localStorage.setItem(this.storageKey, settingsJson);
            return true;
        } catch (error) {
            console.warn('Failed to save music settings to localStorage:', error);
            return false;
        }
    }
    
    /**
     * Load settings from localStorage
     * @returns {boolean} True if load was successful
     */
    load() {
        try {
            const settingsJson = localStorage.getItem(this.storageKey);
            
            if (settingsJson) {
                const loadedData = JSON.parse(settingsJson);
                
                // Reset migration flag
                this._migrationOccurred = false;
                
                // Handle migration if needed
                const migratedData = this._migrateSettings(loadedData);
                
                // Validate and merge with defaults
                this.settings = this._mergeWithDefaults(migratedData);
                
                // Save migrated settings if migration occurred
                if (this._migrationOccurred) {
                    this.save();
                }
            } else {
                // Use defaults if no saved settings
                this.settings = this.getDefaults();
            }
            
            return true;
        } catch (error) {
            console.warn('Failed to load music settings from localStorage:', error);
            // Fall back to defaults
            this.settings = this.getDefaults();
            return false;
        }
    }
    
    /**
     * Reset all settings to defaults
     * @returns {boolean} True if reset was successful
     */
    reset() {
        this.settings = this.getDefaults();
        return this.save();
    }
    
    /**
     * Get default settings
     * @returns {Object} Default settings object
     */
    getDefaults() {
        const defaults = {};
        
        for (const [key, config] of Object.entries(this.schema)) {
            defaults[key] = config.default;
        }
        
        return defaults;
    }
    
    /**
     * Validate a complete settings object
     * @param {Object} settings - Settings object to validate
     * @returns {boolean} True if all settings are valid
     */
    validateSettings(settings) {
        if (!settings || typeof settings !== 'object') {
            return false;
        }
        
        for (const [key, value] of Object.entries(settings)) {
            if (!this.schema[key]) {
                continue; // Skip unknown keys
            }
            
            if (!this._validateSetting(key, value)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Get the settings schema for external validation
     * @returns {Object} Settings schema
     */
    getSchema() {
        return JSON.parse(JSON.stringify(this.schema));
    }
    
    /**
     * Validate a single setting
     * @param {string} key - Setting key
     * @param {*} value - Setting value
     * @returns {boolean} True if setting is valid
     * @private
     */
    _validateSetting(key, value) {
        const config = this.schema[key];
        
        if (!config) {
            return false;
        }
        
        // Type validation
        if (typeof value !== config.type) {
            return false;
        }
        
        // Range validation for numbers
        if (config.type === 'number') {
            if (typeof config.min === 'number' && value < config.min) {
                return false;
            }
            if (typeof config.max === 'number' && value > config.max) {
                return false;
            }
        }
        
        // Enum validation for strings
        if (config.type === 'string' && config.enum) {
            if (!config.enum.includes(value)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Migrate settings from older versions
     * @param {Object} loadedData - Raw data loaded from storage
     * @returns {Object} Migrated settings data
     * @private
     */
    _migrateSettings(loadedData) {
        // Handle legacy format (settings directly in root)
        if (!loadedData.version && !loadedData.settings) {
            console.log('Migrating legacy music settings format');
            this._migrationOccurred = true; // Flag for save trigger
            return loadedData; // Legacy format, settings are in root
        }
        
        // Handle versioned format
        if (loadedData.version && loadedData.settings) {
            const version = loadedData.version;
            let settings = loadedData.settings;
            
            // Future migration logic would go here
            // Example:
            // if (version < 2) {
            //     settings = this._migrateFromV1ToV2(settings);
            //     this._migrationOccurred = true;
            // }
            
            return settings;
        }
        
        // Unknown format, return as-is and let validation handle it
        return loadedData;
    }
    
    /**
     * Get the current settings version
     * @returns {number} Current settings version
     */
    getSettingsVersion() {
        return this.settingsVersion;
    }
    
    /**
     * Check if localStorage is available and functional
     * @returns {boolean} True if localStorage is available
     */
    isStorageAvailable() {
        try {
            const testKey = 'lightbikes_storage_test';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Clear all stored settings
     * @returns {boolean} True if clear was successful
     */
    clearStorage() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.warn('Failed to clear music settings from localStorage:', error);
            return false;
        }
    }
    
    /**
     * Merge loaded settings with defaults, validating each setting
     * @param {Object} loadedSettings - Settings loaded from storage
     * @returns {Object} Merged and validated settings
     * @private
     */
    _mergeWithDefaults(loadedSettings) {
        const defaults = this.getDefaults();
        const merged = { ...defaults };
        
        // Validate and merge each loaded setting
        for (const [key, value] of Object.entries(loadedSettings)) {
            if (this.schema[key] && this._validateSetting(key, value)) {
                merged[key] = value;
            } else if (this.schema[key]) {
                console.warn(`Invalid music setting ${key} loaded from storage, using default:`, value);
            }
        }
        
        return merged;
    }
}

// Export using CommonJS pattern to match existing project architecture
module.exports = { MusicSettings };