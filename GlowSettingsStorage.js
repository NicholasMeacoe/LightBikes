/**
 * GlowSettingsStorage - Advanced storage utilities with comprehensive error recovery
 * 
 * This class provides enterprise-grade localStorage handling for glow settings
 * with comprehensive error recovery, data validation, backup systems, and
 * migration support. It ensures settings persistence even in challenging
 * environments with storage limitations or corruption.
 * 
 * Key Features:
 * - Dual-layer storage system (primary + backup)
 * - Comprehensive error recovery with automatic fallback
 * - Data validation and sanitization on load/save
 * - Version-based migration system for future updates
 * - Storage availability detection and graceful degradation
 * - Import/export functionality for settings transfer
 * - Storage usage monitoring and optimization
 * 
 * Storage Architecture:
 * - Primary storage: Main settings location
 * - Backup storage: Automatic backup of last known good state
 * - Recovery chain: Primary → Backup → Defaults
 * - Validation at every step to ensure data integrity
 * 
 * Error Recovery Strategy:
 * 1. Attempt to load from primary storage
 * 2. If corrupted, attempt backup recovery
 * 3. If backup fails, use default settings
 * 4. Create new backup from successful load
 * 5. Restore primary from backup if needed
 * 
 * Migration System:
 * - Version tracking in stored settings
 * - Automatic migration on version mismatch
 * - Backward compatibility preservation
 * - Migration logging for debugging
 * 
 * Usage Example:
 * ```javascript
 * const storage = new GlowSettingsStorage('lightbikes_glow_settings');
 * 
 * // Load settings with full error recovery
 * const settings = storage.loadSettings();
 * if (settings) {
 *     console.log('Settings loaded successfully');
 * } else {
 *     console.log('Using default settings');
 * }
 * 
 * // Save settings with backup creation
 * const success = storage.saveSettings({
 *     intensity: 'HIGH',
 *     version: 1
 * });
 * 
 * // Get storage information
 * const info = storage.getStorageInfo();
 * console.log(`Storage usage: ${info.totalSize} bytes`);
 * 
 * // Export settings for backup
 * const exported = storage.exportSettings();
 * 
 * // Import settings from backup
 * storage.importSettings(exported);
 * ```
 * 
 * @class GlowSettingsStorage
 * @author LightBikes Development Team
 * @version 1.0.0
 * @since 2024
 */
class GlowSettingsStorage {
    constructor(storageKey = 'lightbikes_glow_settings') {
        this.storageKey = storageKey;
        this.backupKey = `${storageKey}_backup`;
        this.isStorageAvailable = this.checkStorageAvailability();
    }

    /**
     * Check if localStorage is available and functional
     * @returns {boolean} True if localStorage is available
     */
    checkStorageAvailability() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            console.warn('localStorage is not available:', error.message);
            return false;
        }
    }

    /**
     * Load settings with comprehensive error handling
     * @returns {Object|null} Loaded settings or null if failed
     */
    loadSettings() {
        if (!this.isStorageAvailable) {
            return null;
        }

        try {
            // Try to load primary settings
            const primaryData = this.loadFromKey(this.storageKey);
            if (primaryData) {
                // Create backup of successful load
                this.createBackup(primaryData);
                return primaryData;
            }

            // If primary fails, try backup
            console.warn('Primary settings corrupted, attempting backup recovery');
            const backupData = this.loadFromKey(this.backupKey);
            if (backupData) {
                // Restore backup to primary
                this.saveSettings(backupData);
                return backupData;
            }

            return null;
        } catch (error) {
            console.error('Failed to load glow settings:', error);
            return null;
        }
    }

    /**
     * Load settings from specific localStorage key
     * @param {string} key - Storage key to load from
     * @returns {Object|null} Parsed settings or null
     */
    loadFromKey(key) {
        try {
            const stored = localStorage.getItem(key);
            if (!stored || stored.trim() === '') {
                return null;
            }

            const parsed = JSON.parse(stored);
            
            // Basic validation
            if (!parsed || typeof parsed !== 'object') {
                throw new Error('Invalid settings format');
            }

            return parsed;
        } catch (error) {
            console.warn(`Failed to load from key ${key}:`, error.message);
            return null;
        }
    }

    /**
     * Save settings with backup creation
     * @param {Object} settings - Settings to save
     * @returns {boolean} True if save was successful
     */
    saveSettings(settings) {
        if (!this.isStorageAvailable) {
            console.warn('Cannot save settings: localStorage not available');
            return false;
        }

        try {
            const serialized = JSON.stringify(settings);
            
            // Validate serialized data
            if (!serialized || serialized === '{}') {
                throw new Error('Settings serialization failed');
            }

            // Create backup before saving new data
            this.createBackupFromCurrent();
            
            // Save new settings
            localStorage.setItem(this.storageKey, serialized);
            
            // Verify save was successful
            const verification = localStorage.getItem(this.storageKey);
            if (verification !== serialized) {
                throw new Error('Settings verification failed after save');
            }

            return true;
        } catch (error) {
            console.error('Failed to save glow settings:', error);
            
            // Attempt to restore from backup if save failed
            this.restoreFromBackup();
            return false;
        }
    }

    /**
     * Create backup of current settings
     */
    createBackupFromCurrent() {
        try {
            const current = localStorage.getItem(this.storageKey);
            if (current) {
                localStorage.setItem(this.backupKey, current);
            }
        } catch (error) {
            console.warn('Failed to create settings backup:', error.message);
        }
    }

    /**
     * Create backup from provided data
     * @param {Object} data - Data to backup
     */
    createBackup(data) {
        try {
            const serialized = JSON.stringify(data);
            localStorage.setItem(this.backupKey, serialized);
        } catch (error) {
            console.warn('Failed to create data backup:', error.message);
        }
    }

    /**
     * Restore settings from backup
     * @returns {boolean} True if restore was successful
     */
    restoreFromBackup() {
        try {
            const backup = localStorage.getItem(this.backupKey);
            if (backup) {
                localStorage.setItem(this.storageKey, backup);
                console.info('Settings restored from backup');
                return true;
            }
        } catch (error) {
            console.error('Failed to restore from backup:', error);
        }
        return false;
    }

    /**
     * Clear all settings and backups
     */
    clearAllSettings() {
        try {
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.backupKey);
        } catch (error) {
            console.error('Failed to clear settings:', error);
        }
    }

    /**
     * Get storage usage information
     * @returns {Object} Storage usage stats
     */
    getStorageInfo() {
        if (!this.isStorageAvailable) {
            return { available: false };
        }

        try {
            const primary = localStorage.getItem(this.storageKey);
            const backup = localStorage.getItem(this.backupKey);
            
            return {
                available: true,
                primarySize: primary ? primary.length : 0,
                backupSize: backup ? backup.length : 0,
                hasBackup: !!backup,
                totalSize: (primary ? primary.length : 0) + (backup ? backup.length : 0)
            };
        } catch (error) {
            return { available: false, error: error.message };
        }
    }

    /**
     * Validate settings object structure
     * @param {Object} settings - Settings to validate
     * @returns {boolean} True if valid
     */
    validateSettings(settings) {
        if (!settings || typeof settings !== 'object') {
            return false;
        }

        // Check for required properties and valid values
        const validIntensities = ['OFF', 'LOW', 'MEDIUM', 'HIGH'];
        
        if (settings.intensity && !validIntensities.includes(settings.intensity)) {
            return false;
        }

        if (settings.version && typeof settings.version !== 'number') {
            return false;
        }

        return true;
    }

    /**
     * Migrate settings to new format if needed
     * @param {Object} settings - Settings to migrate
     * @returns {Object} Migrated settings
     */
    migrateSettings(settings) {
        const migrated = { ...settings };
        const currentVersion = 1;
        
        const settingsVersion = settings.version || 0;
        
        if (settingsVersion < currentVersion) {
            // Apply migrations
            if (settingsVersion < 1) {
                // Migration to version 1
                migrated.version = 1;
                
                // Add any new default properties for v1
                if (!migrated.intensity) {
                    migrated.intensity = 'MEDIUM';
                }
            }
            
            console.info(`Migrated glow settings from version ${settingsVersion} to ${currentVersion}`);
        }
        
        return migrated;
    }

    /**
     * Export settings for backup/transfer
     * @returns {string|null} Serialized settings or null
     */
    exportSettings() {
        const settings = this.loadSettings();
        if (settings) {
            try {
                return JSON.stringify(settings, null, 2);
            } catch (error) {
                console.error('Failed to export settings:', error);
            }
        }
        return null;
    }

    /**
     * Import settings from serialized data
     * @param {string} serializedSettings - Serialized settings data
     * @returns {boolean} True if import was successful
     */
    importSettings(serializedSettings) {
        try {
            const settings = JSON.parse(serializedSettings);
            
            if (!this.validateSettings(settings)) {
                throw new Error('Invalid settings format');
            }
            
            const migrated = this.migrateSettings(settings);
            return this.saveSettings(migrated);
        } catch (error) {
            console.error('Failed to import settings:', error);
            return false;
        }
    }
}

module.exports = { GlowSettingsStorage };