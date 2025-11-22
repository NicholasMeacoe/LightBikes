const { GlowSettingsUI } = require('@/ui/GlowSettingsUI.js');
const { GlowSettings } = require('@/systems/GlowSettings.js');

describe('GlowSettingsUI', () => {
    let glowSettingsUI;
    let mockGlowSettings;
    let mockGlowEffectManager;
    let mockDOM;

    beforeEach(() => {
        // Mock GlowSettings
        mockGlowSettings = {
            getIntensity: jest.fn(() => 'MEDIUM'),
            setIntensity: jest.fn(() => true),
            getIntensityConfig: jest.fn(() => ({ emissive: 0.6, bloom: 1.0, label: 'Medium' })),
            getIntensityLabel: jest.fn(() => 'Medium'),
            resetToDefaults: jest.fn()
        };

        // Mock GlowEffectManager
        mockGlowEffectManager = {
            setIntensity: jest.fn()
        };

        // Mock DOM elements
        mockDOM = {
            settingsButton: {
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                classList: { add: jest.fn(), remove: jest.fn() },
                style: {},
                title: ''
            },
            settingsPanel: {
                style: { display: 'none' },
                contains: jest.fn(() => false)
            },
            previewLevel: {
                style: { width: '', boxShadow: '' }
            },
            currentIntensityLabel: {
                textContent: ''
            },
            intensityButtons: [
                { dataset: { intensity: 'OFF' }, addEventListener: jest.fn(), classList: { add: jest.fn(), remove: jest.fn() } },
                { dataset: { intensity: 'LOW' }, addEventListener: jest.fn(), classList: { add: jest.fn(), remove: jest.fn() } },
                { dataset: { intensity: 'MEDIUM' }, addEventListener: jest.fn(), classList: { add: jest.fn(), remove: jest.fn() } },
                { dataset: { intensity: 'HIGH' }, addEventListener: jest.fn(), classList: { add: jest.fn(), remove: jest.fn() } }
            ],
            closeButton: { addEventListener: jest.fn() },
            resetButton: { addEventListener: jest.fn() }
        };

        // Mock document methods
        global.document = {
            getElementById: jest.fn((id) => {
                switch (id) {
                    case 'glowSettingsButton': return mockDOM.settingsButton;
                    case 'glowSettingsPanel': return mockDOM.settingsPanel;
                    case 'glowPreviewLevel': return mockDOM.previewLevel;
                    case 'currentIntensityLabel': return mockDOM.currentIntensityLabel;
                    case 'closeGlowSettings': return mockDOM.closeButton;
                    case 'resetGlowSettings': return mockDOM.resetButton;
                    default: return null;
                }
            }),
            querySelectorAll: jest.fn(() => mockDOM.intensityButtons),
            addEventListener: jest.fn()
        };

        // Mock Array.from for querySelectorAll result
        global.Array = {
            ...Array,
            from: jest.fn((arrayLike) => arrayLike || [])
        };

        global.window = {
            innerWidth: 1024,
            innerHeight: 768
        };
    }); 
   describe('constructor and initialization', () => {
        it('should initialize with correct dependencies', () => {
            glowSettingsUI = new GlowSettingsUI(mockGlowSettings, mockGlowEffectManager);
            
            expect(glowSettingsUI.glowSettings).toBe(mockGlowSettings);
            expect(glowSettingsUI.glowEffectManager).toBe(mockGlowEffectManager);
            expect(glowSettingsUI.isVisible).toBe(false);
        });

        it('should set up event listeners on initialization', () => {
            glowSettingsUI = new GlowSettingsUI(mockGlowSettings, mockGlowEffectManager);
            
            expect(mockDOM.settingsButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            expect(mockDOM.closeButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            expect(mockDOM.resetButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            
            mockDOM.intensityButtons.forEach(button => {
                expect(button.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            });
        });

        it('should update UI on initialization', () => {
            glowSettingsUI = new GlowSettingsUI(mockGlowSettings, mockGlowEffectManager);
            
            expect(mockGlowSettings.getIntensity).toHaveBeenCalled();
            expect(mockGlowSettings.getIntensityConfig).toHaveBeenCalled();
        });
    });

    describe('panel visibility', () => {
        beforeEach(() => {
            glowSettingsUI = new GlowSettingsUI(mockGlowSettings, mockGlowEffectManager);
        });

        it('should show panel when togglePanel is called and panel is hidden', () => {
            glowSettingsUI.showPanel();
            
            expect(mockDOM.settingsPanel.style.display).toBe('block');
            expect(glowSettingsUI.isVisible).toBe(true);
            expect(mockDOM.settingsButton.classList.add).toHaveBeenCalledWith('active');
        });

        it('should hide panel when togglePanel is called and panel is visible', () => {
            glowSettingsUI.showPanel();
            glowSettingsUI.hidePanel();
            
            expect(mockDOM.settingsPanel.style.display).toBe('none');
            expect(glowSettingsUI.isVisible).toBe(false);
            expect(mockDOM.settingsButton.classList.remove).toHaveBeenCalledWith('active');
        });

        it('should toggle panel visibility correctly', () => {
            expect(glowSettingsUI.isVisible).toBe(false);
            
            glowSettingsUI.togglePanel();
            expect(glowSettingsUI.isVisible).toBe(true);
            
            glowSettingsUI.togglePanel();
            expect(glowSettingsUI.isVisible).toBe(false);
        });
    });

    describe('intensity setting', () => {
        beforeEach(() => {
            glowSettingsUI = new GlowSettingsUI(mockGlowSettings, mockGlowEffectManager);
        });

        it('should set intensity and apply to glow effect manager', () => {
            glowSettingsUI.setIntensity('HIGH');
            
            expect(mockGlowSettings.setIntensity).toHaveBeenCalledWith('HIGH');
            expect(mockGlowEffectManager.setIntensity).toHaveBeenCalledWith('HIGH');
        });

        it('should not apply intensity if setting fails', () => {
            mockGlowSettings.setIntensity.mockReturnValue(false);
            
            glowSettingsUI.setIntensity('INVALID');
            
            expect(mockGlowSettings.setIntensity).toHaveBeenCalledWith('INVALID');
            expect(mockGlowEffectManager.setIntensity).not.toHaveBeenCalled();
        });

        it('should reset settings and apply to glow effect manager', () => {
            glowSettingsUI.resetSettings();
            
            expect(mockGlowSettings.resetToDefaults).toHaveBeenCalled();
            expect(mockGlowEffectManager.setIntensity).toHaveBeenCalledWith('MEDIUM');
        });
    });

    describe('UI updates', () => {
        beforeEach(() => {
            glowSettingsUI = new GlowSettingsUI(mockGlowSettings, mockGlowEffectManager);
        });

        it('should update intensity buttons correctly', () => {
            mockGlowSettings.getIntensity.mockReturnValue('HIGH');
            
            glowSettingsUI.updateUI();
            
            // HIGH button should be active
            expect(mockDOM.intensityButtons[3].classList.add).toHaveBeenCalledWith('active');
            
            // Other buttons should not be active
            expect(mockDOM.intensityButtons[0].classList.remove).toHaveBeenCalledWith('active');
            expect(mockDOM.intensityButtons[1].classList.remove).toHaveBeenCalledWith('active');
            expect(mockDOM.intensityButtons[2].classList.remove).toHaveBeenCalledWith('active');
        });

        it('should update preview for different intensity levels', () => {
            // Test OFF intensity
            mockGlowSettings.getIntensity.mockReturnValue('OFF');
            mockGlowSettings.getIntensityConfig.mockReturnValue({ emissive: 0, bloom: 0, label: 'Off' });
            
            glowSettingsUI.updatePreview('OFF', { emissive: 0, bloom: 0, label: 'Off' });
            
            expect(mockDOM.currentIntensityLabel.textContent).toBe('Off');
            expect(mockDOM.previewLevel.style.width).toBe('0%');
            expect(mockDOM.previewLevel.style.boxShadow).toBe('none');
            
            // Test HIGH intensity
            glowSettingsUI.updatePreview('HIGH', { emissive: 0.8, bloom: 1.5, label: 'High' });
            
            expect(mockDOM.currentIntensityLabel.textContent).toBe('High');
            expect(mockDOM.previewLevel.style.width).toBe('100%');
            expect(mockDOM.previewLevel.style.boxShadow).toContain('rgba(0, 255, 255');
        });

        it('should update button state based on intensity', () => {
            // Test OFF state
            glowSettingsUI.updateButtonState('OFF');
            expect(mockDOM.settingsButton.style.opacity).toBe('0.6');
            expect(mockDOM.settingsButton.title).toContain('Currently Off');
            
            // Test enabled state
            mockGlowSettings.getIntensityLabel.mockReturnValue('High');
            glowSettingsUI.updateButtonState('HIGH');
            expect(mockDOM.settingsButton.style.opacity).toBe('1.0');
            expect(mockDOM.settingsButton.title).toContain('High');
        });
    });

    describe('window resize handling', () => {
        beforeEach(() => {
            glowSettingsUI = new GlowSettingsUI(mockGlowSettings, mockGlowEffectManager);
            mockDOM.settingsPanel.getBoundingClientRect = jest.fn(() => ({
                right: 500,
                bottom: 400,
                width: 300,
                height: 200
            }));
        });

        it('should adjust panel position when it exceeds viewport', () => {
            glowSettingsUI.isVisible = true;
            global.window.innerWidth = 400; // Panel would exceed right edge
            
            glowSettingsUI.handleResize();
            
            expect(mockDOM.settingsPanel.style.left).toBe('80px'); // 400 - 300 - 20
        });

        it('should not adjust position when panel is not visible', () => {
            glowSettingsUI.isVisible = false;
            
            glowSettingsUI.handleResize();
            
            expect(mockDOM.settingsPanel.style.left).toBeUndefined();
        });
    });

    describe('cleanup', () => {
        beforeEach(() => {
            glowSettingsUI = new GlowSettingsUI(mockGlowSettings, mockGlowEffectManager);
        });

        it('should clean up resources and references', () => {
            glowSettingsUI.destroy();
            
            expect(glowSettingsUI.glowSettings).toBeNull();
            expect(glowSettingsUI.glowEffectManager).toBeNull();
            expect(glowSettingsUI.settingsButton).toBeNull();
            expect(glowSettingsUI.settingsPanel).toBeNull();
            expect(glowSettingsUI.intensityButtons).toEqual([]);
        });
    });
});