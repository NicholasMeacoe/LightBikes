const { ModeController } = require('@/modes/ModeController.js');

describe('ModeController', () => {
    let modeController;
    let mockGame;
    let mockSystems;

    beforeEach(() => {
        // Create mock game
        mockGame = {
            getGameState: jest.fn().mockReturnValue({
                isPaused: false,
                gameOver: false,
            }),
            restart: jest.fn(),
            setTimeTrialMode: jest.fn(),
            setGameMode: jest.fn(),
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
                showFinalArenaMessage: jest.fn(),
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

        // Create DOM elements that ModeController expects
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
        it('should initialize with game and systems', () => {
            modeController = new ModeController(mockGame, mockSystems);
            expect(modeController.game).toBe(mockGame);
            expect(modeController.systems).toBe(mockSystems);
        });

        it('should store game and systems references', () => {
            const game = { test: 'game' };
            const systems = { test: 'systems' };
            modeController = new ModeController(game, systems);
            expect(modeController.game).toBe(game);
            expect(modeController.systems).toBe(systems);
        });
    });

    describe('initialize()', () => {
        it('should throw error when called directly on base class', () => {
            modeController = new ModeController(mockGame, mockSystems);
            expect(() => {
                modeController.initialize();
            }).toThrow('ModeController.initialize() must be implemented by subclass');
        });

        it('should throw error with correct message', () => {
            modeController = new ModeController(mockGame, mockSystems);
            try {
                modeController.initialize();
            } catch (error) {
                expect(error.message).toBe(
                    'ModeController.initialize() must be implemented by subclass'
                );
            }
        });
    });

    describe('cleanup()', () => {
        it('should throw error when called directly on base class', () => {
            modeController = new ModeController(mockGame, mockSystems);
            expect(() => {
                modeController.cleanup();
            }).toThrow('ModeController.cleanup() must be implemented by subclass');
        });

        it('should throw error with correct message', () => {
            modeController = new ModeController(mockGame, mockSystems);
            try {
                modeController.cleanup();
            } catch (error) {
                expect(error.message).toBe(
                    'ModeController.cleanup() must be implemented by subclass'
                );
            }
        });
    });

    describe('update()', () => {
        it('should do nothing by default', () => {
            modeController = new ModeController(mockGame, mockSystems);
            expect(() => {
                modeController.update(16.67);
            }).not.toThrow();
        });

        it('should accept deltaTime parameter', () => {
            modeController = new ModeController(mockGame, mockSystems);
            modeController.update(16.67);
            modeController.update(33.33);
            // Should not throw
            expect(true).toBe(true);
        });
    });

    describe('handleGameOver()', () => {
        it('should throw error when called directly on base class', () => {
            modeController = new ModeController(mockGame, mockSystems);
            expect(() => {
                modeController.handleGameOver();
            }).toThrow('ModeController.handleGameOver() must be implemented by subclass');
        });

        it('should throw error with correct message', () => {
            modeController = new ModeController(mockGame, mockSystems);
            try {
                modeController.handleGameOver();
            } catch (error) {
                expect(error.message).toBe(
                    'ModeController.handleGameOver() must be implemented by subclass'
                );
            }
        });
    });

    describe('createUI()', () => {
        it('should throw error when called directly on base class', () => {
            modeController = new ModeController(mockGame, mockSystems);
            expect(() => {
                modeController.createUI();
            }).toThrow('ModeController.createUI() must be implemented by subclass');
        });

        it('should throw error with correct message', () => {
            modeController = new ModeController(mockGame, mockSystems);
            try {
                modeController.createUI();
            } catch (error) {
                expect(error.message).toBe(
                    'ModeController.createUI() must be implemented by subclass'
                );
            }
        });
    });

    describe('destroyUI()', () => {
        it('should throw error when called directly on base class', () => {
            modeController = new ModeController(mockGame, mockSystems);
            expect(() => {
                modeController.destroyUI();
            }).toThrow('ModeController.destroyUI() must be implemented by subclass');
        });

        it('should throw error with correct message', () => {
            modeController = new ModeController(mockGame, mockSystems);
            try {
                modeController.destroyUI();
            } catch (error) {
                expect(error.message).toBe(
                    'ModeController.destroyUI() must be implemented by subclass'
                );
            }
        });
    });

    describe('_commonInitialization()', () => {
        it('should reset rendering engine trails', () => {
            modeController = new ModeController(mockGame, mockSystems);
            modeController._commonInitialization();
            expect(mockSystems.renderingEngine.clearTrails).toHaveBeenCalled();
        });

        it('should reset power-up manager', () => {
            modeController = new ModeController(mockGame, mockSystems);
            modeController._commonInitialization();
            expect(mockSystems.powerUpManager.reset).toHaveBeenCalled();
        });

        it('should reset status indicator', () => {
            modeController = new ModeController(mockGame, mockSystems);
            modeController._commonInitialization();
            expect(mockSystems.statusIndicator.reset).toHaveBeenCalled();
        });

        it('should handle glow effect manager restart if initialized', () => {
            modeController = new ModeController(mockGame, mockSystems);
            modeController._commonInitialization();
            expect(mockSystems.glowEffectManager.handleGameRestart).toHaveBeenCalled();
        });

        it('should not call handleGameRestart if glow effect manager not initialized', () => {
            mockSystems.glowEffectManager.initialized = false;
            modeController = new ModeController(mockGame, mockSystems);
            modeController._commonInitialization();
            expect(mockSystems.glowEffectManager.handleGameRestart).not.toHaveBeenCalled();
        });

        it('should hide game over element if it exists', () => {
            modeController = new ModeController(mockGame, mockSystems);
            modeController._commonInitialization();
            const gameOverElement = document.getElementById('gameOver');
            expect(gameOverElement.style.display).toBe('none');
        });

        it('should hide restart button if it exists', () => {
            modeController = new ModeController(mockGame, mockSystems);
            modeController._commonInitialization();
            const restartBtn = document.getElementById('restart');
            expect(restartBtn.style.display).toBe('none');
        });

        it('should not throw if game over element does not exist', () => {
            document.body.innerHTML = '';
            modeController = new ModeController(mockGame, mockSystems);
            expect(() => {
                modeController._commonInitialization();
            }).not.toThrow();
        });

        it('should not throw if restart button does not exist', () => {
            document.body.innerHTML = '<div id="gameOver"></div>';
            modeController = new ModeController(mockGame, mockSystems);
            expect(() => {
                modeController._commonInitialization();
            }).not.toThrow();
        });

        it('should update pause overlay', () => {
            modeController = new ModeController(mockGame, mockSystems);
            const updatePauseOverlaySpy = jest.spyOn(modeController, '_updatePauseOverlay');
            modeController._commonInitialization();
            expect(updatePauseOverlaySpy).toHaveBeenCalled();
        });
    });

    describe('_updatePauseOverlay()', () => {
        it('should show pause overlay when game is paused', () => {
            mockGame.getGameState.mockReturnValue({ isPaused: true });
            modeController = new ModeController(mockGame, mockSystems);
            modeController._updatePauseOverlay();
            const pauseOverlayEl = document.getElementById('pauseOverlay');
            expect(pauseOverlayEl.style.display).toBe('flex');
        });

        it('should hide pause overlay when game is not paused', () => {
            mockGame.getGameState.mockReturnValue({ isPaused: false });
            modeController = new ModeController(mockGame, mockSystems);
            modeController._updatePauseOverlay();
            const pauseOverlayEl = document.getElementById('pauseOverlay');
            expect(pauseOverlayEl.style.display).toBe('none');
        });

        it('should not throw if pause overlay element does not exist', () => {
            document.body.innerHTML = '';
            modeController = new ModeController(mockGame, mockSystems);
            expect(() => {
                modeController._updatePauseOverlay();
            }).not.toThrow();
        });

        it('should call getGameState to check pause status', () => {
            modeController = new ModeController(mockGame, mockSystems);
            modeController._updatePauseOverlay();
            expect(mockGame.getGameState).toHaveBeenCalled();
        });

        it('should handle multiple pause state changes', () => {
            modeController = new ModeController(mockGame, mockSystems);

            mockGame.getGameState.mockReturnValue({ isPaused: true });
            modeController._updatePauseOverlay();
            expect(document.getElementById('pauseOverlay').style.display).toBe('flex');

            mockGame.getGameState.mockReturnValue({ isPaused: false });
            modeController._updatePauseOverlay();
            expect(document.getElementById('pauseOverlay').style.display).toBe('none');
        });
    });
});
