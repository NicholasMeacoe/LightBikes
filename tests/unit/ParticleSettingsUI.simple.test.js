/**
 * Simplified unit tests for ParticleSettingsUI class
 * Tests core functionality without complex DOM mocking
 */

const { ParticleSettingsUI } = require('./ParticleSettingsUI.js');

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

// Mock document with minimal DOM
global.document = {
    readyState: 'complete',
    getElementById: jest.fn(() => null), // Return null for all elements
    querySelectorAll: jest.fn(() => []), // Return empty array
    addEventListener: jest.fn()
};

// Mock confirm
global.confirm = jest.fn(() => true);

describe('ParticleSettingsUI Core Functionality', () => {
    let particleSettingsUI;

    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.clear();
        particleSettingsUI = new ParticleSettingsUI();
    });

    describe('settings integration', () => {
        it('should get ParticleSystem-compatible settings', () => {
            const settings = particleSettingsUI.getParticleSystemSettings();
            
            expect(settings).toHaveProperty('enabled');
            expect(settings).toHaveProperty('quality');
            expect(settings).toHaveProperty('maxParticles');
            expect(settings).toHaveProperty('effects');
            expect(settings).toHaveProperty('adaptiveQuality');
            expect(typeof settings.enabled).toBe('boolean');
            expect(['low', 'medium', 'high'].includes(settings.quality)).toBe(true);
            expect(typeof settings.maxParticles).toBe('number');
        });

        it('should get ParticleSettings instance', () => {
            const particleSettings = particleSettingsUI.getParticleSettings();
            
            expect(particleSettings).toBeDefined();
            expect(typeof particleSettings.getSettings).toBe('function');
            expect(typeof particleSettings.setSetting).toBe('function');
            expect(typeof particleSettings.setEnabled).toBe('function');
        });

        it('should handle settings changes', () => {
            const particleSettings = particleSettingsUI.getParticleSettings();
            
            // Change a setting
            particleSettings.setEnabled(false);
            
            // Get updated settings
            const settings = particleSettingsUI.getParticleSystemSettings();
            expect(settings.enabled).toBe(false);
        });
    });

    describe('external listeners', () => {
        it('should add and remove external listeners', () => {
            const listener = jest.fn();
            
            particleSettingsUI.addExternalListener(listener);
            expect(particleSettingsUI.externalListeners).toContain(listener);
            
            particleSettingsUI.removeExternalListener(listener);
            expect(particleSettingsUI.externalListeners).not.toContain(listener);
        });

        it('should notify external listeners on settings change', () => {
            const listener = jest.fn();
            particleSettingsUI.addExternalListener(listener);
            
            // Trigger a settings change through handleSettingChange
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

    describe('UI update methods', () => {
        it('should update toggle states safely', () => {
            const mockToggle = {
                classList: {
                    add: jest.fn(),
                    remove: jest.fn()
                }
            };
            
            // Should not throw when element exists
            expect(() => {
                particleSettingsUI.updateToggle(mockToggle, true);
            }).not.toThrow();
            
            expect(mockToggle.classList.add).toHaveBeenCalledWith('active');
            
            // Should not throw when element is null
            expect(() => {
                particleSettingsUI.updateToggle(null, true);
            }).not.toThrow();
        });

        it('should update density display safely', () => {
            const mockElement = { textContent: '100%' };
            
            // Should not throw when element exists
            expect(() => {
                particleSettingsUI.updateDensityDisplay(1.5);
            }).not.toThrow();
            
            // Test with mock element
            particleSettingsUI.elements.densityValue = mockElement;
            particleSettingsUI.updateDensityDisplay(1.5);
            expect(mockElement.textContent).toBe('150%');
        });

        it('should update max particles display safely', () => {
            const mockElement = { textContent: '200' };
            
            // Should not throw when element exists
            expect(() => {
                particleSettingsUI.updateMaxParticlesDisplay(300);
            }).not.toThrow();
            
            // Test with mock element
            particleSettingsUI.elements.maxParticlesValue = mockElement;
            particleSettingsUI.updateMaxParticlesDisplay(300);
            expect(mockElement.textContent).toBe('300');
        });

        it('should update quality buttons safely', () => {
            const mockButtons = [
                { dataset: { quality: 'low' }, classList: { add: jest.fn(), remove: jest.fn() } },
                { dataset: { quality: 'medium' }, classList: { add: jest.fn(), remove: jest.fn() } },
                { dataset: { quality: 'high' }, classList: { add: jest.fn(), remove: jest.fn() } }
            ];
            
            particleSettingsUI.elements.qualityButtons = mockButtons;
            
            particleSettingsUI.updateQualityButtons('medium');
            
            expect(mockButtons[1].classList.add).toHaveBeenCalledWith('active');
            expect(mockButtons[0].classList.remove).toHaveBeenCalledWith('active');
            expect(mockButtons[2].classList.remove).toHaveBeenCalledWith('active');
        });
    });

    describe('panel visibility', () => {
        it('should track visibility state', () => {
            expect(particleSettingsUI.isVisible).toBe(false);
            
            // Mock the panel element
            particleSettingsUI.elements.settingsPanel = { style: { display: 'none' } };
            particleSettingsUI.elements.settingsButton = { classList: { add: jest.fn(), remove: jest.fn() } };
            
            particleSettingsUI.showPanel();
            expect(particleSettingsUI.isVisible).toBe(true);
            
            particleSettingsUI.closePanel();
            expect(particleSettingsUI.isVisible).toBe(false);
        });

        it('should toggle panel visibility', () => {
            // Mock the panel element
            particleSettingsUI.elements.settingsPanel = { style: { display: 'none' } };
            particleSettingsUI.elements.settingsButton = { classList: { add: jest.fn(), remove: jest.fn() } };
            
            expect(particleSettingsUI.isVisible).toBe(false);
            
            particleSettingsUI.togglePanel();
            expect(particleSettingsUI.isVisible).toBe(true);
            
            particleSettingsUI.togglePanel();
            expect(particleSettingsUI.isVisible).toBe(false);
        });
    });

    describe('performance status updates', () => {
        it('should update performance status safely', () => {
            const mockButton = { 
                style: {},
                title: 'Particle Settings'
            };
            particleSettingsUI.elements.settingsButton = mockButton;
            
            const performanceStatus = {
                degradationLevel: 2,
                currentFPS: 45,
                averageFPS: 48
            };
            
            particleSettingsUI.updatePerformanceStatus(performanceStatus);
            
            expect(mockButton.style.borderColor).toBe('#ff8c00');
            expect(mockButton.title).toContain('Performance Mode: Level 2');
        });

        it('should reset performance status when no degradation', () => {
            const mockButton = { 
                style: {},
                title: 'Particle Settings'
            };
            particleSettingsUI.elements.settingsButton = mockButton;
            
            const performanceStatus = {
                degradationLevel: 0,
                currentFPS: 60,
                averageFPS: 58
            };
            
            particleSettingsUI.updatePerformanceStatus(performanceStatus);
            
            expect(mockButton.style.borderColor).toBe('white');
            expect(mockButton.title).toBe('Particle Settings');
        });
    });

    describe('import/export functionality', () => {
        it('should export settings', () => {
            const exported = particleSettingsUI.exportSettings();
            
            expect(typeof exported).toBe('string');
            expect(() => JSON.parse(exported)).not.toThrow();
            
            const parsed = JSON.parse(exported);
            expect(parsed).toHaveProperty('enabled');
            expect(parsed).toHaveProperty('quality');
        });

        it('should import settings', () => {
            const settingsData = JSON.stringify({
                enabled: false,
                quality: 'low'
            });
            
            const result = particleSettingsUI.importSettings(settingsData);
            
            expect(result).toBe(true);
            
            const settings = particleSettingsUI.getParticleSystemSettings();
            expect(settings.enabled).toBe(false);
            expect(settings.quality).toBe('low');
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
        });
    });

    describe('edge cases', () => {
        it('should handle missing DOM elements gracefully', () => {
            // Constructor already handles this case since we return null for all elements
            expect(particleSettingsUI).toBeDefined();
            expect(particleSettingsUI.elements).toBeDefined();
        });

        it('should handle settings changes when panel is not visible', () => {
            expect(() => {
                particleSettingsUI.handleSettingChange('enabled', false);
            }).not.toThrow();
        });

        it('should handle null elements in update methods', () => {
            expect(() => {
                particleSettingsUI.updateToggle(null, true);
                particleSettingsUI.updateQualityButtons('medium');
                particleSettingsUI.updateDensityDisplay(1.5);
                particleSettingsUI.updateMaxParticlesDisplay(300);
            }).not.toThrow();
        });
    });
});