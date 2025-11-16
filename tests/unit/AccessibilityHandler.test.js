const { AccessibilityHandler } = require('./AccessibilityHandler.js');

// Mock matchMedia
const createMockMediaQueryList = (matches = false) => ({
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
});

describe('AccessibilityHandler', () => {
    let accessibilityHandler;
    let mockMediaQueryList;

    beforeEach(() => {
        mockMediaQueryList = createMockMediaQueryList(false);
        
        global.window = {
            matchMedia: jest.fn(() => mockMediaQueryList)
        };
        
        accessibilityHandler = new AccessibilityHandler();
    });

    afterEach(() => {
        if (accessibilityHandler) {
            accessibilityHandler.destroy();
        }
    });

    describe('constructor', () => {
        it('should initialize with system preference detection', () => {
            expect(global.window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
            expect(accessibilityHandler.getSystemPreference()).toBe(false);
        });

        it('should handle system preference of reduced motion', () => {
            mockMediaQueryList.matches = true;
            const handler = new AccessibilityHandler();
            
            expect(handler.getSystemPreference()).toBe(true);
            handler.destroy();
        });

        it('should handle missing matchMedia gracefully', () => {
            global.window = {};
            
            expect(() => {
                const handler = new AccessibilityHandler();
                handler.destroy();
            }).not.toThrow();
        });

        it('should handle matchMedia errors gracefully', () => {
            global.window.matchMedia = () => { throw new Error('Not supported'); };
            
            expect(() => {
                const handler = new AccessibilityHandler();
                expect(handler.getSystemPreference()).toBe(false);
                handler.destroy();
            }).not.toThrow();
        });
    });

    describe('system preference detection', () => {
        it('should detect system preference changes', () => {
            const changeListener = jest.fn();
            accessibilityHandler.addChangeListener(changeListener);
            
            // Simulate system preference change
            const eventHandler = mockMediaQueryList.addEventListener.mock.calls[0][1];
            eventHandler({ matches: true });
            
            expect(accessibilityHandler.getSystemPreference()).toBe(true);
            expect(changeListener).toHaveBeenCalled();
        });

        it('should use addListener fallback if addEventListener not available', () => {
            mockMediaQueryList.addEventListener = undefined;
            
            const handler = new AccessibilityHandler();
            
            expect(mockMediaQueryList.addListener).toHaveBeenCalled();
            handler.destroy();
        });

        it('should not notify listeners if preference does not change', () => {
            const changeListener = jest.fn();
            accessibilityHandler.addChangeListener(changeListener);
            
            // Simulate same preference
            const eventHandler = mockMediaQueryList.addEventListener.mock.calls[0][1];
            eventHandler({ matches: false }); // Same as initial
            
            expect(changeListener).not.toHaveBeenCalled();
        });
    });

    describe('user override', () => {
        it('should set and get user override', () => {
            accessibilityHandler.setUserOverride(true);
            expect(accessibilityHandler.getUserOverride()).toBe(true);
            
            accessibilityHandler.setUserOverride(false);
            expect(accessibilityHandler.getUserOverride()).toBe(false);
            
            accessibilityHandler.setUserOverride(null);
            expect(accessibilityHandler.getUserOverride()).toBeNull();
        });

        it('should notify listeners when user override changes', () => {
            const changeListener = jest.fn();
            accessibilityHandler.addChangeListener(changeListener);
            
            accessibilityHandler.setUserOverride(true);
            expect(changeListener).toHaveBeenCalledTimes(1);
            
            accessibilityHandler.setUserOverride(true); // Same value
            expect(changeListener).toHaveBeenCalledTimes(1); // No additional call
            
            accessibilityHandler.setUserOverride(false);
            expect(changeListener).toHaveBeenCalledTimes(2);
        });

        it('should reject invalid user override values', () => {
            const changeListener = jest.fn();
            accessibilityHandler.addChangeListener(changeListener);
            
            accessibilityHandler.setUserOverride('invalid');
            expect(accessibilityHandler.getUserOverride()).toBeNull();
            expect(changeListener).not.toHaveBeenCalled();
        });
    });

    describe('shouldDisableEffects', () => {
        it('should prioritize user override over system preference', () => {
            // System prefers reduced motion
            const eventHandler = mockMediaQueryList.addEventListener.mock.calls[0][1];
            eventHandler({ matches: true });
            
            // User override to enable effects
            accessibilityHandler.setUserOverride(false);
            
            expect(accessibilityHandler.shouldDisableEffects()).toBe(false);
        });

        it('should fall back to system preference when no user override', () => {
            const eventHandler = mockMediaQueryList.addEventListener.mock.calls[0][1];
            eventHandler({ matches: true });
            
            expect(accessibilityHandler.shouldDisableEffects()).toBe(true);
        });

        it('should return false when no preferences set', () => {
            expect(accessibilityHandler.shouldDisableEffects()).toBe(false);
        });
    });

    describe('getAccessibilityStatus', () => {
        it('should return comprehensive status information', () => {
            accessibilityHandler.setUserOverride(true);
            
            const status = accessibilityHandler.getAccessibilityStatus();
            
            expect(status).toEqual({
                systemPreference: false,
                userOverride: true,
                effectsDisabled: true,
                source: 'user'
            });
        });

        it('should indicate system as source when no user override', () => {
            const eventHandler = mockMediaQueryList.addEventListener.mock.calls[0][1];
            eventHandler({ matches: true });
            
            const status = accessibilityHandler.getAccessibilityStatus();
            
            expect(status.source).toBe('system');
            expect(status.effectsDisabled).toBe(true);
        });
    });

    describe('change listeners', () => {
        it('should add and remove change listeners', () => {
            const listener1 = jest.fn();
            const listener2 = jest.fn();
            
            accessibilityHandler.addChangeListener(listener1);
            accessibilityHandler.addChangeListener(listener2);
            
            accessibilityHandler.setUserOverride(true);
            
            expect(listener1).toHaveBeenCalled();
            expect(listener2).toHaveBeenCalled();
            
            accessibilityHandler.removeChangeListener(listener1);
            listener1.mockClear();
            listener2.mockClear();
            
            accessibilityHandler.setUserOverride(false);
            
            expect(listener1).not.toHaveBeenCalled();
            expect(listener2).toHaveBeenCalled();
        });

        it('should handle listener errors gracefully', () => {
            const errorListener = jest.fn(() => { throw new Error('Test error'); });
            const normalListener = jest.fn();
            
            accessibilityHandler.addChangeListener(errorListener);
            accessibilityHandler.addChangeListener(normalListener);
            
            expect(() => {
                accessibilityHandler.setUserOverride(true);
            }).not.toThrow();
            
            expect(normalListener).toHaveBeenCalled();
        });
    });

    describe('applyToEffectControllers', () => {
        it('should disable effect controllers when effects should be disabled', () => {
            const mockShakeController = { setEnabled: jest.fn() };
            const mockMotionBlurController = { setEnabled: jest.fn() };
            
            accessibilityHandler.setUserOverride(true);
            
            accessibilityHandler.applyToEffectControllers({
                shakeController: mockShakeController,
                motionBlurController: mockMotionBlurController
            });
            
            expect(mockShakeController.setEnabled).toHaveBeenCalledWith(false);
            expect(mockMotionBlurController.setEnabled).toHaveBeenCalledWith(false);
        });

        it('should enable effect controllers when effects should be enabled', () => {
            const mockShakeController = { setEnabled: jest.fn() };
            const mockMotionBlurController = { setEnabled: jest.fn() };
            
            accessibilityHandler.setUserOverride(false);
            
            accessibilityHandler.applyToEffectControllers({
                shakeController: mockShakeController,
                motionBlurController: mockMotionBlurController
            });
            
            expect(mockShakeController.setEnabled).toHaveBeenCalledWith(true);
            expect(mockMotionBlurController.setEnabled).toHaveBeenCalledWith(true);
        });

        it('should handle missing controllers gracefully', () => {
            expect(() => {
                accessibilityHandler.applyToEffectControllers({});
            }).not.toThrow();
            
            expect(() => {
                accessibilityHandler.applyToEffectControllers({
                    shakeController: null,
                    motionBlurController: { setEnabled: jest.fn() }
                });
            }).not.toThrow();
        });

        it('should handle controller errors gracefully', () => {
            const errorController = { 
                setEnabled: jest.fn(() => { throw new Error('Controller error'); })
            };
            
            expect(() => {
                accessibilityHandler.applyToEffectControllers({
                    shakeController: errorController
                });
            }).not.toThrow();
        });
    });

    describe('applyAccessibilityOverrides', () => {
        it('should override effect settings when effects should be disabled', () => {
            accessibilityHandler.setUserOverride(true);
            
            const baseSettings = {
                shakeEnabled: true,
                motionBlurEnabled: true,
                otherSetting: 'value'
            };
            
            const result = accessibilityHandler.applyAccessibilityOverrides(baseSettings);
            
            expect(result.shakeEnabled).toBe(false);
            expect(result.motionBlurEnabled).toBe(false);
            expect(result.otherSetting).toBe('value');
            expect(result._accessibilityOverride).toBe(true);
        });

        it('should not modify settings when effects are enabled', () => {
            accessibilityHandler.setUserOverride(false);
            
            const baseSettings = {
                shakeEnabled: true,
                motionBlurEnabled: true
            };
            
            const result = accessibilityHandler.applyAccessibilityOverrides(baseSettings);
            
            expect(result.shakeEnabled).toBe(true);
            expect(result.motionBlurEnabled).toBe(true);
            expect(result._accessibilityOverride).toBeUndefined();
        });

        it('should handle invalid input gracefully', () => {
            expect(accessibilityHandler.applyAccessibilityOverrides(null)).toBeNull();
            expect(accessibilityHandler.applyAccessibilityOverrides('string')).toBe('string');
        });
    });

    describe('getAccessibilityDescription', () => {
        it('should provide user-friendly descriptions', () => {
            accessibilityHandler.setUserOverride(true);
            expect(accessibilityHandler.getAccessibilityDescription()).toBe('Effects disabled by user preference');
            
            accessibilityHandler.setUserOverride(false);
            expect(accessibilityHandler.getAccessibilityDescription()).toBe('Effects enabled by user preference (overriding system)');
            
            accessibilityHandler.setUserOverride(null);
            const eventHandler = mockMediaQueryList.addEventListener.mock.calls[0][1];
            eventHandler({ matches: true });
            expect(accessibilityHandler.getAccessibilityDescription()).toBe('Effects disabled by system preference (prefers-reduced-motion)');
            
            eventHandler({ matches: false });
            expect(accessibilityHandler.getAccessibilityDescription()).toBe('Effects enabled (no accessibility restrictions)');
        });
    });

    describe('destroy', () => {
        it('should cleanup event listeners', () => {
            accessibilityHandler.destroy();
            
            expect(mockMediaQueryList.removeEventListener).toHaveBeenCalled();
        });

        it('should use removeListener fallback if removeEventListener not available', () => {
            mockMediaQueryList.removeEventListener = undefined;
            
            accessibilityHandler.destroy();
            
            expect(mockMediaQueryList.removeListener).toHaveBeenCalled();
        });

        it('should handle cleanup errors gracefully', () => {
            mockMediaQueryList.removeEventListener = () => { throw new Error('Cleanup error'); };
            
            expect(() => {
                accessibilityHandler.destroy();
            }).not.toThrow();
        });
    });
});