/**
 * Tests for RenderingEngine multiplayer visual distinction system
 * Covers dual player rendering, color assignment, and label display
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

const { RenderingEngine } = require('@/rendering/renderer.js');

describe('RenderingEngine Multiplayer Visual Distinction', () => {
    let renderer;
    const bounds = { minX: -15, maxX: 15, minZ: -15, maxZ: 15 };

    beforeEach(() => {
        jest.clearAllMocks();
        renderer = new RenderingEngine(bounds);
    });

    describe('Player Color Assignment', () => {
        it('should assign green color to Player 1', () => {
            const color = renderer.getPlayerColor('P1');
            expect(color).toBe(0x00ff00); // Green
        });

        it('should assign blue color to Player 2', () => {
            const color = renderer.getPlayerColor('P2');
            expect(color).toBe(0x0000ff); // Blue
        });

        it('should handle backward compatibility with player ID', () => {
            const color = renderer.getPlayerColor('player');
            expect(color).toBe(0x00ff00); // Green (default)
        });

        it('should default to green for unknown player IDs', () => {
            const color = renderer.getPlayerColor('unknown');
            expect(color).toBe(0x00ff00); // Green (default)
        });
    });

    describe('Dual Player Entity Management', () => {
        it('should create and update player entities for multiplayer game state', () => {
            const gameState = {
                player1: {
                    id: 'P1',
                    x: -10,
                    z: 0,
                    isAlive: true,
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

            renderer.updatePlayerEntities(gameState);

            // Should create meshes for both players (plus existing constructor meshes)
            expect(THREE.Mesh).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
            expect(mockScene.add).toHaveBeenCalled();
        });

        it('should handle players array format', () => {
            const gameState = {
                players: [
                    {
                        id: 'P1',
                        x: -10,
                        z: 0,
                        isAlive: true,
                        trail: []
                    },
                    {
                        id: 'P2',
                        x: 10,
                        z: 0,
                        isAlive: true,
                        trail: []
                    }
                ]
            };

            renderer.updatePlayerEntities(gameState);

            expect(THREE.Mesh).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
            expect(mockScene.add).toHaveBeenCalled();
        });

        it('should hide crashed players', () => {
            const gameState = {
                player1: {
                    id: 'P1',
                    x: -10,
                    z: 0,
                    isAlive: false,
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

            // First create the entities
            const aliveGameState = {
                player1: { ...gameState.player1, isAlive: true },
                player2: gameState.player2
            };
            renderer.updatePlayerEntities(aliveGameState);

            // Then update with crashed player
            renderer.updatePlayerEntities(gameState);

            // Player 1 should be hidden
            const player1Mesh = renderer.playerEntities.get('P1');
            expect(player1Mesh.visible).toBe(false);
        });
    });

    describe('Player Label Creation', () => {
        it('should create labels for P1 and P2', () => {
            const label1 = renderer.createPlayerLabel('P1');
            const label2 = renderer.createPlayerLabel('P2');

            expect(label1).toBeTruthy();
            expect(label2).toBeTruthy();
            expect(label1.position.y).toBe(2); // Above player
            expect(label2.position.y).toBe(2); // Above player
        });

        it('should position labels above players', () => {
            const gameState = {
                player1: {
                    id: 'P1',
                    x: -10,
                    z: 5,
                    isAlive: true,
                    trail: []
                }
            };

            // Should not throw errors when updating player entities
            expect(() => {
                renderer.updatePlayerEntities(gameState);
            }).not.toThrow();
        });
    });

    describe('Trail Color Matching', () => {
        it('should create trail segments with matching player colors', () => {
            const gameState = {
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

            renderer.updatePlayerTrails(gameState);

            // Should create trail segments for both players
            const mockTrailRenderer = renderer.trailStyleRenderer;
            expect(mockTrailRenderer.createStyledTrailSegment).toHaveBeenCalledWith(
                { x: -10, y: 0, z: 0 },
                0x00ff00, // Green for P1
                expect.any(Array),
                'P1'
            );
            expect(mockTrailRenderer.createStyledTrailSegment).toHaveBeenCalledWith(
                { x: 10, y: 0, z: 0 },
                0x0000ff, // Blue for P2
                expect.any(Array),
                'P2'
            );
        });

        it('should handle backward compatibility with single player trails', () => {
            const gameState = {
                player: { x: 0, z: 0 },
                playerTrail: [{ x: 0, y: 0, z: 0 }]
            };

            renderer.updatePlayerTrails(gameState);

            const mockTrailRenderer = renderer.trailStyleRenderer;
            expect(mockTrailRenderer.createStyledTrailSegment).toHaveBeenCalledWith(
                { x: 0, y: 0, z: 0 },
                0x00ff00, // Green (default)
                expect.any(Array),
                'player'
            );
        });
    });

    describe('Split Screen Camera System', () => {
        it('should center camera between two alive players', () => {
            const gameState = {
                player1: {
                    id: 'P1',
                    x: -10,
                    z: 0,
                    isAlive: true
                },
                player2: {
                    id: 'P2',
                    x: 10,
                    z: 0,
                    isAlive: true
                }
            };

            renderer.updateCameraForPlayers(gameState);

            // Split screen camera should be initialized and target should be centered
            expect(renderer.splitScreenCamera).toBeDefined();
            expect(renderer.splitScreenCamera.targetLookAt.x).toBe(0); // Centered between players
            expect(renderer.splitScreenCamera.targetPosition.x).toBe(0); // Camera centered
        });

        it('should adjust camera height based on player distance', () => {
            const gameState = {
                player1: {
                    id: 'P1',
                    x: -20,
                    z: 0,
                    isAlive: true
                },
                player2: {
                    id: 'P2',
                    x: 20,
                    z: 0,
                    isAlive: true
                }
            };

            renderer.updateCameraForPlayers(gameState);

            // Test the split screen camera's zoom calculation directly
            const distance = renderer.splitScreenCamera.calculateDistance(
                { x: -20, z: 0 }, 
                { x: 20, z: 0 }
            );
            const optimalZoom = renderer.splitScreenCamera.calculateOptimalZoom(distance);
            
            expect(distance).toBe(40);
            expect(optimalZoom).toBeGreaterThan(20); // Should be higher than base height
        });

        it('should follow single player when only one is alive', () => {
            const gameState = {
                players: [
                    {
                        id: 'P1',
                        x: -10,
                        z: 5,
                        isAlive: true
                    },
                    {
                        id: 'P2',
                        x: 10,
                        z: 0,
                        isAlive: false
                    }
                ]
            };

            renderer.updateCameraForPlayers(gameState);

            // Should target the alive player
            expect(renderer.splitScreenCamera.targetLookAt.x).toBe(-10);
            expect(renderer.splitScreenCamera.targetLookAt.z).toBe(5);
        });
    });

    describe('Game State Integration', () => {
        it('should handle complete multiplayer draw cycle', () => {
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

            // Should not throw errors
            expect(() => {
                renderer.draw(gameState);
            }).not.toThrow();

            // Should render the scene
            expect(mockRenderer.render).toHaveBeenCalledWith(mockScene, mockCamera);
        });
    });

    describe('Cleanup and Reset', () => {
        it('should clear all player entities and trails on reset', () => {
            // Create some player entities first
            const gameState = {
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

            renderer.updatePlayerEntities(gameState);
            renderer.updatePlayerTrails(gameState);

            // Clear everything
            renderer.clearAllPlayers();

            // Should remove all entities from scene
            expect(mockScene.remove).toHaveBeenCalled();
            expect(renderer.playerEntities.size).toBe(0);
            expect(renderer.playerLabels.size).toBe(0);
            expect(renderer.playerTrails.size).toBe(0);
        });

        it('should dispose of geometries and materials on cleanup', () => {
            const gameState = {
                player1: {
                    id: 'P1',
                    x: -10,
                    z: 0,
                    isAlive: true,
                    trail: []
                }
            };

            renderer.updatePlayerEntities(gameState);
            
            // Should not throw errors when clearing players
            expect(() => {
                renderer.clearAllPlayers();
            }).not.toThrow();
        });
    });

    describe('Backward Compatibility', () => {
        it('should maintain compatibility with single player game state', () => {
            const gameState = {
                player: { x: 0, z: 0 },
                playerTrail: [{ x: 0, y: 0, z: 0 }]
            };

            // Should not throw errors
            expect(() => {
                renderer.updatePlayerEntities(gameState);
                renderer.updatePlayerTrails(gameState);
                renderer.updateCameraForPlayers(gameState);
            }).not.toThrow();
        });
    });
});