const { ModeSelector } = require('@/ui/ModeSelector.js');
const { GameModes } = require('@/systems/GameModes.js');

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock DOM methods
const mockAppendChild = jest.fn();
const mockRemove = jest.fn();

Object.defineProperty(document, 'createElement', {
    value: jest.fn(),
    writable: true
});

Object.defineProperty(document, 'getElementById', {
    value: jest.fn(),
    writable: true
});

Object.defineProperty(document, 'querySelectorAll', {
    value: jest.fn(),
    writable: true
});

Object.defineProperty(document, 'body', {
    value: { appendChild: mockAppendChild },
    writable: true
});

Object.defineProperty(document, 'head', {
    value: { appendChild: jest.fn() },
    writable: true
});

describe('ModeSelector', () => {
    let modeSelector;
    let mockGame;
    let mockElement;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(null); // Default to no saved mode
        
        // Mock game instance
        mockGame = {};
        
        // Mock DOM element
        mockElement = {
            id: '',
            className: '',
            textContent: '',
            dataset: {},
            classList: {
                add: jest.fn(),
                remove: jest.fn()
            },
            appendChild: jest.fn(),
            remove: jest.fn(),
            onclick: null
        };
        
        document.createElement.mockReturnValue(mockElement);
        document.getElementById.mockReturnValue(null);
        document.querySelectorAll.mockReturnValue([]);
        
        modeSelector = new ModeSelector(mockGame);
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(modeSelector.game).toBe(mockGame);
            expect(modeSelector.isVisible).toBe(false);
            expect(modeSelector.onModeSelected).toBeNull();
            expect(modeSelector.storageKey).toBe('lightbikes_selected_mode');
        });

        it('should load saved mode from localStorage', () => {
            // Set up mock before creating instance
            localStorageMock.getItem.mockReturnValue(GameModes.TIME_TRIAL);
            
            const selector = new ModeSelector(mockGame);
            
            expect(selector.selectedMode).toBe(GameModes.TIME_TRIAL);
            expect(localStorageMock.getItem).toHaveBeenCalledWith('lightbikes_selected_mode');
        });

        it('should default to classic mode if no saved mode', () => {
            // This is already the default in beforeEach
            expect(modeSelector.selectedMode).toBe(GameModes.CLASSIC);
        });

        it('should default to classic mode if invalid saved mode', () => {
            // Set up mock before creating instance
            localStorageMock.getItem.mockReturnValue('invalid_mode');
            
            const selector = new ModeSelector(mockGame);
            
            expect(selector.selectedMode).toBe(GameModes.CLASSIC);
        });
    });

    describe('loadSelectedMode', () => {
        it('should return saved mode if valid', () => {
            // Reset the mock for this specific test
            localStorageMock.getItem.mockReturnValue(GameModes.TIME_TRIAL);
            
            const mode = modeSelector.loadSelectedMode();
            
            expect(mode).toBe(GameModes.TIME_TRIAL);
        });

        it('should return classic mode if localStorage throws error', () => {
            localStorageMock.getItem.mockImplementation(() => {
                throw new Error('Storage error');
            });
            
            const mode = modeSelector.loadSelectedMode();
            
            expect(mode).toBe(GameModes.CLASSIC);
        });

        it('should return classic mode if no saved value', () => {
            // Reset the mock for this specific test
            localStorageMock.getItem.mockReturnValue(null);
            
            const mode = modeSelector.loadSelectedMode();
            
            expect(mode).toBe(GameModes.CLASSIC);
        });
    });

    describe('saveSelectedMode', () => {
        it('should save mode to localStorage', () => {
            modeSelector.saveSelectedMode(GameModes.TIME_TRIAL);
            
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'lightbikes_selected_mode',
                GameModes.TIME_TRIAL
            );
        });

        it('should handle localStorage errors gracefully', () => {
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('Storage error');
            });
            
            // Should not throw
            expect(() => {
                modeSelector.saveSelectedMode(GameModes.TIME_TRIAL);
            }).not.toThrow();
        });
    });

    describe('show', () => {
        it('should create and show mode selection UI', () => {
            modeSelector.show();
            
            expect(modeSelector.isVisible).toBe(true);
            expect(document.createElement).toHaveBeenCalled();
        });

        it('should not create UI if already visible', () => {
            modeSelector.isVisible = true;
            
            modeSelector.show();
            
            expect(document.createElement).not.toHaveBeenCalled();
        });
        
        it('should verify visibility after creation', () => {
            const mockSelector = { 
                offsetParent: document.body,
                style: {},
                remove: jest.fn()
            };
            // First call for existing element check, second for verifyVisibility
            document.getElementById
                .mockReturnValueOnce(null) // No existing element
                .mockReturnValueOnce(mockSelector); // For verifyVisibility
            
            modeSelector.show();
            
            expect(document.getElementById).toHaveBeenCalledWith('mode-selector');
        });
        
        it('should block UI controls after creation', () => {
            const mockAiSelector = { style: {} };
            const mockDifficultySelector = { style: {} };
            
            // Sequence of getElementById calls during show():
            // 1. Check for existing mode-selector (in createModeSelectionUI)
            // 2. Check for existing styles (in addModeSelectionStyles)
            // 3. Check for mode-selector (in verifyVisibility)
            // 4. Get aiCountSelector (in blockUIControls)
            // 5. Get difficultySelector (in blockUIControls)
            document.getElementById
                .mockReturnValueOnce(null) // No existing mode-selector
                .mockReturnValueOnce(null) // No existing styles
                .mockReturnValueOnce(null) // mode-selector in verifyVisibility (not found, will log warning)
                .mockReturnValueOnce(mockAiSelector) // aiCountSelector
                .mockReturnValueOnce(mockDifficultySelector); // difficultySelector
            
            modeSelector.show();
            
            expect(mockAiSelector.style.pointerEvents).toBe('none');
            expect(mockAiSelector.style.opacity).toBe('0.5');
            expect(mockDifficultySelector.style.pointerEvents).toBe('none');
            expect(mockDifficultySelector.style.opacity).toBe('0.5');
        });
    });

    describe('hide', () => {
        it('should hide and remove UI', () => {
            const mockSelector = { remove: jest.fn() };
            document.getElementById.mockReturnValue(mockSelector);
            modeSelector.isVisible = true;
            
            modeSelector.hide();
            
            expect(modeSelector.isVisible).toBe(false);
            expect(mockSelector.remove).toHaveBeenCalled();
        });

        it('should not error if UI not present', () => {
            document.getElementById.mockReturnValue(null);
            modeSelector.isVisible = true;
            
            expect(() => {
                modeSelector.hide();
            }).not.toThrow();
            
            expect(modeSelector.isVisible).toBe(false);
        });

        it('should not hide if not visible', () => {
            modeSelector.isVisible = false;
            
            modeSelector.hide();
            
            expect(document.getElementById).not.toHaveBeenCalled();
        });
    });

    describe('selectMode', () => {
        it('should select valid mode', () => {
            modeSelector.selectMode(GameModes.TIME_TRIAL);
            
            expect(modeSelector.selectedMode).toBe(GameModes.TIME_TRIAL);
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'lightbikes_selected_mode',
                GameModes.TIME_TRIAL
            );
        });

        it('should not select invalid mode', () => {
            const originalMode = modeSelector.selectedMode;
            
            modeSelector.selectMode('invalid_mode');
            
            expect(modeSelector.selectedMode).toBe(originalMode);
            expect(localStorageMock.setItem).not.toHaveBeenCalled();
        });
    });

    describe('updateModeSelection', () => {
        it('should update visual selection', () => {
            const mockOptions = [
                {
                    dataset: { mode: GameModes.CLASSIC },
                    classList: { add: jest.fn(), remove: jest.fn() }
                },
                {
                    dataset: { mode: GameModes.TIME_TRIAL },
                    classList: { add: jest.fn(), remove: jest.fn() }
                }
            ];
            
            document.querySelectorAll.mockReturnValue(mockOptions);
            modeSelector.selectedMode = GameModes.TIME_TRIAL;
            
            modeSelector.updateModeSelection();
            
            expect(mockOptions[0].classList.remove).toHaveBeenCalledWith('selected');
            expect(mockOptions[1].classList.add).toHaveBeenCalledWith('selected');
        });
    });

    describe('startSelectedMode', () => {
        it('should call onModeSelected callback and hide UI', () => {
            const mockCallback = jest.fn();
            modeSelector.setOnModeSelected(mockCallback);
            modeSelector.selectedMode = GameModes.TIME_TRIAL;
            
            modeSelector.startSelectedMode();
            
            expect(mockCallback).toHaveBeenCalledWith(GameModes.TIME_TRIAL);
        });

        it('should hide UI even without callback', () => {
            const mockSelector = { remove: jest.fn() };
            document.getElementById
                .mockReturnValueOnce(null) // For aiCountSelector in unblockUIControls
                .mockReturnValueOnce(null) // For difficultySelector in unblockUIControls
                .mockReturnValueOnce(mockSelector); // For mode-selector in hide()
            modeSelector.isVisible = true;
            
            modeSelector.startSelectedMode();
            
            expect(modeSelector.isVisible).toBe(false);
        });
        
        it('should unblock UI controls before starting', () => {
            const mockAiSelector = { style: { pointerEvents: 'none', opacity: '0.5' } };
            const mockDifficultySelector = { style: { pointerEvents: 'none', opacity: '0.5' } };
            const mockModeSelector = { remove: jest.fn() };
            
            document.getElementById
                .mockReturnValueOnce(mockAiSelector) // For aiCountSelector
                .mockReturnValueOnce(mockDifficultySelector) // For difficultySelector
                .mockReturnValueOnce(mockModeSelector); // For mode-selector in hide()
            
            modeSelector.isVisible = true;
            modeSelector.startSelectedMode();
            
            expect(mockAiSelector.style.pointerEvents).toBe('auto');
            expect(mockAiSelector.style.opacity).toBe('1');
            expect(mockDifficultySelector.style.pointerEvents).toBe('auto');
            expect(mockDifficultySelector.style.opacity).toBe('1');
        });
    });

    describe('getSelectedMode', () => {
        it('should return current selected mode', () => {
            modeSelector.selectedMode = GameModes.TIME_TRIAL;
            
            expect(modeSelector.getSelectedMode()).toBe(GameModes.TIME_TRIAL);
        });
    });

    describe('setOnModeSelected', () => {
        it('should set callback function', () => {
            const mockCallback = jest.fn();
            
            modeSelector.setOnModeSelected(mockCallback);
            
            expect(modeSelector.onModeSelected).toBe(mockCallback);
        });
    });

    describe('createModeOption', () => {
        it('should create mode option element', () => {
            const option = modeSelector.createModeOption(
                GameModes.CLASSIC,
                'Classic',
                'Test description'
            );
            
            expect(document.createElement).toHaveBeenCalledWith('div');
            expect(document.createElement).toHaveBeenCalledWith('h3');
            expect(document.createElement).toHaveBeenCalledWith('p');
        });

        it('should mark selected mode as selected', () => {
            modeSelector.selectedMode = GameModes.CLASSIC;
            
            const option = modeSelector.createModeOption(
                GameModes.CLASSIC,
                'Classic',
                'Test description'
            );
            
            expect(mockElement.classList.add).toHaveBeenCalledWith('selected');
        });
    });

    describe('addModeSelectionStyles', () => {
        it('should add styles if not already present', () => {
            document.getElementById.mockReturnValue(null);
            
            modeSelector.addModeSelectionStyles();
            
            expect(document.createElement).toHaveBeenCalledWith('style');
            expect(document.head.appendChild).toHaveBeenCalled();
        });

        it('should not add styles if already present', () => {
            document.getElementById.mockReturnValue(mockElement);
            
            modeSelector.addModeSelectionStyles();
            
            expect(document.head.appendChild).not.toHaveBeenCalled();
        });
    });

    describe('isShowing', () => {
        it('should return visibility state', () => {
            expect(modeSelector.isShowing()).toBe(false);
            
            modeSelector.isVisible = true;
            expect(modeSelector.isShowing()).toBe(true);
        });
    });

    describe('destroy', () => {
        it('should cleanup UI and styles', () => {
            const mockSelector = { remove: jest.fn() };
            const mockStyles = { remove: jest.fn() };
            
            document.getElementById
                .mockReturnValueOnce(mockSelector) // For hide()
                .mockReturnValueOnce(mockStyles);  // For styles cleanup
            
            modeSelector.isVisible = true;
            
            modeSelector.destroy();
            
            expect(mockSelector.remove).toHaveBeenCalled();
            expect(mockStyles.remove).toHaveBeenCalled();
        });

        it('should handle missing elements gracefully', () => {
            document.getElementById.mockReturnValue(null);
            
            expect(() => {
                modeSelector.destroy();
            }).not.toThrow();
        });
    });

    describe('UI state management', () => {
        it('should maintain consistent state during show/hide cycles', () => {
            expect(modeSelector.isVisible).toBe(false);
            
            modeSelector.show();
            expect(modeSelector.isVisible).toBe(true);
            
            modeSelector.hide();
            expect(modeSelector.isVisible).toBe(false);
        });

        it('should preserve selected mode across UI operations', () => {
            modeSelector.selectMode(GameModes.TIME_TRIAL);
            const selectedMode = modeSelector.getSelectedMode();
            
            modeSelector.show();
            modeSelector.hide();
            
            expect(modeSelector.getSelectedMode()).toBe(selectedMode);
        });
    });

    describe('persistence integration', () => {
        it('should persist mode selection immediately', () => {
            modeSelector.selectMode(GameModes.TIME_TRIAL);
            
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'lightbikes_selected_mode',
                GameModes.TIME_TRIAL
            );
        });

        it('should load persisted mode on initialization', () => {
            // Set up mock before creating instance
            localStorageMock.getItem.mockReturnValue(GameModes.TIME_TRIAL);
            
            const newSelector = new ModeSelector(mockGame);
            
            expect(newSelector.getSelectedMode()).toBe(GameModes.TIME_TRIAL);
        });
    });
    
    describe('verifyVisibility', () => {
        it('should check if element exists', () => {
            const mockSelector = { 
                offsetParent: document.body,
                style: {}
            };
            document.getElementById.mockReturnValue(mockSelector);
            
            modeSelector.verifyVisibility();
            
            expect(document.getElementById).toHaveBeenCalledWith('mode-selector');
        });
        
        it('should log warning if element not found', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            document.getElementById.mockReturnValue(null);
            
            modeSelector.verifyVisibility();
            
            expect(consoleSpy).toHaveBeenCalledWith('ModeSelector: Element not found after creation');
            consoleSpy.mockRestore();
        });
        
        it('should call forceVisibility if element not visible', () => {
            const mockSelector = { 
                offsetParent: null,
                style: {}
            };
            document.getElementById.mockReturnValue(mockSelector);
            const forceVisibilitySpy = jest.spyOn(modeSelector, 'forceVisibility');
            
            modeSelector.verifyVisibility();
            
            expect(forceVisibilitySpy).toHaveBeenCalledWith(mockSelector);
            forceVisibilitySpy.mockRestore();
        });
        
        it('should not call forceVisibility if element is visible', () => {
            const mockSelector = { 
                offsetParent: document.body,
                style: {}
            };
            document.getElementById.mockReturnValue(mockSelector);
            const forceVisibilitySpy = jest.spyOn(modeSelector, 'forceVisibility');
            
            modeSelector.verifyVisibility();
            
            expect(forceVisibilitySpy).not.toHaveBeenCalled();
            forceVisibilitySpy.mockRestore();
        });
    });
    
    describe('forceVisibility', () => {
        it('should apply inline styles to force visibility', () => {
            const mockElement = { style: {} };
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            modeSelector.forceVisibility(mockElement);
            
            expect(mockElement.style.display).toBe('block');
            expect(mockElement.style.visibility).toBe('visible');
            expect(mockElement.style.position).toBe('fixed');
            expect(mockElement.style.top).toBe('50%');
            expect(mockElement.style.left).toBe('50%');
            expect(mockElement.style.transform).toBe('translate(-50%, -50%)');
            expect(mockElement.style.zIndex).toBe('10000');
            expect(consoleSpy).toHaveBeenCalledWith('ModeSelector: Forced visibility with inline styles');
            consoleSpy.mockRestore();
        });
    });
    
    describe('blockUIControls', () => {
        it('should disable AI count selector', () => {
            const mockAiSelector = { style: {} };
            document.getElementById.mockReturnValueOnce(mockAiSelector);
            
            modeSelector.blockUIControls();
            
            expect(mockAiSelector.style.pointerEvents).toBe('none');
            expect(mockAiSelector.style.opacity).toBe('0.5');
        });
        
        it('should disable difficulty selector', () => {
            const mockDifficultySelector = { style: {} };
            document.getElementById
                .mockReturnValueOnce(null) // For aiCountSelector
                .mockReturnValueOnce(mockDifficultySelector); // For difficultySelector
            
            modeSelector.blockUIControls();
            
            expect(mockDifficultySelector.style.pointerEvents).toBe('none');
            expect(mockDifficultySelector.style.opacity).toBe('0.5');
        });
        
        it('should handle missing selectors gracefully', () => {
            document.getElementById.mockReturnValue(null);
            
            expect(() => {
                modeSelector.blockUIControls();
            }).not.toThrow();
        });
    });
    
    describe('unblockUIControls', () => {
        it('should enable AI count selector', () => {
            const mockAiSelector = { style: { pointerEvents: 'none', opacity: '0.5' } };
            document.getElementById.mockReturnValueOnce(mockAiSelector);
            
            modeSelector.unblockUIControls();
            
            expect(mockAiSelector.style.pointerEvents).toBe('auto');
            expect(mockAiSelector.style.opacity).toBe('1');
        });
        
        it('should enable difficulty selector', () => {
            const mockDifficultySelector = { style: { pointerEvents: 'none', opacity: '0.5' } };
            document.getElementById
                .mockReturnValueOnce(null) // For aiCountSelector
                .mockReturnValueOnce(mockDifficultySelector); // For difficultySelector
            
            modeSelector.unblockUIControls();
            
            expect(mockDifficultySelector.style.pointerEvents).toBe('auto');
            expect(mockDifficultySelector.style.opacity).toBe('1');
        });
        
        it('should handle missing selectors gracefully', () => {
            document.getElementById.mockReturnValue(null);
            
            expect(() => {
                modeSelector.unblockUIControls();
            }).not.toThrow();
        });
    });
});