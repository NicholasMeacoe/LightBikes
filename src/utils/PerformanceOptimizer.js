/**
 * PerformanceOptimizer - Handles performance optimizations for the customization system
 * Implements material reuse, texture pooling, geometry sharing, and LOD systems
 */
const { logger } = require('./Logger.js');

class PerformanceOptimizer {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;

        // Material pools for reuse
        this.materialPools = {
            bike: new Map(), // color -> material
            trail: new Map(), // color+style -> material
            theme: new Map(), // theme+element -> material
        };

        // Geometry pools for sharing
        this.geometryPools = {
            bike: null,
            trailSegment: null,
            powerUp: new Map(), // type -> geometry
        };

        // Texture pools
        this.texturePools = {
            gradients: new Map(), // gradient key -> texture
            patterns: new Map(), // pattern key -> texture
            effects: new Map(), // effect key -> texture
        };

        // LOD system configuration
        this.lodConfig = {
            trailSegments: {
                highDetail: { distance: 20, opacity: 0.8 },
                mediumDetail: { distance: 50, opacity: 0.6 },
                lowDetail: { distance: 100, opacity: 0.4 },
                culled: { distance: 150 },
            },
            effects: {
                highDetail: { distance: 30 },
                mediumDetail: { distance: 60 },
                culled: { distance: 120 },
            },
        };

        // Performance monitoring
        this.performanceMetrics = {
            frameTime: 0,
            drawCalls: 0,
            materialCount: 0,
            geometryCount: 0,
            textureCount: 0,
            lastOptimizationTime: 0,
            averageFPS: 0, // Added for new logic
        };

        this.lastFrameTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
        this.debugMode = false; // Added for new logic

        // Batch update system
        this.batchUpdates = {
            materials: new Set(),
            geometries: new Set(),
            textures: new Set(),
            scheduled: false,
        };

        // Initialize shared geometries
        this.initializeGeometryPools();

        // Performance monitoring interval
        this.startPerformanceMonitoring();
    }

    /**
     * Initialize shared geometry pools
     */
    initializeGeometryPools() {
        // Shared bike geometry
        this.geometryPools.bike = new THREE.BoxGeometry(1, 1, 1);

        // Shared trail segment geometry
        this.geometryPools.trailSegment = new THREE.BoxGeometry(0.1, 0.5, 0.5);

        // Shared power-up geometries
        this.geometryPools.powerUp.set('speed', new THREE.SphereGeometry(0.3, 16, 16));

        // Handle potential missing geometries in some environments/versions
        const OctahedronGeo = THREE.OctahedronGeometry || THREE.SphereGeometry;
        const IcosahedronGeo = THREE.IcosahedronGeometry || THREE.SphereGeometry;
        const ConeGeo = THREE.ConeGeometry || THREE.BoxGeometry;

        this.geometryPools.powerUp.set('shield', new OctahedronGeo(0.3, 1));
        this.geometryPools.powerUp.set('eraser', new ConeGeo(0.3, 0.6, 8));
        this.geometryPools.powerUp.set('ghost', new IcosahedronGeo(0.3, 1));
    }

    /**
     * Get or create a reusable bike material
     * @param {number} color - Color as hex number
     * @param {Object} options - Additional material options
     * @returns {THREE.Material} Reused or new material
     */
    getOrCreateBikeMaterial(color, options = {}) {
        const materialKey = `${color}_${JSON.stringify(options)}`;

        if (this.materialPools.bike.has(materialKey)) {
            return this.materialPools.bike.get(materialKey);
        }

        // Create new material
        const material = new THREE.MeshLambertMaterial({
            color: color,
            transparent: options.transparent || false,
            opacity: options.opacity || 1.0,
            emissive: options.emissive || 0x000000,
            emissiveIntensity: options.emissiveIntensity || 0,
        });

        this.materialPools.bike.set(materialKey, material);
        this.performanceMetrics.materialCount++;

        return material;
    }

    /**
     * Get or create a reusable trail material
     * @param {number} color - Color as hex number
     * @param {string} style - Trail style
     * @param {Object} options - Additional material options
     * @returns {THREE.Material} Reused or new material
     */
    getOrCreateTrailMaterial(color, style, options = {}) {
        const materialKey = `${color}_${style}_${JSON.stringify(options)}`;

        if (this.materialPools.trail.has(materialKey)) {
            return this.materialPools.trail.get(materialKey);
        }

        // Create material based on style
        let material;

        switch (style) {
            case 'glowing':
                material = new THREE.MeshLambertMaterial({
                    color: color,
                    transparent: true,
                    opacity: options.opacity || 0.9,
                    emissive: color,
                    emissiveIntensity: options.emissiveIntensity || 0.5,
                });
                break;

            case 'dashed':
            case 'solid':
            case 'rainbow':
            default:
                material = new THREE.MeshLambertMaterial({
                    color: color,
                    transparent: true,
                    opacity: options.opacity || 0.8,
                });
                break;
        }

        this.materialPools.trail.set(materialKey, material);
        this.performanceMetrics.materialCount++;

        return material;
    }

    /**
     * Get or create a reusable theme material
     * @param {string} theme - Theme name
     * @param {string} element - Element type (grid, background, etc.)
     * @param {Object} config - Material configuration
     * @returns {THREE.Material} Reused or new material
     */
    getOrCreateThemeMaterial(theme, element, config) {
        const materialKey = `${theme}_${element}_${JSON.stringify(config)}`;

        if (this.materialPools.theme.has(materialKey)) {
            return this.materialPools.theme.get(materialKey);
        }

        // Create material based on element type
        let material;

        switch (element) {
            case 'grid':
                material = new THREE.LineBasicMaterial({
                    color: config.color,
                    opacity: config.opacity,
                    transparent: true,
                });
                break;

            case 'background':
                material = new THREE.MeshBasicMaterial({
                    color: config.color,
                    transparent: config.transparent || false,
                    opacity: config.opacity || 1.0,
                });
                break;

            default:
                material = new THREE.MeshLambertMaterial({
                    color: config.color,
                    transparent: config.transparent || false,
                    opacity: config.opacity || 1.0,
                });
                break;
        }

        this.materialPools.theme.set(materialKey, material);
        this.performanceMetrics.materialCount++;

        return material;
    }

    /**
     * Get shared geometry for a specific type
     * @param {string} type - Geometry type ('bike', 'trailSegment', or power-up type)
     * @returns {THREE.Geometry} Shared geometry
     */
    getSharedGeometry(type) {
        if (this.geometryPools[type]) {
            return this.geometryPools[type];
        }

        if (this.geometryPools.powerUp.has(type)) {
            return this.geometryPools.powerUp.get(type);
        }

        logger.warn('Unknown geometry type:', type);
        return this.geometryPools.bike; // Fallback
    }

    /**
     * Get or create a pooled texture
     * @param {string} type - Texture type ('gradient', 'pattern', 'effect')
     * @param {string} key - Texture key
     * @param {Function} createFn - Function to create texture if not found
     * @returns {THREE.Texture} Pooled texture
     */
    getOrCreateTexture(type, key, createFn) {
        const pool = this.texturePools[type];
        if (!pool) {
            logger.warn('Unknown texture pool type:', type);
            return null;
        }

        if (pool.has(key)) {
            return pool.get(key);
        }

        // Create new texture
        const texture = createFn();
        pool.set(key, texture);
        this.performanceMetrics.textureCount++;

        return texture;
    }

    /**
     * Apply LOD (Level of Detail) optimizations to trail segments
     * @param {THREE.Vector3} cameraPosition - Current camera position
     */
    applyTrailLOD(cameraPosition) {
        const lodConfig = this.lodConfig.trailSegments;

        this.scene.traverse((object) => {
            if (
                object.userData &&
                object.userData.materialId &&
                object.userData.materialId.startsWith('trail_')
            ) {
                const distance = object.position.distanceTo(cameraPosition);

                // Apply LOD based on distance
                if (distance > lodConfig.culled.distance) {
                    // Cull distant segments
                    object.visible = false;
                } else if (distance > lodConfig.lowDetail.distance) {
                    // Low detail
                    object.visible = true;
                    object.material.opacity = lodConfig.lowDetail.opacity;
                } else if (distance > lodConfig.mediumDetail.distance) {
                    // Medium detail
                    object.visible = true;
                    object.material.opacity = lodConfig.mediumDetail.opacity;
                } else {
                    // High detail
                    object.visible = true;
                    object.material.opacity = lodConfig.highDetail.opacity;
                }
            }
        });
    }

    /**
     * Apply LOD optimizations to effects
     * @param {THREE.Vector3} cameraPosition - Current camera position
     */
    applyEffectsLOD(cameraPosition) {
        const lodConfig = this.lodConfig.effects;

        this.scene.traverse((object) => {
            if (object.userData && object.userData.effectType) {
                const distance = cameraPosition.distanceTo(object.position);

                // Apply LOD based on distance
                if (distance > lodConfig.culled.distance) {
                    // Disable distant effects
                    object.visible = false;
                } else if (distance > lodConfig.mediumDetail.distance) {
                    // Reduce effect intensity
                    object.visible = true;
                    if (object.material && object.material.emissiveIntensity !== undefined) {
                        object.material.emissiveIntensity *= 0.5;
                    }
                } else {
                    // Full effect intensity
                    object.visible = true;
                    if (object.material && object.material.emissiveIntensity !== undefined) {
                        object.material.emissiveIntensity =
                            object.userData.originalEmissiveIntensity || 0.5;
                    }
                }
            }
        });
    }

    /**
     * Schedule a batch update for materials
     * @param {THREE.Material} material - Material to update
     */
    scheduleMaterialUpdate(material) {
        this.batchUpdates.materials.add(material);
        this.scheduleBatchUpdate();
    }

    /**
     * Schedule a batch update for geometries
     * @param {THREE.Geometry} geometry - Geometry to update
     */
    scheduleGeometryUpdate(geometry) {
        this.batchUpdates.geometries.add(geometry);
        this.scheduleBatchUpdate();
    }

    /**
     * Schedule a batch update for textures
     * @param {THREE.Texture} texture - Texture to update
     */
    scheduleTextureUpdate(texture) {
        this.batchUpdates.textures.add(texture);
        this.scheduleBatchUpdate();
    }

    /**
     * Schedule batch update execution
     */
    scheduleBatchUpdate() {
        if (this.batchUpdates.scheduled) return;

        this.batchUpdates.scheduled = true;

        // Use requestAnimationFrame for next frame update
        requestAnimationFrame(() => {
            this.executeBatchUpdates();
        });
    }

    /**
     * Execute all scheduled batch updates
     */
    executeBatchUpdates() {
        // Update materials
        this.batchUpdates.materials.forEach((material) => {
            if (material.needsUpdate !== undefined) {
                material.needsUpdate = true;
            }
        });

        // Update geometries
        this.batchUpdates.geometries.forEach((geometry) => {
            if (geometry.attributes) {
                Object.values(geometry.attributes).forEach((attribute) => {
                    if (attribute.needsUpdate !== undefined) {
                        attribute.needsUpdate = true;
                    }
                });
            }
        });

        // Update textures
        this.batchUpdates.textures.forEach((texture) => {
            if (texture.needsUpdate !== undefined) {
                texture.needsUpdate = true;
            }
        });

        // Clear batch updates
        this.batchUpdates.materials.clear();
        this.batchUpdates.geometries.clear();
        this.batchUpdates.textures.clear();
        this.batchUpdates.scheduled = false;
    }

    /**
     * Optimize scene for performance
     * @param {THREE.Vector3} cameraPosition - Current camera position
     */
    optimizeScene(cameraPosition) {
        // Apply LOD optimizations
        this.applyTrailLOD(cameraPosition);
        this.applyEffectsLOD(cameraPosition);

        // Execute any pending batch updates
        if (this.batchUpdates.scheduled) {
            this.executeBatchUpdates();
        }

        // Update performance metrics
        this.updatePerformanceMetrics();
    }

    /**
     * Update performance metrics
     */
    updatePerformanceMetrics() {
        const info = this.renderer ? this.renderer.info : null;

        // Update metrics from renderer
        if (info) {
            this.performanceMetrics.drawCalls = info.render ? info.render.calls : 0;
            this.performanceMetrics.geometryCount = info.memory ? info.memory.geometries : 0;
            this.performanceMetrics.textureCount = info.memory ? info.memory.textures : 0;
        }

        // Calculate frame time
        const currentTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
        if (this.lastFrameTime !== undefined) {
            const frameTime = currentTime - this.lastFrameTime;
            // Smooth frame time
            this.performanceMetrics.frameTime =
                this.performanceMetrics.frameTime * 0.9 + frameTime * 0.1;
            this.performanceMetrics.averageFPS = 1000 / this.performanceMetrics.frameTime;
        }
        this.lastFrameTime = currentTime;
    }

    /**
     * Get current performance metrics
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }

    /**
     * Check if performance is within acceptable limits
     * @returns {boolean} True if performance is acceptable
     */
    isPerformanceAcceptable() {
        const targetFrameTime = 16.67; // 60 FPS
        return this.performanceMetrics.frameTime <= targetFrameTime * 1.2; // 20% tolerance
    }

    /**
     * Start performance monitoring
     */
    startPerformanceMonitoring() {
        // Monitor performance every second
        setInterval(() => {
            this.updatePerformanceMetrics();

            if (this.performanceMetrics.averageFPS < 30) {
                if (this.debugMode) {
                    logger.warn('Performance below target:', this.performanceMetrics);
                }
                this.optimizePerformance();
            }
        }, 1000);
    }

    /**
     * Placeholder for performance optimization logic
     */
    optimizePerformance() {
        // Implement dynamic LOD adjustments, texture quality reduction,
        // or other performance-saving measures here.
        // For example:
        // this.lodConfig.trailSegments.lowDetail.distance *= 1.1;
        // logger.info('Applying dynamic performance optimization.');
    }

    /**
     * Clean up unused materials and textures
     */
    cleanup() {
        // Clean up material pools
        Object.values(this.materialPools).forEach((pool) => {
            pool.forEach((material) => {
                if (material.dispose) {
                    material.dispose();
                }
            });
            pool.clear();
        });

        // Clean up texture pools
        Object.values(this.texturePools).forEach((pool) => {
            pool.forEach((texture) => {
                if (texture.dispose) {
                    texture.dispose();
                }
            });
            pool.clear();
        });

        // Clean up geometry pools
        Object.values(this.geometryPools).forEach((geometry) => {
            if (geometry && geometry.dispose) {
                geometry.dispose();
            }
        });

        this.geometryPools.powerUp.forEach((geometry) => {
            if (geometry.dispose) {
                geometry.dispose();
            }
        });

        this.performanceMetrics.materialCount = 0;
        this.performanceMetrics.textureCount = 0;
        this.performanceMetrics.geometryCount = 0;
    }

    /**
     * Dispose of a specific material from pools
     * @param {string} poolType - Pool type ('bike', 'trail', 'theme')
     * @param {string} materialKey - Material key
     */
    disposeMaterial(poolType, materialKey) {
        const pool = this.materialPools[poolType];
        if (pool && pool.has(materialKey)) {
            const material = pool.get(materialKey);
            if (material.dispose) {
                material.dispose();
            }
            pool.delete(materialKey);
            this.performanceMetrics.materialCount--;
        }
    }
}

module.exports = { PerformanceOptimizer };
