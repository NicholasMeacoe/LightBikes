/**
 * Tests for TrailStyleRenderer
 * Verifies trail style rendering variants and integration
 */

// Mock THREE.js
global.THREE = {
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
    Color: class Color {
        constructor(color) {
            this.color = color;
        }
        setHex(hex) {
            this.color = hex;
        }
    }
};

const { TrailStyleRenderer } = require('@/rendering/TrailStyleRenderer.js');

describe('TrailStyleRenderer', () => {
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
                dispose: jest.fn()
            }),
            disposeMaterial: jest.fn()
        };
        
        renderer = new TrailStyleRenderer(mockScene, mockEmissiveMaterialSystem);
    });

    describe('Trail Style Management', () => {
        it('should set and get trail styles for players', () => {
            expect(renderer.setTrailStyle('player', 'glowing')).toBe(true);
            expect(renderer.getTrailStyle('player')).toBe('glowing');
        });

        it('should reject invalid trail styles', () => {
            expect(renderer.setTrailStyle('player', 'invalid')).toBe(false);
            expect(renderer.getTrailStyle('player')).toBe('solid'); // Default
        });

        it('should return available trail styles', () => {
            const styles = renderer.getAvailableStyles();
            expect(styles).toContain('solid');
            expect(styles).toContain('dashed');
            expect(styles).toContain('glowing');
            expect(styles).toContain('rainbow');
        });
    });

    describe('Solid Trail Rendering', () => {
        it('should create solid trail segments', () => {
            renderer.setTrailStyle('player', 'solid');
            const position = { x: 1, y: 0, z: 1 };
            const trail = [];
            
            const segment = renderer.createStyledTrailSegment(position, 0x00ff00, trail, 'player');
            
            expect(segment).toBeTruthy();
            expect(segment.position.x).toBe(1);
            expect(segment.position.z).toBe(1);
            expect(segment.userData.style).toBe('solid');
            expect(mockScene.children).toContain(segment);
        });

        it('should render all segments for solid style', () => {
            renderer.setTrailStyle('player', 'solid');
            const config = renderer.getStyleConfig('solid');
            
            expect(renderer.shouldRenderSegment(0, config)).toBe(true);
            expect(renderer.shouldRenderSegment(1, config)).toBe(true);
            expect(renderer.shouldRenderSegment(5, config)).toBe(true);
        });
    });

    describe('Dashed Trail Rendering', () => {
        it('should create dashed trail segments with alternating pattern', () => {
            renderer.setTrailStyle('player', 'dashed');
            const config = renderer.getStyleConfig('dashed');
            
            // Should render segments at indices 0, 2, 4, etc.
            expect(renderer.shouldRenderSegment(0, config)).toBe(true);
            expect(renderer.shouldRenderSegment(1, config)).toBe(false);
            expect(renderer.shouldRenderSegment(2, config)).toBe(true);
            expect(renderer.shouldRenderSegment(3, config)).toBe(false);
        });

        it('should skip segments for dashed pattern', () => {
            renderer.setTrailStyle('player', 'dashed');
            const position = { x: 1, y: 0, z: 1 };
            const trail = [{}]; // Simulate existing segment (index 1)
            
            const segment = renderer.createStyledTrailSegment(position, 0x00ff00, trail, 'player');
            
            expect(segment).toBeNull(); // Should be skipped for dashed pattern
        });
    });

    describe('Glowing Trail Rendering', () => {
        it('should create glowing trail segments with emissive materials', () => {
            renderer.setTrailStyle('player', 'glowing');
            const position = { x: 1, y: 0, z: 1 };
            const trail = [];
            
            const segment = renderer.createStyledTrailSegment(position, 0x00ff00, trail, 'player');
            
            expect(segment).toBeTruthy();
            expect(segment.userData.style).toBe('glowing');
            expect(mockEmissiveMaterialSystem.createTrailMaterial).toHaveBeenCalled();
        });

        it('should use enhanced emissive intensity for glowing style', () => {
            renderer.setTrailStyle('player', 'glowing');
            const position = { x: 1, y: 0, z: 1 };
            const trail = [];
            
            const segment = renderer.createStyledTrailSegment(position, 0x00ff00, trail, 'player');
            
            expect(segment.material.emissiveIntensity).toBe(0.5);
        });
    });

    describe('Rainbow Trail Rendering', () => {
        it('should create rainbow trail segments with color cycling', () => {
            renderer.setTrailStyle('player', 'rainbow');
            const position = { x: 1, y: 0, z: 1 };
            const trail = [];
            
            const segment = renderer.createStyledTrailSegment(position, 0x00ff00, trail, 'player');
            
            expect(segment).toBeTruthy();
            expect(segment.userData.style).toBe('rainbow');
        });

        it('should calculate different colors for different segment indices', () => {
            const color1 = renderer.calculateRainbowColor(0);
            const color2 = renderer.calculateRainbowColor(10);
            const color3 = renderer.calculateRainbowColor(20);
            
            expect(color1).not.toBe(color2);
            expect(color2).not.toBe(color3);
            expect(typeof color1).toBe('number');
        });

        it('should update rainbow colors over time', () => {
            renderer.setTrailStyle('player', 'rainbow');
            const position = { x: 1, y: 0, z: 1 };
            const trail = [];
            
            const segment = renderer.createStyledTrailSegment(position, 0x00ff00, trail, 'player');
            segment.material.color = { setHex: jest.fn() };
            
            renderer.updateRainbowTrails(0.1);
            
            expect(segment.material.color.setHex).toHaveBeenCalled();
        });
    });

    describe('Trail Cleanup', () => {
        it('should clear trails for specific player', () => {
            renderer.setTrailStyle('player', 'solid');
            const position = { x: 1, y: 0, z: 1 };
            const trail = [];
            
            const segment = renderer.createStyledTrailSegment(position, 0x00ff00, trail, 'player');
            expect(mockScene.children).toContain(segment);
            
            renderer.clearPlayerTrails('player');
            expect(mockScene.children).not.toContain(segment);
        });

        it('should clear all trails', () => {
            renderer.setTrailStyle('player', 'solid');
            renderer.setTrailStyle('ai_1', 'glowing');
            
            const segment1 = renderer.createStyledTrailSegment({ x: 1, y: 0, z: 1 }, 0x00ff00, [], 'player');
            const segment2 = renderer.createStyledTrailSegment({ x: 2, y: 0, z: 2 }, 0xff0000, [], 'ai_1');
            
            expect(mockScene.children.length).toBe(2);
            
            renderer.clearAllTrails();
            expect(mockScene.children.length).toBe(0);
        });

        it('should dispose materials when clearing trails', () => {
            renderer.setTrailStyle('player', 'glowing');
            const segment = renderer.createStyledTrailSegment({ x: 1, y: 0, z: 1 }, 0x00ff00, [], 'player');
            
            renderer.clearPlayerTrails('player');
            
            expect(mockEmissiveMaterialSystem.disposeMaterial).toHaveBeenCalled();
        });
    });

    describe('Style Configuration', () => {
        it('should validate trail style names', () => {
            expect(renderer.isValidStyle('solid')).toBe(true);
            expect(renderer.isValidStyle('dashed')).toBe(true);
            expect(renderer.isValidStyle('glowing')).toBe(true);
            expect(renderer.isValidStyle('rainbow')).toBe(true);
            expect(renderer.isValidStyle('invalid')).toBe(false);
        });

        it('should return style configurations', () => {
            const solidConfig = renderer.getStyleConfig('solid');
            expect(solidConfig).toBeTruthy();
            expect(solidConfig.opacity).toBe(0.8);
            expect(solidConfig.renderAllSegments).toBe(true);
            
            const dashedConfig = renderer.getStyleConfig('dashed');
            expect(dashedConfig.segments).toBe('alternating');
            expect(dashedConfig.renderAllSegments).toBe(false);
        });
    });

    describe('Effect Updates', () => {
        it('should update trail effects with delta time', () => {
            const updateRainbowSpy = jest.spyOn(renderer, 'updateRainbowTrails');
            
            renderer.updateTrailEffects(0.016);
            
            expect(updateRainbowSpy).toHaveBeenCalledWith(0.016);
        });
    });
});