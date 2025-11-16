/**
 * Integration test for Camera Effects UI
 * Tests the complete integration between UI, settings manager, and camera effects
 */

const { CameraEffectsUI } = require('./CameraEffectsUI.js');
const { EffectsConfigManager } = require('./EffectsConfigManager.js');

// Mock basic DOM environment
global.document = {
    getElementById: jest.fn(() => null),
    querySelectorAll: jest.fn(() => []),
    addEventListener: jest.fn()
};

global.window = {
    matchMedia: jest.fn(() => ({
        matches: false,
        addListener: jest.fn()
    }))
};

global.localStorage = {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};

describe('Camera Effects UI Integration', () => {
    let cameraEffectsUI;
    let configManager;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Create UI instance (will create its own config manager)
        cameraEffectsUI = new CameraEffectsUI();
        configManager = cameraEffectsUI.getConfigManager();
    });

    afterEach(() => {
        if (cameraEffectsUI) {
            cameraEffectsUI.destroy();
        }
    });

    describe('Settings Integration', () => {
        it('should have a valid configuration manager', () => {
            expect(configManager).toBeDefined();
            expect(configManager).toBeInstanceOf(EffectsConfigManager);
        });

        it('should load default settings correctly', () => {
            const settings = configManager.getSettings();
            
            expect(settings).toHaveProperty('shakeEnabled');
            expect(settings).toHaveProperty('shakeIntensity');
            expect(settings).toHaveProperty('motionBlurEnabled');
            expect(settings).toHaveProperty('motionBlurQuality');
            expect(settings).toHaveProperty('accessibilityMode');
            expect(settings).toHaveProperty('respectSystemPreferences');
        });

        it('should update settings through UI methods', () => {
            // Test shake intensity update
            cameraEffectsUI.updateShakeIntensity(1.5);
            let settings = configManager.getSettings();
            expect(settings.shakeIntensity).toBe(1.5);
            expect(settings.shakeEnabled).toBe(true);

            // Test shake disable
            cameraEffectsUI.updateShakeIntensity(0);
            settings = configManager.getSettings();
            expect(settings.shakeIntensity).toBe(0);
            expect(settings.shakeEnabled).toBe(false);

            // Test motion blur quality
            cameraEffectsUI.updateMotionBlurQuality('high');
            settings = configManager.getSettings();
            expect(settings.motionBlurQuality).toBe('high');
        });

        it('should handle accessibility mode correctly', () => {
            // Enable accessibility mode
            cameraEffectsUI.toggleAccessibilityMode();
            let settings = configManager.getSettings();
            expect(settings.accessibilityMode).toBe(true);

            // Disable accessibility mode
            cameraEffectsUI.toggleAccessibilityMode();
            settings = configManager.getSettings();
            expect(settings.accessibilityMode).toBe(false);
        });

        it('should reset settings to defaults', () => {
            // Change some settings
            cameraEffectsUI.updateShakeIntensity(2.0);
            cameraEffectsUI.updateMotionBlurQuality('low');
            cameraEffectsUI.toggleAccessibilityMode();

            // Reset to defaults
            cameraEffectsUI.resetSettings();
            
            const settings = configManager.getSettings();
            expect(settings.shakeIntensity).toBe(1.0); // Default
            expect(settings.motionBlurQuality).toBe('medium'); // Default
            expect(settings.accessibilityMode).toBe(false); // Default
        });
    });

    describe('Settings Validation', () => {
        it('should validate shake intensity range', () => {
            // Valid intensities
            expect(() => cameraEffectsUI.updateShakeIntensity(0)).not.toThrow();
            expect(() => cameraEffectsUI.updateShakeIntensity(1.0)).not.toThrow();
            expect(() => cameraEffectsUI.updateShakeIntensity(2.0)).not.toThrow();

            // Test that settings are actually applied
            cameraEffectsUI.updateShakeIntensity(1.5);
            expect(configManager.getSettings().shakeIntensity).toBe(1.5);
        });

        it('should validate motion blur quality options', () => {
            const validQualities = ['low', 'medium', 'high'];
            
            validQualities.forEach(quality => {
                expect(() => cameraEffectsUI.updateMotionBlurQuality(quality)).not.toThrow();
                expect(configManager.getSettings().motionBlurQuality).toBe(quality);
            });
        });
    });

    describe('Effective Settings', () => {
        it('should return effective settings considering accessibility', () => {
            // Normal settings
            let effective = configManager.getEffectiveSettings();
            expect(effective.shakeEnabled).toBe(true);
            expect(effective.motionBlurEnabled).toBe(true);

            // Enable accessibility mode
            cameraEffectsUI.toggleAccessibilityMode();
            effective = configManager.getEffectiveSettings();
            expect(effective.shakeEnabled).toBe(false);
            expect(effective.motionBlurEnabled).toBe(false);
        });
    });

    describe('Settings Persistence', () => {
        it('should have persistence methods available', () => {
            expect(typeof configManager.exportSettings).toBe('function');
            expect(typeof configManager.importSettings).toBe('function');
            expect(typeof configManager.checkAndRepairSettings).toBe('function');
        });

        it('should export and import settings', () => {
            // Change some settings
            cameraEffectsUI.updateShakeIntensity(1.8);
            cameraEffectsUI.updateMotionBlurQuality('high');
            
            // Export settings
            const exported = configManager.exportSettings();
            expect(exported).toBeTruthy();
            expect(typeof exported).toBe('string');

            // Reset settings
            cameraEffectsUI.resetSettings();
            expect(configManager.getSettings().shakeIntensity).toBe(1.0);

            // Import settings back
            const importResult = configManager.importSettings(exported);
            expect(importResult).toBe(true);
            
            const settings = configManager.getSettings();
            expect(settings.shakeIntensity).toBe(1.8);
            expect(settings.motionBlurQuality).toBe('high');
        });

        it('should handle invalid import data gracefully', () => {
            const result = configManager.importSettings('invalid json');
            expect(result).toBe(false);
        });
    });

    describe('Error Handling', () => {
        it('should handle missing DOM elements gracefully', () => {
            // The UI should initialize even when DOM elements are missing
            expect(cameraEffectsUI).toBeDefined();
            expect(cameraEffectsUI.configManager).toBeDefined();
        });

        it('should handle settings integrity check', () => {
            expect(() => configManager.checkAndRepairSettings()).not.toThrow();
        });
    });
});