const { EffectsConfigManager } = require('@/systems/EffectsConfigManager.js');

// Mock localStorage
const localStorageMock = {
    store: {},
    getItem: jest.fn((key) => localStorageMock.store[key] || null),
    setItem: jest.fn((key, value) => {
        localStorageMock.store[key] = value;
    }),
    clear: jest.fn(() => {
        localStorageMock.store = {};
    })
};

// Mock matchMedia
const matchMediaMock = jest.fn((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
}));

describe('EffectsConfigManager', () => {
    let configManager;

    beforeEach(() => {
        // Reset mocks
        localStorageMock.clear();
        localStorageMock.getItem.mockClear();
        localStorageMock.setItem.mockClear();
        matchMediaMock.mockClear();
        
        // Setup global mocks BEFORE creating the manager
        global.localStorage = localStorageMock;
        global.window = { matchMedia: matchMediaMock };
        
        // Reset matchMedia to return false by default
        matchMediaMock.mockReturnValue({ matches: false });
        
        // Reset localStorage to return null by default
        localStorageMock.getItem.mockReturnValue(null);
        
        configManager = new EffectsConfigManager();
    });

    describe('constructor', () => {
        it('should initialize with default settings', () => {
            const settings = configManager.getSettings();
            
            expect(settings.shakeEnabled).toBe(true);
            expect(settings.shakeIntensity).toBe(1.0);
            expect(settings.motionBlurEnabled).toBe(true);
            expect(settings.motionBlurQuality).toBe('medium');
            expect(settings.accessibilityMode).toBe(false);
            expect(settings.respectSystemPreferences).toBe(true);
        });

        it('should load settings from localStorage if available', () => {
            const storedSettings = {
                version: '1.0.0',
                shakeEnabled: false,
                shakeIntensity: 0.5,
                motionBlurQuality: 'high'
            };
            
            // Set up localStorage mock to return the stored settings
            localStorageMock.getItem.mockImplementation((key) => {
                if (key === 'lightbikes_camera_effects_settings') {
                    return JSON.stringify(storedSettings);
                }
                return null;
            });
            
            const newConfigManager = new EffectsConfigManager();
            const settings = newConfigManager.getSettings();
            
            expect(settings.shakeEnabled).toBe(false);
            expect(settings.shakeIntensity).toBe(0.5);
            expect(settings.motionBlurQuality).toBe('high');
            // Should preserve defaults for unspecified settings
            expect(settings.motionBlurEnabled).toBe(true);
        });

        it('should use defaults if localStorage contains invalid data', () => {
            localStorageMock.store['lightbikes_camera_effects_settings'] = 'invalid json';
            
            const newConfigManager = new EffectsConfigManager();
            const settings = newConfigManager.getSettings();
            
            expect(settings.shakeEnabled).toBe(true);
            expect(settings.shakeIntensity).toBe(1.0);
        });
    });

    describe('getSettings', () => {
        it('should return a copy of current settings', () => {
            const settings1 = configManager.getSettings();
            const settings2 = configManager.getSettings();
            
            expect(settings1).toEqual(settings2);
            expect(settings1).not.toBe(settings2); // Different objects
        });
    });

    describe('updateSettings', () => {
        it('should update valid settings', () => {
            const newSettings = {
                shakeEnabled: false,
                shakeIntensity: 0.5
            };
            
            const result = configManager.updateSettings(newSettings);
            
            expect(result).toBe(true);
            expect(configManager.getSetting('shakeEnabled')).toBe(false);
            expect(configManager.getSetting('shakeIntensity')).toBe(0.5);
            expect(configManager.getSetting('motionBlurEnabled')).toBe(true); // Unchanged
        });

        it('should save settings to localStorage', () => {
            const result = configManager.updateSettings({ shakeEnabled: false });
            
            expect(result).toBe(true);
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'lightbikes_camera_effects_settings',
                expect.stringContaining('"shakeEnabled":false')
            );
        });

        it('should reject invalid settings', () => {
            const originalIntensity = configManager.getSetting('shakeIntensity');
            const result = configManager.updateSettings({ shakeIntensity: 5.0 }); // Out of range
            
            expect(result).toBe(false);
            expect(configManager.getSetting('shakeIntensity')).toBe(originalIntensity); // Unchanged
        });

        it('should notify change listeners', () => {
            const listener = jest.fn();
            configManager.addChangeListener(listener);
            
            const previousSettings = configManager.getSettings();
            configManager.updateSettings({ shakeEnabled: false });
            
            expect(listener).toHaveBeenCalledWith(
                expect.objectContaining({ shakeEnabled: false }),
                previousSettings
            );
        });
    });

    describe('validateSettings', () => {
        it('should validate boolean settings', () => {
            const result = configManager.validateSettings({
                shakeEnabled: 'true', // String should be converted
                motionBlurEnabled: 0    // Falsy should be converted
            });
            
            expect(result.shakeEnabled).toBe(true);
            expect(result.motionBlurEnabled).toBe(false);
        });

        it('should validate shake intensity range', () => {
            expect(configManager.validateSettings({ shakeIntensity: 0.5 })).toEqual({ shakeIntensity: 0.5 });
            expect(configManager.validateSettings({ shakeIntensity: 0.0 })).toEqual({ shakeIntensity: 0.0 });
            expect(configManager.validateSettings({ shakeIntensity: 2.0 })).toEqual({ shakeIntensity: 2.0 });
            expect(configManager.validateSettings({ shakeIntensity: -0.1 })).toEqual({});
            expect(configManager.validateSettings({ shakeIntensity: 2.1 })).toEqual({});
        });

        it('should validate motion blur quality', () => {
            expect(configManager.validateSettings({ motionBlurQuality: 'low' })).toEqual({ motionBlurQuality: 'low' });
            expect(configManager.validateSettings({ motionBlurQuality: 'medium' })).toEqual({ motionBlurQuality: 'medium' });
            expect(configManager.validateSettings({ motionBlurQuality: 'high' })).toEqual({ motionBlurQuality: 'high' });
            expect(configManager.validateSettings({ motionBlurQuality: 'invalid' })).toEqual({});
        });

        it('should return null for invalid input', () => {
            expect(configManager.validateSettings(null)).toBeNull();
            expect(configManager.validateSettings('string')).toBeNull();
            expect(configManager.validateSettings(123)).toBeNull();
        });
    });

    describe('change listeners', () => {
        it('should add and remove change listeners', () => {
            const listener1 = jest.fn();
            const listener2 = jest.fn();
            
            configManager.addChangeListener(listener1);
            configManager.addChangeListener(listener2);
            
            configManager.updateSettings({ shakeEnabled: false });
            
            expect(listener1).toHaveBeenCalled();
            expect(listener2).toHaveBeenCalled();
            
            configManager.removeChangeListener(listener1);
            listener1.mockClear();
            listener2.mockClear();
            
            configManager.updateSettings({ shakeIntensity: 0.5 });
            
            expect(listener1).not.toHaveBeenCalled();
            expect(listener2).toHaveBeenCalled();
        });

        it('should handle listener errors gracefully', () => {
            const errorListener = jest.fn(() => { throw new Error('Test error'); });
            const normalListener = jest.fn();
            
            configManager.addChangeListener(errorListener);
            configManager.addChangeListener(normalListener);
            
            // Should not throw
            expect(() => {
                configManager.updateSettings({ shakeEnabled: false });
            }).not.toThrow();
            
            expect(normalListener).toHaveBeenCalled();
        });
    });

    describe('shouldDisableEffects', () => {
        it('should return true when accessibility mode is enabled', () => {
            configManager.updateSettings({ accessibilityMode: true });
            
            expect(configManager.shouldDisableEffects()).toBe(true);
        });

        it('should check system preferences when respectSystemPreferences is true', () => {
            matchMediaMock.mockReturnValue({ matches: true });
            
            expect(configManager.shouldDisableEffects()).toBe(true);
            expect(matchMediaMock).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
        });

        it('should ignore system preferences when respectSystemPreferences is false', () => {
            matchMediaMock.mockReturnValue({ matches: true });
            const result = configManager.updateSettings({ respectSystemPreferences: false });
            
            expect(result).toBe(true);
            expect(configManager.shouldDisableEffects()).toBe(false);
        });

        it('should handle matchMedia errors gracefully', () => {
            global.window.matchMedia = () => { throw new Error('Not supported'); };
            
            // Create new config manager with broken matchMedia
            const newConfigManager = new EffectsConfigManager();
            
            expect(() => newConfigManager.shouldDisableEffects()).not.toThrow();
            expect(newConfigManager.shouldDisableEffects()).toBe(false);
        });
    });

    describe('getEffectiveSettings', () => {
        it('should return normal settings when effects are enabled', () => {
            // Ensure effects are not disabled
            matchMediaMock.mockReturnValue({ matches: false });
            const result = configManager.updateSettings({ accessibilityMode: false });
            
            expect(result).toBe(true);
            const effective = configManager.getEffectiveSettings();
            
            expect(effective.shakeEnabled).toBe(true);
            expect(effective.motionBlurEnabled).toBe(true);
        });

        it('should disable effects when accessibility mode is on', () => {
            configManager.updateSettings({ accessibilityMode: true });
            
            const effective = configManager.getEffectiveSettings();
            
            expect(effective.shakeEnabled).toBe(false);
            expect(effective.motionBlurEnabled).toBe(false);
            expect(effective.accessibilityMode).toBe(true); // Preserve original setting
        });

        it('should disable effects when system prefers reduced motion', () => {
            matchMediaMock.mockReturnValue({ matches: true });
            
            const effective = configManager.getEffectiveSettings();
            
            expect(effective.shakeEnabled).toBe(false);
            expect(effective.motionBlurEnabled).toBe(false);
        });
    });

    describe('resetToDefaults', () => {
        it('should reset all settings to defaults', () => {
            configManager.updateSettings({
                shakeEnabled: false,
                shakeIntensity: 0.5,
                motionBlurQuality: 'low'
            });
            
            configManager.resetToDefaults();
            
            const settings = configManager.getSettings();
            expect(settings.shakeEnabled).toBe(true);
            expect(settings.shakeIntensity).toBe(1.0);
            expect(settings.motionBlurQuality).toBe('medium');
        });

        it('should save defaults to localStorage', () => {
            // First change some settings
            configManager.updateSettings({ shakeEnabled: false });
            localStorageMock.setItem.mockClear(); // Clear previous calls
            
            configManager.resetToDefaults();
            
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'lightbikes_camera_effects_settings',
                expect.stringContaining('"shakeEnabled":true')
            );
        });

        it('should notify listeners of reset', () => {
            const listener = jest.fn();
            configManager.addChangeListener(listener);
            
            configManager.resetToDefaults();
            
            expect(listener).toHaveBeenCalled();
        });
    });
});