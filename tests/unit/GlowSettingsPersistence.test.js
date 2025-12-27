/**
 * Integration tests for GlowSettings persistence functionality
 * Tests localStorage handling, error recovery, and settings migration
 */
const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
};

const MockLoggerClass = jest.fn().mockImplementation(() => mockLogger);
MockLoggerClass.create = jest.fn((namespace) => mockLogger);

jest.mock('@/utils/Logger.js', () => ({
    Logger: MockLoggerClass,
    logger: mockLogger,
    createLogger: jest.fn(() => mockLogger),
}));

const { GlowSettings } = require('@/systems/GlowSettings.js');

describe('GlowSettings Persistence Integration', () => {
    let mockLocalStorage;
    let originalConsole;

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
            }),
        };

        // Replace global localStorage
        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true,
        });

        // Mock console methods to avoid noise in tests
        originalConsole = {
            warn: console.warn,
            error: console.error,
        };
        console.warn = jest.fn();
        console.error = jest.fn();

        // Clear localStorage before each test
        mockLocalStorage.clear();
    });

    afterEach(() => {
        // Restore console methods
        console.warn = originalConsole.warn;
        console.error = originalConsole.error;
    });

    describe('robust localStorage handling', () => {
        it('should handle localStorage unavailability gracefully', () => {
            // Mock localStorage to throw error
            mockLocalStorage.getItem.mockImplementation(() => {
                throw new Error('localStorage not available');
            });

            const settings = new GlowSettings();

            expect(settings.getIntensity()).toBe('MEDIUM'); // Should use defaults
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Error loading glow settings:',
                expect.any(Error)
            );
        });

        it('should handle localStorage quota exceeded during save', () => {
            const settings = new GlowSettings();

            // Mock setItem to throw quota exceeded error
            mockLocalStorage.setItem.mockImplementation(() => {
                throw new Error('QuotaExceededError');
            });

            settings.setIntensity('HIGH');

            expect(mockLogger.error).toHaveBeenCalledWith(
                'Error saving glow settings:',
                expect.any(Error)
            );
        });

        it('should handle corrupted JSON data gracefully', () => {
            // Set invalid JSON in localStorage
            mockLocalStorage.data['lightbikes_glow_settings'] = 'invalid json {';

            const settings = new GlowSettings();

            expect(settings.getIntensity()).toBe('MEDIUM'); // Should use defaults
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Error loading glow settings:',
                expect.any(Error)
            );
        });

        it('should handle null/undefined localStorage values', () => {
            // localStorage returns null for missing keys
            mockLocalStorage.getItem.mockReturnValue(null);

            const settings = new GlowSettings();

            expect(settings.getIntensity()).toBe('MEDIUM'); // Should use defaults
        });

        it('should handle empty string localStorage values', () => {
            mockLocalStorage.data['lightbikes_glow_settings'] = '';

            const settings = new GlowSettings();

            expect(settings.getIntensity()).toBe('MEDIUM'); // Should use defaults
        });
    });

    describe('settings validation and recovery', () => {
        it('should reject settings with invalid intensity values', () => {
            mockLocalStorage.data['lightbikes_glow_settings'] = JSON.stringify({
                intensity: 'INVALID_LEVEL',
                version: 1,
            });

            const settings = new GlowSettings();

            expect(settings.getIntensity()).toBe('MEDIUM'); // Should use defaults
            expect(mockLogger.warn).toHaveBeenCalledWith(
                'Invalid stored glow settings, using defaults'
            );
        });

        it('should reject non-object settings', () => {
            mockLocalStorage.data['lightbikes_glow_settings'] = JSON.stringify('string_value');

            const settings = new GlowSettings();

            expect(settings.getIntensity()).toBe('MEDIUM'); // Should use defaults
            expect(mockLogger.warn).toHaveBeenCalledWith(
                'Invalid stored glow settings, using defaults'
            );
        });

        it('should handle settings with missing properties gracefully', () => {
            mockLocalStorage.data['lightbikes_glow_settings'] = JSON.stringify({
                // Missing intensity property
                version: 1,
            });

            const settings = new GlowSettings();

            expect(settings.getIntensity()).toBe('MEDIUM'); // Should use defaults
        });

        it('should handle settings with extra properties gracefully', () => {
            mockLocalStorage.data['lightbikes_glow_settings'] = JSON.stringify({
                intensity: 'HIGH',
                version: 1,
                extraProperty: 'should be ignored',
                anotherExtra: 123,
            });

            const settings = new GlowSettings();

            expect(settings.getIntensity()).toBe('HIGH'); // Should use valid intensity
        });
    });

    describe('settings migration', () => {
        it('should migrate settings from version 0 to current version', () => {
            // Simulate old settings without version
            mockLocalStorage.data['lightbikes_glow_settings'] = JSON.stringify({
                intensity: 'LOW',
                // No version property
            });

            const settings = new GlowSettings();

            expect(settings.getIntensity()).toBe('LOW');

            // Trigger a save to apply migration
            settings.setIntensity('LOW');

            // Verify migration was applied by checking saved data
            const savedData = JSON.parse(mockLocalStorage.data['lightbikes_glow_settings']);
            expect(savedData.version).toBe(1);
        });

        it('should preserve current version settings without migration', () => {
            mockLocalStorage.data['lightbikes_glow_settings'] = JSON.stringify({
                intensity: 'HIGH',
                version: 1,
            });

            const settings = new GlowSettings();

            expect(settings.getIntensity()).toBe('HIGH');

            // Verify no unnecessary migration occurred
            const savedData = JSON.parse(mockLocalStorage.data['lightbikes_glow_settings']);
            expect(savedData.version).toBe(1);
            expect(savedData.intensity).toBe('HIGH');
        });

        it('should handle future version settings gracefully', () => {
            mockLocalStorage.data['lightbikes_glow_settings'] = JSON.stringify({
                intensity: 'MEDIUM',
                version: 999, // Future version
                futureProperty: 'unknown',
            });

            const settings = new GlowSettings();

            expect(settings.getIntensity()).toBe('MEDIUM'); // Should still work
        });
    });

    describe('persistence lifecycle', () => {
        it('should persist settings across multiple instances', () => {
            // First instance sets HIGH intensity
            const settings1 = new GlowSettings();
            settings1.setIntensity('HIGH');

            // Second instance should load HIGH intensity
            const settings2 = new GlowSettings();
            expect(settings2.getIntensity()).toBe('HIGH');
        });

        it('should persist settings after multiple changes', () => {
            const settings = new GlowSettings();

            settings.setIntensity('LOW');
            settings.setIntensity('HIGH');
            settings.setIntensity('OFF');

            // Create new instance to verify final state was persisted
            const newSettings = new GlowSettings();
            expect(newSettings.getIntensity()).toBe('OFF');
        });

        it('should handle reset to defaults correctly', () => {
            const settings = new GlowSettings();
            settings.setIntensity('HIGH');

            // Reset should save defaults
            settings.resetToDefaults();

            // New instance should load defaults
            const newSettings = new GlowSettings();
            expect(newSettings.getIntensity()).toBe('MEDIUM');
        });
    });

    describe('error recovery scenarios', () => {
        it('should recover from localStorage being disabled mid-session', () => {
            const settings = new GlowSettings();

            // Initially works
            settings.setIntensity('HIGH');
            expect(settings.getIntensity()).toBe('HIGH');

            // localStorage becomes unavailable
            mockLocalStorage.setItem.mockImplementation(() => {
                throw new Error('localStorage disabled');
            });

            // Should still work in memory, just not persist
            settings.setIntensity('LOW');
            expect(settings.getIntensity()).toBe('LOW');
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Error saving glow settings:',
                expect.any(Error)
            );
        });

        it('should handle partial localStorage corruption', () => {
            // Set up partially corrupted data
            mockLocalStorage.data['lightbikes_glow_settings'] = '{"intensity":"HIGH","version":';

            const settings = new GlowSettings();

            expect(settings.getIntensity()).toBe('MEDIUM'); // Should use defaults
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Error loading glow settings:',
                expect.any(Error)
            );

            // Should be able to save new settings after recovery
            settings.setIntensity('LOW');
            expect(settings.getIntensity()).toBe('LOW');
        });

        it('should handle localStorage returning unexpected data types', () => {
            // Mock getItem to return unexpected types
            mockLocalStorage.getItem.mockReturnValue(123); // Number instead of string

            const settings = new GlowSettings();

            expect(settings.getIntensity()).toBe('MEDIUM'); // Should use defaults
            // This case is handled gracefully without error logging
        });
    });

    describe('storage key consistency', () => {
        it('should use consistent storage key across instances', () => {
            const settings1 = new GlowSettings();
            settings1.setIntensity('HIGH');

            // Create second instance after first has saved
            const settings2 = new GlowSettings();

            expect(settings2.getIntensity()).toBe('HIGH');

            // Verify both instances use the same storage key
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                'lightbikes_glow_settings',
                expect.any(String)
            );
        });

        it('should not interfere with other localStorage keys', () => {
            // Set up other localStorage data
            mockLocalStorage.data['other_app_settings'] = 'other_data';
            mockLocalStorage.data['lightbikes_other_settings'] = 'other_lightbikes_data';

            const settings = new GlowSettings();
            settings.setIntensity('HIGH');

            // Other data should remain unchanged
            expect(mockLocalStorage.data['other_app_settings']).toBe('other_data');
            expect(mockLocalStorage.data['lightbikes_other_settings']).toBe(
                'other_lightbikes_data'
            );
        });
    });
});
