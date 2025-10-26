const { AIController } = require('./ai.js');

describe('AIController', () => {
    let aiController;
    let gameState;

    beforeEach(() => {
        aiController = new AIController();
        gameState = {
            bounds: 30,
            player: { x: 0, y: 0, z: 0 },
            playerDirection: { x: 1, y: 0, z: 0 },
            playerTrail: [],
            ai: { x: 0, y: 0, z: 5 },
            aiDirection: { x: -1, y: 0, z: 0 },
            aiTrail: [],
        };
    });

    it('should navigate out of a trap', () => {
        gameState.ai = { x: 25, y: 0, z: 25 };
        gameState.aiDirection = { x: 1, z: 0 };
        for (let i = 0; i < 10; i++) {
            const { newDirection } = aiController.calculateAIDirection(gameState);
            gameState.aiDirection = newDirection;
            gameState.ai.x += newDirection.x;
            gameState.ai.z += newDirection.z;
            gameState.aiTrail.push({ ...gameState.ai });
        }
        expect(gameState.ai.x).toBeLessThan(29);
        expect(gameState.ai.z).toBeLessThan(29);
    });

    describe('Defensive Behavior', () => {
        it('should turn to avoid a wall', () => {
            gameState.ai.x = gameState.bounds - 0.05; // Very close to boundary
            gameState.aiDirection = { x: 1, z: 0 };
            const { newDirection } = aiController.calculateAIDirection(gameState);
            // Should turn away from the wall
            expect(newDirection.x).not.toBe(1);
        });

        it('should avoid the players trail', () => {
            gameState.playerTrail.push({ x: -0.05, y: 0, z: 5 }); // Very close obstacle
            const { newDirection } = aiController.calculateAIDirection(gameState);
            // Should turn away from the player trail
            expect(newDirection.x).not.toBe(-1);
        });

        it('should attempt to find a safe path when trapped', () => {
            gameState.aiTrail.push({ x: 0.1, y: 0, z: 5 });
            gameState.aiTrail.push({ x: -0.1, y: 0, z: 5 });
            gameState.aiTrail.push({ x: 0, y: 0, z: 5.1 });
            gameState.aiTrail.push({ x: 0, y: 0, z: 4.9 });
            const { newDirection } = aiController.calculateAIDirection(gameState);
            expect(newDirection).toBeDefined();
        });

        it('should handle boundary collision avoidance on all sides', () => {
            const testCases = [
                { pos: { x: 29.9, z: 0 }, dir: { x: 1, z: 0 } }, // Right boundary
                { pos: { x: -29.9, z: 0 }, dir: { x: -1, z: 0 } }, // Left boundary
                { pos: { x: 0, z: 29.9 }, dir: { x: 0, z: 1 } }, // Top boundary
                { pos: { x: 0, z: -29.9 }, dir: { x: 0, z: -1 } } // Bottom boundary
            ];

            testCases.forEach(({ pos, dir }) => {
                gameState.ai = { ...pos, y: 0 };
                gameState.aiDirection = dir;
                const { newDirection } = aiController.calculateAIDirection(gameState);
                expect(newDirection).toBeDefined();
            });
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle missing game state properties gracefully', () => {
            const incompleteState = {
                ai: { x: 0, y: 0, z: 0 },
                aiDirection: { x: 1, z: 0 }
            };
            
            expect(() => aiController.calculateAIDirection(incompleteState)).not.toThrow();
        });

        it('should handle invalid directions gracefully', () => {
            gameState.aiDirection = { x: 0, z: 0 }; // Invalid direction
            
            const result = aiController.calculateAIDirection(gameState);
            expect(result.newDirection).toBeDefined();
        });

        it('should handle empty trail arrays', () => {
            gameState.playerTrail = [];
            gameState.aiTrail = [];
            
            const result = aiController.calculateAIDirection(gameState);
            expect(result).toBeDefined();
            expect(result.newDirection).toBeDefined();
        });

        it('should handle negative bounds', () => {
            gameState.bounds = -10;
            gameState.ai.x = -5;
            
            const { newDirection } = aiController.calculateAIDirection(gameState);
            expect(newDirection).toBeDefined();
        });

        it('should handle zero bounds', () => {
            gameState.bounds = 0;
            
            const { newDirection } = aiController.calculateAIDirection(gameState);
            expect(newDirection).toBeDefined();
        });
    });
});