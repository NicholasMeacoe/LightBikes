const { ShakeInstance } = require('./ShakeInstance.js');
const { createLogger } = require('../utils/Logger.js');
const logger = createLogger('CameraShakeController');

/**
 * CameraShakeController manages camera shake effects with smooth interpolation
 * and configurable intensity. Supports multiple simultaneous shake effects.
 */
class CameraShakeController {
    /**
     * Creates a new camera shake controller
     * @param {Object} camera - Three.js camera object
     */
    constructor(camera) {
        this.camera = camera;
        this.originalPosition = camera
            ? {
                  x: camera.position.x,
                  y: camera.position.y,
                  z: camera.position.z,
              }
            : { x: 0, y: 0, z: 0 };

        this.shakeOffset = { x: 0, y: 0, z: 0 };
        this.activeShakes = [];
        this.intensityMultiplier = 1.0; // 0.0 to 2.0
        this.enabled = true;

        // Configuration for different shake types with user preference scaling
        this.shakeConfig = {
            collision: {
                minIntensity: 0.5,
                maxIntensity: 1.0,
                defaultIntensity: 0.75,
                defaultDuration: 1.0,
            },
            nearMiss: {
                minIntensity: 0.1,
                maxIntensity: 0.2,
                defaultIntensity: 0.15,
                defaultDuration: 0.3,
            },
        };

        // User preference settings (Off, Low, Medium, High)
        this.intensitySettings = {
            off: 0.0,
            low: 0.5,
            medium: 1.0,
            high: 1.5,
        };

        this.currentIntensitySetting = 'medium'; // Default to medium
    }

    /**
     * Triggers a collision shake effect with intensity scaling
     * @param {number} intensity - Shake intensity (0.5-1.0), optional
     * @param {number} duration - Duration in seconds, optional (default 1.0)
     */
    triggerCollisionShake(intensity = null, duration = null) {
        if (!this.enabled || this.currentIntensitySetting === 'off') return;

        const config = this.shakeConfig.collision;
        let baseIntensity =
            intensity !== null
                ? Math.max(config.minIntensity, Math.min(config.maxIntensity, intensity))
                : config.defaultIntensity;

        // Apply user preference scaling
        const userScale = this.intensitySettings[this.currentIntensitySetting];

        // Apply screen size scaling (reduce intensity on small screens)
        let screenScale = 1.0;
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            screenScale = 0.7; // Reduce by 30% on mobile
        }

        const finalIntensity = baseIntensity * userScale * this.intensityMultiplier * screenScale;

        const finalDuration = duration !== null ? duration : config.defaultDuration;

        const shake = new ShakeInstance(finalIntensity, finalDuration, 'collision');

        this.activeShakes.push(shake);
        this.cleanupCompletedShakes();
    }

    /**
     * Triggers a near-miss shake effect with distance-based intensity scaling
     * @param {number} distance - Distance of near miss (affects intensity)
     * @param {number} duration - Duration in seconds, optional (default 0.3)
     */
    triggerNearMissShake(distance = 1.0, duration = null) {
        if (!this.enabled || this.currentIntensitySetting === 'off') return;

        const config = this.shakeConfig.nearMiss;

        // Scale intensity based on distance (closer = stronger)
        // Distance of 0.1 = max intensity (0.2), distance of 1.0 = min intensity (0.1)
        const normalizedDistance = Math.max(0.1, Math.min(1.0, distance));
        const intensityScale = 1.0 - (normalizedDistance - 0.1) / 0.9;
        const baseIntensity =
            config.minIntensity + intensityScale * (config.maxIntensity - config.minIntensity);

        // Apply user preference scaling
        const userScale = this.intensitySettings[this.currentIntensitySetting];
        const finalIntensity = baseIntensity * userScale * this.intensityMultiplier;

        const finalDuration = duration !== null ? duration : config.defaultDuration;

        const shake = new ShakeInstance(finalIntensity, finalDuration, 'nearMiss');

        this.activeShakes.push(shake);
        this.cleanupCompletedShakes();
    }

    /**
     * Updates all active shake effects and applies combined offset to camera
     * @param {number} deltaTime - Time elapsed since last update in seconds
     */
    update(deltaTime) {
        if (!this.enabled || !this.camera) {
            this.shakeOffset = { x: 0, y: 0, z: 0 };
            return;
        }

        // Update all active shakes
        this.activeShakes = this.activeShakes.filter((shake) => shake.update(deltaTime));

        // Calculate combined offset from all active shakes
        this.calculateCombinedOffset();

        // Apply shake offset to camera
        this.applyShakeOffset();
    }

    /**
     * Calculates combined offset from all active shake instances
     * Uses additive approach for multiple simultaneous effects
     */
    calculateCombinedOffset() {
        this.shakeOffset = { x: 0, y: 0, z: 0 };

        if (this.activeShakes.length === 0) {
            return;
        }

        // Add all shake offsets together
        for (const shake of this.activeShakes) {
            const offset = shake.getOffset();
            this.shakeOffset.x += offset.x;
            this.shakeOffset.y += offset.y;
            this.shakeOffset.z += offset.z;
        }

        // Apply smooth interpolation to prevent jarring transitions
        // This helps when shakes are added or removed
        const smoothingFactor = 0.8;
        this.shakeOffset.x *= smoothingFactor;
        this.shakeOffset.y *= smoothingFactor;
        this.shakeOffset.z *= smoothingFactor;
    }

    /**
     * Applies the calculated shake offset to the camera position
     */
    applyShakeOffset() {
        if (!this.camera) return;

        this.camera.position.x = this.originalPosition.x + this.shakeOffset.x;
        this.camera.position.y = this.originalPosition.y + this.shakeOffset.y;
        this.camera.position.z = this.originalPosition.z + this.shakeOffset.z;
    }

    /**
     * Removes completed shake instances from active list
     */
    cleanupCompletedShakes() {
        this.activeShakes = this.activeShakes.filter((shake) => !shake.isComplete());
    }

    /**
     * Sets the intensity multiplier for all shake effects
     * @param {number} multiplier - Intensity multiplier (0.0 to 2.0)
     */
    setIntensityMultiplier(multiplier) {
        this.intensityMultiplier = Math.max(0.0, Math.min(2.0, multiplier));
    }

    /**
     * Gets the current intensity multiplier
     * @returns {number} Current intensity multiplier
     */
    getIntensityMultiplier() {
        return this.intensityMultiplier;
    }

    /**
     * Enables or disables camera shake effects
     * @param {boolean} enabled - Whether shake effects are enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;

        if (!enabled) {
            // Clear all active shakes and reset camera position
            this.activeShakes = [];
            this.shakeOffset = { x: 0, y: 0, z: 0 };
            if (this.camera) {
                this.camera.position.x = this.originalPosition.x;
                this.camera.position.y = this.originalPosition.y;
                this.camera.position.z = this.originalPosition.z;
            }
        }
    }

    /**
     * Checks if shake effects are enabled
     * @returns {boolean} True if enabled
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Updates the original camera position (call when camera moves)
     * @param {Object} position - New original position {x, y, z}
     */
    updateOriginalPosition(position) {
        this.originalPosition = { ...position };
    }

    /**
     * Gets the number of active shake effects
     * @returns {number} Number of active shakes
     */
    getActiveShakeCount() {
        return this.activeShakes.length;
    }

    /**
     * Gets current combined shake offset
     * @returns {Object} Current shake offset {x, y, z}
     */
    getCurrentOffset() {
        return { ...this.shakeOffset };
    }

    /**
     * Clears all active shake effects immediately
     */
    clearAllShakes() {
        this.activeShakes = [];
        this.shakeOffset = { x: 0, y: 0, z: 0 };
        if (this.camera) {
            this.camera.position.x = this.originalPosition.x;
            this.camera.position.y = this.originalPosition.y;
            this.camera.position.z = this.originalPosition.z;
        }
    }

    /**
     * Sets the intensity setting (Off, Low, Medium, High)
     * @param {string} setting - Intensity setting ('off', 'low', 'medium', 'high')
     */
    setIntensitySetting(setting) {
        const validSettings = Object.keys(this.intensitySettings);
        if (validSettings.includes(setting.toLowerCase())) {
            this.currentIntensitySetting = setting.toLowerCase();

            // If set to off, clear all active shakes
            if (this.currentIntensitySetting === 'off') {
                this.clearAllShakes();
            }
        } else {
            logger.warn(
                `Invalid intensity setting: ${setting}. Valid options: ${validSettings.join(', ')}`
            );
        }
    }

    /**
     * Gets the current intensity setting
     * @returns {string} Current intensity setting
     */
    getIntensitySetting() {
        return this.currentIntensitySetting;
    }

    /**
     * Gets all available intensity settings
     * @returns {Array} Array of available intensity setting names
     */
    getAvailableIntensitySettings() {
        return Object.keys(this.intensitySettings);
    }

    /**
     * Gets the effective intensity multiplier for a given setting
     * @param {string} setting - Intensity setting to check
     * @returns {number} Effective multiplier
     */
    getEffectiveIntensityMultiplier(setting = null) {
        const targetSetting = setting || this.currentIntensitySetting;
        const userScale = this.intensitySettings[targetSetting] || 1.0;
        return userScale * this.intensityMultiplier;
    }

    /**
     * Gets configuration for shake types
     * @returns {Object} Shake configuration object
     */
    getShakeConfig() {
        return {
            collision: { ...this.shakeConfig.collision },
            nearMiss: { ...this.shakeConfig.nearMiss },
            intensitySettings: { ...this.intensitySettings },
            currentSetting: this.currentIntensitySetting,
        };
    }

    /**
     * Updates shake timing configuration
     * @param {string} shakeType - Type of shake ('collision' or 'nearMiss')
     * @param {Object} config - Configuration object with duration and/or intensity
     */
    updateShakeConfig(shakeType, config) {
        if (this.shakeConfig[shakeType]) {
            if (config.duration !== undefined) {
                this.shakeConfig[shakeType].defaultDuration = Math.max(0, config.duration);
            }
            if (config.defaultIntensity !== undefined) {
                this.shakeConfig[shakeType].defaultIntensity = Math.max(0, config.defaultIntensity);
            }
            if (config.minIntensity !== undefined) {
                this.shakeConfig[shakeType].minIntensity = Math.max(0, config.minIntensity);
            }
            if (config.maxIntensity !== undefined) {
                this.shakeConfig[shakeType].maxIntensity = Math.max(0, config.maxIntensity);
            }
        }
    }

    /**
     * Gets information about all active shakes (for debugging)
     * @returns {Array} Array of shake information objects
     */
    getActiveShakesInfo() {
        return this.activeShakes.map((shake) => ({
            type: shake.getType(),
            intensity: shake.getCurrentIntensity(),
            remaining: shake.getRemainingDuration(),
            offset: shake.getOffset(),
        }));
    }
}

module.exports = { CameraShakeController };
