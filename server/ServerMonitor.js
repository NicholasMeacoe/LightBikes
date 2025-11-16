/**
 * ServerMonitor - Comprehensive server performance monitoring and logging
 * Tracks CPU, memory, network usage, and provides real-time health metrics
 */

const os = require('os');
const EventEmitter = require('events');

class ServerMonitor extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            metricsInterval: options.metricsInterval || 5000, // 5 seconds
            logLevel: options.logLevel || 'info', // debug, info, warn, error
            enableConsoleOutput: options.enableConsoleOutput !== false,
            maxLogHistory: options.maxLogHistory || 1000,
            alertThresholds: {
                cpuUsage: options.cpuThreshold || 80, // percentage
                memoryUsage: options.memoryThreshold || 85, // percentage
                activeConnections: options.connectionThreshold || 1000
            }
        };
        
        this.metrics = {
            startTime: Date.now(),
            totalRequests: 0,
            activeConnections: 0,
            totalRooms: 0,
            activeRooms: 0,
            totalPlayers: 0,
            messagesPerSecond: 0,
            averageLatency: 0,
            errors: 0,
            warnings: 0
        };
        
        this.logHistory = [];
        this.metricsHistory = [];
        this.messageCounter = 0;
        this.latencySum = 0;
        this.latencyCount = 0;
        this.lastCpuUsage = null;
        this.monitoringInterval = null;
        this.messageCounterInterval = null;
    }
    
    /**
     * Start monitoring server performance
     */
    start() {
        this.log('info', 'ServerMonitor started');
        
        // Start metrics collection
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
        }, this.options.metricsInterval);
        
        // Start message counter reset
        this.messageCounterInterval = setInterval(() => {
            this.metrics.messagesPerSecond = this.messageCounter;
            this.messageCounter = 0;
        }, 1000);
        
        // Initial metrics collection
        this.collectMetrics();
    }
    
    /**
     * Stop monitoring
     */
    stop() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        if (this.messageCounterInterval) {
            clearInterval(this.messageCounterInterval);
            this.messageCounterInterval = null;
        }
        
        this.log('info', 'ServerMonitor stopped');
    }
    
    /**
     * Collect current performance metrics
     */
    collectMetrics() {
        const cpuUsage = this.getCpuUsage();
        const memoryUsage = this.getMemoryUsage();
        const uptime = this.getUptime();
        
        const snapshot = {
            timestamp: Date.now(),
            cpu: cpuUsage,
            memory: memoryUsage,
            uptime: uptime,
            connections: this.metrics.activeConnections,
            rooms: {
                total: this.metrics.totalRooms,
                active: this.metrics.activeRooms
            },
            players: this.metrics.totalPlayers,
            messagesPerSecond: this.metrics.messagesPerSecond,
            averageLatency: this.getAverageLatency(),
            errors: this.metrics.errors,
            warnings: this.metrics.warnings
        };
        
        // Store in history
        this.metricsHistory.push(snapshot);
        if (this.metricsHistory.length > 100) {
            this.metricsHistory.shift();
        }
        
        // Check thresholds and emit alerts
        this.checkThresholds(snapshot);
        
        // Emit metrics event
        this.emit('metrics', snapshot);
        
        return snapshot;
    }
    
    /**
     * Get CPU usage percentage
     */
    getCpuUsage() {
        const cpus = os.cpus();
        
        let totalIdle = 0;
        let totalTick = 0;
        
        cpus.forEach(cpu => {
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        });
        
        const idle = totalIdle / cpus.length;
        const total = totalTick / cpus.length;
        
        if (this.lastCpuUsage) {
            const idleDiff = idle - this.lastCpuUsage.idle;
            const totalDiff = total - this.lastCpuUsage.total;
            const usage = 100 - (100 * idleDiff / totalDiff);
            
            this.lastCpuUsage = { idle, total };
            return Math.max(0, Math.min(100, usage));
        }
        
        this.lastCpuUsage = { idle, total };
        return 0;
    }
    
    /**
     * Get memory usage information
     */
    getMemoryUsage() {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const usagePercentage = (usedMemory / totalMemory) * 100;
        
        const processMemory = process.memoryUsage();
        
        return {
            total: totalMemory,
            free: freeMemory,
            used: usedMemory,
            percentage: usagePercentage,
            process: {
                heapUsed: processMemory.heapUsed,
                heapTotal: processMemory.heapTotal,
                external: processMemory.external,
                rss: processMemory.rss
            }
        };
    }
    
    /**
     * Get server uptime in seconds
     */
    getUptime() {
        return Math.floor((Date.now() - this.metrics.startTime) / 1000);
    }
    
    /**
     * Get average latency
     */
    getAverageLatency() {
        if (this.latencyCount === 0) return 0;
        const avg = this.latencySum / this.latencyCount;
        
        // Reset counters periodically
        if (this.latencyCount > 1000) {
            this.latencySum = 0;
            this.latencyCount = 0;
        }
        
        return Math.round(avg);
    }
    
    /**
     * Check thresholds and emit alerts
     */
    checkThresholds(snapshot) {
        const thresholds = this.options.alertThresholds;
        
        if (snapshot.cpu > thresholds.cpuUsage) {
            this.alert('cpu', `High CPU usage: ${snapshot.cpu.toFixed(2)}%`, snapshot);
        }
        
        if (snapshot.memory.percentage > thresholds.memoryUsage) {
            this.alert('memory', `High memory usage: ${snapshot.memory.percentage.toFixed(2)}%`, snapshot);
        }
        
        if (snapshot.connections > thresholds.activeConnections) {
            this.alert('connections', `High connection count: ${snapshot.connections}`, snapshot);
        }
    }
    
    /**
     * Emit alert
     */
    alert(type, message, data) {
        this.log('warn', `ALERT [${type}]: ${message}`);
        this.emit('alert', { type, message, data, timestamp: Date.now() });
    }
    
    /**
     * Log message with level
     */
    log(level, message, metadata = {}) {
        const logLevels = { debug: 0, info: 1, warn: 2, error: 3 };
        const currentLevel = logLevels[this.options.logLevel] || 1;
        const messageLevel = logLevels[level] || 1;
        
        if (messageLevel < currentLevel) return;
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: level.toUpperCase(),
            message,
            metadata
        };
        
        // Store in history
        this.logHistory.push(logEntry);
        if (this.logHistory.length > this.options.maxLogHistory) {
            this.logHistory.shift();
        }
        
        // Update counters
        if (level === 'error') this.metrics.errors++;
        if (level === 'warn') this.metrics.warnings++;
        
        // Console output
        if (this.options.enableConsoleOutput) {
            const prefix = `[${logEntry.timestamp}] [${logEntry.level}]`;
            const metaStr = Object.keys(metadata).length > 0 ? ` ${JSON.stringify(metadata)}` : '';
            console.log(`${prefix} ${message}${metaStr}`);
        }
        
        // Emit log event
        this.emit('log', logEntry);
    }
    
    /**
     * Track connection event
     */
    trackConnection(connected = true) {
        if (connected) {
            this.metrics.activeConnections++;
            this.metrics.totalRequests++;
        } else {
            this.metrics.activeConnections = Math.max(0, this.metrics.activeConnections - 1);
        }
    }
    
    /**
     * Track room event
     */
    trackRoom(created = true, active = true) {
        if (created) {
            this.metrics.totalRooms++;
            if (active) this.metrics.activeRooms++;
        } else {
            this.metrics.activeRooms = Math.max(0, this.metrics.activeRooms - 1);
        }
    }
    
    /**
     * Track player count
     */
    trackPlayers(count) {
        this.metrics.totalPlayers = count;
    }
    
    /**
     * Track message
     */
    trackMessage() {
        this.messageCounter++;
    }
    
    /**
     * Track latency measurement
     */
    trackLatency(latency) {
        this.latencySum += latency;
        this.latencyCount++;
        this.metrics.averageLatency = this.getAverageLatency();
    }
    
    /**
     * Get current metrics snapshot
     */
    getMetrics() {
        return {
            ...this.metrics,
            cpu: this.getCpuUsage(),
            memory: this.getMemoryUsage(),
            uptime: this.getUptime(),
            averageLatency: this.getAverageLatency()
        };
    }
    
    /**
     * Get metrics history
     */
    getMetricsHistory(limit = 100) {
        return this.metricsHistory.slice(-limit);
    }
    
    /**
     * Get log history
     */
    getLogHistory(limit = 100, level = null) {
        let logs = this.logHistory;
        
        if (level) {
            logs = logs.filter(log => log.level === level.toUpperCase());
        }
        
        return logs.slice(-limit);
    }
    
    /**
     * Get dashboard data
     */
    getDashboardData() {
        const currentMetrics = this.collectMetrics();
        const recentLogs = this.getLogHistory(50);
        const metricsHistory = this.getMetricsHistory(20);
        
        return {
            current: currentMetrics,
            history: metricsHistory,
            logs: recentLogs,
            summary: {
                uptime: this.getUptime(),
                totalRequests: this.metrics.totalRequests,
                totalRooms: this.metrics.totalRooms,
                errors: this.metrics.errors,
                warnings: this.metrics.warnings
            }
        };
    }
    
    /**
     * Reset metrics
     */
    resetMetrics() {
        this.metrics.errors = 0;
        this.metrics.warnings = 0;
        this.log('info', 'Metrics reset');
    }
}

module.exports = { ServerMonitor };
