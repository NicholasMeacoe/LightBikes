const { CollisionDetectionEngine } = require('./collision.js');

describe('CollisionDetectionEngine', () => {
    let collisionDetectionEngine;
    let gameState;

    beforeEach(() => {
        collisionDetectionEngine = new CollisionDetectionEngine();
        gameState = {
            bounds: 30,
            player: { x: 0, y: 0, z: 0 },
            playerTrail: [],
            ai: { x: 0, y: 0, z: -10 },
            aiTrail: [],
            frameCount: 10
        };
    });

    describe('Boundary Collision Detection', () => {
        it('should detect player boundary collision on positive x', () => {
            gameState.player.x = gameState.bounds + 0.1;
            const { playerCollided } = collisionDetectionEngine.checkCollisions(gameState);
            expect(playerCollided).toBe(true);
        });

        it('should detect player boundary collision on negative x', () => {
            gameState.player.x = -gameState.bounds - 1;
            const { playerCollided } = collisionDetectionEngine.checkCollisions(gameState);
            expect(playerCollided).toBe(true);
        });

        it('should detect player boundary collision on positive z', () => {
            gameState.player.z = gameState.bounds + 0.1;
            const { playerCollided } = collisionDetectionEngine.checkCollisions(gameState);
            expect(playerCollided).toBe(true);
        });

        it('should detect player boundary collision on negative z', () => {
            gameState.player.z = -gameState.bounds - 0.1;
            const { playerCollided } = collisionDetectionEngine.checkCollisions(gameState);
            expect(playerCollided).toBe(true);
        });

        it('should detect ai boundary collision', () => {
            gameState.ai.x = gameState.bounds + 1;
            const { aiCollided } = collisionDetectionEngine.checkCollisions(gameState);
            expect(aiCollided).toBe(true);
        });

        it('should not trigger collision detection in first 10 frames', () => {
            gameState.frameCount = 9;
            gameState.player.x = gameState.bounds + 1;
            const { playerCollided } = collisionDetectionEngine.checkCollisions(gameState);
            expect(playerCollided).toBe(false);
        });
    });

    describe('Trail Collision Detection', () => {
        it('should detect player trail collision', () => {
            gameState.playerTrail = [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }];
            const { playerCollided } = collisionDetectionEngine.checkCollisions(gameState);
            expect(playerCollided).toBe(true);
        });

        it('should detect ai trail collision with player', () => {
            gameState.aiTrail = [{ x: 0, y: 0, z: 0 }];
            const { playerCollided } = collisionDetectionEngine.checkCollisions(gameState);
            expect(playerCollided).toBe(true);
        });

        it('should detect player trail collision with ai', () => {
            gameState.playerTrail = [{ x: 0, y: 0, z: -10 }];
            const { aiCollided } = collisionDetectionEngine.checkCollisions(gameState);
            expect(aiCollided).toBe(true);
        });

        it('should detect ai trail collision with ai', () => {
            gameState.aiTrail = [{ x: 0, y: 0, z: -10 }, { x: 0, y: 0, z: -10 }, { x: 0, y: 0, z: -10 }, { x: 0, y: 0, z: -10 }, { x: 0, y: 0, z: -10 }, { x: 0, y: 0, z: -10 }];
            const { aiCollided } = collisionDetectionEngine.checkCollisions(gameState);
            expect(aiCollided).toBe(true);
        });

        it('should ignore recent trail segments for collision', () => {
            gameState.playerTrail = [
                { x: 1, y: 0, z: 1 },
                { x: 1, y: 0, z: 1 },
                { x: 1, y: 0, z: 1 },
                { x: 1, y: 0, z: 1 },
                { x: 1, y: 0, z: 1 },
                { x: 0, y: 0, z: 0 },
            ];
            const { playerCollided } = collisionDetectionEngine.checkCollisions(gameState);
            expect(playerCollided).toBe(false);
        });

        it('should handle collision detection with empty trails', () => {
            const { playerCollided, aiCollided } = collisionDetectionEngine.checkCollisions(gameState);
            expect(playerCollided).toBe(false);
            expect(aiCollided).toBe(false);
        });
    });
});
