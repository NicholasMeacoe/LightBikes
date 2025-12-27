/**
 * MultiAIManager - Manages multiple AI opponents and their coordination
 * Handles AI initialization, decision making, collisions, and scoring
 */

const { AIController, AICoordinator } = require('../core/ai.js');
const { Logger } = require('../utils/Logger.js');

class MultiAIManager {
    constructor(game, difficultyManager, performanceMonitor) {
        this.game = game;
        this.difficultyManager = difficultyManager;
        this.performanceMonitor = performanceMonitor;

        this.logger = Logger.create('MultiAIManager');
        this.aiControllers = [];
        this.currentAICount = 1;
        this.aiCoordinator = new AICoordinator();
    }

    /**
     * Initialize AI controllers for multi-AI support
     * @param {number} aiCount - Number of AI opponents (1-4)
     */
    initializeAIControllers(aiCount = 1) {
        // Validate AI count
        const validatedCount = Math.max(1, Math.min(4, Math.floor(aiCount)));
        this.currentAICount = validatedCount;

        // Clear existing controllers
        this.aiControllers = [];

        // Create AI controllers with different personalities
        const personalities = ['aggressive', 'defensive', 'erratic'];

        for (let i = 0; i < validatedCount; i++) {
            const personality = personalities[i % personalities.length];
            const controller = new AIController(personality);
            this.aiControllers.push(controller);
        }

        // Update difficulty manager for multi-AI (use first controller for backward compatibility)
        if (this.aiControllers.length > 0 && this.difficultyManager) {
            this.difficultyManager.setAIController(this.aiControllers[0]);
        }

        this.logger.info(`Initialized ${validatedCount} AI controllers`);
    }

    /**
     * Calculate AI directions for all AI opponents using coordination
     * @param {Object} gameState - Current game state
     * @param {Object} difficultyConfig - Difficulty configuration
     * @returns {Array} Array of AI direction decisions
     */
    calculateMultiAIDirections(gameState, difficultyConfig) {
        if (!gameState.aiOpponents || gameState.aiOpponents.length === 0) {
            return [];
        }

        // Start AI calculation performance monitoring
        if (this.performanceMonitor) {
            this.performanceMonitor.startAICalculation('multi-ai');
        }

        try {
            // Create AI entities with their controllers for coordination
            const aiEntities = gameState.aiOpponents.map((ai, index) => ({
                ...ai,
                controller: this.aiControllers[index] || this.aiControllers[0], // Fallback to first controller
            }));

            // Use AI coordinator to get coordinated decisions
            const decisions = this.aiCoordinator.coordinateAIDecisions(
                aiEntities,
                gameState,
                difficultyConfig
            );

            return decisions;
        } finally {
            // End AI calculation performance monitoring
            if (this.performanceMonitor) {
                this.performanceMonitor.endAICalculation('multi-ai');
            }
        }
    }

    /**
     * Apply AI decisions to game state
     * @param {Array} decisions - Array of AI decisions from coordinator
     */
    applyAIDecisions(decisions) {
        const gameState = this.game.getGameState();

        decisions.forEach((decision, index) => {
            if (
                gameState.aiOpponents &&
                index < gameState.aiOpponents.length &&
                gameState.aiOpponents[index].alive
            ) {
                // Update AI direction
                gameState.aiOpponents[index].direction = decision.newDirection;

                // Update controller state
                if (this.aiControllers[index]) {
                    this.aiControllers[index].aiState = decision.newState;
                }
            }
        });

        // Maintain backward compatibility - update legacy aiDirection property
        if (gameState.aiOpponents && gameState.aiOpponents.length > 0) {
            this.game.aiDirection = gameState.aiOpponents[0].direction;
        }
    }

    /**
     * Handle collision results in multi-AI games
     * Updates entity states and determines if game should end
     * @param {Object} collisionResult - Result from collision detection
     * @param {Function} updateDisplayCallback - Callback to update UI display
     */
    handleMultiAICollisions(collisionResult, updateDisplayCallback) {
        const { crashedEntities, survivingEntities, winner } = collisionResult;
        const gameState = this.game.getGameState();

        // Mark crashed AI entities as dead
        if (crashedEntities && gameState.aiOpponents) {
            crashedEntities.forEach((entityId) => {
                if (entityId.startsWith('ai_')) {
                    const aiIndex = gameState.aiOpponents.findIndex((ai) => ai.id === entityId);
                    if (aiIndex !== -1) {
                        gameState.aiOpponents[aiIndex].alive = false;
                    }
                }
            });
        }

        // Determine if game should end based on multi-AI scoring rules
        const shouldEndGame = this.determineGameEnd(survivingEntities, winner);

        if (shouldEndGame) {
            // Award points based on multi-AI victory conditions
            this.updateMultiAIScores(winner, survivingEntities);
            this.game.gameOver = true;
        }

        // Update remaining entity count display
        if (updateDisplayCallback) {
            updateDisplayCallback(survivingEntities);
        }
    }

    /**
     * Determine if the game should end in multi-AI mode
     * Game ends when player crashes OR when only player remains
     * @param {Array} survivingEntities - List of surviving entity IDs
     * @param {string} winner - Winner identifier or null
     * @returns {boolean} True if game should end
     */
    determineGameEnd(survivingEntities, winner) {
        // Game ends if player crashed
        if (!survivingEntities.includes('player')) {
            return true;
        }

        // Game ends if only player remains (player is last survivor)
        if (survivingEntities.length === 1 && survivingEntities[0] === 'player') {
            return true;
        }

        // Game continues if multiple entities survive (including player)
        return false;
    }

    /**
     * Update scores based on multi-AI game results
     * Player only gets points when they are the last survivor
     * @param {string} winner - Winner identifier
     * @param {Array} survivingEntities - List of surviving entities
     */
    updateMultiAIScores(winner, survivingEntities) {
        const scoreManager = this.game.scoreManager;
        if (!scoreManager) return;

        if (
            winner === 'player' &&
            survivingEntities.length === 1 &&
            survivingEntities[0] === 'player'
        ) {
            // Player wins by being last survivor - award points
            scoreManager.incrementPlayerScore();
        } else {
            // Player crashed or didn't achieve last survivor status - AI wins
            scoreManager.incrementAIScore();
        }
    }

    getAIControllers() {
        return this.aiControllers;
    }

    getCurrentAICount() {
        return this.currentAICount;
    }
}

module.exports = { MultiAIManager };
