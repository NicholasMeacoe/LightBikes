const { ClassicMode } = require('@/modes/ClassicMode.js');
const { GameModes } = require('@/systems/GameModes.js');

describe('ClassicMode', () => {
    let classicMode;
    let mockGame;
    let mockSystems;
    let mockHelpers;

    beforeEach(() => {
        // Create mock game
        mockGame = {
            getGameState: jest.fn().mockReturnValue({
                isPaused: false,
                gameOver: false,
                playerScore: 0,
                aiScore: 0,
            }),
            restart: jest.fn(),
            setTimeTrialMode: jest.fn(),
            gameConfig: {
                aiCount: 1,
            },
        };

        // Create mock systems
        mockSystems = {
            renderingEngine: {
                clearTrails: jest.fn(),
            },
            powerUpManager: {
                reset: jest.fn(),
            },
            statusIndicator: {
                reset: jest.fn(),
            },
            glowEffectManager: {
                initialized: true,
                handleGameRestart: jest.fn(),
            },
            scoreDisplay: {
                updateGameplayScores: jest.fn(),
            },
            audioManager: {
                handleGameStart: jest.fn(),
            },
            gameOverUI: {
                showMultiAIGameOver: jest.fn(),
            },
            uiManager: {
                updateForMode: jest.fn(),
                createModeUI: jest.fn(),
            },
            modeUI: {
                hideAllModeUI: jest.fn(),
                hideTimeTrialUI: jest.fn(),
                hideArenaShrinkUI: jest.fn(),
                hideRemainingEntitiesDisplay: jest.fn(),
            },
        };

        // Create mock helpers
        mockHelpers = {
            currentAICount: 2,
            initializeAIControllers: jest.fn(),
            updateUIForGameMode: jest.fn(),
            hideTimeTrialUI: jest.fn(),
            hideArenaShrinkUI: jest.fn(),
            hideRemainingEntitiesDisplay: jest.fn(),
            showMultiAIGameOver: jest.fn(),
        };

        // Create DOM elements
        document.body.innerHTML = `
            <div id="gameOver" style="display: block;"></div>
            <div id="restart" style="display: block;"></div>
            <div id="pauseOverlay" style="display: none;"></div>
        `;
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    describe('Constructor', () => {
        it('should initialize with game, systems, and helpers', () => {
            classicMode = new ClassicMode(mockGame, mockSystems, mockHelpers);
            expect(classicMode.game).toBe(mockGame);
            expect(classicMode.systems).toBe(mockSystems);
            expect(classicMode.helpers).toBe(mockHelpers);
        });

        it('should set currentAICount from helpers', () => {
            classicMode = new ClassicMode(mockGame, mockSystems, mockHelpers);
            expect(classicMode.currentAICount).toBe(2);
        });

        it('should default to 1 AI if currentAICount not provided', () => {
            const helpersWithoutCount = { ...mockHelpers };
            delete helpersWithoutCount.currentAICount;
            classicMode = new ClassicMode(mockGame, mockSystems, helpersWithoutCount);
            expect(classicMode.currentAICount).toBe(1);
        });
    });

    describe('initialize()', () => {
        it('should set game AI count configuration', () => {
            classicMode = new ClassicMode(mockGame, mockSystems, mockHelpers);
            classicMode.initialize();
            expect(mockGame.gameConfig.aiCount).toBe(2);
        });

        it('should restart the game', () => {
            classicMode = new ClassicMode(mockGame, mockSystems, mockHelpers);
            classicMode.initialize();
            expect(mockGame.restart).toHaveBeenCalled();
        });

        it('should disable time trial mode', () => {
            classicMode = new ClassicMode(mockGame, mockSystems, mockHelpers);
            classicMode.initialize();
            expect(mockGame.setTimeTrialMode).toHaveBeenCalledWith(false);
        });

        it('should initialize AI controllers with correct count', () => {
            classicMode = new ClassicMode(mockGame, mockSystems, mockHelpers);
            classicMode.initialize();
            expect(mockHelpers.initializeAIControllers).toHaveBeenCalledWith(2);
        });

        it('should perform common initialization tasks', () => {
            classicMode = new ClassicMode(mockGame, mockSystems, mockHelpers);
            const commonInitSpy = jest.spyOn(ClassicMode.prototype, '_commonInitialization');
            classicMode.initialize();
            expect(commonInitSpy).toHaveBeenCalled();
        });

        it('should create UI', () => {
            classicMode = new ClassicMode(mockGame, mockSystems, mockHelpers);
            const createUISpy = jest.spyOn(classicMode, 'createUI');
            classicMode.initialize();
            expect(createUISpy).toHaveBeenCalled();
        });

        it('should update score display with current scores', () => {
            classicMode = new ClassicMode(mockGame, mockSystems, mockHelpers);
            classicMode.initialize();
            expect(mockSystems.scoreDisplay.updateGameplayScores).toHaveBeenCalledWith(0, 0);
        });

        it('should handle audio and music for game start', () => {
            classicMode = new ClassicMode(mockGame, mockSystems, mockHelpers);
            classicMode.initialize();
            expect(mockSystems.audioManager.handleGameStart).toHaveBeenCalled();
        });
    });

    describe('cleanup()', () => {
        it('should destroy UI', () => {
            classicMode = new ClassicMode(mockGame, mockSystems, mockHelpers);
            const destroyUISpy = jest.spyOn(classicMode, 'destroyUI');
            classicMode.cleanup();
            expect(destroyUISpy).toHaveBeenCalled();
        });
    });

    describe('handleGameOver()', () => {
        it('should use gameOverUI if available', () => {
            classicMode = new ClassicMode(mockGame, mockSystems, mockHelpers);
            classicMode.handleGameOver();
            expect(mockSystems.gameOverUI.showMultiAIGameOver).toHaveBeenCalledWith(mockGame);
        });

        it('should fallback to legacy function if gameOverUI not available', () => {
            mockSystems.gameOverUI = null;
            classicMode = new ClassicMode(mockGame, mockSystems, mockHelpers);
            classicMode.handleGameOver();
            expect(mockHelpers.showMultiAIGameOver).toHaveBeenCalled();
        });

        it('should not call legacy function if gameOverUI is available', () => {
            classicMode = new ClassicMode(mockGame, mockSystems, mockHelpers);
            classicMode.handleGameOver();
            expect(mockHelpers.showMultiAIGameOver).not.toHaveBeenCalled();
        });
    });

    describe('createUI()', () => {
        it('should use uiManager and modeUI if available', () => {
            classicMode = new ClassicMode(mockGame, mockSystems, mockHelpers);
            classicMode.createUI();
            expect(mockSystems.uiManager.updateForMode).toHaveBeenCalledWith(GameModes.CLASSIC);
            expect(mockSystems.modeUI.hideAllModeUI).toHaveBeenCalled();
        });

        it('should fallback to legacy functions if uiManager not available', () => {
            mockSystems.uiManager = null;
            classicMode = new ClassicMode(mockGame, mockSystems, mockHelpers);
            classicMode.createUI();
            expect(mockHelpers.updateUIForGameMode).toHaveBeenCalled();
            expect(mockHelpers.hideTimeTrialUI).toHaveBeenCalled();
            expect(mockHelpers.hideArenaShrinkUI).toHaveBeenCalled();
            expect(mockHelpers.hideRemainingEntitiesDisplay).toHaveBeenCalled();
        });

        it('should not call legacy functions if uiManager is available', () => {
            classicMode = new ClassicMode(mockGame, mockSystems, mockHelpers);
            classicMode.createUI();
            expect(mockHelpers.updateUIForGameMode).not.toHaveBeenCalled();
        });
    });

    describe('destroyUI()', () => {
        it('should use modeUI if available', () => {
            classicMode = new ClassicMode(mockGame, mockSystems, mockHelpers);
            classicMode.destroyUI();
            expect(mockSystems.modeUI.hideAllModeUI).toHaveBeenCalled();
        });

        it('should fallback to legacy function if modeUI not available', () => {
            mockSystems.modeUI = null;
            classicMode = new ClassicMode(mockGame, mockSystems, mockHelpers);
            classicMode.destroyUI();
            expect(mockHelpers.hideRemainingEntitiesDisplay).toHaveBeenCalled();
        });

        it('should not call legacy function if modeUI is available', () => {
            classicMode = new ClassicMode(mockGame, mockSystems, mockHelpers);
            classicMode.destroyUI();
            expect(mockHelpers.hideRemainingEntitiesDisplay).not.toHaveBeenCalled();
        });
    });

    describe('Integration', () => {
        it('should complete full initialization sequence', () => {
            classicMode = new ClassicMode(mockGame, mockSystems, mockHelpers);
            classicMode.initialize();

            expect(mockGame.gameConfig.aiCount).toBe(2);
            expect(mockGame.restart).toHaveBeenCalled();
            expect(mockGame.setTimeTrialMode).toHaveBeenCalledWith(false);
            expect(mockHelpers.initializeAIControllers).toHaveBeenCalledWith(2);
            expect(mockSystems.renderingEngine.clearTrails).toHaveBeenCalled();
            expect(mockSystems.powerUpManager.reset).toHaveBeenCalled();
            expect(mockSystems.statusIndicator.reset).toHaveBeenCalled();
            expect(mockSystems.scoreDisplay.updateGameplayScores).toHaveBeenCalled();
            expect(mockSystems.audioManager.handleGameStart).toHaveBeenCalled();
        });

        it('should handle cleanup sequence', () => {
            classicMode = new ClassicMode(mockGame, mockSystems, mockHelpers);
            classicMode.initialize();
            classicMode.cleanup();

            expect(mockSystems.modeUI.hideAllModeUI).toHaveBeenCalled();
        });
    });
});
