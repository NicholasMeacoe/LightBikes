/**
 * Integration tests for difficulty selection UI event handling
 * Tests the interaction between difficulty buttons and DifficultyManager
 */

const { DifficultyManager } = require('./difficulty.js');

describe('Difficulty UI Integration', () => {
    let mockGame;
    let mockAI;
    let difficultyManager;
    let mockButtons;
    let mockDocument;

    beforeEach(() => {
        // Mock DOM elements
        mockButtons = {
            easy: {
                getAttribute: jest.fn(() => 'easy'),
                classList: {
                    add: jest.fn(),
                    remove: jest.fn(),
                    contains: jest.fn()
                },
                addEventListener: jest.fn(),
                click: jest.fn()
            },
            medium: {
                getAttribute: jest.fn(() => 'medium'),
                classList: {
                    add: jest.fn(),
                    remove: jest.fn(),
                    contains: jest.fn(() => true) // Initially active
                },
                addEventListener: jest.fn(),
                click: jest.fn()
            },
            hard: {
                getAttribute: jest.fn(() => 'hard'),
                classList: {
                    add: jest.fn(),
                    remove: jest.fn(),
                    contains: jest.fn()
                },
                addEventListener: jest.fn(),
                click: jest.fn()
            }
        };

        mockDocument = {
            querySelectorAll: jest.fn((selector) => {
                if (selector === '.difficulty-btn') {
                    return [mockButtons.easy, mockButtons.medium, mockButtons.hard];
                }
                return [];
            }),
            querySelector: jest.fn((selector) => {
                if (selector === '[data-level="easy"]') return mockButtons.easy;
                if (selector === '[data-level="medium"]') return mockButtons.medium;
                if (selector === '[data-level="hard"]') return mockButtons.hard;
                return null;
            })
        };

        global.document = mockDocument;

        // Mock localStorage
        const localStorageMock = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn()
        };
        global.localStorage = localStorageMock;

        // Create mock game and AI objects
        mockGame = {
            setGameSpeed: jest.fn()
        };

        mockAI = {
            difficultyConfig: null
        };

        // Create DifficultyManager instance
        difficultyManager = new DifficultyManager(mockGame, mockAI);
    });

    afterEach(() => {
        delete global.document;
        delete global.localStorage;
    });

    describe('Difficulty Button Event Handling', () => {
        let updateDifficultyUI;

        beforeEach(() => {
            // Define updateDifficultyUI function (from script.js)
            updateDifficultyUI = () => {
                const currentDifficulty = difficultyManager.getCurrentDifficulty();
                const buttons = document.querySelectorAll('.difficulty-btn');
                
                buttons.forEach(button => {
                    const buttonLevel = button.getAttribute('data-level');
                    if (buttonLevel === currentDifficulty) {
                        button.classList.add('active');
                    } else {
                        button.classList.remove('active');
                    }
                });
            };
        });

        it('should update DifficultyManager when easy button is clicked', () => {
            // Simulate the click event handler logic
            const selectedLevel = 'easy';
            difficultyManager.setDifficulty(selectedLevel);
            updateDifficultyUI();
            
            // Verify DifficultyManager was updated
            expect(difficultyManager.getCurrentDifficulty()).toBe('easy');
            expect(mockGame.setGameSpeed).toHaveBeenCalledWith(0.08);
            expect(mockAI.difficultyConfig.turnThreshold).toBe(15);
            expect(mockAI.difficultyConfig.randomTurnChance).toBe(0.05);
        });

        it('should update DifficultyManager when hard button is clicked', () => {
            // Simulate the click event handler logic
            const selectedLevel = 'hard';
            difficultyManager.setDifficulty(selectedLevel);
            updateDifficultyUI();
            
            // Verify DifficultyManager was updated
            expect(difficultyManager.getCurrentDifficulty()).toBe('hard');
            expect(mockGame.setGameSpeed).toHaveBeenCalledWith(0.12);
            expect(mockAI.difficultyConfig.turnThreshold).toBe(8);
            expect(mockAI.difficultyConfig.randomTurnChance).toBe(0.01);
        });

        it('should update UI to show new selection state', () => {
            // Simulate clicking easy button
            difficultyManager.setDifficulty('easy');
            updateDifficultyUI();
            
            // Verify UI calls were made correctly for easy selection
            expect(mockButtons.easy.classList.add).toHaveBeenCalledWith('active');
            expect(mockButtons.medium.classList.remove).toHaveBeenCalledWith('active');
            expect(mockButtons.hard.classList.remove).toHaveBeenCalledWith('active');
            
            // Reset mocks
            Object.values(mockButtons).forEach(button => {
                button.classList.add.mockClear();
                button.classList.remove.mockClear();
            });
            
            // Simulate clicking hard button
            difficultyManager.setDifficulty('hard');
            updateDifficultyUI();
            
            // Verify UI calls were made correctly for hard selection
            expect(mockButtons.hard.classList.add).toHaveBeenCalledWith('active');
            expect(mockButtons.easy.classList.remove).toHaveBeenCalledWith('active');
            expect(mockButtons.medium.classList.remove).toHaveBeenCalledWith('active');
        });

        it('should apply changes immediately to game and AI systems', () => {
            // Clear previous calls
            mockGame.setGameSpeed.mockClear();
            
            // Simulate clicking hard button
            difficultyManager.setDifficulty('hard');
            
            // Verify immediate application to game system
            expect(mockGame.setGameSpeed).toHaveBeenCalledWith(0.12);
            
            // Verify immediate application to AI system
            expect(mockAI.difficultyConfig).toEqual({
                turnThreshold: 8,
                randomTurnChance: 0.01,
                gameSpeed: 0.12,
                description: "Faster AI, more challenging gameplay"
            });
        });

        it('should save difficulty selection to localStorage', () => {
            // Simulate clicking easy button
            difficultyManager.setDifficulty('easy');
            
            // Verify localStorage was called
            expect(localStorage.setItem).toHaveBeenCalledWith(
                'lightbikes_difficulty',
                expect.stringContaining('"selectedDifficulty":"easy"')
            );
        });

        it('should handle multiple rapid clicks correctly', () => {
            // Simulate rapid clicks
            difficultyManager.setDifficulty('easy');
            difficultyManager.setDifficulty('hard');
            difficultyManager.setDifficulty('medium');
            updateDifficultyUI();
            
            // Should end up with medium difficulty
            expect(difficultyManager.getCurrentDifficulty()).toBe('medium');
            expect(mockButtons.medium.classList.add).toHaveBeenCalledWith('active');
            expect(mockButtons.easy.classList.remove).toHaveBeenCalledWith('active');
            expect(mockButtons.hard.classList.remove).toHaveBeenCalledWith('active');
        });
    });

    describe('UI Initialization', () => {
        it('should initialize UI based on current difficulty selection', () => {
            // Set difficulty to hard programmatically
            difficultyManager.setDifficulty('hard');
            
            // Define and call updateDifficultyUI function
            const updateDifficultyUI = () => {
                const currentDifficulty = difficultyManager.getCurrentDifficulty();
                const buttons = document.querySelectorAll('.difficulty-btn');
                
                buttons.forEach(button => {
                    const buttonLevel = button.getAttribute('data-level');
                    if (buttonLevel === currentDifficulty) {
                        button.classList.add('active');
                    } else {
                        button.classList.remove('active');
                    }
                });
            };
            
            updateDifficultyUI();
            
            // Verify UI calls were made correctly
            expect(mockButtons.hard.classList.add).toHaveBeenCalledWith('active');
            expect(mockButtons.easy.classList.remove).toHaveBeenCalledWith('active');
            expect(mockButtons.medium.classList.remove).toHaveBeenCalledWith('active');
        });
    });
});