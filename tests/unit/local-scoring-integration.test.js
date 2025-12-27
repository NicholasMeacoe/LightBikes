/**
 * Integration tests for local multiplayer scoring system
 * Tests the complete flow from game events to UI updates
 */
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

const { MultiplayerGame } = require('@/multiplayer/MultiplayerGame.js');
const { LocalScoringUI } = require('@/ui/LocalScoringUI.js');
const { PlayerCollisionHandler } = require('@/multiplayer/PlayerCollisionHandler.js');

describe('Local Scoring Integration', () => {
    let game;
    let scoringUI;
    let collisionHandler;

    beforeEach(() => {
        // Clear DOM
        document.body.innerHTML = '';

        // Initialize game and systems
        game = new MultiplayerGame();
        scoringUI = new LocalScoringUI(game.localScoring);
        collisionHandler = new PlayerCollisionHandler();
    });

    afterEach(() => {
        if (scoringUI) {
            scoringUI.destroy();
        }
    });

    describe('Round completion flow', () => {
        it('should update scores when Player 1 wins a round', () => {
            // Simulate Player 2 collision
            const collisionResult = {
                player1Collided: false,
                player2Collided: true,
            };

            game.handleRoundEnd(collisionResult);
            scoringUI.updateScores();

            // Verify score update
            const scoreDetails = game.localScoring.getScoreDetails();
            expect(scoreDetails.player1Wins).toBe(1);
            expect(scoreDetails.player2Wins).toBe(0);
            expect(scoreDetails.totalRounds).toBe(1);

            // Verify UI displays correct scores
            const player1Score = document.getElementById('player1Score');
            const player2Score = document.getElementById('player2Score');
            expect(player1Score.textContent).toBe('P1: 1');
            expect(player2Score.textContent).toBe('P2: 0');
        });

        it('should update scores when Player 2 wins a round', () => {
            // Simulate Player 1 collision
            const collisionResult = {
                player1Collided: true,
                player2Collided: false,
            };

            game.handleRoundEnd(collisionResult);
            scoringUI.updateScores();

            // Verify score update
            const scoreDetails = game.localScoring.getScoreDetails();
            expect(scoreDetails.player1Wins).toBe(0);
            expect(scoreDetails.player2Wins).toBe(1);
            expect(scoreDetails.totalRounds).toBe(1);

            // Verify UI displays correct scores
            const player1Score = document.getElementById('player1Score');
            const player2Score = document.getElementById('player2Score');
            expect(player1Score.textContent).toBe('P1: 0');
            expect(player2Score.textContent).toBe('P2: 1');
        });

        it('should handle tie games correctly', () => {
            // Simulate both players colliding
            const collisionResult = {
                player1Collided: true,
                player2Collided: true,
            };

            game.handleRoundEnd(collisionResult);
            scoringUI.updateScores();

            // Verify no score change
            const scoreDetails = game.localScoring.getScoreDetails();
            expect(scoreDetails.player1Wins).toBe(0);
            expect(scoreDetails.player2Wins).toBe(0);
            expect(scoreDetails.totalRounds).toBe(1);

            // Verify round history shows tie
            expect(scoreDetails.roundHistory).toEqual(['TIE']);
        });
    });

    describe('Multiple rounds', () => {
        it('should track scores across multiple rounds', () => {
            // Round 1: P1 wins
            game.handleRoundEnd({ player1Collided: false, player2Collided: true });
            scoringUI.updateScores();
            expect(document.getElementById('roundIndicator').textContent).toBe('Round 2');

            // Round 2: P2 wins
            game.handleRoundEnd({ player1Collided: true, player2Collided: false });
            scoringUI.updateScores();
            expect(document.getElementById('roundIndicator').textContent).toBe('Round 3');

            // Round 3: P1 wins
            game.handleRoundEnd({ player1Collided: false, player2Collided: true });
            scoringUI.updateScores();

            // Verify final scores
            const scoreDetails = game.localScoring.getScoreDetails();
            expect(scoreDetails.player1Wins).toBe(2);
            expect(scoreDetails.player2Wins).toBe(1);
            expect(scoreDetails.totalRounds).toBe(3);
            expect(scoreDetails.currentRound).toBe(4);
        });

        it('should maintain score history', () => {
            // Play several rounds
            game.handleRoundEnd({ player1Collided: false, player2Collided: true }); // P1 wins
            game.handleRoundEnd({ player1Collided: true, player2Collided: false }); // P2 wins
            game.handleRoundEnd({ player1Collided: true, player2Collided: true }); // Tie
            game.handleRoundEnd({ player1Collided: false, player2Collided: true }); // P1 wins

            const scoreDetails = game.localScoring.getScoreDetails();
            expect(scoreDetails.roundHistory).toEqual(['P1', 'P2', 'TIE', 'P1']);
        });
    });

    describe('Winner determination', () => {
        it('should correctly identify overall winner', () => {
            // P1 wins 3 rounds
            game.handleRoundEnd({ player1Collided: false, player2Collided: true });
            game.handleRoundEnd({ player1Collided: false, player2Collided: true });
            game.handleRoundEnd({ player1Collided: false, player2Collided: true });

            // P2 wins 1 round
            game.handleRoundEnd({ player1Collided: true, player2Collided: false });

            expect(game.getOverallWinner()).toBe('P1');
            expect(game.localScoring.getLeader()).toBe('P1');
        });

        it('should handle tied overall scores', () => {
            // Each player wins 2 rounds
            game.handleRoundEnd({ player1Collided: false, player2Collided: true });
            game.handleRoundEnd({ player1Collided: true, player2Collided: false });
            game.handleRoundEnd({ player1Collided: false, player2Collided: true });
            game.handleRoundEnd({ player1Collided: true, player2Collided: false });

            expect(game.getOverallWinner()).toBe(null);
            expect(game.localScoring.hasLeader()).toBe(false);
        });
    });

    describe('Score reset', () => {
        it('should reset scores and UI', () => {
            // Play some rounds
            game.handleRoundEnd({ player1Collided: false, player2Collided: true });
            game.handleRoundEnd({ player1Collided: true, player2Collided: false });
            scoringUI.updateScores();

            // Reset
            game.resetScores();
            scoringUI.reset();

            // Verify reset state
            const scoreDetails = game.localScoring.getScoreDetails();
            expect(scoreDetails.player1Wins).toBe(0);
            expect(scoreDetails.player2Wins).toBe(0);
            expect(scoreDetails.currentRound).toBe(1);
            expect(scoreDetails.totalRounds).toBe(0);

            // Verify UI shows reset scores
            expect(document.getElementById('player1Score').textContent).toBe('P1: 0');
            expect(document.getElementById('player2Score').textContent).toBe('P2: 0');
            expect(document.getElementById('roundIndicator').textContent).toBe('Round 1');
        });
    });

    describe('UI winner announcements', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should show winner announcement for Player 1', () => {
            game.handleRoundEnd({ player1Collided: false, player2Collided: true });
            scoringUI.showRoundWinner('P1');

            const announcement = document.getElementById('winnerAnnouncement');
            expect(announcement.style.display).toBe('block');
            expect(announcement.textContent).toBe('Player 1 Wins!');
            expect(announcement.classList.contains('player1-wins')).toBe(true);
        });

        it('should show winner announcement for Player 2', () => {
            game.handleRoundEnd({ player1Collided: true, player2Collided: false });
            scoringUI.showRoundWinner('P2');

            const announcement = document.getElementById('winnerAnnouncement');
            expect(announcement.style.display).toBe('block');
            expect(announcement.textContent).toBe('Player 2 Wins!');
            expect(announcement.classList.contains('player2-wins')).toBe(true);
        });

        it('should show tie announcement', () => {
            game.handleRoundEnd({ player1Collided: true, player2Collided: true });
            scoringUI.showRoundWinner(null);

            const announcement = document.getElementById('winnerAnnouncement');
            expect(announcement.style.display).toBe('block');
            expect(announcement.textContent).toBe('Tie!');
            expect(announcement.classList.contains('tie')).toBe(true);
        });

        it('should auto-hide winner announcement', () => {
            scoringUI.showRoundWinner('P1');

            const announcement = document.getElementById('winnerAnnouncement');
            expect(announcement.style.display).toBe('block');

            jest.advanceTimersByTime(3000);
            expect(announcement.style.display).toBe('none');
        });
    });

    describe('Final scores display', () => {
        it('should show final scores with Player 1 as winner', () => {
            // P1 wins 3-1
            game.handleRoundEnd({ player1Collided: false, player2Collided: true });
            game.handleRoundEnd({ player1Collided: false, player2Collided: true });
            game.handleRoundEnd({ player1Collided: true, player2Collided: false });
            game.handleRoundEnd({ player1Collided: false, player2Collided: true });

            scoringUI.showFinalScores();

            const announcement = document.getElementById('winnerAnnouncement');
            expect(announcement.style.display).toBe('block');
            expect(announcement.textContent).toContain('Player 1 Wins!');
            expect(announcement.textContent).toContain('3 - 1');
        });

        it('should show final scores with Player 2 as winner', () => {
            // P2 wins 2-1
            game.handleRoundEnd({ player1Collided: false, player2Collided: true });
            game.handleRoundEnd({ player1Collided: true, player2Collided: false });
            game.handleRoundEnd({ player1Collided: true, player2Collided: false });

            scoringUI.showFinalScores();

            const announcement = document.getElementById('winnerAnnouncement');
            expect(announcement.style.display).toBe('block');
            expect(announcement.textContent).toContain('Player 2 Wins!');
            expect(announcement.textContent).toContain('1 - 2');
        });

        it('should show tie game in final scores', () => {
            // Tied 2-2
            game.handleRoundEnd({ player1Collided: false, player2Collided: true });
            game.handleRoundEnd({ player1Collided: true, player2Collided: false });
            game.handleRoundEnd({ player1Collided: false, player2Collided: true });
            game.handleRoundEnd({ player1Collided: true, player2Collided: false });

            scoringUI.showFinalScores();

            const announcement = document.getElementById('winnerAnnouncement');
            expect(announcement.style.display).toBe('block');
            expect(announcement.textContent).toContain('Tie Game!');
            expect(announcement.textContent).toContain('2 - 2');
        });
    });

    describe('Game state integration', () => {
        it('should include scoring in game state', () => {
            game.handleRoundEnd({ player1Collided: false, player2Collided: true });
            game.handleRoundEnd({ player1Collided: true, player2Collided: false });

            const gameState = game.getGameState();
            expect(gameState.localScoring).toBeDefined();
            expect(gameState.localScoring.player1Wins).toBe(1);
            expect(gameState.localScoring.player2Wins).toBe(1);
            expect(gameState.localScoring.totalRounds).toBe(2);
        });

        it('should provide scoring details through getLocalScoring', () => {
            game.handleRoundEnd({ player1Collided: false, player2Collided: true });

            const scoring = game.getLocalScoring();
            expect(scoring.player1Wins).toBe(1);
            expect(scoring.player2Wins).toBe(0);
            expect(scoring.roundHistory).toEqual(['P1']);
        });
    });

    describe('Complete game session', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should handle a complete multiplayer session', () => {
            // Initial state
            scoringUI.updateScores();
            expect(document.getElementById('roundIndicator').textContent).toBe('Round 1');

            // Round 1: P1 wins
            game.handleRoundEnd({ player1Collided: false, player2Collided: true });
            scoringUI.showRoundWinner('P1');
            expect(document.getElementById('player1Score').textContent).toBe('P1: 1');
            jest.advanceTimersByTime(3000);

            // Round 2: P2 wins
            scoringUI.updateScores();
            expect(document.getElementById('roundIndicator').textContent).toBe('Round 2');
            game.handleRoundEnd({ player1Collided: true, player2Collided: false });
            scoringUI.showRoundWinner('P2');
            expect(document.getElementById('player2Score').textContent).toBe('P2: 1');
            jest.advanceTimersByTime(3000);

            // Round 3: Tie
            scoringUI.updateScores();
            expect(document.getElementById('roundIndicator').textContent).toBe('Round 3');
            game.handleRoundEnd({ player1Collided: true, player2Collided: true });
            scoringUI.showRoundWinner(null);
            jest.advanceTimersByTime(3000);

            // Round 4: P1 wins (final)
            scoringUI.updateScores();
            expect(document.getElementById('roundIndicator').textContent).toBe('Round 4');
            game.handleRoundEnd({ player1Collided: false, player2Collided: true });

            // Show final scores
            scoringUI.showFinalScores();
            const announcement = document.getElementById('winnerAnnouncement');
            expect(announcement.textContent).toContain('Player 1 Wins!');
            expect(announcement.textContent).toContain('2 - 1');

            // Verify complete game state
            const finalScoring = game.getLocalScoring();
            expect(finalScoring.player1Wins).toBe(2);
            expect(finalScoring.player2Wins).toBe(1);
            expect(finalScoring.totalRounds).toBe(4);
            expect(finalScoring.roundHistory).toEqual(['P1', 'P2', 'TIE', 'P1']);
        });
    });
});
