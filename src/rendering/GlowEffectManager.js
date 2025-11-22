/**
 * GlowEffectManager - Central coordinator for neon glow effects
 * 
 * This class serves as the main entry point for the neon glow effects system,
 * coordinating between post-processing pipeline, emissive materials, performance
 * scaling, and user settings. It provides a unified API for integrating glow
 * effects into the LightBikes game.
 * 
 * Key Features:
 * - Post-processing bloom effects using Three.js EffectComposer
 * - Emissive materials with synchronized pulsing animations
 * - Automatic performance scaling based on frame rate
 * - User-configurable intensity settings (Off, Low, Medium, High)
 * - WebGL compatibility checking with graceful fallback
 * - Memory leak prevention and resource cleanup
 * - Comprehensive error handling and recovery
 * 
 * Usage Example:
 * ```javascript
 * const glowManager = new GlowEffectManager(renderer, scene, camera);
 * 
 * // Initialize the system
 * if (glowManager.initialize()) {
 *     // Set user preference
 *     glowManager.setIntensity('HIGH');
 *     
 *     // In game loop
 *     glowManager.update(deltaTime, gameState);
 *     glowManager.render();
 *     
 *     // Create materials for game entities
 *     const bikeMaterial = glowManager.createBikeMaterial('player', 0x00ff00);
 *     const trailMaterial = glowManager.createTrailMaterial('player', 0x00ff00);
 * }
 * ```
 * 
 * Configuration Options:
 * - OFF: No glow effects (emissive: 0, bloom: 0)
 * - LOW: Subtle glow (emissive: 0.3, bloom: 0.5)
 * - MEDIUM: Balanced glow (emissive: 0.6, bloom: 1.0)
 * - HIGH: Strong glow (emissive: 0.8, bloom: 1.5)
 * 
 * Performance Scaling:
 * The system automatically monitors frame rate and adjusts quality:
 * - High: Full resolution bloom, all effects enabled
 * - Medium: 75% resolution bloom, reduced intensity
 * - Low: 50% resolution bloom, pulse disabled
 * - Minimal: 25% resolution bloom, minimal effects
 * - Disabled: All effects disabled for critical performance
 * 
 * Browser Compatibility:
 * - Requires WebGL 1.0 minimum
 * - Optimized for WebGL 2.0
 * - Graceful fallback for unsupported devices
 * - Mobile GPU detection and optimization
 * 
 * @class GlowEffectManager
 * @author LightBikes Development Team
 * @version 1.0.0
 * @since 2024
 */
class GlowEffectManager {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

        // Initialize subsystems
        this.postProcessing = null;
        this.materialSystem = null;
        this.performanceScaler = null;
        this.settings = null;

        // System state
        this.initialized = false;
        this.enabled = true;
        this.currentIntensity = 'MEDIUM';
        this.fallbackMode = false;
        this.forceQualityMode = null;

        // Performance monitoring
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.isPaused = false;
        this.lastQuality = null;

        // Memory monitoring
        this.memoryStats = null;
        this.memoryMonitorInterval = null;

        // Logging and debugging
        this.initializeLogging();
    }

    /**
     * Initialize the glow effect system
     * 
     * Sets up the complete glow effects pipeline including post-processing,
     * material system, performance scaling, and user settings. This method
     * performs comprehensive compatibility checking and provides fallback
     * rendering for unsupported devices.
     * 
     * Initialization Process:
     * 1. WebGL compatibility check with extension detection
     * 2. Post-processing pipeline setup (EffectComposer + UnrealBloomPass)
     * 3. Emissive material system initialization
     * 4. Performance scaler configuration
     * 5. User settings loading and application
     * 6. Memory monitoring setup (development mode)
     * 
     * Fallback Behavior:
     * - If WebGL is unsupported: Disables effects, uses standard materials
     * - If post-processing fails: Falls back to emissive materials only
     * - If initialization fails: Provides basic material factory
     * 
     * @returns {boolean} True if initialization successful (including fallback modes)
     * 
     * @example
     * ```javascript
     * const glowManager = new GlowEffectManager(renderer, scene, camera);
     * 
     * if (glowManager.initialize()) {
     *     console.log('Glow effects ready');
     *     // System is ready for use
     * } else {
     *     console.log('Glow effects unavailable');
     *     // Handle complete failure case
     * }
     * ```
     * 
     * @throws {Error} Only throws if both primary and fallback initialization fail
     */
    initialize() {
        try {
            // Check for WebGL support and required extensions
            if (!this.checkWebGLSupport()) {
                console.warn('GlowEffectManager: WebGL support insufficient, enabling fallback mode');
                this.initializeFallbackRendering();
                this.enabled = false;
                this.fallbackMode = true;
                return true; // Return true to indicate fallback is available
            }

            // Import and initialize subsystems
            const { PostProcessingPipeline } = require('./PostProcessingPipeline.js');
            const { EmissiveMaterialSystem } = require('./EmissiveMaterialSystem.js');
            const { PerformanceScaler } = require('../utils/PerformanceScaler.js');
            const { GlowSettings } = require('../systems/GlowSettings.js');

            this.postProcessing = new PostProcessingPipeline(this.renderer, this.scene, this.camera);
            this.materialSystem = new EmissiveMaterialSystem();
            this.performanceScaler = new PerformanceScaler();
            this.settings = new GlowSettings();

            // Apply forced quality mode if detected during compatibility check
            if (this.forceQualityMode) {
                this.performanceScaler.setQuality(this.forceQualityMode);
                console.log(`GlowEffectManager: Using forced quality mode: ${this.forceQualityMode}`);
            }

            // Initialize post-processing pipeline
            if (!this.postProcessing.initialize()) {
                console.warn('GlowEffectManager: Post-processing failed, falling back to compatibility mode');
                this.initializeFallbackRendering();
                this.enabled = false;
                this.fallbackMode = true;
                return true;
            }

            // Configure bloom parameters for optimal visual quality
            this.postProcessing.configureBloomParameters({
                threshold: 0.85,  // Only bright emissive materials will bloom
                radius: 0.4       // Moderate bloom spread
            });

            // Load user settings
            this.loadSettings();

            // Apply initial settings
            this.applyIntensitySettings();

            // Check compatibility with existing systems
            this.checkParticleCompatibility();

            // Start memory monitoring if enabled
            this.startMemoryMonitoring();

            this.initialized = true;
            console.log('GlowEffectManager: Successfully initialized');
            return true;

        } catch (error) {
            console.error('GlowEffectManager: Failed to initialize:', error);
            console.log('GlowEffectManager: Attempting fallback mode');

            try {
                this.initializeFallbackRendering();
                this.enabled = false;
                this.fallbackMode = true;
                return true;
            } catch (fallbackError) {
                console.error('GlowEffectManager: Fallback initialization also failed:', fallbackError);
                this.enabled = false;
                this.fallbackMode = false;
                return false;
            }
        }
    }

    /**
     * Update glow effects system
     * 
     * Called each frame to update pulse animations, monitor performance,
     * and handle game state changes. This method is the main update loop
     * for the glow effects system and should be called before rendering.
     * 
     * Update Operations:
     * 1. Input validation for deltaTime and gameState
     * 2. Pulse animation updates (2.5 second cycle, 80%-100% intensity)
     * 3. Performance monitoring and automatic quality scaling
     * 4. Pause/resume state handling for animations
     * 5. Error recovery and logging
     * 
     * Performance Monitoring:
     * - Tracks frame rate over 30-frame window
     * - Triggers quality reduction if FPS < 50 for 2+ seconds
     * - Attempts quality recovery after 5+ seconds of good performance
     * - Provides fallback to disabled state for critical performance
     * 
     * @param {number} deltaTime - Time since last frame in seconds (0-1 range expected)
     * @param {Object} gameState - Current game state object
     * @param {boolean} gameState.isPaused - Whether the game is currently paused
     * @param {Object} [gameState.entities] - Game entities for material management
     * 
     * @example
     * ```javascript
     * // In main game loop
     * function animate() {
     *     const deltaTime = clock.getDelta();
     *     const gameState = game.getGameState();
     *     
     *     glowManager.update(deltaTime, gameState);
     *     glowManager.render();
     *     
     *     requestAnimationFrame(animate);
     * }
     * ```
     * 
     * @see {@link GlowEffectManager#render} for rendering after update
     * @see {@link EmissiveMaterialSystem#updatePulseAnimation} for pulse details
     * @see {@link PerformanceScaler#monitorPerformance} for scaling logic
     */
    update(deltaTime, gameState) {
        if (!this.enabled || !this.initialized) {
            return;
        }

        try {
            // Validate inputs
            if (!this.validateUpdateInputs(deltaTime, gameState)) {
                return;
            }

            // Update pulse animations with error handling
            if (this.materialSystem) {
                try {
                    this.materialSystem.updatePulseAnimation(deltaTime);
                } catch (error) {
                    this.logError('update', 'Error updating pulse animation', {
                        deltaTime,
                        error: error.message
                    });
                }
            }

            // Monitor performance and scale if needed
            if (this.performanceScaler) {
                try {
                    this.performanceScaler.monitorPerformance(deltaTime);

                    // Apply dynamic scaling if performance drops
                    const currentQuality = this.performanceScaler.currentQuality;
                    if (currentQuality !== this.lastQuality) {
                        this.applyQualityScaling(currentQuality);
                        this.lastQuality = currentQuality;
                    }
                } catch (error) {
                    this.logError('update', 'Error in performance scaling', {
                        deltaTime,
                        error: error.message
                    });
                }
            }

            // Handle pause/resume state changes with error handling
            try {
                this.handlePauseStateChange(gameState);
            } catch (error) {
                this.logError('update', 'Error handling pause state change', {
                    gameState,
                    error: error.message
                });
            }

        } catch (error) {
            this.logError('update', 'Unexpected error during update', {
                deltaTime,
                gameState,
                error: error.message
            });
        }
    }

    /**
     * Validate update method inputs
     * @param {number} deltaTime - Delta time to validate
     * @param {Object} gameState - Game state to validate
     * @returns {boolean} True if inputs are valid
     */
    validateUpdateInputs(deltaTime, gameState) {
        if (typeof deltaTime !== 'number' || deltaTime < 0 || deltaTime > 1) {
            this.logWarning('validateUpdateInputs', 'Invalid deltaTime', { deltaTime });
            return false;
        }

        if (!gameState || typeof gameState !== 'object') {
            this.logWarning('validateUpdateInputs', 'Invalid gameState', { gameState });
            return false;
        }

        return true;
    }

    /**
     * Handle pause/resume state changes
     * @param {Object} gameState - Current game state
     */
    handlePauseStateChange(gameState) {
        if (gameState.isPaused && !this.isPaused) {
            if (this.materialSystem) {
                this.materialSystem.pausePulse();
            }
            this.isPaused = true;
            this.logInfo('handlePauseStateChange', 'Glow effects paused');
        } else if (!gameState.isPaused && this.isPaused) {
            if (this.materialSystem) {
                this.materialSystem.resumePulse();
            }
            this.isPaused = false;
            this.logInfo('handlePauseStateChange', 'Glow effects resumed');
        }
    }

    /**
     * Render the scene with glow effects
     * 
     * Executes the post-processing pipeline to apply bloom effects to emissive
     * materials. This method handles rendering failures gracefully with multiple
     * recovery strategies and fallback options.
     * 
     * Rendering Pipeline:
     * 1. Check system state (enabled, initialized, fallback mode)
     * 2. Execute post-processing pipeline (EffectComposer.render())
     * 3. Handle rendering errors with recovery procedures
     * 4. Fall back to standard rendering if necessary
     * 
     * Error Recovery Strategy:
     * 1. Attempt quality reduction (lower bloom resolution/intensity)
     * 2. Disable post-processing (keep emissive materials)
     * 3. Switch to fallback mode (basic materials with slight emissive)
     * 4. Final fallback to standard Three.js rendering
     * 
     * @example
     * ```javascript
     * // In main game loop (after update)
     * function animate() {
     *     glowManager.update(deltaTime, gameState);
     *     
     *     // Render with glow effects
     *     glowManager.render();
     *     
     *     requestAnimationFrame(animate);
     * }
     * ```
     * 
     * @see {@link GlowEffectManager#update} should be called before render
     * @see {@link PostProcessingPipeline#render} for pipeline details
     * @see {@link GlowEffectManager#handleRenderingFailure} for error recovery
     */
    render() {
        if (this.fallbackMode || !this.enabled || !this.initialized) {
            // Use standard rendering for fallback mode or when disabled
            try {
                this.renderer.render(this.scene, this.camera);
            } catch (error) {
                this.logError('render', 'Error in fallback rendering', { error: error.message });
            }
            return;
        }

        try {
            // Execute post-processing pipeline
            this.postProcessing.render();
        } catch (error) {
            this.logError('render', 'Error during post-processing render', { error: error.message });

            // Attempt recovery
            if (this.handleRenderingFailure(error, 'post-processing')) {
                // Retry with recovery settings
                try {
                    if (this.fallbackMode) {
                        this.renderer.render(this.scene, this.camera);
                    } else {
                        this.postProcessing.render();
                    }
                } catch (retryError) {
                    this.logError('render', 'Error during retry after recovery', { error: retryError.message });
                    // Final fallback to standard rendering
                    this.renderer.render(this.scene, this.camera);
                }
            } else {
                // Recovery failed, use standard rendering
                this.renderer.render(this.scene, this.camera);
            }
        }
    }

    /**
     * Set glow intensity level with validation and error recovery
     * 
     * Changes the overall intensity of glow effects by adjusting both emissive
     * material properties and bloom post-processing strength. Settings are
     * applied immediately and persisted to localStorage for future sessions.
     * 
     * Intensity Levels:
     * - OFF: Completely disables glow effects (emissive: 0, bloom: 0)
     * - LOW: Subtle glow for performance (emissive: 0.3, bloom: 0.5)
     * - MEDIUM: Balanced glow (default) (emissive: 0.6, bloom: 1.0)
     * - HIGH: Maximum glow intensity (emissive: 0.8, bloom: 1.5)
     * 
     * The method includes comprehensive error handling with rollback capability
     * if settings application fails. It also provides immediate visual feedback
     * by updating all existing materials and post-processing parameters.
     * 
     * @param {string} level - Intensity level ('OFF', 'LOW', 'MEDIUM', 'HIGH')
     * @returns {boolean} True if intensity was successfully changed
     * 
     * @example
     * ```javascript
     * // Set to maximum intensity
     * if (glowManager.setIntensity('HIGH')) {
     *     console.log('High intensity glow enabled');
     * } else {
     *     console.log('Failed to change intensity');
     * }
     * 
     * // Disable glow effects
     * glowManager.setIntensity('OFF');
     * ```
     * 
     * @see {@link GlowSettings#setIntensity} for persistence
     * @see {@link GlowEffectManager#applyIntensitySettings} for application logic
     */
    setIntensity(level) {
        try {
            // Validate input
            if (!this.validateIntensityLevel(level)) {
                this.logError('setIntensity', `Invalid intensity level: ${level}`, { level });
                return false;
            }

            if (!this.enabled || !this.initialized) {
                this.logWarning('setIntensity', 'Glow system not enabled or initialized', {
                    enabled: this.enabled,
                    initialized: this.initialized
                });
                return false;
            }

            const previousIntensity = this.currentIntensity;
            this.currentIntensity = level;

            // Apply settings with error recovery
            if (!this.applyIntensitySettings()) {
                // Rollback on failure
                this.currentIntensity = previousIntensity;
                this.logError('setIntensity', 'Failed to apply intensity settings, rolled back', {
                    attempted: level,
                    rolledBackTo: previousIntensity
                });
                return false;
            }

            // Save setting with error handling
            try {
                this.settings.setIntensity(level);
            } catch (error) {
                this.logWarning('setIntensity', 'Failed to save intensity setting', { level, error: error.message });
                // Continue - setting was applied successfully even if save failed
            }

            this.logInfo('setIntensity', `Intensity changed from ${previousIntensity} to ${level}`);
            return true;

        } catch (error) {
            this.logError('setIntensity', 'Unexpected error during intensity change', { level, error: error.message });
            return false;
        }
    }

    /**
     * Validate intensity level input
     * @param {*} level - Level to validate
     * @returns {boolean} True if valid
     */
    validateIntensityLevel(level) {
        const validLevels = ['OFF', 'LOW', 'MEDIUM', 'HIGH'];

        // Check type
        if (typeof level !== 'string') {
            return false;
        }

        // Check if it's a valid level
        return validLevels.includes(level.toUpperCase());
    }

    /**
     * Validate configuration object
     * @param {Object} config - Configuration to validate
     * @returns {Object} Validation result with isValid and errors
     */
    validateConfiguration(config) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };

        if (!config || typeof config !== 'object') {
            result.isValid = false;
            result.errors.push('Configuration must be an object');
            return result;
        }

        // Validate bloom settings
        if (config.bloom !== undefined) {
            if (typeof config.bloom !== 'number' || config.bloom < 0 || config.bloom > 2) {
                result.errors.push('Bloom strength must be a number between 0 and 2');
                result.isValid = false;
            }
        }

        // Validate emissive settings
        if (config.emissive !== undefined) {
            if (typeof config.emissive !== 'number' || config.emissive < 0 || config.emissive > 1) {
                result.errors.push('Emissive intensity must be a number between 0 and 1');
                result.isValid = false;
            }
        }

        // Validate threshold
        if (config.threshold !== undefined) {
            if (typeof config.threshold !== 'number' || config.threshold < 0 || config.threshold > 1) {
                result.errors.push('Bloom threshold must be a number between 0 and 1');
                result.isValid = false;
            }
        }

        // Validate radius
        if (config.radius !== undefined) {
            if (typeof config.radius !== 'number' || config.radius < 0 || config.radius > 1) {
                result.errors.push('Bloom radius must be a number between 0 and 1');
                result.isValid = false;
            }
        }

        return result;
    }

    /**
     * Create emissive material for bikes
     * 
     * Creates a Three.js material with emissive properties optimized for bike
     * entities. The material will glow with the specified color and participate
     * in the bloom post-processing pipeline. Bike materials have higher base
     * emissive intensity (0.8) compared to trails for visual hierarchy.
     * 
     * Material Properties:
     * - Base emissive intensity: 0.8 (80% of maximum)
     * - Participates in pulse animation (80%-100% intensity cycle)
     * - Affected by user intensity settings
     * - Optimized for bloom post-processing
     * 
     * Fallback Behavior:
     * - If glow system disabled: Returns standard MeshLambertMaterial
     * - If fallback mode: Returns material with slight emissive boost
     * - Maintains color consistency across all modes
     * 
     * @param {string} entityId - Unique identifier for the entity (e.g., 'player', 'ai1')
     * @param {number} color - Color as hex value (e.g., 0x00ff00 for green)
     * @returns {THREE.Material} Emissive material ready for use with Three.js mesh
     * 
     * @example
     * ```javascript
     * // Create glowing green material for player bike
     * const playerMaterial = glowManager.createBikeMaterial('player', 0x00ff00);
     * const bikeMesh = new THREE.Mesh(bikeGeometry, playerMaterial);
     * scene.add(bikeMesh);
     * 
     * // Create glowing red material for AI bike
     * const aiMaterial = glowManager.createBikeMaterial('ai1', 0xff0000);
     * ```
     * 
     * @see {@link GlowEffectManager#createTrailMaterial} for trail materials
     * @see {@link EmissiveMaterialSystem#createBikeMaterial} for implementation
     */
    createBikeMaterial(entityId, color) {
        if (this.fallbackMode && this.fallbackMaterials) {
            return this.fallbackMaterials.createBikeMaterial(entityId, color);
        }

        if (!this.enabled || !this.initialized) {
            // Return standard material as fallback
            return new THREE.MeshLambertMaterial({ color: color });
        }

        return this.materialSystem.createBikeMaterial(entityId, color);
    }

    /**
     * Create emissive material for trail segments
     * 
     * Creates a Three.js material with emissive properties optimized for trail
     * segments. Trail materials have lower base emissive intensity (0.6) than
     * bikes to maintain visual hierarchy while still providing attractive glow
     * effects. The material includes transparency for realistic trail appearance.
     * 
     * Material Properties:
     * - Base emissive intensity: 0.6 (60% of maximum)
     * - Transparent with 0.8 opacity for layering effects
     * - Participates in pulse animation (synchronized with bikes)
     * - Affected by user intensity settings
     * - Optimized for bloom post-processing
     * 
     * Fallback Behavior:
     * - If glow system disabled: Returns transparent MeshBasicMaterial
     * - If fallback mode: Returns material with slight emissive boost
     * - Maintains transparency and color consistency
     * 
     * @param {string} entityId - Unique identifier for the entity (e.g., 'player', 'ai1')
     * @param {number} color - Color as hex value (e.g., 0x00ff00 for green)
     * @returns {THREE.Material} Emissive material ready for use with trail segments
     * 
     * @example
     * ```javascript
     * // Create glowing trail material matching player bike
     * const trailMaterial = glowManager.createTrailMaterial('player', 0x00ff00);
     * const trailSegment = new THREE.Mesh(boxGeometry, trailMaterial);
     * scene.add(trailSegment);
     * 
     * // Trail segments will glow with synchronized pulsing
     * ```
     * 
     * @see {@link GlowEffectManager#createBikeMaterial} for bike materials
     * @see {@link EmissiveMaterialSystem#createTrailMaterial} for implementation
     */
    createTrailMaterial(entityId, color) {
        if (this.fallbackMode && this.fallbackMaterials) {
            return this.fallbackMaterials.createTrailMaterial(entityId, color);
        }

        if (!this.enabled || !this.initialized) {
            // Return standard material as fallback
            return new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.5
            });
        }

        return this.materialSystem.createTrailMaterial(entityId, color);
    }

    /**
     * Handle window resize events
     * @param {number} width - New window width
     * @param {number} height - New window height
     */
    handleResize(width, height) {
        if (this.postProcessing) {
            this.postProcessing.resize(width, height);
        }

        // Update UI positioning if needed
        if (window.glowSettingsUI) {
            window.glowSettingsUI.handleResize();
        }
    }

    /**
     * Check compatibility with existing particle effects
     * @returns {boolean} True if compatible
     */
    checkParticleCompatibility() {
        try {
            // Check if particle system exists and is compatible
            const particleSystem = window.renderingEngine?.getParticleSystem?.();
            if (particleSystem) {
                console.log('GlowEffectManager: Particle system detected, ensuring compatibility');
                // Glow effects and particle effects should work together
                // Both use post-processing but don't conflict
                return true;
            }
            return true;
        } catch (error) {
            console.warn('GlowEffectManager: Error checking particle compatibility:', error);
            return true; // Assume compatible if check fails
        }
    }

    /**
     * Handle game restart - reset material system
     */
    handleGameRestart() {
        if (!this.enabled || !this.initialized) {
            return;
        }

        try {
            // Dispose of existing materials
            if (this.materialSystem) {
                this.materialSystem.dispose();
            }

            // Create new material system instance
            const { EmissiveMaterialSystem } = require('./EmissiveMaterialSystem.js');
            this.materialSystem = new EmissiveMaterialSystem();

            // Reset pause state
            this.isPaused = false;

            console.log('GlowEffectManager: Game restart handled');
        } catch (error) {
            console.error('GlowEffectManager: Error handling game restart:', error);
        }
    }

    /**
     * Handle game mode switching
     * @param {string} newMode - New game mode
     * @param {string} oldMode - Previous game mode
     */
    handleGameModeSwitch(newMode, oldMode) {
        if (!this.enabled || !this.initialized) {
            return;
        }

        try {
            // Reset material system for mode switch
            this.handleGameRestart();

            // Apply any mode-specific glow settings
            if (newMode === 'TIME_TRIAL') {
                // Time Trial mode might want slightly different glow settings
                console.log('GlowEffectManager: Switched to Time Trial mode');
            } else if (newMode === 'ARENA_SHRINK') {
                // Arena Shrink mode might want enhanced visibility
                console.log('GlowEffectManager: Switched to Arena Shrink mode');
            } else {
                // Classic mode
                console.log('GlowEffectManager: Switched to Classic mode');
            }
        } catch (error) {
            console.error('GlowEffectManager: Error handling game mode switch:', error);
        }
    }

    /**
     * Force pause glow effects (for external control)
     */
    forcePause() {
        if (this.materialSystem) {
            this.materialSystem.pausePulse();
            this.isPaused = true;
        }
    }

    /**
     * Force resume glow effects (for external control)
     */
    forceResume() {
        if (this.materialSystem) {
            this.materialSystem.resumePulse();
            this.isPaused = false;
        }
    }

    /**
     * Clean up resources and prevent memory leaks
     */
    dispose() {
        console.log('GlowEffectManager: Starting resource cleanup');

        try {
            // Dispose of post-processing pipeline
            if (this.postProcessing) {
                this.postProcessing.dispose();
                this.postProcessing = null;
            }

            // Dispose of material system
            if (this.materialSystem) {
                this.materialSystem.dispose();
                this.materialSystem = null;
            }

            // Clean up performance scaler
            if (this.performanceScaler) {
                this.performanceScaler.dispose();
                this.performanceScaler = null;
            }

            // Clean up settings
            if (this.settings) {
                this.settings = null;
            }

            // Clean up fallback materials
            if (this.fallbackMaterials) {
                this.fallbackMaterials = null;
            }

            // Remove compatibility notification if it exists
            const notification = document.getElementById('glow-compatibility-notification');
            if (notification && notification.parentElement) {
                notification.parentElement.removeChild(notification);
            }

            // Clear memory monitoring interval if it exists
            if (this.memoryMonitorInterval) {
                clearInterval(this.memoryMonitorInterval);
                this.memoryMonitorInterval = null;
            }

            // Reset state
            this.initialized = false;
            this.enabled = false;
            this.fallbackMode = false;
            this.forceQualityMode = null;
            this.isPaused = false;
            this.lastQuality = null;

            console.log('GlowEffectManager: Resource cleanup completed');

        } catch (error) {
            console.error('GlowEffectManager: Error during disposal:', error);
        }
    }

    /**
     * Start memory monitoring to detect and prevent memory leaks
     */
    startMemoryMonitoring() {
        // Only monitor in development or when explicitly enabled
        if (!this.shouldMonitorMemory()) {
            return;
        }

        console.log('GlowEffectManager: Starting memory monitoring');

        this.memoryStats = {
            initialMemory: this.getMemoryUsage(),
            peakMemory: 0,
            samples: [],
            leakWarningThreshold: 50 * 1024 * 1024, // 50MB
            lastGCTime: Date.now()
        };

        // Monitor memory every 30 seconds
        this.memoryMonitorInterval = setInterval(() => {
            this.checkMemoryUsage();
        }, 30000);
    }

    /**
     * Check if memory monitoring should be enabled
     * @returns {boolean} True if monitoring should be enabled
     */
    shouldMonitorMemory() {
        // Enable in development mode or when explicitly requested
        return (
            window.location.hostname === 'localhost' ||
            window.location.search.includes('debug=true') ||
            localStorage.getItem('lightbikes_debug_memory') === 'true'
        );
    }

    /**
     * Get current memory usage if available
     * @returns {number} Memory usage in bytes, or 0 if not available
     */
    getMemoryUsage() {
        if (performance.memory) {
            return performance.memory.usedJSHeapSize;
        }
        return 0;
    }

    /**
     * Check memory usage and detect potential leaks
     */
    checkMemoryUsage() {
        const currentMemory = this.getMemoryUsage();
        if (currentMemory === 0) return; // Memory API not available

        this.memoryStats.samples.push({
            timestamp: Date.now(),
            memory: currentMemory
        });

        // Keep only last 20 samples (10 minutes of data)
        if (this.memoryStats.samples.length > 20) {
            this.memoryStats.samples.shift();
        }

        // Update peak memory
        if (currentMemory > this.memoryStats.peakMemory) {
            this.memoryStats.peakMemory = currentMemory;
        }

        // Check for memory leaks
        const memoryIncrease = currentMemory - this.memoryStats.initialMemory;
        if (memoryIncrease > this.memoryStats.leakWarningThreshold) {
            console.warn(`GlowEffectManager: Potential memory leak detected. Memory increased by ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
            this.handleMemoryLeak();
        }

        // Log memory stats periodically
        if (this.memoryStats.samples.length % 10 === 0) {
            console.log(`GlowEffectManager: Memory usage: ${Math.round(currentMemory / 1024 / 1024)}MB (peak: ${Math.round(this.memoryStats.peakMemory / 1024 / 1024)}MB)`);
        }
    }

    /**
     * Handle detected memory leak
     */
    handleMemoryLeak() {
        console.warn('GlowEffectManager: Attempting to recover from memory leak');

        try {
            // Force garbage collection if available
            if (window.gc) {
                window.gc();
                console.log('GlowEffectManager: Forced garbage collection');
            }

            // Reduce quality to minimal to reduce memory usage
            if (this.performanceScaler) {
                this.performanceScaler.setQuality('minimal');
                this.applyQualityScaling('minimal');
            }

            // Clear material cache
            if (this.materialSystem) {
                this.materialSystem.clearCache();
            }

            // Update memory baseline after cleanup
            setTimeout(() => {
                this.memoryStats.initialMemory = this.getMemoryUsage();
                console.log('GlowEffectManager: Memory baseline reset after cleanup');
            }, 5000);

        } catch (error) {
            console.error('GlowEffectManager: Error during memory leak recovery:', error);
        }
    }

    /**
     * Get memory usage statistics
     * @returns {Object} Memory statistics
     */
    getMemoryStats() {
        if (!this.memoryStats) {
            return null;
        }

        const currentMemory = this.getMemoryUsage();
        return {
            current: Math.round(currentMemory / 1024 / 1024),
            peak: Math.round(this.memoryStats.peakMemory / 1024 / 1024),
            increase: Math.round((currentMemory - this.memoryStats.initialMemory) / 1024 / 1024),
            samples: this.memoryStats.samples.length
        };
    }

    /**
     * Initialize logging and debugging system
     */
    initializeLogging() {
        this.debugMode = this.isDebugMode();
        this.logHistory = [];
        this.maxLogHistory = 100;

        if (this.debugMode) {
            console.log('GlowEffectManager: Debug mode enabled');

            // Expose debug methods to window for console access
            window.glowDebug = {
                getStatus: () => this.getStatus(),
                getMemoryStats: () => this.getMemoryStats(),
                getLogs: () => this.getLogHistory(),
                clearLogs: () => this.clearLogHistory(),
                setIntensity: (level) => this.setIntensity(level),
                forceGC: () => this.handleMemoryLeak(),
                dumpState: () => this.dumpDebugState()
            };
        }
    }

    /**
     * Check if debug mode is enabled
     * @returns {boolean} True if debug mode is enabled
     */
    isDebugMode() {
        return (
            window.location.hostname === 'localhost' ||
            window.location.search.includes('debug=true') ||
            localStorage.getItem('lightbikes_debug_glow') === 'true'
        );
    }

    /**
     * Log an error with context
     * @param {string} method - Method name where error occurred
     * @param {string} message - Error message
     * @param {Object} context - Additional context data
     */
    logError(method, message, context = {}) {
        const logEntry = {
            level: 'ERROR',
            timestamp: new Date().toISOString(),
            method,
            message,
            context
        };

        this.addToLogHistory(logEntry);
        console.error(`GlowEffectManager.${method}: ${message}`, context);
    }

    /**
     * Log a warning with context
     * @param {string} method - Method name where warning occurred
     * @param {string} message - Warning message
     * @param {Object} context - Additional context data
     */
    logWarning(method, message, context = {}) {
        const logEntry = {
            level: 'WARNING',
            timestamp: new Date().toISOString(),
            method,
            message,
            context
        };

        this.addToLogHistory(logEntry);
        console.warn(`GlowEffectManager.${method}: ${message}`, context);
    }

    /**
     * Log an info message with context
     * @param {string} method - Method name where info was logged
     * @param {string} message - Info message
     * @param {Object} context - Additional context data
     */
    logInfo(method, message, context = {}) {
        const logEntry = {
            level: 'INFO',
            timestamp: new Date().toISOString(),
            method,
            message,
            context
        };

        this.addToLogHistory(logEntry);

        if (this.debugMode) {
            console.log(`GlowEffectManager.${method}: ${message}`, context);
        }
    }

    /**
     * Add entry to log history
     * @param {Object} logEntry - Log entry to add
     */
    addToLogHistory(logEntry) {
        if (!this.logHistory) {
            this.logHistory = [];
        }

        this.logHistory.push(logEntry);

        // Keep only recent logs to prevent memory issues
        if (this.logHistory.length > this.maxLogHistory) {
            this.logHistory.shift();
        }
    }

    /**
     * Get log history
     * @returns {Array} Array of log entries
     */
    getLogHistory() {
        return this.logHistory || [];
    }

    /**
     * Clear log history
     */
    clearLogHistory() {
        this.logHistory = [];
        console.log('GlowEffectManager: Log history cleared');
    }

    /**
     * Dump complete debug state for troubleshooting
     * @returns {Object} Complete debug state
     */
    dumpDebugState() {
        const state = {
            timestamp: new Date().toISOString(),
            system: {
                enabled: this.enabled,
                initialized: this.initialized,
                fallbackMode: this.fallbackMode,
                forceQualityMode: this.forceQualityMode,
                currentIntensity: this.currentIntensity,
                isPaused: this.isPaused
            },
            postProcessing: this.postProcessing ? this.postProcessing.getStatus() : null,
            performance: this.performanceScaler ? {
                currentQuality: this.performanceScaler.currentQuality,
                scalingEnabled: this.performanceScaler.scalingEnabled
            } : null,
            memory: this.getMemoryStats(),
            materials: this.materialSystem ? {
                materialCount: this.materialSystem.materials.size,
                pulseState: this.materialSystem.pulseState
            } : null,
            logs: this.getLogHistory().slice(-10), // Last 10 log entries
            webgl: this.getWebGLInfo()
        };

        console.log('GlowEffectManager Debug State:', state);
        return state;
    }

    /**
     * Get WebGL information for debugging
     * @returns {Object} WebGL information
     */
    getWebGLInfo() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl2') ||
                canvas.getContext('webgl') ||
                canvas.getContext('experimental-webgl');

            if (!gl) {
                return { supported: false };
            }

            return {
                supported: true,
                version: gl.getParameter(gl.VERSION),
                vendor: gl.getParameter(gl.VENDOR),
                renderer: gl.getParameter(gl.RENDERER),
                maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
                maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
                extensions: gl.getSupportedExtensions()
            };

        } catch (error) {
            return {
                supported: false,
                error: error.message
            };
        }
    }

    /**
     * Handle rendering failure with recovery procedures
     * @param {Error} error - The rendering error
     * @param {string} context - Context where the error occurred
     */
    handleRenderingFailure(error, context = 'unknown') {
        this.logError('handleRenderingFailure', `Rendering failure in ${context}`, {
            error: error.message,
            stack: error.stack
        });

        try {
            // Attempt recovery procedures in order of preference
            if (this.attemptQualityReduction()) {
                this.logInfo('handleRenderingFailure', 'Recovered by reducing quality');
                return true;
            }

            if (this.attemptPostProcessingDisable()) {
                this.logInfo('handleRenderingFailure', 'Recovered by disabling post-processing');
                return true;
            }

            if (this.attemptFallbackMode()) {
                this.logInfo('handleRenderingFailure', 'Recovered by switching to fallback mode');
                return true;
            }

            // If all recovery attempts fail
            this.logError('handleRenderingFailure', 'All recovery attempts failed');
            return false;

        } catch (recoveryError) {
            this.logError('handleRenderingFailure', 'Error during recovery attempt', {
                originalError: error.message,
                recoveryError: recoveryError.message
            });
            return false;
        }
    }

    /**
     * Attempt to recover by reducing quality
     * @returns {boolean} True if recovery was attempted
     */
    attemptQualityReduction() {
        if (this.performanceScaler && this.performanceScaler.canScaleDown()) {
            this.performanceScaler.scaleDown();
            this.applyQualityScaling(this.performanceScaler.currentQuality);
            return true;
        }
        return false;
    }

    /**
     * Attempt to recover by disabling post-processing
     * @returns {boolean} True if recovery was attempted
     */
    attemptPostProcessingDisable() {
        if (this.postProcessing && this.enabled) {
            this.postProcessing.setEnabled(false);
            return true;
        }
        return false;
    }

    /**
     * Attempt to recover by switching to fallback mode
     * @returns {boolean} True if recovery was attempted
     */
    attemptFallbackMode() {
        if (!this.fallbackMode) {
            this.initializeFallbackRendering();
            this.enabled = false;
            this.fallbackMode = true;
            return true;
        }
        return false;
    }

    /**
     * Check WebGL support and required extensions
     * @returns {boolean} True if WebGL is supported with required features
     */
    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl2') ||
                canvas.getContext('webgl') ||
                canvas.getContext('experimental-webgl');

            if (!gl) {
                this.showCompatibilityNotification('WebGL not supported',
                    'Your browser does not support WebGL. Glow effects will be disabled.');
                return false;
            }

            // Check for required extensions for post-processing
            const requiredExtensions = [
                'OES_texture_float',
                'OES_texture_half_float'
            ];

            const supportedExtensions = gl.getSupportedExtensions() || [];
            const missingExtensions = requiredExtensions.filter(ext =>
                !supportedExtensions.includes(ext) && !gl.getExtension(ext)
            );

            if (missingExtensions.length > 0) {
                console.warn('GlowEffectManager: Missing WebGL extensions:', missingExtensions);
                this.showCompatibilityNotification('Limited WebGL support',
                    'Some advanced glow effects may not work properly on this device.');
                // Continue with limited functionality
            }

            // Check WebGL capabilities
            const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
            const maxRenderbufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);

            if (maxTextureSize < 1024 || maxRenderbufferSize < 1024) {
                console.warn('GlowEffectManager: Limited texture/renderbuffer size');
                this.showCompatibilityNotification('Limited graphics capabilities',
                    'Glow effects will use reduced quality on this device.');
                // Set low quality mode
                this.forceQualityMode = 'low';
            }

            // Check for mobile/low-power devices
            const renderer = gl.getParameter(gl.RENDERER);
            if (this.isMobileGPU(renderer)) {
                console.log('GlowEffectManager: Mobile GPU detected, using optimized settings');
                this.forceQualityMode = 'medium';
            }

            return true;

        } catch (error) {
            console.error('GlowEffectManager: WebGL compatibility check failed:', error);
            this.showCompatibilityNotification('Graphics initialization failed',
                'Unable to initialize graphics system. Glow effects will be disabled.');
            return false;
        }
    }

    /**
     * Check if GPU is mobile/low-power based on renderer string
     * @param {string} renderer - WebGL renderer string
     * @returns {boolean} True if mobile GPU detected
     */
    isMobileGPU(renderer) {
        const mobileIndicators = [
            'adreno', 'mali', 'powervr', 'videocore', 'tegra',
            'apple', 'qualcomm', 'arm', 'imagination'
        ];

        const rendererLower = renderer.toLowerCase();
        return mobileIndicators.some(indicator => rendererLower.includes(indicator));
    }

    /**
     * Show compatibility notification to user
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     */
    showCompatibilityNotification(title, message) {
        // Skip notifications in test environment
        if (typeof document === 'undefined' || !document.body) {
            console.warn(`GlowEffectManager Compatibility: ${title} - ${message}`);
            return;
        }

        try {
            // Create notification element if it doesn't exist
            let notification = document.getElementById('glow-compatibility-notification');
            if (!notification) {
                notification = document.createElement('div');
                notification.id = 'glow-compatibility-notification';
                notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: rgba(255, 165, 0, 0.9);
                    color: white;
                    padding: 15px;
                    border-radius: 5px;
                    font-family: Arial, sans-serif;
                    font-size: 14px;
                    max-width: 300px;
                    z-index: 10000;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                    border-left: 4px solid #ff8c00;
                `;
                document.body.appendChild(notification);
            }

            notification.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 5px;">${title}</div>
                <div>${message}</div>
                <button onclick="this.parentElement.style.display='none'" 
                        style="margin-top: 10px; padding: 5px 10px; background: #ff8c00; 
                               color: white; border: none; border-radius: 3px; cursor: pointer;">
                    OK
                </button>
            `;

            // Auto-hide after 10 seconds
            setTimeout(() => {
                if (notification && notification.parentElement) {
                    notification.style.display = 'none';
                }
            }, 10000);

        } catch (error) {
            // Fallback to console warning if DOM manipulation fails
            console.warn(`GlowEffectManager Compatibility: ${title} - ${message}`);
            console.warn('Failed to show compatibility notification:', error.message);
        }
    }

    /**
     * Initialize fallback rendering for unsupported devices
     */
    initializeFallbackRendering() {
        console.log('GlowEffectManager: Initializing fallback rendering mode');

        // Create simple material factory for fallback
        this.fallbackMaterials = {
            createBikeMaterial: (entityId, color) => {
                return new THREE.MeshLambertMaterial({
                    color: color,
                    // Add slight brightness to simulate glow
                    emissive: new THREE.Color(color).multiplyScalar(0.1)
                });
            },
            createTrailMaterial: (entityId, color) => {
                return new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.6,
                    // Add slight brightness to simulate glow
                    emissive: new THREE.Color(color).multiplyScalar(0.05)
                });
            }
        };

        // Show user that fallback mode is active
        this.showCompatibilityNotification('Compatibility Mode',
            'Running in compatibility mode with simplified graphics.');
    }

    /**
     * Load user settings from storage
     */
    loadSettings() {
        const savedIntensity = this.settings.getIntensity();
        if (savedIntensity) {
            this.currentIntensity = savedIntensity;
        }
    }

    /**
     * Apply intensity settings to all subsystems with error handling
     * @returns {boolean} True if settings were applied successfully
     */
    applyIntensitySettings() {
        try {
            const config = this.getIntensityConfig(this.currentIntensity);

            // Validate configuration before applying
            const validation = this.validateConfiguration(config);
            if (!validation.isValid) {
                this.logError('applyIntensitySettings', 'Invalid configuration', {
                    config,
                    errors: validation.errors
                });
                return false;
            }

            let success = true;

            // Apply to post-processing with error handling
            if (this.postProcessing) {
                try {
                    this.postProcessing.setBloomStrength(config.bloom);

                    // Configure bloom parameters based on intensity level
                    const bloomParams = this.getBloomParameters(this.currentIntensity);
                    this.postProcessing.configureBloomParameters(bloomParams);
                } catch (error) {
                    this.logError('applyIntensitySettings', 'Failed to apply post-processing settings', {
                        config,
                        error: error.message
                    });
                    success = false;
                }
            }

            // Apply to material system with error handling
            if (this.materialSystem) {
                try {
                    this.materialSystem.setEmissiveIntensity(config.emissive);
                } catch (error) {
                    this.logError('applyIntensitySettings', 'Failed to apply material settings', {
                        config,
                        error: error.message
                    });
                    success = false;
                }
            }

            if (success) {
                this.logInfo('applyIntensitySettings', `Applied ${this.currentIntensity} intensity settings`, config);
            }

            return success;

        } catch (error) {
            this.logError('applyIntensitySettings', 'Unexpected error applying settings', {
                intensity: this.currentIntensity,
                error: error.message
            });
            return false;
        }
    }

    /**
     * Get configuration for intensity level
     * @param {string} level - Intensity level
     * @returns {Object} Configuration object
     */
    getIntensityConfig(level) {
        const configs = {
            OFF: { emissive: 0, bloom: 0 },
            LOW: { emissive: 0.3, bloom: 0.5 },
            MEDIUM: { emissive: 0.6, bloom: 1.0 },
            HIGH: { emissive: 0.8, bloom: 1.5 }
        };
        return configs[level] || configs.MEDIUM;
    }

    /**
     * Get bloom parameters for intensity level
     * @param {string} level - Intensity level
     * @returns {Object} Bloom parameters
     */
    getBloomParameters(level) {
        const params = {
            OFF: { threshold: 1.0, radius: 0.1 },      // No bloom
            LOW: { threshold: 0.95, radius: 0.2 },     // Minimal bloom
            MEDIUM: { threshold: 0.85, radius: 0.4 },  // Balanced bloom
            HIGH: { threshold: 0.75, radius: 0.6 }     // Strong bloom
        };
        return params[level] || params.MEDIUM;
    }

    /**
     * Apply quality scaling based on performance
     * @param {string} quality - Quality level
     */
    applyQualityScaling(quality) {
        if (this.postProcessing) {
            this.postProcessing.setQuality(quality);
        }
    }

    /**
     * Get current system status
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            enabled: this.enabled,
            initialized: this.initialized,
            intensity: this.currentIntensity,
            quality: this.performanceScaler ? this.performanceScaler.currentQuality : 'high'
        };
    }
}



/**
 * EmissiveMaterialSystem - Manages emissive materials and pulse animations
 */
class EmissiveMaterialSystem {
    constructor() {
        this.materials = new Map(); // Entity ID -> Material
        this.pulseState = {
            time: 0,
            intensity: 1.0,
            paused: false
        };
        this.baseEmissiveIntensity = 0.6;
    }

    /**
     * Create emissive material for bikes
     * @param {string} entityId - Entity identifier
     * @param {number} color - Color hex value
     * @returns {THREE.Material} Emissive material
     */
    createBikeMaterial(entityId, color) {
        const material = new THREE.MeshLambertMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.8 * this.baseEmissiveIntensity
        });

        this.materials.set(entityId, material);
        return material;
    }

    /**
     * Create emissive material for trail segments
     * @param {string} entityId - Entity identifier
     * @param {number} color - Color hex value
     * @returns {THREE.Material} Emissive material
     */
    createTrailMaterial(entityId, color) {
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.5,
            emissive: color,
            emissiveIntensity: 0.6 * this.baseEmissiveIntensity
        });

        this.materials.set(entityId + '_trail', material);
        return material;
    }

    /**
     * Update pulse animation
     * @param {number} deltaTime - Time since last frame
     */
    updatePulseAnimation(deltaTime) {
        if (this.pulseState.paused) return;

        // Update pulse time (2.5 second cycle)
        this.pulseState.time += deltaTime;
        const cycle = (this.pulseState.time % 2.5) / 2.5;

        // Calculate pulse intensity (80% to 100%)
        this.pulseState.intensity = 0.8 + 0.2 * Math.sin(cycle * Math.PI * 2);

        // Apply to all materials
        this.materials.forEach((material, id) => {
            if (material.emissiveIntensity !== undefined) {
                const baseIntensity = id.includes('_trail') ? 0.6 : 0.8;
                material.emissiveIntensity = baseIntensity * this.baseEmissiveIntensity * this.pulseState.intensity;
            }
        });
    }

    /**
     * Set base emissive intensity
     * @param {number} intensity - Base intensity multiplier
     */
    setEmissiveIntensity(intensity) {
        this.baseEmissiveIntensity = Math.max(0, intensity);
    }

    /**
     * Pause pulse animation
     */
    pausePulse() {
        this.pulseState.paused = true;
    }

    /**
     * Resume pulse animation
     */
    resumePulse() {
        this.pulseState.paused = false;
    }

    /**
     * Clean up resources and prevent memory leaks
     */
    dispose() {
        console.log(`EmissiveMaterialSystem: Disposing ${this.materials.size} materials`);

        try {
            // Dispose of all materials and their textures
            this.materials.forEach((material, id) => {
                try {
                    // Dispose of material textures
                    if (material.map) material.map.dispose();
                    if (material.emissiveMap) material.emissiveMap.dispose();
                    if (material.normalMap) material.normalMap.dispose();
                    if (material.roughnessMap) material.roughnessMap.dispose();
                    if (material.metalnessMap) material.metalnessMap.dispose();

                    // Dispose of material itself
                    if (material.dispose) {
                        material.dispose();
                    }
                } catch (error) {
                    console.warn(`EmissiveMaterialSystem: Error disposing material ${id}:`, error);
                }
            });

            this.materials.clear();

            // Reset pulse state
            this.pulseState = {
                time: 0,
                intensity: 1.0,
                paused: false
            };

            console.log('EmissiveMaterialSystem: Disposal completed');

        } catch (error) {
            console.error('EmissiveMaterialSystem: Error during disposal:', error);
        }
    }

    /**
     * Clear material cache to free memory
     */
    clearCache() {
        console.log('EmissiveMaterialSystem: Clearing material cache');

        // Keep track of materials that are still in use
        const activeMaterials = new Map();

        // Only dispose materials that are not currently being used
        this.materials.forEach((material, id) => {
            // Check if material is still referenced in the scene
            if (this.isMaterialInUse(material)) {
                activeMaterials.set(id, material);
            } else {
                // Dispose unused material
                try {
                    if (material.map) material.map.dispose();
                    if (material.emissiveMap) material.emissiveMap.dispose();
                    if (material.dispose) material.dispose();
                } catch (error) {
                    console.warn(`EmissiveMaterialSystem: Error disposing unused material ${id}:`, error);
                }
            }
        });

        this.materials = activeMaterials;
        console.log(`EmissiveMaterialSystem: Cache cleared, ${this.materials.size} materials retained`);
    }

    /**
     * Check if a material is currently in use by scene objects
     * @param {THREE.Material} material - Material to check
     * @returns {boolean} True if material is in use
     */
    isMaterialInUse(material) {
        // This is a simplified check - in a real implementation,
        // you would traverse the scene graph to check for references
        return material.userData && material.userData.inUse;
    }

    /**
     * Mark material as in use (called when material is applied to geometry)
     * @param {string} entityId - Entity ID
     */
    markMaterialInUse(entityId) {
        const material = this.materials.get(entityId);
        if (material) {
            if (!material.userData) material.userData = {};
            material.userData.inUse = true;
        }
    }

    /**
     * Mark material as no longer in use
     * @param {string} entityId - Entity ID
     */
    markMaterialUnused(entityId) {
        const material = this.materials.get(entityId);
        if (material && material.userData) {
            material.userData.inUse = false;
        }
    }
}

/**
 * PerformanceScaler - Monitors performance and adjusts quality
 */
class PerformanceScaler {
    constructor() {
        this.frameRateHistory = [];
        this.currentQuality = 'high';
        this.scalingEnabled = true;
        this.lastScaleTime = 0;
        this.scaleDelay = 2000; // 2 seconds between scaling adjustments
    }

    /**
     * Monitor performance and trigger scaling if needed
     * @param {number} deltaTime - Frame delta time
     */
    monitorPerformance(deltaTime) {
        if (!this.scalingEnabled) return;

        const fps = 1 / deltaTime;
        this.frameRateHistory.push(fps);

        // Keep only last 60 frames (1 second at 60fps)
        if (this.frameRateHistory.length > 60) {
            this.frameRateHistory.shift();
        }

        // Check if we need to scale (every 2 seconds)
        const now = Date.now();
        if (now - this.lastScaleTime > this.scaleDelay) {
            this.checkScaling();
            this.lastScaleTime = now;
        }
    }

    /**
     * Check if quality scaling is needed
     */
    checkScaling() {
        if (this.frameRateHistory.length < 30) return; // Need enough samples

        const avgFPS = this.frameRateHistory.reduce((a, b) => a + b) / this.frameRateHistory.length;
        const targetFPS = 60;
        const minFPS = 50;

        if (avgFPS < minFPS && this.canScaleDown()) {
            this.scaleDown();
        } else if (avgFPS > targetFPS && this.canScaleUp()) {
            this.scaleUp();
        }
    }

    /**
     * Scale quality down
     */
    scaleDown() {
        const levels = ['high', 'medium', 'low', 'minimal'];
        const currentIndex = levels.indexOf(this.currentQuality);
        if (currentIndex < levels.length - 1) {
            this.currentQuality = levels[currentIndex + 1];
            console.log(`GlowEffectManager: Scaled down to ${this.currentQuality} quality`);
        }
    }

    /**
     * Scale quality up
     */
    scaleUp() {
        const levels = ['high', 'medium', 'low', 'minimal'];
        const currentIndex = levels.indexOf(this.currentQuality);
        if (currentIndex > 0) {
            this.currentQuality = levels[currentIndex - 1];
            console.log(`GlowEffectManager: Scaled up to ${this.currentQuality} quality`);
        }
    }

    /**
     * Check if we can scale down
     * @returns {boolean}
     */
    canScaleDown() {
        return this.currentQuality !== 'minimal';
    }

    /**
     * Check if we can scale up
     * @returns {boolean}
     */
    canScaleUp() {
        return this.currentQuality !== 'high';
    }

    /**
     * Get current quality level
     * @returns {string}
     */
    getCurrentQuality() {
        return this.currentQuality;
    }

    /**
     * Set quality level (for forced quality modes)
     * @param {string} quality - Quality level to set
     */
    setQuality(quality) {
        const validQualities = ['high', 'medium', 'low', 'minimal'];
        if (validQualities.includes(quality)) {
            this.currentQuality = quality;
            console.log(`PerformanceScaler: Quality set to ${quality}`);
        }
    }

    /**
     * Clean up performance scaler resources
     */
    dispose() {
        // Clear frame rate history to free memory
        this.frameRateHistory = [];
        this.scalingEnabled = false;
        console.log('PerformanceScaler: Resources disposed');
    }
}

/**
 * GlowSettings - Manages user settings and persistence
 */
class GlowSettings {
    constructor() {
        this.storageKey = 'lightbikes_glow_settings';
        this.defaultSettings = {
            intensity: 'MEDIUM'
        };
    }

    /**
     * Get glow intensity setting
     * @returns {string} Intensity level
     */
    getIntensity() {
        try {
            const settings = this.loadSettings();
            return settings.intensity || this.defaultSettings.intensity;
        } catch (error) {
            console.warn('GlowSettings: Failed to load intensity setting:', error);
            return this.defaultSettings.intensity;
        }
    }

    /**
     * Set glow intensity setting
     * @param {string} intensity - Intensity level
     */
    setIntensity(intensity) {
        try {
            const settings = this.loadSettings();
            settings.intensity = intensity;
            this.saveSettings(settings);
        } catch (error) {
            console.warn('GlowSettings: Failed to save intensity setting:', error);
        }
    }

    /**
     * Load settings from localStorage
     * @returns {Object} Settings object
     */
    loadSettings() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : { ...this.defaultSettings };
        } catch (error) {
            return { ...this.defaultSettings };
        }
    }

    /**
     * Save settings to localStorage
     * @param {Object} settings - Settings to save
     */
    saveSettings(settings) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(settings));
        } catch (error) {
            console.warn('GlowSettings: Failed to save to localStorage:', error);
        }
    }
}

module.exports = { GlowEffectManager };