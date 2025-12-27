/**
 * Integration tests for trail styles and collision detection
 * Verifies that trail style changes don't affect collision detection accuracy
 */

// Mock THREE.js
const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
};

const MockLoggerClass = jest.fn().mockImplementation(() => mockLogger);
MockLoggerClass.create = jest.fn((namespace) => mockLogger);

jest.mock('@/utils/Logger.js', () => ({
    Logger: MockLoggerClass,
    logger: mockLogger,
    createLogger: jest.fn(() => mockLogger),
}));

global.THREE = {
    MeshBasicMaterial: jest.fn().mockImplementation(() => ({})),
    SphereGeometry: jest.fn().mockImplementation(() => ({})),
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
};

const { TrailStyleRenderer } = require('@/rendering/TrailStyleRenderer.js');
const { CollisionDetectionEngine } = require('@/core/collision.js');

describe('Trail Style and Collision Detection Integration', () => {
    let trailStyleRenderer;
    let collisionEngine;
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

        trailStyleRenderer = new TrailStyleRenderer(mockScene, mockEmissiveMaterialSystem);
        collisionEngine = new CollisionDetectionEngine();
    });

    describe('Collision Detection Independence', () => {
        it('should not be affected by trail style changes', () => {
            // Test that trail style changes don't affect collision detection logic
            // The key insight is that collision detection uses game state data, not visual rendering
            const bike = { x: 1, y: 0, z: 1 };
            const ownTrail = [
                { x: 0, y: 0, z: 0 },
                { x: 0.1, y: 0, z: 0 },
                { x: 0.2, y: 0, z: 0 },
                { x: 0.3, y: 0, z: 0 },
                { x: 0.4, y: 0, z: 0 },
                { x: 0.5, y: 0, z: 0 },
                { x: 0.6, y: 0, z: 0 },
                { x: 0.7, y: 0, z: 0 },
                { x: 1, y: 0, z: 1 }, // Exact collision point
            ];
            const opponentTrail = [];
            const bounds = 30;

            // Test collision detection with different trail styles
            const styles = ['solid', 'dashed', 'glowing', 'rainbow'];
            const results = [];

            styles.forEach((style) => {
                trailStyleRenderer.setTrailStyle('player', style);

                // Test the core collision detection method directly
                const collided = collisionEngine.isCollidedWithPowerUps(
                    'player',
                    bike,
                    ownTrail,
                    opponentTrail,
                    bounds
                );
                results.push(collided);
            });

            // All results should be the same regardless of trail style
            const firstResult = results[0];
            results.forEach((result, index) => {
                expect(result).toBe(firstResult); // All should be consistent
            });
        });

        it('should maintain collision boundaries regardless of visual style', () => {
            const gameState = {
                frameCount: 15,
                isPaused: false,
                player: { x: 30, y: 0, z: 0 }, // At boundary
                ai: { x: 5, y: 0, z: 5 },
                playerTrail: [],
                aiTrail: [],
                bounds: 30,
            };

            const styles = ['solid', 'dashed', 'glowing', 'rainbow'];

            styles.forEach((style) => {
                trailStyleRenderer.setTrailStyle('player', style);

                const result = collisionEngine.checkCollisions(gameState);

                // Boundary collision should be detected regardless of trail style
                expect(result.playerCollided).toBe(true);
                expect(result.aiCollided).toBe(false);
            });
        });

        it('should use all trail data regardless of visual style', () => {
            // Even though dashed trails skip visual segments, collision detection
            // should still work with all trail positions from game state
            const bike = { x: 1, y: 0, z: 0 };
            const solidTrail = [
                { x: 0, y: 0, z: 0 },
                { x: 0.1, y: 0, z: 0 },
                { x: 0.2, y: 0, z: 0 },
                { x: 0.3, y: 0, z: 0 },
                { x: 0.4, y: 0, z: 0 },
                { x: 0.5, y: 0, z: 0 },
                { x: 0.6, y: 0, z: 0 },
                { x: 0.7, y: 0, z: 0 },
                { x: 1, y: 0, z: 0 }, // This would be skipped visually in dashed style but still used for collision
            ];
            const bounds = 30;

            // Test with solid style
            trailStyleRenderer.setTrailStyle('player', 'solid');
            const solidResult = collisionEngine.isCollidedWithPowerUps(
                'player',
                bike,
                solidTrail,
                [],
                bounds
            );

            // Test with dashed style (same trail data)
            trailStyleRenderer.setTrailStyle('player', 'dashed');
            const dashedResult = collisionEngine.isCollidedWithPowerUps(
                'player',
                bike,
                solidTrail,
                [],
                bounds
            );

            // Results should be identical because collision detection uses the same trail data
            expect(dashedResult).toBe(solidResult);
        });
    });

    describe('Trail Style Visual vs Collision Separation', () => {
        it('should create different visual representations while maintaining same collision data', () => {
            const position = { x: 1, y: 0, z: 1 };
            const trail = [];

            // Test solid trail
            trailStyleRenderer.setTrailStyle('player', 'solid');
            const solidSegment = trailStyleRenderer.createStyledTrailSegment(
                position,
                0x00ff00,
                trail,
                'player'
            );

            // Test glowing trail
            trailStyleRenderer.setTrailStyle('player', 'glowing');
            const glowingSegment = trailStyleRenderer.createStyledTrailSegment(
                position,
                0x00ff00,
                [],
                'player'
            );

            // Both should have same position data for collision detection
            expect(solidSegment.position.x).toBe(glowingSegment.position.x);
            expect(solidSegment.position.z).toBe(glowingSegment.position.z);

            // But different visual properties
            expect(solidSegment.userData.style).toBe('solid');
            expect(glowingSegment.userData.style).toBe('glowing');
        });

        it('should not be affected by visual effects like rainbow color changes', () => {
            const bike = { x: 1, y: 0, z: 1 };
            const ownTrail = [
                { x: 0, y: 0, z: 0 },
                { x: 0.1, y: 0, z: 0.1 },
                { x: 0.2, y: 0, z: 0.2 },
                { x: 0.3, y: 0, z: 0.3 },
                { x: 0.4, y: 0, z: 0.4 },
                { x: 0.5, y: 0, z: 0.5 },
                { x: 0.6, y: 0, z: 0.6 },
                { x: 0.7, y: 0, z: 0.7 },
                { x: 1, y: 0, z: 1 }, // Collision point
            ];
            const bounds = 30;

            trailStyleRenderer.setTrailStyle('player', 'rainbow');

            // Test collision detection before visual update
            const resultBefore = collisionEngine.isCollidedWithPowerUps(
                'player',
                bike,
                ownTrail,
                [],
                bounds
            );

            // Update rainbow colors (visual change only)
            trailStyleRenderer.updateRainbowTrails(0.1);

            // Test collision detection after visual update
            const resultAfter = collisionEngine.isCollidedWithPowerUps(
                'player',
                bike,
                ownTrail,
                [],
                bounds
            );

            // Results should be identical because visual changes don't affect collision logic
            expect(resultAfter).toBe(resultBefore);
        });
    });

    describe('Multi-AI Trail Style Integration', () => {
        it('should handle collision detection with multiple AI trail styles', () => {
            const gameState = {
                frameCount: 15,
                isPaused: false,
                player: { x: 1, y: 0, z: 1 },
                playerTrail: [],
                aiOpponents: [
                    {
                        id: 'ai_1',
                        x: 5,
                        y: 0,
                        z: 5,
                        alive: true,
                        trail: [
                            { x: 1, y: 0, z: 1 }, // Collision point with player
                        ],
                    },
                    {
                        id: 'ai_2',
                        x: 10,
                        y: 0,
                        z: 10,
                        alive: true,
                        trail: [],
                    },
                ],
                bounds: 30,
            };

            // Set different trail styles for different AIs
            trailStyleRenderer.setTrailStyle('ai_1', 'glowing');
            trailStyleRenderer.setTrailStyle('ai_2', 'rainbow');
            trailStyleRenderer.setTrailStyle('player', 'dashed');

            const result = collisionEngine.checkCollisions(gameState);

            // Should detect collision regardless of different trail styles
            expect(result.playerCollided).toBe(true);
            expect(result.crashedEntities).toContain('player');
        });
    });

    describe('Collision Accuracy Validation', () => {
        it('should maintain collision tolerance regardless of trail style', () => {
            const bike = { x: 1.05, y: 0, z: 1.05 }; // Just within collision tolerance
            const trail = [{ x: 1, y: 0, z: 1 }];
            const bounds = 30;

            const styles = ['solid', 'dashed', 'glowing', 'rainbow'];

            styles.forEach((style) => {
                trailStyleRenderer.setTrailStyle('player', style);

                const validation = collisionEngine.validateCollisionAccuracy(bike, trail, bounds);

                // Validation should be consistent regardless of style
                expect(validation.collisionTolerance).toBe(0.1);
                expect(validation.bikeWithinBounds).toBe(true);
                expect(validation.validTrailSegments).toBe(1);
            });
        });

        it('should handle edge cases consistently across trail styles', () => {
            const bike = { x: 29.95, y: 0, z: 0 }; // Near boundary
            const trail = [];
            const bounds = 30;

            const styles = ['solid', 'dashed', 'glowing', 'rainbow'];

            styles.forEach((style) => {
                trailStyleRenderer.setTrailStyle('player', style);

                const boundaryCollision = collisionEngine.checkBoundaryCollision(bike, bounds);

                // Boundary collision detection should be consistent
                expect(boundaryCollision).toBe(false); // Still within bounds
            });
        });
    });

    describe('Performance Impact', () => {
        it('should not significantly impact collision detection performance', () => {
            const gameState = {
                frameCount: 15,
                isPaused: false,
                player: { x: 15, y: 0, z: 15 },
                ai: { x: 5, y: 0, z: 5 },
                playerTrail: Array.from({ length: 100 }, (_, i) => ({ x: i * 0.1, y: 0, z: 0 })),
                aiTrail: Array.from({ length: 100 }, (_, i) => ({ x: 0, y: 0, z: i * 0.1 })),
                bounds: 30,
            };

            const styles = ['solid', 'dashed', 'glowing', 'rainbow'];
            const timings = [];

            styles.forEach((style) => {
                trailStyleRenderer.setTrailStyle('player', style);

                const startTime = performance.now();
                collisionEngine.checkCollisions(gameState);
                const endTime = performance.now();

                timings.push(endTime - startTime);
            });

            // All collision detection times should be similar (within reasonable variance)
            const avgTime = timings.reduce((a, b) => a + b) / timings.length;
            timings.forEach((time) => {
                expect(Math.abs(time - avgTime)).toBeLessThan(avgTime * 3.0); // Within 300% variance (more lenient for CI)
            });
        });
    });
});
