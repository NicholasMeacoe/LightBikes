const { GameLoop } = require('../../src/game-loop/GameLoop.js');
const { GameModes } = require('../../src/systems/GameModes.js');

describe('GameLoop', () => {
    let gameLoop;
    let mockDependencies;

    beforeEach(() => {
        // Create minimal mock dependencies
        mockDependencies = {
            game: {
                getGameState: jest.fn().mockReturnValue({
                    gameOver: false,
                    isPaused: false,
                    gameStarted: true,
                    player: { x: 0, y: 0 },
                    playerScore: 0,
                    aiScore: 0,
                }),
                update: jest.fn(),
                gameOver: false,
            },
            renderingEngine: {
                draw: jest.fn(),
                createExplosionEffect: jest.fn(),
                renderer: { render: jest.fn() },
                scene: {},
                camera: {},
            },
            performanceMonitor: {
                startFrameMonitoring: jest.fn(),
                getLastFrameTime: jest.fn().mockReturnValue(16),
                update: jest.fn(),
                startCollisionDetection: jest.fn(),
                endCollisionDetection: jest.fn(),
            },
            performanceDegradationManager: {
                update: jest.fn(),
            },
            glowEffectManager: {
                update: jest.fn(),
                render: jest.fn(),
            },
            cameraEffectsManager: {
                update: jest.fn(),
                isEnabled: jest.fn().mockReturnValue(true),
                pause: jest.fn(),
                resume: jest.fn(),
                onCollision: jest.fn(),
            },
            powerUpManager: {
                update: jest.fn(),
                checkCollections: jest.fn(),
                getAllActiveEffects: jest.fn().mockReturnValue([]),
            },
            statusIndicator: {
                updateStatus: jest.fn(),
                updateTimers: jest.fn(),
            },
            audioManager: {
                handleGameStart: jest.fn(),
                handleGamePause: jest.fn(),
                handleGameResume: jest.fn(),
                handleGameEnd: jest.fn(),
                playExplosionSound: jest.fn(),
                playVictorySound: jest.fn(),
                playDefeatSound: jest.fn(),
            },
            scoreDisplay: {
                updateGameplayScores: jest.fn(),
            },
            survivalTimer: {
                getElapsedTime: jest.fn().mockReturnValue(1000),
                pause: jest.fn(),
                resume: jest.fn(),
                stop: jest.fn(),
            },
            leaderboardSystem: {
                isNewRecord: jest.fn().mockReturnValue(false),
                addScore: jest.fn(),
            },
            achievementSystem: {
                checkMilestone: jest.fn(),
            },
            localScoringUI: {
                updateScores: jest.fn(),
            },
            splitScreenCamera: {
                update: jest.fn(),
            },
            collisionDetectionEngine: {
                checkCollisions: jest.fn().mockReturnValue({
                    playerCollided: false,
                    aiCollided: false,
                    winner: null,
                    crashedEntities: [],
                    survivingEntities: [],
                }),
            },
            playerCollisionHandler: {
                checkMultiplayerCollisions: jest.fn().mockReturnValue({
                    player1Collided: false,
                    player2Collided: false,
                }),
            },
            recoveryManager: {
                isFeatureDisabled: jest.fn().mockReturnValue(false),
                handleFeatureRuntimeError: jest.fn(),
                handleRenderingError: jest.fn().mockReturnValue(true),
            },
            uiManager: {
                showGameOver: jest.fn(),
            },
            gameOverUI: {},
            modeUI: {
                updateTimeTrialDisplay: jest.fn(),
                updateArenaShrinkDisplay: jest.fn(),
                updateRemainingEntityDisplay: jest.fn(),
            },
            aiCoordinator: {},
            difficultyManager: {
                getDifficultyConfig: jest.fn().mockReturnValue({}),
            },
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
            isTimeTrialActive: false,
            aiControllers: [],
        };

        gameLoop = new GameLoop(mockDependencies);
    });

    afterEach(() => {
        if (gameLoop) {
            gameLoop.stop();
        }
    });

    describe('constructor', () => {
        it('should initialize with dependencies', () => {
            expect(gameLoop.game).toBe(mockDependencies.game);
            expect(gameLoop.renderingEngine).toBe(mockDependencies.renderingEngine);
            expect(gameLoop.running).toBe(false);
            expect(gameLoop.animationFrameId).toBeNull();
        });
    });

    describe('start', () => {
        it('should start the game loop', () => {
            gameLoop.start();
            expect(gameLoop.running).toBe(true);
        });

        it('should not restart if already running', () => {
            gameLoop.start();
            const firstId = gameLoop.animationFrameId;
            gameLoop.start();
            expect(gameLoop.animationFrameId).toBe(firstId);
        });
    });

    describe('stop', () => {
        it('should stop the game loop', () => {
            gameLoop.start();
            gameLoop.stop();
            expect(gameLoop.running).toBe(false);
            expect(gameLoop.animationFrameId).toBeNull();
        });
    });

    describe('setMode', () => {
        it('should set game mode', () => {
            gameLoop.setMode(GameModes.TIME_TRIAL, true);
            expect(gameLoop.currentGameMode).toBe(GameModes.TIME_TRIAL);
            expect(gameLoop.isTimeTrialActive).toBe(true);
        });
    });

    describe('updateGameplay', () => {
        it('should update game when not paused', () => {
            const gameState = mockDependencies.game.getGameState();
            gameLoop.updateGameplay(gameState);

            expect(mockDependencies.game.update).toHaveBeenCalled();
            expect(mockDependencies.powerUpManager.update).toHaveBeenCalled();
        });

        it('should handle pause state', () => {
            gameLoop.previousGameState = { isPaused: false };
            const gameState = { ...mockDependencies.game.getGameState(), isPaused: true };
            mockDependencies.game.getGameState.mockReturnValue(gameState);

            gameLoop.updateGameplay(gameState);

            expect(mockDependencies.audioManager.handleGamePause).toHaveBeenCalled();
            expect(mockDependencies.cameraEffectsManager.pause).toHaveBeenCalled();
        });
    });

    describe('handleCollisions', () => {
        it('should detect collisions', () => {
            const gameState = mockDependencies.game.getGameState();
            gameLoop.handleCollisions(gameState);

            expect(mockDependencies.performanceMonitor.startCollisionDetection).toHaveBeenCalled();
            expect(mockDependencies.collisionDetectionEngine.checkCollisions).toHaveBeenCalled();
            expect(mockDependencies.performanceMonitor.endCollisionDetection).toHaveBeenCalled();
        });

        it('should handle player collision', () => {
            mockDependencies.collisionDetectionEngine.checkCollisions.mockReturnValue({
                playerCollided: true,
                aiCollided: false,
                winner: 'ai_0',
                crashedEntities: ['player'],
                survivingEntities: ['ai_0'],
            });

            const gameState = mockDependencies.game.getGameState();
            gameLoop.handleCollisions(gameState);

            expect(mockDependencies.audioManager.playExplosionSound).toHaveBeenCalled();
            expect(mockDependencies.audioManager.handleGameEnd).toHaveBeenCalled();
        });
    });

    describe('animate', () => {
        beforeEach(() => {
            // Setup for animation tests
            gameLoop.running = true;
            // Prevent infinite recursion by not executing the callback immediately
            jest.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
            mockDependencies.performanceMonitor.getLastFrameTime.mockReturnValue(16.67);
        });

        it('should calculate correct deltaTime from performance monitor', () => {
            mockDependencies.performanceMonitor.getLastFrameTime.mockReturnValue(33.33);
            gameLoop.animate();

            // Verify delta time passed to managers (33.33ms / 1000 = 0.03333s)
            expect(mockDependencies.glowEffectManager.update).toHaveBeenCalledWith(
                expect.closeTo(0.03333, 5),
                expect.anything()
            );
            expect(mockDependencies.cameraEffectsManager.update).toHaveBeenCalledWith(
                expect.closeTo(0.03333, 5)
            );
        });

        it('should fallback to default deltaTime if performance monitor is missing', () => {
            gameLoop.performanceMonitor = null;
            gameLoop.animate();

            // Default 16ms / 1000 = 0.016s
            expect(mockDependencies.glowEffectManager.update).toHaveBeenCalledWith(
                0.016,
                expect.anything()
            );
        });

        it('should integrate performance monitoring hooks', () => {
            gameLoop.animate();
            expect(mockDependencies.performanceMonitor.startFrameMonitoring).toHaveBeenCalled();
            expect(mockDependencies.performanceMonitor.update).toHaveBeenCalled();
        });

        it('should handle performance monitor errors gracefully', () => {
            mockDependencies.performanceMonitor.startFrameMonitoring.mockImplementation(() => {
                throw new Error('Monitor Error');
            });

            gameLoop.animate();

            expect(mockDependencies.recoveryManager.handleFeatureRuntimeError).toHaveBeenCalledWith(
                'PerformanceMonitor',
                expect.any(Error),
                null
            );
        });

        it('should handle glow effect manager errors', () => {
            mockDependencies.glowEffectManager.update.mockImplementation(() => {
                throw new Error('Glow Error');
            });

            gameLoop.animate();

            expect(mockDependencies.recoveryManager.handleFeatureRuntimeError).toHaveBeenCalledWith(
                'GlowEffectManager',
                expect.any(Error),
                expect.any(Function)
            );
        });

        it('should handle camera effects manager errors', () => {
            mockDependencies.cameraEffectsManager.update.mockImplementation(() => {
                throw new Error('Camera Error');
            });

            gameLoop.animate();

            expect(mockDependencies.recoveryManager.handleFeatureRuntimeError).toHaveBeenCalledWith(
                'CameraEffectsManager',
                expect.any(Error),
                expect.any(Function)
            );
        });

        it('should handle performance degradation manager errors', () => {
            mockDependencies.performanceDegradationManager.update.mockImplementation(() => {
                throw new Error('Degradation Error');
            });

            gameLoop.animate();

            expect(mockDependencies.recoveryManager.handleFeatureRuntimeError).toHaveBeenCalledWith(
                'PerformanceDegradationManager',
                expect.any(Error),
                null
            );
        });
    });

    describe('render', () => {
        it('should render game state', () => {
            const gameState = mockDependencies.game.getGameState();
            gameLoop.render(gameState);

            expect(mockDependencies.renderingEngine.draw).toHaveBeenCalled();
            expect(mockDependencies.glowEffectManager.render).toHaveBeenCalled();
        });

        it('should handle rendering errors', () => {
            mockDependencies.renderingEngine.draw.mockImplementation(() => {
                throw new Error('Render error');
            });

            const gameState = mockDependencies.game.getGameState();

            expect(() => {
                gameLoop.render(gameState);
            }).not.toThrow();

            expect(mockDependencies.recoveryManager.handleRenderingError).toHaveBeenCalled();
        });

        it('should handle glow render errors', () => {
            mockDependencies.glowEffectManager.render.mockImplementation(() => {
                throw new Error('Glow Render Error');
            });

            const gameState = mockDependencies.game.getGameState();
            gameLoop.render(gameState);

            expect(mockDependencies.recoveryManager.handleFeatureRuntimeError).toHaveBeenCalledWith(
                'GlowEffectManager',
                expect.any(Error),
                expect.any(Function)
            );
        });
    });

    describe('handleGameOver', () => {
        it('should show game over UI', () => {
            mockDependencies.game.gameOver = true;
            document.body.innerHTML = '<div id="gameOver"></div><button id="restart"></button>';

            gameLoop.handleGameOver();

            expect(mockDependencies.uiManager.showGameOver).toHaveBeenCalled();
        });

        it('should fallback to simple game over if UI manager missing', () => {
            gameLoop.uiManager = null;
            gameLoop.modeUI = null; // Ensure fallback path
            document.body.innerHTML = '<div id="gameOver"></div><button id="restart"></button>';

            gameLoop.handleGameOver();

            expect(mockDependencies.showMultiAIGameOver).toHaveBeenCalled();
        });
    });
});
