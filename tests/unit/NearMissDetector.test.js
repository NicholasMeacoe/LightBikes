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

const { NearMissDetector } = require('@/effects/NearMissDetector.js');

describe('NearMissDetector', () => {
    let detector;
    let mockEntity;
    let mockObstacles;

    beforeEach(() => {
        detector = new NearMissDetector(1.0, 100);

        mockEntity = {
            id: 'player1',
            position: { x: 0, y: 0, z: 0 },
        };

        mockObstacles = [
            { id: 'obstacle1', position: { x: 0.5, y: 0, z: 0 } }, // Close
            { id: 'obstacle2', position: { x: 2.0, y: 0, z: 0 } }, // Far
            { id: 'obstacle3', position: { x: 0, y: 0, z: 0.8 } }, // Close
        ];
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            const defaultDetector = new NearMissDetector();

            expect(defaultDetector.getDetectionRadius()).toBe(1.0);
            expect(defaultDetector.getCooldownPeriod()).toBe(100);
            expect(defaultDetector.isEnabled()).toBe(true);
        });

        it('should initialize with custom values', () => {
            const customDetector = new NearMissDetector(2.0, 200);

            expect(customDetector.getDetectionRadius()).toBe(2.0);
            expect(customDetector.getCooldownPeriod()).toBe(200);
        });

        it('should clamp detection radius to minimum', () => {
            const detector = new NearMissDetector(0.05);
            expect(detector.getDetectionRadius()).toBe(0.1);
        });

        it('should handle negative cooldown period', () => {
            const detector = new NearMissDetector(1.0, -50);
            expect(detector.getCooldownPeriod()).toBe(0);
        });
    });

    describe('distance calculation', () => {
        it('should calculate 3D distance correctly', () => {
            const point1 = { x: 0, y: 0, z: 0 };
            const point2 = { x: 3, y: 4, z: 0 };

            const distance = detector.calculateDistance(point1, point2);
            expect(distance).toBe(5); // 3-4-5 triangle
        });

        it('should calculate 2D distance correctly', () => {
            const point1 = { x: 0, y: 10, z: 0 };
            const point2 = { x: 3, y: 20, z: 4 };

            const distance = detector.calculateDistance2D(point1, point2);
            expect(distance).toBe(5); // Ignores Y difference
        });

        it('should handle identical points', () => {
            const point = { x: 1, y: 2, z: 3 };

            const distance = detector.calculateDistance(point, point);
            expect(distance).toBe(0);
        });
    });

    describe('near miss detection', () => {
        it('should detect near miss within radius', () => {
            const currentTime = Date.now();
            const result = detector.checkNearMiss(mockEntity, mockObstacles, currentTime);

            expect(result).not.toBeNull();
            expect(result.entity).toBe(mockEntity);
            expect(result.distance).toBeLessThanOrEqual(1.0);
            expect(result.timestamp).toBe(currentTime);
        });

        it('should return null when no obstacles within radius', () => {
            const farObstacles = [
                { id: 'far1', position: { x: 5, y: 0, z: 0 } },
                { id: 'far2', position: { x: 0, y: 0, z: 5 } },
            ];

            const result = detector.checkNearMiss(mockEntity, farObstacles);
            expect(result).toBeNull();
        });

        it('should return closest obstacle when multiple are within radius', () => {
            const result = detector.checkNearMiss(mockEntity, mockObstacles);

            expect(result).not.toBeNull();
            expect(result.obstacle.id).toBe('obstacle1'); // Closest at 0.5 units
        });

        it('should respect cooldown period', () => {
            const currentTime = Date.now();

            // First detection should work
            const result1 = detector.checkNearMiss(mockEntity, mockObstacles, currentTime);
            expect(result1).not.toBeNull();

            // Second detection within cooldown should fail
            const result2 = detector.checkNearMiss(mockEntity, mockObstacles, currentTime + 50);
            expect(result2).toBeNull();

            // Third detection after cooldown should work
            const result3 = detector.checkNearMiss(mockEntity, mockObstacles, currentTime + 150);
            expect(result3).not.toBeNull();
        });

        it('should handle entity-specific cooldowns', () => {
            const entity2 = { id: 'player2', position: { x: 0, y: 0, z: 0 } };
            const currentTime = Date.now();

            // First entity triggers near miss
            const result1 = detector.checkNearMiss(mockEntity, mockObstacles, currentTime);
            expect(result1).not.toBeNull();

            // Second entity should still be able to trigger (different entity)
            const result2 = detector.checkNearMiss(entity2, mockObstacles, currentTime + 50);
            expect(result2).not.toBeNull();
        });

        it('should return null when disabled', () => {
            detector.setEnabled(false);
            const result = detector.checkNearMiss(mockEntity, mockObstacles);
            expect(result).toBeNull();
        });

        it('should handle invalid inputs gracefully', () => {
            expect(detector.checkNearMiss(null, mockObstacles)).toBeNull();
            expect(detector.checkNearMiss(mockEntity, null)).toBeNull();
            expect(detector.checkNearMiss({ position: null }, mockObstacles)).toBeNull();
        });
    });

    describe('trail near miss detection', () => {
        it('should detect near miss with trail segments', () => {
            const trailSegments = [
                { x: 0.5, y: 0, z: 0 },
                { x: 2.0, y: 0, z: 0 },
            ];

            const result = detector.checkTrailNearMiss(mockEntity, trailSegments);

            expect(result).not.toBeNull();
            expect(result.obstacle.type).toBe('trail');
            expect(result.distance).toBe(0.5);
        });

        it('should return null for empty trail segments', () => {
            const result = detector.checkTrailNearMiss(mockEntity, []);
            expect(result).toBeNull();
        });
    });

    describe('boundary near miss detection', () => {
        it('should detect near miss with arena boundaries', () => {
            const arenaBounds = {
                minX: -10,
                maxX: 10,
                minZ: -10,
                maxZ: 10,
            };

            // Position entity close to left boundary
            mockEntity.position = { x: -9.5, y: 0, z: 0 };

            const result = detector.checkBoundaryNearMiss(mockEntity, arenaBounds);

            expect(result).not.toBeNull();
            expect(result.type).toBe('boundary');
            expect(result.obstacle.type).toBe('left');
            expect(result.distance).toBe(0.5);
        });

        it('should detect closest boundary', () => {
            const arenaBounds = {
                minX: -10,
                maxX: 10,
                minZ: -10,
                maxZ: 10,
            };

            // Position entity close to corner (should detect closest boundary)
            mockEntity.position = { x: -9.7, y: 0, z: -9.9 };

            const result = detector.checkBoundaryNearMiss(mockEntity, arenaBounds);

            expect(result).not.toBeNull();
            expect(result.obstacle.type).toBe('front'); // Closer to front boundary
        });

        it('should return null when far from boundaries', () => {
            const arenaBounds = {
                minX: -10,
                maxX: 10,
                minZ: -10,
                maxZ: 10,
            };

            // Position entity in center
            mockEntity.position = { x: 0, y: 0, z: 0 };

            const result = detector.checkBoundaryNearMiss(mockEntity, arenaBounds);
            expect(result).toBeNull();
        });
    });

    describe('configuration', () => {
        it('should update detection radius', () => {
            detector.setDetectionRadius(2.0);
            expect(detector.getDetectionRadius()).toBe(2.0);

            // Should now detect previously far obstacles
            const result = detector.checkNearMiss(mockEntity, mockObstacles);
            expect(result).not.toBeNull();
            // Still returns closest obstacle (obstacle1 at 0.5 units is still closest)
            expect(result.obstacle.id).toBe('obstacle1');
            expect(result.distance).toBe(0.5);
        });

        it('should clamp detection radius to minimum', () => {
            detector.setDetectionRadius(0.05);
            expect(detector.getDetectionRadius()).toBe(0.1);
        });

        it('should update cooldown period', () => {
            detector.setCooldownPeriod(200);
            expect(detector.getCooldownPeriod()).toBe(200);
        });

        it('should handle negative cooldown period', () => {
            detector.setCooldownPeriod(-100);
            expect(detector.getCooldownPeriod()).toBe(0);
        });
    });

    describe('cooldown management', () => {
        it('should check if in cooldown', () => {
            const currentTime = Date.now();

            expect(detector.isInCooldown(currentTime)).toBe(false);

            detector.checkNearMiss(mockEntity, mockObstacles, currentTime);
            expect(detector.isInCooldown(currentTime + 50)).toBe(true);
            expect(detector.isInCooldown(currentTime + 150)).toBe(false);
        });

        it('should get remaining cooldown time', () => {
            const currentTime = Date.now();

            detector.checkNearMiss(mockEntity, mockObstacles, currentTime);

            const remaining = detector.getRemainingCooldown(currentTime + 30);
            expect(remaining).toBe(70); // 100ms cooldown - 30ms elapsed
        });

        it('should clear cooldowns', () => {
            detector.checkNearMiss(mockEntity, mockObstacles);
            expect(detector.isInCooldown()).toBe(true);

            detector.clearCooldowns();
            expect(detector.isInCooldown()).toBe(false);
        });

        it('should clear cooldowns when disabled', () => {
            detector.checkNearMiss(mockEntity, mockObstacles);
            expect(detector.isInCooldown()).toBe(true);

            detector.setEnabled(false);
            expect(detector.isInCooldown()).toBe(false);
        });
    });

    describe('statistics', () => {
        it('should provide statistics', () => {
            const stats = detector.getStatistics();

            expect(stats.detectionRadius).toBe(1.0);
            expect(stats.cooldownPeriod).toBe(100);
            expect(stats.enabled).toBe(true);
            expect(stats.recentNearMissCount).toBe(0);
            expect(stats.isInCooldown).toBe(false);
        });

        it('should update statistics after near miss', () => {
            detector.checkNearMiss(mockEntity, mockObstacles);

            const stats = detector.getStatistics();
            expect(stats.recentNearMissCount).toBe(1);
            expect(stats.isInCooldown).toBe(true);
            expect(stats.lastNearMissTime).toBeGreaterThan(0);
        });
    });

    describe('cleanup', () => {
        it('should clean up old entries', () => {
            const oldTime = Date.now() - 1000;

            // Trigger near miss with old timestamp
            detector.checkNearMiss(mockEntity, mockObstacles, oldTime);
            expect(detector.getStatistics().recentNearMissCount).toBe(1);

            // Trigger cleanup with current time
            detector.checkNearMiss(mockEntity, mockObstacles, Date.now());

            // Old entry should be cleaned up
            const stats = detector.getStatistics();
            expect(stats.recentNearMissCount).toBe(1); // Only current entry remains
        });
    });
});
