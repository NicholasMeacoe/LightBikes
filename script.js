const { Game } = require('./game.js');
const { MultiplayerGame } = require('./MultiplayerGame.js');
const { AIController, AICoordinator } = require('./ai.js');
const { CollisionDetectionEngine } = require('./collision.js');
const { PlayerCollisionHandler } = require('./PlayerCollisionHandler.js');
const { PlayerController } = require('./controls.js');
const { DualControlScheme } = require('./DualControlScheme.js');
const { RenderingEngine } = require('./renderer.js');
const { SplitScreenCamera } = require('./SplitScreenCamera.js');
const { ScoreDisplay } = require('./scoreDisplay.js');
const { AudioManager } = require('./audio.js');
const { DifficultyManager } = require('./difficulty.js');
const { PowerUpManager } = require('./PowerUpManager.js');
const { StatusIndicator } = require('./StatusIndicator.js');
const { ModeSelector } = require('./ModeSelector.js');
const { SurvivalTimer } = require('./SurvivalTimer.js');
const { CountdownTimer } = require('./CountdownTimer.js');
const { LeaderboardSystem } = require('./LeaderboardSystem.js');
const { AchievementSystem } = require('./AchievementSystem.js');
const { GameModes } = require('./GameModes.js');
const { PerformanceMonitor } = require('./PerformanceMonitor.js');
const { PerformanceDegradationManager } = require('./PerformanceDegradationManager.js');
const { ParticleSystem } = require('./ParticleSystem.js');
const { ParticleSettingsUI } = require('./ParticleSettingsUI.js');
const { GlowEffectManager } = require('./GlowEffectManager.js');
const { CameraEffectsManager } = require('./CameraEffectsManager.js');
const { CameraEffectsUI } = require('./CameraEffectsUI.js');
const { CustomizationManager } = require('./CustomizationManager.js');
const { CustomizationUI } = require('./CustomizationUI.js');
const { PreferenceStorage } = require('./PreferenceStorage.js');
const { MusicSettingsUI } = require('./MusicSettingsUI.js');
const { MultiplayerGameOverUI } = require('./MultiplayerGameOverUI.js');
const { LocalScoringUI } = require('./LocalScoringUI.js');
const { BrowserCompatibility } = require('./BrowserCompatibility.js');
const { CompatibilityWarningUI } = require('./CompatibilityWarningUI.js');
const { ErrorHandler } = require('./ErrorHandler.js');
const { ErrorRecovery } = require('./ErrorRecovery.js');
const { CanvasVerifier } = require('./CanvasVerifier.js');
const { LoadingIndicator } = require('./LoadingIndicator.js');
const { DOMNotReadyError, CanvasCreationError, ModeSelectorError } = require('./InitializationErrors.js');
const { ErrorRecoveryStrategies } = require('./ErrorRecoveryStrategies.js');
const { InitializationState } = require('./InitializationState.js');

// Emoji support detection and fallback
function detectEmojiSupport() {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return false;
        
        ctx.textBaseline = 'top';
        ctx.font = '32px Arial';
        ctx.fillText('😀', 0, 0);
        
        // Check if emoji was rendered (has color data)
        const imageData = ctx.getImageData(16, 16, 1, 1).data;
        return imageData[0] !== 0 || imageData[1] !== 0 || imageData[2] !== 0;
    } catch (e) {
        return false;
    }
}

function initializeIconDisplay() {
    if (!detectEmojiSupport()) {
        console.warn('Emoji support not detected, using fallback text');
        document.body.classList.add('no-emoji-support');
    } else {
        console.log('Emoji support detected');
    }
}

// Initialize icon display immediately
initializeIconDisplay();

// Check WebGL availability before initializing game
function checkWebGLSupport() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl || !window.WebGLRenderingContext) {
            return false;
        }
        
        return true;
    } catch (e) {
        console.error('WebGL check failed:', e);
        return false;
    }
}

function showWebGLError() {
    const errorDiv = document.createElement('div');
    errorDiv.id = 'webgl-error';
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
        <h2 style="margin: 0 0 15px 0; font-size: 2em;">WebGL Not Supported</h2>
        <p style="margin: 0 0 15px 0; font-size: 1.1em;">
            Your browser does not support WebGL, which is required for this game.
        </p>
        <p style="margin: 0 0 20px 0; font-size: 0.9em; color: #ffcccc;">
            Please try using a modern browser like:
        </p>
        <ul style="list-style: none; padding: 0; margin: 0 0 20px 0; font-size: 0.9em;">
            <li>• Chrome 90+</li>
            <li>• Firefox 88+</li>
            <li>• Safari 14+</li>
            <li>• Edge 90+</li>
        </ul>
        <p style="margin: 0; font-size: 0.8em; color: #ffcccc;">
            If you're using a supported browser, WebGL may be disabled in your settings.
        </p>
    `;
    
    document.body.appendChild(errorDiv);
    console.error('WebGL is not available. The game cannot run without WebGL support.');
}

// Error handling components (initialized first)
let errorHandler = null;
let errorRecovery = null;
let loadingIndicator = null;
let errorRecoveryStrategies = null;
let initializationState = null;

// Game components (initialized in initializeGame)
let game = null;
let aiCoordinator = null;
let collisionDetectionEngine = null;
let playerCollisionHandler = null;
let playerController = null;
let renderingEngine = null;
let scoreDisplay = null;
let cameraEffectsManager = null;
let audioManager = null;
let difficultyManager = null;
let powerUpManager = null;
let statusIndicator = null;
let glowEffectManager = null;
let performanceMonitor = null;
let performanceDegradationManager = null;
let modeSelector = null;
let survivalTimer = null;
let countdownTimer = null;
let leaderboardSystem = null;
let achievementSystem = null;
let particleSettingsUI = null;
let cameraEffectsUI = null;
let glowSettingsUI = null;
let customizationManager = null;
let customizationUI = null;
let musicSettingsUI = null;

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
            controller: aiControllers[index] || aiControllers[0] // Fallback to first controller
        }));
        
        // Use AI coordinator to get coordinated decisions
        const decisions = aiCoordinator.coordinateAIDecisions(aiEntities, gameState, difficultyConfig);
        
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
        crashedEntities.forEach(entityId => {
            if (entityId.startsWith('ai_')) {
                const aiIndex = gameState.aiOpponents.findIndex(ai => ai.id === entityId);
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
    updateRemainingEntityDisplay(survivingEntities);
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
    
    if (winner === 'player' && survivingEntities.length === 1 && survivingEntities[0] === 'player') {
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
    const aliveAICount = survivingEntities.filter(id => id.startsWith('ai_')).length;
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
        const aliveAIs = finalGameState.aiOpponents ? 
            finalGameState.aiOpponents.filter(ai => ai.alive).length : 
            (finalGameState.ai ? 1 : 0);
        
        // Create victory/defeat message
        let resultMessage = '';
        if (playerWon) {
            resultMessage = totalAIs > 1 ? 
                `Victory! You defeated ${totalAIs} AI opponents!` : 
                'Victory! You defeated the AI!';
        } else {
            resultMessage = totalAIs > 1 ? 
                `Defeated by ${totalAIs} AI opponents` : 
                'Defeated by AI';
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
                        <span class="stat-value">${finalGameState.roundsPlayed || (finalGameState.playerScore + finalGameState.aiScore)}</span>
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
game.setPowerUpManager(powerUpManager);
collisionDetectionEngine.setPowerUpManager(powerUpManager);
playerCollisionHandler.setPowerUpManager(powerUpManager);

// Wire up camera effects system integration
collisionDetectionEngine.setCameraEffectsManager(cameraEffectsManager);
playerCollisionHandler.setCameraEffectsManager(cameraEffectsManager);
game.setCameraEffectsManager(cameraEffectsManager);
renderingEngine.setCameraEffectsManager(cameraEffectsManager);

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
    restartButton.style.display = 'none';
    
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
            'gameOver', 'restart', 'muteButton', 'performanceButton',
            'particleSettingsButton', 'glowSettingsButton', 'difficultySelector',
            'aiCountSelector', 'pauseOverlay'
        ];
        
        let compatibilityIssues = 0;
        
        uiElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                const styles = window.getComputedStyle(element);
                const zIndex = parseInt(styles.zIndex) || 0;
                
                // Ensure UI elements have proper z-index above the canvas
                if (zIndex < 100 && element.style.position !== 'static') {
                    console.warn(`UI element ${elementId} may be obscured by glow effects`);
                    compatibilityIssues++;
                }
            }
        });
        
        if (compatibilityIssues === 0) {
            console.log('GlowEffectManager: UI compatibility test passed');
        } else {
            console.warn(`GlowEffectManager: ${compatibilityIssues} potential UI compatibility issues detected`);
        }
        
        return compatibilityIssues === 0;
    } catch (error) {
        console.error('Error testing UI compatibility:', error);
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
    isTimeTrialActive = (mode === GameModes.TIME_TRIAL);
    
    if (mode === GameModes.TIME_TRIAL) {
        // Start Time Trial mode with countdown
        countdownTimer.start(() => {
            initializeTimeTrialMode();
        });
    } else if (mode === GameModes.ARENA_SHRINK) {
        // Start Arena Shrink mode with countdown
        countdownTimer.start(() => {
            initializeArenaShrinkMode();
        });
    } else if (mode === GameModes.LOCAL_MULTIPLAYER) {
        // Start Local Multiplayer mode immediately
        initializeLocalMultiplayerMode();
    } else {
        // Start Classic mode immediately
        initializeClassicMode();
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
    restartButton.style.display = 'none';
    updatePauseOverlay();
    
    // Update UI for Time Trial mode
    updateUIForGameMode();
    
    // Create Time Trial UI elements and hide Arena Shrink UI
    createTimeTrialUI();
    hideArenaShrinkUI();
    
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
    restartButton.style.display = 'none';
    updatePauseOverlay();
    
    // Update UI for Classic mode
    updateUIForGameMode();
    
    // Hide Time Trial and Arena Shrink UI elements
    hideTimeTrialUI();
    hideArenaShrinkUI();
    hideRemainingEntitiesDisplay();
    
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
            showFinalArenaMessage();
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
    restartButton.style.display = 'none';
    updatePauseOverlay();
    
    // Update UI for Arena Shrink mode
    updateUIForGameMode();
    
    // Hide Time Trial UI elements and create Arena Shrink UI
    hideTimeTrialUI();
    hideRemainingEntitiesDisplay();
    createArenaShrinkUI();
    
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
        dualControlScheme = new DualControlScheme(multiplayerGame);
        dualControlScheme.init();
    } else {
        dualControlScheme.setGame(multiplayerGame);
    }
    
    // Initialize split screen camera
    if (!splitScreenCamera) {
        splitScreenCamera = new SplitScreenCamera(
            renderingEngine.camera,
            multiplayerGame.player1,
            multiplayerGame.player2
        );
    } else {
        splitScreenCamera.setPlayers(multiplayerGame.player1, multiplayerGame.player2);
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
    restartButton.style.display = 'none';
    updatePauseOverlay();
    
    // Update UI for Local Multiplayer mode
    updateUIForGameMode();
    
    // Hide other mode UI elements
    hideTimeTrialUI();
    hideArenaShrinkUI();
    hideRemainingEntitiesDisplay();
    
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
            initializeTimeTrialMode();
        });
    } else if (currentGameMode === GameModes.ARENA_SHRINK) {
        // Stop any running timers
        survivalTimer.stop();
        countdownTimer.stop();
        
        // Restart Arena Shrink mode with countdown
        countdownTimer.start(() => {
            initializeArenaShrinkMode();
        });
    } else if (currentGameMode === GameModes.LOCAL_MULTIPLAYER) {
        // Restart Local Multiplayer mode
        initializeLocalMultiplayerMode();
    } else {
        // Restart Classic mode
        initializeClassicMode();
    }
}

// Duplicate event listener setup removed - now handled in initializeGame()

function updatePauseOverlay() {
    const gameState = game.getGameState();
    if (gameState.isPaused) {
        pauseOverlay.style.display = 'flex';
    } else {
        pauseOverlay.style.display = 'none';
    }
}

function updateMuteButton() {
    const isMuted = audioManager.getMuted();
    if (isMuted) {
        muteButton.textContent = '🔇';
        muteButton.classList.add('muted');
        muteButton.title = 'Unmute Audio';
    } else {
        muteButton.textContent = '🔊';
        muteButton.classList.remove('muted');
        muteButton.title = 'Mute Audio';
    }
}

function updatePerformanceButton() {
    const isPerformanceModeEnabled = performanceDegradationManager.getSettings().performanceModeEnabled;
    if (isPerformanceModeEnabled) {
        performanceButton.classList.add('active');
        performanceButton.title = 'Disable Performance Mode';
    } else {
        performanceButton.classList.remove('active');
        performanceButton.title = 'Enable Performance Mode';
    }
}

function updateDifficultyUI() {
    const currentDifficulty = difficultyManager.getCurrentDifficulty();
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    
    difficultyButtons.forEach(button => {
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
    
    aiCountButtons.forEach(button => {
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
            console.warn('Failed to save AI count to localStorage:', error);
        }
        
        // Restart the game with new AI count if currently playing
        if (!game.gameOver && currentGameMode !== GameModes.TIME_TRIAL) {
            restartGame();
        }
    }
}

// Track previous game state for audio triggers
let previousGameState = null;

function animate() {
    requestAnimationFrame(animate);

    // Start frame performance monitoring with error recovery
    if (performanceMonitor && !errorRecovery.isFeatureDisabled('PerformanceMonitor')) {
        try {
            performanceMonitor.startFrameMonitoring();
        } catch (error) {
            errorRecovery.handleFeatureRuntimeError('PerformanceMonitor', error, null);
        }
    }

    const gameState = game.getGameState();

    // Update glow effect system with error recovery
    const deltaTime = (performanceMonitor && performanceMonitor.getLastFrameTime) ? 
        performanceMonitor.getLastFrameTime() / 1000 : 0.016; // Default to 60fps
    
    if (glowEffectManager && !errorRecovery.isFeatureDisabled('GlowEffectManager')) {
        try {
            glowEffectManager.update(deltaTime, gameState);
        } catch (error) {
            errorRecovery.handleFeatureRuntimeError('GlowEffectManager', error, () => {
                glowEffectManager = null;
            });
        }
    }

    // Update camera effects system with error recovery
    if (cameraEffectsManager && !errorRecovery.isFeatureDisabled('CameraEffectsManager')) {
        try {
            cameraEffectsManager.update(deltaTime);
        } catch (error) {
            errorRecovery.handleFeatureRuntimeError('CameraEffectsManager', error, () => {
                cameraEffectsManager = null;
            });
        }
    }

    if (!game.gameOver) {
        // Only update game logic when not paused
        if (!gameState.isPaused) {
            // Start engine sound when game starts
            if (gameState.gameStarted && (!previousGameState || !previousGameState.gameStarted)) {
                audioManager.handleGameStart();
            }
            
            // Multi-AI coordination (in Classic and Arena Shrink modes, not in multiplayer)
            if (!isTimeTrialActive && currentGameMode !== GameModes.LOCAL_MULTIPLAYER && 
                gameState.aiOpponents && gameState.aiOpponents.length > 0) {
                const difficultyConfig = difficultyManager.getDifficultyConfig();
                const aiDecisions = calculateMultiAIDirections(gameState, difficultyConfig);
                applyAIDecisions(aiDecisions, game);
            }

            game.update();
            
            // Update split screen camera in multiplayer mode
            if (currentGameMode === GameModes.LOCAL_MULTIPLAYER && splitScreenCamera) {
                splitScreenCamera.update();
            }

            // Power-up system update - handles spawning, cleanup, and effect management
            powerUpManager.update();
            
            // Check for power-up collections
            powerUpManager.checkCollections(gameState);

            // Time Trial specific updates
            if (isTimeTrialActive) {
                // Update survival timer (it handles pause state internally)
                if (!gameState.isPaused) {
                    // Check for achievements
                    const elapsedSeconds = survivalTimer.getElapsedTime() / 1000;
                    achievementSystem.checkMilestone(elapsedSeconds);
                }
            }

            // Collision detection with power-up effects integration and dynamic boundaries
            performanceMonitor.startCollisionDetection();
            let collisionResult;
            
            // Use PlayerCollisionHandler for multiplayer games
            if (currentGameMode === GameModes.LOCAL_MULTIPLAYER) {
                collisionResult = playerCollisionHandler.checkMultiplayerCollisions(game.getGameState(), game);
                // Map multiplayer result to standard format for compatibility
                collisionResult.playerCollided = collisionResult.player1Collided || collisionResult.player2Collided;
                collisionResult.aiCollided = false; // No AI in multiplayer
                if (!collisionResult.crashedEntities) {
                    collisionResult.crashedEntities = [];
                    if (collisionResult.player1Collided) collisionResult.crashedEntities.push('P1');
                    if (collisionResult.player2Collided) collisionResult.crashedEntities.push('P2');
                }
                if (!collisionResult.survivingEntities) {
                    collisionResult.survivingEntities = [];
                    if (!collisionResult.player1Collided) collisionResult.survivingEntities.push('P1');
                    if (!collisionResult.player2Collided) collisionResult.survivingEntities.push('P2');
                }
            } else {
                collisionResult = collisionDetectionEngine.checkCollisions(game.getGameState(), game);
            }
            
            performanceMonitor.endCollisionDetection();
            const { playerCollided, aiCollided, winner, crashedEntities, survivingEntities } = collisionResult;
            
            if (playerCollided || aiCollided) {
                // Play explosion sound immediately
                audioManager.playExplosionSound();
                
                // Trigger camera shake for collision
                if (cameraEffectsManager && cameraEffectsManager.isEnabled()) {
                    // Determine collision intensity based on what crashed
                    let collisionIntensity = 1.0;
                    if (playerCollided && aiCollided) {
                        collisionIntensity = 1.5; // Both crashed - maximum intensity
                    } else if (playerCollided || aiCollided) {
                        collisionIntensity = 1.0; // Single crash - normal intensity
                    }
                    
                    // Use appropriate player reference based on game mode
                    const playerRef = currentGameMode === GameModes.LOCAL_MULTIPLAYER ? 
                        gameState.player1 : gameState.player;
                    if (playerRef) {
                        cameraEffectsManager.onCollision(playerRef, collisionIntensity);
                    }
                }
                
                // Trigger explosion particle effects at collision points
                if (currentGameMode === GameModes.LOCAL_MULTIPLAYER) {
                    // Handle multiplayer explosion effects
                    if (collisionResult.player1Collided && gameState.player1) {
                        renderingEngine.createExplosionEffect(gameState.player1, 1.0);
                    }
                    if (collisionResult.player2Collided && gameState.player2) {
                        renderingEngine.createExplosionEffect(gameState.player2, 1.0);
                    }
                } else {
                    // Handle single-player explosion effects
                    if (playerCollided && gameState.player) {
                        renderingEngine.createExplosionEffect(gameState.player, 1.0);
                    }
                    if (aiCollided && gameState.aiOpponents) {
                        gameState.aiOpponents.forEach(ai => {
                            if (!ai.alive) {
                                renderingEngine.createExplosionEffect(ai, 1.0);
                            }
                        });
                    } else if (aiCollided && gameState.ai) {
                        // Backward compatibility for single AI
                        renderingEngine.createExplosionEffect(gameState.ai, 1.0);
                    }
                }
                
                if (isTimeTrialActive) {
                    // Handle Time Trial game end
                    survivalTimer.stop();
                    const finalTime = survivalTimer.getElapsedTime();
                    
                    // Check if time qualifies for leaderboard
                    if (leaderboardSystem.isNewRecord(finalTime)) {
                        leaderboardSystem.addScore(finalTime);
                    }
                    
                    game.gameOver = true;
                    audioManager.playDefeatSound();
                } else if (currentGameMode === GameModes.LOCAL_MULTIPLAYER) {
                    // Handle multiplayer collision results
                    game.handleRoundEnd(collisionResult);
                    game.gameOver = true;
                    
                    // Play appropriate sound based on result
                    if (collisionResult.player1Collided && collisionResult.player2Collided) {
                        audioManager.playDefeatSound(); // Tie
                    } else if (collisionResult.player1Collided) {
                        audioManager.playVictorySound(); // P2 wins
                    } else if (collisionResult.player2Collided) {
                        audioManager.playVictorySound(); // P1 wins
                    }
                } else {
                    // Handle multi-AI collision results
                    handleMultiAICollisions(collisionResult, game);
                    
                    // Play victory/defeat sound based on winner
                    if (winner === 'player') {
                        audioManager.playVictorySound();
                    } else if (winner && winner.startsWith('ai_')) {
                        audioManager.playDefeatSound();
                    } else if (winner === 'tie') {
                        audioManager.playDefeatSound(); // Tie counts as defeat for player
                    }
                }
                
                // Handle game end for audio
                audioManager.handleGameEnd();
            }
        } else {
            // Handle pause state change
            if (previousGameState && !previousGameState.isPaused) {
                audioManager.handleGamePause();
                
                // Pause camera effects
                if (cameraEffectsManager && cameraEffectsManager.isEnabled()) {
                    cameraEffectsManager.pause();
                }
                
                // Pause survival timer in Time Trial mode
                if (isTimeTrialActive) {
                    survivalTimer.pause();
                }
            }
            
            // Handle resume state change
            if (previousGameState && previousGameState.isPaused && !gameState.isPaused) {
                audioManager.handleGameResume();
                
                // Resume camera effects
                if (cameraEffectsManager && cameraEffectsManager.isEnabled()) {
                    cameraEffectsManager.resume();
                }
                
                // Resume survival timer in Time Trial mode
                if (isTimeTrialActive) {
                    survivalTimer.resume();
                }
            }
        }

        // Update pause overlay visibility
        updatePauseOverlay();

        // Update display based on game mode
        if (currentGameMode === GameModes.LOCAL_MULTIPLAYER) {
            // Update multiplayer scores
            if (localScoringUI) {
                localScoringUI.updateScores();
            }
        } else if (isTimeTrialActive) {
            // Update timer display for Time Trial mode
            updateTimeTrialDisplay();
        } else if (currentGameMode === GameModes.ARENA_SHRINK) {
            // Update Arena Shrink mode display
            updateArenaShrinkDisplay();
            // Also update score display for Arena Shrink mode
            const updatedGameState = game.getGameState();
            scoreDisplay.updateGameplayScores(updatedGameState.playerScore, updatedGameState.aiScore);
            
            // Update remaining entities display for multi-AI Arena Shrink
            if (updatedGameState.aiOpponents && updatedGameState.aiOpponents.length > 1) {
                const aliveEntities = game.getAliveEntities();
                const survivingIds = aliveEntities.map(entity => entity.id);
                updateRemainingEntityDisplay(survivingIds);
            }
        } else {
            // Update score display for Classic mode
            const updatedGameState = game.getGameState();
            scoreDisplay.updateGameplayScores(updatedGameState.playerScore, updatedGameState.aiScore);
            
            // Update remaining entities display for multi-AI Classic mode
            if (updatedGameState.aiOpponents && updatedGameState.aiOpponents.length > 1) {
                const aliveEntities = game.getAliveEntities();
                const survivingIds = aliveEntities.map(entity => entity.id);
                updateRemainingEntityDisplay(survivingIds);
            }
        }

        // Update status indicator with current power-up effects
        if (statusIndicator) {
            const allActiveEffects = powerUpManager.getAllActiveEffects();
            statusIndicator.updateStatus(allActiveEffects);
            statusIndicator.updateTimers();
        }

        // Add powerUpManager reference to game state for particle system integration
        updatedGameState.powerUpManager = powerUpManager;

        // Always render, even when paused, to maintain visual feedback
        try {
            renderingEngine.draw(updatedGameState);
        } catch (error) {
            console.error('Error rendering game:', error);
            // Attempt simplified rendering
            if (errorRecovery) {
                const success = errorRecovery.handleRenderingError(error, () => {
                    // Simplified rendering fallback
                    if (renderingEngine && renderingEngine.renderer && renderingEngine.scene && renderingEngine.camera) {
                        renderingEngine.renderer.render(renderingEngine.scene, renderingEngine.camera);
                    }
                });
                if (!success) {
                    // Critical rendering failure - stop game loop
                    console.error('Critical rendering failure, stopping game loop');
                    return;
                }
            }
        }
        
        // Render with glow effects (with fallback to standard rendering)
        if (glowEffectManager && !errorRecovery.isFeatureDisabled('GlowEffectManager')) {
            try {
                glowEffectManager.render();
            } catch (error) {
                errorRecovery.handleFeatureRuntimeError('GlowEffectManager', error, () => {
                    glowEffectManager = null;
                });
                // Fallback to standard rendering if glow effects fail
                if (renderingEngine && renderingEngine.renderer && renderingEngine.scene && renderingEngine.camera) {
                    renderingEngine.renderer.render(renderingEngine.scene, renderingEngine.camera);
                }
            }
        }
    } else {
        // Handle game over display based on mode
        if (currentGameMode === GameModes.LOCAL_MULTIPLAYER) {
            // Show multiplayer-specific game over UI
            showMultiplayerGameOver();
        } else if (isTimeTrialActive) {
            showTimeTrialGameOver();
            document.getElementById('gameOver').style.display = 'block';
            restartButton.style.display = 'block';
        } else if (currentGameMode === GameModes.ARENA_SHRINK) {
            showArenaShrinkGameOver();
            document.getElementById('gameOver').style.display = 'block';
            restartButton.style.display = 'block';
        } else {
            // Show multi-AI game over with enhanced information
            showMultiAIGameOver();
            document.getElementById('gameOver').style.display = 'block';
            restartButton.style.display = 'block';
        }
    }
    
    // Update performance monitoring and degradation management with error recovery
    if (performanceMonitor && !errorRecovery.isFeatureDisabled('PerformanceMonitor')) {
        try {
            performanceMonitor.update();
        } catch (error) {
            errorRecovery.handleFeatureRuntimeError('PerformanceMonitor', error, null);
        }
    }
    
    if (performanceDegradationManager && !errorRecovery.isFeatureDisabled('PerformanceDegradationManager')) {
        try {
            performanceDegradationManager.update();
        } catch (error) {
            errorRecovery.handleFeatureRuntimeError('PerformanceDegradationManager', error, null);
        }
    }
    
    // Store current state for next frame comparison
    previousGameState = { ...gameState };
}

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

/**
 * Perform comprehensive browser compatibility check
 * @returns {Object} Compatibility check result
 */
function performBrowserCompatibilityCheck() {
    // Check if user already acknowledged warnings this session
    const acknowledged = sessionStorage.getItem('lightbikes_compatibility_acknowledged');
    
    // Create compatibility checker
    const compatibility = new BrowserCompatibility();
    const report = compatibility.checkCompatibility();
    
    console.log('Browser Compatibility Check:', report);
    
    // If there are critical errors, show error and block game
    if (!report.isCompatible) {
        const warningUI = new CompatibilityWarningUI();
        
        if (report.errors.length > 0) {
            // Critical errors - cannot continue
            warningUI.showWarning(report);
            return { isCompatible: false, report };
        }
    }
    
    // If there are warnings but no errors, show warning but allow continuation
    if (report.warnings.length > 0 && !acknowledged) {
        const warningUI = new CompatibilityWarningUI();
        warningUI.showWarning(report);
        // Don't block initialization - user can dismiss and continue
    }
    
    return { isCompatible: true, report };
}

/**
 * Register recovery strategies for all game components
 */
function registerRecoveryStrategies() {
    // Critical components - game cannot run without these
    errorRecovery.registerStrategy('Game', {
        initialize: async () => new Game(),
        critical: true,
        maxRetries: 3
    });
    
    errorRecovery.registerStrategy('AICoordinator', {
        initialize: async () => new AICoordinator(),
        critical: true,
        maxRetries: 3
    });
    
    errorRecovery.registerStrategy('CollisionDetectionEngine', {
        initialize: async () => new CollisionDetectionEngine(),
        critical: true,
        maxRetries: 3
    });
    
    errorRecovery.registerStrategy('PlayerCollisionHandler', {
        initialize: async () => new PlayerCollisionHandler(),
        critical: true,
        maxRetries: 3
    });
    
    errorRecovery.registerStrategy('PlayerController', {
        initialize: async () => new PlayerController(game),
        critical: true,
        maxRetries: 3
    });
    
    errorRecovery.registerStrategy('RenderingEngine', {
        initialize: async () => new RenderingEngine(game.bounds),
        fallback: async () => {
            // Simplified renderer with minimal features
            console.warn('Using simplified rendering mode');
            const simpleRenderer = new RenderingEngine(game.bounds);
            // Disable advanced features
            if (simpleRenderer.renderer) {
                simpleRenderer.renderer.setPixelRatio(1); // Lower pixel ratio
            }
            return simpleRenderer;
        },
        critical: true,
        maxRetries: 2
    });
    
    errorRecovery.registerStrategy('ScoreDisplay', {
        initialize: async () => new ScoreDisplay(renderingEngine),
        critical: true,
        maxRetries: 3
    });
    
    errorRecovery.registerStrategy('AudioManager', {
        initialize: async () => new AudioManager(),
        fallback: async () => {
            // Silent audio manager
            console.warn('Audio system unavailable, continuing without sound');
            const silentAudio = new AudioManager();
            silentAudio.setMuted(true);
            return silentAudio;
        },
        critical: false,
        maxRetries: 2
    });
    
    errorRecovery.registerStrategy('DifficultyManager', {
        initialize: async () => new DifficultyManager(game, null),
        critical: true,
        maxRetries: 3
    });
    
    errorRecovery.registerStrategy('PowerUpManager', {
        initialize: async () => new PowerUpManager(game, renderingEngine, collisionDetectionEngine, audioManager),
        fallback: async () => {
            // Disabled power-up manager
            console.warn('Power-ups disabled due to initialization error');
            const disabledPowerUps = new PowerUpManager(game, renderingEngine, collisionDetectionEngine, audioManager);
            disabledPowerUps.enabled = false;
            return disabledPowerUps;
        },
        critical: false,
        maxRetries: 2
    });
    
    errorRecovery.registerStrategy('PerformanceMonitor', {
        initialize: async () => new PerformanceMonitor(),
        critical: true,
        maxRetries: 3
    });
    
    errorRecovery.registerStrategy('PerformanceDegradationManager', {
        initialize: async () => new PerformanceDegradationManager(game, performanceMonitor),
        critical: true,
        maxRetries: 3
    });
    
    // Non-critical components - game can run without these
    errorRecovery.registerStrategy('CameraEffectsManager', {
        initialize: async () => {
            const manager = new CameraEffectsManager(
                renderingEngine.camera,
                renderingEngine.renderer,
                game.getGameState()
            );
            if (!manager.initialize()) {
                throw new Error('Camera effects initialization failed');
            }
            return manager;
        },
        critical: false,
        maxRetries: 1
    });
    
    errorRecovery.registerStrategy('StatusIndicator', {
        initialize: async () => new StatusIndicator(),
        critical: false,
        maxRetries: 1
    });
    
    errorRecovery.registerStrategy('GlowEffectManager', {
        initialize: async () => {
            const manager = new GlowEffectManager(
                renderingEngine.renderer,
                renderingEngine.scene,
                renderingEngine.camera
            );
            if (!manager.initialize()) {
                throw new Error('Glow effects initialization failed');
            }
            return manager;
        },
        critical: false,
        maxRetries: 1
    });
}

/**
 * Initialize the game with proper sequence and error handling
 * @returns {Promise<boolean>} True if initialization succeeded
 */
async function initializeGame() {
    try {
        // Create initialization state tracker
        initializationState = new InitializationState();
        initializationState.start();
        initializationState.completeStep('domReady');
        
        // Create LoadingIndicator at start
        loadingIndicator = new LoadingIndicator();
        loadingIndicator.show('Initializing game...');
        
        // Initialize error handling system first
        loadingIndicator.updateProgress('init', 'Initializing error handling...');
        errorHandler = new ErrorHandler();
        errorHandler.init();
        errorRecovery = new ErrorRecovery(errorHandler);
        errorRecoveryStrategies = new ErrorRecoveryStrategies();
        initializationState.completeStep('errorHandlingInit');
        
        // Register recovery strategies for all components
        registerRecoveryStrategies();
        
        // 1. Perform comprehensive browser compatibility check
        loadingIndicator.updateProgress('compatibility', 'Checking browser compatibility...');
        const compatibilityCheck = performBrowserCompatibilityCheck();
        
        if (!compatibilityCheck.isCompatible) {
            loadingIndicator.hide();
            return false;
        }
        initializationState.completeStep('compatibilityCheck');
        
        // 2. Check WebGL support with error recovery
        loadingIndicator.updateProgress('webgl', 'Checking WebGL support...');
        if (!checkWebGLSupport()) {
            const webglError = new CanvasCreationError('WebGL not supported');
            const compatibilityMessage = errorRecoveryStrategies.getWebGLCompatibilityMessage();
            webglError.actionableSteps = compatibilityMessage.actionableSteps;
            initializationState.recordError('webglCheck', webglError);
            errorHandler.handleWebGLError(webglError);
            loadingIndicator.showError(webglError);
            return false;
        }
        initializationState.completeStep('webglCheck');
        
        // 3. Initialize core game components with recovery
        loadingIndicator.updateProgress('game', 'Creating game instance...');
        game = await errorRecovery.initializeWithRecovery('Game');
        aiCoordinator = await errorRecovery.initializeWithRecovery('AICoordinator');
        collisionDetectionEngine = await errorRecovery.initializeWithRecovery('CollisionDetectionEngine');
        playerCollisionHandler = await errorRecovery.initializeWithRecovery('PlayerCollisionHandler');
        playerController = await errorRecovery.initializeWithRecovery('PlayerController');
        initializationState.completeStep('gameCreation');
        
        // 4. Initialize renderer with recovery (creates scene and camera)
        loadingIndicator.updateProgress('renderer', 'Initializing 3D renderer...');
        renderingEngine = await errorRecovery.initializeWithRecovery('RenderingEngine');
        
        // Verify renderer was created successfully
        if (!renderingEngine || !renderingEngine.renderer || !renderingEngine.scene || !renderingEngine.camera) {
            const rendererError = new CanvasCreationError('Failed to initialize rendering engine');
            initializationState.recordError('rendererInit', rendererError);
            throw rendererError;
        }
        initializationState.completeStep('rendererInit');
        
        // 4.1. Verify canvas creation and visibility
        loadingIndicator.updateProgress('canvas', 'Verifying canvas...');
        const canvasVerifier = new CanvasVerifier();
        const verificationResult = canvasVerifier.verifyAll(
            renderingEngine.renderer,
            renderingEngine.scene,
            renderingEngine.camera
        );
        
        // Log verification results for debugging
        console.log('Canvas verification results:', {
            success: verificationResult.success,
            checks: {
                created: verificationResult.checks.created.success,
                visible: verificationResult.checks.visible.success,
                size: verificationResult.checks.size.success,
                render: verificationResult.checks.render.success
            },
            errors: verificationResult.errors
        });
        
        // Throw descriptive error if verification fails
        if (!verificationResult.success) {
            const errorMessage = 'Canvas verification failed:\n' + 
                verificationResult.errors.map(err => `  - ${err}`).join('\n');
            const canvasError = new CanvasCreationError(errorMessage, verificationResult);
            initializationState.recordError('canvasVerification', canvasError);
            throw canvasError;
        }
        initializationState.completeStep('canvasVerification');
        
        // 5. Scene is already created by RenderingEngine, lighting is already added
        // The RenderingEngine constructor handles scene setup, lighting, and arena creation
        
        // 6. Initialize game state (already done in Game constructor)
        
        // 7. Set up event listeners
        loadingIndicator.updateProgress('controls', 'Setting up controls...');
        setupEventListeners();
        initializationState.completeStep('controlsSetup');
        
        // 8. Initialize all other systems with recovery
        loadingIndicator.updateProgress('systems', 'Initializing game systems...');
        await initializeGameSystemsWithRecovery();
        initializationState.completeStep('systemsInit');
        
        // 9. Verify mode selector visibility
        loadingIndicator.updateProgress('mode-selector', 'Preparing mode selector...');
        // Mode selector will be shown after loading indicator hides
        // Visibility verification is handled by ModeSelector.show()
        initializationState.completeStep('modeSelectorReady');
        
        // 10. Start game loop
        loadingIndicator.updateProgress('start', 'Starting game...');
        loadingIndicator.hide();
        animate();
        initializationState.complete();
        
        console.log('Game initialization completed successfully');
        console.log('Initialization state:', initializationState.getState());
        
        // Log recovery status
        const recoveryStatus = errorRecovery.getStatus();
        if (recoveryStatus.disabledFeatures.length > 0) {
            console.warn('Some features were disabled:', recoveryStatus.disabledFeatures);
        }
        if (recoveryStatus.fallbackMode) {
            console.warn('Running in fallback mode');
        }
        
        return true;
        
    } catch (error) {
        console.error('Game initialization failed:', error);
        
        // Record error in state if available
        if (initializationState) {
            initializationState.recordError(initializationState.currentStep || 'unknown', error);
            console.log('Initialization state at failure:', initializationState.getState());
            
            // Get recovery recommendation
            const recommendation = initializationState.getRecoveryRecommendation();
            console.log('Recovery recommendation:', recommendation);
        }
        
        // Transform loading indicator to error display
        if (loadingIndicator) {
            loadingIndicator.showError(error, () => {
                window.location.reload();
            });
        } else if (errorHandler) {
            errorHandler.handleInitializationError(error, () => {
                window.location.reload();
            }, 'Game');
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
    // Player controller initialization
    playerController.init();
    
    // Restart button
    const restartButton = document.getElementById('restart');
    if (restartButton) {
        restartButton.addEventListener('click', () => {
            restartGame();
        });
    }
    
    // Touch controls
    const upButton = document.getElementById('up');
    const downButton = document.getElementById('down');
    const leftButton = document.getElementById('left');
    const rightButton = document.getElementById('right');
    
    if (upButton) {
        upButton.addEventListener('touchstart', () => {
            const directionChanged = game.changePlayerDirection('ArrowUp');
            if (directionChanged) {
                audioManager.playTurnSound();
            }
        });
    }
    
    if (downButton) {
        downButton.addEventListener('touchstart', () => {
            const directionChanged = game.changePlayerDirection('ArrowDown');
            if (directionChanged) {
                audioManager.playTurnSound();
            }
        });
    }
    
    if (leftButton) {
        leftButton.addEventListener('touchstart', () => {
            const directionChanged = game.changePlayerDirection('ArrowLeft');
            if (directionChanged) {
                audioManager.playTurnSound();
            }
        });
    }
    
    if (rightButton) {
        rightButton.addEventListener('touchstart', () => {
            const directionChanged = game.changePlayerDirection('ArrowRight');
            if (directionChanged) {
                audioManager.playTurnSound();
            }
        });
    }
    
    // Pause/Resume
    const resumeButton = document.getElementById('resumeButton');
    if (resumeButton) {
        resumeButton.addEventListener('click', () => {
            const resumeResult = game.resume();
            if (resumeResult) {
                updatePauseOverlay();
                
                // Ensure glow effects resume properly
                if (glowEffectManager && glowEffectManager.initialized) {
                    glowEffectManager.forceResume();
                }
                
                // Resume camera effects
                if (cameraEffectsManager && cameraEffectsManager.isEnabled()) {
                    cameraEffectsManager.resume();
                }
            } else {
                console.debug('Resume operation failed - game may be in invalid state');
            }
        });
    }
    
    // Mute button
    const muteButton = document.getElementById('muteButton');
    if (muteButton) {
        muteButton.addEventListener('click', () => {
            const currentMuteState = audioManager.getMuted();
            audioManager.setMuted(!currentMuteState);
            updateMuteButton();
        });
    }
    
    // Performance button
    const performanceButton = document.getElementById('performanceButton');
    if (performanceButton) {
        performanceButton.addEventListener('click', () => {
            const currentPerformanceMode = performanceDegradationManager.getSettings().performanceModeEnabled;
            performanceDegradationManager.setPerformanceMode(!currentPerformanceMode);
            updatePerformanceButton();
        });
    }
    
    // AI count selection
    const aiCountButtons = document.querySelectorAll('.ai-count-btn');
    aiCountButtons.forEach(button => {
        button.addEventListener('click', () => {
            const selectedCount = parseInt(button.getAttribute('data-count'));
            setAICount(selectedCount);
            updateAICountUI();
        });
    });
    
    // Difficulty selection
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    difficultyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const selectedLevel = button.getAttribute('data-level');
            difficultyManager.setDifficulty(selectedLevel);
            updateDifficultyUI();
        });
    });
    
    // Audio initialization on first user interaction
    let audioInitialized = false;
    const initializeAudio = async () => {
        if (!audioInitialized) {
            audioInitialized = true;
            const audioInitSuccess = await audioManager.initialize();
            
            if (audioInitSuccess && audioManager.isMusicAvailable()) {
                console.log('Music system ready for playback');
            } else {
                console.warn('Music system not available, continuing without background music');
            }
        }
    };
    
    document.addEventListener('click', initializeAudio, { once: true });
    document.addEventListener('keydown', initializeAudio, { once: true });
    document.addEventListener('touchstart', initializeAudio, { once: true });
    
    // Window resize
    window.addEventListener('resize', () => {
        if (renderingEngine) {
            renderingEngine.renderer.setSize(window.innerWidth, window.innerHeight);
            renderingEngine.camera.aspect = window.innerWidth / window.innerHeight;
            renderingEngine.camera.updateProjectionMatrix();
            
            if (glowEffectManager) {
                glowEffectManager.handleResize(window.innerWidth, window.innerHeight);
            }
        }
    });
    
    // Page unload cleanup
    window.addEventListener('beforeunload', () => {
        try {
            if (audioManager) {
                audioManager.cleanup();
            }
        } catch (error) {
            console.warn('Error during music system cleanup:', error);
        }
    });
}

/**
 * Initialize all game systems with error recovery
 * @returns {Promise<void>}
 */
async function initializeGameSystemsWithRecovery() {
    // Initialize multiplayer-specific components (created on demand)
    multiplayerGame = null;
    dualControlScheme = null;
    splitScreenCamera = null;
    
    // Initialize score display (critical component) with recovery
    scoreDisplay = await errorRecovery.initializeWithRecovery('ScoreDisplay');
    
    // Initialize camera effects system (non-critical) with recovery
    cameraEffectsManager = await errorRecovery.initializeWithRecovery('CameraEffectsManager');
    if (!cameraEffectsManager) {
        console.log('Camera effects disabled, continuing without them');
    }
    
    // Initialize audio manager with recovery and fallback
    audioManager = await errorRecovery.initializeWithRecovery('AudioManager');
    
    // Initialize difficulty manager (critical component) with recovery
    difficultyManager = await errorRecovery.initializeWithRecovery('DifficultyManager');
    
    // Initialize power-up manager with recovery and fallback
    powerUpManager = await errorRecovery.initializeWithRecovery('PowerUpManager');
    if (!powerUpManager || powerUpManager.enabled === false) {
        console.log('Power-ups disabled, continuing without them');
    }
    
    // Initialize status indicator (non-critical) with recovery
    statusIndicator = await errorRecovery.initializeWithRecovery('StatusIndicator');
    if (!statusIndicator) {
        console.log('Status indicator disabled, continuing without it');
    }
    
    // Initialize glow effect system (non-critical) with recovery
    glowEffectManager = await errorRecovery.initializeWithRecovery('GlowEffectManager');
    if (!glowEffectManager) {
        console.log('Glow effects disabled, continuing without them');
    } else {
        setTimeout(() => {
            try {
                testUICompatibility();
            } catch (error) {
                console.error('UI compatibility test failed:', error);
            }
        }, 1000);
    }
    
    // Initialize performance monitoring (critical component) with recovery
    performanceMonitor = await errorRecovery.initializeWithRecovery('PerformanceMonitor');
    performanceDegradationManager = await errorRecovery.initializeWithRecovery('PerformanceDegradationManager');
    
    // Set up performance degradation callbacks with error handling
    if (performanceDegradationManager) {
        performanceDegradationManager.setOnDegradation((action, status) => {
            console.log(`Performance degradation: ${action}`, status);
            try {
                showPerformanceNotification(`Performance optimization applied: ${action.replace('_', ' ')}`);
            } catch (error) {
                console.error('Error showing performance notification:', error);
            }
        });
        
        performanceDegradationManager.setOnRecovery((action, status) => {
            console.log(`Performance recovery: ${action}`, status);
            try {
                showPerformanceNotification(`Performance restored: ${action.replace('_', ' ')}`);
            } catch (error) {
                console.error('Error showing performance notification:', error);
            }
        });
        
        performanceDegradationManager.setOnPerformanceModeToggle((enabled, status) => {
            console.log(`Performance mode ${enabled ? 'enabled' : 'disabled'}`, status);
            try {
                updatePerformanceModeUI(enabled);
            } catch (error) {
                console.error('Error updating performance mode UI:', error);
            }
        });
    }
    
    // Load AI count from localStorage
    try {
        const savedAICount = localStorage.getItem('lightbikes_ai_count');
        if (savedAICount !== null) {
            const parsedCount = parseInt(savedAICount);
            if (!isNaN(parsedCount) && parsedCount >= 1 && parsedCount <= 4) {
                currentAICount = parsedCount;
            }
        }
    } catch (error) {
        console.warn('Failed to load AI count from localStorage:', error);
    }
    
    // Initialize mode selector and game modes (critical components)
    try {
        modeSelector = new ModeSelector(game);
        survivalTimer = new SurvivalTimer();
        countdownTimer = new CountdownTimer();
        leaderboardSystem = new LeaderboardSystem();
        achievementSystem = new AchievementSystem();
        console.log('Game modes initialized successfully');
    } catch (error) {
        console.error('Failed to initialize game modes:', error);
        throw error; // Game modes are critical
    }
    
    // Wire up power-up system integrations
    game.setPowerUpManager(powerUpManager);
    collisionDetectionEngine.setPowerUpManager(powerUpManager);
    playerCollisionHandler.setPowerUpManager(powerUpManager);
    
    // Wire up camera effects system integration
    collisionDetectionEngine.setCameraEffectsManager(cameraEffectsManager);
    playerCollisionHandler.setCameraEffectsManager(cameraEffectsManager);
    game.setCameraEffectsManager(cameraEffectsManager);
    renderingEngine.setCameraEffectsManager(cameraEffectsManager);
    
    // Initialize particle settings UI
    particleSettingsUI = new ParticleSettingsUI();
    
    // Initialize camera effects UI
    try {
        cameraEffectsUI = new CameraEffectsUI();
        
        if (cameraEffectsManager && cameraEffectsUI) {
            const configManager = cameraEffectsUI.getConfigManager();
            configManager.addChangeListener((newSettings) => {
                cameraEffectsManager.updateSettings(newSettings);
            });
            const initialSettings = configManager.getEffectiveSettings();
            cameraEffectsManager.updateSettings(initialSettings);
        }
    } catch (error) {
        console.error('Failed to initialize camera effects UI:', error);
        const cameraButton = document.getElementById('cameraEffectsButton');
        if (cameraButton) {
            cameraButton.style.display = 'none';
        }
    }
    
    // Initialize glow settings UI
    try {
        const { GlowSettingsUI } = require('./GlowSettingsUI.js');
        if (glowEffectManager && glowEffectManager.settings) {
            glowSettingsUI = new GlowSettingsUI(glowEffectManager.settings, glowEffectManager);
        } else {
            console.warn('Glow effect manager not properly initialized, glow settings UI disabled');
        }
    } catch (error) {
        console.error('Failed to initialize glow settings UI:', error);
        const glowButton = document.getElementById('glowSettingsButton');
        if (glowButton) {
            glowButton.style.display = 'none';
        }
    }
    
    // Initialize customization system
    try {
        const preferenceStorage = new PreferenceStorage();
        customizationManager = new CustomizationManager(renderingEngine, preferenceStorage);
        customizationUI = new CustomizationUI(customizationManager);
        console.log('Customization system successfully initialized');
    } catch (error) {
        console.error('Failed to initialize customization system:', error);
        const customizationButton = document.getElementById('customizationButton');
        if (customizationButton) {
            customizationButton.style.display = 'none';
        }
    }
    
    // Initialize music settings UI
    try {
        musicSettingsUI = new MusicSettingsUI(audioManager);
        console.log('Music settings UI successfully initialized');
    } catch (error) {
        console.error('Failed to initialize music settings UI:', error);
        const musicButton = document.getElementById('musicSettingsButton');
        if (musicButton) {
            musicButton.style.display = 'none';
        }
    }
    
    // Initialize particle system integration
    const particleSystemSettings = particleSettingsUI.getParticleSystemSettings();
    renderingEngine.initializeParticleSystem(ParticleSystem, particleSystemSettings);
    
    // Apply customization preferences
    if (customizationManager) {
        customizationManager.applyPendingPreferences();
    }
    
    // Listen for particle settings changes
    particleSettingsUI.addExternalListener((path, value) => {
        const updatedSettings = particleSettingsUI.getParticleSystemSettings();
        const particleSystem = renderingEngine.getParticleSystem();
        
        if (particleSystem) {
            if (path === 'enabled') {
                particleSystem.setEnabled(value);
            } else if (path === 'quality') {
                particleSystem.setQualityLevel(value);
            } else if (path.startsWith('effects.')) {
                const effectType = path.split('.')[1];
                particleSystem.setEffectEnabled(effectType, value);
            } else if (path === 'performance.maxParticles' || path === 'advanced.particleDensity') {
                particleSystem.setMaxParticles(updatedSettings.maxParticles);
            } else if (path === 'performance.adaptiveQuality') {
                particleSystem.setAdaptiveQuality(value);
            } else if (path === 'bulk' || path === 'reset') {
                renderingEngine.reinitializeParticleSystem(updatedSettings);
            }
        }
    });
    
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
        isTimeTrialActive = (selectedMode === GameModes.TIME_TRIAL);
        
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
}

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
    initializeGame().catch(error => {
        console.error('Fatal initialization error:', error);
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