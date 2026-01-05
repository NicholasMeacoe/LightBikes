/**
 * Unit tests for ParticleSystem
 * Tests core functionality, particle pooling, and integration points
 */

// Mock Three.js for testing environment
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

const mockThree = {
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
            return new mockThree.Vector3(this.x, this.y, this.z);
        }
        multiplyScalar(s) {
            this.x *= s;
            this.y *= s;
            this.z *= s;
            return this;
        }
    },
    Color: class {
        constructor(r = 1, g = 1, b = 1) {
            this.r = r;
            this.g = g;
            this.b = b;
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
            this.needsUpdate = false;
        }
    },
    ShaderMaterial: class {
        constructor(params) {
            this.uniforms = params.uniforms || {};
            this.vertexShader = params.vertexShader || '';
            this.fragmentShader = params.fragmentShader || '';
            this.blending = params.blending;
            this.depthTest = params.depthTest;
            this.transparent = params.transparent;
            this.vertexColors = params.vertexColors;
        }
        dispose() {}
    },
    Points: class {
        constructor(geometry, material) {
            this.geometry = geometry;
            this.material = material;
        }
    },
    Texture: class {
        constructor(canvas) {
            this.needsUpdate = false;
        }
    },
    AdditiveBlending: 'additive',
};

// Mock global THREE
global.THREE = mockThree;

// Mock document for texture creation
global.document = {
    createElement: (tag) => {
        if (tag === 'canvas') {
            return {
                width: 0,
                height: 0,
                getContext: (type) => {
                    if (type === '2d') {
                        return {
                            createRadialGradient: (x0, y0, r0, x1, y1, r1) => ({
                                addColorStop: (offset, color) => {},
                            }),
                            fillRect: (x, y, width, height) => {},
                            fillStyle: null,
                            globalAlpha: 1,
                            fill: () => {},
                            beginPath: () => {},
                            arc: () => {},
                            closePath: () => {},
                        };
                    }
                    return null;
                },
            };
        }
        return {};
    },
};

const { ParticleSystem, Particle } = require('@/rendering/ParticleSystem.js');

describe('Particle', () => {
    let particle;

    beforeEach(() => {
        particle = new Particle();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(particle.position).toBeInstanceOf(mockThree.Vector3);
            expect(particle.velocity).toBeInstanceOf(mockThree.Vector3);
            expect(particle.acceleration).toBeInstanceOf(mockThree.Vector3);
            expect(particle.color).toBeInstanceOf(mockThree.Color);
            expect(particle.size).toBe(0.05);
            expect(particle.lifetime).toBe(1.0);
            expect(particle.age).toBe(0);
            expect(particle.active).toBe(false);
            expect(particle.type).toBe('trail');
        });
    });

    describe('reset', () => {
        it('should reset particle to initial state', () => {
            // Modify particle state
            particle.position.set(5, 5, 5);
            particle.velocity.set(1, 1, 1);
            particle.age = 0.5;
            particle.active = true;
            particle.type = 'explosion';

            // Reset particle
            particle.reset();

            // Verify reset state
            expect(particle.position.x).toBe(0);
            expect(particle.position.y).toBe(0);
            expect(particle.position.z).toBe(0);
            expect(particle.velocity.x).toBe(0);
            expect(particle.velocity.y).toBe(0);
            expect(particle.velocity.z).toBe(0);
            expect(particle.age).toBe(0);
            expect(particle.active).toBe(false);
            expect(particle.type).toBe('trail');
        });
    });

    describe('update', () => {
        it('should not update inactive particles', () => {
            particle.active = false;
            particle.position.set(0, 0, 0);
            particle.velocity.set(1, 1, 1);

            particle.update(0.1);

            expect(particle.position.x).toBe(0);
            expect(particle.position.y).toBe(0);
            expect(particle.position.z).toBe(0);
        });

        it('should update active particle physics', () => {
            particle.active = true;
            particle.position.set(0, 0, 0);
            particle.velocity.set(1, 0, 0);
            particle.acceleration.set(0, -1, 0);
            particle.lifetime = 2.0;

            particle.update(0.1);

            expect(particle.age).toBe(0.1);
            expect(particle.position.x).toBe(0.1);
            expect(particle.velocity.y).toBe(-0.1);
        });

        it('should deactivate particle when lifetime exceeded', () => {
            particle.active = true;
            particle.lifetime = 1.0;
            particle.age = 0.9;

            particle.update(0.2);

            expect(particle.active).toBe(false);
        });
    });

    describe('getAlpha', () => {
        it('should return 0 for inactive particles', () => {
            particle.active = false;
            expect(particle.getAlpha()).toBe(0);
        });

        it('should return 1 for new particles', () => {
            particle.active = true;
            particle.age = 0;
            particle.lifetime = 1.0;
            expect(particle.getAlpha()).toBe(1);
        });

        it('should return decreasing alpha as particle ages', () => {
            particle.active = true;
            particle.lifetime = 1.0;

            particle.age = 0.5;
            expect(particle.getAlpha()).toBe(0.5);

            particle.age = 0.8;
            expect(particle.getAlpha()).toBeCloseTo(0.2, 5);
        });
    });
});

describe('ParticleSystem', () => {
    let particleSystem;
    let mockScene;

    beforeEach(() => {
        mockScene = {
            add: jest.fn(),
            remove: jest.fn(),
        };
        particleSystem = new ParticleSystem(mockScene, {
            maxParticles: 50,
            enabled: true,
        });
    });

    afterEach(() => {
        if (particleSystem) {
            particleSystem.dispose();
        }
    });

    describe('constructor', () => {
        it('should initialize with default settings', () => {
            const defaultSystem = new ParticleSystem(mockScene);
            const settings = defaultSystem.getSettings();

            expect(settings.maxParticles).toBe(200);
            expect(settings.enabled).toBe(true);
            expect(settings.quality).toBe('medium');
            expect(settings.effects.trailSparks).toBe(true);
            expect(settings.effects.explosions).toBe(true);
            expect(settings.effects.collections).toBe(true);

            defaultSystem.dispose();
        });

        it('should initialize particle pool', () => {
            expect(particleSystem.particlePool).toBeDefined();
            expect(particleSystem.getActiveParticleCount()).toBe(0);
            expect(particleSystem.particlePool.maxParticles).toBe(50);
        });

        it('should initialize performance monitoring', () => {
            expect(particleSystem.performanceMonitor).toBeDefined();
            expect(particleSystem.adaptiveQualityEnabled).toBe(true);
            expect(particleSystem.degradationLevel).toBe(0);
            expect(particleSystem.qualityConfigs).toBeDefined();
            expect(particleSystem.qualityConfigs.high).toBeDefined();
            expect(particleSystem.qualityConfigs.medium).toBeDefined();
            expect(particleSystem.qualityConfigs.low).toBeDefined();
        });

        it('should add particle points to scene', () => {
            expect(mockScene.add).toHaveBeenCalledWith(particleSystem.particlePoints);
        });
    });

    describe('particle pool management', () => {
        it('should acquire particles from pool', () => {
            const particle = particleSystem.acquireParticle();

            expect(particle).toBeInstanceOf(Particle);
            expect(particle.active).toBe(true);
            expect(particleSystem.getActiveParticleCount()).toBe(1);
        });

        it('should return null when pool is exhausted', () => {
            // Acquire all particles
            for (let i = 0; i < 50; i++) {
                particleSystem.acquireParticle();
            }

            // Try to acquire one more
            const particle = particleSystem.acquireParticle();
            expect(particle).toBeNull();
        });

        it('should release particles back to pool', () => {
            const particle = particleSystem.acquireParticle();
            particleSystem.releaseParticle(particle);

            expect(particle.active).toBe(false);
            expect(particleSystem.getActiveParticleCount()).toBe(0);
        });
    });

    describe('update', () => {
        it('should not update when disabled', () => {
            particleSystem.setEnabled(false);
            const particle = particleSystem.acquireParticle();
            particle.lifetime = 0.1;

            particleSystem.update(0.2, { isPaused: false });

            expect(particle.active).toBe(true); // Should not be updated
        });

        it('should not update when paused', () => {
            const particle = particleSystem.acquireParticle();
            particle.lifetime = 0.1;

            particleSystem.update(0.2, { isPaused: true });

            expect(particle.active).toBe(true); // Should not be updated
        });

        it('should update active particles', () => {
            const particle = particleSystem.acquireParticle();
            particle.velocity.set(1, 0, 0);

            particleSystem.update(0.1, { isPaused: false });

            expect(particle.position.x).toBe(0.1);
        });

        it('should release expired particles', () => {
            const particle = particleSystem.acquireParticle();
            particle.lifetime = 0.1;

            particleSystem.update(0.2, { isPaused: false });

            expect(particleSystem.getActiveParticleCount()).toBe(0);
        });
    });

    describe('effect generation', () => {
        describe('emitTrailSparks', () => {
            it('should create trail spark particles', () => {
                const position = { x: 1, y: 0, z: 1 };
                const velocity = { x: 1, y: 0, z: 0 };
                const color = 0x00ff00;

                particleSystem.emitTrailSparks(position, velocity, color);

                expect(particleSystem.getActiveParticleCount()).toBeGreaterThan(0);
                const activeParticles = particleSystem.particlePool.getActiveParticles();
                const particle = activeParticles[0];
                expect(particle.type).toBe('trail');
                expect(particle.size).toBeGreaterThanOrEqual(0.03);
                expect(particle.size).toBeLessThanOrEqual(0.07);
                expect(particle.lifetime).toBeGreaterThanOrEqual(0.5);
                expect(particle.lifetime).toBeLessThanOrEqual(1.0);
            });

            it('should not create particles when effect is disabled', () => {
                particleSystem.setEffectEnabled('trailSparks', false);

                particleSystem.emitTrailSparks(
                    { x: 0, y: 0, z: 0 },
                    { x: 1, y: 0, z: 0 },
                    0x00ff00
                );

                expect(particleSystem.getActiveParticleCount()).toBe(0);
            });

            it('should emit more particles at higher speeds', () => {
                const position = { x: 0, y: 0, z: 0 };
                const velocity = { x: 1, y: 0, z: 0 };
                const color = 0x00ff00;

                // Test low speed
                particleSystem.emitTrailSparks(position, velocity, color, 0.05);
                const lowSpeedCount = particleSystem.getActiveParticleCount();

                particleSystem.reset();

                // Test high speed
                particleSystem.emitTrailSparks(position, velocity, color, 0.3);
                const highSpeedCount = particleSystem.getActiveParticleCount();

                expect(highSpeedCount).toBeGreaterThanOrEqual(lowSpeedCount);
            });

            it('should position particles at rear of bike', () => {
                const position = { x: 5, y: 0, z: 5 };
                const velocity = { x: 1, y: 0, z: 0 };
                const color = 0x00ff00;

                particleSystem.emitTrailSparks(position, velocity, color, 0.1);

                const activeParticles = particleSystem.particlePool.getActiveParticles();
                const particle = activeParticles[0];
                // Particle should be positioned behind the bike (lower x value)
                expect(particle.position.x).toBeLessThan(position.x);
            });

            it('should use correct particle size as specified in requirements', () => {
                const position = { x: 0, y: 0, z: 0 };
                const velocity = { x: 1, y: 0, z: 0 };
                const color = 0x00ff00;

                particleSystem.emitTrailSparks(position, velocity, color, 0.1);

                const activeParticles = particleSystem.particlePool.getActiveParticles();
                const particle = activeParticles[0];
                // Size should be around 0.05 units (0.04-0.06 range)
                expect(particle.size).toBeGreaterThanOrEqual(0.04);
                expect(particle.size).toBeLessThanOrEqual(0.06);
            });

            it('should apply backward velocity bias', () => {
                const position = { x: 0, y: 0, z: 0 };
                const velocity = { x: 1, y: 0, z: 0 }; // Moving right
                const color = 0x00ff00;

                particleSystem.emitTrailSparks(position, velocity, color, 0.1);

                const activeParticles = particleSystem.particlePool.getActiveParticles();
                const particle = activeParticles[0];
                // Particle velocity should have backward bias (negative x component)
                expect(particle.velocity.x).toBeLessThan(0);
            });
        });

        describe('createExplosion', () => {
            it('should create explosion particles', () => {
                const position = { x: 0, y: 0, z: 0 };

                particleSystem.createExplosion(position, 1.0);

                expect(particleSystem.getActiveParticleCount()).toBeGreaterThan(0);
                const activeParticles = particleSystem.particlePool.getActiveParticles();
                const particle = activeParticles[0];
                expect(particle.type).toBe('explosion');
                expect(particle.size).toBeGreaterThanOrEqual(0.1);
                expect(particle.size).toBeLessThanOrEqual(0.2);
                expect(particle.lifetime).toBeGreaterThanOrEqual(1.5);
                expect(particle.lifetime).toBeLessThanOrEqual(2.0);
            });

            it('should scale particle count with intensity', () => {
                particleSystem.createExplosion({ x: 0, y: 0, z: 0 }, 0.5);
                const halfIntensityCount = particleSystem.getActiveParticleCount();

                particleSystem.reset();

                particleSystem.createExplosion({ x: 0, y: 0, z: 0 }, 1.0);
                const fullIntensityCount = particleSystem.getActiveParticleCount();

                expect(fullIntensityCount).toBeGreaterThan(halfIntensityCount);
            });
        });

        describe('createCollectionEffect', () => {
            it('should create collection particles with correct color', () => {
                const position = { x: 0, y: 0, z: 0 };

                particleSystem.createCollectionEffect(position, 'SPEED_BOOST');

                expect(particleSystem.getActiveParticleCount()).toBeGreaterThan(0);
                const activeParticles = particleSystem.particlePool.getActiveParticles();
                const particle = activeParticles[0];
                expect(particle.type).toBe('collection');
                expect(particle.lifetime).toBe(1.0);
                expect(particle.size).toBeGreaterThanOrEqual(0.05);
                expect(particle.size).toBeLessThanOrEqual(0.1);
            });

            it('should use different colors for different power-up types', () => {
                particleSystem.createCollectionEffect({ x: 0, y: 0, z: 0 }, 'SPEED_BOOST');
                const activeParticles1 = particleSystem.particlePool.getActiveParticles();
                const speedBoostColor = { ...activeParticles1[0].color };

                particleSystem.reset();

                particleSystem.createCollectionEffect({ x: 0, y: 0, z: 0 }, 'SHIELD');
                const activeParticles2 = particleSystem.particlePool.getActiveParticles();
                const shieldColor = { ...activeParticles2[0].color };

                // Colors should be different (though we can't easily test exact hex values in this mock)
                expect(speedBoostColor).not.toEqual(shieldColor);
            });
        });
    });

    describe('quality settings', () => {
        it('should accept valid quality levels', () => {
            particleSystem.setQualityLevel('high');
            expect(particleSystem.getSettings().quality).toBe('high');

            particleSystem.setQualityLevel('low');
            expect(particleSystem.getSettings().quality).toBe('low');
        });

        it('should ignore invalid quality levels', () => {
            const originalQuality = particleSystem.getSettings().quality;
            particleSystem.setQualityLevel('invalid');
            expect(particleSystem.getSettings().quality).toBe(originalQuality);
        });
    });

    describe('state management', () => {
        it('should reset all particles', () => {
            // Create some active particles
            particleSystem.acquireParticle();
            particleSystem.acquireParticle();

            particleSystem.reset();

            expect(particleSystem.getActiveParticleCount()).toBe(0);
        });

        it('should enable and disable system', () => {
            particleSystem.setEnabled(false);
            expect(particleSystem.getSettings().enabled).toBe(false);

            particleSystem.setEnabled(true);
            expect(particleSystem.getSettings().enabled).toBe(true);
        });

        it('should enable and disable specific effects', () => {
            particleSystem.setEffectEnabled('explosions', false);
            expect(particleSystem.getSettings().effects.explosions).toBe(false);

            particleSystem.setEffectEnabled('explosions', true);
            expect(particleSystem.getSettings().effects.explosions).toBe(true);
        });
    });

    describe('performance monitoring', () => {
        it('should track active particle count', () => {
            expect(particleSystem.getActiveParticleCount()).toBe(0);

            particleSystem.acquireParticle();
            expect(particleSystem.getActiveParticleCount()).toBe(1);

            particleSystem.acquireParticle();
            expect(particleSystem.getActiveParticleCount()).toBe(2);
        });

        it('should provide performance metrics', () => {
            const metrics = particleSystem.getPerformanceMetrics();

            expect(metrics).toHaveProperty('currentFPS');
            expect(metrics).toHaveProperty('averageFPS');
            expect(metrics).toHaveProperty('performanceWarnings');
        });

        it('should provide performance status', () => {
            const status = particleSystem.getPerformanceStatus();

            expect(status).toHaveProperty('currentFPS');
            expect(status).toHaveProperty('averageFPS');
            expect(status).toHaveProperty('degradationLevel');
            expect(status).toHaveProperty('adaptiveQualityEnabled');
            expect(status).toHaveProperty('currentQuality');
            expect(status).toHaveProperty('activeParticles');
            expect(status).toHaveProperty('maxParticles');
            expect(status).toHaveProperty('effectsEnabled');

            expect(status.degradationLevel).toBe(0);
            expect(status.adaptiveQualityEnabled).toBe(true);
            expect(status.currentQuality).toBe('medium');
        });

        it('should enable and disable adaptive quality', () => {
            expect(particleSystem.adaptiveQualityEnabled).toBe(true);

            particleSystem.setAdaptiveQuality(false);
            expect(particleSystem.adaptiveQualityEnabled).toBe(false);

            particleSystem.setAdaptiveQuality(true);
            expect(particleSystem.adaptiveQualityEnabled).toBe(true);
        });

        it('should apply performance degradation', () => {
            const originalMaxParticles = particleSystem.settings.maxParticles;

            particleSystem.applyPerformanceDegradation();

            expect(particleSystem.degradationLevel).toBe(1);
            expect(particleSystem.settings.maxParticles).toBeLessThan(originalMaxParticles);
        });

        it('should restore settings after performance recovery', () => {
            const originalMaxParticles = particleSystem.settings.maxParticles;
            const originalQuality = particleSystem.settings.quality;

            // Apply degradation
            particleSystem.applyPerformanceDegradation();
            expect(particleSystem.degradationLevel).toBe(1);

            // Attempt recovery
            particleSystem.attemptPerformanceRecovery();
            expect(particleSystem.degradationLevel).toBe(0);
            expect(particleSystem.settings.maxParticles).toBe(originalMaxParticles);
            expect(particleSystem.settings.quality).toBe(originalQuality);
        });

        it('should disable trail sparks at degradation level 2', () => {
            // Apply degradation twice
            particleSystem.applyPerformanceDegradation();
            particleSystem.applyPerformanceDegradation();

            expect(particleSystem.degradationLevel).toBe(2);
            expect(particleSystem.settings.effects.trailSparks).toBe(false);
            expect(particleSystem.settings.quality).toBe('low');
        });

        it('should reduce explosion particles at degradation level 3', () => {
            const originalExplosionParticles = particleSystem.qualityConfigs.low.explosionParticles;

            // Apply degradation three times
            particleSystem.applyPerformanceDegradation();
            particleSystem.applyPerformanceDegradation();
            particleSystem.applyPerformanceDegradation();

            expect(particleSystem.degradationLevel).toBe(3);
            expect(particleSystem.qualityConfigs.low.explosionParticles).toBeLessThan(
                originalExplosionParticles
            );
        });

        it('should not exceed maximum degradation level', () => {
            // Apply degradation many times
            for (let i = 0; i < 10; i++) {
                particleSystem.applyPerformanceDegradation();
            }

            expect(particleSystem.degradationLevel).toBe(3);
        });

        it('should reset degradation state on system reset', () => {
            // Apply some degradation
            particleSystem.applyPerformanceDegradation();
            particleSystem.applyPerformanceDegradation();

            expect(particleSystem.degradationLevel).toBe(2);

            // Reset system
            particleSystem.reset();

            expect(particleSystem.degradationLevel).toBe(0);
            expect(particleSystem.settings.effects.trailSparks).toBe(true);
        });
    });

    describe('disposal', () => {
        it('should clean up resources', () => {
            const originalParticlePoints = particleSystem.particlePoints;

            particleSystem.dispose();

            expect(mockScene.remove).toHaveBeenCalledWith(originalParticlePoints);
            expect(particleSystem.particlePoints).toBeNull();
            expect(particleSystem.particleGeometry).toBeNull();
            expect(particleSystem.particleMaterial).toBeNull();
        });
    });

    describe('Error Handling and Edge Cases', () => {
        const originalThree = { ...global.THREE };

        beforeEach(() => {
            // Restore globals before each test in this block to ensure clean state
            global.THREE = { ...originalThree };
            // Ensure mocked logger is available
            jest.doMock('@/utils/Logger.js', () => ({
                logger: mockLogger,
                Logger: MockLoggerClass,
                createLogger: jest.fn(() => mockLogger),
            }));
        });

        afterEach(() => {
            jest.resetModules();
            jest.restoreAllMocks();
            global.THREE = { ...originalThree };
        });

        it('should handle constructor errors', () => {
            expect(() => new ParticleSystem(null)).toThrow('Scene is required');
        });

        it('should handle particle pool initialization failure', () => {
            jest.resetModules();

            jest.doMock('@/rendering/ParticlePool.js', () => ({
                ParticlePool: jest.fn().mockImplementation(() => {
                    throw new Error('Pool init failed');
                }),
            }));

            // Need to mock dependencies that ParticleSystem requires
            jest.doMock('@/utils/PerformanceMonitor.js', () => ({
                PerformanceMonitor: jest.fn(),
            }));

            const { ParticleSystem: PS_MockedPool } = require('@/rendering/ParticleSystem.js');

            expect(() => new PS_MockedPool(mockScene)).toThrow(
                'Failed to initialize particle pool'
            );

            jest.unmock('@/rendering/ParticlePool.js');
        });

        it('should handle rendering initialization failure', () => {
            jest.resetModules();
            // Re-require to get fresh module
            const { ParticleSystem: PS } = require('@/rendering/ParticleSystem.js');

            const originalBufferGeometry = global.THREE.BufferGeometry;
            global.THREE.BufferGeometry = jest.fn().mockImplementation(() => {
                throw new Error('Geometry error');
            });

            try {
                expect(() => new PS(mockScene)).toThrow('Failed to initialize particle rendering');
            } finally {
                global.THREE.BufferGeometry = originalBufferGeometry;
            }
        });

        it('should use fallback texture on texture creation failure', () => {
            jest.resetModules();
            const { ParticleSystem: PS } = require('@/rendering/ParticleSystem.js');

            const originalCreateElement = global.document.createElement;
            global.document.createElement = jest.fn(() => {
                throw new Error('Canvas error');
            });

            try {
                const system = new PS(mockScene);
                const texture = system.createParticleTexture();
                expect(texture).toEqual({ needsUpdate: true });
            } finally {
                global.document.createElement = originalCreateElement;
            }
        });

        it('should handle update errors gracefully', () => {
            jest.resetModules();
            const { ParticleSystem: PS } = require('@/rendering/ParticleSystem.js');
            const system = new PS(mockScene);

            system.validateUpdateParameters = jest.fn().mockImplementation(() => {
                throw new Error('Update validation error');
            });

            system.update(0.1, {});
            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('Critical update error'),
                expect.any(Error)
            );
        });

        it('should handle batch update errors', () => {
            jest.resetModules();
            const { ParticleSystem: PS } = require('@/rendering/ParticleSystem.js');
            const system = new PS(mockScene);

            // 1. Missing attributes -> Warn
            system.particleGeometry = { attributes: null };
            system.updateRenderingBuffers();
            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.stringContaining('Geometry not available')
            );

            // 2. Missing buffer arrays -> Warn
            // Note: Use a new system or reset geometry to ensure clean state
            const system2 = new PS(mockScene);
            system2.particleGeometry = {
                attributes: {
                    position: { array: null }, // Trigger specific check
                    color: { array: null },
                    size: { array: null },
                    alpha: { array: null },
                },
            };
            system2.updateRenderingBuffers();
            expect(mockLogger.warn).toHaveBeenCalledWith(
                'ParticleSystem: Buffer arrays not available'
            );
        });

        it('should handle pool update errors', () => {
            jest.resetModules();
            const { ParticleSystem: PS } = require('@/rendering/ParticleSystem.js');
            const system = new PS(mockScene);

            system.particlePool.updateParticles = jest.fn().mockImplementation(() => {
                throw new Error('Pool update error');
            });

            system.update(0.1, {});
            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.stringContaining('Particle pool update error'),
                expect.any(Error)
            );
        });

        it('should handle shader uniform update errors', () => {
            jest.resetModules();
            const { ParticleSystem: PS } = require('@/rendering/ParticleSystem.js');
            const system = new PS(mockScene);

            Object.defineProperty(system.particleMaterial, 'uniforms', {
                get: () => {
                    throw new Error('Uniform access error');
                },
                configurable: true, // Important for reset if needed
            });

            system.update(0.1, {});
            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.stringContaining('Shader uniform update error'),
                expect.any(Error)
            );
        });

        it('should skip emission if parameters invalid', () => {
            jest.resetModules();
            const { ParticleSystem: PS } = require('@/rendering/ParticleSystem.js');
            const system = new PS(mockScene);

            system.validateEmissionParameters = jest.fn().mockReturnValue(false);
            const spyAcquire = jest.spyOn(system, 'acquireParticle');

            system.emitTrailSparks({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 0xffffff);
            expect(spyAcquire).not.toHaveBeenCalled();
        });
    });
});
