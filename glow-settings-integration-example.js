/**
 * Example integration of glow settings components
 * Shows how GlowSettings, GlowSettingsUI, and GlowEffectManager work together
 */

// This would typically be imported in script.js or the main game orchestrator
const { GlowSettings } = require('./GlowSettings.js');
const { GlowSettingsUI } = require('./GlowSettingsUI.js');
const { GlowSettingsStorage } = require('./GlowSettingsStorage.js');

/**
 * Example integration function showing how to set up glow settings
 */
function setupGlowSettings(glowEffectManager) {
    // 1. Create settings instance (automatically loads from localStorage)
    const glowSettings = new GlowSettings();
    
    // 2. Create UI controller
    const glowSettingsUI = new GlowSettingsUI(glowSettings, glowEffectManager);
    
    // 3. Apply current settings to the glow effect manager
    glowEffectManager.setIntensity(glowSettings.getIntensity());
    
    // 4. Set up advanced storage utilities (optional)
    const storage = new GlowSettingsStorage();
    
    console.log('Glow settings initialized:');
    console.log('- Current intensity:', glowSettings.getIntensityLabel());
    console.log('- Effects enabled:', glowSettings.isEnabled());
    console.log('- Storage info:', storage.getStorageInfo());
    
    return {
        settings: glowSettings,
        ui: glowSettingsUI,
        storage: storage
    };
}

/**
 * Example of programmatically changing settings
 */
function demonstrateSettingsAPI(glowComponents) {
    const { settings, ui } = glowComponents;
    
    console.log('\nDemonstrating settings API:');
    
    // Get current configuration
    const config = settings.getIntensityConfig();
    console.log('Current config:', config);
    
    // Change intensity
    settings.setIntensity('HIGH');
    console.log('Changed to HIGH intensity');
    
    // Get intensity values for use in rendering
    console.log('Emissive intensity:', settings.getEmissiveIntensity());
    console.log('Bloom strength:', settings.getBloomStrength());
    
    // Reset to defaults
    settings.resetToDefaults();
    console.log('Reset to defaults:', settings.getIntensityLabel());
}

/**
 * Example of handling settings persistence
 */
function demonstratePersistence(storage) {
    console.log('\nDemonstrating persistence:');
    
    // Export settings for backup
    const exported = storage.exportSettings();
    if (exported) {
        console.log('Exported settings:', exported);
    }
    
    // Get storage usage information
    const info = storage.getStorageInfo();
    console.log('Storage usage:', info);
    
    // Example of importing settings (would typically come from user file upload)
    const exampleSettings = JSON.stringify({
        intensity: 'LOW',
        version: 1
    });
    
    if (storage.importSettings(exampleSettings)) {
        console.log('Successfully imported settings');
    }
}

/**
 * Example error handling
 */
function demonstrateErrorHandling(settings) {
    console.log('\nDemonstrating error handling:');
    
    // Try to set invalid intensity
    const result = settings.setIntensity('INVALID_LEVEL');
    console.log('Setting invalid intensity result:', result);
    
    // Settings should remain unchanged
    console.log('Current intensity after invalid set:', settings.getIntensity());
    
    // Validate intensity levels
    console.log('Is HIGH valid?', settings.isValidIntensity('HIGH'));
    console.log('Is INVALID valid?', settings.isValidIntensity('INVALID'));
}

// Example usage (would be called from main game initialization)
/*
// In script.js or main game file:
const glowComponents = setupGlowSettings(glowEffectManager);

// Demonstrate API usage
demonstrateSettingsAPI(glowComponents);
demonstratePersistence(glowComponents.storage);
demonstrateErrorHandling(glowComponents.settings);

// The UI will automatically handle user interactions through the settings panel
*/

module.exports = {
    setupGlowSettings,
    demonstrateSettingsAPI,
    demonstratePersistence,
    demonstrateErrorHandling
};