/**
 * UIManager - Coordinates all UI components and manages UI state
 * Centralizes UI initialization, mode updates, and game over displays
 */
class UIManager {
    constructor() {
        this.gameOverUI = null;
        this.modeUI = null;
        this.styleManager = null;
        this.currentMode = null;
    }

    /**
     * Initialize UI manager with required dependencies
     * @param {Object} dependencies - UI dependencies (gameOverUI, modeUI, styleManager)
     */
    initialize(dependencies) {
        this.gameOverUI = dependencies.gameOverUI;
        this.modeUI = dependencies.modeUI;
        this.styleManager = dependencies.styleManager;
    }

    /**
     * Update UI for the current game mode
     * @param {string} mode - Game mode (CLASSIC, TIME_TRIAL, ARENA_SHRINK, LOCAL_MULTIPLAYER)
     */
    updateForMode(mode) {
        this.currentMode = mode;

        // Hide all mode-specific UI first
        if (this.modeUI) {
            this.modeUI.hideAllModeUI();
        }

        // Update UI visibility based on mode
        this.updateUIVisibility(mode);
    }

    /**
     * Update UI element visibility based on game mode
     * @param {string} mode - Current game mode
     */
    updateUIVisibility(mode) {
        const difficultySelector = document.getElementById('difficultySelector');
        const aiCountSelector = document.getElementById('aiCountSelector');

        // Define which UI elements should be visible for each mode
        const uiConfig = {
            TIME_TRIAL: {
                difficultySelector: false,
                aiCountSelector: false,
            },
            ARENA_SHRINK: {
                difficultySelector: false,
                aiCountSelector: true,
            },
            LOCAL_MULTIPLAYER: {
                difficultySelector: false,
                aiCountSelector: false,
            },
            CLASSIC: {
                difficultySelector: true,
                aiCountSelector: true,
            },
        };

        const config = uiConfig[mode] || uiConfig.CLASSIC;

        // Apply visibility settings
        if (difficultySelector) {
            if (config.difficultySelector) {
                difficultySelector.classList.remove('ui-hidden');
            } else {
                difficultySelector.classList.add('ui-hidden');
            }
        }

        if (aiCountSelector) {
            if (config.aiCountSelector) {
                aiCountSelector.classList.remove('ui-hidden');
            } else {
                aiCountSelector.classList.add('ui-hidden');
            }
        }
    }

    /**
     * Show game over screen based on game mode
     * @param {Object} gameState - Current game state
     * @param {string} mode - Game mode
     * @param {Object} callbacks - Callbacks for game over actions
     */
    showGameOver(gameState, mode, callbacks = {}) {
        if (!this.gameOverUI) {
            console.error('GameOverUI not initialized');
            return;
        }

        // Delegate to GameOverUI
        this.gameOverUI.show(gameState, mode, callbacks);
    }

    /**
     * Hide game over screen
     */
    hideGameOver() {
        if (this.gameOverUI) {
            this.gameOverUI.hide();
        }

        // Hide standard game over elements
        const gameOverElement = document.getElementById('gameOver');
        if (gameOverElement) {
            gameOverElement.style.display = 'none';
        }
        const restartBtn = document.getElementById('restart');
        if (restartBtn) {
            restartBtn.style.display = 'none';
        }
    }

    /**
     * Create mode-specific UI elements
     * @param {string} mode - Game mode
     */
    createModeUI(mode) {
        if (!this.modeUI) {
            console.error('ModeUI not initialized');
            return;
        }

        this.modeUI.createUI(mode);
    }

    /**
     * Update mode-specific UI display
     * @param {string} mode - Game mode
     * @param {Object} gameState - Current game state
     */
    updateModeDisplay(mode, gameState) {
        if (!this.modeUI) {
            return;
        }

        this.modeUI.updateDisplay(mode, gameState);
    }

    /**
     * Hide mode-specific UI elements
     * @param {string} mode - Game mode
     */
    hideModeUI(mode) {
        if (!this.modeUI) {
            return;
        }

        this.modeUI.hideUI(mode);
    }

    /**
     * Get current game mode
     * @returns {string} Current mode
     */
    getCurrentMode() {
        return this.currentMode;
    }
}

module.exports = { UIManager };
