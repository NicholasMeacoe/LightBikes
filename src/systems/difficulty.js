/**
 * Difficulty configuration system for LightBikes
 * Manages difficulty levels and applies settings to game systems
 */

const { Logger } = require('../utils/Logger');
const logger = Logger.create('DifficultyManager');

// Configuration object defining parameters for each difficulty level
const DIFFICULTY_CONFIGS = {
    easy: {
        turnThreshold: 15,
        randomTurnChance: 0.05,
        gameSpeed: 0.08,
        description: 'Slower AI, more predictable behavior',
    },
    medium: {
        turnThreshold: 10,
        randomTurnChance: 0.02,
        gameSpeed: 0.1,
        description: 'Balanced gameplay experience',
    },
    hard: {
        turnThreshold: 8,
        randomTurnChance: 0.01,
        gameSpeed: 0.12,
        description: 'Faster AI, more challenging gameplay',
    },
};

/**
 * DifficultyManager class - Central controller for difficulty settings
 * Manages difficulty selection, persistence, and integration with game systems
 */
class DifficultyManager {
    /**
     * Initialize DifficultyManager with game and AI controller references
     * @param {Object} game - Game instance for speed control
     * @param {Object} aiController - AI controller for behavior configuration
     */
    constructor(game, aiController) {
        this.game = game;
        this.aiController = aiController;
        this.currentDifficulty = 'medium'; // Default difficulty
        this.storageKey = 'lightbikes_difficulty';

        // Validate all difficulty configurations on initialization
        if (!this.validateAllConfigurations()) {
            logger.warn('Difficulty system initialized with invalid configurations');
        }

        // Validate constructor parameters
        if (game && typeof game !== 'object') {
            logger.warn('Invalid game parameter provided to DifficultyManager');
        }

        if (aiController && typeof aiController !== 'object') {
            logger.warn('Invalid aiController parameter provided to DifficultyManager');
        }

        // Load saved difficulty from storage
        this.loadFromStorage();

        // Apply the loaded (or default) difficulty settings to game systems
        this.applyToGame();
        this.applyToAI();
    }

    /**
     * Set the current difficulty level and apply changes to game systems
     * @param {string} level - Difficulty level ('easy', 'medium', 'hard')
     */
    setDifficulty(level) {
        // Validate input type and convert to string if needed
        if (typeof level !== 'string') {
            logger.warn(`Invalid difficulty type: ${typeof level}, expected string. Using medium`);
            level = 'medium';
        } else {
            // Normalize input (trim whitespace and convert to lowercase)
            level = level.trim().toLowerCase();
        }

        // Validate difficulty level exists in configuration
        if (!DIFFICULTY_CONFIGS[level]) {
            logger.warn(
                `Invalid difficulty level: "${level}", using medium. Valid options: ${Object.keys(DIFFICULTY_CONFIGS).join(', ')}`
            );
            level = 'medium';
        }

        // Validate configuration integrity before applying
        const config = DIFFICULTY_CONFIGS[level];
        if (!this._validateDifficultyConfig(config, level)) {
            logger.warn(`Invalid configuration for difficulty "${level}", falling back to medium`);
            level = 'medium';
        }

        this.currentDifficulty = level;

        // Apply changes to game systems with error handling
        try {
            this.applyToGame();
            this.applyToAI();
        } catch (error) {
            logger.warn(`Error applying difficulty settings for "${level}":`, error);
            // Continue with the difficulty set, but log the error
        }

        // Persist the selection
        this.saveToStorage();
    }

    /**
     * Get the current difficulty level
     * @returns {string} Current difficulty level
     */
    getCurrentDifficulty() {
        return this.currentDifficulty;
    }

    /**
     * Get configuration object for a specific difficulty level
     * @param {string} level - Difficulty level (optional, defaults to current)
     * @returns {Object} Configuration object for the difficulty level
     */
    getDifficultyConfig(level = null) {
        let targetLevel = level || this.currentDifficulty;

        // Validate and normalize input if provided
        if (level !== null) {
            if (typeof level !== 'string') {
                logger.warn(
                    `Invalid difficulty type in getDifficultyConfig: ${typeof level}, using current difficulty`
                );
                targetLevel = this.currentDifficulty;
            } else {
                targetLevel = level.trim().toLowerCase();
            }
        }

        // Ensure we have a valid configuration
        const config = DIFFICULTY_CONFIGS[targetLevel];
        if (!config) {
            logger.warn(`Configuration not found for difficulty "${targetLevel}", using medium`);
            return DIFFICULTY_CONFIGS.medium;
        }

        // Validate configuration integrity
        if (!this._validateDifficultyConfig(config, targetLevel)) {
            logger.warn(`Invalid configuration structure for "${targetLevel}", using medium`);
            return DIFFICULTY_CONFIGS.medium;
        }

        return config;
    }

    /**
     * Apply current difficulty settings to the game system
     * Updates game speed based on current difficulty
     */
    applyToGame() {
        if (!this.game) {
            logger.warn('Game instance not available, cannot apply difficulty settings');
            return;
        }

        if (typeof this.game.setGameSpeed !== 'function') {
            logger.warn('Game instance missing setGameSpeed method, cannot apply speed settings');
            return;
        }

        try {
            const config = this.getDifficultyConfig();

            // Validate game speed value
            if (
                typeof config.gameSpeed !== 'number' ||
                config.gameSpeed <= 0 ||
                config.gameSpeed > 1
            ) {
                logger.warn(`Invalid game speed value: ${config.gameSpeed}, using default 0.1`);
                this.game.setGameSpeed(0.1);
            } else {
                this.game.setGameSpeed(config.gameSpeed);
            }
        } catch (error) {
            logger.warn('Error applying game speed settings:', error);
            // Try to set a safe default speed
            try {
                this.game.setGameSpeed(0.1);
            } catch (fallbackError) {
                logger.warn('Failed to set fallback game speed:', fallbackError);
            }
        }
    }

    /**
     * Apply current difficulty settings to the AI system
     * Updates AI behavior parameters based on current difficulty
     */
    applyToAI() {
        if (!this.aiController) {
            logger.warn('AI controller not available, cannot apply difficulty settings');
            return;
        }

        try {
            const config = this.getDifficultyConfig();

            // Validate AI configuration values
            if (typeof config.turnThreshold !== 'number' || config.turnThreshold <= 0) {
                logger.warn(
                    `Invalid turnThreshold value: ${config.turnThreshold}, using default 10`
                );
                config.turnThreshold = 10;
            }

            if (
                typeof config.randomTurnChance !== 'number' ||
                config.randomTurnChance < 0 ||
                config.randomTurnChance > 1
            ) {
                logger.warn(
                    `Invalid randomTurnChance value: ${config.randomTurnChance}, using default 0.02`
                );
                config.randomTurnChance = 0.02;
            }

            // AI controller will receive config parameters in calculateAIDirection method
            this.aiController.difficultyConfig = config;
        } catch (error) {
            logger.warn('Error applying AI difficulty settings:', error);
            // Set a safe default configuration
            try {
                this.aiController.difficultyConfig = {
                    turnThreshold: 10,
                    randomTurnChance: 0.02,
                    gameSpeed: 0.1,
                    description: 'Default fallback configuration',
                };
            } catch (fallbackError) {
                logger.warn('Failed to set fallback AI configuration:', fallbackError);
            }
        }
    }

    /**
     * Save current difficulty selection to localStorage
     * Handles storage errors gracefully without disrupting gameplay
     */
    saveToStorage() {
        try {
            // Check if localStorage is available
            if (typeof Storage === 'undefined' || !window.localStorage) {
                logger.warn('localStorage not available, cannot save difficulty setting');
                return;
            }

            // Validate current difficulty before saving
            if (!this.currentDifficulty || !DIFFICULTY_CONFIGS[this.currentDifficulty]) {
                logger.warn(`Invalid current difficulty "${this.currentDifficulty}", cannot save`);
                return;
            }

            const data = {
                selectedDifficulty: this.currentDifficulty,
                timestamp: Date.now(),
                version: '1.0', // For future compatibility
            };

            const serializedData = JSON.stringify(data);

            // Check if we can actually store the data (quota limits)
            try {
                localStorage.setItem(this.storageKey, serializedData);
            } catch (quotaError) {
                if (
                    quotaError.name === 'QuotaExceededError' ||
                    quotaError.name === 'NS_ERROR_DOM_QUOTA_REACHED'
                ) {
                    logger.warn('localStorage quota exceeded, cannot save difficulty setting');
                } else {
                    throw quotaError; // Re-throw if it's a different error
                }
            }
        } catch (error) {
            logger.warn('Failed to save difficulty setting:', error);
            // Continue silently - storage failure shouldn't affect gameplay
        }
    }

    /**
     * Load difficulty selection from localStorage
     * Falls back to medium difficulty if storage read fails
     */
    loadFromStorage() {
        try {
            // Check if localStorage is available
            if (typeof Storage === 'undefined' || !window.localStorage) {
                logger.warn('localStorage not available, using default difficulty');
                return;
            }

            const stored = localStorage.getItem(this.storageKey);
            if (!stored) {
                // No stored data, use default
                return;
            }

            let data;
            try {
                data = JSON.parse(stored);
            } catch (parseError) {
                logger.warn('Failed to parse stored difficulty data, using default:', parseError);
                // Clear corrupted data
                this._clearCorruptedStorage();
                return;
            }

            // Validate stored data structure
            if (!data || typeof data !== 'object') {
                logger.warn('Invalid stored difficulty data structure, using default');
                this._clearCorruptedStorage();
                return;
            }

            // Validate difficulty value
            if (
                data.selectedDifficulty &&
                typeof data.selectedDifficulty === 'string' &&
                DIFFICULTY_CONFIGS[data.selectedDifficulty.toLowerCase()]
            ) {
                this.currentDifficulty = data.selectedDifficulty.toLowerCase();
            } else {
                logger.warn(
                    `Invalid stored difficulty "${data.selectedDifficulty}", using default`
                );
                this._clearCorruptedStorage();
            }
        } catch (error) {
            logger.warn('Failed to load difficulty setting:', error);
            // Continue with default medium difficulty
        }
    }

    /**
     * Get all available difficulty levels with their configurations
     * @returns {Object} All difficulty configurations (deep copy)
     */
    getAllDifficulties() {
        try {
            return JSON.parse(JSON.stringify(DIFFICULTY_CONFIGS));
        } catch (error) {
            logger.warn('Error creating difficulty configurations copy:', error);
            // Return a safe fallback
            return {
                easy: {
                    turnThreshold: 15,
                    randomTurnChance: 0.05,
                    gameSpeed: 0.08,
                    description: 'Easy mode',
                },
                medium: {
                    turnThreshold: 10,
                    randomTurnChance: 0.02,
                    gameSpeed: 0.1,
                    description: 'Medium mode',
                },
                hard: {
                    turnThreshold: 8,
                    randomTurnChance: 0.01,
                    gameSpeed: 0.12,
                    description: 'Hard mode',
                },
            };
        }
    }

    /**
     * Validate difficulty configuration object
     * @param {Object} config - Configuration object to validate
     * @param {string} level - Difficulty level name for logging
     * @returns {boolean} True if configuration is valid
     * @private
     */
    _validateDifficultyConfig(config, level) {
        if (!config || typeof config !== 'object') {
            logger.warn(`Configuration for "${level}" is not an object`);
            return false;
        }

        const requiredProperties = [
            'turnThreshold',
            'randomTurnChance',
            'gameSpeed',
            'description',
        ];
        for (const prop of requiredProperties) {
            if (!(prop in config)) {
                logger.warn(`Configuration for "${level}" missing required property: ${prop}`);
                return false;
            }
        }

        // Validate numeric properties
        if (typeof config.turnThreshold !== 'number' || config.turnThreshold <= 0) {
            logger.warn(`Invalid turnThreshold for "${level}": ${config.turnThreshold}`);
            return false;
        }

        if (
            typeof config.randomTurnChance !== 'number' ||
            config.randomTurnChance < 0 ||
            config.randomTurnChance > 1
        ) {
            logger.warn(`Invalid randomTurnChance for "${level}": ${config.randomTurnChance}`);
            return false;
        }

        if (typeof config.gameSpeed !== 'number' || config.gameSpeed <= 0 || config.gameSpeed > 1) {
            logger.warn(`Invalid gameSpeed for "${level}": ${config.gameSpeed}`);
            return false;
        }

        if (typeof config.description !== 'string' || config.description.trim().length === 0) {
            logger.warn(`Invalid description for "${level}": ${config.description}`);
            return false;
        }

        return true;
    }

    /**
     * Clear corrupted data from localStorage
     * @private
     */
    _clearCorruptedStorage() {
        try {
            if (typeof Storage !== 'undefined' && window.localStorage) {
                localStorage.removeItem(this.storageKey);
            }
        } catch (error) {
            logger.warn('Failed to clear corrupted storage:', error);
        }
    }

    /**
     * Validate the integrity of all difficulty configurations
     * @returns {boolean} True if all configurations are valid
     */
    validateAllConfigurations() {
        const levels = Object.keys(DIFFICULTY_CONFIGS);
        let allValid = true;

        for (const level of levels) {
            if (!this._validateDifficultyConfig(DIFFICULTY_CONFIGS[level], level)) {
                allValid = false;
            }
        }

        if (!allValid) {
            logger.warn(
                'Some difficulty configurations are invalid. Game may not function correctly.'
            );
        }

        return allValid;
    }
}

// Export for CommonJS module system
module.exports = { DifficultyManager, DIFFICULTY_CONFIGS };
