/**
 * @jest-environment jsdom
 */

const { ModeUI } = require('../../src/ui/ModeUI.js');

describe('ModeUI', () => {
    let modeUI;
    let mockStyleManager;
    let mockGame;
    let mockSurvivalTimer;

    beforeEach(() => {
        // Clear DOM
        document.body.innerHTML = '';
        document.head.innerHTML = '';

        // Create mocks
        mockStyleManager = {
            addStyles: jest.fn(),
        };

        mockGame = {
            getGameState: jest.fn(() => ({
                formattedSurvivalTime: '01:23.45',
                arenaState: {
                    currentSize: 20,
                    timeUntilShrink: 5000,
                    isAtMinimum: false,
                    warningActive: false,
                },
            })),
        };

        mockSurvivalTimer = {
            getCurrentFormattedTime: jest.fn(() => '01:23.45'),
        };

        modeUI = new ModeUI();
    });

    describe('constructor', () => {
        it('should initialize with null dependencies', () => {
            expect(modeUI.styleManager).toBeNull();
            expect(modeUI.game).toBeNull();
            expect(modeUI.survivalTimer).toBeNull();
        });
    });

    describe('initialize', () => {
        it('should set dependencies correctly', () => {
            const dependencies = {
                styleManager: mockStyleManager,
                game: mockGame,
                survivalTimer: mockSurvivalTimer,
            };

            modeUI.initialize(dependencies);

            expect(modeUI.styleManager).toBe(mockStyleManager);
            expect(modeUI.game).toBe(mockGame);
            expect(modeUI.survivalTimer).toBe(mockSurvivalTimer);
        });
    });

    describe('createUI', () => {
        beforeEach(() => {
            modeUI.initialize({
                styleManager: mockStyleManager,
                game: mockGame,
                survivalTimer: mockSurvivalTimer,
            });
        });

        it('should create Time Trial UI for TIME_TRIAL mode', () => {
            modeUI.createUI('TIME_TRIAL');

            const timerElement = document.getElementById('timer-display');
            expect(timerElement).toBeTruthy();
            expect(timerElement.className).toBe('timer-display');
            expect(timerElement.textContent).toBe('00:00.00');
            expect(mockStyleManager.addStyles).toHaveBeenCalledWith(
                'time-trial-styles',
                expect.any(String)
            );
        });

        it('should create Arena Shrink UI for ARENA_SHRINK mode', () => {
            modeUI.createUI('ARENA_SHRINK');

            const timerElement = document.getElementById('arena-timer-display');
            const arenaInfoElement = document.getElementById('arena-info-display');

            expect(timerElement).toBeTruthy();
            expect(arenaInfoElement).toBeTruthy();
            expect(mockStyleManager.addStyles).toHaveBeenCalledWith(
                'arena-shrink-styles',
                expect.any(String)
            );
        });

        it('should handle unknown mode gracefully', () => {
            modeUI.createUI('UNKNOWN_MODE');

            expect(document.getElementById('timer-display')).toBeNull();
            expect(document.getElementById('arena-timer-display')).toBeNull();
        });
    });

    describe('updateDisplay', () => {
        beforeEach(() => {
            modeUI.initialize({
                styleManager: mockStyleManager,
                game: mockGame,
                survivalTimer: mockSurvivalTimer,
            });
        });

        it('should update Time Trial display', () => {
            modeUI.createUI('TIME_TRIAL');
            modeUI.updateDisplay('TIME_TRIAL');

            expect(mockSurvivalTimer.getCurrentFormattedTime).toHaveBeenCalled();
            const timerElement = document.getElementById('timer-display');
            expect(timerElement.textContent).toBe('01:23.45');
        });

        it('should update Arena Shrink display', () => {
            modeUI.createUI('ARENA_SHRINK');
            modeUI.updateDisplay('ARENA_SHRINK');

            expect(mockGame.getGameState).toHaveBeenCalled();
            const timerElement = document.getElementById('arena-timer-display');
            expect(timerElement.textContent).toBe('01:23.45');
        });

        it('should handle unknown mode gracefully', () => {
            modeUI.updateDisplay('UNKNOWN_MODE');
            // Should not throw error
        });
    });

    describe('hideUI', () => {
        beforeEach(() => {
            modeUI.initialize({
                styleManager: mockStyleManager,
                game: mockGame,
                survivalTimer: mockSurvivalTimer,
            });
        });

        it('should hide Time Trial UI', () => {
            modeUI.createUI('TIME_TRIAL');
            modeUI.hideUI('TIME_TRIAL');

            expect(document.getElementById('timer-display')).toBeNull();
        });

        it('should hide Arena Shrink UI', () => {
            modeUI.createUI('ARENA_SHRINK');
            modeUI.hideUI('ARENA_SHRINK');

            expect(document.getElementById('arena-timer-display')).toBeNull();
            expect(document.getElementById('arena-info-display')).toBeNull();
        });

        it('should handle unknown mode gracefully', () => {
            modeUI.hideUI('UNKNOWN_MODE');
            // Should not throw error
        });
    });

    describe('hideAllModeUI', () => {
        beforeEach(() => {
            modeUI.initialize({
                styleManager: mockStyleManager,
                game: mockGame,
                survivalTimer: mockSurvivalTimer,
            });
        });

        it('should hide all mode UI elements', () => {
            modeUI.createUI('TIME_TRIAL');
            modeUI.createUI('ARENA_SHRINK');

            // Create remaining entities display
            const remainingDisplay = document.createElement('div');
            remainingDisplay.id = 'remaining-entities-display';
            document.body.appendChild(remainingDisplay);

            modeUI.hideAllModeUI();

            expect(document.getElementById('timer-display')).toBeNull();
            expect(document.getElementById('arena-timer-display')).toBeNull();
            expect(document.getElementById('arena-info-display')).toBeNull();

            const remainingElement = document.getElementById('remaining-entities-display');
            expect(remainingElement.style.display).toBe('none');
        });
    });

    describe('Time Trial UI', () => {
        beforeEach(() => {
            modeUI.initialize({
                styleManager: mockStyleManager,
                game: mockGame,
                survivalTimer: mockSurvivalTimer,
            });
        });

        describe('createTimeTrialUI', () => {
            it('should not create duplicate timer element', () => {
                modeUI.createTimeTrialUI();
                modeUI.createTimeTrialUI();

                const timerElements = document.querySelectorAll('#timer-display');
                expect(timerElements.length).toBe(1);
            });

            it('should add Time Trial styles', () => {
                modeUI.createTimeTrialUI();
                expect(mockStyleManager.addStyles).toHaveBeenCalledWith(
                    'time-trial-styles',
                    expect.stringContaining('.timer-display')
                );
            });
        });

        describe('updateTimeTrialDisplay', () => {
            it('should update existing timer element', () => {
                modeUI.createTimeTrialUI();
                modeUI.updateTimeTrialDisplay();

                const timerElement = document.getElementById('timer-display');
                expect(timerElement.textContent).toBe('01:23.45');
                expect(mockSurvivalTimer.getCurrentFormattedTime).toHaveBeenCalled();
            });

            it('should create timer element if missing', () => {
                modeUI.updateTimeTrialDisplay();

                const timerElement = document.getElementById('timer-display');
                expect(timerElement).toBeTruthy();
            });

            it('should handle missing survival timer', () => {
                modeUI.survivalTimer = null;
                modeUI.createTimeTrialUI();
                modeUI.updateTimeTrialDisplay();

                const timerElement = document.getElementById('timer-display');
                expect(timerElement.textContent).toBe('00:00.00');
            });
        });

        describe('addTimeTrialStyles', () => {
            it('should handle missing style manager', () => {
                modeUI.styleManager = null;
                expect(() => modeUI.addTimeTrialStyles()).not.toThrow();
            });

            it('should add comprehensive styles', () => {
                modeUI.addTimeTrialStyles();

                const styleCall = mockStyleManager.addStyles.mock.calls[0];
                expect(styleCall[0]).toBe('time-trial-styles');
                expect(styleCall[1]).toContain('.timer-display');
                expect(styleCall[1]).toContain('.new-record');
                expect(styleCall[1]).toContain('@media (max-width: 768px)');
            });
        });
    });

    describe('Arena Shrink UI', () => {
        beforeEach(() => {
            modeUI.initialize({
                styleManager: mockStyleManager,
                game: mockGame,
                survivalTimer: mockSurvivalTimer,
            });
        });

        describe('createArenaShrinkUI', () => {
            it('should create timer and arena info elements', () => {
                modeUI.createArenaShrinkUI();

                const timerElement = document.getElementById('arena-timer-display');
                const arenaInfoElement = document.getElementById('arena-info-display');

                expect(timerElement).toBeTruthy();
                expect(arenaInfoElement).toBeTruthy();
                expect(arenaInfoElement.innerHTML).toContain('Arena: 30x30');
                expect(arenaInfoElement.innerHTML).toContain('Next shrink: 5.0s');
            });

            it('should not create duplicate elements', () => {
                modeUI.createArenaShrinkUI();
                modeUI.createArenaShrinkUI();

                expect(document.querySelectorAll('#arena-timer-display').length).toBe(1);
                expect(document.querySelectorAll('#arena-info-display').length).toBe(1);
            });
        });

        describe('updateArenaShrinkDisplay', () => {
            it('should handle missing game dependency', () => {
                modeUI.game = null;
                expect(() => modeUI.updateArenaShrinkDisplay()).not.toThrow();
            });

            it('should update timer and arena info', () => {
                modeUI.createArenaShrinkUI();
                modeUI.updateArenaShrinkDisplay();

                const timerElement = document.getElementById('arena-timer-display');
                expect(timerElement.textContent).toBe('01:23.45');

                const arenaSizeElement = document.querySelector('.arena-size');
                expect(arenaSizeElement.textContent).toBe('Arena: 20x20');

                const shrinkCountdownElement = document.querySelector('.shrink-countdown');
                expect(shrinkCountdownElement.textContent).toBe('Next shrink: 5.0s');
            });

            it('should handle warning active state', () => {
                mockGame.getGameState.mockReturnValue({
                    formattedSurvivalTime: '01:23.45',
                    arenaState: {
                        currentSize: 15,
                        timeUntilShrink: 2000,
                        isAtMinimum: false,
                        warningActive: true,
                    },
                });

                modeUI.createArenaShrinkUI();
                modeUI.updateArenaShrinkDisplay();

                const shrinkCountdownElement = document.querySelector('.shrink-countdown');
                expect(shrinkCountdownElement.textContent).toBe('Shrinking in: 2.0s');
                expect(shrinkCountdownElement.classList.contains('warning-active')).toBe(true);
            });

            it('should handle final arena state', () => {
                mockGame.getGameState.mockReturnValue({
                    formattedSurvivalTime: '01:23.45',
                    arenaState: {
                        currentSize: 10,
                        timeUntilShrink: 0,
                        isAtMinimum: true,
                        warningActive: false,
                    },
                });

                modeUI.createArenaShrinkUI();
                modeUI.updateArenaShrinkDisplay();

                const shrinkCountdownElement = document.querySelector('.shrink-countdown');
                expect(shrinkCountdownElement.textContent).toBe('FINAL ARENA');
                expect(shrinkCountdownElement.classList.contains('final-arena')).toBe(true);
            });

            it('should handle missing arena info element', () => {
                modeUI.createArenaShrinkUI();
                document.getElementById('arena-info-display').remove();

                expect(() => modeUI.updateArenaShrinkDisplay()).not.toThrow();
            });
        });

        describe('addArenaShrinkStyles', () => {
            it('should handle missing style manager', () => {
                modeUI.styleManager = null;
                expect(() => modeUI.addArenaShrinkStyles()).not.toThrow();
            });

            it('should add comprehensive styles with animations', () => {
                modeUI.addArenaShrinkStyles();

                const styleCall = mockStyleManager.addStyles.mock.calls[0];
                expect(styleCall[0]).toBe('arena-shrink-styles');
                expect(styleCall[1]).toContain('.arena-timer-display');
                expect(styleCall[1]).toContain('.arena-info-display');
                expect(styleCall[1]).toContain('@keyframes warningPulse');
                expect(styleCall[1]).toContain('@keyframes finalArenaPulse');
                expect(styleCall[1]).toContain('@media (max-width: 768px)');
            });
        });
    });

    describe('Final Arena Message', () => {
        beforeEach(() => {
            modeUI.initialize({
                styleManager: mockStyleManager,
                game: mockGame,
                survivalTimer: mockSurvivalTimer,
            });
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        describe('showFinalArenaMessage', () => {
            it('should create and show final arena message', () => {
                modeUI.showFinalArenaMessage();

                const messageElement = document.getElementById('final-arena-message');
                expect(messageElement).toBeTruthy();
                expect(messageElement.innerHTML).toContain('FINAL ARENA');
                expect(messageElement.style.display).toBe('block');
            });

            it('should not create duplicate message element', () => {
                modeUI.showFinalArenaMessage();
                modeUI.showFinalArenaMessage();

                const messageElements = document.querySelectorAll('#final-arena-message');
                expect(messageElements.length).toBe(1);
            });

            it('should auto-hide after 3 seconds', () => {
                modeUI.showFinalArenaMessage();

                const messageElement = document.getElementById('final-arena-message');
                expect(messageElement.style.display).toBe('block');

                jest.advanceTimersByTime(3000);
                expect(messageElement.style.opacity).toBe('0');
            });

            it('should add final arena styles', () => {
                modeUI.showFinalArenaMessage();
                expect(mockStyleManager.addStyles).toHaveBeenCalledWith(
                    'final-arena-styles',
                    expect.any(String)
                );
            });
        });

        describe('hideFinalArenaMessage', () => {
            it('should hide existing message', () => {
                modeUI.showFinalArenaMessage();
                const messageElement = document.getElementById('final-arena-message');

                modeUI.hideFinalArenaMessage();
                expect(messageElement.style.opacity).toBe('0');

                jest.advanceTimersByTime(500);
                expect(messageElement.style.display).toBe('none');
            });

            it('should handle missing message element', () => {
                expect(() => modeUI.hideFinalArenaMessage()).not.toThrow();
            });
        });

        describe('addFinalArenaStyles', () => {
            it('should handle missing style manager', () => {
                modeUI.styleManager = null;
                expect(() => modeUI.addFinalArenaStyles()).not.toThrow();
            });

            it('should add comprehensive styles with animations', () => {
                modeUI.addFinalArenaStyles();

                const styleCall = mockStyleManager.addStyles.mock.calls[0];
                expect(styleCall[0]).toBe('final-arena-styles');
                expect(styleCall[1]).toContain('.final-arena-message');
                expect(styleCall[1]).toContain('@keyframes finalArenaGlow');
                expect(styleCall[1]).toContain('@media (max-width: 768px)');
            });
        });
    });

    describe('Remaining Entities Display', () => {
        beforeEach(() => {
            modeUI.initialize({
                styleManager: mockStyleManager,
                game: mockGame,
                survivalTimer: mockSurvivalTimer,
            });
        });

        describe('updateRemainingEntityDisplay', () => {
            it('should create display element if missing', () => {
                modeUI.updateRemainingEntityDisplay(['player', 'ai_1', 'ai_2']);

                const displayElement = document.getElementById('remaining-entities-display');
                expect(displayElement).toBeTruthy();
                expect(mockStyleManager.addStyles).toHaveBeenCalledWith(
                    'remaining-entities-styles',
                    expect.any(String)
                );
            });

            it('should show correct count and breakdown for multiple entities', () => {
                modeUI.updateRemainingEntityDisplay(['player', 'ai_1', 'ai_2']);

                const displayElement = document.getElementById('remaining-entities-display');
                expect(displayElement.innerHTML).toContain('Remaining: 3');
                expect(displayElement.innerHTML).toContain('2 AIs');
                expect(displayElement.style.display).toBe('block');
            });

            it('should show player as alive when in surviving entities', () => {
                modeUI.updateRemainingEntityDisplay(['player', 'ai_1']);

                const playerStatus = document.querySelector('.player-status');
                expect(playerStatus.classList.contains('alive')).toBe(true);
                expect(playerStatus.textContent).toBe('You');
            });

            it('should show player as dead when not in surviving entities', () => {
                modeUI.updateRemainingEntityDisplay(['ai_1', 'ai_2']);

                const playerStatus = document.querySelector('.player-status');
                expect(playerStatus.classList.contains('dead')).toBe(true);
                expect(playerStatus.textContent).toBe('You');
            });

            it('should handle single AI correctly', () => {
                modeUI.updateRemainingEntityDisplay(['player', 'ai_1']);

                const displayElement = document.getElementById('remaining-entities-display');
                expect(displayElement.innerHTML).toContain('1 AI');
            });

            it('should hide display when only one entity remains', () => {
                modeUI.updateRemainingEntityDisplay(['player']);

                const displayElement = document.getElementById('remaining-entities-display');
                expect(displayElement.style.display).toBe('none');
            });

            it('should reuse existing display element', () => {
                modeUI.updateRemainingEntityDisplay(['player', 'ai_1', 'ai_2']);
                modeUI.updateRemainingEntityDisplay(['player', 'ai_1']);

                const displayElements = document.querySelectorAll('#remaining-entities-display');
                expect(displayElements.length).toBe(1);
            });
        });

        describe('addRemainingEntitiesStyles', () => {
            it('should handle missing style manager', () => {
                modeUI.styleManager = null;
                expect(() => modeUI.addRemainingEntitiesStyles()).not.toThrow();
            });

            it('should add comprehensive styles', () => {
                modeUI.addRemainingEntitiesStyles();

                const styleCall = mockStyleManager.addStyles.mock.calls[0];
                expect(styleCall[0]).toBe('remaining-entities-styles');
                expect(styleCall[1]).toContain('.remaining-entities-display');
                expect(styleCall[1]).toContain('.player-status.alive');
                expect(styleCall[1]).toContain('.player-status.dead');
                expect(styleCall[1]).toContain('@media (max-width: 768px)');
            });
        });

        describe('hideRemainingEntitiesDisplay', () => {
            it('should hide existing display element', () => {
                modeUI.updateRemainingEntityDisplay(['player', 'ai_1']);
                modeUI.hideRemainingEntitiesDisplay();

                const displayElement = document.getElementById('remaining-entities-display');
                expect(displayElement.style.display).toBe('none');
            });

            it('should handle missing display element', () => {
                expect(() => modeUI.hideRemainingEntitiesDisplay()).not.toThrow();
            });
        });
    });

    describe('integration scenarios', () => {
        beforeEach(() => {
            modeUI.initialize({
                styleManager: mockStyleManager,
                game: mockGame,
                survivalTimer: mockSurvivalTimer,
            });
        });

        it('should handle complete Time Trial flow', () => {
            modeUI.createUI('TIME_TRIAL');
            modeUI.updateDisplay('TIME_TRIAL');
            modeUI.hideUI('TIME_TRIAL');

            expect(document.getElementById('timer-display')).toBeNull();
        });

        it('should handle complete Arena Shrink flow', () => {
            modeUI.createUI('ARENA_SHRINK');
            modeUI.updateDisplay('ARENA_SHRINK');
            modeUI.showFinalArenaMessage();
            modeUI.hideUI('ARENA_SHRINK');

            expect(document.getElementById('arena-timer-display')).toBeNull();
            expect(document.getElementById('arena-info-display')).toBeNull();
        });

        it('should handle multiple mode UI elements simultaneously', () => {
            modeUI.createUI('TIME_TRIAL');
            modeUI.createUI('ARENA_SHRINK');
            modeUI.updateRemainingEntityDisplay(['player', 'ai_1', 'ai_2']);

            expect(document.getElementById('timer-display')).toBeTruthy();
            expect(document.getElementById('arena-timer-display')).toBeTruthy();
            expect(document.getElementById('remaining-entities-display')).toBeTruthy();

            modeUI.hideAllModeUI();

            expect(document.getElementById('timer-display')).toBeNull();
            expect(document.getElementById('arena-timer-display')).toBeNull();
            expect(document.getElementById('remaining-entities-display').style.display).toBe(
                'none'
            );
        });
    });

    describe('error handling', () => {
        it('should handle DOM manipulation errors gracefully', () => {
            modeUI.initialize({
                styleManager: mockStyleManager,
                game: mockGame,
                survivalTimer: mockSurvivalTimer,
            });

            // Test with existing element to avoid createElement error
            const existingElement = document.createElement('div');
            existingElement.id = 'timer-display';
            document.body.appendChild(existingElement);

            expect(() => modeUI.createUI('TIME_TRIAL')).not.toThrow();
        });

        it('should handle missing dependencies gracefully', () => {
            // Initialize with partial dependencies
            modeUI.initialize({
                styleManager: null,
                game: null,
                survivalTimer: null,
            });

            expect(() => {
                modeUI.updateDisplay('TIME_TRIAL');
                modeUI.updateDisplay('ARENA_SHRINK');
            }).not.toThrow();
        });

        it('should handle malformed game state', () => {
            mockGame.getGameState.mockReturnValue({});
            modeUI.initialize({
                styleManager: mockStyleManager,
                game: mockGame,
                survivalTimer: mockSurvivalTimer,
            });

            expect(() => modeUI.updateDisplay('ARENA_SHRINK')).not.toThrow();
        });
    });
});
