const { GameRoom } = require('./GameRoom');
const { AntiCheatValidator } = require('./AntiCheatValidator');

describe('Anti-Cheat Integration', () => {
    let gameRoom;
    let mockIo;
    let mockSocket1;
    let mockSocket2;

    beforeEach(() => {
        // Create mock Socket.IO
        mockIo = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn()
        };

        // Create mock sockets
        mockSocket1 = {
            id: 'player1',
            join: jest.fn(),
            leave: jest.fn(),
            emit: jest.fn(),
            on: jest.fn()
        };

        mockSocket2 = {
            id: 'player2',
            join: jest.fn(),
            leave: jest.fn(),
            emit: jest.fn(),
            on: jest.fn()
        };

        // Create game room
        gameRoom = new GameRoom('test-room', {
            maxPlayers: 4,
            gameMode: 'classic'
        }, mockIo);

        // Add players
        gameRoom.addPlayer(mockSocket1, { name: 'Player 1', isHost: true });
        gameRoom.addPlayer(mockSocket2, { name: 'Player 2' });

        // Start game
        gameRoom.initializeGameState();
        gameRoom.status = 'playing';
    });

    afterEach(() => {
        if (gameRoom.gameLoopInterval) {
            gameRoom.stopGameLoop();
        }
    });

    describe('Movement Validation', () => {
        it('should detect and handle teleportation', () => {
            const playerId = 'player1';
            const playerState = gameRoom.gameState.players[playerId];
            
            // Track original position first
            const originalPos = { ...playerState.position };
            gameRoom.antiCheat.trackPosition(playerId, originalPos, Date.now());
            
            // Try to teleport
            const newPos = { x: 100, y: 0, z: 100 };
            
            const validation = gameRoom.antiCheat.validatePosition(
                playerId,
                newPos,
                Date.now()
            );
            
            expect(validation.valid).toBe(false);
            expect(validation.violation).toBe('teleportation');
        });

        it('should detect invalid direction changes', () => {
            const playerId = 'player1';
            const playerState = gameRoom.gameState.players[playerId];
            
            // Set current direction
            playerState.direction = { x: 1, y: 0, z: 0 };
            
            // Try to reverse direction (180-degree turn)
            const validation = gameRoom.antiCheat.validateDirection(
                playerId,
                { x: -1, y: 0, z: 0 },
                Date.now()
            );
            
            expect(validation.valid).toBe(false);
            expect(validation.violation).toBe('illegal_reversal');
        });

        it('should detect speed hacking', () => {
            const playerId = 'player1';
            
            // Simulate excessive speed
            const validation = gameRoom.antiCheat.validateSpeed(
                playerId,
                10.0, // Large distance
                1000  // 1 second
            );
            
            expect(validation.valid).toBe(false);
            expect(validation.violation).toBe('speed_hack');
        });
    });

    describe('Pattern Detection', () => {
        it('should detect consistent overspeeding pattern', () => {
            const playerId = 'player1';
            
            // Add many high-speed samples
            for (let i = 0; i < 30; i++) {
                gameRoom.antiCheat.trackSpeed(playerId, 0.14);
            }
            
            const detection = gameRoom.antiCheat.detectSpeedHacking(playerId);
            
            expect(detection.detected).toBe(true);
            expect(detection.pattern).toBe('consistent_overspeed');
        });

        it('should detect teleportation pattern', () => {
            const playerId = 'player1';
            
            // Add positions with jumps
            gameRoom.antiCheat.trackPosition(playerId, { x: 0, y: 0, z: 0 }, Date.now());
            gameRoom.antiCheat.trackPosition(playerId, { x: 0.1, y: 0, z: 0 }, Date.now());
            gameRoom.antiCheat.trackPosition(playerId, { x: 5, y: 0, z: 5 }, Date.now());
            gameRoom.antiCheat.trackPosition(playerId, { x: 5.1, y: 0, z: 5 }, Date.now());
            gameRoom.antiCheat.trackPosition(playerId, { x: 10, y: 0, z: 10 }, Date.now());
            
            const detection = gameRoom.antiCheat.detectTeleportation(playerId);
            
            expect(detection.detected).toBe(true);
        });

        it('should detect collision bypass', () => {
            const playerId = 'player1';
            const playerState = gameRoom.gameState.players[playerId];
            
            // Position player inside another player's trail
            const player2State = gameRoom.gameState.players['player2'];
            const trailSegment = player2State.trail[0];
            
            const detection = gameRoom.antiCheat.detectCollisionBypass(
                playerId,
                trailSegment,
                gameRoom.gameState.players
            );
            
            expect(detection.detected).toBe(true);
            expect(detection.pattern).toBe('collision_bypass');
        });
    });

    describe('Violation Response System', () => {
        it('should issue warning for first violation', () => {
            const playerId = 'player1';
            const violation = {
                violation: 'speed_hack',
                details: { speed: 1.0 }
            };
            
            const response = gameRoom.antiCheat.flagSuspiciousActivity(playerId, violation);
            
            expect(response.action).toBe('warning');
            expect(response.violationCount).toBe(1);
        });

        it('should disconnect after multiple violations', () => {
            const playerId = 'player1';
            
            // Add violations up to threshold
            for (let i = 0; i < gameRoom.antiCheat.warningThreshold; i++) {
                gameRoom.antiCheat.flagSuspiciousActivity(playerId, {
                    violation: 'speed_hack',
                    details: {}
                });
            }
            
            const response = gameRoom.antiCheat.flagSuspiciousActivity(playerId, {
                violation: 'speed_hack',
                details: {}
            });
            
            expect(response.action).toBe('disconnect');
        });

        it('should recommend ban after many violations', () => {
            const playerId = 'player1';
            
            // Add many violations
            for (let i = 0; i < gameRoom.antiCheat.banThreshold; i++) {
                gameRoom.antiCheat.flagSuspiciousActivity(playerId, {
                    violation: 'speed_hack',
                    details: {}
                });
            }
            
            const response = gameRoom.antiCheat.flagSuspiciousActivity(playerId, {
                violation: 'speed_hack',
                details: {}
            });
            
            expect(response.action).toBe('ban');
        });
    });

    describe('GameRoom Integration', () => {
        it('should validate player input in game loop', () => {
            const playerId = 'player1';
            const playerState = gameRoom.gameState.players[playerId];
            
            // Set up invalid direction change
            playerState.direction = { x: 1, y: 0, z: 0 };
            
            // Add invalid input to queue
            gameRoom.inputQueue.set(playerId, [{
                direction: { x: -1, y: 0, z: 0 }, // 180-degree turn
                timestamp: Date.now(),
                sequenceId: 1
            }]);
            
            // Spy on handleCheatDetection
            const handleCheatSpy = jest.spyOn(gameRoom, 'handleCheatDetection');
            
            // Update game state
            gameRoom.updateGameState();
            
            // Should have detected the cheat
            expect(handleCheatSpy).toHaveBeenCalled();
        });

        it('should run pattern detection periodically', () => {
            const playerId = 'player1';
            
            // Add suspicious speed pattern
            for (let i = 0; i < 30; i++) {
                gameRoom.antiCheat.trackSpeed(playerId, 0.14);
            }
            
            // Spy on pattern detection
            const patternSpy = jest.spyOn(gameRoom, 'runPatternDetection');
            
            // Run 60 frames to trigger pattern detection
            gameRoom.frameNumber = 59;
            gameRoom.updateGameState();
            
            expect(patternSpy).toHaveBeenCalledWith(playerId);
        });

        it('should disconnect cheater when threshold reached', () => {
            const playerId = 'player1';
            
            // Add violations to reach disconnect threshold
            for (let i = 0; i < gameRoom.antiCheat.warningThreshold; i++) {
                gameRoom.antiCheat.flagSuspiciousActivity(playerId, {
                    violation: 'test',
                    details: {}
                });
            }
            
            // Trigger one more violation
            const violation = {
                violation: 'speed_hack',
                details: {}
            };
            
            gameRoom.handleCheatDetection(playerId, violation);
            
            // Player should be removed
            expect(gameRoom.players.has(playerId)).toBe(false);
        });

        it('should send warning to player for minor violations', () => {
            const playerId = 'player1';
            const violation = {
                violation: 'speed_hack',
                details: {}
            };
            
            gameRoom.handleCheatDetection(playerId, violation);
            
            // Should have sent warning
            expect(mockSocket1.emit).toHaveBeenCalledWith(
                'antiCheatWarning',
                expect.objectContaining({
                    reason: 'speed_hack'
                })
            );
        });

        it('should clear anti-cheat history when player leaves', () => {
            const playerId = 'player1';
            
            // Add some history
            gameRoom.antiCheat.trackPosition(playerId, { x: 0, y: 0, z: 0 }, Date.now());
            gameRoom.antiCheat.trackSpeed(playerId, 0.1);
            
            // Remove player
            gameRoom.removePlayer(playerId);
            
            // History should be cleared
            expect(gameRoom.antiCheat.positionHistory.has(playerId)).toBe(false);
            expect(gameRoom.antiCheat.speedHistory.has(playerId)).toBe(false);
        });
    });

    describe('Collision Bypass Detection', () => {
        it('should detect player surviving boundary collision', () => {
            const playerId = 'player1';
            const playerState = gameRoom.gameState.players[playerId];
            
            // Move player outside bounds but keep alive
            playerState.position = { x: 20, y: 0, z: 0 };
            playerState.isAlive = true;
            
            const detection = gameRoom.antiCheat.detectCollisionBypass(
                playerId,
                playerState.position,
                gameRoom.gameState.players
            );
            
            expect(detection.detected).toBe(true);
            expect(detection.pattern).toBe('boundary_bypass');
        });

        it('should detect player surviving trail collision', () => {
            const playerId = 'player1';
            const player2State = gameRoom.gameState.players['player2'];
            
            // Position player1 inside player2's trail
            const detection = gameRoom.antiCheat.detectCollisionBypass(
                playerId,
                player2State.trail[0],
                gameRoom.gameState.players
            );
            
            expect(detection.detected).toBe(true);
            expect(detection.pattern).toBe('collision_bypass');
        });
    });

    describe('Logging and Analytics', () => {
        it('should log violations for review', () => {
            const playerId = 'player1';
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            const violations = [
                { type: 'speed_hack', timestamp: Date.now() }
            ];
            
            gameRoom.antiCheat.logViolationForReview(playerId, 'test', violations);
            
            expect(consoleSpy).toHaveBeenCalledWith(
                '[AntiCheat] Violation log:',
                expect.any(String)
            );
            
            consoleSpy.mockRestore();
        });

        it('should provide player statistics', () => {
            const playerId = 'player1';
            
            // Add some activity
            gameRoom.antiCheat.trackPosition(playerId, { x: 0, y: 0, z: 0 }, Date.now());
            gameRoom.antiCheat.trackSpeed(playerId, 0.1);
            gameRoom.antiCheat.flagSuspiciousActivity(playerId, {
                violation: 'test',
                details: {}
            });
            
            const stats = gameRoom.antiCheat.getPlayerStats(playerId);
            
            expect(stats.totalViolations).toBe(1);
            expect(stats.positionHistorySize).toBe(1);
            expect(stats.speedHistorySize).toBe(1);
        });
    });
});
