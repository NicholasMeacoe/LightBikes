/**
 * Enhanced DOM Element Mocks
 * Comprehensive DOM mocking for UI component testing
 */

/**
 * Create a comprehensive DOM element mock
 */
function createEnhancedDOMElement(tagName = 'div', options = {}) {
    const element = {
        // Basic properties
        tagName: tagName.toUpperCase(),
        nodeName: tagName.toUpperCase(),
        nodeType: 1,
        id: options.id || '',
        className: options.className || '',
        classList: createMockClassList(options.className),

        // Content properties
        textContent: options.textContent || '',
        innerHTML: options.innerHTML || '',
        innerText: options.innerText || options.textContent || '',
        outerHTML: `<${tagName}>${options.innerHTML || ''}</${tagName}>`,

        // Form properties
        value: options.value || '',
        type: options.type || '',
        checked: options.checked || false,
        disabled: options.disabled || false,
        readonly: options.readonly || false,
        required: options.required || false,

        // Style and layout
        style: createMockCSSStyleDeclaration(options.style),
        offsetWidth: options.offsetWidth || 100,
        offsetHeight: options.offsetHeight || 100,
        offsetTop: options.offsetTop || 0,
        offsetLeft: options.offsetLeft || 0,
        offsetParent: options.offsetParent || null,
        clientWidth: options.clientWidth || 100,
        clientHeight: options.clientHeight || 100,
        scrollWidth: options.scrollWidth || 100,
        scrollHeight: options.scrollHeight || 100,
        scrollTop: options.scrollTop || 0,
        scrollLeft: options.scrollLeft || 0,

        // Hierarchy
        parentNode: options.parentNode || null,
        parentElement: options.parentElement || null,
        children: options.children || [],
        childNodes: options.childNodes || [],
        firstChild: null,
        lastChild: null,
        nextSibling: options.nextSibling || null,
        previousSibling: options.previousSibling || null,

        // Attributes
        attributes: new Map(),
        dataset: options.dataset || {},

        // Event handling
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),

        // DOM manipulation
        appendChild: jest.fn(function (child) {
            this.children.push(child);
            child.parentNode = this;
            child.parentElement = this;
            return child;
        }),
        removeChild: jest.fn(function (child) {
            const index = this.children.indexOf(child);
            if (index !== -1) {
                this.children.splice(index, 1);
                child.parentNode = null;
                child.parentElement = null;
            }
            return child;
        }),
        insertBefore: jest.fn(),
        replaceChild: jest.fn(),
        cloneNode: jest.fn(function (deep = false) {
            return createEnhancedDOMElement(tagName, {
                ...options,
                children: deep ? [...this.children] : [],
            });
        }),
        remove: jest.fn(function () {
            if (this.parentNode) {
                this.parentNode.removeChild(this);
            }
        }),

        // Query methods
        querySelector: jest.fn((selector) => {
            // Simple mock implementation
            if (selector.startsWith('#')) {
                const id = selector.slice(1);
                return this.children.find((child) => child.id === id) || null;
            }
            if (selector.startsWith('.')) {
                const className = selector.slice(1);
                return (
                    this.children.find(
                        (child) => child.classList && child.classList.contains(className)
                    ) || null
                );
            }
            return this.children.find((child) => child.tagName === selector.toUpperCase()) || null;
        }),
        querySelectorAll: jest.fn((selector) => {
            // Simple mock implementation
            if (selector.startsWith('#')) {
                const id = selector.slice(1);
                return this.children.filter((child) => child.id === id);
            }
            if (selector.startsWith('.')) {
                const className = selector.slice(1);
                return this.children.filter(
                    (child) => child.classList && child.classList.contains(className)
                );
            }
            return this.children.filter((child) => child.tagName === selector.toUpperCase());
        }),
        getElementById: jest.fn((id) => {
            return this.children.find((child) => child.id === id) || null;
        }),
        getElementsByClassName: jest.fn((className) => {
            return this.children.filter(
                (child) => child.classList && child.classList.contains(className)
            );
        }),
        getElementsByTagName: jest.fn((tagName) => {
            return this.children.filter((child) => child.tagName === tagName.toUpperCase());
        }),
        closest: jest.fn((selector) => {
            let current = this;
            while (current) {
                if (current.matches && current.matches(selector)) {
                    return current;
                }
                current = current.parentElement;
            }
            return null;
        }),
        matches: jest.fn((selector) => {
            if (selector.startsWith('#')) {
                return this.id === selector.slice(1);
            }
            if (selector.startsWith('.')) {
                return this.classList.contains(selector.slice(1));
            }
            return this.tagName === selector.toUpperCase();
        }),

        // Attribute methods
        getAttribute: jest.fn(function (name) {
            return this.attributes.get(name) || null;
        }),
        setAttribute: jest.fn(function (name, value) {
            this.attributes.set(name, String(value));
            if (name === 'id') this.id = String(value);
            if (name === 'class') this.className = String(value);
        }),
        removeAttribute: jest.fn(function (name) {
            this.attributes.delete(name);
            if (name === 'id') this.id = '';
            if (name === 'class') this.className = '';
        }),
        hasAttribute: jest.fn(function (name) {
            return this.attributes.has(name);
        }),

        // Focus and interaction
        focus: jest.fn(),
        blur: jest.fn(),
        click: jest.fn(),
        select: jest.fn(),
        scrollIntoView: jest.fn(),

        // Visibility and display
        getBoundingClientRect: jest.fn(() => ({
            top: 0,
            left: 0,
            right: 100,
            bottom: 100,
            width: 100,
            height: 100,
            x: 0,
            y: 0,
        })),
        getClientRects: jest.fn(() => []),

        // Custom properties
        hidden: options.hidden || false,
        tabIndex: options.tabIndex || -1,
        title: options.title || '',
        lang: options.lang || '',
        dir: options.dir || '',

        // Mock specific properties
        _mockType: 'EnhancedDOMElement',
        _options: options,
    };

    // Set up parent-child relationships
    if (element.children.length > 0) {
        element.firstChild = element.children[0];
        element.lastChild = element.children[element.children.length - 1];
        element.children.forEach((child) => {
            child.parentNode = element;
            child.parentElement = element;
        });
    }

    return element;
}

/**
 * Create a mock ClassList
 */
function createMockClassList(initialClasses = '') {
    const classes = new Set(initialClasses.split(' ').filter((c) => c.trim()));

    return {
        add: jest.fn((...classNames) => {
            classNames.forEach((name) => classes.add(name));
        }),
        remove: jest.fn((...classNames) => {
            classNames.forEach((name) => classes.delete(name));
        }),
        toggle: jest.fn((className, force) => {
            if (force === true) {
                classes.add(className);
                return true;
            }
            if (force === false) {
                classes.delete(className);
                return false;
            }
            if (classes.has(className)) {
                classes.delete(className);
                return false;
            } else {
                classes.add(className);
                return true;
            }
        }),
        contains: jest.fn((className) => classes.has(className)),
        replace: jest.fn((oldClass, newClass) => {
            if (classes.has(oldClass)) {
                classes.delete(oldClass);
                classes.add(newClass);
                return true;
            }
            return false;
        }),
        item: jest.fn((index) => Array.from(classes)[index] || null),
        toString: jest.fn(() => Array.from(classes).join(' ')),
        get length() {
            return classes.size;
        },
        get value() {
            return Array.from(classes).join(' ');
        },
        set value(val) {
            classes.clear();
            val.split(' ')
                .filter((c) => c.trim())
                .forEach((c) => classes.add(c));
        },
        [Symbol.iterator]: function* () {
            yield* classes;
        },
    };
}

/**
 * Create a mock CSSStyleDeclaration
 */
function createMockCSSStyleDeclaration(initialStyles = {}) {
    const styles = { ...initialStyles };

    const styleDeclaration = {
        getPropertyValue: jest.fn((property) => styles[property] || ''),
        setProperty: jest.fn((property, value, priority) => {
            styles[property] = value;
        }),
        removeProperty: jest.fn((property) => {
            const value = styles[property] || '';
            delete styles[property];
            return value;
        }),
        item: jest.fn((index) => Object.keys(styles)[index] || ''),
        get length() {
            return Object.keys(styles).length;
        },
        get cssText() {
            return Object.entries(styles)
                .map(([prop, value]) => `${prop}: ${value}`)
                .join('; ');
        },
        set cssText(text) {
            // Clear existing styles
            Object.keys(styles).forEach((key) => delete styles[key]);
            // Parse new styles (simplified)
            text.split(';').forEach((rule) => {
                const [prop, value] = rule.split(':').map((s) => s.trim());
                if (prop && value) {
                    styles[prop] = value;
                }
            });
        },
    };

    // Add direct property access
    Object.keys(styles).forEach((prop) => {
        Object.defineProperty(styleDeclaration, prop, {
            get: () => styles[prop] || '',
            set: (value) => {
                styles[prop] = value;
            },
            enumerable: true,
            configurable: true,
        });
    });

    return styleDeclaration;
}

/**
 * Create a mock Document
 */
function createMockDocument() {
    const doc = createEnhancedDOMElement('document', {});

    return {
        ...doc,
        nodeType: 9,
        documentElement: createEnhancedDOMElement('html'),
        head: createEnhancedDOMElement('head'),
        body: createEnhancedDOMElement('body'),

        createElement: jest.fn((tagName) => createEnhancedDOMElement(tagName)),
        createTextNode: jest.fn((text) => ({
            nodeType: 3,
            textContent: text,
            nodeValue: text,
            data: text,
        })),
        createDocumentFragment: jest.fn(() => ({
            nodeType: 11,
            children: [],
            appendChild: jest.fn(),
            querySelector: jest.fn(),
            querySelectorAll: jest.fn(),
        })),

        getElementById: jest.fn(),
        getElementsByClassName: jest.fn(),
        getElementsByTagName: jest.fn(),
        querySelector: jest.fn(),
        querySelectorAll: jest.fn(),

        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),

        readyState: 'complete',
        URL: 'http://localhost/',
        domain: 'localhost',
        title: 'Test Document',

        // Mock specific
        _mockType: 'MockDocument',
    };
}

/**
 * Create a mock Window
 */
function createMockWindow() {
    return {
        document: createMockDocument(),
        location: {
            href: 'http://localhost/',
            origin: 'http://localhost',
            protocol: 'http:',
            host: 'localhost',
            hostname: 'localhost',
            port: '',
            pathname: '/',
            search: '',
            hash: '',
        },
        navigator: {
            userAgent: 'Mozilla/5.0 (Test Environment)',
            platform: 'Test',
            language: 'en-US',
            languages: ['en-US', 'en'],
            onLine: true,
        },
        screen: {
            width: 1920,
            height: 1080,
            availWidth: 1920,
            availHeight: 1040,
            colorDepth: 24,
            pixelDepth: 24,
        },
        innerWidth: 1024,
        innerHeight: 768,
        outerWidth: 1024,
        outerHeight: 768,
        devicePixelRatio: 1,

        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),

        setTimeout: jest.fn((fn, delay) => setTimeout(fn, delay)),
        clearTimeout: jest.fn((id) => clearTimeout(id)),
        setInterval: jest.fn((fn, delay) => setInterval(fn, delay)),
        clearInterval: jest.fn((id) => clearInterval(id)),

        requestAnimationFrame: jest.fn((fn) => setTimeout(fn, 16)),
        cancelAnimationFrame: jest.fn((id) => clearTimeout(id)),

        getComputedStyle: jest.fn(() => createMockCSSStyleDeclaration()),
        matchMedia: jest.fn(() => ({
            matches: false,
            media: '',
            onchange: null,
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
        })),

        // Mock specific
        _mockType: 'MockWindow',
    };
}

module.exports = {
    createEnhancedDOMElement,
    createMockClassList,
    createMockCSSStyleDeclaration,
    createMockDocument,
    createMockWindow,
};
