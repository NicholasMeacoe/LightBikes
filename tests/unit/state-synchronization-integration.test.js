/**
 * Integration tests for real-time state synchronization
 * Tests the complete flow: server state management -> network -> client prediction -> interpolation
 */

const { GameRoom } = require('../../server/GameRoom.js');
const { ClientPrediction } = require('@/multiplayer/ClientPrediction.js');
const { LatencyCompensation } = require('@/multiplayer/LatencyCompensation.js');

describe('State Synchronization Integration', () => {
    let gameRoom;
    let mockIo;
    let mockSocket1;
    let mockSocket2;
    let clientPrediction;
    let latencyComp;
    let mockGameInstance;
    let mockNetworkManager;

    beforeEach(() => {
        jest.useFakeTimers();

        // Set up server-side
        mockIo = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn()
        };

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

        gameRoom = new GameRoom('TEST123', {
            maxPlayers: 4,
            gameMode: 'classic',
            isPrivate: false
        }, mockIo);

        // Set up client-side
        mockGameInstance = {
            player: { x: 0, y: 0, z: 0 },
            playerDirection: { x: 1, y: 0, z: 0 },
            playerTrail: [{ x: 0, y: 0, z: 0 }],
            frameCount: 0,
            changePlayerDirection: jest.fn((key) => {
                if (key === 'ArrowUp' && mockGameInstance.playerDirection.z === 0) {
                    mockGameInstance.playerDirection = { x: 0, y: 0, z: -1 };
                    return true;
                }
                return false;
            }),
            update: jest.fn(() => {
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

        mockNetworkManager = {
            getPing: jest.fn(() => 50)
        };

        clientPrediction = new ClientPrediction(mockGameInstance);
        latencyComp = new LatencyCompensation(mockNetworkManager);
    });

    afterEach(() => {
        if (gameRoom.gameLoopInterval) {
            clearInterval(gameRoom.gameLoopInterval);
        }
        jest.useRealTimers();
    });

    describe('Complete State Synchronization Flow', () => {
        it('should handle full game loop with state sync', () => {
            // Add players to room
            gameRoom.addPlayer(mockSocket1, { name: 'Player1', isHost: true });
            gameRoom.addPlayer(mockSocket2, { name: 'Player2' });

            // Initialize game state
            gameRoom.initializeGameState();
            gameRoom.status = 'playing';

            // Simulate client input
            const inputData = {
                direction: 'up',
                timestamp: Date.now(),
                sequenceId: 1
            };

            // Client applies input with prediction
            clientPrediction.applyInput(inputData, inputData.timestamp);

            // Server receives and processes input
            gameRoom.handlePlayerInput(mockSocket1.id, inputData);

            // Server updates game state
            gameRoom.updateGameState();

            // Server broadcasts state
            gameRoom.broadcastGameState();

            // Verify broadcast was called
            expect(mockIo.emit).toHaveBeenCalledWith('gameState', expect.any(Object));

            // Get broadcasted state
            const broadcastCall = mockIo.emit.mock.calls.find(call => call[0] === 'gameState');
            const serverState = broadcastCall[1];

            // Client receives server state and reconciles
            clientPrediction.reconcileWithServer(serverState, serverState.timestamp);

            // Verify reconciliation occurred
            expect(clientPrediction.lastServerTimestamp).toBe(serverState.timestamp);
        });

        it('should handle latency compensation with interpolation', () => {
            // Add players
            gameRoom.addPlayer(mockSocket1, { name: 'Player1', isHost: true });
            gameRoom.addPlayer(mockSocket2, { name: 'Player2' });

            // Initialize and start game
            gameRoom.initializeGameState();
            gameRoom.status = 'playing';

            // Simulate multiple server updates
            const baseTime = Date.now();
            for (let i = 0; i < 5; i++) {
                gameRoom.updateGameState();
                gameRoom.broadcastGameState();

                // Get server state
                const broadcastCall = mockIo.emit.mock.calls.find(call => call[0] === 'gameState');
                if (broadcastCall) {
                    const serverState = broadcastCall[1];
                    const playerState = Object.values(serverState.players)[0];

                    // Add to interpolation buffer
                    latencyComp.addStateToBuffer(
                        playerState.id,
                        playerState,
                        baseTime + (i * 16) // 60Hz = ~16ms per frame
                    );
                }

                mockIo.emit.mockClear();
            }

            // Get interpolated state
            const interpolated = latencyComp.getInterpolatedState('player1', baseTime + 100);

            // Should have interpolated state
            expect(interpolated).toBeDefined();
            if (interpolated) {
                expect(interpolated.position).toBeDefined();
            }
        });

        it('should handle prediction error correction', () => {
            // Add players
            gameRoom.addPlayer(mockSocket1, { name: 'Player1', isHost: true });
            gameRoom.addPlayer(mockSocket2, { name: 'Player2' });

            // Initialize game
            gameRoom.initializeGameState();
            gameRoom.status = 'playing';

            // Client predicts movement
            mockGameInstance.player = { x: 5, y: 0, z: 5 };

            // Server has different position (simulating desync)
            gameRoom.updateGameState();
            gameRoom.broadcastGameState();

            const broadcastCall = mockIo.emit.mock.calls.find(call => call[0] === 'gameState');
            const serverState = broadcastCall[1];

            // Client reconciles with server
            const initialX = mockGameInstance.player.x;
            clientPrediction.reconcileWithServer(serverState, serverState.timestamp);

            // Position should be corrected if error was significant
            const playerState = Object.values(serverState.players)[0];
            const error = Math.sqrt(
                Math.pow(initialX - playerState.position.x, 2) +
                Math.pow(5 - playerState.position.z, 2)
            );

            if (error > clientPrediction.reconciliationThreshold) {
                expect(mockGameInstance.player.x).toBe(playerState.position.x);
            }
        });

        it('should adapt to network conditions', () => {
            // Simulate varying ping
            const pings = [30, 35, 40, 150, 160, 155, 50, 45, 40];

            pings.forEach(ping => {
                latencyComp.recordPing(ping);
            });

            // Quality should have adapted based on ping changes
            const stats = latencyComp.getNetworkStats();
            expect(stats.qualityLevel).toBeDefined();
            expect(['high', 'medium', 'low']).toContain(stats.qualityLevel);
        });

        it('should handle multiple players with state sync', () => {
            // Add players
            gameRoom.addPlayer(mockSocket1, { name: 'Player1', isHost: true });
            gameRoom.addPlayer(mockSocket2, { name: 'Player2' });

            // Initialize game
            gameRoom.initializeGameState();
            gameRoom.status = 'playing';

            // Both players send inputs
            gameRoom.handlePlayerInput(mockSocket1.id, {
                direction: 'up',
                timestamp: Date.now(),
                sequenceId: 1
            });

            gameRoom.handlePlayerInput(mockSocket2.id, {
                direction: 'down',
                timestamp: Date.now(),
                sequenceId: 1
            });

            // Update game state
            gameRoom.updateGameState();
            gameRoom.broadcastGameState();

            // Verify both players in state
            const broadcastCall = mockIo.emit.mock.calls.find(call => call[0] === 'gameState');
            const serverState = broadcastCall[1];

            expect(Object.keys(serverState.players).length).toBe(2);
        });

        it('should maintain 60Hz update rate', () => {
            // Add players
            gameRoom.addPlayer(mockSocket1, { name: 'Player1', isHost: true });
            gameRoom.addPlayer(mockSocket2, { name: 'Player2' });

            // Start game loop
            gameRoom.initializeGameState();
            gameRoom.status = 'playing';
            gameRoom.startGameLoop();

            // Verify update rate
            expect(gameRoom.updateRate).toBe(60);
            expect(gameRoom.frameTime).toBe(1000 / 60);

            // Clean up
            gameRoom.stopGameLoop();
        });

        it('should handle collision detection in multiplayer', () => {
            // Add players
            gameRoom.addPlayer(mockSocket1, { name: 'Player1', isHost: true });
            gameRoom.addPlayer(mockSocket2, { name: 'Player2' });

            // Initialize game
            gameRoom.initializeGameState();
            gameRoom.status = 'playing';

            // Move player out of bounds
            const player1 = gameRoom.gameState.players[mockSocket1.id];
            player1.position.x = 100; // Outside arena

            // Check collisions
            gameRoom.checkCollisions();

            // Player should be marked as not alive
            expect(player1.isAlive).toBe(false);
        });

        it('should detect win condition', () => {
            // Add players
            gameRoom.addPlayer(mockSocket1, { name: 'Player1', isHost: true });
            gameRoom.addPlayer(mockSocket2, { name: 'Player2' });

            // Initialize game
            gameRoom.initializeGameState();
            gameRoom.status = 'playing';

            // Kill one player
            const player2 = gameRoom.gameState.players[mockSocket2.id];
            player2.isAlive = false;

            // Check win condition
            gameRoom.checkWinCondition();

            // Game should end with winner
            expect(gameRoom.gameState.gamePhase).toBe('ended');
            expect(gameRoom.gameState.winner).toBe(mockSocket1.id);
        });

        it('should cleanup old data periodically', () => {
            const oldTime = Date.now() - 5000;
            const newTime = Date.now();

            // Add old snapshot
            clientPrediction.saveSnapshot(oldTime);
            clientPrediction.saveSnapshot(newTime);

            // Add old state to interpolation buffer
            latencyComp.addStateToBuffer('player1', 
                { position: { x: 0, y: 0, z: 0 } }, 
                oldTime
            );
            latencyComp.addStateToBuffer('player1', 
                { position: { x: 1, y: 0, z: 0 } }, 
                newTime
            );

            // Cleanup
            clientPrediction.cleanupOldData(newTime);
            latencyComp.cleanupOldStates(newTime);

            // Old data should be removed
            expect(clientPrediction.snapshots.has(oldTime)).toBe(false);
            expect(latencyComp.getBufferSize('player1')).toBe(1);
        });
    });

    describe('Performance and Optimization', () => {
        it('should limit trail segments in broadcast', () => {
            // Add players
            gameRoom.addPlayer(mockSocket1, { name: 'Player1', isHost: true });
            gameRoom.addPlayer(mockSocket2, { name: 'Player2' });

            // Initialize game
            gameRoom.initializeGameState();
            gameRoom.status = 'playing';

            // Create long trail
            const player1 = gameRoom.gameState.players[mockSocket1.id];
            for (let i = 0; i < 100; i++) {
                player1.trail.push({ x: i, y: 0, z: 0 });
            }

            // Broadcast state
            gameRoom.broadcastGameState();

            // Get broadcasted state
            const broadcastCall = mockIo.emit.mock.calls.find(call => call[0] === 'gameState');
            const serverState = broadcastCall[1];
            const broadcastPlayer = serverState.players[mockSocket1.id];

            // Trail should be limited
            expect(broadcastPlayer.trail.length).toBeLessThanOrEqual(50);
        });

        it('should limit snapshot history', () => {
            // Add many snapshots
            for (let i = 0; i < 150; i++) {
                clientPrediction.saveSnapshot(Date.now() + i);
            }

            // Should not exceed max
            expect(clientPrediction.snapshots.size).toBeLessThanOrEqual(
                clientPrediction.maxSnapshots
            );
        });

        it('should limit input queue size', () => {
            // Add players
            gameRoom.addPlayer(mockSocket1, { name: 'Player1', isHost: true });
            gameRoom.addPlayer(mockSocket2, { name: 'Player2' });

            // Initialize game
            gameRoom.initializeGameState();
            gameRoom.status = 'playing';

            // Send many inputs
            for (let i = 0; i < 20; i++) {
                gameRoom.handlePlayerInput(mockSocket1.id, {
                    direction: 'up',
                    timestamp: Date.now(),
                    sequenceId: i
                });
            }

            // Queue should be limited
            const queue = gameRoom.inputQueue.get(mockSocket1.id);
            expect(queue.length).toBeLessThanOrEqual(10);
        });
    });
});
