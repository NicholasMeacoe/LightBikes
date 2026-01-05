/**
 * CompatibilityWarningUI.test.js
 * Comprehensive tests for CompatibilityWarningUI component
 */

const { CompatibilityWarningUI } = require('../../src/ui/CompatibilityWarningUI.js');

describe('CompatibilityWarningUI', () => {
    let compatibilityUI;
    let mockSessionStorage;

    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = '';
        document.head.innerHTML = '';

        // Mock sessionStorage
        mockSessionStorage = {
            data: {},
            setItem: jest.fn((key, value) => {
                mockSessionStorage.data[key] = value;
            }),
            getItem: jest.fn((key) => mockSessionStorage.data[key] || null),
            removeItem: jest.fn((key) => {
                delete mockSessionStorage.data[key];
            }),
            clear: jest.fn(() => {
                mockSessionStorage.data = {};
            }),
        };
        Object.defineProperty(window, 'sessionStorage', {
            value: mockSessionStorage,
            writable: true,
        });

        compatibilityUI = new CompatibilityWarningUI();
    });

    afterEach(() => {
        if (compatibilityUI) {
            compatibilityUI.hide();
        }
    });

    describe('constructor', () => {
        it('should initialize with correct default values', () => {
            expect(compatibilityUI.warningElement).toBeNull();
            expect(compatibilityUI.isVisible).toBe(false);
        });
    });

    describe('showWarning', () => {
        it('should create and display warning with errors and warnings', () => {
            const compatibilityReport = {
                browserInfo: { name: 'Chrome', version: '85' },
                errors: ['WebGL not supported', 'Canvas API missing'],
                warnings: ['Old browser version', 'Performance may be affected'],
            };

            compatibilityUI.showWarning(compatibilityReport);

            expect(compatibilityUI.warningElement).not.toBeNull();
            expect(compatibilityUI.isVisible).toBe(true);
            expect(document.body.contains(compatibilityUI.warningElement)).toBe(true);

            const content = compatibilityUI.warningElement.innerHTML;
            expect(content).toContain('Chrome 85');
            expect(content).toContain('WebGL not supported');
            expect(content).toContain('Canvas API missing');
            expect(content).toContain('Old browser version');
            expect(content).toContain('Performance may be affected');
        });

        it('should display critical error message when errors exist', () => {
            const compatibilityReport = {
                browserInfo: { name: 'Firefox', version: '70' },
                errors: ['Critical feature missing'],
                warnings: [],
            };

            compatibilityUI.showWarning(compatibilityReport);

            const content = compatibilityUI.warningElement.innerHTML;
            expect(content).toContain('The game cannot run without these critical features');
            expect(content).not.toContain('Continue Anyway');
        });

        it('should show continue button when only warnings exist', () => {
            const compatibilityReport = {
                browserInfo: { name: 'Safari', version: '13' },
                errors: [],
                warnings: ['Minor compatibility issue'],
            };

            compatibilityUI.showWarning(compatibilityReport);

            const content = compatibilityUI.warningElement.innerHTML;
            expect(content).toContain('Continue Anyway');
            expect(content).toContain('Some features may not work correctly');
        });

        it('should hide existing warning before showing new one', () => {
            const report1 = {
                browserInfo: { name: 'Chrome', version: '85' },
                errors: [],
                warnings: ['Warning 1'],
            };
            const report2 = {
                browserInfo: { name: 'Firefox', version: '88' },
                errors: [],
                warnings: ['Warning 2'],
            };

            compatibilityUI.showWarning(report1);
            const firstElement = compatibilityUI.warningElement;

            compatibilityUI.showWarning(report2);

            expect(document.body.contains(firstElement)).toBe(false);
            expect(compatibilityUI.warningElement).not.toBe(firstElement);
        });

        it('should include recommended browsers section', () => {
            const compatibilityReport = {
                browserInfo: { name: 'IE', version: '11' },
                errors: [],
                warnings: ['Outdated browser'],
            };

            compatibilityUI.showWarning(compatibilityReport);

            const content = compatibilityUI.warningElement.innerHTML;
            expect(content).toContain('Recommended Browsers');
            expect(content).toContain('Chrome 90+');
            expect(content).toContain('Firefox 88+');
            expect(content).toContain('Safari 14+');
            expect(content).toContain('Edge 90+');
        });
    });

    describe('showCriticalError', () => {
        it('should display critical error message', () => {
            const errorMessage = 'WebGL initialization failed';

            compatibilityUI.showCriticalError(errorMessage);

            expect(compatibilityUI.warningElement).not.toBeNull();
            expect(compatibilityUI.isVisible).toBe(true);
            expect(compatibilityUI.warningElement.className).toContain('compatibility-critical');

            const content = compatibilityUI.warningElement.innerHTML;
            expect(content).toContain('Critical Error');
            expect(content).toContain(errorMessage);
            expect(content).toContain('Recommended Browsers');
        });

        it('should hide existing warning before showing critical error', () => {
            const compatibilityReport = {
                browserInfo: { name: 'Chrome', version: '85' },
                errors: [],
                warnings: ['Warning'],
            };

            compatibilityUI.showWarning(compatibilityReport);
            const firstElement = compatibilityUI.warningElement;

            compatibilityUI.showCriticalError('Critical error');

            expect(document.body.contains(firstElement)).toBe(false);
            expect(compatibilityUI.warningElement).not.toBe(firstElement);
        });
    });

    describe('setupEventListeners', () => {
        it('should set up close button event listener', () => {
            const compatibilityReport = {
                browserInfo: { name: 'Chrome', version: '85' },
                errors: [],
                warnings: ['Warning'],
            };

            compatibilityUI.showWarning(compatibilityReport);

            const closeBtn = document.getElementById('compatibilityCloseBtn');
            expect(closeBtn).not.toBeNull();

            // Simulate click
            closeBtn.click();

            expect(compatibilityUI.isVisible).toBe(false);
            expect(compatibilityUI.warningElement).toBeNull();
        });

        it('should set up continue button when allowed', () => {
            const compatibilityReport = {
                browserInfo: { name: 'Chrome', version: '85' },
                errors: [],
                warnings: ['Warning'],
            };

            compatibilityUI.showWarning(compatibilityReport);

            const continueBtn = document.getElementById('compatibilityContinueBtn');
            expect(continueBtn).not.toBeNull();

            // Simulate click
            continueBtn.click();

            expect(compatibilityUI.isVisible).toBe(false);
            expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
                'lightbikes_compatibility_acknowledged',
                'true'
            );
        });

        it('should not set up continue button when errors exist', () => {
            const compatibilityReport = {
                browserInfo: { name: 'Chrome', version: '85' },
                errors: ['Critical error'],
                warnings: [],
            };

            compatibilityUI.showWarning(compatibilityReport);

            const continueBtn = document.getElementById('compatibilityContinueBtn');
            expect(continueBtn).toBeNull();
        });

        it('should handle missing close button gracefully', () => {
            compatibilityUI.warningElement = document.createElement('div');
            document.body.appendChild(compatibilityUI.warningElement);

            expect(() => {
                compatibilityUI.setupEventListeners(true);
            }).not.toThrow();
        });
    });

    describe('hide', () => {
        it('should remove warning element from DOM', () => {
            const compatibilityReport = {
                browserInfo: { name: 'Chrome', version: '85' },
                errors: [],
                warnings: ['Warning'],
            };

            compatibilityUI.showWarning(compatibilityReport);
            expect(compatibilityUI.isVisible).toBe(true);

            compatibilityUI.hide();

            expect(compatibilityUI.warningElement).toBeNull();
            expect(compatibilityUI.isVisible).toBe(false);
            expect(document.querySelector('#compatibility-warning')).toBeNull();
        });

        it('should handle case when element has no parent', () => {
            compatibilityUI.warningElement = document.createElement('div');
            compatibilityUI.isVisible = true;

            expect(() => {
                compatibilityUI.hide();
            }).not.toThrow();

            expect(compatibilityUI.warningElement).toBeNull();
            expect(compatibilityUI.isVisible).toBe(false);
        });

        it('should handle case when element is null', () => {
            compatibilityUI.warningElement = null;
            compatibilityUI.isVisible = true;

            expect(() => {
                compatibilityUI.hide();
            }).not.toThrow();

            expect(compatibilityUI.isVisible).toBe(false);
        });
    });

    describe('isShowing', () => {
        it('should return true when warning is visible', () => {
            const compatibilityReport = {
                browserInfo: { name: 'Chrome', version: '85' },
                errors: [],
                warnings: ['Warning'],
            };

            compatibilityUI.showWarning(compatibilityReport);

            expect(compatibilityUI.isShowing()).toBe(true);
        });

        it('should return false when warning is hidden', () => {
            expect(compatibilityUI.isShowing()).toBe(false);

            const compatibilityReport = {
                browserInfo: { name: 'Chrome', version: '85' },
                errors: [],
                warnings: ['Warning'],
            };

            compatibilityUI.showWarning(compatibilityReport);
            compatibilityUI.hide();

            expect(compatibilityUI.isShowing()).toBe(false);
        });
    });

    describe('addStyles', () => {
        it('should add CSS styles to document head', () => {
            compatibilityUI.addStyles();

            const styleElement = document.getElementById('compatibility-warning-styles');
            expect(styleElement).not.toBeNull();
            expect(styleElement.tagName).toBe('STYLE');
            expect(styleElement.textContent).toContain('.compatibility-warning');
        });

        it('should not add duplicate styles', () => {
            compatibilityUI.addStyles();
            compatibilityUI.addStyles();

            const styleElements = document.querySelectorAll('#compatibility-warning-styles');
            expect(styleElements.length).toBe(1);
        });

        it('should include responsive styles', () => {
            compatibilityUI.addStyles();

            const styleElement = document.getElementById('compatibility-warning-styles');
            expect(styleElement.textContent).toContain('@media (max-width: 768px)');
        });

        it('should include animation styles', () => {
            compatibilityUI.addStyles();

            const styleElement = document.getElementById('compatibility-warning-styles');
            expect(styleElement.textContent).toContain('@keyframes fadeIn');
            expect(styleElement.textContent).toContain('animation: fadeIn');
        });
    });

    describe('DOM integration', () => {
        it('should create proper DOM structure', () => {
            const compatibilityReport = {
                browserInfo: { name: 'Chrome', version: '85' },
                errors: ['Error 1'],
                warnings: ['Warning 1'],
            };

            compatibilityUI.showWarning(compatibilityReport);

            expect(compatibilityUI.warningElement.id).toBe('compatibility-warning');
            expect(compatibilityUI.warningElement.className).toContain('compatibility-warning');

            const header = compatibilityUI.warningElement.querySelector(
                '.compatibility-warning-header'
            );
            const body = compatibilityUI.warningElement.querySelector(
                '.compatibility-warning-body'
            );

            expect(header).not.toBeNull();
            expect(body).not.toBeNull();
        });

        it('should handle empty errors and warnings arrays', () => {
            const compatibilityReport = {
                browserInfo: { name: 'Chrome', version: '90' },
                errors: [],
                warnings: [],
            };

            expect(() => {
                compatibilityUI.showWarning(compatibilityReport);
            }).not.toThrow();

            expect(compatibilityUI.isVisible).toBe(true);
        });
    });

    describe('accessibility features', () => {
        it('should include proper ARIA attributes and semantic HTML', () => {
            const compatibilityReport = {
                browserInfo: { name: 'Chrome', version: '85' },
                errors: [],
                warnings: ['Warning'],
            };

            compatibilityUI.showWarning(compatibilityReport);

            const content = compatibilityUI.warningElement.innerHTML;
            expect(content).toContain('<h2>');
            expect(content).toContain('<h3>');
            expect(content).toContain('<ul>');
            expect(content).toContain('<li>');
        });

        it('should include external link security attributes', () => {
            const compatibilityReport = {
                browserInfo: { name: 'Chrome', version: '85' },
                errors: [],
                warnings: ['Warning'],
            };

            compatibilityUI.showWarning(compatibilityReport);

            const content = compatibilityUI.warningElement.innerHTML;
            expect(content).toContain('target="_blank"');
            expect(content).toContain('rel="noopener"');
        });
    });

    describe('error handling', () => {
        it('should handle malformed compatibility report', () => {
            const malformedReport = {
                browserInfo: null,
                errors: null,
                warnings: null,
            };

            expect(() => {
                compatibilityUI.showWarning(malformedReport);
            }).not.toThrow();

            expect(compatibilityUI.isVisible).toBe(true);
        });

        it('should handle missing DOM methods gracefully', () => {
            const originalCreateElement = document.createElement;
            document.createElement = jest.fn(() => {
                throw new Error('DOM error');
            });

            expect(() => {
                compatibilityUI.showWarning({
                    browserInfo: { name: 'Chrome', version: '85' },
                    errors: [],
                    warnings: [],
                });
            }).toThrow();

            document.createElement = originalCreateElement;
        });
    });

    describe('responsive layout', () => {
        it('should include mobile-specific styles', () => {
            compatibilityUI.addStyles();

            const styleElement = document.getElementById('compatibility-warning-styles');
            const styles = styleElement.textContent;

            expect(styles).toContain('flex-direction: column');
            expect(styles).toContain('width: 95%');
            expect(styles).toContain('max-height: 95vh');
        });
    });
});
