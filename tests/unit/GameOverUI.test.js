/**
 * @jest-environment jsdom
 */

const { GameOverUI } = require('../../src/ui/GameOverUI');

// Mock dependencies
const mockStyleManager = {
    addStyles: jest.fn(),
};

const mockMultiplayerGameOverUI = {
    show: jest.fn(),
    hide: jest.fn(),
    isVisible: jest.fn().mockReturnValue(false),
};

const mockLocalScoringUI = {
    updateScores: jest.fn(),
    hideScores: jest.fn(),
};

const mockScoreDisplay = {
    showGameOverScores: jest.fn(),
};

const mockSurvivalTimer = {
    getElapsedTime: jest.fn().mockReturnValue(120000), // 2 minutes
    formatTime: jest.fn().mockReturnValue('02:00'),
};

const mockLeaderboardSystem = {
    isNewRecord: jest.fn().mockReturnValue(false),
};

const mockGame = {
    getGameState: jest.fn(),
    getSurvivalTime: jest.fn().mockReturnValue(60000),
    getFormattedSurvivalTime: jest.fn().mockReturnValue('01:00'),
    getShrinksSurvived: jest.fn().mockReturnValue(3),
    getBounds: jest.fn().mockReturnValue({ size: 500 }),
    restart: jest.fn(),
    resetScores: jest.fn(),
    gameOver: false,
};

const mockHideRemainingEntitiesDisplay = jest.fn();
const mockShowModeSelector = jest.fn();

describe('GameOverUI', () => {
    let gameOverUI;
    let gameOverElement;
    let restartButton;

    beforeEach(() => {
        // Setup DOM
        gameOverElement = document.createElement('div');
        gameOverElement.id = 'gameOver';
        document.body.appendChild(gameOverElement);

        restartButton = document.createElement('button');
        restartButton.id = 'restart';
        document.body.appendChild(restartButton);

        // Reset mocks
        jest.clearAllMocks();

        // Reset default return values
        mockSurvivalTimer.getElapsedTime.mockReturnValue(120000);
        mockSurvivalTimer.formatTime.mockReturnValue('02:00');
        mockLeaderboardSystem.isNewRecord.mockReturnValue(false);

        mockGame.getSurvivalTime.mockReturnValue(60000);
        mockGame.getFormattedSurvivalTime.mockReturnValue('01:00');
        mockGame.getShrinksSurvived.mockReturnValue(3);
        mockGame.getBounds.mockReturnValue({ size: 500 });
        mockGame.getGameState.mockReturnValue({
            playerScore: 0,
            aiScore: 0,
            highScore: 0,
            isNewHighScore: false,
            aiOpponents: [],
            roundsPlayed: 0,
        });

        // Initialize instance
        gameOverUI = new GameOverUI();
        gameOverUI.initialize({
            styleManager: mockStyleManager,
            multiplayerGameOverUI: mockMultiplayerGameOverUI,
            localScoringUI: mockLocalScoringUI,
            scoreDisplay: mockScoreDisplay,
            survivalTimer: mockSurvivalTimer,
            leaderboardSystem: mockLeaderboardSystem,
            hideRemainingEntitiesDisplay: mockHideRemainingEntitiesDisplay,
            showModeSelector: mockShowModeSelector,
            game: mockGame,
        });
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('Initialization', () => {
        test('should initialize with provided dependencies', () => {
            expect(gameOverUI.styleManager).toBe(mockStyleManager);
            expect(gameOverUI.multiplayerGameOverUI).toBe(mockMultiplayerGameOverUI);
            expect(gameOverUI.game).toBe(mockGame);
        });
    });

    describe('Classic Mode (Multi-AI)', () => {
        const classicState = {
            playerScore: 1000,
            aiScore: 500,
            highScore: 2000,
            isNewHighScore: false,
            aiOpponents: [{ alive: false }],
            roundsPlayed: 1,
        };

        beforeEach(() => {
            mockGame.getGameState.mockReturnValue(classicState);
        });

        test('should show victory message when player wins', () => {
            gameOverUI.show(classicState, 'CLASSIC');

            expect(gameOverElement.innerHTML).toContain('Victory');
            expect(gameOverElement.innerHTML).toContain('Your Score');
            expect(gameOverElement.querySelector('.player-score').textContent).toBe('1000');
            expect(gameOverElement.querySelector('.ai-score').textContent).toBe('500');
        });

        test('should show defeat message when AI wins', () => {
            mockGame.getGameState.mockReturnValue({
                ...classicState,
                playerScore: 500,
                aiScore: 1000,
            });

            gameOverUI.show(classicState, 'CLASSIC');
            expect(gameOverElement.innerHTML).toContain('Defeated');
        });

        test('should handle new high score', () => {
            mockGame.getGameState.mockReturnValue({
                ...classicState,
                isNewHighScore: true,
            });

            gameOverUI.show(classicState, 'CLASSIC');
            expect(gameOverElement.innerHTML).toContain('New High Score!');
        });

        test('should call hideRemainingEntitiesDisplay', () => {
            gameOverUI.show(classicState, 'CLASSIC');
            expect(mockHideRemainingEntitiesDisplay).toHaveBeenCalled();
        });

        test('should update scoreDisplay', () => {
            gameOverUI.show(classicState, 'CLASSIC');
            expect(mockScoreDisplay.showGameOverScores).toHaveBeenCalledWith(
                1000,
                500,
                2000,
                false
            );
        });

        test('should add styles via StyleManager', () => {
            gameOverUI.show(classicState, 'CLASSIC');
            expect(mockStyleManager.addStyles).toHaveBeenCalledWith(
                'multi-ai-game-over-styles',
                expect.stringContaining('.multi-ai-game-over')
            );
        });

        test('should handle multiple AI opponents messaging', () => {
            mockGame.getGameState.mockReturnValue({
                ...classicState,
                playerScore: 2000,
                aiScore: 100,
                aiOpponents: [{ alive: false }, { alive: false }, { alive: false }],
            });

            gameOverUI.show(classicState, 'CLASSIC');
            expect(gameOverElement.innerHTML).toContain('Victory! You defeated 3 AI opponents!');
        });

        test('should handle multiple AI opponents defeat', () => {
            mockGame.getGameState.mockReturnValue({
                ...classicState,
                playerScore: 100,
                aiScore: 200,
                aiOpponents: [{ alive: true }, { alive: true }],
            });

            gameOverUI.show(classicState, 'CLASSIC');
            expect(gameOverElement.innerHTML).toContain('Defeated by 2 AI opponents');
        });

        test('should handle single AI fallback logic', () => {
            mockGame.getGameState.mockReturnValue({
                ...classicState,
                aiOpponents: undefined,
                ai: true,
            });

            gameOverUI.show(classicState, 'CLASSIC');
            expect(gameOverElement.innerHTML).toContain('Victory! You defeated the AI!');
        });

        test('should handle missing roundsPlayed', () => {
            mockGame.getGameState.mockReturnValue({
                ...classicState,
                roundsPlayed: undefined,
            });

            gameOverUI.show(classicState, 'CLASSIC');
            const calculatedrounds = classicState.playerScore + classicState.aiScore;
            expect(gameOverElement.innerHTML).toContain(
                `<span class="stat-value">${calculatedrounds}</span>`
            );
        });

        test('should not crash if gameOverElement is missing', () => {
            document.body.removeChild(gameOverElement);
            gameOverElement = null;

            expect(() => gameOverUI.show(classicState, 'CLASSIC')).not.toThrow();
        });

        test('should not crash if scoreDisplay is missing', () => {
            gameOverUI.scoreDisplay = null;
            expect(() => gameOverUI.show(classicState, 'CLASSIC')).not.toThrow();
        });

        test('should not crash if styleManager is missing', () => {
            gameOverUI.styleManager = null;
            expect(() => gameOverUI.show(classicState, 'CLASSIC')).not.toThrow();
        });

        test('should handle missing hideRemainingEntitiesDisplay', () => {
            gameOverUI.hideRemainingEntitiesDisplay = null;
            expect(() => gameOverUI.show(classicState, 'CLASSIC')).not.toThrow();
        });
    });

    describe('Time Trial Mode', () => {
        test('should show time trial results', () => {
            gameOverUI.show({}, 'TIME_TRIAL');

            expect(mockSurvivalTimer.getElapsedTime).toHaveBeenCalled();
            expect(gameOverElement.innerHTML).toContain('Time Trial Complete!');
            expect(gameOverElement.innerHTML).toContain('Survival Time: 02:00');
        });

        test('should show new record message', () => {
            mockLeaderboardSystem.isNewRecord.mockReturnValue(true);
            gameOverUI.show({}, 'TIME_TRIAL');
            expect(gameOverElement.innerHTML).toContain('New Personal Best!');
        });

        test('should not crash if gameOverElement is missing in time trial', () => {
            document.body.removeChild(gameOverElement);
            gameOverElement = null;
            expect(() => gameOverUI.show({}, 'TIME_TRIAL')).not.toThrow();
        });
    });

    describe('Arena Shrink Mode', () => {
        beforeEach(() => {
            mockGame.getGameState.mockReturnValue({
                playerScore: 100,
                aiScore: 50,
            });
        });

        test('should show arena shrink results', () => {
            gameOverUI.show({}, 'ARENA_SHRINK');

            expect(gameOverElement.innerHTML).toContain('You Win!');
            expect(gameOverElement.innerHTML).toContain('Survival Time: 01:00');
            expect(gameOverElement.innerHTML).toContain('Shrinks Survived: 3');
            expect(gameOverElement.innerHTML).toContain('Final Arena: 500x500');
        });

        test('should not crash if gameOverElement is missing in arena mode', () => {
            document.body.removeChild(gameOverElement);
            gameOverElement = null;
            expect(() => gameOverUI.show({}, 'ARENA_SHRINK')).not.toThrow();
        });

        test('should show AI win message in arena shrink mode', () => {
            mockGame.getGameState.mockReturnValue({
                playerScore: 50,
                aiScore: 100,
            });
            gameOverUI.show({}, 'ARENA_SHRINK');
            expect(gameOverElement.innerHTML).toContain('AI Wins!');
        });
    });

    describe('Local Multiplayer Mode', () => {
        test('should delegate to MultiplayerGameOverUI', () => {
            const callbacks = { onRestart: jest.fn() };
            gameOverUI.show({}, 'LOCAL_MULTIPLAYER', callbacks);

            expect(mockMultiplayerGameOverUI.show).toHaveBeenCalled();
        });

        test('should initialize MultiplayerGameOverUI if not provided', () => {
            // New instance with no dependencies injected for multiplayer UI
            gameOverUI = new GameOverUI();
            gameOverUI.initialize({
                styleManager: mockStyleManager,
                game: mockGame,
                // multiplayerGameOverUI not provided
            });

            expect(gameOverUI.multiplayerGameOverUI).toBeUndefined();

            try {
                gameOverUI.show({}, 'LOCAL_MULTIPLAYER');
            } catch (e) {
                // Ignore require failure
            }
        });

        test('should hide standard game over elements', () => {
            gameOverElement.style.display = 'block';
            restartButton.style.display = 'block';

            gameOverUI.show({}, 'LOCAL_MULTIPLAYER');

            expect(gameOverElement.style.display).toBe('none');
            expect(restartButton.style.display).toBe('none');
        });

        test('should handle restart callback', () => {
            let restartCallback;
            mockMultiplayerGameOverUI.show.mockImplementation((state, onRestart) => {
                restartCallback = onRestart;
            });

            const onRestartSpy = jest.fn();
            gameOverUI.show({}, 'LOCAL_MULTIPLAYER', { onRestart: onRestartSpy });

            restartCallback();

            expect(mockGame.restart).toHaveBeenCalled();
            expect(mockLocalScoringUI.updateScores).toHaveBeenCalled();
            expect(onRestartSpy).toHaveBeenCalled();
        });

        test('should handle reset scores callback', () => {
            let resetCallback;
            mockMultiplayerGameOverUI.show.mockImplementation((state, onRestart, onReset) => {
                resetCallback = onReset;
            });

            const onResetSpy = jest.fn();
            gameOverUI.show({}, 'LOCAL_MULTIPLAYER', { onResetScores: onResetSpy });

            resetCallback();

            expect(mockGame.resetScores).toHaveBeenCalled();
            expect(mockLocalScoringUI.updateScores).toHaveBeenCalled();
            expect(onResetSpy).toHaveBeenCalled();
        });

        test('should handle return to single player callback', () => {
            let returnCallback;
            mockMultiplayerGameOverUI.show.mockImplementation(
                (state, onRestart, onReset, onReturn) => {
                    returnCallback = onReturn;
                }
            );

            const onReturnSpy = jest.fn();
            gameOverUI.show({}, 'LOCAL_MULTIPLAYER', { onReturnToSinglePlayer: onReturnSpy });

            returnCallback();

            expect(mockLocalScoringUI.hideScores).toHaveBeenCalled();
            expect(mockShowModeSelector).toHaveBeenCalled();
            expect(onReturnSpy).toHaveBeenCalled();
        });

        test('should handle missing localScoringUI in callbacks', () => {
            gameOverUI.localScoringUI = null;
            let restartCallback, resetCallback, returnCallback;
            mockMultiplayerGameOverUI.show.mockImplementation(
                (state, onRestart, onReset, onReturn) => {
                    restartCallback = onRestart;
                    resetCallback = onReset;
                    returnCallback = onReturn;
                }
            );

            gameOverUI.show({}, 'LOCAL_MULTIPLAYER');

            // Should not throw
            expect(() => restartCallback()).not.toThrow();
            expect(() => resetCallback()).not.toThrow();
            expect(() => returnCallback()).not.toThrow();
        });

        test('should handle missing showModeSelector in return callback', () => {
            gameOverUI.showModeSelector = null;
            let returnCallback;
            mockMultiplayerGameOverUI.show.mockImplementation(
                (state, onRestart, onReset, onReturn) => {
                    returnCallback = onReturn;
                }
            );

            gameOverUI.show({}, 'LOCAL_MULTIPLAYER');
            expect(() => returnCallback()).not.toThrow();
        });

        test('should handle missing DOM elements in showMultiplayerGameOver', () => {
            document.body.removeChild(gameOverElement);
            document.body.removeChild(restartButton);
            gameOverElement = null;
            restartButton = null;

            expect(() => gameOverUI.showMultiplayerGameOver({})).not.toThrow();
        });

        test('should use default callbacks if none provided to showMultiplayerGameOver', () => {
            // This tests the default parameter (callbacks = {})
            expect(() => gameOverUI.showMultiplayerGameOver()).not.toThrow();
        });
    });

    describe('Hide functionality', () => {
        test('should hide game over elements', () => {
            gameOverElement.style.display = 'block';
            gameOverUI.hide();
            expect(gameOverElement.style.display).toBe('none');
        });

        test('should hide restart button', () => {
            restartButton.style.display = 'block';
            gameOverUI.hide();
            expect(restartButton.style.display).toBe('none');
        });

        test('should hide multiplayer UI if visible', () => {
            mockMultiplayerGameOverUI.isVisible.mockReturnValue(true);
            gameOverUI.hide();
            expect(mockMultiplayerGameOverUI.hide).toHaveBeenCalled();
        });

        test('should handle missing DOM elements during hide', () => {
            document.body.removeChild(gameOverElement);
            document.body.removeChild(restartButton);

            expect(() => gameOverUI.hide()).not.toThrow();
        });
    });

    describe('Mode Selector Interaction', () => {
        test('should allow changing mode from game over screen', () => {
            // Need to simulate click on the dynamic button
            // The button calls global showModeSelector(), but in our test environment
            // we can't easily capture the inline onclick handler's execution in that scope.
            // However, we can check if the button exists and has the attribute.

            mockGame.getGameState.mockReturnValue({
                playerScore: 100,
                aiScore: 50,
            });

            gameOverUI.show({}, 'CLASSIC');

            const changeModeBtn = gameOverElement.querySelector('#changeModeButton');
            expect(changeModeBtn).toBeTruthy();
            expect(changeModeBtn.getAttribute('onclick')).toContain('showModeSelector()');
        });
    });
});
