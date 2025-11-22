const { GlowSettings } = require('@/systems/GlowSettings.js');

describe('GlowSettings', () => {
    let glowSettings;
    let mockLocalStorage;

    beforeEach(() => {
        // Mock localStorage
        mockLocalStorage = {
            data: {},
            getItem: jest.fn((key) => mockLocalStorage.data[key] || null),
            setItem: jest.fn((key, value) => {
                mockLocalStorage.data[key] = value;
            }),
            removeItem: jest.fn((key) => {
                delete mockLocalStorage.data[key];
            }),
            clear: jest.fn(() => {
                mockLocalStorage.data = {};
            })
        };

        // Replace global localStorage
        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true
        });

        // Clear localStorage before each test
        mockLocalStorage.clear();

        glowSettings = new GlowSettings();
    });

    describe('constructor', () => {
        it('should initialize with default settings', () => {
            expect(glowSettings.getIntensity()).toBe('MEDIUM');
            expect(glowSettings.isEnabled()).toBe(true);
        });

        it('should define all intensity levels', () => {
            const levels = glowSettings.getAvailableLevels();
            expect(levels).toHaveProperty('OFF');
            expect(levels).toHaveProperty('LOW');
            expect(levels).toHaveProperty('MEDIUM');
            expect(levels).toHaveProperty('HIGH');
        });

        it('should have proper intensity level configurations', () => {
            const levels = glowSettings.getAvailableLevels();
            
            expect(levels.OFF).toEqual({ emissive: 0, bloom: 0, label: 'Off' });
            expect(levels.LOW).toEqual({ emissive: 0.3, bloom: 0.5, label: 'Low' });
            expect(levels.MEDIUM).toEqual({ emissive: 0.6, bloom: 1.0, label: 'Medium' });
            expect(levels.HIGH).toEqual({ emissive: 0.8, bloom: 1.5, label: 'High' });
        });
    });

    describe('setIntensity', () => {
        it('should set valid intensity levels', () => {
            expect(glowSettings.setIntensity('HIGH')).toBe(true);
            expect(glowSettings.getIntensity()).toBe('HIGH');

            expect(glowSettings.setIntensity('OFF')).toBe(true);
            expect(glowSettings.getIntensity()).toBe('OFF');
        });

        it('should reject invalid intensity levels', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            expect(glowSettings.setIntensity('INVALID')).toBe(false);
            expect(glowSettings.getIntensity()).toBe('MEDIUM'); // Should remain unchanged
            
            expect(consoleSpy).toHaveBeenCalledWith('Invalid glow intensity level: INVALID');
            consoleSpy.mockRestore();
        });

        it('should save settings when intensity is changed', () => {
            glowSettings.setIntensity('HIGH');
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                'lightbikes_glow_settings',
                expect.stringContaining('"intensity":"HIGH"')
            );
        });
    });

    describe('getIntensityConfig', () => {
        it('should return configuration for current intensity', () => {
            glowSettings.setIntensity('HIGH');
            const config = glowSettings.getIntensityConfig();
            
            expect(config).toEqual({ emissive: 0.8, bloom: 1.5, label: 'High' });
        });

        it('should return OFF configuration when disabled', () => {
            glowSettings.setIntensity('OFF');
            const config = glowSettings.getIntensityConfig();
            
            expect(config).toEqual({ emissive: 0, bloom: 0, label: 'Off' });
        });
    });

    describe('isValidIntensity', () => {
        it('should validate correct intensity levels', () => {
            expect(glowSettings.isValidIntensity('OFF')).toBe(true);
            expect(glowSettings.isValidIntensity('LOW')).toBe(true);
            expect(glowSettings.isValidIntensity('MEDIUM')).toBe(true);
            expect(glowSettings.isValidIntensity('HIGH')).toBe(true);
        });

        it('should reject invalid intensity levels', () => {
            expect(glowSettings.isValidIntensity('INVALID')).toBe(false);
            expect(glowSettings.isValidIntensity('')).toBe(false);
            expect(glowSettings.isValidIntensity(null)).toBe(false);
            expect(glowSettings.isValidIntensity(undefined)).toBe(false);
        });
    });

    describe('localStorage persistence', () => {
        it('should save settings to localStorage', () => {
            glowSettings.setIntensity('HIGH');
            
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                'lightbikes_glow_settings',
                expect.stringContaining('"intensity":"HIGH"')
            );
        });

        it('should load settings from localStorage', () => {
            // Pre-populate localStorage
            mockLocalStorage.data['lightbikes_glow_settings'] = JSON.stringify({
                intensity: 'LOW',
                version: 1
            });

            // Create new instance to trigger loading
            const newSettings = new GlowSettings();
            expect(newSettings.getIntensity()).toBe('LOW');
        });

        it('should handle missing localStorage gracefully', () => {
            // localStorage returns null for missing keys
            const newSettings = new GlowSettings();
            expect(newSettings.getIntensity()).toBe('MEDIUM'); // Default
        });

        it('should handle corrupted localStorage data', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            // Set invalid JSON
            mockLocalStorage.data['lightbikes_glow_settings'] = 'invalid json';
            
            const newSettings = new GlowSettings();
            expect(newSettings.getIntensity()).toBe('MEDIUM'); // Should use defaults
            
            expect(consoleSpy).toHaveBeenCalledWith('Error loading glow settings:', expect.any(Error));
            consoleSpy.mockRestore();
        });

        it('should handle localStorage errors during save', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            // Mock localStorage.setItem to throw error
            mockLocalStorage.setItem.mockImplementation(() => {
                throw new Error('Storage quota exceeded');
            });
            
            glowSettings.setIntensity('HIGH');
            
            expect(consoleSpy).toHaveBeenCalledWith('Error saving glow settings:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });

    describe('settings validation', () => {
        it('should validate correct settings objects', () => {
            const validSettings = { intensity: 'HIGH', version: 1 };
            expect(glowSettings.validateSettings(validSettings)).toBe(true);
        });

        it('should reject invalid settings objects', () => {
            expect(glowSettings.validateSettings(null)).toBe(false);
            expect(glowSettings.validateSettings(undefined)).toBe(false);
            expect(glowSettings.validateSettings('string')).toBe(false);
            expect(glowSettings.validateSettings({ intensity: 'INVALID' })).toBe(false);
        });

        it('should handle settings with invalid intensity', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            mockLocalStorage.data['lightbikes_glow_settings'] = JSON.stringify({
                intensity: 'INVALID_LEVEL',
                version: 1
            });
            
            const newSettings = new GlowSettings();
            expect(newSettings.getIntensity()).toBe('MEDIUM'); // Should use defaults
            
            expect(consoleSpy).toHaveBeenCalledWith('Invalid stored glow settings, using defaults');
            consoleSpy.mockRestore();
        });
    });

    describe('settings migration', () => {
        it('should migrate settings from version 0 to 1', () => {
            const oldSettings = { intensity: 'HIGH' }; // No version property
            const migrated = glowSettings.migrateSettings(oldSettings);
            
            expect(migrated.version).toBe(1);
            expect(migrated.intensity).toBe('HIGH');
        });

        it('should preserve settings that are already current version', () => {
            const currentSettings = { intensity: 'LOW', version: 1 };
            const migrated = glowSettings.migrateSettings(currentSettings);
            
            expect(migrated).toEqual(currentSettings);
        });
    });

    describe('utility methods', () => {
        it('should check if glow effects are enabled', () => {
            glowSettings.setIntensity('OFF');
            expect(glowSettings.isEnabled()).toBe(false);

            glowSettings.setIntensity('LOW');
            expect(glowSettings.isEnabled()).toBe(true);
        });

        it('should get emissive intensity for current setting', () => {
            glowSettings.setIntensity('HIGH');
            expect(glowSettings.getEmissiveIntensity()).toBe(0.8);

            glowSettings.setIntensity('OFF');
            expect(glowSettings.getEmissiveIntensity()).toBe(0);
        });

        it('should get bloom strength for current setting', () => {
            glowSettings.setIntensity('MEDIUM');
            expect(glowSettings.getBloomStrength()).toBe(1.0);

            glowSettings.setIntensity('LOW');
            expect(glowSettings.getBloomStrength()).toBe(0.5);
        });

        it('should get intensity label', () => {
            glowSettings.setIntensity('HIGH');
            expect(glowSettings.getIntensityLabel()).toBe('High');

            glowSettings.setIntensity('OFF');
            expect(glowSettings.getIntensityLabel()).toBe('Off');
        });

        it('should reset to defaults', () => {
            glowSettings.setIntensity('HIGH');
            glowSettings.resetToDefaults();
            
            expect(glowSettings.getIntensity()).toBe('MEDIUM');
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                'lightbikes_glow_settings',
                expect.stringContaining('"intensity":"MEDIUM"')
            );
        });

        it('should return settings copy for debugging', () => {
            glowSettings.setIntensity('LOW');
            const settings = glowSettings.getSettings();
            
            expect(settings.intensity).toBe('LOW');
            
            // Should be a copy, not reference
            settings.intensity = 'HIGH';
            expect(glowSettings.getIntensity()).toBe('LOW');
        });
    });
});