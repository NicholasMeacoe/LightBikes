/**
 * Network message fixtures for testing
 * Provides sample network message payloads for various scenarios
 */

/**
 * Create a player join message
 */
function createPlayerJoinMessage(playerId = 'player-1', playerName = 'Player 1') {
    return {
        type: 'playerJoin',
        playerId,
        playerName,
        timestamp: Date.now(),
    };
}

/**
 * Create a player leave message
 */
function createPlayerLeaveMessage(playerId = 'player-1', reason = 'disconnect') {
    return {
        type: 'playerLeave',
        playerId,
        reason,
        timestamp: Date.now(),
    };
}

/**
 * Create a game start message
 */
function createGameStartMessage(players = [], gameMode = 'classic') {
    return {
        type: 'gameStart',
        players,
        gameMode,
        arenaSize: 30,
        timestamp: Date.now(),
    };
}

/**
 * Create a game state update message
 */
function createGameStateUpdateMessage(gameState) {
    return {
        type: 'gameStateUpdate',
        gameState,
        timestamp: Date.now(),
    };
}

/**
 * Create a player move message
 */
function createPlayerMoveMessage(playerId = 'player-1', direction = 'right') {
    return {
        type: 'playerMove',
        playerId,
        direction,
        timestamp: Date.now(),
    };
}

/**
 * Create a player position update message
 */
function createPlayerPositionMessage(playerId = 'player-1', x = 10, y = 10) {
    return {
        type: 'playerPosition',
        playerId,
        position: { x, y },
        timestamp: Date.now(),
    };
}

/**
 * Create a collision message
 */
function createCollisionMessage(playerId = 'player-1', collisionType = 'wall') {
    return {
        type: 'collision',
        playerId,
        collisionType,
        timestamp: Date.now(),
    };
}

/**
 * Create a game over message
 */
function createGameOverMessage(winner = 'player-1', scores = {}) {
    return {
        type: 'gameOver',
        winner,
        scores,
        timestamp: Date.now(),
    };
}

/**
 * Create a chat message
 */
function createChatMessage(playerId = 'player-1', message = 'Hello!') {
    return {
        type: 'chat',
        playerId,
        message,
        timestamp: Date.now(),
    };
}

/**
 * Create a ping message
 */
function createPingMessage() {
    return {
        type: 'ping',
        timestamp: Date.now(),
    };
}

/**
 * Create a pong message
 */
function createPongMessage(pingTimestamp) {
    return {
        type: 'pong',
        pingTimestamp,
        timestamp: Date.now(),
    };
}

/**
 * Create a room create message
 */
function createRoomCreateMessage(roomId = 'room-1', roomName = 'Room 1', maxPlayers = 4) {
    return {
        type: 'roomCreate',
        roomId,
        roomName,
        maxPlayers,
        timestamp: Date.now(),
    };
}

/**
 * Create a room join message
 */
function createRoomJoinMessage(roomId = 'room-1', playerId = 'player-1') {
    return {
        type: 'roomJoin',
        roomId,
        playerId,
        timestamp: Date.now(),
    };
}

/**
 * Create a room leave message
 */
function createRoomLeaveMessage(roomId = 'room-1', playerId = 'player-1') {
    return {
        type: 'roomLeave',
        roomId,
        playerId,
        timestamp: Date.now(),
    };
}

/**
 * Create a room list message
 */
function createRoomListMessage(rooms = []) {
    return {
        type: 'roomList',
        rooms,
        timestamp: Date.now(),
    };
}

/**
 * Create a player ready message
 */
function createPlayerReadyMessage(playerId = 'player-1', ready = true) {
    return {
        type: 'playerReady',
        playerId,
        ready,
        timestamp: Date.now(),
    };
}

/**
 * Create an error message
 */
function createErrorMessage(errorCode = 'UNKNOWN_ERROR', errorMessage = 'An error occurred') {
    return {
        type: 'error',
        errorCode,
        errorMessage,
        timestamp: Date.now(),
    };
}

/**
 * Create a reconnect message
 */
function createReconnectMessage(playerId = 'player-1', sessionId = 'session-1') {
    return {
        type: 'reconnect',
        playerId,
        sessionId,
        timestamp: Date.now(),
    };
}

/**
 * Create a power-up spawn message
 */
function createPowerUpSpawnMessage(powerUpId = 'powerup-1', type = 'speed', x = 15, y = 15) {
    return {
        type: 'powerUpSpawn',
        powerUpId,
        powerUpType: type,
        position: { x, y },
        timestamp: Date.now(),
    };
}

/**
 * Create a power-up collect message
 */
function createPowerUpCollectMessage(powerUpId = 'powerup-1', playerId = 'player-1') {
    return {
        type: 'powerUpCollect',
        powerUpId,
        playerId,
        timestamp: Date.now(),
    };
}

/**
 * Create a latency update message
 */
function createLatencyUpdateMessage(playerId = 'player-1', latency = 50) {
    return {
        type: 'latencyUpdate',
        playerId,
        latency,
        timestamp: Date.now(),
    };
}

/**
 * Create a server time sync message
 */
function createTimeSyncMessage(serverTime = Date.now()) {
    return {
        type: 'timeSync',
        serverTime,
        timestamp: Date.now(),
    };
}

/**
 * Create a batch of messages
 */
function createMessageBatch(messages = []) {
    return {
        type: 'batch',
        messages,
        timestamp: Date.now(),
    };
}

/**
 * Create a full multiplayer session
 */
function createMultiplayerSession() {
    return {
        roomId: 'room-1',
        players: [
            { id: 'player-1', name: 'Player 1', ready: true },
            { id: 'player-2', name: 'Player 2', ready: true },
        ],
        gameMode: 'classic',
        arenaSize: 30,
        started: false,
        timestamp: Date.now(),
    };
}

module.exports = {
    createPlayerJoinMessage,
    createPlayerLeaveMessage,
    createGameStartMessage,
    createGameStateUpdateMessage,
    createPlayerMoveMessage,
    createPlayerPositionMessage,
    createCollisionMessage,
    createGameOverMessage,
    createChatMessage,
    createPingMessage,
    createPongMessage,
    createRoomCreateMessage,
    createRoomJoinMessage,
    createRoomLeaveMessage,
    createRoomListMessage,
    createPlayerReadyMessage,
    createErrorMessage,
    createReconnectMessage,
    createPowerUpSpawnMessage,
    createPowerUpCollectMessage,
    createLatencyUpdateMessage,
    createTimeSyncMessage,
    createMessageBatch,
    createMultiplayerSession,
};
