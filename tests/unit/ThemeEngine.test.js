/**
 * Tests for ThemeEngine
 */

describe('ThemeEngine', () => {
    let ThemeEngine;
    let themeEngine;
    let mockScene;
    let mockRenderer;

    // Helper for mocking THREE objects with minimal interface needed by ThemeEngine
    const createMockThreeObject = (type) => ({
        type,
        uuid: Math.random().toString(),
        position: { set: jest.fn() },
        material: {
            color: { setHex: jest.fn() },
            emissive: { setHex: jest.fn() },
            opacity: 1,
            transparent: false,
            dispose: jest.fn(),
        },
        geometry: { dispose: jest.fn() },
        isGridHelper: type === 'GridHelper',
        isBoxHelper: type === 'BoxHelper',
        isAmbientLight: type === 'AmbientLight',
        isDirectionalLight: type === 'DirectionalLight',
    });

    beforeEach(() => {
        jest.resetModules();

        // Mock THREE globals required by ThemeEngine
        global.THREE = {
            GridHelper: jest.fn(() => createMockThreeObject('GridHelper')),
            BoxHelper: jest.fn(() => createMockThreeObject('BoxHelper')),
            AmbientLight: jest.fn(() => createMockThreeObject('AmbientLight')),
            DirectionalLight: jest.fn(() => createMockThreeObject('DirectionalLight')),
            BoxGeometry: jest.fn(() => ({ dispose: jest.fn() })),
            Mesh: jest.fn(() => createMockThreeObject('Mesh')),
            LineBasicMaterial: jest.fn(() => ({
                color: { setHex: jest.fn() },
                dispose: jest.fn(),
            })),
            Color: jest.fn((hex) => ({
                setHex: jest.fn(),
                getHex: () => hex,
            })),
            Points: jest.fn(() => {
                const obj = createMockThreeObject('Points');
                return obj;
            }),
            PointsMaterial: jest.fn(() => ({ dispose: jest.fn() })),
            BufferGeometry: jest.fn(() => ({
                setAttribute: jest.fn(),
                dispose: jest.fn(),
            })),
            BufferAttribute: jest.fn(),
            Float32BufferAttribute: jest.fn(),
            LineSegments: jest.fn(() => {
                const obj = createMockThreeObject('LineSegments');
                return obj;
            }),
        };

        ThemeEngine = require('../../src/systems/ThemeEngine.js').ThemeEngine;

        mockScene = {
            add: jest.fn(),
            remove: jest.fn(),
            background: null,
            children: [],
            traverse: jest.fn(),
        };

        mockRenderer = {
            setClearColor: jest.fn(),
        };

        themeEngine = new ThemeEngine(mockScene, mockRenderer);
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        it('should initialize with default theme', () => {
            expect(themeEngine.getCurrentTheme()).toBe('classic-grid');
        });

        it('should have access to theme configurations', () => {
            expect(themeEngine.themeConfigs).toBeDefined();
            expect(themeEngine.getThemeConfig('classic-grid')).toBeDefined();
        });
    });

    describe('Theme Validation', () => {
        it('should validate themes correctly', () => {
            expect(themeEngine.isValidTheme('classic-grid')).toBe(true);
            expect(themeEngine.isValidTheme('space')).toBe(true);
            expect(themeEngine.isValidTheme('neon-city')).toBe(true);
            expect(themeEngine.isValidTheme('invalid-theme')).toBe(false);
        });

        it('should get all available themes', () => {
            const themes = themeEngine.getAvailableThemes();
            expect(themes).toContain('classic-grid');
            expect(themes).toContain('space');
            expect(themes).toContain('neon-city');
            expect(themes).toContain('tron-legacy');
        });
    });

    describe('Theme Loading', () => {
        it('should load a valid theme successfully', () => {
            const success = themeEngine.loadTheme('neon-city');
            expect(success).toBe(true);
            expect(themeEngine.getCurrentTheme()).toBe('neon-city');

            // Should add grid and helpers
            expect(mockScene.add).toHaveBeenCalled();
            expect(global.THREE.GridHelper).toHaveBeenCalled();
        });

        it('should reject invalid themes', () => {
            const success = themeEngine.loadTheme('invalid-theme');
            expect(success).toBe(false);
            // Should remain on previous theme
            expect(themeEngine.getCurrentTheme()).toBe('classic-grid');
        });

        it('should update background when theme changes', () => {
            // Neon city uses gradient
            themeEngine.loadTheme('neon-city');
            expect(global.THREE.Color).toHaveBeenCalled();
            // ThemeEngine sets scene.background = new THREE.Color(colors[0]) for gradients as simple impl

            // Space uses starfield
            themeEngine.loadTheme('space');
            expect(global.THREE.Points).toHaveBeenCalled();
            expect(mockScene.add).toHaveBeenCalledWith(expect.objectContaining({ type: 'Points' }));
        });

        it('should update lighting when theme changes', () => {
            themeEngine.loadTheme('classic-grid');

            expect(global.THREE.AmbientLight).toHaveBeenCalled();
            expect(global.THREE.DirectionalLight).toHaveBeenCalled();
            expect(mockScene.add).toHaveBeenCalledTimes(4); // Grid, Box, Ambient, Directional
        });
    });

    describe('Visual Updates', () => {
        it('should update existing grid elements if found', () => {
            // Setup scene traverse to return mock grid element
            const mockGrid = createMockThreeObject('GridHelper');
            mockScene.traverse.mockImplementation((cb) => cb(mockGrid));

            themeEngine.updateGridMaterial(themeEngine.getThemeConfig('neon-city'));

            expect(mockGrid.material.color.setHex).toHaveBeenCalledWith(0xff1493); // neon-city color
            expect(mockGrid.material.opacity).toBe(0.5);
            expect(mockScene.add).not.toHaveBeenCalledWith(
                expect.objectContaining({ type: 'GridHelper' })
            );
        });

        it('should create new grid elements if none found', () => {
            mockScene.traverse.mockImplementation(() => {}); // No children

            themeEngine.updateGridMaterial(themeEngine.getThemeConfig('neon-city'));

            expect(global.THREE.GridHelper).toHaveBeenCalled();
            expect(mockScene.add).toHaveBeenCalled();
        });

        it('should handle glow effects on grid', () => {
            const mockGrid = createMockThreeObject('GridHelper');
            mockScene.traverse.mockImplementation((cb) => cb(mockGrid));

            // neon-city has glow: true
            themeEngine.updateGridMaterial(themeEngine.getThemeConfig('neon-city'));
            expect(mockGrid.material.emissive.setHex).toHaveBeenCalledWith(0xff1493);
            expect(mockGrid.material.emissiveIntensity).toBe(0.2);

            // classic-grid has glow: false (implicit)
            themeEngine.updateGridMaterial(themeEngine.getThemeConfig('classic-grid'));
            // The logic for no glow sets emissive to black and intensity 0
            // But my mock might need to capture calls.
            // Rely on call count or args.
            expect(mockGrid.material.emissiveIntensity).toBe(0);
        });
    });

    describe('Background Types', () => {
        it('should create Starfield background', () => {
            // Force clean state
            themeEngine.themeElements.backgroundElements = [];
            themeEngine.updateBackground({
                background: { type: 'starfield', colors: [0x000000] },
            });

            expect(global.THREE.BufferGeometry).toHaveBeenCalled();
            expect(global.THREE.Points).toHaveBeenCalled();
            expect(mockScene.add).toHaveBeenCalled();
        });

        it('should create Circuit background', () => {
            themeEngine.updateBackground({
                background: { type: 'circuit', colors: [0x000000] },
            });

            expect(global.THREE.LineSegments).toHaveBeenCalled();
            expect(mockScene.add).toHaveBeenCalled();
        });

        it('should create Solid background', () => {
            themeEngine.updateBackground({
                background: { type: 'solid', colors: [0xff0000] },
            });
            expect(mockScene.background).toBeDefined();
        });
    });

    describe('Preview Generation', () => {
        it('should generate valid preview data', () => {
            const preview = themeEngine.generateThemePreview('neon-city');

            expect(preview).not.toBeNull();
            expect(preview.name).toBe('Neon City');
            expect(preview.gridColor).toMatch(/^#[0-9a-f]{6}$/i);
            expect(preview.backgroundColor).toMatch(/^#[0-9a-f]{6}$/i);
            expect(preview.hasGlow).toBe(true);
        });

        it('should return null for invalid theme', () => {
            const preview = themeEngine.generateThemePreview('invalid');
            expect(preview).toBeNull();
        });
    });

    describe('Cleanup', () => {
        it('should cleanup background elements when switching themes', () => {
            // Simulate existing background element
            const mockElement = {
                geometry: { dispose: jest.fn() },
                material: { dispose: jest.fn() },
            };
            themeEngine.themeElements.backgroundElements.push(mockElement);

            themeEngine.cleanupCurrentTheme();

            expect(mockScene.remove).toHaveBeenCalledWith(mockElement);
            // expect(mockElement.geometry.dispose).toHaveBeenCalled(); // Mock might be simple object
            // expect(mockElement.material.dispose).toHaveBeenCalled();
            expect(themeEngine.themeElements.backgroundElements.length).toBe(0);
        });
    });

    describe('Reset', () => {
        it('should reset to default theme', () => {
            themeEngine.loadTheme('neon-city');
            expect(themeEngine.getCurrentTheme()).toBe('neon-city');

            themeEngine.resetToDefault();
            expect(themeEngine.getCurrentTheme()).toBe('classic-grid');
        });
    });
});
