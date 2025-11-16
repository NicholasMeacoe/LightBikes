/**
 * GameModes enumeration for different game modes
 */
const GameModes = {
    CLASSIC: 'classic',
    TIME_TRIAL: 'time_trial',
    ARENA_SHRINK: 'arena_shrink',
    LOCAL_MULTIPLAYER: 'local_multiplayer'
};

/**
 * Timer state model for tracking timer status
 */
const TimerState = {
    startTime: null,
    pausedDuration: 0,
    isPaused: false,
    isRunning: false
};

module.exports = { GameModes, TimerState };