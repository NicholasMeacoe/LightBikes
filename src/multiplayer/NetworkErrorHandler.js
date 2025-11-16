/**
 * NetworkErrorHandler - Handles network errors with graceful degradation
 * Provides user notifications and fallback mechanisms for network failures
 */

class NetworkErrorHandler {
    constructor(networkManager, reconnectionManager) {
        this.networkManager = networkManager;
        this.reconnectionManager = reconnectionManager;
        
        // Error tracking
        this.errorHistory = [];
        this.maxErrorHistory = 100;
        this.errorCounts = {
            connection: 0,
            timeout: 0,
            serverError: 0,
            validation: 0,
            unknown: 0
        };
        
        // Connection quality metrics
        this.pingHistory = [];
        this.maxPingHistory = 60; // Last 60 pings
        this.packetLossCount = 0;
        this.totalPackets = 0;
        
        // Degradation state
        this.isDegraded = false;
        this.degradationLevel = 0; // 0 = normal, 1 = minor, 2 = moderate, 3 = severe
        
        // Notification callbacks
        this.notificationHandlers = [];
        
        // Fallback state
        this.fallbackMode = false;
        this.offlineMode = false;
    }
    
    /**
     * Initialize error handler with network manager events
     */
    initialize() {
        // Listen to network manager events
        this.networkManager.on('error', (data) => this.handleError(data));
        this.networkManager.on('disconnected', (data) => this.handleDisconnect(data));
        this.networkManager.on('reconnecting', (data) => this.handleReconnecting(data));
        this.networkManager.on('reconnected', (data) => this.handleReconnected(data));
        
        // Listen to reconnection manager events
        this.reconnectionManager.on('reconnectAbandoned', (data) => this.handleReconnectAbandoned(data));
        this.reconnectionManager.on('connectionQualityChanged', (data) => this.handleConnectionQualityChanged(data));
        
        // Start ping monitoring
        this.startPingMonitoring();
    }
    
    /**
     * Handle error event
     */
    handleError(data) {
        const error = {
            type: data.type || 'unknown',
            message: data.error || data.message || 'Unknown error',
            timestamp: Date.now(),
            context: data
        };
        
        // Add to history
        this.addToErrorHistory(error);
        
        // Update error counts
        if (this.errorCounts.hasOwnProperty(error.type)) {
            this.errorCounts[error.type]++;
        } else {
            this.errorCounts.unknown++;
        }
        
        // Handle specific error types
        switch (error.type) {
            case 'connection':
                this.handleConnectionError(error);
                break;
            case 'timeout':
                this.handleTimeoutError(error);
                break;
            case 'serverError':
                this.handleServerError(error);
                break;
            case 'validation':
                this.handleValidationError(error);
                break;
            default:
                this.handleUnknownError(error);
        }
        
        // Assess degradation level
        this.assessDegradation();
    }
    
    /**
     * Handle connection error
     */
    handleConnectionError(error) {
        console.error('[NetworkErrorHandler] Connection error:', error.message);
        
        // Notify user
        this.notify({
            type: 'error',
            severity: 'high',
            title: 'Connection Error',
            message: 'Unable to connect to game server. Attempting to reconnect...',
            duration: 5000
        });
        
        // Increase degradation
        this.increaseDegradation();
    }
    
    /**
     * Handle timeout error
     */
    handleTimeoutError(error) {
        console.warn('[NetworkErrorHandler] Timeout error:', error.message);
        
        // Track packet loss
        this.packetLossCount++;
        
        // Notify user if frequent timeouts
        if (this.packetLossCount > 5) {
            this.notify({
                type: 'warning',
                severity: 'medium',
                title: 'Connection Issues',
                message: 'Experiencing high latency. Gameplay may be affected.',
                duration: 3000
            });
        }
        
        // Increase degradation
        this.increaseDegradation();
    }
    
    /**
     * Handle server error
     */
    handleServerError(error) {
        console.error('[NetworkErrorHandler] Server error:', error.message);
        
        // Notify user
        this.notify({
            type: 'error',
            severity: 'high',
            title: 'Server Error',
            message: error.message || 'Server encountered an error. Please try again.',
            duration: 5000
        });
    }
    
    /**
     * Handle validation error
     */
    handleValidationError(error) {
        console.warn('[NetworkErrorHandler] Validation error:', error.message);
        
        // Notify user
        this.notify({
            type: 'warning',
            severity: 'low',
            title: 'Invalid Action',
            message: error.message || 'Action could not be completed.',
            duration: 3000
        });
    }
    
    /**
     * Handle unknown error
     */
    handleUnknownError(error) {
        console.error('[NetworkErrorHandler] Unknown error:', error);
        
        // Notify user
        this.notify({
            type: 'error',
            severity: 'medium',
            title: 'Error',
            message: 'An unexpected error occurred.',
            duration: 3000
        });
    }
    
    /**
     * Handle disconnect event
     */
    handleDisconnect(data) {
        console.log('[NetworkErrorHandler] Disconnected:', data.reason);
        
        // Notify user
        this.notify({
            type: 'warning',
            severity: 'high',
            title: 'Disconnected',
            message: 'Connection to server lost. Attempting to reconnect...',
            duration: 0 // Persistent until reconnected
        });
        
        // Set degradation to severe
        this.degradationLevel = 3;
        this.isDegraded = true;
    }
    
    /**
     * Handle reconnecting event
     */
    handleReconnecting(data) {
        console.log('[NetworkErrorHandler] Reconnecting, attempt:', data.attemptNumber);
        
        // Update notification
        this.notify({
            type: 'info',
            severity: 'medium',
            title: 'Reconnecting',
            message: `Reconnection attempt ${data.attemptNumber}/${data.maxAttempts}...`,
            duration: 0 // Persistent
        });
    }
    
    /**
     * Handle reconnected event
     */
    handleReconnected(data) {
        console.log('[NetworkErrorHandler] Reconnected');
        
        // Notify user
        this.notify({
            type: 'success',
            severity: 'medium',
            title: 'Reconnected',
            message: 'Connection restored successfully.',
            duration: 3000
        });
        
        // Reset degradation
        this.degradationLevel = 0;
        this.isDegraded = false;
        this.fallbackMode = false;
    }
    
    /**
     * Handle reconnect abandoned event
     */
    handleReconnectAbandoned(data) {
        console.log('[NetworkErrorHandler] Reconnection abandoned');
        
        // Notify user with fallback options
        this.notify({
            type: 'error',
            severity: 'critical',
            title: 'Connection Failed',
            message: 'Unable to reconnect to server. Would you like to try offline mode?',
            duration: 0, // Persistent
            actions: [
                { label: 'Retry', action: () => this.retryConnection() },
                { label: 'Offline Mode', action: () => this.enableOfflineMode() }
            ]
        });
        
        // Enable fallback mode
        this.enableFallbackMode();
    }
    
    /**
     * Handle connection quality changed event
     */
    handleConnectionQualityChanged(data) {
        console.log('[NetworkErrorHandler] Connection quality changed:', data.currentQuality);
        
        // Notify user based on quality
        switch (data.currentQuality) {
            case 'poor':
                this.notify({
                    type: 'warning',
                    severity: 'medium',
                    title: 'Poor Connection',
                    message: 'Connection quality is poor. You may experience lag.',
                    duration: 5000
                });
                this.degradationLevel = 2;
                this.isDegraded = true;
                break;
            case 'critical':
                this.notify({
                    type: 'error',
                    severity: 'high',
                    title: 'Critical Connection',
                    message: 'Connection quality is critical. Gameplay severely affected.',
                    duration: 0
                });
                this.degradationLevel = 3;
                this.isDegraded = true;
                break;
            case 'good':
            case 'fair':
                if (this.isDegraded) {
                    this.notify({
                        type: 'success',
                        severity: 'low',
                        title: 'Connection Improved',
                        message: 'Connection quality has improved.',
                        duration: 3000
                    });
                }
                this.degradationLevel = data.currentQuality === 'fair' ? 1 : 0;
                this.isDegraded = data.currentQuality === 'fair';
                break;
        }
    }
    
    /**
     * Start ping monitoring
     */
    startPingMonitoring() {
        setInterval(() => {
            if (this.networkManager.isConnected()) {
                const ping = this.networkManager.getPing();
                this.addToPingHistory(ping);
                this.totalPackets++;
                
                // Calculate packet loss rate
                const packetLossRate = (this.packetLossCount / this.totalPackets) * 100;
                
                // Assess connection quality
                this.reconnectionManager.assessConnectionQuality(ping, packetLossRate);
            }
        }, 1000);
    }
    
    /**
     * Add ping to history
     */
    addToPingHistory(ping) {
        this.pingHistory.push({
            value: ping,
            timestamp: Date.now()
        });
        
        // Limit history size
        if (this.pingHistory.length > this.maxPingHistory) {
            this.pingHistory.shift();
        }
    }
    
    /**
     * Add error to history
     */
    addToErrorHistory(error) {
        this.errorHistory.push(error);
        
        // Limit history size
        if (this.errorHistory.length > this.maxErrorHistory) {
            this.errorHistory.shift();
        }
    }
    
    /**
     * Assess degradation level based on recent errors
     */
    assessDegradation() {
        // Count recent errors (last 10 seconds)
        const recentErrors = this.errorHistory.filter(
            error => Date.now() - error.timestamp < 10000
        );
        
        // Update degradation level
        if (recentErrors.length >= 10) {
            this.degradationLevel = 3; // Severe
            this.isDegraded = true;
        } else if (recentErrors.length >= 5) {
            this.degradationLevel = 2; // Moderate
            this.isDegraded = true;
        } else if (recentErrors.length >= 2) {
            this.degradationLevel = 1; // Minor
            this.isDegraded = true;
        } else {
            this.degradationLevel = 0; // Normal
            this.isDegraded = false;
        }
    }
    
    /**
     * Increase degradation level
     */
    increaseDegradation() {
        if (this.degradationLevel < 3) {
            this.degradationLevel++;
            this.isDegraded = true;
        }
    }
    
    /**
     * Enable fallback mode
     */
    enableFallbackMode() {
        console.log('[NetworkErrorHandler] Enabling fallback mode');
        
        this.fallbackMode = true;
        
        // Notify application
        this.notify({
            type: 'info',
            severity: 'medium',
            title: 'Fallback Mode',
            message: 'Running in fallback mode with limited functionality.',
            duration: 5000
        });
    }
    
    /**
     * Enable offline mode
     */
    enableOfflineMode() {
        console.log('[NetworkErrorHandler] Enabling offline mode');
        
        this.offlineMode = true;
        this.fallbackMode = false;
        
        // Disconnect from server
        this.networkManager.disconnect();
        
        // Notify application
        this.notify({
            type: 'info',
            severity: 'low',
            title: 'Offline Mode',
            message: 'Switched to offline mode. Multiplayer features disabled.',
            duration: 5000
        });
    }
    
    /**
     * Retry connection
     */
    retryConnection() {
        console.log('[NetworkErrorHandler] Retrying connection');
        
        // Reset error counts
        this.errorCounts = {
            connection: 0,
            timeout: 0,
            serverError: 0,
            validation: 0,
            unknown: 0
        };
        
        // Reset degradation
        this.degradationLevel = 0;
        this.isDegraded = false;
        this.fallbackMode = false;
        
        // Force reconnection
        this.reconnectionManager.forceReconnect();
    }
    
    /**
     * Send notification to user
     */
    notify(notification) {
        console.log('[NetworkErrorHandler] Notification:', notification);
        
        // Trigger notification handlers
        this.notificationHandlers.forEach(handler => {
            try {
                handler(notification);
            } catch (error) {
                console.error('Error in notification handler:', error);
            }
        });
    }
    
    /**
     * Register notification handler
     */
    onNotification(handler) {
        this.notificationHandlers.push(handler);
    }
    
    /**
     * Get error statistics
     */
    getErrorStats() {
        return {
            errorCounts: { ...this.errorCounts },
            recentErrors: this.errorHistory.slice(-10),
            totalErrors: this.errorHistory.length,
            degradationLevel: this.degradationLevel,
            isDegraded: this.isDegraded,
            fallbackMode: this.fallbackMode,
            offlineMode: this.offlineMode
        };
    }
    
    /**
     * Get connection statistics
     */
    getConnectionStats() {
        const avgPing = this.pingHistory.length > 0
            ? this.pingHistory.reduce((sum, p) => sum + p.value, 0) / this.pingHistory.length
            : 0;
        
        const packetLossRate = this.totalPackets > 0
            ? (this.packetLossCount / this.totalPackets) * 100
            : 0;
        
        return {
            averagePing: Math.round(avgPing),
            currentPing: this.networkManager.getPing(),
            packetLossRate: packetLossRate.toFixed(2),
            connectionQuality: this.reconnectionManager.connectionQuality,
            pingHistory: this.pingHistory.slice(-20)
        };
    }
    
    /**
     * Get status
     */
    getStatus() {
        return {
            isDegraded: this.isDegraded,
            degradationLevel: this.degradationLevel,
            fallbackMode: this.fallbackMode,
            offlineMode: this.offlineMode,
            connectionQuality: this.reconnectionManager.connectionQuality,
            errorCount: this.errorHistory.length
        };
    }
    
    /**
     * Reset error tracking
     */
    reset() {
        this.errorHistory = [];
        this.errorCounts = {
            connection: 0,
            timeout: 0,
            serverError: 0,
            validation: 0,
            unknown: 0
        };
        this.pingHistory = [];
        this.packetLossCount = 0;
        this.totalPackets = 0;
        this.degradationLevel = 0;
        this.isDegraded = false;
        this.fallbackMode = false;
        this.offlineMode = false;
    }
    
    /**
     * Cleanup
     */
    destroy() {
        this.notificationHandlers = [];
        this.reset();
    }
}

module.exports = { NetworkErrorHandler };
