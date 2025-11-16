/**
 * ShakeInstance represents an individual camera shake effect with its own lifecycle and properties.
 * Supports smooth decay functions using easing curves for natural feel.
 */
class ShakeInstance {
    /**
     * Creates a new shake instance
     * @param {number} intensity - Shake intensity (0.0 to 2.0)
     * @param {number} duration - Duration in seconds
     * @param {string} type - Type of shake ('collision' | 'nearMiss')
     */
    constructor(intensity, duration, type = 'collision') {
        this.intensity = Math.max(0, Math.min(2.0, intensity)); // Clamp to valid range
        this.duration = Math.max(0, duration);
        this.type = type;
        this.elapsed = 0;
        this.offset = { x: 0, y: 0, z: 0 };
        this.isActive = true;
        
        // Create decay function based on shake type
        this.decayFunction = this.createDecayFunction(type);
    }

    /**
     * Creates appropriate decay function for the shake type
     * @param {string} type - Type of shake
     * @returns {Function} Decay function that takes progress (0-1) and returns multiplier
     */
    createDecayFunction(type) {
        switch (type) {
            case 'collision':
                // Strong initial impact with exponential decay
                return (progress) => Math.pow(1 - progress, 2.5);
            case 'nearMiss':
                // Gentler sine-wave decay for subtle effect
                return (progress) => Math.sin((1 - progress) * Math.PI * 0.5);
            default:
                // Default quadratic ease-out
                return (progress) => Math.pow(1 - progress, 2);
        }
    }

    /**
     * Updates the shake instance for the current frame
     * @param {number} deltaTime - Time elapsed since last update in seconds
     * @returns {boolean} True if shake is still active, false if complete
     */
    update(deltaTime) {
        if (!this.isActive) {
            return false;
        }

        // Handle zero duration case - complete immediately
        if (this.duration <= 0) {
            this.isActive = false;
            this.offset = { x: 0, y: 0, z: 0 };
            return false;
        }

        this.elapsed += deltaTime;
        const progress = Math.min(this.elapsed / this.duration, 1.0);
        
        if (progress >= 1.0) {
            this.isActive = false;
            this.offset = { x: 0, y: 0, z: 0 };
            return false;
        }
        
        const currentIntensity = this.intensity * this.decayFunction(progress);
        this.generateOffset(currentIntensity);
        return true;
    }

    /**
     * Generates 3D camera displacement offset based on current intensity
     * @param {number} currentIntensity - Current shake intensity
     */
    generateOffset(currentIntensity) {
        if (currentIntensity <= 0) {
            this.offset = { x: 0, y: 0, z: 0 };
            return;
        }

        // Generate random offset in 3D space
        // Use different frequencies for each axis to create natural movement
        const time = this.elapsed;
        const frequency1 = 8.0; // Primary shake frequency
        const frequency2 = 12.0; // Secondary shake frequency
        const frequency3 = 6.0; // Tertiary shake frequency

        // Combine multiple sine waves for more natural shake pattern
        this.offset.x = currentIntensity * (
            Math.sin(time * frequency1) * 0.6 +
            Math.sin(time * frequency2) * 0.3 +
            Math.sin(time * frequency3) * 0.1
        );

        this.offset.y = currentIntensity * (
            Math.cos(time * frequency1 * 1.1) * 0.5 +
            Math.cos(time * frequency2 * 0.9) * 0.3 +
            Math.cos(time * frequency3 * 1.2) * 0.2
        );

        this.offset.z = currentIntensity * (
            Math.sin(time * frequency1 * 0.8) * 0.4 +
            Math.cos(time * frequency2 * 1.3) * 0.2 +
            Math.sin(time * frequency3 * 0.7) * 0.1
        );
    }

    /**
     * Gets the current 3D offset for camera displacement
     * @returns {Object} Object with x, y, z offset values
     */
    getOffset() {
        return { ...this.offset };
    }

    /**
     * Gets the current intensity multiplier (0-1)
     * @returns {number} Current intensity based on decay
     */
    getCurrentIntensity() {
        if (!this.isActive || this.duration <= 0) {
            return 0;
        }
        
        const progress = Math.min(this.elapsed / this.duration, 1.0);
        return this.intensity * this.decayFunction(progress);
    }

    /**
     * Checks if the shake instance is still active
     * @returns {boolean} True if active, false if complete
     */
    isComplete() {
        return !this.isActive;
    }

    /**
     * Gets shake type
     * @returns {string} Shake type
     */
    getType() {
        return this.type;
    }

    /**
     * Gets remaining duration
     * @returns {number} Remaining duration in seconds
     */
    getRemainingDuration() {
        return Math.max(0, this.duration - this.elapsed);
    }
}

module.exports = { ShakeInstance };