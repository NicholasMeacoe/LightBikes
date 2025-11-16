/**
 * LatencyCompensation - Smooth movement interpolation and adaptive network handling
 * Provides smooth rendering between network updates and adapts to varying network conditions
 */

class LatencyCompensation {
    constructor(networkManager) {
        this.networkManager = networkManager;
        
        // Interpolation state
        this.interpolationBuffer = new Map(); // playerId -> [states]
        this.interpolationDelay = 100; // ms delay for interpolation buffer
        this.maxBufferSize = 10; // Maximum states to buffer per player
        
        // Ping measurement
        this.pingHistory = [];
        this.maxPingHistory = 30; // Keep 30 ping samples
        this.averagePing = 0;
        this.pingVariance = 0;
        
        // Adaptive settings
        this.adaptiveMode = true;
        this.qualityLevel = 'high'; // high, medium, low
        this.updateRateMultiplier = 1.0;
        
        // Network condition thresholds
        this.thresholds = {
            highQuality: { ping: 50, variance: 10 },
            mediumQuality: { ping: 100, variance: 30 },
            lowQuality: { ping: 200, variance: 50 }
        };
        
        // Interpolation settings per quality level
        this.qualitySettings = {
            high: { interpolationDelay: 100, bufferSize: 10, smoothing: 0.3 },
            medium: { interpolationDelay: 150, bufferSize: 8, smoothing: 0.5 },
            low: { interpolationDelay: 200, bufferSize: 5, smoothing: 0.7 }
        };
    }
    
    /**
     * Add state to interpolation buffer
     * @param {string} playerId - Player ID
     * @param {Object} state - Player state
     * @param {number} timestamp - State timestamp
     */
    addStateToBuffer(playerId, state, timestamp) {
        if (!this.interpolationBuffer.has(playerId)) {
            this.interpolationBuffer.set(playerId, []);
        }
        
        const buffer = this.interpolationBuffer.get(playerId);
        
        // Add state with timestamp
        buffer.push({
            state: state,
            timestamp: timestamp,
            receivedAt: Date.now()
        });
        
        // Sort by timestamp
        buffer.sort((a, b) => a.timestamp - b.timestamp);
        
        // Limit buffer size
        if (buffer.length > this.maxBufferSize) {
            buffer.shift();
        }
    }
    
    /**
     * Get interpolated state for player
     * @param {string} playerId - Player ID
     * @param {number} renderTime - Current render time
     * @returns {Object|null} Interpolated state or null
     */
    getInterpolatedState(playerId, renderTime = Date.now()) {
        const buffer = this.interpolationBuffer.get(playerId);
        if (!buffer || buffer.length < 2) {
            // Not enough states to interpolate
            return buffer && buffer.length > 0 ? buffer[buffer.length - 1].state : null;
        }
        
        // Calculate interpolation time (render time minus delay)
        const interpolationTime = renderTime - this.interpolationDelay;
        
        // Find two states to interpolate between
        let state0 = null;
        let state1 = null;
        
        for (let i = 0; i < buffer.length - 1; i++) {
            if (buffer[i].timestamp <= interpolationTime && 
                buffer[i + 1].timestamp >= interpolationTime) {
                state0 = buffer[i];
                state1 = buffer[i + 1];
                break;
            }
        }
        
        // If no suitable states found, use most recent
        if (!state0 || !state1) {
            return buffer[buffer.length - 1].state;
        }
        
        // Calculate interpolation factor
        const timeDiff = state1.timestamp - state0.timestamp;
        const t = timeDiff > 0 
            ? (interpolationTime - state0.timestamp) / timeDiff 
            : 0;
        
        // Interpolate position
        return this.interpolateStates(state0.state, state1.state, t);
    }
    
    /**
     * Interpolate between two states
     * @param {Object} state0 - Start state
     * @param {Object} state1 - End state
     * @param {number} t - Interpolation factor (0-1)
     * @returns {Object} Interpolated state
     */
    interpolateStates(state0, state1, t) {
        // Clamp t to [0, 1]
        t = Math.max(0, Math.min(1, t));
        
        return {
            position: {
                x: this.lerp(state0.position.x, state1.position.x, t),
                y: this.lerp(state0.position.y, state1.position.y, t),
                z: this.lerp(state0.position.z, state1.position.z, t)
            },
            direction: state1.direction, // Direction doesn't interpolate
            isAlive: state1.isAlive,
            id: state1.id,
            name: state1.name
        };
    }
    
    /**
     * Linear interpolation
     * @param {number} a - Start value
     * @param {number} b - End value
     * @param {number} t - Interpolation factor
     * @returns {number} Interpolated value
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    }
    
    /**
     * Record ping measurement
     * @param {number} ping - Ping in milliseconds
     */
    recordPing(ping) {
        this.pingHistory.push(ping);
        
        // Limit history size
        if (this.pingHistory.length > this.maxPingHistory) {
            this.pingHistory.shift();
        }
        
        // Calculate average and variance
        this.calculatePingStatistics();
        
        // Adapt to network conditions if enabled
        if (this.adaptiveMode) {
            this.adaptToNetworkConditions();
        }
    }
    
    /**
     * Calculate ping statistics
     */
    calculatePingStatistics() {
        if (this.pingHistory.length === 0) {
            this.averagePing = 0;
            this.pingVariance = 0;
            return;
        }
        
        // Calculate average
        const sum = this.pingHistory.reduce((acc, ping) => acc + ping, 0);
        this.averagePing = sum / this.pingHistory.length;
        
        // Calculate variance
        const squaredDiffs = this.pingHistory.map(ping => 
            Math.pow(ping - this.averagePing, 2)
        );
        const varianceSum = squaredDiffs.reduce((acc, diff) => acc + diff, 0);
        this.pingVariance = Math.sqrt(varianceSum / this.pingHistory.length);
    }
    
    /**
     * Adapt to network conditions
     */
    adaptToNetworkConditions() {
        const ping = this.averagePing;
        const variance = this.pingVariance;
        
        let newQuality = 'low';
        
        if (ping < this.thresholds.highQuality.ping && 
            variance < this.thresholds.highQuality.variance) {
            newQuality = 'high';
        } else if (ping < this.thresholds.mediumQuality.ping && 
                   variance < this.thresholds.mediumQuality.variance) {
            newQuality = 'medium';
        }
        
        // Update quality level if changed
        if (newQuality !== this.qualityLevel) {
            this.setQualityLevel(newQuality);
        }
    }
    
    /**
     * Set quality level
     * @param {string} quality - Quality level (high, medium, low)
     */
    setQualityLevel(quality) {
        if (!this.qualitySettings[quality]) {
            return;
        }
        
        this.qualityLevel = quality;
        const settings = this.qualitySettings[quality];
        
        // Update interpolation settings
        this.interpolationDelay = settings.interpolationDelay;
        this.maxBufferSize = settings.bufferSize;
        
        // Trim buffers if needed
        for (const buffer of this.interpolationBuffer.values()) {
            while (buffer.length > this.maxBufferSize) {
                buffer.shift();
            }
        }
    }
    
    /**
     * Get current ping
     * @returns {number} Current ping in milliseconds
     */
    getPing() {
        if (this.networkManager && this.networkManager.getPing) {
            return this.networkManager.getPing();
        }
        return this.averagePing;
    }
    
    /**
     * Get average ping
     * @returns {number} Average ping in milliseconds
     */
    getAveragePing() {
        return this.averagePing;
    }
    
    /**
     * Get ping variance
     * @returns {number} Ping variance
     */
    getPingVariance() {
        return this.pingVariance;
    }
    
    /**
     * Get quality level
     * @returns {string} Current quality level
     */
    getQualityLevel() {
        return this.qualityLevel;
    }
    
    /**
     * Get network statistics
     * @returns {Object} Network statistics
     */
    getNetworkStats() {
        return {
            currentPing: this.getPing(),
            averagePing: this.averagePing,
            pingVariance: this.pingVariance,
            qualityLevel: this.qualityLevel,
            interpolationDelay: this.interpolationDelay,
            bufferSize: this.maxBufferSize,
            pingHistorySize: this.pingHistory.length
        };
    }
    
    /**
     * Clear interpolation buffer for player
     * @param {string} playerId - Player ID
     */
    clearBuffer(playerId) {
        this.interpolationBuffer.delete(playerId);
    }
    
    /**
     * Clear all interpolation buffers
     */
    clearAllBuffers() {
        this.interpolationBuffer.clear();
    }
    
    /**
     * Enable adaptive mode
     */
    enableAdaptiveMode() {
        this.adaptiveMode = true;
    }
    
    /**
     * Disable adaptive mode
     */
    disableAdaptiveMode() {
        this.adaptiveMode = false;
    }
    
    /**
     * Check if adaptive mode is enabled
     * @returns {boolean} True if enabled
     */
    isAdaptiveModeEnabled() {
        return this.adaptiveMode;
    }
    
    /**
     * Set interpolation delay manually
     * @param {number} delay - Delay in milliseconds
     */
    setInterpolationDelay(delay) {
        if (delay >= 0) {
            this.interpolationDelay = delay;
        }
    }
    
    /**
     * Get interpolation delay
     * @returns {number} Delay in milliseconds
     */
    getInterpolationDelay() {
        return this.interpolationDelay;
    }
    
    /**
     * Reset latency compensation
     */
    reset() {
        this.interpolationBuffer.clear();
        this.pingHistory = [];
        this.averagePing = 0;
        this.pingVariance = 0;
        this.qualityLevel = 'high';
        this.setQualityLevel('high');
    }
    
    /**
     * Clean up old states from buffers
     * @param {number} currentTime - Current time
     */
    cleanupOldStates(currentTime) {
        const threshold = currentTime - (this.interpolationDelay * 3);
        
        for (const buffer of this.interpolationBuffer.values()) {
            // Remove states older than threshold
            while (buffer.length > 0 && buffer[0].timestamp < threshold) {
                buffer.shift();
            }
        }
    }
    
    /**
     * Get buffer size for player
     * @param {string} playerId - Player ID
     * @returns {number} Buffer size
     */
    getBufferSize(playerId) {
        const buffer = this.interpolationBuffer.get(playerId);
        return buffer ? buffer.length : 0;
    }
    
    /**
     * Check if player has sufficient buffer
     * @param {string} playerId - Player ID
     * @returns {boolean} True if sufficient
     */
    hasSufficientBuffer(playerId) {
        return this.getBufferSize(playerId) >= 2;
    }
}

module.exports = { LatencyCompensation };
