/**
 * Unit tests for CameraEffectsUI class
 * Tests UI integration, DOM interactions, and settings synchronization
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

const { CameraEffectsUI } = require('@/effects/CameraEffectsUI.js');
const { setupUITest, createMockButtonGroup } = require('../helpers/ui-test-helpers.js');

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('CameraEffectsUI', () => {
    let cameraEffectsUI;
    let testSetup;
    let mockElements;
    let shakeIntensityButtons;
    let motionBlurQualityButtons;

    beforeEach(() => {
        // Reset localStorage mock
        localStorageMock.getItem.mockReturnValue(null);

        // Create mock button groups
        shakeIntensityButtons = createMockButtonGroup([
            { dataset: { intensity: '0' }, className: 'shake-intensity-btn' },
            { dataset: { intensity: '0.5' }, className: 'shake-intensity-btn' },
            { dataset: { intensity: '1.0' }, className: 'shake-intensity-btn' },
            { dataset: { intensity: '2.0' }, className: 'shake-intensity-btn' },
        ]);

        motionBlurQualityButtons = createMockButtonGroup([
            { dataset: { quality: 'low' }, className: 'quality-btn' },
            { dataset: { quality: 'medium' }, className: 'quality-btn' },
            { dataset: { quality: 'high' }, className: 'quality-btn' },
        ]);

        // Set up UI test with all required elements
        testSetup = setupUITest(
            [
                'cameraEffectsButton',
                'cameraEffectsPanel',
                'accessibilityWarning',
                'motionBlurToggle',
                'accessibilityModeToggle',
                'systemPreferencesToggle',
                'resetCameraEffectsSettings',
                'closeCameraEffectsSettings',
            ],
            {
                buttonGroups: {
                    '.shake-intensity-btn': shakeIntensityButtons,
                    '#cameraEffectsPanel .quality-btn': motionBlurQualityButtons,
                },
            }
        );

        mockElements = testSetup.mockElements;

        // Ensure panel has proper initial state
        mockElements.cameraEffectsPanel.style.display = 'none';

        // Create new instance - elements are fresh, no need to clear mocks
        cameraEffectsUI = new CameraEffectsUI();
    });

    afterEach(() => {
        if (cameraEffectsUI) {
            cameraEffectsUI.destroy();
        }
        if (testSetup) {
            testSetup.cleanup();
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
            expect(cameraEffectsUI.elements.button).toBeTruthy();
            expect(mockElements.cameraEffectsButton.addEventListener).toHaveBeenCalledWith(
                'click',
                expect.any(Function)
            );

            expect(cameraEffectsUI.elements.closeButton).toBeTruthy();
            expect(mockElements.closeCameraEffectsSettings.addEventListener).toHaveBeenCalledWith(
                'click',
                expect.any(Function)
            );

            expect(cameraEffectsUI.elements.resetButton).toBeTruthy();
            expect(mockElements.resetCameraEffectsSettings.addEventListener).toHaveBeenCalledWith(
                'click',
                expect.any(Function)
            );
        });

        it('should initialize elements correctly', () => {
            // Verify document.getElementById was called
            expect(document.getElementById).toHaveBeenCalledWith('cameraEffectsButton');
            expect(document.getElementById).toHaveBeenCalledWith('cameraEffectsPanel');

            // Elements should be assigned from the mocks
            expect(cameraEffectsUI.elements.button).not.toBeNull();
            expect(cameraEffectsUI.elements.panel).not.toBeNull();
            expect(cameraEffectsUI.elements.shakeIntensityButtons).toBeDefined();
        });
    });

    describe('panel visibility', () => {
        it('should show panel when showPanel is called', () => {
            cameraEffectsUI.showPanel();

            expect(mockElements.cameraEffectsPanel.style.display).toBe('block');
            expect(mockElements.cameraEffectsButton.classList.add).toHaveBeenCalledWith('active');
            expect(cameraEffectsUI.isVisible).toBe(true);
        });

        it('should hide panel when hidePanel is called', () => {
            cameraEffectsUI.showPanel();
            cameraEffectsUI.hidePanel();

            expect(mockElements.cameraEffectsPanel.style.display).toBe('none');
            expect(mockElements.cameraEffectsButton.classList.remove).toHaveBeenCalledWith(
                'active'
            );
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
                respectSystemPreferences: false,
            };

            cameraEffectsUI.updateUIFromSettings(newSettings);

            // Check that UI elements are updated (mocked behavior)
            expect(shakeIntensityButtons[3].classList.add).toHaveBeenCalledWith('active');
            expect(motionBlurQualityButtons[2].classList.add).toHaveBeenCalledWith('active');
        });
    });

    describe('settings updates', () => {
        it('should update shake intensity', () => {
            const spy = jest.spyOn(cameraEffectsUI.configManager, 'updateSettings');

            cameraEffectsUI.updateShakeIntensity(1.5);

            expect(spy).toHaveBeenCalledWith({
                shakeIntensity: 1.5,
                shakeEnabled: true,
            });
        });

        it('should disable shake when intensity is 0', () => {
            const spy = jest.spyOn(cameraEffectsUI.configManager, 'updateSettings');

            cameraEffectsUI.updateShakeIntensity(0);

            expect(spy).toHaveBeenCalledWith({
                shakeIntensity: 0,
                shakeEnabled: false,
            });
        });

        it('should toggle motion blur', () => {
            const spy = jest.spyOn(cameraEffectsUI.configManager, 'updateSettings');

            cameraEffectsUI.toggleMotionBlur();

            expect(spy).toHaveBeenCalledWith({
                motionBlurEnabled: expect.any(Boolean),
            });
        });

        it('should update motion blur quality', () => {
            const spy = jest.spyOn(cameraEffectsUI.configManager, 'updateSettings');

            cameraEffectsUI.updateMotionBlurQuality('high');

            expect(spy).toHaveBeenCalledWith({
                motionBlurQuality: 'high',
            });
        });

        it('should toggle accessibility mode', () => {
            const spy = jest.spyOn(cameraEffectsUI.configManager, 'updateSettings');

            cameraEffectsUI.toggleAccessibilityMode();

            expect(spy).toHaveBeenCalledWith({
                accessibilityMode: expect.any(Boolean),
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
            jest.spyOn(cameraEffectsUI.configManager, 'shouldDisableEffects').mockReturnValue(
                false
            );

            cameraEffectsUI.updateAccessibilityWarning();

            expect(mockElements.accessibilityWarning.classList.remove).toHaveBeenCalledWith('show');
        });
    });

    describe('toggle state updates', () => {
        it('should update toggle to active state', () => {
            const mockToggle = {
                classList: {
                    add: jest.fn(),
                    remove: jest.fn(),
                },
            };

            cameraEffectsUI.updateToggleState(mockToggle, true);

            expect(mockToggle.classList.add).toHaveBeenCalledWith('active');
        });

        it('should update toggle to inactive state', () => {
            const mockToggle = {
                classList: {
                    add: jest.fn(),
                    remove: jest.fn(),
                },
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
