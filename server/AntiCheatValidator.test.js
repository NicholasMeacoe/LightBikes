const { AntiCheatValidator } = require('./AntiCheatValidator');

describe('AntiCheatValidator', () => {
    let validator;
    let mockGameRoom;

    beforeEach(() => {
        // Create mock game room
        mockGameRoom = {
            id: 'test-room',
            gameState: {
                players: {
                    'player1': {
                        id: 'player1',
                        position: { x: 0, y: 0, z: 0 },
                        direction: { x: 1, y: 0, z: 0 },
                        trail: [
                            { x: 0, y: 0, z: 0 },
                            { x: 0.1, y: 0, z: 0 },
                            { x: 0.2, y: 0, z: 0 }
                        ],
                        isAlive: true
                    },
                    'player2': {
                        id: 'player2',
                        position: { x: 5, y: 0, z: 5 },
                        direction: { x: 0, y: 0, z: 1 },
                        trail: [
                            { x: 5, y: 0, z: 5 },
                            { x: 5, y: 0, z: 5.1 }
                        ],
                        isAlive: true
                    }
                },
                bounds: {
                    minX: -15,
                    maxX: 15,
                    minZ: -15,
                    maxZ: 15
                }
            },
            players: new Map([
                ['player1', { id: 'player1', name: 'Player 1' }],
                ['player2', { id: 'player2', name: 'Player 2' }]
            ]),
            sendToPlayer: jest.fn(),
            removePlayer: jest.fn()
        };

        validator = new AntiCheatValidator(mockGameRoom);
    });

    describe('validatePosition', () => {
        it('should accept valid position updates', () => {
            const result = validator.validatePosition(
                'player1',
                { x: 0.1, y: 0, z: 0 },
                Date.now()
            );

            expect(result.valid).toBe(true);
        });

        it('should detect teleportation', () => {
            const result = validator.validatePosition(
                'player1',
                { x: 10, y: 0, z: 10 },
                Date.now()
            );

            expect(result.valid).toBe(false);
            expect(result.violation).toBe('teleportation');
            expect(result.details.distance).toBeGreaterThan(validator.maxTeleportDistance);
        });

        it('should track position history', () => {
            validator.validatePosition('player1', { x: 0.1, y: 0, z: 0 }, Date.now());
            validator.validatePosition('player1', { x: 0.2, y: 0, z: 0 }, Date.now());

            const history = validator.positionHistory.get('player1');
            expect(history).toHaveLength(2);
        });

        it('should handle dead players gracefully', () => {
            mockGameRoom.gameState.players['player1'].isAlive = false;

            const result = validator.validatePosition(
                'player1',
                { x: 100, y: 0, z: 100 },
                Date.now()
            );

            expect(result.valid).toBe(true);
        });
    });

    describe('validateDirection', () => {
        it('should accept valid direction changes', () => {
            const result = validator.validateDirection(
                'player1',
                { x: 0, y: 0, z: 1 },
                Date.now()
            );

            expect(result.valid).toBe(true);
        });

        it('should reject invalid directions', () => {
            const result = validator.validateDirection(
                'player1',
                { x: 0.5, y: 0, z: 0.5 },
                Date.now()
            );

            expect(result.valid).toBe(false);
            expect(result.violation).toBe('invalid_direction');
        });

        it('should reject 180-degree turns', () => {
            const result = validator.validateDirection(
                'player1',
                { x: -1, y: 0, z: 0 },
                Date.now()
            );

            expect(result.valid).toBe(false);
            expect(result.violation).toBe('illegal_reversal');
        });

        it('should allow perpendicular turns', () => {
            mockGameRoom.gameState.players['player1'].direction = { x: 1, y: 0, z: 0 };

            const result = validator.validateDirection(
                'player1',
                { x: 0, y: 0, z: 1 },
                Date.now()
            );

            expect(result.valid).toBe(true);
        });
    });

    describe('validateSpeed', () => {
        it('should accept normal speeds', () => {
            const result = validator.validateSpeed('player1', 0.1, 1000);

            expect(result.valid).toBe(true);
        });

        it('should detect speed hacking', () => {
            const result = validator.validateSpeed('player1', 10, 1000);

            expect(result.valid).toBe(false);
            expect(result.violation).toBe('speed_hack');
        });

        it('should track speed history', () => {
            validator.validateSpeed('player1', 0.1, 1000);
            validator.validateSpeed('player1', 0.1, 1000);

            const history = validator.speedHistory.get('player1');
            expect(history).toHaveLength(2);
        });

        it('should handle zero deltaTime', () => {
            const result = validator.validateSpeed('player1', 0.1, 0);

            expect(result.valid).toBe(true);
        });
    });

    describe('detectSpeedHacking', () => {
        it('should not detect with insufficient data', () => {
            const result = validator.detectSpeedHacking('player1');

            expect(result.detected).toBe(false);
        });

        it('should detect consistent overspeeding', () => {
            // Add many high-speed samples
            for (let i = 0; i < 30; i++) {
                validator.trackSpeed('player1', validator.maxSpeed * 0.95);
            }

            const result = validator.detectSpeedHacking('player1');

            expect(result.detected).toBe(true);
            expect(result.pattern).toBe('consistent_overspeed');
        });

        it('should detect frequent speed spikes', () => {
            // Add mix of normal and high speeds
            for (let i = 0; i < 30; i++) {
                const speed = i % 2 === 0 ? validator.maxSpeed * 1.1 : 0.05;
                validator.trackSpeed('player1', speed);
            }

            const result = validator.detectSpeedHacking('player1');

            expect(result.detected).toBe(true);
            expect(result.pattern).toBe('frequent_speed_spikes');
        });

        it('should not detect normal speed patterns', () => {
            // Add normal speed samples
            for (let i = 0; i < 30; i++) {
                validator.trackSpeed('player1', 0.08);
            }

            const result = validator.detectSpeedHacking('player1');

            expect(result.detected).toBe(false);
        });
    });

    describe('detectTeleportation', () => {
        it('should not detect with insufficient data', () => {
            const result = validator.detectTeleportation('player1');

            expect(result.detected).toBe(false);
        });

        it('should detect position jumps', () => {
            // Add positions with large jumps
            validator.trackPosition('player1', { x: 0, y: 0, z: 0 }, Date.now());
            validator.trackPosition('player1', { x: 0.1, y: 0, z: 0 }, Date.now());
            validator.trackPosition('player1', { x: 5, y: 0, z: 5 }, Date.now()); // Teleport
            validator.trackPosition('player1', { x: 5.1, y: 0, z: 5 }, Date.now());
            validator.trackPosition('player1', { x: 10, y: 0, z: 10 }, Date.now()); // Teleport

            const result = validator.detectTeleportation('player1');

            expect(result.detected).toBe(true);
            expect(result.pattern).toBe('position_jumps');
            expect(result.details.teleportCount).toBeGreaterThan(0);
        });

        it('should not detect normal movement', () => {
            // Add normal position progression
            for (let i = 0; i < 10; i++) {
                validator.trackPosition('player1', { x: i * 0.1, y: 0, z: 0 }, Date.now());
            }

            const result = validator.detectTeleportation('player1');

            expect(result.detected).toBe(false);
        });
    });

    describe('detectCollisionBypass', () => {
        it('should detect player inside trail segment', () => {
            const result = validator.detectCollisionBypass(
                'player1',
                { x: 5, y: 0, z: 5 }, // Same as player2's trail
                mockGameRoom.gameState.players
            );

            expect(result.detected).toBe(true);
            expect(result.pattern).toBe('collision_bypass');
        });

        it('should detect boundary bypass', () => {
            const result = validator.detectCollisionBypass(
                'player1',
                { x: 20, y: 0, z: 0 }, // Outside bounds
                mockGameRoom.gameState.players
            );

            expect(result.detected).toBe(true);
            expect(result.pattern).toBe('boundary_bypass');
        });

        it('should respect grace period for own trail', () => {
            // Position near own trail but within grace period
            const result = validator.detectCollisionBypass(
                'player1',
                { x: 0.1, y: 0, z: 0 },
                mockGameRoom.gameState.players
            );

            expect(result.detected).toBe(false);
        });

        it('should not detect valid positions', () => {
            const result = validator.detectCollisionBypass(
                'player1',
                { x: 1, y: 0, z: 1 },
                mockGameRoom.gameState.players
            );

            expect(result.detected).toBe(false);
        });
    });

    describe('flagSuspiciousActivity', () => {
        it('should log violations', () => {
            const violation = {
                violation: 'speed_hack',
                details: { speed: 1.0 }
            };

            validator.flagSuspiciousActivity('player1', violation);

            const history = validator.violationHistory.get('player1');
            expect(history).toHaveLength(1);
            expect(history[0].type).toBe('speed_hack');
        });

        it('should return warning for first violations', () => {
            const violation = { violation: 'speed_hack', details: {} };

            const result = validator.flagSuspiciousActivity('player1', violation);

            expect(result.action).toBe('warning');
        });

        it('should return disconnect after threshold violations', () => {
            // Add violations up to threshold
            for (let i = 0; i < validator.warningThreshold; i++) {
                validator.flagSuspiciousActivity('player1', {
                    violation: 'speed_hack',
                    details: {}
                });
            }

            const result = validator.flagSuspiciousActivity('player1', {
                violation: 'speed_hack',
                details: {}
            });

            expect(result.action).toBe('disconnect');
        });

        it('should return ban after many violations', () => {
            // Add many violations
            for (let i = 0; i < validator.banThreshold; i++) {
                validator.flagSuspiciousActivity('player1', {
                    violation: 'speed_hack',
                    details: {}
                });
            }

            const result = validator.flagSuspiciousActivity('player1', {
                violation: 'speed_hack',
                details: {}
            });

            expect(result.action).toBe('ban');
        });

        it('should limit violation history size', () => {
            // Add more than max violations
            for (let i = 0; i < validator.maxViolationHistory + 10; i++) {
                validator.flagSuspiciousActivity('player1', {
                    violation: 'test',
                    details: {}
                });
            }

            const history = validator.violationHistory.get('player1');
            expect(history.length).toBeLessThanOrEqual(validator.maxViolationHistory);
        });
    });

    describe('disconnectCheater', () => {
        it('should disconnect player and log violation', () => {
            validator.disconnectCheater('player1', 'speed_hack');

            expect(mockGameRoom.sendToPlayer).toHaveBeenCalledWith(
                'player1',
                'kicked',
                expect.objectContaining({
                    reason: 'anti_cheat_violation'
                })
            );
            expect(mockGameRoom.removePlayer).toHaveBeenCalledWith('player1');
        });

        it('should handle non-existent players', () => {
            const result = validator.disconnectCheater('nonexistent', 'test');

            expect(result).toBe(false);
        });

        it('should include violation count in kick message', () => {
            // Add some violations first
            validator.flagSuspiciousActivity('player1', {
                violation: 'speed_hack',
                details: {}
            });

            validator.disconnectCheater('player1', 'multiple_violations');

            expect(mockGameRoom.sendToPlayer).toHaveBeenCalledWith(
                'player1',
                'kicked',
                expect.objectContaining({
                    violationCount: 1
                })
            );
        });
    });

    describe('helper methods', () => {
        it('should calculate distance correctly', () => {
            const distance = validator.calculateDistance(
                { x: 0, y: 0, z: 0 },
                { x: 3, y: 0, z: 4 }
            );

            expect(distance).toBe(5);
        });

        it('should identify valid directions', () => {
            expect(validator.isValidDirection({ x: 1, y: 0, z: 0 })).toBe(true);
            expect(validator.isValidDirection({ x: 0, y: 0, z: 1 })).toBe(true);
            expect(validator.isValidDirection({ x: -1, y: 0, z: 0 })).toBe(true);
            expect(validator.isValidDirection({ x: 0, y: 0, z: -1 })).toBe(true);
            expect(validator.isValidDirection({ x: 1, y: 0, z: 1 })).toBe(false);
        });

        it('should identify reversal directions', () => {
            expect(validator.isReversalDirection(
                { x: 1, y: 0, z: 0 },
                { x: -1, y: 0, z: 0 }
            )).toBe(true);

            expect(validator.isReversalDirection(
                { x: 1, y: 0, z: 0 },
                { x: 0, y: 0, z: 1 }
            )).toBe(false);
        });

        it('should clear player history', () => {
            validator.trackPosition('player1', { x: 0, y: 0, z: 0 }, Date.now());
            validator.trackSpeed('player1', 0.1);
            validator.flagSuspiciousActivity('player1', { violation: 'test', details: {} });

            validator.clearPlayerHistory('player1');

            expect(validator.positionHistory.has('player1')).toBe(false);
            expect(validator.speedHistory.has('player1')).toBe(false);
            expect(validator.violationHistory.has('player1')).toBe(false);
        });

        it('should get player stats', () => {
            validator.trackPosition('player1', { x: 0, y: 0, z: 0 }, Date.now());
            validator.trackSpeed('player1', 0.1);
            validator.flagSuspiciousActivity('player1', { violation: 'test', details: {} });

            const stats = validator.getPlayerStats('player1');

            expect(stats.totalViolations).toBe(1);
            expect(stats.positionHistorySize).toBe(1);
            expect(stats.speedHistorySize).toBe(1);
        });
    });

    describe('getRecentViolations', () => {
        it('should return violations within time window', () => {
            const now = Date.now();
            
            // Add old violation
            validator.violationHistory.set('player1', [{
                type: 'old',
                timestamp: now - 120000 // 2 minutes ago
            }]);
            
            // Add recent violation
            validator.flagSuspiciousActivity('player1', {
                violation: 'recent',
                details: {}
            });

            const recent = validator.getRecentViolations('player1', 60000);

            expect(recent.length).toBe(1);
            expect(recent[0].type).toBe('recent');
        });

        it('should return empty array for player with no violations', () => {
            const recent = validator.getRecentViolations('nonexistent', 60000);

            expect(recent).toEqual([]);
        });
    });
});
