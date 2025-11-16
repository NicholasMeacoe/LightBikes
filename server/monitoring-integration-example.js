/**
 * Example: Integrating ServerMonitor and PlayerAnalytics with GameServer
 * 
 * This example demonstrates how to use the monitoring and analytics systems
 * to track server performance and player behavior in a production environment.
 */

const { GameServer } = require('./GameServer');
const { ServerMonitor } = require('./ServerMonitor');
const { PlayerAnalytics } = require('./PlayerAnalytics');

// Initialize monitoring systems
const monitor = new ServerMonitor({
    metricsInterval: 5000, // Collect metrics every 5 seconds
    logLevel: 'info',
    enableConsoleOutput: true,
    cpuThreshold: 80,
    memoryThreshold: 85,
    connectionThreshold: 1000
});

const analytics = new PlayerAnalytics({
    sessionTimeout: 300000, // 5 minutes
    reportInterval: 60000, // Generate report every minute
    anomalyThreshold: 3
});

// Start monitoring
monitor.start();
analytics.start();

// Set up event listeners for monitoring
monitor.on('metrics', (snapshot) => {
    console.log('Server Metrics:', {
        cpu: `${snapshot.cpu.toFixed(2)}%`,
        memory: `${snapshot.memory.percentage.toFixed(2)}%`,
        connections: snapshot.connections,
        rooms: snapshot.rooms,
        messagesPerSecond: snapshot.messagesPerSecond
    });
});

monitor.on('alert', (alert) => {
    console.error('ALERT:', alert.message);
    // In production, send to alerting system (PagerDuty, Slack, etc.)
});

monitor.on('log', (log) => {
    // In production, send to logging service (CloudWatch, Datadog, etc.)
    if (log.level === 'ERROR') {
        console.error(`[${log.timestamp}] ${log.message}`, log.metadata);
    }
});

// Set up event listeners for analytics
analytics.on('report', (report) => {
    console.log('Analytics Report:', {
        activeSessions: report.activeSessions.length,
        totalGames: report.global.totalGames,
        peakPlayers: report.global.peakConcurrentPlayers,
        violations: report.global.totalViolations,
        topPlayers: report.topPlayers.length,
        suspiciousPlayers: report.suspiciousPlayers.length
    });
});

analytics.on('anomaly', (anomaly) => {
    console.warn('Anomaly detected:', {
        player: anomaly.playerId,
        type: anomaly.type,
        data: anomaly.data
    });
});

analytics.on('violation', (violation) => {
    console.error('Violation detected:', {
        player: violation.playerId,
        type: violation.violation.type,
        severity: violation.violation.severity
    });
    
    // Log to monitor
    monitor.log('warn', 'Player violation detected', {
        playerId: violation.playerId,
        type: violation.violation.type
    });
});

// Initialize game server
const gameServer = new GameServer(3000);

// Integrate monitoring with game server events
gameServer.on('connection', (socket) => {
    monitor.trackConnection(true);
    monitor.log('info', 'Player connected', { socketId: socket.id });
    
    // Start player session
    analytics.startSession(socket.id, {
        ip: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent']
    });
});

gameServer.on('disconnect', (socket) => {
    monitor.trackConnection(false);
    monitor.log('info', 'Player disconnected', { socketId: socket.id });
    
    // End player session
    analytics.endSession(socket.id);
});

gameServer.on('roomCreated', (room) => {
    monitor.trackRoom(true, true);
    monitor.log('info', 'Room created', { roomId: room.id });
});

gameServer.on('roomClosed', (room) => {
    monitor.trackRoom(false, false);
    monitor.log('info', 'Room closed', { roomId: room.id });
});

gameServer.on('gameStart', (room) => {
    monitor.log('info', 'Game started', { roomId: room.id });
    
    // Track game start for all players
    room.players.forEach(player => {
        analytics.trackGameStart(player.id, {
            roomId: room.id,
            gameMode: room.settings.gameMode
        });
    });
});

gameServer.on('gameEnd', (room, results) => {
    monitor.log('info', 'Game ended', { 
        roomId: room.id,
        winner: results.winner
    });
    
    // Track game end for all players
    room.players.forEach(player => {
        analytics.trackGameEnd(player.id, {
            won: player.id === results.winner,
            duration: results.duration,
            moves: player.moveCount || 0
        });
    });
});

gameServer.on('message', (socket, message) => {
    monitor.trackMessage();
    
    // Track player movement
    if (message.type === 'input') {
        analytics.trackMovement(socket.id, {
            speed: message.speed,
            directionChange: message.directionChange,
            reactionTime: message.reactionTime
        });
    }
});

gameServer.on('latencyUpdate', (socket, latency) => {
    monitor.trackLatency(latency);
});

gameServer.on('violation', (playerId, violation) => {
    analytics.trackViolation(playerId, violation);
});

gameServer.on('error', (error) => {
    monitor.log('error', 'Server error', { 
        message: error.message,
        stack: error.stack
    });
});

// Start the game server
gameServer.start();

// Expose monitoring dashboard endpoint (for HTTP server integration)
function getMonitoringDashboard() {
    return {
        server: monitor.getDashboardData(),
        analytics: {
            global: analytics.getGlobalStats(),
            topPlayers: analytics.getTopPlayers(10),
            suspiciousPlayers: analytics.getSuspiciousPlayers(10),
            recentAnomalies: analytics.getAnomalies(50)
        }
    };
}

// Periodic cleanup (run daily)
setInterval(() => {
    analytics.clearOldData(86400000); // Clear data older than 24 hours
    monitor.log('info', 'Performed data cleanup');
}, 86400000);

// Graceful shutdown
process.on('SIGTERM', () => {
    monitor.log('info', 'Shutting down server...');
    
    monitor.stop();
    analytics.stop();
    gameServer.stop();
    
    process.exit(0);
});

// Export for use in other modules
module.exports = {
    monitor,
    analytics,
    gameServer,
    getMonitoringDashboard
};

console.log('Game server with monitoring started on port 3000');
console.log('Monitoring dashboard available via getMonitoringDashboard()');
