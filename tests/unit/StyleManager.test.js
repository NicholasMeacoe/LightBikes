/**
 * @jest-environment jsdom
 */

const { StyleManager } = require('../../src/ui/StyleManager.js');

describe('StyleManager', () => {
    let styleManager;

    beforeEach(() => {
        // Clear DOM
        document.head.innerHTML = '';
        document.body.innerHTML = '';

        styleManager = new StyleManager();
    });

    describe('constructor', () => {
        it('should initialize with empty injected styles set', () => {
            expect(styleManager.injectedStyles).toBeInstanceOf(Set);
            expect(styleManager.injectedStyles.size).toBe(0);
        });
    });

    describe('addStyles', () => {
        it('should add CSS styles to document head', () => {
            const cssText = '.test { color: red; }';
            const result = styleManager.addStyles('test-styles', cssText);

            expect(result).toBe(true);

            const styleElement = document.getElementById('test-styles');
            expect(styleElement).toBeTruthy();
            expect(styleElement.tagName).toBe('STYLE');
            expect(styleElement.textContent).toBe(cssText);
            expect(styleElement.parentNode).toBe(document.head);
        });

        it('should track injected styles', () => {
            styleManager.addStyles('test-styles', '.test { color: red; }');

            expect(styleManager.injectedStyles.has('test-styles')).toBe(true);
            expect(styleManager.injectedStyles.size).toBe(1);
        });

        it('should not add duplicate styles', () => {
            const cssText = '.test { color: red; }';

            const firstResult = styleManager.addStyles('test-styles', cssText);
            const secondResult = styleManager.addStyles('test-styles', cssText);

            expect(firstResult).toBe(true);
            expect(secondResult).toBe(false);

            const styleElements = document.querySelectorAll('#test-styles');
            expect(styleElements.length).toBe(1);
        });

        it('should handle multiple different style sets', () => {
            styleManager.addStyles('styles-1', '.test1 { color: red; }');
            styleManager.addStyles('styles-2', '.test2 { color: blue; }');

            expect(document.getElementById('styles-1')).toBeTruthy();
            expect(document.getElementById('styles-2')).toBeTruthy();
            expect(styleManager.injectedStyles.size).toBe(2);
        });

        it('should handle empty CSS text', () => {
            const result = styleManager.addStyles('empty-styles', '');

            expect(result).toBe(true);
            const styleElement = document.getElementById('empty-styles');
            expect(styleElement.textContent).toBe('');
        });

        it('should handle complex CSS with multiple rules', () => {
            const complexCSS = `
                .container {
                    display: flex;
                    flex-direction: column;
                }
                
                .item {
                    padding: 10px;
                    margin: 5px;
                }
                
                @media (max-width: 768px) {
                    .container {
                        flex-direction: row;
                    }
                }
            `;

            const result = styleManager.addStyles('complex-styles', complexCSS);

            expect(result).toBe(true);
            const styleElement = document.getElementById('complex-styles');
            expect(styleElement.textContent).toBe(complexCSS);
        });
    });

    describe('removeStyles', () => {
        beforeEach(() => {
            styleManager.addStyles('test-styles', '.test { color: red; }');
        });

        it('should remove existing styles from document', () => {
            const result = styleManager.removeStyles('test-styles');

            expect(result).toBe(true);
            expect(document.getElementById('test-styles')).toBeNull();
        });

        it('should remove styles from tracking', () => {
            styleManager.removeStyles('test-styles');

            expect(styleManager.injectedStyles.has('test-styles')).toBe(false);
            expect(styleManager.injectedStyles.size).toBe(0);
        });

        it('should return false for non-existent styles', () => {
            const result = styleManager.removeStyles('non-existent');

            expect(result).toBe(false);
        });

        it('should handle removal of already removed styles', () => {
            styleManager.removeStyles('test-styles');
            const secondResult = styleManager.removeStyles('test-styles');

            expect(secondResult).toBe(false);
        });

        it('should only remove specified styles', () => {
            styleManager.addStyles('styles-2', '.test2 { color: blue; }');

            styleManager.removeStyles('test-styles');

            expect(document.getElementById('test-styles')).toBeNull();
            expect(document.getElementById('styles-2')).toBeTruthy();
            expect(styleManager.injectedStyles.has('styles-2')).toBe(true);
        });
    });

    describe('hasStyles', () => {
        it('should return true for existing styles', () => {
            styleManager.addStyles('test-styles', '.test { color: red; }');

            expect(styleManager.hasStyles('test-styles')).toBe(true);
        });

        it('should return false for non-existent styles', () => {
            expect(styleManager.hasStyles('non-existent')).toBe(false);
        });

        it('should return false after styles are removed', () => {
            styleManager.addStyles('test-styles', '.test { color: red; }');
            styleManager.removeStyles('test-styles');

            expect(styleManager.hasStyles('test-styles')).toBe(false);
        });

        it('should work with manually created style elements', () => {
            // Create style element manually (not through StyleManager)
            const style = document.createElement('style');
            style.id = 'manual-style';
            document.head.appendChild(style);

            expect(styleManager.hasStyles('manual-style')).toBe(true);
        });
    });

    describe('getInjectedStyleIds', () => {
        it('should return empty array when no styles injected', () => {
            const ids = styleManager.getInjectedStyleIds();

            expect(ids).toEqual([]);
            expect(Array.isArray(ids)).toBe(true);
        });

        it('should return array of injected style IDs', () => {
            styleManager.addStyles('styles-1', '.test1 { color: red; }');
            styleManager.addStyles('styles-2', '.test2 { color: blue; }');

            const ids = styleManager.getInjectedStyleIds();

            expect(ids).toContain('styles-1');
            expect(ids).toContain('styles-2');
            expect(ids.length).toBe(2);
        });

        it('should not include removed styles', () => {
            styleManager.addStyles('styles-1', '.test1 { color: red; }');
            styleManager.addStyles('styles-2', '.test2 { color: blue; }');
            styleManager.removeStyles('styles-1');

            const ids = styleManager.getInjectedStyleIds();

            expect(ids).not.toContain('styles-1');
            expect(ids).toContain('styles-2');
            expect(ids.length).toBe(1);
        });

        it('should return new array instance each time', () => {
            styleManager.addStyles('test-styles', '.test { color: red; }');

            const ids1 = styleManager.getInjectedStyleIds();
            const ids2 = styleManager.getInjectedStyleIds();

            expect(ids1).not.toBe(ids2); // Different instances
            expect(ids1).toEqual(ids2); // Same content
        });
    });

    describe('removeAllStyles', () => {
        beforeEach(() => {
            styleManager.addStyles('styles-1', '.test1 { color: red; }');
            styleManager.addStyles('styles-2', '.test2 { color: blue; }');
            styleManager.addStyles('styles-3', '.test3 { color: green; }');
        });

        it('should remove all injected styles from document', () => {
            styleManager.removeAllStyles();

            expect(document.getElementById('styles-1')).toBeNull();
            expect(document.getElementById('styles-2')).toBeNull();
            expect(document.getElementById('styles-3')).toBeNull();
        });

        it('should clear injected styles tracking', () => {
            styleManager.removeAllStyles();

            expect(styleManager.injectedStyles.size).toBe(0);
            expect(styleManager.getInjectedStyleIds()).toEqual([]);
        });

        it('should handle empty styles gracefully', () => {
            const emptyStyleManager = new StyleManager();

            expect(() => emptyStyleManager.removeAllStyles()).not.toThrow();
        });

        it('should not affect manually created styles', () => {
            // Create manual style element
            const manualStyle = document.createElement('style');
            manualStyle.id = 'manual-style';
            document.head.appendChild(manualStyle);

            styleManager.removeAllStyles();

            expect(document.getElementById('manual-style')).toBeTruthy();
        });
    });

    describe('updateStyles', () => {
        it('should add new styles when they do not exist', () => {
            const cssText = '.test { color: red; }';
            const result = styleManager.updateStyles('new-styles', cssText);

            expect(result).toBe(true);
            expect(document.getElementById('new-styles')).toBeTruthy();
            expect(document.getElementById('new-styles').textContent).toBe(cssText);
        });

        it('should update existing styles', () => {
            const originalCSS = '.test { color: red; }';
            const updatedCSS = '.test { color: blue; font-size: 16px; }';

            styleManager.addStyles('test-styles', originalCSS);
            const result = styleManager.updateStyles('test-styles', updatedCSS);

            expect(result).toBe(true);
            const styleElement = document.getElementById('test-styles');
            expect(styleElement.textContent).toBe(updatedCSS);
        });

        it('should maintain single style element after update', () => {
            styleManager.addStyles('test-styles', '.test { color: red; }');
            styleManager.updateStyles('test-styles', '.test { color: blue; }');

            const styleElements = document.querySelectorAll('#test-styles');
            expect(styleElements.length).toBe(1);
        });

        it('should keep tracking after update', () => {
            styleManager.addStyles('test-styles', '.test { color: red; }');
            styleManager.updateStyles('test-styles', '.test { color: blue; }');

            expect(styleManager.injectedStyles.has('test-styles')).toBe(true);
            expect(styleManager.injectedStyles.size).toBe(1);
        });

        it('should handle updating to empty CSS', () => {
            styleManager.addStyles('test-styles', '.test { color: red; }');
            const result = styleManager.updateStyles('test-styles', '');

            expect(result).toBe(true);
            expect(document.getElementById('test-styles').textContent).toBe('');
        });
    });

    describe('integration scenarios', () => {
        it('should handle complete style lifecycle', () => {
            // Add styles
            const result1 = styleManager.addStyles('lifecycle-test', '.test { color: red; }');
            expect(result1).toBe(true);
            expect(styleManager.hasStyles('lifecycle-test')).toBe(true);

            // Update styles
            const result2 = styleManager.updateStyles('lifecycle-test', '.test { color: blue; }');
            expect(result2).toBe(true);
            expect(document.getElementById('lifecycle-test').textContent).toBe(
                '.test { color: blue; }'
            );

            // Remove styles
            const result3 = styleManager.removeStyles('lifecycle-test');
            expect(result3).toBe(true);
            expect(styleManager.hasStyles('lifecycle-test')).toBe(false);
        });

        it('should handle multiple style managers independently', () => {
            const manager1 = new StyleManager();
            const manager2 = new StyleManager();

            manager1.addStyles('manager1-styles', '.test1 { color: red; }');
            manager2.addStyles('manager2-styles', '.test2 { color: blue; }');

            expect(manager1.getInjectedStyleIds()).toEqual(['manager1-styles']);
            expect(manager2.getInjectedStyleIds()).toEqual(['manager2-styles']);

            // Both styles should exist in DOM
            expect(document.getElementById('manager1-styles')).toBeTruthy();
            expect(document.getElementById('manager2-styles')).toBeTruthy();
        });

        it('should handle rapid add/remove operations', () => {
            for (let i = 0; i < 10; i++) {
                styleManager.addStyles(`rapid-${i}`, `.test${i} { color: red; }`);
            }

            expect(styleManager.getInjectedStyleIds().length).toBe(10);

            for (let i = 0; i < 5; i++) {
                styleManager.removeStyles(`rapid-${i}`);
            }

            expect(styleManager.getInjectedStyleIds().length).toBe(5);
        });
    });

    describe('error handling', () => {
        it('should handle invalid style IDs gracefully', () => {
            expect(() => styleManager.addStyles('', '.test { color: red; }')).not.toThrow();
            expect(() => styleManager.removeStyles('')).not.toThrow();
            expect(() => styleManager.hasStyles('')).not.toThrow();
        });

        it('should handle null/undefined parameters', () => {
            expect(() => styleManager.addStyles(null, '.test { color: red; }')).not.toThrow();
            expect(() => styleManager.addStyles('test', null)).not.toThrow();
            expect(() => styleManager.removeStyles(null)).not.toThrow();
            expect(() => styleManager.hasStyles(null)).not.toThrow();
        });

        it('should handle malformed CSS gracefully', () => {
            const malformedCSS = '.test { color: red; } .broken { color: ';

            expect(() => styleManager.addStyles('malformed', malformedCSS)).not.toThrow();

            const styleElement = document.getElementById('malformed');
            expect(styleElement).toBeTruthy();
            expect(styleElement.textContent).toBe(malformedCSS);
        });

        it('should handle DOM manipulation errors', () => {
            // Mock document.createElement to throw error
            const originalCreateElement = document.createElement;
            document.createElement = jest.fn(() => {
                throw new Error('DOM error');
            });

            expect(() => styleManager.addStyles('error-test', '.test { color: red; }')).toThrow();

            // Restore original method
            document.createElement = originalCreateElement;
        });
    });

    describe('edge cases', () => {
        it('should handle very long CSS content', () => {
            const longCSS = '.test { color: red; }'.repeat(1000);
            const result = styleManager.addStyles('long-css', longCSS);

            expect(result).toBe(true);
            expect(document.getElementById('long-css').textContent).toBe(longCSS);
        });

        it('should handle special characters in style IDs', () => {
            const specialId = 'test-styles_123.special';
            const result = styleManager.addStyles(specialId, '.test { color: red; }');

            expect(result).toBe(true);
            expect(document.getElementById(specialId)).toBeTruthy();
        });

        it('should handle CSS with special characters and unicode', () => {
            const unicodeCSS = '.test::before { content: "★ ♥ ♦ ♣ ♠"; }';
            const result = styleManager.addStyles('unicode-css', unicodeCSS);

            expect(result).toBe(true);
            expect(document.getElementById('unicode-css').textContent).toBe(unicodeCSS);
        });

        it('should maintain correct state after DOM modifications', () => {
            styleManager.addStyles('test-styles', '.test { color: red; }');

            // Manually remove element from DOM (simulating external modification)
            document.getElementById('test-styles').remove();

            // StyleManager should detect the element is gone
            expect(styleManager.hasStyles('test-styles')).toBe(false);

            // But tracking should still show it (until explicitly removed)
            expect(styleManager.injectedStyles.has('test-styles')).toBe(true);
        });
    });
});
