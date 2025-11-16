/**
 * Integration test for error recovery mechanisms
 * Tests that error recovery is properly integrated into the game initialization
 */

const { ErrorHandler } = require('./ErrorHandler.js');
const { ErrorRecovery } = require('./ErrorRecovery.js');

describe('Error Recovery Integration', () => {
    let errorHandler;
    let errorRecovery;

    beforeEach(() => {
        document.body.innerHTML = '';
        errorHandler = new ErrorHandler();
        errorHandler.init();
        errorRecovery = new ErrorRecovery(errorHandler);
    });

    afterEach(() => {
        if (errorHandler) {
            errorHandler.clearAll();
        }
    });

    describe('Component Initialization with Recovery', () => {
        it('should initialize a component successfully', async () => {
            const mockComponent = { name: 'TestComponent', initialized: true };
            
            errorRecovery.registerStrategy('TestComponent', {
                initialize: jest.fn().mockResolvedValue(mockComponent),
                critical: true,
                maxRetries: 3
            });

            const result = await errorRecovery.initializeWithRecovery('TestComponent');
            
            expect(result).toBe(mockComponent);
            expect(result.initialized).toBe(true);
        });

        it('should retry failed initialization', async () => {
            const mockComponent = { name: 'TestComponent', initialized: true };
            let attemptCount = 0;
            
            errorRecovery.registerStrategy('TestComponent', {
                initialize: jest.fn().mockImplementation(async () => {
                    attemptCount++;
                    if (attemptCount < 2) {
                        throw new Error('Initialization failed');
                    }
                    return mockComponent;
                }),
                critical: true,
                maxRetries: 3
            });

            // Mock delay to speed up test
            jest.spyOn(errorRecovery, 'delay').mockResolvedValue();

            const result = await errorRecovery.initializeWithRecovery('TestComponent');
            
            expect(result).toBe(mockComponent);
            expect(attemptCount).toBe(2);
        });

        it('should use fallback for non-critical component', async () => {
            const fallbackComponent = { name: 'FallbackComponent', simplified: true };
            
            errorRecovery.registerStrategy('TestComponent', {
                initialize: jest.fn().mockRejectedValue(new Error('Init failed')),
                fallback: jest.fn().mockResolvedValue(fallbackComponent),
                critical: false,
                maxRetries: 1
            });

            // Mock delay to speed up test
            jest.spyOn(errorRecovery, 'delay').mockResolvedValue();

            const result = await errorRecovery.initializeWithRecovery('TestComponent');
            
            expect(result).toBe(fallbackComponent);
            expect(result.simplified).toBe(true);
            expect(errorRecovery.isInFallbackMode()).toBe(true);
        });

        it('should disable non-critical feature when all recovery fails', async () => {
            errorRecovery.registerStrategy('TestComponent', {
                initialize: jest.fn().mockRejectedValue(new Error('Init failed')),
                fallback: jest.fn().mockRejectedValue(new Error('Fallback failed')),
                critical: false,
                maxRetries: 1
            });

            // Mock delay to speed up test
            jest.spyOn(errorRecovery, 'delay').mockResolvedValue();

            const result = await errorRecovery.initializeWithRecovery('TestComponent');
            
            expect(result).toBeNull();
            expect(errorRecovery.isFeatureDisabled('TestComponent')).toBe(true);
        });

        it('should throw error for critical component when recovery fails', async () => {
            errorRecovery.registerStrategy('CriticalComponent', {
                initialize: jest.fn().mockRejectedValue(new Error('Critical init failed')),
                fallback: null,
                critical: true,
                maxRetries: 1
            });

            // Mock delay to speed up test
            jest.spyOn(errorRecovery, 'delay').mockResolvedValue();

            await expect(
                errorRecovery.initializeWithRecovery('CriticalComponent')
            ).rejects.toThrow('Critical init failed');
        });
    });

    describe('Runtime Error Recovery', () => {
        it('should handle rendering errors with fallback', () => {
            const simplifiedRenderer = jest.fn();
            const error = new Error('Rendering failed');

            const result = errorRecovery.handleRenderingError(error, simplifiedRenderer);

            expect(result).toBe(true);
            expect(simplifiedRenderer).toHaveBeenCalled();
            expect(errorRecovery.isInFallbackMode()).toBe(true);
        });

        it('should handle feature runtime errors', () => {
            const disableCallback = jest.fn();
            const error = new Error('Feature error');

            errorRecovery.handleFeatureRuntimeError('TestFeature', error, disableCallback);

            // Should show error message
            const errorElement = document.querySelector('.error-message');
            expect(errorElement).toBeTruthy();
        });

        it('should wrap functions with error recovery', () => {
            const fn = jest.fn().mockReturnValue('success');
            const wrapped = errorRecovery.wrapWithRecovery(fn, 'TestFeature');

            const result = wrapped('arg1', 'arg2');

            expect(result).toBe('success');
            expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
        });

        it('should use fallback when wrapped function fails', () => {
            const fn = jest.fn().mockImplementation(() => {
                throw new Error('Function failed');
            });
            const fallback = jest.fn().mockReturnValue('fallback result');
            const wrapped = errorRecovery.wrapWithRecovery(fn, 'TestFeature', fallback);

            const result = wrapped('arg1');

            expect(result).toBe('fallback result');
            expect(fallback).toHaveBeenCalledWith('arg1');
        });

        it('should create safe update loop that handles errors', () => {
            const updateFn = jest.fn();
            const safeUpdate = errorRecovery.createSafeUpdateLoop(updateFn, 'TestComponent');

            // Should execute normally
            safeUpdate('arg1');
            expect(updateFn).toHaveBeenCalledWith('arg1');

            // Should handle errors without throwing
            updateFn.mockImplementation(() => {
                throw new Error('Update failed');
            });
            
            expect(() => safeUpdate('arg2')).not.toThrow();
        });

        it('should disable feature after too many errors in update loop', () => {
            const updateFn = jest.fn().mockImplementation(() => {
                throw new Error('Update failed');
            });
            const safeUpdate = errorRecovery.createSafeUpdateLoop(updateFn, 'TestComponent');

            // Trigger multiple errors
            for (let i = 0; i < 5; i++) {
                safeUpdate();
            }

            expect(errorRecovery.isFeatureDisabled('TestComponent')).toBe(true);
        });
    });

    describe('Recovery Status', () => {
        it('should track failed components', async () => {
            errorRecovery.registerStrategy('FailedComponent', {
                initialize: jest.fn().mockRejectedValue(new Error('Failed')),
                critical: false,
                maxRetries: 1
            });

            jest.spyOn(errorRecovery, 'delay').mockResolvedValue();

            await errorRecovery.initializeWithRecovery('FailedComponent');

            const failedComponents = errorRecovery.getFailedComponents();
            expect(failedComponents).toContain('FailedComponent');
        });

        it('should track disabled features', () => {
            errorRecovery.disableFeature('Feature1');
            errorRecovery.disableFeature('Feature2');

            const disabledFeatures = errorRecovery.getDisabledFeatures();
            expect(disabledFeatures).toContain('Feature1');
            expect(disabledFeatures).toContain('Feature2');
        });

        it('should provide comprehensive status report', () => {
            errorRecovery.disableFeature('Feature1');
            errorRecovery.failedComponents.add('Component1');
            errorRecovery.fallbackMode = true;
            errorRecovery.registerStrategy('TestComponent', {
                initialize: jest.fn()
            });

            const status = errorRecovery.getStatus();

            expect(status.fallbackMode).toBe(true);
            expect(status.disabledFeatures).toContain('Feature1');
            expect(status.failedComponents).toContain('Component1');
            expect(status.registeredStrategies).toContain('TestComponent');
        });

        it('should reset recovery state', () => {
            errorRecovery.disableFeature('Feature1');
            errorRecovery.failedComponents.add('Component1');
            errorRecovery.fallbackMode = true;

            errorRecovery.reset();

            expect(errorRecovery.isFeatureDisabled('Feature1')).toBe(false);
            expect(errorRecovery.failedComponents.size).toBe(0);
            expect(errorRecovery.fallbackMode).toBe(false);
        });
    });

    describe('Error Handler Integration', () => {
        it('should display error messages through error handler', () => {
            const error = new Error('Test error');
            
            errorHandler.handleInitializationError(error, null, 'TestComponent');

            const errorElement = document.querySelector('.error-message');
            expect(errorElement).toBeTruthy();
            expect(errorElement.textContent).toContain('TestComponent');
        });

        it('should show warnings for disabled features', () => {
            errorRecovery.disableFeature('TestFeature');

            const warningElement = document.querySelector('.error-message.warning');
            expect(warningElement).toBeTruthy();
        });

        it('should provide retry functionality', () => {
            const retryCallback = jest.fn();
            const error = new Error('Init failed');

            errorHandler.handleInitializationError(error, retryCallback, 'TestComponent');

            const retryButton = document.querySelector('.error-action-btn.primary');
            expect(retryButton).toBeTruthy();
            expect(retryButton.textContent).toContain('Retry');
        });
    });
});
