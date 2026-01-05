const { GameLoop } = require('../../src/game-loop/GameLoop.js');
const { GameModes } = require('../../src/systems/GameModes.js');
const { Logger } = require('../../src/utils/Logger.js');

// Mock Logger
jest.mock('../../src/utils/Logger.js', () => ({
    Logger: {
        create: jest.fn().mockReturnValue({
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
        }),
    },
}));

describe('GameLoop Coverage', () => {
    let gameLoop;
    let mockDependencies;
    let mockGame;
    let mockRenderingEngine;
    let mockRecoveryManager;
    let mockUIManager;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();

        // Setup base mocks
        mockGame = {
            getGameState: jest.fn().mockReturnValue({
                isPaused: false,
                gameStarted: true,
                gameOver: false,
                player: { id: 'p1', alive: true },
                aiOpponents: [],
            }),
            update: jest.fn(),
            handleRoundEnd: jest.fn(),
            gameOver: false,
            getAliveEntities: jest.fn().mockReturnValue([{ id: 'p1' }]),
        };

        mockRenderingEngine = {
            draw: jest.fn(),
            createExplosionEffect: jest.fn(),
            renderer: { render: jest.fn() },
            scene: {},
            camera: {},
        };

        mockRecoveryManager = {
            isFeatureDisabled: jest.fn().mockReturnValue(false),
            handleFeatureRuntimeError: jest.fn().mockImplementation((name, err, cb) => {
                if (cb) cb();
            }),
            handleRenderingError: jest.fn().mockImplementation((err, cb) => {
                if (cb) cb();
                return true;
            }),
        };

        mockUIManager = {
            showGameOver: jest.fn(),
        };

        mockDependencies = {
            game: mockGame,
            renderingEngine: mockRenderingEngine,
            performanceMonitor: {
                startFrameMonitoring: jest.fn(),
                getLastFrameTime: jest.fn().mockReturnValue(16),
                update: jest.fn(),
                startCollisionDetection: jest.fn(),
                endCollisionDetection: jest.fn(),
            },
            performanceDegradationManager: { update: jest.fn() },
            glowEffectManager: { update: jest.fn(), render: jest.fn() },
            cameraEffectsManager: {
                update: jest.fn(),
                isEnabled: jest.fn().mockReturnValue(true),
                onCollision: jest.fn(),
                pause: jest.fn(),
                resume: jest.fn(),
            },
            powerUpManager: {
                update: jest.fn(),
                checkCollections: jest.fn(),
                getAllActiveEffects: jest.fn().mockReturnValue([]),
            },
            statusIndicator: { updateStatus: jest.fn(), updateTimers: jest.fn() },
            audioManager: {
                handleGameStart: jest.fn(),
                playExplosionSound: jest.fn(),
                playVictorySound: jest.fn(),
                playDefeatSound: jest.fn(),
                handleGameEnd: jest.fn(),
                handleGamePause: jest.fn(),
                handleGameResume: jest.fn(),
            },
            scoreDisplay: { updateGameplayScores: jest.fn() },
            survivalTimer: {
                getElapsedTime: jest.fn().mockReturnValue(1000),
                stop: jest.fn(),
                pause: jest.fn(),
                resume: jest.fn(),
            },
            leaderboardSystem: {
                isNewRecord: jest.fn().mockReturnValue(false),
                addScore: jest.fn(),
            },
            achievementSystem: { checkMilestone: jest.fn() },
            localScoringUI: { updateScores: jest.fn() },
            splitScreenCamera: { update: jest.fn() },
            collisionDetectionEngine: {
                checkCollisions: jest
                    .fn()
                    .mockReturnValue({ playerCollided: false, aiCollided: false }),
            },
            playerCollisionHandler: {
                checkMultiplayerCollisions: jest
                    .fn()
                    .mockReturnValue({ player1Collided: false, player2Collided: false }),
            },
            recoveryManager: mockRecoveryManager,
            uiManager: mockUIManager,
            gameOverUI: {},
            modeUI: {
                updateTimeTrialDisplay: jest.fn(),
                updateArenaShrinkDisplay: jest.fn(),
                updateRemainingEntityDisplay: jest.fn(),
            },
            aiCoordinator: {},
            difficultyManager: { getDifficultyConfig: jest.fn().mockReturnValue({}) },

            // UI Update Functions
            updatePauseOverlay: jest.fn(),
            updateTimeTrialDisplay: jest.fn(),
            updateArenaShrinkDisplay: jest.fn(),
            updateRemainingEntityDisplay: jest.fn(),
            showMultiplayerGameOver: jest.fn(),
            showTimeTrialGameOver: jest.fn(),
            showArenaShrinkGameOver: jest.fn(),
            showMultiAIGameOver: jest.fn(),
            calculateMultiAIDirections: jest.fn().mockReturnValue([]),
            applyAIDecisions: jest.fn(),
            handleMultiAICollisions: jest.fn(),

            currentGameMode: GameModes.CLASSIC,
        };

        // DOM mocks
        global.document.getElementById = jest.fn().mockReturnValue({ style: {} });
        global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));
        global.cancelAnimationFrame = jest.fn();

        gameLoop = new GameLoop(mockDependencies);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('Initialization & State control', () => {
        it('should initialize with correct dependencies', () => {
            expect(gameLoop.game).toBe(mockGame);
            expect(gameLoop.running).toBe(false);
        });

        it('should start and stop the loop', () => {
            const animateSpy = jest.spyOn(gameLoop, 'animate');
            gameLoop.start();
            expect(gameLoop.running).toBe(true);
            expect(animateSpy).toHaveBeenCalled();

            gameLoop.stop();
            expect(gameLoop.running).toBe(false);
            expect(cancelAnimationFrame).toHaveBeenCalled();
        });

        it('should not start if already running', () => {
            gameLoop.start();
            const animateSpy = jest.spyOn(gameLoop, 'animate');
            gameLoop.start();
            expect(animateSpy).not.toHaveBeenCalled();
        });

        it('should perform mode switching', () => {
            gameLoop.setMode(GameModes.TIME_TRIAL, true);
            expect(gameLoop.currentGameMode).toBe(GameModes.TIME_TRIAL);
            expect(gameLoop.isTimeTrialActive).toBe(true);
        });
    });

    describe('Animation Loop & Updates', () => {
        it('should run update cycle', () => {
            gameLoop.start();
            jest.runOnlyPendingTimers();

            expect(mockDependencies.performanceMonitor.startFrameMonitoring).toHaveBeenCalled();
            expect(mockGame.getGameState).toHaveBeenCalled();
            expect(mockGame.update).toHaveBeenCalled();
            expect(mockRenderingEngine.draw).toHaveBeenCalled();
            gameLoop.stop();
        });

        it('should handle feature errors gracefully', () => {
            // Simulate error in PerformanceMonitor
            mockDependencies.performanceMonitor.startFrameMonitoring.mockImplementation(() => {
                throw new Error('PM Error');
            });

            gameLoop.running = true; // IMPORTANT
            gameLoop.animate();
            jest.runOnlyPendingTimers();

            expect(mockRecoveryManager.handleFeatureRuntimeError).toHaveBeenCalledWith(
                'PerformanceMonitor',
                expect.any(Error),
                null
            );
        });

        it('should not update disabled features', () => {
            mockRecoveryManager.isFeatureDisabled.mockImplementation(
                (feature) => feature === 'GlowEffectManager'
            );

            gameLoop.running = true; // IMPORTANT
            gameLoop.animate();
            jest.runOnlyPendingTimers();
            expect(mockDependencies.glowEffectManager.update).not.toHaveBeenCalled();
        });

        it('should handle GlowEffectManager update errors', () => {
            mockDependencies.glowEffectManager.update.mockImplementation(() => {
                throw new Error('Glow Error');
            });

            gameLoop.running = true; // IMPORTANT
            gameLoop.animate();
            jest.runOnlyPendingTimers();

            expect(mockRecoveryManager.handleFeatureRuntimeError).toHaveBeenCalledWith(
                'GlowEffectManager',
                expect.any(Error),
                expect.any(Function)
            );

            // Verify fallback
            expect(gameLoop.glowEffectManager).toBeNull();
        });

        it('should handle CameraEffectsManager update errors', () => {
            mockDependencies.cameraEffectsManager.update.mockImplementation(() => {
                throw new Error('Cam Error');
            });

            gameLoop.running = true; // IMPORTANT
            gameLoop.animate();
            jest.runOnlyPendingTimers();

            expect(mockRecoveryManager.handleFeatureRuntimeError).toHaveBeenCalledWith(
                'CameraEffectsManager',
                expect.any(Error),
                expect.any(Function)
            );
            expect(gameLoop.cameraEffectsManager).toBeNull();
        });

        it('should handle PerformanceMonitor update errors', () => {
            mockDependencies.performanceMonitor.update.mockImplementation(() => {
                throw new Error('PM Update Fail');
            });

            gameLoop.running = true; // IMPORTANT
            gameLoop.animate();
            jest.runOnlyPendingTimers();
            expect(mockRecoveryManager.handleFeatureRuntimeError).toHaveBeenCalledWith(
                'PerformanceMonitor',
                expect.any(Error),
                null
            );
        });

        it('should handle PerformanceDegradationManager update errors', () => {
            mockDependencies.performanceDegradationManager.update.mockImplementation(() => {
                throw new Error('Degradation Fail');
            });

            gameLoop.running = true; // IMPORTANT
            gameLoop.animate();
            jest.runOnlyPendingTimers();
            expect(mockRecoveryManager.handleFeatureRuntimeError).toHaveBeenCalledWith(
                'PerformanceDegradationManager',
                expect.any(Error),
                null
            );
        });
    });

    describe('Gameplay Logic', () => {
        it('should handle game start event', () => {
            gameLoop.previousGameState = { gameStarted: false };
            mockGame.getGameState.mockReturnValue({ gameStarted: true, isPaused: false });

            gameLoop.updateGameplay({ gameStarted: true, isPaused: false });

            expect(mockDependencies.audioManager.handleGameStart).toHaveBeenCalled();
        });

        it('should handle paused state transitions', () => {
            // Paused -> Running
            gameLoop.previousGameState = { isPaused: true };
            gameLoop.updateGameplay({ isPaused: false });
            expect(mockDependencies.audioManager.handleGameResume).toHaveBeenCalled();

            // Running -> Paused
            gameLoop.previousGameState = { isPaused: false };
            gameLoop.updateGameplay({ isPaused: true });
            expect(mockDependencies.audioManager.handleGamePause).toHaveBeenCalled();
        });

        it('should coordinate Multi-AI', () => {
            mockGame.getGameState.mockReturnValue({
                isPaused: false,
                aiOpponents: [{}, {}],
            });

            gameLoop.updateGameplay(mockGame.getGameState());

            expect(mockDependencies.calculateMultiAIDirections).toHaveBeenCalled();
            expect(mockDependencies.applyAIDecisions).toHaveBeenCalled();
        });

        it('should update split screen camera in multiplayer', () => {
            gameLoop.currentGameMode = GameModes.LOCAL_MULTIPLAYER;
            gameLoop.updateGameplay({ isPaused: false });
            expect(mockDependencies.splitScreenCamera.update).toHaveBeenCalled();
        });

        it('should check Time Trial milestones', () => {
            gameLoop.isTimeTrialActive = true;
            gameLoop.updateGameplay({ isPaused: false });
            expect(mockDependencies.achievementSystem.checkMilestone).toHaveBeenCalled();
        });
    });

    describe('UI Updates', () => {
        it('should update Local Scroring UI', () => {
            gameLoop.currentGameMode = GameModes.LOCAL_MULTIPLAYER;
            gameLoop.updateUI({});
            expect(mockDependencies.localScoringUI.updateScores).toHaveBeenCalled();
        });

        it('should update Time Trial UI', () => {
            gameLoop.isTimeTrialActive = true;
            gameLoop.modeUI = null; // Test fallback
            gameLoop.updateUI({});
            expect(mockDependencies.updateTimeTrialDisplay).toHaveBeenCalled();
        });

        it('should update Arena Shrink UI', () => {
            gameLoop.currentGameMode = GameModes.ARENA_SHRINK;
            gameLoop.modeUI = null;
            gameLoop.updateUI({});
            expect(mockDependencies.updateArenaShrinkDisplay).toHaveBeenCalled();
            expect(mockDependencies.scoreDisplay.updateGameplayScores).toHaveBeenCalled();
        });

        it('should update Remaining Entities display', () => {
            gameLoop.currentGameMode = GameModes.CLASSIC;
            mockGame.getGameState.mockReturnValue({
                aiOpponents: [{}, {}],
                playerScore: 0,
                aiScore: 0,
            });
            gameLoop.modeUI = null;

            gameLoop.updateUI({});
            expect(mockDependencies.updateRemainingEntityDisplay).toHaveBeenCalled();
        });

        it('should update Remaining Entities display via modeUI', () => {
            gameLoop.currentGameMode = GameModes.ARENA_SHRINK;
            mockGame.getGameState.mockReturnValue({ aiOpponents: [{}, {}] });

            gameLoop.updateUI({});
            expect(mockDependencies.modeUI.updateRemainingEntityDisplay).toHaveBeenCalled();
        });
    });

    describe('Rendering & Cleanup', () => {
        it('should handle rendering errors', () => {
            mockRenderingEngine.draw.mockImplementation(() => {
                throw new Error('Render Fail');
            });

            gameLoop.render({});

            expect(mockRecoveryManager.handleRenderingError).toHaveBeenCalled();
            expect(mockRenderingEngine.renderer.render).toHaveBeenCalled();
        });

        it('should stop game if rendering recovery fails', () => {
            mockRenderingEngine.draw.mockImplementation(() => {
                throw new Error('Fatal Render Fail');
            });
            mockRecoveryManager.handleRenderingError.mockReturnValue(false);

            const stopSpy = jest.spyOn(gameLoop, 'stop');

            gameLoop.render({});

            expect(stopSpy).toHaveBeenCalled();
        });

        it('should handle GlowEffectManager render errors', () => {
            mockDependencies.glowEffectManager.render.mockImplementation(() => {
                throw new Error('Glow Render Fail');
            });

            gameLoop.render({});

            expect(mockRecoveryManager.handleFeatureRuntimeError).toHaveBeenCalledWith(
                'GlowEffectManager',
                expect.any(Error),
                expect.any(Function)
            );
            expect(mockRenderingEngine.renderer.render).toHaveBeenCalled();
        });
    });

    describe('Game Over Handling', () => {
        it('should handle classic game over', () => {
            gameLoop.currentGameMode = GameModes.CLASSIC;
            mockGame.getGameState.mockReturnValue({ isPaused: false, gameOver: true });
            mockGame.gameOver = true;

            gameLoop.running = true; // IMPORTANT
            gameLoop.animate();
            jest.runOnlyPendingTimers();

            expect(mockDependencies.uiManager.showGameOver).toHaveBeenCalled();
        });

        it('should handle multiplayer game over', () => {
            gameLoop.uiManager = null;
            gameLoop.currentGameMode = GameModes.LOCAL_MULTIPLAYER;

            gameLoop.handleGameOver();
            expect(mockDependencies.showMultiplayerGameOver).toHaveBeenCalled();
        });

        it('should handle Time Trial game over', () => {
            gameLoop.uiManager = null;
            gameLoop.currentGameMode = GameModes.TIME_TRIAL;
            gameLoop.isTimeTrialActive = true;

            gameLoop.handleGameOver();
            expect(mockDependencies.showTimeTrialGameOver).toHaveBeenCalled();
        });

        it('should handle Arena Shrink game over', () => {
            gameLoop.uiManager = null;
            gameLoop.currentGameMode = GameModes.ARENA_SHRINK;

            gameLoop.handleGameOver();
            expect(mockDependencies.showArenaShrinkGameOver).toHaveBeenCalled();
        });

        it('should handle Multi-AI game over', () => {
            gameLoop.uiManager = null;
            gameLoop.currentGameMode = GameModes.CLASSIC; // Default fallback
            gameLoop.handleGameOver();
            expect(mockDependencies.showMultiAIGameOver).toHaveBeenCalled();
        });
    });

    describe('Collision Handling', () => {
        it('should handle player collision', () => {
            mockDependencies.collisionDetectionEngine.checkCollisions.mockReturnValue({
                playerCollided: true,
                aiCollided: false,
                winner: 'AI',
            });
            const gameState = { player: { id: 'p1', alive: true } };

            gameLoop.handleCollisions(gameState);

            expect(mockDependencies.audioManager.playExplosionSound).toHaveBeenCalled();
            expect(mockDependencies.cameraEffectsManager.onCollision).toHaveBeenCalled();
            expect(mockRenderingEngine.createExplosionEffect).toHaveBeenCalled();
            expect(mockDependencies.audioManager.playDefeatSound).toHaveBeenCalled();
        });

        it('should handle multiplayer collisions', () => {
            gameLoop.currentGameMode = GameModes.LOCAL_MULTIPLAYER;
            mockDependencies.playerCollisionHandler.checkMultiplayerCollisions.mockReturnValue({
                player1Collided: true,
                player2Collided: false,
                crashedEntities: ['P1'],
                survivingEntities: ['P2'],
            });
            const gameState = { player1: { id: 'p1' }, player2: { id: 'p2' } };

            gameLoop.handleCollisions(gameState);

            expect(mockDependencies.renderingEngine.createExplosionEffect).toHaveBeenCalled();
            expect(mockDependencies.audioManager.playVictorySound).toHaveBeenCalled();
        });

        it('should handle Time Trial end via collision', () => {
            gameLoop.isTimeTrialActive = true;
            mockDependencies.collisionDetectionEngine.checkCollisions.mockReturnValue({
                playerCollided: true,
                aiCollided: false,
            });
            const gameState = { player: { id: 'p1' } };

            mockDependencies.leaderboardSystem.isNewRecord.mockReturnValue(true);

            gameLoop.handleCollisions(gameState);

            expect(mockDependencies.survivalTimer.stop).toHaveBeenCalled();
            expect(mockDependencies.leaderboardSystem.addScore).toHaveBeenCalled();
            expect(mockDependencies.audioManager.playDefeatSound).toHaveBeenCalled();
        });
    });
});
