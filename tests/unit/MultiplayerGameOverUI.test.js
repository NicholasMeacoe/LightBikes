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

const { MultiplayerGameOverUI } = require('@/ui/MultiplayerGameOverUI.js');

describe('MultiplayerGameOverUI', () => {
    let gameOverUI;

    beforeEach(() => {
        // Clear document body
        document.body.innerHTML = '';

        // Remove any existing styles
        const existingStyles = document.getElementById('multiplayerGameOverStyles');
        if (existingStyles) {
            existingStyles.remove();
        }

        gameOverUI = new MultiplayerGameOverUI();
    });

    afterEach(() => {
        if (gameOverUI) {
            gameOverUI.destroy();
        }
    });

    describe('constructor', () => {
        it('should initialize with null gameOverElement', () => {
            expect(gameOverUI.gameOverElement).toBeNull();
        });

        it('should add styles to document', () => {
            const styleElement = document.getElementById('multiplayerGameOverStyles');
            expect(styleElement).not.toBeNull();
        });

        it('should set isInitialized to true', () => {
            expect(gameOverUI.isInitialized).toBe(true);
        });
    });

    describe('addStyles', () => {
        it('should not add duplicate styles', () => {
            gameOverUI.addStyles();
            gameOverUI.addStyles();

            const styleElements = document.querySelectorAll('#multiplayerGameOverStyles');
            expect(styleElements.length).toBe(1);
        });

        it('should add comprehensive CSS styles', () => {
            const styleElement = document.getElementById('multiplayerGameOverStyles');
            expect(styleElement.textContent).toContain('.multiplayer-game-over-container');
            expect(styleElement.textContent).toContain('.multiplayer-game-over-title');
            expect(styleElement.textContent).toContain('.multiplayer-final-scores');
        });
    });

    describe('show', () => {
        it('should create and display game over screen', () => {
            const gameState = {
                localScoring: {
                    player1Wins: 3,
                    player2Wins: 2,
                    totalRounds: 5,
                },
            };

            gameOverUI.show(gameState, jest.fn(), jest.fn(), jest.fn());

            expect(gameOverUI.gameOverElement).not.toBeNull();
            expect(document.body.contains(gameOverUI.gameOverElement)).toBe(true);
        });

        it('should display Player 1 wins when player1Wins > player2Wins', () => {
            const gameState = {
                localScoring: {
                    player1Wins: 5,
                    player2Wins: 2,
                    totalRounds: 7,
                },
            };

            gameOverUI.show(gameState, jest.fn(), jest.fn(), jest.fn());

            const titleElement = gameOverUI.gameOverElement.querySelector(
                '.multiplayer-game-over-title'
            );
            expect(titleElement.textContent).toContain('Player 1 Wins!');
            expect(titleElement.classList.contains('player1-wins')).toBe(true);
        });

        it('should display Player 2 wins when player2Wins > player1Wins', () => {
            const gameState = {
                localScoring: {
                    player1Wins: 2,
                    player2Wins: 5,
                    totalRounds: 7,
                },
            };

            gameOverUI.show(gameState, jest.fn(), jest.fn(), jest.fn());

            const titleElement = gameOverUI.gameOverElement.querySelector(
                '.multiplayer-game-over-title'
            );
            expect(titleElement.textContent).toContain('Player 2 Wins!');
            expect(titleElement.classList.contains('player2-wins')).toBe(true);
        });

        it('should display tie when scores are equal', () => {
            const gameState = {
                localScoring: {
                    player1Wins: 3,
                    player2Wins: 3,
                    totalRounds: 6,
                },
            };

            gameOverUI.show(gameState, jest.fn(), jest.fn(), jest.fn());

            const titleElement = gameOverUI.gameOverElement.querySelector(
                '.multiplayer-game-over-title'
            );
            expect(titleElement.textContent).toContain('Tie Game!');
            expect(titleElement.classList.contains('tie')).toBe(true);
        });

        it('should display correct scores', () => {
            const gameState = {
                localScoring: {
                    player1Wins: 4,
                    player2Wins: 3,
                    totalRounds: 7,
                },
            };

            gameOverUI.show(gameState, jest.fn(), jest.fn(), jest.fn());

            const scoreValues = gameOverUI.gameOverElement.querySelectorAll(
                '.multiplayer-score-value'
            );
            expect(scoreValues[0].textContent).toBe('4');
            expect(scoreValues[1].textContent).toBe('3');
        });

        it('should display total rounds', () => {
            const gameState = {
                localScoring: {
                    player1Wins: 3,
                    player2Wins: 2,
                    totalRounds: 5,
                },
            };

            gameOverUI.show(gameState, jest.fn(), jest.fn(), jest.fn());

            const roundInfo = gameOverUI.gameOverElement.querySelector('.multiplayer-round-info');
            expect(roundInfo.textContent).toContain('Total Rounds: 5');
        });

        it('should create restart button with callback', () => {
            const onRestart = jest.fn();
            const gameState = {
                localScoring: {
                    player1Wins: 3,
                    player2Wins: 2,
                    totalRounds: 5,
                },
            };

            gameOverUI.show(gameState, onRestart, jest.fn(), jest.fn());

            const restartBtn = document.getElementById('multiplayerRestartBtn');
            expect(restartBtn).not.toBeNull();

            restartBtn.click();
            expect(onRestart).toHaveBeenCalled();
        });

        it('should create reset scores button with callback', () => {
            const onResetScores = jest.fn();
            const gameState = {
                localScoring: {
                    player1Wins: 3,
                    player2Wins: 2,
                    totalRounds: 5,
                },
            };

            gameOverUI.show(gameState, jest.fn(), onResetScores, jest.fn());

            const resetBtn = document.getElementById('multiplayerResetBtn');
            expect(resetBtn).not.toBeNull();

            resetBtn.click();
            expect(onResetScores).toHaveBeenCalled();
        });

        it('should create single player button with callback', () => {
            const onReturnToSinglePlayer = jest.fn();
            const gameState = {
                localScoring: {
                    player1Wins: 3,
                    player2Wins: 2,
                    totalRounds: 5,
                },
            };

            gameOverUI.show(gameState, jest.fn(), jest.fn(), onReturnToSinglePlayer);

            const singlePlayerBtn = document.getElementById('multiplayerSinglePlayerBtn');
            expect(singlePlayerBtn).not.toBeNull();

            singlePlayerBtn.click();
            expect(onReturnToSinglePlayer).toHaveBeenCalled();
        });

        it('should hide game over screen when button is clicked', () => {
            const gameState = {
                localScoring: {
                    player1Wins: 3,
                    player2Wins: 2,
                    totalRounds: 5,
                },
            };

            gameOverUI.show(gameState, jest.fn(), jest.fn(), jest.fn());
            expect(gameOverUI.isVisible()).toBe(true);

            const restartBtn = document.getElementById('multiplayerRestartBtn');
            restartBtn.click();

            expect(gameOverUI.isVisible()).toBe(false);
        });

        it('should handle missing localScoring gracefully', () => {
            const gameState = {};

            gameOverUI.show(gameState, jest.fn(), jest.fn(), jest.fn());

            expect(gameOverUI.gameOverElement).not.toBeNull();
            const scoreValues = gameOverUI.gameOverElement.querySelectorAll(
                '.multiplayer-score-value'
            );
            expect(scoreValues[0].textContent).toBe('0');
            expect(scoreValues[1].textContent).toBe('0');
        });

        it('should remove previous game over screen before showing new one', () => {
            const gameState = {
                localScoring: {
                    player1Wins: 3,
                    player2Wins: 2,
                    totalRounds: 5,
                },
            };

            gameOverUI.show(gameState, jest.fn(), jest.fn(), jest.fn());
            const firstElement = gameOverUI.gameOverElement;

            gameOverUI.show(gameState, jest.fn(), jest.fn(), jest.fn());
            const secondElement = gameOverUI.gameOverElement;

            expect(firstElement).not.toBe(secondElement);
            expect(document.body.contains(firstElement)).toBe(false);
            expect(document.body.contains(secondElement)).toBe(true);
        });
    });

    describe('hide', () => {
        it('should remove game over element from DOM', () => {
            const gameState = {
                localScoring: {
                    player1Wins: 3,
                    player2Wins: 2,
                    totalRounds: 5,
                },
            };

            gameOverUI.show(gameState, jest.fn(), jest.fn(), jest.fn());
            expect(gameOverUI.gameOverElement).not.toBeNull();

            gameOverUI.hide();
            expect(gameOverUI.gameOverElement).toBeNull();
        });

        it('should handle hide when no element exists', () => {
            expect(() => gameOverUI.hide()).not.toThrow();
        });
    });

    describe('isVisible', () => {
        it('should return false when game over screen is not shown', () => {
            expect(gameOverUI.isVisible()).toBe(false);
        });

        it('should return true when game over screen is shown', () => {
            const gameState = {
                localScoring: {
                    player1Wins: 3,
                    player2Wins: 2,
                    totalRounds: 5,
                },
            };

            gameOverUI.show(gameState, jest.fn(), jest.fn(), jest.fn());
            expect(gameOverUI.isVisible()).toBe(true);
        });

        it('should return false after hide is called', () => {
            const gameState = {
                localScoring: {
                    player1Wins: 3,
                    player2Wins: 2,
                    totalRounds: 5,
                },
            };

            gameOverUI.show(gameState, jest.fn(), jest.fn(), jest.fn());
            gameOverUI.hide();
            expect(gameOverUI.isVisible()).toBe(false);
        });
    });

    describe('destroy', () => {
        it('should remove game over element', () => {
            const gameState = {
                localScoring: {
                    player1Wins: 3,
                    player2Wins: 2,
                    totalRounds: 5,
                },
            };

            gameOverUI.show(gameState, jest.fn(), jest.fn(), jest.fn());
            gameOverUI.destroy();

            expect(gameOverUI.gameOverElement).toBeNull();
        });

        it('should remove styles from document', () => {
            gameOverUI.destroy();

            const styleElement = document.getElementById('multiplayerGameOverStyles');
            expect(styleElement).toBeNull();
        });

        it('should set isInitialized to false', () => {
            gameOverUI.destroy();
            expect(gameOverUI.isInitialized).toBe(false);
        });

        it('should handle destroy when no elements exist', () => {
            gameOverUI.hide();
            expect(() => gameOverUI.destroy()).not.toThrow();
        });
    });
});
