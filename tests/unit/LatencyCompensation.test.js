const { LatencyCompensation } = require('@/multiplayer/LatencyCompensation.js');

describe('LatencyCompensation', () => {
    let latencyComp;
    let mockNetworkManager;

    beforeEach(() => {
        mockNetworkManager = {
            getPing: jest.fn(() => 50)
        };

        latencyComp = new LatencyCompensation(mockNetworkManager);
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(latencyComp.interpolationDelay).toBe(100);
            expect(latencyComp.maxBufferSize).toBe(10);
            expect(latencyComp.adaptiveMode).toBe(true);
            expect(latencyComp.qualityLevel).toBe('high');
        });

        it('should initialize empty buffers', () => {
            expect(latencyComp.interpolationBuffer.size).toBe(0);
            expect(latencyComp.pingHistory.length).toBe(0);
        });
    });

    describe('addStateToBuffer', () => {
        it('should add state to buffer', () => {
            const state = {
                position: { x: 1, y: 0, z: 1 },
                direction: { x: 1, y: 0, z: 0 },
                isAlive: true
            };

            latencyComp.addStateToBuffer('player1', state, Date.now());

            expect(latencyComp.getBufferSize('player1')).toBe(1);
        });

        it('should sort states by timestamp', () => {
            const time1 = Date.now();
            const time2 = time1 + 100;
            const time3 = time1 + 50;

            const state1 = { position: { x: 1, y: 0, z: 0 } };
            const state2 = { position: { x: 2, y: 0, z: 0 } };
            const state3 = { position: { x: 1.5, y: 0, z: 0 } };

            latencyComp.addStateToBuffer('player1', state1, time1);
            latencyComp.addStateToBuffer('player1', state2, time2);
            latencyComp.addStateToBuffer('player1', state3, time3);

            const buffer = latencyComp.interpolationBuffer.get('player1');
            expect(buffer[0].timestamp).toBe(time1);
            expect(buffer[1].timestamp).toBe(time3);
            expect(buffer[2].timestamp).toBe(time2);
        });

        it('should limit buffer size', () => {
            for (let i = 0; i < 15; i++) {
                latencyComp.addStateToBuffer('player1', 
                    { position: { x: i, y: 0, z: 0 } }, 
                    Date.now() + i
                );
            }

            expect(latencyComp.getBufferSize('player1')).toBeLessThanOrEqual(latencyComp.maxBufferSize);
        });
    });

    describe('getInterpolatedState', () => {
        it('should return null when buffer is empty', () => {
            const state = latencyComp.getInterpolatedState('player1');
            expect(state).toBeNull();
        });

        it('should return single state when only one available', () => {
            const state = { position: { x: 1, y: 0, z: 1 } };
            latencyComp.addStateToBuffer('player1', state, Date.now());

            const interpolated = latencyComp.getInterpolatedState('player1');
            expect(interpolated).toEqual(state);
        });

        it('should interpolate between two states', () => {
            const time = Date.now();
            const state1 = { 
                position: { x: 0, y: 0, z: 0 },
                direction: { x: 1, y: 0, z: 0 },
                isAlive: true
            };
            const state2 = { 
                position: { x: 10, y: 0, z: 0 },
                direction: { x: 1, y: 0, z: 0 },
                isAlive: true
            };

            latencyComp.addStateToBuffer('player1', state1, time);
            latencyComp.addStateToBuffer('player1', state2, time + 200);

            const interpolated = latencyComp.getInterpolatedState('player1', time + 200);

            // Should interpolate position
            expect(interpolated.position.x).toBeGreaterThan(0);
            expect(interpolated.position.x).toBeLessThan(10);
        });
    });

    describe('interpolateStates', () => {
        it('should interpolate positions correctly', () => {
            const state1 = { position: { x: 0, y: 0, z: 0 }, direction: { x: 1, y: 0, z: 0 } };
            const state2 = { position: { x: 10, y: 0, z: 0 }, direction: { x: 1, y: 0, z: 0 } };

            const interpolated = latencyComp.interpolateStates(state1, state2, 0.5);

            expect(interpolated.position.x).toBe(5);
            expect(interpolated.position.y).toBe(0);
            expect(interpolated.position.z).toBe(0);
        });

        it('should use end state direction', () => {
            const state1 = { position: { x: 0, y: 0, z: 0 }, direction: { x: 1, y: 0, z: 0 } };
            const state2 = { position: { x: 10, y: 0, z: 0 }, direction: { x: 0, y: 0, z: 1 } };

            const interpolated = latencyComp.interpolateStates(state1, state2, 0.5);

            expect(interpolated.direction).toEqual(state2.direction);
        });

        it('should clamp t to [0, 1]', () => {
            const state1 = { position: { x: 0, y: 0, z: 0 }, direction: { x: 1, y: 0, z: 0 } };
            const state2 = { position: { x: 10, y: 0, z: 0 }, direction: { x: 1, y: 0, z: 0 } };

            const interpolated1 = latencyComp.interpolateStates(state1, state2, -0.5);
            expect(interpolated1.position.x).toBe(0);

            const interpolated2 = latencyComp.interpolateStates(state1, state2, 1.5);
            expect(interpolated2.position.x).toBe(10);
        });
    });

    describe('lerp', () => {
        it('should interpolate linearly', () => {
            expect(latencyComp.lerp(0, 10, 0)).toBe(0);
            expect(latencyComp.lerp(0, 10, 0.5)).toBe(5);
            expect(latencyComp.lerp(0, 10, 1)).toBe(10);
        });

        it('should handle negative values', () => {
            expect(latencyComp.lerp(-10, 10, 0.5)).toBe(0);
        });
    });

    describe('recordPing', () => {
        it('should record ping measurement', () => {
            latencyComp.recordPing(50);

            expect(latencyComp.pingHistory.length).toBe(1);
            expect(latencyComp.averagePing).toBe(50);
        });

        it('should calculate average ping', () => {
            latencyComp.recordPing(40);
            latencyComp.recordPing(50);
            latencyComp.recordPing(60);

            expect(latencyComp.averagePing).toBe(50);
        });

        it('should limit ping history size', () => {
            for (let i = 0; i < 50; i++) {
                latencyComp.recordPing(50);
            }

            expect(latencyComp.pingHistory.length).toBeLessThanOrEqual(latencyComp.maxPingHistory);
        });

        it('should calculate ping variance', () => {
            latencyComp.recordPing(40);
            latencyComp.recordPing(50);
            latencyComp.recordPing(60);

            expect(latencyComp.pingVariance).toBeGreaterThan(0);
        });
    });

    describe('calculatePingStatistics', () => {
        it('should handle empty history', () => {
            latencyComp.calculatePingStatistics();

            expect(latencyComp.averagePing).toBe(0);
            expect(latencyComp.pingVariance).toBe(0);
        });

        it('should calculate statistics correctly', () => {
            latencyComp.pingHistory = [40, 50, 60];
            latencyComp.calculatePingStatistics();

            expect(latencyComp.averagePing).toBe(50);
            expect(latencyComp.pingVariance).toBeGreaterThan(0);
        });
    });

    describe('adaptToNetworkConditions', () => {
        it('should set high quality for low ping', () => {
            latencyComp.averagePing = 30;
            latencyComp.pingVariance = 5;

            latencyComp.adaptToNetworkConditions();

            expect(latencyComp.qualityLevel).toBe('high');
        });

        it('should set medium quality for moderate ping', () => {
            latencyComp.averagePing = 80;
            latencyComp.pingVariance = 20;

            latencyComp.adaptToNetworkConditions();

            expect(latencyComp.qualityLevel).toBe('medium');
        });

        it('should set low quality for high ping', () => {
            latencyComp.averagePing = 150;
            latencyComp.pingVariance = 40;

            latencyComp.adaptToNetworkConditions();

            expect(latencyComp.qualityLevel).toBe('low');
        });
    });

    describe('setQualityLevel', () => {
        it('should update quality settings', () => {
            latencyComp.setQualityLevel('low');

            expect(latencyComp.qualityLevel).toBe('low');
            expect(latencyComp.interpolationDelay).toBe(200);
        });

        it('should trim buffers when reducing size', () => {
            // Add many states
            for (let i = 0; i < 10; i++) {
                latencyComp.addStateToBuffer('player1', 
                    { position: { x: i, y: 0, z: 0 } }, 
                    Date.now() + i
                );
            }

            latencyComp.setQualityLevel('low');

            expect(latencyComp.getBufferSize('player1')).toBeLessThanOrEqual(5);
        });

        it('should ignore invalid quality level', () => {
            const originalQuality = latencyComp.qualityLevel;
            latencyComp.setQualityLevel('invalid');

            expect(latencyComp.qualityLevel).toBe(originalQuality);
        });
    });

    describe('getPing', () => {
        it('should get ping from network manager', () => {
            const ping = latencyComp.getPing();

            expect(mockNetworkManager.getPing).toHaveBeenCalled();
            expect(ping).toBe(50);
        });

        it('should return average ping if network manager unavailable', () => {
            latencyComp.networkManager = null;
            latencyComp.averagePing = 75;

            const ping = latencyComp.getPing();

            expect(ping).toBe(75);
        });
    });

    describe('getNetworkStats', () => {
        it('should return network statistics', () => {
            latencyComp.recordPing(50);
            const stats = latencyComp.getNetworkStats();

            expect(stats).toHaveProperty('currentPing');
            expect(stats).toHaveProperty('averagePing');
            expect(stats).toHaveProperty('pingVariance');
            expect(stats).toHaveProperty('qualityLevel');
            expect(stats).toHaveProperty('interpolationDelay');
        });
    });

    describe('clearBuffer', () => {
        it('should clear buffer for specific player', () => {
            latencyComp.addStateToBuffer('player1', { position: { x: 1, y: 0, z: 0 } }, Date.now());
            latencyComp.addStateToBuffer('player2', { position: { x: 2, y: 0, z: 0 } }, Date.now());

            latencyComp.clearBuffer('player1');

            expect(latencyComp.getBufferSize('player1')).toBe(0);
            expect(latencyComp.getBufferSize('player2')).toBe(1);
        });
    });

    describe('clearAllBuffers', () => {
        it('should clear all buffers', () => {
            latencyComp.addStateToBuffer('player1', { position: { x: 1, y: 0, z: 0 } }, Date.now());
            latencyComp.addStateToBuffer('player2', { position: { x: 2, y: 0, z: 0 } }, Date.now());

            latencyComp.clearAllBuffers();

            expect(latencyComp.interpolationBuffer.size).toBe(0);
        });
    });

    describe('adaptive mode', () => {
        it('should enable adaptive mode', () => {
            latencyComp.disableAdaptiveMode();
            latencyComp.enableAdaptiveMode();

            expect(latencyComp.isAdaptiveModeEnabled()).toBe(true);
        });

        it('should disable adaptive mode', () => {
            latencyComp.disableAdaptiveMode();

            expect(latencyComp.isAdaptiveModeEnabled()).toBe(false);
        });

        it('should not adapt when disabled', () => {
            latencyComp.disableAdaptiveMode();
            latencyComp.averagePing = 150;
            latencyComp.pingVariance = 40;

            latencyComp.recordPing(150);

            // Should remain high quality
            expect(latencyComp.qualityLevel).toBe('high');
        });
    });

    describe('setInterpolationDelay', () => {
        it('should set interpolation delay', () => {
            latencyComp.setInterpolationDelay(150);

            expect(latencyComp.getInterpolationDelay()).toBe(150);
        });

        it('should reject negative delay', () => {
            const originalDelay = latencyComp.interpolationDelay;
            latencyComp.setInterpolationDelay(-50);

            expect(latencyComp.interpolationDelay).toBe(originalDelay);
        });
    });

    describe('reset', () => {
        it('should reset all state', () => {
            latencyComp.addStateToBuffer('player1', { position: { x: 1, y: 0, z: 0 } }, Date.now());
            latencyComp.recordPing(100);
            latencyComp.setQualityLevel('low');

            latencyComp.reset();

            expect(latencyComp.interpolationBuffer.size).toBe(0);
            expect(latencyComp.pingHistory.length).toBe(0);
            expect(latencyComp.averagePing).toBe(0);
            expect(latencyComp.qualityLevel).toBe('high');
        });
    });

    describe('cleanupOldStates', () => {
        it('should remove old states from buffers', () => {
            const oldTime = Date.now() - 1000;
            const newTime = Date.now();

            latencyComp.addStateToBuffer('player1', { position: { x: 1, y: 0, z: 0 } }, oldTime);
            latencyComp.addStateToBuffer('player1', { position: { x: 2, y: 0, z: 0 } }, newTime);

            latencyComp.cleanupOldStates(newTime);

            expect(latencyComp.getBufferSize('player1')).toBe(1);
        });
    });

    describe('getBufferSize', () => {
        it('should return buffer size for player', () => {
            latencyComp.addStateToBuffer('player1', { position: { x: 1, y: 0, z: 0 } }, Date.now());
            latencyComp.addStateToBuffer('player1', { position: { x: 2, y: 0, z: 0 } }, Date.now());

            expect(latencyComp.getBufferSize('player1')).toBe(2);
        });

        it('should return 0 for non-existent player', () => {
            expect(latencyComp.getBufferSize('nonexistent')).toBe(0);
        });
    });

    describe('hasSufficientBuffer', () => {
        it('should return true when buffer has 2+ states', () => {
            latencyComp.addStateToBuffer('player1', { position: { x: 1, y: 0, z: 0 } }, Date.now());
            latencyComp.addStateToBuffer('player1', { position: { x: 2, y: 0, z: 0 } }, Date.now());

            expect(latencyComp.hasSufficientBuffer('player1')).toBe(true);
        });

        it('should return false when buffer has < 2 states', () => {
            latencyComp.addStateToBuffer('player1', { position: { x: 1, y: 0, z: 0 } }, Date.now());

            expect(latencyComp.hasSufficientBuffer('player1')).toBe(false);
        });
    });
});
