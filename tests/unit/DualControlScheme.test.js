const { DualControlScheme } = require('@/utils/DualControlScheme.js');

describe('DualControlScheme', () => {
    let dualControls;
    
    beforeEach(() => {
        dualControls = new DualControlScheme();
    });
    
    describe('constructor', () => {
        it('should initialize with correct control mappings', () => {
            expect(dualControls.player1Controls).toEqual({
                up: 'ArrowUp',
                down: 'ArrowDown',
                left: 'ArrowLeft',
                right: 'ArrowRight'
            });
            
            expect(dualControls.player2Controls).toEqual({
                up: 'KeyW',
                down: 'KeyS',
                left: 'KeyA',
                right: 'KeyD'
            });
        });
        
        it('should initialize with empty active keys set', () => {
            expect(dualControls.activeKeys.size).toBe(0);
        });
        
        it('should initialize player states correctly', () => {
            expect(dualControls.player1State).toEqual({
                activeDirection: null,
                pendingDirection: null,
                lastInputTime: 0
            });
            
            expect(dualControls.player2State).toEqual({
                activeDirection: null,
                pendingDirection: null,
                lastInputTime: 0
            });
        });
    });
    
    describe('getPlayerIdForKey', () => {
        it('should return P1 for arrow keys', () => {
            expect(dualControls.getPlayerIdForKey('ArrowUp')).toBe('P1');
            expect(dualControls.getPlayerIdForKey('ArrowDown')).toBe('P1');
            expect(dualControls.getPlayerIdForKey('ArrowLeft')).toBe('P1');
            expect(dualControls.getPlayerIdForKey('ArrowRight')).toBe('P1');
        });
        
        it('should return P2 for WASD keys', () => {
            expect(dualControls.getPlayerIdForKey('KeyW')).toBe('P2');
            expect(dualControls.getPlayerIdForKey('KeyS')).toBe('P2');
            expect(dualControls.getPlayerIdForKey('KeyA')).toBe('P2');
            expect(dualControls.getPlayerIdForKey('KeyD')).toBe('P2');
        });
        
        it('should return null for non-player keys', () => {
            expect(dualControls.getPlayerIdForKey('KeyX')).toBe(null);
            expect(dualControls.getPlayerIdForKey('Space')).toBe(null);
            expect(dualControls.getPlayerIdForKey('Enter')).toBe(null);
        });
    });
    
    describe('handleKeyDown', () => {
        it('should handle Player 1 key down events', () => {
            const mockEvent = { code: 'ArrowUp' };
            const result = dualControls.handleKeyDown(mockEvent);
            
            expect(result.playerId).toBe('P1');
            expect(result.directionChanged).toBe(true);
            expect(result.key).toBe('ArrowUp');
            expect(result.newDirection).toEqual({ x: 0, y: 0, z: -1 });
            expect(dualControls.activeKeys.has('ArrowUp')).toBe(true);
        });
        
        it('should handle Player 2 key down events', () => {
            const mockEvent = { code: 'KeyW' };
            const result = dualControls.handleKeyDown(mockEvent);
            
            expect(result.playerId).toBe('P2');
            expect(result.directionChanged).toBe(true);
            expect(result.key).toBe('KeyW');
            expect(result.newDirection).toEqual({ x: 0, y: 0, z: -1 });
            expect(dualControls.activeKeys.has('KeyW')).toBe(true);
        });
        
        it('should handle non-player keys gracefully', () => {
            const mockEvent = { code: 'KeyX' };
            const result = dualControls.handleKeyDown(mockEvent);
            
            expect(result.playerId).toBe(null);
            expect(result.directionChanged).toBe(false);
            expect(result.key).toBe('KeyX');
            expect(dualControls.activeKeys.has('KeyX')).toBe(true);
        });
        
        it('should update player state with pending direction', () => {
            const mockEvent = { code: 'ArrowRight' };
            dualControls.handleKeyDown(mockEvent);
            
            expect(dualControls.player1State.pendingDirection).toEqual({ x: 1, y: 0, z: 0 });
            expect(dualControls.player1State.lastInputTime).toBeGreaterThan(0);
        });
        
        it('should handle simultaneous key presses from both players', () => {
            const p1Event = { code: 'ArrowUp' };
            const p2Event = { code: 'KeyW' };
            
            const result1 = dualControls.handleKeyDown(p1Event);
            const result2 = dualControls.handleKeyDown(p2Event);
            
            expect(result1.playerId).toBe('P1');
            expect(result2.playerId).toBe('P2');
            expect(dualControls.activeKeys.has('ArrowUp')).toBe(true);
            expect(dualControls.activeKeys.has('KeyW')).toBe(true);
        });
    });
    
    describe('handleKeyUp', () => {
        it('should remove key from active keys set', () => {
            const downEvent = { code: 'ArrowUp' };
            const upEvent = { code: 'ArrowUp' };
            
            dualControls.handleKeyDown(downEvent);
            expect(dualControls.activeKeys.has('ArrowUp')).toBe(true);
            
            dualControls.handleKeyUp(upEvent);
            expect(dualControls.activeKeys.has('ArrowUp')).toBe(false);
        });
        
        it('should handle multiple key releases', () => {
            dualControls.handleKeyDown({ code: 'ArrowUp' });
            dualControls.handleKeyDown({ code: 'KeyW' });
            
            expect(dualControls.activeKeys.size).toBe(2);
            
            dualControls.handleKeyUp({ code: 'ArrowUp' });
            expect(dualControls.activeKeys.size).toBe(1);
            expect(dualControls.activeKeys.has('KeyW')).toBe(true);
            
            dualControls.handleKeyUp({ code: 'KeyW' });
            expect(dualControls.activeKeys.size).toBe(0);
        });
    });
    
    describe('validateDirectionChange', () => {
        it('should allow initial direction setting', () => {
            const result = dualControls.validateDirectionChange('P1', null, { x: 0, y: 0, z: -1 });
            expect(result).toBe(true);
        });
        
        it('should allow valid direction changes', () => {
            const currentDirection = { x: 0, y: 0, z: -1 }; // Moving up
            const newDirection = { x: 1, y: 0, z: 0 }; // Turn right
            
            const result = dualControls.validateDirectionChange('P1', currentDirection, newDirection);
            expect(result).toBe(true);
        });
        
        it('should prevent 180-degree reversals', () => {
            const currentDirection = { x: 1, y: 0, z: 0 }; // Moving right
            const newDirection = { x: -1, y: 0, z: 0 }; // Try to move left (180° reversal)
            
            const result = dualControls.validateDirectionChange('P1', currentDirection, newDirection);
            expect(result).toBe(false);
        });
        
        it('should prevent vertical 180-degree reversals', () => {
            const currentDirection = { x: 0, y: 0, z: 1 }; // Moving down
            const newDirection = { x: 0, y: 0, z: -1 }; // Try to move up (180° reversal)
            
            const result = dualControls.validateDirectionChange('P2', currentDirection, newDirection);
            expect(result).toBe(false);
        });
    });
    
    describe('preventConflicts', () => {
        it('should process single player input', () => {
            dualControls.player1State.pendingDirection = { x: 0, y: 0, z: -1 };
            
            const result = dualControls.preventConflicts();
            
            expect(result.player1.hasInput).toBe(true);
            expect(result.player1.direction).toEqual({ x: 0, y: 0, z: -1 });
            expect(result.player2.hasInput).toBe(false);
            expect(result.simultaneousInput).toBe(false);
        });
        
        it('should process simultaneous input from both players', () => {
            dualControls.player1State.pendingDirection = { x: 0, y: 0, z: -1 };
            dualControls.player2State.pendingDirection = { x: 1, y: 0, z: 0 };
            
            const result = dualControls.preventConflicts();
            
            expect(result.player1.hasInput).toBe(true);
            expect(result.player1.direction).toEqual({ x: 0, y: 0, z: -1 });
            expect(result.player2.hasInput).toBe(true);
            expect(result.player2.direction).toEqual({ x: 1, y: 0, z: 0 });
            expect(result.simultaneousInput).toBe(true);
        });
        
        it('should clear pending directions after processing', () => {
            dualControls.player1State.pendingDirection = { x: 0, y: 0, z: -1 };
            dualControls.player2State.pendingDirection = { x: 1, y: 0, z: 0 };
            
            dualControls.preventConflicts();
            
            expect(dualControls.player1State.pendingDirection).toBe(null);
            expect(dualControls.player2State.pendingDirection).toBe(null);
        });
        
        it('should update active directions', () => {
            dualControls.player1State.pendingDirection = { x: 0, y: 0, z: -1 };
            
            dualControls.preventConflicts();
            
            expect(dualControls.player1State.activeDirection).toEqual({ x: 0, y: 0, z: -1 });
        });
    });
    
    describe('utility methods', () => {
        it('should check if key is pressed', () => {
            dualControls.handleKeyDown({ code: 'ArrowUp' });
            
            expect(dualControls.isKeyPressed('ArrowUp')).toBe(true);
            expect(dualControls.isKeyPressed('ArrowDown')).toBe(false);
        });
        
        it('should return active keys set', () => {
            dualControls.handleKeyDown({ code: 'ArrowUp' });
            dualControls.handleKeyDown({ code: 'KeyW' });
            
            const activeKeys = dualControls.getActiveKeys();
            expect(activeKeys.has('ArrowUp')).toBe(true);
            expect(activeKeys.has('KeyW')).toBe(true);
            expect(activeKeys.size).toBe(2);
        });
        
        it('should get player directions', () => {
            dualControls.player1State.activeDirection = { x: 0, y: 0, z: -1 };
            dualControls.player2State.activeDirection = { x: 1, y: 0, z: 0 };
            
            const directions = dualControls.getPlayerDirections();
            
            expect(directions.player1).toEqual({ x: 0, y: 0, z: -1 });
            expect(directions.player2).toEqual({ x: 1, y: 0, z: 0 });
        });
        
        it('should reset input state', () => {
            dualControls.handleKeyDown({ code: 'ArrowUp' });
            dualControls.player1State.activeDirection = { x: 0, y: 0, z: -1 };
            
            dualControls.reset();
            
            expect(dualControls.activeKeys.size).toBe(0);
            expect(dualControls.player1State.activeDirection).toBe(null);
            expect(dualControls.player1State.pendingDirection).toBe(null);
            expect(dualControls.player2State.activeDirection).toBe(null);
            expect(dualControls.player2State.pendingDirection).toBe(null);
        });
        
        it('should provide input state for debugging', () => {
            dualControls.handleKeyDown({ code: 'ArrowUp' });
            dualControls.player1State.pendingDirection = { x: 0, y: 0, z: -1 };
            dualControls.player2State.pendingDirection = { x: 1, y: 0, z: 0 };
            
            const inputState = dualControls.getInputState();
            
            expect(inputState.activeKeys).toContain('ArrowUp');
            expect(inputState.player1State.pendingDirection).toEqual({ x: 0, y: 0, z: -1 });
            expect(inputState.player2State.pendingDirection).toEqual({ x: 1, y: 0, z: 0 });
            expect(inputState.simultaneousInput).toBe(true);
        });
    });
    
    describe('direction mappings', () => {
        it('should have correct direction mappings for all keys', () => {
            expect(dualControls.directionMappings['ArrowUp']).toEqual({ x: 0, y: 0, z: -1 });
            expect(dualControls.directionMappings['ArrowDown']).toEqual({ x: 0, y: 0, z: 1 });
            expect(dualControls.directionMappings['ArrowLeft']).toEqual({ x: -1, y: 0, z: 0 });
            expect(dualControls.directionMappings['ArrowRight']).toEqual({ x: 1, y: 0, z: 0 });
            
            expect(dualControls.directionMappings['KeyW']).toEqual({ x: 0, y: 0, z: -1 });
            expect(dualControls.directionMappings['KeyS']).toEqual({ x: 0, y: 0, z: 1 });
            expect(dualControls.directionMappings['KeyA']).toEqual({ x: -1, y: 0, z: 0 });
            expect(dualControls.directionMappings['KeyD']).toEqual({ x: 1, y: 0, z: 0 });
        });
    });
});