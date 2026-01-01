/**
 * Tests for ThemeEngine
 */

describe('ThemeEngine', () => {
    let ThemeEngine;
    let themeEngine;
    let mockScene;

    beforeEach(() => {
        jest.resetModules();
        ThemeEngine = require('@/systems/ThemeEngine.js').ThemeEngine;

        mockScene = {
            add: jest.fn(),
            remove: jest.fn(),
            background: null,
            children: [],
            traverse: jest.fn(),
        };

        themeEngine = new ThemeEngine(mockScene);
        jest.clearAllMocks();
    });

    it('should initialize with default theme', () => {
        expect(themeEngine.getCurrentTheme()).toBe('classic-grid');
    });

    it('should validate themes correctly', () => {
        expect(themeEngine.isValidTheme('classic-grid')).toBe(true);
        expect(themeEngine.isValidTheme('space')).toBe(true);
        expect(themeEngine.isValidTheme('neon-city')).toBe(true);
        expect(themeEngine.isValidTheme('invalid')).toBe(false);
    });

    it('should get available themes', () => {
        const themes = themeEngine.getAvailableThemes();
        expect(themes).toContain('classic-grid');
        expect(themes).toContain('space');
        expect(themes).toContain('neon-city');
    });

    it('should get theme config', () => {
        const config = themeEngine.getThemeConfig('classic-grid');
        expect(config).toBeDefined();
        expect(config.name).toBe('Classic Grid');
    });
});
