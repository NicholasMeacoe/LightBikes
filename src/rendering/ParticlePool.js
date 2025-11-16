/**
 * ParticlePool - Memory-efficient particle management system
 * Provides object pooling for particles to minimize garbage collection
 * and improve performance during intensive particle effects
 */

const { Particle } = require('./Particle.js');

/**
 * ParticlePool class for managing particle object reuse
 * Implements object pooling pattern to reduce memory allocation overhead
 */
class ParticlePool {
    /**
     * Create a new ParticlePool
     * @param {number} maxParticles - Maximum number of particles in the pool
     */
    constructor(maxParticles = 200) {
        this.maxParticles = maxParticles;
        this.particles = [];
        this.activeParticles = [];
        this.inactiveParticles = [];
        this.activeCount = 0;
        
        // Pre-allocate all particles to avoid runtime allocation
        this.initializePool();
    }

    /**
     * Initialize the particle pool with pre-allocated particles
     * All particles start in the inactive state
     */
    initializePool() {
        for (let i = 0; i < this.maxParticles; i++) {
            const particle = new Particle();
            this.particles.push(particle);
            this.inactiveParticles.push(particle);
        }
    }

    /**
     * Acquire a particle from the pool
     * Returns null if no particles are available (pool overflow protection)
     * @returns {Particle|null} Available particle or null if pool is exhausted
     */
    acquire() {
        // Pool overflow protection - return null if no particles available
        if (this.inactiveParticles.length === 0) {
            return null;
        }

        // Get particle from inactive pool
        const particle = this.inactiveParticles.pop();
        
        // Reset particle to clean state
        particle.reset();
        particle.active = true;
        
        // Move to active pool
        this.activeParticles.push(particle);
        this.activeCount++;
        
        return particle;
    }

    /**
     * Release a particle back to the pool
     * Moves particle from active to inactive state for reuse
     * @param {Particle} particle - Particle to release back to pool
     */
    release(particle) {
        if (!particle) {
            return;
        }

        // Find particle in active pool
        const index = this.activeParticles.indexOf(particle);
        if (index === -1) {
            // Particle not found in active pool - might already be released
            return;
        }

        // Remove from active pool
        this.activeParticles.splice(index, 1);
        this.activeCount--;
        
        // Deactivate particle and reset state
        particle.active = false;
        particle.reset();
        
        // Return to inactive pool for reuse
        this.inactiveParticles.push(particle);
    }

    /**
     * Get all currently active particles
     * @returns {Particle[]} Array of active particles
     */
    getActiveParticles() {
        return this.activeParticles.slice(); // Return copy to prevent external modification
    }

    /**
     * Get current active particle count
     * @returns {number} Number of currently active particles
     */
    getActiveCount() {
        return this.activeCount;
    }

    /**
     * Get maximum particle capacity
     * @returns {number} Maximum number of particles this pool can manage
     */
    getMaxParticles() {
        return this.maxParticles;
    }

    /**
     * Get number of available (inactive) particles
     * @returns {number} Number of particles available for acquisition
     */
    getAvailableCount() {
        return this.inactiveParticles.length;
    }

    /**
     * Check if pool has available particles
     * @returns {boolean} True if particles are available for acquisition
     */
    hasAvailable() {
        return this.inactiveParticles.length > 0;
    }

    /**
     * Get pool utilization as percentage
     * @returns {number} Pool utilization percentage (0-100)
     */
    getUtilization() {
        return (this.activeCount / this.maxParticles) * 100;
    }

    /**
     * Release all active particles back to the pool
     * Useful for clearing all effects at once (e.g., game reset)
     */
    releaseAll() {
        // Create copy of active particles to avoid modification during iteration
        const particlesToRelease = [...this.activeParticles];
        
        for (const particle of particlesToRelease) {
            this.release(particle);
        }
    }

    /**
     * Update all active particles using batch operations for better performance
     * Automatically releases particles that have exceeded their lifetime
     * @param {number} deltaTime - Time elapsed since last update
     */
    updateParticles(deltaTime) {
        const particlesToRelease = [];
        
        // Batch update all active particles
        this.batchUpdateParticles(deltaTime, particlesToRelease);
        
        // Batch release inactive particles back to pool
        this.batchReleaseParticles(particlesToRelease);
    }

    /**
     * Batch update particles for improved performance
     * @param {number} deltaTime - Time elapsed since last update
     * @param {Particle[]} particlesToRelease - Array to collect particles for release
     */
    batchUpdateParticles(deltaTime, particlesToRelease) {
        // Process particles in batches to improve cache locality
        const batchSize = 32; // Process 32 particles at a time
        const totalParticles = this.activeParticles.length;

        for (let batchStart = 0; batchStart < totalParticles; batchStart += batchSize) {
            const batchEnd = Math.min(batchStart + batchSize, totalParticles);
            
            // Process current batch
            for (let i = batchStart; i < batchEnd; i++) {
                const particle = this.activeParticles[i];
                if (particle) {
                    particle.update(deltaTime);
                    
                    // Mark inactive particles for release
                    if (!particle.active) {
                        particlesToRelease.push(particle);
                    }
                }
            }
        }
    }

    /**
     * Batch release particles for improved performance
     * @param {Particle[]} particlesToRelease - Array of particles to release
     */
    batchReleaseParticles(particlesToRelease) {
        if (particlesToRelease.length === 0) return;

        // Sort particles by their index in activeParticles array for efficient removal
        particlesToRelease.sort((a, b) => {
            const indexA = this.activeParticles.indexOf(a);
            const indexB = this.activeParticles.indexOf(b);
            return indexB - indexA; // Sort in descending order for safe removal
        });

        // Batch release particles
        for (const particle of particlesToRelease) {
            this.release(particle);
        }
    }

    /**
     * Get pool statistics for debugging and monitoring
     * @returns {Object} Pool statistics
     */
    getStats() {
        return {
            maxParticles: this.maxParticles,
            activeCount: this.activeCount,
            availableCount: this.inactiveParticles.length,
            utilization: this.getUtilization(),
            totalParticles: this.particles.length
        };
    }

    /**
     * Validate pool integrity (for debugging)
     * Checks that all particles are accounted for and in correct states
     * @returns {boolean} True if pool integrity is valid
     */
    validateIntegrity() {
        const totalTracked = this.activeParticles.length + this.inactiveParticles.length;
        
        // Check total particle count
        if (totalTracked !== this.maxParticles) {
            console.warn(`Pool integrity error: Expected ${this.maxParticles} particles, found ${totalTracked}`);
            return false;
        }
        
        // Check active count consistency
        if (this.activeCount !== this.activeParticles.length) {
            console.warn(`Pool integrity error: Active count mismatch - counter: ${this.activeCount}, array: ${this.activeParticles.length}`);
            return false;
        }
        
        // Check for duplicate particles
        const allParticles = [...this.activeParticles, ...this.inactiveParticles];
        const uniqueParticles = new Set(allParticles);
        if (uniqueParticles.size !== allParticles.length) {
            console.warn('Pool integrity error: Duplicate particles detected');
            return false;
        }
        
        // Check particle states
        for (const particle of this.activeParticles) {
            if (!particle.active) {
                console.warn('Pool integrity error: Inactive particle in active pool');
                return false;
            }
        }
        
        for (const particle of this.inactiveParticles) {
            if (particle.active) {
                console.warn('Pool integrity error: Active particle in inactive pool');
                return false;
            }
        }
        
        return true;
    }

    /**
     * Dispose of the particle pool and clean up resources
     */
    dispose() {
        // Clear all arrays
        this.particles.length = 0;
        this.activeParticles.length = 0;
        this.inactiveParticles.length = 0;
        this.activeCount = 0;
    }
}

module.exports = { ParticlePool };