/**
 * Integration Tests for Time Trial Mode
 */

const { Game } = require('@/core/game.js');
const { GameModes } = require('@/systems/GameModes.js');
const { SurvivalTimer } = require('@/ui/SurvivalTimer.js');
const { CountdownTimer } = require('@/ui/CountdownTimer.js');
const { TimerDisplay } = require('@/ui/TimerDisplay.js');

describe('Time Trial Mode Integration', () => {
    let classicGame;
    let timeTrialGame;
    let currentTime = 0;
    let performanceNowSpy;

    beforeEach(() => {
        currentTime = 0;
        performanceNowSpy = jest.spyOn(performance, 'now').mockImplementation(() => currentTime);

        classicGame = new Game(GameModes.CLASSIC);
        timeTrialGame = new Game(GameModes.TIME_TRIAL);
        jest.clearAllMocks();
    });

    afterEach(() => {
        performanceNowSpy.mockRestore();
    });

    describe('Game Mode Initialization', () => {
        it('should initialize Time Trial mode correctly', () => {
            expect(timeTrialGame.gameMode).toBe(GameModes.TIME_TRIAL);
            expect(timeTrialGame.survivalTimer).toBeInstanceOf(SurvivalTimer);
            expect(timeTrialGame.ai).toBeNull();
        });
    });

    describe('Timer Methods', () => {
        it('should provide survival time methods for Time Trial mode', () => {
            currentTime = 1000;
            timeTrialGame.update(); // Start timer

            currentTime = 3500;
            expect(timeTrialGame.getSurvivalTime()).toBe(2500);
            expect(timeTrialGame.getFormattedSurvivalTime()).toBe('00:02.50');
        });
    });
});

describe('CountdownTimer Integration', () => {
    let countdown;
    let setTimeoutSpy;
    let clearTimeoutSpy;

    beforeEach(() => {
        setTimeoutSpy = jest.spyOn(global, 'setTimeout');
        clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
        countdown = new CountdownTimer();
        jest.clearAllMocks();
    });

    afterEach(() => {
        setTimeoutSpy.mockRestore();
        clearTimeoutSpy.mockRestore();
    });

    it('should execute complete countdown sequence', () => {
        const callback = jest.fn();
        countdown.start(callback);

        expect(countdown.isActive()).toBe(true);

        // Step through 4 timeouts (3, 2, 1, GO!)
        for (let i = 0; i < 4; i++) {
            const cb = setTimeoutSpy.mock.calls[i][0];
            cb();
        }

        expect(countdown.isActive()).toBe(false);
        expect(callback).toHaveBeenCalled();
    });

    it('should handle stop during countdown', () => {
        countdown.start(jest.fn());
        countdown.stop();
        expect(countdown.isActive()).toBe(false);
        expect(clearTimeoutSpy).toHaveBeenCalled();
    });
});

describe('TimerDisplay Integration', () => {
    let timerDisplay;
    let timeTrialGame;
    let createElementSpy;

    beforeEach(() => {
        createElementSpy = jest.spyOn(document, 'createElement');
        timerDisplay = new TimerDisplay();
        timeTrialGame = new Game(GameModes.TIME_TRIAL);
        jest.clearAllMocks();
    });

    afterEach(() => {
        createElementSpy.mockRestore();
        timerDisplay.destroy();
    });

    it('should show timer in Time Trial mode', () => {
        const gameState = timeTrialGame.getGameState();
        timerDisplay.update(gameState);
        expect(timerDisplay.isShowing()).toBe(true);
        expect(createElementSpy).toHaveBeenCalledWith('div');
    });

    it('should update display with game timer', () => {
        const gameState = {
            gameMode: 'time_trial',
            formattedSurvivalTime: '00:02.50',
            isPaused: false,
        };

        timerDisplay.update(gameState);
        expect(timerDisplay.getCurrentDisplayedTime()).toBe('00:02.50');
    });

    it('should show paused state when game is paused', () => {
        const gameState = {
            gameMode: 'time_trial',
            formattedSurvivalTime: '00:02.50',
            isPaused: true,
        };

        timerDisplay.update(gameState);
        const el = document.getElementById('survival-timer');
        expect(el.classList.contains('paused')).toBe(true);
    });
});
