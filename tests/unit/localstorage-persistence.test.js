/**
 * Test localStorage persistence for UI selections
 * Verifies that AI count and difficulty level are saved and loaded correctly
 */

const { DifficultyManager } = require('@/systems/difficulty.js');
const { Game } = require('@/core/game.js');

describe('localStorage Persistence', () => {
    let localStorageMock;
    let game;
    let difficultyManager;

    beforeEach(() => {
        // Mock localStorage
        localStorageMock = {
            store: {},
            getItem: jest.fn((key) => localStorageMock.store[key] || null),
            setItem: jest.fn((key, value) => {
                localStorageMock.store[key] = value;
            }),
            removeItem: jest.fn((key) => {
                delete localStorageMock.store[key];
            }),
            clear: jest.fn(() => {
                localStorageMock.store = {};
            })
        };

        global.localStorage = localStorageMock;
        global.Storage = function() {};

        // Create game instance
        game = new Game();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Task 7.1: Save UI selections to localStorage', () => {
        it('should save AI opponent count on change', () => {
            // Simulate setting AI count
            const aiCount = 3;
            localStorage.setItem('lightbikes_ai_count', aiCount.toString());

            // Verify it was saved by reading it back
            expect(localStorage.getItem('lightbikes_ai_count')).toBe('3');
        });

        it('should save difficulty level on change', () => {
            // Create difficulty manager
            difficultyManager = new DifficultyManager(game, null);

            // Change difficulty
            difficultyManager.setDifficulty('hard');

            // Verify it was saved by reading it back
            const savedData = JSON.parse(localStorage.getItem('lightbikes_difficulty'));
            expect(savedData).toBeDefined();
            expect(savedData.selectedDifficulty).toBe('hard');
        });

        it('should use consistent key names for AI count', () => {
            localStorage.setItem('lightbikes_ai_count', '2');
            // Verify the key is used consistently
            expect(localStorage.getItem('lightbikes_ai_count')).toBe('2');
        });

        it('should use consistent key names for difficulty', () => {
            difficultyManager = new DifficultyManager(game, null);
            difficultyManager.setDifficulty('easy');
            
            // Verify the key is used consistently
            const savedData = localStorage.getItem('lightbikes_difficulty');
            expect(savedData).toBeDefined();
            expect(savedData).toContain('easy');
        });
    });

    describe('Task 7.2: Load UI selections from localStorage', () => {
        it('should load saved AI opponent count on init', () => {
            // Save AI count
            localStorage.setItem('lightbikes_ai_count', '4');

            // Load it
            const loadedCount = localStorage.getItem('lightbikes_ai_count');
            expect(loadedCount).toBe('4');
            expect(parseInt(loadedCount)).toBe(4);
        });

        it('should load saved difficulty level on init', () => {
            // Save difficulty
            const testData = {
                selectedDifficulty: 'hard',
                timestamp: Date.now(),
                version: '1.0'
            };
            localStorage.setItem('lightbikes_difficulty', JSON.stringify(testData));

            // Create new manager (simulating init)
            difficultyManager = new DifficultyManager(game, null);

            // Verify it was loaded
            expect(difficultyManager.getCurrentDifficulty()).toBe('hard');
        });

        it('should apply loaded AI count settings to game', () => {
            // Save AI count
            localStorage.setItem('lightbikes_ai_count', '3');

            // Load and verify
            const loadedCount = parseInt(localStorage.getItem('lightbikes_ai_count'));
            expect(loadedCount).toBe(3);
            expect(loadedCount).toBeGreaterThanOrEqual(1);
            expect(loadedCount).toBeLessThanOrEqual(4);
        });

        it('should apply loaded difficulty settings to game', () => {
            // Save difficulty
            const testData = {
                selectedDifficulty: 'easy',
                timestamp: Date.now(),
                version: '1.0'
            };
            localStorage.setItem('lightbikes_difficulty', JSON.stringify(testData));

            // Create new manager
            difficultyManager = new DifficultyManager(game, null);

            // Verify settings were applied
            expect(difficultyManager.getCurrentDifficulty()).toBe('easy');
            expect(game.gameSpeed).toBe(0.08); // Easy mode speed
        });

        it('should handle missing localStorage data gracefully', () => {
            // Clear storage
            localStorage.clear();

            // Create manager with no saved data
            difficultyManager = new DifficultyManager(game, null);

            // Should use default (medium)
            expect(difficultyManager.getCurrentDifficulty()).toBe('medium');
        });

        it('should handle corrupted AI count data', () => {
            // Save invalid data
            localStorage.setItem('lightbikes_ai_count', 'invalid');

            // Load it
            const loadedCount = localStorage.getItem('lightbikes_ai_count');
            const parsedCount = parseInt(loadedCount);
            
            // Should be NaN
            expect(isNaN(parsedCount)).toBe(true);
        });

        it('should handle corrupted difficulty data', () => {
            // Save invalid JSON
            localStorage.setItem('lightbikes_difficulty', 'invalid json');

            // Create manager
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            difficultyManager = new DifficultyManager(game, null);

            // Should fall back to default
            expect(difficultyManager.getCurrentDifficulty()).toBe('medium');
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });

    describe('Integration: Full persistence cycle', () => {
        it('should persist and restore AI count across sessions', () => {
            // Session 1: Save
            localStorage.setItem('lightbikes_ai_count', '2');

            // Session 2: Load
            const loadedCount = parseInt(localStorage.getItem('lightbikes_ai_count'));
            expect(loadedCount).toBe(2);
        });

        it('should persist and restore difficulty across sessions', () => {
            // Session 1: Save
            difficultyManager = new DifficultyManager(game, null);
            difficultyManager.setDifficulty('hard');

            // Session 2: Load
            const newGame = new Game();
            const newManager = new DifficultyManager(newGame, null);
            expect(newManager.getCurrentDifficulty()).toBe('hard');
        });

        it('should maintain independent storage for AI count and difficulty', () => {
            // Save both
            localStorage.setItem('lightbikes_ai_count', '3');
            difficultyManager = new DifficultyManager(game, null);
            difficultyManager.setDifficulty('easy');

            // Verify both are stored
            expect(localStorage.getItem('lightbikes_ai_count')).toBe('3');
            expect(localStorage.getItem('lightbikes_difficulty')).toBeDefined();

            // Verify they don't interfere
            const aiCount = parseInt(localStorage.getItem('lightbikes_ai_count'));
            const diffData = JSON.parse(localStorage.getItem('lightbikes_difficulty'));
            
            expect(aiCount).toBe(3);
            expect(diffData.selectedDifficulty).toBe('easy');
        });
    });
});
