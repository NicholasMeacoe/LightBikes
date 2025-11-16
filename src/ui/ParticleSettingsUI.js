/**
 * Particle Settings UI Integration
 * Handles the settings interface and integration with main game menu
 * Provides real-time settings updates and visual feedback
 */

const { ParticleSettings } = require('../systems/ParticleSettings.js');

/**
 * ParticleSettingsUI class for managing the settings interface
 * Handles DOM interactions, real-time updates, and integration with ParticleSystem
 */
class ParticleSettingsUI {
    constructor() {
        this.particleSettings = new ParticleSettings();
        this.isVisible = false;
        this.elements = {};
        
        // Bind methods to preserve context
        this.togglePanel = this.togglePanel.bind(this);
        this.closePanel = this.closePanel.bind(this);
        this.resetSettings = this.resetSettings.bind(this);
        this.handleSettingChange = this.handleSettingChange.bind(this);
        
        // Initialize UI after DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    /**
     * Initialize the settings UI
     */
    initialize() {
        this.cacheElements();
        this.bindEvents();
        this.updateUI();
        
        // Listen for settings changes to update UI
        this.particleSettings.addChangeListener(this.handleSettingChange);
    }

    /**
     * Cache DOM elements for performance
     */
    cacheElements() {
        this.elements = {
            // Main controls
            settingsButton: document.getElementById('particleSettingsButton'),
            settingsPanel: document.getElementById('particleSettingsPanel'),
            closeButton: document.getElementById('closeParticleSettings'),
            resetButton: document.getElementById('resetParticleSettings'),
            
            // General settings
            enabledToggle: document.getElementById('particleEnabledToggle'),
            qualityButtons: document.querySelectorAll('.quality-btn'),
            
            // Effect toggles
            trailSparksToggle: document.getElementById('trailSparksToggle'),
            explosionsToggle: document.getElementById('explosionsToggle'),
            collectionsToggle: document.getElementById('collectionsToggle'),
            
            // Performance controls
            densitySlider: document.getElementById('particleDensitySlider'),
            densityValue: document.getElementById('particleDensityValue'),
            maxParticlesSlider: document.getElementById('maxParticlesSlider'),
            maxParticlesValue: document.getElementById('maxParticlesValue'),
            adaptiveQualityToggle: document.getElementById('adaptiveQualityToggle')
        };
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Main panel controls
        if (this.elements.settingsButton) {
            this.elements.settingsButton.addEventListener('click', this.togglePanel);
        }
        
        if (this.elements.closeButton) {
            this.elements.closeButton.addEventListener('click', this.closePanel);
        }
        
        if (this.elements.resetButton) {
            this.elements.resetButton.addEventListener('click', this.resetSettings);
        }

        // General settings
        if (this.elements.enabledToggle) {
            this.elements.enabledToggle.addEventListener('click', () => {
                const enabled = !this.elements.enabledToggle.classList.contains('active');
                this.particleSettings.setEnabled(enabled);
            });
        }

        // Quality buttons
        this.elements.qualityButtons.forEach(button => {
            button.addEventListener('click', () => {
                const quality = button.dataset.quality;
                this.particleSettings.setQuality(quality);
            });
        });

        // Effect toggles
        if (this.elements.trailSparksToggle) {
            this.elements.trailSparksToggle.addEventListener('click', () => {
                const enabled = !this.elements.trailSparksToggle.classList.contains('active');
                this.particleSettings.setEffectEnabled('trailSparks', enabled);
            });
        }

        if (this.elements.explosionsToggle) {
            this.elements.explosionsToggle.addEventListener('click', () => {
                const enabled = !this.elements.explosionsToggle.classList.contains('active');
                this.particleSettings.setEffectEnabled('explosions', enabled);
            });
        }

        if (this.elements.collectionsToggle) {
            this.elements.collectionsToggle.addEventListener('click', () => {
                const enabled = !this.elements.collectionsToggle.classList.contains('active');
                this.particleSettings.setEffectEnabled('collections', enabled);
            });
        }

        // Performance sliders
        if (this.elements.densitySlider) {
            this.elements.densitySlider.addEventListener('input', (e) => {
                const density = parseFloat(e.target.value);
                this.particleSettings.setParticleDensity(density);
                this.updateDensityDisplay(density);
            });
        }

        if (this.elements.maxParticlesSlider) {
            this.elements.maxParticlesSlider.addEventListener('input', (e) => {
                const maxParticles = parseInt(e.target.value);
                this.particleSettings.setMaxParticles(maxParticles);
                this.updateMaxParticlesDisplay(maxParticles);
            });
        }

        if (this.elements.adaptiveQualityToggle) {
            this.elements.adaptiveQualityToggle.addEventListener('click', () => {
                const enabled = !this.elements.adaptiveQualityToggle.classList.contains('active');
                this.particleSettings.setAdaptiveQuality(enabled);
            });
        }

        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isVisible && 
                !this.elements.settingsPanel.contains(e.target) && 
                !this.elements.settingsButton.contains(e.target)) {
                this.closePanel();
            }
        });

        // Close panel on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.closePanel();
            }
        });
    }

    /**
     * Toggle settings panel visibility
     */
    togglePanel() {
        if (this.isVisible) {
            this.closePanel();
        } else {
            this.showPanel();
        }
    }

    /**
     * Show settings panel
     */
    showPanel() {
        if (this.elements.settingsPanel) {
            this.elements.settingsPanel.style.display = 'block';
            this.elements.settingsButton.classList.add('active');
            this.isVisible = true;
            this.updateUI(); // Refresh UI with current settings
        }
    }

    /**
     * Close settings panel
     */
    closePanel() {
        if (this.elements.settingsPanel) {
            this.elements.settingsPanel.style.display = 'none';
            this.elements.settingsButton.classList.remove('active');
            this.isVisible = false;
        }
    }

    /**
     * Reset settings to defaults
     */
    resetSettings() {
        if (confirm('Reset all particle settings to defaults?')) {
            this.particleSettings.resetToDefaults();
        }
    }

    /**
     * Handle settings changes from ParticleSettings
     * @param {string} path - Changed setting path
     * @param {*} value - New value
     */
    handleSettingChange(path, value) {
        // Update UI to reflect changes
        this.updateUI();
        
        // Notify any external listeners (like ParticleSystem)
        this.notifyExternalListeners(path, value);
    }

    /**
     * Update UI elements to reflect current settings
     */
    updateUI() {
        const settings = this.particleSettings.getSettings();

        // Update general settings
        this.updateToggle(this.elements.enabledToggle, settings.enabled);
        this.updateQualityButtons(settings.quality);

        // Update effect toggles
        this.updateToggle(this.elements.trailSparksToggle, settings.effects.trailSparks);
        this.updateToggle(this.elements.explosionsToggle, settings.effects.explosions);
        this.updateToggle(this.elements.collectionsToggle, settings.effects.collections);

        // Update performance controls
        this.updateDensitySlider(settings.advanced.particleDensity);
        this.updateMaxParticlesSlider(settings.performance.maxParticles);
        this.updateToggle(this.elements.adaptiveQualityToggle, settings.performance.adaptiveQuality);

        // Update settings button state based on whether particles are enabled
        if (this.elements.settingsButton && this.elements.settingsButton.style) {
            if (settings.enabled) {
                this.elements.settingsButton.style.opacity = '1.0';
                this.elements.settingsButton.title = 'Particle Settings';
            } else {
                this.elements.settingsButton.style.opacity = '0.6';
                this.elements.settingsButton.title = 'Particle Settings (Disabled)';
            }
        }
    }

    /**
     * Update toggle switch state
     * @param {HTMLElement} toggle - Toggle element
     * @param {boolean} active - Whether toggle should be active
     */
    updateToggle(toggle, active) {
        if (toggle) {
            if (active) {
                toggle.classList.add('active');
            } else {
                toggle.classList.remove('active');
            }
        }
    }

    /**
     * Update quality buttons
     * @param {string} activeQuality - Currently active quality level
     */
    updateQualityButtons(activeQuality) {
        this.elements.qualityButtons.forEach(button => {
            if (button.dataset.quality === activeQuality) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    /**
     * Update particle density slider and display
     * @param {number} density - Density value
     */
    updateDensitySlider(density) {
        if (this.elements.densitySlider) {
            this.elements.densitySlider.value = density;
        }
        this.updateDensityDisplay(density);
    }

    /**
     * Update density display value
     * @param {number} density - Density value
     */
    updateDensityDisplay(density) {
        if (this.elements.densityValue) {
            this.elements.densityValue.textContent = Math.round(density * 100) + '%';
        }
    }

    /**
     * Update max particles slider and display
     * @param {number} maxParticles - Max particles value
     */
    updateMaxParticlesSlider(maxParticles) {
        if (this.elements.maxParticlesSlider) {
            this.elements.maxParticlesSlider.value = maxParticles;
        }
        this.updateMaxParticlesDisplay(maxParticles);
    }

    /**
     * Update max particles display value
     * @param {number} maxParticles - Max particles value
     */
    updateMaxParticlesDisplay(maxParticles) {
        if (this.elements.maxParticlesValue) {
            this.elements.maxParticlesValue.textContent = maxParticles.toString();
        }
    }

    /**
     * Get current particle settings for ParticleSystem
     * @returns {Object} Settings object compatible with ParticleSystem
     */
    getParticleSystemSettings() {
        return this.particleSettings.getParticleSystemSettings();
    }

    /**
     * Get the ParticleSettings instance
     * @returns {ParticleSettings} ParticleSettings instance
     */
    getParticleSettings() {
        return this.particleSettings;
    }

    /**
     * Add external listener for settings changes
     * @param {Function} listener - Callback function (path, value) => void
     */
    addExternalListener(listener) {
        if (!this.externalListeners) {
            this.externalListeners = [];
        }
        this.externalListeners.push(listener);
    }

    /**
     * Remove external listener
     * @param {Function} listener - Callback function to remove
     */
    removeExternalListener(listener) {
        if (this.externalListeners) {
            const index = this.externalListeners.indexOf(listener);
            if (index !== -1) {
                this.externalListeners.splice(index, 1);
            }
        }
    }

    /**
     * Notify external listeners of settings changes
     * @private
     * @param {string} path - Changed setting path
     * @param {*} value - New value
     */
    notifyExternalListeners(path, value) {
        if (this.externalListeners) {
            this.externalListeners.forEach(listener => {
                try {
                    listener(path, value);
                } catch (error) {
                    console.error('ParticleSettingsUI: Error in external listener:', error);
                }
            });
        }
    }

    /**
     * Show performance status in the UI
     * @param {Object} performanceStatus - Performance status from ParticleSystem
     */
    updatePerformanceStatus(performanceStatus) {
        // This could be extended to show performance metrics in the UI
        // For now, we'll just update the settings button to indicate performance issues
        if (this.elements.settingsButton && performanceStatus) {
            if (performanceStatus.degradationLevel > 0) {
                this.elements.settingsButton.style.borderColor = '#ff8c00';
                this.elements.settingsButton.title = `Particle Settings (Performance Mode: Level ${performanceStatus.degradationLevel})`;
            } else {
                this.elements.settingsButton.style.borderColor = 'white';
                this.elements.settingsButton.title = 'Particle Settings';
            }
        }
    }

    /**
     * Export current settings as JSON
     * @returns {string} JSON string of current settings
     */
    exportSettings() {
        return this.particleSettings.exportSettings();
    }

    /**
     * Import settings from JSON
     * @param {string} jsonString - JSON string of settings
     * @returns {boolean} True if import was successful
     */
    importSettings(jsonString) {
        return this.particleSettings.importSettings(jsonString);
    }

    /**
     * Dispose of the settings UI
     */
    dispose() {
        // Remove event listeners
        if (this.elements.settingsButton) {
            this.elements.settingsButton.removeEventListener('click', this.togglePanel);
        }
        
        // Remove settings change listener
        this.particleSettings.removeChangeListener(this.handleSettingChange);
        
        // Clear references
        this.elements = {};
        this.externalListeners = [];
    }
}

module.exports = { ParticleSettingsUI };