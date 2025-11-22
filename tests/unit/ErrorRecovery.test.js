const { ErrorRecovery } = require('@/utils/ErrorRecovery.js');
const { ErrorHandler } = require('@/utils/ErrorHandler.js');

describe('ErrorRecovery', () => {
    let errorRecovery;
    let errorHandler;

    beforeEach(() => {
        document.body.innerHTML = '';
        errorHandler = new ErrorHandler();
        errorRecovery = new ErrorRecovery(errorHandler);
    });

    afterEach(() => {
        if (errorHandler) {
            errorHandler.clearAll();
        }
    });

    describe('registerStrategy', () => {
        it('should register a recovery strategy', () => {
            const strategy = {
                initialize: jest.fn(),
                critical: true,
                maxRetries: 3
            };

            errorRecovery.registerStrategy('TestComponent', strategy);
            expect(errorRecovery.recoveryStrategies.has('TestComponent')).toBe(true);
        });

        it('should set default values for strategy', () => {
            const strategy = {
                initialize: jest.fn()
            };

            errorRecovery.registerStrategy('TestComponent', strategy);
            const registered = errorRecovery.recoveryStrategies.get('TestComponent');
            
            expect(registered.critical).toBe(true);
            expect(registered.maxRetries).toBe(3);
            expect(registered.retryCount).toBe(0);
        });
    });

    describe('initializeWithRecovery', () => {
        it('should initialize component successfully', async () => {
            const mockComponent = { name: 'test' };
            const strategy = {
                initialize: jest.fn().mockResolvedValue(mockComponent)
            };

            errorRecovery.registerStrategy('TestComponent', strategy);
            const result = await errorRecovery.initializeWithRecovery('TestComponent');

            expect(result).toBe(mockComponent);
            expect(strategy.initialize).toHaveBeenCalled();
        });

        it('should throw error if no strategy registered', async () => {
            await expect(
                errorRecovery.initializeWithRecovery('UnknownComponent')
            ).rejects.toThrow('No recovery strategy registered');
        });

        it('should reset retry count on successful initialization', async () => {
            const mockComponent = { name: 'test' };
            const strategy = {
                initialize: jest.fn().mockResolvedValue(mockComponent),
                retryCount: 2
            };

            errorRecovery.registerStrategy('TestComponent', strategy);
            await errorRecovery.initializeWithRecovery('TestComponent');

            const registered = errorRecovery.recoveryStrategies.get('TestComponent');
            expect(registered.retryCount).toBe(0);
        });

        it('should remove component from failed list on success', async () => {
            const mockComponent = { name: 'test' };
            const strategy = {
                initialize: jest.fn().mockResolvedValue(mockComponent)
            };

            errorRecovery.failedComponents.add('TestComponent');
            errorRecovery.registerStrategy('TestComponent', strategy);
            await errorRecovery.initializeWithRecovery('TestComponent');

            expect(errorRecovery.failedComponents.has('TestComponent')).toBe(false);
        });
    });

    describe('attemptRecovery', () => {
        it('should use fallback when max retries reached', async () => {
            const fallbackComponent = { name: 'fallback' };
            const strategy = {
                initialize: jest.fn().mockRejectedValue(new Error('Init failed')),
                fallback: jest.fn().mockResolvedValue(fallbackComponent),
                critical: false,
                maxRetries: 2,
                retryCount: 2
            };

            const result = await errorRecovery.attemptRecovery(
                'TestComponent',
                new Error('Init failed'),
                strategy
            );

            expect(result).toBe(fallbackComponent);
            expect(strategy.fallback).toHaveBeenCalled();
            expect(errorRecovery.fallbackMode).toBe(true);
        });

        it('should disable non-critical feature when fallback fails', async () => {
            const strategy = {
                initialize: jest.fn().mockRejectedValue(new Error('Init failed')),
                fallback: jest.fn().mockRejectedValue(new Error('Fallback failed')),
                critical: false,
                maxRetries: 2,
                retryCount: 2
            };

            const result = await errorRecovery.attemptRecovery(
                'TestComponent',
                new Error('Init failed'),
                strategy
            );

            expect(result).toBeNull();
            expect(errorRecovery.isFeatureDisabled('TestComponent')).toBe(true);
        });

        it('should throw error for critical component when recovery fails', async () => {
            const strategy = {
                initialize: jest.fn().mockRejectedValue(new Error('Init failed')),
                fallback: null,
                critical: true,
                maxRetries: 2,
                retryCount: 2
            };

            await expect(
                errorRecovery.attemptRecovery(
                    'TestComponent',
                    new Error('Init failed'),
                    strategy
                )
            ).rejects.toThrow('Init failed');
        });
    });

    describe('retryInitialization', () => {
        it('should retry initialization successfully', async () => {
            const mockComponent = { name: 'test' };
            const strategy = {
                initialize: jest.fn().mockResolvedValue(mockComponent),
                maxRetries: 3,
                retryCount: 1
            };

            errorRecovery.registerStrategy('TestComponent', strategy);
            const result = await errorRecovery.retryInitialization('TestComponent');

            expect(result).toBe(mockComponent);
            expect(strategy.initialize).toHaveBeenCalled();
        });

        it('should reset retry count on successful retry', async () => {
            const mockComponent = { name: 'test' };
            const strategy = {
                initialize: jest.fn().mockResolvedValue(mockComponent),
                maxRetries: 3,
                retryCount: 2
            };

            errorRecovery.registerStrategy('TestComponent', strategy);
            await errorRecovery.retryInitialization('TestComponent');

            const registered = errorRecovery.recoveryStrategies.get('TestComponent');
            expect(registered.retryCount).toBe(0);
        });
    });

    describe('disableFeature', () => {
        it('should disable a feature', () => {
            errorRecovery.disableFeature('TestFeature');
            expect(errorRecovery.isFeatureDisabled('TestFeature')).toBe(true);
        });

        it('should show warning when disabling feature', () => {
            const showWarningSpy = jest.spyOn(errorHandler, 'showWarning');
            errorRecovery.disableFeature('TestFeature');
            expect(showWarningSpy).toHaveBeenCalled();
        });
    });

    describe('enableFeature', () => {
        it('should enable a disabled feature', () => {
            errorRecovery.disableFeature('TestFeature');
            expect(errorRecovery.isFeatureDisabled('TestFeature')).toBe(true);
            
            errorRecovery.enableFeature('TestFeature');
            expect(errorRecovery.isFeatureDisabled('TestFeature')).toBe(false);
        });
    });

    describe('isFeatureDisabled', () => {
        it('should return false for enabled features', () => {
            expect(errorRecovery.isFeatureDisabled('TestFeature')).toBe(false);
        });

        it('should return true for disabled features', () => {
            errorRecovery.disableFeature('TestFeature');
            expect(errorRecovery.isFeatureDisabled('TestFeature')).toBe(true);
        });
    });

    describe('handleRenderingError', () => {
        it('should use simplified renderer on error', () => {
            const simplifiedRenderer = jest.fn();
            const error = new Error('Rendering failed');

            const result = errorRecovery.handleRenderingError(error, simplifiedRenderer);

            expect(result).toBe(true);
            expect(simplifiedRenderer).toHaveBeenCalled();
            expect(errorRecovery.fallbackMode).toBe(true);
        });

        it('should return false if simplified renderer fails', () => {
            const simplifiedRenderer = jest.fn().mockImplementation(() => {
                throw new Error('Simplified renderer failed');
            });
            const error = new Error('Rendering failed');

            const result = errorRecovery.handleRenderingError(error, simplifiedRenderer);

            expect(result).toBe(false);
        });

        it('should return false if no simplified renderer provided', () => {
            const error = new Error('Rendering failed');
            const result = errorRecovery.handleRenderingError(error, null);
            expect(result).toBe(false);
        });
    });

    describe('handleFeatureRuntimeError', () => {
        it('should handle feature runtime error', () => {
            const disableCallback = jest.fn();
            const error = new Error('Runtime error');

            errorRecovery.handleFeatureRuntimeError('TestFeature', error, disableCallback);

            // Error should be shown
            const errorElement = document.querySelector('.error-message');
            expect(errorElement).toBeTruthy();
        });

        it('should not show error if feature already disabled', () => {
            errorRecovery.disableFeature('TestFeature');
            errorHandler.clearAll();

            const error = new Error('Runtime error');
            errorRecovery.handleFeatureRuntimeError('TestFeature', error, null);

            const errorElement = document.querySelector('.error-message');
            expect(errorElement).toBeFalsy();
        });
    });

    describe('wrapWithRecovery', () => {
        it('should execute function normally', () => {
            const fn = jest.fn().mockReturnValue('result');
            const wrapped = errorRecovery.wrapWithRecovery(fn, 'TestFeature');

            const result = wrapped('arg1', 'arg2');

            expect(result).toBe('result');
            expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
        });

        it('should use fallback on error', () => {
            const fn = jest.fn().mockImplementation(() => {
                throw new Error('Function failed');
            });
            const fallback = jest.fn().mockReturnValue('fallback result');
            const wrapped = errorRecovery.wrapWithRecovery(fn, 'TestFeature', fallback);

            const result = wrapped('arg1');

            expect(result).toBe('fallback result');
            expect(fallback).toHaveBeenCalledWith('arg1');
        });

        it('should skip execution if feature disabled', () => {
            const fn = jest.fn();
            errorRecovery.disableFeature('TestFeature');
            const wrapped = errorRecovery.wrapWithRecovery(fn, 'TestFeature');

            const result = wrapped();

            expect(result).toBeNull();
            expect(fn).not.toHaveBeenCalled();
        });

        it('should use fallback if feature disabled and fallback provided', () => {
            const fn = jest.fn();
            const fallback = jest.fn().mockReturnValue('fallback');
            errorRecovery.disableFeature('TestFeature');
            const wrapped = errorRecovery.wrapWithRecovery(fn, 'TestFeature', fallback);

            const result = wrapped();

            expect(result).toBe('fallback');
            expect(fn).not.toHaveBeenCalled();
            expect(fallback).toHaveBeenCalled();
        });
    });

    describe('createSafeUpdateLoop', () => {
        it('should execute update function normally', () => {
            const updateFn = jest.fn();
            const safeUpdate = errorRecovery.createSafeUpdateLoop(updateFn, 'TestComponent');

            safeUpdate('arg1');

            expect(updateFn).toHaveBeenCalledWith('arg1');
        });

        it('should handle errors in update function', () => {
            const updateFn = jest.fn().mockImplementation(() => {
                throw new Error('Update failed');
            });
            const safeUpdate = errorRecovery.createSafeUpdateLoop(updateFn, 'TestComponent');

            expect(() => safeUpdate()).not.toThrow();
        });

        it('should disable feature after too many errors', () => {
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

        it('should skip execution if feature disabled', () => {
            const updateFn = jest.fn();
            errorRecovery.disableFeature('TestComponent');
            const safeUpdate = errorRecovery.createSafeUpdateLoop(updateFn, 'TestComponent');

            safeUpdate();

            expect(updateFn).not.toHaveBeenCalled();
        });
    });

    describe('reset', () => {
        it('should reset recovery state', () => {
            errorRecovery.disableFeature('Feature1');
            errorRecovery.failedComponents.add('Component1');
            errorRecovery.fallbackMode = true;

            errorRecovery.reset();

            expect(errorRecovery.isFeatureDisabled('Feature1')).toBe(false);
            expect(errorRecovery.failedComponents.size).toBe(0);
            expect(errorRecovery.fallbackMode).toBe(false);
        });

        it('should reset retry counts', () => {
            const strategy = {
                initialize: jest.fn(),
                retryCount: 2
            };

            errorRecovery.registerStrategy('TestComponent', strategy);
            errorRecovery.reset();

            const registered = errorRecovery.recoveryStrategies.get('TestComponent');
            expect(registered.retryCount).toBe(0);
        });
    });

    describe('getStatus', () => {
        it('should return recovery status', () => {
            errorRecovery.disableFeature('Feature1');
            errorRecovery.failedComponents.add('Component1');
            errorRecovery.fallbackMode = true;
            errorRecovery.registerStrategy('TestComponent', { initialize: jest.fn() });

            const status = errorRecovery.getStatus();

            expect(status.fallbackMode).toBe(true);
            expect(status.disabledFeatures).toContain('Feature1');
            expect(status.failedComponents).toContain('Component1');
            expect(status.registeredStrategies).toContain('TestComponent');
        });
    });

    describe('getFailedComponents', () => {
        it('should return list of failed components', () => {
            errorRecovery.failedComponents.add('Component1');
            errorRecovery.failedComponents.add('Component2');

            const failed = errorRecovery.getFailedComponents();

            expect(failed).toContain('Component1');
            expect(failed).toContain('Component2');
            expect(failed.length).toBe(2);
        });
    });

    describe('getDisabledFeatures', () => {
        it('should return list of disabled features', () => {
            errorRecovery.disableFeature('Feature1');
            errorRecovery.disableFeature('Feature2');

            const disabled = errorRecovery.getDisabledFeatures();

            expect(disabled).toContain('Feature1');
            expect(disabled).toContain('Feature2');
            expect(disabled.length).toBe(2);
        });
    });

    describe('delay', () => {
        it('should delay execution', async () => {
            const start = Date.now();
            await errorRecovery.delay(100);
            const elapsed = Date.now() - start;

            expect(elapsed).toBeGreaterThanOrEqual(90);
        });
    });
});
