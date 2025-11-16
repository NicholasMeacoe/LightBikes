/**
 * SplitScreenCamera - Dynamic camera positioning system for local multiplayer
 * Manages camera positioning to keep both players visible with optimal zoom
 */
class SplitScreenCamera {
    constructor(camera, bounds = { minX: -15, maxX: 15, minZ: -15, maxZ: 15 }) {
        this.camera = camera;
        this.players = [];
        this.arenaBounds = bounds;
        
        // Camera configuration
        this.minZoom = 20;  // Minimum camera height (closest zoom)
        this.maxZoom = 50;  // Maximum camera height (furthest zoom)
        this.baseHeight = 20;
        this.baseDistance = 15; // Base Z offset from center
        
        // Smooth movement configuration
        this.smoothingFactor = 0.1; // Lower = smoother, higher = more responsive
        this.targetPosition = { x: 0, y: this.baseHeight, z: this.baseDistance };
        this.targetLookAt = { x: 0, y: 0, z: 0 };
        
        // Edge case handling
        this.maxPlayerDistance = 30; // Maximum distance between players before max zoom
        this.boundaryPadding = 5; // Padding from arena boundaries
        
        // Store original camera position for reset
        this.originalPosition = camera.position.clone();
    }

    /**
     * Set the players to track
     * @param {Array} players - Array of player objects with position properties
     */
    setPlayers(players) {
        this.players = players.filter(player => player && player.isAlive);
    }

    /**
     * Update camera position based on current players
     * @param {Object} cameraEffectsOffset - Optional camera effects offset
     * @param {Object} arenaState - Optional arena state for shrinking scenarios
     */
    update(cameraEffectsOffset = { x: 0, y: 0, z: 0 }, arenaState = null) {
        if (this.players.length === 0) {
            // No players - maintain current position
            return;
        }

        // Handle arena shrinking if state is provided
        if (arenaState && arenaState.currentBounds) {
            this.handleArenaShrinking(arenaState.currentBounds);
        }

        if (this.players.length === 1) {
            // Single player - follow that player
            this.updateSinglePlayerCamera(this.players[0], cameraEffectsOffset);
            // Handle player elimination transition
            this.handlePlayerElimination();
        } else if (this.players.length === 2) {
            // Two players - use split screen logic
            this.updateSplitScreenCamera(this.players[0], this.players[1], cameraEffectsOffset);
            
            // Handle edge cases for two players
            this.handleOppositeCornerCase();
            this.handlePlayersCloseProximity();
        } else {
            // Multiple players - use center of mass approach
            this.updateMultiPlayerCamera(this.players, cameraEffectsOffset);
        }

        // Handle rapid movement to prevent disorientation
        this.handleRapidMovement();
        
        // Handle camera boundary collisions
        this.handleCameraBoundaryCollision();

        // Apply smooth camera movement
        this.applySmoothMovement(cameraEffectsOffset);
    }

    /**
     * Update camera for single player
     * @param {Object} player - Player object
     * @param {Object} effectsOffset - Camera effects offset
     */
    updateSinglePlayerCamera(player, effectsOffset) {
        const playerPos = this.getPlayerPosition(player);
        
        this.targetPosition = {
            x: playerPos.x,
            y: this.baseHeight,
            z: playerPos.z + this.baseDistance
        };
        
        this.targetLookAt = {
            x: playerPos.x,
            y: 0,
            z: playerPos.z
        };
    }

    /**
     * Update camera for two players (split screen)
     * @param {Object} player1 - First player object
     * @param {Object} player2 - Second player object
     * @param {Object} effectsOffset - Camera effects offset
     */
    updateSplitScreenCamera(player1, player2, effectsOffset) {
        const pos1 = this.getPlayerPosition(player1);
        const pos2 = this.getPlayerPosition(player2);
        
        // Calculate center point between players
        const centerPoint = this.calculateCenterPoint(pos1, pos2);
        
        // Calculate distance between players
        const playerDistance = this.calculateDistance(pos1, pos2);
        
        // Calculate optimal zoom level
        const optimalZoom = this.calculateOptimalZoom(playerDistance);
        
        // Calculate camera position with distance-based offset
        const cameraOffset = this.calculateCameraOffset(playerDistance);
        
        this.targetPosition = {
            x: centerPoint.x,
            y: optimalZoom,
            z: centerPoint.z + cameraOffset
        };
        
        this.targetLookAt = {
            x: centerPoint.x,
            y: 0,
            z: centerPoint.z
        };
        
        // Handle edge cases
        this.handleBoundaryConstraints();
    }

    /**
     * Update camera for multiple players
     * @param {Array} players - Array of player objects
     * @param {Object} effectsOffset - Camera effects offset
     */
    updateMultiPlayerCamera(players, effectsOffset) {
        // Calculate center of mass
        const centerOfMass = this.calculateCenterOfMass(players);
        
        // Calculate bounding box of all players
        const boundingBox = this.calculatePlayerBoundingBox(players);
        
        // Calculate zoom based on bounding box size
        const maxDimension = Math.max(
            boundingBox.maxX - boundingBox.minX,
            boundingBox.maxZ - boundingBox.minZ
        );
        
        const optimalZoom = this.calculateOptimalZoom(maxDimension);
        const cameraOffset = this.calculateCameraOffset(maxDimension);
        
        this.targetPosition = {
            x: centerOfMass.x,
            y: optimalZoom,
            z: centerOfMass.z + cameraOffset
        };
        
        this.targetLookAt = {
            x: centerOfMass.x,
            y: 0,
            z: centerOfMass.z
        };
        
        // Handle edge cases
        this.handleBoundaryConstraints();
    }

    /**
     * Calculate center point between two positions
     * @param {Object} pos1 - First position {x, z}
     * @param {Object} pos2 - Second position {x, z}
     * @returns {Object} Center point {x, z}
     */
    calculateCenterPoint(pos1, pos2) {
        return {
            x: (pos1.x + pos2.x) / 2,
            z: (pos1.z + pos2.z) / 2
        };
    }

    /**
     * Calculate distance between two positions
     * @param {Object} pos1 - First position {x, z}
     * @param {Object} pos2 - Second position {x, z}
     * @returns {number} Distance between positions
     */
    calculateDistance(pos1, pos2) {
        return Math.sqrt(
            Math.pow(pos2.x - pos1.x, 2) + 
            Math.pow(pos2.z - pos1.z, 2)
        );
    }

    /**
     * Calculate optimal zoom level based on player distance
     * @param {number} distance - Distance between players
     * @returns {number} Optimal camera height
     */
    calculateOptimalZoom(distance) {
        // Linear interpolation between min and max zoom based on distance
        const normalizedDistance = Math.min(distance / this.maxPlayerDistance, 1.0);
        const zoomRange = this.maxZoom - this.minZoom;
        return this.minZoom + (normalizedDistance * zoomRange);
    }

    /**
     * Calculate camera Z offset based on player distance
     * @param {number} distance - Distance between players
     * @returns {number} Camera Z offset
     */
    calculateCameraOffset(distance) {
        // Increase camera distance as players spread apart
        const additionalOffset = distance * 0.3;
        return this.baseDistance + additionalOffset;
    }

    /**
     * Calculate center of mass for multiple players
     * @param {Array} players - Array of player objects
     * @returns {Object} Center of mass {x, z}
     */
    calculateCenterOfMass(players) {
        let totalX = 0;
        let totalZ = 0;
        
        for (const player of players) {
            const pos = this.getPlayerPosition(player);
            totalX += pos.x;
            totalZ += pos.z;
        }
        
        return {
            x: totalX / players.length,
            z: totalZ / players.length
        };
    }

    /**
     * Calculate bounding box containing all players
     * @param {Array} players - Array of player objects
     * @returns {Object} Bounding box {minX, maxX, minZ, maxZ}
     */
    calculatePlayerBoundingBox(players) {
        let minX = Infinity;
        let maxX = -Infinity;
        let minZ = Infinity;
        let maxZ = -Infinity;
        
        for (const player of players) {
            const pos = this.getPlayerPosition(player);
            minX = Math.min(minX, pos.x);
            maxX = Math.max(maxX, pos.x);
            minZ = Math.min(minZ, pos.z);
            maxZ = Math.max(maxZ, pos.z);
        }
        
        return { minX, maxX, minZ, maxZ };
    }

    /**
     * Handle camera boundary constraints
     */
    handleBoundaryConstraints() {
        // Ensure camera doesn't move outside arena bounds
        const padding = this.boundaryPadding;
        
        // Constrain target position to arena bounds
        this.targetPosition.x = Math.max(
            this.arenaBounds.minX - padding,
            Math.min(this.arenaBounds.maxX + padding, this.targetPosition.x)
        );
        
        // Constrain look-at point to arena bounds
        this.targetLookAt.x = Math.max(
            this.arenaBounds.minX,
            Math.min(this.arenaBounds.maxX, this.targetLookAt.x)
        );
        
        this.targetLookAt.z = Math.max(
            this.arenaBounds.minZ,
            Math.min(this.arenaBounds.maxZ, this.targetLookAt.z)
        );
        
        // Ensure minimum zoom limits for playability
        this.targetPosition.y = Math.max(this.minZoom, Math.min(this.maxZoom, this.targetPosition.y));
    }

    /**
     * Apply smooth camera movement interpolation
     * @param {Object} effectsOffset - Camera effects offset
     */
    applySmoothMovement(effectsOffset) {
        // Interpolate camera position
        this.camera.position.x += (this.targetPosition.x - this.camera.position.x) * this.smoothingFactor;
        this.camera.position.y += (this.targetPosition.y - this.camera.position.y) * this.smoothingFactor;
        this.camera.position.z += (this.targetPosition.z - this.camera.position.z) * this.smoothingFactor;
        
        // Apply camera effects offset
        this.camera.position.x += effectsOffset.x;
        this.camera.position.y += effectsOffset.y;
        this.camera.position.z += effectsOffset.z;
        
        // Update camera look-at with interpolation
        const currentLookAt = this.getCurrentLookAt();
        const newLookAt = {
            x: currentLookAt.x + (this.targetLookAt.x - currentLookAt.x) * this.smoothingFactor,
            y: currentLookAt.y + (this.targetLookAt.y - currentLookAt.y) * this.smoothingFactor,
            z: currentLookAt.z + (this.targetLookAt.z - currentLookAt.z) * this.smoothingFactor
        };
        
        this.camera.lookAt(newLookAt.x, newLookAt.y, newLookAt.z);
    }

    /**
     * Get current camera look-at point (approximation)
     * @returns {Object} Current look-at point {x, y, z}
     */
    getCurrentLookAt() {
        // Simple approximation - in a real implementation you might store this
        return {
            x: this.camera.position.x,
            y: 0,
            z: this.camera.position.z - this.baseDistance
        };
    }

    /**
     * Get player position from player object
     * @param {Object} player - Player object
     * @returns {Object} Position {x, z}
     */
    getPlayerPosition(player) {
        // Handle different player object formats
        if (player.position) {
            return { x: player.position.x, z: player.position.z };
        } else {
            return { x: player.x || 0, z: player.z || 0 };
        }
    }

    /**
     * Handle rapid player movement without disorientation
     * @param {number} maxMovementSpeed - Maximum movement speed per frame
     */
    handleRapidMovement(maxMovementSpeed = 2.0) {
        // Limit camera movement speed to prevent disorientation
        const currentPos = this.camera.position;
        const deltaX = this.targetPosition.x - currentPos.x;
        const deltaY = this.targetPosition.y - currentPos.y;
        const deltaZ = this.targetPosition.z - currentPos.z;
        
        const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
        
        if (totalMovement > maxMovementSpeed) {
            // Scale down movement to maximum allowed speed
            const scale = maxMovementSpeed / totalMovement;
            this.targetPosition.x = currentPos.x + deltaX * scale;
            this.targetPosition.y = currentPos.y + deltaY * scale;
            this.targetPosition.z = currentPos.z + deltaZ * scale;
        }
    }

    /**
     * Handle edge case when players are at opposite arena boundaries
     * Implements maximum zoom-out limits for playability
     */
    handleOppositeCornerCase() {
        if (this.players.length < 2) return;
        
        const pos1 = this.getPlayerPosition(this.players[0]);
        const pos2 = this.getPlayerPosition(this.players[1]);
        
        // Check if players are near opposite corners
        const isOppositeCorners = (
            (Math.abs(pos1.x - this.arenaBounds.minX) < 3 && Math.abs(pos2.x - this.arenaBounds.maxX) < 3) ||
            (Math.abs(pos1.x - this.arenaBounds.maxX) < 3 && Math.abs(pos2.x - this.arenaBounds.minX) < 3)
        ) && (
            (Math.abs(pos1.z - this.arenaBounds.minZ) < 3 && Math.abs(pos2.z - this.arenaBounds.maxZ) < 3) ||
            (Math.abs(pos1.z - this.arenaBounds.maxZ) < 3 && Math.abs(pos2.z - this.arenaBounds.minZ) < 3)
        );
        
        if (isOppositeCorners) {
            // Force maximum zoom-out for playability
            this.targetPosition.y = this.maxZoom;
            
            // Center camera on arena center for best view
            const arenaCenter = {
                x: (this.arenaBounds.minX + this.arenaBounds.maxX) / 2,
                z: (this.arenaBounds.minZ + this.arenaBounds.maxZ) / 2
            };
            
            this.targetPosition.x = arenaCenter.x;
            this.targetLookAt.x = arenaCenter.x;
            this.targetLookAt.z = arenaCenter.z;
        }
    }

    /**
     * Handle edge case when one player is eliminated
     * Smoothly transitions from split-screen to single-player camera
     */
    handlePlayerElimination() {
        if (this.players.length === 1) {
            // Gradually transition to single-player camera mode
            const remainingPlayer = this.players[0];
            const playerPos = this.getPlayerPosition(remainingPlayer);
            
            // Smoothly zoom in to single-player view
            const targetHeight = this.baseHeight;
            const targetDistance = this.baseDistance;
            
            // Use slower smoothing for elimination transition
            const eliminationSmoothingFactor = this.smoothingFactor * 0.5;
            
            this.targetPosition = {
                x: playerPos.x,
                y: targetHeight,
                z: playerPos.z + targetDistance
            };
            
            this.targetLookAt = {
                x: playerPos.x,
                y: 0,
                z: playerPos.z
            };
            
            // Apply slower smoothing for this transition
            this.applySmoothMovementWithFactor(eliminationSmoothingFactor);
        }
    }

    /**
     * Handle edge case when players move very close together
     * Prevents excessive zoom-in that could cause disorientation
     */
    handlePlayersCloseProximity() {
        if (this.players.length < 2) return;
        
        const pos1 = this.getPlayerPosition(this.players[0]);
        const pos2 = this.getPlayerPosition(this.players[1]);
        const distance = this.calculateDistance(pos1, pos2);
        
        // If players are very close, maintain minimum zoom level
        const minProximityDistance = 3.0;
        if (distance < minProximityDistance) {
            // Force minimum zoom to prevent excessive close-up
            this.targetPosition.y = Math.max(this.targetPosition.y, this.minZoom + 5);
            
            // Reduce camera offset to maintain good view
            const reducedOffset = this.baseDistance * 0.8;
            this.targetPosition.z = this.targetLookAt.z + reducedOffset;
        }
    }

    /**
     * Handle arena shrinking scenarios
     * Adjusts camera bounds and zoom limits based on current arena size
     * @param {Object} currentArenaBounds - Current arena boundaries
     */
    handleArenaShrinking(currentArenaBounds) {
        if (!currentArenaBounds) return;
        
        // Update arena bounds
        this.setArenaBounds(currentArenaBounds);
        
        // Calculate arena size
        const arenaWidth = currentArenaBounds.maxX - currentArenaBounds.minX;
        const arenaHeight = currentArenaBounds.maxZ - currentArenaBounds.minZ;
        const arenaSize = Math.min(arenaWidth, arenaHeight);
        
        // Adjust zoom limits based on arena size
        const originalArenaSize = 30; // Original 30x30 arena
        const sizeRatio = arenaSize / originalArenaSize;
        
        // Scale zoom limits proportionally
        this.minZoom = Math.max(15, this.baseHeight * sizeRatio);
        this.maxZoom = Math.max(this.minZoom + 10, 50 * sizeRatio);
        
        // Adjust maximum player distance threshold
        this.maxPlayerDistance = Math.max(10, 30 * sizeRatio);
        
        // Reduce boundary padding for smaller arenas
        this.boundaryPadding = Math.max(2, 5 * sizeRatio);
    }

    /**
     * Handle camera collision with arena boundaries
     * Prevents camera from moving outside playable area
     */
    handleCameraBoundaryCollision() {
        // Calculate camera view bounds
        const viewRadius = this.targetPosition.y * 0.75; // Approximate view radius
        
        // Check if camera would see outside arena bounds
        const cameraViewBounds = {
            minX: this.targetPosition.x - viewRadius,
            maxX: this.targetPosition.x + viewRadius,
            minZ: this.targetLookAt.z - viewRadius,
            maxZ: this.targetLookAt.z + viewRadius
        };
        
        // Adjust camera position if it would show area outside arena
        if (cameraViewBounds.minX < this.arenaBounds.minX) {
            this.targetPosition.x = this.arenaBounds.minX + viewRadius;
        }
        if (cameraViewBounds.maxX > this.arenaBounds.maxX) {
            this.targetPosition.x = this.arenaBounds.maxX - viewRadius;
        }
        if (cameraViewBounds.minZ < this.arenaBounds.minZ) {
            this.targetLookAt.z = this.arenaBounds.minZ + viewRadius;
            this.targetPosition.z = this.targetLookAt.z + this.baseDistance;
        }
        if (cameraViewBounds.maxZ > this.arenaBounds.maxZ) {
            this.targetLookAt.z = this.arenaBounds.maxZ - viewRadius;
            this.targetPosition.z = this.targetLookAt.z + this.baseDistance;
        }
    }

    /**
     * Apply smooth movement with custom smoothing factor
     * @param {number} customSmoothingFactor - Custom smoothing factor
     * @param {Object} effectsOffset - Camera effects offset
     */
    applySmoothMovementWithFactor(customSmoothingFactor, effectsOffset = { x: 0, y: 0, z: 0 }) {
        // Interpolate camera position with custom smoothing
        this.camera.position.x += (this.targetPosition.x - this.camera.position.x) * customSmoothingFactor;
        this.camera.position.y += (this.targetPosition.y - this.camera.position.y) * customSmoothingFactor;
        this.camera.position.z += (this.targetPosition.z - this.camera.position.z) * customSmoothingFactor;
        
        // Apply camera effects offset
        this.camera.position.x += effectsOffset.x;
        this.camera.position.y += effectsOffset.y;
        this.camera.position.z += effectsOffset.z;
        
        // Update camera look-at with interpolation
        const currentLookAt = this.getCurrentLookAt();
        const newLookAt = {
            x: currentLookAt.x + (this.targetLookAt.x - currentLookAt.x) * customSmoothingFactor,
            y: currentLookAt.y + (this.targetLookAt.y - currentLookAt.y) * customSmoothingFactor,
            z: currentLookAt.z + (this.targetLookAt.z - currentLookAt.z) * customSmoothingFactor
        };
        
        this.camera.lookAt(newLookAt.x, newLookAt.y, newLookAt.z);
    }

    /**
     * Set arena bounds for boundary constraints
     * @param {Object} bounds - Arena bounds {minX, maxX, minZ, maxZ}
     */
    setArenaBounds(bounds) {
        this.arenaBounds = bounds;
    }

    /**
     * Set camera configuration
     * @param {Object} config - Camera configuration
     */
    setConfiguration(config) {
        if (config.minZoom !== undefined) this.minZoom = config.minZoom;
        if (config.maxZoom !== undefined) this.maxZoom = config.maxZoom;
        if (config.baseHeight !== undefined) this.baseHeight = config.baseHeight;
        if (config.baseDistance !== undefined) this.baseDistance = config.baseDistance;
        if (config.smoothingFactor !== undefined) this.smoothingFactor = config.smoothingFactor;
        if (config.maxPlayerDistance !== undefined) this.maxPlayerDistance = config.maxPlayerDistance;
        if (config.boundaryPadding !== undefined) this.boundaryPadding = config.boundaryPadding;
    }

    /**
     * Reset camera to original position
     */
    reset() {
        this.camera.position.x = this.originalPosition.x;
        this.camera.position.y = this.originalPosition.y;
        this.camera.position.z = this.originalPosition.z;
        this.camera.lookAt(0, 0, 0);
        this.targetPosition = { x: 0, y: this.baseHeight, z: this.baseDistance };
        this.targetLookAt = { x: 0, y: 0, z: 0 };
    }

    /**
     * Get current camera status for debugging
     * @returns {Object} Camera status information
     */
    getStatus() {
        return {
            playersTracked: this.players.length,
            currentPosition: {
                x: this.camera.position.x,
                y: this.camera.position.y,
                z: this.camera.position.z
            },
            targetPosition: this.targetPosition,
            targetLookAt: this.targetLookAt,
            configuration: {
                minZoom: this.minZoom,
                maxZoom: this.maxZoom,
                smoothingFactor: this.smoothingFactor,
                maxPlayerDistance: this.maxPlayerDistance
            }
        };
    }

    /**
     * Force immediate camera update without smoothing
     */
    forceUpdate() {
        this.camera.position.set(this.targetPosition.x, this.targetPosition.y, this.targetPosition.z);
        this.camera.lookAt(this.targetLookAt.x, this.targetLookAt.y, this.targetLookAt.z);
    }

    /**
     * Check if both players are visible in current camera view
     * @returns {boolean} True if both players are visible
     */
    ensureBothPlayersVisible() {
        if (this.players.length < 2) return true;
        
        // Simple visibility check based on camera frustum
        // In a real implementation, you would use THREE.Frustum
        const pos1 = this.getPlayerPosition(this.players[0]);
        const pos2 = this.getPlayerPosition(this.players[1]);
        
        // Calculate approximate view bounds based on camera position and zoom
        const viewWidth = this.camera.position.y * 1.5; // Approximate based on FOV
        const viewHeight = this.camera.position.y * 1.5;
        
        const centerX = this.camera.position.x;
        const centerZ = this.camera.position.z - this.baseDistance;
        
        const viewBounds = {
            minX: centerX - viewWidth / 2,
            maxX: centerX + viewWidth / 2,
            minZ: centerZ - viewHeight / 2,
            maxZ: centerZ + viewHeight / 2
        };
        
        // Check if both players are within view bounds
        const player1Visible = pos1.x >= viewBounds.minX && pos1.x <= viewBounds.maxX &&
                              pos1.z >= viewBounds.minZ && pos1.z <= viewBounds.maxZ;
        const player2Visible = pos2.x >= viewBounds.minX && pos2.x <= viewBounds.maxX &&
                              pos2.z >= viewBounds.minZ && pos2.z <= viewBounds.maxZ;
        
        return player1Visible && player2Visible;
    }
}

module.exports = { SplitScreenCamera };