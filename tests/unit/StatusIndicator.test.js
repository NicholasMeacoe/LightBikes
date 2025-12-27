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

const { StatusIndicator } = require('@/ui/StatusIndicator.js');

describe('StatusIndicator', () => {
    let statusIndicator;
    let mockDocument;

    beforeEach(() => {
        // Create simple mock DOM
        const mockElement = () => ({
            id: '',
            className: '',
            textContent: '',
            innerHTML: '',
            style: {},
            classList: {
                add: jest.fn(),
                remove: jest.fn(),
                contains: jest.fn(() => false),
            },
            appendChild: jest.fn(),
            removeChild: jest.fn(),
            querySelector: jest.fn(() => null),
            querySelectorAll: jest.fn(() => []),
            parentNode: null,
        });

        mockDocument = {
            createElement: jest.fn(mockElement),
            body: mockElement(),
            head: mockElement(),
            querySelectorAll: jest.fn(() => []),
        };

        global.document = mockDocument;
        statusIndicator = new StatusIndicator();
    });

    afterEach(() => {
        delete global.document;
    });

    describe('initialization', () => {
        it('should initialize with correct default state', () => {
            expect(statusIndicator.container).toBeNull();
            expect(statusIndicator.activeIndicators.size).toBe(0);
            expect(statusIndicator.initialized).toBe(false);
        });

        it('should create container when initialized', () => {
            statusIndicator.initialize();

            expect(statusIndicator.initialized).toBe(true);
            expect(statusIndicator.container).toBeTruthy();
            expect(mockDocument.createElement).toHaveBeenCalledWith('div');
            expect(mockDocument.createElement).toHaveBeenCalledWith('style');
        });

        it('should not reinitialize if already initialized', () => {
            statusIndicator.initialize();
            const firstContainer = statusIndicator.container;

            statusIndicator.initialize();

            expect(statusIndicator.container).toBe(firstContainer);
        });
    });

    describe('power-up UI configuration', () => {
        it('should have correct UI config for all power-up types', () => {
            const config = statusIndicator.powerUpUIConfig;

            expect(config.SPEED_BOOST).toEqual({
                icon: '⚡',
                color: '#0066ff',
                name: 'Speed Boost',
                showTimer: true,
            });

            expect(config.SHIELD).toEqual({
                icon: '🛡️',
                color: '#ffd700',
                name: 'Shield',
                showTimer: false,
            });

            expect(config.TRAIL_ERASER).toEqual({
                icon: '🗑️',
                color: '#9932cc',
                name: 'Trail Eraser',
                showTimer: false,
            });

            expect(config.GHOST_MODE).toEqual({
                icon: '👻',
                color: '#ffffff',
                name: 'Ghost Mode',
                showTimer: true,
            });
        });
    });

    describe('status updates', () => {
        beforeEach(() => {
            statusIndicator.initialize();
        });

        it('should handle empty effects array', () => {
            expect(() => {
                statusIndicator.updateStatus({ player: [] });
            }).not.toThrow();

            expect(statusIndicator.container.classList.remove).toHaveBeenCalledWith('visible');
        });

        it('should handle missing player effects', () => {
            expect(() => {
                statusIndicator.updateStatus({});
            }).not.toThrow();

            expect(statusIndicator.container.classList.remove).toHaveBeenCalledWith('visible');
        });

        it('should show container when there are active effects', () => {
            const mockEffect = {
                type: 'SPEED_BOOST',
                startTime: Date.now(),
                duration: 3000,
                getRemainingTime: () => 2500,
            };

            statusIndicator.updateStatus({ player: [mockEffect] });

            expect(statusIndicator.container.classList.add).toHaveBeenCalledWith('visible');
        });

        it('should warn for unknown power-up types', () => {
            const mockEffect = {
                type: 'UNKNOWN_TYPE',
                startTime: Date.now(),
                duration: 3000,
                getRemainingTime: () => 2500,
            };

            statusIndicator.updateStatus({ player: [mockEffect] });

            expect(mockLogger.warn).toHaveBeenCalledWith(
                'No UI config found for effect type: UNKNOWN_TYPE'
            );
        });
    });

    describe('timer functionality', () => {
        beforeEach(() => {
            statusIndicator.initialize();
        });

        it('should handle updateTimers when not initialized', () => {
            const uninitializedIndicator = new StatusIndicator();
            expect(() => {
                uninitializedIndicator.updateTimers();
            }).not.toThrow();
        });

        it('should handle updateTimers with no active indicators', () => {
            expect(() => {
                statusIndicator.updateTimers();
            }).not.toThrow();
        });
    });

    describe('effect removal', () => {
        beforeEach(() => {
            statusIndicator.initialize();
        });

        it('should handle effect removal for non-existent effect', () => {
            expect(() => {
                statusIndicator.handleEffectRemoved('SPEED_BOOST', Date.now());
            }).not.toThrow();
        });
    });

    describe('reset functionality', () => {
        beforeEach(() => {
            statusIndicator.initialize();
        });

        it('should clear indicators and hide container on reset', () => {
            statusIndicator.reset();

            expect(statusIndicator.container.classList.remove).toHaveBeenCalledWith('visible');
            expect(statusIndicator.container.innerHTML).toBe('');
            expect(statusIndicator.activeIndicators.size).toBe(0);
        });
    });

    describe('debug information', () => {
        it('should provide correct debug info when not initialized', () => {
            const debugInfo = statusIndicator.getDebugInfo();

            expect(debugInfo).toEqual({
                initialized: false,
                visible: false,
                activeIndicators: 0,
                containerExists: false,
            });
        });

        it('should provide correct debug info when initialized', () => {
            statusIndicator.initialize();

            const debugInfo = statusIndicator.getDebugInfo();

            expect(debugInfo.initialized).toBe(true);
            expect(debugInfo.containerExists).toBe(true);
            expect(debugInfo.activeIndicators).toBe(0);
        });
    });

    describe('timer calculations', () => {
        beforeEach(() => {
            statusIndicator.initialize();
        });

        it('should calculate timer display correctly', () => {
            // Create a mock timer element
            const mockTimerElement = {
                textContent: '',
                parentElement: {
                    classList: {
                        add: jest.fn(),
                        remove: jest.fn(),
                    },
                },
            };

            const mockEffect = {
                getRemainingTime: () => 1200, // 1.2 seconds
            };

            statusIndicator.updateTimer(mockTimerElement, mockEffect);

            expect(mockTimerElement.textContent).toBe('2s'); // Math.ceil(1200/1000)
        });

        it('should add expiring animation for last 2 seconds', () => {
            const mockTimerElement = {
                textContent: '',
                parentElement: {
                    classList: {
                        add: jest.fn(),
                        remove: jest.fn(),
                    },
                },
            };

            const mockEffect = {
                getRemainingTime: () => 1500, // 1.5 seconds
            };

            statusIndicator.updateTimer(mockTimerElement, mockEffect);

            expect(mockTimerElement.parentElement.classList.add).toHaveBeenCalledWith('expiring');
        });

        it('should not add expiring animation for more than 2 seconds', () => {
            const mockTimerElement = {
                textContent: '',
                parentElement: {
                    classList: {
                        add: jest.fn(),
                        remove: jest.fn(),
                    },
                },
            };

            const mockEffect = {
                getRemainingTime: () => 2500, // 2.5 seconds
            };

            statusIndicator.updateTimer(mockTimerElement, mockEffect);

            expect(mockTimerElement.parentElement.classList.remove).toHaveBeenCalledWith(
                'expiring'
            );
        });

        it('should show 0s when time expires', () => {
            const mockTimerElement = {
                textContent: '',
                parentElement: {
                    classList: {
                        add: jest.fn(),
                        remove: jest.fn(),
                    },
                },
            };

            const mockEffect = {
                getRemainingTime: () => 0,
            };

            statusIndicator.updateTimer(mockTimerElement, mockEffect);

            expect(mockTimerElement.textContent).toBe('0s');
        });
    });
});
