class CollisionDetectionEngine {
    constructor() {
        this.powerUpManager = null; // Will be set by orchestrator
        this.cameraEffectsManager = null; // Will be set by orchestrator
    }

    /**
     * Set the PowerUpManager reference for shield and ghost mode integration
     */
    setPowerUpManager(powerUpManager) {
        this.powerUpManager = powerUpManager;
    }

    /**
     * Set the CameraEffectsManager reference for camera shake integration
     */
    setCameraEffectsManager(cameraEffectsManager) {
        this.cameraEffectsManager = cameraEffectsManager;
    }

    checkCollisions(gameState, game = null) {
        if (gameState.frameCount < 10) {
            return { playerCollided: false, aiCollided: false, winner: null };
        }

        // Respect pause state - return no collisions when paused to maintain state integrity
        if (gameState.isPaused) {
            return { playerCollided: false, aiCollided: false, winner: null };
        }

        // Check if we have multiple AI opponents (multi-entity mode)
        if (gameState.aiOpponents && gameState.aiOpponents.length > 0) {
            return this.checkAllCollisions(gameState, game);
        }

        // Legacy single-AI mode for backward compatibility
        const { player, ai, playerTrail, aiTrail, bounds } = gameState;

        // Get dynamic boundaries if game instance is provided, otherwise use static bounds
        const dynamicBounds = game ? game.getBounds() : null;
        const isGracePeriodActive = game ? game.isGracePeriodActive() : false;

        // Check collisions with power-up effect integration and dynamic boundaries
        const playerCollided = this.isCollidedWithPowerUps('player', player, playerTrail, aiTrail, bounds, dynamicBounds, isGracePeriodActive);
        const aiCollided = this.isCollidedWithPowerUps('ai', ai, aiTrail, playerTrail, bounds, dynamicBounds, isGracePeriodActive);

        // Determine winner based on collision results
        let winner = null;
        if (playerCollided && !aiCollided) {
            winner = 'ai';
        } else if (aiCollided && !playerCollided) {
            winner = 'player';
        } else if (playerCollided && aiCollided) {
            winner = 'tie';
        }

        return { playerCollided, aiCollided, winner };
    }

    /**
     * Check collisions for all entities in multi-AI games
     * Handles player vs multiple AIs and AI vs AI collisions
     * @param {Object} gameState - Current game state with aiOpponents array
     * @param {Object} game - Game instance for dynamic boundaries
     * @returns {Object} Collision results with crashed entities and winner
     */
    checkAllCollisions(gameState, game = null) {
        const { player, playerTrail, aiOpponents, bounds } = gameState;
        const crashedEntities = [];
        
        // Get dynamic boundaries if game instance is provided, otherwise use static bounds
        const dynamicBounds = game ? game.getBounds() : null;
        const isGracePeriodActive = game ? game.isGracePeriodActive() : false;

        // Collect all trails for obstacle detection
        const allTrails = [...playerTrail];
        aiOpponents.forEach(ai => {
            if (ai.alive && ai.trail) {
                allTrails.push(...ai.trail);
            }
        });

        // Check player collision against all AI trails
        const playerCollided = this.checkEntityCollision(
            'player', 
            player, 
            playerTrail, 
            this.getOtherTrails('player', gameState), 
            bounds, 
            dynamicBounds, 
            isGracePeriodActive
        );

        if (playerCollided) {
            crashedEntities.push('player');
        }

        // Check each AI collision against player trail and other AI trails
        aiOpponents.forEach(ai => {
            if (!ai.alive) return;

            const aiCollided = this.checkEntityCollision(
                ai.id, 
                ai, 
                ai.trail, 
                this.getOtherTrails(ai.id, gameState), 
                bounds, 
                dynamicBounds, 
                isGracePeriodActive
            );

            if (aiCollided) {
                crashedEntities.push(ai.id);
            }
        });

        // Determine winner based on who survived
        let winner = null;
        const survivingEntities = this.getSurvivingEntities(gameState, crashedEntities);
        
        if (survivingEntities.length === 1) {
            winner = survivingEntities[0];
        } else if (survivingEntities.length === 0) {
            winner = 'tie'; // Everyone crashed
        }
        // If multiple entities survive, game continues (winner = null)

        return {
            playerCollided: crashedEntities.includes('player'),
            aiCollided: crashedEntities.some(id => id.startsWith('ai_')),
            crashedEntities,
            survivingEntities,
            winner
        };
    }

    /**
     * Check collision for a specific entity against obstacles
     * @param {string} entityId - Entity identifier
     * @param {Object} entity - Entity position and data
     * @param {Array} ownTrail - Entity's own trail
     * @param {Array} obstacleTrails - All other trails to check against
     * @param {number} bounds - Static boundary value
     * @param {Object} dynamicBounds - Dynamic boundary object or null
     * @param {boolean} isGracePeriodActive - Whether grace period is active
     * @returns {boolean} True if entity has collided
     */
    checkEntityCollision(entityId, entity, ownTrail, obstacleTrails, bounds, dynamicBounds = null, isGracePeriodActive = false) {
        return this.isCollidedWithPowerUps(entityId, entity, ownTrail, obstacleTrails, bounds, dynamicBounds, isGracePeriodActive);
    }

    /**
     * Get all trails except the specified entity's trail
     * @param {string} entityId - Entity to exclude ('player' or AI ID)
     * @param {Object} gameState - Current game state
     * @returns {Array} Combined trails from other entities
     */
    getOtherTrails(entityId, gameState) {
        const otherTrails = [];

        // Add player trail if not the player entity
        if (entityId !== 'player' && gameState.playerTrail) {
            otherTrails.push(...gameState.playerTrail);
        }

        // Add AI trails except for the current entity
        if (gameState.aiOpponents) {
            gameState.aiOpponents.forEach(ai => {
                if (ai.id !== entityId && ai.alive && ai.trail) {
                    otherTrails.push(...ai.trail);
                }
            });
        }

        return otherTrails;
    }

    /**
     * Get list of surviving entities after crashes
     * @param {Object} gameState - Current game state
     * @param {Array} crashedEntities - List of crashed entity IDs
     * @returns {Array} List of surviving entity IDs
     */
    getSurvivingEntities(gameState, crashedEntities) {
        const survivors = [];

        // Check if player survived
        if (!crashedEntities.includes('player')) {
            survivors.push('player');
        }

        // Check which AIs survived
        if (gameState.aiOpponents) {
            gameState.aiOpponents.forEach(ai => {
                if (ai.alive && !crashedEntities.includes(ai.id)) {
                    survivors.push(ai.id);
                }
            });
        }

        return survivors;
    }

    /**
     * Enhanced collision detection with power-up effect integration
     * Handles Shield effects and Ghost Mode trail-passing
     * Supports dynamic boundaries and grace periods
     */
    isCollidedWithPowerUps(playerId, bike, ownTrail, opponentTrail, bounds, dynamicBounds = null, isGracePeriodActive = false) {
        // Check if player has shield protection
        const hasShield = this.powerUpManager ? this.powerUpManager.hasShieldProtection(playerId) : false;
        const isInGhostMode = this.powerUpManager ? this.powerUpManager.isInGhostMode(playerId) : false;

        // Boundary Check - use dynamic boundaries if available, otherwise use static bounds
        const boundaryCollision = this.checkBoundaryCollision(bike, bounds, dynamicBounds);
        
        // Check for near-miss with boundaries before collision
        if (!boundaryCollision) {
            this.checkBoundaryNearMiss(bike, bounds, dynamicBounds, playerId);
        }
        
        if (boundaryCollision) {
            // Handle edge case where player is exactly on boundary during shrink
            if (dynamicBounds && this.handleBoundaryEdgeCase(bike, dynamicBounds, isGracePeriodActive)) {
                console.debug(`Edge case handling for ${playerId} - player on boundary during grace period`);
                return false;
            }
            
            // Apply grace period for dynamic boundaries
            if (dynamicBounds && isGracePeriodActive) {
                console.debug(`Grace period active for ${playerId} - boundary collision ignored`);
                return false;
            }
            
            if (hasShield) {
                // Consume shield and prevent collision
                this.powerUpManager.consumeShield(playerId);
                console.debug(`Shield consumed for ${playerId} - boundary collision prevented`);
                return false;
            }
            return true;
        }

        const collisionTolerance = 0.1;
        const excludeRecentSegments = 5;

        // Trail Collision Check - affected by Ghost Mode and validated within dynamic bounds
        if (!isInGhostMode) {
            // Own trail collision (self-collision)
            if (ownTrail.length > excludeRecentSegments) {
                for (let i = 0; i < ownTrail.length - excludeRecentSegments; i++) {
                    const segment = ownTrail[i];
                    if (segment && typeof segment.x === 'number' && typeof segment.z === 'number') {
                        // Validate that trail segment is within current bounds (for dynamic boundaries)
                        if (dynamicBounds && !this.isWithinBounds(segment, bounds, dynamicBounds)) {
                            continue; // Skip trail segments outside current arena
                        }
                        
                        const distance = Math.sqrt(Math.pow(bike.x - segment.x, 2) + Math.pow(bike.z - segment.z, 2));
                        
                        if (distance < collisionTolerance) {
                            if (hasShield) {
                                // Consume shield and prevent collision
                                this.powerUpManager.consumeShield(playerId);
                                console.debug(`Shield consumed for ${playerId} - self-trail collision prevented`);
                                return false;
                            }
                            return true;
                        } else if (distance <= 1.0) {
                            // Near-miss with own trail
                            this.triggerNearMiss(bike, distance, playerId);
                        }
                    }
                }
            }

            // Opponent trail collision
            for (const segment of opponentTrail) {
                if (segment && typeof segment.x === 'number' && typeof segment.z === 'number') {
                    // Validate that trail segment is within current bounds (for dynamic boundaries)
                    if (dynamicBounds && !this.isWithinBounds(segment, bounds, dynamicBounds)) {
                        continue; // Skip trail segments outside current arena
                    }
                    
                    const distance = Math.sqrt(Math.pow(bike.x - segment.x, 2) + Math.pow(bike.z - segment.z, 2));
                    
                    if (distance < collisionTolerance) {
                        if (hasShield) {
                            // Consume shield and prevent collision
                            this.powerUpManager.consumeShield(playerId);
                            console.debug(`Shield consumed for ${playerId} - opponent trail collision prevented`);
                            return false;
                        }
                        return true;
                    } else if (distance <= 1.0) {
                        // Near-miss with opponent trail
                        this.triggerNearMiss(bike, distance, playerId);
                    }
                }
            }
        } else {
            console.debug(`${playerId} in Ghost Mode - trail collisions ignored`);
        }

        return false;
    }

    /**
     * Check boundary collision with support for dynamic boundaries
     * @param {Object} bike - Bike position {x, z}
     * @param {number} staticBounds - Static boundary value (legacy)
     * @param {Object} dynamicBounds - Dynamic boundary object {minX, maxX, minZ, maxZ} or null
     * @returns {boolean} True if collision detected
     */
    checkBoundaryCollision(bike, staticBounds, dynamicBounds = null) {
        if (dynamicBounds) {
            // Use dynamic boundaries
            return bike.x <= dynamicBounds.minX || 
                   bike.x >= dynamicBounds.maxX || 
                   bike.z <= dynamicBounds.minZ || 
                   bike.z >= dynamicBounds.maxZ;
        } else {
            // Use static boundaries (legacy)
            return bike.x <= -staticBounds || 
                   bike.x >= staticBounds || 
                   bike.z <= -staticBounds || 
                   bike.z >= staticBounds;
        }
    }

    /**
     * Validate if a position is within current boundaries
     * @param {Object} position - Position to check {x, z}
     * @param {number} staticBounds - Static boundary value (legacy)
     * @param {Object} dynamicBounds - Dynamic boundary object {minX, maxX, minZ, maxZ} or null
     * @returns {boolean} True if position is within bounds
     */
    isWithinBounds(position, staticBounds, dynamicBounds = null) {
        return !this.checkBoundaryCollision(position, staticBounds, dynamicBounds);
    }

    /**
     * Validate collision detection accuracy for edge cases
     * @param {Object} bike - Bike position {x, z}
     * @param {Array} trail - Trail segments to validate
     * @param {number} staticBounds - Static boundary value
     * @param {Object} dynamicBounds - Dynamic boundary object or null
     * @returns {Object} Validation results
     */
    validateCollisionAccuracy(bike, trail, staticBounds, dynamicBounds = null) {
        const results = {
            bikeWithinBounds: this.isWithinBounds(bike, staticBounds, dynamicBounds),
            validTrailSegments: 0,
            invalidTrailSegments: 0,
            collisionTolerance: 0.1
        };

        // Validate trail segments
        for (const segment of trail) {
            if (segment && typeof segment.x === 'number' && typeof segment.z === 'number') {
                if (this.isWithinBounds(segment, staticBounds, dynamicBounds)) {
                    results.validTrailSegments++;
                } else {
                    results.invalidTrailSegments++;
                }
            }
        }

        return results;
    }

    /**
     * Handle edge case where player is exactly on boundary during shrink
     * @param {Object} bike - Bike position {x, z}
     * @param {Object} dynamicBounds - Dynamic boundary object
     * @param {boolean} isGracePeriodActive - Whether grace period is active
     * @returns {boolean} True if collision should be ignored due to edge case
     */
    handleBoundaryEdgeCase(bike, dynamicBounds, isGracePeriodActive) {
        if (!dynamicBounds) return false;

        const tolerance = 0.1;
        const isOnBoundary = (
            Math.abs(bike.x - dynamicBounds.minX) < tolerance ||
            Math.abs(bike.x - dynamicBounds.maxX) < tolerance ||
            Math.abs(bike.z - dynamicBounds.minZ) < tolerance ||
            Math.abs(bike.z - dynamicBounds.maxZ) < tolerance
        );

        // If player is exactly on boundary and grace period is active, allow movement
        return isOnBoundary && isGracePeriodActive;
    }

    /**
     * Check for near-miss with boundaries and trigger camera shake
     * @param {Object} bike - Bike position {x, z}
     * @param {number} staticBounds - Static boundary value
     * @param {Object} dynamicBounds - Dynamic boundary object or null
     * @param {string} playerId - Player identifier for camera effects
     */
    checkBoundaryNearMiss(bike, staticBounds, dynamicBounds = null, playerId) {
        if (!this.cameraEffectsManager || !this.cameraEffectsManager.isEnabled()) {
            return;
        }

        let minDistance = Infinity;
        
        if (dynamicBounds) {
            // Check distance to each dynamic boundary
            const distances = [
                Math.abs(bike.x - dynamicBounds.minX), // Left wall
                Math.abs(bike.x - dynamicBounds.maxX), // Right wall
                Math.abs(bike.z - dynamicBounds.minZ), // Top wall
                Math.abs(bike.z - dynamicBounds.maxZ)  // Bottom wall
            ];
            minDistance = Math.min(...distances);
        } else {
            // Check distance to each static boundary
            const distances = [
                Math.abs(bike.x - (-staticBounds)), // Left wall
                Math.abs(bike.x - staticBounds),    // Right wall
                Math.abs(bike.z - (-staticBounds)), // Top wall
                Math.abs(bike.z - staticBounds)     // Bottom wall
            ];
            minDistance = Math.min(...distances);
        }

        // Trigger near-miss if within 1 unit of boundary
        if (minDistance <= 1.0) {
            this.triggerNearMiss(bike, minDistance, playerId);
        }
    }

    /**
     * Trigger near-miss camera shake effect
     * @param {Object} position - Position where near-miss occurred
     * @param {number} distance - Distance to obstacle (closer = more intense)
     * @param {string} playerId - Player identifier
     */
    triggerNearMiss(position, distance, playerId) {
        if (!this.cameraEffectsManager || !this.cameraEffectsManager.isEnabled()) {
            return;
        }

        // Only trigger for player near-misses (not AI)
        if (playerId === 'player') {
            this.cameraEffectsManager.onNearMiss(position, distance);
        }
    }

    /**
     * Legacy collision detection method for backward compatibility
     */
    isCollided(bike, ownTrail, opponentTrail, bounds) {
        // Boundary Check using legacy static bounds
        if (this.checkBoundaryCollision(bike, bounds)) {
            return true;
        }

        const collisionTolerance = 0.1;
        const excludeRecentSegments = 5;

        // Trail Collision Check
        if (ownTrail.length > excludeRecentSegments) {
            for (let i = 0; i < ownTrail.length - excludeRecentSegments; i++) {
                const segment = ownTrail[i];
                if (segment && typeof segment.x === 'number' && typeof segment.z === 'number') {
                    if (Math.abs(bike.x - segment.x) < collisionTolerance && Math.abs(bike.z - segment.z) < collisionTolerance) {
                        return true;
                    }
                }
            }
        }

        for (const segment of opponentTrail) {
            if (segment && typeof segment.x === 'number' && typeof segment.z === 'number') {
                if (Math.abs(bike.x - segment.x) < collisionTolerance && Math.abs(bike.z - segment.z) < collisionTolerance) {
                    return true;
                }
            }
        }

        return false;
    }
}

module.exports = { CollisionDetectionEngine };
