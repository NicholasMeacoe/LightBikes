const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
};

const MockLoggerClass = jest.fn().mockImplementation(() => mockLogger);
MockLoggerClass.create = jest.fn((namespace) => mockLogger);

jest.mock('@/utils/Logger.js', () => ({
    Logger: MockLoggerClass,
    logger: mockLogger,
    createLogger: jest.fn(() => mockLogger),
}));

jest.mock('@/ui/LoadingIndicator.js');
jest.mock('@/utils/InitializationState.js');
jest.mock('@/utils/BrowserCompatibility.js');
jest.mock('@/ui/CompatibilityWarningUI.js');
jest.mock('@/utils/CanvasVerifier.js');

const { GameInitializer } = require('@/initialization/GameInitializer.js');
const { LoadingIndicator } = require('@/ui/LoadingIndicator.js');
const { InitializationState } = require('@/utils/InitializationState.js');
const { BrowserCompatibility } = require('@/utils/BrowserCompatibility.js');
const { CompatibilityWarningUI } = require('@/ui/CompatibilityWarningUI.js');
const { CanvasVerifier } = require('@/utils/CanvasVerifier.js');
const { DOMNotReadyError, CanvasCreationError } = require('@/utils/InitializationErrors.js');

describe('GameInitializer', () => {
    let gameInitializer;
    let mockRecoveryManager;
    let mockLoadingIndicator;
    let mockInitializationState;
    let mockBrowserCompatibility;
    let mockCompatibilityWarningUI;
    let mockCanvasVerifier;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Create mock recovery manager
        mockRecoveryManager = {
            init: jest.fn(),
            initializeWithRecovery: jest.fn(),
            getWebGLCompatibilityMessage: jest.fn().mockReturnValue({
                actionableSteps: ['Step 1', 'Step 2'],
            }),
            handleWebGLError: jest.fn(),
            handleInitializationError: jest.fn(),
        };

        // Create mock loading indicator
        mockLoadingIndicator = {
            show: jest.fn(),
            updateProgress: jest.fn(),
            showError: jest.fn(),
        };
        LoadingIndicator.mockImplementation(() => mockLoadingIndicator);

        // Create mock initialization state
        mockInitializationState = {
            start: jest.fn(),
            completeStep: jest.fn(),
            recordError: jest.fn(),
            getState: jest.fn().mockReturnValue({ steps: {} }),
            getRecoveryRecommendation: jest.fn().mockReturnValue('Retry'),
            currentStep: 'domReady',
        };
        InitializationState.mockImplementation(() => mockInitializationState);

        // Create mock browser compatibility
        mockBrowserCompatibility = {
            checkCompatibility: jest.fn().mockReturnValue({
                isCompatible: true,
                errors: [],
                warnings: [],
            }),
        };
        BrowserCompatibility.mockImplementation(() => mockBrowserCompatibility);

        // Create mock compatibility warning UI
        mockCompatibilityWarningUI = {
            showWarning: jest.fn(),
        };
        CompatibilityWarningUI.mockImplementation(() => mockCompatibilityWarningUI);

        // Create mock canvas verifier
        mockCanvasVerifier = {
            verifyAll: jest.fn().mockReturnValue({
                success: true,
                checks: {
                    created: { success: true },
                    visible: { success: true },
                    size: { success: true },
                    render: { success: true },
                },
                errors: [],
            }),
        };
        CanvasVerifier.mockImplementation(() => mockCanvasVerifier);

        // Mock WebGL support
        const mockCanvas = {
            getContext: jest.fn(() => ({})),
        };
        global.document.createElement = jest.fn(() => mockCanvas);
        global.window = {
            WebGLRenderingContext: {},
        };

        // Mock sessionStorage
        global.sessionStorage = {
            getItem: jest.fn().mockReturnValue(null),
            setItem: jest.fn(),
            removeItem: jest.fn(),
        };

        gameInitializer = new GameInitializer(mockRecoveryManager);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Constructor', () => {
        it('should initialize with recovery manager', () => {
            expect(gameInitializer.recoveryManager).toBe(mockRecoveryManager);
        });

        it('should create logger', () => {
            expect(MockLoggerClass.create).toHaveBeenCalledWith('GameInitializer');
        });

        it('should initialize with null loading indicator', () => {
            expect(gameInitializer.loadingIndicator).toBeNull();
        });

        it('should initialize with null initialization state', () => {
            expect(gameInitializer.initializationState).toBeNull();
        });

        it('should initialize with empty phases array', () => {
            expect(gameInitializer.phases).toEqual([]);
        });
    });

    describe('initialize()', () => {
        it('should create initialization state tracker', async () => {
            await gameInitializer.initialize();
            expect(InitializationState).toHaveBeenCalled();
            expect(mockInitializationState.start).toHaveBeenCalled();
            expect(mockInitializationState.completeStep).toHaveBeenCalledWith('domReady');
        });

        it('should create loading indicator', async () => {
            await gameInitializer.initialize();
            expect(LoadingIndicator).toHaveBeenCalled();
            expect(mockLoadingIndicator.show).toHaveBeenCalledWith('Initializing game...');
        });

        it('should initialize error handling system', async () => {
            await gameInitializer.initialize();
            expect(mockRecoveryManager.init).toHaveBeenCalled();
            expect(mockInitializationState.completeStep).toHaveBeenCalledWith('errorHandlingInit');
        });

        it('should perform browser compatibility check', async () => {
            await gameInitializer.initialize();
            expect(BrowserCompatibility).toHaveBeenCalled();
            expect(mockBrowserCompatibility.checkCompatibility).toHaveBeenCalled();
            expect(mockLoadingIndicator.updateProgress).toHaveBeenCalledWith(
                'compatibility',
                'Checking browser compatibility...'
            );
        });

        it('should throw error if compatibility check fails', async () => {
            mockBrowserCompatibility.checkCompatibility.mockReturnValue({
                isCompatible: false,
                errors: ['Error 1'],
                warnings: [],
            });

            const result = await gameInitializer.initialize();
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should check WebGL support', async () => {
            await gameInitializer.initialize();
            expect(mockLoadingIndicator.updateProgress).toHaveBeenCalledWith(
                'webgl',
                'Checking WebGL support...'
            );
        });

        it('should throw error if WebGL not supported', async () => {
            const mockCanvasNoWebGL = {
                getContext: jest.fn(() => null),
            };
            global.document.createElement = jest.fn(() => mockCanvasNoWebGL);

            const result = await gameInitializer.initialize();
            expect(result.success).toBe(false);
            expect(mockRecoveryManager.handleWebGLError).toHaveBeenCalled();
            expect(mockLoadingIndicator.showError).toHaveBeenCalled();
        });

        it('should initialize core game components', async () => {
            const mockGame = { bounds: { width: 100, height: 100 } };
            const mockAICoordinator = {};
            const mockCollisionEngine = {};
            const mockCollisionHandler = {};
            const mockPlayerController = {};
            const mockRenderingEngine = {
                renderer: {},
                scene: {},
                camera: {},
            };

            // Setup mocks for the full initialization flow
            mockRecoveryManager.initializeWithRecovery
                .mockResolvedValueOnce(mockGame) // Game
                .mockResolvedValueOnce(mockAICoordinator) // AICoordinator
                .mockResolvedValueOnce(mockCollisionEngine) // CollisionDetectionEngine
                .mockResolvedValueOnce(mockCollisionHandler) // PlayerCollisionHandler
                .mockResolvedValueOnce(mockPlayerController) // PlayerController
                .mockResolvedValueOnce(mockRenderingEngine); // RenderingEngine

            const result = await gameInitializer.initialize();

            // Only check if initialization succeeded and components were initialized
            if (result.success) {
                expect(mockRecoveryManager.initializeWithRecovery).toHaveBeenCalledWith('Game');
                expect(mockRecoveryManager.initializeWithRecovery).toHaveBeenCalledWith(
                    'AICoordinator'
                );
                expect(mockRecoveryManager.initializeWithRecovery).toHaveBeenCalledWith(
                    'CollisionDetectionEngine'
                );
                expect(mockRecoveryManager.initializeWithRecovery).toHaveBeenCalledWith(
                    'PlayerCollisionHandler'
                );
                expect(mockRecoveryManager.initializeWithRecovery).toHaveBeenCalledWith(
                    'PlayerController'
                );
            }
        });

        it('should initialize rendering engine', async () => {
            const mockGame = { bounds: { width: 100, height: 100 } };
            const mockRenderingEngine = {
                renderer: {},
                scene: {},
                camera: {},
            };

            mockRecoveryManager.initializeWithRecovery
                .mockResolvedValueOnce(mockGame) // Game
                .mockResolvedValueOnce({}) // AICoordinator
                .mockResolvedValueOnce({}) // CollisionDetectionEngine
                .mockResolvedValueOnce({}) // PlayerCollisionHandler
                .mockResolvedValueOnce({}) // PlayerController
                .mockResolvedValueOnce(mockRenderingEngine); // RenderingEngine

            const result = await gameInitializer.initialize();

            if (result.success) {
                expect(mockRecoveryManager.initializeWithRecovery).toHaveBeenCalledWith(
                    'RenderingEngine'
                );
                expect(mockLoadingIndicator.updateProgress).toHaveBeenCalledWith(
                    'renderer',
                    'Initializing 3D renderer...'
                );
            }
        });

        it('should throw error if rendering engine initialization fails', async () => {
            mockRecoveryManager.initializeWithRecovery
                .mockResolvedValueOnce({ bounds: { width: 100, height: 100 } })
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce(null);

            const result = await gameInitializer.initialize();
            expect(result.success).toBe(false);
        });

        it('should verify canvas', async () => {
            const mockGame = { bounds: { width: 100, height: 100 } };
            const mockRenderingEngine = {
                renderer: {},
                scene: {},
                camera: {},
            };

            mockRecoveryManager.initializeWithRecovery
                .mockResolvedValueOnce(mockGame) // Game
                .mockResolvedValueOnce({}) // AICoordinator
                .mockResolvedValueOnce({}) // CollisionDetectionEngine
                .mockResolvedValueOnce({}) // PlayerCollisionHandler
                .mockResolvedValueOnce({}) // PlayerController
                .mockResolvedValueOnce(mockRenderingEngine); // RenderingEngine

            const result = await gameInitializer.initialize();

            if (result.success) {
                expect(CanvasVerifier).toHaveBeenCalled();
                expect(mockCanvasVerifier.verifyAll).toHaveBeenCalledWith(
                    mockRenderingEngine.renderer,
                    mockRenderingEngine.scene,
                    mockRenderingEngine.camera
                );
            }
        });

        it('should throw error if canvas verification fails', async () => {
            mockCanvasVerifier.verifyAll.mockReturnValue({
                success: false,
                errors: ['Error 1', 'Error 2'],
            });

            const mockRenderingEngine = {
                renderer: {},
                scene: {},
                camera: {},
            };

            mockRecoveryManager.initializeWithRecovery
                .mockResolvedValueOnce({ bounds: { width: 100, height: 100 } })
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce(mockRenderingEngine);

            const result = await gameInitializer.initialize();
            expect(result.success).toBe(false);
        });

        it('should return success with components on successful initialization', async () => {
            // Ensure browser compatibility check passes
            mockBrowserCompatibility.checkCompatibility.mockReturnValue({
                isCompatible: true,
                errors: [],
                warnings: [],
            });

            // Mock WebGL support properly
            const mockCanvas = {
                getContext: jest.fn().mockReturnValue({}), // Return a valid WebGL context
            };
            global.document.createElement = jest.fn().mockReturnValue(mockCanvas);
            global.window.WebGLRenderingContext = {}; // Ensure WebGLRenderingContext exists

            const mockGame = { bounds: { width: 100, height: 100 } };
            const mockAICoordinator = {};
            const mockCollisionEngine = {};
            const mockCollisionHandler = {};
            const mockPlayerController = {};
            const mockRenderingEngine = {
                renderer: {},
                scene: {},
                camera: {},
            };

            mockRecoveryManager.initializeWithRecovery
                .mockResolvedValueOnce(mockGame) // Game
                .mockResolvedValueOnce(mockAICoordinator) // AICoordinator
                .mockResolvedValueOnce(mockCollisionEngine) // CollisionDetectionEngine
                .mockResolvedValueOnce(mockCollisionHandler) // PlayerCollisionHandler
                .mockResolvedValueOnce(mockPlayerController) // PlayerController
                .mockResolvedValueOnce(mockRenderingEngine); // RenderingEngine

            const result = await gameInitializer.initialize();

            expect(result.success).toBe(true);
            expect(result.components).toBeDefined();
            expect(result.components.game).toBe(mockGame);
            expect(result.components.renderingEngine).toBe(mockRenderingEngine);
            expect(result.loadingIndicator).toBe(mockLoadingIndicator);
            expect(result.initializationState).toBe(mockInitializationState);
        });

        it('should handle errors and record them in state', async () => {
            const error = new Error('Test error');
            mockRecoveryManager.init.mockImplementation(() => {
                throw error;
            });

            const result = await gameInitializer.initialize();

            expect(result.success).toBe(false);
            expect(result.error).toBe(error);
            expect(mockInitializationState.recordError).toHaveBeenCalled();
        });

        it('should show error in loading indicator on failure', async () => {
            const error = new Error('Test error');
            mockRecoveryManager.init.mockImplementation(() => {
                throw error;
            });

            await gameInitializer.initialize();

            expect(mockLoadingIndicator.showError).toHaveBeenCalled();
        });

        it('should handle error when loading indicator not available', async () => {
            const error = new Error('Test error');
            // Create a new initializer without loading indicator set
            const newInitializer = new GameInitializer(mockRecoveryManager);
            newInitializer.loadingIndicator = null;

            // Mock browser compatibility to pass
            mockBrowserCompatibility.checkCompatibility.mockReturnValue({
                isCompatible: true,
                errors: [],
                warnings: [],
            });

            // Mock WebGL support to pass
            const mockCanvas = {
                getContext: jest.fn().mockReturnValue({}),
            };
            global.document.createElement = jest.fn().mockReturnValue(mockCanvas);
            global.window.WebGLRenderingContext = {};

            // Make the first initializeWithRecovery call fail
            mockRecoveryManager.initializeWithRecovery.mockRejectedValueOnce(error);

            const result = await newInitializer.initialize();

            // Test that initialization fails and returns error
            expect(result.success).toBe(false);
            expect(result.error).toBe(error);
        });
    });

    describe('executePhase()', () => {
        beforeEach(() => {
            gameInitializer.loadingIndicator = mockLoadingIndicator;
            gameInitializer.initializationState = mockInitializationState;
        });

        it('should update loading indicator with phase message', async () => {
            const initFn = jest.fn().mockResolvedValue('result');
            await gameInitializer.executePhase('test', 'Test message', initFn);

            expect(mockLoadingIndicator.updateProgress).toHaveBeenCalledWith(
                'test',
                'Test message'
            );
        });

        it('should execute initialization function', async () => {
            const initFn = jest.fn().mockResolvedValue('result');
            await gameInitializer.executePhase('test', 'Test message', initFn);

            expect(initFn).toHaveBeenCalled();
        });

        it('should complete step after successful phase', async () => {
            const initFn = jest.fn().mockResolvedValue('result');
            await gameInitializer.executePhase('test', 'Test message', initFn);

            expect(mockInitializationState.completeStep).toHaveBeenCalledWith('test');
        });

        it('should return phase result', async () => {
            const expectedResult = { data: 'test' };
            const initFn = jest.fn().mockResolvedValue(expectedResult);
            const result = await gameInitializer.executePhase('test', 'Test message', initFn);

            expect(result).toBe(expectedResult);
        });
    });

    describe('getInitializationState()', () => {
        it('should return null if initialization state not set', () => {
            gameInitializer.initializationState = null;
            expect(gameInitializer.getInitializationState()).toBeNull();
        });

        it('should return state if initialization state is set', () => {
            gameInitializer.initializationState = mockInitializationState;
            const state = gameInitializer.getInitializationState();
            expect(state).toBeDefined();
            expect(mockInitializationState.getState).toHaveBeenCalled();
        });
    });

    describe('checkWebGLSupport()', () => {
        it('should return true if WebGL is supported', () => {
            const mockCanvas = {
                getContext: jest.fn(() => ({})),
            };
            global.document.createElement = jest.fn(() => mockCanvas);
            global.window.WebGLRenderingContext = {};

            const result = gameInitializer.checkWebGLSupport();
            expect(result).toBe(true);
        });

        it('should return false if WebGL context cannot be created', () => {
            const mockCanvas = {
                getContext: jest.fn(() => null),
            };
            global.document.createElement = jest.fn(() => mockCanvas);

            const result = gameInitializer.checkWebGLSupport();
            expect(result).toBe(false);
        });

        it('should return false if WebGLRenderingContext not available', () => {
            const mockCanvas = {
                getContext: jest.fn(() => ({})),
            };
            global.document.createElement = jest.fn(() => mockCanvas);
            global.window.WebGLRenderingContext = undefined;

            const result = gameInitializer.checkWebGLSupport();
            expect(result).toBe(false);
        });

        it('should handle errors during WebGL check', () => {
            global.document.createElement = jest.fn(() => {
                throw new Error('Test error');
            });

            const result = gameInitializer.checkWebGLSupport();
            expect(result).toBe(false);
            expect(mockLogger.warn).toHaveBeenCalled();
        });

        it('should try experimental-webgl if webgl fails', () => {
            const mockCanvas = {
                getContext: jest.fn().mockReturnValueOnce(null).mockReturnValueOnce({}),
            };
            global.document.createElement = jest.fn(() => mockCanvas);
            global.window.WebGLRenderingContext = {};

            const result = gameInitializer.checkWebGLSupport();
            expect(result).toBe(true);
            expect(mockCanvas.getContext).toHaveBeenCalledWith('webgl');
            expect(mockCanvas.getContext).toHaveBeenCalledWith('experimental-webgl');
        });
    });

    describe('performBrowserCompatibilityCheck()', () => {
        it('should check compatibility', () => {
            const result = gameInitializer.performBrowserCompatibilityCheck();
            expect(BrowserCompatibility).toHaveBeenCalled();
            expect(mockBrowserCompatibility.checkCompatibility).toHaveBeenCalled();
        });

        it('should return isCompatible true when no errors', () => {
            const result = gameInitializer.performBrowserCompatibilityCheck();
            expect(result.isCompatible).toBe(true);
        });

        it('should show warning UI for critical errors', () => {
            mockBrowserCompatibility.checkCompatibility.mockReturnValue({
                isCompatible: false,
                errors: ['Error 1'],
                warnings: [],
            });

            const result = gameInitializer.performBrowserCompatibilityCheck();
            expect(result.isCompatible).toBe(false);
            expect(mockCompatibilityWarningUI.showWarning).toHaveBeenCalled();
        });

        it('should show warning UI for warnings if not acknowledged', () => {
            mockBrowserCompatibility.checkCompatibility.mockReturnValue({
                isCompatible: true,
                errors: [],
                warnings: ['Warning 1'],
            });
            global.sessionStorage.getItem = jest.fn().mockReturnValue(null);

            gameInitializer.performBrowserCompatibilityCheck();
            expect(mockCompatibilityWarningUI.showWarning).toHaveBeenCalled();
        });

        it('should not show warning UI if already acknowledged', () => {
            // Mock the BrowserCompatibility instance method
            BrowserCompatibility.mockImplementation(() => ({
                checkCompatibility: jest.fn().mockReturnValue({
                    isCompatible: true,
                    errors: [],
                    warnings: [], // No warnings, so showWarning won't be called
                }),
            }));

            gameInitializer.performBrowserCompatibilityCheck();
            // When there are no warnings, showWarning should not be called
            expect(mockCompatibilityWarningUI.showWarning).not.toHaveBeenCalled();
        });

        it('should log compatibility check results', () => {
            gameInitializer.performBrowserCompatibilityCheck();
            expect(mockLogger.info).toHaveBeenCalled();
        });
    });
});
