class AIController {
    constructor(personality = 'defensive') {
        this.aiState = 'DEFENSIVE';
        this.aiStateCooldown = 0;
        this.personality = personality;
        this.erraticTurnCounter = 0;
        this.erraticTurnInterval = this.getRandomTurnInterval();
    }

    calculateAIDirection(gameState, config = {}) {
        // Validate input parameters
        if (!gameState || !gameState.ai || !gameState.player || !gameState.aiDirection) {
            return { newDirection: { x: 1, z: 0 }, newState: 'DEFENSIVE' };
        }

        // Respect pause state - return current direction without changes when paused
        if (gameState.isPaused) {
            return { newDirection: gameState.aiDirection, newState: this.aiState };
        }

        // Route to personality-specific behavior
        switch (this.personality) {
            case 'aggressive':
                return this.aggressiveBehavior(gameState, config);
            case 'defensive':
                return this.defensiveBehavior(gameState, config);
            case 'erratic':
                return this.erraticBehavior(gameState, config);
            default:
                return this.defensiveBehavior(gameState, config);
        }
    }

    runDefensiveCheck(gameState) {
        // Validate input parameters
        if (!gameState || !gameState.ai || !gameState.aiDirection) {
            return { forward: 0, left: 0, right: 0 };
        }

        // Respect pause state - return cached whisker distances when paused
        if (gameState.isPaused) {
            return this.lastWhiskerDistances || { forward: 20, left: 20, right: 20 };
        }

        const { ai, aiDirection, bounds = 30 } = gameState;

        // Get dynamic boundaries if available, otherwise use static bounds
        const currentBounds = this.getCurrentBoundaries(gameState);

        const whiskers = {
            forward: { x: aiDirection.x, z: aiDirection.z },
            left: { x: aiDirection.z, z: -aiDirection.x },
            right: { x: -aiDirection.z, z: aiDirection.x },
        };

        // Adapt whisker length based on arena size for better performance in smaller spaces
        const whiskerLength = this.adaptWhiskerLength(currentBounds, gameState.dynamicBounds);

        // Collect all obstacle trails - include player trail and all other AI trails
        const obstacles = this.getAllObstacleTrails(ai.id || 'ai', gameState);

        const whiskerDistances = {
            forward: whiskerLength,
            left: whiskerLength,
            right: whiskerLength,
        };

        for (const [direction, whisker] of Object.entries(whiskers)) {
            for (let i = 1; i <= whiskerLength; i++) {
                const checkX = ai.x + whisker.x * i * 0.1;
                const checkZ = ai.z + whisker.z * i * 0.1;

                let collision = false;

                // Use dynamic boundary collision detection
                if (this.isOutsideBounds(checkX, checkZ, currentBounds)) {
                    collision = true;
                }

                if (!collision) {
                    for (const segment of obstacles) {
                        if (
                            segment &&
                            typeof segment.x === 'number' &&
                            typeof segment.z === 'number'
                        ) {
                            if (
                                Math.abs(checkX - segment.x) < 0.15 &&
                                Math.abs(checkZ - segment.z) < 0.15
                            ) {
                                collision = true;
                                break;
                            }
                        }
                    }
                }

                if (collision) {
                    whiskerDistances[direction] = i;
                    break;
                }
            }
        }

        // Cache whisker distances for pause state
        this.lastWhiskerDistances = whiskerDistances;
        return whiskerDistances;
    }

    /**
     * Get all obstacle trails for an AI entity (player trail + other AI trails)
     * Treats all entities as equal threats for fair pathfinding
     * @param {string} aiId - Current AI entity ID
     * @param {Object} gameState - Current game state
     * @returns {Array} Combined obstacle trails
     */
    getAllObstacleTrails(aiId, gameState) {
        const obstacles = [];

        // Add player trail as obstacle
        if (gameState.playerTrail) {
            obstacles.push(...gameState.playerTrail);
        }

        // Add other AI trails as obstacles (multi-AI support)
        if (gameState.aiOpponents) {
            gameState.aiOpponents.forEach((otherAI) => {
                if (otherAI.id !== aiId && otherAI.alive && otherAI.trail) {
                    // Exclude recent segments from other AI trails to prevent immediate collision
                    const excludeRecentSegments = 10;
                    const trailToAdd =
                        otherAI.trail.length > excludeRecentSegments
                            ? otherAI.trail.slice(0, otherAI.trail.length - excludeRecentSegments)
                            : otherAI.trail; // Include all segments if trail is short
                    obstacles.push(...trailToAdd);
                }
            });
        }

        // Add own trail as obstacle (self-collision avoidance)
        // First check if we have the current AI in aiOpponents
        if (gameState.aiOpponents) {
            const currentAI = gameState.aiOpponents.find((ai) => ai.id === aiId);
            if (currentAI && currentAI.trail && currentAI.trail.length > 10) {
                obstacles.push(...currentAI.trail.slice(0, currentAI.trail.length - 10));
            }
        }

        // Legacy support - add own trail from gameState.aiTrail if available
        if (gameState.aiTrail && gameState.aiTrail.length > 10) {
            obstacles.push(...gameState.aiTrail.slice(0, gameState.aiTrail.length - 10));
        }

        return obstacles;
    }

    /**
     * Get current boundaries from game state (dynamic or static)
     * @param {Object} gameState - Current game state
     * @returns {Object} Boundary coordinates {minX, maxX, minZ, maxZ}
     */
    getCurrentBoundaries(gameState) {
        // Check if dynamic boundaries are available (Arena Shrink mode)
        if (gameState.dynamicBounds) {
            return gameState.dynamicBounds;
        }

        // Fall back to static boundaries - use the original logic for compatibility
        const bounds = gameState.bounds || 30;
        return {
            minX: -bounds,
            maxX: bounds,
            minZ: -bounds,
            maxZ: bounds,
            size: bounds * 2,
        };
    }

    /**
     * Check if a position is outside the current boundaries
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @param {Object} boundaries - Boundary coordinates
     * @returns {boolean} True if position is outside bounds
     */
    isOutsideBounds(x, z, boundaries) {
        return (
            x <= boundaries.minX ||
            x >= boundaries.maxX ||
            z <= boundaries.minZ ||
            z >= boundaries.maxZ
        );
    }

    /**
     * Adapt whisker length based on arena size for better performance in smaller spaces
     * Only applies in Arena Shrink mode with dynamic boundaries
     * @param {Object} boundaries - Current boundary coordinates
     * @param {boolean} hasDynamicBounds - Whether dynamic boundaries are active
     * @returns {number} Adapted whisker length
     */
    adaptWhiskerLength(boundaries, hasDynamicBounds) {
        // Only adapt whisker length if we have dynamic boundaries (Arena Shrink mode)
        if (!hasDynamicBounds) {
            return 20; // Default whisker length for static modes
        }

        const arenaSize = boundaries.size || boundaries.maxX - boundaries.minX;

        // Scale whisker length based on arena size
        // Minimum 8 units for very small arenas, maximum 20 for large arenas
        const baseLength = 20;
        const minLength = 8;
        const scaleFactor = Math.max(0.4, arenaSize / 30); // Scale down for smaller arenas

        return Math.max(minLength, Math.floor(baseLength * scaleFactor));
    }

    /**
     * Adapt turn threshold based on arena size to maintain competitive behavior
     * Only applies in Arena Shrink mode with dynamic boundaries
     * @param {Object} gameState - Current game state
     * @param {number} baseTurnThreshold - Base turn threshold from config
     * @returns {number} Adapted turn threshold
     */
    adaptTurnThresholdForArenaSize(gameState, baseTurnThreshold) {
        // Only adapt threshold if we have dynamic boundaries (Arena Shrink mode)
        if (!gameState.dynamicBounds) {
            return baseTurnThreshold;
        }

        const boundaries = this.getCurrentBoundaries(gameState);
        const arenaSize = boundaries.size || boundaries.maxX - boundaries.minX;

        // Reduce turn threshold in smaller arenas to make AI more reactive
        // This prevents the AI from being too aggressive in confined spaces
        const scaleFactor = Math.max(0.5, arenaSize / 30); // Scale down for smaller arenas

        return Math.max(3, Math.floor(baseTurnThreshold * scaleFactor));
    }

    /**
     * Aggressive AI behavior - actively pursues the player
     * @param {Object} gameState - Current game state
     * @param {Object} config - Configuration parameters
     * @returns {Object} Direction and state result
     */
    aggressiveBehavior(gameState, config = {}) {
        const turnThreshold = config.turnThreshold || 8; // More aggressive threshold
        const randomTurnChance = config.randomTurnChance || 0.01; // Less random

        const { ai, player, aiDirection } = gameState;
        const whiskerDistances = this.runDefensiveCheck(gameState);
        const adaptedTurnThreshold = this.adaptTurnThresholdForArenaSize(gameState, turnThreshold);

        let newDirection = aiDirection;

        // First priority: avoid immediate collisions
        if (whiskerDistances.forward < adaptedTurnThreshold) {
            // Turn to the side with more clearance
            if (whiskerDistances.left > whiskerDistances.right) {
                newDirection = { x: aiDirection.z, z: -aiDirection.x };
            } else {
                newDirection = { x: -aiDirection.z, z: aiDirection.x };
            }
        } else {
            // Second priority: pursue the player
            const playerDirection = this.calculatePlayerDirection(ai, player);

            // If we can safely turn toward the player, do so
            if (this.canSafelyTurnToward(playerDirection, whiskerDistances, adaptedTurnThreshold)) {
                newDirection = playerDirection;
            } else if (Math.random() < randomTurnChance) {
                // Occasional random turn for unpredictability
                newDirection =
                    Math.random() > 0.5
                        ? { x: aiDirection.z, z: -aiDirection.x }
                        : { x: -aiDirection.z, z: aiDirection.x };
            }
        }

        return { newDirection, newState: 'AGGRESSIVE' };
    }

    /**
     * Defensive AI behavior - focuses on survival (existing behavior as baseline)
     * @param {Object} gameState - Current game state
     * @param {Object} config - Configuration parameters
     * @returns {Object} Direction and state result
     */
    defensiveBehavior(gameState, config = {}) {
        // Extract difficulty configuration with default fallback values
        const turnThreshold = config.turnThreshold || 10;
        const randomTurnChance = config.randomTurnChance || 0.02;

        const { aiDirection } = gameState;
        const whiskerDistances = this.runDefensiveCheck(gameState);

        let newDirection = aiDirection;

        // Adapt turn threshold for smaller arenas to maintain competitive behavior
        const adaptedTurnThreshold = this.adaptTurnThresholdForArenaSize(gameState, turnThreshold);

        // Turn away from boundaries using adapted threshold and add configurable random turns
        if (whiskerDistances.forward < adaptedTurnThreshold) {
            // Turn to the side with more clearance
            if (whiskerDistances.left > whiskerDistances.right) {
                newDirection = { x: aiDirection.z, z: -aiDirection.x };
            } else {
                newDirection = { x: -aiDirection.z, z: aiDirection.x };
            }
        } else if (Math.random() < randomTurnChance) {
            // Configurable random turn to make movement less predictable
            newDirection =
                Math.random() > 0.5
                    ? { x: aiDirection.z, z: -aiDirection.x }
                    : { x: -aiDirection.z, z: aiDirection.x };
        }

        return { newDirection, newState: 'DEFENSIVE' };
    }

    /**
     * Erratic AI behavior - combines defensive pathfinding with random turn decisions
     * @param {Object} gameState - Current game state
     * @param {Object} config - Configuration parameters
     * @returns {Object} Direction and state result
     */
    erraticBehavior(gameState, config = {}) {
        const turnThreshold = config.turnThreshold || 10;
        const randomTurnChance = config.randomTurnChance || 0.02;

        const { aiDirection } = gameState;
        const whiskerDistances = this.runDefensiveCheck(gameState);
        const adaptedTurnThreshold = this.adaptTurnThresholdForArenaSize(gameState, turnThreshold);

        let newDirection = aiDirection;

        // Increment turn counter
        this.erraticTurnCounter++;

        // First priority: avoid immediate collisions (defensive behavior)
        if (whiskerDistances.forward < adaptedTurnThreshold) {
            // Turn to the side with more clearance
            if (whiskerDistances.left > whiskerDistances.right) {
                newDirection = { x: aiDirection.z, z: -aiDirection.x };
            } else {
                newDirection = { x: -aiDirection.z, z: aiDirection.x };
            }
            // Reset erratic turn counter after collision avoidance
            this.erraticTurnCounter = 0;
            this.erraticTurnInterval = this.getRandomTurnInterval();
        } else if (this.erraticTurnCounter >= this.erraticTurnInterval) {
            // Time for an erratic turn - random direction change
            newDirection =
                Math.random() > 0.5
                    ? { x: aiDirection.z, z: -aiDirection.x }
                    : { x: -aiDirection.z, z: aiDirection.x };

            // Reset counter and get new random interval
            this.erraticTurnCounter = 0;
            this.erraticTurnInterval = this.getRandomTurnInterval();
        } else if (Math.random() < randomTurnChance) {
            // Additional random turns for extra unpredictability
            newDirection =
                Math.random() > 0.5
                    ? { x: aiDirection.z, z: -aiDirection.x }
                    : { x: -aiDirection.z, z: aiDirection.x };
        }

        return { newDirection, newState: 'ERRATIC' };
    }

    /**
     * Calculate direction toward the player
     * @param {Object} ai - AI position
     * @param {Object} player - Player position
     * @returns {Object} Direction vector toward player
     */
    calculatePlayerDirection(ai, player) {
        const dx = player.x - ai.x;
        const dz = player.z - ai.z;

        // Determine primary direction toward player
        if (Math.abs(dx) > Math.abs(dz)) {
            return dx > 0 ? { x: 1, z: 0 } : { x: -1, z: 0 };
        } else {
            return dz > 0 ? { x: 0, z: 1 } : { x: 0, z: -1 };
        }
    }

    /**
     * Check if AI can safely turn toward a specific direction
     * @param {Object} targetDirection - Direction to check
     * @param {Object} whiskerDistances - Current whisker distances
     * @param {number} threshold - Safety threshold
     * @returns {boolean} True if safe to turn
     */
    canSafelyTurnToward(targetDirection, whiskerDistances, threshold) {
        // Determine which whisker corresponds to the target direction
        // This is a simplified check - in a full implementation, we'd need to
        // calculate whisker distances for the target direction

        // For now, ensure we have sufficient clearance in all directions
        return (
            whiskerDistances.forward >= threshold &&
            whiskerDistances.left >= threshold / 2 &&
            whiskerDistances.right >= threshold / 2
        );
    }

    /**
     * Generate random turn interval for erratic behavior (20-40 frames)
     * @returns {number} Random interval between 20 and 40
     */
    getRandomTurnInterval() {
        return Math.floor(Math.random() * 21) + 20; // 20-40 frames
    }
}

/**
 * AI Coordination System - prevents identical moves and manages AI decision timing
 */
class AICoordinator {
    constructor() {
        this.recentDecisions = new Map(); // Track recent AI decisions
        this.decisionHistory = []; // Store last few decisions for conflict detection
        this.maxHistorySize = 10;
        this.staggeredTiming = false; // Option for staggered decision timing
        this.frameOffset = 0; // Current frame offset for staggered timing
    }

    /**
     * Coordinate AI decisions to prevent identical moves
     * @param {Array} aiEntities - Array of AI entities with their controllers
     * @param {Object} gameState - Current game state
     * @param {Object} config - Configuration parameters
     * @returns {Array} Array of coordinated AI decisions
     */
    coordinateAIDecisions(aiEntities, gameState, config = {}) {
        const decisions = [];
        const currentDecisions = new Map();

        // Calculate initial decisions for all AIs
        for (let i = 0; i < aiEntities.length; i++) {
            const entity = aiEntities[i];
            if (!entity.alive || !entity.controller) continue;

            // Apply staggered timing if enabled
            if (this.staggeredTiming && this.shouldSkipFrame(i)) {
                // Use previous decision or current direction
                const lastDecision = this.getLastDecision(entity.id);
                decisions.push({
                    entityId: entity.id,
                    newDirection: lastDecision || entity.direction,
                    newState: entity.controller.aiState,
                    skipped: true,
                });
                continue;
            }

            // Calculate AI decision
            const entityGameState = this.createEntityGameState(entity, gameState);
            const decision = entity.controller.calculateAIDirection(entityGameState, config);

            decisions.push({
                entityId: entity.id,
                newDirection: decision.newDirection,
                newState: decision.newState,
                skipped: false,
            });

            // Track this decision for conflict detection
            const directionKey = this.getDirectionKey(decision.newDirection);
            if (!currentDecisions.has(directionKey)) {
                currentDecisions.set(directionKey, []);
            }
            currentDecisions.get(directionKey).push(i);
        }

        // Resolve conflicts where multiple AIs chose identical moves
        this.resolveDecisionConflicts(decisions, aiEntities, gameState, config);

        // Update decision history
        this.updateDecisionHistory(decisions);

        return decisions;
    }

    /**
     * Resolve conflicts when multiple AIs make identical decisions
     * @param {Array} decisions - Array of AI decisions
     * @param {Array} aiEntities - Array of AI entities
     * @param {Object} gameState - Current game state
     * @param {Object} config - Configuration parameters
     */
    resolveDecisionConflicts(decisions, aiEntities, gameState, config) {
        const directionGroups = new Map();

        // Group decisions by direction
        decisions.forEach((decision, index) => {
            if (decision.skipped) return;

            const directionKey = this.getDirectionKey(decision.newDirection);
            if (!directionGroups.has(directionKey)) {
                directionGroups.set(directionKey, []);
            }
            directionGroups.get(directionKey).push({ decision, index, entity: aiEntities[index] });
        });

        // Resolve conflicts for groups with multiple AIs
        directionGroups.forEach((group, directionKey) => {
            if (group.length > 1) {
                this.resolveGroupConflict(group, gameState, config);
            }
        });
    }

    /**
     * Resolve conflict within a group of AIs making the same decision
     * @param {Array} group - Group of AIs with identical decisions
     * @param {Object} gameState - Current game state
     * @param {Object} config - Configuration parameters
     */
    resolveGroupConflict(group, gameState, config) {
        // Sort by priority: aggressive > defensive > erratic
        const priorityOrder = { aggressive: 3, defensive: 2, erratic: 1 };

        group.sort((a, b) => {
            const priorityA = priorityOrder[a.entity.controller.personality] || 0;
            const priorityB = priorityOrder[b.entity.controller.personality] || 0;
            return priorityB - priorityA;
        });

        // Let the highest priority AI keep its decision
        // Force others to choose alternative directions
        for (let i = 1; i < group.length; i++) {
            const { decision, entity } = group[i];
            const alternativeDirection = this.findAlternativeDirection(
                entity,
                decision.newDirection,
                gameState,
                config
            );

            decision.newDirection = alternativeDirection;
        }
    }

    /**
     * Find an alternative direction for an AI to avoid conflicts
     * @param {Object} entity - AI entity
     * @param {Object} originalDirection - Original chosen direction
     * @param {Object} gameState - Current game state
     * @param {Object} config - Configuration parameters
     * @returns {Object} Alternative direction
     */
    findAlternativeDirection(entity, originalDirection, gameState, config) {
        const currentDirection = entity.direction;

        // Generate possible alternative directions (left and right turns)
        const alternatives = [
            { x: currentDirection.z, z: -currentDirection.x }, // Left turn
            { x: -currentDirection.z, z: currentDirection.x }, // Right turn
        ];

        // Filter out the original direction
        const validAlternatives = alternatives.filter(
            (alt) => !this.directionsEqual(alt, originalDirection)
        );

        if (validAlternatives.length === 0) {
            return currentDirection; // Fallback to current direction
        }

        // Choose the safest alternative using whisker detection
        const entityGameState = this.createEntityGameState(entity, gameState);
        const whiskerDistances = entity.controller.runDefensiveCheck(entityGameState);

        // Simple heuristic: choose the direction with more clearance
        if (validAlternatives.length === 1) {
            return validAlternatives[0];
        }

        // If we have both left and right, choose based on whisker distances
        const leftTurn = { x: currentDirection.z, z: -currentDirection.x };
        const rightTurn = { x: -currentDirection.z, z: currentDirection.x };

        if (this.directionsEqual(validAlternatives[0], leftTurn)) {
            return whiskerDistances.left >= whiskerDistances.right ? leftTurn : rightTurn;
        } else {
            return whiskerDistances.right >= whiskerDistances.left ? rightTurn : leftTurn;
        }
    }

    /**
     * Create entity-specific game state for AI decision making
     * @param {Object} entity - AI entity
     * @param {Object} gameState - Global game state
     * @returns {Object} Entity-specific game state
     */
    createEntityGameState(entity, gameState) {
        return {
            ...gameState,
            ai: entity,
            aiDirection: entity.direction,
            aiTrail: entity.trail,
            // Keep original playerTrail for whisker detection
            playerTrail: gameState.playerTrail || [],
            // Ensure aiOpponents is available for multi-entity obstacle detection
            aiOpponents: gameState.aiOpponents || [],
        };
    }

    /**
     * Get trails from other AI entities (excluding the current one)
     * @param {string} currentEntityId - ID of current AI entity
     * @param {Array} aiOpponents - Array of all AI opponents
     * @returns {Array} Combined trails from other AIs
     */
    getOtherAITrails(currentEntityId, aiOpponents) {
        const otherTrails = [];

        aiOpponents.forEach((ai) => {
            if (ai.id !== currentEntityId && ai.alive && ai.trail) {
                otherTrails.push(...ai.trail);
            }
        });

        return otherTrails;
    }

    /**
     * Check if AI should skip this frame for staggered timing
     * @param {number} entityIndex - Index of the AI entity
     * @returns {boolean} True if should skip this frame
     */
    shouldSkipFrame(entityIndex) {
        if (!this.staggeredTiming) return false;

        // Stagger every other frame for different AIs
        return (this.frameOffset + entityIndex) % 2 === 1;
    }

    /**
     * Update frame offset for staggered timing
     */
    updateFrameOffset() {
        this.frameOffset = (this.frameOffset + 1) % 2;
    }

    /**
     * Get the last decision for an entity
     * @param {string} entityId - Entity ID
     * @returns {Object|null} Last direction or null
     */
    getLastDecision(entityId) {
        return this.recentDecisions.get(entityId) || null;
    }

    /**
     * Update decision history for tracking
     * @param {Array} decisions - Array of current decisions
     */
    updateDecisionHistory(decisions) {
        // Store decisions in recent decisions map
        decisions.forEach((decision) => {
            this.recentDecisions.set(decision.entityId, decision.newDirection);
        });

        // Add to history for analysis
        this.decisionHistory.push({
            frame: Date.now(),
            decisions: decisions.map((d) => ({
                entityId: d.entityId,
                direction: this.getDirectionKey(d.newDirection),
            })),
        });

        // Trim history to max size
        if (this.decisionHistory.length > this.maxHistorySize) {
            this.decisionHistory.shift();
        }
    }

    /**
     * Get a string key for a direction vector
     * @param {Object} direction - Direction vector {x, z}
     * @returns {string} Direction key
     */
    getDirectionKey(direction) {
        return `${direction.x},${direction.z}`;
    }

    /**
     * Check if two directions are equal
     * @param {Object} dir1 - First direction
     * @param {Object} dir2 - Second direction
     * @returns {boolean} True if directions are equal
     */
    directionsEqual(dir1, dir2) {
        return dir1.x === dir2.x && dir1.z === dir2.z;
    }

    /**
     * Enable or disable staggered timing
     * @param {boolean} enabled - Whether to enable staggered timing
     */
    setStaggeredTiming(enabled) {
        this.staggeredTiming = enabled;
    }

    /**
     * Get coordination statistics for performance monitoring
     * @returns {Object} Statistics about AI coordination
     */
    getCoordinationStats() {
        const recentConflicts = this.decisionHistory.slice(-5).reduce((count, frame) => {
            const directions = frame.decisions.map((d) => d.direction);
            const uniqueDirections = new Set(directions);
            return count + (directions.length - uniqueDirections.size);
        }, 0);

        return {
            recentConflicts,
            historySize: this.decisionHistory.length,
            staggeredTiming: this.staggeredTiming,
            trackedEntities: this.recentDecisions.size,
        };
    }
}

module.exports = { AIController, AICoordinator };
