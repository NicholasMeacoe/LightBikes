/**
 * NearMissDetector component for detecting close encounters between entities and obstacles.
 * Includes cooldown system to prevent excessive shake triggering.
 */
class NearMissDetector {
    /**
     * Creates a new near miss detector
     * @param {number} detectionRadius - Detection radius in units (default 1.0)
     * @param {number} cooldownPeriod - Cooldown period in milliseconds (default 100)
     */
    constructor(detectionRadius = 1.0, cooldownPeriod = 100) {
        this.detectionRadius = Math.max(0.1, detectionRadius);
        this.cooldownPeriod = Math.max(0, cooldownPeriod);
        this.lastNearMiss = 0;
        this.enabled = true;
        
        // Track recent near misses to prevent spam
        this.recentNearMisses = new Map(); // entityId -> timestamp
        this.cleanupInterval = 1000; // Clean up old entries every second
        this.lastCleanup = 0;
    }

    /**
     * Checks for near misses between an entity and obstacles
     * @param {Object} entity - Entity to check (must have position {x, y, z})
     * @param {Array} obstacles - Array of obstacles to check against
     * @param {number} currentTime - Current timestamp in milliseconds
     * @returns {Object|null} Near miss info or null if no near miss
     */
    checkNearMiss(entity, obstacles, currentTime = Date.now()) {
        if (!this.enabled || !entity || !entity.position || !obstacles || !Array.isArray(obstacles)) {
            return null;
        }

        // Clean up old entries periodically
        if (currentTime - this.lastCleanup > this.cleanupInterval) {
            this.cleanupOldEntries(currentTime);
        }

        // Check entity-specific cooldown first
        const entityId = entity.id || 'default';
        const lastEntityNearMiss = this.recentNearMisses.get(entityId) || 0;
        
        if (currentTime - lastEntityNearMiss < this.cooldownPeriod) {
            return null; // Still in cooldown for this entity
        }

        let closestDistance = Infinity;
        let closestObstacle = null;
        let nearMissDetected = false;

        // Check against all obstacles
        for (const obstacle of obstacles) {
            if (!obstacle || !obstacle.position) continue;

            const distance = this.calculateDistance(entity.position, obstacle.position);
            
            if (distance <= this.detectionRadius && distance < closestDistance) {
                closestDistance = distance;
                closestObstacle = obstacle;
                nearMissDetected = true;
            }
        }

        // If near miss detected, update timestamps
        if (nearMissDetected) {
            // Update timestamps
            this.lastNearMiss = currentTime;
            this.recentNearMisses.set(entityId, currentTime);

            return {
                entity: entity,
                obstacle: closestObstacle,
                distance: closestDistance,
                timestamp: currentTime,
                detectionRadius: this.detectionRadius
            };
        }

        return null;
    }

    /**
     * Calculates 3D distance between two points
     * @param {Object} point1 - First point {x, y, z}
     * @param {Object} point2 - Second point {x, y, z}
     * @returns {number} Distance between points
     */
    calculateDistance(point1, point2) {
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        const dz = point1.z - point2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    /**
     * Calculates 2D distance (ignoring Y axis) between two points
     * @param {Object} point1 - First point {x, y, z}
     * @param {Object} point2 - Second point {x, y, z}
     * @returns {number} 2D distance between points
     */
    calculateDistance2D(point1, point2) {
        const dx = point1.x - point2.x;
        const dz = point1.z - point2.z;
        return Math.sqrt(dx * dx + dz * dz);
    }

    /**
     * Checks for near miss with trail segments
     * @param {Object} entity - Entity to check
     * @param {Array} trailSegments - Array of trail segment positions
     * @param {number} currentTime - Current timestamp
     * @returns {Object|null} Near miss info or null
     */
    checkTrailNearMiss(entity, trailSegments, currentTime = Date.now()) {
        if (!this.enabled || !entity || !entity.position || !trailSegments) {
            return null;
        }

        // Convert trail segments to obstacle format for checking
        const obstacles = trailSegments.map((segment, index) => ({
            id: `trail_${index}`,
            position: segment,
            type: 'trail'
        }));

        return this.checkNearMiss(entity, obstacles, currentTime);
    }

    /**
     * Checks for near miss with arena boundaries
     * @param {Object} entity - Entity to check
     * @param {Object} arenaBounds - Arena boundaries {minX, maxX, minZ, maxZ}
     * @param {number} currentTime - Current timestamp
     * @returns {Object|null} Near miss info or null
     */
    checkBoundaryNearMiss(entity, arenaBounds, currentTime = Date.now()) {
        if (!this.enabled || !entity || !entity.position || !arenaBounds) {
            return null;
        }

        const pos = entity.position;
        let closestDistance = Infinity;
        let closestBoundary = null;

        // Check distance to each boundary
        const boundaries = [
            { type: 'left', position: { x: arenaBounds.minX, y: pos.y, z: pos.z } },
            { type: 'right', position: { x: arenaBounds.maxX, y: pos.y, z: pos.z } },
            { type: 'front', position: { x: pos.x, y: pos.y, z: arenaBounds.minZ } },
            { type: 'back', position: { x: pos.x, y: pos.y, z: arenaBounds.maxZ } }
        ];

        for (const boundary of boundaries) {
            let distance;
            
            // Calculate distance to boundary plane
            switch (boundary.type) {
                case 'left':
                    distance = Math.abs(pos.x - arenaBounds.minX);
                    break;
                case 'right':
                    distance = Math.abs(pos.x - arenaBounds.maxX);
                    break;
                case 'front':
                    distance = Math.abs(pos.z - arenaBounds.minZ);
                    break;
                case 'back':
                    distance = Math.abs(pos.z - arenaBounds.maxZ);
                    break;
            }

            if (distance <= this.detectionRadius && distance < closestDistance) {
                closestDistance = distance;
                closestBoundary = boundary;
            }
        }

        if (closestBoundary) {
            // Check cooldown
            if (currentTime - this.lastNearMiss < this.cooldownPeriod) {
                return null;
            }

            this.lastNearMiss = currentTime;
            const entityId = entity.id || 'default';
            this.recentNearMisses.set(entityId, currentTime);

            return {
                entity: entity,
                obstacle: closestBoundary,
                distance: closestDistance,
                timestamp: currentTime,
                detectionRadius: this.detectionRadius,
                type: 'boundary'
            };
        }

        return null;
    }

    /**
     * Sets the detection radius
     * @param {number} radius - New detection radius in units
     */
    setDetectionRadius(radius) {
        this.detectionRadius = Math.max(0.1, radius);
    }

    /**
     * Gets the current detection radius
     * @returns {number} Current detection radius
     */
    getDetectionRadius() {
        return this.detectionRadius;
    }

    /**
     * Sets the cooldown period
     * @param {number} ms - Cooldown period in milliseconds
     */
    setCooldownPeriod(ms) {
        this.cooldownPeriod = Math.max(0, ms);
    }

    /**
     * Gets the current cooldown period
     * @returns {number} Current cooldown period in milliseconds
     */
    getCooldownPeriod() {
        return this.cooldownPeriod;
    }

    /**
     * Enables or disables near miss detection
     * @param {boolean} enabled - Whether detection is enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.clearCooldowns();
        }
    }

    /**
     * Checks if near miss detection is enabled
     * @returns {boolean} True if enabled
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Clears all cooldown timers
     */
    clearCooldowns() {
        this.lastNearMiss = 0;
        this.recentNearMisses.clear();
    }

    /**
     * Gets the time remaining in global cooldown
     * @param {number} currentTime - Current timestamp
     * @returns {number} Remaining cooldown time in milliseconds
     */
    getRemainingCooldown(currentTime = Date.now()) {
        const remaining = this.cooldownPeriod - (currentTime - this.lastNearMiss);
        return Math.max(0, remaining);
    }

    /**
     * Checks if currently in cooldown period
     * @param {number} currentTime - Current timestamp
     * @returns {boolean} True if in cooldown
     */
    isInCooldown(currentTime = Date.now()) {
        return this.getRemainingCooldown(currentTime) > 0;
    }

    /**
     * Cleans up old entries from recent near misses map
     * @param {number} currentTime - Current timestamp
     */
    cleanupOldEntries(currentTime) {
        const cutoffTime = currentTime - (this.cooldownPeriod * 2); // Keep entries for 2x cooldown period
        
        for (const [entityId, timestamp] of this.recentNearMisses.entries()) {
            if (timestamp < cutoffTime) {
                this.recentNearMisses.delete(entityId);
            }
        }
        
        this.lastCleanup = currentTime;
    }

    /**
     * Gets statistics about recent near miss activity
     * @returns {Object} Statistics object
     */
    getStatistics() {
        return {
            detectionRadius: this.detectionRadius,
            cooldownPeriod: this.cooldownPeriod,
            enabled: this.enabled,
            recentNearMissCount: this.recentNearMisses.size,
            lastNearMissTime: this.lastNearMiss,
            isInCooldown: this.isInCooldown()
        };
    }
}

module.exports = { NearMissDetector };