const { ScoreManager } = require('./scoreManager.js');
const { ScorePersistence } = require('./scorePersistence.js');

// Mock ScorePersistence
jest.mock('./scorePersistence.js', () => ({
    ScorePersistence: {
        loadHighScore: jest.fn(() => 0),
        saveHighScore: jest.fn(() => true)
    }
}));

describe('ScoreManager', () => {
    let scoreManager;

    beforeEach(() => {
        jest.clearAllMocks();
        ScorePersistence.loadHighScore.mockReturnValue(0);
        scoreManager = new ScoreManager();
    });

    describe('constructor', () => {
        it('should initialize player and AI scores to 0', () => {
            expect(scoreManager.playerScore).toBe(0);
            expect(scoreManager.aiScore).toBe(0);
        });

        it('should load high score from persistence', () => {
            expect(ScorePersistence.loadHighScore).toHaveBeenCalled();
            expect(scoreManager.highScore).toBe(0);
        });

        it('should initialize with loaded high score', () => {
            ScorePersistence.loadHighScore.mockReturnValue(15);
            const newScoreManager = new ScoreManager();
            expect(newScoreManager.highScore).toBe(15);
        });
    });

    describe('incrementPlayerScore', () => {
        it('should increment player score by 1', () => {
            scoreManager.incrementPlayerScore();
            expect(scoreManager.playerScore).toBe(1);
            
            scoreManager.incrementPlayerScore();
            expect(scoreManager.playerScore).toBe(2);
        });

        it('should update high score when player score increases', () => {
            scoreManager.incrementPlayerScore();
            expect(scoreManager.highScore).toBe(1);
            expect(ScorePersistence.saveHighScore).toHaveBeenCalledWith(1);
            
            scoreManager.incrementPlayerScore();
            expect(scoreManager.highScore).toBe(2);
            expect(ScorePersistence.saveHighScore).toHaveBeenCalledWith(2);
        });

        it('should not affect AI score', () => {
            scoreManager.incrementPlayerScore();
            expect(scoreManager.aiScore).toBe(0);
        });
    });

    describe('incrementAIScore', () => {
        it('should increment AI score by 1', () => {
            scoreManager.incrementAIScore();
            expect(scoreManager.aiScore).toBe(1);
            
            scoreManager.incrementAIScore();
            expect(scoreManager.aiScore).toBe(2);
        });

        it('should not affect player score or high score', () => {
            scoreManager.incrementAIScore();
            expect(scoreManager.playerScore).toBe(0);
            expect(scoreManager.highScore).toBe(0);
        });
    });

    describe('resetCurrentScores', () => {
        it('should reset player and AI scores to 0', () => {
            scoreManager.incrementPlayerScore();
            scoreManager.incrementAIScore();
            
            scoreManager.resetCurrentScores();
            
            expect(scoreManager.playerScore).toBe(0);
            expect(scoreManager.aiScore).toBe(0);
        });

        it('should preserve high score when resetting', () => {
            scoreManager.incrementPlayerScore();
            scoreManager.incrementPlayerScore();
            const originalHighScore = scoreManager.highScore;
            
            scoreManager.resetCurrentScores();
            
            expect(scoreManager.highScore).toBe(originalHighScore);
        });
    });

    describe('updateHighScore', () => {
        it('should return true when high score is updated', () => {
            scoreManager.playerScore = 5;
            const result = scoreManager.updateHighScore();
            
            expect(result).toBe(true);
            expect(scoreManager.highScore).toBe(5);
            expect(ScorePersistence.saveHighScore).toHaveBeenCalledWith(5);
        });

        it('should return false when high score is not updated', () => {
            scoreManager.highScore = 10;
            scoreManager.playerScore = 5;
            
            const result = scoreManager.updateHighScore();
            
            expect(result).toBe(false);
            expect(scoreManager.highScore).toBe(10);
            expect(ScorePersistence.saveHighScore).not.toHaveBeenCalled();
        });

        it('should not update high score if player score is equal', () => {
            scoreManager.highScore = 5;
            scoreManager.playerScore = 5;
            
            const result = scoreManager.updateHighScore();
            
            expect(result).toBe(false);
            expect(scoreManager.highScore).toBe(5);
            expect(ScorePersistence.saveHighScore).not.toHaveBeenCalled();
        });
    });

    describe('isNewHighScore', () => {
        it('should return true when player score equals high score and is greater than 0', () => {
            scoreManager.incrementPlayerScore();
            expect(scoreManager.isNewHighScore()).toBe(true);
        });

        it('should return false when player score is 0', () => {
            expect(scoreManager.isNewHighScore()).toBe(false);
        });

        it('should return false when player score is less than high score', () => {
            scoreManager.highScore = 10;
            scoreManager.playerScore = 5;
            expect(scoreManager.isNewHighScore()).toBe(false);
        });

        it('should return false when player score exceeds high score but high score not updated', () => {
            scoreManager.highScore = 5;
            scoreManager.playerScore = 10;
            expect(scoreManager.isNewHighScore()).toBe(false);
        });
    });

    describe('setHighScore', () => {
        it('should set high score to valid positive number', () => {
            scoreManager.setHighScore(15);
            expect(scoreManager.highScore).toBe(15);
        });

        it('should set high score to 0', () => {
            scoreManager.setHighScore(0);
            expect(scoreManager.highScore).toBe(0);
        });

        it('should ignore negative numbers', () => {
            const originalHighScore = scoreManager.highScore;
            scoreManager.setHighScore(-5);
            expect(scoreManager.highScore).toBe(originalHighScore);
        });

        it('should ignore non-number values', () => {
            const originalHighScore = scoreManager.highScore;
            scoreManager.setHighScore('invalid');
            scoreManager.setHighScore(null);
            scoreManager.setHighScore(undefined);
            expect(scoreManager.highScore).toBe(originalHighScore);
        });
    });

    describe('getScoreState', () => {
        it('should return complete score state object', () => {
            scoreManager.playerScore = 3;
            scoreManager.aiScore = 2;
            scoreManager.highScore = 5;
            
            const state = scoreManager.getScoreState();
            
            expect(state).toEqual({
                playerScore: 3,
                aiScore: 2,
                highScore: 5,
                isNewHighScore: false,
                roundsPlayed: 5
            });
        });

        it('should include isNewHighScore flag correctly', () => {
            scoreManager.incrementPlayerScore();
            
            const state = scoreManager.getScoreState();
            
            expect(state.isNewHighScore).toBe(true);
        });

        it('should calculate rounds played correctly', () => {
            scoreManager.playerScore = 7;
            scoreManager.aiScore = 3;
            
            const state = scoreManager.getScoreState();
            
            expect(state.roundsPlayed).toBe(10);
        });
    });

    describe('integration scenarios', () => {
        it('should handle multiple game sessions correctly', () => {
            // First session
            scoreManager.incrementPlayerScore();
            scoreManager.incrementPlayerScore();
            scoreManager.incrementAIScore();
            
            expect(scoreManager.getScoreState()).toEqual({
                playerScore: 2,
                aiScore: 1,
                highScore: 2,
                isNewHighScore: true,
                roundsPlayed: 3
            });
            
            // Reset for new session
            scoreManager.resetCurrentScores();
            
            expect(scoreManager.getScoreState()).toEqual({
                playerScore: 0,
                aiScore: 0,
                highScore: 2,
                isNewHighScore: false,
                roundsPlayed: 0
            });
            
            // Second session with lower score
            scoreManager.incrementPlayerScore();
            
            expect(scoreManager.getScoreState()).toEqual({
                playerScore: 1,
                aiScore: 0,
                highScore: 2,
                isNewHighScore: false,
                roundsPlayed: 1
            });
        });

        it('should handle high score persistence scenario', () => {
            // Simulate loading high score from storage
            scoreManager.setHighScore(10);
            
            // Play some rounds
            scoreManager.incrementPlayerScore();
            scoreManager.incrementPlayerScore();
            
            expect(scoreManager.highScore).toBe(10);
            expect(scoreManager.isNewHighScore()).toBe(false);
            
            // Achieve new high score
            for (let i = 0; i < 9; i++) {
                scoreManager.incrementPlayerScore();
            }
            
            expect(scoreManager.highScore).toBe(11);
            expect(scoreManager.isNewHighScore()).toBe(true);
        });
    });
});