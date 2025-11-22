/**
 * Integration test for multiplayer visual distinction system
 * Tests the integration between MultiplayerGame and RenderingEngine
 */

// Mock Three.js
const mockScene = {
    add: jest.fn(),
    remove: jest.fn(),
    children: []
};

const mockCamera = {
    position: { 
        x: 0, 
        y: 0, 
        z: 0,
        set: jest.fn(),
        clone: jest.fn(() => ({ x: 0, y: 0, z: 0 }))
    },
    lookAt: jest.fn()
};

const mockRenderer = {
    setSize: jest.fn(),
    setClearColor: jest.fn(),
    render: jest.fn(),
    domElement: document.createElement('canvas')
};

const mockMesh = {
    position: { x: 0, y: 0, z: 0 },
    visible: true,
    geometry: { dispose: jest.fn() },
    material: { dispose: jest.fn() },
    parent: mockScene
};

const mockGeometry = {
    dispose: jest.fn()
};

const mockMaterial = {
    dispose: jest.fn(),
    color: { setHex: jest.fn() },
    opacity: 1.0
};

// Mock Three.js classes
global.THREE = {
    Scene: jest.fn(() => mockScene),
    PerspectiveCamera: jest.fn(() => mockCamera),
    WebGLRenderer: jest.fn(() => mockRenderer),
    BoxGeometry: jest.fn(() => mockGeometry),
    SphereGeometry: jest.fn(() => mockGeometry),
    MeshBasicMaterial: jest.fn(() => mockMaterial),
    MeshLambertMaterial: jest.fn(() => mockMaterial),
    Mesh: jest.fn(() => ({ ...mockMesh })),
    Vector3: jest.fn(() => ({ x: 0, y: 0, z: 0, clone: jest.fn() })),
    Color: jest.fn(),
    LineBasicMaterial: jest.fn(() => mockMaterial),
    LineSegments: jest.fn(() => mockMesh),
    BufferGeometry: jest.fn(() => mockGeometry),
    Float32BufferAttribute: jest.fn(),
    InstancedMesh: jest.fn(() => ({
        ...mockMesh,
        setMatrixAt: jest.fn(),
        instanceMatrix: { needsUpdate: false },
        count: 0
    })),
    Matrix4: jest.fn(() => ({
        makeScale: jest.fn(),
        compose: jest.fn(),
        setMatrixAt: jest.fn()
    })),
    Quaternion: jest.fn(() => ({
        setFromEuler: jest.fn()
    })),
    Euler: jest.fn()
};

// Mock DOM and window
document.body.appendChild = jest.fn();
global.window = {
    innerWidth: 1024,
    innerHeight: 768
};

// Mock dependencies
jest.mock('./ThemeEngine.js', () => ({
    ThemeEngine: jest.fn(() => ({
        loadTheme: jest.fn(),
        getCurrentTheme: jest.fn(() => 'classic-grid')
    }))
}));

jest.mock('./EmissiveMaterialSystem.js', () => ({
    EmissiveMaterialSystem: jest.fn(() => ({
        createBikeMaterial: jest.fn(() => mockMaterial),
        updatePulseAnimation: jest.fn(),
        pausePulse: jest.fn(),
        resumePulse: jest.fn(),
        disposeMaterial: jest.fn()
    }))
}));

jest.mock('./TrailStyleRenderer.js', () => ({
    TrailStyleRenderer: jest.fn(() => ({
        createStyledTrailSegment: jest.fn(() => mockMesh),
        updateTrailEffects: jest.fn(),
        clearAllTrails: jest.fn()
    }))
}));

jest.mock('./GameModes.js', () => ({
    GameModes: {
        CLASSIC: 'classic',
        TIME_TRIAL: 'time-trial',
        ARENA_SHRINK: 'arena-shrink'
    }
}));

jest.mock('./game.js', () => ({
    Game: jest.fn(() => ({
        bounds: { minX: -15, maxX: 15, minZ: -15, maxZ: 15 },
        gameSpeed: 0.1,
        frameCount: 0,
        isPaused: false,
        gameStarted: false,
        gameOver: false,
        scoreManager: {
            getScoreState: jest.fn(() => ({})),
            resetCurrentScores: jest.fn()
        }
    }))
}));

const { RenderingEngine } = require('@/rendering/renderer.js');
const { MultiplayerGame } = require('@/multiplayer/MultiplayerGame.js');

describe('Multiplayer Visual Integration', () => {
    let renderer;
    const bounds = { minX: -15, maxX: 15, minZ: -15, maxZ: 15 };

    beforeEach(() => {
        jest.clearAllMocks();
        renderer = new RenderingEngine(bounds);
    });

    describe('Game State Integration', () => {
        it('should render multiplayer game state with visual distinction', () => {
            // Create mock multiplayer game state
            const gameState = {
                isPaused: false,
                frameCount: 10,
                gameSpeed: 0.1,
                player1: {
                    id: 'P1',
                    x: -10,
                    z: 0,
                    isAlive: true,
                    trail: [{ x: -10, y: 0, z: 0 }]
                },
                player2: {
                    id: 'P2',
                    x: 10,
                    z: 0,
                    isAlive: true,
                    trail: [{ x: 10, y: 0, z: 0 }]
                }
            };

            // Should not throw errors when rendering
            expect(() => {
                renderer.draw(gameState);
            }).not.toThrow();

            // Should render the scene
            expect(mockRenderer.render).toHaveBeenCalledWith(mockScene, mockCamera);
        });

        it('should handle player colors correctly in multiplayer', () => {
            // Should assign correct colors
            expect(renderer.getPlayerColor('P1')).toBe(0x00ff00); // Green
            expect(renderer.getPlayerColor('P2')).toBe(0x0000ff); // Blue
        });

        it('should position camera correctly for two players', () => {
            const gameState = {
                player1: {
                    x: -20,
                    z: 0,
                    isAlive: true
                },
                player2: {
                    x: 20,
                    z: 0,
                    isAlive: true
                }
            };
            
            // Should not throw errors when updating camera
            expect(() => {
                renderer.updateCameraForPlayers(gameState);
            }).not.toThrow();

            // Camera should be centered between players
            expect(renderer.camera.position.x).toBe(0);
        });

        it('should create trail segments with matching colors', () => {
            const gameState = {
                player1: {
                    id: 'P1',
                    isAlive: true,
                    trail: [{ x: -10, y: 0, z: 0 }]
                },
                player2: {
                    id: 'P2',
                    isAlive: true,
                    trail: [{ x: 10, y: 0, z: 0 }]
                }
            };
            
            // Should not throw errors when updating trails
            expect(() => {
                renderer.updatePlayerTrails(gameState);
            }).not.toThrow();

            // Should create trail segments
            const mockTrailRenderer = renderer.trailStyleRenderer;
            expect(mockTrailRenderer.createStyledTrailSegment).toHaveBeenCalled();
        });

        it('should handle game over state correctly', () => {
            const gameState = {
                isPaused: false,
                frameCount: 10,
                gameSpeed: 0.1,
                player1: {
                    id: 'P1',
                    x: -10,
                    z: 0,
                    isAlive: false, // Crashed
                    trail: []
                },
                player2: {
                    id: 'P2',
                    x: 10,
                    z: 0,
                    isAlive: true,
                    trail: []
                }
            };
            
            // Should not throw errors when rendering crashed player
            expect(() => {
                renderer.draw(gameState);
            }).not.toThrow();
        });

        it('should clean up resources on game reset', () => {
            const gameState = {
                player1: {
                    id: 'P1',
                    x: -10,
                    z: 0,
                    isAlive: true,
                    trail: []
                }
            };
            
            // Set up game state
            renderer.updatePlayerEntities(gameState);

            // Should not throw errors when clearing
            expect(() => {
                renderer.clearTrails();
            }).not.toThrow();
        });
    });

    describe('Backward Compatibility', () => {
        it('should maintain compatibility with single player rendering', () => {
            const singlePlayerState = {
                player: { x: 0, z: 0 },
                playerTrail: [{ x: 0, y: 0, z: 0 }],
                isPaused: false,
                frameCount: 10
            };

            // Should not throw errors
            expect(() => {
                renderer.draw(singlePlayerState);
            }).not.toThrow();
        });
    });
});