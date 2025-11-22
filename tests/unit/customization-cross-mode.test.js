/**
 * Cross-Mode Customization Compatibility Tests
 * Tests customization system functionality across all game modes
 */

const { Game } = require('@/core/game.js');
const { GameModes } = require('@/systems/GameModes.js');
const { CustomizationManager } = require('@/systems/CustomizationManager.js');
const { PreferenceStorage } = require('@/systems/PreferenceStorage.js');

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

// Mock localStorage
const mockLocalStorage = {
    data: {},
    getItem: jest.fn((key) => {
        return mockLocalStorage.data[key] || null;
    }),
    setItem: jest.fn((key, value) => { 
        mockLocalStorage.data[key] = value; 
    }),
    removeItem: jest.fn((key) => { 
        delete mockLocalStorage.data[key]; 
    }),
    clear: jest.fn(() => { 
        mockLocalStorage.data = {}; 
    })
};
global.localStorage = mockLocalStorage;

describe('Cross-Mode Customization Compatibility', () => {
    let classicGame, timeTrialGame, arenaShrinkGame;
    let renderingEngine, preferenceStorage;
    let classicCustomization, timeTrialCustomization, arenaShrinkCustomization;

    beforeEach(() => {
        // Clear localStorage and reset all mocks
        mockLocalStorage.clear();
        mockLocalStorage.data = {};
        jest.clearAllMocks();

        // Create games for each mode
        classicGame = new Game(GameModes.CLASSIC);
        timeTrialGame = new Game(GameModes.TIME_TRIAL);
        arenaShrinkGame = new Game(GameModes.ARENA_SHRINK);

        // Create mock rendering engine
        renderingEngine = {
            emissiveMaterialSystem: {
                updateBikeMaterial: jest.fn(),
                updateTrailMaterialTemplate: jest.fn()
            },
            trailStyleRenderer: {
                setTrailStyle: jest.fn()
            },
            scene: {},
            renderer: {}
        };

        // Create preference storage
        preferenceStorage = new PreferenceStorage();

        // Create customization managers for each mode
        classicCustomization = new CustomizationManager(renderingEngine, preferenceStorage);
        timeTrialCustomization = new CustomizationManager(renderingEngine, preferenceStorage);
        arenaShrinkCustomization = new CustomizationManager(renderingEngine, preferenceStorage);
    });

    describe('Classic Mode Customizations', () => {
        it('should apply bike color customization in Classic mode', () => {
            const testColor = '#FF0000';
            
            const result = classicCustomization.setBikeColor('player', testColor);
            
            expect(result).toBe(true);
            expect(classicCustomization.getCurrentState().bikeColor).toBe(testColor);
            expect(renderingEngine.emissiveMaterialSystem.updateBikeMaterial)
                .toHaveBeenCalledWith('player', 0xFF0000);
        });

        it('should apply trail color customization in Classic mode', () => {
            const testColor = '#0000FF';
            
            const result = classicCustomization.setTrailColor('player', testColor);
            
            expect(result).toBe(true);
            expect(classicCustomization.getCurrentState().trailColor).toBe(testColor);
            expect(renderingEngine.emissiveMaterialSystem.updateTrailMaterialTemplate)
                .toHaveBeenCalledWith('player', 0x0000FF);
        });

        it('should apply trail style customization in Classic mode', () => {
            const testStyle = 'glowing';
            
            const result = classicCustomization.setTrailStyle('player', testStyle);
            
            expect(result).toBe(true);
            expect(classicCustomization.getCurrentState().trailStyle).toBe(testStyle);
            expect(renderingEngine.trailStyleRenderer.setTrailStyle)
                .toHaveBeenCalledWith('player', testStyle);
        });

        it('should apply arena theme customization in Classic mode', () => {
            const testTheme = 'neon-city';
            
            const result = classicCustomization.setArenaTheme(testTheme);
            
            expect(result).toBe(true);
            expect(classicCustomization.getCurrentState().arenaTheme).toBe(testTheme);
        });

        it('should persist customizations across Classic mode restarts', () => {
            // Apply customizations
            classicCustomization.setBikeColor('player', '#FF0000');
            classicCustomization.setTrailColor('player', '#0000FF');
            classicCustomization.setTrailStyle('player', 'dashed');
            classicCustomization.setArenaTheme('space');
            
            // Save preferences
            classicCustomization.saveCurrentPreferences();
            
            // Create new customization manager (simulating restart)
            const newCustomization = new CustomizationManager(renderingEngine, preferenceStorage);
            
            // Verify preferences were loaded
            const state = newCustomization.getCurrentState();
            expect(state.bikeColor).toBe('#FF0000');
            expect(state.trailColor).toBe('#0000FF');
            expect(state.trailStyle).toBe('dashed');
            expect(state.arenaTheme).toBe('space');
        });
    });

    describe('Time Trial Mode Customizations', () => {
        it('should apply bike color customization in Time Trial mode', () => {
            const testColor = '#FFFF00';
            
            const result = timeTrialCustomization.setBikeColor('player', testColor);
            
            expect(result).toBe(true);
            expect(timeTrialCustomization.getCurrentState().bikeColor).toBe(testColor);
            expect(renderingEngine.emissiveMaterialSystem.updateBikeMaterial)
                .toHaveBeenCalledWith('player', 0xFFFF00);
        });

        it('should apply trail style customization in Time Trial mode', () => {
            const testStyle = 'rainbow';
            
            const result = timeTrialCustomization.setTrailStyle('player', testStyle);
            
            expect(result).toBe(true);
            expect(timeTrialCustomization.getCurrentState().trailStyle).toBe(testStyle);
            expect(renderingEngine.trailStyleRenderer.setTrailStyle)
                .toHaveBeenCalledWith('player', testStyle);
        });

        it('should apply arena theme customization in Time Trial mode', () => {
            const testTheme = 'tron-legacy';
            
            const result = timeTrialCustomization.setArenaTheme(testTheme);
            
            expect(result).toBe(true);
            expect(timeTrialCustomization.getCurrentState().arenaTheme).toBe(testTheme);
        });

        it('should maintain customizations during Time Trial gameplay', () => {
            // Apply customizations
            timeTrialCustomization.setBikeColor('player', '#800080');
            timeTrialCustomization.setTrailStyle('player', 'glowing');
            
            // Start and update Time Trial game
            timeTrialGame.update(); // This starts the survival timer
            
            // Verify customizations are still applied
            expect(timeTrialCustomization.getCurrentState().bikeColor).toBe('#800080');
            expect(timeTrialCustomization.getCurrentState().trailStyle).toBe('glowing');
        });

        it('should handle customizations with survival timer active', () => {
            // Start Time Trial game
            timeTrialGame.update();
            expect(timeTrialGame.survivalTimer.isRunning).toBe(true);
            
            // Apply customizations while timer is running
            const result1 = timeTrialCustomization.setBikeColor('player', '#FFA500');
            const result2 = timeTrialCustomization.setTrailStyle('player', 'dashed');
            
            expect(result1).toBe(true);
            expect(result2).toBe(true);
            expect(timeTrialGame.survivalTimer.isRunning).toBe(true); // Timer should still be running
        });
    });

    describe('Arena Shrink Mode Customizations', () => {
        it('should apply bike color customization in Arena Shrink mode', () => {
            const testColor = '#00FFFF';
            
            const result = arenaShrinkCustomization.setBikeColor('player', testColor);
            
            expect(result).toBe(true);
            expect(arenaShrinkCustomization.getCurrentState().bikeColor).toBe(testColor);
            expect(renderingEngine.emissiveMaterialSystem.updateBikeMaterial)
                .toHaveBeenCalledWith('player', 0x00FFFF);
        });

        it('should apply trail customizations in Arena Shrink mode', () => {
            const testColor = '#FF00FF';
            const testStyle = 'solid';
            
            const colorResult = arenaShrinkCustomization.setTrailColor('player', testColor);
            const styleResult = arenaShrinkCustomization.setTrailStyle('player', testStyle);
            
            expect(colorResult).toBe(true);
            expect(styleResult).toBe(true);
            expect(arenaShrinkCustomization.getCurrentState().trailColor).toBe(testColor);
            expect(arenaShrinkCustomization.getCurrentState().trailStyle).toBe(testStyle);
        });

        it('should apply arena theme customization in Arena Shrink mode', () => {
            const testTheme = 'neon-city';
            
            const result = arenaShrinkCustomization.setArenaTheme(testTheme);
            
            expect(result).toBe(true);
            expect(arenaShrinkCustomization.getCurrentState().arenaTheme).toBe(testTheme);
        });

        it('should maintain customizations during arena shrinking', () => {
            // Apply customizations
            arenaShrinkCustomization.setBikeColor('player', '#FFFFFF');
            arenaShrinkCustomization.setTrailStyle('player', 'rainbow');
            
            // Start Arena Shrink game and simulate shrinking
            arenaShrinkGame.update(); // Initialize arena shrinker
            
            // Simulate time passing to trigger shrinking
            const mockTime = Date.now() + 10000; // 10 seconds later
            if (arenaShrinkGame.arenaShrinker) {
                arenaShrinkGame.arenaShrinker.update(mockTime);
            }
            
            // Verify customizations are maintained during shrinking
            expect(arenaShrinkCustomization.getCurrentState().bikeColor).toBe('#FFFFFF');
            expect(arenaShrinkCustomization.getCurrentState().trailStyle).toBe('rainbow');
        });

        it('should handle customizations with dynamic boundaries', () => {
            // Start Arena Shrink game
            arenaShrinkGame.update();
            
            // Get dynamic boundaries
            const bounds = arenaShrinkGame.getBounds();
            expect(bounds).toBeDefined();
            expect(arenaShrinkGame.hasDynamicBounds()).toBe(true);
            
            // Apply customizations with dynamic boundaries active
            const result = arenaShrinkCustomization.setArenaTheme('space');
            
            expect(result).toBe(true);
            expect(arenaShrinkCustomization.getCurrentState().arenaTheme).toBe('space');
        });
    });

    describe('Cross-Mode Preference Persistence', () => {
        it('should share preferences across all game modes', () => {
            // Set preferences in Classic mode
            classicCustomization.setBikeColor('player', '#123456');
            classicCustomization.setTrailColor('player', '#654321');
            classicCustomization.setTrailStyle('player', 'glowing');
            classicCustomization.setArenaTheme('neon-city');
            classicCustomization.saveCurrentPreferences();
            
            // Create new customization managers for other modes
            const newTimeTrialCustomization = new CustomizationManager(renderingEngine, preferenceStorage);
            const newArenaShrinkCustomization = new CustomizationManager(renderingEngine, preferenceStorage);
            
            // Verify preferences are loaded in all modes
            const timeTrialState = newTimeTrialCustomization.getCurrentState();
            const arenaShrinkState = newArenaShrinkCustomization.getCurrentState();
            
            expect(timeTrialState.bikeColor).toBe('#123456');
            expect(timeTrialState.trailColor).toBe('#654321');
            expect(timeTrialState.trailStyle).toBe('glowing');
            expect(timeTrialState.arenaTheme).toBe('neon-city');
            
            expect(arenaShrinkState.bikeColor).toBe('#123456');
            expect(arenaShrinkState.trailColor).toBe('#654321');
            expect(arenaShrinkState.trailStyle).toBe('glowing');
            expect(arenaShrinkState.arenaTheme).toBe('neon-city');
        });

        it('should handle preference updates from any mode', () => {
            // Set initial preferences from Time Trial mode
            timeTrialCustomization.setBikeColor('player', '#AAAAAA');
            timeTrialCustomization.saveCurrentPreferences();
            
            // Create new Arena Shrink customization manager that loads existing preferences
            const newArenaShrinkCustomization = new CustomizationManager(renderingEngine, preferenceStorage);
            
            // Update preferences from Arena Shrink mode (should preserve existing bike color)
            newArenaShrinkCustomization.setTrailStyle('player', 'dashed');
            newArenaShrinkCustomization.saveCurrentPreferences();
            
            // Create new Classic mode customization manager
            const newClassicCustomization = new CustomizationManager(renderingEngine, preferenceStorage);
            
            // Verify both preferences are present
            const state = newClassicCustomization.getCurrentState();
            expect(state.bikeColor).toBe('#AAAAAA');
            expect(state.trailStyle).toBe('dashed');
        });
    });

    describe('Mode-Specific Validation', () => {
        it('should validate customizations work with AI in Classic mode', () => {
            // Verify Classic mode has AI
            expect(classicGame.gameMode).toBe(GameModes.CLASSIC);
            expect(classicGame.ai).toBeDefined();
            expect(classicGame.aiOpponents).toHaveLength(1);
            
            // Apply customizations
            classicCustomization.setBikeColor('player', '#FF0000');
            classicCustomization.setTrailStyle('player', 'glowing');
            
            // Verify customizations don't interfere with AI
            classicGame.update();
            expect(classicGame.ai.x).toBeCloseTo(0.1); // AI should still move
            expect(classicGame.aiTrail).toHaveLength(1); // AI should still create trail
        });

        it('should validate customizations work without AI in Time Trial mode', () => {
            // Verify Time Trial mode has no AI
            expect(timeTrialGame.gameMode).toBe(GameModes.TIME_TRIAL);
            expect(timeTrialGame.ai).toBeNull();
            expect(timeTrialGame.aiOpponents).toHaveLength(0);
            
            // Apply customizations
            timeTrialCustomization.setBikeColor('player', '#00FF00');
            timeTrialCustomization.setTrailStyle('player', 'rainbow');
            
            // Verify customizations work in solo mode
            timeTrialGame.update();
            expect(timeTrialGame.player.x).toBeCloseTo(0.1); // Player should move
            expect(timeTrialGame.playerTrail).toHaveLength(1); // Player should create trail
        });

        it('should validate customizations work with dynamic boundaries in Arena Shrink mode', () => {
            // Verify Arena Shrink mode has dynamic boundaries
            expect(arenaShrinkGame.gameMode).toBe(GameModes.ARENA_SHRINK);
            expect(arenaShrinkGame.hasDynamicBounds()).toBe(true);
            
            // Apply customizations
            arenaShrinkCustomization.setArenaTheme('space');
            arenaShrinkCustomization.setTrailStyle('player', 'dashed');
            
            // Start game and verify boundaries are dynamic
            arenaShrinkGame.update();
            const bounds = arenaShrinkGame.getBounds();
            expect(bounds.size).toBeDefined();
            
            // Verify customizations don't interfere with boundary system
            expect(arenaShrinkCustomization.getCurrentState().arenaTheme).toBe('space');
            expect(arenaShrinkCustomization.getCurrentState().trailStyle).toBe('dashed');
        });
    });

    describe('Error Handling Across Modes', () => {
        it('should handle invalid customizations consistently across modes', () => {
            const invalidColor = 'not-a-color';
            const invalidStyle = 'not-a-style';
            const invalidTheme = 'not-a-theme';
            
            // Clear localStorage completely for this test
            mockLocalStorage.clear();
            mockLocalStorage.data = {};
            
            // Test each mode separately to avoid any shared state issues
            const testModes = ['classic', 'time-trial', 'arena-shrink'];
            
            testModes.forEach(mode => {
                // Create completely fresh instances for each mode test
                const freshPreferenceStorage = new PreferenceStorage();
                const customization = new CustomizationManager(renderingEngine, freshPreferenceStorage);
                expect(customization.setBikeColor('player', invalidColor)).toBe(false);
                expect(customization.setTrailColor('player', invalidColor)).toBe(false);
                expect(customization.setTrailStyle('player', invalidStyle)).toBe(false);
                expect(customization.setArenaTheme(invalidTheme)).toBe(false);
                
                // Verify state remains unchanged
                const state = customization.getCurrentState();
                expect(state.bikeColor).toBe('#00FF00'); // Default green
                expect(state.trailColor).toBe('#00FF00'); // Default green
                expect(state.trailStyle).toBe('solid'); // Default solid
                expect(state.arenaTheme).toBe('classic-grid'); // Default theme
            });
        });

        it('should handle storage errors consistently across modes', () => {
            // Mock storage failure
            const originalSavePreferences = preferenceStorage.savePreferences;
            preferenceStorage.savePreferences = jest.fn(() => {
                throw new Error('Storage failed');
            });
            
            // Test in all modes
            const modes = [classicCustomization, timeTrialCustomization, arenaShrinkCustomization];
            
            modes.forEach(customization => {
                // Apply customizations
                customization.setBikeColor('player', '#FF0000');
                
                // Attempt to save (should not throw)
                expect(() => {
                    customization.saveCurrentPreferences();
                }).not.toThrow();
            });
            
            // Restore original function
            preferenceStorage.savePreferences = originalSavePreferences;
        });
    });
});