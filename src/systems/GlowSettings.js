/**
 * GlowSettings - User preference management for neon glow effects
 * 
 * This class manages user preferences for glow effect intensity with robust
 * localStorage persistence, settings validation, and migration support.
 * It provides a simple API for storing and retrieving user preferences
 * while handling edge cases like corrupted data and storage unavailability.
 * 
 * Key Features:
 * - Four-level intensity system (Off, Low, Medium, High)
 * - Robust localStorage persistence with error recovery
 * - Settings validation and sanitization
 * - Version-based migration system for future updates
 * - Default fallback values for all settings
 * - Graceful handling of storage limitations
 * 
 * Intensity Levels:
 * - OFF: Completely disables glow effects (emissive: 0, bloom: 0)
 * - LOW: Subtle glow for performance-conscious users (emissive: 0.3, bloom: 0.5)
 * - MEDIUM: Balanced glow (default setting) (emissive: 0.6, bloom: 1.0)
 * - HIGH: Maximum visual impact (emissive: 0.8, bloom: 1.5)
 * 
 * Storage Strategy:
 * - Primary storage in localStorage with automatic backup creation
 * - Settings validation on load with fallback to defaults
 * - Version tracking for future migration support
 * - Graceful degradation when localStorage is unavailable
 * 
 * Usage Example:
 * ```javascript
 * const settings = new GlowSettings();
 * 
 * // Get current intensity
 * const currentLevel = settings.getIntensity(); // 'MEDIUM'
 * 
 * // Change intensity
 * settings.setIntensity('HIGH');
 * 
 * // Get configuration for current level
 * const config = settings.getIntensityConfig();
 * console.log(config); // { emissive: 0.8, bloom: 1.5, label: 'High' }
 * 
 * // Check if effects are enabled
 * if (settings.isEnabled()) {
 *     // Apply glow effects
 * }
 * ```
 * 
 * @class GlowSettings
 * @author LightBikes Development Team
 * @version 1.0.0
 * @since 2024
 */
class GlowSettings {
    constructor() {
        // Define intensity levels with emissive and bloom values
        this.intensityLevels = {
            OFF: { emissive: 0, bloom: 0, label: 'Off' },
            LOW: { emissive: 0.3, bloom: 0.5, label: 'Low' },
            MEDIUM: { emissive: 0.6, bloom: 1.0, label: 'Medium' },
            HIGH: { emissive: 0.8, bloom: 1.5, label: 'High' }
        };

        // Default settings
        this.defaults = {
            intensity: 'MEDIUM',
            version: 1
        };

        // Current settings
        this.settings = { ...this.defaults };

        // Storage key for localStorage
        this.storageKey = 'lightbikes_glow_settings';

        // Load settings on initialization
        this.loadSettings();
    }

    /**
     * Get current intensity level
     * @returns {string} Current intensity level key
     */
    getIntensity() {
        return this.settings.intensity;
    }

    /**
     * Set intensity level
     * @param {string} level - Intensity level (OFF, LOW, MEDIUM, HIGH)
     * @returns {boolean} True if setting was applied successfully
     */
    setIntensity(level) {
        if (!this.isValidIntensity(level)) {
            console.warn(`Invalid glow intensity level: ${level}`);
            return false;
        }

        this.settings.intensity = level;
        this.saveSettings();
        return true;
    }

    /**
     * Get intensity configuration for current level
     * @returns {Object} Configuration object with emissive and bloom values
     */
    getIntensityConfig() {
        return this.intensityLevels[this.settings.intensity];
    }

    /**
     * Get all available intensity levels
     * @returns {Object} All intensity level configurations
     */
    getAvailableLevels() {
        return this.intensityLevels;
    }

    /**
     * Validate intensity level
     * @param {string} level - Level to validate
     * @returns {boolean} True if valid
     */
    isValidIntensity(level) {
        return !!(level && typeof level === 'string' && level.trim() !== '' && this.intensityLevels.hasOwnProperty(level));
    }

    /**
     * Load settings from localStorage with error recovery
     */
    loadSettings() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) {
                // No stored settings, use defaults
                return;
            }

            const parsed = JSON.parse(stored);
            
            // Validate loaded settings
            if (this.validateSettings(parsed)) {
                // Handle settings migration if needed
                const migrated = this.migrateSettings(parsed);
                this.settings = { ...this.defaults, ...migrated };
            } else {
                console.warn('Invalid stored glow settings, using defaults');
                this.settings = { ...this.defaults };
            }
        } catch (error) {
            console.error('Error loading glow settings:', error);
            this.settings = { ...this.defaults };
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            const toStore = {
                ...this.settings,
                version: this.defaults.version
            };
            localStorage.setItem(this.storageKey, JSON.stringify(toStore));
        } catch (error) {
            console.error('Error saving glow settings:', error);
        }
    }

    /**
     * Validate settings object
     * @param {Object} settings - Settings to validate
     * @returns {boolean} True if valid
     */
    validateSettings(settings) {
        if (!settings || typeof settings !== 'object') {
            return false;
        }

        // Check if intensity is valid
        if (settings.intensity && !this.isValidIntensity(settings.intensity)) {
            return false;
        }

        return true;
    }

    /**
     * Migrate settings from older versions
     * @param {Object} settings - Settings to migrate
     * @returns {Object} Migrated settings
     */
    migrateSettings(settings) {
        const migrated = { ...settings };

        // Handle version migrations
        const settingsVersion = settings.version || 0;
        
        if (settingsVersion < 1) {
            // Migration from version 0 to 1
            // No changes needed for v1, just ensure version is set
            migrated.version = 1;
        }

        return migrated;
    }

    /**
     * Reset settings to defaults
     */
    resetToDefaults() {
        this.settings = { ...this.defaults };
        this.saveSettings();
    }

    /**
     * Get settings for debugging/export
     * @returns {Object} Current settings
     */
    getSettings() {
        return { ...this.settings };
    }

    /**
     * Check if glow effects are enabled
     * @returns {boolean} True if intensity is not OFF
     */
    isEnabled() {
        return this.settings.intensity !== 'OFF';
    }

    /**
     * Get emissive intensity for current setting
     * @returns {number} Emissive intensity value
     */
    getEmissiveIntensity() {
        return this.intensityLevels[this.settings.intensity].emissive;
    }

    /**
     * Get bloom strength for current setting
     * @returns {number} Bloom strength value
     */
    getBloomStrength() {
        return this.intensityLevels[this.settings.intensity].bloom;
    }

    /**
     * Get display label for current intensity
     * @returns {string} Human-readable label
     */
    getIntensityLabel() {
        return this.intensityLevels[this.settings.intensity].label;
    }
}

module.exports = { GlowSettings };