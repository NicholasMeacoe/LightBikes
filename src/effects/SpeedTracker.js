/**
 * SpeedTracker - Velocity monitoring component for motion blur effects
 *
 * This class implements velocity monitoring for entities in the LightBikes game,
 * providing speed threshold detection for blur activation and smooth blur intensity
 * transitions based on speed changes. It tracks multiple entities and calculates
 * their velocities for integration with the motion blur system.
 *
 * Key Features:
 * - Multi-entity velocity monitoring
 * - Speed threshold detection for blur activation
 * - Smooth speed transitions with configurable smoothing
 * - Historical speed tracking for trend analysis
 * - Power-up speed multiplier integration
 * - Performance-optimized calculations
 *
 * Speed Calculation:
 * - Uses position delta between frames
 * - Applies smoothing to prevent jittery blur effects
 * - Accounts for power-up speed multipliers
 * - Tracks both instantaneous and average speeds
 *
 * Integration Points:
 * - MotionBlurController: Provides speed data for blur intensity
 * - Game state: Monitors entity positions and directions
 * - Power-up system: Accounts for speed modifications
 *
 * Usage Example:
 * ```javascript
 * const speedTracker = new SpeedTracker();
 *
 * // Track entities
 * speedTracker.trackEntity('player', playerEntity);
 * speedTracker.trackEntity('ai1', aiEntity);
 *
 * // Update with game state
 * speedTracker.update(gameState, deltaTime);
 *
 * // Get speed for motion blur
 * const playerSpeed = speedTracker.getEntitySpeed('player');
 * motionBlur.updateBlurIntensity(playerSpeed);
 * ```
 *
 * @class SpeedTracker
 * @author LightBikes Development Team
 * @version 1.0.0
 * @since 2024
 */
const { createLogger } = require('../utils/Logger.js');
const logger = createLogger('SpeedTracker');

class SpeedTracker {
    constructor() {
        // Entity tracking
        this.trackedEntities = new Map(); // entityId -> tracking data

        // Configuration
        this.config = {
            smoothingFactor: 0.15, // Speed smoothing (0 = no smoothing, 1 = maximum smoothing)
            speedThreshold: 1.5, // Minimum speed for blur activation
            maxTrackingHistory: 10, // Number of speed samples to keep
            updateInterval: 16, // Minimum ms between updates (60fps)
            velocityScale: 1.0, // Global velocity scaling factor
        };

        // Performance tracking
        this.lastUpdateTime = 0;
        this.updateCount = 0;

        // Speed statistics
        this.globalStats = {
            maxSpeed: 0,
            averageSpeed: 0,
            activeEntities: 0,
        };
    }

    /**
     * Track an entity for speed monitoring
     * @param {string} entityId - Unique identifier for the entity
     * @param {Object} entity - Entity object with position properties
     */
    trackEntity(entityId, entity) {
        if (!entityId || !entity) {
            logger.warn('Invalid entity or ID provided');
            return;
        }

        const trackingData = {
            entity: entity,
            lastPosition: { x: entity.x || 0, z: entity.z || 0 },
            currentPosition: { x: entity.x || 0, z: entity.z || 0 },
            instantaneousSpeed: 0,
            smoothedSpeed: 0,
            speedHistory: [],
            lastUpdateTime: Date.now(),
            isActive: true,
            speedMultiplier: 1.0,
        };

        this.trackedEntities.set(entityId, trackingData);
        logger.debug(`Now tracking entity: ${entityId}`);
    }

    /**
     * Stop tracking an entity
     * @param {string} entityId - Entity ID to stop tracking
     */
    untrackEntity(entityId) {
        if (this.trackedEntities.has(entityId)) {
            this.trackedEntities.delete(entityId);
            logger.debug(`Stopped tracking entity: ${entityId}`);
        }
    }

    /**
     * Update speed tracking for all entities
     * @param {Object} gameState - Current game state
     * @param {number} deltaTime - Time elapsed since last update in seconds
     */
    update(gameState, deltaTime) {
        const currentTime = Date.now();

        // Throttle updates for performance
        if (currentTime - this.lastUpdateTime < this.config.updateInterval) {
            return;
        }

        try {
            // Update player entity if being tracked
            if (this.trackedEntities.has('player') && gameState.player) {
                this.updateEntitySpeed('player', gameState.player, gameState, deltaTime);
            }

            // Update AI entities
            if (gameState.aiOpponents) {
                gameState.aiOpponents.forEach((ai) => {
                    if (this.trackedEntities.has(ai.id) && ai.alive) {
                        this.updateEntitySpeed(ai.id, ai, gameState, deltaTime);
                    }
                });
            }

            // Handle backward compatibility with single AI
            if (gameState.ai && this.trackedEntities.has('ai') && !gameState.aiOpponents) {
                this.updateEntitySpeed('ai', gameState.ai, gameState, deltaTime);
            }

            // Update global statistics
            this.updateGlobalStats();

            this.lastUpdateTime = currentTime;
            this.updateCount++;
        } catch (error) {
            logger.error('Error during update', error);
        }
    }

    /**
     * Update speed for a specific entity
     * @param {string} entityId - Entity identifier
     * @param {Object} entity - Entity object with position
     * @param {Object} gameState - Current game state
     * @param {number} deltaTime - Time elapsed since last update
     */
    updateEntitySpeed(entityId, entity, gameState, deltaTime) {
        const trackingData = this.trackedEntities.get(entityId);
        if (!trackingData) {
            return;
        }

        try {
            // Update positions
            trackingData.lastPosition = { ...trackingData.currentPosition };
            trackingData.currentPosition = { x: entity.x || 0, z: entity.z || 0 };

            // Calculate instantaneous speed
            const deltaX = trackingData.currentPosition.x - trackingData.lastPosition.x;
            const deltaZ = trackingData.currentPosition.z - trackingData.lastPosition.z;
            const distance = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);

            // Convert to speed (units per second)
            const instantaneousSpeed = deltaTime > 0 ? distance / deltaTime : 0;

            // Get speed multiplier from power-up system if available
            trackingData.speedMultiplier = this.getSpeedMultiplier(entityId, gameState);

            // Apply speed multiplier and global scaling
            const adjustedSpeed =
                instantaneousSpeed * trackingData.speedMultiplier * this.config.velocityScale;

            // Update instantaneous speed
            trackingData.instantaneousSpeed = adjustedSpeed;

            // Apply smoothing to prevent jittery motion blur
            if (trackingData.speedHistory.length === 0) {
                trackingData.smoothedSpeed = adjustedSpeed;
            } else {
                trackingData.smoothedSpeed =
                    trackingData.smoothedSpeed +
                    (adjustedSpeed - trackingData.smoothedSpeed) * this.config.smoothingFactor;
            }

            // Update speed history
            trackingData.speedHistory.push(adjustedSpeed);
            if (trackingData.speedHistory.length > this.config.maxTrackingHistory) {
                trackingData.speedHistory.shift();
            }

            trackingData.lastUpdateTime = Date.now();
            trackingData.isActive = true;

            // Debug logging for significant speed changes
            if (Math.abs(adjustedSpeed - trackingData.smoothedSpeed) > 0.5) {
                logger.debug(
                    `${entityId} speed change - Instant: ${adjustedSpeed.toFixed(2)}, Smoothed: ${trackingData.smoothedSpeed.toFixed(2)}`
                );
            }
        } catch (error) {
            logger.error(`Error updating entity ${entityId}`, error);
            trackingData.isActive = false;
        }
    }

    /**
     * Get speed multiplier for an entity from power-up system
     * @param {string} entityId - Entity identifier
     * @param {Object} gameState - Current game state
     * @returns {number} Speed multiplier
     */
    getSpeedMultiplier(entityId, gameState) {
        try {
            // Check if power-up manager is available
            if (!gameState.powerUpManager) {
                return 1.0;
            }

            // Get speed multiplier based on entity type
            if (entityId === 'player') {
                return gameState.powerUpManager.getSpeedMultiplier('player') || 1.0;
            } else if (entityId.startsWith('ai') || entityId === 'ai') {
                return gameState.powerUpManager.getSpeedMultiplier('ai') || 1.0;
            }

            return 1.0;
        } catch (error) {
            logger.warn(`Error getting speed multiplier for ${entityId}`, error);
            return 1.0;
        }
    }

    /**
     * Get current speed for an entity
     * @param {string} entityId - Entity identifier
     * @param {boolean} useSmoothed - Whether to return smoothed speed (default: true)
     * @returns {number} Current speed or 0 if entity not tracked
     */
    getEntitySpeed(entityId, useSmoothed = true) {
        const trackingData = this.trackedEntities.get(entityId);
        if (!trackingData || !trackingData.isActive) {
            return 0;
        }

        return useSmoothed ? trackingData.smoothedSpeed : trackingData.instantaneousSpeed;
    }

    /**
     * Get maximum speed among all tracked entities
     * @param {boolean} useSmoothed - Whether to use smoothed speeds
     * @returns {number} Maximum speed
     */
    getMaxSpeed(useSmoothed = true) {
        let maxSpeed = 0;

        for (const [entityId, trackingData] of this.trackedEntities) {
            if (trackingData.isActive) {
                const speed = useSmoothed
                    ? trackingData.smoothedSpeed
                    : trackingData.instantaneousSpeed;
                maxSpeed = Math.max(maxSpeed, speed);
            }
        }

        return maxSpeed;
    }

    /**
     * Get average speed among all tracked entities
     * @param {boolean} useSmoothed - Whether to use smoothed speeds
     * @returns {number} Average speed
     */
    getAverageSpeed(useSmoothed = true) {
        let totalSpeed = 0;
        let activeCount = 0;

        for (const [entityId, trackingData] of this.trackedEntities) {
            if (trackingData.isActive) {
                const speed = useSmoothed
                    ? trackingData.smoothedSpeed
                    : trackingData.instantaneousSpeed;
                totalSpeed += speed;
                activeCount++;
            }
        }

        return activeCount > 0 ? totalSpeed / activeCount : 0;
    }

    /**
     * Check if any entity exceeds the speed threshold
     * @returns {boolean} True if any entity is above threshold
     */
    isAnyEntityAboveThreshold() {
        for (const [entityId, trackingData] of this.trackedEntities) {
            // DEBUG: Check ${entityId} active=${trackingData.isActive} speed=${trackingData.smoothedSpeed} thresh=${this.config.speedThreshold}
            if (trackingData.isActive && trackingData.smoothedSpeed > this.config.speedThreshold) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get entities above speed threshold
     * @returns {Array} Array of entity IDs above threshold
     */
    getEntitiesAboveThreshold() {
        const entitiesAboveThreshold = [];

        for (const [entityId, trackingData] of this.trackedEntities) {
            if (trackingData.isActive && trackingData.smoothedSpeed > this.config.speedThreshold) {
                entitiesAboveThreshold.push({
                    entityId,
                    speed: trackingData.smoothedSpeed,
                    instantaneousSpeed: trackingData.instantaneousSpeed,
                });
            }
        }

        return entitiesAboveThreshold;
    }

    /**
     * Update global speed statistics
     */
    updateGlobalStats() {
        let maxSpeed = 0;
        let totalSpeed = 0;
        let activeCount = 0;

        for (const [entityId, trackingData] of this.trackedEntities) {
            if (trackingData.isActive) {
                maxSpeed = Math.max(maxSpeed, trackingData.smoothedSpeed);
                totalSpeed += trackingData.smoothedSpeed;
                activeCount++;
            }
        }

        this.globalStats.maxSpeed = maxSpeed;
        this.globalStats.averageSpeed = activeCount > 0 ? totalSpeed / activeCount : 0;
        this.globalStats.activeEntities = activeCount;
    }

    /**
     * Get speed history for an entity
     * @param {string} entityId - Entity identifier
     * @returns {Array} Speed history array
     */
    getEntitySpeedHistory(entityId) {
        const trackingData = this.trackedEntities.get(entityId);
        return trackingData ? [...trackingData.speedHistory] : [];
    }

    /**
     * Set speed threshold for blur activation
     * @param {number} threshold - New speed threshold
     */
    setSpeedThreshold(threshold) {
        if (typeof threshold === 'number' && threshold >= 0) {
            this.config.speedThreshold = threshold;
            logger.info(`Speed threshold set to ${threshold}`);
        } else {
            logger.warn('Invalid speed threshold value');
        }
    }

    /**
     * Set smoothing factor for speed calculations
     * @param {number} factor - Smoothing factor (0-1)
     */
    setSmoothingFactor(factor) {
        if (typeof factor === 'number' && factor >= 0 && factor <= 1) {
            this.config.smoothingFactor = factor;
            logger.info(`Smoothing factor set to ${factor}`);
        } else {
            logger.warn('Invalid smoothing factor value');
        }
    }

    /**
     * Set global velocity scale
     * @param {number} scale - Velocity scaling factor
     */
    setVelocityScale(scale) {
        if (typeof scale === 'number' && scale > 0) {
            this.config.velocityScale = scale;
            logger.info(`Velocity scale set to ${scale}`);
        } else {
            logger.warn('Invalid velocity scale value');
        }
    }

    /**
     * Get current configuration
     * @returns {Object} Current configuration
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Get global speed statistics
     * @returns {Object} Global statistics
     */
    getGlobalStats() {
        return { ...this.globalStats };
    }

    /**
     * Get tracking status for all entities
     * @returns {Object} Tracking status information
     */
    getTrackingStatus() {
        const status = {
            trackedEntityCount: this.trackedEntities.size,
            activeEntityCount: this.globalStats.activeEntities,
            updateCount: this.updateCount,
            lastUpdateTime: this.lastUpdateTime,
            entities: {},
        };

        for (const [entityId, trackingData] of this.trackedEntities) {
            status.entities[entityId] = {
                isActive: trackingData.isActive,
                instantaneousSpeed: trackingData.instantaneousSpeed,
                smoothedSpeed: trackingData.smoothedSpeed,
                speedMultiplier: trackingData.speedMultiplier,
                historyLength: trackingData.speedHistory.length,
            };
        }

        return status;
    }

    /**
     * Reset all tracking data
     */
    reset() {
        this.trackedEntities.clear();
        this.lastUpdateTime = 0;
        this.updateCount = 0;
        this.globalStats = {
            maxSpeed: 0,
            averageSpeed: 0,
            activeEntities: 0,
        };

        logger.info('Reset all tracking data');
    }

    /**
     * Pause speed tracking
     */
    pause() {
        // Mark all entities as inactive during pause
        for (const [entityId, trackingData] of this.trackedEntities) {
            trackingData.isActive = false;
        }

        logger.debug('Paused');
    }

    /**
     * Resume speed tracking
     */
    resume() {
        const currentTime = Date.now();

        // Reset positions and reactivate entities
        for (const [entityId, trackingData] of this.trackedEntities) {
            if (trackingData.entity) {
                trackingData.lastPosition = {
                    x: trackingData.entity.x || 0,
                    z: trackingData.entity.z || 0,
                };
                trackingData.currentPosition = {
                    x: trackingData.entity.x || 0,
                    z: trackingData.entity.z || 0,
                };
                trackingData.lastUpdateTime = currentTime;
                trackingData.isActive = true;
            }
        }

        this.lastUpdateTime = currentTime;
        logger.debug('Resumed');
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.reset();
        logger.info('Destroyed');
    }
}

module.exports = { SpeedTracker };
