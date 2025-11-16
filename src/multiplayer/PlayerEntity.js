/**
 * PlayerEntity - Represents a player in the game (human or AI)
 * Provides a unified interface for managing player state, position, and controls
 */
class PlayerEntity {
    /**
     * Create a new PlayerEntity
     * @param {string} id - Unique identifier for the player ('P1', 'P2', 'ai_1', etc.)
     * @param {string} color - Player color ('green', 'blue', 'red', etc.)
     * @param {Object} startPosition - Starting position {x, y, z}
     * @param {Object} controlScheme - Control mapping for this player
     */
    constructor(id, color, startPosition, controlScheme = null) {
        this.id = id;
        this.color = color;
        this.type = id.startsWith('P') ? 'human' : 'ai';
        
        // Position and movement
        this.position = { ...startPosition };
        this.direction = { x: 1, y: 0, z: 0 }; // Default direction: right
        this.previousPosition = { ...startPosition };
        
        // Trail management
        this.trail = [];
        
        // State management
        this.isAlive = true;
        this.frameCount = 0;
        
        // Control scheme (for human players)
        this.controlScheme = controlScheme;
        
        // Game state tracking
        this.gameSpeed = 0.1;
        this.speedMultiplier = 1.0;
        
        // Initialize starting direction based on position
        this.initializeStartingDirection(startPosition);
    }
    
    /**
     * Initialize starting direction based on starting position
     * Players start facing toward the center of the arena
     * @param {Object} startPosition - Starting position
     */
    initializeStartingDirection(startPosition) {
        const centerX = 0;
        const centerZ = 0;
        
        // Calculate direction toward center
        const deltaX = centerX - startPosition.x;
        const deltaZ = centerZ - startPosition.z;
        
        // Choose primary direction (prefer horizontal movement)
        if (Math.abs(deltaX) > Math.abs(deltaZ)) {
            this.direction = { x: deltaX > 0 ? 1 : -1, y: 0, z: 0 };
        } else {
            this.direction = { x: 0, y: 0, z: deltaZ > 0 ? 1 : -1 };
        }
    }
    
    /**
     * Reset player to initial state
     * @param {Object} startPosition - Starting position to reset to
     */
    reset(startPosition = null) {
        if (startPosition) {
            this.position = { ...startPosition };
            this.previousPosition = { ...startPosition };
            this.initializeStartingDirection(startPosition);
        } else {
            // Reset to current position (for game restart)
            this.previousPosition = { ...this.position };
        }
        
        this.trail = [];
        this.isAlive = true;
        this.frameCount = 0;
        this.speedMultiplier = 1.0;
    }
    
    /**
     * Update player position and state
     * @param {number} gameSpeed - Base game speed
     * @param {number} speedMultiplier - Speed multiplier from power-ups
     */
    update(gameSpeed = 0.1, speedMultiplier = 1.0) {
        if (!this.isAlive) return;
        
        this.gameSpeed = gameSpeed;
        this.speedMultiplier = speedMultiplier;
        this.frameCount++;
        
        // Store previous position
        this.previousPosition = { ...this.position };
        
        // Calculate effective speed
        const effectiveSpeed = gameSpeed * speedMultiplier;
        
        // Update position
        this.position.x += this.direction.x * effectiveSpeed;
        this.position.z += this.direction.z * effectiveSpeed;
        
        // Add trail segment
        this.trail.push({ ...this.position });
    }
    
    /**
     * Change player direction (with 180-degree turn prevention)
     * @param {Object} newDirection - New direction vector {x, y, z}
     * @returns {boolean} True if direction was changed
     */
    changeDirection(newDirection) {
        if (!this.isAlive) return false;
        
        // Prevent 180-degree turns (only check non-zero components)
        const isOpposite = (
            (this.direction.x !== 0 && this.direction.x === -newDirection.x) ||
            (this.direction.z !== 0 && this.direction.z === -newDirection.z)
        );
        
        if (isOpposite) {
            return false;
        }
        
        // Prevent same direction (no change needed)
        const isSame = (
            this.direction.x === newDirection.x &&
            this.direction.z === newDirection.z
        );
        
        if (isSame) {
            return false;
        }
        
        this.direction = { ...newDirection };
        return true;
    }
    
    /**
     * Handle player death/crash
     */
    crash() {
        this.isAlive = false;
    }
    
    /**
     * Get current player state for rendering and collision detection
     * @returns {Object} Player state object
     */
    getState() {
        return {
            id: this.id,
            type: this.type,
            color: this.color,
            position: { ...this.position },
            direction: { ...this.direction },
            previousPosition: { ...this.previousPosition },
            trail: [...this.trail],
            isAlive: this.isAlive,
            frameCount: this.frameCount,
            controlScheme: this.controlScheme,
            gameSpeed: this.gameSpeed,
            speedMultiplier: this.speedMultiplier
        };
    }
    
    /**
     * Get player position for collision detection
     * @returns {Object} Position object {x, y, z}
     */
    getPosition() {
        return { ...this.position };
    }
    
    /**
     * Get player trail for collision detection
     * @returns {Array} Array of trail segments
     */
    getTrail() {
        return [...this.trail];
    }
    
    /**
     * Check if player is human controlled
     * @returns {boolean} True if human player
     */
    isHuman() {
        return this.type === 'human';
    }
    
    /**
     * Check if player is AI controlled
     * @returns {boolean} True if AI player
     */
    isAI() {
        return this.type === 'ai';
    }
    
    /**
     * Get player display name for UI
     * @returns {string} Display name
     */
    getDisplayName() {
        if (this.isHuman()) {
            return this.id; // 'P1', 'P2'
        } else {
            return `AI ${this.id.split('_')[1]}`; // 'AI 1', 'AI 2'
        }
    }
    
    /**
     * Set speed multiplier (from power-ups)
     * @param {number} multiplier - Speed multiplier
     */
    setSpeedMultiplier(multiplier) {
        this.speedMultiplier = Math.max(0.1, multiplier);
    }
    
    /**
     * Get effective speed (base speed * multiplier)
     * @returns {number} Effective speed
     */
    getEffectiveSpeed() {
        return this.gameSpeed * this.speedMultiplier;
    }
    
    /**
     * Check if player can change direction (not crashed)
     * @returns {boolean} True if direction change is allowed
     */
    canChangeDirection() {
        return this.isAlive;
    }
    
    /**
     * Get trail length
     * @returns {number} Number of trail segments
     */
    getTrailLength() {
        return this.trail.length;
    }
    
    /**
     * Clear trail (for game restart)
     */
    clearTrail() {
        this.trail = [];
    }
}

module.exports = { PlayerEntity };