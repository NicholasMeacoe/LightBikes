/**
 * PlayerAnalytics - Track player behavior and generate analytics reports
 * Used for anti-cheat improvement and server performance analysis
 */

const EventEmitter = require('events');

class PlayerAnalytics extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            sessionTimeout: options.sessionTimeout || 300000, // 5 minutes
            anomalyThreshold: options.anomalyThreshold || 3, // Standard deviations
            reportInterval: options.reportInterval || 60000, // 1 minute
            maxPlayerHistory: options.maxPlayerHistory || 10000
        };
        
        this.playerSessions = new Map(); // playerId -> session data
        this.playerHistory = []; // Historical player data
        this.globalStats = {
            totalSessions: 0,
            totalGames: 0,
            totalPlaytime: 0,
            averageSessionDuration: 0,
            averageGameDuration: 0,
            peakConcurrentPlayers: 0,
            totalViolations: 0
        };
        
        this.behaviorPatterns = new Map(); // playerId -> behavior metrics
        this.anomalies = [];
        this.reportInterval = null;
    }
    
    /**
     * Start analytics tracking
     */
    start() {
        this.reportInterval = setInterval(() => {
            this.generateReport();
        }, this.options.reportInterval);
    }
    
    /**
     * Stop analytics tracking
     */
    stop() {
        if (this.reportInterval) {
            clearInterval(this.reportInterval);
            this.reportInterval = null;
        }
    }
    
    /**
     * Track player session start
     */
    startSession(playerId, playerData = {}) {
        const session = {
            playerId,
            startTime: Date.now(),
            endTime: null,
            duration: 0,
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            totalMoves: 0,
            averageMovesPerGame: 0,
            disconnections: 0,
            reconnections: 0,
            violations: [],
            metadata: playerData
        };
        
        this.playerSessions.set(playerId, session);
        this.globalStats.totalSessions++;
        
        // Initialize behavior pattern tracking
        if (!this.behaviorPatterns.has(playerId)) {
            this.behaviorPatterns.set(playerId, {
                playerId,
                totalGames: 0,
                winRate: 0,
                averageGameDuration: 0,
                movementPatterns: {
                    averageSpeed: 0,
                    directionChanges: 0,
                    averageReactionTime: 0
                },
                suspiciousActivities: 0,
                lastSeen: Date.now()
            });
        }
        
        this.emit('sessionStart', { playerId, session });
    }
    
    /**
     * Track player session end
     */
    endSession(playerId) {
        const session = this.playerSessions.get(playerId);
        if (!session) return;
        
        session.endTime = Date.now();
        session.duration = session.endTime - session.startTime;
        
        if (session.gamesPlayed > 0) {
            session.averageMovesPerGame = session.totalMoves / session.gamesPlayed;
        }
        
        // Update global stats
        this.globalStats.totalPlaytime += session.duration;
        this.updateAverageSessionDuration();
        
        // Store in history
        this.playerHistory.push({ ...session });
        if (this.playerHistory.length > this.options.maxPlayerHistory) {
            this.playerHistory.shift();
        }
        
        // Update behavior patterns
        const pattern = this.behaviorPatterns.get(playerId);
        if (pattern) {
            pattern.lastSeen = Date.now();
        }
        
        this.playerSessions.delete(playerId);
        this.emit('sessionEnd', { playerId, session });
    }
    
    /**
     * Track game start for player
     */
    trackGameStart(playerId, gameData = {}) {
        const session = this.playerSessions.get(playerId);
        if (session) {
            session.gamesPlayed++;
        }
        
        const pattern = this.behaviorPatterns.get(playerId);
        if (pattern) {
            pattern.totalGames++;
        }
        
        this.globalStats.totalGames++;
        
        this.emit('gameStart', { playerId, gameData });
    }
    
    /**
     * Track game end for player
     */
    trackGameEnd(playerId, result = {}) {
        const session = this.playerSessions.get(playerId);
        if (session) {
            if (result.won) {
                session.wins++;
            } else {
                session.losses++;
            }
            
            if (result.moves) {
                session.totalMoves += result.moves;
            }
        }
        
        const pattern = this.behaviorPatterns.get(playerId);
        if (pattern && session) {
            pattern.winRate = session.wins / session.gamesPlayed;
            
            if (result.duration) {
                const currentAvg = pattern.averageGameDuration;
                const totalGames = pattern.totalGames;
                pattern.averageGameDuration = 
                    (currentAvg * (totalGames - 1) + result.duration) / totalGames;
            }
        }
        
        if (result.duration) {
            this.updateAverageGameDuration(result.duration);
        }
        
        this.emit('gameEnd', { playerId, result });
    }
    
    /**
     * Track player movement
     */
    trackMovement(playerId, movementData = {}) {
        const pattern = this.behaviorPatterns.get(playerId);
        if (!pattern) return;
        
        const { speed, directionChange, reactionTime } = movementData;
        
        if (speed !== undefined) {
            const currentAvg = pattern.movementPatterns.averageSpeed;
            const count = pattern.totalGames || 1;
            pattern.movementPatterns.averageSpeed = 
                (currentAvg * count + speed) / (count + 1);
        }
        
        if (directionChange) {
            pattern.movementPatterns.directionChanges++;
        }
        
        if (reactionTime !== undefined) {
            const currentAvg = pattern.movementPatterns.averageReactionTime;
            const count = pattern.totalGames || 1;
            pattern.movementPatterns.averageReactionTime = 
                (currentAvg * count + reactionTime) / (count + 1);
        }
        
        // Check for anomalies
        this.checkMovementAnomaly(playerId, movementData);
    }
    
    /**
     * Track violation
     */
    trackViolation(playerId, violation = {}) {
        const session = this.playerSessions.get(playerId);
        if (session) {
            session.violations.push({
                type: violation.type,
                severity: violation.severity,
                timestamp: Date.now(),
                details: violation.details
            });
        }
        
        const pattern = this.behaviorPatterns.get(playerId);
        if (pattern) {
            pattern.suspiciousActivities++;
        }
        
        this.globalStats.totalViolations++;
        
        // Record anomaly
        this.anomalies.push({
            playerId,
            type: 'violation',
            violation,
            timestamp: Date.now()
        });
        
        this.emit('violation', { playerId, violation });
    }
    
    /**
     * Track disconnection
     */
    trackDisconnection(playerId, reason = '') {
        const session = this.playerSessions.get(playerId);
        if (session) {
            session.disconnections++;
        }
        
        this.emit('disconnection', { playerId, reason, timestamp: Date.now() });
    }
    
    /**
     * Track reconnection
     */
    trackReconnection(playerId) {
        const session = this.playerSessions.get(playerId);
        if (session) {
            session.reconnections++;
        }
        
        this.emit('reconnection', { playerId, timestamp: Date.now() });
    }
    
    /**
     * Check for movement anomalies
     */
    checkMovementAnomaly(playerId, movementData) {
        const pattern = this.behaviorPatterns.get(playerId);
        if (!pattern || pattern.totalGames < 10) return; // Need baseline data
        
        const { speed, reactionTime } = movementData;
        
        // Check speed anomaly
        if (speed !== undefined) {
            const avgSpeed = pattern.movementPatterns.averageSpeed;
            const deviation = Math.abs(speed - avgSpeed);
            const threshold = avgSpeed * 0.5; // 50% deviation
            
            if (deviation > threshold && avgSpeed > 0) {
                this.recordAnomaly(playerId, 'speed', {
                    current: speed,
                    average: avgSpeed,
                    deviation
                });
            }
        }
        
        // Check reaction time anomaly
        if (reactionTime !== undefined && reactionTime < 50) {
            // Suspiciously fast reaction (< 50ms)
            this.recordAnomaly(playerId, 'reaction_time', {
                reactionTime,
                threshold: 50
            });
        }
    }
    
    /**
     * Record anomaly
     */
    recordAnomaly(playerId, type, data) {
        const anomaly = {
            playerId,
            type,
            data,
            timestamp: Date.now()
        };
        
        this.anomalies.push(anomaly);
        
        // Limit anomaly history
        if (this.anomalies.length > 1000) {
            this.anomalies.shift();
        }
        
        this.emit('anomaly', anomaly);
    }
    
    /**
     * Update average session duration
     */
    updateAverageSessionDuration() {
        if (this.globalStats.totalSessions === 0) return;
        
        this.globalStats.averageSessionDuration = 
            this.globalStats.totalPlaytime / this.globalStats.totalSessions;
    }
    
    /**
     * Update average game duration
     */
    updateAverageGameDuration(duration) {
        const currentAvg = this.globalStats.averageGameDuration;
        const totalGames = this.globalStats.totalGames;
        
        this.globalStats.averageGameDuration = 
            (currentAvg * (totalGames - 1) + duration) / totalGames;
    }
    
    /**
     * Update peak concurrent players
     */
    updatePeakPlayers(currentCount) {
        if (currentCount > this.globalStats.peakConcurrentPlayers) {
            this.globalStats.peakConcurrentPlayers = currentCount;
        }
    }
    
    /**
     * Get player session data
     */
    getPlayerSession(playerId) {
        return this.playerSessions.get(playerId);
    }
    
    /**
     * Get player behavior pattern
     */
    getPlayerPattern(playerId) {
        return this.behaviorPatterns.get(playerId);
    }
    
    /**
     * Get global statistics
     */
    getGlobalStats() {
        return {
            ...this.globalStats,
            activeSessions: this.playerSessions.size,
            trackedPlayers: this.behaviorPatterns.size
        };
    }
    
    /**
     * Get recent anomalies
     */
    getAnomalies(limit = 100, type = null) {
        let anomalies = this.anomalies;
        
        if (type) {
            anomalies = anomalies.filter(a => a.type === type);
        }
        
        return anomalies.slice(-limit);
    }
    
    /**
     * Get player history
     */
    getPlayerHistory(playerId = null, limit = 100) {
        let history = this.playerHistory;
        
        if (playerId) {
            history = history.filter(h => h.playerId === playerId);
        }
        
        return history.slice(-limit);
    }
    
    /**
     * Generate analytics report
     */
    generateReport() {
        const report = {
            timestamp: Date.now(),
            global: this.getGlobalStats(),
            activeSessions: Array.from(this.playerSessions.values()),
            recentAnomalies: this.getAnomalies(50),
            topPlayers: this.getTopPlayers(10),
            suspiciousPlayers: this.getSuspiciousPlayers(10)
        };
        
        this.emit('report', report);
        return report;
    }
    
    /**
     * Get top players by win rate
     */
    getTopPlayers(limit = 10) {
        const players = Array.from(this.behaviorPatterns.values())
            .filter(p => p.totalGames >= 5) // Minimum games played
            .sort((a, b) => b.winRate - a.winRate)
            .slice(0, limit);
        
        return players.map(p => ({
            playerId: p.playerId,
            totalGames: p.totalGames,
            winRate: p.winRate,
            averageGameDuration: p.averageGameDuration
        }));
    }
    
    /**
     * Get suspicious players
     */
    getSuspiciousPlayers(limit = 10) {
        const players = Array.from(this.behaviorPatterns.values())
            .filter(p => p.suspiciousActivities > 0)
            .sort((a, b) => b.suspiciousActivities - a.suspiciousActivities)
            .slice(0, limit);
        
        return players.map(p => ({
            playerId: p.playerId,
            suspiciousActivities: p.suspiciousActivities,
            totalGames: p.totalGames,
            winRate: p.winRate
        }));
    }
    
    /**
     * Get player statistics
     */
    getPlayerStats(playerId) {
        const session = this.playerSessions.get(playerId);
        const pattern = this.behaviorPatterns.get(playerId);
        const history = this.getPlayerHistory(playerId);
        const anomalies = this.anomalies.filter(a => a.playerId === playerId);
        
        return {
            currentSession: session || null,
            behaviorPattern: pattern || null,
            sessionHistory: history,
            anomalies: anomalies,
            stats: {
                totalSessions: history.length,
                totalGames: pattern?.totalGames || 0,
                winRate: pattern?.winRate || 0,
                suspiciousActivities: pattern?.suspiciousActivities || 0
            }
        };
    }
    
    /**
     * Clear old data
     */
    clearOldData(olderThan = 86400000) { // 24 hours default
        const cutoff = Date.now() - olderThan;
        
        // Clear old player history
        this.playerHistory = this.playerHistory.filter(
            h => h.endTime && h.endTime > cutoff
        );
        
        // Clear old anomalies
        this.anomalies = this.anomalies.filter(
            a => a.timestamp > cutoff
        );
        
        // Clear inactive behavior patterns
        for (const [playerId, pattern] of this.behaviorPatterns.entries()) {
            if (pattern.lastSeen < cutoff) {
                this.behaviorPatterns.delete(playerId);
            }
        }
    }
}

module.exports = { PlayerAnalytics };
