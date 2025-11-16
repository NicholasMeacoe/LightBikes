/**
 * ScorePersistence - Handles localStorage operations for high score persistence
 * Provides static methods for saving/loading high scores with error handling
 */
class ScorePersistence {
    static HIGH_SCORE_KEY = 'lightbikes_high_score';
    static MAX_SCORE_VALUE = 999999;

    /**
     * Get localStorage reference (supports both browser and test environments)
     */
    static getStorage() {
        return typeof window !== 'undefined' ? window.localStorage : global.localStorage;
    }

    /**
     * Save high score to localStorage
     * @param {number} score - The high score to save
     * @returns {boolean} - True if save was successful, false otherwise
     */
    static saveHighScore(score) {
        if (!this.isStorageAvailable()) {
            console.warn('localStorage not available, high score will not persist');
            return false;
        }

        if (!this.isValidScore(score)) {
            console.error('Invalid score value:', score);
            return false;
        }

        try {
            this.getStorage().setItem(this.HIGH_SCORE_KEY, score.toString());
            return true;
        } catch (error) {
            console.error('Failed to save high score to localStorage:', error);
            return false;
        }
    }

    /**
     * Load high score from localStorage
     * @returns {number} - The loaded high score, or 0 if not found/invalid
     */
    static loadHighScore() {
        if (!this.isStorageAvailable()) {
            console.warn('localStorage not available, using default high score');
            return 0;
        }

        try {
            const storedScore = this.getStorage().getItem(this.HIGH_SCORE_KEY);
            
            if (storedScore === null) {
                return 0; // No high score stored yet
            }

            const parsedScore = parseInt(storedScore, 10);
            
            if (!this.isValidScore(parsedScore)) {
                console.warn('Invalid high score in storage, resetting to 0');
                this.saveHighScore(0); // Clean up invalid data
                return 0;
            }

            return parsedScore;
        } catch (error) {
            console.error('Failed to load high score from localStorage:', error);
            return 0;
        }
    }

    /**
     * Check if localStorage is available and functional
     * @returns {boolean} - True if localStorage is available, false otherwise
     */
    static isStorageAvailable() {
        const storage = this.getStorage();
        if (!storage) {
            return false;
        }
        try {
            const testKey = '__lightbikes_storage_test__';
            storage.setItem(testKey, 'test');
            storage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Validate score value
     * @param {*} score - The score value to validate
     * @returns {boolean} - True if score is valid, false otherwise
     */
    static isValidScore(score) {
        return (
            typeof score === 'number' &&
            !isNaN(score) &&
            isFinite(score) &&
            score >= 0 &&
            score <= this.MAX_SCORE_VALUE &&
            Number.isInteger(score)
        );
    }

    /**
     * Clear stored high score (useful for testing or reset functionality)
     * @returns {boolean} - True if clear was successful, false otherwise
     */
    static clearHighScore() {
        if (!this.isStorageAvailable()) {
            return false;
        }

        try {
            this.getStorage().removeItem(this.HIGH_SCORE_KEY);
            return true;
        } catch (error) {
            console.error('Failed to clear high score from localStorage:', error);
            return false;
        }
    }
}

module.exports = { ScorePersistence };