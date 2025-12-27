/**
 * Tests for CountdownTimer
 */

describe('CountdownTimer', () => {
    let CountdownTimer;
    let countdown;
    let setTimeoutSpy;
    let clearTimeoutSpy;

    beforeEach(() => {
        // Clear DOM
        document.body.innerHTML = '';
        document.head.innerHTML = '';

        setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockReturnValue(123);
        clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

        jest.isolateModules(() => {
            CountdownTimer = require('@/ui/CountdownTimer.js').CountdownTimer;
        });

        jest.clearAllMocks();
        countdown = new CountdownTimer();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should start countdown sequence', () => {
        const callback = jest.fn();
        countdown.start(callback);
        expect(countdown.isRunning).toBe(true);
        expect(document.getElementById('countdown-display')).not.toBeNull();
    });

    it('should display count and handle sequence', () => {
        countdown.start(jest.fn());
        const el = document.getElementById('countdown-display');
        expect(el.textContent).toBe('3');
        expect(el.className).toContain('countdown-show');
    });

    it('should stop and cleanup', () => {
        countdown.start(jest.fn());
        const el = document.getElementById('countdown-display');
        const spy = jest.spyOn(el, 'remove');

        countdown.stop();
        expect(countdown.isRunning).toBe(false);
        expect(spy).toHaveBeenCalled();
    });

    it('should complete and call callback', () => {
        const callback = jest.fn();
        countdown.start(callback);
        countdown.currentCount = 4; // Force completion
        countdown.showNextCount();
        expect(countdown.isRunning).toBe(false);
        expect(callback).toHaveBeenCalled();
    });
});
