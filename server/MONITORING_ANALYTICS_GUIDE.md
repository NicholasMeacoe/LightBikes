# Monitoring and Analytics Guide

This guide explains how to use the ServerMonitor and PlayerAnalytics systems to track server performance and player behavior in the LightBikes multiplayer system.

## Overview

The monitoring and analytics systems provide comprehensive tracking of:

- **Server Performance**: CPU, memory, network usage, and system health
- **Player Behavior**: Session tracking, game statistics, and anomaly detection
- **Anti-Cheat**: Violation tracking and suspicious activity detection
- **Real-time Alerts**: Automated notifications for system issues

## ServerMonitor

### Purpose

ServerMonitor tracks server performance metrics and provides real-time health monitoring with automated alerting for critical issues.

### Features

- **Performance Metrics**: CPU usage, memory usage, uptime
- **Connection Tracking**: Active connections, total requests
- **Room Management**: Total rooms, active rooms
- **Network Metrics**: Messages per second, average latency
- **Logging System**: Comprehensive logging with level filtering
- **Alert System**: Automated alerts for threshold violations
- **Dashboard Data**: Real-time metrics for monitoring dashboards

### Basic Usage

```javascript
const { ServerMonitor } = require('./ServerMonitor');

// Initialize monitor
const monitor = new ServerMonitor({
    metricsInterval: 5000,      // Collect metrics every 5 seconds
    logLevel: 'info',            // Log level: debug, info, warn, error
    enableConsoleOutput: true,   // Enable console logging
    cpuThreshold: 80,            // Alert at 80% CPU usage
    memoryThreshold: 85,         // Alert at 85% memory usage
    connectionThreshold: 1000    // Alert at 1000 connections
});

// Start monitoring
monitor.start();

// Track events
monitor.trackConnection(true);   // New connection
monitor.trackConnection(false);  // Disconnection
monitor.trackRoom(true, true);   // Room created
monitor.trackMessage();          // Message sent
monitor.trackLatency(50);        // Latency measurement

// Logging
monitor.log('info', 'Server started');
monitor.log('error', 'Connection failed', { reason: 'timeout' });

// Get current metrics
const metrics = monitor.getMetrics();
console.log('CPU:', metrics.cpu);
console.log('Memory:', metrics.memory.percentage);

// Get dashboard data
const dashboard = monitor.getDashboardData();
```

### Event Listeners

```javascript
// Metrics collected
monitor.on('metrics', (snapshot) => {
    console.log('CPU:', snapshot.cpu);
    console.log('Memory:', snapshot.memory.percentage);
    console.log('Connections:', snapshot.connections);
});

// Alert triggered
monitor.on('alert', (alert) => {
    console.error('ALERT:', alert.type, alert.message);
    // Send to alerting system (PagerDuty, Slack, etc.)
});

// Log entry created
monitor.on('log', (log) => {
    // Send to logging service (CloudWatch, Datadog, etc.)
});
```

### Metrics Structure

```javascript
{
    timestamp: 1699999999999,
    cpu: 45.2,                    // CPU usage percentage
    memory: {
        total: 16777216000,       // Total system memory
        free: 8388608000,         // Free memory
        used: 8388608000,         // Used memory
        percentage: 50.0,         // Usage percentage
        process: {
            heapUsed: 50000000,   // Node.js heap used
            heapTotal: 100000000, // Node.js heap total
            external: 1000000,    // External memory
            rss: 150000000        // Resident set size
        }
    },
    uptime: 3600,                 // Server uptime in seconds
    connections: 50,              // Active connections
    rooms: {
        total: 100,               // Total rooms created
        active: 25                // Currently active rooms
    },
    players: 50,                  // Total players
    messagesPerSecond: 1000,      // Message throughput
    averageLatency: 45,           // Average latency in ms
    errors: 5,                    // Total errors
    warnings: 10                  // Total warnings
}
```

## PlayerAnalytics

### Purpose

PlayerAnalytics tracks player behavior, generates statistics, and detects anomalies for anti-cheat improvement and performance analysis.

### Features

- **Session Tracking**: Player session duration, games played, wins/losses
- **Behavior Patterns**: Movement patterns, reaction times, win rates
- **Anomaly Detection**: Suspicious behavior detection
- **Violation Tracking**: Anti-cheat violation logging
- **Player Statistics**: Comprehensive player performance data
- **Reporting**: Automated analytics reports

### Basic Usage

```javascript
const { PlayerAnalytics } = require('./PlayerAnalytics');

// Initialize analytics
const analytics = new PlayerAnalytics({
    sessionTimeout: 300000,      // 5 minute session timeout
    anomalyThreshold: 3,         // Standard deviations for anomaly
    reportInterval: 60000,       // Generate report every minute
    maxPlayerHistory: 10000      // Maximum history entries
});

// Start analytics
analytics.start();

// Track player session
analytics.startSession('player123', { name: 'John' });
analytics.endSession('player123');

// Track games
analytics.trackGameStart('player123', { mode: 'classic' });
analytics.trackGameEnd('player123', {
    won: true,
    duration: 30000,
    moves: 150
});

// Track movement
analytics.trackMovement('player123', {
    speed: 5.0,
    directionChange: true,
    reactionTime: 150
});

// Track violations
analytics.trackViolation('player123', {
    type: 'speed_hack',
    severity: 'high',
    details: 'Impossible movement detected'
});

// Track connections
analytics.trackDisconnection('player123', 'timeout');
analytics.trackReconnection('player123');

// Get player statistics
const stats = analytics.getPlayerStats('player123');
console.log('Win rate:', stats.behaviorPattern.winRate);
console.log('Total games:', stats.behaviorPattern.totalGames);

// Generate report
const report = analytics.generateReport();
console.log('Top players:', report.topPlayers);
console.log('Suspicious players:', report.suspiciousPlayers);
```

### Event Listeners

```javascript
// Session events
analytics.on('sessionStart', (data) => {
    console.log('Session started:', data.playerId);
});

analytics.on('sessionEnd', (data) => {
    console.log('Session ended:', data.session.duration);
});

// Game events
analytics.on('gameStart', (data) => {
    console.log('Game started:', data.playerId);
});

analytics.on('gameEnd', (data) => {
    console.log('Game ended:', data.result);
});

// Anomaly detected
analytics.on('anomaly', (anomaly) => {
    console.warn('Anomaly:', anomaly.type, anomaly.playerId);
});

// Violation detected
analytics.on('violation', (violation) => {
    console.error('Violation:', violation.violation.type);
});

// Report generated
analytics.on('report', (report) => {
    console.log('Analytics report:', report.global);
});
```

### Player Statistics Structure

```javascript
{
    currentSession: {
        playerId: 'player123',
        startTime: 1699999999999,
        endTime: null,
        duration: 0,
        gamesPlayed: 5,
        wins: 3,
        losses: 2,
        totalMoves: 500,
        averageMovesPerGame: 100,
        disconnections: 1,
        reconnections: 1,
        violations: []
    },
    behaviorPattern: {
        playerId: 'player123',
        totalGames: 50,
        winRate: 0.6,
        averageGameDuration: 30000,
        movementPatterns: {
            averageSpeed: 5.0,
            directionChanges: 150,
            averageReactionTime: 150
        },
        suspiciousActivities: 0,
        lastSeen: 1699999999999
    },
    sessionHistory: [...],
    anomalies: [...],
    stats: {
        totalSessions: 10,
        totalGames: 50,
        winRate: 0.6,
        suspiciousActivities: 0
    }
}
```

## Integration with GameServer

See `monitoring-integration-example.js` for a complete example of integrating monitoring and analytics with the game server.

### Key Integration Points

1. **Connection Events**: Track connections and disconnections
2. **Room Events**: Track room creation and closure
3. **Game Events**: Track game start and end
4. **Message Events**: Track message throughput
5. **Violation Events**: Track anti-cheat violations
6. **Error Events**: Log server errors

### Example Integration

```javascript
const { GameServer } = require('./GameServer');
const { ServerMonitor } = require('./ServerMonitor');
const { PlayerAnalytics } = require('./PlayerAnalytics');

const monitor = new ServerMonitor();
const analytics = new PlayerAnalytics();
const gameServer = new GameServer(3000);

monitor.start();
analytics.start();

// Track connections
gameServer.on('connection', (socket) => {
    monitor.trackConnection(true);
    analytics.startSession(socket.id);
});

// Track games
gameServer.on('gameStart', (room) => {
    room.players.forEach(player => {
        analytics.trackGameStart(player.id);
    });
});

// Track violations
gameServer.on('violation', (playerId, violation) => {
    analytics.trackViolation(playerId, violation);
    monitor.log('warn', 'Violation detected', { playerId });
});

gameServer.start();
```

## Monitoring Dashboard

### Getting Dashboard Data

```javascript
// Server monitoring dashboard
const serverDashboard = monitor.getDashboardData();
// Returns: { current, history, logs, summary }

// Analytics dashboard
const analyticsDashboard = {
    global: analytics.getGlobalStats(),
    topPlayers: analytics.getTopPlayers(10),
    suspiciousPlayers: analytics.getSuspiciousPlayers(10),
    recentAnomalies: analytics.getAnomalies(50)
};
```

### Dashboard Metrics

**Server Dashboard:**
- Current CPU, memory, network metrics
- Metrics history (last 20 snapshots)
- Recent logs (last 50 entries)
- Summary statistics

**Analytics Dashboard:**
- Global statistics (sessions, games, violations)
- Top players by win rate
- Suspicious players by violation count
- Recent anomalies

## Alerting

### Alert Types

1. **CPU Alert**: Triggered when CPU usage exceeds threshold
2. **Memory Alert**: Triggered when memory usage exceeds threshold
3. **Connection Alert**: Triggered when connection count exceeds threshold

### Handling Alerts

```javascript
monitor.on('alert', (alert) => {
    // alert.type: 'cpu', 'memory', 'connections'
    // alert.message: Human-readable message
    // alert.data: Metrics snapshot
    
    // Send to alerting system
    sendToSlack(alert.message);
    sendToPagerDuty(alert);
    
    // Log to monitoring service
    logToDatadog(alert);
});
```

## Data Cleanup

### Automatic Cleanup

```javascript
// Clean up data older than 24 hours
setInterval(() => {
    analytics.clearOldData(86400000);
}, 86400000);
```

### Manual Cleanup

```javascript
// Clear old player history
analytics.clearOldData(86400000);

// Reset error counters
monitor.resetMetrics();
```

## Best Practices

1. **Set Appropriate Thresholds**: Configure alert thresholds based on your server capacity
2. **Regular Cleanup**: Clean up old data to prevent memory issues
3. **Log Aggregation**: Send logs to external service for long-term storage
4. **Alert Integration**: Integrate with alerting systems for critical issues
5. **Dashboard Monitoring**: Create real-time dashboards for operations team
6. **Anomaly Review**: Regularly review anomalies to improve anti-cheat
7. **Performance Tuning**: Use metrics to identify performance bottlenecks

## Production Deployment

### Recommended Configuration

```javascript
const monitor = new ServerMonitor({
    metricsInterval: 5000,
    logLevel: 'info',
    enableConsoleOutput: false,  // Use external logging
    cpuThreshold: 80,
    memoryThreshold: 85,
    connectionThreshold: 1000
});

const analytics = new PlayerAnalytics({
    sessionTimeout: 300000,
    reportInterval: 60000,
    anomalyThreshold: 3,
    maxPlayerHistory: 10000
});
```

### External Service Integration

```javascript
// CloudWatch integration
monitor.on('metrics', (snapshot) => {
    cloudwatch.putMetricData({
        Namespace: 'LightBikes',
        MetricData: [
            { MetricName: 'CPUUsage', Value: snapshot.cpu },
            { MetricName: 'MemoryUsage', Value: snapshot.memory.percentage }
        ]
    });
});

// Datadog integration
monitor.on('log', (log) => {
    datadog.log(log.level, log.message, log.metadata);
});

// Slack integration
monitor.on('alert', (alert) => {
    slack.sendMessage({
        channel: '#alerts',
        text: `🚨 ${alert.message}`
    });
});
```

## Troubleshooting

### High CPU Usage

1. Check metrics history for patterns
2. Review active connections and rooms
3. Check for message throughput spikes
4. Review error logs for issues

### Memory Leaks

1. Monitor process memory over time
2. Check for growing player history
3. Verify data cleanup is running
4. Review anomaly and log history sizes

### False Positive Anomalies

1. Adjust anomaly threshold
2. Review baseline data requirements
3. Check for network jitter affecting measurements
4. Tune movement validation thresholds

## API Reference

See inline documentation in `ServerMonitor.js` and `PlayerAnalytics.js` for complete API reference.
