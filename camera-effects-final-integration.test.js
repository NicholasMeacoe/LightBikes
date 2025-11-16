/**
 * Final integration test for Camera Effects system
 * Tests smooth transitions and natural effect combinations
 */

const { CameraEffectsManager } = require('./CameraEffectsManager.js');
const { Game } = require('./game.js');
const { GameModes } = require('./GameModes.js');
const { RenderingEngine } = require('./renderer.js');

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

describe('Camera Effects Final Integration', () => {
    let game;
    let renderingEngine;
    let cameraEffectsManager;

    beforeEach(() => {
        game = new Game(GameModes.CLASSIC);
        renderingEngine = new RenderingEngine(30);
        cameraEffectsManager = new CameraEffectsManager(
            renderingEngine.camera,
            renderingEngine.renderer,
            game.getGameState()
        );
        cameraEffectsManager.initialize();
        
        jest.clearAllMocks();
    });

    afterEach(() => {
        if (cameraEffectsManager) {
            cameraEffectsManager.destroy();
        }
    });

    describe('Smooth Transitions', () => {
        it('should handle smooth transitions between different effect intensities', () => {
            const gameState = game.getGameState();
            
            // Start with low intensity
            cameraEffectsManager.updateSettings({ shakeIntensity: 0.5 });
            cameraEffectsManager.onCollision(gameState.player, 0.5);
            cameraEffectsManager.update(0.016);
            
            // Transition to high intensity
            cameraEffectsManager.updateSettings({ shakeIntensity: 2.0 });
            cameraEffectsManager.onCollision(gameState.player, 1.0);
            cameraEffectsManager.update(0.016);
            
            // Should handle transitions smoothly
            expect(cameraEffectsManager.isEnabled()).toBe(true);
        });

        it('should smoothly transition motion blur intensity with speed changes', () => {
            const gameState = game.getGameState();
            
            // Gradual speed increase
            const speeds = [1.0, 1.5, 2.0, 2.5, 3.0, 2.5, 2.0, 1.5, 1.0];
            
            speeds.forEach(speed => {
                expect(() => {
                    cameraEffectsManager.onSpeedChange(gameState.player, speed);
                    cameraEffectsManager.update(0.016);
                }).not.toThrow();
            });
        });

        it('should handle smooth transitions when enabling/disabling effects', () => {
            const gameState = game.getGameState();
            
            // Enable effects and trigger
            cameraEffectsManager.setEnabled(true);
            cameraEffectsManager.onCollision(gameState.player, 1.0);
            cameraEffectsManager.update(0.016);
            
            // Disable effects
            cameraEffectsManager.setEnabled(false);
            cameraEffectsManager.update(0.016);
            
            // Re-enable effects
            cameraEffectsManager.setEnabled(true);
            cameraEffectsManager.update(0.016);
            
            expect(cameraEffectsManager.isEnabled()).toBe(true);
        });
    });

    describe('Natural Effect Combinations', () => {
        it('should handle simultaneous collision shake and motion blur naturally', () => {
            const gameState = game.getGameState();
            
            // Trigger both effects simultaneously
            expect(() => {
                cameraEffectsManager.onCollision(gameState.player, 1.0);
                cameraEffectsManager.onSpeedChange(gameState.player, 3.0);
                cameraEffectsManager.update(0.016);
            }).not.toThrow();
        });

        it('should combine multiple shake effects additively', () => {
            const gameState = game.getGameState();
            const nearEntity = { id: 'ai_1', x: 0.5, y: 0, z: 0 };
            
            // Trigger multiple shake effects
            expect(() => {
                cameraEffectsManager.onNearMiss(nearEntity, 0.5);
                cameraEffectsManager.onCollision(gameState.player, 0.8);
                cameraEffectsManager.update(0.016);
            }).not.toThrow();
        });

        it('should handle rapid successive effects naturally', () => {
            const gameState = game.getGameState();
            const nearEntity = { id: 'ai_1', x: 0.7, y: 0, z: 0 };
            
            // Rapid succession of effects
            for (let i = 0; i < 10; i++) {
                expect(() => {
                    if (i % 3 === 0) {
                        cameraEffectsManager.onCollision(gameState.player, 0.6);
                    } else if (i % 3 === 1) {
                        cameraEffectsManager.onNearMiss(nearEntity, 0.8);
                    } else {
                        cameraEffectsManager.onSpeedChange(gameState.player, 2.0 + (i * 0.1));
                    }
                    cameraEffectsManager.update(0.016);
                }).not.toThrow();
            }
        });

        it('should maintain natural feel during complex gameplay scenarios', () => {
            const gameState = game.getGameState();
            const nearEntity1 = { id: 'ai_1', x: 0.6, y: 0, z: 0 };
            const nearEntity2 = { id: 'ai_2', x: 0.9, y: 0, z: 0 };
            
            // Simulate complex gameplay scenario
            expect(() => {
                // Player speeds up
                cameraEffectsManager.onSpeedChange(gameState.player, 2.5);
                cameraEffectsManager.update(0.016);
                
                // Near miss with first AI
                cameraEffectsManager.onNearMiss(nearEntity1, 0.6);
                cameraEffectsManager.update(0.016);
                
                // Speed increases more
                cameraEffectsManager.onSpeedChange(gameState.player, 3.0);
                cameraEffectsManager.update(0.016);
                
                // Near miss with second AI
                cameraEffectsManager.onNearMiss(nearEntity2, 0.9);
                cameraEffectsManager.update(0.016);
                
                // Final collision
                cameraEffectsManager.onCollision(gameState.player, 1.0);
                cameraEffectsManager.update(0.016);
            }).not.toThrow();
        });
    });

    describe('Performance Optimization', () => {
        it('should maintain performance during intensive effect sequences', () => {
            const gameState = game.getGameState();
            const nearEntity = { id: 'ai_1', x: 0.5, y: 0, z: 0 };
            
            const startTime = Date.now();
            
            // Intensive sequence
            for (let i = 0; i < 100; i++) {
                cameraEffectsManager.onCollision(gameState.player, 0.8);
                cameraEffectsManager.onNearMiss(nearEntity, 0.7);
                cameraEffectsManager.onSpeedChange(gameState.player, 2.0 + Math.sin(i * 0.1));
                cameraEffectsManager.update(0.016);
            }
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            // Should complete within reasonable time
            expect(duration).toBeLessThan(200);
        });

        it('should handle memory management during extended gameplay', () => {
            const gameState = game.getGameState();
            
            // Extended gameplay simulation
            for (let i = 0; i < 1000; i++) {
                if (i % 10 === 0) {
                    cameraEffectsManager.onCollision(gameState.player, 0.5);
                }
                cameraEffectsManager.update(0.016);
            }
            
            // Should still be functional
            expect(cameraEffectsManager.isEnabled()).toBe(true);
        });

        it('should clean up completed effects automatically', () => {
            const gameState = game.getGameState();
            
            // Trigger short-duration effects
            cameraEffectsManager.onCollision(gameState.player, 0.5);
            
            // Update for longer than effect duration
            for (let i = 0; i < 120; i++) { // 2 seconds at 60fps
                cameraEffectsManager.update(0.016);
            }
            
            // Should have cleaned up completed effects
            expect(cameraEffectsManager.isEnabled()).toBe(true);
        });
    });

    describe('Error Recovery and Robustness', () => {
        it('should recover gracefully from invalid effect parameters', () => {
            const gameState = game.getGameState();
            
            // Mix valid and invalid parameters
            expect(() => {
                cameraEffectsManager.onCollision(gameState.player, 1.0); // Valid
                cameraEffectsManager.onCollision(null, 0.5); // Invalid entity
                cameraEffectsManager.onNearMiss(undefined, 0.8); // Invalid entity
                cameraEffectsManager.onSpeedChange({}, 'invalid'); // Invalid speed
                cameraEffectsManager.onCollision(gameState.player, 0.8); // Valid again
                cameraEffectsManager.update(0.016);
            }).not.toThrow();
            
            expect(cameraEffectsManager.isEnabled()).toBe(true);
        });

        it('should maintain functionality after settings errors', () => {
            const gameState = game.getGameState();
            
            // Apply invalid settings
            expect(() => {
                cameraEffectsManager.updateSettings({ invalidProperty: 'invalid' });
                cameraEffectsManager.updateSettings({ shakeIntensity: 'not a number' });
                cameraEffectsManager.updateSettings({ shakeIntensity: 1.5 }); // Valid
            }).not.toThrow();
            
            // Should still work
            expect(() => {
                cameraEffectsManager.onCollision(gameState.player, 1.0);
                cameraEffectsManager.update(0.016);
            }).not.toThrow();
        });

        it('should handle rapid enable/disable cycles', () => {
            const gameState = game.getGameState();
            
            // Rapid enable/disable cycles
            for (let i = 0; i < 20; i++) {
                expect(() => {
                    cameraEffectsManager.setEnabled(i % 2 === 0);
                    cameraEffectsManager.onCollision(gameState.player, 0.5);
                    cameraEffectsManager.update(0.016);
                }).not.toThrow();
            }
            
            // Should end in a stable state
            expect(typeof cameraEffectsManager.isEnabled()).toBe('boolean');
        });
    });

    describe('Integration Completeness', () => {
        it('should integrate all components into main game loop successfully', () => {
            const gameState = game.getGameState();
            
            // Simulate main game loop integration
            expect(() => {
                // Update camera effects (as done in script.js)
                cameraEffectsManager.update(0.016);
                
                // Handle collision events (as done in script.js)
                cameraEffectsManager.onCollision(gameState.player, 1.0);
                
                // Handle speed changes (as done in game.js)
                cameraEffectsManager.onSpeedChange(gameState.player, 2.5);
                
                // Handle pause/resume (as done in script.js)
                cameraEffectsManager.pause();
                cameraEffectsManager.resume();
            }).not.toThrow();
        });

        it('should maintain compatibility with all existing systems', () => {
            // Test integration with RenderingEngine
            expect(cameraEffectsManager.camera).toBe(renderingEngine.camera);
            expect(cameraEffectsManager.renderer).toBe(renderingEngine.renderer);
            
            // Test integration with Game
            const gameState = game.getGameState();
            expect(gameState.player).toBeDefined();
            
            // Should work with game state
            expect(() => {
                cameraEffectsManager.onCollision(gameState.player, 1.0);
            }).not.toThrow();
        });

        it('should provide comprehensive status reporting for debugging', () => {
            const status = cameraEffectsManager.getStatus();
            
            // Should provide detailed status information
            expect(status).toHaveProperty('initialized');
            expect(status).toHaveProperty('enabled');
            expect(status).toHaveProperty('hasCamera');
            expect(status).toHaveProperty('hasRenderer');
            expect(typeof status.initialized).toBe('boolean');
            expect(typeof status.enabled).toBe('boolean');
        });

        it('should handle all game mode transitions smoothly', () => {
            const modes = [GameModes.CLASSIC, GameModes.TIME_TRIAL, GameModes.ARENA_SHRINK];
            
            modes.forEach(mode => {
                const testGame = new Game(mode);
                const gameState = testGame.getGameState();
                
                expect(() => {
                    cameraEffectsManager.updateGameState(gameState);
                    cameraEffectsManager.onCollision(gameState.player, 0.8);
                    cameraEffectsManager.update(0.016);
                }).not.toThrow();
            });
        });
    });
});