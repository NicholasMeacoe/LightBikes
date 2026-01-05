/**
 * UI Interaction Test Utilities
 * Helpers for testing user interface components
 */

const { createEnhancedDOMElement } = require('../mocks/dom-mocks.js');

/**
 * Create a UI test environment with common elements
 */
function createUITestEnvironment(options = {}) {
    const container = createEnhancedDOMElement('div', {
        id: 'test-container',
        className: 'ui-test-container',
    });

    // Mock document methods to return our test elements
    const mockDocument = {
        getElementById: jest.fn((id) => {
            if (id === 'test-container') return container;
            return container.querySelector(`#${id}`);
        }),
        querySelector: jest.fn((selector) => container.querySelector(selector)),
        querySelectorAll: jest.fn((selector) => container.querySelectorAll(selector)),
        createElement: jest.fn((tagName) => createEnhancedDOMElement(tagName)),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        body: createEnhancedDOMElement('body'),
        head: createEnhancedDOMElement('head'),
    };

    // Mock window
    const mockWindow = {
        document: mockDocument,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        getComputedStyle: jest.fn(() => ({
            getPropertyValue: jest.fn(() => ''),
            display: 'block',
            visibility: 'visible',
            opacity: '1',
        })),
        innerWidth: options.windowWidth || 1024,
        innerHeight: options.windowHeight || 768,
    };

    return {
        container,
        document: mockDocument,
        window: mockWindow,

        // Helper methods
        createElement: (tagName, options = {}) => {
            const element = createEnhancedDOMElement(tagName, options);
            if (options.appendTo !== false) {
                container.appendChild(element);
            }
            return element;
        },

        createButton: (text, options = {}) => {
            return this.createElement('button', {
                textContent: text,
                type: 'button',
                ...options,
            });
        },

        createInput: (type = 'text', options = {}) => {
            return this.createElement('input', {
                type,
                ...options,
            });
        },

        createSelect: (options = [], selectOptions = {}) => {
            const select = this.createElement('select', selectOptions);
            options.forEach((option) => {
                const optionElement = createEnhancedDOMElement('option', {
                    value: option.value || option,
                    textContent: option.text || option,
                    appendTo: false,
                });
                select.appendChild(optionElement);
            });
            return select;
        },

        cleanup: () => {
            container.children.length = 0;
            jest.clearAllMocks();
        },
    };
}

/**
 * Create a form testing helper
 */
function createFormTestHelper(formElement) {
    return {
        fillField: (fieldName, value) => {
            const field =
                formElement.querySelector(`[name="${fieldName}"]`) ||
                formElement.querySelector(`#${fieldName}`);
            if (field) {
                field.value = value;
                // Trigger input event
                if (field.oninput) field.oninput({ target: field });
                // Trigger change event
                if (field.onchange) field.onchange({ target: field });
            }
            return field;
        },

        selectOption: (selectName, value) => {
            const select =
                formElement.querySelector(`select[name="${selectName}"]`) ||
                formElement.querySelector(`#${selectName}`);
            if (select) {
                select.value = value;
                if (select.onchange) select.onchange({ target: select });
            }
            return select;
        },

        checkBox: (checkboxName, checked = true) => {
            const checkbox =
                formElement.querySelector(`input[name="${checkboxName}"]`) ||
                formElement.querySelector(`#${checkboxName}`);
            if (checkbox && checkbox.type === 'checkbox') {
                checkbox.checked = checked;
                if (checkbox.onchange) checkbox.onchange({ target: checkbox });
            }
            return checkbox;
        },

        clickButton: (buttonText) => {
            const button = Array.from(formElement.querySelectorAll('button')).find((btn) =>
                btn.textContent.includes(buttonText)
            );
            if (button) {
                if (button.onclick) button.onclick({ target: button });
                button.click();
            }
            return button;
        },

        submitForm: () => {
            if (formElement.onsubmit) {
                const event = { preventDefault: jest.fn(), target: formElement };
                formElement.onsubmit(event);
            }
        },

        getFormData: () => {
            const data = {};
            const inputs = formElement.querySelectorAll('input, select, textarea');
            inputs.forEach((input) => {
                if (input.name) {
                    if (input.type === 'checkbox') {
                        data[input.name] = input.checked;
                    } else if (input.type === 'radio') {
                        if (input.checked) data[input.name] = input.value;
                    } else {
                        data[input.name] = input.value;
                    }
                }
            });
            return data;
        },

        validateField: (fieldName, validator) => {
            const field = this.fillField(fieldName, ''); // Get field reference
            return validator(field);
        },
    };
}

/**
 * Create event simulation helpers
 */
function createEventSimulator() {
    return {
        click: (element, options = {}) => {
            const event = {
                type: 'click',
                target: element,
                currentTarget: element,
                preventDefault: jest.fn(),
                stopPropagation: jest.fn(),
                clientX: options.clientX || 0,
                clientY: options.clientY || 0,
                button: options.button || 0,
                buttons: options.buttons || 1,
                ...options,
            };

            if (element.onclick) element.onclick(event);
            if (element.click) element.click();

            return event;
        },

        keydown: (element, key, options = {}) => {
            const event = {
                type: 'keydown',
                target: element,
                key,
                code: options.code || `Key${key.toUpperCase()}`,
                keyCode: options.keyCode || key.charCodeAt(0),
                preventDefault: jest.fn(),
                stopPropagation: jest.fn(),
                ctrlKey: options.ctrlKey || false,
                shiftKey: options.shiftKey || false,
                altKey: options.altKey || false,
                metaKey: options.metaKey || false,
                ...options,
            };

            if (element.onkeydown) element.onkeydown(event);

            return event;
        },

        keyup: (element, key, options = {}) => {
            const event = {
                type: 'keyup',
                target: element,
                key,
                code: options.code || `Key${key.toUpperCase()}`,
                keyCode: options.keyCode || key.charCodeAt(0),
                preventDefault: jest.fn(),
                stopPropagation: jest.fn(),
                ...options,
            };

            if (element.onkeyup) element.onkeyup(event);

            return event;
        },

        input: (element, value) => {
            element.value = value;
            const event = {
                type: 'input',
                target: element,
                currentTarget: element,
                preventDefault: jest.fn(),
                stopPropagation: jest.fn(),
            };

            if (element.oninput) element.oninput(event);

            return event;
        },

        change: (element, value) => {
            if (value !== undefined) element.value = value;
            const event = {
                type: 'change',
                target: element,
                currentTarget: element,
                preventDefault: jest.fn(),
                stopPropagation: jest.fn(),
            };

            if (element.onchange) element.onchange(event);

            return event;
        },

        focus: (element) => {
            const event = {
                type: 'focus',
                target: element,
                currentTarget: element,
                preventDefault: jest.fn(),
                stopPropagation: jest.fn(),
            };

            if (element.onfocus) element.onfocus(event);
            if (element.focus) element.focus();

            return event;
        },

        blur: (element) => {
            const event = {
                type: 'blur',
                target: element,
                currentTarget: element,
                preventDefault: jest.fn(),
                stopPropagation: jest.fn(),
            };

            if (element.onblur) element.onblur(event);
            if (element.blur) element.blur();

            return event;
        },

        mouseenter: (element, options = {}) => {
            const event = {
                type: 'mouseenter',
                target: element,
                currentTarget: element,
                clientX: options.clientX || 0,
                clientY: options.clientY || 0,
                preventDefault: jest.fn(),
                stopPropagation: jest.fn(),
                ...options,
            };

            if (element.onmouseenter) element.onmouseenter(event);

            return event;
        },

        mouseleave: (element, options = {}) => {
            const event = {
                type: 'mouseleave',
                target: element,
                currentTarget: element,
                clientX: options.clientX || 0,
                clientY: options.clientY || 0,
                preventDefault: jest.fn(),
                stopPropagation: jest.fn(),
                ...options,
            };

            if (element.onmouseleave) element.onmouseleave(event);

            return event;
        },
    };
}

/**
 * Create UI state testing helpers
 */
function createUIStateHelper() {
    return {
        expectVisible: (element) => {
            expect(element.style.display).not.toBe('none');
            expect(element.style.visibility).not.toBe('hidden');
            expect(element.hidden).not.toBe(true);
        },

        expectHidden: (element) => {
            const isHidden =
                element.style.display === 'none' ||
                element.style.visibility === 'hidden' ||
                element.hidden === true;
            expect(isHidden).toBe(true);
        },

        expectEnabled: (element) => {
            expect(element.disabled).toBe(false);
        },

        expectDisabled: (element) => {
            expect(element.disabled).toBe(true);
        },

        expectHasClass: (element, className) => {
            expect(element.classList.contains(className)).toBe(true);
        },

        expectNotHasClass: (element, className) => {
            expect(element.classList.contains(className)).toBe(false);
        },

        expectText: (element, expectedText) => {
            expect(element.textContent).toBe(expectedText);
        },

        expectValue: (element, expectedValue) => {
            expect(element.value).toBe(expectedValue);
        },

        expectAttribute: (element, attribute, expectedValue) => {
            expect(element.getAttribute(attribute)).toBe(expectedValue);
        },

        expectStyle: (element, property, expectedValue) => {
            expect(element.style[property]).toBe(expectedValue);
        },
    };
}

/**
 * Create animation testing helpers
 */
function createAnimationTestHelper() {
    let animationFrameId = 0;
    const scheduledCallbacks = new Map();

    // Mock requestAnimationFrame
    const mockRequestAnimationFrame = jest.fn((callback) => {
        const id = ++animationFrameId;
        scheduledCallbacks.set(id, callback);
        return id;
    });

    const mockCancelAnimationFrame = jest.fn((id) => {
        scheduledCallbacks.delete(id);
    });

    return {
        mockRequestAnimationFrame,
        mockCancelAnimationFrame,

        triggerAnimationFrame: (timestamp = performance.now()) => {
            const callbacks = Array.from(scheduledCallbacks.values());
            scheduledCallbacks.clear();
            callbacks.forEach((callback) => callback(timestamp));
            return callbacks.length;
        },

        triggerMultipleFrames: (count, deltaTime = 16.67) => {
            let timestamp = performance.now();
            for (let i = 0; i < count; i++) {
                this.triggerAnimationFrame(timestamp);
                timestamp += deltaTime;
            }
        },

        expectAnimationScheduled: () => {
            expect(mockRequestAnimationFrame).toHaveBeenCalled();
        },

        expectAnimationCancelled: () => {
            expect(mockCancelAnimationFrame).toHaveBeenCalled();
        },

        getPendingAnimations: () => scheduledCallbacks.size,

        clearPendingAnimations: () => {
            scheduledCallbacks.clear();
        },
    };
}

/**
 * UI component testing assertions
 */
const uiAssertions = {
    expectElementExists: (container, selector) => {
        const element = container.querySelector(selector);
        expect(element).not.toBeNull();
        return element;
    },

    expectElementCount: (container, selector, count) => {
        const elements = container.querySelectorAll(selector);
        expect(elements).toHaveLength(count);
        return elements;
    },

    expectEventListener: (element, eventType) => {
        expect(element.addEventListener).toHaveBeenCalledWith(
            eventType,
            expect.any(Function),
            expect.anything()
        );
    },

    expectNoEventListener: (element, eventType) => {
        if (element.addEventListener && element.addEventListener.mock) {
            const calls = element.addEventListener.mock.calls;
            const hasListener = calls.some((call) => call[0] === eventType);
            return hasListener;
        }
        return false;
    },
};

module.exports = {
    createUITestEnvironment,
    createFormTestHelper,
    createEventSimulator,
    createUIStateHelper,
    createAnimationTestHelper,
    uiAssertions,
};
