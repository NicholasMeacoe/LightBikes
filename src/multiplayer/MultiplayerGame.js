// @ts-nocheck - Multi argument changePlayerDirection() overrides base single argument version
const { Game } = require('../core/game.js');
const { PlayerEntity } = require('./PlayerEntity.js');
const { GameModes } = require('../systems/GameModes.js');
const { LocalScoring } = require('../systems/LocalScoring.js');

/**
 * MultiplayerGame - Extends Game class to support local 2-player multiplayer
 * Manages two human players instead of player + AI
 */
class MultiplayerGame extends Game {
    /**
     * Create a new MultiplayerGame instance
     * @param {Object} config - Game configuration
     */
    constructor(config = {}) {
        // Initialize parent with local multiplayer mode
        super(GameModes.CLASSIC, config);

        // Override game mode to indicate multiplayer
        this.gameMode = 'local-multiplayer';

        // Set up control schemes after parent constructor
        this.controlSchemes = {
            player1: {
                up: 'ArrowUp',
                down: 'ArrowDown',
                left: 'ArrowLeft',
                right: 'ArrowRight',
            },
            player2: {
                up: 'KeyW',
                down: 'KeyS',
                left: 'KeyA',
                right: 'KeyD',
            },
        };

        // Local scoring system
        this.localScoring = new LocalScoring();

        // Player entities (will be initialized in initializeMultiplayer)
        this.player1 = null;
        this.player2 = null;

        // Track last round winner for UI display
        this.lastRoundWinner = null;

        // Initialize multiplayer-specific state after everything is set up
        this.initializeMultiplayer();
    }

    /**
     * Initialize multiplayer-specific components
     */
    initializeMultiplayer() {
        // Create player entities with distinct starting positions
        const startPos1 = { x: -10, y: 0, z: 0 };
        const startPos2 = { x: 10, y: 0, z: 0 };

        this.player1 = new PlayerEntity('P1', 'green', startPos1, this.controlSchemes.player1);
        this.player2 = new PlayerEntity('P2', 'blue', startPos2, this.controlSchemes.player2);

        // Set initial directions (facing each other)
        this.player1.direction = { x: 1, y: 0, z: 0 }; // Right
        this.player2.direction = { x: -1, y: 0, z: 0 }; // Left
    }

    /**
     * Override parent init method for multiplayer setup
     */
    init() {
        // Call parent init but skip AI initialization
        this.gameOver = false;
        this.frameCount = 0;
        this.isPaused = false;
        this.gameStarted = false;

        // Only initialize multiplayer if control schemes are set up
        if (this.controlSchemes) {
            // Reset multiplayer players
            if (this.player1 && this.player2) {
                const startPos1 = { x: -10, y: 0, z: 0 };
                const startPos2 = { x: 10, y: 0, z: 0 };

                this.player1.reset(startPos1);
                this.player2.reset(startPos2);

                // Set facing directions
                this.player1.direction = { x: 1, y: 0, z: 0 };
                this.player2.direction = { x: -1, y: 0, z: 0 };
            } else {
                this.initializeMultiplayer();
            }
        }

        // Clear legacy single-player properties
        this.player = null;
        this.playerDirection = null;
        this.playerTrail = [];
        this.ai = null;
        this.aiDirection = null;
        this.aiTrail = [];
        this.aiOpponents = [];

        // Reset camera effects on game restart
        if (this.cameraEffectsManager && this.cameraEffectsManager.isEnabled()) {
            this.cameraEffectsManager.reset();
        }

        // Initialize mode-specific components (inherited from parent)
        if (this.gameMode === GameModes.TIME_TRIAL && this.survivalTimer) {
            this.survivalTimer.reset();
        }
        if (this.gameMode === GameModes.ARENA_SHRINK && this.arenaShrinker) {
            this.arenaShrinker.reset();
        }
    }

    /**
     * Override parent update method for dual player management
     */
    update() {
        if (this.gameOver || this.isPaused) return;

        // Mark game as started on first update
        if (!this.gameStarted) {
            this.gameStarted = true;

            // Start timers for time-based modes (inherited behavior)
            if (this.gameMode === GameModes.TIME_TRIAL && this.survivalTimer) {
                this.survivalTimer.start();
            }
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

        // Update arena shrinker if in shrink mode
        if (this.gameMode === GameModes.ARENA_SHRINK && this.arenaShrinker) {
            this.arenaShrinker.update(Date.now());
        }

        // Get speed multipliers from power-up system if available
        const player1SpeedMultiplier = this.powerUpManager
            ? this.powerUpManager.getSpeedMultiplier('player1')
            : 1.0;
        const player2SpeedMultiplier = this.powerUpManager
            ? this.powerUpManager.getSpeedMultiplier('player2')
            : 1.0;

        // Update both players
        if (this.player1 && this.player1.isAlive) {
            this.player1.update(this.gameSpeed, player1SpeedMultiplier);

            // Trigger speed change event for camera effects
            if (this.cameraEffectsManager) {
                const currentSpeed = this.player1.getEffectiveSpeed();
                this.cameraEffectsManager.onSpeedChange(this.player1.getPosition(), currentSpeed);
            }
        }

        if (this.player2 && this.player2.isAlive) {
            this.player2.update(this.gameSpeed, player2SpeedMultiplier);

            // Trigger speed change event for camera effects
            if (this.cameraEffectsManager) {
                const currentSpeed = this.player2.getEffectiveSpeed();
                this.cameraEffectsManager.onSpeedChange(this.player2.getPosition(), currentSpeed);
            }
        }
    }

    /**
     * Get current direction for a specific player
     * @param {string} playerId - 'P1' or 'P2'
     * @returns {Object|null} Current player direction or null if player doesn't exist
     */
    getPlayerDirection(playerId) {
        const player = playerId === 'P1' ? this.player1 : this.player2;
        return player ? player.direction : null;
    }

    /**
     * Handle direction change for a specific player
     * @param {string} playerId - 'P1' or 'P2'
     * @param {string} key - Key pressed
     * @returns {boolean} True if direction was changed
     */
    changePlayerDirection(playerId, key, ...args) {
        const player = playerId === 'P1' ? this.player1 : this.player2;
        if (!player || !player.canChangeDirection()) {
            return false;
        }

        const controlScheme =
            playerId === 'P1' ? this.controlSchemes.player1 : this.controlSchemes.player2;
        let newDirection = null;

        // Map key to direction based on control scheme
        if (key === controlScheme.up) {
            newDirection = { x: 0, y: 0, z: -1 };
        } else if (key === controlScheme.down) {
            newDirection = { x: 0, y: 0, z: 1 };
        } else if (key === controlScheme.left) {
            newDirection = { x: -1, y: 0, z: 0 };
        } else if (key === controlScheme.right) {
            newDirection = { x: 1, y: 0, z: 0 };
        }

        if (newDirection) {
            return player.changeDirection(newDirection);
        }

        return false;
    }

    /**
     * Override parent getGameState for multiplayer state
     * @returns {Object} Multiplayer game state
     */
    getGameState() {
        const baseState = {
            bounds: this.bounds,
            isPaused: this.isPaused,
            frameCount: this.frameCount,
            gameStarted: this.gameStarted,
            gameOver: this.gameOver,
            gameSpeed: this.gameSpeed,
            gameMode: this.gameMode,
            localScoring: this.localScoring.getScoreDetails(),
            ...this.scoreManager.getScoreState(),
        };

        // Add player states
        if (this.player1) {
            baseState.player1 = this.player1.getState();
        }
        if (this.player2) {
            baseState.player2 = this.player2.getState();
        }

        // Add players array for compatibility with existing systems
        baseState.players = [];
        if (this.player1) baseState.players.push(this.player1.getState());
        if (this.player2) baseState.players.push(this.player2.getState());

        // Clear legacy single-player properties
        baseState.player = null;
        baseState.playerDirection = null;
        baseState.playerTrail = [];
        baseState.ai = null;
        baseState.aiDirection = null;
        baseState.aiTrail = [];
        baseState.aiOpponents = [];

        // Include dynamic boundaries for Arena Shrink mode
        if (this.gameMode === GameModes.ARENA_SHRINK && this.arenaShrinker) {
            baseState.dynamicBounds = this.arenaShrinker.getCurrentBounds();
            baseState.arenaState = this.arenaShrinker.getArenaState(Date.now());
        }

        // Include timer state for time-based modes
        if (
            (this.gameMode === GameModes.TIME_TRIAL || this.gameMode === GameModes.ARENA_SHRINK) &&
            this.survivalTimer
        ) {
            baseState.survivalTime = this.survivalTimer.getElapsedTime();
            baseState.formattedSurvivalTime = this.survivalTimer.getCurrentFormattedTime();
            baseState.timerRunning = this.survivalTimer.isRunning;
        }

        return baseState;
    }

    /**
     * Handle round end based on collision results
     * @param {Object} collisionResult - Collision detection result
     */
    handleRoundEnd(collisionResult) {
        if (!collisionResult) return;

        const { player1Collided, player2Collided } = collisionResult;

        // Stop timers for time-based modes
        if (this.gameMode === GameModes.TIME_TRIAL) {
            this.stopSurvivalTimer();
        }
        if (this.gameMode === GameModes.ARENA_SHRINK) {
            this.stopSurvivalTimer();
            if (this.arenaShrinker) {
                this.arenaShrinker.stopSurvivalTracking(Date.now());
            }
        }

        // Determine round winner
        let roundWinner = null;
        if (player1Collided && !player2Collided) {
            // Player 2 wins
            this.localScoring.incrementScore('P2');
            roundWinner = 'P2';
        } else if (player2Collided && !player1Collided) {
            // Player 1 wins
            this.localScoring.incrementScore('P1');
            roundWinner = 'P1';
        } else {
            // Both crashed or neither crashed - tie
            this.localScoring.handleTieGame();
            roundWinner = null;
        }

        this.localScoring.nextRound();

        // Store round winner for UI display
        this.lastRoundWinner = roundWinner;
    }

    /**
     * Restart game (reset round but keep scores)
     */
    restart() {
        // Don't reset local scoring - only reset current round state
        this.lastRoundWinner = null;
        this.init();
    }

    /**
     * Reset all scores and restart
     */
    resetScores() {
        this.localScoring.resetScores();
        this.scoreManager.resetCurrentScores();
        this.lastRoundWinner = null;
        this.init();
    }

    /**
     * Get last round winner
     * @returns {string|null} Last round winner ID or null
     */
    getLastRoundWinner() {
        return this.lastRoundWinner;
    }

    /**
     * Get local scoring state
     * @returns {Object} Local scoring information
     */
    getLocalScoring() {
        return this.localScoring.getScoreDetails();
    }

    /**
     * Get alive players
     * @returns {Array} Array of alive player entities
     */
    getAlivePlayers() {
        const alivePlayers = [];
        if (this.player1 && this.player1.isAlive) {
            alivePlayers.push(this.player1);
        }
        if (this.player2 && this.player2.isAlive) {
            alivePlayers.push(this.player2);
        }
        return alivePlayers;
    }

    /**
     * Check if game should end (when any player crashes)
     * @returns {boolean} True if game should end
     */
    shouldEndGame() {
        // Game ends when either player crashes
        return (this.player1 && !this.player1.isAlive) || (this.player2 && !this.player2.isAlive);
    }

    /**
     * Get winner of current round
     * @returns {string|null} Winner ID ('P1', 'P2') or null for tie
     */
    getRoundWinner() {
        const player1Alive = this.player1 && this.player1.isAlive;
        const player2Alive = this.player2 && this.player2.isAlive;

        if (player1Alive && !player2Alive) {
            return 'P1';
        } else if (player2Alive && !player1Alive) {
            return 'P2';
        }
        return null; // Tie or both alive
    }

    /**
     * Get overall winner based on total wins
     * @returns {string|null} Overall winner ID or null for tie
     */
    getOverallWinner() {
        return this.localScoring.getLeader();
    }

    /**
     * Check if this is a multiplayer game
     * @returns {boolean} Always true for MultiplayerGame
     */
    isMultiplayer() {
        return true;
    }

    /**
     * Get player by ID
     * @param {string} playerId - Player ID ('P1' or 'P2')
     * @returns {PlayerEntity|null} Player entity or null
     */
    getPlayer(playerId) {
        if (playerId === 'P1') return this.player1;
        if (playerId === 'P2') return this.player2;
        return null;
    }

    /**
     * Get both players
     * @returns {Array} Array of player entities
     */
    getPlayers() {
        const players = [];
        if (this.player1) players.push(this.player1);
        if (this.player2) players.push(this.player2);
        return players;
    }
}

module.exports = { MultiplayerGame };
