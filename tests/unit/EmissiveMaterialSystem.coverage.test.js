/**
 * Coverage Tests for EmissiveMaterialSystem
 * Targets uncovered lines: trail templates, material counts, pulse reset/resume, update wrappers, pulse loop, disposal
 */

describe('EmissiveMaterialSystem Coverage', () => {
    let materialSystem;
    let EmissiveMaterialSystem;
    let mockMeshLambertMaterial;
    let mockMeshBasicMaterial;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();

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

        const mod = require('../../src/rendering/EmissiveMaterialSystem.js');
        EmissiveMaterialSystem = mod.EmissiveMaterialSystem;
        materialSystem = new EmissiveMaterialSystem();
    });

    describe('Pulse State Management', () => {
        it('should resume pulse animation', () => {
            materialSystem.pausePulse();
            expect(materialSystem.pulseState.paused).toBe(true);

            materialSystem.resumePulse();
            expect(materialSystem.pulseState.paused).toBe(false);
        });

        it('should reset pulse timer', () => {
            materialSystem.pulseState.time = 100;
            materialSystem.pulseState.intensity = 0.5;

            materialSystem.resetPulseTimer();

            expect(materialSystem.pulseState.time).toBe(0);
            expect(materialSystem.pulseState.intensity).toBe(1.0);
        });

        it('should get pulse state object', () => {
            materialSystem.pulseState.time = 5;
            const state = materialSystem.getPulseState();

            expect(state.time).toBe(5);
            expect(state.intensity).toBeDefined();
            expect(state.paused).toBe(false);
            expect(state.cycleProgress).toBeDefined();
        });
    });

    describe('Material Counts & Status', () => {
        it('should return correct material counts', () => {
            materialSystem.createBikeMaterial('bike1', 0xffffff);
            materialSystem.createTrailMaterial('trail1', 0xffffff);
            materialSystem.createTrailMaterial('trail2', 0xffffff);

            const counts = materialSystem.getMaterialCounts();
            expect(counts.bike).toBe(1);
            expect(counts.trail).toBe(2);
            expect(counts.total).toBe(3);
        });

        it('should ignore disposed materials in counts', () => {
            materialSystem.createBikeMaterial('bike1', 0xffffff);
            materialSystem.disposeMaterial('bike1');

            const counts = materialSystem.getMaterialCounts();
            expect(counts.total).toBe(0);
        });

        it('should return system status with debug info', () => {
            materialSystem.createBikeMaterial('bike1', 0xffffff);
            materialSystem.setGlobalIntensityMultiplier(0.5);

            const status = materialSystem.getStatus();
            expect(status.materialCount).toBe(1);
            expect(status.globalMultiplier).toBe(0.5);
            expect(status.pulsePaused).toBe(false);
        });
    });

    describe('Material Updates & Templates', () => {
        it('should update bike material wrapper', () => {
            const mat = materialSystem.createBikeMaterial('p1', 0x00ff00);
            const hexSpy = mat.color.setHex;

            materialSystem.updateBikeMaterial('p1', 0xff0000);
            expect(hexSpy).toHaveBeenCalledWith(0xff0000);
        });

        it('should retrieve material by ID', () => {
            const mat = materialSystem.createBikeMaterial('p1', 0x00ff00);
            const retrieved = materialSystem.getMaterial('p1');
            expect(retrieved).toBe(mat);
        });

        it('should return null for non-existent material', () => {
            expect(materialSystem.getMaterial('ghost')).toBeNull();
        });

        it('should handle trail material templates', () => {
            // Default check
            expect(materialSystem.getTrailColorTemplate('p1')).toBe(0x00ff00);

            // Set and check
            materialSystem.updateTrailMaterialTemplate('p1', 0x123456);
            expect(materialSystem.getTrailColorTemplate('p1')).toBe(0x123456);

            // Other player check
            expect(materialSystem.getTrailColorTemplate('p2')).toBe(0x00ff00);
        });
    });

    describe('Edge Cases & Error Handling', () => {
        it('should handle updateMaterialColor for non-existent entity', () => {
            // Should not throw
            expect(() => materialSystem.updateMaterialColor('ghost', 0xffffff)).not.toThrow();
        });

        it('should handle updateMaterialColor for disposed entity', () => {
            materialSystem.createBikeMaterial('p1', 0xffffff);
            materialSystem.disposeMaterial('p1');

            // Should not throw or crash
            expect(() => materialSystem.updateMaterialColor('p1', 0x000000)).not.toThrow();
        });

        it('should handle disposeMaterial for non-existent entity', () => {
            expect(() => materialSystem.disposeMaterial('ghost')).not.toThrow();
        });

        it('should skip disposed materials in global intensity update', () => {
            const mat = materialSystem.createBikeMaterial('p1', 0xffffff);
            materialSystem.disposeMaterial('p1');

            // Reset mock to detect if triggered erroneously
            mat.emissiveIntensity = 0;

            materialSystem.setGlobalIntensityMultiplier(0.5);

            // Should remain unchanged/unaffected by logic since it's disposed
            // (Note: In actual code, it iterates map, disposed materials are in map but checked against set)
            expect(mat.emissiveIntensity).toBe(0);
        });
    });

    describe('Pulse Loop & Full Disposal', () => {
        it('should update pulse state and material intensities', () => {
            const mat = materialSystem.createBikeMaterial('bike1', 0xffffff);
            materialSystem.updatePulseAnimation(0.1);
            expect(materialSystem.pulseState.time).toBeGreaterThan(0);
            expect(mat.emissiveIntensity).not.toBe(materialSystem.baseIntensities.bike);
        });

        it('should skip paused pulse update', () => {
            materialSystem.pausePulse();
            const initialTime = materialSystem.pulseState.time;
            materialSystem.updatePulseAnimation(0.1);
            expect(materialSystem.pulseState.time).toBe(initialTime);
        });

        it('should correct dispose loop', () => {
            const m1 = materialSystem.createBikeMaterial('b1', 0xffffff);
            const m2 = materialSystem.createTrailMaterial('t1', 0xffffff);

            const d1 = m1.dispose;
            const d2 = m2.dispose;

            materialSystem.dispose();

            expect(d1).toHaveBeenCalled();
            expect(d2).toHaveBeenCalled();
            expect(materialSystem.materials.size).toBe(0);
            expect(materialSystem.disposedMaterials.size).toBe(0);
            expect(materialSystem.pulseState.time).toBe(0);
        });
    });
});
