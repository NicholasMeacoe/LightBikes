/**
 * Integration tests for CameraEffectsManager with existing LightBikes systems
 * Tests the integration points with RenderingEngine and game loop
 */

jest.mock('@/utils/Logger.js', () => {
    const mockLoggerInstance = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    };
    const MockLoggerClass = jest.fn(() => mockLoggerInstance);
    MockLoggerClass.create = jest.fn(() => mockLoggerInstance);
    return {
        Logger: MockLoggerClass,
        logger: mockLoggerInstance,
        createLogger: jest.fn(() => mockLoggerInstance),
    };
});

// Setup global THREE mock BEFORE requiring anything that uses it
global.THREE = {
    Scene: class {
        constructor() {
            this.background = null;
            this.add = jest.fn();
            this.remove = jest.fn();
        }
    },
    PerspectiveCamera: class {
        constructor() {
            this.position = {
                x: 0,
                y: 20,
                z: 20,
                set: jest.fn(),
                clone: function () {
                    return { x: this.x, y: this.y, z: this.z };
                },
                copy: jest.fn(),
            };
            this.aspect = 1;
            this.updateProjectionMatrix = jest.fn();
            this.lookAt = jest.fn();
        }
    },
    WebGLRenderer: class {
        constructor() {
            this.domElement = document.createElement('canvas');
            this.setSize = jest.fn();
            this.setClearColor = jest.fn();
            this.render = jest.fn();
            this.getPixelRatio = jest.fn(() => 1);
            this.getSize = jest.fn((target) => {
                if (target) {
                    target.set(800, 600);
                    return target;
                }
                return { width: 800, height: 600 };
            });
        }
    },
    Vector3: class {
        constructor(x = 0, y = 0, z = 0) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.set = jest.fn();
            this.clone = function () {
                return new global.THREE.Vector3(this.x, this.y, this.z);
            };
            this.copy = jest.fn();
        }
    },
    Vector2: class {
        constructor(x = 0, y = 0) {
            this.x = x;
            this.y = y;
            this.set = jest.fn();
            this.clone = function () {
                return new global.THREE.Vector2(this.x, this.y);
            };
            this.copy = jest.fn();
        }
    },
    Color: jest.fn(() => ({})),
    BoxGeometry: jest.fn(() => ({})),
    SphereGeometry: jest.fn(() => ({})),
    MeshBasicMaterial: jest.fn(() => ({})),
    MeshLambertMaterial: jest.fn(() => ({ dispose: jest.fn() })),
    Mesh: class {
        constructor() {
            this.position = new global.THREE.Vector3();
            this.visible = true;
            this.userData = {};
            this.geometry = { dispose: jest.fn() };
            this.material = { dispose: jest.fn() };
        }
    },
    AmbientLight: jest.fn(() => ({})),
    DirectionalLight: class {
        constructor() {
            this.position = new global.THREE.Vector3();
        }
    },
    GridHelper: jest.fn(() => ({})),
    BoxHelper: jest.fn(() => ({})),
    InstancedMesh: class {
        constructor() {
            this.instanceMatrix = { setUsage: jest.fn(), needsUpdate: false };
            this.dispose = jest.fn();
            this.setMatrixAt = jest.fn();
        }
    },
    Matrix4: class {
        constructor() {
            this.makeScale = jest.fn();
            this.makeTranslation = jest.fn();
        }
    },
    EffectComposer: class {
        constructor() {
            this.setSize = jest.fn();
            this.addPass = jest.fn();
            this.render = jest.fn();
        }
    },
    RenderPass: jest.fn(),
    ShaderPass: jest.fn(),
    UniformsUtils: { clone: jest.fn((u) => u) },
};
window.THREE = global.THREE;

describe('CameraEffectsManager Integration', () => {
    let Game, RenderingEngine, CameraEffectsManager;
    let game, renderingEngine, cameraEffectsManager;

    beforeEach(() => {
        jest.resetModules();

        Game = require('@/core/game.js').Game;
        RenderingEngine = require('@/rendering/renderer.js').RenderingEngine;
        CameraEffectsManager = require('@/effects/CameraEffectsManager.js').CameraEffectsManager;

        game = new Game();
        renderingEngine = new RenderingEngine(game.bounds);
        cameraEffectsManager = new CameraEffectsManager(
            renderingEngine.camera,
            renderingEngine.renderer,
            game.getGameState()
        );

        jest.clearAllMocks();
    });

    it('should initialize successfully', () => {
        const result = cameraEffectsManager.initialize();
        expect(result).toBe(true);
        expect(cameraEffectsManager.camera).toBe(renderingEngine.camera);
    });

    it('should update successfully', () => {
        cameraEffectsManager.initialize();
        expect(() => {
            cameraEffectsManager.update(0.016);
        }).not.toThrow();
    });
});
