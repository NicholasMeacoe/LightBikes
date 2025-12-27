const { TimeTrialMode } = require('@/modes/TimeTrialMode.js');
const { GameModes } = require('@/systems/GameModes.js');

describe('TimeTrialMode', () => {
    let timeTrialMode;
    let mockGame;
    let mockSystems;
    let mockHelpers;

    beforeEach(() => {
        // Create mock game
        mockGame = {
            getGameState: jest.fn().mockReturnValue({
                isPaused: false,
                gameOver: false,
            }),
            restart: jest.fn(),
            setTimeTrialMode: jest.fn(),
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
            audioManager: {
                handleGameStart: jest.fn(),
            },
            gameOverUI: {
                showTimeTrialGameOver: jest.fn(),
            },
            uiManager: {
                updateForMode: jest.fn(),
                createModeUI: jest.fn(),
            },
            modeUI: {
                hideAllModeUI: jest.fn(),
                hideTimeTrialUI: jest.fn(),
            },
            survivalTimer: {
                reset: jest.fn(),
                start: jest.fn(),
                stop: jest.fn(),
            },
            achievementSystem: {
                reset: jest.fn(),
            },
        };

        // Create mock helpers
        mockHelpers = {
            updateUIForGameMode: jest.fn(),
            createTimeTrialUI: jest.fn(),
            hideArenaShrinkUI: jest.fn(),
            hideTimeTrialUI: jest.fn(),
            showTimeTrialGameOver: jest.fn(),
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
            timeTrialMode = new TimeTrialMode(mockGame, mockSystems, mockHelpers);
            expect(timeTrialMode.game).toBe(mockGame);
            expect(timeTrialMode.systems).toBe(mockSystems);
            expect(timeTrialMode.helpers).toBe(mockHelpers);
        });
    });

    describe('initialize()', () => {
        it('should restart the game', () => {
            timeTrialMode = new TimeTrialMode(mockGame, mockSystems, mockHelpers);
            timeTrialMode.initialize();
            expect(mockGame.restart).toHaveBeenCalled();
        });

        it('should enable time trial mode', () => {
            timeTrialMode = new TimeTrialMode(mockGame, mockSystems, mockHelpers);
            timeTrialMode.initialize();
            expect(mockGame.setTimeTrialMode).toHaveBeenCalledWith(true);
        });

        it('should reset survival timer', () => {
            timeTrialMode = new TimeTrialMode(mockGame, mockSystems, mockHelpers);
            timeTrialMode.initialize();
            expect(mockSystems.survivalTimer.reset).toHaveBeenCalled();
        });

        it('should reset achievement system', () => {
            timeTrialMode = new TimeTrialMode(mockGame, mockSystems, mockHelpers);
            timeTrialMode.initialize();
            expect(mockSystems.achievementSystem.reset).toHaveBeenCalled();
        });

        it('should start survival timer', () => {
            timeTrialMode = new TimeTrialMode(mockGame, mockSystems, mockHelpers);
            timeTrialMode.initialize();
            expect(mockSystems.survivalTimer.start).toHaveBeenCalled();
        });

        it('should perform common initialization tasks', () => {
            timeTrialMode = new TimeTrialMode(mockGame, mockSystems, mockHelpers);
            const commonInitSpy = jest.spyOn(TimeTrialMode.prototype, '_commonInitialization');
            timeTrialMode.initialize();
            expect(commonInitSpy).toHaveBeenCalled();
        });

        it('should create UI', () => {
            timeTrialMode = new TimeTrialMode(mockGame, mockSystems, mockHelpers);
            const createUISpy = jest.spyOn(timeTrialMode, 'createUI');
            timeTrialMode.initialize();
            expect(createUISpy).toHaveBeenCalled();
        });

        it('should handle audio and music for game start', () => {
            timeTrialMode = new TimeTrialMode(mockGame, mockSystems, mockHelpers);
            timeTrialMode.initialize();
            expect(mockSystems.audioManager.handleGameStart).toHaveBeenCalled();
        });

        it('should call methods in correct order', () => {
            timeTrialMode = new TimeTrialMode(mockGame, mockSystems, mockHelpers);
            const callOrder = [];

            mockGame.restart.mockImplementation(() => callOrder.push('restart'));
            mockGame.setTimeTrialMode.mockImplementation(() => callOrder.push('setTimeTrialMode'));
            mockSystems.survivalTimer.reset.mockImplementation(() => callOrder.push('reset'));
            mockSystems.survivalTimer.start.mockImplementation(() => callOrder.push('start'));

            timeTrialMode.initialize();

            expect(callOrder).toEqual(['restart', 'setTimeTrialMode', 'reset', 'start']);
        });
    });

    describe('cleanup()', () => {
        it('should stop survival timer', () => {
            timeTrialMode = new TimeTrialMode(mockGame, mockSystems, mockHelpers);
            timeTrialMode.cleanup();
            expect(mockSystems.survivalTimer.stop).toHaveBeenCalled();
        });

        it('should destroy UI', () => {
            timeTrialMode = new TimeTrialMode(mockGame, mockSystems, mockHelpers);
            const destroyUISpy = jest.spyOn(timeTrialMode, 'destroyUI');
            timeTrialMode.cleanup();
            expect(destroyUISpy).toHaveBeenCalled();
        });

        it('should call stop before destroyUI', () => {
            timeTrialMode = new TimeTrialMode(mockGame, mockSystems, mockHelpers);
            const callOrder = [];

            mockSystems.survivalTimer.stop.mockImplementation(() => callOrder.push('stop'));
            const destroyUISpy = jest
                .spyOn(timeTrialMode, 'destroyUI')
                .mockImplementation(() => callOrder.push('destroyUI'));

            timeTrialMode.cleanup();

            expect(callOrder).toEqual(['stop', 'destroyUI']);
        });
    });

    describe('handleGameOver()', () => {
        it('should use gameOverUI if available', () => {
            timeTrialMode = new TimeTrialMode(mockGame, mockSystems, mockHelpers);
            timeTrialMode.handleGameOver();
            expect(mockSystems.gameOverUI.showTimeTrialGameOver).toHaveBeenCalledWith(mockGame);
        });

        it('should fallback to legacy function if gameOverUI not available', () => {
            mockSystems.gameOverUI = null;
            timeTrialMode = new TimeTrialMode(mockGame, mockSystems, mockHelpers);
            timeTrialMode.handleGameOver();
            expect(mockHelpers.showTimeTrialGameOver).toHaveBeenCalled();
        });

        it('should not call legacy function if gameOverUI is available', () => {
            timeTrialMode = new TimeTrialMode(mockGame, mockSystems, mockHelpers);
            timeTrialMode.handleGameOver();
            expect(mockHelpers.showTimeTrialGameOver).not.toHaveBeenCalled();
        });
    });

    describe('createUI()', () => {
        it('should use uiManager if available', () => {
            timeTrialMode = new TimeTrialMode(mockGame, mockSystems, mockHelpers);
            timeTrialMode.createUI();
            expect(mockSystems.uiManager.updateForMode).toHaveBeenCalledWith(GameModes.TIME_TRIAL);
            expect(mockSystems.uiManager.createModeUI).toHaveBeenCalledWith(GameModes.TIME_TRIAL);
        });

        it('should fallback to legacy functions if uiManager not available', () => {
            mockSystems.uiManager = null;
            timeTrialMode = new TimeTrialMode(mockGame, mockSystems, mockHelpers);
            timeTrialMode.createUI();
            expect(mockHelpers.updateUIForGameMode).toHaveBeenCalled();
            expect(mockHelpers.createTimeTrialUI).toHaveBeenCalled();
            expect(mockHelpers.hideArenaShrinkUI).toHaveBeenCalled();
        });

        it('should not call legacy functions if uiManager is available', () => {
            timeTrialMode = new TimeTrialMode(mockGame, mockSystems, mockHelpers);
            timeTrialMode.createUI();
            expect(mockHelpers.updateUIForGameMode).not.toHaveBeenCalled();
        });
    });

    describe('destroyUI()', () => {
        it('should use modeUI if available', () => {
            timeTrialMode = new TimeTrialMode(mockGame, mockSystems, mockHelpers);
            timeTrialMode.destroyUI();
            expect(mockSystems.modeUI.hideTimeTrialUI).toHaveBeenCalled();
        });

        it('should fallback to legacy function if modeUI not available', () => {
            mockSystems.modeUI = null;
            timeTrialMode = new TimeTrialMode(mockGame, mockSystems, mockHelpers);
            timeTrialMode.destroyUI();
            expect(mockHelpers.hideTimeTrialUI).toHaveBeenCalled();
        });

        it('should not call legacy function if modeUI is available', () => {
            timeTrialMode = new TimeTrialMode(mockGame, mockSystems, mockHelpers);
            timeTrialMode.destroyUI();
            expect(mockHelpers.hideTimeTrialUI).not.toHaveBeenCalled();
        });
    });

    describe('Integration', () => {
        it('should complete full initialization sequence', () => {
            timeTrialMode = new TimeTrialMode(mockGame, mockSystems, mockHelpers);
            timeTrialMode.initialize();

            expect(mockGame.restart).toHaveBeenCalled();
            expect(mockGame.setTimeTrialMode).toHaveBeenCalledWith(true);
            expect(mockSystems.survivalTimer.reset).toHaveBeenCalled();
            expect(mockSystems.survivalTimer.start).toHaveBeenCalled();
            expect(mockSystems.achievementSystem.reset).toHaveBeenCalled();
            expect(mockSystems.renderingEngine.clearTrails).toHaveBeenCalled();
            expect(mockSystems.audioManager.handleGameStart).toHaveBeenCalled();
        });

        it('should handle cleanup sequence', () => {
            timeTrialMode = new TimeTrialMode(mockGame, mockSystems, mockHelpers);
            timeTrialMode.initialize();
            timeTrialMode.cleanup();

            expect(mockSystems.survivalTimer.stop).toHaveBeenCalled();
            expect(mockSystems.modeUI.hideTimeTrialUI).toHaveBeenCalled();
        });
    });
});
