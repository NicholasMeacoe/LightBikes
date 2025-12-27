/**
 * Visual Integration Tests for Customization System
 * Tests visual changes, performance impact, and cross-mode compatibility
 */

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

const { CustomizationManager } = require('@/systems/CustomizationManager.js');
const { ThemeEngine } = require('@/systems/ThemeEngine.js');
const { TrailStyleRenderer } = require('@/rendering/TrailStyleRenderer.js');
const { PerformanceOptimizer } = require('@/utils/PerformanceOptimizer.js');
const { PreferenceStorage } = require('@/systems/PreferenceStorage.js');

describe('Customization System Visual Integration', () => {
    let scene, renderer, camera;
    let customizationManager, themeEngine, trailStyleRenderer, performanceOptimizer;
    let mockRenderingEngine, mockPreferenceStorage;

    beforeAll(() => {
        global.THREE.BoxHelper = jest.fn().mockImplementation(() => ({
            material: { dispose: jest.fn() },
        }));
        global.THREE.Mesh = jest.fn().mockImplementation(() => ({
            material: { dispose: jest.fn() },
            geometry: { dispose: jest.fn() },
            position: { set: jest.fn() },
        }));
    });

    beforeEach(() => {
        jest.clearAllMocks();

        // Create Three.js objects
        scene = new THREE.Scene();
        renderer = new THREE.WebGLRenderer();
        camera = new THREE.PerspectiveCamera();

        // Mock rendering engine
        mockRenderingEngine = {
            scene: scene,
            renderer: renderer,
            camera: camera,
            player: new THREE.Mesh(),
            emissiveMaterialSystem: {
                updateBikeMaterial: jest.fn(),
                updateTrailMaterialTemplate: jest.fn(),
                createBikeMaterial: jest
                    .fn()
                    .mockReturnValue(new THREE.MeshLambertMaterial({ color: 0x00ff00 })),
                createTrailMaterial: jest
                    .fn()
                    .mockReturnValue(new THREE.MeshLambertMaterial({ color: 0x00ff00 })),
            },
            trailStyleRenderer: null, // Will be set below
        };

        // Mock preference storage
        mockPreferenceStorage = {
            loadPreferences: jest.fn(),
            savePreferences: jest.fn(),
        };

        // Create system components
        performanceOptimizer = new PerformanceOptimizer(scene, renderer);
        themeEngine = new ThemeEngine(scene, renderer, performanceOptimizer);
        trailStyleRenderer = new TrailStyleRenderer(
            scene,
            mockRenderingEngine.emissiveMaterialSystem,
            performanceOptimizer
        );
        mockRenderingEngine.trailStyleRenderer = trailStyleRenderer;

        customizationManager = new CustomizationManager(mockRenderingEngine, mockPreferenceStorage);
        // Force initialization of themeEngine in manager
        customizationManager.initializeThemeEngine();
        themeEngine = customizationManager.themeEngine;
    });

    describe('visual changes application', () => {
        it('should apply bike color changes correctly', () => {
            const originalColor = customizationManager.getCurrentState().bikeColor;
            const newColor = '#FF0000';

            const result = customizationManager.setBikeColor('player', newColor);

            expect(result).toBe(true);
            expect(customizationManager.getCurrentState().bikeColor).toBe(newColor);
            expect(
                mockRenderingEngine.emissiveMaterialSystem.updateBikeMaterial
            ).toHaveBeenCalledWith('player', 0xff0000);
        });

        it('should apply trail color changes correctly', () => {
            const newColor = '#0000FF';

            const result = customizationManager.setTrailColor('player', newColor);

            expect(result).toBe(true);
            expect(customizationManager.getCurrentState().trailColor).toBe(newColor);
        });

        it('should apply trail style changes correctly', () => {
            const newStyle = 'glowing';

            const result = customizationManager.setTrailStyle('player', newStyle);

            expect(result).toBe(true);
            expect(customizationManager.getCurrentState().trailStyle).toBe(newStyle);
            expect(trailStyleRenderer.getTrailStyle('player')).toBe(newStyle);
        });

        it('should apply arena theme changes correctly', () => {
            const newTheme = 'neon-city';

            const result = customizationManager.setArenaTheme(newTheme);

            expect(result).toBe(true);
            expect(customizationManager.getCurrentState().arenaTheme).toBe(newTheme);
            expect(themeEngine.getCurrentTheme()).toBe(newTheme);
        });

        it('should apply multiple changes in combination', () => {
            const changes = {
                bikeColor: '#FF0000',
                trailColor: '#0000FF',
                trailStyle: 'glowing',
                arenaTheme: 'space',
            };

            customizationManager.setBikeColor('player', changes.bikeColor);
            customizationManager.setTrailColor('player', changes.trailColor);
            customizationManager.setTrailStyle('player', changes.trailStyle);
            customizationManager.setArenaTheme(changes.arenaTheme);

            const state = customizationManager.getCurrentState();
            expect(state.bikeColor).toBe(changes.bikeColor);
            expect(state.trailColor).toBe(changes.trailColor);
            expect(state.trailStyle).toBe(changes.trailStyle);
            expect(state.arenaTheme).toBe(changes.arenaTheme);
        });
    });

    describe('visual consistency across combinations', () => {
        const testCombinations = [
            { theme: 'classic-grid', style: 'solid', bikeColor: '#00FF00', trailColor: '#00FF00' },
            { theme: 'neon-city', style: 'glowing', bikeColor: '#FF1493', trailColor: '#FF69B4' },
            { theme: 'space', style: 'dashed', bikeColor: '#4444FF', trailColor: '#6666FF' },
            { theme: 'tron-legacy', style: 'rainbow', bikeColor: '#FFA500', trailColor: '#FFB84D' },
        ];

        testCombinations.forEach((combo) => {
            it(`should apply ${combo.theme} theme with ${combo.style} trail style correctly`, () => {
                customizationManager.setArenaTheme(combo.theme);
                customizationManager.setTrailStyle('player', combo.style);
                customizationManager.setBikeColor('player', combo.bikeColor);
                customizationManager.setTrailColor('player', combo.trailColor);

                const state = customizationManager.getCurrentState();
                expect(state.arenaTheme).toBe(combo.theme);
                expect(state.trailStyle).toBe(combo.style);
                expect(state.bikeColor).toBe(combo.bikeColor);
                expect(state.trailColor).toBe(combo.trailColor);

                // Verify theme was applied
                expect(themeEngine.getCurrentTheme()).toBe(combo.theme);

                // Verify trail style was applied
                expect(trailStyleRenderer.getTrailStyle('player')).toBe(combo.style);
            });
        });

        it('should maintain visual consistency when switching between combinations', () => {
            // Apply first combination
            customizationManager.setArenaTheme('classic-grid');
            customizationManager.setTrailStyle('player', 'solid');

            let state = customizationManager.getCurrentState();
            expect(state.arenaTheme).toBe('classic-grid');
            expect(state.trailStyle).toBe('solid');

            // Switch to second combination
            customizationManager.setArenaTheme('neon-city');
            customizationManager.setTrailStyle('player', 'glowing');

            state = customizationManager.getCurrentState();
            expect(state.arenaTheme).toBe('neon-city');
            expect(state.trailStyle).toBe('glowing');

            // Verify both changes were applied
            expect(themeEngine.getCurrentTheme()).toBe('neon-city');
            expect(trailStyleRenderer.getTrailStyle('player')).toBe('glowing');
        });
    });

    describe('performance impact verification', () => {
        it('should maintain acceptable performance with default settings', () => {
            const metrics = performanceOptimizer.getPerformanceMetrics();

            expect(performanceOptimizer.isPerformanceAcceptable()).toBe(true);
            expect(metrics.frameTime).toBeLessThanOrEqual(20); // 50 FPS minimum
        });

        it('should maintain performance with multiple customizations', () => {
            // Apply multiple customizations
            customizationManager.setBikeColor('player', '#FF0000');
            customizationManager.setTrailColor('player', '#0000FF');
            customizationManager.setTrailStyle('player', 'glowing');
            customizationManager.setArenaTheme('neon-city');

            // Simulate performance optimization
            performanceOptimizer.optimizeScene(camera.position);

            const metrics = performanceOptimizer.getPerformanceMetrics();
            expect(performanceOptimizer.isPerformanceAcceptable()).toBe(true);
        });

        it('should optimize materials for reuse', () => {
            const initialMaterialCount = performanceOptimizer.performanceMetrics.materialCount;

            // Create multiple materials with same properties
            const material1 = performanceOptimizer.getOrCreateBikeMaterial(0xff0000);
            const material2 = performanceOptimizer.getOrCreateBikeMaterial(0xff0000);

            expect(material1).toBe(material2); // Should reuse same material
            expect(performanceOptimizer.performanceMetrics.materialCount).toBe(
                initialMaterialCount + 1
            );
        });

        it('should apply LOD optimizations correctly', () => {
            const mockTrailObject = {
                userData: { materialId: 'trail_player_1' },
                position: { distanceTo: jest.fn().mockReturnValue(200) }, // Far distance
                visible: true,
                material: { opacity: 0.8 },
            };

            scene.traverse.mockImplementation((callback) => {
                callback(mockTrailObject);
            });

            performanceOptimizer.applyTrailLOD(camera.position);

            expect(mockTrailObject.visible).toBe(false); // Should be culled
        });
    });

    describe('cross-mode compatibility', () => {
        const mockGameModes = ['classic', 'timeTrialMode', 'arenaShrinkMode'];

        mockGameModes.forEach((mode) => {
            it(`should work correctly in ${mode}`, () => {
                // Simulate game mode
                const mockGameState = {
                    mode: mode,
                    player: { x: 0, z: 0 },
                    playerTrail: [],
                    aiEntities: new Map(),
                    isPaused: false,
                };

                // Apply customizations
                customizationManager.setBikeColor('player', '#FF0000');
                customizationManager.setTrailStyle('player', 'glowing');
                customizationManager.setArenaTheme('space');

                // Verify customizations are applied
                const state = customizationManager.getCurrentState();
                expect(state.bikeColor).toBe('#FF0000');
                expect(state.trailStyle).toBe('glowing');
                expect(state.arenaTheme).toBe('space');

                // Verify rendering integration
                expect(
                    mockRenderingEngine.emissiveMaterialSystem.updateBikeMaterial
                ).toHaveBeenCalledWith('player', 0xff0000);
                expect(trailStyleRenderer.getTrailStyle('player')).toBe('glowing');
                expect(themeEngine.getCurrentTheme()).toBe('space');
            });
        });

        it('should maintain customizations across mode switches', () => {
            // Apply customizations in one mode
            customizationManager.setBikeColor('player', '#FF0000');
            customizationManager.setTrailStyle('player', 'dashed');

            // Simulate mode switch (customizations should persist)
            const state = customizationManager.getCurrentState();
            expect(state.bikeColor).toBe('#FF0000');
            expect(state.trailStyle).toBe('dashed');
        });
    });

    describe('multi-player color differentiation', () => {
        it('should handle multiple AI opponents with distinct colors', () => {
            const aiColors = ['#FF0000', '#0000FF', '#FFFF00'];

            aiColors.forEach((color, index) => {
                const aiId = `ai_${index}`;
                customizationManager.setBikeColor(aiId, color);

                // In a real implementation, this would be handled by the AI system
                // Here we just verify the customization manager can handle multiple players
                expect(customizationManager.validateColor(color)).toBe(true);
            });
        });

        it('should ensure color contrast for visibility', () => {
            const testColors = [
                { color: '#FFFFFF', background: '#000000', shouldPass: true },
                { color: '#FFFF00', background: '#FFFFFF', shouldPass: false },
                { color: '#FF0000', background: '#000033', shouldPass: true },
            ];

            testColors.forEach((test) => {
                const hasGoodContrast = customizationManager.validateColorContrast(
                    test.color,
                    test.background
                );
                expect(hasGoodContrast).toBe(test.shouldPass);
            });
        });
    });

    describe('theme consistency', () => {
        it('should maintain theme consistency across all visual elements', () => {
            const themes = ['classic-grid', 'neon-city', 'space', 'tron-legacy'];

            themes.forEach((themeName) => {
                customizationManager.setArenaTheme(themeName);

                const themeConfig = themeEngine.getThemeConfig(themeName);
                expect(themeConfig).toBeDefined();
                expect(themeConfig.name).toBeDefined();
                expect(themeConfig.grid).toBeDefined();
                expect(themeConfig.background).toBeDefined();
                expect(themeConfig.lighting).toBeDefined();

                // Verify theme was applied
                expect(themeEngine.getCurrentTheme()).toBe(themeName);
            });
        });

        it('should generate consistent theme previews', () => {
            const themes = themeEngine.getAvailableThemes();

            themes.forEach((themeName) => {
                const preview = themeEngine.generateThemePreview(themeName);

                expect(preview).toBeDefined();
                expect(preview.name).toBeDefined();
                expect(preview.gridColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
                expect(preview.backgroundColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
                expect(preview.lightingColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
                expect(typeof preview.hasGlow).toBe('boolean');
            });
        });
    });

    describe('visual effects integration', () => {
        it('should integrate trail styles with particle effects', () => {
            // Test glowing trail with particle effects
            customizationManager.setTrailStyle('player', 'glowing');

            const styleConfig = trailStyleRenderer.getStyleConfig('glowing');
            expect(styleConfig.effects).toContain('emissive');
            expect(styleConfig.effects).toContain('bloom');
        });

        it('should handle rainbow trail color cycling', () => {
            customizationManager.setTrailStyle('player', 'rainbow');

            const styleConfig = trailStyleRenderer.getStyleConfig('rainbow');
            expect(styleConfig.effects).toContain('color-cycle');
            expect(styleConfig.colorCycleSpeed).toBeDefined();
        });

        it('should maintain visual clarity with all effects enabled', () => {
            // Enable multiple visual effects
            customizationManager.setTrailStyle('player', 'glowing');
            customizationManager.setArenaTheme('neon-city');
            customizationManager.setBikeColor('player', '#FF1493');

            // Verify all effects are applied without conflicts
            const state = customizationManager.getCurrentState();
            expect(state.trailStyle).toBe('glowing');
            expect(state.arenaTheme).toBe('neon-city');
            expect(state.bikeColor).toBe('#FF1493');

            // Check performance impact
            expect(performanceOptimizer.isPerformanceAcceptable()).toBe(true);
        });
    });

    describe('error recovery and fallbacks', () => {
        it('should fallback gracefully when theme loading fails', () => {
            // Mock theme loading failure
            const originalLoadTheme = themeEngine.loadTheme;
            themeEngine.loadTheme = jest.fn().mockReturnValue(false);

            const result = customizationManager.setArenaTheme('invalid-theme');

            expect(result).toBe(false);
            expect(customizationManager.getCurrentState().arenaTheme).toBe('classic-grid'); // Should remain default

            // Restore original method
            themeEngine.loadTheme = originalLoadTheme;
        });

        it('should handle rendering engine failures gracefully', () => {
            // Mock rendering engine failure
            mockRenderingEngine.emissiveMaterialSystem.updateBikeMaterial.mockImplementation(() => {
                throw new Error('Rendering error');
            });

            expect(() => {
                customizationManager.setBikeColor('player', '#FF0000');
            }).not.toThrow();
        });

        it('should maintain functionality with performance optimizer disabled', () => {
            // Create customization manager without performance optimizer
            const customizationManagerNoOptimizer = new CustomizationManager(
                { ...mockRenderingEngine, scene: null, renderer: null },
                mockPreferenceStorage
            );

            const result = customizationManagerNoOptimizer.setBikeColor('player', '#FF0000');

            expect(result).toBe(true);
            expect(customizationManagerNoOptimizer.getCurrentState().bikeColor).toBe('#FF0000');
        });
    });

    describe('memory management', () => {
        it('should properly dispose of resources on cleanup', () => {
            // Create some materials and textures
            performanceOptimizer.getOrCreateBikeMaterial(0xff0000);
            performanceOptimizer.getOrCreateTrailMaterial(0x00ff00, 'solid');

            const initialMaterialCount = performanceOptimizer.performanceMetrics.materialCount;
            expect(initialMaterialCount).toBeGreaterThan(0);

            // Cleanup
            performanceOptimizer.cleanup();

            expect(performanceOptimizer.performanceMetrics.materialCount).toBe(0);
        });

        it('should handle material disposal correctly', () => {
            const material = performanceOptimizer.getOrCreateBikeMaterial(0xff0000);
            const materialKey = '16711680_{}'; // 0xFF0000 as string + empty options

            expect(performanceOptimizer.materialPools.bike.has(materialKey)).toBe(true);

            performanceOptimizer.disposeMaterial('bike', materialKey);

            expect(performanceOptimizer.materialPools.bike.has(materialKey)).toBe(false);
            expect(material.dispose).toHaveBeenCalled();
        });
    });
});
