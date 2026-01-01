/**
 * Tests for MultiAIManager
 */

jest.mock('@/core/ai.js', () => ({
    AIController: jest.fn(() => ({
        aiState: 'defensive',
        calculateAIDirection: jest.fn(),
    })),
    AICoordinator: jest.fn(() => ({
        coordinateAIDecisions: jest.fn(() => []),
    })),
}));

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

describe('MultiAIManager', () => {
    let MultiAIManager;
    let manager;
    let mockGame, mockDifficultyManager, mockPerformanceMonitor;

    beforeEach(() => {
        jest.resetModules();
        MultiAIManager = require('@/systems/MultiAIManager.js').MultiAIManager;

        mockGame = {
            getGameState: jest.fn(() => ({
                player: { alive: true },
                aiOpponents: [{ id: 'ai_0', alive: true }],
            })),
            scoreManager: {
                incrementPlayerScore: jest.fn(),
                incrementAIScore: jest.fn(),
            },
        };

        mockDifficultyManager = {
            setAIController: jest.fn(),
            getDifficultyConfig: jest.fn().mockReturnValue({}),
        };

        mockPerformanceMonitor = {
            startAICalculation: jest.fn(),
            endAICalculation: jest.fn(),
        };

        manager = new MultiAIManager(mockGame, mockDifficultyManager, mockPerformanceMonitor);
        jest.clearAllMocks();
    });

    it('should initialize successfully', () => {
        expect(manager).toBeDefined();
        expect(manager.logger).toBeDefined();
    });

    it('should initialize AI controllers', () => {
        manager.initializeAIControllers(3);
        expect(manager.aiControllers).toHaveLength(3);
        expect(manager.currentAICount).toBe(3);
    });

    it('should calculate multi-AI directions', () => {
        manager.initializeAIControllers(2);
        const gameState = {
            aiOpponents: [{ id: 'ai_0' }, { id: 'ai_1' }],
        };
        const results = manager.calculateMultiAIDirections(gameState, {});
        expect(results).toEqual([]);
    });
});
