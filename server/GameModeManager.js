/**
 * GameModeManager - Server-side game mode management for online multiplayer
 * Handles Classic, Time Trial, and Arena Shrink modes with synchronized logic
 */

const GameModes = {
    CLASSIC: 'classic',
    TIME_TRIAL: 'timeTrial',
    ARENA_SHRINK: 'arenaShrink'
};

/**
 * Base class for game mode logic
 */
class GameModeBase {
    constructor(gameRoom) {
        this.gameRoom = gameRoom;
        this.startTime = null;
        this.isActive = false;
    }

    /**
     * Initialize the game mode
     */
    initialize(timestamp) {
        this.startTime = timestamp;
        this.isActive = true;
    }

    /**
     * Update game mode state
     */
    update(timestamp, gameState) {
        // Override in subclasses
    }

    /**
     * Check win condition for this mode
     */
    checkWinCondition(gameState) {
        // Override in subclasses
        return null;
    }

    /**
     * Get mode-specific state data
     */
    getModeState(timestamp) {
        return {
            mode: this.getModeName(),
            isActive: this.isActive
        };
    }

    /**
     * Get mode name
     */
    getModeName() {
        return 'base';
    }

    /**
     * Reset the game mode
     */
    reset() {
        this.startTime = null;
        this.isActive = false;
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.reset();
    }
}

/**
 * Classic Mode - Last player standing wins
 */
class ClassicMode extends GameModeBase {
    constructor(gameRoom) {
        super(gameRoom);
    }

    getModeName() {
        return GameModes.CLASSIC;
    }

    update(timestamp, gameState) {
        // Classic mode has no special update logic
        // Win condition is checked in checkWinCondition
    }

    checkWinCondition(gameState) {
        const alivePlayers = Object.values(gameState.players).filter(p => p.isAlive);
        
        if (alivePlayers.length <= 1) {
            return {
                winner: alivePlayers.length === 1 ? alivePlayers[0].id : null,
                reason: 'last_standing',
                finalState: gameState
            };
        }
        
        return null;
    }

    getModeState(timestamp) {
        return {
            ...super.getModeState(timestamp),
            mode: GameModes.CLASSIC
        };
    }
}

/**
 * Time Trial Mode - Survive as long as possible
 * Players compete for longest survival time
 */
class TimeTrialMode extends GameModeBase {
    constructor(gameRoom) {
        super(gameRoom);
        this.playerSurvivalTimes = new Map(); // playerId -> survivalTime
        this.playerDeathTimes = new Map(); // playerId -> deathTimestamp
    }

    getModeName() {
        return GameModes.TIME_TRIAL;
    }

    initialize(timestamp) {
        super.initialize(timestamp);
        
        // Initialize survival tracking for all players
        const gameState = this.gameRoom.gameState;
        if (gameState) {
            for (const playerId of Object.keys(gameState.players)) {
                this.playerSurvivalTimes.set(playerId, 0);
            }
        }
    }

    update(timestamp, gameState) {
        if (!this.isActive || !this.startTime) return;

        // Update survival times for alive players
        for (const [playerId, playerState] of Object.entries(gameState.players)) {
            if (playerState.isAlive) {
                const survivalTime = timestamp - this.startTime;
                this.playerSurvivalTimes.set(playerId, survivalTime);
            } else if (!this.playerDeathTimes.has(playerId)) {
                // Record death time for players who just died
                const survivalTime = timestamp - this.startTime;
                this.playerSurvivalTimes.set(playerId, survivalTime);
                this.playerDeathTimes.set(playerId, timestamp);
            }
        }
    }

    checkWinCondition(gameState) {
        const alivePlayers = Object.values(gameState.players).filter(p => p.isAlive);
        
        // Game ends when all players have crashed
        if (alivePlayers.length === 0) {
            // Find player with longest survival time
            let longestSurvival = 0;
            let winner = null;
            
            for (const [playerId, survivalTime] of this.playerSurvivalTimes) {
                if (survivalTime > longestSurvival) {
                    longestSurvival = survivalTime;
                    winner = playerId;
                }
            }
            
            return {
                winner: winner,
                reason: 'longest_survival',
                survivalTimes: Object.fromEntries(this.playerSurvivalTimes),
                finalState: gameState
            };
        }
        
        return null;
    }

    getModeState(timestamp) {
        const survivalTimes = {};
        for (const [playerId, time] of this.playerSurvivalTimes) {
            survivalTimes[playerId] = time;
        }

        return {
            ...super.getModeState(timestamp),
            mode: GameModes.TIME_TRIAL,
            survivalTimes: survivalTimes,
            elapsedTime: this.startTime ? timestamp - this.startTime : 0
        };
    }

    reset() {
        super.reset();
        this.playerSurvivalTimes.clear();
        this.playerDeathTimes.clear();
    }
}

/**
 * Arena Shrink Mode - Arena boundaries shrink over time
 * Adds pressure and forces player confrontation
 */
class ArenaShrinkMode extends GameModeBase {
    constructor(gameRoom) {
        super(gameRoom);
        
        // Shrink configuration
        this.config = {
            initialSize: 30,
            minSize: 10,
            shrinkStartDelay: 15000, // 15 seconds before shrinking starts
            shrinkInterval: 5000, // Shrink every 5 seconds
            shrinkAmount: 2, // Reduce by 2 units each time
            warningTime: 3000 // 3 second warning before each shrink
        };
        
        this.currentSize = this.config.initialSize;
        this.lastShrinkTime = null;
        this.nextShrinkTime = null;
        this.shrinkCount = 0;
        this.isWarning = false;
        
        // Survival tracking
        this.playerSurvivalTimes = new Map();
        this.playerDeathTimes = new Map();
    }

    getModeName() {
        return GameModes.ARENA_SHRINK;
    }

    initialize(timestamp) {
        super.initialize(timestamp);
        
        this.currentSize = this.config.initialSize;
        this.lastShrinkTime = null;
        this.nextShrinkTime = timestamp + this.config.shrinkStartDelay;
        this.shrinkCount = 0;
        this.isWarning = false;
        
        // Initialize survival tracking
        const gameState = this.gameRoom.gameState;
        if (gameState) {
            for (const playerId of Object.keys(gameState.players)) {
                this.playerSurvivalTimes.set(playerId, 0);
            }
        }
    }

    update(timestamp, gameState) {
        if (!this.isActive || !this.startTime) return;

        // Update survival times
        for (const [playerId, playerState] of Object.entries(gameState.players)) {
            if (playerState.isAlive) {
                const survivalTime = timestamp - this.startTime;
                this.playerSurvivalTimes.set(playerId, survivalTime);
            } else if (!this.playerDeathTimes.has(playerId)) {
                const survivalTime = timestamp - this.startTime;
                this.playerSurvivalTimes.set(playerId, survivalTime);
                this.playerDeathTimes.set(playerId, timestamp);
            }
        }

        // Check if it's time to shrink
        if (this.nextShrinkTime && timestamp >= this.nextShrinkTime) {
            this.performShrink(timestamp, gameState);
        }
        
        // Check for warning state
        if (this.nextShrinkTime && !this.isWarning) {
            const timeUntilShrink = this.nextShrinkTime - timestamp;
            if (timeUntilShrink <= this.config.warningTime && timeUntilShrink > 0) {
                this.isWarning = true;
                this.broadcastShrinkWarning(timeUntilShrink);
            }
        }
    }

    performShrink(timestamp, gameState) {
        // Calculate new size
        const newSize = Math.max(
            this.config.minSize,
            this.currentSize - this.config.shrinkAmount
        );
        
        if (newSize < this.currentSize) {
            this.currentSize = newSize;
            this.lastShrinkTime = timestamp;
            this.shrinkCount++;
            this.isWarning = false;
            
            // Update game state bounds
            const halfSize = this.currentSize / 2;
            gameState.bounds = {
                minX: -halfSize,
                maxX: halfSize,
                minZ: -halfSize,
                maxZ: halfSize,
                size: this.currentSize
            };
            
            // Schedule next shrink if not at minimum
            if (this.currentSize > this.config.minSize) {
                this.nextShrinkTime = timestamp + this.config.shrinkInterval;
            } else {
                this.nextShrinkTime = null;
            }
            
            // Broadcast shrink event
            this.broadcastShrinkEvent();
            
            console.log(`[ArenaShrink] Arena shrunk to ${this.currentSize} units (shrink #${this.shrinkCount})`);
        }
    }

    broadcastShrinkWarning(timeUntilShrink) {
        this.gameRoom.broadcastToRoom('arenaShrinkWarning', {
            timeUntilShrink: timeUntilShrink,
            currentSize: this.currentSize,
            nextSize: Math.max(this.config.minSize, this.currentSize - this.config.shrinkAmount)
        });
    }

    broadcastShrinkEvent() {
        this.gameRoom.broadcastToRoom('arenaShrunk', {
            newSize: this.currentSize,
            shrinkCount: this.shrinkCount,
            bounds: this.getCurrentBounds()
        });
    }

    getCurrentBounds() {
        const halfSize = this.currentSize / 2;
        return {
            minX: -halfSize,
            maxX: halfSize,
            minZ: -halfSize,
            maxZ: halfSize,
            size: this.currentSize
        };
    }

    checkWinCondition(gameState) {
        const alivePlayers = Object.values(gameState.players).filter(p => p.isAlive);
        
        if (alivePlayers.length <= 1) {
            let winner = alivePlayers.length === 1 ? alivePlayers[0].id : null;
            
            // If tie, use survival time as tiebreaker
            if (winner === null && this.playerSurvivalTimes.size > 0) {
                let longestSurvival = 0;
                for (const [playerId, survivalTime] of this.playerSurvivalTimes) {
                    if (survivalTime > longestSurvival) {
                        longestSurvival = survivalTime;
                        winner = playerId;
                    }
                }
            }
            
            return {
                winner: winner,
                reason: 'arena_shrink_complete',
                survivalTimes: Object.fromEntries(this.playerSurvivalTimes),
                finalSize: this.currentSize,
                shrinkCount: this.shrinkCount,
                finalState: gameState
            };
        }
        
        return null;
    }

    getModeState(timestamp) {
        const survivalTimes = {};
        for (const [playerId, time] of this.playerSurvivalTimes) {
            survivalTimes[playerId] = time;
        }

        return {
            ...super.getModeState(timestamp),
            mode: GameModes.ARENA_SHRINK,
            currentSize: this.currentSize,
            bounds: this.getCurrentBounds(),
            nextShrinkTime: this.nextShrinkTime,
            shrinkCount: this.shrinkCount,
            isWarning: this.isWarning,
            survivalTimes: survivalTimes,
            elapsedTime: this.startTime ? timestamp - this.startTime : 0
        };
    }

    reset() {
        super.reset();
        this.currentSize = this.config.initialSize;
        this.lastShrinkTime = null;
        this.nextShrinkTime = null;
        this.shrinkCount = 0;
        this.isWarning = false;
        this.playerSurvivalTimes.clear();
        this.playerDeathTimes.clear();
    }
}

/**
 * GameModeManager - Factory and manager for game modes
 */
class GameModeManager {
    /**
     * Create a game mode instance for a room
     */
    static createMode(modeName, gameRoom) {
        switch (modeName) {
            case GameModes.CLASSIC:
                return new ClassicMode(gameRoom);
            case GameModes.TIME_TRIAL:
                return new TimeTrialMode(gameRoom);
            case GameModes.ARENA_SHRINK:
                return new ArenaShrinkMode(gameRoom);
            default:
                console.warn(`Unknown game mode: ${modeName}, defaulting to Classic`);
                return new ClassicMode(gameRoom);
        }
    }

    /**
     * Validate game mode name
     */
    static isValidMode(modeName) {
        return Object.values(GameModes).includes(modeName);
    }

    /**
     * Get all available game modes
     */
    static getAvailableModes() {
        return Object.values(GameModes);
    }

    /**
     * Get mode configuration
     */
    static getModeConfig(modeName) {
        const configs = {
            [GameModes.CLASSIC]: {
                name: 'Classic',
                description: 'Last player standing wins',
                minPlayers: 2,
                maxPlayers: 4,
                features: ['elimination']
            },
            [GameModes.TIME_TRIAL]: {
                name: 'Time Trial',
                description: 'Survive as long as possible',
                minPlayers: 2,
                maxPlayers: 4,
                features: ['survival_time', 'leaderboard']
            },
            [GameModes.ARENA_SHRINK]: {
                name: 'Arena Shrink',
                description: 'Arena shrinks over time, forcing confrontation',
                minPlayers: 2,
                maxPlayers: 4,
                features: ['shrinking_arena', 'survival_time', 'pressure']
            }
        };

        return configs[modeName] || configs[GameModes.CLASSIC];
    }
}

module.exports = {
    GameModeManager,
    GameModes,
    ClassicMode,
    TimeTrialMode,
    ArenaShrinkMode
};
