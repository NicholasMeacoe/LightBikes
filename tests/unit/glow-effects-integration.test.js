/**
 * Integration Tests for Glow Effects System
 */

const { PostProcessingPipeline } = require('@/rendering/PostProcessingPipeline.js');
const { PerformanceScaler } = require('@/utils/PerformanceScaler.js');
const { GlowSettings } = require('@/systems/GlowSettings.js');
const { EmissiveMaterialSystem } = require('@/rendering/EmissiveMaterialSystem.js');

describe('Glow Effects Integration Tests', () => {
    let mockRenderer, mockScene, mockCamera;
    let getItemSpy, setItemSpy;
    let store = {};

    beforeAll(() => {
        global.THREE.EffectComposer = jest.fn().mockImplementation(() => ({
            addPass: jest.fn(),
            render: jest.fn(),
            setSize: jest.fn(),
            dispose: jest.fn(),
            passes: [],
        }));
        global.THREE.RenderPass = jest.fn().mockImplementation(() => ({
            dispose: jest.fn(),
        }));
        global.THREE.UnrealBloomPass = jest.fn().mockImplementation(() => ({
            strength: 1.0,
            radius: 0.4,
            threshold: 0.85,
            resolution: { x: 800, y: 600 },
            renderToScreen: false,
            dispose: jest.fn(),
        }));
        if (!global.THREE.Vector2) {
            global.THREE.Vector2 = jest
                .fn()
                .mockImplementation((x, y) => ({ x: x || 0, y: y || 0 }));
        }
        if (!global.THREE.MeshLambertMaterial) {
            global.THREE.MeshLambertMaterial = jest.fn().mockImplementation((params) => ({
                ...params,
                color: { setHex: jest.fn() },
                emissive: { setHex: jest.fn() },
                dispose: jest.fn(),
            }));
        }
        if (!global.THREE.MeshBasicMaterial) {
            global.THREE.MeshBasicMaterial = jest.fn().mockImplementation((params) => ({
                ...params,
                color: { setHex: jest.fn() },
                emissive: { setHex: jest.fn() },
                dispose: jest.fn(),
            }));
        }
    });

    beforeEach(() => {
        store = {};
        getItemSpy = jest
            .spyOn(Storage.prototype, 'getItem')
            .mockImplementation((key) => store[key] || null);
        setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
            store[key] = value;
        });

        mockRenderer = {
            render: jest.fn(),
            getSize: jest.fn((v) => {
                if (v) {
                    v.x = 800;
                    v.y = 600;
                    return v;
                }
                return { x: 800, y: 600 };
            }),
            getContext: jest.fn().mockReturnValue({
                getError: () => 0,
                NO_ERROR: 0,
            }),
        };
        mockScene = { traverse: jest.fn() };
        mockCamera = {};

        jest.spyOn(document, 'getElementById').mockReturnValue(null);
        jest.clearAllMocks();
    });

    afterEach(() => {
        getItemSpy.mockRestore();
        setItemSpy.mockRestore();
        jest.restoreAllMocks();
    });

    describe('Post-processing Pipeline Integration', () => {
        it('should integrate post-processing with existing renderer', () => {
            const pipeline = new PostProcessingPipeline(mockRenderer, mockScene, mockCamera);
            const result = pipeline.initialize();
            expect(result).toBe(true);
            expect(pipeline.composer).toBeDefined();
        });
    });

    describe('Performance Scaling Integration', () => {
        it('should scale quality based on performance metrics', () => {
            const scaler = new PerformanceScaler();
            const callback = jest.fn();
            scaler.setOnQualityChange(callback);

            scaler.setQuality('low');
            expect(callback).toHaveBeenCalledWith('low', expect.any(Object), 'manual');
        });
    });

    describe('Settings Persistence Integration', () => {
        it('should persist and load glow settings', () => {
            const settings = new GlowSettings();
            settings.setIntensity('HIGH');
            expect(setItemSpy).toHaveBeenCalledWith(
                'lightbikes_glow_settings',
                expect.stringContaining('HIGH')
            );

            store['lightbikes_glow_settings'] = JSON.stringify({ intensity: 'HIGH', version: 1 });
            const newSettings = new GlowSettings();
            expect(newSettings.getIntensity()).toBe('HIGH');
        });
    });

    describe('Material System Integration', () => {
        it('should update pulse animation across all materials', () => {
            const materialSystem = new EmissiveMaterialSystem();
            const bikeMaterial = materialSystem.createBikeMaterial('player', 0x00ff00);

            // Initial bike material emissiveIntensity is 0.8 * 1.0 = 0.8
            // After 1.25s (half of 2.5s cycle), pulse intensity is 0.9.
            // final intensity = 0.8 * 1.0 * 0.9 = 0.72
            materialSystem.updatePulseAnimation(1.25);

            expect(bikeMaterial.emissiveIntensity).toBeCloseTo(0.72, 2);
        });
    });
});
