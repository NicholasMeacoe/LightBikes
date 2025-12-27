const { logger } = require('../utils/Logger.js');

/**
 * TrailStyleRenderer - Handles different trail rendering styles
 * Supports solid, dashed, glowing, and rainbow trail effects
 */
class TrailStyleRenderer {
    constructor(scene, emissiveMaterialSystem, performanceOptimizer = null) {
        this.scene = scene;
        this.emissiveMaterialSystem = emissiveMaterialSystem;
        this.performanceOptimizer = performanceOptimizer;

        // Trail style configurations
        this.styleConfigs = {
            solid: {
                opacity: 0.8,
                segments: 'continuous',
                effects: [],
                renderAllSegments: true,
            },
            dashed: {
                opacity: 0.8,
                segments: 'alternating',
                effects: [],
                renderAllSegments: false,
                dashPattern: 2, // Render every 2nd segment
            },
            glowing: {
                opacity: 0.9,
                segments: 'continuous',
                effects: ['emissive', 'bloom'],
                renderAllSegments: true,
                emissiveIntensity: 0.5,
            },
            rainbow: {
                opacity: 0.8,
                segments: 'continuous',
                effects: ['color-cycle'],
                renderAllSegments: true,
                colorCycleSpeed: 0.5,
            },
        };

        // Track trail styles per player
        this.playerTrailStyles = new Map();

        // Rainbow color cycling state
        this.rainbowTime = 0;
        this.rainbowColors = [
            0xff0000, // Red
            0xff8000, // Orange
            0xffff00, // Yellow
            0x80ff00, // Yellow-Green
            0x00ff00, // Green
            0x00ff80, // Green-Cyan
            0x00ffff, // Cyan
            0x0080ff, // Cyan-Blue
            0x0000ff, // Blue
            0x8000ff, // Blue-Purple
            0xff00ff, // Purple
            0xff0080, // Purple-Red
        ];
    }

    /**
     * Set trail style for a player
     * @param {string} playerId - Player identifier
     * @param {string} style - Trail style ('solid', 'dashed', 'glowing', 'rainbow')
     */
    setTrailStyle(playerId, style) {
        if (!this.styleConfigs[style]) {
            logger.warn(`Invalid trail style: ${style}`);
            return false;
        }

        this.playerTrailStyles.set(playerId, style);
        return true;
    }

    /**
     * Get trail style for a player
     * @param {string} playerId - Player identifier
     * @returns {string} Trail style name
     */
    getTrailStyle(playerId) {
        return this.playerTrailStyles.get(playerId) || 'solid';
    }

    /**
     * Create a trail segment with the specified style
     * @param {Object} position - Segment position {x, y, z}
     * @param {number} baseColor - Base color as hex number
     * @param {Array} trail - Trail segments array
     * @param {string} playerId - Player identifier
     * @returns {THREE.Mesh|null} Created trail segment or null if not rendered
     */
    createStyledTrailSegment(position, baseColor, trail, playerId) {
        const style = this.getTrailStyle(playerId);
        const config = this.styleConfigs[style];

        // Check if this segment should be rendered based on style
        if (!this.shouldRenderSegment(trail.length, config)) {
            return null;
        }

        // Create base geometry with performance optimization
        const trailGeometry = this.performanceOptimizer
            ? this.performanceOptimizer.getSharedGeometry('trailSegment')
            : new THREE.BoxGeometry(0.1, 0.5, 0.5);

        // Determine final color based on style
        const finalColor = this.calculateSegmentColor(baseColor, style, trail.length);

        // Create material based on style
        const material = this.createStyledMaterial(finalColor, config, playerId, trail.length);

        // Create mesh
        const trailSegment = new THREE.Mesh(trailGeometry, material);
        trailSegment.position.x = position.x;
        trailSegment.position.z = position.z;
        trailSegment.position.y = position.y || 0;

        // Store metadata for cleanup and updates
        const segmentId = `trail_${playerId}_${position.x}_${position.z}_${Date.now()}`;
        trailSegment.userData = {
            materialId: segmentId,
            playerId: playerId,
            style: style,
            segmentIndex: trail.length,
            baseColor: baseColor,
        };

        this.scene.add(trailSegment);
        return trailSegment;
    }

    /**
     * Determine if a segment should be rendered based on style configuration
     * @param {number} segmentIndex - Index of the segment in the trail
     * @param {Object} config - Style configuration
     * @returns {boolean} True if segment should be rendered
     */
    shouldRenderSegment(segmentIndex, config) {
        if (config.renderAllSegments) {
            return true;
        }

        // Handle dashed pattern
        if (config.segments === 'alternating' && config.dashPattern) {
            return segmentIndex % config.dashPattern === 0;
        }

        return true;
    }

    /**
     * Calculate the color for a trail segment based on style
     * @param {number} baseColor - Base color as hex number
     * @param {string} style - Trail style name
     * @param {number} segmentIndex - Index of the segment in the trail
     * @returns {number} Final color as hex number
     */
    calculateSegmentColor(baseColor, style, segmentIndex) {
        switch (style) {
            case 'rainbow':
                return this.calculateRainbowColor(segmentIndex);
            case 'solid':
            case 'dashed':
            case 'glowing':
            default:
                return baseColor;
        }
    }

    /**
     * Calculate rainbow color for a segment
     * @param {number} segmentIndex - Index of the segment in the trail
     * @returns {number} Rainbow color as hex number
     */
    calculateRainbowColor(segmentIndex) {
        const config = this.styleConfigs.rainbow;
        const colorIndex = Math.floor(
            (segmentIndex * config.colorCycleSpeed) % this.rainbowColors.length
        );
        return this.rainbowColors[colorIndex];
    }

    /**
     * Create material based on trail style
     * @param {number} color - Color as hex number
     * @param {Object} config - Style configuration
     * @param {string} playerId - Player identifier
     * @param {number} segmentIndex - Segment index for unique material ID
     * @returns {THREE.Material} Created material
     */
    createStyledMaterial(color, config, playerId, segmentIndex) {
        const segmentId = `trail_${playerId}_${segmentIndex}_${Date.now()}`;
        const style = this.getTrailStyle(playerId);

        // Use performance optimizer for material reuse if available
        if (this.performanceOptimizer) {
            return this.performanceOptimizer.getOrCreateTrailMaterial(color, style, {
                opacity: config.opacity,
                emissiveIntensity: config.emissiveIntensity,
                transparent: true,
            });
        }

        // Fallback to original material creation
        if (config.effects.includes('emissive') || config.effects.includes('bloom')) {
            // Use emissive material system for glowing effects
            const material = this.emissiveMaterialSystem.createTrailMaterial(segmentId, color);

            // Enhance emissive intensity for glowing style
            if (config.emissiveIntensity !== undefined) {
                material.emissiveIntensity = config.emissiveIntensity;
            }

            material.transparent = true;
            material.opacity = config.opacity;

            return material;
        } else {
            // Create standard material for solid and dashed styles
            const material = new THREE.MeshLambertMaterial({
                color: color,
                transparent: true,
                opacity: config.opacity,
            });

            return material;
        }
    }

    /**
     * Update rainbow trail colors (called each frame)
     * @param {number} deltaTime - Time since last update in seconds
     */
    updateRainbowTrails(deltaTime) {
        this.rainbowTime += deltaTime;

        // Update all rainbow trail segments
        this.scene.traverse((object) => {
            if (object.userData && object.userData.style === 'rainbow') {
                const segmentIndex = object.userData.segmentIndex;
                const newColor = this.calculateRainbowColor(segmentIndex + this.rainbowTime * 10);
                object.material.color.setHex(newColor);
            }
        });
    }

    /**
     * Update all styled trail effects
     * @param {number} deltaTime - Time since last update in seconds
     */
    updateTrailEffects(deltaTime) {
        // Update rainbow trails
        this.updateRainbowTrails(deltaTime);

        // Update glowing effects (handled by emissive material system)
        // No additional updates needed for solid and dashed styles
    }

    /**
     * Clear all trail segments for a specific player
     * @param {string} playerId - Player identifier
     */
    clearPlayerTrails(playerId) {
        const segmentsToRemove = [];

        this.scene.traverse((object) => {
            if (object.userData && object.userData.playerId === playerId) {
                segmentsToRemove.push(object);
            }
        });

        segmentsToRemove.forEach((segment) => {
            this.scene.remove(segment);

            // Dispose of material and geometry
            if (segment.material) {
                // Dispose through emissive material system if applicable
                if (segment.userData.materialId && this.emissiveMaterialSystem) {
                    this.emissiveMaterialSystem.disposeMaterial(segment.userData.materialId);
                } else {
                    segment.material.dispose();
                }
            }
            if (segment.geometry) {
                segment.geometry.dispose();
            }
        });
    }

    /**
     * Clear all trail segments
     */
    clearAllTrails() {
        const segmentsToRemove = [];

        this.scene.traverse((object) => {
            if (
                object.userData &&
                object.userData.materialId &&
                object.userData.materialId.startsWith('trail_')
            ) {
                segmentsToRemove.push(object);
            }
        });

        segmentsToRemove.forEach((segment) => {
            this.scene.remove(segment);

            // Dispose of material and geometry
            if (segment.material) {
                if (segment.userData.materialId && this.emissiveMaterialSystem) {
                    this.emissiveMaterialSystem.disposeMaterial(segment.userData.materialId);
                } else {
                    segment.material.dispose();
                }
            }
            if (segment.geometry) {
                segment.geometry.dispose();
            }
        });
    }

    /**
     * Get available trail styles
     * @returns {Array} Array of style names
     */
    getAvailableStyles() {
        return Object.keys(this.styleConfigs);
    }

    /**
     * Get style configuration
     * @param {string} style - Style name
     * @returns {Object|null} Style configuration or null if not found
     */
    getStyleConfig(style) {
        return this.styleConfigs[style] || null;
    }

    /**
     * Validate trail style name
     * @param {string} style - Style name to validate
     * @returns {boolean} True if valid
     */
    isValidStyle(style) {
        return this.styleConfigs.hasOwnProperty(style);
    }
}

module.exports = { TrailStyleRenderer };
