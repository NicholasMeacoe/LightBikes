const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
};

const MockLoggerClass = jest.fn().mockImplementation(() => mockLogger);
MockLoggerClass.create = jest.fn((namespace) => mockLogger);

jest.mock('@/utils/Logger.js', () => ({
    Logger: MockLoggerClass,
    logger: mockLogger,
    createLogger: jest.fn(() => mockLogger),
}));

const { LoadingIndicator } = require('@/ui/LoadingIndicator.js');

describe('LoadingIndicator', () => {
    let loadingIndicator;

    beforeEach(() => {
        document.body.innerHTML = '';
        loadingIndicator = new LoadingIndicator();
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('constructor', () => {
        it('should initialize with null element', () => {
            expect(loadingIndicator.element).toBeNull();
            expect(loadingIndicator.messageElement).toBeNull();
            expect(loadingIndicator.stylesAdded).toBe(false);
        });
    });

    describe('show', () => {
        it('should create loading overlay element', () => {
            loadingIndicator.show('Loading...');

            const element = document.getElementById('loading-indicator');
            expect(element).not.toBeNull();
            expect(element.className).toBe('loading-indicator');
        });

        it('should display default message when no message provided', () => {
            loadingIndicator.show();

            const messageElement = document.querySelector('.loading-message');
            expect(messageElement.textContent).toBe('Loading...');
        });

        it('should display custom message', () => {
            loadingIndicator.show('Initializing game...');

            const messageElement = document.querySelector('.loading-message');
            expect(messageElement.textContent).toBe('Initializing game...');
        });

        it('should create spinner element', () => {
            loadingIndicator.show();

            const spinner = document.querySelector('.loading-spinner');
            expect(spinner).not.toBeNull();
        });

        it('should append element to body', () => {
            loadingIndicator.show();

            expect(document.body.contains(loadingIndicator.element)).toBe(true);
        });

        it('should set display to flex', () => {
            loadingIndicator.show();

            expect(loadingIndicator.element.style.display).toBe('flex');
        });

        it('should add styles on first show', () => {
            loadingIndicator.show();

            const styleElement = document.getElementById('loading-indicator-styles');
            expect(styleElement).not.toBeNull();
            expect(loadingIndicator.stylesAdded).toBe(true);
        });

        it('should not duplicate styles on subsequent shows', () => {
            loadingIndicator.show();
            loadingIndicator.show();

            const styleElements = document.querySelectorAll('#loading-indicator-styles');
            expect(styleElements.length).toBe(1);
        });

        it('should update message if already shown', () => {
            loadingIndicator.show('First message');
            loadingIndicator.show('Second message');

            const messageElement = document.querySelector('.loading-message');
            expect(messageElement.textContent).toBe('Second message');
        });

        it('should set z-index to 9999 in styles', () => {
            loadingIndicator.show();

            const styleElement = document.getElementById('loading-indicator-styles');
            expect(styleElement.textContent).toContain('z-index: 9999');
        });
    });

    describe('updateProgress', () => {
        beforeEach(() => {
            loadingIndicator.show('Initial message');
        });

        it('should update message element with new message', () => {
            loadingIndicator.updateProgress('step1', 'Loading step 1...');

            expect(loadingIndicator.messageElement.textContent).toBe('Loading step 1...');
        });

        it('should use step as message if message not provided', () => {
            loadingIndicator.updateProgress('step1');

            expect(loadingIndicator.messageElement.textContent).toBe('step1');
        });

        it('should handle null message by using step', () => {
            loadingIndicator.updateProgress('step1', null);

            expect(loadingIndicator.messageElement.textContent).toBe('step1');
        });

        it('should do nothing if messageElement is null', () => {
            loadingIndicator.messageElement = null;

            expect(() => {
                loadingIndicator.updateProgress('step', 'message');
            }).not.toThrow();
        });
    });

    describe('hide', () => {
        beforeEach(() => {
            loadingIndicator.show('Loading...');
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should set opacity to 0 immediately', () => {
            loadingIndicator.hide();

            expect(loadingIndicator.element.style.opacity).toBe('0');
        });

        it('should set display to none after 300ms', () => {
            loadingIndicator.hide();

            expect(loadingIndicator.element.style.display).toBe('flex');

            jest.advanceTimersByTime(300);

            expect(loadingIndicator.element.style.display).toBe('none');
        });

        it('should reset opacity to 1 after hiding', () => {
            loadingIndicator.hide();

            jest.advanceTimersByTime(300);

            expect(loadingIndicator.element.style.opacity).toBe('1');
        });

        it('should do nothing if element is null', () => {
            loadingIndicator.element = null;

            expect(() => {
                loadingIndicator.hide();
            }).not.toThrow();
        });
    });

    describe('showError', () => {
        it('should create element if not already shown', () => {
            const error = new Error('Test error');
            loadingIndicator.showError(error);

            expect(loadingIndicator.element).not.toBeNull();
        });

        it('should display error title', () => {
            const error = new Error('Test error');
            error.name = 'TestError';
            loadingIndicator.showError(error);

            const title = document.querySelector('.error-title');
            expect(title.textContent).toBe('TestError');
        });

        it('should display default error title if name not provided', () => {
            const error = new Error('Test error');
            delete error.name;
            loadingIndicator.showError(error);

            const title = document.querySelector('.error-title');
            expect(title.textContent).toBe('Initialization Error');
        });

        it('should display error message', () => {
            const error = new Error('Test error message');
            loadingIndicator.showError(error);

            const message = document.querySelector('.error-message');
            expect(message.textContent).toBe('Test error message');
        });

        it('should display default message if error message not provided', () => {
            const error = new Error();
            loadingIndicator.showError(error);

            const message = document.querySelector('.error-message');
            expect(message.textContent).toBe('An unexpected error occurred');
        });

        it('should display technical details if stack available', () => {
            const error = new Error('Test error');
            error.stack = 'Error: Test error\n  at test.js:1:1';
            loadingIndicator.showError(error);

            const details = document.querySelector('.error-details');
            expect(details).not.toBeNull();
            expect(details.innerHTML).toContain(error.stack);
        });

        it('should not display technical details if stack not available', () => {
            const error = new Error('Test error');
            delete error.stack;
            loadingIndicator.showError(error);

            const details = document.querySelector('.error-details');
            expect(details).toBeNull();
        });

        it('should display actionable steps for WebGL errors', () => {
            const error = new Error('WebGL not supported');
            loadingIndicator.showError(error);

            const steps = document.querySelector('.error-steps');
            expect(steps).not.toBeNull();
            expect(steps.innerHTML).toContain('Update your browser');
            expect(steps.innerHTML).toContain('hardware acceleration');
        });

        it('should display actionable steps for DOM errors', () => {
            const error = new Error('DOM not ready');
            loadingIndicator.showError(error);

            const steps = document.querySelector('.error-steps');
            expect(steps).not.toBeNull();
            expect(steps.innerHTML).toContain('Refresh the page');
        });

        it('should display actionable steps for canvas errors', () => {
            const error = new Error('canvas creation failed');
            loadingIndicator.showError(error);

            const steps = document.querySelector('.error-steps');
            expect(steps).not.toBeNull();
            expect(steps.innerHTML).toContain('Refresh the page');
        });

        it('should display generic actionable steps for unknown errors', () => {
            const error = new Error('Unknown error');
            loadingIndicator.showError(error);

            const steps = document.querySelector('.error-steps');
            expect(steps).not.toBeNull();
            expect(steps.innerHTML).toContain('Refresh the page');
        });

        it('should create retry button if callback provided', () => {
            const error = new Error('Test error');
            const callback = jest.fn();
            loadingIndicator.showError(error, callback);

            const button = document.getElementById('error-retry-button');
            expect(button).not.toBeNull();
            expect(button.textContent).toBe('Retry');
        });

        it('should not create retry button if callback not provided', () => {
            const error = new Error('Test error');
            loadingIndicator.showError(error);

            const button = document.getElementById('error-retry-button');
            expect(button).toBeNull();
        });

        it('should call retry callback when button clicked', () => {
            const error = new Error('Test error');
            const callback = jest.fn();
            loadingIndicator.showError(error, callback);

            const button = document.getElementById('error-retry-button');
            button.click();

            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should set display to flex', () => {
            const error = new Error('Test error');
            loadingIndicator.showError(error);

            expect(loadingIndicator.element.style.display).toBe('flex');
        });

        it('should transform existing loading overlay', () => {
            loadingIndicator.show('Loading...');
            const originalElement = loadingIndicator.element;

            const error = new Error('Test error');
            loadingIndicator.showError(error);

            expect(loadingIndicator.element).toBe(originalElement);
            expect(document.querySelector('.loading-spinner')).toBeNull();
            expect(document.querySelector('.error-display')).not.toBeNull();
        });
    });

    describe('_getActionableSteps', () => {
        it('should use custom actionableSteps if provided', () => {
            const error = new Error('Custom error');
            error.actionableSteps = ['Step 1', 'Step 2', 'Step 3'];

            const steps = loadingIndicator._getActionableSteps(error);

            expect(steps).toEqual(['Step 1', 'Step 2', 'Step 3']);
        });

        it('should return WebGL steps for WebGL errors', () => {
            const error = new Error('WebGL not supported');
            const steps = loadingIndicator._getActionableSteps(error);

            expect(steps).toContain('Update your browser to the latest version');
            expect(steps).toContain('Enable hardware acceleration in browser settings');
            expect(steps).toContain('Try a different browser (Chrome, Firefox, or Edge)');
        });

        it('should return DOM steps for DOM errors', () => {
            const error = new Error('DOM not ready');
            const steps = loadingIndicator._getActionableSteps(error);

            expect(steps).toContain('Refresh the page');
            expect(steps).toContain('Clear your browser cache');
            expect(steps).toContain('Disable browser extensions that might interfere');
        });

        it('should return canvas steps for canvas errors', () => {
            const error = new Error('canvas creation failed');
            const steps = loadingIndicator._getActionableSteps(error);

            expect(steps).toContain('Refresh the page');
            expect(steps).toContain('Clear your browser cache');
        });

        it('should return mode selector steps for mode selector errors', () => {
            const error = new Error('Mode Selector failed');
            const steps = loadingIndicator._getActionableSteps(error);

            expect(steps).toContain('Refresh the page');
            expect(steps).toContain('Check if JavaScript is enabled');
        });

        it('should return generic steps for unknown errors', () => {
            const error = new Error('Unknown error');
            const steps = loadingIndicator._getActionableSteps(error);

            expect(steps).toContain('Refresh the page');
            expect(steps).toContain('Try again in a few moments');
        });

        it('should handle errors without message', () => {
            const error = new Error();
            const steps = loadingIndicator._getActionableSteps(error);

            expect(steps.length).toBeGreaterThan(0);
        });
    });

    describe('_addStyles', () => {
        it('should add style element to head', () => {
            loadingIndicator._addStyles();

            const styleElement = document.getElementById('loading-indicator-styles');
            expect(styleElement).not.toBeNull();
            expect(styleElement.parentNode).toBe(document.head);
        });

        it('should not duplicate styles if already added', () => {
            loadingIndicator._addStyles();
            loadingIndicator._addStyles();

            const styleElements = document.querySelectorAll('#loading-indicator-styles');
            expect(styleElements.length).toBe(1);
        });

        it('should include loading indicator styles', () => {
            loadingIndicator._addStyles();

            const styleElement = document.getElementById('loading-indicator-styles');
            expect(styleElement.textContent).toContain('.loading-indicator');
            expect(styleElement.textContent).toContain('.loading-spinner');
            expect(styleElement.textContent).toContain('.loading-message');
        });

        it('should include error display styles', () => {
            loadingIndicator._addStyles();

            const styleElement = document.getElementById('loading-indicator-styles');
            expect(styleElement.textContent).toContain('.error-display');
            expect(styleElement.textContent).toContain('.error-title');
            expect(styleElement.textContent).toContain('.error-message');
            expect(styleElement.textContent).toContain('.error-retry-button');
        });

        it('should include spinner animation', () => {
            loadingIndicator._addStyles();

            const styleElement = document.getElementById('loading-indicator-styles');
            expect(styleElement.textContent).toContain('@keyframes spin');
            expect(styleElement.textContent).toContain('rotate(360deg)');
        });

        it('should set z-index to 9999', () => {
            loadingIndicator._addStyles();

            const styleElement = document.getElementById('loading-indicator-styles');
            expect(styleElement.textContent).toContain('z-index: 9999');
        });
    });

    describe('integration', () => {
        it('should handle complete loading flow', () => {
            loadingIndicator.show('Starting...');
            expect(document.getElementById('loading-indicator')).not.toBeNull();

            loadingIndicator.updateProgress('step1', 'Loading step 1...');
            expect(loadingIndicator.messageElement.textContent).toBe('Loading step 1...');

            loadingIndicator.updateProgress('step2', 'Loading step 2...');
            expect(loadingIndicator.messageElement.textContent).toBe('Loading step 2...');

            loadingIndicator.hide();
            expect(loadingIndicator.element.style.opacity).toBe('0');
        });

        it('should handle error flow with retry', () => {
            loadingIndicator.show('Loading...');

            const error = new Error('Test error');
            const callback = jest.fn();
            loadingIndicator.showError(error, callback);

            expect(document.querySelector('.error-display')).not.toBeNull();

            const button = document.getElementById('error-retry-button');
            button.click();

            expect(callback).toHaveBeenCalled();
        });

        it('should handle show after error', () => {
            const error = new Error('Test error');
            loadingIndicator.showError(error);

            loadingIndicator.show('Retrying...');

            expect(document.querySelector('.loading-spinner')).not.toBeNull();
            expect(document.querySelector('.error-display')).toBeNull();
        });
    });
});
