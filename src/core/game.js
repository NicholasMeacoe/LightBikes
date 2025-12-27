const { ScoreManager } = require('../systems/scoreManager.js');
const { GameModes } = require('../systems/GameModes.js');
const { SurvivalTimer } = require('../ui/SurvivalTimer.js');
const { ArenaShrinker } = require('../systems/ArenaShrinker.js');
const { AIController } = require('./AIController.js');

/**
 * Game - Core game logic and state management
 *
 * Orchestrates the game loop, player movement, collision detection,
 * and integration with other systems like AI, scoring, and effects.
 */
class Game {
    /**
     * Create a new Game instance
     * @param {string} [mode=GameModes.CLASSIC] - Game mode
     * @param {Object} [config={}] - Game configuration
     * @param {number} [config.aiCount=1] - Number of AI opponents (1-4)
     */
    constructor(mode = GameModes.CLASSIC, config = {}) {
        this.bounds = 30;
        this.isPaused = false;
        this.gameSpeed = 0.1; // Default game speed
        this.scoreManager = new ScoreManager();
        this.powerUpManager = null; // Will be set by orchestrator
        this.cameraEffectsManager = null; // Will be set by orchestrator
        this.gameMode = mode;

        // Game configuration system for AI count selection (2-4 opponents)
        this.gameConfig = {
            aiCount: this.validateAICount(config.aiCount || 1), // Default to 1 for backward compatibility
            maxEntities: 5, // player + 4 AIs
            personalities: ['aggressive', 'defensive', 'erratic'],
            colors: ['red', 'blue', 'yellow', 'purple'],
        };

        this.aiController = new AIController(this.gameConfig, this.bounds);

        // Initialize mode-specific components
        if (this.gameMode === GameModes.TIME_TRIAL) {
            this.survivalTimer = new SurvivalTimer();
            this.arenaShrinker = null;
        } else if (this.gameMode === GameModes.ARENA_SHRINK) {
            this.survivalTimer = new SurvivalTimer(); // Arena shrink also tracks survival time
            this.arenaShrinker = new ArenaShrinker();
        } else {
            this.survivalTimer = null;
            this.arenaShrinker = null;
        }

        this.init();
    }

    /**
     * Set the game speed
     * @param {number} speed - Game speed multiplier (must be > 0)
     */
    setGameSpeed(speed) {
        if (typeof speed === 'number' && speed > 0) {
            this.gameSpeed = speed;
        }
    }

    /**
     * Validate AI count to ensure it's within acceptable range (1-4)
     * @param {number} count - Requested AI count
     * @returns {number} Validated AI count
     */
    validateAICount(count) {
        if (typeof count !== 'number' || count < 1 || count > 4) {
            return 1; // Default to 1 for backward compatibility
        }
        return Math.floor(count);
    }

    /**
     * Add AI opponent to the game
     * @param {Object} aiConfig - AI configuration
     * @returns {boolean} Success status
     */
    addAI(aiConfig = {}) {
        const success = this.aiController.addAI(aiConfig);
        if (success) {
            this.gameConfig.aiCount = this.aiController.getOpponents().length;
        }
        return success;
    }

    /**
     * Remove AI opponent from the game
     * @param {string} aiId - AI opponent ID
     * @returns {boolean} Success status
     */
    removeAI(aiId) {
        const success = this.aiController.removeAI(aiId);
        if (success) {
            this.gameConfig.aiCount = this.aiController.getOpponents().length;
        }
        return success;
    }

    /**
     * Get all alive entities (player + alive AI opponents)
     * @returns {Array} Array of alive entities
     */
    getAliveEntities() {
        const entities = [];

        // Add player if alive (not crashed)
        if (!this.gameOver) {
            entities.push({
                id: 'player',
                type: 'player',
                x: this.player.x,
                y: this.player.y,
                z: this.player.z,
                direction: this.playerDirection,
                trail: this.playerTrail,
                alive: true,
            });
        }

        // Add alive AI opponents
        const aiEntities = this.aiController.getAliveEntities();
        entities.push(...aiEntities);

        return entities;
    }

    /**
     * Get current arena boundaries (static or dynamic based on game mode)
     * @returns {Object} Boundary coordinates {minX, maxX, minZ, maxZ}
     */
    getBounds() {
        if (this.gameMode === GameModes.ARENA_SHRINK && this.arenaShrinker) {
            return this.arenaShrinker.getCurrentBounds();
        } else {
            // Static boundaries for Classic and Time Trial modes
            const halfSize = this.bounds / 2;
            return {
                minX: -halfSize,
                maxX: halfSize,
                minZ: -halfSize,
                maxZ: halfSize,
                size: this.bounds,
            };
        }
    }

    /**
     * Check if boundaries are dynamic (change during gameplay)
     * @returns {boolean} True if boundaries are dynamic
     */
    hasDynamicBounds() {
        return this.gameMode === GameModes.ARENA_SHRINK && this.arenaShrinker !== null;
    }

    /**
     * Get next boundary position (for preview during warnings)
     * Only applicable in Arena Shrink mode
     * @returns {Object|null} Next boundary coordinates or null if not applicable
     */
    getNextBounds() {
        if (this.gameMode === GameModes.ARENA_SHRINK && this.arenaShrinker) {
            return this.arenaShrinker.getNextBounds();
        }
        return null;
    }

    /**
     * Check if boundary warning is currently active
     * Only applicable in Arena Shrink mode
     * @returns {boolean} True if warning is active
     */
    isBoundaryWarningActive() {
        if (this.gameMode === GameModes.ARENA_SHRINK && this.arenaShrinker) {
            return this.arenaShrinker.isWarningActive();
        }
        return false;
    }

    /**
     * Check if grace period is currently active
     * Only applicable in Arena Shrink mode
     * @returns {boolean} True if grace period is active
     */
    isGracePeriodActive() {
        if (this.gameMode === GameModes.ARENA_SHRINK && this.arenaShrinker) {
            return this.arenaShrinker.isGracePeriodActive();
        }
        return false;
    }

    /**
     * Get the current state of the game
     * @returns {Object} Game state object containing player, AI, score, and config data
     */
    getGameState() {
        const baseState = {
            bounds: this.bounds,
            player: this.player,
            playerDirection: this.playerDirection,
            playerTrail: this.playerTrail,
            isPaused: this.isPaused,
            frameCount: this.frameCount,
            gameStarted: this.gameStarted,
            gameOver: this.gameOver,
            gameSpeed: this.gameSpeed,
            gameMode: this.gameMode,
            gameConfig: this.gameConfig,
            ...this.scoreManager.getScoreState(),
        };

        // Include AI state - return aiOpponents array for multi-AI support
        if (this.gameMode === GameModes.CLASSIC || this.gameMode === GameModes.ARENA_SHRINK) {
            baseState.aiOpponents = this.aiOpponents;
            // Maintain backward compatibility with single AI properties
            baseState.ai = this.aiOpponents.length > 0 ? this.aiOpponents[0] : null;
            baseState.aiDirection =
                this.aiOpponents.length > 0 ? this.aiOpponents[0].direction : null;
            baseState.aiTrail = this.aiOpponents.length > 0 ? this.aiOpponents[0].trail : [];
        } else {
            // Explicitly set AI to null in Time Trial mode
            baseState.aiOpponents = [];
            baseState.ai = null;
            baseState.aiDirection = null;
            baseState.aiTrail = [];
        }

        // Include dynamic boundaries for AI access in Arena Shrink mode
        if (this.gameMode === GameModes.ARENA_SHRINK && this.arenaShrinker) {
            baseState.dynamicBounds = this.arenaShrinker.getCurrentBounds();
        }

        // Include timer state in Time Trial mode
        if (this.gameMode === GameModes.TIME_TRIAL && this.survivalTimer) {
            baseState.survivalTime = this.survivalTimer.getElapsedTime();
            baseState.formattedSurvivalTime = this.survivalTimer.getCurrentFormattedTime();
            baseState.timerRunning = this.survivalTimer.isRunning;
        }

        // Include arena shrink state in Arena Shrink mode
        if (this.gameMode === GameModes.ARENA_SHRINK) {
            if (this.survivalTimer) {
                baseState.survivalTime = this.survivalTimer.getElapsedTime();
                baseState.formattedSurvivalTime = this.survivalTimer.getCurrentFormattedTime();
                baseState.timerRunning = this.survivalTimer.isRunning;
            }
            if (this.arenaShrinker) {
                const currentTime = Date.now();
                baseState.arenaState = this.arenaShrinker.getArenaState(currentTime);
                baseState.dynamicBounds = this.arenaShrinker.getCurrentBounds();
            }
        }

        return baseState;
    }

    /**
     * Initialize or reset game state
     * Resets player, AI, and game metrics to starting values
     */
    init() {
        this.gameOver = false;
        this.frameCount = 0;
        this.isPaused = false;
        this.gameStarted = false;

        this.player = { x: 0, y: 0, z: 0 };
        this.playerDirection = { x: 1, y: 0, z: 0 };
        this.playerTrail = [];
        this.playerPreviousPosition = { x: 0, y: 0, z: 0 };
        this.previousPlayerSpeed = this.gameSpeed; // Reset speed tracking

        // Initialize aiOpponents array via AIController
        this.aiOpponents = [];

        // Initialize AI in Classic and Arena Shrink modes
        if (this.gameMode === GameModes.CLASSIC || this.gameMode === GameModes.ARENA_SHRINK) {
            this.aiController.initialize();
            this.aiOpponents = this.aiController.getOpponents();

            // Maintain backward compatibility properties for existing code
            if (this.aiOpponents.length > 0) {
                this.ai = this.aiOpponents[0];
                this.aiDirection = this.aiOpponents[0].direction;
                this.aiTrail = this.aiOpponents[0].trail;
                this.aiPreviousPosition = this.aiOpponents[0].previousPosition;
            } else {
                this.ai = null;
                this.aiDirection = null;
                this.aiTrail = [];
                this.aiPreviousPosition = null;
            }
        } else {
            // Set AI to null in Time Trial mode
            this.ai = null;
            this.aiDirection = null;
            this.aiTrail = [];
            this.aiPreviousPosition = null;
        }

        // Reset timer in Time Trial mode
        if (this.gameMode === GameModes.TIME_TRIAL && this.survivalTimer) {
            this.survivalTimer.reset();
        }

        // Reset arena shrinker in Arena Shrink mode
        if (this.gameMode === GameModes.ARENA_SHRINK && this.arenaShrinker) {
            this.arenaShrinker.reset();
        }

        // Reset camera effects on game restart
        if (this.cameraEffectsManager && this.cameraEffectsManager.isEnabled()) {
            this.cameraEffectsManager.reset();
        }
    }

    /**
     * Update game state for the current frame
     * Handles movement, trails, and game logic
     */
    update() {
        if (this.gameOver || this.isPaused) return;

        // Mark game as started on first update
        if (!this.gameStarted) {
            this.gameStarted = true;

            // Start survival timer in Time Trial mode
            if (this.gameMode === GameModes.TIME_TRIAL && this.survivalTimer) {
                this.survivalTimer.start();
            }

            // Initialize and start arena shrinker in Arena Shrink mode
            if (this.gameMode === GameModes.ARENA_SHRINK) {
                if (this.survivalTimer) {
                    this.survivalTimer.start();
                }
                if (this.arenaShrinker) {
                    this.arenaShrinker.initialize(Date.now());
                }
            }
        }

        this.frameCount++;

        // Update arena shrinker in Arena Shrink mode
        if (this.gameMode === GameModes.ARENA_SHRINK && this.arenaShrinker) {
            this.arenaShrinker.update(Date.now());
        }

        // Get speed multipliers from power-up system if available
        const playerSpeedMultiplier = this.powerUpManager
            ? this.powerUpManager.getSpeedMultiplier('player')
            : 1.0;
        const currentPlayerSpeed = this.gameSpeed * playerSpeedMultiplier;

        // Track previous speed for camera effects
        if (!this.previousPlayerSpeed) {
            this.previousPlayerSpeed = this.gameSpeed;
        }

        // Move Player with speed boost integration
        this.player.x += this.playerDirection.x * currentPlayerSpeed;
        this.player.z += this.playerDirection.z * currentPlayerSpeed;

        // Trigger speed change event for camera effects if speed changed significantly
        if (
            this.cameraEffectsManager &&
            Math.abs(currentPlayerSpeed - this.previousPlayerSpeed) > 0.01
        ) {
            this.cameraEffectsManager.onSpeedChange(this.player, currentPlayerSpeed);
        }

        // Update previous speed for next frame
        this.previousPlayerSpeed = currentPlayerSpeed;

        // Create Player Trail
        this.playerTrail.push({ ...this.player });

        // Update AI opponents in Classic and Arena Shrink modes
        if (
            (this.gameMode === GameModes.CLASSIC || this.gameMode === GameModes.ARENA_SHRINK) &&
            this.aiOpponents.length > 0
        ) {
            this.aiController.update(this.gameSpeed);

            // Maintain backward compatibility - update legacy properties with first AI
            if (this.aiOpponents.length > 0) {
                this.ai = this.aiOpponents[0];
                this.aiDirection = this.aiOpponents[0].direction;
                this.aiTrail = this.aiOpponents[0].trail;
            }
        }
    }

    /**
     * Change player direction based on input
     * @param {string} key - Key code (ArrowUp, ArrowDown, ArrowLeft, ArrowRight)
     * @returns {boolean} True if direction changed, false otherwise
     */
    changePlayerDirection(key) {
        if (!key || typeof key !== 'string') {
            return; // Handle invalid input gracefully
        }

        let directionChanged = false;
        const previousDirection = { ...this.playerDirection };

        switch (key) {
            case 'ArrowUp':
                if (this.playerDirection.z === 0) {
                    this.playerDirection = { x: 0, y: 0, z: -1 };
                    directionChanged = true;
                }
                break;
            case 'ArrowDown':
                if (this.playerDirection.z === 0) {
                    this.playerDirection = { x: 0, y: 0, z: 1 };
                    directionChanged = true;
                }
                break;
            case 'ArrowLeft':
                if (this.playerDirection.x === 0) {
                    this.playerDirection = { x: -1, y: 0, z: 0 };
                    directionChanged = true;
                }
                break;
            case 'ArrowRight':
                if (this.playerDirection.x === 0) {
                    this.playerDirection = { x: 1, y: 0, z: 0 };
                    directionChanged = true;
                }
                break;
            default:
                // Handle unknown keys gracefully by doing nothing
                break;
        }

        // Return whether direction actually changed for audio trigger
        return directionChanged;
    }

    /**
     * Pause the game
     * @returns {boolean} True if paused successfully, false if game over
     */
    pause() {
        // Prevent pause during game over conditions
        if (this.gameOver) {
            return false;
        }

        // Handle multiple pause attempts gracefully
        if (this.isPaused) {
            return true; // Already paused, return success
        }

        this.isPaused = true;

        // Pause camera effects
        if (this.cameraEffectsManager && this.cameraEffectsManager.isEnabled()) {
            this.cameraEffectsManager.pause();
        }

        // Pause survival timer in Time Trial mode
        if (this.gameMode === GameModes.TIME_TRIAL && this.survivalTimer) {
            this.survivalTimer.pause();
        }

        // Pause arena shrinking in Arena Shrink mode
        if (this.gameMode === GameModes.ARENA_SHRINK) {
            if (this.survivalTimer) {
                this.survivalTimer.pause();
            }
            // Note: ArenaShrinker pausing is handled by the game loop not calling update()
        }

        return true;
    }

    /**
     * Resume the game from paused state
     * @returns {boolean} True if resumed successfully, false if not paused or game over
     */
    resume() {
        // Validate resume operation - only resume if currently paused
        if (!this.isPaused) {
            return false; // Not paused, cannot resume
        }

        // Prevent resume during game over conditions
        if (this.gameOver) {
            return false;
        }

        this.isPaused = false;

        // Resume camera effects
        if (this.cameraEffectsManager && this.cameraEffectsManager.isEnabled()) {
            this.cameraEffectsManager.resume();
        }

        // Resume survival timer in Time Trial mode
        if (this.gameMode === GameModes.TIME_TRIAL && this.survivalTimer) {
            this.survivalTimer.resume();
        }

        // Resume arena shrinking in Arena Shrink mode
        if (this.gameMode === GameModes.ARENA_SHRINK) {
            if (this.survivalTimer) {
                this.survivalTimer.resume();
            }
            // Note: ArenaShrinker resuming is handled by the game loop calling update() again
        }

        return true;
    }

    /**
     * Toggle pause state
     * @returns {boolean} True if state changed successfully
     */
    togglePause() {
        // Prevent toggle during game over conditions
        if (this.gameOver) {
            return false;
        }

        if (this.isPaused) {
            return this.resume();
        } else {
            return this.pause();
        }
    }

    /**
     * Handle the end of a round based on collision results
     * Updates scores based on who crashed
     * @param {Object} collisionResult - Result from collision detection
     * @param {boolean} collisionResult.playerCollided - Whether player crashed
     * @param {boolean} collisionResult.aiCollided - Whether AI crashed
     */
    handleRoundEnd(collisionResult) {
        if (!collisionResult) return;

        const { playerCollided, aiCollided } = collisionResult;

        // Stop survival timer in Time Trial mode when game ends
        if (this.gameMode === GameModes.TIME_TRIAL) {
            this.stopSurvivalTimer();
        }

        // Stop survival timer and arena shrinking in Arena Shrink mode when game ends
        if (this.gameMode === GameModes.ARENA_SHRINK) {
            this.stopSurvivalTimer();
            // Stop survival tracking in arena shrinker
            if (this.arenaShrinker) {
                this.arenaShrinker.stopSurvivalTracking(Date.now());
            }
        }

        // Determine winner and update scores (only relevant for Classic mode)
        if (this.gameMode === GameModes.CLASSIC) {
            if (playerCollided && !aiCollided) {
                // AI wins
                this.scoreManager.incrementAIScore();
            } else if (aiCollided && !playerCollided) {
                // Player wins
                this.scoreManager.incrementPlayerScore();
            }
            // If both crashed or neither crashed, no score change (tie)
        }
    }

    /**
     * Restart the game
     * Resets scores and re-initializes game state
     */
    restart() {
        this.scoreManager.resetCurrentScores();
        this.init();
    }

    /**
     * Start the survival timer (for Time Trial and Arena Shrink modes)
     * Called after countdown completion
     */
    startSurvivalTimer() {
        if (
            (this.gameMode === GameModes.TIME_TRIAL || this.gameMode === GameModes.ARENA_SHRINK) &&
            this.survivalTimer
        ) {
            this.survivalTimer.start();
        }
    }

    /**
     * Stop the survival timer (for Time Trial and Arena Shrink modes)
     * Called when game ends
     */
    stopSurvivalTimer() {
        if (
            (this.gameMode === GameModes.TIME_TRIAL || this.gameMode === GameModes.ARENA_SHRINK) &&
            this.survivalTimer
        ) {
            this.survivalTimer.stop();
        }
    }

    /**
     * Get current survival time in milliseconds
     * @returns {number} Survival time in milliseconds, or 0 if not in Time Trial or Arena Shrink mode
     */
    getSurvivalTime() {
        if (
            (this.gameMode === GameModes.TIME_TRIAL || this.gameMode === GameModes.ARENA_SHRINK) &&
            this.survivalTimer
        ) {
            return this.survivalTimer.getElapsedTime();
        }
        return 0;
    }

    /**
     * Get formatted survival time
     * @returns {string} Formatted time string (MM:SS.SS)
     */
    getFormattedSurvivalTime() {
        if (
            (this.gameMode === GameModes.TIME_TRIAL || this.gameMode === GameModes.ARENA_SHRINK) &&
            this.survivalTimer
        ) {
            return this.survivalTimer.getCurrentFormattedTime();
        }
        return '00:00.00';
    }

    /**
     * Check if game is in Time Trial mode
     * @returns {boolean} True if in Time Trial mode
     */
    isTimeTrialMode() {
        return this.gameMode === GameModes.TIME_TRIAL;
    }

    /**
     * Check if game is in Arena Shrink mode
     * @returns {boolean} True if in Arena Shrink mode
     */
    isArenaShrinkMode() {
        return this.gameMode === GameModes.ARENA_SHRINK;
    }

    /**
     * Set the game mode to Time Trial or Classic
     * @param {boolean} isTimeTrialMode - True for Time Trial, false for Classic
     */
    setTimeTrialMode(isTimeTrialMode) {
        const newMode = isTimeTrialMode ? GameModes.TIME_TRIAL : GameModes.CLASSIC;
        this.setGameMode(newMode);
    }

    /**
     * Set the game mode
     * @param {string} mode - Game mode (GameModes.CLASSIC, GameModes.TIME_TRIAL, or GameModes.ARENA_SHRINK)
     */
    setGameMode(mode) {
        if (this.gameMode !== mode) {
            this.gameMode = mode;

            // Initialize or cleanup components based on mode
            if (mode === GameModes.TIME_TRIAL) {
                if (!this.survivalTimer) {
                    this.survivalTimer = new SurvivalTimer();
                }
                this.arenaShrinker = null;
            } else if (mode === GameModes.ARENA_SHRINK) {
                if (!this.survivalTimer) {
                    this.survivalTimer = new SurvivalTimer();
                }
                if (!this.arenaShrinker) {
                    this.arenaShrinker = new ArenaShrinker();
                }
            } else {
                // Classic mode
                this.survivalTimer = null;
                this.arenaShrinker = null;
            }

            // Reinitialize game state for new mode
            this.init();
        }
    }

    /**
     * Set the PowerUpManager reference for integration
     * Called by the orchestrator to enable power-up effect integration
     */
    setPowerUpManager(powerUpManager) {
        this.powerUpManager = powerUpManager;
        if (this.aiController) {
            this.aiController.setPowerUpManager(powerUpManager);
        }
    }

    /**
     * Set the CameraEffectsManager reference for integration
     * Called by the orchestrator to enable camera effects integration
     */
    setCameraEffectsManager(cameraEffectsManager) {
        this.cameraEffectsManager = cameraEffectsManager;
    }

    /**
     * Set callback for arena shrink warning events
     * @param {Function} callback - Function to call when shrink warning activates
     */
    setOnShrinkWarning(callback) {
        if (this.gameMode === GameModes.ARENA_SHRINK && this.arenaShrinker) {
            this.arenaShrinker.setOnWarning(callback);
        }
    }

    /**
     * Set callback for arena shrink events
     * @param {Function} callback - Function to call when arena shrinks
     */
    setOnShrink(callback) {
        if (this.gameMode === GameModes.ARENA_SHRINK && this.arenaShrinker) {
            this.arenaShrinker.setOnShrink(callback);
        }
    }

    /**
     * Set callback for final arena events
     * @param {Function} callback - Function to call when minimum arena size is reached
     */
    setOnFinalArena(callback) {
        if (this.gameMode === GameModes.ARENA_SHRINK && this.arenaShrinker) {
            this.arenaShrinker.setOnFinalArena(callback);
        }
    }

    /**
     * Get arena shrinker instance (for advanced integration)
     * @returns {ArenaShrinker|null} ArenaShrinker instance or null if not in shrink mode
     */
    getArenaShrinker() {
        return this.arenaShrinker;
    }

    /**
     * Get survival statistics for Arena Shrink mode
     * @returns {Object|null} Survival statistics or null if not in Arena Shrink mode
     */
    getArenaShrinkSurvivalStats() {
        if (this.gameMode === GameModes.ARENA_SHRINK && this.arenaShrinker) {
            return this.arenaShrinker.getSurvivalStatistics();
        }
        return null;
    }

    /**
     * Get arena size progression history for Arena Shrink mode
     * @returns {Array|null} Arena size history or null if not in Arena Shrink mode
     */
    getArenaSizeHistory() {
        if (this.gameMode === GameModes.ARENA_SHRINK && this.arenaShrinker) {
            return this.arenaShrinker.getArenaSizeHistory();
        }
        return null;
    }

    /**
     * Get number of shrinks survived in Arena Shrink mode
     * @returns {number} Number of shrinks survived, or 0 if not in Arena Shrink mode
     */
    getShrinksSurvived() {
        if (this.gameMode === GameModes.ARENA_SHRINK && this.arenaShrinker) {
            return this.arenaShrinker.getShrinkCount();
        }
        return 0;
    }
}

module.exports = { Game };
