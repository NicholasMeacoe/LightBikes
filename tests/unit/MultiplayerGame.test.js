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

const { MultiplayerGame } = require('@/multiplayer/MultiplayerGame.js');
const { GameModes } = require('@/systems/GameModes.js');

describe('MultiplayerGame', () => {
    let multiplayerGame;

    beforeEach(() => {
        multiplayerGame = new MultiplayerGame();
    });

    describe('constructor', () => {
        it('should initialize with multiplayer mode', () => {
            expect(multiplayerGame.gameMode).toBe('local-multiplayer');
            expect(multiplayerGame.isMultiplayer()).toBe(true);
        });

        it('should create two player entities', () => {
            expect(multiplayerGame.player1).toBeDefined();
            expect(multiplayerGame.player2).toBeDefined();
            expect(multiplayerGame.player1.id).toBe('P1');
            expect(multiplayerGame.player2.id).toBe('P2');
            expect(multiplayerGame.player1.color).toBe('green');
            expect(multiplayerGame.player2.color).toBe('blue');
        });

        it('should initialize local scoring system', () => {
            const scoring = multiplayerGame.getLocalScoring();
            expect(scoring.player1Wins).toBe(0);
            expect(scoring.player2Wins).toBe(0);
            expect(scoring.currentRound).toBe(1);
            expect(scoring.totalRounds).toBe(0);
        });

        it('should set up control schemes', () => {
            expect(multiplayerGame.controlSchemes.player1.up).toBe('ArrowUp');
            expect(multiplayerGame.controlSchemes.player2.up).toBe('KeyW');
        });
    });

    describe('init', () => {
        it('should reset game state', () => {
            multiplayerGame.gameOver = true;
            multiplayerGame.frameCount = 100;
            multiplayerGame.gameStarted = true;

            multiplayerGame.init();

            expect(multiplayerGame.gameOver).toBe(false);
            expect(multiplayerGame.frameCount).toBe(0);
            expect(multiplayerGame.gameStarted).toBe(false);
        });

        it('should reset player positions', () => {
            multiplayerGame.player1.position = { x: 5, y: 0, z: 5 };
            multiplayerGame.player2.position = { x: -5, y: 0, z: -5 };

            multiplayerGame.init();

            expect(multiplayerGame.player1.position.x).toBe(-10);
            expect(multiplayerGame.player2.position.x).toBe(10);
        });

        it('should clear legacy single-player properties', () => {
            multiplayerGame.init();

            expect(multiplayerGame.player).toBeNull();
            expect(multiplayerGame.ai).toBeNull();
            expect(multiplayerGame.aiOpponents).toEqual([]);
        });
    });

    describe('update', () => {
        it('should not update when game is over', () => {
            multiplayerGame.gameOver = true;
            const initialFrameCount = multiplayerGame.frameCount;

            multiplayerGame.update();

            expect(multiplayerGame.frameCount).toBe(initialFrameCount);
        });

        it('should not update when game is paused', () => {
            multiplayerGame.isPaused = true;
            const initialFrameCount = multiplayerGame.frameCount;

            multiplayerGame.update();

            expect(multiplayerGame.frameCount).toBe(initialFrameCount);
        });

        it('should mark game as started on first update', () => {
            expect(multiplayerGame.gameStarted).toBe(false);

            multiplayerGame.update();

            expect(multiplayerGame.gameStarted).toBe(true);
        });

        it('should increment frame count', () => {
            const initialFrameCount = multiplayerGame.frameCount;

            multiplayerGame.update();

            expect(multiplayerGame.frameCount).toBe(initialFrameCount + 1);
        });

        it('should update both players', () => {
            const player1InitialPos = { ...multiplayerGame.player1.position };
            const player2InitialPos = { ...multiplayerGame.player2.position };

            multiplayerGame.update();

            expect(multiplayerGame.player1.position.x).toBeGreaterThan(player1InitialPos.x);
            expect(multiplayerGame.player2.position.x).toBeLessThan(player2InitialPos.x);
        });
    });

    describe('changePlayerDirection', () => {
        it('should change Player 1 direction with arrow keys', () => {
            const result = multiplayerGame.changePlayerDirection('P1', 'ArrowUp');
            expect(result).toBe(true);
            expect(multiplayerGame.player1.direction).toEqual({ x: 0, y: 0, z: -1 });
        });

        it('should change Player 2 direction with WASD keys', () => {
            const result = multiplayerGame.changePlayerDirection('P2', 'KeyW');
            expect(result).toBe(true);
            expect(multiplayerGame.player2.direction).toEqual({ x: 0, y: 0, z: -1 });
        });

        it('should return false for invalid keys', () => {
            const result = multiplayerGame.changePlayerDirection('P1', 'KeyX');
            expect(result).toBe(false);
        });

        it('should return false for invalid player ID', () => {
            const result = multiplayerGame.changePlayerDirection('P3', 'ArrowUp');
            expect(result).toBe(false);
        });

        it('should prevent 180-degree turns', () => {
            multiplayerGame.player1.direction = { x: 1, y: 0, z: 0 };
            const result = multiplayerGame.changePlayerDirection('P1', 'ArrowLeft');
            expect(result).toBe(false);
            expect(multiplayerGame.player1.direction).toEqual({ x: 1, y: 0, z: 0 });
        });
    });

    describe('getGameState', () => {
        it('should return multiplayer game state', () => {
            const gameState = multiplayerGame.getGameState();

            expect(gameState.gameMode).toBe('local-multiplayer');
            expect(gameState.player1).toBeDefined();
            expect(gameState.player2).toBeDefined();
            expect(gameState.players).toHaveLength(2);
            expect(gameState.localScoring).toBeDefined();
        });

        it('should clear legacy single-player properties', () => {
            const gameState = multiplayerGame.getGameState();

            expect(gameState.player).toBeNull();
            expect(gameState.ai).toBeNull();
            expect(gameState.aiOpponents).toEqual([]);
        });
    });

    describe('handleRoundEnd', () => {
        it('should increment Player 1 wins when Player 2 crashes', () => {
            const collisionResult = { player1Collided: false, player2Collided: true };

            multiplayerGame.handleRoundEnd(collisionResult);

            const scoring = multiplayerGame.getLocalScoring();
            expect(scoring.player1Wins).toBe(1);
            expect(scoring.player2Wins).toBe(0);
            expect(scoring.totalRounds).toBe(1);
        });

        it('should increment Player 2 wins when Player 1 crashes', () => {
            const collisionResult = { player1Collided: true, player2Collided: false };

            multiplayerGame.handleRoundEnd(collisionResult);

            const scoring = multiplayerGame.getLocalScoring();
            expect(scoring.player1Wins).toBe(0);
            expect(scoring.player2Wins).toBe(1);
            expect(scoring.totalRounds).toBe(1);
        });

        it('should not change scores on tie (both crash)', () => {
            const collisionResult = { player1Collided: true, player2Collided: true };

            multiplayerGame.handleRoundEnd(collisionResult);

            const scoring = multiplayerGame.getLocalScoring();
            expect(scoring.player1Wins).toBe(0);
            expect(scoring.player2Wins).toBe(0);
            expect(scoring.totalRounds).toBe(1);
        });
    });

    describe('game end conditions', () => {
        it('should end game when Player 1 crashes', () => {
            multiplayerGame.player1.crash();
            expect(multiplayerGame.shouldEndGame()).toBe(true);
        });

        it('should end game when Player 2 crashes', () => {
            multiplayerGame.player2.crash();
            expect(multiplayerGame.shouldEndGame()).toBe(true);
        });

        it('should not end game when both players are alive', () => {
            expect(multiplayerGame.shouldEndGame()).toBe(false);
        });
    });

    describe('winner determination', () => {
        it('should return P1 as round winner when P2 crashes', () => {
            multiplayerGame.player2.crash();
            expect(multiplayerGame.getRoundWinner()).toBe('P1');
        });

        it('should return P2 as round winner when P1 crashes', () => {
            multiplayerGame.player1.crash();
            expect(multiplayerGame.getRoundWinner()).toBe('P2');
        });

        it('should return null for tie when both crash', () => {
            multiplayerGame.player1.crash();
            multiplayerGame.player2.crash();
            expect(multiplayerGame.getRoundWinner()).toBeNull();
        });

        it('should return overall winner based on total wins', () => {
            multiplayerGame.localScoring.player1Wins = 3;
            multiplayerGame.localScoring.player2Wins = 1;
            expect(multiplayerGame.getOverallWinner()).toBe('P1');

            multiplayerGame.localScoring.player1Wins = 1;
            multiplayerGame.localScoring.player2Wins = 3;
            expect(multiplayerGame.getOverallWinner()).toBe('P2');

            multiplayerGame.localScoring.player1Wins = 2;
            multiplayerGame.localScoring.player2Wins = 2;
            expect(multiplayerGame.getOverallWinner()).toBeNull();
        });
    });

    describe('player management', () => {
        it('should get player by ID', () => {
            expect(multiplayerGame.getPlayer('P1')).toBe(multiplayerGame.player1);
            expect(multiplayerGame.getPlayer('P2')).toBe(multiplayerGame.player2);
            expect(multiplayerGame.getPlayer('P3')).toBeNull();
        });

        it('should get all players', () => {
            const players = multiplayerGame.getPlayers();
            expect(players).toHaveLength(2);
            expect(players).toContain(multiplayerGame.player1);
            expect(players).toContain(multiplayerGame.player2);
        });

        it('should get alive players', () => {
            multiplayerGame.player1.crash();
            const alivePlayers = multiplayerGame.getAlivePlayers();
            expect(alivePlayers).toHaveLength(1);
            expect(alivePlayers[0]).toBe(multiplayerGame.player2);
        });
    });

    describe('score management', () => {
        it('should reset scores', () => {
            multiplayerGame.localScoring.player1Wins = 5;
            multiplayerGame.localScoring.player2Wins = 3;
            multiplayerGame.localScoring.totalRounds = 8;

            multiplayerGame.resetScores();

            const scoring = multiplayerGame.getLocalScoring();
            expect(scoring.player1Wins).toBe(0);
            expect(scoring.player2Wins).toBe(0);
            expect(scoring.totalRounds).toBe(0);
            expect(scoring.currentRound).toBe(1);
        });

        it('should maintain scores on restart', () => {
            multiplayerGame.localScoring.player1Wins = 2;
            multiplayerGame.localScoring.player2Wins = 1;

            multiplayerGame.restart();

            const scoring = multiplayerGame.getLocalScoring();
            expect(scoring.player1Wins).toBe(2);
            expect(scoring.player2Wins).toBe(1);
        });
    });
});
