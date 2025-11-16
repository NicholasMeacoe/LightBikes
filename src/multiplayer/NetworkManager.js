/**
 * NetworkManager - Client-side networking component for multiplayer functionality
 * Handles WebSocket connection management, message sending/receiving, and event system
 */

const io = require('socket.io-client');

class NetworkManager {
    constructor(gameInstance, renderingEngine) {
        this.gameInstance = gameInstance;
        this.renderingEngine = renderingEngine;
        this.socket = null;
        this.connected = false;
        this.roomId = null;
        this.playerId = null;
        this.ping = 0;
        
        // Event callbacks
        this.eventHandlers = {
            stateUpdate: [],
            playerJoined: [],
            playerLeft: [],
            gameStart: [],
            gameEnd: [],
            roomUpdate: [],
            chatMessage: [],
            error: [],
            connected: [],
            disconnected: [],
            reconnecting: [],
            reconnected: []
        };
        
        // Connection state
        this.connectionState = 'disconnected'; // disconnected, connecting, connected, reconnecting
        this.lastPingTime = 0;
        this.pingInterval = null;
    }
    
    /**
     * Connect to the game server
     * @param {string} serverUrl - WebSocket server URL (e.g., 'http://localhost:3000')
     * @returns {Promise} Resolves when connected, rejects on error
     */
    connect(serverUrl) {
        return new Promise((resolve, reject) => {
            if (this.socket && this.connected) {
                resolve();
                return;
            }
            
            this.connectionState = 'connecting';
            
            // Create Socket.IO connection
            this.socket = io(serverUrl, {
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 5,
                timeout: 10000
            });
            
            // Connection event handlers
            this.socket.on('connect', () => {
                this.connected = true;
                this.connectionState = 'connected';
                this.playerId = this.socket.id;
                this.startPingMonitoring();
                this.triggerEvent('connected', { playerId: this.playerId });
                resolve();
            });
            
            this.socket.on('connect_error', (error) => {
                this.connectionState = 'disconnected';
                this.triggerEvent('error', { type: 'connection', error: error.message });
                reject(error);
            });
            
            this.socket.on('disconnect', (reason) => {
                this.connected = false;
                this.connectionState = 'disconnected';
                this.stopPingMonitoring();
                this.triggerEvent('disconnected', { reason });
            });
            
            this.socket.on('reconnecting', (attemptNumber) => {
                this.connectionState = 'reconnecting';
                this.triggerEvent('reconnecting', { attemptNumber });
            });
            
            this.socket.on('reconnect', (attemptNumber) => {
                this.connected = true;
                this.connectionState = 'connected';
                this.startPingMonitoring();
                this.triggerEvent('reconnected', { attemptNumber });
            });
            
            // Game event handlers
            this.setupGameEventHandlers();
        });
    }
    
    /**
     * Set up handlers for game-specific events
     */
    setupGameEventHandlers() {
        // Game state updates
        this.socket.on('gameState', (data) => {
            this.triggerEvent('stateUpdate', data);
        });
        
        // Room updates
        this.socket.on('roomUpdate', (data) => {
            this.roomId = data.roomId;
            this.triggerEvent('roomUpdate', data);
        });
        
        // Player events
        this.socket.on('playerJoined', (data) => {
            this.triggerEvent('playerJoined', data);
        });
        
        this.socket.on('playerLeft', (data) => {
            this.triggerEvent('playerLeft', data);
        });
        
        // Game lifecycle events
        this.socket.on('gameStart', (data) => {
            this.triggerEvent('gameStart', data);
        });
        
        this.socket.on('gameEnd', (data) => {
            this.triggerEvent('gameEnd', data);
        });
        
        // Chat events
        this.socket.on('chatMessage', (data) => {
            this.triggerEvent('chatMessage', data);
        });
        
        // Ping response
        this.socket.on('pong', (timestamp) => {
            this.ping = Date.now() - timestamp;
        });
        
        // Error events
        this.socket.on('error', (data) => {
            this.triggerEvent('error', data);
        });
    }
    
    /**
     * Disconnect from the server
     */
    disconnect() {
        if (this.socket) {
            this.stopPingMonitoring();
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
            this.connectionState = 'disconnected';
            this.roomId = null;
            this.playerId = null;
        }
    }
    
    /**
     * Create a new game room
     * @param {Object} settings - Room settings (maxPlayers, gameMode, isPrivate)
     * @returns {Promise} Resolves with room data
     */
    createRoom(settings) {
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                reject(new Error('Not connected to server'));
                return;
            }
            
            this.socket.emit('createRoom', settings, (response) => {
                if (response.success) {
                    this.roomId = response.roomId;
                    resolve(response);
                } else {
                    reject(new Error(response.error || 'Failed to create room'));
                }
            });
        });
    }
    
    /**
     * Join an existing game room
     * @param {string} roomId - Room ID to join
     * @returns {Promise} Resolves with room data
     */
    joinRoom(roomId) {
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                reject(new Error('Not connected to server'));
                return;
            }
            
            this.socket.emit('joinRoom', { roomId }, (response) => {
                if (response.success) {
                    this.roomId = roomId;
                    resolve(response);
                } else {
                    reject(new Error(response.error || 'Failed to join room'));
                }
            });
        });
    }
    
    /**
     * Rejoin a room after reconnection
     * @param {string} roomId - Room ID to rejoin
     * @param {string} previousPlayerId - Previous player ID
     * @returns {Promise} Resolves with room data and game state
     */
    rejoinRoom(roomId, previousPlayerId) {
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                reject(new Error('Not connected to server'));
                return;
            }
            
            this.socket.emit('rejoinRoom', { 
                roomId, 
                previousPlayerId 
            }, (response) => {
                if (response.success) {
                    this.roomId = roomId;
                    resolve(response);
                } else {
                    reject(new Error(response.error || 'Failed to rejoin room'));
                }
            });
        });
    }
    
    /**
     * Leave the current room
     * @returns {Promise} Resolves when left
     */
    leaveRoom() {
        return new Promise((resolve, reject) => {
            if (!this.connected || !this.roomId) {
                reject(new Error('Not in a room'));
                return;
            }
            
            this.socket.emit('leaveRoom', {}, (response) => {
                if (response.success) {
                    this.roomId = null;
                    resolve(response);
                } else {
                    reject(new Error(response.error || 'Failed to leave room'));
                }
            });
        });
    }
    
    /**
     * Send player input to server
     * @param {string} direction - Direction (up, down, left, right)
     * @param {number} timestamp - Client timestamp
     */
    sendInput(direction, timestamp = Date.now()) {
        if (!this.connected || !this.roomId) {
            return;
        }
        
        this.socket.emit('input', {
            direction,
            timestamp,
            sequenceId: this.generateSequenceId()
        });
    }
    
    /**
     * Send chat message
     * @param {string} message - Chat message text
     */
    sendChatMessage(message) {
        if (!this.connected || !this.roomId) {
            return;
        }
        
        this.socket.emit('chat', {
            message,
            timestamp: Date.now()
        });
    }
    
    /**
     * Send ready status
     * @param {boolean} isReady - Whether player is ready
     */
    sendReadyStatus(isReady) {
        if (!this.connected || !this.roomId) {
            return;
        }
        
        this.socket.emit('ready', { isReady });
    }
    
    /**
     * Request room list
     * @returns {Promise} Resolves with list of available rooms
     */
    getRoomList() {
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                reject(new Error('Not connected to server'));
                return;
            }
            
            this.socket.emit('getRoomList', {}, (response) => {
                if (response.success) {
                    resolve(response.rooms);
                } else {
                    reject(new Error(response.error || 'Failed to get room list'));
                }
            });
        });
    }
    
    /**
     * Register event handler
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].push(callback);
        }
    }
    
    /**
     * Unregister event handler
     * @param {string} event - Event name
     * @param {Function} callback - Callback function to remove
     */
    off(event, callback) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event] = this.eventHandlers[event].filter(cb => cb !== callback);
        }
    }
    
    /**
     * Trigger event handlers
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    triggerEvent(event, data) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${event} handler:`, error);
                }
            });
        }
    }
    
    /**
     * Start ping monitoring
     */
    startPingMonitoring() {
        this.stopPingMonitoring();
        this.pingInterval = setInterval(() => {
            if (this.connected) {
                this.socket.emit('ping', Date.now());
            }
        }, 1000);
    }
    
    /**
     * Stop ping monitoring
     */
    stopPingMonitoring() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }
    
    /**
     * Generate sequence ID for input messages
     */
    generateSequenceId() {
        if (!this._sequenceId) {
            this._sequenceId = 0;
        }
        return ++this._sequenceId;
    }
    
    /**
     * Get current connection state
     * @returns {string} Connection state
     */
    getConnectionState() {
        return this.connectionState;
    }
    
    /**
     * Get current ping
     * @returns {number} Ping in milliseconds
     */
    getPing() {
        return this.ping;
    }
    
    /**
     * Check if connected
     * @returns {boolean} True if connected
     */
    isConnected() {
        return this.connected;
    }
    
    /**
     * Get current room ID
     * @returns {string|null} Room ID or null
     */
    getRoomId() {
        return this.roomId;
    }
    
    /**
     * Get player ID
     * @returns {string|null} Player ID or null
     */
    getPlayerId() {
        return this.playerId;
    }
    
    // Convenience methods for event registration
    onStateUpdate(callback) { this.on('stateUpdate', callback); }
    onPlayerJoined(callback) { this.on('playerJoined', callback); }
    onPlayerLeft(callback) { this.on('playerLeft', callback); }
    onGameStart(callback) { this.on('gameStart', callback); }
    onGameEnd(callback) { this.on('gameEnd', callback); }
    onRoomUpdate(callback) { this.on('roomUpdate', callback); }
    onChatMessage(callback) { this.on('chatMessage', callback); }
    onError(callback) { this.on('error', callback); }
    onConnected(callback) { this.on('connected', callback); }
    onDisconnected(callback) { this.on('disconnected', callback); }
    onReconnecting(callback) { this.on('reconnecting', callback); }
    onReconnected(callback) { this.on('reconnected', callback); }
}

module.exports = { NetworkManager };
