/**
 * Individual particle entity with physics properties
 * Used by the particle system for creating dynamic visual effects
 */

/**
 * Individual particle entity with physics properties
 */
class Particle {
    constructor() {
        this.position = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.color = new THREE.Color();
        this.size = 0.05;
        this.originalSize = 0.05; // Store original size for LOD calculations
        this.lifetime = 1.0;
        this.age = 0;
        this.active = false;
        this.type = 'trail'; // 'trail', 'explosion', 'collection'
        
        // Performance optimization properties
        this.culled = false; // Whether particle is culled from rendering
        this.lodLevel = 'high'; // Level of detail: 'high', 'medium', 'low', 'culled'
    }

    /**
     * Reset particle to initial state for reuse
     */
    reset() {
        this.position.set(0, 0, 0);
        this.velocity.set(0, 0, 0);
        this.acceleration.set(0, 0, 0);
        this.color.setHex(0xffffff);
        this.size = 0.05;
        this.originalSize = 0.05;
        this.lifetime = 1.0;
        this.age = 0;
        this.active = false;
        this.type = 'trail';
        
        // Reset performance optimization properties
        this.culled = false;
        this.lodLevel = 'high';
    }

    /**
     * Update particle physics and lifetime
     * @param {number} deltaTime - Time elapsed since last update
     */
    update(deltaTime) {
        if (!this.active) return;

        // Update age
        this.age += deltaTime;

        // Check if particle should be deactivated
        if (this.age >= this.lifetime) {
            this.active = false;
            return;
        }

        // Apply acceleration to velocity
        this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));

        // Apply velocity to position
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    }

    /**
     * Get current alpha value based on age and lifetime
     * @returns {number} Alpha value (0-1)
     */
    getAlpha() {
        if (!this.active) return 0;
        return Math.max(0, 1 - (this.age / this.lifetime));
    }
}

module.exports = { Particle };