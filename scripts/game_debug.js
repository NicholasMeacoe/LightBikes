function calculateAIDirection(gameState) {
    // Validate input parameters
    if (!gameState || !gameState.ai || !gameState.player || !gameState.aiDirection) {
        return { newDirection: { x: 1, z: 0 }, newState: 'DEFENSIVE' };
    }

    const { ai, player, playerTrail = [], aiTrail = [], bounds = 30, aiDirection, aiState = 'DEFENSIVE', aiStateCooldown = 0 } = gameState;

    const whiskerDistances = runDefensiveCheck(gameState);

    let newDirection = aiDirection;

    // Only turn if forward path is blocked
    console.log("Whiskers:", whiskerDistances);
    if (whiskerDistances.forward < 5) {
        // Turn to the side with more clearance
        if (whiskerDistances.left > whiskerDistances.right) {
            newDirection = { x: aiDirection.z, z: -aiDirection.x };
        } else {
            newDirection = { x: -aiDirection.z, z: aiDirection.x };
        }
    }

    return { newDirection, newState: 'DEFENSIVE' };
}

function runDefensiveCheck(gameState) {
    // Validate input parameters
    if (!gameState || !gameState.ai || !gameState.aiDirection) {
        return { forward: 0, left: 0, right: 0 };
    }

    const { ai, playerTrail = [], aiTrail = [], bounds = 30, aiDirection } = gameState;
    
    const whiskers = {
        forward: { x: aiDirection.x, z: aiDirection.z },
        left: { x: aiDirection.z, z: -aiDirection.x },
        right: { x: -aiDirection.z, z: aiDirection.x }
    };

    const whiskerLength = 20;
    const obstacles = [...playerTrail, ...aiTrail];
    const whiskerDistances = { forward: whiskerLength, left: whiskerLength, right: whiskerLength };

    for (const [direction, whisker] of Object.entries(whiskers)) {
        for (let i = 1; i <= whiskerLength; i++) {
            const checkX = ai.x + whisker.x * i * 0.1;
            const checkZ = ai.z + whisker.z * i * 0.1;

            let collision = false;
            if (checkX <= -bounds || checkX >= bounds || checkZ <= -bounds || checkZ >= bounds) {
                collision = true;
            }

            if (!collision) {
                for (const segment of obstacles) {
                    if (segment && typeof segment.x === 'number' && typeof segment.z === 'number') {
                        if (Math.abs(checkX - segment.x) < 0.15 && Math.abs(checkZ - segment.z) < 0.15) {
                            collision = true;
                            break;
                        }
                    }
                }
            }

            if (collision) {
                whiskerDistances[direction] = i;
                break;
            }
        }
    }
    
    return whiskerDistances;
}

class Game {
    constructor() {
        this.bounds = 30;
        this.init();
    }

    getGameState() {
        return {
            bounds: this.bounds,
            player: this.player,
            playerDirection: this.playerDirection,
            playerTrail: this.playerTrail,
            ai: this.ai,
            aiDirection: this.aiDirection,
            aiTrail: this.aiTrail,
            aiState: this.aiState,
            aiStateCooldown: this.aiStateCooldown
        };
    }

    init() {
        this.gameOver = false;
        this.frameCount = 0;

        this.player = { x: 0, y: 0, z: 0 };
        this.playerDirection = { x: 1, y: 0, z: 0 };
        this.playerTrail = [];
        this.playerPreviousPosition = { x: 0, y: 0, z: 0 };

        this.ai = { x: 0, y: 0, z: -10 };
        this.aiDirection = { x: 1, y: 0, z: 0 };
        this.aiTrail = [];
        this.aiPreviousPosition = { x: 0, y: 0, z: 5 };
        this.aiState = 'DEFENSIVE';
        this.aiStateCooldown = 0;
    }

    update() {
        if (this.gameOver) return;

        // Collision Detection
        if (this.frameCount >= 10) {
            // Boundary Check - detect if outside or at boundary
            if (this.player.x <= -this.bounds || this.player.x >= this.bounds || 
                this.player.z <= -this.bounds || this.player.z >= this.bounds) {
                this.gameOver = true;
            }
            if (this.ai.x <= -this.bounds || this.ai.x >= this.bounds || 
                this.ai.z <= -this.bounds || this.ai.z >= this.bounds) {
                this.gameOver = true;
            }

            // Trail Collision Check - exclude recent segments to prevent self-collision
            const collisionTolerance = 0.1;
            const excludeRecentSegments = 5;
            
            // Check player trail collisions
            for (let i = 0; i < this.playerTrail.length; i++) {
                const segment = this.playerTrail[i];
                if (segment && typeof segment.x === 'number' && typeof segment.z === 'number') {
                    // Check if this is a recent segment for the player
                    const isRecentForPlayer = i >= this.playerTrail.length - excludeRecentSegments;
                    
                    // Player collision with own trail (skip recent segments)
                    if (!isRecentForPlayer && Math.abs(this.player.x - segment.x) < collisionTolerance && Math.abs(this.player.z - segment.z) < collisionTolerance) {
                        this.gameOver = true;
                    }
                    
                    // AI collision with player trail (check all segments)
                    if (Math.abs(this.ai.x - segment.x) < collisionTolerance && Math.abs(this.ai.z - segment.z) < collisionTolerance) {
                        this.gameOver = true;
                    }
                }
            }
            
            // Check AI trail collisions
            for (let i = 0; i < this.aiTrail.length; i++) {
                const segment = this.aiTrail[i];
                if (segment && typeof segment.x === 'number' && typeof segment.z === 'number') {
                    // Check if this is a recent segment for the AI
                    const isRecentForAI = i >= this.aiTrail.length - excludeRecentSegments;
                    
                    // Player collision with AI trail (check all segments)
                    if (Math.abs(this.player.x - segment.x) < collisionTolerance && Math.abs(this.player.z - segment.z) < collisionTolerance) {
                        this.gameOver = true;
                    }
                    
                    // AI collision with own trail (skip recent segments)
                    if (!isRecentForAI && Math.abs(this.ai.x - segment.x) < collisionTolerance && Math.abs(this.ai.z - segment.z) < collisionTolerance) {
                        this.gameOver = true;
                    }
                }
            }
        }

        if (this.gameOver) return;

        this.frameCount++;

        // Move Player
        this.player.x += this.playerDirection.x * 0.1;
        this.player.z += this.playerDirection.z * 0.1;

        // Create Player Trail
        this.playerTrail.push({ ...this.player });

        // Update AI
        const { newDirection, newState } = calculateAIDirection(this.getGameState());
        this.aiDirection = newDirection;
        this.aiState = newState;

        // Move AI
        this.ai.x += this.aiDirection.x * 0.1;
        this.ai.z += this.aiDirection.z * 0.1;

        // Create AI Trail
        this.aiTrail.push({ ...this.ai });
    }

    changePlayerDirection(key) {
        if (!key || typeof key !== 'string') {
            return; // Handle invalid input gracefully
        }
        
        switch (key) {
            case 'ArrowUp':
                if (this.playerDirection.z === 0) this.playerDirection = { x: 0, y: 0, z: -1 };
                break;
            case 'ArrowDown':
                if (this.playerDirection.z === 0) this.playerDirection = { x: 0, y: 0, z: 1 };
                break;
            case 'ArrowLeft':
                if (this.playerDirection.x === 0) this.playerDirection = { x: -1, y: 0, z: 0 };
                break;
            case 'ArrowRight':
                if (this.playerDirection.x === 0) this.playerDirection = { x: 1, y: 0, z: 0 };
                break;
            default:
                // Handle unknown keys gracefully by doing nothing
                break;
        }
    }

    restart() {
        this.init();
    }
}

module.exports = { Game, calculateAIDirection };