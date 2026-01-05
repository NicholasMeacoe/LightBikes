// Use global THREE mock pattern with enhanced ShaderMaterial mock and additional THREE classes
describe('ParticleSystem Coverage', () => {
    let ParticleSystem;
    let ParticlePool;
    let particleSystem;
    let mockScene;
    let mockPerformanceMonitor;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();

        // Mock Utils
        jest.mock('../../src/utils/Logger.js', () => ({
            logger: {
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
            },
        }));

        jest.mock('../../src/utils/PerformanceMonitor.js', () => ({
            PerformanceMonitor: jest.fn().mockImplementation(() => ({
                update: jest.fn(),
                getPerformanceMetrics: jest.fn().mockReturnValue({
                    currentFPS: 60,
                    averageFPS: 60,
                    performanceWarnings: [],
                }),
                frameRateThreshold: 50,
                frameRateTarget: 60,
                reset: jest.fn(),
            })),
        }));

        // Mock THREE globally
        const createThreeMock = () => {
            class MockBufferAttribute {
                constructor(array, itemSize) {
                    this.array = array;
                    this.itemSize = itemSize;
                    this.needsUpdate = false;
                    this.count = array ? array.length / itemSize : 0;
                }
            }

            class MockBufferGeometry {
                constructor() {
                    this.attributes = {};
                    this.setAttribute = jest.fn((name, attr) => {
                        this.attributes[name] = attr;
                    });
                    this.setDrawRange = jest.fn();
                    this.dispose = jest.fn();
                    this.boundingSphere = { radius: 0 };
                }
            }

            class MockVector3 {
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
                clone() {
                    return new MockVector3(this.x, this.y, this.z);
                }
                add(v) {
                    this.x += v.x;
                    this.y += v.y;
                    this.z += v.z;
                    return this;
                }
                multiplyScalar(s) {
                    this.x *= s;
                    this.y *= s;
                    this.z *= s;
                    return this;
                }
                copy(v) {
                    this.x = v.x;
                    this.y = v.y;
                    this.z = v.z;
                    return this;
                }
                distanceTo(v) {
                    return Math.sqrt(
                        Math.pow(this.x - v.x, 2) +
                            Math.pow(this.y - v.y, 2) +
                            Math.pow(this.z - v.z, 2)
                    );
                }
            }

            class MockVector2 {
                constructor(x = 0, y = 0) {
                    this.x = x;
                    this.y = y;
                }
            }

            class MockColor {
                constructor(hex) {
                    this.r = 0;
                    this.g = 0;
                    this.b = 0;
                    if (hex) this.setHex(hex);
                }
                setHex(hex) {
                    return this;
                }
                copy(c) {
                    return this;
                }
            }

            class MockFrustum {
                constructor() {}
                setFromProjectionMatrix() {}
                intersectsSphere() {
                    return true;
                } // Default to visible
            }

            class MockMatrix4 {
                constructor() {}
                multiplyMatrices() {
                    return this;
                }
            }

            class MockSphere {
                constructor(center, radius) {
                    this.center = center;
                    this.radius = radius;
                }
            }

            return {
                BufferGeometry: MockBufferGeometry,
                BufferAttribute: MockBufferAttribute,
                Float32BufferAttribute: MockBufferAttribute,
                Vector3: MockVector3,
                Vector2: MockVector2,
                Color: MockColor,
                Frustum: MockFrustum,
                Matrix4: MockMatrix4,
                Sphere: MockSphere,
                ShaderMaterial: jest.fn().mockImplementation((params) => {
                    // Use params if provided, otherwise default
                    const uniforms =
                        params && params.uniforms
                            ? params.uniforms
                            : {
                                  time: { value: 0 },
                                  pointTexture: {
                                      value: { needsUpdate: false, dispose: jest.fn() },
                                  },
                              };
                    return {
                        uniforms: uniforms,
                        dispose: jest.fn(),
                        needsUpdate: false,
                    };
                }),
                Points: jest.fn().mockImplementation(() => ({
                    renderOrder: 0,
                    frustumCulled: true,
                    visible: true,
                })),
                Texture: jest.fn().mockImplementation(() => ({
                    needsUpdate: false,
                    dispose: jest.fn(),
                })),
                ClampToEdgeWrapping: 1001,
                LinearFilter: 1006,
                RGBAFormat: 1023,
                AdditiveBlending: 2,
                DoubleSide: 2,
            };
        };

        const threeMock = createThreeMock();
        global.THREE = threeMock;
        jest.mock('three', () => threeMock);

        // Require modules after mocking
        ParticleSystem = require('../../src/rendering/ParticleSystem.js').ParticleSystem;
        ParticlePool = require('../../src/rendering/ParticlePool.js').ParticlePool;

        mockScene = {
            add: jest.fn(),
            remove: jest.fn(),
        };

        // Mock document for texture creation
        document.createElement = jest.fn().mockReturnValue({
            width: 128,
            height: 128,
            getContext: jest.fn().mockReturnValue({
                createRadialGradient: jest.fn().mockReturnValue({
                    addColorStop: jest.fn(),
                }),
                clearRect: jest.fn(),
                fillRect: jest.fn(),
            }),
        });

        particleSystem = new ParticleSystem(mockScene, {
            maxParticles: 50,
            enabled: true,
            quality: 'high',
            adaptiveQuality: true,
        });

        mockPerformanceMonitor = particleSystem.performanceMonitor;
    });

    afterEach(() => {
        delete global.THREE;
    });

    describe('Initialization', () => {
        it('should initialize successfully', () => {
            expect(particleSystem.scene).toBe(mockScene);
            expect(particleSystem.particlePool).toBeDefined();
        });

        it('should handle scene missing', () => {
            expect(() => new ParticleSystem(null)).toThrow('Scene is required');
        });

        it('should handle texture creation failure gracefully', () => {
            document.createElement.mockImplementationOnce(() => {
                throw new Error('Canvas fail');
            });
            const ps = new ParticleSystem(mockScene);
            expect(ps.particleMaterial.uniforms.pointTexture.value.needsUpdate).toBe(true);
        });
    });

    describe('Particle Emission', () => {
        it('should emit trail sparks', () => {
            const pos = { x: 0, y: 0, z: 0 };
            const vel = { x: 1, y: 0, z: 0 };
            particleSystem.emitTrailSparks(pos, vel, 0xff0000);
            expect(particleSystem.particlePool.activeCount).toBeGreaterThan(0);
        });

        it('should create explosion', () => {
            particleSystem.createExplosion({ x: 0, y: 0, z: 0 });
            expect(particleSystem.particlePool.activeCount).toBeGreaterThan(10);
        });
    });

    describe('Collection Effects', () => {
        it('should create collection effect for SPEED_BOOST', () => {
            particleSystem.createCollectionEffect({ x: 0, y: 0, z: 0 }, 'SPEED_BOOST');
            expect(particleSystem.particlePool.activeCount).toBeGreaterThan(0);
            const p = particleSystem.particlePool.activeParticles[0];
            expect(p.type).toBe('collection');
        });

        it('should create collection effect for SHIELD', () => {
            particleSystem.createCollectionEffect({ x: 0, y: 0, z: 0 }, 'SHIELD');
            expect(particleSystem.particlePool.activeCount).toBeGreaterThan(0);
        });

        it('should NOT create effect if disabled', () => {
            particleSystem.settings.effects.collections = false;
            particleSystem.createCollectionEffect({ x: 0, y: 0, z: 0 }, 'SPEED_BOOST');
            expect(particleSystem.particlePool.activeCount).toBe(0);
        });
    });

    describe('Adaptive Quality', () => {
        it('should apply degradation when FPS is low', () => {
            mockPerformanceMonitor.getPerformanceMetrics.mockReturnValue({
                averageFPS: 30,
                currentFPS: 30,
                performanceWarnings: [],
            });
            particleSystem.lastDegradationCheck = 0;
            particleSystem.checkPerformanceDegradation(2000);
            expect(particleSystem.degradationLevel).toBe(1);
        });

        it('should escalate degradation levels', () => {
            mockPerformanceMonitor.getPerformanceMetrics.mockReturnValue({ averageFPS: 30 });
            particleSystem.lastDegradationCheck = 0;
            particleSystem.checkPerformanceDegradation(2000); // Lvl 1
            particleSystem.lastDegradationCheck = 0;
            particleSystem.checkPerformanceDegradation(4000); // Lvl 2
            particleSystem.lastDegradationCheck = 0;
            particleSystem.checkPerformanceDegradation(6000); // Lvl 3
            expect(particleSystem.degradationLevel).toBe(3);
        });

        it('should recover from degradation when FPS improves', () => {
            particleSystem.degradationLevel = 1;
            mockPerformanceMonitor.getPerformanceMetrics.mockReturnValue({
                averageFPS: 58,
                frameRateTarget: 60,
            });
            particleSystem.lastDegradationCheck = 0;
            particleSystem.lastGoodPerformanceTime = 0;
            particleSystem.checkPerformanceDegradation(6000); // > 5000 recovery
            expect(particleSystem.degradationLevel).toBe(0);
        });

        it('should handle performance monitoring errors', () => {
            mockPerformanceMonitor.getPerformanceMetrics.mockImplementationOnce(() => {
                throw new Error('Metrics fail');
            });
            particleSystem.handlePerformanceMonitoringError(new Error('Test error'));
            expect(particleSystem.adaptiveQualityEnabled).toBe(false);
        });
    });

    describe('Memory Management', () => {
        it('should calculate memory usage', () => {
            const usage = particleSystem.getMemoryUsage();
            expect(usage.total).toBeGreaterThan(0);
            expect(usage.bufferArrays.total).toBeGreaterThan(0);
        });

        it('should perform aggressive cleanup on critical memory usage', () => {
            const cleanupSpy = jest.spyOn(particleSystem, 'performMemoryCleanup');
            const reductionSpy = jest.spyOn(particleSystem, 'applyEmergencyMemoryReduction');

            particleSystem.getMemoryUsage = jest.fn().mockReturnValue({
                total: 101 * 1024 * 1024,
            });

            particleSystem.monitorMemoryUsage();

            expect(cleanupSpy).toHaveBeenCalledWith(true);
            expect(reductionSpy).toHaveBeenCalled();
        });
    });

    describe('Optimization and Culling', () => {
        it('should optimize rendering and cull off-screen particles', () => {
            particleSystem.createExplosion({ x: 0, y: 0, z: 0 });
            const camera = {
                position: new global.THREE.Vector3(0, 0, 100),
                projectionMatrix: new global.THREE.Matrix4(),
                matrixWorldInverse: new global.THREE.Matrix4(),
            };

            // Mock Frustum to cull
            global.THREE.Frustum.prototype.intersectsSphere = jest.fn().mockReturnValue(false);

            particleSystem.optimizeRendering(camera);

            const p = particleSystem.particlePool.activeParticles[0];
            expect(p.culled).toBe(true);
        });

        it('should apply LOD based on distance', () => {
            particleSystem.createExplosion({ x: 0, y: 0, z: 0 });
            const camera = {
                position: new global.THREE.Vector3(0, 0, 40), // > 30 = low detail
            };

            particleSystem.applyLevelOfDetail(camera);

            const p = particleSystem.particlePool.activeParticles[0];
            expect(p.lodLevel).toBe('low');
        });
    });

    describe('Rendering Logic', () => {
        it('should batch update buffers with valid particles', () => {
            // Setup valid particle
            particleSystem.createExplosion({ x: 0, y: 0, z: 0 });
            const p = particleSystem.particlePool.activeParticles[0];
            p.getAlpha = jest.fn().mockReturnValue(0.5);

            particleSystem.updateRenderingBuffers();

            // Check if mock attributes were updated
            const attrs = particleSystem.particleGeometry.attributes;
            expect(attrs.position.needsUpdate).toBe(true);
            expect(p.getAlpha).toHaveBeenCalled();
        });

        it('should handle buffer array missing error', () => {
            particleSystem.particleGeometry.attributes = null;
            particleSystem.updateRenderingBuffers(); // Should log warn but not crash
        });

        it('should handle invalid particles in batch update', () => {
            // Add a broken particle
            particleSystem.createExplosion({ x: 0, y: 0, z: 0 });
            const p = particleSystem.particlePool.activeParticles[0];
            p.position = { x: 'nan' }; // Invalid

            particleSystem.updateRenderingBuffers();
        });

        it('should release particle', () => {
            particleSystem.createExplosion({ x: 0, y: 0, z: 0 });
            const p = particleSystem.particlePool.activeParticles[0];
            particleSystem.releaseParticle(p);
            expect(p.active).toBe(false);
        });
    });

    describe('Error Handling', () => {
        it('should handle particle pool update errors', () => {
            particleSystem.particlePool.updateParticles = jest.fn().mockImplementation(() => {
                throw new Error('Pool update error');
            });

            particleSystem.update(0.16, { isPaused: false });
            expect(particleSystem.particlePool.updateParticles).toHaveBeenCalled();
        });

        it('should handle rendering buffer errors', () => {
            particleSystem.updateRenderingBuffers = jest.fn().mockImplementation(() => {
                throw new Error('Buffer error');
            });

            particleSystem.update(0.16, { isPaused: false });
            expect(particleSystem.updateRenderingBuffers).toHaveBeenCalled();
        });

        it('should handle shader errors', () => {
            // Force error in shader update part of update()
            particleSystem.particleMaterial = { uniforms: null }; // Will cause crash if accessed
            Object.defineProperty(particleSystem, 'particleMaterial', {
                get: () => {
                    throw new Error('Shader access error');
                },
            });

            particleSystem.update(0.16, { isPaused: false });
            expect(particleSystem.shaderUpdatesEnabled).toBe(false);
        });
    });

    describe('System Health and Validation', () => {
        it('should report system health', () => {
            const health = particleSystem.getSystemHealth();
            expect(health.enabled).toBe(true);
            expect(health.activeParticles).toBeDefined();
        });

        it('should handle critical errors and reset', () => {
            particleSystem.handleCriticalError(new Error('Crit 1'), 'test');
            particleSystem.handleCriticalError(new Error('Crit 2'), 'test');
            particleSystem.handleCriticalError(new Error('Crit 3'), 'test');
            expect(particleSystem.errorCount).toBe(0);
        });

        it('should apply graceful fallback for update errors', () => {
            particleSystem.handleCriticalError(new Error('Update error'), 'update');
            expect(particleSystem.autoUpdateEnabled).toBe(false);
        });

        it('should validate validation parameters', () => {
            expect(particleSystem.validateUpdateParameters(-1, {})).toBe(false);
            expect(particleSystem.validateUpdateParameters(0.16, null)).toBe(false);
            expect(particleSystem.validateUpdateParameters(0.16, {})).toBe(true);
        });
    });

    describe('ParticlePool Coverage', () => {
        let pool;
        beforeEach(() => {
            pool = new ParticlePool(50);
        });

        it('should validate integrity correctly', () => {
            expect(pool.validateIntegrity()).toBe(true);
        });

        it('should detect integrity issues', () => {
            // Manually break integrity
            pool.activeParticles.push(pool.inactiveParticles[0]); // Duplicate
            expect(pool.validateIntegrity()).toBe(false);
        });

        it('should handle empty pool acquire', () => {
            // Exhaust pool
            for (let i = 0; i < 50; i++) pool.acquire();
            expect(pool.acquire()).toBeNull();
        });

        it('should handle invalid release', () => {
            pool.release(null);
            pool.release({});
        });

        it('should batch release correctly', () => {
            const p1 = pool.acquire();
            const p2 = pool.acquire();
            pool.batchReleaseParticles([p1, p2]);
            expect(pool.activeCount).toBe(0);
        });

        it('should dispose correctly', () => {
            pool.dispose();
            expect(pool.particles.length).toBe(0);
        });

        it('should batch update > 32 particles to test loop', () => {
            // Acquire 40 particles
            for (let i = 0; i < 40; i++) pool.acquire();
            expect(pool.activeCount).toBe(40);

            pool.updateParticles(0.16);
            expect(pool.activeCount).toBe(40); // No dead particles yet
        });
    });

    describe('Cleanup and Reset', () => {
        it('should reset system', () => {
            particleSystem.createExplosion({ x: 0, y: 0, z: 0 });
            particleSystem.reset();
            expect(particleSystem.particlePool.activeCount).toBe(0);
        });

        it('should dispose resources', () => {
            particleSystem.dispose();
            expect(particleSystem.particleGeometry).toBeNull();
            expect(mockScene.remove).toHaveBeenCalled();
        });

        it('should handle context restore', () => {
            particleSystem.onContextRestore();
            expect(particleSystem.particleMaterial.needsUpdate).toBe(true);
        });

        it('should pause and resume state tracking', () => {
            particleSystem.update(0.16, { isPaused: true });
            expect(particleSystem.isPaused).toBe(true);
            particleSystem.update(0.16, { isPaused: false });
            expect(particleSystem.isPaused).toBe(false);
        });
    });
});
