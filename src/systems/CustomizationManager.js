/**
 * CustomizationManager - Central coordinator for all customization functionality
 * Manages color customization, trail styles, arena themes, and preview functionality
 */
class CustomizationManager {
    constructor(renderingEngine, preferenceStorage) {
        this.renderingEngine = renderingEngine;
        this.preferenceStorage = preferenceStorage;
        this.themeEngine = null; // Will be initialized when needed

        // Initialize performance optimizer
        this.performanceOptimizer = null;
        if (renderingEngine && renderingEngine.scene && renderingEngine.renderer) {
            const { PerformanceOptimizer } = require('../utils/PerformanceOptimizer.js');
            this.performanceOptimizer = new PerformanceOptimizer(
                renderingEngine.scene,
                renderingEngine.renderer
            );
        }

        // Current customization state
        this.currentState = {
            bikeColor: '#00FF00',      // Default green
            trailColor: '#00FF00',     // Default green
            trailStyle: 'solid',       // Default solid trail
            arenaTheme: 'classic-grid' // Default classic theme
        };

        // Preview state management
        this.previewMode = false;
        this.previewState = null;
        this.originalState = null;

        // Preference loading state
        this.pendingPreferenceApplication = false;

        // Default color presets
        this.colorPresets = {
            red: '#FF0000',
            blue: '#0000FF',
            green: '#00FF00',
            yellow: '#FFFF00',
            purple: '#800080',
            orange: '#FFA500',
            cyan: '#00FFFF',
            white: '#FFFFFF'
        };

        // Trail style definitions
        this.trailStyles = {
            solid: {
                opacity: 0.8,
                segments: 'continuous',
                effects: []
            },
            dashed: {
                opacity: 0.8,
                segments: 'alternating',
                effects: []
            },
            glowing: {
                opacity: 0.9,
                segments: 'continuous',
                effects: ['emissive', 'bloom']
            },
            rainbow: {
                opacity: 0.8,
                segments: 'continuous',
                effects: ['color-cycle']
            }
        };

        // Initialize with saved preferences
        this.initializePreferences();
    }

    /**
     * Set bike color for a specific player
     * @param {string} playerId - Player identifier ('player' or AI ID)
     * @param {string} color - Hex color string
     * @returns {boolean} Success status
     */
    setBikeColor(playerId, color) {
        if (!this.validateColor(color)) {
            console.warn('Invalid color format:', color);
            return false;
        }

        const targetState = this.previewMode ? this.previewState : this.currentState;

        if (playerId === 'player') {
            targetState.bikeColor = color;

            // Apply to rendering engine immediately
            if (this.renderingEngine && this.renderingEngine.emissiveMaterialSystem) {
                const colorHex = parseInt(color.replace('#', ''), 16);
                this.renderingEngine.emissiveMaterialSystem.updateBikeMaterial('player', colorHex);
            }
        }

        return true;
    }

    /**
     * Set trail color for a specific player
     * @param {string} playerId - Player identifier ('player' or AI ID)
     * @param {string} color - Hex color string
     * @returns {boolean} Success status
     */
    setTrailColor(playerId, color) {
        if (!this.validateColor(color)) {
            console.warn('Invalid color format:', color);
            return false;
        }

        const targetState = this.previewMode ? this.previewState : this.currentState;

        if (playerId === 'player') {
            targetState.trailColor = color;

            // Apply to rendering engine immediately
            if (this.renderingEngine && this.renderingEngine.emissiveMaterialSystem) {
                const colorHex = parseInt(color.replace('#', ''), 16);
                // Update existing trail materials
                this.updateExistingTrailMaterials('player', colorHex);
            }
        }

        return true;
    }

    /**
     * Set trail style for a specific player
     * @param {string} playerId - Player identifier ('player' or AI ID)
     * @param {string} style - Trail style ('solid', 'dashed', 'glowing', 'rainbow')
     * @returns {boolean} Success status
     */
    setTrailStyle(playerId, style) {
        if (!this.trailStyles[style]) {
            console.warn('Invalid trail style:', style);
            return false;
        }

        const targetState = this.previewMode ? this.previewState : this.currentState;

        if (playerId === 'player') {
            targetState.trailStyle = style;

            // Apply style changes to rendering engine
            this.applyTrailStyle(playerId, style);
        }

        return true;
    }

    /**
     * Set arena theme
     * @param {string} themeName - Theme name ('classic-grid', 'neon-city', 'space', 'tron-legacy')
     * @returns {boolean} Success status
     */
    setArenaTheme(themeName) {
        // Initialize theme engine if not already done
        if (!this.themeEngine) {
            this.initializeThemeEngine();
        }

        if (!this.themeEngine.isValidTheme(themeName)) {
            console.warn('Invalid theme name:', themeName);
            return false;
        }

        const targetState = this.previewMode ? this.previewState : this.currentState;
        targetState.arenaTheme = themeName;

        // Apply theme to rendering engine
        this.themeEngine.loadTheme(themeName);

        return true;
    }

    /**
     * Enable preview mode for testing changes without committing
     */
    enablePreviewMode() {
        if (this.previewMode) {
            return; // Already in preview mode
        }

        this.previewMode = true;
        this.originalState = { ...this.currentState };
        this.previewState = { ...this.currentState };
    }

    /**
     * Disable preview mode and revert to original state
     */
    disablePreviewMode() {
        if (!this.previewMode) {
            return; // Not in preview mode
        }

        // Revert to original state
        if (this.originalState) {
            this.applyState(this.originalState);
            this.currentState = { ...this.originalState };
        }

        this.previewMode = false;
        this.previewState = null;
        this.originalState = null;
    }

    /**
     * Apply preview changes to current state
     */
    applyPreviewChanges() {
        if (!this.previewMode || !this.previewState) {
            return false;
        }

        this.currentState = { ...this.previewState };
        this.previewMode = false;
        this.previewState = null;
        this.originalState = null;

        // Save the applied changes
        this.saveCurrentPreferences();

        return true;
    }

    /**
     * Cancel preview changes and revert to original state
     */
    cancelPreviewChanges() {
        this.disablePreviewMode();
    }

    /**
     * Load saved preferences from storage
     * @param {boolean} forceApply - Force application even if rendering engine isn't ready
     */
    loadSavedPreferences(forceApply = false) {
        try {
            const savedPreferences = this.preferenceStorage.loadPreferences();
            if (savedPreferences && savedPreferences.preferences) {
                const prefs = savedPreferences.preferences;

                // Validate and apply saved preferences
                if (prefs.bikeColor && this.validateColor(prefs.bikeColor)) {
                    this.currentState.bikeColor = prefs.bikeColor;
                }
                if (prefs.trailColor && this.validateColor(prefs.trailColor)) {
                    this.currentState.trailColor = prefs.trailColor;
                }
                if (prefs.trailStyle && this.trailStyles[prefs.trailStyle]) {
                    this.currentState.trailStyle = prefs.trailStyle;
                }
                if (prefs.arenaTheme) {
                    this.currentState.arenaTheme = prefs.arenaTheme;
                }

                // Apply loaded preferences to rendering engine if available
                if (forceApply || this.isRenderingEngineReady()) {
                    this.applyState(this.currentState);
                } else {
                    // Mark that preferences need to be applied when rendering engine is ready
                    this.pendingPreferenceApplication = true;
                }

                console.log('Loaded saved preferences:', this.currentState);
                return true;
            } else {
                console.log('No saved preferences found, using defaults');
                return false;
            }
        } catch (error) {
            console.warn('Failed to load saved preferences:', error);
            // Continue with default state
            return false;
        }
    }

    /**
     * Check if rendering engine is ready for preference application
     * @returns {boolean} True if rendering engine is ready
     */
    isRenderingEngineReady() {
        return this.renderingEngine &&
            this.renderingEngine.emissiveMaterialSystem &&
            this.renderingEngine.scene &&
            this.renderingEngine.renderer;
    }

    /**
     * Apply pending preferences when rendering engine becomes ready
     * This should be called after the rendering engine is fully initialized
     */
    applyPendingPreferences() {
        if (this.pendingPreferenceApplication && this.isRenderingEngineReady()) {
            console.log('Applying pending preferences to rendering engine');
            this.applyState(this.currentState);
            this.pendingPreferenceApplication = false;
            return true;
        }
        return false;
    }

    /**
     * Initialize or reinitialize preferences loading
     * This can be called multiple times safely
     */
    initializePreferences() {
        // Load preferences from storage
        const loaded = this.loadSavedPreferences(false);

        // If no preferences were loaded, ensure defaults are applied
        if (!loaded && this.isRenderingEngineReady()) {
            this.applyState(this.currentState);
        }

        return loaded;
    }

    /**
     * Save current preferences to storage
     */
    saveCurrentPreferences() {
        try {
            const preferences = {
                bikeColor: this.currentState.bikeColor,
                trailColor: this.currentState.trailColor,
                trailStyle: this.currentState.trailStyle,
                arenaTheme: this.currentState.arenaTheme
            };

            this.preferenceStorage.savePreferences(preferences);
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }

    /**
     * Reset all customizations to default values
     */
    resetToDefaults() {
        const defaultState = {
            bikeColor: '#00FF00',
            trailColor: '#00FF00',
            trailStyle: 'solid',
            arenaTheme: 'classic-grid'
        };

        if (this.previewMode) {
            this.previewState = { ...defaultState };
        } else {
            this.currentState = { ...defaultState };
            this.saveCurrentPreferences();
        }

        // Apply default state to rendering engine
        this.applyState(defaultState);
    }

    /**
     * Get current customization state
     * @returns {Object} Current state object
     */
    getCurrentState() {
        return this.previewMode ? { ...this.previewState } : { ...this.currentState };
    }

    /**
     * Get saved customization state from storage
     * @returns {Object} Saved state object
     */
    getSavedState() {
        try {
            const savedPreferences = this.preferenceStorage.loadPreferences();
            if (savedPreferences) {
                return {
                    bikeColor: savedPreferences.bikeColor || '#00FF00',
                    trailColor: savedPreferences.trailColor || '#00FF00',
                    trailStyle: savedPreferences.trailStyle || 'solid',
                    arenaTheme: savedPreferences.arenaTheme || 'classic-grid'
                };
            }
        } catch (error) {
            console.warn('Failed to load saved preferences:', error);
        }

        // Return default state if no saved preferences
        return {
            bikeColor: '#00FF00',
            trailColor: '#00FF00',
            trailStyle: 'solid',
            arenaTheme: 'classic-grid'
        };
    }

    /**
     * Get available color presets
     * @returns {Object} Color presets object
     */
    getColorPresets() {
        return { ...this.colorPresets };
    }

    /**
     * Get available trail styles
     * @returns {Array} Array of trail style names
     */
    getAvailableTrailStyles() {
        return Object.keys(this.trailStyles);
    }

    /**
     * Get available arena themes
     * @returns {Array} Array of theme names
     */
    getAvailableThemes() {
        if (!this.themeEngine) {
            this.initializeThemeEngine();
        }
        return this.themeEngine.getAvailableThemes();
    }

    /**
     * Validate color format (hex string)
     * @param {string} color - Color string to validate
     * @returns {boolean} True if valid
     */
    validateColor(color) {
        if (typeof color !== 'string') return false;

        // Check hex format (#RRGGBB)
        const hexRegex = /^#[0-9A-Fa-f]{6}$/;
        return hexRegex.test(color);
    }

    /**
     * Check color contrast against arena background
     * @param {string} color - Color to check
     * @param {string} backgroundColor - Background color
     * @returns {boolean} True if contrast is sufficient
     */
    validateColorContrast(color, backgroundColor = '#000033') {
        // Simple contrast calculation
        const colorLuminance = this.calculateLuminance(color);
        const bgLuminance = this.calculateLuminance(backgroundColor);

        const contrast = (Math.max(colorLuminance, bgLuminance) + 0.05) /
            (Math.min(colorLuminance, bgLuminance) + 0.05);

        return contrast >= 3.0; // WCAG AA standard
    }

    /**
     * Calculate relative luminance of a color
     * @param {string} color - Hex color string
     * @returns {number} Luminance value
     */
    calculateLuminance(color) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;

        const sRGB = [r, g, b].map(c => {
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });

        return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
    }

    /**
     * Apply a complete state to the rendering engine
     * @param {Object} state - State object to apply
     */
    applyState(state) {
        // Apply bike color with performance optimization
        if (state.bikeColor && this.renderingEngine && this.renderingEngine.emissiveMaterialSystem) {
            const colorHex = parseInt(state.bikeColor.replace('#', ''), 16);

            // Use performance optimizer for material reuse if available
            if (this.performanceOptimizer) {
                const optimizedMaterial = this.performanceOptimizer.getOrCreateBikeMaterial(colorHex, {
                    emissive: colorHex,
                    emissiveIntensity: 0.2
                });

                // Apply optimized material to bike
                if (this.renderingEngine.player && this.renderingEngine.player.material) {
                    this.renderingEngine.player.material = optimizedMaterial;
                }
            } else {
                // Fallback to original method
                if (this.renderingEngine.emissiveMaterialSystem &&
                    typeof this.renderingEngine.emissiveMaterialSystem.updateBikeMaterial === 'function') {
                    this.renderingEngine.emissiveMaterialSystem.updateBikeMaterial('player', colorHex);
                }
            }
        }

        // Apply trail color with performance optimization
        if (state.trailColor && this.renderingEngine && this.renderingEngine.emissiveMaterialSystem) {
            const colorHex = parseInt(state.trailColor.replace('#', ''), 16);
            this.updateExistingTrailMaterials('player', colorHex);
        }

        // Apply trail style
        if (state.trailStyle) {
            this.applyTrailStyle('player', state.trailStyle);
        }

        // Apply arena theme
        if (state.arenaTheme) {
            if (!this.themeEngine) {
                this.initializeThemeEngine();
            }
            this.themeEngine.loadTheme(state.arenaTheme);
        }

        // Trigger performance optimization
        if (this.performanceOptimizer && this.renderingEngine.camera) {
            this.performanceOptimizer.optimizeScene(this.renderingEngine.camera.position);
        }
    }

    /**
     * Apply trail style to rendering engine
     * @param {string} playerId - Player identifier
     * @param {string} style - Trail style name
     */
    applyTrailStyle(playerId, style) {
        const styleConfig = this.trailStyles[style];
        if (!styleConfig || !this.renderingEngine) return;

        // Apply style through the trail style renderer
        if (this.renderingEngine.trailStyleRenderer) {
            this.renderingEngine.trailStyleRenderer.setTrailStyle(playerId, style);
        }
    }

    /**
     * Update existing trail materials with new color
     * @param {string} playerId - Player identifier
     * @param {number} colorHex - Color as hex number
     */
    updateExistingTrailMaterials(playerId, colorHex) {
        if (!this.renderingEngine || !this.renderingEngine.emissiveMaterialSystem) return;

        // Update trail material template for future segments
        this.renderingEngine.emissiveMaterialSystem.updateTrailMaterialTemplate(playerId, colorHex);

        // Note: Updating existing trail segments would require tracking all trail segment materials
        // This is a simplified implementation that affects new trail segments
    }

    /**
     * Initialize theme engine
     */
    initializeThemeEngine() {
        if (this.themeEngine) return;

        try {
            const { ThemeEngine } = require('./ThemeEngine.js');
            this.themeEngine = new ThemeEngine(
                this.renderingEngine.scene,
                this.renderingEngine.renderer
            );
        } catch (error) {
            console.error('Failed to initialize ThemeEngine:', error);
            // Create a minimal theme engine for basic functionality
            this.themeEngine = this.createMinimalThemeEngine();
        }
    }

    /**
     * Create minimal theme engine for fallback
     * @returns {Object} Minimal theme engine
     */
    createMinimalThemeEngine() {
        return {
            isValidTheme: (themeName) => themeName === 'classic-grid',
            loadTheme: (themeName) => {
                console.log('Loading theme:', themeName);
            },
            getAvailableThemes: () => ['classic-grid']
        };
    }

    /**
     * Get performance metrics from the optimizer
     * @returns {Object|null} Performance metrics or null if optimizer not available
     */
    getPerformanceMetrics() {
        return this.performanceOptimizer ? this.performanceOptimizer.getPerformanceMetrics() : null;
    }

    /**
     * Check if performance is within acceptable limits
     * @returns {boolean} True if performance is acceptable
     */
    isPerformanceAcceptable() {
        return this.performanceOptimizer ? this.performanceOptimizer.isPerformanceAcceptable() : true;
    }

    /**
     * Optimize scene performance
     */
    optimizePerformance() {
        if (this.performanceOptimizer && this.renderingEngine.camera) {
            this.performanceOptimizer.optimizeScene(this.renderingEngine.camera.position);
        }
    }

    /**
     * Clean up performance optimizer resources
     */
    cleanup() {
        if (this.performanceOptimizer) {
            this.performanceOptimizer.cleanup();
        }
    }
}

module.exports = { CustomizationManager };