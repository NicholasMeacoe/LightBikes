/**
 * SpectatorManager - Manages spectator functionality for online multiplayer
 * Allows players to watch ongoing games and waiting players to spectate
 */

/**
 * SpectatorData - Represents a spectator in the system
 */
class SpectatorData {
    constructor(socketId, name, joinedAt) {
        this.socketId = socketId;
        this.name = name;
        this.joinedAt = joinedAt;
        this.followingPlayerId = null; // null = free camera, playerId = following specific player
        this.cameraMode = 'free'; // 'free', 'follow', 'overview'
    }

    toNetworkFormat() {
        return {
            socketId: this.socketId,
            name: this.name,
            followingPlayerId: this.followingPlayerId,
            cameraMode: this.cameraMode
        };
    }
}

/**
 * SpectatorManager - Main spectator management class
 */
class SpectatorManager {
    constructor(gameRoom) {
        this.gameRoom = gameRoom;
        
        // Spectator tracking
        this.spectators = new Map(); // socketId -> SpectatorData
        
        // Spectator chat (separate from player chat)
        this.spectatorChatEnabled = true;
        this.maxSpectators = 10; // Limit to prevent server overload
        
        // Update throttling for spectators
        this.lastSpectatorUpdate = 0;
        this.spectatorUpdateInterval = 33; // ~30fps for spectators (lower than players)
    }

    /**
     * Add a spectator to the room
     */
    addSpectator(socket, spectatorData) {
        // Check spectator limit
        if (this.spectators.size >= this.maxSpectators) {
            return {
                success: false,
                reason: 'spectator_limit_reached'
            };
        }

        // Check if already a spectator
        if (this.spectators.has(socket.id)) {
            return {
                success: false,
                reason: 'already_spectating'
            };
        }

        // Create spectator
        const spectator = new SpectatorData(
            socket.id,
            spectatorData.name || `Spectator_${socket.id.substring(0, 4)}`,
            Date.now()
        );

        this.spectators.set(socket.id, spectator);

        // Join socket to room
        socket.join(this.gameRoom.id);

        // Set up spectator event handlers
        this.setupSpectatorHandlers(socket);

        // Send initial game state to spectator
        this.sendInitialState(socket);

        // Notify room of new spectator
        this.gameRoom.broadcastToRoom('spectatorJoined', {
            spectator: spectator.toNetworkFormat(),
            spectatorCount: this.spectators.size
        });

        console.log(`[Spectator] ${spectator.name} joined room ${this.gameRoom.id}`);

        return {
            success: true,
            spectator: spectator
        };
    }

    /**
     * Remove a spectator from the room
     */
    removeSpectator(socketId) {
        const spectator = this.spectators.get(socketId);
        if (!spectator) {
            return false;
        }

        // Remove from spectators
        this.spectators.delete(socketId);

        // Leave room
        const socket = this.gameRoom.sockets.get(socketId);
        if (socket) {
            socket.leave(this.gameRoom.id);
        }

        // Notify room
        this.gameRoom.broadcastToRoom('spectatorLeft', {
            spectatorId: socketId,
            spectatorCount: this.spectators.size
        });

        console.log(`[Spectator] ${spectator.name} left room ${this.gameRoom.id}`);

        return true;
    }

    /**
     * Set up event handlers for spectator socket
     */
    setupSpectatorHandlers(socket) {
        // Camera control
        socket.on('spectatorSetCamera', (data) => {
            this.handleSetCamera(socket.id, data);
        });

        // Follow player
        socket.on('spectatorFollowPlayer', (playerId) => {
            this.handleFollowPlayer(socket.id, playerId);
        });

        // Spectator chat
        socket.on('spectatorChat', (message) => {
            this.handleSpectatorChat(socket.id, message);
        });

        // Request state update
        socket.on('spectatorRequestUpdate', () => {
            this.sendGameStateToSpectator(socket);
        });
    }

    /**
     * Send initial game state to new spectator
     */
    sendInitialState(socket) {
        const gameState = this.gameRoom.gameState;
        
        if (gameState) {
            // Send full game state
            socket.emit('spectatorInitialState', {
                gameState: this.formatGameStateForSpectator(gameState),
                roomData: this.gameRoom.getRoomData(),
                spectators: this.getSpectatorList()
            });
        } else {
            // Game not started yet, send room info
            socket.emit('spectatorWaiting', {
                roomData: this.gameRoom.getRoomData(),
                message: 'Waiting for game to start'
            });
        }
    }

    /**
     * Handle camera mode change
     */
    handleSetCamera(socketId, data) {
        const spectator = this.spectators.get(socketId);
        if (!spectator) return;

        const { mode, playerId } = data;

        // Validate camera mode
        if (!['free', 'follow', 'overview'].includes(mode)) {
            return;
        }

        spectator.cameraMode = mode;

        if (mode === 'follow' && playerId) {
            spectator.followingPlayerId = playerId;
        } else {
            spectator.followingPlayerId = null;
        }

        console.log(`[Spectator] ${spectator.name} changed camera to ${mode}`);
    }

    /**
     * Handle follow player request
     */
    handleFollowPlayer(socketId, playerId) {
        const spectator = this.spectators.get(socketId);
        if (!spectator) return;

        // Validate player exists
        const gameState = this.gameRoom.gameState;
        if (gameState && gameState.players[playerId]) {
            spectator.cameraMode = 'follow';
            spectator.followingPlayerId = playerId;
            
            console.log(`[Spectator] ${spectator.name} following player ${playerId}`);
        }
    }

    /**
     * Handle spectator chat message
     */
    handleSpectatorChat(socketId, message) {
        if (!this.spectatorChatEnabled) return;

        const spectator = this.spectators.get(socketId);
        if (!spectator) return;

        // Validate message
        if (!message || typeof message !== 'string' || message.length > 200) {
            return;
        }

        // Broadcast to all spectators only
        this.broadcastToSpectators('spectatorChat', {
            spectatorId: socketId,
            spectatorName: spectator.name,
            message: message,
            timestamp: Date.now()
        });
    }

    /**
     * Update spectators with current game state
     */
    update(currentTime) {
        // Throttle updates for spectators
        if (currentTime - this.lastSpectatorUpdate < this.spectatorUpdateInterval) {
            return;
        }
        this.lastSpectatorUpdate = currentTime;

        // Send game state to all spectators
        const gameState = this.gameRoom.gameState;
        if (gameState && this.spectators.size > 0) {
            const spectatorState = this.formatGameStateForSpectator(gameState);
            
            this.broadcastToSpectators('spectatorGameState', spectatorState);
        }
    }

    /**
     * Format game state for spectator consumption
     */
    formatGameStateForSpectator(gameState) {
        // Include full game state for spectators
        const spectatorState = {
            timestamp: gameState.timestamp,
            frameNumber: gameState.frameNumber,
            gamePhase: gameState.gamePhase,
            winner: gameState.winner,
            bounds: gameState.bounds,
            gameMode: gameState.gameMode,
            players: {}
        };

        // Include all player data (spectators see everything)
        for (const [playerId, playerState] of Object.entries(gameState.players)) {
            spectatorState.players[playerId] = {
                id: playerState.id,
                name: playerState.name,
                position: playerState.position,
                direction: playerState.direction,
                trail: playerState.trail, // Full trail for spectators
                isAlive: playerState.isAlive
            };
        }

        // Include mode-specific state
        if (gameState.modeState) {
            spectatorState.modeState = gameState.modeState;
        }

        // Include power-up state
        if (gameState.powerUps) {
            spectatorState.powerUps = gameState.powerUps;
        }
        if (gameState.effects) {
            spectatorState.effects = gameState.effects;
        }

        return spectatorState;
    }

    /**
     * Send game state to specific spectator
     */
    sendGameStateToSpectator(socket) {
        const gameState = this.gameRoom.gameState;
        if (gameState) {
            socket.emit('spectatorGameState', this.formatGameStateForSpectator(gameState));
        }
    }

    /**
     * Get list of all spectators
     */
    getSpectatorList() {
        return Array.from(this.spectators.values()).map(s => s.toNetworkFormat());
    }

    /**
     * Get spectator count
     */
    getSpectatorCount() {
        return this.spectators.size;
    }

    /**
     * Check if socket is a spectator
     */
    isSpectator(socketId) {
        return this.spectators.has(socketId);
    }

    /**
     * Broadcast message to all spectators
     */
    broadcastToSpectators(event, data) {
        for (const socketId of this.spectators.keys()) {
            const socket = this.gameRoom.sockets.get(socketId);
            if (socket) {
                socket.emit(event, data);
            }
        }
    }

    /**
     * Notify spectators of game event
     */
    notifySpectators(eventType, data) {
        this.broadcastToSpectators('spectatorEvent', {
            type: eventType,
            data: data,
            timestamp: Date.now()
        });
    }

    /**
     * Handle game start for spectators
     */
    onGameStart() {
        this.broadcastToSpectators('spectatorGameStarted', {
            roomData: this.gameRoom.getRoomData(),
            initialState: this.formatGameStateForSpectator(this.gameRoom.gameState)
        });
    }

    /**
     * Handle game end for spectators
     */
    onGameEnd(winner, finalState) {
        this.broadcastToSpectators('spectatorGameEnded', {
            winner: winner,
            finalState: this.formatGameStateForSpectator(finalState),
            roomData: this.gameRoom.getRoomData()
        });
    }

    /**
     * Enable/disable spectator chat
     */
    setSpectatorChatEnabled(enabled) {
        this.spectatorChatEnabled = enabled;
    }

    /**
     * Get spectator by socket ID
     */
    getSpectator(socketId) {
        return this.spectators.get(socketId);
    }

    /**
     * Clear all spectators
     */
    clearSpectators() {
        // Notify all spectators
        this.broadcastToSpectators('spectatorKicked', {
            reason: 'room_closing'
        });

        // Remove all spectators
        for (const socketId of this.spectators.keys()) {
            const socket = this.gameRoom.sockets.get(socketId);
            if (socket) {
                socket.leave(this.gameRoom.id);
            }
        }

        this.spectators.clear();
    }

    /**
     * Reset spectator system
     */
    reset() {
        // Keep spectators but reset their state
        for (const spectator of this.spectators.values()) {
            spectator.followingPlayerId = null;
            spectator.cameraMode = 'free';
        }
    }

    /**
     * Destroy spectator manager
     */
    destroy() {
        this.clearSpectators();
    }
}

module.exports = {
    SpectatorManager,
    SpectatorData
};
