const { GameModes } = require('@/systems/GameModes.js');

// Mock dependencies before requiring the module
const mockMultiplayerGame = jest.fn();
const mockDualControlScheme = jest.fn();
const mockSplitScreenCamera = jest.fn();

jest.mock('@/multiplayer/MultiplayerGame.js', () => ({
    MultiplayerGame: mockMultiplayerGame,
}));

jest.mock('@/utils/DualControlScheme.js', () => ({
    DualControlScheme: mockDualControlScheme,
}));

jest.mock('@/multiplayer/SplitScreenCamera.js', () => ({
    SplitScreenCamera: mockSplitScreenCamera,
}));

const { MultiplayerMode } = require('@/modes/MultiplayerMode.js');

describe('MultiplayerMode', () => {
    let multiplayerMode;
    let mockGame;
    let mockSystems;
    let mockHelpers;
    let mockMultiplayerGameInstance;
    let mockDualControlSchemeInstance;
    let mockSplitScreenCameraInstance;

    beforeEach(() => {
        // Create mock game
        mockGame = {
            getGameState: jest.fn().mockReturnValue({
                isPaused: false,
                gameOver: false,
            }),
            restart: jest.fn(),
            bounds: { width: 100, height: 100 },
        };

        // Create mock multiplayer game instance
        mockMultiplayerGameInstance = {
            init: jest.fn(),
            restart: jest.fn(),
            setPowerUpManager: jest.fn(),
            setCameraEffectsManager: jest.fn(),
            getGameState: jest.fn().mockReturnValue({
                isPaused: false,
                gameOver: false,
            }),
            player1: { id: 'P1', position: { x: -10, y: 0, z: 0 } },
            player2: { id: 'P2', position: { x: 10, y: 0, z: 0 } },
        };

        // Create mock dual control scheme instance
        mockDualControlSchemeInstance = {
            reset: jest.fn(),
        };

        // Create mock split screen camera instance
        mockSplitScreenCameraInstance = {
            setPlayers: jest.fn(),
        };

        // Mock constructors to return instances
        mockMultiplayerGame.mockImplementation(() => mockMultiplayerGameInstance);
        mockDualControlScheme.mockImplementation(() => mockDualControlSchemeInstance);
        mockSplitScreenCamera.mockImplementation(() => mockSplitScreenCameraInstance);

        // Create mock systems
        mockSystems = {
            renderingEngine: {
                clearTrails: jest.fn(),
                camera: {},
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
            uiManager: {
                updateForMode: jest.fn(),
                createModeUI: jest.fn(),
            },
            modeUI: {
                hideAllModeUI: jest.fn(),
            },
            cameraEffectsManager: {
                isEnabled: jest.fn().mockReturnValue(true),
            },
        };

        // Create mock helpers
        mockHelpers = {
            setGame: jest.fn(),
            resetGameReference: jest.fn(),
            initializeMultiplayerUI: jest.fn(),
            cleanupMultiplayerUI: jest.fn(),
            showMultiplayerGameOver: jest.fn(),
            updateUIForGameMode: jest.fn(),
            hideTimeTrialUI: jest.fn(),
            hideArenaShrinkUI: jest.fn(),
            hideRemainingEntitiesDisplay: jest.fn(),
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
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            expect(multiplayerMode.game).toBe(mockGame);
            expect(multiplayerMode.systems).toBe(mockSystems);
            expect(multiplayerMode.helpers).toBe(mockHelpers);
        });

        it('should initialize with null multiplayer game', () => {
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            expect(multiplayerMode.multiplayerGame).toBeNull();
        });

        it('should initialize with null dual control scheme', () => {
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            expect(multiplayerMode.dualControlScheme).toBeNull();
        });

        it('should initialize with null split screen camera', () => {
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            expect(multiplayerMode.splitScreenCamera).toBeNull();
        });
    });

    describe('initialize()', () => {
        it('should create new MultiplayerGame if not exists', () => {
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            multiplayerMode.initialize();
            expect(mockMultiplayerGame).toHaveBeenCalled();
            expect(multiplayerMode.multiplayerGame).toBe(mockMultiplayerGameInstance);
        });

        it('should restart existing MultiplayerGame if exists', () => {
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            multiplayerMode.multiplayerGame = mockMultiplayerGameInstance;
            multiplayerMode.initialize();
            expect(mockMultiplayerGameInstance.restart).toHaveBeenCalled();
            expect(mockMultiplayerGame).not.toHaveBeenCalled();
        });

        it('should wire up power-up system', () => {
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            multiplayerMode.initialize();
            expect(mockMultiplayerGameInstance.setPowerUpManager).toHaveBeenCalledWith(
                mockSystems.powerUpManager
            );
        });

        it('should wire up camera effects system', () => {
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            multiplayerMode.initialize();
            expect(mockMultiplayerGameInstance.setCameraEffectsManager).toHaveBeenCalledWith(
                mockSystems.cameraEffectsManager
            );
        });

        it('should switch active game reference', () => {
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            multiplayerMode.initialize();
            expect(multiplayerMode.game).toBe(mockMultiplayerGameInstance);
        });

        it('should update helper game reference', () => {
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            multiplayerMode.initialize();
            expect(mockHelpers.setGame).toHaveBeenCalledWith(mockMultiplayerGameInstance);
        });

        it('should create new DualControlScheme if not exists', () => {
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            multiplayerMode.initialize();
            expect(mockDualControlScheme).toHaveBeenCalled();
            expect(multiplayerMode.dualControlScheme).toBe(mockDualControlSchemeInstance);
        });

        it('should reset existing DualControlScheme if exists', () => {
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            multiplayerMode.dualControlScheme = mockDualControlSchemeInstance;
            multiplayerMode.initialize();
            expect(mockDualControlSchemeInstance.reset).toHaveBeenCalled();
            expect(mockDualControlScheme).not.toHaveBeenCalled();
        });

        it('should initialize multiplayer game', () => {
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            multiplayerMode.initialize();
            expect(mockMultiplayerGameInstance.init).toHaveBeenCalled();
        });

        it('should create new SplitScreenCamera if not exists', () => {
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            multiplayerMode.initialize();
            expect(mockSplitScreenCamera).toHaveBeenCalledWith(mockSystems.renderingEngine.camera);
            expect(multiplayerMode.splitScreenCamera).toBe(mockSplitScreenCameraInstance);
        });

        it('should set players on new SplitScreenCamera', () => {
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            multiplayerMode.initialize();
            expect(mockSplitScreenCameraInstance.setPlayers).toHaveBeenCalledWith([
                mockMultiplayerGameInstance.player1,
                mockMultiplayerGameInstance.player2,
            ]);
        });

        it('should update existing SplitScreenCamera players', () => {
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            multiplayerMode.splitScreenCamera = mockSplitScreenCameraInstance;
            multiplayerMode.initialize();
            expect(mockSplitScreenCameraInstance.setPlayers).toHaveBeenCalledWith([
                mockMultiplayerGameInstance.player1,
                mockMultiplayerGameInstance.player2,
            ]);
        });

        it('should initialize multiplayer UI', () => {
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            const initUISpy = jest.spyOn(multiplayerMode, '_initializeMultiplayerUI');
            multiplayerMode.initialize();
            expect(initUISpy).toHaveBeenCalled();
        });

        it('should perform common initialization tasks', () => {
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            const commonInitSpy = jest.spyOn(MultiplayerMode.prototype, '_commonInitialization');
            multiplayerMode.initialize();
            expect(commonInitSpy).toHaveBeenCalled();
        });

        it('should create UI', () => {
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            const createUISpy = jest.spyOn(multiplayerMode, 'createUI');
            multiplayerMode.initialize();
            expect(createUISpy).toHaveBeenCalled();
        });

        it('should handle audio and music for game start', () => {
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            multiplayerMode.initialize();
            expect(mockSystems.audioManager.handleGameStart).toHaveBeenCalled();
        });
    });

    describe('_initializeMultiplayerUI()', () => {
        it('should call helper initializeMultiplayerUI if available', () => {
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            multiplayerMode.multiplayerGame = mockMultiplayerGame;
            multiplayerMode._initializeMultiplayerUI();
            expect(mockHelpers.initializeMultiplayerUI).toHaveBeenCalledWith(mockMultiplayerGame);
        });

        it('should not throw if helper initializeMultiplayerUI not available', () => {
            delete mockHelpers.initializeMultiplayerUI;
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            multiplayerMode.multiplayerGame = mockMultiplayerGame;
            expect(() => {
                multiplayerMode._initializeMultiplayerUI();
            }).not.toThrow();
        });
    });

    describe('cleanup()', () => {
        it('should cleanup multiplayer UI', () => {
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            multiplayerMode.cleanup();
            expect(mockHelpers.cleanupMultiplayerUI).toHaveBeenCalled();
        });

        it('should destroy UI', () => {
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            const destroyUISpy = jest.spyOn(multiplayerMode, 'destroyUI');
            multiplayerMode.cleanup();
            expect(destroyUISpy).toHaveBeenCalled();
        });

        it('should reset game reference if helper available', () => {
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            multiplayerMode.cleanup();
            expect(mockHelpers.resetGameReference).toHaveBeenCalled();
        });

        it('should not throw if resetGameReference not available', () => {
            delete mockHelpers.resetGameReference;
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            expect(() => {
                multiplayerMode.cleanup();
            }).not.toThrow();
        });
    });

    describe('handleGameOver()', () => {
        it('should call helper showMultiplayerGameOver if available', () => {
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            multiplayerMode.handleGameOver();
            expect(mockHelpers.showMultiplayerGameOver).toHaveBeenCalled();
        });

        it('should not throw if helper not available', () => {
            delete mockHelpers.showMultiplayerGameOver;
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            expect(() => {
                multiplayerMode.handleGameOver();
            }).not.toThrow();
        });
    });

    describe('createUI()', () => {
        it('should use uiManager and modeUI if available', () => {
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            multiplayerMode.createUI();
            expect(mockSystems.uiManager.updateForMode).toHaveBeenCalledWith(
                GameModes.LOCAL_MULTIPLAYER
            );
            expect(mockSystems.modeUI.hideAllModeUI).toHaveBeenCalled();
        });

        it('should fallback to legacy functions if uiManager not available', () => {
            mockSystems.uiManager = null;
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            multiplayerMode.createUI();
            expect(mockHelpers.updateUIForGameMode).toHaveBeenCalled();
            expect(mockHelpers.hideTimeTrialUI).toHaveBeenCalled();
            expect(mockHelpers.hideArenaShrinkUI).toHaveBeenCalled();
            expect(mockHelpers.hideRemainingEntitiesDisplay).toHaveBeenCalled();
        });
    });

    describe('destroyUI()', () => {
        it('should use modeUI if available', () => {
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            multiplayerMode.destroyUI();
            expect(mockSystems.modeUI.hideAllModeUI).toHaveBeenCalled();
        });

        it('should not throw if modeUI not available', () => {
            mockSystems.modeUI = null;
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            expect(() => {
                multiplayerMode.destroyUI();
            }).not.toThrow();
        });
    });

    describe('getMultiplayerGame()', () => {
        it('should return multiplayer game instance', () => {
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            multiplayerMode.multiplayerGame = mockMultiplayerGameInstance;
            expect(multiplayerMode.getMultiplayerGame()).toBe(mockMultiplayerGameInstance);
        });
    });

    describe('getSplitScreenCamera()', () => {
        it('should return split screen camera instance', () => {
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            multiplayerMode.splitScreenCamera = mockSplitScreenCameraInstance;
            expect(multiplayerMode.getSplitScreenCamera()).toBe(mockSplitScreenCameraInstance);
        });
    });

    describe('getDualControlScheme()', () => {
        it('should return dual control scheme instance', () => {
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            multiplayerMode.dualControlScheme = mockDualControlSchemeInstance;
            expect(multiplayerMode.getDualControlScheme()).toBe(mockDualControlSchemeInstance);
        });
    });

    describe('Integration', () => {
        it('should complete full initialization sequence', () => {
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            multiplayerMode.initialize();

            expect(mockMultiplayerGame).toHaveBeenCalled();
            expect(mockMultiplayerGameInstance.setPowerUpManager).toHaveBeenCalled();
            expect(mockMultiplayerGameInstance.setCameraEffectsManager).toHaveBeenCalled();
            expect(mockHelpers.setGame).toHaveBeenCalled();
            expect(mockDualControlScheme).toHaveBeenCalled();
            expect(mockMultiplayerGameInstance.init).toHaveBeenCalled();
            expect(mockSplitScreenCamera).toHaveBeenCalled();
            expect(mockSplitScreenCameraInstance.setPlayers).toHaveBeenCalled();
            expect(mockSystems.audioManager.handleGameStart).toHaveBeenCalled();
        });

        it('should handle cleanup sequence', () => {
            multiplayerMode = new MultiplayerMode(mockGame, mockSystems, mockHelpers);
            multiplayerMode.initialize();
            multiplayerMode.cleanup();

            expect(mockHelpers.cleanupMultiplayerUI).toHaveBeenCalled();
            expect(mockSystems.modeUI.hideAllModeUI).toHaveBeenCalled();
            expect(mockHelpers.resetGameReference).toHaveBeenCalled();
        });
    });
});
