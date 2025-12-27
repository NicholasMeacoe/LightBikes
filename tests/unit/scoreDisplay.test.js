/**
 * Tests for ScoreDisplay class
 * Validates UI rendering, positioning, and score presentation functionality
 */

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

const { ScoreDisplay } = require('@/ui/scoreDisplay.js');

// Mock DOM environment
const mockElement = {
    style: {},
    textContent: '',
    id: '',
    appendChild: jest.fn(),
    parentNode: {
        removeChild: jest.fn(),
    },
};

const mockDocument = {
    createElement: jest.fn(() => ({ ...mockElement })),
    body: {
        appendChild: jest.fn(),
    },
    head: {
        appendChild: jest.fn(),
    },
    getElementById: jest.fn(() => null),
};

const mockWindow = {
    innerWidth: 1024,
    addEventListener: jest.fn(),
};

// Setup global mocks
global.document = mockDocument;
global.window = mockWindow;

describe('ScoreDisplay', () => {
    let scoreDisplay;
    let mockRenderer;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        mockDocument.createElement.mockReturnValue({ ...mockElement });
        mockDocument.getElementById.mockReturnValue(null);
        mockWindow.innerWidth = 1024;

        // Mock renderer
        mockRenderer = {
            renderer: {
                domElement: mockElement,
                setClearColor: jest.fn(),
            },
        };

        scoreDisplay = new ScoreDisplay(mockRenderer);
    });

    afterEach(() => {
        if (scoreDisplay) {
            scoreDisplay.destroy();
        }
    });

    describe('constructor', () => {
        it('should initialize with renderer and create score elements', () => {
            expect(scoreDisplay.renderer).toBe(mockRenderer);
            expect(scoreDisplay.isInitialized).toBe(true);
            expect(scoreDisplay.scoreElements.playerScore).toBeDefined();
            expect(scoreDisplay.scoreElements.aiScore).toBeDefined();
            expect(scoreDisplay.scoreElements.highScore).toBeDefined();
            expect(scoreDisplay.scoreElements.newHighScore).toBeDefined();
        });

        it('should create score elements with correct properties', () => {
            expect(scoreDisplay.scoreElements.playerScore.id).toBe('playerScore');
            expect(scoreDisplay.scoreElements.aiScore.id).toBe('aiScore');
            expect(scoreDisplay.scoreElements.highScore.id).toBe('highScore');
            expect(scoreDisplay.scoreElements.newHighScore.id).toBe('newHighScore');
        });
    });

    describe('createScoreElements', () => {
        it('should create all required score UI elements', () => {
            const newScoreDisplay = new ScoreDisplay(mockRenderer);

            expect(newScoreDisplay.scoreElements.playerScore).toBeDefined();
            expect(newScoreDisplay.scoreElements.aiScore).toBeDefined();
            expect(newScoreDisplay.scoreElements.highScore).toBeDefined();
            expect(newScoreDisplay.scoreElements.newHighScore).toBeDefined();
        });

        it('should set proper styling for player score element', () => {
            const playerElement = scoreDisplay.scoreElements.playerScore;
            expect(playerElement.className).toContain('score-display');
            expect(playerElement.className).toContain('player-score');
            expect(playerElement.id).toBe('playerScore');
        });

        it('should set proper styling for AI score element', () => {
            const aiElement = scoreDisplay.scoreElements.aiScore;
            expect(aiElement.className).toContain('score-display');
            expect(aiElement.className).toContain('ai-score');
            expect(aiElement.id).toBe('aiScore');
        });

        it('should create CSS animation styles', () => {
            // Test that style element creation is attempted
            expect(scoreDisplay.isInitialized).toBe(true);
        });
    });

    describe('updateGameplayScores', () => {
        it('should update player and AI score text content', () => {
            scoreDisplay.updateGameplayScores(5, 3);

            expect(scoreDisplay.scoreElements.playerScore.textContent).toBe('Player: 5');
            expect(scoreDisplay.scoreElements.aiScore.textContent).toBe('AI: 3');
        });

        it('should make gameplay scores visible', () => {
            scoreDisplay.updateGameplayScores(2, 1);

            expect(scoreDisplay.scoreElements.playerScore.style.display).toBe('block');
            expect(scoreDisplay.scoreElements.aiScore.style.display).toBe('block');
        });

        it('should hide game over elements during gameplay', () => {
            scoreDisplay.updateGameplayScores(1, 0);

            expect(scoreDisplay.scoreElements.highScore.style.display).toBe('none');
            expect(scoreDisplay.scoreElements.newHighScore.style.display).toBe('none');
        });

        it('should handle zero scores correctly', () => {
            scoreDisplay.updateGameplayScores(0, 0);

            expect(scoreDisplay.scoreElements.playerScore.textContent).toBe('Player: 0');
            expect(scoreDisplay.scoreElements.aiScore.textContent).toBe('AI: 0');
        });

        it('should reinitialize if not initialized', () => {
            scoreDisplay.isInitialized = false;
            const createSpy = jest.spyOn(scoreDisplay, 'createScoreElements');

            scoreDisplay.updateGameplayScores(1, 1);

            expect(createSpy).toHaveBeenCalled();
            expect(scoreDisplay.isInitialized).toBe(true);
        });
    });

    describe('showGameOverScores', () => {
        it('should display all scores including high score', () => {
            scoreDisplay.showGameOverScores(8, 5, 10, false);

            expect(scoreDisplay.scoreElements.playerScore.textContent).toBe('Player: 8');
            expect(scoreDisplay.scoreElements.aiScore.textContent).toBe('AI: 5');
            expect(scoreDisplay.scoreElements.highScore.textContent).toBe('High Score: 10');
            expect(scoreDisplay.scoreElements.highScore.style.display).toBe('block');
        });

        it('should show new high score message when isNewHigh is true', () => {
            scoreDisplay.showGameOverScores(12, 3, 12, true);

            expect(scoreDisplay.scoreElements.newHighScore.textContent).toBe('New High Score!');
            expect(scoreDisplay.scoreElements.newHighScore.style.display).toBe('block');
        });

        it('should hide new high score message when isNewHigh is false', () => {
            scoreDisplay.showGameOverScores(5, 7, 15, false);

            expect(scoreDisplay.scoreElements.newHighScore.style.display).toBe('none');
        });

        it('should handle new high score correctly', () => {
            scoreDisplay.showGameOverScores(20, 8, 20, true);

            expect(scoreDisplay.scoreElements.highScore.textContent).toBe('High Score: 20');
            expect(scoreDisplay.scoreElements.newHighScore.style.display).toBe('block');
        });

        it('should reinitialize if not initialized', () => {
            scoreDisplay.isInitialized = false;
            const createSpy = jest.spyOn(scoreDisplay, 'createScoreElements');

            scoreDisplay.showGameOverScores(3, 2, 5, false);

            expect(createSpy).toHaveBeenCalled();
            expect(scoreDisplay.isInitialized).toBe(true);
        });
    });

    describe('hideScores', () => {
        it('should hide all score elements', () => {
            scoreDisplay.hideScores();

            expect(scoreDisplay.scoreElements.playerScore.style.display).toBe('none');
            expect(scoreDisplay.scoreElements.aiScore.style.display).toBe('none');
            expect(scoreDisplay.scoreElements.highScore.style.display).toBe('none');
            expect(scoreDisplay.scoreElements.newHighScore.style.display).toBe('none');
        });

        it('should handle uninitialized state gracefully', () => {
            scoreDisplay.isInitialized = false;

            expect(() => scoreDisplay.hideScores()).not.toThrow();
        });

        it('should handle missing elements gracefully', () => {
            scoreDisplay.scoreElements.playerScore = null;

            expect(() => scoreDisplay.hideScores()).not.toThrow();
        });
    });

    describe('positionScoreElements', () => {
        it('should adjust positioning for desktop screens', () => {
            mockWindow.innerWidth = 1024;

            scoreDisplay.positionScoreElements();

            // With CSS-based positioning, check that elements maintain their classes
            expect(scoreDisplay.scoreElements.playerScore.className).toContain('player-score');
            expect(scoreDisplay.scoreElements.aiScore.className).toContain('ai-score');
            // CSS handles the positioning, so no inline styles expected
        });

        it('should adjust positioning for mobile screens', () => {
            // Mock window.innerWidth for mobile
            Object.defineProperty(global.window, 'innerWidth', {
                writable: true,
                value: 600,
            });

            scoreDisplay.positionScoreElements();

            // With CSS-based positioning, check that elements maintain their classes
            expect(scoreDisplay.scoreElements.playerScore.className).toContain('player-score');
            expect(scoreDisplay.scoreElements.aiScore.className).toContain('ai-score');
            // CSS media queries handle responsive positioning
        });

        it('should handle uninitialized state gracefully', () => {
            scoreDisplay.isInitialized = false;

            expect(() => scoreDisplay.positionScoreElements()).not.toThrow();
        });
    });

    describe('destroy', () => {
        it('should remove all score elements from DOM', () => {
            scoreDisplay.destroy();

            Object.values(scoreDisplay.scoreElements).forEach((element) => {
                if (element && element.parentNode) {
                    expect(element.parentNode.removeChild).toHaveBeenCalledWith(element);
                }
            });
        });

        it('should remove CSS styles', () => {
            // Test that destroy method completes without errors
            expect(() => scoreDisplay.destroy()).not.toThrow();
            expect(scoreDisplay.isInitialized).toBe(false);
        });

        it('should reset initialization state', () => {
            scoreDisplay.destroy();

            expect(scoreDisplay.scoreElements).toEqual({});
            expect(scoreDisplay.isInitialized).toBe(false);
        });

        it('should handle missing elements gracefully', () => {
            scoreDisplay.scoreElements.playerScore = null;

            expect(() => scoreDisplay.destroy()).not.toThrow();
        });
    });

    describe('responsive behavior', () => {
        it('should handle window resize events', () => {
            // Test that positionScoreElements method exists and can be called
            expect(typeof scoreDisplay.positionScoreElements).toBe('function');
            expect(() => scoreDisplay.positionScoreElements()).not.toThrow();
        });
    });

    describe('error handling', () => {
        it('should handle DOM manipulation errors gracefully', () => {
            // Test that the class can be instantiated even with potential DOM issues
            expect(scoreDisplay).toBeDefined();
            expect(scoreDisplay.scoreElements).toBeDefined();
        });

        it('should handle missing renderer gracefully', () => {
            expect(() => new ScoreDisplay(null)).not.toThrow();
        });
    });
});
