const { Logger } = require('../utils/Logger.js');
const { GameModes } = require('../systems/GameModes.js');

const logger = Logger.create('GameLoop');

/**
 * GameLoop - Main animation loop and frame coordination
 */
class GameLoop {
    constructor(dependencies) {
        this.game = dependencies.game;
        this.renderingEngine = dependencies.renderingEngine;
        this.performanceMonitor = dependencies.performanceMonitor;
        this.performanceDegradationManager = dependencies.performanceDegradationManager;
        this.glowEffectManager = dependencies.glowEffectManager;
        this.cameraEffectsManager = dependencies.cameraEffectsManager;
        this.powerUpManager = dependencies.powerUpManager;
        this.statusIndicator = dependencies.statusIndicator;
        this.audioManager = dependencies.audioManager;
        this.scoreDisplay = dependencies.scoreDisplay;
        this.survivalTimer = dependencies.survivalTimer;
        this.leaderboardSystem = dependencies.leaderboardSystem;
        this.achievementSystem = dependencies.achievementSystem;
        this.localScoringUI = dependencies.localScoringUI;
        this.splitScreenCamera = dependencies.splitScreenCamera;
        this.collisionDetectionEngine = dependencies.collisionDetectionEngine;
        this.playerCollisionHandler = dependencies.playerCollisionHandler;
        this.recoveryManager = dependencies.recoveryManager;
        this.uiManager = dependencies.uiManager;
        this.gameOverUI = dependencies.gameOverUI;
        this.modeUI = dependencies.modeUI;
        this.aiCoordinator = dependencies.aiCoordinator;
        this.difficultyManager = dependencies.difficultyManager;

        this.updatePauseOverlay = dependencies.updatePauseOverlay;
        this.updateTimeTrialDisplay = dependencies.updateTimeTrialDisplay;
        this.updateArenaShrinkDisplay = dependencies.updateArenaShrinkDisplay;
        this.updateRemainingEntityDisplay = dependencies.updateRemainingEntityDisplay;
        this.showMultiplayerGameOver = dependencies.showMultiplayerGameOver;
        this.showTimeTrialGameOver = dependencies.showTimeTrialGameOver;
        this.showArenaShrinkGameOver = dependencies.showArenaShrinkGameOver;
        this.showMultiAIGameOver = dependencies.showMultiAIGameOver;
        this.calculateMultiAIDirections = dependencies.calculateMultiAIDirections;
        this.applyAIDecisions = dependencies.applyAIDecisions;
        this.handleMultiAICollisions = dependencies.handleMultiAICollisions;

        this.currentGameMode = dependencies.currentGameMode || GameModes.CLASSIC;
        this.isTimeTrialActive = dependencies.isTimeTrialActive || false;
        this.aiControllers = dependencies.aiControllers || [];

        this.running = false;
        this.animationFrameId = null;
        this.previousGameState = null;
    }

    start() {
        if (!this.running) {
            this.running = true;
            this.animate();
        }
    }

    stop() {
        this.running = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    setMode(mode, isTimeTrial = false) {
        this.currentGameMode = mode;
        this.isTimeTrialActive = isTimeTrial;
    }

    animate() {
        if (!this.running) return;

        this.animationFrameId = requestAnimationFrame(() => this.animate());

        // Start frame performance monitoring
        if (
            this.performanceMonitor &&
            !this.recoveryManager.isFeatureDisabled('PerformanceMonitor')
        ) {
            try {
                this.performanceMonitor.startFrameMonitoring();
            } catch (error) {
                this.recoveryManager.handleFeatureRuntimeError('PerformanceMonitor', error, null);
            }
        }

        const gameState = this.game.getGameState();

        // Calculate delta time
        const deltaTime =
            this.performanceMonitor && this.performanceMonitor.getLastFrameTime
                ? this.performanceMonitor.getLastFrameTime() / 1000
                : 0.016;

        // Update glow effects
        if (
            this.glowEffectManager &&
            !this.recoveryManager.isFeatureDisabled('GlowEffectManager')
        ) {
            try {
                this.glowEffectManager.update(deltaTime, gameState);
            } catch (error) {
                this.recoveryManager.handleFeatureRuntimeError('GlowEffectManager', error, () => {
                    this.glowEffectManager = null;
                });
            }
        }

        // Update camera effects
        if (
            this.cameraEffectsManager &&
            !this.recoveryManager.isFeatureDisabled('CameraEffectsManager')
        ) {
            try {
                this.cameraEffectsManager.update(deltaTime);
            } catch (error) {
                this.recoveryManager.handleFeatureRuntimeError(
                    'CameraEffectsManager',
                    error,
                    () => {
                        this.cameraEffectsManager = null;
                    }
                );
            }
        }

        if (!this.game.gameOver) {
            this.updateGameplay(gameState);
        } else {
            this.handleGameOver();
        }

        // Update performance systems
        if (
            this.performanceMonitor &&
            !this.recoveryManager.isFeatureDisabled('PerformanceMonitor')
        ) {
            try {
                this.performanceMonitor.update();
            } catch (error) {
                this.recoveryManager.handleFeatureRuntimeError('PerformanceMonitor', error, null);
            }
        }

        if (
            this.performanceDegradationManager &&
            !this.recoveryManager.isFeatureDisabled('PerformanceDegradationManager')
        ) {
            try {
                this.performanceDegradationManager.update();
            } catch (error) {
                this.recoveryManager.handleFeatureRuntimeError(
                    'PerformanceDegradationManager',
                    error,
                    null
                );
            }
        }

        // Store state for next frame
        this.previousGameState = { ...gameState };
    }

    updateGameplay(gameState) {
        // Check for pause state changes (Resume detection)
        this.handlePauseState(gameState);

        if (!gameState.isPaused) {
            // Handle game start
            if (
                gameState.gameStarted &&
                (!this.previousGameState || !this.previousGameState.gameStarted)
            ) {
                this.audioManager.handleGameStart();
            }

            // Multi-AI coordination
            if (
                !this.isTimeTrialActive &&
                this.currentGameMode !== GameModes.LOCAL_MULTIPLAYER &&
                gameState.aiOpponents &&
                gameState.aiOpponents.length > 0
            ) {
                const difficultyConfig = this.difficultyManager.getDifficultyConfig();
                const aiDecisions = this.calculateMultiAIDirections(gameState, difficultyConfig);
                this.applyAIDecisions(aiDecisions, this.game);
            }

            this.game.update();

            // Update split screen camera
            if (this.currentGameMode === GameModes.LOCAL_MULTIPLAYER && this.splitScreenCamera) {
                this.splitScreenCamera.update();
            }

            // Update power-ups
            this.powerUpManager.update();
            this.powerUpManager.checkCollections(gameState);

            // Time Trial updates
            if (this.isTimeTrialActive && !gameState.isPaused) {
                const elapsedSeconds = this.survivalTimer.getElapsedTime() / 1000;
                this.achievementSystem.checkMilestone(elapsedSeconds);
            }

            // Collision detection
            this.handleCollisions(gameState);
        }

        // Update UI
        this.updateUI(gameState);

        // Render
        this.render(gameState);
    }

    handleCollisions(gameState) {
        if (this.performanceMonitor) {
            this.performanceMonitor.startCollisionDetection();
        }

        let collisionResult;
        if (this.currentGameMode === GameModes.LOCAL_MULTIPLAYER) {
            collisionResult = this.playerCollisionHandler.checkMultiplayerCollisions(
                gameState,
                this.game
            );
            collisionResult.playerCollided =
                collisionResult.player1Collided || collisionResult.player2Collided;
            collisionResult.aiCollided = false;
            if (!collisionResult.crashedEntities) {
                collisionResult.crashedEntities = [];
                if (collisionResult.player1Collided) collisionResult.crashedEntities.push('P1');
                if (collisionResult.player2Collided) collisionResult.crashedEntities.push('P2');
            }
            if (!collisionResult.survivingEntities) {
                collisionResult.survivingEntities = [];
                if (!collisionResult.player1Collided) collisionResult.survivingEntities.push('P1');
                if (!collisionResult.player2Collided) collisionResult.survivingEntities.push('P2');
            }
        } else {
            collisionResult = this.collisionDetectionEngine.checkCollisions(gameState, this.game);
        }

        if (this.performanceMonitor) {
            this.performanceMonitor.endCollisionDetection();
        }

        const { playerCollided, aiCollided, winner } = collisionResult;

        if (playerCollided || aiCollided) {
            this.handleCollisionEffects(collisionResult, gameState);
            this.handleGameEnd(collisionResult, winner);
        }
    }

    handleCollisionEffects(collisionResult, gameState) {
        this.audioManager.playExplosionSound();

        // Camera shake
        if (this.cameraEffectsManager && this.cameraEffectsManager.isEnabled()) {
            let collisionIntensity = 1.0;
            if (collisionResult.playerCollided && collisionResult.aiCollided) {
                collisionIntensity = 1.5;
            }

            const playerRef =
                this.currentGameMode === GameModes.LOCAL_MULTIPLAYER
                    ? gameState.player1
                    : gameState.player;
            if (playerRef) {
                this.cameraEffectsManager.onCollision(playerRef, collisionIntensity);
            }
        }

        // Explosion effects
        if (this.currentGameMode === GameModes.LOCAL_MULTIPLAYER) {
            if (collisionResult.player1Collided && gameState.player1) {
                this.renderingEngine.createExplosionEffect(gameState.player1, 1.0);
            }
            if (collisionResult.player2Collided && gameState.player2) {
                this.renderingEngine.createExplosionEffect(gameState.player2, 1.0);
            }
        } else {
            if (collisionResult.playerCollided && gameState.player) {
                this.renderingEngine.createExplosionEffect(gameState.player, 1.0);
            }
            if (collisionResult.aiCollided && gameState.aiOpponents) {
                gameState.aiOpponents.forEach((ai) => {
                    if (!ai.alive) {
                        this.renderingEngine.createExplosionEffect(ai, 1.0);
                    }
                });
            } else if (collisionResult.aiCollided && gameState.ai) {
                this.renderingEngine.createExplosionEffect(gameState.ai, 1.0);
            }
        }
    }

    handleGameEnd(collisionResult, winner) {
        if (this.isTimeTrialActive) {
            this.survivalTimer.stop();
            const finalTime = this.survivalTimer.getElapsedTime();
            if (this.leaderboardSystem.isNewRecord(finalTime)) {
                this.leaderboardSystem.addScore(finalTime);
            }
            this.game.gameOver = true;
            this.audioManager.playDefeatSound();
        } else if (this.currentGameMode === GameModes.LOCAL_MULTIPLAYER) {
            this.game.handleRoundEnd(collisionResult);
            this.game.gameOver = true;
            if (collisionResult.player1Collided && collisionResult.player2Collided) {
                this.audioManager.playDefeatSound();
            } else {
                this.audioManager.playVictorySound();
            }
        } else {
            this.handleMultiAICollisions(collisionResult, this.game);
            if (winner === 'player') {
                this.audioManager.playVictorySound();
            } else {
                this.audioManager.playDefeatSound();
            }
        }
        this.audioManager.handleGameEnd();
    }

    handlePauseState(gameState) {
        if (this.previousGameState && !this.previousGameState.isPaused) {
            this.audioManager.handleGamePause();
            if (this.cameraEffectsManager && this.cameraEffectsManager.isEnabled()) {
                this.cameraEffectsManager.pause();
            }
            if (this.isTimeTrialActive) {
                this.survivalTimer.pause();
            }
        }

        if (this.previousGameState && this.previousGameState.isPaused && !gameState.isPaused) {
            this.audioManager.handleGameResume();
            if (this.cameraEffectsManager && this.cameraEffectsManager.isEnabled()) {
                this.cameraEffectsManager.resume();
            }
            if (this.isTimeTrialActive) {
                this.survivalTimer.resume();
            }
        }
    }

    updateUI(gameState) {
        this.updatePauseOverlay();

        if (this.currentGameMode === GameModes.LOCAL_MULTIPLAYER) {
            if (this.localScoringUI) {
                this.localScoringUI.updateScores();
            }
        } else if (this.isTimeTrialActive) {
            if (this.modeUI) {
                this.modeUI.updateTimeTrialDisplay();
            } else {
                this.updateTimeTrialDisplay();
            }
        } else if (this.currentGameMode === GameModes.ARENA_SHRINK) {
            if (this.modeUI) {
                this.modeUI.updateArenaShrinkDisplay();
            } else {
                this.updateArenaShrinkDisplay();
            }
            const updatedGameState = this.game.getGameState();
            this.scoreDisplay.updateGameplayScores(
                updatedGameState.playerScore,
                updatedGameState.aiScore
            );
            if (updatedGameState.aiOpponents && updatedGameState.aiOpponents.length > 1) {
                const aliveEntities = this.game.getAliveEntities();
                const survivingIds = aliveEntities.map((entity) => entity.id);
                if (this.modeUI) {
                    this.modeUI.updateRemainingEntityDisplay(survivingIds);
                } else {
                    this.updateRemainingEntityDisplay(survivingIds);
                }
            }
        } else {
            const updatedGameState = this.game.getGameState();
            this.scoreDisplay.updateGameplayScores(
                updatedGameState.playerScore,
                updatedGameState.aiScore
            );
            if (updatedGameState.aiOpponents && updatedGameState.aiOpponents.length > 1) {
                const aliveEntities = this.game.getAliveEntities();
                const survivingIds = aliveEntities.map((entity) => entity.id);
                if (this.modeUI) {
                    this.modeUI.updateRemainingEntityDisplay(survivingIds);
                } else {
                    this.updateRemainingEntityDisplay(survivingIds);
                }
            }
        }

        if (this.statusIndicator) {
            const allActiveEffects = this.powerUpManager.getAllActiveEffects();
            this.statusIndicator.updateStatus(allActiveEffects);
            this.statusIndicator.updateTimers();
        }
    }

    render(gameState) {
        const updatedGameState = this.game.getGameState();
        updatedGameState.powerUpManager = this.powerUpManager;

        try {
            this.renderingEngine.draw(updatedGameState);
        } catch (error) {
            logger.error('Error rendering game:', error);
            const success = this.recoveryManager.handleRenderingError(error, () => {
                if (
                    this.renderingEngine &&
                    this.renderingEngine.renderer &&
                    this.renderingEngine.scene &&
                    this.renderingEngine.camera
                ) {
                    this.renderingEngine.renderer.render(
                        this.renderingEngine.scene,
                        this.renderingEngine.camera
                    );
                }
            });
            if (!success) {
                logger.error('Critical rendering failure, stopping game loop');
                this.stop();
                return;
            }
        }

        if (
            this.glowEffectManager &&
            !this.recoveryManager.isFeatureDisabled('GlowEffectManager')
        ) {
            try {
                this.glowEffectManager.render();
            } catch (error) {
                this.recoveryManager.handleFeatureRuntimeError('GlowEffectManager', error, () => {
                    this.glowEffectManager = null;
                });
                if (
                    this.renderingEngine &&
                    this.renderingEngine.renderer &&
                    this.renderingEngine.scene &&
                    this.renderingEngine.camera
                ) {
                    this.renderingEngine.renderer.render(
                        this.renderingEngine.scene,
                        this.renderingEngine.camera
                    );
                }
            }
        }
    }

    handleGameOver() {
        if (this.uiManager && this.gameOverUI) {
            const gameState = this.game.getGameState();
            this.uiManager.showGameOver(gameState, this.currentGameMode);

            if (this.currentGameMode !== GameModes.LOCAL_MULTIPLAYER) {
                document.getElementById('gameOver').style.display = 'block';
                const restartBtn = document.getElementById('restart');
                if (restartBtn) restartBtn.style.display = 'block';
            }
        } else {
            if (this.currentGameMode === GameModes.LOCAL_MULTIPLAYER) {
                this.showMultiplayerGameOver();
            } else if (this.isTimeTrialActive) {
                this.showTimeTrialGameOver();
                document.getElementById('gameOver').style.display = 'block';
                const restartBtn = document.getElementById('restart');
                if (restartBtn) restartBtn.style.display = 'block';
            } else if (this.currentGameMode === GameModes.ARENA_SHRINK) {
                this.showArenaShrinkGameOver();
                document.getElementById('gameOver').style.display = 'block';
                const restartBtn = document.getElementById('restart');
                if (restartBtn) restartBtn.style.display = 'block';
            } else {
                this.showMultiAIGameOver();
                document.getElementById('gameOver').style.display = 'block';
                const restartBtn = document.getElementById('restart');
                if (restartBtn) restartBtn.style.display = 'block';
            }
        }
    }
}

module.exports = { GameLoop };
