const { PositionManager } = require('@/multiplayer/PositionManager.js');

describe('PositionManager', () => {
    describe('calculateStartingPositions', () => {
        it('should return single legacy position for 1 AI', () => {
            const positions = PositionManager.calculateStartingPositions(1);
            expect(positions).toHaveLength(1);
            expect(positions[0]).toEqual({
                x: 0,
                y: 0,
                z: -10,
                direction: { x: 1, y: 0, z: 0 }
            });
        });

        it('should distribute 2 AIs evenly around perimeter', () => {
            const positions = PositionManager.calculateStartingPositions(2, 30);
            expect(positions).toHaveLength(2);
            
            // Check that positions are different (at least one coordinate should differ)
            const pos1 = positions[0];
            const pos2 = positions[1];
            expect(pos1.x !== pos2.x || pos1.z !== pos2.z).toBe(true);
            
            // Check that all positions have valid directions
            positions.forEach(pos => {
                expect(pos.direction).toHaveProperty('x');
                expect(pos.direction).toHaveProperty('y');
                expect(pos.direction).toHaveProperty('z');
                expect(pos.direction.y).toBe(0);
                expect(Math.abs(pos.direction.x) + Math.abs(pos.direction.z)).toBe(1);
            });
        });

        it('should distribute 3 AIs evenly around perimeter', () => {
            const positions = PositionManager.calculateStartingPositions(3, 30);
            expect(positions).toHaveLength(3);
            
            // Check that all positions are different
            const uniquePositions = new Set(positions.map(p => `${p.x},${p.z}`));
            expect(uniquePositions.size).toBe(3);
        });

        it('should distribute 4 AIs evenly around perimeter', () => {
            const positions = PositionManager.calculateStartingPositions(4, 30);
            expect(positions).toHaveLength(4);
            
            // Check that all positions are different
            const uniquePositions = new Set(positions.map(p => `${p.x},${p.z}`));
            expect(uniquePositions.size).toBe(4);
            
            // Check that positions form roughly a square pattern
            const xValues = positions.map(p => p.x).sort();
            const zValues = positions.map(p => p.z).sort();
            expect(xValues[0]).toBeLessThan(xValues[3]);
            expect(zValues[0]).toBeLessThan(zValues[3]);
        });

        it('should work with different arena sizes', () => {
            const positions20 = PositionManager.calculateStartingPositions(2, 20);
            const positions40 = PositionManager.calculateStartingPositions(2, 40);
            
            expect(positions20).toHaveLength(2);
            expect(positions40).toHaveLength(2);
            
            // Larger arena should have positions further from center
            const distance20 = Math.sqrt(positions20[0].x ** 2 + positions20[0].z ** 2);
            const distance40 = Math.sqrt(positions40[0].x ** 2 + positions40[0].z ** 2);
            expect(distance40).toBeGreaterThan(distance20);
        });

        it('should throw error for invalid AI count', () => {
            expect(() => PositionManager.calculateStartingPositions(0)).toThrow('AI count must be a number between 1 and 4');
            expect(() => PositionManager.calculateStartingPositions(5)).toThrow('AI count must be a number between 1 and 4');
            expect(() => PositionManager.calculateStartingPositions(-1)).toThrow('AI count must be a number between 1 and 4');
            expect(() => PositionManager.calculateStartingPositions('2')).toThrow('AI count must be a number between 1 and 4');
            expect(() => PositionManager.calculateStartingPositions(null)).toThrow('AI count must be a number between 1 and 4');
        });

        it('should throw error for invalid arena size', () => {
            expect(() => PositionManager.calculateStartingPositions(2, 5)).toThrow('Arena size must be a number between 10 and 100');
            expect(() => PositionManager.calculateStartingPositions(2, 101)).toThrow('Arena size must be a number between 10 and 100');
            expect(() => PositionManager.calculateStartingPositions(2, 'invalid')).toThrow('Arena size must be a number between 10 and 100');
            expect(() => PositionManager.calculateStartingPositions(2, null)).toThrow('Arena size must be a number between 10 and 100');
        });

        it('should ensure all positions are within arena bounds', () => {
            const arenaSize = 30;
            const positions = PositionManager.calculateStartingPositions(4, arenaSize);
            const halfSize = arenaSize / 2;
            
            positions.forEach(pos => {
                expect(pos.x).toBeGreaterThanOrEqual(-halfSize);
                expect(pos.x).toBeLessThanOrEqual(halfSize);
                expect(pos.z).toBeGreaterThanOrEqual(-halfSize);
                expect(pos.z).toBeLessThanOrEqual(halfSize);
                expect(pos.y).toBe(0);
            });
        });
    });

    describe('getInitialDirection', () => {
        it('should return valid cardinal directions', () => {
            const angles = [0, Math.PI/2, Math.PI, 3*Math.PI/2];
            
            angles.forEach(angle => {
                const direction = PositionManager.getInitialDirection(angle);
                expect(direction).toHaveProperty('x');
                expect(direction).toHaveProperty('y');
                expect(direction).toHaveProperty('z');
                expect(direction.y).toBe(0);
                expect(Math.abs(direction.x) + Math.abs(direction.z)).toBe(1);
                expect([direction.x, direction.z]).toContain(0); // One axis should be 0
            });
        });

        it('should point toward center (opposite of position)', () => {
            // Test specific angles
            const direction0 = PositionManager.getInitialDirection(0); // Right side
            const directionPi = PositionManager.getInitialDirection(Math.PI); // Left side
            
            // Directions should be different (pointing toward center from opposite sides)
            expect(direction0.x !== directionPi.x || direction0.z !== directionPi.z).toBe(true);
            
            // Both should be valid cardinal directions
            expect(Math.abs(direction0.x) + Math.abs(direction0.z)).toBe(1);
            expect(Math.abs(directionPi.x) + Math.abs(directionPi.z)).toBe(1);
        });

        it('should throw error for invalid angles', () => {
            expect(() => PositionManager.getInitialDirection('invalid')).toThrow('Angle must be a finite number');
            expect(() => PositionManager.getInitialDirection(null)).toThrow('Angle must be a finite number');
            expect(() => PositionManager.getInitialDirection(undefined)).toThrow('Angle must be a finite number');
            expect(() => PositionManager.getInitialDirection(Infinity)).toThrow('Angle must be a finite number');
            expect(() => PositionManager.getInitialDirection(NaN)).toThrow('Angle must be a finite number');
        });

        it('should handle negative angles', () => {
            const direction = PositionManager.getInitialDirection(-Math.PI/2);
            expect(direction).toHaveProperty('x');
            expect(direction).toHaveProperty('y');
            expect(direction).toHaveProperty('z');
            expect(Math.abs(direction.x) + Math.abs(direction.z)).toBe(1);
        });

        it('should handle large angles (multiple rotations)', () => {
            const direction1 = PositionManager.getInitialDirection(0);
            const direction2 = PositionManager.getInitialDirection(2 * Math.PI); // Full rotation
            const direction3 = PositionManager.getInitialDirection(4 * Math.PI); // Two full rotations
            
            // Should be equivalent due to circular nature
            expect(direction1.x).toBe(direction2.x);
            expect(direction1.z).toBe(direction2.z);
            expect(direction1.x).toBe(direction3.x);
            expect(direction1.z).toBe(direction3.z);
        });
    });

    describe('calculateSafeStartingPositions', () => {
        it('should return positions with minimum distance', () => {
            const positions = PositionManager.calculateSafeStartingPositions(2, 30, 5);
            expect(positions).toHaveLength(2);
            
            const distance = Math.sqrt(
                (positions[0].x - positions[1].x) ** 2 + 
                (positions[0].z - positions[1].z) ** 2
            );
            expect(distance).toBeGreaterThanOrEqual(5);
        });

        it('should adjust positions when too close', () => {
            // Use small arena and large minimum distance to force adjustment
            const positions = PositionManager.calculateSafeStartingPositions(4, 20, 8);
            expect(positions).toHaveLength(4);
            
            // Check all pairs maintain minimum distance
            for (let i = 0; i < positions.length; i++) {
                for (let j = i + 1; j < positions.length; j++) {
                    const distance = Math.sqrt(
                        (positions[i].x - positions[j].x) ** 2 + 
                        (positions[i].z - positions[j].z) ** 2
                    );
                    expect(distance).toBeGreaterThanOrEqual(7.9); // Allow small floating point tolerance
                }
            }
        });

        it('should throw error for invalid minimum distance', () => {
            expect(() => PositionManager.calculateSafeStartingPositions(2, 30, 0)).toThrow('Minimum distance must be a positive number');
            expect(() => PositionManager.calculateSafeStartingPositions(2, 30, -1)).toThrow('Minimum distance must be a positive number');
            expect(() => PositionManager.calculateSafeStartingPositions(2, 30, 'invalid')).toThrow('Minimum distance must be a positive number');
        });

        it('should keep positions within arena bounds after adjustment', () => {
            const arenaSize = 30;
            const positions = PositionManager.calculateSafeStartingPositions(4, arenaSize, 10);
            const halfSize = arenaSize / 2;
            
            positions.forEach(pos => {
                expect(pos.x).toBeGreaterThanOrEqual(-halfSize);
                expect(pos.x).toBeLessThanOrEqual(halfSize);
                expect(pos.z).toBeGreaterThanOrEqual(-halfSize);
                expect(pos.z).toBeLessThanOrEqual(halfSize);
            });
        });
    });

    describe('getPlayerStartingPosition', () => {
        it('should return center position', () => {
            const position = PositionManager.getPlayerStartingPosition();
            expect(position).toEqual({
                x: 0,
                y: 0,
                z: 0,
                direction: { x: 1, y: 0, z: 0 }
            });
        });

        it('should return same position regardless of arena size', () => {
            const pos1 = PositionManager.getPlayerStartingPosition(20);
            const pos2 = PositionManager.getPlayerStartingPosition(40);
            expect(pos1).toEqual(pos2);
        });
    });

    describe('isValidPosition', () => {
        it('should validate positions within bounds', () => {
            const arenaSize = 30;
            expect(PositionManager.isValidPosition({ x: 0, z: 0 }, arenaSize)).toBe(true);
            expect(PositionManager.isValidPosition({ x: 14, z: 14 }, arenaSize)).toBe(true);
            expect(PositionManager.isValidPosition({ x: -14, z: -14 }, arenaSize)).toBe(true);
            expect(PositionManager.isValidPosition({ x: 15, z: 15 }, arenaSize)).toBe(true);
        });

        it('should reject positions outside bounds', () => {
            const arenaSize = 30;
            expect(PositionManager.isValidPosition({ x: 16, z: 0 }, arenaSize)).toBe(false);
            expect(PositionManager.isValidPosition({ x: 0, z: 16 }, arenaSize)).toBe(false);
            expect(PositionManager.isValidPosition({ x: -16, z: 0 }, arenaSize)).toBe(false);
            expect(PositionManager.isValidPosition({ x: 0, z: -16 }, arenaSize)).toBe(false);
        });

        it('should reject invalid position objects', () => {
            expect(PositionManager.isValidPosition(null, 30)).toBe(false);
            expect(PositionManager.isValidPosition(undefined, 30)).toBe(false);
            expect(PositionManager.isValidPosition({}, 30)).toBe(false);
            expect(PositionManager.isValidPosition({ x: 'invalid', z: 0 }, 30)).toBe(false);
            expect(PositionManager.isValidPosition({ x: 0, z: 'invalid' }, 30)).toBe(false);
            expect(PositionManager.isValidPosition({ x: 0 }, 30)).toBe(false); // Missing z
            expect(PositionManager.isValidPosition({ z: 0 }, 30)).toBe(false); // Missing x
        });
    });

    describe('getCornerPositions', () => {
        it('should return 4 corner positions', () => {
            const corners = PositionManager.getCornerPositions(30);
            expect(corners).toHaveLength(4);
            
            // Check that all corners are different
            const uniquePositions = new Set(corners.map(p => `${p.x},${p.z}`));
            expect(uniquePositions.size).toBe(4);
        });

        it('should place corners near arena boundaries', () => {
            const arenaSize = 30;
            const corners = PositionManager.getCornerPositions(arenaSize);
            const expectedDistance = (arenaSize / 2) - 1; // 1 unit margin
            
            corners.forEach(corner => {
                expect(Math.abs(corner.x)).toBe(expectedDistance);
                expect(Math.abs(corner.z)).toBe(expectedDistance);
                expect(corner.y).toBe(0);
            });
        });

        it('should assign valid directions to corners', () => {
            const corners = PositionManager.getCornerPositions(30);
            
            corners.forEach(corner => {
                expect(corner.direction).toHaveProperty('x');
                expect(corner.direction).toHaveProperty('y');
                expect(corner.direction).toHaveProperty('z');
                expect(corner.direction.y).toBe(0);
                expect(Math.abs(corner.direction.x) + Math.abs(corner.direction.z)).toBe(1);
            });
        });

        it('should scale with arena size', () => {
            const corners20 = PositionManager.getCornerPositions(20);
            const corners40 = PositionManager.getCornerPositions(40);
            
            expect(Math.abs(corners20[0].x)).toBeLessThan(Math.abs(corners40[0].x));
            expect(Math.abs(corners20[0].z)).toBeLessThan(Math.abs(corners40[0].z));
        });
    });

    describe('static properties', () => {
        it('should have correct default arena size', () => {
            expect(PositionManager.DEFAULT_ARENA_SIZE).toBe(30);
        });
    });

    describe('edge cases and integration', () => {
        it('should handle minimum arena size', () => {
            const positions = PositionManager.calculateStartingPositions(2, 10);
            expect(positions).toHaveLength(2);
            
            positions.forEach(pos => {
                expect(PositionManager.isValidPosition(pos, 10)).toBe(true);
            });
        });

        it('should handle maximum arena size', () => {
            const positions = PositionManager.calculateStartingPositions(2, 100);
            expect(positions).toHaveLength(2);
            
            positions.forEach(pos => {
                expect(PositionManager.isValidPosition(pos, 100)).toBe(true);
            });
        });

        it('should maintain consistency between methods', () => {
            const positions = PositionManager.calculateStartingPositions(3, 30);
            
            positions.forEach(pos => {
                expect(PositionManager.isValidPosition(pos, 30)).toBe(true);
                expect(pos.direction).toHaveProperty('x');
                expect(pos.direction).toHaveProperty('y');
                expect(pos.direction).toHaveProperty('z');
            });
        });
    });
});