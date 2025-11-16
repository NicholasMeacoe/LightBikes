/**
 * Multi-mode compatibility tests for Camera Effects system
 * Tests camera effects integration across Classic, Time Trial, and Arena Shrink modes
 */

const { CameraEffectsManager } = require('./CameraEffectsManager.js');
const { Game } = require('./game.js');
const { GameModes } = require('./GameModes.js');
const { RenderingEngine } = require('./renderer.js');
const { AIController, AICoordinator } = require('./ai.js');

// Mock THREE.js for testing
global.THREE = {
    Scene: jest.fn(() => ({
        background: null,
        add: jest.fn(),
        remove: jest.fn()
    })),
    PerspectiveCamera: jest.fn(() => ({
        position: {
            x: 0, y: 20, z: 20,
            set: jest.fn(),
            clone: () => ({ x: 0, y: 20, z: 20 }),
            copy: jest.fn()
        },
        aspect: 1,
        updateProjectionMatrix: jest.fn(),
        lookAt: jest.fn()
    })),
    WebGLRenderer: jest.fn(() => ({
        domElement: document.createElement('canvas'),
        setSize: jest.fn(),
        setClearColor: jest.fn(),
        render: jest.fn()
    })),
    AmbientLight: jest.fn(() => ({})),
    DirectionalLight: jest.fn(() => ({
        position: { set: jest.fn() }
    })),
    GridHelper: jest.fn(() => ({})),
    BoxHelper: jest.fn(() => ({})),
    BoxGeometry: jest.fn(() => ({})),
    SphereGeometry: jest.fn(() => ({})),
    MeshBasicMaterial: jest.fn(() => ({
        dispose: jest.fn()
    })),
    Mesh: jest.fn(() => ({
        position: { x: 0, y: 0, z: 0 },
        visible: true,
        userData: {},
        geometry: { dispose: jest.fn() },
        material: { dispose: jest.fn() }
    })),
    Color: jest.fn(() => ({})),
    Vector3: jest.fn(() => ({
        x: 0, y: 0, z: 0,
        clone: () => ({ x: 0, y: 0, z: 0 }),
        copy: jest.fn(),
        set: jest.fn()
    })),
    MeshLambertMaterial: jest.fn(() => ({
        dispose: jest.fn()
    })),
    Float32BufferAttribute: jest.fn(() => ({})),
    BufferGeometry: jest.fn(() => ({
        setAttribute: jest.fn(),
        dispose: jest.fn()
    })),
    LineBasicMaterial: jest.fn(() => ({
        dispose: jest.fn()
    })),
    LineSegments: jest.fn(() => ({
        geometry: { dispose: jest.fn() },
        material: { dispose: jest.fn() }
    })),
    InstancedMesh: jest.fn(() => ({
        instanceMatrix: { needsUpdate: false },
        setMatrixAt: jest.fn(),
        setColorAt: jest.fn(),
        geometry: { dispose: jest.fn() },
        material: { dispose: jest.fn() },
        visible: true
    })),
    Matrix4: jest.fn(() => ({
        makeTranslation: jest.fn(),
        makeScale: jest.fn(),
        multiply: jest.fn()
    }))
};

// Mock document and window
global.document = {
    body: { appendChild: jest.fn() },
    createElement: jest.fn(() => ({
        getContext: jest.fn(() => null)
    }))
};

global.window = {
    innerWidth: 1024,
    innerHeight: 768,
    matchMedia: jest.fn(() => ({
        matches: false,
        addListener: jest.fn()
    }))
};

describe('Camera Effects Multi-Mode Compatibility', () => {
    let classicGame, timeTrialGame, arenaShrinkGame;
    let renderingEngine;
    let cameraEffectsManager;
    let aiControllers;

    beforeEach(() => {
        // Initialize games for each mode
        classicGame = new Game(GameModes.CLASSIC);
        timeTrialGame = new Game(GameModes.TIME_TRIAL);
        arenaShrinkGame = new Game(GameModes.ARENA_SHRINK);
        
        // Initialize rendering engine
        renderingEngine = new RenderingEngine(30);
        
        // Initialize AI controllers for multi-AI testing
        aiControllers = [
            new AIController('aggressive'),
            new AIController('defensive'),
            new AIController('erratic')
        ];
        
        jest.clearAllMocks();
    });

    describe('Classic Mode Integration', () => {
        beforeEach(() => {
            cameraEffectsManager = new CameraEffectsManager(
                renderingEngine.camera,
                renderingEngine.renderer,
                classicGame.getGameState()
            );
            cameraEffectsManager.initialize();
        });

        afterEach(() => {
            if (cameraEffectsManager) {
                cameraEffectsManager.destroy();
            }
        });

        it('should work with single AI opponent', () => {
            const gameState = classicGame.getGameState();
            
            // Verify AI is present in Classic mode
            expect(gameState.ai).toBeDefined();
            expect(gameState.aiOpponents).toHaveLength(1);
            
            // Test collision with AI
            expect(() => {
                cameraEffectsManager.onCollision(gameState.ai, 1.0);
            }).not.toThrow();
            
            // Test near-miss with AI
            expect(() => {
                cameraEffectsManager.onNearMiss(gameState.ai, 0.8);
            }).not.toThrow();
            
            const status = cameraEffectsManager.getStatus();
            expect(status.subsystems.shake.activeEffects).toBeGreaterThan(0);
        });

        it('should work with multiple AI opponents', () => {
            // Set up multi-AI game
            classicGame.gameConfig.aiCount = 3;
            classicGame.initializeAIOpponents();
            
            const gameState = classicGame.getGameState();
            expect(gameState.aiOpponents).toHaveLength(3);
            
            // Test collision with multiple AIs
            gameState.aiOpponents.forEach((ai, index) => {
                expect(() => {
                    cameraEffectsManager.onCollision(ai, 0.8 + (index * 0.1));
                }).not.toThrow();
            });
            
            const status = cameraEffectsManager.getStatus();
            expect(status.subsystems.shake.activeEffects).toBe(3);
        });

        it('should handle pause and resume in Classic mode', () => {
            classicGame.pause();
            expect(() => {
                cameraEffectsManager.pause();
            }).not.toThrow();
            
            classicGame.resume();
            expect(() => {
                cameraEffectsManager.resume();
            }).not.toThrow();
        });

        it('should track speed changes with power-ups in Classic mode', () => {
            const gameState = classicGame.getGameState();
            
            // Simulate speed boost from power-up
            expect(() => {
                cameraEffectsManager.onSpeedChange(gameState.player, 2.5);
            }).not.toThrow();
            
            cameraEffectsManager.update(0.016);
            
            const status = cameraEffectsManager.getStatus();
            expect(status.subsystems.motionBlur.intensity).toBeGreaterThan(0);
        });
    });

    describe('Time Trial Mode Integration', () => {
        beforeEach(() => {
            cameraEffectsManager = new CameraEffectsManager(
                renderingEngine.camera,
                renderingEngine.renderer,
                timeTrialGame.getGameState()
            );
            cameraEffectsManager.initialize();
        });

        afterEach(() => {
            if (cameraEffectsManager) {
                cameraEffectsManager.destroy();
            }
        });

        it('should work without AI opponents', () => {
            const gameState = timeTrialGame.getGameState();
            
            // Verify no AI in Time Trial mode
            expect(gameState.ai).toBeNull();
            expect(gameState.aiOpponents).toHaveLength(0);
            
            // Test player collision (boundary/trail)
            expect(() => {
                cameraEffectsManager.onCollision(gameState.player, 1.0);
            }).not.toThrow();
            
            const status = cameraEffectsManager.getStatus();
            expect(status.subsystems.shake.activeEffects).toBe(1);
        });

        it('should handle survival timer integration', () => {
            // Start survival timer
            timeTrialGame.startSurvivalTimer();
            
            // Simulate game progression
            for (let i = 0; i < 10; i++) {
                timeTrialGame.update();
                cameraEffectsManager.update(0.016);
            }
            
            expect(() => {
                cameraEffectsManager.getStatus();
            }).not.toThrow();
        });

        it('should work with speed variations in Time Trial', () => {
            const gameState = timeTrialGame.getGameState();
            
            // Test various speed changes
            const speeds = [1.5, 2.0, 2.5, 3.0, 1.0];
            
            speeds.forEach(speed => {
                expect(() => {
                    cameraEffectsManager.onSpeedChange(gameState.player, speed);
                    cameraEffectsManager.update(0.016);
                }).not.toThrow();
            });
            
            const status = cameraEffectsManager.getStatus();
            expect(typeof status.subsystems.motionBlur.intensity).toBe('number');
        });

        it('should handle Time Trial pause/resume correctly', () => {
            timeTrialGame.startSurvivalTimer();
            
            // Pause
            timeTrialGame.pause();
            cameraEffectsManager.pause();
            
            // Resume
            timeTrialGame.resume();
            cameraEffectsManager.resume();
            
            expect(cameraEffectsManager.isEnabled()).toBe(true);
        });
    });

    describe('Arena Shrink Mode Integration', () => {
        beforeEach(() => {
            cameraEffectsManager = new CameraEffectsManager(
                renderingEngine.camera,
                renderingEngine.renderer,
                arenaShrinkGame.getGameState()
            );
            cameraEffectsManager.initialize();
        });

        afterEach(() => {
            if (cameraEffectsManager) {
                cameraEffectsManager.destroy();
            }
        });

        it('should work with dynamic boundaries', () => {
            const gameState = arenaShrinkGame.getGameState();
            
            // Verify Arena Shrink mode setup
            expect(arenaShrinkGame.hasDynamicBounds()).toBe(true);
            expect(gameState.aiOpponents).toHaveLength(1);
            
            // Test collision in shrinking arena
            expect(() => {
                cameraEffectsManager.onCollision(gameState.player, 1.2);
            }).not.toThrow();
            
            const status = cameraEffectsManager.getStatus();
            expect(status.subsystems.shake.activeEffects).toBe(1);
        });

        it('should handle arena shrink events', () => {
            // Simulate arena shrinking
            if (arenaShrinkGame.arenaShrinker) {
                arenaShrinkGame.arenaShrinker.initialize(Date.now());
                
                // Update multiple times to trigger shrink
                for (let i = 0; i < 100; i++) {
                    arenaShrinkGame.update();
                    cameraEffectsManager.update(0.016);
                }
            }
            
            expect(() => {
                cameraEffectsManager.getStatus();
            }).not.toThrow();
        });

        it('should work with multiple AI in Arena Shrink', () => {
            // Set up multi-AI Arena Shrink
            arenaShrinkGame.gameConfig.aiCount = 4;
            arenaShrinkGame.initializeAIOpponents();
            
            const gameState = arenaShrinkGame.getGameState();
            expect(gameState.aiOpponents).toHaveLength(4);
            
            // Test effects with all AIs
            gameState.aiOpponents.forEach((ai, index) => {
                expect(() => {
                    cameraEffectsManager.onCollision(ai, 0.7 + (index * 0.1));
                }).not.toThrow();
            });
            
            const status = cameraEffectsManager.getStatus();
            expect(status.subsystems.shake.activeEffects).toBe(4);
        });

        it('should handle boundary warnings with camera effects', () => {
            const gameState = arenaShrinkGame.getGameState();
            
            // Simulate boundary warning scenario
            if (arenaShrinkGame.arenaShrinker) {
                // Test near-miss with shrinking boundary
                expect(() => {
                    cameraEffectsManager.onNearMiss(gameState.player, 1.5);
                }).not.toThrow();
            }
            
            const status = cameraEffectsManager.getStatus();
            expect(status.initialized).toBe(true);
        });
    });

    describe('Mode Switching Compatibility', () => {
        it('should handle switching between modes', () => {
            // Start with Classic mode
            cameraEffectsManager = new CameraEffectsManager(
                renderingEngine.camera,
                renderingEngine.renderer,
                classicGame.getGameState()
            );
            cameraEffectsManager.initialize();
            
            // Trigger some effects
            cameraEffectsManager.onCollision(classicGame.getGameState().player, 1.0);
            
            // Switch to Time Trial mode
            expect(() => {
                cameraEffectsManager.reset();
                cameraEffectsManager.updateGameState(timeTrialGame.getGameState());
            }).not.toThrow();
            
            // Switch to Arena Shrink mode
            expect(() => {
                cameraEffectsManager.reset();
                cameraEffectsManager.updateGameState(arenaShrinkGame.getGameState());
            }).not.toThrow();
            
            cameraEffectsManager.destroy();
        });

        it('should maintain settings across mode switches', () => {
            cameraEffectsManager = new CameraEffectsManager(
                renderingEngine.camera,
                renderingEngine.renderer,
                classicGame.getGameState()
            );
            cameraEffectsManager.initialize();
            
            // Set custom settings
            const customSettings = {
                shakeIntensity: 1.5,
                motionBlurQuality: 'high'
            };
            cameraEffectsManager.updateSettings(customSettings);
            
            // Switch modes and verify settings persist
            cameraEffectsManager.updateGameState(timeTrialGame.getGameState());
            
            const status = cameraEffectsManager.getStatus();
            expect(status.settings.shakeIntensity).toBe(1.5);
            expect(status.settings.motionBlurQuality).toBe('high');
            
            cameraEffectsManager.destroy();
        });
    });

    describe('Performance Across Modes', () => {
        it('should maintain performance in all modes', () => {
            const modes = [
                { game: classicGame, name: 'Classic' },
                { game: timeTrialGame, name: 'Time Trial' },
                { game: arenaShrinkGame, name: 'Arena Shrink' }
            ];
            
            modes.forEach(({ game, name }) => {
                cameraEffectsManager = new CameraEffectsManager(
                    renderingEngine.camera,
                    renderingEngine.renderer,
                    game.getGameState()
                );
                cameraEffectsManager.initialize();
                
                // Run performance test
                const startTime = Date.now();
                
                for (let i = 0; i < 100; i++) {
                    cameraEffectsManager.update(0.016);
                    
                    if (i % 10 === 0) {
                        cameraEffectsManager.onCollision(game.getGameState().player, 0.8);
                    }
                }
                
                const endTime = Date.now();
                const duration = endTime - startTime;
                
                // Should complete within reasonable time (less than 100ms for 100 updates)
                expect(duration).toBeLessThan(100);
                
                const metrics = cameraEffectsManager.getPerformanceMetrics();
                expect(metrics.frameCount).toBe(100);
                expect(metrics.currentFPS).toBeGreaterThan(0);
                
                cameraEffectsManager.destroy();
            });
        });
    });

    describe('Error Handling Across Modes', () => {
        it('should handle errors gracefully in all modes', () => {
            const modes = [classicGame, timeTrialGame, arenaShrinkGame];
            
            modes.forEach(game => {
                cameraEffectsManager = new CameraEffectsManager(
                    renderingEngine.camera,
                    renderingEngine.renderer,
                    game.getGameState()
                );
                cameraEffectsManager.initialize();
                
                // Test error conditions
                expect(() => {
                    cameraEffectsManager.onCollision(null, 1.0);
                    cameraEffectsManager.onNearMiss(undefined, 0.5);
                    cameraEffectsManager.onSpeedChange({}, 'invalid');
                }).not.toThrow();
                
                expect(cameraEffectsManager.isEnabled()).toBe(true);
                
                cameraEffectsManager.destroy();
            });
        });
    });

    describe('Local Multiplayer Compatibility', () => {
        it('should handle multiple players in Classic mode', () => {
            // Set up multi-AI for local multiplayer simulation
            classicGame.gameConfig.aiCount = 2;
            classicGame.initializeAIOpponents();
            
            cameraEffectsManager = new CameraEffectsManager(
                renderingEngine.camera,
                renderingEngine.renderer,
                classicGame.getGameState()
            );
            cameraEffectsManager.initialize();
            
            const gameState = classicGame.getGameState();
            
            // Test simultaneous collisions
            expect(() => {
                cameraEffectsManager.onCollision(gameState.player, 1.0);
                gameState.aiOpponents.forEach(ai => {
                    cameraEffectsManager.onCollision(ai, 0.8);
                });
            }).not.toThrow();
            
            const status = cameraEffectsManager.getStatus();
            expect(status.subsystems.shake.activeEffects).toBe(3); // Player + 2 AIs
            
            cameraEffectsManager.destroy();
        });

        it('should coordinate camera effects for multiple entities', () => {
            classicGame.gameConfig.aiCount = 3;
            classicGame.initializeAIOpponents();
            
            cameraEffectsManager = new CameraEffectsManager(
                renderingEngine.camera,
                renderingEngine.renderer,
                classicGame.getGameState()
            );
            cameraEffectsManager.initialize();
            
            const gameState = classicGame.getGameState();
            
            // Test coordinated effects
            expect(() => {
                // Player near-miss
                cameraEffectsManager.onNearMiss(gameState.player, 0.9);
                
                // AI collisions
                gameState.aiOpponents.forEach((ai, index) => {
                    if (index < 2) { // Only first 2 AIs collide
                        cameraEffectsManager.onCollision(ai, 0.7);
                    }
                });
                
                // Speed changes
                cameraEffectsManager.onSpeedChange(gameState.player, 2.2);
            }).not.toThrow();
            
            // Update to process all effects
            cameraEffectsManager.update(0.016);
            
            const status = cameraEffectsManager.getStatus();
            expect(status.subsystems.shake.activeEffects).toBe(3); // 1 near-miss + 2 collisions
            expect(status.subsystems.motionBlur.intensity).toBeGreaterThan(0);
            
            cameraEffectsManager.destroy();
        });
    });
});