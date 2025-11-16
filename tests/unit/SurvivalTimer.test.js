const { SurvivalTimer } = require('./SurvivalTimer.js');

// Mock performance.now globally
const mockPerformanceNow = jest.fn();
const originalPerformanceNow = global.performance ? global.performance.now : () => Date.now();

// Set up the mock before any tests run
global.performance = { now: mockPerformanceNow };

describe('SurvivalTimer', () => {
    let timer;

    beforeEach(() => {
        // Reset the mock and set default return value
        mockPerformanceNow.mockReset();
        mockPerformanceNow.mockReturnValue(0);
        
        timer = new SurvivalTimer();
    });

    afterAll(() => {
        // Restore original performance.now after all tests
        global.performance = { now: originalPerformanceNow };
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(timer.startTime).toBeNull();
            expect(timer.pausedTime).toBe(0);
            expect(timer.totalPausedDuration).toBe(0);
            expect(timer.isPaused).toBe(false);
            expect(timer.isRunning).toBe(false);
        });
    });

    describe('start', () => {
        it('should start the timer', () => {
            mockPerformanceNow.mockReturnValue(1000);
            
            timer.start();
            
            expect(timer.startTime).toBe(1000);
            expect(timer.isRunning).toBe(true);
            expect(timer.isPaused).toBe(false);
            expect(timer.totalPausedDuration).toBe(0);
        });

        it('should not restart if already running', () => {
            mockPerformanceNow.mockReturnValue(1000);
            timer.start();
            
            mockPerformanceNow.mockReturnValue(2000);
            timer.start(); // Second start call
            
            expect(timer.startTime).toBe(1000); // Should not change
        });
    });

    describe('pause', () => {
        it('should pause the timer', () => {
            mockPerformanceNow.mockReturnValue(1000);
            timer.start();
            
            mockPerformanceNow.mockReturnValue(2000);
            timer.pause();
            
            expect(timer.isPaused).toBe(true);
            expect(timer.pausedTime).toBe(2000);
        });

        it('should not pause if not running', () => {
            timer.pause();
            
            expect(timer.isPaused).toBe(false);
            expect(timer.pausedTime).toBe(0);
        });

        it('should not pause if already paused', () => {
            mockPerformanceNow.mockReturnValue(1000);
            timer.start();
            
            mockPerformanceNow.mockReturnValue(2000);
            timer.pause();
            
            mockPerformanceNow.mockReturnValue(3000);
            timer.pause(); // Second pause call
            
            expect(timer.pausedTime).toBe(2000); // Should not change
        });
    });

    describe('resume', () => {
        it('should resume from pause', () => {
            mockPerformanceNow.mockReturnValue(1000);
            timer.start();
            
            mockPerformanceNow.mockReturnValue(2000);
            timer.pause();
            
            mockPerformanceNow.mockReturnValue(3000);
            timer.resume();
            
            expect(timer.isPaused).toBe(false);
            expect(timer.pausedTime).toBe(0);
            expect(timer.totalPausedDuration).toBe(1000); // 3000 - 2000
        });

        it('should not resume if not paused', () => {
            mockPerformanceNow.mockReturnValue(1000);
            timer.start();
            
            timer.resume();
            
            expect(timer.totalPausedDuration).toBe(0);
        });

        it('should accumulate pause durations', () => {
            mockPerformanceNow.mockReturnValue(1000);
            timer.start();
            
            // First pause
            mockPerformanceNow.mockReturnValue(2000);
            timer.pause();
            mockPerformanceNow.mockReturnValue(3000);
            timer.resume();
            
            // Second pause
            mockPerformanceNow.mockReturnValue(4000);
            timer.pause();
            mockPerformanceNow.mockReturnValue(5500);
            timer.resume();
            
            expect(timer.totalPausedDuration).toBe(2500); // 1000 + 1500
        });
    });

    describe('stop', () => {
        it('should stop the timer', () => {
            mockPerformanceNow.mockReturnValue(1000);
            timer.start();
            
            timer.stop();
            
            expect(timer.isRunning).toBe(false);
            expect(timer.isPaused).toBe(false);
        });

        it('should not affect stopped timer', () => {
            timer.stop();
            
            expect(timer.isRunning).toBe(false);
        });
    });

    describe('getElapsedTime', () => {
        it('should return 0 if not running', () => {
            expect(timer.getElapsedTime()).toBe(0);
        });

        it('should calculate elapsed time correctly', () => {
            mockPerformanceNow.mockReturnValue(1000);
            timer.start();
            
            mockPerformanceNow.mockReturnValue(3000);
            
            expect(timer.getElapsedTime()).toBe(2000);
        });

        it('should exclude paused time', () => {
            mockPerformanceNow.mockReturnValue(1000);
            timer.start();
            
            mockPerformanceNow.mockReturnValue(2000);
            timer.pause();
            
            mockPerformanceNow.mockReturnValue(4000);
            timer.resume();
            
            mockPerformanceNow.mockReturnValue(5000);
            
            expect(timer.getElapsedTime()).toBe(2000); // 5000 - 1000 - 2000 (pause duration)
        });

        it('should handle current pause state', () => {
            mockPerformanceNow.mockReturnValue(1000);
            timer.start();
            
            mockPerformanceNow.mockReturnValue(3000);
            timer.pause();
            
            mockPerformanceNow.mockReturnValue(5000);
            
            expect(timer.getElapsedTime()).toBe(2000); // Should not include current pause time
        });

        it('should never return negative time', () => {
            mockPerformanceNow.mockReturnValue(1000);
            timer.start();
            
            // Simulate clock going backwards
            mockPerformanceNow.mockReturnValue(500);
            
            expect(timer.getElapsedTime()).toBe(0);
        });
    });

    describe('formatTime', () => {
        it('should format time correctly', () => {
            expect(timer.formatTime(0)).toBe('00:00.00');
            expect(timer.formatTime(1000)).toBe('00:01.00');
            expect(timer.formatTime(1500)).toBe('00:01.50');
            expect(timer.formatTime(60000)).toBe('01:00.00');
            expect(timer.formatTime(61500)).toBe('01:01.50');
            expect(timer.formatTime(3661500)).toBe('61:01.50');
        });

        it('should handle edge cases', () => {
            expect(timer.formatTime(-1000)).toBe('00:00.00');
            expect(timer.formatTime(NaN)).toBe('00:00.00');
            expect(timer.formatTime(Infinity)).toBe('00:00.00');
            expect(timer.formatTime('invalid')).toBe('00:00.00');
        });

        it('should cap at maximum display time', () => {
            const maxTime = 5999990; // 99:59.99
            expect(timer.formatTime(maxTime + 1000)).toBe('99:59.99');
        });

        it('should handle millisecond precision', () => {
            expect(timer.formatTime(1001)).toBe('00:01.00');
            expect(timer.formatTime(1010)).toBe('00:01.01');
            expect(timer.formatTime(1100)).toBe('00:01.10');
            expect(timer.formatTime(1990)).toBe('00:01.99');
        });
    });

    describe('getCurrentFormattedTime', () => {
        it('should return formatted current time', () => {
            mockPerformanceNow.mockReturnValue(1000);
            timer.start();
            
            mockPerformanceNow.mockReturnValue(2500);
            
            expect(timer.getCurrentFormattedTime()).toBe('00:01.50');
        });
    });

    describe('reset', () => {
        it('should reset timer to initial state', () => {
            mockPerformanceNow.mockReturnValue(1000);
            timer.start();
            timer.pause();
            
            timer.reset();
            
            expect(timer.startTime).toBeNull();
            expect(timer.pausedTime).toBe(0);
            expect(timer.totalPausedDuration).toBe(0);
            expect(timer.isPaused).toBe(false);
            expect(timer.isRunning).toBe(false);
        });
    });

    describe('getState', () => {
        it('should return current timer state', () => {
            mockPerformanceNow.mockReturnValue(1000);
            timer.start();
            
            mockPerformanceNow.mockReturnValue(2000);
            
            const state = timer.getState();
            
            expect(state).toEqual({
                startTime: 1000,
                pausedTime: 0,
                totalPausedDuration: 0,
                isPaused: false,
                isRunning: true,
                elapsedTime: 1000
            });
        });
    });

    describe('performance.now() integration', () => {
        it('should work with real performance.now()', () => {
            // Restore real performance.now for this test
            const realPerformanceNow = originalPerformanceNow;
            global.performance = { now: realPerformanceNow };
            
            const realTimer = new SurvivalTimer();
            const startTime = performance.now();
            
            realTimer.start();
            
            // Small delay to ensure time passes
            const endTime = performance.now();
            const elapsed = realTimer.getElapsedTime();
            
            expect(elapsed).toBeGreaterThanOrEqual(0);
            expect(elapsed).toBeLessThan(endTime - startTime + 100); // Allow some tolerance
            
            // Restore mock for other tests
            global.performance = { now: mockPerformanceNow };
        });
    });
});