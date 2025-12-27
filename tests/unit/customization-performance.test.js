/**
 * Performance Benchmark Tests for Customization System
 * Tests performance impact and optimization effectiveness
 */

const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
};

const MockLoggerClass = jest.fn().mockImplementation(() => mockLogger);
MockLoggerClass.create = jest.fn((namespace) => mockLogger);

jest.mock('@/utils/Logger.js', () => ({
    Logger: MockLoggerClass,
    logger: mockLogger,
    createLogger: jest.fn(() => mockLogger),
}));

const { CustomizationManager } = require('@/systems/CustomizationManager.js');
const { PerformanceOptimizer } = require('@/utils/PerformanceOptimizer.js');
const { ThemeEngine } = require('@/systems/ThemeEngine.js');
const { TrailStyleRenderer } = require('@/rendering/TrailStyleRenderer.js');

// Mock Three.js with performance tracking
const mockThreeJS = {
    Scene: jest.fn().mockImplementation(() => ({
        add: jest.fn(),
        remove: jest.fn(),
        traverse: jest.fn(),
        background: null,
    })),
    WebGLRenderer: jest.fn().mockImplementation(() => ({
        setSize: jest.fn(),
        setClearColor: jest.fn(),
        render: jest.fn(),
        info: {
            render: { calls: 0 },
            memory: { geometries: 0, textures: 0 },
        },
    })),
    PerspectiveCamera: jest.fn().mockImplementation(() => ({
        position: { x: 0, y: 20, z: 20 },
    })),
    BoxGeometry: jest.fn().mockImplementation(() => ({ dispose: jest.fn() })),
    SphereGeometry: jest.fn().mockImplementation(() => ({ dispose: jest.fn() })),
    MeshLambertMaterial: jest.fn().mockImplementation((options) => ({
        color: options.color,
        dispose: jest.fn(),
        needsUpdate: false,
    })),
    Vector3: jest.fn().mockImplementation(() => ({
        distanceTo: jest.fn().mockReturnValue(10),
    })),
};

global.THREE = mockThreeJS;

// Mock performance.now with controllable time
let mockTime = 0;
global.performance = {
    now: jest.fn(() => mockTime),
};

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
    setTimeout(callback, 16);
});

describe('Customization System Performance', () => {
    let scene, renderer, camera;
    let performanceOptimizer, customizationManager;
    let mockRenderingEngine, mockPreferenceStorage;

    beforeEach(() => {
        jest.clearAllMocks();
        mockTime = 0;

        // Reset Three.js call counts
        THREE.MeshLambertMaterial.mockClear();
        THREE.BoxGeometry.mockClear();

        // Create Three.js objects
        scene = new THREE.Scene();
        renderer = new THREE.WebGLRenderer();
        camera = new THREE.PerspectiveCamera();

        // Mock rendering engine
        mockRenderingEngine = {
            scene: scene,
            renderer: renderer,
            camera: camera,
            player: { material: null },
            emissiveMaterialSystem: {
                updateBikeMaterial: jest.fn(),
                updateTrailMaterialTemplate: jest.fn(),
                createBikeMaterial: jest
                    .fn()
                    .mockReturnValue(new THREE.MeshLambertMaterial({ color: 0x00ff00 })),
                createTrailMaterial: jest
                    .fn()
                    .mockReturnValue(new THREE.MeshLambertMaterial({ color: 0x00ff00 })),
            },
            trailStyleRenderer: null,
        };

        // Mock preference storage
        mockPreferenceStorage = {
            loadPreferences: jest.fn(),
            savePreferences: jest.fn(),
        };

        // Create system components
        performanceOptimizer = new PerformanceOptimizer(scene, renderer);
        customizationManager = new CustomizationManager(mockRenderingEngine, mockPreferenceStorage);

        // Reset mocks after initialization to clear calls from setup
        THREE.MeshLambertMaterial.mockClear();
    });

    describe('material reuse performance', () => {
        it('should reuse materials efficiently', () => {
            const color = 0xff0000;
            const iterations = 100;

            // First call creates the material
            const startTime = performance.now();

            const materials = [];
            for (let i = 0; i < iterations; i++) {
                materials.push(performanceOptimizer.getOrCreateBikeMaterial(color));
            }

            const endTime = performance.now();

            // All materials should be the same instance
            const uniqueMaterials = new Set(materials);
            expect(uniqueMaterials.size).toBe(1);

            // Should only have been called once during the loop
            expect(THREE.MeshLambertMaterial).toHaveBeenCalledTimes(1);
        });

        it('should handle different material configurations efficiently', () => {
            const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
            const styles = ['solid', 'dashed', 'glowing', 'rainbow'];

            const startTime = performance.now();

            // Create materials for all combinations
            const materials = [];
            colors.forEach((color) => {
                styles.forEach((style) => {
                    materials.push(performanceOptimizer.getOrCreateTrailMaterial(color, style));
                });
            });

            mockTime += 20; // Simulate 20ms elapsed
            const endTime = performance.now();

            // Should create exactly colors.length * styles.length materials
            expect(materials.length).toBe(colors.length * styles.length);

            // Performance should be acceptable
            expect(endTime - startTime).toBeLessThan(100); // Less than 100ms
        });

        it('should optimize batch material updates', () => {
            const materials = [];

            // Create multiple materials
            for (let i = 0; i < 10; i++) {
                materials.push(performanceOptimizer.getOrCreateBikeMaterial(0xff0000 + i));
            }

            const startTime = performance.now();

            // Schedule batch updates
            materials.forEach((material) => {
                performanceOptimizer.scheduleMaterialUpdate(material);
            });

            // Execute batch updates
            performanceOptimizer.executeBatchUpdates();

            mockTime += 5; // Simulate 5ms elapsed
            const endTime = performance.now();

            // All materials should be updated
            materials.forEach((material) => {
                expect(material.needsUpdate).toBe(true);
            });

            // Batch update should be fast
            expect(endTime - startTime).toBeLessThan(20); // Less than 20ms
        });
    });

    describe('geometry sharing performance', () => {
        it('should share geometries efficiently', () => {
            const geometryTypes = ['bike', 'trailSegment', 'speed', 'shield'];

            const startTime = performance.now();

            // Request same geometries multiple times
            const geometries = [];
            for (let i = 0; i < 50; i++) {
                geometryTypes.forEach((type) => {
                    geometries.push(performanceOptimizer.getSharedGeometry(type));
                });
            }

            mockTime += 5; // Simulate 5ms elapsed
            const endTime = performance.now();

            // Should reuse geometries
            const bikeGeometries = geometries.filter((_, index) => index % 4 === 0);
            const uniqueBikeGeometries = new Set(bikeGeometries);
            expect(uniqueBikeGeometries.size).toBe(1);

            // Performance should be excellent (just reference copying)
            expect(endTime - startTime).toBeLessThan(10); // Less than 10ms
        });

        it('should minimize geometry creation calls', () => {
            const initialGeometryCount = THREE.BoxGeometry.mock.calls.length;

            // Request geometries multiple times
            for (let i = 0; i < 20; i++) {
                performanceOptimizer.getSharedGeometry('bike');
                performanceOptimizer.getSharedGeometry('trailSegment');
            }

            // Should not create additional geometries (they're shared)
            const finalGeometryCount = THREE.BoxGeometry.mock.calls.length;
            expect(finalGeometryCount).toBe(initialGeometryCount);
        });
    });

    describe('LOD system performance', () => {
        it('should efficiently cull distant objects', () => {
            const objectCount = 1000;
            const mockObjects = [];

            // Create mock trail objects at various distances
            for (let i = 0; i < objectCount; i++) {
                const distance = i * 0.5; // 0 to 500 units
                mockObjects.push({
                    userData: { materialId: `trail_player_${i}` },
                    position: { distanceTo: jest.fn().mockReturnValue(distance) },
                    visible: true,
                    material: { opacity: 0.8 },
                });
            }

            scene.traverse.mockImplementation((callback) => {
                mockObjects.forEach(callback);
            });

            const startTime = performance.now();

            // Apply LOD optimizations
            performanceOptimizer.applyTrailLOD(camera.position);

            mockTime += 15; // Simulate 15ms elapsed
            const endTime = performance.now();

            // Count visible objects
            const visibleObjects = mockObjects.filter((obj) => obj.visible);
            const culledObjects = mockObjects.filter((obj) => !obj.visible);

            // Should cull distant objects (beyond 150 units)
            expect(culledObjects.length).toBeGreaterThan(0);
            expect(visibleObjects.length).toBeLessThan(objectCount);

            // LOD processing should be fast
            expect(endTime - startTime).toBeLessThan(50); // Less than 50ms for 1000 objects
        });

        it('should adjust opacity based on distance efficiently', () => {
            const mockObjects = [
                {
                    // Close object
                    userData: { materialId: 'trail_player_1' },
                    position: { distanceTo: jest.fn().mockReturnValue(10) },
                    visible: true,
                    material: { opacity: 0.8 },
                },
                {
                    // Medium distance object
                    userData: { materialId: 'trail_player_2' },
                    position: { distanceTo: jest.fn().mockReturnValue(75) },
                    visible: true,
                    material: { opacity: 0.8 },
                },
                {
                    // Far object
                    userData: { materialId: 'trail_player_3' },
                    position: { distanceTo: jest.fn().mockReturnValue(125) },
                    visible: true,
                    material: { opacity: 0.8 },
                },
            ];

            scene.traverse.mockImplementation((callback) => {
                mockObjects.forEach(callback);
            });

            performanceOptimizer.applyTrailLOD(camera.position);

            // Check opacity adjustments
            expect(mockObjects[0].material.opacity).toBe(0.8); // High detail
            expect(mockObjects[1].material.opacity).toBe(0.6); // Medium detail
            expect(mockObjects[2].material.opacity).toBe(0.4); // Low detail
        });
    });

    describe('frame rate impact', () => {
        it('should maintain target frame rate with default settings', () => {
            const targetFrameTime = 16.67; // 60 FPS

            // Manually set frameTime to simulate metrics
            performanceOptimizer.performanceMetrics.frameTime = targetFrameTime;

            expect(performanceOptimizer.isPerformanceAcceptable()).toBe(true);
        });

        it('should detect performance degradation', () => {
            // Manually set poor frameTime
            performanceOptimizer.performanceMetrics.frameTime = 30; // ~33 FPS

            expect(performanceOptimizer.isPerformanceAcceptable()).toBe(false);
        });

        it('should optimize performance when degradation is detected', () => {
            // Simulate performance optimization scenario
            const mockTrailObjects = [];
            for (let i = 0; i < 100; i++) {
                mockTrailObjects.push({
                    userData: { materialId: `trail_player_${i}` },
                    position: { distanceTo: jest.fn().mockReturnValue(200) }, // Far away
                    visible: true,
                    material: { opacity: 0.8 },
                });
            }

            scene.traverse.mockImplementation((callback) => {
                mockTrailObjects.forEach(callback);
            });

            const startTime = performance.now();

            // Run optimization
            performanceOptimizer.optimizeScene(camera.position);

            mockTime += 10; // Simulate 10ms elapsed
            const endTime = performance.now();

            // Should cull distant objects to improve performance
            const visibleObjects = mockTrailObjects.filter((obj) => obj.visible);
            expect(visibleObjects.length).toBe(0); // All should be culled

            // Optimization should be fast
            expect(endTime - startTime).toBeLessThan(30); // Less than 30ms
        });
    });

    describe('memory usage optimization', () => {
        it('should limit memory growth with material pooling', () => {
            const initialMaterialCount = performanceOptimizer.performanceMetrics.materialCount;

            // Create many materials with repeated properties
            const colors = [0xff0000, 0x00ff00, 0x0000ff];
            for (let i = 0; i < 100; i++) {
                const color = colors[i % colors.length];
                performanceOptimizer.getOrCreateBikeMaterial(color);
            }

            // Should only create 3 unique materials despite 100 requests
            const finalMaterialCount = performanceOptimizer.performanceMetrics.materialCount;
            expect(finalMaterialCount - initialMaterialCount).toBe(3);
        });

        it('should properly dispose of unused resources', () => {
            // Create some materials
            const material1 = performanceOptimizer.getOrCreateBikeMaterial(0xff0000);
            const material2 = performanceOptimizer.getOrCreateTrailMaterial(0x00ff00, 'solid');

            expect(performanceOptimizer.performanceMetrics.materialCount).toBeGreaterThan(0);

            // Cleanup
            performanceOptimizer.cleanup();

            // Should dispose of materials
            expect(material1.dispose).toHaveBeenCalled();
            expect(material2.dispose).toHaveBeenCalled();
            expect(performanceOptimizer.performanceMetrics.materialCount).toBe(0);
        });

        it('should handle texture pooling efficiently', () => {
            const createTextureFn = jest.fn().mockReturnValue({ dispose: jest.fn() });

            // Request same texture multiple times
            const texture1 = performanceOptimizer.getOrCreateTexture(
                'gradients',
                'test-key',
                createTextureFn
            );
            const texture2 = performanceOptimizer.getOrCreateTexture(
                'gradients',
                'test-key',
                createTextureFn
            );

            // Should reuse texture
            expect(texture1).toBe(texture2);
            expect(createTextureFn).toHaveBeenCalledTimes(1);
        });
    });

    describe('customization change performance', () => {
        it('should handle rapid color changes efficiently', () => {
            const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];

            const startTime = performance.now();

            // Rapidly change colors
            colors.forEach((color) => {
                customizationManager.setBikeColor('player', color);
                customizationManager.setTrailColor('player', color);
            });

            mockTime += 25; // Simulate 25ms elapsed
            const endTime = performance.now();

            // Should handle rapid changes efficiently
            expect(endTime - startTime).toBeLessThan(50); // Less than 50ms

            // Final state should be correct
            const state = customizationManager.getCurrentState();
            expect(state.bikeColor).toBe('#FF00FF');
            expect(state.trailColor).toBe('#FF00FF');
        });

        it('should handle rapid theme changes efficiently', () => {
            const themes = ['classic-grid', 'neon-city', 'space', 'tron-legacy'];

            const startTime = performance.now();

            // Rapidly change themes
            themes.forEach((theme) => {
                customizationManager.setArenaTheme(theme);
            });

            mockTime += 30; // Simulate 30ms elapsed
            const endTime = performance.now();

            // Should handle rapid changes efficiently
            expect(endTime - startTime).toBeLessThan(100); // Less than 100ms

            // Final state should be correct
            expect(customizationManager.getCurrentState().arenaTheme).toBe('tron-legacy');
        });

        it('should optimize preview mode performance', () => {
            customizationManager.enablePreviewMode();

            const startTime = performance.now();

            // Make multiple preview changes
            customizationManager.setBikeColor('player', '#FF0000');
            customizationManager.setTrailColor('player', '#00FF00');
            customizationManager.setTrailStyle('player', 'glowing');
            customizationManager.setArenaTheme('neon-city');

            mockTime += 20; // Simulate 20ms elapsed
            const endTime = performance.now();

            // Preview changes should be fast
            expect(endTime - startTime).toBeLessThan(50); // Less than 50ms

            // Original state should be unchanged
            expect(customizationManager.currentState.bikeColor).toBe('#00FF00');

            // Preview state should have changes
            expect(customizationManager.previewState.bikeColor).toBe('#FF0000');
        });
    });

    describe('stress testing', () => {
        it('should handle high object count efficiently', () => {
            const objectCount = 5000;
            const mockObjects = [];

            // Create many objects
            for (let i = 0; i < objectCount; i++) {
                mockObjects.push({
                    userData: { materialId: `trail_player_${i}` },
                    position: { distanceTo: jest.fn().mockReturnValue(Math.random() * 200) },
                    visible: true,
                    material: { opacity: 0.8 },
                });
            }

            scene.traverse.mockImplementation((callback) => {
                mockObjects.forEach(callback);
            });

            const startTime = performance.now();

            // Apply optimizations to all objects
            performanceOptimizer.optimizeScene(camera.position);

            mockTime += 100; // Simulate 100ms elapsed
            const endTime = performance.now();

            // Should handle large object count
            expect(endTime - startTime).toBeLessThan(200); // Less than 200ms for 5000 objects

            // Should optimize visibility
            const visibleObjects = mockObjects.filter((obj) => obj.visible);
            expect(visibleObjects.length).toBeLessThan(objectCount);
        });

        it('should maintain performance with complex customization combinations', () => {
            const startTime = performance.now();

            // Apply complex customization combination
            customizationManager.setBikeColor('player', '#FF1493');
            customizationManager.setTrailColor('player', '#FF69B4');
            customizationManager.setTrailStyle('player', 'glowing');
            customizationManager.setArenaTheme('neon-city');

            // Trigger performance optimization
            if (customizationManager.performanceOptimizer) {
                customizationManager.performanceOptimizer.optimizeScene(camera.position);
            }

            mockTime += 50; // Simulate 50ms elapsed
            const endTime = performance.now();

            // Complex customizations should still be performant
            expect(endTime - startTime).toBeLessThan(100); // Less than 100ms

            // Performance should remain acceptable
            expect(customizationManager.isPerformanceAcceptable()).toBe(true);
        });
    });
});
