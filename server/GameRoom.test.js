const { GameRoom } = require('./GameRoom');

describe('GameRoom', () => {
    let room;
    let mockIo;
    let mockSocket;

    beforeEach(() => {
        mockIo = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn()
        };

        mockSocket = {
            id: 'socket123',
            join: jest.fn(),
            leave: jest.fn(),
            on: jest.fn(),
            emit: jest.fn()
        };

        room = new GameRoom('ROOM01', {
            maxPlayers: 4,
            gameMode: 'classic',
            isPrivate: false
        }, mockIo);
    });

    describe('constructor', () => {
        it('should initialize with correct settings', () => {
            expect(room.id).toBe('ROOM01');
            expect(room.settings.maxPlayers).toBe(4);
            expect(room.settings.gameMode).toBe('classic');
            expect(room.settings.isPrivate).toBe(false);
        });

        it('should initialize with default settings', () => {
            const defaultRoom = new GameRoom('ROOM02', {}, mockIo);
            expect(defaultRoom.settings.maxPlayers).toBe(4);
            expect(defaultRoom.settings.gameMode).toBe('classic');
            expect(defaultRoom.settings.isPrivate).toBe(false);
        });

        it('should start in waiting status', () => {
            expect(room.status).toBe('waiting');
            expect(room.players.size).toBe(0);
        });
    });

    describe('addPlayer', () => {
        it('should add player successfully', () => {
            const result = room.addPlayer(mockSocket, {
                name: 'TestPlayer',
                isHost: true
            });

            expect(result).toBe(true);
            expect(room.players.size).toBe(1);
            expect(mockSocket.join).toHaveBeenCalledWith('ROOM01');
        });

        it('should reject when room is full', () => {
            room.settings.maxPlayers = 2;
            room.addPlayer(mockSocket, { name: 'Player1' });
            
            const socket2 = { ...mockSocket, id: 'socket456', join: jest.fn() };
            room.addPlayer(socket2, { name: 'Player2' });

            const socket3 = { ...mockSocket, id: 'socket789', join: jest.fn() };
            const result = room.addPlayer(socket3, { name: 'Player3' });

            expect(result).toBe(false);
            expect(room.players.size).toBe(2);
        });

        it('should reject when game is playing', () => {
            room.status = 'playing';
            const result = room.addPlayer(mockSocket, { name: 'TestPlayer' });

            expect(result).toBe(false);
            expect(room.players.size).toBe(0);
        });

        it('should reject duplicate player', () => {
            room.addPlayer(mockSocket, { name: 'TestPlayer' });
            const result = room.addPlayer(mockSocket, { name: 'TestPlayer' });

            expect(result).toBe(false);
            expect(room.players.size).toBe(1);
        });

        it('should set up player handlers', () => {
            room.addPlayer(mockSocket, { name: 'TestPlayer' });
            expect(mockSocket.on).toHaveBeenCalledWith('setReady', expect.any(Function));
            expect(mockSocket.on).toHaveBeenCalledWith('startGame', expect.any(Function));
            expect(mockSocket.on).toHaveBeenCalledWith('chat', expect.any(Function));
        });

        it('should broadcast player joined', () => {
            room.addPlayer(mockSocket, { name: 'TestPlayer' });
            expect(mockIo.to).toHaveBeenCalledWith('ROOM01');
            expect(mockIo.emit).toHaveBeenCalledWith('playerJoined', expect.any(Object));
        });
    });

    describe('removePlayer', () => {
        beforeEach(() => {
            room.addPlayer(mockSocket, { name: 'TestPlayer', isHost: true });
        });

        it('should remove player successfully', () => {
            const result = room.removePlayer(mockSocket.id);

            expect(result).toBe(true);
            expect(room.players.size).toBe(0);
            expect(mockSocket.leave).toHaveBeenCalledWith('ROOM01');
        });

        it('should transfer host when host leaves', () => {
            const socket2 = { ...mockSocket, id: 'socket456', join: jest.fn(), on: jest.fn() };
            room.addPlayer(socket2, { name: 'Player2', isHost: false });

            room.removePlayer(mockSocket.id);

            const newHost = room.players.get('socket456');
            expect(newHost.isHost).toBe(true);
        });

        it('should return false for non-existent player', () => {
            const result = room.removePlayer('nonexistent');
            expect(result).toBe(false);
        });

        it('should broadcast player left', () => {
            mockIo.emit.mockClear();
            room.removePlayer(mockSocket.id);
            expect(mockIo.emit).toHaveBeenCalledWith('playerLeft', expect.any(Object));
        });
    });

    describe('handleSetReady', () => {
        beforeEach(() => {
            room.addPlayer(mockSocket, { name: 'TestPlayer' });
        });

        it('should set player ready status', () => {
            room.handleSetReady(mockSocket.id, true);
            const player = room.players.get(mockSocket.id);
            expect(player.isReady).toBe(true);
        });

        it('should broadcast ready status', () => {
            mockIo.emit.mockClear();
            room.handleSetReady(mockSocket.id, true);
            expect(mockIo.emit).toHaveBeenCalledWith('playerReady', expect.any(Object));
        });

        it('should not work when game is not waiting', () => {
            room.status = 'playing';
            room.handleSetReady(mockSocket.id, true);
            const player = room.players.get(mockSocket.id);
            expect(player.isReady).toBe(false);
        });
    });

    describe('handleChat', () => {
        beforeEach(() => {
            room.addPlayer(mockSocket, { name: 'TestPlayer' });
        });

        it('should broadcast valid chat message', () => {
            mockIo.emit.mockClear();
            room.handleChat(mockSocket.id, 'Hello world');
            expect(mockIo.emit).toHaveBeenCalledWith('chat', expect.objectContaining({
                message: 'Hello world',
                playerName: 'TestPlayer'
            }));
        });

        it('should reject empty message', () => {
            mockIo.emit.mockClear();
            room.handleChat(mockSocket.id, '');
            expect(mockIo.emit).not.toHaveBeenCalled();
        });

        it('should reject too long message', () => {
            mockIo.emit.mockClear();
            const longMessage = 'a'.repeat(201);
            room.handleChat(mockSocket.id, longMessage);
            expect(mockIo.emit).not.toHaveBeenCalled();
        });
    });

    describe('startGame', () => {
        beforeEach(() => {
            room.addPlayer(mockSocket, { name: 'Player1' });
            const socket2 = { ...mockSocket, id: 'socket456', join: jest.fn(), on: jest.fn() };
            room.addPlayer(socket2, { name: 'Player2' });
        });

        it('should start game countdown', () => {
            mockIo.emit.mockClear();
            room.startGame();
            expect(room.status).toBe('countdown');
            expect(mockIo.emit).toHaveBeenCalledWith('gameStarting', expect.any(Object));
        });

        it('should not start if already playing', () => {
            room.status = 'playing';
            const initialStatus = room.status;
            room.startGame();
            expect(room.status).toBe(initialStatus);
        });
    });

    describe('endGame', () => {
        beforeEach(() => {
            room.status = 'playing';
            // Initialize game state to prevent null reference errors
            room.gameState = {
                timestamp: Date.now(),
                frameNumber: 0,
                gamePhase: 'playing',
                winner: null,
                players: {}
            };
        });

        it('should end game with winner', () => {
            mockIo.emit.mockClear();
            room.endGame('completed', 'socket123');
            expect(room.status).toBe('ended');
            expect(room.winner).toBe('socket123');
            expect(mockIo.emit).toHaveBeenCalledWith('gameEnded', expect.any(Object));
        });

        it('should not end if not playing', () => {
            room.status = 'waiting';
            room.endGame('completed');
            expect(room.status).toBe('waiting');
        });
    });

    describe('canJoin', () => {
        it('should allow join when waiting and not full', () => {
            expect(room.canJoin()).toBe(true);
        });

        it('should not allow join when full', () => {
            room.settings.maxPlayers = 1;
            room.addPlayer(mockSocket, { name: 'Player1' });
            expect(room.canJoin()).toBe(false);
        });

        it('should not allow join when playing', () => {
            room.status = 'playing';
            expect(room.canJoin()).toBe(false);
        });

        it('should allow join during countdown', () => {
            room.status = 'countdown';
            expect(room.canJoin()).toBe(true);
        });
    });

    describe('areAllPlayersReady', () => {
        it('should return false with no players', () => {
            expect(room.areAllPlayersReady()).toBe(false);
        });

        it('should return false when not all ready', () => {
            room.addPlayer(mockSocket, { name: 'Player1' });
            expect(room.areAllPlayersReady()).toBe(false);
        });

        it('should return true when all ready', () => {
            room.addPlayer(mockSocket, { name: 'Player1' });
            room.handleSetReady(mockSocket.id, true);
            expect(room.areAllPlayersReady()).toBe(true);
        });
    });

    describe('getRoomData', () => {
        it('should return complete room data', () => {
            room.addPlayer(mockSocket, { name: 'TestPlayer' });
            const data = room.getRoomData();

            expect(data).toHaveProperty('id');
            expect(data).toHaveProperty('settings');
            expect(data).toHaveProperty('status');
            expect(data).toHaveProperty('playerCount');
            expect(data).toHaveProperty('players');
            expect(data.players).toHaveLength(1);
        });
    });

    describe('updatePlayerPing', () => {
        beforeEach(() => {
            room.addPlayer(mockSocket, { name: 'TestPlayer' });
        });

        it('should update player ping', () => {
            room.updatePlayerPing(mockSocket.id, 50);
            const player = room.players.get(mockSocket.id);
            expect(player.ping).toBe(50);
        });

        it('should handle non-existent player', () => {
            expect(() => room.updatePlayerPing('nonexistent', 50)).not.toThrow();
        });
    });
    
    describe('Game State Management', () => {
        beforeEach(() => {
            jest.useFakeTimers();
            room.addPlayer(mockSocket, { name: 'Player1', isHost: true });
            const socket2 = { ...mockSocket, id: 'socket456', join: jest.fn(), on: jest.fn(), leave: jest.fn(), emit: jest.fn() };
            room.addPlayer(socket2, { name: 'Player2' });
        });
        
        afterEach(() => {
            if (room.gameLoopInterval) {
                clearInterval(room.gameLoopInterval);
            }
            jest.useRealTimers();
        });
        
        describe('initializeGameState', () => {
            it('should initialize game state with player positions', () => {
                room.initializeGameState();
                
                expect(room.gameState).toBeDefined();
                expect(room.gameState.players).toBeDefined();
                expect(Object.keys(room.gameState.players).length).toBe(2);
                expect(room.gameState.frameNumber).toBe(0);
                expect(room.gameState.gamePhase).toBe('playing');
            });
            
            it('should position players in circle around arena', () => {
                room.initializeGameState();
                
                const player1 = room.gameState.players[mockSocket.id];
                const player2 = room.gameState.players['socket456'];
                
                expect(player1.position).toBeDefined();
                expect(player2.position).toBeDefined();
                expect(player1.direction).toBeDefined();
                expect(player2.direction).toBeDefined();
            });
            
            it('should initialize input queues', () => {
                room.initializeGameState();
                
                expect(room.inputQueue.size).toBe(2);
                expect(room.inputQueue.get(mockSocket.id)).toEqual([]);
                expect(room.inputQueue.get('socket456')).toEqual([]);
            });
        });
        
        describe('startGameLoop', () => {
            it('should start game loop at 60Hz', () => {
                room.initializeGameState();
                room.startGameLoop();
                
                expect(room.gameLoopInterval).toBeDefined();
                expect(room.frameNumber).toBe(0);
            });
            
            it('should clear existing interval before starting new one', () => {
                room.initializeGameState();
                room.startGameLoop();
                const firstInterval = room.gameLoopInterval;
                
                room.startGameLoop();
                expect(room.gameLoopInterval).not.toBe(firstInterval);
            });
        });
        
        describe('stopGameLoop', () => {
            it('should stop game loop', () => {
                room.initializeGameState();
                room.startGameLoop();
                
                room.stopGameLoop();
                expect(room.gameLoopInterval).toBeNull();
            });
        });
        
        describe('updateGameState', () => {
            beforeEach(() => {
                room.initializeGameState();
                room.status = 'playing';
            });
            
            it('should update frame number', () => {
                const initialFrame = room.frameNumber;
                room.updateGameState();
                expect(room.frameNumber).toBe(initialFrame + 1);
            });
            
            it('should move players based on direction', () => {
                const player1 = room.gameState.players[mockSocket.id];
                const initialX = player1.position.x;
                const initialZ = player1.position.z;
                
                room.updateGameState();
                
                const newX = player1.position.x;
                const newZ = player1.position.z;
                
                // Position should have changed
                expect(newX !== initialX || newZ !== initialZ).toBe(true);
            });
            
            it('should add to player trails', () => {
                const player1 = room.gameState.players[mockSocket.id];
                const initialTrailLength = player1.trail.length;
                
                room.updateGameState();
                
                expect(player1.trail.length).toBe(initialTrailLength + 1);
            });
            
            it('should not update when not playing', () => {
                room.status = 'waiting';
                const initialFrame = room.frameNumber;
                
                room.updateGameState();
                
                expect(room.frameNumber).toBe(initialFrame);
            });
        });
        
        describe('handlePlayerInput', () => {
            beforeEach(() => {
                room.initializeGameState();
                room.status = 'playing';
            });
            
            it('should queue valid input', () => {
                room.handlePlayerInput(mockSocket.id, {
                    direction: 'up',
                    timestamp: Date.now(),
                    sequenceId: 1
                });
                
                const queue = room.inputQueue.get(mockSocket.id);
                expect(queue.length).toBe(1);
                expect(queue[0].direction).toEqual({ x: 0, y: 0, z: -1 });
            });
            
            it('should reject invalid direction', () => {
                room.handlePlayerInput(mockSocket.id, {
                    direction: 'invalid',
                    timestamp: Date.now(),
                    sequenceId: 1
                });
                
                const queue = room.inputQueue.get(mockSocket.id);
                expect(queue.length).toBe(0);
            });
            
            it('should limit queue size', () => {
                for (let i = 0; i < 15; i++) {
                    room.handlePlayerInput(mockSocket.id, {
                        direction: 'up',
                        timestamp: Date.now(),
                        sequenceId: i
                    });
                }
                
                const queue = room.inputQueue.get(mockSocket.id);
                expect(queue.length).toBeLessThanOrEqual(10);
            });
        });
        
        describe('parseDirection', () => {
            it('should parse up direction', () => {
                const dir = room.parseDirection('up');
                expect(dir).toEqual({ x: 0, y: 0, z: -1 });
            });
            
            it('should parse down direction', () => {
                const dir = room.parseDirection('down');
                expect(dir).toEqual({ x: 0, y: 0, z: 1 });
            });
            
            it('should parse left direction', () => {
                const dir = room.parseDirection('left');
                expect(dir).toEqual({ x: -1, y: 0, z: 0 });
            });
            
            it('should parse right direction', () => {
                const dir = room.parseDirection('right');
                expect(dir).toEqual({ x: 1, y: 0, z: 0 });
            });
            
            it('should return null for invalid direction', () => {
                const dir = room.parseDirection('invalid');
                expect(dir).toBeNull();
            });
        });
        
        describe('validateDirectionChange', () => {
            it('should allow perpendicular direction change', () => {
                const current = { x: 1, y: 0, z: 0 };
                const newDir = { x: 0, y: 0, z: 1 };
                expect(room.validateDirectionChange(current, newDir)).toBe(true);
            });
            
            it('should reject 180-degree turn on x-axis', () => {
                const current = { x: 1, y: 0, z: 0 };
                const newDir = { x: -1, y: 0, z: 0 };
                expect(room.validateDirectionChange(current, newDir)).toBe(false);
            });
            
            it('should reject 180-degree turn on z-axis', () => {
                const current = { x: 0, y: 0, z: 1 };
                const newDir = { x: 0, y: 0, z: -1 };
                expect(room.validateDirectionChange(current, newDir)).toBe(false);
            });
        });
        
        describe('checkCollisions', () => {
            beforeEach(() => {
                room.initializeGameState();
            });
            
            it('should detect boundary collision', () => {
                const player1 = room.gameState.players[mockSocket.id];
                player1.position.x = 100; // Outside bounds
                
                room.checkCollisions();
                
                expect(player1.isAlive).toBe(false);
            });
            
            it('should detect trail collision', () => {
                const player1 = room.gameState.players[mockSocket.id];
                
                // Create a trail
                for (let i = 0; i < 20; i++) {
                    player1.trail.push({ x: i, y: 0, z: 0 });
                }
                
                // Move player to collide with trail
                player1.position = { x: 10, y: 0, z: 0 };
                
                room.checkCollisions();
                
                expect(player1.isAlive).toBe(false);
            });
            
            it('should respect grace period for own trail', () => {
                const player1 = room.gameState.players[mockSocket.id];
                
                // Create a short trail (within grace period)
                for (let i = 0; i < 5; i++) {
                    player1.trail.push({ x: i, y: 0, z: 0 });
                }
                
                // Move player to collide with own trail
                player1.position = { x: 2, y: 0, z: 0 };
                
                room.checkCollisions();
                
                expect(player1.isAlive).toBe(true);
            });
        });
        
        describe('checkWinCondition', () => {
            beforeEach(() => {
                room.initializeGameState();
            });
            
            it('should detect winner when one player alive', () => {
                const player1 = room.gameState.players[mockSocket.id];
                const player2 = room.gameState.players['socket456'];
                
                player2.isAlive = false;
                
                room.checkWinCondition();
                
                expect(room.gameState.gamePhase).toBe('ended');
                expect(room.gameState.winner).toBe(mockSocket.id);
            });
            
            it('should handle tie when no players alive', () => {
                const player1 = room.gameState.players[mockSocket.id];
                const player2 = room.gameState.players['socket456'];
                
                player1.isAlive = false;
                player2.isAlive = false;
                
                room.checkWinCondition();
                
                expect(room.gameState.gamePhase).toBe('ended');
                expect(room.gameState.winner).toBeNull();
            });
        });
        
        describe('broadcastGameState', () => {
            beforeEach(() => {
                room.initializeGameState();
                mockIo.emit.mockClear();
            });
            
            it('should broadcast game state to room', () => {
                room.broadcastGameState();
                
                expect(mockIo.to).toHaveBeenCalledWith('ROOM01');
                expect(mockIo.emit).toHaveBeenCalledWith('gameState', expect.any(Object));
            });
            
            it('should include player data in broadcast', () => {
                room.broadcastGameState();
                
                const broadcastData = mockIo.emit.mock.calls[0][1];
                expect(broadcastData.players).toBeDefined();
                expect(Object.keys(broadcastData.players).length).toBe(2);
            });
            
            it('should limit trail segments in broadcast', () => {
                const player1 = room.gameState.players[mockSocket.id];
                
                // Create long trail
                for (let i = 0; i < 100; i++) {
                    player1.trail.push({ x: i, y: 0, z: 0 });
                }
                
                room.broadcastGameState();
                
                const broadcastData = mockIo.emit.mock.calls[0][1];
                const broadcastPlayer = broadcastData.players[mockSocket.id];
                expect(broadcastPlayer.trail.length).toBeLessThanOrEqual(50);
            });
        });
    });
});
