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

const { SurvivalTimer } = require('@/ui/SurvivalTimer.js');
const { LeaderboardSystem } = require('@/systems/LeaderboardSystem.js');
const { Game } = require('@/core/game.js');
const { GameModes } = require('@/systems/GameModes.js');

describe('Time Trial Performance and Accuracy Tests', () => {
    let mockPerformanceNow;
    let mockLocalStorage;

    beforeEach(() => {
        jest.clearAllMocks();

        // Re-initialize mock implementations to handle resetMocks: true
        mockPerformanceNow = jest.fn().mockReturnValue(0);
        global.performance = { now: mockPerformanceNow };

        mockLocalStorage = {
            data: {},
            getItem: jest.fn((key) => mockLocalStorage.data[key] || null),
            setItem: jest.fn((key, value) => {
                mockLocalStorage.data[key] = value;
            }),
            removeItem: jest.fn((key) => {
                delete mockLocalStorage.data[key];
            }),
            clear: jest.fn(() => {
                mockLocalStorage.data = {};
            }),
        };

        // Mock localStorage
        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true,
            configurable: true,
        });
    });

    describe('Timer Precision Under Load', () => {
        let timer;

        beforeEach(() => {
            timer = new SurvivalTimer();
        });

        it('should handle rapid timer queries without errors', () => {
            mockPerformanceNow.mockReturnValue(1000);
            timer.start();

            // Simulate rapid timer queries (1000 queries)
            const startTime = Date.now();
            for (let i = 0; i < 1000; i++) {
                mockPerformanceNow.mockReturnValue(1000 + i);
                timer.getElapsedTime();
                timer.getCurrentFormattedTime();
            }
            const endTime = Date.now();

            // Should complete rapidly (less than 100ms)
            expect(endTime - startTime).toBeLessThan(100);

            // Timer should still be functional
            expect(timer.isRunning).toBe(true);
            expect(typeof timer.getElapsedTime()).toBe('number');
        });

        it('should handle frame drops without throwing errors', () => {
            mockPerformanceNow.mockReturnValue(1000);
            timer.start();

            // Simulate irregular frame timing
            const irregularTimes = [1000, 1020, 1080, 1100, 1200, 1250, 1400];
            const measurements = [];

            irregularTimes.forEach((time) => {
                mockPerformanceNow.mockReturnValue(time);
                const elapsed = timer.getElapsedTime();
                measurements.push(elapsed);
                expect(elapsed).toBeGreaterThanOrEqual(0);
            });

            // Verify monotonic increase (no time going backwards)
            for (let i = 1; i < measurements.length; i++) {
                expect(measurements[i]).toBeGreaterThanOrEqual(measurements[i - 1]);
            }
        });

        it('should maintain state consistency during pause/resume cycles', () => {
            mockPerformanceNow.mockReturnValue(1000);
            timer.start();
            expect(timer.isRunning).toBe(true);
            expect(timer.isPaused).toBe(false);

            // Pause
            mockPerformanceNow.mockReturnValue(1500);
            timer.pause();
            expect(timer.isRunning).toBe(true);
            expect(timer.isPaused).toBe(true);

            // Resume
            mockPerformanceNow.mockReturnValue(2000);
            timer.resume();
            expect(timer.isRunning).toBe(true);
            expect(timer.isPaused).toBe(false);

            // Stop
            timer.stop();
            expect(timer.isRunning).toBe(false);
            expect(timer.isPaused).toBe(false);
        });

        it('should handle rapid pause/resume operations efficiently', () => {
            mockPerformanceNow.mockReturnValue(1000);
            timer.start();

            const startTime = Date.now();

            // Perform 100 rapid pause/resume cycles
            for (let i = 0; i < 100; i++) {
                mockPerformanceNow.mockReturnValue(1000 + i * 10);
                timer.pause();
                mockPerformanceNow.mockReturnValue(1000 + i * 10 + 5);
                timer.resume();
            }

            const endTime = Date.now();

            // Should complete efficiently (less than 50ms)
            expect(endTime - startTime).toBeLessThan(50);

            // Timer should still be in valid state
            expect(timer.isRunning).toBe(true);
            expect(timer.isPaused).toBe(false);
        });

        it('should handle edge cases gracefully', () => {
            // Test with various edge case scenarios
            expect(() => {
                timer.pause(); // Pause before start
                timer.resume(); // Resume before start
                timer.stop(); // Stop before start
                timer.getElapsedTime(); // Get time before start
            }).not.toThrow();

            // Start and test multiple starts
            mockPerformanceNow.mockReturnValue(1000);
            timer.start();
            timer.start(); // Second start should be ignored
            expect(timer.isRunning).toBe(true);

            // Multiple pauses
            timer.pause();
            timer.pause(); // Second pause should be ignored
            expect(timer.isPaused).toBe(true);

            // Multiple resumes
            timer.resume();
            timer.resume(); // Second resume should be ignored
            expect(timer.isPaused).toBe(false);
        });
    });

    describe('Memory Management During Extended Sessions', () => {
        let game;

        beforeEach(() => {
            game = new Game(GameModes.TIME_TRIAL);
        });

        it('should manage trail segments efficiently during long sessions', () => {
            mockPerformanceNow.mockReturnValue(1000);

            // Simulate 10 minutes of gameplay (36,000 frames at 60 FPS)
            const frameCount = 36000;
            const initialMemoryUsage = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
            const trailLengths = [];

            for (let i = 0; i < frameCount; i++) {
                mockPerformanceNow.mockReturnValue(1000 + i * 16.67);
                game.update();

                // Periodically check trail length doesn't grow unbounded
                if (i % 1000 === 0) {
                    const state = game.getGameState();
                    // Trail should be reasonable length, not growing indefinitely
                    // Allow for longer trails in extended sessions but check they're not excessive
                    trailLengths.push(state.playerTrail.length);
                }
            }

            trailLengths.forEach((length) => {
                expect(length).toBeLessThan(50000);
            });

            // Verify final state is reasonable
            const finalState = game.getGameState();
            expect(finalState.playerTrail.length).toBeGreaterThan(0);
            expect(finalState.playerTrail.length).toBeLessThan(50000);

            // Memory usage should not have grown excessively
            const finalMemoryUsage = process.memoryUsage
                ? process.memoryUsage().heapUsed
                : initialMemoryUsage;
            const memoryGrowth = finalMemoryUsage - initialMemoryUsage;
            // Allow reasonable growth but not excessive (less than 100MB)
            // If process.memoryUsage is not available, growth is 0 which passes
            expect(memoryGrowth).toBeLessThan(100 * 1024 * 1024);
        });

        it('should handle timer state efficiently during extended runtime', () => {
            mockPerformanceNow.mockReturnValue(1000);
            game.update(); // Start the timer

            const startTime = Date.now();

            // Query timer at regular intervals (simulate extended gameplay)
            for (let i = 1; i <= 1000; i++) {
                mockPerformanceNow.mockReturnValue(1000 + i);

                const survivalTime = game.getSurvivalTime();
                const formattedTime = game.getFormattedSurvivalTime();

                // Verify timer continues to work correctly
                expect(survivalTime).toBeGreaterThanOrEqual(0);
                expect(formattedTime).toMatch(/^\d{2}:\d{2}\.\d{2}$/);

                // Verify no memory leaks in timer state
                const timerState = game.survivalTimer.getState();
                expect(typeof timerState.startTime).toBe('number');
                expect(typeof timerState.totalPausedDuration).toBe('number');
            }

            const endTime = Date.now();

            // Should complete efficiently (less than 500ms for 1000 queries)
            expect(endTime - startTime).toBeLessThan(500);
        });

        it('should handle game restart without memory leaks', () => {
            // Perform multiple restart cycles
            for (let cycle = 0; cycle < 100; cycle++) {
                mockPerformanceNow.mockReturnValue(1000 + cycle * 10000);

                // Start game and run briefly
                game.update();
                for (let i = 0; i < 100; i++) {
                    mockPerformanceNow.mockReturnValue(1000 + cycle * 10000 + i * 16);
                    game.update();
                }

                // Restart game
                game.restart();

                // Verify clean state after restart
                const state = game.getGameState();
                expect(state.survivalTime).toBe(0);
                expect(state.playerTrail.length).toBe(0);
                expect(state.gameStarted).toBe(false);
            }
        });
    });

    describe('Leaderboard Storage Efficiency and Cleanup', () => {
        let leaderboard;

        beforeEach(() => {
            leaderboard = new LeaderboardSystem();
        });

        it('should handle large numbers of score additions efficiently', () => {
            const startTime = Date.now();

            // Add 1000 scores rapidly
            for (let i = 0; i < 1000; i++) {
                const timeMs = Math.random() * 300000; // Random times up to 5 minutes
                leaderboard.addScore(timeMs);
            }

            const endTime = Date.now();
            const operationTime = endTime - startTime;

            // Should complete within reasonable time (less than 1 second)
            expect(operationTime).toBeLessThan(1000);

            // Should maintain only top 10 scores
            expect(leaderboard.getTopScores()).toHaveLength(10);

            // Scores should be properly sorted (longest survival first)
            const scores = leaderboard.getTopScores();
            for (let i = 1; i < scores.length; i++) {
                expect(scores[i - 1].timeMs).toBeGreaterThanOrEqual(scores[i].timeMs);
            }
        });

        it('should handle localStorage quota efficiently', () => {
            // Fill leaderboard with maximum entries
            for (let i = 1; i <= 10; i++) {
                leaderboard.addScore(i * 10000);
            }

            // Mock quota exceeded error
            const quotaError = new Error('Quota exceeded');
            quotaError.name = 'QuotaExceededError';

            const originalSetItem = mockLocalStorage.setItem;
            mockLocalStorage.setItem = jest.fn(() => {
                throw quotaError; // Always throw quota error
            });

            // Add new score that should trigger quota handling
            const result = leaderboard.addScore(150000);

            // Should handle quota gracefully by returning false
            expect(result.success).toBe(false);
            expect(mockLocalStorage.setItem).toHaveBeenCalled();

            // Restore original
            mockLocalStorage.setItem = originalSetItem;
        });

        it('should validate and clean corrupted data efficiently', () => {
            // Insert various types of corrupted data
            const corruptedData = [
                { timeMs: 30000, timestamp: Date.now(), formattedTime: '00:30.00' }, // Valid
                { timeMs: 'invalid', timestamp: Date.now() }, // Invalid timeMs
                { timeMs: 45000 }, // Missing fields
                null, // Null entry
                { timeMs: -1000, timestamp: Date.now(), formattedTime: '-00:01.00' }, // Negative time
                { timeMs: 60000, timestamp: Date.now(), formattedTime: '01:00.00' }, // Valid
                'not an object', // Invalid type
                { timeMs: 7000000, timestamp: Date.now(), formattedTime: '116:40.00' }, // Too large
            ];

            mockLocalStorage.data['lightbikes_time_trial_scores'] = JSON.stringify(corruptedData);

            // Create new leaderboard instance to trigger data loading
            const newLeaderboard = new LeaderboardSystem();

            // Should have filtered out invalid entries
            const scores = newLeaderboard.getTopScores();
            expect(scores).toHaveLength(2); // Only 2 valid entries
            expect(scores[0].timeMs).toBe(60000);
            expect(scores[1].timeMs).toBe(30000);
        });

        it('should handle concurrent access patterns', () => {
            // Simulate multiple rapid operations
            const operations = [];

            for (let i = 0; i < 50; i++) {
                operations.push(() => leaderboard.addScore(Math.random() * 100000));
                operations.push(() => leaderboard.getTopScores());
                operations.push(() => leaderboard.isNewRecord(Math.random() * 100000));
            }

            // Execute all operations
            const startTime = Date.now();
            operations.forEach((op) => op());
            const endTime = Date.now();

            // Should complete efficiently
            expect(endTime - startTime).toBeLessThan(500);

            // Final state should be consistent
            const finalScores = leaderboard.getTopScores();
            expect(finalScores.length).toBeLessThanOrEqual(10);

            // Verify sorting is maintained
            for (let i = 1; i < finalScores.length; i++) {
                expect(finalScores[i - 1].timeMs).toBeGreaterThanOrEqual(finalScores[i].timeMs);
            }
        });

        it('should cleanup storage efficiently on clear', () => {
            // Fill leaderboard
            for (let i = 1; i <= 10; i++) {
                leaderboard.addScore(i * 10000);
            }

            expect(leaderboard.getTopScores()).toHaveLength(10);

            // Clear and verify cleanup
            leaderboard.clearScores();

            expect(leaderboard.getTopScores()).toHaveLength(0);
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
                'lightbikes_time_trial_scores'
            );
            expect(mockLocalStorage.data['lightbikes_time_trial_scores']).toBeUndefined();
        });
    });

    describe('Performance Under Stress Conditions', () => {
        it('should maintain timer stability under stress conditions', () => {
            const timer = new SurvivalTimer();
            mockPerformanceNow.mockReturnValue(1000);
            timer.start();

            const startTime = Date.now();
            const measurements = [];

            // Simulate stress with rapid operations and irregular timing
            for (let i = 0; i < 1000; i++) {
                mockPerformanceNow.mockReturnValue(1000 + Math.random() * 1000);
                measurements.push(timer.getElapsedTime());

                // Occasionally pause/resume to add complexity
                if (i % 100 === 0) {
                    timer.pause();
                    timer.resume();
                }
            }

            const endTime = Date.now();

            // Should complete efficiently despite stress
            expect(endTime - startTime).toBeLessThan(100);

            // All measurements should be valid numbers
            measurements.forEach((measurement) => {
                expect(typeof measurement).toBe('number');
                expect(measurement).toBeGreaterThanOrEqual(0);
                expect(isFinite(measurement)).toBe(true);
            });

            // Timer should still be functional
            expect(timer.isRunning).toBe(true);
        });

        it('should handle rapid game mode switching efficiently', () => {
            const games = [];

            // Create multiple game instances rapidly
            for (let i = 0; i < 100; i++) {
                const mode = i % 2 === 0 ? GameModes.CLASSIC : GameModes.TIME_TRIAL;
                games.push(new Game(mode));
            }

            // Verify all instances are properly initialized
            games.forEach((game, index) => {
                const expectedMode = index % 2 === 0 ? GameModes.CLASSIC : GameModes.TIME_TRIAL;
                expect(game.gameMode).toBe(expectedMode);

                const shouldHaveTimer = expectedMode === GameModes.TIME_TRIAL;
                // Check if timer exists (truthy) matching expected mode
                expect(!!game.survivalTimer).toBe(shouldHaveTimer);
            });
        });
    });
});
