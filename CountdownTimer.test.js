const { CountdownTimer } = require('./CountdownTimer.js');

// Mock DOM methods
const mockElement = {
    remove: jest.fn(),
    classList: {
        add: jest.fn(),
        remove: jest.fn()
    },
    style: {},
    textContent: ''
};

const mockCreateElement = jest.fn(() => mockElement);
const mockAppendChild = jest.fn();
const mockGetElementById = jest.fn();
const mockQuerySelector = jest.fn();

// Mock document
global.document = {
    createElement: mockCreateElement,
    body: { appendChild: mockAppendChild },
    head: { appendChild: mockAppendChild },
    getElementById: mockGetElementById
};

// Mock setTimeout and clearTimeout
const mockSetTimeout = jest.fn();
const mockClearTimeout = jest.fn();
global.setTimeout = mockSetTimeout;
global.clearTimeout = mockClearTimeout;

describe('CountdownTimer', () => {
    let countdown;
    let mockCallback;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        mockCreateElement.mockReturnValue(mockElement);
        mockGetElementById.mockReturnValue(null);
        
        countdown = new CountdownTimer();
        mockCallback = jest.fn();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(countdown.isRunning).toBe(false);
            expect(countdown.currentCount).toBe(0);
            expect(countdown.countdownElement).toBeNull();
            expect(countdown.onCountdownComplete).toBeNull();
            expect(countdown.timeoutId).toBeNull();
        });

        it('should initialize sequence configuration', () => {
            expect(countdown.sequence).toEqual([
                { text: '3', duration: 1000 },
                { text: '2', duration: 1000 },
                { text: '1', duration: 1000 },
                { text: 'GO!', duration: 500 }
            ]);
        });
    });

    describe('start', () => {
        it('should start countdown sequence', () => {
            countdown.start(mockCallback);

            expect(countdown.isRunning).toBe(true);
            expect(countdown.onCountdownComplete).toBe(mockCallback);
            expect(countdown.currentCount).toBe(0);
            expect(mockCreateElement).toHaveBeenCalledWith('div');
            expect(mockAppendChild).toHaveBeenCalled();
        });

        it('should not start if already running', () => {
            countdown.start(mockCallback);
            const firstCallCount = mockCreateElement.mock.calls.length;

            countdown.start(jest.fn());
            
            expect(mockCreateElement).toHaveBeenCalledTimes(firstCallCount);
        });

        it('should create countdown UI', () => {
            countdown.start(mockCallback);

            expect(mockElement.id).toBe('countdown-display');
            expect(mockElement.className).toBe('countdown-container');
        });

        it('should schedule first countdown step', () => {
            countdown.start(mockCallback);

            expect(mockSetTimeout).toHaveBeenCalledWith(
                expect.any(Function),
                1000
            );
        });
    });

    describe('showNextCount', () => {
        beforeEach(() => {
            countdown.start(mockCallback);
            countdown.countdownElement = mockElement;
        });

        it('should display current count text', () => {
            countdown.showNextCount();

            expect(mockElement.textContent).toBe('3');
            expect(mockElement.className).toBe('countdown-container countdown-show');
        });

        it('should schedule next count', () => {
            countdown.showNextCount();

            expect(mockSetTimeout).toHaveBeenCalledWith(
                expect.any(Function),
                1000
            );
        });

        it('should progress through sequence', () => {
            // First count (3)
            countdown.showNextCount();
            expect(mockElement.textContent).toBe('3');
            expect(countdown.currentCount).toBe(0);

            // Simulate timeout callback
            countdown.currentCount++;
            countdown.showNextCount();
            expect(mockElement.textContent).toBe('2');

            // Continue sequence
            countdown.currentCount++;
            countdown.showNextCount();
            expect(mockElement.textContent).toBe('1');

            countdown.currentCount++;
            countdown.showNextCount();
            expect(mockElement.textContent).toBe('GO!');
        });

        it('should complete countdown after sequence', () => {
            countdown.currentCount = 4; // Beyond sequence length
            countdown.showNextCount();

            expect(countdown.isRunning).toBe(false);
            expect(mockCallback).toHaveBeenCalled();
        });
    });

    describe('stop', () => {
        it('should stop running countdown', () => {
            countdown.start(mockCallback);
            countdown.timeoutId = 123;

            countdown.stop();

            expect(countdown.isRunning).toBe(false);
            expect(countdown.currentCount).toBe(0);
            expect(mockClearTimeout).toHaveBeenCalledWith(123);
        });

        it('should not affect stopped countdown', () => {
            countdown.stop();

            expect(countdown.isRunning).toBe(false);
            expect(mockClearTimeout).not.toHaveBeenCalled();
        });

        it('should hide countdown UI', () => {
            countdown.start(mockCallback);
            countdown.stop();

            expect(mockElement.remove).toHaveBeenCalled();
        });
    });

    describe('completeCountdown', () => {
        it('should complete countdown and call callback', () => {
            countdown.start(mockCallback);
            countdown.completeCountdown();

            expect(countdown.isRunning).toBe(false);
            expect(mockCallback).toHaveBeenCalled();
            expect(mockElement.remove).toHaveBeenCalled();
        });

        it('should handle missing callback gracefully', () => {
            countdown.start(null);
            
            expect(() => countdown.completeCountdown()).not.toThrow();
        });
    });

    describe('isActive', () => {
        it('should return running state', () => {
            expect(countdown.isActive()).toBe(false);

            countdown.start(mockCallback);
            expect(countdown.isActive()).toBe(true);

            countdown.stop();
            expect(countdown.isActive()).toBe(false);
        });
    });

    describe('getState', () => {
        it('should return current state', () => {
            const state = countdown.getState();

            expect(state).toEqual({
                isRunning: false,
                currentCount: 0,
                hasElement: false,
                hasTimeout: false
            });
        });

        it('should reflect active state', () => {
            countdown.start(mockCallback);
            countdown.timeoutId = 123;
            countdown.countdownElement = mockElement;

            const state = countdown.getState();

            expect(state.isRunning).toBe(true);
            expect(state.hasElement).toBe(true);
            expect(state.hasTimeout).toBe(true);
        });
    });

    describe('destroy', () => {
        it('should cleanup all resources', () => {
            countdown.start(mockCallback);
            countdown.destroy();

            expect(countdown.isRunning).toBe(false);
            expect(mockElement.remove).toHaveBeenCalled();
        });
    });

    describe('CSS styles', () => {
        it('should add styles only once', () => {
            mockGetElementById.mockReturnValue(null);
            countdown.start(mockCallback);

            mockGetElementById.mockReturnValue(mockElement);
            countdown.start(mockCallback);

            // Should only create styles once
            expect(mockCreateElement).toHaveBeenCalledWith('style');
        });
    });

    describe('timing integration', () => {
        it('should use correct durations for each step', () => {
            countdown.start(mockCallback);

            // Check each step duration
            const timeoutCalls = mockSetTimeout.mock.calls;
            
            // First call should be for '3' with 1000ms
            expect(timeoutCalls[0][1]).toBe(1000);
        });

        it('should handle timeout callbacks correctly', () => {
            countdown.start(mockCallback);
            
            // Get the timeout callback
            const timeoutCallback = mockSetTimeout.mock.calls[0][0];
            
            // Execute callback
            timeoutCallback();
            
            expect(countdown.currentCount).toBe(1);
        });
    });
});