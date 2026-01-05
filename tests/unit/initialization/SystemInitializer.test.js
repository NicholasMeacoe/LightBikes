jest.mock('@/utils/Logger.js', () => {
    const mockLoggerInstance = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    };

    const MockLoggerClass = jest.fn(() => mockLoggerInstance);
    MockLoggerClass.create = jest.fn(() => mockLoggerInstance);

    return {
        Logger: MockLoggerClass,
        logger: mockLoggerInstance,
        createLogger: jest.fn(() => mockLoggerInstance),
    };
});

let { logger: mockLogger, Logger: MockLoggerClass } = require('@/utils/Logger.js');

// Mock all the dependencies
jest.mock('@/core/game.js');
jest.mock('@/core/ai.js');
jest.mock('@/core/collision.js');
jest.mock('@/multiplayer/PlayerCollisionHandler.js');
jest.mock('@/utils/controls.js');
jest.mock('@/rendering/renderer.js');
jest.mock('@/ui/scoreDisplay.js');
jest.mock('@/audio/audio.js');
jest.mock('@/systems/difficulty.js');
jest.mock('@/systems/PowerUpManager.js');
jest.mock('@/ui/StatusIndicator.js');
jest.mock('@/ui/ModeSelector.js');
jest.mock('@/ui/SurvivalTimer.js');
jest.mock('@/ui/CountdownTimer.js');
jest.mock('@/systems/LeaderboardSystem.js');
jest.mock('@/systems/AchievementSystem.js');
jest.mock('@/utils/PerformanceMonitor.js');
jest.mock('@/utils/PerformanceDegradationManager.js');
jest.mock('@/rendering/ParticleSystem.js');
jest.mock('@/ui/ParticleSettingsUI.js');
jest.mock('@/rendering/GlowEffectManager.js');
jest.mock('@/effects/CameraEffectsManager.js');
jest.mock('@/effects/CameraEffectsUI.js');
jest.mock('@/systems/CustomizationManager.js');
jest.mock('@/ui/CustomizationUI.js');
jest.mock('@/systems/PreferenceStorage.js');
jest.mock('@/ui/MusicSettingsUI.js');
jest.mock('@/ui/UIManager.js');
jest.mock('@/ui/GameOverUI.js');
jest.mock('@/ui/ModeUI.js');
jest.mock('@/ui/StyleManager.js');
jest.mock('@/ui/GlowSettingsUI.js');

describe('SystemInitializer', () => {
    let SystemInitializer;
    let systemInitializer;
    let mockRecoveryManager;
    let mockCoreComponents;

    // Dependencies (mocks)
    let Game,
        AICoordinator,
        CollisionDetectionEngine,
        PlayerCollisionHandler,
        PlayerController,
        RenderingEngine,
        ScoreDisplay,
        AudioManager,
        DifficultyManager,
        PowerUpManager,
        StatusIndicator,
        ModeSelector,
        SurvivalTimer,
        CountdownTimer,
        LeaderboardSystem,
        AchievementSystem,
        PerformanceMonitor,
        PerformanceDegradationManager,
        ParticleSettingsUI,
        GlowEffectManager,
        CameraEffectsManager,
        CameraEffectsUI,
        CustomizationManager,
        CustomizationUI,
        PreferenceStorage,
        MusicSettingsUI,
        UIManager,
        GameOverUI,
        ModeUI,
        StyleManager;

    beforeEach(() => {
        jest.resetModules();

        // Re-require SystemInitializer and Logger mock
        const loggerModule = require('@/utils/Logger.js');
        mockLogger = loggerModule.logger;
        MockLoggerClass = loggerModule.Logger;
        SystemInitializer = require('@/initialization/SystemInitializer.js').SystemInitializer;

        // Setup mock modules
        Game = require('@/core/game.js').Game;
        ModeSelector = require('@/ui/ModeSelector.js').ModeSelector;
        SurvivalTimer = require('@/ui/SurvivalTimer.js').SurvivalTimer;
        CountdownTimer = require('@/ui/CountdownTimer.js').CountdownTimer;
        LeaderboardSystem = require('@/systems/LeaderboardSystem.js').LeaderboardSystem;
        AchievementSystem = require('@/systems/AchievementSystem.js').AchievementSystem;
        ParticleSettingsUI = require('@/ui/ParticleSettingsUI.js').ParticleSettingsUI;
        CameraEffectsUI = require('@/effects/CameraEffectsUI.js').CameraEffectsUI;
        PreferenceStorage = require('@/systems/PreferenceStorage.js').PreferenceStorage;
        CustomizationManager = require('@/systems/CustomizationManager.js').CustomizationManager;
        CustomizationUI = require('@/ui/CustomizationUI.js').CustomizationUI;
        MusicSettingsUI = require('@/ui/MusicSettingsUI.js').MusicSettingsUI;
        StyleManager = require('@/ui/StyleManager.js').StyleManager;
        ModeUI = require('@/ui/ModeUI.js').ModeUI;
        GameOverUI = require('@/ui/GameOverUI.js').GameOverUI;
        UIManager = require('@/ui/UIManager.js').UIManager;

        mockRecoveryManager = {
            registerStrategy: jest.fn(),
            initializeWithRecovery: jest.fn(),
        };

        mockCoreComponents = {
            game: {
                bounds: { width: 100, height: 100 },
                setPowerUpManager: jest.fn(),
                setCameraEffectsManager: jest.fn(),
                getGameState: jest.fn().mockReturnValue({}),
            },
            renderingEngine: {
                camera: {},
                renderer: {},
                scene: {},
                setCameraEffectsManager: jest.fn(),
                initializeParticleSystem: jest.fn(),
                reinitializeParticleSystem: jest.fn(),
                getParticleSystem: jest.fn().mockReturnValue({
                    setEnabled: jest.fn(),
                    setQualityLevel: jest.fn(),
                    setEffectEnabled: jest.fn(),
                    setMaxParticles: jest.fn(),
                    setAdaptiveQuality: jest.fn(),
                }),
            },
            collisionDetectionEngine: {
                setPowerUpManager: jest.fn(),
                setCameraEffectsManager: jest.fn(),
            },
            playerCollisionHandler: {
                setPowerUpManager: jest.fn(),
                setCameraEffectsManager: jest.fn(),
            },
        };

        Object.defineProperty(global, 'localStorage', {
            value: {
                getItem: jest.fn().mockReturnValue(null),
                setItem: jest.fn(),
                removeItem: jest.fn(),
            },
            configurable: true,
            writable: true,
        });

        if (global.document) {
            if (jest.isMockFunction(global.document.getElementById)) {
                global.document.getElementById.mockReturnValue({ style: { display: '' } });
            } else {
                jest.spyOn(global.document, 'getElementById').mockReturnValue({
                    style: { display: '' },
                });
            }
        }

        systemInitializer = new SystemInitializer(mockRecoveryManager, mockCoreComponents);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Constructor', () => {
        it('should initialize with recovery manager and core components', () => {
            expect(systemInitializer.recoveryManager).toBe(mockRecoveryManager);
            expect(systemInitializer.coreComponents).toBe(mockCoreComponents);
        });

        it('should create logger', () => {
            expect(MockLoggerClass.create).toHaveBeenCalledWith('SystemInitializer');
        });

        it('should initialize with empty systems object', () => {
            expect(systemInitializer.systems).toEqual({});
        });
    });

    describe('registerRecoveryStrategies()', () => {
        let strategies = {};

        beforeEach(() => {
            systemInitializer.systems.audioManager = { setMuted: jest.fn() };
            systemInitializer.systems.performanceMonitor = {};

            // Capture strategies when registered
            mockRecoveryManager.registerStrategy.mockImplementation((name, strategy) => {
                strategies[name] = strategy;
            });
        });

        it('should register all expected strategies', () => {
            systemInitializer.registerRecoveryStrategies();
            const expectedStrategies = [
                'Game',
                'AICoordinator',
                'CollisionDetectionEngine',
                'PlayerCollisionHandler',
                'PlayerController',
                'RenderingEngine',
                'ScoreDisplay',
                'AudioManager',
                'DifficultyManager',
                'PowerUpManager',
                'PerformanceMonitor',
                'PerformanceDegradationManager',
                'CameraEffectsManager',
                'StatusIndicator',
                'GlowEffectManager',
            ];

            expectedStrategies.forEach((name) => {
                expect(strategies[name]).toBeDefined();
                expect(strategies[name].initialize).toEqual(expect.any(Function));
            });
        });

        it('should provide working fallback for AudioManager', async () => {
            systemInitializer.registerRecoveryStrategies();
            const strategy = strategies['AudioManager'];

            expect(strategy.fallback).toBeDefined();
            const fallbackAudio = await strategy.fallback();

            expect(fallbackAudio.setMuted).toHaveBeenCalledWith(true);
            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.stringContaining('Audio system unavailable')
            );
        });

        it('should provide working fallback for RenderingEngine', async () => {
            systemInitializer.registerRecoveryStrategies();
            const strategy = strategies['RenderingEngine'];

            expect(strategy.fallback).toBeDefined();

            // Mock RenderingEngine constructor for this test
            const mockRendererInstance = { renderer: { setPixelRatio: jest.fn() } };
            // We need to ensure the RenderingEngine mock returns this
            const RenderingEngineMock = require('@/rendering/renderer.js').RenderingEngine;
            RenderingEngineMock.mockImplementation(() => mockRendererInstance);

            const fallbackRenderer = await strategy.fallback();

            expect(fallbackRenderer).toBe(mockRendererInstance);
            expect(mockRendererInstance.renderer.setPixelRatio).toHaveBeenCalledWith(1);
            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.stringContaining('simplified rendering mode')
            );
        });

        it('should provide working fallback for PowerUpManager', async () => {
            systemInitializer.registerRecoveryStrategies();
            const strategy = strategies['PowerUpManager'];

            expect(strategy.fallback).toBeDefined();

            const fallbackPowerUps = await strategy.fallback();
            expect(fallbackPowerUps.enabled).toBe(false);
            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.stringContaining('Power-ups disabled')
            );
        });

        it('should fail critical components without fallback', () => {
            systemInitializer.registerRecoveryStrategies();
            expect(strategies['Game'].critical).toBe(true);
            expect(strategies['Game'].fallback).toBeUndefined();
        });
    });

    describe('initializeGameSystemsWithRecovery()', () => {
        beforeEach(() => {
            mockRecoveryManager.initializeWithRecovery
                .mockResolvedValueOnce({}) // scoreDisplay
                .mockResolvedValueOnce({}) // cameraEffectsManager
                .mockResolvedValueOnce({ setMuted: jest.fn() }) // audioManager
                .mockResolvedValueOnce({}) // difficultyManager
                .mockResolvedValueOnce({ enabled: true }) // powerUpManager
                .mockResolvedValueOnce({}) // statusIndicator
                .mockResolvedValueOnce({ initialized: true, settings: {} }) // glowEffectManager
                .mockResolvedValueOnce({}) // performanceMonitor
                .mockResolvedValueOnce({}); // performanceDegradationManager
        });

        it('should initialize systems in correct order', async () => {
            await systemInitializer.initializeGameSystemsWithRecovery();
            expect(mockRecoveryManager.initializeWithRecovery).toHaveBeenCalledWith('ScoreDisplay');
            expect(mockRecoveryManager.initializeWithRecovery).toHaveBeenCalledWith(
                'CameraEffectsManager'
            );
            expect(mockRecoveryManager.initializeWithRecovery).toHaveBeenCalledWith('AudioManager');
            expect(mockRecoveryManager.initializeWithRecovery).toHaveBeenCalledWith(
                'DifficultyManager'
            );
            expect(mockRecoveryManager.initializeWithRecovery).toHaveBeenCalledWith(
                'PowerUpManager'
            );
            expect(mockRecoveryManager.initializeWithRecovery).toHaveBeenCalledWith(
                'StatusIndicator'
            );
            expect(mockRecoveryManager.initializeWithRecovery).toHaveBeenCalledWith(
                'GlowEffectManager'
            );
            expect(mockRecoveryManager.initializeWithRecovery).toHaveBeenCalledWith(
                'PerformanceMonitor'
            );
            expect(mockRecoveryManager.initializeWithRecovery).toHaveBeenCalledWith(
                'PerformanceDegradationManager'
            );
        });

        it('should load AI count from localStorage', async () => {
            localStorage.getItem.mockReturnValue('2');
            await systemInitializer.initializeGameSystemsWithRecovery();
            expect(systemInitializer.systems.currentAICount).toBe(2);
        });

        it('should initialize all UI components', async () => {
            await systemInitializer.initializeGameSystemsWithRecovery();
            expect(ModeSelector).toHaveBeenCalled();
            expect(SurvivalTimer).toHaveBeenCalled();
            expect(CountdownTimer).toHaveBeenCalled();
            expect(LeaderboardSystem).toHaveBeenCalled();
            expect(AchievementSystem).toHaveBeenCalled();
            expect(ParticleSettingsUI).toHaveBeenCalled();
            expect(CameraEffectsUI).toHaveBeenCalled();
            expect(CustomizationManager).toHaveBeenCalled();
            expect(CustomizationUI).toHaveBeenCalled();
            expect(MusicSettingsUI).toHaveBeenCalled();
            expect(StyleManager).toHaveBeenCalled();
            expect(ModeUI).toHaveBeenCalled();
            expect(GameOverUI).toHaveBeenCalled();
            expect(UIManager).toHaveBeenCalled();
        });

        it('should wire up system integrations', async () => {
            await systemInitializer.initializeGameSystemsWithRecovery();
            expect(mockCoreComponents.game.setPowerUpManager).toHaveBeenCalled();
            expect(mockCoreComponents.game.setCameraEffectsManager).toHaveBeenCalled();
            expect(mockCoreComponents.renderingEngine.setCameraEffectsManager).toHaveBeenCalled();
        });

        it('should return the systems object', async () => {
            const systems = await systemInitializer.initializeGameSystemsWithRecovery();
            expect(systems).toBe(systemInitializer.systems);
        });
    });

    describe('getSystems()', () => {
        it('should return systems mapping', () => {
            systemInitializer.systems = { test: true };
            expect(systemInitializer.getSystems()).toEqual({ test: true });
        });
    });
});
