/**
 * EmissiveMaterialSystem - Manages emissive materials and pulse animations for neon glow effects
 *
 * This class is responsible for creating, managing, and animating emissive materials
 * that provide the glowing appearance for bikes and trails in the LightBikes game.
 * It handles material lifecycle, synchronized pulsing animations, and memory management
 * to prevent leaks during extended gameplay.
 *
 * Key Features:
 * - Creates emissive materials for bikes (high intensity) and trails (lower intensity)
 * - Synchronized pulsing animation across all materials (2.5 second cycle)
 * - Global intensity multiplier for user preference control
 * - Automatic material disposal and memory management
 * - Material caching and retrieval by entity ID
 * - Pulse animation pause/resume for game state changes
 *
 * Material Hierarchy:
 * - Bikes: Base intensity 0.8 (80%) - Primary visual focus
 * - Trails: Base intensity 0.6 (60%) - Secondary visual elements
 *
 * Pulse Animation:
 * - 2.5 second cycle period for subtle breathing effect
 * - Intensity varies between 80% and 100% using sine wave
 * - Synchronized across all materials for visual coherence
 * - Pausable for game state management
 *
 * Usage Example:
 * ```javascript
 * const materialSystem = new EmissiveMaterialSystem();
 *
 * // Create materials
 * const bikeMaterial = materialSystem.createBikeMaterial('player', 0x00ff00);
 * const trailMaterial = materialSystem.createTrailMaterial('player', 0x00ff00);
 *
 * // Update in game loop
 * materialSystem.updatePulseAnimation(deltaTime);
 *
 * // Control intensity
 * materialSystem.setGlobalIntensityMultiplier(0.5); // 50% intensity
 *
 * // Cleanup
 * materialSystem.dispose();
 * ```
 *
 * @class EmissiveMaterialSystem
 * @author LightBikes Development Team
 * @version 1.0.0
 * @since 2024
 */
class EmissiveMaterialSystem {
    constructor() {
        // Material storage using entity IDs
        this.materials = new Map(); // Entity ID -> Material

        // Pulse animation state
        this.pulseState = {
            time: 0,
            intensity: 1.0,
            paused: false,
            period: 2.5, // 2-3 second pulse cycle
            minIntensity: 0.8, // 80% minimum intensity
            maxIntensity: 1.0, // 100% maximum intensity
        };

        // Base emissive intensities as specified in requirements
        this.baseIntensities = {
            bike: 0.8, // Bikes glow brighter
            trail: 0.6, // Trails glow less for visual hierarchy
        };

        // Global intensity multiplier (controlled by user settings)
        this.globalIntensityMultiplier = 1.0;

        // Material disposal tracking
        this.disposedMaterials = new Set();
    }

    /**
     * Create emissive material for bikes
     * @param {string} entityId - Entity identifier for material storage
     * @param {number} color - Color hex value (e.g., 0x00ff00)
     * @returns {THREE.Material} Emissive material for bike
     */
    createBikeMaterial(entityId, color) {
        // Dispose of existing material if it exists
        this.disposeMaterial(entityId);

        const material = new THREE.MeshLambertMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: this.baseIntensities.bike * this.globalIntensityMultiplier,
            transparent: false,
        });

        // Store material with entity ID for management
        this.materials.set(entityId, {
            material: material,
            type: 'bike',
            baseIntensity: this.baseIntensities.bike,
            color: color,
        });

        return material;
    }

    /**
     * Create emissive material for trail segments
     * @param {string} entityId - Entity identifier for material storage
     * @param {number} color - Color hex value (e.g., 0x00ff00)
     * @returns {THREE.Material} Emissive material for trail
     */
    createTrailMaterial(entityId, color) {
        // Dispose of existing material if it exists
        this.disposeMaterial(entityId);

        const material = new THREE.MeshBasicMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: this.baseIntensities.trail * this.globalIntensityMultiplier,
            transparent: true,
            opacity: 0.8, // Semi-transparent for trail segments
        });

        // Store material with entity ID for management
        this.materials.set(entityId, {
            material: material,
            type: 'trail',
            baseIntensity: this.baseIntensities.trail,
            color: color,
        });

        return material;
    }

    /**
     * Update pulse animation for all materials
     * Varies intensity between 80% and 100% with synchronized timing
     * @param {number} deltaTime - Time since last frame in seconds
     */
    updatePulseAnimation(deltaTime) {
        if (this.pulseState.paused) {
            return;
        }

        // Update pulse time
        this.pulseState.time += deltaTime;

        // Calculate pulse cycle progress (0 to 1)
        const cycleProgress =
            (this.pulseState.time % this.pulseState.period) / this.pulseState.period;

        // Calculate pulse intensity using sine wave for smooth breathing effect
        const pulseRange = this.pulseState.maxIntensity - this.pulseState.minIntensity;
        this.pulseState.intensity =
            this.pulseState.minIntensity +
            pulseRange * (Math.sin(cycleProgress * Math.PI * 2) * 0.5 + 0.5);

        // Apply pulse intensity to all stored materials
        this.materials.forEach((materialData, entityId) => {
            if (!this.disposedMaterials.has(entityId)) {
                const finalIntensity =
                    materialData.baseIntensity *
                    this.globalIntensityMultiplier *
                    this.pulseState.intensity;

                materialData.material.emissiveIntensity = finalIntensity;
            }
        });
    }

    /**
     * Pause pulse animation (for game pause state)
     */
    pausePulse() {
        this.pulseState.paused = true;
    }

    /**
     * Resume pulse animation (when game resumes)
     */
    resumePulse() {
        this.pulseState.paused = false;
    }

    /**
     * Set global emissive intensity multiplier
     * Used by settings system to control overall glow intensity
     * @param {number} multiplier - Intensity multiplier (0 = off, 1 = full)
     */
    setGlobalIntensityMultiplier(multiplier) {
        this.globalIntensityMultiplier = Math.max(0, multiplier);

        // Update all existing materials immediately
        this.materials.forEach((materialData, entityId) => {
            if (!this.disposedMaterials.has(entityId)) {
                const finalIntensity =
                    materialData.baseIntensity *
                    this.globalIntensityMultiplier *
                    this.pulseState.intensity;

                materialData.material.emissiveIntensity = finalIntensity;
            }
        });
    }

    /**
     * Get material by entity ID
     * @param {string} entityId - Entity identifier
     * @returns {THREE.Material|null} Material or null if not found
     */
    getMaterial(entityId) {
        const materialData = this.materials.get(entityId);
        return materialData ? materialData.material : null;
    }

    /**
     * Remove and dispose material by entity ID
     * @param {string} entityId - Entity identifier
     */
    disposeMaterial(entityId) {
        const materialData = this.materials.get(entityId);
        if (materialData) {
            // Dispose of Three.js material to free GPU memory
            if (materialData.material && materialData.material.dispose) {
                materialData.material.dispose();
            }

            // Remove from storage
            this.materials.delete(entityId);
            this.disposedMaterials.add(entityId);
        }
    }

    /**
     * Get current pulse state information
     * @returns {Object} Pulse state data
     */
    getPulseState() {
        return {
            time: this.pulseState.time,
            intensity: this.pulseState.intensity,
            paused: this.pulseState.paused,
            cycleProgress: (this.pulseState.time % this.pulseState.period) / this.pulseState.period,
        };
    }

    /**
     * Reset pulse animation timing
     * Useful for synchronizing pulse across game restarts
     */
    resetPulseTimer() {
        this.pulseState.time = 0;
        this.pulseState.intensity = 1.0;
    }

    /**
     * Get material count by type
     * @returns {Object} Count of materials by type
     */
    getMaterialCounts() {
        const counts = { bike: 0, trail: 0, total: 0 };

        this.materials.forEach((materialData, entityId) => {
            if (!this.disposedMaterials.has(entityId)) {
                counts[materialData.type]++;
                counts.total++;
            }
        });

        return counts;
    }

    /**
     * Update material color (useful for dynamic color changes)
     * @param {string} entityId - Entity identifier
     * @param {number} newColor - New color hex value
     */
    updateMaterialColor(entityId, newColor) {
        const materialData = this.materials.get(entityId);
        if (materialData && !this.disposedMaterials.has(entityId)) {
            materialData.material.color.setHex(newColor);
            materialData.material.emissive.setHex(newColor);
            materialData.color = newColor;
        }
    }

    /**
     * Update bike material color for customization system
     * @param {string} playerId - Player identifier ('player' or AI ID)
     * @param {number} colorHex - Color as hex number
     */
    updateBikeMaterial(playerId, colorHex) {
        this.updateMaterialColor(playerId, colorHex);
    }

    /**
     * Update trail material template for future segments
     * This stores the color preference for new trail segments
     * @param {string} playerId - Player identifier
     * @param {number} colorHex - Color as hex number
     */
    updateTrailMaterialTemplate(playerId, colorHex) {
        // Store template for future trail segments
        if (!this.trailTemplates) {
            this.trailTemplates = new Map();
        }
        this.trailTemplates.set(playerId, colorHex);
    }

    /**
     * Get trail color template for a player
     * @param {string} playerId - Player identifier
     * @returns {number} Color hex value or default green
     */
    getTrailColorTemplate(playerId) {
        if (this.trailTemplates && this.trailTemplates.has(playerId)) {
            return this.trailTemplates.get(playerId);
        }
        return 0x00ff00; // Default green
    }

    /**
     * Clean up all materials and resources
     * Called when disposing of the system
     */
    dispose() {
        // Dispose of all materials
        this.materials.forEach((materialData, entityId) => {
            if (materialData.material && materialData.material.dispose) {
                materialData.material.dispose();
            }
        });

        // Clear storage
        this.materials.clear();
        this.disposedMaterials.clear();

        // Reset state
        this.pulseState.time = 0;
        this.pulseState.intensity = 1.0;
        this.pulseState.paused = false;
    }

    /**
     * Get system status for debugging
     * @returns {Object} System status information
     */
    getStatus() {
        const counts = this.getMaterialCounts();
        return {
            materialCount: counts.total,
            bikeMaterials: counts.bike,
            trailMaterials: counts.trail,
            pulseIntensity: this.pulseState.intensity,
            pulsePaused: this.pulseState.paused,
            globalMultiplier: this.globalIntensityMultiplier,
            disposedCount: this.disposedMaterials.size,
        };
    }
}

module.exports = { EmissiveMaterialSystem };
