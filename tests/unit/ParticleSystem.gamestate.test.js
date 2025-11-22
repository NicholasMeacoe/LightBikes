/**
 * Tests for ParticleSystem game state management integration
 * Tests pause/resume, game restart, and game over handling
 */

const { ParticleSystem } = require('@/rendering/ParticleSystem.js');

// Mock Three.js
global.THREE = {
    BufferGeometry: class {
        constructor() {
            this.attributes = {};
        }
        setAttribute(name, attribute) {
            this.attributes[name] = attribute;
        }
        setDrawRange() {}
        dispose() {}
    },
    BufferAttribute: class {
        constructor(array, itemSize) {
            this.array = array;
            this.itemSize = itemSize;
            this.needsUpdate = false;
            this.count = array.length / itemSize;
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
            this.renderOrder = 0;
            this.frustumCulled = true;
            this.visible = true;
        }
    },
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
        clone() {
            return new THREE.Vector3(this.x, this.y, this.z);
        }
        add(vector) {
            this.x += vector.x;
            this.y += vector.y;
            this.z += vector.z;
            return this;
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
    Texture: class {
        constructor() {
            this.needsUpdate = false;
        }
        dispose() {}
    },
    AdditiveBlending: 'additive',
    ClampToEdgeWrapping: 'clamp',
    LinearFilter: 'linear',
    RGBAFormat: 'rgba',
    DoubleSide: 'double'
};

describe('ParticleSystem Game State Management', () => {
    let particleSystem;
    let mockScene;

    beforeEach(() => {
        mockScene = {
            add: jest.fn(),
            remove: jest.fn()
        };
        
        particleSystem = new ParticleSystem(mockScene, {
            maxParticles: 50,
            enabled: true
        });
    });

    afterEach(() => {
        if (particleSystem) {
            particleSystem.dispose();
        }
    });

    describe('pause/resume functionality', () => {
        it('should handle pause state correctly', () => {
            const gameState = {
                isPaused: false,
                frameCount: 10,
                gameOver: false
            };

            // First update - not paused
            particleSystem.update(0.016, gameState);
            expect(particleSystem.isPaused).toBe(false);

            // Second update - paused
            gameState.isPaused = true;
            particleSystem.update(0.016, gameState);
            expect(particleSystem.isPaused).toBe(true);
            expect(particleSystem.settings.effects.trailSparks).toBe(false); // Should disable trail sparks
        });

        it('should handle resume state correctly', () => {
            const gameState = {
                isPaused: true,
                frameCount: 10,
                gameOver: false
            };

            // Start paused
            particleSystem.update(0.016, gameState);
            expect(particleSystem.isPaused).toBe(true);

            // Resume
            gameState.isPaused = false;
            particleSystem.update(0.016, gameState);
            expect(particleSystem.isPaused).toBe(false);
            expect(particleSystem.settings.effects.trailSparks).toBe(true); // Should restore trail sparks
        });

        it('should not emit trail sparks when paused', () => {
            const gameState = {
                isPaused: true,
                frameCount: 10,
                gameOver: false
            };

            particleSystem.update(0.016, gameState);

            const initialParticleCount = particleSystem.getActiveParticleCount();
            
            // Try to emit trail sparks while paused
            particleSystem.emitTrailSparks(
                { x: 0, y: 0, z: 0 },
                { x: 0.1, y: 0, z: 0 },
                0x00ff00,
                1.0
            );

            // Should not create new particles
            expect(particleSystem.getActiveParticleCount()).toBe(initialParticleCount);
        });
    });

    describe('game restart handling', () => {
        it('should detect game restart and clear particles', () => {
            const gameState = {
                isPaused: false,
                frameCount: 10,
                gameOver: false
            };

            // First update with frame count 10
            particleSystem.update(0.016, gameState);
            expect(particleSystem.lastFrameCount).toBe(10);

            // Create some particles
            particleSystem.emitTrailSparks(
                { x: 0, y: 0, z: 0 },
                { x: 0.1, y: 0, z: 0 },
                0x00ff00,
                1.0
            );
            expect(particleSystem.getActiveParticleCount()).toBeGreaterThan(0);

            // Simulate game restart (frame count resets to 0)
            gameState.frameCount = 0;
            particleSystem.update(0.016, gameState);

            // Should clear all particles
            expect(particleSystem.getActiveParticleCount()).toBe(0);
            expect(particleSystem.lastFrameCount).toBe(0);
            expect(particleSystem.gameOverHandled).toBe(false);
            expect(particleSystem.isPaused).toBe(false);
        });

        it('should reset performance degradation on restart', () => {
            const gameState = {
                isPaused: false,
                frameCount: 10,
                gameOver: false
            };

            // First update to establish the frame count
            particleSystem.update(0.016, gameState);

            // Apply some degradation
            particleSystem.degradationLevel = 2;
            particleSystem.settings.effects.trailSparks = false;

            // Simulate restart (frame count resets to 0)
            gameState.frameCount = 0;
            particleSystem.update(0.016, gameState);

            // Should reset degradation
            expect(particleSystem.degradationLevel).toBe(0);
            expect(particleSystem.settings.effects.trailSparks).toBe(true);
        });
    });

    describe('game over handling', () => {
        it('should handle game over state', () => {
            const gameState = {
                isPaused: false,
                frameCount: 10,
                gameOver: false
            };

            // First update - game running
            particleSystem.update(0.016, gameState);
            expect(particleSystem.gameOverHandled).toBe(false);

            // Game over
            gameState.gameOver = true;
            particleSystem.update(0.016, gameState);
            expect(particleSystem.gameOverHandled).toBe(true);
            expect(particleSystem.settings.effects.trailSparks).toBe(false); // Should stop trail sparks
        });

        it('should allow existing particles to complete lifecycle during game over', () => {
            const gameState = {
                isPaused: false,
                frameCount: 10,
                gameOver: false
            };

            // Create some particles before game over
            particleSystem.emitTrailSparks(
                { x: 0, y: 0, z: 0 },
                { x: 0.1, y: 0, z: 0 },
                0x00ff00,
                1.0
            );
            const particleCountBeforeGameOver = particleSystem.getActiveParticleCount();

            // Game over
            gameState.gameOver = true;
            particleSystem.update(0.016, gameState);

            // Existing particles should still be there
            expect(particleSystem.getActiveParticleCount()).toBe(particleCountBeforeGameOver);

            // But no new trail sparks should be created
            particleSystem.emitTrailSparks(
                { x: 1, y: 0, z: 0 },
                { x: 0.1, y: 0, z: 0 },
                0x00ff00,
                1.0
            );
            expect(particleSystem.getActiveParticleCount()).toBe(particleCountBeforeGameOver);
        });

        it('should reset game over state when game restarts', () => {
            const gameState = {
                isPaused: false,
                frameCount: 10,
                gameOver: true
            };

            // Handle game over
            particleSystem.update(0.016, gameState);
            expect(particleSystem.gameOverHandled).toBe(true);

            // Game restarts
            gameState.gameOver = false;
            gameState.frameCount = 0;
            particleSystem.update(0.016, gameState);

            // Should reset game over state
            expect(particleSystem.gameOverHandled).toBe(false);
            expect(particleSystem.settings.effects.trailSparks).toBe(true);
        });
    });

    describe('movement-based trail spark emission', () => {
        it('should not emit trail sparks when entity is not moving', () => {
            const gameState = {
                isPaused: false,
                frameCount: 10,
                gameOver: false
            };

            particleSystem.update(0.016, gameState);

            const initialParticleCount = particleSystem.getActiveParticleCount();

            // Try to emit with zero velocity
            particleSystem.emitTrailSparks(
                { x: 0, y: 0, z: 0 },
                { x: 0, y: 0, z: 0 }, // No movement
                0x00ff00,
                1.0
            );

            // Should not create particles
            expect(particleSystem.getActiveParticleCount()).toBe(initialParticleCount);
        });

        it('should not emit trail sparks when movement is below threshold', () => {
            const gameState = {
                isPaused: false,
                frameCount: 10,
                gameOver: false
            };

            particleSystem.update(0.016, gameState);

            const initialParticleCount = particleSystem.getActiveParticleCount();

            // Try to emit with very small velocity (below threshold)
            particleSystem.emitTrailSparks(
                { x: 0, y: 0, z: 0 },
                { x: 0.005, y: 0, z: 0.005 }, // Below movement threshold
                0x00ff00,
                1.0
            );

            // Should not create particles
            expect(particleSystem.getActiveParticleCount()).toBe(initialParticleCount);
        });

        it('should emit trail sparks when entity is moving above threshold', () => {
            const gameState = {
                isPaused: false,
                frameCount: 10,
                gameOver: false
            };

            particleSystem.update(0.016, gameState);

            const initialParticleCount = particleSystem.getActiveParticleCount();

            // Emit with sufficient velocity
            particleSystem.emitTrailSparks(
                { x: 0, y: 0, z: 0 },
                { x: 0.1, y: 0, z: 0 }, // Above movement threshold
                0x00ff00,
                1.0
            );

            // Should create particles
            expect(particleSystem.getActiveParticleCount()).toBeGreaterThan(initialParticleCount);
        });

        it('should scale particle emission with movement speed', () => {
            const gameState = {
                isPaused: false,
                frameCount: 10,
                gameOver: false
            };

            particleSystem.update(0.016, gameState);

            // Emit with slow movement
            particleSystem.emitTrailSparks(
                { x: 0, y: 0, z: 0 },
                { x: 0.05, y: 0, z: 0 }, // Slow movement
                0x00ff00,
                1.0
            );
            const slowParticleCount = particleSystem.getActiveParticleCount();

            // Clear particles
            particleSystem.reset();
            particleSystem.update(0.016, gameState);

            // Emit with fast movement
            particleSystem.emitTrailSparks(
                { x: 0, y: 0, z: 0 },
                { x: 0.2, y: 0, z: 0 }, // Fast movement
                0x00ff00,
                1.0
            );
            const fastParticleCount = particleSystem.getActiveParticleCount();

            // Fast movement should create more particles
            expect(fastParticleCount).toBeGreaterThanOrEqual(slowParticleCount);
        });
    });

    describe('integration with game state changes', () => {
        it('should handle complex state transitions correctly', () => {
            const gameState = {
                isPaused: false,
                frameCount: 1,
                gameOver: false
            };

            // Start game
            particleSystem.update(0.016, gameState);
            expect(particleSystem.isPaused).toBe(false);
            expect(particleSystem.gameOverHandled).toBe(false);

            // Pause game
            gameState.isPaused = true;
            gameState.frameCount = 2;
            particleSystem.update(0.016, gameState);
            expect(particleSystem.isPaused).toBe(true);

            // Resume game
            gameState.isPaused = false;
            gameState.frameCount = 3;
            particleSystem.update(0.016, gameState);
            expect(particleSystem.isPaused).toBe(false);

            // Game over
            gameState.gameOver = true;
            gameState.frameCount = 4;
            particleSystem.update(0.016, gameState);
            expect(particleSystem.gameOverHandled).toBe(true);

            // Restart game
            gameState.gameOver = false;
            gameState.frameCount = 0;
            particleSystem.update(0.016, gameState);
            expect(particleSystem.gameOverHandled).toBe(false);
            expect(particleSystem.isPaused).toBe(false);
            expect(particleSystem.lastFrameCount).toBe(0);
        });
    });
});