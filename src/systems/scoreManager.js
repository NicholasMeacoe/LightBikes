/**
 * ScoreManager - Central scoring logic and state management for LightBikes
 * Handles player scores, AI scores, and high score tracking
 */
const { ScorePersistence } = require('./scorePersistence.js');

class ScoreManager {
    constructor() {
        this.playerScore = 0;
        this.aiScore = 0;
        this.highScore = ScorePersistence.loadHighScore();
    }

    /**
     * Increment the player's score by 1
     */
    incrementPlayerScore() {
        this.playerScore++;
        this.updateHighScore();
    }

    /**
     * Increment the AI's score by 1
     */
    incrementAIScore() {
        this.aiScore++;
    }

    /**
     * Reset current game scores (player and AI) while preserving high score
     */
    resetCurrentScores() {
        this.playerScore = 0;
        this.aiScore = 0;
    }

    /**
     * Update high score if current player score exceeds it
     * @returns {boolean} True if high score was updated
     */
    updateHighScore() {
        if (this.playerScore > this.highScore) {
            this.highScore = this.playerScore;
            ScorePersistence.saveHighScore(this.highScore);
            return true;
        }
        return false;
    }

    /**
     * Check if current player score is a new high score
     * @returns {boolean} True if current player score equals high score and is greater than 0
     */
    isNewHighScore() {
        return this.playerScore === this.highScore && this.playerScore > 0;
    }

    /**
     * Set the high score (used for loading from persistence)
     * @param {number} score - The high score value to set
     */
    setHighScore(score) {
        if (typeof score === 'number' && score >= 0) {
            this.highScore = score;
        }
    }

    /**
     * Get complete score state for external access
     * @returns {Object} Score state object with all current values
     */
    getScoreState() {
        return {
            playerScore: this.playerScore,
            aiScore: this.aiScore,
            highScore: this.highScore,
            isNewHighScore: this.isNewHighScore(),
            roundsPlayed: this.playerScore + this.aiScore
        };
    }
}

module.exports = { ScoreManager };