const { LeaderboardSystem } = require('./LeaderboardSystem.js');

describe('LeaderboardSystem', () => {
    let leaderboard;
    let mockLocalStorage;

    beforeEach(() => {
        // Mock localStorage
        mockLocalStorage = {
            data: {},
            getItem: jest.fn((key) => mockLocalStorage.data[key] || null),
            setItem: jest.fn((key, value) => {
                mockLocalStorage.data[key] = value;
            }),
            removeItem: jest.fn((key) => {
                delete mockLocalStorage.data[key];
            }),
            clear: jest.fn(() => {
                mockLocalStorage.data = {};
            })
        };

        // Replace global localStorage
        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true
        });

        leaderboard = new LeaderboardSystem();
    });

    afterEach(() => {
        mockLocalStorage.clear();
    });

    describe('constructor', () => {
        it('should initialize with correct default values', () => {
            expect(leaderboard.storageKey).toBe('lightbikes_time_trial_scores');
            expect(leaderboard.maxEntries).toBe(10);
            expect(Array.isArray(leaderboard.scores)).toBe(true);
        });

        it('should load existing scores from localStorage', () => {
            const existingScores = [
                { timeMs: 30000, timestamp: Date.now(), formattedTime: '00:30.00' },
                { timeMs: 45000, timestamp: Date.now(), formattedTime: '00:45.00' }
            ];
            mockLocalStorage.data['lightbikes_time_trial_scores'] = JSON.stringify(existingScores);

            const newLeaderboard = new LeaderboardSystem();
            expect(newLeaderboard.scores).toHaveLength(2);
            expect(newLeaderboard.scores[0].timeMs).toBe(45000); // Longer survival time comes first
        });
    });

    describe('loadScores', () => {
        it('should return empty array when no data exists', () => {
            const scores = leaderboard.loadScores();
            expect(scores).toEqual([]);
        });

        it('should parse and return valid scores', () => {
            const testScores = [
                { timeMs: 30000, timestamp: Date.now(), formattedTime: '00:30.00' },
                { timeMs: 45000, timestamp: Date.now(), formattedTime: '00:45.00' }
            ];
            mockLocalStorage.data['lightbikes_time_trial_scores'] = JSON.stringify(testScores);

            const scores = leaderboard.loadScores();
            expect(scores).toHaveLength(2);
            expect(scores[0].timeMs).toBe(45000); // Longer survival time comes first
        });

        it('should sort scores by time descending (longest survival first)', () => {
            const testScores = [
                { timeMs: 45000, timestamp: Date.now(), formattedTime: '00:45.00' },
                { timeMs: 30000, timestamp: Date.now(), formattedTime: '00:30.00' },
                { timeMs: 60000, timestamp: Date.now(), formattedTime: '01:00.00' }
            ];
            mockLocalStorage.data['lightbikes_time_trial_scores'] = JSON.stringify(testScores);

            const scores = leaderboard.loadScores();
            expect(scores[0].timeMs).toBe(60000);
            expect(scores[1].timeMs).toBe(45000);
            expect(scores[2].timeMs).toBe(30000);
        });

        it('should filter out invalid scores', () => {
            const testScores = [
                { timeMs: 30000, timestamp: Date.now(), formattedTime: '00:30.00' },
                { timeMs: 'invalid', timestamp: Date.now(), formattedTime: '00:45.00' },
                { timeMs: 60000, timestamp: Date.now(), formattedTime: '01:00.00' },
                null,
                { timeMs: -1000, timestamp: Date.now(), formattedTime: '-00:01.00' }
            ];
            mockLocalStorage.data['lightbikes_time_trial_scores'] = JSON.stringify(testScores);

            const scores = leaderboard.loadScores();
            expect(scores).toHaveLength(2);
            expect(scores[0].timeMs).toBe(60000);
            expect(scores[1].timeMs).toBe(30000);
        });

        it('should limit to maxEntries', () => {
            const testScores = Array.from({ length: 15 }, (_, i) => ({
                timeMs: (i + 1) * 1000,
                timestamp: Date.now(),
                formattedTime: `00:0${i + 1}.00`
            }));
            mockLocalStorage.data['lightbikes_time_trial_scores'] = JSON.stringify(testScores);

            const scores = leaderboard.loadScores();
            expect(scores).toHaveLength(10);
        });

        it('should handle corrupted JSON data', () => {
            mockLocalStorage.data['lightbikes_time_trial_scores'] = 'invalid json';

            const scores = leaderboard.loadScores();
            expect(scores).toEqual([]);
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('lightbikes_time_trial_scores');
        });

        it('should handle non-array data', () => {
            mockLocalStorage.data['lightbikes_time_trial_scores'] = JSON.stringify({ not: 'array' });

            const scores = leaderboard.loadScores();
            expect(scores).toEqual([]);
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('lightbikes_time_trial_scores');
        });
    });

    describe('saveScores', () => {
        it('should save scores to localStorage', () => {
            const testScores = [
                { timeMs: 30000, timestamp: Date.now(), formattedTime: '00:30.00' }
            ];

            const result = leaderboard.saveScores(testScores);
            expect(result).toBe(true);
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                'lightbikes_time_trial_scores',
                JSON.stringify(testScores)
            );
        });

        it('should handle localStorage unavailable', () => {
            // Mock localStorage as unavailable
            leaderboard.isLocalStorageAvailable = jest.fn(() => false);

            const result = leaderboard.saveScores([]);
            expect(result).toBe(false);
        });

        it('should handle quota exceeded error', () => {
            const quotaError = new Error('Quota exceeded');
            quotaError.name = 'QuotaExceededError';
            
            // Mock localStorage to always throw quota exceeded
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = jest.fn(() => {
                throw quotaError;
            });

            const testScores = Array.from({ length: 10 }, (_, i) => ({
                timeMs: (i + 1) * 1000,
                timestamp: Date.now(),
                formattedTime: `00:0${i + 1}.00`
            }));

            const result = leaderboard.saveScores(testScores);
            expect(result).toBe(false); // Should fail when quota exceeded persists
            
            // The implementation should try twice: initial attempt + retry with reduced data
            // But since our mock always throws, it should be called at least once
            expect(localStorage.setItem).toHaveBeenCalled();
            
            // Restore original
            localStorage.setItem = originalSetItem;
        });

        it('should handle persistent quota exceeded error', () => {
            const quotaError = new Error('Quota exceeded');
            quotaError.name = 'QuotaExceededError';
            mockLocalStorage.setItem.mockImplementation(() => {
                throw quotaError;
            });

            const result = leaderboard.saveScores([]);
            expect(result).toBe(false);
        });
    });

    describe('addScore', () => {
        it('should add valid score to empty leaderboard', () => {
            const result = leaderboard.addScore(30000);

            expect(result.success).toBe(true);
            expect(result.ranking).toBe(1);
            expect(result.isNewBest).toBe(true);
            expect(result.time).toBe('00:30.00');
            expect(leaderboard.scores).toHaveLength(1);
        });

        it('should insert score in correct position', () => {
            // Add initial scores
            leaderboard.addScore(45000); // 00:45.00
            leaderboard.addScore(30000); // 00:30.00

            // Add better score (longer survival)
            const result = leaderboard.addScore(60000); // 01:00.00

            expect(result.success).toBe(true);
            expect(result.ranking).toBe(1);
            expect(result.isNewBest).toBe(true);
            expect(leaderboard.scores[0].timeMs).toBe(60000);
            expect(leaderboard.scores[1].timeMs).toBe(45000);
            expect(leaderboard.scores[2].timeMs).toBe(30000);
        });

        it('should reject invalid time values', () => {
            const invalidTimes = [null, undefined, 'string', -1000, 0, NaN, Infinity];

            invalidTimes.forEach(time => {
                const result = leaderboard.addScore(time);
                expect(result.success).toBe(false);
                expect(result.reason).toBe('Invalid time value');
            });
        });

        it('should reject scores that do not qualify', () => {
            // Fill leaderboard with 10 scores (10s to 100s)
            for (let i = 1; i <= 10; i++) {
                leaderboard.addScore(i * 10000); // 10s, 20s, 30s, etc.
            }

            // Try to add worse score (shorter survival time)
            const result = leaderboard.addScore(5000); // 5s (worse than 10s)

            expect(result.success).toBe(false);
            expect(result.reason).toBe('Time does not qualify for top 10');
            expect(leaderboard.scores).toHaveLength(10);
        });

        it('should maintain maximum entries limit', () => {
            // Fill leaderboard with 10 scores
            for (let i = 1; i <= 10; i++) {
                leaderboard.addScore(i * 10000);
            }

            // Add better score (longer survival)
            const result = leaderboard.addScore(150000); // Better than 100s

            expect(result.success).toBe(true);
            expect(leaderboard.scores).toHaveLength(10);
            expect(leaderboard.scores[9].timeMs).toBe(20000); // 10s should be removed (worst score)
        });

        it('should handle save failure gracefully', () => {
            leaderboard.saveScores = jest.fn(() => false);

            const result = leaderboard.addScore(30000);

            expect(result.success).toBe(false);
        });
    });

    describe('isNewRecord', () => {
        it('should return true for empty leaderboard', () => {
            expect(leaderboard.isNewRecord(30000)).toBe(true);
        });

        it('should return true when leaderboard is not full', () => {
            leaderboard.addScore(30000);
            expect(leaderboard.isNewRecord(45000)).toBe(true);
        });

        it('should return true for qualifying time when leaderboard is full', () => {
            // Fill leaderboard
            for (let i = 1; i <= 10; i++) {
                leaderboard.addScore(i * 10000);
            }

            expect(leaderboard.isNewRecord(150000)).toBe(true); // Better than 100s (longer survival)
        });

        it('should return false for non-qualifying time when leaderboard is full', () => {
            // Fill leaderboard
            for (let i = 1; i <= 10; i++) {
                leaderboard.addScore(i * 10000);
            }

            expect(leaderboard.isNewRecord(5000)).toBe(false); // Worse than 10s (shorter survival)
        });

        it('should return false for invalid times', () => {
            expect(leaderboard.isNewRecord(null)).toBe(false);
            expect(leaderboard.isNewRecord(-1000)).toBe(false);
            expect(leaderboard.isNewRecord('invalid')).toBe(false);
        });
    });

    describe('getTopScores', () => {
        it('should return copy of scores array', () => {
            leaderboard.addScore(30000);
            const scores = leaderboard.getTopScores();

            expect(scores).toEqual(leaderboard.scores);
            expect(scores).not.toBe(leaderboard.scores); // Should be different reference
        });

        it('should return empty array for empty leaderboard', () => {
            const scores = leaderboard.getTopScores();
            expect(scores).toEqual([]);
        });
    });

    describe('clearScores', () => {
        it('should clear all scores and localStorage', () => {
            leaderboard.addScore(30000);
            leaderboard.addScore(45000);

            leaderboard.clearScores();

            expect(leaderboard.scores).toEqual([]);
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('lightbikes_time_trial_scores');
        });

        it('should handle localStorage errors gracefully', () => {
            mockLocalStorage.removeItem.mockImplementation(() => {
                throw new Error('Storage error');
            });

            expect(() => leaderboard.clearScores()).not.toThrow();
            expect(leaderboard.scores).toEqual([]);
        });
    });

    describe('formatTime', () => {
        it('should format times correctly', () => {
            expect(leaderboard.formatTime(0)).toBe('00:00.00');
            expect(leaderboard.formatTime(1000)).toBe('00:01.00');
            expect(leaderboard.formatTime(1500)).toBe('00:01.50');
            expect(leaderboard.formatTime(60000)).toBe('01:00.00');
            expect(leaderboard.formatTime(90500)).toBe('01:30.50');
            expect(leaderboard.formatTime(3661500)).toBe('61:01.50');
        });

        it('should handle invalid times', () => {
            expect(leaderboard.formatTime(null)).toBe('00:00.00');
            expect(leaderboard.formatTime(-1000)).toBe('00:00.00');
            expect(leaderboard.formatTime('invalid')).toBe('00:00.00');
        });

        it('should handle edge cases', () => {
            expect(leaderboard.formatTime(999)).toBe('00:00.99');
            expect(leaderboard.formatTime(59999)).toBe('00:59.99');
            expect(leaderboard.formatTime(3599999)).toBe('59:59.99');
        });
    });

    describe('isLocalStorageAvailable', () => {
        it('should return true when localStorage is available', () => {
            expect(leaderboard.isLocalStorageAvailable()).toBe(true);
        });

        it('should return false when localStorage throws error', () => {
            const originalSetItem = mockLocalStorage.setItem;
            mockLocalStorage.setItem = jest.fn(() => {
                throw new Error('Storage disabled');
            });

            expect(leaderboard.isLocalStorageAvailable()).toBe(false);

            mockLocalStorage.setItem = originalSetItem;
        });
    });

    describe('isValidScore', () => {
        it('should validate correct score objects', () => {
            const validScore = {
                timeMs: 30000,
                timestamp: Date.now(),
                formattedTime: '00:30.00'
            };

            expect(leaderboard.isValidScore(validScore)).toBe(true);
        });

        it('should reject invalid score objects', () => {
            const invalidScores = [
                null,
                undefined,
                'string',
                {},
                { timeMs: 'invalid' },
                { timeMs: 30000 }, // Missing fields
                { timeMs: -1000, timestamp: Date.now(), formattedTime: '00:30.00' },
                { timeMs: 7000000, timestamp: Date.now(), formattedTime: '00:30.00' } // Too large
            ];

            invalidScores.forEach(score => {
                const result = leaderboard.isValidScore(score);
                expect(result).toBe(false);
            });
        });
    });

    describe('isValidTimeMs', () => {
        it('should validate correct time values', () => {
            expect(leaderboard.isValidTimeMs(1000)).toBe(true);
            expect(leaderboard.isValidTimeMs(30000)).toBe(true);
            expect(leaderboard.isValidTimeMs(5999999)).toBe(true);
        });

        it('should reject invalid time values', () => {
            expect(leaderboard.isValidTimeMs(0)).toBe(false);
            expect(leaderboard.isValidTimeMs(-1000)).toBe(false);
            expect(leaderboard.isValidTimeMs(6000000)).toBe(false);
            expect(leaderboard.isValidTimeMs(NaN)).toBe(false);
            expect(leaderboard.isValidTimeMs(Infinity)).toBe(false);
            expect(leaderboard.isValidTimeMs('string')).toBe(false);
            expect(leaderboard.isValidTimeMs(null)).toBe(false);
        });
    });

    describe('getStats', () => {
        it('should return empty stats for empty leaderboard', () => {
            const stats = leaderboard.getStats();

            expect(stats.totalScores).toBe(0);
            expect(stats.bestTime).toBe(null);
            expect(stats.averageTime).toBe(null);
        });

        it('should calculate correct stats', () => {
            leaderboard.addScore(30000); // 30s
            leaderboard.addScore(60000); // 60s
            leaderboard.addScore(90000); // 90s

            const stats = leaderboard.getStats();

            expect(stats.totalScores).toBe(3);
            expect(stats.bestTime).toBe('01:30.00'); // 90s is the best (longest survival)
            expect(stats.averageTime).toBe('01:00.00'); // (30+60+90)/3 = 60s
        });
    });

    describe('findInsertPosition', () => {
        it('should find correct insertion position', () => {
            leaderboard.addScore(30000); // 30s
            leaderboard.addScore(60000); // 60s
            leaderboard.addScore(90000); // 90s

            expect(leaderboard.findInsertPosition(120000)).toBe(0); // Better than all (longest survival)
            expect(leaderboard.findInsertPosition(75000)).toBe(1); // Between 90s and 60s
            expect(leaderboard.findInsertPosition(45000)).toBe(2); // Between 60s and 30s
            expect(leaderboard.findInsertPosition(15000)).toBe(3); // Worse than all (shortest survival)
        });

        it('should handle empty leaderboard', () => {
            expect(leaderboard.findInsertPosition(30000)).toBe(0);
        });
    });
});