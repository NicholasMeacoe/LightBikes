const { createPerformanceNowMock } = require('../utils/testHelpers.js');

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

describe('SurvivalTimer', () => {
    let timer;
    let mockPerformanceNow;

    beforeEach(() => {
        mockPerformanceNow = createPerformanceNowMock(0);
        global.performance = { now: mockPerformanceNow };

        timer = new SurvivalTimer();
    });

    afterEach(() => {
        delete global.performance;
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
            mockPerformanceNow.setTime(1000);

            timer.start();

            expect(timer.startTime).toBe(1000);
            expect(timer.isRunning).toBe(true);
            expect(timer.isPaused).toBe(false);
            expect(timer.totalPausedDuration).toBe(0);
        });

        it('should not restart if already running', () => {
            mockPerformanceNow.setTime(1000);
            timer.start();

            mockPerformanceNow.setTime(2000);
            timer.start(); // Second start call

            expect(timer.startTime).toBe(1000); // Should not change
        });
    });

    describe('pause', () => {
        it('should pause the timer', () => {
            mockPerformanceNow.setTime(1000);
            timer.start();

            mockPerformanceNow.setTime(2000);
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
            mockPerformanceNow.setTime(1000);
            timer.start();

            mockPerformanceNow.setTime(2000);
            timer.pause();

            mockPerformanceNow.setTime(3000);
            timer.pause(); // Second pause call

            expect(timer.pausedTime).toBe(2000); // Should not change
        });
    });

    describe('resume', () => {
        it('should resume from pause', () => {
            mockPerformanceNow.setTime(1000);
            timer.start();

            mockPerformanceNow.setTime(2000);
            timer.pause();

            mockPerformanceNow.setTime(3000);
            timer.resume();

            expect(timer.isPaused).toBe(false);
            expect(timer.pausedTime).toBe(0);
            expect(timer.totalPausedDuration).toBe(1000); // 3000 - 2000
        });

        it('should not resume if not paused', () => {
            mockPerformanceNow.setTime(1000);
            timer.start();

            timer.resume();

            expect(timer.totalPausedDuration).toBe(0);
        });

        it('should accumulate pause durations', () => {
            mockPerformanceNow.setTime(1000);
            timer.start();

            // First pause
            mockPerformanceNow.setTime(2000);
            timer.pause();
            mockPerformanceNow.setTime(3000);
            timer.resume();

            // Second pause
            mockPerformanceNow.setTime(4000);
            timer.pause();
            mockPerformanceNow.setTime(5500);
            timer.resume();

            expect(timer.totalPausedDuration).toBe(2500); // 1000 + 1500
        });
    });

    describe('stop', () => {
        it('should stop the timer', () => {
            mockPerformanceNow.setTime(1000);
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
            mockPerformanceNow.setTime(1000);
            timer.start();

            mockPerformanceNow.setTime(3000);

            expect(timer.getElapsedTime()).toBe(2000);
        });

        it('should exclude paused time', () => {
            mockPerformanceNow.setTime(1000);
            timer.start();

            mockPerformanceNow.setTime(2000);
            timer.pause();

            mockPerformanceNow.setTime(4000);
            timer.resume();

            mockPerformanceNow.setTime(5000);

            expect(timer.getElapsedTime()).toBe(2000); // 5000 - 1000 - 2000 (pause duration)
        });

        it('should handle current pause state', () => {
            mockPerformanceNow.setTime(1000);
            timer.start();

            mockPerformanceNow.setTime(3000);
            timer.pause();

            mockPerformanceNow.setTime(5000);

            expect(timer.getElapsedTime()).toBe(2000); // Should not include current pause time
        });

        it('should never return negative time', () => {
            mockPerformanceNow.setTime(1000);
            timer.start();

            // Simulate clock going backwards
            mockPerformanceNow.setTime(500);

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
            mockPerformanceNow.setTime(1000);
            timer.start();

            mockPerformanceNow.setTime(2500);

            expect(timer.getCurrentFormattedTime()).toBe('00:01.50');
        });
    });

    describe('reset', () => {
        it('should reset timer to initial state', () => {
            mockPerformanceNow.setTime(1000);
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
            mockPerformanceNow.setTime(1000);
            timer.start();

            mockPerformanceNow.setTime(2000);

            const state = timer.getState();

            expect(state).toEqual({
                startTime: 1000,
                pausedTime: 0,
                totalPausedDuration: 0,
                isPaused: false,
                isRunning: true,
                elapsedTime: 1000,
            });
        });
    });

    describe('performance.now() integration', () => {
        it('should work with real performance.now()', () => {
            // Use a mock that simulates real time progression
            const realMock = createPerformanceNowMock(0);
            global.performance = { now: realMock };

            const realTimer = new SurvivalTimer();
            realMock.setTime(100);

            realTimer.start();

            // Simulate time passing
            realMock.advance(50);
            const elapsed = realTimer.getElapsedTime();

            expect(elapsed).toBeGreaterThanOrEqual(0);
            expect(elapsed).toBeLessThanOrEqual(50);

            // Restore mock for other tests
            global.performance = { now: mockPerformanceNow };
        });
    });
});
