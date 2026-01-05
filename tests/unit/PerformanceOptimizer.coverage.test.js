/**
 * PerformanceOptimizer Coverage Tests
 */
const { PerformanceOptimizer } = require('../../src/utils/PerformanceOptimizer.js');

// Mock Logger
jest.mock('../../src/utils/Logger.js', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}));

describe('PerformanceOptimizer Coverage', () => {
    let optimizer;
    let mockScene;
    let mockRenderer;
    let originalThree;

    beforeEach(() => {
        // Mock THREE
        global.THREE = {
            MeshLambertMaterial: jest.fn().mockImplementation(() => ({ dispose: jest.fn() })),
            MeshBasicMaterial: jest.fn().mockImplementation(() => ({ dispose: jest.fn() })),
            LineBasicMaterial: jest.fn().mockImplementation(() => ({ dispose: jest.fn() })),
            BoxGeometry: jest.fn().mockImplementation(() => ({ dispose: jest.fn() })),
            SphereGeometry: jest.fn().mockImplementation(() => ({ dispose: jest.fn() })),
            OctahedronGeometry: jest.fn().mockImplementation(() => ({ dispose: jest.fn() })),
            IcosahedronGeometry: jest.fn().mockImplementation(() => ({ dispose: jest.fn() })),
            ConeGeometry: jest.fn().mockImplementation(() => ({ dispose: jest.fn() })),
            Vector3: jest
                .fn()
                .mockImplementation((x, y, z) => ({
                    x,
                    y,
                    z,
                    distanceTo: jest.fn().mockReturnValue(10),
                })),
            Texture: jest.fn().mockImplementation(() => ({ dispose: jest.fn() })),
        };

        mockScene = {
            traverse: jest.fn(),
        };
        mockRenderer = {
            info: {
                render: { calls: 100 },
                memory: { geometries: 50, textures: 20 },
            },
        };

        jest.useFakeTimers();

        optimizer = new PerformanceOptimizer(mockScene, mockRenderer);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
        global.THREE = undefined;
    });

    describe('Geometry Pools', () => {
        it('should initialize geometry pools with fallbacks', () => {
            // Already initialized in constructor
            expect(optimizer.geometryPools.bike).toBeDefined();
            expect(optimizer.geometryPools.trailSegment).toBeDefined();
            expect(optimizer.geometryPools.powerUp.has('speed')).toBe(true);
            expect(optimizer.geometryPools.powerUp.has('shield')).toBe(true);
        });

        it('should get shared geometry', () => {
            const bikeGeo = optimizer.getSharedGeometry('bike');
            expect(bikeGeo).toBe(optimizer.geometryPools.bike);

            const shieldGeo = optimizer.getSharedGeometry('shield');
            expect(shieldGeo).toBeDefined();
        });

        it('should return fallback for unknown geometry', () => {
            const unknown = optimizer.getSharedGeometry('unknown');
            expect(unknown).toBe(optimizer.geometryPools.bike);
        });
    });

    describe('Material Pools', () => {
        it('should get or create bike material', () => {
            const mat1 = optimizer.getOrCreateBikeMaterial(0xff0000, { opacity: 0.5 });
            expect(mat1).toBeDefined();

            // Cached
            const mat2 = optimizer.getOrCreateBikeMaterial(0xff0000, { opacity: 0.5 });
            expect(mat1).toBe(mat2);

            // New
            const mat3 = optimizer.getOrCreateBikeMaterial(0xff0000, { opacity: 1.0 });
            expect(mat3).not.toBe(mat1);
        });

        it('should get or create trail material (styles)', () => {
            const glowing = optimizer.getOrCreateTrailMaterial(0xff0000, 'glowing', {
                opacity: 0.5,
            });
            expect(glowing).toBeDefined();

            const solid = optimizer.getOrCreateTrailMaterial(0x00ff00, 'solid');
            expect(solid).toBeDefined();

            const cached = optimizer.getOrCreateTrailMaterial(0xff0000, 'glowing', {
                opacity: 0.5,
            });
            expect(cached).toBe(glowing);
        });

        it('should get or create theme material (elements)', () => {
            const grid = optimizer.getOrCreateThemeMaterial('neon', 'grid', { color: 0xffffff });
            expect(grid).toBeDefined();

            const bg = optimizer.getOrCreateThemeMaterial('neon', 'background', {
                color: 0x000000,
            });
            expect(bg).toBeDefined();

            const other = optimizer.getOrCreateThemeMaterial('neon', 'wall', { color: 0x888888 });
            expect(other).toBeDefined();
        });
    });

    describe('Texture Pools', () => {
        it('should get or create texture', () => {
            const createFn = jest.fn().mockReturnValue({ id: 'tex1' });
            const tex = optimizer.getOrCreateTexture('patterns', 'p1', createFn);
            expect(tex).toEqual({ id: 'tex1' });
            expect(createFn).toHaveBeenCalled();

            // Cached
            const tex2 = optimizer.getOrCreateTexture('patterns', 'p1', createFn);
            expect(tex2).toBe(tex);
            expect(createFn).toHaveBeenCalledTimes(1);
        });

        it('should handle unknown texture pool', () => {
            const tex = optimizer.getOrCreateTexture('unknown', 'key', () => {});
            expect(tex).toBeNull();
        });
    });

    describe('LOD Systems', () => {
        it('should apply trail LOD', () => {
            const mockObj = {
                userData: { materialId: 'trail_1' },
                position: { distanceTo: jest.fn() },
                visible: true,
                material: { opacity: 1 },
            };
            mockScene.traverse.mockImplementation((cb) => cb(mockObj));

            // High detail (< 50)
            mockObj.position.distanceTo.mockReturnValue(10);
            optimizer.applyTrailLOD({ x: 0, y: 0, z: 0 });
            expect(mockObj.visible).toBe(true);
            expect(mockObj.material.opacity).toBe(
                optimizer.lodConfig.trailSegments.highDetail.opacity
            );

            // Medium detail (> 50)
            mockObj.position.distanceTo.mockReturnValue(60);
            optimizer.applyTrailLOD({ x: 0, y: 0, z: 0 });
            expect(mockObj.visible).toBe(true);
            expect(mockObj.material.opacity).toBe(
                optimizer.lodConfig.trailSegments.mediumDetail.opacity
            );

            // Low detail (> 100)
            mockObj.position.distanceTo.mockReturnValue(110);
            optimizer.applyTrailLOD({ x: 0, y: 0, z: 0 });
            expect(mockObj.visible).toBe(true);
            expect(mockObj.material.opacity).toBe(
                optimizer.lodConfig.trailSegments.lowDetail.opacity
            );

            // Culled (> 150)
            mockObj.position.distanceTo.mockReturnValue(200);
            optimizer.applyTrailLOD({ x: 0, y: 0, z: 0 });
            expect(mockObj.visible).toBe(false);
        });

        it('should apply effects LOD', () => {
            const mockObj = {
                userData: { effectType: 'glow', originalEmissiveIntensity: 1 },
                position: {},
                visible: true,
                material: { emissiveIntensity: 1 },
            };
            mockScene.traverse.mockImplementation((cb) => cb(mockObj));
            const cameraPos = { distanceTo: jest.fn() };

            // High detail
            cameraPos.distanceTo.mockReturnValue(10);
            optimizer.applyEffectsLOD(cameraPos);
            expect(mockObj.visible).toBe(true);
            expect(mockObj.material.emissiveIntensity).toBe(1);

            // Medium detail (> 60)
            cameraPos.distanceTo.mockReturnValue(70);
            optimizer.applyEffectsLOD(cameraPos);
            expect(mockObj.visible).toBe(true);
            expect(mockObj.material.emissiveIntensity).toBeLessThan(1);

            // Culled (> 120)
            cameraPos.distanceTo.mockReturnValue(150);
            optimizer.applyEffectsLOD(cameraPos);
            expect(mockObj.visible).toBe(false);
        });
    });

    describe('Batch Updates', () => {
        it('should schedule and execute batch updates', () => {
            const mat = { needsUpdate: false };
            const geo = { attributes: { pos: { needsUpdate: false } } };
            const tex = { needsUpdate: false };

            optimizer.scheduleMaterialUpdate(mat);
            optimizer.scheduleGeometryUpdate(geo);
            optimizer.scheduleTextureUpdate(tex);

            expect(optimizer.batchUpdates.scheduled).toBe(true);

            optimizer.executeBatchUpdates();

            expect(mat.needsUpdate).toBe(true);
            expect(geo.attributes.pos.needsUpdate).toBe(true);
            expect(tex.needsUpdate).toBe(true);
            expect(optimizer.batchUpdates.scheduled).toBe(false);
        });
    });

    describe('Performance Monitoring', () => {
        it('should update metrics', () => {
            optimizer.updatePerformanceMetrics();
            expect(optimizer.performanceMetrics.drawCalls).toBe(100);
            expect(optimizer.performanceMetrics.geometryCount).toBe(50);
        });

        it('should optimize scene (integration)', () => {
            const camPos = { x: 0, y: 0, z: 0, distanceTo: jest.fn().mockReturnValue(0) };
            optimizer.optimizeScene(camPos);
            expect(mockScene.traverse).toHaveBeenCalled();
        });

        it('should check acceptable performance', () => {
            optimizer.performanceMetrics.frameTime = 16;
            expect(optimizer.isPerformanceAcceptable()).toBe(true);

            optimizer.performanceMetrics.frameTime = 30;
            expect(optimizer.isPerformanceAcceptable()).toBe(false);
        });

        it('should trigger optimization on low FPS', () => {
            optimizer.debugMode = true;
            // Ensure low FPS by simulating large time gap
            // Just advance time significantly.
            // startPerformanceMonitoring loop runs every 1000ms.
            jest.advanceTimersByTime(1100);
            // frameTime will be approx 1100 ms (very high), so averageFPS < 1 (very low).
        });

        it('should start monitoring and optimization loop', () => {
            const spyMonitor = jest.spyOn(optimizer, 'updatePerformanceMetrics');
            const spyOptimize = jest.spyOn(optimizer, 'optimizePerformance');

            jest.advanceTimersByTime(1100);
            // Logic triggers logic within 1s.

            expect(spyMonitor).toHaveBeenCalled();
            // frameTime approx 1100 -> FPS < 1 -> optimizePerformance() called
            expect(spyOptimize).toHaveBeenCalled();
        });
    });

    describe('Cleanup', () => {
        it('should cleanup resources and dispose materials/textures', () => {
            const mat = { dispose: jest.fn() };
            optimizer.materialPools.bike.set('k1', mat);

            const tex = { dispose: jest.fn() };
            optimizer.texturePools.gradients.set('t1', tex);

            optimizer.cleanup();

            expect(mat.dispose).toHaveBeenCalled();
            expect(tex.dispose).toHaveBeenCalled();
            expect(optimizer.materialPools.bike.size).toBe(0);
        });

        it('should dispose specific material', () => {
            const mat = { dispose: jest.fn() };
            optimizer.materialPools.bike.set('k1', mat);

            optimizer.disposeMaterial('bike', 'k1');
            expect(mat.dispose).toHaveBeenCalled();
            expect(optimizer.materialPools.bike.has('k1')).toBe(false);
        });
    });
});
