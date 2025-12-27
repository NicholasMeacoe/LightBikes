/**
 * MotionBlurController - Manages motion blur effects for LightBikes
 *
 * This class implements motion blur through Three.js post-processing with performance optimization.
 * It integrates with the existing post-processing pipeline and provides speed-based blur intensity
 * calculation for dynamic visual effects during high-speed gameplay.
 *
 * Key Features:
 * - Three.js EffectComposer integration with MotionBlurPass
 * - Speed-based blur intensity calculation
 * - Quality settings (Low, Medium, High) for performance optimization
 * - Automatic performance scaling based on frame rate
 * - WebGL capability detection and fallback handling
 * - Integration with existing renderer pipeline
 *
 * Quality Levels:
 * - High: Full resolution, maximum samples, best quality
 * - Medium: 75% resolution, reduced samples, balanced performance
 * - Low: 50% resolution, minimal samples, performance focused
 *
 * Usage Example:
 * ```javascript
 * const motionBlur = new MotionBlurController(renderer);
 *
 * // Initialize the controller
 * if (motionBlur.initialize()) {
 *     // Update blur based on speed
 *     motionBlur.updateBlurIntensity(2.5);
 *
 *     // Render with motion blur
 *     motionBlur.render(scene, camera);
 * }
 * ```
 *
 * @class MotionBlurController
 * @author LightBikes Development Team
 * @version 1.0.0
 * @since 2024
 */
const { createLogger } = require('../utils/Logger.js');
const logger = createLogger('MotionBlurController');

class MotionBlurController {
    constructor(renderer) {
        this.renderer = renderer;

        // Post-processing components
        this.composer = null;
        this.renderPass = null;
        this.motionBlurPass = null;

        // State tracking
        this.initialized = false;
        this.enabled = true;
        this.currentQuality = 'medium';

        // Motion blur configuration
        this.blurConfig = {
            intensity: 0.0, // Current blur intensity (0-1)
            maxIntensity: 0.8, // Maximum blur intensity
            speedThreshold: 1.5, // Speed threshold for blur activation
            samples: 32, // Number of blur samples
            velocityFactor: 0.5, // Velocity to blur intensity factor
        };

        // Quality settings for performance scaling
        this.qualitySettings = {
            high: {
                resolution: 1.0,
                samples: 32,
                velocityFactor: 0.5,
                maxIntensity: 0.8,
            },
            medium: {
                resolution: 0.75,
                samples: 16,
                velocityFactor: 0.4,
                maxIntensity: 0.6,
            },
            low: {
                resolution: 0.5,
                samples: 8,
                velocityFactor: 0.3,
                maxIntensity: 0.4,
            },
        };

        // Performance monitoring
        this.performanceMetrics = {
            lastFrameTime: 0,
            averageFrameTime: 16.67, // 60fps baseline
            frameCount: 0,
            autoScalingEnabled: true,
            performanceHistory: [],
            maxHistoryLength: 120, // 2 seconds at 60fps
            lastQualityAdjustment: 0,
            qualityAdjustmentCooldown: 2000, // 2 seconds between adjustments
        };

        // WebGL capability detection
        this.capabilities = {
            webglSupported: true,
            postProcessingSupported: true,
            motionBlurSupported: true,
            maxTextureSize: 0,
            maxRenderBufferSize: 0,
            floatTextureSupport: false,
            depthTextureSupport: false,
            devicePixelRatio: window.devicePixelRatio || 1,
        };

        // Speed tracking integration
        this.speedTracker = null; // Will be set by SpeedTracker

        // Fallback state
        this.fallbackMode = false;
    }

    /**
     * Initialize the motion blur controller
     * Sets up Three.js EffectComposer and MotionBlurPass
     * @param {any} errorHandler - Error handler for reporting issues
     * @returns {boolean} Success status
     */
    initialize(errorHandler = null) {
        this.errorHandler = errorHandler;

        try {
            // Detect WebGL capabilities
            if (!this.detectWebGLCapabilities()) {
                const error = new Error('WebGL capabilities insufficient for motion blur');
                if (this.errorHandler) {
                    this.errorHandler.handleWebGLError(error, 'WebGL capability detection failed');
                }
                logger.warn('WebGL capabilities insufficient, using fallback');
                this.fallbackMode = true;
                return true; // Still return true for graceful degradation
            }

            // Check if required Three.js post-processing classes are available
            if (!this.checkPostProcessingSupport()) {
                const error = new Error('Post-processing classes not available');
                if (this.errorHandler) {
                    this.errorHandler.handlePostProcessingError(
                        error,
                        'Post-processing support check failed'
                    );
                }
                logger.warn('Post-processing not supported, using fallback');
                this.fallbackMode = true;
                return true;
            }

            // Create effect composer
            this.composer = new THREE.EffectComposer(this.renderer);
            this.composer.setSize(window.innerWidth, window.innerHeight);

            // Create and add render pass (renders the scene)
            this.renderPass = new THREE.RenderPass();
            this.composer.addPass(this.renderPass);

            // Create motion blur pass (simulated with custom implementation)
            this.motionBlurPass = this.createMotionBlurPass();
            if (this.motionBlurPass) {
                this.motionBlurPass.renderToScreen = true;
                this.composer.addPass(this.motionBlurPass);
            } else {
                const error = new Error('Motion blur pass creation failed');
                if (this.errorHandler) {
                    this.errorHandler.handlePostProcessingError(error, 'Motion blur pass creation');
                }
                logger.warn('Motion blur pass creation failed, using fallback');
                this.fallbackMode = true;
                return true;
            }

            // Set initial quality
            this.setQuality(this.currentQuality);

            this.initialized = true;
            logger.info('Successfully initialized with motion blur effects');
            return true;
        } catch (error) {
            logger.error('Failed to initialize', error);

            if (this.errorHandler) {
                this.errorHandler.handlePostProcessingError(
                    error,
                    'MotionBlurController initialization'
                );
            }

            this.fallbackMode = true;
            this.initialized = false;
            return false;
        }
    }

    /**
     * Detect WebGL capabilities for motion blur support
     * @returns {boolean} True if WebGL supports required features
     */
    detectWebGLCapabilities() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

            if (!gl) {
                this.capabilities.webglSupported = false;
                logger.warn('WebGL not supported');
                return false;
            }

            // Get basic capabilities
            /** @type {any} */
            const glAny = gl;
            this.capabilities.maxTextureSize = glAny.getParameter(glAny.MAX_TEXTURE_SIZE);
            this.capabilities.maxRenderBufferSize = glAny.getParameter(glAny.MAX_RENDERBUFFER_SIZE);

            // Check for required extensions
            const floatTextureExt =
                glAny.getExtension('OES_texture_float') ||
                glAny.getExtension('OES_texture_half_float');
            const depthTextureExt = glAny.getExtension('WEBGL_depth_texture');

            this.capabilities.floatTextureSupport = !!floatTextureExt;
            this.capabilities.depthTextureSupport = !!depthTextureExt;

            // Log extension availability
            if (!floatTextureExt) {
                logger.warn('Float texture extension not available, using fallback');
                this.capabilities.floatTextureSupport = false;
            }
            if (!depthTextureExt) {
                logger.warn('Depth texture extension not available');
                this.capabilities.depthTextureSupport = false;
            }

            // Check minimum requirements
            if (this.capabilities.maxTextureSize < 2048) {
                logger.warn('Insufficient texture size support');
                this.capabilities.webglSupported = false;
                return false;
            }

            // Detect mobile devices for performance adjustments
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent
            );
            if (isMobile) {
                logger.info('Mobile device detected, adjusting performance settings');
                this.capabilities.isMobile = true;
                this.setQuality('low');
                this.performanceMetrics.autoScalingEnabled = true;
            }

            // Check for high DPI displays
            if (this.capabilities.devicePixelRatio > 2) {
                logger.info(`High DPI display detected (${this.capabilities.devicePixelRatio}x)`);
                // Cap pixel ratio for performance
                this.capabilities.devicePixelRatio = Math.min(
                    this.capabilities.devicePixelRatio,
                    2
                );
            }

            this.capabilities.webglSupported = true;
            return true;
        } catch (error) {
            logger.error('WebGL capability detection failed', error);
            this.capabilities.webglSupported = false;
            return false;
        }
    }

    /**
     * Check if Three.js post-processing is supported
     * @returns {boolean} True if post-processing classes are available
     */
    checkPostProcessingSupport() {
        try {
            // Check for basic post-processing classes
            if (!THREE.EffectComposer || !THREE.RenderPass) {
                this.capabilities.postProcessingSupported = false;
                return false;
            }

            // Check for shader pass (needed for custom motion blur)
            if (!THREE.ShaderPass) {
                logger.warn('ShaderPass not available');
                this.capabilities.motionBlurSupported = false;
                return false;
            }

            this.capabilities.postProcessingSupported = true;
            this.capabilities.motionBlurSupported = true;
            return true;
        } catch (error) {
            logger.error('Post-processing support check failed', error);
            this.capabilities.postProcessingSupported = false;
            return false;
        }
    }

    /**
     * Create motion blur pass using custom shader
     * Since Three.js doesn't have a built-in MotionBlurPass, we create a custom one
     * @returns {THREE.ShaderPass|null} Motion blur pass or null if creation fails
     */
    createMotionBlurPass() {
        try {
            // Custom motion blur shader
            const motionBlurShader = {
                uniforms: {
                    tDiffuse: { value: null },
                    velocityFactor: { value: this.blurConfig.velocityFactor },
                    intensity: { value: this.blurConfig.intensity },
                    samples: { value: this.blurConfig.samples },
                },

                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,

                fragmentShader: `
                    uniform sampler2D tDiffuse;
                    uniform float velocityFactor;
                    uniform float intensity;
                    uniform float samples;
                    varying vec2 vUv;
                    
                    void main() {
                        vec4 color = texture2D(tDiffuse, vUv);
                        
                        if (intensity > 0.0) {
                            vec4 blurredColor = vec4(0.0);
                            float sampleCount = max(1.0, samples * intensity);
                            
                            // Simple radial blur effect
                            vec2 center = vec2(0.5, 0.5);
                            vec2 direction = normalize(vUv - center);
                            float distance = length(vUv - center);
                            
                            for (float i = 0.0; i < 32.0; i++) {
                                if (i >= sampleCount) break;
                                
                                float offset = (i / sampleCount) * intensity * velocityFactor * 0.02;
                                vec2 sampleUv = vUv - direction * offset;
                                blurredColor += texture2D(tDiffuse, sampleUv);
                            }
                            
                            blurredColor /= sampleCount;
                            color = mix(color, blurredColor, intensity);
                        }
                        
                        gl_FragColor = color;
                    }
                `,
            };

            // Create shader pass with custom motion blur shader
            const motionBlurPass = new THREE.ShaderPass(motionBlurShader);
            return motionBlurPass;
        } catch (error) {
            logger.error('Failed to create motion blur pass', error);
            return null;
        }
    }

    /**
     * Update blur intensity based on speed
     * @param {number} speed - Current speed value
     */
    updateBlurIntensity(speed) {
        if (this.fallbackMode || !this.enabled) {
            return;
        }

        try {
            // Calculate blur intensity based on speed
            const normalizedSpeed = Math.max(0, speed - this.blurConfig.speedThreshold);
            const targetIntensity = Math.min(
                (normalizedSpeed / 3.0) * this.blurConfig.maxIntensity,
                this.blurConfig.maxIntensity
            );

            // Smooth intensity transitions
            const smoothingFactor = 0.1;
            this.blurConfig.intensity =
                this.blurConfig.intensity +
                (targetIntensity - this.blurConfig.intensity) * smoothingFactor;

            // Update shader uniforms if available
            if (this.motionBlurPass && this.motionBlurPass.uniforms) {
                this.motionBlurPass.uniforms.intensity.value = this.blurConfig.intensity;
                this.motionBlurPass.uniforms.velocityFactor.value = this.blurConfig.velocityFactor;
            }

            // Debug logging (will be removed in production)
            if (this.blurConfig.intensity > 0.01) {
                logger.debug(
                    `Speed: ${speed.toFixed(2)}, Intensity: ${this.blurConfig.intensity.toFixed(3)}`
                );
            }
        } catch (error) {
            logger.error('Error updating blur intensity', error);
        }
    }

    /**
     * Set motion blur quality for performance optimization
     * @param {string} quality - Quality level ('low', 'medium', 'high')
     */
    setQuality(quality) {
        if (!this.qualitySettings[quality]) {
            logger.warn(`Invalid quality level: ${quality}`);
            return;
        }

        this.currentQuality = quality;
        const settings = this.qualitySettings[quality];

        // Update configuration
        this.blurConfig.samples = settings.samples;
        this.blurConfig.velocityFactor = settings.velocityFactor;
        this.blurConfig.maxIntensity = settings.maxIntensity;

        if (this.motionBlurPass && this.composer) {
            // Update composer resolution
            const size = this.renderer.getSize(new THREE.Vector2());
            const newWidth = Math.floor(size.x * settings.resolution);
            const newHeight = Math.floor(size.y * settings.resolution);

            this.resizeComposer(newWidth, newHeight);

            // Update shader uniforms
            if (this.motionBlurPass.uniforms) {
                this.motionBlurPass.uniforms.samples.value = settings.samples;
                this.motionBlurPass.uniforms.velocityFactor.value = settings.velocityFactor;
            }

            logger.info(`Quality set to ${quality} (${newWidth}x${newHeight})`);
        }
    }

    /**
     * Helper to resize the composer and renderer
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resizeComposer(width, height) {
        if (this.composer) {
            this.composer.setSize(width, height);
            // If the renderer's size is also managed by the composer, it might not need explicit resizing here.
            // However, if the renderer is used for other things, it might need to be resized separately.
            // For now, assume composer handles the render target size.
        }
    }

    /**
     * Get the current quality level
     * @returns {string} Quality level ('low', 'medium', 'high', 'minimal')
     */
    getCurrentQuality() {
        return this.currentQuality;
    }

    /**
     * Enable or disable motion blur
     * @param {boolean} enabled - Whether to enable motion blur
     */
    setEnabled(enabled) {
        this.enabled = Boolean(enabled);

        if (!this.enabled) {
            // Reset blur intensity when disabled
            this.blurConfig.intensity = 0.0;
            if (this.motionBlurPass && this.motionBlurPass.uniforms) {
                this.motionBlurPass.uniforms.intensity.value = 0.0;
            }
        }

        logger.info(`${this.enabled ? 'Enabled' : 'Disabled'}`);
    }

    /**
     * Render scene with motion blur effects
     * @param {THREE.Scene} scene - Scene to render
     * @param {THREE.Camera} camera - Camera to use for rendering
     */
    render(scene, camera) {
        if (this.fallbackMode || !this.initialized || !this.composer) {
            // Fallback to standard rendering
            this.renderer.render(scene, camera);
            return;
        }

        try {
            // Update render pass with current scene and camera
            if (this.renderPass) {
                this.renderPass.scene = scene;
                this.renderPass.camera = camera;
            }

            // Update performance metrics
            this.updatePerformanceMetrics();

            // Execute post-processing pipeline
            this.composer.render();

            // Auto-scale quality based on performance if enabled
            if (this.performanceMetrics.autoScalingEnabled) {
                this.autoScaleQuality();
            }
        } catch (error) {
            logger.error('Error during render', error);

            // Report error to error handler
            if (this.errorHandler) {
                this.errorHandler.handlePostProcessingError(error, 'Motion blur render');
            }

            // Fallback to standard rendering on error
            this.renderer.render(scene, camera);

            // Enter fallback mode after render errors
            this.fallbackMode = true;
        }
    }

    /**
     * Update performance metrics for automatic quality scaling
     */
    updatePerformanceMetrics() {
        const currentTime = performance.now();
        // logger.debug('updatePerformanceMetrics: currentTime =', currentTime, 'lastFrameTime =', this.performanceMetrics.lastFrameTime);

        if (this.performanceMetrics.lastFrameTime > 0) {
            const frameTime = currentTime - this.performanceMetrics.lastFrameTime;

            // Update running average (exponential moving average)
            this.performanceMetrics.averageFrameTime =
                this.performanceMetrics.averageFrameTime * 0.9 + frameTime * 0.1;

            // Add to performance history for trend analysis
            this.performanceMetrics.performanceHistory.push({
                frameTime: frameTime,
                timestamp: currentTime,
                fps: 1000 / frameTime,
            });

            // Limit history size
            if (
                this.performanceMetrics.performanceHistory.length >
                this.performanceMetrics.maxHistoryLength
            ) {
                this.performanceMetrics.performanceHistory.shift();
            }
        }

        this.performanceMetrics.lastFrameTime = currentTime;
        this.performanceMetrics.frameCount++;
    }

    /**
     * Automatically scale quality based on performance
     */
    autoScaleQuality() {
        // Don't auto-scale if disabled
        if (!this.performanceMetrics.autoScalingEnabled) {
            return;
        }

        const currentTime = performance.now();
        const currentFPS = 1000 / this.performanceMetrics.averageFrameTime;

        // Only adjust quality after sufficient samples and cooldown period
        if (
            this.performanceMetrics.frameCount < 60 ||
            currentTime - this.performanceMetrics.lastQualityAdjustment <
                this.performanceMetrics.qualityAdjustmentCooldown
        ) {
            return;
        }

        // Analyze performance trend over recent history
        const recentHistory = this.performanceMetrics.performanceHistory.slice(-30); // Last 30 frames
        if (recentHistory.length < 30) {
            return;
        }

        const averageRecentFPS =
            recentHistory.reduce((sum, entry) => sum + entry.fps, 0) / recentHistory.length;
        const minRecentFPS = Math.min(...recentHistory.map((entry) => entry.fps));
        const maxRecentFPS = Math.max(...recentHistory.map((entry) => entry.fps));
        const fpsVariability = maxRecentFPS - minRecentFPS;

        // Performance thresholds with hysteresis to prevent oscillation
        const criticalFPSThreshold = 25;
        const lowFPSThreshold = 35;
        const mediumFPSThreshold = 45;
        const highFPSThreshold = 55;
        const excellentFPSThreshold = 65;

        // Determine appropriate quality level based on performance and stability
        let targetQuality = this.currentQuality;

        // Aggressive downscaling for critical performance
        if (averageRecentFPS < 20) {
            logger.warn('Performance critically low, disabling motion blur');
            this.setEnabled(false);
            return;
        } else if (minRecentFPS < criticalFPSThreshold) {
            targetQuality = 'low';
        }
        // Downscale if average FPS is low or highly variable
        else if (averageRecentFPS < lowFPSThreshold || fpsVariability > 20) {
            if (this.currentQuality === 'high') {
                targetQuality = 'medium';
            } else if (this.currentQuality === 'medium') {
                targetQuality = 'low';
            }
        }
        // Conservative upscaling only when performance is consistently good
        else if (minRecentFPS > highFPSThreshold && fpsVariability < 10) {
            if (this.currentQuality === 'low' && averageRecentFPS > mediumFPSThreshold) {
                targetQuality = 'medium';
            } else if (
                this.currentQuality === 'medium' &&
                averageRecentFPS > excellentFPSThreshold
            ) {
                targetQuality = 'high';
            }
        }

        // Apply quality change if needed
        if (targetQuality !== this.currentQuality) {
            logger.info(`Auto-scaling quality from ${this.currentQuality} to ${targetQuality}`);
            logger.debug(
                `Performance: Avg FPS: ${averageRecentFPS.toFixed(1)}, Min: ${minRecentFPS.toFixed(1)}, Variability: ${fpsVariability.toFixed(1)}`
            );

            this.setQuality(targetQuality);
            this.performanceMetrics.lastQualityAdjustment = currentTime;
        }
    }

    /**
     * Handle window resize events
     * @param {number} width - New window width
     * @param {number} height - New window height
     */
    resize(width, height) {
        if (this.fallbackMode || !this.initialized) {
            return;
        }

        try {
            // Update composer size based on current quality
            if (this.composer) {
                const settings = this.qualitySettings[this.currentQuality];
                const newWidth = Math.floor(width * settings.resolution);
                const newHeight = Math.floor(height * settings.resolution);

                this.resizeComposer(newWidth, newHeight);
                logger.debug(`Resized to ${width}x${height}, blur: ${newWidth}x${newHeight}`);
            }
        } catch (error) {
            logger.error('Error during resize', error);
        }
    }

    /**
     * Set speed tracker for integration
     * @param {Object} speedTracker - SpeedTracker instance
     */
    setSpeedTracker(speedTracker) {
        this.speedTracker = speedTracker;
        logger.info('Speed tracker integrated');
    }

    /**
     * Get current blur configuration
     * @returns {Object} Current blur settings
     */
    getBlurConfig() {
        return { ...this.blurConfig };
    }

    /**
     * Get current quality level
     * @returns {string} Current quality level
     */
    getCurrentQuality() {
        return this.currentQuality;
    }

    /**
     * Get performance metrics
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        const recentHistory = this.performanceMetrics.performanceHistory.slice(-30);
        const averageRecentFPS =
            recentHistory.length > 0
                ? recentHistory.reduce((sum, entry) => sum + entry.fps, 0) / recentHistory.length
                : 0;
        const minRecentFPS =
            recentHistory.length > 0 ? Math.min(...recentHistory.map((entry) => entry.fps)) : 0;

        return {
            ...this.performanceMetrics,
            currentFPS: 1000 / this.performanceMetrics.averageFrameTime,
            averageRecentFPS: averageRecentFPS,
            minRecentFPS: minRecentFPS,
            isPerformanceGood: this.performanceMetrics.averageFrameTime < 20, // 50+ FPS
            isPerformanceStable:
                recentHistory.length > 0
                    ? Math.max(...recentHistory.map((entry) => entry.fps)) - minRecentFPS < 15
                    : true,
        };
    }

    /**
     * Enable or disable automatic performance scaling
     * @param {boolean} enabled - Whether to enable auto-scaling
     */
    setAutoScalingEnabled(enabled) {
        this.performanceMetrics.autoScalingEnabled = Boolean(enabled);
        logger.info(
            `Auto-scaling ${this.performanceMetrics.autoScalingEnabled ? 'enabled' : 'disabled'}`
        );
    }

    /**
     * Force a specific quality level and disable auto-scaling
     * @param {string} quality - Quality level to force
     */
    forceQuality(quality) {
        this.setQuality(quality);
        this.setAutoScalingEnabled(false);
        logger.info(`Forced quality to ${quality}, auto-scaling disabled`);
    }

    /**
     * Reset performance metrics and history
     */
    resetPerformanceMetrics() {
        this.performanceMetrics.frameCount = 0;
        this.performanceMetrics.performanceHistory = [];
        this.performanceMetrics.lastFrameTime = 0;
        this.performanceMetrics.averageFrameTime = 16.67;
        this.performanceMetrics.lastQualityAdjustment = 0;
        logger.debug('Performance metrics reset');
    }

    /**
     * Get detailed performance analysis
     * @returns {Object} Detailed performance information
     */
    getPerformanceAnalysis() {
        const history = this.performanceMetrics.performanceHistory;
        if (history.length === 0) {
            return {
                available: false,
                message: 'Insufficient performance data',
            };
        }

        const recentHistory = history.slice(-60); // Last 60 frames (1 second at 60fps)
        const fps = recentHistory.map((entry) => entry.fps);

        const avgFPS = fps.reduce((sum, f) => sum + f, 0) / fps.length;
        const minFPS = Math.min(...fps);
        const maxFPS = Math.max(...fps);
        const medianFPS = fps.sort((a, b) => a - b)[Math.floor(fps.length / 2)];

        // Calculate frame time percentiles
        const frameTimes = recentHistory.map((entry) => entry.frameTime).sort((a, b) => a - b);
        const p95FrameTime = frameTimes[Math.floor(frameTimes.length * 0.95)];
        const p99FrameTime = frameTimes[Math.floor(frameTimes.length * 0.99)];

        return {
            available: true,
            sampleCount: recentHistory.length,
            fps: {
                average: avgFPS,
                minimum: minFPS,
                maximum: maxFPS,
                median: medianFPS,
                variability: maxFPS - minFPS,
            },
            frameTime: {
                average: 1000 / avgFPS,
                p95: p95FrameTime,
                p99: p99FrameTime,
            },
            performance: {
                isGood: avgFPS > 50,
                isStable: maxFPS - minFPS < 15,
                recommendedQuality: this.getRecommendedQuality(avgFPS, minFPS, maxFPS - minFPS),
            },
            recommendation: this.getRecommendedQuality(avgFPS, minFPS, maxFPS - minFPS),
            capabilities: this.capabilities,
        };
    }

    /**
     * Get recommended quality based on performance metrics
     * @param {number} avgFPS - Average FPS
     * @param {number} minFPS - Minimum FPS
     * @param {number} variability - FPS variability
     * @returns {string} Recommended quality level
     */
    getRecommendedQuality(avgFPS, minFPS, variability) {
        if (minFPS < 25 || avgFPS < 30) {
            return 'low';
        } else if (minFPS < 40 || avgFPS < 45 || variability > 20) {
            return 'medium';
        } else if (minFPS > 50 && avgFPS > 60 && variability < 10) {
            return 'high';
        } else {
            return 'medium';
        }
    }

    /**
     * Get controller status information
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            initialized: this.initialized,
            enabled: this.enabled,
            fallbackMode: this.fallbackMode,
            quality: this.currentQuality,
            blurIntensity: this.blurConfig.intensity,
            capabilities: { ...this.capabilities },
            performanceMetrics: this.getPerformanceMetrics(),
        };
    }

    /**
     * Pause motion blur effects
     */
    pause() {
        if (!this.initialized) {
            return;
        }

        // Reset blur intensity when paused
        this.blurConfig.intensity = 0.0;
        if (this.motionBlurPass && this.motionBlurPass.uniforms) {
            this.motionBlurPass.uniforms.intensity.value = 0.0;
        }

        logger.debug('Paused');
    }

    /**
     * Resume motion blur effects
     */
    resume() {
        if (!this.initialized) {
            return;
        }

        // Reset timing to prevent large delta time jumps
        this.performanceMetrics.lastFrameTime = performance.now();

        logger.debug('Resumed');
    }

    /**
     * Clean up resources and dispose of post-processing components
     */
    destroy() {
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
            this.motionBlurPass = null;
            this.speedTracker = null;
            this.initialized = false;

            logger.info('Resources disposed');
        } catch (error) {
            logger.error('Error during disposal', error);
        }
    }
}

module.exports = { MotionBlurController };
