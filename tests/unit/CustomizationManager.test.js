const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
};

const MockLoggerClass = jest.fn().mockImplementation(() => mockLogger);
MockLoggerClass.create = jest.fn().mockReturnValue(mockLogger);

// Mock all possible ways the Logger could be required
jest.mock('@/utils/Logger', () => ({
    Logger: MockLoggerClass,
    logger: mockLogger,
    createLogger: jest.fn().mockReturnValue(mockLogger),
}));

jest.mock(
    '../utils/Logger',
    () => ({
        Logger: MockLoggerClass,
        logger: mockLogger,
        createLogger: jest.fn().mockReturnValue(mockLogger),
    }),
    { virtual: true }
);

const { CustomizationManager } = require('@/systems/CustomizationManager.js');
const { PreferenceStorage } = require('@/systems/PreferenceStorage.js');

// Mock dependencies
const mockRenderingEngine = {
    emissiveMaterialSystem: {
        updateBikeMaterial: jest.fn(),
        updateTrailMaterialTemplate: jest.fn(),
    },
    scene: { traverse: jest.fn() },
    renderer: { setClearColor: jest.fn() },
    camera: { position: { x: 0, y: 20, z: 20 } },
    player: { material: null },
    trailStyleRenderer: {
        setTrailStyle: jest.fn(),
    },
};

const mockPreferenceStorage = {
    loadPreferences: jest.fn(),
    savePreferences: jest.fn(),
};

describe('CustomizationManager', () => {
    let customizationManager;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        mockPreferenceStorage.loadPreferences.mockReturnValue(null);

        // Create fresh instance
        customizationManager = new CustomizationManager(mockRenderingEngine, mockPreferenceStorage);
    });

    describe('constructor', () => {
        it('should initialize with default state', () => {
            const state = customizationManager.getCurrentState();

            expect(state.bikeColor).toBe('#00FF00');
            expect(state.trailColor).toBe('#00FF00');
            expect(state.trailStyle).toBe('solid');
            expect(state.arenaTheme).toBe('classic-grid');
        });

        it('should load saved preferences on initialization', () => {
            expect(mockPreferenceStorage.loadPreferences).toHaveBeenCalled();
        });
    });

    describe('setBikeColor', () => {
        it('should set valid bike color for player', () => {
            const result = customizationManager.setBikeColor('player', '#FF0000');

            expect(result).toBe(true);
            expect(customizationManager.getCurrentState().bikeColor).toBe('#FF0000');
        });

        it('should reject invalid bike color format', () => {
            const result = customizationManager.setBikeColor('player', 'invalid-color');

            expect(result).toBe(false);
            expect(customizationManager.getCurrentState().bikeColor).toBe('#00FF00'); // Should remain default
        });

        it('should apply bike color to rendering engine', () => {
            customizationManager.setBikeColor('player', '#FF0000');

            expect(
                mockRenderingEngine.emissiveMaterialSystem.updateBikeMaterial
            ).toHaveBeenCalledWith('player', 0xff0000);
        });
    });

    describe('setTrailColor', () => {
        it('should set valid trail color for player', () => {
            const result = customizationManager.setTrailColor('player', '#0000FF');

            expect(result).toBe(true);
            expect(customizationManager.getCurrentState().trailColor).toBe('#0000FF');
        });

        it('should reject invalid trail color format', () => {
            const result = customizationManager.setTrailColor('player', 'not-a-color');

            expect(result).toBe(false);
            expect(customizationManager.getCurrentState().trailColor).toBe('#00FF00'); // Should remain default
        });
    });

    describe('setTrailStyle', () => {
        it('should set valid trail style', () => {
            const result = customizationManager.setTrailStyle('player', 'glowing');

            expect(result).toBe(true);
            expect(customizationManager.getCurrentState().trailStyle).toBe('glowing');
        });

        it('should reject invalid trail style', () => {
            const result = customizationManager.setTrailStyle('player', 'invalid-style');

            expect(result).toBe(false);
            expect(customizationManager.getCurrentState().trailStyle).toBe('solid'); // Should remain default
        });

        it('should apply trail style to rendering engine', () => {
            customizationManager.setTrailStyle('player', 'dashed');

            expect(mockRenderingEngine.trailStyleRenderer.setTrailStyle).toHaveBeenCalledWith(
                'player',
                'dashed'
            );
        });
    });

    describe('preview mode', () => {
        it('should enable preview mode', () => {
            customizationManager.enablePreviewMode();

            expect(customizationManager.previewMode).toBe(true);
            expect(customizationManager.originalState).toEqual(customizationManager.currentState);
        });

        it('should apply changes in preview mode', () => {
            customizationManager.enablePreviewMode();
            customizationManager.setBikeColor('player', '#FF0000');

            expect(customizationManager.previewState.bikeColor).toBe('#FF0000');
            expect(customizationManager.currentState.bikeColor).toBe('#00FF00'); // Original unchanged
        });

        it('should apply preview changes', () => {
            customizationManager.enablePreviewMode();
            customizationManager.setBikeColor('player', '#FF0000');

            const result = customizationManager.applyPreviewChanges();

            expect(result).toBe(true);
            expect(customizationManager.currentState.bikeColor).toBe('#FF0000');
            expect(customizationManager.previewMode).toBe(false);
        });

        it('should cancel preview changes', () => {
            customizationManager.enablePreviewMode();
            customizationManager.setBikeColor('player', '#FF0000');

            customizationManager.cancelPreviewChanges();

            expect(customizationManager.currentState.bikeColor).toBe('#00FF00'); // Back to original
            expect(customizationManager.previewMode).toBe(false);
        });
    });

    describe('preference persistence', () => {
        it('should save current preferences', () => {
            customizationManager.setBikeColor('player', '#FF0000');
            customizationManager.saveCurrentPreferences();

            expect(mockPreferenceStorage.savePreferences).toHaveBeenCalledWith({
                bikeColor: '#FF0000',
                trailColor: '#00FF00',
                trailStyle: 'solid',
                arenaTheme: 'classic-grid',
            });
        });

        it('should load saved preferences', () => {
            const savedPrefs = {
                preferences: {
                    bikeColor: '#FF0000',
                    trailColor: '#0000FF',
                    trailStyle: 'glowing',
                    arenaTheme: 'neon-city',
                },
            };

            mockPreferenceStorage.loadPreferences.mockReturnValue(savedPrefs);

            const result = customizationManager.loadSavedPreferences(true);

            expect(result).toBe(true);
            expect(customizationManager.currentState.bikeColor).toBe('#FF0000');
            expect(customizationManager.currentState.trailColor).toBe('#0000FF');
            expect(customizationManager.currentState.trailStyle).toBe('glowing');
            expect(customizationManager.currentState.arenaTheme).toBe('neon-city');
        });

        it('should handle missing saved preferences', () => {
            mockPreferenceStorage.loadPreferences.mockReturnValue(null);

            const result = customizationManager.loadSavedPreferences();

            expect(result).toBe(false);
            // Should maintain default state (manager defaults to green)
            expect(customizationManager.currentState.bikeColor).toBe('#00FF00');
        });

        it('should reset to defaults', () => {
            customizationManager.setBikeColor('player', '#FF0000');
            customizationManager.setTrailStyle('player', 'glowing');

            customizationManager.resetToDefaults();

            const state = customizationManager.getCurrentState();
            expect(state.bikeColor).toBe('#00FF00');
            expect(state.trailColor).toBe('#00FF00');
            expect(state.trailStyle).toBe('solid');
            expect(state.arenaTheme).toBe('classic-grid');
        });
    });

    describe('performance optimization integration', () => {
        it('should initialize performance optimizer when rendering engine is available', () => {
            const customizationManagerWithOptimizer = new CustomizationManager(
                mockRenderingEngine,
                mockPreferenceStorage
            );

            expect(customizationManagerWithOptimizer.performanceOptimizer).toBeDefined();
        });

        it('should get performance metrics', () => {
            if (!customizationManager.performanceOptimizer) {
                customizationManager.performanceOptimizer = {};
            }

            customizationManager.performanceOptimizer.getPerformanceMetrics = jest
                .fn()
                .mockReturnValue({
                    frameTime: 16,
                    drawCalls: 10,
                    materialCount: 5,
                });

            const metrics = customizationManager.getPerformanceMetrics();

            expect(metrics).toEqual({
                frameTime: 16,
                drawCalls: 10,
                materialCount: 5,
            });
        });

        it('should check performance acceptability', () => {
            if (!customizationManager.performanceOptimizer) {
                customizationManager.performanceOptimizer = {};
            }

            customizationManager.performanceOptimizer.isPerformanceAcceptable = jest
                .fn()
                .mockReturnValue(true);

            const isAcceptable = customizationManager.isPerformanceAcceptable();

            expect(isAcceptable).toBe(true);
        });

        it('should optimize performance', () => {
            if (!customizationManager.performanceOptimizer) {
                customizationManager.performanceOptimizer = {};
            }

            customizationManager.performanceOptimizer.optimizeScene = jest.fn();

            customizationManager.optimizePerformance();

            expect(customizationManager.performanceOptimizer.optimizeScene).toHaveBeenCalledWith(
                mockRenderingEngine.camera.position
            );
        });
    });

    describe('utility methods', () => {
        it('should validate color format', () => {
            expect(customizationManager.validateColor('#FF0000')).toBe(true);
            expect(customizationManager.validateColor('#00ff00')).toBe(true);
            expect(customizationManager.validateColor('FF0000')).toBe(false); // Missing #
            expect(customizationManager.validateColor('#GG0000')).toBe(false); // Invalid hex
            expect(customizationManager.validateColor('#FF00')).toBe(false); // Too short
            expect(customizationManager.validateColor(null)).toBe(false);
        });

        it('should calculate color luminance', () => {
            const whiteLuminance = customizationManager.calculateLuminance('#FFFFFF');
            const blackLuminance = customizationManager.calculateLuminance('#000000');

            expect(whiteLuminance).toBeGreaterThan(blackLuminance);
            expect(whiteLuminance).toBeCloseTo(1, 1);
            expect(blackLuminance).toBeCloseTo(0, 1);
        });

        it('should validate color contrast', () => {
            const highContrast = customizationManager.validateColorContrast('#FFFFFF', '#000000');
            const lowContrast = customizationManager.validateColorContrast('#FFFFFF', '#EEEEEE');

            expect(highContrast).toBe(true);
            expect(lowContrast).toBe(false);
        });

        it('should get color presets', () => {
            const presets = customizationManager.getColorPresets();

            expect(presets).toHaveProperty('red', '#FF0000');
            expect(presets).toHaveProperty('green', '#00FF00');
            expect(presets).toHaveProperty('blue', '#0000FF');
        });

        it('should get available trail styles', () => {
            const styles = customizationManager.getAvailableTrailStyles();

            expect(styles).toContain('solid');
            expect(styles).toContain('dashed');
            expect(styles).toContain('glowing');
            expect(styles).toContain('rainbow');
        });

        it('should get available themes', () => {
            const themes = customizationManager.getAvailableThemes();

            expect(themes).toContain('classic-grid');
        });
    });

    describe('error handling', () => {
        it('should handle missing rendering engine gracefully', () => {
            const managerWithoutRenderer = new CustomizationManager(null, mockPreferenceStorage);

            const result = managerWithoutRenderer.setBikeColor('player', '#FF0000');
            expect(result).toBe(true); // Should still update state
        });

        it('should handle preference loading errors gracefully', () => {
            mockPreferenceStorage.loadPreferences.mockImplementation(() => {
                throw new Error('Storage error');
            });

            // Should not throw and should use defaults
            const manager = new CustomizationManager(mockRenderingEngine, mockPreferenceStorage);
            expect(manager.getCurrentState().bikeColor).toBe('#00FF00');
        });

        it('should handle preference saving errors gracefully', () => {
            mockPreferenceStorage.savePreferences.mockImplementation(() => {
                throw new Error('Storage error');
            });

            // Should not throw
            expect(() => {
                customizationManager.saveCurrentPreferences();
            }).not.toThrow();
        });
    });
});
