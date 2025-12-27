const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
};

const MockLoggerClass = jest.fn().mockImplementation(() => mockLogger);
MockLoggerClass.create = jest.fn((namespace) => mockLogger);

jest.mock('@/utils/Logger.js', () => ({
    Logger: MockLoggerClass,
    logger: mockLogger,
    createLogger: jest.fn(() => mockLogger),
}));

const { ThemeEngine } = require('@/systems/ThemeEngine.js');

// Mock Three.js objects
const mockScene = {
    background: null,
    add: jest.fn(),
    remove: jest.fn(),
    traverse: jest.fn(),
};

const mockRenderer = {};

// Mock Three.js constructors
global.THREE = {
    MeshBasicMaterial: jest.fn().mockImplementation(() => ({})),
    MeshLambertMaterial: jest.fn().mockImplementation(() => ({})),
    SphereGeometry: jest.fn().mockImplementation(() => ({})),
    Color: jest.fn().mockImplementation((color) => ({
        setHex: jest.fn(),
    })),
    GridHelper: jest.fn().mockImplementation(() => ({
        material: {
            color: { setHex: jest.fn() },
            opacity: 0.3,
            transparent: true,
            emissive: { setHex: jest.fn() },
            emissiveIntensity: 0,
        },
    })),
    BoxHelper: jest.fn().mockImplementation(() => ({
        material: {
            color: 0x00ffff,
            opacity: 0.3,
            transparent: true,
        },
    })),
    BoxGeometry: jest.fn(),
    LineBasicMaterial: jest.fn(),
    Mesh: jest.fn(),
    AmbientLight: jest.fn().mockImplementation((color, intensity) => ({
        color: { setHex: jest.fn() },
        intensity: intensity,
        isAmbientLight: true,
    })),
    DirectionalLight: jest.fn().mockImplementation((color, intensity) => ({
        color: { setHex: jest.fn() },
        intensity: intensity,
        position: { set: jest.fn() },
        isDirectionalLight: true,
    })),
    BufferGeometry: jest.fn().mockImplementation(() => ({
        setAttribute: jest.fn(),
        dispose: jest.fn(),
    })),
    Float32BufferAttribute: jest.fn(),
    BufferAttribute: jest.fn(),
    PointsMaterial: jest.fn(),
    Points: jest.fn(),
    LineSegments: jest.fn(),
};

describe('ThemeEngine', () => {
    let themeEngine;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        mockScene.background = null;

        // Create fresh instance
        themeEngine = new ThemeEngine(mockScene, mockRenderer);
    });

    describe('constructor', () => {
        it('should initialize with default theme', () => {
            expect(themeEngine.currentTheme).toBe('classic-grid');
            expect(themeEngine.scene).toBe(mockScene);
            expect(themeEngine.renderer).toBe(mockRenderer);
        });

        it('should have all required theme configurations', () => {
            const themes = ['classic-grid', 'neon-city', 'space', 'tron-legacy'];

            themes.forEach((theme) => {
                expect(themeEngine.themeConfigs[theme]).toBeDefined();
                expect(themeEngine.themeConfigs[theme].name).toBeDefined();
                expect(themeEngine.themeConfigs[theme].grid).toBeDefined();
                expect(themeEngine.themeConfigs[theme].background).toBeDefined();
                expect(themeEngine.themeConfigs[theme].lighting).toBeDefined();
            });
        });
    });

    describe('loadTheme', () => {
        it('should load valid theme successfully', () => {
            const result = themeEngine.loadTheme('neon-city');

            expect(result).toBe(true);
            expect(themeEngine.currentTheme).toBe('neon-city');
        });

        it('should reject invalid theme name', () => {
            const result = themeEngine.loadTheme('invalid-theme');

            expect(result).toBe(false);
            expect(themeEngine.currentTheme).toBe('classic-grid'); // Should remain unchanged
        });

        it('should update scene elements when loading theme', () => {
            themeEngine.loadTheme('space');

            // Should have called scene methods to update elements
            expect(mockScene.add).toHaveBeenCalled();
        });

        it('should fallback to classic theme on error', () => {
            // Mock an error during theme loading
            const originalUpdateGrid = themeEngine.updateGridMaterial;
            themeEngine.updateGridMaterial = jest.fn().mockImplementation(() => {
                throw new Error('Theme loading error');
            });

            const result = themeEngine.loadTheme('neon-city');

            expect(result).toBe(false);
            // Should attempt to load classic-grid as fallback

            // Restore original method
            themeEngine.updateGridMaterial = originalUpdateGrid;
        });
    });

    describe('theme validation', () => {
        it('should validate correct theme names', () => {
            expect(themeEngine.isValidTheme('classic-grid')).toBe(true);
            expect(themeEngine.isValidTheme('neon-city')).toBe(true);
            expect(themeEngine.isValidTheme('space')).toBe(true);
            expect(themeEngine.isValidTheme('tron-legacy')).toBe(true);
        });

        it('should reject invalid theme names', () => {
            expect(themeEngine.isValidTheme('invalid-theme')).toBe(false);
            expect(themeEngine.isValidTheme('')).toBe(false);
            expect(themeEngine.isValidTheme(null)).toBe(false);
            expect(themeEngine.isValidTheme(undefined)).toBe(false);
        });
    });

    describe('getAvailableThemes', () => {
        it('should return all available theme names', () => {
            const themes = themeEngine.getAvailableThemes();

            expect(themes).toContain('classic-grid');
            expect(themes).toContain('neon-city');
            expect(themes).toContain('space');
            expect(themes).toContain('tron-legacy');
            expect(themes.length).toBe(4);
        });
    });

    describe('getThemeConfig', () => {
        it('should return theme configuration for valid theme', () => {
            const config = themeEngine.getThemeConfig('neon-city');

            expect(config).toBeDefined();
            expect(config.name).toBe('Neon City');
            expect(config.grid.color).toBe(0xff1493);
            expect(config.grid.glow).toBe(true);
        });

        it('should return null for invalid theme', () => {
            const config = themeEngine.getThemeConfig('invalid-theme');

            expect(config).toBeNull();
        });
    });

    describe('generateThemePreview', () => {
        it('should generate preview data for valid theme', () => {
            const preview = themeEngine.generateThemePreview('space');

            expect(preview).toBeDefined();
            expect(preview.name).toBe('Space');
            expect(preview.gridColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
            expect(preview.backgroundColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
            expect(preview.lightingColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
            expect(preview.hasGlow).toBe(false);
        });

        it('should return null for invalid theme', () => {
            const preview = themeEngine.generateThemePreview('invalid-theme');

            expect(preview).toBeNull();
        });

        it('should indicate glow effect for themes that have it', () => {
            const neonPreview = themeEngine.generateThemePreview('neon-city');
            const tronPreview = themeEngine.generateThemePreview('tron-legacy');
            const classicPreview = themeEngine.generateThemePreview('classic-grid');

            expect(neonPreview.hasGlow).toBe(true);
            expect(tronPreview.hasGlow).toBe(true);
            expect(classicPreview.hasGlow).toBe(false);
        });
    });

    describe('updateGridMaterial', () => {
        it('should update existing grid elements', () => {
            const mockGridElement = {
                isGridHelper: true,
                material: {
                    color: { setHex: jest.fn() },
                    opacity: 0.3,
                    transparent: true,
                    emissive: { setHex: jest.fn() },
                    emissiveIntensity: 0,
                },
            };

            mockScene.traverse.mockImplementation((callback) => {
                callback(mockGridElement);
            });

            const themeConfig = themeEngine.themeConfigs['neon-city'];
            themeEngine.updateGridMaterial(themeConfig);

            expect(mockGridElement.material.color.setHex).toHaveBeenCalledWith(0xff1493);
            expect(mockGridElement.material.opacity).toBe(0.5);
            expect(mockGridElement.material.emissive.setHex).toHaveBeenCalledWith(0xff1493);
            expect(mockGridElement.material.emissiveIntensity).toBe(0.2);
        });

        it('should create new grid elements if none exist', () => {
            mockScene.traverse.mockImplementation((callback) => {
                // No existing grid elements
            });

            const themeConfig = themeEngine.themeConfigs['classic-grid'];
            themeEngine.updateGridMaterial(themeConfig);

            expect(THREE.GridHelper).toHaveBeenCalled();
            expect(THREE.BoxHelper).toHaveBeenCalled();
            expect(mockScene.add).toHaveBeenCalledTimes(2); // Grid and box helper
        });
    });

    describe('updateBackground', () => {
        it('should create gradient background', () => {
            const themeConfig = themeEngine.themeConfigs['classic-grid'];
            themeEngine.updateBackground(themeConfig);

            expect(THREE.Color).toHaveBeenCalled();
            expect(mockScene.background).toBeDefined();
        });

        it('should create starfield background', () => {
            const themeConfig = themeEngine.themeConfigs['space'];
            themeEngine.updateBackground(themeConfig);

            expect(THREE.BufferGeometry).toHaveBeenCalled();
            expect(THREE.PointsMaterial).toHaveBeenCalled();
            expect(mockScene.add).toHaveBeenCalled();
        });

        it('should create circuit background', () => {
            const themeConfig = themeEngine.themeConfigs['tron-legacy'];
            themeEngine.updateBackground(themeConfig);

            expect(THREE.BufferGeometry).toHaveBeenCalled();
            expect(THREE.LineBasicMaterial).toHaveBeenCalled();
            expect(mockScene.add).toHaveBeenCalled();
        });
    });

    describe('updateLighting', () => {
        it('should update existing lights', () => {
            const mockAmbientLight = {
                isAmbientLight: true,
                color: { setHex: jest.fn() },
                intensity: 0.6,
            };

            const mockDirectionalLight = {
                isDirectionalLight: true,
                color: { setHex: jest.fn() },
                intensity: 0.8,
            };

            mockScene.traverse.mockImplementation((callback) => {
                callback(mockAmbientLight);
                callback(mockDirectionalLight);
            });

            const themeConfig = themeEngine.themeConfigs['neon-city'];
            themeEngine.updateLighting(themeConfig);

            expect(mockAmbientLight.color.setHex).toHaveBeenCalledWith(0xff1493);
            expect(mockAmbientLight.intensity).toBe(0.4);
            expect(mockDirectionalLight.color.setHex).toHaveBeenCalledWith(0xff69b4);
            expect(mockDirectionalLight.intensity).toBe(0.6);
        });

        it('should create new lights if none exist', () => {
            mockScene.traverse.mockImplementation((callback) => {
                // No existing lights
            });

            const themeConfig = themeEngine.themeConfigs['space'];
            themeEngine.updateLighting(themeConfig);

            expect(THREE.AmbientLight).toHaveBeenCalledWith(0x4444ff, 0.3);
            expect(THREE.DirectionalLight).toHaveBeenCalledWith(0x6666ff, 0.5);
            expect(mockScene.add).toHaveBeenCalledTimes(2); // Ambient and directional lights
        });
    });

    describe('cleanup', () => {
        it('should clean up background elements', () => {
            // Add some background elements
            const mockElement = {
                geometry: { dispose: jest.fn() },
                material: { dispose: jest.fn() },
            };
            themeEngine.themeElements.backgroundElements.push(mockElement);

            themeEngine.cleanupCurrentTheme();

            expect(mockScene.remove).toHaveBeenCalledWith(mockElement);
            expect(mockElement.geometry.dispose).toHaveBeenCalled();
            expect(mockElement.material.dispose).toHaveBeenCalled();
            expect(themeEngine.themeElements.backgroundElements).toHaveLength(0);
        });
    });

    describe('utility methods', () => {
        it('should return current theme name', () => {
            themeEngine.loadTheme('space');

            expect(themeEngine.getCurrentTheme()).toBe('space');
        });

        it('should reset to default theme', () => {
            themeEngine.loadTheme('neon-city');
            themeEngine.resetToDefault();

            expect(themeEngine.getCurrentTheme()).toBe('classic-grid');
        });
    });

    describe('theme configurations', () => {
        it('should have valid color values for all themes', () => {
            Object.values(themeEngine.themeConfigs).forEach((config) => {
                expect(typeof config.grid.color).toBe('number');
                expect(config.grid.color).toBeGreaterThanOrEqual(0);
                expect(config.grid.color).toBeLessThanOrEqual(0xffffff);

                expect(typeof config.lighting.ambient.color).toBe('number');
                expect(typeof config.lighting.directional.color).toBe('number');
            });
        });

        it('should have valid opacity values for all themes', () => {
            Object.values(themeEngine.themeConfigs).forEach((config) => {
                expect(config.grid.opacity).toBeGreaterThanOrEqual(0);
                expect(config.grid.opacity).toBeLessThanOrEqual(1);

                expect(config.lighting.ambient.intensity).toBeGreaterThanOrEqual(0);
                expect(config.lighting.directional.intensity).toBeGreaterThanOrEqual(0);
            });
        });

        it('should have valid background configurations', () => {
            Object.values(themeEngine.themeConfigs).forEach((config) => {
                expect(config.background.type).toBeDefined();
                expect(Array.isArray(config.background.colors)).toBe(true);
                expect(config.background.colors.length).toBeGreaterThan(0);
            });
        });
    });
});

describe('performance optimization integration', () => {
    let themeEngineWithOptimizer;
    let mockPerformanceOptimizer;

    beforeEach(() => {
        mockPerformanceOptimizer = {
            getSharedGeometry: jest.fn().mockReturnValue({ dispose: jest.fn() }),
            getOrCreateThemeMaterial: jest.fn().mockReturnValue({
                color: 0x00ffff,
                opacity: 0.3,
                transparent: true,
                dispose: jest.fn(),
            }),
        };

        themeEngineWithOptimizer = new ThemeEngine(
            mockScene,
            mockRenderer,
            mockPerformanceOptimizer
        );
    });

    it('should use performance optimizer for shared geometry', () => {
        mockScene.traverse.mockImplementation((callback) => {
            // No existing grid elements
        });

        const themeConfig = themeEngineWithOptimizer.themeConfigs['classic-grid'];
        themeEngineWithOptimizer.updateGridMaterial(themeConfig);

        expect(mockPerformanceOptimizer.getSharedGeometry).toHaveBeenCalledWith('bike');
    });

    it('should use performance optimizer for theme materials', () => {
        mockScene.traverse.mockImplementation((callback) => {
            // No existing grid elements
        });

        const themeConfig = themeEngineWithOptimizer.themeConfigs['classic-grid'];
        themeEngineWithOptimizer.updateGridMaterial(themeConfig);

        expect(mockPerformanceOptimizer.getOrCreateThemeMaterial).toHaveBeenCalledWith(
            'classic-grid',
            'grid',
            {
                color: themeConfig.grid.color,
                opacity: themeConfig.grid.opacity,
                transparent: true,
            }
        );
    });

    it('should fallback to standard creation when optimizer not available', () => {
        const themeEngineWithoutOptimizer = new ThemeEngine(mockScene, mockRenderer);

        mockScene.traverse.mockImplementation((callback) => {
            // No existing grid elements
        });

        const themeConfig = themeEngineWithoutOptimizer.themeConfigs['classic-grid'];
        themeEngineWithoutOptimizer.updateGridMaterial(themeConfig);

        expect(THREE.BoxGeometry).toHaveBeenCalled();
        expect(THREE.LineBasicMaterial).toHaveBeenCalled();
    });
});
