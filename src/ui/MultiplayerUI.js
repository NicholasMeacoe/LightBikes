/**
 * MultiplayerUI - User interface components for multiplayer functionality
 * Handles room browser, lobby, in-game networking UI, and player interactions
 */

class MultiplayerUI {
    constructor(networkManager) {
        this.networkManager = networkManager;
        this.currentView = 'menu'; // menu, browser, lobby, game
        this.selectedRoomId = null;

        // UI element references
        this.elements = {
            container: null,
            roomBrowser: null,
            lobby: null,
            inGameUI: null,
        };

        // Callbacks
        this.callbacks = {
            createRoom: null,
            joinRoom: null,
            leaveRoom: null,
            sendChat: null,
            toggleReady: null,
            startGame: null,
        };

        this.initialize();
    }

    /**
     * Initialize UI components
     */
    initialize() {
        this.createContainer();
        this.setupNetworkEventHandlers();
    }

    /**
     * Create main UI container
     */
    createContainer() {
        // Create main container if it doesn't exist
        let container = document.getElementById('multiplayer-ui');
        if (!container) {
            container = document.createElement('div');
            container.id = 'multiplayer-ui';
            container.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                font-family: Arial, sans-serif;
                z-index: 1000;
                display: none;
            `;
            document.body.appendChild(container);
        }
        this.elements.container = container;
    }

    /**
     * Setup network event handlers
     */
    setupNetworkEventHandlers() {
        if (!this.networkManager) return;

        this.networkManager.onRoomUpdate((data) => {
            if (this.currentView === 'lobby') {
                this.updateLobby(data);
            }
        });

        this.networkManager.onPlayerJoined((data) => {
            this.showNotification(`${data.playerName || 'Player'} joined`);
        });

        this.networkManager.onPlayerLeft((data) => {
            this.showNotification(`${data.playerName || 'Player'} left`);
        });

        this.networkManager.onGameStart((data) => {
            this.hideAllViews();
            this.showInGameUI();
        });

        this.networkManager.onGameEnd((data) => {
            this.showGameEndScreen(data);
        });

        this.networkManager.onChatMessage((data) => {
            this.addChatMessage(data);
        });

        this.networkManager.onConnected(() => {
            this.updateConnectionStatus('connected');
        });

        this.networkManager.onDisconnected(() => {
            this.updateConnectionStatus('disconnected');
        });

        this.networkManager.onReconnecting((data) => {
            this.updateConnectionStatus('reconnecting', data.attemptNumber);
        });
    }

    /**
     * Show room browser interface
     */
    showRoomBrowser() {
        this.hideAllViews();
        this.currentView = 'browser';

        const browser = document.createElement('div');
        browser.className = 'room-browser';
        browser.style.cssText = `
            padding: 20px;
            max-width: 800px;
            margin: 50px auto;
        `;

        browser.innerHTML = `
            <h1 style="text-align: center; margin-bottom: 30px;">Multiplayer Rooms</h1>
            
            <div style="margin-bottom: 20px; text-align: center;">
                <button id="create-room-btn" style="
                    padding: 15px 30px;
                    font-size: 16px;
                    background: #00ff00;
                    color: black;
                    border: none;
                    cursor: pointer;
                    margin-right: 10px;
                ">Create Room</button>
                
                <button id="refresh-rooms-btn" style="
                    padding: 15px 30px;
                    font-size: 16px;
                    background: #0088ff;
                    color: white;
                    border: none;
                    cursor: pointer;
                    margin-right: 10px;
                ">Refresh</button>
                
                <button id="quick-match-btn" style="
                    padding: 15px 30px;
                    font-size: 16px;
                    background: #ff8800;
                    color: white;
                    border: none;
                    cursor: pointer;
                ">Quick Match</button>
            </div>
            
            <div id="room-list" style="
                background: rgba(255, 255, 255, 0.1);
                padding: 20px;
                border-radius: 5px;
                min-height: 300px;
            ">
                <p style="text-align: center; color: #888;">Loading rooms...</p>
            </div>
            
            <div style="margin-top: 20px; text-align: center;">
                <button id="back-to-menu-btn" style="
                    padding: 10px 20px;
                    font-size: 14px;
                    background: #666;
                    color: white;
                    border: none;
                    cursor: pointer;
                ">Back to Menu</button>
            </div>
        `;

        this.elements.container.appendChild(browser);
        this.elements.roomBrowser = browser;
        this.elements.container.style.display = 'block';

        // Setup event listeners
        document.getElementById('create-room-btn').addEventListener('click', () => {
            this.showCreateRoomDialog();
        });

        document.getElementById('refresh-rooms-btn').addEventListener('click', () => {
            this.refreshRoomList();
        });

        document.getElementById('quick-match-btn').addEventListener('click', () => {
            this.quickMatch();
        });

        document.getElementById('back-to-menu-btn').addEventListener('click', () => {
            this.hide();
        });

        // Load initial room list
        this.refreshRoomList();
    }

    /**
     * Refresh room list
     */
    async refreshRoomList() {
        const roomListEl = document.getElementById('room-list');
        if (!roomListEl) return;

        roomListEl.innerHTML = '<p style="text-align: center; color: #888;">Loading rooms...</p>';

        try {
            const rooms = await this.networkManager.getRoomList();

            if (rooms.length === 0) {
                roomListEl.innerHTML =
                    '<p style="text-align: center; color: #888;">No rooms available. Create one!</p>';
                return;
            }

            roomListEl.innerHTML = rooms
                .map(
                    (room) => `
                <div class="room-item" style="
                    background: rgba(255, 255, 255, 0.05);
                    padding: 15px;
                    margin-bottom: 10px;
                    border-radius: 5px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <div>
                        <div style="font-size: 18px; font-weight: bold;">${room.name || 'Room ' + room.id}</div>
                        <div style="font-size: 14px; color: #aaa;">
                            ${room.players}/${room.maxPlayers} players | ${room.gameMode || 'Classic'}
                        </div>
                    </div>
                    <button class="join-room-btn" data-room-id="${room.id}" style="
                        padding: 10px 20px;
                        background: #00ff00;
                        color: black;
                        border: none;
                        cursor: pointer;
                        ${room.players >= room.maxPlayers ? 'opacity: 0.5; cursor: not-allowed;' : ''}
                    " ${room.players >= room.maxPlayers ? 'disabled' : ''}>
                        ${room.players >= room.maxPlayers ? 'Full' : 'Join'}
                    </button>
                </div>
            `
                )
                .join('');

            // Add event listeners to join buttons
            document.querySelectorAll('.join-room-btn').forEach((btn) => {
                btn.addEventListener('click', (e) => {
                    /** @type {Element} */
                    const target = /** @type {any} */ (e.target);
                    const roomId = target.getAttribute('data-room-id');
                    this.joinRoom(roomId);
                });
            });
        } catch (error) {
            roomListEl.innerHTML = `<p style="text-align: center; color: #ff0000;">Error loading rooms: ${error.message}</p>`;
        }
    }

    /**
     * Show create room dialog
     */
    showCreateRoomDialog() {
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #222;
            padding: 30px;
            border-radius: 10px;
            border: 2px solid #00ff00;
            z-index: 1001;
        `;

        dialog.innerHTML = `
            <h2 style="margin-top: 0;">Create Room</h2>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Room Name:</label>
                <input type="text" id="room-name-input" style="
                    width: 100%;
                    padding: 8px;
                    background: #333;
                    color: white;
                    border: 1px solid #555;
                " value="My Room">
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Max Players:</label>
                <select id="max-players-select" style="
                    width: 100%;
                    padding: 8px;
                    background: #333;
                    color: white;
                    border: 1px solid #555;
                ">
                    <option value="2">2 Players</option>
                    <option value="3">3 Players</option>
                    <option value="4" selected>4 Players</option>
                </select>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Game Mode:</label>
                <select id="game-mode-select" style="
                    width: 100%;
                    padding: 8px;
                    background: #333;
                    color: white;
                    border: 1px solid #555;
                ">
                    <option value="classic">Classic</option>
                    <option value="timeTrial">Time Trial</option>
                    <option value="arenaShrink">Arena Shrink</option>
                </select>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: flex; align-items: center;">
                    <input type="checkbox" id="private-room-checkbox" style="margin-right: 10px;">
                    Private Room
                </label>
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button id="confirm-create-btn" style="
                    flex: 1;
                    padding: 10px;
                    background: #00ff00;
                    color: black;
                    border: none;
                    cursor: pointer;
                ">Create</button>
                
                <button id="cancel-create-btn" style="
                    flex: 1;
                    padding: 10px;
                    background: #666;
                    color: white;
                    border: none;
                    cursor: pointer;
                ">Cancel</button>
            </div>
        `;

        this.elements.container.appendChild(dialog);

        document.getElementById('confirm-create-btn').addEventListener('click', async () => {
            /** @type {HTMLInputElement} */
            const nameInput = /** @type {any} */ (document.getElementById('room-name-input'));
            /** @type {HTMLSelectElement} */
            const maxPlayersSelect = /** @type {any} */ (
                document.getElementById('max-players-select')
            );
            /** @type {HTMLSelectElement} */
            const gameModeSelect = /** @type {any} */ (document.getElementById('game-mode-select'));
            /** @type {HTMLInputElement} */
            const privateCheckbox = /** @type {any} */ (
                document.getElementById('private-room-checkbox')
            );

            const settings = {
                name: nameInput.value,
                maxPlayers: parseInt(maxPlayersSelect.value),
                gameMode: gameModeSelect.value,
                isPrivate: privateCheckbox.checked,
            };

            try {
                await this.networkManager.createRoom(settings);
                dialog.remove();
                this.showRoomLobby();
            } catch (error) {
                alert('Failed to create room: ' + error.message);
            }
        });

        document.getElementById('cancel-create-btn').addEventListener('click', () => {
            dialog.remove();
        });
    }

    /**
     * Join a room
     */
    async joinRoom(roomId) {
        try {
            await this.networkManager.joinRoom(roomId);
            this.showRoomLobby();
        } catch (error) {
            alert('Failed to join room: ' + error.message);
        }
    }

    /**
     * Quick match - join first available room
     */
    async quickMatch() {
        try {
            const rooms = await this.networkManager.getRoomList();
            const availableRoom = rooms.find((room) => room.players < room.maxPlayers);

            if (availableRoom) {
                await this.joinRoom(availableRoom.id);
            } else {
                // Create a new room if none available
                await this.networkManager.createRoom({
                    name: 'Quick Match',
                    maxPlayers: 4,
                    gameMode: 'classic',
                    isPrivate: false,
                });
                this.showRoomLobby();
            }
        } catch (error) {
            alert('Quick match failed: ' + error.message);
        }
    }

    /**
     * Show room lobby interface
     */
    showRoomLobby(roomData) {
        this.hideAllViews();
        this.currentView = 'lobby';

        const lobby = document.createElement('div');
        lobby.className = 'room-lobby';
        lobby.style.cssText = `
            padding: 20px;
            max-width: 1000px;
            margin: 50px auto;
        `;

        lobby.innerHTML = `
            <h1 style="text-align: center; margin-bottom: 30px;">Room Lobby</h1>
            
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
                <div>
                    <h2>Players</h2>
                    <div id="player-list" style="
                        background: rgba(255, 255, 255, 0.1);
                        padding: 20px;
                        border-radius: 5px;
                        min-height: 200px;
                    ">
                        <p style="color: #888;">Waiting for players...</p>
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <h3>Chat</h3>
                        <div id="chat-messages" style="
                            background: rgba(255, 255, 255, 0.1);
                            padding: 10px;
                            border-radius: 5px;
                            height: 150px;
                            overflow-y: auto;
                            margin-bottom: 10px;
                        "></div>
                        
                        <div style="display: flex; gap: 10px;">
                            <input type="text" id="chat-input" placeholder="Type a message..." style="
                                flex: 1;
                                padding: 10px;
                                background: #333;
                                color: white;
                                border: 1px solid #555;
                            ">
                            <button id="send-chat-btn" style="
                                padding: 10px 20px;
                                background: #00ff00;
                                color: black;
                                border: none;
                                cursor: pointer;
                            ">Send</button>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h2>Settings</h2>
                    <div id="room-settings" style="
                        background: rgba(255, 255, 255, 0.1);
                        padding: 20px;
                        border-radius: 5px;
                    ">
                        <p><strong>Game Mode:</strong> <span id="setting-mode">Classic</span></p>
                        <p><strong>Max Players:</strong> <span id="setting-max">4</span></p>
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <button id="ready-btn" style="
                            width: 100%;
                            padding: 15px;
                            font-size: 16px;
                            background: #00ff00;
                            color: black;
                            border: none;
                            cursor: pointer;
                            margin-bottom: 10px;
                        ">Ready</button>
                        
                        <button id="leave-room-btn" style="
                            width: 100%;
                            padding: 15px;
                            font-size: 16px;
                            background: #ff0000;
                            color: white;
                            border: none;
                            cursor: pointer;
                        ">Leave Room</button>
                    </div>
                </div>
            </div>
        `;

        this.elements.container.appendChild(lobby);
        this.elements.lobby = lobby;
        this.elements.container.style.display = 'block';

        // Setup event listeners
        let isReady = false;
        document.getElementById('ready-btn').addEventListener('click', () => {
            isReady = !isReady;
            this.networkManager.sendReadyStatus(isReady);
            document.getElementById('ready-btn').textContent = isReady ? 'Not Ready' : 'Ready';
            document.getElementById('ready-btn').style.background = isReady ? '#ff8800' : '#00ff00';
        });

        document.getElementById('leave-room-btn').addEventListener('click', async () => {
            try {
                await this.networkManager.leaveRoom();
                this.showRoomBrowser();
            } catch (error) {
                alert('Failed to leave room: ' + error.message);
            }
        });

        document.getElementById('send-chat-btn').addEventListener('click', () => {
            this.sendChatMessage();
        });

        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });

        if (roomData) {
            this.updateLobby(roomData);
        }
    }

    /**
     * Update lobby with room data
     */
    updateLobby(roomData) {
        const playerList = document.getElementById('player-list');
        if (playerList && roomData.players) {
            playerList.innerHTML = roomData.players
                .map(
                    (player) => `
                <div style="
                    padding: 10px;
                    margin-bottom: 5px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 3px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <span>${player.name || player.id}</span>
                    <div>
                        <span style="
                            padding: 3px 8px;
                            background: ${player.isReady ? '#00ff00' : '#666'};
                            color: ${player.isReady ? 'black' : 'white'};
                            border-radius: 3px;
                            font-size: 12px;
                            margin-right: 10px;
                        ">${player.isReady ? 'Ready' : 'Not Ready'}</span>
                        <span style="color: #888;">${player.ping || 0}ms</span>
                    </div>
                </div>
            `
                )
                .join('');
        }

        if (roomData.settings) {
            const modeEl = document.getElementById('setting-mode');
            const maxEl = document.getElementById('setting-max');
            if (modeEl) modeEl.textContent = roomData.settings.gameMode || 'Classic';
            if (maxEl) maxEl.textContent = roomData.settings.maxPlayers || 4;
        }
    }

    /**
     * Send chat message
     */
    sendChatMessage() {
        /** @type {HTMLInputElement} */
        const input = /** @type {any} */ (document.getElementById('chat-input'));
        if (!input || !input.value.trim()) return;

        this.networkManager.sendChatMessage(input.value.trim());
        input.value = '';
    }

    /**
     * Add chat message to display
     */
    addChatMessage(data) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        const messageEl = document.createElement('div');
        messageEl.style.cssText =
            'margin-bottom: 5px; padding: 5px; background: rgba(255, 255, 255, 0.05); border-radius: 3px;';
        messageEl.innerHTML = `<strong>${data.playerName || 'Player'}:</strong> ${data.message}`;

        chatMessages.appendChild(messageEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    /**
     * Show in-game networking UI
     */
    showInGameUI() {
        this.currentView = 'game';

        // Create minimal in-game UI overlay
        let inGameUI = document.getElementById('multiplayer-ingame-ui');
        if (!inGameUI) {
            inGameUI = document.createElement('div');
            inGameUI.id = 'multiplayer-ingame-ui';
            inGameUI.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 10px;
                border-radius: 5px;
                font-family: Arial, sans-serif;
                z-index: 100;
            `;
            document.body.appendChild(inGameUI);
        }

        this.elements.inGameUI = inGameUI;
        this.updateInGameUI();

        // Start updating ping display
        this.startInGameUIUpdates();
    }

    /**
     * Update in-game UI
     */
    updateInGameUI() {
        if (!this.elements.inGameUI) return;

        const ping = this.networkManager.getPing();
        const connectionState = this.networkManager.getConnectionState();

        let statusColor = '#00ff00';
        let statusText = 'Connected';

        if (connectionState === 'reconnecting') {
            statusColor = '#ff8800';
            statusText = 'Reconnecting...';
        } else if (connectionState === 'disconnected') {
            statusColor = '#ff0000';
            statusText = 'Disconnected';
        }

        this.elements.inGameUI.innerHTML = `
            <div style="font-size: 12px;">
                <div style="margin-bottom: 5px;">
                    <span style="color: ${statusColor};">●</span> ${statusText}
                </div>
                <div>Ping: ${ping}ms</div>
            </div>
        `;
    }

    /**
     * Start in-game UI updates
     */
    startInGameUIUpdates() {
        this.stopInGameUIUpdates();
        this.inGameUIInterval = setInterval(() => {
            this.updateInGameUI();
        }, 1000);
    }

    /**
     * Stop in-game UI updates
     */
    stopInGameUIUpdates() {
        if (this.inGameUIInterval) {
            clearInterval(this.inGameUIInterval);
            this.inGameUIInterval = null;
        }
    }

    /**
     * Update connection status
     */
    updateConnectionStatus(status, attemptNumber) {
        if (this.currentView === 'game') {
            this.updateInGameUI();
        }
    }

    /**
     * Show notification
     */
    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 15px 30px;
            border-radius: 5px;
            z-index: 2000;
            font-family: Arial, sans-serif;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    /**
     * Show game end screen
     */
    showGameEndScreen(data) {
        const endScreen = document.createElement('div');
        endScreen.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            color: white;
            padding: 40px;
            border-radius: 10px;
            text-align: center;
            z-index: 2000;
            border: 3px solid ${data.winner === this.networkManager.getPlayerId() ? '#00ff00' : '#ff0000'};
        `;

        endScreen.innerHTML = `
            <h1 style="margin-top: 0; font-size: 48px;">
                ${data.winner === this.networkManager.getPlayerId() ? 'Victory!' : 'Defeat'}
            </h1>
            <p style="font-size: 24px; margin: 20px 0;">
                Winner: ${data.winnerName || 'Player'}
            </p>
            <button id="back-to-lobby-btn" style="
                padding: 15px 30px;
                font-size: 18px;
                background: #00ff00;
                color: black;
                border: none;
                cursor: pointer;
                margin-top: 20px;
            ">Back to Lobby</button>
        `;

        document.body.appendChild(endScreen);

        document.getElementById('back-to-lobby-btn').addEventListener('click', () => {
            endScreen.remove();
            this.showRoomLobby();
        });
    }

    /**
     * Hide all views
     */
    hideAllViews() {
        if (this.elements.roomBrowser) {
            this.elements.roomBrowser.remove();
            this.elements.roomBrowser = null;
        }
        if (this.elements.lobby) {
            this.elements.lobby.remove();
            this.elements.lobby = null;
        }
        if (this.elements.inGameUI) {
            this.stopInGameUIUpdates();
        }
    }

    /**
     * Hide entire UI
     */
    hide() {
        this.hideAllViews();
        if (this.elements.container) {
            this.elements.container.style.display = 'none';
        }
        this.currentView = 'menu';
    }

    /**
     * Show UI
     */
    show() {
        if (this.elements.container) {
            this.elements.container.style.display = 'block';
        }
    }

    /**
     * Get current view
     */
    getCurrentView() {
        return this.currentView;
    }

    /**
     * Cleanup
     */
    destroy() {
        this.stopInGameUIUpdates();
        this.hideAllViews();
        if (this.elements.container) {
            this.elements.container.remove();
        }
    }
}

module.exports = { MultiplayerUI };
