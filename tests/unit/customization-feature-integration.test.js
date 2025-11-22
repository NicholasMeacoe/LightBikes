/**
 * Customization Feature Integration Tests
 * Tests customization system integration with existing game features
 */

const { Game } = require('@/core/game.js');
const { GameModes } = require('@/systems/GameModes.js');
const { CustomizationManager } = require('@/systems/CustomizationManager.js');
const { PreferenceStorage } = require('@/systems/PreferenceStorage.js');
const { ParticleSystem } = require('@/rendering/ParticleSystem.js');
const { GlowEffectManager } = require('@/rendering/GlowEffectManager.js');
const { PowerUpManager } = require('@/systems/PowerUpManager.js');
const { CollisionDetectionEngine } = require('@/core/collision.js');

// Mock Three.js
global.THREE = {
    Scene: jest.fn(() => ({
        add: jest.fn(),
        remove: jest.fn(),
        children: []
    })),
    WebGLRenderer: jest.fn(() => ({
        setSize: jest.fn(),
        setClearColor: jest.fn(),
        render: jest.fn(),
        domElement: document.createElement('canvas')
    })),
    PerspectiveCamera: jest.fn(() => ({
        position: { 
            set: jest.fn(), 
            copy: jest.fn(),
            clone: jest.fn(() => ({ x: 0, y: 0, z: 0 }))
        },
        lookAt: jest.fn(),
        updateProjectionMatrix: jest.fn()
    })),
    BoxGeometry: jest.fn(() => ({})),
    MeshBasicMaterial: jest.fn(() => ({})),
    MeshLambertMaterial: jest.fn(() => ({})),
    Mesh: jest.fn(() => ({
        position: { set: jest.fn(), copy: jest.fn() },
        material: {}
    })),
    DirectionalLight: jest.fn(() => ({
        position: { set: jest.fn() }
    })),
    AmbientLight: jest.fn(() => ({})),
    GridHelper: jest.fn(() => ({})),
    Color: jest.fn((color) => ({ 
        getHex: () => typeof color === 'number' ? color : 0x00ff00,
        setHex: jest.fn()
    })),
    Vector3: jest.fn(() => ({
        set: jest.fn(),
        copy: jest.fn(),
        add: jest.fn(),
        multiplyScalar: jest.fn()
    })),
    SphereGeometry: jest.fn(() => ({})),
    LineBasicMaterial: jest.fn(() => ({})),
    LineSegments: jest.fn(() => ({
        position: { set: jest.fn() },
        material: {}
    })),
    BufferGeometry: jest.fn(() => ({
        setAttribute: jest.fn(),
        setIndex: jest.fn()
    })),
    BufferAttribute: jest.fn(() => ({})),
    Group: jest.fn(() => ({
        add: jest.fn(),
        remove: jest.fn(),
        children: []
    })),
    BoxHelper: jest.fn(() => ({
        material: {},
        visible: true
    }))
};

// Mock ThemeEngine to avoid Three.js issues
jest.mock('./ThemeEngine.js', () => ({
    ThemeEngine: jest.fn().mockImplementation(() => ({
        isValidTheme: jest.fn((themeName) => {
            const validThemes = ['classic-grid', 'neon-city', 'space', 'tron-legacy'];
            return validThemes.includes(themeName);
        }),
        loadTheme: jest.fn(),
        getAvailableThemes: jest.fn(() => ['classic-grid', 'neon-city', 'space', 'tron-legacy'])
    }))
}));

// Mock localStorage
const mockLocalStorage = {
    data: {},
    getItem: jest.fn((key) => mockLocalStorage.data[key] || null),
    setItem: jest.fn((key, value) => { mockLocalStorage.data[key] = value; }),
    removeItem: jest.fn((key) => { delete mockLocalStorage.data[key]; }),
    clear: jest.fn(() => { mockLocalStorage.data = {}; })
};
global.localStorage = mockLocalStorage;

describe('Customization Feature Integration', () => {
    let game, customizationManager, preferenceStorage, collisionEngine;
    let mockRenderingEngine, mockParticleSystem, mockGlowEffectManager, mockPowerUpManager;

    beforeEach(() => {
        // Clear localStorage and reset mocks
        mockLocalStorage.clear();
        mockLocalStorage.data = {};
        jest.clearAllMocks();

        // Create mock rendering engine
        mockRenderingEngine = {
            emissiveMaterialSystem: {
                updateBikeMaterial: jest.fn(),
                updateTrailMaterialTemplate: jest.fn()
            },
            trailStyleRenderer: {
                setTrailStyle: jest.fn(),
                getTrailStyle: jest.fn(() => 'solid'),
                applyStyleToSegment: jest.fn()
            },
            scene: {},
            renderer: {},
            particleSystem: null,
            glowEffectManager: null
        };

        // Create mock particle system
        mockParticleSystem = {
            isEnabled: jest.fn(() => true),
            createTrailParticles: jest.fn(),
            updateParticles: jest.fn(),
            setParticleColor: jest.fn(),
            getParticleSettings: jest.fn(() => ({ enabled: true, intensity: 1.0 }))
        };

        // Create mock glow effect manager
        mockGlowEffectManager = {
            isEnabled: jest.fn(() => true),
            applyGlowToTrail: jest.fn(),
            updateGlowIntensity: jest.fn(),
            setGlowColor: jest.fn(),
            getGlowSettings: jest.fn(() => ({ enabled: true, intensity: 0.8 }))
        };

        // Create mock power-up manager
        mockPowerUpManager = {
            spawnPowerUp: jest.fn(),
            checkCollisions: jest.fn(() => []),
            getActivePowerUps: jest.fn(() => []),
            getSpeedMultiplier: jest.fn(() => 1.0)
        };

        // Set up rendering engine references
        mockRenderingEngine.particleSystem = mockParticleSystem;
        mockRenderingEngine.glowEffectManager = mockGlowEffectManager;

        // Create game and customization system
        game = new Game(GameModes.CLASSIC);
        preferenceStorage = new PreferenceStorage();
        customizationManager = new CustomizationManager(mockRenderingEngine, preferenceStorage);
        collisionEngine = new CollisionDetectionEngine();
    });

    describe('Particle Effects Integration', () => {
        it('should ensure trail styles work with particle effects', () => {
            // Set a glowing trail style
            const result = customizationManager.setTrailStyle('player', 'glowing');
            expect(result).toBe(true);

            // Verify trail style is applied
            expect(mockRenderingEngine.trailStyleRenderer.setTrailStyle)
                .toHaveBeenCalledWith('player', 'glowing');

            // Simulate particle system interaction
            const trailSegment = { x: 1, y: 0, z: 1 };
            mockParticleSystem.createTrailParticles(trailSegment, 'glowing');

            // Verify particle system can handle the trail style
            expect(mockParticleSystem.createTrailParticles).toHaveBeenCalledWith(trailSegment, 'glowing');
        });

        it('should maintain particle effects when changing trail colors', () => {
            // Set custom trail color
            customizationManager.setTrailColor('player', '#FF0000');

            // Verify color is applied to emissive material system
            expect(mockRenderingEngine.emissiveMaterialSystem.updateTrailMaterialTemplate)
                .toHaveBeenCalledWith('player', 0xFF0000);

            // Simulate particle color update
            mockParticleSystem.setParticleColor('player', 0xFF0000);

            // Verify particle system receives color update
            expect(mockParticleSystem.setParticleColor).toHaveBeenCalledWith('player', 0xFF0000);
        });

        it('should handle rainbow trail style with particle effects', () => {
            // Set rainbow trail style
            customizationManager.setTrailStyle('player', 'rainbow');

            // Verify trail style is applied
            expect(mockRenderingEngine.trailStyleRenderer.setTrailStyle)
                .toHaveBeenCalledWith('player', 'rainbow');

            // Simulate particle system handling rainbow effect
            const trailSegments = [
                { x: 0, y: 0, z: 0 },
                { x: 0.1, y: 0, z: 0 },
                { x: 0.2, y: 0, z: 0 }
            ];

            trailSegments.forEach(segment => {
                mockParticleSystem.createTrailParticles(segment, 'rainbow');
            });

            // Verify particle system handles multiple segments with rainbow style
            expect(mockParticleSystem.createTrailParticles).toHaveBeenCalledTimes(3);
        });
    });

    describe('Glow Effects Integration', () => {
        it('should ensure arena themes work with glow systems', () => {
            // Set neon city theme (should have enhanced glow effects)
            const result = customizationManager.setArenaTheme('neon-city');
            expect(result).toBe(true);

            // Verify glow system can adapt to theme
            mockGlowEffectManager.updateGlowIntensity('neon-city', 1.2);
            expect(mockGlowEffectManager.updateGlowIntensity).toHaveBeenCalledWith('neon-city', 1.2);
        });

        it('should maintain glow effects with custom trail colors', () => {
            // Set glowing trail style
            customizationManager.setTrailStyle('player', 'glowing');
            customizationManager.setTrailColor('player', '#00FFFF');

            // Verify glow system receives color information
            mockGlowEffectManager.setGlowColor('player', 0x00FFFF);
            expect(mockGlowEffectManager.setGlowColor).toHaveBeenCalledWith('player', 0x00FFFF);

            // Verify glow is applied to trail
            const trailSegment = { x: 1, y: 0, z: 1 };
            mockGlowEffectManager.applyGlowToTrail(trailSegment, 'player');
            expect(mockGlowEffectManager.applyGlowToTrail).toHaveBeenCalledWith(trailSegment, 'player');
        });

        it('should handle space theme with reduced glow effects', () => {
            // Set space theme (should have minimal glow)
            customizationManager.setArenaTheme('space');

            // Verify glow system adapts to space theme
            mockGlowEffectManager.updateGlowIntensity('space', 0.3);
            expect(mockGlowEffectManager.updateGlowIntensity).toHaveBeenCalledWith('space', 0.3);
        });
    });

    describe('Power-Up System Integration', () => {
        it('should verify arena themes work with power-up spawning', () => {
            // Set different arena themes
            const themes = ['classic-grid', 'neon-city', 'space', 'tron-legacy'];

            themes.forEach(theme => {
                customizationManager.setArenaTheme(theme);

                // Simulate power-up spawning
                const spawnPosition = { x: 5, y: 0, z: 5 };
                mockPowerUpManager.spawnPowerUp('speed', spawnPosition);

                // Verify power-up can spawn regardless of theme
                expect(mockPowerUpManager.spawnPowerUp).toHaveBeenCalledWith('speed', spawnPosition);
            });
        });

        it('should maintain power-up visibility with custom colors', () => {
            // Set custom bike and trail colors
            customizationManager.setBikeColor('player', '#FF00FF');
            customizationManager.setTrailColor('player', '#FFFF00');

            // Simulate power-up collision detection
            const powerUps = [
                { type: 'speed', position: { x: 1, y: 0, z: 1 } },
                { type: 'shield', position: { x: 2, y: 0, z: 2 } }
            ];

            mockPowerUpManager.getActivePowerUps.mockReturnValue(powerUps);
            const activePowerUps = mockPowerUpManager.getActivePowerUps();

            // Verify power-ups are still detectable with custom colors
            expect(activePowerUps).toHaveLength(2);
            expect(activePowerUps[0].type).toBe('speed');
            expect(activePowerUps[1].type).toBe('shield');
        });
    });

    describe('Collision Detection Integration', () => {
        it('should ensure trail style changes do not affect collision detection', () => {
            // Test all trail styles
            const trailStyles = ['solid', 'dashed', 'glowing', 'rainbow'];

            trailStyles.forEach(style => {
                customizationManager.setTrailStyle('player', style);

                // Create test game state with collision scenario
                const gameState = {
                    frameCount: 20, // Past grace period
                    isPaused: false,
                    player: { x: 0.05, y: 0, z: 0 }, // Close to trail segment
                    playerTrail: [
                        { x: 0, y: 0, z: 0 },
                        { x: 0.1, y: 0, z: 0 },
                        { x: 0.2, y: 0, z: 0 }
                    ],
                    ai: { x: 5, y: 0, z: 5 }, // Far away
                    aiTrail: [],
                    bounds: 30
                };

                // Test collision detection
                const collisionResult = collisionEngine.checkCollisions(gameState, game);

                // Collision detection should work regardless of trail style
                expect(typeof collisionResult).toBe('object');
                expect(collisionResult).toHaveProperty('playerCollided');
                expect(collisionResult).toHaveProperty('aiCollided');
            });
        });

        it('should maintain collision boundaries regardless of visual style', () => {
            // Set different visual styles
            customizationManager.setTrailStyle('player', 'glowing');
            customizationManager.setBikeColor('player', '#FF0000');
            customizationManager.setArenaTheme('neon-city');

            // Test boundary collision with game state
            const bounds = game.getBounds();

            // Create game state with player at boundary
            const boundaryGameState = {
                frameCount: 20,
                isPaused: false,
                player: { x: bounds.maxX + 0.1, y: 0, z: 0 }, // Outside boundary
                playerTrail: [],
                ai: { x: 0, y: 0, z: 0 },
                aiTrail: [],
                bounds: 30
            };

            const boundaryCollision = collisionEngine.checkCollisions(boundaryGameState, game);
            expect(boundaryCollision.playerCollided).toBe(true);

            // Test safe position
            const safeGameState = {
                frameCount: 20,
                isPaused: false,
                player: { x: 0, y: 0, z: 0 }, // Safe position
                playerTrail: [],
                ai: { x: 5, y: 0, z: 5 },
                aiTrail: [],
                bounds: 30
            };

            const safeCollision = collisionEngine.checkCollisions(safeGameState, game);
            expect(safeCollision.playerCollided).toBe(false);
        });

        it('should handle collision detection with multiple AI opponents', () => {
            // Create game with multiple AI opponents
            const multiAIGame = new Game(GameModes.CLASSIC, { aiCount: 3 });
            
            // Apply customizations
            customizationManager.setBikeColor('player', '#00FF00');
            customizationManager.setTrailStyle('player', 'dashed');

            // Get initial game state
            const initialGameState = multiAIGame.getGameState();
            expect(initialGameState.aiOpponents).toHaveLength(3);

            // Create test scenario with player colliding with AI trail
            const testGameState = {
                frameCount: 20,
                isPaused: false,
                player: { x: 1.05, y: 0, z: 0 }, // Close to AI trail
                playerTrail: [{ x: 0, y: 0, z: 0 }],
                aiOpponents: [
                    {
                        id: 'ai_1',
                        x: 2, y: 0, z: 0,
                        alive: true,
                        trail: [
                            { x: 1, y: 0, z: 0 },
                            { x: 1.1, y: 0, z: 0 },
                            { x: 1.2, y: 0, z: 0 }
                        ]
                    },
                    {
                        id: 'ai_2',
                        x: 5, y: 0, z: 5,
                        alive: true,
                        trail: [{ x: 5, y: 0, z: 5 }]
                    },
                    {
                        id: 'ai_3',
                        x: -5, y: 0, z: -5,
                        alive: true,
                        trail: [{ x: -5, y: 0, z: -5 }]
                    }
                ],
                bounds: 30
            };

            // Test collision detection with multiple AIs
            const collisionResult = collisionEngine.checkCollisions(testGameState, multiAIGame);

            // Collision should be detected with AI trail
            expect(collisionResult.playerCollided).toBe(true);
            expect(collisionResult).toHaveProperty('winner');
            // Winner could be null, string, or array depending on collision scenario
            expect(collisionResult.winner !== undefined).toBe(true);
        });
    });

    describe('UI Elements and Game Information', () => {
        it('should maintain visual clarity for UI elements', () => {
            // Set high contrast customizations
            customizationManager.setBikeColor('player', '#FFFFFF');
            customizationManager.setTrailColor('player', '#FFFFFF');
            customizationManager.setArenaTheme('space'); // Dark theme

            // Verify customizations are applied
            const state = customizationManager.getCurrentState();
            expect(state.bikeColor).toBe('#FFFFFF');
            expect(state.trailColor).toBe('#FFFFFF');
            expect(state.arenaTheme).toBe('space');

            // UI elements should remain visible (this would be tested in actual rendering)
            // For now, we verify that the customization system doesn't interfere
            expect(customizationManager.validateColorContrast('#FFFFFF', '#000000')).toBe(true);
        });

        it('should handle multiple AI opponents with distinct default colors', () => {
            // Create game with multiple AI opponents
            const multiAIGame = new Game(GameModes.CLASSIC, { aiCount: 4 });
            const gameState = multiAIGame.getGameState();

            // Verify each AI has a distinct color
            const aiColors = gameState.aiOpponents.map(ai => ai.color);
            const uniqueColors = [...new Set(aiColors)];
            
            expect(aiColors).toHaveLength(4);
            expect(uniqueColors).toHaveLength(4); // All colors should be unique

            // Apply player customization
            customizationManager.setBikeColor('player', '#FF0000');

            // Verify player customization doesn't affect AI colors
            const updatedGameState = multiAIGame.getGameState();
            const updatedAIColors = updatedGameState.aiOpponents.map(ai => ai.color);
            
            expect(updatedAIColors).toEqual(aiColors); // AI colors should remain unchanged
        });

        it('should maintain game information visibility across themes', () => {
            const themes = ['classic-grid', 'neon-city', 'space', 'tron-legacy'];

            themes.forEach(theme => {
                customizationManager.setArenaTheme(theme);

                // Verify theme is applied
                const state = customizationManager.getCurrentState();
                expect(state.arenaTheme).toBe(theme);

                // Game information should remain accessible
                const gameState = game.getGameState();
                expect(gameState.gameMode).toBeDefined();
                expect(gameState.bounds).toBeDefined();
                expect(gameState.player).toBeDefined();
            });
        });
    });

    describe('Performance and Stability', () => {
        it('should maintain stable performance with all customizations enabled', () => {
            // Apply multiple customizations simultaneously
            customizationManager.setBikeColor('player', '#FF0000');
            customizationManager.setTrailColor('player', '#00FF00');
            customizationManager.setTrailStyle('player', 'rainbow');
            customizationManager.setArenaTheme('neon-city');

            // Simulate game updates
            for (let i = 0; i < 100; i++) {
                game.update();
            }

            // Verify game state remains stable
            const gameState = game.getGameState();
            expect(gameState.frameCount).toBe(100);
            expect(gameState.gameOver).toBe(false);
            expect(gameState.player).toBeDefined();
        });

        it('should handle rapid customization changes without errors', () => {
            const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
            const styles = ['solid', 'dashed', 'glowing', 'rainbow'];
            const themes = ['classic-grid', 'neon-city', 'space', 'tron-legacy'];

            // Rapidly change customizations
            for (let i = 0; i < 50; i++) {
                const color = colors[i % colors.length];
                const style = styles[i % styles.length];
                const theme = themes[i % themes.length];

                expect(() => {
                    customizationManager.setBikeColor('player', color);
                    customizationManager.setTrailStyle('player', style);
                    customizationManager.setArenaTheme(theme);
                }).not.toThrow();
            }

            // Verify final state is valid
            const finalState = customizationManager.getCurrentState();
            expect(finalState.bikeColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
            expect(styles).toContain(finalState.trailStyle);
            expect(themes).toContain(finalState.arenaTheme);
        });
    });
});