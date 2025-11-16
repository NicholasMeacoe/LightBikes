/**
 * ArenaShrinker - Manages dynamic arena boundaries for Arena Shrink Mode
 * 
 * This component handles the progressive shrinking of the game arena,
 * including timing, warnings, and boundary calculations.
 */

class ArenaShrinker {
    constructor(initialSize = 30, minSize = 10, shrinkInterval = 5000, shrinkAmount = 1) {
        // Core configuration
        this.initialSize = initialSize;
        this.currentSize = initialSize;
        this.minSize = minSize;
        this.shrinkInterval = shrinkInterval; // 5 seconds in milliseconds
        this.shrinkAmount = shrinkAmount; // Units to shrink per cycle
        this.warningDuration = 2000; // 2 seconds warning before shrink
        this.gracePeriod = 500; // 0.5 seconds grace period after shrink
        
        // State management
        this.isActive = true;
        this.gameStartTime = 0;
        this.lastShrinkTime = 0;
        this.warningActive = false;
        this.warningStartTime = 0;
        this.gracePeriodActive = false;
        this.gracePeriodStartTime = 0;
        this.shrinkCount = 0;
        this.isAtMinimum = false;
        
        // Survival time tracking
        this.survivalStartTime = 0;
        this.survivalEndTime = 0;
        this.isTrackingSurvival = false;
        
        // Arena progression tracking
        this.arenaSizeHistory = [];
        this.shrinkTimestamps = [];
        
        // Event callbacks
        this.onWarningCallback = null;
        this.onShrinkCallback = null;
        this.onFinalArenaCallback = null;
    }

    /**
     * Initialize the arena shrinker with game start time
     * @param {number} currentTime - Current timestamp in milliseconds
     */
    initialize(currentTime) {
        this.gameStartTime = currentTime;
        this.lastShrinkTime = currentTime;
        this.isActive = true;
        this.warningActive = false;
        this.gracePeriodActive = false;
        this.shrinkCount = 0;
        this.isAtMinimum = false;
        this.currentSize = this.initialSize;
        
        // Initialize survival time tracking
        this.survivalStartTime = currentTime;
        this.survivalEndTime = 0;
        this.isTrackingSurvival = true;
        
        // Initialize arena progression tracking
        this.arenaSizeHistory = [{ size: this.initialSize, timestamp: currentTime }];
        this.shrinkTimestamps = [];
    }

    /**
     * Update the arena shrinker state
     * @param {number} currentTime - Current timestamp in milliseconds
     */
    update(currentTime) {
        if (!this.isActive || this.isAtMinimum) {
            return;
        }

        const timeSinceLastShrink = currentTime - this.lastShrinkTime;
        const timeUntilShrink = this.shrinkInterval - timeSinceLastShrink;

        // Check if we should activate warning
        if (!this.warningActive && timeUntilShrink <= this.warningDuration) {
            this.activateWarning(currentTime);
        }

        // Check if we should execute shrink
        if (timeSinceLastShrink >= this.shrinkInterval) {
            this.executeShrink(currentTime);
        }

        // Update grace period
        if (this.gracePeriodActive) {
            const gracePeriodElapsed = currentTime - this.gracePeriodStartTime;
            if (gracePeriodElapsed >= this.gracePeriod) {
                this.gracePeriodActive = false;
            }
        }
    }

    /**
     * Activate warning system before shrink
     * @param {number} currentTime - Current timestamp in milliseconds
     */
    activateWarning(currentTime) {
        this.warningActive = true;
        this.warningStartTime = currentTime;
        
        if (this.onWarningCallback) {
            this.onWarningCallback();
        }
    }

    /**
     * Execute arena shrink
     * @param {number} currentTime - Current timestamp in milliseconds
     */
    executeShrink(currentTime) {
        // Calculate new size
        const newSize = Math.max(this.currentSize - (this.shrinkAmount * 2), this.minSize);
        
        // Record arena progression before changing size
        this.arenaSizeHistory.push({ size: newSize, timestamp: currentTime });
        this.shrinkTimestamps.push(currentTime);
        
        // Check if we've reached minimum size
        if (newSize <= this.minSize) {
            this.currentSize = this.minSize;
            this.isAtMinimum = true;
            this.isActive = false;
            
            if (this.onFinalArenaCallback) {
                this.onFinalArenaCallback();
            }
        } else {
            this.currentSize = newSize;
        }

        // Update state
        this.lastShrinkTime = currentTime;
        this.warningActive = false;
        this.shrinkCount++;
        
        // Activate grace period
        this.gracePeriodActive = true;
        this.gracePeriodStartTime = currentTime;

        if (this.onShrinkCallback) {
            this.onShrinkCallback();
        }
    }

    /**
     * Get current arena boundaries
     * @returns {Object} Boundary coordinates {minX, maxX, minZ, maxZ}
     */
    getCurrentBounds() {
        const halfSize = this.currentSize / 2;
        return {
            minX: -halfSize,
            maxX: halfSize,
            minZ: -halfSize,
            maxZ: halfSize,
            size: this.currentSize
        };
    }

    /**
     * Get next arena boundaries (for preview during warning)
     * @returns {Object} Next boundary coordinates {minX, maxX, minZ, maxZ}
     */
    getNextBounds() {
        if (this.isAtMinimum) {
            return this.getCurrentBounds();
        }

        const nextSize = Math.max(this.currentSize - (this.shrinkAmount * 2), this.minSize);
        const halfSize = nextSize / 2;
        return {
            minX: -halfSize,
            maxX: halfSize,
            minZ: -halfSize,
            maxZ: halfSize,
            size: nextSize
        };
    }

    /**
     * Check if warning is currently active
     * @returns {boolean} True if warning is active
     */
    isWarningActive() {
        return this.warningActive;
    }

    /**
     * Check if grace period is currently active
     * @returns {boolean} True if grace period is active
     */
    isGracePeriodActive() {
        return this.gracePeriodActive;
    }

    /**
     * Get time until next shrink in milliseconds
     * @param {number} currentTime - Current timestamp in milliseconds
     * @returns {number} Time until next shrink in milliseconds
     */
    getTimeUntilShrink(currentTime) {
        if (!this.isActive || this.isAtMinimum) {
            return 0;
        }

        const timeSinceLastShrink = currentTime - this.lastShrinkTime;
        return Math.max(0, this.shrinkInterval - timeSinceLastShrink);
    }

    /**
     * Get countdown timer value for UI display
     * @param {number} currentTime - Current timestamp in milliseconds
     * @returns {number} Countdown in seconds (rounded)
     */
    getCountdownSeconds(currentTime) {
        const timeUntilShrink = this.getTimeUntilShrink(currentTime);
        return Math.ceil(timeUntilShrink / 1000);
    }

    /**
     * Get current arena size
     * @returns {number} Current arena dimension
     */
    getCurrentSize() {
        return this.currentSize;
    }

    /**
     * Get number of shrinks that have occurred
     * @returns {number} Shrink count
     */
    getShrinkCount() {
        return this.shrinkCount;
    }

    /**
     * Check if arena has reached minimum size
     * @returns {boolean} True if at minimum size
     */
    isAtMinimumSize() {
        return this.isAtMinimum;
    }

    /**
     * Validate if a position is within current bounds
     * @param {Object} position - Position to check {x, z}
     * @returns {boolean} True if position is within bounds
     */
    isWithinBounds(position) {
        const bounds = this.getCurrentBounds();
        return position.x >= bounds.minX && 
               position.x <= bounds.maxX && 
               position.z >= bounds.minZ && 
               position.z <= bounds.maxZ;
    }

    /**
     * Set callback for warning events
     * @param {Function} callback - Function to call when warning activates
     */
    setOnWarning(callback) {
        this.onWarningCallback = callback;
    }

    /**
     * Set callback for shrink events
     * @param {Function} callback - Function to call when shrink occurs
     */
    setOnShrink(callback) {
        this.onShrinkCallback = callback;
    }

    /**
     * Set callback for final arena events
     * @param {Function} callback - Function to call when minimum size reached
     */
    setOnFinalArena(callback) {
        this.onFinalArenaCallback = callback;
    }

    /**
     * Stop survival time tracking (called when player is eliminated)
     * @param {number} currentTime - Current timestamp in milliseconds
     */
    stopSurvivalTracking(currentTime) {
        if (this.isTrackingSurvival) {
            this.survivalEndTime = currentTime;
            this.isTrackingSurvival = false;
        }
    }

    /**
     * Get total survival time in milliseconds
     * @param {number} currentTime - Current timestamp in milliseconds (optional, uses survivalEndTime if tracking stopped)
     * @returns {number} Survival time in milliseconds
     */
    getSurvivalTime(currentTime = null) {
        if (!this.survivalStartTime) {
            return 0;
        }
        
        const endTime = this.isTrackingSurvival ? (currentTime || Date.now()) : this.survivalEndTime;
        return Math.max(0, endTime - this.survivalStartTime);
    }

    /**
     * Get formatted survival time for display
     * @param {number} currentTime - Current timestamp in milliseconds (optional)
     * @returns {string} Formatted time string (MM:SS.SS)
     */
    getFormattedSurvivalTime(currentTime = null) {
        const totalMs = this.getSurvivalTime(currentTime);
        const totalSeconds = totalMs / 1000;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toFixed(2).padStart(5, '0')}`;
    }

    /**
     * Get arena size at a specific shrink event
     * @param {number} shrinkIndex - Index of the shrink event (0-based)
     * @returns {number|null} Arena size at that shrink, or null if invalid index
     */
    getArenaSizeAtShrink(shrinkIndex) {
        if (shrinkIndex < 0 || shrinkIndex >= this.arenaSizeHistory.length) {
            return null;
        }
        return this.arenaSizeHistory[shrinkIndex].size;
    }

    /**
     * Get timestamp of a specific shrink event
     * @param {number} shrinkIndex - Index of the shrink event (0-based)
     * @returns {number|null} Timestamp of that shrink, or null if invalid index
     */
    getShrinkTimestamp(shrinkIndex) {
        if (shrinkIndex < 0 || shrinkIndex >= this.shrinkTimestamps.length) {
            return null;
        }
        return this.shrinkTimestamps[shrinkIndex];
    }

    /**
     * Get complete arena size progression history
     * @returns {Array} Array of {size, timestamp} objects
     */
    getArenaSizeHistory() {
        return [...this.arenaSizeHistory]; // Return copy to prevent external modification
    }

    /**
     * Get all shrink timestamps
     * @returns {Array} Array of timestamps when shrinks occurred
     */
    getShrinkTimestamps() {
        return [...this.shrinkTimestamps]; // Return copy to prevent external modification
    }

    /**
     * Get survival statistics for scoring and analysis
     * @param {number} currentTime - Current timestamp in milliseconds (optional)
     * @returns {Object} Complete survival statistics
     */
    getSurvivalStatistics(currentTime = null) {
        return {
            survivalTime: this.getSurvivalTime(currentTime),
            formattedSurvivalTime: this.getFormattedSurvivalTime(currentTime),
            shrinksSurvived: this.shrinkCount,
            finalArenaSize: this.currentSize,
            isAtMinimumArena: this.isAtMinimum,
            arenaSizeHistory: this.getArenaSizeHistory(),
            shrinkTimestamps: this.getShrinkTimestamps(),
            averageTimePerShrink: this.shrinkCount > 0 ? this.getSurvivalTime(currentTime) / this.shrinkCount : 0
        };
    }

    /**
     * Reset the arena shrinker to initial state
     */
    reset() {
        this.currentSize = this.initialSize;
        this.isActive = true;
        this.gameStartTime = 0;
        this.lastShrinkTime = 0;
        this.warningActive = false;
        this.warningStartTime = 0;
        this.gracePeriodActive = false;
        this.gracePeriodStartTime = 0;
        this.shrinkCount = 0;
        this.isAtMinimum = false;
        
        // Reset survival time tracking
        this.survivalStartTime = 0;
        this.survivalEndTime = 0;
        this.isTrackingSurvival = false;
        
        // Reset arena progression tracking
        this.arenaSizeHistory = [];
        this.shrinkTimestamps = [];
    }

    /**
     * Get arena state for debugging and UI
     * @param {number} currentTime - Current timestamp in milliseconds
     * @returns {Object} Complete arena state
     */
    getArenaState(currentTime) {
        return {
            currentSize: this.currentSize,
            minSize: this.minSize,
            shrinkCount: this.shrinkCount,
            isActive: this.isActive,
            isAtMinimum: this.isAtMinimum,
            warningActive: this.warningActive,
            gracePeriodActive: this.gracePeriodActive,
            timeUntilShrink: this.getTimeUntilShrink(currentTime),
            countdownSeconds: this.getCountdownSeconds(currentTime),
            currentBounds: this.getCurrentBounds(),
            nextBounds: this.getNextBounds(),
            // Survival time tracking
            survivalTime: this.getSurvivalTime(currentTime),
            formattedSurvivalTime: this.getFormattedSurvivalTime(currentTime),
            isTrackingSurvival: this.isTrackingSurvival,
            // Arena progression tracking
            arenaSizeHistory: this.getArenaSizeHistory(),
            shrinkTimestamps: this.getShrinkTimestamps(),
            survivalStatistics: this.getSurvivalStatistics(currentTime)
        };
    }
}

module.exports = { ArenaShrinker };