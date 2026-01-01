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

jest.mock('@/ui/LoadingIndicator.js');
jest.mock('@/utils/InitializationState.js');
jest.mock('@/utils/BrowserCompatibility.js');
jest.mock('@/ui/CompatibilityWarningUI.js');
jest.mock('@/utils/CanvasVerifier.js');

describe('GameInitializer', () => {
    let GameInitializer;
    let gameInitializer;
    let mockRecoveryManager;
    let mockLoadingIndicator;
    let mockInitializationState;
    let mockBrowserCompatibility;
    let mockCompatibilityWarningUI;
    let mockCanvasVerifier;

    // Dependencies (mocks)
    let LoadingIndicator,
        InitializationState,
        BrowserCompatibility,
        CompatibilityWarningUI,
        CanvasVerifier;

    beforeEach(() => {
        jest.resetModules();

        // Re-require Logger mock to ensure we have the same instance
        const loggerModule = require('@/utils/Logger.js');
        mockLogger = loggerModule.logger;
        MockLoggerClass = loggerModule.Logger;

        GameInitializer = require('@/initialization/GameInitializer.js').GameInitializer;

        // Setup mock modules
        LoadingIndicator = require('@/ui/LoadingIndicator.js').LoadingIndicator;
        InitializationState = require('@/utils/InitializationState.js').InitializationState;
        BrowserCompatibility = require('@/utils/BrowserCompatibility.js').BrowserCompatibility;
        CompatibilityWarningUI = require('@/ui/CompatibilityWarningUI.js').CompatibilityWarningUI;
        CanvasVerifier = require('@/utils/CanvasVerifier.js').CanvasVerifier;

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

        if (!global.document) {
            global.document = {};
        }
        global.document.createElement = jest.fn(() => mockCanvas);

        global.window = global.window || {};
        global.window.WebGLRenderingContext = {};

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
    });

    describe('initialize()', () => {
        it('should create initialization state tracker', async () => {
            await gameInitializer.initialize();
            expect(InitializationState).toHaveBeenCalled();
            expect(mockInitializationState.start).toHaveBeenCalled();
        });

        it('should throw error if compatibility check fails', async () => {
            mockBrowserCompatibility.checkCompatibility.mockReturnValue({
                isCompatible: false,
                errors: ['Error 1'],
                warnings: [],
            });

            const result = await gameInitializer.initialize();
            expect(result.success).toBe(false);
        });
    });

    describe('performBrowserCompatibilityCheck()', () => {
        it('should log compatibility check results', () => {
            gameInitializer.performBrowserCompatibilityCheck();
            expect(mockLogger.info).toHaveBeenCalled();
        });
    });
});
