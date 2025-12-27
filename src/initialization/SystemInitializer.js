const { Logger } = require('../utils/Logger.js');
const { Game } = require('../core/game.js');
const { AICoordinator } = require('../core/ai.js');
const { CollisionDetectionEngine } = require('../core/collision.js');
const { PlayerCollisionHandler } = require('../multiplayer/PlayerCollisionHandler.js');
const { PlayerController } = require('../utils/controls.js');
const { RenderingEngine } = require('../rendering/renderer.js');
const { ScoreDisplay } = require('../ui/scoreDisplay.js');
const { AudioManager } = require('../audio/audio.js');
const { DifficultyManager } = require('../systems/difficulty.js');
const { PowerUpManager } = require('../systems/PowerUpManager.js');
const { StatusIndicator } = require('../ui/StatusIndicator.js');
const { ModeSelector } = require('../ui/ModeSelector.js');
const { SurvivalTimer } = require('../ui/SurvivalTimer.js');
const { CountdownTimer } = require('../ui/CountdownTimer.js');
const { LeaderboardSystem } = require('../systems/LeaderboardSystem.js');
const { AchievementSystem } = require('../systems/AchievementSystem.js');
const { PerformanceMonitor } = require('../utils/PerformanceMonitor.js');
const { PerformanceDegradationManager } = require('../utils/PerformanceDegradationManager.js');
const { ParticleSystem } = require('../rendering/ParticleSystem.js');
const { ParticleSettingsUI } = require('../ui/ParticleSettingsUI.js');
const { GlowEffectManager } = require('../rendering/GlowEffectManager.js');
const { CameraEffectsManager } = require('../effects/CameraEffectsManager.js');
const { CameraEffectsUI } = require('../effects/CameraEffectsUI.js');
const { CustomizationManager } = require('../systems/CustomizationManager.js');
const { CustomizationUI } = require('../ui/CustomizationUI.js');
const { PreferenceStorage } = require('../systems/PreferenceStorage.js');
const { MusicSettingsUI } = require('../ui/MusicSettingsUI.js');
const { UIManager } = require('../ui/UIManager.js');
const { GameOverUI } = require('../ui/GameOverUI.js');
const { ModeUI } = require('../ui/ModeUI.js');
const { StyleManager } = require('../ui/StyleManager.js');

/**
 * SystemInitializer handles initialization of all game systems
 * Manages system dependencies and recovery strategies
 */
class SystemInitializer {
    /**
     * Create a SystemInitializer
     * @param {RecoveryManager} recoveryManager - Error recovery manager
     * @param {Object} coreComponents - Core game components (game, renderingEngine, etc.)
     */
    constructor(recoveryManager, coreComponents) {
        this.recoveryManager = recoveryManager;
        this.coreComponents = coreComponents;
        this.logger = Logger.create('SystemInitializer');
        this.systems = {};
    }

    /**
     * Register recovery strategies for all game components
     */
    registerRecoveryStrategies() {
        const { game, renderingEngine, collisionDetectionEngine, playerCollisionHandler } =
            this.coreComponents;

        // Critical components - game cannot run without these
        this.recoveryManager.registerStrategy('Game', {
            initialize: async () => new Game(),
            critical: true,
            maxRetries: 3,
        });

        this.recoveryManager.registerStrategy('AICoordinator', {
            initialize: async () => new AICoordinator(),
            critical: true,
            maxRetries: 3,
        });

        this.recoveryManager.registerStrategy('CollisionDetectionEngine', {
            initialize: async () => new CollisionDetectionEngine(),
            critical: true,
            maxRetries: 3,
        });

        this.recoveryManager.registerStrategy('PlayerCollisionHandler', {
            initialize: async () => new PlayerCollisionHandler(),
            critical: true,
            maxRetries: 3,
        });

        this.recoveryManager.registerStrategy('PlayerController', {
            initialize: async () => new PlayerController(game),
            critical: true,
            maxRetries: 3,
        });

        this.recoveryManager.registerStrategy('RenderingEngine', {
            initialize: async () => new RenderingEngine(game.bounds),
            fallback: async () => {
                // Simplified renderer with minimal features
                this.logger.warn('Using simplified rendering mode');
                const simpleRenderer = new RenderingEngine(game.bounds);
                // Disable advanced features
                if (simpleRenderer.renderer) {
                    simpleRenderer.renderer.setPixelRatio(1); // Lower pixel ratio
                }
                return simpleRenderer;
            },
            critical: true,
            maxRetries: 2,
        });

        this.recoveryManager.registerStrategy('ScoreDisplay', {
            initialize: async () => new ScoreDisplay(renderingEngine),
            critical: true,
            maxRetries: 3,
        });

        this.recoveryManager.registerStrategy('AudioManager', {
            initialize: async () => new AudioManager(),
            fallback: async () => {
                // Silent audio manager
                this.logger.warn('Audio system unavailable, continuing without sound');
                const silentAudio = new AudioManager();
                silentAudio.setMuted(true);
                return silentAudio;
            },
            critical: false,
            maxRetries: 2,
        });

        this.recoveryManager.registerStrategy('DifficultyManager', {
            initialize: async () => new DifficultyManager(game, null),
            critical: true,
            maxRetries: 3,
        });

        this.recoveryManager.registerStrategy('PowerUpManager', {
            initialize: async () =>
                new PowerUpManager(
                    game,
                    renderingEngine,
                    collisionDetectionEngine,
                    this.systems.audioManager
                ),
            fallback: async () => {
                // Disabled power-up manager
                this.logger.warn('Power-ups disabled due to initialization error');
                const disabledPowerUps = new PowerUpManager(
                    game,
                    renderingEngine,
                    collisionDetectionEngine,
                    this.systems.audioManager
                );
                disabledPowerUps.enabled = false;
                return disabledPowerUps;
            },
            critical: false,
            maxRetries: 2,
        });

        this.recoveryManager.registerStrategy('PerformanceMonitor', {
            initialize: async () => new PerformanceMonitor(),
            critical: true,
            maxRetries: 3,
        });

        this.recoveryManager.registerStrategy('PerformanceDegradationManager', {
            initialize: async () =>
                new PerformanceDegradationManager(game, this.systems.performanceMonitor),
            critical: true,
            maxRetries: 3,
        });

        // Non-critical components - game can run without these
        this.recoveryManager.registerStrategy('CameraEffectsManager', {
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
            maxRetries: 1,
        });

        this.recoveryManager.registerStrategy('StatusIndicator', {
            initialize: async () => new StatusIndicator(),
            critical: false,
            maxRetries: 1,
        });

        this.recoveryManager.registerStrategy('GlowEffectManager', {
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
            maxRetries: 1,
        });
    }

    /**
     * Initialize all game systems with error recovery
     * @returns {Promise<Object>} Initialized systems
     */
    async initializeGameSystemsWithRecovery() {
        const { game, renderingEngine, collisionDetectionEngine, playerCollisionHandler } =
            this.coreComponents;

        // Initialize score display (critical component) with recovery
        this.systems.scoreDisplay =
            await this.recoveryManager.initializeWithRecovery('ScoreDisplay');

        // Initialize camera effects system (non-critical) with recovery
        this.systems.cameraEffectsManager =
            await this.recoveryManager.initializeWithRecovery('CameraEffectsManager');
        if (!this.systems.cameraEffectsManager) {
            this.logger.info('Camera effects disabled, continuing without them');
        }

        // Initialize audio manager with recovery and fallback
        this.systems.audioManager =
            await this.recoveryManager.initializeWithRecovery('AudioManager');

        // Initialize difficulty manager (critical component) with recovery
        this.systems.difficultyManager =
            await this.recoveryManager.initializeWithRecovery('DifficultyManager');

        // Initialize power-up manager with recovery and fallback
        this.systems.powerUpManager =
            await this.recoveryManager.initializeWithRecovery('PowerUpManager');
        if (!this.systems.powerUpManager || this.systems.powerUpManager.enabled === false) {
            this.logger.info('Power-ups disabled, continuing without them');
        }

        // Initialize status indicator (non-critical) with recovery
        this.systems.statusIndicator =
            await this.recoveryManager.initializeWithRecovery('StatusIndicator');
        if (!this.systems.statusIndicator) {
            this.logger.info('Status indicator disabled, continuing without it');
        }

        // Initialize glow effect system (non-critical) with recovery
        this.systems.glowEffectManager =
            await this.recoveryManager.initializeWithRecovery('GlowEffectManager');
        if (!this.systems.glowEffectManager) {
            this.logger.info('Glow effects disabled, continuing without them');
        }

        // Initialize performance monitoring (critical component) with recovery
        this.systems.performanceMonitor =
            await this.recoveryManager.initializeWithRecovery('PerformanceMonitor');
        this.systems.performanceDegradationManager =
            await this.recoveryManager.initializeWithRecovery('PerformanceDegradationManager');

        // Load AI count from localStorage
        let currentAICount = 1;
        try {
            const savedAICount = localStorage.getItem('lightbikes_ai_count');
            if (savedAICount !== null) {
                const parsedCount = parseInt(savedAICount);
                if (!isNaN(parsedCount) && parsedCount >= 1 && parsedCount <= 4) {
                    currentAICount = parsedCount;
                }
            }
        } catch (error) {
            this.logger.warn('Failed to load AI count from localStorage:', error);
        }

        // Initialize mode selector and game modes (critical components)
        try {
            this.systems.modeSelector = new ModeSelector(game);
            this.systems.survivalTimer = new SurvivalTimer();
            this.systems.countdownTimer = new CountdownTimer();
            this.systems.leaderboardSystem = new LeaderboardSystem();
            this.systems.achievementSystem = new AchievementSystem();
            this.logger.info('Game modes initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize game modes:', error);
            throw error; // Game modes are critical
        }

        // Wire up power-up system integrations
        game.setPowerUpManager(this.systems.powerUpManager);
        collisionDetectionEngine.setPowerUpManager(this.systems.powerUpManager);
        playerCollisionHandler.setPowerUpManager(this.systems.powerUpManager);

        // Wire up camera effects system integration
        collisionDetectionEngine.setCameraEffectsManager(this.systems.cameraEffectsManager);
        playerCollisionHandler.setCameraEffectsManager(this.systems.cameraEffectsManager);
        game.setCameraEffectsManager(this.systems.cameraEffectsManager);
        renderingEngine.setCameraEffectsManager(this.systems.cameraEffectsManager);

        // Initialize particle settings UI
        this.systems.particleSettingsUI = new ParticleSettingsUI();

        // Initialize camera effects UI
        try {
            this.systems.cameraEffectsUI = new CameraEffectsUI();

            if (this.systems.cameraEffectsManager && this.systems.cameraEffectsUI) {
                const configManager = this.systems.cameraEffectsUI.getConfigManager();
                configManager.addChangeListener((newSettings) => {
                    this.systems.cameraEffectsManager.updateSettings(newSettings);
                });
                const initialSettings = configManager.getEffectiveSettings();
                this.systems.cameraEffectsManager.updateSettings(initialSettings);
            }
        } catch (error) {
            this.logger.error('Failed to initialize camera effects UI:', error);
            const cameraButton = document.getElementById('cameraEffectsButton');
            if (cameraButton) {
                cameraButton.style.display = 'none';
            }
        }

        // Initialize glow settings UI
        try {
            const { GlowSettingsUI } = require('../ui/GlowSettingsUI.js');
            if (this.systems.glowEffectManager && this.systems.glowEffectManager.settings) {
                this.systems.glowSettingsUI = new GlowSettingsUI(
                    this.systems.glowEffectManager.settings,
                    this.systems.glowEffectManager
                );
            } else {
                this.logger.warn(
                    'Glow effect manager not properly initialized, glow settings UI disabled'
                );
            }
        } catch (error) {
            this.logger.error('Failed to initialize glow settings UI:', error);
            const glowButton = document.getElementById('glowSettingsButton');
            if (glowButton) {
                glowButton.style.display = 'none';
            }
        }

        // Initialize customization system
        try {
            const preferenceStorage = new PreferenceStorage();
            this.systems.customizationManager = new CustomizationManager(
                renderingEngine,
                preferenceStorage
            );
            this.systems.customizationUI = new CustomizationUI(this.systems.customizationManager);
            this.logger.info('Customization system successfully initialized');
        } catch (error) {
            this.logger.error('Failed to initialize customization system:', error);
            const customizationButton = document.getElementById('customizationButton');
            if (customizationButton) {
                customizationButton.style.display = 'none';
            }
        }

        // Initialize music settings UI
        try {
            this.systems.musicSettingsUI = new MusicSettingsUI(this.systems.audioManager);
            this.logger.info('Music settings UI successfully initialized');
        } catch (error) {
            this.logger.error('Failed to initialize music settings UI:', error);
            const musicButton = document.getElementById('musicSettingsButton');
            if (musicButton) {
                musicButton.style.display = 'none';
            }
        }

        // Initialize UI management system
        try {
            this.systems.styleManager = new StyleManager();
            this.systems.modeUI = new ModeUI();
            this.systems.gameOverUI = new GameOverUI();
            this.systems.uiManager = new UIManager();

            // Initialize ModeUI with dependencies
            this.systems.modeUI.initialize({
                styleManager: this.systems.styleManager,
                game: game,
                survivalTimer: this.systems.survivalTimer,
            });

            // Initialize GameOverUI with dependencies
            this.systems.gameOverUI.initialize({
                styleManager: this.systems.styleManager,
                multiplayerGameOverUI: null, // Will be created on demand
                localScoringUI: null, // Will be created on demand
                scoreDisplay: this.systems.scoreDisplay,
                survivalTimer: this.systems.survivalTimer,
                leaderboardSystem: this.systems.leaderboardSystem,
                hideRemainingEntitiesDisplay: () =>
                    this.systems.modeUI.hideRemainingEntitiesDisplay(),
                showModeSelector: () => this.systems.modeSelector.show(),
                game: game,
            });

            // Initialize UIManager with dependencies
            this.systems.uiManager.initialize({
                gameOverUI: this.systems.gameOverUI,
                modeUI: this.systems.modeUI,
                styleManager: this.systems.styleManager,
            });

            this.logger.info('UI management system successfully initialized');
        } catch (error) {
            this.logger.error('Failed to initialize UI management system:', error);
            // UI management is not critical, continue without it
        }

        // Initialize particle system integration
        const particleSystemSettings = this.systems.particleSettingsUI.getParticleSystemSettings();
        renderingEngine.initializeParticleSystem(ParticleSystem, particleSystemSettings);

        // Apply customization preferences
        if (this.systems.customizationManager) {
            this.systems.customizationManager.applyPendingPreferences();
        }

        // Listen for particle settings changes
        this.systems.particleSettingsUI.addExternalListener((path, value) => {
            const updatedSettings = this.systems.particleSettingsUI.getParticleSystemSettings();
            const particleSystem = renderingEngine.getParticleSystem();

            if (particleSystem) {
                if (path === 'enabled') {
                    particleSystem.setEnabled(value);
                } else if (path === 'quality') {
                    particleSystem.setQualityLevel(value);
                } else if (path.startsWith('effects.')) {
                    const effectType = path.split('.')[1];
                    particleSystem.setEffectEnabled(effectType, value);
                } else if (
                    path === 'performance.maxParticles' ||
                    path === 'advanced.particleDensity'
                ) {
                    particleSystem.setMaxParticles(updatedSettings.maxParticles);
                } else if (path === 'performance.adaptiveQuality') {
                    particleSystem.setAdaptiveQuality(value);
                } else if (path === 'bulk' || path === 'reset') {
                    renderingEngine.reinitializeParticleSystem(updatedSettings);
                }
            }
        });

        // Store current AI count in systems
        this.systems.currentAICount = currentAICount;

        return this.systems;
    }

    /**
     * Get initialized systems
     * @returns {Object} Systems object
     */
    getSystems() {
        return this.systems;
    }
}

module.exports = { SystemInitializer };
