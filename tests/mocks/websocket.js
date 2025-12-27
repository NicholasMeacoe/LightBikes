/**
 * Mock factory for WebSocket connections
 * Provides lightweight mocks for testing network functionality
 */

/**
 * Create a mock WebSocket
 */
function createMockWebSocket(url = 'ws://localhost:3000') {
    const listeners = {};

    const socket = {
        url,
        readyState: 0, // CONNECTING
        CONNECTING: 0,
        OPEN: 1,
        CLOSING: 2,
        CLOSED: 3,
        binaryType: 'blob',
        bufferedAmount: 0,
        extensions: '',
        protocol: '',
        send: jest.fn(),
        close: jest.fn(function (code, reason) {
            this.readyState = this.CLOSED;
            this.emit('close', { code, reason });
        }),
        addEventListener: jest.fn(function (event, handler) {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(handler);
        }),
        removeEventListener: jest.fn(function (event, handler) {
            if (listeners[event]) {
                listeners[event] = listeners[event].filter((h) => h !== handler);
            }
        }),
        dispatchEvent: jest.fn(),
        // Helper methods for testing
        emit: function (event, data) {
            if (listeners[event]) {
                listeners[event].forEach((handler) => handler(data));
            }
            if (this[`on${event}`]) {
                this[`on${event}`](data);
            }
        },
        simulateOpen: function () {
            this.readyState = this.OPEN;
            this.emit('open', {});
        },
        simulateMessage: function (data) {
            this.emit('message', { data });
        },
        simulateError: function (error) {
            this.emit('error', error);
        },
        simulateClose: function (code = 1000, reason = '') {
            this.readyState = this.CLOSED;
            this.emit('close', { code, reason, wasClean: code === 1000 });
        },
        onopen: null,
        onmessage: null,
        onerror: null,
        onclose: null,
    };

    return socket;
}

/**
 * Create a mock Socket.io client socket
 */
function createMockSocketIO(url = 'http://localhost:3000') {
    const listeners = {};

    const socket = {
        id: 'mock-socket-id',
        connected: false,
        disconnected: true,
        io: {
            uri: url,
            opts: {},
        },
        on: jest.fn(function (event, handler) {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(handler);
            return this;
        }),
        once: jest.fn(function (event, handler) {
            const wrappedHandler = (...args) => {
                handler(...args);
                this.off(event, wrappedHandler);
            };
            return this.on(event, wrappedHandler);
        }),
        off: jest.fn(function (event, handler) {
            if (listeners[event]) {
                if (handler) {
                    listeners[event] = listeners[event].filter((h) => h !== handler);
                } else {
                    delete listeners[event];
                }
            }
            return this;
        }),
        emit: jest.fn(function (event, ...args) {
            // Simulate server response for testing
            return this;
        }),
        send: jest.fn(function (...args) {
            return this.emit('message', ...args);
        }),
        connect: jest.fn(function () {
            this.connected = true;
            this.disconnected = false;
            this.simulateEvent('connect');
            return this;
        }),
        disconnect: jest.fn(function () {
            this.connected = false;
            this.disconnected = true;
            this.simulateEvent('disconnect', 'io client disconnect');
            return this;
        }),
        close: jest.fn(function () {
            return this.disconnect();
        }),
        // Helper methods for testing
        simulateEvent: function (event, ...args) {
            if (listeners[event]) {
                listeners[event].forEach((handler) => handler(...args));
            }
        },
        simulateConnect: function () {
            this.connected = true;
            this.disconnected = false;
            this.simulateEvent('connect');
        },
        simulateDisconnect: function (reason = 'transport close') {
            this.connected = false;
            this.disconnected = true;
            this.simulateEvent('disconnect', reason);
        },
        simulateError: function (error) {
            this.simulateEvent('error', error);
        },
        simulateMessage: function (event, data) {
            this.simulateEvent(event, data);
        },
        simulateReconnect: function (attemptNumber = 1) {
            this.simulateEvent('reconnect', attemptNumber);
        },
        simulateReconnectAttempt: function (attemptNumber = 1) {
            this.simulateEvent('reconnect_attempt', attemptNumber);
        },
        simulateReconnectError: function (error) {
            this.simulateEvent('reconnect_error', error);
        },
        simulateReconnectFailed: function () {
            this.simulateEvent('reconnect_failed');
        },
    };

    return socket;
}

/**
 * Create a mock Socket.io server-side socket
 */
function createMockServerSocket(id = 'mock-socket-id') {
    const listeners = {};
    const rooms = new Set();

    const socket = {
        id,
        connected: true,
        disconnected: false,
        handshake: {
            headers: {},
            query: {},
            auth: {},
            address: '127.0.0.1',
        },
        rooms,
        on: jest.fn(function (event, handler) {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(handler);
            return this;
        }),
        once: jest.fn(function (event, handler) {
            const wrappedHandler = (...args) => {
                handler(...args);
                this.off(event, wrappedHandler);
            };
            return this.on(event, wrappedHandler);
        }),
        off: jest.fn(function (event, handler) {
            if (listeners[event]) {
                if (handler) {
                    listeners[event] = listeners[event].filter((h) => h !== handler);
                } else {
                    delete listeners[event];
                }
            }
            return this;
        }),
        emit: jest.fn(),
        send: jest.fn(),
        join: jest.fn(function (room) {
            rooms.add(room);
            return this;
        }),
        leave: jest.fn(function (room) {
            rooms.delete(room);
            return this;
        }),
        to: jest.fn(function (room) {
            return this;
        }),
        in: jest.fn(function (room) {
            return this.to(room);
        }),
        disconnect: jest.fn(function (close = false) {
            this.connected = false;
            this.disconnected = true;
            return this;
        }),
        // Helper methods for testing
        simulateEvent: function (event, ...args) {
            if (listeners[event]) {
                listeners[event].forEach((handler) => handler(...args));
            }
        },
    };

    return socket;
}

module.exports = {
    createMockWebSocket,
    createMockSocketIO,
    createMockServerSocket,
};
