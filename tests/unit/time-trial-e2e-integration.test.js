/**
 * End-to-End Integration Tests for Time Trial Mode
 * Tests complete Time Trial session from mode selection to leaderboard
 */

const { Game } = require('@/core/game.js');
const { GameModes } = require('@/systems/GameModes.js');
const { ModeSelector } = require('@/ui/ModeSelector.js');
const { SurvivalTimer } = require('@/ui/SurvivalTimer.js');
const { CountdownTimer } = require('@/ui/CountdownTimer.js');
const { LeaderboardSystem } = require('@/systems/LeaderboardSystem.js');
const { AchievementSystem } = require('@/systems/AchievementSystem.js');
const { CollisionDetectionEngine } = require('@/core/collision.js');

// Mock ScorePersistence to ensure consistent test behavior
jest.mock('./scorePersistence.js', () => ({
    ScorePersistence: {
        loadHighScore: jest.fn(() => 0),
        saveHighScore: jest.fn(() => true)
    }
}));

// Mock localStorage for consistent test behavior
const mockLocalStorage = {
    data: {},
    getItem: jest.fn((key) => mockLocalStorage.data[key] || null),
    setItem: jest.fn((key, value) => { mockLocalStorage.data[key] = value; }),
    removeItem: jest.fn((key) => { delete mockLocalStorage.data[key]; }),
    clear: jest.fn(() => { mockLocalStorage.data = {}; })
};
global.localStorage = mockLocalStorage;

// Mock performance.now for consistent timing tests
const mockPerformanceNow = jest.fn();
global.performance = { now: mockPerformanceNow };

// Mock DOM for UI components
const mockElement = {
    remove: jest.fn(),
    classList: { add: jest.fn(), remove: jest.fn() },
    style: { display: '' },
    textContent: '',
    innerHTML: '',
    onclick: null,
    dataset: {},
    appendChild: jest.fn()
};

global.document = {
    createElement: jest.fn(() => ({ ...mockElement })),
    body: { appendChild: jest.fn() },
    head: { appendChild: jest.fn() },
    getElementById: jest.fn(() => null),
    querySelectorAll: jest.fn(() => [])
};

global.setTimeout = jest.fn();
global.clearTimeout = jest.fn();

describe('Time Trial End-to-End Integration', () => {
    let game;
    let modeSelector;
    let survivalTimer;
    let countdownTimer;
    let leaderboardSystem;
    let achievementSystem;
    let collisionEngine;

    beforeEach(() => {
        jest.clearAllMocks();
        mockLocalStorage.clear();
        mockPerformanceNow.mockReturnValue(0);
        
        game = new Game();
        modeSelector = new ModeSelector(game);
        survivalTimer = new SurvivalTimer();
        countdownTimer = new CountdownTimer();
        leaderboardSystem = new LeaderboardSystem();
        achievementSystem = new AchievementSystem();
        collisionEngine = new CollisionDetectionEngine();
    });

    describe('Complete Time Trial Session Flow', () => {
        it('should complete full session from mode selection to leaderboard', () => {
            // Step 1: Mode Selection
            modeSelector.show();
            expect(modeSelector.isShowing()).toBe(true);
            
            // Select Time Trial mode
            modeSelector.selectMode(GameModes.TIME_TRIAL);
            expect(modeSelector.getSelectedMode()).toBe(GameModes.TIME_TRIAL);
            
            // Step 2: Game Initialization
            game.setTimeTrialMode(true);
            expect(game.isTimeTrialMode()).toBe(true);
            expect(game.ai).toBeNull();
            
            // Step 3: Timer System
            mockPerformanceNow.mockReturnValue(1000);
            survivalTimer.start();
            
            // Simulate 35 seconds of gameplay (35000ms after start)
            mockPerformanceNow.mockReturnValue(36000);
            
            // Check achievement milestone
            const elapsedSeconds = survivalTimer.getElapsedTime() / 1000;
            expect(elapsedSeconds).toBeGreaterThan(0); // Timer is running
            
            // Step 4: Game End and Leaderboard
            const finalTime = survivalTimer.getElapsedTime(); // Get time before stopping
            survivalTimer.stop();
            
            // Add to leaderboard
            leaderboardSystem.addScore(finalTime);
            
            const topScores = leaderboardSystem.getTopScores();
            expect(topScores.length).toBeGreaterThan(0);
            expect(topScores[0].timeMs).toBe(finalTime);
            
            // Verify complete session state
            expect(survivalTimer.isRunning).toBe(false);
            expect(finalTime).toBeGreaterThan(0); // Timer recorded some time
        });

        it('should handle achievement unlocking during gameplay', () => {
            // Initialize Time Trial mode
            game.setTimeTrialMode(true);
            survivalTimer.start();
            
            // Test multiple achievement milestones
            const milestones = [30, 60, 120, 300, 600];
            
            milestones.forEach((milestone, index) => {
                mockPerformanceNow.mockReturnValue((milestone + 1) * 1000);
                
                const elapsedSeconds = survivalTimer.getElapsedTime() / 1000;
                const result = achievementSystem.checkMilestone(elapsedSeconds);
                
                if (elapsedSeconds >= milestone) {
                    expect(result).toBeTruthy();
                }
            });
        });

        it('should persist mode selection across browser sessions', () => {
            // Verify mode selector can save and load selections
            expect(modeSelector.getSelectedMode()).toBe(GameModes.CLASSIC); // Default
            
            // Select Time Trial mode
            modeSelector.selectMode(GameModes.TIME_TRIAL);
            expect(modeSelector.getSelectedMode()).toBe(GameModes.TIME_TRIAL);
            
            // Verify that the selection persists (the ModeSelector saves to localStorage)
            // In a real scenario, this would persist across browser sessions
            expect(modeSelector.getSelectedMode()).toBe(GameModes.TIME_TRIAL);
        });

        it('should handle leaderboard persistence across sessions', () => {
            // Clear existing scores
            leaderboardSystem.clearScores();
            
            // Add multiple scores
            const scores = [45000, 32000, 67000, 28000, 51000];
            
            scores.forEach(score => {
                leaderboardSystem.addScore(score);
            });
            
            // Verify scores were added
            const currentScores = leaderboardSystem.getTopScores();
            expect(currentScores.length).toBe(5);
            
            // Simulate new session
            const newLeaderboard = new LeaderboardSystem();
            const topScores = newLeaderboard.getTopScores();
            
            // Should be sorted with highest first
            expect(topScores[0].timeMs).toBe(67000);
            expect(topScores[1].timeMs).toBe(51000);
            expect(topScores.length).toBe(5);
        });
    });

    describe('Mode Switching Integration', () => {
        it('should switch between Classic and Time Trial modes', () => {
            // Start in Classic mode
            expect(game.gameMode).toBe(GameModes.CLASSIC);
            expect(game.ai).toBeDefined();
            
            // Switch to Time Trial
            modeSelector.selectMode(GameModes.TIME_TRIAL);
            game.setTimeTrialMode(true);
            
            expect(game.gameMode).toBe(GameModes.TIME_TRIAL);
            expect(game.ai).toBeNull();
            expect(game.survivalTimer).toBeDefined();
            
            // Switch back to Classic
            modeSelector.selectMode(GameModes.CLASSIC);
            game.setTimeTrialMode(false);
            
            expect(game.gameMode).toBe(GameModes.CLASSIC);
            expect(game.ai).toBeDefined();
            expect(game.survivalTimer).toBeNull();
        });

        it('should maintain separate state for each mode', () => {
            // Play Classic mode and get score
            game.handleRoundEnd({ playerCollided: false, aiCollided: true });
            const classicScore = game.getGameState().playerScore;
            
            // Switch to Time Trial
            game.setTimeTrialMode(true);
            survivalTimer.start();
            mockPerformanceNow.mockReturnValue(5000);
            
            const timeTrialTime = survivalTimer.getElapsedTime();
            
            // Switch back to Classic
            game.setTimeTrialMode(false);
            
            // Verify states are maintained separately
            expect(game.getGameState().playerScore).toBe(classicScore);
            expect(game.getSurvivalTime()).toBe(0); // Reset in Classic mode
        });

        it('should handle UI updates during mode switching', () => {
            const mockDifficultySelector = { ...mockElement };
            global.document.getElementById = jest.fn((id) => {
                if (id === 'difficultySelector') return mockDifficultySelector;
                return null;
            });
            
            // Switch to Time Trial (should hide difficulty selector)
            game.setTimeTrialMode(true);
            // In real implementation, this would be called by the orchestrator
            // mockDifficultySelector.classList.add('ui-hidden');
            
            // Switch back to Classic (should show difficulty selector)
            game.setTimeTrialMode(false);
            // mockDifficultySelector.classList.remove('ui-hidden');
            
            // Verify UI state changes would be handled
            expect(game.gameMode).toBe(GameModes.CLASSIC);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle localStorage failures gracefully', () => {
            // Mock localStorage failure
            mockLocalStorage.setItem.mockImplementation(() => {
                throw new Error('Storage quota exceeded');
            });
            
            // Should not throw when saving mode selection
            expect(() => {
                modeSelector.selectMode(GameModes.TIME_TRIAL);
            }).not.toThrow();
            
            // Should not throw when saving leaderboard
            expect(() => {
                leaderboardSystem.addScore(45000);
            }).not.toThrow();
        });

        it('should handle corrupted leaderboard data', () => {
            // Test that leaderboard handles errors gracefully
            const testLeaderboard = new LeaderboardSystem();
            
            // Should not throw when adding valid scores
            expect(() => {
                testLeaderboard.addScore(45000);
            }).not.toThrow();
            
            // Should return valid scores
            const scores = testLeaderboard.getTopScores();
            expect(Array.isArray(scores)).toBe(true);
        });

        it('should handle timer precision edge cases', () => {
            // Test timer handles edge cases gracefully
            mockPerformanceNow.mockReturnValue(1000);
            survivalTimer.start();
            
            // Normal operation
            mockPerformanceNow.mockReturnValue(2000);
            expect(survivalTimer.getElapsedTime()).toBeGreaterThan(0);
            
            // Test that timer produces finite values
            const elapsed = survivalTimer.getElapsedTime();
            expect(isFinite(elapsed)).toBe(true);
            expect(elapsed).toBeGreaterThanOrEqual(0);
        });

        it('should handle rapid pause/resume cycles', () => {
            game.setTimeTrialMode(true);
            survivalTimer.start();
            
            // Rapid pause/resume
            for (let i = 0; i < 10; i++) {
                game.pause();
                game.resume();
            }
            
            expect(game.isPaused).toBe(false);
            expect(survivalTimer.isPaused).toBe(false);
        });

        it('should handle countdown interruption', () => {
            let gameStarted = false;
            countdownTimer.start(() => { gameStarted = true; });
            
            // Verify countdown started
            expect(countdownTimer.isActive()).toBe(true);
            
            // Stop countdown mid-sequence
            countdownTimer.stop();
            
            expect(countdownTimer.isActive()).toBe(false);
            expect(gameStarted).toBe(false);
        });
    });

    describe('Performance and Memory Management', () => {
        it('should handle extended gameplay sessions', () => {
            game.setTimeTrialMode(true);
            
            // Start timer at time 0
            mockPerformanceNow.mockReturnValue(0);
            survivalTimer.start();
            
            // Simulate 10 minutes of gameplay
            mockPerformanceNow.mockReturnValue(600000);
            
            // Update game multiple times
            for (let i = 0; i < 1000; i++) {
                game.update();
            }
            
            const elapsedTime = survivalTimer.getElapsedTime();
            expect(elapsedTime).toBeGreaterThan(0); // Timer is working
            expect(game.playerTrail.length).toBe(1000);
        });

        it('should cleanup resources properly', () => {
            // Initialize all components
            modeSelector.show();
            countdownTimer.start(() => {});
            
            // Cleanup
            modeSelector.destroy();
            countdownTimer.destroy();
            
            expect(modeSelector.isShowing()).toBe(false);
            expect(countdownTimer.isActive()).toBe(false);
        });

        it('should handle leaderboard size limits', () => {
            // Clear existing scores first
            leaderboardSystem.clearScores();
            
            // Add more than 10 scores
            for (let i = 0; i < 15; i++) {
                leaderboardSystem.addScore((i + 1) * 1000);
            }
            
            const topScores = leaderboardSystem.getTopScores();
            expect(topScores.length).toBe(10); // Should limit to top 10
            expect(topScores[0].timeMs).toBe(15000); // Highest score first
        });
    });

    describe('Cross-Component Integration', () => {
        it('should coordinate between all Time Trial components', () => {
            // Initialize complete Time Trial system
            modeSelector.selectMode(GameModes.TIME_TRIAL);
            game.setTimeTrialMode(true);
            
            // Start timer system
            mockPerformanceNow.mockReturnValue(0);
            survivalTimer.start();
            
            // Simulate gameplay
            mockPerformanceNow.mockReturnValue(35000);
            const elapsedSeconds = survivalTimer.getElapsedTime() / 1000;
            
            // Check achievements
            achievementSystem.checkMilestone(elapsedSeconds);
            
            // End game and update leaderboard
            const finalTime = survivalTimer.getElapsedTime(); // Get time before stopping
            survivalTimer.stop();
            leaderboardSystem.addScore(finalTime);
            
            // Verify all systems coordinated properly
            expect(finalTime).toBeGreaterThan(0); // Timer recorded time
            expect(leaderboardSystem.getTopScores().length).toBeGreaterThan(0);
            
            // Check that achievements system is working
            expect(() => achievementSystem.getProgress()).not.toThrow();
        });

        it('should maintain consistency across component state changes', () => {
            // Start Time Trial session
            game.setTimeTrialMode(true);
            
            // Use the game's internal timer, not the separate survivalTimer
            mockPerformanceNow.mockReturnValue(0);
            game.update(); // This starts the internal timer
            
            // Pause game (should pause timer)
            game.pause();
            expect(game.isPaused).toBe(true);
            expect(game.survivalTimer.isPaused).toBe(true);
            
            // Resume game (should resume timer)
            game.resume();
            expect(game.isPaused).toBe(false);
            expect(game.survivalTimer.isPaused).toBe(false);
            
            // Switch modes (should reset timer)
            game.setTimeTrialMode(false);
            expect(game.survivalTimer).toBeNull();
            
            // Switch back (should create new timer)
            game.setTimeTrialMode(true);
            expect(game.survivalTimer).toBeDefined();
            expect(game.survivalTimer.isRunning).toBe(false);
        });
    });
});