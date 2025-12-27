const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
};

const MockLoggerClass = jest.fn().mockImplementation(() => mockLogger);
MockLoggerClass.create = jest.fn((namespace) => mockLogger);

jest.mock('@/utils/Logger.js', () => ({
    Logger: MockLoggerClass,
    logger: mockLogger,
    createLogger: jest.fn(() => mockLogger),
}));

const { SplitScreenCamera } = require('@/multiplayer/SplitScreenCamera.js');

// Mock THREE.js camera
class MockCamera {
    constructor() {
        this.position = {
            x: 0,
            y: 20,
            z: 20,
            clone: () => ({ x: 0, y: 20, z: 20 }),
        };
        this.lookAtTarget = { x: 0, y: 0, z: 0 };
    }

    lookAt(x, y, z) {
        this.lookAtTarget = { x, y, z };
    }
}

describe('SplitScreenCamera', () => {
    let camera;
    let splitScreenCamera;

    beforeEach(() => {
        camera = new MockCamera();
        splitScreenCamera = new SplitScreenCamera(camera);
    });

    describe('constructor', () => {
        it('should initialize with default configuration', () => {
            expect(splitScreenCamera.camera).toBe(camera);
            expect(splitScreenCamera.minZoom).toBe(20);
            expect(splitScreenCamera.maxZoom).toBe(50);
            expect(splitScreenCamera.baseHeight).toBe(20);
            expect(splitScreenCamera.baseDistance).toBe(15);
        });

        it('should store original camera position', () => {
            expect(splitScreenCamera.originalPosition).toEqual({ x: 0, y: 20, z: 20 });
        });
    });

    describe('setPlayers', () => {
        it('should filter out non-alive players', () => {
            const players = [
                { id: 'P1', x: 0, z: 0, isAlive: true },
                { id: 'P2', x: 10, z: 10, isAlive: false },
                { id: 'P3', x: 5, z: 5, isAlive: true },
            ];

            splitScreenCamera.setPlayers(players);

            expect(splitScreenCamera.players).toHaveLength(2);
            expect(splitScreenCamera.players[0].id).toBe('P1');
            expect(splitScreenCamera.players[1].id).toBe('P3');
        });

        it('should handle empty player array', () => {
            splitScreenCamera.setPlayers([]);
            expect(splitScreenCamera.players).toHaveLength(0);
        });
    });

    describe('calculateCenterPoint', () => {
        it('should calculate center point between two positions', () => {
            const pos1 = { x: 0, z: 0 };
            const pos2 = { x: 10, z: 10 };

            const center = splitScreenCamera.calculateCenterPoint(pos1, pos2);

            expect(center).toEqual({ x: 5, z: 5 });
        });

        it('should handle negative coordinates', () => {
            const pos1 = { x: -5, z: -5 };
            const pos2 = { x: 5, z: 5 };

            const center = splitScreenCamera.calculateCenterPoint(pos1, pos2);

            expect(center).toEqual({ x: 0, z: 0 });
        });
    });

    describe('calculateDistance', () => {
        it('should calculate distance between two positions', () => {
            const pos1 = { x: 0, z: 0 };
            const pos2 = { x: 3, z: 4 };

            const distance = splitScreenCamera.calculateDistance(pos1, pos2);

            expect(distance).toBe(5); // 3-4-5 triangle
        });

        it('should handle same position', () => {
            const pos1 = { x: 5, z: 5 };
            const pos2 = { x: 5, z: 5 };

            const distance = splitScreenCamera.calculateDistance(pos1, pos2);

            expect(distance).toBe(0);
        });
    });

    describe('calculateOptimalZoom', () => {
        it('should return minimum zoom for zero distance', () => {
            const zoom = splitScreenCamera.calculateOptimalZoom(0);
            expect(zoom).toBe(splitScreenCamera.minZoom);
        });

        it('should return maximum zoom for maximum distance', () => {
            const zoom = splitScreenCamera.calculateOptimalZoom(
                splitScreenCamera.maxPlayerDistance
            );
            expect(zoom).toBe(splitScreenCamera.maxZoom);
        });

        it('should interpolate zoom for intermediate distances', () => {
            const halfDistance = splitScreenCamera.maxPlayerDistance / 2;
            const zoom = splitScreenCamera.calculateOptimalZoom(halfDistance);
            const expectedZoom = (splitScreenCamera.minZoom + splitScreenCamera.maxZoom) / 2;
            expect(zoom).toBe(expectedZoom);
        });

        it('should cap zoom at maximum for excessive distances', () => {
            const excessiveDistance = splitScreenCamera.maxPlayerDistance * 2;
            const zoom = splitScreenCamera.calculateOptimalZoom(excessiveDistance);
            expect(zoom).toBe(splitScreenCamera.maxZoom);
        });
    });

    describe('updateSinglePlayerCamera', () => {
        it('should position camera behind single player', () => {
            const player = { x: 10, z: 5, isAlive: true };
            splitScreenCamera.setPlayers([player]);

            splitScreenCamera.updateSinglePlayerCamera(player, { x: 0, y: 0, z: 0 });

            expect(splitScreenCamera.targetPosition.x).toBe(10);
            expect(splitScreenCamera.targetPosition.y).toBe(20);
            expect(splitScreenCamera.targetPosition.z).toBe(20); // 5 + 15
            expect(splitScreenCamera.targetLookAt).toEqual({ x: 10, y: 0, z: 5 });
        });
    });

    describe('updateSplitScreenCamera', () => {
        it('should position camera between two players', () => {
            const player1 = { x: 0, z: 0, isAlive: true };
            const player2 = { x: 10, z: 10, isAlive: true };

            splitScreenCamera.updateSplitScreenCamera(player1, player2, { x: 0, y: 0, z: 0 });

            // Should center between players
            expect(splitScreenCamera.targetPosition.x).toBe(5);
            expect(splitScreenCamera.targetLookAt.x).toBe(5);
            expect(splitScreenCamera.targetLookAt.z).toBe(5);

            // Should adjust zoom based on distance
            const distance = Math.sqrt(200); // ~14.14
            const expectedZoom = splitScreenCamera.calculateOptimalZoom(distance);
            expect(splitScreenCamera.targetPosition.y).toBe(expectedZoom);
        });
    });

    describe('handleBoundaryConstraints', () => {
        it('should constrain camera position to arena bounds', () => {
            const bounds = { minX: -10, maxX: 10, minZ: -10, maxZ: 10 };
            splitScreenCamera.setArenaBounds(bounds);

            // Set target position outside bounds
            splitScreenCamera.targetPosition = { x: 20, y: 25, z: 30 };
            splitScreenCamera.targetLookAt = { x: 15, y: 0, z: 15 };

            splitScreenCamera.handleBoundaryConstraints();

            // Should be constrained within bounds + padding
            expect(splitScreenCamera.targetPosition.x).toBeLessThanOrEqual(
                bounds.maxX + splitScreenCamera.boundaryPadding
            );
            expect(splitScreenCamera.targetLookAt.x).toBeLessThanOrEqual(bounds.maxX);
            expect(splitScreenCamera.targetLookAt.z).toBeLessThanOrEqual(bounds.maxZ);
        });

        it('should enforce zoom limits', () => {
            splitScreenCamera.targetPosition = { x: 0, y: 100, z: 15 }; // Excessive zoom

            splitScreenCamera.handleBoundaryConstraints();

            expect(splitScreenCamera.targetPosition.y).toBeLessThanOrEqual(
                splitScreenCamera.maxZoom
            );
            expect(splitScreenCamera.targetPosition.y).toBeGreaterThanOrEqual(
                splitScreenCamera.minZoom
            );
        });
    });

    describe('handleOppositeCornerCase', () => {
        it('should force maximum zoom when players are at opposite corners', () => {
            const bounds = { minX: -15, maxX: 15, minZ: -15, maxZ: 15 };
            splitScreenCamera.setArenaBounds(bounds);

            const player1 = { x: -14, z: -14, isAlive: true }; // Near min corner
            const player2 = { x: 14, z: 14, isAlive: true }; // Near max corner
            splitScreenCamera.setPlayers([player1, player2]);

            splitScreenCamera.handleOppositeCornerCase();

            expect(splitScreenCamera.targetPosition.y).toBe(splitScreenCamera.maxZoom);
            expect(splitScreenCamera.targetPosition.x).toBe(0); // Arena center
            expect(splitScreenCamera.targetLookAt.x).toBe(0);
            expect(splitScreenCamera.targetLookAt.z).toBe(0);
        });

        it('should not trigger for players not at opposite corners', () => {
            const bounds = { minX: -15, maxX: 15, minZ: -15, maxZ: 15 };
            splitScreenCamera.setArenaBounds(bounds);

            const player1 = { x: 0, z: 0, isAlive: true };
            const player2 = { x: 5, z: 5, isAlive: true };
            splitScreenCamera.setPlayers([player1, player2]);

            const originalY = splitScreenCamera.targetPosition.y;
            splitScreenCamera.handleOppositeCornerCase();

            expect(splitScreenCamera.targetPosition.y).toBe(originalY);
        });
    });

    describe('handlePlayersCloseProximity', () => {
        it('should maintain minimum zoom when players are very close', () => {
            const player1 = { x: 0, z: 0, isAlive: true };
            const player2 = { x: 1, z: 1, isAlive: true }; // Very close
            splitScreenCamera.setPlayers([player1, player2]);

            splitScreenCamera.targetPosition.y = 15; // Below minimum
            splitScreenCamera.handlePlayersCloseProximity();

            expect(splitScreenCamera.targetPosition.y).toBeGreaterThan(splitScreenCamera.minZoom);
        });

        it('should not affect zoom when players are at normal distance', () => {
            const player1 = { x: 0, z: 0, isAlive: true };
            const player2 = { x: 10, z: 10, isAlive: true }; // Normal distance
            splitScreenCamera.setPlayers([player1, player2]);

            const originalY = 25;
            splitScreenCamera.targetPosition.y = originalY;
            splitScreenCamera.handlePlayersCloseProximity();

            expect(splitScreenCamera.targetPosition.y).toBe(originalY);
        });
    });

    describe('handleArenaShrinking', () => {
        it('should adjust zoom limits based on arena size', () => {
            const originalBounds = { minX: -15, maxX: 15, minZ: -15, maxZ: 15 }; // 30x30
            const shrunkBounds = { minX: -7.5, maxX: 7.5, minZ: -7.5, maxZ: 7.5 }; // 15x15

            const originalMinZoom = splitScreenCamera.minZoom;
            const originalMaxZoom = splitScreenCamera.maxZoom;

            splitScreenCamera.handleArenaShrinking(shrunkBounds);

            // Zoom limits should be scaled down for smaller arena
            expect(splitScreenCamera.minZoom).toBeLessThan(originalMinZoom);
            expect(splitScreenCamera.maxZoom).toBeLessThan(originalMaxZoom);
            expect(splitScreenCamera.arenaBounds).toEqual(shrunkBounds);
        });
    });

    describe('handleRapidMovement', () => {
        it('should limit camera movement speed', () => {
            // Set camera far from target
            camera.position = { x: 0, y: 20, z: 20 };
            splitScreenCamera.targetPosition = { x: 100, y: 50, z: 100 };

            const maxSpeed = 2.0;
            splitScreenCamera.handleRapidMovement(maxSpeed);

            // Target should be moved closer to current position
            const deltaX = splitScreenCamera.targetPosition.x - camera.position.x;
            const deltaY = splitScreenCamera.targetPosition.y - camera.position.y;
            const deltaZ = splitScreenCamera.targetPosition.z - camera.position.z;
            const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

            expect(totalMovement).toBeLessThanOrEqual(maxSpeed + 0.01); // Small tolerance for floating point
        });

        it('should not affect movement within speed limit', () => {
            camera.position = { x: 0, y: 20, z: 20 };
            const originalTarget = { x: 1, y: 21, z: 21 };
            splitScreenCamera.targetPosition = { ...originalTarget };

            splitScreenCamera.handleRapidMovement(5.0);

            expect(splitScreenCamera.targetPosition).toEqual(originalTarget);
        });
    });

    describe('update', () => {
        it('should handle no players gracefully', () => {
            splitScreenCamera.setPlayers([]);

            const originalPosition = { ...camera.position };
            splitScreenCamera.update();

            // Camera position should remain unchanged
            expect(camera.position).toEqual(originalPosition);
        });

        it('should update camera for single player', () => {
            const player = { x: 5, z: 5, isAlive: true };
            splitScreenCamera.setPlayers([player]);

            // Call individual method to test target setting without smooth movement
            splitScreenCamera.updateSinglePlayerCamera(player, { x: 0, y: 0, z: 0 });

            // Should set target to follow single player
            expect(splitScreenCamera.targetLookAt.x).toBe(5);
            expect(splitScreenCamera.targetLookAt.z).toBe(5);
            expect(splitScreenCamera.targetPosition.x).toBe(5);
        });

        it('should update camera for two players', () => {
            const player1 = { x: 0, z: 0, isAlive: true };
            const player2 = { x: 10, z: 10, isAlive: true };
            splitScreenCamera.setPlayers([player1, player2]);

            // Call individual method to test target setting without smooth movement
            splitScreenCamera.updateSplitScreenCamera(player1, player2, { x: 0, y: 0, z: 0 });

            // Should center between players
            expect(splitScreenCamera.targetLookAt.x).toBe(5);
            expect(splitScreenCamera.targetLookAt.z).toBe(5);
            expect(splitScreenCamera.targetPosition.x).toBe(5);
        });

        it('should apply camera effects offset', () => {
            const player = { x: 0, z: 0, isAlive: true };
            splitScreenCamera.setPlayers([player]);

            const effectsOffset = { x: 2, y: 1, z: 3 };
            splitScreenCamera.update(effectsOffset);

            // Camera position should include effects offset (after smoothing)
            expect(camera.position.x).toBeCloseTo(2, 0);
            expect(camera.position.y).toBeCloseTo(21, 0);
            expect(camera.position.z).toBeCloseTo(23, 0);
        });
    });

    describe('reset', () => {
        it('should reset camera to original position', () => {
            // Move camera away from original position
            camera.position = { x: 100, y: 100, z: 100 };
            splitScreenCamera.targetPosition = { x: 50, y: 50, z: 50 };

            splitScreenCamera.reset();

            expect(camera.position).toEqual({ x: 0, y: 20, z: 20 });
            expect(splitScreenCamera.targetPosition).toEqual({ x: 0, y: 20, z: 15 });
        });
    });

    describe('setConfiguration', () => {
        it('should update camera configuration', () => {
            const config = {
                minZoom: 15,
                maxZoom: 60,
                baseHeight: 25,
                smoothingFactor: 0.2,
            };

            splitScreenCamera.setConfiguration(config);

            expect(splitScreenCamera.minZoom).toBe(15);
            expect(splitScreenCamera.maxZoom).toBe(60);
            expect(splitScreenCamera.baseHeight).toBe(25);
            expect(splitScreenCamera.smoothingFactor).toBe(0.2);
        });

        it('should only update provided configuration values', () => {
            const originalMinZoom = splitScreenCamera.minZoom;

            splitScreenCamera.setConfiguration({ maxZoom: 60 });

            expect(splitScreenCamera.minZoom).toBe(originalMinZoom);
            expect(splitScreenCamera.maxZoom).toBe(60);
        });
    });

    describe('getStatus', () => {
        it('should return current camera status', () => {
            const player1 = { x: 0, z: 0, isAlive: true };
            const player2 = { x: 10, z: 10, isAlive: true };
            splitScreenCamera.setPlayers([player1, player2]);

            const status = splitScreenCamera.getStatus();

            expect(status.playersTracked).toBe(2);
            expect(status.currentPosition.x).toBe(camera.position.x);
            expect(status.currentPosition.y).toBe(camera.position.y);
            expect(status.currentPosition.z).toBe(camera.position.z);
            expect(status.targetPosition).toEqual(splitScreenCamera.targetPosition);
            expect(status.configuration.minZoom).toBe(splitScreenCamera.minZoom);
        });
    });

    describe('ensureBothPlayersVisible', () => {
        it('should return true when both players are visible', () => {
            const player1 = { x: 0, z: 0, isAlive: true };
            const player2 = { x: 5, z: 5, isAlive: true };
            splitScreenCamera.setPlayers([player1, player2]);

            // Position camera to see both players
            camera.position = { x: 2.5, y: 20, z: 17.5 };

            const visible = splitScreenCamera.ensureBothPlayersVisible();
            expect(visible).toBe(true);
        });

        it('should return true for single player', () => {
            const player = { x: 0, z: 0, isAlive: true };
            splitScreenCamera.setPlayers([player]);

            const visible = splitScreenCamera.ensureBothPlayersVisible();
            expect(visible).toBe(true);
        });
    });

    describe('getPlayerPosition', () => {
        it('should extract position from player object with x,z properties', () => {
            const player = { x: 10, z: 5, isAlive: true };
            const position = splitScreenCamera.getPlayerPosition(player);
            expect(position).toEqual({ x: 10, z: 5 });
        });

        it('should extract position from player object with position property', () => {
            const player = { position: { x: 10, z: 5 }, isAlive: true };
            const position = splitScreenCamera.getPlayerPosition(player);
            expect(position).toEqual({ x: 10, z: 5 });
        });

        it('should handle missing coordinates with defaults', () => {
            const player = { isAlive: true };
            const position = splitScreenCamera.getPlayerPosition(player);
            expect(position).toEqual({ x: 0, z: 0 });
        });
    });
});
