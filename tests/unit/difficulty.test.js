/**
 * Tests for DifficultyManager
 */

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

describe('DifficultyManager', () => {
    let DifficultyManager, DIFFICULTY_CONFIGS;
    let difficultyManager;
    let mockGame, mockAIController, mockLogger;

    beforeEach(() => {
        jest.resetModules();
        const difficultyModule = require('@/systems/difficulty.js');
        DifficultyManager = difficultyModule.DifficultyManager;
        DIFFICULTY_CONFIGS = difficultyModule.DIFFICULTY_CONFIGS;

        mockLogger = require('@/utils/Logger.js').logger;

        mockGame = {
            setGameSpeed: jest.fn(),
            initializeAIOpponents: jest.fn(),
        };

        mockAIController = {
            difficultyConfig: null,
            setDifficultyConfig: jest.fn(),
        };

        // Mock localStorage
        const localStorageMock = {
            getItem: jest.fn().mockReturnValue(null),
            setItem: jest.fn(),
            removeItem: jest.fn(),
        };
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
            writable: true,
            configurable: true,
        });

        difficultyManager = new DifficultyManager(mockGame, mockAIController);
        jest.clearAllMocks();
    });

    it('should initialize successfully', () => {
        expect(difficultyManager).toBeDefined();
        expect(difficultyManager.getCurrentDifficulty()).toBe('medium');
    });

    it('should handle corrupted storage data', () => {
        window.localStorage.getItem.mockReturnValue('corrupted json');
        // Re-instantiate to trigger load
        const newManager = new DifficultyManager(mockGame, mockAIController);
        expect(newManager.getCurrentDifficulty()).toBe('medium');

        // Should log warning about failed parse
        expect(mockLogger.warn).toHaveBeenCalledWith(
            expect.stringContaining('Failed to parse stored difficulty data'),
            expect.any(Error)
        );

        // Should attempt to clear corrupted storage
        expect(window.localStorage.removeItem).toHaveBeenCalled();
    });

    it('should set valid difficulty levels', () => {
        difficultyManager.setDifficulty('easy');
        expect(difficultyManager.getCurrentDifficulty()).toBe('easy');
        expect(mockGame.setGameSpeed).toHaveBeenCalledWith(DIFFICULTY_CONFIGS.easy.gameSpeed);
    });

    it('should handle invalid difficulty level', () => {
        difficultyManager.setDifficulty('invalid_level');
        expect(difficultyManager.getCurrentDifficulty()).toBe('medium');
        expect(mockLogger.warn).toHaveBeenCalledWith(
            expect.stringContaining('Invalid difficulty level')
        );
    });
});
