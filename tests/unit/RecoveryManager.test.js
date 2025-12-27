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

const { RecoveryManager } = require('@/initialization/RecoveryManager.js');

describe('RecoveryManager', () => {
    let recoveryManager;

    beforeEach(() => {
        jest.useFakeTimers();
        document.body.innerHTML = '';
        recoveryManager = new RecoveryManager();
    });

    afterEach(() => {
        jest.useRealTimers();
        if (recoveryManager) {
            recoveryManager.clearAll();
        }
    });

    describe('initialization', () => {
        it('should initialize when showing first error', () => {
            expect(recoveryManager.initialized).toBe(false);
            recoveryManager.showError('Test error');
            expect(recoveryManager.initialized).toBe(true);
        });

        it('should create error container on init', () => {
            recoveryManager.init();
            const container = document.getElementById('error-container');
            expect(container).toBeTruthy();
            expect(container.className).toBe('error-container');
        });
    });

    describe('error display', () => {
        it('should display error message', () => {
            const errorId = recoveryManager.showError('Test error message');
            expect(errorId).toBeTruthy();
            expect(recoveryManager.activeErrors.has(errorId)).toBe(true);
        });

        it('should prevent duplicate errors with same ID', () => {
            recoveryManager.showError('Test error', { id: 'test-1' });
            recoveryManager.showError('Test error', { id: 'test-1' });
            const errorElements = document.querySelectorAll('.error-message');
            expect(errorElements.length).toBe(1);
        });
    });

    describe('recovery strategies', () => {
        it('should register a recovery strategy', () => {
            const strategy = {
                initialize: jest.fn(),
                critical: true,
                maxRetries: 3,
            };

            recoveryManager.registerStrategy('TestComponent', strategy);
            expect(recoveryManager.recoveryStrategies.has('TestComponent')).toBe(true);
        });

        it('should initialize component successfully', async () => {
            const mockComponent = { name: 'test' };
            const strategy = {
                initialize: jest.fn().mockResolvedValue(mockComponent),
            };

            recoveryManager.registerStrategy('TestComponent', strategy);
            const result = await recoveryManager.initializeWithRecovery('TestComponent');

            expect(result).toBe(mockComponent);
            expect(strategy.initialize).toHaveBeenCalled();
        });
    });

    describe('feature management', () => {
        it('should disable a feature', () => {
            recoveryManager.disableFeature('TestFeature');
            expect(recoveryManager.isFeatureDisabled('TestFeature')).toBe(true);
        });

        it('should enable a disabled feature', () => {
            recoveryManager.disableFeature('TestFeature');
            expect(recoveryManager.isFeatureDisabled('TestFeature')).toBe(true);

            recoveryManager.enableFeature('TestFeature');
            expect(recoveryManager.isFeatureDisabled('TestFeature')).toBe(false);
        });
    });

    describe('WebGL compatibility', () => {
        it('should get WebGL compatibility message', () => {
            const message = recoveryManager.getWebGLCompatibilityMessage();
            expect(message).toHaveProperty('browserName');
            expect(message).toHaveProperty('updateLink');
            expect(message).toHaveProperty('message');
            expect(message).toHaveProperty('actionableSteps');
        });
    });

    describe('status reporting', () => {
        it('should return recovery status', () => {
            recoveryManager.disableFeature('Feature1');
            recoveryManager.failedComponents.add('Component1');
            recoveryManager.fallbackMode = true;
            recoveryManager.registerStrategy('TestComponent', { initialize: jest.fn() });

            const status = recoveryManager.getStatus();

            expect(status.fallbackMode).toBe(true);
            expect(status.disabledFeatures).toContain('Feature1');
            expect(status.failedComponents).toContain('Component1');
            expect(status.registeredStrategies).toContain('TestComponent');
        });
    });
});
