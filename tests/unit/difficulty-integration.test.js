/**
 * Integration tests for DifficultyManager with game systems
 * Tests the integration between DifficultyManager, Game, and AIController
 */

const { Game } = require('@/core/game.js');
const { AIController } = require('@/core/ai.js');
const { DifficultyManager } = require('@/systems/difficulty.js');

describe('DifficultyManager Integration', () => {
    let game;
    let aiController;
    let difficultyManager;

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        
        // Initialize components
        game = new Game();
        aiController = new AIController();
        difficultyManager = new DifficultyManager(game, aiController);
    });

    describe('initialization', () => {
        it('should apply default medium difficulty to game systems', () => {
            expect(game.gameSpeed).toBe(0.1); // Medium speed
            expect(difficultyManager.getCurrentDifficulty()).toBe('medium');
        });

        it('should load saved difficulty from localStorage', () => {
            // Save a difficulty setting
            localStorage.setItem('lightbikes_difficulty', JSON.stringify({
                selectedDifficulty: 'hard',
                timestamp: Date.now()
            }));

            // Create new game and manager to test loading
            const newGame = new Game();
            const newAI = new AIController();
            const newManager = new DifficultyManager(newGame, newAI);
            expect(newManager.getCurrentDifficulty()).toBe('hard');
            expect(newGame.gameSpeed).toBe(0.12); // Hard speed
        });
    });

    describe('difficulty changes', () => {
        it('should immediately apply easy difficulty to game speed', () => {
            difficultyManager.setDifficulty('easy');
            
            expect(game.gameSpeed).toBe(0.08);
            expect(difficultyManager.getCurrentDifficulty()).toBe('easy');
        });

        it('should immediately apply hard difficulty to game speed', () => {
            difficultyManager.setDifficulty('hard');
            
            expect(game.gameSpeed).toBe(0.12);
            expect(difficultyManager.getCurrentDifficulty()).toBe('hard');
        });

        it('should apply difficulty config to AI controller', () => {
            difficultyManager.setDifficulty('easy');
            
            const config = difficultyManager.getDifficultyConfig();
            expect(aiController.difficultyConfig).toEqual(config);
            expect(aiController.difficultyConfig.turnThreshold).toBe(15);
            expect(aiController.difficultyConfig.randomTurnChance).toBe(0.05);
        });
    });

    describe('AI integration', () => {
        it('should use difficulty config in AI calculations', () => {
            // Set to easy difficulty
            difficultyManager.setDifficulty('easy');
            
            // Create a game state
            const gameState = {
                ai: { x: 0, z: 0 },
                player: { x: 10, z: 0 },
                playerTrail: [],
                aiTrail: [],
                bounds: 30,
                aiDirection: { x: 1, z: 0 },
                isPaused: false
            };

            // Get difficulty config and call AI with it
            const config = difficultyManager.getDifficultyConfig();
            const result = aiController.calculateAIDirection(gameState, config);
            
            // Verify AI received the config (this tests the integration pattern)
            expect(result).toHaveProperty('newDirection');
            expect(result).toHaveProperty('newState');
        });

        it('should handle different difficulty configs in AI', () => {
            // Test with hard difficulty
            difficultyManager.setDifficulty('hard');
            
            const gameState = {
                ai: { x: 0, z: 0 },
                player: { x: 10, z: 0 },
                playerTrail: [],
                aiTrail: [],
                bounds: 30,
                aiDirection: { x: 1, z: 0 },
                isPaused: false
            };

            const hardConfig = difficultyManager.getDifficultyConfig();
            expect(hardConfig.turnThreshold).toBe(8);
            expect(hardConfig.randomTurnChance).toBe(0.01);
            
            const result = aiController.calculateAIDirection(gameState, hardConfig);
            expect(result).toHaveProperty('newDirection');
        });
    });

    describe('persistence integration', () => {
        it('should persist difficulty changes to localStorage', () => {
            difficultyManager.setDifficulty('hard');
            
            const stored = localStorage.getItem('lightbikes_difficulty');
            const data = JSON.parse(stored);
            
            expect(data.selectedDifficulty).toBe('hard');
            expect(data.timestamp).toBeGreaterThan(0);
        });

        it('should handle localStorage errors gracefully', () => {
            // Mock localStorage to throw an error
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = jest.fn(() => {
                throw new Error('Storage error');
            });

            // Should not throw an error
            expect(() => {
                difficultyManager.setDifficulty('easy');
            }).not.toThrow();

            // Game speed should still be updated
            expect(game.gameSpeed).toBe(0.08);

            // Restore original localStorage
            localStorage.setItem = originalSetItem;
        });
    });

    describe('error handling', () => {
        it('should handle invalid difficulty levels gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            difficultyManager.setDifficulty('invalid');
            
            expect(consoleSpy).toHaveBeenCalledWith('Invalid difficulty level: "invalid", using medium. Valid options: easy, medium, hard');
            expect(difficultyManager.getCurrentDifficulty()).toBe('medium');
            expect(game.gameSpeed).toBe(0.1);
            
            consoleSpy.mockRestore();
        });

        it('should handle missing game reference gracefully', () => {
            const managerWithoutGame = new DifficultyManager(null, aiController);
            
            expect(() => {
                managerWithoutGame.setDifficulty('easy');
            }).not.toThrow();
        });

        it('should handle missing AI controller gracefully', () => {
            const managerWithoutAI = new DifficultyManager(game, null);
            
            expect(() => {
                managerWithoutAI.setDifficulty('easy');
            }).not.toThrow();
        });
    });

    describe('global availability', () => {
        it('should be available globally when integrated in script.js', () => {
            // Simulate the global assignment from script.js
            window.difficultyManager = difficultyManager;
            
            expect(window.difficultyManager).toBeDefined();
            expect(window.difficultyManager.getCurrentDifficulty()).toBe('medium');
            
            // Test that global instance works
            window.difficultyManager.setDifficulty('hard');
            expect(game.gameSpeed).toBe(0.12);
        });
    });
});