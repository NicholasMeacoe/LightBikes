/**
 * SurvivalTimer - High-precision timer for Time Trial mode
 * Uses performance.now() for accurate millisecond tracking
 */
class SurvivalTimer {
    constructor() {
        this.startTime = null;
        this.pausedTime = 0;
        this.totalPausedDuration = 0;
        this.isPaused = false;
        this.isRunning = false;
    }

    /**
     * Start the timer
     */
    start() {
        if (this.isRunning) {
            return;
        }
        
        this.startTime = performance.now();
        this.pausedTime = 0;
        this.totalPausedDuration = 0;
        this.isPaused = false;
        this.isRunning = true;
    }

    /**
     * Pause the timer
     */
    pause() {
        if (!this.isRunning || this.isPaused) {
            return;
        }
        
        this.pausedTime = performance.now();
        this.isPaused = true;
    }

    /**
     * Resume the timer from pause
     */
    resume() {
        if (!this.isRunning || !this.isPaused) {
            return;
        }
        
        const pauseDuration = performance.now() - this.pausedTime;
        this.totalPausedDuration += pauseDuration;
        this.isPaused = false;
        this.pausedTime = 0;
    }

    /**
     * Stop the timer
     */
    stop() {
        if (!this.isRunning) {
            return;
        }
        
        this.isRunning = false;
        this.isPaused = false;
    }

    /**
     * Get elapsed time in milliseconds
     * @returns {number} Elapsed time in milliseconds
     */
    getElapsedTime() {
        if (!this.isRunning) {
            return 0;
        }
        
        const currentTime = performance.now();
        let elapsed = currentTime - this.startTime - this.totalPausedDuration;
        
        // If currently paused, subtract the current pause duration
        if (this.isPaused) {
            elapsed -= (currentTime - this.pausedTime);
        }
        
        // Ensure elapsed time is never negative
        return Math.max(0, elapsed);
    }

    /**
     * Format time in MM:SS.SS format
     * @param {number} timeMs - Time in milliseconds
     * @returns {string} Formatted time string
     */
    formatTime(timeMs) {
        if (typeof timeMs !== 'number' || timeMs < 0 || !isFinite(timeMs)) {
            return "00:00.00";
        }
        
        // Cap at 99:59.99 to prevent display issues
        const cappedTime = Math.min(timeMs, 5999990); // 99 minutes 59.99 seconds
        
        const totalSeconds = cappedTime / 1000;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        const minutesStr = minutes.toString().padStart(2, '0');
        const secondsStr = seconds.toFixed(2).padStart(5, '0');
        
        return `${minutesStr}:${secondsStr}`;
    }

    /**
     * Get current formatted time
     * @returns {string} Current time in MM:SS.SS format
     */
    getCurrentFormattedTime() {
        return this.formatTime(this.getElapsedTime());
    }

    /**
     * Reset the timer to initial state
     */
    reset() {
        this.startTime = null;
        this.pausedTime = 0;
        this.totalPausedDuration = 0;
        this.isPaused = false;
        this.isRunning = false;
    }

    /**
     * Get timer state for debugging/testing
     * @returns {object} Timer state object
     */
    getState() {
        return {
            startTime: this.startTime,
            pausedTime: this.pausedTime,
            totalPausedDuration: this.totalPausedDuration,
            isPaused: this.isPaused,
            isRunning: this.isRunning,
            elapsedTime: this.getElapsedTime()
        };
    }
}

module.exports = { SurvivalTimer };