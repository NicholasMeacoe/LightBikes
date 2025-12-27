/**
 * Tests for EmissiveMaterialSystem
 * Validates material creation, pulse animation, and resource management
 */

describe('EmissiveMaterialSystem', () => {
    let materialSystem;
    let EmissiveMaterialSystem;
    let mockMeshLambertMaterial;
    let mockMeshBasicMaterial;

    beforeEach(() => {
        // Isolate modules to ensure we get a fresh EmissiveMaterialSystem with our overrides
        jest.isolateModules(() => {
            // Setup THREE mocks specifically for this test
            mockMeshLambertMaterial = jest.fn().mockImplementation((params) => ({
                color: { setHex: jest.fn() },
                emissive: { setHex: jest.fn() },
                emissiveIntensity: params.emissiveIntensity || 0,
                transparent: params.transparent || false,
                opacity: params.opacity || 1,
                dispose: jest.fn(),
            }));

            mockMeshBasicMaterial = jest.fn().mockImplementation((params) => ({
                color: { setHex: jest.fn() },
                emissive: { setHex: jest.fn() },
                emissiveIntensity: params.emissiveIntensity || 0,
                transparent: params.transparent || false,
                opacity: params.opacity || 1,
                dispose: jest.fn(),
            }));

            global.THREE = {
                ...global.THREE,
                MeshLambertMaterial: mockMeshLambertMaterial,
                MeshBasicMaterial: mockMeshBasicMaterial,
                Color: jest.fn().mockImplementation((c) => ({
                    setHex: jest.fn().mockReturnThis(),
                    getHex: jest.fn().mockReturnValue(c),
                })),
            };

            const mod = require('@/rendering/EmissiveMaterialSystem.js');
            EmissiveMaterialSystem = mod.EmissiveMaterialSystem;
            materialSystem = new EmissiveMaterialSystem();
        });
    });

    describe('Constructor', () => {
        it('should initialize with correct default values', () => {
            expect(materialSystem.materials).toBeInstanceOf(Map);
            expect(materialSystem.materials.size).toBe(0);
            expect(materialSystem.pulseState.time).toBe(0);
            expect(materialSystem.pulseState.paused).toBe(false);
            expect(materialSystem.baseIntensities.bike).toBe(0.8);
            expect(materialSystem.baseIntensities.trail).toBe(0.6);
        });
    });

    describe('createBikeMaterial', () => {
        it('should create bike material with correct properties', () => {
            const material = materialSystem.createBikeMaterial('player', 0x00ff00);

            expect(mockMeshLambertMaterial).toHaveBeenCalledWith(
                expect.objectContaining({
                    color: 0x00ff00,
                    emissive: 0x00ff00,
                    emissiveIntensity: 0.8,
                })
            );

            expect(materialSystem.materials.has('player')).toBe(true);
            const storedData = materialSystem.materials.get('player');
            expect(storedData.type).toBe('bike');
            expect(material.dispose).toBeDefined();
        });

        it('should dispose existing material when creating new one with same ID', () => {
            const firstMaterial = materialSystem.createBikeMaterial('player', 0x00ff00);
            const firstDispose = firstMaterial.dispose;

            materialSystem.createBikeMaterial('player', 0xff0000);

            expect(firstDispose).toHaveBeenCalled();
            expect(materialSystem.materials.size).toBe(1);
        });
    });

    describe('createTrailMaterial', () => {
        it('should create trail material with correct properties', () => {
            const material = materialSystem.createTrailMaterial('trail_1', 0x00ff00);

            expect(mockMeshBasicMaterial).toHaveBeenCalledWith(
                expect.objectContaining({
                    color: 0x00ff00,
                    emissive: 0x00ff00,
                    emissiveIntensity: 0.6,
                    transparent: true,
                    opacity: 0.8,
                })
            );

            expect(materialSystem.materials.has('trail_1')).toBe(true);
        });
    });

    describe('updatePulseAnimation', () => {
        it('should update pulse intensity over time', () => {
            const bikeMaterial = materialSystem.createBikeMaterial('player', 0x00ff00);

            materialSystem.updatePulseAnimation(0.625);

            expect(bikeMaterial.emissiveIntensity).toBeDefined();
            // Pulse range is 0.8 to 1.0. Base is 0.8.
            // So expected intensity is 0.8 * (0.8 to 1.0) = 0.64 to 0.8
            expect(bikeMaterial.emissiveIntensity).toBeGreaterThanOrEqual(0.64);
            expect(bikeMaterial.emissiveIntensity).toBeLessThanOrEqual(0.81);
        });

        it('should not update when paused', () => {
            const material = materialSystem.createBikeMaterial('player', 0x00ff00);
            const initialIntensity = material.emissiveIntensity;

            materialSystem.pausePulse();
            materialSystem.updatePulseAnimation(1.0);

            expect(material.emissiveIntensity).toBe(initialIntensity);
        });
    });

    describe('setGlobalIntensityMultiplier', () => {
        it('should update global intensity and apply to existing materials', () => {
            const material = materialSystem.createBikeMaterial('player', 0x00ff00);

            materialSystem.setGlobalIntensityMultiplier(0.5);

            expect(materialSystem.globalIntensityMultiplier).toBe(0.5);
            // 0.8 (base) * 0.5 (global) * 1.0 (pulse at start) = 0.4
            expect(material.emissiveIntensity).toBeCloseTo(0.4);
        });
    });

    describe('disposeMaterial', () => {
        it('should dispose material and remove from storage', () => {
            const material = materialSystem.createBikeMaterial('player', 0x00ff00);
            const disposeSpy = material.dispose;

            materialSystem.disposeMaterial('player');

            expect(disposeSpy).toHaveBeenCalled();
            expect(materialSystem.materials.has('player')).toBe(false);
        });
    });

    describe('updateMaterialColor', () => {
        it('should update material color and emissive properties', () => {
            const material = materialSystem.createBikeMaterial('player', 0x00ff00);
            const colorSpy = material.color.setHex;
            const emissiveSpy = material.emissive.setHex;

            materialSystem.updateMaterialColor('player', 0xff0000);

            expect(colorSpy).toHaveBeenCalledWith(0xff0000);
            expect(emissiveSpy).toHaveBeenCalledWith(0xff0000);
        });
    });

    describe('dispose', () => {
        it('should dispose all materials and reset state', () => {
            const m1 = materialSystem.createBikeMaterial('p1', 0x0);
            const m2 = materialSystem.createTrailMaterial('t1', 0x0);
            const d1 = m1.dispose;
            const d2 = m2.dispose;

            materialSystem.dispose();

            expect(d1).toHaveBeenCalled();
            expect(d2).toHaveBeenCalled();
            expect(materialSystem.materials.size).toBe(0);
        });
    });
});
