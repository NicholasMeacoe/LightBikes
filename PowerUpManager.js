/**
 * PowerUpManager - Manages power-up spawning, collection, and effects in LightBikes
 * Integrates with existing game systems following the established architecture patterns
 */

/**
 * PowerUpObjectPool - Object pooling for efficient memory management
 * Reuses PowerUpEntity objects to reduce garbage collection overhead
 */
class PowerUpObjectPool {
    constructor() {
        this.pool = [];
        this.maxPoolSize = 10; // Reasonable limit for power-up entities
    }

    /**
     * Get a PowerUpEntity from the pool or create new one
     */
    acquire(id, type, position) {
        let entity;
        if (this.pool.length > 0) {
            entity = this.pool.pop();
            // Reset entity properties
            entity.id = id;
            entity.type = type;
            entity.position = { ...position };
            entity.appearance = { ...POWER_UP_TYPES[type].appearance };
            entity.spawnTime = Date.now();
            entity.maxLifetime = SPAWN_CONFIG.powerUpLifetime;
            entity.collected = false;
        } else {
            entity = new PowerUpEntity(id, type, position);
        }
        return entity;
    }

    /**
     * Return a PowerUpEntity to the pool for reuse
     */
    release(entity) {
        if (this.pool.length < this.maxPoolSize) {
            // Clear references to prevent memory leaks
            entity.id = null;
            entity.type = null;
            entity.position = null;
            entity.appearance = null;
            entity.collected = false;
            this.pool.push(entity);
        }
        // If pool is full, let entity be garbage collected
    }

    /**
     * Clear the entire pool (for cleanup)
     */
    clear() {
        this.pool.length = 0;
    }
}

/**
 * SpatialGrid - Spatial partitioning for efficient collision detection
 * Divides the arena into grid cells to reduce distance calculations
 */
class SpatialGrid {
    constructor(arenaSize, gridSize) {
        this.arenaSize = arenaSize;
        this.gridSize = gridSize;
        this.cellSize = arenaSize / gridSize;
        this.grid = new Map(); // cellKey -> Set of entity IDs
        this.entityPositions = new Map(); // entityId -> {x, z, cellKey}
    }

    /**
     * Get grid cell key for a position
     */
    getCellKey(x, z) {
        const cellX = Math.floor((x + this.arenaSize / 2) / this.cellSize);
        const cellZ = Math.floor((z + this.arenaSize / 2) / this.cellSize);
        return `${cellX},${cellZ}`;
    }

    /**
     * Add entity to spatial grid
     */
    addEntity(entityId, x, z) {
        const cellKey = this.getCellKey(x, z);
        
        if (!this.grid.has(cellKey)) {
            this.grid.set(cellKey, new Set());
        }
        
        this.grid.get(cellKey).add(entityId);
        this.entityPositions.set(entityId, { x, z, cellKey });
    }

    /**
     * Remove entity from spatial grid
     */
    removeEntity(entityId) {
        const entityData = this.entityPositions.get(entityId);
        if (entityData) {
            const cell = this.grid.get(entityData.cellKey);
            if (cell) {
                cell.delete(entityId);
                if (cell.size === 0) {
                    this.grid.delete(entityData.cellKey);
                }
            }
            this.entityPositions.delete(entityId);
        }
    }

    /**
     * Get nearby entities within radius of a position
     */
    getNearbyEntities(x, z, radius) {
        const nearbyEntities = new Set();
        const cellRadius = Math.ceil(radius / this.cellSize);
        const centerCellX = Math.floor((x + this.arenaSize / 2) / this.cellSize);
        const centerCellZ = Math.floor((z + this.arenaSize / 2) / this.cellSize);

        // Check surrounding cells
        for (let dx = -cellRadius; dx <= cellRadius; dx++) {
            for (let dz = -cellRadius; dz <= cellRadius; dz++) {
                const cellKey = `${centerCellX + dx},${centerCellZ + dz}`;
                const cell = this.grid.get(cellKey);
                if (cell) {
                    for (const entityId of cell) {
                        nearbyEntities.add(entityId);
                    }
                }
            }
        }

        return nearbyEntities;
    }

    /**
     * Update entity position in grid
     */
    updateEntity(entityId, x, z) {
        this.removeEntity(entityId);
        this.addEntity(entityId, x, z);
    }

    /**
     * Clear all entities from grid
     */
    clear() {
        this.grid.clear();
        this.entityPositions.clear();
    }
}

// Power-up type enumeration and configuration
const POWER_UP_TYPES = {
    SPEED_BOOST: {
        type: 'speed',
        appearance: { 
            shape: 'cube', 
            color: 0x0066ff, 
            glow: true,
            size: { x: 0.8, y: 0.8, z: 0.8 }
        },
        effect: { 
            multiplier: 2.0, 
            duration: 3000 // 3 seconds
        },
        spawnWeight: 25
    },
    SHIELD: {
        type: 'shield',
        appearance: { 
            shape: 'sphere', 
            color: 0xffd700, 
            glow: true,
            size: { radius: 0.6 }
        },
        effect: { 
            protection: 1, 
            duration: -1 // Permanent until consumed
        },
        spawnWeight: 20
    },
    TRAIL_ERASER: {
        type: 'eraser',
        appearance: { 
            shape: 'diamond', 
            color: 0x9932cc, 
            glow: true,
            size: { x: 0.8, y: 0.8, z: 0.8 }
        },
        effect: { 
            segments: 10, 
            duration: 0 // Instant effect
        },
        spawnWeight: 30
    },
    GHOST_MODE: {
        type: 'ghost',
        appearance: { 
            shape: 'cube', 
            color: 0xffffff, 
            opacity: 0.7,
            size: { x: 0.8, y: 0.8, z: 0.8 }
        },
        effect: { 
            phaseThrough: true, 
            duration: 3000 // 3 seconds
        },
        spawnWeight: 25
    }
};

// Spawn system configuration
const SPAWN_CONFIG = {
    maxActivePowerUps: 3,
    spawnInterval: { min: 15000, max: 20000 }, // 15-20 seconds
    minDistanceFromBoundary: 5,
    minDistanceFromPlayers: 3,
    minDistanceFromTrails: 1,
    powerUpLifetime: 30000, // 30 seconds auto-removal
    collectionRadius: 0.5
};

/**
 * PowerUpEntity - Represents a collectible power-up in the arena
 */
class PowerUpEntity {
    constructor(id, type, position) {
        this.id = id;
        this.type = type;
        this.position = { ...position };
        this.appearance = { ...POWER_UP_TYPES[type].appearance };
        this.spawnTime = Date.now();
        this.maxLifetime = SPAWN_CONFIG.powerUpLifetime;
        this.collected = false;
    }

    /**
     * Check if this power-up has expired and should be removed
     */
    isExpired() {
        return (Date.now() - this.spawnTime) > this.maxLifetime;
    }

    /**
     * Get the configuration for this power-up type
     */
    getTypeConfig() {
        return POWER_UP_TYPES[this.type];
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
        this.duration = duration; // -1 for permanent effects
        this.data = { ...data };
    }

    /**
     * Check if this effect has expired
     */
    isExpired() {
        if (this.duration === -1) return false; // Permanent effect
        return (Date.now() - this.startTime) > this.duration;
    }

    /**
     * Get remaining time for this effect
     */
    getRemainingTime() {
        if (this.duration === -1) return -1; // Permanent effect
        const elapsed = Date.now() - this.startTime;
        return Math.max(0, this.duration - elapsed);
    }
}

/**
 * PowerUpManager - Main class for managing the power-up system
 */
class PowerUpManager {
    constructor(game, renderer, collisionDetector, audioManager = null) {
        this.game = game;
        this.renderer = renderer;
        this.collisionDetector = collisionDetector;
        this.audioManager = audioManager;
        
        // Power-up entity management
        this.activePowerUps = new Map(); // id -> PowerUpEntity
        this.nextPowerUpId = 1;
        
        // Effect tracking per player
        this.activeEffects = new Map(); // playerId -> ActiveEffect[]
        
        // Spawn timing and variety cycling
        this.lastSpawnTime = 0;
        this.nextSpawnDelay = this.calculateNextSpawnDelay();
        this.lastSpawnedTypes = []; // Track recent spawns for variety
        this.maxRecentTypes = 2; // Avoid repeating same type too often
        
        // Performance optimizations
        this.objectPool = new PowerUpObjectPool();
        this.spatialGrid = new SpatialGrid(60, 8); // 60x60 arena, 8x8 grid
        this.lastCollectionCheck = 0;
        this.collectionCheckInterval = 16; // ~60fps check rate
        
        // Memory management
        this.cleanupCounter = 0;
        this.cleanupInterval = 300; // Cleanup every 5 seconds at 60fps
        
        // Initialize player effect tracking
        this.activeEffects.set('player', []);
        this.activeEffects.set('ai', []);
    }

    /**
     * Calculate random spawn delay within configured range
     */
    calculateNextSpawnDelay() {
        const { min, max } = SPAWN_CONFIG.spawnInterval;
        return min + Math.random() * (max - min);
    }

    /**
     * Get all power-up type configurations
     */
    static getPowerUpTypes() {
        return POWER_UP_TYPES;
    }

    /**
     * Get spawn configuration
     */
    static getSpawnConfig() {
        return SPAWN_CONFIG;
    }

    /**
     * Get active power-ups for external systems
     */
    getActivePowerUps() {
        return Array.from(this.activePowerUps.values());
    }

    /**
     * Get active effects for a specific player
     */
    getActiveEffects(playerId) {
        return this.activeEffects.get(playerId) || [];
    }

    /**
     * Get all active effects for all players
     */
    getAllActiveEffects() {
        const allEffects = {};
        for (const [playerId, effects] of this.activeEffects) {
            allEffects[playerId] = [...effects];
        }
        return allEffects;
    }

    /**
     * Main update method - called from game loop with performance optimizations
     */
    update(deltaTime) {
        const currentTime = Date.now();
        
        // Handle spawning
        this.updateSpawning(currentTime);
        
        // Remove expired power-ups
        this.removeExpiredPowerUps();
        
        // Remove expired effects
        this.removeExpiredEffects();
        
        // Periodic cleanup for memory management
        this.cleanupCounter++;
        if (this.cleanupCounter >= this.cleanupInterval) {
            this.performPeriodicCleanup();
            this.cleanupCounter = 0;
        }
        
        // Update renderer with current power-ups
        this.updateRenderer();
    }

    /**
     * Perform periodic cleanup for memory management
     */
    performPeriodicCleanup() {
        // Force garbage collection of unused object pool items if pool is too large
        if (this.objectPool.pool.length > this.objectPool.maxPoolSize) {
            const excess = this.objectPool.pool.length - this.objectPool.maxPoolSize;
            this.objectPool.pool.splice(0, excess);
        }
        
        // Clean up empty spatial grid cells
        for (const [cellKey, cell] of this.spatialGrid.grid) {
            if (cell.size === 0) {
                this.spatialGrid.grid.delete(cellKey);
            }
        }
        
        console.debug('Performed periodic cleanup - object pool size:', this.objectPool.pool.length);
    }

    /**
     * Handle power-up spawning logic with timing and limits
     */
    updateSpawning(currentTime) {
        // Check if it's time to spawn and we haven't reached the limit
        const timeSinceLastSpawn = currentTime - this.lastSpawnTime;
        const shouldSpawn = timeSinceLastSpawn >= this.nextSpawnDelay;
        const canSpawn = this.activePowerUps.size < SPAWN_CONFIG.maxActivePowerUps;
        
        if (shouldSpawn && canSpawn) {
            this.attemptSpawn();
            this.lastSpawnTime = currentTime;
            this.nextSpawnDelay = this.calculateNextSpawnDelay();
        }
    }

    /**
     * Attempt to spawn a power-up at a valid location
     */
    attemptSpawn() {
        const gameState = this.game.getGameState();
        const maxAttempts = 10; // Prevent infinite loops
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const position = this.generateRandomPosition(gameState.bounds);
            
            if (this.isValidSpawnPosition(position, gameState)) {
                const powerUpType = this.selectRandomPowerUpType();
                this.spawnPowerUp(powerUpType, position);
                return true;
            }
        }
        
        // If we couldn't find a valid position after max attempts, skip this spawn
        console.debug('Could not find valid spawn position after', maxAttempts, 'attempts');
        return false;
    }

    /**
     * Generate a random position within arena bounds
     */
    generateRandomPosition(bounds) {
        const minPos = -bounds + SPAWN_CONFIG.minDistanceFromBoundary;
        const maxPos = bounds - SPAWN_CONFIG.minDistanceFromBoundary;
        
        return {
            x: minPos + Math.random() * (maxPos - minPos),
            y: 0,
            z: minPos + Math.random() * (maxPos - minPos)
        };
    }

    /**
     * Check if a position is valid for spawning a power-up
     */
    isValidSpawnPosition(position, gameState) {
        // Check distance from players
        const playerDistance = this.calculateDistance(position, gameState.player);
        const aiDistance = this.calculateDistance(position, gameState.ai);
        
        if (playerDistance < SPAWN_CONFIG.minDistanceFromPlayers || 
            aiDistance < SPAWN_CONFIG.minDistanceFromPlayers) {
            return false;
        }
        
        // Check distance from trails
        if (this.isTooCloseToTrails(position, gameState.playerTrail) ||
            this.isTooCloseToTrails(position, gameState.aiTrail)) {
            return false;
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
     * Check if position is too close to any trail segments
     */
    isTooCloseToTrails(position, trail) {
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
     * Calculate 3D distance between two positions
     */
    calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = (pos1.y || 0) - (pos2.y || 0);
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    /**
     * Select a random power-up type based on spawn weights with variety cycling
     * Ensures variety by avoiding recently spawned types when possible
     */
    selectRandomPowerUpType() {
        const allTypes = Object.keys(POWER_UP_TYPES);
        
        // Filter out recently spawned types for variety (if we have alternatives)
        let availableTypes = allTypes.filter(type => !this.lastSpawnedTypes.includes(type));
        
        // If all types were recently spawned, use all types
        if (availableTypes.length === 0) {
            availableTypes = allTypes;
        }
        
        // Calculate weights for available types
        const weights = availableTypes.map(type => POWER_UP_TYPES[type].spawnWeight);
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < availableTypes.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                const selectedType = availableTypes[i];
                
                // Update recent types tracking for variety cycling
                this.lastSpawnedTypes.push(selectedType);
                if (this.lastSpawnedTypes.length > this.maxRecentTypes) {
                    this.lastSpawnedTypes.shift(); // Remove oldest
                }
                
                return selectedType;
            }
        }
        
        // Fallback to first available type if something goes wrong
        const fallbackType = availableTypes[0];
        this.lastSpawnedTypes.push(fallbackType);
        if (this.lastSpawnedTypes.length > this.maxRecentTypes) {
            this.lastSpawnedTypes.shift();
        }
        
        return fallbackType;
    }

    /**
     * Create and register a new power-up entity using object pooling
     */
    spawnPowerUp(type, position) {
        const id = `powerup_${this.nextPowerUpId++}`;
        const powerUp = this.objectPool.acquire(id, type, position);
        
        this.activePowerUps.set(id, powerUp);
        
        // Add to spatial grid for efficient collision detection
        this.spatialGrid.addEntity(id, position.x, position.z);
        
        console.debug(`Spawned ${type} power-up at`, position);
        return powerUp;
    }

    /**
     * Remove expired power-ups (30 second lifetime) with efficient cleanup
     */
    removeExpiredPowerUps() {
        const expiredIds = [];
        
        for (const [id, powerUp] of this.activePowerUps) {
            if (powerUp.isExpired()) {
                expiredIds.push(id);
            }
        }
        
        for (const id of expiredIds) {
            const powerUp = this.activePowerUps.get(id);
            if (powerUp) {
                // Remove from spatial grid
                this.spatialGrid.removeEntity(id);
                
                // Return to object pool for reuse
                this.objectPool.release(powerUp);
                
                // Remove from active power-ups
                this.activePowerUps.delete(id);
                
                console.debug(`Removed expired power-up: ${id}`);
            }
        }
    }

    /**
     * Remove expired effects from all players
     * Handles cleanup and expiration for all effect types
     */
    removeExpiredEffects() {
        for (const [playerId, effects] of this.activeEffects) {
            const validEffects = [];
            
            for (const effect of effects) {
                if (effect.isExpired()) {
                    // Handle effect-specific cleanup when expiring
                    this.handleEffectExpiration(playerId, effect);
                } else if (effect.type === 'SHIELD' && effect.data.consumed) {
                    // Remove consumed shields
                    console.debug(`Removing consumed shield for ${playerId}`);
                } else {
                    // Keep valid, non-expired, non-consumed effects
                    validEffects.push(effect);
                }
            }
            
            this.activeEffects.set(playerId, validEffects);
        }
    }

    /**
     * Handle cleanup when an effect expires
     */
    handleEffectExpiration(playerId, effect) {
        switch (effect.type) {
            case 'SPEED_BOOST':
                console.debug(`Speed boost expired for ${playerId}`);
                // Speed will return to normal automatically when effect is removed
                break;
            case 'GHOST_MODE':
                console.debug(`Ghost mode expired for ${playerId}`);
                // Collision detection will return to normal automatically
                break;
            case 'SHIELD':
                console.debug(`Shield expired for ${playerId}`);
                break;
            default:
                console.debug(`Effect ${effect.type} expired for ${playerId}`);
        }
    }

    /**
     * Check for power-up collections by players with optimized spatial partitioning
     * Integration point with collision detection system
     * Implements distance-based collection detection with 0.5 unit radius
     */
    checkCollections(gameState) {
        const collections = [];
        const currentTime = Date.now();
        
        // Only check collections if game is active (not paused or over)
        if (gameState.isPaused || gameState.gameOver) {
            return collections;
        }
        
        // Throttle collection checks for performance (60fps rate)
        if (currentTime - this.lastCollectionCheck < this.collectionCheckInterval) {
            return collections;
        }
        this.lastCollectionCheck = currentTime;
        
        // Check player collections using spatial partitioning
        const playerCollections = this.checkPlayerCollectionsOptimized('player', gameState.player);
        collections.push(...playerCollections);
        
        // Check AI collections using spatial partitioning
        const aiCollections = this.checkPlayerCollectionsOptimized('ai', gameState.ai);
        collections.push(...aiCollections);
        
        // Process collections immediately
        for (const collection of collections) {
            this.processCollection(collection);
        }
        
        return collections;
    }

    /**
     * Check collections for a specific player using spatial partitioning optimization
     * Implements 0.5 unit collection radius as specified in requirements
     */
    checkPlayerCollectionsOptimized(playerId, playerPosition) {
        const collections = [];
        
        // Validate player position
        if (!playerPosition || typeof playerPosition.x !== 'number' || typeof playerPosition.z !== 'number') {
            return collections;
        }
        
        // Use spatial grid to get only nearby power-ups
        const nearbyEntityIds = this.spatialGrid.getNearbyEntities(
            playerPosition.x, 
            playerPosition.z, 
            SPAWN_CONFIG.collectionRadius * 2 // Search radius slightly larger than collection radius
        );
        
        for (const powerUpId of nearbyEntityIds) {
            const powerUp = this.activePowerUps.get(powerUpId);
            
            // Skip if power-up doesn't exist or already collected
            if (!powerUp || powerUp.collected) continue;
            
            // Calculate distance using optimized 2D distance (y is always 0 for power-ups)
            const dx = playerPosition.x - powerUp.position.x;
            const dz = playerPosition.z - powerUp.position.z;
            const distanceSquared = dx * dx + dz * dz;
            const collectionRadiusSquared = SPAWN_CONFIG.collectionRadius * SPAWN_CONFIG.collectionRadius;
            
            // Check if within collection radius using squared distance (faster than sqrt)
            if (distanceSquared <= collectionRadiusSquared) {
                // Mark as collected to prevent duplicate collections
                powerUp.collected = true;
                
                collections.push({
                    playerId,
                    powerUpId,
                    powerUpType: powerUp.type,
                    position: { ...powerUp.position },
                    collectionTime: Date.now()
                });
                
                console.debug(`Player ${playerId} collected ${powerUp.type} power-up at distance ${Math.sqrt(distanceSquared).toFixed(2)}`);
            }
        }
        
        return collections;
    }

    /**
     * Check collections for a specific player using distance-based detection (fallback method)
     * Implements 0.5 unit collection radius as specified in requirements
     */
    checkPlayerCollections(playerId, playerPosition) {
        const collections = [];
        
        // Validate player position
        if (!playerPosition || typeof playerPosition.x !== 'number' || typeof playerPosition.z !== 'number') {
            return collections;
        }
        
        for (const [powerUpId, powerUp] of this.activePowerUps) {
            // Skip already collected power-ups (duplicate collection prevention)
            if (powerUp.collected) continue;
            
            // Calculate distance using 3D distance formula
            const distance = this.calculateDistance(playerPosition, powerUp.position);
            
            // Check if within collection radius (0.5 units as per requirements)
            if (distance <= SPAWN_CONFIG.collectionRadius) {
                // Mark as collected to prevent duplicate collections
                powerUp.collected = true;
                
                collections.push({
                    playerId,
                    powerUpId,
                    powerUpType: powerUp.type,
                    position: { ...powerUp.position },
                    collectionTime: Date.now()
                });
                
                console.debug(`Player ${playerId} collected ${powerUp.type} power-up at distance ${distance.toFixed(2)}`);
            }
        }
        
        return collections;
    }

    /**
     * Process a collection event - apply effects and cleanup
     * Handles the complete collection workflow
     */
    processCollection(collection) {
        const { playerId, powerUpId, powerUpType } = collection;
        
        // Apply the power-up effect to the player
        const effectApplied = this.applyEffect(playerId, powerUpType);
        
        if (effectApplied) {
            // Remove the collected power-up from the arena
            this.removePowerUp(powerUpId);
            
            // Trigger collection feedback (for future audio/visual integration)
            this.triggerCollectionFeedback(collection);
        } else {
            // If effect application failed, unmark the power-up as collected
            const powerUp = this.activePowerUps.get(powerUpId);
            if (powerUp) {
                powerUp.collected = false;
            }
        }
    }

    /**
     * Trigger collection feedback for audio and visual systems
     * Integration point for audio and visual feedback systems
     */
    triggerCollectionFeedback(collection) {
        console.debug(`Collection feedback triggered for ${collection.powerUpType} by ${collection.playerId}`);
        
        // Trigger audio feedback if audio system is available
        if (this.audioManager && typeof this.audioManager.playPowerUpCollectionSound === 'function') {
            this.audioManager.playPowerUpCollectionSound();
        }
        
        // Trigger visual feedback if renderer supports it
        if (this.renderer && typeof this.renderer.createCollectionEffect === 'function') {
            this.renderer.createCollectionEffect(collection.position, collection.powerUpType);
        }
        
        // Trigger collection notification if renderer supports it
        if (this.renderer && typeof this.renderer.displayCollectionNotification === 'function') {
            this.renderer.displayCollectionNotification(collection.powerUpType, collection.position);
        }
    }

    /**
     * Apply power-up effect to a player
     * Implements specific logic for each power-up type
     */
    applyEffect(playerId, powerUpType, effectData = {}) {
        const typeConfig = POWER_UP_TYPES[powerUpType];
        if (!typeConfig) {
            console.warn(`Unknown power-up type: ${powerUpType}`);
            return false;
        }
        
        const currentTime = Date.now();
        
        // Handle effect stacking rules and interactions
        this.handleEffectStacking(playerId, powerUpType);
        
        // Apply type-specific effect logic
        let effectApplied = false;
        
        switch (powerUpType) {
            case 'SPEED_BOOST':
                effectApplied = this.applySpeedBoostEffect(playerId, currentTime, typeConfig);
                break;
            case 'SHIELD':
                effectApplied = this.applyShieldEffect(playerId, currentTime, typeConfig);
                break;
            case 'TRAIL_ERASER':
                effectApplied = this.applyTrailEraserEffect(playerId, currentTime, typeConfig);
                break;
            case 'GHOST_MODE':
                effectApplied = this.applyGhostModeEffect(playerId, currentTime, typeConfig);
                break;
            default:
                console.warn(`Unhandled power-up type: ${powerUpType}`);
                return false;
        }
        
        if (effectApplied) {
            console.debug(`Applied ${powerUpType} effect to ${playerId}`);
        }
        
        return effectApplied;
    }

    /**
     * Handle effect stacking rules and interactions
     * Manages how multiple effects of the same type interact
     */
    handleEffectStacking(playerId, powerUpType) {
        const playerEffects = this.activeEffects.get(playerId) || [];
        
        // Remove existing effects of the same type for replacement-based stacking
        if (powerUpType === 'SPEED_BOOST' || powerUpType === 'GHOST_MODE') {
            const filteredEffects = playerEffects.filter(effect => effect.type !== powerUpType);
            this.activeEffects.set(playerId, filteredEffects);
        }
        
        // For SHIELD, allow stacking (multiple shields = multiple protections)
        // For TRAIL_ERASER, instant effect so no stacking concerns
    }

    /**
     * Apply Speed Boost effect - 2x speed multiplier for 3 seconds
     */
    applySpeedBoostEffect(playerId, currentTime, typeConfig) {
        const effect = new ActiveEffect(
            playerId,
            'SPEED_BOOST',
            currentTime,
            typeConfig.effect.duration,
            { 
                multiplier: typeConfig.effect.multiplier,
                originalSpeed: null // Will be set when effect is activated
            }
        );
        
        const playerEffects = this.activeEffects.get(playerId) || [];
        playerEffects.push(effect);
        this.activeEffects.set(playerId, playerEffects);
        
        return true;
    }

    /**
     * Apply Shield effect - collision immunity until consumed
     */
    applyShieldEffect(playerId, currentTime, typeConfig) {
        const effect = new ActiveEffect(
            playerId,
            'SHIELD',
            currentTime,
            typeConfig.effect.duration, // -1 for permanent until consumed
            { 
                protection: typeConfig.effect.protection,
                consumed: false
            }
        );
        
        const playerEffects = this.activeEffects.get(playerId) || [];
        playerEffects.push(effect);
        this.activeEffects.set(playerId, playerEffects);
        
        return true;
    }

    /**
     * Apply Trail Eraser effect - removes last 10 trail segments immediately
     */
    applyTrailEraserEffect(playerId, currentTime, typeConfig) {
        // Get the appropriate trail from game state
        const gameState = this.game.getGameState();
        let targetTrail;
        
        if (playerId === 'player') {
            targetTrail = gameState.playerTrail;
        } else if (playerId === 'ai') {
            targetTrail = gameState.aiTrail;
        } else {
            console.warn(`Unknown player ID for trail eraser: ${playerId}`);
            return false;
        }
        
        // Remove last N segments (or all if fewer than N)
        const segmentsToRemove = Math.min(typeConfig.effect.segments, targetTrail.length);
        
        if (segmentsToRemove > 0) {
            // Remove segments from the end of the trail
            targetTrail.splice(-segmentsToRemove, segmentsToRemove);
            console.debug(`Removed ${segmentsToRemove} trail segments for ${playerId}`);
        }
        
        // Trail Eraser is an instant effect, no need to track it as an active effect
        return true;
    }

    /**
     * Apply Ghost Mode effect - trail-passing capability for 3 seconds
     */
    applyGhostModeEffect(playerId, currentTime, typeConfig) {
        const effect = new ActiveEffect(
            playerId,
            'GHOST_MODE',
            currentTime,
            typeConfig.effect.duration,
            { 
                phaseThrough: typeConfig.effect.phaseThrough,
                originalOpacity: null // Will be set when effect is activated
            }
        );
        
        const playerEffects = this.activeEffects.get(playerId) || [];
        playerEffects.push(effect);
        this.activeEffects.set(playerId, playerEffects);
        
        return true;
    }

    /**
     * Check if a player has a specific type of active effect
     */
    hasActiveEffect(playerId, effectType) {
        const playerEffects = this.activeEffects.get(playerId) || [];
        return playerEffects.some(effect => 
            effect.type === effectType && !effect.isExpired()
        );
    }

    /**
     * Get active effects of a specific type for a player
     */
    getActiveEffectsOfType(playerId, effectType) {
        const playerEffects = this.activeEffects.get(playerId) || [];
        return playerEffects.filter(effect => 
            effect.type === effectType && !effect.isExpired()
        );
    }

    /**
     * Consume a shield effect (when player would have crashed)
     * Returns true if shield was consumed, false if no shield available
     */
    consumeShield(playerId) {
        const playerEffects = this.activeEffects.get(playerId) || [];
        
        // Find the first active shield effect
        const shieldIndex = playerEffects.findIndex(effect => 
            effect.type === 'SHIELD' && !effect.isExpired() && !effect.data.consumed
        );
        
        if (shieldIndex !== -1) {
            // Mark shield as consumed
            playerEffects[shieldIndex].data.consumed = true;
            console.debug(`Shield consumed for ${playerId}`);
            return true;
        }
        
        return false;
    }

    /**
     * Get current speed multiplier for a player (for Speed Boost effect)
     */
    getSpeedMultiplier(playerId) {
        const speedEffects = this.getActiveEffectsOfType(playerId, 'SPEED_BOOST');
        
        if (speedEffects.length > 0) {
            // Return the multiplier from the most recent speed boost
            const latestEffect = speedEffects[speedEffects.length - 1];
            return latestEffect.data.multiplier;
        }
        
        return 1.0; // Normal speed
    }

    /**
     * Check if a player is in Ghost Mode (can pass through trails)
     */
    isInGhostMode(playerId) {
        return this.hasActiveEffect(playerId, 'GHOST_MODE');
    }

    /**
     * Check if a player has shield protection
     */
    hasShieldProtection(playerId) {
        const shieldEffects = this.getActiveEffectsOfType(playerId, 'SHIELD');
        return shieldEffects.some(effect => !effect.data.consumed);
    }

    /**
     * Remove a collected power-up from the arena with efficient cleanup
     */
    removePowerUp(powerUpId) {
        const powerUp = this.activePowerUps.get(powerUpId);
        if (powerUp) {
            // Remove from spatial grid
            this.spatialGrid.removeEntity(powerUpId);
            
            // Return to object pool for reuse
            this.objectPool.release(powerUp);
            
            // Remove from active power-ups
            this.activePowerUps.delete(powerUpId);
            
            console.debug(`Removed collected power-up: ${powerUpId}`);
            return true;
        }
        return false;
    }

    /**
     * Get power-up entities for rendering system integration
     */
    getPowerUpsForRendering() {
        return Array.from(this.activePowerUps.values())
            .filter(powerUp => !powerUp.collected)
            .map(powerUp => ({
                id: powerUp.id,
                type: powerUp.type,
                position: powerUp.position,
                appearance: powerUp.appearance
            }));
    }

    /**
     * Update renderer with current power-up entities
     */
    updateRenderer() {
        if (this.renderer && typeof this.renderer.registerPowerUps === 'function') {
            const powerUpsForRendering = this.getPowerUpsForRendering();
            this.renderer.registerPowerUps(powerUpsForRendering);
        }
    }

    /**
     * Handle game pause state
     * Integration point with game state management
     */
    handlePause() {
        // Power-ups continue to exist during pause but don't spawn
        // Effects continue to tick down during pause for balance
    }

    /**
     * Handle game resume state
     * Integration point with game state management
     */
    handleResume() {
        // Resume normal operation
        // No special handling needed as update() will resume normal spawning
    }

    /**
     * Get debug information for development
     */
    getDebugInfo() {
        return {
            activePowerUps: this.activePowerUps.size,
            maxPowerUps: SPAWN_CONFIG.maxActivePowerUps,
            nextSpawnIn: Math.max(0, this.nextSpawnDelay - (Date.now() - this.lastSpawnTime)),
            activeEffects: Object.fromEntries(
                Array.from(this.activeEffects.entries()).map(([playerId, effects]) => [
                    playerId,
                    effects.map(effect => ({
                        type: effect.type,
                        remaining: effect.getRemainingTime()
                    }))
                ])
            )
        };
    }

    /**
     * Reset all power-ups and effects (for game restart)
     * Comprehensive cleanup for memory management and game state consistency
     */
    reset() {
        // Return all active power-ups to object pool before clearing
        for (const [id, powerUp] of this.activePowerUps) {
            this.objectPool.release(powerUp);
        }
        
        // Clear all active power-ups
        this.activePowerUps.clear();
        
        // Clear all active effects
        for (const playerId of this.activeEffects.keys()) {
            this.activeEffects.set(playerId, []);
        }
        
        // Clear spatial grid
        this.spatialGrid.clear();
        
        // Clear power-ups from renderer
        if (this.renderer && typeof this.renderer.clearPowerUps === 'function') {
            this.renderer.clearPowerUps();
        }
        
        // Reset spawn timing and variety tracking
        this.lastSpawnTime = 0;
        this.nextSpawnDelay = this.calculateNextSpawnDelay();
        this.nextPowerUpId = 1;
        this.lastSpawnedTypes = []; // Reset variety cycling
        
        // Reset performance optimization counters
        this.lastCollectionCheck = 0;
        this.cleanupCounter = 0;
        
        console.debug('PowerUpManager reset completed - all power-ups and effects cleared');
    }
}

module.exports = { 
    PowerUpManager, 
    PowerUpEntity, 
    ActiveEffect, 
    POWER_UP_TYPES, 
    SPAWN_CONFIG 
};