// --- Mock Setup Start ---
const localStorageStore = {};

const localStorageMock = {
    store: localStorageStore,
    getItem: jest.fn((key) => {
        const val = localStorageStore[key] || null;
        return val;
    }),
    setItem: jest.fn((key, value) => {
        localStorageStore[key] = value ? value.toString() : '';
    }),
    clear: jest.fn(() => {
        Object.keys(localStorageStore).forEach((key) => delete localStorageStore[key]);
    }),
    removeItem: jest.fn((key) => {
        delete localStorageStore[key];
    }),
};

// Extremely aggressive mocking
if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        enumerable: true,
        configurable: true,
        writable: true,
    });
}
global.localStorage = localStorageMock;

// Also spy on the prototype just in case something bypasses the object property
try {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(localStorageMock.getItem);
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(localStorageMock.setItem);
    jest.spyOn(Storage.prototype, 'clear').mockImplementation(localStorageMock.clear);
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(localStorageMock.removeItem);
} catch (e) {
    // Some environments might freeze Storage.prototype
}

// Mock Logger
const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
};
const MockLoggerClass = jest.fn().mockImplementation(() => mockLogger);
MockLoggerClass.create = jest.fn(() => mockLogger);
jest.mock('@/utils/Logger.js', () => ({
    Logger: MockLoggerClass,
    logger: mockLogger,
    createLogger: jest.fn(() => mockLogger),
}));

// Now require the module under test AFTER mocks are set up
const { ParticleSettings } = require('@/systems/ParticleSettings.js');
// --- Mock Setup End ---

describe('ParticleSettings', () => {
    let particleSettings;

    beforeEach(() => {
        // Clear localStorage mock
        localStorageMock.clear();
        localStorageMock.getItem.mockClear();
        localStorageMock.setItem.mockClear();

        // Create new instance
        particleSettings = new ParticleSettings();
    });

    describe('constructor and initialization', () => {
        it('should initialize with default settings when localStorage is empty', () => {
            const settings = particleSettings.getSettings();

            expect(settings.enabled).toBe(true);
            expect(settings.quality).toBe('medium');
            expect(settings.effects.trailSparks).toBe(true);
            expect(settings.effects.explosions).toBe(true);
            expect(settings.effects.collections).toBe(true);
            expect(settings.performance.maxParticles).toBe(200);
            expect(settings.performance.adaptiveQuality).toBe(true);
        });

        it('should load settings from localStorage when available', () => {
            const storedSettings = {
                enabled: false,
                quality: 'low',
                effects: {
                    trailSparks: false,
                    explosions: true,
                    collections: false,
                },
            };

            const storedSettingsJson = JSON.stringify(storedSettings);
            localStorageMock.getItem.mockReturnValueOnce(storedSettingsJson);

            const newSettings = new ParticleSettings();
            const settings = newSettings.getSettings();

            expect(settings.enabled).toBe(false);
            expect(settings.quality).toBe('low');
            expect(settings.effects.trailSparks).toBe(false);
            expect(settings.effects.explosions).toBe(true);
            expect(settings.effects.collections).toBe(false);
        });

        it('should handle corrupted localStorage data gracefully', () => {
            localStorageMock.store['lightbikes_particle_settings'] = 'invalid json';

            const newSettings = new ParticleSettings();
            const settings = newSettings.getSettings();

            // Should fall back to defaults
            expect(settings.enabled).toBe(true);
            expect(settings.quality).toBe('medium');
        });
    });

    describe('setting individual values', () => {
        it('should update enabled setting', () => {
            const result = particleSettings.setSetting('enabled', false);

            expect(result).toBe(true);
            expect(particleSettings.getSettings().enabled).toBe(false);
            expect(localStorageMock.setItem).toHaveBeenCalled();
        });

        it('should update quality setting', () => {
            const result = particleSettings.setSetting('quality', 'high');

            expect(result).toBe(true);
            expect(particleSettings.getSettings().quality).toBe('high');
        });

        it('should update nested effect settings', () => {
            const result = particleSettings.setSetting('effects.trailSparks', false);

            expect(result).toBe(true);
            expect(particleSettings.getSettings().effects.trailSparks).toBe(false);
        });

        it('should update performance settings', () => {
            const result = particleSettings.setSetting('performance.maxParticles', 300);

            expect(result).toBe(true);
            expect(particleSettings.getSettings().performance.maxParticles).toBe(300);
        });

        it('should update advanced settings', () => {
            const result = particleSettings.setSetting('advanced.particleDensity', 1.5);

            expect(result).toBe(true);
            expect(particleSettings.getSettings().advanced.particleDensity).toBe(1.5);
        });

        it('should reject invalid values', () => {
            const result = particleSettings.setSetting('quality', 'invalid');

            expect(result).toBe(false);
            expect(particleSettings.getSettings().quality).toBe('medium'); // Should remain default
        });

        it('should reject out-of-range values', () => {
            const result = particleSettings.setSetting('performance.maxParticles', 1000);

            expect(result).toBe(false);
            expect(particleSettings.getSettings().performance.maxParticles).toBe(200); // Should remain default
        });
    });

    describe('convenience methods', () => {
        it('should set enabled state', () => {
            const result = particleSettings.setEnabled(false);

            expect(result).toBe(true);
            expect(particleSettings.getSettings().enabled).toBe(false);
        });

        it('should set quality level', () => {
            const result = particleSettings.setQuality('high');

            expect(result).toBe(true);
            expect(particleSettings.getSettings().quality).toBe('high');
        });

        it('should set effect enabled state', () => {
            const result = particleSettings.setEffectEnabled('trailSparks', false);

            expect(result).toBe(true);
            expect(particleSettings.getSettings().effects.trailSparks).toBe(false);
        });

        it('should set particle density', () => {
            const result = particleSettings.setParticleDensity(0.5);

            expect(result).toBe(true);
            expect(particleSettings.getSettings().advanced.particleDensity).toBe(0.5);
        });

        it('should set max particles', () => {
            const result = particleSettings.setMaxParticles(150);

            expect(result).toBe(true);
            expect(particleSettings.getSettings().performance.maxParticles).toBe(150);
        });

        it('should set adaptive quality', () => {
            const result = particleSettings.setAdaptiveQuality(false);

            expect(result).toBe(true);
            expect(particleSettings.getSettings().performance.adaptiveQuality).toBe(false);
        });
    });

    describe('quality presets', () => {
        it('should apply low quality preset', () => {
            const result = particleSettings.applyQualityPreset('low');

            expect(result).toBe(true);
            const settings = particleSettings.getSettings();
            expect(settings.quality).toBe('low');
            expect(settings.performance.maxParticles).toBe(100);
            expect(settings.advanced.particleDensity).toBe(0.7);
        });

        it('should apply medium quality preset', () => {
            const result = particleSettings.applyQualityPreset('medium');

            expect(result).toBe(true);
            const settings = particleSettings.getSettings();
            expect(settings.quality).toBe('medium');
            expect(settings.performance.maxParticles).toBe(200);
            expect(settings.advanced.particleDensity).toBe(1.0);
        });

        it('should apply high quality preset', () => {
            const result = particleSettings.applyQualityPreset('high');

            expect(result).toBe(true);
            const settings = particleSettings.getSettings();
            expect(settings.quality).toBe('high');
            expect(settings.performance.maxParticles).toBe(300);
            expect(settings.advanced.particleDensity).toBe(1.3);
            expect(settings.performance.adaptiveQuality).toBe(false);
        });

        it('should reject invalid preset', () => {
            const result = particleSettings.applyQualityPreset('invalid');

            expect(result).toBe(false);
        });

        it('should get available presets', () => {
            const presets = particleSettings.getAvailablePresets();

            expect(presets).toEqual(['low', 'medium', 'high']);
        });

        it('should detect current preset', () => {
            particleSettings.applyQualityPreset('low');

            const currentPreset = particleSettings.getCurrentPreset();
            expect(currentPreset).toBe('low');
        });

        it('should return null for custom settings', () => {
            particleSettings.setSetting('advanced.particleDensity', 0.8); // Custom value

            const currentPreset = particleSettings.getCurrentPreset();
            expect(currentPreset).toBe(null);
        });
    });

    describe('bulk operations', () => {
        it('should update multiple settings', () => {
            const newSettings = {
                enabled: false,
                quality: 'low',
                effects: {
                    trailSparks: false,
                },
            };

            const result = particleSettings.updateSettings(newSettings);

            expect(result).toBe(true);
            const settings = particleSettings.getSettings();
            expect(settings.enabled).toBe(false);
            expect(settings.quality).toBe('low');
            expect(settings.effects.trailSparks).toBe(false);
        });

        it('should reset to defaults', () => {
            // Change some settings first
            particleSettings.setEnabled(false);
            particleSettings.setQuality('low');

            particleSettings.resetToDefaults();

            const settings = particleSettings.getSettings();
            expect(settings.enabled).toBe(true);
            expect(settings.quality).toBe('medium');
        });
    });

    describe('ParticleSystem integration', () => {
        it('should generate ParticleSystem-compatible settings', () => {
            particleSettings.setParticleDensity(1.5);
            particleSettings.setMaxParticles(200);

            const systemSettings = particleSettings.getParticleSystemSettings();

            expect(systemSettings.enabled).toBe(true);
            expect(systemSettings.quality).toBe('medium');
            expect(systemSettings.maxParticles).toBe(300); // 200 * 1.5
            expect(systemSettings.effects).toBeDefined();
            expect(systemSettings.adaptiveQuality).toBe(true);
        });

        it('should apply density multiplier to max particles', () => {
            particleSettings.setParticleDensity(0.5);
            particleSettings.setMaxParticles(200);

            const systemSettings = particleSettings.getParticleSystemSettings();

            expect(systemSettings.maxParticles).toBe(100); // 200 * 0.5
        });

        it('should enforce minimum particle count', () => {
            particleSettings.setParticleDensity(0.1);
            particleSettings.setMaxParticles(100);

            const systemSettings = particleSettings.getParticleSystemSettings();

            expect(systemSettings.maxParticles).toBe(25); // Minimum enforced
        });

        it('should enforce maximum particle count', () => {
            particleSettings.setParticleDensity(3.0);
            particleSettings.setMaxParticles(300);

            const systemSettings = particleSettings.getParticleSystemSettings();

            expect(systemSettings.maxParticles).toBe(500); // Maximum enforced
        });
    });

    describe('change listeners', () => {
        it('should notify listeners of changes', () => {
            const listener = jest.fn();
            particleSettings.addChangeListener(listener);

            particleSettings.setSetting('enabled', false);

            expect(listener).toHaveBeenCalledWith('enabled', false);
        });

        it('should remove listeners', () => {
            const listener = jest.fn();
            particleSettings.addChangeListener(listener);
            particleSettings.removeChangeListener(listener);

            particleSettings.setSetting('enabled', false);

            expect(listener).not.toHaveBeenCalled();
        });

        it('should handle listener errors gracefully', () => {
            const errorListener = jest.fn(() => {
                throw new Error('Listener error');
            });
            const goodListener = jest.fn();

            particleSettings.addChangeListener(errorListener);
            particleSettings.addChangeListener(goodListener);

            // Should not throw and should still call good listener
            expect(() => {
                particleSettings.setSetting('enabled', false);
            }).not.toThrow();

            expect(goodListener).toHaveBeenCalled();
        });
    });

    describe('import/export', () => {
        it('should export settings as JSON', () => {
            particleSettings.setEnabled(false);
            particleSettings.setQuality('low');

            const exported = particleSettings.exportSettings();
            const parsed = JSON.parse(exported);

            expect(parsed.enabled).toBe(false);
            expect(parsed.quality).toBe('low');
        });

        it('should import settings from JSON', () => {
            const importData = JSON.stringify({
                enabled: false,
                quality: 'high',
                effects: {
                    trailSparks: false,
                },
            });

            const result = particleSettings.importSettings(importData);

            expect(result).toBe(true);
            const settings = particleSettings.getSettings();
            expect(settings.enabled).toBe(false);
            expect(settings.quality).toBe('high');
            expect(settings.effects.trailSparks).toBe(false);
        });

        it('should handle invalid import data', () => {
            const result = particleSettings.importSettings('invalid json');

            expect(result).toBe(false);
        });
    });

    describe('localStorage persistence', () => {
        it('should save settings to localStorage', () => {
            particleSettings.setSetting('enabled', false);

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'lightbikes_particle_settings',
                expect.stringContaining('"enabled":false')
            );
        });

        it('should handle localStorage errors gracefully', () => {
            // Mock localStorage.setItem to throw error
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('Storage quota exceeded');
            });

            // Should not throw error
            expect(() => {
                particleSettings.setSetting('enabled', false);
            }).not.toThrow();
        });
    });

    describe('validation', () => {
        it('should validate boolean settings', () => {
            expect(particleSettings.setSetting('enabled', 'not a boolean')).toBe(false);
            expect(particleSettings.setSetting('enabled', true)).toBe(true);
        });

        it('should validate quality enum', () => {
            expect(particleSettings.setSetting('quality', 'invalid')).toBe(false);
            expect(particleSettings.setSetting('quality', 'high')).toBe(true);
        });

        it('should validate numeric ranges', () => {
            expect(particleSettings.setSetting('performance.maxParticles', 10)).toBe(false); // Too low
            expect(particleSettings.setSetting('performance.maxParticles', 1000)).toBe(false); // Too high
            expect(particleSettings.setSetting('performance.maxParticles', 150)).toBe(true); // Valid
        });

        it('should validate density range', () => {
            expect(particleSettings.setSetting('advanced.particleDensity', 0.05)).toBe(false); // Too low
            expect(particleSettings.setSetting('advanced.particleDensity', 5.0)).toBe(false); // Too high
            expect(particleSettings.setSetting('advanced.particleDensity', 1.5)).toBe(true); // Valid
        });
    });
});
