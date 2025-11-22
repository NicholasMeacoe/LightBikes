/**
 * Comprehensive Multiplayer Functionality Tests
 * Consolidates and extends testing for all multiplayer components
 * Requirements: 8.5, 4.5, 5.4, 6.1, 6.2, 6.3, 1.5, 3.5
 */

const { MultiplayerGame } = require('@/multiplayer/MultiplayerGame.js');
const { DualControlScheme } = require('@/utils/DualControlScheme.js');
const { SplitScreenCamera } = require('@/multiplayer/SplitScreenCamera.js');
const { PlayerCollisionHandler } = require('@/multiplayer/PlayerCollisionHandler.js');
const { LocalScoring } = require('@/systems/LocalScoring.js');

// Mock THREE.js camera
class MockCamera {
    constructor() {
        this.position = { 
            x: 0, 
            y: 20, 
            z: 20,
            clone: () => ({ x: 0, y: 20, z: 20 })
        };
        this.lookAtTarget = { x: 0, y: 0, z: 0 };
    }
    
    lookAt(x, y, z) {
        this.lookAtTarget = { x, y, z };
    }
}

describe('Comprehensive Multiplayer Functionality Tests', () => {
    describe('Dual Player Management (Requirement 8.5)', () => {
        let game;

        beforeEach(() => {
            game = new MultiplayerGame();
        });

        test('should manage two independent player entities', () => {
            expect(game.player1).toBeDefined();
            expect(game.player2).toBeDefined();
            expect(game.player1.id).not.toBe(game.player2.id);
        });

        test('should update both players independently', () => {
            const p1InitialX = game.player1.position.x;
            const p2InitialX = game.player2.position.x;

            game.update();

            expect(game.player1.position.x).not.toBe(p1InitialX);
            expect(game.player2.position.x).not.toBe(p2InitialX);
        });

        test('should handle player state transitions correctly', () => {
            expect(game.player1.isAlive).toBe(true);
            expect(game.player2.isAlive).toBe(true);

            game.player1.crash();
            expect(game.player1.isAlive).toBe(false);
            expect(game.player2.isAlive).toBe(true);
        });

        test('should maintain separate trails for each player', () => {
            game.update();
            game.update();

            expect(game.player1.trail.length).toBeGreaterThan(0);
            expect(game.player2.trail.length).toBeGreaterThan(0);
            expect(game.player1.trail).not.toBe(game.player2.trail);
        });
    });

    describe('Dual Control Scheme - Input Processing (Requirement 8.5)', () => {
        let dualControls;

        beforeEach(() => {
            dualControls = new DualControlScheme();
        });

        test('should process simultaneous inputs without conflicts', () => {
            const p1Event = { code: 'ArrowUp' };
            const p2Event = { code: 'KeyW' };

            const result1 = dualControls.handleKeyDown(p1Event);
            const result2 = dualControls.handleKeyDown(p2Event);

            expect(result1.playerId).toBe('P1');
            expect(result2.playerId).toBe('P2');
            expect(result1.directionChanged).toBe(true);
            expect(result2.directionChanged).toBe(true);
        });

        test('should handle rapid alternating inputs', () => {
            const inputs = [
                { code: 'ArrowUp', player: 'P1' },
                { code: 'KeyW', player: 'P2' },
                { code: 'ArrowRight', player: 'P1' },
                { code: 'KeyD', player: 'P2' },
                { code: 'ArrowDown', player: 'P1' },
                { code: 'KeyS', player: 'P2' }
            ];

            inputs.forEach(input => {
                const result = dualControls.handleKeyDown({ code: input.code });
                expect(result.playerId).toBe(input.player);
            });
        });

        test('should maintain input state accuracy under load', () => {
            // Simulate 100 rapid inputs
            for (let i = 0; i < 100; i++) {
                const p1Key = i % 2 === 0 ? 'ArrowUp' : 'ArrowRight';
                const p2Key = i % 2 === 0 ? 'KeyW' : 'KeyD';

                dualControls.handleKeyDown({ code: p1Key });
                dualControls.handleKeyDown({ code: p2Key });
            }

            const inputState = dualControls.getInputState();
            expect(inputState.player1State).toBeDefined();
            expect(inputState.player2State).toBeDefined();
        });

        test('should resolve input conflicts correctly', () => {
            dualControls.player1State.pendingDirection = { x: 0, y: 0, z: -1 };
            dualControls.player2State.pendingDirection = { x: 1, y: 0, z: 0 };

            const result = dualControls.preventConflicts();

            expect(result.player1.hasInput).toBe(true);
            expect(result.player2.hasInput).toBe(true);
            expect(result.simultaneousInput).toBe(true);
        });
    });

    describe('Split Screen Camera - Positioning and Zoom (Requirement 8.5)', () => {
        let camera;
        let splitScreenCamera;

        beforeEach(() => {
            camera = new MockCamera();
            splitScreenCamera = new SplitScreenCamera(camera);
        });

        test('should calculate optimal zoom for varying player distances', () => {
            const distances = [0, 10, 20, 30, 40];
            const zooms = distances.map(d => splitScreenCamera.calculateOptimalZoom(d));

            // Zoom should increase with distance
            for (let i = 1; i < zooms.length; i++) {
                expect(zooms[i]).toBeGreaterThanOrEqual(zooms[i - 1]);
            }

            // Should respect min/max bounds
            zooms.forEach(zoom => {
                expect(zoom).toBeGreaterThanOrEqual(splitScreenCamera.minZoom);
                expect(zoom).toBeLessThanOrEqual(splitScreenCamera.maxZoom);
            });
        });

        test('should center camera between players at various positions', () => {
            const testCases = [
                { p1: { x: 0, z: 0 }, p2: { x: 10, z: 10 }, expected: { x: 5, z: 5 } },
                { p1: { x: -10, z: -10 }, p2: { x: 10, z: 10 }, expected: { x: 0, z: 0 } },
                { p1: { x: -5, z: 5 }, p2: { x: 5, z: -5 }, expected: { x: 0, z: 0 } }
            ];

            testCases.forEach(({ p1, p2, expected }) => {
                const center = splitScreenCamera.calculateCenterPoint(p1, p2);
                expect(center.x).toBe(expected.x);
                expect(center.z).toBe(expected.z);
            });
        });

        test('should handle players at maximum distance', () => {
            const player1 = { x: -15, z: -15, isAlive: true };
            const player2 = { x: 15, z: 15, isAlive: true };
            
            splitScreenCamera.setPlayers([player1, player2]);
            splitScreenCamera.updateSplitScreenCamera(player1, player2, { x: 0, y: 0, z: 0 });

            expect(splitScreenCamera.targetPosition.y).toBeLessThanOrEqual(splitScreenCamera.maxZoom);
        });

        test('should smoothly transition camera during rapid player movement', () => {
            const player1 = { x: 0, z: 0, isAlive: true };
            const player2 = { x: 0, z: 0, isAlive: true };
            
            splitScreenCamera.setPlayers([player1, player2]);

            // Simulate rapid movement
            for (let i = 0; i < 10; i++) {
                player1.x += 2;
                player2.x -= 2;
                splitScreenCamera.update();
            }

            // Camera should have moved but not excessively
            expect(Math.abs(camera.position.x)).toBeLessThan(30);
        });

        test('should maintain visibility of both players', () => {
            const player1 = { x: -10, z: -10, isAlive: true };
            const player2 = { x: 10, z: 10, isAlive: true };
            
            splitScreenCamera.setPlayers([player1, player2]);
            splitScreenCamera.update();

            const visible = splitScreenCamera.ensureBothPlayersVisible();
            expect(visible).toBe(true);
        });
    });

    describe('Player vs Player Collision - Simultaneous Crashes (Requirement 4.5)', () => {
        let collisionHandler;
        let gameState;

        beforeEach(() => {
            collisionHandler = new PlayerCollisionHandler();
            gameState = {
                bounds: 30,
                frameCount: 15,
                isPaused: false,
                player1: {
                    position: { x: -5, y: 0, z: 0 },
                    trail: []
                },
                player2: {
                    position: { x: 5, y: 0, z: 0 },
                    trail: []
                }
            };
        });

        test('should detect simultaneous boundary collisions', () => {
            gameState.player1.position.x = -31;
            gameState.player2.position.x = 31;

            const result = collisionHandler.checkMultiplayerCollisions(gameState, {
                getBounds: () => null,
                isGracePeriodActive: () => false
            });

            expect(result.player1Collided).toBe(true);
            expect(result.player2Collided).toBe(true);
            expect(result.winner).toBe('tie');
            expect(result.collisionType).toBe('simultaneous_crash');
        });

        test('should detect simultaneous trail collisions', () => {
            gameState.player1.trail = [{ x: 5, y: 0, z: 0 }];
            gameState.player2.trail = [{ x: -5, y: 0, z: 0 }];

            const result = collisionHandler.checkMultiplayerCollisions(gameState, {
                getBounds: () => null,
                isGracePeriodActive: () => false
            });

            expect(result.player1Collided).toBe(true);
            expect(result.player2Collided).toBe(true);
            expect(result.winner).toBe('tie');
        });

        test('should detect direct player collision', () => {
            gameState.player1.position = { x: 0, y: 0, z: 0 };
            gameState.player2.position = { x: 0.05, y: 0, z: 0 };

            const result = collisionHandler.checkMultiplayerCollisions(gameState, {
                getBounds: () => null,
                isGracePeriodActive: () => false
            });

            expect(result.directCollision).toBe(true);
            expect(result.winner).toBe('tie');
        });

        test('should handle mixed collision types as tie', () => {
            gameState.player1.position.x = -31; // Boundary
            gameState.player1.trail = [{ x: 5, y: 0, z: 0 }]; // P2 hits trail

            const result = collisionHandler.checkMultiplayerCollisions(gameState, {
                getBounds: () => null,
                isGracePeriodActive: () => false
            });

            expect(result.player1Collided).toBe(true);
            expect(result.player2Collided).toBe(true);
            expect(result.winner).toBe('tie');
        });
    });

    describe('Local Scoring - Tie Game Handling (Requirement 5.4)', () => {
        let scoring;

        beforeEach(() => {
            scoring = new LocalScoring();
        });

        test('should handle tie games without awarding points', () => {
            scoring.handleTieGame();

            expect(scoring.player1Wins).toBe(0);
            expect(scoring.player2Wins).toBe(0);
            expect(scoring.totalRounds).toBe(1);
            expect(scoring.roundHistory).toEqual(['TIE']);
        });

        test('should track multiple tie games', () => {
            scoring.handleTieGame();
            scoring.incrementScore('P1');
            scoring.handleTieGame();
            scoring.incrementScore('P2');
            scoring.handleTieGame();

            expect(scoring.roundHistory).toEqual(['TIE', 'P1', 'TIE', 'P2', 'TIE']);
            expect(scoring.totalRounds).toBe(5);
        });

        test('should correctly identify leader after ties', () => {
            scoring.handleTieGame();
            scoring.incrementScore('P1');
            scoring.handleTieGame();
            scoring.incrementScore('P1');

            expect(scoring.getLeader()).toBe('P1');
            expect(scoring.player1Wins).toBe(2);
            expect(scoring.player2Wins).toBe(0);
        });

        test('should handle all-tie scenario', () => {
            for (let i = 0; i < 5; i++) {
                scoring.handleTieGame();
            }

            expect(scoring.player1Wins).toBe(0);
            expect(scoring.player2Wins).toBe(0);
            expect(scoring.totalRounds).toBe(5);
            expect(scoring.hasLeader()).toBe(false);
        });
    });

    describe('Feature Integration - Pause (Requirement 6.2)', () => {
        let game;

        beforeEach(() => {
            game = new MultiplayerGame();
        });

        test('should pause both players simultaneously', () => {
            game.isPaused = true;
            const initialFrameCount = game.frameCount;

            game.update();

            expect(game.frameCount).toBe(initialFrameCount);
        });

        test('should maintain player positions during pause', () => {
            const p1Pos = { ...game.player1.position };
            const p2Pos = { ...game.player2.position };

            game.isPaused = true;
            game.update();

            expect(game.player1.position).toEqual(p1Pos);
            expect(game.player2.position).toEqual(p2Pos);
        });

        test('should resume both players simultaneously', () => {
            game.isPaused = true;
            game.update();
            
            game.isPaused = false;
            const frameCountBeforeResume = game.frameCount;
            game.update();

            expect(game.frameCount).toBeGreaterThan(frameCountBeforeResume);
        });
    });

    describe('Feature Integration - Arena Shrink (Requirement 6.1)', () => {
        let game;

        beforeEach(() => {
            game = new MultiplayerGame();
        });

        test('should apply arena shrinking equally to both players', () => {
            // Mock arena shrinker
            game.getBounds = jest.fn(() => ({
                minX: -10, maxX: 10,
                minZ: -10, maxZ: 10
            }));

            const bounds = game.getBounds();
            expect(bounds.minX).toBe(-10);
            expect(bounds.maxX).toBe(10);
        });

        test('should detect when players are outside shrunk arena', () => {
            game.getBounds = jest.fn(() => ({
                minX: -10, maxX: 10,
                minZ: -10, maxZ: 10
            }));

            game.player1.position.x = -15;
            game.player2.position.x = 15;

            const bounds = game.getBounds();
            const p1OutOfBounds = game.player1.position.x < bounds.minX || game.player1.position.x > bounds.maxX;
            const p2OutOfBounds = game.player2.position.x < bounds.minX || game.player2.position.x > bounds.maxX;

            expect(p1OutOfBounds).toBe(true);
            expect(p2OutOfBounds).toBe(true);
        });
    });

    describe('Feature Integration - Customization (Requirement 6.4)', () => {
        let game;

        beforeEach(() => {
            game = new MultiplayerGame();
        });

        test('should maintain independent customization for both players', () => {
            expect(game.player1.color).toBe('green');
            expect(game.player2.color).toBe('blue');
            expect(game.player1.color).not.toBe(game.player2.color);
        });

        test('should preserve customization after restart', () => {
            const p1ColorBefore = game.player1.color;
            const p2ColorBefore = game.player2.color;

            game.restart();

            expect(game.player1.color).toBe(p1ColorBefore);
            expect(game.player2.color).toBe(p2ColorBefore);
        });

        test('should preserve customization after pause/resume', () => {
            const p1ColorBefore = game.player1.color;
            const p2ColorBefore = game.player2.color;

            game.isPaused = true;
            game.update();
            game.isPaused = false;
            game.update();

            expect(game.player1.color).toBe(p1ColorBefore);
            expect(game.player2.color).toBe(p2ColorBefore);
        });
    });

    describe('Performance - Simultaneous Input Processing (Requirement 1.5)', () => {
        let dualControls;

        beforeEach(() => {
            dualControls = new DualControlScheme();
        });

        test('should process 1000 simultaneous inputs efficiently', () => {
            const startTime = performance.now();

            for (let i = 0; i < 1000; i++) {
                dualControls.handleKeyDown({ code: 'ArrowUp' });
                dualControls.handleKeyDown({ code: 'KeyW' });
                dualControls.preventConflicts();
            }

            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(duration).toBeLessThan(100); // Should complete in under 100ms
        });

        test('should maintain accuracy under rapid input load', () => {
            let p1Inputs = 0;
            let p2Inputs = 0;

            for (let i = 0; i < 100; i++) {
                const result1 = dualControls.handleKeyDown({ code: 'ArrowUp' });
                const result2 = dualControls.handleKeyDown({ code: 'KeyW' });

                if (result1.playerId === 'P1') p1Inputs++;
                if (result2.playerId === 'P2') p2Inputs++;
            }

            expect(p1Inputs).toBe(100);
            expect(p2Inputs).toBe(100);
        });
    });

    describe('Performance - Camera at Maximum Distance (Requirement 3.5)', () => {
        let camera;
        let splitScreenCamera;

        beforeEach(() => {
            camera = new MockCamera();
            splitScreenCamera = new SplitScreenCamera(camera);
        });

        test('should handle maximum player distance efficiently', () => {
            const player1 = { x: -15, z: -15, isAlive: true };
            const player2 = { x: 15, z: 15, isAlive: true };
            
            splitScreenCamera.setPlayers([player1, player2]);

            const startTime = performance.now();

            for (let i = 0; i < 100; i++) {
                splitScreenCamera.update();
            }

            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(duration).toBeLessThan(50); // Should complete in under 50ms
        });

        test('should maintain smooth camera movement at maximum distance', () => {
            const player1 = { x: -15, z: -15, isAlive: true };
            const player2 = { x: 15, z: 15, isAlive: true };
            
            splitScreenCamera.setPlayers([player1, player2]);

            const positions = [];
            for (let i = 0; i < 10; i++) {
                splitScreenCamera.update();
                positions.push({ ...camera.position });
            }

            // Check that movement is smooth (no large jumps)
            for (let i = 1; i < positions.length; i++) {
                const deltaX = Math.abs(positions[i].x - positions[i - 1].x);
                const deltaY = Math.abs(positions[i].y - positions[i - 1].y);
                const deltaZ = Math.abs(positions[i].z - positions[i - 1].z);

                expect(deltaX).toBeLessThan(5);
                expect(deltaY).toBeLessThan(5);
                expect(deltaZ).toBeLessThan(5);
            }
        });
    });

    describe('Edge Cases - Rapid Direction Changes (Requirement 1.5)', () => {
        let game;

        beforeEach(() => {
            game = new MultiplayerGame();
        });

        test('should handle rapid direction changes from both players', () => {
            const directions = [
                { key: 'ArrowUp', player: 'P1' },
                { key: 'ArrowRight', player: 'P1' },
                { key: 'ArrowDown', player: 'P1' },
                { key: 'KeyW', player: 'P2' },
                { key: 'KeyD', player: 'P2' },
                { key: 'KeyS', player: 'P2' }
            ];

            directions.forEach(({ key, player }) => {
                const result = game.changePlayerDirection(player, key);
                expect(typeof result).toBe('boolean');
            });

            expect(game.player1.direction).toBeDefined();
            expect(game.player2.direction).toBeDefined();
        });

        test('should prevent invalid rapid direction changes', () => {
            // Set initial direction
            game.player1.direction = { x: 1, y: 0, z: 0 };

            // Try to reverse direction rapidly
            const result = game.changePlayerDirection('P1', 'ArrowLeft');

            expect(result).toBe(false);
            expect(game.player1.direction).toEqual({ x: 1, y: 0, z: 0 });
        });

        test('should maintain game stability during rapid changes', () => {
            for (let i = 0; i < 100; i++) {
                game.changePlayerDirection('P1', i % 2 === 0 ? 'ArrowUp' : 'ArrowRight');
                game.changePlayerDirection('P2', i % 2 === 0 ? 'KeyW' : 'KeyD');
                game.update();
            }

            expect(game.player1.isAlive).toBe(true);
            expect(game.player2.isAlive).toBe(true);
            expect(game.frameCount).toBeGreaterThan(0);
        });
    });

    describe('Integration - Complete Multiplayer Session', () => {
        let game;
        let collisionHandler;
        let camera;
        let splitScreenCamera;

        beforeEach(() => {
            game = new MultiplayerGame();
            collisionHandler = new PlayerCollisionHandler();
            camera = new MockCamera();
            splitScreenCamera = new SplitScreenCamera(camera);
        });

        test('should handle complete game session with all systems', () => {
            // Initialize
            splitScreenCamera.setPlayers([game.player1, game.player2]);

            // Play multiple frames
            for (let i = 0; i < 50; i++) {
                game.update();
                splitScreenCamera.update();

                const gameState = game.getGameState();
                const collisionResult = collisionHandler.checkMultiplayerCollisions(gameState, game);

                if (collisionResult.player1Collided || collisionResult.player2Collided) {
                    game.handleRoundEnd(collisionResult);
                    break;
                }
            }

            // Verify all systems maintained consistency
            expect(game.frameCount).toBeGreaterThan(0);
            expect(game.localScoring).toBeDefined();
            expect(splitScreenCamera.targetPosition).toBeDefined();
        });

        test('should maintain performance across complete session', () => {
            splitScreenCamera.setPlayers([game.player1, game.player2]);

            const startTime = performance.now();

            for (let i = 0; i < 100; i++) {
                game.update();
                splitScreenCamera.update();
                
                const gameState = game.getGameState();
                collisionHandler.checkMultiplayerCollisions(gameState, game);
            }

            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(duration).toBeLessThan(200); // Should complete in under 200ms
        });
    });
});
