/**
 * DOM testing helper utilities
 * Provides utilities for creating and manipulating DOM elements in tests
 */

/**
 * Create a DOM element with attributes and children
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Element attributes
 * @param {Array} children - Child elements or text
 * @returns {HTMLElement}
 */
function createElement(tag, attrs = {}, children = []) {
    const element = document.createElement(tag);

    // Set attributes
    Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key.startsWith('data-')) {
            element.setAttribute(key, value);
        } else {
            element[key] = value;
        }
    });

    // Add children
    children.forEach((child) => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            element.appendChild(child);
        }
    });

    return element;
}

/**
 * Create a container element and attach to document body
 * @param {string} id - Container ID
 * @returns {HTMLElement}
 */
function createContainer(id = 'test-container') {
    const container = createElement('div', { id, className: 'test-container' });
    document.body.appendChild(container);
    return container;
}

/**
 * Clean up a container element
 * @param {HTMLElement} container - Container to remove
 */
function cleanupContainer(container) {
    if (container && container.parentNode) {
        container.parentNode.removeChild(container);
    }
}

/**
 * Clean up all test containers
 */
function cleanupAllContainers() {
    const containers = document.querySelectorAll('.test-container');
    containers.forEach((container) => cleanupContainer(container));
}

/**
 * Simulate a DOM event
 * @param {HTMLElement} element - Target element
 * @param {string} eventType - Event type (e.g., 'click', 'keydown')
 * @param {Object} eventProps - Event properties
 */
function simulateEvent(element, eventType, eventProps = {}) {
    const event = new Event(eventType, {
        bubbles: true,
        cancelable: true,
        ...eventProps,
    });

    Object.entries(eventProps).forEach(([key, value]) => {
        event[key] = value;
    });

    element.dispatchEvent(event);
    return event;
}

/**
 * Simulate a keyboard event
 * @param {HTMLElement} element - Target element
 * @param {string} eventType - Event type ('keydown', 'keyup', 'keypress')
 * @param {string} key - Key value
 * @param {Object} options - Additional options
 */
function simulateKeyboardEvent(element, eventType, key, options = {}) {
    const event = new KeyboardEvent(eventType, {
        key,
        code: options.code || key,
        bubbles: true,
        cancelable: true,
        ...options,
    });

    element.dispatchEvent(event);
    return event;
}

/**
 * Simulate a mouse event
 * @param {HTMLElement} element - Target element
 * @param {string} eventType - Event type ('click', 'mousedown', etc.)
 * @param {Object} options - Mouse event options
 */
function simulateMouseEvent(element, eventType, options = {}) {
    const event = new MouseEvent(eventType, {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: 0,
        clientY: 0,
        ...options,
    });

    element.dispatchEvent(event);
    return event;
}

/**
 * Simulate a touch event
 * @param {HTMLElement} element - Target element
 * @param {string} eventType - Event type ('touchstart', 'touchmove', 'touchend')
 * @param {Array} touches - Array of touch points
 */
function simulateTouchEvent(element, eventType, touches = [{ clientX: 0, clientY: 0 }]) {
    const touchList = touches.map((touch) => ({
        identifier: touch.identifier || 0,
        target: element,
        clientX: touch.clientX || 0,
        clientY: touch.clientY || 0,
        pageX: touch.pageX || touch.clientX || 0,
        pageY: touch.pageY || touch.clientY || 0,
        screenX: touch.screenX || touch.clientX || 0,
        screenY: touch.screenY || touch.clientY || 0,
    }));

    const event = new TouchEvent(eventType, {
        bubbles: true,
        cancelable: true,
        touches: touchList,
        targetTouches: touchList,
        changedTouches: touchList,
    });

    element.dispatchEvent(event);
    return event;
}

/**
 * Query element with error message if not found
 * @param {HTMLElement} container - Container to query
 * @param {string} selector - CSS selector
 * @returns {HTMLElement}
 */
function queryElement(container, selector) {
    const element = container.querySelector(selector);
    if (!element) {
        throw new Error(`Element not found: ${selector}`);
    }
    return element;
}

/**
 * Query all elements
 * @param {HTMLElement} container - Container to query
 * @param {string} selector - CSS selector
 * @returns {NodeList}
 */
function queryAllElements(container, selector) {
    return container.querySelectorAll(selector);
}

/**
 * Wait for element to appear in DOM
 * @param {HTMLElement} container - Container to watch
 * @param {string} selector - CSS selector
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<HTMLElement>}
 */
function waitForElement(container, selector, timeout = 1000) {
    return new Promise((resolve, reject) => {
        const element = container.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }

        const observer = new MutationObserver(() => {
            const element = container.querySelector(selector);
            if (element) {
                observer.disconnect();
                resolve(element);
            }
        });

        observer.observe(container, {
            childList: true,
            subtree: true,
        });

        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element not found within ${timeout}ms: ${selector}`));
        }, timeout);
    });
}

/**
 * Get computed style property
 * @param {HTMLElement} element - Target element
 * @param {string} property - CSS property name
 * @returns {string}
 */
function getComputedStyleProperty(element, property) {
    return window.getComputedStyle(element).getPropertyValue(property);
}

/**
 * Check if element is visible
 * @param {HTMLElement} element - Target element
 * @returns {boolean}
 */
function isVisible(element) {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
}

/**
 * Mock canvas context
 * @returns {Object}
 */
function createMockCanvasContext() {
    return {
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        font: '10px sans-serif',
        textAlign: 'start',
        textBaseline: 'alphabetic',
        fillRect: jest.fn(),
        strokeRect: jest.fn(),
        clearRect: jest.fn(),
        fillText: jest.fn(),
        strokeText: jest.fn(),
        measureText: jest.fn(() => ({ width: 0 })),
        beginPath: jest.fn(),
        closePath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        arc: jest.fn(),
        stroke: jest.fn(),
        fill: jest.fn(),
        save: jest.fn(),
        restore: jest.fn(),
        translate: jest.fn(),
        rotate: jest.fn(),
        scale: jest.fn(),
        drawImage: jest.fn(),
        getImageData: jest.fn(() => ({
            data: new Uint8ClampedArray(4),
            width: 1,
            height: 1,
        })),
        putImageData: jest.fn(),
    };
}

module.exports = {
    createElement,
    createContainer,
    cleanupContainer,
    cleanupAllContainers,
    simulateEvent,
    simulateKeyboardEvent,
    simulateMouseEvent,
    simulateTouchEvent,
    queryElement,
    queryAllElements,
    waitForElement,
    getComputedStyleProperty,
    isVisible,
    createMockCanvasContext,
};
