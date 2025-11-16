const { GameServer } = require('./GameServer');
const { GameRoom } = require('./GameRoom');

// Mock GameRoom
jest.mock('./GameRoom');

describe('GameServer', () => {
    let server;

    beforeEach(() => {
        server = new GameServer(3001);
        GameRoom.mockClear();
    });

    afterEach(() => {
        if (server.isRunning) {
            server.stop();
        }
    });

    describe('constructor', () => {
        it('should initialize with default port', () => {
            const defaultServer = new GameServer();
            expect(defaultServer.port).toBe(3000);
        });

        it('should initialize with custom port', () => {
            expect(server.port).toBe(3001);
        });

        it('should initialize empty collections', () => {
            expect(server.rooms.size).toBe(0);
            expect(server.playerRooms.size).toBe(0);
            expect(server.isRunning).toBe(false);
        });
    });

    describe('validateRoomSettings', () => {
        it('should validate correct settings', () => {
            const result = server.validateRoomSettings({
                maxPlayers: 4,
                gameMode: 'classic',
                isPrivate: false
            });
            expect(result.valid).toBe(true);
            expect(result.settings.maxPlayers).toBe(4);
        });

        it('should reject null settings', () => {
            const result = server.validateRoomSettings(null);
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Settings are required');
        });

        it('should reject invalid max players', () => {
            const result = server.validateRoomSettings({
                maxPlayers: 5,
                gameMode: 'classic'
            });
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Max players');
        });

        it('should reject invalid game mode', () => {
            const result = server.validateRoomSettings({
                maxPlayers: 4,
                gameMode: 'invalid'
            });
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Invalid game mode');
        });

        it('should use default values', () => {
            const result = server.validateRoomSettings({});
            expect(result.valid).toBe(true);
            expect(result.settings.maxPlayers).toBe(4);
            expect(result.settings.gameMode).toBe('classic');
            expect(result.settings.isPrivate).toBe(false);
        });
    });

    describe('generateRoomId', () => {
        it('should generate 6 character room ID', () => {
            const roomId = server.generateRoomId();
            expect(roomId).toHaveLength(6);
            expect(roomId).toMatch(/^[A-Z0-9]+$/);
        });

        it('should generate unique room IDs', () => {
            const ids = new Set();
            for (let i = 0; i < 100; i++) {
                ids.add(server.generateRoomId());
            }
            expect(ids.size).toBe(100);
        });

        it('should not generate existing room ID', () => {
            server.rooms.set('ABC123', {});
            const newId = server.generateRoomId();
            expect(newId).not.toBe('ABC123');
        });
    });

    describe('log', () => {
        let consoleSpy;

        beforeEach(() => {
            consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        });

        afterEach(() => {
            consoleSpy.mockRestore();
        });

        it('should log info messages', () => {
            server.log('info', 'Test message');
            expect(consoleSpy).toHaveBeenCalled();
            expect(consoleSpy.mock.calls[0][0]).toContain('[INFO]');
            expect(consoleSpy.mock.calls[0][0]).toContain('Test message');
        });

        it('should log with data', () => {
            server.logLevel = 'debug';
            server.log('debug', 'Test', { key: 'value' });
            expect(consoleSpy).toHaveBeenCalledTimes(2);
        });

        it('should respect log level', () => {
            server.logLevel = 'error';
            server.log('info', 'Should not log');
            expect(consoleSpy).not.toHaveBeenCalled();
        });
    });

    describe('getStats', () => {
        it('should return server statistics', () => {
            const stats = server.getStats();
            expect(stats).toHaveProperty('isRunning');
            expect(stats).toHaveProperty('port');
            expect(stats).toHaveProperty('roomCount');
            expect(stats).toHaveProperty('playerCount');
            expect(stats).toHaveProperty('rooms');
            expect(stats.port).toBe(3001);
        });

        it('should include room information', () => {
            const mockRoom = {
                id: 'TEST01',
                getPlayerCount: jest.fn().mockReturnValue(2),
                status: 'waiting'
            };
            server.rooms.set('TEST01', mockRoom);

            const stats = server.getStats();
            expect(stats.roomCount).toBe(1);
            expect(stats.rooms).toHaveLength(1);
            expect(stats.rooms[0].id).toBe('TEST01');
        });
    });

    describe('destroyRoom', () => {
        it('should destroy existing room', () => {
            const mockRoom = {
                destroy: jest.fn()
            };
            server.rooms.set('TEST01', mockRoom);

            server.destroyRoom('TEST01');
            expect(mockRoom.destroy).toHaveBeenCalled();
            expect(server.rooms.has('TEST01')).toBe(false);
        });

        it('should handle non-existent room', () => {
            expect(() => server.destroyRoom('NONEXIST')).not.toThrow();
        });
    });
});
