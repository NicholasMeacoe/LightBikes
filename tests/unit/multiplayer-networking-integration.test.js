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

const { GameRoom } = require('../../server/GameRoom.js');
const { AntiCheatValidator } = require('../../server/AntiCheatValidator.js');
const { ClientPrediction } = require('@/multiplayer/ClientPrediction.js');
const { LatencyCompensation } = require('@/multiplayer/LatencyCompensation.js');

describe('Online Multiplayer Component Integration', () => {
    describe('GameRoom Multi-Player Management', () => {
        let mockIo, mockSocket1, mockSocket2;

        beforeEach(() => {
            mockIo = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
            mockSocket1 = {
                id: 'socket1',
                join: jest.fn(),
                leave: jest.fn(),
                on: jest.fn(),
                emit: jest.fn(),
            };
            mockSocket2 = {
                id: 'socket2',
                join: jest.fn(),
                leave: jest.fn(),
                on: jest.fn(),
                emit: jest.fn(),
            };
        });

        it('should handle complete multiplayer game flow', () => {
            // Mock Date.now() to control time flow
            let mockTime = 1000000;
            const dateSpy = jest.spyOn(Date, 'now').mockImplementation(() => mockTime);

            const room = new GameRoom('ROOM01', { maxPlayers: 2, gameMode: 'classic' }, mockIo);

            room.addPlayer(mockSocket1, { name: 'Player1', isHost: true });
            room.addPlayer(mockSocket2, { name: 'Player2', isHost: false });
            expect(room.players.size).toBe(2);

            room.handleSetReady(mockSocket1.id, true);
            room.handleSetReady(mockSocket2.id, true);
            expect(room.areAllPlayersReady()).toBe(true);

            room.initializeGameState();
            expect(room.gameState).toBeDefined();

            room.status = 'playing';
            room.lastUpdateTime = mockTime; // Sync update time

            for (let i = 0; i < 10; i++) {
                mockTime += 16; // Advance 16ms per frame (~60fps)
                room.updateGameState();
            }
            expect(room.frameNumber).toBe(10);

            dateSpy.mockRestore();
        });
    });

    describe('AntiCheat Integration', () => {
        let room, validator, mockIo, mockSocket;

        beforeEach(() => {
            mockIo = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
            mockSocket = {
                id: 'socket1',
                join: jest.fn(),
                leave: jest.fn(),
                on: jest.fn(),
                emit: jest.fn(),
            };

            room = new GameRoom('ROOM01', { maxPlayers: 2 }, mockIo);
            room.addPlayer(mockSocket, { name: 'Player1', isHost: true });
            room.initializeGameState();

            validator = new AntiCheatValidator(room);
        });

        it('should validate movements', () => {
            const player = room.gameState.players[mockSocket.id];
            const newPos = {
                x: player.position.x + 0.1,
                y: player.position.y,
                z: player.position.z,
            };

            const result = validator.validatePosition(mockSocket.id, newPos, Date.now());
            expect(result.valid).toBe(true);
        });

        it('should detect teleportation', () => {
            const player = room.gameState.players[mockSocket.id];
            const teleportPos = {
                x: player.position.x + 10,
                y: player.position.y,
                z: player.position.z + 10,
            };

            const result = validator.validatePosition(mockSocket.id, teleportPos, Date.now());
            expect(result.valid).toBe(false);
            expect(result.violation).toBe('teleportation');
        });
    });

    describe('Client Prediction', () => {
        let mockGameInstance, clientPrediction;

        beforeEach(() => {
            mockGameInstance = {
                player: {
                    position: { x: 0, y: 0, z: 0 },
                    direction: { x: 1, y: 0, z: 0 },
                    trail: [],
                },
                frameCount: 0,
                // Add getGameState mock
                getGameState: jest.fn().mockReturnValue({
                    player: { x: 0, y: 0, z: 0 },
                    playerDirection: { x: 1, y: 0, z: 0 },
                    playerTrail: [],
                    frameCount: 0,
                }),
                changePlayerDirection: jest.fn().mockReturnValue(true),
            };
            clientPrediction = new ClientPrediction(mockGameInstance);
        });

        it('should predict and reconcile', () => {
            for (let i = 0; i < 5; i++) {
                const input = { direction: { x: 1, y: 0, z: 0 }, timestamp: Date.now() + i * 16 };
                clientPrediction.applyInput(input, input.timestamp);
            }

            const serverState = {
                players: {
                    p1: {
                        position: { x: 0.5, y: 0, z: 0 },
                        direction: { x: 1, y: 0, z: 0 },
                        trail: [],
                    },
                },
                timestamp: Date.now(),
            };
            clientPrediction.reconcileWithServer(serverState, serverState.timestamp);
            // Note: reconcileWithServer updates gameInstance directly, but our mock is simple.
            // We just verify it ran without error and called getGameState
            expect(mockGameInstance.getGameState).toHaveBeenCalled();
        });
    });

    describe('Latency Compensation', () => {
        let latencyComp;

        beforeEach(() => {
            latencyComp = new LatencyCompensation();
        });

        it('should interpolate states', () => {
            const timestamp = Date.now();
            const state1 = {
                position: { x: 0, y: 0, z: 0 },
                direction: { x: 1, y: 0, z: 0 },
                isAlive: true,
                id: 'p1',
                name: 'Player 1',
            };

            const state2 = {
                position: { x: 1, y: 0, z: 0 },
                direction: { x: 1, y: 0, z: 0 },
                isAlive: true,
                id: 'p1',
                name: 'Player 1',
            };

            // Use correct API: addStateToBuffer(playerId, state, timestamp)
            latencyComp.addStateToBuffer('p1', state1, timestamp);
            latencyComp.addStateToBuffer('p1', state2, timestamp + 100);

            // Use correct API: getInterpolatedState(playerId, renderTime)
            // We want to interpolate halfway (50ms after start)
            // Since interpolationDelay is 100ms by default (high quality),
            // we need to request a time that puts us between the two states AFTER delay adjustment.
            // interpolationTime = renderTime - delay
            // We want interpolationTime = timestamp + 50
            // So renderTime = timestamp + 50 + 100 = timestamp + 150
            const renderTime = timestamp + 150;

            const interpolated = latencyComp.getInterpolatedState('p1', renderTime);

            expect(interpolated).toBeDefined();
            expect(interpolated.position.x).toBeGreaterThan(0);
            expect(interpolated.position.x).toBeLessThan(1);
            expect(interpolated.position.x).toBeCloseTo(0.5, 1);
        });
    });
});
