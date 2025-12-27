/**
 * Central game state management
 * All game component references stored here
 */

const { GameModes } = require('../systems/GameModes.js');

const state = {
    // Error handling
    errorHandler: null,
    errorRecovery: null,
    loadingIndicator: null,
    errorRecoveryStrategies: null,
    initializationState: null,

    // Core game
    game: null,
    aiCoordinator: null,
    collisionDetectionEngine: null,
    playerCollisionHandler: null,
    playerController: null,
    renderingEngine: null,
    scoreDisplay: null,
    cameraEffectsManager: null,
    audioManager: null,
    difficultyManager: null,
    powerUpManager: null,
    statusIndicator: null,
    glowEffectManager: null,
    performanceMonitor: null,
    performanceDegradationManager: null,
    modeSelector: null,
    survivalTimer: null,
    countdownTimer: null,
    leaderboardSystem: null,
    achievementSystem: null,
    particleSettingsUI: null,
    cameraEffectsUI: null,
    glowSettingsUI: null,
    customizationManager: null,
    customizationUI: null,
    musicSettingsUI: null,

    // Multiplayer
    multiplayerGame: null,
    dualControlScheme: null,
    splitScreenCamera: null,

    // Multi-AI
    aiControllers: [],
    currentAICount: 1,

    // Game mode
    currentGameMode: GameModes.CLASSIC,
    isTimeTrialActive: false,
};

module.exports = state;
