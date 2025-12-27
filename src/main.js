const { Game } = require('./core/game.js');
const { MultiplayerGame } = require('./multiplayer/MultiplayerGame.js');
const { AIController, AICoordinator } = require('./core/ai.js');
const { CollisionDetectionEngine } = require('./core/collision.js');
const { PlayerCollisionHandler } = require('./multiplayer/PlayerCollisionHandler.js');
const { PlayerController } = require('./utils/controls.js');
const { DualControlScheme } = require('./utils/DualControlScheme.js');
const { RenderingEngine } = require('./rendering/renderer.js');
const { SplitScreenCamera } = require('./multiplayer/SplitScreenCamera.js');
const { ScoreDisplay } = require('./ui/scoreDisplay.js');
const { AudioManager } = require('./audio/audio.js');
const { DifficultyManager } = require('./systems/difficulty.js');
const { PowerUpManager } = require('./systems/PowerUpManager.js');
const { StatusIndicator } = require('./ui/StatusIndicator.js');
const { ModeSelector } = require('./ui/ModeSelector.js');
const { SurvivalTimer } = require('./ui/SurvivalTimer.js');
const { CountdownTimer } = require('./ui/CountdownTimer.js');
const { LeaderboardSystem } = require('./systems/LeaderboardSystem.js');
const { AchievementSystem } = require('./systems/AchievementSystem.js');
const { GameModes } = require('./systems/GameModes.js');
const { PerformanceMonitor } = require('./utils/PerformanceMonitor.js');
const { PerformanceDegradationManager } = require('./utils/PerformanceDegradationManager.js');
const { ParticleSystem } = require('./rendering/ParticleSystem.js');
const { ParticleSettingsUI } = require('./ui/ParticleSettingsUI.js');
const { GlowEffectManager } = require('./rendering/GlowEffectManager.js');
const { CameraEffectsManager } = require('./effects/CameraEffectsManager.js');
const { CameraEffectsUI } = require('./effects/CameraEffectsUI.js');
const { CustomizationManager } = require('./systems/CustomizationManager.js');
const { CustomizationUI } = require('./ui/CustomizationUI.js');
const { PreferenceStorage } = require('./systems/PreferenceStorage.js');
const { MusicSettingsUI } = require('./ui/MusicSettingsUI.js');
const { MultiplayerGameOverUI } = require('./ui/MultiplayerGameOverUI.js');
const { LocalScoringUI } = require('./ui/LocalScoringUI.js');
const { UIManager } = require('./ui/UIManager.js');
const { GameOverUI } = require('./ui/GameOverUI.js');
const { ModeUI } = require('./ui/ModeUI.js');
const { StyleManager } = require('./ui/StyleManager.js');
const { BrowserCompatibility } = require('./utils/BrowserCompatibility.js');
const { ClassicMode } = require('./modes/ClassicMode.js');
const { TimeTrialMode } = require('./modes/TimeTrialMode.js');
const { ArenaShrinkMode } = require('./modes/ArenaShrinkMode.js');
const { MultiplayerMode } = require('./modes/MultiplayerMode.js');
const { CompatibilityWarningUI } = require('./ui/CompatibilityWarningUI.js');
const { RecoveryManager } = require('./initialization/RecoveryManager.js');
const { GameInitializer } = require('./initialization/GameInitializer.js');
const { SystemInitializer } = require('./initialization/SystemInitializer.js');
const { CanvasVerifier } = require('./utils/CanvasVerifier.js');
const { LoadingIndicator } = require('./ui/LoadingIndicator.js');
const {
    DOMNotReadyError,
    CanvasCreationError,
    ModeSelectorError,
} = require('./utils/InitializationErrors.js');
const { InitializationState } = require('./utils/InitializationState.js');
const { Logger } = require('./utils/Logger.js');
const { errorRecovery } = require('./initialization/game-state.js');
const { EventManager } = require('./events/EventManager.js');
const { GameLoop } = require('./game-loop/GameLoop.js');

// Initialize logger
const logger = Logger.create('Main');

// Initialize browser compatibility checker
const browserCompatibility = new BrowserCompatibility();
browserCompatibility.initializeIconDisplay();

// Error handling components (initialized first)
let recoveryManager = null;
let loadingIndicator = null;
let initializationState = null;
let eventManager = null;
let gameLoop = null;

// Game components (initialized in initializeGame)
/** @type {any} */
let game = null;
/** @type {any} */
let aiCoordinator = null;
/** @type {any} */
let collisionDetectionEngine = null;
/** @type {any} */
let playerCollisionHandler = null;
/** @type {any} */
let playerController = null;
/** @type {any} */
let renderingEngine = null;
/** @type {any} */
let scoreDisplay = null;
/** @type {any} */
let cameraEffectsManager = null;
/** @type {any} */
let audioManager = null;
/** @type {any} */
let difficultyManager = null;
/** @type {any} */
let powerUpManager = null;
/** @type {any} */
let statusIndicator = null;
/** @type {any} */
let glowEffectManager = null;
/** @type {any} */
let performanceMonitor = null;
/** @type {any} */
let performanceDegradationManager = null;
/** @type {any} */
let modeSelector = null;
/** @type {any} */
let survivalTimer = null;
/** @type {any} */
let countdownTimer = null;
/** @type {any} */
let leaderboardSystem = null;
let achievementSystem = null;
let particleSettingsUI = null;
let cameraEffectsUI = null;
let glowSettingsUI = null;
let customizationManager = null;
let customizationUI = null;
let musicSettingsUI = null;

// UI Management components
let uiManager = null;
let gameOverUI = null;
let modeUI = null;
let styleManager = null;

// Multiplayer-specific components (initialized on demand)
let multiplayerGame = null;
let dualControlScheme = null;
let splitScreenCamera = null;

// Multi-AI system state
let aiControllers = [];
let currentAICount = 1; // Default to 1 AI for backward compatibility

// Current game mode state
let currentGameMode = GameModes.CLASSIC;
let isTimeTrialActive = false;
let currentModeController = null;

/**
 * Initialize AI controllers for multi-AI support
 * @param {number} aiCount - Number of AI opponents (1-4)
 */
function initializeAIControllers(aiCount = 1) {
    // Validate AI count
    const validatedCount = Math.max(1, Math.min(4, Math.floor(aiCount)));
    currentAICount = validatedCount;

    // Clear existing controllers
    aiControllers = [];

    // Create AI controllers with different personalities
    const personalities = ['aggressive', 'defensive', 'erratic'];

    for (let i = 0; i < validatedCount; i++) {
        const personality = personalities[i % personalities.length];
        const controller = new AIController(personality);
        aiControllers.push(controller);
    }

    // Update difficulty manager for multi-AI (use first controller for backward compatibility)
    if (aiControllers.length > 0) {
        difficultyManager.setAIController(aiControllers[0]);
    }
}

/**
 * Calculate AI directions for all AI opponents using coordination
 * @param {Object} gameState - Current game state
 * @param {Object} difficultyConfig - Difficulty configuration
 * @returns {Array} Array of AI direction decisions
 */
function calculateMultiAIDirections(gameState, difficultyConfig) {
    if (!gameState.aiOpponents || gameState.aiOpponents.length === 0) {
        return [];
    }

    // Start AI calculation performance monitoring
    performanceMonitor.startAICalculation('multi-ai');

    try {
        // Create AI entities with their controllers for coordination
        const aiEntities = gameState.aiOpponents.map((ai, index) => ({
            ...ai,
            controller: aiControllers[index] || aiControllers[0], // Fallback to first controller
        }));

        // Use AI coordinator to get coordinated decisions
        const decisions = aiCoordinator.coordinateAIDecisions(
            aiEntities,
            gameState,
            difficultyConfig
        );

        return decisions;
    } finally {
        // End AI calculation performance monitoring
        performanceMonitor.endAICalculation('multi-ai');
    }
}

/**
 * Apply AI decisions to game state
 * @param {Array} decisions - Array of AI decisions from coordinator
 * @param {Object} game - Game instance
 */
function applyAIDecisions(decisions, game) {
    const gameState = game.getGameState();

    decisions.forEach((decision, index) => {
        if (index < gameState.aiOpponents.length && gameState.aiOpponents[index].alive) {
            // Update AI direction
            gameState.aiOpponents[index].direction = decision.newDirection;

            // Update controller state
            if (aiControllers[index]) {
                aiControllers[index].aiState = decision.newState;
            }
        }
    });

    // Maintain backward compatibility - update legacy aiDirection property
    if (gameState.aiOpponents.length > 0) {
        game.aiDirection = gameState.aiOpponents[0].direction;
    }
}

/**
 * Handle collision results in multi-AI games
 * Updates entity states and determines if game should end
 * @param {Object} collisionResult - Result from collision detection
 * @param {Object} game - Game instance
 */
function handleMultiAICollisions(collisionResult, game) {
    const { crashedEntities, survivingEntities, winner } = collisionResult;
    const gameState = game.getGameState();

    // Mark crashed AI entities as dead
    if (crashedEntities && gameState.aiOpponents) {
        crashedEntities.forEach((entityId) => {
            if (entityId.startsWith('ai_')) {
                const aiIndex = gameState.aiOpponents.findIndex((ai) => ai.id === entityId);
                if (aiIndex !== -1) {
                    gameState.aiOpponents[aiIndex].alive = false;
                }
            }
        });
    }

    // Determine if game should end based on multi-AI scoring rules
    const shouldEndGame = determineGameEnd(survivingEntities, winner);

    if (shouldEndGame) {
        // Award points based on multi-AI victory conditions
        updateMultiAIScores(winner, survivingEntities);
        game.gameOver = true;
    }

    // Update remaining entity count display
    if (modeUI) {
        modeUI.updateRemainingEntityDisplay(survivingEntities);
    } else {
        updateRemainingEntityDisplay(survivingEntities);
    }
}

/**
 * Determine if the game should end in multi-AI mode
 * Game ends when player crashes OR when only player remains
 * @param {Array} survivingEntities - List of surviving entity IDs
 * @param {string} winner - Winner identifier or null
 * @returns {boolean} True if game should end
 */
function determineGameEnd(survivingEntities, winner) {
    // Game ends if player crashed
    if (!survivingEntities.includes('player')) {
        return true;
    }

    // Game ends if only player remains (player is last survivor)
    if (survivingEntities.length === 1 && survivingEntities[0] === 'player') {
        return true;
    }

    // Game continues if multiple entities survive (including player)
    return false;
}

/**
 * Update scores based on multi-AI game results
 * Player only gets points when they are the last survivor
 * @param {string} winner - Winner identifier
 * @param {Array} survivingEntities - List of surviving entities
 */
function updateMultiAIScores(winner, survivingEntities) {
    const scoreManager = game.scoreManager;

    if (
        winner === 'player' &&
        survivingEntities.length === 1 &&
        survivingEntities[0] === 'player'
    ) {
        // Player wins by being last survivor - award points
        scoreManager.incrementPlayerScore();
    } else {
        // Player crashed or didn't achieve last survivor status - AI wins
        scoreManager.incrementAIScore();
    }
}

/**
 * Update display showing remaining entities during gameplay
 * @param {Array} survivingEntities - List of surviving entity IDs
 */
function updateRemainingEntityDisplay(survivingEntities) {
    // Create or update remaining entities display
    let remainingDisplay = document.getElementById('remaining-entities-display');

    if (!remainingDisplay) {
        remainingDisplay = document.createElement('div');
        remainingDisplay.id = 'remaining-entities-display';
        remainingDisplay.className = 'remaining-entities-display';
        document.body.appendChild(remainingDisplay);

        // Add styles for the display
        addRemainingEntitiesStyles();
    }

    // Count remaining entities by type
    const playerAlive = survivingEntities.includes('player');
    const aliveAICount = survivingEntities.filter((id) => id.startsWith('ai_')).length;
    const totalRemaining = survivingEntities.length;

    // Update display content
    if (totalRemaining > 1) {
        remainingDisplay.innerHTML = `
            <div class="remaining-count">Remaining: ${totalRemaining}</div>
            <div class="remaining-breakdown">
                ${playerAlive ? '<span class="player-status alive">You</span>' : '<span class="player-status dead">You</span>'}
                <span class="ai-status">${aliveAICount} AI${aliveAICount !== 1 ? 's' : ''}</span>
            </div>
        `;
        remainingDisplay.style.display = 'block';
    } else {
        // Hide display when only one entity remains (game ending)
        remainingDisplay.style.display = 'none';
    }
}

/**
 * Add CSS styles for remaining entities display
 */
function addRemainingEntitiesStyles() {
    // Check if styles already exist
    if (document.getElementById('remaining-entities-styles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'remaining-entities-styles';
    style.textContent = `
        .remaining-entities-display {
            position: fixed;
            top: 100px;
            left: 20px;
            background-color: rgba(0, 0, 0, 0.8);
            border: 2px solid #ffffff;
            border-radius: 8px;
            padding: 12px 16px;
            color: white;
            font-family: 'Courier New', monospace;
            font-size: 16px;
            z-index: 100;
            min-width: 120px;
        }

        .remaining-count {
            font-weight: bold;
            font-size: 18px;
            margin-bottom: 8px;
            text-align: center;
            color: #00ffff;
        }

        .remaining-breakdown {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
        }

        .player-status {
            font-weight: bold;
        }

        .player-status.alive {
            color: #00ff00;
        }

        .player-status.dead {
            color: #ff4444;
            text-decoration: line-through;
        }

        .ai-status {
            color: #ffaa00;
        }

        @media (max-width: 768px) {
            .remaining-entities-display {
                font-size: 14px;
                padding: 8px 12px;
                top: 80px;
                left: 10px;
            }
            
            .remaining-count {
                font-size: 16px;
                margin-bottom: 6px;
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Hide remaining entities display
 */
function hideRemainingEntitiesDisplay() {
    const remainingDisplay = document.getElementById('remaining-entities-display');
    if (remainingDisplay) {
        remainingDisplay.style.display = 'none';
    }
}

/**
 * Show multi-AI game over screen with enhanced information
 */
function showMultiAIGameOver() {
    const finalGameState = game.getGameState();
    const gameOverElement = document.getElementById('gameOver');

    // Hide remaining entities display
    hideRemainingEntitiesDisplay();

    if (gameOverElement) {
        // Determine victory message based on final scores
        const playerWon = finalGameState.playerScore > finalGameState.aiScore;
        const isNewHighScore = finalGameState.isNewHighScore;

        // Count final AI opponents
        const totalAIs = finalGameState.aiOpponents ? finalGameState.aiOpponents.length : 1;
        const aliveAIs = finalGameState.aiOpponents
            ? finalGameState.aiOpponents.filter((ai) => ai.alive).length
            : finalGameState.ai
              ? 1
              : 0;

        // Create victory/defeat message
        let resultMessage = '';
        if (playerWon) {
            resultMessage =
                totalAIs > 1
                    ? `Victory! You defeated ${totalAIs} AI opponents!`
                    : 'Victory! You defeated the AI!';
        } else {
            resultMessage =
                totalAIs > 1 ? `Defeated by ${totalAIs} AI opponents` : 'Defeated by AI';
        }

        // Build game over display
        gameOverElement.innerHTML = `
            <div class="multi-ai-game-over">
                <h2 class="${playerWon ? 'victory' : 'defeat'}">${resultMessage}</h2>
                <div class="score-summary">
                    <div class="score-row">
                        <span class="score-label">Your Score:</span>
                        <span class="score-value player-score">${finalGameState.playerScore}</span>
                    </div>
                    <div class="score-row">
                        <span class="score-label">AI Score:</span>
                        <span class="score-value ai-score">${finalGameState.aiScore}</span>
                    </div>
                    <div class="score-row">
                        <span class="score-label">High Score:</span>
                        <span class="score-value high-score">${finalGameState.highScore}</span>
                    </div>
                </div>
                ${isNewHighScore ? '<div class="new-high-score">New High Score!</div>' : ''}
                <div class="game-stats">
                    <div class="stat-item">
                        <span class="stat-label">AI Opponents:</span>
                        <span class="stat-value">${totalAIs}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Rounds Played:</span>
                        <span class="stat-value">${finalGameState.roundsPlayed || finalGameState.playerScore + finalGameState.aiScore}</span>
                    </div>
                </div>
                <button id="changeModeButton" onclick="showModeSelector()" class="mode-change-btn">
                    Change Mode
                </button>
            </div>
        `;

        // Add styles for multi-AI game over
        addMultiAIGameOverStyles();
    }

    // Also update the score display for consistency
    scoreDisplay.showGameOverScores(
        finalGameState.playerScore,
        finalGameState.aiScore,
        finalGameState.highScore,
        finalGameState.isNewHighScore
    );
}

/**
 * Add CSS styles for multi-AI game over display
 */
function addMultiAIGameOverStyles() {
    // Check if styles already exist
    if (document.getElementById('multi-ai-game-over-styles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'multi-ai-game-over-styles';
    style.textContent = `
        .multi-ai-game-over {
            text-align: center;
            color: white;
            font-family: 'Courier New', monospace;
        }

        .multi-ai-game-over h2 {
            font-size: 2.5em;
            margin-bottom: 30px;
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
        }

        .multi-ai-game-over h2.victory {
            color: #00ff00;
            text-shadow: 0 0 20px rgba(0, 255, 0, 0.8);
        }

        .multi-ai-game-over h2.defeat {
            color: #ff4444;
            text-shadow: 0 0 20px rgba(255, 68, 68, 0.8);
        }

        .score-summary {
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid #ffffff;
            border-radius: 10px;
            padding: 20px;
            margin: 20px auto;
            max-width: 300px;
        }

        .score-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 10px 0;
            font-size: 1.2em;
        }

        .score-label {
            color: #cccccc;
        }

        .player-score {
            color: #00ffff;
            font-weight: bold;
        }

        .ai-score {
            color: #ff6666;
            font-weight: bold;
        }

        .high-score {
            color: #ffff00;
            font-weight: bold;
        }

        .new-high-score {
            color: #ffff00;
            font-size: 1.5em;
            font-weight: bold;
            margin: 15px 0;
            text-shadow: 0 0 15px rgba(255, 255, 0, 0.8);
            animation: highScoreGlow 1s ease-in-out infinite alternate;
        }

        .game-stats {
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid #666666;
            border-radius: 8px;
            padding: 15px;
            margin: 20px auto;
            max-width: 250px;
        }

        .stat-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 8px 0;
            font-size: 1em;
        }

        .stat-label {
            color: #aaaaaa;
        }

        .stat-value {
            color: #ffffff;
            font-weight: bold;
        }

        .mode-change-btn {
            margin-top: 20px;
            padding: 12px 24px;
            font-size: 1.2em;
            background: rgba(0, 255, 255, 0.2);
            border: 2px solid #00ffff;
            color: white;
            border-radius: 8px;
            cursor: pointer;
            font-family: 'Courier New', monospace;
            transition: all 0.3s ease;
        }

        .mode-change-btn:hover {
            background: rgba(0, 255, 255, 0.4);
            box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
        }

        @keyframes highScoreGlow {
            from {
                text-shadow: 0 0 15px rgba(255, 255, 0, 0.8);
            }
            to {
                text-shadow: 0 0 25px rgba(255, 255, 0, 1.0);
            }
        }

        @media (max-width: 768px) {
            .multi-ai-game-over h2 {
                font-size: 1.8em;
                margin-bottom: 20px;
            }
            
            .score-summary {
                max-width: 250px;
                padding: 15px;
            }
            
            .score-row {
                font-size: 1em;
                margin: 8px 0;
            }
            
            .game-stats {
                max-width: 200px;
                padding: 12px;
            }
            
            .mode-change-btn {
                padding: 10px 20px;
                font-size: 1em;
            }
        }
    `;
    document.head.appendChild(style);
}

// Wire up power-up system integrations
// Wire up power-up system integrations
if (game && powerUpManager) {
    game.setPowerUpManager(powerUpManager);
}
if (collisionDetectionEngine && powerUpManager) {
    collisionDetectionEngine.setPowerUpManager(powerUpManager);
}
if (playerCollisionHandler && powerUpManager) {
    playerCollisionHandler.setPowerUpManager(powerUpManager);
}

// Wire up camera effects system integration
if (collisionDetectionEngine && cameraEffectsManager) {
    collisionDetectionEngine.setCameraEffectsManager(cameraEffectsManager);
}
if (playerCollisionHandler && cameraEffectsManager) {
    playerCollisionHandler.setCameraEffectsManager(cameraEffectsManager);
}
if (game && cameraEffectsManager) {
    game.setCameraEffectsManager(cameraEffectsManager);
}
if (renderingEngine && cameraEffectsManager) {
    renderingEngine.setCameraEffectsManager(cameraEffectsManager);
}

// Old UI initialization code removed - now handled in initializeGame()

// Initialize multiplayer UI components (created on demand)
let multiplayerGameOverUI = null;
let localScoringUI = null;

/**
 * Initialize multiplayer UI components
 * @param {MultiplayerGame} multiplayerGame - Multiplayer game instance
 */
function initializeMultiplayerUI(multiplayerGame) {
    // Initialize local scoring UI
    if (!localScoringUI) {
        localScoringUI = new LocalScoringUI(multiplayerGame.localScoring);
    }

    // Show scores
    localScoringUI.showScores();
}

/**
 * Clean up multiplayer UI components
 */
function cleanupMultiplayerUI() {
    if (localScoringUI) {
        localScoringUI.hideScores();
    }

    if (multiplayerGameOverUI && multiplayerGameOverUI.isVisible()) {
        multiplayerGameOverUI.hide();
    }
}

// Old particle system initialization code removed - now handled in initializeGame()

/**
 * Show multiplayer game over screen with winner announcement
 */
function showMultiplayerGameOver() {
    // Initialize multiplayer game over UI if not already created
    if (!multiplayerGameOverUI) {
        multiplayerGameOverUI = new MultiplayerGameOverUI();
    }

    // Get current game state
    const gameState = game.getGameState();

    // Show multiplayer game over UI with callbacks
    multiplayerGameOverUI.show(
        gameState,
        // Restart callback - next round
        () => {
            game.restart();
            game.gameOver = false;

            // Update local scoring UI if it exists
            if (localScoringUI) {
                localScoringUI.updateScores();
            }
        },
        // Reset scores callback
        () => {
            game.resetScores();
            game.gameOver = false;

            // Update local scoring UI if it exists
            if (localScoringUI) {
                localScoringUI.updateScores();
            }
        },
        // Return to single player callback
        () => {
            // Hide multiplayer UI
            if (localScoringUI) {
                localScoringUI.hideScores();
            }

            // Show mode selector to switch back to single player
            showModeSelector();
        }
    );

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
 * Show mode selector (for mode switching)
 */
function showModeSelector() {
    // Hide game over screen
    document.getElementById('gameOver').style.display = 'none';
    const restartBtn = document.getElementById('restart');
    if (restartBtn) restartBtn.style.display = 'none';

    // Hide multiplayer game over UI if visible
    if (multiplayerGameOverUI && multiplayerGameOverUI.isVisible()) {
        multiplayerGameOverUI.hide();
    }

    // Reset game state
    game.gameOver = false;

    // Show mode selector
    modeSelector.show();
}

/**
 * Show performance notification to user
 * @param {string} message - Notification message
 */
function showPerformanceNotification(message) {
    // Create or update performance notification element
    let notificationElement = document.getElementById('performance-notification');

    if (!notificationElement) {
        notificationElement = document.createElement('div');
        notificationElement.id = 'performance-notification';
        notificationElement.className = 'performance-notification';
        document.body.appendChild(notificationElement);

        // Add styles for the notification
        addPerformanceNotificationStyles();
    }

    // Set message and show notification
    notificationElement.textContent = message;
    notificationElement.style.display = 'block';
    notificationElement.style.opacity = '1';

    // Auto-hide after 4 seconds
    setTimeout(() => {
        notificationElement.style.opacity = '0';
        setTimeout(() => {
            notificationElement.style.display = 'none';
        }, 500);
    }, 4000);
}

/**
 * Update performance mode UI indicator
 * @param {boolean} enabled - Whether performance mode is enabled
 */
function updatePerformanceModeUI(enabled) {
    // Create or update performance mode indicator
    let indicatorElement = document.getElementById('performance-mode-indicator');

    if (!indicatorElement) {
        indicatorElement = document.createElement('div');
        indicatorElement.id = 'performance-mode-indicator';
        indicatorElement.className = 'performance-mode-indicator';
        document.body.appendChild(indicatorElement);

        // Add styles for the indicator
        addPerformanceModeIndicatorStyles();
    }

    if (enabled) {
        indicatorElement.textContent = 'Performance Mode';
        indicatorElement.style.display = 'block';
    } else {
        indicatorElement.style.display = 'none';
    }
}

/**
 * Add CSS styles for performance notification
 */
function addPerformanceNotificationStyles() {
    // Check if styles already exist
    if (document.getElementById('performance-notification-styles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'performance-notification-styles';
    style.textContent = `
        .performance-notification {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(255, 165, 0, 0.9);
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 16px;
            font-weight: bold;
            z-index: 1000;
            border: 2px solid #ff8c00;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            opacity: 0;
            transition: opacity 0.5s ease-in-out;
            max-width: 400px;
            text-align: center;
        }

        @media (max-width: 768px) {
            .performance-notification {
                font-size: 14px;
                padding: 12px 20px;
                max-width: 300px;
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Test UI and text readability with glow effects
 * Ensures glow effects don't interfere with game UI
 */
function testUICompatibility() {
    try {
        // Check if UI elements are still visible and functional
        const uiElements = [
            'gameOver',
            'restart',
            'muteButton',
            'performanceButton',
            'particleSettingsButton',
            'glowSettingsButton',
            'difficultySelector',
            'aiCountSelector',
            'pauseOverlay',
        ];

        let compatibilityIssues = 0;

        uiElements.forEach((elementId) => {
            const element = document.getElementById(elementId);
            if (element) {
                const styles = window.getComputedStyle(element);
                const zIndex = parseInt(styles.zIndex) || 0;

                // Ensure UI elements have proper z-index above the canvas
                if (zIndex < 100 && element.style.position !== 'static') {
                    logger.warn(`UI element ${elementId} may be obscured by glow effects`);
                    compatibilityIssues++;
                }
            }
        });

        if (compatibilityIssues === 0) {
            logger.info('GlowEffectManager: UI compatibility test passed');
        } else {
            logger.warn(
                `GlowEffectManager: ${compatibilityIssues} potential UI compatibility issues detected`
            );
        }

        return compatibilityIssues === 0;
    } catch (error) {
        logger.error('Error testing UI compatibility:', error);
        return false;
    }
}

/**
 * Add CSS styles for performance mode indicator
 */
function addPerformanceModeIndicatorStyles() {
    // Check if styles already exist
    if (document.getElementById('performance-mode-indicator-styles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'performance-mode-indicator-styles';
    style.textContent = `
        .performance-mode-indicator {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: rgba(255, 165, 0, 0.8);
            color: white;
            padding: 8px 16px;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            font-weight: bold;
            z-index: 100;
            border: 1px solid #ff8c00;
            display: none;
        }

        @media (max-width: 768px) {
            .performance-mode-indicator {
                bottom: 10px;
                right: 10px;
                font-size: 12px;
                padding: 6px 12px;
            }
        }
    `;
    document.head.appendChild(style);
}

// Make components available globally for window resize handling and controls
window.scoreDisplayInstance = scoreDisplay;
window.audioManager = audioManager;
window.difficultyManager = difficultyManager;
window.powerUpManager = powerUpManager;
window.statusIndicator = statusIndicator;
window.modeSelector = modeSelector;
window.survivalTimer = survivalTimer;
window.leaderboardSystem = leaderboardSystem;
window.achievementSystem = achievementSystem;
window.showModeSelector = showModeSelector;
window.performanceMonitor = performanceMonitor;
window.performanceDegradationManager = performanceDegradationManager;
// Duplicate initialization code removed - now handled in initializeGame()

/**
 * Start game with the selected mode
 * @param {string} mode - The game mode to start
 */
function startGameWithMode(mode) {
    currentGameMode = mode;
    isTimeTrialActive = mode === GameModes.TIME_TRIAL;

    // Clean up previous mode controller if exists
    if (currentModeController) {
        currentModeController.cleanup();
        currentModeController = null;
    }

    // Create systems object for mode controllers
    const systems = {
        renderingEngine,
        powerUpManager,
        statusIndicator,
        glowEffectManager,
        audioManager,
        scoreDisplay,
        survivalTimer,
        achievementSystem,
        uiManager,
        modeUI,
        gameOverUI,
        cameraEffectsManager,
    };

    // Create helpers object for mode controllers
    const helpers = {
        currentAICount,
        initializeAIControllers,
        showMultiAIGameOver,
        showTimeTrialGameOver,
        showArenaShrinkGameOver,
        showMultiplayerGameOver,
        updateUIForGameMode,
        createTimeTrialUI,
        hideTimeTrialUI,
        createArenaShrinkUI,
        hideArenaShrinkUI,
        showFinalArenaMessage,
        hideFinalArenaMessage,
        hideRemainingEntitiesDisplay,
        initializeMultiplayerUI,
        cleanupMultiplayerUI,
        setGame: (newGame) => {
            game = newGame;
        },
        resetGameReference: () => {
            // Reset to single player game if needed
            // This would need the original game instance
        },
    };

    if (mode === GameModes.TIME_TRIAL) {
        // Start Time Trial mode with countdown
        countdownTimer.start(() => {
            currentModeController = new TimeTrialMode(game, systems, helpers);
            currentModeController.initialize();
        });
    } else if (mode === GameModes.ARENA_SHRINK) {
        // Start Arena Shrink mode with countdown
        countdownTimer.start(() => {
            currentModeController = new ArenaShrinkMode(game, systems, helpers);
            currentModeController.initialize();
        });
    } else if (mode === GameModes.LOCAL_MULTIPLAYER) {
        // Start Local Multiplayer mode immediately
        currentModeController = new MultiplayerMode(game, systems, helpers);
        currentModeController.initialize();
    } else {
        // Start Classic mode immediately
        currentModeController = new ClassicMode(game, systems, helpers);
        currentModeController.initialize();
    }
}

/**
 * Initialize Time Trial mode
 */
function initializeTimeTrialMode() {
    // Initialize game without AI
    game.restart();
    game.setTimeTrialMode(true);

    // Reset Time Trial components
    survivalTimer.reset();
    achievementSystem.reset();

    // Start survival timer
    survivalTimer.start();

    // Reset other systems
    renderingEngine.clearTrails();
    powerUpManager.reset();
    statusIndicator.reset();

    // Reset glow effect system for new game
    if (glowEffectManager && glowEffectManager.initialized) {
        glowEffectManager.handleGameRestart();
    }

    // Hide UI elements
    document.getElementById('gameOver').style.display = 'none';
    const restartBtn = document.getElementById('restart');
    if (restartBtn) restartBtn.style.display = 'none';
    updatePauseOverlay();

    // Update UI for Time Trial mode
    if (uiManager) {
        uiManager.updateForMode(GameModes.TIME_TRIAL);
        uiManager.createModeUI(GameModes.TIME_TRIAL);
    } else {
        updateUIForGameMode();
        createTimeTrialUI();
        hideArenaShrinkUI();
    }

    // Handle audio and music for game start
    audioManager.handleGameStart();
}

/**
 * Initialize Classic mode
 */
function initializeClassicMode() {
    // Set game configuration for multi-AI
    game.gameConfig.aiCount = currentAICount;

    // Initialize game with AI
    game.restart();
    game.setTimeTrialMode(false);

    // Reinitialize AI controllers to match game state
    initializeAIControllers(currentAICount);

    // Reset systems
    renderingEngine.clearTrails();
    powerUpManager.reset();
    statusIndicator.reset();

    // Reset glow effect system for new game
    if (glowEffectManager && glowEffectManager.initialized) {
        glowEffectManager.handleGameRestart();
    }

    // Hide UI elements
    document.getElementById('gameOver').style.display = 'none';
    const restartBtn = document.getElementById('restart');
    if (restartBtn) restartBtn.style.display = 'none';
    updatePauseOverlay();

    // Update UI for Classic mode
    if (uiManager && modeUI) {
        uiManager.updateForMode(GameModes.CLASSIC);
        modeUI.hideAllModeUI();
    } else {
        updateUIForGameMode();
        hideTimeTrialUI();
        hideArenaShrinkUI();
        hideRemainingEntitiesDisplay();
    }

    // Reset score display to show current scores
    const gameState = game.getGameState();
    scoreDisplay.updateGameplayScores(gameState.playerScore, gameState.aiScore);

    // Handle audio and music for game start
    audioManager.handleGameStart();
}

/**
 * Initialize Arena Shrink mode
 */
function initializeArenaShrinkMode() {
    // Set game configuration for multi-AI
    game.gameConfig.aiCount = currentAICount;

    // Initialize game with AI in Arena Shrink mode
    game.restart();
    game.setGameMode(GameModes.ARENA_SHRINK);

    // Reinitialize AI controllers to match game state
    initializeAIControllers(currentAICount);

    // Set up shrink animation and audio callbacks
    if (game.arenaShrinker) {
        // Set up warning callback for audio and visual effects
        game.arenaShrinker.setOnWarning(() => {
            // Play warning sound effect
            audioManager.playShrinkWarningSound();
        });

        // Set up shrink callback for animation and audio effects
        game.arenaShrinker.setOnShrink(() => {
            // Play shrink execution sound effect
            audioManager.playShrinkExecuteSound();

            // Trigger shrinking animation in renderer
            const currentBounds = game.arenaShrinker.getCurrentBounds();
            const nextBounds = game.arenaShrinker.getNextBounds();
            renderingEngine.startShrinkAnimation(currentBounds, nextBounds);
        });

        // Set up final arena callback for messaging
        game.arenaShrinker.setOnFinalArena(() => {
            if (modeUI) {
                modeUI.showFinalArenaMessage();
            } else {
                showFinalArenaMessage();
            }
        });
    }

    // Reset systems
    renderingEngine.clearTrails();
    powerUpManager.reset();
    statusIndicator.reset();

    // Reset glow effect system for new game
    if (glowEffectManager && glowEffectManager.initialized) {
        glowEffectManager.handleGameRestart();
    }

    // Hide UI elements
    document.getElementById('gameOver').style.display = 'none';
    const restartBtn = document.getElementById('restart');
    if (restartBtn) restartBtn.style.display = 'none';
    updatePauseOverlay();

    // Update UI for Arena Shrink mode
    if (uiManager) {
        uiManager.updateForMode(GameModes.ARENA_SHRINK);
        uiManager.createModeUI(GameModes.ARENA_SHRINK);
    } else {
        updateUIForGameMode();
        hideTimeTrialUI();
        hideRemainingEntitiesDisplay();
        createArenaShrinkUI();
    }

    // Reset score display to show current scores
    const gameState = game.getGameState();
    scoreDisplay.updateGameplayScores(gameState.playerScore, gameState.aiScore);

    // Handle audio and music for game start
    audioManager.handleGameStart();
}

/**
 * Initialize Local Multiplayer mode
 */
function initializeLocalMultiplayerMode() {
    // Switch to multiplayer game instance
    if (!multiplayerGame) {
        multiplayerGame = new MultiplayerGame();

        // Wire up power-up system
        multiplayerGame.setPowerUpManager(powerUpManager);

        // Wire up camera effects system
        multiplayerGame.setCameraEffectsManager(cameraEffectsManager);
    } else {
        multiplayerGame.restart();
    }

    // Switch active game reference
    game = multiplayerGame;

    // Initialize dual control scheme
    if (!dualControlScheme) {
        dualControlScheme = new DualControlScheme();
    } else {
        dualControlScheme.reset();
    }

    // Initialize the game
    multiplayerGame.init();

    // Initialize split screen camera
    if (!splitScreenCamera) {
        splitScreenCamera = new SplitScreenCamera(renderingEngine.camera);
        splitScreenCamera.setPlayers([multiplayerGame.player1, multiplayerGame.player2]);
    } else {
        splitScreenCamera.setPlayers([multiplayerGame.player1, multiplayerGame.player2]);
    }

    // Initialize multiplayer UI
    initializeMultiplayerUI(multiplayerGame);

    // Reset systems
    renderingEngine.clearTrails();
    powerUpManager.reset();
    statusIndicator.reset();

    // Reset glow effect system for new game
    if (glowEffectManager && glowEffectManager.initialized) {
        glowEffectManager.handleGameRestart();
    }

    // Hide UI elements
    document.getElementById('gameOver').style.display = 'none';
    const restartBtn = document.getElementById('restart');
    if (restartBtn) restartBtn.style.display = 'none';
    updatePauseOverlay();

    // Update UI for Local Multiplayer mode
    if (uiManager && modeUI) {
        uiManager.updateForMode(GameModes.LOCAL_MULTIPLAYER);
        modeUI.hideAllModeUI();
    } else {
        updateUIForGameMode();
        hideTimeTrialUI();
        hideArenaShrinkUI();
        hideRemainingEntitiesDisplay();
    }

    // Handle audio and music for game start
    audioManager.handleGameStart();
}

/**
 * Restart the current game
 */
function restartGame() {
    // Handle music restart for all game modes
    audioManager.handleGameRestart();

    if (currentGameMode === GameModes.TIME_TRIAL) {
        // Stop any running timers
        survivalTimer.stop();
        countdownTimer.stop();

        // Restart Time Trial mode with countdown
        countdownTimer.start(() => {
            if (currentModeController) {
                currentModeController.initialize();
            } else {
                initializeTimeTrialMode();
            }
        });
    } else if (currentGameMode === GameModes.ARENA_SHRINK) {
        // Stop any running timers
        survivalTimer.stop();
        countdownTimer.stop();

        // Restart Arena Shrink mode with countdown
        countdownTimer.start(() => {
            if (currentModeController) {
                currentModeController.initialize();
            } else {
                initializeArenaShrinkMode();
            }
        });
    } else if (currentGameMode === GameModes.LOCAL_MULTIPLAYER) {
        // Restart Local Multiplayer mode
        if (currentModeController) {
            currentModeController.initialize();
        } else {
            initializeLocalMultiplayerMode();
        }
    } else {
        // Restart Classic mode
        if (currentModeController) {
            currentModeController.initialize();
        } else {
            initializeClassicMode();
        }
    }
}

// Duplicate event listener setup removed - now handled in initializeGame()

function updatePauseOverlay() {
    const gameState = game.getGameState();
    const pauseOverlayEl = document.getElementById('pauseOverlay');
    if (pauseOverlayEl) {
        if (gameState.isPaused) {
            pauseOverlayEl.style.display = 'flex';
        } else {
            pauseOverlayEl.style.display = 'none';
        }
    }
}

function updateMuteButton() {
    const isMuted = audioManager.getMuted();
    const muteBtn = document.getElementById('muteButton');
    if (muteBtn) {
        if (isMuted) {
            muteBtn.textContent = '🔇';
            muteBtn.classList.add('muted');
            muteBtn.title = 'Unmute Audio';
        } else {
            muteBtn.textContent = '🔊';
            muteBtn.classList.remove('muted');
            muteBtn.title = 'Mute Audio';
        }
    }
}

function updatePerformanceButton() {
    const perfBtn = document.getElementById('performanceButton');
    if (perfBtn) {
        const performanceMode = performanceDegradationManager.getSettings().performanceModeEnabled;
        if (performanceMode) {
            perfBtn.classList.add('active');
            perfBtn.title = 'Disable Performance Mode';
        } else {
            perfBtn.classList.remove('active');
            perfBtn.title = 'Enable Performance Mode';
        }
    }
}

function updateDifficultyUI() {
    const currentDifficulty = difficultyManager.getCurrentDifficulty();
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');

    difficultyButtons.forEach((button) => {
        const buttonLevel = button.getAttribute('data-level');
        if (buttonLevel === currentDifficulty) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

function updateAICountUI() {
    const aiCountButtons = document.querySelectorAll('.ai-count-btn');

    aiCountButtons.forEach((button) => {
        const buttonCount = parseInt(button.getAttribute('data-count'));
        if (buttonCount === currentAICount) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

/**
 * Set the number of AI opponents and reinitialize the game
 * @param {number} count - Number of AI opponents (1-4)
 */
function setAICount(count) {
    const validatedCount = Math.max(1, Math.min(4, Math.floor(count)));

    if (validatedCount !== currentAICount) {
        currentAICount = validatedCount;

        // Reinitialize AI controllers
        initializeAIControllers(currentAICount);

        // Update game configuration
        game.gameConfig.aiCount = currentAICount;

        // Persist selection to localStorage
        try {
            localStorage.setItem('lightbikes_ai_count', currentAICount.toString());
        } catch (error) {
            logger.warn('Failed to save AI count to localStorage:', error);
        }

        // Restart the game with new AI count if currently playing
        if (!game.gameOver && currentGameMode !== GameModes.TIME_TRIAL) {
            restartGame();
        }
    }
}

// Track previous game state for audio triggers (used by GameLoop)
let previousGameState = null;

/**
 * Update Time Trial mode display
 */
function updateTimeTrialDisplay() {
    // Update timer display
    const timerElement = document.getElementById('timer-display');
    if (timerElement) {
        timerElement.textContent = survivalTimer.getCurrentFormattedTime();
    } else {
        // Create timer display if it doesn't exist
        createTimeTrialUI();
    }
}

/**
 * Show Time Trial game over screen
 */
function showTimeTrialGameOver() {
    const finalTime = survivalTimer.getElapsedTime();
    const formattedTime = survivalTimer.formatTime(finalTime);

    // Update game over display for Time Trial
    const gameOverElement = document.getElementById('gameOver');
    if (gameOverElement) {
        gameOverElement.innerHTML = `
            <h2>Time Trial Complete!</h2>
            <p>Survival Time: ${formattedTime}</p>
            ${leaderboardSystem.isNewRecord(finalTime) ? '<p class="new-record">New Personal Best!</p>' : ''}
            <button id="changeModeButton" onclick="showModeSelector()" style="
                margin-top: 20px;
                padding: 10px 20px;
                font-size: 1.2em;
                background: rgba(0, 255, 255, 0.2);
                border: 2px solid #00ffff;
                color: white;
                border-radius: 5px;
                cursor: pointer;
            ">Change Mode</button>
        `;
    }
}

/**
 * Create Time Trial UI elements
 */
function createTimeTrialUI() {
    // Create timer display
    let timerElement = document.getElementById('timer-display');
    if (!timerElement) {
        timerElement = document.createElement('div');
        timerElement.id = 'timer-display';
        timerElement.className = 'timer-display';
        timerElement.textContent = '00:00.00';
        document.body.appendChild(timerElement);
    }

    // Add timer display styles
    addTimeTrialStyles();
}

/**
 * Add CSS styles for Time Trial UI
 */
function addTimeTrialStyles() {
    // Check if styles already exist
    if (document.getElementById('time-trial-styles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'time-trial-styles';
    style.textContent = `
        .timer-display {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 36px;
            font-weight: bold;
            color: #00ffff;
            text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
            z-index: 100;
            font-family: 'Courier New', monospace;
            background: rgba(0, 0, 0, 0.7);
            padding: 10px 20px;
            border-radius: 5px;
            border: 2px solid #00ffff;
        }

        .new-record {
            color: #ffff00;
            font-weight: bold;
            text-shadow: 0 0 10px rgba(255, 255, 0, 0.8);
        }

        .ui-hidden {
            display: none !important;
        }

        @media (max-width: 768px) {
            .timer-display {
                font-size: 24px;
                top: 10px;
                padding: 8px 16px;
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Update UI elements based on current game mode
 */
function updateUIForGameMode() {
    const difficultySelector = document.getElementById('difficultySelector');
    const aiCountSelector = document.getElementById('aiCountSelector');

    if (currentGameMode === GameModes.TIME_TRIAL) {
        // Hide both selectors in Time Trial mode (no AI opponents)
        if (difficultySelector) {
            difficultySelector.classList.add('ui-hidden');
        }
        if (aiCountSelector) {
            aiCountSelector.classList.add('ui-hidden');
        }
    } else if (currentGameMode === GameModes.ARENA_SHRINK) {
        // Hide difficulty selector but show AI count selector in Arena Shrink mode
        if (difficultySelector) {
            difficultySelector.classList.add('ui-hidden');
        }
        if (aiCountSelector) {
            aiCountSelector.classList.remove('ui-hidden');
        }
    } else if (currentGameMode === GameModes.LOCAL_MULTIPLAYER) {
        // Hide both selectors in Local Multiplayer mode (no AI opponents)
        if (difficultySelector) {
            difficultySelector.classList.add('ui-hidden');
        }
        if (aiCountSelector) {
            aiCountSelector.classList.add('ui-hidden');
        }
    } else {
        // Show both selectors in Classic mode
        if (difficultySelector) {
            difficultySelector.classList.remove('ui-hidden');
        }
        if (aiCountSelector) {
            aiCountSelector.classList.remove('ui-hidden');
        }
    }
}

/**
 * Hide Time Trial UI elements
 */
function hideTimeTrialUI() {
    const timerElement = document.getElementById('timer-display');
    if (timerElement) {
        timerElement.remove();
    }
}

/**
 * Create Arena Shrink UI elements
 */
function createArenaShrinkUI() {
    // Create survival timer display (similar to Time Trial)
    let timerElement = document.getElementById('arena-timer-display');
    if (!timerElement) {
        timerElement = document.createElement('div');
        timerElement.id = 'arena-timer-display';
        timerElement.className = 'arena-timer-display';
        timerElement.textContent = '00:00.00';
        document.body.appendChild(timerElement);
    }

    // Create arena info display
    let arenaInfoElement = document.getElementById('arena-info-display');
    if (!arenaInfoElement) {
        arenaInfoElement = document.createElement('div');
        arenaInfoElement.id = 'arena-info-display';
        arenaInfoElement.className = 'arena-info-display';
        arenaInfoElement.innerHTML = `
            <div class="arena-size">Arena: 30x30</div>
            <div class="shrink-countdown">Next shrink: 5.0s</div>
        `;
        document.body.appendChild(arenaInfoElement);
    }

    // Add Arena Shrink display styles
    addArenaShrinkStyles();
}

/**
 * Update Arena Shrink mode display
 */
function updateArenaShrinkDisplay() {
    const gameState = game.getGameState();

    // Update survival timer display
    const timerElement = document.getElementById('arena-timer-display');
    if (timerElement && gameState.formattedSurvivalTime) {
        timerElement.textContent = gameState.formattedSurvivalTime;
    }

    // Update arena information
    const arenaInfoElement = document.getElementById('arena-info-display');
    if (arenaInfoElement && gameState.arenaState) {
        const arenaState = gameState.arenaState;
        const arenaSizeElement = arenaInfoElement.querySelector('.arena-size');
        const shrinkCountdownElement = arenaInfoElement.querySelector('.shrink-countdown');

        if (arenaSizeElement) {
            arenaSizeElement.textContent = `Arena: ${arenaState.currentSize}x${arenaState.currentSize}`;
        }

        if (shrinkCountdownElement) {
            if (arenaState.isAtMinimum) {
                shrinkCountdownElement.textContent = 'FINAL ARENA';
                shrinkCountdownElement.classList.add('final-arena');
            } else if (arenaState.warningActive) {
                const countdown = (arenaState.timeUntilShrink / 1000).toFixed(1);
                shrinkCountdownElement.textContent = `Shrinking in: ${countdown}s`;
                shrinkCountdownElement.classList.add('warning-active');
            } else {
                const countdown = (arenaState.timeUntilShrink / 1000).toFixed(1);
                shrinkCountdownElement.textContent = `Next shrink: ${countdown}s`;
                shrinkCountdownElement.classList.remove('warning-active', 'final-arena');
            }
        }
    }
}

/**
 * Hide Arena Shrink UI elements
 */
function hideArenaShrinkUI() {
    const timerElement = document.getElementById('arena-timer-display');
    if (timerElement) {
        timerElement.remove();
    }

    const arenaInfoElement = document.getElementById('arena-info-display');
    if (arenaInfoElement) {
        arenaInfoElement.remove();
    }
}

/**
 * Show Arena Shrink game over screen
 */
function showArenaShrinkGameOver() {
    const finalTime = game.getSurvivalTime();
    const formattedTime = game.getFormattedSurvivalTime();
    const shrinksSurvived = game.getShrinksSurvived();
    const finalArenaSize = game.getBounds().size;

    // Update game over display for Arena Shrink
    const gameOverElement = document.getElementById('gameOver');
    if (gameOverElement) {
        const gameState = game.getGameState();
        const winner = gameState.playerScore > gameState.aiScore ? 'You Win!' : 'AI Wins!';

        gameOverElement.innerHTML = `
            <h2>${winner}</h2>
            <p>Survival Time: ${formattedTime}</p>
            <p>Shrinks Survived: ${shrinksSurvived}</p>
            <p>Final Arena: ${finalArenaSize}x${finalArenaSize}</p>
            <button id="changeModeButton" onclick="showModeSelector()" style="
                margin-top: 20px;
                padding: 10px 20px;
                font-size: 1.2em;
                background: rgba(0, 255, 255, 0.2);
                border: 2px solid #00ffff;
                color: white;
                border-radius: 5px;
                cursor: pointer;
            ">Change Mode</button>
        `;
    }
}

/**
 * Add CSS styles for Arena Shrink UI
 */
function addArenaShrinkStyles() {
    // Check if styles already exist
    if (document.getElementById('arena-shrink-styles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'arena-shrink-styles';
    style.textContent = `
        .arena-timer-display {
            position: fixed;
            top: 20px;
            left: 20px;
            font-size: 24px;
            font-weight: bold;
            color: #00ffff;
            text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
            z-index: 100;
            font-family: 'Courier New', monospace;
            background: rgba(0, 0, 0, 0.7);
            padding: 8px 16px;
            border-radius: 5px;
            border: 2px solid #00ffff;
        }

        .arena-info-display {
            position: fixed;
            top: 20px;
            right: 20px;
            font-size: 18px;
            font-weight: bold;
            color: #ffffff;
            text-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
            z-index: 100;
            font-family: 'Courier New', monospace;
            background: rgba(0, 0, 0, 0.7);
            padding: 12px 20px;
            border-radius: 5px;
            border: 2px solid #ffffff;
            text-align: right;
        }

        .arena-info-display .arena-size {
            margin-bottom: 8px;
            color: #00ff00;
        }

        .arena-info-display .shrink-countdown {
            color: #ffff00;
            transition: color 0.3s ease;
        }

        .arena-info-display .shrink-countdown.warning-active {
            color: #ff4444;
            animation: warningPulse 0.5s ease-in-out infinite alternate;
        }

        .arena-info-display .shrink-countdown.final-arena {
            color: #ff0000;
            font-weight: bold;
            animation: finalArenaPulse 1s ease-in-out infinite alternate;
        }

        @keyframes warningPulse {
            from { opacity: 0.7; }
            to { opacity: 1.0; }
        }

        @keyframes finalArenaPulse {
            from { 
                opacity: 0.8;
                text-shadow: 0 0 8px rgba(255, 0, 0, 0.6);
            }
            to { 
                opacity: 1.0;
                text-shadow: 0 0 15px rgba(255, 0, 0, 1.0);
            }
        }

        @media (max-width: 768px) {
            .arena-timer-display {
                font-size: 18px;
                top: 10px;
                left: 10px;
                padding: 6px 12px;
            }
            
            .arena-info-display {
                font-size: 14px;
                top: 10px;
                right: 10px;
                padding: 8px 16px;
            }
        }

        @media (max-width: 480px) {
            .arena-timer-display {
                font-size: 16px;
                padding: 4px 8px;
            }
            
            .arena-info-display {
                font-size: 12px;
                padding: 6px 12px;
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Show Final Arena message when minimum arena size is reached
 */
function showFinalArenaMessage() {
    // Create final arena message element
    let finalArenaElement = document.getElementById('final-arena-message');
    if (!finalArenaElement) {
        finalArenaElement = document.createElement('div');
        finalArenaElement.id = 'final-arena-message';
        finalArenaElement.className = 'final-arena-message';
        document.body.appendChild(finalArenaElement);
    }

    // Set message content
    finalArenaElement.innerHTML = '<span class="final-arena-text">FINAL ARENA</span>';

    // Show message with animation
    finalArenaElement.style.display = 'block';
    finalArenaElement.style.opacity = '0';

    // Fade in animation
    setTimeout(() => {
        finalArenaElement.style.opacity = '1';
    }, 50);

    // Auto-hide after 3 seconds
    setTimeout(() => {
        hideFinalArenaMessage();
    }, 3000);

    // Add styles if not already present
    addFinalArenaStyles();
}

/**
 * Hide Final Arena message
 */
function hideFinalArenaMessage() {
    const finalArenaElement = document.getElementById('final-arena-message');
    if (finalArenaElement) {
        finalArenaElement.style.opacity = '0';
        setTimeout(() => {
            finalArenaElement.style.display = 'none';
        }, 500);
    }
}

/**
 * Add CSS styles for Final Arena message
 */
function addFinalArenaStyles() {
    // Check if styles already exist
    if (document.getElementById('final-arena-styles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'final-arena-styles';
    style.textContent = `
        .final-arena-message {
            position: fixed;
            top: 30%;
            left: 50%;
            transform: translateX(-50%);
            z-index: 200;
            display: none;
            opacity: 0;
            transition: opacity 0.5s ease-in-out;
            pointer-events: none;
        }

        .final-arena-text {
            font-size: 48px;
            font-weight: bold;
            color: #ff4444;
            text-shadow: 
                0 0 10px rgba(255, 68, 68, 0.8),
                0 0 20px rgba(255, 68, 68, 0.6),
                0 0 30px rgba(255, 68, 68, 0.4);
            font-family: 'Courier New', monospace;
            background: rgba(0, 0, 0, 0.8);
            padding: 20px 40px;
            border-radius: 10px;
            border: 3px solid #ff4444;
            animation: finalArenaGlow 2s ease-in-out infinite alternate;
        }

        @keyframes finalArenaGlow {
            from {
                text-shadow: 
                    0 0 10px rgba(255, 68, 68, 0.8),
                    0 0 20px rgba(255, 68, 68, 0.6),
                    0 0 30px rgba(255, 68, 68, 0.4);
                border-color: #ff4444;
            }
            to {
                text-shadow: 
                    0 0 15px rgba(255, 68, 68, 1.0),
                    0 0 25px rgba(255, 68, 68, 0.8),
                    0 0 35px rgba(255, 68, 68, 0.6);
                border-color: #ff6666;
            }
        }

        @media (max-width: 768px) {
            .final-arena-text {
                font-size: 32px;
                padding: 15px 30px;
            }
        }

        @media (max-width: 480px) {
            .final-arena-text {
                font-size: 24px;
                padding: 10px 20px;
            }
        }
    `;
    document.head.appendChild(style);
}

// performBrowserCompatibilityCheck function moved to GameInitializer class

// registerRecoveryStrategies function moved to SystemInitializer class

/**
 * Initialize the game with proper sequence and error handling
 * @returns {Promise<boolean>} True if initialization succeeded
 */
async function initializeGame() {
    try {
        // Initialize recovery manager
        recoveryManager = new RecoveryManager();

        // Create and run GameInitializer for core components
        const gameInitializer = new GameInitializer(recoveryManager);
        const initResult = await gameInitializer.initialize();

        if (!initResult.success) {
            return false;
        }

        // Extract components and state from initialization result
        const { components } = initResult;
        game = components.game;
        aiCoordinator = components.aiCoordinator;
        collisionDetectionEngine = components.collisionDetectionEngine;
        playerCollisionHandler = components.playerCollisionHandler;
        playerController = components.playerController;
        renderingEngine = components.renderingEngine;
        loadingIndicator = initResult.loadingIndicator;
        initializationState = initResult.initializationState;

        // Create SystemInitializer for game systems
        const systemInitializer = new SystemInitializer(recoveryManager, components);

        // Register recovery strategies
        systemInitializer.registerRecoveryStrategies();

        // Set up event listeners
        loadingIndicator.updateProgress('controls', 'Setting up controls...');
        setupEventListeners();
        initializationState.completeStep('controlsSetup');

        // Initialize all game systems
        loadingIndicator.updateProgress('systems', 'Initializing game systems...');
        const systems = await systemInitializer.initializeGameSystemsWithRecovery();
        initializationState.completeStep('systemsInit');

        // Assign systems to global variables
        scoreDisplay = systems.scoreDisplay;
        cameraEffectsManager = systems.cameraEffectsManager;
        audioManager = systems.audioManager;
        difficultyManager = systems.difficultyManager;
        powerUpManager = systems.powerUpManager;
        statusIndicator = systems.statusIndicator;
        glowEffectManager = systems.glowEffectManager;
        performanceMonitor = systems.performanceMonitor;
        performanceDegradationManager = systems.performanceDegradationManager;
        modeSelector = systems.modeSelector;
        survivalTimer = systems.survivalTimer;
        countdownTimer = systems.countdownTimer;
        leaderboardSystem = systems.leaderboardSystem;
        achievementSystem = systems.achievementSystem;
        particleSettingsUI = systems.particleSettingsUI;
        cameraEffectsUI = systems.cameraEffectsUI;
        glowSettingsUI = systems.glowSettingsUI;
        customizationManager = systems.customizationManager;
        customizationUI = systems.customizationUI;
        musicSettingsUI = systems.musicSettingsUI;
        styleManager = systems.styleManager;
        modeUI = systems.modeUI;
        gameOverUI = systems.gameOverUI;
        uiManager = systems.uiManager;
        currentAICount = systems.currentAICount;

        // Set up performance degradation callbacks
        if (performanceDegradationManager) {
            performanceDegradationManager.setOnDegradation((action, status) => {
                logger.info(`Performance degradation: ${action}`, status);
                try {
                    showPerformanceNotification(
                        `Performance optimization applied: ${action.replace('_', ' ')}`
                    );
                } catch (error) {
                    logger.error('Error showing performance notification:', error);
                }
            });

            performanceDegradationManager.setOnRecovery((action, status) => {
                logger.info(`Performance recovery: ${action}`, status);
                try {
                    showPerformanceNotification(
                        `Performance restored: ${action.replace('_', ' ')}`
                    );
                } catch (error) {
                    logger.error('Error showing performance notification:', error);
                }
            });

            performanceDegradationManager.setOnPerformanceModeToggle((enabled, status) => {
                logger.info(`Performance mode ${enabled ? 'enabled' : 'disabled'}`, status);
                try {
                    updatePerformanceModeUI(enabled);
                } catch (error) {
                    logger.error('Error updating performance mode UI:', error);
                }
            });
        }

        // Make components available globally
        window.scoreDisplayInstance = scoreDisplay;
        window.audioManager = audioManager;
        window.difficultyManager = difficultyManager;
        window.powerUpManager = powerUpManager;
        window.statusIndicator = statusIndicator;
        window.modeSelector = modeSelector;
        window.survivalTimer = survivalTimer;
        window.leaderboardSystem = leaderboardSystem;
        window.achievementSystem = achievementSystem;
        window.showModeSelector = showModeSelector;
        window.performanceMonitor = performanceMonitor;
        window.performanceDegradationManager = performanceDegradationManager;
        window.glowEffectManager = glowEffectManager;
        window.glowSettingsUI = glowSettingsUI;
        window.cameraEffectsManager = cameraEffectsManager;
        window.musicSettingsUI = musicSettingsUI;
        window.getMusicPlayer = () => audioManager.getMusicPlayer();
        window.getMusicSettings = () => audioManager.getMusicSettings();
        window.isMusicAvailable = () => audioManager.isMusicAvailable();

        // Initialize mode selector callbacks
        modeSelector.setOnModeSelected((selectedMode) => {
            const previousMode = currentGameMode;
            currentGameMode = selectedMode;
            isTimeTrialActive = selectedMode === GameModes.TIME_TRIAL;

            if (glowEffectManager && glowEffectManager.initialized) {
                glowEffectManager.handleGameModeSwitch(selectedMode, previousMode);
            }

            startGameWithMode(selectedMode);
        });

        // Initialize UI states
        updateMuteButton();
        updatePerformanceButton();
        updateDifficultyUI();
        updateAICountUI();

        // Initialize AI controllers
        initializeAIControllers(currentAICount);

        // Show mode selector
        modeSelector.show();

        // Verify mode selector visibility
        loadingIndicator.updateProgress('mode-selector', 'Preparing mode selector...');
        initializationState.completeStep('modeSelectorReady');

        // Start game loop
        loadingIndicator.updateProgress('start', 'Starting game...');
        loadingIndicator.hide();

        // Create and start GameLoop
        gameLoop = new GameLoop({
            game,
            renderingEngine,
            performanceMonitor,
            performanceDegradationManager,
            glowEffectManager,
            cameraEffectsManager,
            powerUpManager,
            statusIndicator,
            audioManager,
            scoreDisplay,
            survivalTimer,
            leaderboardSystem,
            achievementSystem,
            localScoringUI,
            splitScreenCamera,
            collisionDetectionEngine,
            playerCollisionHandler,
            recoveryManager,
            uiManager,
            gameOverUI,
            modeUI,
            aiCoordinator,
            difficultyManager,
            updatePauseOverlay,
            updateTimeTrialDisplay,
            updateArenaShrinkDisplay,
            updateRemainingEntityDisplay,
            showMultiplayerGameOver,
            showTimeTrialGameOver,
            showArenaShrinkGameOver,
            showMultiAIGameOver,
            calculateMultiAIDirections,
            applyAIDecisions,
            handleMultiAICollisions,
            currentGameMode,
            isTimeTrialActive,
            aiControllers,
        });
        gameLoop.start();

        initializationState.complete();

        logger.info('Game initialization completed successfully');
        logger.info('Initialization state:', initializationState.getState());

        // Log recovery status
        const recoveryStatus = recoveryManager.getStatus();
        if (recoveryStatus.disabledFeatures.length > 0) {
            logger.warn('Some features were disabled:', recoveryStatus.disabledFeatures);
        }
        if (recoveryStatus.fallbackMode) {
            logger.warn('Running in fallback mode');
        }

        return true;
    } catch (error) {
        logger.error('Game initialization failed:', error);

        // Record error in state if available
        if (initializationState) {
            initializationState.recordError(initializationState.currentStep || 'unknown', error);
            logger.info('Initialization state at failure:', initializationState.getState());

            // Get recovery recommendation
            const recommendation = initializationState.getRecoveryRecommendation();
            logger.info('Recovery recommendation:', recommendation);
        }

        // Transform loading indicator to error display
        if (loadingIndicator) {
            loadingIndicator.showError(error, () => {
                window.location.reload();
            });
        } else if (recoveryManager) {
            recoveryManager.handleInitializationError(
                error,
                () => {
                    window.location.reload();
                },
                'Game'
            );
        } else {
            showInitializationError(error);
        }

        return false;
    }
}

/**
 * Set up all event listeners for the game
 */
function setupEventListeners() {
    // Create EventManager with all required dependencies
    eventManager = new EventManager({
        game,
        playerController,
        audioManager,
        renderingEngine,
        glowEffectManager,
        cameraEffectsManager,
        difficultyManager,
        performanceDegradationManager,
        restartGame,
        updatePauseOverlay,
        updateMuteButton,
        updatePerformanceButton,
        setAICount,
        updateAICountUI,
        updateDifficultyUI,
    });

    // Register all event listeners
    eventManager.registerAll();
}

// initializeGameSystemsWithRecovery function moved to SystemInitializer class

/**
 * Show loading indicator with message
 * @param {string} message - Loading message to display
 */
function showLoadingIndicator(message = 'Loading...') {
    let loadingElement = document.getElementById('loading-indicator');

    if (!loadingElement) {
        loadingElement = document.createElement('div');
        loadingElement.id = 'loading-indicator';
        loadingElement.className = 'loading-indicator';
        loadingElement.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-message">${message}</div>
        `;
        document.body.appendChild(loadingElement);

        // Add loading indicator styles
        addLoadingIndicatorStyles();
    } else {
        const messageElement = loadingElement.querySelector('.loading-message');
        if (messageElement) {
            messageElement.textContent = message;
        }
    }

    loadingElement.style.display = 'flex';
}

/**
 * Update loading progress message
 * @param {string} message - Progress message
 */
function updateLoadingProgress(message) {
    const loadingElement = document.getElementById('loading-indicator');
    if (loadingElement) {
        const messageElement = loadingElement.querySelector('.loading-message');
        if (messageElement) {
            messageElement.textContent = message;
        }
    }
}

/**
 * Hide loading indicator
 */
function hideLoadingIndicator() {
    const loadingElement = document.getElementById('loading-indicator');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

/**
 * Add CSS styles for loading indicator
 */
function addLoadingIndicatorStyles() {
    if (document.getElementById('loading-indicator-styles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'loading-indicator-styles';
    style.textContent = `
        .loading-indicator {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        }

        .loading-spinner {
            width: 60px;
            height: 60px;
            border: 4px solid rgba(0, 255, 255, 0.3);
            border-top: 4px solid #00ffff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        }

        .loading-message {
            color: #00ffff;
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: bold;
            text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
            .loading-spinner {
                width: 40px;
                height: 40px;
                border-width: 3px;
            }
            
            .loading-message {
                font-size: 16px;
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Show initialization error to user
 * @param {Error} error - The error that occurred
 */
function showInitializationError(error) {
    const errorDiv = document.createElement('div');
    errorDiv.id = 'initialization-error';
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 0, 0, 0.9);
        color: white;
        padding: 30px;
        border-radius: 10px;
        font-family: Arial, sans-serif;
        text-align: center;
        z-index: 10000;
        max-width: 500px;
        box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
    `;

    errorDiv.innerHTML = `
        <h2 style="margin: 0 0 15px 0; font-size: 2em;">Initialization Failed</h2>
        <p style="margin: 0 0 15px 0; font-size: 1.1em;">
            The game failed to initialize properly.
        </p>
        <p style="margin: 0 0 20px 0; font-size: 0.9em; color: #ffcccc;">
            Error: ${error.message}
        </p>
        <p style="margin: 0; font-size: 0.9em; color: #ffcccc;">
            Please try refreshing the page. If the problem persists, check the browser console for details.
        </p>
        <button onclick="location.reload()" style="
            margin-top: 20px;
            padding: 10px 20px;
            font-size: 1em;
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid white;
            color: white;
            border-radius: 5px;
            cursor: pointer;
        ">Reload Page</button>
    `;

    document.body.appendChild(errorDiv);
}

// Start game initialization with DOM ready check
// This ensures all DOM elements are available before initialization
function startGameWhenReady() {
    initializeGame().catch((error) => {
        logger.error('Fatal initialization error:', error);
    });
}

// Check if DOM is already loaded
if (document.readyState === 'loading') {
    // DOM is still loading, wait for DOMContentLoaded event
    document.addEventListener('DOMContentLoaded', startGameWhenReady);
} else {
    // DOM is already loaded (interactive or complete state)
    startGameWhenReady();
}
