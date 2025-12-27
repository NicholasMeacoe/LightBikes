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

// Mock ColorPickerUI before requiring CustomizationUI
jest.mock('@/ui/ColorPickerUI.js', () => ({
    ColorPickerUI: jest.fn().mockImplementation(() => ({
        createElement: jest.fn().mockReturnValue(document.createElement('div')),
        setColor: jest.fn(),
        setOnColorChange: jest.fn(),
        showContrastWarning: jest.fn(),
        destroy: jest.fn(),
    })),
}));

const { CustomizationUI } = require('@/ui/CustomizationUI.js');
const { CustomizationManager } = require('@/systems/CustomizationManager.js');
const { PreferenceStorage } = require('@/systems/PreferenceStorage.js');

// Mock rendering engine
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
        getTrailStyle: jest.fn().mockReturnValue('solid'),
    },
};

// Mock preference storage
const mockPreferenceStorage = {
    loadPreferences: jest.fn().mockReturnValue({
        bikeColor: '#00FF00',
        trailColor: '#00FF00',
        trailStyle: 'solid',
        arenaTheme: 'classic-grid',
    }),
    savePreferences: jest.fn(),
};

describe('CustomizationUI Integration', () => {
    let customizationUI;
    let customizationManager;
    let createElementSpy;
    let addEventListenerSpy;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup document spies
        createElementSpy = jest.spyOn(document, 'createElement');
        addEventListenerSpy = jest.spyOn(document, 'addEventListener');
        jest.spyOn(document.body, 'appendChild').mockImplementation((el) => el);

        // Mock getElementById for specific elements
        jest.spyOn(document, 'getElementById').mockImplementation((id) => {
            if (id === 'customization-menu') return document.createElement('div');
            if (id === 'customization-preview') return document.createElement('div');
            if (id === 'customizationPanel') return customizationUI.panel;
            if (id === 'previewModeStatus') return document.createElement('span');
            return null;
        });

        // Create instances
        customizationManager = new CustomizationManager(mockRenderingEngine, mockPreferenceStorage);
        customizationUI = new CustomizationUI(customizationManager);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('initialization', () => {
        it('should initialize with customization manager', () => {
            expect(customizationUI.customizationManager).toBe(customizationManager);
        });

        it('should create panel', () => {
            expect(createElementSpy).toHaveBeenCalledWith('div');
            expect(document.body.appendChild).toHaveBeenCalled();
        });

        it('should setup event listeners', () => {
            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
            expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
        });
    });

    describe('preview functionality', () => {
        it('should enable preview mode', () => {
            customizationUI.togglePreviewMode();

            expect(customizationUI.previewMode).toBe(true);
            expect(customizationManager.previewMode).toBe(true);
        });

        it('should toggle preview mode back to disabled', () => {
            customizationUI.togglePreviewMode(); // Enable
            customizationUI.togglePreviewMode(); // Disable

            expect(customizationUI.previewMode).toBe(false);
            expect(customizationManager.previewMode).toBe(false);
        });
    });

    describe('reset functionality', () => {
        it('should reset all customizations to defaults', () => {
            customizationManager.setBikeColor('player', '#FF0000');
            customizationUI.resetToDefaults();

            expect(customizationManager.currentState.bikeColor).toBe('#00FF00');
        });
    });

    describe('visibility', () => {
        it('should show and hide panel', () => {
            customizationUI.show();
            expect(customizationUI.isVisible).toBe(true);
            expect(customizationUI.panel.style.display).toBe('block');

            customizationUI.hide();
            expect(customizationUI.isVisible).toBe(false);
            expect(customizationUI.panel.style.display).toBe('none');
        });

        it('should toggle visibility', () => {
            customizationUI.toggle();
            expect(customizationUI.isVisible).toBe(true);
            customizationUI.toggle();
            expect(customizationUI.isVisible).toBe(false);
        });
    });
});
