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

const { PlayerController } = require('@/utils/controls.js');
const { Game } = require('@/core/game.js');
const { MultiplayerGame } = require('@/multiplayer/MultiplayerGame.js');

describe('PlayerController', () => {
    let playerController;
    let game;

    beforeEach(() => {
        // Setup DOM environment
        document.body.innerHTML = '';

        // Create game instance
        game = new Game();

        // Create player controller
        playerController = new PlayerController(game);
    });

    afterEach(() => {
        if (playerController) {
            playerController.cleanup();
        }
    });

    describe('keyboard pause controls', () => {
        beforeEach(() => {
            // Initialize the controller to set up event listeners
            playerController.init();
        });

        it('should pause game when p key is pressed', () => {
            // Arrange
            expect(game.isPaused).toBe(false);

            // Act
            const event = new KeyboardEvent('keydown', { key: 'p' });
            document.dispatchEvent(event);

            // Assert
            expect(game.isPaused).toBe(true);
        });

        it('should pause game when Escape key is pressed', () => {
            // Arrange
            expect(game.isPaused).toBe(false);

            // Act
            const event = new KeyboardEvent('keydown', { key: 'Escape' });
            document.dispatchEvent(event);

            // Assert
            expect(game.isPaused).toBe(true);
        });

        it('should toggle pause when p key is pressed multiple times', () => {
            // Arrange
            expect(game.isPaused).toBe(false);

            // Act - first press
            let event = new KeyboardEvent('keydown', { key: 'p' });
            document.dispatchEvent(event);
            expect(game.isPaused).toBe(true);

            // Act - second press
            event = new KeyboardEvent('keydown', { key: 'p' });
            document.dispatchEvent(event);

            // Assert
            expect(game.isPaused).toBe(false);
        });

        it('should toggle pause when Escape key is pressed multiple times', () => {
            // Arrange
            expect(game.isPaused).toBe(false);

            // Act - first press
            let event = new KeyboardEvent('keydown', { key: 'Escape' });
            document.dispatchEvent(event);
            expect(game.isPaused).toBe(true);

            // Act - second press
            event = new KeyboardEvent('keydown', { key: 'Escape' });
            document.dispatchEvent(event);

            // Assert
            expect(game.isPaused).toBe(false);
        });

        it('should not interfere with existing direction controls', () => {
            // Arrange
            const initialDirection = { ...game.playerDirection };

            // Act - pause game
            const pauseEvent = new KeyboardEvent('keydown', { key: 'p' });
            document.dispatchEvent(pauseEvent);

            // Act - try to change direction while paused
            const directionEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
            document.dispatchEvent(directionEvent);

            // Assert - direction should still change (controls work independently of pause state)
            expect(game.playerDirection).not.toEqual(initialDirection);
            expect(game.isPaused).toBe(true);
        });
    });

    describe('UI button pause controls', () => {
        beforeEach(async () => {
            // Setup resume button in DOM
            document.body.innerHTML = '<div id="resumeButton">Resume</div>';

            // Initialize the controller to set up event listeners
            playerController.init();

            // Wait for setupUIEventListeners to complete
            await new Promise((resolve) => setTimeout(resolve, 10));
        });

        it('should resume game when resume button is clicked', () => {
            // Arrange
            game.pause();
            expect(game.isPaused).toBe(true);

            // Act
            const resumeButton = document.getElementById('resumeButton');
            const event = new MouseEvent('click', { bubbles: true });
            resumeButton.dispatchEvent(event);

            // Assert
            expect(game.isPaused).toBe(false);
        });

        it('should resume game when resume button is touched', () => {
            // Arrange
            game.pause();
            expect(game.isPaused).toBe(true);

            // Act
            const resumeButton = document.getElementById('resumeButton');
            // Create a touch event that's compatible with jsdom
            const event = new Event('touchstart', { bubbles: true });
            Object.defineProperty(event, 'target', { value: resumeButton });
            resumeButton.dispatchEvent(event);

            // Assert
            expect(game.isPaused).toBe(false);
        });

        it('should prevent default behavior and stop propagation when resume button is clicked', () => {
            // Arrange
            game.pause();
            expect(game.isPaused).toBe(true);

            // Act
            const resumeButton = document.getElementById('resumeButton');
            const event = new MouseEvent('click', { bubbles: true, cancelable: true });
            resumeButton.dispatchEvent(event);

            // Assert - event should have preventDefault called and game should resume
            expect(event.defaultPrevented).toBe(true);
            expect(game.isPaused).toBe(false);
        });

        it('should prevent default behavior and stop propagation when resume button is touched', () => {
            // Arrange
            game.pause();
            expect(game.isPaused).toBe(true);

            // Act
            const resumeButton = document.getElementById('resumeButton');
            // Create a touch event that's compatible with jsdom
            const event = new Event('touchstart', { bubbles: true, cancelable: true });
            Object.defineProperty(event, 'target', { value: resumeButton });
            resumeButton.dispatchEvent(event);

            // Assert - event should have preventDefault called and game should resume
            expect(event.defaultPrevented).toBe(true);
            expect(game.isPaused).toBe(false);
        });

        it('should handle multiple resume button clicks gracefully', () => {
            // Arrange
            game.pause();
            expect(game.isPaused).toBe(true);

            // Act - multiple clicks
            const resumeButton = document.getElementById('resumeButton');
            const event1 = new MouseEvent('click', { bubbles: true });
            const event2 = new MouseEvent('click', { bubbles: true });

            resumeButton.dispatchEvent(event1);
            resumeButton.dispatchEvent(event2);

            // Assert - should remain resumed after multiple clicks
            expect(game.isPaused).toBe(false);
        });

        it('should not affect other UI elements', () => {
            // Arrange
            document.body.innerHTML += '<div id="otherButton">Other</div>';
            let otherButtonClicked = false;

            document.getElementById('otherButton').addEventListener('click', () => {
                otherButtonClicked = true;
            });

            // Act
            const otherButton = document.getElementById('otherButton');
            const event = new MouseEvent('click', { bubbles: true });
            otherButton.dispatchEvent(event);

            // Assert - other buttons should work normally
            expect(otherButtonClicked).toBe(true);
            expect(game.isPaused).toBe(false); // Should not affect pause state
        });
    });

    describe('Error Handling and Edge Cases', () => {
        beforeEach(() => {
            playerController.init();
        });

        it('should handle pause attempts during game over gracefully', () => {
            // Arrange
            game.gameOver = true;
            expect(game.isPaused).toBe(false);

            // Act - try to pause during game over
            const event = new KeyboardEvent('keydown', { key: 'p' });
            document.dispatchEvent(event);

            // Assert - should remain unpaused
            expect(game.isPaused).toBe(false);
        });

        it('should handle resume attempts when not paused gracefully', () => {
            // Arrange
            document.body.innerHTML = '<div id="resumeButton">Resume</div>';
            playerController.init();

            // Wait for event listeners to be set up
            return new Promise((resolve) => {
                setTimeout(() => {
                    expect(game.isPaused).toBe(false);

                    // Act - try to resume when not paused
                    const resumeButton = document.getElementById('resumeButton');
                    const event = new MouseEvent('click', { bubbles: true });
                    resumeButton.dispatchEvent(event);

                    // Assert - should remain unpaused
                    expect(game.isPaused).toBe(false);
                    resolve();
                }, 10);
            });
        });

        it('should handle rapid keyboard pause inputs gracefully', () => {
            // Arrange
            expect(game.isPaused).toBe(false);

            // Act - rapid pause key presses
            for (let i = 0; i < 10; i++) {
                const event = new KeyboardEvent('keydown', { key: 'p' });
                document.dispatchEvent(event);
            }

            // Assert - should end up paused (odd number of toggles)
            expect(game.isPaused).toBe(false); // 10 toggles = back to original state
        });

        it('should handle mixed pause key inputs gracefully', () => {
            // Arrange
            expect(game.isPaused).toBe(false);

            // Act - mix of p and Escape keys
            const pEvent = new KeyboardEvent('keydown', { key: 'p' });
            const escEvent = new KeyboardEvent('keydown', { key: 'Escape' });

            document.dispatchEvent(pEvent); // pause
            expect(game.isPaused).toBe(true);

            document.dispatchEvent(escEvent); // resume
            expect(game.isPaused).toBe(false);

            document.dispatchEvent(pEvent); // pause again
            expect(game.isPaused).toBe(true);
        });

        it('should handle resume button clicks during game over gracefully', () => {
            // Arrange
            document.body.innerHTML = '<div id="resumeButton">Resume</div>';
            playerController.init();

            return new Promise((resolve) => {
                setTimeout(() => {
                    game.pause();
                    game.gameOver = true;
                    expect(game.isPaused).toBe(true);

                    // Act - try to resume during game over
                    const resumeButton = document.getElementById('resumeButton');
                    const event = new MouseEvent('click', { bubbles: true });
                    resumeButton.dispatchEvent(event);

                    // Assert - should remain paused due to game over
                    expect(game.isPaused).toBe(true);
                    resolve();
                }, 10);
            });
        });
    });

    describe('Multiplayer Mode', () => {
        let multiplayerGame;

        beforeEach(() => {
            // Clean up any existing event listeners
            document.removeEventListener('keydown', () => {});
            document.removeEventListener('keyup', () => {});

            multiplayerGame = new MultiplayerGame();
            playerController = new PlayerController(multiplayerGame);
            playerController.init();
        });

        describe('mode switching', () => {
            it('should enable multiplayer mode', () => {
                expect(playerController.isInMultiplayerMode()).toBe(false);

                playerController.enableMultiplayerMode();

                expect(playerController.isInMultiplayerMode()).toBe(true);
                expect(playerController.getDualControlScheme()).toBeTruthy();
            });

            it('should disable multiplayer mode', () => {
                playerController.enableMultiplayerMode();
                expect(playerController.isInMultiplayerMode()).toBe(true);

                playerController.disableMultiplayerMode();

                expect(playerController.isInMultiplayerMode()).toBe(false);
                expect(playerController.getDualControlScheme()).toBe(null);
            });

            it('should reset dual control scheme when disabling multiplayer', () => {
                playerController.enableMultiplayerMode();
                const dualControls = playerController.getDualControlScheme();

                // Simulate some input state
                dualControls.handleKeyDown({ code: 'ArrowUp' });
                expect(dualControls.activeKeys.size).toBe(1);

                playerController.disableMultiplayerMode();

                // Should have reset the state
                expect(playerController.getDualControlScheme()).toBe(null);
            });
        });

        describe('single player input handling', () => {
            it('should handle single player input when not in multiplayer mode', () => {
                const spy = jest.spyOn(multiplayerGame, 'changePlayerDirection');

                const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
                document.dispatchEvent(event);

                expect(spy).toHaveBeenCalledWith('ArrowUp');
            });

            it('should trigger turn sound for single player input', () => {
                window.audioManager = { playTurnSound: jest.fn() };
                jest.spyOn(multiplayerGame, 'changePlayerDirection').mockReturnValue(true);

                const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
                document.dispatchEvent(event);

                expect(window.audioManager.playTurnSound).toHaveBeenCalled();

                delete window.audioManager;
            });
        });

        describe('multiplayer input handling', () => {
            beforeEach(() => {
                playerController.enableMultiplayerMode();
                // Clean up any existing audio manager
                delete window.audioManager;
                // Clear all mocks to prevent interference
                jest.clearAllMocks();
            });

            afterEach(() => {
                // Clean up audio manager after each test
                delete window.audioManager;
            });

            it('should handle Player 1 input in multiplayer mode', () => {
                const spy = jest.spyOn(multiplayerGame, 'changePlayerDirection');
                // Use a direction that allows turning right (not a 180-degree reversal)
                jest.spyOn(multiplayerGame, 'getPlayerDirection').mockReturnValue({
                    x: 0,
                    y: 0,
                    z: 1,
                }); // Moving down

                const event = new KeyboardEvent('keydown', { code: 'ArrowRight' }); // Turn right
                document.dispatchEvent(event);

                expect(spy).toHaveBeenCalledWith('P1', 'ArrowRight');
            });

            it('should handle Player 2 input in multiplayer mode', () => {
                const spy = jest.spyOn(multiplayerGame, 'changePlayerDirection');
                // Use a direction that allows turning right (not a 180-degree reversal)
                jest.spyOn(multiplayerGame, 'getPlayerDirection').mockReturnValue({
                    x: 0,
                    y: 0,
                    z: 1,
                }); // Moving down

                const event = new KeyboardEvent('keydown', { code: 'KeyD' }); // Turn right
                document.dispatchEvent(event);

                expect(spy).toHaveBeenCalledWith('P2', 'KeyD');
            });

            it('should validate direction changes to prevent 180-degree reversals', () => {
                const spy = jest.spyOn(multiplayerGame, 'changePlayerDirection');
                jest.spyOn(multiplayerGame, 'getPlayerDirection').mockReturnValue({
                    x: 0,
                    y: 0,
                    z: -1,
                }); // Moving up

                // Try to reverse direction (should be blocked)
                const event = new KeyboardEvent('keydown', { code: 'ArrowDown' });
                document.dispatchEvent(event);

                expect(spy).not.toHaveBeenCalled();
            });

            it('should allow valid direction changes', () => {
                const spy = jest.spyOn(multiplayerGame, 'changePlayerDirection');
                jest.spyOn(multiplayerGame, 'getPlayerDirection').mockReturnValue({
                    x: 0,
                    y: 0,
                    z: -1,
                }); // Moving up

                // Try to turn right (should be allowed)
                const event = new KeyboardEvent('keydown', { code: 'ArrowRight' });
                document.dispatchEvent(event);

                expect(spy).toHaveBeenCalledWith('P1', 'ArrowRight');
            });

            it('should trigger turn sound for valid multiplayer input', () => {
                window.audioManager = { playTurnSound: jest.fn() };
                jest.spyOn(multiplayerGame, 'getPlayerDirection').mockReturnValue({
                    x: 0,
                    y: 0,
                    z: 1,
                }); // Moving down
                jest.spyOn(multiplayerGame, 'changePlayerDirection').mockReturnValue(true);

                const event = new KeyboardEvent('keydown', { code: 'ArrowRight' }); // Turn right (valid)
                document.dispatchEvent(event);

                expect(window.audioManager.playTurnSound).toHaveBeenCalled();

                delete window.audioManager;
            });

            it('should not trigger turn sound for invalid direction changes', () => {
                // Reset all mocks
                jest.clearAllMocks();

                window.audioManager = { playTurnSound: jest.fn() };
                const spy = jest.spyOn(multiplayerGame, 'changePlayerDirection');
                jest.spyOn(multiplayerGame, 'getPlayerDirection').mockReturnValue({
                    x: 0,
                    y: 0,
                    z: -1,
                }); // Moving up

                // Try to reverse direction (should be blocked)
                const event = new KeyboardEvent('keydown', { code: 'ArrowDown' });
                document.dispatchEvent(event);

                // The direction change should not be called due to validation
                expect(spy).not.toHaveBeenCalled();
                // And therefore no sound should be triggered
                expect(window.audioManager.playTurnSound).not.toHaveBeenCalled();

                delete window.audioManager;
            });

            it('should handle simultaneous input from both players', () => {
                const spy = jest.spyOn(multiplayerGame, 'changePlayerDirection');
                jest.spyOn(multiplayerGame, 'getPlayerDirection').mockReturnValue({
                    x: 0,
                    y: 0,
                    z: 1,
                }); // Moving down

                // Simulate simultaneous key presses (both turning right)
                const p1Event = new KeyboardEvent('keydown', { code: 'ArrowRight' });
                const p2Event = new KeyboardEvent('keydown', { code: 'KeyD' });

                document.dispatchEvent(p1Event);
                document.dispatchEvent(p2Event);

                expect(spy).toHaveBeenCalledWith('P1', 'ArrowRight');
                expect(spy).toHaveBeenCalledWith('P2', 'KeyD');
            });

            it('should handle key up events in multiplayer mode', () => {
                const dualControls = playerController.getDualControlScheme();
                const spy = jest.spyOn(dualControls, 'handleKeyUp');

                const event = new KeyboardEvent('keyup', { code: 'ArrowUp' });
                document.dispatchEvent(event);

                expect(spy).toHaveBeenCalledWith(event);
            });

            it('should ignore non-player keys in multiplayer mode', () => {
                const spy = jest.spyOn(multiplayerGame, 'changePlayerDirection');

                const event = new KeyboardEvent('keydown', { code: 'KeyX' });
                document.dispatchEvent(event);

                expect(spy).not.toHaveBeenCalled();
            });
        });

        describe('backward compatibility', () => {
            it('should maintain pause functionality in multiplayer mode', () => {
                playerController.enableMultiplayerMode();
                expect(multiplayerGame.isPaused).toBe(false);

                const event = new KeyboardEvent('keydown', { key: 'p' });
                document.dispatchEvent(event);

                expect(multiplayerGame.isPaused).toBe(true);
            });

            it('should handle escape key pause in multiplayer mode', () => {
                playerController.enableMultiplayerMode();
                expect(multiplayerGame.isPaused).toBe(false);

                const event = new KeyboardEvent('keydown', { key: 'Escape' });
                document.dispatchEvent(event);

                expect(multiplayerGame.isPaused).toBe(true);
            });
        });
    });
});
