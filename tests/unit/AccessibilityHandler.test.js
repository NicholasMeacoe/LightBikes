/**
 * Tests for AccessibilityHandler class
 */

const { AccessibilityHandler } = require('@/utils/AccessibilityHandler.js');

describe('AccessibilityHandler', () => {
    let accessibilityHandler;
    let mockMediaQueryList;
    let matchMediaSpy;

    const createMockMQL = (matches = false) => {
        const listeners = new Set();
        return {
            matches,
            media: '(prefers-reduced-motion: reduce)',
            addEventListener: jest.fn((event, listener) => {
                if (event === 'change') listeners.add(listener);
            }),
            removeEventListener: jest.fn((event, listener) => {
                if (event === 'change') listeners.delete(listener);
            }),
            addListener: jest.fn((listener) => listeners.add(listener)),
            removeListener: jest.fn((listener) => listeners.delete(listener)),
            dispatchEvent: jest.fn((event) => {
                listeners.forEach((l) => l(event));
                return true;
            }),
        };
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockMediaQueryList = createMockMQL(false);
        matchMediaSpy = jest.spyOn(window, 'matchMedia').mockReturnValue(mockMediaQueryList);
        accessibilityHandler = new AccessibilityHandler();
    });

    afterEach(() => {
        if (accessibilityHandler) accessibilityHandler.destroy();
        matchMediaSpy.mockRestore();
    });

    it('should initialize with system preference detection', () => {
        expect(matchMediaSpy).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
        expect(accessibilityHandler.getSystemPreference()).toBe(false);
    });

    it('should detect system preference changes', () => {
        const listener = jest.fn();
        accessibilityHandler.addChangeListener(listener);

        mockMediaQueryList.matches = true;
        mockMediaQueryList.dispatchEvent({ type: 'change', matches: true });

        expect(accessibilityHandler.getSystemPreference()).toBe(true);
        expect(listener).toHaveBeenCalled();
    });

    it('should prioritize user override over system preference', () => {
        mockMediaQueryList.matches = true;
        mockMediaQueryList.dispatchEvent({ type: 'change', matches: true });

        accessibilityHandler.setUserOverride(false);
        expect(accessibilityHandler.shouldDisableEffects()).toBe(false);

        accessibilityHandler.setUserOverride(true);
        expect(accessibilityHandler.shouldDisableEffects()).toBe(true);
    });

    it('should fall back to system preference when no user override', () => {
        accessibilityHandler.setUserOverride(null);

        mockMediaQueryList.matches = true;
        mockMediaQueryList.dispatchEvent({ type: 'change', matches: true });
        expect(accessibilityHandler.shouldDisableEffects()).toBe(true);

        mockMediaQueryList.matches = false;
        mockMediaQueryList.dispatchEvent({ type: 'change', matches: false });
        expect(accessibilityHandler.shouldDisableEffects()).toBe(false);
    });

    it('should return comprehensive status information', () => {
        accessibilityHandler.setUserOverride(true);
        const status = accessibilityHandler.getAccessibilityStatus();
        expect(status.effectsDisabled).toBe(true);
        expect(status.source).toBe('user');
    });

    it('should override effect settings when effects should be disabled', () => {
        accessibilityHandler.setUserOverride(true);
        const settings = { shakeEnabled: true, motionBlurEnabled: true };
        const result = accessibilityHandler.applyAccessibilityOverrides(settings);
        expect(result.shakeEnabled).toBe(false);
        expect(result.motionBlurEnabled).toBe(false);
        expect(result._accessibilityOverride).toBe(true);
    });

    it('should provide user-friendly descriptions', () => {
        accessibilityHandler.setUserOverride(true);
        expect(accessibilityHandler.getAccessibilityDescription()).toContain('disabled by user');

        accessibilityHandler.setUserOverride(null);
        mockMediaQueryList.matches = true;
        mockMediaQueryList.dispatchEvent({ type: 'change', matches: true });
        expect(accessibilityHandler.getAccessibilityDescription()).toContain('disabled by system');
    });

    it('should cleanup event listeners on destroy', () => {
        accessibilityHandler.destroy();
        expect(mockMediaQueryList.removeEventListener).toHaveBeenCalled();
    });
});
