const { ModeController } = require('./ModeController.js');
const { GameModes } = require('../systems/GameModes.js');

/**
 * Time Trial game mode controller
 * Handles time trial gameplay with survival timer
 */
class TimeTrialMode extends ModeController {
    /**
     * Create a time trial mode controller
     * @param {Object} game - Game instance
     * @param {Object} systems - Game systems
     * @param {Object} helpers - Helper functions
     */
    constructor(game, systems, helpers) {
        super(game, systems);
        this.helpers = helpers;
    }

    /**
     * Initialize Time Trial mode
     */
    initialize() {
        // Initialize game without AI
        this.game.restart();
        this.game.setTimeTrialMode(true);

        // Reset Time Trial components
        this.systems.survivalTimer.reset();
        this.systems.achievementSystem.reset();

        // Start survival timer
        this.systems.survivalTimer.start();

        // Common initialization tasks
        this._commonInitialization();

        // Create UI
        this.createUI();

        // Handle audio and music for game start
        this.systems.audioManager.handleGameStart();
    }

    /**
     * Clean up Time Trial mode
     */
    cleanup() {
        // Stop survival timer
        this.systems.survivalTimer.stop();

        // Destroy UI
        this.destroyUI();
    }

    /**
     * Handle game over for Time Trial mode
     */
    handleGameOver() {
        if (this.systems.gameOverUI) {
            this.systems.gameOverUI.showTimeTrialGameOver(this.game);
        } else {
            // Fallback to legacy function
            this.helpers.showTimeTrialGameOver();
        }
    }

    /**
     * Create Time Trial mode UI
     */
    createUI() {
        if (this.systems.uiManager) {
            this.systems.uiManager.updateForMode(GameModes.TIME_TRIAL);
            this.systems.uiManager.createModeUI(GameModes.TIME_TRIAL);
        } else {
            // Fallback to legacy functions
            this.helpers.updateUIForGameMode();
            this.helpers.createTimeTrialUI();
            this.helpers.hideArenaShrinkUI();
        }
    }

    /**
     * Destroy Time Trial mode UI
     */
    destroyUI() {
        if (this.systems.modeUI) {
            this.systems.modeUI.hideTimeTrialUI();
        } else {
            // Fallback to legacy function
            this.helpers.hideTimeTrialUI();
        }
    }
}

module.exports = { TimeTrialMode };
