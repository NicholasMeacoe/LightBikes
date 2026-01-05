# Local 2-Player Mode Design

## Overview

The Local 2-Player Mode extends the existing LightBikes game to support simultaneous competitive play between two human players on the same device. This feature transforms the single-player vs AI experience into a head-to-head local multiplayer game while maintaining the core gameplay mechanics and visual appeal.

The design leverages the existing modular architecture by extending key components rather than replacing them, ensuring compatibility with existing features like arena shrink mode, pause functionality, and customization systems.

## Architecture

### High-Level Architecture

The local multiplayer system extends the existing architecture through these key modifications:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   script.js     │    │   controls.js    │    │   game.js       │
│  (Orchestrator) │◄──►│ (Dual Controls)  │◄──►│ (Dual Players)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   renderer.js   │    │  collision.js    │    │   scoring.js    │
│ (Split Camera)  │    │(Player vs Player)│    │ (Local Scoring) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Component Extensions

**Game State Management**: The `Game` class will be extended to manage two `Player_Entity` objects instead of one player and one AI entity.

**Input System**: The `controls.js` module will be enhanced to handle simultaneous input from two separate control schemes without conflicts.

**Rendering System**: The `renderer.js` will implement a `Split_Screen_Camera` system that dynamically adjusts to keep both players visible.

**Collision Detection**: The `collision.js` module will be extended to handle player-vs-player collision scenarios.

## Components and Interfaces

### 1. Dual Player Management

**MultiplayerGame Class** (extends Game)
```javascript
class MultiplayerGame extends Game {
    constructor() {
        this.player1 = new PlayerEntity('P1', 'green', startPos1);
        this.player2 = new PlayerEntity('P2', 'blue', startPos2);
        this.localScoring = new LocalScoring();
        this.gameMode = 'local-multiplayer';
    }
    
    // Core methods
    updatePlayers()
    checkPlayerCollisions()
    handleGameOver(winner)
    resetForNewRound()
}
```

**Design Rationale**: Extending the existing Game class maintains compatibility with existing systems while adding multiplayer-specific functionality. The PlayerEntity abstraction allows consistent handling of both players.

### 2. Dual Control System

**DualControlScheme Class**
```javascript
class DualControlScheme {
    constructor() {
        this.player1Controls = {
            up: 'ArrowUp', down: 'ArrowDown', 
            left: 'ArrowLeft', right: 'ArrowRight'
        };
        this.player2Controls = {
            up: 'KeyW', down: 'KeyS', 
            left: 'KeyA', right: 'KeyD'
        };
        this.activeKeys = new Set();
    }
    
    // Core methods
    handleKeyDown(event)
    handleKeyUp(event)
    getPlayerDirections()
    preventConflicts()
}
```

**Design Rationale**: Separate control schemes prevent input conflicts and allow simultaneous input processing. The activeKeys Set ensures proper key state tracking for both players.

### 3. Split Screen Camera System

**SplitScreenCamera Class**
```javascript
class SplitScreenCamera {
    constructor(camera, player1, player2) {
        this.camera = camera;
        this.players = [player1, player2];
        this.minZoom = 20;
        this.maxZoom = 50;
    }
    
    // Core methods
    updateCameraPosition()
    calculateOptimalZoom()
    getCenterPoint()
    ensureBothPlayersVisible()
}
```

**Design Rationale**: The camera system calculates the midpoint between players and adjusts zoom dynamically to maintain visibility. This ensures fair gameplay without giving either player a positional advantage.

### 4. Player vs Player Collision

**PlayerCollisionHandler Class**
```javascript
class PlayerCollisionHandler extends CollisionDetector {
    constructor() {
        super();
        this.collisionGracePeriod = 10; // frames
    }
    
    // Core methods
    checkPlayerVsPlayer(player1, player2)
    checkPlayerVsTrail(player, opponent)
    determineCollisionWinner(collision)
    handleSimultaneousCollision()
}
```

**Design Rationale**: Extends existing collision detection to handle player-vs-player scenarios while maintaining the same accuracy and grace periods as AI games.

### 5. Local Scoring System

**LocalScoring Class**
```javascript
class LocalScoring {
    constructor() {
        this.player1Wins = 0;
        this.player2Wins = 0;
        this.currentRound = 1;
    }
    
    // Core methods
    incrementScore(playerId)
    getScoreDisplay()
    resetScores()
    handleTieGame()
}
```

**Design Rationale**: Simple win-based scoring system that tracks competitive performance across multiple rounds.

## Data Models

### Player Entity Model
```javascript
const PlayerEntity = {
    id: 'P1' | 'P2',
    color: 'green' | 'blue',
    position: { x: number, y: number, z: number },
    direction: { x: number, y: number, z: number },
    trail: Array<TrailSegment>,
    isAlive: boolean,
    controlScheme: ControlMapping,
    customization: PlayerCustomization
};
```

### Game State Model (Extended)
```javascript
const MultiplayerGameState = {
    ...existingGameState,
    gameMode: 'local-multiplayer',
    players: [PlayerEntity, PlayerEntity],
    localScoring: {
        player1Wins: number,
        player2Wins: number,
        currentRound: number
    },
    camera: {
        position: Vector3,
        zoom: number,
        followMode: 'split-screen'
    }
};
```

### Control Input Model
```javascript
const DualInputState = {
    player1: {
        activeDirection: Direction,
        pendingDirection: Direction | null,
        lastInputTime: number
    },
    player2: {
        activeDirection: Direction,
        pendingDirection: Direction | null,
        lastInputTime: number
    },
    simultaneousInput: boolean
};
```

## Error Handling

### Input Conflict Resolution
- **Simultaneous Key Presses**: Process both inputs independently using separate key state tracking
- **Invalid Direction Changes**: Apply 180-degree reversal prevention to both players individually
- **Control Scheme Conflicts**: Ensure no overlap between Player 1 and Player 2 key mappings

### Camera Edge Cases
- **Players at Opposite Boundaries**: Implement maximum zoom-out limit to maintain playability
- **Rapid Player Movement**: Use smooth camera interpolation to prevent disorientation
- **Arena Boundary Handling**: Ensure camera never moves outside arena bounds

### Collision Edge Cases
- **Simultaneous Crashes**: Implement tie-game logic that awards no points to either player
- **Grace Period Overlaps**: Handle cases where both players are in grace period during collision
- **Trail Intersection Timing**: Use frame-accurate collision detection to determine collision order

### Game State Management
- **Mid-Game Mode Switching**: Prevent mode changes during active gameplay
- **Restart During Collision**: Ensure clean state reset when restart is triggered during collision detection
- **Score Persistence**: Maintain scores across game restarts until explicitly reset

## Testing Strategy

### Unit Testing Approach

**Component-Level Tests**
- `MultiplayerGame` class: Player management, collision handling, game state transitions
- `DualControlScheme` class: Input processing, conflict resolution, direction validation
- `SplitScreenCamera` class: Position calculation, zoom adjustment, visibility algorithms
- `LocalScoring` class: Score tracking, tie handling, reset functionality

**Integration Testing**
- Player vs Player collision scenarios
- Simultaneous input processing
- Camera behavior with rapid player movement
- Score persistence across game rounds

**Edge Case Testing**
- Simultaneous crashes and tie conditions
- Players at maximum distance apart
- Rapid direction changes from both players
- Integration with existing features (pause, arena shrink, customization)

### Test Coverage Requirements
- Maintain existing 95%+ statement coverage
- Add comprehensive test cases for all new multiplayer functionality
- Include performance tests for simultaneous input processing
- Test compatibility with existing game modes and features

### Manual Testing Scenarios
- Two-player competitive gameplay sessions
- Control responsiveness during intense gameplay
- Camera behavior validation across different play styles
- Visual distinction clarity under various arena themes

## Performance Considerations

### Rendering Optimization
- **Dual Trail Rendering**: Optimize trail segment rendering for two players without performance degradation
- **Camera Updates**: Minimize camera position recalculations using efficient distance algorithms
- **Collision Detection**: Maintain 60fps performance with additional player-vs-player collision checks

### Memory Management
- **Trail Segment Pooling**: Extend existing trail management to handle two players efficiently
- **Input State Tracking**: Use efficient data structures for dual input state management
- **Camera Interpolation**: Implement smooth camera movement without excessive memory allocation

### Scalability Considerations
- **Future Multiplayer Modes**: Design architecture to support potential 3+ player modes
- **Network Multiplayer Foundation**: Structure local multiplayer to facilitate future online multiplayer development
- **Mobile Performance**: Ensure dual-player mode maintains performance on mobile devices

## Integration Points

### Existing Feature Compatibility

**Arena Shrink Mode Integration**
- Apply arena shrinking equally to both players
- Maintain fair gameplay as arena reduces in size
- Ensure camera system adapts to shrinking boundaries

**Pause Functionality Integration**
- Pause affects both players simultaneously
- Maintain input state during pause/resume cycles
- Preserve camera position and zoom during pause

**Customization System Integration**
- Allow independent customization for both players
- Maintain visual distinction while supporting customization
- Persist customization settings across game sessions

**Sound Effects Integration**
- Trigger appropriate sound effects for both players
- Handle simultaneous sound events without audio conflicts
- Maintain audio clarity during intense gameplay

### Future Extension Points
- **Tournament Mode**: Framework for best-of-N series
- **Spectator Features**: Camera modes for watching gameplay
- **Replay System**: Record and playback multiplayer matches
- **Online Multiplayer**: Network layer for remote competitive play