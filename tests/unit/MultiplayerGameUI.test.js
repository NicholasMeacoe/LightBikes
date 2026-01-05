/**
 * MultiplayerGameUI.test.js
 * Comprehensive tests for MultiplayerGameUI component
 */

const { MultiplayerGameUI } = require('../../src/ui/MultiplayerGameUI.js');

describe('MultiplayerGameUI', () => {
    let multiplayerGameUI;
    let mockGame;
    let mockScoreDisplay;
    let mockMultiplayerGame;
    let mockLocalScoring;
    let MockLocalScoringUI;
    let MockMultiplayerGameOverUI;

    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = '';
        document.head.innerHTML = '';

        // Mock local scoring
        mockLocalScoring = {
            getScoreDetails: jest.fn(() => ({
                player1Score: 2,
                player2Score: 1,
                totalRounds: 3,
            })),
        };

        // Mock multiplayer game
        mockMultiplayerGame = {
            localScoring: mockLocalScoring,
        };

        // Mock game
        mockGame = {
            getGameState: jest.fn(() => ({
                playerScore: 3,
                aiScore: 2,
                highScore: 5,
                isNewHighScore: false,
                aiOpponents: [
                    { id: 'ai_1', alive: false },
                    { id: 'ai_2', alive: true },
                ],
                roundsPlayed: 5,
            })),
        };

        // Mock score display
        mockScoreDisplay = {
            showGameOverScores: jest.fn(),
        };

        // Create mock classes
        MockLocalScoringUI = jest.fn().mockImplementation(() => ({
            showScores: jest.fn(),
            hideScores: jest.fn(),
        }));

        MockMultiplayerGameOverUI = jest.fn().mockImplementation(() => ({
            isVisible: jest.fn(() => false),
            hide: jest.fn(),
        }));

        // Mock the require calls
        jest.doMock('../../src/ui/LocalScoringUI.js', () => ({
            LocalScoringUI: MockLocalScoringUI,
        }));

        jest.doMock('../../src/ui/MultiplayerGameOverUI.js', () => ({
            MultiplayerGameOverUI: MockMultiplayerGameOverUI,
        }));

        // Clear module cache and re-require
        jest.resetModules();
        const { MultiplayerGameUI } = require('../../src/ui/MultiplayerGameUI.js');
        multiplayerGameUI = new MultiplayerGameUI(mockGame, mockScoreDisplay);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with correct default values', () => {
            expect(multiplayerGameUI.game).toBe(mockGame);
            expect(multiplayerGameUI.scoreDisplay).toBe(mockScoreDisplay);
            expect(multiplayerGameUI.localScoringUI).toBeNull();
            expect(multiplayerGameUI.multiplayerGameOverUI).toBeNull();
        });
    });

    describe('initializeMultiplayerUI', () => {
        it('should initialize local scoring UI', () => {
            multiplayerGameUI.initializeMultiplayerUI(mockMultiplayerGame);

            expect(MockLocalScoringUI).toHaveBeenCalledWith(mockLocalScoring);
            expect(multiplayerGameUI.localScoringUI).not.toBeNull();
        });

        it('should show scores after initialization', () => {
            multiplayerGameUI.initializeMultiplayerUI(mockMultiplayerGame);

            expect(multiplayerGameUI.localScoringUI.showScores).toHaveBeenCalled();
        });

        it('should not reinitialize if already exists', () => {
            multiplayerGameUI.initializeMultiplayerUI(mockMultiplayerGame);
            const firstInstance = multiplayerGameUI.localScoringUI;

            multiplayerGameUI.initializeMultiplayerUI(mockMultiplayerGame);

            expect(multiplayerGameUI.localScoringUI).toBe(firstInstance);
            expect(MockLocalScoringUI).toHaveBeenCalledTimes(1);
        });
    });

    describe('cleanupMultiplayerUI', () => {
        it('should hide scores when local scoring UI exists', () => {
            multiplayerGameUI.initializeMultiplayerUI(mockMultiplayerGame);

            multiplayerGameUI.cleanupMultiplayerUI();

            expect(multiplayerGameUI.localScoringUI.hideScores).toHaveBeenCalled();
        });

        it('should handle cleanup when local scoring UI is null', () => {
            expect(() => {
                multiplayerGameUI.cleanupMultiplayerUI();
            }).not.toThrow();
        });

        it('should hide multiplayer game over UI if visible', () => {
            multiplayerGameUI.multiplayerGameOverUI = new MockMultiplayerGameOverUI();
            multiplayerGameUI.multiplayerGameOverUI.isVisible.mockReturnValue(true);

            multiplayerGameUI.cleanupMultiplayerUI();

            expect(multiplayerGameUI.multiplayerGameOverUI.hide).toHaveBeenCalled();
        });

        it('should not hide multiplayer game over UI if not visible', () => {
            multiplayerGameUI.multiplayerGameOverUI = new MockMultiplayerGameOverUI();
            multiplayerGameUI.multiplayerGameOverUI.isVisible.mockReturnValue(false);

            multiplayerGameUI.cleanupMultiplayerUI();

            expect(multiplayerGameUI.multiplayerGameOverUI.hide).not.toHaveBeenCalled();
        });
    });

    describe('showMultiplayerGameOver', () => {
        it('should initialize multiplayer game over UI if not exists', () => {
            multiplayerGameUI.showMultiplayerGameOver();

            expect(MockMultiplayerGameOverUI).toHaveBeenCalled();
            expect(multiplayerGameUI.multiplayerGameOverUI).not.toBeNull();
        });

        it('should not reinitialize if already exists', () => {
            multiplayerGameUI.showMultiplayerGameOver();
            const firstInstance = multiplayerGameUI.multiplayerGameOverUI;

            multiplayerGameUI.showMultiplayerGameOver();

            expect(multiplayerGameUI.multiplayerGameOverUI).toBe(firstInstance);
            expect(MockMultiplayerGameOverUI).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateRemainingEntityDisplay', () => {
        it('should create remaining entities display element', () => {
            const survivingEntities = ['player', 'ai_1', 'ai_2'];

            multiplayerGameUI.updateRemainingEntityDisplay(survivingEntities);

            const display = document.getElementById('remaining-entities-display');
            expect(display).not.toBeNull();
            expect(display.className).toBe('remaining-entities-display');
        });

        it('should show correct count and breakdown for multiple entities', () => {
            const survivingEntities = ['player', 'ai_1', 'ai_2'];

            multiplayerGameUI.updateRemainingEntityDisplay(survivingEntities);

            const display = document.getElementById('remaining-entities-display');
            expect(display.innerHTML).toContain('Remaining: 3');
            expect(display.innerHTML).toContain('You');
            expect(display.innerHTML).toContain('2 AIs');
            expect(display.style.display).toBe('block');
        });

        it('should show player as dead when not in surviving entities', () => {
            const survivingEntities = ['ai_1', 'ai_2'];

            multiplayerGameUI.updateRemainingEntityDisplay(survivingEntities);

            const display = document.getElementById('remaining-entities-display');
            expect(display.innerHTML).toContain('player-status dead');
        });

        it('should show player as alive when in surviving entities', () => {
            const survivingEntities = ['player', 'ai_1'];

            multiplayerGameUI.updateRemainingEntityDisplay(survivingEntities);

            const display = document.getElementById('remaining-entities-display');
            expect(display.innerHTML).toContain('player-status alive');
        });

        it('should handle single AI correctly', () => {
            const survivingEntities = ['player', 'ai_1'];

            multiplayerGameUI.updateRemainingEntityDisplay(survivingEntities);

            const display = document.getElementById('remaining-entities-display');
            expect(display.innerHTML).toContain('1 AI');
            expect(display.innerHTML).not.toContain('1 AIs');
        });

        it('should hide display when only one entity remains', () => {
            const survivingEntities = ['player'];

            multiplayerGameUI.updateRemainingEntityDisplay(survivingEntities);

            const display = document.getElementById('remaining-entities-display');
            expect(display.style.display).toBe('none');
        });

        it('should reuse existing display element', () => {
            const survivingEntities1 = ['player', 'ai_1', 'ai_2'];
            const survivingEntities2 = ['player', 'ai_1'];

            multiplayerGameUI.updateRemainingEntityDisplay(survivingEntities1);
            const firstDisplay = document.getElementById('remaining-entities-display');

            multiplayerGameUI.updateRemainingEntityDisplay(survivingEntities2);
            const secondDisplay = document.getElementById('remaining-entities-display');

            expect(firstDisplay).toBe(secondDisplay);
            expect(secondDisplay.innerHTML).toContain('Remaining: 2');
        });
    });

    describe('addRemainingEntitiesStyles', () => {
        it('should add CSS styles to document head', () => {
            multiplayerGameUI.addRemainingEntitiesStyles();

            const styleElement = document.getElementById('remaining-entities-styles');
            expect(styleElement).not.toBeNull();
            expect(styleElement.tagName).toBe('STYLE');
            expect(styleElement.textContent).toContain('.remaining-entities-display');
        });

        it('should not add duplicate styles', () => {
            multiplayerGameUI.addRemainingEntitiesStyles();
            multiplayerGameUI.addRemainingEntitiesStyles();

            const styleElements = document.querySelectorAll('#remaining-entities-styles');
            expect(styleElements.length).toBe(1);
        });

        it('should include responsive styles', () => {
            multiplayerGameUI.addRemainingEntitiesStyles();

            const styleElement = document.getElementById('remaining-entities-styles');
            expect(styleElement.textContent).toContain('@media (max-width: 768px)');
        });
    });

    describe('hideRemainingEntitiesDisplay', () => {
        it('should hide existing display element', () => {
            // First create the display
            multiplayerGameUI.updateRemainingEntityDisplay(['player', 'ai_1']);
            const display = document.getElementById('remaining-entities-display');
            expect(display.style.display).toBe('block');

            multiplayerGameUI.hideRemainingEntitiesDisplay();

            expect(display.style.display).toBe('none');
        });

        it('should handle case when display element does not exist', () => {
            expect(() => {
                multiplayerGameUI.hideRemainingEntitiesDisplay();
            }).not.toThrow();
        });
    });

    describe('showMultiAIGameOver', () => {
        beforeEach(() => {
            // Create game over element
            const gameOverElement = document.createElement('div');
            gameOverElement.id = 'gameOver';
            document.body.appendChild(gameOverElement);
        });

        it('should display victory message when player wins', () => {
            mockGame.getGameState.mockReturnValue({
                playerScore: 5,
                aiScore: 3,
                highScore: 10,
                isNewHighScore: false,
                aiOpponents: [{ id: 'ai_1', alive: false }],
                roundsPlayed: 8,
            });

            multiplayerGameUI.showMultiAIGameOver();

            const gameOverElement = document.getElementById('gameOver');
            expect(gameOverElement.innerHTML).toContain('Victory!');
            expect(gameOverElement.innerHTML).toContain('victory');
        });

        it('should display defeat message when player loses', () => {
            mockGame.getGameState.mockReturnValue({
                playerScore: 2,
                aiScore: 5,
                highScore: 10,
                isNewHighScore: false,
                aiOpponents: [{ id: 'ai_1', alive: true }],
                roundsPlayed: 7,
            });

            multiplayerGameUI.showMultiAIGameOver();

            const gameOverElement = document.getElementById('gameOver');
            expect(gameOverElement.innerHTML).toContain('Defeated by');
            expect(gameOverElement.innerHTML).toContain('defeat');
        });

        it('should show new high score message when applicable', () => {
            mockGame.getGameState.mockReturnValue({
                playerScore: 15,
                aiScore: 3,
                highScore: 15,
                isNewHighScore: true,
                aiOpponents: [{ id: 'ai_1', alive: false }],
                roundsPlayed: 18,
            });

            multiplayerGameUI.showMultiAIGameOver();

            const gameOverElement = document.getElementById('gameOver');
            expect(gameOverElement.innerHTML).toContain('New High Score!');
        });

        it('should handle multiple AI opponents correctly', () => {
            mockGame.getGameState.mockReturnValue({
                playerScore: 5,
                aiScore: 3,
                highScore: 10,
                isNewHighScore: false,
                aiOpponents: [
                    { id: 'ai_1', alive: false },
                    { id: 'ai_2', alive: false },
                    { id: 'ai_3', alive: false },
                ],
                roundsPlayed: 8,
            });

            multiplayerGameUI.showMultiAIGameOver();

            const gameOverElement = document.getElementById('gameOver');
            expect(gameOverElement.innerHTML).toContain('3 AI opponents');
            expect(gameOverElement.innerHTML).toContain(
                'AI Opponents:</span>\n                            <span class="stat-value">3</span>'
            );
        });

        it('should handle fallback when no aiOpponents data', () => {
            mockGame.getGameState.mockReturnValue({
                playerScore: 5,
                aiScore: 3,
                highScore: 10,
                isNewHighScore: false,
                ai: { alive: false },
                roundsPlayed: 8,
            });

            multiplayerGameUI.showMultiAIGameOver();

            const gameOverElement = document.getElementById('gameOver');
            expect(gameOverElement.innerHTML).toContain('You defeated the AI!');
        });

        it('should display correct scores', () => {
            const gameState = {
                playerScore: 7,
                aiScore: 4,
                highScore: 12,
                isNewHighScore: false,
                aiOpponents: [{ id: 'ai_1', alive: false }],
                roundsPlayed: 11,
            };
            mockGame.getGameState.mockReturnValue(gameState);

            multiplayerGameUI.showMultiAIGameOver();

            const gameOverElement = document.getElementById('gameOver');
            expect(gameOverElement.innerHTML).toContain('7');
            expect(gameOverElement.innerHTML).toContain('4');
            expect(gameOverElement.innerHTML).toContain('12');
            expect(gameOverElement.innerHTML).toContain('11');
        });

        it('should call score display update', () => {
            const gameState = {
                playerScore: 7,
                aiScore: 4,
                highScore: 12,
                isNewHighScore: false,
                aiOpponents: [{ id: 'ai_1', alive: false }],
                roundsPlayed: 11,
            };
            mockGame.getGameState.mockReturnValue(gameState);

            multiplayerGameUI.showMultiAIGameOver();

            expect(mockScoreDisplay.showGameOverScores).toHaveBeenCalledWith(7, 4, 12, false);
        });

        it('should handle missing game over element', () => {
            document.getElementById('gameOver').remove();

            expect(() => {
                multiplayerGameUI.showMultiAIGameOver();
            }).not.toThrow();
        });

        it('should hide remaining entities display', () => {
            const hideDisplaySpy = jest.spyOn(multiplayerGameUI, 'hideRemainingEntitiesDisplay');

            multiplayerGameUI.showMultiAIGameOver();

            expect(hideDisplaySpy).toHaveBeenCalled();
        });
    });

    describe('addMultiAIGameOverStyles', () => {
        it('should add CSS styles to document head', () => {
            multiplayerGameUI.addMultiAIGameOverStyles();

            const styleElement = document.getElementById('multi-ai-game-over-styles');
            expect(styleElement).not.toBeNull();
            expect(styleElement.tagName).toBe('STYLE');
            expect(styleElement.textContent).toContain('.multi-ai-game-over');
        });

        it('should not add duplicate styles', () => {
            multiplayerGameUI.addMultiAIGameOverStyles();
            multiplayerGameUI.addMultiAIGameOverStyles();

            const styleElements = document.querySelectorAll('#multi-ai-game-over-styles');
            expect(styleElements.length).toBe(1);
        });

        it('should include victory and defeat styles', () => {
            multiplayerGameUI.addMultiAIGameOverStyles();

            const styleElement = document.getElementById('multi-ai-game-over-styles');
            expect(styleElement.textContent).toContain('.victory');
            expect(styleElement.textContent).toContain('.defeat');
        });

        it('should include animation keyframes', () => {
            multiplayerGameUI.addMultiAIGameOverStyles();

            const styleElement = document.getElementById('multi-ai-game-over-styles');
            expect(styleElement.textContent).toContain('@keyframes highScoreGlow');
        });

        it('should include responsive styles', () => {
            multiplayerGameUI.addMultiAIGameOverStyles();

            const styleElement = document.getElementById('multi-ai-game-over-styles');
            expect(styleElement.textContent).toContain('@media (max-width: 768px)');
        });
    });

    describe('integration scenarios', () => {
        it('should handle complete multiplayer game flow', () => {
            // Initialize
            multiplayerGameUI.initializeMultiplayerUI(mockMultiplayerGame);
            expect(multiplayerGameUI.localScoringUI).not.toBeNull();

            // Update during gameplay
            multiplayerGameUI.updateRemainingEntityDisplay(['player', 'ai_1', 'ai_2']);
            const display = document.getElementById('remaining-entities-display');
            expect(display.style.display).toBe('block');

            // Show game over
            const gameOverElement = document.createElement('div');
            gameOverElement.id = 'gameOver';
            document.body.appendChild(gameOverElement);

            multiplayerGameUI.showMultiAIGameOver();
            expect(gameOverElement.innerHTML).toContain('Victory!');

            // Cleanup
            multiplayerGameUI.cleanupMultiplayerUI();
            expect(multiplayerGameUI.localScoringUI.hideScores).toHaveBeenCalled();
        });

        it('should handle edge case with no surviving entities', () => {
            expect(() => {
                multiplayerGameUI.updateRemainingEntityDisplay([]);
            }).not.toThrow();

            const display = document.getElementById('remaining-entities-display');
            expect(display.style.display).toBe('none');
        });

        it('should handle game state without score display', () => {
            multiplayerGameUI.scoreDisplay = null;

            expect(() => {
                multiplayerGameUI.showMultiAIGameOver();
            }).not.toThrow();
        });
    });

    describe('error handling', () => {
        it('should handle DOM manipulation errors gracefully', () => {
            const originalCreateElement = document.createElement;
            document.createElement = jest.fn(() => {
                throw new Error('DOM error');
            });

            expect(() => {
                multiplayerGameUI.updateRemainingEntityDisplay(['player', 'ai_1']);
            }).toThrow();

            document.createElement = originalCreateElement;
        });

        it('should handle missing dependencies gracefully', () => {
            multiplayerGameUI.game = null;

            expect(() => {
                multiplayerGameUI.showMultiAIGameOver();
            }).toThrow();
        });
    });
});
