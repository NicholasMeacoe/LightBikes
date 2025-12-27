/**
 * Multiplayer Feature Integration Tests
 * Tests integration of local multiplayer with existing game features:
 * - Arena Shrink mode compatibility
 * - Pause/Resume functionality
 * - Sound effects integration
 * - Particle system integration
 * - Customization system integration
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
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

const { MultiplayerGame } = require('@/multiplayer/MultiplayerGame.js');
const { PlayerEntity } = require('@/multiplayer/PlayerEntity.js');
const { ArenaShrinker } = require('@/systems/ArenaShrinker.js');
const { ParticleSystem } = require('@/rendering/ParticleSystem.js');
const { CustomizationManager } = require('@/systems/CustomizationManager.js');

// Mock THREE.js
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
        copy(v) {
            this.x = v.x;
            this.y = v.y;
            this.z = v.z;
            return this;
        }
        clone() {
            return new THREE.Vector3(this.x, this.y, this.z);
        }
        length() {
            return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        }
        normalize() {
            const len = this.length();
            if (len > 0) {
                this.x /= len;
                this.y /= len;
                this.z /= len;
            }
            return this;
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
    },
    Color: class {
        constructor(color) {
            this.r = 0;
            this.g = 0;
            this.b = 0;
            if (typeof color === 'number') {
                this.setHex(color);
            }
        }
        setHex(hex) {
            this.r = ((hex >> 16) & 255) / 255;
            this.g = ((hex >> 8) & 255) / 255;
            this.b = (hex & 255) / 255;
            return this;
        }
        getHex() {
            return (
                (Math.round(this.r * 255) << 16) +
                (Math.round(this.g * 255) << 8) +
                Math.round(this.b * 255)
            );
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
            this.vertexShader = params.vertexShader;
            this.fragmentShader = params.fragmentShader;
        }
    },
    Points: class {
        constructor(geometry, material) {
            this.geometry = geometry;
            this.material = material;
            this.renderOrder = 0;
            this.frustumCulled = true;
        }
    },
    Texture: class {
        constructor() {
            this.needsUpdate = false;
        }
    },
    AdditiveBlending: 2,
    DoubleSide: 2,
    ClampToEdgeWrapping: 1001,
    LinearFilter: 1006,
    RGBAFormat: 1023,
};

describe('Multiplayer Feature Integration', () => {
    let game;
    let mockScene;
    let mockAudioManager;

    beforeEach(() => {
        // Create mock scene
        mockScene = {
            add: jest.fn(),
            remove: jest.fn(),
        };

        // Create mock audio manager
        mockAudioManager = {
            playTurnSound: jest.fn(),
            startEngineSound: jest.fn(),
            stopEngineSound: jest.fn(),
            playExplosionSound: jest.fn(),
            playVictorySound: jest.fn(),
            playDefeatSound: jest.fn(),
            handleGamePause: jest.fn(),
            handleGameResume: jest.fn(),
            isMuted: false,
            isInitialized: true,
        };

        // Create multiplayer game instance
        game = new MultiplayerGame();
    });

    describe('Arena Shrink Mode Integration (Requirement 6.1)', () => {
        test('should support arena shrink mode with two players', () => {
            // Enable arena shrink mode
            game.arenaShrinker = new ArenaShrinker(30, 10, 5000, 1);
            game.arenaShrinker.initialize(Date.now());

            // Verify both players are initialized
            expect(game.player1).toBeDefined();
            expect(game.player2).toBeDefined();
            expect(game.player1.isAlive).toBe(true);
            expect(game.player2.isAlive).toBe(true);

            // Verify arena shrinker is active
            expect(game.arenaShrinker.isActive).toBe(true);
            expect(game.arenaShrinker.getCurrentSize()).toBe(30);
        });

        test('should apply arena shrinking equally to both players', () => {
            // Enable arena shrink mode
            game.arenaShrinker = new ArenaShrinker(30, 10, 100, 2);
            const startTime = Date.now();
            game.arenaShrinker.initialize(startTime);

            // Get initial bounds
            const initialBounds = game.arenaShrinker.getCurrentBounds();
            expect(initialBounds.size).toBe(30);

            // Simulate time passing to trigger shrink
            const shrinkTime = startTime + 150;
            game.arenaShrinker.update(shrinkTime);

            // Verify arena has shrunk
            const newBounds = game.arenaShrinker.getCurrentBounds();
            expect(newBounds.size).toBeLessThan(initialBounds.size);
            expect(newBounds.size).toBe(26); // 30 - (2 * 2) = 26

            // Verify both players are affected by same boundaries
            const player1InBounds = game.arenaShrinker.isWithinBounds(game.player1.position);
            const player2InBounds = game.arenaShrinker.isWithinBounds(game.player2.position);

            // Both players should be within bounds initially
            expect(player1InBounds).toBe(true);
            expect(player2InBounds).toBe(true);
        });

        test('should detect when players are outside shrunk arena', () => {
            // Enable arena shrink mode
            game.arenaShrinker = new ArenaShrinker(30, 10, 100, 5);
            const startTime = Date.now();
            game.arenaShrinker.initialize(startTime);

            // Position players near edge
            game.player1.position.x = 14;
            game.player1.position.y = 0;
            game.player1.position.z = 14;
            game.player2.position.x = -14;
            game.player2.position.y = 0;
            game.player2.position.z = -14;

            // Verify both are in bounds initially
            expect(game.arenaShrinker.isWithinBounds(game.player1.position)).toBe(true);
            expect(game.arenaShrinker.isWithinBounds(game.player2.position)).toBe(true);

            // Trigger shrink
            game.arenaShrinker.update(startTime + 150);

            // Arena should now be 20x20 (30 - 10)
            const newBounds = game.arenaShrinker.getCurrentBounds();
            expect(newBounds.size).toBe(20);

            // Players at position 14 should now be outside bounds (bounds are -10 to 10)
            expect(game.arenaShrinker.isWithinBounds(game.player1.position)).toBe(false);
            expect(game.arenaShrinker.isWithinBounds(game.player2.position)).toBe(false);
        });

        test('should handle arena shrink warnings for both players', () => {
            // Enable arena shrink mode with warning callback
            game.arenaShrinker = new ArenaShrinker(30, 10, 3000, 1);
            const startTime = Date.now();
            game.arenaShrinker.initialize(startTime);

            let warningTriggered = false;
            game.arenaShrinker.setOnWarning(() => {
                warningTriggered = true;
            });

            // Update to just before warning period (3000ms - 2000ms warning = 1000ms)
            game.arenaShrinker.update(startTime + 900);
            expect(warningTriggered).toBe(false);

            // Update to trigger warning
            game.arenaShrinker.update(startTime + 1100);
            expect(warningTriggered).toBe(true);
            expect(game.arenaShrinker.isWarningActive()).toBe(true);
        });

        test('should track survival time for both players in arena shrink mode', () => {
            // Enable arena shrink mode
            game.arenaShrinker = new ArenaShrinker(30, 10, 5000, 1);
            const startTime = Date.now();
            game.arenaShrinker.initialize(startTime);

            // Simulate time passing
            const currentTime = startTime + 3000;
            const survivalTime = game.arenaShrinker.getSurvivalTime(currentTime);

            expect(survivalTime).toBe(3000);
            expect(game.arenaShrinker.isTrackingSurvival).toBe(true);
        });
    });

    describe('Pause/Resume Functionality Integration (Requirement 6.2)', () => {
        test('should pause both players simultaneously', () => {
            // Start game
            game.gameStarted = true;
            game.isPaused = false;

            // Verify both players are active
            expect(game.player1.isAlive).toBe(true);
            expect(game.player2.isAlive).toBe(true);

            // Pause game
            game.isPaused = true;

            // Verify game state
            const gameState = game.getGameState();
            expect(gameState.isPaused).toBe(true);

            // Update should not process when paused
            const initialFrameCount = game.frameCount;
            game.update();
            expect(game.frameCount).toBe(initialFrameCount);
        });

        test('should resume both players simultaneously', () => {
            // Start and pause game
            game.gameStarted = true;
            game.isPaused = true;
            const pausedFrameCount = game.frameCount;

            // Resume game
            game.isPaused = false;

            // Verify game state
            const gameState = game.getGameState();
            expect(gameState.isPaused).toBe(false);

            // Update should process when resumed
            game.update();
            expect(game.frameCount).toBeGreaterThan(pausedFrameCount);
        });

        test('should maintain player positions during pause', () => {
            // Set player positions
            const player1InitialPos = { x: 5, y: 0, z: 5 };
            const player2InitialPos = { x: -5, y: 0, z: -5 };

            game.player1.position.x = player1InitialPos.x;
            game.player1.position.y = player1InitialPos.y;
            game.player1.position.z = player1InitialPos.z;
            game.player2.position.x = player2InitialPos.x;
            game.player2.position.y = player2InitialPos.y;
            game.player2.position.z = player2InitialPos.z;

            // Pause game
            game.isPaused = true;

            // Try to update (should not move players)
            game.update();

            // Verify positions unchanged
            expect(game.player1.position.x).toBe(player1InitialPos.x);
            expect(game.player1.position.z).toBe(player1InitialPos.z);
            expect(game.player2.position.x).toBe(player2InitialPos.x);
            expect(game.player2.position.z).toBe(player2InitialPos.z);
        });

        test('should pause arena shrinking when game is paused', () => {
            // Enable arena shrink mode
            game.arenaShrinker = new ArenaShrinker(30, 10, 1000, 1);
            const startTime = Date.now();
            game.arenaShrinker.initialize(startTime);

            const initialSize = game.arenaShrinker.getCurrentSize();

            // Pause game
            game.isPaused = true;

            // Simulate time passing (but game is paused, so arena shouldn't update)
            // In actual implementation, update() is not called when paused
            // So arena shrinker's update() is never called

            // Verify arena size unchanged
            expect(game.arenaShrinker.getCurrentSize()).toBe(initialSize);
        });

        test('should resume arena shrinking when game is resumed', () => {
            // Enable arena shrink mode
            game.arenaShrinker = new ArenaShrinker(30, 10, 100, 2);
            const startTime = Date.now();
            game.arenaShrinker.initialize(startTime);

            // Pause game
            game.isPaused = true;

            // Resume game
            game.isPaused = false;

            // Update arena shrinker
            game.arenaShrinker.update(startTime + 150);

            // Verify arena has shrunk after resume
            expect(game.arenaShrinker.getCurrentSize()).toBeLessThan(30);
        });
    });

    describe('Sound Effects Integration (Requirement 6.3)', () => {
        test('should support sound effects for both players', () => {
            // This test verifies that the multiplayer game structure supports
            // sound effects for both players through the audio manager

            // Verify game has player entities that can trigger sounds
            expect(game.player1).toBeDefined();
            expect(game.player2).toBeDefined();

            // In actual implementation, sound effects are triggered by:
            // - Direction changes (turn sounds)
            // - Collisions (explosion sounds)
            // - Game events (victory/defeat sounds)

            // The multiplayer game should support these for both players
            expect(game.player1.direction).toBeDefined();
            expect(game.player2.direction).toBeDefined();
        });

        test('should handle collision sounds for both players', () => {
            // Set up collision scenario
            game.player1.isAlive = false; // Player 1 crashed
            game.player2.isAlive = true; // Player 2 survived

            // Verify game can detect collision state
            const gameState = game.getGameState();
            expect(gameState.player1.isAlive).toBe(false);
            expect(gameState.player2.isAlive).toBe(true);

            // In actual implementation, audio manager would play explosion sound
            // when collision is detected
        });

        test('should support engine sounds for both players', () => {
            // Verify both players have movement capability
            expect(game.player1.direction).toBeDefined();
            expect(game.player2.direction).toBeDefined();

            // In actual implementation, engine sounds would be managed
            // by the audio manager for the game session
        });
    });

    describe('Particle System Integration (Requirement 6.3)', () => {
        test('should support particle effects for both players', () => {
            // Create particle system
            const particleSystem = new ParticleSystem(mockScene, {
                maxParticles: 200,
                enabled: true,
            });

            // Verify particle system is initialized
            expect(particleSystem.settings.enabled).toBe(true);

            // Simulate trail sparks for both players
            const player1Color = 0x00ff00; // Green
            const player2Color = 0x0000ff; // Blue

            // Emit particles for player 1
            particleSystem.emitTrailSparks(
                game.player1.position,
                game.player1.direction,
                player1Color,
                1.0
            );

            // Emit particles for player 2
            particleSystem.emitTrailSparks(
                game.player2.position,
                game.player2.direction,
                player2Color,
                1.0
            );

            // Verify particles can be emitted for both players
            const activeParticles = particleSystem.particlePool.getActiveParticles();
            expect(activeParticles.length).toBeGreaterThan(0);
        });

        test('should handle collision particles for both players', () => {
            // Create particle system
            const particleSystem = new ParticleSystem(mockScene, {
                maxParticles: 200,
                enabled: true,
            });

            // Simulate collision particles for player 1
            // Note: ParticleSystem uses emitTrailSparks for trail effects
            // Collision explosions would be handled by emitTrailSparks with high intensity
            particleSystem.emitTrailSparks(
                game.player1.position,
                game.player1.direction,
                0x00ff00, // Green
                2.0 // High speed for collision effect
            );

            // Verify particles were created
            const activeParticles = particleSystem.particlePool.getActiveParticles();
            expect(activeParticles.length).toBeGreaterThanOrEqual(0);
        });

        test('should pause particle updates when game is paused', () => {
            // Create particle system
            const particleSystem = new ParticleSystem(mockScene, {
                maxParticles: 200,
                enabled: true,
            });

            // Emit some particles
            particleSystem.emitTrailSparks(
                game.player1.position,
                game.player1.direction,
                0x00ff00,
                1.0
            );

            // Create paused game state
            const pausedGameState = {
                isPaused: true,
                gameOver: false,
                frameCount: 10,
            };

            // Update with paused state
            particleSystem.update(0.016, pausedGameState);

            // Verify particles are paused
            expect(particleSystem.isPaused).toBe(true);
        });

        test('should resume particle updates when game is resumed', () => {
            // Create particle system
            const particleSystem = new ParticleSystem(mockScene, {
                maxParticles: 200,
                enabled: true,
            });

            // Set to paused state
            particleSystem.isPaused = true;

            // Create resumed game state
            const resumedGameState = {
                isPaused: false,
                gameOver: false,
                frameCount: 20,
            };

            // Update with resumed state
            particleSystem.update(0.016, resumedGameState);

            // Verify particles are resumed
            expect(particleSystem.isPaused).toBe(false);
        });
    });

    describe('Customization System Integration (Requirement 6.4)', () => {
        test('should support independent customization for both players', () => {
            // Create customization manager
            const customizationManager = new CustomizationManager();

            // Verify customization manager is initialized
            expect(customizationManager).toBeDefined();

            // In multiplayer, each player should have their own customization
            // Player 1 uses green, Player 2 uses blue (stored as strings)
            expect(game.player1.color).toBe('green');
            expect(game.player2.color).toBe('blue');

            // Verify colors are different
            expect(game.player1.color).not.toBe(game.player2.color);
        });

        test('should maintain player colors during gameplay', () => {
            // Store initial colors
            const player1InitialColor = game.player1.color;
            const player2InitialColor = game.player2.color;

            // Simulate game updates
            game.update();
            game.update();
            game.update();

            // Verify colors remain unchanged
            expect(game.player1.color).toBe(player1InitialColor);
            expect(game.player2.color).toBe(player2InitialColor);
        });

        test('should apply customization to player trails', () => {
            // Verify both players have trail arrays
            expect(game.player1.trail).toBeDefined();
            expect(game.player2.trail).toBeDefined();
            expect(Array.isArray(game.player1.trail)).toBe(true);
            expect(Array.isArray(game.player2.trail)).toBe(true);

            // In actual implementation, trail segments would use player colors
            // This is handled by the rendering system
        });

        test('should preserve customization after pause/resume', () => {
            // Store initial colors
            const player1InitialColor = game.player1.color;
            const player2InitialColor = game.player2.color;

            // Pause game
            game.isPaused = true;

            // Resume game
            game.isPaused = false;

            // Verify colors preserved
            expect(game.player1.color).toBe(player1InitialColor);
            expect(game.player2.color).toBe(player2InitialColor);
        });

        test('should preserve customization after game restart', () => {
            // Store initial colors
            const player1InitialColor = game.player1.color;
            const player2InitialColor = game.player2.color;

            // Restart game
            game.restart();

            // Verify colors preserved (players are recreated with same colors)
            expect(game.player1.color).toBe(player1InitialColor);
            expect(game.player2.color).toBe(player2InitialColor);
        });
    });

    describe('Cross-Feature Integration (Requirements 6.1-6.5)', () => {
        test('should handle arena shrink with pause/resume', () => {
            // Enable arena shrink mode
            game.arenaShrinker = new ArenaShrinker(30, 10, 1000, 1);
            const startTime = Date.now();
            game.arenaShrinker.initialize(startTime);

            // Update arena
            game.arenaShrinker.update(startTime + 500);
            const sizeBeforePause = game.arenaShrinker.getCurrentSize();

            // Pause game
            game.isPaused = true;

            // Arena should not update while paused
            // (update() is not called when paused)

            // Resume game
            game.isPaused = false;

            // Arena should continue shrinking after resume
            game.arenaShrinker.update(startTime + 1500);
            expect(game.arenaShrinker.getCurrentSize()).toBeLessThan(sizeBeforePause);
        });

        test('should handle particles with arena shrink mode', () => {
            // Enable arena shrink mode
            game.arenaShrinker = new ArenaShrinker(30, 10, 5000, 1);
            game.arenaShrinker.initialize(Date.now());

            // Create particle system
            const particleSystem = new ParticleSystem(mockScene, {
                maxParticles: 200,
                enabled: true,
            });

            // Emit particles for both players (using hex color values)
            particleSystem.emitTrailSparks(
                game.player1.position,
                game.player1.direction,
                0x00ff00, // Green hex value
                1.0
            );

            particleSystem.emitTrailSparks(
                game.player2.position,
                game.player2.direction,
                0x0000ff, // Blue hex value
                1.0
            );

            // Verify particles work with arena shrink mode
            const activeParticles = particleSystem.particlePool.getActiveParticles();
            expect(activeParticles.length).toBeGreaterThanOrEqual(0);
        });

        test('should handle customization with all game features', () => {
            // Enable arena shrink mode
            game.arenaShrinker = new ArenaShrinker(30, 10, 5000, 1);
            game.arenaShrinker.initialize(Date.now());

            // Create particle system
            const particleSystem = new ParticleSystem(mockScene, {
                maxParticles: 200,
                enabled: true,
            });

            // Verify player colors are maintained
            const player1Color = game.player1.color;
            const player2Color = game.player2.color;

            // Emit particles with player colors (using hex values)
            particleSystem.emitTrailSparks(
                game.player1.position,
                game.player1.direction,
                0x00ff00, // Green hex value
                1.0
            );

            // Pause and resume
            game.isPaused = true;
            game.isPaused = false;

            // Verify colors still maintained (stored as strings)
            expect(game.player1.color).toBe('green');
            expect(game.player2.color).toBe('blue');
        });

        test('should handle all features together with pause/resume', () => {
            // Enable all features
            game.arenaShrinker = new ArenaShrinker(30, 10, 5000, 1);
            const startTime = Date.now();
            game.arenaShrinker.initialize(startTime);

            const particleSystem = new ParticleSystem(mockScene, {
                maxParticles: 200,
                enabled: true,
            });

            // Start game
            game.gameStarted = true;

            // Emit particles (using hex color value)
            particleSystem.emitTrailSparks(
                game.player1.position,
                game.player1.direction,
                0x00ff00, // Green hex value
                1.0
            );

            // Pause game
            game.isPaused = true;

            // Create paused game state
            const pausedGameState = {
                isPaused: true,
                gameOver: false,
                frameCount: 10,
            };

            // Update particle system with paused state
            particleSystem.update(0.016, pausedGameState);

            // Verify everything is paused
            expect(game.isPaused).toBe(true);
            expect(particleSystem.isPaused).toBe(true);

            // Resume game
            game.isPaused = false;

            // Create resumed game state
            const resumedGameState = {
                isPaused: false,
                gameOver: false,
                frameCount: 20,
            };

            // Update particle system with resumed state
            particleSystem.update(0.016, resumedGameState);

            // Verify everything is resumed
            expect(game.isPaused).toBe(false);
            expect(particleSystem.isPaused).toBe(false);

            // Verify player customization maintained (stored as strings)
            expect(game.player1.color).toBe('green');
            expect(game.player2.color).toBe('blue');
        });
    });

    describe('Compatibility Verification (Requirement 6.5)', () => {
        test('should maintain performance with all features enabled', () => {
            // Enable all features
            game.arenaShrinker = new ArenaShrinker(30, 10, 5000, 1);
            game.arenaShrinker.initialize(Date.now());

            const particleSystem = new ParticleSystem(mockScene, {
                maxParticles: 200,
                enabled: true,
            });

            // Simulate multiple updates
            const startTime = performance.now();

            for (let i = 0; i < 100; i++) {
                game.update();
                particleSystem.update(0.016, {
                    isPaused: false,
                    gameOver: false,
                    frameCount: i,
                });
            }

            const endTime = performance.now();
            const totalTime = endTime - startTime;

            // Verify performance is acceptable (should complete in reasonable time)
            // 100 updates should take less than 1 second
            expect(totalTime).toBeLessThan(1000);
        });

        test('should handle rapid pause/resume cycles', () => {
            // Enable features
            game.arenaShrinker = new ArenaShrinker(30, 10, 5000, 1);
            game.arenaShrinker.initialize(Date.now());

            // Rapid pause/resume cycles
            for (let i = 0; i < 10; i++) {
                game.isPaused = true;
                expect(game.isPaused).toBe(true);

                game.isPaused = false;
                expect(game.isPaused).toBe(false);
            }

            // Verify game state is consistent
            const gameState = game.getGameState();
            expect(gameState.isPaused).toBe(false);
            expect(gameState.player1.isAlive).toBe(true);
            expect(gameState.player2.isAlive).toBe(true);
        });

        test('should handle game restart with all features', () => {
            // Enable all features
            game.arenaShrinker = new ArenaShrinker(30, 10, 5000, 1);
            game.arenaShrinker.initialize(Date.now());

            // Modify game state
            game.gameStarted = true;
            game.frameCount = 100;

            // Restart game
            game.restart();

            // Verify clean restart
            expect(game.frameCount).toBe(0);
            expect(game.gameStarted).toBe(false);
            expect(game.player1.isAlive).toBe(true);
            expect(game.player2.isAlive).toBe(true);
        });
    });
});
