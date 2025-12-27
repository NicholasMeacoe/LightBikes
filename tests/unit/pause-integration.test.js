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

const { Game } = require('@/core/game.js');
const { PlayerController } = require('@/utils/controls.js');

describe('Pause System Integration Tests', () => {
    let game;
    let playerController;

    beforeEach(() => {
        // Setup DOM environment for integration tests
        document.body.innerHTML = `
            <div id="pauseOverlay" style="display: none;">
                <div>PAUSED</div>
                <button id="resumeButton">Resume</button>
            </div>
            <div id="gameOver" style="display: none;">Game Over</div>
            <button id="restart" style="display: none;">Restart</button>
        `;

        game = new Game();
        playerController = new PlayerController(game);
        playerController.init();
    });

    describe('Game Loop Integration', () => {
        it('should integrate pause state with game update cycle', () => {
            // Arrange - advance game to create state
            for (let i = 0; i < 5; i++) {
                game.update();
            }
            const stateBeforePause = {
                frameCount: game.frameCount,
                playerX: game.player.x,
                aiX: game.ai.x,
                playerTrailLength: game.playerTrail.length,
            };

            // Act - pause and attempt updates
            game.pause();
            for (let i = 0; i < 3; i++) {
                game.update();
            }

            // Assert - state should be preserved during pause
            expect(game.frameCount).toBe(stateBeforePause.frameCount);
            expect(game.player.x).toBe(stateBeforePause.playerX);
            expect(game.ai.x).toBe(stateBeforePause.aiX);
            expect(game.playerTrail).toHaveLength(stateBeforePause.playerTrailLength);

            // Act - resume and update
            game.resume();
            game.update();

            // Assert - updates should continue after resume
            expect(game.frameCount).toBe(stateBeforePause.frameCount + 1);
            expect(game.player.x).toBeGreaterThan(stateBeforePause.playerX);
        });

        it('should handle pause/resume during active gameplay', () => {
            // Simulate active gameplay with direction changes
            game.changePlayerDirection('ArrowUp');
            game.update();
            game.update();

            const midGameState = {
                frameCount: game.frameCount,
                playerDirection: { ...game.playerDirection },
                playerPosition: { ...game.player },
            };

            // Pause during active movement
            game.pause();

            // Try to change direction while paused (should still work)
            game.changePlayerDirection('ArrowRight');
            expect(game.playerDirection).toEqual({ x: 1, y: 0, z: 0 });

            // Update while paused (should not advance game state)
            game.update();
            expect(game.frameCount).toBe(midGameState.frameCount);
            expect(game.player).toEqual(midGameState.playerPosition);

            // Resume and verify continued gameplay
            game.resume();
            game.update();
            expect(game.frameCount).toBe(midGameState.frameCount + 1);
            expect(game.player.x).toBeGreaterThan(midGameState.playerPosition.x);
        });

        it('should maintain frame counting accuracy during pause/resume cycles', () => {
            let expectedFrameCount = 0;

            // Normal updates
            for (let i = 0; i < 3; i++) {
                game.update();
                expectedFrameCount++;
            }
            expect(game.frameCount).toBe(expectedFrameCount);

            // Pause and attempt updates
            game.pause();
            for (let i = 0; i < 5; i++) {
                game.update(); // Should not increment
            }
            expect(game.frameCount).toBe(expectedFrameCount);

            // Resume and continue
            game.resume();
            for (let i = 0; i < 2; i++) {
                game.update();
                expectedFrameCount++;
            }
            expect(game.frameCount).toBe(expectedFrameCount);
        });
    });

    describe('UI Integration', () => {
        it('should integrate keyboard controls with pause overlay visibility', async () => {
            const pauseOverlay = document.getElementById('pauseOverlay');

            // Initially hidden
            expect(pauseOverlay.style.display).toBe('none');
            expect(game.isPaused).toBe(false);

            // Pause via keyboard
            const pauseEvent = new KeyboardEvent('keydown', { key: 'p' });
            document.dispatchEvent(pauseEvent);

            expect(game.isPaused).toBe(true);
            // Note: In real implementation, script.js would update overlay visibility

            // Resume via keyboard
            const resumeEvent = new KeyboardEvent('keydown', { key: 'p' });
            document.dispatchEvent(resumeEvent);

            expect(game.isPaused).toBe(false);
        });

        it('should integrate resume button with game state', async () => {
            // Wait for event listeners to be set up
            await new Promise((resolve) => setTimeout(resolve, 10));

            const resumeButton = document.getElementById('resumeButton');

            // Pause the game first
            game.pause();
            expect(game.isPaused).toBe(true);

            // Click resume button
            const clickEvent = new MouseEvent('click', { bubbles: true });
            resumeButton.dispatchEvent(clickEvent);

            expect(game.isPaused).toBe(false);
        });

        it('should handle UI interactions during different game states', async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));

            const resumeButton = document.getElementById('resumeButton');

            // Test during normal gameplay
            expect(game.isPaused).toBe(false);
            resumeButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            expect(game.isPaused).toBe(false); // Should remain unpaused

            // Test during paused state
            game.pause();
            expect(game.isPaused).toBe(true);
            resumeButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            expect(game.isPaused).toBe(false); // Should resume

            // Test during game over
            game.pause();
            game.gameOver = true;
            resumeButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            expect(game.isPaused).toBe(true); // Should remain paused due to game over
        });
    });

    describe('Edge Cases and Error Conditions', () => {
        it('should handle pause system during game restart cycles', () => {
            // Create some game state
            for (let i = 0; i < 5; i++) {
                game.update();
            }

            // Pause the game
            game.pause();
            expect(game.isPaused).toBe(true);

            // Restart should reset pause state
            game.restart();
            expect(game.isPaused).toBe(false);
            expect(game.gameOver).toBe(false);
            expect(game.frameCount).toBe(0);

            // Verify pause functionality still works after restart
            game.pause();
            expect(game.isPaused).toBe(true);

            game.update(); // Should not advance
            expect(game.frameCount).toBe(0);

            game.resume();
            game.update(); // Should advance
            expect(game.frameCount).toBe(1);
        });

        it('should handle concurrent pause operations from different sources', async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));

            const resumeButton = document.getElementById('resumeButton');

            // Pause via keyboard
            const pauseEvent = new KeyboardEvent('keydown', { key: 'p' });
            document.dispatchEvent(pauseEvent);
            expect(game.isPaused).toBe(true);

            // Try to pause again via different key
            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
            document.dispatchEvent(escapeEvent);
            expect(game.isPaused).toBe(false); // Should toggle back

            // Pause again and try resume via button
            document.dispatchEvent(pauseEvent);
            expect(game.isPaused).toBe(true);

            resumeButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            expect(game.isPaused).toBe(false);
        });

        it('should maintain system stability under rapid input conditions', () => {
            // Rapid keyboard inputs
            for (let i = 0; i < 20; i++) {
                const key = i % 2 === 0 ? 'p' : 'Escape';
                const event = new KeyboardEvent('keydown', { key });
                document.dispatchEvent(event);
            }

            // System should remain stable
            expect(typeof game.isPaused).toBe('boolean');
            expect(game.frameCount).toBeGreaterThanOrEqual(0);
            expect(Array.isArray(game.playerTrail)).toBe(true);
            expect(Array.isArray(game.aiTrail)).toBe(true);
        });

        it('should handle pause system with game over transitions', () => {
            // Pause during normal gameplay
            game.pause();
            expect(game.isPaused).toBe(true);

            // Simulate game over while paused
            game.gameOver = true;

            // Try to resume (should fail due to game over)
            const resumeResult = game.resume();
            expect(resumeResult).toBe(false);
            expect(game.isPaused).toBe(true);

            // Try to toggle (should fail due to game over)
            const toggleResult = game.togglePause();
            expect(toggleResult).toBe(false);
            expect(game.isPaused).toBe(true);

            // Restart should clear both game over and pause states
            game.restart();
            expect(game.gameOver).toBe(false);
            expect(game.isPaused).toBe(false);
        });

        it('should preserve game state integrity across complex scenarios', () => {
            // Create complex game state
            game.changePlayerDirection('ArrowUp');
            for (let i = 0; i < 10; i++) {
                game.update();
            }
            game.changePlayerDirection('ArrowRight');
            for (let i = 0; i < 5; i++) {
                game.update();
            }

            const complexState = {
                frameCount: game.frameCount,
                playerPosition: { ...game.player },
                aiPosition: { ...game.ai },
                playerDirection: { ...game.playerDirection },
                playerTrailLength: game.playerTrail.length,
                aiTrailLength: game.aiTrail.length,
            };

            // Multiple pause/resume cycles
            for (let cycle = 0; cycle < 3; cycle++) {
                game.pause();

                // Try updates while paused
                for (let i = 0; i < 5; i++) {
                    game.update();
                }

                // State should be preserved
                expect(game.frameCount).toBe(complexState.frameCount);
                expect(game.player).toEqual(complexState.playerPosition);
                expect(game.ai).toEqual(complexState.aiPosition);
                expect(game.playerDirection).toEqual(complexState.playerDirection);
                expect(game.playerTrail).toHaveLength(complexState.playerTrailLength);
                expect(game.aiTrail).toHaveLength(complexState.aiTrailLength);

                game.resume();
            }

            // Final verification - one update should advance state
            game.update();
            expect(game.frameCount).toBe(complexState.frameCount + 1);
        });
    });

    describe('AI and Collision System Integration with Pause', () => {
        let aiController;
        let collisionDetectionEngine;

        beforeEach(() => {
            const { AIController } = require('@/core/ai.js');
            const { CollisionDetectionEngine } = require('@/core/collision.js');

            aiController = new AIController();
            collisionDetectionEngine = new CollisionDetectionEngine();
        });

        it('should ensure AI decision-making pauses correctly', () => {
            // Set up scenario where AI should make a decision
            for (let i = 0; i < 10; i++) {
                game.update();
            }

            // Position AI near boundary to force decision (within 10 units to trigger turn)
            game.ai.x = game.bounds - 0.5;
            game.aiDirection = { x: 1, y: 0, z: 0 };

            const gameState = game.getGameState();

            // Normal operation - AI should turn away from boundary
            const normalDecision = aiController.calculateAIDirection(gameState);
            expect(normalDecision.newDirection.x).not.toBe(1);

            // Pause and verify AI maintains current direction
            game.pause();
            const pausedGameState = game.getGameState();
            const pausedDecision = aiController.calculateAIDirection(pausedGameState);
            expect(pausedDecision.newDirection).toEqual(game.aiDirection);

            // Resume and verify AI resumes decision-making
            game.resume();
            const resumedGameState = game.getGameState();
            const resumedDecision = aiController.calculateAIDirection(resumedGameState);
            expect(resumedDecision.newDirection.x).not.toBe(1); // Should still turn away
        });

        it('should ensure collision detection respects pause state', () => {
            // Set up collision scenario
            for (let i = 0; i < 15; i++) {
                game.update(); // Get past grace period
            }

            // Position player at boundary
            game.player.x = game.bounds + 0.1;

            const gameState = game.getGameState();

            // Normal operation - should detect collision
            const normalCollision = collisionDetectionEngine.checkCollisions(gameState);
            expect(normalCollision.playerCollided).toBe(true);

            // Pause and verify no collision detection
            game.pause();
            const pausedGameState = game.getGameState();
            const pausedCollision = collisionDetectionEngine.checkCollisions(pausedGameState);
            expect(pausedCollision.playerCollided).toBe(false);

            // Resume and verify collision detection resumes
            game.resume();
            const resumedGameState = game.getGameState();
            const resumedCollision = collisionDetectionEngine.checkCollisions(resumedGameState);
            expect(resumedCollision.playerCollided).toBe(true);
        });

        it('should maintain system state integrity during pause', () => {
            // Create complex game state with trails
            game.changePlayerDirection('ArrowUp');
            for (let i = 0; i < 20; i++) {
                game.update();
            }

            const preState = {
                playerTrailLength: game.playerTrail.length,
                aiTrailLength: game.aiTrail.length,
                playerPosition: { ...game.player },
                aiPosition: { ...game.ai },
            };

            // Pause and verify systems maintain state
            game.pause();
            const pausedState = game.getGameState();

            // AI should not change direction
            const aiDecision = aiController.calculateAIDirection(pausedState);
            expect(aiDecision.newDirection).toEqual(game.aiDirection);

            // Collision system should not detect collisions
            const collisionResult = collisionDetectionEngine.checkCollisions(pausedState);
            expect(collisionResult.playerCollided).toBe(false);
            expect(collisionResult.aiCollided).toBe(false);

            // Game state should be preserved
            expect(game.playerTrail).toHaveLength(preState.playerTrailLength);
            expect(game.aiTrail).toHaveLength(preState.aiTrailLength);
            expect(game.player).toEqual(preState.playerPosition);
            expect(game.ai).toEqual(preState.aiPosition);
        });

        it('should test AI behavior resumption after pause', () => {
            // Set up AI in defensive mode
            for (let i = 0; i < 10; i++) {
                game.update();
            }

            // Create obstacle for AI to avoid
            game.playerTrail.push({ x: game.ai.x + 0.5, y: 0, z: game.ai.z });

            const initialAIDirection = { ...game.aiDirection };

            // Pause the game
            game.pause();

            // Multiple pause cycles to test state preservation
            for (let cycle = 0; cycle < 3; cycle++) {
                const pausedState = game.getGameState();
                const pausedDecision = aiController.calculateAIDirection(pausedState);
                expect(pausedDecision.newDirection).toEqual(game.aiDirection);

                // Brief resume and re-pause
                game.resume();
                game.pause();
            }

            // Final resume and test AI behavior
            game.resume();
            const finalState = game.getGameState();
            const finalDecision = aiController.calculateAIDirection(finalState);

            // AI should make appropriate decision based on current state
            expect(finalDecision.newDirection).toBeDefined();
            expect(finalDecision.newState).toBe('DEFENSIVE');
        });

        it('should handle edge cases during pause with AI and collision systems', () => {
            // Test with minimal game state
            game.restart();
            game.pause();

            const pausedState = game.getGameState();

            // AI should handle pause state gracefully even with minimal state
            expect(() => {
                const decision = aiController.calculateAIDirection(pausedState);
                expect(decision.newDirection).toEqual(game.aiDirection);
            }).not.toThrow();

            // Collision system should handle pause state gracefully
            expect(() => {
                const collision = collisionDetectionEngine.checkCollisions(pausedState);
                expect(collision.playerCollided).toBe(false);
                expect(collision.aiCollided).toBe(false);
            }).not.toThrow();

            // Resume and verify systems work normally
            game.resume();
            game.update();

            const resumedState = game.getGameState();
            const resumedDecision = aiController.calculateAIDirection(resumedState);
            const resumedCollision = collisionDetectionEngine.checkCollisions(resumedState);

            expect(resumedDecision).toBeDefined();
            expect(resumedCollision).toBeDefined();
        });
    });
});
