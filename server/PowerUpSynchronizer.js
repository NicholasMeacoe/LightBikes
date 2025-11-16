/**
 * PowerUpSynchronizer - Server-side power-up management for online multiplayer
 * Handles authoritative power-up spawning, collection, and effect synchronization
 */

// Power-up type definitions (synchronized with client)
const POWER_UP_TYPES = {
    SPEED_BOOST: {
        type: 'speed',
        effect: { 
            multiplier: 2.0, 
            duration: 3000 // 3 seconds
        },
        spawnWeight: 25
    },
    SHIELD: {
        type: 'shield',
        effect: { 
            protection: 1, 
            duration: -1 // Permanent until consumed
        },
        spawnWeight: 20
    },
    TRAIL_ERASER: {
        type: 'eraser',
        effect: { 
            segments: 10, 
            duration: 0 // Instant effect
        },
        spawnWeight: 30
    },
    GHOST_MODE: {
        type: 'ghost',
        effect: { 
            phaseThrough: true, 
            duration: 3000 // 3 seconds
        },
        spawnWeight: 25
    }
};

// Spawn configuration
const SPAWN_CONFIG = {
    maxActivePowerUps: 3,
    spawnInterval: { min: 15000, max: 20000 }, // 15-20 seconds
    minDistanceFromBoundary: 5,
    minDistanceFromPlayers: 3,
    minDistanceFromTrails: 1,
    powerUpLifetime: 30000, // 30 seconds
    collectionRadius: 0.5
};

/**
 * PowerUpEntity - Server-side power-up representation
 */
class PowerUpEntity {
    constructor(id, type, position, spawnTime) {
        this.id = id;
        this.type = type;
        this.position = { ...position };
        this.spawnTime = spawnTime;
        this.collected = false;
    }

    isExpired(currentTime) {
        return (currentTime - this.spawnTime) > SPAWN_CONFIG.powerUpLifetime;
    }

    toNetworkFormat() {
        return {
            id: this.id,
            type: this.type,
            position: this.position,
            spawnTime: this.spawnTime
        };
    }
}

/**
 * ActiveEffect - Tracks active power-up effects on players
 */
class ActiveEffect {
    constructor(playerId, type, startTime, duration, data = {}) {
        this.playerId = playerId;
        this.type = type;
        this.startTime = startTime;
        this.duration = duration;
        this.data = { ...data };
    }

    isExpired(currentTime) {
        if (this.duration === -1) return false;
        return (currentTime - this.startTime) > this.duration;
    }

    getRemainingTime(currentTime) {
        if (this.duration === -1) return -1;
        const elapsed = currentTime - this.startTime;
        return Math.max(0, this.duration - elapsed);
    }

    toNetworkFormat(currentTime) {
        return {
            playerId: this.playerId,
            type: this.type,
            remainingTime: this.getRemainingTime(currentTime),
            data: this.data
        };
    }
}

/**
 * PowerUpSynchronizer - Main server-side power-up manager
 */
class PowerUpSynchronizer {
    constructor(gameRoom) {
        this.gameRoom = gameRoom;
        
        // Power-up management
        this.activePowerUps = new Map(); // id -> PowerUpEntity
        this.nextPowerUpId = 1;
        
        // Effect tracking
        this.activeEffects = new Map(); // playerId -> ActiveEffect[]
        
        // Spawn timing
        this.lastSpawnTime = 0;
        this.nextSpawnDelay = this.calculateNextSpawnDelay();
        this.lastSpawnedTypes = [];
        this.maxRecentTypes = 2;
        
        // Collection tracking
        this.lastCollectionCheck = 0;
        this.collectionCheckInterval = 16; // ~60fps
    }

    /**
     * Calculate random spawn delay
     */
    calculateNextSpawnDelay() {
        const { min, max } = SPAWN_CONFIG.spawnInterval;
        return min + Math.random() * (max - min);
    }

    /**
     * Initialize power-up system for game start
     */
    initialize() {
        this.activePowerUps.clear();
        this.activeEffects.clear();
        this.lastSpawnTime = Date.now();
        this.nextSpawnDelay = this.calculateNextSpawnDelay();
        this.lastSpawnedTypes = [];
        this.nextPowerUpId = 1;
        
        // Initialize effect tracking for all players
        const gameState = this.gameRoom.gameState;
        if (gameState) {
            for (const playerId of Object.keys(gameState.players)) {
                this.activeEffects.set(playerId, []);
            }
        }
    }

    /**
     * Main update method
     */
    update(currentTime, gameState) {
        // Handle spawning
        this.updateSpawning(currentTime, gameState);
        
        // Check collections
        this.checkCollections(currentTime, gameState);
        
        // Remove expired power-ups
        this.removeExpiredPowerUps(currentTime);
        
        // Remove expired effects
        this.removeExpiredEffects(currentTime);
    }

    /**
     * Handle power-up spawning
     */
    updateSpawning(currentTime, gameState) {
        const timeSinceLastSpawn = currentTime - this.lastSpawnTime;
        const shouldSpawn = timeSinceLastSpawn >= this.nextSpawnDelay;
        const canSpawn = this.activePowerUps.size < SPAWN_CONFIG.maxActivePowerUps;
        
        if (shouldSpawn && canSpawn) {
            this.attemptSpawn(currentTime, gameState);
            this.lastSpawnTime = currentTime;
            this.nextSpawnDelay = this.calculateNextSpawnDelay();
        }
    }

    /**
     * Attempt to spawn a power-up
     */
    attemptSpawn(currentTime, gameState) {
        const maxAttempts = 10;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const position = this.generateRandomPosition(gameState.bounds);
            
            if (this.isValidSpawnPosition(position, gameState)) {
                const powerUpType = this.selectRandomPowerUpType();
                const powerUp = this.spawnPowerUp(powerUpType, position, currentTime);
                
                // Broadcast spawn event
                this.gameRoom.broadcastToRoom('powerUpSpawned', {
                    powerUp: powerUp.toNetworkFormat()
                });
                
                return true;
            }
        }
        
        return false;
    }

    /**
     * Generate random position within bounds
     */
    generateRandomPosition(bounds) {
        const minPos = bounds.minX + SPAWN_CONFIG.minDistanceFromBoundary;
        const maxPos = bounds.maxX - SPAWN_CONFIG.minDistanceFromBoundary;
        
        return {
            x: minPos + Math.random() * (maxPos - minPos),
            y: 0,
            z: minPos + Math.random() * (maxPos - minPos)
        };
    }

    /**
     * Check if position is valid for spawning
     */
    isValidSpawnPosition(position, gameState) {
        // Check distance from players
        for (const playerState of Object.values(gameState.players)) {
            const distance = this.calculateDistance(position, playerState.position);
            if (distance < SPAWN_CONFIG.minDistanceFromPlayers) {
                return false;
            }
            
            // Check distance from trails
            if (this.isTooCloseToTrail(position, playerState.trail)) {
                return false;
            }
        }
        
        // Check distance from existing power-ups
        for (const powerUp of this.activePowerUps.values()) {
            const distance = this.calculateDistance(position, powerUp.position);
            if (distance < SPAWN_CONFIG.minDistanceFromPlayers) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Check if position is too close to trail
     */
    isTooCloseToTrail(position, trail) {
        const minDistance = SPAWN_CONFIG.minDistanceFromTrails;
        
        for (const segment of trail) {
            if (segment && typeof segment.x === 'number' && typeof segment.z === 'number') {
                const distance = this.calculateDistance(position, segment);
                if (distance < minDistance) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * Calculate distance between positions
     */
    calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = (pos1.y || 0) - (pos2.y || 0);
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    /**
     * Select random power-up type with variety
     */
    selectRandomPowerUpType() {
        const allTypes = Object.keys(POWER_UP_TYPES);
        
        // Filter out recently spawned types
        let availableTypes = allTypes.filter(type => !this.lastSpawnedTypes.includes(type));
        if (availableTypes.length === 0) {
            availableTypes = allTypes;
        }
        
        // Calculate weights
        const weights = availableTypes.map(type => POWER_UP_TYPES[type].spawnWeight);
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < availableTypes.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                const selectedType = availableTypes[i];
                
                // Update recent types
                this.lastSpawnedTypes.push(selectedType);
                if (this.lastSpawnedTypes.length > this.maxRecentTypes) {
                    this.lastSpawnedTypes.shift();
                }
                
                return selectedType;
            }
        }
        
        return availableTypes[0];
    }

    /**
     * Spawn a power-up
     */
    spawnPowerUp(type, position, currentTime) {
        const id = `powerup_${this.nextPowerUpId++}`;
        const powerUp = new PowerUpEntity(id, type, position, currentTime);
        
        this.activePowerUps.set(id, powerUp);
        
        console.log(`[PowerUp] Spawned ${type} at`, position);
        return powerUp;
    }

    /**
     * Check for power-up collections
     */
    checkCollections(currentTime, gameState) {
        // Throttle collection checks
        if (currentTime - this.lastCollectionCheck < this.collectionCheckInterval) {
            return;
        }
        this.lastCollectionCheck = currentTime;
        
        for (const [powerUpId, powerUp] of this.activePowerUps) {
            if (powerUp.collected) continue;
            
            // Check each player
            for (const [playerId, playerState] of Object.entries(gameState.players)) {
                if (!playerState.isAlive) continue;
                
                const distance = this.calculateDistance(powerUp.position, playerState.position);
                
                if (distance <= SPAWN_CONFIG.collectionRadius) {
                    this.handleCollection(playerId, powerUpId, powerUp, currentTime);
                    break; // Only one player can collect
                }
            }
        }
    }

    /**
     * Handle power-up collection
     */
    handleCollection(playerId, powerUpId, powerUp, currentTime) {
        powerUp.collected = true;
        
        // Apply effect
        const effectApplied = this.applyEffect(playerId, powerUp.type, currentTime);
        
        if (effectApplied) {
            // Remove power-up
            this.activePowerUps.delete(powerUpId);
            
            // Broadcast collection event
            this.gameRoom.broadcastToRoom('powerUpCollected', {
                playerId: playerId,
                powerUpId: powerUpId,
                powerUpType: powerUp.type,
                effects: this.getPlayerEffects(playerId, currentTime)
            });
            
            console.log(`[PowerUp] Player ${playerId} collected ${powerUp.type}`);
        }
    }

    /**
     * Apply power-up effect to player
     */
    applyEffect(playerId, powerUpType, currentTime) {
        const typeConfig = POWER_UP_TYPES[powerUpType];
        if (!typeConfig) return false;
        
        // Handle effect stacking
        this.handleEffectStacking(playerId, powerUpType);
        
        // Apply type-specific effect
        switch (powerUpType) {
            case 'SPEED_BOOST':
                return this.applySpeedBoost(playerId, currentTime, typeConfig);
            case 'SHIELD':
                return this.applyShield(playerId, currentTime, typeConfig);
            case 'TRAIL_ERASER':
                return this.applyTrailEraser(playerId, currentTime, typeConfig);
            case 'GHOST_MODE':
                return this.applyGhostMode(playerId, currentTime, typeConfig);
            default:
                return false;
        }
    }

    /**
     * Handle effect stacking rules
     */
    handleEffectStacking(playerId, powerUpType) {
        const playerEffects = this.activeEffects.get(playerId) || [];
        
        // Remove existing effects of same type for replacement-based stacking
        if (powerUpType === 'SPEED_BOOST' || powerUpType === 'GHOST_MODE') {
            const filteredEffects = playerEffects.filter(effect => effect.type !== powerUpType);
            this.activeEffects.set(playerId, filteredEffects);
        }
    }

    /**
     * Apply speed boost effect
     */
    applySpeedBoost(playerId, currentTime, typeConfig) {
        const effect = new ActiveEffect(
            playerId,
            'SPEED_BOOST',
            currentTime,
            typeConfig.effect.duration,
            { multiplier: typeConfig.effect.multiplier }
        );
        
        const playerEffects = this.activeEffects.get(playerId) || [];
        playerEffects.push(effect);
        this.activeEffects.set(playerId, playerEffects);
        
        return true;
    }

    /**
     * Apply shield effect
     */
    applyShield(playerId, currentTime, typeConfig) {
        const effect = new ActiveEffect(
            playerId,
            'SHIELD',
            currentTime,
            typeConfig.effect.duration,
            { protection: typeConfig.effect.protection, consumed: false }
        );
        
        const playerEffects = this.activeEffects.get(playerId) || [];
        playerEffects.push(effect);
        this.activeEffects.set(playerId, playerEffects);
        
        return true;
    }

    /**
     * Apply trail eraser effect
     */
    applyTrailEraser(playerId, currentTime, typeConfig) {
        const gameState = this.gameRoom.gameState;
        const playerState = gameState.players[playerId];
        
        if (playerState && playerState.trail) {
            const segmentsToRemove = Math.min(typeConfig.effect.segments, playerState.trail.length);
            
            if (segmentsToRemove > 0) {
                playerState.trail.splice(-segmentsToRemove, segmentsToRemove);
                console.log(`[PowerUp] Removed ${segmentsToRemove} trail segments for ${playerId}`);
            }
        }
        
        return true;
    }

    /**
     * Apply ghost mode effect
     */
    applyGhostMode(playerId, currentTime, typeConfig) {
        const effect = new ActiveEffect(
            playerId,
            'GHOST_MODE',
            currentTime,
            typeConfig.effect.duration,
            { phaseThrough: typeConfig.effect.phaseThrough }
        );
        
        const playerEffects = this.activeEffects.get(playerId) || [];
        playerEffects.push(effect);
        this.activeEffects.set(playerId, playerEffects);
        
        return true;
    }

    /**
     * Remove expired power-ups
     */
    removeExpiredPowerUps(currentTime) {
        const expiredIds = [];
        
        for (const [id, powerUp] of this.activePowerUps) {
            if (powerUp.isExpired(currentTime)) {
                expiredIds.push(id);
            }
        }
        
        for (const id of expiredIds) {
            this.activePowerUps.delete(id);
            
            // Broadcast removal
            this.gameRoom.broadcastToRoom('powerUpExpired', {
                powerUpId: id
            });
        }
    }

    /**
     * Remove expired effects
     */
    removeExpiredEffects(currentTime) {
        for (const [playerId, effects] of this.activeEffects) {
            const validEffects = effects.filter(effect => {
                if (effect.isExpired(currentTime)) {
                    // Broadcast effect expiration
                    this.gameRoom.broadcastToRoom('effectExpired', {
                        playerId: playerId,
                        effectType: effect.type
                    });
                    return false;
                }
                if (effect.type === 'SHIELD' && effect.data.consumed) {
                    return false;
                }
                return true;
            });
            
            this.activeEffects.set(playerId, validEffects);
        }
    }

    /**
     * Get speed multiplier for player
     */
    getSpeedMultiplier(playerId, currentTime) {
        const playerEffects = this.activeEffects.get(playerId) || [];
        const speedEffects = playerEffects.filter(e => 
            e.type === 'SPEED_BOOST' && !e.isExpired(currentTime)
        );
        
        if (speedEffects.length > 0) {
            return speedEffects[speedEffects.length - 1].data.multiplier;
        }
        
        return 1.0;
    }

    /**
     * Check if player is in ghost mode
     */
    isInGhostMode(playerId, currentTime) {
        const playerEffects = this.activeEffects.get(playerId) || [];
        return playerEffects.some(e => 
            e.type === 'GHOST_MODE' && !e.isExpired(currentTime)
        );
    }

    /**
     * Check if player has shield
     */
    hasShield(playerId, currentTime) {
        const playerEffects = this.activeEffects.get(playerId) || [];
        return playerEffects.some(e => 
            e.type === 'SHIELD' && !e.isExpired(currentTime) && !e.data.consumed
        );
    }

    /**
     * Consume shield for player
     */
    consumeShield(playerId) {
        const playerEffects = this.activeEffects.get(playerId) || [];
        const shieldIndex = playerEffects.findIndex(e => 
            e.type === 'SHIELD' && !e.data.consumed
        );
        
        if (shieldIndex !== -1) {
            playerEffects[shieldIndex].data.consumed = true;
            
            // Broadcast shield consumption
            this.gameRoom.broadcastToRoom('shieldConsumed', {
                playerId: playerId
            });
            
            return true;
        }
        
        return false;
    }

    /**
     * Get player effects for network transmission
     */
    getPlayerEffects(playerId, currentTime) {
        const playerEffects = this.activeEffects.get(playerId) || [];
        return playerEffects
            .filter(e => !e.isExpired(currentTime))
            .map(e => e.toNetworkFormat(currentTime));
    }

    /**
     * Get all active power-ups for network transmission
     */
    getAllPowerUps() {
        return Array.from(this.activePowerUps.values())
            .filter(p => !p.collected)
            .map(p => p.toNetworkFormat());
    }

    /**
     * Get all active effects for network transmission
     */
    getAllEffects(currentTime) {
        const allEffects = {};
        for (const [playerId, effects] of this.activeEffects) {
            allEffects[playerId] = effects
                .filter(e => !e.isExpired(currentTime))
                .map(e => e.toNetworkFormat(currentTime));
        }
        return allEffects;
    }

    /**
     * Reset power-up system
     */
    reset() {
        this.activePowerUps.clear();
        this.activeEffects.clear();
        this.lastSpawnTime = 0;
        this.nextSpawnDelay = this.calculateNextSpawnDelay();
        this.lastSpawnedTypes = [];
        this.nextPowerUpId = 1;
    }
}

module.exports = {
    PowerUpSynchronizer,
    POWER_UP_TYPES,
    SPAWN_CONFIG
};
