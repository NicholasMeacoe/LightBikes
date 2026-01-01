/**
 * Final validation for CameraEffectsManager integration
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

// Setup global THREE mock
global.THREE = {
    Scene: class {
        add = jest.fn();
        remove = jest.fn();
    },
    PerspectiveCamera: class {
        constructor() {
            this.position = {
                set: jest.fn(),
                clone: () => ({ x: 0, y: 0, z: 0 }),
                copy: jest.fn(),
            };
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
            this.getSize = jest.fn((target) => {
                if (target) {
                    target.set(800, 600);
                    return target;
                }
                return { width: 800, height: 600 };
            });
            this.getPixelRatio = jest.fn(() => 1);
        }
    },
    Vector3: class {
        set = jest.fn();
        clone = () => ({ x: 0, y: 0, z: 0 });
        copy = jest.fn();
    },
    Vector2: class {
        set = jest.fn();
        clone = () => ({ x: 0, y: 0 });
        copy = jest.fn();
    },
    Matrix4: class {
        makeScale = jest.fn();
        makeTranslation = jest.fn();
    },
    Color: jest.fn(() => ({})),
    BoxGeometry: jest.fn(() => ({})),
    SphereGeometry: jest.fn(() => ({})),
    MeshBasicMaterial: jest.fn(() => ({})),
    MeshLambertMaterial: jest.fn(() => ({ dispose: jest.fn() })),
    Mesh: class {
        constructor() {
            this.position = { set: jest.fn(), copy: jest.fn() };
        }
    },
    InstancedMesh: class {
        constructor() {
            this.instanceMatrix = { setUsage: jest.fn(), needsUpdate: false };
            this.dispose = jest.fn();
            this.setMatrixAt = jest.fn();
        }
    },
    Float32BufferAttribute: class {},
    BufferGeometry: class {
        constructor() {
            this.setAttribute = jest.fn();
            this.dispose = jest.fn();
        }
    },
    LineBasicMaterial: class {
        constructor() {
            this.dispose = jest.fn();
        }
    },
    LineSegments: class {
        constructor() {
            this.geometry = { dispose: jest.fn() };
            this.material = { dispose: jest.fn() };
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

describe('Camera Effects Final Integration', () => {
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

    it('should initialize and render successfully', () => {
        cameraEffectsManager.initialize();
        cameraEffectsManager.update(0.016);
        cameraEffectsManager.render(renderingEngine.scene, renderingEngine.camera);
    });
});
