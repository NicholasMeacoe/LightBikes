/**
 * RecoveryManager Unit Tests
 */

describe('RecoveryManager', () => {
    let RecoveryManager;
    let ErrorRecoveryStrategies;
    let Logger;
    let recoveryManager;
    let mockLogger;
    let mockStrategies;

    beforeEach(() => {
        // Reset DOM and Modules
        document.body.innerHTML = '';
        jest.resetModules();
        jest.clearAllMocks();

        // 1. Setup Mock Factory for Logger
        jest.mock('../../src/utils/Logger.js', () => ({
            Logger: { create: jest.fn() },
            createLogger: jest.fn(),
            logger: {
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
                debug: jest.fn(),
            },
        }));

        // 2. Setup Mock Factory for Strategies
        jest.mock('../../src/effects/ErrorRecoveryStrategies.js', () => ({
            ErrorRecoveryStrategies: jest.fn(),
        }));

        // 3. Re-require modules to pick up mocks
        const LoggerModule = require('../../src/utils/Logger.js');
        Logger = LoggerModule.Logger;

        const StrategiesModule = require('../../src/effects/ErrorRecoveryStrategies.js');
        ErrorRecoveryStrategies = StrategiesModule.ErrorRecoveryStrategies;

        const RecoveryManagerModule = require('../../src/initialization/RecoveryManager.js');
        RecoveryManager = RecoveryManagerModule.RecoveryManager;

        // 4. Configure Mocks
        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
        };
        // Configure Logger.create to return our mock logger
        Logger.create.mockReturnValue(mockLogger);

        mockStrategies = {
            getStrategiesForType: jest.fn().mockReturnValue([]),
            getRecoveryStrategy: jest.fn().mockReturnValue(null),
        };
        ErrorRecoveryStrategies.mockImplementation(() => mockStrategies);

        // 5. Instantiate System
        recoveryManager = new RecoveryManager();
        recoveryManager.init();
    });

    describe('init', () => {
        it('should initialize successfully', () => {
            expect(recoveryManager.initialized).toBe(true);
            expect(document.getElementById('error-container')).toBeTruthy();
        });
    });

    describe('initializeWithRecovery', () => {
        it('should initialize a component successfully', async () => {
            const initFn = jest.fn().mockResolvedValue('success');

            // Register strategy
            recoveryManager.registerStrategy('TestComp', { initialize: initFn });

            const result = await recoveryManager.initializeWithRecovery('TestComp');

            expect(result).toBe('success');
            expect(initFn).toHaveBeenCalled();
            expect(recoveryManager.failedComponents.has('TestComp')).toBe(false);
        });

        it('should retry on failure and succeed', async () => {
            const initFn = jest
                .fn()
                .mockRejectedValueOnce(new Error('Fail 1'))
                .mockResolvedValue('Success');

            recoveryManager.registerStrategy('TestComp', {
                initialize: initFn,
                maxRetries: 3,
            });

            // Mock delay to be instant
            jest.spyOn(recoveryManager, 'delay').mockResolvedValue();

            const result = await recoveryManager.initializeWithRecovery('TestComp');

            expect(result).toBe('Success');
            expect(initFn).toHaveBeenCalledTimes(2);
            expect(recoveryManager.failedComponents.has('TestComp')).toBe(false);
        });

        it('should fail after max retries and fallback if available', async () => {
            const initFn = jest.fn().mockRejectedValue(new Error('Fail'));
            const fallbackFn = jest.fn().mockResolvedValue('FallbackComp');

            recoveryManager.registerStrategy('TestComp', {
                initialize: initFn,
                fallback: fallbackFn,
                maxRetries: 1,
            });

            jest.spyOn(recoveryManager, 'delay').mockResolvedValue();

            const result = await recoveryManager.initializeWithRecovery('TestComp');

            expect(result).toBe('FallbackComp');
            expect(fallbackFn).toHaveBeenCalled();
            expect(recoveryManager.isInFallbackMode()).toBe(true);
        });

        it('should disable non-critical component if max retries reached and no fallback', async () => {
            const initFn = jest.fn().mockRejectedValue(new Error('Fail'));

            recoveryManager.registerStrategy('TestComp', {
                initialize: initFn,
                maxRetries: 1,
                critical: false,
            });

            jest.spyOn(recoveryManager, 'delay').mockResolvedValue();

            const result = await recoveryManager.initializeWithRecovery('TestComp');

            expect(result).toBeNull();
            expect(recoveryManager.isFeatureDisabled('TestComp')).toBe(true);
        });
    });

    describe('handleFeatureRuntimeError', () => {
        it('should show error with disable action', () => {
            const cleanup = jest.fn();
            recoveryManager.handleFeatureRuntimeError(
                'RuntimeFeature',
                new Error('Crash'),
                cleanup
            );

            // It calls handleFeatureError -> showError
            // showError creates DOM.
            const errorEls = document.querySelectorAll('.error-message');
            expect(errorEls.length).toBe(1);

            const errorEl = errorEls[0];
            expect(errorEl.textContent).toContain('RuntimeFeature');

            // Find action button
            const buttons = errorEl.querySelectorAll('.error-action-btn');
            let disableBtn = null;
            buttons.forEach((btn) => {
                if (btn.textContent.includes('Disable Feature')) disableBtn = btn;
            });

            expect(disableBtn).toBeTruthy();

            // Click it
            disableBtn.click();

            expect(recoveryManager.isFeatureDisabled('RuntimeFeature')).toBe(true);
            expect(cleanup).toHaveBeenCalled();
        });
    });

    describe('handleInitializationError', () => {
        it('should show initialization error', () => {
            const error = new Error('Init Error');
            const id = recoveryManager.handleInitializationError(error, null, 'TestComp');

            expect(typeof id).toBe('string');
            expect(document.querySelector('.error-message').textContent).toContain('Init Error');
        });
    });

    describe('Safe Update Loop', () => {
        it('should disable feature after excessive errors', () => {
            const updateFn = jest.fn().mockImplementation(() => {
                throw new Error('Update Fail');
            });
            const safeUpdate = recoveryManager.createSafeUpdateLoop(updateFn, 'UnstableFeature');

            // Trigger errors (maxErrors = 5)
            // Need to change the timestamp for each error to fill usage window?
            // "timestamp" logic: `now - timestamp < errorWindow`.
            // FakeTimers are not enabled here unless I enable them.
            // But loop runs synchronously, so Date.now() is constant.
            // If timestamps are identical, length is 5. Correct.

            for (let i = 0; i < 5; i++) {
                safeUpdate();
            }

            expect(recoveryManager.isFeatureDisabled('UnstableFeature')).toBe(true);
        });

        it('should stop calling update if disabled', () => {
            const updateFn = jest.fn();
            const safeUpdate = recoveryManager.createSafeUpdateLoop(updateFn, 'DisabledFeature');

            recoveryManager.disableFeature('DisabledFeature');
            safeUpdate();

            expect(updateFn).not.toHaveBeenCalled();
        });
    });
});
