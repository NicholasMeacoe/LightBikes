/**
 * Particle System for LightBikes
 * Provides dynamic particle effects for sparks, explosions, and collection feedback
 * Integrates with existing Three.js rendering pipeline and game loop
 */

const { ParticlePool } = require('./ParticlePool.js');
const { Particle } = require('./Particle.js');
const { PerformanceMonitor } = require('../utils/PerformanceMonitor.js');

/**
 * Main Particle System class
 * Manages particle creation, updates, and rendering integration
 * Includes performance monitoring and adaptive quality controls
 */
class ParticleSystem {
    constructor(scene, settings = {}) {
        try {
            // Validate scene parameter
            if (!scene) {
                throw new Error('Scene is required for ParticleSystem initialization');
            }

            this.scene = scene;
            this.settings = {
                maxParticles: settings.maxParticles || 200,
                enabled: settings.enabled !== false,
                quality: settings.quality || 'medium', // 'low', 'medium', 'high'
                effects: {
                    trailSparks: settings.effects?.trailSparks !== false,
                    explosions: settings.effects?.explosions !== false,
                    collections: settings.effects?.collections !== false
                },
                adaptiveQuality: settings.adaptiveQuality !== false
            };

            // Error handling state
            this.errorCount = 0;
            this.errorHistory = [];
            this.autoUpdateEnabled = true;
            this.shaderUpdatesEnabled = true;

            // Initialize particle pool for memory efficiency
            try {
                this.particlePool = new ParticlePool(this.settings.maxParticles);
            } catch (poolError) {
                console.error('ParticleSystem: Failed to initialize particle pool:', poolError);
                throw new Error('Failed to initialize particle pool: ' + poolError.message);
            }

            // Three.js rendering components
            this.particleGeometry = null;
            this.particleMaterial = null;
            this.particlePoints = null;

            // Performance monitoring and adaptive quality
            try {
                this.performanceMonitor = new PerformanceMonitor();
                this.performanceMonitor.frameRateThreshold = 50; // FPS threshold for degradation
            } catch (monitorError) {
                console.warn('ParticleSystem: Failed to initialize performance monitor:', monitorError);
                this.performanceMonitor = null;
                this.settings.adaptiveQuality = false; // Disable adaptive quality if monitor fails
            }

            this.adaptiveQualityEnabled = this.settings.adaptiveQuality && this.performanceMonitor;
            this.originalQuality = this.settings.quality;
            this.originalMaxParticles = this.settings.maxParticles;
            
            // Quality level configurations
            this.qualityConfigs = {
                high: {
                    maxParticles: 200,
                    trailSparkMultiplier: 2.5,
                    explosionParticles: 30,
                    collectionParticles: 20
                },
                medium: {
                    maxParticles: 150,
                    trailSparkMultiplier: 1.5,
                    explosionParticles: 25,
                    collectionParticles: 15
                },
                low: {
                    maxParticles: 100,
                    trailSparkMultiplier: 1.0,
                    explosionParticles: 20,
                    collectionParticles: 10
                }
            };

            // Degradation state tracking
            this.degradationLevel = 0; // 0 = no degradation, 1-3 = increasing degradation
            this.lastDegradationCheck = Date.now();
            this.degradationCheckInterval = 1000; // Check every second
            this.performanceRecoveryTime = 5000; // 5 seconds of good performance to recover
            this.lastGoodPerformanceTime = Date.now();

            // Initialize rendering system with error handling
            try {
                this.initializeRendering();
            } catch (renderError) {
                console.error('ParticleSystem: Failed to initialize rendering:', renderError);
                this.settings.enabled = false; // Disable system if rendering fails
                throw new Error('Failed to initialize particle rendering: ' + renderError.message);
            }

            // Performance tracking
            this.lastUpdateTime = Date.now();
            this.frameCount = 0;

            // Game state management tracking
            this.isPaused = false;
            this.gameOverHandled = false;
            this.lastFrameCount = -1;
            this.pauseStartTime = 0;

            // Performance optimization features
            this.culledParticleCount = 0;
            this.performanceMetrics = {};
            this.memoryMetrics = {};
            this.lastMemoryCheck = Date.now();
            this.memoryCheckInterval = 5000; // Check memory every 5 seconds

            console.log('ParticleSystem: Initialized successfully');

        } catch (error) {
            console.error('ParticleSystem: Critical initialization error:', error);
            
            // Set system to safe disabled state
            this.settings = { enabled: false };
            this.errorCount = 1;
            this.recordError('initialization', error);
            
            // Re-throw to notify caller of initialization failure
            throw error;
        }
    }



    /**
     * Initialize Three.js rendering components
     */
    initializeRendering() {
        try {
            // Create BufferGeometry for efficient particle rendering
            this.particleGeometry = new THREE.BufferGeometry();
            
            // Pre-allocate arrays for maximum particles
            const positions = new Float32Array(this.settings.maxParticles * 3);
            const colors = new Float32Array(this.settings.maxParticles * 3);
            const sizes = new Float32Array(this.settings.maxParticles);
            const alphas = new Float32Array(this.settings.maxParticles);

            // Set buffer attributes with error handling
            try {
                this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
                this.particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
                this.particleGeometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
            } catch (attributeError) {
                console.error('ParticleSystem: Failed to set buffer attributes:', attributeError);
                throw new Error('Failed to create buffer attributes: ' + attributeError.message);
            }

            // Create particle texture with error handling
            let particleTexture;
            try {
                particleTexture = this.createParticleTexture();
            } catch (textureError) {
                console.warn('ParticleSystem: Failed to create particle texture, using fallback:', textureError);
                particleTexture = { needsUpdate: true }; // Fallback texture
            }

            // Create shader material for point sprites with improved rendering
            try {
                this.particleMaterial = new THREE.ShaderMaterial({
                    uniforms: {
                        pointTexture: { value: particleTexture },
                        time: { value: 0.0 }
                    },
                    vertexShader: `
                        attribute float size;
                        attribute float alpha;
                        uniform float time;
                        varying float vAlpha;
                        varying vec3 vColor;
                        varying vec2 vUv;

                        void main() {
                            vAlpha = alpha;
                            vColor = color;
                            vUv = uv;
                            
                            // Transform position to view space
                            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                            
                            // Calculate point size with distance attenuation
                            float distance = length(mvPosition.xyz);
                            gl_PointSize = size * (300.0 / distance);
                            
                            // Ensure minimum and maximum point sizes
                            gl_PointSize = clamp(gl_PointSize, 1.0, 64.0);
                            
                            gl_Position = projectionMatrix * mvPosition;
                        }
                    `,
                    fragmentShader: `
                        uniform sampler2D pointTexture;
                        uniform float time;
                        varying float vAlpha;
                        varying vec3 vColor;

                        void main() {
                            // Sample the particle texture
                            vec4 textureColor = texture2D(pointTexture, gl_PointCoord);
                            
                            // Calculate distance from center for circular particles
                            vec2 center = gl_PointCoord - vec2(0.5);
                            float dist = length(center);
                            
                            // Create smooth circular falloff
                            float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                            alpha *= textureColor.a * vAlpha;
                            
                            // Apply color with proper alpha blending
                            gl_FragColor = vec4(vColor * alpha, alpha);
                            
                            // Discard fully transparent pixels for better performance
                            if (gl_FragColor.a < 0.01) discard;
                        }
                    `,
                    blending: THREE.AdditiveBlending,
                    depthTest: true,
                    depthWrite: false,
                    transparent: true,
                    vertexColors: true,
                    side: THREE.DoubleSide
                });
            } catch (materialError) {
                console.error('ParticleSystem: Failed to create shader material:', materialError);
                throw new Error('Failed to create particle material: ' + materialError.message);
            }

            // Create Points object with proper rendering settings
            try {
                this.particlePoints = new THREE.Points(this.particleGeometry, this.particleMaterial);
                
                // Set rendering order to ensure particles render after solid objects but before UI
                this.particlePoints.renderOrder = 100;
                
                // Enable frustum culling for better performance
                this.particlePoints.frustumCulled = true;
                
                // Add to scene
                this.scene.add(this.particlePoints);
            } catch (pointsError) {
                console.error('ParticleSystem: Failed to create Points object:', pointsError);
                throw new Error('Failed to create particle points: ' + pointsError.message);
            }

            console.log('ParticleSystem: Rendering initialized successfully');

        } catch (error) {
            console.error('ParticleSystem: Failed to initialize rendering:', error);
            
            // Clean up any partially created objects
            this.cleanupRenderingResources();
            
            throw error;
        }
    }

    /**
     * Create particle texture for point sprites with improved quality
     * @returns {THREE.Texture} Particle texture
     */
    createParticleTexture() {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            
            let context;
            try {
                context = canvas.getContext('2d');
            } catch (contextError) {
                // Fallback for test environment where canvas context is not available
                console.warn('Canvas context not available, using fallback texture');
                return { needsUpdate: true };
            }
            
            if (!context) {
                // Fallback for test environment - return mock texture
                return { needsUpdate: true };
            }
            
            const centerX = 64;
            const centerY = 64;
            const radius = 64;
            
            // Create high-quality radial gradient for smooth particle appearance
            const gradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
            gradient.addColorStop(0, 'rgba(255,255,255,1.0)');
            gradient.addColorStop(0.1, 'rgba(255,255,255,0.9)');
            gradient.addColorStop(0.3, 'rgba(255,255,255,0.7)');
            gradient.addColorStop(0.5, 'rgba(255,255,255,0.4)');
            gradient.addColorStop(0.7, 'rgba(255,255,255,0.2)');
            gradient.addColorStop(0.9, 'rgba(255,255,255,0.05)');
            gradient.addColorStop(1.0, 'rgba(255,255,255,0)');
            
            // Clear canvas and draw gradient
            context.clearRect(0, 0, 128, 128);
            context.fillStyle = gradient;
            context.fillRect(0, 0, 128, 128);
            
            // Create Three.js texture with proper settings
            const texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.format = THREE.RGBAFormat;
            texture.generateMipmaps = false;
            
            return texture;
        } catch (error) {
            console.warn('Failed to create particle texture, using fallback:', error);
            // Fallback for test environment - return mock texture
            return { needsUpdate: true };
        }
    }

    /**
     * Acquire a particle from the pool
     * @returns {Particle|null} Available particle or null if pool is exhausted
     */
    acquireParticle() {
        return this.particlePool.acquire();
    }

    /**
     * Release a particle back to the pool
     * @param {Particle} particle - Particle to release
     */
    releaseParticle(particle) {
        this.particlePool.release(particle);
    }

    /**
     * Update particle system
     * @param {number} deltaTime - Time elapsed since last update
     * @param {Object} gameState - Current game state
     */
    update(deltaTime, gameState) {
        try {
            if (!this.settings.enabled) {
                return;
            }

            // Validate input parameters
            if (!this.validateUpdateParameters(deltaTime, gameState)) {
                return;
            }

            // Handle pause state - particles should pause when game is paused
            if (gameState.isPaused) {
                // Update pause state tracking
                if (!this.isPaused) {
                    this.handlePause();
                }
                return;
            } else {
                // Handle resume state - particles should resume when game resumes
                if (this.isPaused) {
                    this.handleResume();
                }
            }

            // Handle game restart - clear particles when game restarts
            if (gameState.frameCount === 0 && this.lastFrameCount > 0) {
                this.handleGameRestart();
            }
            this.lastFrameCount = gameState.frameCount;

            // Handle game over state - allow existing particles to complete lifecycle
            if (gameState.gameOver && !this.gameOverHandled) {
                this.handleGameOver();
            } else if (!gameState.gameOver) {
                this.gameOverHandled = false;
            }

            this.frameCount++;
            const currentTime = Date.now();
            
            // Update performance monitoring with error handling
            try {
                this.performanceMonitor.update();
            } catch (performanceError) {
                console.warn('ParticleSystem: Performance monitoring error:', performanceError);
                this.handlePerformanceMonitoringError(performanceError);
            }
            
            // Check for performance degradation and apply adaptive quality
            if (this.adaptiveQualityEnabled) {
                try {
                    this.checkPerformanceDegradation(currentTime);
                } catch (degradationError) {
                    console.warn('ParticleSystem: Performance degradation check error:', degradationError);
                    this.handlePerformanceDegradationError(degradationError);
                }
            }
            
            // Update all active particles with error handling
            try {
                this.particlePool.updateParticles(deltaTime);
            } catch (poolError) {
                console.warn('ParticleSystem: Particle pool update error:', poolError);
                this.handleParticlePoolError(poolError);
            }

            // Update rendering buffers with error handling
            try {
                this.updateRenderingBuffers();
            } catch (renderError) {
                console.warn('ParticleSystem: Rendering buffer update error:', renderError);
                this.handleRenderingError(renderError);
            }
            
            // Update shader uniforms with error handling
            try {
                if (this.particleMaterial && this.particleMaterial.uniforms) {
                    this.particleMaterial.uniforms.time.value = currentTime * 0.001; // Convert to seconds
                }
            } catch (shaderError) {
                console.warn('ParticleSystem: Shader uniform update error:', shaderError);
                this.handleShaderError(shaderError);
            }

            // Periodic memory monitoring and cleanup
            if (currentTime - this.lastMemoryCheck >= this.memoryCheckInterval) {
                try {
                    this.monitorMemoryUsage();
                    this.lastMemoryCheck = currentTime;
                } catch (memoryError) {
                    console.warn('ParticleSystem: Memory monitoring error:', memoryError);
                }
            }
            
            this.lastUpdateTime = currentTime;
            
        } catch (error) {
            console.error('ParticleSystem: Critical update error:', error);
            this.handleCriticalError(error, 'update');
        }
    }

    /**
     * Update Three.js buffer attributes with current particle data using batch operations
     */
    updateRenderingBuffers() {
        try {
            if (!this.particleGeometry || !this.particleGeometry.attributes) {
                console.warn('ParticleSystem: Geometry not available for buffer update');
                return;
            }

            const positions = this.particleGeometry.attributes.position.array;
            const colors = this.particleGeometry.attributes.color.array;
            const sizes = this.particleGeometry.attributes.size.array;
            const alphas = this.particleGeometry.attributes.alpha.array;

            // Validate arrays exist
            if (!positions || !colors || !sizes || !alphas) {
                console.warn('ParticleSystem: Buffer arrays not available');
                return;
            }

            // Use batch update operations for better performance
            this.batchUpdateBuffers(positions, colors, sizes, alphas);

        } catch (error) {
            console.error('ParticleSystem: Critical error in updateRenderingBuffers:', error);
            throw error; // Re-throw to be handled by caller
        }
    }

    /**
     * Batch update buffer arrays for improved performance
     * @param {Float32Array} positions - Position buffer array
     * @param {Float32Array} colors - Color buffer array
     * @param {Float32Array} sizes - Size buffer array
     * @param {Float32Array} alphas - Alpha buffer array
     */
    batchUpdateBuffers(positions, colors, sizes, alphas) {
        try {
            // Clear arrays efficiently using fill
            positions.fill(0);
            colors.fill(0);
            sizes.fill(0);
            alphas.fill(0);

            // Get active particles from pool with error handling
            let activeParticles;
            try {
                activeParticles = this.particlePool.getActiveParticles();
            } catch (poolError) {
                console.warn('ParticleSystem: Failed to get active particles:', poolError);
                return;
            }

            // Filter out culled particles for rendering optimization
            const visibleParticles = activeParticles.filter(particle => 
                particle && particle.active && !particle.culled
            );

            let renderIndex = 0;

            // Batch process visible particles
            for (let i = 0; i < visibleParticles.length && renderIndex < this.settings.maxParticles; i++) {
                const particle = visibleParticles[i];
                
                if (!particle || !particle.position || !particle.color) {
                    continue; // Skip invalid particles
                }

                try {
                    const i3 = renderIndex * 3;

                    // Batch position update with validation
                    if (typeof particle.position.x === 'number' && !isNaN(particle.position.x)) {
                        positions[i3] = particle.position.x;
                        positions[i3 + 1] = particle.position.y;
                        positions[i3 + 2] = particle.position.z;
                    }

                    // Batch color update with validation
                    if (typeof particle.color.r === 'number' && !isNaN(particle.color.r)) {
                        colors[i3] = particle.color.r;
                        colors[i3 + 1] = particle.color.g;
                        colors[i3 + 2] = particle.color.b;
                    }

                    // Batch size update with validation
                    if (typeof particle.size === 'number' && !isNaN(particle.size)) {
                        sizes[renderIndex] = particle.size;
                    }

                    // Batch alpha update with validation
                    if (particle.getAlpha && typeof particle.getAlpha === 'function') {
                        const alpha = particle.getAlpha();
                        if (typeof alpha === 'number' && !isNaN(alpha)) {
                            alphas[renderIndex] = alpha;
                        }
                    }

                    renderIndex++;
                } catch (particleError) {
                    console.warn(`ParticleSystem: Error processing particle ${i}:`, particleError);
                    continue; // Skip this particle and continue with others
                }
            }

            // Batch mark attributes as needing update
            this.batchMarkAttributesForUpdate(renderIndex);

            // Update performance metrics
            this.updatePerformanceMetrics(activeParticles.length, visibleParticles.length, renderIndex);

        } catch (error) {
            console.error('ParticleSystem: Critical error in batchUpdateBuffers:', error);
            throw error;
        }
    }

    /**
     * Batch mark buffer attributes for update
     * @param {number} renderCount - Number of particles being rendered
     */
    batchMarkAttributesForUpdate(renderCount) {
        try {
            // Mark all attributes for update in a single batch
            const attributes = this.particleGeometry.attributes;
            attributes.position.needsUpdate = true;
            attributes.color.needsUpdate = true;
            attributes.size.needsUpdate = true;
            attributes.alpha.needsUpdate = true;

            // Update draw range to only render visible particles
            this.particleGeometry.setDrawRange(0, renderCount);

        } catch (updateError) {
            console.warn('ParticleSystem: Failed to mark attributes for update:', updateError);
            throw updateError;
        }
    }

    /**
     * Update performance metrics for monitoring
     * @param {number} totalParticles - Total active particles
     * @param {number} visibleParticles - Visible (non-culled) particles
     * @param {number} renderedParticles - Actually rendered particles
     */
    updatePerformanceMetrics(totalParticles, visibleParticles, renderedParticles) {
        if (!this.performanceMetrics) {
            this.performanceMetrics = {};
        }

        this.performanceMetrics.totalParticles = totalParticles;
        this.performanceMetrics.visibleParticles = visibleParticles;
        this.performanceMetrics.renderedParticles = renderedParticles;
        this.performanceMetrics.culledParticles = totalParticles - visibleParticles;
        this.performanceMetrics.cullRatio = totalParticles > 0 ? (this.performanceMetrics.culledParticles / totalParticles) : 0;
        this.performanceMetrics.lastUpdateTime = Date.now();
    }

    /**
     * Emit trail sparks from moving bike positions
     * @param {Object} position - World position {x, y, z}
     * @param {Object} velocity - Movement velocity {x, y, z}
     * @param {number} color - Color hex value
     * @param {number} speed - Current movement speed for proportional emission
     */
    emitTrailSparks(position, velocity, color, speed = 1.0) {
        try {
            if (!this.settings.enabled || !this.settings.effects.trailSparks) {
                return;
            }

            // Validate input parameters
            if (!this.validateEmissionParameters(position, velocity, color)) {
                return;
            }

            // Movement-based emission control - only emit if entity is actually moving
            const velocityMagnitude = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
            const movementThreshold = 0.01; // Minimum movement to emit particles
            
            if (velocityMagnitude < movementThreshold) {
                // Entity is not moving enough to emit trail sparks
                return;
            }

            // Calculate speed-proportional emission rate based on actual movement
            const speedFactor = Math.max(0.1, Math.min(3.0, velocityMagnitude / 0.1)); // Normalize to game speed
            const baseEmissionRate = speedFactor * 0.8; // Higher speed = more particles
            
            // Quality-based particle count with speed proportionality
            const config = this.qualityConfigs[this.settings.quality] || this.qualityConfigs.medium;
            let particleCount = Math.floor(baseEmissionRate * config.trailSparkMultiplier);
            
            // Ensure minimum emission for visual feedback when moving
            particleCount = Math.max(1, Math.min(4, particleCount));
            
            for (let i = 0; i < particleCount; i++) {
                try {
                    const particle = this.acquireParticle();
                    if (!particle) break; // Pool exhausted

                    // Set particle properties for trail sparks
                    particle.type = 'trail';
                    particle.active = true;
                    particle.age = 0;
                    
                    // Position particles at rear of bike with slight randomization
                    const rearOffset = 0.3; // Distance behind bike center
                    particle.position.set(
                        position.x - velocity.x * rearOffset + (Math.random() - 0.5) * 0.15,
                        position.y + Math.random() * 0.08, // Slight vertical spread
                        position.z - velocity.z * rearOffset + (Math.random() - 0.5) * 0.15
                    );
                    
                    // Velocity with backward bias and speed proportionality
                    const backwardBias = Math.max(0.3, velocityMagnitude * 0.5);
                    
                    particle.velocity.set(
                        (Math.random() - 0.5) * 0.4 - velocity.x * backwardBias,
                        Math.random() * 0.25 + 0.05, // Slight upward motion
                        (Math.random() - 0.5) * 0.4 - velocity.z * backwardBias
                    );
                    
                    // Light gravity and air resistance
                    particle.acceleration.set(0, -0.15, 0);
                    
                    // Enhanced color matching with trail colors
                    particle.color.setHex(color);
                    
                    // Particle size as specified in requirements (0.05 units base)
                    particle.size = 0.04 + Math.random() * 0.02; // 0.04-0.06 units (centered on 0.05)
                    particle.originalSize = particle.size; // Store original size for LOD calculations
                    
                    // Lifetime as specified in requirements (0.5-1.0 seconds)
                    particle.lifetime = 0.5 + Math.random() * 0.5;
                    
                } catch (particleError) {
                    console.warn('ParticleSystem: Error creating trail spark particle:', particleError);
                    // Continue with next particle instead of failing completely
                    continue;
                }
            }
            
        } catch (error) {
            console.error('ParticleSystem: Critical error in emitTrailSparks:', error);
            this.handleCriticalError(error, 'emitTrailSparks');
        }
    }

    /**
     * Create explosion particle effects
     * @param {Object} position - Explosion center position {x, y, z}
     * @param {number} intensity - Explosion intensity (0-1)
     */
    createExplosion(position, intensity = 1.0) {
        try {
            if (!this.settings.enabled || !this.settings.effects.explosions) {
                return;
            }

            // Validate input parameters
            if (!this.validateExplosionParameters(position, intensity)) {
                return;
            }

            // Scale particle count based on quality and intensity
            const config = this.qualityConfigs[this.settings.quality] || this.qualityConfigs.medium;
            const particleCount = Math.floor(config.explosionParticles * intensity);

            for (let i = 0; i < particleCount; i++) {
                try {
                    const particle = this.acquireParticle();
                    if (!particle) break; // Pool exhausted

                    // Set particle properties for explosion
                    particle.type = 'explosion';
                    particle.position.set(
                        position.x + (Math.random() - 0.5) * 0.1,
                        position.y + Math.random() * 0.1,
                        position.z + (Math.random() - 0.5) * 0.1
                    );

                    // Radial velocity distribution
                    const angle = Math.random() * Math.PI * 2;
                    const elevation = (Math.random() - 0.5) * Math.PI * 0.5;
                    const speed = 2.0 + Math.random() * 2.0; // 2.0-4.0 units/second
                    
                    particle.velocity.set(
                        Math.cos(angle) * Math.cos(elevation) * speed,
                        Math.sin(elevation) * speed * 0.5,
                        Math.sin(angle) * Math.cos(elevation) * speed
                    );
                    
                    particle.acceleration.set(0, -0.5, 0); // Gravity
                    
                    // Orange/red color scheme
                    const colorVariation = Math.random();
                    if (colorVariation < 0.4) {
                        particle.color.setHex(0xff4500); // Orange red
                    } else if (colorVariation < 0.7) {
                        particle.color.setHex(0xff6600); // Orange
                    } else {
                        particle.color.setHex(0xff8800); // Light orange
                    }
                    
                    particle.size = 0.1 + Math.random() * 0.1; // 0.1-0.2 units
                    particle.originalSize = particle.size; // Store original size for LOD calculations
                    particle.lifetime = 1.5 + Math.random() * 0.5; // 1.5-2.0 seconds
                    
                } catch (particleError) {
                    console.warn('ParticleSystem: Error creating explosion particle:', particleError);
                    // Continue with next particle instead of failing completely
                    continue;
                }
            }
            
        } catch (error) {
            console.error('ParticleSystem: Critical error in createExplosion:', error);
            this.handleCriticalError(error, 'createExplosion');
        }
    }

    /**
     * Create collection particle effects
     * @param {Object} position - Collection position {x, y, z}
     * @param {string} powerUpType - Type of power-up collected
     */
    createCollectionEffect(position, powerUpType) {
        try {
            if (!this.settings.enabled || !this.settings.effects.collections) {
                return;
            }

            // Validate input parameters
            if (!this.validateCollectionParameters(position, powerUpType)) {
                return;
            }

            // Particle count based on quality
            const config = this.qualityConfigs[this.settings.quality] || this.qualityConfigs.medium;
            const particleCount = config.collectionParticles;

            // Color based on power-up type
            let color;
            switch (powerUpType) {
                case 'SPEED_BOOST':
                    color = 0x0066ff; // Blue
                    break;
                case 'SHIELD':
                    color = 0xffd700; // Gold
                    break;
                case 'TRAIL_ERASER':
                    color = 0x9932cc; // Purple
                    break;
                case 'GHOST_MODE':
                    color = 0xffffff; // White
                    break;
                default:
                    color = 0x00ffff; // Cyan
            }

            for (let i = 0; i < particleCount; i++) {
                try {
                    const particle = this.acquireParticle();
                    if (!particle) break; // Pool exhausted

                    // Set particle properties for collection effect
                    particle.type = 'collection';
                    particle.position.set(
                        position.x + (Math.random() - 0.5) * 0.2,
                        position.y,
                        position.z + (Math.random() - 0.5) * 0.2
                    );

                    // Upward and outward burst pattern
                    const angle = Math.random() * Math.PI * 2;
                    const upwardBias = 0.7; // 70% upward velocity
                    const speed = 1.0 + Math.random() * 1.5; // 1.0-2.5 units/second
                    
                    particle.velocity.set(
                        Math.cos(angle) * speed * (1 - upwardBias),
                        speed * upwardBias + Math.random() * 0.5,
                        Math.sin(angle) * speed * (1 - upwardBias)
                    );
                    
                    particle.acceleration.set(0, -0.3, 0); // Light gravity
                    particle.color.setHex(color);
                    particle.size = 0.05 + Math.random() * 0.05; // 0.05-0.1 units
                    particle.originalSize = particle.size; // Store original size for LOD calculations
                    particle.lifetime = 1.0; // 1.0 second
                    
                } catch (particleError) {
                    console.warn('ParticleSystem: Error creating collection particle:', particleError);
                    // Continue with next particle instead of failing completely
                    continue;
                }
            }
            
        } catch (error) {
            console.error('ParticleSystem: Critical error in createCollectionEffect:', error);
            this.handleCriticalError(error, 'createCollectionEffect');
        }
    }

    /**
     * Check for performance degradation and apply adaptive quality measures
     * @param {number} currentTime - Current timestamp
     */
    checkPerformanceDegradation(currentTime) {
        // Only check periodically to avoid overhead
        if (currentTime - this.lastDegradationCheck < this.degradationCheckInterval) {
            return;
        }
        
        this.lastDegradationCheck = currentTime;
        const metrics = this.performanceMonitor.getPerformanceMetrics();
        
        // Check if performance is below threshold
        if (metrics.averageFPS < this.performanceMonitor.frameRateThreshold) {
            // Performance is poor, apply degradation
            this.applyPerformanceDegradation();
            this.lastGoodPerformanceTime = currentTime; // Reset recovery timer
        } else if (metrics.averageFPS >= this.performanceMonitor.frameRateTarget * 0.9) {
            // Performance is good, check for recovery
            if (currentTime - this.lastGoodPerformanceTime >= this.performanceRecoveryTime) {
                this.attemptPerformanceRecovery();
            }
        } else {
            // Performance is marginal, reset recovery timer
            this.lastGoodPerformanceTime = currentTime;
        }
    }

    /**
     * Apply performance degradation measures
     */
    applyPerformanceDegradation() {
        if (this.degradationLevel >= 3) {
            return; // Already at maximum degradation
        }
        
        this.degradationLevel++;
        console.warn(`ParticleSystem: Applying performance degradation level ${this.degradationLevel}`);
        
        switch (this.degradationLevel) {
            case 1:
                // Level 1: Reduce particle density by 25%
                this.reduceParticleDensity(0.75);
                break;
                
            case 2:
                // Level 2: Disable trail sparks, keep explosions and collections
                this.settings.effects.trailSparks = false;
                this.setQualityLevel('low');
                console.log('ParticleSystem: Disabled trail sparks for performance');
                break;
                
            case 3:
                // Level 3: Reduce explosion particle count by 50%
                this.qualityConfigs.low.explosionParticles = 10;
                this.qualityConfigs.low.collectionParticles = 5;
                console.log('ParticleSystem: Reduced explosion and collection particles');
                break;
        }
    }

    /**
     * Reduce particle density by a given factor
     * @param {number} factor - Reduction factor (0.0 to 1.0)
     */
    reduceParticleDensity(factor) {
        const newMaxParticles = Math.floor(this.originalMaxParticles * factor);
        this.settings.maxParticles = Math.max(25, newMaxParticles); // Minimum 25 particles for testing
        
        // Update particle pool max particles
        if (this.particlePool) {
            this.particlePool.maxParticles = this.settings.maxParticles;
        }
        
        // Update quality configs proportionally
        Object.keys(this.qualityConfigs).forEach(quality => {
            this.qualityConfigs[quality].maxParticles = Math.floor(
                this.qualityConfigs[quality].maxParticles * factor
            );
        });
        
        console.log(`ParticleSystem: Reduced particle density to ${this.settings.maxParticles} particles`);
    }

    /**
     * Attempt to recover performance by restoring quality settings
     */
    attemptPerformanceRecovery() {
        if (this.degradationLevel === 0) {
            return; // No degradation to recover from
        }
        
        console.log(`ParticleSystem: Attempting performance recovery from level ${this.degradationLevel}`);
        
        // Gradually restore settings
        switch (this.degradationLevel) {
            case 3:
                // Restore explosion particle counts
                this.qualityConfigs.low.explosionParticles = 20;
                this.qualityConfigs.low.collectionParticles = 10;
                break;
                
            case 2:
                // Re-enable trail sparks and restore quality
                this.settings.effects.trailSparks = true;
                this.setQualityLevel(this.originalQuality);
                break;
                
            case 1:
                // Restore original particle density
                this.restoreOriginalSettings();
                break;
        }
        
        this.degradationLevel--;
        this.lastGoodPerformanceTime = Date.now(); // Reset recovery timer
    }

    /**
     * Restore original particle system settings
     */
    restoreOriginalSettings() {
        this.settings.maxParticles = this.originalMaxParticles;
        this.settings.quality = this.originalQuality;
        this.settings.effects.trailSparks = true;
        this.settings.effects.explosions = true;
        this.settings.effects.collections = true;
        
        // Restore original quality configs
        this.qualityConfigs = {
            high: {
                maxParticles: 200,
                trailSparkMultiplier: 2.5,
                explosionParticles: 30,
                collectionParticles: 20
            },
            medium: {
                maxParticles: 150,
                trailSparkMultiplier: 1.5,
                explosionParticles: 25,
                collectionParticles: 15
            },
            low: {
                maxParticles: 100,
                trailSparkMultiplier: 1.0,
                explosionParticles: 20,
                collectionParticles: 10
            }
        };
        
        console.log('ParticleSystem: Restored original settings');
    }

    /**
     * Set quality level for particle effects
     * @param {string} level - Quality level ('low', 'medium', 'high')
     */
    setQualityLevel(level) {
        if (['low', 'medium', 'high'].includes(level)) {
            this.settings.quality = level;
            
            // Update max particles based on quality config
            const config = this.qualityConfigs[level];
            if (config && this.degradationLevel === 0) {
                this.settings.maxParticles = config.maxParticles;
            }
        }
    }

    /**
     * Enable or disable adaptive quality
     * @param {boolean} enabled - Whether to enable adaptive quality
     */
    setAdaptiveQuality(enabled) {
        this.adaptiveQualityEnabled = enabled;
        
        if (!enabled) {
            // Restore original settings when disabling adaptive quality
            this.restoreOriginalSettings();
            this.degradationLevel = 0;
        }
    }

    /**
     * Get current active particle count
     * @returns {number} Number of active particles
     */
    getActiveParticleCount() {
        return this.particlePool.getActiveCount();
    }

    /**
     * Get performance metrics from the particle system
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        return this.performanceMonitor.getPerformanceMetrics();
    }

    /**
     * Get current performance status
     * @returns {Object} Performance status information
     */
    getPerformanceStatus() {
        const metrics = this.performanceMonitor.getPerformanceMetrics();
        return {
            currentFPS: Math.round(metrics.currentFPS),
            averageFPS: Math.round(metrics.averageFPS),
            degradationLevel: this.degradationLevel,
            adaptiveQualityEnabled: this.adaptiveQualityEnabled,
            currentQuality: this.settings.quality,
            originalQuality: this.originalQuality,
            activeParticles: this.getActiveParticleCount(),
            maxParticles: this.settings.maxParticles,
            originalMaxParticles: this.originalMaxParticles,
            effectsEnabled: { ...this.settings.effects },
            performanceWarnings: metrics.performanceWarnings.length
        };
    }

    /**
     * Handle pause state internally
     * Called when game state changes to paused
     */
    handlePause() {
        this.isPaused = true;
        this.pauseStartTime = Date.now();
        
        // Stop emitting new particles by temporarily disabling trail sparks
        this.wasTrailSparksEnabled = this.settings.effects.trailSparks;
        this.settings.effects.trailSparks = false;
        
        console.log('ParticleSystem: Paused - stopped new particle emission');
    }

    /**
     * Handle resume state internally
     * Called when game state changes from paused to active
     */
    handleResume() {
        this.isPaused = false;
        
        // Restore trail sparks emission if it was enabled before pause
        if (this.wasTrailSparksEnabled !== undefined) {
            this.settings.effects.trailSparks = this.wasTrailSparksEnabled;
            this.wasTrailSparksEnabled = undefined;
        }
        
        // Update last update time to prevent large delta time jumps
        this.lastUpdateTime = Date.now();
        
        console.log('ParticleSystem: Resumed - restored particle emission');
    }

    /**
     * Handle game restart
     * Called when game frame count resets to 0
     */
    handleGameRestart() {
        // Clear all existing particles
        this.particlePool.releaseAll();
        
        // Reset performance monitoring
        this.performanceMonitor.reset();
        
        // Reset degradation state
        this.degradationLevel = 0;
        this.lastGoodPerformanceTime = Date.now();
        this.lastDegradationCheck = Date.now();
        
        // Restore original settings
        this.restoreOriginalSettings();

        // Reset frame counter and state tracking
        this.frameCount = 0;
        this.lastUpdateTime = Date.now();
        this.gameOverHandled = false;
        this.isPaused = false;
        
        console.log('ParticleSystem: Game restarted - cleared all particles and reset state');
    }

    /**
     * Handle game over state
     * Allow existing particles to complete their lifecycle without new emissions
     */
    handleGameOver() {
        this.gameOverHandled = true;
        
        // Stop emitting new trail sparks during game over
        this.wasTrailSparksEnabledGameOver = this.settings.effects.trailSparks;
        this.settings.effects.trailSparks = false;
        
        console.log('ParticleSystem: Game over - stopped new trail spark emission, allowing existing particles to fade');
    }

    /**
     * Pause particle system (external API)
     */
    pause() {
        // This method is called externally, but actual pause handling is done in update()
        // based on gameState.isPaused to ensure consistency
        console.log('ParticleSystem: External pause called - will pause on next update with gameState.isPaused = true');
    }

    /**
     * Resume particle system (external API)
     */
    resume() {
        // This method is called externally, but actual resume handling is done in update()
        // based on gameState.isPaused to ensure consistency
        console.log('ParticleSystem: External resume called - will resume on next update with gameState.isPaused = false');
    }

    /**
     * Reset particle system (clear all particles)
     */
    reset() {
        // Release all active particles using pool
        this.particlePool.releaseAll();

        // Reset performance monitoring
        this.performanceMonitor.reset();
        
        // Reset degradation state
        this.degradationLevel = 0;
        this.lastGoodPerformanceTime = Date.now();
        this.lastDegradationCheck = Date.now();
        
        // Restore original settings
        this.restoreOriginalSettings();

        // Reset frame counter and game state tracking
        this.frameCount = 0;
        this.lastUpdateTime = Date.now();
        this.lastFrameCount = -1;
        this.isPaused = false;
        this.gameOverHandled = false;
        this.pauseStartTime = 0;
        
        // Clear any stored state from pause/game over
        this.wasTrailSparksEnabled = undefined;
        this.wasTrailSparksEnabledGameOver = undefined;
        
        console.log('ParticleSystem: Reset complete - all particles cleared and state restored');
    }

    /**
     * Enable or disable particle system
     * @param {boolean} enabled - Whether to enable particle system
     */
    setEnabled(enabled) {
        this.settings.enabled = enabled;
        
        if (!enabled) {
            // Clear all particles when disabled
            this.reset();
        }
    }

    /**
     * Enable or disable specific effect types
     * @param {string} effectType - Effect type ('trailSparks', 'explosions', 'collections')
     * @param {boolean} enabled - Whether to enable the effect
     */
    setEffectEnabled(effectType, enabled) {
        if (this.settings.effects.hasOwnProperty(effectType)) {
            this.settings.effects[effectType] = enabled;
        }
    }

    /**
     * Get current settings
     * @returns {Object} Current particle system settings
     */
    getSettings() {
        return { ...this.settings };
    }

    /**
     * Handle WebGL context restoration
     * Called when WebGL context is restored after being lost
     */
    onContextRestore() {
        try {
            // Recreate particle texture
            if (this.particleMaterial && this.particleMaterial.uniforms.pointTexture) {
                this.particleMaterial.uniforms.pointTexture.value = this.createParticleTexture();
            }
            
            // Mark geometry attributes for re-upload
            if (this.particleGeometry) {
                Object.values(this.particleGeometry.attributes).forEach(attribute => {
                    attribute.needsUpdate = true;
                });
            }
            
            // Mark material for recompilation
            if (this.particleMaterial) {
                this.particleMaterial.needsUpdate = true;
            }
            
            console.log('ParticleSystem: WebGL context restored successfully');
        } catch (error) {
            console.error('ParticleSystem: Failed to restore WebGL context:', error);
        }
    }

    /**
     * Get rendering statistics for performance monitoring
     * @returns {Object} Rendering statistics
     */
    getRenderingStats() {
        const memoryUsage = this.getMemoryUsage();
        const performanceMetrics = this.performanceMetrics || {};

        return {
            activeParticles: this.getActiveParticleCount(),
            maxParticles: this.settings.maxParticles,
            geometryVertices: this.particleGeometry ? this.particleGeometry.attributes.position.count : 0,
            drawCalls: this.particlePoints && this.particlePoints.visible ? 1 : 0,
            memoryUsage: memoryUsage,
            performance: {
                totalParticles: performanceMetrics.totalParticles || 0,
                visibleParticles: performanceMetrics.visibleParticles || 0,
                renderedParticles: performanceMetrics.renderedParticles || 0,
                culledParticles: performanceMetrics.culledParticles || 0,
                cullRatio: performanceMetrics.cullRatio || 0,
                lodDistribution: this.getLODDistribution()
            }
        };
    }

    /**
     * Get detailed memory usage information
     * @returns {Object} Memory usage statistics
     */
    getMemoryUsage() {
        const memoryUsage = {
            bufferArrays: {
                positions: 0,
                colors: 0,
                sizes: 0,
                alphas: 0,
                total: 0
            },
            particlePool: {
                totalParticles: 0,
                activeParticles: 0,
                inactiveParticles: 0,
                estimatedSize: 0
            },
            textures: {
                particleTexture: 0
            },
            total: 0
        };

        try {
            // Calculate buffer array memory usage
            if (this.particleGeometry && this.particleGeometry.attributes) {
                const attrs = this.particleGeometry.attributes;
                memoryUsage.bufferArrays.positions = attrs.position ? attrs.position.array.byteLength : 0;
                memoryUsage.bufferArrays.colors = attrs.color ? attrs.color.array.byteLength : 0;
                memoryUsage.bufferArrays.sizes = attrs.size ? attrs.size.array.byteLength : 0;
                memoryUsage.bufferArrays.alphas = attrs.alpha ? attrs.alpha.array.byteLength : 0;
                memoryUsage.bufferArrays.total = 
                    memoryUsage.bufferArrays.positions + 
                    memoryUsage.bufferArrays.colors + 
                    memoryUsage.bufferArrays.sizes + 
                    memoryUsage.bufferArrays.alphas;
            }

            // Calculate particle pool memory usage
            if (this.particlePool) {
                const poolStats = this.particlePool.getStats();
                memoryUsage.particlePool.totalParticles = poolStats.totalParticles;
                memoryUsage.particlePool.activeParticles = poolStats.activeCount;
                memoryUsage.particlePool.inactiveParticles = poolStats.availableCount;
                // Estimate particle object size (approximate)
                memoryUsage.particlePool.estimatedSize = poolStats.totalParticles * 200; // ~200 bytes per particle object
            }

            // Calculate texture memory usage (approximate)
            if (this.particleMaterial && this.particleMaterial.uniforms.pointTexture) {
                // 128x128 RGBA texture = 128 * 128 * 4 bytes
                memoryUsage.textures.particleTexture = 128 * 128 * 4;
            }

            // Calculate total memory usage
            memoryUsage.total = 
                memoryUsage.bufferArrays.total + 
                memoryUsage.particlePool.estimatedSize + 
                memoryUsage.textures.particleTexture;

        } catch (error) {
            console.warn('ParticleSystem: Error calculating memory usage:', error);
        }

        return memoryUsage;
    }

    /**
     * Get level-of-detail distribution statistics
     * @returns {Object} LOD distribution
     */
    getLODDistribution() {
        const distribution = {
            high: 0,
            medium: 0,
            low: 0,
            culled: 0
        };

        try {
            if (this.particlePool) {
                const activeParticles = this.particlePool.getActiveParticles();
                for (const particle of activeParticles) {
                    if (particle.lodLevel) {
                        distribution[particle.lodLevel] = (distribution[particle.lodLevel] || 0) + 1;
                    }
                }
            }
        } catch (error) {
            console.warn('ParticleSystem: Error calculating LOD distribution:', error);
        }

        return distribution;
    }

    /**
     * Perform memory cleanup operations
     * @param {boolean} aggressive - Whether to perform aggressive cleanup
     */
    performMemoryCleanup(aggressive = false) {
        try {
            console.log('ParticleSystem: Performing memory cleanup...');

            // Release all inactive particles if aggressive cleanup
            if (aggressive && this.particlePool) {
                this.particlePool.releaseAll();
            }

            // Clean up buffer arrays if they're oversized
            this.cleanupBufferArrays();

            // Clean up texture resources if needed
            this.cleanupTextureResources();

            // Force garbage collection hint (if available)
            if (aggressive && typeof window !== 'undefined' && window.gc) {
                window.gc();
            }

            console.log('ParticleSystem: Memory cleanup completed');

        } catch (error) {
            console.error('ParticleSystem: Error during memory cleanup:', error);
        }
    }

    /**
     * Clean up oversized buffer arrays
     */
    cleanupBufferArrays() {
        try {
            if (!this.particleGeometry || !this.particleGeometry.attributes) return;

            const currentMaxParticles = this.settings.maxParticles;
            const attrs = this.particleGeometry.attributes;

            // Check if buffer arrays are significantly oversized
            const positionCount = attrs.position ? attrs.position.count : 0;
            const oversizeThreshold = currentMaxParticles * 1.5; // 50% larger than needed

            if (positionCount > oversizeThreshold) {
                console.log('ParticleSystem: Resizing oversized buffer arrays');
                
                // Recreate buffer arrays with appropriate size
                const positions = new Float32Array(currentMaxParticles * 3);
                const colors = new Float32Array(currentMaxParticles * 3);
                const sizes = new Float32Array(currentMaxParticles);
                const alphas = new Float32Array(currentMaxParticles);

                // Update buffer attributes
                this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
                this.particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
                this.particleGeometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
            }

        } catch (error) {
            console.warn('ParticleSystem: Error cleaning up buffer arrays:', error);
        }
    }

    /**
     * Clean up texture resources
     */
    cleanupTextureResources() {
        try {
            // Check if texture needs recreation (e.g., if it's corrupted or oversized)
            if (this.particleMaterial && this.particleMaterial.uniforms.pointTexture) {
                const texture = this.particleMaterial.uniforms.pointTexture.value;
                
                // If texture is invalid or corrupted, recreate it
                if (!texture || !texture.image) {
                    console.log('ParticleSystem: Recreating corrupted particle texture');
                    this.particleMaterial.uniforms.pointTexture.value = this.createParticleTexture();
                }
            }

        } catch (error) {
            console.warn('ParticleSystem: Error cleaning up texture resources:', error);
        }
    }

    /**
     * Monitor memory usage and trigger cleanup if needed
     */
    monitorMemoryUsage() {
        try {
            const memoryUsage = this.getMemoryUsage();
            const totalMemoryMB = memoryUsage.total / (1024 * 1024);

            // Define memory thresholds
            const warningThreshold = 50; // 50MB
            const criticalThreshold = 100; // 100MB

            if (totalMemoryMB > criticalThreshold) {
                console.warn(`ParticleSystem: Critical memory usage: ${totalMemoryMB.toFixed(2)}MB`);
                this.performMemoryCleanup(true); // Aggressive cleanup
                
                // Apply emergency memory reduction
                this.applyEmergencyMemoryReduction();
                
            } else if (totalMemoryMB > warningThreshold) {
                console.warn(`ParticleSystem: High memory usage: ${totalMemoryMB.toFixed(2)}MB`);
                this.performMemoryCleanup(false); // Normal cleanup
            }

            // Update memory monitoring metrics
            if (!this.memoryMetrics) {
                this.memoryMetrics = {};
            }
            this.memoryMetrics.currentUsageMB = totalMemoryMB;
            this.memoryMetrics.lastCheckTime = Date.now();
            this.memoryMetrics.cleanupCount = (this.memoryMetrics.cleanupCount || 0);

        } catch (error) {
            console.warn('ParticleSystem: Error monitoring memory usage:', error);
        }
    }

    /**
     * Apply emergency memory reduction measures
     */
    applyEmergencyMemoryReduction() {
        console.log('ParticleSystem: Applying emergency memory reduction');

        try {
            // Drastically reduce max particles
            const emergencyMaxParticles = Math.max(25, Math.floor(this.originalMaxParticles * 0.1));
            this.settings.maxParticles = emergencyMaxParticles;

            // Update particle pool
            if (this.particlePool) {
                this.particlePool.maxParticles = emergencyMaxParticles;
                // Release excess particles
                this.particlePool.releaseAll();
            }

            // Disable non-essential effects
            this.settings.effects.trailSparks = false;
            this.settings.effects.collections = false;

            // Set to lowest quality
            this.setQualityLevel('low');

            // Recreate buffer arrays with smaller size
            this.cleanupBufferArrays();

            console.log(`ParticleSystem: Emergency memory reduction applied - max particles: ${emergencyMaxParticles}`);

        } catch (error) {
            console.error('ParticleSystem: Error applying emergency memory reduction:', error);
        }
    }

    /**
     * Optimize rendering performance by culling off-screen particles
     * @param {THREE.Camera} camera - Camera for frustum culling
     */
    optimizeRendering(camera) {
        if (!camera || !this.particlePoints) return;

        // Update frustum culling
        this.particlePoints.frustumCulled = true;
        
        // Update bounding sphere for proper culling
        if (this.particleGeometry.boundingSphere) {
            this.particleGeometry.boundingSphere.radius = Math.max(10, this.getActiveParticleCount() * 0.1);
        }

        // Perform particle culling for off-screen particles
        this.cullOffScreenParticles(camera);
        
        // Apply level-of-detail based on distance
        this.applyLevelOfDetail(camera);
    }

    /**
     * Cull particles that are outside the camera frustum
     * @param {THREE.Camera} camera - Camera for frustum culling
     */
    cullOffScreenParticles(camera) {
        if (!camera || !this.particlePool) return;

        try {
            // Create frustum from camera
            const frustum = new THREE.Frustum();
            const matrix = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
            frustum.setFromProjectionMatrix(matrix);

            const activeParticles = this.particlePool.getActiveParticles();
            const particlesToCull = [];

            // Check each particle against frustum
            for (const particle of activeParticles) {
                if (!particle.active || !particle.position) continue;

                // Create a small sphere around the particle for testing
                const sphere = new THREE.Sphere(particle.position, particle.size || 0.1);
                
                // If particle is outside frustum, mark for culling
                if (!frustum.intersectsSphere(sphere)) {
                    // Don't immediately cull, just mark as invisible
                    particle.culled = true;
                } else {
                    particle.culled = false;
                }
            }

            // Update culled particle count for performance monitoring
            this.culledParticleCount = activeParticles.filter(p => p.culled).length;

        } catch (error) {
            console.warn('ParticleSystem: Error during particle culling:', error);
        }
    }

    /**
     * Apply level-of-detail system based on distance from camera
     * @param {THREE.Camera} camera - Camera for distance calculations
     */
    applyLevelOfDetail(camera) {
        if (!camera || !this.particlePool) return;

        try {
            const cameraPosition = camera.position;
            const activeParticles = this.particlePool.getActiveParticles();

            // Define LOD distance thresholds
            const lodThresholds = {
                high: 15,    // Full detail within 15 units
                medium: 30,  // Reduced detail 15-30 units
                low: 50      // Minimal detail 30-50 units
                // Beyond 50 units: particles are culled
            };

            for (const particle of activeParticles) {
                if (!particle.active || !particle.position) continue;

                // Calculate distance from camera
                const distance = cameraPosition.distanceTo(particle.position);

                // Apply LOD based on distance
                if (distance > lodThresholds.low) {
                    // Very far - mark for culling
                    particle.culled = true;
                    particle.lodLevel = 'culled';
                } else if (distance > lodThresholds.medium) {
                    // Far - low detail
                    particle.culled = false;
                    particle.lodLevel = 'low';
                    particle.size = Math.max(0.02, (particle.originalSize || particle.size) * 0.5);
                } else if (distance > lodThresholds.high) {
                    // Medium distance - medium detail
                    particle.culled = false;
                    particle.lodLevel = 'medium';
                    particle.size = Math.max(0.03, (particle.originalSize || particle.size) * 0.75);
                } else {
                    // Close - full detail
                    particle.culled = false;
                    particle.lodLevel = 'high';
                    particle.size = particle.originalSize || particle.size;
                }
            }

        } catch (error) {
            console.warn('ParticleSystem: Error during LOD application:', error);
        }
    }

    /**
     * Validate update parameters
     * @param {number} deltaTime - Time elapsed since last update
     * @param {Object} gameState - Current game state
     * @returns {boolean} True if parameters are valid
     */
    validateUpdateParameters(deltaTime, gameState) {
        if (typeof deltaTime !== 'number' || isNaN(deltaTime) || deltaTime < 0) {
            console.warn('ParticleSystem: Invalid deltaTime:', deltaTime);
            return false;
        }
        
        if (!gameState || typeof gameState !== 'object') {
            console.warn('ParticleSystem: Invalid gameState:', gameState);
            return false;
        }
        
        return true;
    }

    /**
     * Validate emission parameters
     * @param {Object} position - World position
     * @param {Object} velocity - Movement velocity
     * @param {number} color - Color hex value
     * @returns {boolean} True if parameters are valid
     */
    validateEmissionParameters(position, velocity, color) {
        if (!position || typeof position !== 'object' || 
            typeof position.x !== 'number' || typeof position.y !== 'number' || typeof position.z !== 'number') {
            console.warn('ParticleSystem: Invalid position:', position);
            return false;
        }
        
        if (!velocity || typeof velocity !== 'object' || 
            typeof velocity.x !== 'number' || typeof velocity.z !== 'number') {
            console.warn('ParticleSystem: Invalid velocity:', velocity);
            return false;
        }
        
        if (typeof color !== 'number' || isNaN(color)) {
            console.warn('ParticleSystem: Invalid color:', color);
            return false;
        }
        
        return true;
    }

    /**
     * Validate explosion parameters
     * @param {Object} position - Explosion center position
     * @param {number} intensity - Explosion intensity
     * @returns {boolean} True if parameters are valid
     */
    validateExplosionParameters(position, intensity) {
        if (!position || typeof position !== 'object' || 
            typeof position.x !== 'number' || typeof position.y !== 'number' || typeof position.z !== 'number') {
            console.warn('ParticleSystem: Invalid explosion position:', position);
            return false;
        }
        
        if (typeof intensity !== 'number' || isNaN(intensity) || intensity < 0 || intensity > 1) {
            console.warn('ParticleSystem: Invalid explosion intensity:', intensity);
            return false;
        }
        
        return true;
    }

    /**
     * Validate collection parameters
     * @param {Object} position - Collection position
     * @param {string} powerUpType - Type of power-up collected
     * @returns {boolean} True if parameters are valid
     */
    validateCollectionParameters(position, powerUpType) {
        if (!position || typeof position !== 'object' || 
            typeof position.x !== 'number' || typeof position.y !== 'number' || typeof position.z !== 'number') {
            console.warn('ParticleSystem: Invalid collection position:', position);
            return false;
        }
        
        if (typeof powerUpType !== 'string') {
            console.warn('ParticleSystem: Invalid powerUpType:', powerUpType);
            return false;
        }
        
        return true;
    }

    /**
     * Handle performance monitoring errors
     * @param {Error} error - Performance monitoring error
     */
    handlePerformanceMonitoringError(error) {
        console.warn('ParticleSystem: Performance monitoring disabled due to error:', error.message);
        
        // Disable performance monitoring to prevent further errors
        this.adaptiveQualityEnabled = false;
        
        // Apply conservative quality settings
        this.setQualityLevel('low');
        
        // Record error for debugging
        this.recordError('performance_monitoring', error);
    }

    /**
     * Handle performance degradation check errors
     * @param {Error} error - Performance degradation error
     */
    handlePerformanceDegradationError(error) {
        console.warn('ParticleSystem: Performance degradation check failed:', error.message);
        
        // Apply emergency performance reduction
        this.applyEmergencyPerformanceReduction();
        
        // Record error for debugging
        this.recordError('performance_degradation', error);
    }

    /**
     * Handle particle pool errors
     * @param {Error} error - Particle pool error
     */
    handleParticlePoolError(error) {
        console.warn('ParticleSystem: Particle pool error, attempting recovery:', error.message);
        
        try {
            // Attempt to recover by releasing all particles and reinitializing
            this.particlePool.releaseAll();
            console.log('ParticleSystem: Particle pool recovered by releasing all particles');
        } catch (recoveryError) {
            console.error('ParticleSystem: Failed to recover particle pool:', recoveryError);
            this.initiateSystemReset('particle_pool_failure');
        }
        
        // Record error for debugging
        this.recordError('particle_pool', error);
    }

    /**
     * Handle rendering errors
     * @param {Error} error - Rendering error
     */
    handleRenderingError(error) {
        console.warn('ParticleSystem: Rendering error, attempting recovery:', error.message);
        
        try {
            // Attempt to recover by reinitializing rendering buffers
            this.reinitializeRenderingBuffers();
            console.log('ParticleSystem: Rendering recovered by reinitializing buffers');
        } catch (recoveryError) {
            console.error('ParticleSystem: Failed to recover rendering:', recoveryError);
            this.initiateSystemReset('rendering_failure');
        }
        
        // Record error for debugging
        this.recordError('rendering', error);
    }

    /**
     * Handle shader errors
     * @param {Error} error - Shader error
     */
    handleShaderError(error) {
        console.warn('ParticleSystem: Shader error, disabling shader updates:', error.message);
        
        // Disable shader uniform updates to prevent further errors
        this.shaderUpdatesEnabled = false;
        
        // Record error for debugging
        this.recordError('shader', error);
    }

    /**
     * Handle critical system errors
     * @param {Error} error - Critical error
     * @param {string} context - Context where error occurred
     */
    handleCriticalError(error, context) {
        console.error(`ParticleSystem: Critical error in ${context}:`, error);
        
        // Record critical error
        this.recordError('critical', error, context);
        
        // Increment error count
        this.errorCount = (this.errorCount || 0) + 1;
        
        // If too many critical errors, initiate system reset
        if (this.errorCount >= 3) {
            console.error('ParticleSystem: Too many critical errors, initiating system reset');
            this.initiateSystemReset('critical_error_threshold');
        } else {
            // Apply graceful fallback
            this.applyGracefulFallback(context);
        }
    }

    /**
     * Apply emergency performance reduction
     */
    applyEmergencyPerformanceReduction() {
        console.log('ParticleSystem: Applying emergency performance reduction');
        
        // Disable all effects except essential ones
        this.settings.effects.trailSparks = false;
        this.settings.effects.collections = false;
        
        // Set to lowest quality
        this.setQualityLevel('low');
        
        // Reduce max particles drastically
        this.settings.maxParticles = Math.max(25, Math.floor(this.originalMaxParticles * 0.25));
        
        // Update particle pool
        if (this.particlePool) {
            this.particlePool.maxParticles = this.settings.maxParticles;
        }
    }

    /**
     * Reinitialize rendering buffers
     */
    reinitializeRenderingBuffers() {
        if (!this.particleGeometry) return;
        
        // Recreate buffer attributes
        const positions = new Float32Array(this.settings.maxParticles * 3);
        const colors = new Float32Array(this.settings.maxParticles * 3);
        const sizes = new Float32Array(this.settings.maxParticles);
        const alphas = new Float32Array(this.settings.maxParticles);

        // Update buffer attributes
        this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        this.particleGeometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
        
        console.log('ParticleSystem: Rendering buffers reinitialized');
    }

    /**
     * Apply graceful fallback for specific contexts
     * @param {string} context - Context where error occurred
     */
    applyGracefulFallback(context) {
        console.log(`ParticleSystem: Applying graceful fallback for ${context}`);
        
        switch (context) {
            case 'update':
                // Disable automatic updates, require manual calls
                this.autoUpdateEnabled = false;
                break;
                
            case 'emitTrailSparks':
                // Disable trail sparks
                this.settings.effects.trailSparks = false;
                break;
                
            case 'createExplosion':
                // Disable explosions
                this.settings.effects.explosions = false;
                break;
                
            case 'createCollectionEffect':
                // Disable collection effects
                this.settings.effects.collections = false;
                break;
                
            default:
                // General fallback - reduce quality
                this.setQualityLevel('low');
                break;
        }
    }

    /**
     * Initiate system reset with recovery
     * @param {string} reason - Reason for system reset
     */
    initiateSystemReset(reason) {
        console.warn(`ParticleSystem: Initiating system reset due to: ${reason}`);
        
        try {
            // Clear all particles
            if (this.particlePool) {
                this.particlePool.releaseAll();
            }
            
            // Reset error count
            this.errorCount = 0;
            
            // Reset to safe defaults
            this.settings.enabled = true;
            this.settings.quality = 'low';
            this.settings.maxParticles = 50; // Very conservative
            this.settings.effects = {
                trailSparks: false,
                explosions: true, // Keep explosions for collision feedback
                collections: false
            };
            
            // Reinitialize critical components
            if (this.scene) {
                this.initializeRendering();
            }
            
            // Reset performance monitoring
            if (this.performanceMonitor) {
                this.performanceMonitor.reset();
            }
            
            // Re-enable adaptive quality with conservative settings
            this.adaptiveQualityEnabled = true;
            this.degradationLevel = 0;
            
            console.log('ParticleSystem: System reset completed successfully');
            
        } catch (resetError) {
            console.error('ParticleSystem: Failed to reset system:', resetError);
            
            // Last resort - disable particle system entirely
            this.settings.enabled = false;
            console.error('ParticleSystem: Disabled particle system as last resort');
        }
    }

    /**
     * Record error for debugging and analysis
     * @param {string} type - Error type
     * @param {Error} error - Error object
     * @param {string} context - Additional context
     */
    recordError(type, error, context = '') {
        if (!this.errorHistory) {
            this.errorHistory = [];
        }
        
        const errorRecord = {
            timestamp: Date.now(),
            type: type,
            message: error.message,
            stack: error.stack,
            context: context
        };
        
        this.errorHistory.push(errorRecord);
        
        // Keep only last 10 errors to prevent memory issues
        if (this.errorHistory.length > 10) {
            this.errorHistory.shift();
        }
    }

    /**
     * Get error history for debugging
     * @returns {Array} Array of error records
     */
    getErrorHistory() {
        return this.errorHistory || [];
    }

    /**
     * Get system health status
     * @returns {Object} System health information
     */
    getSystemHealth() {
        return {
            enabled: this.settings.enabled,
            errorCount: this.errorCount || 0,
            recentErrors: this.getErrorHistory().length,
            adaptiveQualityEnabled: this.adaptiveQualityEnabled,
            degradationLevel: this.degradationLevel,
            autoUpdateEnabled: this.autoUpdateEnabled !== false,
            shaderUpdatesEnabled: this.shaderUpdatesEnabled !== false,
            activeParticles: this.getActiveParticleCount(),
            maxParticles: this.settings.maxParticles,
            effectsEnabled: { ...this.settings.effects }
        };
    }

    /**
     * Clean up partially created rendering resources
     */
    cleanupRenderingResources() {
        try {
            if (this.particlePoints && this.scene) {
                this.scene.remove(this.particlePoints);
            }
        } catch (error) {
            console.warn('ParticleSystem: Error removing particle points from scene:', error);
        }

        try {
            if (this.particleGeometry) {
                this.particleGeometry.dispose();
            }
        } catch (error) {
            console.warn('ParticleSystem: Error disposing particle geometry:', error);
        }

        try {
            if (this.particleMaterial) {
                if (this.particleMaterial.uniforms && this.particleMaterial.uniforms.pointTexture) {
                    const texture = this.particleMaterial.uniforms.pointTexture.value;
                    if (texture && texture.dispose) {
                        texture.dispose();
                    }
                }
                this.particleMaterial.dispose();
            }
        } catch (error) {
            console.warn('ParticleSystem: Error disposing particle material:', error);
        }

        // Clear references
        this.particlePoints = null;
        this.particleGeometry = null;
        this.particleMaterial = null;

        console.log('ParticleSystem: Rendering resources cleaned up');
    }

    /**
     * Dispose of particle system resources
     */
    dispose() {
        // Remove from scene
        if (this.particlePoints) {
            this.scene.remove(this.particlePoints);
        }

        // Dispose of geometry and material
        if (this.particleGeometry) {
            this.particleGeometry.dispose();
        }
        if (this.particleMaterial) {
            // Dispose of texture
            if (this.particleMaterial.uniforms && this.particleMaterial.uniforms.pointTexture) {
                const texture = this.particleMaterial.uniforms.pointTexture.value;
                if (texture && texture.dispose) {
                    texture.dispose();
                }
            }
            this.particleMaterial.dispose();
        }

        // Dispose of particle pool
        if (this.particlePool) {
            this.particlePool.dispose();
        }
        
        // Clean up performance monitor
        if (this.performanceMonitor) {
            this.performanceMonitor.reset();
        }
        
        // Clear references
        this.particlePoints = null;
        this.particleGeometry = null;
        this.particleMaterial = null;
        this.performanceMonitor = null;
        this.scene = null;
    }
}

module.exports = { ParticleSystem, Particle };