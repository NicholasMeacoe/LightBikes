/**
 * ColorManager - Utility class for managing AI opponent colors
 * Handles unique color assignment, validation, and conflict resolution
 */
class ColorManager {
    /**
     * Available colors for AI opponents
     * @static
     * @readonly
     */
    static AVAILABLE_COLORS = ['red', 'blue', 'yellow', 'purple'];

    /**
     * Color to hex mapping for rendering
     * @static
     * @readonly
     */
    static COLOR_HEX_MAP = {
        'red': 0xff0000,
        'blue': 0x0000ff,
        'yellow': 0xffff00,
        'purple': 0x800080
    };

    /**
     * Assign unique colors to AI opponents based on count
     * Ensures no duplicate colors are assigned
     * @param {number} aiCount - Number of AI opponents (2-4)
     * @returns {string[]} Array of unique color names
     * @throws {Error} If aiCount is invalid
     */
    static assignColors(aiCount) {
        // Validate AI count
        if (typeof aiCount !== 'number' || aiCount < 1 || aiCount > 4) {
            throw new Error('AI count must be a number between 1 and 4');
        }

        // Return slice of available colors based on count
        return this.AVAILABLE_COLORS.slice(0, aiCount);
    }

    /**
     * Get hex color value for a color name
     * @param {string} colorName - Color name (red, blue, yellow, purple)
     * @returns {number} Hex color value
     * @throws {Error} If color name is invalid
     */
    static getColorHex(colorName) {
        if (typeof colorName !== 'string') {
            throw new Error('Color name must be a string');
        }

        const normalizedColor = colorName.toLowerCase();
        if (!this.COLOR_HEX_MAP.hasOwnProperty(normalizedColor)) {
            throw new Error(`Invalid color name: ${colorName}. Available colors: ${this.AVAILABLE_COLORS.join(', ')}`);
        }

        return this.COLOR_HEX_MAP[normalizedColor];
    }

    /**
     * Validate if a color name is valid
     * @param {string} colorName - Color name to validate
     * @returns {boolean} True if color is valid
     */
    static isValidColor(colorName) {
        if (typeof colorName !== 'string') {
            return false;
        }

        return this.AVAILABLE_COLORS.includes(colorName.toLowerCase());
    }

    /**
     * Resolve color conflicts by ensuring unique assignment
     * @param {string[]} requestedColors - Array of requested colors
     * @param {number} maxCount - Maximum number of colors needed
     * @returns {string[]} Array of unique, valid colors
     */
    static resolveColorConflicts(requestedColors, maxCount = 4) {
        if (!Array.isArray(requestedColors)) {
            throw new Error('Requested colors must be an array');
        }

        if (typeof maxCount !== 'number' || maxCount < 1 || maxCount > 4) {
            throw new Error('Max count must be a number between 1 and 4');
        }

        const resolvedColors = [];
        const usedColors = new Set();

        // First pass: add valid, unique colors from requested list
        for (const color of requestedColors) {
            if (resolvedColors.length >= maxCount) break;
            
            const normalizedColor = typeof color === 'string' ? color.toLowerCase() : '';
            
            if (this.isValidColor(normalizedColor) && !usedColors.has(normalizedColor)) {
                resolvedColors.push(normalizedColor);
                usedColors.add(normalizedColor);
            }
        }

        // Second pass: fill remaining slots with available colors
        for (const color of this.AVAILABLE_COLORS) {
            if (resolvedColors.length >= maxCount) break;
            
            if (!usedColors.has(color)) {
                resolvedColors.push(color);
                usedColors.add(color);
            }
        }

        return resolvedColors;
    }

    /**
     * Get all available colors
     * @returns {string[]} Array of all available color names
     */
    static getAvailableColors() {
        return [...this.AVAILABLE_COLORS];
    }

    /**
     * Get color hex map
     * @returns {Object} Object mapping color names to hex values
     */
    static getColorHexMap() {
        return { ...this.COLOR_HEX_MAP };
    }

    /**
     * Assign color to specific AI by index
     * @param {number} index - AI index (0-based)
     * @param {string[]} [excludeColors] - Colors to exclude from assignment
     * @returns {string} Assigned color name
     * @throws {Error} If index is invalid
     */
    static assignColorByIndex(index, excludeColors = []) {
        if (typeof index !== 'number' || index < 0) {
            throw new Error('Index must be a non-negative number');
        }

        if (!Array.isArray(excludeColors)) {
            throw new Error('Exclude colors must be an array');
        }

        // Filter available colors by exclusions
        const availableColors = this.AVAILABLE_COLORS.filter(color => 
            !excludeColors.includes(color)
        );

        if (availableColors.length === 0) {
            throw new Error('No available colors after exclusions');
        }

        // Use modulo to cycle through available colors
        return availableColors[index % availableColors.length];
    }
}

module.exports = { ColorManager };