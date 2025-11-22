const { ErrorRecoveryStrategies } = require('@/utils/ErrorRecoveryStrategies.js');

describe('ErrorRecoveryStrategies', () => {
    let strategies;

    beforeEach(() => {
        strategies = new ErrorRecoveryStrategies();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
        document.body.innerHTML = '';
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(strategies.maxDOMRetries).toBe(3);
            expect(strategies.domRetryDelay).toBe(500);
            expect(strategies.domRetryCount).toBe(0);
        });
    });

    describe('recoverFromDOMNotReady', () => {
        it('should retry initialization after delay', async () => {
            const mockCallback = jest.fn().mockResolvedValue(true);
            
            const recoveryPromise = strategies.recoverFromDOMNotReady(mockCallback);
            
            expect(mockCallback).not.toHaveBeenCalled();
            
            jest.advanceTimersByTime(500);
            await Promise.resolve();
            
            expect(mockCallback).toHaveBeenCalledTimes(1);
        });

        it('should increment retry count', async () => {
            const mockCallback = jest.fn().mockResolvedValue(true);
            
            strategies.recoverFromDOMNotReady(mockCallback);
            
            expect(strategies.domRetryCount).toBe(1);
        });

        it('should return true on successful recovery', async () => {
            const mockCallback = jest.fn().mockResolvedValue(true);
            
            const recoveryPromise = strategies.recoverFromDOMNotReady(mockCallback);
            jest.advanceTimersByTime(500);
            
            const result = await recoveryPromise;
            expect(result).toBe(true);
        });

        it('should return false on failed recovery', async () => {
            const mockCallback = jest.fn().mockRejectedValue(new Error('Failed'));
            
            const recoveryPromise = strategies.recoverFromDOMNotReady(mockCallback);
            jest.advanceTimersByTime(500);
            
            const result = await recoveryPromise;
            expect(result).toBe(false);
        });

        it('should not retry if max retries reached', async () => {
            strategies.domRetryCount = 3;
            const mockCallback = jest.fn();
            
            const result = await strategies.recoverFromDOMNotReady(mockCallback);
            
            expect(result).toBe(false);
            expect(mockCallback).not.toHaveBeenCalled();
        });

        it('should allow multiple retries up to max', async () => {
            const mockCallback = jest.fn().mockResolvedValue(true);
            
            for (let i = 0; i < 3; i++) {
                const recoveryPromise = strategies.recoverFromDOMNotReady(mockCallback);
                jest.advanceTimersByTime(500);
                await recoveryPromise;
            }
            
            expect(strategies.domRetryCount).toBe(3);
            expect(mockCallback).toHaveBeenCalledTimes(3);
        });

        it('should log retry attempt', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const mockCallback = jest.fn().mockResolvedValue(true);
            
            strategies.recoverFromDOMNotReady(mockCallback);
            
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Retrying initialization')
            );
            
            consoleSpy.mockRestore();
        });
    });

    describe('getWebGLCompatibilityMessage', () => {
        it('should return compatibility message object', () => {
            const message = strategies.getWebGLCompatibilityMessage();
            
            expect(message).toHaveProperty('browserName');
            expect(message).toHaveProperty('updateLink');
            expect(message).toHaveProperty('message');
            expect(message).toHaveProperty('actionableSteps');
        });

        it('should detect Chrome', () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                configurable: true
            });
            
            const message = strategies.getWebGLCompatibilityMessage();
            
            expect(message.browserName).toBe('Chrome');
            expect(message.updateLink).toContain('chrome');
        });

        it('should detect Firefox', () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
                configurable: true
            });
            
            const message = strategies.getWebGLCompatibilityMessage();
            
            expect(message.browserName).toBe('Firefox');
            expect(message.updateLink).toContain('firefox');
        });

        it('should detect Safari', () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
                configurable: true
            });
            
            const message = strategies.getWebGLCompatibilityMessage();
            
            expect(message.browserName).toBe('Safari');
            expect(message.updateLink).toContain('safari');
        });

        it('should detect Edge', () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
                configurable: true
            });
            
            const message = strategies.getWebGLCompatibilityMessage();
            
            expect(message.browserName).toBe('Edge');
            expect(message.updateLink).toContain('edge');
        });

        it('should have actionable steps', () => {
            const message = strategies.getWebGLCompatibilityMessage();
            
            expect(Array.isArray(message.actionableSteps)).toBe(true);
            expect(message.actionableSteps.length).toBeGreaterThan(0);
        });

        it('should include WebGL test link in steps', () => {
            const message = strategies.getWebGLCompatibilityMessage();
            
            const hasWebGLLink = message.actionableSteps.some(step => 
                step.includes('get.webgl.org')
            );
            expect(hasWebGLLink).toBe(true);
        });
    });

    describe('createFallbackModeSelector', () => {
        it('should create fallback element', () => {
            const callback = jest.fn();
            const fallback = strategies.createFallbackModeSelector(callback);
            
            expect(fallback).toBeDefined();
            expect(fallback.id).toBe('fallback-mode-selector');
        });

        it('should have mode buttons', () => {
            const callback = jest.fn();
            const fallback = strategies.createFallbackModeSelector(callback);
            
            const buttons = fallback.querySelectorAll('.fallback-mode-btn');
            expect(buttons.length).toBeGreaterThan(0);
        });

        it('should have classic mode button', () => {
            const callback = jest.fn();
            const fallback = strategies.createFallbackModeSelector(callback);
            
            const classicBtn = fallback.querySelector('[data-mode="classic"]');
            expect(classicBtn).not.toBeNull();
        });

        it('should have time trial mode button', () => {
            const callback = jest.fn();
            const fallback = strategies.createFallbackModeSelector(callback);
            
            const timeTrialBtn = fallback.querySelector('[data-mode="time_trial"]');
            expect(timeTrialBtn).not.toBeNull();
        });

        it('should have survival mode button', () => {
            const callback = jest.fn();
            const fallback = strategies.createFallbackModeSelector(callback);
            
            const survivalBtn = fallback.querySelector('[data-mode="survival"]');
            expect(survivalBtn).not.toBeNull();
        });

        it('should call callback with mode when button clicked', () => {
            const callback = jest.fn();
            const fallback = strategies.createFallbackModeSelector(callback);
            document.body.appendChild(fallback);
            
            const classicBtn = fallback.querySelector('[data-mode="classic"]');
            classicBtn.click();
            
            expect(callback).toHaveBeenCalledWith('classic');
        });

        it('should remove fallback when button clicked', () => {
            const callback = jest.fn();
            const fallback = strategies.createFallbackModeSelector(callback);
            document.body.appendChild(fallback);
            
            const classicBtn = fallback.querySelector('[data-mode="classic"]');
            classicBtn.click();
            
            expect(document.getElementById('fallback-mode-selector')).toBeNull();
        });

        it('should have high z-index', () => {
            const callback = jest.fn();
            const fallback = strategies.createFallbackModeSelector(callback);
            
            expect(fallback.style.zIndex).toBe('10000');
        });

        it('should be centered on screen', () => {
            const callback = jest.fn();
            const fallback = strategies.createFallbackModeSelector(callback);
            
            expect(fallback.style.position).toBe('fixed');
            expect(fallback.style.top).toBe('50%');
            expect(fallback.style.left).toBe('50%');
        });
    });

    describe('recoverFromModeSelectorError', () => {
        it('should create and append fallback selector', () => {
            const callback = jest.fn();
            
            const result = strategies.recoverFromModeSelectorError(callback);
            
            expect(result).toBe(true);
            expect(document.getElementById('fallback-mode-selector')).not.toBeNull();
        });

        it('should log success message', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const callback = jest.fn();
            
            strategies.recoverFromModeSelectorError(callback);
            
            expect(consoleSpy).toHaveBeenCalledWith('Fallback mode selector created');
            
            consoleSpy.mockRestore();
        });

        it('should return false on error', () => {
            const callback = jest.fn();
            jest.spyOn(document.body, 'appendChild').mockImplementation(() => {
                throw new Error('Failed to append');
            });
            
            const result = strategies.recoverFromModeSelectorError(callback);
            
            expect(result).toBe(false);
        });

        it('should log error on failure', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const callback = jest.fn();
            jest.spyOn(document.body, 'appendChild').mockImplementation(() => {
                throw new Error('Failed to append');
            });
            
            strategies.recoverFromModeSelectorError(callback);
            
            expect(consoleSpy).toHaveBeenCalledWith(
                'Failed to create fallback mode selector:',
                expect.any(Error)
            );
            
            consoleSpy.mockRestore();
        });
    });

    describe('reset', () => {
        it('should reset retry count', () => {
            strategies.domRetryCount = 3;
            
            strategies.reset();
            
            expect(strategies.domRetryCount).toBe(0);
        });

        it('should allow retries after reset', async () => {
            strategies.domRetryCount = 3;
            const mockCallback = jest.fn().mockResolvedValue(true);
            
            let result = await strategies.recoverFromDOMNotReady(mockCallback);
            expect(result).toBe(false);
            
            strategies.reset();
            
            const recoveryPromise = strategies.recoverFromDOMNotReady(mockCallback);
            jest.advanceTimersByTime(500);
            result = await recoveryPromise;
            
            expect(result).toBe(true);
            expect(mockCallback).toHaveBeenCalled();
        });
    });
});
