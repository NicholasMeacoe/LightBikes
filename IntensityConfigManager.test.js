const { IntensityConfigManager } = require('./IntensityConfigManager.js');

describe('IntensityConfigManager', () => {
    let intensityManager;

    beforeEach(() => {
        intensityManager = new IntensityConfigManager();
    });

    describe('constructor', () => {
        it('should initialize with default medium intensity', () => {
            expect(intensityManager.getIntensityLevel()).toBe('medium');
            expect(intensityManager.getEffectiveIntensity()).toBe(1.0);
        });

        it('should have correct predefined intensity levels', () => {
            const levels = intensityManager.getAvailableLevels();
            
            expect(levels.off).toBe(0.0);
            expect(levels.low).toBe(0.3);
            expect(levels.medium).toBe(1.0);
            expect(levels.high).toBe(2.0);
        });

        it('should have correct effect multipliers', () => {
            const multipliers = intensityManager.getEffectMultipliers();
            
            expect(multipliers.collision).toBe(1.0);
            expect(multipliers.nearMiss).toBe(0.2);
        });
    });

    describe('setIntensityLevel', () => {
        it('should set valid intensity levels', () => {
            expect(intensityManager.setIntensityLevel('low')).toBe(true);
            expect(intensityManager.getIntensityLevel()).toBe('low');
            expect(intensityManager.getEffectiveIntensity()).toBe(0.3);
            
            expect(intensityManager.setIntensityLevel('high')).toBe(true);
            expect(intensityManager.getIntensityLevel()).toBe('high');
            expect(intensityManager.getEffectiveIntensity()).toBe(2.0);
            
            expect(intensityManager.setIntensityLevel('off')).toBe(true);
            expect(intensityManager.getIntensityLevel()).toBe('off');
            expect(intensityManager.getEffectiveIntensity()).toBe(0.0);
        });

        it('should reject invalid intensity levels', () => {
            const originalLevel = intensityManager.getIntensityLevel();
            
            expect(intensityManager.setIntensityLevel('invalid')).toBe(false);
            expect(intensityManager.getIntensityLevel()).toBe(originalLevel);
        });

        it('should clear custom intensity when setting preset level', () => {
            intensityManager.setCustomIntensity(1.5);
            expect(intensityManager.getIntensityLevel()).toBe('custom');
            
            intensityManager.setIntensityLevel('low');
            expect(intensityManager.getIntensityLevel()).toBe('low');
            expect(intensityManager.getEffectiveIntensity()).toBe(0.3);
        });

        it('should notify listeners when intensity changes', () => {
            const listener = jest.fn();
            intensityManager.addChangeListener(listener);
            
            intensityManager.setIntensityLevel('low');
            
            expect(listener).toHaveBeenCalledWith('low', 0.3, 'medium', 1.0);
        });

        it('should not notify listeners when setting same level', () => {
            const listener = jest.fn();
            intensityManager.addChangeListener(listener);
            
            intensityManager.setIntensityLevel('medium'); // Same as current
            
            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe('setCustomIntensity', () => {
        it('should set valid custom intensity values', () => {
            expect(intensityManager.setCustomIntensity(1.5)).toBe(true);
            expect(intensityManager.getIntensityLevel()).toBe('custom');
            expect(intensityManager.getEffectiveIntensity()).toBe(1.5);
            
            expect(intensityManager.setCustomIntensity(0.0)).toBe(true);
            expect(intensityManager.getEffectiveIntensity()).toBe(0.0);
            
            expect(intensityManager.setCustomIntensity(2.0)).toBe(true);
            expect(intensityManager.getEffectiveIntensity()).toBe(2.0);
        });

        it('should reject invalid custom intensity values', () => {
            const originalLevel = intensityManager.getIntensityLevel();
            const originalValue = intensityManager.getEffectiveIntensity();
            
            expect(intensityManager.setCustomIntensity(-0.1)).toBe(false);
            expect(intensityManager.setCustomIntensity(2.1)).toBe(false);
            expect(intensityManager.setCustomIntensity('invalid')).toBe(false);
            expect(intensityManager.setCustomIntensity(NaN)).toBe(false);
            
            expect(intensityManager.getIntensityLevel()).toBe(originalLevel);
            expect(intensityManager.getEffectiveIntensity()).toBe(originalValue);
        });

        it('should notify listeners when custom intensity is set', () => {
            const listener = jest.fn();
            intensityManager.addChangeListener(listener);
            
            intensityManager.setCustomIntensity(1.5);
            
            expect(listener).toHaveBeenCalledWith('custom', 1.5, 'medium', 1.0);
        });
    });

    describe('getIntensityForEffect', () => {
        it('should apply correct multipliers for different effect types', () => {
            intensityManager.setIntensityLevel('medium'); // 1.0 base intensity
            
            expect(intensityManager.getIntensityForEffect('collision')).toBe(1.0);
            expect(intensityManager.getIntensityForEffect('nearMiss')).toBe(0.2);
        });

        it('should handle unknown effect types with default multiplier', () => {
            intensityManager.setIntensityLevel('medium');
            
            expect(intensityManager.getIntensityForEffect('unknown')).toBe(1.0);
        });

        it('should scale custom intensity values correctly', () => {
            intensityManager.setCustomIntensity(1.5);
            
            expect(intensityManager.getIntensityForEffect('collision')).toBe(1.5);
            expect(intensityManager.getIntensityForEffect('nearMiss')).toBeCloseTo(0.3); // 1.5 * 0.2
        });
    });

    describe('isEffectsDisabled', () => {
        it('should return true when intensity is off', () => {
            intensityManager.setIntensityLevel('off');
            expect(intensityManager.isEffectsDisabled()).toBe(true);
        });

        it('should return true when custom intensity is 0', () => {
            intensityManager.setCustomIntensity(0.0);
            expect(intensityManager.isEffectsDisabled()).toBe(true);
        });

        it('should return false when intensity is greater than 0', () => {
            intensityManager.setIntensityLevel('low');
            expect(intensityManager.isEffectsDisabled()).toBe(false);
            
            intensityManager.setCustomIntensity(0.1);
            expect(intensityManager.isEffectsDisabled()).toBe(false);
        });
    });

    describe('getConfigurationForUI', () => {
        it('should return complete configuration for preset levels', () => {
            intensityManager.setIntensityLevel('low');
            
            const config = intensityManager.getConfigurationForUI();
            
            expect(config.currentLevel).toBe('low');
            expect(config.currentValue).toBe(0.3);
            expect(config.isCustom).toBe(false);
            expect(config.customValue).toBeNull();
            expect(config.isDisabled).toBe(false);
            expect(config.availableLevels).toEqual(intensityManager.getAvailableLevels());
        });

        it('should return complete configuration for custom intensity', () => {
            intensityManager.setCustomIntensity(1.5);
            
            const config = intensityManager.getConfigurationForUI();
            
            expect(config.currentLevel).toBe('custom');
            expect(config.currentValue).toBe(1.5);
            expect(config.isCustom).toBe(true);
            expect(config.customValue).toBe(1.5);
            expect(config.isDisabled).toBe(false);
        });
    });

    describe('applyIntensityScaling', () => {
        it('should scale shake parameters correctly', () => {
            intensityManager.setIntensityLevel('low'); // 0.3 intensity
            
            const originalParams = {
                intensity: 1.0,
                amplitude: 2.0,
                magnitude: 1.5,
                duration: 1.0,
                otherParam: 'unchanged'
            };
            
            const scaledParams = intensityManager.applyIntensityScaling(originalParams, 'collision');
            
            expect(scaledParams.intensity).toBeCloseTo(0.3);
            expect(scaledParams.amplitude).toBeCloseTo(0.6);
            expect(scaledParams.magnitude).toBeCloseTo(0.45);
            expect(scaledParams.duration).toBe(1.0); // Duration unchanged for normal intensity
            expect(scaledParams.otherParam).toBe('unchanged');
        });

        it('should apply effect type multipliers', () => {
            intensityManager.setIntensityLevel('medium'); // 1.0 intensity
            
            const originalParams = { intensity: 1.0 };
            
            const collisionParams = intensityManager.applyIntensityScaling(originalParams, 'collision');
            const nearMissParams = intensityManager.applyIntensityScaling(originalParams, 'nearMiss');
            
            expect(collisionParams.intensity).toBe(1.0);
            expect(nearMissParams.intensity).toBe(0.2);
        });

        it('should adjust duration for very low intensities', () => {
            intensityManager.setCustomIntensity(0.05); // Very low intensity
            
            const originalParams = { duration: 1.0 };
            const scaledParams = intensityManager.applyIntensityScaling(originalParams, 'collision');
            
            expect(scaledParams.duration).toBeLessThan(1.0);
            expect(scaledParams.duration).toBeGreaterThanOrEqual(0.5);
        });

        it('should handle invalid input gracefully', () => {
            expect(intensityManager.applyIntensityScaling(null)).toBeNull();
            expect(intensityManager.applyIntensityScaling('string')).toBe('string');
            expect(intensityManager.applyIntensityScaling(123)).toBe(123);
        });
    });

    describe('effect multipliers', () => {
        it('should allow setting custom effect multipliers', () => {
            const newMultipliers = {
                collision: 1.5,
                nearMiss: 0.1,
                newEffect: 0.8
            };
            
            intensityManager.setEffectMultipliers(newMultipliers);
            
            const multipliers = intensityManager.getEffectMultipliers();
            expect(multipliers.collision).toBe(1.5);
            expect(multipliers.nearMiss).toBe(0.1);
            expect(multipliers.newEffect).toBe(0.8);
        });

        it('should merge with existing multipliers', () => {
            intensityManager.setEffectMultipliers({ collision: 1.5 });
            
            const multipliers = intensityManager.getEffectMultipliers();
            expect(multipliers.collision).toBe(1.5);
            expect(multipliers.nearMiss).toBe(0.2); // Original value preserved
        });
    });

    describe('change listeners', () => {
        it('should add and remove change listeners', () => {
            const listener1 = jest.fn();
            const listener2 = jest.fn();
            
            intensityManager.addChangeListener(listener1);
            intensityManager.addChangeListener(listener2);
            
            intensityManager.setIntensityLevel('low');
            
            expect(listener1).toHaveBeenCalled();
            expect(listener2).toHaveBeenCalled();
            
            intensityManager.removeChangeListener(listener1);
            listener1.mockClear();
            listener2.mockClear();
            
            intensityManager.setIntensityLevel('high');
            
            expect(listener1).not.toHaveBeenCalled();
            expect(listener2).toHaveBeenCalled();
        });

        it('should handle listener errors gracefully', () => {
            const errorListener = jest.fn(() => { throw new Error('Test error'); });
            const normalListener = jest.fn();
            
            intensityManager.addChangeListener(errorListener);
            intensityManager.addChangeListener(normalListener);
            
            expect(() => {
                intensityManager.setIntensityLevel('low');
            }).not.toThrow();
            
            expect(normalListener).toHaveBeenCalled();
        });
    });

    describe('persistence', () => {
        it('should create settings for persistence', () => {
            intensityManager.setCustomIntensity(1.5);
            intensityManager.setEffectMultipliers({ collision: 1.2 });
            
            const settings = intensityManager.getSettingsForPersistence();
            
            expect(settings.intensityLevel).toBe('custom');
            expect(settings.customIntensityValue).toBe(1.5);
            expect(settings.effectMultipliers.collision).toBe(1.2);
        });

        it('should load settings from persistence', () => {
            const settings = {
                intensityLevel: 'low',
                customIntensityValue: 1.5,
                effectMultipliers: { collision: 1.2, nearMiss: 0.1 }
            };
            
            const result = intensityManager.loadSettingsFromPersistence(settings);
            
            expect(result).toBe(true);
            expect(intensityManager.getIntensityLevel()).toBe('low');
            expect(intensityManager.getEffectMultipliers().collision).toBe(1.2);
        });

        it('should load custom intensity correctly', () => {
            const settings = {
                intensityLevel: 'custom',
                customIntensityValue: 1.5
            };
            
            intensityManager.loadSettingsFromPersistence(settings);
            
            expect(intensityManager.getIntensityLevel()).toBe('custom');
            expect(intensityManager.getEffectiveIntensity()).toBe(1.5);
        });

        it('should handle invalid persistence data', () => {
            expect(intensityManager.loadSettingsFromPersistence(null)).toBe(false);
            expect(intensityManager.loadSettingsFromPersistence('string')).toBe(false);
            
            const invalidSettings = {
                intensityLevel: 'invalid',
                customIntensityValue: 'invalid'
            };
            
            expect(intensityManager.loadSettingsFromPersistence(invalidSettings)).toBe(false);
        });
    });

    describe('getIntensityDescription', () => {
        it('should provide user-friendly descriptions', () => {
            intensityManager.setIntensityLevel('off');
            expect(intensityManager.getIntensityDescription()).toBe('Camera effects disabled');
            
            intensityManager.setIntensityLevel('low');
            expect(intensityManager.getIntensityDescription()).toBe('Low intensity (30%)');
            
            intensityManager.setIntensityLevel('medium');
            expect(intensityManager.getIntensityDescription()).toBe('Medium intensity (100%)');
            
            intensityManager.setIntensityLevel('high');
            expect(intensityManager.getIntensityDescription()).toBe('High intensity (200%)');
            
            intensityManager.setCustomIntensity(1.5);
            expect(intensityManager.getIntensityDescription()).toBe('Custom intensity: 150%');
        });
    });
});