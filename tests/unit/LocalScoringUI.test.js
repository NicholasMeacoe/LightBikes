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

const { LocalScoringUI } = require('@/ui/LocalScoringUI.js');
const { LocalScoring } = require('@/systems/LocalScoring.js');

describe('LocalScoringUI', () => {
    let localScoring;
    let localScoringUI;

    beforeEach(() => {
        // Clear any existing elements
        document.body.innerHTML = '';

        localScoring = new LocalScoring();
        localScoringUI = new LocalScoringUI(localScoring);
    });

    afterEach(() => {
        if (localScoringUI) {
            localScoringUI.destroy();
        }
    });

    describe('constructor', () => {
        it('should create score elements', () => {
            expect(document.getElementById('player1Score')).toBeTruthy();
            expect(document.getElementById('player2Score')).toBeTruthy();
            expect(document.getElementById('roundIndicator')).toBeTruthy();
            expect(document.getElementById('winnerAnnouncement')).toBeTruthy();
        });

        it('should initialize as initialized', () => {
            expect(localScoringUI.isInitialized).toBe(true);
        });

        it('should add CSS styles', () => {
            expect(document.getElementById('localScoringStyles')).toBeTruthy();
        });

        it('should hide winner announcement by default', () => {
            const announcement = document.getElementById('winnerAnnouncement');
            expect(announcement.style.display).toBe('none');
        });
    });

    describe('updateScores', () => {
        it('should display Player 1 score', () => {
            localScoring.player1Wins = 3;
            localScoringUI.updateScores();

            const player1Score = document.getElementById('player1Score');
            expect(player1Score.textContent).toBe('P1: 3');
            expect(player1Score.style.display).toBe('block');
        });

        it('should display Player 2 score', () => {
            localScoring.player2Wins = 2;
            localScoringUI.updateScores();

            const player2Score = document.getElementById('player2Score');
            expect(player2Score.textContent).toBe('P2: 2');
            expect(player2Score.style.display).toBe('block');
        });

        it('should display current round', () => {
            localScoring.currentRound = 5;
            localScoringUI.updateScores();

            const roundIndicator = document.getElementById('roundIndicator');
            expect(roundIndicator.textContent).toBe('Round 5');
            expect(roundIndicator.style.display).toBe('block');
        });

        it('should hide winner announcement during gameplay', () => {
            localScoringUI.updateScores();

            const announcement = document.getElementById('winnerAnnouncement');
            expect(announcement.style.display).toBe('none');
        });

        it('should handle zero scores', () => {
            localScoringUI.updateScores();

            expect(document.getElementById('player1Score').textContent).toBe('P1: 0');
            expect(document.getElementById('player2Score').textContent).toBe('P2: 0');
        });
    });

    describe('showRoundWinner', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should show Player 1 winner announcement', () => {
            localScoringUI.showRoundWinner('P1');

            const announcement = document.getElementById('winnerAnnouncement');
            expect(announcement.textContent).toBe('Player 1 Wins!');
            expect(announcement.style.display).toBe('block');
            expect(announcement.classList.contains('player1-wins')).toBe(true);
        });

        it('should show Player 2 winner announcement', () => {
            localScoringUI.showRoundWinner('P2');

            const announcement = document.getElementById('winnerAnnouncement');
            expect(announcement.textContent).toBe('Player 2 Wins!');
            expect(announcement.style.display).toBe('block');
            expect(announcement.classList.contains('player2-wins')).toBe(true);
        });

        it('should show tie announcement', () => {
            localScoringUI.showRoundWinner(null);

            const announcement = document.getElementById('winnerAnnouncement');
            expect(announcement.textContent).toBe('Tie!');
            expect(announcement.style.display).toBe('block');
            expect(announcement.classList.contains('tie')).toBe(true);
        });

        it('should auto-hide announcement after 3 seconds', () => {
            localScoringUI.showRoundWinner('P1');

            const announcement = document.getElementById('winnerAnnouncement');
            expect(announcement.style.display).toBe('block');

            jest.advanceTimersByTime(3000);

            expect(announcement.style.display).toBe('none');
        });

        it('should update scores before showing winner', () => {
            localScoring.player1Wins = 2;
            localScoring.player2Wins = 1;
            localScoringUI.showRoundWinner('P1');

            expect(document.getElementById('player1Score').textContent).toBe('P1: 2');
            expect(document.getElementById('player2Score').textContent).toBe('P2: 1');
        });
    });

    describe('showFinalScores', () => {
        it('should show Player 1 as overall winner', () => {
            localScoring.player1Wins = 5;
            localScoring.player2Wins = 3;
            localScoringUI.showFinalScores();

            const announcement = document.getElementById('winnerAnnouncement');
            expect(announcement.style.display).toBe('block');
            expect(announcement.classList.contains('player1-wins')).toBe(true);
            expect(announcement.textContent).toContain('Player 1 Wins!');
            expect(announcement.textContent).toContain('5 - 3');
        });

        it('should show Player 2 as overall winner', () => {
            localScoring.player1Wins = 2;
            localScoring.player2Wins = 4;
            localScoringUI.showFinalScores();

            const announcement = document.getElementById('winnerAnnouncement');
            expect(announcement.style.display).toBe('block');
            expect(announcement.classList.contains('player2-wins')).toBe(true);
            expect(announcement.textContent).toContain('Player 2 Wins!');
            expect(announcement.textContent).toContain('2 - 4');
        });

        it('should show tie game', () => {
            localScoring.player1Wins = 3;
            localScoring.player2Wins = 3;
            localScoringUI.showFinalScores();

            const announcement = document.getElementById('winnerAnnouncement');
            expect(announcement.style.display).toBe('block');
            expect(announcement.classList.contains('tie')).toBe(true);
            expect(announcement.textContent).toContain('Tie Game!');
            expect(announcement.textContent).toContain('3 - 3');
        });

        it('should update scores before showing final results', () => {
            localScoring.player1Wins = 4;
            localScoring.player2Wins = 2;
            localScoring.currentRound = 7;
            localScoringUI.showFinalScores();

            expect(document.getElementById('player1Score').textContent).toBe('P1: 4');
            expect(document.getElementById('player2Score').textContent).toBe('P2: 2');
            expect(document.getElementById('roundIndicator').textContent).toBe('Round 7');
        });
    });

    describe('hideScores', () => {
        it('should hide all score elements', () => {
            localScoringUI.updateScores();
            localScoringUI.hideScores();

            expect(document.getElementById('player1Score').style.display).toBe('none');
            expect(document.getElementById('player2Score').style.display).toBe('none');
            expect(document.getElementById('roundIndicator').style.display).toBe('none');
            expect(document.getElementById('winnerAnnouncement').style.display).toBe('none');
        });

        it('should handle being called when not initialized', () => {
            const newUI = new LocalScoringUI(localScoring);
            newUI.isInitialized = false;
            expect(() => newUI.hideScores()).not.toThrow();
        });
    });

    describe('showScores', () => {
        it('should show score elements', () => {
            localScoringUI.hideScores();
            localScoringUI.showScores();

            expect(document.getElementById('player1Score').style.display).toBe('block');
            expect(document.getElementById('player2Score').style.display).toBe('block');
            expect(document.getElementById('roundIndicator').style.display).toBe('block');
        });

        it('should update scores when showing', () => {
            localScoring.player1Wins = 3;
            localScoring.player2Wins = 2;
            localScoringUI.showScores();

            expect(document.getElementById('player1Score').textContent).toBe('P1: 3');
            expect(document.getElementById('player2Score').textContent).toBe('P2: 2');
        });
    });

    describe('reset', () => {
        it('should hide scores and update display', () => {
            localScoring.player1Wins = 5;
            localScoringUI.showRoundWinner('P1');

            localScoring.resetScores();
            localScoringUI.reset();

            expect(document.getElementById('player1Score').textContent).toBe('P1: 0');
            expect(document.getElementById('player2Score').textContent).toBe('P2: 0');
        });
    });

    describe('destroy', () => {
        it('should remove all score elements', () => {
            localScoringUI.destroy();

            expect(document.getElementById('player1Score')).toBeFalsy();
            expect(document.getElementById('player2Score')).toBeFalsy();
            expect(document.getElementById('roundIndicator')).toBeFalsy();
            expect(document.getElementById('winnerAnnouncement')).toBeFalsy();
        });

        it('should remove CSS styles', () => {
            localScoringUI.destroy();
            expect(document.getElementById('localScoringStyles')).toBeFalsy();
        });

        it('should mark as not initialized', () => {
            localScoringUI.destroy();
            expect(localScoringUI.isInitialized).toBe(false);
        });

        it('should clear score elements object', () => {
            localScoringUI.destroy();
            expect(Object.keys(localScoringUI.scoreElements).length).toBe(0);
        });
    });

    describe('CSS styles', () => {
        it('should not add duplicate styles', () => {
            const newUI = new LocalScoringUI(localScoring);
            const styles = document.querySelectorAll('#localScoringStyles');
            expect(styles.length).toBe(1);
            newUI.destroy();
        });

        it('should apply correct classes to elements', () => {
            expect(document.getElementById('player1Score').className).toContain('player1-score');
            expect(document.getElementById('player2Score').className).toContain('player2-score');
            expect(document.getElementById('roundIndicator').className).toContain(
                'round-indicator'
            );
            expect(document.getElementById('winnerAnnouncement').className).toContain(
                'winner-announcement'
            );
        });
    });

    describe('integration scenarios', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should handle a complete round sequence', () => {
            // Start of round
            localScoringUI.updateScores();
            expect(document.getElementById('roundIndicator').textContent).toBe('Round 1');

            // Player 1 wins
            localScoring.incrementScore('P1');
            localScoringUI.showRoundWinner('P1');
            expect(document.getElementById('player1Score').textContent).toBe('P1: 1');

            // Auto-hide winner announcement
            jest.advanceTimersByTime(3000);
            expect(document.getElementById('winnerAnnouncement').style.display).toBe('none');

            // Next round
            localScoring.nextRound();
            localScoringUI.updateScores();
            expect(document.getElementById('roundIndicator').textContent).toBe('Round 2');
        });

        it('should handle game completion', () => {
            // Play several rounds
            localScoring.incrementScore('P1');
            localScoring.nextRound();
            localScoring.incrementScore('P2');
            localScoring.nextRound();
            localScoring.incrementScore('P1');
            localScoring.nextRound();

            // Show final scores
            localScoringUI.showFinalScores();

            const announcement = document.getElementById('winnerAnnouncement');
            expect(announcement.style.display).toBe('block');
            expect(announcement.textContent).toContain('Player 1 Wins!');
            expect(announcement.textContent).toContain('2 - 1');
        });

        it('should handle reset and restart', () => {
            // Play some rounds
            localScoring.incrementScore('P1');
            localScoring.incrementScore('P2');
            localScoringUI.updateScores();

            // Reset
            localScoring.resetScores();
            localScoringUI.reset();

            // Verify reset state
            expect(document.getElementById('player1Score').textContent).toBe('P1: 0');
            expect(document.getElementById('player2Score').textContent).toBe('P2: 0');
            expect(document.getElementById('roundIndicator').textContent).toBe('Round 1');
        });
    });
});
