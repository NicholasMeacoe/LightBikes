/**
 * Tests for NetworkManager class
 */

const { NetworkManager } = require('../../src/multiplayer/NetworkManager');

// Mock socket.io-client
jest.mock('socket.io-client');
const io = require('socket.io-client');

describe('NetworkManager', () => {
    let networkManager;
    let mockSocket;
    let mockGameInstance;
    let mockRenderingEngine;
    
    beforeEach(() => {
        // Create mock socket
        mockSocket = {
            id: 'test-player-id',
            on: jest.fn(),
            emit: jest.fn(),
            disconnect: jest.fn(),
            connected: true
        };
        
        // Mock io to return our mock socket
        io.mockReturnValue(mockSocket);
        
        // Create mock game instance and rendering engine
        mockGameInstance = {};
        mockRenderingEngine = {};
        
        // Create network manager
        networkManager = new NetworkManager(mockGameInstance, mockRenderingEngine);
    });
    
    afterEach(() => {
        jest.clearAllMocks();
        if (networkManager) {
            networkManager.disconnect();
        }
    });
    
    describe('constructor', () => {
        it('should initialize with correct default values', () => {
            expect(networkManager.gameInstance).toBe(mockGameInstance);
            expect(networkManager.renderingEngine).toBe(mockRenderingEngine);
            expect(networkManager.socket).toBeNull();
            expect(networkManager.connected).toBe(false);
            expect(networkManager.roomId).toBeNull();
            expect(networkManager.playerId).toBeNull();
            expect(networkManager.ping).toBe(0);
            expect(networkManager.connectionState).toBe('disconnected');
        });
        
        it('should initialize event handlers', () => {
            expect(networkManager.eventHandlers).toBeDefined();
            expect(networkManager.eventHandlers.stateUpdate).toEqual([]);
            expect(networkManager.eventHandlers.playerJoined).toEqual([]);
            expect(networkManager.eventHandlers.connected).toEqual([]);
        });
    });
    
    describe('connect', () => {
        it('should create socket connection with correct options', async () => {
            const connectPromise = networkManager.connect('http://localhost:3000');
            
            // Simulate successful connection
            const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
            connectHandler();
            
            await connectPromise;
            
            expect(io).toHaveBeenCalledWith('http://localhost:3000', expect.objectContaining({
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 5,
                timeout: 10000
            }));
        });
        
        it('should set connected state on successful connection', async () => {
            const connectPromise = networkManager.connect('http://localhost:3000');
            
            const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
            connectHandler();
            
            await connectPromise;
            
            expect(networkManager.connected).toBe(true);
            expect(networkManager.connectionState).toBe('connected');
            expect(networkManager.playerId).toBe('test-player-id');
        });
        
        it('should trigger connected event on successful connection', async () => {
            const connectedCallback = jest.fn();
            networkManager.on('connected', connectedCallback);
            
            const connectPromise = networkManager.connect('http://localhost:3000');
            
            const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
            connectHandler();
            
            await connectPromise;
            
            expect(connectedCallback).toHaveBeenCalledWith({ playerId: 'test-player-id' });
        });
        
        it('should reject on connection error', async () => {
            const connectPromise = networkManager.connect('http://localhost:3000');
            
            const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1];
            errorHandler(new Error('Connection failed'));
            
            await expect(connectPromise).rejects.toThrow('Connection failed');
            expect(networkManager.connectionState).toBe('disconnected');
        });
        
        it('should resolve immediately if already connected', async () => {
            networkManager.socket = mockSocket;
            networkManager.connected = true;
            
            await networkManager.connect('http://localhost:3000');
            
            expect(io).not.toHaveBeenCalled();
        });
    });
    
    describe('disconnect', () => {
        beforeEach(async () => {
            const connectPromise = networkManager.connect('http://localhost:3000');
            const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
            connectHandler();
            await connectPromise;
        });
        
        it('should disconnect socket and reset state', () => {
            networkManager.disconnect();
            
            expect(mockSocket.disconnect).toHaveBeenCalled();
            expect(networkManager.socket).toBeNull();
            expect(networkManager.connected).toBe(false);
            expect(networkManager.connectionState).toBe('disconnected');
            expect(networkManager.roomId).toBeNull();
            expect(networkManager.playerId).toBeNull();
        });
    });
    
    describe('createRoom', () => {
        beforeEach(async () => {
            const connectPromise = networkManager.connect('http://localhost:3000');
            const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
            connectHandler();
            await connectPromise;
        });
        
        it('should emit createRoom event with settings', async () => {
            const settings = { maxPlayers: 4, gameMode: 'classic', isPrivate: false };
            
            mockSocket.emit.mockImplementation((event, data, callback) => {
                if (event === 'createRoom') {
                    callback({ success: true, roomId: 'room-123' });
                }
            });
            
            const result = await networkManager.createRoom(settings);
            
            expect(mockSocket.emit).toHaveBeenCalledWith('createRoom', settings, expect.any(Function));
            expect(result.roomId).toBe('room-123');
            expect(networkManager.roomId).toBe('room-123');
        });
        
        it('should reject if not connected', async () => {
            networkManager.connected = false;
            
            await expect(networkManager.createRoom({})).rejects.toThrow('Not connected to server');
        });
        
        it('should reject on server error', async () => {
            mockSocket.emit.mockImplementation((event, data, callback) => {
                if (event === 'createRoom') {
                    callback({ success: false, error: 'Room creation failed' });
                }
            });
            
            await expect(networkManager.createRoom({})).rejects.toThrow('Room creation failed');
        });
    });
    
    describe('joinRoom', () => {
        beforeEach(async () => {
            const connectPromise = networkManager.connect('http://localhost:3000');
            const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
            connectHandler();
            await connectPromise;
        });
        
        it('should emit joinRoom event with room ID', async () => {
            mockSocket.emit.mockImplementation((event, data, callback) => {
                if (event === 'joinRoom') {
                    callback({ success: true, roomId: 'room-456' });
                }
            });
            
            const result = await networkManager.joinRoom('room-456');
            
            expect(mockSocket.emit).toHaveBeenCalledWith('joinRoom', { roomId: 'room-456' }, expect.any(Function));
            expect(result.success).toBe(true);
            expect(networkManager.roomId).toBe('room-456');
        });
        
        it('should reject if not connected', async () => {
            networkManager.connected = false;
            
            await expect(networkManager.joinRoom('room-456')).rejects.toThrow('Not connected to server');
        });
    });
    
    describe('leaveRoom', () => {
        beforeEach(async () => {
            const connectPromise = networkManager.connect('http://localhost:3000');
            const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
            connectHandler();
            await connectPromise;
            networkManager.roomId = 'room-123';
        });
        
        it('should emit leaveRoom event', async () => {
            mockSocket.emit.mockImplementation((event, data, callback) => {
                if (event === 'leaveRoom') {
                    callback({ success: true });
                }
            });
            
            await networkManager.leaveRoom();
            
            expect(mockSocket.emit).toHaveBeenCalledWith('leaveRoom', {}, expect.any(Function));
            expect(networkManager.roomId).toBeNull();
        });
        
        it('should reject if not in a room', async () => {
            networkManager.roomId = null;
            
            await expect(networkManager.leaveRoom()).rejects.toThrow('Not in a room');
        });
    });
    
    describe('sendInput', () => {
        beforeEach(async () => {
            const connectPromise = networkManager.connect('http://localhost:3000');
            const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
            connectHandler();
            await connectPromise;
            networkManager.roomId = 'room-123';
        });
        
        it('should emit input event with direction and timestamp', () => {
            const timestamp = Date.now();
            networkManager.sendInput('up', timestamp);
            
            expect(mockSocket.emit).toHaveBeenCalledWith('input', {
                direction: 'up',
                timestamp,
                sequenceId: 1
            });
        });
        
        it('should generate sequential sequence IDs', () => {
            networkManager.sendInput('up');
            networkManager.sendInput('right');
            networkManager.sendInput('down');
            
            expect(mockSocket.emit).toHaveBeenNthCalledWith(1, 'input', expect.objectContaining({ sequenceId: 1 }));
            expect(mockSocket.emit).toHaveBeenNthCalledWith(2, 'input', expect.objectContaining({ sequenceId: 2 }));
            expect(mockSocket.emit).toHaveBeenNthCalledWith(3, 'input', expect.objectContaining({ sequenceId: 3 }));
        });
        
        it('should not send if not connected', () => {
            networkManager.connected = false;
            networkManager.sendInput('up');
            
            expect(mockSocket.emit).not.toHaveBeenCalled();
        });
    });
    
    describe('sendChatMessage', () => {
        beforeEach(async () => {
            const connectPromise = networkManager.connect('http://localhost:3000');
            const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
            connectHandler();
            await connectPromise;
            networkManager.roomId = 'room-123';
        });
        
        it('should emit chat event with message', () => {
            networkManager.sendChatMessage('Hello world');
            
            expect(mockSocket.emit).toHaveBeenCalledWith('chat', {
                message: 'Hello world',
                timestamp: expect.any(Number)
            });
        });
    });
    
    describe('sendReadyStatus', () => {
        beforeEach(async () => {
            const connectPromise = networkManager.connect('http://localhost:3000');
            const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
            connectHandler();
            await connectPromise;
            networkManager.roomId = 'room-123';
        });
        
        it('should emit ready event with status', () => {
            networkManager.sendReadyStatus(true);
            
            expect(mockSocket.emit).toHaveBeenCalledWith('ready', { isReady: true });
        });
    });
    
    describe('getRoomList', () => {
        beforeEach(async () => {
            const connectPromise = networkManager.connect('http://localhost:3000');
            const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
            connectHandler();
            await connectPromise;
        });
        
        it('should request and return room list', async () => {
            const mockRooms = [
                { id: 'room-1', players: 2, maxPlayers: 4 },
                { id: 'room-2', players: 1, maxPlayers: 2 }
            ];
            
            mockSocket.emit.mockImplementation((event, data, callback) => {
                if (event === 'getRoomList') {
                    callback({ success: true, rooms: mockRooms });
                }
            });
            
            const rooms = await networkManager.getRoomList();
            
            expect(rooms).toEqual(mockRooms);
        });
    });
    
    describe('event system', () => {
        it('should register event handlers', () => {
            const callback = jest.fn();
            networkManager.on('stateUpdate', callback);
            
            expect(networkManager.eventHandlers.stateUpdate).toContain(callback);
        });
        
        it('should unregister event handlers', () => {
            const callback = jest.fn();
            networkManager.on('stateUpdate', callback);
            networkManager.off('stateUpdate', callback);
            
            expect(networkManager.eventHandlers.stateUpdate).not.toContain(callback);
        });
        
        it('should trigger event handlers', () => {
            const callback = jest.fn();
            networkManager.on('stateUpdate', callback);
            
            const testData = { test: 'data' };
            networkManager.triggerEvent('stateUpdate', testData);
            
            expect(callback).toHaveBeenCalledWith(testData);
        });
        
        it('should handle errors in event handlers gracefully', () => {
            const errorCallback = jest.fn(() => { throw new Error('Handler error'); });
            const goodCallback = jest.fn();
            
            networkManager.on('stateUpdate', errorCallback);
            networkManager.on('stateUpdate', goodCallback);
            
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            networkManager.triggerEvent('stateUpdate', {});
            
            expect(errorCallback).toHaveBeenCalled();
            expect(goodCallback).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });
    });
    
    describe('convenience event methods', () => {
        it('should provide convenience methods for event registration', () => {
            const callback = jest.fn();
            
            networkManager.onStateUpdate(callback);
            networkManager.onPlayerJoined(callback);
            networkManager.onGameStart(callback);
            
            expect(networkManager.eventHandlers.stateUpdate).toContain(callback);
            expect(networkManager.eventHandlers.playerJoined).toContain(callback);
            expect(networkManager.eventHandlers.gameStart).toContain(callback);
        });
    });
    
    describe('ping monitoring', () => {
        beforeEach(async () => {
            jest.useFakeTimers();
            const connectPromise = networkManager.connect('http://localhost:3000');
            const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
            connectHandler();
            await connectPromise;
        });
        
        afterEach(() => {
            jest.useRealTimers();
        });
        
        it('should start ping monitoring on connection', () => {
            expect(networkManager.pingInterval).not.toBeNull();
        });
        
        it('should send ping messages periodically', () => {
            mockSocket.emit.mockClear();
            
            jest.advanceTimersByTime(1000);
            expect(mockSocket.emit).toHaveBeenCalledWith('ping', expect.any(Number));
            
            jest.advanceTimersByTime(1000);
            expect(mockSocket.emit).toHaveBeenCalledTimes(2);
        });
        
        it('should calculate ping from pong response', async () => {
            const pongHandler = mockSocket.on.mock.calls.find(call => call[0] === 'pong')[1];
            const timestamp = Date.now() - 50;
            
            pongHandler(timestamp);
            
            expect(networkManager.getPing()).toBeGreaterThanOrEqual(50);
        });
        
        it('should stop ping monitoring on disconnect', () => {
            networkManager.disconnect();
            expect(networkManager.pingInterval).toBeNull();
        });
    });
    
    describe('getters', () => {
        it('should return connection state', () => {
            expect(networkManager.getConnectionState()).toBe('disconnected');
        });
        
        it('should return ping', () => {
            networkManager.ping = 42;
            expect(networkManager.getPing()).toBe(42);
        });
        
        it('should return connected status', () => {
            expect(networkManager.isConnected()).toBe(false);
            networkManager.connected = true;
            expect(networkManager.isConnected()).toBe(true);
        });
        
        it('should return room ID', () => {
            expect(networkManager.getRoomId()).toBeNull();
            networkManager.roomId = 'room-123';
            expect(networkManager.getRoomId()).toBe('room-123');
        });
        
        it('should return player ID', () => {
            expect(networkManager.getPlayerId()).toBeNull();
            networkManager.playerId = 'player-123';
            expect(networkManager.getPlayerId()).toBe('player-123');
        });
    });
    
    describe('game event handlers', () => {
        beforeEach(async () => {
            const connectPromise = networkManager.connect('http://localhost:3000');
            const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
            connectHandler();
            await connectPromise;
        });
        
        it('should handle gameState events', () => {
            const callback = jest.fn();
            networkManager.onStateUpdate(callback);
            
            const gameStateHandler = mockSocket.on.mock.calls.find(call => call[0] === 'gameState')[1];
            const stateData = { players: [], timestamp: Date.now() };
            gameStateHandler(stateData);
            
            expect(callback).toHaveBeenCalledWith(stateData);
        });
        
        it('should handle roomUpdate events', () => {
            const callback = jest.fn();
            networkManager.onRoomUpdate(callback);
            
            const roomUpdateHandler = mockSocket.on.mock.calls.find(call => call[0] === 'roomUpdate')[1];
            const roomData = { roomId: 'room-123', players: [] };
            roomUpdateHandler(roomData);
            
            expect(callback).toHaveBeenCalledWith(roomData);
            expect(networkManager.roomId).toBe('room-123');
        });
        
        it('should handle playerJoined events', () => {
            const callback = jest.fn();
            networkManager.onPlayerJoined(callback);
            
            const playerJoinedHandler = mockSocket.on.mock.calls.find(call => call[0] === 'playerJoined')[1];
            const playerData = { playerId: 'player-2', name: 'Player 2' };
            playerJoinedHandler(playerData);
            
            expect(callback).toHaveBeenCalledWith(playerData);
        });
        
        it('should handle gameStart events', () => {
            const callback = jest.fn();
            networkManager.onGameStart(callback);
            
            const gameStartHandler = mockSocket.on.mock.calls.find(call => call[0] === 'gameStart')[1];
            const startData = { countdown: 3 };
            gameStartHandler(startData);
            
            expect(callback).toHaveBeenCalledWith(startData);
        });
    });
});
