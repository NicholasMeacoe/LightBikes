/**
 * MatchmakingService handles player matchmaking and room discovery
 * Provides quick-match, room browsing, and filtering capabilities
 */
class MatchmakingService {
    constructor(gameServer) {
        this.gameServer = gameServer;
    }

    /**
     * Find best room for quick match
     * Prioritizes rooms with similar player counts and game modes
     */
    findQuickMatchRoom(preferredGameMode = null) {
        const availableRooms = this.getAvailableRooms();

        if (availableRooms.length === 0) {
            return null;
        }

        // Filter by game mode if specified
        let filteredRooms = availableRooms;
        if (preferredGameMode) {
            const modeRooms = availableRooms.filter(
                room => room.settings.gameMode === preferredGameMode
            );
            if (modeRooms.length > 0) {
                filteredRooms = modeRooms;
            }
        }

        // Sort by player count (prefer fuller rooms for faster games)
        filteredRooms.sort((a, b) => {
            const aCount = a.getPlayerCount();
            const bCount = b.getPlayerCount();
            return bCount - aCount;
        });

        return filteredRooms[0];
    }

    /**
     * Get list of available rooms
     */
    getAvailableRooms() {
        const rooms = [];
        for (const room of this.gameServer.rooms.values()) {
            if (room.canJoin() && !room.settings.isPrivate) {
                rooms.push(room);
            }
        }
        return rooms;
    }

    /**
     * Get room list with filters
     */
    getRoomList(filters = {}) {
        let rooms = this.getAvailableRooms();

        // Apply game mode filter
        if (filters.gameMode) {
            rooms = rooms.filter(room => room.settings.gameMode === filters.gameMode);
        }

        // Apply player count filter
        if (filters.minPlayers !== undefined) {
            rooms = rooms.filter(room => room.getPlayerCount() >= filters.minPlayers);
        }
        if (filters.maxPlayers !== undefined) {
            rooms = rooms.filter(room => room.getPlayerCount() <= filters.maxPlayers);
        }

        // Apply room status filter
        if (filters.status) {
            rooms = rooms.filter(room => room.status === filters.status);
        }

        // Sort rooms
        const sortBy = filters.sortBy || 'playerCount';
        const sortOrder = filters.sortOrder || 'desc';

        rooms.sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case 'playerCount':
                    aValue = a.getPlayerCount();
                    bValue = b.getPlayerCount();
                    break;
                case 'createdAt':
                    aValue = a.createdAt;
                    bValue = b.createdAt;
                    break;
                default:
                    aValue = a.getPlayerCount();
                    bValue = b.getPlayerCount();
            }

            if (sortOrder === 'asc') {
                return aValue - bValue;
            } else {
                return bValue - aValue;
            }
        });

        // Apply limit
        if (filters.limit) {
            rooms = rooms.slice(0, filters.limit);
        }

        return rooms.map(room => this.getRoomListItem(room));
    }

    /**
     * Get room list item data
     */
    getRoomListItem(room) {
        return {
            id: room.id,
            playerCount: room.getPlayerCount(),
            maxPlayers: room.settings.maxPlayers,
            gameMode: room.settings.gameMode,
            status: room.status,
            createdAt: room.createdAt
        };
    }

    /**
     * Search rooms by ID or partial ID
     */
    searchRooms(query) {
        if (!query || typeof query !== 'string') {
            return [];
        }

        const upperQuery = query.toUpperCase();
        const rooms = [];

        for (const room of this.gameServer.rooms.values()) {
            if (room.id.includes(upperQuery) && !room.settings.isPrivate) {
                rooms.push(this.getRoomListItem(room));
            }
        }

        return rooms;
    }

    /**
     * Get recommended rooms for a player
     * Returns rooms that are good matches based on various factors
     */
    getRecommendedRooms(playerPreferences = {}) {
        const rooms = this.getAvailableRooms();

        // Score each room
        const scoredRooms = rooms.map(room => {
            let score = 0;

            // Prefer rooms with more players (but not full)
            const playerCount = room.getPlayerCount();
            const fillRatio = playerCount / room.settings.maxPlayers;
            if (fillRatio > 0.25 && fillRatio < 0.9) {
                score += 10 * fillRatio;
            }

            // Prefer matching game mode
            if (playerPreferences.gameMode && 
                room.settings.gameMode === playerPreferences.gameMode) {
                score += 20;
            }

            // Prefer newer rooms
            const age = Date.now() - room.createdAt;
            const ageMinutes = age / (1000 * 60);
            if (ageMinutes < 5) {
                score += 5;
            }

            // Prefer rooms in waiting status
            if (room.status === 'waiting') {
                score += 15;
            }

            return { room, score };
        });

        // Sort by score
        scoredRooms.sort((a, b) => b.score - a.score);

        // Return top 5 rooms
        return scoredRooms
            .slice(0, 5)
            .map(item => this.getRoomListItem(item.room));
    }

    /**
     * Check if a room exists and is joinable
     */
    canJoinRoom(roomId) {
        const room = this.gameServer.rooms.get(roomId);
        if (!room) {
            return { canJoin: false, reason: 'Room not found' };
        }

        if (!room.canJoin()) {
            if (room.status === 'playing') {
                return { canJoin: false, reason: 'Game in progress' };
            }
            if (room.getPlayerCount() >= room.settings.maxPlayers) {
                return { canJoin: false, reason: 'Room is full' };
            }
            return { canJoin: false, reason: 'Cannot join room' };
        }

        return { canJoin: true };
    }

    /**
     * Get matchmaking statistics
     */
    getStats() {
        const availableRooms = this.getAvailableRooms();
        const gameModes = {};

        for (const room of availableRooms) {
            const mode = room.settings.gameMode;
            if (!gameModes[mode]) {
                gameModes[mode] = { rooms: 0, players: 0 };
            }
            gameModes[mode].rooms++;
            gameModes[mode].players += room.getPlayerCount();
        }

        return {
            availableRooms: availableRooms.length,
            totalRooms: this.gameServer.rooms.size,
            gameModes: gameModes
        };
    }
}

module.exports = { MatchmakingService };
