/**
 * Tests for MusicSettings class
 * Verifies settings persistence, validation, and localStorage integration
 */

const { MusicSettings } = require('@/audio/MusicSettings.js');

// Mock localStorage for testing
const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};

// Replace global localStorage with mock
Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage
});

describe('MusicSettings', () => {
    let musicSettings;
    
    beforeEach(() => {
        jest.clearAllMocks();
        mockLocalStorage.getItem.mockReturnValue(null);
    });
    
    describe('constructor and defaults', () => {
        it('should initialize with default settings', () => {
            musicSettings = new MusicSettings();
            
            expect(musicSettings.getMusicVolume()).toBe(0.7);
            expect(musicSettings.getSelectedTrack()).toBe('ambient-space');
            expect(musicSettings.getFadeInDuration()).toBe(0.5);
            expect(musicSettings.getFadeOutDuration()).toBe(0.5);
            expect(musicSettings.getDuckingLevel()).toBe(0.3);
            expect(musicSettings.getDuckingDuration()).toBe(0.2);
        });
        
        it('should load settings from localStorage if available', () => {
            const savedSettings = {
                musicVolume: 0.8,
                selectedTrack: 'cyber-pulse',
                fadeInDuration: 1.0
            };
            
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedSettings));
            
            musicSettings = new MusicSettings();
            
            expect(musicSettings.getMusicVolume()).toBe(0.8);
            expect(musicSettings.getSelectedTrack()).toBe('cyber-pulse');
            expect(musicSettings.getFadeInDuration()).toBe(1.0);
            // Should still use defaults for missing settings
            expect(musicSettings.getFadeOutDuration()).toBe(0.5);
        });
        
        it('should handle corrupted localStorage data', () => {
            mockLocalStorage.getItem.mockReturnValue('invalid json');
            
            musicSettings = new MusicSettings();
            
            // Should fall back to defaults
            expect(musicSettings.getMusicVolume()).toBe(0.7);
            expect(musicSettings.getSelectedTrack()).toBe('ambient-space');
        });
    });
    
    describe('volume settings', () => {
        beforeEach(() => {
            musicSettings = new MusicSettings();
        });
        
        it('should set valid volume levels', () => {
            expect(musicSettings.setMusicVolume(0.5)).toBe(true);
            expect(musicSettings.getMusicVolume()).toBe(0.5);
            
            expect(musicSettings.setMusicVolume(0.0)).toBe(true);
            expect(musicSettings.getMusicVolume()).toBe(0.0);
            
            expect(musicSettings.setMusicVolume(1.0)).toBe(true);
            expect(musicSettings.getMusicVolume()).toBe(1.0);
        });
        
        it('should reject invalid volume levels', () => {
            expect(musicSettings.setMusicVolume(-0.1)).toBe(false);
            expect(musicSettings.setMusicVolume(1.1)).toBe(false);
            expect(musicSettings.setMusicVolume('0.5')).toBe(false);
            expect(musicSettings.setMusicVolume(null)).toBe(false);
            
            // Should maintain previous valid value
            expect(musicSettings.getMusicVolume()).toBe(0.7);
        });
        
        it('should save volume changes to localStorage', () => {
            musicSettings.setMusicVolume(0.9);
            
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                'lightbikes_music_settings',
                expect.stringContaining('"musicVolume":0.9')
            );
        });
    });
    
    describe('track selection', () => {
        beforeEach(() => {
            musicSettings = new MusicSettings();
        });
        
        it('should set valid track IDs', () => {
            expect(musicSettings.setSelectedTrack('cyber-pulse')).toBe(true);
            expect(musicSettings.getSelectedTrack()).toBe('cyber-pulse');
            
            expect(musicSettings.setSelectedTrack('neon-rush')).toBe(true);
            expect(musicSettings.getSelectedTrack()).toBe('neon-rush');
            
            expect(musicSettings.setSelectedTrack('none')).toBe(true);
            expect(musicSettings.getSelectedTrack()).toBe('none');
        });
        
        it('should reject invalid track IDs', () => {
            expect(musicSettings.setSelectedTrack('invalid-track')).toBe(false);
            expect(musicSettings.setSelectedTrack('')).toBe(false);
            expect(musicSettings.setSelectedTrack(null)).toBe(false);
            expect(musicSettings.setSelectedTrack(123)).toBe(false);
            
            // Should maintain previous valid value
            expect(musicSettings.getSelectedTrack()).toBe('ambient-space');
        });
    });
    
    describe('fade duration settings', () => {
        beforeEach(() => {
            musicSettings = new MusicSettings();
        });
        
        it('should set valid fade durations', () => {
            expect(musicSettings.setFadeInDuration(1.0)).toBe(true);
            expect(musicSettings.getFadeInDuration()).toBe(1.0);
            
            expect(musicSettings.setFadeOutDuration(2.0)).toBe(true);
            expect(musicSettings.getFadeOutDuration()).toBe(2.0);
        });
        
        it('should reject invalid fade durations', () => {
            expect(musicSettings.setFadeInDuration(0.05)).toBe(false); // Too short
            expect(musicSettings.setFadeInDuration(3.0)).toBe(false);  // Too long
            expect(musicSettings.setFadeOutDuration(-1)).toBe(false);  // Negative
            
            // Should maintain defaults
            expect(musicSettings.getFadeInDuration()).toBe(0.5);
            expect(musicSettings.getFadeOutDuration()).toBe(0.5);
        });
    });
    
    describe('ducking settings', () => {
        beforeEach(() => {
            musicSettings = new MusicSettings();
        });
        
        it('should set valid ducking parameters', () => {
            expect(musicSettings.setDuckingLevel(0.5)).toBe(true);
            expect(musicSettings.getDuckingLevel()).toBe(0.5);
            
            expect(musicSettings.setDuckingDuration(0.3)).toBe(true);
            expect(musicSettings.getDuckingDuration()).toBe(0.3);
        });
        
        it('should reject invalid ducking parameters', () => {
            expect(musicSettings.setDuckingLevel(-0.1)).toBe(false);
            expect(musicSettings.setDuckingLevel(1.1)).toBe(false);
            expect(musicSettings.setDuckingDuration(0.05)).toBe(false);
            expect(musicSettings.setDuckingDuration(2.0)).toBe(false);
        });
    });
    
    describe('bulk settings operations', () => {
        beforeEach(() => {
            musicSettings = new MusicSettings();
        });
        
        it('should update multiple settings at once', () => {
            const newSettings = {
                musicVolume: 0.8,
                selectedTrack: 'neon-rush',
                fadeInDuration: 1.0
            };
            
            expect(musicSettings.updateSettings(newSettings)).toBe(true);
            
            expect(musicSettings.getMusicVolume()).toBe(0.8);
            expect(musicSettings.getSelectedTrack()).toBe('neon-rush');
            expect(musicSettings.getFadeInDuration()).toBe(1.0);
        });
        
        it('should reject bulk update with invalid settings', () => {
            const invalidSettings = {
                musicVolume: 0.8,
                selectedTrack: 'invalid-track', // Invalid
                fadeInDuration: 1.0
            };
            
            expect(musicSettings.updateSettings(invalidSettings)).toBe(false);
            
            // Should not change any settings
            expect(musicSettings.getMusicVolume()).toBe(0.7);
            expect(musicSettings.getSelectedTrack()).toBe('ambient-space');
        });
        
        it('should get all current settings', () => {
            musicSettings.setMusicVolume(0.9);
            musicSettings.setSelectedTrack('cyber-pulse');
            
            const allSettings = musicSettings.getAllSettings();
            
            expect(allSettings.musicVolume).toBe(0.9);
            expect(allSettings.selectedTrack).toBe('cyber-pulse');
            expect(allSettings.fadeInDuration).toBe(0.5);
        });
    });
    
    describe('persistence operations', () => {
        beforeEach(() => {
            musicSettings = new MusicSettings();
        });
        
        it('should save settings to localStorage', () => {
            musicSettings.setMusicVolume(0.8);
            
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                'lightbikes_music_settings',
                expect.any(String)
            );
        });
        
        it('should handle localStorage save errors', () => {
            mockLocalStorage.setItem.mockImplementation(() => {
                throw new Error('Storage quota exceeded');
            });
            
            const result = musicSettings.save();
            expect(result).toBe(false);
        });
        
        it('should reset to defaults', () => {
            // Clear the mock error for this test
            mockLocalStorage.setItem.mockClear();
            mockLocalStorage.setItem.mockImplementation(() => {}); // Don't throw
            
            musicSettings.setMusicVolume(0.9);
            musicSettings.setSelectedTrack('neon-rush');
            
            expect(musicSettings.reset()).toBe(true);
            
            expect(musicSettings.getMusicVolume()).toBe(0.7);
            expect(musicSettings.getSelectedTrack()).toBe('ambient-space');
        });
    });
    
    describe('validation', () => {
        beforeEach(() => {
            musicSettings = new MusicSettings();
        });
        
        it('should validate complete settings objects', () => {
            const validSettings = {
                musicVolume: 0.8,
                selectedTrack: 'cyber-pulse',
                fadeInDuration: 1.0,
                fadeOutDuration: 0.8,
                duckingLevel: 0.4,
                duckingDuration: 0.3
            };
            
            expect(musicSettings.validateSettings(validSettings)).toBe(true);
        });
        
        it('should reject invalid settings objects', () => {
            const invalidSettings = {
                musicVolume: 1.5, // Too high
                selectedTrack: 'cyber-pulse',
                fadeInDuration: 1.0
            };
            
            expect(musicSettings.validateSettings(invalidSettings)).toBe(false);
        });
        
        it('should handle null or non-object input', () => {
            expect(musicSettings.validateSettings(null)).toBe(false);
            expect(musicSettings.validateSettings('string')).toBe(false);
            expect(musicSettings.validateSettings(123)).toBe(false);
        });
        
        it('should provide schema access', () => {
            const schema = musicSettings.getSchema();
            
            expect(schema.musicVolume).toBeDefined();
            expect(schema.musicVolume.type).toBe('number');
            expect(schema.musicVolume.min).toBe(0.0);
            expect(schema.musicVolume.max).toBe(1.0);
        });
    });
    
    describe('settings migration', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });
        
        it('should migrate legacy format settings', () => {
            const legacySettings = {
                musicVolume: 0.8,
                selectedTrack: 'cyber-pulse',
                fadeInDuration: 1.0
            };
            
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(legacySettings));
            
            musicSettings = new MusicSettings();
            
            expect(musicSettings.getMusicVolume()).toBe(0.8);
            expect(musicSettings.getSelectedTrack()).toBe('cyber-pulse');
            expect(musicSettings.getFadeInDuration()).toBe(1.0);
            
            // Should save in new format after migration
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                'lightbikes_music_settings',
                expect.stringContaining('"version":1')
            );
        });
        
        it('should handle versioned format settings', () => {
            const versionedSettings = {
                version: 1,
                settings: {
                    musicVolume: 0.9,
                    selectedTrack: 'neon-rush'
                }
            };
            
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(versionedSettings));
            
            musicSettings = new MusicSettings();
            
            expect(musicSettings.getMusicVolume()).toBe(0.9);
            expect(musicSettings.getSelectedTrack()).toBe('neon-rush');
        });
        
        it('should provide settings version information', () => {
            musicSettings = new MusicSettings();
            
            expect(musicSettings.getSettingsVersion()).toBe(1);
        });
    });
    
    describe('storage utilities', () => {
        beforeEach(() => {
            musicSettings = new MusicSettings();
        });
        
        it('should check storage availability', () => {
            expect(musicSettings.isStorageAvailable()).toBe(true);
        });
        
        it('should handle storage unavailability', () => {
            mockLocalStorage.setItem.mockImplementation(() => {
                throw new Error('Storage not available');
            });
            
            expect(musicSettings.isStorageAvailable()).toBe(false);
        });
        
        it('should clear stored settings', () => {
            expect(musicSettings.clearStorage()).toBe(true);
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('lightbikes_music_settings');
        });
        
        it('should handle clear storage errors', () => {
            mockLocalStorage.removeItem.mockImplementation(() => {
                throw new Error('Clear failed');
            });
            
            expect(musicSettings.clearStorage()).toBe(false);
        });
    });
    
    describe('edge cases', () => {
        it('should handle localStorage being unavailable', () => {
            // Simulate localStorage being unavailable
            const originalLocalStorage = window.localStorage;
            Object.defineProperty(window, 'localStorage', {
                value: null,
                configurable: true
            });
            
            // Should not throw and should use defaults
            expect(() => {
                musicSettings = new MusicSettings();
            }).not.toThrow();
            
            expect(musicSettings.getMusicVolume()).toBe(0.7);
            
            // Restore localStorage
            Object.defineProperty(window, 'localStorage', {
                value: originalLocalStorage,
                configurable: true
            });
        });
        
        it('should ignore unknown settings in loaded data', () => {
            // Reset mocks first
            jest.clearAllMocks();
            
            const settingsWithUnknown = {
                musicVolume: 0.8,
                unknownSetting: 'value',
                selectedTrack: 'cyber-pulse'
            };
            
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(settingsWithUnknown));
            
            musicSettings = new MusicSettings();
            
            expect(musicSettings.getMusicVolume()).toBe(0.8);
            expect(musicSettings.getSelectedTrack()).toBe('cyber-pulse');
            // Unknown setting should be ignored
            expect(musicSettings.getAllSettings().unknownSetting).toBeUndefined();
        });
    });
});