/**
 * Game Coverage Tests
 * Targeting remaining uncovered lines/branches in src/core/game.js
 */

describe('Game Coverage Extension', () => {
    let Game;
    let GameModes;
    let game;
    let mockArenaShrinkerInstance;
    let mockSurvivalTimerInstance;
    let mockAIControllerInstance;
    let mockScoreManagerInstance;
    let mockPowerUpManager;
    let mockCameraEffectsManager;

    beforeEach(() => {
        jest.resetModules();

        // Setup mock instances
        mockArenaShrinkerInstance = {
            getCurrentBounds: jest
                .fn()
                .mockReturnValue({ minX: -10, maxX: 10, minZ: -10, maxZ: 10, size: 20 }),
            getNextBounds: jest.fn().mockReturnValue(null),
            isWarningActive: jest.fn().mockReturnValue(false),
            isGracePeriodActive: jest.fn().mockReturnValue(false),
            getArenaState: jest.fn().mockReturnValue({}),
            reset: jest.fn(),
            initialize: jest.fn(),
            update: jest.fn(),
            stopSurvivalTracking: jest.fn(),
            getSurvivalStatistics: jest.fn().mockReturnValue({}),
            getArenaSizeHistory: jest.fn().mockReturnValue([]),
            getShrinkCount: jest.fn().mockReturnValue(5),
            setOnWarning: jest.fn(),
            setOnShrink: jest.fn(),
            setOnFinalArena: jest.fn(),
        };

        mockSurvivalTimerInstance = {
            reset: jest.fn(),
            start: jest.fn(),
            pause: jest.fn(),
            resume: jest.fn(),
            stop: jest.fn(),
            getElapsedTime: jest.fn().mockReturnValue(100),
            getCurrentFormattedTime: jest.fn().mockReturnValue('00:10.00'),
            isRunning: true,
        };

        mockAIControllerInstance = {
            initialize: jest.fn(),
            addAI: jest.fn().mockReturnValue(true),
            removeAI: jest.fn().mockReturnValue(true),
            getOpponents: jest.fn().mockReturnValue([]),
            getAliveEntities: jest.fn().mockReturnValue([{ id: 'mockAI', alive: true }]),
            update: jest.fn(),
            setPowerUpManager: jest.fn(),
        };

        mockScoreManagerInstance = {
            getScoreState: jest.fn().mockReturnValue({}),
            incrementPlayerScore: jest.fn(),
            incrementAIScore: jest.fn(),
            resetCurrentScores: jest.fn(),
        };

        mockPowerUpManager = { getSpeedMultiplier: jest.fn().mockReturnValue(1.5) };
        mockCameraEffectsManager = {
            isEnabled: jest.fn().mockReturnValue(true),
            onSpeedChange: jest.fn(),
            pause: jest.fn(),
            resume: jest.fn(),
            reset: jest.fn(),
        };

        // Define mocks BEFORE requiring the module
        jest.mock('../../src/systems/scoreManager.js', () => ({
            ScoreManager: jest.fn().mockImplementation(() => mockScoreManagerInstance),
        }));

        jest.mock('../../src/systems/ArenaShrinker.js', () => ({
            ArenaShrinker: jest.fn().mockImplementation(() => mockArenaShrinkerInstance),
        }));

        jest.mock('../../src/ui/SurvivalTimer.js', () => ({
            SurvivalTimer: jest.fn().mockImplementation(() => mockSurvivalTimerInstance),
        }));

        jest.mock('../../src/core/AIController.js', () => ({
            AIController: jest.fn().mockImplementation(() => mockAIControllerInstance),
        }));

        // Load modules
        const GameModule = require('../../src/core/game.js');
        Game = GameModule.Game;
        const GameModesModule = require('../../src/systems/GameModes.js');
        GameModes = GameModesModule.GameModes;

        game = new Game();
    });

    describe('Mode Switching & Component Initialization', () => {
        it('should transition correctly between all modes', () => {
            // Default is CLASSIC
            expect(game.gameMode).toBe(GameModes.CLASSIC);
            expect(game.survivalTimer).toBeNull();
            expect(game.arenaShrinker).toBeNull();

            // Switch to TIME_TRIAL
            game.setGameMode(GameModes.TIME_TRIAL);
            expect(game.gameMode).toBe(GameModes.TIME_TRIAL);
            expect(game.survivalTimer).toBe(mockSurvivalTimerInstance);
            expect(game.arenaShrinker).toBeNull();

            // Switch to ARENA_SHRINK
            game.setGameMode(GameModes.ARENA_SHRINK);
            expect(game.gameMode).toBe(GameModes.ARENA_SHRINK);
            expect(game.survivalTimer).toBe(mockSurvivalTimerInstance);
            expect(game.arenaShrinker).toBe(mockArenaShrinkerInstance);

            // Switch back to CLASSIC
            game.setGameMode(GameModes.CLASSIC);
            expect(game.survivalTimer).toBeNull();
            expect(game.arenaShrinker).toBeNull();
        });

        it('should handle duplicate SetGameMode calls', () => {
            const spyInIt = jest.spyOn(game, 'init');
            game.setGameMode(GameModes.CLASSIC);
            expect(spyInIt).not.toHaveBeenCalled();
        });

        it('should initialize TIME_TRIAL from constructor', () => {
            const manualGame = new Game(GameModes.TIME_TRIAL);
            expect(manualGame.survivalTimer).toBe(mockSurvivalTimerInstance);
            expect(manualGame.arenaShrinker).toBeNull();
            expect(manualGame.isTimeTrialMode()).toBe(true);
        });

        it('should initialize ARENA_SHRINK from constructor', () => {
            const manualGame = new Game(GameModes.ARENA_SHRINK);
            expect(manualGame.survivalTimer).toBe(mockSurvivalTimerInstance);
            expect(manualGame.arenaShrinker).toBe(mockArenaShrinkerInstance);
            expect(manualGame.isArenaShrinkMode()).toBe(true);
        });
    });

    describe('Boundaries', () => {
        it('should return static bounds for CLASSIC mode', () => {
            game.bounds = 50;
            const bounds = game.getBounds();
            expect(bounds.minX).toBe(-25);
            expect(bounds.maxX).toBe(25);
            expect(bounds.size).toBe(50);
        });

        it('should return dynamic bounds for ARENA_SHRINK mode', () => {
            game.setGameMode(GameModes.ARENA_SHRINK);
            const bounds = game.getBounds();
            expect(bounds.minX).toBe(-10);
            expect(mockArenaShrinkerInstance.getCurrentBounds).toHaveBeenCalled();
        });

        it('should check dynamic bounds correctly', () => {
            expect(game.hasDynamicBounds()).toBe(false);
            game.setGameMode(GameModes.ARENA_SHRINK);
            expect(game.hasDynamicBounds()).toBe(true);
        });

        it('should get next bounds', () => {
            expect(game.getNextBounds()).toBeNull();
            game.setGameMode(GameModes.ARENA_SHRINK);
            const nextB = game.getNextBounds();
            expect(nextB).toBeNull();
            expect(mockArenaShrinkerInstance.getNextBounds).toHaveBeenCalled();
        });

        it('should check boundary warning', () => {
            expect(game.isBoundaryWarningActive()).toBe(false);
            game.setGameMode(GameModes.ARENA_SHRINK);
            expect(game.isBoundaryWarningActive()).toBe(false);
        });

        it('should check grace period', () => {
            expect(game.isGracePeriodActive()).toBe(false);
            game.setGameMode(GameModes.ARENA_SHRINK);
            expect(game.isGracePeriodActive()).toBe(false);
        });
    });

    describe('Dependency Injection', () => {
        it('should set power up manager and propagate to AI', () => {
            game.setPowerUpManager(mockPowerUpManager);
            expect(game.powerUpManager).toBe(mockPowerUpManager);
            expect(mockAIControllerInstance.setPowerUpManager).toHaveBeenCalledWith(
                mockPowerUpManager
            );
        });

        it('should set camera effects manager', () => {
            game.setCameraEffectsManager(mockCameraEffectsManager);
            expect(game.cameraEffectsManager).toBe(mockCameraEffectsManager);
        });

        it('should set callbacks for Arena Shrink events', () => {
            game.setGameMode(GameModes.ARENA_SHRINK);

            const fn1 = jest.fn();
            game.setOnShrinkWarning(fn1);
            expect(mockArenaShrinkerInstance.setOnWarning).toHaveBeenCalledWith(fn1);

            const fn2 = jest.fn();
            game.setOnShrink(fn2);
            expect(mockArenaShrinkerInstance.setOnShrink).toHaveBeenCalledWith(fn2);

            const fn3 = jest.fn();
            game.setOnFinalArena(fn3);
            expect(mockArenaShrinkerInstance.setOnFinalArena).toHaveBeenCalledWith(fn3);
        });
    });

    describe('Entities', () => {
        it('should get alive entities', () => {
            game.player = { x: 10, y: 0, z: 10 };
            const entities = game.getAliveEntities();
            expect(entities.length).toBeGreaterThanOrEqual(1);
            expect(entities[0].id).toBe('player');
            expect(mockAIControllerInstance.getAliveEntities).toHaveBeenCalled();
        });

        it('should validate AI count', () => {
            expect(game.validateAICount(0)).toBe(1);
            expect(game.validateAICount(5)).toBe(1);
            expect(game.validateAICount('s')).toBe(1);
            expect(game.validateAICount(2)).toBe(2);
        });
    });

    describe('Round Handling', () => {
        it('should stop timers on round end for Time Trial', () => {
            game.setGameMode(GameModes.TIME_TRIAL);
            game.handleRoundEnd({ playerCollided: true });
            expect(mockSurvivalTimerInstance.stop).toHaveBeenCalled();
        });

        it('should stop timers and tracking for Arena Shrink', () => {
            game.setGameMode(GameModes.ARENA_SHRINK);
            game.handleRoundEnd({ playerCollided: true });
            expect(mockSurvivalTimerInstance.stop).toHaveBeenCalled();
            expect(mockArenaShrinkerInstance.stopSurvivalTracking).toHaveBeenCalled();
        });

        it('should not throw on missing survival timer when stopping', () => {
            // Force null
            game.survivalTimer = null;
            game.stopSurvivalTimer(); // Safe
            expect(true).toBe(true);
        });
    });

    describe('Helpers', () => {
        it('should set Time Trial mode via legacy helper', () => {
            game.setTimeTrialMode(true);
            expect(game.gameMode).toBe(GameModes.TIME_TRIAL);
            game.setTimeTrialMode(false);
            expect(game.gameMode).toBe(GameModes.CLASSIC);
        });

        it('should get survival time getters', () => {
            expect(game.getSurvivalTime()).toBe(0);
            expect(game.getFormattedSurvivalTime()).toBe('00:00.00');

            game.setGameMode(GameModes.TIME_TRIAL);
            expect(game.getSurvivalTime()).toBe(100);
            expect(game.getFormattedSurvivalTime()).toBe('00:10.00');

            // Check getGameState for Time Trial
            const state = game.getGameState();
            expect(state.aiOpponents).toEqual([]);
            expect(state.ai).toBeNull();
            expect(state.survivalTime).toBe(100);
        });

        it('should manually start survival timer', () => {
            game.setGameMode(GameModes.TIME_TRIAL);
            game.startSurvivalTimer();
            expect(mockSurvivalTimerInstance.start).toHaveBeenCalled();
        });
    });

    describe('Paused State Features', () => {
        it('should pause sub-components correctly', () => {
            game.setGameMode(GameModes.ARENA_SHRINK);
            game.setCameraEffectsManager(mockCameraEffectsManager);

            game.pause();
            expect(game.isPaused).toBe(true);
            expect(mockCameraEffectsManager.pause).toHaveBeenCalled();
            expect(mockSurvivalTimerInstance.pause).toHaveBeenCalled();
        });

        it('should resume sub-components correctly', () => {
            game.setGameMode(GameModes.ARENA_SHRINK);
            game.setCameraEffectsManager(mockCameraEffectsManager);
            game.pause();

            game.resume();
            expect(game.isPaused).toBe(false);
            expect(mockCameraEffectsManager.resume).toHaveBeenCalled();
            expect(mockSurvivalTimerInstance.resume).toHaveBeenCalled();
        });

        it('should init/reset components in init() for Arena Shrink', () => {
            game.setGameMode(GameModes.ARENA_SHRINK);
            game.setCameraEffectsManager(mockCameraEffectsManager);

            game.init();
            expect(mockArenaShrinkerInstance.reset).toHaveBeenCalled();
            // mockSurvivalTimerInstance.reset is NOT called in Arena Shrink by design currently
            expect(mockCameraEffectsManager.reset).toHaveBeenCalled();
        });

        it('should init/reset components in init() for Time Trial', () => {
            game.setGameMode(GameModes.TIME_TRIAL);
            game.init();
            expect(mockSurvivalTimerInstance.reset).toHaveBeenCalled();
        });

        it('should start components in update() on first frame', () => {
            game.setGameMode(GameModes.ARENA_SHRINK);
            expect(game.gameStarted).toBe(false);

            game.update();
            expect(game.gameStarted).toBe(true);
            expect(mockSurvivalTimerInstance.start).toHaveBeenCalled();
            expect(mockArenaShrinkerInstance.initialize).toHaveBeenCalled();
        });
    });
});
