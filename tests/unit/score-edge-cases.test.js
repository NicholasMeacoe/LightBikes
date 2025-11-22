/**
 * Edge case and error handling tests for the score tracking system
 * Tests localStorage unavailability, score corruption prevention, rapid operations,
 * display under various screen sizes, and performance impact
 */

const { ScoreManager } = require('@/systems/scoreManager.js');
const { ScorePersistence } = require('@/systems/scorePersistence.js');
const { ScoreDisplay } = require('@/ui/scoreDisplay.js');
const { Game } = require('@/core/game.js');

// Mock performance.now for performance testing
const mockPerformance = {
    now: jest.fn(() => Date.now())
};
global.performance = mockPerformance;

// Mock DOM environment with various screen sizes
const createMockElement = (overrides = {}) => ({
    style: {},
    textContent: '',
    id: '',
    className: '',
    appendChild: jest.fn(),
    parentNode: {
        removeChild: jest.fn()
    },
    getBoundingClientRect: jest.fn(() => ({
        top: 0,
        left: 0,
        width: 100,
        height: 50
    })),
    ...overrides
});

const createMockDocument = () => ({
    createElement: jest.fn(() => createMockElement()),
    body: { appendChild: jest.fn() },
    head: { appendChild: jest.fn() },
    getElementById: jest.fn(() => null)
});

const createMockWindow = (width = 1024, height = 768) => ({
    innerWidth: width,
    innerHeight: height,
    addEventListener: jest.fn()
});

describe('Score Tracking Edge Cases and Error Handling', () => {
    let originalLocalStorage;
    let originalDocument;
    let originalWindow;
    let mockLocalStorage;
    let mockDocument;
    let mockWindow;

    beforeEach(() => {
        // Store originals
        originalLocalStorage = global.localStorage;
        originalDocument = global.document;
        originalWindow = global.window;

        // Create fresh mocks
        mockLocalStorage = {
            store: {},
            getItem: function(key) { return this.store[key] || null; },
            setItem: function(key, value) { this.store[key] = value; },
            removeItem: function(key) { delete this.store[key]; },
            clear: function() { this.store = {}; }
        };
        mockDocument = createMockDocument();
        mockWindow = createMockWindow();

        // Set up globals
        global.localStorage = mockLocalStorage;
        global.document = mockDocument;
        global.window = mockWindow;

        // Clear any existing high score data
        if (originalLocalStorage && originalLocalStorage.removeItem) {
            try {
                originalLocalStorage.removeItem('lightbikes_high_score');
            } catch (e) {
                // Ignore errors during cleanup
            }
        }

        jest.clearAllMocks();
    });

    afterEach(() => {
        // Restore originals
        global.localStorage = originalLocalStorage;
        global.document = originalDocument;
        global.window = originalWindow;
    });

    describe('localStorage Unavailability Scenarios', () => {
        it('should handle localStorage being completely undefined', () => {
            global.localStorage = undefined;
            global.window = { localStorage: undefined };

            const scoreManager = new ScoreManager();
            expect(scoreManager.highScore).toBe(0);

            // Score operations should still work
            scoreManager.incrementPlayerScore();
            expect(scoreManager.playerScore).toBe(1);
            expect(scoreManager.highScore).toBe(1); // Updated in memory only
        });

        it('should handle localStorage throwing on access', () => {
            const throwingStorage = {
                get getItem() { throw new Error('Access denied'); },
                get setItem() { throw new Error('Access denied'); },
                get removeItem() { throw new Error('Access denied'); }
            };
            global.localStorage = throwingStorage;
            global.window = { localStorage: throwingStorage };

            expect(() => new ScoreManager()).not.toThrow();
            const scoreManager = new ScoreManager();
            expect(scoreManager.highScore).toBe(0);
        });

        it('should handle quota exceeded errors during save operations', () => {
            const quotaExceededStorage = {
                store: {},
                getItem: function(key) { return this.store[key] || null; },
                setItem: function(key, value) {
                    throw new DOMException('QuotaExceededError', 'QuotaExceededError');
                },
                removeItem: function(key) { delete this.store[key]; }
            };
            global.localStorage = quotaExceededStorage;
            global.window = { localStorage: quotaExceededStorage };

            const scoreManager = new ScoreManager();
            scoreManager.incrementPlayerScore();
            
            // Should still update in memory despite save failure
            expect(scoreManager.playerScore).toBe(1);
            expect(scoreManager.highScore).toBe(1);
        });

        it('should handle localStorage being disabled in private browsing', () => {
            const disabledStorage = {
                getItem: () => { throw new Error('localStorage is not available'); },
                setItem: () => { throw new Error('localStorage is not available'); },
                removeItem: () => { throw new Error('localStorage is not available'); }
            };
            global.localStorage = disabledStorage;
            global.window = { localStorage: disabledStorage };

            const game = new Game();
            
            // Game should initialize and work normally
            expect(game.scoreManager.highScore).toBe(0);
            game.handleRoundEnd({ playerCollided: false, aiCollided: true });
            expect(game.scoreManager.playerScore).toBe(1);
        });

        it('should handle intermittent localStorage failures', () => {
            let failureCount = 0;
            const intermittentStorage = {
                store: {},
                getItem: function(key) {
                    if (failureCount++ % 2 === 0) {
                        throw new Error('Intermittent failure');
                    }
                    return this.store[key] || null;
                },
                setItem: function(key, value) {
                    if (failureCount++ % 3 === 0) {
                        throw new Error('Intermittent failure');
                    }
                    this.store[key] = value;
                },
                removeItem: function(key) { delete this.store[key]; }
            };
            global.localStorage = intermittentStorage;
            global.window = { localStorage: intermittentStorage };

            const scoreManager = new ScoreManager();
            
            // Multiple operations should handle intermittent failures gracefully
            for (let i = 0; i < 10; i++) {
                scoreManager.incrementPlayerScore();
            }
            
            expect(scoreManager.playerScore).toBe(10);
            expect(scoreManager.highScore).toBe(10);
        });
    });

    describe('Score Corruption Prevention', () => {
        it('should handle corrupted localStorage data', () => {
            mockLocalStorage.clear();
            mockLocalStorage.store['lightbikes_high_score'] = 'corrupted_data';
            
            const scoreManager = new ScoreManager();
            expect(scoreManager.highScore).toBe(0);
            
            // The ScorePersistence.loadHighScore should have attempted cleanup
            // but since we're using a mock, we need to verify the behavior differently
            // The important thing is that the scoreManager got a valid default value
            expect(typeof scoreManager.highScore).toBe('number');
            expect(scoreManager.highScore).toBeGreaterThanOrEqual(0);
        });

        it('should handle extremely large numbers in storage', () => {
            mockLocalStorage.clear();
            mockLocalStorage.store['lightbikes_high_score'] = '999999999999999';
            
            const scoreManager = new ScoreManager();
            expect(scoreManager.highScore).toBe(0);
        });

        it('should handle negative numbers in storage', () => {
            mockLocalStorage.clear();
            mockLocalStorage.store['lightbikes_high_score'] = '-100';
            
            const scoreManager = new ScoreManager();
            expect(scoreManager.highScore).toBe(0);
        });

        it('should handle floating point numbers in storage', () => {
            mockLocalStorage.clear();
            mockLocalStorage.store['lightbikes_high_score'] = '123.456';
            
            const scoreManager = new ScoreManager();
            expect(scoreManager.highScore).toBe(0);
        });

        it('should handle JSON objects in storage', () => {
            mockLocalStorage.clear();
            mockLocalStorage.store['lightbikes_high_score'] = '{"score": 100}';
            
            const scoreManager = new ScoreManager();
            expect(scoreManager.highScore).toBe(0);
        });

        it('should handle empty string in storage', () => {
            mockLocalStorage.clear();
            mockLocalStorage.store['lightbikes_high_score'] = '';
            
            const scoreManager = new ScoreManager();
            expect(scoreManager.highScore).toBe(0);
        });

        it('should handle special values in storage', () => {
            const specialValues = ['NaN', 'Infinity', '-Infinity', 'undefined', 'null'];
            
            specialValues.forEach(value => {
                mockLocalStorage.clear();
                mockLocalStorage.store['lightbikes_high_score'] = value;
                const scoreManager = new ScoreManager();
                expect(scoreManager.highScore).toBe(0);
            });
        });

        it('should prevent score overflow attacks', () => {
            // Clear any existing high score first
            mockLocalStorage.clear();
            const scoreManager = new ScoreManager();
            
            // The ScoreManager.setHighScore only validates type and >= 0
            // The MAX_SCORE_VALUE validation happens in ScorePersistence
            // Test that ScorePersistence rejects invalid values
            expect(ScorePersistence.isValidScore(Number.MAX_SAFE_INTEGER)).toBe(false);
            expect(ScorePersistence.isValidScore(1000000)).toBe(false);
            expect(ScorePersistence.isValidScore(999999)).toBe(true);
            
            // Test that saveHighScore rejects invalid values
            expect(ScorePersistence.saveHighScore(Number.MAX_SAFE_INTEGER)).toBe(false);
            expect(ScorePersistence.saveHighScore(1000000)).toBe(false);
            expect(ScorePersistence.saveHighScore(999999)).toBe(true);
        });
    });

    describe('Multiple Rapid Restart Operations', () => {
        it('should handle rapid game restarts without corruption', () => {
            mockLocalStorage.clear();
            const game = new Game();
            
            // Set up initial score
            game.handleRoundEnd({ playerCollided: false, aiCollided: true });
            game.handleRoundEnd({ playerCollided: false, aiCollided: true });
            expect(game.scoreManager.highScore).toBe(2);
            
            // Perform rapid restarts
            for (let i = 0; i < 100; i++) {
                game.restart();
                expect(game.scoreManager.playerScore).toBe(0);
                expect(game.scoreManager.aiScore).toBe(0);
                expect(game.scoreManager.highScore).toBe(2); // Should be preserved
            }
        });

        it('should handle rapid score updates without corruption', () => {
            const scoreManager = new ScoreManager();
            
            // Rapid player score increments
            for (let i = 0; i < 1000; i++) {
                scoreManager.incrementPlayerScore();
            }
            
            expect(scoreManager.playerScore).toBe(1000);
            expect(scoreManager.highScore).toBe(1000);
            
            // Rapid resets
            for (let i = 0; i < 100; i++) {
                scoreManager.resetCurrentScores();
                expect(scoreManager.playerScore).toBe(0);
                expect(scoreManager.aiScore).toBe(0);
                expect(scoreManager.highScore).toBe(1000);
            }
        });

        it('should handle concurrent score operations', () => {
            mockLocalStorage.clear();
            const scoreManager = new ScoreManager();
            
            // Simulate concurrent operations
            const operations = [];
            for (let i = 0; i < 50; i++) {
                operations.push(() => scoreManager.incrementPlayerScore());
                operations.push(() => scoreManager.incrementAIScore());
                operations.push(() => scoreManager.getScoreState());
            }
            
            // Execute all operations
            operations.forEach(op => op());
            
            expect(scoreManager.playerScore).toBe(50);
            expect(scoreManager.aiScore).toBe(50);
            expect(scoreManager.highScore).toBe(50);
        });

        it('should handle rapid display updates during score changes', () => {
            const mockRenderer = { renderer: { domElement: createMockElement() } };
            const scoreDisplay = new ScoreDisplay(mockRenderer);
            
            // Rapid display updates
            for (let i = 0; i < 100; i++) {
                scoreDisplay.updateGameplayScores(i, i % 2);
                expect(scoreDisplay.scoreElements.playerScore.textContent).toBe(`Player: ${i}`);
            }
            
            scoreDisplay.destroy();
        });

        it('should handle multiple game instances without interference', () => {
            // Clear any existing high score
            ScorePersistence.clearHighScore();
            
            const games = [];
            for (let i = 0; i < 10; i++) {
                games.push(new Game());
            }
            
            // Each game should start with clean state
            games.forEach(game => {
                expect(game.scoreManager.playerScore).toBe(0);
                expect(game.scoreManager.aiScore).toBe(0);
                expect(game.scoreManager.highScore).toBe(0);
            });
            
            // Score in one game shouldn't affect others
            games[0].handleRoundEnd({ playerCollided: false, aiCollided: true });
            games[0].handleRoundEnd({ playerCollided: false, aiCollided: true });
            
            expect(games[0].scoreManager.playerScore).toBe(2);
            expect(games[0].scoreManager.highScore).toBe(2);
            
            // Other games should see the updated high score
            const newGame = new Game();
            expect(newGame.scoreManager.highScore).toBe(2);
            expect(newGame.scoreManager.playerScore).toBe(0);
        });
    });

    describe('Score Display Under Various Screen Sizes', () => {
        it('should handle very small screen sizes', () => {
            global.window = createMockWindow(320, 480);
            const mockRenderer = { renderer: { domElement: createMockElement() } };
            const scoreDisplay = new ScoreDisplay(mockRenderer);
            
            scoreDisplay.updateGameplayScores(5, 3);
            expect(scoreDisplay.scoreElements.playerScore.textContent).toBe('Player: 5');
            expect(scoreDisplay.scoreElements.aiScore.textContent).toBe('AI: 3');
            
            scoreDisplay.destroy();
        });

        it('should handle very large screen sizes', () => {
            global.window = createMockWindow(2560, 1440);
            const mockRenderer = { renderer: { domElement: createMockElement() } };
            const scoreDisplay = new ScoreDisplay(mockRenderer);
            
            scoreDisplay.updateGameplayScores(10, 8);
            expect(scoreDisplay.scoreElements.playerScore.textContent).toBe('Player: 10');
            expect(scoreDisplay.scoreElements.aiScore.textContent).toBe('AI: 8');
            
            scoreDisplay.destroy();
        });

        it('should handle extreme aspect ratios', () => {
            // Very wide screen
            global.window = createMockWindow(3440, 1440);
            let mockRenderer = { renderer: { domElement: createMockElement() } };
            let scoreDisplay = new ScoreDisplay(mockRenderer);
            
            scoreDisplay.updateGameplayScores(7, 2);
            expect(scoreDisplay.scoreElements.playerScore.textContent).toBe('Player: 7');
            scoreDisplay.destroy();
            
            // Very tall screen
            global.window = createMockWindow(768, 1366);
            mockRenderer = { renderer: { domElement: createMockElement() } };
            scoreDisplay = new ScoreDisplay(mockRenderer);
            
            scoreDisplay.updateGameplayScores(3, 9);
            expect(scoreDisplay.scoreElements.aiScore.textContent).toBe('AI: 9');
            scoreDisplay.destroy();
        });

        it('should handle screen size changes during gameplay', () => {
            global.window = createMockWindow(1024, 768);
            const mockRenderer = { renderer: { domElement: createMockElement() } };
            const scoreDisplay = new ScoreDisplay(mockRenderer);
            
            scoreDisplay.updateGameplayScores(4, 6);
            
            // Simulate screen resize
            global.window.innerWidth = 480;
            global.window.innerHeight = 320;
            scoreDisplay.positionScoreElements();
            
            // Should still display correctly
            expect(scoreDisplay.scoreElements.playerScore.textContent).toBe('Player: 4');
            expect(scoreDisplay.scoreElements.aiScore.textContent).toBe('AI: 6');
            
            scoreDisplay.destroy();
        });

        it('should handle touch control interference', () => {
            global.window = createMockWindow(768, 1024);
            
            // Mock touch controls element
            const touchControls = createMockElement({
                getBoundingClientRect: () => ({
                    top: 200,
                    left: 500,
                    width: 200,
                    height: 200
                })
            });
            mockDocument.getElementById.mockImplementation(id => 
                id === 'controls' ? touchControls : null
            );
            
            const mockRenderer = { renderer: { domElement: createMockElement() } };
            const scoreDisplay = new ScoreDisplay(mockRenderer);
            
            scoreDisplay.updateGameplayScores(1, 1);
            scoreDisplay.positionScoreElements();
            
            // Should handle positioning without errors
            expect(scoreDisplay.scoreElements.playerScore.textContent).toBe('Player: 1');
            
            scoreDisplay.destroy();
        });

        it('should handle missing DOM elements gracefully', () => {
            mockDocument.createElement.mockReturnValue(null);
            
            const mockRenderer = { renderer: { domElement: createMockElement() } };
            expect(() => new ScoreDisplay(mockRenderer)).not.toThrow();
        });

        it('should handle DOM manipulation failures', () => {
            const failingElement = createMockElement({
                appendChild: jest.fn(() => { throw new Error('DOM error'); })
            });
            mockDocument.body = failingElement;
            
            const mockRenderer = { renderer: { domElement: createMockElement() } };
            expect(() => new ScoreDisplay(mockRenderer)).not.toThrow();
        });
    });

    describe('Performance Impact on Game Loop', () => {
        it('should complete score updates within performance budget', () => {
            mockLocalStorage.clear();
            const startTime = performance.now();
            const scoreManager = new ScoreManager();
            
            // Perform many score operations
            for (let i = 0; i < 1000; i++) {
                scoreManager.incrementPlayerScore();
                scoreManager.getScoreState();
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // Should complete quickly (less than 50ms for 1000 operations - more realistic for CI)
            expect(duration).toBeLessThan(50);
        });

        it('should handle display updates efficiently', () => {
            const mockRenderer = { renderer: { domElement: createMockElement() } };
            const scoreDisplay = new ScoreDisplay(mockRenderer);
            
            const startTime = performance.now();
            
            // Perform many display updates
            for (let i = 0; i < 100; i++) {
                scoreDisplay.updateGameplayScores(i, i % 10);
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // Should complete quickly (less than 50ms for 100 updates)
            expect(duration).toBeLessThan(50);
            
            scoreDisplay.destroy();
        });

        it('should handle persistence operations without blocking', () => {
            const startTime = performance.now();
            
            // Perform many persistence operations
            for (let i = 0; i < 100; i++) {
                ScorePersistence.saveHighScore(i);
                ScorePersistence.loadHighScore();
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // Should complete quickly (less than 20ms for 100 operations)
            expect(duration).toBeLessThan(20);
        });

        it('should maintain performance under memory pressure', () => {
            const games = [];
            const displays = [];
            
            const startTime = performance.now();
            
            // Create many game instances to simulate memory pressure
            for (let i = 0; i < 50; i++) {
                const game = new Game();
                const mockRenderer = { renderer: { domElement: createMockElement() } };
                const display = new ScoreDisplay(mockRenderer);
                
                games.push(game);
                displays.push(display);
                
                // Perform operations on each
                game.handleRoundEnd({ playerCollided: false, aiCollided: true });
                display.updateGameplayScores(1, 0);
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // Should complete within reasonable time (less than 100ms)
            expect(duration).toBeLessThan(100);
            
            // Clean up
            displays.forEach(display => display.destroy());
        });

        it('should handle rapid game state changes efficiently', () => {
            const game = new Game();
            const mockRenderer = { renderer: { domElement: createMockElement() } };
            const scoreDisplay = new ScoreDisplay(mockRenderer);
            
            const startTime = performance.now();
            
            // Simulate rapid game state changes
            for (let i = 0; i < 200; i++) {
                game.handleRoundEnd({ playerCollided: false, aiCollided: true });
                const state = game.scoreManager.getScoreState();
                scoreDisplay.updateGameplayScores(state.playerScore, state.aiScore);
                
                if (i % 10 === 0) {
                    game.restart();
                }
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // Should complete within reasonable time (less than 100ms)
            expect(duration).toBeLessThan(100);
            
            scoreDisplay.destroy();
        });
    });

    describe('Memory Management and Cleanup', () => {
        it('should properly clean up score display resources', () => {
            const mockRenderer = { renderer: { domElement: createMockElement() } };
            const scoreDisplay = new ScoreDisplay(mockRenderer);
            
            // Verify elements are created
            expect(scoreDisplay.isInitialized).toBe(true);
            expect(Object.keys(scoreDisplay.scoreElements).length).toBeGreaterThan(0);
            
            // Clean up
            scoreDisplay.destroy();
            
            // Verify cleanup
            expect(scoreDisplay.isInitialized).toBe(false);
            expect(Object.keys(scoreDisplay.scoreElements).length).toBe(0);
        });

        it('should handle multiple destroy calls gracefully', () => {
            const mockRenderer = { renderer: { domElement: createMockElement() } };
            const scoreDisplay = new ScoreDisplay(mockRenderer);
            
            // Multiple destroy calls should not throw
            expect(() => {
                scoreDisplay.destroy();
                scoreDisplay.destroy();
                scoreDisplay.destroy();
            }).not.toThrow();
        });

        it('should prevent memory leaks in long-running sessions', () => {
            mockLocalStorage.clear();
            const initialMemoryUsage = process.memoryUsage().heapUsed;
            
            // Simulate long-running session (reduced iterations for CI)
            for (let session = 0; session < 50; session++) {
                const game = new Game();
                const mockRenderer = { renderer: { domElement: createMockElement() } };
                const scoreDisplay = new ScoreDisplay(mockRenderer);
                
                // Perform operations
                for (let i = 0; i < 5; i++) {
                    game.handleRoundEnd({ playerCollided: false, aiCollided: true });
                    const state = game.scoreManager.getScoreState();
                    scoreDisplay.updateGameplayScores(state.playerScore, state.aiScore);
                }
                
                // Clean up
                scoreDisplay.destroy();
            }
            
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }
            
            const finalMemoryUsage = process.memoryUsage().heapUsed;
            const memoryIncrease = finalMemoryUsage - initialMemoryUsage;
            
            // Memory increase should be reasonable (less than 50MB for CI environment)
            expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
        });
    });

    describe('Error Recovery and Resilience', () => {
        it('should recover from temporary localStorage failures', () => {
            let failureMode = true;
            const recoveringStorage = {
                store: {},
                getItem: function(key) {
                    if (failureMode) throw new Error('Temporary failure');
                    return this.store[key] || null;
                },
                setItem: function(key, value) {
                    if (failureMode) throw new Error('Temporary failure');
                    this.store[key] = value;
                },
                removeItem: function(key) { delete this.store[key]; }
            };
            global.localStorage = recoveringStorage;
            global.window = { localStorage: recoveringStorage };
            
            const scoreManager = new ScoreManager();
            expect(scoreManager.highScore).toBe(0);
            
            // Score operations should work despite storage failure
            scoreManager.incrementPlayerScore();
            expect(scoreManager.playerScore).toBe(1);
            
            // Recovery - storage becomes available
            failureMode = false;
            scoreManager.incrementPlayerScore();
            expect(scoreManager.playerScore).toBe(2);
            expect(scoreManager.highScore).toBe(2);
        });

        it('should handle partial system failures gracefully', () => {
            // Simulate display failure but score system working
            mockDocument.createElement.mockImplementation(() => {
                throw new Error('DOM not available');
            });
            
            const game = new Game();
            
            // Game should still work
            game.handleRoundEnd({ playerCollided: false, aiCollided: true });
            expect(game.scoreManager.playerScore).toBe(1);
            
            // Score display creation should fail gracefully
            const mockRenderer = { renderer: { domElement: createMockElement() } };
            expect(() => new ScoreDisplay(mockRenderer)).not.toThrow();
        });

        it('should maintain data consistency during system stress', () => {
            const game = new Game();
            
            // Simulate system stress with rapid operations and errors
            for (let i = 0; i < 1000; i++) {
                try {
                    if (i % 100 === 0) {
                        // Simulate occasional errors
                        throw new Error('System stress');
                    }
                    
                    game.handleRoundEnd({ 
                        playerCollided: Math.random() > 0.5, 
                        aiCollided: Math.random() > 0.5 
                    });
                    
                    const state = game.scoreManager.getScoreState();
                    expect(state.playerScore).toBeGreaterThanOrEqual(0);
                    expect(state.aiScore).toBeGreaterThanOrEqual(0);
                    expect(state.highScore).toBeGreaterThanOrEqual(0);
                    expect(state.roundsPlayed).toBe(state.playerScore + state.aiScore);
                } catch (error) {
                    // Errors should not corrupt the score state
                    const state = game.scoreManager.getScoreState();
                    expect(typeof state.playerScore).toBe('number');
                    expect(typeof state.aiScore).toBe('number');
                    expect(typeof state.highScore).toBe('number');
                }
            }
        });
    });
});