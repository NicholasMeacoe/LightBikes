/**
 * ThemeEngine - Manages arena theme packages and coordinates visual elements
 * Handles theme loading, switching, and integration with the rendering system
 */
class ThemeEngine {
    constructor(scene, renderer, performanceOptimizer = null) {
        this.scene = scene;
        this.renderer = renderer;
        this.currentTheme = 'classic-grid';
        this.performanceOptimizer = performanceOptimizer;
        
        // Theme configuration definitions
        this.themeConfigs = {
            'classic-grid': {
                name: 'Classic Grid',
                grid: { 
                    color: 0x00FFFF, 
                    opacity: 0.3 
                },
                background: { 
                    type: 'gradient',
                    colors: [0x000033, 0x000066]
                },
                lighting: {
                    ambient: { color: 0xFFFFFF, intensity: 0.6 },
                    directional: { color: 0xFFFFFF, intensity: 0.8 }
                }
            },
            'neon-city': {
                name: 'Neon City',
                grid: { 
                    color: 0xFF1493, 
                    opacity: 0.5,
                    glow: true
                },
                background: { 
                    type: 'gradient',
                    colors: [0x1a0033, 0x330066]
                },
                lighting: {
                    ambient: { color: 0xFF1493, intensity: 0.4 },
                    directional: { color: 0xFF69B4, intensity: 0.6 }
                }
            },
            'space': {
                name: 'Space',
                grid: { 
                    color: 0x666666, 
                    opacity: 0.2 
                },
                background: { 
                    type: 'starfield',
                    colors: [0x000000, 0x000011]
                },
                lighting: {
                    ambient: { color: 0x4444FF, intensity: 0.3 },
                    directional: { color: 0x6666FF, intensity: 0.5 }
                }
            },
            'tron-legacy': {
                name: 'Tron Legacy',
                grid: { 
                    color: 0xFFA500, 
                    opacity: 0.4,
                    glow: true
                },
                background: { 
                    type: 'circuit',
                    colors: [0x000000, 0x001122]
                },
                lighting: {
                    ambient: { color: 0xFFA500, intensity: 0.4 },
                    directional: { color: 0xFFB84D, intensity: 0.6 }
                }
            }
        };
        
        // Store references to theme elements for cleanup
        this.themeElements = {
            gridHelper: null,
            boxHelper: null,
            ambientLight: null,
            directionalLight: null,
            backgroundElements: []
        };
    }
    
    /**
     * Load and apply a theme
     * @param {string} themeName - Name of the theme to load
     * @returns {boolean} Success status
     */
    loadTheme(themeName) {
        if (!this.isValidTheme(themeName)) {
            console.warn('Invalid theme name:', themeName);
            return false;
        }
        
        const themeConfig = this.themeConfigs[themeName];
        
        try {
            // Clean up current theme elements
            this.cleanupCurrentTheme();
            
            // Apply new theme
            this.updateGridMaterial(themeConfig);
            this.updateBackground(themeConfig);
            this.updateLighting(themeConfig);
            
            this.currentTheme = themeName;
            console.log('Theme loaded successfully:', themeName);
            return true;
            
        } catch (error) {
            console.error('Failed to load theme:', error);
            // Fallback to classic theme
            if (themeName !== 'classic-grid') {
                this.loadTheme('classic-grid');
            }
            return false;
        }
    }
    
    /**
     * Check if a theme name is valid
     * @param {string} themeName - Theme name to validate
     * @returns {boolean} True if valid
     */
    isValidTheme(themeName) {
        return this.themeConfigs.hasOwnProperty(themeName);
    }
    
    /**
     * Get list of available themes
     * @returns {Array} Array of theme names
     */
    getAvailableThemes() {
        return Object.keys(this.themeConfigs);
    }
    
    /**
     * Get theme configuration
     * @param {string} themeName - Theme name
     * @returns {Object|null} Theme configuration or null if invalid
     */
    getThemeConfig(themeName) {
        return this.themeConfigs[themeName] || null;
    }
    
    /**
     * Generate theme preview data
     * @param {string} themeName - Theme name
     * @returns {Object|null} Preview data or null if invalid
     */
    generateThemePreview(themeName) {
        const config = this.getThemeConfig(themeName);
        if (!config) return null;
        
        return {
            name: config.name,
            gridColor: `#${config.grid.color.toString(16).padStart(6, '0')}`,
            backgroundColor: `#${config.background.colors[0].toString(16).padStart(6, '0')}`,
            lightingColor: `#${config.lighting.ambient.color.toString(16).padStart(6, '0')}`,
            hasGlow: config.grid.glow || false
        };
    }
    
    /**
     * Update grid material based on theme
     * @param {Object} themeConfig - Theme configuration
     */
    updateGridMaterial(themeConfig) {
        // Find existing grid elements in the scene
        const gridElements = [];
        
        // Check if scene has traverse method (might not exist in test environments)
        if (this.scene && typeof this.scene.traverse === 'function') {
            this.scene.traverse((child) => {
                if (child.isGridHelper || child.isBoxHelper) {
                    gridElements.push(child);
                }
            });
        }
        
        // Update existing grid elements or create new ones
        if (gridElements.length > 0) {
            gridElements.forEach(element => {
                if (element.material) {
                    if (element.material.color && typeof element.material.color.setHex === 'function') {
                        element.material.color.setHex(themeConfig.grid.color);
                    }
                    element.material.opacity = themeConfig.grid.opacity;
                    element.material.transparent = themeConfig.grid.opacity < 1.0;
                    
                    // Add glow effect if specified
                    if (themeConfig.grid.glow) {
                        if (element.material.emissive && typeof element.material.emissive.setHex === 'function') {
                            element.material.emissive.setHex(themeConfig.grid.color);
                        }
                        element.material.emissiveIntensity = 0.2;
                    } else {
                        if (element.material.emissive && typeof element.material.emissive.setHex === 'function') {
                            element.material.emissive.setHex(0x000000);
                        }
                        element.material.emissiveIntensity = 0;
                    }
                }
            });
        } else {
            // Create new grid elements if none exist
            this.createGridElements(themeConfig);
        }
    }
    
    /**
     * Create grid elements for the theme
     * @param {Object} themeConfig - Theme configuration
     */
    createGridElements(themeConfig) {
        const bounds = 30; // Default arena bounds
        
        // Create grid helper
        const gridHelper = new THREE.GridHelper(bounds * 2, bounds * 2);
        
        // Apply material properties with safety checks for test environments
        if (gridHelper.material) {
            if (gridHelper.material.color && typeof gridHelper.material.color.setHex === 'function') {
                gridHelper.material.color.setHex(themeConfig.grid.color);
            }
            gridHelper.material.opacity = themeConfig.grid.opacity;
            gridHelper.material.transparent = true;
            
            if (themeConfig.grid.glow) {
                if (gridHelper.material.emissive && typeof gridHelper.material.emissive.setHex === 'function') {
                    gridHelper.material.emissive.setHex(themeConfig.grid.color);
                }
                gridHelper.material.emissiveIntensity = 0.2;
            }
        }
        
        if (this.scene && typeof this.scene.add === 'function') {
            this.scene.add(gridHelper);
        }
        this.themeElements.gridHelper = gridHelper;
        
        // Create box helper for boundaries with performance optimization
        const boxGeometry = this.performanceOptimizer ? 
            this.performanceOptimizer.getSharedGeometry('bike') : // Reuse existing geometry
            new THREE.BoxGeometry(bounds * 2, 1, bounds * 2);
            
        const boxMaterial = this.performanceOptimizer ?
            this.performanceOptimizer.getOrCreateThemeMaterial(this.currentTheme, 'grid', {
                color: themeConfig.grid.color,
                opacity: themeConfig.grid.opacity,
                transparent: true
            }) :
            new THREE.LineBasicMaterial({
                color: themeConfig.grid.color,
                opacity: themeConfig.grid.opacity,
                transparent: true
            });
        
        const boxHelper = new THREE.BoxHelper(new THREE.Mesh(boxGeometry));
        boxHelper.material = boxMaterial;
        if (this.scene && typeof this.scene.add === 'function') {
            this.scene.add(boxHelper);
        }
        this.themeElements.boxHelper = boxHelper;
    }
    
    /**
     * Update background based on theme
     * @param {Object} themeConfig - Theme configuration
     */
    updateBackground(themeConfig) {
        const backgroundConfig = themeConfig.background;
        
        switch (backgroundConfig.type) {
            case 'gradient':
                this.createGradientBackground(backgroundConfig.colors);
                break;
            case 'starfield':
                this.createStarfieldBackground(backgroundConfig.colors);
                break;
            case 'circuit':
                this.createCircuitBackground(backgroundConfig.colors);
                break;
            default:
                this.createSolidBackground(backgroundConfig.colors[0]);
        }
    }
    
    /**
     * Create gradient background
     * @param {Array} colors - Array of color values
     */
    createGradientBackground(colors) {
        // Simple gradient using scene background color
        // For more complex gradients, would need custom shader or skybox
        const primaryColor = new THREE.Color(colors[0]);
        this.scene.background = primaryColor;
    }
    
    /**
     * Create starfield background
     * @param {Array} colors - Array of color values
     */
    createStarfieldBackground(colors) {
        // Create simple starfield with points
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 1000;
        const positions = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 2000;     // x
            positions[i + 1] = (Math.random() - 0.5) * 2000; // y
            positions[i + 2] = (Math.random() - 0.5) * 2000; // z
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const starMaterial = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 2,
            transparent: true,
            opacity: 0.8
        });
        
        const stars = new THREE.Points(starGeometry, starMaterial);
        if (this.scene && typeof this.scene.add === 'function') {
            this.scene.add(stars);
        }
        this.themeElements.backgroundElements.push(stars);
        
        // Set dark background
        this.scene.background = new THREE.Color(colors[0]);
    }
    
    /**
     * Create circuit pattern background
     * @param {Array} colors - Array of color values
     */
    createCircuitBackground(colors) {
        // Simple circuit-like lines (simplified implementation)
        const lineGeometry = new THREE.BufferGeometry();
        const lineCount = 50;
        const positions = [];
        
        for (let i = 0; i < lineCount; i++) {
            // Create random circuit-like lines
            const startX = (Math.random() - 0.5) * 100;
            const startZ = (Math.random() - 0.5) * 100;
            const endX = startX + (Math.random() - 0.5) * 20;
            const endZ = startZ + (Math.random() - 0.5) * 20;
            
            positions.push(startX, -5, startZ);
            positions.push(endX, -5, endZ);
        }
        
        lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x003366,
            opacity: 0.3,
            transparent: true
        });
        
        const circuitLines = new THREE.LineSegments(lineGeometry, lineMaterial);
        if (this.scene && typeof this.scene.add === 'function') {
            this.scene.add(circuitLines);
        }
        this.themeElements.backgroundElements.push(circuitLines);
        
        // Set dark background
        this.scene.background = new THREE.Color(colors[0]);
    }
    
    /**
     * Create solid color background
     * @param {number} color - Color value
     */
    createSolidBackground(color) {
        this.scene.background = new THREE.Color(color);
    }
    
    /**
     * Update lighting based on theme
     * @param {Object} themeConfig - Theme configuration
     */
    updateLighting(themeConfig) {
        const lightingConfig = themeConfig.lighting;
        
        // Find existing lights or create new ones
        let ambientLight = null;
        let directionalLight = null;
        
        // Check if scene has traverse method (might not exist in test environments)
        if (this.scene && typeof this.scene.traverse === 'function') {
            this.scene.traverse((child) => {
                if (child.isAmbientLight) {
                    ambientLight = child;
                } else if (child.isDirectionalLight) {
                    directionalLight = child;
                }
            });
        }
        
        // Update or create ambient light
        if (ambientLight) {
            if (ambientLight.color && typeof ambientLight.color.setHex === 'function') {
                ambientLight.color.setHex(lightingConfig.ambient.color);
            }
            ambientLight.intensity = lightingConfig.ambient.intensity;
        } else {
            ambientLight = new THREE.AmbientLight(
                lightingConfig.ambient.color,
                lightingConfig.ambient.intensity
            );
            if (this.scene && typeof this.scene.add === 'function') {
                this.scene.add(ambientLight);
            }
        }
        this.themeElements.ambientLight = ambientLight;
        
        // Update or create directional light
        if (directionalLight) {
            if (directionalLight.color && typeof directionalLight.color.setHex === 'function') {
                directionalLight.color.setHex(lightingConfig.directional.color);
            }
            directionalLight.intensity = lightingConfig.directional.intensity;
        } else {
            directionalLight = new THREE.DirectionalLight(
                lightingConfig.directional.color,
                lightingConfig.directional.intensity
            );
            if (directionalLight.position && typeof directionalLight.position.set === 'function') {
                directionalLight.position.set(10, 20, 10);
            }
            if (this.scene && typeof this.scene.add === 'function') {
                this.scene.add(directionalLight);
            }
        }
        this.themeElements.directionalLight = directionalLight;
    }
    
    /**
     * Clean up current theme elements
     */
    cleanupCurrentTheme() {
        // Remove background elements
        this.themeElements.backgroundElements.forEach(element => {
            if (this.scene && typeof this.scene.remove === 'function') {
                this.scene.remove(element);
            }
            if (element.geometry) element.geometry.dispose();
            if (element.material) element.material.dispose();
        });
        this.themeElements.backgroundElements = [];
        
        // Note: We don't remove grid and lighting elements as they are core to the game
        // Instead, we update them in place to avoid disrupting the game state
    }
    
    /**
     * Get current theme name
     * @returns {string} Current theme name
     */
    getCurrentTheme() {
        return this.currentTheme;
    }
    
    /**
     * Reset to default theme
     */
    resetToDefault() {
        this.loadTheme('classic-grid');
    }
}

module.exports = { ThemeEngine };