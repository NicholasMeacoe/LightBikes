/**
 * DualControlScheme - Handles simultaneous input processing for two players
 * Manages separate key mappings and input state tracking for local multiplayer
 */
class DualControlScheme {
    constructor() {
        // Player 1 control mapping (Arrow Keys)
        this.player1Controls = {
            up: 'ArrowUp',
            down: 'ArrowDown',
            left: 'ArrowLeft',
            right: 'ArrowRight'
        };
        
        // Player 2 control mapping (WASD)
        this.player2Controls = {
            up: 'KeyW',
            down: 'KeyS',
            left: 'KeyA',
            right: 'KeyD'
        };
        
        // Active keys tracking for both players
        this.activeKeys = new Set();
        
        // Player-specific direction state management
        this.player1State = {
            activeDirection: null,
            pendingDirection: null,
            lastInputTime: 0
        };
        
        this.player2State = {
            activeDirection: null,
            pendingDirection: null,
            lastInputTime: 0
        };
        
        // Direction mappings for validation
        this.directionMappings = {
            // Player 1 mappings
            'ArrowUp': { x: 0, y: 0, z: -1 },
            'ArrowDown': { x: 0, y: 0, z: 1 },
            'ArrowLeft': { x: -1, y: 0, z: 0 },
            'ArrowRight': { x: 1, y: 0, z: 0 },
            // Player 2 mappings
            'KeyW': { x: 0, y: 0, z: -1 },
            'KeyS': { x: 0, y: 0, z: 1 },
            'KeyA': { x: -1, y: 0, z: 0 },
            'KeyD': { x: 1, y: 0, z: 0 }
        };
    }
    
    /**
     * Handle key down events for both players
     * @param {KeyboardEvent} event - The keyboard event
     * @returns {Object} Input result with player ID and direction change info
     */
    handleKeyDown(event) {
        const key = event.code || event.key;
        const timestamp = Date.now();
        
        // Add key to active keys set
        this.activeKeys.add(key);
        
        // Determine which player this key belongs to
        const playerId = this.getPlayerIdForKey(key);
        if (!playerId) {
            return { playerId: null, directionChanged: false, key };
        }
        
        // Get the direction for this key
        const newDirection = this.directionMappings[key];
        if (!newDirection) {
            return { playerId, directionChanged: false, key };
        }
        
        // Get current player state
        const playerState = playerId === 'P1' ? this.player1State : this.player2State;
        
        // Update player state
        playerState.pendingDirection = newDirection;
        playerState.lastInputTime = timestamp;
        
        return {
            playerId,
            directionChanged: true,
            key,
            newDirection,
            timestamp
        };
    }
    
    /**
     * Handle key up events for both players
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleKeyUp(event) {
        const key = event.code || event.key;
        this.activeKeys.delete(key);
    }
    
    /**
     * Get player ID for a given key
     * @param {string} key - The key code or key name
     * @returns {string|null} Player ID ('P1' or 'P2') or null if not a player key
     */
    getPlayerIdForKey(key) {
        // Check Player 1 controls
        if (Object.values(this.player1Controls).includes(key)) {
            return 'P1';
        }
        
        // Check Player 2 controls
        if (Object.values(this.player2Controls).includes(key)) {
            return 'P2';
        }
        
        return null;
    }
    
    /**
     * Get current directions for both players
     * @returns {Object} Current directions for both players
     */
    getPlayerDirections() {
        return {
            player1: this.player1State.activeDirection,
            player2: this.player2State.activeDirection
        };
    }
    
    /**
     * Validate direction change to prevent 180-degree reversals
     * @param {string} playerId - Player ID ('P1' or 'P2')
     * @param {Object} currentDirection - Current player direction
     * @param {Object} newDirection - Proposed new direction
     * @returns {boolean} True if direction change is valid
     */
    validateDirectionChange(playerId, currentDirection, newDirection) {
        if (!currentDirection || !newDirection) {
            return true; // Allow initial direction setting
        }
        
        // Check for 180-degree reversal
        const isReversal = (
            currentDirection.x === -newDirection.x &&
            currentDirection.y === -newDirection.y &&
            currentDirection.z === -newDirection.z
        );
        
        return !isReversal;
    }
    
    /**
     * Process input conflicts and simultaneous key presses
     * @returns {Object} Processed input state for both players
     */
    preventConflicts() {
        const result = {
            player1: { hasInput: false, direction: null },
            player2: { hasInput: false, direction: null },
            simultaneousInput: false
        };
        
        // Check if both players have pending input
        const p1HasInput = this.player1State.pendingDirection !== null;
        const p2HasInput = this.player2State.pendingDirection !== null;
        
        result.simultaneousInput = p1HasInput && p2HasInput;
        
        // Process Player 1 input
        if (p1HasInput) {
            result.player1.hasInput = true;
            result.player1.direction = this.player1State.pendingDirection;
            this.player1State.activeDirection = this.player1State.pendingDirection;
            this.player1State.pendingDirection = null;
        }
        
        // Process Player 2 input
        if (p2HasInput) {
            result.player2.hasInput = true;
            result.player2.direction = this.player2State.pendingDirection;
            this.player2State.activeDirection = this.player2State.pendingDirection;
            this.player2State.pendingDirection = null;
        }
        
        return result;
    }
    
    /**
     * Check if a key is currently pressed
     * @param {string} key - The key to check
     * @returns {boolean} True if key is currently pressed
     */
    isKeyPressed(key) {
        return this.activeKeys.has(key);
    }
    
    /**
     * Get all currently pressed keys
     * @returns {Set} Set of currently pressed keys
     */
    getActiveKeys() {
        return new Set(this.activeKeys);
    }
    
    /**
     * Reset input state for both players
     */
    reset() {
        this.activeKeys.clear();
        
        this.player1State = {
            activeDirection: null,
            pendingDirection: null,
            lastInputTime: 0
        };
        
        this.player2State = {
            activeDirection: null,
            pendingDirection: null,
            lastInputTime: 0
        };
    }
    
    /**
     * Get input state for debugging
     * @returns {Object} Current input state
     */
    getInputState() {
        return {
            activeKeys: Array.from(this.activeKeys),
            player1State: { ...this.player1State },
            player2State: { ...this.player2State },
            simultaneousInput: this.player1State.pendingDirection !== null && 
                             this.player2State.pendingDirection !== null
        };
    }
}

module.exports = { DualControlScheme };