/**
 * Unit tests for CameraEffectsUI class
 * Tests UI integration, DOM interactions, and settings synchronization
 */

const { CameraEffectsUI } = require('./CameraEffectsUI.js');

// Mock DOM elements
const mockElements = {
    button: {
        addEventListener: jest.fn(),
        classList: {
            add: jest.fn(),
            remove: jest.fn()
        }
    },
    panel: {
        style: { display: 'none' },
        addEventListener: jest.fn()
    },
    accessibilityWarning: {
        classList: {
            add: jest.fn(),
            remove: jest.fn()
        }
    },
    shakeIntensityButtons: [
        { dataset: { intensity: '0' }, addEventListener: jest.fn(), classList: { add: jest.fn(), remove: jest.fn() } },
        { dataset: { intensity: '0.5' }, addEventListener: jest.fn(), classList: { add: jest.fn(), remove: jest.fn() } },
        { dataset: { intensity: '1.0' }, addEventListener: jest.fn(), classList: { add: jest.fn(), remove: jest.fn() } },
        { dataset: { intensity: '2.0' }, addEventListener: jest.fn(), classList: { add: jest.fn(), remove: jest.fn() } }
    ],
    motionBlurToggle: {
        addEventListener: jest.fn(),
        classList: {
            add: jest.fn(),
            remove: jest.fn()
        }
    },
    motionBlurQualityButtons: [
        { dataset: { quality: 'low' }, addEventListener: jest.fn(), classList: { add: jest.fn(), remove: jest.fn() } },
        { dataset: { quality: 'medium' }, addEventListener: jest.fn(), classList: { add: jest.fn(), remove: jest.fn() } },
        { dataset: { quality: 'high' }, addEventListener: jest.fn(), classList: { add: jest.fn(), remove: jest.fn() } }
    ],
    accessibilityModeToggle: {
        addEventListener: jest.fn(),
        classList: {
            add: jest.fn(),
            remove: jest.fn()
        }
    },
    systemPreferencesToggle: {
        addEventListener: jest.fn(),
        classList: {
            add: jest.fn(),
            remove: jest.fn()
        }
    },
    resetButton: {
        addEventListener: jest.fn()
    },
    closeButton: {
        addEventListener: jest.fn()
    }
};

// Mock document
global.document = {
    getElementById: jest.fn((id) => {
        const elementMap = {
            'cameraEffectsButton': mockElements.button,
            'cameraEffectsPanel': mockElements.panel,
            'accessibilityWarning': mockElements.accessibilityWarning,
            'motionBlurToggle': mockElements.motionBlurToggle,
            'accessibilityModeToggle': mockElements.accessibilityModeToggle,
            'systemPreferencesToggle': mockElements.systemPreferencesToggle,
            'resetCameraEffectsSettings': mockElements.resetButton,
            'closeCameraEffectsSettings': mockElements.closeButton
        };
        return elementMap[id] || null;
    }),
    querySelectorAll: jest.fn((selector) => {
        if (selector === '.shake-intensity-btn') {
            return mockElements.shakeIntensityButtons;
        }
        if (selector === '#cameraEffectsPanel .quality-btn') {
            return mockElements.motionBlurQualityButtons;
        }
        return [];
    }),
    addEventListener: jest.fn()
};

// Mock window
global.window = {
    matchMedia: jest.fn(() => ({
        matches: false,
        addListener: jest.fn()
    }))
};

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
global.localStorage = localStorageMock;

describe('CameraEffectsUI', () => {
    let cameraEffectsUI;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
        
        // Reset localStorage mock
        localStorageMock.getItem.mockReturnValue(null);
        
        // Create new instance
        cameraEffectsUI = new CameraEffectsUI();
    });

    afterEach(() => {
        if (cameraEffectsUI) {
            cameraEffectsUI.destroy();
        }
    });

    describe('initialization', () => {
        it('should initialize with default settings', () => {
            expect(cameraEffectsUI).toBeDefined();
            expect(cameraEffectsUI.configManager).toBeDefined();
            expect(cameraEffectsUI.isVisible).toBe(false);
        });

        it('should bind event listeners to elements', () => {
            // Check if elements exist before checking event listeners
            if (cameraEffectsUI.elements.button) {
                expect(mockElements.button.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            }
            if (cameraEffectsUI.elements.closeButton) {
                expect(mockElements.closeButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            }
            if (cameraEffectsUI.elements.resetButton) {
                expect(mockElements.resetButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            }
        });

        it('should initialize elements correctly', () => {
            expect(cameraEffectsUI.elements.button).toBe(mockElements.button);
            expect(cameraEffectsUI.elements.panel).toBe(mockElements.panel);
            expect(cameraEffectsUI.elements.shakeIntensityButtons).toEqual(mockElements.shakeIntensityButtons);
        });
    });

    describe('panel visibility', () => {
        it('should show panel when showPanel is called', () => {
            cameraEffectsUI.showPanel();
            
            expect(mockElements.panel.style.display).toBe('block');
            expect(mockElements.button.classList.add).toHaveBeenCalledWith('active');
            expect(cameraEffectsUI.isVisible).toBe(true);
        });

        it('should hide panel when hidePanel is called', () => {
            cameraEffectsUI.showPanel();
            cameraEffectsUI.hidePanel();
            
            expect(mockElements.panel.style.display).toBe('none');
            expect(mockElements.button.classList.remove).toHaveBeenCalledWith('active');
            expect(cameraEffectsUI.isVisible).toBe(false);
        });

        it('should toggle panel visibility', () => {
            // First toggle should show
            cameraEffectsUI.togglePanel();
            expect(cameraEffectsUI.isVisible).toBe(true);
            
            // Second toggle should hide
            cameraEffectsUI.togglePanel();
            expect(cameraEffectsUI.isVisible).toBe(false);
        });
    });

    describe('settings integration', () => {
        it('should get configuration manager', () => {
            const configManager = cameraEffectsUI.getConfigManager();
            expect(configManager).toBeDefined();
            expect(configManager).toBe(cameraEffectsUI.configManager);
        });

        it('should update UI when settings change', () => {
            const newSettings = {
                shakeIntensity: 2.0,
                motionBlurEnabled: false,
                motionBlurQuality: 'high',
                accessibilityMode: true,
                respectSystemPreferences: false
            };
            
            cameraEffectsUI.updateUIFromSettings(newSettings);
            
            // Check that UI elements are updated (mocked behavior)
            expect(mockElements.shakeIntensityButtons[3].classList.add).toHaveBeenCalledWith('active');
            expect(mockElements.motionBlurQualityButtons[2].classList.add).toHaveBeenCalledWith('active');
        });
    });

    describe('settings updates', () => {
        it('should update shake intensity', () => {
            const spy = jest.spyOn(cameraEffectsUI.configManager, 'updateSettings');
            
            cameraEffectsUI.updateShakeIntensity(1.5);
            
            expect(spy).toHaveBeenCalledWith({
                shakeIntensity: 1.5,
                shakeEnabled: true
            });
        });

        it('should disable shake when intensity is 0', () => {
            const spy = jest.spyOn(cameraEffectsUI.configManager, 'updateSettings');
            
            cameraEffectsUI.updateShakeIntensity(0);
            
            expect(spy).toHaveBeenCalledWith({
                shakeIntensity: 0,
                shakeEnabled: false
            });
        });

        it('should toggle motion blur', () => {
            const spy = jest.spyOn(cameraEffectsUI.configManager, 'updateSettings');
            
            cameraEffectsUI.toggleMotionBlur();
            
            expect(spy).toHaveBeenCalledWith({
                motionBlurEnabled: expect.any(Boolean)
            });
        });

        it('should update motion blur quality', () => {
            const spy = jest.spyOn(cameraEffectsUI.configManager, 'updateSettings');
            
            cameraEffectsUI.updateMotionBlurQuality('high');
            
            expect(spy).toHaveBeenCalledWith({
                motionBlurQuality: 'high'
            });
        });

        it('should toggle accessibility mode', () => {
            const spy = jest.spyOn(cameraEffectsUI.configManager, 'updateSettings');
            
            cameraEffectsUI.toggleAccessibilityMode();
            
            expect(spy).toHaveBeenCalledWith({
                accessibilityMode: expect.any(Boolean)
            });
        });

        it('should reset settings to defaults', () => {
            const spy = jest.spyOn(cameraEffectsUI.configManager, 'resetToDefaults');
            
            cameraEffectsUI.resetSettings();
            
            expect(spy).toHaveBeenCalled();
        });
    });

    describe('accessibility warning', () => {
        it('should show warning when effects should be disabled', () => {
            jest.spyOn(cameraEffectsUI.configManager, 'shouldDisableEffects').mockReturnValue(true);
            
            cameraEffectsUI.updateAccessibilityWarning();
            
            expect(mockElements.accessibilityWarning.classList.add).toHaveBeenCalledWith('show');
        });

        it('should hide warning when effects are enabled', () => {
            jest.spyOn(cameraEffectsUI.configManager, 'shouldDisableEffects').mockReturnValue(false);
            
            cameraEffectsUI.updateAccessibilityWarning();
            
            expect(mockElements.accessibilityWarning.classList.remove).toHaveBeenCalledWith('show');
        });
    });

    describe('toggle state updates', () => {
        it('should update toggle to active state', () => {
            const mockToggle = {
                classList: {
                    add: jest.fn(),
                    remove: jest.fn()
                }
            };
            
            cameraEffectsUI.updateToggleState(mockToggle, true);
            
            expect(mockToggle.classList.add).toHaveBeenCalledWith('active');
        });

        it('should update toggle to inactive state', () => {
            const mockToggle = {
                classList: {
                    add: jest.fn(),
                    remove: jest.fn()
                }
            };
            
            cameraEffectsUI.updateToggleState(mockToggle, false);
            
            expect(mockToggle.classList.remove).toHaveBeenCalledWith('active');
        });

        it('should handle null toggle element gracefully', () => {
            expect(() => {
                cameraEffectsUI.updateToggleState(null, true);
            }).not.toThrow();
        });
    });

    describe('cleanup', () => {
        it('should clean up resources on destroy', () => {
            const spy = jest.spyOn(cameraEffectsUI.configManager, 'removeChangeListener');
            
            cameraEffectsUI.destroy();
            
            expect(spy).toHaveBeenCalled();
        });
    });
});