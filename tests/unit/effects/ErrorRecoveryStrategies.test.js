const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
};

// Mock the Logger module
jest.mock('@/utils/Logger.js', () => ({
    createLogger: jest.fn(() => mockLogger),
    logger: mockLogger,
}));

const { ErrorRecoveryStrategies } = require('@/effects/ErrorRecoveryStrategies.js');

describe('Effects ErrorRecoveryStrategies', () => {
    let strategies;
    let mockComponents;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Initialize strategy instance
        strategies = new ErrorRecoveryStrategies();

        // Create mock components
        mockComponents = {
            cameraEffectsManager: {
                setEnabled: jest.fn(),
            },
            degradationManager: {
                getDegradationState: jest.fn(),
                setDegradationLevel: jest.fn(),
                resetPerformanceMetrics: jest.fn(),
            },
            motionBlurController: {
                getCurrentQuality: jest.fn(),
                setQuality: jest.fn(),
                setEnabled: jest.fn(),
                initialize: jest.fn().mockReturnValue(true),
                resetPerformanceMetrics: jest.fn(),
            },
            shakeController: {},
        };

        // Initialize with mocks
        strategies.initialize(mockComponents);
    });

    describe('Initialization', () => {
        it('should store component references', () => {
            expect(strategies.cameraEffectsManager).toBe(mockComponents.cameraEffectsManager);
            expect(strategies.degradationManager).toBe(mockComponents.degradationManager);
            expect(strategies.motionBlurController).toBe(mockComponents.motionBlurController);
            expect(strategies.shakeController).toBe(mockComponents.shakeController);
        });

        it('should define strategy types', () => {
            expect(strategies.strategies.webgl).toBeDefined();
            expect(strategies.strategies.postProcessing).toBeDefined();
            expect(strategies.strategies.memory).toBeDefined();
            expect(strategies.strategies.shader).toBeDefined();
        });
    });

    describe('getStrategiesForType', () => {
        it('should return strategies for valid type', () => {
            const result = strategies.getStrategiesForType('webgl');
            expect(result).toEqual([
                'reduceQuality',
                'disableMotionBlur',
                'disablePostProcessing',
                'fallbackRendering',
            ]);
        });

        it('should return empty array for invalid type', () => {
            const result = strategies.getStrategiesForType('invalid');
            expect(result).toEqual([]);
        });
    });

    describe('executeStrategy', () => {
        it('should execute valid strategy', () => {
            const spy = jest.spyOn(strategies, 'reduceQuality').mockReturnValue(true);
            const result = strategies.executeStrategy('reduceQuality');
            expect(result).toBe(true);
            expect(spy).toHaveBeenCalled();
        });

        it('should return false for unknown strategy', () => {
            const result = strategies.executeStrategy('unknownStrategy');
            expect(result).toBe(false);
            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.stringContaining('Unknown recovery strategy')
            );
        });
    });

    describe('Recovery Methods', () => {
        describe('reduceQuality', () => {
            it('should increase degradation level if possible', () => {
                mockComponents.degradationManager.getDegradationState.mockReturnValue({ level: 0 });

                const result = strategies.reduceQuality();

                expect(result).toBe(true);
                expect(mockComponents.degradationManager.setDegradationLevel).toHaveBeenCalledWith(
                    1
                );
            });

            it('should reduce motion blur quality if degradation maxed out', () => {
                mockComponents.degradationManager.getDegradationState.mockReturnValue({ level: 2 });
                mockComponents.motionBlurController.getCurrentQuality.mockReturnValue('high');

                const result = strategies.reduceQuality();

                expect(result).toBe(true);
                expect(mockComponents.motionBlurController.setQuality).toHaveBeenCalledWith(
                    'medium'
                );
            });

            it('should return false if quality cannot be reduced further', () => {
                mockComponents.degradationManager.getDegradationState.mockReturnValue({ level: 2 });
                mockComponents.motionBlurController.getCurrentQuality.mockReturnValue('low');

                const result = strategies.reduceQuality();

                expect(result).toBe(false);
            });
        });

        describe('disableMotionBlur', () => {
            it('should disable motion blur controller', () => {
                const result = strategies.disableMotionBlur('Test reason');
                expect(result).toBe(true);
                expect(mockComponents.motionBlurController.setEnabled).toHaveBeenCalledWith(false);
                expect(mockLogger.info).toHaveBeenCalledWith(
                    expect.stringContaining('Test reason')
                );
            });

            it('should handle missing controller', () => {
                strategies.motionBlurController = null;
                const result = strategies.disableMotionBlur('Test reason');
                expect(result).toBe(false);
            });
        });

        describe('disablePostProcessing', () => {
            it('should disable motion blur as proxy for post processing', () => {
                const result = strategies.disablePostProcessing();
                expect(result).toBe(true);
                expect(mockComponents.motionBlurController.setEnabled).toHaveBeenCalledWith(false);
            });
        });

        describe('enterFallbackMode', () => {
            it('should disable motion blur and set max degradation', () => {
                const result = strategies.enterFallbackMode('Test reason');

                expect(result).toBe(true);
                expect(mockComponents.motionBlurController.setEnabled).toHaveBeenCalledWith(false);
                expect(mockComponents.degradationManager.setDegradationLevel).toHaveBeenCalledWith(
                    2
                );
                expect(mockLogger.info).toHaveBeenCalledWith(
                    expect.stringContaining('Entered fallback mode')
                );
            });
        });

        describe('disableAllEffects', () => {
            it('should disable everything', () => {
                const result = strategies.disableAllEffects('Critial error');

                expect(result).toBe(true);
                expect(mockComponents.cameraEffectsManager.setEnabled).toHaveBeenCalledWith(false);
                expect(mockComponents.degradationManager.setDegradationLevel).toHaveBeenCalledWith(
                    3
                );
            });
        });

        describe('recreateComposer', () => {
            it('should initialize motion blur controller', () => {
                const result = strategies.recreateComposer();
                expect(result).toBe(true);
                expect(mockComponents.motionBlurController.initialize).toHaveBeenCalled();
            });
        });

        describe('simplifyShaders', () => {
            it('should set motion blur quality to low', () => {
                const result = strategies.simplifyShaders();
                expect(result).toBe(true);
                expect(mockComponents.motionBlurController.setQuality).toHaveBeenCalledWith('low');
            });
        });

        describe('clearCaches', () => {
            it('should reset performance metrics on controllers', () => {
                const result = strategies.clearCaches();
                expect(result).toBe(true);
                expect(
                    mockComponents.motionBlurController.resetPerformanceMetrics
                ).toHaveBeenCalled();
                expect(
                    mockComponents.degradationManager.resetPerformanceMetrics
                ).toHaveBeenCalled();
            });
        });

        describe('forceGarbageCollection', () => {
            it('should call window.gc if available', () => {
                window.gc = jest.fn();
                const result = strategies.forceGarbageCollection();
                expect(result).toBe(true);
                expect(window.gc).toHaveBeenCalled();
                delete window.gc;
            });

            it('should return false if window.gc not available', () => {
                const result = strategies.forceGarbageCollection();
                expect(result).toBe(false);
            });
        });
    });
});
