/**
 * LeaderboardSystem - Manages Time Trial leaderboard with localStorage persistence
 * Handles top 10 score storage, ranking, and data validation
 */

const { Logger } = require('../utils/Logger');
const logger = new Logger('LeaderboardSystem');

class LeaderboardSystem {
    constructor() {
        this.storageKey = 'lightbikes_time_trial_scores';
        this.maxEntries = 10;
        this.scores = this.loadScores();
    }

    /**
     * Load scores from localStorage with validation and error handling
     * @returns {Array} Array of score objects sorted by time (best first)
     */
    loadScores() {
        try {
            if (!this.isLocalStorageAvailable()) {
                return [];
            }

            const stored = localStorage.getItem(this.storageKey);
            if (!stored) {
                return [];
            }

            const parsed = JSON.parse(stored);
            if (!Array.isArray(parsed)) {
                this.clearScores();
                return [];
            }

            // Validate and clean data
            const validScores = parsed
                .filter((score) => this.isValidScore(score))
                .slice(0, this.maxEntries);

            // Sort by time (descending - longer survival times first)
            validScores.sort((a, b) => b.timeMs - a.timeMs);

            // If we had to clean data, save the cleaned version
            if (validScores.length !== parsed.length) {
                this.saveScores(validScores);
            }

            return validScores;
        } catch (error) {
            logger.warn('Error loading leaderboard scores:', error);
            this.clearScores();
            return [];
        }
    }

    /**
     * Save scores to localStorage with quota handling
     * @param {Array} scores - Array of score objects to save
     */
    saveScores(scores) {
        try {
            if (!this.isLocalStorageAvailable()) {
                return false;
            }

            const dataToSave = JSON.stringify(scores);
            localStorage.setItem(this.storageKey, dataToSave);
            return true;
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                // Try to free space by removing oldest entries
                const reducedScores = scores.slice(0, Math.max(1, this.maxEntries - 2));
                try {
                    localStorage.setItem(this.storageKey, JSON.stringify(reducedScores));
                    return true;
                } catch (retryError) {
                    logger.warn('Failed to save leaderboard even after cleanup:', retryError);
                    return false;
                }
            }
            logger.warn('Error saving leaderboard scores:', error);
            return false;
        }
    }

    /**
     * Add a new score if it qualifies for the top 10
     * @param {number} timeMs - Survival time in milliseconds
     * @returns {Object} Result object with success status and ranking info
     */
    addScore(timeMs) {
        if (!this.isValidTimeMs(timeMs)) {
            return { success: false, reason: 'Invalid time value' };
        }

        const newScore = {
            timeMs: timeMs,
            timestamp: Date.now(),
            formattedTime: this.formatTime(timeMs),
        };

        // Check if score qualifies
        if (!this.isNewRecord(timeMs)) {
            return {
                success: false,
                reason: 'Time does not qualify for top 10',
                time: newScore.formattedTime,
            };
        }

        // Insert score in correct position
        const insertIndex = this.findInsertPosition(timeMs);
        this.scores.splice(insertIndex, 0, newScore);

        // Trim to max entries
        if (this.scores.length > this.maxEntries) {
            this.scores = this.scores.slice(0, this.maxEntries);
        }

        // Save to localStorage
        const saved = this.saveScores(this.scores);

        return {
            success: saved,
            ranking: insertIndex + 1,
            time: newScore.formattedTime,
            isNewBest: insertIndex === 0,
        };
    }

    /**
     * Check if a time qualifies for the leaderboard
     * @param {number} timeMs - Time in milliseconds to check
     * @returns {boolean} True if time qualifies for top 10
     */
    isNewRecord(timeMs) {
        if (!this.isValidTimeMs(timeMs)) {
            return false;
        }

        // If we have fewer than max entries, any valid time qualifies
        if (this.scores.length < this.maxEntries) {
            return true;
        }

        // Check if time is better than the worst score (longer survival time)
        const worstScore = this.scores[this.scores.length - 1];
        return timeMs > worstScore.timeMs;
    }

    /**
     * Find the correct insertion position for a new score
     * @param {number} timeMs - Time in milliseconds
     * @returns {number} Index where the score should be inserted
     */
    findInsertPosition(timeMs) {
        for (let i = 0; i < this.scores.length; i++) {
            if (timeMs > this.scores[i].timeMs) {
                return i;
            }
        }
        return this.scores.length;
    }

    /**
     * Get the current top scores
     * @returns {Array} Array of top score objects
     */
    getTopScores() {
        return [...this.scores]; // Return copy to prevent external mutation
    }

    /**
     * Clear all scores from storage
     */
    clearScores() {
        this.scores = [];
        try {
            if (this.isLocalStorageAvailable()) {
                localStorage.removeItem(this.storageKey);
            }
        } catch (error) {
            logger.warn('Error clearing leaderboard scores:', error);
        }
    }

    /**
     * Format time in milliseconds to MM:SS.SS display format
     * @param {number} timeMs - Time in milliseconds
     * @returns {string} Formatted time string
     */
    formatTime(timeMs) {
        if (!this.isValidTimeMs(timeMs)) {
            return '00:00.00';
        }

        const totalSeconds = Math.floor(timeMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const centiseconds = Math.floor((timeMs % 1000) / 10);

        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    }

    /**
     * Check if localStorage is available and functional
     * @returns {boolean} True if localStorage can be used
     */
    isLocalStorageAvailable() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Validate a score object structure
     * @param {Object} score - Score object to validate
     * @returns {boolean} True if score object is valid
     */
    isValidScore(score) {
        if (!score || typeof score !== 'object' || score === null) {
            return false;
        }

        return (
            typeof score.timeMs === 'number' &&
            score.timeMs > 0 &&
            score.timeMs < 6000000 && // Max 100 minutes
            typeof score.timestamp === 'number' &&
            typeof score.formattedTime === 'string'
        );
    }

    /**
     * Validate a time value in milliseconds
     * @param {number} timeMs - Time to validate
     * @returns {boolean} True if time is valid
     */
    isValidTimeMs(timeMs) {
        return (
            typeof timeMs === 'number' &&
            timeMs > 0 &&
            timeMs < 6000000 && // Max 100 minutes
            !isNaN(timeMs) &&
            isFinite(timeMs)
        );
    }

    /**
     * Get statistics about the leaderboard
     * @returns {Object} Statistics object
     */
    getStats() {
        if (this.scores.length === 0) {
            return {
                totalScores: 0,
                bestTime: null,
                averageTime: null,
            };
        }

        const totalTime = this.scores.reduce((sum, score) => sum + score.timeMs, 0);
        const averageTime = totalTime / this.scores.length;

        return {
            totalScores: this.scores.length,
            bestTime: this.formatTime(this.scores[0].timeMs),
            averageTime: this.formatTime(averageTime),
        };
    }
}

module.exports = { LeaderboardSystem };
