/**
 * LocalScoring - Manages win tracking and scoring for local 2-player multiplayer mode
 * Tracks wins for both players across multiple rounds
 */
class LocalScoring {
    /**
     * Create a new LocalScoring instance
     */
    constructor() {
        this.player1Wins = 0;
        this.player2Wins = 0;
        this.currentRound = 1;
        this.totalRounds = 0;
        this.roundHistory = []; // Track history of round winners
    }

    /**
     * Increment score for a specific player
     * @param {string} playerId - Player ID ('P1' or 'P2')
     */
    incrementScore(playerId) {
        if (playerId === 'P1') {
            this.player1Wins++;
        } else if (playerId === 'P2') {
            this.player2Wins++;
        }
        
        this.totalRounds++;
        this.roundHistory.push(playerId);
    }

    /**
     * Handle a tie game (no score change)
     */
    handleTieGame() {
        this.totalRounds++;
        this.roundHistory.push('TIE');
    }

    /**
     * Get current score for a specific player
     * @param {string} playerId - Player ID ('P1' or 'P2')
     * @returns {number} Current win count
     */
    getScore(playerId) {
        if (playerId === 'P1') {
            return this.player1Wins;
        } else if (playerId === 'P2') {
            return this.player2Wins;
        }
        return 0;
    }

    /**
     * Get formatted score display string
     * @returns {string} Formatted score (e.g., "3 - 2")
     */
    getScoreDisplay() {
        return `${this.player1Wins} - ${this.player2Wins}`;
    }

    /**
     * Get detailed score information
     * @returns {Object} Score details
     */
    getScoreDetails() {
        return {
            player1Wins: this.player1Wins,
            player2Wins: this.player2Wins,
            currentRound: this.currentRound,
            totalRounds: this.totalRounds,
            roundHistory: [...this.roundHistory]
        };
    }

    /**
     * Reset all scores to zero
     */
    resetScores() {
        this.player1Wins = 0;
        this.player2Wins = 0;
        this.currentRound = 1;
        this.totalRounds = 0;
        this.roundHistory = [];
    }

    /**
     * Advance to next round
     */
    nextRound() {
        this.currentRound++;
    }

    /**
     * Get the overall leader
     * @returns {string|null} 'P1', 'P2', or null for tie
     */
    getLeader() {
        if (this.player1Wins > this.player2Wins) {
            return 'P1';
        } else if (this.player2Wins > this.player1Wins) {
            return 'P2';
        }
        return null; // Tie
    }

    /**
     * Check if there's a clear winner (one player has more wins)
     * @returns {boolean} True if there's a clear leader
     */
    hasLeader() {
        return this.player1Wins !== this.player2Wins;
    }

    /**
     * Get win percentage for a player
     * @param {string} playerId - Player ID ('P1' or 'P2')
     * @returns {number} Win percentage (0-100)
     */
    getWinPercentage(playerId) {
        if (this.totalRounds === 0) {
            return 0;
        }
        
        const wins = this.getScore(playerId);
        return Math.round((wins / this.totalRounds) * 100);
    }

    /**
     * Get the last round winner
     * @returns {string|null} Last round winner or null
     */
    getLastRoundWinner() {
        if (this.roundHistory.length === 0) {
            return null;
        }
        return this.roundHistory[this.roundHistory.length - 1];
    }

    /**
     * Export scoring state for persistence
     * @returns {Object} Serializable scoring state
     */
    exportState() {
        return {
            player1Wins: this.player1Wins,
            player2Wins: this.player2Wins,
            currentRound: this.currentRound,
            totalRounds: this.totalRounds,
            roundHistory: [...this.roundHistory]
        };
    }

    /**
     * Import scoring state from persistence
     * @param {Object} state - Previously exported state
     */
    importState(state) {
        if (!state) return;
        
        this.player1Wins = state.player1Wins || 0;
        this.player2Wins = state.player2Wins || 0;
        this.currentRound = state.currentRound || 1;
        this.totalRounds = state.totalRounds || 0;
        this.roundHistory = state.roundHistory || [];
    }
}

module.exports = { LocalScoring };
