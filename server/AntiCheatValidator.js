/**
 * AntiCheatValidator provides server-side validation to prevent cheating
 * Validates player movements, detects suspicious patterns, and enforces fair play
 */
class AntiCheatValidator {
    constructor(gameRoom) {
        this.gameRoom = gameRoom;
        
        // Validation constants
        this.maxSpeed = 0.15; // Maximum allowed speed per frame (with tolerance)
        this.maxTeleportDistance = 1.0; // Maximum allowed position jump
        this.collisionTolerance = 0.5; // Collision detection radius
        
        // Pattern detection tracking
        this.violationHistory = new Map(); // playerId -> violations[]
        this.positionHistory = new Map(); // playerId -> positions[]
        this.speedHistory = new Map(); // playerId -> speeds[]
        
        // Violation thresholds
        this.warningThreshold = 3; // Warnings before disconnect
        this.banThreshold = 10; // Total violations before ban consideration
        
        // History limits
        this.maxPositionHistory = 100;
        this.maxSpeedHistory = 60;
        this.maxViolationHistory = 50;
    }

    /**
     * Validate player position update
     * Requirements: 3.1, 3.2
     */
    validatePosition(playerId, newPosition, timestamp) {
        const playerState = this.gameRoom.gameState?.players[playerId];
        if (!playerState || !playerState.isAlive) {
            return { valid: true };
        }

        const currentPosition = playerState.position;
        
        // Calculate distance moved
        const distance = this.calculateDistance(currentPosition, newPosition);
        
        // Check for teleportation
        if (distance > this.maxTeleportDistance) {
            return {
                valid: false,
                violation: 'teleportation',
                details: {
                    distance: distance,
                    maxAllowed: this.maxTeleportDistance,
                    from: currentPosition,
                    to: newPosition,
                    timestamp: timestamp
                }
            };
        }
        
        // Track position history
        this.trackPosition(playerId, newPosition, timestamp);
        
        return { valid: true };
    }

    /**
     * Validate player direction change
     * Requirements: 3.1
     */
    validateDirection(playerId, newDirection, timestamp) {
        const playerState = this.gameRoom.gameState?.players[playerId];
        if (!playerState || !playerState.isAlive) {
            return { valid: true };
        }

        const currentDirection = playerState.direction;
        
        // Validate direction is a valid game direction
        if (!this.isValidDirection(newDirection)) {
            return {
                valid: false,
                violation: 'invalid_direction',
                details: {
                    direction: newDirection,
                    timestamp: timestamp
                }
            };
        }
        
        // Check for 180-degree turn (not allowed in game)
        if (this.isReversalDirection(currentDirection, newDirection)) {
            return {
                valid: false,
                violation: 'illegal_reversal',
                details: {
                    currentDirection: currentDirection,
                    newDirection: newDirection,
                    timestamp: timestamp
                }
            };
        }
        
        return { valid: true };
    }

    /**
     * Validate player speed
     * Requirements: 3.1, 3.2
     */
    validateSpeed(playerId, distance, deltaTime) {
        // Calculate speed (units per frame, normalized to 16.67ms frame time)
        const frameTime = 16.67; // ~60fps
        const normalizedSpeed = deltaTime > 0 ? (distance / deltaTime) * frameTime : 0;
        
        // Track speed history
        this.trackSpeed(playerId, normalizedSpeed);
        
        // Check if speed exceeds maximum
        if (normalizedSpeed > this.maxSpeed) {
            return {
                valid: false,
                violation: 'speed_hack',
                details: {
                    speed: normalizedSpeed,
                    maxAllowed: this.maxSpeed,
                    distance: distance,
                    deltaTime: deltaTime
                }
            };
        }
        
        return { valid: true };
    }

    /**
     * Detect speed hacking patterns
     * Requirements: 3.2, 3.4
     */
    detectSpeedHacking(playerId) {
        const speeds = this.speedHistory.get(playerId);
        if (!speeds || speeds.length < 10) {
            return { detected: false };
        }
        
        // Calculate average speed over recent frames
        const recentSpeeds = speeds.slice(-30);
        const avgSpeed = recentSpeeds.reduce((sum, s) => sum + s, 0) / recentSpeeds.length;
        
        // Check if consistently exceeding normal speed
        if (avgSpeed > this.maxSpeed * 0.9) {
            return {
                detected: true,
                pattern: 'consistent_overspeed',
                details: {
                    averageSpeed: avgSpeed,
                    maxAllowed: this.maxSpeed,
                    sampleSize: recentSpeeds.length
                }
            };
        }
        
        // Check for speed spikes
        const speedSpikes = recentSpeeds.filter(s => s > this.maxSpeed).length;
        if (speedSpikes > recentSpeeds.length * 0.3) {
            return {
                detected: true,
                pattern: 'frequent_speed_spikes',
                details: {
                    spikeCount: speedSpikes,
                    sampleSize: recentSpeeds.length,
                    spikePercentage: (speedSpikes / recentSpeeds.length) * 100
                }
            };
        }
        
        return { detected: false };
    }

    /**
     * Detect teleportation patterns
     * Requirements: 3.2, 3.4
     */
    detectTeleportation(playerId) {
        const positions = this.positionHistory.get(playerId);
        if (!positions || positions.length < 5) {
            return { detected: false };
        }
        
        // Check recent position changes for impossible jumps
        const recentPositions = positions.slice(-10);
        let teleportCount = 0;
        
        for (let i = 1; i < recentPositions.length; i++) {
            const distance = this.calculateDistance(
                recentPositions[i - 1].position,
                recentPositions[i].position
            );
            
            if (distance > this.maxTeleportDistance) {
                teleportCount++;
            }
        }
        
        if (teleportCount > 0) {
            return {
                detected: true,
                pattern: 'position_jumps',
                details: {
                    teleportCount: teleportCount,
                    sampleSize: recentPositions.length - 1
                }
            };
        }
        
        return { detected: false };
    }

    /**
     * Detect collision bypass attempts
     * Requirements: 3.2, 3.4
     */
    detectCollisionBypass(playerId, position, allTrails) {
        const playerState = this.gameRoom.gameState?.players[playerId];
        if (!playerState || !playerState.isAlive) {
            return { detected: false };
        }
        
        // Check if player is inside any trail segment
        for (const [otherPlayerId, otherPlayerState] of Object.entries(this.gameRoom.gameState.players)) {
            const trail = otherPlayerState.trail;
            
            // Skip grace period for own trail
            const startIndex = (otherPlayerId === playerId) ? 10 : 0;
            
            for (let i = startIndex; i < trail.length; i++) {
                const segment = trail[i];
                const distance = this.calculateDistance(position, segment);
                
                // Player is inside a trail segment but still alive
                if (distance < this.collisionTolerance) {
                    return {
                        detected: true,
                        pattern: 'collision_bypass',
                        details: {
                            position: position,
                            trailSegment: segment,
                            distance: distance,
                            trailOwner: otherPlayerId
                        }
                    };
                }
            }
        }
        
        // Check if player is outside arena bounds but still alive
        const bounds = this.gameRoom.gameState.bounds;
        if (position.x < bounds.minX || position.x > bounds.maxX ||
            position.z < bounds.minZ || position.z > bounds.maxZ) {
            return {
                detected: true,
                pattern: 'boundary_bypass',
                details: {
                    position: position,
                    bounds: bounds
                }
            };
        }
        
        return { detected: false };
    }

    /**
     * Flag suspicious activity
     * Requirements: 3.3, 3.5
     */
    flagSuspiciousActivity(playerId, violation) {
        // Get or create violation history
        if (!this.violationHistory.has(playerId)) {
            this.violationHistory.set(playerId, []);
        }
        
        const violations = this.violationHistory.get(playerId);
        
        // Add violation with timestamp
        const violationRecord = {
            type: violation.violation || violation.pattern,
            details: violation.details,
            timestamp: Date.now()
        };
        
        violations.push(violationRecord);
        
        // Limit history size
        if (violations.length > this.maxViolationHistory) {
            violations.shift();
        }
        
        // Log violation
        console.log(`[AntiCheat] Player ${playerId} flagged for ${violationRecord.type}`, violationRecord.details);
        
        // Determine response based on violation count
        const recentViolations = this.getRecentViolations(playerId, 60000); // Last minute
        
        // Check for ban first (total violations)
        if (violations.length >= this.banThreshold) {
            return {
                action: 'ban',
                reason: 'repeated_violations',
                violationCount: violations.length
            };
        } else if (recentViolations.length >= this.warningThreshold) {
            return {
                action: 'disconnect',
                reason: 'multiple_violations',
                violationCount: recentViolations.length
            };
        } else {
            return {
                action: 'warning',
                reason: violationRecord.type,
                violationCount: violations.length
            };
        }
    }

    /**
     * Disconnect cheater from game
     * Requirements: 3.3, 3.5
     */
    disconnectCheater(playerId, reason) {
        const player = this.gameRoom.players.get(playerId);
        if (!player) {
            return false;
        }
        
        // Log the disconnect
        console.log(`[AntiCheat] Disconnecting player ${playerId} for ${reason}`);
        
        // Get violation history for logging
        const violations = this.violationHistory.get(playerId) || [];
        
        // Notify the player
        this.gameRoom.sendToPlayer(playerId, 'kicked', {
            reason: 'anti_cheat_violation',
            details: reason,
            violationCount: violations.length
        });
        
        // Remove player from room
        this.gameRoom.removePlayer(playerId);
        
        // Log for potential ban
        this.logViolationForReview(playerId, reason, violations);
        
        return true;
    }

    /**
     * Log violation for review and potential banning
     * Requirements: 3.5
     */
    logViolationForReview(playerId, reason, violations) {
        const logEntry = {
            playerId: playerId,
            playerName: this.gameRoom.players.get(playerId)?.name || 'Unknown',
            roomId: this.gameRoom.id,
            reason: reason,
            violations: violations,
            timestamp: Date.now()
        };
        
        // In production, this would write to a database or logging service
        console.log('[AntiCheat] Violation log:', JSON.stringify(logEntry, null, 2));
        
        // Could implement automated banning here based on violation patterns
        if (violations.length >= this.banThreshold) {
            console.log(`[AntiCheat] Player ${playerId} recommended for ban - ${violations.length} total violations`);
        }
    }

    /**
     * Get recent violations within time window
     */
    getRecentViolations(playerId, timeWindowMs) {
        const violations = this.violationHistory.get(playerId);
        if (!violations) {
            return [];
        }
        
        const cutoffTime = Date.now() - timeWindowMs;
        return violations.filter(v => v.timestamp >= cutoffTime);
    }

    /**
     * Track position history
     */
    trackPosition(playerId, position, timestamp) {
        if (!this.positionHistory.has(playerId)) {
            this.positionHistory.set(playerId, []);
        }
        
        const history = this.positionHistory.get(playerId);
        history.push({
            position: { ...position },
            timestamp: timestamp
        });
        
        // Limit history size
        if (history.length > this.maxPositionHistory) {
            history.shift();
        }
    }

    /**
     * Track speed history
     */
    trackSpeed(playerId, speed) {
        if (!this.speedHistory.has(playerId)) {
            this.speedHistory.set(playerId, []);
        }
        
        const history = this.speedHistory.get(playerId);
        history.push(speed);
        
        // Limit history size
        if (history.length > this.maxSpeedHistory) {
            history.shift();
        }
    }

    /**
     * Calculate distance between two positions
     */
    calculateDistance(pos1, pos2) {
        return Math.sqrt(
            Math.pow(pos2.x - pos1.x, 2) +
            Math.pow(pos2.z - pos1.z, 2)
        );
    }

    /**
     * Check if direction is valid
     */
    isValidDirection(direction) {
        // Valid directions are unit vectors along x or z axis
        const validDirections = [
            { x: 0, y: 0, z: 1 },   // down
            { x: 0, y: 0, z: -1 },  // up
            { x: 1, y: 0, z: 0 },   // right
            { x: -1, y: 0, z: 0 }   // left
        ];
        
        return validDirections.some(valid =>
            valid.x === direction.x &&
            valid.y === direction.y &&
            valid.z === direction.z
        );
    }

    /**
     * Check if new direction is a reversal of current direction
     */
    isReversalDirection(currentDirection, newDirection) {
        // Check for 180-degree turn
        if (currentDirection.x !== 0 && newDirection.x === -currentDirection.x) {
            return true;
        }
        if (currentDirection.z !== 0 && newDirection.z === -currentDirection.z) {
            return true;
        }
        return false;
    }

    /**
     * Clear history for a player (e.g., when they leave)
     */
    clearPlayerHistory(playerId) {
        this.violationHistory.delete(playerId);
        this.positionHistory.delete(playerId);
        this.speedHistory.delete(playerId);
    }

    /**
     * Get violation statistics for a player
     */
    getPlayerStats(playerId) {
        const violations = this.violationHistory.get(playerId) || [];
        const positions = this.positionHistory.get(playerId) || [];
        const speeds = this.speedHistory.get(playerId) || [];
        
        return {
            totalViolations: violations.length,
            recentViolations: this.getRecentViolations(playerId, 60000).length,
            positionHistorySize: positions.length,
            speedHistorySize: speeds.length,
            violations: violations
        };
    }
}

module.exports = { AntiCheatValidator };
