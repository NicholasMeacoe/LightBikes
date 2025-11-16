/**
 * PositionManager - Utility class for managing AI opponent starting positions
 * Handles perimeter distribution and initial direction calculation
 */
class PositionManager {
    /**
     * Default arena size
     * @static
     * @readonly
     */
    static DEFAULT_ARENA_SIZE = 30;

    /**
     * Calculate starting positions for AI opponents around arena perimeter
     * Distributes AIs evenly around the perimeter for fair initial placement
     * @param {number} aiCount - Number of AI opponents (1-4)
     * @param {number} [arenaSize=30] - Arena size (default 30)
     * @returns {Array<Object>} Array of starting positions with coordinates and directions
     * @throws {Error} If aiCount or arenaSize is invalid
     */
    static calculateStartingPositions(aiCount, arenaSize = this.DEFAULT_ARENA_SIZE) {
        // Validate inputs
        if (typeof aiCount !== 'number' || aiCount < 1 || aiCount > 4) {
            throw new Error('AI count must be a number between 1 and 4');
        }

        if (typeof arenaSize !== 'number' || arenaSize < 10 || arenaSize > 100) {
            throw new Error('Arena size must be a number between 10 and 100');
        }

        const positions = [];
        const perimeter = arenaSize - 1;
        const center = arenaSize / 2;

        // For single AI, use legacy position for backward compatibility
        if (aiCount === 1) {
            return [{
                x: 0,
                y: 0,
                z: -10,
                direction: { x: 1, y: 0, z: 0 }
            }];
        }

        // Distribute AIs evenly around arena perimeter
        for (let i = 0; i < aiCount; i++) {
            const angle = (i / aiCount) * 2 * Math.PI;
            
            // Calculate position on perimeter
            const x = Math.round(center + (perimeter / 2) * Math.cos(angle));
            const z = Math.round(center + (perimeter / 2) * Math.sin(angle));
            
            // Get initial direction pointing toward center
            const direction = this.getInitialDirection(angle);
            
            positions.push({
                x: x - center, // Convert to centered coordinates (-15 to 15 for size 30)
                y: 0,
                z: z - center, // Convert to centered coordinates (-15 to 15 for size 30)
                direction: direction
            });
        }

        return positions;
    }

    /**
     * Get initial direction based on starting angle
     * Direction points toward arena center for strategic gameplay
     * @param {number} angle - Starting angle in radians
     * @returns {Object} Direction vector {x, y, z}
     * @throws {Error} If angle is invalid
     */
    static getInitialDirection(angle) {
        if (typeof angle !== 'number' || !isFinite(angle)) {
            throw new Error('Angle must be a finite number');
        }

        // Calculate direction pointing toward center (opposite of position angle)
        const directionAngle = angle + Math.PI;
        
        // Convert to direction vector
        const rawDirection = {
            x: Math.cos(directionAngle),
            y: 0,
            z: Math.sin(directionAngle)
        };

        // Normalize to valid game directions (only cardinal directions allowed)
        return this.normalizeDirection(rawDirection);
    }

    /**
     * Normalize direction vector to valid game directions
     * Game only allows movement in cardinal directions (N, S, E, W)
     * @param {Object} direction - Raw direction vector
     * @returns {Object} Normalized direction vector
     * @private
     */
    static normalizeDirection(direction) {
        if (!direction || typeof direction !== 'object') {
            throw new Error('Direction must be an object');
        }

        const { x, z } = direction;

        // Determine primary axis based on magnitude
        if (Math.abs(x) > Math.abs(z)) {
            return {
                x: x > 0 ? 1 : -1,
                y: 0,
                z: 0
            };
        } else {
            return {
                x: 0,
                y: 0,
                z: z > 0 ? 1 : -1
            };
        }
    }

    /**
     * Calculate safe starting positions that avoid immediate collisions
     * Ensures minimum distance between starting positions
     * @param {number} aiCount - Number of AI opponents
     * @param {number} [arenaSize=30] - Arena size
     * @param {number} [minDistance=5] - Minimum distance between positions
     * @returns {Array<Object>} Array of safe starting positions
     */
    static calculateSafeStartingPositions(aiCount, arenaSize = this.DEFAULT_ARENA_SIZE, minDistance = 5) {
        if (typeof minDistance !== 'number' || minDistance < 1) {
            throw new Error('Minimum distance must be a positive number');
        }

        const positions = this.calculateStartingPositions(aiCount, arenaSize);

        // Validate minimum distances
        for (let i = 0; i < positions.length; i++) {
            for (let j = i + 1; j < positions.length; j++) {
                const distance = this.calculateDistance(positions[i], positions[j]);
                if (distance < minDistance) {
                    // Adjust positions if too close
                    positions[j] = this.adjustPosition(positions[j], positions[i], minDistance, arenaSize);
                }
            }
        }

        return positions;
    }

    /**
     * Calculate distance between two positions
     * @param {Object} pos1 - First position
     * @param {Object} pos2 - Second position
     * @returns {number} Distance between positions
     * @private
     */
    static calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dz * dz);
    }

    /**
     * Adjust position to maintain minimum distance
     * @param {Object} position - Position to adjust
     * @param {Object} reference - Reference position to avoid
     * @param {number} minDistance - Minimum required distance
     * @param {number} arenaSize - Arena size for boundary checking
     * @returns {Object} Adjusted position
     * @private
     */
    static adjustPosition(position, reference, minDistance, arenaSize) {
        const halfSize = arenaSize / 2;
        const dx = position.x - reference.x;
        const dz = position.z - reference.z;
        const currentDistance = Math.sqrt(dx * dx + dz * dz);

        if (currentDistance >= minDistance) {
            return position; // No adjustment needed
        }

        // Calculate adjustment vector
        const adjustmentFactor = minDistance / currentDistance;
        const adjustedX = reference.x + dx * adjustmentFactor;
        const adjustedZ = reference.z + dz * adjustmentFactor;

        // Clamp to arena boundaries
        const clampedX = Math.max(-halfSize, Math.min(halfSize, adjustedX));
        const clampedZ = Math.max(-halfSize, Math.min(halfSize, adjustedZ));

        return {
            ...position,
            x: Math.round(clampedX),
            z: Math.round(clampedZ)
        };
    }

    /**
     * Get player starting position (always at center)
     * @param {number} [arenaSize=30] - Arena size (unused, for consistency)
     * @returns {Object} Player starting position
     */
    static getPlayerStartingPosition(arenaSize = this.DEFAULT_ARENA_SIZE) {
        return {
            x: 0,
            y: 0,
            z: 0,
            direction: { x: 1, y: 0, z: 0 } // Default facing right
        };
    }

    /**
     * Validate position is within arena bounds
     * @param {Object} position - Position to validate
     * @param {number} arenaSize - Arena size
     * @returns {boolean} True if position is valid
     */
    static isValidPosition(position, arenaSize) {
        if (!position || typeof position !== 'object') {
            return false;
        }

        const { x, z } = position;
        const halfSize = arenaSize / 2;

        return (
            typeof x === 'number' &&
            typeof z === 'number' &&
            x >= -halfSize &&
            x <= halfSize &&
            z >= -halfSize &&
            z <= halfSize
        );
    }

    /**
     * Get corner positions for testing or special scenarios
     * @param {number} [arenaSize=30] - Arena size
     * @returns {Array<Object>} Array of corner positions
     */
    static getCornerPositions(arenaSize = this.DEFAULT_ARENA_SIZE) {
        const halfSize = (arenaSize / 2) - 1; // Leave 1 unit margin from boundary

        return [
            { x: -halfSize, y: 0, z: -halfSize, direction: { x: 1, y: 0, z: 0 } }, // Top-left
            { x: halfSize, y: 0, z: -halfSize, direction: { x: 0, y: 0, z: 1 } },  // Top-right
            { x: halfSize, y: 0, z: halfSize, direction: { x: -1, y: 0, z: 0 } },   // Bottom-right
            { x: -halfSize, y: 0, z: halfSize, direction: { x: 0, y: 0, z: -1 } }   // Bottom-left
        ];
    }
}

module.exports = { PositionManager };