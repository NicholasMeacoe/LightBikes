const { AchievementSystem } = require('./AchievementSystem.js');

describe('AchievementSystem', () => {
    let achievementSystem;
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

        achievementSystem = new AchievementSystem();
    });

    afterEach(() => {
        mockLocalStorage.clear();
    });

    describe('constructor', () => {
        it('should initialize with correct default values', () => {
            expect(achievementSystem.storageKey).toBe('lightbikes_achievements');
            expect(achievementSystem.milestones).toHaveLength(5);
            expect(achievementSystem.unlockedAchievements).toBeInstanceOf(Set);
            expect(achievementSystem.sessionAchievements).toBeInstanceOf(Set);
        });

        it('should have correct milestone definitions', () => {
            const expectedMilestones = [
                { seconds: 30, message: "First Steps!", description: "Survived 30 seconds" },
                { seconds: 60, message: "Getting Warmed Up!", description: "Survived 1 minute" },
                { seconds: 120, message: "Steady Progress!", description: "Survived 2 minutes" },
                { seconds: 300, message: "Master of Survival!", description: "Survived 5 minutes" },
                { seconds: 600, message: "Legendary Pilot!", description: "Survived 10 minutes" }
            ];

            expectedMilestones.forEach((expected, index) => {
                expect(achievementSystem.milestones[index]).toEqual(expected);
            });
        });

        it('should load existing progress from localStorage', () => {
            const existingProgress = [30, 60];
            mockLocalStorage.data['lightbikes_achievements'] = JSON.stringify(existingProgress);

            const newAchievementSystem = new AchievementSystem();
            expect(newAchievementSystem.unlockedAchievements.has(30)).toBe(true);
            expect(newAchievementSystem.unlockedAchievements.has(60)).toBe(true);
            expect(newAchievementSystem.unlockedAchievements.has(120)).toBe(false);
        });
    });

    describe('loadProgress', () => {
        it('should return empty Set when no data exists', () => {
            const progress = achievementSystem.loadProgress();
            expect(progress).toBeInstanceOf(Set);
            expect(progress.size).toBe(0);
        });

        it('should load valid progress data', () => {
            const progressData = [30, 60, 120];
            mockLocalStorage.data['lightbikes_achievements'] = JSON.stringify(progressData);

            const progress = achievementSystem.loadProgress();
            expect(progress.has(30)).toBe(true);
            expect(progress.has(60)).toBe(true);
            expect(progress.has(120)).toBe(true);
            expect(progress.size).toBe(3);
        });

        it('should filter out invalid milestone values', () => {
            const progressData = [30, 999, 60, 'invalid', 120];
            mockLocalStorage.data['lightbikes_achievements'] = JSON.stringify(progressData);

            const progress = achievementSystem.loadProgress();
            expect(progress.has(30)).toBe(true);
            expect(progress.has(60)).toBe(true);
            expect(progress.has(120)).toBe(true);
            expect(progress.has(999)).toBe(false);
            expect(progress.size).toBe(3);
        });

        it('should handle corrupted data gracefully', () => {
            mockLocalStorage.data['lightbikes_achievements'] = 'invalid json';

            const progress = achievementSystem.loadProgress();
            expect(progress).toBeInstanceOf(Set);
            expect(progress.size).toBe(0);
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('lightbikes_achievements');
        });

        it('should handle non-array data', () => {
            mockLocalStorage.data['lightbikes_achievements'] = JSON.stringify({ invalid: 'object' });

            const progress = achievementSystem.loadProgress();
            expect(progress).toBeInstanceOf(Set);
            expect(progress.size).toBe(0);
        });
    });

    describe('saveProgress', () => {
        it('should save progress to localStorage', () => {
            achievementSystem.unlockedAchievements.add(30);
            achievementSystem.unlockedAchievements.add(60);

            const result = achievementSystem.saveProgress();
            expect(result).toBe(true);
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                'lightbikes_achievements',
                JSON.stringify([30, 60])
            );
        });

        it('should handle localStorage errors gracefully', () => {
            mockLocalStorage.setItem.mockImplementation(() => {
                throw new Error('Storage error');
            });

            const result = achievementSystem.saveProgress();
            expect(result).toBe(false);
        });
    });

    describe('checkMilestone', () => {
        it('should detect new milestone achievements', () => {
            const achievements = achievementSystem.checkMilestone(35);
            
            expect(achievements).toHaveLength(1);
            expect(achievements[0].seconds).toBe(30);
            expect(achievements[0].message).toBe("First Steps!");
            expect(achievements[0].timeAchieved).toBe(35);
            expect(achievementSystem.unlockedAchievements.has(30)).toBe(true);
        });

        it('should detect multiple milestones at once', () => {
            const achievements = achievementSystem.checkMilestone(125);
            
            expect(achievements).toHaveLength(3); // 30, 60, 120 seconds
            expect(achievements.map(a => a.seconds)).toEqual([30, 60, 120]);
            expect(achievementSystem.unlockedAchievements.has(30)).toBe(true);
            expect(achievementSystem.unlockedAchievements.has(60)).toBe(true);
            expect(achievementSystem.unlockedAchievements.has(120)).toBe(true);
        });

        it('should not unlock already unlocked achievements', () => {
            // First unlock
            achievementSystem.checkMilestone(35);
            expect(achievementSystem.unlockedAchievements.has(30)).toBe(true);

            // Second check should not unlock again
            const achievements = achievementSystem.checkMilestone(40);
            expect(achievements).toHaveLength(0);
        });

        it('should not unlock achievements already earned this session', () => {
            achievementSystem.checkMilestone(35);
            achievementSystem.sessionAchievements.add(30);

            const achievements = achievementSystem.checkMilestone(40);
            expect(achievements).toHaveLength(0);
        });

        it('should handle invalid time values', () => {
            expect(achievementSystem.checkMilestone(-5)).toEqual([]);
            expect(achievementSystem.checkMilestone('invalid')).toEqual([]);
            expect(achievementSystem.checkMilestone(NaN)).toEqual([]);
            expect(achievementSystem.checkMilestone(Infinity)).toEqual([]);
        });

        it('should save progress when new achievements are unlocked', () => {
            const saveProgressSpy = jest.spyOn(achievementSystem, 'saveProgress');
            
            achievementSystem.checkMilestone(35);
            expect(saveProgressSpy).toHaveBeenCalled();
        });

        it('should not save progress when no new achievements', () => {
            const saveProgressSpy = jest.spyOn(achievementSystem, 'saveProgress');
            
            achievementSystem.checkMilestone(15); // Below first milestone
            expect(saveProgressSpy).not.toHaveBeenCalled();
        });
    });

    describe('getAllMilestones', () => {
        it('should return all milestones with unlock status', () => {
            achievementSystem.unlockedAchievements.add(30);
            achievementSystem.unlockedAchievements.add(120);

            const milestones = achievementSystem.getAllMilestones();
            
            expect(milestones).toHaveLength(5);
            expect(milestones[0].unlocked).toBe(true); // 30 seconds
            expect(milestones[1].unlocked).toBe(false); // 60 seconds
            expect(milestones[2].unlocked).toBe(true); // 120 seconds
            expect(milestones[3].unlocked).toBe(false); // 300 seconds
            expect(milestones[4].unlocked).toBe(false); // 600 seconds
        });

        it('should include formatted time for each milestone', () => {
            const milestones = achievementSystem.getAllMilestones();
            
            expect(milestones[0].formattedTime).toBe('00:30');
            expect(milestones[1].formattedTime).toBe('01:00');
            expect(milestones[2].formattedTime).toBe('02:00');
            expect(milestones[3].formattedTime).toBe('05:00');
            expect(milestones[4].formattedTime).toBe('10:00');
        });
    });

    describe('getUnlockedAchievements', () => {
        it('should return only unlocked achievements', () => {
            achievementSystem.unlockedAchievements.add(30);
            achievementSystem.unlockedAchievements.add(300);

            const unlocked = achievementSystem.getUnlockedAchievements();
            
            expect(unlocked).toHaveLength(2);
            expect(unlocked[0].seconds).toBe(30);
            expect(unlocked[1].seconds).toBe(300);
        });

        it('should return empty array when no achievements unlocked', () => {
            const unlocked = achievementSystem.getUnlockedAchievements();
            expect(unlocked).toEqual([]);
        });
    });

    describe('getNextMilestone', () => {
        it('should return first milestone when none unlocked', () => {
            const next = achievementSystem.getNextMilestone();
            
            expect(next.seconds).toBe(30);
            expect(next.message).toBe("First Steps!");
        });

        it('should return next milestone after unlocked ones', () => {
            achievementSystem.unlockedAchievements.add(30);
            achievementSystem.unlockedAchievements.add(60);

            const next = achievementSystem.getNextMilestone();
            expect(next.seconds).toBe(120);
        });

        it('should return null when all milestones unlocked', () => {
            achievementSystem.milestones.forEach(milestone => {
                achievementSystem.unlockedAchievements.add(milestone.seconds);
            });

            const next = achievementSystem.getNextMilestone();
            expect(next).toBeNull();
        });
    });

    describe('getProgress', () => {
        it('should return correct progress statistics', () => {
            achievementSystem.unlockedAchievements.add(30);
            achievementSystem.unlockedAchievements.add(60);

            const progress = achievementSystem.getProgress();
            
            expect(progress.totalMilestones).toBe(5);
            expect(progress.unlockedCount).toBe(2);
            expect(progress.progressPercentage).toBe(40);
            expect(progress.allUnlocked).toBe(false);
        });

        it('should handle all unlocked case', () => {
            achievementSystem.milestones.forEach(milestone => {
                achievementSystem.unlockedAchievements.add(milestone.seconds);
            });

            const progress = achievementSystem.getProgress();
            expect(progress.progressPercentage).toBe(100);
            expect(progress.allUnlocked).toBe(true);
        });
    });

    describe('resetSession', () => {
        it('should clear session achievements', () => {
            achievementSystem.sessionAchievements.add(30);
            achievementSystem.sessionAchievements.add(60);

            achievementSystem.resetSession();
            expect(achievementSystem.sessionAchievements.size).toBe(0);
        });
    });

    describe('clearProgress', () => {
        it('should clear all progress data', () => {
            achievementSystem.unlockedAchievements.add(30);
            achievementSystem.sessionAchievements.add(60);

            achievementSystem.clearProgress();
            
            expect(achievementSystem.unlockedAchievements.size).toBe(0);
            expect(achievementSystem.sessionAchievements.size).toBe(0);
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('lightbikes_achievements');
        });
    });

    describe('isMilestoneUnlocked', () => {
        it('should return correct unlock status', () => {
            achievementSystem.unlockedAchievements.add(30);

            expect(achievementSystem.isMilestoneUnlocked(30)).toBe(true);
            expect(achievementSystem.isMilestoneUnlocked(60)).toBe(false);
        });
    });

    describe('formatTime', () => {
        it('should format time correctly', () => {
            expect(achievementSystem.formatTime(30000)).toBe('00:30');
            expect(achievementSystem.formatTime(90000)).toBe('01:30');
            expect(achievementSystem.formatTime(3600000)).toBe('60:00');
        });

        it('should handle invalid inputs', () => {
            expect(achievementSystem.formatTime(-1000)).toBe('00:00');
            expect(achievementSystem.formatTime('invalid')).toBe('00:00');
            expect(achievementSystem.formatTime(NaN)).toBe('00:00');
            expect(achievementSystem.formatTime(Infinity)).toBe('00:00');
        });
    });

    describe('isLocalStorageAvailable', () => {
        it('should return true when localStorage is available', () => {
            expect(achievementSystem.isLocalStorageAvailable()).toBe(true);
        });

        it('should return false when localStorage throws error', () => {
            mockLocalStorage.setItem.mockImplementation(() => {
                throw new Error('Storage not available');
            });

            expect(achievementSystem.isLocalStorageAvailable()).toBe(false);
        });
    });

    describe('getDebugInfo', () => {
        it('should return comprehensive debug information', () => {
            achievementSystem.unlockedAchievements.add(30);
            achievementSystem.sessionAchievements.add(60);

            const debugInfo = achievementSystem.getDebugInfo();
            
            expect(debugInfo.totalMilestones).toBe(5);
            expect(debugInfo.unlockedCount).toBe(1);
            expect(debugInfo.sessionAchievements).toEqual([60]);
            expect(debugInfo.storageAvailable).toBe(true);
            expect(debugInfo.nextMilestone.seconds).toBe(60);
        });
    });

    describe('milestone timing accuracy', () => {
        it('should detect milestones at exact thresholds', () => {
            const freshSystem = new AchievementSystem();
            expect(freshSystem.checkMilestone(30)).toHaveLength(1);
            expect(freshSystem.checkMilestone(60)).toHaveLength(1); // Only 60, since 30 already unlocked
            expect(freshSystem.checkMilestone(120)).toHaveLength(1); // Only 120, since 30 and 60 already unlocked
            expect(freshSystem.checkMilestone(300)).toHaveLength(1); // Only 300
            expect(freshSystem.checkMilestone(600)).toHaveLength(1); // Only 600
        });

        it('should detect multiple milestones in single call', () => {
            const freshSystem = new AchievementSystem();
            const achievements = freshSystem.checkMilestone(125); // Should unlock 30, 60, 120
            expect(achievements).toHaveLength(3);
            expect(achievements.map(a => a.seconds)).toEqual([30, 60, 120]);
        });

        it('should not detect milestones below thresholds', () => {
            const freshSystem = new AchievementSystem();
            expect(freshSystem.checkMilestone(29.99)).toHaveLength(0);
            expect(freshSystem.checkMilestone(59.99)).toHaveLength(1); // Should unlock 30-second milestone
            expect(freshSystem.checkMilestone(119.99)).toHaveLength(1); // Should unlock 60-second milestone (30 already unlocked)
        });
    });

    describe('persistence integration', () => {
        it('should maintain progress across instances', () => {
            // First instance unlocks achievements
            achievementSystem.checkMilestone(125);
            
            // Create new instance
            const newSystem = new AchievementSystem();
            
            expect(newSystem.unlockedAchievements.has(30)).toBe(true);
            expect(newSystem.unlockedAchievements.has(60)).toBe(true);
            expect(newSystem.unlockedAchievements.has(120)).toBe(true);
        });

        it('should handle localStorage unavailability gracefully', () => {
            // Mock localStorage as unavailable
            Object.defineProperty(window, 'localStorage', {
                value: undefined,
                writable: true
            });

            const systemWithoutStorage = new AchievementSystem();
            const achievements = systemWithoutStorage.checkMilestone(35);
            
            expect(achievements).toHaveLength(1);
            expect(systemWithoutStorage.unlockedAchievements.has(30)).toBe(true);
        });
    });
});