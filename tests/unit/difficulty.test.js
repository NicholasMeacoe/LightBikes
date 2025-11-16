/**
 * Tests for DifficultyManager class and configuration system
 */

const { DifficultyManager, DIFFICULTY_CONFIGS } = require('./difficulty.js');

// Mock localStorage for testing
const localStorageMock = {
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

// Mock game and AI controller objects
const mockGame = {
    setGameSpeed: jest.fn()
};

const mockAIController = {
    difficultyConfig: null
};

describe('DIFFICULTY_CONFIGS', () => {
    it('should have all required difficulty levels', () => {
        expect(DIFFICULTY_CONFIGS).toHaveProperty('easy');
        expect(DIFFICULTY_CONFIGS).toHaveProperty('medium');
        expect(DIFFICULTY_CONFIGS).toHaveProperty('hard');
    });

    it('should have all required properties for each difficulty', () => {
        Object.values(DIFFICULTY_CONFIGS).forEach(config => {
            expect(config).toHaveProperty('turnThreshold');
            expect(config).toHaveProperty('randomTurnChance');
            expect(config).toHaveProperty('gameSpeed');
            expect(config).toHaveProperty('description');
        });
    });

    it('should have correct parameter ranges', () => {
        expect(DIFFICULTY_CONFIGS.easy.turnThreshold).toBe(15);
        expect(DIFFICULTY_CONFIGS.medium.turnThreshold).toBe(10);
        expect(DIFFICULTY_CONFIGS.hard.turnThreshold).toBe(8);
        
        expect(DIFFICULTY_CONFIGS.easy.gameSpeed).toBe(0.08);
        expect(DIFFICULTY_CONFIGS.medium.gameSpeed).toBe(0.1);
        expect(DIFFICULTY_CONFIGS.hard.gameSpeed).toBe(0.12);
    });
});

describe('DifficultyManager', () => {
    let difficultyManager;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        localStorageMock.clear();
        
        // Mock localStorage globally
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
            writable: true
        });

        // Create fresh instances
        mockGame.setGameSpeed = jest.fn();
        mockAIController.difficultyConfig = null;
        
        difficultyManager = new DifficultyManager(mockGame, mockAIController);
    });

    describe('constructor', () => {
        it('should initialize with medium difficulty by default', () => {
            expect(difficultyManager.getCurrentDifficulty()).toBe('medium');
        });

        it('should store game and AI controller references', () => {
            expect(difficultyManager.game).toBe(mockGame);
            expect(difficultyManager.aiController).toBe(mockAIController);
        });

        it('should attempt to load from storage on initialization', () => {
            expect(localStorageMock.getItem).toHaveBeenCalledWith('lightbikes_difficulty');
        });
    });

    describe('setDifficulty', () => {
        it('should set valid difficulty levels', () => {
            difficultyManager.setDifficulty('easy');
            expect(difficultyManager.getCurrentDifficulty()).toBe('easy');

            difficultyManager.setDifficulty('hard');
            expect(difficultyManager.getCurrentDifficulty()).toBe('hard');
        });

        it('should fall back to medium for invalid difficulty levels', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            difficultyManager.setDifficulty('invalid');
            expect(difficultyManager.getCurrentDifficulty()).toBe('medium');
            expect(consoleSpy).toHaveBeenCalledWith('Invalid difficulty level: "invalid", using medium. Valid options: easy, medium, hard');
            
            consoleSpy.mockRestore();
        });

        it('should apply changes to game system', () => {
            difficultyManager.setDifficulty('easy');
            expect(mockGame.setGameSpeed).toHaveBeenCalledWith(0.08);

            difficultyManager.setDifficulty('hard');
            expect(mockGame.setGameSpeed).toHaveBeenCalledWith(0.12);
        });

        it('should apply changes to AI system', () => {
            difficultyManager.setDifficulty('easy');
            expect(mockAIController.difficultyConfig).toEqual(DIFFICULTY_CONFIGS.easy);

            difficultyManager.setDifficulty('hard');
            expect(mockAIController.difficultyConfig).toEqual(DIFFICULTY_CONFIGS.hard);
        });

        it('should save to storage', () => {
            difficultyManager.setDifficulty('hard');
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'lightbikes_difficulty',
                expect.stringContaining('"selectedDifficulty":"hard"')
            );
        });
    });

    describe('getCurrentDifficulty', () => {
        it('should return the current difficulty level', () => {
            expect(difficultyManager.getCurrentDifficulty()).toBe('medium');
            
            difficultyManager.setDifficulty('easy');
            expect(difficultyManager.getCurrentDifficulty()).toBe('easy');
        });
    });

    describe('getDifficultyConfig', () => {
        it('should return config for current difficulty when no parameter provided', () => {
            difficultyManager.setDifficulty('easy');
            const config = difficultyManager.getDifficultyConfig();
            expect(config).toEqual(DIFFICULTY_CONFIGS.easy);
        });

        it('should return config for specified difficulty level', () => {
            const config = difficultyManager.getDifficultyConfig('hard');
            expect(config).toEqual(DIFFICULTY_CONFIGS.hard);
        });

        it('should fall back to medium for invalid difficulty levels', () => {
            const config = difficultyManager.getDifficultyConfig('invalid');
            expect(config).toEqual(DIFFICULTY_CONFIGS.medium);
        });
    });

    describe('applyToGame', () => {
        it('should call setGameSpeed with correct speed', () => {
            difficultyManager.setDifficulty('easy');
            difficultyManager.applyToGame();
            expect(mockGame.setGameSpeed).toHaveBeenCalledWith(0.08);
        });

        it('should handle missing game object gracefully', () => {
            const managerWithoutGame = new DifficultyManager(null, mockAIController);
            expect(() => managerWithoutGame.applyToGame()).not.toThrow();
        });

        it('should handle game object without setGameSpeed method', () => {
            const gameWithoutMethod = {};
            const managerWithBadGame = new DifficultyManager(gameWithoutMethod, mockAIController);
            expect(() => managerWithBadGame.applyToGame()).not.toThrow();
        });
    });

    describe('applyToAI', () => {
        it('should set difficultyConfig on AI controller', () => {
            difficultyManager.setDifficulty('hard');
            difficultyManager.applyToAI();
            expect(mockAIController.difficultyConfig).toEqual(DIFFICULTY_CONFIGS.hard);
        });

        it('should handle missing AI controller gracefully', () => {
            const managerWithoutAI = new DifficultyManager(mockGame, null);
            expect(() => managerWithoutAI.applyToAI()).not.toThrow();
        });
    });

    describe('saveToStorage', () => {
        it('should save difficulty data to localStorage', () => {
            difficultyManager.setDifficulty('easy');
            
            const savedData = JSON.parse(localStorageMock.store['lightbikes_difficulty']);
            expect(savedData.selectedDifficulty).toBe('easy');
            expect(savedData.timestamp).toBeGreaterThan(0);
        });

        it('should handle localStorage errors gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('Storage error');
            });

            expect(() => difficultyManager.saveToStorage()).not.toThrow();
            expect(consoleSpy).toHaveBeenCalledWith('Failed to save difficulty setting:', expect.any(Error));
            
            consoleSpy.mockRestore();
        });
    });

    describe('loadFromStorage', () => {
        it('should load valid difficulty from storage', () => {
            const testData = {
                selectedDifficulty: 'hard',
                timestamp: Date.now()
            };
            localStorageMock.store['lightbikes_difficulty'] = JSON.stringify(testData);

            const newManager = new DifficultyManager(mockGame, mockAIController);
            expect(newManager.getCurrentDifficulty()).toBe('hard');
        });

        it('should ignore invalid difficulty from storage', () => {
            const testData = {
                selectedDifficulty: 'invalid',
                timestamp: Date.now()
            };
            localStorageMock.store['lightbikes_difficulty'] = JSON.stringify(testData);

            const newManager = new DifficultyManager(mockGame, mockAIController);
            expect(newManager.getCurrentDifficulty()).toBe('medium');
        });

        it('should handle missing storage data gracefully', () => {
            localStorageMock.store = {};
            
            const newManager = new DifficultyManager(mockGame, mockAIController);
            expect(newManager.getCurrentDifficulty()).toBe('medium');
        });

        it('should handle localStorage errors gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            localStorageMock.getItem.mockImplementation(() => {
                throw new Error('Storage error');
            });

            const newManager = new DifficultyManager(mockGame, mockAIController);
            expect(newManager.getCurrentDifficulty()).toBe('medium');
            expect(consoleSpy).toHaveBeenCalledWith('Failed to load difficulty setting:', expect.any(Error));
            
            consoleSpy.mockRestore();
        });

        it('should handle corrupted JSON data gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            localStorageMock.store['lightbikes_difficulty'] = 'invalid json';

            const newManager = new DifficultyManager(mockGame, mockAIController);
            expect(newManager.getCurrentDifficulty()).toBe('medium');
            expect(consoleSpy).toHaveBeenCalledWith('Failed to load difficulty setting:', expect.any(Error));
            
            consoleSpy.mockRestore();
        });
    });

    describe('getAllDifficulties', () => {
        it('should return all difficulty configurations', () => {
            const allDifficulties = difficultyManager.getAllDifficulties();
            expect(allDifficulties).toEqual(DIFFICULTY_CONFIGS);
        });

        it('should return a copy of configurations (not reference)', () => {
            const allDifficulties = difficultyManager.getAllDifficulties();
            allDifficulties.easy.gameSpeed = 999;
            expect(DIFFICULTY_CONFIGS.easy.gameSpeed).toBe(0.08);
        });
    });

    describe('enhanced error handling and validation', () => {
        describe('setDifficulty input validation', () => {
            it('should handle non-string input types', () => {
                const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
                
                difficultyManager.setDifficulty(123);
                expect(difficultyManager.getCurrentDifficulty()).toBe('medium');
                expect(consoleSpy).toHaveBeenCalledWith('Invalid difficulty type: number, expected string. Using medium');
                
                difficultyManager.setDifficulty(null);
                expect(difficultyManager.getCurrentDifficulty()).toBe('medium');
                expect(consoleSpy).toHaveBeenCalledWith('Invalid difficulty type: object, expected string. Using medium');
                
                consoleSpy.mockRestore();
            });

            it('should normalize input by trimming whitespace and converting to lowercase', () => {
                difficultyManager.setDifficulty('  EASY  ');
                expect(difficultyManager.getCurrentDifficulty()).toBe('easy');
                
                difficultyManager.setDifficulty('Hard');
                expect(difficultyManager.getCurrentDifficulty()).toBe('hard');
            });
        });

        describe('getDifficultyConfig input validation', () => {
            it('should handle non-string input types', () => {
                const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
                
                const config = difficultyManager.getDifficultyConfig(123);
                expect(config).toEqual(DIFFICULTY_CONFIGS.medium);
                expect(consoleSpy).toHaveBeenCalledWith('Invalid difficulty type in getDifficultyConfig: number, using current difficulty');
                
                consoleSpy.mockRestore();
            });

            it('should normalize string input', () => {
                const config = difficultyManager.getDifficultyConfig('  HARD  ');
                expect(config).toEqual(DIFFICULTY_CONFIGS.hard);
            });
        });

        describe('applyToGame error handling', () => {
            it('should handle invalid game speed values', () => {
                const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
                const mockGameWithBadSpeed = { setGameSpeed: jest.fn() };
                
                // Temporarily modify config to have invalid speed
                const originalConfig = DIFFICULTY_CONFIGS.easy.gameSpeed;
                DIFFICULTY_CONFIGS.easy.gameSpeed = -1;
                
                const manager = new DifficultyManager(mockGameWithBadSpeed, mockAIController);
                manager.setDifficulty('easy');
                
                // The validation happens during config validation, so check for that message
                expect(consoleSpy).toHaveBeenCalledWith('Invalid gameSpeed for "easy": -1');
                expect(consoleSpy).toHaveBeenCalledWith('Some difficulty configurations are invalid. Game may not function correctly.');
                
                // Restore original config
                DIFFICULTY_CONFIGS.easy.gameSpeed = originalConfig;
                consoleSpy.mockRestore();
            });

            it('should handle setGameSpeed method throwing errors', () => {
                const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
                const mockGameWithError = {
                    setGameSpeed: jest.fn(() => { throw new Error('Game error'); })
                };
                
                const manager = new DifficultyManager(mockGameWithError, mockAIController);
                expect(() => manager.applyToGame()).not.toThrow();
                expect(consoleSpy).toHaveBeenCalledWith('Error applying game speed settings:', expect.any(Error));
                
                consoleSpy.mockRestore();
            });
        });

        describe('applyToAI error handling', () => {
            it('should validate and correct invalid AI configuration values', () => {
                const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
                
                // Temporarily modify config to have invalid values
                const originalTurnThreshold = DIFFICULTY_CONFIGS.hard.turnThreshold;
                const originalRandomTurnChance = DIFFICULTY_CONFIGS.hard.randomTurnChance;
                
                DIFFICULTY_CONFIGS.hard.turnThreshold = -5;
                DIFFICULTY_CONFIGS.hard.randomTurnChance = 2;
                
                difficultyManager.setDifficulty('hard');
                
                // The validation happens during config validation, so check for those messages
                expect(consoleSpy).toHaveBeenCalledWith('Invalid turnThreshold for "hard": -5');
                expect(consoleSpy).toHaveBeenCalledWith('Invalid configuration for difficulty "hard", falling back to medium');
                
                // Restore original config
                DIFFICULTY_CONFIGS.hard.turnThreshold = originalTurnThreshold;
                DIFFICULTY_CONFIGS.hard.randomTurnChance = originalRandomTurnChance;
                consoleSpy.mockRestore();
            });
        });

        describe('localStorage error handling', () => {
            it('should handle localStorage quota exceeded errors', () => {
                const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
                const quotaError = new Error('Quota exceeded');
                quotaError.name = 'QuotaExceededError';
                
                localStorageMock.setItem.mockImplementation(() => {
                    throw quotaError;
                });

                expect(() => difficultyManager.saveToStorage()).not.toThrow();
                expect(consoleSpy).toHaveBeenCalledWith('localStorage quota exceeded, cannot save difficulty setting');
                
                consoleSpy.mockRestore();
            });

            it('should handle missing localStorage gracefully', () => {
                const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
                
                // Mock missing localStorage
                const originalLocalStorage = window.localStorage;
                delete window.localStorage;
                
                const manager = new DifficultyManager(mockGame, mockAIController);
                manager.saveToStorage();
                
                expect(consoleSpy).toHaveBeenCalledWith('localStorage not available, cannot save difficulty setting');
                
                // Restore localStorage
                window.localStorage = originalLocalStorage;
                consoleSpy.mockRestore();
            });
        });

        describe('configuration validation', () => {
            it('should validate all configurations on initialization', () => {
                const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
                
                // Temporarily corrupt a configuration
                const originalConfig = DIFFICULTY_CONFIGS.easy;
                DIFFICULTY_CONFIGS.easy = { invalid: 'config' };
                
                const manager = new DifficultyManager(mockGame, mockAIController);
                
                expect(consoleSpy).toHaveBeenCalledWith('Configuration for "easy" missing required property: turnThreshold');
                expect(consoleSpy).toHaveBeenCalledWith('Some difficulty configurations are invalid. Game may not function correctly.');
                
                // Restore original config
                DIFFICULTY_CONFIGS.easy = originalConfig;
                consoleSpy.mockRestore();
            });

            it('should validate constructor parameters', () => {
                const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
                
                new DifficultyManager('invalid', 123);
                
                expect(consoleSpy).toHaveBeenCalledWith('Invalid game parameter provided to DifficultyManager');
                expect(consoleSpy).toHaveBeenCalledWith('Invalid aiController parameter provided to DifficultyManager');
                
                consoleSpy.mockRestore();
            });
        });

        describe('validateAllConfigurations', () => {
            it('should return true for valid configurations', () => {
                // Create a fresh manager to avoid contamination from previous tests
                const freshManager = new DifficultyManager(mockGame, mockAIController);
                const result = freshManager.validateAllConfigurations();
                expect(result).toBe(true);
            });

            it('should return false and log warnings for invalid configurations', () => {
                const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
                
                // Temporarily corrupt a configuration
                const originalConfig = DIFFICULTY_CONFIGS.medium;
                DIFFICULTY_CONFIGS.medium = { turnThreshold: 'invalid' };
                
                const result = difficultyManager.validateAllConfigurations();
                expect(result).toBe(false);
                expect(consoleSpy).toHaveBeenCalledWith('Configuration for "medium" missing required property: randomTurnChance');
                
                // Restore original config
                DIFFICULTY_CONFIGS.medium = originalConfig;
                consoleSpy.mockRestore();
            });
        });
    });
});