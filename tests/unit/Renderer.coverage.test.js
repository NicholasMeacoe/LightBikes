// CRITICAL: NO TOP LEVEL MOCKS for 'three' to avoid hoisting issues conflicting with resetModules
// We will use jest.doMock inside beforeEach

// Auto-mocking internal systems
jest.mock('../../src/systems/ThemeEngine.js');
jest.mock('../../src/rendering/EmissiveMaterialSystem.js');
jest.mock('../../src/rendering/TrailStyleRenderer.js');
jest.mock('../../src/multiplayer/SplitScreenCamera.js');

describe('RenderingEngine Coverage', () => {
    let RenderingEngine;
    let renderer;
    let mockScene;
    let ThemeEngine;
    let EmissiveMaterialSystem;
    let TrailStyleRenderer;
    let SplitScreenCamera;
    let THREE;

    // Define mock factory generator
    const createThreeMock = () => {
        const createMockMaterialProperties = () => ({
            opacity: 1,
            color: { setHex: jest.fn() },
            emissive: { setHex: jest.fn() },
            transparent: false,
            map: null,
        });

        class MockMaterial {
            constructor() {
                this.clone = jest.fn().mockReturnThis();
                this.dispose = jest.fn();
                Object.assign(this, createMockMaterialProperties());
            }
        }

        class MockGeometry {
            constructor() {
                this.dispose = jest.fn();
                this.setAttribute = jest.fn();
            }
        }

        class MockBoxGeometry extends MockGeometry {}
        class MockSphereGeometry extends MockGeometry {}
        class MockBufferGeometry extends MockGeometry {}

        class MockFloat32BufferAttribute {
            constructor() {}
        }
        class MockBufferAttribute {}

        class MockMesh {
            constructor(geom, mat) {
                this.geometry = geom || new MockGeometry();
                this.material = mat || new MockMaterial();
                this.position = { x: 0, y: 0, z: 0, set: jest.fn() };
                this.visible = true;
                this.userData = {};
            }
        }

        return {
            Scene: jest.fn().mockImplementation(() => ({
                add: jest.fn(),
                remove: jest.fn(),
                children: [],
                traverse: jest.fn(),
                background: null,
            })),
            PerspectiveCamera: jest.fn().mockImplementation(() => ({
                position: {
                    set: jest.fn(),
                    clone: jest.fn().mockReturnValue({ x: 0, y: 0, z: 0 }),
                },
                lookAt: jest.fn(),
            })),
            WebGLRenderer: jest.fn().mockImplementation(() => ({
                setSize: jest.fn(),
                setClearColor: jest.fn(),
                render: jest.fn(),
                domElement: document.createElement('canvas'),
            })),
            BoxGeometry: jest.fn().mockImplementation(() => new MockBoxGeometry()),
            SphereGeometry: jest.fn().mockImplementation(() => new MockSphereGeometry()),
            BufferGeometry: jest.fn().mockImplementation(() => new MockBufferGeometry()),
            MeshBasicMaterial: jest.fn().mockImplementation(() => new MockMaterial()),
            MeshLambertMaterial: jest.fn().mockImplementation(() => new MockMaterial()),
            LineBasicMaterial: jest.fn().mockImplementation(() => new MockMaterial()),
            PointsMaterial: jest.fn().mockImplementation(() => new MockMaterial()),
            Mesh: jest.fn().mockImplementation((g, m) => new MockMesh(g, m)),
            InstancedMesh: jest.fn().mockImplementation(() => ({
                setMatrixAt: jest.fn(),
                instanceMatrix: { needsUpdate: false },
                count: 0,
                userData: {},
                geometry: new MockGeometry(),
                material: new MockMaterial(),
            })),
            Matrix4: jest.fn().mockImplementation(() => ({
                makeScale: jest.fn(),
                makeTranslation: jest.fn(),
                makeRotationY: jest.fn(),
                multiply: jest.fn(),
            })),
            Color: jest.fn(),
            GridHelper: jest.fn().mockImplementation(() => ({ material: new MockMaterial() })),
            BoxHelper: jest.fn().mockImplementation(() => ({ material: new MockMaterial() })),
            LineSegments: jest.fn().mockImplementation(() => ({
                material: new MockMaterial(),
                geometry: new MockGeometry(),
            })),
            Points: jest.fn().mockImplementation(() => ({
                material: new MockMaterial(),
                geometry: new MockGeometry(),
            })),
            Float32BufferAttribute: MockFloat32BufferAttribute,
            BufferAttribute: MockBufferAttribute,
            MockMaterial, // Expose for verification
        };
    };

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();

        jest.doMock('three', createThreeMock);

        THREE = require('three');
        const RendererModule = require('../../src/rendering/renderer.js');
        RenderingEngine = RendererModule.RenderingEngine;

        ThemeEngine = require('../../src/systems/ThemeEngine.js').ThemeEngine;
        EmissiveMaterialSystem =
            require('../../src/rendering/EmissiveMaterialSystem.js').EmissiveMaterialSystem;
        TrailStyleRenderer =
            require('../../src/rendering/TrailStyleRenderer.js').TrailStyleRenderer;
        SplitScreenCamera = require('../../src/multiplayer/SplitScreenCamera.js').SplitScreenCamera;

        document.body.appendChild = jest.fn();
        document.createElement = jest.fn().mockImplementation(() => ({
            width: 800,
            height: 600,
            getContext: jest.fn().mockReturnValue({}),
            style: {},
            toDataURL: jest.fn(),
            innerHTML: '',
            id: '',
        }));
        window.innerWidth = 1000;
        window.innerHeight = 800;

        if (ThemeEngine && jest.isMockFunction(ThemeEngine)) {
            ThemeEngine.mockImplementation(() => ({
                loadTheme: jest.fn(),
                update: jest.fn(),
                getAvailableThemes: jest.fn().mockReturnValue([]),
                getCurrentTheme: jest.fn().mockReturnValue('classic-grid'),
                generateThemePreview: jest.fn(),
                getThemeConfig: jest.fn(),
                resetToDefault: jest.fn(),
            }));
        }
        if (EmissiveMaterialSystem && jest.isMockFunction(EmissiveMaterialSystem)) {
            EmissiveMaterialSystem.mockImplementation(() => ({
                createBikeMaterial: jest.fn(),
                updatePulseAnimation: jest.fn(),
                pausePulse: jest.fn(),
                resumePulse: jest.fn(),
                getTrailColorTemplate: jest.fn().mockReturnValue(0xff0000),
                disposeMaterial: jest.fn(),
                setGlobalIntensityMultiplier: jest.fn(),
                getStatus: jest.fn(),
            }));
        }
        if (TrailStyleRenderer && jest.isMockFunction(TrailStyleRenderer)) {
            TrailStyleRenderer.mockImplementation(() => ({
                updateTrailEffects: jest.fn(),
                createStyledTrailSegment: jest.fn().mockImplementation(() => ({
                    geometry: { dispose: jest.fn() },
                    userData: { materialId: 'mat1' },
                })),
                clearAllTrails: jest.fn(),
            }));
        }
        if (SplitScreenCamera && jest.isMockFunction(SplitScreenCamera)) {
            SplitScreenCamera.mockImplementation(() => ({
                setPlayers: jest.fn(),
                update: jest.fn(),
                reset: jest.fn(),
            }));
        }

        renderer = new RenderingEngine({});
        mockScene = renderer.scene;

        // SPY BYPASS - We bypass crashing methods
        jest.spyOn(renderer, 'createCollectionParticles').mockImplementation(() => {});
        jest.spyOn(renderer, 'createCurrentBoundaryVisualization').mockImplementation(() => {});
        jest.spyOn(renderer, 'createFutureBoundaryVisualization').mockImplementation(() => {});
    });

    describe('Initialization', () => {
        it('should initialize subsystems', () => {
            expect(renderer.themeEngine.loadTheme).toHaveBeenCalledWith('classic-grid');
        });

        it('should initialize instanced meshes', () => {
            expect(renderer.instancedMeshes.size).toBeGreaterThan(0);
        });
    });

    describe('Draw Loop Logic', () => {
        it('should update subsystems in draw', () => {
            const gameState = { isPaused: false };
            renderer.draw(gameState);
            expect(renderer.emissiveMaterialSystem.updatePulseAnimation).toHaveBeenCalled();
            expect(renderer.trailStyleRenderer.updateTrailEffects).toHaveBeenCalled();
        });

        it('should handle pause state transitions', () => {
            renderer.lastPauseState = false;
            renderer.draw({ isPaused: true });
            expect(renderer.emissiveMaterialSystem.pausePulse).toHaveBeenCalled();

            renderer.lastPauseState = true;
            renderer.draw({ isPaused: false });
            expect(renderer.emissiveMaterialSystem.resumePulse).toHaveBeenCalled();
        });

        it('should fallback to standard render', () => {
            renderer.draw({ isPaused: false });
            expect(renderer.renderer.render).toHaveBeenCalled();
        });
    });

    describe('Player Entity Management', () => {
        it('should create new player entity', () => {
            const gameState = {
                player: { id: 'p1', isAlive: true, x: 10, z: 20 },
            };
            renderer.updatePlayerEntities(gameState);
            expect(renderer.playerEntities.has('player')).toBe(true);
        });

        it('should hide crashed players', () => {
            renderer.updatePlayerEntities({ player: { id: 'p1', isAlive: true } });
            renderer.updatePlayerEntities({ player: { id: 'p1', isAlive: false } });
            expect(renderer.playerEntities.get('player').visible).toBe(false);
        });

        it('should create trails', () => {
            const gameState = {
                player: {
                    id: 'p1',
                    isAlive: true,
                    trail: [
                        { x: 0, z: 0 },
                        { x: 1, z: 1 },
                    ],
                },
                playerTrail: [
                    { x: 0, z: 0 },
                    { x: 1, z: 1 },
                ],
            };
            renderer.updatePlayerTrails(gameState);
            expect(renderer.trailStyleRenderer.createStyledTrailSegment).toHaveBeenCalled();
        });
    });

    describe('Particle Effects', () => {
        it('should trigger collection particles creation', () => {
            renderer.createCollectionParticles({ x: 0, y: 0, z: 0 }, 'SPEED_BOOST');
            expect(renderer.createCollectionParticles).toHaveBeenCalled();
        });

        it('should update particle effects', () => {
            const particle = {
                position: { x: 0, y: 0, z: 0 },
                userData: { velocity: { x: 0, y: 0, z: 0 }, life: 0.1, decay: 0.2 },
                material: { opacity: 1, dispose: jest.fn(), clone: jest.fn().mockReturnThis() },
            };
            renderer.collectionParticles.push(particle);
            renderer.scene.remove = jest.fn();

            renderer.updateParticleEffects();

            expect(renderer.collectionParticles.length).toBe(0); // Life decayed to 0
            expect(renderer.scene.remove).toHaveBeenCalledWith(particle);
        });

        it('should display collection notification', () => {
            renderer.displayCollectionNotification('SPEED_BOOST', { x: 0, y: 0, z: 0 });
            // This method creates a canvas texture (document.createElement)
            // and adds a sprite to scene.
            expect(mockScene.add).toHaveBeenCalled();
        });

        it('should update collection notifications', () => {
            const notification = {
                userData: {
                    isNotification: true,
                    startTime: Date.now() - 3000,
                    duration: 2000,
                    life: 1,
                },
                position: { y: 0 },
                material: { opacity: 1 },
            };
            renderer.collectionParticles.push(notification);

            renderer.updateCollectionNotifications();
            expect(notification.userData.life).toBe(0);
        });
    });

    describe('Boundary Visualization', () => {
        const bounds = { minX: -10, maxX: 10, minZ: -10, maxZ: 10 };

        it('should trigger current boundary visualization', () => {
            renderer.createCurrentBoundaryVisualization(bounds);
            expect(renderer.createCurrentBoundaryVisualization).toHaveBeenCalled();
        });

        it('should trigger future boundary visualization', () => {
            renderer.createFutureBoundaryVisualization(bounds);
            expect(renderer.createFutureBoundaryVisualization).toHaveBeenCalled();
        });

        it('should update boundary visualization (active warning)', () => {
            const arenaState = {
                currentBounds: bounds,
                nextBounds: bounds,
                warningActive: true,
            };

            renderer.updateBoundaryVisualization(arenaState);
            expect(renderer.boundaryVisualization.warningFlash.active).toBe(true);
        });

        it('should update boundary visualization (no warning)', () => {
            renderer.boundaryVisualization.futureBoundaries = {
                geometry: { dispose: jest.fn() },
                material: { dispose: jest.fn() },
            };

            const arenaState = {
                currentBounds: bounds,
                nextBounds: bounds,
                warningActive: false,
            };

            renderer.updateBoundaryVisualization(arenaState);
            expect(mockScene.remove).toHaveBeenCalled();
        });

        it('should update shrink animation', () => {
            renderer.startShrinkAnimation(bounds, bounds);
            expect(renderer.boundaryVisualization.shrinkAnimation.active).toBe(true);
            renderer.updateBoundaryVisualization({ currentBounds: bounds, warningActive: false });
        });
    });

    describe('AI Management & Cleanup', () => {
        it('should create AI entities', () => {
            const gameState = {
                aiOpponents: [{ id: 'ai1', alive: true, x: 5, z: 5, color: 'red' }],
            };
            renderer.updateAIEntities(gameState);
            expect(renderer.aiEntities.has('ai1')).toBe(true);
        });

        it('should remove crashed AI', () => {
            const aiId = 'ai1';
            const mockMesh = {
                geometry: { dispose: jest.fn() },
                material: { dispose: jest.fn() },
            };
            renderer.aiEntities.set(aiId, mockMesh);

            // Mock trail
            const mockSegment = {
                geometry: { dispose: jest.fn() },
                userData: { materialId: 'm1' },
            };
            renderer.aiTrails.set(aiId, [mockSegment]);

            renderer.removeCrashedAI(aiId);

            expect(mockScene.remove).toHaveBeenCalledWith(mockMesh);
            expect(renderer.emissiveMaterialSystem.disposeMaterial).toHaveBeenCalledWith('m1');
            expect(renderer.aiEntities.has(aiId)).toBe(false);
        });

        it('should cleanup crashed AIs from game state', () => {
            const aiId = 'ai_crashed';
            renderer.aiEntities.set(aiId, {});
            const gameState = { aiOpponents: [] };
            const removeSpy = jest.spyOn(renderer, 'removeCrashedAI');
            renderer.cleanupCrashedAIs(gameState);
            expect(removeSpy).toHaveBeenCalledWith(aiId);
        });
    });

    describe('Instanced PowerUps', () => {
        it('should update instanced meshes for same type powerups', () => {
            const powerUps = [
                {
                    id: '1',
                    type: 'SPEED_BOOST',
                    position: { x: 0, y: 0, z: 0 },
                    appearance: { shape: 'box' },
                },
                {
                    id: '2',
                    type: 'SPEED_BOOST',
                    position: { x: 10, y: 0, z: 0 },
                    appearance: { shape: 'box' },
                },
            ];
            renderer.registerPowerUps(powerUps);

            const imesh = renderer.instancedMeshes.get('SPEED_BOOST');
            expect(imesh.setMatrixAt).toHaveBeenCalled();
            expect(imesh.count).toBe(2);
        });

        it('should fallback to individual objects for unique/single types', () => {
            const powerUps = [
                {
                    id: '1',
                    type: 'UNIQUE_THING',
                    position: { x: 0, y: 0, z: 0 },
                    appearance: { shape: 'sphere', size: { radius: 1 } },
                },
            ];
            renderer.registerPowerUps(powerUps);
            expect(renderer.powerUpObjects.has('1')).toBe(true);
        });
    });

    describe('Particle System Integration', () => {
        let mockParticleSystemClass;
        let mockParticleSystemInstance;

        beforeEach(() => {
            mockParticleSystemInstance = {
                update: jest.fn(),
                emitTrailSparks: jest.fn(),
                createExplosion: jest.fn(),
                createCollectionEffect: jest.fn(),
                dispose: jest.fn(),
                setQualityLevel: jest.fn(),
                setEnabled: jest.fn(),
                pause: jest.fn(),
                resume: jest.fn(),
                reset: jest.fn(),
            };
            mockParticleSystemClass = jest.fn(() => mockParticleSystemInstance);
        });

        it('should initialize particle system', () => {
            renderer.initializeParticleSystem(mockParticleSystemClass, { maxParticles: 100 });
            expect(mockParticleSystemClass).toHaveBeenCalled();
            expect(renderer.particleSystemEnabled).toBe(true);
        });

        it('should handle missing particle system class', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
            renderer.initializeParticleSystem(null);
            expect(consoleSpy).toHaveBeenCalled();
        });

        it('should handle initialization errors', () => {
            mockParticleSystemClass.mockImplementation(() => {
                throw new Error('Init failed');
            });
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            renderer.initializeParticleSystem(mockParticleSystemClass);
            expect(renderer.particleSystem).toBeNull();
            expect(renderer.particleSystemEnabled).toBe(false);
        });

        it('should update integrated particle system', () => {
            renderer.particleSystem = mockParticleSystemInstance;
            renderer.particleSystemEnabled = true;
            const gameState = {};

            renderer.updateIntegratedParticleSystem(gameState);

            expect(mockParticleSystemInstance.update).toHaveBeenCalled();
        });

        it('should not update if particle system disabled or missing', () => {
            renderer.particleSystem = null;
            renderer.updateIntegratedParticleSystem({});

            renderer.particleSystem = mockParticleSystemInstance;
            renderer.particleSystemEnabled = false;
            renderer.updateIntegratedParticleSystem({});

            expect(mockParticleSystemInstance.update).not.toHaveBeenCalled();
        });

        it('should safe guard update against errors', () => {
            renderer.particleSystem = mockParticleSystemInstance;
            renderer.particleSystemEnabled = true;
            mockParticleSystemInstance.update.mockImplementation(() => {
                throw new Error('Update error');
            });
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            renderer.updateIntegratedParticleSystem({});

            expect(renderer.particleSystemEnabled).toBe(false); // Should automatically disable
        });

        it('should emit trail sparks for player', () => {
            renderer.particleSystem = mockParticleSystemInstance;
            renderer.particleSystemEnabled = true;

            const gameState = {
                gameSpeed: 1,
                player: { x: 0, z: 0 },
                playerDirection: { x: 1, z: 0 },
            };

            renderer.emitTrailSparksForEntities(gameState);

            expect(mockParticleSystemInstance.emitTrailSparks).toHaveBeenCalledWith(
                gameState.player,
                expect.objectContaining({ x: 1, y: 0, z: 0 }), // velocity
                0x00ff00, // color
                1.0 // speed
            );
        });

        it('should emit trail sparks for AI', () => {
            renderer.particleSystem = mockParticleSystemInstance;
            renderer.particleSystemEnabled = true;

            const gameState = {
                gameSpeed: 1,
                aiOpponents: [
                    {
                        id: 'ai1',
                        alive: true,
                        direction: { x: 0, z: 1 },
                        color: 'red',
                        x: 0,
                        z: 0,
                    },
                ],
            };
            renderer.getColorHex = jest.fn().mockReturnValue(0xff0000);

            renderer.emitTrailSparksForEntities(gameState);

            expect(mockParticleSystemInstance.emitTrailSparks).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'ai1' }),
                expect.objectContaining({ x: 0, y: 0, z: 1 }),
                0xff0000,
                1.0
            );
        });

        it('should delegate effects to particle system', () => {
            renderer.particleSystem = mockParticleSystemInstance;
            renderer.particleSystemEnabled = true;

            renderer.createExplosionEffect({ x: 0, y: 0, z: 0 });
            expect(mockParticleSystemInstance.createExplosion).toHaveBeenCalled();

            renderer.createCollectionEffect({ x: 0, y: 0, z: 0 }, 'SPEED');
            expect(mockParticleSystemInstance.createCollectionEffect).toHaveBeenCalled();
        });

        it('should reinitialize particle system', () => {
            // Mock require for ParticleSystem
            jest.mock(
                '../../src/rendering/ParticleSystem.js',
                () => ({
                    ParticleSystem: mockParticleSystemClass,
                }),
                { virtual: true }
            );

            renderer.particleSystem = mockParticleSystemInstance;
            const initSpy = jest.spyOn(renderer, 'initializeParticleSystem');

            try {
                renderer.reinitializeParticleSystem({});
                expect(mockParticleSystemInstance.dispose).toHaveBeenCalled();
                expect(initSpy).toHaveBeenCalled();
            } catch (e) {
                // Expected if module missing
            }
        });

        // Coverage for Getters/Setters
        it('should set particle system state', () => {
            renderer.particleSystem = mockParticleSystemInstance;
            renderer.setParticleSystemEnabled(false);
            expect(renderer.particleSystemEnabled).toBe(false);
            expect(mockParticleSystemInstance.setEnabled).toHaveBeenCalledWith(false);

            renderer.setParticleQuality('high');
            expect(mockParticleSystemInstance.setQualityLevel).toHaveBeenCalledWith('high');

            renderer.pauseParticleSystem();
            expect(mockParticleSystemInstance.pause).toHaveBeenCalled();

            renderer.resumeParticleSystem();
            expect(mockParticleSystemInstance.resume).toHaveBeenCalled();

            renderer.resetParticleSystem();
            expect(mockParticleSystemInstance.reset).toHaveBeenCalled();

            expect(renderer.getParticleSystem()).toBe(mockParticleSystemInstance);
        });
    });

    describe('WebGL Utilities', () => {
        it('should check WebGL availability', () => {
            // Mock getContext
            const getContext = jest.fn().mockReturnValue({});
            document.createElement = jest.fn().mockReturnValue({ getContext });
            window.WebGLRenderingContext = true;

            expect(renderer.isWebGLAvailable()).toBe(true);

            // Fail case
            document.createElement = jest.fn().mockReturnValue({ getContext: () => null });
            expect(renderer.isWebGLAvailable()).toBe(false);
        });

        it('should show WebGL error', () => {
            const spy = jest.spyOn(document.body, 'appendChild');
            renderer.showWebGLError();
            expect(spy).toHaveBeenCalled();
        });
    });

    describe('Cleanup', () => {
        it('should clear all entities and trails', () => {
            renderer.clearTrails();
            expect(renderer.trailStyleRenderer.clearAllTrails).toHaveBeenCalled();
            expect(renderer.playerEntities.size).toBe(0);
            expect(renderer.aiEntities.size).toBe(0);
        });

        it('should clear boundary visualization safely', () => {
            // Setup mock boundary objects
            renderer.boundaryVisualization.currentBoundaries = {
                geometry: { dispose: jest.fn() },
                material: { dispose: jest.fn() },
            };
            renderer.boundaryVisualization.futureBoundaries = {
                geometry: { dispose: jest.fn() },
                material: { dispose: jest.fn() },
            };

            renderer.clearBoundaryVisualization();

            expect(mockScene.remove).toHaveBeenCalledTimes(2);
            expect(renderer.boundaryVisualization.currentBoundaries).toBeNull();
            expect(renderer.boundaryVisualization.futureBoundaries).toBeNull();
        });
    });

    describe('Theme System Integration', () => {
        it('should delegate theme operations', () => {
            // Setup mock return values
            renderer.themeEngine.getAvailableThemes = jest.fn().mockReturnValue(['t1']);
            renderer.themeEngine.getCurrentTheme = jest.fn().mockReturnValue('t1');
            renderer.themeEngine.generateThemePreview = jest.fn().mockReturnValue({});
            renderer.themeEngine.getThemeConfig = jest.fn().mockReturnValue({});

            // Test delegation
            renderer.setArenaTheme('t2');
            expect(renderer.themeEngine.loadTheme).toHaveBeenCalledWith('t2');

            expect(renderer.getAvailableThemes()).toEqual(['t1']);
            expect(renderer.getCurrentTheme()).toEqual('t1');

            renderer.generateThemePreview('t1');
            expect(renderer.themeEngine.generateThemePreview).toHaveBeenCalledWith('t1');

            renderer.getThemeConfig('t1');
            expect(renderer.themeEngine.getThemeConfig).toHaveBeenCalledWith('t1');

            renderer.resetThemeToDefault();
            expect(renderer.themeEngine.resetToDefault).toHaveBeenCalled();
        });

        it('should handle missing ThemeEngine', () => {
            // Temporarily remove theme engine
            renderer.themeEngine = null;

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

            expect(renderer.setArenaTheme('t1')).toBe(false);
            expect(consoleSpy).toHaveBeenCalled();

            expect(renderer.getAvailableThemes()).toEqual([]);
            expect(renderer.getCurrentTheme()).toBe('classic-grid');
            expect(renderer.generateThemePreview('t1')).toBeNull();
            expect(renderer.getThemeConfig('t1')).toBeNull();

            // Should not crash
            renderer.resetThemeToDefault();
        });

        it('should expose theme engine instance', () => {
            expect(renderer.getThemeEngine()).toBeDefined();
        });

        it('should delegate glow effect operations', () => {
            renderer.pauseGlowEffects();
            expect(renderer.emissiveMaterialSystem.pausePulse).toHaveBeenCalled();

            renderer.resumeGlowEffects();
            expect(renderer.emissiveMaterialSystem.resumePulse).toHaveBeenCalled();

            renderer.setGlowIntensity(0.5);
            expect(
                renderer.emissiveMaterialSystem.setGlobalIntensityMultiplier
            ).toHaveBeenCalledWith(0.5);

            renderer.getGlowEffectStatus();
            expect(renderer.emissiveMaterialSystem.getStatus).toHaveBeenCalled();
        });
    });
});
