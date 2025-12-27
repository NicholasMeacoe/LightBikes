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

const { ArenaShrinker } = require('@/systems/ArenaShrinker.js');

describe('ArenaShrinker', () => {
    let arenaShrinker;
    let mockCurrentTime;

    beforeEach(() => {
        arenaShrinker = new ArenaShrinker();
        mockCurrentTime = 1000; // Start at 1 second
        arenaShrinker.initialize(mockCurrentTime);
    });

    describe('initialization', () => {
        it('should initialize with default values', () => {
            const shrinker = new ArenaShrinker();
            expect(shrinker.initialSize).toBe(30);
            expect(shrinker.currentSize).toBe(30);
            expect(shrinker.minSize).toBe(10);
            expect(shrinker.shrinkInterval).toBe(5000);
            expect(shrinker.shrinkAmount).toBe(1);
            expect(shrinker.warningDuration).toBe(2000);
            expect(shrinker.gracePeriod).toBe(500);
        });

        it('should initialize with custom values', () => {
            const shrinker = new ArenaShrinker(40, 15, 3000, 2);
            expect(shrinker.initialSize).toBe(40);
            expect(shrinker.minSize).toBe(15);
            expect(shrinker.shrinkInterval).toBe(3000);
            expect(shrinker.shrinkAmount).toBe(2);
        });

        it('should reset state on initialize', () => {
            arenaShrinker.initialize(mockCurrentTime);
            expect(arenaShrinker.gameStartTime).toBe(mockCurrentTime);
            expect(arenaShrinker.lastShrinkTime).toBe(mockCurrentTime);
            expect(arenaShrinker.isActive).toBe(true);
            expect(arenaShrinker.warningActive).toBe(false);
            expect(arenaShrinker.shrinkCount).toBe(0);
            expect(arenaShrinker.isAtMinimum).toBe(false);
        });
    });

    describe('timing and state management', () => {
        it('should activate warning 2 seconds before shrink', () => {
            const warningCallback = jest.fn();
            arenaShrinker.setOnWarning(warningCallback);

            // Move to 3 seconds (2 seconds before 5-second shrink)
            mockCurrentTime += 3000;
            arenaShrinker.update(mockCurrentTime);

            expect(arenaShrinker.isWarningActive()).toBe(true);
            expect(warningCallback).toHaveBeenCalled();
        });

        it('should execute shrink after 5 seconds', () => {
            const shrinkCallback = jest.fn();
            arenaShrinker.setOnShrink(shrinkCallback);

            // Move to 5 seconds
            mockCurrentTime += 5000;
            arenaShrinker.update(mockCurrentTime);

            expect(arenaShrinker.getCurrentSize()).toBe(28); // 30 - 2 (1 from each side)
            expect(arenaShrinker.getShrinkCount()).toBe(1);
            expect(shrinkCallback).toHaveBeenCalled();
        });

        it('should track multiple shrink cycles', () => {
            // First shrink at 5 seconds
            mockCurrentTime += 5000;
            arenaShrinker.update(mockCurrentTime);
            expect(arenaShrinker.getCurrentSize()).toBe(28);
            expect(arenaShrinker.getShrinkCount()).toBe(1);

            // Second shrink at 10 seconds
            mockCurrentTime += 5000;
            arenaShrinker.update(mockCurrentTime);
            expect(arenaShrinker.getCurrentSize()).toBe(26);
            expect(arenaShrinker.getShrinkCount()).toBe(2);
        });

        it('should stop shrinking at minimum size', () => {
            const finalArenaCallback = jest.fn();
            arenaShrinker.setOnFinalArena(finalArenaCallback);

            // Shrink multiple times to reach minimum
            for (let i = 0; i < 15; i++) {
                mockCurrentTime += 5000;
                arenaShrinker.update(mockCurrentTime);
            }

            expect(arenaShrinker.getCurrentSize()).toBe(10);
            expect(arenaShrinker.isAtMinimumSize()).toBe(true);
            expect(arenaShrinker.isActive).toBe(false);
            expect(finalArenaCallback).toHaveBeenCalled();
        });

        it('should calculate time until shrink correctly', () => {
            // At start, should be 5 seconds until shrink
            expect(arenaShrinker.getTimeUntilShrink(mockCurrentTime)).toBe(5000);

            // After 2 seconds, should be 3 seconds until shrink
            mockCurrentTime += 2000;
            expect(arenaShrinker.getTimeUntilShrink(mockCurrentTime)).toBe(3000);

            // After shrink, should reset to 5 seconds
            mockCurrentTime += 3000;
            arenaShrinker.update(mockCurrentTime);
            expect(arenaShrinker.getTimeUntilShrink(mockCurrentTime)).toBe(5000);
        });

        it('should calculate countdown seconds for UI', () => {
            expect(arenaShrinker.getCountdownSeconds(mockCurrentTime)).toBe(5);

            mockCurrentTime += 2500; // 2.5 seconds
            expect(arenaShrinker.getCountdownSeconds(mockCurrentTime)).toBe(3); // Rounded up
        });
    });

    describe('boundary calculations', () => {
        it('should return correct current bounds', () => {
            const bounds = arenaShrinker.getCurrentBounds();
            expect(bounds).toEqual({
                minX: -15,
                maxX: 15,
                minZ: -15,
                maxZ: 15,
                size: 30,
            });
        });

        it('should return correct next bounds', () => {
            const nextBounds = arenaShrinker.getNextBounds();
            expect(nextBounds).toEqual({
                minX: -14,
                maxX: 14,
                minZ: -14,
                maxZ: 14,
                size: 28,
            });
        });

        it('should update bounds after shrink', () => {
            mockCurrentTime += 5000;
            arenaShrinker.update(mockCurrentTime);

            const bounds = arenaShrinker.getCurrentBounds();
            expect(bounds).toEqual({
                minX: -14,
                maxX: 14,
                minZ: -14,
                maxZ: 14,
                size: 28,
            });
        });

        it('should validate positions within bounds', () => {
            expect(arenaShrinker.isWithinBounds({ x: 0, z: 0 })).toBe(true);
            expect(arenaShrinker.isWithinBounds({ x: 14, z: 14 })).toBe(true);
            expect(arenaShrinker.isWithinBounds({ x: 16, z: 0 })).toBe(false);
            expect(arenaShrinker.isWithinBounds({ x: 0, z: 16 })).toBe(false);
        });

        it('should handle symmetric shrinking', () => {
            mockCurrentTime += 5000;
            arenaShrinker.update(mockCurrentTime);

            const bounds = arenaShrinker.getCurrentBounds();
            // Should shrink 1 unit from each side (2 total)
            expect(bounds.maxX - bounds.minX).toBe(28);
            expect(bounds.maxZ - bounds.minZ).toBe(28);
            expect(bounds.minX).toBe(-bounds.maxX); // Symmetric
            expect(bounds.minZ).toBe(-bounds.maxZ); // Symmetric
        });
    });

    describe('warning and countdown system', () => {
        it('should activate warning at correct time', () => {
            expect(arenaShrinker.isWarningActive()).toBe(false);

            // Move to warning activation time (3 seconds)
            mockCurrentTime += 3000;
            arenaShrinker.update(mockCurrentTime);

            expect(arenaShrinker.isWarningActive()).toBe(true);
        });

        it('should deactivate warning after shrink', () => {
            // Activate warning
            mockCurrentTime += 3000;
            arenaShrinker.update(mockCurrentTime);
            expect(arenaShrinker.isWarningActive()).toBe(true);

            // Execute shrink
            mockCurrentTime += 2000;
            arenaShrinker.update(mockCurrentTime);
            expect(arenaShrinker.isWarningActive()).toBe(false);
        });

        it('should manage grace period correctly', () => {
            // Execute shrink
            mockCurrentTime += 5000;
            arenaShrinker.update(mockCurrentTime);
            expect(arenaShrinker.isGracePeriodActive()).toBe(true);

            // Grace period should end after 0.5 seconds
            mockCurrentTime += 500;
            arenaShrinker.update(mockCurrentTime);
            expect(arenaShrinker.isGracePeriodActive()).toBe(false);
        });

        it('should provide complete arena state', () => {
            mockCurrentTime += 3000; // Activate warning
            arenaShrinker.update(mockCurrentTime);

            const state = arenaShrinker.getArenaState(mockCurrentTime);
            expect(state).toHaveProperty('currentSize', 30);
            expect(state).toHaveProperty('minSize', 10);
            expect(state).toHaveProperty('shrinkCount', 0);
            expect(state).toHaveProperty('isActive', true);
            expect(state).toHaveProperty('isAtMinimum', false);
            expect(state).toHaveProperty('warningActive', true);
            expect(state).toHaveProperty('gracePeriodActive', false);
            expect(state).toHaveProperty('timeUntilShrink', 2000);
            expect(state).toHaveProperty('countdownSeconds', 2);
            expect(state).toHaveProperty('currentBounds');
            expect(state).toHaveProperty('nextBounds');
        });
    });

    describe('reset functionality', () => {
        it('should reset to initial state', () => {
            // Make some changes
            mockCurrentTime += 5000;
            arenaShrinker.update(mockCurrentTime);
            expect(arenaShrinker.getCurrentSize()).toBe(28);
            expect(arenaShrinker.getShrinkCount()).toBe(1);

            // Reset
            arenaShrinker.reset();
            expect(arenaShrinker.getCurrentSize()).toBe(30);
            expect(arenaShrinker.getShrinkCount()).toBe(0);
            expect(arenaShrinker.isActive).toBe(true);
            expect(arenaShrinker.isAtMinimum).toBe(false);
            expect(arenaShrinker.warningActive).toBe(false);
        });
    });

    describe('callback system', () => {
        it('should call warning callback when warning activates', () => {
            const warningCallback = jest.fn();
            arenaShrinker.setOnWarning(warningCallback);

            mockCurrentTime += 3000;
            arenaShrinker.update(mockCurrentTime);

            expect(warningCallback).toHaveBeenCalledTimes(1);
        });

        it('should call shrink callback when shrink occurs', () => {
            const shrinkCallback = jest.fn();
            arenaShrinker.setOnShrink(shrinkCallback);

            mockCurrentTime += 5000;
            arenaShrinker.update(mockCurrentTime);

            expect(shrinkCallback).toHaveBeenCalledTimes(1);
        });

        it('should call final arena callback when minimum reached', () => {
            const finalArenaCallback = jest.fn();
            arenaShrinker.setOnFinalArena(finalArenaCallback);

            // Shrink to minimum
            for (let i = 0; i < 15; i++) {
                mockCurrentTime += 5000;
                arenaShrinker.update(mockCurrentTime);
            }

            expect(finalArenaCallback).toHaveBeenCalled();
        });
    });

    describe('survival time tracking', () => {
        it('should track survival time from initialization', () => {
            expect(arenaShrinker.getSurvivalTime(mockCurrentTime)).toBe(0);
            expect(arenaShrinker.isTrackingSurvival).toBe(true);

            // After 3 seconds
            mockCurrentTime += 3000;
            expect(arenaShrinker.getSurvivalTime(mockCurrentTime)).toBe(3000);
        });

        it('should format survival time correctly', () => {
            // Test various time formats
            mockCurrentTime += 65500; // 1 minute 5.5 seconds
            expect(arenaShrinker.getFormattedSurvivalTime(mockCurrentTime)).toBe('01:05.50');

            mockCurrentTime += 120000; // Add 2 more minutes
            expect(arenaShrinker.getFormattedSurvivalTime(mockCurrentTime)).toBe('03:05.50');
        });

        it('should stop tracking when survival ends', () => {
            mockCurrentTime += 5000;
            arenaShrinker.stopSurvivalTracking(mockCurrentTime);

            expect(arenaShrinker.isTrackingSurvival).toBe(false);
            expect(arenaShrinker.getSurvivalTime()).toBe(5000);

            // Time should not advance after stopping
            mockCurrentTime += 2000;
            expect(arenaShrinker.getSurvivalTime()).toBe(5000);
        });

        it('should handle survival time when not initialized', () => {
            const newShrinker = new ArenaShrinker();
            expect(newShrinker.getSurvivalTime()).toBe(0);
            expect(newShrinker.getFormattedSurvivalTime()).toBe('00:00.00');
        });
    });

    describe('arena progression tracking', () => {
        it('should track initial arena size', () => {
            const history = arenaShrinker.getArenaSizeHistory();
            expect(history).toHaveLength(1);
            expect(history[0]).toEqual({ size: 30, timestamp: mockCurrentTime });
        });

        it('should record arena size changes', () => {
            // First shrink
            mockCurrentTime += 5000;
            arenaShrinker.update(mockCurrentTime);

            const history = arenaShrinker.getArenaSizeHistory();
            expect(history).toHaveLength(2);
            expect(history[1]).toEqual({ size: 28, timestamp: mockCurrentTime });

            // Second shrink
            mockCurrentTime += 5000;
            arenaShrinker.update(mockCurrentTime);

            const updatedHistory = arenaShrinker.getArenaSizeHistory();
            expect(updatedHistory).toHaveLength(3);
            expect(updatedHistory[2]).toEqual({ size: 26, timestamp: mockCurrentTime });
        });

        it('should track shrink timestamps', () => {
            // First shrink
            const firstShrinkTime = mockCurrentTime + 5000;
            mockCurrentTime = firstShrinkTime;
            arenaShrinker.update(mockCurrentTime);

            // Second shrink
            const secondShrinkTime = mockCurrentTime + 5000;
            mockCurrentTime = secondShrinkTime;
            arenaShrinker.update(mockCurrentTime);

            const timestamps = arenaShrinker.getShrinkTimestamps();
            expect(timestamps).toEqual([firstShrinkTime, secondShrinkTime]);
        });

        it('should provide arena size at specific shrink events', () => {
            // Execute multiple shrinks
            for (let i = 0; i < 3; i++) {
                mockCurrentTime += 5000;
                arenaShrinker.update(mockCurrentTime);
            }

            expect(arenaShrinker.getArenaSizeAtShrink(0)).toBe(30); // Initial
            expect(arenaShrinker.getArenaSizeAtShrink(1)).toBe(28); // First shrink
            expect(arenaShrinker.getArenaSizeAtShrink(2)).toBe(26); // Second shrink
            expect(arenaShrinker.getArenaSizeAtShrink(3)).toBe(24); // Third shrink
            expect(arenaShrinker.getArenaSizeAtShrink(10)).toBe(null); // Invalid index
        });

        it('should provide shrink timestamps at specific events', () => {
            const shrinkTimes = [];

            // Execute multiple shrinks and record times
            for (let i = 0; i < 3; i++) {
                mockCurrentTime += 5000;
                shrinkTimes.push(mockCurrentTime);
                arenaShrinker.update(mockCurrentTime);
            }

            expect(arenaShrinker.getShrinkTimestamp(0)).toBe(shrinkTimes[0]);
            expect(arenaShrinker.getShrinkTimestamp(1)).toBe(shrinkTimes[1]);
            expect(arenaShrinker.getShrinkTimestamp(2)).toBe(shrinkTimes[2]);
            expect(arenaShrinker.getShrinkTimestamp(10)).toBe(null); // Invalid index
        });

        it('should return copies of tracking arrays to prevent external modification', () => {
            mockCurrentTime += 5000;
            arenaShrinker.update(mockCurrentTime);

            const history1 = arenaShrinker.getArenaSizeHistory();
            const history2 = arenaShrinker.getArenaSizeHistory();
            const timestamps1 = arenaShrinker.getShrinkTimestamps();
            const timestamps2 = arenaShrinker.getShrinkTimestamps();

            expect(history1).not.toBe(history2); // Different objects
            expect(history1).toEqual(history2); // Same content
            expect(timestamps1).not.toBe(timestamps2); // Different objects
            expect(timestamps1).toEqual(timestamps2); // Same content
        });
    });

    describe('survival statistics', () => {
        it('should provide comprehensive survival statistics', () => {
            // Simulate some gameplay
            mockCurrentTime += 3000; // 3 seconds survival
            arenaShrinker.update(mockCurrentTime); // Trigger warning

            mockCurrentTime += 2000; // 5 seconds total, trigger first shrink
            arenaShrinker.update(mockCurrentTime);

            mockCurrentTime += 5000; // 10 seconds total, trigger second shrink
            arenaShrinker.update(mockCurrentTime);

            const stats = arenaShrinker.getSurvivalStatistics(mockCurrentTime);

            expect(stats).toHaveProperty('survivalTime', 10000);
            expect(stats).toHaveProperty('formattedSurvivalTime', '00:10.00');
            expect(stats).toHaveProperty('shrinksSurvived', 2);
            expect(stats).toHaveProperty('finalArenaSize', 26);
            expect(stats).toHaveProperty('isAtMinimumArena', false);
            expect(stats).toHaveProperty('arenaSizeHistory');
            expect(stats).toHaveProperty('shrinkTimestamps');
            expect(stats).toHaveProperty('averageTimePerShrink', 5000);

            expect(stats.arenaSizeHistory).toHaveLength(3); // Initial + 2 shrinks
            expect(stats.shrinkTimestamps).toHaveLength(2);
        });

        it('should handle statistics when no shrinks occurred', () => {
            mockCurrentTime += 2000; // 2 seconds, no shrinks yet
            const stats = arenaShrinker.getSurvivalStatistics(mockCurrentTime);

            expect(stats.shrinksSurvived).toBe(0);
            expect(stats.averageTimePerShrink).toBe(0);
            expect(stats.arenaSizeHistory).toHaveLength(1); // Only initial size
            expect(stats.shrinkTimestamps).toHaveLength(0);
        });

        it('should include statistics in arena state', () => {
            mockCurrentTime += 7000; // Trigger one shrink
            arenaShrinker.update(mockCurrentTime);

            const state = arenaShrinker.getArenaState(mockCurrentTime);

            expect(state).toHaveProperty('survivalTime');
            expect(state).toHaveProperty('formattedSurvivalTime');
            expect(state).toHaveProperty('isTrackingSurvival');
            expect(state).toHaveProperty('arenaSizeHistory');
            expect(state).toHaveProperty('shrinkTimestamps');
            expect(state).toHaveProperty('survivalStatistics');
        });
    });

    describe('reset functionality with tracking', () => {
        it('should reset survival and progression tracking', () => {
            // Make some changes
            mockCurrentTime += 7000;
            arenaShrinker.update(mockCurrentTime);
            arenaShrinker.stopSurvivalTracking(mockCurrentTime);

            expect(arenaShrinker.getSurvivalTime()).toBeGreaterThan(0);
            expect(arenaShrinker.getArenaSizeHistory()).toHaveLength(2);
            expect(arenaShrinker.getShrinkTimestamps()).toHaveLength(1);

            // Reset
            arenaShrinker.reset();

            expect(arenaShrinker.getSurvivalTime()).toBe(0);
            expect(arenaShrinker.isTrackingSurvival).toBe(false);
            expect(arenaShrinker.getArenaSizeHistory()).toHaveLength(0);
            expect(arenaShrinker.getShrinkTimestamps()).toHaveLength(0);
        });
    });

    describe('edge cases', () => {
        it('should handle inactive state', () => {
            arenaShrinker.isActive = false;
            const initialSize = arenaShrinker.getCurrentSize();

            mockCurrentTime += 10000;
            arenaShrinker.update(mockCurrentTime);

            expect(arenaShrinker.getCurrentSize()).toBe(initialSize);
        });

        it('should handle minimum size state', () => {
            arenaShrinker.isAtMinimum = true;
            const initialSize = arenaShrinker.getCurrentSize();

            mockCurrentTime += 10000;
            arenaShrinker.update(mockCurrentTime);

            expect(arenaShrinker.getCurrentSize()).toBe(initialSize);
        });

        it('should return same bounds for next when at minimum', () => {
            // Shrink to minimum
            for (let i = 0; i < 15; i++) {
                mockCurrentTime += 5000;
                arenaShrinker.update(mockCurrentTime);
            }

            const currentBounds = arenaShrinker.getCurrentBounds();
            const nextBounds = arenaShrinker.getNextBounds();
            expect(currentBounds).toEqual(nextBounds);
        });

        it('should handle survival tracking edge cases', () => {
            // Stop tracking before any time passes
            arenaShrinker.stopSurvivalTracking(mockCurrentTime);
            expect(arenaShrinker.getSurvivalTime()).toBe(0);

            // Multiple stops should not cause issues
            arenaShrinker.stopSurvivalTracking(mockCurrentTime + 1000);
            expect(arenaShrinker.getSurvivalTime()).toBe(0);
        });
    });

    describe('timing accuracy and consistency', () => {
        it('should maintain precise timing intervals', () => {
            const warningCallback = jest.fn();
            const shrinkCallback = jest.fn();
            arenaShrinker.setOnWarning(warningCallback);
            arenaShrinker.setOnShrink(shrinkCallback);

            // Test multiple cycles for timing consistency
            for (let cycle = 0; cycle < 3; cycle++) {
                const cycleStart = mockCurrentTime;

                // Warning should activate at exactly 3 seconds
                mockCurrentTime = cycleStart + 3000;
                arenaShrinker.update(mockCurrentTime);
                expect(arenaShrinker.isWarningActive()).toBe(true);

                // Shrink should occur at exactly 5 seconds
                mockCurrentTime = cycleStart + 5000;
                arenaShrinker.update(mockCurrentTime);
                expect(arenaShrinker.getShrinkCount()).toBe(cycle + 1);
                expect(arenaShrinker.isWarningActive()).toBe(false);
            }

            expect(warningCallback).toHaveBeenCalledTimes(3);
            expect(shrinkCallback).toHaveBeenCalledTimes(3);
        });

        it('should handle rapid update calls without timing drift', () => {
            // Create fresh shrinker for this test
            const rapidShrinker = new ArenaShrinker();
            const testStartTime = 2000;
            rapidShrinker.initialize(testStartTime);

            const shrinkCallback = jest.fn();
            rapidShrinker.setOnShrink(shrinkCallback);

            // Test that multiple rapid updates at the same time don't cause multiple shrinks
            let currentTime = testStartTime + 5000; // At shrink time

            // Call update multiple times at the exact same timestamp
            for (let i = 0; i < 10; i++) {
                rapidShrinker.update(currentTime);
            }

            // Should only shrink once despite multiple updates
            expect(rapidShrinker.getShrinkCount()).toBe(1);
            expect(shrinkCallback).toHaveBeenCalledTimes(1);

            // Test second shrink
            currentTime += 5000; // 10 seconds total
            for (let i = 0; i < 10; i++) {
                rapidShrinker.update(currentTime);
            }

            expect(rapidShrinker.getShrinkCount()).toBe(2);
            expect(shrinkCallback).toHaveBeenCalledTimes(2);
        });

        it('should handle irregular update intervals', () => {
            const shrinkCallback = jest.fn();
            arenaShrinker.setOnShrink(shrinkCallback);

            // Irregular update pattern
            mockCurrentTime += 1000; // 1s
            arenaShrinker.update(mockCurrentTime);

            mockCurrentTime += 3500; // 4.5s total
            arenaShrinker.update(mockCurrentTime);
            expect(arenaShrinker.isWarningActive()).toBe(true);

            mockCurrentTime += 600; // 5.1s total
            arenaShrinker.update(mockCurrentTime);
            expect(arenaShrinker.getShrinkCount()).toBe(1);
            expect(shrinkCallback).toHaveBeenCalledTimes(1);
        });

        it('should enforce minimum size boundary correctly', () => {
            const customShrinker = new ArenaShrinker(14, 10, 1000, 1);
            customShrinker.initialize(mockCurrentTime);

            // Should shrink from 14 -> 12 -> 10 (minimum)
            mockCurrentTime += 1000;
            customShrinker.update(mockCurrentTime);
            expect(customShrinker.getCurrentSize()).toBe(12);
            expect(customShrinker.isAtMinimumSize()).toBe(false);

            mockCurrentTime += 1000;
            customShrinker.update(mockCurrentTime);
            expect(customShrinker.getCurrentSize()).toBe(10);
            expect(customShrinker.isAtMinimumSize()).toBe(true);
            expect(customShrinker.isActive).toBe(false);

            // Further updates should not change size
            mockCurrentTime += 1000;
            customShrinker.update(mockCurrentTime);
            expect(customShrinker.getCurrentSize()).toBe(10);
        });

        it('should validate boundary calculation precision', () => {
            // Test with custom shrink amount
            const precisionShrinker = new ArenaShrinker(20, 8, 2000, 2);
            precisionShrinker.initialize(mockCurrentTime);

            // Initial bounds: 20x20 -> -10 to +10
            let bounds = precisionShrinker.getCurrentBounds();
            expect(bounds.minX).toBe(-10);
            expect(bounds.maxX).toBe(10);
            expect(bounds.minZ).toBe(-10);
            expect(bounds.maxZ).toBe(10);

            // After shrink: 20 - (2*2) = 16 -> -8 to +8
            mockCurrentTime += 2000;
            precisionShrinker.update(mockCurrentTime);
            bounds = precisionShrinker.getCurrentBounds();
            expect(bounds.minX).toBe(-8);
            expect(bounds.maxX).toBe(8);
            expect(bounds.minZ).toBe(-8);
            expect(bounds.maxZ).toBe(8);
            expect(bounds.size).toBe(16);
        });
    });
});
