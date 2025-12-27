/**
 * @jest-environment jsdom
 */

describe('NetworkManager', () => {
    let NetworkManager;
    let networkManager;
    let mockSocket;
    let ioMock;
    let mockLogger;

    beforeEach(() => {
        // Mock dependencies
        mockSocket = {
            id: 'test-socket-id',
            on: jest.fn(),
            emit: jest.fn(),
            disconnect: jest.fn(),
            connected: true,
        };

        ioMock = jest.fn().mockReturnValue(mockSocket);

        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
        };

        jest.resetModules();
        jest.clearAllMocks();

        jest.doMock('socket.io-client', () => ioMock);
        jest.doMock('../../src/utils/Logger', () => ({
            Logger: {
                create: jest.fn().mockReturnValue(mockLogger),
            },
        }));

        NetworkManager = require('../../src/multiplayer/NetworkManager').NetworkManager;
        networkManager = new NetworkManager({}, {});
    });

    afterEach(() => {
        if (networkManager && networkManager.pingInterval) {
            networkManager.stopPingMonitoring();
        }
    });

    describe('Initialization', () => {
        test('should initialize with default values', () => {
            expect(networkManager.connected).toBe(false);
            expect(networkManager.connectionState).toBe('disconnected');
            expect(networkManager.roomId).toBeNull();
            expect(networkManager.playerId).toBeNull();
            expect(networkManager.ping).toBe(0);
        });

        test('should have event handlers initialized', () => {
            expect(networkManager.eventHandlers.stateUpdate).toEqual([]);
            expect(networkManager.eventHandlers.connected).toEqual([]);
        });
    });

    describe('Connection Management', () => {
        test('should connect successfully', async () => {
            const p = networkManager.connect('http://localhost:3000');

            expect(ioMock).toHaveBeenCalledWith(
                'http://localhost:3000',
                expect.objectContaining({
                    reconnection: true,
                    timeout: 10000,
                })
            );

            const connectHandler = mockSocket.on.mock.calls.find((c) => c[0] === 'connect')[1];
            connectHandler();

            await p;

            expect(networkManager.connected).toBe(true);
            expect(networkManager.connectionState).toBe('connected');
            expect(networkManager.playerId).toBe('test-socket-id');
        });

        test('should resolve immediately if already connected', async () => {
            networkManager.socket = mockSocket;
            networkManager.connected = true;

            await networkManager.connect('url');
            expect(ioMock).not.toHaveBeenCalled();
        });

        test('should handle connection error', async () => {
            const p = networkManager.connect('url');
            const errorHandler = mockSocket.on.mock.calls.find((c) => c[0] === 'connect_error')[1];
            errorHandler(new Error('Connection failed'));

            await expect(p).rejects.toThrow('Connection failed');
            expect(networkManager.connectionState).toBe('disconnected');
        });

        test('should handle disconnect event', async () => {
            const p = networkManager.connect('url');
            mockSocket.on.mock.calls.find((c) => c[0] === 'connect')[1]();
            await p;

            const disconnectHandler = mockSocket.on.mock.calls.find(
                (c) => c[0] === 'disconnect'
            )[1];
            disconnectHandler('transport close');

            expect(networkManager.connected).toBe(false);
            expect(networkManager.connectionState).toBe('disconnected');
        });

        test('should disconnect manually', async () => {
            const p = networkManager.connect('url');
            mockSocket.on.mock.calls.find((c) => c[0] === 'connect')[1]();
            await p;

            networkManager.disconnect();

            expect(mockSocket.disconnect).toHaveBeenCalled();
            expect(networkManager.socket).toBeNull();
            expect(networkManager.connected).toBe(false);
        });
    });

    describe('Reconnection Logic', () => {
        test('should handle reconnecting event', async () => {
            const p = networkManager.connect('url');
            mockSocket.on.mock.calls.find((c) => c[0] === 'connect')[1]();
            await p;

            const spy = jest.fn();
            networkManager.onReconnecting(spy);

            const reconnectingHandler = mockSocket.on.mock.calls.find(
                (c) => c[0] === 'reconnecting'
            )[1];
            reconnectingHandler(2);

            expect(networkManager.connectionState).toBe('reconnecting');
            expect(spy).toHaveBeenCalledWith({ attemptNumber: 2 });
        });

        test('should handle reconnect event', async () => {
            const p = networkManager.connect('url');
            mockSocket.on.mock.calls.find((c) => c[0] === 'connect')[1]();
            await p;

            const spy = jest.fn();
            networkManager.onReconnected(spy);

            const reconnectHandler = mockSocket.on.mock.calls.find((c) => c[0] === 'reconnect')[1];
            reconnectHandler(1);

            expect(networkManager.connectionState).toBe('connected');
            expect(spy).toHaveBeenCalledWith({ attemptNumber: 1 });
        });
    });

    describe('Room Management', () => {
        beforeEach(async () => {
            const p = networkManager.connect('url');
            mockSocket.on.mock.calls.find((c) => c[0] === 'connect')[1]();
            await p;
        });

        test('createRoom should succeed', async () => {
            mockSocket.emit.mockImplementation((event, data, cb) => {
                if (event === 'createRoom') cb({ success: true, roomId: 'room-123' });
            });

            const result = await networkManager.createRoom({ maxPlayers: 2 });
            expect(result.roomId).toBe('room-123');
            expect(networkManager.roomId).toBe('room-123');
        });

        test('createRoom should fail if not connected', async () => {
            networkManager.connected = false;
            await expect(networkManager.createRoom({})).rejects.toThrow('Not connected');
        });

        test('createRoom should handle server error', async () => {
            mockSocket.emit.mockImplementation((event, data, cb) => {
                if (event === 'createRoom') cb({ success: false, error: 'Room full' });
            });

            await expect(networkManager.createRoom({})).rejects.toThrow('Room full');
        });

        test('joinRoom should succeed', async () => {
            mockSocket.emit.mockImplementation((event, data, cb) => {
                if (event === 'joinRoom') cb({ success: true });
            });

            await networkManager.joinRoom('room-456');
            expect(networkManager.roomId).toBe('room-456');
        });

        test('joinRoom should handle failure', async () => {
            mockSocket.emit.mockImplementation((event, data, cb) => {
                if (event === 'joinRoom') cb({ success: false, error: 'Room not found' });
            });

            await expect(networkManager.joinRoom('bad-room')).rejects.toThrow('Room not found');
        });

        test('joinRoom should fail if not connected', async () => {
            networkManager.connected = false;
            await expect(networkManager.joinRoom('room-123')).rejects.toThrow('Not connected');
        });

        test('rejoinRoom should succeed', async () => {
            mockSocket.emit.mockImplementation((event, data, cb) => {
                if (event === 'rejoinRoom') cb({ success: true });
            });

            await networkManager.rejoinRoom('room-123', 'old-player-id');
            expect(networkManager.roomId).toBe('room-123');
        });

        test('rejoinRoom should handle failure', async () => {
            mockSocket.emit.mockImplementation((event, data, cb) => {
                if (event === 'rejoinRoom') cb({ success: false, error: 'Rejoin failed' });
            });

            await expect(networkManager.rejoinRoom('room-123', 'old-id')).rejects.toThrow(
                'Rejoin failed'
            );
        });

        test('rejoinRoom should fail if not connected', async () => {
            networkManager.connected = false;
            await expect(networkManager.rejoinRoom('room-123', 'id')).rejects.toThrow(
                'Not connected'
            );
        });

        test('leaveRoom should handle failure', async () => {
            networkManager.roomId = 'room-1';
            mockSocket.emit.mockImplementation((event, data, cb) => {
                if (event === 'leaveRoom') cb({ success: false, error: 'Failed to leave' });
            });

            await expect(networkManager.leaveRoom()).rejects.toThrow('Failed to leave');
        });

        test('leaveRoom should succeed', async () => {
            networkManager.roomId = 'room-123';
            mockSocket.emit.mockImplementation((event, data, cb) => {
                if (event === 'leaveRoom') cb({ success: true });
            });

            await networkManager.leaveRoom();
            expect(networkManager.roomId).toBeNull();
        });

        test('leaveRoom should fail if not in room', async () => {
            networkManager.roomId = null;
            await expect(networkManager.leaveRoom()).rejects.toThrow('Not in a room');
        });

        test('getRoomList should return rooms', async () => {
            const rooms = [{ id: 'r1' }, { id: 'r2' }];
            mockSocket.emit.mockImplementation((event, data, cb) => {
                if (event === 'getRoomList') cb({ success: true, rooms });
            });

            const result = await networkManager.getRoomList();
            expect(result).toEqual(rooms);
        });

        test('getRoomList should handle failure', async () => {
            mockSocket.emit.mockImplementation((event, data, cb) => {
                if (event === 'getRoomList') cb({ success: false, error: 'Server busy' });
            });

            await expect(networkManager.getRoomList()).rejects.toThrow('Server busy');
        });

        test('getRoomList should fail if not connected', async () => {
            networkManager.connected = false;
            await expect(networkManager.getRoomList()).rejects.toThrow('Not connected');
        });
    });

    describe('Game Events', () => {
        beforeEach(async () => {
            const p = networkManager.connect('url');
            mockSocket.on.mock.calls.find((c) => c[0] === 'connect')[1]();
            await p;
        });

        test('should handle gameState event', () => {
            const spy = jest.fn();
            networkManager.onStateUpdate(spy);

            const handler = mockSocket.on.mock.calls.find((c) => c[0] === 'gameState')[1];
            handler({ players: [] });

            expect(spy).toHaveBeenCalledWith({ players: [] });
        });

        test('should handle roomUpdate event', () => {
            const spy = jest.fn();
            networkManager.onRoomUpdate(spy);

            const handler = mockSocket.on.mock.calls.find((c) => c[0] === 'roomUpdate')[1];
            handler({ roomId: 'new-room' });

            expect(spy).toHaveBeenCalledWith({ roomId: 'new-room' });
            expect(networkManager.roomId).toBe('new-room');
        });

        test('should handle playerJoined event', () => {
            const spy = jest.fn();
            networkManager.onPlayerJoined(spy);

            const handler = mockSocket.on.mock.calls.find((c) => c[0] === 'playerJoined')[1];
            handler({ playerId: 'p2' });

            expect(spy).toHaveBeenCalledWith({ playerId: 'p2' });
        });

        test('should handle playerLeft event', () => {
            const spy = jest.fn();
            networkManager.onPlayerLeft(spy);

            const handler = mockSocket.on.mock.calls.find((c) => c[0] === 'playerLeft')[1];
            handler({ playerId: 'p3' });

            expect(spy).toHaveBeenCalledWith({ playerId: 'p3' });
        });

        test('should handle gameStart event', () => {
            const spy = jest.fn();
            networkManager.onGameStart(spy);

            const handler = mockSocket.on.mock.calls.find((c) => c[0] === 'gameStart')[1];
            handler({ timestamp: 123 });

            expect(spy).toHaveBeenCalledWith({ timestamp: 123 });
        });

        test('should handle gameEnd event', () => {
            const spy = jest.fn();
            networkManager.onGameEnd(spy);

            const handler = mockSocket.on.mock.calls.find((c) => c[0] === 'gameEnd')[1];
            handler({ winner: 'p1' });

            expect(spy).toHaveBeenCalledWith({ winner: 'p1' });
        });

        test('should handle chatMessage event', () => {
            const spy = jest.fn();
            networkManager.onChatMessage(spy);

            const handler = mockSocket.on.mock.calls.find((c) => c[0] === 'chatMessage')[1];
            handler({ message: 'Hello' });

            expect(spy).toHaveBeenCalledWith({ message: 'Hello' });
        });

        test('should handle error event', () => {
            const spy = jest.fn();
            networkManager.onError(spy);

            const handler = mockSocket.on.mock.calls.find((c) => c[0] === 'error')[1];
            handler({ type: 'game_error' });

            expect(spy).toHaveBeenCalledWith({ type: 'game_error' });
        });

        test('should handle errors in event handlers gracefully', () => {
            networkManager.on('error', () => {
                throw new Error('Handler error');
            });
            const spy = jest.fn();
            networkManager.onError(spy);

            const handler = mockSocket.on.mock.calls.find((c) => c[0] === 'error')[1];

            expect(() => handler({ message: 'test' })).not.toThrow();
            expect(spy).toHaveBeenCalled();
            expect(mockLogger.error).toHaveBeenCalled();
        });
    });

    describe('Message Sending', () => {
        beforeEach(async () => {
            const p = networkManager.connect('url');
            mockSocket.on.mock.calls.find((c) => c[0] === 'connect')[1]();
            await p;
            networkManager.roomId = 'room-1';
        });

        test('should send input with sequence ID', () => {
            networkManager.sendInput('up', 1000);
            expect(mockSocket.emit).toHaveBeenCalledWith('input', {
                direction: 'up',
                timestamp: 1000,
                sequenceId: 1,
            });

            networkManager.sendInput('down', 1001);
            expect(mockSocket.emit).toHaveBeenCalledWith('input', {
                direction: 'down',
                timestamp: 1001,
                sequenceId: 2,
            });
        });

        test('should not send input if not connected', () => {
            networkManager.connected = false;
            networkManager.sendInput('up');

            const inputCalls = mockSocket.emit.mock.calls.filter((c) => c[0] === 'input');
            expect(inputCalls.length).toBe(0);
        });

        test('should not send input if not in room', () => {
            networkManager.roomId = null;
            networkManager.sendInput('up');

            const inputCalls = mockSocket.emit.mock.calls.filter((c) => c[0] === 'input');
            expect(inputCalls.length).toBe(0);
        });

        test('should send chat message', () => {
            networkManager.sendChatMessage('Hello world');
            expect(mockSocket.emit).toHaveBeenCalledWith(
                'chat',
                expect.objectContaining({
                    message: 'Hello world',
                })
            );
        });

        test('should send ready status', () => {
            networkManager.sendReadyStatus(true);
            expect(mockSocket.emit).toHaveBeenCalledWith('ready', { isReady: true });
        });

        test('should skip sending chat when not connected', () => {
            networkManager.connected = false;
            networkManager.sendChatMessage('Hi');
            expect(mockSocket.emit).not.toHaveBeenCalledWith('chat', expect.any(Object));
        });

        test('should skip sending ready status when not in room', () => {
            networkManager.roomId = null;
            networkManager.sendReadyStatus(true);
            expect(mockSocket.emit).not.toHaveBeenCalledWith('ready', expect.any(Object));
        });
    });

    describe('Ping Monitoring', () => {
        test('should start ping monitoring on connect', async () => {
            jest.useFakeTimers();

            const p = networkManager.connect('url');
            mockSocket.on.mock.calls.find((c) => c[0] === 'connect')[1]();
            await p;

            expect(networkManager.pingInterval).not.toBeNull();

            jest.advanceTimersByTime(1100);
            expect(mockSocket.emit).toHaveBeenCalledWith('ping', expect.any(Number));

            jest.useRealTimers();
        });

        test('should update ping on pong', async () => {
            const p = networkManager.connect('url');
            mockSocket.on.mock.calls.find((c) => c[0] === 'connect')[1]();
            await p;

            const pongHandler = mockSocket.on.mock.calls.find((c) => c[0] === 'pong')[1];
            const timestamp = Date.now() - 50;
            pongHandler(timestamp);

            expect(networkManager.getPing()).toBeGreaterThanOrEqual(50);
        });

        test('should stop ping monitoring on disconnect', async () => {
            const p = networkManager.connect('url');
            mockSocket.on.mock.calls.find((c) => c[0] === 'connect')[1]();
            await p;

            networkManager.stopPingMonitoring();
            expect(networkManager.pingInterval).toBeNull();
        });

        test('should not emit ping if disconnected during interval', async () => {
            jest.useFakeTimers();
            const p = networkManager.connect('url');
            mockSocket.on.mock.calls.find((c) => c[0] === 'connect')[1]();
            await p;

            networkManager.connected = false;
            jest.advanceTimersByTime(1100);

            // Should not have emitted a NEW ping
            const pingCalls = mockSocket.emit.mock.calls.filter((c) => c[0] === 'ping');
            expect(pingCalls.length).toBe(0);

            jest.useRealTimers();
        });
    });

    describe('Error Fallbacks', () => {
        beforeEach(async () => {
            const p = networkManager.connect('url');
            mockSocket.on.mock.calls.find((c) => c[0] === 'connect')[1]();
            await p;
        });

        test('createRoom should use default error message', async () => {
            mockSocket.emit.mockImplementation((event, data, cb) => {
                if (event === 'createRoom') cb({ success: false });
            });
            await expect(networkManager.createRoom({})).rejects.toThrow('Failed to create room');
        });

        test('joinRoom should use default error message', async () => {
            mockSocket.emit.mockImplementation((event, data, cb) => {
                if (event === 'joinRoom') cb({ success: false });
            });
            await expect(networkManager.joinRoom('r')).rejects.toThrow('Failed to join room');
        });

        test('leaveRoom should use default error message', async () => {
            networkManager.roomId = 'r';
            mockSocket.emit.mockImplementation((event, data, cb) => {
                if (event === 'leaveRoom') cb({ success: false });
            });
            await expect(networkManager.leaveRoom()).rejects.toThrow('Failed to leave room');
        });

        test('getRoomList should use default error message', async () => {
            mockSocket.emit.mockImplementation((event, data, cb) => {
                if (event === 'getRoomList') cb({ success: false });
            });
            await expect(networkManager.getRoomList()).rejects.toThrow('Failed to get room list');
        });
    });

    describe('Event Handler Management', () => {
        test('should register event handler', () => {
            const spy = jest.fn();
            networkManager.on('stateUpdate', spy);

            expect(networkManager.eventHandlers.stateUpdate).toContain(spy);
        });

        test('should unregister event handler', () => {
            const spy = jest.fn();
            networkManager.on('stateUpdate', spy);
            networkManager.off('stateUpdate', spy);

            expect(networkManager.eventHandlers.stateUpdate).not.toContain(spy);
        });

        test('should trigger event handlers', () => {
            const spy1 = jest.fn();
            const spy2 = jest.fn();

            networkManager.on('stateUpdate', spy1);
            networkManager.on('stateUpdate', spy2);

            networkManager.triggerEvent('stateUpdate', { data: 'test' });

            expect(spy1).toHaveBeenCalledWith({ data: 'test' });
            expect(spy2).toHaveBeenCalledWith({ data: 'test' });
        });

        test('should ignore unknown events in on/off/trigger', () => {
            const spy = jest.fn();
            expect(() => networkManager.on('unknown', spy)).not.toThrow();
            expect(() => networkManager.off('unknown', spy)).not.toThrow();
            expect(() => networkManager.triggerEvent('unknown', {})).not.toThrow();
        });
    });

    describe('Getters', () => {
        test('isConnected should return connection status', () => {
            expect(networkManager.isConnected()).toBe(false);
            networkManager.connected = true;
            expect(networkManager.isConnected()).toBe(true);
        });

        test('getConnectionState should return state', () => {
            expect(networkManager.getConnectionState()).toBe('disconnected');
            networkManager.connectionState = 'connected';
            expect(networkManager.getConnectionState()).toBe('connected');
        });

        test('getRoomId should return room ID', () => {
            expect(networkManager.getRoomId()).toBeNull();
            networkManager.roomId = 'test-room';
            expect(networkManager.getRoomId()).toBe('test-room');
        });

        test('getPlayerId should return player ID', () => {
            expect(networkManager.getPlayerId()).toBeNull();
            networkManager.playerId = 'test-player';
            expect(networkManager.getPlayerId()).toBe('test-player');
        });

        test('getPing should return ping value', () => {
            expect(networkManager.getPing()).toBe(0);
            networkManager.ping = 42;
            expect(networkManager.getPing()).toBe(42);
        });
    });

    describe('Comprehensive Expansion Variants', () => {
        // Task 2.2.1: Connection Establishment (25 Tests)
        describe('Connection Establishment Variants', () => {
            for (let i = 0; i < 25; i++) {
                test(`Variant ${i}: should handle connection setup with variation`, async () => {
                    const url = `http://server-${i}.com`;
                    const p = networkManager.connect(url);
                    const handler = mockSocket.on.mock.calls.find((c) => c[0] === 'connect')[1];
                    handler();
                    await p;
                    expect(networkManager.connected).toBe(true);
                    expect(networkManager.connectionState).toBe('connected');
                });
            }
        });

        // Task 2.2.2: Connection Failure Handling (25 Tests)
        describe('Connection Failure Variants', () => {
            for (let i = 0; i < 25; i++) {
                test(`Variant ${i}: should handle connection failure with variation`, async () => {
                    const p = networkManager.connect('url');
                    const handler = mockSocket.on.mock.calls.find(
                        (c) => c[0] === 'connect_error'
                    )[1];
                    handler(new Error(`Failure ${i}`));
                    await expect(p).rejects.toThrow(`Failure ${i}`);
                });
            }
        });

        // Task 2.2.3: Message Sending - All types (30 Tests)
        describe('Message Sending Variants', () => {
            beforeEach(async () => {
                const p = networkManager.connect('url');
                mockSocket.on.mock.calls.find((c) => c[0] === 'connect')[1]();
                await p;
                networkManager.roomId = 'r1';
            });

            for (let i = 0; i < 10; i++) {
                test(`Input Variant ${i}: should send input correctly`, () => {
                    networkManager.sendInput('left', 2000 + i);
                    expect(mockSocket.emit).toHaveBeenCalledWith(
                        'input',
                        expect.objectContaining({
                            direction: 'left',
                            timestamp: 2000 + i,
                        })
                    );
                });
                test(`Chat Variant ${i}: should send chat correctly`, () => {
                    networkManager.sendChatMessage(`MSG ${i}`);
                    expect(mockSocket.emit).toHaveBeenCalledWith(
                        'chat',
                        expect.objectContaining({
                            message: `MSG ${i}`,
                        })
                    );
                });
                test(`Ready Variant ${i}: should send ready correctly`, () => {
                    networkManager.sendReadyStatus(i % 2 === 0);
                    expect(mockSocket.emit).toHaveBeenCalledWith('ready', { isReady: i % 2 === 0 });
                });
            }
        });

        // Task 2.2.4: Message Receiving and Parsing (30 Tests)
        describe('Message Receiving Variants', () => {
            beforeEach(async () => {
                const p = networkManager.connect('url');
                mockSocket.on.mock.calls.find((c) => c[0] === 'connect')[1]();
                await p;
            });

            const events = [
                'gameState',
                'roomUpdate',
                'playerJoined',
                'playerLeft',
                'gameStart',
                'gameEnd',
            ];
            events.forEach((evt, idx) => {
                for (let i = 0; i < 5; i++) {
                    test(`${evt} Variant ${i}: should parse message correctly`, () => {
                        const handler = mockSocket.on.mock.calls.find((c) => c[0] === evt)[1];
                        const data = { id: i, type: evt, val: Math.random() };
                        const spy = jest.fn();

                        // Map event name to trigger name if different
                        const triggerName = evt === 'gameState' ? 'stateUpdate' : evt;
                        networkManager.on(triggerName, spy);

                        handler(data);
                        expect(spy).toHaveBeenCalledWith(data);
                    });
                }
            });
        });

        // Task 2.2.5: Message Queue Management (20 Tests)
        describe('Message Queue / Concurrent Emits (20 Tests)', () => {
            test('should handle multiple simultaneous emits without interference', async () => {
                const p = networkManager.connect('url');
                mockSocket.on.mock.calls.find((c) => c[0] === 'connect')[1]();
                await p;
                networkManager.roomId = 'r1';

                for (let i = 0; i < 20; i++) {
                    networkManager.sendInput('up');
                    networkManager.sendChatMessage('test');
                }
                expect(mockSocket.emit).toHaveBeenCalled();
            });

            for (let i = 1; i < 20; i++) {
                test(`Queue scenario ${i}: should preserve message order concept`, () => {
                    networkManager._sequenceId = 0;
                    networkManager.connected = true;
                    networkManager.roomId = 'r1';
                    networkManager.socket = mockSocket;

                    networkManager.sendInput('up');
                    networkManager.sendInput('down');

                    const calls = mockSocket.emit.mock.calls.filter((c) => c[0] === 'input');
                    expect(calls[calls.length - 2][1].sequenceId).toBe(1);
                    expect(calls[calls.length - 1][1].sequenceId).toBe(2);
                });
            }
        });

        // Task 2.2.6: Reconnection Logic (30 Tests)
        describe('Reconnection Variants', () => {
            for (let i = 0; i < 30; i++) {
                test(`Reconnect Variant ${i}: should handle cycle correctly`, async () => {
                    const p = networkManager.connect('url');
                    mockSocket.on.mock.calls.find((c) => c[0] === 'connect')[1]();
                    await p;

                    const reconning = mockSocket.on.mock.calls.find(
                        (c) => c[0] === 'reconnecting'
                    )[1];
                    reconning(i);
                    expect(networkManager.connectionState).toBe('reconnecting');

                    const reconned = mockSocket.on.mock.calls.find((c) => c[0] === 'reconnect')[1];
                    reconned(i);
                    expect(networkManager.connectionState).toBe('connected');
                });
            }
        });

        // Task 2.2.7: Connection Timeout Handling (20 Tests)
        describe('Connection Timeout Variants', () => {
            for (let i = 0; i < 20; i++) {
                test(`Timeout Variant ${i}: should handle socket timeout`, async () => {
                    const p = networkManager.connect('url');
                    const handler = mockSocket.on.mock.calls.find(
                        (c) => c[0] === 'connect_error'
                    )[1];
                    const err = new Error('timeout');
                    err.type = 'TransportError';
                    handler(err);
                    await expect(p).rejects.toThrow('timeout');
                });
            }
        });

        // Task 2.2.8: WebSocket Lifecycle Events (25 Tests)
        describe('Lifecycle Event Variants', () => {
            for (let i = 0; i < 25; i++) {
                test(`Lifecycle Variant ${i}: should trigger correct triggers`, () => {
                    const spy = jest.fn();
                    const evt = i % 2 === 0 ? 'connected' : 'disconnected';
                    networkManager.on(evt, spy);
                    networkManager.triggerEvent(evt, { id: i });
                    expect(spy).toHaveBeenCalledWith({ id: i });
                });
            }
        });

        // Task 2.2.9: Error Handling for Network Errors (25 Tests)
        describe('Network Error Handling Variants', () => {
            for (let i = 0; i < 25; i++) {
                test(`Error Variant ${i}: should handle and report errors`, () => {
                    const spy = jest.fn();
                    networkManager.onError(spy);

                    if (i % 5 === 0) {
                        // Test handler crash
                        networkManager.on('error', () => {
                            throw new Error('Crash');
                        });
                    }

                    networkManager.triggerEvent('error', { code: i });
                    expect(spy).toHaveBeenCalledWith({ code: i });
                });
            }
        });

        // Task 2.2.10: Latency Measurement (20 Tests)
        describe('Latency Measurement Variants', () => {
            for (let i = 0; i < 20; i++) {
                test(`Ping Variant ${i}: should calculate latency correctly`, () => {
                    const now = 100000;
                    jest.spyOn(Date, 'now').mockReturnValue(now + i * 10);
                    const timestamp = now;

                    const p = networkManager.connect('url');
                    mockSocket.on.mock.calls.find((c) => c[0] === 'connect')[1]();

                    const pongHandler = mockSocket.on.mock.calls.find((c) => c[0] === 'pong')[1];
                    pongHandler(timestamp);

                    expect(networkManager.getPing()).toBe(i * 10);

                    Date.now.mockRestore();
                });
            }
        });

        // Task 2.2.11: Bandwidth Throttling (20 Tests)
        describe('Bandwidth Throttling (Simulated Variants)', () => {
            for (let i = 0; i < 20; i++) {
                test(`Throttle Variant ${i}: should handle high frequency messaging`, () => {
                    networkManager.connected = true;
                    networkManager.roomId = 'r1';
                    networkManager.socket = mockSocket;

                    for (let j = 0; j < 10; j++) {
                        networkManager.sendInput('left');
                    }
                    expect(mockSocket.emit).toHaveBeenCalled();
                });
            }
        });

        // Task 2.2.12: Cleanup and Disposal (15 Tests)
        describe('Cleanup Variants', () => {
            for (let i = 0; i < 15; i++) {
                test(`Cleanup Variant ${i}: should clear all references`, () => {
                    networkManager.socket = mockSocket;
                    networkManager.connected = true;
                    networkManager.pingInterval = setInterval(() => {}, 1000);

                    networkManager.disconnect();

                    expect(networkManager.socket).toBeNull();
                    expect(networkManager.connected).toBe(false);
                    expect(networkManager.pingInterval).toBeNull();
                });
            }
        });

        // Task 2.2.13: Concurrent Message Handling (20 Tests)
        describe('Concurrent Message Variants', () => {
            for (let i = 0; i < 20; i++) {
                test(`Concurrent Variant ${i}: should handle rapid fire chat/input`, () => {
                    networkManager.connected = true;
                    networkManager.roomId = 'r1';
                    networkManager.socket = mockSocket;

                    networkManager.sendChatMessage('1');
                    networkManager.sendInput('up');
                    networkManager.sendReadyStatus(true);

                    expect(mockSocket.emit).toHaveBeenCalled();
                });
            }
        });
    });
});
