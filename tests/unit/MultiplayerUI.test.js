/**
 * Tests for MultiplayerUI class
 */

const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
};

const MockLoggerClass = jest.fn().mockImplementation(() => mockLogger);
MockLoggerClass.create = jest.fn((namespace) => mockLogger);

jest.mock('@/utils/Logger.js', () => ({
    Logger: MockLoggerClass,
    logger: mockLogger,
    createLogger: jest.fn(() => mockLogger),
}));

const { MultiplayerUI } = require('@/ui/MultiplayerUI.js');

describe('MultiplayerUI', () => {
    let multiplayerUI;
    let mockNetworkManager;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = '';

        // Create mock network manager
        mockNetworkManager = {
            onRoomUpdate: jest.fn(),
            onPlayerJoined: jest.fn(),
            onPlayerLeft: jest.fn(),
            onGameStart: jest.fn(),
            onGameEnd: jest.fn(),
            onChatMessage: jest.fn(),
            onConnected: jest.fn(),
            onDisconnected: jest.fn(),
            onReconnecting: jest.fn(),
            getRoomList: jest.fn().mockResolvedValue([]),
            createRoom: jest.fn().mockResolvedValue({ success: true, roomId: 'room-123' }),
            joinRoom: jest.fn().mockResolvedValue({ success: true }),
            leaveRoom: jest.fn().mockResolvedValue({ success: true }),
            sendChatMessage: jest.fn(),
            sendReadyStatus: jest.fn(),
            getPing: jest.fn().mockReturnValue(50),
            getConnectionState: jest.fn().mockReturnValue('connected'),
            getPlayerId: jest.fn().mockReturnValue('player-1'),
        };

        multiplayerUI = new MultiplayerUI(mockNetworkManager);
    });

    afterEach(() => {
        if (multiplayerUI) {
            multiplayerUI.destroy();
        }
    });

    describe('constructor', () => {
        it('should initialize with correct default values', () => {
            expect(multiplayerUI.networkManager).toBe(mockNetworkManager);
            expect(multiplayerUI.currentView).toBe('menu');
            expect(multiplayerUI.selectedRoomId).toBeNull();
        });

        it('should create UI container', () => {
            const container = document.getElementById('multiplayer-ui');
            expect(container).toBeTruthy();
            expect(container.style.display).toBe('none');
        });

        it('should setup network event handlers', () => {
            expect(mockNetworkManager.onRoomUpdate).toHaveBeenCalled();
            expect(mockNetworkManager.onPlayerJoined).toHaveBeenCalled();
            expect(mockNetworkManager.onGameStart).toHaveBeenCalled();
        });
    });

    describe('showRoomBrowser', () => {
        it('should display room browser interface', () => {
            multiplayerUI.showRoomBrowser();

            expect(multiplayerUI.currentView).toBe('browser');
            expect(multiplayerUI.elements.container.style.display).toBe('block');
            expect(document.querySelector('.room-browser')).toBeTruthy();
        });

        it('should have create room button', () => {
            multiplayerUI.showRoomBrowser();

            const createBtn = document.getElementById('create-room-btn');
            expect(createBtn).toBeTruthy();
            expect(createBtn.textContent).toBe('Create Room');
        });

        it('should have refresh button', () => {
            multiplayerUI.showRoomBrowser();

            const refreshBtn = document.getElementById('refresh-rooms-btn');
            expect(refreshBtn).toBeTruthy();
        });

        it('should have quick match button', () => {
            multiplayerUI.showRoomBrowser();

            const quickMatchBtn = document.getElementById('quick-match-btn');
            expect(quickMatchBtn).toBeTruthy();
        });

        it('should load room list on show', () => {
            multiplayerUI.showRoomBrowser();

            expect(mockNetworkManager.getRoomList).toHaveBeenCalled();
        });
    });

    describe('refreshRoomList', () => {
        beforeEach(() => {
            multiplayerUI.showRoomBrowser();
        });

        it('should display empty message when no rooms', async () => {
            mockNetworkManager.getRoomList.mockResolvedValue([]);

            await multiplayerUI.refreshRoomList();

            const roomList = document.getElementById('room-list');
            expect(roomList.textContent).toContain('No rooms available');
        });

        it('should display room list', async () => {
            const mockRooms = [
                { id: 'room-1', name: 'Test Room', players: 2, maxPlayers: 4, gameMode: 'classic' },
                {
                    id: 'room-2',
                    name: 'Another Room',
                    players: 1,
                    maxPlayers: 2,
                    gameMode: 'timeTrial',
                },
            ];
            mockNetworkManager.getRoomList.mockResolvedValue(mockRooms);

            await multiplayerUI.refreshRoomList();

            const roomList = document.getElementById('room-list');
            expect(roomList.textContent).toContain('Test Room');
            expect(roomList.textContent).toContain('Another Room');
            expect(roomList.textContent).toContain('2/4 players');
        });

        it('should show full status for full rooms', async () => {
            const mockRooms = [
                { id: 'room-1', name: 'Full Room', players: 4, maxPlayers: 4, gameMode: 'classic' },
            ];
            mockNetworkManager.getRoomList.mockResolvedValue(mockRooms);

            await multiplayerUI.refreshRoomList();

            const joinBtn = document.querySelector('.join-room-btn');
            expect(joinBtn.textContent).toContain('Full');
            expect(joinBtn.disabled).toBe(true);
        });

        it('should handle errors gracefully', async () => {
            mockNetworkManager.getRoomList.mockRejectedValue(new Error('Network error'));

            await multiplayerUI.refreshRoomList();

            const roomList = document.getElementById('room-list');
            expect(roomList.textContent).toContain('Error loading rooms');
        });
    });

    describe('showCreateRoomDialog', () => {
        beforeEach(() => {
            multiplayerUI.showRoomBrowser();
        });

        it('should display create room dialog', () => {
            multiplayerUI.showCreateRoomDialog();

            expect(document.getElementById('room-name-input')).toBeTruthy();
            expect(document.getElementById('max-players-select')).toBeTruthy();
            expect(document.getElementById('game-mode-select')).toBeTruthy();
        });

        it('should create room with specified settings', async () => {
            multiplayerUI.showCreateRoomDialog();

            document.getElementById('room-name-input').value = 'My Test Room';
            document.getElementById('max-players-select').value = '3';
            document.getElementById('game-mode-select').value = 'timeTrial';

            const confirmBtn = document.getElementById('confirm-create-btn');
            confirmBtn.click();

            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(mockNetworkManager.createRoom).toHaveBeenCalledWith({
                name: 'My Test Room',
                maxPlayers: 3,
                gameMode: 'timeTrial',
                isPrivate: false,
            });
        });
    });

    describe('joinRoom', () => {
        it('should call network manager joinRoom', async () => {
            await multiplayerUI.joinRoom('room-123');

            expect(mockNetworkManager.joinRoom).toHaveBeenCalledWith('room-123');
        });

        it('should show lobby after joining', async () => {
            await multiplayerUI.joinRoom('room-123');

            expect(multiplayerUI.currentView).toBe('lobby');
        });
    });

    describe('quickMatch', () => {
        beforeEach(() => {
            multiplayerUI.showRoomBrowser();
        });

        it('should join first available room', async () => {
            const mockRooms = [{ id: 'room-1', players: 2, maxPlayers: 4 }];
            mockNetworkManager.getRoomList.mockResolvedValue(mockRooms);

            await multiplayerUI.quickMatch();

            expect(mockNetworkManager.joinRoom).toHaveBeenCalledWith('room-1');
        });

        it('should create room if none available', async () => {
            mockNetworkManager.getRoomList.mockResolvedValue([]);

            await multiplayerUI.quickMatch();

            expect(mockNetworkManager.createRoom).toHaveBeenCalledWith({
                name: 'Quick Match',
                maxPlayers: 4,
                gameMode: 'classic',
                isPrivate: false,
            });
        });
    });

    describe('showRoomLobby', () => {
        it('should display lobby interface', () => {
            multiplayerUI.showRoomLobby();

            expect(multiplayerUI.currentView).toBe('lobby');
            expect(document.querySelector('.room-lobby')).toBeTruthy();
        });

        it('should have player list', () => {
            multiplayerUI.showRoomLobby();

            expect(document.getElementById('player-list')).toBeTruthy();
        });

        it('should have chat interface', () => {
            multiplayerUI.showRoomLobby();

            expect(document.getElementById('chat-messages')).toBeTruthy();
            expect(document.getElementById('chat-input')).toBeTruthy();
            expect(document.getElementById('send-chat-btn')).toBeTruthy();
        });

        it('should have ready button', () => {
            multiplayerUI.showRoomLobby();

            const readyBtn = document.getElementById('ready-btn');
            expect(readyBtn).toBeTruthy();
            expect(readyBtn.textContent).toBe('Ready');
        });

        it('should toggle ready status on button click', () => {
            multiplayerUI.showRoomLobby();

            const readyBtn = document.getElementById('ready-btn');
            readyBtn.click();

            expect(mockNetworkManager.sendReadyStatus).toHaveBeenCalledWith(true);
            expect(readyBtn.textContent).toBe('Not Ready');
        });
    });

    describe('updateLobby', () => {
        beforeEach(() => {
            multiplayerUI.showRoomLobby();
        });

        it('should update player list', () => {
            const roomData = {
                players: [
                    { id: 'player-1', name: 'Player 1', isReady: true, ping: 30 },
                    { id: 'player-2', name: 'Player 2', isReady: false, ping: 50 },
                ],
            };

            multiplayerUI.updateLobby(roomData);

            const playerList = document.getElementById('player-list');
            expect(playerList.textContent).toContain('Player 1');
            expect(playerList.textContent).toContain('Player 2');
            expect(playerList.textContent).toContain('30ms');
        });

        it('should update room settings', () => {
            const roomData = {
                settings: {
                    gameMode: 'timeTrial',
                    maxPlayers: 3,
                },
            };

            multiplayerUI.updateLobby(roomData);

            expect(document.getElementById('setting-mode').textContent).toBe('timeTrial');
            expect(document.getElementById('setting-max').textContent).toBe('3');
        });
    });

    describe('sendChatMessage', () => {
        beforeEach(() => {
            multiplayerUI.showRoomLobby();
        });

        it('should send chat message', () => {
            const chatInput = document.getElementById('chat-input');
            chatInput.value = 'Hello world';

            multiplayerUI.sendChatMessage();

            expect(mockNetworkManager.sendChatMessage).toHaveBeenCalledWith('Hello world');
            expect(chatInput.value).toBe('');
        });

        it('should not send empty messages', () => {
            const chatInput = document.getElementById('chat-input');
            chatInput.value = '   ';

            multiplayerUI.sendChatMessage();

            expect(mockNetworkManager.sendChatMessage).not.toHaveBeenCalled();
        });
    });

    describe('addChatMessage', () => {
        beforeEach(() => {
            multiplayerUI.showRoomLobby();
        });

        it('should add message to chat display', () => {
            const messageData = {
                playerName: 'Player 1',
                message: 'Hello everyone!',
            };

            multiplayerUI.addChatMessage(messageData);

            const chatMessages = document.getElementById('chat-messages');
            expect(chatMessages.textContent).toContain('Player 1');
            expect(chatMessages.textContent).toContain('Hello everyone!');
        });
    });

    describe('showInGameUI', () => {
        it('should display in-game UI overlay', () => {
            multiplayerUI.showInGameUI();

            expect(multiplayerUI.currentView).toBe('game');
            const inGameUI = document.getElementById('multiplayer-ingame-ui');
            expect(inGameUI).toBeTruthy();
        });

        it('should display ping information', () => {
            multiplayerUI.showInGameUI();

            const inGameUI = document.getElementById('multiplayer-ingame-ui');
            expect(inGameUI.textContent).toContain('50ms');
        });

        it('should display connection status', () => {
            multiplayerUI.showInGameUI();

            const inGameUI = document.getElementById('multiplayer-ingame-ui');
            expect(inGameUI.textContent).toContain('Connected');
        });
    });

    describe('updateInGameUI', () => {
        beforeEach(() => {
            multiplayerUI.showInGameUI();
        });

        it('should update ping display', () => {
            mockNetworkManager.getPing.mockReturnValue(100);

            multiplayerUI.updateInGameUI();

            const inGameUI = document.getElementById('multiplayer-ingame-ui');
            expect(inGameUI.textContent).toContain('100ms');
        });

        it('should show reconnecting status', () => {
            mockNetworkManager.getConnectionState.mockReturnValue('reconnecting');

            multiplayerUI.updateInGameUI();

            const inGameUI = document.getElementById('multiplayer-ingame-ui');
            expect(inGameUI.textContent).toContain('Reconnecting');
        });

        it('should show disconnected status', () => {
            mockNetworkManager.getConnectionState.mockReturnValue('disconnected');

            multiplayerUI.updateInGameUI();

            const inGameUI = document.getElementById('multiplayer-ingame-ui');
            expect(inGameUI.textContent).toContain('Disconnected');
        });
    });

    describe('showNotification', () => {
        it('should display notification message', () => {
            multiplayerUI.showNotification('Test notification');

            const notifications = document.querySelectorAll('div');
            const notification = Array.from(notifications).find(
                (el) => el.textContent === 'Test notification'
            );

            expect(notification).toBeTruthy();
        });
    });

    describe('showGameEndScreen', () => {
        it('should display victory screen for winner', () => {
            const gameData = {
                winner: 'player-1',
                winnerName: 'Player 1',
            };

            multiplayerUI.showGameEndScreen(gameData);

            const endScreen = document.body.lastChild;
            expect(endScreen.textContent).toContain('Victory!');
            expect(endScreen.textContent).toContain('Player 1');
        });

        it('should display defeat screen for loser', () => {
            mockNetworkManager.getPlayerId.mockReturnValue('player-2');

            const gameData = {
                winner: 'player-1',
                winnerName: 'Player 1',
            };

            multiplayerUI.showGameEndScreen(gameData);

            const endScreen = document.body.lastChild;
            expect(endScreen.textContent).toContain('Defeat');
        });
    });

    describe('hide and show', () => {
        it('should hide UI', () => {
            multiplayerUI.showRoomBrowser();
            multiplayerUI.hide();

            expect(multiplayerUI.elements.container.style.display).toBe('none');
            expect(multiplayerUI.currentView).toBe('menu');
        });

        it('should show UI', () => {
            multiplayerUI.hide();
            multiplayerUI.show();

            expect(multiplayerUI.elements.container.style.display).toBe('block');
        });
    });

    describe('getCurrentView', () => {
        it('should return current view', () => {
            expect(multiplayerUI.getCurrentView()).toBe('menu');

            multiplayerUI.showRoomBrowser();
            expect(multiplayerUI.getCurrentView()).toBe('browser');

            multiplayerUI.showRoomLobby();
            expect(multiplayerUI.getCurrentView()).toBe('lobby');
        });
    });

    describe('destroy', () => {
        it('should cleanup all UI elements', () => {
            multiplayerUI.showRoomBrowser();
            multiplayerUI.destroy();

            expect(document.getElementById('multiplayer-ui')).toBeNull();
        });
    });

    describe('network event handlers', () => {
        it('should handle playerJoined event', () => {
            const playerJoinedCallback = mockNetworkManager.onPlayerJoined.mock.calls[0][0];

            playerJoinedCallback({ playerName: 'New Player' });

            // Should show notification (check that notification was created)
            const notifications = document.querySelectorAll('div');
            const notification = Array.from(notifications).find((el) =>
                el.textContent.includes('New Player joined')
            );
            expect(notification).toBeTruthy();
        });

        it('should handle gameStart event', () => {
            multiplayerUI.showRoomLobby();

            const gameStartCallback = mockNetworkManager.onGameStart.mock.calls[0][0];
            gameStartCallback({});

            expect(multiplayerUI.currentView).toBe('game');
        });
    });
});
