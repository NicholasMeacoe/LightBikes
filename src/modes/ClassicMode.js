const { ModeController } = require('./ModeController.js');
const { GameModes } = require('../systems/GameModes.js');

/**
 * Classic game mode controller
 * Handles classic gameplay with AI opponents
 */
class ClassicMode extends ModeController {
    /**
     * Create a classic mode controller
     * @param {Object} game - Game instance
     * @param {Object} systems - Game systems
     * @param {Object} helpers - Helper functions (initializeAIControllers, etc.)
     */
    constructor(game, systems, helpers) {
        super(game, systems);
        this.helpers = helpers;
        this.currentAICount = helpers.currentAICount || 1;
    }

    /**
     * Initialize Classic mode
     */
    initialize() {
        // Set game configuration for multi-AI
        this.game.gameConfig.aiCount = this.currentAICount;

        // Initialize game with AI
        this.game.restart();
        this.game.setTimeTrialMode(false);

        // Reinitialize AI controllers to match game state
        this.helpers.initializeAIControllers(this.currentAICount);

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
     * Clean up Classic mode
     */
    cleanup() {
        this.destroyUI();
    }

    /**
     * Handle game over for Classic mode
     */
    handleGameOver() {
        if (this.systems.gameOverUI) {
            this.systems.gameOverUI.showMultiAIGameOver(this.game);
        } else {
            // Fallback to legacy function
            this.helpers.showMultiAIGameOver();
        }
    }

    /**
     * Create Classic mode UI
     */
    createUI() {
        if (this.systems.uiManager && this.systems.modeUI) {
            this.systems.uiManager.updateForMode(GameModes.CLASSIC);
            this.systems.modeUI.hideAllModeUI();
        } else {
            // Fallback to legacy functions
            this.helpers.updateUIForGameMode();
            this.helpers.hideTimeTrialUI();
            this.helpers.hideArenaShrinkUI();
            this.helpers.hideRemainingEntitiesDisplay();
        }
    }

    /**
     * Destroy Classic mode UI
     */
    destroyUI() {
        if (this.systems.modeUI) {
            this.systems.modeUI.hideAllModeUI();
        } else {
            // Fallback to legacy functions
            this.helpers.hideRemainingEntitiesDisplay();
        }
    }
}

module.exports = { ClassicMode };
