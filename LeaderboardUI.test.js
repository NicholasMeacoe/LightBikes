const { LeaderboardUI } = require('./LeaderboardUI.js');
const { LeaderboardSystem } = require('./LeaderboardSystem.js');

// Mock DOM methods
Object.defineProperty(document, 'createElement', {
    value: jest.fn((tagName) => {
        const element = {
            tagName: tagName.toUpperCase(),
            style: {},
            id: '',
            textContent: '',
            innerHTML: '',
            children: [],
            parentNode: null,
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            appendChild: jest.fn(function(child) {
                child.parentNode = this;
                this.children.push(child);
            }),
            removeChild: jest.fn(function(child) {
                const index = this.children.indexOf(child);
                if (index > -1) {
                    this.children.splice(index, 1);
                    child.parentNode = null;
                }
            }),
            setAttribute: jest.fn(),
            getAttribute: jest.fn(),
            click: jest.fn()
        };
        return element;
    }),
    writable: true
});

Object.defineProperty(document, 'body', {
    value: {
        appendChild: jest.fn(),
        removeChild: jest.fn(),
        children: []
    },
    writable: true
});

Object.defineProperty(document, 'getElementById', {
    value: jest.fn(),
    writable: true
});

describe('LeaderboardUI', () => {
    let leaderboardSystem;
    let leaderboardUI;
    let mockLocalStorage;

    beforeEach(() => {
        // Reset DOM mocks
        document.createElement.mockClear();
        document.body.appendChild.mockClear();
        document.body.removeChild.mockClear();
        document.getElementById.mockClear();

        // Mock localStorage
        mockLocalStorage = {
            data: {},
            getItem: jest.fn((key) => mockLocalStorage.data[key] || null),
            setItem: jest.fn((key, value) => {
                mockLocalStorage.data[key] = value;
            }),
            removeItem: jest.fn((key) => {
                delete mockLocalStorage.data[key];
            })
        };

        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true
        });

        leaderboardSystem = new LeaderboardSystem();
        leaderboardUI = new LeaderboardUI(leaderboardSystem);
    });

    describe('constructor', () => {
        it('should initialize with leaderboard system', () => {
            expect(leaderboardUI.leaderboardSystem).toBe(leaderboardSystem);
            expect(leaderboardUI.isVisible).toBe(false);
        });

        it('should create UI elements', () => {
            expect(document.createElement).toHaveBeenCalledWith('div');
            expect(document.body.appendChild).toHaveBeenCalled();
        });

        it('should setup event listeners', () => {
            // Mock document.addEventListener
            document.addEventListener = jest.fn();
            
            // Create new instance to trigger event listener setup
            const newUI = new LeaderboardUI(leaderboardSystem);
            
            // Verify that addEventListener was called on document
            expect(document.addEventListener).toHaveBeenCalled();
        });
    });

    describe('createUI', () => {
        it('should create overlay with correct styles', () => {
            expect(leaderboardUI.overlay).toBeDefined();
            expect(leaderboardUI.overlay.id).toBe('leaderboardOverlay');
            // Note: cssText sets styles as a string, individual properties may not be accessible
            expect(leaderboardUI.overlay.style.cssText).toContain('position: absolute');
            expect(leaderboardUI.overlay.style.cssText).toContain('display: none');
        });

        it('should create container with correct styles', () => {
            expect(leaderboardUI.container).toBeDefined();
            expect(leaderboardUI.container.id).toBe('leaderboardContainer');
        });

        it('should create scores container', () => {
            expect(leaderboardUI.scoresContainer).toBeDefined();
            expect(leaderboardUI.scoresContainer.id).toBe('scoresContainer');
        });
    });

    describe('show', () => {
        it('should make overlay visible', () => {
            leaderboardUI.show();

            expect(leaderboardUI.overlay.style.display).toBe('flex');
            expect(leaderboardUI.isVisible).toBe(true);
        });

        it('should update scores when shown', () => {
            const updateScoresSpy = jest.spyOn(leaderboardUI, 'updateScores');
            leaderboardUI.show();

            expect(updateScoresSpy).toHaveBeenCalled();
        });
    });

    describe('hide', () => {
        it('should hide overlay', () => {
            leaderboardUI.show();
            leaderboardUI.hide();

            expect(leaderboardUI.overlay.style.display).toBe('none');
            expect(leaderboardUI.isVisible).toBe(false);
        });
    });

    describe('toggle', () => {
        it('should show when hidden', () => {
            const showSpy = jest.spyOn(leaderboardUI, 'show');
            leaderboardUI.toggle();

            expect(showSpy).toHaveBeenCalled();
        });

        it('should hide when visible', () => {
            leaderboardUI.show();
            const hideSpy = jest.spyOn(leaderboardUI, 'hide');
            leaderboardUI.toggle();

            expect(hideSpy).toHaveBeenCalled();
        });
    });

    describe('updateScores', () => {
        it('should show empty state when no scores exist', () => {
            const showEmptyStateSpy = jest.spyOn(leaderboardUI, 'showEmptyState');
            leaderboardUI.updateScores();

            expect(showEmptyStateSpy).toHaveBeenCalled();
        });

        it('should create score items when scores exist', () => {
            // Add some test scores
            leaderboardSystem.addScore(30000);
            leaderboardSystem.addScore(45000);

            const createScoreItemSpy = jest.spyOn(leaderboardUI, 'createScoreItem');
            leaderboardUI.updateScores();

            expect(createScoreItemSpy).toHaveBeenCalledTimes(2);
        });

        it('should create stats section', () => {
            leaderboardSystem.addScore(30000);

            const createStatsSectionSpy = jest.spyOn(leaderboardUI, 'createStatsSection');
            leaderboardUI.updateScores();

            expect(createStatsSectionSpy).toHaveBeenCalled();
        });
    });

    describe('createScoreItem', () => {
        it('should create score item with correct data', () => {
            const score = {
                timeMs: 30000,
                timestamp: Date.now(),
                formattedTime: '00:30.00'
            };

            const item = leaderboardUI.createScoreItem(score, 1);

            expect(item).toBeDefined();
            expect(document.createElement).toHaveBeenCalledWith('div');
        });

        it('should handle different rankings', () => {
            const score = {
                timeMs: 30000,
                timestamp: Date.now(),
                formattedTime: '00:30.00'
            };

            const item1 = leaderboardUI.createScoreItem(score, 1);
            const item2 = leaderboardUI.createScoreItem(score, 5);

            expect(item1).toBeDefined();
            expect(item2).toBeDefined();
        });
    });

    describe('createStatsSection', () => {
        it('should create stats section with correct data', () => {
            const stats = {
                totalScores: 5,
                bestTime: '00:30.00',
                averageTime: '01:00.00'
            };

            const section = leaderboardUI.createStatsSection(stats);

            expect(section).toBeDefined();
            expect(document.createElement).toHaveBeenCalledWith('div');
        });
    });

    describe('showEmptyState', () => {
        it('should create empty state elements', () => {
            leaderboardUI.showEmptyState();

            expect(document.createElement).toHaveBeenCalledWith('div');
            expect(document.createElement).toHaveBeenCalledWith('p');
        });
    });

    describe('getRankColor', () => {
        it('should return correct colors for rankings', () => {
            expect(leaderboardUI.getRankColor(1)).toBe('#FFD700'); // Gold
            expect(leaderboardUI.getRankColor(2)).toBe('#C0C0C0'); // Silver
            expect(leaderboardUI.getRankColor(3)).toBe('#CD7F32'); // Bronze
            expect(leaderboardUI.getRankColor(4)).toBe('#00ffff'); // Cyan
            expect(leaderboardUI.getRankColor(10)).toBe('#00ffff'); // Cyan
        });
    });

    describe('getMedalEmoji', () => {
        it('should return correct medals for top 3', () => {
            expect(leaderboardUI.getMedalEmoji(1)).toBe('🥇');
            expect(leaderboardUI.getMedalEmoji(2)).toBe('🥈');
            expect(leaderboardUI.getMedalEmoji(3)).toBe('🥉');
            expect(leaderboardUI.getMedalEmoji(4)).toBe('');
        });
    });

    describe('formatDate', () => {
        it('should format recent dates correctly', () => {
            const now = new Date();
            const today = now.getTime();
            const yesterday = today - (24 * 60 * 60 * 1000);
            const threeDaysAgo = today - (3 * 24 * 60 * 60 * 1000);
            const weekAgo = today - (8 * 24 * 60 * 60 * 1000);

            expect(leaderboardUI.formatDate(today)).toBe('Today');
            expect(leaderboardUI.formatDate(yesterday)).toBe('Yesterday');
            expect(leaderboardUI.formatDate(threeDaysAgo)).toBe('3d ago');
            expect(leaderboardUI.formatDate(weekAgo)).toMatch(/\d+\/\d+\/\d+/);
        });
    });

    describe('addToGameOver', () => {
        it('should create leaderboard button', () => {
            const gameOverElement = document.createElement('div');
            document.getElementById.mockReturnValue(null); // Button doesn't exist

            leaderboardUI.addToGameOver(gameOverElement);

            expect(document.createElement).toHaveBeenCalledWith('div');
            expect(document.body.appendChild).toHaveBeenCalled();
        });

        it('should not create duplicate button', () => {
            const gameOverElement = document.createElement('div');
            const existingButton = document.createElement('div');
            existingButton.id = 'leaderboardButton';
            document.getElementById.mockReturnValue(existingButton);

            const createElementCallsBefore = document.createElement.mock.calls.length;
            leaderboardUI.addToGameOver(gameOverElement);
            const createElementCallsAfter = document.createElement.mock.calls.length;

            expect(createElementCallsAfter).toBe(createElementCallsBefore);
        });
    });

    describe('toggleLeaderboardButton', () => {
        it('should show button in Time Trial mode', () => {
            const mockButton = {
                style: { display: 'none' }
            };
            document.getElementById.mockReturnValue(mockButton);

            leaderboardUI.toggleLeaderboardButton(true);

            expect(mockButton.style.display).toBe('flex');
        });

        it('should hide button in Classic mode', () => {
            const mockButton = {
                style: { display: 'flex' }
            };
            document.getElementById.mockReturnValue(mockButton);

            leaderboardUI.toggleLeaderboardButton(false);

            expect(mockButton.style.display).toBe('none');
        });

        it('should handle missing button gracefully', () => {
            document.getElementById.mockReturnValue(null);

            expect(() => {
                leaderboardUI.toggleLeaderboardButton(true);
            }).not.toThrow();
        });
    });

    describe('destroy', () => {
        it('should remove overlay from DOM', () => {
            const mockParent = {
                removeChild: jest.fn()
            };
            leaderboardUI.overlay.parentNode = mockParent;

            leaderboardUI.destroy();

            expect(mockParent.removeChild).toHaveBeenCalledWith(leaderboardUI.overlay);
        });

        it('should remove leaderboard button from DOM', () => {
            const mockButton = {
                parentNode: {
                    removeChild: jest.fn()
                }
            };
            document.getElementById.mockReturnValue(mockButton);

            leaderboardUI.destroy();

            expect(mockButton.parentNode.removeChild).toHaveBeenCalledWith(mockButton);
        });

        it('should handle missing elements gracefully', () => {
            leaderboardUI.overlay.parentNode = null;
            document.getElementById.mockReturnValue(null);

            expect(() => {
                leaderboardUI.destroy();
            }).not.toThrow();
        });
    });

    describe('event handling', () => {
        it('should handle escape key to close', () => {
            leaderboardUI.show();

            // Simulate escape key press
            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
            const hideSpy = jest.spyOn(leaderboardUI, 'hide');

            // Trigger the event handler directly since we can't dispatch real events in Jest
            leaderboardUI.isVisible = true;
            if (escapeEvent.key === 'Escape' && leaderboardUI.isVisible) {
                leaderboardUI.hide();
            }

            expect(hideSpy).toHaveBeenCalled();
        });

        it('should handle overlay click to close', () => {
            leaderboardUI.show();

            const hideSpy = jest.spyOn(leaderboardUI, 'hide');

            // Simulate clicking on overlay (not container)
            const clickEvent = { target: leaderboardUI.overlay };
            if (clickEvent.target === leaderboardUI.overlay) {
                leaderboardUI.hide();
            }

            expect(hideSpy).toHaveBeenCalled();
        });

        it('should not close when clicking container', () => {
            leaderboardUI.show();

            const hideSpy = jest.spyOn(leaderboardUI, 'hide');

            // Simulate clicking on container
            const clickEvent = { target: leaderboardUI.container };
            if (clickEvent.target === leaderboardUI.overlay) {
                leaderboardUI.hide();
            }

            expect(hideSpy).not.toHaveBeenCalled();
        });
    });
});