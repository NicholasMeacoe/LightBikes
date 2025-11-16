const { Game } = require('./game.js');
const { GameModes } = require('./GameModes.js');
const { SurvivalTimer } = require('./SurvivalTimer.js');
const { CountdownTimer } = require('./CountdownTimer.js');
const { TimerDisplay } = require('./TimerDisplay.js');

// Mock ScorePersistence to ensure consistent test behavior
jest.mock('./scorePersistence.js', () => ({
    ScorePersistence: {
        loadHighScore: jest.fn(() => 0),
        saveHighScore: jest.fn(() => true)
    }
}));

// Mock performance.now for consistent timing tests
const mockPerformanceNow = jest.fn();
global.performance = { now: mockPerformanceNow };

// Mock DOM for UI components
const mockElement = {
    remove: jest.fn(),
    classList: { add: jest.fn(), remove: jest.fn() },
    style: { display: '' },
    textContent: ''
};

global.document = {
    createElement: jest.fn(() => mockElement),
    body: { appendChild: jest.fn() },
    head: { appendChild: jest.fn() },
    getElementById: jest.fn(() => null)
};

global.setTimeout = jest.fn();
global.clearTimeout = jest.fn();

describe('Time Trial Mode Integration', () => {
    let classicGame;
    let timeTrialGame;

    beforeEach(() => {
        jest.clearAllMocks();
        mockPerformanceNow.mockReturnValue(0);
        
        classicGame = new Game(GameModes.CLASSIC);
        timeTrialGame = new Game(GameModes.TIME_TRIAL);
    });

    describe('Game Mode Initialization', () => {
        it('should initialize Classic mode correctly', () => {
            expect(classicGame.gameMode).toBe(GameModes.CLASSIC);
            expect(classicGame.survivalTimer).toBeNull();
            expect(classicGame.ai).toMatchObject({ x: 0, y: 0, z: -10 });
            expect(classicGame.aiDirection).toEqual({ x: 1, y: 0, z: 0 });
        });

        it('should initialize Time Trial mode correctly', () => {
            expect(timeTrialGame.gameMode).toBe(GameModes.TIME_TRIAL);
            expect(timeTrialGame.survivalTimer).toBeInstanceOf(SurvivalTimer);
            expect(timeTrialGame.ai).toBeNull();
            expect(timeTrialGame.aiDirection).toBeNull();
            expect(timeTrialGame.aiTrail).toEqual([]);
        });

        it('should default to Classic mode when no mode specified', () => {
            const defaultGame = new Game();
            expect(defaultGame.gameMode).toBe(GameModes.CLASSIC);
            expect(defaultGame.survivalTimer).toBeNull();
        });
    });

    describe('Game State Differences', () => {
        it('should include AI state in Classic mode', () => {
            const classicState = classicGame.getGameState();
            
            expect(classicState.ai).toBeDefined();
            expect(classicState.aiDirection).toBeDefined();
            expect(classicState.aiTrail).toBeDefined();
            expect(classicState.survivalTime).toBeUndefined();
            expect(classicState.formattedSurvivalTime).toBeUndefined();
        });

        it('should exclude AI state in Time Trial mode', () => {
            const timeTrialState = timeTrialGame.getGameState();
            
            expect(timeTrialState.ai).toBeNull();
            expect(timeTrialState.aiDirection).toBeNull();
            expect(timeTrialState.aiTrail).toEqual([]);
            expect(timeTrialState.survivalTime).toBeDefined();
            expect(timeTrialState.formattedSurvivalTime).toBeDefined();
        });

        it('should include timer state in Time Trial mode', () => {
            const timeTrialState = timeTrialGame.getGameState();
            
            expect(timeTrialState.survivalTime).toBe(0);
            expect(timeTrialState.formattedSurvivalTime).toBe('00:00.00');
            expect(timeTrialState.timerRunning).toBe(false);
        });
    });

    describe('Game Update Behavior', () => {
        it('should update both player and AI in Classic mode', () => {
            classicGame.update();
            
            expect(classicGame.player.x).toBeCloseTo(0.1);
            expect(classicGame.ai.x).toBeCloseTo(0.1);
            expect(classicGame.playerTrail).toHaveLength(1);
            expect(classicGame.aiTrail).toHaveLength(1);
        });

        it('should update only player in Time Trial mode', () => {
            timeTrialGame.update();
            
            expect(timeTrialGame.player.x).toBeCloseTo(0.1);
            expect(timeTrialGame.ai).toBeNull();
            expect(timeTrialGame.playerTrail).toHaveLength(1);
            expect(timeTrialGame.aiTrail).toHaveLength(0);
        });

        it('should start survival timer on first update in Time Trial mode', () => {
            mockPerformanceNow.mockReturnValue(1000);
            
            timeTrialGame.update();
            
            const state = timeTrialGame.getGameState();
            expect(state.gameStarted).toBe(true);
            expect(state.timerRunning).toBe(true);
        });

        it('should not start survival timer in Classic mode', () => {
            classicGame.update();
            
            const state = classicGame.getGameState();
            expect(state.gameStarted).toBe(true);
            expect(state.survivalTime).toBeUndefined();
        });
    });

    describe('Pause/Resume Integration', () => {
        it('should pause survival timer in Time Trial mode', () => {
            mockPerformanceNow.mockReturnValue(1000);
            timeTrialGame.update(); // Start timer
            
            mockPerformanceNow.mockReturnValue(2000);
            timeTrialGame.pause();
            
            const timerState = timeTrialGame.survivalTimer.getState();
            expect(timerState.isPaused).toBe(true);
            expect(timeTrialGame.isPaused).toBe(true);
        });

        it('should resume survival timer in Time Trial mode', () => {
            mockPerformanceNow.mockReturnValue(1000);
            timeTrialGame.update(); // Start timer
            timeTrialGame.pause();
            
            mockPerformanceNow.mockReturnValue(3000);
            timeTrialGame.resume();
            
            const timerState = timeTrialGame.survivalTimer.getState();
            expect(timerState.isPaused).toBe(false);
            expect(timeTrialGame.isPaused).toBe(false);
        });

        it('should not affect timer in Classic mode pause/resume', () => {
            classicGame.pause();
            expect(classicGame.isPaused).toBe(true);
            
            classicGame.resume();
            expect(classicGame.isPaused).toBe(false);
            
            // Should not throw errors
            expect(() => classicGame.pause()).not.toThrow();
            expect(() => classicGame.resume()).not.toThrow();
        });
    });

    describe('Game End Handling', () => {
        it('should stop survival timer when Time Trial game ends', () => {
            mockPerformanceNow.mockReturnValue(1000);
            timeTrialGame.update(); // Start timer
            
            mockPerformanceNow.mockReturnValue(5000);
            const collisionResult = { playerCollided: true, aiCollided: false };
            timeTrialGame.handleRoundEnd(collisionResult);
            
            const timerState = timeTrialGame.survivalTimer.getState();
            expect(timerState.isRunning).toBe(false);
        });

        it('should not update scores in Time Trial mode', () => {
            const initialState = timeTrialGame.getGameState();
            const collisionResult = { playerCollided: true, aiCollided: false };
            
            timeTrialGame.handleRoundEnd(collisionResult);
            
            const finalState = timeTrialGame.getGameState();
            expect(finalState.playerScore).toBe(initialState.playerScore);
            expect(finalState.aiScore).toBe(initialState.aiScore);
        });

        it('should update scores normally in Classic mode', () => {
            const collisionResult = { playerCollided: false, aiCollided: true };
            
            classicGame.handleRoundEnd(collisionResult);
            
            const state = classicGame.getGameState();
            expect(state.playerScore).toBe(1);
            expect(state.aiScore).toBe(0);
        });
    });

    describe('Timer Methods', () => {
        it('should provide survival time methods for Time Trial mode', () => {
            mockPerformanceNow.mockReturnValue(1000);
            timeTrialGame.update(); // Start timer
            
            mockPerformanceNow.mockReturnValue(3500);
            
            expect(timeTrialGame.getSurvivalTime()).toBe(2500);
            expect(timeTrialGame.getFormattedSurvivalTime()).toBe('00:02.50');
            expect(timeTrialGame.isTimeTrialMode()).toBe(true);
        });

        it('should return default values for Classic mode timer methods', () => {
            expect(classicGame.getSurvivalTime()).toBe(0);
            expect(classicGame.getFormattedSurvivalTime()).toBe('00:00.00');
            expect(classicGame.isTimeTrialMode()).toBe(false);
        });

        it('should allow manual timer control in Time Trial mode', () => {
            timeTrialGame.startSurvivalTimer();
            expect(timeTrialGame.survivalTimer.isRunning).toBe(true);
            
            timeTrialGame.stopSurvivalTimer();
            expect(timeTrialGame.survivalTimer.isRunning).toBe(false);
        });

        it('should handle timer methods gracefully in Classic mode', () => {
            expect(() => classicGame.startSurvivalTimer()).not.toThrow();
            expect(() => classicGame.stopSurvivalTimer()).not.toThrow();
        });
    });

    describe('Game Restart Behavior', () => {
        it('should reset timer in Time Trial mode restart', () => {
            mockPerformanceNow.mockReturnValue(1000);
            timeTrialGame.update(); // Start timer
            
            mockPerformanceNow.mockReturnValue(3000);
            timeTrialGame.restart();
            
            const state = timeTrialGame.getGameState();
            expect(state.survivalTime).toBe(0);
            expect(state.formattedSurvivalTime).toBe('00:00.00');
            expect(state.timerRunning).toBe(false);
        });

        it('should maintain mode after restart', () => {
            timeTrialGame.restart();
            expect(timeTrialGame.gameMode).toBe(GameModes.TIME_TRIAL);
            expect(timeTrialGame.survivalTimer).toBeInstanceOf(SurvivalTimer);
            
            classicGame.restart();
            expect(classicGame.gameMode).toBe(GameModes.CLASSIC);
            expect(classicGame.survivalTimer).toBeNull();
        });
    });
});

describe('CountdownTimer Integration', () => {
    let countdown;
    let mockCallback;

    beforeEach(() => {
        jest.clearAllMocks();
        countdown = new CountdownTimer();
        mockCallback = jest.fn();
    });

    describe('Countdown Sequence Timing', () => {
        it('should execute complete countdown sequence', () => {
            countdown.start(mockCallback);
            
            // Verify initial state
            expect(countdown.isActive()).toBe(true);
            expect(countdown.currentCount).toBe(0);
            
            // Simulate timeout progression
            let timeoutCallback = global.setTimeout.mock.calls[0][0];
            timeoutCallback(); // Move to count 1
            
            expect(countdown.currentCount).toBe(1);
            
            timeoutCallback = global.setTimeout.mock.calls[1][0];
            timeoutCallback(); // Move to count 2
            
            expect(countdown.currentCount).toBe(2);
            
            timeoutCallback = global.setTimeout.mock.calls[2][0];
            timeoutCallback(); // Move to count 3
            
            expect(countdown.currentCount).toBe(3);
            
            timeoutCallback = global.setTimeout.mock.calls[3][0];
            timeoutCallback(); // Complete countdown
            
            expect(countdown.isActive()).toBe(false);
            expect(mockCallback).toHaveBeenCalled();
        });

        it('should use correct timing for each step', () => {
            countdown.start(mockCallback);
            
            const timeoutCalls = global.setTimeout.mock.calls;
            
            // Check durations match sequence configuration
            expect(timeoutCalls[0][1]).toBe(1000); // '3'
            
            // Simulate progression to check subsequent timings
            timeoutCalls[0][0](); // Execute first timeout
            expect(timeoutCalls[1][1]).toBe(1000); // '2'
            
            timeoutCalls[1][0](); // Execute second timeout
            expect(timeoutCalls[2][1]).toBe(1000); // '1'
            
            timeoutCalls[2][0](); // Execute third timeout
            expect(timeoutCalls[3][1]).toBe(500); // 'GO!'
        });
    });

    describe('Game Start Integration', () => {
        it('should integrate with game start sequence', () => {
            const game = new Game(GameModes.TIME_TRIAL);
            let gameStarted = false;
            
            const startGame = () => {
                gameStarted = true;
                game.update(); // This should start the survival timer
            };
            
            countdown.start(startGame);
            
            // Complete countdown
            const finalTimeout = global.setTimeout.mock.calls[0][0];
            countdown.currentCount = 4; // Force completion
            finalTimeout();
            
            expect(gameStarted).toBe(true);
            expect(mockCallback).not.toHaveBeenCalled(); // Different callback
        });
    });

    describe('Error Handling', () => {
        it('should handle stop during countdown', () => {
            countdown.start(mockCallback);
            
            expect(countdown.isActive()).toBe(true);
            
            countdown.stop();
            
            expect(countdown.isActive()).toBe(false);
            expect(global.clearTimeout).toHaveBeenCalled();
        });

        it('should handle multiple start attempts', () => {
            countdown.start(mockCallback);
            const firstCallCount = global.document.createElement.mock.calls.length;
            
            countdown.start(jest.fn());
            
            expect(global.document.createElement).toHaveBeenCalledTimes(firstCallCount);
        });
    });
});

describe('TimerDisplay Integration', () => {
    let timerDisplay;
    let timeTrialGame;

    beforeEach(() => {
        jest.clearAllMocks();
        mockPerformanceNow.mockReturnValue(0);
        
        timerDisplay = new TimerDisplay();
        timeTrialGame = new Game(GameModes.TIME_TRIAL);
    });

    describe('Mode-Based Display', () => {
        it('should show timer in Time Trial mode', () => {
            const gameState = timeTrialGame.getGameState();
            
            timerDisplay.update(gameState);
            
            expect(timerDisplay.isShowing()).toBe(true);
            expect(global.document.createElement).toHaveBeenCalledWith('div');
        });

        it('should hide timer in Classic mode', () => {
            const classicGame = new Game(GameModes.CLASSIC);
            const gameState = classicGame.getGameState();
            
            timerDisplay.show(); // Manually show first
            timerDisplay.update(gameState);
            
            expect(timerDisplay.isShowing()).toBe(false);
        });
    });

    describe('Real-time Updates', () => {
        it('should update display with game timer', () => {
            mockPerformanceNow.mockReturnValue(1000);
            timeTrialGame.update(); // Start timer
            
            mockPerformanceNow.mockReturnValue(3500);
            const gameState = timeTrialGame.getGameState();
            
            timerDisplay.update(gameState);
            
            expect(timerDisplay.getCurrentDisplayedTime()).toBe('00:02.50');
        });

        it('should show paused state when game is paused', () => {
            mockPerformanceNow.mockReturnValue(1000);
            timeTrialGame.update(); // Start timer
            timeTrialGame.pause();
            
            const gameState = timeTrialGame.getGameState();
            timerDisplay.update(gameState);
            
            expect(mockElement.classList.add).toHaveBeenCalledWith('paused');
        });

        it('should hide paused state when game resumes', () => {
            mockPerformanceNow.mockReturnValue(1000);
            timeTrialGame.update(); // Start timer
            timeTrialGame.pause();
            timeTrialGame.resume();
            
            const gameState = timeTrialGame.getGameState();
            timerDisplay.update(gameState);
            
            expect(mockElement.classList.remove).toHaveBeenCalledWith('paused');
        });
    });

    describe('Performance Optimization', () => {
        it('should only update DOM when time changes', () => {
            const gameState = timeTrialGame.getGameState();
            
            timerDisplay.update(gameState);
            timerDisplay.update(gameState); // Same state
            
            // Should only set textContent once
            expect(mockElement.textContent).toBe('00:00.00');
        });
    });

    describe('Cleanup', () => {
        it('should cleanup resources on destroy', () => {
            timerDisplay.show();
            timerDisplay.destroy();
            
            expect(mockElement.remove).toHaveBeenCalled();
            expect(timerDisplay.isShowing()).toBe(false);
        });
    });
});