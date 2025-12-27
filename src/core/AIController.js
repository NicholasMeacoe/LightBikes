const { createLogger } = require('../utils/Logger.js');
const logger = createLogger('AIController');

/**
 * AIController - Manages AI opponents in the game
 *
 * Handles initialization, movement, state management, and lifecycle of AI entities.
 */
class AIController {
    /**
     * @param {Object} config - Game configuration
     * @param {number} bounds - Arena bounds size
     */
    constructor(config, bounds) {
        this.config = config;
        this.bounds = bounds;
        this.opponents = [];
        this.powerUpManager = null;

        // Default personalities and colors if not provided in config
        this.personalities = config.personalities || ['aggressive', 'defensive', 'erratic'];
        this.colors = config.colors || ['red', 'blue', 'yellow', 'purple'];
    }

    /**
     * Initialize AI opponents based on configuration
     */
    initialize() {
        this.opponents = [];
        const count = this.validateAICount(this.config.aiCount);

        for (let i = 0; i < count; i++) {
            const startingPosition = this.calculateStartingPosition(i, count);
            const personality = this.assignPersonality(i);
            const color = this.assignColor(i);

            const aiOpponent = {
                id: `ai_${i + 1}`,
                x: startingPosition.x,
                y: startingPosition.y,
                z: startingPosition.z,
                direction: startingPosition.direction,
                trail: [],
                personality: personality,
                color: color,
                alive: true,
                previousPosition: { ...startingPosition },
            };

            this.opponents.push(aiOpponent);
        }

        logger.info(`Initialized ${this.opponents.length} AI opponents`);
    }

    /**
     * Validate AI count
     * @param {number} count - Requested AI count
     * @returns {number} Validated count (1-4)
     */
    validateAICount(count) {
        if (typeof count !== 'number' || count < 1 || count > 4) {
            return 1; // Default to 1
        }
        return Math.floor(count);
    }

    /**
     * Calculate starting position for AI opponent
     * @param {number} index - AI opponent index
     * @param {number} totalCount - Total number of AIs
     * @returns {Object} Starting position with direction
     */
    calculateStartingPosition(index, totalCount) {
        const arenaSize = this.bounds;
        const perimeter = arenaSize - 1;

        // For single AI, use legacy position for backward compatibility
        if (totalCount === 1) {
            return {
                x: 0,
                y: 0,
                z: -10,
                direction: { x: 1, y: 0, z: 0 },
            };
        }

        // Distribute AIs evenly around arena perimeter
        const angle = (index / totalCount) * 2 * Math.PI;
        const x = Math.round(arenaSize / 2 + (perimeter / 2) * Math.cos(angle));
        const z = Math.round(arenaSize / 2 + (perimeter / 2) * Math.sin(angle));

        // Calculate initial direction based on angle (pointing toward center)
        const directionAngle = angle + Math.PI; // Point toward center
        const direction = {
            x: Math.round(Math.cos(directionAngle)),
            y: 0,
            z: Math.round(Math.sin(directionAngle)),
        };

        // Ensure direction is normalized to valid game directions
        if (Math.abs(direction.x) > Math.abs(direction.z)) {
            direction.x = direction.x > 0 ? 1 : -1;
            direction.z = 0;
        } else {
            direction.x = 0;
            direction.z = direction.z > 0 ? 1 : -1;
        }

        return { x, y: 0, z, direction };
    }

    /**
     * Assign personality to AI opponent
     * @param {number} index - AI opponent index
     * @returns {string} AI personality
     */
    assignPersonality(index) {
        return this.personalities[index % this.personalities.length];
    }

    /**
     * Assign color to AI opponent
     * @param {number} index - AI opponent index
     * @returns {string} AI color
     */
    assignColor(index) {
        return this.colors[index % this.colors.length];
    }

    /**
     * Update AI opponents state
     * @param {number} gameSpeed - Current game speed
     */
    update(gameSpeed) {
        this.opponents.forEach((aiOpponent) => {
            if (aiOpponent.alive) {
                const aiSpeedMultiplier = this.powerUpManager
                    ? this.powerUpManager.getSpeedMultiplier('ai')
                    : 1.0;

                // Move AI with speed boost integration
                aiOpponent.x += aiOpponent.direction.x * gameSpeed * aiSpeedMultiplier;
                aiOpponent.z += aiOpponent.direction.z * gameSpeed * aiSpeedMultiplier;

                // Create AI Trail
                aiOpponent.trail.push({ x: aiOpponent.x, y: aiOpponent.y, z: aiOpponent.z });
            }
        });
    }

    /**
     * Add AI opponent to the game
     * @param {Object} aiConfig - AI configuration
     * @returns {boolean} Success status
     */
    addAI(aiConfig = {}) {
        if (this.opponents.length >= 4) {
            return false; // Maximum 4 AI opponents
        }

        const index = this.opponents.length;
        // Note: We use current length + 1 as total count approximation for positioning new add-ons,
        // or just use default logic. For dynamic adding, we might want specific logic.
        // Reusing calculateStartingPosition with current count might overlap if not careful,
        // but preserving original logic for now.
        const startingPosition = this.calculateStartingPosition(index, this.opponents.length + 1);

        const personality = aiConfig.personality || this.assignPersonality(index);
        const color = aiConfig.color || this.assignColor(index);

        const aiOpponent = {
            id: aiConfig.id || `ai_${index + 1}`,
            x: aiConfig.x || startingPosition.x,
            y: aiConfig.y || startingPosition.y,
            z: aiConfig.z || startingPosition.z,
            direction: aiConfig.direction || startingPosition.direction,
            trail: [],
            personality: personality,
            color: color,
            alive: true,
            previousPosition: {
                x: aiConfig.x || startingPosition.x,
                y: aiConfig.y || startingPosition.y,
                z: aiConfig.z || startingPosition.z,
            },
        };

        this.opponents.push(aiOpponent);
        return true;
    }

    /**
     * Remove AI opponent from the game
     * @param {string} aiId - AI opponent ID
     * @returns {boolean} Success status
     */
    removeAI(aiId) {
        const index = this.opponents.findIndex((ai) => ai.id === aiId);
        if (index === -1) {
            return false; // AI not found
        }

        this.opponents.splice(index, 1);
        return true;
    }

    /**
     * Get all alive AI entities
     * @returns {Array} Array of alive AI entities
     */
    getAliveEntities() {
        return this.opponents
            .filter((ai) => ai.alive)
            .map((ai) => ({
                id: ai.id,
                type: 'ai',
                x: ai.x,
                y: ai.y,
                z: ai.z,
                direction: ai.direction,
                trail: ai.trail,
                personality: ai.personality,
                color: ai.color,
                alive: ai.alive,
            }));
    }

    /**
     * Get all opponents
     * @returns {Array} Array of all opponents
     */
    getOpponents() {
        return this.opponents;
    }

    /**
     * Set PowerUpManager reference
     * @param {Object} powerUpManager - PowerUpManager instance
     */
    setPowerUpManager(powerUpManager) {
        this.powerUpManager = powerUpManager;
    }

    /**
     * Reset AI controller
     */
    reset() {
        this.initialize();
    }
}

module.exports = { AIController };
