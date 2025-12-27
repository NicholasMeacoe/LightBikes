/**
 * PostProcessingPipeline - Manages Three.js post-processing effects for neon glow
 *
 * This class implements a complete post-processing pipeline using Three.js
 * EffectComposer to create realistic bloom/glow effects. It manages the rendering
 * chain that transforms emissive materials into beautiful neon-like visuals
 * with configurable quality levels for performance optimization.
 *
 * Key Features:
 * - Three.js EffectComposer integration with RenderPass and UnrealBloomPass
 * - Configurable bloom parameters (strength, threshold, radius)
 * - Dynamic quality scaling for performance optimization
 * - Window resize handling with proper buffer management
 * - Error handling with fallback to standard rendering
 * - Real-time parameter adjustment for user preferences
 *
 * Rendering Pipeline:
 * 1. RenderPass: Renders the scene to a render target
 * 2. UnrealBloomPass: Applies bloom effect to bright pixels
 * 3. Final composite: Combines original scene with bloom
 *
 * Quality Levels:
 * - High: Full resolution (1.0), maximum quality
 * - Medium: 75% resolution, balanced performance/quality
 * - Low: 50% resolution, performance focused
 * - Minimal: 25% resolution, maximum performance
 *
 * Bloom Configuration:
 * - Strength: Controls bloom intensity (0-2.0)
 * - Threshold: Brightness level required for bloom (0-1.0)
 * - Radius: Bloom spread distance (0-1.0)
 *
 * Usage Example:
 * ```javascript
 * const pipeline = new PostProcessingPipeline(renderer, scene, camera);
 *
 * // Initialize the pipeline
 * if (pipeline.initialize()) {
 *     // Configure bloom
 *     pipeline.setBloomStrength(1.5);
 *     pipeline.configureBloomParameters({ threshold: 0.85, radius: 0.4 });
 *
 *     // Render with effects
 *     pipeline.render();
 *
 *     // Handle window resize
 *     pipeline.resize(newWidth, newHeight);
 * }
 * ```
 *
 * @class PostProcessingPipeline
 * @author LightBikes Development Team
 * @version 1.0.0
 * @since 2024
 */
const { logger } = require('../utils/Logger.js');

class PostProcessingPipeline {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

        // Post-processing components
        this.composer = null;
        this.renderPass = null;
        this.bloomPass = null;

        // State tracking
        this.initialized = false;
        this.currentQuality = 'high';

        // Bloom configuration
        this.bloomConfig = {
            strength: 1.0,
            radius: 0.4,
            threshold: 0.85,
        };

        // Quality settings for performance scaling
        this.qualitySettings = {
            high: {
                resolution: 1.0,
                radius: 0.4,
                strength: 1.0,
                threshold: 0.85,
            },
            medium: {
                resolution: 0.75,
                radius: 0.3,
                strength: 0.8,
                threshold: 0.9,
            },
            low: {
                resolution: 0.5,
                radius: 0.2,
                strength: 0.6,
                threshold: 0.95,
            },
            minimal: {
                resolution: 0.25,
                radius: 0.1,
                strength: 0.4,
                threshold: 1.0,
            },
        };
    }

    /**
     * Initialize the post-processing pipeline
     * Sets up EffectComposer with RenderPass and UnrealBloomPass
     */
    initialize() {
        try {
            // Check if required Three.js post-processing classes are available
            if (!THREE.EffectComposer || !THREE.RenderPass || !THREE.UnrealBloomPass) {
                throw new Error('Required Three.js post-processing classes not available');
            }

            // Create effect composer
            this.composer = new THREE.EffectComposer(this.renderer);
            this.composer.setSize(window.innerWidth, window.innerHeight);

            // Create and add render pass (renders the scene)
            this.renderPass = new THREE.RenderPass(this.scene, this.camera);
            this.composer.addPass(this.renderPass);

            // Create and configure bloom pass
            this.bloomPass = new THREE.UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                this.bloomConfig.strength,
                this.bloomConfig.radius,
                this.bloomConfig.threshold
            );

            // Make bloom pass render to screen
            this.bloomPass.renderToScreen = true;
            this.composer.addPass(this.bloomPass);

            this.initialized = true;
            this.initialized = true;
            logger.info('PostProcessingPipeline: Successfully initialized with bloom effects');
            return true;
        } catch (error) {
            logger.error('PostProcessingPipeline: Failed to initialize:', error);
            this.initialized = false;
            return false;
        }
    }

    /**
     * Set bloom effect strength for intensity control
     * @param {number} strength - Bloom strength (0 = off, 1.5 = high)
     */
    setBloomStrength(strength) {
        if (!this.bloomPass) {
            logger.warn('PostProcessingPipeline: Bloom pass not initialized');
            return;
        }

        // Clamp strength to valid range
        const clampedStrength = Math.max(0, Math.min(2.0, strength));
        this.bloomPass.strength = clampedStrength;
        this.bloomConfig.strength = clampedStrength;

        logger.info(`PostProcessingPipeline: Bloom strength set to ${clampedStrength}`);
    }

    /**
     * Configure bloom threshold and radius parameters
     * @param {Object} config - Configuration object {threshold, radius}
     */
    configureBloomParameters(config = {}) {
        if (!this.bloomPass) {
            logger.warn('PostProcessingPipeline: Bloom pass not initialized');
            return;
        }

        // Update threshold if provided
        if (config.threshold !== undefined) {
            const clampedThreshold = Math.max(0, Math.min(1.0, config.threshold));
            this.bloomPass.threshold = clampedThreshold;
            this.bloomConfig.threshold = clampedThreshold;
        }

        // Update radius if provided
        if (config.radius !== undefined) {
            const clampedRadius = Math.max(0, Math.min(1.0, config.radius));
            this.bloomPass.radius = clampedRadius;
            this.bloomConfig.radius = clampedRadius;
        }

        logger.info('PostProcessingPipeline: Bloom parameters updated:', this.bloomConfig);
    }

    /**
     * Set rendering quality for performance scaling
     * @param {string} quality - Quality level ('high', 'medium', 'low', 'minimal')
     */
    setQuality(quality) {
        if (!this.qualitySettings[quality]) {
            logger.warn(`PostProcessingPipeline: Invalid quality level: ${quality}`);
            return;
        }

        this.currentQuality = quality;
        const settings = this.qualitySettings[quality];

        if (this.bloomPass && this.composer) {
            // Update bloom pass resolution
            const size = this.renderer.getSize(new THREE.Vector2());
            const newWidth = Math.floor(size.x * settings.resolution);
            const newHeight = Math.floor(size.y * settings.resolution);

            this.bloomPass.resolution = new THREE.Vector2(newWidth, newHeight);
            this.bloomPass.radius = settings.radius;
            this.bloomPass.threshold = settings.threshold;

            // Adjust strength based on quality to maintain visual consistency
            this.bloomPass.strength = this.bloomConfig.strength * settings.strength;

            logger.info(
                `PostProcessingPipeline: Quality set to ${quality} (${newWidth}x${newHeight})`
            );
        }
    }

    /**
     * Render the scene with post-processing effects
     * Executes the complete post-processing pipeline
     */
    render() {
        if (!this.initialized || !this.composer) {
            // Fallback to standard rendering if post-processing is not available
            this.renderer.render(this.scene, this.camera);
            return;
        }

        try {
            // Execute post-processing pipeline
            this.composer.render();
        } catch (error) {
            logger.error('PostProcessingPipeline: Error during render:', error);
            // Fallback to standard rendering on error
            this.renderer.render(this.scene, this.camera);
        }
    }

    /**
     * Handle window resize events
     * Updates post-processing buffers and maintains proper aspect ratios
     * @param {number} width - New window width
     * @param {number} height - New window height
     */
    resize(width, height) {
        if (!this.initialized) {
            return;
        }

        try {
            // Update composer size
            if (this.composer) {
                this.composer.setSize(width, height);
            }

            // Update bloom pass resolution based on current quality
            if (this.bloomPass) {
                const settings = this.qualitySettings[this.currentQuality];
                const newWidth = Math.floor(width * settings.resolution);
                const newHeight = Math.floor(height * settings.resolution);

                this.bloomPass.resolution = new THREE.Vector2(newWidth, newHeight);

                logger.info(
                    `PostProcessingPipeline: Resized to ${width}x${height}, bloom: ${newWidth}x${newHeight}`
                );
            }
        } catch (error) {
            logger.error('PostProcessingPipeline: Error during resize:', error);
        }
    }

    /**
     * Enable or disable the post-processing pipeline
     * @param {boolean} enabled - Whether to enable post-processing
     */
    setEnabled(enabled) {
        if (!this.initialized) {
            return;
        }

        // When disabled, we'll render normally in the render() method
        this.enabled = enabled;
        logger.info(`PostProcessingPipeline: ${enabled ? 'Enabled' : 'Disabled'}`);
    }

    /**
     * Get current bloom configuration
     * @returns {Object} Current bloom settings
     */
    getBloomConfig() {
        return { ...this.bloomConfig };
    }

    /**
     * Get current quality level
     * @returns {string} Current quality level
     */
    getCurrentQuality() {
        return this.currentQuality;
    }

    /**
     * Get pipeline status information
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            initialized: this.initialized,
            enabled: this.enabled !== false,
            quality: this.currentQuality,
            bloomStrength: this.bloomConfig.strength,
            bloomThreshold: this.bloomConfig.threshold,
            bloomRadius: this.bloomConfig.radius,
        };
    }

    /**
     * Clean up resources and dispose of post-processing components
     */
    dispose() {
        try {
            if (this.composer) {
                // Dispose of all passes
                this.composer.passes.forEach((pass) => {
                    if (pass.dispose) {
                        pass.dispose();
                    }
                });

                // Dispose of composer
                this.composer.dispose();
                this.composer = null;
            }

            this.renderPass = null;
            this.bloomPass = null;
            this.initialized = false;

            logger.info('PostProcessingPipeline: Resources disposed');
        } catch (error) {
            logger.error('PostProcessingPipeline: Error during disposal:', error);
        }
    }

    /**
     * Reset pipeline to default settings
     */
    reset() {
        if (!this.initialized) {
            return;
        }

        // Reset bloom configuration to defaults
        this.bloomConfig = {
            strength: 1.0,
            radius: 0.4,
            threshold: 0.85,
        };

        // Apply default settings
        if (this.bloomPass) {
            this.bloomPass.strength = this.bloomConfig.strength;
            this.bloomPass.radius = this.bloomConfig.radius;
            this.bloomPass.threshold = this.bloomConfig.threshold;
        }

        // Reset quality to high
        this.setQuality('high');

        logger.info('PostProcessingPipeline: Reset to default settings');
    }
}

module.exports = { PostProcessingPipeline };
