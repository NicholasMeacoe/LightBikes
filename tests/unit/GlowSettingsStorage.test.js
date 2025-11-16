const { GlowSettingsStorage } = require('./GlowSettingsStorage.js');

describe('GlowSettingsStorage', () => {
    let storage;
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
            })
        };

        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true
        });

        // Mock console methods
        originalConsole = {
            warn: console.warn,
            error: console.error,
            info: console.info
        };
        console.warn = jest.fn();
        console.error = jest.fn();
        console.info = jest.fn();

        mockLocalStorage.data = {};
        storage = new GlowSettingsStorage();
    });

    afterEach(() => {
        console.warn = originalConsole.warn;
        console.error = originalConsole.error;
        console.info = originalConsole.info;
    });

    describe('storage availability', () => {
        it('should detect localStorage availability', () => {
            expect(storage.isStorageAvailable).toBe(true);
        });

        it('should handle localStorage unavailability', () => {
            mockLocalStorage.setItem.mockImplementation(() => {
                throw new Error('localStorage not available');
            });

            const unavailableStorage = new GlowSettingsStorage();
            expect(unavailableStorage.isStorageAvailable).toBe(false);
        });
    });

    describe('backup and recovery', () => {
        it('should create backup when loading settings', () => {
            const testSettings = { intensity: 'HIGH', version: 1 };
            mockLocalStorage.data['lightbikes_glow_settings'] = JSON.stringify(testSettings);

            const loaded = storage.loadSettings();

            expect(loaded).toEqual(testSettings);
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                'lightbikes_glow_settings_backup',
                JSON.stringify(testSettings)
            );
        });

        it('should recover from backup when primary is corrupted', () => {
            const backupSettings = { intensity: 'LOW', version: 1 };
            
            // Corrupted primary
            mockLocalStorage.data['lightbikes_glow_settings'] = 'corrupted json';
            // Valid backup
            mockLocalStorage.data['lightbikes_glow_settings_backup'] = JSON.stringify(backupSettings);

            const loaded = storage.loadSettings();

            expect(loaded).toEqual(backupSettings);
            expect(console.warn).toHaveBeenCalledWith('Primary settings corrupted, attempting backup recovery');
        });

        it('should restore primary from backup after recovery', () => {
            const backupSettings = { intensity: 'LOW', version: 1 };
            
            mockLocalStorage.data['lightbikes_glow_settings'] = 'corrupted';
            mockLocalStorage.data['lightbikes_glow_settings_backup'] = JSON.stringify(backupSettings);

            storage.loadSettings();

            // Primary should be restored from backup
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                'lightbikes_glow_settings',
                JSON.stringify(backupSettings)
            );
        });
    });

    describe('save with verification', () => {
        it('should verify save was successful', () => {
            const settings = { intensity: 'HIGH', version: 1 };
            
            const result = storage.saveSettings(settings);

            expect(result).toBe(true);
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                'lightbikes_glow_settings',
                JSON.stringify(settings)
            );
        });

        it('should handle save verification failure', () => {
            const settings = { intensity: 'HIGH', version: 1 };
            
            // Mock getItem to return different data than what was saved
            mockLocalStorage.getItem.mockImplementation((key) => {
                if (key === 'lightbikes_glow_settings') {
                    return 'different data';
                }
                return mockLocalStorage.data[key] || null;
            });

            const result = storage.saveSettings(settings);

            expect(result).toBe(false);
            expect(console.error).toHaveBeenCalledWith('Failed to save glow settings:', expect.any(Error));
        });

        it('should create backup before saving', () => {
            const existingSettings = { intensity: 'LOW', version: 1 };
            const newSettings = { intensity: 'HIGH', version: 1 };
            
            mockLocalStorage.data['lightbikes_glow_settings'] = JSON.stringify(existingSettings);

            storage.saveSettings(newSettings);

            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                'lightbikes_glow_settings_backup',
                JSON.stringify(existingSettings)
            );
        });
    });

    describe('settings validation', () => {
        it('should validate correct settings', () => {
            const validSettings = { intensity: 'HIGH', version: 1 };
            expect(storage.validateSettings(validSettings)).toBe(true);
        });

        it('should reject invalid settings', () => {
            expect(storage.validateSettings(null)).toBe(false);
            expect(storage.validateSettings('string')).toBe(false);
            expect(storage.validateSettings({ intensity: 'INVALID' })).toBe(false);
            expect(storage.validateSettings({ version: 'not_number' })).toBe(false);
        });

        it('should accept settings with missing optional properties', () => {
            expect(storage.validateSettings({})).toBe(true);
            expect(storage.validateSettings({ intensity: 'LOW' })).toBe(true);
            expect(storage.validateSettings({ version: 1 })).toBe(true);
        });
    });

    describe('settings migration', () => {
        it('should migrate settings from version 0 to 1', () => {
            const oldSettings = { intensity: 'HIGH' }; // No version
            const migrated = storage.migrateSettings(oldSettings);

            expect(migrated.version).toBe(1);
            expect(migrated.intensity).toBe('HIGH');
            expect(console.info).toHaveBeenCalledWith('Migrated glow settings from version 0 to 1');
        });

        it('should add default intensity if missing', () => {
            const oldSettings = {}; // No intensity
            const migrated = storage.migrateSettings(oldSettings);

            expect(migrated.intensity).toBe('MEDIUM');
            expect(migrated.version).toBe(1);
        });

        it('should not migrate current version settings', () => {
            const currentSettings = { intensity: 'LOW', version: 1 };
            const migrated = storage.migrateSettings(currentSettings);

            expect(migrated).toEqual(currentSettings);
            expect(console.info).not.toHaveBeenCalled();
        });
    });

    describe('import and export', () => {
        it('should export settings as formatted JSON', () => {
            const settings = { intensity: 'HIGH', version: 1 };
            mockLocalStorage.data['lightbikes_glow_settings'] = JSON.stringify(settings);

            const exported = storage.exportSettings();

            expect(exported).toBe(JSON.stringify(settings, null, 2));
        });

        it('should return null when no settings to export', () => {
            const exported = storage.exportSettings();
            expect(exported).toBeNull();
        });

        it('should import valid settings', () => {
            const settings = { intensity: 'LOW', version: 1 };
            const serialized = JSON.stringify(settings);

            const result = storage.importSettings(serialized);

            expect(result).toBe(true);
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                'lightbikes_glow_settings',
                JSON.stringify(settings)
            );
        });

        it('should reject invalid import data', () => {
            const result = storage.importSettings('invalid json');

            expect(result).toBe(false);
            expect(console.error).toHaveBeenCalledWith('Failed to import settings:', expect.any(Error));
        });

        it('should migrate imported settings', () => {
            const oldSettings = { intensity: 'HIGH' }; // No version
            const serialized = JSON.stringify(oldSettings);

            const result = storage.importSettings(serialized);

            expect(result).toBe(true);
            
            // Should have migrated the settings
            const saved = JSON.parse(mockLocalStorage.data['lightbikes_glow_settings']);
            expect(saved.version).toBe(1);
        });
    });

    describe('storage information', () => {
        it('should provide storage usage information', () => {
            const settings = { intensity: 'HIGH', version: 1 };
            const backup = { intensity: 'LOW', version: 1 };
            
            mockLocalStorage.data['lightbikes_glow_settings'] = JSON.stringify(settings);
            mockLocalStorage.data['lightbikes_glow_settings_backup'] = JSON.stringify(backup);

            const info = storage.getStorageInfo();

            expect(info.available).toBe(true);
            expect(info.primarySize).toBeGreaterThan(0);
            expect(info.backupSize).toBeGreaterThan(0);
            expect(info.hasBackup).toBe(true);
            expect(info.totalSize).toBe(info.primarySize + info.backupSize);
        });

        it('should handle unavailable storage', () => {
            storage.isStorageAvailable = false;

            const info = storage.getStorageInfo();

            expect(info.available).toBe(false);
        });
    });

    describe('cleanup operations', () => {
        it('should clear all settings and backups', () => {
            mockLocalStorage.data['lightbikes_glow_settings'] = 'data';
            mockLocalStorage.data['lightbikes_glow_settings_backup'] = 'backup';

            storage.clearAllSettings();

            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('lightbikes_glow_settings');
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('lightbikes_glow_settings_backup');
        });

        it('should handle cleanup errors gracefully', () => {
            mockLocalStorage.removeItem.mockImplementation(() => {
                throw new Error('Remove failed');
            });

            storage.clearAllSettings();

            expect(console.error).toHaveBeenCalledWith('Failed to clear settings:', expect.any(Error));
        });
    });
});