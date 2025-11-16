/**
 * GlowSettingsUI - Interactive user interface for glow effect configuration
 * 
 * This class manages the complete user interface for glow effect settings,
 * providing an intuitive way for users to adjust glow intensity with immediate
 * visual feedback. It handles UI interactions, settings persistence, and
 * provides real-time preview of changes.
 * 
 * Key Features:
 * - Interactive intensity selection with visual feedback
 * - Real-time preview bar showing current glow level
 * - Immediate application of settings (no restart required)
 * - Responsive design with mobile-friendly interactions
 * - Keyboard shortcuts and accessibility support
 * - Settings panel with smooth show/hide animations
 * - Integration with GlowSettings for persistence
 * 
 * UI Components:
 * - Settings toggle button with current intensity indicator
 * - Collapsible settings panel with intensity options
 * - Visual preview bar with glow effect simulation
 * - Reset button to restore default settings
 * - Close button and click-outside-to-close functionality
 * 
 * Interaction Features:
 * - Click intensity buttons to change level
 * - Visual feedback shows current selection
 * - Preview bar updates with glow intensity
 * - Settings button shows current state (enabled/disabled)
 * - Keyboard support (Escape to close)
 * 
 * Usage Example:
 * ```javascript
 * const settingsUI = new GlowSettingsUI(glowSettings, glowEffectManager);
 * 
 * // UI is automatically initialized and event listeners attached
 * // User interactions will automatically update settings and apply changes
 * 
 * // Programmatically update UI (e.g., from external settings change)
 * settingsUI.updateFromExternal('HIGH');
 * 
 * // Handle window resize
 * settingsUI.handleResize();
 * 
 * // Cleanup when done
 * settingsUI.destroy();
 * ```
 * 
 * HTML Structure Required:
 * ```html
 * <button id="glowSettingsButton">Glow Settings</button>
 * <div id="glowSettingsPanel" style="display: none;">
 *   <div class="glow-intensity-controls">
 *     <button class="glow-intensity-btn" data-intensity="OFF">Off</button>
 *     <button class="glow-intensity-btn" data-intensity="LOW">Low</button>
 *     <button class="glow-intensity-btn" data-intensity="MEDIUM">Medium</button>
 *     <button class="glow-intensity-btn" data-intensity="HIGH">High</button>
 *   </div>
 *   <div id="glowPreviewLevel"></div>
 *   <span id="currentIntensityLabel">Medium</span>
 *   <button id="resetGlowSettings">Reset</button>
 *   <button id="closeGlowSettings">Close</button>
 * </div>
 * ```
 * 
 * @class GlowSettingsUI
 * @author LightBikes Development Team
 * @version 1.0.0
 * @since 2024
 */
class GlowSettingsUI {
    constructor(glowSettings, glowEffectManager) {
        this.glowSettings = glowSettings;
        this.glowEffectManager = glowEffectManager;
        
        // UI elements
        this.settingsButton = null;
        this.settingsPanel = null;
        this.intensityButtons = [];
        this.previewLevel = null;
        this.currentIntensityLabel = null;
        
        // State
        this.isVisible = false;
        
        // Initialize UI
        this.initializeUI();
    }

    /**
     * Initialize UI elements and event listeners
     */
    initializeUI() {
        // Get UI elements
        this.settingsButton = document.getElementById('glowSettingsButton');
        this.settingsPanel = document.getElementById('glowSettingsPanel');
        this.previewLevel = document.getElementById('glowPreviewLevel');
        this.currentIntensityLabel = document.getElementById('currentIntensityLabel');
        
        // Get intensity buttons
        this.intensityButtons = Array.from(document.querySelectorAll('.glow-intensity-btn'));
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Update UI to reflect current settings
        this.updateUI();
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Settings button toggle
        if (this.settingsButton) {
            this.settingsButton.addEventListener('click', () => {
                this.togglePanel();
            });
        }

        // Intensity buttons
        this.intensityButtons.forEach(button => {
            button.addEventListener('click', () => {
                const intensity = button.dataset.intensity;
                this.setIntensity(intensity);
            });
        });

        // Close button
        const closeButton = document.getElementById('closeGlowSettings');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.hidePanel();
            });
        }

        // Reset button
        const resetButton = document.getElementById('resetGlowSettings');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                this.resetSettings();
            });
        }

        // Close panel when clicking outside
        document.addEventListener('click', (event) => {
            if (this.isVisible && 
                !this.settingsPanel.contains(event.target) && 
                !this.settingsButton.contains(event.target)) {
                this.hidePanel();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.isVisible) {
                this.hidePanel();
            }
        });
    }

    /**
     * Toggle settings panel visibility
     */
    togglePanel() {
        if (this.isVisible) {
            this.hidePanel();
        } else {
            this.showPanel();
        }
    }

    /**
     * Show settings panel
     */
    showPanel() {
        if (!this.settingsPanel) return;
        
        this.settingsPanel.style.display = 'block';
        this.isVisible = true;
        
        if (this.settingsButton) {
            this.settingsButton.classList.add('active');
        }
        
        // Update UI when panel is shown
        this.updateUI();
    }

    /**
     * Hide settings panel
     */
    hidePanel() {
        if (!this.settingsPanel) return;
        
        this.settingsPanel.style.display = 'none';
        this.isVisible = false;
        
        if (this.settingsButton) {
            this.settingsButton.classList.remove('active');
        }
    }

    /**
     * Set glow intensity and update UI
     * @param {string} intensity - Intensity level (OFF, LOW, MEDIUM, HIGH)
     */
    setIntensity(intensity) {
        if (this.glowSettings.setIntensity(intensity)) {
            // Apply settings immediately to glow effect manager
            if (this.glowEffectManager) {
                this.glowEffectManager.setIntensity(intensity);
            }
            
            // Update UI
            this.updateUI();
        }
    }

    /**
     * Reset settings to defaults
     */
    resetSettings() {
        this.glowSettings.resetToDefaults();
        
        // Apply reset settings immediately
        if (this.glowEffectManager) {
            this.glowEffectManager.setIntensity(this.glowSettings.getIntensity());
        }
        
        // Update UI
        this.updateUI();
    }

    /**
     * Update UI to reflect current settings
     */
    updateUI() {
        const currentIntensity = this.glowSettings.getIntensity();
        const config = this.glowSettings.getIntensityConfig();
        
        // Update intensity buttons
        this.intensityButtons.forEach(button => {
            const buttonIntensity = button.dataset.intensity;
            if (buttonIntensity === currentIntensity) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        
        // Update preview
        this.updatePreview(currentIntensity, config);
        
        // Update settings button state
        this.updateButtonState(currentIntensity);
    }

    /**
     * Update preview indicator
     * @param {string} intensity - Current intensity level
     * @param {Object} config - Intensity configuration
     */
    updatePreview(intensity, config) {
        if (!this.previewLevel || !this.currentIntensityLabel) return;
        
        // Update label
        this.currentIntensityLabel.textContent = config.label;
        
        // Calculate preview width based on intensity
        let previewWidth = 0;
        switch (intensity) {
            case 'OFF':
                previewWidth = 0;
                break;
            case 'LOW':
                previewWidth = 25;
                break;
            case 'MEDIUM':
                previewWidth = 60;
                break;
            case 'HIGH':
                previewWidth = 100;
                break;
        }
        
        // Update preview bar
        this.previewLevel.style.width = `${previewWidth}%`;
        
        // Update glow effect on preview bar
        if (intensity === 'OFF') {
            this.previewLevel.style.boxShadow = 'none';
        } else {
            const glowIntensity = config.bloom * 0.5; // Scale for preview
            this.previewLevel.style.boxShadow = `0 0 ${10 + glowIntensity * 5}px rgba(0, 255, 255, ${glowIntensity})`;
        }
    }

    /**
     * Update settings button visual state
     * @param {string} intensity - Current intensity level
     */
    updateButtonState(intensity) {
        if (!this.settingsButton) return;
        
        // Change button appearance based on whether effects are enabled
        if (intensity === 'OFF') {
            this.settingsButton.style.opacity = '0.6';
            this.settingsButton.title = 'Glow Effects Settings (Currently Off)';
        } else {
            this.settingsButton.style.opacity = '1.0';
            this.settingsButton.title = `Glow Effects Settings (${this.glowSettings.getIntensityLabel()})`;
        }
    }

    /**
     * Get current visibility state
     * @returns {boolean} True if panel is visible
     */
    isVisible() {
        return this.isVisible;
    }

    /**
     * Update settings from external source (e.g., performance scaling)
     * @param {string} intensity - New intensity level
     */
    updateFromExternal(intensity) {
        // Update settings without triggering save (external source should handle that)
        this.updateUI();
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Adjust panel position if needed for mobile devices
        if (this.isVisible && this.settingsPanel) {
            const rect = this.settingsPanel.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Ensure panel stays within viewport
            if (rect.right > viewportWidth) {
                this.settingsPanel.style.left = `${viewportWidth - rect.width - 20}px`;
            }
            
            if (rect.bottom > viewportHeight) {
                this.settingsPanel.style.top = `${viewportHeight - rect.height - 20}px`;
            }
        }
    }

    /**
     * Cleanup resources and event listeners
     */
    destroy() {
        // Remove event listeners
        if (this.settingsButton) {
            this.settingsButton.removeEventListener('click', this.togglePanel);
        }
        
        this.intensityButtons.forEach(button => {
            button.removeEventListener('click', this.setIntensity);
        });
        
        // Clear references
        this.glowSettings = null;
        this.glowEffectManager = null;
        this.settingsButton = null;
        this.settingsPanel = null;
        this.intensityButtons = [];
        this.previewLevel = null;
        this.currentIntensityLabel = null;
    }
}

module.exports = { GlowSettingsUI };