/**
 * Example usage of client-side networking components
 * This demonstrates how to integrate NetworkManager, MultiplayerUI, and ChatSystem
 */

const { NetworkManager } = require('./NetworkManager');
const { MultiplayerUI } = require('./MultiplayerUI');
const { ChatSystem } = require('./ChatSystem');

/**
 * Example multiplayer client setup
 */
class MultiplayerClient {
    constructor(gameInstance, renderingEngine) {
        this.gameInstance = gameInstance;
        this.renderingEngine = renderingEngine;
        
        // Initialize networking components
        this.networkManager = new NetworkManager(gameInstance, renderingEngine);
        this.multiplayerUI = new MultiplayerUI(this.networkManager);
        this.chatSystem = new ChatSystem(this.networkManager);
        
        this.setupEventHandlers();
    }
    
    /**
     * Connect to multiplayer server
     */
    async connect(serverUrl = 'http://localhost:3000') {
        try {
            await this.networkManager.connect(serverUrl);
            console.log('Connected to multiplayer server');
            
            // Show room browser
            this.multiplayerUI.showRoomBrowser();
            
            return true;
        } catch (error) {
            console.error('Failed to connect:', error);
            return false;
        }
    }
    
    /**
     * Setup event handlers for game integration
     */
    setupEventHandlers() {
        // Handle game state updates from server
        this.networkManager.onStateUpdate((data) => {
            this.handleGameStateUpdate(data);
        });
        
        // Handle game start
        this.networkManager.onGameStart((data) => {
            console.log('Game starting!');
            this.startMultiplayerGame(data);
        });
        
        // Handle game end
        this.networkManager.onGameEnd((data) => {
            console.log('Game ended. Winner:', data.winner);
            this.endMultiplayerGame(data);
        });
        
        // Handle connection issues
        this.networkManager.onDisconnected((data) => {
            console.warn('Disconnected from server:', data.reason);
        });
        
        this.networkManager.onReconnecting((data) => {
            console.log('Reconnecting... Attempt', data.attemptNumber);
        });
        
        this.networkManager.onReconnected((data) => {
            console.log('Reconnected successfully');
        });
    }
    
    /**
     * Handle game state updates from server
     */
    handleGameStateUpdate(data) {
        if (!this.gameInstance) return;
        
        // Update player positions
        if (data.players) {
            data.players.forEach(playerData => {
                // Update game state with server data
                // This would integrate with your existing game logic
                console.log('Update player:', playerData.id, playerData.position);
            });
        }
        
        // Update game status
        if (data.gameStatus) {
            console.log('Game status:', data.gameStatus);
        }
    }
    
    /**
     * Start multiplayer game
     */
    startMultiplayerGame(data) {
        // Hide lobby UI
        this.multiplayerUI.hideAllViews();
        
        // Show in-game UI (ping, connection status)
        this.multiplayerUI.showInGameUI();
        
        // Initialize game with multiplayer settings
        if (this.gameInstance) {
            // Start game loop
            // This would integrate with your existing game start logic
            console.log('Starting multiplayer game with settings:', data);
        }
    }
    
    /**
     * End multiplayer game
     */
    endMultiplayerGame(data) {
        // Show game end screen
        this.multiplayerUI.showGameEndScreen(data);
        
        // Stop game loop
        if (this.gameInstance) {
            // This would integrate with your existing game end logic
            console.log('Ending multiplayer game');
        }
    }
    
    /**
     * Send player input to server
     */
    sendPlayerInput(direction) {
        // Don't send input if chat is focused
        if (this.chatSystem.isChatFocused()) {
            return;
        }
        
        this.networkManager.sendInput(direction);
    }
    
    /**
     * Create a new room
     */
    async createRoom(settings) {
        try {
            const result = await this.networkManager.createRoom(settings);
            console.log('Room created:', result.roomId);
            return result;
        } catch (error) {
            console.error('Failed to create room:', error);
            throw error;
        }
    }
    
    /**
     * Join an existing room
     */
    async joinRoom(roomId) {
        try {
            const result = await this.networkManager.joinRoom(roomId);
            console.log('Joined room:', roomId);
            return result;
        } catch (error) {
            console.error('Failed to join room:', error);
            throw error;
        }
    }
    
    /**
     * Leave current room
     */
    async leaveRoom() {
        try {
            await this.networkManager.leaveRoom();
            console.log('Left room');
            this.multiplayerUI.showRoomBrowser();
        } catch (error) {
            console.error('Failed to leave room:', error);
            throw error;
        }
    }
    
    /**
     * Disconnect from server
     */
    disconnect() {
        this.networkManager.disconnect();
        this.multiplayerUI.hide();
        console.log('Disconnected from multiplayer');
    }
    
    /**
     * Cleanup
     */
    destroy() {
        this.disconnect();
        this.multiplayerUI.destroy();
        this.chatSystem.destroy();
    }
}

// Example usage:
/*
// In your main game initialization:
const game = new Game();
const renderer = new RenderingEngine();
const multiplayerClient = new MultiplayerClient(game, renderer);

// Connect to server
await multiplayerClient.connect('http://localhost:3000');

// In your game input handler:
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
        multiplayerClient.sendPlayerInput('up');
    }
    // ... other directions
});

// When player wants to create a room:
await multiplayerClient.createRoom({
    name: 'My Room',
    maxPlayers: 4,
    gameMode: 'classic',
    isPrivate: false
});

// When player wants to join a room:
await multiplayerClient.joinRoom('room-123');

// When done:
multiplayerClient.destroy();
*/

module.exports = { MultiplayerClient };
