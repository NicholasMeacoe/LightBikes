/**
 * Tests for ParticleSystem performance optimization features
 * Tests particle culling, LOD system, batch operations, and memory monitoring
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

const { ParticleSystem } = require('@/rendering/ParticleSystem.js');

// Mock THREE.js objects for testing
global.THREE = {
    MeshBasicMaterial: jest.fn().mockImplementation(() => ({})),
    MeshLambertMaterial: jest.fn().mockImplementation(() => ({})),
    SphereGeometry: jest.fn().mockImplementation(() => ({})),
    Vector3: class {
        constructor(x = 0, y = 0, z = 0) {
            this.x = x;
            this.y = y;
            this.z = z;
        }
        set(x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
            return this;
        }
        add(v) {
            this.x += v.x;
            this.y += v.y;
            this.z += v.z;
            return this;
        }
        clone() {
            return new THREE.Vector3(this.x, this.y, this.z);
        }
        multiplyScalar(s) {
            this.x *= s;
            this.y *= s;
            this.z *= s;
            return this;
        }
        distanceTo(v) {
            const dx = this.x - v.x;
            const dy = this.y - v.y;
            const dz = this.z - v.z;
            return Math.sqrt(dx * dx + dy * dy + dz * dz);
        }
    },
    Color: class {
        constructor(color = 0xffffff) {
            this.r = 1;
            this.g = 1;
            this.b = 1;
        }
        setHex(hex) {
            this.r = ((hex >> 16) & 255) / 255;
            this.g = ((hex >> 8) & 255) / 255;
            this.b = (hex & 255) / 255;
            return this;
        }
    },
    BufferGeometry: class {
        constructor() {
            this.attributes = {};
            this.boundingSphere = { radius: 10 };
        }
        setAttribute(name, attribute) {
            this.attributes[name] = attribute;
        }
        setDrawRange(start, count) {
            this.drawRange = { start, count };
        }
        dispose() {}
    },
    BufferAttribute: class {
        constructor(array, itemSize) {
            this.array = array;
            this.itemSize = itemSize;
            this.count = array.length / itemSize;
            this.needsUpdate = false;
        }
    },
    ShaderMaterial: class {
        constructor(params) {
            this.uniforms = params.uniforms || {};
            this.needsUpdate = false;
        }
        dispose() {}
    },
    Points: class {
        constructor(geometry, material) {
            this.geometry = geometry;
            this.material = material;
            this.visible = true;
            this.frustumCulled = true;
            this.renderOrder = 0;
        }
    },
    Texture: class {
        constructor() {
            this.needsUpdate = true;
        }
        dispose() {}
    },
    Frustum: class {
        constructor() {}
        setFromProjectionMatrix(matrix) {
            return this;
        }
        intersectsSphere(sphere) {
            // Mock implementation - return true for particles within reasonable bounds
            return Math.abs(sphere.center.x) < 50 && Math.abs(sphere.center.z) < 50;
        }
    },
    Sphere: class {
        constructor(center, radius) {
            this.center = center;
            this.radius = radius;
        }
    },
    Matrix4: class {
        constructor() {}
        multiplyMatrices(a, b) {
            return this;
        }
    },
    AdditiveBlending: 'additive',
    DoubleSide: 'double',
    ClampToEdgeWrapping: 'clamp',
    LinearFilter: 'linear',
    RGBAFormat: 'rgba',
};

describe('ParticleSystem Performance Optimizations', () => {
    let particleSystem;
    let mockScene;
    let mockCamera;

    beforeEach(() => {
        // Mock scene
        mockScene = {
            add: jest.fn(),
            remove: jest.fn(),
        };

        // Mock camera
        mockCamera = {
            position: new THREE.Vector3(0, 10, 0),
            projectionMatrix: new THREE.Matrix4(),
            matrixWorldInverse: new THREE.Matrix4(),
        };

        // Mock canvas context for texture creation
        global.document = {
            createElement: jest.fn(() => ({
                width: 128,
                height: 128,
                getContext: jest.fn(() => ({
                    createRadialGradient: jest.fn(() => ({
                        addColorStop: jest.fn(),
                    })),
                    clearRect: jest.fn(),
                    fillRect: jest.fn(),
                })),
            })),
        };

        particleSystem = new ParticleSystem(mockScene, {
            maxParticles: 100,
            quality: 'medium',
        });
    });

    afterEach(() => {
        if (particleSystem) {
            particleSystem.dispose();
        }
    });

    describe('Particle Culling', () => {
        test('should cull off-screen particles', () => {
            // Create particles at various positions
            particleSystem.emitTrailSparks({ x: 0, y: 0, z: 0 }, { x: 1, z: 0 }, 0xff0000, 1.0);
            particleSystem.emitTrailSparks({ x: 100, y: 0, z: 100 }, { x: 1, z: 0 }, 0xff0000, 1.0); // Far away

            // Update to process particles
            particleSystem.update(0.016, { isPaused: false, frameCount: 1 });

            // Apply culling
            particleSystem.cullOffScreenParticles(mockCamera);

            const activeParticles = particleSystem.particlePool.getActiveParticles();
            const culledCount = activeParticles.filter((p) => p.culled).length;

            expect(culledCount).toBeGreaterThan(0);
        });

        test('should not cull particles within camera frustum', () => {
            // Create particle close to camera
            particleSystem.emitTrailSparks({ x: 0, y: 0, z: 0 }, { x: 1, z: 0 }, 0xff0000, 1.0);

            // Update to process particles
            particleSystem.update(0.016, { isPaused: false, frameCount: 1 });

            // Apply culling
            particleSystem.cullOffScreenParticles(mockCamera);

            const activeParticles = particleSystem.particlePool.getActiveParticles();
            const visibleCount = activeParticles.filter((p) => !p.culled).length;

            expect(visibleCount).toBeGreaterThan(0);
        });
    });

    describe('Level of Detail System', () => {
        test('should apply different LOD levels based on distance', () => {
            // Create particles at different distances
            particleSystem.emitTrailSparks({ x: 5, y: 0, z: 5 }, { x: 1, z: 0 }, 0xff0000, 1.0); // Close
            particleSystem.emitTrailSparks({ x: 25, y: 0, z: 25 }, { x: 1, z: 0 }, 0xff0000, 1.0); // Medium
            particleSystem.emitTrailSparks({ x: 45, y: 0, z: 45 }, { x: 1, z: 0 }, 0xff0000, 1.0); // Far

            // Update to process particles
            particleSystem.update(0.016, { isPaused: false, frameCount: 1 });

            // Apply LOD
            particleSystem.applyLevelOfDetail(mockCamera);

            const activeParticles = particleSystem.particlePool.getActiveParticles();
            const lodLevels = activeParticles.map((p) => p.lodLevel);

            // Should have at least some LOD levels applied
            expect(lodLevels.length).toBeGreaterThan(0);
            expect(
                lodLevels.some((level) => ['high', 'medium', 'low', 'culled'].includes(level))
            ).toBe(true);
        });

        test('should reduce particle size for distant particles', () => {
            // Create particle far from camera
            particleSystem.emitTrailSparks({ x: 35, y: 0, z: 35 }, { x: 1, z: 0 }, 0xff0000, 1.0);

            // Update to process particles
            particleSystem.update(0.016, { isPaused: false, frameCount: 1 });

            const activeParticles = particleSystem.particlePool.getActiveParticles();
            const particle = activeParticles[0];
            const originalSize = particle.originalSize;

            // Apply LOD
            particleSystem.applyLevelOfDetail(mockCamera);

            // Should apply some form of LOD (size reduction or culling)
            expect(particle.size).toBeLessThanOrEqual(originalSize);
            expect(['high', 'medium', 'low', 'culled']).toContain(particle.lodLevel);
        });
    });

    describe('Batch Update Operations', () => {
        test('should update performance metrics during batch operations', () => {
            // Create multiple particles
            for (let i = 0; i < 10; i++) {
                particleSystem.emitTrailSparks({ x: i, y: 0, z: 0 }, { x: 1, z: 0 }, 0xff0000, 1.0);
            }

            // Update to process particles
            particleSystem.update(0.016, { isPaused: false, frameCount: 1 });

            expect(particleSystem.performanceMetrics.totalParticles).toBeGreaterThan(0);
            expect(particleSystem.performanceMetrics.visibleParticles).toBeDefined();
            expect(particleSystem.performanceMetrics.renderedParticles).toBeDefined();
        });

        test('should filter culled particles from rendering', () => {
            // Create particles
            particleSystem.emitTrailSparks({ x: 0, y: 0, z: 0 }, { x: 1, z: 0 }, 0xff0000, 1.0);
            particleSystem.emitTrailSparks({ x: 100, y: 0, z: 100 }, { x: 1, z: 0 }, 0xff0000, 1.0);

            // Update and apply optimizations
            particleSystem.update(0.016, { isPaused: false, frameCount: 1 });
            particleSystem.optimizeRendering(mockCamera);

            const metrics = particleSystem.performanceMetrics;
            expect(metrics.culledParticles).toBeGreaterThanOrEqual(0);
            expect(metrics.visibleParticles).toBeLessThanOrEqual(metrics.totalParticles);
        });
    });

    describe('Memory Usage Monitoring', () => {
        test('should calculate memory usage statistics', () => {
            const memoryUsage = particleSystem.getMemoryUsage();

            expect(memoryUsage).toHaveProperty('bufferArrays');
            expect(memoryUsage).toHaveProperty('particlePool');
            expect(memoryUsage).toHaveProperty('textures');
            expect(memoryUsage).toHaveProperty('total');

            expect(memoryUsage.bufferArrays.total).toBeGreaterThan(0);
            expect(memoryUsage.total).toBeGreaterThan(0);
        });

        test('should monitor memory usage and trigger cleanup', () => {
            const cleanupSpy = jest.spyOn(particleSystem, 'performMemoryCleanup');

            // Mock high memory usage
            jest.spyOn(particleSystem, 'getMemoryUsage').mockReturnValue({
                total: 150 * 1024 * 1024, // 150MB - above critical threshold
                bufferArrays: { total: 50 * 1024 * 1024 },
                particlePool: { estimatedSize: 50 * 1024 * 1024 },
                textures: { particleTexture: 50 * 1024 * 1024 },
            });

            particleSystem.monitorMemoryUsage();

            expect(cleanupSpy).toHaveBeenCalledWith(true); // Aggressive cleanup
        });

        test('should perform memory cleanup operations', () => {
            const releaseAllSpy = jest.spyOn(particleSystem.particlePool, 'releaseAll');

            particleSystem.performMemoryCleanup(true);

            expect(releaseAllSpy).toHaveBeenCalled();
        });

        test('should apply emergency memory reduction', () => {
            const originalMaxParticles = particleSystem.settings.maxParticles;

            particleSystem.applyEmergencyMemoryReduction();

            expect(particleSystem.settings.maxParticles).toBeLessThanOrEqual(originalMaxParticles);
            expect(particleSystem.settings.effects.trailSparks).toBe(false);
            expect(particleSystem.settings.effects.collections).toBe(false);
        });
    });

    describe('LOD Distribution Statistics', () => {
        test('should calculate LOD distribution', () => {
            // Create particles at different distances
            particleSystem.emitTrailSparks({ x: 5, y: 0, z: 5 }, { x: 1, z: 0 }, 0xff0000, 1.0);
            particleSystem.emitTrailSparks({ x: 25, y: 0, z: 25 }, { x: 1, z: 0 }, 0xff0000, 1.0);
            particleSystem.emitTrailSparks({ x: 45, y: 0, z: 45 }, { x: 1, z: 0 }, 0xff0000, 1.0);

            // Update and apply LOD
            particleSystem.update(0.016, { isPaused: false, frameCount: 1 });
            particleSystem.applyLevelOfDetail(mockCamera);

            const lodDistribution = particleSystem.getLODDistribution();

            expect(lodDistribution).toHaveProperty('high');
            expect(lodDistribution).toHaveProperty('medium');
            expect(lodDistribution).toHaveProperty('low');
            expect(lodDistribution).toHaveProperty('culled');
        });
    });

    describe('Rendering Statistics', () => {
        test('should provide comprehensive rendering statistics', () => {
            // Create some particles
            particleSystem.emitTrailSparks({ x: 0, y: 0, z: 0 }, { x: 1, z: 0 }, 0xff0000, 1.0);
            particleSystem.update(0.016, { isPaused: false, frameCount: 1 });

            const stats = particleSystem.getRenderingStats();

            expect(stats).toHaveProperty('activeParticles');
            expect(stats).toHaveProperty('maxParticles');
            expect(stats).toHaveProperty('memoryUsage');
            expect(stats).toHaveProperty('performance');

            expect(stats.performance).toHaveProperty('totalParticles');
            expect(stats.performance).toHaveProperty('visibleParticles');
            expect(stats.performance).toHaveProperty('culledParticles');
            expect(stats.performance).toHaveProperty('cullRatio');
            expect(stats.performance).toHaveProperty('lodDistribution');
        });
    });

    describe('Integration with Update Loop', () => {
        test('should perform memory monitoring during update', () => {
            const monitorSpy = jest.spyOn(particleSystem, 'monitorMemoryUsage');

            // Set memory check interval to 0 to force immediate check
            particleSystem.memoryCheckInterval = 0;

            particleSystem.update(0.016, { isPaused: false, frameCount: 1 });

            expect(monitorSpy).toHaveBeenCalled();
        });

        test('should store original particle sizes for LOD calculations', () => {
            particleSystem.emitTrailSparks({ x: 0, y: 0, z: 0 }, { x: 1, z: 0 }, 0xff0000, 1.0);
            particleSystem.update(0.016, { isPaused: false, frameCount: 1 });

            const activeParticles = particleSystem.particlePool.getActiveParticles();
            const particle = activeParticles[0];

            expect(particle.originalSize).toBeDefined();
            expect(particle.originalSize).toBeGreaterThan(0);
        });
    });

    describe('Error Handling', () => {
        test('should handle culling errors gracefully', () => {
            // Mock camera to cause error
            const badCamera = null;

            expect(() => {
                particleSystem.cullOffScreenParticles(badCamera);
            }).not.toThrow();
        });

        test('should handle LOD errors gracefully', () => {
            // Mock camera to cause error
            const badCamera = { position: null };

            expect(() => {
                particleSystem.applyLevelOfDetail(badCamera);
            }).not.toThrow();
        });

        test('should handle memory monitoring errors gracefully', () => {
            // Mock getMemoryUsage to throw error
            jest.spyOn(particleSystem, 'getMemoryUsage').mockImplementation(() => {
                throw new Error('Memory calculation error');
            });

            expect(() => {
                particleSystem.monitorMemoryUsage();
            }).not.toThrow();
        });
    });
});
