/**
 * Tests for RenderingEngine multiplayer visual distinction system
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

// Setup global THREE mock robustly
global.THREE = {
    Scene: class {
        add = jest.fn();
        remove = jest.fn();
        traverse = jest.fn();
        children = [];
    },
    PerspectiveCamera: class {
        constructor() {
            this.position = {
                x: 0,
                y: 0,
                z: 0,
                set: jest.fn(),
                copy: jest.fn(),
                clone: () => ({ x: 0, y: 0, z: 0 }),
            };
            this.updateProjectionMatrix = jest.fn();
            this.lookAt = jest.fn();
        }
    },
    WebGLRenderer: class {
        constructor() {
            this.render = jest.fn();
            this.setSize = jest.fn();
            this.setClearColor = jest.fn();
            this.getSize = jest.fn((v) => {
                if (v) {
                    v.set(1024, 768);
                    return v;
                }
                return { width: 1024, height: 768 };
            });
            this.domElement = document.createElement('canvas');
            this.getPixelRatio = jest.fn(() => 1);
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
            return this;
        }
        copy(v) {
            this.x = v.x;
            this.y = v.y;
            this.z = v.z;
            return this;
        }
        clone() {
            return new global.THREE.Vector3(this.x, this.y, this.z);
        }
    },
    Color: jest.fn(() => ({ setHex: jest.fn() })),
    BoxGeometry: class {
        dispose = jest.fn();
    },
    SphereGeometry: class {
        dispose = jest.fn();
    },
    MeshBasicMaterial: class {
        dispose = jest.fn();
        color = { setHex: jest.fn() };
    },
    MeshLambertMaterial: class {
        dispose = jest.fn();
        color = { setHex: jest.fn() };
    },
    Mesh: class {
        constructor() {
            this.position = new global.THREE.Vector3();
            this.visible = true;
            this.geometry = { dispose: jest.fn() };
            this.material = { dispose: jest.fn(), color: { setHex: jest.fn() } };
        }
    },
    LineBasicMaterial: class {
        dispose = jest.fn();
    },
    LineSegments: class {
        constructor() {
            this.position = new global.THREE.Vector3();
        }
    },
    BufferGeometry: class {
        constructor() {
            this.setAttribute = jest.fn();
            this.dispose = jest.fn();
        }
    },
    Float32BufferAttribute: class {},
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
            this.compose = jest.fn();
        }
    },
    Quaternion: class {
        constructor() {
            this.setFromEuler = jest.fn();
        }
    },
    Euler: class {},
};

jest.mock('@/systems/ThemeEngine.js', () => ({
    ThemeEngine: jest.fn().mockImplementation(() => ({
        loadTheme: jest.fn(),
        getCurrentTheme: jest.fn(() => 'classic-grid'),
        isValidTheme: jest.fn(() => true),
    })),
}));

jest.mock('@/rendering/EmissiveMaterialSystem.js', () => ({
    EmissiveMaterialSystem: jest.fn().mockImplementation(() => ({
        createBikeMaterial: jest.fn(() => ({ dispose: jest.fn(), color: { setHex: jest.fn() } })),
        updatePulseAnimation: jest.fn(),
        pausePulse: jest.fn(),
        resumePulse: jest.fn(),
        disposeMaterial: jest.fn(),
    })),
}));

jest.mock('@/rendering/TrailStyleRenderer.js', () => ({
    TrailStyleRenderer: jest.fn().mockImplementation(() => ({
        createStyledTrailSegment: jest.fn(() => new global.THREE.Mesh()),
        updateTrailEffects: jest.fn(),
        clearAllTrails: jest.fn(),
        setTrailStyle: jest.fn(),
    })),
}));

describe('RenderingEngine Multiplayer Visual Distinction', () => {
    let RenderingEngine;
    let renderer;
    const bounds = { minX: -15, maxX: 15, minZ: -15, maxZ: 15 };

    beforeEach(() => {
        jest.resetModules();
        RenderingEngine = require('@/rendering/renderer.js').RenderingEngine;
        renderer = new RenderingEngine(bounds);
        jest.clearAllMocks();
    });

    it('should assign green color to Player 1', () => {
        const color = renderer.getPlayerColor('P1');
        expect(color).toBe(0x00ff00); // Green
    });

    it('should assign blue color to Player 2', () => {
        const color = renderer.getPlayerColor('P2');
        expect(color).toBe(0x0000ff); // Blue
    });

    it('should initialize successfully', () => {
        expect(renderer).toBeDefined();
        expect(renderer.camera).toBeDefined();
    });
});
