const { ModeController } = require('./ModeController.js');
const { GameModes } = require('../systems/GameModes.js');
const { MultiplayerGame } = require('../multiplayer/MultiplayerGame.js');
const { DualControlScheme } = require('../utils/DualControlScheme.js');
const { SplitScreenCamera } = require('../multiplayer/SplitScreenCamera.js');

/**
 * Local Multiplayer game mode controller
 * Handles local multiplayer gameplay with split screen
 */
class MultiplayerMode extends ModeController {
    /**
     * Create a multiplayer mode controller
     * @param {Object} game - Game instance (will be replaced with MultiplayerGame)
     * @param {Object} systems - Game systems
     * @param {Object} helpers - Helper functions
     */
    constructor(game, systems, helpers) {
        super(game, systems);
        this.helpers = helpers;
        this.multiplayerGame = null;
        this.dualControlScheme = null;
        this.splitScreenCamera = null;
    }

    /**
     * Initialize Local Multiplayer mode
     */
    initialize() {
        // Switch to multiplayer game instance
        if (!this.multiplayerGame) {
            this.multiplayerGame = new MultiplayerGame();

            // Wire up power-up system
            this.multiplayerGame.setPowerUpManager(this.systems.powerUpManager);

            // Wire up camera effects system
            this.multiplayerGame.setCameraEffectsManager(this.systems.cameraEffectsManager);
        } else {
            this.multiplayerGame.restart();
        }

        // Switch active game reference
        this.game = this.multiplayerGame;

        // Update helper's game reference
        this.helpers.setGame(this.multiplayerGame);

        // Initialize dual control scheme
        if (!this.dualControlScheme) {
            this.dualControlScheme = new DualControlScheme();
        } else {
            this.dualControlScheme.reset();
        }

        // Initialize the game
        this.multiplayerGame.init();

        // Initialize split screen camera
        if (!this.splitScreenCamera) {
            this.splitScreenCamera = new SplitScreenCamera(this.systems.renderingEngine.camera);
            this.splitScreenCamera.setPlayers([
                this.multiplayerGame.player1,
                this.multiplayerGame.player2,
            ]);
        } else {
            this.splitScreenCamera.setPlayers([
                this.multiplayerGame.player1,
                this.multiplayerGame.player2,
            ]);
        }

        // Initialize multiplayer UI
        this._initializeMultiplayerUI();

        // Common initialization tasks (using multiplayer game)
        this._commonInitialization();

        // Create UI
        this.createUI();

        // Handle audio and music for game start
        this.systems.audioManager.handleGameStart();
    }

    /**
     * Initialize multiplayer UI components
     * @private
     */
    _initializeMultiplayerUI() {
        if (this.helpers.initializeMultiplayerUI) {
            this.helpers.initializeMultiplayerUI(this.multiplayerGame);
        }
    }

    /**
     * Clean up Local Multiplayer mode
     */
    cleanup() {
        // Clean up multiplayer UI
        if (this.helpers.cleanupMultiplayerUI) {
            this.helpers.cleanupMultiplayerUI();
        }

        // Destroy UI
        this.destroyUI();

        // Reset game reference back to single player
        if (this.helpers.resetGameReference) {
            this.helpers.resetGameReference();
        }
    }

    /**
     * Handle game over for Local Multiplayer mode
     */
    handleGameOver() {
        if (this.helpers.showMultiplayerGameOver) {
            this.helpers.showMultiplayerGameOver();
        }
    }

    /**
     * Create Local Multiplayer mode UI
     */
    createUI() {
        if (this.systems.uiManager && this.systems.modeUI) {
            this.systems.uiManager.updateForMode(GameModes.LOCAL_MULTIPLAYER);
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
     * Destroy Local Multiplayer mode UI
     */
    destroyUI() {
        if (this.systems.modeUI) {
            this.systems.modeUI.hideAllModeUI();
        }
    }

    /**
     * Get the multiplayer game instance
     * @returns {MultiplayerGame} The multiplayer game instance
     */
    getMultiplayerGame() {
        return this.multiplayerGame;
    }

    /**
     * Get the split screen camera
     * @returns {SplitScreenCamera} The split screen camera
     */
    getSplitScreenCamera() {
        return this.splitScreenCamera;
    }

    /**
     * Get the dual control scheme
     * @returns {DualControlScheme} The dual control scheme
     */
    getDualControlScheme() {
        return this.dualControlScheme;
    }
}

module.exports = { MultiplayerMode };
