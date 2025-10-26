class CollisionDetectionEngine {
    checkCollisions(gameState) {
        if (gameState.frameCount < 10) {
            return { playerCollided: false, aiCollided: false };
        }

        const { player, ai, playerTrail, aiTrail, bounds } = gameState;

        const playerCollided = this.isCollided(player, playerTrail, aiTrail, bounds);
        const aiCollided = this.isCollided(ai, aiTrail, playerTrail, bounds);

        return { playerCollided, aiCollided };
    }

    isCollided(bike, ownTrail, opponentTrail, bounds) {
        // Boundary Check
        if (bike.x <= -bounds || bike.x >= bounds || bike.z <= -bounds || bike.z >= bounds) {
            return true;
        }

        const collisionTolerance = 0.1;
        const excludeRecentSegments = 5;

        // Trail Collision Check
        if (ownTrail.length > excludeRecentSegments) {
            for (let i = 0; i < ownTrail.length - excludeRecentSegments; i++) {
                const segment = ownTrail[i];
                if (segment && typeof segment.x === 'number' && typeof segment.z === 'number') {
                    if (Math.abs(bike.x - segment.x) < collisionTolerance && Math.abs(bike.z - segment.z) < collisionTolerance) {
                        return true;
                    }
                }
            }
        }

        for (const segment of opponentTrail) {
            if (segment && typeof segment.x === 'number' && typeof segment.z === 'number') {
                if (Math.abs(bike.x - segment.x) < collisionTolerance && Math.abs(bike.z - segment.z) < collisionTolerance) {
                    return true;
                }
            }
        }

        return false;
    }
}

module.exports = { CollisionDetectionEngine };
