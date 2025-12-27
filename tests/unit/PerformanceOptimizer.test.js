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

const { PerformanceOptimizer } = require('@/utils/PerformanceOptimizer.js');

// Mock Three.js objects
const mockScene = {
    traverse: jest.fn(),
};

const mockRenderer = {
    info: {
        render: { calls: 10 },
        memory: { geometries: 5, textures: 3 },
    },
};

// Mock Three.js constructors
global.THREE = {
    BoxGeometry: jest.fn().mockImplementation(() => ({
        dispose: jest.fn(),
    })),
    SphereGeometry: jest.fn().mockImplementation(() => ({
        dispose: jest.fn(),
    })),
    OctahedronGeometry: jest.fn().mockImplementation(() => ({
        dispose: jest.fn(),
    })),
    ConeGeometry: jest.fn().mockImplementation(() => ({
        dispose: jest.fn(),
    })),
    IcosahedronGeometry: jest.fn().mockImplementation(() => ({
        dispose: jest.fn(),
    })),
    MeshLambertMaterial: jest.fn().mockImplementation((options) => ({
        color: options.color,
        transparent: options.transparent,
        opacity: options.opacity,
        emissive: options.emissive,
        emissiveIntensity: options.emissiveIntensity,
        dispose: jest.fn(),
        needsUpdate: false,
    })),
    LineBasicMaterial: jest.fn().mockImplementation((options) => ({
        color: options.color,
        opacity: options.opacity,
        transparent: options.transparent,
        dispose: jest.fn(),
        needsUpdate: false,
    })),
    MeshBasicMaterial: jest.fn().mockImplementation((options) => ({
        color: options.color,
        transparent: options.transparent,
        opacity: options.opacity,
        dispose: jest.fn(),
        needsUpdate: false,
    })),
    Vector3: jest.fn().mockImplementation(() => ({
        distanceTo: jest.fn().mockReturnValue(10),
    })),
};

// Mock performance.now
global.performance = {
    now: jest.fn().mockReturnValue(1000),
};

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
    setTimeout(callback, 16);
});

describe('PerformanceOptimizer', () => {
    let performanceOptimizer;

    beforeEach(() => {
        jest.clearAllMocks();
        performanceOptimizer = new PerformanceOptimizer(mockScene, mockRenderer);
    });

    describe('constructor', () => {
        it('should initialize material pools', () => {
            expect(performanceOptimizer.materialPools.bike).toBeInstanceOf(Map);
            expect(performanceOptimizer.materialPools.trail).toBeInstanceOf(Map);
            expect(performanceOptimizer.materialPools.theme).toBeInstanceOf(Map);
        });

        it('should initialize geometry pools', () => {
            expect(performanceOptimizer.geometryPools.bike).toBeDefined();
            expect(performanceOptimizer.geometryPools.trailSegment).toBeDefined();
            expect(performanceOptimizer.geometryPools.powerUp).toBeInstanceOf(Map);
        });

        it('should initialize texture pools', () => {
            expect(performanceOptimizer.texturePools.gradients).toBeInstanceOf(Map);
            expect(performanceOptimizer.texturePools.patterns).toBeInstanceOf(Map);
            expect(performanceOptimizer.texturePools.effects).toBeInstanceOf(Map);
        });

        it('should initialize LOD configuration', () => {
            expect(performanceOptimizer.lodConfig.trailSegments).toBeDefined();
            expect(performanceOptimizer.lodConfig.effects).toBeDefined();
        });
    });

    describe('getOrCreateBikeMaterial', () => {
        it('should create new bike material', () => {
            const material = performanceOptimizer.getOrCreateBikeMaterial(0xff0000);

            expect(THREE.MeshLambertMaterial).toHaveBeenCalledWith({
                color: 0xff0000,
                transparent: false,
                opacity: 1.0,
                emissive: 0x000000,
                emissiveIntensity: 0,
            });
            expect(material).toBeDefined();
        });

        it('should reuse existing bike material', () => {
            const material1 = performanceOptimizer.getOrCreateBikeMaterial(0xff0000);
            const material2 = performanceOptimizer.getOrCreateBikeMaterial(0xff0000);

            expect(material1).toBe(material2);
            expect(THREE.MeshLambertMaterial).toHaveBeenCalledTimes(1);
        });

        it('should create different materials for different colors', () => {
            const material1 = performanceOptimizer.getOrCreateBikeMaterial(0xff0000);
            const material2 = performanceOptimizer.getOrCreateBikeMaterial(0x00ff00);

            expect(material1).not.toBe(material2);
            expect(THREE.MeshLambertMaterial).toHaveBeenCalledTimes(2);
        });

        it('should handle material options', () => {
            const options = { transparent: true, opacity: 0.5, emissive: 0xff0000 };
            performanceOptimizer.getOrCreateBikeMaterial(0xff0000, options);

            expect(THREE.MeshLambertMaterial).toHaveBeenCalledWith({
                color: 0xff0000,
                transparent: true,
                opacity: 0.5,
                emissive: 0xff0000,
                emissiveIntensity: 0,
            });
        });
    });

    describe('getOrCreateTrailMaterial', () => {
        it('should create glowing trail material', () => {
            const material = performanceOptimizer.getOrCreateTrailMaterial(0xff0000, 'glowing');

            expect(THREE.MeshLambertMaterial).toHaveBeenCalledWith({
                color: 0xff0000,
                transparent: true,
                opacity: 0.9,
                emissive: 0xff0000,
                emissiveIntensity: 0.5,
            });
        });

        it('should create solid trail material', () => {
            const material = performanceOptimizer.getOrCreateTrailMaterial(0xff0000, 'solid');

            expect(THREE.MeshLambertMaterial).toHaveBeenCalledWith({
                color: 0xff0000,
                transparent: true,
                opacity: 0.8,
            });
        });

        it('should reuse trail materials with same parameters', () => {
            const material1 = performanceOptimizer.getOrCreateTrailMaterial(0xff0000, 'solid');
            const material2 = performanceOptimizer.getOrCreateTrailMaterial(0xff0000, 'solid');

            expect(material1).toBe(material2);
        });

        it('should create different materials for different styles', () => {
            const material1 = performanceOptimizer.getOrCreateTrailMaterial(0xff0000, 'solid');
            const material2 = performanceOptimizer.getOrCreateTrailMaterial(0xff0000, 'glowing');

            expect(material1).not.toBe(material2);
        });
    });

    describe('getOrCreateThemeMaterial', () => {
        it('should create grid theme material', () => {
            const config = { color: 0x00ffff, opacity: 0.3 };
            const material = performanceOptimizer.getOrCreateThemeMaterial(
                'classic-grid',
                'grid',
                config
            );

            expect(THREE.LineBasicMaterial).toHaveBeenCalledWith({
                color: 0x00ffff,
                opacity: 0.3,
                transparent: true,
            });
        });

        it('should create background theme material', () => {
            const config = { color: 0x000033 };
            const material = performanceOptimizer.getOrCreateThemeMaterial(
                'classic-grid',
                'background',
                config
            );

            expect(THREE.MeshBasicMaterial).toHaveBeenCalledWith({
                color: 0x000033,
                transparent: false,
                opacity: 1.0,
            });
        });

        it('should reuse theme materials', () => {
            const config = { color: 0x00ffff, opacity: 0.3 };
            const material1 = performanceOptimizer.getOrCreateThemeMaterial(
                'classic-grid',
                'grid',
                config
            );
            const material2 = performanceOptimizer.getOrCreateThemeMaterial(
                'classic-grid',
                'grid',
                config
            );

            expect(material1).toBe(material2);
        });
    });

    describe('getSharedGeometry', () => {
        it('should return bike geometry', () => {
            const geometry = performanceOptimizer.getSharedGeometry('bike');
            expect(geometry).toBe(performanceOptimizer.geometryPools.bike);
        });

        it('should return trail segment geometry', () => {
            const geometry = performanceOptimizer.getSharedGeometry('trailSegment');
            expect(geometry).toBe(performanceOptimizer.geometryPools.trailSegment);
        });

        it('should return power-up geometry', () => {
            const geometry = performanceOptimizer.getSharedGeometry('speed');
            expect(geometry).toBe(performanceOptimizer.geometryPools.powerUp.get('speed'));
        });

        it('should return fallback geometry for unknown type', () => {
            const geometry = performanceOptimizer.getSharedGeometry('unknown');
            expect(geometry).toBe(performanceOptimizer.geometryPools.bike);
        });
    });

    describe('getOrCreateTexture', () => {
        it('should create new texture using create function', () => {
            const mockTexture = { dispose: jest.fn() };
            const createFn = jest.fn().mockReturnValue(mockTexture);

            const texture = performanceOptimizer.getOrCreateTexture(
                'gradients',
                'test-key',
                createFn
            );

            expect(createFn).toHaveBeenCalled();
            expect(texture).toBe(mockTexture);
        });

        it('should reuse existing texture', () => {
            const mockTexture = { dispose: jest.fn() };
            const createFn = jest.fn().mockReturnValue(mockTexture);

            const texture1 = performanceOptimizer.getOrCreateTexture(
                'gradients',
                'test-key',
                createFn
            );
            const texture2 = performanceOptimizer.getOrCreateTexture(
                'gradients',
                'test-key',
                createFn
            );

            expect(texture1).toBe(texture2);
            expect(createFn).toHaveBeenCalledTimes(1);
        });

        it('should return null for unknown texture pool type', () => {
            const createFn = jest.fn();
            const texture = performanceOptimizer.getOrCreateTexture(
                'unknown',
                'test-key',
                createFn
            );

            expect(texture).toBeNull();
            expect(createFn).not.toHaveBeenCalled();
        });
    });

    describe('applyTrailLOD', () => {
        it('should apply LOD to trail segments', () => {
            const mockCameraPosition = new THREE.Vector3();
            const mockTrailObject = {
                userData: { materialId: 'trail_player_1' },
                position: new THREE.Vector3(),
                visible: true,
                material: { opacity: 0.8 },
            };

            mockScene.traverse.mockImplementation((callback) => {
                callback(mockTrailObject);
            });

            performanceOptimizer.applyTrailLOD(mockCameraPosition);

            expect(mockScene.traverse).toHaveBeenCalled();
            expect(mockTrailObject.visible).toBe(true);
        });

        it('should cull distant trail segments', () => {
            const mockCameraPosition = { distanceTo: jest.fn().mockReturnValue(10) };
            const mockTrailObject = {
                userData: { materialId: 'trail_player_1' },
                position: mockCameraPosition,
                visible: true,
                material: { opacity: 0.8 },
            };

            // Mock the distance calculation to return a large distance
            mockCameraPosition.distanceTo.mockReturnValue(200); // Beyond cull distance (150)

            mockScene.traverse.mockImplementation((callback) => {
                callback(mockTrailObject);
            });

            performanceOptimizer.applyTrailLOD(mockCameraPosition);

            expect(mockTrailObject.visible).toBe(false);
        });
    });

    describe('batch updates', () => {
        it('should schedule material updates', () => {
            const mockMaterial = { needsUpdate: false };

            performanceOptimizer.scheduleMaterialUpdate(mockMaterial);

            expect(performanceOptimizer.batchUpdates.materials.has(mockMaterial)).toBe(true);
            expect(performanceOptimizer.batchUpdates.scheduled).toBe(true);
        });

        it('should execute batch updates', () => {
            const mockMaterial = { needsUpdate: false };
            performanceOptimizer.batchUpdates.materials.add(mockMaterial);

            performanceOptimizer.executeBatchUpdates();

            expect(mockMaterial.needsUpdate).toBe(true);
            expect(performanceOptimizer.batchUpdates.materials.size).toBe(0);
        });
    });

    describe('performance metrics', () => {
        it('should update performance metrics', () => {
            performanceOptimizer.updatePerformanceMetrics();

            expect(performanceOptimizer.performanceMetrics.drawCalls).toBe(10);
            expect(performanceOptimizer.performanceMetrics.geometryCount).toBe(5);
            expect(performanceOptimizer.performanceMetrics.textureCount).toBe(3);
        });

        it('should return performance metrics', () => {
            const metrics = performanceOptimizer.getPerformanceMetrics();

            expect(metrics).toHaveProperty('frameTime');
            expect(metrics).toHaveProperty('drawCalls');
            expect(metrics).toHaveProperty('materialCount');
            expect(metrics).toHaveProperty('geometryCount');
            expect(metrics).toHaveProperty('textureCount');
        });

        it('should check if performance is acceptable', () => {
            performanceOptimizer.performanceMetrics.frameTime = 15; // Good performance
            expect(performanceOptimizer.isPerformanceAcceptable()).toBe(true);

            performanceOptimizer.performanceMetrics.frameTime = 25; // Poor performance
            expect(performanceOptimizer.isPerformanceAcceptable()).toBe(false);
        });
    });

    describe('cleanup', () => {
        it('should dispose of all materials and textures', () => {
            const mockMaterial = { dispose: jest.fn() };
            const mockTexture = { dispose: jest.fn() };
            const mockGeometry = { dispose: jest.fn() };

            performanceOptimizer.materialPools.bike.set('test', mockMaterial);
            performanceOptimizer.texturePools.gradients.set('test', mockTexture);

            performanceOptimizer.cleanup();

            expect(mockMaterial.dispose).toHaveBeenCalled();
            expect(mockTexture.dispose).toHaveBeenCalled();
            expect(performanceOptimizer.materialPools.bike.size).toBe(0);
            expect(performanceOptimizer.texturePools.gradients.size).toBe(0);
        });

        it('should reset performance metrics', () => {
            performanceOptimizer.performanceMetrics.materialCount = 10;
            performanceOptimizer.performanceMetrics.textureCount = 5;

            performanceOptimizer.cleanup();

            expect(performanceOptimizer.performanceMetrics.materialCount).toBe(0);
            expect(performanceOptimizer.performanceMetrics.textureCount).toBe(0);
        });
    });

    describe('disposeMaterial', () => {
        it('should dispose specific material from pool', () => {
            const mockMaterial = { dispose: jest.fn() };
            performanceOptimizer.materialPools.bike.set('test-key', mockMaterial);
            performanceOptimizer.performanceMetrics.materialCount = 1;

            performanceOptimizer.disposeMaterial('bike', 'test-key');

            expect(mockMaterial.dispose).toHaveBeenCalled();
            expect(performanceOptimizer.materialPools.bike.has('test-key')).toBe(false);
            expect(performanceOptimizer.performanceMetrics.materialCount).toBe(0);
        });

        it('should handle non-existent material gracefully', () => {
            expect(() => {
                performanceOptimizer.disposeMaterial('bike', 'non-existent');
            }).not.toThrow();
        });
    });
});
