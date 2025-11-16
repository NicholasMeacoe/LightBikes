const { GameRoom } = require('./server/GameRoom');
const { AntiCheatValidator } = require('./server/AntiCheatValidator');
const { ClientPrediction } = require('./ClientPrediction');
const { LatencyCompensation } = require('./LatencyCompensation');

describe('Online Multiplayer Component Integration', () => {
    describe('GameRoom Multi-Player Management', () => {
        let mockIo, mockSocket1, mockSocket2;
        
        beforeEach(() => {
            mockIo = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
            mockSocket1 = { id: 'socket1', join: jest.fn(), leave: jest.fn(), on: jest.fn(), emit: jest.fn() };
            mockSocket2 = { id: 'socket2', join: jest.fn(), leave: jest.fn(), on: jest.fn(), emit: jest.fn() };
        });
        
        it('should handle complete multiplayer game flow', () => {
            const room = new GameRoom('ROOM01', { maxPlayers: 2, gameMode: 'classic' }, mockIo);
            
            room.addPlayer(mockSocket1, { name: 'Player1', isHost: true });
            room.addPlayer(mockSocket2, { name: 'Player2', isHost: false });
            expect(room.players.size).toBe(2);
            
            room.handleSetReady(mockSocket1.id, true);
            room.handleSetReady(mockSocket2.id, true);
            expect(room.areAllPlayersReady()).toBe(true);
            
            room.initializeGameState();
            expect(room.gameState).toBeDefined();
            
            room.status = 'playing';
            for (let i = 0; i < 10; i++) {
                room.updateGameState();
            }
            expect(room.frameNumber).toBe(10);
        });
    });
    
    describe('AntiCheat Integration', () => {
        let room, validator, mockIo, mockSocket;
        
        beforeEach(() => {
            mockIo = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
            mockSocket = { id: 'socket1', join: jest.fn(), leave: jest.fn(), on: jest.fn(), emit: jest.fn() };
            
            room = new GameRoom('ROOM01', { maxPlayers: 2 }, mockIo);
            room.addPlayer(mockSocket, { name: 'Player1', isHost: true });
            room.initializeGameState();
            
            validator = new AntiCheatValidator(room);
        });
        
        it('should validate movements', () => {
            const player = room.gameState.players[mockSocket.id];
            const newPos = { x: player.position.x + 0.1, y: player.position.y, z: player.position.z };
            
            const result = validator.validatePosition(mockSocket.id, newPos, Date.now());
            expect(result.valid).toBe(true);
        });
        
        it('should detect teleportation', () => {
            const player = room.gameState.players[mockSocket.id];
            const teleportPos = { x: player.position.x + 10, y: player.position.y, z: player.position.z + 10 };
            
            const result = validator.validatePosition(mockSocket.id, teleportPos, Date.now());
            expect(result.valid).toBe(false);
            expect(result.violation).toBe('teleportation');
        });
    });
    
    describe('Client Prediction', () => {
        let mockGameInstance, clientPrediction;
        
        beforeEach(() => {
            mockGameInstance = {
                player: { position: { x: 0, y: 0, z: 0 }, direction: { x: 1, y: 0, z: 0 }, trail: [] },
                frameCount: 0
            };
            clientPrediction = new ClientPrediction(mockGameInstance);
        });
        
        it('should predict and reconcile', () => {
            for (let i = 0; i < 5; i++) {
                const input = { direction: { x: 1, y: 0, z: 0 }, timestamp: Date.now() + i * 16 };
                clientPrediction.applyInput(input, input.timestamp);
            }
            
            const serverState = { position: { x: 0.5, y: 0, z: 0 }, direction: { x: 1, y: 0, z: 0 }, timestamp: Date.now() };
            clientPrediction.reconcileWithServer(serverState, serverState.timestamp);
            expect(mockGameInstance.player.position.x).toBeCloseTo(0.5, 1);
        });
    });
    
    describe('Latency Compensation', () => {
        let latencyComp;
        
        beforeEach(() => {
            latencyComp = new LatencyCompensation();
        });
        
        it('should interpolate states', () => {
            const state1 = {
                players: { 'p1': { position: { x: 0, y: 0, z: 0 }, direction: { x: 1, y: 0, z: 0 } } },
                timestamp: Date.now()
            };
            
            const state2 = {
                players: { 'p1': { position: { x: 1, y: 0, z: 0 }, direction: { x: 1, y: 0, z: 0 } } },
                timestamp: Date.now() + 100
            };
            
            latencyComp.addStateUpdate(state1);
            latencyComp.addStateUpdate(state2);
            
            const interpolated = latencyComp.getInterpolatedState(0.5);
            expect(interpolated).toBeDefined();
            expect(interpolated.players['p1'].position.x).toBeGreaterThan(0);
            expect(interpolated.players['p1'].position.x).toBeLessThan(1);
        });
    });
});
