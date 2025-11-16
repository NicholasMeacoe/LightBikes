/**
 * Integration tests for ParticleSystem
 * Tests Three.js scene integration, game loop integration, rendering pipeline, and settings persistence
 */

// Mock Three.js for testing environment
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
    Scene: class {
        constructor() {
            this.background = null;
            this.children = [];
        }
        add(object) {
            this.children.push(object);
        }
        remove(object) {
            const index = this.children.indexOf(object);
            if (index > -1) {
                this.children.splice(index, 1);
            }
        }
    },
    PerspectiveCamera: class {
        constructor(fov, aspect, near, far) {
            this.fov = fov;
            this.aspect = aspect;
            this.near = near;
            this.far = far;
            this.position = new mockThree.Vector3();
        }
        set(x, y, z) {
            this.position.set(x, y, z);
        }
        lookAt(target) {
            // Mock implementation
        }
    },
    WebGLRenderer: class {
        constructor() {
            this.domElement = document.createElement('canvas');
        }
        setSize(width, height) {
            this.domElement.width = width;
            this.domElement.height = height;
        }
        render(scene, camera) {
            // Mock implementation
        }
    },
    AmbientLight: class {
        constructor(color, intensity) {
            this.color = color;
            this.intensity = intensity;
        }
    },
    DirectionalLight: class {
        constructor(color, intensity) {
            this.color = color;
            this.intensity = intensity;
            this.position = new mockThree.Vector3();
        }
    },
    GridHelper: class {
        constructor(size, divisions) {
            this.size = size;
            this.divisions = divisions;
        }
    },
    BoxHelper: class {
        constructor(object) {
            this.object = object;
        }
    },
    BoxGeometry: class {
        constructor(width, height, depth) {
            this.width = width;
            this.height = height;
            this.depth = depth;
        }
        dispose() {}
    },
    MeshLambertMaterial: class {
        constructor(params) {
            this.color = params.color;
            this.transparent = params.transparent;
            this.opacity = params.opacity;
        }
        dispose() {}
    },
    Mesh: class {
        constructor(geometry, material) {
            this.geometry = geometry;
            this.material = material;
            this.position = new mockThree.Vector3();
            this.visible = true;
        }
    },
    BufferGeometry: class {
        constructor() {
            this.attributes = {};
            this.drawRange = { start: 0, count: 0 };
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
            this.needsUpdate = false;
            this.count = array.length / itemSize;
        }
    },
    Float32BufferAttribute: class {
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
            this.vertexShader = params.vertexShader || '';
            this.fragmentShader = params.fragmentShader || '';
            this.blending = params.blending;
            this.depthTest = params.depthTest;
            this.transparent = params.transparent;
            this.vertexColors = params.vertexColors;
            this.needsUpdate = false;
            this.side = params.side;
            this.depthWrite = params.depthWrite;
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
    Texture: class {
        constructor(canvas) {
            this.needsUpdate = false;
            this.wrapS = null;
            this.wrapT = null;
            this.minFilter = null;
            this.magFilter = null;
            this.format = null;
            this.generateMipmaps = false;
        }
        dispose() {}
    },
    LineBasicMaterial: class {
        constructor(params) {
            this.color = params.color;
            this.linewidth = params.linewidth;
            this.transparent = params.transparent;
            this.opacity = params.opacity;
        }
        dispose() {}
    },
    LineSegments: class {
        constructor(geometry, material) {
            this.geometry = geometry;
            this.material = material;
        }
    },
    Quaternion: class {
        constructor() {}
        setFromEuler(euler) {
            return this;
        }
    },
    Euler: class {
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
    },
    Matrix4: class {
        constructor() {}
        compose(position, quaternion, scale) {
            return this;
        }
        makeScale(x, y, z) {
            return this;
        }
    },
    SphereGeometry: class {
        constructor(radius, widthSegments, heightSegments) {
            this.radius = radius;
            this.widthSegments = widthSegments;
            this.heightSegments = heightSegments;
        }
        dispose() {}
    },
    MeshBasicMaterial: class {
        constructor(params) {
            this.color = params.color;
            this.transparent = params.transparent;
            this.opacity = params.opacity;
        }
        dispose() {}
    },
    InstancedMesh: class {
        constructor(geometry, material, count) {
            this.geometry = geometry;
            this.material = material;
            this.count = count;
            this.instanceMatrix = { needsUpdate: false };
        }
        setMatrixAt(index, matrix) {
            // Mock implementation
        }
    },
    AdditiveBlending: 'additive',
    ClampToEdgeWrapping: 'clamp',
    LinearFilter: 'linear',
    RGBAFormat: 'rgba',
    DoubleSide: 'double'
};

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
                                addColorStop: (offset, color) => {}
                            }),
                            fillRect: (x, y, width, height) => {},
                            clearRect: (x, y, width, height) => {},
                            fillStyle: null,
                            globalAlpha: 1,
                            fill: () => {},
                            beginPath: () => {},
                            arc: () => {},
                            closePath: () => {}
                        };
                    }
                    return null;
                }
            };
        }
        return {};
    }
};

// Mock localStorage for settings persistence tests
const mockLocalStorage = {
    store: {},
    getItem: function(key) {
        return this.store[key] || null;
    },
    setItem: function(key, value) {
        this.store[key] = value;
    },
    removeItem: function(key) {
        delete this.store[key];
    },
    clear: function() {
        this.store = {};
    }
};

// Setup global mocks
global.THREE = mockThree;
global.localStorage = mockLocalStorage;

const { ParticleSystem } = require('./ParticleSystem.js');
const { RenderingEngine } = require('./renderer.js');
const { Game } = require('./game.js');
const { ParticleSettingsUI } = require('./ParticleSettingsUI.js');

describe('ParticleSystem Integration Tests', () => {
    let mockScene;
    let particleSystem;
    let renderingEngine;
    let game;
    let particleSettingsUI;

    beforeEach(() => {
        // Clear localStorage
        mockLocalStorage.clear();
        
        // Create mock scene with tracking
        mockScene = {
            add: jest.fn(),
            remove: jest.fn(),
            addedObjects: [],
            removedObjects: []
        };
        
        // Track scene operations
        mockScene.add.mockImplementation((object) => {
            mockScene.addedObjects.push(object);
        });
        mockScene.remove.mockImplementation((object) => {
            mockScene.removedObjects.push(object);
        });

        // Initialize components
        particleSystem = new ParticleSystem(mockScene, {
            maxParticles: 100,
            enabled: true,
            quality: 'medium'
        });

        game = new Game();
        renderingEngine = new RenderingEngine(30); // 30x30 bounds
        particleSettingsUI = new ParticleSettingsUI();
    });

    afterEach(() => {
        if (particleSystem) {
            particleSystem.dispose();
        }
        if (particleSettingsUI) {
            particleSettingsUI.dispose();
        }
    });

    describe('Three.js Scene Integration', () => {
        it('should properly integrate with Three.js scene during initialization', () => {
            // Verify particle system was added to scene
            expect(mockScene.add).toHaveBeenCalledTimes(1);
            expect(mockScene.addedObjects).toHaveLength(1);
            
            const addedObject = mockScene.addedObjects[0];
            expect(addedObject).toBeInstanceOf(mockThree.Points);
            expect(addedObject.geometry).toBeInstanceOf(mockThree.BufferGeometry);
            expect(addedObject.material).toBeInstanceOf(mockThree.ShaderMaterial);
        });

        it('should create proper buffer attributes for particle rendering', () => {
            const addedObject = mockScene.addedObjects[0];
            const geometry = addedObject.geometry;
            
            // Verify all required buffer attributes exist
            expect(geometry.attributes.position).toBeInstanceOf(mockThree.BufferAttribute);
            expect(geometry.attributes.color).toBeInstanceOf(mockThree.BufferAttribute);
            expect(geometry.attributes.size).toBeInstanceOf(mockThree.BufferAttribute);
            expect(geometry.attributes.alpha).toBeInstanceOf(mockThree.BufferAttribute);
            
            // Verify buffer sizes match maxParticles setting
            expect(geometry.attributes.position.array.length).toBe(100 * 3); // x,y,z per particle
            expect(geometry.attributes.color.array.length).toBe(100 * 3); // r,g,b per particle
            expect(geometry.attributes.size.array.length).toBe(100); // size per particle
            expect(geometry.attributes.alpha.array.length).toBe(100); // alpha per particle
        });

        it('should update buffer attributes when particles are active', () => {
            const gameState = {
                isPaused: false,
                frameCount: 1,
                gameOver: false
            };

            // Create some particles
            particleSystem.emitTrailSparks(
                { x: 1, y: 0, z: 1 },
                { x: 0.1, y: 0, z: 0 },
                0x00ff00,
                0.1
            );

            // Update particle system
            particleSystem.update(0.016, gameState);

            // Verify buffer attributes were marked for update
            const geometry = mockScene.addedObjects[0].geometry;
            expect(geometry.attributes.position.needsUpdate).toBe(true);
            expect(geometry.attributes.color.needsUpdate).toBe(true);
            expect(geometry.attributes.size.needsUpdate).toBe(true);
            expect(geometry.attributes.alpha.needsUpdate).toBe(true);
        });

        it('should properly set draw range based on active particles', () => {
            const gameState = {
                isPaused: false,
                frameCount: 1,
                gameOver: false
            };

            // Create 3 particles
            for (let i = 0; i < 3; i++) {
                particleSystem.emitTrailSparks(
                    { x: i, y: 0, z: 0 },
                    { x: 0.1, y: 0, z: 0 },
                    0x00ff00,
                    0.1
                );
            }

            // Update particle system
            particleSystem.update(0.016, gameState);

            // Verify draw range is set correctly
            const geometry = mockScene.addedObjects[0].geometry;
            expect(geometry.drawRange.start).toBe(0);
            expect(geometry.drawRange.count).toBe(3);
        });

        it('should handle scene removal during disposal', () => {
            const addedObject = mockScene.addedObjects[0];
            
            // Dispose particle system
            particleSystem.dispose();
            
            // Verify object was removed from scene
            expect(mockScene.remove).toHaveBeenCalledWith(addedObject);
            expect(mockScene.removedObjects).toContain(addedObject);
        });

        it('should properly configure shader material for particle rendering', () => {
            const addedObject = mockScene.addedObjects[0];
            const material = addedObject.material;
            
            // Verify shader material configuration
            expect(material.uniforms.pointTexture).toBeDefined();
            expect(material.uniforms.time).toBeDefined();
            expect(material.vertexShader).toContain('attribute float size');
            expect(material.vertexShader).toContain('attribute float alpha');
            expect(material.fragmentShader).toContain('uniform sampler2D pointTexture');
            expect(material.blending).toBe('additive');
            expect(material.transparent).toBe(true);
            expect(material.vertexColors).toBe(true);
        });
    });

    describe('Game Loop Integration', () => {
        it('should integrate with game update cycle and respond to game state changes', () => {
            const gameState = {
                isPaused: false,
                frameCount: 1,
                gameOver: false,
                player: { x: 5, y: 0, z: 5 },
                playerDirection: { x: 1, y: 0, z: 0 }
            };

            // Update particle system multiple times
            for (let i = 0; i < 5; i++) {
                particleSystem.update(0.016, gameState);
                gameState.frameCount++;
            }

            // Verify system processed updates
            expect(particleSystem.frameCount).toBe(5);
            expect(particleSystem.lastUpdateTime).toBeGreaterThan(0);
        });

        it('should respond to pause state changes immediately', () => {
            const gameState = {
                isPaused: false,
                frameCount: 1,
                gameOver: false
            };

            // Create particles during normal gameplay
            particleSystem.emitTrailSparks(
                { x: 0, y: 0, z: 0 },
                { x: 0.1, y: 0, z: 0 },
                0x00ff00,
                0.1
            );

            // Update normally
            particleSystem.update(0.016, gameState);
            expect(particleSystem.isPaused).toBe(false);

            // Pause the game
            gameState.isPaused = true;
            particleSystem.update(0.016, gameState);
            
            // Verify pause state was handled
            expect(particleSystem.isPaused).toBe(true);
            expect(particleSystem.settings.effects.trailSparks).toBe(false); // Should disable new emissions

            // Resume the game
            gameState.isPaused = false;
            particleSystem.update(0.016, gameState);
            
            // Verify resume state was handled
            expect(particleSystem.isPaused).toBe(false);
            expect(particleSystem.settings.effects.trailSparks).toBe(true); // Should restore emissions
        });

        it('should handle game restart events correctly', () => {
            const gameState = {
                isPaused: false,
                frameCount: 10,
                gameOver: false
            };

            // Create particles and update
            particleSystem.emitTrailSparks(
                { x: 0, y: 0, z: 0 },
                { x: 0.1, y: 0, z: 0 },
                0x00ff00,
                0.1
            );
            particleSystem.update(0.016, gameState);
            
            const activeCountBeforeRestart = particleSystem.getActiveParticleCount();
            expect(activeCountBeforeRestart).toBeGreaterThan(0);

            // Simulate game restart (frameCount resets to 0)
            gameState.frameCount = 0;
            particleSystem.update(0.016, gameState);

            // Verify restart was handled
            expect(particleSystem.getActiveParticleCount()).toBe(0);
            expect(particleSystem.frameCount).toBe(0);
            expect(particleSystem.degradationLevel).toBe(0);
        });

        it('should trigger particle effects in response to game events', () => {
            const gameState = {
                isPaused: false,
                frameCount: 1,
                gameOver: false
            };

            // Test trail spark emission
            const initialCount = particleSystem.getActiveParticleCount();
            particleSystem.emitTrailSparks(
                { x: 0, y: 0, z: 0 },
                { x: 0.1, y: 0, z: 0 },
                0x00ff00,
                0.1
            );
            expect(particleSystem.getActiveParticleCount()).toBeGreaterThan(initialCount);

            // Test explosion effect
            const countAfterSparks = particleSystem.getActiveParticleCount();
            particleSystem.createExplosion({ x: 5, y: 0, z: 5 }, 1.0);
            expect(particleSystem.getActiveParticleCount()).toBeGreaterThan(countAfterSparks);

            // Test collection effect
            const countAfterExplosion = particleSystem.getActiveParticleCount();
            particleSystem.createCollectionEffect({ x: 10, y: 0, z: 10 }, 'SPEED_BOOST');
            expect(particleSystem.getActiveParticleCount()).toBeGreaterThan(countAfterExplosion);
        });

        it('should maintain performance monitoring during game loop integration', () => {
            const gameState = {
                isPaused: false,
                frameCount: 1,
                gameOver: false
            };

            // Update multiple times to build performance history
            for (let i = 0; i < 10; i++) {
                particleSystem.update(0.016, gameState);
                gameState.frameCount++;
            }

            // Verify performance monitoring is active
            const performanceStatus = particleSystem.getPerformanceStatus();
            expect(performanceStatus.currentFPS).toBeGreaterThan(0);
            expect(performanceStatus.averageFPS).toBeGreaterThan(0);
            expect(performanceStatus.adaptiveQualityEnabled).toBe(true);
        });

        it('should handle game over state transitions', () => {
            const gameState = {
                isPaused: false,
                frameCount: 1,
                gameOver: false
            };

            // Create particles during normal gameplay
            particleSystem.emitTrailSparks(
                { x: 0, y: 0, z: 0 },
                { x: 0.1, y: 0, z: 0 },
                0x00ff00,
                0.1
            );
            particleSystem.update(0.016, gameState);

            // Transition to game over
            gameState.gameOver = true;
            particleSystem.update(0.016, gameState);

            // Verify game over handling
            expect(particleSystem.gameOverHandled).toBe(true);
            expect(particleSystem.settings.effects.trailSparks).toBe(false); // Should stop new emissions
        });
    });

    describe('Rendering Pipeline Integration', () => {
        it('should integrate with RenderingEngine without breaking existing visuals', () => {
            // Initialize particle system with rendering engine
            renderingEngine.initializeParticleSystem(ParticleSystem, {
                maxParticles: 50,
                enabled: true,
                quality: 'medium'
            });

            // Verify particle system was created
            expect(renderingEngine.particleSystem).toBeInstanceOf(ParticleSystem);
            expect(renderingEngine.particleSystemEnabled).toBe(true);

            // Verify rendering engine scene integration
            const particleSystem = renderingEngine.particleSystem;
            expect(particleSystem.scene).toBe(renderingEngine.scene);
        });

        it('should emit trail sparks during entity movement without affecting other rendering', () => {
            renderingEngine.initializeParticleSystem(ParticleSystem, {
                maxParticles: 50,
                enabled: true
            });

            const gameState = {
                isPaused: false,
                frameCount: 1,
                gameOver: false,
                player: { x: 5, y: 0, z: 5 },
                playerDirection: { x: 1, y: 0, z: 0 },
                gameSpeed: 0.1,
                aiOpponents: [{
                    id: 'ai_1',
                    x: 10,
                    y: 0,
                    z: 10,
                    direction: { x: 0, y: 0, z: 1 },
                    color: 'red',
                    alive: true
                }]
            };

            // Update rendering engine (which should update particle system)
            renderingEngine.updateIntegratedParticleSystem(gameState);

            // Verify particles were created for moving entities
            const particleCount = renderingEngine.particleSystem.getActiveParticleCount();
            expect(particleCount).toBeGreaterThan(0);
        });

        it('should handle explosion effects during collision events', () => {
            renderingEngine.initializeParticleSystem(ParticleSystem, {
                maxParticles: 100,
                enabled: true
            });

            const explosionPosition = { x: 15, y: 0, z: 15 };
            const initialCount = renderingEngine.particleSystem.getActiveParticleCount();

            // Trigger explosion effect
            renderingEngine.createExplosionEffect(explosionPosition, 1.0);

            // Verify explosion particles were created
            const finalCount = renderingEngine.particleSystem.getActiveParticleCount();
            expect(finalCount).toBeGreaterThan(initialCount);

            // Verify particles have explosion properties
            const activeParticles = renderingEngine.particleSystem.particlePool.getActiveParticles();
            const explosionParticles = activeParticles.filter(p => p.type === 'explosion');
            expect(explosionParticles.length).toBeGreaterThan(0);
        });

        it('should handle collection effects during power-up collection', () => {
            renderingEngine.initializeParticleSystem(ParticleSystem, {
                maxParticles: 100,
                enabled: true
            });

            const collectionPosition = { x: 20, y: 0, z: 20 };
            const initialCount = renderingEngine.particleSystem.getActiveParticleCount();

            // Trigger collection effect
            renderingEngine.createCollectionEffect(collectionPosition, 'SPEED_BOOST');

            // Verify collection particles were created
            const finalCount = renderingEngine.particleSystem.getActiveParticleCount();
            expect(finalCount).toBeGreaterThan(initialCount);

            // Verify particles have collection properties
            const activeParticles = renderingEngine.particleSystem.particlePool.getActiveParticles();
            const collectionParticles = activeParticles.filter(p => p.type === 'collection');
            expect(collectionParticles.length).toBeGreaterThan(0);
        });

        it('should maintain rendering performance with particle system enabled', () => {
            renderingEngine.initializeParticleSystem(ParticleSystem, {
                maxParticles: 200,
                enabled: true,
                quality: 'high'
            });

            const gameState = {
                isPaused: false,
                frameCount: 1,
                gameOver: false,
                player: { x: 0, y: 0, z: 0 },
                playerDirection: { x: 1, y: 0, z: 0 },
                gameSpeed: 0.1
            };

            // Create many particles to test performance
            for (let i = 0; i < 10; i++) {
                renderingEngine.createExplosionEffect({ x: i * 2, y: 0, z: i * 2 }, 1.0);
            }

            // Update multiple times
            const startTime = Date.now();
            for (let i = 0; i < 60; i++) { // Simulate 1 second at 60fps
                renderingEngine.updateIntegratedParticleSystem(gameState);
                gameState.frameCount++;
            }
            const endTime = Date.now();

            // Should complete quickly (less than 100ms for 60 updates)
            const duration = endTime - startTime;
            expect(duration).toBeLessThan(100);

            // Verify performance monitoring is working
            const performanceStatus = renderingEngine.particleSystem.getPerformanceStatus();
            expect(performanceStatus.currentFPS).toBeGreaterThan(0);
        });

        it('should handle particle system disable/enable without breaking rendering', () => {
            renderingEngine.initializeParticleSystem(ParticleSystem, {
                maxParticles: 50,
                enabled: true
            });

            // Create some particles
            renderingEngine.createExplosionEffect({ x: 0, y: 0, z: 0 }, 1.0);
            expect(renderingEngine.particleSystem.getActiveParticleCount()).toBeGreaterThan(0);

            // Disable particle system
            renderingEngine.setParticleSystemEnabled(false);
            expect(renderingEngine.particleSystemEnabled).toBe(false);
            expect(renderingEngine.particleSystem.getActiveParticleCount()).toBe(0);

            // Re-enable particle system
            renderingEngine.setParticleSystemEnabled(true);
            expect(renderingEngine.particleSystemEnabled).toBe(true);

            // Verify it works after re-enabling
            renderingEngine.createExplosionEffect({ x: 5, y: 0, z: 5 }, 1.0);
            expect(renderingEngine.particleSystem.getActiveParticleCount()).toBeGreaterThan(0);
        });
    });

    describe('Settings Persistence and Immediate Application', () => {
        it('should persist particle settings to localStorage', () => {
            // Change settings through the ParticleSettings instance
            const particleSettings = particleSettingsUI.getParticleSettings();
            particleSettings.updateSettings({
                enabled: false,
                quality: 'high',
                effects: { trailSparks: false }
            });

            // Verify settings were persisted
            const stored = localStorage.getItem('lightbikes_particle_settings');
            expect(stored).toBeTruthy();
            
            const settings = JSON.parse(stored);
            expect(settings.enabled).toBe(false);
            expect(settings.quality).toBe('high');
            expect(settings.effects.trailSparks).toBe(false);
        });

        it('should load persisted settings on initialization', () => {
            // Store settings in localStorage
            const testSettings = {
                enabled: false,
                quality: 'low',
                effects: {
                    trailSparks: false,
                    explosions: true,
                    collections: false
                },
                performance: {
                    maxParticles: 50,
                    adaptiveQuality: false
                }
            };
            localStorage.setItem('lightbikes_particle_settings', JSON.stringify(testSettings));

            // Create new settings UI to test loading
            const newSettingsUI = new ParticleSettingsUI();
            const loadedSettings = newSettingsUI.getParticleSystemSettings();

            expect(loadedSettings.enabled).toBe(false);
            expect(loadedSettings.quality).toBe('low');
            expect(loadedSettings.effects.trailSparks).toBe(false);
            expect(loadedSettings.effects.explosions).toBe(true);
            expect(loadedSettings.effects.collections).toBe(false);
            expect(loadedSettings.maxParticles).toBe(50);

            newSettingsUI.dispose();
        });

        it('should apply settings changes immediately to particle system', () => {
            renderingEngine.initializeParticleSystem(ParticleSystem, {
                maxParticles: 100,
                enabled: true,
                quality: 'medium'
            });

            const particleSystem = renderingEngine.particleSystem;
            
            // Verify initial settings
            expect(particleSystem.getSettings().enabled).toBe(true);
            expect(particleSystem.getSettings().quality).toBe('medium');
            expect(particleSystem.getSettings().effects.trailSparks).toBe(true);

            // Simulate settings change through UI integration
            particleSettingsUI.addExternalListener((path, value) => {
                if (path === 'enabled') {
                    particleSystem.setEnabled(value);
                } else if (path === 'quality') {
                    particleSystem.setQualityLevel(value);
                } else if (path.startsWith('effects.')) {
                    const effectType = path.split('.')[1];
                    particleSystem.setEffectEnabled(effectType, value);
                }
            });

            // Change settings through ParticleSettings
            const particleSettings = particleSettingsUI.getParticleSettings();
            
            particleSettings.updateSettings({ enabled: false });
            particleSettingsUI.notifyExternalListeners('enabled', false);
            expect(particleSystem.getSettings().enabled).toBe(false);

            particleSettings.updateSettings({ quality: 'high' });
            particleSettingsUI.notifyExternalListeners('quality', 'high');
            expect(particleSystem.getSettings().quality).toBe('high');

            particleSettings.updateSettings({ effects: { trailSparks: false } });
            particleSettingsUI.notifyExternalListeners('effects.trailSparks', false);
            expect(particleSystem.getSettings().effects.trailSparks).toBe(false);
        });

        it('should handle bulk settings updates correctly', () => {
            renderingEngine.initializeParticleSystem(ParticleSystem, {
                maxParticles: 100,
                enabled: true
            });

            const particleSystem = renderingEngine.particleSystem;
            let reinitializeCalled = false;

            // Mock reinitialize method
            renderingEngine.reinitializeParticleSystem = jest.fn(() => {
                reinitializeCalled = true;
            });

            // Set up listener for bulk updates
            particleSettingsUI.addExternalListener((path, value) => {
                if (path === 'bulk' || path === 'reset') {
                    renderingEngine.reinitializeParticleSystem(particleSettingsUI.getParticleSystemSettings());
                }
            });

            // Trigger bulk update
            const particleSettings = particleSettingsUI.getParticleSettings();
            particleSettings.resetToDefaults();
            particleSettingsUI.notifyExternalListeners('reset', true);

            // Verify reinitialize was called
            expect(reinitializeCalled).toBe(true);
            expect(renderingEngine.reinitializeParticleSystem).toHaveBeenCalled();
        });

        it('should handle settings persistence errors gracefully', () => {
            // Mock localStorage to throw errors
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = jest.fn(() => {
                throw new Error('Storage quota exceeded');
            });

            // Settings changes should still work even if persistence fails
            expect(() => {
                const particleSettings = particleSettingsUI.getParticleSettings();
                particleSettings.updateSettings({ enabled: false });
            }).not.toThrow();

            // Verify setting was changed in memory even if not persisted
            const settings = particleSettingsUI.getParticleSystemSettings();
            expect(settings.enabled).toBe(false);

            // Restore localStorage
            localStorage.setItem = originalSetItem;
        });

        it('should validate settings before applying to particle system', () => {
            renderingEngine.initializeParticleSystem(ParticleSystem, {
                maxParticles: 100,
                enabled: true
            });

            const particleSystem = renderingEngine.particleSystem;
            const originalQuality = particleSystem.getSettings().quality;

            // Set up listener with validation
            particleSettingsUI.addExternalListener((path, value) => {
                if (path === 'quality') {
                    // Only apply valid quality levels
                    if (['low', 'medium', 'high'].includes(value)) {
                        particleSystem.setQualityLevel(value);
                    }
                }
            });

            // Try to set invalid quality
            const particleSettings = particleSettingsUI.getParticleSettings();
            particleSettings.updateSettings({ quality: 'invalid' });
            particleSettingsUI.notifyExternalListeners('quality', 'invalid');
            
            // Quality should remain unchanged
            expect(particleSystem.getSettings().quality).toBe(originalQuality);

            // Try to set valid quality
            particleSettings.updateSettings({ quality: 'high' });
            particleSettingsUI.notifyExternalListeners('quality', 'high');
            expect(particleSystem.getSettings().quality).toBe('high');
        });

        it('should maintain settings consistency across system restarts', () => {
            // Set custom settings
            const particleSettings = particleSettingsUI.getParticleSettings();
            particleSettings.updateSettings({
                enabled: false,
                quality: 'low',
                effects: { explosions: false }
            });

            // Initialize particle system with settings
            const settings = particleSettingsUI.getParticleSystemSettings();
            renderingEngine.initializeParticleSystem(ParticleSystem, settings);

            const particleSystem = renderingEngine.particleSystem;
            expect(particleSystem.getSettings().enabled).toBe(false);
            expect(particleSystem.getSettings().quality).toBe('low');
            expect(particleSystem.getSettings().effects.explosions).toBe(false);

            // Restart particle system
            renderingEngine.reinitializeParticleSystem(settings);

            // Verify settings are maintained after restart
            const newParticleSystem = renderingEngine.particleSystem;
            expect(newParticleSystem.getSettings().enabled).toBe(false);
            expect(newParticleSystem.getSettings().quality).toBe('low');
            expect(newParticleSystem.getSettings().effects.explosions).toBe(false);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle Three.js context loss gracefully', () => {
            const addedObject = mockScene.addedObjects[0];
            
            // Simulate context restoration
            expect(() => {
                particleSystem.onContextRestore();
            }).not.toThrow();

            // Verify material and geometry were marked for update
            expect(addedObject.material.needsUpdate).toBe(true);
            expect(addedObject.geometry.attributes.position.needsUpdate).toBe(true);
        });

        it('should handle rendering errors without crashing', () => {
            const gameState = {
                isPaused: false,
                frameCount: 1,
                gameOver: false
            };

            // Mock geometry to throw error during buffer update
            const geometry = mockScene.addedObjects[0].geometry;
            const originalFill = geometry.attributes.position.array.fill;
            geometry.attributes.position.array.fill = jest.fn(() => {
                throw new Error('Buffer update failed');
            });

            // Update should handle error gracefully
            expect(() => {
                particleSystem.update(0.016, gameState);
            }).not.toThrow();

            // Restore original method
            geometry.attributes.position.array.fill = originalFill;
        });

        it('should handle invalid game state gracefully', () => {
            // Test with null game state
            expect(() => {
                particleSystem.update(0.016, null);
            }).not.toThrow();

            // Test with invalid delta time
            expect(() => {
                particleSystem.update(-1, { isPaused: false });
            }).not.toThrow();

            // Test with missing properties
            expect(() => {
                particleSystem.update(0.016, {});
            }).not.toThrow();
        });

        it('should maintain system stability under high particle load', () => {
            const gameState = {
                isPaused: false,
                frameCount: 1,
                gameOver: false
            };

            // Create maximum particles
            for (let i = 0; i < 100; i++) {
                particleSystem.emitTrailSparks(
                    { x: i, y: 0, z: 0 },
                    { x: 0.1, y: 0, z: 0 },
                    0x00ff00,
                    0.1
                );
            }

            // Try to create more particles (should be limited by pool)
            const beforeCount = particleSystem.getActiveParticleCount();
            particleSystem.createExplosion({ x: 0, y: 0, z: 0 }, 1.0);
            const afterCount = particleSystem.getActiveParticleCount();

            // Should not exceed maximum
            expect(afterCount).toBeLessThanOrEqual(100);
            expect(particleSystem.getActiveParticleCount()).toBeLessThanOrEqual(100);

            // System should remain stable
            expect(() => {
                particleSystem.update(0.016, gameState);
            }).not.toThrow();
        });
    });
});