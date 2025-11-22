const { LocalScoring } = require('@/systems/LocalScoring.js');

describe('LocalScoring', () => {
    let localScoring;

    beforeEach(() => {
        localScoring = new LocalScoring();
    });

    describe('constructor', () => {
        it('should initialize with zero scores', () => {
            expect(localScoring.player1Wins).toBe(0);
            expect(localScoring.player2Wins).toBe(0);
            expect(localScoring.currentRound).toBe(1);
            expect(localScoring.totalRounds).toBe(0);
        });

        it('should initialize with empty round history', () => {
            expect(localScoring.roundHistory).toEqual([]);
        });
    });

    describe('incrementScore', () => {
        it('should increment Player 1 score', () => {
            localScoring.incrementScore('P1');
            expect(localScoring.player1Wins).toBe(1);
            expect(localScoring.player2Wins).toBe(0);
            expect(localScoring.totalRounds).toBe(1);
        });

        it('should increment Player 2 score', () => {
            localScoring.incrementScore('P2');
            expect(localScoring.player1Wins).toBe(0);
            expect(localScoring.player2Wins).toBe(1);
            expect(localScoring.totalRounds).toBe(1);
        });

        it('should track round history', () => {
            localScoring.incrementScore('P1');
            localScoring.incrementScore('P2');
            localScoring.incrementScore('P1');
            expect(localScoring.roundHistory).toEqual(['P1', 'P2', 'P1']);
        });

        it('should handle multiple rounds correctly', () => {
            localScoring.incrementScore('P1');
            localScoring.incrementScore('P1');
            localScoring.incrementScore('P2');
            expect(localScoring.player1Wins).toBe(2);
            expect(localScoring.player2Wins).toBe(1);
            expect(localScoring.totalRounds).toBe(3);
        });

        it('should ignore invalid player IDs', () => {
            localScoring.incrementScore('INVALID');
            expect(localScoring.player1Wins).toBe(0);
            expect(localScoring.player2Wins).toBe(0);
            expect(localScoring.totalRounds).toBe(1);
        });
    });

    describe('handleTieGame', () => {
        it('should increment total rounds without changing scores', () => {
            localScoring.handleTieGame();
            expect(localScoring.player1Wins).toBe(0);
            expect(localScoring.player2Wins).toBe(0);
            expect(localScoring.totalRounds).toBe(1);
        });

        it('should add TIE to round history', () => {
            localScoring.handleTieGame();
            expect(localScoring.roundHistory).toEqual(['TIE']);
        });

        it('should handle multiple ties', () => {
            localScoring.handleTieGame();
            localScoring.incrementScore('P1');
            localScoring.handleTieGame();
            expect(localScoring.roundHistory).toEqual(['TIE', 'P1', 'TIE']);
            expect(localScoring.totalRounds).toBe(3);
        });
    });

    describe('getScore', () => {
        it('should return Player 1 score', () => {
            localScoring.player1Wins = 3;
            expect(localScoring.getScore('P1')).toBe(3);
        });

        it('should return Player 2 score', () => {
            localScoring.player2Wins = 5;
            expect(localScoring.getScore('P2')).toBe(5);
        });

        it('should return 0 for invalid player ID', () => {
            expect(localScoring.getScore('INVALID')).toBe(0);
        });
    });

    describe('getScoreDisplay', () => {
        it('should return formatted score string', () => {
            localScoring.player1Wins = 3;
            localScoring.player2Wins = 2;
            expect(localScoring.getScoreDisplay()).toBe('3 - 2');
        });

        it('should handle zero scores', () => {
            expect(localScoring.getScoreDisplay()).toBe('0 - 0');
        });

        it('should handle large scores', () => {
            localScoring.player1Wins = 15;
            localScoring.player2Wins = 12;
            expect(localScoring.getScoreDisplay()).toBe('15 - 12');
        });
    });

    describe('getScoreDetails', () => {
        it('should return complete score information', () => {
            localScoring.player1Wins = 2;
            localScoring.player2Wins = 1;
            localScoring.currentRound = 4;
            localScoring.totalRounds = 3;
            localScoring.roundHistory = ['P1', 'P2', 'P1'];

            const details = localScoring.getScoreDetails();
            expect(details).toEqual({
                player1Wins: 2,
                player2Wins: 1,
                currentRound: 4,
                totalRounds: 3,
                roundHistory: ['P1', 'P2', 'P1']
            });
        });

        it('should return a copy of round history', () => {
            localScoring.roundHistory = ['P1', 'P2'];
            const details = localScoring.getScoreDetails();
            details.roundHistory.push('P1');
            expect(localScoring.roundHistory).toEqual(['P1', 'P2']);
        });
    });

    describe('resetScores', () => {
        it('should reset all scores to zero', () => {
            localScoring.player1Wins = 5;
            localScoring.player2Wins = 3;
            localScoring.currentRound = 9;
            localScoring.totalRounds = 8;
            localScoring.roundHistory = ['P1', 'P2', 'P1'];

            localScoring.resetScores();

            expect(localScoring.player1Wins).toBe(0);
            expect(localScoring.player2Wins).toBe(0);
            expect(localScoring.currentRound).toBe(1);
            expect(localScoring.totalRounds).toBe(0);
            expect(localScoring.roundHistory).toEqual([]);
        });
    });

    describe('nextRound', () => {
        it('should increment current round', () => {
            expect(localScoring.currentRound).toBe(1);
            localScoring.nextRound();
            expect(localScoring.currentRound).toBe(2);
        });

        it('should increment multiple times', () => {
            localScoring.nextRound();
            localScoring.nextRound();
            localScoring.nextRound();
            expect(localScoring.currentRound).toBe(4);
        });
    });

    describe('getLeader', () => {
        it('should return P1 when Player 1 is leading', () => {
            localScoring.player1Wins = 3;
            localScoring.player2Wins = 1;
            expect(localScoring.getLeader()).toBe('P1');
        });

        it('should return P2 when Player 2 is leading', () => {
            localScoring.player1Wins = 2;
            localScoring.player2Wins = 5;
            expect(localScoring.getLeader()).toBe('P2');
        });

        it('should return null when scores are tied', () => {
            localScoring.player1Wins = 3;
            localScoring.player2Wins = 3;
            expect(localScoring.getLeader()).toBe(null);
        });

        it('should return null when both scores are zero', () => {
            expect(localScoring.getLeader()).toBe(null);
        });
    });

    describe('hasLeader', () => {
        it('should return true when Player 1 is leading', () => {
            localScoring.player1Wins = 3;
            localScoring.player2Wins = 1;
            expect(localScoring.hasLeader()).toBe(true);
        });

        it('should return true when Player 2 is leading', () => {
            localScoring.player1Wins = 1;
            localScoring.player2Wins = 3;
            expect(localScoring.hasLeader()).toBe(true);
        });

        it('should return false when scores are tied', () => {
            localScoring.player1Wins = 2;
            localScoring.player2Wins = 2;
            expect(localScoring.hasLeader()).toBe(false);
        });

        it('should return false when both scores are zero', () => {
            expect(localScoring.hasLeader()).toBe(false);
        });
    });

    describe('getWinPercentage', () => {
        it('should calculate Player 1 win percentage', () => {
            localScoring.player1Wins = 3;
            localScoring.totalRounds = 10;
            expect(localScoring.getWinPercentage('P1')).toBe(30);
        });

        it('should calculate Player 2 win percentage', () => {
            localScoring.player2Wins = 7;
            localScoring.totalRounds = 10;
            expect(localScoring.getWinPercentage('P2')).toBe(70);
        });

        it('should return 0 when no rounds played', () => {
            expect(localScoring.getWinPercentage('P1')).toBe(0);
            expect(localScoring.getWinPercentage('P2')).toBe(0);
        });

        it('should round to nearest integer', () => {
            localScoring.player1Wins = 1;
            localScoring.totalRounds = 3;
            expect(localScoring.getWinPercentage('P1')).toBe(33);
        });

        it('should handle 100% win rate', () => {
            localScoring.player1Wins = 5;
            localScoring.totalRounds = 5;
            expect(localScoring.getWinPercentage('P1')).toBe(100);
        });
    });

    describe('getLastRoundWinner', () => {
        it('should return last round winner', () => {
            localScoring.incrementScore('P1');
            localScoring.incrementScore('P2');
            localScoring.incrementScore('P1');
            expect(localScoring.getLastRoundWinner()).toBe('P1');
        });

        it('should return TIE for tie game', () => {
            localScoring.incrementScore('P1');
            localScoring.handleTieGame();
            expect(localScoring.getLastRoundWinner()).toBe('TIE');
        });

        it('should return null when no rounds played', () => {
            expect(localScoring.getLastRoundWinner()).toBe(null);
        });
    });

    describe('exportState', () => {
        it('should export complete state', () => {
            localScoring.player1Wins = 3;
            localScoring.player2Wins = 2;
            localScoring.currentRound = 6;
            localScoring.totalRounds = 5;
            localScoring.roundHistory = ['P1', 'P2', 'P1', 'P1', 'P2'];

            const state = localScoring.exportState();
            expect(state).toEqual({
                player1Wins: 3,
                player2Wins: 2,
                currentRound: 6,
                totalRounds: 5,
                roundHistory: ['P1', 'P2', 'P1', 'P1', 'P2']
            });
        });

        it('should return a copy of round history', () => {
            localScoring.roundHistory = ['P1', 'P2'];
            const state = localScoring.exportState();
            state.roundHistory.push('P1');
            expect(localScoring.roundHistory).toEqual(['P1', 'P2']);
        });
    });

    describe('importState', () => {
        it('should import complete state', () => {
            const state = {
                player1Wins: 4,
                player2Wins: 3,
                currentRound: 8,
                totalRounds: 7,
                roundHistory: ['P1', 'P2', 'P1', 'P2', 'P1', 'P1', 'P2']
            };

            localScoring.importState(state);

            expect(localScoring.player1Wins).toBe(4);
            expect(localScoring.player2Wins).toBe(3);
            expect(localScoring.currentRound).toBe(8);
            expect(localScoring.totalRounds).toBe(7);
            expect(localScoring.roundHistory).toEqual(['P1', 'P2', 'P1', 'P2', 'P1', 'P1', 'P2']);
        });

        it('should handle null state', () => {
            localScoring.player1Wins = 5;
            localScoring.importState(null);
            expect(localScoring.player1Wins).toBe(5);
        });

        it('should handle undefined state', () => {
            localScoring.player1Wins = 5;
            localScoring.importState(undefined);
            expect(localScoring.player1Wins).toBe(5);
        });

        it('should handle partial state with defaults', () => {
            const state = {
                player1Wins: 2
            };

            localScoring.importState(state);

            expect(localScoring.player1Wins).toBe(2);
            expect(localScoring.player2Wins).toBe(0);
            expect(localScoring.currentRound).toBe(1);
            expect(localScoring.totalRounds).toBe(0);
            expect(localScoring.roundHistory).toEqual([]);
        });
    });

    describe('integration scenarios', () => {
        it('should handle a complete game session', () => {
            // Round 1: P1 wins
            localScoring.incrementScore('P1');
            localScoring.nextRound();

            // Round 2: P2 wins
            localScoring.incrementScore('P2');
            localScoring.nextRound();

            // Round 3: Tie
            localScoring.handleTieGame();
            localScoring.nextRound();

            // Round 4: P1 wins
            localScoring.incrementScore('P1');
            localScoring.nextRound();

            expect(localScoring.player1Wins).toBe(2);
            expect(localScoring.player2Wins).toBe(1);
            expect(localScoring.totalRounds).toBe(4);
            expect(localScoring.currentRound).toBe(5);
            expect(localScoring.getLeader()).toBe('P1');
            expect(localScoring.getScoreDisplay()).toBe('2 - 1');
        });

        it('should handle state persistence', () => {
            localScoring.incrementScore('P1');
            localScoring.incrementScore('P2');
            localScoring.incrementScore('P1');

            const state = localScoring.exportState();
            const newScoring = new LocalScoring();
            newScoring.importState(state);

            expect(newScoring.player1Wins).toBe(localScoring.player1Wins);
            expect(newScoring.player2Wins).toBe(localScoring.player2Wins);
            expect(newScoring.roundHistory).toEqual(localScoring.roundHistory);
        });
    });
});
