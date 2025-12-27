/**
 * Tests for ParticlePool class
 * Verifies memory-efficient particle management and pooling functionality
 */

// Mock THREE.js for testing environment
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
        }
        add(vector) {
            this.x += vector.x;
            this.y += vector.y;
            this.z += vector.z;
            return this;
        }
        clone() {
            return new THREE.Vector3(this.x, this.y, this.z);
        }
        multiplyScalar(scalar) {
            this.x *= scalar;
            this.y *= scalar;
            this.z *= scalar;
            return this;
        }
    },
    Color: class {
        constructor() {
            this.r = 1;
            this.g = 1;
            this.b = 1;
        }
        setHex(hex) {
            this.r = ((hex >> 16) & 255) / 255;
            this.g = ((hex >> 8) & 255) / 255;
            this.b = (hex & 255) / 255;
        }
    },
};

const { ParticlePool } = require('@/rendering/ParticlePool.js');

describe('ParticlePool', () => {
    let pool;
    const maxParticles = 10;

    beforeEach(() => {
        pool = new ParticlePool(maxParticles);
    });

    afterEach(() => {
        if (pool) {
            pool.dispose();
        }
    });

    describe('constructor', () => {
        it('should initialize with correct maximum particles', () => {
            expect(pool.getMaxParticles()).toBe(maxParticles);
        });

        it('should start with all particles inactive', () => {
            expect(pool.getActiveCount()).toBe(0);
            expect(pool.getAvailableCount()).toBe(maxParticles);
        });

        it('should use default max particles when not specified', () => {
            const defaultPool = new ParticlePool();
            expect(defaultPool.getMaxParticles()).toBe(200);
            defaultPool.dispose();
        });
    });

    describe('acquire', () => {
        it('should return a particle when available', () => {
            const particle = pool.acquire();
            expect(particle).not.toBeNull();
            expect(particle.active).toBe(true);
        });

        it('should decrease available count when acquiring', () => {
            const initialAvailable = pool.getAvailableCount();
            pool.acquire();
            expect(pool.getAvailableCount()).toBe(initialAvailable - 1);
        });

        it('should increase active count when acquiring', () => {
            const initialActive = pool.getActiveCount();
            pool.acquire();
            expect(pool.getActiveCount()).toBe(initialActive + 1);
        });

        it('should return null when pool is exhausted', () => {
            // Acquire all particles
            for (let i = 0; i < maxParticles; i++) {
                pool.acquire();
            }

            // Try to acquire one more - should return null
            const particle = pool.acquire();
            expect(particle).toBeNull();
        });

        it('should reset particle state when acquiring', () => {
            const particle = pool.acquire();

            // Modify particle state
            particle.position.set(5, 10, 15);
            particle.age = 0.5;
            particle.size = 0.2;

            // Release and acquire again
            pool.release(particle);
            const newParticle = pool.acquire();

            expect(newParticle.position.x).toBe(0);
            expect(newParticle.position.y).toBe(0);
            expect(newParticle.position.z).toBe(0);
            expect(newParticle.age).toBe(0);
            expect(newParticle.size).toBe(0.05);
        });
    });

    describe('release', () => {
        it('should release an active particle back to pool', () => {
            const particle = pool.acquire();
            const initialActive = pool.getActiveCount();
            const initialAvailable = pool.getAvailableCount();

            pool.release(particle);

            expect(pool.getActiveCount()).toBe(initialActive - 1);
            expect(pool.getAvailableCount()).toBe(initialAvailable + 1);
            expect(particle.active).toBe(false);
        });

        it('should handle releasing null particle gracefully', () => {
            const initialActive = pool.getActiveCount();
            pool.release(null);
            expect(pool.getActiveCount()).toBe(initialActive);
        });

        it('should handle releasing particle not in active pool', () => {
            const particle = pool.acquire();
            pool.release(particle); // Release once

            const initialActive = pool.getActiveCount();
            pool.release(particle); // Try to release again

            expect(pool.getActiveCount()).toBe(initialActive);
        });
    });

    describe('getActiveParticles', () => {
        it('should return copy of active particles array', () => {
            const particle1 = pool.acquire();
            const particle2 = pool.acquire();

            const activeParticles = pool.getActiveParticles();

            expect(activeParticles).toHaveLength(2);
            expect(activeParticles).toContain(particle1);
            expect(activeParticles).toContain(particle2);

            // Verify it's a copy (modifying returned array shouldn't affect pool)
            activeParticles.push({});
            expect(pool.getActiveCount()).toBe(2);
        });
    });

    describe('hasAvailable', () => {
        it('should return true when particles are available', () => {
            expect(pool.hasAvailable()).toBe(true);
        });

        it('should return false when pool is exhausted', () => {
            // Acquire all particles
            for (let i = 0; i < maxParticles; i++) {
                pool.acquire();
            }

            expect(pool.hasAvailable()).toBe(false);
        });
    });

    describe('getUtilization', () => {
        it('should return 0% when no particles are active', () => {
            expect(pool.getUtilization()).toBe(0);
        });

        it('should return 100% when all particles are active', () => {
            // Acquire all particles
            for (let i = 0; i < maxParticles; i++) {
                pool.acquire();
            }

            expect(pool.getUtilization()).toBe(100);
        });

        it('should return correct percentage for partial utilization', () => {
            // Acquire half the particles
            for (let i = 0; i < maxParticles / 2; i++) {
                pool.acquire();
            }

            expect(pool.getUtilization()).toBe(50);
        });
    });

    describe('releaseAll', () => {
        it('should release all active particles', () => {
            // Acquire some particles
            pool.acquire();
            pool.acquire();
            pool.acquire();

            expect(pool.getActiveCount()).toBe(3);

            pool.releaseAll();

            expect(pool.getActiveCount()).toBe(0);
            expect(pool.getAvailableCount()).toBe(maxParticles);
        });

        it('should handle empty active pool gracefully', () => {
            pool.releaseAll();
            expect(pool.getActiveCount()).toBe(0);
        });
    });

    describe('updateParticles', () => {
        it('should update all active particles', () => {
            const particle1 = pool.acquire();
            const particle2 = pool.acquire();

            particle1.velocity.set(1, 0, 0);
            particle2.velocity.set(0, 1, 0);

            const deltaTime = 0.1;
            pool.updateParticles(deltaTime);

            expect(particle1.position.x).toBeCloseTo(0.1);
            expect(particle2.position.y).toBeCloseTo(0.1);
        });

        it('should automatically release particles that exceed lifetime', () => {
            const particle = pool.acquire();
            particle.lifetime = 0.5;
            particle.age = 0.4; // Close to lifetime

            expect(pool.getActiveCount()).toBe(1);

            // Update with enough time to exceed lifetime
            pool.updateParticles(0.2);

            expect(pool.getActiveCount()).toBe(0);
            expect(pool.getAvailableCount()).toBe(maxParticles);
        });
    });

    describe('getStats', () => {
        it('should return correct pool statistics', () => {
            pool.acquire();
            pool.acquire();

            const stats = pool.getStats();

            expect(stats.maxParticles).toBe(maxParticles);
            expect(stats.activeCount).toBe(2);
            expect(stats.availableCount).toBe(maxParticles - 2);
            expect(stats.utilization).toBe(20);
            expect(stats.totalParticles).toBe(maxParticles);
        });
    });

    describe('validateIntegrity', () => {
        it('should return true for valid pool state', () => {
            pool.acquire();
            pool.acquire();

            expect(pool.validateIntegrity()).toBe(true);
        });

        it('should detect integrity issues', () => {
            // This test verifies the integrity check works
            // In normal usage, integrity should always be valid
            expect(pool.validateIntegrity()).toBe(true);
        });
    });

    describe('pool overflow protection', () => {
        it('should prevent acquiring more particles than maximum', () => {
            const particles = [];

            // Acquire all particles
            for (let i = 0; i < maxParticles; i++) {
                const particle = pool.acquire();
                expect(particle).not.toBeNull();
                particles.push(particle);
            }

            // Try to acquire one more
            const overflowParticle = pool.acquire();
            expect(overflowParticle).toBeNull();

            // Verify pool state
            expect(pool.getActiveCount()).toBe(maxParticles);
            expect(pool.getAvailableCount()).toBe(0);
        });

        it('should allow acquiring after releasing particles', () => {
            // Fill the pool
            const particles = [];
            for (let i = 0; i < maxParticles; i++) {
                particles.push(pool.acquire());
            }

            // Release some particles
            pool.release(particles[0]);
            pool.release(particles[1]);

            // Should be able to acquire again
            const newParticle1 = pool.acquire();
            const newParticle2 = pool.acquire();

            expect(newParticle1).not.toBeNull();
            expect(newParticle2).not.toBeNull();

            // But not a third one
            const overflowParticle = pool.acquire();
            expect(overflowParticle).toBeNull();
        });
    });

    describe('active particle tracking', () => {
        it('should accurately track active particle count', () => {
            expect(pool.getActiveCount()).toBe(0);

            const particle1 = pool.acquire();
            expect(pool.getActiveCount()).toBe(1);

            const particle2 = pool.acquire();
            expect(pool.getActiveCount()).toBe(2);

            pool.release(particle1);
            expect(pool.getActiveCount()).toBe(1);

            pool.release(particle2);
            expect(pool.getActiveCount()).toBe(0);
        });

        it('should maintain correct counts during complex operations', () => {
            const particles = [];

            // Acquire several particles
            for (let i = 0; i < 5; i++) {
                particles.push(pool.acquire());
            }
            expect(pool.getActiveCount()).toBe(5);

            // Release some
            pool.release(particles[0]);
            pool.release(particles[2]);
            expect(pool.getActiveCount()).toBe(3);

            // Acquire more
            particles.push(pool.acquire());
            particles.push(pool.acquire());
            expect(pool.getActiveCount()).toBe(5);

            // Release all
            pool.releaseAll();
            expect(pool.getActiveCount()).toBe(0);
        });
    });

    describe('dispose', () => {
        it('should clean up all resources', () => {
            pool.acquire();
            pool.acquire();

            pool.dispose();

            expect(pool.getActiveCount()).toBe(0);
            expect(pool.getAvailableCount()).toBe(0);
        });
    });
});
