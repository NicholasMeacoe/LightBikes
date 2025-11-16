/**
 * Integration tests for CameraEffectsManager with existing LightBikes systems
 * Tests the integration points with RenderingEngine and game loop
 */

const { CameraEffectsManager } = require('./CameraEffectsManager.js');
const { RenderingEngine } = require('./renderer.js');
const { Game } = require('./game.js');

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
    }))
};

// Mock document for DOM operations
global.document = {
    body: {
        appendChild: jest.fn()
    },
    createElement: jest.fn(() => ({
        getContext: jest.fn(() => null)
    }))
};

// Mock window for resize events
global.window = {
    innerWidth: 1024,
    innerHeight: 768
};

describe('CameraEffectsManager Integration', () => {
    let game;
    let renderingEngine;
    let cameraEffectsManager;

    beforeEach(() => {
        // Initialize game and rendering engine
        game = new Game();
        renderingEngine = new RenderingEngine(game.bounds);
        
        // Initialize camera effects manager
        cameraEffectsManager = new CameraEffectsManager(
            renderingEngine.camera,
            renderingEngine.renderer,
            game.getGameState()
        );
        
        jest.clearAllMocks();
    });

    describe('initialization integration', () => {
        it('should initialize with RenderingEngine camera and renderer', () => {
            const result = cameraEffectsManager.initialize();
            
            expect(result).toBe(true);
            expect(cameraEffectsManager.camera).toBe(renderingEngine.camera);
            expect(cameraEffectsManager.renderer).toBe(renderingEngine.renderer);
        });

        it('should store original camera position from RenderingEngine', () => {
            cameraEffectsManager.initialize();
            
            expect(cameraEffectsManager.originalCameraPosition).toEqual({
                x: 0, y: 20, z: 20
            });
        });
    });

    describe('game loop integration', () => {
        beforeEach(() => {
            cameraEffectsManager.initialize();
        });

        it('should update without errors in game loop', () => {
            const deltaTime = 0.016; // 60fps
            
            expect(() => {
                cameraEffectsManager.update(deltaTime);
            }).not.toThrow();
        });

        it('should handle pause and resume with game state', () => {
            expect(() => {
                cameraEffectsManager.pause();
                cameraEffectsManager.resume();
            }).not.toThrow();
        });

        it('should track performance metrics during updates', () => {
            cameraEffectsManager.update(0.016);
            cameraEffectsManager.update(0.020);
            
            const metrics = cameraEffectsManager.getPerformanceMetrics();
            expect(metrics.frameCount).toBeGreaterThan(0);
            expect(typeof metrics.currentFPS).toBe('number');
        });
    });

    describe('event integration', () => {
        beforeEach(() => {
            cameraEffectsManager.initialize();
        });

        it('should handle collision events from game entities', () => {
            const gameState = game.getGameState();
            const playerEntity = {
                id: 'player',
                x: gameState.player.x,
                y: gameState.player.y,
                z: gameState.player.z
            };
            
            expect(() => {
                cameraEffectsManager.onCollision(playerEntity, 0.8);
            }).not.toThrow();
        });

        it('should handle near-miss events with proper distance validation', () => {
            const aiEntity = {
                id: 'ai_1',
                x: 5, y: 0, z: 5
            };
            
            // Valid near-miss distance
            expect(() => {
                cameraEffectsManager.onNearMiss(aiEntity, 1.2);
            }).not.toThrow();
            
            // Invalid distance should be ignored (no error)
            expect(() => {
                cameraEffectsManager.onNearMiss(aiEntity, 5.0);
            }).not.toThrow();
        });

        it('should handle speed change events from power-up system', () => {
            const playerEntity = {
                id: 'player',
                x: 0, y: 0, z: 0
            };
            
            expect(() => {
                cameraEffectsManager.onSpeedChange(playerEntity, 2.5);
            }).not.toThrow();
        });
    });

    describe('camera position integration', () => {
        beforeEach(() => {
            cameraEffectsManager.initialize();
        });

        it('should not interfere with existing camera positioning', () => {
            const originalPosition = { ...renderingEngine.camera.position };
            
            // Update camera effects
            cameraEffectsManager.update(0.016);
            
            // Camera position should remain unchanged (no shake implemented yet)
            expect(renderingEngine.camera.position.x).toBe(originalPosition.x);
            expect(renderingEngine.camera.position.y).toBe(originalPosition.y);
            expect(renderingEngine.camera.position.z).toBe(originalPosition.z);
        });

        it('should reset camera position when disabled', () => {
            // Modify camera position to simulate effects
            renderingEngine.camera.position.x = 10;
            renderingEngine.camera.position.y = 25;
            renderingEngine.camera.position.z = 30;
            
            cameraEffectsManager.setEnabled(false);
            
            // Should reset to original position
            expect(renderingEngine.camera.position.x).toBe(0);
            expect(renderingEngine.camera.position.y).toBe(20);
            expect(renderingEngine.camera.position.z).toBe(20);
        });
    });

    describe('error handling integration', () => {
        beforeEach(() => {
            cameraEffectsManager.initialize();
        });

        it('should handle invalid event parameters gracefully', () => {
            // Should not throw errors with invalid parameters
            expect(() => {
                cameraEffectsManager.onCollision(null, 0.5);
                cameraEffectsManager.onNearMiss(undefined, 1.0);
                cameraEffectsManager.onSpeedChange({}, 'invalid');
            }).not.toThrow();
        });

        it('should continue functioning after errors in event handlers', () => {
            const errorHandler = jest.fn(() => {
                throw new Error('Test error');
            });
            
            cameraEffectsManager.addEventListener('collision', errorHandler);
            
            // Should not throw despite handler error
            expect(() => {
                cameraEffectsManager.onCollision({ id: 'test' }, 0.5);
            }).not.toThrow();
            
            // Should still be functional
            expect(cameraEffectsManager.isEnabled()).toBe(true);
        });
    });

    describe('cleanup integration', () => {
        beforeEach(() => {
            cameraEffectsManager.initialize();
        });

        it('should clean up resources properly on destroy', () => {
            const mockHandler = jest.fn();
            cameraEffectsManager.addEventListener('collision', mockHandler);
            
            cameraEffectsManager.destroy();
            
            expect(cameraEffectsManager.initialized).toBe(false);
            expect(cameraEffectsManager.enabled).toBe(false);
            
            // Event handlers should be cleared
            cameraEffectsManager.onCollision({ id: 'test' }, 0.5);
            expect(mockHandler).not.toHaveBeenCalled();
        });
    });

    describe('status reporting integration', () => {
        beforeEach(() => {
            cameraEffectsManager.initialize();
        });

        it('should provide comprehensive status for debugging', () => {
            const status = cameraEffectsManager.getStatus();
            
            expect(status).toHaveProperty('initialized', true);
            expect(status).toHaveProperty('enabled', true);
            expect(status).toHaveProperty('hasCamera', true);
            expect(status).toHaveProperty('hasRenderer', true);
            expect(status).toHaveProperty('eventHandlerCounts');
            expect(status).toHaveProperty('performanceMetrics');
            expect(status).toHaveProperty('subsystems');
            
            // Should show integration with RenderingEngine
            expect(status.hasCamera).toBe(true);
            expect(status.hasRenderer).toBe(true);
        });
    });
});
   
 describe('settings integration', () => {
        beforeEach(() => {
            cameraEffectsManager.initialize();
        });

        it('should propagate settings changes to all components simultaneously', () => {
            const newSettings = {
                shakeEnabled: false,
                shakeIntensity: 0.5,
                motionBlurEnabled: false,
                motionBlurQuality: 'low'
            };
            
            expect(() => {
                cameraEffectsManager.updateSettings(newSettings);
            }).not.toThrow();
            
            const status = cameraEffectsManager.getStatus();
            expect(status.subsystems.shake.enabled).toBe(false);
            expect(status.subsystems.motionBlur.enabled).toBe(false);
        });

        it('should disable all effects when accessibility mode is enabled', () => {
            const accessibilitySettings = {
                accessibilityMode: true
            };
            
            cameraEffectsManager.updateSettings(accessibilitySettings);
            
            // Trigger events that would normally cause effects
            cameraEffectsManager.onCollision({ id: 'player' }, 1.0);
            cameraEffectsManager.onSpeedChange({ id: 'player' }, 3.0);
            
            const status = cameraEffectsManager.getStatus();
            expect(status.subsystems.shake.activeEffects).toBe(0);
            expect(status.subsystems.motionBlur.intensity).toBe(0);
        });

        it('should respect system motion preferences', () => {
            // Mock system preference for reduced motion
            global.window.matchMedia = jest.fn(() => ({
                matches: true
            }));
            
            const settings = {
                respectSystemPreferences: true
            };
            
            cameraEffectsManager.updateSettings(settings);
            
            // Effects should be disabled due to system preference
            cameraEffectsManager.onCollision({ id: 'player' }, 1.0);
            
            const status = cameraEffectsManager.getStatus();
            expect(status.subsystems.shake.activeEffects).toBe(0);
        });
    });

    describe('motion blur activation integration', () => {
        beforeEach(() => {
            cameraEffectsManager.initialize();
        });

        it('should activate motion blur during speed changes', () => {
            const entity = { id: 'player', x: 0, y: 0, z: 0 };
            
            // Trigger speed change above threshold
            cameraEffectsManager.onSpeedChange(entity, 2.5);
            
            // Update to process the speed change
            cameraEffectsManager.update(0.016);
            
            const status = cameraEffectsManager.getStatus();
            expect(status.subsystems.motionBlur.intensity).toBeGreaterThan(0);
        });

        it('should deactivate motion blur when speed returns to normal', () => {
            const entity = { id: 'player', x: 0, y: 0, z: 0 };
            
            // First activate blur with high speed
            cameraEffectsManager.onSpeedChange(entity, 3.0);
            cameraEffectsManager.update(0.016);
            
            // Then return to normal speed
            cameraEffectsManager.onSpeedChange(entity, 1.0);
            
            // Update multiple times to allow blur to fade
            for (let i = 0; i < 10; i++) {
                cameraEffectsManager.update(0.016);
            }
            
            const status = cameraEffectsManager.getStatus();
            expect(status.subsystems.motionBlur.intensity).toBeLessThan(0.1);
        });
    });

    describe('camera shake coordination integration', () => {
        beforeEach(() => {
            cameraEffectsManager.initialize();
        });

        it('should coordinate camera shake with collision events', () => {
            const entity = { id: 'player', x: 5, y: 0, z: 5 };
            
            cameraEffectsManager.onCollision(entity, 0.8);
            
            const status = cameraEffectsManager.getStatus();
            expect(status.subsystems.shake.activeEffects).toBeGreaterThan(0);
        });

        it('should handle multiple simultaneous shake effects', () => {
            const player = { id: 'player', x: 0, y: 0, z: 0 };
            const ai = { id: 'ai_1', x: 5, y: 0, z: 5 };
            
            // Trigger collision and near-miss simultaneously
            cameraEffectsManager.onCollision(player, 1.0);
            cameraEffectsManager.onNearMiss(ai, 0.8);
            
            const status = cameraEffectsManager.getStatus();
            expect(status.subsystems.shake.activeEffects).toBe(2);
        });

        it('should clean up completed shake effects', () => {
            const entity = { id: 'player', x: 0, y: 0, z: 0 };
            
            // Trigger a very short shake effect
            cameraEffectsManager.onCollision(entity, 0.5);
            
            // Update for longer than the shake duration
            for (let i = 0; i < 100; i++) {
                cameraEffectsManager.update(0.016);
            }
            
            const status = cameraEffectsManager.getStatus();
            expect(status.subsystems.shake.activeEffects).toBe(0);
        });
    });