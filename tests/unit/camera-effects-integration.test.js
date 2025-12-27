/**
 * Integration tests for CameraEffectsManager with existing LightBikes systems
 * Tests the integration points with RenderingEngine and game loop
 */

const mockLogger = {
    info: jest.fn((msg) => console.log('INFO:', msg)),
    warn: jest.fn((msg) => console.log('WARN:', msg)),
    error: jest.fn((msg, err) => console.log('ERROR:', msg, err)),
    debug: jest.fn(),
};

const MockLoggerClass = jest.fn().mockImplementation(() => mockLogger);
MockLoggerClass.create = jest.fn((namespace) => mockLogger);

jest.mock('@/utils/Logger.js', () => ({
    Logger: MockLoggerClass,
    logger: mockLogger,
    createLogger: jest.fn(() => mockLogger),
}));

jest.mock('../../src/utils/PerformanceDegradationManager.js', () => ({
    PerformanceDegradationManager: class {
        constructor() {
            this.monitor = {
                getPerformanceMetrics: () => ({
                    frameCount: 100,
                    currentFPS: 60,
                    averageFPS: 60,
                }),
                getAverageFPS: () => 60,
            };
            this.detector = { capabilities: { webglSupported: true } };
            this.capabilities = { webglSupported: true };
        }
        initialize() {
            return true;
        }
        update() {}
        shouldEnableEffects() {
            return true;
        }
        getDegradationLevel() {
            return 0;
        }
        handleError() {}
        getDegradationState() {
            return {
                currentLevel: 0,
                effectsEnabled: true,
                parameters: {},
            };
        }
        getCapabilitiesSummary() {
            return { webglSupported: true };
        }
        shouldEnableShake() {
            return true;
        }
        shouldEnableMotionBlur() {
            return true;
        }
        setDegradationLevel() {}
    },
}));
// Removing PerformanceMonitor mock as it is no longer needed
jest.unmock('../../src/utils/PerformanceMonitor.js');

const { CameraEffectsManager } = require('@/effects/CameraEffectsManager.js');
const { RenderingEngine } = require('@/rendering/renderer.js');
const { Game } = require('@/core/game.js');

// Mock THREE.js for testing
global.THREE = {
    MeshBasicMaterial: jest.fn().mockImplementation(() => ({})),
    SphereGeometry: jest.fn().mockImplementation(() => ({})),
    Scene: jest.fn(() => ({
        background: null,
        add: jest.fn(),
        remove: jest.fn(),
    })),
    PerspectiveCamera: jest.fn(() => ({
        position: {
            x: 0,
            y: 20,
            z: 20,
            set: jest.fn(),
            clone: () => ({ x: 0, y: 20, z: 20 }),
            copy: jest.fn(),
        },
        aspect: 1,
        updateProjectionMatrix: jest.fn(),
        lookAt: jest.fn(),
    })),
    WebGLRenderer: jest.fn(() => ({
        domElement: document.createElement('canvas'),
        setSize: jest.fn(),
        getSize: jest.fn((target) => {
            if (target) {
                target.set(800, 600);
                return target;
            }
            return { width: 800, height: 600 };
        }),
        getPixelRatio: jest.fn(() => 1),
        setClearColor: jest.fn(),
        render: jest.fn(),
    })),
    AmbientLight: jest.fn(() => ({})),
    DirectionalLight: jest.fn(() => ({
        position: { set: jest.fn() },
    })),
    GridHelper: jest.fn(() => ({})),
    BoxHelper: jest.fn(() => ({})),
    BoxGeometry: jest.fn(() => ({})),
    Mesh: jest.fn(() => ({
        position: { x: 0, y: 0, z: 0 },
        visible: true,
        userData: {},
        geometry: { dispose: jest.fn() },
        material: { dispose: jest.fn() },
    })),
    Color: jest.fn(() => ({})),
    Vector3: jest.fn(() => ({
        x: 0,
        y: 0,
        z: 0,
        clone: () => ({ x: 0, y: 0, z: 0 }),
        copy: jest.fn(),
        set: jest.fn(),
    })),
    MeshLambertMaterial: jest.fn(() => ({
        dispose: jest.fn(),
    })),
    Float32BufferAttribute: jest.fn(() => ({})),
    BufferGeometry: jest.fn(() => ({
        setAttribute: jest.fn(),
        dispose: jest.fn(),
    })),
    LineBasicMaterial: jest.fn(() => ({
        dispose: jest.fn(),
    })),
    LineSegments: jest.fn(() => ({
        geometry: { dispose: jest.fn() },
        material: { dispose: jest.fn() },
    })),
    InstancedMesh: jest.fn(() => ({
        instanceMatrix: {
            setUsage: jest.fn(),
            setMatrixAt: jest.fn(),
        },
        dispose: jest.fn(),
        setMatrixAt: jest.fn(),
    })),
    Matrix4: jest.fn(() => ({
        makeScale: jest.fn(),
        makeTranslation: jest.fn(),
    })),
    EffectComposer: jest.fn(() => ({
        setSize: jest.fn(),
        addPass: jest.fn(),
        render: jest.fn(),
    })),
    Vector2: jest.fn(() => ({
        x: 0,
        y: 0,
        set: jest.fn(),
        clone: function () {
            return new global.THREE.Vector2();
        },
        copy: jest.fn(),
    })),
    RenderPass: jest.fn(),
    ShaderPass: jest.fn(),
    UniformsUtils: { clone: jest.fn((u) => u) },
};
window.THREE = global.THREE;

// Top level spy removed
// Mocks are handled in beforeAll

// Removed top-level spy
// Mock document.createElement to return mock canvas
// const originalCreateElement = document.createElement.bind(document);
// jest.spyOn(document, 'createElement').mockImplementation...

// Remove module mocks
jest.unmock('../../src/effects/MotionBlurController.js');
jest.unmock('../../src/effects/CameraEffectsErrorHandler.js');

// Mock body appendChild
jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});

// Mock window for resize events
// Mock window properties
Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });
Object.defineProperty(window, 'devicePixelRatio', { writable: true, configurable: true, value: 1 });
window.matchMedia = jest.fn(() => ({
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn(),
}));
window.THREE = global.THREE;
window.performance = global.performance;

describe('CameraEffectsManager Integration', () => {
    let game;
    let renderingEngine;
    let cameraEffectsManager;

    beforeEach(() => {
        // Initialize game and rendering engine
        game = new Game();
        renderingEngine = new RenderingEngine(game.bounds);
        cameraEffectsManager = new CameraEffectsManager(
            renderingEngine.camera,
            renderingEngine.renderer,
            game.getGameState()
        );

        jest.clearAllMocks();
    });

    // Mock document.createElement within beforeAll to ensure it attaches to the correct instance
    beforeAll(() => {
        const originalCreateElement = document.createElement.bind(document);
        const mockCreateElement = (tag) => {
            console.log('OVERWRITE creating element:', tag);
            if (tag === 'canvas') {
                // Create a real canvas element so it passes instanceof Node checks
                const canvas = originalCreateElement(tag);

                // Override getContext on the instance
                canvas.getContext = jest.fn((contextId) => {
                    console.log('MOCK getContext called for:', contextId);
                    if (contextId === 'webgl' || contextId === 'experimental-webgl') {
                        const gl = {
                            // Constants
                            MAX_TEXTURE_SIZE: 0x0d33,
                            MAX_RENDERBUFFER_SIZE: 0x84e8,

                            // Methods
                            getParameter: jest.fn((param) => {
                                if (param === 0x0d33) return 4096;
                                if (param === 0x1f01) return 'NVIDIA GeForce RTX 3080';
                                if (param === 0x84e8) return 4096;
                                return 0;
                            }),
                            getExtension: jest.fn((name) => {
                                if (
                                    name === 'OES_texture_float' ||
                                    name === 'OES_texture_half_float' ||
                                    name === 'WEBGL_depth_texture'
                                ) {
                                    return {};
                                }
                                return null;
                            }),
                            createShader: jest.fn(),
                            shaderSource: jest.fn(),
                            compileShader: jest.fn(),
                            getShaderParameter: jest.fn(() => true),
                            createProgram: jest.fn(),
                            attachShader: jest.fn(),
                            linkProgram: jest.fn(),
                            getProgramParameter: jest.fn(() => true),
                            useProgram: jest.fn(),
                            createBuffer: jest.fn(),
                            bindBuffer: jest.fn(),
                            bufferData: jest.fn(),
                            enableVertexAttribArray: jest.fn(),
                            vertexAttribPointer: jest.fn(),
                            clearColor: jest.fn(),
                            clear: jest.fn(),
                            drawArrays: jest.fn(),
                            viewport: jest.fn(),
                            canvas: { width: 800, height: 600 },
                        };
                        return gl;
                    }
                    return null;
                });
                return canvas;
            }
            return originalCreateElement(tag);
        };

        // Aggressively overwrite both
        try {
            document.createElement = jest.fn(mockCreateElement);
        } catch (e) {
            console.log('Failed to overwrite document.createElement:', e);
        }

        try {
            if (window.document) {
                window.document.createElement = document.createElement;
            }
        } catch (e) {
            console.log('Failed to overwrite window.document.createElement:', e);
        }

        // Verify spy works immediately
        console.log(
            'Overwrite verification:',
            document.createElement('canvas').getContext('webgl') ? 'SUCCESS' : 'FAILURE'
        );
    });

    afterAll(() => {
        jest.restoreAllMocks();
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
                x: 0,
                y: 20,
                z: 20,
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
            cameraEffectsManager.update(0.02);

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
                z: gameState.player.z,
            };

            expect(() => {
                cameraEffectsManager.onCollision(playerEntity, 0.8);
            }).not.toThrow();
        });

        it('should handle near-miss events with proper distance validation', () => {
            const aiEntity = {
                id: 'ai_1',
                x: 5,
                y: 0,
                z: 5,
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
                x: 0,
                y: 0,
                z: 0,
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
    describe('settings integration', () => {
        beforeEach(() => {
            cameraEffectsManager.initialize();
        });

        it('should propagate settings changes to all components simultaneously', () => {
            const newSettings = {
                shakeEnabled: false,
                shakeIntensity: 0.5,
                motionBlurEnabled: false,
                motionBlurQuality: 'low',
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
                accessibilityMode: true,
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
                matches: true,
            }));

            const settings = {
                respectSystemPreferences: true,
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
});
