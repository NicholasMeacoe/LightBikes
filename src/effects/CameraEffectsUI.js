/**
 * CameraEffectsUI - User interface controller for camera effects settings
 * Manages the settings panel, user interactions, and integration with EffectsConfigManager
 */

const { EffectsConfigManager } = require('../systems/EffectsConfigManager.js');

class CameraEffectsUI {
    constructor() {
        this.configManager = new EffectsConfigManager();
        this.isVisible = false;
        this.elements = {};
        
        this.initializeElements();
        this.bindEvents();
        this.loadCurrentSettings();
        
        // Listen for settings changes from other sources
        this.configManager.addChangeListener((newSettings) => {
            this.updateUIFromSettings(newSettings);
        });
    }

    /**
     * Initialize DOM element references
     */
    initializeElements() {
        this.elements = {
            button: document.getElementById('cameraEffectsButton'),
            panel: document.getElementById('cameraEffectsPanel'),
            accessibilityWarning: document.getElementById('accessibilityWarning'),
            
            // Shake intensity buttons
            shakeIntensityButtons: document.querySelectorAll('.shake-intensity-btn'),
            
            // Motion blur controls
            motionBlurToggle: document.getElementById('motionBlurToggle'),
            motionBlurQualityButtons: document.querySelectorAll('#cameraEffectsPanel .quality-btn'),
            
            // Accessibility controls
            accessibilityModeToggle: document.getElementById('accessibilityModeToggle'),
            systemPreferencesToggle: document.getElementById('systemPreferencesToggle'),
            
            // Action buttons
            resetButton: document.getElementById('resetCameraEffectsSettings'),
            closeButton: document.getElementById('closeCameraEffectsSettings')
        };
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Toggle panel visibility
        if (this.elements.button) {
            this.elements.button.addEventListener('click', () => this.togglePanel());
        }

        // Shake intensity buttons
        this.elements.shakeIntensityButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const intensity = parseFloat(e.currentTarget.dataset.intensity);
                this.updateShakeIntensity(intensity);
            });
        });

        // Motion blur toggle
        if (this.elements.motionBlurToggle) {
            this.elements.motionBlurToggle.addEventListener('click', () => {
                this.toggleMotionBlur();
            });
        }

        // Motion blur quality buttons
        this.elements.motionBlurQualityButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const quality = e.currentTarget.dataset.quality;
                this.updateMotionBlurQuality(quality);
            });
        });

        // Accessibility mode toggle
        if (this.elements.accessibilityModeToggle) {
            this.elements.accessibilityModeToggle.addEventListener('click', () => {
                this.toggleAccessibilityMode();
            });
        }

        // System preferences toggle
        if (this.elements.systemPreferencesToggle) {
            this.elements.systemPreferencesToggle.addEventListener('click', () => {
                this.toggleSystemPreferences();
            });
        }

        // Action buttons
        if (this.elements.resetButton) {
            this.elements.resetButton.addEventListener('click', () => this.resetSettings());
        }

        if (this.elements.closeButton) {
            this.elements.closeButton.addEventListener('click', () => this.hidePanel());
        }

        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isVisible && 
                !this.elements.panel.contains(e.target) && 
                !this.elements.button.contains(e.target)) {
                this.hidePanel();
            }
        });

        // Listen for system preference changes
        if (typeof window !== 'undefined' && window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            mediaQuery.addListener(() => this.updateAccessibilityWarning());
        }
    }

    /**
     * Toggle panel visibility
     */
    togglePanel() {
        if (this.isVisible) {
            this.hidePanel();
        } else {
            this.showPanel();
        }
    }

    /**
     * Show the settings panel
     */
    showPanel() {
        if (this.elements.panel) {
            this.elements.panel.style.display = 'block';
            this.elements.button.classList.add('active');
            this.isVisible = true;
            this.updateAccessibilityWarning();
        }
    }

    /**
     * Hide the settings panel
     */
    hidePanel() {
        if (this.elements.panel) {
            this.elements.panel.style.display = 'none';
            this.elements.button.classList.remove('active');
            this.isVisible = false;
        }
    }

    /**
     * Load current settings and update UI
     */
    loadCurrentSettings() {
        const settings = this.configManager.getSettings();
        this.updateUIFromSettings(settings);
    }

    /**
     * Update UI elements based on settings
     * @param {Object} settings - Current settings
     */
    updateUIFromSettings(settings) {
        // Update shake intensity buttons
        this.elements.shakeIntensityButtons.forEach(button => {
            button.classList.remove('active');
            if (parseFloat(button.dataset.intensity) === settings.shakeIntensity) {
                button.classList.add('active');
            }
        });

        // Update motion blur toggle
        this.updateToggleState(this.elements.motionBlurToggle, settings.motionBlurEnabled);

        // Update motion blur quality buttons
        this.elements.motionBlurQualityButtons.forEach(button => {
            button.classList.remove('active');
            if (button.dataset.quality === settings.motionBlurQuality) {
                button.classList.add('active');
            }
        });

        // Update accessibility toggles
        this.updateToggleState(this.elements.accessibilityModeToggle, settings.accessibilityMode);
        this.updateToggleState(this.elements.systemPreferencesToggle, settings.respectSystemPreferences);

        // Update accessibility warning
        this.updateAccessibilityWarning();
    }

    /**
     * Update toggle switch visual state
     * @param {HTMLElement} toggle - Toggle element
     * @param {boolean} active - Whether toggle should be active
     */
    updateToggleState(toggle, active) {
        if (toggle) {
            if (active) {
                toggle.classList.add('active');
            } else {
                toggle.classList.remove('active');
            }
        }
    }

    /**
     * Update shake intensity setting
     * @param {number} intensity - New intensity value (0.0 to 2.0)
     */
    updateShakeIntensity(intensity) {
        const settings = {
            shakeIntensity: intensity,
            shakeEnabled: intensity > 0
        };
        this.configManager.updateSettings(settings);
    }

    /**
     * Toggle motion blur enabled state
     */
    toggleMotionBlur() {
        const currentSettings = this.configManager.getSettings();
        this.configManager.updateSettings({
            motionBlurEnabled: !currentSettings.motionBlurEnabled
        });
    }

    /**
     * Update motion blur quality setting
     * @param {string} quality - Quality level ('low', 'medium', 'high')
     */
    updateMotionBlurQuality(quality) {
        this.configManager.updateSettings({
            motionBlurQuality: quality
        });
    }

    /**
     * Toggle accessibility mode
     */
    toggleAccessibilityMode() {
        const currentSettings = this.configManager.getSettings();
        this.configManager.updateSettings({
            accessibilityMode: !currentSettings.accessibilityMode
        });
    }

    /**
     * Toggle system preferences respect
     */
    toggleSystemPreferences() {
        const currentSettings = this.configManager.getSettings();
        this.configManager.updateSettings({
            respectSystemPreferences: !currentSettings.respectSystemPreferences
        });
    }

    /**
     * Reset settings to defaults
     */
    resetSettings() {
        this.configManager.resetToDefaults();
    }

    /**
     * Update accessibility warning visibility
     */
    updateAccessibilityWarning() {
        if (this.elements.accessibilityWarning) {
            const shouldDisable = this.configManager.shouldDisableEffects();
            if (shouldDisable) {
                this.elements.accessibilityWarning.classList.add('show');
            } else {
                this.elements.accessibilityWarning.classList.remove('show');
            }
        }
    }

    /**
     * Get the configuration manager instance
     * @returns {EffectsConfigManager} Configuration manager
     */
    getConfigManager() {
        return this.configManager;
    }

    /**
     * Destroy the UI controller and clean up resources
     */
    destroy() {
        // Remove event listeners and clean up
        if (this.configManager) {
            this.configManager.removeChangeListener(this.updateUIFromSettings.bind(this));
        }
    }
}

module.exports = { CameraEffectsUI };