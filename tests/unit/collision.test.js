const { CollisionDetectionEngine } = require('../../src/core/collision.js');

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
            const { playerCollided, winner } = collisionDetectionEngine.checkCollisions(gameState);
            expect(playerCollided).toBe(false);
            expect(winner).toBe(null);
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
            const { playerCollided, aiCollided, winner } = collisionDetectionEngine.checkCollisions(gameState);
            expect(playerCollided).toBe(false);
            expect(aiCollided).toBe(false);
            expect(winner).toBe(null);
        });
    });

    describe('Winner Determination', () => {
        it('should return ai as winner when only player collides', () => {
            gameState.player.x = gameState.bounds + 1; // Player collides with boundary
            const { playerCollided, aiCollided, winner } = collisionDetectionEngine.checkCollisions(gameState);
            expect(playerCollided).toBe(true);
            expect(aiCollided).toBe(false);
            expect(winner).toBe('ai');
        });

        it('should return player as winner when only ai collides', () => {
            gameState.ai.x = gameState.bounds + 1; // AI collides with boundary
            const { playerCollided, aiCollided, winner } = collisionDetectionEngine.checkCollisions(gameState);
            expect(playerCollided).toBe(false);
            expect(aiCollided).toBe(true);
            expect(winner).toBe('player');
        });

        it('should return tie when both player and ai collide', () => {
            gameState.player.x = gameState.bounds + 1; // Player collides with boundary
            gameState.ai.x = gameState.bounds + 1; // AI collides with boundary
            const { playerCollided, aiCollided, winner } = collisionDetectionEngine.checkCollisions(gameState);
            expect(playerCollided).toBe(true);
            expect(aiCollided).toBe(true);
            expect(winner).toBe('tie');
        });

        it('should return null winner when neither player nor ai collides', () => {
            // Both players in safe positions
            const { playerCollided, aiCollided, winner } = collisionDetectionEngine.checkCollisions(gameState);
            expect(playerCollided).toBe(false);
            expect(aiCollided).toBe(false);
            expect(winner).toBe(null);
        });

        it('should return correct winner for trail collisions', () => {
            // Player collides with AI trail
            gameState.aiTrail = [{ x: 0, y: 0, z: 0 }];
            const { playerCollided, aiCollided, winner } = collisionDetectionEngine.checkCollisions(gameState);
            expect(playerCollided).toBe(true);
            expect(aiCollided).toBe(false);
            expect(winner).toBe('ai');
        });

        it('should handle simultaneous trail collisions as tie', () => {
            // Both collide with each other's trails
            gameState.playerTrail = [{ x: 0, y: 0, z: -10 }]; // AI position
            gameState.aiTrail = [{ x: 0, y: 0, z: 0 }]; // Player position
            const { playerCollided, aiCollided, winner } = collisionDetectionEngine.checkCollisions(gameState);
            expect(playerCollided).toBe(true);
            expect(aiCollided).toBe(true);
            expect(winner).toBe('tie');
        });
    });

    describe('Multi-Entity Collision Detection', () => {
        beforeEach(() => {
            // Set up multi-AI game state
            gameState.aiOpponents = [
                {
                    id: 'ai_1',
                    x: 5, y: 0, z: 0,
                    direction: { x: 1, z: 0 },
                    trail: [{ x: 4, y: 0, z: 0 }, { x: 3, y: 0, z: 0 }],
                    alive: true
                },
                {
                    id: 'ai_2',
                    x: 0, y: 0, z: 5,
                    direction: { x: 0, z: 1 },
                    trail: [{ x: 0, y: 0, z: 4 }, { x: 0, y: 0, z: 3 }],
                    alive: true
                }
            ];
        });

        it('should detect player collision with multiple AI trails', () => {
            gameState.player = { x: 4, y: 0, z: 0 }; // On ai_1's trail
            
            const result = collisionDetectionEngine.checkCollisions(gameState);
            
            expect(result.playerCollided).toBe(true);
            expect(result.crashedEntities).toContain('player');
            expect(result.winner).toBe(null); // AIs still alive
        });

        it('should detect AI vs AI collisions', () => {
            // Position ai_2 on ai_1's trail
            gameState.aiOpponents[1].x = 4;
            gameState.aiOpponents[1].z = 0;
            
            const result = collisionDetectionEngine.checkCollisions(gameState);
            
            expect(result.aiCollided).toBe(true);
            expect(result.crashedEntities).toContain('ai_2');
            expect(result.survivingEntities).toContain('player');
            expect(result.survivingEntities).toContain('ai_1');
        });

        it('should handle simultaneous crashes correctly', () => {
            // Position player and ai_1 to crash simultaneously
            gameState.player = { x: 4, y: 0, z: 0 }; // On ai_1's trail
            gameState.aiOpponents[0].x = 0; // ai_1 on player's starting position
            gameState.aiOpponents[0].z = 0;
            
            // Add player trail at ai_1's new position for collision
            gameState.playerTrail.push({ x: 0, y: 0, z: 0 });
            
            const result = collisionDetectionEngine.checkCollisions(gameState);
            
            expect(result.playerCollided).toBe(true);
            expect(result.aiCollided).toBe(true);
            expect(result.crashedEntities).toContain('player');
            expect(result.crashedEntities).toContain('ai_1');
            expect(result.survivingEntities).toEqual(['ai_2']);
            expect(result.winner).toBe('ai_2');
        });

        it('should determine winner when only one entity survives', () => {
            // Crash all AIs, leave player alive
            gameState.aiOpponents[0].x = gameState.bounds + 1; // ai_1 hits boundary
            gameState.aiOpponents[1].x = gameState.bounds + 1; // ai_2 hits boundary
            
            const result = collisionDetectionEngine.checkCollisions(gameState);
            
            expect(result.crashedEntities).toContain('ai_1');
            expect(result.crashedEntities).toContain('ai_2');
            expect(result.survivingEntities).toEqual(['player']);
            expect(result.winner).toBe('player');
        });

        it('should return tie when all entities crash', () => {
            // Crash everyone
            gameState.player.x = gameState.bounds + 1;
            gameState.aiOpponents[0].x = gameState.bounds + 1;
            gameState.aiOpponents[1].x = gameState.bounds + 1;
            
            const result = collisionDetectionEngine.checkCollisions(gameState);
            
            expect(result.crashedEntities).toContain('player');
            expect(result.crashedEntities).toContain('ai_1');
            expect(result.crashedEntities).toContain('ai_2');
            expect(result.survivingEntities).toHaveLength(0);
            expect(result.winner).toBe('tie');
        });

        it('should continue game when multiple entities survive', () => {
            // Only crash one AI
            gameState.aiOpponents[0].x = gameState.bounds + 1;
            
            const result = collisionDetectionEngine.checkCollisions(gameState);
            
            expect(result.crashedEntities).toEqual(['ai_1']);
            expect(result.survivingEntities).toContain('player');
            expect(result.survivingEntities).toContain('ai_2');
            expect(result.winner).toBe(null); // Game continues
        });

        it('should handle dead AI entities correctly', () => {
            gameState.aiOpponents[1].alive = false;
            gameState.aiOpponents[0].x = gameState.bounds + 1; // Crash remaining AI
            
            const result = collisionDetectionEngine.checkCollisions(gameState);
            
            expect(result.crashedEntities).toEqual(['ai_1']);
            expect(result.survivingEntities).toEqual(['player']);
            expect(result.winner).toBe('player');
        });

        it('should get correct other trails for each entity', () => {
            const playerTrails = collisionDetectionEngine.getOtherTrails('player', gameState);
            const ai1Trails = collisionDetectionEngine.getOtherTrails('ai_1', gameState);
            const ai2Trails = collisionDetectionEngine.getOtherTrails('ai_2', gameState);
            
            // Player should see all AI trails
            expect(playerTrails).toContainEqual({ x: 4, y: 0, z: 0 }); // ai_1 trail
            expect(playerTrails).toContainEqual({ x: 0, y: 0, z: 4 }); // ai_2 trail
            
            // ai_1 should see player trail and ai_2 trail, but not own trail
            expect(ai1Trails).toContainEqual({ x: 0, y: 0, z: 4 }); // ai_2 trail
            expect(ai1Trails).not.toContainEqual({ x: 4, y: 0, z: 0 }); // Not own trail
            
            // ai_2 should see player trail and ai_1 trail, but not own trail
            expect(ai2Trails).toContainEqual({ x: 4, y: 0, z: 0 }); // ai_1 trail
            expect(ai2Trails).not.toContainEqual({ x: 0, y: 0, z: 4 }); // Not own trail
        });

        it('should maintain grace period and tolerance settings', () => {
            gameState.frameCount = 5; // Within grace period
            gameState.player.x = gameState.bounds + 1; // Should collide but grace period prevents it
            
            const result = collisionDetectionEngine.checkCollisions(gameState);
            
            expect(result.playerCollided).toBe(false);
            expect(result.winner).toBe(null);
        });

        it('should fall back to legacy mode when no aiOpponents', () => {
            delete gameState.aiOpponents;
            gameState.ai = { x: 0, y: 0, z: -10 };
            gameState.aiTrail = [];
            gameState.player.x = gameState.bounds + 1;
            
            const result = collisionDetectionEngine.checkCollisions(gameState);
            
            // Should use legacy format
            expect(result).toHaveProperty('playerCollided');
            expect(result).toHaveProperty('aiCollided');
            expect(result).toHaveProperty('winner');
            expect(result.playerCollided).toBe(true);
            expect(result.winner).toBe('ai');
        });
    });

    describe('Pause State Handling', () => {
        it('should respect pause state and return no collisions when paused', () => {
            // Set up collision scenario
            gameState.player.x = gameState.bounds + 1; // Should collide with boundary
            gameState.ai.x = gameState.bounds + 1; // Should collide with boundary
            gameState.isPaused = true;
            
            const { playerCollided, aiCollided, winner } = collisionDetectionEngine.checkCollisions(gameState);
            expect(playerCollided).toBe(false);
            expect(aiCollided).toBe(false);
            expect(winner).toBe(null);
        });

        it('should detect collisions normally when not paused', () => {
            // Set up collision scenario
            gameState.player.x = gameState.bounds + 1; // Should collide with boundary
            gameState.ai.x = gameState.bounds + 1; // Should collide with boundary
            gameState.isPaused = false;
            
            const { playerCollided, aiCollided, winner } = collisionDetectionEngine.checkCollisions(gameState);
            expect(playerCollided).toBe(true);
            expect(aiCollided).toBe(true);
            expect(winner).toBe('tie');
        });

        it('should maintain collision detection integrity during pause transitions', () => {
            // Set up trail collision scenario - player at (0,0,0) colliding with own trail
            // Need more than 5 segments since last 5 are excluded
            gameState.player = { x: 0, y: 0, z: 0 };
            gameState.playerTrail = [
                { x: 0.05, y: 0, z: 0.05 }, // This will be checked (within collision tolerance)
                { x: 1, y: 0, z: 1 },
                { x: 1, y: 0, z: 1 },
                { x: 1, y: 0, z: 1 },
                { x: 1, y: 0, z: 1 },
                { x: 1, y: 0, z: 1 } // Last 5 segments excluded
            ];
            
            // Normal operation - should detect collision
            gameState.isPaused = false;
            const normalResult = collisionDetectionEngine.checkCollisions(gameState);
            expect(normalResult.playerCollided).toBe(true);
            
            // Pause - should not detect collision
            gameState.isPaused = true;
            const pausedResult = collisionDetectionEngine.checkCollisions(gameState);
            expect(pausedResult.playerCollided).toBe(false);
            expect(pausedResult.winner).toBe(null);
            
            // Resume - should detect collision again
            gameState.isPaused = false;
            const resumedResult = collisionDetectionEngine.checkCollisions(gameState);
            expect(resumedResult.playerCollided).toBe(true);
            expect(resumedResult.winner).toBe('ai');
        });

        it('should handle pause state with complex collision scenarios', () => {
            // Set up complex scenario with multiple potential collisions
            gameState.player = { x: 0, y: 0, z: 0 };
            gameState.ai = { x: 0, y: 0, z: -10 };
            gameState.playerTrail = [{ x: 0.05, y: 0, z: -10.05 }]; // Near AI (within tolerance)
            gameState.aiTrail = [{ x: 0.05, y: 0, z: 0.05 }]; // Near player (within tolerance)
            
            // Pause state should prevent all collision detection
            gameState.isPaused = true;
            const pausedResult = collisionDetectionEngine.checkCollisions(gameState);
            expect(pausedResult.playerCollided).toBe(false);
            expect(pausedResult.aiCollided).toBe(false);
            expect(pausedResult.winner).toBe(null);
            
            // Resume should allow normal collision detection
            gameState.isPaused = false;
            const resumedResult = collisionDetectionEngine.checkCollisions(gameState);
            expect(resumedResult.playerCollided).toBe(true); // Should collide with AI trail
            expect(resumedResult.aiCollided).toBe(true); // Should collide with player trail
            expect(resumedResult.winner).toBe('tie');
        });

        it('should maintain grace period behavior during pause', () => {
            gameState.frameCount = 5; // Within grace period
            gameState.player.x = gameState.bounds + 1; // Should collide but grace period prevents it
            gameState.isPaused = true;
            
            const result = collisionDetectionEngine.checkCollisions(gameState);
            expect(result.playerCollided).toBe(false); // No collision due to grace period AND pause
            expect(result.winner).toBe(null);
            
            // Test with pause disabled but still in grace period
            gameState.isPaused = false;
            const gracePeriodResult = collisionDetectionEngine.checkCollisions(gameState);
            expect(gracePeriodResult.playerCollided).toBe(false); // No collision due to grace period
            expect(gracePeriodResult.winner).toBe(null);
        });
    });
});
