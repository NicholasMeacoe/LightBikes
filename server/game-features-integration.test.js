/**
 * Integration tests for game features in online multiplayer
 * Tests game modes, power-ups, and spectator functionality
 */

const { GameModeManager, GameModes } = require('./GameModeManager');
const { PowerUpSynchronizer, POWER_UP_TYPES } = require('./PowerUpSynchronizer');
const { SpectatorManager } = require('./SpectatorManager');

describe('Game Features Integration', () => {
    describe('GameModeManager', () => {
        let mockGameRoom;

        beforeEach(() => {
            mockGameRoom = {
                id: 'test-room',
                gameState: {
                    players: {
                        'player1': { id: 'player1', isAlive: true, position: { x: 0, y: 0, z: 0 } },
                        'player2': { id: 'player2', isAlive: true, position: { x: 5, y: 0, z: 5 } }
                    },
                    bounds: { minX: -15, maxX: 15, minZ: -15, maxZ: 15, size: 30 }
                },
                broadcastToRoom: jest.fn()
            };
        });

        it('should create Classic mode instance', () => {
            const mode = GameModeManager.createMode(GameModes.CLASSIC, mockGameRoom);
            expect(mode).toBeDefined();
            expect(mode.getModeName()).toBe(GameModes.CLASSIC);
        });

        it('should create Time Trial mode instance', () => {
            const mode = GameModeManager.createMode(GameModes.TIME_TRIAL, mockGameRoom);
            expect(mode).toBeDefined();
            expect(mode.getModeName()).toBe('timeTrial');
        });

        it('should create Arena Shrink mode instance', () => {
            const mode = GameModeManager.createMode(GameModes.ARENA_SHRINK, mockGameRoom);
            expect(mode).toBeDefined();
            expect(mode.getModeName()).toBe('arenaShrink');
        });

        it('should validate game mode names', () => {
            expect(GameModeManager.isValidMode(GameModes.CLASSIC)).toBe(true);
            expect(GameModeManager.isValidMode('invalid')).toBe(false);
        });

        it('should check Classic mode win condition', () => {
            const mode = GameModeManager.createMode(GameModes.CLASSIC, mockGameRoom);
            mode.initialize(Date.now());

            // Both alive - no winner
            let result = mode.checkWinCondition(mockGameRoom.gameState);
            expect(result).toBeNull();

            // One player dies
            mockGameRoom.gameState.players.player2.isAlive = false;
            result = mode.checkWinCondition(mockGameRoom.gameState);
            expect(result).toBeDefined();
            expect(result.winner).toBe('player1');
            expect(result.reason).toBe('last_standing');
        });

        it('should track survival times in Time Trial mode', () => {
            const mode = GameModeManager.createMode(GameModes.TIME_TRIAL, mockGameRoom);
            const startTime = Date.now();
            mode.initialize(startTime);

            // Update after 1 second
            mode.update(startTime + 1000, mockGameRoom.gameState);

            const modeState = mode.getModeState(startTime + 1000);
            expect(modeState.survivalTimes).toBeDefined();
            expect(modeState.survivalTimes.player1).toBeGreaterThan(0);
        });

        it('should shrink arena in Arena Shrink mode', () => {
            const mode = GameModeManager.createMode(GameModes.ARENA_SHRINK, mockGameRoom);
            const startTime = Date.now();
            mode.initialize(startTime);

            const initialState = mode.getModeState(startTime);
            expect(initialState.currentSize).toBe(30);

            // Fast forward past shrink delay
            mode.update(startTime + 16000, mockGameRoom.gameState);

            const afterShrinkState = mode.getModeState(startTime + 16000);
            expect(afterShrinkState.currentSize).toBeLessThan(30);
            expect(mockGameRoom.broadcastToRoom).toHaveBeenCalled();
        });
    });

    describe('PowerUpSynchronizer', () => {
        let mockGameRoom;
        let powerUpSync;

        beforeEach(() => {
            mockGameRoom = {
                id: 'test-room',
                gameState: {
                    players: {
                        'player1': {
                            id: 'player1',
                            isAlive: true,
                            position: { x: 0, y: 0, z: 0 },
                            trail: [{ x: 0, y: 0, z: 0 }]
                        }
                    },
                    bounds: { minX: -15, maxX: 15, minZ: -15, maxZ: 15, size: 30 }
                },
                broadcastToRoom: jest.fn()
            };
            powerUpSync = new PowerUpSynchronizer(mockGameRoom);
        });

        it('should initialize power-up system', () => {
            powerUpSync.initialize();
            expect(powerUpSync.activePowerUps.size).toBe(0);
            expect(powerUpSync.activeEffects.has('player1')).toBe(true);
        });

        it('should spawn power-ups', () => {
            powerUpSync.initialize();
            const currentTime = Date.now();
            const position = { x: 5, y: 0, z: 5 };

            const powerUp = powerUpSync.spawnPowerUp('SPEED_BOOST', position, currentTime);
            expect(powerUp).toBeDefined();
            expect(powerUp.type).toBe('SPEED_BOOST');
            expect(powerUpSync.activePowerUps.size).toBe(1);
        });

        it('should apply speed boost effect', () => {
            powerUpSync.initialize();
            const currentTime = Date.now();

            const result = powerUpSync.applyEffect('player1', 'SPEED_BOOST', currentTime);
            expect(result).toBe(true);

            const multiplier = powerUpSync.getSpeedMultiplier('player1', currentTime);
            expect(multiplier).toBe(2.0);
        });

        it('should apply shield effect', () => {
            powerUpSync.initialize();
            const currentTime = Date.now();

            powerUpSync.applyEffect('player1', 'SHIELD', currentTime);
            const hasShield = powerUpSync.hasShield('player1', currentTime);
            expect(hasShield).toBe(true);
        });

        it('should consume shield on collision', () => {
            powerUpSync.initialize();
            const currentTime = Date.now();

            powerUpSync.applyEffect('player1', 'SHIELD', currentTime);
            const consumed = powerUpSync.consumeShield('player1');
            expect(consumed).toBe(true);

            const hasShield = powerUpSync.hasShield('player1', currentTime);
            expect(hasShield).toBe(false);
        });

        it('should apply ghost mode effect', () => {
            powerUpSync.initialize();
            const currentTime = Date.now();

            powerUpSync.applyEffect('player1', 'GHOST_MODE', currentTime);
            const isGhost = powerUpSync.isInGhostMode('player1', currentTime);
            expect(isGhost).toBe(true);
        });

        it('should erase trail segments', () => {
            powerUpSync.initialize();
            const currentTime = Date.now();

            // Add trail segments
            for (let i = 0; i < 20; i++) {
                mockGameRoom.gameState.players.player1.trail.push({ x: i, y: 0, z: 0 });
            }

            const initialLength = mockGameRoom.gameState.players.player1.trail.length;
            powerUpSync.applyEffect('player1', 'TRAIL_ERASER', currentTime);

            const finalLength = mockGameRoom.gameState.players.player1.trail.length;
            expect(finalLength).toBe(initialLength - 10);
        });

        it('should remove expired power-ups', () => {
            powerUpSync.initialize();
            const currentTime = Date.now();
            const position = { x: 5, y: 0, z: 5 };

            powerUpSync.spawnPowerUp('SPEED_BOOST', position, currentTime - 31000);
            expect(powerUpSync.activePowerUps.size).toBe(1);

            powerUpSync.removeExpiredPowerUps(currentTime);
            expect(powerUpSync.activePowerUps.size).toBe(0);
        });

        it('should remove expired effects', () => {
            powerUpSync.initialize();
            const currentTime = Date.now();

            powerUpSync.applyEffect('player1', 'SPEED_BOOST', currentTime - 4000);
            powerUpSync.removeExpiredEffects(currentTime);

            const multiplier = powerUpSync.getSpeedMultiplier('player1', currentTime);
            expect(multiplier).toBe(1.0);
        });
    });

    describe('SpectatorManager', () => {
        let mockGameRoom;
        let spectatorManager;
        let mockSocket;

        beforeEach(() => {
            mockGameRoom = {
                id: 'test-room',
                gameState: {
                    timestamp: Date.now(),
                    frameNumber: 100,
                    gamePhase: 'playing',
                    players: {
                        'player1': {
                            id: 'player1',
                            name: 'Player 1',
                            position: { x: 0, y: 0, z: 0 },
                            direction: { x: 1, y: 0, z: 0 },
                            trail: [{ x: 0, y: 0, z: 0 }],
                            isAlive: true
                        }
                    },
                    bounds: { minX: -15, maxX: 15, minZ: -15, maxZ: 15, size: 30 }
                },
                sockets: new Map(),
                broadcastToRoom: jest.fn(),
                getRoomData: jest.fn(() => ({ id: 'test-room', status: 'playing' }))
            };

            mockSocket = {
                id: 'spectator1',
                join: jest.fn(),
                leave: jest.fn(),
                emit: jest.fn(),
                on: jest.fn()
            };

            spectatorManager = new SpectatorManager(mockGameRoom);
        });

        it('should add spectator to room', () => {
            const result = spectatorManager.addSpectator(mockSocket, { name: 'Spectator 1' });
            expect(result.success).toBe(true);
            expect(spectatorManager.getSpectatorCount()).toBe(1);
            expect(mockSocket.join).toHaveBeenCalledWith('test-room');
        });

        it('should reject spectator when limit reached', () => {
            // Add max spectators
            for (let i = 0; i < 10; i++) {
                const socket = { ...mockSocket, id: `spectator${i}`, join: jest.fn() };
                spectatorManager.addSpectator(socket, { name: `Spectator ${i}` });
            }

            const result = spectatorManager.addSpectator(mockSocket, { name: 'Extra' });
            expect(result.success).toBe(false);
            expect(result.reason).toBe('spectator_limit_reached');
        });

        it('should remove spectator from room', () => {
            spectatorManager.addSpectator(mockSocket, { name: 'Spectator 1' });
            mockGameRoom.sockets.set(mockSocket.id, mockSocket);

            const removed = spectatorManager.removeSpectator(mockSocket.id);
            expect(removed).toBe(true);
            expect(spectatorManager.getSpectatorCount()).toBe(0);
            expect(mockSocket.leave).toHaveBeenCalledWith('test-room');
        });

        it('should send initial state to spectator', () => {
            spectatorManager.sendInitialState(mockSocket);
            expect(mockSocket.emit).toHaveBeenCalledWith(
                'spectatorInitialState',
                expect.objectContaining({
                    gameState: expect.any(Object),
                    roomData: expect.any(Object)
                })
            );
        });

        it('should format game state for spectators', () => {
            const formatted = spectatorManager.formatGameStateForSpectator(mockGameRoom.gameState);
            expect(formatted.players.player1).toBeDefined();
            expect(formatted.players.player1.trail).toBeDefined();
            expect(formatted.timestamp).toBeDefined();
        });

        it('should handle camera mode changes', () => {
            spectatorManager.addSpectator(mockSocket, { name: 'Spectator 1' });
            spectatorManager.handleSetCamera(mockSocket.id, { mode: 'follow', playerId: 'player1' });

            const spectator = spectatorManager.getSpectator(mockSocket.id);
            expect(spectator.cameraMode).toBe('follow');
            expect(spectator.followingPlayerId).toBe('player1');
        });

        it('should broadcast to all spectators', () => {
            const socket1 = { ...mockSocket, id: 'spec1', join: jest.fn(), emit: jest.fn() };
            const socket2 = { ...mockSocket, id: 'spec2', join: jest.fn(), emit: jest.fn() };

            spectatorManager.addSpectator(socket1, { name: 'Spec 1' });
            spectatorManager.addSpectator(socket2, { name: 'Spec 2' });

            mockGameRoom.sockets.set('spec1', socket1);
            mockGameRoom.sockets.set('spec2', socket2);

            spectatorManager.broadcastToSpectators('testEvent', { data: 'test' });

            expect(socket1.emit).toHaveBeenCalledWith('testEvent', { data: 'test' });
            expect(socket2.emit).toHaveBeenCalledWith('testEvent', { data: 'test' });
        });

        it('should clear all spectators', () => {
            const socket1 = { ...mockSocket, id: 'spec1', join: jest.fn(), leave: jest.fn(), emit: jest.fn() };
            spectatorManager.addSpectator(socket1, { name: 'Spec 1' });
            mockGameRoom.sockets.set('spec1', socket1);

            spectatorManager.clearSpectators();
            expect(spectatorManager.getSpectatorCount()).toBe(0);
            expect(socket1.emit).toHaveBeenCalledWith('spectatorKicked', expect.any(Object));
        });
    });

    describe('Integration Tests', () => {
        it('should integrate game modes with power-ups', () => {
            const mockGameRoom = {
                id: 'test-room',
                gameState: {
                    players: {
                        'player1': { id: 'player1', isAlive: true, position: { x: 0, y: 0, z: 0 }, trail: [] },
                        'player2': { id: 'player2', isAlive: true, position: { x: 5, y: 0, z: 5 }, trail: [] }
                    },
                    bounds: { minX: -15, maxX: 15, minZ: -15, maxZ: 15, size: 30 }
                },
                broadcastToRoom: jest.fn()
            };

            const mode = GameModeManager.createMode(GameModes.CLASSIC, mockGameRoom);
            const powerUpSync = new PowerUpSynchronizer(mockGameRoom);

            mode.initialize(Date.now());
            powerUpSync.initialize();

            // Apply power-up
            powerUpSync.applyEffect('player1', 'SPEED_BOOST', Date.now());

            // Check speed multiplier
            const multiplier = powerUpSync.getSpeedMultiplier('player1', Date.now());
            expect(multiplier).toBe(2.0);

            // Mode should still function normally (both players alive = no winner)
            const winResult = mode.checkWinCondition(mockGameRoom.gameState);
            expect(winResult).toBeNull(); // Both players still alive
        });

        it('should integrate spectators with game modes', () => {
            const mockGameRoom = {
                id: 'test-room',
                gameState: {
                    timestamp: Date.now(),
                    frameNumber: 100,
                    gamePhase: 'playing',
                    players: {
                        'player1': { id: 'player1', isAlive: true, position: { x: 0, y: 0, z: 0 }, trail: [] }
                    },
                    bounds: { minX: -15, maxX: 15, minZ: -15, maxZ: 15, size: 30 },
                    gameMode: GameModes.ARENA_SHRINK
                },
                sockets: new Map(),
                broadcastToRoom: jest.fn(),
                getRoomData: jest.fn(() => ({ id: 'test-room' }))
            };

            const mode = GameModeManager.createMode(GameModes.ARENA_SHRINK, mockGameRoom);
            const spectatorManager = new SpectatorManager(mockGameRoom);

            mode.initialize(Date.now());

            const mockSocket = { id: 'spec1', join: jest.fn(), emit: jest.fn(), on: jest.fn() };
            spectatorManager.addSpectator(mockSocket, { name: 'Spectator' });

            // Get mode state for spectator
            const modeState = mode.getModeState(Date.now());
            expect(modeState.mode).toBe(GameModes.ARENA_SHRINK);
            expect(modeState.currentSize).toBeDefined();
        });
    });
});
