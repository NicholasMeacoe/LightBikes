const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
};

const MockLoggerClass = jest.fn().mockImplementation(() => mockLogger);
MockLoggerClass.create = jest.fn((namespace) => mockLogger);

jest.mock('@/utils/Logger.js', () => ({
    Logger: MockLoggerClass,
    logger: mockLogger,
    createLogger: jest.fn(() => mockLogger),
}));

const {
    PowerUpManager,
    PowerUpEntity,
    ActiveEffect,
    POWER_UP_TYPES,
    SPAWN_CONFIG,
} = require('@/systems/PowerUpManager.js');

// Mock dependencies
const mockGame = {
    getGameState: () => ({
        bounds: 30,
        player: { x: 0, y: 0, z: 0 },
        ai: { x: 0, y: 0, z: -10 },
        playerTrail: [],
        aiTrail: [],
    }),
};

const mockRenderer = {};
const mockCollisionDetector = {};

describe('PowerUpManager', () => {
    let powerUpManager;

    beforeEach(() => {
        powerUpManager = new PowerUpManager(mockGame, mockRenderer, mockCollisionDetector);
    });

    describe('constructor', () => {
        it('should initialize with empty power-ups and effects', () => {
            expect(powerUpManager.activePowerUps.size).toBe(0);
            expect(powerUpManager.getActiveEffects('player')).toEqual([]);
            expect(powerUpManager.getActiveEffects('ai')).toEqual([]);
        });

        it('should set up spawn timing', () => {
            expect(powerUpManager.lastSpawnTime).toBe(0);
            expect(powerUpManager.nextSpawnDelay).toBeGreaterThan(0);
        });
    });

    describe('calculateNextSpawnDelay', () => {
        it('should return delay within configured range', () => {
            const delay = powerUpManager.calculateNextSpawnDelay();
            expect(delay).toBeGreaterThanOrEqual(SPAWN_CONFIG.spawnInterval.min);
            expect(delay).toBeLessThanOrEqual(SPAWN_CONFIG.spawnInterval.max);
        });
    });

    describe('generateRandomPosition', () => {
        it('should generate position within bounds', () => {
            const bounds = 30;
            const position = powerUpManager.generateRandomPosition(bounds);

            const minPos = -bounds + SPAWN_CONFIG.minDistanceFromBoundary;
            const maxPos = bounds - SPAWN_CONFIG.minDistanceFromBoundary;

            expect(position.x).toBeGreaterThanOrEqual(minPos);
            expect(position.x).toBeLessThanOrEqual(maxPos);
            expect(position.z).toBeGreaterThanOrEqual(minPos);
            expect(position.z).toBeLessThanOrEqual(maxPos);
            expect(position.y).toBe(0);
        });
    });

    describe('calculateDistance', () => {
        it('should calculate correct 3D distance', () => {
            const pos1 = { x: 0, y: 0, z: 0 };
            const pos2 = { x: 3, y: 4, z: 0 };
            const distance = powerUpManager.calculateDistance(pos1, pos2);
            expect(distance).toBe(5); // 3-4-5 triangle
        });

        it('should handle missing y coordinates', () => {
            const pos1 = { x: 0, z: 0 };
            const pos2 = { x: 3, z: 4 };
            const distance = powerUpManager.calculateDistance(pos1, pos2);
            expect(distance).toBe(5);
        });
    });

    describe('selectRandomPowerUpType', () => {
        it('should return a valid power-up type', () => {
            const type = powerUpManager.selectRandomPowerUpType();
            expect(Object.keys(POWER_UP_TYPES)).toContain(type);
        });
    });

    describe('spawnPowerUp', () => {
        it('should create and register a new power-up', () => {
            const position = { x: 10, y: 0, z: 10 };
            const powerUp = powerUpManager.spawnPowerUp('SPEED_BOOST', position);

            expect(powerUp).toBeInstanceOf(PowerUpEntity);
            expect(powerUp.type).toBe('SPEED_BOOST');
            expect(powerUp.position).toEqual(position);
            expect(powerUpManager.activePowerUps.size).toBe(1);
        });
    });

    describe('applyEffect', () => {
        it('should add effect to player', () => {
            const success = powerUpManager.applyEffect('player', 'SPEED_BOOST');

            expect(success).toBe(true);
            const effects = powerUpManager.getActiveEffects('player');
            expect(effects).toHaveLength(1);
            expect(effects[0].type).toBe('SPEED_BOOST');
        });

        it('should handle invalid power-up type', () => {
            const success = powerUpManager.applyEffect('player', 'INVALID_TYPE');

            expect(success).toBe(false);
            const effects = powerUpManager.getActiveEffects('player');
            expect(effects).toHaveLength(0);
        });

        it('should apply Speed Boost effect with correct properties', () => {
            const success = powerUpManager.applyEffect('player', 'SPEED_BOOST');

            expect(success).toBe(true);
            const effects = powerUpManager.getActiveEffects('player');
            expect(effects).toHaveLength(1);
            expect(effects[0].type).toBe('SPEED_BOOST');
            expect(effects[0].data.multiplier).toBe(2.0);
            expect(effects[0].duration).toBe(3000);
        });

        it('should apply Shield effect with correct properties', () => {
            const success = powerUpManager.applyEffect('player', 'SHIELD');

            expect(success).toBe(true);
            const effects = powerUpManager.getActiveEffects('player');
            expect(effects).toHaveLength(1);
            expect(effects[0].type).toBe('SHIELD');
            expect(effects[0].data.protection).toBe(1);
            expect(effects[0].duration).toBe(-1); // Permanent until consumed
            expect(effects[0].data.consumed).toBe(false);
        });

        it('should apply Ghost Mode effect with correct properties', () => {
            const success = powerUpManager.applyEffect('player', 'GHOST_MODE');

            expect(success).toBe(true);
            const effects = powerUpManager.getActiveEffects('player');
            expect(effects).toHaveLength(1);
            expect(effects[0].type).toBe('GHOST_MODE');
            expect(effects[0].data.phaseThrough).toBe(true);
            expect(effects[0].duration).toBe(3000);
        });

        it('should apply Trail Eraser effect and remove trail segments', () => {
            // Create a trail array that will be modified
            const playerTrail = [
                { x: 1, z: 1 },
                { x: 2, z: 2 },
                { x: 3, z: 3 },
                { x: 4, z: 4 },
                { x: 5, z: 5 },
                { x: 6, z: 6 },
                { x: 7, z: 7 },
                { x: 8, z: 8 },
                { x: 9, z: 9 },
                { x: 10, z: 10 },
                { x: 11, z: 11 },
                { x: 12, z: 12 },
            ];

            // Mock game state with trail segments
            const mockGameWithTrail = {
                getGameState: () => ({
                    bounds: 30,
                    player: { x: 0, y: 0, z: 0 },
                    ai: { x: 0, y: 0, z: -10 },
                    playerTrail: playerTrail,
                    aiTrail: [],
                }),
            };

            const trailManager = new PowerUpManager(
                mockGameWithTrail,
                mockRenderer,
                mockCollisionDetector
            );
            const originalLength = playerTrail.length;

            const success = trailManager.applyEffect('player', 'TRAIL_ERASER');

            expect(success).toBe(true);
            expect(playerTrail.length).toBe(originalLength - 10);
        });

        it('should handle effect stacking for Speed Boost (replacement)', () => {
            // Apply first speed boost
            powerUpManager.applyEffect('player', 'SPEED_BOOST');
            expect(powerUpManager.getActiveEffects('player')).toHaveLength(1);

            // Apply second speed boost - should replace the first
            powerUpManager.applyEffect('player', 'SPEED_BOOST');
            expect(powerUpManager.getActiveEffects('player')).toHaveLength(1);
        });

        it('should handle effect stacking for Shield (additive)', () => {
            // Apply first shield
            powerUpManager.applyEffect('player', 'SHIELD');
            expect(powerUpManager.getActiveEffects('player')).toHaveLength(1);

            // Apply second shield - should stack
            powerUpManager.applyEffect('player', 'SHIELD');
            expect(powerUpManager.getActiveEffects('player')).toHaveLength(2);
        });
    });

    describe('checkCollections', () => {
        it('should detect collection when player is close enough', () => {
            // Spawn power-up at player position
            const playerPos = { x: 0, y: 0, z: 0 };
            powerUpManager.spawnPowerUp('SPEED_BOOST', playerPos);

            const gameState = {
                player: playerPos,
                ai: { x: 10, y: 0, z: 10 },
            };

            const collections = powerUpManager.checkCollections(gameState);
            expect(collections).toHaveLength(1);
            expect(collections[0].playerId).toBe('player');
            expect(collections[0].powerUpType).toBe('SPEED_BOOST');
        });

        it('should not detect collection when player is too far', () => {
            // Spawn power-up far from player
            powerUpManager.spawnPowerUp('SPEED_BOOST', { x: 10, y: 0, z: 10 });

            const gameState = {
                player: { x: 0, y: 0, z: 0 },
                ai: { x: 0, y: 0, z: -10 },
            };

            const collections = powerUpManager.checkCollections(gameState);
            expect(collections).toHaveLength(0);
        });
    });

    describe('effect utility methods', () => {
        beforeEach(() => {
            // Apply various effects for testing
            powerUpManager.applyEffect('player', 'SPEED_BOOST');
            powerUpManager.applyEffect('player', 'SHIELD');
            powerUpManager.applyEffect('player', 'GHOST_MODE');
        });

        it('should check for active effects correctly', () => {
            expect(powerUpManager.hasActiveEffect('player', 'SPEED_BOOST')).toBe(true);
            expect(powerUpManager.hasActiveEffect('player', 'SHIELD')).toBe(true);
            expect(powerUpManager.hasActiveEffect('player', 'GHOST_MODE')).toBe(true);
            expect(powerUpManager.hasActiveEffect('player', 'TRAIL_ERASER')).toBe(false);
        });

        it('should get speed multiplier correctly', () => {
            expect(powerUpManager.getSpeedMultiplier('player')).toBe(2.0);
            expect(powerUpManager.getSpeedMultiplier('ai')).toBe(1.0); // No speed boost
        });

        it('should check ghost mode correctly', () => {
            expect(powerUpManager.isInGhostMode('player')).toBe(true);
            expect(powerUpManager.isInGhostMode('ai')).toBe(false);
        });

        it('should check shield protection correctly', () => {
            expect(powerUpManager.hasShieldProtection('player')).toBe(true);
            expect(powerUpManager.hasShieldProtection('ai')).toBe(false);
        });

        it('should consume shield correctly', () => {
            expect(powerUpManager.hasShieldProtection('player')).toBe(true);

            const consumed = powerUpManager.consumeShield('player');
            expect(consumed).toBe(true);
            expect(powerUpManager.hasShieldProtection('player')).toBe(false);

            // Try to consume again - should fail
            const consumedAgain = powerUpManager.consumeShield('player');
            expect(consumedAgain).toBe(false);
        });

        it('should get active effects of specific type', () => {
            const speedEffects = powerUpManager.getActiveEffectsOfType('player', 'SPEED_BOOST');
            expect(speedEffects).toHaveLength(1);
            expect(speedEffects[0].type).toBe('SPEED_BOOST');

            const shieldEffects = powerUpManager.getActiveEffectsOfType('player', 'SHIELD');
            expect(shieldEffects).toHaveLength(1);
            expect(shieldEffects[0].type).toBe('SHIELD');
        });
    });

    describe('reset', () => {
        it('should clear all power-ups and effects', () => {
            // Add some power-ups and effects
            powerUpManager.spawnPowerUp('SPEED_BOOST', { x: 0, y: 0, z: 0 });
            powerUpManager.applyEffect('player', 'SHIELD');

            expect(powerUpManager.activePowerUps.size).toBe(1);
            expect(powerUpManager.getActiveEffects('player')).toHaveLength(1);

            powerUpManager.reset();

            expect(powerUpManager.activePowerUps.size).toBe(0);
            expect(powerUpManager.getActiveEffects('player')).toHaveLength(0);
            expect(powerUpManager.lastSpawnTime).toBe(0);
        });
    });

    describe('renderer integration', () => {
        it('should call renderer.registerPowerUps when updateRenderer is called', () => {
            const mockRenderer = {
                registerPowerUps: jest.fn(),
            };

            const powerUpManagerWithRenderer = new PowerUpManager(
                mockGame,
                mockRenderer,
                mockCollisionDetector
            );

            // Spawn a power-up
            powerUpManagerWithRenderer.spawnPowerUp('SPEED_BOOST', { x: 0, y: 0, z: 0 });

            // Call updateRenderer
            powerUpManagerWithRenderer.updateRenderer();

            expect(mockRenderer.registerPowerUps).toHaveBeenCalledTimes(1);
            expect(mockRenderer.registerPowerUps).toHaveBeenCalledWith([
                expect.objectContaining({
                    id: expect.any(String),
                    type: 'SPEED_BOOST',
                    position: { x: 0, y: 0, z: 0 },
                    appearance: expect.any(Object),
                }),
            ]);
        });

        it('should call renderer.clearPowerUps on reset', () => {
            const mockRenderer = {
                clearPowerUps: jest.fn(),
            };

            const powerUpManagerWithRenderer = new PowerUpManager(
                mockGame,
                mockRenderer,
                mockCollisionDetector
            );

            powerUpManagerWithRenderer.reset();

            expect(mockRenderer.clearPowerUps).toHaveBeenCalledTimes(1);
        });

        it('should trigger collection feedback with audio and visual effects', () => {
            const mockRenderer = {
                createCollectionEffect: jest.fn(),
                displayCollectionNotification: jest.fn(),
            };

            const mockAudioManager = {
                playPowerUpCollectionSound: jest.fn(),
            };

            const powerUpManagerWithFeedback = new PowerUpManager(
                mockGame,
                mockRenderer,
                mockCollisionDetector,
                mockAudioManager
            );

            const collection = {
                playerId: 'player',
                powerUpType: 'SPEED_BOOST',
                position: { x: 5, y: 0, z: 5 },
            };

            powerUpManagerWithFeedback.triggerCollectionFeedback(collection);

            expect(mockAudioManager.playPowerUpCollectionSound).toHaveBeenCalledTimes(1);
            expect(mockRenderer.createCollectionEffect).toHaveBeenCalledWith(
                collection.position,
                collection.powerUpType
            );
            expect(mockRenderer.displayCollectionNotification).toHaveBeenCalledWith(
                collection.powerUpType,
                collection.position
            );
        });
    });
});

describe('PowerUpEntity', () => {
    it('should initialize with correct properties', () => {
        const position = { x: 5, y: 0, z: -5 };
        const entity = new PowerUpEntity('test_1', 'SPEED_BOOST', position);

        expect(entity.id).toBe('test_1');
        expect(entity.type).toBe('SPEED_BOOST');
        expect(entity.position).toEqual(position);
        expect(entity.collected).toBe(false);
        expect(entity.spawnTime).toBeGreaterThan(0);
    });

    it('should detect expiration correctly', () => {
        const entity = new PowerUpEntity('test_1', 'SPEED_BOOST', { x: 0, y: 0, z: 0 });

        // Should not be expired immediately
        expect(entity.isExpired()).toBe(false);

        // Mock old spawn time
        entity.spawnTime = Date.now() - (SPAWN_CONFIG.powerUpLifetime + 1000);
        expect(entity.isExpired()).toBe(true);
    });
});

describe('ActiveEffect', () => {
    it('should initialize with correct properties', () => {
        const startTime = Date.now();
        const effect = new ActiveEffect('player', 'SPEED_BOOST', startTime, 3000, {
            multiplier: 2.0,
        });

        expect(effect.playerId).toBe('player');
        expect(effect.type).toBe('SPEED_BOOST');
        expect(effect.startTime).toBe(startTime);
        expect(effect.duration).toBe(3000);
        expect(effect.data.multiplier).toBe(2.0);
    });

    it('should detect expiration for timed effects', () => {
        const effect = new ActiveEffect('player', 'SPEED_BOOST', Date.now() - 4000, 3000);
        expect(effect.isExpired()).toBe(true);

        const activeEffect = new ActiveEffect('player', 'SPEED_BOOST', Date.now(), 3000);
        expect(activeEffect.isExpired()).toBe(false);
    });

    it('should handle permanent effects', () => {
        const effect = new ActiveEffect('player', 'SHIELD', Date.now() - 10000, -1);
        expect(effect.isExpired()).toBe(false);
        expect(effect.getRemainingTime()).toBe(-1);
    });

    it('should calculate remaining time correctly', () => {
        const startTime = Date.now() - 1000; // 1 second ago
        const effect = new ActiveEffect('player', 'SPEED_BOOST', startTime, 3000);

        const remaining = effect.getRemainingTime();
        expect(remaining).toBeGreaterThan(1900); // Should be around 2000ms
        expect(remaining).toBeLessThanOrEqual(2000);
    });
});

describe('POWER_UP_TYPES configuration', () => {
    it('should have all required power-up types', () => {
        const requiredTypes = ['SPEED_BOOST', 'SHIELD', 'TRAIL_ERASER', 'GHOST_MODE'];

        for (const type of requiredTypes) {
            expect(POWER_UP_TYPES[type]).toBeDefined();
            expect(POWER_UP_TYPES[type].type).toBeDefined();
            expect(POWER_UP_TYPES[type].appearance).toBeDefined();
            expect(POWER_UP_TYPES[type].effect).toBeDefined();
            expect(POWER_UP_TYPES[type].spawnWeight).toBeGreaterThan(0);
        }
    });
});

describe('SPAWN_CONFIG configuration', () => {
    it('should have valid spawn configuration', () => {
        expect(SPAWN_CONFIG.maxActivePowerUps).toBeGreaterThan(0);
        expect(SPAWN_CONFIG.spawnInterval.min).toBeGreaterThan(0);
        expect(SPAWN_CONFIG.spawnInterval.max).toBeGreaterThan(SPAWN_CONFIG.spawnInterval.min);
        expect(SPAWN_CONFIG.collectionRadius).toBeGreaterThan(0);
        expect(SPAWN_CONFIG.powerUpLifetime).toBeGreaterThan(0);
    });
});

// Comprehensive test suite for power-up system - Task 6 implementation
describe('PowerUpManager - Comprehensive Test Suite', () => {
    let powerUpManager;
    let mockGameWithComplexState;

    beforeEach(() => {
        // Create more complex mock game state for comprehensive testing
        mockGameWithComplexState = {
            getGameState: () => ({
                bounds: 30,
                player: { x: 0, y: 0, z: 0 },
                ai: { x: 15, y: 0, z: 15 },
                playerTrail: [
                    { x: 0, z: 1 },
                    { x: 0, z: 2 },
                    { x: 0, z: 3 },
                    { x: 0, z: 4 },
                    { x: 0, z: 5 },
                ],
                aiTrail: [
                    { x: 15, z: 14 },
                    { x: 15, z: 13 },
                    { x: 15, z: 12 },
                ],
                isPaused: false,
                gameOver: false,
            }),
        };

        powerUpManager = new PowerUpManager(
            mockGameWithComplexState,
            mockRenderer,
            mockCollisionDetector
        );
    });

    describe('Spawn Logic and Validation', () => {
        it('should validate spawn positions against boundaries in generateRandomPosition', () => {
            const bounds = 30;
            const minDistance = SPAWN_CONFIG.minDistanceFromBoundary; // 5 units

            // Test that generateRandomPosition respects boundaries
            for (let i = 0; i < 100; i++) {
                const position = powerUpManager.generateRandomPosition(bounds);

                // Should be within valid range
                const minPos = -bounds + minDistance;
                const maxPos = bounds - minDistance;

                expect(position.x).toBeGreaterThanOrEqual(minPos);
                expect(position.x).toBeLessThanOrEqual(maxPos);
                expect(position.z).toBeGreaterThanOrEqual(minPos);
                expect(position.z).toBeLessThanOrEqual(maxPos);
                expect(position.y).toBe(0);
            }
        });

        it('should validate spawn positions against player positions', () => {
            const gameState = mockGameWithComplexState.getGameState();

            // Position too close to player
            const tooCloseToPlayer = { x: 1, y: 0, z: 1 }; // Distance < 3 units
            expect(powerUpManager.isValidSpawnPosition(tooCloseToPlayer, gameState)).toBe(false);

            // Position too close to AI
            const tooCloseToAI = { x: 16, y: 0, z: 16 }; // Distance < 3 units from AI
            expect(powerUpManager.isValidSpawnPosition(tooCloseToAI, gameState)).toBe(false);

            // Valid position away from both players
            const validPosition = { x: 10, y: 0, z: 0 };
            expect(powerUpManager.isValidSpawnPosition(validPosition, gameState)).toBe(true);
        });

        it('should validate spawn positions against trails', () => {
            const gameState = mockGameWithComplexState.getGameState();

            // Position too close to player trail
            const tooCloseToPlayerTrail = { x: 0.5, y: 0, z: 2.5 }; // Close to trail segment
            expect(powerUpManager.isValidSpawnPosition(tooCloseToPlayerTrail, gameState)).toBe(
                false
            );

            // Position too close to AI trail
            const tooCloseToAITrail = { x: 15.5, y: 0, z: 13.5 }; // Close to AI trail
            expect(powerUpManager.isValidSpawnPosition(tooCloseToAITrail, gameState)).toBe(false);

            // Valid position away from trails
            const validPosition = { x: 10, y: 0, z: 10 };
            expect(powerUpManager.isValidSpawnPosition(validPosition, gameState)).toBe(true);
        });

        it('should validate spawn positions against existing power-ups', () => {
            const gameState = mockGameWithComplexState.getGameState();

            // Spawn first power-up
            const firstPosition = { x: 10, y: 0, z: 10 };
            powerUpManager.spawnPowerUp('SPEED_BOOST', firstPosition);

            // Try to spawn too close to existing power-up
            const tooClose = { x: 11, y: 0, z: 11 }; // Distance < 3 units
            expect(powerUpManager.isValidSpawnPosition(tooClose, gameState)).toBe(false);

            // Valid position away from existing power-up
            const validPosition = { x: 20, y: 0, z: 20 };
            expect(powerUpManager.isValidSpawnPosition(validPosition, gameState)).toBe(true);
        });

        it('should enforce maximum active power-up limit', () => {
            // Mock successful spawn attempts
            jest.spyOn(powerUpManager, 'isValidSpawnPosition').mockReturnValue(true);

            // Spawn up to the limit
            for (let i = 0; i < SPAWN_CONFIG.maxActivePowerUps; i++) {
                const success = powerUpManager.attemptSpawn();
                expect(success).toBe(true);
            }

            expect(powerUpManager.activePowerUps.size).toBe(SPAWN_CONFIG.maxActivePowerUps);

            // Should not spawn more when at limit
            powerUpManager.lastSpawnTime = 0; // Force spawn timing
            powerUpManager.nextSpawnDelay = 0;
            powerUpManager.updateSpawning(Date.now());

            expect(powerUpManager.activePowerUps.size).toBe(SPAWN_CONFIG.maxActivePowerUps);
        });

        it('should handle failed spawn attempts gracefully', () => {
            // Mock all spawn positions as invalid
            jest.spyOn(powerUpManager, 'isValidSpawnPosition').mockReturnValue(false);

            const success = powerUpManager.attemptSpawn();
            expect(success).toBe(false);
            expect(powerUpManager.activePowerUps.size).toBe(0);
        });

        it('should cycle through power-up types for variety', () => {
            jest.spyOn(powerUpManager, 'isValidSpawnPosition').mockReturnValue(true);

            const spawnedTypes = [];

            // Spawn multiple power-ups and track types
            for (let i = 0; i < 10; i++) {
                const type = powerUpManager.selectRandomPowerUpType();
                spawnedTypes.push(type);
            }

            // Should have variety (not all the same type)
            const uniqueTypes = new Set(spawnedTypes);
            expect(uniqueTypes.size).toBeGreaterThan(1);
        });
    });

    describe('Effect Expiration and Cleanup', () => {
        it('should remove expired power-ups automatically', () => {
            // Spawn power-up with mocked old timestamp
            const powerUp = powerUpManager.spawnPowerUp('SPEED_BOOST', { x: 0, y: 0, z: 0 });
            powerUp.spawnTime = Date.now() - (SPAWN_CONFIG.powerUpLifetime + 1000);

            expect(powerUpManager.activePowerUps.size).toBe(1);

            powerUpManager.removeExpiredPowerUps();

            expect(powerUpManager.activePowerUps.size).toBe(0);
        });

        it('should remove expired effects automatically', () => {
            // Apply effect and verify it's active
            powerUpManager.applyEffect('player', 'SPEED_BOOST');
            expect(powerUpManager.hasActiveEffect('player', 'SPEED_BOOST')).toBe(true);

            // Mock old timestamp to make effect expired
            const effects = powerUpManager.getActiveEffects('player');
            effects[0].startTime = Date.now() - 4000; // Older than 3 second duration

            // Remove expired effects
            powerUpManager.removeExpiredEffects();

            expect(powerUpManager.hasActiveEffect('player', 'SPEED_BOOST')).toBe(false);
        });

        it('should handle consumed shield cleanup', () => {
            powerUpManager.applyEffect('player', 'SHIELD');
            expect(powerUpManager.hasShieldProtection('player')).toBe(true);

            // Consume the shield
            powerUpManager.consumeShield('player');
            expect(powerUpManager.hasShieldProtection('player')).toBe(false);

            // Cleanup should remove consumed shield
            powerUpManager.removeExpiredEffects();

            const shieldEffects = powerUpManager.getActiveEffectsOfType('player', 'SHIELD');
            expect(shieldEffects.length).toBe(0);
        });

        it('should handle effect expiration callbacks', () => {
            // Create expired effects
            const speedEffect = new ActiveEffect('player', 'SPEED_BOOST', Date.now() - 4000, 3000);
            const ghostEffect = new ActiveEffect('player', 'GHOST_MODE', Date.now() - 4000, 3000);
            const shieldEffect = new ActiveEffect('player', 'SHIELD', Date.now() - 4000, 1000);

            // Test expiration handling
            powerUpManager.handleEffectExpiration('player', speedEffect);
            powerUpManager.handleEffectExpiration('player', ghostEffect);
            powerUpManager.handleEffectExpiration('player', shieldEffect);

            expect(mockLogger.debug).toHaveBeenCalledWith('Speed boost expired for player');
            expect(mockLogger.debug).toHaveBeenCalledWith('Ghost mode expired for player');
            expect(mockLogger.debug).toHaveBeenCalledWith('Shield expired for player');
        });
    });

    describe('Collection Detection Edge Cases', () => {
        it('should handle invalid player positions gracefully', () => {
            powerUpManager.spawnPowerUp('SPEED_BOOST', { x: 0, y: 0, z: 0 });

            // Test with invalid player positions
            const invalidPositions = [
                null,
                undefined,
                {},
                { x: 'invalid' },
                { z: 'invalid' },
                { x: null, z: null },
            ];

            for (const invalidPos of invalidPositions) {
                const collections = powerUpManager.checkPlayerCollections('player', invalidPos);
                expect(collections).toHaveLength(0);
            }
        });

        it('should prevent duplicate collections', () => {
            const powerUp = powerUpManager.spawnPowerUp('SPEED_BOOST', { x: 0, y: 0, z: 0 });
            const playerPos = { x: 0, y: 0, z: 0 };

            // First collection should succeed
            const firstCollections = powerUpManager.checkPlayerCollections('player', playerPos);
            expect(firstCollections).toHaveLength(1);
            expect(powerUp.collected).toBe(true);

            // Second collection attempt should fail (already collected)
            const secondCollections = powerUpManager.checkPlayerCollections('player', playerPos);
            expect(secondCollections).toHaveLength(0);
        });

        it('should respect collection radius precisely', () => {
            const powerUpPos = { x: 0, y: 0, z: 0 };
            powerUpManager.spawnPowerUp('SPEED_BOOST', powerUpPos);

            // Position exactly at collection radius boundary
            const exactRadius = { x: SPAWN_CONFIG.collectionRadius, y: 0, z: 0 };
            const collections1 = powerUpManager.checkPlayerCollections('player', exactRadius);
            expect(collections1).toHaveLength(1);

            // Reset for next test
            powerUpManager.reset();
            powerUpManager.spawnPowerUp('SPEED_BOOST', powerUpPos);

            // Position just outside collection radius
            const outsideRadius = { x: SPAWN_CONFIG.collectionRadius + 0.01, y: 0, z: 0 };
            const collections2 = powerUpManager.checkPlayerCollections('player', outsideRadius);
            expect(collections2).toHaveLength(0);
        });

        it('should not detect collections when game is paused or over', () => {
            powerUpManager.spawnPowerUp('SPEED_BOOST', { x: 0, y: 0, z: 0 });

            // Mock paused game state
            const pausedGameState = {
                ...mockGameWithComplexState.getGameState(),
                isPaused: true,
            };

            const pausedCollections = powerUpManager.checkCollections(pausedGameState);
            expect(pausedCollections).toHaveLength(0);

            // Mock game over state
            const gameOverState = {
                ...mockGameWithComplexState.getGameState(),
                gameOver: true,
            };

            const gameOverCollections = powerUpManager.checkCollections(gameOverState);
            expect(gameOverCollections).toHaveLength(0);
        });
    });

    describe('Effect Stacking and Interactions', () => {
        it('should handle multiple shield stacking correctly', () => {
            // Apply multiple shields
            powerUpManager.applyEffect('player', 'SHIELD');
            powerUpManager.applyEffect('player', 'SHIELD');
            powerUpManager.applyEffect('player', 'SHIELD');

            const shieldEffects = powerUpManager.getActiveEffectsOfType('player', 'SHIELD');
            expect(shieldEffects).toHaveLength(3);

            // Consume shields one by one
            expect(powerUpManager.consumeShield('player')).toBe(true);
            expect(powerUpManager.hasShieldProtection('player')).toBe(true); // Still has shields

            expect(powerUpManager.consumeShield('player')).toBe(true);
            expect(powerUpManager.hasShieldProtection('player')).toBe(true); // Still has shields

            expect(powerUpManager.consumeShield('player')).toBe(true);
            expect(powerUpManager.hasShieldProtection('player')).toBe(false); // No more shields

            expect(powerUpManager.consumeShield('player')).toBe(false); // No shields to consume
        });

        it('should replace speed boost effects (no stacking)', () => {
            // Apply first speed boost
            powerUpManager.applyEffect('player', 'SPEED_BOOST');
            let speedEffects = powerUpManager.getActiveEffectsOfType('player', 'SPEED_BOOST');
            expect(speedEffects).toHaveLength(1);
            const firstEffectTime = speedEffects[0].startTime;

            // Wait a bit and apply second speed boost
            setTimeout(() => {
                powerUpManager.applyEffect('player', 'SPEED_BOOST');
                speedEffects = powerUpManager.getActiveEffectsOfType('player', 'SPEED_BOOST');
                expect(speedEffects).toHaveLength(1); // Should replace, not stack
                expect(speedEffects[0].startTime).toBeGreaterThan(firstEffectTime);
            }, 10);
        });

        it('should replace ghost mode effects (no stacking)', () => {
            // Apply first ghost mode
            powerUpManager.applyEffect('player', 'GHOST_MODE');
            let ghostEffects = powerUpManager.getActiveEffectsOfType('player', 'GHOST_MODE');
            expect(ghostEffects).toHaveLength(1);

            // Apply second ghost mode - should replace
            powerUpManager.applyEffect('player', 'GHOST_MODE');
            ghostEffects = powerUpManager.getActiveEffectsOfType('player', 'GHOST_MODE');
            expect(ghostEffects).toHaveLength(1);
        });

        it('should handle mixed effect types correctly', () => {
            // Apply all effect types
            powerUpManager.applyEffect('player', 'SPEED_BOOST');
            powerUpManager.applyEffect('player', 'SHIELD');
            powerUpManager.applyEffect('player', 'GHOST_MODE');

            expect(powerUpManager.hasActiveEffect('player', 'SPEED_BOOST')).toBe(true);
            expect(powerUpManager.hasActiveEffect('player', 'SHIELD')).toBe(true);
            expect(powerUpManager.hasActiveEffect('player', 'GHOST_MODE')).toBe(true);

            expect(powerUpManager.getSpeedMultiplier('player')).toBe(2.0);
            expect(powerUpManager.isInGhostMode('player')).toBe(true);
            expect(powerUpManager.hasShieldProtection('player')).toBe(true);
        });
    });

    describe('Trail Eraser Edge Cases', () => {
        it('should handle trail eraser with empty trail', () => {
            // Mock game with empty trail
            const emptyTrailGame = {
                getGameState: () => ({
                    ...mockGameWithComplexState.getGameState(),
                    playerTrail: [],
                }),
            };

            const trailManager = new PowerUpManager(
                emptyTrailGame,
                mockRenderer,
                mockCollisionDetector
            );
            const success = trailManager.applyEffect('player', 'TRAIL_ERASER');

            expect(success).toBe(true); // Should succeed even with empty trail
        });

        it('should handle trail eraser with short trail', () => {
            // Mock game with short trail (less than 10 segments)
            const shortTrail = [
                { x: 1, z: 1 },
                { x: 2, z: 2 },
                { x: 3, z: 3 },
            ];
            const shortTrailGame = {
                getGameState: () => ({
                    ...mockGameWithComplexState.getGameState(),
                    playerTrail: shortTrail,
                }),
            };

            const trailManager = new PowerUpManager(
                shortTrailGame,
                mockRenderer,
                mockCollisionDetector
            );
            const success = trailManager.applyEffect('player', 'TRAIL_ERASER');

            expect(success).toBe(true);
            expect(shortTrail).toHaveLength(0); // All segments should be removed
        });

        it('should handle trail eraser with invalid player ID', () => {
            const success = powerUpManager.applyEffect('invalid_player', 'TRAIL_ERASER');
            expect(success).toBe(false);
        });
    });

    describe('Memory Management and Performance', () => {
        it('should handle rapid power-up spawning and cleanup', () => {
            jest.spyOn(powerUpManager, 'isValidSpawnPosition').mockReturnValue(true);

            // Rapidly spawn and remove power-ups
            for (let i = 0; i < 100; i++) {
                const powerUp = powerUpManager.spawnPowerUp('SPEED_BOOST', { x: i, y: 0, z: i });
                powerUpManager.removePowerUp(powerUp.id);
            }

            expect(powerUpManager.activePowerUps.size).toBe(0);
        });

        it('should handle rapid effect application and removal', () => {
            // Rapidly apply and remove effects
            for (let i = 0; i < 100; i++) {
                powerUpManager.applyEffect('player', 'SPEED_BOOST');
                powerUpManager.applyEffect('player', 'SHIELD');
                powerUpManager.consumeShield('player');
            }

            // Should not cause memory leaks or errors
            expect(powerUpManager.getActiveEffects('player').length).toBeGreaterThan(0);
        });

        it('should handle collection detection performance with many power-ups', () => {
            jest.spyOn(powerUpManager, 'isValidSpawnPosition').mockReturnValue(true);

            // Spawn maximum number of power-ups
            for (let i = 0; i < SPAWN_CONFIG.maxActivePowerUps; i++) {
                powerUpManager.spawnPowerUp('SPEED_BOOST', { x: i * 10, y: 0, z: i * 10 });
            }

            const gameState = mockGameWithComplexState.getGameState();

            // Performance test - should complete quickly
            const startTime = Date.now();
            powerUpManager.checkCollections(gameState);
            const endTime = Date.now();

            expect(endTime - startTime).toBeLessThan(10); // Should be very fast
        });

        it('should properly clean up on reset', () => {
            // Create complex state
            jest.spyOn(powerUpManager, 'isValidSpawnPosition').mockReturnValue(true);

            for (let i = 0; i < SPAWN_CONFIG.maxActivePowerUps; i++) {
                powerUpManager.spawnPowerUp('SPEED_BOOST', { x: i, y: 0, z: i });
            }

            powerUpManager.applyEffect('player', 'SPEED_BOOST');
            powerUpManager.applyEffect('player', 'SHIELD');
            powerUpManager.applyEffect('ai', 'GHOST_MODE');

            // Verify state before reset
            expect(powerUpManager.activePowerUps.size).toBe(SPAWN_CONFIG.maxActivePowerUps);
            expect(powerUpManager.getActiveEffects('player').length).toBeGreaterThan(0);
            expect(powerUpManager.getActiveEffects('ai').length).toBeGreaterThan(0);

            // Reset and verify cleanup
            powerUpManager.reset();

            expect(powerUpManager.activePowerUps.size).toBe(0);
            expect(powerUpManager.getActiveEffects('player')).toHaveLength(0);
            expect(powerUpManager.getActiveEffects('ai')).toHaveLength(0);
            expect(powerUpManager.lastSpawnTime).toBe(0);
            expect(powerUpManager.nextPowerUpId).toBe(1);
            expect(powerUpManager.lastSpawnedTypes).toHaveLength(0);
        });
    });

    describe('Integration with Game Systems', () => {
        it('should handle update cycle correctly', () => {
            jest.spyOn(powerUpManager, 'updateSpawning');
            jest.spyOn(powerUpManager, 'removeExpiredPowerUps');
            jest.spyOn(powerUpManager, 'removeExpiredEffects');
            jest.spyOn(powerUpManager, 'updateRenderer');

            powerUpManager.update(16); // Simulate 16ms frame

            expect(powerUpManager.updateSpawning).toHaveBeenCalled();
            expect(powerUpManager.removeExpiredPowerUps).toHaveBeenCalled();
            expect(powerUpManager.removeExpiredEffects).toHaveBeenCalled();
            expect(powerUpManager.updateRenderer).toHaveBeenCalled();
        });

        it('should handle pause and resume correctly', () => {
            // These methods should exist and not throw errors
            expect(() => powerUpManager.handlePause()).not.toThrow();
            expect(() => powerUpManager.handleResume()).not.toThrow();
        });

        it('should provide debug information', () => {
            powerUpManager.spawnPowerUp('SPEED_BOOST', { x: 0, y: 0, z: 0 });
            powerUpManager.applyEffect('player', 'SHIELD');

            const debugInfo = powerUpManager.getDebugInfo();

            expect(debugInfo).toHaveProperty('activePowerUps');
            expect(debugInfo).toHaveProperty('maxPowerUps');
            expect(debugInfo).toHaveProperty('nextSpawnIn');
            expect(debugInfo).toHaveProperty('activeEffects');

            expect(debugInfo.activePowerUps).toBe(1);
            expect(debugInfo.maxPowerUps).toBe(SPAWN_CONFIG.maxActivePowerUps);
            expect(debugInfo.activeEffects.player).toHaveLength(1);
        });

        it('should handle failed effect application gracefully', () => {
            // Mock failed effect application
            const originalApplyEffect = powerUpManager.applyEffect;
            powerUpManager.applyEffect = jest.fn().mockReturnValue(false);

            const powerUp = powerUpManager.spawnPowerUp('SPEED_BOOST', { x: 0, y: 0, z: 0 });
            const collection = {
                playerId: 'player',
                powerUpId: powerUp.id,
                powerUpType: 'SPEED_BOOST',
                position: { x: 0, y: 0, z: 0 },
            };

            powerUpManager.processCollection(collection);

            // Power-up should not be removed if effect application failed
            expect(powerUpManager.activePowerUps.has(powerUp.id)).toBe(true);
            expect(powerUp.collected).toBe(false); // Should be unmarked

            // Restore original method
            powerUpManager.applyEffect = originalApplyEffect;
        });
    });

    describe('Static Methods and Utilities', () => {
        it('should provide access to power-up type configurations', () => {
            const types = PowerUpManager.getPowerUpTypes();
            expect(types).toBe(POWER_UP_TYPES);
            expect(Object.keys(types)).toContain('SPEED_BOOST');
            expect(Object.keys(types)).toContain('SHIELD');
            expect(Object.keys(types)).toContain('TRAIL_ERASER');
            expect(Object.keys(types)).toContain('GHOST_MODE');
        });

        it('should provide access to spawn configuration', () => {
            const config = PowerUpManager.getSpawnConfig();
            expect(config).toBe(SPAWN_CONFIG);
            expect(config.maxActivePowerUps).toBeDefined();
            expect(config.spawnInterval).toBeDefined();
        });

        it('should provide power-ups for rendering', () => {
            powerUpManager.spawnPowerUp('SPEED_BOOST', { x: 0, y: 0, z: 0 });
            powerUpManager.spawnPowerUp('SHIELD', { x: 10, y: 0, z: 10 });

            const renderingData = powerUpManager.getPowerUpsForRendering();

            expect(renderingData).toHaveLength(2);
            expect(renderingData[0]).toHaveProperty('id');
            expect(renderingData[0]).toHaveProperty('type');
            expect(renderingData[0]).toHaveProperty('position');
            expect(renderingData[0]).toHaveProperty('appearance');
        });

        it('should filter out collected power-ups from rendering', () => {
            const powerUp1 = powerUpManager.spawnPowerUp('SPEED_BOOST', { x: 0, y: 0, z: 0 });
            const powerUp2 = powerUpManager.spawnPowerUp('SHIELD', { x: 10, y: 0, z: 10 });

            // Mark one as collected
            powerUp1.collected = true;

            const renderingData = powerUpManager.getPowerUpsForRendering();

            expect(renderingData).toHaveLength(1);
            expect(renderingData[0].type).toBe('SHIELD');
        });

        it('should get all active effects for all players', () => {
            powerUpManager.applyEffect('player', 'SPEED_BOOST');
            powerUpManager.applyEffect('ai', 'SHIELD');

            const allEffects = powerUpManager.getAllActiveEffects();

            expect(allEffects).toHaveProperty('player');
            expect(allEffects).toHaveProperty('ai');
            expect(allEffects.player).toHaveLength(1);
            expect(allEffects.ai).toHaveLength(1);
            expect(allEffects.player[0].type).toBe('SPEED_BOOST');
            expect(allEffects.ai[0].type).toBe('SHIELD');
        });
    });
});
