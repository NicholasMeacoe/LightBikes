/**
 * AchievementSystem - Manages milestone achievements for Time Trial mode
 * Tracks progress, unlocks achievements, and persists data using localStorage
 */
class AchievementSystem {
    constructor() {
        this.storageKey = 'lightbikes_achievements';
        this.milestones = [
            { seconds: 30, message: "First Steps!", description: "Survived 30 seconds" },
            { seconds: 60, message: "Getting Warmed Up!", description: "Survived 1 minute" },
            { seconds: 120, message: "Steady Progress!", description: "Survived 2 minutes" },
            { seconds: 300, message: "Master of Survival!", description: "Survived 5 minutes" },
            { seconds: 600, message: "Legendary Pilot!", description: "Survived 10 minutes" }
        ];
        this.unlockedAchievements = this.loadProgress();
        this.sessionAchievements = new Set(); // Track achievements earned this session
    }

    /**
     * Load achievement progress from localStorage
     * @returns {Set} Set of unlocked milestone seconds
     */
    loadProgress() {
        try {
            if (!this.isLocalStorageAvailable()) {
                return new Set();
            }

            const stored = localStorage.getItem(this.storageKey);
            if (!stored) {
                return new Set();
            }

            const parsed = JSON.parse(stored);
            if (!Array.isArray(parsed)) {
                this.clearProgress();
                return new Set();
            }

            // Validate and filter valid milestone values
            const validMilestones = parsed.filter(seconds => 
                typeof seconds === 'number' && 
                this.milestones.some(m => m.seconds === seconds)
            );

            return new Set(validMilestones);
        } catch (error) {
            console.warn('Error loading achievement progress:', error);
            this.clearProgress();
            return new Set();
        }
    }

    /**
     * Save achievement progress to localStorage
     * @returns {boolean} True if save was successful
     */
    saveProgress() {
        try {
            if (!this.isLocalStorageAvailable()) {
                return false;
            }

            const progressArray = Array.from(this.unlockedAchievements);
            localStorage.setItem(this.storageKey, JSON.stringify(progressArray));
            return true;
        } catch (error) {
            console.warn('Error saving achievement progress:', error);
            return false;
        }
    }

    /**
     * Check for new milestone achievements based on survival time
     * @param {number} timeSeconds - Current survival time in seconds
     * @returns {Array} Array of newly unlocked achievements
     */
    checkMilestone(timeSeconds) {
        if (typeof timeSeconds !== 'number' || timeSeconds < 0 || !isFinite(timeSeconds)) {
            return [];
        }

        const newAchievements = [];

        for (const milestone of this.milestones) {
            // Check if milestone is reached and not already unlocked this session
            if (timeSeconds >= milestone.seconds && 
                !this.unlockedAchievements.has(milestone.seconds) &&
                !this.sessionAchievements.has(milestone.seconds)) {
                
                // Unlock the achievement
                this.unlockedAchievements.add(milestone.seconds);
                this.sessionAchievements.add(milestone.seconds);
                newAchievements.push({
                    seconds: milestone.seconds,
                    message: milestone.message,
                    description: milestone.description,
                    timeAchieved: timeSeconds
                });
            }
        }

        // Save progress if new achievements were unlocked
        if (newAchievements.length > 0) {
            this.saveProgress();
        }

        return newAchievements;
    }

    /**
     * Get all milestone information with unlock status
     * @returns {Array} Array of milestone objects with unlock status
     */
    getAllMilestones() {
        return this.milestones.map(milestone => ({
            seconds: milestone.seconds,
            message: milestone.message,
            description: milestone.description,
            unlocked: this.unlockedAchievements.has(milestone.seconds),
            formattedTime: this.formatTime(milestone.seconds * 1000)
        }));
    }

    /**
     * Get unlocked achievements
     * @returns {Array} Array of unlocked achievement objects
     */
    getUnlockedAchievements() {
        return this.milestones
            .filter(milestone => this.unlockedAchievements.has(milestone.seconds))
            .map(milestone => ({
                seconds: milestone.seconds,
                message: milestone.message,
                description: milestone.description,
                formattedTime: this.formatTime(milestone.seconds * 1000)
            }));
    }

    /**
     * Get next milestone to achieve
     * @returns {Object|null} Next milestone object or null if all unlocked
     */
    getNextMilestone() {
        for (const milestone of this.milestones) {
            if (!this.unlockedAchievements.has(milestone.seconds)) {
                return {
                    seconds: milestone.seconds,
                    message: milestone.message,
                    description: milestone.description,
                    formattedTime: this.formatTime(milestone.seconds * 1000)
                };
            }
        }
        return null; // All milestones unlocked
    }

    /**
     * Get achievement progress statistics
     * @returns {Object} Progress statistics
     */
    getProgress() {
        const totalMilestones = this.milestones.length;
        const unlockedCount = this.unlockedAchievements.size;
        const progressPercentage = Math.round((unlockedCount / totalMilestones) * 100);

        return {
            totalMilestones,
            unlockedCount,
            progressPercentage,
            allUnlocked: unlockedCount === totalMilestones
        };
    }

    /**
     * Reset session achievements (call when starting new game)
     */
    resetSession() {
        this.sessionAchievements.clear();
    }

    /**
     * Clear all achievement progress
     */
    clearProgress() {
        this.unlockedAchievements.clear();
        this.sessionAchievements.clear();
        try {
            if (this.isLocalStorageAvailable()) {
                localStorage.removeItem(this.storageKey);
            }
        } catch (error) {
            console.warn('Error clearing achievement progress:', error);
        }
    }

    /**
     * Check if a specific milestone is unlocked
     * @param {number} seconds - Milestone seconds to check
     * @returns {boolean} True if milestone is unlocked
     */
    isMilestoneUnlocked(seconds) {
        return this.unlockedAchievements.has(seconds);
    }

    /**
     * Format time in milliseconds to MM:SS format for achievements
     * @param {number} timeMs - Time in milliseconds
     * @returns {string} Formatted time string
     */
    formatTime(timeMs) {
        if (typeof timeMs !== 'number' || timeMs < 0 || !isFinite(timeMs)) {
            return "00:00";
        }

        const totalSeconds = Math.floor(timeMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
     * Get achievement system statistics for debugging
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        return {
            totalMilestones: this.milestones.length,
            unlockedCount: this.unlockedAchievements.size,
            sessionAchievements: Array.from(this.sessionAchievements),
            storageAvailable: this.isLocalStorageAvailable(),
            nextMilestone: this.getNextMilestone()
        };
    }
}

module.exports = { AchievementSystem };