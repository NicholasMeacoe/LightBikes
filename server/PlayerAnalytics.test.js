const { PlayerAnalytics } = require('./PlayerAnalytics');

describe('PlayerAnalytics', () => {
    let analytics;
    
    beforeEach(() => {
        analytics = new PlayerAnalytics({
            reportInterval: 100
        });
    });
    
    afterEach(() => {
        if (analytics) {
            analytics.stop();
        }
    });
    
    describe('initialization', () => {
        it('should initialize with default options', () => {
            const defaultAnalytics = new PlayerAnalytics();
            expect(defaultAnalytics.options.sessionTimeout).toBe(300000);
            expect(defaultAnalytics.options.anomalyThreshold).toBe(3);
        });
        
        it('should initialize with custom options', () => {
            const customAnalytics = new PlayerAnalytics({
                sessionTimeout: 600000,
                anomalyThreshold: 5
            });
            
            expect(customAnalytics.options.sessionTimeout).toBe(600000);
            expect(customAnalytics.options.anomalyThreshold).toBe(5);
        });
        
        it('should initialize empty data structures', () => {
            expect(analytics.playerSessions.size).toBe(0);
            expect(analytics.playerHistory.length).toBe(0);
            expect(analytics.globalStats.totalSessions).toBe(0);
        });
    });
    
    describe('session tracking', () => {
        it('should start player session', () => {
            const events = [];
            analytics.on('sessionStart', (data) => events.push(data));
            
            analytics.startSession('player1', { name: 'Test Player' });
            
            expect(analytics.playerSessions.has('player1')).toBe(true);
            expect(analytics.globalStats.totalSessions).toBe(1);
            expect(events.length).toBe(1);
            
            const session = analytics.playerSessions.get('player1');
            expect(session.playerId).toBe('player1');
            expect(session.startTime).toBeDefined();
            expect(session.metadata.name).toBe('Test Player');
        });
        
        it('should end player session', () => {
            const events = [];
            analytics.on('sessionEnd', (data) => events.push(data));
            
            analytics.startSession('player1');
            analytics.endSession('player1');
            
            expect(analytics.playerSessions.has('player1')).toBe(false);
            expect(analytics.playerHistory.length).toBe(1);
            expect(events.length).toBe(1);
            
            const history = analytics.playerHistory[0];
            expect(history.duration).toBeGreaterThanOrEqual(0);
            expect(history.endTime).toBeDefined();
        });
        
        it('should handle ending non-existent session', () => {
            analytics.endSession('nonexistent');
            expect(analytics.playerHistory.length).toBe(0);
        });
        
        it('should initialize behavior pattern on session start', () => {
            analytics.startSession('player1');
            
            expect(analytics.behaviorPatterns.has('player1')).toBe(true);
            const pattern = analytics.behaviorPatterns.get('player1');
            expect(pattern.playerId).toBe('player1');
            expect(pattern.totalGames).toBe(0);
        });
        
        it('should limit player history size', () => {
            const smallAnalytics = new PlayerAnalytics({
                maxPlayerHistory: 5
            });
            
            for (let i = 0; i < 10; i++) {
                smallAnalytics.startSession(`player${i}`);
                smallAnalytics.endSession(`player${i}`);
            }
            
            expect(smallAnalytics.playerHistory.length).toBe(5);
        });
    });
    
    describe('game tracking', () => {
        beforeEach(() => {
            analytics.startSession('player1');
        });
        
        it('should track game start', () => {
            const events = [];
            analytics.on('gameStart', (data) => events.push(data));
            
            analytics.trackGameStart('player1', { mode: 'classic' });
            
            const session = analytics.playerSessions.get('player1');
            expect(session.gamesPlayed).toBe(1);
            expect(analytics.globalStats.totalGames).toBe(1);
            expect(events.length).toBe(1);
            
            const pattern = analytics.behaviorPatterns.get('player1');
            expect(pattern.totalGames).toBe(1);
        });
        
        it('should track game end with win', () => {
            const events = [];
            analytics.on('gameEnd', (data) => events.push(data));
            
            analytics.trackGameStart('player1');
            analytics.trackGameEnd('player1', { won: true, moves: 100, duration: 30000 });
            
            const session = analytics.playerSessions.get('player1');
            expect(session.wins).toBe(1);
            expect(session.losses).toBe(0);
            expect(session.totalMoves).toBe(100);
            expect(events.length).toBe(1);
        });
        
        it('should track game end with loss', () => {
            analytics.trackGameStart('player1');
            analytics.trackGameEnd('player1', { won: false, moves: 50 });
            
            const session = analytics.playerSessions.get('player1');
            expect(session.wins).toBe(0);
            expect(session.losses).toBe(1);
        });
        
        it('should calculate average moves per game', () => {
            analytics.trackGameStart('player1');
            analytics.trackGameEnd('player1', { won: true, moves: 100 });
            
            analytics.trackGameStart('player1');
            analytics.trackGameEnd('player1', { won: false, moves: 50 });
            
            analytics.endSession('player1');
            
            const history = analytics.playerHistory[0];
            expect(history.averageMovesPerGame).toBe(75);
        });
        
        it('should update win rate in behavior pattern', () => {
            analytics.trackGameStart('player1');
            analytics.trackGameEnd('player1', { won: true });
            
            analytics.trackGameStart('player1');
            analytics.trackGameEnd('player1', { won: false });
            
            const pattern = analytics.behaviorPatterns.get('player1');
            expect(pattern.winRate).toBe(0.5);
        });
        
        it('should update average game duration', () => {
            analytics.trackGameStart('player1');
            analytics.trackGameEnd('player1', { won: true, duration: 30000 });
            
            analytics.trackGameStart('player1');
            analytics.trackGameEnd('player1', { won: false, duration: 20000 });
            
            const pattern = analytics.behaviorPatterns.get('player1');
            expect(pattern.averageGameDuration).toBe(25000);
        });
    });
    
    describe('movement tracking', () => {
        beforeEach(() => {
            analytics.startSession('player1');
        });
        
        it('should track movement data', () => {
            analytics.trackMovement('player1', {
                speed: 5.0,
                directionChange: true,
                reactionTime: 150
            });
            
            const pattern = analytics.behaviorPatterns.get('player1');
            expect(pattern.movementPatterns.averageSpeed).toBeGreaterThan(0);
            expect(pattern.movementPatterns.directionChanges).toBe(1);
            expect(pattern.movementPatterns.averageReactionTime).toBeGreaterThan(0);
        });
        
        it('should handle movement tracking for non-existent player', () => {
            analytics.trackMovement('nonexistent', { speed: 5.0 });
            // Should not throw error
        });
        
        it('should detect speed anomaly', () => {
            const events = [];
            analytics.on('anomaly', (data) => events.push(data));
            
            // Build baseline
            const pattern = analytics.behaviorPatterns.get('player1');
            pattern.totalGames = 10;
            pattern.movementPatterns.averageSpeed = 5.0;
            
            // Track anomalous speed
            analytics.trackMovement('player1', { speed: 15.0 });
            
            expect(events.length).toBeGreaterThan(0);
            expect(events[0].type).toBe('speed');
        });
        
        it('should detect reaction time anomaly', () => {
            const events = [];
            analytics.on('anomaly', (data) => events.push(data));
            
            const pattern = analytics.behaviorPatterns.get('player1');
            pattern.totalGames = 10;
            
            analytics.trackMovement('player1', { reactionTime: 30 });
            
            expect(events.length).toBeGreaterThan(0);
            expect(events[0].type).toBe('reaction_time');
        });
    });
    
    describe('violation tracking', () => {
        beforeEach(() => {
            analytics.startSession('player1');
        });
        
        it('should track violations', () => {
            const events = [];
            analytics.on('violation', (data) => events.push(data));
            
            analytics.trackViolation('player1', {
                type: 'speed_hack',
                severity: 'high',
                details: 'Impossible movement detected'
            });
            
            const session = analytics.playerSessions.get('player1');
            expect(session.violations.length).toBe(1);
            expect(session.violations[0].type).toBe('speed_hack');
            
            const pattern = analytics.behaviorPatterns.get('player1');
            expect(pattern.suspiciousActivities).toBe(1);
            
            expect(analytics.globalStats.totalViolations).toBe(1);
            expect(events.length).toBe(1);
        });
        
        it('should record violation as anomaly', () => {
            analytics.trackViolation('player1', {
                type: 'collision_bypass',
                severity: 'medium'
            });
            
            expect(analytics.anomalies.length).toBe(1);
            expect(analytics.anomalies[0].type).toBe('violation');
        });
    });
    
    describe('connection tracking', () => {
        beforeEach(() => {
            analytics.startSession('player1');
        });
        
        it('should track disconnections', () => {
            const events = [];
            analytics.on('disconnection', (data) => events.push(data));
            
            analytics.trackDisconnection('player1', 'timeout');
            
            const session = analytics.playerSessions.get('player1');
            expect(session.disconnections).toBe(1);
            expect(events.length).toBe(1);
            expect(events[0].reason).toBe('timeout');
        });
        
        it('should track reconnections', () => {
            const events = [];
            analytics.on('reconnection', (data) => events.push(data));
            
            analytics.trackReconnection('player1');
            
            const session = analytics.playerSessions.get('player1');
            expect(session.reconnections).toBe(1);
            expect(events.length).toBe(1);
        });
    });
    
    describe('global statistics', () => {
        it('should update peak concurrent players', () => {
            analytics.updatePeakPlayers(5);
            expect(analytics.globalStats.peakConcurrentPlayers).toBe(5);
            
            analytics.updatePeakPlayers(3);
            expect(analytics.globalStats.peakConcurrentPlayers).toBe(5);
            
            analytics.updatePeakPlayers(10);
            expect(analytics.globalStats.peakConcurrentPlayers).toBe(10);
        });
        
        it('should calculate average session duration', (done) => {
            analytics.startSession('player1');
            setTimeout(() => {
                analytics.endSession('player1');
                expect(analytics.globalStats.averageSessionDuration).toBeGreaterThanOrEqual(0);
                done();
            }, 10);
        });
        
        it('should get global stats', () => {
            analytics.startSession('player1');
            analytics.trackGameStart('player1');
            
            const stats = analytics.getGlobalStats();
            
            expect(stats.totalSessions).toBe(1);
            expect(stats.totalGames).toBe(1);
            expect(stats.activeSessions).toBe(1);
            expect(stats.trackedPlayers).toBe(1);
        });
    });
    
    describe('data retrieval', () => {
        beforeEach(() => {
            analytics.startSession('player1');
            analytics.trackGameStart('player1');
        });
        
        it('should get player session', () => {
            const session = analytics.getPlayerSession('player1');
            expect(session).toBeDefined();
            expect(session.playerId).toBe('player1');
        });
        
        it('should get player behavior pattern', () => {
            const pattern = analytics.getPlayerPattern('player1');
            expect(pattern).toBeDefined();
            expect(pattern.playerId).toBe('player1');
        });
        
        it('should get anomalies', () => {
            analytics.recordAnomaly('player1', 'test', { value: 123 });
            
            const anomalies = analytics.getAnomalies();
            expect(anomalies.length).toBe(1);
            expect(anomalies[0].type).toBe('test');
        });
        
        it('should filter anomalies by type', () => {
            analytics.recordAnomaly('player1', 'speed', {});
            analytics.recordAnomaly('player1', 'reaction_time', {});
            
            const speedAnomalies = analytics.getAnomalies(100, 'speed');
            expect(speedAnomalies.length).toBe(1);
            expect(speedAnomalies[0].type).toBe('speed');
        });
        
        it('should get player history', () => {
            analytics.endSession('player1');
            
            const history = analytics.getPlayerHistory('player1');
            expect(history.length).toBe(1);
            expect(history[0].playerId).toBe('player1');
        });
        
        it('should get all player history', () => {
            analytics.startSession('player2');
            analytics.endSession('player1');
            analytics.endSession('player2');
            
            const history = analytics.getPlayerHistory();
            expect(history.length).toBe(2);
        });
        
        it('should get player statistics', () => {
            analytics.trackViolation('player1', { type: 'test' });
            
            const stats = analytics.getPlayerStats('player1');
            
            expect(stats.currentSession).toBeDefined();
            expect(stats.behaviorPattern).toBeDefined();
            expect(stats.stats.totalGames).toBe(1);
        });
    });
    
    describe('reporting', () => {
        it('should generate analytics report', () => {
            const events = [];
            analytics.on('report', (data) => events.push(data));
            
            analytics.startSession('player1');
            analytics.trackGameStart('player1');
            
            const report = analytics.generateReport();
            
            expect(report.timestamp).toBeDefined();
            expect(report.global).toBeDefined();
            expect(report.activeSessions).toBeDefined();
            expect(report.recentAnomalies).toBeDefined();
            expect(events.length).toBe(1);
        });
        
        it('should get top players', () => {
            // Create multiple players with different win rates
            for (let i = 1; i <= 5; i++) {
                analytics.startSession(`player${i}`);
                
                for (let j = 0; j < 10; j++) {
                    analytics.trackGameStart(`player${i}`);
                    analytics.trackGameEnd(`player${i}`, { won: j < i * 2 });
                }
            }
            
            const topPlayers = analytics.getTopPlayers(3);
            
            expect(topPlayers.length).toBeLessThanOrEqual(3);
            expect(topPlayers[0].winRate).toBeGreaterThanOrEqual(topPlayers[1]?.winRate || 0);
        });
        
        it('should get suspicious players', () => {
            analytics.startSession('player1');
            analytics.trackViolation('player1', { type: 'test' });
            analytics.trackViolation('player1', { type: 'test' });
            
            analytics.startSession('player2');
            analytics.trackViolation('player2', { type: 'test' });
            
            const suspicious = analytics.getSuspiciousPlayers(10);
            
            expect(suspicious.length).toBe(2);
            expect(suspicious[0].suspiciousActivities).toBe(2);
            expect(suspicious[1].suspiciousActivities).toBe(1);
        });
        
        it('should start and stop automatic reporting', (done) => {
            const events = [];
            analytics.on('report', (data) => events.push(data));
            
            analytics.start();
            
            setTimeout(() => {
                analytics.stop();
                expect(events.length).toBeGreaterThan(0);
                done();
            }, 150);
        });
    });
    
    describe('data cleanup', () => {
        it('should clear old player history', () => {
            analytics.startSession('player1');
            analytics.endSession('player1');
            
            // Manually set old timestamp
            analytics.playerHistory[0].endTime = Date.now() - 100000000;
            
            analytics.clearOldData(86400000);
            
            expect(analytics.playerHistory.length).toBe(0);
        });
        
        it('should clear old anomalies', () => {
            analytics.recordAnomaly('player1', 'test', {});
            
            // Manually set old timestamp
            analytics.anomalies[0].timestamp = Date.now() - 100000000;
            
            analytics.clearOldData(86400000);
            
            expect(analytics.anomalies.length).toBe(0);
        });
        
        it('should clear inactive behavior patterns', () => {
            analytics.startSession('player1');
            
            const pattern = analytics.behaviorPatterns.get('player1');
            pattern.lastSeen = Date.now() - 100000000;
            
            analytics.clearOldData(86400000);
            
            expect(analytics.behaviorPatterns.has('player1')).toBe(false);
        });
        
        it('should limit anomaly history size', () => {
            for (let i = 0; i < 1500; i++) {
                analytics.recordAnomaly('player1', 'test', {});
            }
            
            expect(analytics.anomalies.length).toBeLessThanOrEqual(1000);
        });
    });
});
