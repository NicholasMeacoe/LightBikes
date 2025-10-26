const { Game } = require('./game.js');

describe('Game', () => {
    let game;

    beforeEach(() => {
        game = new Game();
    });

    function advanceFrames(frameCount) {
        for (let i = 0; i < frameCount && !game.gameOver; i++) {
            game.update();
        }
    }

    describe('Initialization', () => {
        it('should initialize with default values', () => {
            expect(game.gameOver).toBe(false);
            expect(game.frameCount).toBe(0);
            expect(game.player).toEqual({ x: 0, y: 0, z: 0 });
            expect(game.ai).toEqual({ x: 0, y: 0, z: -10 });
            expect(game.bounds).toBe(30);
            expect(game.playerDirection).toEqual({ x: 1, y: 0, z: 0 });
            expect(game.aiDirection).toEqual({ x: 1, y: 0, z: 0 });
            expect(game.playerTrail).toEqual([]);
            expect(game.aiTrail).toEqual([]);
        });

        it('should initialize with custom bounds', () => {
            const customGame = new Game();
            customGame.bounds = 50;
            expect(customGame.bounds).toBe(50);
        });
    });

    describe('Player Movement', () => {
        it('should update player position', () => {
            game.update();
            expect(game.player.x).toBeCloseTo(0.1);
            expect(game.player.z).toBeCloseTo(0);
        });

        it('should create player trail', () => {
            game.update();
            expect(game.playerTrail).toHaveLength(1);
            expect(game.playerTrail[0]).toEqual({ x: 0.1, y: 0, z: 0 });
        });

        it('should accumulate player trail over multiple frames', () => {
            advanceFrames(5);
            expect(game.playerTrail).toHaveLength(5);
            expect(game.player.x).toBeCloseTo(0.5);
        });
    });

    describe('AI Movement', () => {
        it('should update AI position', () => {
            game.update();
            expect(game.ai.x).toBeCloseTo(0.1);
            expect(game.ai.z).toBeCloseTo(-10);
        });

        it('should create AI trail', () => {
            game.update();
            expect(game.aiTrail).toHaveLength(1);
            expect(game.aiTrail[0].x).toBeCloseTo(0.1);
            expect(game.aiTrail[0].z).toBeCloseTo(-10);
        });
    });

    describe('Player Direction Changes', () => {
        it('should change player direction to up', () => {
            game.changePlayerDirection('ArrowUp');
            expect(game.playerDirection).toEqual({ x: 0, y: 0, z: -1 });
        });

        it('should change player direction to down', () => {
            game.changePlayerDirection('ArrowDown');
            expect(game.playerDirection).toEqual({ x: 0, y: 0, z: 1 });
        });

        it('should change player direction to left', () => {
            game.playerDirection = {x: 0, y: 0, z: 1};
            game.changePlayerDirection('ArrowLeft');
            expect(game.playerDirection).toEqual({ x: -1, y: 0, z: 0 });
        });

        it('should change player direction to right', () => {
            game.playerDirection = {x: 0, y: 0, z: 1};
            game.changePlayerDirection('ArrowRight');
            expect(game.playerDirection).toEqual({ x: 1, y: 0, z: 0 });
        });

        it('should not allow reverse direction changes', () => {
            game.playerDirection = { x: 1, y: 0, z: 0 };
            game.changePlayerDirection('ArrowLeft'); // Should not change
            expect(game.playerDirection).toEqual({ x: 1, y: 0, z: 0 });
        });

        it('should not allow reverse direction changes for vertical movement', () => {
            game.playerDirection = { x: 0, y: 0, z: 1 };
            game.changePlayerDirection('ArrowUp'); // Should not change
            expect(game.playerDirection).toEqual({ x: 0, y: 0, z: 1 });
        });

        it('should handle invalid key inputs gracefully', () => {
            const originalDirection = { ...game.playerDirection };
            game.changePlayerDirection('InvalidKey');
            expect(game.playerDirection).toEqual(originalDirection);
        });

        it('should handle undefined key inputs gracefully', () => {
            const originalDirection = { ...game.playerDirection };
            game.changePlayerDirection(undefined);
            expect(game.playerDirection).toEqual(originalDirection);
        });
    });

    describe('Game State Management', () => {
        it('should restart the game', () => {
            game.gameOver = true;
            game.frameCount = 100;
            game.player.x = 10;
            game.playerTrail = [{ x: 1, y: 0, z: 1 }];
            game.restart();
            expect(game.gameOver).toBe(false);
            expect(game.frameCount).toBe(0);
            expect(game.player).toEqual({ x: 0, y: 0, z: 0 });
            expect(game.playerTrail).toEqual([]);
        });

        it('should not update when game is over', () => {
            game.gameOver = true;
            const initialFrameCount = game.frameCount;
            const initialPlayerPos = { ...game.player };
            game.update();
            expect(game.frameCount).toBe(initialFrameCount);
            expect(game.player).toEqual(initialPlayerPos);
        });

        it('should increment frame count on update', () => {
            expect(game.frameCount).toBe(0);
            game.update();
            expect(game.frameCount).toBe(1);
            game.update();
            expect(game.frameCount).toBe(2);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle very small movements', () => {
            const originalSpeed = 0.1;
            // Simulate very small movement
            game.playerDirection = { x: 0.001, z: 0 };
            game.update();
            expect(game.player.x).toBeCloseTo(0.0001);
        });

        it('should handle zero movement', () => {
            game.playerDirection = { x: 0, z: 0 };
            const initialPos = { ...game.player };
            game.update();
            expect(game.player.x).toBe(initialPos.x);
            expect(game.player.z).toBe(initialPos.z);
        });

        it('should maintain game state consistency after multiple restarts', () => {
            for (let i = 0; i < 5; i++) {
                advanceFrames(10);
                game.restart();
                expect(game.gameOver).toBe(false);
                expect(game.frameCount).toBe(0);
                expect(game.playerTrail).toEqual([]);
                expect(game.aiTrail).toEqual([]);
            }
        });
    });
});
