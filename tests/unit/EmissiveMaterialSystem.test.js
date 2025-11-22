/**
 * Tests for EmissiveMaterialSystem
 * Validates material creation, pulse animation, and resource management
 */

// Mock Three.js
const THREE = {
    MeshLambertMaterial: jest.fn().mockImplementation((params) => ({
        color: { setHex: jest.fn() },
        emissive: { setHex: jest.fn() },
        emissiveIntensity: params.emissiveIntensity || 0,
        transparent: params.transparent || false,
        opacity: params.opacity || 1,
        dispose: jest.fn()
    })),
    MeshBasicMaterial: jest.fn().mockImplementation((params) => ({
        color: { setHex: jest.fn() },
        emissive: { setHex: jest.fn() },
        emissiveIntensity: params.emissiveIntensity || 0,
        transparent: params.transparent || false,
        opacity: params.opacity || 1,
        dispose: jest.fn()
    }))
};

global.THREE = THREE;

const { EmissiveMaterialSystem } = require('@/rendering/EmissiveMaterialSystem.js');

describe('EmissiveMaterialSystem', () => {
    let materialSystem;

    beforeEach(() => {
        materialSystem = new EmissiveMaterialSystem();
        jest.clearAllMocks();
    });

    describe('Constructor', () => {
        it('should initialize with correct default values', () => {
            expect(materialSystem.materials).toBeInstanceOf(Map);
            expect(materialSystem.materials.size).toBe(0);
            expect(materialSystem.pulseState.time).toBe(0);
            expect(materialSystem.pulseState.intensity).toBe(1.0);
            expect(materialSystem.pulseState.paused).toBe(false);
            expect(materialSystem.pulseState.period).toBe(2.5);
            expect(materialSystem.pulseState.minIntensity).toBe(0.8);
            expect(materialSystem.pulseState.maxIntensity).toBe(1.0);
            expect(materialSystem.baseIntensities.bike).toBe(0.8);
            expect(materialSystem.baseIntensities.trail).toBe(0.6);
            expect(materialSystem.globalIntensityMultiplier).toBe(1.0);
        });
    });

    describe('createBikeMaterial', () => {
        it('should create bike material with correct properties', () => {
            const material = materialSystem.createBikeMaterial('player', 0x00ff00);

            expect(THREE.MeshLambertMaterial).toHaveBeenCalledWith({
                color: 0x00ff00,
                emissive: 0x00ff00,
                emissiveIntensity: 0.8, // baseIntensities.bike * globalIntensityMultiplier
                transparent: false
            });

            expect(materialSystem.materials.has('player')).toBe(true);
            const storedData = materialSystem.materials.get('player');
            expect(storedData.type).toBe('bike');
            expect(storedData.baseIntensity).toBe(0.8);
            expect(storedData.color).toBe(0x00ff00);
        });

        it('should dispose existing material when creating new one with same ID', () => {
            const firstMaterial = materialSystem.createBikeMaterial('player', 0x00ff00);
            const secondMaterial = materialSystem.createBikeMaterial('player', 0xff0000);

            expect(firstMaterial.dispose).toHaveBeenCalled();
            expect(materialSystem.materials.size).toBe(1);
        });
    });

    describe('createTrailMaterial', () => {
        it('should create trail material with correct properties', () => {
            const material = materialSystem.createTrailMaterial('trail_1', 0x00ff00);

            expect(THREE.MeshBasicMaterial).toHaveBeenCalledWith({
                color: 0x00ff00,
                emissive: 0x00ff00,
                emissiveIntensity: 0.6, // baseIntensities.trail * globalIntensityMultiplier
                transparent: true,
                opacity: 0.8
            });

            expect(materialSystem.materials.has('trail_1')).toBe(true);
            const storedData = materialSystem.materials.get('trail_1');
            expect(storedData.type).toBe('trail');
            expect(storedData.baseIntensity).toBe(0.6);
            expect(storedData.color).toBe(0x00ff00);
        });
    });

    describe('updatePulseAnimation', () => {
        it('should update pulse intensity over time', () => {
            const bikeMaterial = materialSystem.createBikeMaterial('player', 0x00ff00);
            const trailMaterial = materialSystem.createTrailMaterial('trail_1', 0x00ff00);

            // Update animation
            materialSystem.updatePulseAnimation(0.625); // 1/4 of 2.5 second cycle

            // Check that materials have updated emissive intensity
            expect(bikeMaterial.emissiveIntensity).toBeGreaterThan(0);
            expect(trailMaterial.emissiveIntensity).toBeGreaterThan(0);
            
            // Bike should be brighter than trail
            expect(bikeMaterial.emissiveIntensity).toBeGreaterThan(trailMaterial.emissiveIntensity);
        });

        it('should not update when paused', () => {
            const material = materialSystem.createBikeMaterial('player', 0x00ff00);
            const initialIntensity = material.emissiveIntensity;

            materialSystem.pausePulse();
            materialSystem.updatePulseAnimation(1.0);

            expect(material.emissiveIntensity).toBe(initialIntensity);
        });

        it('should vary intensity between min and max values', () => {
            const material = materialSystem.createBikeMaterial('player', 0x00ff00);
            const intensities = [];

            // Sample intensities over a full cycle
            for (let i = 0; i < 10; i++) {
                materialSystem.updatePulseAnimation(0.25); // 0.25 * 10 = 2.5 seconds (full cycle)
                intensities.push(material.emissiveIntensity);
            }

            const minIntensity = Math.min(...intensities);
            const maxIntensity = Math.max(...intensities);

            // Should vary within expected range (80% to 100% of base intensity)
            expect(minIntensity).toBeGreaterThanOrEqual(0.8 * 0.8 * 0.8); // min * base * global
            expect(maxIntensity).toBeLessThanOrEqual(0.8 * 1.0 * 1.0); // max * base * global
        });
    });

    describe('pausePulse and resumePulse', () => {
        it('should pause and resume pulse animation', () => {
            expect(materialSystem.pulseState.paused).toBe(false);

            materialSystem.pausePulse();
            expect(materialSystem.pulseState.paused).toBe(true);

            materialSystem.resumePulse();
            expect(materialSystem.pulseState.paused).toBe(false);
        });
    });

    describe('setGlobalIntensityMultiplier', () => {
        it('should update global intensity and apply to existing materials', () => {
            const material = materialSystem.createBikeMaterial('player', 0x00ff00);
            const initialIntensity = material.emissiveIntensity;

            materialSystem.setGlobalIntensityMultiplier(0.5);

            expect(materialSystem.globalIntensityMultiplier).toBe(0.5);
            expect(material.emissiveIntensity).toBe(initialIntensity * 0.5);
        });

        it('should not allow negative multipliers', () => {
            materialSystem.setGlobalIntensityMultiplier(-0.5);
            expect(materialSystem.globalIntensityMultiplier).toBe(0);
        });
    });

    describe('getMaterial', () => {
        it('should return material by entity ID', () => {
            const material = materialSystem.createBikeMaterial('player', 0x00ff00);
            const retrieved = materialSystem.getMaterial('player');
            expect(retrieved).toBe(material);
        });

        it('should return null for non-existent entity ID', () => {
            const retrieved = materialSystem.getMaterial('nonexistent');
            expect(retrieved).toBeNull();
        });
    });

    describe('disposeMaterial', () => {
        it('should dispose material and remove from storage', () => {
            const material = materialSystem.createBikeMaterial('player', 0x00ff00);
            
            materialSystem.disposeMaterial('player');

            expect(material.dispose).toHaveBeenCalled();
            expect(materialSystem.materials.has('player')).toBe(false);
            expect(materialSystem.disposedMaterials.has('player')).toBe(true);
        });
    });

    describe('getPulseState', () => {
        it('should return current pulse state information', () => {
            const state = materialSystem.getPulseState();

            expect(state).toHaveProperty('time');
            expect(state).toHaveProperty('intensity');
            expect(state).toHaveProperty('paused');
            expect(state).toHaveProperty('cycleProgress');
            expect(typeof state.time).toBe('number');
            expect(typeof state.intensity).toBe('number');
            expect(typeof state.paused).toBe('boolean');
            expect(typeof state.cycleProgress).toBe('number');
        });
    });

    describe('resetPulseTimer', () => {
        it('should reset pulse timing', () => {
            materialSystem.updatePulseAnimation(1.0);
            expect(materialSystem.pulseState.time).toBeGreaterThan(0);

            materialSystem.resetPulseTimer();
            expect(materialSystem.pulseState.time).toBe(0);
            expect(materialSystem.pulseState.intensity).toBe(1.0);
        });
    });

    describe('getMaterialCounts', () => {
        it('should return correct material counts', () => {
            materialSystem.createBikeMaterial('player', 0x00ff00);
            materialSystem.createBikeMaterial('ai1', 0xff0000);
            materialSystem.createTrailMaterial('trail_1', 0x00ff00);
            materialSystem.createTrailMaterial('trail_2', 0xff0000);

            const counts = materialSystem.getMaterialCounts();
            expect(counts.bike).toBe(2);
            expect(counts.trail).toBe(2);
            expect(counts.total).toBe(4);
        });

        it('should exclude disposed materials from counts', () => {
            materialSystem.createBikeMaterial('player', 0x00ff00);
            materialSystem.createTrailMaterial('trail_1', 0x00ff00);
            materialSystem.disposeMaterial('player');

            const counts = materialSystem.getMaterialCounts();
            expect(counts.bike).toBe(0);
            expect(counts.trail).toBe(1);
            expect(counts.total).toBe(1);
        });
    });

    describe('updateMaterialColor', () => {
        it('should update material color and emissive properties', () => {
            const material = materialSystem.createBikeMaterial('player', 0x00ff00);
            
            materialSystem.updateMaterialColor('player', 0xff0000);

            expect(material.color.setHex).toHaveBeenCalledWith(0xff0000);
            expect(material.emissive.setHex).toHaveBeenCalledWith(0xff0000);
            
            const storedData = materialSystem.materials.get('player');
            expect(storedData.color).toBe(0xff0000);
        });
    });

    describe('dispose', () => {
        it('should dispose all materials and reset state', () => {
            const material1 = materialSystem.createBikeMaterial('player', 0x00ff00);
            const material2 = materialSystem.createTrailMaterial('trail_1', 0x00ff00);

            materialSystem.dispose();

            expect(material1.dispose).toHaveBeenCalled();
            expect(material2.dispose).toHaveBeenCalled();
            expect(materialSystem.materials.size).toBe(0);
            expect(materialSystem.disposedMaterials.size).toBe(0);
            expect(materialSystem.pulseState.time).toBe(0);
            expect(materialSystem.pulseState.intensity).toBe(1.0);
            expect(materialSystem.pulseState.paused).toBe(false);
        });
    });

    describe('getStatus', () => {
        it('should return comprehensive system status', () => {
            materialSystem.createBikeMaterial('player', 0x00ff00);
            materialSystem.createTrailMaterial('trail_1', 0x00ff00);

            const status = materialSystem.getStatus();

            expect(status).toHaveProperty('materialCount', 2);
            expect(status).toHaveProperty('bikeMaterials', 1);
            expect(status).toHaveProperty('trailMaterials', 1);
            expect(status).toHaveProperty('pulseIntensity');
            expect(status).toHaveProperty('pulsePaused', false);
            expect(status).toHaveProperty('globalMultiplier', 1.0);
            expect(status).toHaveProperty('disposedCount', 0);
        });
    });
});