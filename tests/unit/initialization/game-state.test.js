const gameState = require('@/initialization/game-state.js');
const { GameModes } = require('@/systems/GameModes.js');

describe('game-state', () => {
    beforeEach(() => {
        // Reset state to initial values
        gameState.errorHandler = null;
        gameState.errorRecovery = null;
        gameState.loadingIndicator = null;
        gameState.errorRecoveryStrategies = null;
        gameState.initializationState = null;
        gameState.game = null;
        gameState.aiCoordinator = null;
        gameState.collisionDetectionEngine = null;
        gameState.playerCollisionHandler = null;
        gameState.playerController = null;
        gameState.renderingEngine = null;
        gameState.scoreDisplay = null;
        gameState.cameraEffectsManager = null;
        gameState.audioManager = null;
        gameState.difficultyManager = null;
        gameState.powerUpManager = null;
        gameState.statusIndicator = null;
        gameState.glowEffectManager = null;
        gameState.performanceMonitor = null;
        gameState.performanceDegradationManager = null;
        gameState.modeSelector = null;
        gameState.survivalTimer = null;
        gameState.countdownTimer = null;
        gameState.leaderboardSystem = null;
        gameState.achievementSystem = null;
        gameState.particleSettingsUI = null;
        gameState.cameraEffectsUI = null;
        gameState.glowSettingsUI = null;
        gameState.customizationManager = null;
        gameState.customizationUI = null;
        gameState.musicSettingsUI = null;
        gameState.multiplayerGame = null;
        gameState.dualControlScheme = null;
        gameState.splitScreenCamera = null;
        gameState.aiControllers = [];
        gameState.currentAICount = 1;
        gameState.currentGameMode = GameModes.CLASSIC;
        gameState.isTimeTrialActive = false;
    });

    describe('Initial State', () => {
        it('should have all error handling properties initialized to null', () => {
            expect(gameState.errorHandler).toBeNull();
            expect(gameState.errorRecovery).toBeNull();
            expect(gameState.loadingIndicator).toBeNull();
            expect(gameState.errorRecoveryStrategies).toBeNull();
            expect(gameState.initializationState).toBeNull();
        });

        it('should have all core game properties initialized to null', () => {
            expect(gameState.game).toBeNull();
            expect(gameState.aiCoordinator).toBeNull();
            expect(gameState.collisionDetectionEngine).toBeNull();
            expect(gameState.playerCollisionHandler).toBeNull();
            expect(gameState.playerController).toBeNull();
            expect(gameState.renderingEngine).toBeNull();
        });

        it('should have all UI properties initialized to null', () => {
            expect(gameState.scoreDisplay).toBeNull();
            expect(gameState.cameraEffectsManager).toBeNull();
            expect(gameState.audioManager).toBeNull();
            expect(gameState.difficultyManager).toBeNull();
            expect(gameState.powerUpManager).toBeNull();
            expect(gameState.statusIndicator).toBeNull();
        });

        it('should have all effect properties initialized to null', () => {
            expect(gameState.glowEffectManager).toBeNull();
            expect(gameState.cameraEffectsUI).toBeNull();
            expect(gameState.glowSettingsUI).toBeNull();
        });

        it('should have all performance properties initialized to null', () => {
            expect(gameState.performanceMonitor).toBeNull();
            expect(gameState.performanceDegradationManager).toBeNull();
        });

        it('should have all mode properties initialized to null', () => {
            expect(gameState.modeSelector).toBeNull();
            expect(gameState.survivalTimer).toBeNull();
            expect(gameState.countdownTimer).toBeNull();
            expect(gameState.leaderboardSystem).toBeNull();
            expect(gameState.achievementSystem).toBeNull();
        });

        it('should have all settings UI properties initialized to null', () => {
            expect(gameState.particleSettingsUI).toBeNull();
            expect(gameState.customizationManager).toBeNull();
            expect(gameState.customizationUI).toBeNull();
            expect(gameState.musicSettingsUI).toBeNull();
        });

        it('should have all multiplayer properties initialized to null', () => {
            expect(gameState.multiplayerGame).toBeNull();
            expect(gameState.dualControlScheme).toBeNull();
            expect(gameState.splitScreenCamera).toBeNull();
        });

        it('should have AI controllers initialized to empty array', () => {
            expect(gameState.aiControllers).toEqual([]);
        });

        it('should have currentAICount initialized to 1', () => {
            expect(gameState.currentAICount).toBe(1);
        });

        it('should have currentGameMode initialized to CLASSIC', () => {
            expect(gameState.currentGameMode).toBe(GameModes.CLASSIC);
        });

        it('should have isTimeTrialActive initialized to false', () => {
            expect(gameState.isTimeTrialActive).toBe(false);
        });
    });

    describe('State Assignment', () => {
        it('should allow assignment of error handler', () => {
            const mockErrorHandler = { handle: jest.fn() };
            gameState.errorHandler = mockErrorHandler;
            expect(gameState.errorHandler).toBe(mockErrorHandler);
        });

        it('should allow assignment of game instance', () => {
            const mockGame = { update: jest.fn() };
            gameState.game = mockGame;
            expect(gameState.game).toBe(mockGame);
        });

        it('should allow assignment of rendering engine', () => {
            const mockRenderingEngine = { render: jest.fn() };
            gameState.renderingEngine = mockRenderingEngine;
            expect(gameState.renderingEngine).toBe(mockRenderingEngine);
        });

        it('should allow assignment of audio manager', () => {
            const mockAudioManager = { play: jest.fn() };
            gameState.audioManager = mockAudioManager;
            expect(gameState.audioManager).toBe(mockAudioManager);
        });

        it('should allow assignment of multiplayer game', () => {
            const mockMultiplayerGame = { player1: {}, player2: {} };
            gameState.multiplayerGame = mockMultiplayerGame;
            expect(gameState.multiplayerGame).toBe(mockMultiplayerGame);
        });

        it('should allow assignment of AI controllers array', () => {
            const mockAIControllers = [{ id: 'ai1' }, { id: 'ai2' }];
            gameState.aiControllers = mockAIControllers;
            expect(gameState.aiControllers).toBe(mockAIControllers);
            expect(gameState.aiControllers.length).toBe(2);
        });

        it('should allow assignment of current AI count', () => {
            gameState.currentAICount = 3;
            expect(gameState.currentAICount).toBe(3);
        });

        it('should allow assignment of current game mode', () => {
            gameState.currentGameMode = GameModes.TIME_TRIAL;
            expect(gameState.currentGameMode).toBe(GameModes.TIME_TRIAL);
        });

        it('should allow assignment of time trial active flag', () => {
            gameState.isTimeTrialActive = true;
            expect(gameState.isTimeTrialActive).toBe(true);
        });
    });

    describe('State Modification', () => {
        it('should allow pushing to AI controllers array', () => {
            const aiController1 = { id: 'ai1' };
            const aiController2 = { id: 'ai2' };
            gameState.aiControllers.push(aiController1);
            gameState.aiControllers.push(aiController2);
            expect(gameState.aiControllers.length).toBe(2);
            expect(gameState.aiControllers[0]).toBe(aiController1);
            expect(gameState.aiControllers[1]).toBe(aiController2);
        });

        it('should allow clearing AI controllers array', () => {
            gameState.aiControllers.push({ id: 'ai1' });
            gameState.aiControllers = [];
            expect(gameState.aiControllers.length).toBe(0);
        });

        it('should allow updating multiple properties', () => {
            const mockGame = { update: jest.fn() };
            const mockRenderingEngine = { render: jest.fn() };
            const mockAudioManager = { play: jest.fn() };

            gameState.game = mockGame;
            gameState.renderingEngine = mockRenderingEngine;
            gameState.audioManager = mockAudioManager;

            expect(gameState.game).toBe(mockGame);
            expect(gameState.renderingEngine).toBe(mockRenderingEngine);
            expect(gameState.audioManager).toBe(mockAudioManager);
        });
    });

    describe('State Persistence', () => {
        it('should maintain state across multiple assignments', () => {
            const mockGame1 = { id: 'game1' };
            const mockGame2 = { id: 'game2' };

            gameState.game = mockGame1;
            expect(gameState.game).toBe(mockGame1);

            gameState.game = mockGame2;
            expect(gameState.game).toBe(mockGame2);
            expect(gameState.game).not.toBe(mockGame1);
        });

        it('should allow null assignment to reset state', () => {
            const mockGame = { update: jest.fn() };
            gameState.game = mockGame;
            expect(gameState.game).toBe(mockGame);

            gameState.game = null;
            expect(gameState.game).toBeNull();
        });
    });

    describe('Module Export', () => {
        it('should export state object', () => {
            expect(gameState).toBeDefined();
            expect(typeof gameState).toBe('object');
        });

        it('should have all expected properties', () => {
            const expectedProperties = [
                'errorHandler',
                'errorRecovery',
                'loadingIndicator',
                'errorRecoveryStrategies',
                'initializationState',
                'game',
                'aiCoordinator',
                'collisionDetectionEngine',
                'playerCollisionHandler',
                'playerController',
                'renderingEngine',
                'scoreDisplay',
                'cameraEffectsManager',
                'audioManager',
                'difficultyManager',
                'powerUpManager',
                'statusIndicator',
                'glowEffectManager',
                'performanceMonitor',
                'performanceDegradationManager',
                'modeSelector',
                'survivalTimer',
                'countdownTimer',
                'leaderboardSystem',
                'achievementSystem',
                'particleSettingsUI',
                'cameraEffectsUI',
                'glowSettingsUI',
                'customizationManager',
                'customizationUI',
                'musicSettingsUI',
                'multiplayerGame',
                'dualControlScheme',
                'splitScreenCamera',
                'aiControllers',
                'currentAICount',
                'currentGameMode',
                'isTimeTrialActive',
            ];

            expectedProperties.forEach((prop) => {
                expect(gameState).toHaveProperty(prop);
            });
        });
    });
});
