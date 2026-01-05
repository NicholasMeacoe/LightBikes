/**
 * Arena Shrink Mode Performance Validation Tests
 * Tests performance impact, memory usage, and timing precision
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

const { Game } = require('@/core/game.js');
const { ArenaShrinker } = require('@/systems/ArenaShrinker.js');
const { GameModes } = require('@/systems/GameModes.js');

describe('Arena Shrink Mode Performance Validation', () => {
    let game;
    let arenaShrinker;

    beforeEach(() => {
        game = new Game(GameModes.ARENA_SHRINK);
        arenaShrinker = new ArenaShrinker();
    });

    describe('Frame Rate Impact of Dynamic Boundaries', () => {
        it('should maintain consistent performance with dynamic boundary queries', () => {
            game.init();
            const mockTime = Date.now();
            game.arenaShrinker.initialize(mockTime);

            // Measure time for boundary queries
            const iterations = 10000;
            const startTime = performance.now();

            for (let i = 0; i < iterations; i++) {
                const bounds = game.getBounds();
                expect(bounds).toBeDefined();
                expect(bounds.size).toBeGreaterThanOrEqual(10);
            }

            const endTime = performance.now();
            const totalTime = endTime - startTime;
            const avgTimePerQuery = totalTime / iterations;

            // Should be very fast - less than 1ms per query
            expect(avgTimePerQuery).toBeLessThan(1.0);
            console.log(`Dynamic boundary query: ${avgTimePerQuery.toFixed(6)}ms per query`);
        });

        it('should compare dynamic vs static boundary performance', () => {
            const classicGame = new Game(GameModes.CLASSIC);
            const arenaShrinkGame = new Game(GameModes.ARENA_SHRINK);

            classicGame.init();
            arenaShrinkGame.init();
            arenaShrinkGame.arenaShrinker.initialize(Date.now());

            const iterations = 10000;

            // Measure static boundary performance
            const staticStart = performance.now();
            for (let i = 0; i < iterations; i++) {
                classicGame.getBounds();
            }
            const staticEnd = performance.now();
            const staticTime = staticEnd - staticStart;

            // Measure dynamic boundary performance
            const dynamicStart = performance.now();
            for (let i = 0; i < iterations; i++) {
                arenaShrinkGame.getBounds();
            }
            const dynamicEnd = performance.now();
            const dynamicTime = dynamicEnd - dynamicStart;

            // Dynamic should be at most 2x slower than static
            const performanceRatio = dynamicTime / staticTime;
            expect(performanceRatio).toBeLessThan(2.0);

            console.log(`Static boundary: ${(staticTime / iterations).toFixed(6)}ms per query`);
            console.log(`Dynamic boundary: ${(dynamicTime / iterations).toFixed(6)}ms per query`);
            console.log(`Performance ratio: ${performanceRatio.toFixed(2)}x`);
        });

        it('should maintain performance during shrink events', () => {
            game.init();
            const mockTime = Date.now();
            game.arenaShrinker.initialize(mockTime);

            const measurements = [];

            // Measure performance before, during, and after shrink
            for (let cycle = 0; cycle < 5; cycle++) {
                const cycleStart = mockTime + cycle * 5000;

                // Before shrink
                const beforeStart = performance.now();
                for (let i = 0; i < 1000; i++) {
                    game.getBounds();
                }
                const beforeTime = performance.now() - beforeStart;

                // Trigger shrink
                game.arenaShrinker.update(cycleStart + 5000);

                // After shrink
                const afterStart = performance.now();
                for (let i = 0; i < 1000; i++) {
                    game.getBounds();
                }
                const afterTime = performance.now() - afterStart;

                measurements.push({ before: beforeTime, after: afterTime });
            }

            // Performance should remain consistent
            const avgBefore =
                measurements.reduce((sum, m) => sum + m.before, 0) / measurements.length;
            const avgAfter =
                measurements.reduce((sum, m) => sum + m.after, 0) / measurements.length;
            const variance = Math.abs(avgAfter - avgBefore) / avgBefore;

            expect(variance).toBeLessThan(2.0); // Less than 200% variance (relaxed for test environment)
            console.log(`Performance variance during shrinks: ${(variance * 100).toFixed(2)}%`);
        });

        it('should handle high-frequency boundary checks efficiently', () => {
            game.init();
            const mockTime = Date.now();
            game.arenaShrinker.initialize(mockTime);

            // Simulate 60 FPS for 10 seconds with boundary checks
            const frameTime = 1000 / 60;
            const totalFrames = 600;

            const startTime = performance.now();

            for (let frame = 0; frame < totalFrames; frame++) {
                const currentTime = mockTime + frame * frameTime;

                // Update arena shrinker
                game.arenaShrinker.update(currentTime);

                // Multiple boundary checks per frame (typical game scenario)
                for (let check = 0; check < 10; check++) {
                    const bounds = game.getBounds();
                    const nextBounds = game.getNextBounds();

                    // Simulate position validation
                    game.arenaShrinker.isWithinBounds({ x: 0, z: 0 });
                    game.arenaShrinker.isWithinBounds({ x: 5, z: 5 });
                }
            }

            const endTime = performance.now();
            const totalTime = endTime - startTime;
            const avgTimePerFrame = totalTime / totalFrames;

            // Should maintain 60 FPS (< 16.67ms per frame)
            expect(avgTimePerFrame).toBeLessThan(16.67);
            console.log(`High-frequency simulation: ${avgTimePerFrame.toFixed(3)}ms per frame`);
        });
    });

    describe('Memory Usage During Extended Shrink Sessions', () => {
        it('should not accumulate excessive memory during long sessions', () => {
            game.init();
            const mockTime = Date.now();
            game.arenaShrinker.initialize(mockTime);

            // Simulate extended session
            let currentTime = mockTime;
            const initialMemory = process.memoryUsage();

            // Run for many shrink cycles
            for (let i = 0; i < 50; i++) {
                currentTime += 5000;
                game.arenaShrinker.update(currentTime);

                // Generate some activity
                for (let j = 0; j < 100; j++) {
                    game.getBounds();
                    game.getNextBounds();
                    game.arenaShrinker.getArenaState(currentTime);
                    game.arenaShrinker.getSurvivalStatistics(currentTime);
                }
            }

            const finalMemory = process.memoryUsage();
            const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

            // Memory increase should be reasonable (< 10MB)
            expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
            console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
        });

        it('should manage arena size history efficiently', () => {
            const mockTime = Date.now();
            arenaShrinker.initialize(mockTime);

            // Track memory usage of history arrays
            let currentTime = mockTime;

            // Generate many shrink events
            for (let i = 0; i < 100; i++) {
                currentTime += 5000;
                arenaShrinker.update(currentTime);
            }

            const history = arenaShrinker.getArenaSizeHistory();
            const timestamps = arenaShrinker.getShrinkTimestamps();

            // History should be bounded to prevent memory leaks
            expect(history.length).toBeLessThan(200); // Reasonable upper bound
            expect(timestamps.length).toBeLessThan(200);

            // Each history entry should be small
            const historySize = JSON.stringify(history).length;
            const timestampSize = JSON.stringify(timestamps).length;

            expect(historySize).toBeLessThan(10000); // < 10KB
            expect(timestampSize).toBeLessThan(5000); // < 5KB

            console.log(`History size: ${historySize} bytes, Timestamps: ${timestampSize} bytes`);
        });

        it('should handle garbage collection efficiently', () => {
            game.init();
            const mockTime = Date.now();
            game.arenaShrinker.initialize(mockTime);

            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }

            const initialMemory = process.memoryUsage();

            // Create and destroy many temporary objects
            for (let cycle = 0; cycle < 10; cycle++) {
                const tempObjects = [];

                for (let i = 0; i < 1000; i++) {
                    tempObjects.push({
                        bounds: game.getBounds(),
                        nextBounds: game.getNextBounds(),
                        state: game.arenaShrinker.getArenaState(mockTime + i),
                        stats: game.arenaShrinker.getSurvivalStatistics(mockTime + i),
                    });
                }

                // Clear references
                tempObjects.length = 0;
            }

            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }

            const finalMemory = process.memoryUsage();
            const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

            // Memory should not increase excessively after cleanup
            expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024); // < 20MB (test environment)
            console.log(
                `Memory after GC test: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB increase`
            );
        });

        it('should handle concurrent game instances efficiently', () => {
            const instances = [];
            const mockTime = Date.now();

            // Create multiple game instances
            for (let i = 0; i < 10; i++) {
                const instance = new Game(GameModes.ARENA_SHRINK);
                instance.init();
                instance.arenaShrinker.initialize(mockTime);
                instances.push(instance);
            }

            const startMemory = process.memoryUsage();

            // Run all instances simultaneously
            for (let cycle = 0; cycle < 20; cycle++) {
                const currentTime = mockTime + cycle * 1000;

                instances.forEach((instance) => {
                    instance.arenaShrinker.update(currentTime);
                    instance.getBounds();
                    instance.getNextBounds();
                });
            }

            const endMemory = process.memoryUsage();
            const memoryPerInstance =
                (endMemory.heapUsed - startMemory.heapUsed) / instances.length;

            // Each instance should use reasonable memory
            expect(memoryPerInstance).toBeLessThan(1024 * 1024); // < 1MB per instance
            console.log(`Memory per instance: ${(memoryPerInstance / 1024).toFixed(2)}KB`);
        });
    });

    describe('Timing Precision Under Various Loads', () => {
        it('should maintain timing accuracy under CPU load', () => {
            const mockTime = Date.now();
            arenaShrinker.initialize(mockTime);

            // Create CPU load
            const cpuLoadWork = () => {
                let sum = 0;
                for (let i = 0; i < 100000; i++) {
                    sum += Math.random();
                }
                return sum;
            };

            const timingTests = [];

            for (let test = 0; test < 10; test++) {
                // Add CPU load
                cpuLoadWork();

                const testStart = performance.now();

                // Test timing precision
                const warningTime = mockTime + 3000;
                const shrinkTime = mockTime + 5000;

                arenaShrinker.update(warningTime);
                const warningActivated = arenaShrinker.isWarningActive();

                arenaShrinker.update(shrinkTime);
                const shrinkOccurred = arenaShrinker.getShrinkCount() > 0;

                const testEnd = performance.now();

                timingTests.push({
                    duration: testEnd - testStart,
                    warningCorrect: warningActivated,
                    shrinkCorrect: shrinkOccurred,
                });

                // Reset for next test
                arenaShrinker.reset();
                arenaShrinker.initialize(mockTime);
            }

            // All timing should be correct despite CPU load
            timingTests.forEach((test) => {
                expect(test.warningCorrect).toBe(true);
                expect(test.shrinkCorrect).toBe(true);
            });

            const avgDuration =
                timingTests.reduce((sum, test) => sum + test.duration, 0) / timingTests.length;
            console.log(`Timing precision under load: ${avgDuration.toFixed(3)}ms average`);
        });

        it('should handle rapid time updates without drift', () => {
            const mockTime = Date.now();
            arenaShrinker.initialize(mockTime);

            const shrinkCallback = jest.fn();
            arenaShrinker.setOnShrink(shrinkCallback);

            // Simulate very rapid updates (1000 FPS)
            const frameTime = 1;
            let currentTime = mockTime;

            const startTime = performance.now();

            // Run for 10 seconds of game time
            while (currentTime < mockTime + 10000) {
                currentTime += frameTime;
                arenaShrinker.update(currentTime);
            }

            const endTime = performance.now();
            const realTime = endTime - startTime;

            // Should have exactly 2 shrinks (at 5s and 10s)
            expect(arenaShrinker.getShrinkCount()).toBe(2);
            expect(shrinkCallback).toHaveBeenCalledTimes(2);

            // Performance should be reasonable even with rapid updates
            expect(realTime).toBeLessThan(100); // < 100ms real time
            console.log(`Rapid updates: ${realTime.toFixed(2)}ms for 10000 updates`);
        });

        it('should maintain precision with irregular update intervals', () => {
            const mockTime = Date.now();
            arenaShrinker.initialize(mockTime);

            const shrinkCallback = jest.fn();
            arenaShrinker.setOnShrink(shrinkCallback);

            // Irregular update pattern
            const updateTimes = [
                mockTime + 100, // 0.1s
                mockTime + 500, // 0.5s
                mockTime + 2000, // 2s
                mockTime + 3500, // 3.5s (should trigger warning)
                mockTime + 4000, // 4s
                mockTime + 5500, // 5.5s (should trigger shrink)
                mockTime + 7000, // 7s
                mockTime + 10000, // 10s (should trigger second shrink)
                mockTime + 12000, // 12s
            ];

            let warningTriggered = false;
            let firstShrinkTime = null;
            let secondShrinkTime = null;

            updateTimes.forEach((time) => {
                arenaShrinker.update(time);

                if (!warningTriggered && arenaShrinker.isWarningActive()) {
                    warningTriggered = true;
                    expect(time).toBeGreaterThanOrEqual(mockTime + 3000); // Warning after 3s
                }

                if (!firstShrinkTime && arenaShrinker.getShrinkCount() === 1) {
                    firstShrinkTime = time;
                    expect(time).toBeGreaterThanOrEqual(mockTime + 5000); // First shrink after 5s
                }

                if (!secondShrinkTime && arenaShrinker.getShrinkCount() === 2) {
                    secondShrinkTime = time;
                    expect(time).toBeGreaterThanOrEqual(mockTime + 10000); // Second shrink after 10s
                }
            });

            expect(warningTriggered).toBe(true);
            expect(firstShrinkTime).toBeTruthy();
            expect(secondShrinkTime).toBeTruthy();
            expect(shrinkCallback).toHaveBeenCalledTimes(2);
        });

        it('should handle system clock adjustments gracefully', () => {
            const mockTime = Date.now();
            arenaShrinker.initialize(mockTime);

            // Normal progression
            arenaShrinker.update(mockTime + 2000); // 2s
            expect(arenaShrinker.isWarningActive()).toBe(false);

            arenaShrinker.update(mockTime + 3000); // 3s - warning should activate
            expect(arenaShrinker.isWarningActive()).toBe(true);

            // Simulate clock going backwards (system time adjustment)
            arenaShrinker.update(mockTime + 2500); // Back to 2.5s

            // Should handle gracefully without breaking
            expect(arenaShrinker.isWarningActive()).toBe(true); // Should remain active

            // Continue normal progression
            arenaShrinker.update(mockTime + 5000); // 5s - shrink should occur
            expect(arenaShrinker.getShrinkCount()).toBe(1);
        });

        it('should maintain performance with complex game state queries', () => {
            game.init();
            const mockTime = Date.now();
            game.arenaShrinker.initialize(mockTime);

            // Simulate complex game state with many entities
            game.playerTrail = Array.from({ length: 1000 }, (_, i) => ({
                x: i * 0.1,
                y: 0,
                z: Math.sin(i * 0.1),
            }));

            game.aiTrail = Array.from({ length: 1000 }, (_, i) => ({
                x: -i * 0.1,
                y: 0,
                z: Math.cos(i * 0.1),
            }));

            const iterations = 1000;
            const startTime = performance.now();

            for (let i = 0; i < iterations; i++) {
                const currentTime = mockTime + i * 10;

                // Complex state queries
                game.arenaShrinker.update(currentTime);
                const gameState = game.getGameState();
                const bounds = game.getBounds();
                const nextBounds = game.getNextBounds();

                // Validate many positions
                for (let j = 0; j < 10; j++) {
                    const pos = { x: j - 5, z: j - 5 };
                    game.arenaShrinker.isWithinBounds(pos);
                }

                expect(gameState).toBeDefined();
                expect(bounds).toBeDefined();
            }

            const endTime = performance.now();
            const totalTime = endTime - startTime;
            const avgTimePerIteration = totalTime / iterations;

            // Should maintain good performance even with complex state
            expect(avgTimePerIteration).toBeLessThan(1.0); // < 1ms per iteration
            console.log(`Complex state queries: ${avgTimePerIteration.toFixed(3)}ms per iteration`);
        });
    });

    describe('Smooth Gameplay Throughout Shrinking Process', () => {
        it('should maintain consistent frame timing during shrinks', () => {
            game.init();
            const mockTime = Date.now();
            game.arenaShrinker.initialize(mockTime);

            const frameTimes = [];
            let currentTime = mockTime;

            // Simulate 60 FPS gameplay through multiple shrink cycles
            for (let frame = 0; frame < 1200; frame++) {
                // 20 seconds at 60 FPS
                const frameStart = performance.now();

                currentTime += 1000 / 60; // 16.67ms per frame

                // Typical frame operations
                game.arenaShrinker.update(currentTime);
                game.getBounds();
                game.getNextBounds();

                // Simulate collision checks
                for (let i = 0; i < 5; i++) {
                    const pos = { x: Math.random() * 20 - 10, z: Math.random() * 20 - 10 };
                    game.arenaShrinker.isWithinBounds(pos);
                }

                const frameEnd = performance.now();
                frameTimes.push(frameEnd - frameStart);
            }

            // Calculate frame time statistics
            const avgFrameTime =
                frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
            const maxFrameTime = Math.max(...frameTimes);
            const minFrameTime = Math.min(...frameTimes);
            const variance =
                frameTimes.reduce((sum, time) => sum + Math.pow(time - avgFrameTime, 2), 0) /
                frameTimes.length;
            const stdDev = Math.sqrt(variance);

            // Frame times should be consistent
            expect(avgFrameTime).toBeLessThan(5.0); // < 5ms average
            expect(maxFrameTime).toBeLessThan(20.0); // < 20ms max
            expect(stdDev).toBeLessThan(2.0); // Low variance

            console.log(
                `Frame timing - Avg: ${avgFrameTime.toFixed(3)}ms, Max: ${maxFrameTime.toFixed(3)}ms, StdDev: ${stdDev.toFixed(3)}ms`
            );
        });

        it('should handle boundary transitions smoothly', () => {
            game.init();
            const mockTime = Date.now();
            game.arenaShrinker.initialize(mockTime);

            const transitionTimes = [];

            // Test multiple shrink transitions
            for (let cycle = 0; cycle < 5; cycle++) {
                const shrinkTime = mockTime + (cycle + 1) * 5000;

                // Measure transition performance
                const transitionStart = performance.now();

                // Before shrink
                const beforeBounds = game.getBounds();

                // Trigger shrink
                game.arenaShrinker.update(shrinkTime);

                // After shrink
                const afterBounds = game.getBounds();

                const transitionEnd = performance.now();
                transitionTimes.push(transitionEnd - transitionStart);

                // Verify transition occurred
                expect(afterBounds.size).toBeLessThan(beforeBounds.size);
            }

            const avgTransitionTime =
                transitionTimes.reduce((sum, time) => sum + time, 0) / transitionTimes.length;
            const maxTransitionTime = Math.max(...transitionTimes);

            // Transitions should be fast
            expect(avgTransitionTime).toBeLessThan(1.0); // < 1ms average
            expect(maxTransitionTime).toBeLessThan(5.0); // < 5ms max

            console.log(
                `Boundary transitions - Avg: ${avgTransitionTime.toFixed(3)}ms, Max: ${maxTransitionTime.toFixed(3)}ms`
            );
        });

        it('should maintain responsiveness during warning periods', () => {
            game.init();
            const mockTime = Date.now();
            game.arenaShrinker.initialize(mockTime);

            const responseTimes = [];

            // Test responsiveness during multiple warning periods
            for (let cycle = 0; cycle < 5; cycle++) {
                // Reset for each cycle
                game.arenaShrinker.reset();
                game.arenaShrinker.initialize(mockTime + cycle * 10000);

                const warningTime = mockTime + cycle * 10000 + 3000; // 3s into each cycle

                const responseStart = performance.now();

                // Trigger warning
                game.arenaShrinker.update(warningTime);

                // Perform typical warning-period operations
                const isWarning = game.arenaShrinker.isWarningActive();
                const timeUntilShrink = game.arenaShrinker.getTimeUntilShrink(warningTime);
                const countdown = game.arenaShrinker.getCountdownSeconds(warningTime);
                const nextBounds = game.getNextBounds();

                const responseEnd = performance.now();
                responseTimes.push(responseEnd - responseStart);

                // Verify warning state
                expect(isWarning).toBe(true);
                expect(timeUntilShrink).toBeLessThanOrEqual(2000);
                expect(countdown).toBeGreaterThan(0);
                expect(nextBounds).toBeDefined();
            }

            const avgResponseTime =
                responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
            const maxResponseTime = Math.max(...responseTimes);

            // Warning operations should be fast
            expect(avgResponseTime).toBeLessThan(0.5); // < 0.5ms average
            expect(maxResponseTime).toBeLessThan(2.0); // < 2ms max

            console.log(
                `Warning responsiveness - Avg: ${avgResponseTime.toFixed(3)}ms, Max: ${maxResponseTime.toFixed(3)}ms`
            );
        });
    });
});
