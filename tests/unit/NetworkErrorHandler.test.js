const { NetworkErrorHandler } = require('@/multiplayer/NetworkErrorHandler.js');

describe('NetworkErrorHandler', () => {
    let errorHandler;
    let mockNetworkManager;
    let mockReconnectionManager;
    
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
            isConnected: jest.fn(() => true),
            getPing: jest.fn(() => 50),
            disconnect: jest.fn()
        };
        
        // Create mock reconnection manager
        mockReconnectionManager = {
            eventHandlers: {},
            on: jest.fn((event, callback) => {
                if (!mockReconnectionManager.eventHandlers[event]) {
                    mockReconnectionManager.eventHandlers[event] = [];
                }
                mockReconnectionManager.eventHandlers[event].push(callback);
            }),
            assessConnectionQuality: jest.fn(),
            forceReconnect: jest.fn(),
            connectionQuality: 'good'
        };
        
        errorHandler = new NetworkErrorHandler(mockNetworkManager, mockReconnectionManager);
        errorHandler.initialize();
        
        jest.useFakeTimers();
    });
    
    afterEach(() => {
        errorHandler.destroy();
        jest.clearAllTimers();
        jest.useRealTimers();
    });
    
    describe('initialization', () => {
        it('should initialize with default state', () => {
            expect(errorHandler.isDegraded).toBe(false);
            expect(errorHandler.degradationLevel).toBe(0);
            expect(errorHandler.fallbackMode).toBe(false);
            expect(errorHandler.offlineMode).toBe(false);
        });
        
        it('should register event handlers', () => {
            expect(mockNetworkManager.on).toHaveBeenCalledWith('error', expect.any(Function));
            expect(mockNetworkManager.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
            expect(mockReconnectionManager.on).toHaveBeenCalledWith('reconnectAbandoned', expect.any(Function));
        });
    });
    
    describe('error handling', () => {
        it('should handle connection errors', () => {
            const notifyCallback = jest.fn();
            errorHandler.onNotification(notifyCallback);
            
            errorHandler.handleError({
                type: 'connection',
                message: 'Connection failed'
            });
            
            expect(errorHandler.errorCounts.connection).toBe(1);
            expect(notifyCallback).toHaveBeenCalledWith(expect.objectContaining({
                type: 'error',
                title: 'Connection Error'
            }));
        });
        
        it('should handle timeout errors', () => {
            errorHandler.handleError({
                type: 'timeout',
                message: 'Request timeout'
            });
            
            expect(errorHandler.errorCounts.timeout).toBe(1);
            expect(errorHandler.packetLossCount).toBe(1);
        });
        
        it('should handle server errors', () => {
            const notifyCallback = jest.fn();
            errorHandler.onNotification(notifyCallback);
            
            errorHandler.handleError({
                type: 'serverError',
                message: 'Internal server error'
            });
            
            expect(errorHandler.errorCounts.serverError).toBe(1);
            expect(notifyCallback).toHaveBeenCalledWith(expect.objectContaining({
                type: 'error',
                title: 'Server Error'
            }));
        });
        
        it('should track error history', () => {
            errorHandler.handleError({ type: 'connection', message: 'Error 1' });
            errorHandler.handleError({ type: 'timeout', message: 'Error 2' });
            
            expect(errorHandler.errorHistory.length).toBe(2);
            expect(errorHandler.errorHistory[0].type).toBe('connection');
            expect(errorHandler.errorHistory[1].type).toBe('timeout');
        });
    });
    
    describe('degradation assessment', () => {
        it('should increase degradation with multiple errors', () => {
            // Add multiple errors quickly
            for (let i = 0; i < 5; i++) {
                errorHandler.handleError({ type: 'timeout', message: 'Error' });
            }
            
            expect(errorHandler.isDegraded).toBe(true);
            expect(errorHandler.degradationLevel).toBeGreaterThan(0);
        });
        
        it('should set severe degradation with many errors', () => {
            // Add many errors quickly
            for (let i = 0; i < 10; i++) {
                errorHandler.handleError({ type: 'connection', message: 'Error' });
            }
            
            expect(errorHandler.degradationLevel).toBe(3);
        });
    });
    
    describe('disconnect handling', () => {
        it('should notify on disconnect', () => {
            const notifyCallback = jest.fn();
            errorHandler.onNotification(notifyCallback);
            
            errorHandler.handleDisconnect({ reason: 'transport close' });
            
            expect(notifyCallback).toHaveBeenCalledWith(expect.objectContaining({
                type: 'warning',
                title: 'Disconnected'
            }));
            expect(errorHandler.degradationLevel).toBe(3);
        });
    });
    
    describe('reconnection handling', () => {
        it('should notify during reconnection attempts', () => {
            const notifyCallback = jest.fn();
            errorHandler.onNotification(notifyCallback);
            
            errorHandler.handleReconnecting({ attemptNumber: 2, maxAttempts: 10 });
            
            expect(notifyCallback).toHaveBeenCalledWith(expect.objectContaining({
                type: 'info',
                title: 'Reconnecting'
            }));
        });
        
        it('should notify on successful reconnection', () => {
            const notifyCallback = jest.fn();
            errorHandler.onNotification(notifyCallback);
            
            errorHandler.handleReconnected({ attemptNumber: 3 });
            
            expect(notifyCallback).toHaveBeenCalledWith(expect.objectContaining({
                type: 'success',
                title: 'Reconnected'
            }));
            expect(errorHandler.degradationLevel).toBe(0);
            expect(errorHandler.isDegraded).toBe(false);
        });
        
        it('should offer fallback on reconnect abandoned', () => {
            const notifyCallback = jest.fn();
            errorHandler.onNotification(notifyCallback);
            
            errorHandler.handleReconnectAbandoned({ attemptNumber: 10 });
            
            expect(notifyCallback).toHaveBeenCalledWith(expect.objectContaining({
                type: 'error',
                title: 'Connection Failed',
                actions: expect.any(Array)
            }));
            expect(errorHandler.fallbackMode).toBe(true);
        });
    });
    
    describe('connection quality monitoring', () => {
        it('should notify on poor connection quality', () => {
            const notifyCallback = jest.fn();
            errorHandler.onNotification(notifyCallback);
            
            errorHandler.handleConnectionQualityChanged({
                previousQuality: 'good',
                currentQuality: 'poor'
            });
            
            expect(notifyCallback).toHaveBeenCalledWith(expect.objectContaining({
                type: 'warning',
                title: 'Poor Connection'
            }));
            expect(errorHandler.degradationLevel).toBe(2);
        });
        
        it('should notify on critical connection quality', () => {
            const notifyCallback = jest.fn();
            errorHandler.onNotification(notifyCallback);
            
            errorHandler.handleConnectionQualityChanged({
                previousQuality: 'fair',
                currentQuality: 'critical'
            });
            
            expect(notifyCallback).toHaveBeenCalledWith(expect.objectContaining({
                type: 'error',
                title: 'Critical Connection'
            }));
            expect(errorHandler.degradationLevel).toBe(3);
        });
        
        it('should notify on connection improvement', () => {
            const notifyCallback = jest.fn();
            errorHandler.onNotification(notifyCallback);
            errorHandler.isDegraded = true;
            
            errorHandler.handleConnectionQualityChanged({
                previousQuality: 'poor',
                currentQuality: 'good'
            });
            
            expect(notifyCallback).toHaveBeenCalledWith(expect.objectContaining({
                type: 'success',
                title: 'Connection Improved'
            }));
        });
    });
    
    describe('fallback mode', () => {
        it('should enable fallback mode', () => {
            const notifyCallback = jest.fn();
            errorHandler.onNotification(notifyCallback);
            
            errorHandler.enableFallbackMode();
            
            expect(errorHandler.fallbackMode).toBe(true);
            expect(notifyCallback).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Fallback Mode'
            }));
        });
    });
    
    describe('offline mode', () => {
        it('should enable offline mode', () => {
            const notifyCallback = jest.fn();
            errorHandler.onNotification(notifyCallback);
            
            errorHandler.enableOfflineMode();
            
            expect(errorHandler.offlineMode).toBe(true);
            expect(errorHandler.fallbackMode).toBe(false);
            expect(mockNetworkManager.disconnect).toHaveBeenCalled();
            expect(notifyCallback).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Offline Mode'
            }));
        });
    });
    
    describe('retry connection', () => {
        it('should reset state and force reconnect', () => {
            errorHandler.errorCounts.connection = 5;
            errorHandler.degradationLevel = 2;
            
            errorHandler.retryConnection();
            
            expect(errorHandler.errorCounts.connection).toBe(0);
            expect(errorHandler.degradationLevel).toBe(0);
            expect(mockReconnectionManager.forceReconnect).toHaveBeenCalled();
        });
    });
    
    describe('statistics', () => {
        it('should return error statistics', () => {
            errorHandler.handleError({ type: 'connection', message: 'Error 1' });
            errorHandler.handleError({ type: 'timeout', message: 'Error 2' });
            
            const stats = errorHandler.getErrorStats();
            
            expect(stats.errorCounts.connection).toBe(1);
            expect(stats.errorCounts.timeout).toBe(1);
            expect(stats.totalErrors).toBe(2);
        });
        
        it('should return connection statistics', () => {
            errorHandler.addToPingHistory(50);
            errorHandler.addToPingHistory(60);
            errorHandler.addToPingHistory(55);
            
            const stats = errorHandler.getConnectionStats();
            
            expect(stats.averagePing).toBeGreaterThan(0);
            expect(stats.currentPing).toBe(50);
        });
    });
    
    describe('reset', () => {
        it('should reset all state', () => {
            errorHandler.handleError({ type: 'connection', message: 'Error' });
            errorHandler.degradationLevel = 2;
            errorHandler.fallbackMode = true;
            
            errorHandler.reset();
            
            expect(errorHandler.errorHistory.length).toBe(0);
            expect(errorHandler.degradationLevel).toBe(0);
            expect(errorHandler.fallbackMode).toBe(false);
        });
    });
});
