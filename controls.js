const { DualControlScheme } = require('./DualControlScheme.js');

class PlayerController {
    constructor(game) {
        this.game = game;
        this.dualControlScheme = null;
        this.isMultiplayerMode = false;
    }

    init() {
        // Keyboard event listeners
        document.addEventListener('keydown', (event) => {
            // Handle pause controls
            if (event.key === 'p' || event.key === 'Escape') {
                event.preventDefault();
                // Handle pause operation result gracefully
                const pauseResult = this.game.togglePause();
                if (!pauseResult) {
                    // Pause operation failed (e.g., during game over), but handle gracefully
                    console.debug('Pause operation not available in current game state');
                }
                return;
            }
            
            // Handle direction controls based on game mode
            if (this.isMultiplayerMode && this.dualControlScheme) {
                this.handleMultiplayerInput(event);
            } else {
                this.handleSinglePlayerInput(event);
            }
        });

        // Handle key up events for multiplayer mode
        document.addEventListener('keyup', (event) => {
            if (this.isMultiplayerMode && this.dualControlScheme) {
                this.dualControlScheme.handleKeyUp(event);
            }
        });

        // UI button event listeners - setup when DOM is ready
        this.setupUIEventListeners();
    }

    /**
     * Handle single player input (backward compatibility)
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleSinglePlayerInput(event) {
        const directionChanged = this.game.changePlayerDirection(event.key);
        
        // Trigger turn sound if direction actually changed
        if (directionChanged && window.audioManager) {
            window.audioManager.playTurnSound();
        }
    }
    
    /**
     * Handle multiplayer input using dual control scheme
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleMultiplayerInput(event) {
        const inputResult = this.dualControlScheme.handleKeyDown(event);
        
        if (inputResult.playerId && inputResult.directionChanged) {
            // Get current player direction for validation
            const currentDirection = this.game.getPlayerDirection(inputResult.playerId);
            
            // Validate direction change to prevent 180-degree reversals
            const isValidChange = this.dualControlScheme.validateDirectionChange(
                inputResult.playerId,
                currentDirection,
                inputResult.newDirection
            );
            
            if (isValidChange) {
                // Apply direction change to the game
                const directionChanged = this.game.changePlayerDirection(
                    inputResult.playerId, 
                    inputResult.key
                );
                
                // Trigger turn sound if direction actually changed
                if (directionChanged && window.audioManager) {
                    window.audioManager.playTurnSound();
                }
            }
        }
    }
    
    /**
     * Enable multiplayer mode with dual control scheme
     */
    enableMultiplayerMode() {
        this.isMultiplayerMode = true;
        this.dualControlScheme = new DualControlScheme();
    }
    
    /**
     * Disable multiplayer mode and return to single player
     */
    disableMultiplayerMode() {
        this.isMultiplayerMode = false;
        if (this.dualControlScheme) {
            this.dualControlScheme.reset();
            this.dualControlScheme = null;
        }
    }
    
    /**
     * Get the dual control scheme instance (for testing/debugging)
     * @returns {DualControlScheme|null} The dual control scheme or null if not in multiplayer mode
     */
    getDualControlScheme() {
        return this.dualControlScheme;
    }
    
    /**
     * Check if currently in multiplayer mode
     * @returns {boolean} True if in multiplayer mode
     */
    isInMultiplayerMode() {
        return this.isMultiplayerMode;
    }

    setupUIEventListeners() {
        // Use a small delay to ensure DOM elements are available
        setTimeout(() => {
            const resumeButton = document.getElementById('resumeButton');
            if (resumeButton) {
                resumeButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    // Handle resume operation result gracefully
                    const resumeResult = this.game.resume();
                    if (!resumeResult) {
                        console.debug('Resume operation not available in current game state');
                    }
                });

                resumeButton.addEventListener('touchstart', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    // Handle resume operation result gracefully
                    const resumeResult = this.game.resume();
                    if (!resumeResult) {
                        console.debug('Resume operation not available in current game state');
                    }
                });
            }
        }, 0);
    }


}

module.exports = { PlayerController };
