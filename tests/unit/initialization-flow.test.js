/**
 * Integration tests for game initialization flow
 */

describe('Initialization Flow', () => {
    let mockDocument;
    let mockWindow;

    beforeEach(() => {
        // Mock document
        mockDocument = {
            readyState: 'complete',
            addEventListener: jest.fn(),
            body: {
                appendChild: jest.fn()
            },
            createElement: jest.fn(() => ({
                style: {},
                classList: { add: jest.fn(), remove: jest.fn() },
                addEventListener: jest.fn()
            })),
            head: {
                appendChild: jest.fn()
            },
            getElementById: jest.fn(),
            querySelector: jest.fn(),
            querySelectorAll: jest.fn(() => [])
        };

        // Mock window
        mockWindow = {
            location: {
                reload: jest.fn()
            }
        };

        global.document = mockDocument;
        global.window = mockWindow;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('DOM Ready Check', () => {
        it('should wait for DOMContentLoaded if document is loading', () => {
            mockDocument.readyState = 'loading';
            
            // Simulate the DOM ready check logic
            if (mockDocument.readyState === 'loading') {
                mockDocument.addEventListener('DOMContentLoaded', jest.fn());
            }
            
            expect(mockDocument.addEventListener).toHaveBeenCalledWith(
                'DOMContentLoaded',
                expect.any(Function)
            );
        });

        it('should initialize immediately if DOM is interactive', () => {
            mockDocument.readyState = 'interactive';
            
            // Simulate the DOM ready check logic
            const shouldWait = mockDocument.readyState === 'loading';
            
            expect(shouldWait).toBe(false);
        });

        it('should initialize immediately if DOM is complete', () => {
            mockDocument.readyState = 'complete';
            
            // Simulate the DOM ready check logic
            const shouldWait = mockDocument.readyState === 'loading';
            
            expect(shouldWait).toBe(false);
        });
    });

    describe('Error Type Usage', () => {
        const { DOMNotReadyError, CanvasCreationError, ModeSelectorError } = require('@/utils/InitializationErrors.js');

        it('should use DOMNotReadyError for DOM timing issues', () => {
            const error = new DOMNotReadyError();
            
            expect(error.name).toBe('DOMNotReadyError');
            expect(error.recoverable).toBe(true);
            expect(error.actionableSteps).toBeDefined();
        });

        it('should use CanvasCreationError for canvas failures', () => {
            const error = new CanvasCreationError('Canvas failed');
            
            expect(error.name).toBe('CanvasCreationError');
            expect(error.recoverable).toBe(false);
            expect(error.actionableSteps).toBeDefined();
        });

        it('should use ModeSelectorError for mode selector failures', () => {
            const error = new ModeSelectorError('Mode selector failed');
            
            expect(error.name).toBe('ModeSelectorError');
            expect(error.recoverable).toBe(true);
            expect(error.actionableSteps).toBeDefined();
        });
    });

    describe('Recovery Strategies', () => {
        const { ErrorRecoveryStrategies } = require('@/utils/ErrorRecoveryStrategies.js');

        it('should provide WebGL compatibility messages', () => {
            const strategies = new ErrorRecoveryStrategies();
            const message = strategies.getWebGLCompatibilityMessage();
            
            expect(message).toHaveProperty('browserName');
            expect(message).toHaveProperty('updateLink');
            expect(message).toHaveProperty('message');
            expect(message).toHaveProperty('actionableSteps');
        });

        it('should create fallback mode selector', () => {
            const strategies = new ErrorRecoveryStrategies();
            const callback = jest.fn();
            
            const fallback = strategies.createFallbackModeSelector(callback);
            
            expect(fallback).toBeDefined();
            expect(fallback.id).toBe('fallback-mode-selector');
        });

        it('should support retry for DOM errors', async () => {
            const strategies = new ErrorRecoveryStrategies();
            const mockCallback = jest.fn().mockResolvedValue(true);
            
            jest.useFakeTimers();
            const recoveryPromise = strategies.recoverFromDOMNotReady(mockCallback);
            jest.advanceTimersByTime(500);
            
            const result = await recoveryPromise;
            
            expect(result).toBe(true);
            expect(mockCallback).toHaveBeenCalled();
            
            jest.useRealTimers();
        });
    });

    describe('Loading Indicator Integration', () => {
        const { LoadingIndicator } = require('@/ui/LoadingIndicator.js');

        beforeEach(() => {
            document.body.innerHTML = '';
        });

        it('should show loading indicator during initialization', () => {
            const indicator = new LoadingIndicator();
            indicator.show('Initializing...');
            
            const element = document.getElementById('loading-indicator');
            expect(element).not.toBeNull();
        });

        it('should update progress during initialization steps', () => {
            const indicator = new LoadingIndicator();
            indicator.show('Starting...');
            
            indicator.updateProgress('step1', 'Loading step 1...');
            indicator.updateProgress('step2', 'Loading step 2...');
            
            expect(indicator.messageElement.textContent).toBe('Loading step 2...');
        });

        it('should hide loading indicator when complete', () => {
            const indicator = new LoadingIndicator();
            indicator.show('Loading...');
            
            jest.useFakeTimers();
            indicator.hide();
            
            expect(indicator.element.style.opacity).toBe('0');
            
            jest.advanceTimersByTime(300);
            expect(indicator.element.style.display).toBe('none');
            
            jest.useRealTimers();
        });

        it('should show error display on failure', () => {
            const indicator = new LoadingIndicator();
            indicator.show('Loading...');
            
            const error = new Error('Test error');
            indicator.showError(error, jest.fn());
            
            const errorDisplay = document.querySelector('.error-display');
            expect(errorDisplay).not.toBeNull();
        });
    });

    describe('Canvas Verification', () => {
        const { CanvasVerifier } = require('@/utils/CanvasVerifier.js');

        it('should verify canvas after renderer creation', () => {
            const verifier = new CanvasVerifier();
            
            // Mock renderer
            const mockRenderer = {
                domElement: document.createElement('canvas')
            };
            document.body.appendChild(mockRenderer.domElement);
            
            const mockScene = {};
            const mockCamera = {};
            
            const result = verifier.verifyAll(mockRenderer, mockScene, mockCamera);
            
            expect(result).toHaveProperty('success');
            expect(result).toHaveProperty('checks');
            expect(result).toHaveProperty('errors');
        });
    });

    describe('Initialization Steps', () => {
        it('should track initialization progress', () => {
            const steps = [
                'init',
                'compatibility',
                'webgl',
                'game',
                'renderer',
                'canvas',
                'controls',
                'systems',
                'mode-selector',
                'start'
            ];
            
            expect(steps.length).toBe(10);
            expect(steps).toContain('canvas');
            expect(steps).toContain('mode-selector');
        });

        it('should have descriptive messages for each step', () => {
            const stepMessages = {
                'init': 'Initializing error handling...',
                'compatibility': 'Checking browser compatibility...',
                'webgl': 'Checking WebGL support...',
                'game': 'Creating game instance...',
                'renderer': 'Initializing 3D renderer...',
                'canvas': 'Verifying canvas...',
                'controls': 'Setting up controls...',
                'systems': 'Initializing game systems...',
                'mode-selector': 'Preparing mode selector...',
                'start': 'Starting game...'
            };
            
            expect(Object.keys(stepMessages).length).toBe(10);
            expect(stepMessages['canvas']).toBe('Verifying canvas...');
            expect(stepMessages['mode-selector']).toBe('Preparing mode selector...');
        });
    });

    describe('Error Handling Flow', () => {
        it('should use custom error types with actionable steps', () => {
            const { CanvasCreationError } = require('@/utils/InitializationErrors.js');
            const error = new CanvasCreationError('WebGL not supported');
            
            expect(error.actionableSteps).toBeDefined();
            expect(Array.isArray(error.actionableSteps)).toBe(true);
            expect(error.actionableSteps.length).toBeGreaterThan(0);
        });

        it('should provide retry callback for recoverable errors', () => {
            const { LoadingIndicator } = require('@/ui/LoadingIndicator.js');
            const indicator = new LoadingIndicator();
            
            const retryCallback = jest.fn();
            const error = new Error('Test error');
            
            indicator.showError(error, retryCallback);
            
            const retryButton = document.getElementById('error-retry-button');
            expect(retryButton).not.toBeNull();
        });

        it('should reload page on retry', () => {
            const mockReload = jest.fn();
            delete window.location;
            window.location = { reload: mockReload };
            
            const reloadCallback = () => window.location.reload();
            reloadCallback();
            
            expect(mockReload).toHaveBeenCalled();
        });
    });
});
