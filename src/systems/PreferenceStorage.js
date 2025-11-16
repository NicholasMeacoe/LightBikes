/**
 * PreferenceStorage - Handles persistence of customization preferences
 * Uses browser localStorage with graceful error handling and fallback mechanisms
 */
class PreferenceStorage {
    constructor() {
        this.storageKey = 'lightbikes_customization_preferences';
        this.currentVersion = '1.0';
        this.sessionFallback = {}; // Fallback storage when localStorage is unavailable
        
        // Test storage availability on initialization
        this.storageAvailable = this.isStorageAvailable();
        
        if (!this.storageAvailable) {
            console.warn('localStorage not available, using session-only preferences');
        }
    }
    
    /**
     * Save preferences to storage
     * @param {Object} preferences - Preferences object to save
     * @returns {boolean} Success status
     */
    savePreferences(preferences) {
        if (!preferences || typeof preferences !== 'object') {
            console.error('Invalid preferences object provided');
            return false;
        }
        
        const storageData = {
            version: this.currentVersion,
            preferences: preferences,
            timestamp: new Date().toISOString()
        };
        
        try {
            if (this.storageAvailable) {
                const serializedData = JSON.stringify(storageData);
                localStorage.setItem(this.storageKey, serializedData);
                return true;
            } else {
                // Use session fallback
                this.sessionFallback = storageData;
                return true;
            }
        } catch (error) {
            return this.handleStorageError(error, 'save', storageData);
        }
    }
    
    /**
     * Load preferences from storage
     * @returns {Object|null} Loaded preferences or null if not found/invalid
     */
    loadPreferences() {
        try {
            let serializedData = null;
            
            if (this.storageAvailable) {
                serializedData = localStorage.getItem(this.storageKey);
            } else {
                // Use session fallback
                if (this.sessionFallback && this.sessionFallback.preferences) {
                    return this.sessionFallback;
                }
                return null;
            }
            
            if (!serializedData) {
                return null; // No saved preferences
            }
            
            const storageData = JSON.parse(serializedData);
            
            // Validate data structure
            if (!this.validateStorageData(storageData)) {
                console.warn('Invalid preference data structure, resetting to defaults');
                this.clearPreferences();
                return null;
            }
            
            // Handle version migration if needed
            if (storageData.version !== this.currentVersion) {
                const migratedData = this.migratePreferences(storageData);
                if (migratedData) {
                    // Save migrated data
                    this.savePreferences(migratedData.preferences);
                    return migratedData;
                }
            }
            
            return storageData;
            
        } catch (error) {
            return this.handleStorageError(error, 'load');
        }
    }
    
    /**
     * Clear all saved preferences
     * @returns {boolean} Success status
     */
    clearPreferences() {
        try {
            if (this.storageAvailable) {
                localStorage.removeItem(this.storageKey);
            } else {
                this.sessionFallback = {};
            }
            return true;
        } catch (error) {
            return this.handleStorageError(error, 'clear');
        }
    }
    
    /**
     * Check if localStorage is available and functional
     * @returns {boolean} True if localStorage is available
     */
    isStorageAvailable() {
        try {
            const testKey = '__lightbikes_storage_test__';
            const testValue = 'test';
            
            localStorage.setItem(testKey, testValue);
            const retrieved = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);
            
            return retrieved === testValue;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Handle storage errors with appropriate fallback strategies
     * @param {Error} error - The error that occurred
     * @param {string} operation - The operation that failed ('save', 'load', 'clear')
     * @param {Object} data - Data involved in the operation (for save operations)
     * @returns {boolean|Object|null} Appropriate return value based on operation
     */
    handleStorageError(error, operation, data = null) {
        console.error(`Storage ${operation} error:`, error);
        
        // Check if it's a quota exceeded error
        if (this.isQuotaExceededError(error)) {
            return this.handleQuotaExceeded(operation, data);
        }
        
        // Check if storage became unavailable
        if (!this.isStorageAvailable()) {
            this.storageAvailable = false;
            console.warn('localStorage became unavailable, switching to session-only mode');
            
            if (operation === 'save' && data) {
                this.sessionFallback = data;
                return true;
            } else if (operation === 'load') {
                return this.sessionFallback.preferences ? this.sessionFallback : null;
            } else if (operation === 'clear') {
                this.sessionFallback = {};
                return true;
            }
        }
        
        // For corrupted data during load
        if (operation === 'load' && error instanceof SyntaxError) {
            console.warn('Corrupted preference data detected, clearing and using defaults');
            this.clearPreferences();
            return null;
        }
        
        // Default error handling
        if (operation === 'save') {
            return false;
        } else if (operation === 'load') {
            return null;
        } else if (operation === 'clear') {
            return false;
        }
        
        return false;
    }
    
    /**
     * Handle quota exceeded errors
     * @param {string} operation - The operation that failed
     * @param {Object} data - Data involved in the operation
     * @returns {boolean|Object|null} Appropriate return value
     */
    handleQuotaExceeded(operation, data) {
        console.warn('Storage quota exceeded, attempting cleanup');
        
        if (operation === 'save') {
            try {
                // Try to clear old data and retry
                this.clearOldData();
                
                // Retry the save operation
                const serializedData = JSON.stringify(data);
                localStorage.setItem(this.storageKey, serializedData);
                return true;
            } catch (retryError) {
                console.error('Failed to save even after cleanup, using session fallback');
                this.sessionFallback = data;
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Clear old or unnecessary data to free up storage space
     */
    clearOldData() {
        try {
            // Get all localStorage keys
            const keysToCheck = [];
            for (let i = 0; i < localStorage.length; i++) {
                keysToCheck.push(localStorage.key(i));
            }
            
            // Remove old game data or other non-essential items
            keysToCheck.forEach(key => {
                if (key && key !== this.storageKey) {
                    // Check if it's old game data (simple heuristic)
                    if (key.includes('game_') || key.includes('temp_') || key.includes('cache_')) {
                        try {
                            localStorage.removeItem(key);
                        } catch (error) {
                            // Ignore errors when cleaning up
                        }
                    }
                }
            });
        } catch (error) {
            console.warn('Failed to clear old data:', error);
        }
    }
    
    /**
     * Check if an error is a quota exceeded error
     * @param {Error} error - Error to check
     * @returns {boolean} True if it's a quota exceeded error
     */
    isQuotaExceededError(error) {
        return error && (
            error.name === 'QuotaExceededError' ||
            error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
            error.code === 22 ||
            error.code === 1014
        );
    }
    
    /**
     * Validate storage data structure
     * @param {Object} data - Data to validate
     * @returns {boolean} True if data structure is valid
     */
    validateStorageData(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }
        
        // Check required fields
        if (!data.version || !data.preferences || !data.timestamp) {
            return false;
        }
        
        // Validate preferences object
        const prefs = data.preferences;
        if (typeof prefs !== 'object') {
            return false;
        }
        
        // Validate individual preference fields (optional validation)
        if (prefs.bikeColor && typeof prefs.bikeColor !== 'string') {
            return false;
        }
        if (prefs.trailColor && typeof prefs.trailColor !== 'string') {
            return false;
        }
        if (prefs.trailStyle && typeof prefs.trailStyle !== 'string') {
            return false;
        }
        if (prefs.arenaTheme && typeof prefs.arenaTheme !== 'string') {
            return false;
        }
        
        return true;
    }
    
    /**
     * Migrate preferences from older versions
     * @param {Object} oldData - Old preference data
     * @returns {Object|null} Migrated data or null if migration failed
     */
    migratePreferences(oldData) {
        try {
            // Handle null or undefined data
            if (!oldData) {
                return null;
            }
            
            // Currently only version 1.0 exists, but this provides framework for future migrations
            if (!oldData.version) {
                // Assume very old format, try to migrate
                const migratedPreferences = {
                    bikeColor: oldData.bikeColor || '#00FF00',
                    trailColor: oldData.trailColor || '#00FF00',
                    trailStyle: oldData.trailStyle || 'solid',
                    arenaTheme: oldData.arenaTheme || 'classic-grid'
                };
                
                return {
                    version: this.currentVersion,
                    preferences: migratedPreferences,
                    timestamp: new Date().toISOString()
                };
            }
            
            // For future version migrations, add logic here
            
            return oldData; // No migration needed
        } catch (error) {
            console.error('Failed to migrate preferences:', error);
            return null;
        }
    }
    
    /**
     * Get storage statistics
     * @returns {Object} Storage usage information
     */
    getStorageStats() {
        const stats = {
            available: this.storageAvailable,
            usingFallback: !this.storageAvailable,
            hasData: false,
            dataSize: 0,
            lastSaved: null
        };
        
        try {
            if (this.storageAvailable) {
                const data = localStorage.getItem(this.storageKey);
                if (data) {
                    stats.hasData = true;
                    stats.dataSize = data.length;
                    
                    const parsed = JSON.parse(data);
                    stats.lastSaved = parsed.timestamp;
                }
            } else {
                stats.hasData = Object.keys(this.sessionFallback).length > 0;
                stats.dataSize = JSON.stringify(this.sessionFallback).length;
                stats.lastSaved = this.sessionFallback.timestamp;
            }
        } catch (error) {
            console.warn('Failed to get storage stats:', error);
        }
        
        return stats;
    }
    
    /**
     * Export preferences as JSON string
     * @returns {string|null} JSON string of preferences or null if no data
     */
    exportPreferences() {
        try {
            const data = this.loadPreferences();
            if (data && data.preferences) {
                return JSON.stringify(data.preferences, null, 2);
            }
            return null;
        } catch (error) {
            console.error('Failed to export preferences:', error);
            return null;
        }
    }
    
    /**
     * Import preferences from JSON string
     * @param {string} jsonString - JSON string containing preferences
     * @returns {boolean} Success status
     */
    importPreferences(jsonString) {
        try {
            const preferences = JSON.parse(jsonString);
            
            // Basic validation
            if (!preferences || typeof preferences !== 'object') {
                throw new Error('Invalid preferences format');
            }
            
            return this.savePreferences(preferences);
        } catch (error) {
            console.error('Failed to import preferences:', error);
            return false;
        }
    }
}

module.exports = { PreferenceStorage };