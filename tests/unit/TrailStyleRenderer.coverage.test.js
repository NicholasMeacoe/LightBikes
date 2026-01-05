/**
 * Coverage Tests for TrailStyleRenderer
 * Targets uncovered lines: performance optimizer integration, material disposal fallbacks
 */

const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
};

jest.mock('../../src/utils/Logger.js', () => ({
    logger: mockLogger,
}));

global.THREE = {
    BoxGeometry: class BoxGeometry {
        constructor(width, height, depth) {
            this.width = width;
            this.height = height;
            this.depth = depth;
        }
        dispose() {}
    },
    Mesh: class Mesh {
        constructor(geometry, material) {
            this.geometry = geometry;
            this.material = material;
            this.position = { x: 0, y: 0, z: 0 };
            this.userData = {};
        }
    },
    MeshLambertMaterial: class MeshLambertMaterial {
        constructor(params) {
            Object.assign(this, params);
            this.color = { setHex: jest.fn() };
        }
        dispose() {}
    },
    Scene: class Scene {
        constructor() {
            this.children = [];
        }
        add(object) {
            this.children.push(object);
        }
        remove(object) {
            const index = this.children.indexOf(object);
            if (index > -1) {
                this.children.splice(index, 1);
            }
        }
        traverse(callback) {
            this.children.forEach(callback);
        }
    },
};

const { TrailStyleRenderer } = require('../../src/rendering/TrailStyleRenderer.js');

describe('TrailStyleRenderer Coverage', () => {
    let renderer;
    let mockScene;
    let mockEmissiveMaterialSystem;

    beforeEach(() => {
        mockScene = new THREE.Scene();
        mockEmissiveMaterialSystem = {
            createTrailMaterial: jest.fn().mockReturnValue({
                emissiveIntensity: 0.3,
                transparent: true,
                opacity: 0.8,
                dispose: jest.fn(),
            }),
            disposeMaterial: jest.fn(),
        };
    });

    describe('Performance Optimizer Integration', () => {
        it('should use performance optimizer for geometry and materials', () => {
            const mockPerformanceOptimizer = {
                getSharedGeometry: jest.fn().mockReturnValue(new THREE.BoxGeometry(0.1, 0.5, 0.5)),
                getOrCreateTrailMaterial: jest.fn().mockReturnValue({
                    color: 0x00ff00,
                    transparent: true,
                    opacity: 0.8,
                }),
            };

            renderer = new TrailStyleRenderer(
                mockScene,
                mockEmissiveMaterialSystem,
                mockPerformanceOptimizer
            );

            renderer.setTrailStyle('player', 'solid');
            const segment = renderer.createStyledTrailSegment(
                { x: 1, y: 0, z: 1 },
                0x00ff00,
                [],
                'player'
            );

            expect(mockPerformanceOptimizer.getSharedGeometry).toHaveBeenCalledWith('trailSegment');
            expect(mockPerformanceOptimizer.getOrCreateTrailMaterial).toHaveBeenCalled();
            expect(segment).toBeTruthy();
        });
    });

    describe('Material Disposal Fallbacks', () => {
        it('should handle material disposal without emissive system', () => {
            renderer = new TrailStyleRenderer(mockScene, null); // No emissive system
            renderer.setTrailStyle('player', 'solid');

            const segment = renderer.createStyledTrailSegment(
                { x: 1, y: 0, z: 1 },
                0x00ff00,
                [],
                'player'
            );

            const disposeSpy = jest.spyOn(segment.material, 'dispose');

            renderer.clearPlayerTrails('player');

            expect(disposeSpy).toHaveBeenCalled();
        });

        it('should handle material disposal in clearAllTrails without emissive system', () => {
            renderer = new TrailStyleRenderer(mockScene, null);
            renderer.setTrailStyle('player', 'solid');

            const segment = renderer.createStyledTrailSegment(
                { x: 1, y: 0, z: 1 },
                0x00ff00,
                [],
                'player'
            );

            const disposeSpy = jest.spyOn(segment.material, 'dispose');

            renderer.clearAllTrails();

            expect(disposeSpy).toHaveBeenCalled();
        });
    });

    describe('Edge Cases for shouldRenderSegment', () => {
        it('should handle config without dashPattern', () => {
            renderer = new TrailStyleRenderer(mockScene, mockEmissiveMaterialSystem);

            const customConfig = {
                renderAllSegments: false,
                segments: 'alternating',
                // No dashPattern defined
            };

            // Should fall through to default return true
            const result = renderer.shouldRenderSegment(5, customConfig);
            expect(result).toBe(true);
        });

        it('should handle config with non-alternating segments', () => {
            renderer = new TrailStyleRenderer(mockScene, mockEmissiveMaterialSystem);

            const customConfig = {
                renderAllSegments: false,
                segments: 'custom',
            };

            const result = renderer.shouldRenderSegment(5, customConfig);
            expect(result).toBe(true);
        });
    });

    describe('Additional Coverage for Material Creation', () => {
        it('should create standard material for non-emissive styles', () => {
            renderer = new TrailStyleRenderer(mockScene, mockEmissiveMaterialSystem);
            renderer.setTrailStyle('player', 'solid');

            const segment = renderer.createStyledTrailSegment(
                { x: 1, y: 0, z: 1 },
                0x00ff00,
                [],
                'player'
            );

            expect(segment.material.transparent).toBe(true);
            expect(segment.material.opacity).toBe(0.8);
        });

        it('should handle null return from getStyleConfig', () => {
            renderer = new TrailStyleRenderer(mockScene, mockEmissiveMaterialSystem);

            const config = renderer.getStyleConfig('nonexistent');
            expect(config).toBeNull();
        });
    });
});
