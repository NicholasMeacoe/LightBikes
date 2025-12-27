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

const { PreferenceStorage } = require('@/systems/PreferenceStorage.js');

// Mock localStorage
const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    key: jest.fn(),
    length: 0,
};

// Mock global localStorage
Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
});

describe('PreferenceStorage', () => {
    let preferenceStorage;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        mockLocalStorage.length = 0;

        // Set up localStorage to work correctly by default
        const storage = {};
        mockLocalStorage.setItem.mockImplementation((key, value) => {
            storage[key] = value;
        });
        mockLocalStorage.getItem.mockImplementation((key) => {
            return storage[key] || null;
        });
        mockLocalStorage.removeItem.mockImplementation((key) => {
            delete storage[key];
        });

        // Create fresh instance
        preferenceStorage = new PreferenceStorage();
    });

    describe('constructor', () => {
        it('should initialize with correct storage key and version', () => {
            expect(preferenceStorage.storageKey).toBe('lightbikes_customization_preferences');
            expect(preferenceStorage.currentVersion).toBe('1.0');
        });

        it('should test storage availability on initialization', () => {
            expect(mockLocalStorage.setItem).toHaveBeenCalled();
            expect(mockLocalStorage.getItem).toHaveBeenCalled();
            expect(mockLocalStorage.removeItem).toHaveBeenCalled();
        });
    });

    describe('savePreferences', () => {
        it('should save valid preferences to localStorage', () => {
            const preferences = {
                bikeColor: '#FF0000',
                trailColor: '#00FF00',
                trailStyle: 'glowing',
                arenaTheme: 'neon-city',
            };

            const result = preferenceStorage.savePreferences(preferences);

            expect(result).toBe(true);
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                'lightbikes_customization_preferences',
                expect.stringContaining('"bikeColor":"#FF0000"')
            );
        });

        it('should include version and timestamp in saved data', () => {
            const preferences = { bikeColor: '#FF0000' };

            preferenceStorage.savePreferences(preferences);

            // Find the call that's not the storage test
            const calls = mockLocalStorage.setItem.mock.calls;
            const dataCall = calls.find(
                (call) => call[0] === 'lightbikes_customization_preferences'
            );
            expect(dataCall).toBeDefined();

            const savedData = JSON.parse(dataCall[1]);
            expect(savedData.version).toBe('1.0');
            expect(savedData.timestamp).toBeDefined();
            expect(savedData.preferences).toEqual(preferences);
        });

        it('should reject invalid preferences object', () => {
            expect(preferenceStorage.savePreferences(null)).toBe(false);
            expect(preferenceStorage.savePreferences('invalid')).toBe(false);
            expect(preferenceStorage.savePreferences(undefined)).toBe(false);
        });

        it('should use session fallback when localStorage unavailable', () => {
            // Make localStorage unavailable
            preferenceStorage.storageAvailable = false;

            const preferences = { bikeColor: '#FF0000' };
            const result = preferenceStorage.savePreferences(preferences);

            expect(result).toBe(true);
            expect(preferenceStorage.sessionFallback.preferences).toEqual(preferences);
        });

        it('should handle localStorage errors gracefully', () => {
            mockLocalStorage.setItem.mockImplementation(() => {
                throw new Error('Storage error');
            });

            const preferences = { bikeColor: '#FF0000' };
            const result = preferenceStorage.savePreferences(preferences);

            // Should fallback to session storage
            expect(result).toBe(true);
            expect(preferenceStorage.sessionFallback.preferences).toEqual(preferences);
        });
    });

    describe('loadPreferences', () => {
        it('should load valid preferences from localStorage', () => {
            const savedData = {
                version: '1.0',
                preferences: {
                    bikeColor: '#FF0000',
                    trailStyle: 'glowing',
                },
                timestamp: '2024-01-01T00:00:00Z',
            };

            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedData));

            const result = preferenceStorage.loadPreferences();

            expect(result).toEqual(savedData);
            expect(mockLocalStorage.getItem).toHaveBeenCalledWith(
                'lightbikes_customization_preferences'
            );
        });

        it('should return null when no saved data exists', () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const result = preferenceStorage.loadPreferences();

            expect(result).toBeNull();
        });

        it('should handle corrupted JSON data', () => {
            mockLocalStorage.getItem.mockImplementation((key) => {
                if (key === '__lightbikes_storage_test__') {
                    return 'test'; // Keep storage test working
                }
                if (key === 'lightbikes_customization_preferences') {
                    return 'invalid json'; // Return corrupted data
                }
                return null;
            });

            const result = preferenceStorage.loadPreferences();

            expect(result).toBeNull();
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
                'lightbikes_customization_preferences'
            );
        });

        it('should validate data structure', () => {
            const invalidData = {
                version: '1.0',
                // Missing preferences field
                timestamp: '2024-01-01T00:00:00Z',
            };

            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(invalidData));

            const result = preferenceStorage.loadPreferences();

            expect(result).toBeNull();
            expect(mockLocalStorage.removeItem).toHaveBeenCalled(); // Should clear invalid data
        });

        it('should use session fallback when localStorage unavailable', () => {
            preferenceStorage.storageAvailable = false;
            preferenceStorage.sessionFallback = {
                version: '1.0',
                preferences: { bikeColor: '#FF0000' },
                timestamp: '2024-01-01T00:00:00Z',
            };

            const result = preferenceStorage.loadPreferences();

            expect(result).toEqual(preferenceStorage.sessionFallback);
        });
    });

    describe('clearPreferences', () => {
        it('should clear preferences from localStorage', () => {
            const result = preferenceStorage.clearPreferences();

            expect(result).toBe(true);
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
                'lightbikes_customization_preferences'
            );
        });

        it('should clear session fallback when localStorage unavailable', () => {
            preferenceStorage.storageAvailable = false;
            preferenceStorage.sessionFallback = { some: 'data' };

            const result = preferenceStorage.clearPreferences();

            expect(result).toBe(true);
            expect(preferenceStorage.sessionFallback).toEqual({});
        });

        it('should handle localStorage errors gracefully', () => {
            mockLocalStorage.removeItem.mockImplementation((key) => {
                if (key === '__lightbikes_storage_test__') {
                    return; // Allow storage test to work
                }
                throw new Error('Storage error');
            });

            const result = preferenceStorage.clearPreferences();

            expect(result).toBe(false);
        });
    });

    describe('isStorageAvailable', () => {
        it('should return true when localStorage works correctly', () => {
            mockLocalStorage.setItem.mockImplementation((key, value) => {});
            mockLocalStorage.getItem.mockImplementation((key) => {
                if (key === '__lightbikes_storage_test__') return 'test';
                return null;
            });

            const result = preferenceStorage.isStorageAvailable();

            expect(result).toBe(true);
        });

        it('should return false when localStorage throws errors', () => {
            mockLocalStorage.setItem.mockImplementation(() => {
                throw new Error('Storage not available');
            });

            const result = preferenceStorage.isStorageAvailable();

            expect(result).toBe(false);
        });

        it('should return false when localStorage returns incorrect values', () => {
            mockLocalStorage.setItem.mockImplementation((key, value) => {});
            mockLocalStorage.getItem.mockImplementation(() => 'wrong-value');

            const result = preferenceStorage.isStorageAvailable();

            expect(result).toBe(false);
        });
    });

    describe('quota exceeded handling', () => {
        it('should handle quota exceeded errors', () => {
            const quotaError = new Error('Quota exceeded');
            quotaError.name = 'QuotaExceededError';

            mockLocalStorage.setItem.mockImplementation(() => {
                throw quotaError;
            });

            const preferences = { bikeColor: '#FF0000' };
            const result = preferenceStorage.savePreferences(preferences);

            // Should attempt cleanup and retry, then fallback to session storage
            expect(result).toBe(true);
            expect(preferenceStorage.sessionFallback.preferences).toEqual(preferences);
        });

        it('should identify quota exceeded errors correctly', () => {
            const quotaError1 = new Error('Test');
            quotaError1.name = 'QuotaExceededError';

            const quotaError2 = new Error('Test');
            quotaError2.code = 22;

            const normalError = new Error('Normal error');

            expect(preferenceStorage.isQuotaExceededError(quotaError1)).toBe(true);
            expect(preferenceStorage.isQuotaExceededError(quotaError2)).toBe(true);
            expect(preferenceStorage.isQuotaExceededError(normalError)).toBe(false);
        });
    });

    describe('data validation', () => {
        it('should validate correct data structure', () => {
            const validData = {
                version: '1.0',
                preferences: {
                    bikeColor: '#FF0000',
                    trailColor: '#00FF00',
                    trailStyle: 'solid',
                    arenaTheme: 'classic-grid',
                },
                timestamp: '2024-01-01T00:00:00Z',
            };

            expect(preferenceStorage.validateStorageData(validData)).toBe(true);
        });

        it('should reject invalid data structures', () => {
            expect(preferenceStorage.validateStorageData(null)).toBe(false);
            expect(preferenceStorage.validateStorageData('string')).toBe(false);
            expect(preferenceStorage.validateStorageData({})).toBe(false);
            expect(
                preferenceStorage.validateStorageData({
                    version: '1.0',
                    // Missing preferences and timestamp
                })
            ).toBe(false);
        });

        it('should validate preference field types', () => {
            const invalidPrefs = {
                version: '1.0',
                preferences: {
                    bikeColor: 123, // Should be string
                    trailStyle: true, // Should be string
                },
                timestamp: '2024-01-01T00:00:00Z',
            };

            expect(preferenceStorage.validateStorageData(invalidPrefs)).toBe(false);
        });
    });

    describe('migration', () => {
        it('should migrate data without version', () => {
            const oldData = {
                bikeColor: '#FF0000',
                trailStyle: 'glowing',
            };

            const migrated = preferenceStorage.migratePreferences(oldData);

            expect(migrated.version).toBe('1.0');
            expect(migrated.preferences.bikeColor).toBe('#FF0000');
            expect(migrated.preferences.trailStyle).toBe('glowing');
            expect(migrated.timestamp).toBeDefined();
        });

        it('should handle migration errors gracefully', () => {
            const corruptedData = null;

            const result = preferenceStorage.migratePreferences(corruptedData);

            expect(result).toBeNull();
        });
    });

    describe('utility methods', () => {
        it('should provide storage statistics', () => {
            preferenceStorage.storageAvailable = true;
            mockLocalStorage.getItem.mockReturnValue(
                JSON.stringify({
                    version: '1.0',
                    preferences: { bikeColor: '#FF0000' },
                    timestamp: '2024-01-01T00:00:00Z',
                })
            );

            const stats = preferenceStorage.getStorageStats();

            expect(stats.available).toBe(true);
            expect(stats.usingFallback).toBe(false);
            expect(stats.hasData).toBe(true);
            expect(stats.dataSize).toBeGreaterThan(0);
            expect(stats.lastSaved).toBe('2024-01-01T00:00:00Z');
        });

        it('should export preferences as JSON', () => {
            const preferences = { bikeColor: '#FF0000' };
            mockLocalStorage.getItem.mockReturnValue(
                JSON.stringify({
                    version: '1.0',
                    preferences: preferences,
                    timestamp: '2024-01-01T00:00:00Z',
                })
            );

            const exported = preferenceStorage.exportPreferences();

            expect(exported).toBe(JSON.stringify(preferences, null, 2));
        });

        it('should import preferences from JSON', () => {
            const preferences = { bikeColor: '#FF0000' };
            const jsonString = JSON.stringify(preferences);

            const result = preferenceStorage.importPreferences(jsonString);

            expect(result).toBe(true);
            expect(mockLocalStorage.setItem).toHaveBeenCalled();
        });

        it('should reject invalid JSON during import', () => {
            const result = preferenceStorage.importPreferences('invalid json');

            expect(result).toBe(false);
        });
    });
});
