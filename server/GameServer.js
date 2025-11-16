const { Server } = require('socket.io');
const http = require('http');
const { GameRoom } = require('./GameRoom');

/**
 * GameServer manages the multiplayer server infrastructure
 * Handles WebSocket connections, room management, and player coordination
 */
class GameServer {
    constructor(port = 3000) {
        this.port = port;
        this.httpServer = null;
        this.io = null;
        this.rooms = new Map(); // roomId -> GameRoom
        this.playerRooms = new Map(); // socketId -> roomId
        this.isRunning = false;
        
        // Logging configuration
        this.logLevel = process.env.LOG_LEVEL || 'info';
        this.logLevels = { error: 0, warn: 1, info: 2, debug: 3 };
    }

    /**
     * Start the game server
     */
    start() {
        if (this.isRunning) {
            this.log('warn', 'Server is already running');
            return;
        }

        // Create HTTP server with health check endpoint
        this.httpServer = http.createServer((req, res) => {
            if (req.url === '/health' || req.url === '/') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'ok',
                    uptime: process.uptime(),
                    rooms: this.rooms.size,
                    players: this.playerRooms.size,
                    timestamp: new Date().toISOString()
                }));
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            }
        });
        
        // Initialize Socket.IO with CORS configuration
        this.io = new Server(this.httpServer, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            },
            pingTimeout: 60000,
            pingInterval: 25000
        });

        // Set up connection handlers
        this.io.on('connection', (socket) => this.onConnection(socket));

        // Start listening
        this.httpServer.listen(this.port, () => {
            this.isRunning = true;
            this.log('info', `GameServer started on port ${this.port}`);
        });
    }

    /**
     * Stop the game server
     */
    stop() {
        if (!this.isRunning) {
            this.log('warn', 'Server is not running');
            return;
        }

        // Clean up all rooms
        for (const room of this.rooms.values()) {
            room.destroy();
        }
        this.rooms.clear();
        this.playerRooms.clear();

        // Close Socket.IO and HTTP server
        if (this.io) {
            this.io.close();
        }
        if (this.httpServer) {
            this.httpServer.close();
        }

        this.isRunning = false;
        this.log('info', 'GameServer stopped');
    }

    /**
     * Handle new client connection
     */
    onConnection(socket) {
        this.log('info', `Client connected: ${socket.id}`);

        // Set up event handlers
        socket.on('createRoom', (settings) => this.handleCreateRoom(socket, settings));
        socket.on('joinRoom', (roomId) => this.handleJoinRoom(socket, roomId));
        socket.on('rejoinRoom', (data) => this.handleRejoinRoom(socket, data));
        socket.on('leaveRoom', () => this.handleLeaveRoom(socket));
        socket.on('quickMatch', () => this.handleQuickMatch(socket));
        socket.on('getRoomList', () => this.handleGetRoomList(socket));
        socket.on('disconnect', () => this.onDisconnection(socket));

        // Send connection acknowledgment
        socket.emit('connected', {
            socketId: socket.id,
            timestamp: Date.now()
        });
    }

    /**
     * Handle client disconnection
     */
    onDisconnection(socket) {
        this.log('info', `Client disconnected: ${socket.id}`);

        // Remove player from their room
        const roomId = this.playerRooms.get(socket.id);
        if (roomId) {
            const room = this.rooms.get(roomId);
            if (room) {
                // Use temporary disconnect if game is in progress
                const temporary = room.status === 'playing';
                room.removePlayer(socket.id, temporary);
                
                // Only clean up player rooms mapping if permanent disconnect
                if (!temporary) {
                    this.playerRooms.delete(socket.id);
                }
                
                // Clean up empty rooms
                if (room.getPlayerCount() === 0 && room.disconnectedPlayers.size === 0) {
                    this.destroyRoom(roomId);
                }
            } else {
                this.playerRooms.delete(socket.id);
            }
        }
    }

    /**
     * Handle room creation request
     */
    handleCreateRoom(socket, settings) {
        this.log('debug', `Create room request from ${socket.id}`, settings);

        // Validate settings
        const validatedSettings = this.validateRoomSettings(settings);
        if (!validatedSettings.valid) {
            socket.emit('error', {
                type: 'createRoom',
                message: validatedSettings.error
            });
            return;
        }

        // Check if player is already in a room
        if (this.playerRooms.has(socket.id)) {
            socket.emit('error', {
                type: 'createRoom',
                message: 'You are already in a room'
            });
            return;
        }

        // Create new room
        const roomId = this.generateRoomId();
        const room = new GameRoom(roomId, validatedSettings.settings, this.io);
        this.rooms.set(roomId, room);

        // Add creator to room
        const joined = room.addPlayer(socket, {
            id: socket.id,
            name: settings.playerName || `Player_${socket.id.substring(0, 4)}`,
            isHost: true
        });

        if (joined) {
            this.playerRooms.set(socket.id, roomId);
            socket.emit('roomCreated', {
                roomId: roomId,
                room: room.getRoomData()
            });
            this.log('info', `Room created: ${roomId} by ${socket.id}`);
        } else {
            this.rooms.delete(roomId);
            socket.emit('error', {
                type: 'createRoom',
                message: 'Failed to create room'
            });
        }
    }

    /**
     * Handle room join request
     */
    handleJoinRoom(socket, roomId) {
        this.log('debug', `Join room request from ${socket.id} for room ${roomId}`);

        // Check if room exists
        const room = this.rooms.get(roomId);
        if (!room) {
            socket.emit('error', {
                type: 'joinRoom',
                message: 'Room not found'
            });
            return;
        }

        // Check if player is already in a room
        if (this.playerRooms.has(socket.id)) {
            socket.emit('error', {
                type: 'joinRoom',
                message: 'You are already in a room'
            });
            return;
        }

        // Try to add player to room
        const joined = room.addPlayer(socket, {
            id: socket.id,
            name: `Player_${socket.id.substring(0, 4)}`,
            isHost: false
        });

        if (joined) {
            this.playerRooms.set(socket.id, roomId);
            socket.emit('roomJoined', {
                roomId: roomId,
                room: room.getRoomData()
            });
            this.log('info', `Player ${socket.id} joined room ${roomId}`);
        } else {
            socket.emit('error', {
                type: 'joinRoom',
                message: 'Failed to join room (room may be full or in progress)'
            });
        }
    }

    /**
     * Handle rejoin room request (for reconnection)
     */
    handleRejoinRoom(socket, data) {
        this.log('debug', `Rejoin room request from ${socket.id} for room ${data.roomId}`);

        // Check if room exists
        const room = this.rooms.get(data.roomId);
        if (!room) {
            socket.emit('rejoinRoom', {
                success: false,
                error: 'Room not found or has been closed'
            });
            return;
        }

        // Check if player is already in a different room
        const currentRoomId = this.playerRooms.get(socket.id);
        if (currentRoomId && currentRoomId !== data.roomId) {
            socket.emit('rejoinRoom', {
                success: false,
                error: 'You are already in a different room'
            });
            return;
        }

        // Attempt to reconnect player in the room
        const reconnected = room.handleReconnection(socket, data.previousPlayerId);

        if (reconnected) {
            this.playerRooms.set(socket.id, data.roomId);
            socket.emit('rejoinRoom', {
                success: true,
                roomId: data.roomId,
                room: room.getRoomData(),
                gameState: room.gameState
            });
            this.log('info', `Player ${socket.id} rejoined room ${data.roomId}`);
        } else {
            socket.emit('rejoinRoom', {
                success: false,
                error: 'Failed to rejoin room (player slot may have been taken)'
            });
        }
    }

    /**
     * Handle leave room request
     */
    handleLeaveRoom(socket) {
        const roomId = this.playerRooms.get(socket.id);
        if (!roomId) {
            socket.emit('error', {
                type: 'leaveRoom',
                message: 'You are not in a room'
            });
            return;
        }

        const room = this.rooms.get(roomId);
        if (room) {
            room.removePlayer(socket.id);
            
            // Clean up empty rooms
            if (room.getPlayerCount() === 0) {
                this.destroyRoom(roomId);
            }
        }

        this.playerRooms.delete(socket.id);
        socket.emit('roomLeft');
        this.log('info', `Player ${socket.id} left room ${roomId}`);
    }

    /**
     * Handle quick match request
     */
    handleQuickMatch(socket) {
        this.log('debug', `Quick match request from ${socket.id}`);

        // Check if player is already in a room
        if (this.playerRooms.has(socket.id)) {
            socket.emit('error', {
                type: 'quickMatch',
                message: 'You are already in a room'
            });
            return;
        }

        // Find available room
        let availableRoom = null;
        for (const room of this.rooms.values()) {
            if (room.canJoin() && !room.settings.isPrivate) {
                availableRoom = room;
                break;
            }
        }

        // Join existing room or create new one
        if (availableRoom) {
            this.handleJoinRoom(socket, availableRoom.id);
        } else {
            this.handleCreateRoom(socket, {
                maxPlayers: 4,
                gameMode: 'classic',
                isPrivate: false,
                playerName: `Player_${socket.id.substring(0, 4)}`
            });
        }
    }

    /**
     * Handle room list request
     */
    handleGetRoomList(socket) {
        const roomList = [];
        for (const room of this.rooms.values()) {
            if (!room.settings.isPrivate && room.canJoin()) {
                roomList.push({
                    id: room.id,
                    playerCount: room.getPlayerCount(),
                    maxPlayers: room.settings.maxPlayers,
                    gameMode: room.settings.gameMode,
                    status: room.status
                });
            }
        }

        socket.emit('roomList', roomList);
        this.log('debug', `Sent room list to ${socket.id}: ${roomList.length} rooms`);
    }

    /**
     * Destroy a room
     */
    destroyRoom(roomId) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.destroy();
            this.rooms.delete(roomId);
            this.log('info', `Room destroyed: ${roomId}`);
        }
    }

    /**
     * Validate room settings
     */
    validateRoomSettings(settings) {
        if (!settings) {
            return { valid: false, error: 'Settings are required' };
        }

        const maxPlayers = settings.maxPlayers || 4;
        if (maxPlayers < 2 || maxPlayers > 4) {
            return { valid: false, error: 'Max players must be between 2 and 4' };
        }

        const validGameModes = ['classic', 'timeTrial', 'arenaShrink'];
        const gameMode = settings.gameMode || 'classic';
        if (!validGameModes.includes(gameMode)) {
            return { valid: false, error: 'Invalid game mode' };
        }

        return {
            valid: true,
            settings: {
                maxPlayers,
                gameMode,
                isPrivate: settings.isPrivate || false
            }
        };
    }

    /**
     * Generate unique room ID
     */
    generateRoomId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let id;
        do {
            id = '';
            for (let i = 0; i < 6; i++) {
                id += chars.charAt(Math.floor(Math.random() * chars.length));
            }
        } while (this.rooms.has(id));
        return id;
    }

    /**
     * Log message with level
     */
    log(level, message, data = null) {
        if (this.logLevels[level] <= this.logLevels[this.logLevel]) {
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
            console.log(logMessage);
            if (data) {
                console.log(JSON.stringify(data, null, 2));
            }
        }
    }

    /**
     * Get server statistics
     */
    getStats() {
        return {
            isRunning: this.isRunning,
            port: this.port,
            roomCount: this.rooms.size,
            playerCount: this.playerRooms.size,
            rooms: Array.from(this.rooms.values()).map(room => ({
                id: room.id,
                playerCount: room.getPlayerCount(),
                status: room.status
            }))
        };
    }
}

module.exports = { GameServer };
