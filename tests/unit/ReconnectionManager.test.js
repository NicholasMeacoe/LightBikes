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

const { ReconnectionManager } = require('@/multiplayer/ReconnectionManager.js');

describe('ReconnectionManager', () => {
    let reconnectionManager;
    let mockNetworkManager;

    beforeEach(() => {
        // Create mock network manager
        mockNetworkManager = {
            eventHandlers: {},
            on: jest.fn((event, callback) => {
                mockNetworkManager.eventHandlers[event] = callback;
            }),
            off: jest.fn(),
            isConnected: jest.fn(() => false),
            getRoomId: jest.fn(() => 'test-room'),
            getPlayerId: jest.fn(() => 'player-123'),
            getPing: jest.fn(() => 50),
            disconnect: jest.fn(),
            rejoinRoom: jest.fn(),
        };

        reconnectionManager = new ReconnectionManager(mockNetworkManager);
        reconnectionManager.initialize();
    });

    afterEach(() => {
        reconnectionManager.destroy();
        jest.clearAllTimers();
    });

    describe('initialization', () => {
        it('should initialize with default state', () => {
            expect(reconnectionManager.isReconnecting).toBe(false);
            expect(reconnectionManager.reconnectAttempts).toBe(0);
            expect(reconnectionManager.connectionQuality).toBe('good');
        });

        it('should register network manager event handlers', () => {
            expect(mockNetworkManager.on).toHaveBeenCalledWith(
                'disconnected',
                expect.any(Function)
            );
            expect(mockNetworkManager.on).toHaveBeenCalledWith(
                'reconnecting',
                expect.any(Function)
            );
            expect(mockNetworkManager.on).toHaveBeenCalledWith('reconnected', expect.any(Function));
        });
    });

    describe('handleDisconnect', () => {
        it('should preserve state on disconnect', () => {
            mockNetworkManager.getRoomId.mockReturnValue('room-123');
            mockNetworkManager.getPlayerId.mockReturnValue('player-456');

            reconnectionManager.handleDisconnect({ reason: 'transport close' });

            expect(reconnectionManager.preservedState.roomId).toBe('room-123');
            expect(reconnectionManager.preservedState.playerId).toBe('player-456');
            expect(reconnectionManager.preservedState.wasInGame).toBe(true);
        });

        it('should not start reconnection on manual disconnect', () => {
            jest.useFakeTimers();

            reconnectionManager.handleDisconnect({ reason: 'io client disconnect' });

            expect(reconnectionManager.isReconnecting).toBe(false);

            jest.runAllTimers();
            jest.useRealTimers();
        });
    });

    describe('exponential backoff', () => {
        it('should calculate correct backoff delays', () => {
            const delay1 = reconnectionManager.calculateBackoffDelay(1);
            const delay2 = reconnectionManager.calculateBackoffDelay(2);
            const delay3 = reconnectionManager.calculateBackoffDelay(3);

            // Should roughly double each time (with jitter)
            expect(delay2).toBeGreaterThan(delay1 * 1.5);
            expect(delay3).toBeGreaterThan(delay2 * 1.5);
        });

        it('should cap delay at maxDelay', () => {
            const delay = reconnectionManager.calculateBackoffDelay(20);

            expect(delay).toBeLessThanOrEqual(reconnectionManager.maxDelay);
        });
    });

    describe('reconnection attempts', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should trigger reconnect attempt events', () => {
            const callback = jest.fn();
            reconnectionManager.on('reconnectAttempt', callback);

            reconnectionManager.handleReconnecting({ attemptNumber: 1 });

            expect(callback).toHaveBeenCalledWith(
                expect.objectContaining({
                    attemptNumber: 1,
                    maxAttempts: 10,
                })
            );
        });

        it('should abandon after max attempts', () => {
            const callback = jest.fn();
            reconnectionManager.on('reconnectAbandoned', callback);

            reconnectionManager.reconnectAttempts = 10;
            reconnectionManager.attemptReconnect();

            expect(callback).toHaveBeenCalled();
            expect(reconnectionManager.isReconnecting).toBe(false);
        });
    });

    describe('state restoration', () => {
        it('should attempt to rejoin room on reconnect', async () => {
            mockNetworkManager.rejoinRoom.mockResolvedValue({
                success: true,
                gameState: { test: 'state' },
            });

            reconnectionManager.preservedState = {
                roomId: 'room-123',
                playerId: 'player-456',
                wasInGame: true,
                timestamp: Date.now(),
            };
            reconnectionManager.disconnectTime = Date.now();

            await reconnectionManager.restoreState();

            expect(mockNetworkManager.rejoinRoom).toHaveBeenCalledWith('room-123', 'player-456');
        });

        it('should not rejoin if disconnected too long', async () => {
            reconnectionManager.preservedState = {
                roomId: 'room-123',
                playerId: 'player-456',
                wasInGame: true,
                timestamp: Date.now() - 40000, // 40 seconds ago
            };
            reconnectionManager.disconnectTime = Date.now() - 40000;

            await reconnectionManager.restoreState();

            expect(mockNetworkManager.rejoinRoom).not.toHaveBeenCalled();
        });
    });

    describe('connection quality', () => {
        it('should assess connection quality based on ping', () => {
            const quality1 = reconnectionManager.assessConnectionQuality(30, 0);
            expect(quality1).toBe('good');

            const quality2 = reconnectionManager.assessConnectionQuality(80, 2);
            expect(quality2).toBe('fair');

            const quality3 = reconnectionManager.assessConnectionQuality(150, 5);
            expect(quality3).toBe('poor');

            const quality4 = reconnectionManager.assessConnectionQuality(300, 15);
            expect(quality4).toBe('critical');
        });

        it('should trigger quality changed event', () => {
            const callback = jest.fn();
            reconnectionManager.on('connectionQualityChanged', callback);

            reconnectionManager.updateConnectionQuality('poor');

            expect(callback).toHaveBeenCalledWith(
                expect.objectContaining({
                    previousQuality: 'good',
                    currentQuality: 'poor',
                })
            );
        });
    });

    describe('force reconnect', () => {
        it('should disconnect and start reconnection', () => {
            reconnectionManager.forceReconnect();

            expect(mockNetworkManager.disconnect).toHaveBeenCalled();
        });
    });

    describe('cancel reconnection', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should cancel ongoing reconnection', () => {
            reconnectionManager.isReconnecting = true;
            reconnectionManager.reconnectTimeout = setTimeout(() => {}, 1000);

            reconnectionManager.cancelReconnection();

            expect(reconnectionManager.isReconnecting).toBe(false);
            expect(reconnectionManager.reconnectTimeout).toBeNull();
        });
    });

    describe('getStatus', () => {
        it('should return current status', () => {
            reconnectionManager.isReconnecting = true;
            reconnectionManager.reconnectAttempts = 3;
            reconnectionManager.connectionQuality = 'fair';

            const status = reconnectionManager.getStatus();

            expect(status.isReconnecting).toBe(true);
            expect(status.reconnectAttempts).toBe(3);
            expect(status.connectionQuality).toBe('fair');
        });
    });
});
