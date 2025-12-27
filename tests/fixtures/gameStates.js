/**
 * Game state fixtures for testing
 * Provides sample game state objects for various scenarios
 */

/**
 * Create a basic game state
 */
function createBasicGameState() {
    return {
        player: {
            x: 0,
            y: 0,
            direction: 'right',
            trail: [],
            alive: true,
            score: 0,
            color: 0x00ffff,
        },
        ai: {
            x: 20,
            y: 20,
            direction: 'left',
            trail: [],
            alive: true,
            score: 0,
            color: 0xff0000,
        },
        gameOver: false,
        winner: null,
        frameCount: 0,
        arenaSize: 30,
    };
}

/**
 * Create a game state with trails
 */
function createGameStateWithTrails() {
    return {
        player: {
            x: 5,
            y: 5,
            direction: 'right',
            trail: [
                { x: 0, y: 5 },
                { x: 1, y: 5 },
                { x: 2, y: 5 },
                { x: 3, y: 5 },
                { x: 4, y: 5 },
            ],
            alive: true,
            score: 0,
            color: 0x00ffff,
        },
        ai: {
            x: 25,
            y: 25,
            direction: 'left',
            trail: [
                { x: 29, y: 25 },
                { x: 28, y: 25 },
                { x: 27, y: 25 },
                { x: 26, y: 25 },
            ],
            alive: true,
            score: 0,
            color: 0xff0000,
        },
        gameOver: false,
        winner: null,
        frameCount: 50,
        arenaSize: 30,
    };
}

/**
 * Create a game over state
 */
function createGameOverState(winner = 'player') {
    return {
        player: {
            x: 10,
            y: 10,
            direction: 'right',
            trail: [
                { x: 9, y: 10 },
                { x: 8, y: 10 },
            ],
            alive: winner === 'player',
            score: winner === 'player' ? 1 : 0,
            color: 0x00ffff,
        },
        ai: {
            x: 20,
            y: 20,
            direction: 'left',
            trail: [
                { x: 21, y: 20 },
                { x: 22, y: 20 },
            ],
            alive: winner === 'ai',
            score: winner === 'ai' ? 1 : 0,
            color: 0xff0000,
        },
        gameOver: true,
        winner,
        frameCount: 100,
        arenaSize: 30,
    };
}

/**
 * Create a multiplayer game state
 */
function createMultiplayerGameState(playerCount = 2) {
    const players = [];
    const colors = [0x00ffff, 0xff0000, 0x00ff00, 0xffff00];
    const startPositions = [
        { x: 5, y: 5, direction: 'right' },
        { x: 25, y: 25, direction: 'left' },
        { x: 5, y: 25, direction: 'up' },
        { x: 25, y: 5, direction: 'down' },
    ];

    for (let i = 0; i < playerCount; i++) {
        players.push({
            id: `player-${i}`,
            x: startPositions[i].x,
            y: startPositions[i].y,
            direction: startPositions[i].direction,
            trail: [],
            alive: true,
            score: 0,
            color: colors[i],
            name: `Player ${i + 1}`,
        });
    }

    return {
        players,
        gameOver: false,
        winner: null,
        frameCount: 0,
        arenaSize: 30,
        mode: 'multiplayer',
    };
}

/**
 * Create a game state with power-ups
 */
function createGameStateWithPowerUps() {
    return {
        ...createBasicGameState(),
        powerUps: [
            { x: 10, y: 10, type: 'speed', active: true },
            { x: 20, y: 15, type: 'shield', active: true },
            { x: 15, y: 20, type: 'slow', active: true },
        ],
    };
}

/**
 * Create a game state for time trial mode
 */
function createTimeTrialGameState() {
    return {
        player: {
            x: 15,
            y: 15,
            direction: 'right',
            trail: [],
            alive: true,
            score: 0,
            color: 0x00ffff,
        },
        gameOver: false,
        winner: null,
        frameCount: 0,
        arenaSize: 30,
        mode: 'timeTrial',
        timeRemaining: 60000, // 60 seconds in ms
        checkpoints: [
            { x: 10, y: 10, collected: false },
            { x: 20, y: 20, collected: false },
        ],
    };
}

/**
 * Create a game state for arena shrink mode
 */
function createArenaShrinkGameState() {
    return {
        ...createBasicGameState(),
        mode: 'arenaShrink',
        arenaSize: 30,
        originalArenaSize: 30,
        shrinkInterval: 5000,
        lastShrinkTime: 0,
        minArenaSize: 10,
    };
}

/**
 * Create a game state with custom arena size
 */
function createCustomArenaGameState(arenaSize = 50) {
    const state = createBasicGameState();
    state.arenaSize = arenaSize;
    state.player.x = arenaSize / 4;
    state.player.y = arenaSize / 4;
    state.ai.x = (arenaSize * 3) / 4;
    state.ai.y = (arenaSize * 3) / 4;
    return state;
}

/**
 * Create a game state near collision
 */
function createNearCollisionGameState() {
    return {
        player: {
            x: 10,
            y: 10,
            direction: 'right',
            trail: [
                { x: 9, y: 10 },
                { x: 8, y: 10 },
            ],
            alive: true,
            score: 0,
            color: 0x00ffff,
        },
        ai: {
            x: 12,
            y: 10,
            direction: 'left',
            trail: [
                { x: 13, y: 10 },
                { x: 14, y: 10 },
            ],
            alive: true,
            score: 0,
            color: 0xff0000,
        },
        gameOver: false,
        winner: null,
        frameCount: 20,
        arenaSize: 30,
    };
}

/**
 * Create a game state at arena boundary
 */
function createBoundaryGameState() {
    return {
        player: {
            x: 29,
            y: 15,
            direction: 'right',
            trail: [
                { x: 28, y: 15 },
                { x: 27, y: 15 },
            ],
            alive: true,
            score: 0,
            color: 0x00ffff,
        },
        ai: {
            x: 15,
            y: 15,
            direction: 'left',
            trail: [],
            alive: true,
            score: 0,
            color: 0xff0000,
        },
        gameOver: false,
        winner: null,
        frameCount: 30,
        arenaSize: 30,
    };
}

module.exports = {
    createBasicGameState,
    createGameStateWithTrails,
    createGameOverState,
    createMultiplayerGameState,
    createGameStateWithPowerUps,
    createTimeTrialGameState,
    createArenaShrinkGameState,
    createCustomArenaGameState,
    createNearCollisionGameState,
    createBoundaryGameState,
};
