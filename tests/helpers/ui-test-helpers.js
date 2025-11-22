/**
 * UI Test Helper Module
 * Provides utilities for consistently setting up UI component tests
 */

/**
 * Set up a UI component test with mock DOM elements
 * @param {Array<string>} elementIds - IDs of elements to create
 * @param {Object} options - Additional configuration
 * @returns {Object} Mock elements and cleanup function
 */
function setupUITest(elementIds = [], options = {}) {
    const mockElements = {};

    // Create mock elements for each ID
    elementIds.forEach(id => {
        mockElements[id] = global.createMockDOMElement('div', { id, ...options });
    });

    // Store original document methods
    const originalGetElementById = document.getElementById;
    const originalQuerySelectorAll = document.querySelectorAll;

    // Override document.getElementById to return our mocks
    document.getElementById = jest.fn((id) => {
        return mockElements[id] || null;
    });

    // Override querySelectorAll for button groups, etc.
    document.querySelectorAll = jest.fn((selector) => {
        // Handle common selectors
        if (options.buttonGroups && options.buttonGroups[selector]) {
            return options.buttonGroups[selector];
        }
        return [];
    });

    return {
        mockElements,
        cleanup: () => {
            document.getElementById = originalGetElementById;
            document.querySelectorAll = originalQuerySelectorAll;
        }
    };
}

/**
 * Create a mock button group for UI tests
 * @param {Array<Object>} buttons - Array of button configurations
 * @returns {Array} Mock button elements
 */
function createMockButtonGroup(buttons = []) {
    return buttons.map(config => {
        const button = global.createMockDOMElement('button', {
            className: config.className || 'btn',
            dataset: config.dataset || {}
        });
        return button;
    });
}

/**
 * Create a complete UI panel mock with common elements
 * @param {string} panelId - Panel ID
 * @returns {Object} Mock panel with common child elements
 */
function createMockPanel(panelId) {
    const panel = global.createMockDOMElement('div', { id: panelId });

    // Add common panel elements
    panel.querySelector = jest.fn((selector) => {
        if (selector === '.close-button') {
            return global.createMockDOMElement('button', { className: 'close-button' });
        }
        if (selector === '.panel-content') {
            return global.createMockDOMElement('div', { className: 'panel-content' });
        }
        return null;
    });

    return panel;
}

module.exports = {
    setupUITest,
    createMockButtonGroup,
    createMockPanel
};
