/**
 * Base class for game mode controllers
 * Provides common interface for all game modes
 */
class ModeController {
    /**
     * Create a mode controller
     * @param {Object} game - Game instance
     * @param {Object} systems - Game systems (rendering, audio, etc.)
     */
    constructor(game, systems) {
        this.game = game;
        this.systems = systems;
    }

    /**
     * Initialize the game mode
     * Sets up mode-specific configuration and components
     */
    initialize() {
        throw new Error('ModeController.initialize() must be implemented by subclass');
    }

    /**
     * Clean up the game mode
     * Removes mode-specific UI and resets state
     */
    cleanup() {
        throw new Error('ModeController.cleanup() must be implemented by subclass');
    }

    /**
     * Update the game mode
     * Called each frame during the game loop
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        // Default implementation does nothing
        // Subclasses can override if needed
    }

    /**
     * Handle game over for this mode
     * Shows mode-specific game over screen
     */
    handleGameOver() {
        throw new Error('ModeController.handleGameOver() must be implemented by subclass');
    }

    /**
     * Create mode-specific UI elements
     */
    createUI() {
        throw new Error('ModeController.createUI() must be implemented by subclass');
    }

    /**
     * Destroy mode-specific UI elements
     */
    destroyUI() {
        throw new Error('ModeController.destroyUI() must be implemented by subclass');
    }

    /**
     * Common initialization tasks for all modes
     * @protected
     */
    _commonInitialization() {
        // Reset systems
        this.systems.renderingEngine.clearTrails();
        this.systems.powerUpManager.reset();
        this.systems.statusIndicator.reset();

        // Reset glow effect system for new game
        if (this.systems.glowEffectManager && this.systems.glowEffectManager.initialized) {
            this.systems.glowEffectManager.handleGameRestart();
        }

        // Hide UI elements
        const gameOverElement = document.getElementById('gameOver');
        if (gameOverElement) {
            gameOverElement.style.display = 'none';
        }
        const restartBtn = document.getElementById('restart');
        if (restartBtn) {
            restartBtn.style.display = 'none';
        }

        // Update pause overlay
        this._updatePauseOverlay();
    }

    /**
     * Update pause overlay visibility
     * @protected
     */
    _updatePauseOverlay() {
        const gameState = this.game.getGameState();
        const pauseOverlayEl = document.getElementById('pauseOverlay');
        if (pauseOverlayEl) {
            if (gameState.isPaused) {
                pauseOverlayEl.style.display = 'flex';
            } else {
                pauseOverlayEl.style.display = 'none';
            }
        }
    }
}

module.exports = { ModeController };
