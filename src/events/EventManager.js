const { Logger } = require('../utils/Logger.js');

const logger = Logger.create('EventManager');

/**
 * EventManager - Manages all event listeners for the game
 * Centralizes event registration, delegation, and cleanup
 */
class EventManager {
    /**
     * @param {Object} dependencies - Required game systems
     * @param {Object} dependencies.game - Game instance
     * @param {Object} dependencies.playerController - Player controller
     * @param {Object} dependencies.audioManager - Audio manager
     * @param {Object} dependencies.renderingEngine - Rendering engine
     * @param {Object} dependencies.glowEffectManager - Glow effect manager
     * @param {Object} dependencies.cameraEffectsManager - Camera effects manager
     * @param {Object} dependencies.difficultyManager - Difficulty manager
     * @param {Object} dependencies.performanceDegradationManager - Performance manager
     * @param {Function} dependencies.restartGame - Restart game function
     * @param {Function} dependencies.updatePauseOverlay - Update pause overlay function
     * @param {Function} dependencies.updateMuteButton - Update mute button function
     * @param {Function} dependencies.updatePerformanceButton - Update performance button function
     * @param {Function} dependencies.setAICount - Set AI count function
     * @param {Function} dependencies.updateAICountUI - Update AI count UI function
     * @param {Function} dependencies.updateDifficultyUI - Update difficulty UI function
     */
    constructor(dependencies) {
        this.game = dependencies.game;
        this.playerController = dependencies.playerController;
        this.audioManager = dependencies.audioManager;
        this.renderingEngine = dependencies.renderingEngine;
        this.glowEffectManager = dependencies.glowEffectManager;
        this.cameraEffectsManager = dependencies.cameraEffectsManager;
        this.difficultyManager = dependencies.difficultyManager;
        this.performanceDegradationManager = dependencies.performanceDegradationManager;
        this.restartGame = dependencies.restartGame;
        this.updatePauseOverlay = dependencies.updatePauseOverlay;
        this.updateMuteButton = dependencies.updateMuteButton;
        this.updatePerformanceButton = dependencies.updatePerformanceButton;
        this.setAICount = dependencies.setAICount;
        this.updateAICountUI = dependencies.updateAICountUI;
        this.updateDifficultyUI = dependencies.updateDifficultyUI;

        this.listeners = [];
        this.audioInitialized = false;
    }

    /**
     * Register all event listeners
     */
    registerAll() {
        this.registerGameControls();
        this.registerUIControls();
        this.registerWindowEvents();
    }

    /**
     * Register game control event listeners
     */
    registerGameControls() {
        // Player controller initialization
        this.playerController.init();

        // Touch controls
        this.registerTouchControl('up', 'ArrowUp');
        this.registerTouchControl('down', 'ArrowDown');
        this.registerTouchControl('left', 'ArrowLeft');
        this.registerTouchControl('right', 'ArrowRight');
    }

    /**
     * Register UI control event listeners
     */
    registerUIControls() {
        // Restart button
        this.registerButtonClick('restart', () => {
            this.restartGame();
        });

        // Resume button
        this.registerButtonClick('resumeButton', () => {
            const resumeResult = this.game.resume();
            if (resumeResult) {
                this.updatePauseOverlay();

                // Ensure glow effects resume properly
                if (this.glowEffectManager && this.glowEffectManager.initialized) {
                    this.glowEffectManager.forceResume();
                }

                // Resume camera effects
                if (this.cameraEffectsManager && this.cameraEffectsManager.isEnabled()) {
                    this.cameraEffectsManager.resume();
                }
            } else {
                logger.debug('Resume operation failed - game may be in invalid state');
            }
        });

        // Mute button
        this.registerButtonClick('muteButton', () => {
            const currentMuteState = this.audioManager.getMuted();
            this.audioManager.setMuted(!currentMuteState);
            this.updateMuteButton();
        });

        // Performance button
        this.registerButtonClick('performanceButton', () => {
            const currentPerformanceMode =
                this.performanceDegradationManager.getSettings().performanceModeEnabled;
            this.performanceDegradationManager.setPerformanceMode(!currentPerformanceMode);
            this.updatePerformanceButton();
        });

        // AI count selection
        this.registerAICountButtons();

        // Difficulty selection
        this.registerDifficultyButtons();

        // Audio initialization on first user interaction
        this.registerAudioInitialization();
    }

    /**
     * Register window event listeners
     */
    registerWindowEvents() {
        // Window resize
        const resizeHandler = () => {
            if (this.renderingEngine) {
                this.renderingEngine.renderer.setSize(window.innerWidth, window.innerHeight);
                this.renderingEngine.camera.aspect = window.innerWidth / window.innerHeight;
                this.renderingEngine.camera.updateProjectionMatrix();

                if (this.glowEffectManager) {
                    this.glowEffectManager.handleResize(window.innerWidth, window.innerHeight);
                }
            }
        };
        window.addEventListener('resize', resizeHandler);
        this.listeners.push({ element: window, event: 'resize', handler: resizeHandler });

        // Page unload cleanup
        const unloadHandler = () => {
            try {
                if (this.audioManager) {
                    this.audioManager.cleanup();
                }
            } catch (error) {
                logger.warn('Error during music system cleanup:', error);
            }
        };
        window.addEventListener('beforeunload', unloadHandler);
        this.listeners.push({ element: window, event: 'beforeunload', handler: unloadHandler });
    }

    /**
     * Register a button click event
     * @param {string} buttonId - Button element ID
     * @param {Function} handler - Click handler function
     */
    registerButtonClick(buttonId, handler) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', handler);
            this.listeners.push({ element: button, event: 'click', handler });
        }
    }

    /**
     * Register a touch control
     * @param {string} buttonId - Button element ID
     * @param {string} direction - Arrow key direction
     */
    registerTouchControl(buttonId, direction) {
        const button = document.getElementById(buttonId);
        if (button) {
            const handler = () => {
                const directionChanged = this.game.changePlayerDirection(direction);
                if (directionChanged) {
                    this.audioManager.playTurnSound();
                }
            };
            button.addEventListener('touchstart', handler);
            this.listeners.push({ element: button, event: 'touchstart', handler });
        }
    }

    /**
     * Register AI count button listeners
     */
    registerAICountButtons() {
        const aiCountButtons = document.querySelectorAll('.ai-count-btn');
        aiCountButtons.forEach((button) => {
            const handler = () => {
                const selectedCount = parseInt(button.getAttribute('data-count'));
                this.setAICount(selectedCount);
                this.updateAICountUI();
            };
            button.addEventListener('click', handler);
            this.listeners.push({ element: button, event: 'click', handler });
        });
    }

    /**
     * Register difficulty button listeners
     */
    registerDifficultyButtons() {
        const difficultyButtons = document.querySelectorAll('.difficulty-btn');
        difficultyButtons.forEach((button) => {
            const handler = () => {
                const selectedLevel = button.getAttribute('data-level');
                this.difficultyManager.setDifficulty(selectedLevel);
                this.updateDifficultyUI();
            };
            button.addEventListener('click', handler);
            this.listeners.push({ element: button, event: 'click', handler });
        });
    }

    /**
     * Register audio initialization on first user interaction
     */
    registerAudioInitialization() {
        const initializeAudio = async () => {
            if (!this.audioInitialized) {
                this.audioInitialized = true;
                const audioInitSuccess = await this.audioManager.initialize();

                if (audioInitSuccess && this.audioManager.isMusicAvailable()) {
                    logger.info('Music system ready for playback');
                } else {
                    logger.warn('Music system not available, continuing without background music');
                }
            }
        };

        document.addEventListener('click', initializeAudio, { once: true });
        document.addEventListener('keydown', initializeAudio, { once: true });
        document.addEventListener('touchstart', initializeAudio, { once: true });
    }

    /**
     * Unregister all event listeners
     */
    unregisterAll() {
        this.listeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.listeners = [];
    }
}

module.exports = { EventManager };
