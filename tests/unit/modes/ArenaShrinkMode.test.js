const { ArenaShrinkMode } = require('@/modes/ArenaShrinkMode.js');
const { GameModes } = require('@/systems/GameModes.js');

describe('ArenaShrinkMode', () => {
    let arenaShrinkMode;
    let mockGame;
    let mockSystems;
    let mockHelpers;

    beforeEach(() => {
        // Create mock game with arena shrinker
        mockGame = {
            getGameState: jest.fn().mockReturnValue({
                isPaused: false,
                gameOver: false,
                playerScore: 0,
                aiScore: 0,
            }),
            restart: jest.fn(),
            setGameMode: jest.fn(),
            gameConfig: {
                aiCount: 1,
            },
            arenaShrinker: {
                setOnWarning: jest.fn(),
                setOnShrink: jest.fn(),
                setOnFinalArena: jest.fn(),
                getCurrentBounds: jest.fn().mockReturnValue({ width: 100, height: 100 }),
                getNextBounds: jest.fn().mockReturnValue({ width: 90, height: 90 }),
            },
        };

        // Create mock systems
        mockSystems = {
            renderingEngine: {
                clearTrails: jest.fn(),
                startShrinkAnimation: jest.fn(),
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
                playShrinkWarningSound: jest.fn(),
                playShrinkExecuteSound: jest.fn(),
            },
            gameOverUI: {
                showArenaShrinkGameOver: jest.fn(),
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
                showFinalArenaMessage: jest.fn(),
                hideFinalArenaMessage: jest.fn(),
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
            createArenaShrinkUI: jest.fn(),
            showArenaShrinkGameOver: jest.fn(),
            showFinalArenaMessage: jest.fn(),
            hideFinalArenaMessage: jest.fn(),
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
            arenaShrinkMode = new ArenaShrinkMode(mockGame, mockSystems, mockHelpers);
            expect(arenaShrinkMode.game).toBe(mockGame);
            expect(arenaShrinkMode.systems).toBe(mockSystems);
            expect(arenaShrinkMode.helpers).toBe(mockHelpers);
        });

        it('should set currentAICount from helpers', () => {
            arenaShrinkMode = new ArenaShrinkMode(mockGame, mockSystems, mockHelpers);
            expect(arenaShrinkMode.currentAICount).toBe(2);
        });

        it('should default to 1 AI if currentAICount not provided', () => {
            const helpersWithoutCount = { ...mockHelpers };
            delete helpersWithoutCount.currentAICount;
            arenaShrinkMode = new ArenaShrinkMode(mockGame, mockSystems, helpersWithoutCount);
            expect(arenaShrinkMode.currentAICount).toBe(1);
        });
    });

    describe('initialize()', () => {
        it('should set game AI count configuration', () => {
            arenaShrinkMode = new ArenaShrinkMode(mockGame, mockSystems, mockHelpers);
            arenaShrinkMode.initialize();
            expect(mockGame.gameConfig.aiCount).toBe(2);
        });

        it('should restart the game', () => {
            arenaShrinkMode = new ArenaShrinkMode(mockGame, mockSystems, mockHelpers);
            arenaShrinkMode.initialize();
            expect(mockGame.restart).toHaveBeenCalled();
        });

        it('should set game mode to ARENA_SHRINK', () => {
            arenaShrinkMode = new ArenaShrinkMode(mockGame, mockSystems, mockHelpers);
            arenaShrinkMode.initialize();
            expect(mockGame.setGameMode).toHaveBeenCalledWith(GameModes.ARENA_SHRINK);
        });

        it('should initialize AI controllers with correct count', () => {
            arenaShrinkMode = new ArenaShrinkMode(mockGame, mockSystems, mockHelpers);
            arenaShrinkMode.initialize();
            expect(mockHelpers.initializeAIControllers).toHaveBeenCalledWith(2);
        });

        it('should set up shrink callbacks', () => {
            arenaShrinkMode = new ArenaShrinkMode(mockGame, mockSystems, mockHelpers);
            const setupCallbacksSpy = jest.spyOn(arenaShrinkMode, '_setupShrinkCallbacks');
            arenaShrinkMode.initialize();
            expect(setupCallbacksSpy).toHaveBeenCalled();
        });

        it('should perform common initialization tasks', () => {
            arenaShrinkMode = new ArenaShrinkMode(mockGame, mockSystems, mockHelpers);
            const commonInitSpy = jest.spyOn(ArenaShrinkMode.prototype, '_commonInitialization');
            arenaShrinkMode.initialize();
            expect(commonInitSpy).toHaveBeenCalled();
        });

        it('should create UI', () => {
            arenaShrinkMode = new ArenaShrinkMode(mockGame, mockSystems, mockHelpers);
            const createUISpy = jest.spyOn(arenaShrinkMode, 'createUI');
            arenaShrinkMode.initialize();
            expect(createUISpy).toHaveBeenCalled();
        });

        it('should update score display with current scores', () => {
            arenaShrinkMode = new ArenaShrinkMode(mockGame, mockSystems, mockHelpers);
            arenaShrinkMode.initialize();
            expect(mockSystems.scoreDisplay.updateGameplayScores).toHaveBeenCalledWith(0, 0);
        });

        it('should handle audio and music for game start', () => {
            arenaShrinkMode = new ArenaShrinkMode(mockGame, mockSystems, mockHelpers);
            arenaShrinkMode.initialize();
            expect(mockSystems.audioManager.handleGameStart).toHaveBeenCalled();
        });
    });

    describe('_setupShrinkCallbacks()', () => {
        it('should set up warning callback if arenaShrinker exists', () => {
            arenaShrinkMode = new ArenaShrinkMode(mockGame, mockSystems, mockHelpers);
            arenaShrinkMode.initialize();
            expect(mockGame.arenaShrinker.setOnWarning).toHaveBeenCalled();
        });

        it('should set up shrink callback if arenaShrinker exists', () => {
            arenaShrinkMode = new ArenaShrinkMode(mockGame, mockSystems, mockHelpers);
            arenaShrinkMode.initialize();
            expect(mockGame.arenaShrinker.setOnShrink).toHaveBeenCalled();
        });

        it('should set up final arena callback if arenaShrinker exists', () => {
            arenaShrinkMode = new ArenaShrinkMode(mockGame, mockSystems, mockHelpers);
            arenaShrinkMode.initialize();
            expect(mockGame.arenaShrinker.setOnFinalArena).toHaveBeenCalled();
        });

        it('should not throw if arenaShrinker does not exist', () => {
            mockGame.arenaShrinker = null;
            arenaShrinkMode = new ArenaShrinkMode(mockGame, mockSystems, mockHelpers);
            expect(() => {
                arenaShrinkMode.initialize();
            }).not.toThrow();
        });

        it('should play warning sound when warning callback is triggered', () => {
            arenaShrinkMode = new ArenaShrinkMode(mockGame, mockSystems, mockHelpers);
            arenaShrinkMode.initialize();

            // Get the callback that was set
            const warningCallback = mockGame.arenaShrinker.setOnWarning.mock.calls[0][0];
            warningCallback();

            expect(mockSystems.audioManager.playShrinkWarningSound).toHaveBeenCalled();
        });

        it('should play shrink sound and start animation when shrink callback is triggered', () => {
            arenaShrinkMode = new ArenaShrinkMode(mockGame, mockSystems, mockHelpers);
            arenaShrinkMode.initialize();

            // Get the callback that was set
            const shrinkCallback = mockGame.arenaShrinker.setOnShrink.mock.calls[0][0];
            shrinkCallback();

            expect(mockSystems.audioManager.playShrinkExecuteSound).toHaveBeenCalled();
            expect(mockGame.arenaShrinker.getCurrentBounds).toHaveBeenCalled();
            expect(mockGame.arenaShrinker.getNextBounds).toHaveBeenCalled();
            expect(mockSystems.renderingEngine.startShrinkAnimation).toHaveBeenCalledWith(
                { width: 100, height: 100 },
                { width: 90, height: 90 }
            );
        });

        it('should show final arena message when final arena callback is triggered', () => {
            arenaShrinkMode = new ArenaShrinkMode(mockGame, mockSystems, mockHelpers);
            arenaShrinkMode.initialize();

            // Get the callback that was set
            const finalArenaCallback = mockGame.arenaShrinker.setOnFinalArena.mock.calls[0][0];
            finalArenaCallback();

            expect(mockSystems.modeUI.showFinalArenaMessage).toHaveBeenCalled();
        });

        it('should fallback to legacy function for final arena if modeUI not available', () => {
            mockSystems.modeUI = null;
            arenaShrinkMode = new ArenaShrinkMode(mockGame, mockSystems, mockHelpers);
            arenaShrinkMode.initialize();

            const finalArenaCallback = mockGame.arenaShrinker.setOnFinalArena.mock.calls[0][0];
            finalArenaCallback();

            expect(mockHelpers.showFinalArenaMessage).toHaveBeenCalled();
        });
    });

    describe('cleanup()', () => {
        it('should destroy UI', () => {
            arenaShrinkMode = new ArenaShrinkMode(mockGame, mockSystems, mockHelpers);
            const destroyUISpy = jest.spyOn(arenaShrinkMode, 'destroyUI');
            arenaShrinkMode.cleanup();
            expect(destroyUISpy).toHaveBeenCalled();
        });
    });

    describe('handleGameOver()', () => {
        it('should use gameOverUI if available', () => {
            arenaShrinkMode = new ArenaShrinkMode(mockGame, mockSystems, mockHelpers);
            arenaShrinkMode.handleGameOver();
            expect(mockSystems.gameOverUI.showArenaShrinkGameOver).toHaveBeenCalledWith(mockGame);
        });

        it('should fallback to legacy function if gameOverUI not available', () => {
            mockSystems.gameOverUI = null;
            arenaShrinkMode = new ArenaShrinkMode(mockGame, mockSystems, mockHelpers);
            arenaShrinkMode.handleGameOver();
            expect(mockHelpers.showArenaShrinkGameOver).toHaveBeenCalled();
        });
    });

    describe('createUI()', () => {
        it('should use uiManager if available', () => {
            arenaShrinkMode = new ArenaShrinkMode(mockGame, mockSystems, mockHelpers);
            arenaShrinkMode.createUI();
            expect(mockSystems.uiManager.updateForMode).toHaveBeenCalledWith(
                GameModes.ARENA_SHRINK
            );
            expect(mockSystems.uiManager.createModeUI).toHaveBeenCalledWith(GameModes.ARENA_SHRINK);
        });

        it('should fallback to legacy functions if uiManager not available', () => {
            mockSystems.uiManager = null;
            arenaShrinkMode = new ArenaShrinkMode(mockGame, mockSystems, mockHelpers);
            arenaShrinkMode.createUI();
            expect(mockHelpers.updateUIForGameMode).toHaveBeenCalled();
            expect(mockHelpers.hideTimeTrialUI).toHaveBeenCalled();
            expect(mockHelpers.hideRemainingEntitiesDisplay).toHaveBeenCalled();
            expect(mockHelpers.createArenaShrinkUI).toHaveBeenCalled();
        });
    });

    describe('destroyUI()', () => {
        it('should use modeUI if available', () => {
            arenaShrinkMode = new ArenaShrinkMode(mockGame, mockSystems, mockHelpers);
            arenaShrinkMode.destroyUI();
            expect(mockSystems.modeUI.hideArenaShrinkUI).toHaveBeenCalled();
            expect(mockSystems.modeUI.hideFinalArenaMessage).toHaveBeenCalled();
        });

        it('should fallback to legacy functions if modeUI not available', () => {
            mockSystems.modeUI = null;
            arenaShrinkMode = new ArenaShrinkMode(mockGame, mockSystems, mockHelpers);
            arenaShrinkMode.destroyUI();
            expect(mockHelpers.hideArenaShrinkUI).toHaveBeenCalled();
            expect(mockHelpers.hideFinalArenaMessage).toHaveBeenCalled();
        });
    });

    describe('Integration', () => {
        it('should complete full initialization sequence', () => {
            arenaShrinkMode = new ArenaShrinkMode(mockGame, mockSystems, mockHelpers);
            arenaShrinkMode.initialize();

            expect(mockGame.gameConfig.aiCount).toBe(2);
            expect(mockGame.restart).toHaveBeenCalled();
            expect(mockGame.setGameMode).toHaveBeenCalledWith(GameModes.ARENA_SHRINK);
            expect(mockHelpers.initializeAIControllers).toHaveBeenCalledWith(2);
            expect(mockGame.arenaShrinker.setOnWarning).toHaveBeenCalled();
            expect(mockGame.arenaShrinker.setOnShrink).toHaveBeenCalled();
            expect(mockGame.arenaShrinker.setOnFinalArena).toHaveBeenCalled();
            expect(mockSystems.scoreDisplay.updateGameplayScores).toHaveBeenCalled();
            expect(mockSystems.audioManager.handleGameStart).toHaveBeenCalled();
        });
    });
});
