/**
 * Async testing helper utilities
 * Provides utilities for handling asynchronous operations in tests
 */

/**
 * Wait for a condition to be true
 * @param {Function} condition - Function that returns boolean
 * @param {number} timeout - Timeout in ms
 * @param {number} interval - Check interval in ms
 * @returns {Promise<void>}
 */
async function waitFor(condition, timeout = 1000, interval = 50) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        if (await condition()) {
            return;
        }
        await sleep(interval);
    }

    throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Wait for a specific amount of time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Flush all pending promises
 * @returns {Promise<void>}
 */
async function flushPromises() {
    return new Promise((resolve) => setImmediate(resolve));
}

/**
 * Wait for next tick
 * @returns {Promise<void>}
 */
async function nextTick() {
    return new Promise((resolve) => process.nextTick(resolve));
}

/**
 * Wait for next animation frame
 * @returns {Promise<number>}
 */
async function nextFrame() {
    return new Promise((resolve) => requestAnimationFrame(resolve));
}

/**
 * Wait for multiple animation frames
 * @param {number} count - Number of frames to wait
 * @returns {Promise<void>}
 */
async function waitFrames(count = 1) {
    for (let i = 0; i < count; i++) {
        await nextFrame();
    }
}

/**
 * Create a deferred promise
 * @returns {Object} Object with promise, resolve, and reject
 */
function createDeferred() {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

/**
 * Retry an async operation
 * @param {Function} fn - Async function to retry
 * @param {number} maxAttempts - Maximum retry attempts
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise<any>}
 */
async function retry(fn, maxAttempts = 3, delay = 100) {
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (attempt < maxAttempts) {
                await sleep(delay);
            }
        }
    }

    throw lastError;
}

/**
 * Run function with timeout
 * @param {Function} fn - Async function to run
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<any>}
 */
async function withTimeout(fn, timeout) {
    return Promise.race([
        fn(),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)
        ),
    ]);
}

/**
 * Wait for event to be emitted
 * @param {EventEmitter} emitter - Event emitter
 * @param {string} event - Event name
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<any>}
 */
async function waitForEvent(emitter, event, timeout = 1000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            emitter.removeListener(event, handler);
            reject(new Error(`Event '${event}' not emitted within ${timeout}ms`));
        }, timeout);

        const handler = (...args) => {
            clearTimeout(timer);
            resolve(args.length === 1 ? args[0] : args);
        };

        emitter.once(event, handler);
    });
}

/**
 * Wait for DOM event
 * @param {HTMLElement} element - DOM element
 * @param {string} event - Event name
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<Event>}
 */
async function waitForDOMEvent(element, event, timeout = 1000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            element.removeEventListener(event, handler);
            reject(new Error(`DOM event '${event}' not fired within ${timeout}ms`));
        }, timeout);

        const handler = (e) => {
            clearTimeout(timer);
            element.removeEventListener(event, handler);
            resolve(e);
        };

        element.addEventListener(event, handler);
    });
}

/**
 * Mock timer and advance time
 * @param {number} ms - Milliseconds to advance
 */
function advanceTimers(ms) {
    jest.advanceTimersByTime(ms);
}

/**
 * Run all pending timers
 */
function runAllTimers() {
    jest.runAllTimers();
}

/**
 * Run only pending timers
 */
function runOnlyPendingTimers() {
    jest.runOnlyPendingTimers();
}

/**
 * Clear all timers
 */
function clearAllTimers() {
    jest.clearAllTimers();
}

/**
 * Create a mock async function that resolves after delay
 * @param {any} value - Value to resolve with
 * @param {number} delay - Delay in ms
 * @returns {Function}
 */
function createAsyncMock(value, delay = 0) {
    return jest.fn(() => {
        return new Promise((resolve) => {
            setTimeout(() => resolve(value), delay);
        });
    });
}

/**
 * Create a mock async function that rejects after delay
 * @param {Error} error - Error to reject with
 * @param {number} delay - Delay in ms
 * @returns {Function}
 */
function createAsyncMockReject(error, delay = 0) {
    return jest.fn(() => {
        return new Promise((_, reject) => {
            setTimeout(() => reject(error), delay);
        });
    });
}

/**
 * Wait for all microtasks to complete
 * @returns {Promise<void>}
 */
async function flushMicrotasks() {
    return new Promise((resolve) => queueMicrotask(resolve));
}

/**
 * Execute callback after all pending operations
 * @param {Function} callback - Callback to execute
 * @returns {Promise<any>}
 */
async function afterAll(callback) {
    await flushPromises();
    await flushMicrotasks();
    return callback();
}

module.exports = {
    waitFor,
    sleep,
    flushPromises,
    nextTick,
    nextFrame,
    waitFrames,
    createDeferred,
    retry,
    withTimeout,
    waitForEvent,
    waitForDOMEvent,
    advanceTimers,
    runAllTimers,
    runOnlyPendingTimers,
    clearAllTimers,
    createAsyncMock,
    createAsyncMockReject,
    flushMicrotasks,
    afterAll,
};
