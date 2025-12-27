/**
 * SpeedTracker Tests
 *
 * Comprehensive test suite for the SpeedTracker class,
 * covering entity tracking, velocity monitoring, speed threshold detection,
 * and integration with game state and power-up systems.
 */

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

const { SpeedTracker } = require('@/effects/SpeedTracker.js');

describe('SpeedTracker', () => {
    let speedTracker;
    let mockEntity;
    let mockGameState;

    beforeEach(() => {
        speedTracker = new SpeedTracker();

        mockEntity = {
            x: 0,
            z: 0,
            id: 'player',
        };

        mockGameState = {
            player: mockEntity,
            aiOpponents: [
                { id: 'ai1', x: 10, z: 10, alive: true },
                { id: 'ai2', x: 15, z: 15, alive: true },
            ],
            powerUpManager: {
                getSpeedMultiplier: jest.fn(() => 1.0),
            },
        };

        // Mock Date.now for consistent timing
        jest.spyOn(Date, 'now').mockReturnValue(1000);
    });

    afterEach(() => {
        Date.now.mockRestore();
    });

    describe('Constructor', () => {
        it('should initialize with default configuration', () => {
            expect(speedTracker.trackedEntities.size).toBe(0);
            expect(speedTracker.config.smoothingFactor).toBe(0.15);
            expect(speedTracker.config.speedThreshold).toBe(1.5);
            expect(speedTracker.config.maxTrackingHistory).toBe(10);
            expect(speedTracker.config.velocityScale).toBe(1.0);
        });

        it('should initialize global stats', () => {
            const stats = speedTracker.getGlobalStats();
            expect(stats.maxSpeed).toBe(0);
            expect(stats.averageSpeed).toBe(0);
            expect(stats.activeEntities).toBe(0);
        });
    });

    describe('Entity Tracking', () => {
        it('should track an entity successfully', () => {
            speedTracker.trackEntity('player', mockEntity);

            expect(speedTracker.trackedEntities.has('player')).toBe(true);

            const trackingData = speedTracker.trackedEntities.get('player');
            expect(trackingData.entity).toBe(mockEntity);
            expect(trackingData.isActive).toBe(true);
            expect(trackingData.instantaneousSpeed).toBe(0);
            expect(trackingData.smoothedSpeed).toBe(0);
        });

        it('should handle invalid entity tracking', () => {
            speedTracker.trackEntity(null, mockEntity);
            expect(speedTracker.trackedEntities.size).toBe(0);

            speedTracker.trackEntity('player', null);
            expect(speedTracker.trackedEntities.size).toBe(0);
        });

        it('should untrack an entity', () => {
            speedTracker.trackEntity('player', mockEntity);
            expect(speedTracker.trackedEntities.has('player')).toBe(true);

            speedTracker.untrackEntity('player');
            expect(speedTracker.trackedEntities.has('player')).toBe(false);
        });

        it('should handle untracking non-existent entity', () => {
            expect(() => {
                speedTracker.untrackEntity('non-existent');
            }).not.toThrow();
        });
    });

    describe('Speed Calculation', () => {
        beforeEach(() => {
            speedTracker.trackEntity('player', mockEntity);
        });

        it('should calculate speed based on position changes', () => {
            // Initial position
            mockEntity.x = 0;
            mockEntity.z = 0;
            speedTracker.update(mockGameState, 0.016); // 60fps

            // Move entity
            mockEntity.x = 1.6; // 1.6 units in 0.016 seconds = 100 units/second
            mockEntity.z = 0;
            Date.now.mockReturnValue(1016);
            speedTracker.update(mockGameState, 0.016);

            const speed = speedTracker.getEntitySpeed('player', false); // Get instantaneous speed
            expect(speed).toBeCloseTo(100, 1);
        });

        it('should apply smoothing to speed calculations', () => {
            // Set up initial state
            mockEntity.x = 0;
            mockEntity.z = 0;
            speedTracker.update(mockGameState, 0.016);

            // Make a sudden speed change
            mockEntity.x = 3.2; // High speed
            mockEntity.z = 0;
            Date.now.mockReturnValue(1016);
            speedTracker.update(mockGameState, 0.016);

            const instantaneousSpeed = speedTracker.getEntitySpeed('player', false);
            const smoothedSpeed = speedTracker.getEntitySpeed('player', true);

            // Smoothed speed should be less than instantaneous due to smoothing
            expect(smoothedSpeed).toBeLessThan(instantaneousSpeed);
        });

        it('should handle zero delta time gracefully', () => {
            mockEntity.x = 1;
            mockEntity.z = 1;

            speedTracker.update(mockGameState, 0); // Zero delta time

            const speed = speedTracker.getEntitySpeed('player');
            expect(speed).toBe(0);
        });

        it('should apply speed multipliers from power-up system', () => {
            mockGameState.powerUpManager.getSpeedMultiplier.mockReturnValue(2.0);

            mockEntity.x = 0;
            mockEntity.z = 0;
            speedTracker.update(mockGameState, 0.016);

            mockEntity.x = 1.6;
            mockEntity.z = 0;
            Date.now.mockReturnValue(1016);
            speedTracker.update(mockGameState, 0.016);

            const speed = speedTracker.getEntitySpeed('player', false);
            expect(speed).toBeCloseTo(200, 1); // 100 * 2.0 multiplier
        });

        it('should handle missing power-up manager gracefully', () => {
            delete mockGameState.powerUpManager;

            mockEntity.x = 0;
            mockEntity.z = 0;
            speedTracker.update(mockGameState, 0.016);

            mockEntity.x = 1.6;
            mockEntity.z = 0;
            Date.now.mockReturnValue(1016);
            speedTracker.update(mockGameState, 0.016);

            const speed = speedTracker.getEntitySpeed('player', false);
            expect(speed).toBeCloseTo(100, 1); // No multiplier applied
        });
    });

    describe('Multiple Entity Tracking', () => {
        beforeEach(() => {
            speedTracker.trackEntity('player', mockGameState.player);
            speedTracker.trackEntity('ai1', mockGameState.aiOpponents[0]);
            speedTracker.trackEntity('ai2', mockGameState.aiOpponents[1]);
        });

        it('should update all tracked entities', () => {
            // Move all entities
            mockGameState.player.x = 6;
            mockGameState.aiOpponents[0].x = 11;
            mockGameState.aiOpponents[1].x = 16;

            Date.now.mockReturnValue(1016);
            speedTracker.update(mockGameState, 0.016);

            expect(speedTracker.getEntitySpeed('player')).toBeGreaterThan(0);
            expect(speedTracker.getEntitySpeed('ai1')).toBeGreaterThan(0);
            expect(speedTracker.getEntitySpeed('ai2')).toBeGreaterThan(0);
        });

        it('should calculate maximum speed correctly', () => {
            // Initial update to set positions
            speedTracker.update(mockGameState, 0.016);

            // Move all entities
            mockGameState.player.x += 1.0; // Speed 62.5
            mockGameState.aiOpponents[0].x += 3.0; // Speed 187.5
            mockGameState.aiOpponents[1].x += 0.5; // Speed 31.25

            Date.now.mockReturnValue(1016);
            speedTracker.update(mockGameState, 0.016);

            const maxSpeed = speedTracker.getMaxSpeed(false);
            expect(maxSpeed).toBeCloseTo(187.5, 1);
        });

        it('should calculate average speed correctly', () => {
            // Initial update to set positions
            speedTracker.update(mockGameState, 0.016);

            // Set known speeds
            mockGameState.player.x += 1.0; // Speed 62.5
            mockGameState.aiOpponents[0].x += 2.0; // Speed 125
            mockGameState.aiOpponents[1].x += 0.5; // Speed 31.25

            Date.now.mockReturnValue(1032);
            speedTracker.update(mockGameState, 0.016);

            const avgSpeed = speedTracker.getAverageSpeed(false);
            const expectedAvg = (62.5 + 125 + 31.25) / 3;
            expect(avgSpeed).toBeCloseTo(expectedAvg, 1);
        });
    });

    describe('Speed Threshold Detection', () => {
        beforeEach(() => {
            speedTracker.trackEntity('player', mockEntity);
            speedTracker.setSpeedThreshold(50); // Set threshold to 50 units/second
        });

        it('should detect entities above threshold', () => {
            // Initial update
            speedTracker.update(mockGameState, 0.016);

            // Move entity at high speed repeatedly to overcome smoothing
            for (let i = 0; i < 20; i++) {
                mockEntity.x += 1.6; // 100 units/second
                Date.now.mockReturnValue(1016 + i * 16);
                speedTracker.update(mockGameState, 0.016);
            }

            expect(speedTracker.isAnyEntityAboveThreshold()).toBe(true);

            const entitiesAbove = speedTracker.getEntitiesAboveThreshold();
            expect(entitiesAbove.length).toBe(1);
            expect(entitiesAbove[0].entityId).toBe('player');
        });

        it('should not detect entities below threshold', () => {
            // Move entity at low speed
            mockEntity.x = 0;
            mockEntity.z = 0;
            speedTracker.update(mockGameState, 0.016);

            mockEntity.x = 0.32; // 20 units/second (below threshold of 50)
            mockEntity.z = 0;
            Date.now.mockReturnValue(1016);
            speedTracker.update(mockGameState, 0.016);

            expect(speedTracker.isAnyEntityAboveThreshold()).toBe(false);
            expect(speedTracker.getEntitiesAboveThreshold().length).toBe(0);
        });
    });

    describe('Speed History', () => {
        beforeEach(() => {
            speedTracker.trackEntity('player', mockEntity);
        });

        it('should maintain speed history', () => {
            // Generate multiple speed updates
            for (let i = 0; i < 5; i++) {
                mockEntity.x = i * 0.8;
                Date.now.mockReturnValue(1000 + i * 16);
                speedTracker.update(mockGameState, 0.016);
            }

            const history = speedTracker.getEntitySpeedHistory('player');
            expect(history.length).toBeGreaterThan(0);
            expect(history.length).toBeLessThanOrEqual(speedTracker.config.maxTrackingHistory);
        });

        it('should limit history size', () => {
            const maxHistory = speedTracker.config.maxTrackingHistory;

            // Generate more updates than max history
            for (let i = 0; i < maxHistory + 5; i++) {
                mockEntity.x = i * 0.1;
                Date.now.mockReturnValue(1000 + i * 16);
                speedTracker.update(mockGameState, 0.016);
            }

            const history = speedTracker.getEntitySpeedHistory('player');
            expect(history.length).toBeLessThanOrEqual(maxHistory);
        });

        it('should return empty history for non-existent entity', () => {
            const history = speedTracker.getEntitySpeedHistory('non-existent');
            expect(history).toEqual([]);
        });
    });

    describe('Configuration', () => {
        it('should set speed threshold', () => {
            speedTracker.setSpeedThreshold(100);
            expect(speedTracker.config.speedThreshold).toBe(100);
        });

        it('should reject invalid speed threshold', () => {
            const originalThreshold = speedTracker.config.speedThreshold;

            speedTracker.setSpeedThreshold(-10);
            expect(speedTracker.config.speedThreshold).toBe(originalThreshold);

            speedTracker.setSpeedThreshold('invalid');
            expect(speedTracker.config.speedThreshold).toBe(originalThreshold);
        });

        it('should set smoothing factor', () => {
            speedTracker.setSmoothingFactor(0.5);
            expect(speedTracker.config.smoothingFactor).toBe(0.5);
        });

        it('should reject invalid smoothing factor', () => {
            const originalFactor = speedTracker.config.smoothingFactor;

            speedTracker.setSmoothingFactor(-0.1);
            expect(speedTracker.config.smoothingFactor).toBe(originalFactor);

            speedTracker.setSmoothingFactor(1.5);
            expect(speedTracker.config.smoothingFactor).toBe(originalFactor);
        });

        it('should set velocity scale', () => {
            speedTracker.setVelocityScale(2.0);
            expect(speedTracker.config.velocityScale).toBe(2.0);
        });

        it('should reject invalid velocity scale', () => {
            const originalScale = speedTracker.config.velocityScale;

            speedTracker.setVelocityScale(0);
            expect(speedTracker.config.velocityScale).toBe(originalScale);

            speedTracker.setVelocityScale(-1);
            expect(speedTracker.config.velocityScale).toBe(originalScale);
        });
    });

    describe('Game State Integration', () => {
        it('should handle backward compatibility with single AI', () => {
            const singleAIGameState = {
                player: { x: 5, z: 5 },
                ai: { x: 10, z: 10 },
            };

            speedTracker.trackEntity('player', singleAIGameState.player);
            speedTracker.trackEntity('ai', singleAIGameState.ai);

            // Move entities
            singleAIGameState.player.x = 6;
            singleAIGameState.ai.x = 11;

            Date.now.mockReturnValue(1016);
            speedTracker.update(singleAIGameState, 0.016);

            expect(speedTracker.getEntitySpeed('player')).toBeGreaterThan(0);
            expect(speedTracker.getEntitySpeed('ai')).toBeGreaterThan(0);
        });

        it('should handle missing AI opponents gracefully', () => {
            const gameStateWithoutAI = {
                player: { x: 5, z: 5 },
            };

            speedTracker.trackEntity('player', gameStateWithoutAI.player);

            expect(() => {
                speedTracker.update(gameStateWithoutAI, 0.016);
            }).not.toThrow();
        });

        it('should skip dead AI entities', () => {
            mockGameState.aiOpponents[0].alive = false;

            speedTracker.trackEntity('ai1', mockGameState.aiOpponents[0]);

            // Move dead AI (should not be processed)
            mockGameState.aiOpponents[0].x = 20;

            Date.now.mockReturnValue(1016);
            speedTracker.update(mockGameState, 0.016);

            expect(speedTracker.getEntitySpeed('ai1')).toBe(0);
        });
    });

    describe('Update Throttling', () => {
        beforeEach(() => {
            speedTracker.trackEntity('player', mockEntity);
        });

        it('should throttle updates based on update interval', () => {
            const initialUpdateCount = speedTracker.updateCount;

            // Try to update multiple times within throttle interval
            speedTracker.update(mockGameState, 0.016);
            Date.now.mockReturnValue(1005); // Only 5ms later
            speedTracker.update(mockGameState, 0.016);
            Date.now.mockReturnValue(1010); // Only 10ms later
            speedTracker.update(mockGameState, 0.016);

            // Should only have processed first update due to throttling
            expect(speedTracker.updateCount).toBe(initialUpdateCount + 1);
        });

        it('should allow updates after throttle interval', () => {
            const initialUpdateCount = speedTracker.updateCount;

            speedTracker.update(mockGameState, 0.016);
            Date.now.mockReturnValue(1020); // 20ms later (exceeds 16ms interval)
            speedTracker.update(mockGameState, 0.016);

            expect(speedTracker.updateCount).toBe(initialUpdateCount + 2);
        });
    });

    describe('Status and Statistics', () => {
        beforeEach(() => {
            speedTracker.trackEntity('player', mockEntity);
            speedTracker.trackEntity('ai1', mockGameState.aiOpponents[0]);
        });

        it('should provide tracking status', () => {
            const status = speedTracker.getTrackingStatus();

            expect(status.trackedEntityCount).toBe(2);
            expect(status.entities).toHaveProperty('player');
            expect(status.entities).toHaveProperty('ai1');
            expect(status.entities.player.isActive).toBe(true);
        });

        it('should update global statistics', () => {
            // Move entities to generate speeds
            mockEntity.x = 1.6;
            mockGameState.aiOpponents[0].x = 11.6;

            Date.now.mockReturnValue(1016);
            speedTracker.update(mockGameState, 0.016);

            const stats = speedTracker.getGlobalStats();
            expect(stats.activeEntities).toBe(2);
            expect(stats.maxSpeed).toBeGreaterThan(0);
            expect(stats.averageSpeed).toBeGreaterThan(0);
        });

        it('should provide configuration', () => {
            const config = speedTracker.getConfig();

            expect(config).toHaveProperty('smoothingFactor');
            expect(config).toHaveProperty('speedThreshold');
            expect(config).toHaveProperty('maxTrackingHistory');
            expect(config).toHaveProperty('velocityScale');
        });
    });

    describe('Pause/Resume/Reset', () => {
        beforeEach(() => {
            speedTracker.trackEntity('player', mockEntity);
            speedTracker.trackEntity('ai1', mockGameState.aiOpponents[0]);
        });

        it('should pause tracking', () => {
            speedTracker.pause();

            const status = speedTracker.getTrackingStatus();
            expect(status.entities.player.isActive).toBe(false);
            expect(status.entities.ai1.isActive).toBe(false);
        });

        it('should resume tracking', () => {
            speedTracker.pause();

            Date.now.mockReturnValue(2000);
            speedTracker.resume();

            const status = speedTracker.getTrackingStatus();
            expect(status.entities.player.isActive).toBe(true);
            expect(status.entities.ai1.isActive).toBe(true);
            expect(speedTracker.lastUpdateTime).toBe(2000);
        });

        it('should reset all tracking data', () => {
            speedTracker.reset();

            expect(speedTracker.trackedEntities.size).toBe(0);
            expect(speedTracker.updateCount).toBe(0);
            expect(speedTracker.lastUpdateTime).toBe(0);

            const stats = speedTracker.getGlobalStats();
            expect(stats.maxSpeed).toBe(0);
            expect(stats.averageSpeed).toBe(0);
            expect(stats.activeEntities).toBe(0);
        });

        it('should destroy and clean up resources', () => {
            speedTracker.destroy();

            expect(speedTracker.trackedEntities.size).toBe(0);
        });
    });

    describe('Error Handling', () => {
        it('should handle entity update errors gracefully', () => {
            let shouldThrow = false;
            const faultyEntity = {
                id: 'faulty',
                get x() {
                    if (shouldThrow) throw new Error('Property access error');
                    return 0;
                },
                z: 0,
                alive: true,
            };

            speedTracker.trackEntity('faulty', faultyEntity);
            mockGameState.aiOpponents.push(faultyEntity);

            shouldThrow = true;
            expect(() => {
                speedTracker.update(mockGameState, 0.016);
            }).not.toThrow();

            const trackingData = speedTracker.trackedEntities.get('faulty');
            expect(trackingData.isActive).toBe(false);
        });

        it('should handle power-up manager errors gracefully', () => {
            mockGameState.powerUpManager.getSpeedMultiplier.mockImplementation(() => {
                throw new Error('Power-up manager error');
            });

            speedTracker.trackEntity('player', mockEntity);

            expect(() => {
                speedTracker.update(mockGameState, 0.016);
            }).not.toThrow();
        });

        it('should return zero speed for non-existent entities', () => {
            const speed = speedTracker.getEntitySpeed('non-existent');
            expect(speed).toBe(0);
        });

        it('should return zero speed for inactive entities', () => {
            speedTracker.trackEntity('player', mockEntity);
            const trackingData = speedTracker.trackedEntities.get('player');
            trackingData.isActive = false;

            const speed = speedTracker.getEntitySpeed('player');
            expect(speed).toBe(0);
        });
    });
});
