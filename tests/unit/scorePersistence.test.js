const { ScorePersistence } = require('@/systems/scorePersistence.js');

describe('ScorePersistence', () => {
    let mockLocalStorage;
    let originalLocalStorage;
    let originalWindowLocalStorage;

    beforeEach(() => {
        // Store original localStorage
        originalLocalStorage = global.localStorage;
        originalWindowLocalStorage = typeof window !== 'undefined' ? window.localStorage : undefined;
        
        // Clear any existing data from jsdom localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.clear();
        }
        if (global.localStorage && global.localStorage.clear) {
            global.localStorage.clear();
        }
        
        // Create a completely fresh mock localStorage for each test
        mockLocalStorage = {
            store: {},
            getItem: function(key) {
                return this.store[key] || null;
            },
            setItem: function(key, value) {
                this.store[key] = value;
            },
            removeItem: function(key) {
                delete this.store[key];
            },
            clear: function() {
                this.store = {};
            }
        };

        // Replace global localStorage
        global.localStorage = mockLocalStorage;
        if (typeof window !== 'undefined') {
            // Use Object.defineProperty to properly override window.localStorage
            Object.defineProperty(window, 'localStorage', {
                value: mockLocalStorage,
                writable: true,
                configurable: true
            });
        }
    });

    afterEach(() => {
        // Clear any stored data
        if (mockLocalStorage && mockLocalStorage.store) {
            mockLocalStorage.store = {};
        }
        // Restore original localStorage
        global.localStorage = originalLocalStorage;
        if (typeof window !== 'undefined' && originalWindowLocalStorage) {
            Object.defineProperty(window, 'localStorage', {
                value: originalWindowLocalStorage,
                writable: true,
                configurable: true
            });
        }
    });

    describe('isStorageAvailable', () => {
        it('should return true when localStorage is available', () => {
            expect(ScorePersistence.isStorageAvailable()).toBe(true);
        });

        it('should return false when localStorage throws on setItem', () => {
            // Create a localStorage that throws on setItem
            const throwingStorage = {
                setItem: function() {
                    throw new Error('Storage quota exceeded');
                },
                removeItem: function() {}
            };
            global.localStorage = throwingStorage;
            if (typeof window !== 'undefined') {
                window.localStorage = throwingStorage;
            }

            expect(ScorePersistence.isStorageAvailable()).toBe(false);
        });

        it('should return false when localStorage is undefined', () => {
            global.localStorage = undefined;
            if (typeof window !== 'undefined') {
                window.localStorage = undefined;
            }
            expect(ScorePersistence.isStorageAvailable()).toBe(false);
        });
    });

    describe('isValidScore', () => {
        it('should return true for valid scores', () => {
            expect(ScorePersistence.isValidScore(0)).toBe(true);
            expect(ScorePersistence.isValidScore(1)).toBe(true);
            expect(ScorePersistence.isValidScore(100)).toBe(true);
            expect(ScorePersistence.isValidScore(999999)).toBe(true);
        });

        it('should return false for invalid scores', () => {
            expect(ScorePersistence.isValidScore(-1)).toBe(false);
            expect(ScorePersistence.isValidScore(1000000)).toBe(false);
            expect(ScorePersistence.isValidScore(1.5)).toBe(false);
            expect(ScorePersistence.isValidScore(NaN)).toBe(false);
            expect(ScorePersistence.isValidScore(Infinity)).toBe(false);
            expect(ScorePersistence.isValidScore('10')).toBe(false);
            expect(ScorePersistence.isValidScore(null)).toBe(false);
            expect(ScorePersistence.isValidScore(undefined)).toBe(false);
        });
    });

    describe('saveHighScore', () => {
        it('should save valid score to localStorage', () => {
            const result = ScorePersistence.saveHighScore(42);

            expect(result).toBe(true);
            expect(mockLocalStorage.store['lightbikes_high_score']).toBe('42');
        });

        it('should return false for invalid scores', () => {
            const result = ScorePersistence.saveHighScore(-1);

            expect(result).toBe(false);
            expect(mockLocalStorage.store['lightbikes_high_score']).toBeUndefined();
        });

        it('should return false when localStorage is unavailable', () => {
            global.localStorage = undefined;
            if (typeof window !== 'undefined') {
                window.localStorage = undefined;
            }

            const result = ScorePersistence.saveHighScore(42);

            expect(result).toBe(false);
        });

        it('should handle localStorage errors gracefully', () => {
            // Create a localStorage that throws on setItem
            const throwingStorage = {
                setItem: function() {
                    throw new Error('Storage error');
                },
                removeItem: function() {}
            };
            global.localStorage = throwingStorage;
            if (typeof window !== 'undefined') {
                window.localStorage = throwingStorage;
            }

            const result = ScorePersistence.saveHighScore(42);

            expect(result).toBe(false);
        });
    });

    describe('loadHighScore', () => {
        it('should load valid score from localStorage', () => {
            mockLocalStorage.store['lightbikes_high_score'] = '42';

            const result = ScorePersistence.loadHighScore();

            expect(result).toBe(42);
        });

        it('should return 0 when no score is stored', () => {
            const result = ScorePersistence.loadHighScore();

            expect(result).toBe(0);
        });

        it('should return 0 when localStorage is unavailable', () => {
            global.localStorage = undefined;
            if (typeof window !== 'undefined') {
                window.localStorage = undefined;
            }

            const result = ScorePersistence.loadHighScore();

            expect(result).toBe(0);
        });

        it('should handle localStorage errors gracefully', () => {
            // Create a localStorage that throws on getItem
            const throwingStorage = {
                getItem: function() {
                    throw new Error('Storage error');
                },
                setItem: function() {},
                removeItem: function() {}
            };
            global.localStorage = throwingStorage;
            if (typeof window !== 'undefined') {
                window.localStorage = throwingStorage;
            }

            const result = ScorePersistence.loadHighScore();

            expect(result).toBe(0);
        });

        it('should handle invalid stored data', () => {
            mockLocalStorage.store['lightbikes_high_score'] = 'invalid';

            const result = ScorePersistence.loadHighScore();

            expect(result).toBe(0);
            // Should clean up invalid data
            expect(mockLocalStorage.store['lightbikes_high_score']).toBe('0');
        });

        it('should handle negative stored values', () => {
            mockLocalStorage.store['lightbikes_high_score'] = '-5';

            const result = ScorePersistence.loadHighScore();

            expect(result).toBe(0);
            // Should clean up invalid data
            expect(mockLocalStorage.store['lightbikes_high_score']).toBe('0');
        });

        it('should handle values exceeding maximum', () => {
            mockLocalStorage.store['lightbikes_high_score'] = '1000000';

            const result = ScorePersistence.loadHighScore();

            expect(result).toBe(0);
            // Should clean up invalid data
            expect(mockLocalStorage.store['lightbikes_high_score']).toBe('0');
        });
    });

    describe('clearHighScore', () => {
        it('should clear high score from localStorage', () => {
            mockLocalStorage.store['lightbikes_high_score'] = '42';

            const result = ScorePersistence.clearHighScore();

            expect(result).toBe(true);
            expect(mockLocalStorage.store['lightbikes_high_score']).toBeUndefined();
        });

        it('should return false when localStorage is unavailable', () => {
            global.localStorage = undefined;
            if (typeof window !== 'undefined') {
                window.localStorage = undefined;
            }

            const result = ScorePersistence.clearHighScore();

            expect(result).toBe(false);
        });

        it('should handle localStorage errors gracefully', () => {
            // Create a localStorage that throws on removeItem
            const throwingStorage = {
                getItem: function() { return null; },
                setItem: function() {},
                removeItem: function() {
                    throw new Error('Storage error');
                }
            };
            global.localStorage = throwingStorage;
            if (typeof window !== 'undefined') {
                window.localStorage = throwingStorage;
            }

            const result = ScorePersistence.clearHighScore();

            expect(result).toBe(false);
        });
    });

    describe('integration scenarios', () => {
        it('should handle save and load cycle correctly', () => {
            // Save a score
            const saveResult = ScorePersistence.saveHighScore(123);
            expect(saveResult).toBe(true);

            // Load the score
            const loadResult = ScorePersistence.loadHighScore();
            expect(loadResult).toBe(123);
        });

        it('should handle multiple save operations', () => {
            ScorePersistence.saveHighScore(10);
            ScorePersistence.saveHighScore(20);
            ScorePersistence.saveHighScore(30);

            const result = ScorePersistence.loadHighScore();
            expect(result).toBe(30);
        });

        it('should handle clear and load cycle', () => {
            // Save a score
            ScorePersistence.saveHighScore(456);
            expect(ScorePersistence.loadHighScore()).toBe(456);

            // Clear the score
            const clearResult = ScorePersistence.clearHighScore();
            expect(clearResult).toBe(true);

            // Load should return 0
            const loadResult = ScorePersistence.loadHighScore();
            expect(loadResult).toBe(0);
        });
    });
});