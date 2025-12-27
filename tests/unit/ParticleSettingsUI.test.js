/**
 * Unit tests for ParticleSettingsUI class
 */

let ParticleSettingsUI;

describe('ParticleSettingsUI', () => {
    let particleSettingsUI;
    let mockElements;
    let getElementByIdSpy;
    let querySelectorAllSpy;

    beforeEach(() => {
        // Mock DOM elements
        const createMockEl = () => ({
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn(() => false) },
            style: {},
            contains: jest.fn(() => false),
            dataset: {},
        });

        mockElements = {
            settingsButton: createMockEl(),
            settingsPanel: createMockEl(),
            closeButton: createMockEl(),
            resetButton: createMockEl(),
            enabledToggle: createMockEl(),
            qualityButtons: [createMockEl(), createMockEl(), createMockEl()],
            trailSparksToggle: createMockEl(),
            explosionsToggle: createMockEl(),
            collectionsToggle: createMockEl(),
            densitySlider: { ...createMockEl(), value: '1.0' },
            densityValue: { textContent: '100%' },
            maxParticlesSlider: { ...createMockEl(), value: '200' },
            maxParticlesValue: { textContent: '200' },
            adaptiveQualityToggle: createMockEl(),
        };

        getElementByIdSpy = jest.spyOn(document, 'getElementById').mockImplementation((id) => {
            const elementMap = {
                particleSettingsButton: mockElements.settingsButton,
                particleSettingsPanel: mockElements.settingsPanel,
                closeParticleSettings: mockElements.closeButton,
                resetParticleSettings: mockElements.resetButton,
                particleEnabledToggle: mockElements.enabledToggle,
                trailSparksToggle: mockElements.trailSparksToggle,
                explosionsToggle: mockElements.explosionsToggle,
                collectionsToggle: mockElements.collectionsToggle,
                particleDensitySlider: mockElements.densitySlider,
                particleDensityValue: mockElements.densityValue,
                maxParticlesSlider: mockElements.maxParticlesSlider,
                maxParticlesValue: mockElements.maxParticlesValue,
                adaptiveQualityToggle: mockElements.adaptiveQualityToggle,
            };
            return elementMap[id] || null;
        });

        querySelectorAllSpy = jest
            .spyOn(document, 'querySelectorAll')
            .mockImplementation((selector) => {
                if (selector === '.quality-btn') return mockElements.qualityButtons;
                return [];
            });

        jest.isolateModules(() => {
            ParticleSettingsUI = require('@/ui/ParticleSettingsUI.js').ParticleSettingsUI;
        });

        jest.clearAllMocks();
        particleSettingsUI = new ParticleSettingsUI();
    });

    afterEach(() => {
        if (particleSettingsUI) particleSettingsUI.dispose();
        getElementByIdSpy.mockRestore();
        querySelectorAllSpy.mockRestore();
    });

    it('should initialize with DOM elements cached', () => {
        expect(getElementByIdSpy).toHaveBeenCalledWith('particleSettingsButton');
        expect(getElementByIdSpy).toHaveBeenCalledWith('particleSettingsPanel');
    });

    it('should show panel when showPanel is called', () => {
        particleSettingsUI.showPanel();
        expect(mockElements.settingsPanel.style.display).toBe('block');
        expect(mockElements.settingsButton.classList.add).toHaveBeenCalledWith('active');
        expect(particleSettingsUI.isVisible).toBe(true);
    });

    it('should close panel when closePanel is called', () => {
        particleSettingsUI.showPanel();
        particleSettingsUI.closePanel();
        expect(mockElements.settingsPanel.style.display).toBe('none');
        expect(mockElements.settingsButton.classList.remove).toHaveBeenCalledWith('active');
        expect(particleSettingsUI.isVisible).toBe(false);
    });

    it('should handle performance status updates', () => {
        const status = { degradationLevel: 2 };
        particleSettingsUI.updatePerformanceStatus(status);
        expect(mockElements.settingsButton.style.borderColor).toBe('#ff8c00');
    });

    it('should reset performance status', () => {
        const status = { degradationLevel: 0 };
        particleSettingsUI.updatePerformanceStatus(status);
        expect(mockElements.settingsButton.style.borderColor).toBe('white');
    });
});
