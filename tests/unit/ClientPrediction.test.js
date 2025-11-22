const { ClientPrediction } = require('@/multiplayer/ClientPrediction.js');

describe('ClientPrediction', () => {
    let clientPrediction;
    let mockGameInstance;

    beforeEach(() => {
        // Create mock game instance
        mockGameInstance = {
            player: { x: 0, y: 0, z: 0 },
            playerDirection: { x: 1, y: 0, z: 0 },
            playerTrail: [{ x: 0, y: 0, z: 0 }],
            frameCount: 0,
            changePlayerDirection: jest.fn((key) => {
                // Simulate direction change logic
                if (key === 'ArrowUp' && mockGameInstance.playerDirection.z === 0) {
                    mockGameInstance.playerDirection = { x: 0, y: 0, z: -1 };
                    return true;
                }
                if (key === 'ArrowDown' && mockGameInstance.playerDirection.z === 0) {
                    mockGameInstance.playerDirection = { x: 0, y: 0, z: 1 };
                    return true;
                }
                if (key === 'ArrowLeft' && mockGameInstance.playerDirection.x === 0) {
                    mockGameInstance.playerDirection = { x: -1, y: 0, z: 0 };
                    return true;
                }
                if (key === 'ArrowRight' && mockGameInstance.playerDirection.x === 0) {
                    mockGameInstance.playerDirection = { x: 1, y: 0, z: 0 };
                    return true;
                }
                return false;
            }),
            update: jest.fn(() => {
                // Simulate game update
                mockGameInstance.player.x += mockGameInstance.playerDirection.x * 0.1;
                mockGameInstance.player.z += mockGameInstance.playerDirection.z * 0.1;
                mockGameInstance.playerTrail.push({ ...mockGameInstance.player });
                mockGameInstance.frameCount++;
            }),
            getGameState: jest.fn(() => ({
                player: mockGameInstance.player,
                playerDirection: mockGameInstance.playerDirection,
                playerTrail: mockGameInstance.playerTrail,
                frameCount: mockGameInstance.frameCount
            }))
        };

        clientPrediction = new ClientPrediction(mockGameInstance);
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(clientPrediction.gameInstance).toBe(mockGameInstance);
            expect(clientPrediction.snapshots.size).toBe(0);
            expect(clientPrediction.inputHistory.length).toBe(0);
            expect(clientPrediction.predictionEnabled).toBe(true);
        });

        it('should set reconciliation parameters', () => {
            expect(clientPrediction.reconciliationThreshold).toBe(0.5);
            expect(clientPrediction.smoothingFactor).toBe(0.3);
        });
    });

    describe('applyInput', () => {
        it('should apply valid input and save snapshot', () => {
            const input = { direction: 'up', sequenceId: 1 };
            const timestamp = Date.now();

            const result = clientPrediction.applyInput(input, timestamp);

            expect(result).toBe(true);
            expect(mockGameInstance.changePlayerDirection).toHaveBeenCalledWith('ArrowUp');
            expect(clientPrediction.snapshots.size).toBe(1);
        });

        it('should record input in history', () => {
            const input = { direction: 'up', sequenceId: 1 };
            clientPrediction.applyInput(input, Date.now());

            expect(clientPrediction.inputHistory.length).toBe(1);
            expect(clientPrediction.inputHistory[0].direction).toBe('up');
        });

        it('should not apply input when prediction disabled', () => {
            clientPrediction.disable();
            const input = { direction: 'up', sequenceId: 1 };

            const result = clientPrediction.applyInput(input, Date.now());

            expect(result).toBe(false);
            expect(mockGameInstance.changePlayerDirection).not.toHaveBeenCalled();
        });

        it('should limit input history size', () => {
            for (let i = 0; i < 150; i++) {
                clientPrediction.applyInput({ direction: 'up', sequenceId: i }, Date.now() + i);
            }

            expect(clientPrediction.inputHistory.length).toBeLessThanOrEqual(clientPrediction.maxInputHistory);
        });
    });

    describe('applyDirectionChange', () => {
        it('should convert direction strings to arrow keys', () => {
            clientPrediction.applyDirectionChange('up');
            expect(mockGameInstance.changePlayerDirection).toHaveBeenCalledWith('ArrowUp');

            clientPrediction.applyDirectionChange('down');
            expect(mockGameInstance.changePlayerDirection).toHaveBeenCalledWith('ArrowDown');

            clientPrediction.applyDirectionChange('left');
            expect(mockGameInstance.changePlayerDirection).toHaveBeenCalledWith('ArrowLeft');

            clientPrediction.applyDirectionChange('right');
            expect(mockGameInstance.changePlayerDirection).toHaveBeenCalledWith('ArrowRight');
        });

        it('should return false for invalid direction', () => {
            const result = clientPrediction.applyDirectionChange('invalid');
            expect(result).toBe(false);
        });
    });

    describe('reconcileWithServer', () => {
        it('should reconcile when position error exceeds threshold', () => {
            // Set up predicted position
            mockGameInstance.player = { x: 5, y: 0, z: 5 };

            // Server state with different position
            const serverState = {
                timestamp: Date.now(),
                players: {
                    'player1': {
                        position: { x: 0, y: 0, z: 0 },
                        direction: { x: 1, y: 0, z: 0 },
                        trail: [{ x: 0, y: 0, z: 0 }],
                        lastProcessedSequence: 0
                    }
                }
            };

            clientPrediction.reconcileWithServer(serverState, Date.now());

            // Position should be corrected to server position
            expect(mockGameInstance.player.x).toBe(0);
            expect(mockGameInstance.player.z).toBe(0);
        });

        it('should not reconcile when error is below threshold', () => {
            // Set up predicted position close to server
            mockGameInstance.player = { x: 0.1, y: 0, z: 0.1 };

            const serverState = {
                timestamp: Date.now(),
                players: {
                    'player1': {
                        position: { x: 0, y: 0, z: 0 },
                        direction: { x: 1, y: 0, z: 0 },
                        trail: [{ x: 0, y: 0, z: 0 }],
                        lastProcessedSequence: 0
                    }
                }
            };

            const initialX = mockGameInstance.player.x;
            clientPrediction.reconcileWithServer(serverState, Date.now());

            // Position should remain unchanged
            expect(mockGameInstance.player.x).toBe(initialX);
        });

        it('should update last processed sequence', () => {
            const serverState = {
                timestamp: Date.now(),
                players: {
                    'player1': {
                        position: { x: 0, y: 0, z: 0 },
                        direction: { x: 1, y: 0, z: 0 },
                        trail: [{ x: 0, y: 0, z: 0 }],
                        lastProcessedSequence: 5
                    }
                }
            };

            clientPrediction.reconcileWithServer(serverState, Date.now());

            expect(clientPrediction.lastProcessedSequence).toBe(5);
        });
    });

    describe('calculatePositionError', () => {
        it('should calculate distance between positions', () => {
            const predicted = { x: 3, y: 0, z: 4 };
            const server = { x: 0, y: 0, z: 0 };

            const error = clientPrediction.calculatePositionError(predicted, server);

            expect(error).toBe(5); // 3-4-5 triangle
        });

        it('should return zero for identical positions', () => {
            const pos = { x: 1, y: 0, z: 1 };
            const error = clientPrediction.calculatePositionError(pos, pos);

            expect(error).toBe(0);
        });
    });

    describe('saveSnapshot', () => {
        it('should save game state snapshot', () => {
            const timestamp = Date.now();
            clientPrediction.saveSnapshot(timestamp);

            expect(clientPrediction.snapshots.size).toBe(1);
            const snapshot = clientPrediction.snapshots.get(timestamp);
            expect(snapshot).toBeDefined();
            expect(snapshot.player).toEqual(mockGameInstance.player);
        });

        it('should limit snapshot count', () => {
            for (let i = 0; i < 150; i++) {
                clientPrediction.saveSnapshot(Date.now() + i);
            }

            expect(clientPrediction.snapshots.size).toBeLessThanOrEqual(clientPrediction.maxSnapshots);
        });
    });

    describe('getSnapshot', () => {
        it('should return exact snapshot match', () => {
            const timestamp = Date.now();
            clientPrediction.saveSnapshot(timestamp);

            const snapshot = clientPrediction.getSnapshot(timestamp);

            expect(snapshot).toBeDefined();
            expect(snapshot.timestamp).toBe(timestamp);
        });

        it('should return closest snapshot before timestamp', () => {
            const time1 = Date.now();
            const time2 = time1 + 100;
            const time3 = time1 + 200;

            clientPrediction.saveSnapshot(time1);
            clientPrediction.saveSnapshot(time3);

            const snapshot = clientPrediction.getSnapshot(time2);

            expect(snapshot).toBeDefined();
            expect(snapshot.timestamp).toBe(time1);
        });

        it('should return null when no snapshot available', () => {
            const snapshot = clientPrediction.getSnapshot(Date.now());
            expect(snapshot).toBeNull();
        });
    });

    describe('restoreSnapshot', () => {
        it('should restore game state from snapshot', () => {
            const snapshot = {
                timestamp: Date.now(),
                player: { x: 10, y: 0, z: 10 },
                playerDirection: { x: 0, y: 0, z: 1 },
                playerTrail: [{ x: 10, y: 0, z: 10 }],
                frameCount: 100
            };

            clientPrediction.restoreSnapshot(snapshot);

            expect(mockGameInstance.player.x).toBe(10);
            expect(mockGameInstance.player.z).toBe(10);
            expect(mockGameInstance.playerDirection.z).toBe(1);
            expect(mockGameInstance.frameCount).toBe(100);
        });
    });

    describe('rollbackAndReplay', () => {
        it('should rollback to snapshot and replay inputs', () => {
            const timestamp1 = Date.now();
            const timestamp2 = timestamp1 + 100;

            // Save initial snapshot
            clientPrediction.saveSnapshot(timestamp1);

            // Apply some inputs
            clientPrediction.applyInput({ direction: 'up', sequenceId: 1 }, timestamp2);
            clientPrediction.applyInput({ direction: 'left', sequenceId: 2 }, timestamp2 + 50);

            // Rollback and replay
            clientPrediction.rollbackAndReplay(timestamp1);

            // Inputs should have been replayed
            expect(mockGameInstance.changePlayerDirection).toHaveBeenCalled();
        });
    });

    describe('cleanupOldData', () => {
        it('should remove old snapshots', () => {
            const oldTime = Date.now() - 3000;
            const newTime = Date.now();

            clientPrediction.saveSnapshot(oldTime);
            clientPrediction.saveSnapshot(newTime);

            clientPrediction.cleanupOldData(newTime);

            expect(clientPrediction.snapshots.has(oldTime)).toBe(false);
            expect(clientPrediction.snapshots.has(newTime)).toBe(true);
        });

        it('should remove old inputs', () => {
            const oldTime = Date.now() - 3000;
            const newTime = Date.now();

            clientPrediction.inputHistory.push({ timestamp: oldTime, direction: 'up', sequenceId: 1 });
            clientPrediction.inputHistory.push({ timestamp: newTime, direction: 'down', sequenceId: 2 });

            clientPrediction.cleanupOldData(newTime);

            expect(clientPrediction.inputHistory.length).toBe(1);
            expect(clientPrediction.inputHistory[0].timestamp).toBe(newTime);
        });
    });

    describe('enable/disable', () => {
        it('should enable prediction', () => {
            clientPrediction.disable();
            clientPrediction.enable();

            expect(clientPrediction.isEnabled()).toBe(true);
        });

        it('should disable prediction', () => {
            clientPrediction.disable();

            expect(clientPrediction.isEnabled()).toBe(false);
        });
    });

    describe('reset', () => {
        it('should clear all state', () => {
            clientPrediction.saveSnapshot(Date.now());
            clientPrediction.applyInput({ direction: 'up', sequenceId: 1 }, Date.now());
            clientPrediction.lastServerTimestamp = 12345;
            clientPrediction.lastProcessedSequence = 10;

            clientPrediction.reset();

            expect(clientPrediction.snapshots.size).toBe(0);
            expect(clientPrediction.inputHistory.length).toBe(0);
            expect(clientPrediction.lastServerTimestamp).toBe(0);
            expect(clientPrediction.lastProcessedSequence).toBe(0);
        });
    });

    describe('getStats', () => {
        it('should return prediction statistics', () => {
            clientPrediction.saveSnapshot(Date.now());
            clientPrediction.applyInput({ direction: 'up', sequenceId: 1 }, Date.now());

            const stats = clientPrediction.getStats();

            expect(stats.snapshotCount).toBe(1);
            expect(stats.inputHistoryCount).toBe(1);
            expect(stats.predictionEnabled).toBe(true);
        });
    });

    describe('replayUnacknowledgedInputs', () => {
        it('should replay inputs after last processed sequence', () => {
            clientPrediction.lastProcessedSequence = 2;
            clientPrediction.inputHistory = [
                { direction: 'up', sequenceId: 1, timestamp: Date.now() },
                { direction: 'down', sequenceId: 2, timestamp: Date.now() },
                { direction: 'left', sequenceId: 3, timestamp: Date.now() },
                { direction: 'right', sequenceId: 4, timestamp: Date.now() }
            ];

            mockGameInstance.changePlayerDirection.mockClear();
            clientPrediction.replayUnacknowledgedInputs();

            // Should replay inputs 3 and 4
            expect(mockGameInstance.changePlayerDirection).toHaveBeenCalledTimes(2);
        });
    });
});
