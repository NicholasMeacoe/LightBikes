/**
 * ReconnectionManager - Handles automatic reconnection with exponential backoff
 * Manages connection state preservation and seamless rejoin functionality
 */

const { Logger } = require('../utils/Logger');
const logger = Logger.create('ReconnectionManager');

class ReconnectionManager {
    constructor(networkManager) {
        this.networkManager = networkManager;

        // Reconnection state
        this.isReconnecting = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.baseDelay = 1000; // 1 second
        this.maxDelay = 30000; // 30 seconds
        this.reconnectTimeout = null;

        // State preservation
        this.preservedState = {
            roomId: null,
            playerId: null,
            playerName: null,
            wasInGame: false,
            lastKnownState: null,
        };

        // Connection quality tracking
        this.connectionQuality = 'good'; // good, fair, poor, critical
        this.disconnectTime = null;
        this.reconnectStartTime = null;

        // Event callbacks
        this.eventHandlers = {
            reconnectAttempt: [],
            reconnectSuccess: [],
            reconnectFailed: [],
            reconnectAbandoned: [],
            stateRestored: [],
            connectionQualityChanged: [],
        };
    }

    /**
     * Initialize reconnection manager with network manager events
     */
    initialize() {
        // Listen to network manager events
        this.networkManager.on('disconnected', (data) => this.handleDisconnect(data));
        this.networkManager.on('reconnecting', (data) => this.handleReconnecting(data));
        this.networkManager.on('reconnected', (data) => this.handleReconnected(data));
        this.networkManager.on('connected', (data) => this.handleConnected(data));
        this.networkManager.on('error', (data) => this.handleError(data));
    }

    /**
     * Handle disconnection event
     */
    handleDisconnect(data) {
        logger.info(`Disconnected: ${data.reason}`);

        this.disconnectTime = Date.now();
        this.isReconnecting = false;
        this.reconnectAttempts = 0;

        // Preserve current state
        this.preserveState();

        // Start reconnection attempts if not a manual disconnect
        if (data.reason !== 'io client disconnect') {
            this.startReconnection();
        }
    }

    /**
     * Handle reconnecting event
     */
    handleReconnecting(data) {
        logger.info(`Reconnecting, attempt: ${data.attemptNumber}`);

        this.isReconnecting = true;
        this.reconnectAttempts = data.attemptNumber;

        if (!this.reconnectStartTime) {
            this.reconnectStartTime = Date.now();
        }

        // Trigger reconnect attempt event
        this.triggerEvent('reconnectAttempt', {
            attemptNumber: data.attemptNumber,
            maxAttempts: this.maxReconnectAttempts,
            nextDelay: this.calculateBackoffDelay(data.attemptNumber),
        });
    }

    /**
     * Handle reconnected event
     */
    handleReconnected(data) {
        logger.info(`Reconnected after ${data.attemptNumber} attempts`);

        const reconnectDuration = this.reconnectStartTime
            ? Date.now() - this.reconnectStartTime
            : 0;

        this.isReconnecting = false;
        this.reconnectStartTime = null;

        // Trigger reconnect success event
        this.triggerEvent('reconnectSuccess', {
            attemptNumber: data.attemptNumber,
            duration: reconnectDuration,
        });

        // Attempt to restore state
        this.restoreState();
    }

    /**
     * Handle connected event
     */
    handleConnected(data) {
        // Update player ID
        if (this.preservedState.playerId === null) {
            this.preservedState.playerId = data.playerId;
        }
    }

    /**
     * Handle error event
     */
    handleError(data) {
        if (data.type === 'connection') {
            this.updateConnectionQuality('critical');
        }
    }

    /**
     * Start reconnection attempts with exponential backoff
     */
    startReconnection() {
        if (this.isReconnecting) {
            return;
        }

        this.isReconnecting = true;
        this.reconnectStartTime = Date.now();
        this.attemptReconnect();
    }

    /**
     * Attempt to reconnect
     */
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.abandonReconnection();
            return;
        }

        this.reconnectAttempts++;

        logger.info(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

        // Trigger reconnect attempt event
        this.triggerEvent('reconnectAttempt', {
            attemptNumber: this.reconnectAttempts,
            maxAttempts: this.maxReconnectAttempts,
            nextDelay: this.calculateBackoffDelay(this.reconnectAttempts),
        });

        // Calculate backoff delay
        const delay = this.calculateBackoffDelay(this.reconnectAttempts);

        // Schedule next attempt
        this.reconnectTimeout = setTimeout(() => {
            if (this.isReconnecting && !this.networkManager.isConnected()) {
                this.attemptReconnect();
            }
        }, delay);
    }

    /**
     * Calculate exponential backoff delay
     */
    calculateBackoffDelay(attemptNumber) {
        // Exponential backoff: baseDelay * 2^(attemptNumber - 1)
        const delay = this.baseDelay * Math.pow(2, attemptNumber - 1);

        // Add jitter (±20%) to prevent thundering herd
        const jitter = delay * 0.2 * (Math.random() * 2 - 1);

        // Cap at max delay
        return Math.min(delay + jitter, this.maxDelay);
    }

    /**
     * Abandon reconnection attempts
     */
    abandonReconnection() {
        logger.warn(`Reconnection abandoned after ${this.reconnectAttempts} attempts`);

        this.isReconnecting = false;
        this.reconnectStartTime = null;

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        // Trigger reconnect abandoned event
        this.triggerEvent('reconnectAbandoned', {
            attemptNumber: this.reconnectAttempts,
            duration: this.disconnectTime ? Date.now() - this.disconnectTime : 0,
        });

        // Clear preserved state
        this.clearPreservedState();
    }

    /**
     * Preserve current state for reconnection
     */
    preserveState() {
        this.preservedState = {
            roomId: this.networkManager.getRoomId(),
            playerId: this.networkManager.getPlayerId(),
            playerName: this.preservedState.playerName, // Keep existing name
            wasInGame: this.networkManager.getRoomId() !== null,
            lastKnownState: null, // Could be extended to preserve game state
            timestamp: Date.now(),
        };

        logger.info('State preserved:', this.preservedState);
    }

    /**
     * Restore preserved state after reconnection
     */
    async restoreState() {
        if (!this.preservedState.wasInGame || !this.preservedState.roomId) {
            logger.debug('No state to restore');
            return;
        }

        logger.info('Attempting to restore state:', this.preservedState);

        try {
            // Check if we were disconnected for too long (>30 seconds)
            const disconnectDuration = Date.now() - this.disconnectTime;
            if (disconnectDuration > 30000) {
                logger.warn('Disconnected too long, cannot rejoin');
                this.triggerEvent('reconnectFailed', {
                    reason: 'timeout',
                    duration: disconnectDuration,
                });
                this.clearPreservedState();
                return;
            }

            // Attempt to rejoin the room
            const response = await this.networkManager.rejoinRoom(
                this.preservedState.roomId,
                this.preservedState.playerId
            );

            if (response.success) {
                logger.info('State restored successfully');
                this.triggerEvent('stateRestored', {
                    roomId: this.preservedState.roomId,
                    gameState: response.gameState,
                });
            } else {
                logger.warn(`Failed to restore state: ${response.error}`);
                this.triggerEvent('reconnectFailed', {
                    reason: response.error || 'unknown',
                });
            }
        } catch (error) {
            logger.error('Error restoring state:', error);
            this.triggerEvent('reconnectFailed', {
                reason: error.message,
            });
        }

        // Clear preserved state after restoration attempt
        this.clearPreservedState();
    }

    /**
     * Clear preserved state
     */
    clearPreservedState() {
        this.preservedState = {
            roomId: null,
            playerId: null,
            playerName: null,
            wasInGame: false,
            lastKnownState: null,
        };
    }

    /**
     * Update connection quality assessment
     */
    updateConnectionQuality(quality) {
        if (this.connectionQuality !== quality) {
            const previousQuality = this.connectionQuality;
            this.connectionQuality = quality;

            logger.info(`Connection quality changed: ${previousQuality} -> ${quality}`);

            this.triggerEvent('connectionQualityChanged', {
                previousQuality,
                currentQuality: quality,
                ping: this.networkManager.getPing(),
            });
        }
    }

    /**
     * Assess connection quality based on ping and packet loss
     */
    assessConnectionQuality(ping, packetLoss = 0) {
        let quality;

        if (ping < 50 && packetLoss < 1) {
            quality = 'good';
        } else if (ping < 100 && packetLoss < 3) {
            quality = 'fair';
        } else if (ping < 200 && packetLoss < 10) {
            quality = 'poor';
        } else {
            quality = 'critical';
        }

        this.updateConnectionQuality(quality);
        return quality;
    }

    /**
     * Force reconnection attempt
     */
    forceReconnect() {
        logger.info('Forcing reconnection');

        // Disconnect current connection
        this.networkManager.disconnect();

        // Start reconnection
        this.startReconnection();
    }

    /**
     * Cancel reconnection attempts
     */
    cancelReconnection() {
        logger.info('Cancelling reconnection');

        this.isReconnecting = false;
        this.reconnectStartTime = null;

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        this.clearPreservedState();
    }

    /**
     * Set player name for state preservation
     */
    setPlayerName(name) {
        this.preservedState.playerName = name;
    }

    /**
     * Get reconnection status
     */
    getStatus() {
        return {
            isReconnecting: this.isReconnecting,
            reconnectAttempts: this.reconnectAttempts,
            maxReconnectAttempts: this.maxReconnectAttempts,
            connectionQuality: this.connectionQuality,
            hasPreservedState: this.preservedState.wasInGame,
            disconnectDuration: this.disconnectTime ? Date.now() - this.disconnectTime : 0,
        };
    }

    /**
     * Register event handler
     */
    on(event, callback) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].push(callback);
        }
    }

    /**
     * Unregister event handler
     */
    off(event, callback) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event] = this.eventHandlers[event].filter((cb) => cb !== callback);
        }
    }

    /**
     * Trigger event handlers
     */
    triggerEvent(event, data) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].forEach((callback) => {
                try {
                    callback(data);
                } catch (error) {
                    logger.error(`Error in ${event} handler:`, error);
                }
            });
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        this.cancelReconnection();
        this.clearPreservedState();
        this.eventHandlers = {
            reconnectAttempt: [],
            reconnectSuccess: [],
            reconnectFailed: [],
            reconnectAbandoned: [],
            stateRestored: [],
            connectionQualityChanged: [],
        };
    }
}

module.exports = { ReconnectionManager };
