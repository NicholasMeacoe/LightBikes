/**
 * Customization System Integration Tests
 * Tests the complete customization system integration
 */

const { CustomizationManager } = require('./CustomizationManager.js');
const { CustomizationUI } = require('./CustomizationUI.js');
const { ColorPickerUI } = require('./ColorPickerUI.js');
const { PreferenceStorage } = require('./PreferenceStorage.js');
const { EmissiveMaterialSystem } = require('./EmissiveMaterialSystem.js');

// Mock DOM for UI components
const mockElement = {
    className: '',
    style: {},
    innerHTML: '',
    textContent: '',
    classList: {
        contains: jest.fn(() => false),
        add: jest.fn(),
        remove: jest.fn()
    },
    querySelector: jest.fn(() => null),
    querySelectorAll: jest.fn(() => []),
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    addEventListener: jest.fn(),
    setAttribute: jest.fn(),
    getAttribute: jest.fn(() => ''),
    parentNode: null
};

global.document = {
    createElement: jest.fn(() => ({ ...mockElement })),
    body: {
        appendChild: jest.fn(),
        removeChild: jest.fn()
    },
    addEventListener: jest.fn()
};

// Mock rendering engine
const mockRenderingEngine = {
    emissiveMaterialSystem: new EmissiveMaterialSystem(),
    scene: {},
    renderer: {}
};

describe('Customization System Integration', () => {
    let customizationManager;
    let customizationUI;
    let preferenceStorage;
    
    beforeEach(() => {
        // Clear localStorage mock
        global.localStorage = {
            getItem: jest.fn(() => null),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn()
        };
        
        preferenceStorage = new PreferenceStorage();
        customizationManager = new CustomizationManager(mockRenderingEngine, preferenceStorage);
    });
    
    afterEach(() => {
        if (customizationUI) {
            customizationUI.destroy();
        }
    });
    
    describe('End-to-End Color Customization', () => {
        it('should allow complete bike color customization workflow', () => {
            // 1. Set bike color through customization manager
            const result = customizationManager.setBikeColor('player', '#FF0000');
            expect(result).toBe(true);
            
            // 2. Verify color is applied to emissive material system
            expect(mockRenderingEngine.emissiveMaterialSystem.updateBikeMaterial).toHaveBeenCalledWith('player', 0xFF0000);
            
            // 3. Verify state is updated
            const state = customizationManager.getCurrentState();
            expect(state.bikeColor).toBe('#FF0000');
            
            // 4. Save preferences
            customizationManager.saveCurrentPreferences();
            expect(global.localStorage.setItem).toHaveBeenCalled();
        });
        
        it('should allow complete trail color customization workflow', () => {
            // 1. Set trail color through customization manager
            const result = customizationManager.setTrailColor('player', '#0000FF');
            expect(result).toBe(true);
            
            // 2. Verify color template is updated
            expect(mockRenderingEngine.emissiveMaterialSystem.updateTrailMaterialTemplate).toHaveBeenCalledWith('player', 0x0000FF);
            
            // 3. Verify state is updated
            const state = customizationManager.getCurrentState();
            expect(state.trailColor).toBe('#0000FF');
        });
        
        it('should handle trail style changes', () => {
            // Test all available trail styles
            const styles = customizationManager.getAvailableTrailStyles();
            
            styles.forEach(style => {
                const result = customizationManager.setTrailStyle('player', style);
                expect(result).toBe(true);
                
                const state = customizationManager.getCurrentState();
                expect(state.trailStyle).toBe(style);
            });
        });
    });
    
    describe('Preview Mode Integration', () => {
        it('should handle preview mode workflow', () => {
            // 1. Enable preview mode
            customizationManager.enablePreviewMode();
            expect(customizationManager.previewMode).toBe(true);
            
            // 2. Make changes in preview mode
            customizationManager.setBikeColor('player', '#FFFF00');
            customizationManager.setTrailColor('player', '#FF00FF');
            
            // 3. Verify preview state
            const previewState = customizationManager.getCurrentState();
            expect(previewState.bikeColor).toBe('#FFFF00');
            expect(previewState.trailColor).toBe('#FF00FF');
            
            // 4. Apply preview changes
            const applied = customizationManager.applyPreviewChanges();
            expect(applied).toBe(true);
            expect(customizationManager.previewMode).toBe(false);
            
            // 5. Verify changes are permanent
            const finalState = customizationManager.getCurrentState();
            expect(finalState.bikeColor).toBe('#FFFF00');
            expect(finalState.trailColor).toBe('#FF00FF');
        });
        
        it('should handle preview mode cancellation', () => {
            const originalState = customizationManager.getCurrentState();
            
            // 1. Enable preview mode
            customizationManager.enablePreviewMode();
            
            // 2. Make changes in preview mode
            customizationManager.setBikeColor('player', '#FFFF00');
            customizationManager.setTrailColor('player', '#FF00FF');
            
            // 3. Cancel preview changes
            customizationManager.cancelPreviewChanges();
            expect(customizationManager.previewMode).toBe(false);
            
            // 4. Verify original state is restored
            const finalState = customizationManager.getCurrentState();
            expect(finalState.bikeColor).toBe(originalState.bikeColor);
            expect(finalState.trailColor).toBe(originalState.trailColor);
        });
    });
    
    describe('Preference Persistence Integration', () => {
        it('should save and load preferences correctly', () => {
            // 1. Set custom preferences
            customizationManager.setBikeColor('player', '#FF0000');
            customizationManager.setTrailColor('player', '#0000FF');
            customizationManager.setTrailStyle('player', 'glowing');
            
            // 2. Save preferences
            customizationManager.saveCurrentPreferences();
            
            // 3. Verify localStorage was called
            expect(global.localStorage.setItem).toHaveBeenCalled();
            const saveCall = global.localStorage.setItem.mock.calls[0];
            expect(saveCall[0]).toBe('lightbikes_customization_preferences');
            
            const savedData = JSON.parse(saveCall[1]);
            expect(savedData.preferences.bikeColor).toBe('#FF0000');
            expect(savedData.preferences.trailColor).toBe('#0000FF');
            expect(savedData.preferences.trailStyle).toBe('glowing');
        });
        
        it('should load saved preferences on initialization', () => {
            // 1. Mock saved preferences in localStorage
            const savedPreferences = {
                version: '1.0',
                preferences: {
                    bikeColor: '#FFFF00',
                    trailColor: '#FF00FF',
                    trailStyle: 'dashed',
                    arenaTheme: 'classic-grid'
                },
                timestamp: new Date().toISOString()
            };
            
            global.localStorage.getItem.mockReturnValue(JSON.stringify(savedPreferences));
            
            // 2. Create new customization manager (should load preferences)
            const newManager = new CustomizationManager(mockRenderingEngine, preferenceStorage);
            
            // 3. Verify preferences were loaded
            const state = newManager.getCurrentState();
            expect(state.bikeColor).toBe('#FFFF00');
            expect(state.trailColor).toBe('#FF00FF');
            expect(state.trailStyle).toBe('dashed');
        });
    });
    
    describe('Color Validation Integration', () => {
        it('should validate colors through the complete system', () => {
            const colorPicker = new ColorPickerUI();
            
            // Test valid colors
            expect(colorPicker.validateColorFormat('#FF0000')).toBe(true);
            expect(customizationManager.validateColor('#FF0000')).toBe(true);
            
            // Test invalid colors
            expect(colorPicker.validateColorFormat('invalid')).toBe(false);
            expect(customizationManager.validateColor('invalid')).toBe(false);
            
            // Test contrast validation
            expect(colorPicker.validateColorContrast('#FFFFFF', '#000000')).toBe(true);
            expect(customizationManager.validateColorContrast('#FFFFFF', '#000000')).toBe(true);
            
            colorPicker.destroy();
        });
    });
    
    describe('EmissiveMaterialSystem Integration', () => {
        it('should integrate with emissive material system correctly', () => {
            const materialSystem = mockRenderingEngine.emissiveMaterialSystem;
            
            // Test bike material updates
            customizationManager.setBikeColor('player', '#FF0000');
            expect(materialSystem.updateBikeMaterial).toHaveBeenCalledWith('player', 0xFF0000);
            
            // Test trail material template updates
            customizationManager.setTrailColor('player', '#0000FF');
            expect(materialSystem.updateTrailMaterialTemplate).toHaveBeenCalledWith('player', 0x0000FF);
            
            // Test color template retrieval
            materialSystem.trailTemplates = new Map();
            materialSystem.trailTemplates.set('player', 0x00FF00);
            
            const templateColor = materialSystem.getTrailColorTemplate('player');
            expect(templateColor).toBe(0x00FF00);
        });
    });
    
    describe('Error Handling Integration', () => {
        it('should handle rendering engine errors gracefully', () => {
            // Create manager with null rendering engine
            const managerWithoutRenderer = new CustomizationManager(null, preferenceStorage);
            
            // Should not throw errors
            expect(() => {
                managerWithoutRenderer.setBikeColor('player', '#FF0000');
                managerWithoutRenderer.setTrailColor('player', '#0000FF');
            }).not.toThrow();
        });
        
        it('should handle storage errors gracefully', () => {
            // Mock storage error
            global.localStorage.setItem.mockImplementation(() => {
                throw new Error('Storage quota exceeded');
            });
            
            // Should not throw errors
            expect(() => {
                customizationManager.saveCurrentPreferences();
            }).not.toThrow();
        });
        
        it('should handle invalid theme names gracefully', () => {
            const result = customizationManager.setArenaTheme('invalid-theme');
            expect(result).toBe(false);
            
            // State should remain unchanged
            const state = customizationManager.getCurrentState();
            expect(state.arenaTheme).toBe('classic-grid'); // Default theme
        });
    });
    
    describe('Reset Functionality Integration', () => {
        it('should reset all customizations to defaults', () => {
            // 1. Set custom values
            customizationManager.setBikeColor('player', '#FF0000');
            customizationManager.setTrailColor('player', '#0000FF');
            customizationManager.setTrailStyle('player', 'glowing');
            
            // 2. Reset to defaults
            customizationManager.resetToDefaults();
            
            // 3. Verify default values
            const state = customizationManager.getCurrentState();
            expect(state.bikeColor).toBe('#00FF00');
            expect(state.trailColor).toBe('#00FF00');
            expect(state.trailStyle).toBe('solid');
            expect(state.arenaTheme).toBe('classic-grid');
        });
    });
});