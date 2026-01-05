/**
 * GameInitialization Integration Test
 * Verifies the complete game initialization flow and recovery mechanisms.
 */

// Mock Logger with hoisting safe pattern
jest.mock('../../src/utils/Logger.js', () => {
    const mockLoggerInstance = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    };
    return {
        Logger: {
            create: jest.fn(() => mockLoggerInstance),
        },
        createLogger: jest.fn(() => mockLoggerInstance),
        logger: mockLoggerInstance,
        __mockLogger: mockLoggerInstance,
    };
});

// Mock UI and Utility components
jest.mock('../../src/ui/LoadingIndicator.js');
jest.mock('../../src/utils/InitializationState.js');
jest.mock('../../src/utils/BrowserCompatibility.js');
jest.mock('../../src/ui/CompatibilityWarningUI.js');
jest.mock('../../src/utils/CanvasVerifier.js');

const { __mockLogger } = require('../../src/utils/Logger.js');

describe('Game Initialization Integration', () => {
    let GameInitializer;
    let gameInitializer;
    let mockRecoveryManager;
    let mockLoadingIndicator;
    let mockInitializationState;
    let mockCanvasVerifier;
    let mockBrowserCompatibility;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();

        // Re-require modules
        GameInitializer = require('../../src/initialization/GameInitializer.js').GameInitializer;
        const { LoadingIndicator } = require('../../src/ui/LoadingIndicator.js');
        const { InitializationState } = require('../../src/utils/InitializationState.js');
        const { BrowserCompatibility } = require('../../src/utils/BrowserCompatibility.js');
        const { CanvasVerifier } = require('../../src/utils/CanvasVerifier.js');

        // Mock RecoveryManager
        mockRecoveryManager = {
            init: jest.fn(),
            getWebGLCompatibilityMessage: jest.fn().mockReturnValue({ actionableSteps: [] }),
            handleWebGLError: jest.fn(),
            initializeWithRecovery: jest.fn().mockImplementation((componentName) => {
                if (componentName === 'RenderingEngine') {
                    return Promise.resolve({
                        renderer: {},
                        scene: {},
                        camera: {},
                    });
                }
                return Promise.resolve({ name: componentName, initialized: true });
            }),
            handleInitializationError: jest.fn(),
        };

        // Mock LoadingIndicator (instance)
        mockLoadingIndicator = {
            show: jest.fn(),
            updateProgress: jest.fn(),
            showError: jest.fn(),
        };
        LoadingIndicator.mockImplementation(() => mockLoadingIndicator);

        // Mock InitializationState
        mockInitializationState = {
            start: jest.fn(),
            completeStep: jest.fn(),
            recordError: jest.fn(),
            getState: jest.fn(),
            getRecoveryRecommendation: jest.fn(),
            currentStep: 'test',
        };
        InitializationState.mockImplementation(() => mockInitializationState);

        // Mock BrowserCompatibility
        mockBrowserCompatibility = {
            checkCompatibility: jest
                .fn()
                .mockReturnValue({ isCompatible: true, warnings: [], errors: [] }),
        };
        BrowserCompatibility.mockImplementation(() => mockBrowserCompatibility);

        // Mock CanvasVerifier
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

        // Setup DOM for WebGL check
        const mockContext = {
            getExtension: jest.fn(),
            getParameter: jest.fn(),
        };
        const mockCanvas = {
            getContext: jest.fn((type) => {
                if (type === 'webgl' || type === 'experimental-webgl') return mockContext;
                return null;
            }),
        };
        document.createElement = jest.fn((tag) => {
            if (tag === 'canvas') return mockCanvas;
            return {};
        });
        window.WebGLRenderingContext = true;

        gameInitializer = new GameInitializer(mockRecoveryManager);
    });

    it('should complete full initialization sequence successfully', async () => {
        const result = await gameInitializer.initialize();

        if (!result.success) {
            console.error('Init failed:', result.error);
        }

        expect(result.success).toBe(true);
        expect(mockInitializationState.start).toHaveBeenCalled();
        expect(mockLoadingIndicator.show).toHaveBeenCalled();
        expect(mockRecoveryManager.init).toHaveBeenCalled();

        expect(mockBrowserCompatibility.checkCompatibility).toHaveBeenCalled();
        expect(mockRecoveryManager.initializeWithRecovery).toHaveBeenCalledWith('Game');
        expect(mockRecoveryManager.initializeWithRecovery).toHaveBeenCalledWith('RenderingEngine');
        expect(mockCanvasVerifier.verifyAll).toHaveBeenCalled();

        expect(result.components.game).toBeDefined();
        expect(result.components.renderingEngine).toBeDefined();
    });

    it('should fail gracefully if browser is incompatible', async () => {
        mockBrowserCompatibility.checkCompatibility.mockReturnValue({
            isCompatible: false,
            errors: ['Old Browser'],
        });

        const result = await gameInitializer.initialize();

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(mockLoadingIndicator.showError).toHaveBeenCalled();
    });

    it('should handle WebGL support failure', async () => {
        document.createElement.mockReturnValue({
            getContext: jest.fn().mockReturnValue(null),
        });
        window.WebGLRenderingContext = false;

        const result = await gameInitializer.initialize();

        expect(result.success).toBe(false);
        expect(mockRecoveryManager.handleWebGLError).toHaveBeenCalled();
    });

    it('should handle component initialization failure via RecoveryManager', async () => {
        mockRecoveryManager.initializeWithRecovery.mockRejectedValue(new Error('Game Init Failed'));

        const result = await gameInitializer.initialize();

        expect(result.success).toBe(false);
        expect(mockInitializationState.recordError).toHaveBeenCalled();
        expect(mockLoadingIndicator.showError).toHaveBeenCalled();
    });

    it('should verify canvas and fail if verification fails', async () => {
        mockCanvasVerifier.verifyAll.mockReturnValue({
            success: false,
            checks: {
                created: { success: true },
                visible: { success: false },
                size: { success: true },
                render: { success: false },
            },
            errors: ['Black Screen'],
        });

        const result = await gameInitializer.initialize();

        expect(result.success).toBe(false);
        expect(result.error.message).toContain('Canvas verification failed');
    });

    it('should track progress via LoadingIndicator', async () => {
        await gameInitializer.initialize();

        expect(mockLoadingIndicator.updateProgress).toHaveBeenCalledWith(
            'compatibility',
            expect.any(String)
        );
        expect(mockLoadingIndicator.updateProgress).toHaveBeenCalledWith(
            'webgl',
            expect.any(String)
        );
        expect(mockLoadingIndicator.updateProgress).toHaveBeenCalledWith(
            'game',
            expect.any(String)
        );
        expect(mockLoadingIndicator.updateProgress).toHaveBeenCalledWith(
            'renderer',
            expect.any(String)
        );
        expect(mockLoadingIndicator.updateProgress).toHaveBeenCalledWith(
            'canvas',
            expect.any(String)
        );
    });
});
