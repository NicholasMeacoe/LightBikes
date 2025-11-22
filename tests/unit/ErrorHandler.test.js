const { ErrorHandler } = require('@/utils/ErrorHandler.js');

describe('ErrorHandler', () => {
    let errorHandler;

    beforeEach(() => {
        jest.useFakeTimers();
        // Clear document body
        document.body.innerHTML = '';
        errorHandler = new ErrorHandler();
    });

    afterEach(() => {
        jest.useRealTimers();
        if (errorHandler) {
            errorHandler.clearAll();
        }
    });

    describe('initialization', () => {
        it('should initialize when showing first error', () => {
            expect(errorHandler.initialized).toBe(false);
            errorHandler.showError('Test error');
            expect(errorHandler.initialized).toBe(true);
        });

        it('should create error container on init', () => {
            errorHandler.init();
            const container = document.getElementById('error-container');
            expect(container).toBeTruthy();
            expect(container.className).toBe('error-container');
        });

        it('should add styles on init', () => {
            errorHandler.init();
            const styles = document.getElementById('error-handler-styles');
            expect(styles).toBeTruthy();
        });

        it('should not reinitialize if already initialized', () => {
            errorHandler.init();
            const firstContainer = document.getElementById('error-container');
            errorHandler.init();
            const secondContainer = document.getElementById('error-container');
            expect(firstContainer).toBe(secondContainer);
        });
    });

    describe('showError', () => {
        it('should display error message', () => {
            const errorId = errorHandler.showError('Test error message');
            expect(errorId).toBeTruthy();
            expect(errorHandler.activeErrors.has(errorId)).toBe(true);
        });

        it('should create error element with correct content', () => {
            errorHandler.showError('Test error message', { title: 'Test Title' });
            const errorElement = document.querySelector('.error-message');
            expect(errorElement).toBeTruthy();
            expect(errorElement.textContent).toContain('Test Title');
            expect(errorElement.textContent).toContain('Test error message');
        });

        it('should apply correct type class', () => {
            errorHandler.showError('Warning message', { type: 'warning' });
            const errorElement = document.querySelector('.error-message');
            expect(errorElement.classList.contains('warning')).toBe(true);
        });

        it('should prevent duplicate errors with same ID', () => {
            errorHandler.showError('Test error', { id: 'test-1' });
            errorHandler.showError('Test error', { id: 'test-1' });
            const errorElements = document.querySelectorAll('.error-message');
            expect(errorElements.length).toBe(1);
        });

        it('should add close button', () => {
            errorHandler.showError('Test error');
            const closeButton = document.querySelector('.error-close');
            expect(closeButton).toBeTruthy();
        });

        it('should add action buttons when provided', () => {
            errorHandler.showError('Test error', {
                actions: [
                    { label: 'Action 1', callback: jest.fn() },
                    { label: 'Action 2', callback: jest.fn(), primary: true }
                ]
            });
            const actionButtons = document.querySelectorAll('.error-action-btn');
            expect(actionButtons.length).toBe(2);
            expect(actionButtons[0].textContent).toBe('Action 1');
            expect(actionButtons[1].textContent).toBe('Action 2');
            expect(actionButtons[1].classList.contains('primary')).toBe(true);
        });

        it('should auto-dismiss after duration', () => {
            const errorId = errorHandler.showError('Test error', { duration: 100 });
            expect(errorHandler.activeErrors.has(errorId)).toBe(true);

            // Wait for duration (100ms) + animation (300ms)
            jest.advanceTimersByTime(500);

            expect(errorHandler.activeErrors.has(errorId)).toBe(false);
        });

        it('should not auto-dismiss critical errors', () => {
            const errorId = errorHandler.showError('Critical error', { type: 'critical' });
            expect(errorHandler.activeErrors.has(errorId)).toBe(true);

            jest.advanceTimersByTime(6000);

            expect(errorHandler.activeErrors.has(errorId)).toBe(true);
        });

        it('should escape HTML in messages', () => {
            errorHandler.showError('<script>alert("xss")</script>');
            const errorBody = document.querySelector('.error-body');
            expect(errorBody.innerHTML).not.toContain('<script>');
            expect(errorBody.textContent).toContain('<script>');
        });
    });

    describe('dismissError', () => {
        it('should dismiss error by ID', () => {
            const errorId = errorHandler.showError('Test error', { duration: 0 });
            expect(errorHandler.activeErrors.has(errorId)).toBe(true);

            errorHandler.dismissError(errorId);

            jest.advanceTimersByTime(400);

            expect(errorHandler.activeErrors.has(errorId)).toBe(false);
        });

        it('should handle dismissing non-existent error', () => {
            expect(() => errorHandler.dismissError('non-existent')).not.toThrow();
        });

        it('should remove error element from DOM', () => {
            const errorId = errorHandler.showError('Test error', { duration: 0 });
            const errorElement = document.querySelector('.error-message');
            expect(errorElement).toBeTruthy();

            errorHandler.dismissError(errorId);

            jest.advanceTimersByTime(400);

            const removedElement = document.querySelector('.error-message');
            expect(removedElement).toBeFalsy();
        });
    });

    describe('clearAll', () => {
        it('should dismiss all active errors', () => {
            errorHandler.showError('Error 1', { duration: 0 });
            errorHandler.showError('Error 2', { duration: 0 });
            errorHandler.showError('Error 3', { duration: 0 });

            expect(errorHandler.activeErrors.size).toBe(3);
            errorHandler.clearAll();

            jest.advanceTimersByTime(400);

            expect(errorHandler.activeErrors.size).toBe(0);
        });
    });

    describe('handleInitializationError', () => {
        it('should show initialization error with retry button', () => {
            const retryCallback = jest.fn();
            const error = new Error('Init failed');

            errorHandler.handleInitializationError(error, retryCallback, 'TestComponent');

            const errorElement = document.querySelector('.error-message');
            expect(errorElement).toBeTruthy();
            expect(errorElement.textContent).toContain('TestComponent');
            expect(errorElement.textContent).toContain('Init failed');

            const retryButton = Array.from(document.querySelectorAll('.error-action-btn'))
                .find(btn => btn.textContent.includes('Retry'));
            expect(retryButton).toBeTruthy();
        });

        it('should track retry attempts', () => {
            const retryCallback = jest.fn();
            const error = new Error('Init failed');

            errorHandler.handleInitializationError(error, retryCallback, 'TestComponent');
            expect(errorHandler.getRetryAttempts('TestComponent')).toBe(0);

            const retryButton = Array.from(document.querySelectorAll('.error-action-btn'))
                .find(btn => btn.textContent.includes('Retry'));
            retryButton.click();

            expect(errorHandler.getRetryAttempts('TestComponent')).toBe(1);
            expect(retryCallback).toHaveBeenCalled();
        });

        it('should show critical error after max retries', () => {
            const retryCallback = jest.fn();
            const error = new Error('Init failed');

            // Simulate max retries
            errorHandler.retryAttempts.set('init-TestComponent', 3);

            errorHandler.handleInitializationError(error, retryCallback, 'TestComponent');

            const errorElement = document.querySelector('.error-message');
            expect(errorElement.classList.contains('critical')).toBe(true);
        });

        it('should include reload button', () => {
            const error = new Error('Init failed');
            errorHandler.handleInitializationError(error, null, 'TestComponent');

            const reloadButton = Array.from(document.querySelectorAll('.error-action-btn'))
                .find(btn => btn.textContent.includes('Reload'));
            expect(reloadButton).toBeTruthy();
        });
    });

    describe('handleWebGLError', () => {
        it('should show WebGL error message', () => {
            const error = new Error('WebGL not supported');
            errorHandler.handleWebGLError(error);

            const errorElement = document.querySelector('.error-message');
            expect(errorElement).toBeTruthy();
            expect(errorElement.classList.contains('critical')).toBe(true);
            expect(errorElement.textContent).toContain('WebGL');
        });

        it('should include learn more button', () => {
            const error = new Error('WebGL not supported');
            errorHandler.handleWebGLError(error);

            const learnMoreButton = Array.from(document.querySelectorAll('.error-action-btn'))
                .find(btn => btn.textContent.includes('Learn More'));
            expect(learnMoreButton).toBeTruthy();
        });
    });

    describe('handleRenderingError', () => {
        it('should show rendering error with fallback option', () => {
            const fallbackCallback = jest.fn();
            const error = new Error('Rendering failed');

            errorHandler.handleRenderingError(error, fallbackCallback);

            const errorElement = document.querySelector('.error-message');
            expect(errorElement).toBeTruthy();
            expect(errorElement.textContent).toContain('Rendering error');

            const fallbackButton = Array.from(document.querySelectorAll('.error-action-btn'))
                .find(btn => btn.textContent.includes('Simple Graphics'));
            expect(fallbackButton).toBeTruthy();
        });

        it('should call fallback callback when button clicked', () => {
            const fallbackCallback = jest.fn();
            const error = new Error('Rendering failed');

            errorHandler.handleRenderingError(error, fallbackCallback);

            const fallbackButton = Array.from(document.querySelectorAll('.error-action-btn'))
                .find(btn => btn.textContent.includes('Simple Graphics'));
            fallbackButton.click();

            expect(fallbackCallback).toHaveBeenCalled();
        });
    });

    describe('handleFeatureError', () => {
        it('should show feature error as warning', () => {
            const disableCallback = jest.fn();
            const error = new Error('Feature failed');

            errorHandler.handleFeatureError('TestFeature', error, disableCallback);

            const errorElement = document.querySelector('.error-message');
            expect(errorElement).toBeTruthy();
            expect(errorElement.classList.contains('warning')).toBe(true);
            expect(errorElement.textContent).toContain('TestFeature');
        });

        it('should include disable button', () => {
            const disableCallback = jest.fn();
            const error = new Error('Feature failed');

            errorHandler.handleFeatureError('TestFeature', error, disableCallback);

            const disableButton = Array.from(document.querySelectorAll('.error-action-btn'))
                .find(btn => btn.textContent.includes('Disable'));
            expect(disableButton).toBeTruthy();
        });

        it('should call disable callback when button clicked', () => {
            const disableCallback = jest.fn();
            const error = new Error('Feature failed');

            errorHandler.handleFeatureError('TestFeature', error, disableCallback);

            const disableButton = Array.from(document.querySelectorAll('.error-action-btn'))
                .find(btn => btn.textContent.includes('Disable'));
            disableButton.click();

            expect(disableCallback).toHaveBeenCalled();
        });
    });

    describe('showWarning', () => {
        it('should show warning message', () => {
            errorHandler.showWarning('Warning message');
            const errorElement = document.querySelector('.error-message');
            expect(errorElement.classList.contains('warning')).toBe(true);
        });

        it('should auto-dismiss warnings', () => {
            const errorId = errorHandler.showWarning('Warning message');
            expect(errorHandler.activeErrors.has(errorId)).toBe(true);

            jest.advanceTimersByTime(6000);

            expect(errorHandler.activeErrors.has(errorId)).toBe(false);
        });
    });

    describe('showInfo', () => {
        it('should show info message', () => {
            errorHandler.showInfo('Info message');
            const errorElement = document.querySelector('.error-message');
            expect(errorElement.classList.contains('info')).toBe(true);
        });

        it('should auto-dismiss info messages', () => {
            const errorId = errorHandler.showInfo('Info message');
            expect(errorHandler.activeErrors.has(errorId)).toBe(true);

            jest.advanceTimersByTime(5000);

            expect(errorHandler.activeErrors.has(errorId)).toBe(false);
        });
    });

    describe('resetRetries', () => {
        it('should reset retry attempts for component', () => {
            errorHandler.retryAttempts.set('init-TestComponent', 2);
            expect(errorHandler.getRetryAttempts('TestComponent')).toBe(2);

            errorHandler.resetRetries('TestComponent');
            expect(errorHandler.getRetryAttempts('TestComponent')).toBe(0);
        });
    });

    describe('action button callbacks', () => {
        it('should execute callback and dismiss error', () => {
            const callback = jest.fn();
            const errorId = errorHandler.showError('Test error', {
                duration: 0,
                actions: [{ label: 'Test Action', callback }]
            });

            const actionButton = document.querySelector('.error-action-btn');
            actionButton.click();

            expect(callback).toHaveBeenCalled();

            jest.advanceTimersByTime(400);

            expect(errorHandler.activeErrors.has(errorId)).toBe(false);
        });
    });

    describe('close button', () => {
        it('should dismiss error when close button clicked', () => {
            const errorId = errorHandler.showError('Test error', { duration: 0 });

            const closeButton = document.querySelector('.error-close');
            closeButton.click();

            jest.advanceTimersByTime(400);

            expect(errorHandler.activeErrors.has(errorId)).toBe(false);
        });
    });
});
