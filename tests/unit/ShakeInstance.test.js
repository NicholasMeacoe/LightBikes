const { ShakeInstance } = require('@/effects/ShakeInstance.js');

describe('ShakeInstance', () => {
    describe('constructor', () => {
        it('should initialize with valid parameters', () => {
            const shake = new ShakeInstance(1.0, 2.0, 'collision');
            
            expect(shake.intensity).toBe(1.0);
            expect(shake.duration).toBe(2.0);
            expect(shake.type).toBe('collision');
            expect(shake.elapsed).toBe(0);
            expect(shake.isActive).toBe(true);
        });

        it('should clamp intensity to valid range', () => {
            const lowShake = new ShakeInstance(-0.5, 1.0);
            const highShake = new ShakeInstance(3.0, 1.0);
            
            expect(lowShake.intensity).toBe(0);
            expect(highShake.intensity).toBe(2.0);
        });

        it('should handle negative duration', () => {
            const shake = new ShakeInstance(1.0, -1.0);
            expect(shake.duration).toBe(0);
        });

        it('should default to collision type', () => {
            const shake = new ShakeInstance(1.0, 1.0);
            expect(shake.getType()).toBe('collision');
        });
    });

    describe('decay functions', () => {
        it('should create different decay functions for different types', () => {
            const collisionShake = new ShakeInstance(1.0, 1.0, 'collision');
            const nearMissShake = new ShakeInstance(1.0, 1.0, 'nearMiss');
            
            // Test at 50% progress
            const collisionDecay = collisionShake.decayFunction(0.5);
            const nearMissDecay = nearMissShake.decayFunction(0.5);
            
            expect(collisionDecay).not.toBe(nearMissDecay);
            expect(collisionDecay).toBeGreaterThan(0);
            expect(nearMissDecay).toBeGreaterThan(0);
        });

        it('should return 1.0 at start and approach 0 at end', () => {
            const shake = new ShakeInstance(1.0, 1.0, 'collision');
            
            const startDecay = shake.decayFunction(0);
            const endDecay = shake.decayFunction(1);
            
            expect(startDecay).toBe(1.0);
            expect(endDecay).toBe(0);
        });

        it('should handle unknown shake types with default decay', () => {
            const shake = new ShakeInstance(1.0, 1.0, 'unknown');
            const decay = shake.decayFunction(0.5);
            
            expect(decay).toBeGreaterThan(0);
            expect(decay).toBeLessThan(1);
        });
    });

    describe('update', () => {
        it('should update elapsed time and return true while active', () => {
            const shake = new ShakeInstance(1.0, 1.0, 'collision');
            
            const result = shake.update(0.5);
            
            expect(result).toBe(true);
            expect(shake.elapsed).toBe(0.5);
            expect(shake.isActive).toBe(true);
        });

        it('should complete and return false when duration exceeded', () => {
            const shake = new ShakeInstance(1.0, 1.0, 'collision');
            
            const result = shake.update(1.5);
            
            expect(result).toBe(false);
            expect(shake.isActive).toBe(false);
            expect(shake.isComplete()).toBe(true);
        });

        it('should handle zero duration', () => {
            const shake = new ShakeInstance(1.0, 0, 'collision');
            
            const result = shake.update(0.1);
            
            expect(result).toBe(false);
            expect(shake.isComplete()).toBe(true);
        });

        it('should generate offset during update', () => {
            const shake = new ShakeInstance(1.0, 1.0, 'collision');
            
            shake.update(0.1);
            const offset = shake.getOffset();
            
            expect(typeof offset.x).toBe('number');
            expect(typeof offset.y).toBe('number');
            expect(typeof offset.z).toBe('number');
        });
    });

    describe('offset generation', () => {
        it('should generate zero offset for zero intensity', () => {
            const shake = new ShakeInstance(0, 1.0, 'collision');
            shake.generateOffset(0);
            
            const offset = shake.getOffset();
            expect(offset.x).toBe(0);
            expect(offset.y).toBe(0);
            expect(offset.z).toBe(0);
        });

        it('should generate non-zero offset for positive intensity', () => {
            const shake = new ShakeInstance(1.0, 1.0, 'collision');
            shake.generateOffset(1.0);
            
            const offset = shake.getOffset();
            const hasOffset = offset.x !== 0 || offset.y !== 0 || offset.z !== 0;
            expect(hasOffset).toBe(true);
        });

        it('should generate different offsets over time', () => {
            const shake = new ShakeInstance(1.0, 1.0, 'collision');
            
            shake.update(0.1);
            const offset1 = shake.getOffset();
            
            shake.update(0.1);
            const offset2 = shake.getOffset();
            
            const offsetsAreDifferent = 
                offset1.x !== offset2.x || 
                offset1.y !== offset2.y || 
                offset1.z !== offset2.z;
            
            expect(offsetsAreDifferent).toBe(true);
        });

        it('should scale offset with intensity', () => {
            const shake = new ShakeInstance(1.0, 1.0, 'collision');
            
            shake.generateOffset(0.5);
            const smallOffset = shake.getOffset();
            
            shake.generateOffset(1.0);
            const largeOffset = shake.getOffset();
            
            // Large offset should generally be larger (though random, so we test magnitude)
            const smallMagnitude = Math.sqrt(smallOffset.x ** 2 + smallOffset.y ** 2 + smallOffset.z ** 2);
            const largeMagnitude = Math.sqrt(largeOffset.x ** 2 + largeOffset.y ** 2 + largeOffset.z ** 2);
            
            expect(largeMagnitude).toBeGreaterThan(smallMagnitude);
        });
    });

    describe('getters', () => {
        it('should return current intensity based on decay', () => {
            const shake = new ShakeInstance(1.0, 1.0, 'collision');
            
            const initialIntensity = shake.getCurrentIntensity();
            expect(initialIntensity).toBe(1.0);
            
            shake.update(0.5);
            const midIntensity = shake.getCurrentIntensity();
            expect(midIntensity).toBeLessThan(1.0);
            expect(midIntensity).toBeGreaterThan(0);
        });

        it('should return zero intensity when complete', () => {
            const shake = new ShakeInstance(1.0, 1.0, 'collision');
            shake.update(2.0); // Complete the shake
            
            expect(shake.getCurrentIntensity()).toBe(0);
        });

        it('should return remaining duration', () => {
            const shake = new ShakeInstance(1.0, 2.0, 'collision');
            
            expect(shake.getRemainingDuration()).toBe(2.0);
            
            shake.update(0.5);
            expect(shake.getRemainingDuration()).toBe(1.5);
            
            shake.update(2.0);
            expect(shake.getRemainingDuration()).toBe(0);
        });

        it('should return offset copy to prevent mutation', () => {
            const shake = new ShakeInstance(1.0, 1.0, 'collision');
            shake.update(0.1);
            
            const offset1 = shake.getOffset();
            const offset2 = shake.getOffset();
            
            expect(offset1).not.toBe(offset2); // Different objects
            expect(offset1).toEqual(offset2); // Same values
            
            offset1.x = 999;
            expect(shake.getOffset().x).not.toBe(999); // Original not mutated
        });

        it('should return shake type', () => {
            const collisionShake = new ShakeInstance(1.0, 1.0, 'collision');
            const nearMissShake = new ShakeInstance(1.0, 1.0, 'nearMiss');
            
            expect(collisionShake.getType()).toBe('collision');
            expect(nearMissShake.getType()).toBe('nearMiss');
        });
    });

    describe('completion state', () => {
        it('should not be complete initially', () => {
            const shake = new ShakeInstance(1.0, 1.0, 'collision');
            expect(shake.isComplete()).toBe(false);
        });

        it('should be complete after duration exceeded', () => {
            const shake = new ShakeInstance(1.0, 1.0, 'collision');
            shake.update(1.5);
            expect(shake.isComplete()).toBe(true);
        });

        it('should be complete immediately for zero duration', () => {
            const shake = new ShakeInstance(1.0, 0, 'collision');
            shake.update(0.1);
            expect(shake.isComplete()).toBe(true);
        });
    });
});