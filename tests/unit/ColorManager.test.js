const { ColorManager } = require('@/systems/ColorManager.js');

describe('ColorManager', () => {
    describe('assignColors', () => {
        it('should assign correct number of colors for valid AI count', () => {
            const colors2 = ColorManager.assignColors(2);
            expect(colors2).toEqual(['red', 'blue']);
            expect(colors2).toHaveLength(2);

            const colors3 = ColorManager.assignColors(3);
            expect(colors3).toEqual(['red', 'blue', 'yellow']);
            expect(colors3).toHaveLength(3);

            const colors4 = ColorManager.assignColors(4);
            expect(colors4).toEqual(['red', 'blue', 'yellow', 'purple']);
            expect(colors4).toHaveLength(4);
        });

        it('should handle single AI count', () => {
            const colors1 = ColorManager.assignColors(1);
            expect(colors1).toEqual(['red']);
            expect(colors1).toHaveLength(1);
        });

        it('should throw error for invalid AI count', () => {
            expect(() => ColorManager.assignColors(0)).toThrow('AI count must be a number between 1 and 4');
            expect(() => ColorManager.assignColors(5)).toThrow('AI count must be a number between 1 and 4');
            expect(() => ColorManager.assignColors(-1)).toThrow('AI count must be a number between 1 and 4');
            expect(() => ColorManager.assignColors('2')).toThrow('AI count must be a number between 1 and 4');
            expect(() => ColorManager.assignColors(null)).toThrow('AI count must be a number between 1 and 4');
            expect(() => ColorManager.assignColors(undefined)).toThrow('AI count must be a number between 1 and 4');
        });

        it('should return unique colors with no duplicates', () => {
            const colors = ColorManager.assignColors(4);
            const uniqueColors = [...new Set(colors)];
            expect(colors).toHaveLength(uniqueColors.length);
        });
    });

    describe('getColorHex', () => {
        it('should return correct hex values for valid colors', () => {
            expect(ColorManager.getColorHex('red')).toBe(0xff0000);
            expect(ColorManager.getColorHex('blue')).toBe(0x0000ff);
            expect(ColorManager.getColorHex('yellow')).toBe(0xffff00);
            expect(ColorManager.getColorHex('purple')).toBe(0x800080);
        });

        it('should handle case-insensitive color names', () => {
            expect(ColorManager.getColorHex('RED')).toBe(0xff0000);
            expect(ColorManager.getColorHex('Blue')).toBe(0x0000ff);
            expect(ColorManager.getColorHex('YELLOW')).toBe(0xffff00);
            expect(ColorManager.getColorHex('Purple')).toBe(0x800080);
        });

        it('should throw error for invalid color names', () => {
            expect(() => ColorManager.getColorHex('green')).toThrow('Invalid color name: green');
            expect(() => ColorManager.getColorHex('orange')).toThrow('Invalid color name: orange');
            expect(() => ColorManager.getColorHex('')).toThrow('Invalid color name: ');
            expect(() => ColorManager.getColorHex(null)).toThrow('Color name must be a string');
            expect(() => ColorManager.getColorHex(undefined)).toThrow('Color name must be a string');
            expect(() => ColorManager.getColorHex(123)).toThrow('Color name must be a string');
        });
    });

    describe('isValidColor', () => {
        it('should return true for valid colors', () => {
            expect(ColorManager.isValidColor('red')).toBe(true);
            expect(ColorManager.isValidColor('blue')).toBe(true);
            expect(ColorManager.isValidColor('yellow')).toBe(true);
            expect(ColorManager.isValidColor('purple')).toBe(true);
        });

        it('should handle case-insensitive validation', () => {
            expect(ColorManager.isValidColor('RED')).toBe(true);
            expect(ColorManager.isValidColor('Blue')).toBe(true);
            expect(ColorManager.isValidColor('YELLOW')).toBe(true);
            expect(ColorManager.isValidColor('Purple')).toBe(true);
        });

        it('should return false for invalid colors', () => {
            expect(ColorManager.isValidColor('green')).toBe(false);
            expect(ColorManager.isValidColor('orange')).toBe(false);
            expect(ColorManager.isValidColor('')).toBe(false);
            expect(ColorManager.isValidColor(null)).toBe(false);
            expect(ColorManager.isValidColor(undefined)).toBe(false);
            expect(ColorManager.isValidColor(123)).toBe(false);
        });
    });

    describe('resolveColorConflicts', () => {
        it('should resolve conflicts by removing duplicates', () => {
            const requested = ['red', 'red', 'blue', 'blue'];
            const resolved = ColorManager.resolveColorConflicts(requested, 4);
            expect(resolved).toEqual(['red', 'blue', 'yellow', 'purple']);
        });

        it('should filter out invalid colors', () => {
            const requested = ['red', 'green', 'blue', 'orange'];
            const resolved = ColorManager.resolveColorConflicts(requested, 4);
            expect(resolved).toEqual(['red', 'blue', 'yellow', 'purple']);
        });

        it('should fill remaining slots with available colors', () => {
            const requested = ['red'];
            const resolved = ColorManager.resolveColorConflicts(requested, 3);
            expect(resolved).toEqual(['red', 'blue', 'yellow']);
        });

        it('should respect max count limit', () => {
            const requested = ['red', 'blue', 'yellow', 'purple'];
            const resolved = ColorManager.resolveColorConflicts(requested, 2);
            expect(resolved).toEqual(['red', 'blue']);
            expect(resolved).toHaveLength(2);
        });

        it('should handle empty requested colors array', () => {
            const resolved = ColorManager.resolveColorConflicts([], 2);
            expect(resolved).toEqual(['red', 'blue']);
        });

        it('should throw error for invalid inputs', () => {
            expect(() => ColorManager.resolveColorConflicts('not-array', 2)).toThrow('Requested colors must be an array');
            expect(() => ColorManager.resolveColorConflicts([], 0)).toThrow('Max count must be a number between 1 and 4');
            expect(() => ColorManager.resolveColorConflicts([], 5)).toThrow('Max count must be a number between 1 and 4');
            expect(() => ColorManager.resolveColorConflicts([], 'invalid')).toThrow('Max count must be a number between 1 and 4');
        });

        it('should handle mixed case and invalid entries', () => {
            const requested = ['RED', 'invalid', 'Blue', null, 'YELLOW'];
            const resolved = ColorManager.resolveColorConflicts(requested, 4);
            expect(resolved).toEqual(['red', 'blue', 'yellow', 'purple']);
        });
    });

    describe('assignColorByIndex', () => {
        it('should assign colors by index cyclically', () => {
            expect(ColorManager.assignColorByIndex(0)).toBe('red');
            expect(ColorManager.assignColorByIndex(1)).toBe('blue');
            expect(ColorManager.assignColorByIndex(2)).toBe('yellow');
            expect(ColorManager.assignColorByIndex(3)).toBe('purple');
            expect(ColorManager.assignColorByIndex(4)).toBe('red'); // Cycles back
            expect(ColorManager.assignColorByIndex(5)).toBe('blue');
        });

        it('should respect exclude colors', () => {
            expect(ColorManager.assignColorByIndex(0, ['red'])).toBe('blue');
            expect(ColorManager.assignColorByIndex(1, ['red'])).toBe('yellow');
            expect(ColorManager.assignColorByIndex(0, ['red', 'blue'])).toBe('yellow');
        });

        it('should handle large indices with exclusions', () => {
            const excludeColors = ['red'];
            expect(ColorManager.assignColorByIndex(10, excludeColors)).toBe('yellow'); // 10 % 3 = 1, so second available color (blue, yellow, purple)
        });

        it('should throw error for invalid index', () => {
            expect(() => ColorManager.assignColorByIndex(-1)).toThrow('Index must be a non-negative number');
            expect(() => ColorManager.assignColorByIndex('0')).toThrow('Index must be a non-negative number');
            expect(() => ColorManager.assignColorByIndex(null)).toThrow('Index must be a non-negative number');
        });

        it('should throw error for invalid exclude colors', () => {
            expect(() => ColorManager.assignColorByIndex(0, 'not-array')).toThrow('Exclude colors must be an array');
        });

        it('should throw error when all colors are excluded', () => {
            const allColors = ['red', 'blue', 'yellow', 'purple'];
            expect(() => ColorManager.assignColorByIndex(0, allColors)).toThrow('No available colors after exclusions');
        });
    });

    describe('getAvailableColors', () => {
        it('should return copy of available colors', () => {
            const colors = ColorManager.getAvailableColors();
            expect(colors).toEqual(['red', 'blue', 'yellow', 'purple']);
            
            // Verify it's a copy, not reference
            colors.push('green');
            expect(ColorManager.getAvailableColors()).toEqual(['red', 'blue', 'yellow', 'purple']);
        });
    });

    describe('getColorHexMap', () => {
        it('should return copy of color hex map', () => {
            const hexMap = ColorManager.getColorHexMap();
            expect(hexMap).toEqual({
                'red': 0xff0000,
                'blue': 0x0000ff,
                'yellow': 0xffff00,
                'purple': 0x800080
            });
            
            // Verify it's a copy, not reference
            hexMap.green = 0x00ff00;
            expect(ColorManager.getColorHexMap()).toEqual({
                'red': 0xff0000,
                'blue': 0x0000ff,
                'yellow': 0xffff00,
                'purple': 0x800080
            });
        });
    });

    describe('static properties', () => {
        it('should have correct available colors', () => {
            expect(ColorManager.AVAILABLE_COLORS).toEqual(['red', 'blue', 'yellow', 'purple']);
        });

        it('should have correct color hex mapping', () => {
            expect(ColorManager.COLOR_HEX_MAP).toEqual({
                'red': 0xff0000,
                'blue': 0x0000ff,
                'yellow': 0xffff00,
                'purple': 0x800080
            });
        });
    });
});