const { AntiCheatValidator } = require('./AntiCheatValidator');
const { GameModeManager } = require('./GameModeManager');
const { PowerUpSynchronizer } = require('./PowerUpSynchronizer');
const { SpectatorManager } = require('./SpectatorManager');

/**
 * GameRoom manages a single multiplayer game session
 * Handles player management, game lifecycle, and room settings
 */
class GameRoom {
    constructor(id, settings, io) {
        this.id = id;
        this.settings = {
            maxPlayers: settings.maxPlayers || 4,
            gameMode: settings.gameMode || 'classic',
            isPrivate: settings.isPrivate || false
        };
        this.io = io;
        
        // Player management
        this.players = new Map(); // socketId -> playerData
        this.sockets = new Map(); // socketId -> socket
        this.disconnectedPlayers = new Map(); // socketId -> { player, disconnectTime, timeout }
        
        // Room state
        this.status = 'waiting'; // waiting, countdown, playing, ended
        this.createdAt = Date.now();
        this.startedAt = null;
        this.endedAt = null;
        
        // Game state (authoritative server state)
        this.gameState = null;
        this.winner = null;
        
        // Game loop management
        this.gameLoopInterval = null;
        this.updateRate = 60; // 60Hz update rate
        this.frameTime = 1000 / this.updateRate;
        this.lastUpdateTime = 0;
        this.frameNumber = 0;
        
        // Player input queue
        this.inputQueue = new Map(); // socketId -> [inputs]
        
        // Game constants
        this.gameSpeed = 0.1;
        this.arenaBounds = 30;
        
        // Anti-cheat system
        this.antiCheat = new AntiCheatValidator(this);
        
        // Game mode manager
        this.gameModeInstance = null;
        
        // Power-up synchronizer
        this.powerUpSync = new PowerUpSynchronizer(this);
        
        // Spectator manager
        this.spectatorManager = new SpectatorManager(this);
    }

    /**
     * Add a player to the room
     */
    addPlayer(socket, playerData) {
        // Check if room is full
        if (this.players.size >= this.settings.maxPlayers) {
            return false;
        }

        // Check if room is in progress
        if (this.status === 'playing') {
            return false;
        }

        // Check if player already exists
        if (this.players.has(socket.id)) {
            return false;
        }

        // Add player
        const player = {
            id: socket.id,
            name: playerData.name || `Player_${socket.id.substring(0, 4)}`,
            isHost: playerData.isHost || false,
            isReady: false,
            joinedAt: Date.now(),
            ping: 0,
            isConnected: true
        };

        this.players.set(socket.id, player);
        this.sockets.set(socket.id, socket);

        // Join socket to room
        socket.join(this.id);

        // Set up player event handlers
        this.setupPlayerHandlers(socket);

        // Broadcast player joined
        this.broadcastToRoom('playerJoined', {
            player: this.getPublicPlayerData(player),
            room: this.getRoomData()
        });

        return true;
    }

    /**
     * Remove a player from the room
     */
    removePlayer(socketId, temporary = false) {
        const player = this.players.get(socketId);
        if (!player) {
            return false;
        }

        // If game is in progress, mark as temporary disconnection
        if (this.status === 'playing' && temporary) {
            return this.handleTemporaryDisconnect(socketId);
        }

        // Check if player was host
        const wasHost = player.isHost;
        
        // Clear anti-cheat history for this player
        this.antiCheat.clearPlayerHistory(socketId);

        // Remove player
        this.players.delete(socketId);
        const socket = this.sockets.get(socketId);
        if (socket) {
            socket.leave(this.id);
            this.sockets.delete(socketId);
        }

        // Transfer host if needed
        if (wasHost && this.players.size > 0) {
            const newHost = Array.from(this.players.values())[0];
            newHost.isHost = true;
        }

        // Broadcast player left
        this.broadcastToRoom('playerLeft', {
            playerId: socketId,
            room: this.getRoomData()
        });

        // End game if in progress and not enough players
        if (this.status === 'playing' && this.players.size < 2) {
            this.endGame('insufficient_players');
        }

        return true;
    }
    
    /**
     * Handle temporary disconnection (30-second grace period)
     */
    handleTemporaryDisconnect(socketId) {
        const player = this.players.get(socketId);
        if (!player) {
            return false;
        }
        
        console.log(`[GameRoom ${this.id}] Player ${socketId} temporarily disconnected`);
        
        // Mark player as disconnected
        player.isConnected = false;
        
        // Remove socket but keep player data
        const socket = this.sockets.get(socketId);
        if (socket) {
            socket.leave(this.id);
            this.sockets.delete(socketId);
        }
        
        // Set up 30-second timeout for permanent removal
        const timeout = setTimeout(() => {
            console.log(`[GameRoom ${this.id}] Player ${socketId} reconnection timeout`);
            this.disconnectedPlayers.delete(socketId);
            this.removePlayer(socketId, false);
        }, 30000);
        
        // Store disconnected player info
        this.disconnectedPlayers.set(socketId, {
            player: player,
            disconnectTime: Date.now(),
            timeout: timeout
        });
        
        // Notify other players
        this.broadcastToRoom('playerDisconnected', {
            playerId: socketId,
            playerName: player.name,
            gracePeriod: 30000
        });
        
        return true;
    }

    /**
     * Handle player reconnection
     */
    handleReconnection(socket, playerId) {
        const player = this.players.get(playerId);
        if (!player) {
            return false;
        }
        
        // Check if player was in disconnected list
        const disconnectedInfo = this.disconnectedPlayers.get(playerId);
        if (disconnectedInfo) {
            // Clear the timeout
            clearTimeout(disconnectedInfo.timeout);
            this.disconnectedPlayers.delete(playerId);
            
            console.log(`[GameRoom ${this.id}] Player ${playerId} reconnected within grace period`);
        }

        // Update socket
        const oldSocket = this.sockets.get(playerId);
        if (oldSocket) {
            oldSocket.leave(this.id);
        }

        this.sockets.set(playerId, socket);
        socket.join(this.id);

        // Update player state
        player.isConnected = true;

        // Set up handlers
        this.setupPlayerHandlers(socket);

        // Notify room
        this.broadcastToRoom('playerReconnected', {
            playerId: playerId,
            playerName: player.name,
            room: this.getRoomData()
        });

        // Send current game state to reconnected player
        if (this.status === 'playing' && this.gameState) {
            socket.emit('gameState', this.gameState);
        }

        return true;
    }

    /**
     * Set up event handlers for a player socket
     */
    setupPlayerHandlers(socket) {
        socket.on('setReady', (isReady) => {
            this.handleSetReady(socket.id, isReady);
        });

        socket.on('startGame', () => {
            this.handleStartGame(socket.id);
        });

        socket.on('chat', (message) => {
            this.handleChat(socket.id, message);
        });

        socket.on('updateSettings', (settings) => {
            this.handleUpdateSettings(socket.id, settings);
        });
        
        socket.on('input', (inputData) => {
            this.handlePlayerInput(socket.id, inputData);
        });
        
        socket.on('joinAsSpectator', (spectatorData) => {
            this.handleJoinAsSpectator(socket, spectatorData);
        });
    }

    /**
     * Handle player ready status change
     */
    handleSetReady(socketId, isReady) {
        const player = this.players.get(socketId);
        if (!player || this.status !== 'waiting') {
            return;
        }

        player.isReady = isReady;

        this.broadcastToRoom('playerReady', {
            playerId: socketId,
            isReady: isReady,
            room: this.getRoomData()
        });

        // Auto-start if all players ready
        if (this.areAllPlayersReady() && this.players.size >= 2) {
            this.startGame();
        }
    }

    /**
     * Handle start game request
     */
    handleStartGame(socketId) {
        const player = this.players.get(socketId);
        if (!player || !player.isHost || this.status !== 'waiting') {
            return;
        }

        // Check minimum players
        if (this.players.size < 2) {
            this.sendToPlayer(socketId, 'error', {
                type: 'startGame',
                message: 'Need at least 2 players to start'
            });
            return;
        }

        this.startGame();
    }

    /**
     * Handle chat message
     */
    handleChat(socketId, message) {
        const player = this.players.get(socketId);
        if (!player) {
            return;
        }

        // Basic validation
        if (!message || typeof message !== 'string' || message.length > 200) {
            return;
        }

        this.broadcastToRoom('chat', {
            playerId: socketId,
            playerName: player.name,
            message: message,
            timestamp: Date.now()
        });
    }

    /**
     * Handle settings update
     */
    handleUpdateSettings(socketId, settings) {
        const player = this.players.get(socketId);
        if (!player || !player.isHost || this.status !== 'waiting') {
            return;
        }

        // Update settings
        if (settings.maxPlayers && settings.maxPlayers >= 2 && settings.maxPlayers <= 4) {
            this.settings.maxPlayers = settings.maxPlayers;
        }
        if (settings.gameMode && ['classic', 'timeTrial', 'arenaShrink'].includes(settings.gameMode)) {
            this.settings.gameMode = settings.gameMode;
        }
        if (typeof settings.isPrivate === 'boolean') {
            this.settings.isPrivate = settings.isPrivate;
        }

        this.broadcastToRoom('settingsUpdated', {
            settings: this.settings
        });
    }

    /**
     * Handle join as spectator request
     */
    handleJoinAsSpectator(socket, spectatorData) {
        const result = this.spectatorManager.addSpectator(socket, spectatorData);
        
        if (result.success) {
            socket.emit('spectatorJoinSuccess', {
                spectator: result.spectator.toNetworkFormat(),
                roomData: this.getRoomData()
            });
        } else {
            socket.emit('spectatorJoinFailed', {
                reason: result.reason
            });
        }
    }

    /**
     * Start the game
     */
    startGame() {
        if (this.status !== 'waiting') {
            return;
        }

        this.status = 'countdown';
        this.startedAt = Date.now();

        // Broadcast countdown
        this.broadcastToRoom('gameStarting', {
            countdown: 3,
            room: this.getRoomData()
        });

        // Start game after countdown
        setTimeout(() => {
            if (this.status === 'countdown') {
                this.status = 'playing';
                this.initializeGameState();
                this.startGameLoop();
                this.broadcastToRoom('gameStarted', {
                    room: this.getRoomData(),
                    initialState: this.gameState
                });
                
                // Notify spectators
                if (this.spectatorManager) {
                    this.spectatorManager.onGameStart();
                }
            }
        }, 3000);
    }
    
    /**
     * Initialize authoritative game state
     */
    initializeGameState() {
        const playerArray = Array.from(this.players.values());
        const playerStates = {};
        
        // Initialize player positions in a circle around the arena
        playerArray.forEach((player, index) => {
            const angle = (index / playerArray.length) * 2 * Math.PI;
            const radius = this.arenaBounds / 3;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // Calculate initial direction (pointing toward center)
            const directionAngle = angle + Math.PI;
            let direction = {
                x: Math.round(Math.cos(directionAngle)),
                y: 0,
                z: Math.round(Math.sin(directionAngle))
            };
            
            // Normalize direction to valid game directions
            if (Math.abs(direction.x) > Math.abs(direction.z)) {
                direction.x = direction.x > 0 ? 1 : -1;
                direction.z = 0;
            } else {
                direction.x = 0;
                direction.z = direction.z > 0 ? 1 : -1;
            }
            
            playerStates[player.id] = {
                id: player.id,
                name: player.name,
                position: { x, y: 0, z },
                direction: direction,
                trail: [{ x, y: 0, z }],
                isAlive: true,
                lastInputTime: 0,
                lastProcessedSequence: 0
            };
        });
        
        this.gameState = {
            timestamp: Date.now(),
            frameNumber: 0,
            players: playerStates,
            gamePhase: 'playing',
            winner: null,
            bounds: {
                minX: -this.arenaBounds / 2,
                maxX: this.arenaBounds / 2,
                minZ: -this.arenaBounds / 2,
                maxZ: this.arenaBounds / 2,
                size: this.arenaBounds
            },
            gameMode: this.settings.gameMode
        };
        
        // Initialize game mode instance
        this.gameModeInstance = GameModeManager.createMode(this.settings.gameMode, this);
        this.gameModeInstance.initialize(Date.now());
        
        // Initialize power-up system
        this.powerUpSync.initialize();
        
        // Initialize input queues
        this.inputQueue.clear();
        playerArray.forEach(player => {
            this.inputQueue.set(player.id, []);
        });
    }
    
    /**
     * Start the authoritative game loop at 60Hz
     */
    startGameLoop() {
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
        }
        
        this.lastUpdateTime = Date.now();
        this.frameNumber = 0;
        
        this.gameLoopInterval = setInterval(() => {
            this.updateGameState();
            this.broadcastGameState();
        }, this.frameTime);
    }
    
    /**
     * Stop the game loop
     */
    stopGameLoop() {
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;
        }
    }
    
    /**
     * Update authoritative game state
     */
    updateGameState() {
        if (!this.gameState || this.status !== 'playing') {
            return;
        }
        
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastUpdateTime;
        this.lastUpdateTime = currentTime;
        this.frameNumber++;
        
        // Update game mode logic
        if (this.gameModeInstance) {
            this.gameModeInstance.update(currentTime, this.gameState);
        }
        
        // Update power-up system
        if (this.powerUpSync) {
            this.powerUpSync.update(currentTime, this.gameState);
        }
        
        // Update spectators
        if (this.spectatorManager) {
            this.spectatorManager.update(currentTime);
        }
        
        // Process player inputs
        for (const [playerId, playerState] of Object.entries(this.gameState.players)) {
            if (!playerState.isAlive) continue;
            
            // Store previous position for validation
            const previousPosition = { ...playerState.position };
            
            // Process queued inputs for this player
            const inputs = this.inputQueue.get(playerId) || [];
            while (inputs.length > 0) {
                const input = inputs.shift();
                
                // Validate direction change with anti-cheat
                const directionValidation = this.antiCheat.validateDirection(
                    playerId,
                    input.direction,
                    input.timestamp
                );
                
                if (!directionValidation.valid) {
                    this.handleCheatDetection(playerId, directionValidation);
                    continue;
                }
                
                // Validate and apply direction change
                if (this.validateDirectionChange(playerState.direction, input.direction)) {
                    playerState.direction = input.direction;
                    playerState.lastProcessedSequence = input.sequenceId;
                }
            }
            
            // Get speed multiplier from power-ups
            const speedMultiplier = this.powerUpSync ? 
                this.powerUpSync.getSpeedMultiplier(playerId, currentTime) : 1.0;
            
            // Move player
            playerState.position.x += playerState.direction.x * this.gameSpeed * speedMultiplier;
            playerState.position.z += playerState.direction.z * this.gameSpeed * speedMultiplier;
            
            // Validate position change
            const positionValidation = this.antiCheat.validatePosition(
                playerId,
                playerState.position,
                currentTime
            );
            
            if (!positionValidation.valid) {
                this.handleCheatDetection(playerId, positionValidation);
                // Revert to previous position
                playerState.position = previousPosition;
            }
            
            // Validate speed
            const distance = this.antiCheat.calculateDistance(previousPosition, playerState.position);
            const speedValidation = this.antiCheat.validateSpeed(playerId, distance, deltaTime);
            
            if (!speedValidation.valid) {
                this.handleCheatDetection(playerId, speedValidation);
                // Revert to previous position
                playerState.position = previousPosition;
            }
            
            // Add to trail
            playerState.trail.push({ ...playerState.position });
            
            // Limit trail length to prevent memory issues
            if (playerState.trail.length > 10000) {
                playerState.trail.shift();
            }
            
            // Periodic pattern detection (every 60 frames)
            if (this.frameNumber % 60 === 0) {
                this.runPatternDetection(playerId);
            }
        }
        
        // Check collisions
        this.checkCollisions();
        
        // Check win condition
        this.checkWinCondition();
        
        // Update game state metadata
        this.gameState.timestamp = currentTime;
        this.gameState.frameNumber = this.frameNumber;
    }
    
    /**
     * Broadcast game state to all clients
     */
    broadcastGameState() {
        if (!this.gameState) {
            return;
        }
        
        // Create optimized state for network transmission
        const networkState = {
            timestamp: this.gameState.timestamp,
            frameNumber: this.gameState.frameNumber,
            players: {},
            gamePhase: this.gameState.gamePhase,
            winner: this.gameState.winner,
            bounds: this.gameState.bounds,
            gameMode: this.gameState.gameMode
        };
        
        // Add game mode specific state
        if (this.gameModeInstance) {
            networkState.modeState = this.gameModeInstance.getModeState(Date.now());
        }
        
        // Add power-up state
        if (this.powerUpSync) {
            networkState.powerUps = this.powerUpSync.getAllPowerUps();
            networkState.effects = this.powerUpSync.getAllEffects(Date.now());
        }
        
        // Only send recent trail segments (last 50) to reduce bandwidth
        for (const [playerId, playerState] of Object.entries(this.gameState.players)) {
            const trailLength = playerState.trail.length;
            const recentTrail = trailLength > 50 
                ? playerState.trail.slice(trailLength - 50) 
                : playerState.trail;
            
            networkState.players[playerId] = {
                id: playerState.id,
                name: playerState.name,
                position: playerState.position,
                direction: playerState.direction,
                trail: recentTrail,
                isAlive: playerState.isAlive,
                lastProcessedSequence: playerState.lastProcessedSequence
            };
        }
        
        this.broadcastToRoom('gameState', networkState);
    }
    
    /**
     * Handle player input
     */
    handlePlayerInput(socketId, inputData) {
        if (this.status !== 'playing' || !this.gameState) {
            return;
        }
        
        const player = this.players.get(socketId);
        if (!player) {
            return;
        }
        
        // Validate input data
        if (!inputData || !inputData.direction || !inputData.sequenceId) {
            return;
        }
        
        // Convert direction string to vector
        const direction = this.parseDirection(inputData.direction);
        if (!direction) {
            return;
        }
        
        // Add to input queue
        const queue = this.inputQueue.get(socketId);
        if (queue) {
            queue.push({
                direction: direction,
                timestamp: inputData.timestamp || Date.now(),
                sequenceId: inputData.sequenceId
            });
            
            // Limit queue size
            if (queue.length > 10) {
                queue.shift();
            }
        }
    }
    
    /**
     * Parse direction string to vector
     */
    parseDirection(directionStr) {
        switch (directionStr) {
            case 'up':
                return { x: 0, y: 0, z: -1 };
            case 'down':
                return { x: 0, y: 0, z: 1 };
            case 'left':
                return { x: -1, y: 0, z: 0 };
            case 'right':
                return { x: 1, y: 0, z: 0 };
            default:
                return null;
        }
    }
    
    /**
     * Validate direction change (no 180-degree turns)
     */
    validateDirectionChange(currentDirection, newDirection) {
        // Can't reverse direction
        if (currentDirection.x !== 0 && newDirection.x === -currentDirection.x) {
            return false;
        }
        if (currentDirection.z !== 0 && newDirection.z === -currentDirection.z) {
            return false;
        }
        return true;
    }
    
    /**
     * Handle cheat detection
     */
    handleCheatDetection(playerId, violation) {
        // Flag the suspicious activity
        const response = this.antiCheat.flagSuspiciousActivity(playerId, violation);
        
        // Take action based on response
        switch (response.action) {
            case 'warning':
                // Send warning to player
                this.sendToPlayer(playerId, 'antiCheatWarning', {
                    reason: response.reason,
                    violationCount: response.violationCount
                });
                console.log(`[AntiCheat] Warning issued to ${playerId}: ${response.reason}`);
                break;
                
            case 'disconnect':
                // Disconnect player
                console.log(`[AntiCheat] Disconnecting ${playerId}: ${response.reason}`);
                this.antiCheat.disconnectCheater(playerId, response.reason);
                break;
                
            case 'ban':
                // Disconnect and log for ban
                console.log(`[AntiCheat] Banning ${playerId}: ${response.reason}`);
                this.antiCheat.disconnectCheater(playerId, response.reason);
                break;
        }
    }
    
    /**
     * Run pattern detection for a player
     */
    runPatternDetection(playerId) {
        // Check for speed hacking patterns
        const speedHackDetection = this.antiCheat.detectSpeedHacking(playerId);
        if (speedHackDetection.detected) {
            this.handleCheatDetection(playerId, speedHackDetection);
        }
        
        // Check for teleportation patterns
        const teleportDetection = this.antiCheat.detectTeleportation(playerId);
        if (teleportDetection.detected) {
            this.handleCheatDetection(playerId, teleportDetection);
        }
        
        // Check for collision bypass
        const playerState = this.gameState?.players[playerId];
        if (playerState && playerState.isAlive) {
            const collisionBypass = this.antiCheat.detectCollisionBypass(
                playerId,
                playerState.position,
                this.gameState.players
            );
            if (collisionBypass.detected) {
                this.handleCheatDetection(playerId, collisionBypass);
                // Force kill the player
                playerState.isAlive = false;
            }
        }
    }
    
    /**
     * Check for collisions
     */
    checkCollisions() {
        if (!this.gameState) {
            return;
        }
        
        const bounds = this.gameState.bounds;
        const currentTime = Date.now();
        
        for (const [playerId, playerState] of Object.entries(this.gameState.players)) {
            if (!playerState.isAlive) continue;
            
            const pos = playerState.position;
            let collisionDetected = false;
            
            // Check if player is in ghost mode (can pass through trails)
            const isGhost = this.powerUpSync && this.powerUpSync.isInGhostMode(playerId, currentTime);
            
            // Check boundary collision (ghost mode doesn't protect from boundaries)
            if (pos.x < bounds.minX || pos.x > bounds.maxX ||
                pos.z < bounds.minZ || pos.z > bounds.maxZ) {
                collisionDetected = true;
            }
            
            // Check trail collision (with all players' trails) if not in ghost mode
            if (!collisionDetected && !isGhost) {
                for (const [otherPlayerId, otherPlayerState] of Object.entries(this.gameState.players)) {
                    const trail = otherPlayerState.trail;
                    
                    // Skip first 10 segments for grace period
                    const startIndex = (otherPlayerId === playerId) ? 10 : 0;
                    
                    for (let i = startIndex; i < trail.length; i++) {
                        const segment = trail[i];
                        const distance = Math.sqrt(
                            Math.pow(pos.x - segment.x, 2) +
                            Math.pow(pos.z - segment.z, 2)
                        );
                        
                        if (distance < 0.5) {
                            collisionDetected = true;
                            break;
                        }
                    }
                    
                    if (collisionDetected) break;
                }
            }
            
            // Handle collision with shield protection
            if (collisionDetected) {
                const hasShield = this.powerUpSync && this.powerUpSync.hasShield(playerId, currentTime);
                
                if (hasShield) {
                    // Consume shield and prevent death
                    this.powerUpSync.consumeShield(playerId);
                    console.log(`[Collision] Shield protected ${playerId} from collision`);
                } else {
                    // No shield, player dies
                    playerState.isAlive = false;
                }
            }
        }
    }
    
    /**
     * Check win condition
     */
    checkWinCondition() {
        if (!this.gameState || this.gameState.gamePhase !== 'playing') {
            return;
        }
        
        // Use game mode specific win condition
        if (this.gameModeInstance) {
            const winResult = this.gameModeInstance.checkWinCondition(this.gameState);
            
            if (winResult) {
                this.gameState.gamePhase = 'ended';
                this.gameState.winner = winResult.winner;
                this.gameState.winReason = winResult.reason;
                
                // Add mode-specific data to game state
                if (winResult.survivalTimes) {
                    this.gameState.survivalTimes = winResult.survivalTimes;
                }
                if (winResult.finalSize !== undefined) {
                    this.gameState.finalSize = winResult.finalSize;
                }
                if (winResult.shrinkCount !== undefined) {
                    this.gameState.shrinkCount = winResult.shrinkCount;
                }
                
                // End the game
                setTimeout(() => {
                    this.endGame('completed', this.gameState.winner, winResult);
                }, 100);
            }
        }
    }

    /**
     * End the game
     */
    endGame(reason = 'completed', winnerId = null, winResult = null) {
        if (this.status !== 'playing') {
            return;
        }

        this.status = 'ended';
        this.endedAt = Date.now();
        this.winner = winnerId;
        
        // Stop game loop
        this.stopGameLoop();

        this.broadcastToRoom('gameEnded', {
            reason: reason,
            winner: winnerId,
            room: this.getRoomData(),
            finalState: this.gameState,
            winResult: winResult
        });
        
        // Notify spectators
        if (this.spectatorManager) {
            this.spectatorManager.onGameEnd(winnerId, this.gameState);
        }

        // Reset room after delay
        setTimeout(() => {
            this.resetGame();
        }, 5000);
    }

    /**
     * Reset the game for another round
     */
    resetGame() {
        if (this.status !== 'ended') {
            return;
        }

        this.status = 'waiting';
        this.startedAt = null;
        this.endedAt = null;
        this.winner = null;
        this.gameState = null;
        this.frameNumber = 0;
        
        // Reset game mode instance
        if (this.gameModeInstance) {
            this.gameModeInstance.reset();
            this.gameModeInstance = null;
        }
        
        // Reset power-up system
        if (this.powerUpSync) {
            this.powerUpSync.reset();
        }
        
        // Reset spectator system
        if (this.spectatorManager) {
            this.spectatorManager.reset();
        }
        
        // Clear input queues
        this.inputQueue.clear();

        // Reset all players to not ready
        for (const player of this.players.values()) {
            player.isReady = false;
        }

        this.broadcastToRoom('gameReset', {
            room: this.getRoomData()
        });
    }

    /**
     * Destroy the room
     */
    destroy() {
        // Stop game loop if running
        this.stopGameLoop();
        
        // Destroy game mode instance
        if (this.gameModeInstance) {
            this.gameModeInstance.destroy();
            this.gameModeInstance = null;
        }
        
        // Destroy spectator manager
        if (this.spectatorManager) {
            this.spectatorManager.destroy();
        }
        
        // Notify all players
        this.broadcastToRoom('roomDestroyed', {
            roomId: this.id
        });

        // Disconnect all sockets from room
        for (const socket of this.sockets.values()) {
            socket.leave(this.id);
        }

        // Clear data
        this.players.clear();
        this.sockets.clear();
        this.inputQueue.clear();
    }

    /**
     * Check if room can accept new players
     */
    canJoin() {
        return this.players.size < this.settings.maxPlayers && 
               (this.status === 'waiting' || this.status === 'countdown');
    }

    /**
     * Check if all players are ready
     */
    areAllPlayersReady() {
        if (this.players.size === 0) {
            return false;
        }
        for (const player of this.players.values()) {
            if (!player.isReady) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get player count
     */
    getPlayerCount() {
        return this.players.size;
    }

    /**
     * Get room data for clients
     */
    getRoomData() {
        return {
            id: this.id,
            settings: this.settings,
            status: this.status,
            playerCount: this.players.size,
            players: Array.from(this.players.values()).map(p => this.getPublicPlayerData(p)),
            spectatorCount: this.spectatorManager ? this.spectatorManager.getSpectatorCount() : 0,
            createdAt: this.createdAt,
            startedAt: this.startedAt
        };
    }

    /**
     * Get public player data (without sensitive info)
     */
    getPublicPlayerData(player) {
        return {
            id: player.id,
            name: player.name,
            isHost: player.isHost,
            isReady: player.isReady,
            ping: player.ping,
            isConnected: player.isConnected
        };
    }

    /**
     * Broadcast message to all players in room
     */
    broadcastToRoom(event, data) {
        this.io.to(this.id).emit(event, data);
    }

    /**
     * Send message to specific player
     */
    sendToPlayer(socketId, event, data) {
        const socket = this.sockets.get(socketId);
        if (socket) {
            socket.emit(event, data);
        }
    }

    /**
     * Update player ping
     */
    updatePlayerPing(socketId, ping) {
        const player = this.players.get(socketId);
        if (player) {
            player.ping = ping;
        }
    }
}

module.exports = { GameRoom };
