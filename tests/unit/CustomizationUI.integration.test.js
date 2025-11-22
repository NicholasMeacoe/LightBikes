const { CustomizationUI } = require('@/ui/CustomizationUI.js');
const { CustomizationManager } = require('@/systems/CustomizationManager.js');
const { PreferenceStorage } = require('@/systems/PreferenceStorage.js');

// Mock DOM elements
const mockDocument = {
    getElementById: jest.fn(),
    createElement: jest.fn(),
    body: { appendChild: jest.fn() }
};

global.document = mockDocument;

// Mock rendering engine
const mockRenderingEngine = {
    emissiveMaterialSystem: {
        updateBikeMaterial: jest.fn(),
        updateTrailMaterialTemplate: jest.fn()
    },
    scene: {},
    renderer: {},
    camera: { position: { x: 0, y: 20, z: 20 } },
    player: { material: null },
    trailStyleRenderer: {
        setTrailStyle: jest.fn()
    }
};

// Mock preference storage
const mockPreferenceStorage = {
    loadPreferences: jest.fn(),
    savePreferences: jest.fn()
};

describe('CustomizationUI Integration', () => {
    let customizationUI;
    let customizationManager;
    let mockMenuContainer;
    let mockPreviewContainer;
    
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock DOM elements
        mockMenuContainer = {
            style: {},
            innerHTML: '',
            appendChild: jest.fn(),
            addEventListener: jest.fn(),
            querySelector: jest.fn(),
            querySelectorAll: jest.fn().mockReturnValue([])
        };
        
        mockPreviewContainer = {
            style: {},
            innerHTML: '',
            appendChild: jest.fn()
        };
        
        mockDocument.getElementById.mockImplementation((id) => {
            if (id === 'customization-menu') return mockMenuContainer;
            if (id === 'customization-preview') return mockPreviewContainer;
            return null;
        });
        
        mockDocument.createElement.mockReturnValue({
            style: {},
            innerHTML: '',
            appendChild: jest.fn(),
            addEventListener: jest.fn(),
            setAttribute: jest.fn(),
            classList: { add: jest.fn(), remove: jest.fn() }
        });
        
        // Create instances
        customizationManager = new CustomizationManager(mockRenderingEngine, mockPreferenceStorage);
        customizationUI = new CustomizationUI(customizationManager);
    });
    
    describe('initialization', () => {
        it('should initialize with customization manager', () => {
            expect(customizationUI.customizationManager).toBe(customizationManager);
        });
        
        it('should create menu structure', () => {
            customizationUI.createMenuStructure();
            
            expect(mockDocument.createElement).toHaveBeenCalledWith('div');
            expect(mockMenuContainer.appendChild).toHaveBeenCalled();
        });
        
        it('should setup event listeners', () => {
            customizationUI.setupEventListeners();
            
            expect(mockMenuContainer.addEventListener).toHaveBeenCalled();
        });
    });
    
    describe('color picker integration', () => {
        it('should update bike color through manager', () => {
            const mockColorInput = {
                value: '#FF0000',
                addEventListener: jest.fn()
            };
            
            customizationUI.handleBikeColorChange(mockColorInput);
            
            expect(customizationManager.getCurrentState().bikeColor).toBe('#FF0000');
        });
        
        it('should update trail color through manager', () => {
            const mockColorInput = {
                value: '#0000FF',
                addEventListener: jest.fn()
            };
            
            customizationUI.handleTrailColorChange(mockColorInput);
            
            expect(customizationManager.getCurrentState().trailColor).toBe('#0000FF');
        });
        
        it('should validate color input', () => {
            const mockColorInput = {
                value: 'invalid-color',
                addEventListener: jest.fn()
            };
            
            const result = customizationUI.handleBikeColorChange(mockColorInput);
            
            expect(result).toBe(false);
            expect(customizationManager.getCurrentState().bikeColor).toBe('#00FF00'); // Should remain default
        });
    });
    
    describe('trail style integration', () => {
        it('should update trail style through manager', () => {
            const mockStyleSelector = {
                value: 'glowing',
                addEventListener: jest.fn()
            };
            
            customizationUI.handleTrailStyleChange(mockStyleSelector);
            
            expect(customizationManager.getCurrentState().trailStyle).toBe('glowing');
            expect(mockRenderingEngine.trailStyleRenderer.setTrailStyle)
                .toHaveBeenCalledWith('player', 'glowing');
        });
        
        it('should populate style options', () => {
            const mockSelect = {
                innerHTML: '',
                appendChild: jest.fn()
            };
            
            customizationUI.populateTrailStyleOptions(mockSelect);
            
            expect(mockDocument.createElement).toHaveBeenCalledWith('option');
            expect(mockSelect.appendChild).toHaveBeenCalled();
        });
    });
    
    describe('theme integration', () => {
        it('should update arena theme through manager', () => {
            const mockThemeSelector = {
                value: 'neon-city',
                addEventListener: jest.fn()
            };
            
            customizationUI.handleThemeChange(mockThemeSelector);
            
            expect(customizationManager.getCurrentState().arenaTheme).toBe('neon-city');
        });
        
        it('should create theme gallery', () => {
            const mockGallery = {
                innerHTML: '',
                appendChild: jest.fn()
            };
            
            customizationUI.createThemeGallery(mockGallery);
            
            expect(mockDocument.createElement).toHaveBeenCalledWith('div');
            expect(mockGallery.appendChild).toHaveBeenCalled();
        });
    });
    
    describe('preview functionality', () => {
        it('should enable preview mode', () => {
            customizationUI.enablePreview();
            
            expect(customizationManager.previewMode).toBe(true);
        });
        
        it('should update preview in real-time', () => {
            customizationUI.enablePreview();
            
            const mockColorInput = {
                value: '#FF0000',
                addEventListener: jest.fn()
            };
            
            customizationUI.handleBikeColorChange(mockColorInput);
            
            expect(customizationManager.previewState.bikeColor).toBe('#FF0000');
            expect(customizationManager.currentState.bikeColor).toBe('#00FF00'); // Original unchanged
        });
        
        it('should apply preview changes', () => {
            customizationUI.enablePreview();
            
            const mockColorInput = {
                value: '#FF0000',
                addEventListener: jest.fn()
            };
            
            customizationUI.handleBikeColorChange(mockColorInput);
            customizationUI.applyChanges();
            
            expect(customizationManager.currentState.bikeColor).toBe('#FF0000');
            expect(customizationManager.previewMode).toBe(false);
        });
        
        it('should cancel preview changes', () => {
            customizationUI.enablePreview();
            
            const mockColorInput = {
                value: '#FF0000',
                addEventListener: jest.fn()
            };
            
            customizationUI.handleBikeColorChange(mockColorInput);
            customizationUI.cancelChanges();
            
            expect(customizationManager.currentState.bikeColor).toBe('#00FF00'); // Back to original
            expect(customizationManager.previewMode).toBe(false);
        });
    });
    
    describe('preference persistence integration', () => {
        it('should save preferences when applying changes', () => {
            customizationUI.enablePreview();
            
            const mockColorInput = {
                value: '#FF0000',
                addEventListener: jest.fn()
            };
            
            customizationUI.handleBikeColorChange(mockColorInput);
            customizationUI.applyChanges();
            
            expect(mockPreferenceStorage.savePreferences).toHaveBeenCalledWith({
                bikeColor: '#FF0000',
                trailColor: '#00FF00',
                trailStyle: 'solid',
                arenaTheme: 'classic-grid'
            });
        });
        
        it('should load saved preferences on initialization', () => {
            const savedPrefs = {
                preferences: {
                    bikeColor: '#FF0000',
                    trailColor: '#0000FF',
                    trailStyle: 'glowing',
                    arenaTheme: 'neon-city'
                }
            };
            
            mockPreferenceStorage.loadPreferences.mockReturnValue(savedPrefs);
            
            customizationUI.loadSavedPreferences();
            
            expect(customizationManager.currentState.bikeColor).toBe('#FF0000');
            expect(customizationManager.currentState.trailColor).toBe('#0000FF');
            expect(customizationManager.currentState.trailStyle).toBe('glowing');
            expect(customizationManager.currentState.arenaTheme).toBe('neon-city');
        });
    });
    
    describe('reset functionality', () => {
        it('should reset all customizations to defaults', () => {
            // Make some changes
            customizationManager.setBikeColor('player', '#FF0000');
            customizationManager.setTrailStyle('player', 'glowing');
            
            customizationUI.resetToDefaults();
            
            const state = customizationManager.getCurrentState();
            expect(state.bikeColor).toBe('#00FF00');
            expect(state.trailColor).toBe('#00FF00');
            expect(state.trailStyle).toBe('solid');
            expect(state.arenaTheme).toBe('classic-grid');
        });
        
        it('should update UI elements after reset', () => {
            const mockBikeColorInput = { value: '#FF0000' };
            const mockTrailStyleSelect = { value: 'glowing' };
            
            mockMenuContainer.querySelector.mockImplementation((selector) => {
                if (selector.includes('bike-color')) return mockBikeColorInput;
                if (selector.includes('trail-style')) return mockTrailStyleSelect;
                return null;
            });
            
            customizationUI.resetToDefaults();
            
            expect(mockBikeColorInput.value).toBe('#00FF00');
            expect(mockTrailStyleSelect.value).toBe('solid');
        });
    });
    
    describe('error handling', () => {
        it('should handle missing DOM elements gracefully', () => {
            mockDocument.getElementById.mockReturnValue(null);
            
            expect(() => {
                customizationUI.createMenuStructure();
            }).not.toThrow();
        });
        
        it('should handle invalid color input gracefully', () => {
            const mockColorInput = {
                value: 'not-a-color',
                addEventListener: jest.fn()
            };
            
            expect(() => {
                customizationUI.handleBikeColorChange(mockColorInput);
            }).not.toThrow();
            
            expect(customizationManager.getCurrentState().bikeColor).toBe('#00FF00'); // Should remain default
        });
        
        it('should handle storage errors gracefully', () => {
            mockPreferenceStorage.savePreferences.mockImplementation(() => {
                throw new Error('Storage error');
            });
            
            expect(() => {
                customizationUI.applyChanges();
            }).not.toThrow();
        });
    });
    
    describe('accessibility', () => {
        it('should create accessible form elements', () => {
            const mockInput = {
                setAttribute: jest.fn(),
                addEventListener: jest.fn()
            };
            
            mockDocument.createElement.mockReturnValue(mockInput);
            
            customizationUI.createColorPicker('bike-color', 'Bike Color');
            
            expect(mockInput.setAttribute).toHaveBeenCalledWith('aria-label', 'Bike Color');
            expect(mockInput.setAttribute).toHaveBeenCalledWith('type', 'color');
        });
        
        it('should provide keyboard navigation support', () => {
            const mockButton = {
                setAttribute: jest.fn(),
                addEventListener: jest.fn()
            };
            
            mockDocument.createElement.mockReturnValue(mockButton);
            
            customizationUI.createActionButton('Apply', customizationUI.applyChanges);
            
            expect(mockButton.setAttribute).toHaveBeenCalledWith('tabindex', '0');
            expect(mockButton.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
        });
    });
    
    describe('performance integration', () => {
        it('should monitor performance during customization changes', () => {
            if (customizationManager.performanceOptimizer) {
                customizationManager.performanceOptimizer.getPerformanceMetrics = jest.fn().mockReturnValue({
                    frameTime: 20, // Poor performance
                    drawCalls: 50
                });
                
                customizationUI.checkPerformance();
                
                expect(customizationManager.performanceOptimizer.getPerformanceMetrics).toHaveBeenCalled();
            }
        });
        
        it('should optimize performance when needed', () => {
            if (customizationManager.performanceOptimizer) {
                customizationManager.performanceOptimizer.optimizeScene = jest.fn();
                
                customizationUI.optimizePerformance();
                
                expect(customizationManager.performanceOptimizer.optimizeScene).toHaveBeenCalled();
            }
        });
    });
});