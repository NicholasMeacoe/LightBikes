/**
 * Arena Shrink Mode Integration Tests
 * Tests the integration of Arena Shrink mode with the UI and game systems
 */

const { Game } = require('./game.js');
const { ModeSelector } = require('./ModeSelector.js');
const { GameModes } = require('./GameModes.js');

// Mock DOM environment
const mockDocument = {
    createElement: jest.fn(() => ({
        id: '',
        className: '',
        style: {},
        innerHTML: '',
        textContent: '',
        appendChild: jest.fn(),
        remove: jest.fn(),
        classList: {
            add: jest.fn(),
            remove: jest.fn()
        },
        querySelector: jest.fn(),
        addEventListener: jest.fn()
    })),
    body: {
        appendChild: jest.fn()
    },
    head: {
        appendChild: jest.fn()
    },
    getElementById: jest.fn(() => null),
    querySelectorAll: jest.fn(() => [])
};

const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn()
};

// Setup global mocks
global.document = mockDocument;
global.localStorage = mockLocalStorage;

describe('Arena Shrink Mode Integration', () => {
    let game;
    let modeSelector;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Reset localStorage mock
        mockLocalStorage.getItem.mockReturnValue(null);
        
        game = new Game();
        modeSelector = new ModeSelector(game);
    });

    describe('Mode Selection', () => {
        it('should include Arena Shrink mode in available modes', () => {
            // Test that Arena Shrink mode is defined in GameModes
            expect(GameModes.ARENA_SHRINK).toBe('arena_shrink');
            expect(Object.values(GameModes)).toContain('arena_shrink');
        });

        it('should allow selection of Arena Shrink mode', () => {
            modeSelector.selectMode(GameModes.ARENA_SHRINK);
            
            expect(modeSelector.getSelectedMode()).toBe(GameModes.ARENA_SHRINK);
        });

        it('should persist mode selection state', () => {
            // Test that mode selection is maintained
            expect(modeSelector.getSelectedMode()).toBe(GameModes.CLASSIC); // Default
            
            modeSelector.selectMode(GameModes.ARENA_SHRINK);
            expect(modeSelector.getSelectedMode()).toBe(GameModes.ARENA_SHRINK);
            
            // Test that invalid modes are rejected
            modeSelector.selectMode('invalid_mode');
            expect(modeSelector.getSelectedMode()).toBe(GameModes.ARENA_SHRINK); // Should remain unchanged
        });

        it('should handle mode selector callback system', () => {
            const mockCallback = jest.fn();
            modeSelector.setOnModeSelected(mockCallback);
            
            modeSelector.selectMode(GameModes.ARENA_SHRINK);
            modeSelector.startSelectedMode();
            
            expect(mockCallback).toHaveBeenCalledWith(GameModes.ARENA_SHRINK);
        });

        it('should validate mode selection', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            modeSelector.selectMode('invalid_mode');
            
            expect(consoleSpy).toHaveBeenCalledWith('Invalid game mode:', 'invalid_mode');
            expect(modeSelector.getSelectedMode()).not.toBe('invalid_mode');
            
            consoleSpy.mockRestore();
        });
    });

    describe('Game Mode Integration', () => {
        it('should initialize game in Arena Shrink mode', () => {
            const arenaShrinkGame = new Game(GameModes.ARENA_SHRINK);
            
            expect(arenaShrinkGame.gameMode).toBe(GameModes.ARENA_SHRINK);
            expect(arenaShrinkGame.isArenaShrinkMode()).toBe(true);
            expect(arenaShrinkGame.arenaShrinker).toBeDefined();
            expect(arenaShrinkGame.survivalTimer).toBeDefined();
        });

        it('should provide dynamic boundaries in Arena Shrink mode', () => {
            const arenaShrinkGame = new Game(GameModes.ARENA_SHRINK);
            
            expect(arenaShrinkGame.hasDynamicBounds()).toBe(true);
            
            const bounds = arenaShrinkGame.getBounds();
            expect(bounds).toHaveProperty('minX');
            expect(bounds).toHaveProperty('maxX');
            expect(bounds).toHaveProperty('minZ');
            expect(bounds).toHaveProperty('maxZ');
            expect(bounds).toHaveProperty('size');
        });

        it('should include arena state in game state for Arena Shrink mode', () => {
            const arenaShrinkGame = new Game(GameModes.ARENA_SHRINK);
            arenaShrinkGame.init();
            
            const gameState = arenaShrinkGame.getGameState();
            
            expect(gameState.gameMode).toBe(GameModes.ARENA_SHRINK);
            expect(gameState).toHaveProperty('dynamicBounds');
            expect(gameState).toHaveProperty('survivalTime');
            expect(gameState).toHaveProperty('formattedSurvivalTime');
        });
    });

    describe('Pause and Restart Integration', () => {
        it('should handle pause in Arena Shrink mode', () => {
            const arenaShrinkGame = new Game(GameModes.ARENA_SHRINK);
            arenaShrinkGame.init();
            
            const pauseResult = arenaShrinkGame.pause();
            
            expect(pauseResult).toBe(true);
            expect(arenaShrinkGame.isPaused).toBe(true);
        });

        it('should handle resume in Arena Shrink mode', () => {
            const arenaShrinkGame = new Game(GameModes.ARENA_SHRINK);
            arenaShrinkGame.init();
            arenaShrinkGame.pause();
            
            const resumeResult = arenaShrinkGame.resume();
            
            expect(resumeResult).toBe(true);
            expect(arenaShrinkGame.isPaused).toBe(false);
        });

        it('should handle restart in Arena Shrink mode', () => {
            const arenaShrinkGame = new Game(GameModes.ARENA_SHRINK);
            arenaShrinkGame.init();
            
            // Simulate some game progress
            arenaShrinkGame.gameStarted = true;
            arenaShrinkGame.frameCount = 100;
            
            arenaShrinkGame.restart();
            
            expect(arenaShrinkGame.gameStarted).toBe(false);
            expect(arenaShrinkGame.frameCount).toBe(0);
            expect(arenaShrinkGame.gameOver).toBe(false);
        });
    });

    describe('Mode Switching', () => {
        it('should switch from Classic to Arena Shrink mode', () => {
            const classicGame = new Game(GameModes.CLASSIC);
            expect(classicGame.gameMode).toBe(GameModes.CLASSIC);
            expect(classicGame.arenaShrinker).toBeNull();
            
            classicGame.setGameMode(GameModes.ARENA_SHRINK);
            
            expect(classicGame.gameMode).toBe(GameModes.ARENA_SHRINK);
            expect(classicGame.arenaShrinker).toBeDefined();
            expect(classicGame.survivalTimer).toBeDefined();
        });

        it('should switch from Time Trial to Arena Shrink mode', () => {
            const timeTrialGame = new Game(GameModes.TIME_TRIAL);
            expect(timeTrialGame.gameMode).toBe(GameModes.TIME_TRIAL);
            expect(timeTrialGame.arenaShrinker).toBeNull();
            
            timeTrialGame.setGameMode(GameModes.ARENA_SHRINK);
            
            expect(timeTrialGame.gameMode).toBe(GameModes.ARENA_SHRINK);
            expect(timeTrialGame.arenaShrinker).toBeDefined();
            expect(timeTrialGame.survivalTimer).toBeDefined();
        });

        it('should switch from Arena Shrink to Classic mode', () => {
            const arenaShrinkGame = new Game(GameModes.ARENA_SHRINK);
            expect(arenaShrinkGame.gameMode).toBe(GameModes.ARENA_SHRINK);
            expect(arenaShrinkGame.arenaShrinker).toBeDefined();
            
            arenaShrinkGame.setGameMode(GameModes.CLASSIC);
            
            expect(arenaShrinkGame.gameMode).toBe(GameModes.CLASSIC);
            expect(arenaShrinkGame.arenaShrinker).toBeNull();
            expect(arenaShrinkGame.survivalTimer).toBeNull();
        });
    });

    describe('Game State Management', () => {
        it('should preserve game state integrity during mode switches', () => {
            const testGame = new Game(GameModes.CLASSIC);
            
            // Switch to Arena Shrink mode
            testGame.setGameMode(GameModes.ARENA_SHRINK);
            const gameState1 = testGame.getGameState();
            
            expect(gameState1.gameMode).toBe(GameModes.ARENA_SHRINK);
            expect(gameState1.gameOver).toBe(false);
            expect(gameState1.isPaused).toBe(false);
            
            // Switch back to Classic mode
            testGame.setGameMode(GameModes.CLASSIC);
            const gameState2 = testGame.getGameState();
            
            expect(gameState2.gameMode).toBe(GameModes.CLASSIC);
            expect(gameState2.gameOver).toBe(false);
            expect(gameState2.isPaused).toBe(false);
        });

        it('should handle AI presence correctly in different modes', () => {
            const testGame = new Game(GameModes.CLASSIC);
            
            // Classic mode should have AI
            let gameState = testGame.getGameState();
            expect(gameState.ai).toBeDefined();
            expect(gameState.aiDirection).toBeDefined();
            expect(gameState.aiTrail).toBeDefined();
            
            // Switch to Arena Shrink mode (should still have AI)
            testGame.setGameMode(GameModes.ARENA_SHRINK);
            gameState = testGame.getGameState();
            expect(gameState.ai).toBeDefined();
            expect(gameState.aiDirection).toBeDefined();
            expect(gameState.aiTrail).toBeDefined();
            
            // Switch to Time Trial mode (should not have AI)
            testGame.setGameMode(GameModes.TIME_TRIAL);
            gameState = testGame.getGameState();
            expect(gameState.ai).toBeNull();
            expect(gameState.aiDirection).toBeNull();
            expect(gameState.aiTrail).toEqual([]);
        });
    });

    describe('Boundary System Integration', () => {
        it('should provide static boundaries for Classic mode', () => {
            const classicGame = new Game(GameModes.CLASSIC);
            
            expect(classicGame.hasDynamicBounds()).toBe(false);
            
            const bounds = classicGame.getBounds();
            expect(bounds.size).toBe(30);
            expect(bounds.minX).toBe(-15);
            expect(bounds.maxX).toBe(15);
        });

        it('should provide dynamic boundaries for Arena Shrink mode', () => {
            const arenaShrinkGame = new Game(GameModes.ARENA_SHRINK);
            
            expect(arenaShrinkGame.hasDynamicBounds()).toBe(true);
            
            const bounds = arenaShrinkGame.getBounds();
            expect(bounds).toHaveProperty('size');
            expect(bounds.size).toBeGreaterThanOrEqual(10); // Minimum arena size
            expect(bounds.size).toBeLessThanOrEqual(30); // Maximum arena size
        });

        it('should provide next bounds preview in Arena Shrink mode', () => {
            const arenaShrinkGame = new Game(GameModes.ARENA_SHRINK);
            
            const nextBounds = arenaShrinkGame.getNextBounds();
            expect(nextBounds).toBeDefined();
            expect(nextBounds).toHaveProperty('size');
        });

        it('should return null for next bounds in non-shrink modes', () => {
            const classicGame = new Game(GameModes.CLASSIC);
            const timeTrialGame = new Game(GameModes.TIME_TRIAL);
            
            expect(classicGame.getNextBounds()).toBeNull();
            expect(timeTrialGame.getNextBounds()).toBeNull();
        });
    });

    describe('Complete Shrink Mode Gameplay Scenarios', () => {
        it('should handle complete shrink cycle progression', () => {
            const arenaShrinkGame = new Game(GameModes.ARENA_SHRINK);
            arenaShrinkGame.init();
            
            // Initial state
            expect(arenaShrinkGame.getBounds().size).toBe(30);
            expect(arenaShrinkGame.arenaShrinker.getShrinkCount()).toBe(0);
            
            // Simulate time progression to trigger shrink
            const mockTime = Date.now();
            arenaShrinkGame.arenaShrinker.initialize(mockTime);
            arenaShrinkGame.arenaShrinker.update(mockTime + 5000); // 5 seconds later
            
            // Verify shrink occurred
            expect(arenaShrinkGame.getBounds().size).toBe(28);
            expect(arenaShrinkGame.arenaShrinker.getShrinkCount()).toBe(1);
        });

        it('should integrate warning system with game state', () => {
            const arenaShrinkGame = new Game(GameModes.ARENA_SHRINK);
            arenaShrinkGame.init();
            
            const mockTime = Date.now();
            arenaShrinkGame.arenaShrinker.initialize(mockTime);
            
            // Before warning
            let gameState = arenaShrinkGame.getGameState();
            expect(gameState.arenaState.warningActive).toBe(false);
            
            // During warning period (3 seconds)
            arenaShrinkGame.arenaShrinker.update(mockTime + 3000);
            gameState = arenaShrinkGame.getGameState();
            expect(gameState.arenaState.warningActive).toBe(true);
            
            // After shrink
            arenaShrinkGame.arenaShrinker.update(mockTime + 5000);
            gameState = arenaShrinkGame.getGameState();
            expect(gameState.arenaState.warningActive).toBe(false);
        });

        it('should handle AI vs Player competition in shrinking arena', () => {
            const arenaShrinkGame = new Game(GameModes.ARENA_SHRINK);
            arenaShrinkGame.init();
            
            // Verify AI is present
            const gameState = arenaShrinkGame.getGameState();
            expect(gameState.ai).toBeDefined();
            expect(gameState.aiDirection).toBeDefined();
            
            // Verify AI receives dynamic boundary information
            const bounds = arenaShrinkGame.getBounds();
            expect(bounds).toBeDefined();
            expect(bounds.size).toBe(30);
            
            // Simulate shrink and verify AI still functions
            const mockTime = Date.now();
            arenaShrinkGame.arenaShrinker.initialize(mockTime);
            arenaShrinkGame.arenaShrinker.update(mockTime + 5000);
            
            const newBounds = arenaShrinkGame.getBounds();
            expect(newBounds.size).toBe(28);
            
            // AI should still be functional after shrink
            const newGameState = arenaShrinkGame.getGameState();
            expect(newGameState.ai).toBeDefined();
        });

        it('should handle boundary collision detection throughout shrink cycles', () => {
            const arenaShrinkGame = new Game(GameModes.ARENA_SHRINK);
            arenaShrinkGame.init();
            
            // Test collision detection with initial bounds
            let bounds = arenaShrinkGame.getBounds();
            expect(arenaShrinkGame.arenaShrinker.isWithinBounds({ x: 0, z: 0 })).toBe(true);
            expect(arenaShrinkGame.arenaShrinker.isWithinBounds({ x: 16, z: 0 })).toBe(false);
            
            // Simulate shrink
            const mockTime = Date.now();
            arenaShrinkGame.arenaShrinker.initialize(mockTime);
            arenaShrinkGame.arenaShrinker.update(mockTime + 5000);
            
            // Test collision detection with new bounds
            bounds = arenaShrinkGame.getBounds();
            expect(bounds.size).toBe(28);
            expect(arenaShrinkGame.arenaShrinker.isWithinBounds({ x: 0, z: 0 })).toBe(true);
            expect(arenaShrinkGame.arenaShrinker.isWithinBounds({ x: 15, z: 0 })).toBe(false); // Outside new bounds
        });

        it('should handle grace period during boundary shrinking', () => {
            const arenaShrinkGame = new Game(GameModes.ARENA_SHRINK);
            arenaShrinkGame.init();
            
            const mockTime = Date.now();
            arenaShrinkGame.arenaShrinker.initialize(mockTime);
            
            // Trigger shrink
            arenaShrinkGame.arenaShrinker.update(mockTime + 5000);
            
            // Grace period should be active immediately after shrink
            expect(arenaShrinkGame.arenaShrinker.isGracePeriodActive()).toBe(true);
            
            // Grace period should end after 0.5 seconds
            arenaShrinkGame.arenaShrinker.update(mockTime + 5500);
            expect(arenaShrinkGame.arenaShrinker.isGracePeriodActive()).toBe(false);
        });

        it('should track survival statistics throughout gameplay', () => {
            const arenaShrinkGame = new Game(GameModes.ARENA_SHRINK);
            arenaShrinkGame.init();
            
            const mockTime = Date.now();
            arenaShrinkGame.arenaShrinker.initialize(mockTime);
            
            // Initial statistics
            let stats = arenaShrinkGame.arenaShrinker.getSurvivalStatistics(mockTime);
            expect(stats.survivalTime).toBe(0);
            expect(stats.shrinksSurvived).toBe(0);
            expect(stats.finalArenaSize).toBe(30);
            
            // After some time and shrinks
            arenaShrinkGame.arenaShrinker.update(mockTime + 7000); // 7 seconds, 1 shrink
            stats = arenaShrinkGame.arenaShrinker.getSurvivalStatistics(mockTime + 7000);
            
            expect(stats.survivalTime).toBe(7000);
            expect(stats.shrinksSurvived).toBe(1);
            expect(stats.finalArenaSize).toBe(28);
            expect(stats.arenaSizeHistory).toHaveLength(2); // Initial + 1 shrink
        });

        it('should handle final arena state correctly', () => {
            const arenaShrinkGame = new Game(GameModes.ARENA_SHRINK);
            arenaShrinkGame.init();
            
            const mockTime = Date.now();
            arenaShrinkGame.arenaShrinker.initialize(mockTime);
            
            // Simulate multiple shrinks to reach minimum
            let currentTime = mockTime;
            for (let i = 0; i < 15; i++) {
                currentTime += 5000;
                arenaShrinkGame.arenaShrinker.update(currentTime);
            }
            
            // Should be at minimum size
            expect(arenaShrinkGame.getBounds().size).toBe(10);
            expect(arenaShrinkGame.arenaShrinker.isAtMinimumSize()).toBe(true);
            expect(arenaShrinkGame.arenaShrinker.isActive).toBe(false);
            
            // Further updates should not change size
            currentTime += 5000;
            arenaShrinkGame.arenaShrinker.update(currentTime);
            expect(arenaShrinkGame.getBounds().size).toBe(10);
        });
    });
});