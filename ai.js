class AIController {
    constructor() {
        this.aiState = 'DEFENSIVE';
        this.aiStateCooldown = 0;
    }

    calculateAIDirection(gameState) {
        // Validate input parameters
        if (!gameState || !gameState.ai || !gameState.player || !gameState.aiDirection) {
            return { newDirection: { x: 1, z: 0 }, newState: 'DEFENSIVE' };
        }

        const { ai, player, playerTrail = [], aiTrail = [], bounds = 30, aiDirection, aiState = 'DEFENSIVE', aiStateCooldown = 0 } = gameState;

        const whiskerDistances = this.runDefensiveCheck(gameState);

        let newDirection = aiDirection;

        // Turn away from boundaries earlier (10 units) and add random turns
        if (whiskerDistances.forward < 10) {
            // Turn to the side with more clearance
            if (whiskerDistances.left > whiskerDistances.right) {
                newDirection = { x: aiDirection.z, z: -aiDirection.x };
            } else {
                newDirection = { x: -aiDirection.z, z: aiDirection.x };
            }
        } else if (Math.random() < 0.02) {
            // Occasional random turn to make movement less predictable
            newDirection = Math.random() > 0.5
                ? { x: aiDirection.z, z: -aiDirection.x }
                : { x: -aiDirection.z, z: aiDirection.x };
        }

        return { newDirection, newState: 'DEFENSIVE' };
    }

    runDefensiveCheck(gameState) {
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
        const obstacles = [...playerTrail, ...(aiTrail.length > 10 ? aiTrail.slice(0, aiTrail.length - 10) : aiTrail)];
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
}

module.exports = { AIController };
