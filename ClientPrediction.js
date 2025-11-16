/**
 * ClientPrediction - Client-side prediction and reconciliation system
 * Provides immediate input response and reconciles with authoritative server state
 */

class ClientPrediction {
    constructor(gameInstance) {
        this.gameInstance = gameInstance;
        
        // State snapshots for rollback and replay
        this.snapshots = new Map(); // timestamp -> snapshot
        this.maxSnapshots = 120; // Keep 2 seconds of history at 60Hz
        
        // Input history for replay
        this.inputHistory = [];
        this.maxInputHistory = 120;
        
        // Prediction state
        this.lastServerTimestamp = 0;
        this.lastProcessedSequence = 0;
        this.predictionEnabled = true;
        
        // Reconciliation settings
        this.reconciliationThreshold = 0.5; // Distance threshold for correction
        this.smoothingFactor = 0.3; // Interpolation factor for corrections
    }
    
    /**
     * Apply input immediately for prediction
     * @param {Object} input - Input data {direction, timestamp, sequenceId}
     * @returns {boolean} Whether input was applied
     */
    applyInput(input, timestamp = Date.now()) {
        if (!this.predictionEnabled || !input) {
            return false;
        }
        
        // Save snapshot before applying input
        this.saveSnapshot(timestamp);
        
        // Apply input to local game state
        const directionChanged = this.applyDirectionChange(input.direction);
        
        if (directionChanged) {
            // Record input for replay
            this.inputHistory.push({
                direction: input.direction,
                timestamp: timestamp,
                sequenceId: input.sequenceId || this.generateSequenceId()
            });
            
            // Limit input history size
            if (this.inputHistory.length > this.maxInputHistory) {
                this.inputHistory.shift();
            }
        }
        
        return directionChanged;
    }
    
    /**
     * Apply direction change to game instance
     * @param {string} direction - Direction string (up, down, left, right)
     * @returns {boolean} Whether direction changed
     */
    applyDirectionChange(direction) {
        if (!this.gameInstance) {
            return false;
        }
        
        // Convert direction string to arrow key
        const keyMap = {
            'up': 'ArrowUp',
            'down': 'ArrowDown',
            'left': 'ArrowLeft',
            'right': 'ArrowRight'
        };
        
        const key = keyMap[direction];
        if (!key) {
            return false;
        }
        
        // Apply to game instance
        return this.gameInstance.changePlayerDirection(key);
    }
    
    /**
     * Reconcile with server state
     * @param {Object} serverState - Authoritative server state
     * @param {number} timestamp - Server timestamp
     */
    reconcileWithServer(serverState, timestamp) {
        if (!serverState || !this.predictionEnabled) {
            return;
        }
        
        this.lastServerTimestamp = timestamp;
        
        // Get player state from server
        const serverPlayerState = this.getPlayerStateFromServer(serverState);
        if (!serverPlayerState) {
            return;
        }
        
        // Update last processed sequence
        if (serverPlayerState.lastProcessedSequence) {
            this.lastProcessedSequence = serverPlayerState.lastProcessedSequence;
        }
        
        // Get current predicted state
        const gameState = this.gameInstance.getGameState();
        const predictedPosition = gameState.player;
        
        // Calculate position error
        const error = this.calculatePositionError(
            predictedPosition,
            serverPlayerState.position
        );
        
        // If error is significant, perform reconciliation
        if (error > this.reconciliationThreshold) {
            this.performReconciliation(serverPlayerState, timestamp);
        }
        
        // Clean up old snapshots and inputs
        this.cleanupOldData(timestamp);
    }
    
    /**
     * Get player state from server state
     * @param {Object} serverState - Server state
     * @returns {Object|null} Player state or null
     */
    getPlayerStateFromServer(serverState) {
        if (!serverState.players) {
            return null;
        }
        
        // Find player state (assuming single player for now)
        const playerStates = Object.values(serverState.players);
        if (playerStates.length === 0) {
            return null;
        }
        
        // Return first player state (will be enhanced for multiplayer)
        return playerStates[0];
    }
    
    /**
     * Calculate position error between predicted and server position
     * @param {Object} predicted - Predicted position {x, y, z}
     * @param {Object} server - Server position {x, y, z}
     * @returns {number} Distance error
     */
    calculatePositionError(predicted, server) {
        const dx = predicted.x - server.x;
        const dz = predicted.z - server.z;
        return Math.sqrt(dx * dx + dz * dz);
    }
    
    /**
     * Perform reconciliation by rolling back and replaying
     * @param {Object} serverPlayerState - Authoritative player state from server
     * @param {number} timestamp - Current timestamp
     */
    performReconciliation(serverPlayerState, timestamp) {
        // Set player position to server position
        this.gameInstance.player.x = serverPlayerState.position.x;
        this.gameInstance.player.y = serverPlayerState.position.y;
        this.gameInstance.player.z = serverPlayerState.position.z;
        
        // Set player direction to server direction
        this.gameInstance.playerDirection = { ...serverPlayerState.direction };
        
        // Set player trail to server trail
        this.gameInstance.playerTrail = serverPlayerState.trail.map(segment => ({ ...segment }));
        
        // Replay unacknowledged inputs
        this.replayUnacknowledgedInputs();
    }
    
    /**
     * Replay inputs that haven't been acknowledged by server
     */
    replayUnacknowledgedInputs() {
        // Find inputs after last processed sequence
        const unacknowledgedInputs = this.inputHistory.filter(
            input => input.sequenceId > this.lastProcessedSequence
        );
        
        // Replay each input
        for (const input of unacknowledgedInputs) {
            this.applyDirectionChange(input.direction);
            
            // Simulate game update for this input
            if (this.gameInstance.update) {
                this.gameInstance.update();
            }
        }
    }
    
    /**
     * Rollback to a specific timestamp and replay from there
     * @param {number} fromTimestamp - Timestamp to rollback to
     */
    rollbackAndReplay(fromTimestamp) {
        // Get snapshot at or before timestamp
        const snapshot = this.getSnapshot(fromTimestamp);
        if (!snapshot) {
            return;
        }
        
        // Restore snapshot
        this.restoreSnapshot(snapshot);
        
        // Replay inputs after snapshot
        const inputsToReplay = this.inputHistory.filter(
            input => input.timestamp > fromTimestamp
        );
        
        for (const input of inputsToReplay) {
            this.applyDirectionChange(input.direction);
            if (this.gameInstance.update) {
                this.gameInstance.update();
            }
        }
    }
    
    /**
     * Save state snapshot
     * @param {number} timestamp - Snapshot timestamp
     */
    saveSnapshot(timestamp) {
        if (!this.gameInstance) {
            return;
        }
        
        const gameState = this.gameInstance.getGameState();
        
        const snapshot = {
            timestamp: timestamp,
            player: {
                x: gameState.player.x,
                y: gameState.player.y,
                z: gameState.player.z
            },
            playerDirection: { ...gameState.playerDirection },
            playerTrail: gameState.playerTrail.map(segment => ({ ...segment })),
            frameCount: gameState.frameCount
        };
        
        this.snapshots.set(timestamp, snapshot);
        
        // Limit snapshot count
        if (this.snapshots.size > this.maxSnapshots) {
            const oldestTimestamp = Math.min(...this.snapshots.keys());
            this.snapshots.delete(oldestTimestamp);
        }
    }
    
    /**
     * Get snapshot at or before timestamp
     * @param {number} timestamp - Target timestamp
     * @returns {Object|null} Snapshot or null
     */
    getSnapshot(timestamp) {
        // Find exact match
        if (this.snapshots.has(timestamp)) {
            return this.snapshots.get(timestamp);
        }
        
        // Find closest snapshot before timestamp
        let closestSnapshot = null;
        let closestTimestamp = 0;
        
        for (const [snapshotTime, snapshot] of this.snapshots.entries()) {
            if (snapshotTime <= timestamp && snapshotTime > closestTimestamp) {
                closestTimestamp = snapshotTime;
                closestSnapshot = snapshot;
            }
        }
        
        return closestSnapshot;
    }
    
    /**
     * Restore snapshot to game state
     * @param {Object} snapshot - Snapshot to restore
     */
    restoreSnapshot(snapshot) {
        if (!this.gameInstance || !snapshot) {
            return;
        }
        
        this.gameInstance.player.x = snapshot.player.x;
        this.gameInstance.player.y = snapshot.player.y;
        this.gameInstance.player.z = snapshot.player.z;
        this.gameInstance.playerDirection = { ...snapshot.playerDirection };
        this.gameInstance.playerTrail = snapshot.playerTrail.map(segment => ({ ...segment }));
        this.gameInstance.frameCount = snapshot.frameCount;
    }
    
    /**
     * Clear old snapshots before timestamp
     * @param {number} beforeTimestamp - Timestamp threshold
     */
    clearOldSnapshots(beforeTimestamp) {
        for (const timestamp of this.snapshots.keys()) {
            if (timestamp < beforeTimestamp) {
                this.snapshots.delete(timestamp);
            }
        }
    }
    
    /**
     * Clean up old data
     * @param {number} currentTimestamp - Current timestamp
     */
    cleanupOldData(currentTimestamp) {
        // Keep last 2 seconds of data
        const threshold = currentTimestamp - 2000;
        
        // Clean snapshots
        this.clearOldSnapshots(threshold);
        
        // Clean input history
        this.inputHistory = this.inputHistory.filter(
            input => input.timestamp > threshold
        );
    }
    
    /**
     * Generate sequence ID for inputs
     * @returns {number} Sequence ID
     */
    generateSequenceId() {
        if (!this._sequenceId) {
            this._sequenceId = 0;
        }
        return ++this._sequenceId;
    }
    
    /**
     * Enable prediction
     */
    enable() {
        this.predictionEnabled = true;
    }
    
    /**
     * Disable prediction
     */
    disable() {
        this.predictionEnabled = false;
    }
    
    /**
     * Check if prediction is enabled
     * @returns {boolean} True if enabled
     */
    isEnabled() {
        return this.predictionEnabled;
    }
    
    /**
     * Reset prediction system
     */
    reset() {
        this.snapshots.clear();
        this.inputHistory = [];
        this.lastServerTimestamp = 0;
        this.lastProcessedSequence = 0;
        this._sequenceId = 0;
    }
    
    /**
     * Get prediction statistics
     * @returns {Object} Statistics
     */
    getStats() {
        return {
            snapshotCount: this.snapshots.size,
            inputHistoryCount: this.inputHistory.length,
            lastServerTimestamp: this.lastServerTimestamp,
            lastProcessedSequence: this.lastProcessedSequence,
            predictionEnabled: this.predictionEnabled
        };
    }
}

module.exports = { ClientPrediction };
