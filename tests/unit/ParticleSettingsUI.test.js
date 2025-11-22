/**
 * Unit tests for ParticleSettingsUI class
 * Tests UI integration, DOM interactions, and settings synchronization
 */

const { ParticleSettingsUI } = require('@/ui/ParticleSettingsUI.js');

// Mock DOM elements
const mockElements = {
    settingsButton: { addEventListener: jest.fn(), classList: { add: jest.fn(), remove: jest.fn() }, style: {} },
    settingsPanel: { style: { display: 'none' } },
    closeButton: { addEventListener: jest.fn() },
    resetButton: { addEventListener: jest.fn() },
    enabledToggle: { addEventListener: jest.fn(), classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn() } },
    qualityButtons: [
        { addEventListener: jest.fn(), dataset: { quality: 'low' }, classList: { add: jest.fn(), remove: jest.fn() } },
        { addEventListener: jest.fn(), dataset: { quality: 'medium' }, classList: { add: jest.fn(), remove: jest.fn() } },
        { addEventListener: jest.fn(), dataset: { quality: 'high' }, classList: { add: jest.fn(), remove: jest.fn() } }
    ],
    trailSparksToggle: { addEventListener: jest.fn(), classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn() } },
    explosionsToggle: { addEventListener: jest.fn(), classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn() } },
    collectionsToggle: { addEventListener: jest.fn(), classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn() } },
    densitySlider: { addEventListener: jest.fn(), value: '1.0' },
    densityValue: { textContent: '100%' },
    maxParticlesSlider: { addEventListener: jest.fn(), value: '200' },
    maxParticlesValue: { textContent: '200' },
    adaptiveQualityToggle: { addEventListener: jest.fn(), classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn() } }
};

// Mock document methods
const mockDocument = {
    readyState: 'complete',
    getElementById: jest.fn((id) => {
        const elementMap = {
            'particleSettingsButton': mockElements.settingsButton,
            'particleSettingsPanel': mockElements.settingsPanel,
            'closeParticleSettings': mockElements.closeButton,
            'resetParticleSettings': mockElements.resetButton,
            'particleEnabledToggle': mockElements.enabledToggle,
            'trailSparksToggle': mockElements.trailSparksToggle,
            'explosionsToggle': mockElements.explosionsToggle,
            'collectionsToggle': mockElements.collectionsToggle,
            'particleDensitySlider': mockElements.densitySlider,
            'particleDensityValue': mockElements.densityValue,
            'maxParticlesSlider': mockElements.maxParticlesSlider,
            'maxParticlesValue': mockElements.maxParticlesValue,
            'adaptiveQualityToggle': mockElements.adaptiveQualityToggle
        };
        return elementMap[id] || null;
    }),
    querySelectorAll: jest.fn((selector) => {
        if (selector === '.quality-btn') {
            return mockElements.qualityButtons;
        }
        return [];
    }),
    addEventListener: jest.fn()
};

// Mock global objects
global.document = mockDocument;
global.confirm = jest.fn(() => true);

// Mock localStorage
const localStorageMock = {
    store: {},
    getItem: jest.fn((key) => localStorageMock.store[key] || null),
    setItem: jest.fn((key, value) => {
        localStorageMock.store[key] = value;
    }),
    clear: jest.fn(() => {
        localStorageMock.store = {};
    })
};
global.localStorage = localStorageMock;

describe('ParticleSettingsUI', () => {
    let particleSettingsUI;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
        localStorageMock.clear();
        
        // Reset mock element states
        Object.values(mockElements).forEach(element => {
            if (element.classList) {
                element.classList.contains = jest.fn(() => false);
            }
        });
        
        // Create new instance - constructor will call initialize() immediately
        particleSettingsUI = new ParticleSettingsUI();
    });

    describe('initialization', () => {
        it('should initialize with DOM elements cached', () => {
            // The constructor calls initialize() which calls cacheElements()
            expect(mockDocument.getElementById).toHaveBeenCalledWith('particleSettingsButton');
            expect(mockDocument.getElementById).toHaveBeenCalledWith('particleSettingsPanel');
            expect(mockDocument.querySelectorAll).toHaveBeenCalledWith('.quality-btn');
        });

        it('should bind event listeners to elements', () => {
            // Check if elements exist before checking event listeners
            if (particleSettingsUI.elements.settingsButton) {
                expect(mockElements.settingsButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            }
            if (particleSettingsUI.elements.closeButton) {
                expect(mockElements.closeButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            }
            if (particleSettingsUI.elements.resetButton) {
                expect(mockElements.resetButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            }
        });

        it('should bind toggle event listeners', () => {
            expect(mockElements.enabledToggle.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            expect(mockElements.trailSparksToggle.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            expect(mockElements.explosionsToggle.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            expect(mockElements.collectionsToggle.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
        });

        it('should bind slider event listeners', () => {
            expect(mockElements.densitySlider.addEventListener).toHaveBeenCalledWith('input', expect.any(Function));
            expect(mockElements.maxParticlesSlider.addEventListener).toHaveBeenCalledWith('input', expect.any(Function));
        });

        it('should bind quality button event listeners', () => {
            mockElements.qualityButtons.forEach(button => {
                expect(button.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            });
        });
    });

    describe('panel visibility', () => {
        it('should show panel when toggle is called', () => {
            particleSettingsUI.showPanel();
            
            expect(mockElements.settingsPanel.style.display).toBe('block');
            expect(mockElements.settingsButton.classList.add).toHaveBeenCalledWith('active');
            expect(particleSettingsUI.isVisible).toBe(true);
        });

        it('should close panel when close is called', () => {
            particleSettingsUI.showPanel();
            particleSettingsUI.closePanel();
            
            expect(mockElements.settingsPanel.style.display).toBe('none');
            expect(mockElements.settingsButton.classList.remove).toHaveBeenCalledWith('active');
            expect(particleSettingsUI.isVisible).toBe(false);
        });

        it('should toggle panel visibility', () => {
            // First toggle should show
            particleSettingsUI.togglePanel();
            expect(particleSettingsUI.isVisible).toBe(true);
            
            // Second toggle should hide
            particleSettingsUI.togglePanel();
            expect(particleSettingsUI.isVisible).toBe(false);
        });
    });

    describe('settings integration', () => {
        it('should get ParticleSystem-compatible settings', () => {
            const settings = particleSettingsUI.getParticleSystemSettings();
            
            expect(settings).toHaveProperty('enabled');
            expect(settings).toHaveProperty('quality');
            expect(settings).toHaveProperty('maxParticles');
            expect(settings).toHaveProperty('effects');
            expect(settings).toHaveProperty('adaptiveQuality');
        });

        it('should get ParticleSettings instance', () => {
            const particleSettings = particleSettingsUI.getParticleSettings();
            
            expect(particleSettings).toBeDefined();
            expect(typeof particleSettings.getSettings).toBe('function');
        });
    });

    describe('UI updates', () => {
        it('should update toggle states', () => {
            particleSettingsUI.updateToggle(mockElements.enabledToggle, true);
            expect(mockElements.enabledToggle.classList.add).toHaveBeenCalledWith('active');
            
            particleSettingsUI.updateToggle(mockElements.enabledToggle, false);
            expect(mockElements.enabledToggle.classList.remove).toHaveBeenCalledWith('active');
        });

        it('should update quality buttons', () => {
            particleSettingsUI.updateQualityButtons('medium');
            
            expect(mockElements.qualityButtons[1].classList.add).toHaveBeenCalledWith('active');
            expect(mockElements.qualityButtons[0].classList.remove).toHaveBeenCalledWith('active');
            expect(mockElements.qualityButtons[2].classList.remove).toHaveBeenCalledWith('active');
        });

        it('should update density display', () => {
            particleSettingsUI.updateDensityDisplay(1.5);
            
            expect(mockElements.densityValue.textContent).toBe('150%');
        });

        it('should update max particles display', () => {
            particleSettingsUI.updateMaxParticlesDisplay(300);
            
            expect(mockElements.maxParticlesValue.textContent).toBe('300');
        });

        it('should update density slider', () => {
            particleSettingsUI.updateDensitySlider(0.8);
            
            expect(mockElements.densitySlider.value).toBe(0.8);
            expect(mockElements.densityValue.textContent).toBe('80%');
        });

        it('should update max particles slider', () => {
            particleSettingsUI.updateMaxParticlesSlider(150);
            
            expect(mockElements.maxParticlesSlider.value).toBe(150);
            expect(mockElements.maxParticlesValue.textContent).toBe('150');
        });
    });

    describe('external listeners', () => {
        it('should add external listeners', () => {
            const listener = jest.fn();
            particleSettingsUI.addExternalListener(listener);
            
            expect(particleSettingsUI.externalListeners).toContain(listener);
        });

        it('should remove external listeners', () => {
            const listener = jest.fn();
            particleSettingsUI.addExternalListener(listener);
            particleSettingsUI.removeExternalListener(listener);
            
            expect(particleSettingsUI.externalListeners).not.toContain(listener);
        });

        it('should notify external listeners on settings change', () => {
            const listener = jest.fn();
            particleSettingsUI.addExternalListener(listener);
            
            // Trigger a settings change
            particleSettingsUI.handleSettingChange('enabled', false);
            
            expect(listener).toHaveBeenCalledWith('enabled', false);
        });

        it('should handle listener errors gracefully', () => {
            const errorListener = jest.fn(() => {
                throw new Error('Listener error');
            });
            const goodListener = jest.fn();
            
            particleSettingsUI.addExternalListener(errorListener);
            particleSettingsUI.addExternalListener(goodListener);
            
            expect(() => {
                particleSettingsUI.handleSettingChange('enabled', false);
            }).not.toThrow();
            
            expect(goodListener).toHaveBeenCalled();
        });
    });

    describe('performance status updates', () => {
        it('should update performance status in UI', () => {
            const performanceStatus = {
                degradationLevel: 2,
                currentFPS: 45,
                averageFPS: 48
            };
            
            particleSettingsUI.updatePerformanceStatus(performanceStatus);
            
            expect(mockElements.settingsButton.style.borderColor).toBe('#ff8c00');
            expect(mockElements.settingsButton.title).toContain('Performance Mode: Level 2');
        });

        it('should reset performance status when no degradation', () => {
            const performanceStatus = {
                degradationLevel: 0,
                currentFPS: 60,
                averageFPS: 58
            };
            
            particleSettingsUI.updatePerformanceStatus(performanceStatus);
            
            expect(mockElements.settingsButton.style.borderColor).toBe('white');
            expect(mockElements.settingsButton.title).toBe('Particle Settings');
        });
    });

    describe('import/export functionality', () => {
        it('should export settings', () => {
            const exported = particleSettingsUI.exportSettings();
            
            expect(typeof exported).toBe('string');
            expect(() => JSON.parse(exported)).not.toThrow();
        });

        it('should import settings', () => {
            const settingsData = JSON.stringify({
                enabled: false,
                quality: 'low'
            });
            
            const result = particleSettingsUI.importSettings(settingsData);
            
            expect(result).toBe(true);
        });

        it('should handle invalid import data', () => {
            const result = particleSettingsUI.importSettings('invalid json');
            
            expect(result).toBe(false);
        });
    });

    describe('reset functionality', () => {
        it('should reset settings when confirmed', () => {
            global.confirm.mockReturnValue(true);
            
            const particleSettings = particleSettingsUI.getParticleSettings();
            const resetSpy = jest.spyOn(particleSettings, 'resetToDefaults');
            
            particleSettingsUI.resetSettings();
            
            expect(global.confirm).toHaveBeenCalledWith('Reset all particle settings to defaults?');
            expect(resetSpy).toHaveBeenCalled();
        });

        it('should not reset settings when cancelled', () => {
            global.confirm.mockReturnValue(false);
            
            const particleSettings = particleSettingsUI.getParticleSettings();
            const resetSpy = jest.spyOn(particleSettings, 'resetToDefaults');
            
            particleSettingsUI.resetSettings();
            
            expect(resetSpy).not.toHaveBeenCalled();
        });
    });

    describe('disposal', () => {
        it('should dispose of resources properly', () => {
            const particleSettings = particleSettingsUI.getParticleSettings();
            const removeListenerSpy = jest.spyOn(particleSettings, 'removeChangeListener');
            
            particleSettingsUI.dispose();
            
            expect(removeListenerSpy).toHaveBeenCalled();
            expect(particleSettingsUI.elements).toEqual({});
            expect(particleSettingsUI.externalListeners).toEqual([]);
        });
    });

    describe('edge cases', () => {
        it('should handle missing DOM elements gracefully', () => {
            mockDocument.getElementById.mockReturnValue(null);
            
            expect(() => {
                new ParticleSettingsUI();
            }).not.toThrow();
        });

        it('should handle empty quality buttons list', () => {
            mockDocument.querySelectorAll.mockReturnValue([]);
            
            expect(() => {
                new ParticleSettingsUI();
            }).not.toThrow();
        });

        it('should handle settings changes when panel is not visible', () => {
            expect(() => {
                particleSettingsUI.handleSettingChange('enabled', false);
            }).not.toThrow();
        });
    });
});