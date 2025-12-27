const { ModeController } = require('./ModeController.js');
const { GameModes } = require('../systems/GameModes.js');

/**
 * Arena Shrink game mode controller
 * Handles arena shrink gameplay with shrinking boundaries
 */
class ArenaShrinkMode extends ModeController {
    /**
     * Create an arena shrink mode controller
     * @param {Object} game - Game instance
     * @param {Object} systems - Game systems
     * @param {Object} helpers - Helper functions
     */
    constructor(game, systems, helpers) {
        super(game, systems);
        this.helpers = helpers;
        this.currentAICount = helpers.currentAICount || 1;
    }

    /**
     * Initialize Arena Shrink mode
     */
    initialize() {
        // Set game configuration for multi-AI
        this.game.gameConfig.aiCount = this.currentAICount;

        // Initialize game with AI in Arena Shrink mode
        this.game.restart();
        this.game.setGameMode(GameModes.ARENA_SHRINK);

        // Reinitialize AI controllers to match game state
        this.helpers.initializeAIControllers(this.currentAICount);

        // Set up shrink animation and audio callbacks
        this._setupShrinkCallbacks();

        // Common initialization tasks
        this._commonInitialization();

        // Create UI
        this.createUI();

        // Reset score display to show current scores
        const gameState = this.game.getGameState();
        this.systems.scoreDisplay.updateGameplayScores(gameState.playerScore, gameState.aiScore);

        // Handle audio and music for game start
        this.systems.audioManager.handleGameStart();
    }

    /**
     * Set up arena shrink callbacks
     * @private
     */
    _setupShrinkCallbacks() {
        if (this.game.arenaShrinker) {
            // Set up warning callback for audio and visual effects
            this.game.arenaShrinker.setOnWarning(() => {
                // Play warning sound effect
                this.systems.audioManager.playShrinkWarningSound();
            });

            // Set up shrink callback for animation and audio effects
            this.game.arenaShrinker.setOnShrink(() => {
                // Play shrink execution sound effect
                this.systems.audioManager.playShrinkExecuteSound();

                // Trigger shrinking animation in renderer
                const currentBounds = this.game.arenaShrinker.getCurrentBounds();
                const nextBounds = this.game.arenaShrinker.getNextBounds();
                this.systems.renderingEngine.startShrinkAnimation(currentBounds, nextBounds);
            });

            // Set up final arena callback for messaging
            this.game.arenaShrinker.setOnFinalArena(() => {
                if (this.systems.modeUI) {
                    this.systems.modeUI.showFinalArenaMessage();
                } else {
                    this.helpers.showFinalArenaMessage();
                }
            });
        }
    }

    /**
     * Clean up Arena Shrink mode
     */
    cleanup() {
        this.destroyUI();
    }

    /**
     * Handle game over for Arena Shrink mode
     */
    handleGameOver() {
        if (this.systems.gameOverUI) {
            this.systems.gameOverUI.showArenaShrinkGameOver(this.game);
        } else {
            // Fallback to legacy function
            this.helpers.showArenaShrinkGameOver();
        }
    }

    /**
     * Create Arena Shrink mode UI
     */
    createUI() {
        if (this.systems.uiManager) {
            this.systems.uiManager.updateForMode(GameModes.ARENA_SHRINK);
            this.systems.uiManager.createModeUI(GameModes.ARENA_SHRINK);
        } else {
            // Fallback to legacy functions
            this.helpers.updateUIForGameMode();
            this.helpers.hideTimeTrialUI();
            this.helpers.hideRemainingEntitiesDisplay();
            this.helpers.createArenaShrinkUI();
        }
    }

    /**
     * Destroy Arena Shrink mode UI
     */
    destroyUI() {
        if (this.systems.modeUI) {
            this.systems.modeUI.hideArenaShrinkUI();
            this.systems.modeUI.hideFinalArenaMessage();
        } else {
            // Fallback to legacy functions
            this.helpers.hideArenaShrinkUI();
            this.helpers.hideFinalArenaMessage();
        }
    }
}

module.exports = { ArenaShrinkMode };
