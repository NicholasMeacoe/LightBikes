/**
 * Tests for EffectsConfigManager
 */

const { EffectsConfigManager } = require('@/systems/EffectsConfigManager.js');

describe('EffectsConfigManager', () => {
    let configManager;
    let getItemSpy;
    let setItemSpy;
    let matchMediaSpy;

    beforeEach(() => {
        getItemSpy = jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
        setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
        matchMediaSpy = jest.spyOn(window, 'matchMedia').mockReturnValue({
            matches: false,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
        });

        jest.clearAllMocks();
        configManager = new EffectsConfigManager();
    });

    afterEach(() => {
        getItemSpy.mockRestore();
        setItemSpy.mockRestore();
        matchMediaSpy.mockRestore();
    });

    it('should initialize with default settings', () => {
        const settings = configManager.getSettings();
        expect(settings.shakeEnabled).toBe(true);
        expect(settings.motionBlurEnabled).toBe(true);
    });

    it('should load settings from localStorage', () => {
        const stored = JSON.stringify({ shakeEnabled: false, version: '1.0.0' });
        getItemSpy.mockReturnValue(stored);

        const newManager = new EffectsConfigManager();
        expect(newManager.getSetting('shakeEnabled')).toBe(false);
    });

    it('should save settings to localStorage', () => {
        configManager.updateSettings({ shakeEnabled: false });
        expect(setItemSpy).toHaveBeenCalledWith(
            'lightbikes_camera_effects_settings',
            expect.stringContaining('"shakeEnabled":false')
        );
    });

    it('should check system preferences', () => {
        matchMediaSpy.mockReturnValue({ matches: true });
        expect(configManager.shouldDisableEffects()).toBe(true);
    });

    it('should return effective settings with accessibility overrides', () => {
        matchMediaSpy.mockReturnValue({ matches: true });
        const effective = configManager.getEffectiveSettings();
        expect(effective.shakeEnabled).toBe(false);
        expect(effective.motionBlurEnabled).toBe(false);
    });

    it('should reset to defaults', () => {
        configManager.updateSettings({ shakeEnabled: false });
        configManager.resetToDefaults();
        expect(configManager.getSetting('shakeEnabled')).toBe(true);
        expect(setItemSpy).toHaveBeenCalledWith(
            'lightbikes_camera_effects_settings',
            expect.stringContaining('"shakeEnabled":true')
        );
    });
});
