const { ServerMonitor } = require('./ServerMonitor');

describe('ServerMonitor', () => {
    let monitor;

    beforeEach(() => {
        monitor = new ServerMonitor({
            metricsInterval: 100,
            enableConsoleOutput: false,
        });
    });

    afterEach(() => {
        if (monitor) {
            monitor.stop();
        }
    });

    describe('initialization', () => {
        it('should initialize with default options', () => {
            const defaultMonitor = new ServerMonitor();
            expect(defaultMonitor.options.metricsInterval).toBe(5000);
            expect(defaultMonitor.options.logLevel).toBe('info');
            expect(defaultMonitor.metrics.startTime).toBeDefined();
        });

        it('should initialize with custom options', () => {
            const customMonitor = new ServerMonitor({
                metricsInterval: 1000,
                logLevel: 'debug',
                cpuThreshold: 90,
            });

            expect(customMonitor.options.metricsInterval).toBe(1000);
            expect(customMonitor.options.logLevel).toBe('debug');
            expect(customMonitor.options.alertThresholds.cpuUsage).toBe(90);
        });

        it('should initialize metrics to zero', () => {
            expect(monitor.metrics.totalRequests).toBe(0);
            expect(monitor.metrics.activeConnections).toBe(0);
            expect(monitor.metrics.errors).toBe(0);
        });
    });

    describe('start and stop', () => {
        it('should start monitoring', () => {
            monitor.start();
            expect(monitor.monitoringInterval).toBeDefined();
            expect(monitor.messageCounterInterval).toBeDefined();
        });

        it('should stop monitoring', () => {
            monitor.start();
            monitor.stop();
            expect(monitor.monitoringInterval).toBeNull();
            expect(monitor.messageCounterInterval).toBeNull();
        });

        it('should log start and stop events', () => {
            const logs = [];
            monitor.on('log', (log) => logs.push(log));

            monitor.start();
            monitor.stop();

            expect(logs.some((log) => log.message.includes('started'))).toBe(true);
            expect(logs.some((log) => log.message.includes('stopped'))).toBe(true);
        });
    });

    describe('metrics collection', () => {
        it('should collect CPU usage metrics', () => {
            const cpuUsage = monitor.getCpuUsage();
            expect(typeof cpuUsage).toBe('number');
            expect(cpuUsage).toBeGreaterThanOrEqual(0);
            expect(cpuUsage).toBeLessThanOrEqual(100);
        });

        it('should collect memory usage metrics', () => {
            const memoryUsage = monitor.getMemoryUsage();
            expect(memoryUsage.total).toBeGreaterThan(0);
            expect(memoryUsage.used).toBeGreaterThan(0);
            expect(memoryUsage.percentage).toBeGreaterThanOrEqual(0);
            expect(memoryUsage.percentage).toBeLessThanOrEqual(100);
            expect(memoryUsage.process.heapUsed).toBeGreaterThan(0);
        });

        it('should calculate uptime', () => {
            const uptime1 = monitor.getUptime();
            expect(uptime1).toBeGreaterThanOrEqual(0);

            // Wait a bit and check again
            setTimeout(() => {
                const uptime2 = monitor.getUptime();
                expect(uptime2).toBeGreaterThan(uptime1);
            }, 100);
        });

        it('should collect complete metrics snapshot', () => {
            const snapshot = monitor.collectMetrics();

            expect(snapshot.timestamp).toBeDefined();
            expect(snapshot.cpu).toBeDefined();
            expect(snapshot.memory).toBeDefined();
            expect(snapshot.uptime).toBeDefined();
            expect(snapshot.connections).toBe(0);
            expect(snapshot.rooms).toBeDefined();
        });

        it('should store metrics in history', () => {
            monitor.collectMetrics();
            monitor.collectMetrics();

            expect(monitor.metricsHistory.length).toBe(2);
        });

        it('should limit metrics history size', () => {
            // Add more than 100 metrics
            for (let i = 0; i < 150; i++) {
                monitor.collectMetrics();
            }

            expect(monitor.metricsHistory.length).toBeLessThanOrEqual(100);
        });
    });

    describe('connection tracking', () => {
        it('should track new connections', () => {
            monitor.trackConnection(true);
            expect(monitor.metrics.activeConnections).toBe(1);
            expect(monitor.metrics.totalRequests).toBe(1);
        });

        it('should track disconnections', () => {
            monitor.trackConnection(true);
            monitor.trackConnection(true);
            monitor.trackConnection(false);

            expect(monitor.metrics.activeConnections).toBe(1);
            expect(monitor.metrics.totalRequests).toBe(2);
        });

        it('should not go below zero connections', () => {
            monitor.trackConnection(false);
            expect(monitor.metrics.activeConnections).toBe(0);
        });
    });

    describe('room tracking', () => {
        it('should track room creation', () => {
            monitor.trackRoom(true, true);
            expect(monitor.metrics.totalRooms).toBe(1);
            expect(monitor.metrics.activeRooms).toBe(1);
        });

        it('should track room closure', () => {
            monitor.trackRoom(true, true);
            monitor.trackRoom(false, false);

            expect(monitor.metrics.totalRooms).toBe(1);
            expect(monitor.metrics.activeRooms).toBe(0);
        });

        it('should not go below zero active rooms', () => {
            monitor.trackRoom(false, false);
            expect(monitor.metrics.activeRooms).toBe(0);
        });
    });

    describe('player tracking', () => {
        it('should track player count', () => {
            monitor.trackPlayers(5);
            expect(monitor.metrics.totalPlayers).toBe(5);

            monitor.trackPlayers(3);
            expect(monitor.metrics.totalPlayers).toBe(3);
        });
    });

    describe('message tracking', () => {
        it('should track messages', () => {
            monitor.trackMessage();
            monitor.trackMessage();
            expect(monitor.messageCounter).toBe(2);
        });

        it('should calculate messages per second', async () => {
            monitor.start();

            monitor.trackMessage();
            monitor.trackMessage();
            monitor.trackMessage();

            await new Promise((resolve) => setTimeout(resolve, 1100));
            expect(monitor.metrics.messagesPerSecond).toBe(3);
        });
    });

    describe('latency tracking', () => {
        it('should track latency measurements', () => {
            monitor.trackLatency(50);
            monitor.trackLatency(100);
            monitor.trackLatency(75);

            const avgLatency = monitor.getAverageLatency();
            expect(avgLatency).toBe(75); // (50 + 100 + 75) / 3
        });

        it('should reset latency counters after threshold', () => {
            // Add many measurements
            for (let i = 0; i < 1500; i++) {
                monitor.trackLatency(50);
            }

            expect(monitor.latencyCount).toBeLessThan(1500);
        });
    });

    describe('logging', () => {
        it('should log messages with correct level', () => {
            const logs = [];
            monitor.on('log', (log) => logs.push(log));

            monitor.log('info', 'Test info message');
            monitor.log('warn', 'Test warning');
            monitor.log('error', 'Test error');

            expect(logs.length).toBe(3);
            expect(logs[0].level).toBe('INFO');
            expect(logs[1].level).toBe('WARN');
            expect(logs[2].level).toBe('ERROR');
        });

        it('should respect log level filtering', () => {
            const warnMonitor = new ServerMonitor({
                logLevel: 'warn',
                enableConsoleOutput: false,
            });

            const logs = [];
            warnMonitor.on('log', (log) => logs.push(log));

            warnMonitor.log('debug', 'Debug message');
            warnMonitor.log('info', 'Info message');
            warnMonitor.log('warn', 'Warning message');
            warnMonitor.log('error', 'Error message');

            expect(logs.length).toBe(2); // Only warn and error
        });

        it('should include metadata in logs', () => {
            const logs = [];
            monitor.on('log', (log) => logs.push(log));

            monitor.log('info', 'Test message', { userId: '123', action: 'connect' });

            expect(logs[0].metadata.userId).toBe('123');
            expect(logs[0].metadata.action).toBe('connect');
        });

        it('should update error and warning counters', () => {
            monitor.log('error', 'Error 1');
            monitor.log('error', 'Error 2');
            monitor.log('warn', 'Warning 1');

            expect(monitor.metrics.errors).toBe(2);
            expect(monitor.metrics.warnings).toBe(1);
        });

        it('should limit log history size', () => {
            const smallMonitor = new ServerMonitor({
                maxLogHistory: 10,
                enableConsoleOutput: false,
            });

            for (let i = 0; i < 20; i++) {
                smallMonitor.log('info', `Message ${i}`);
            }

            expect(smallMonitor.logHistory.length).toBe(10);
        });
    });

    describe('alerts', () => {
        it('should emit alert for high CPU usage', () => {
            return new Promise((resolve) => {
                const alertMonitor = new ServerMonitor({
                    cpuThreshold: 0, // Set very low to trigger alert
                    enableConsoleOutput: false,
                });

                alertMonitor.on('alert', (alert) => {
                    expect(alert.type).toBe('cpu');
                    expect(alert.message).toContain('High CPU usage');
                    resolve();
                });

                alertMonitor.collectMetrics();
            });
        });

        it('should emit alert for high memory usage', () => {
            return new Promise((resolve) => {
                const alertMonitor = new ServerMonitor({
                    memoryThreshold: 0, // Set very low to trigger alert
                    enableConsoleOutput: false,
                });

                alertMonitor.on('alert', (alert) => {
                    expect(alert.type).toBe('memory');
                    expect(alert.message).toContain('High memory usage');
                    resolve();
                });

                alertMonitor.collectMetrics();
            });
        });

        it('should emit alert for high connection count', () => {
            return new Promise((resolve) => {
                const alertMonitor = new ServerMonitor({
                    connectionThreshold: 1,
                    enableConsoleOutput: false,
                });

                alertMonitor.on('alert', (alert) => {
                    expect(alert.type).toBe('connections');
                    expect(alert.message).toContain('High connection count');
                    resolve();
                });

                alertMonitor.trackConnection(true);
                alertMonitor.trackConnection(true);
                alertMonitor.collectMetrics();
            });
        });
    });

    describe('data retrieval', () => {
        it('should get current metrics', () => {
            monitor.trackConnection(true);
            monitor.trackRoom(true, true);

            const metrics = monitor.getMetrics();

            expect(metrics.activeConnections).toBe(1);
            expect(metrics.totalRooms).toBe(1);
            expect(metrics.cpu).toBeDefined();
            expect(metrics.memory).toBeDefined();
        });

        it('should get metrics history with limit', () => {
            for (let i = 0; i < 10; i++) {
                monitor.collectMetrics();
            }

            const history = monitor.getMetricsHistory(5);
            expect(history.length).toBe(5);
        });

        it('should get log history with limit', () => {
            for (let i = 0; i < 10; i++) {
                monitor.log('info', `Message ${i}`);
            }

            const logs = monitor.getLogHistory(5);
            expect(logs.length).toBe(5);
        });

        it('should filter log history by level', () => {
            monitor.log('info', 'Info 1');
            monitor.log('error', 'Error 1');
            monitor.log('info', 'Info 2');
            monitor.log('error', 'Error 2');

            const errorLogs = monitor.getLogHistory(100, 'error');
            expect(errorLogs.length).toBe(2);
            expect(errorLogs.every((log) => log.level === 'ERROR')).toBe(true);
        });

        it('should get dashboard data', () => {
            monitor.trackConnection(true);
            monitor.log('info', 'Test log');

            const dashboard = monitor.getDashboardData();

            expect(dashboard.current).toBeDefined();
            expect(dashboard.history).toBeDefined();
            expect(dashboard.logs).toBeDefined();
            expect(dashboard.summary).toBeDefined();
            expect(dashboard.summary.uptime).toBeGreaterThanOrEqual(0);
        });
    });

    describe('metrics reset', () => {
        it('should reset error and warning counters', () => {
            monitor.log('error', 'Error');
            monitor.log('warn', 'Warning');

            expect(monitor.metrics.errors).toBe(1);
            expect(monitor.metrics.warnings).toBe(1);

            monitor.resetMetrics();

            expect(monitor.metrics.errors).toBe(0);
            expect(monitor.metrics.warnings).toBe(0);
        });
    });
});
