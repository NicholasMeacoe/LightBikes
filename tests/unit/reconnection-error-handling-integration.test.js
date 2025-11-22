/**
 * Integration tests for reconnection and error handling systems
 * Tests the interaction between ReconnectionManager and NetworkErrorHandler
 */

const { ReconnectionManager } = require('@/multiplayer/ReconnectionManager.js');
const { NetworkErrorHandler } = require('@/multiplayer/NetworkErrorHandler.js');

describe('Reconnection and Error Handling Integration', () => {
    let reconnectionManager;
    let errorHandler;
    let mockNetworkManager;
    
    beforeEach(() => {
        // Create mock network manager
        mockNetworkManager = {
            eventHandlers: {},
            on: jest.fn((event, callback) => {
                if (!mockNetworkManager.eventHandlers[event]) {
                    mockNetworkManager.eventHandlers[event] = [];
                }
                mockNetworkManager.eventHandlers[event].push(callback);
            }),
            off: jest.fn(),
            isConnected: jest.fn(() => false),
            getRoomId: jest.fn(() => 'test-room'),
            getPlayerId: jest.fn(() => 'player-123'),
            getPing: jest.fn(() => 50),
            disconnect: jest.fn(),
            rejoinRoom: jest.fn()
        };
        
        // Create managers
        reconnectionManager = new ReconnectionManager(mockNetworkManager);
        reconnectionManager.initialize();
        
        errorHandler = new NetworkErrorHandler(mockNetworkManager, reconnectionManager);
        errorHandler.initialize();
        
        jest.useFakeTimers();
    });
    
    afterEach(() => {
        reconnectionManager.destroy();
        errorHandler.destroy();
        jest.clearAllTimers();
        jest.useRealTimers();
    });
    
    describe('disconnect and reconnect flow', () => {
        it('should handle complete disconnect-reconnect cycle', () => {
            const notifications = [];
            errorHandler.onNotification((notification) => {
                notifications.push(notification);
            });
            
            // Simulate disconnect
            mockNetworkManager.eventHandlers.disconnected.forEach(handler => {
                handler({ reason: 'transport close' });
            });
            
            // Should notify about disconnection
            expect(notifications.some(n => n.title === 'Disconnected')).toBe(true);
            expect(errorHandler.degradationLevel).toBe(3);
            expect(reconnectionManager.preservedState.wasInGame).toBe(true);
            
            // Simulate reconnecting
            mockNetworkManager.eventHandlers.reconnecting.forEach(handler => {
                handler({ attemptNumber: 1 });
            });
            
            // Should notify about reconnection attempt
            expect(notifications.some(n => n.title === 'Reconnecting')).toBe(true);
            
            // Simulate successful reconnection
            mockNetworkManager.eventHandlers.reconnected.forEach(handler => {
                handler({ attemptNumber: 1 });
            });
            
            // Should notify about success and reset degradation
            expect(notifications.some(n => n.title === 'Reconnected')).toBe(true);
            expect(errorHandler.degradationLevel).toBe(0);
            expect(errorHandler.isDegraded).toBe(false);
        });
        
        it('should handle reconnection failure and offer fallback', () => {
            const notifications = [];
            errorHandler.onNotification((notification) => {
                notifications.push(notification);
            });
            
            // Simulate disconnect
            mockNetworkManager.eventHandlers.disconnected.forEach(handler => {
                handler({ reason: 'transport close' });
            });
            
            // Simulate reconnection abandoned
            reconnectionManager.eventHandlers.reconnectAbandoned.forEach(handler => {
                handler({ attemptNumber: 10, duration: 30000 });
            });
            
            // Should offer fallback options
            const failureNotification = notifications.find(n => n.title === 'Connection Failed');
            expect(failureNotification).toBeDefined();
            expect(failureNotification.actions).toHaveLength(2);
            expect(errorHandler.fallbackMode).toBe(true);
        });
    });
    
    describe('connection quality monitoring', () => {
        it('should track connection quality degradation', () => {
            const notifications = [];
            errorHandler.onNotification((notification) => {
                notifications.push(notification);
            });
            
            // Simulate connection quality degradation
            reconnectionManager.updateConnectionQuality('poor');
            
            // Should notify and update degradation
            expect(notifications.some(n => n.title === 'Poor Connection')).toBe(true);
            expect(errorHandler.degradationLevel).toBe(2);
            
            // Further degradation
            reconnectionManager.updateConnectionQuality('critical');
            
            expect(notifications.some(n => n.title === 'Critical Connection')).toBe(true);
            expect(errorHandler.degradationLevel).toBe(3);
        });
        
        it('should notify when connection improves', () => {
            const notifications = [];
            errorHandler.onNotification((notification) => {
                notifications.push(notification);
            });
            
            // Start with degraded connection
            errorHandler.isDegraded = true;
            reconnectionManager.updateConnectionQuality('poor');
            
            // Improve connection
            reconnectionManager.updateConnectionQuality('good');
            
            expect(notifications.some(n => n.title === 'Connection Improved')).toBe(true);
            expect(errorHandler.degradationLevel).toBe(0);
        });
    });
    
    describe('error accumulation and recovery', () => {
        it('should track multiple errors and assess degradation', () => {
            // Generate multiple errors
            for (let i = 0; i < 5; i++) {
                mockNetworkManager.eventHandlers.error.forEach(handler => {
                    handler({ type: 'timeout', message: `Error ${i}` });
                });
            }
            
            // Should be degraded
            expect(errorHandler.isDegraded).toBe(true);
            expect(errorHandler.errorHistory.length).toBe(5);
            
            // Simulate recovery (reconnect)
            mockNetworkManager.eventHandlers.reconnected.forEach(handler => {
                handler({ attemptNumber: 1 });
            });
            
            // Should reset degradation
            expect(errorHandler.degradationLevel).toBe(0);
            expect(errorHandler.isDegraded).toBe(false);
        });
    });
    
    describe('state preservation and restoration', () => {
        it('should preserve and restore state on reconnection', async () => {
            mockNetworkManager.getRoomId.mockReturnValue('room-456');
            mockNetworkManager.getPlayerId.mockReturnValue('player-789');
            mockNetworkManager.rejoinRoom.mockResolvedValue({
                success: true,
                gameState: { test: 'restored' }
            });
            
            // Simulate disconnect
            mockNetworkManager.eventHandlers.disconnected.forEach(handler => {
                handler({ reason: 'transport close' });
            });
            
            // State should be preserved
            expect(reconnectionManager.preservedState.roomId).toBe('room-456');
            expect(reconnectionManager.preservedState.playerId).toBe('player-789');
            
            // Simulate reconnection
            mockNetworkManager.eventHandlers.reconnected.forEach(handler => {
                handler({ attemptNumber: 1 });
            });
            
            // Wait for state restoration
            await Promise.resolve();
            
            // Should attempt to rejoin
            expect(mockNetworkManager.rejoinRoom).toHaveBeenCalledWith('room-456', 'player-789');
        });
    });
    
    describe('retry and fallback mechanisms', () => {
        it('should allow manual retry after failure', () => {
            // Simulate failure
            mockNetworkManager.eventHandlers.disconnected.forEach(handler => {
                handler({ reason: 'transport close' });
            });
            
            reconnectionManager.eventHandlers.reconnectAbandoned.forEach(handler => {
                handler({ attemptNumber: 10 });
            });
            
            expect(errorHandler.fallbackMode).toBe(true);
            
            // Retry connection
            errorHandler.retryConnection();
            
            // Should reset state and force reconnect
            expect(errorHandler.errorCounts.connection).toBe(0);
            expect(errorHandler.degradationLevel).toBe(0);
            expect(mockNetworkManager.disconnect).toHaveBeenCalled();
        });
        
        it('should enable offline mode as fallback', () => {
            const notifications = [];
            errorHandler.onNotification((notification) => {
                notifications.push(notification);
            });
            
            // Enable offline mode
            errorHandler.enableOfflineMode();
            
            expect(errorHandler.offlineMode).toBe(true);
            expect(errorHandler.fallbackMode).toBe(false);
            expect(mockNetworkManager.disconnect).toHaveBeenCalled();
            expect(notifications.some(n => n.title === 'Offline Mode')).toBe(true);
        });
    });
    
    describe('ping and packet loss monitoring', () => {
        it('should monitor ping and assess connection quality', () => {
            // Add ping history
            errorHandler.addToPingHistory(30);
            errorHandler.addToPingHistory(40);
            errorHandler.addToPingHistory(35);
            
            const stats = errorHandler.getConnectionStats();
            
            expect(stats.averagePing).toBeGreaterThan(0);
            expect(stats.pingHistory.length).toBe(3);
        });
        
        it('should track packet loss', () => {
            // Simulate packet loss
            for (let i = 0; i < 3; i++) {
                mockNetworkManager.eventHandlers.error.forEach(handler => {
                    handler({ type: 'timeout', message: 'Timeout' });
                });
            }
            
            expect(errorHandler.packetLossCount).toBe(3);
        });
    });
    
    describe('comprehensive status reporting', () => {
        it('should provide complete status information', () => {
            // Set up some state
            errorHandler.handleError({ type: 'connection', message: 'Error' });
            reconnectionManager.isReconnecting = true;
            reconnectionManager.reconnectAttempts = 2;
            
            const errorStats = errorHandler.getErrorStats();
            const connectionStats = errorHandler.getConnectionStats();
            const reconnectionStatus = reconnectionManager.getStatus();
            
            expect(errorStats.errorCounts.connection).toBe(1);
            expect(errorStats.isDegraded).toBeDefined();
            expect(connectionStats.currentPing).toBeDefined();
            expect(reconnectionStatus.isReconnecting).toBe(true);
            expect(reconnectionStatus.reconnectAttempts).toBe(2);
        });
    });
});
