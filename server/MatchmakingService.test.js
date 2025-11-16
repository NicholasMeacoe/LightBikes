const { MatchmakingService } = require('./MatchmakingService');

describe('MatchmakingService', () => {
    let service;
    let mockGameServer;
    let mockRooms;

    beforeEach(() => {
        mockRooms = new Map();
        mockGameServer = {
            rooms: mockRooms
        };
        service = new MatchmakingService(mockGameServer);
    });

    const createMockRoom = (id, settings, playerCount, status = 'waiting') => {
        return {
            id,
            settings: {
                maxPlayers: settings.maxPlayers || 4,
                gameMode: settings.gameMode || 'classic',
                isPrivate: settings.isPrivate || false
            },
            status,
            createdAt: Date.now(),
            canJoin: jest.fn().mockReturnValue(status === 'waiting'),
            getPlayerCount: jest.fn().mockReturnValue(playerCount)
        };
    };

    describe('getAvailableRooms', () => {
        it('should return empty array when no rooms', () => {
            const rooms = service.getAvailableRooms();
            expect(rooms).toEqual([]);
        });

        it('should return only joinable public rooms', () => {
            mockRooms.set('ROOM01', createMockRoom('ROOM01', {}, 2));
            mockRooms.set('ROOM02', createMockRoom('ROOM02', { isPrivate: true }, 1));
            mockRooms.set('ROOM03', createMockRoom('ROOM03', {}, 3, 'playing'));

            const rooms = service.getAvailableRooms();
            expect(rooms).toHaveLength(1);
            expect(rooms[0].id).toBe('ROOM01');
        });
    });

    describe('findQuickMatchRoom', () => {
        it('should return null when no rooms available', () => {
            const room = service.findQuickMatchRoom();
            expect(room).toBeNull();
        });

        it('should return room with most players', () => {
            mockRooms.set('ROOM01', createMockRoom('ROOM01', {}, 1));
            mockRooms.set('ROOM02', createMockRoom('ROOM02', {}, 3));
            mockRooms.set('ROOM03', createMockRoom('ROOM03', {}, 2));

            const room = service.findQuickMatchRoom();
            expect(room.id).toBe('ROOM02');
        });

        it('should prefer matching game mode', () => {
            mockRooms.set('ROOM01', createMockRoom('ROOM01', { gameMode: 'classic' }, 3));
            mockRooms.set('ROOM02', createMockRoom('ROOM02', { gameMode: 'timeTrial' }, 2));

            const room = service.findQuickMatchRoom('timeTrial');
            expect(room.id).toBe('ROOM02');
        });

        it('should fallback to any mode if preferred not available', () => {
            mockRooms.set('ROOM01', createMockRoom('ROOM01', { gameMode: 'classic' }, 2));

            const room = service.findQuickMatchRoom('timeTrial');
            expect(room.id).toBe('ROOM01');
        });
    });

    describe('getRoomList', () => {
        beforeEach(() => {
            mockRooms.set('ROOM01', createMockRoom('ROOM01', { gameMode: 'classic' }, 2));
            mockRooms.set('ROOM02', createMockRoom('ROOM02', { gameMode: 'timeTrial' }, 3));
            mockRooms.set('ROOM03', createMockRoom('ROOM03', { gameMode: 'classic' }, 1));
        });

        it('should return all available rooms', () => {
            const rooms = service.getRoomList();
            expect(rooms).toHaveLength(3);
        });

        it('should filter by game mode', () => {
            const rooms = service.getRoomList({ gameMode: 'classic' });
            expect(rooms).toHaveLength(2);
            expect(rooms.every(r => r.gameMode === 'classic')).toBe(true);
        });

        it('should filter by min players', () => {
            const rooms = service.getRoomList({ minPlayers: 2 });
            expect(rooms).toHaveLength(2);
            expect(rooms.every(r => r.playerCount >= 2)).toBe(true);
        });

        it('should filter by max players', () => {
            const rooms = service.getRoomList({ maxPlayers: 2 });
            expect(rooms).toHaveLength(2);
            expect(rooms.every(r => r.playerCount <= 2)).toBe(true);
        });

        it('should sort by player count descending', () => {
            const rooms = service.getRoomList({ sortBy: 'playerCount', sortOrder: 'desc' });
            expect(rooms[0].playerCount).toBe(3);
            expect(rooms[2].playerCount).toBe(1);
        });

        it('should sort by player count ascending', () => {
            const rooms = service.getRoomList({ sortBy: 'playerCount', sortOrder: 'asc' });
            expect(rooms[0].playerCount).toBe(1);
            expect(rooms[2].playerCount).toBe(3);
        });

        it('should limit results', () => {
            const rooms = service.getRoomList({ limit: 2 });
            expect(rooms).toHaveLength(2);
        });

        it('should combine multiple filters', () => {
            const rooms = service.getRoomList({
                gameMode: 'classic',
                minPlayers: 2,
                limit: 1
            });
            expect(rooms).toHaveLength(1);
            expect(rooms[0].gameMode).toBe('classic');
            expect(rooms[0].playerCount).toBeGreaterThanOrEqual(2);
        });
    });

    describe('searchRooms', () => {
        beforeEach(() => {
            mockRooms.set('ABC123', createMockRoom('ABC123', {}, 2));
            mockRooms.set('ABC456', createMockRoom('ABC456', {}, 1));
            mockRooms.set('XYZ789', createMockRoom('XYZ789', {}, 3));
        });

        it('should find rooms by partial ID', () => {
            const rooms = service.searchRooms('ABC');
            expect(rooms).toHaveLength(2);
            expect(rooms.every(r => r.id.includes('ABC'))).toBe(true);
        });

        it('should be case insensitive', () => {
            const rooms = service.searchRooms('abc');
            expect(rooms).toHaveLength(2);
        });

        it('should return empty array for no matches', () => {
            const rooms = service.searchRooms('ZZZ');
            expect(rooms).toEqual([]);
        });

        it('should handle empty query', () => {
            const rooms = service.searchRooms('');
            expect(rooms).toEqual([]);
        });

        it('should exclude private rooms', () => {
            mockRooms.set('PVT001', createMockRoom('PVT001', { isPrivate: true }, 2));
            const rooms = service.searchRooms('PVT');
            expect(rooms).toEqual([]);
        });
    });

    describe('getRecommendedRooms', () => {
        beforeEach(() => {
            // Room with good fill ratio
            mockRooms.set('ROOM01', createMockRoom('ROOM01', { gameMode: 'classic' }, 2));
            // Room with matching preference
            mockRooms.set('ROOM02', createMockRoom('ROOM02', { gameMode: 'timeTrial' }, 1));
            // Nearly full room
            mockRooms.set('ROOM03', createMockRoom('ROOM03', { gameMode: 'classic' }, 3));
        });

        it('should return recommended rooms', () => {
            const rooms = service.getRecommendedRooms();
            expect(rooms.length).toBeGreaterThan(0);
            expect(rooms.length).toBeLessThanOrEqual(5);
        });

        it('should prioritize matching game mode', () => {
            const rooms = service.getRecommendedRooms({ gameMode: 'timeTrial' });
            expect(rooms[0].gameMode).toBe('timeTrial');
        });

        it('should return max 5 rooms', () => {
            for (let i = 0; i < 10; i++) {
                mockRooms.set(`ROOM${i}`, createMockRoom(`ROOM${i}`, {}, 2));
            }
            const rooms = service.getRecommendedRooms();
            expect(rooms).toHaveLength(5);
        });
    });

    describe('canJoinRoom', () => {
        it('should return false for non-existent room', () => {
            const result = service.canJoinRoom('NONEXIST');
            expect(result.canJoin).toBe(false);
            expect(result.reason).toBe('Room not found');
        });

        it('should return true for joinable room', () => {
            mockRooms.set('ROOM01', createMockRoom('ROOM01', {}, 2));
            const result = service.canJoinRoom('ROOM01');
            expect(result.canJoin).toBe(true);
        });

        it('should return false for room in progress', () => {
            const room = createMockRoom('ROOM01', {}, 2, 'playing');
            mockRooms.set('ROOM01', room);
            const result = service.canJoinRoom('ROOM01');
            expect(result.canJoin).toBe(false);
            expect(result.reason).toBe('Game in progress');
        });

        it('should return false for full room', () => {
            const room = createMockRoom('ROOM01', { maxPlayers: 2 }, 2);
            room.canJoin.mockReturnValue(false);
            mockRooms.set('ROOM01', room);
            const result = service.canJoinRoom('ROOM01');
            expect(result.canJoin).toBe(false);
            expect(result.reason).toBe('Room is full');
        });
    });

    describe('getStats', () => {
        it('should return statistics', () => {
            mockRooms.set('ROOM01', createMockRoom('ROOM01', { gameMode: 'classic' }, 2));
            mockRooms.set('ROOM02', createMockRoom('ROOM02', { gameMode: 'classic' }, 1));
            mockRooms.set('ROOM03', createMockRoom('ROOM03', { gameMode: 'timeTrial' }, 3));

            const stats = service.getStats();
            expect(stats.availableRooms).toBe(3);
            expect(stats.totalRooms).toBe(3);
            expect(stats.gameModes.classic.rooms).toBe(2);
            expect(stats.gameModes.classic.players).toBe(3);
            expect(stats.gameModes.timeTrial.rooms).toBe(1);
            expect(stats.gameModes.timeTrial.players).toBe(3);
        });

        it('should handle empty rooms', () => {
            const stats = service.getStats();
            expect(stats.availableRooms).toBe(0);
            expect(stats.totalRooms).toBe(0);
            expect(stats.gameModes).toEqual({});
        });
    });

    describe('getRoomListItem', () => {
        it('should return formatted room data', () => {
            const room = createMockRoom('ROOM01', { gameMode: 'classic', maxPlayers: 4 }, 2);
            const item = service.getRoomListItem(room);

            expect(item).toHaveProperty('id', 'ROOM01');
            expect(item).toHaveProperty('playerCount', 2);
            expect(item).toHaveProperty('maxPlayers', 4);
            expect(item).toHaveProperty('gameMode', 'classic');
            expect(item).toHaveProperty('status', 'waiting');
            expect(item).toHaveProperty('createdAt');
        });
    });
});
