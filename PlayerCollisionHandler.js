const { CollisionDetectionEngine } = require('./collision.js');

/**
 * PlayerCollisionHandler - Extends CollisionDetectionEngine for player vs player scenarios
 * Handles collision detection between two human players in local multiplayer mode
 */
class PlayerCollisionHandler extends CollisionDetectionEngine {
    constructor() {
        super();
        this.collisionTolerance = 0.1;
        this.excludeRecentSegments = 5;
    }

    /**
     * Check collisions for multiplayer game with two human players
     * @param {Object} gameState - Multiplayer game state with player1 and player2
     * @param {Object} game - Game instance for dynamic boundaries and grace period
     * @returns {Object} Collision results with player-specific collision flags and winner
     */
    checkMultiplayerCollisions(gameState, game = null) {
        // Respect grace period - no collisions in first 10 frames
        if (gameState.frameCount < 10) {
            return { 
                player1Collided: false, 
                player2Collided: false, 
                winner: null,
                collisionType: null
            };
        }

        // Respect pause state - return no collisions when paused
        if (gameState.isPaused) {
            return { 
                player1Collided: false, 
                player2Collided: false, 
                winner: null,
                collisionType: null
            };
        }

        const { player1, player2, bounds } = gameState;
        
        if (!player1 || !player2) {
            return { 
                player1Collided: false, 
                player2Collided: false, 
                winner: null,
                collisionType: 'invalid_state'
            };
        }

        // Get dynamic boundaries and grace period from game instance
        const dynamicBounds = (game && typeof game.getBounds === 'function') ? game.getBounds() : null;
        const isGracePeriodActive = (game && typeof game.isGracePeriodActive === 'function') ? game.isGracePeriodActive() : false;

        // Check collisions for both players
        const player1Collided = this.checkPlayerCollision(
            'P1', 
            player1.position, 
            player1.trail, 
            player2.trail, 
            bounds, 
            dynamicBounds, 
            isGracePeriodActive
        );

        const player2Collided = this.checkPlayerCollision(
            'P2', 
            player2.position, 
            player2.trail, 
            player1.trail, 
            bounds, 
            dynamicBounds, 
            isGracePeriodActive
        );

        // Check for direct player vs player collision (bike to bike)
        const directCollision = this.checkDirectPlayerCollision(player1.position, player2.position);
        
        // Determine winner and collision type
        const result = this.determineMultiplayerWinner(
            player1Collided, 
            player2Collided, 
            directCollision
        );

        return result;
    }

    /**
     * Check collision for a specific player against boundaries and opponent trail
     * @param {string} playerId - Player identifier ('P1' or 'P2')
     * @param {Object} playerPosition - Player position {x, y, z}
     * @param {Array} playerTrail - Player's own trail
     * @param {Array} opponentTrail - Opponent's trail
     * @param {number} bounds - Static boundary value
     * @param {Object} dynamicBounds - Dynamic boundary object or null
     * @param {boolean} isGracePeriodActive - Whether grace period is active
     * @returns {boolean} True if player has collided
     */
    checkPlayerCollision(playerId, playerPosition, playerTrail, opponentTrail, bounds, dynamicBounds = null, isGracePeriodActive = false) {
        // If grace period is active from game instance, no collisions should be detected
        if (isGracePeriodActive) {
            return false;
        }
        
        // Use the enhanced collision detection from parent class
        return this.isCollidedWithPowerUps(
            playerId, 
            playerPosition, 
            playerTrail, 
            opponentTrail, 
            bounds, 
            dynamicBounds, 
            isGracePeriodActive
        );
    }

    /**
     * Check for direct collision between two players (bike to bike)
     * @param {Object} player1Position - Player 1 position
     * @param {Object} player2Position - Player 2 position
     * @returns {boolean} True if players are colliding directly
     */
    checkDirectPlayerCollision(player1Position, player2Position) {
        const distance = Math.sqrt(
            Math.pow(player1Position.x - player2Position.x, 2) + 
            Math.pow(player1Position.z - player2Position.z, 2)
        );
        
        return distance < this.collisionTolerance;
    }

    /**
     * Determine winner based on collision results
     * @param {boolean} player1Collided - Whether player 1 collided
     * @param {boolean} player2Collided - Whether player 2 collided
     * @param {boolean} directCollision - Whether players collided directly
     * @returns {Object} Result with winner and collision type
     */
    determineMultiplayerWinner(player1Collided, player2Collided, directCollision) {
        let winner = null;
        let collisionType = null;

        if (directCollision) {
            // Direct collision between players - always a tie
            winner = 'tie';
            collisionType = 'direct_collision';
        } else if (player1Collided && player2Collided) {
            // Both players crashed (but not into each other)
            winner = 'tie';
            collisionType = 'simultaneous_crash';
        } else if (player1Collided && !player2Collided) {
            // Only player 1 crashed
            winner = 'P2';
            collisionType = 'player1_crash';
        } else if (player2Collided && !player1Collided) {
            // Only player 2 crashed
            winner = 'P1';
            collisionType = 'player2_crash';
        } else {
            // No collisions
            collisionType = 'no_collision';
        }

        return {
            player1Collided,
            player2Collided,
            winner,
            collisionType,
            directCollision
        };
    }

    /**
     * Check for near-miss between players and trigger camera effects
     * @param {Object} player1Position - Player 1 position
     * @param {Object} player2Position - Player 2 position
     * @param {string} activePlayerId - ID of player to trigger effects for ('P1' or 'P2')
     */
    checkPlayerNearMiss(player1Position, player2Position, activePlayerId = 'P1') {
        const distance = Math.sqrt(
            Math.pow(player1Position.x - player2Position.x, 2) + 
            Math.pow(player1Position.z - player2Position.z, 2)
        );

        // Trigger near-miss if players are close but not colliding
        if (distance > this.collisionTolerance && distance <= 1.0) {
            // Use the position of the active player for camera effects
            const triggerPosition = activePlayerId === 'P1' ? player1Position : player2Position;
            this.triggerNearMiss(triggerPosition, distance, activePlayerId);
        }
    }

    /**
     * Validate collision timing for simultaneous crashes
     * This method can be used to implement more sophisticated timing-based collision resolution
     * @param {Object} collision1 - First collision data
     * @param {Object} collision2 - Second collision data
     * @returns {Object} Timing analysis result
     */
    validateCollisionTiming(collision1, collision2) {
        // For now, treat all simultaneous collisions as ties
        // This can be enhanced later with frame-accurate timing if needed
        return {
            isTie: true,
            timeDifference: 0,
            winner: null
        };
    }

    /**
     * Get collision statistics for debugging and testing
     * @param {Object} gameState - Current game state
     * @returns {Object} Collision statistics
     */
    getCollisionStats(gameState) {
        if (!gameState.player1 || !gameState.player2) {
            return { valid: false, reason: 'missing_players' };
        }

        const player1Stats = this.validateCollisionAccuracy(
            gameState.player1.position,
            gameState.player1.trail,
            gameState.bounds,
            gameState.dynamicBounds
        );

        const player2Stats = this.validateCollisionAccuracy(
            gameState.player2.position,
            gameState.player2.trail,
            gameState.bounds,
            gameState.dynamicBounds
        );

        const playerDistance = Math.sqrt(
            Math.pow(gameState.player1.position.x - gameState.player2.position.x, 2) + 
            Math.pow(gameState.player1.position.z - gameState.player2.position.z, 2)
        );

        return {
            valid: true,
            player1: player1Stats,
            player2: player2Stats,
            playerDistance,
            collisionTolerance: this.collisionTolerance,
            excludeRecentSegments: this.excludeRecentSegments,
            frameCount: gameState.frameCount,
            gracePeriodActive: gameState.frameCount < 10
        };
    }

    /**
     * Handle multiplayer-specific power-up interactions during collisions
     * @param {string} playerId - Player ID
     * @param {string} collisionType - Type of collision
     * @returns {boolean} True if collision was prevented by power-up
     */
    handleMultiplayerPowerUpCollision(playerId, collisionType) {
        if (!this.powerUpManager) {
            return false;
        }

        const hasShield = this.powerUpManager.hasShieldProtection(playerId);
        const isInGhostMode = this.powerUpManager.isInGhostMode(playerId);

        // Ghost mode prevents trail collisions but not boundary collisions
        if (isInGhostMode && (collisionType === 'trail_collision' || collisionType === 'direct_collision')) {
            console.debug(`${playerId} in Ghost Mode - ${collisionType} ignored`);
            return true;
        }

        // Shield protects against all collision types
        if (hasShield) {
            this.powerUpManager.consumeShield(playerId);
            console.debug(`Shield consumed for ${playerId} - ${collisionType} prevented`);
            return true;
        }

        return false;
    }
}

module.exports = { PlayerCollisionHandler };