# LightBikes - Technical Architecture Design

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Patterns](#architecture-patterns)
3. [Component Diagram](#component-diagram)
4. [Core Components](#core-components)
5. [Data Models](#data-models)
6. [Interfaces & APIs](#interfaces--apis)
7. [Data Flow](#data-flow)
8. [Module Dependencies](#module-dependencies)
9. [Design Decisions](#design-decisions)
10. [Extension Points](#extension-points)

---

## System Overview

LightBikes is a browser-based 3D game built using a modular, component-based architecture. The system separates concerns into distinct modules for game logic, AI, collision detection, rendering, and input handling.

### Technology Stack
- **Runtime**: Browser (ES6+)
- **Graphics**: Three.js (WebGL)
- **Build Tool**: Browserify
- **Testing**: Jest
- **Module System**: CommonJS (Node.js style)

---

## Architecture Patterns

### 1. **Separation of Concerns (SoC)**
Each module has a single, well-defined responsibility:
- Game logic separate from rendering
- AI logic isolated from game state
- Collision detection as independent engine
- Input handling decoupled from game logic

### 2. **Entity-Component Pattern**
Game entities (player, AI) are represented as data objects with associated controllers:
- `Game` manages entity state
- Controllers (`AIController`, `PlayerController`) handle behavior
- `RenderingEngine` handles visual representation

### 3. **Game Loop Pattern**
Central animation loop coordinates all systems:
```
Input → AI Decision → Game Update → Collision Check → Render → Repeat
```

### 4. **Dependency Injection**
Components receive dependencies through constructors:
```javascript
const playerController = new PlayerController(game);
const renderingEngine = new RenderingEngine(game.bounds);
```

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        script.js                             │
│                   (Main Orchestrator)                        │
└────────┬────────────────────────────────────────────────────┘
         │
         ├──────────────┬──────────────┬──────────────┬────────────────┐
         │              │              │              │                │
         ▼              ▼              ▼              ▼                ▼
    ┌────────┐    ┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌──────────┐
    │  Game  │    │    AI    │  │Collision │  │   Renderer   │  │ Controls │
    │        │    │Controller│  │  Engine  │  │              │  │          │
    └────────┘    └──────────┘  └──────────┘  └──────────────┘  └──────────┘
         │              │              │              │                │
         │              │              │              │                │
         └──────────────┴──────────────┴──────────────┴────────────────┘
                                      │
                                      ▼
                              ┌──────────────┐
                              │  Game State  │
                              │   (Data)     │
                              └──────────────┘
```

---

## Core Components

### 1. Game (`game.js`)

**Responsibility**: Core game state management and entity updates

**Class**: `Game`

**Properties**:
```javascript
{
    bounds: Number,           // Arena size (30)
    gameOver: Boolean,        // Game state flag
    frameCount: Number,       // Frame counter
    player: Position,         // Player position
    playerDirection: Vector,  // Player movement direction
    playerTrail: Position[],  // Player trail history
    ai: Position,            // AI position
    aiDirection: Vector,     // AI movement direction
    aiTrail: Position[]      // AI trail history
}
```

**Methods**:
- `constructor()` - Initialize game with default bounds
- `init()` - Reset game state to initial values
- `getGameState()` - Return current game state snapshot
- `update()` - Advance game by one frame (move entities, create trails)
- `changePlayerDirection(key: String)` - Update player direction based on input
- `restart()` - Reset game to initial state

**Design Notes**:
- Pure state management, no rendering or AI logic
- Immutable state snapshots via `getGameState()`
- Frame-based updates (0.1 units per frame)

---

### 2. AIController (`ai.js`)

**Responsibility**: AI decision-making and pathfinding

**Class**: `AIController`

**Properties**:
```javascript
{
    aiState: String,          // Current AI state ('DEFENSIVE')
    aiStateCooldown: Number   // Cooldown counter (unused in current impl)
}
```

**Methods**:
- `calculateAIDirection(gameState)` - Determine next AI direction
  - **Input**: Complete game state
  - **Output**: `{ newDirection: Vector, newState: String }`
  
- `runDefensiveCheck(gameState)` - Perform whisker-based obstacle detection
  - **Input**: Game state
  - **Output**: `{ forward: Number, left: Number, right: Number }`

**Algorithm**:
1. Cast three "whiskers" (forward, left, right) 20 units ahead
2. Detect obstacles: boundaries, player trail, old AI trail (>10 segments)
3. If forward < 10 units clear: Turn toward clearer side
4. Else: 2% chance of random turn for unpredictability

**Design Notes**:
- Stateless decision-making (state passed in, not stored)
- Whisker system provides lookahead capability
- Excludes recent trail (last 10 segments) to prevent self-collision panic

---

### 3. CollisionDetectionEngine (`collision.js`)

**Responsibility**: Detect collisions between entities and environment

**Class**: `CollisionDetectionEngine`

**Methods**:
- `checkCollisions(gameState)` - Check all collision types
  - **Input**: Game state
  - **Output**: `{ playerCollided: Boolean, aiCollided: Boolean }`
  
- `isCollided(bike, ownTrail, opponentTrail, bounds)` - Check single entity collision
  - **Input**: Entity position, trails, arena bounds
  - **Output**: Boolean

**Collision Types**:
1. **Boundary Collision**: Position ≤ -bounds or ≥ bounds
2. **Self Trail Collision**: Within 0.1 units of own trail (excluding last 5 segments)
3. **Opponent Trail Collision**: Within 0.1 units of any opponent trail segment

**Design Notes**:
- Grace period: No collision detection for first 10 frames
- Recent segment exclusion prevents immediate self-collision
- Tolerance of 0.1 units for trail collision detection

---

### 4. RenderingEngine (`renderer.js`)

**Responsibility**: 3D visualization using Three.js

**Class**: `RenderingEngine`

**Properties**:
```javascript
{
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    player: THREE.Mesh,      // Player 3D model
    ai: THREE.Mesh,          // AI 3D model
    playerTrail: Mesh[],     // Player trail segments
    aiTrail: Mesh[]          // AI trail segments
}
```

**Methods**:
- `constructor(bounds)` - Initialize Three.js scene, camera, lights, arena
- `draw(gameState)` - Render current game state
- `createTrailSegment(position, color, trail)` - Add new trail segment to scene
- `updateCamera(playerPosition)` - Position camera to follow player
- `clearTrails()` - Remove all trail segments from scene

**Scene Setup**:
- Background: Dark blue (0x000033)
- Lighting: Ambient (0.6) + Directional (0.8)
- Camera: Follows player at (x, 20, z+15)
- Arena: Grid helper + box outline

**Design Notes**:
- Incremental trail rendering (only new segments added)
- Camera follows player for dynamic viewpoint
- Separate trail colors: Green (player), Red (AI)

---

### 5. PlayerController (`controls.js`)

**Responsibility**: Handle player input

**Class**: `PlayerController`

**Properties**:
```javascript
{
    game: Game  // Reference to game instance
}
```

**Methods**:
- `constructor(game)` - Store game reference
- `init()` - Attach keyboard event listeners

**Input Mapping**:
- `ArrowUp` → Move forward (z: -1)
- `ArrowDown` → Move backward (z: +1)
- `ArrowLeft` → Move left (x: -1)
- `ArrowRight` → Move right (x: +1)

**Design Notes**:
- Delegates direction changes to `Game.changePlayerDirection()`
- Prevents 180° reversals (handled in Game class)

---

### 6. Main Orchestrator (`script.js`)

**Responsibility**: Initialize and coordinate all components

**Structure**:
```javascript
// 1. Component Initialization
const game = new Game();
const aiController = new AIController();
const collisionDetectionEngine = new CollisionDetectionEngine();
const playerController = new PlayerController(game);
const renderingEngine = new RenderingEngine(game.bounds);

// 2. Input Setup
playerController.init();
// Touch controls for mobile

// 3. Game Loop
function animate() {
    // AI decision
    // Game update
    // Collision check
    // Render
    // UI updates
}
```

**Design Notes**:
- Single point of integration
- Manages component lifecycle
- Coordinates data flow between modules

---

## Data Models

### Position
```typescript
interface Position {
    x: number;  // X coordinate
    y: number;  // Y coordinate (always 0 in current impl)
    z: number;  // Z coordinate
}
```

### Vector (Direction)
```typescript
interface Vector {
    x: number;  // X component (-1, 0, or 1)
    y: number;  // Y component (always 0)
    z: number;  // Z component (-1, 0, or 1)
}
```

### GameState
```typescript
interface GameState {
    bounds: number;
    player: Position;
    playerDirection: Vector;
    playerTrail: Position[];
    ai: Position;
    aiDirection: Vector;
    aiTrail: Position[];
    frameCount?: number;  // Optional, used by collision engine
}
```

### AIDecision
```typescript
interface AIDecision {
    newDirection: Vector;
    newState: string;  // 'DEFENSIVE', 'ATTACKING', 'RANDOM'
}
```

### WhiskerDistances
```typescript
interface WhiskerDistances {
    forward: number;  // Distance to obstacle ahead (0-20)
    left: number;     // Distance to obstacle on left (0-20)
    right: number;    // Distance to obstacle on right (0-20)
}
```

### CollisionResult
```typescript
interface CollisionResult {
    playerCollided: boolean;
    aiCollided: boolean;
}
```

---

## Interfaces & APIs

### Game API
```javascript
// Public Interface
class Game {
    constructor()
    init(): void
    getGameState(): GameState
    update(): void
    changePlayerDirection(key: string): void
    restart(): void
}
```

### AIController API
```javascript
class AIController {
    constructor()
    calculateAIDirection(gameState: GameState): AIDecision
    runDefensiveCheck(gameState: GameState): WhiskerDistances
}
```

### CollisionDetectionEngine API
```javascript
class CollisionDetectionEngine {
    checkCollisions(gameState: GameState): CollisionResult
    isCollided(
        bike: Position,
        ownTrail: Position[],
        opponentTrail: Position[],
        bounds: number
    ): boolean
}
```

### RenderingEngine API
```javascript
class RenderingEngine {
    constructor(bounds: number)
    draw(gameState: GameState): void
    createTrailSegment(position: Position, color: number, trail: Mesh[]): void
    updateCamera(playerPosition: Position): void
    clearTrails(): void
}
```

### PlayerController API
```javascript
class PlayerController {
    constructor(game: Game)
    init(): void
}
```

---

## Data Flow

### Frame Update Sequence

```
1. User Input
   └─> PlayerController.keydown event
       └─> Game.changePlayerDirection()

2. AI Decision
   └─> Game.getGameState()
       └─> AIController.calculateAIDirection()
           └─> AIController.runDefensiveCheck()
               └─> Returns new direction

3. Game Update
   └─> Game.update()
       ├─> Move player (position += direction * 0.1)
       ├─> Add player trail segment
       ├─> Move AI (position += direction * 0.1)
       └─> Add AI trail segment

4. Collision Detection
   └─> Game.getGameState()
       └─> CollisionDetectionEngine.checkCollisions()
           ├─> Check player collision
           ├─> Check AI collision
           └─> Returns collision result

5. Rendering
   └─> Game.getGameState()
       └─> RenderingEngine.draw()
           ├─> Update player/AI mesh positions
           ├─> Create new trail segments
           ├─> Update camera position
           └─> Render scene

6. UI Update
   └─> If gameOver: Show restart button
```

### State Management Flow

```
┌──────────────┐
│     Game     │ ◄─── Single source of truth
│    (State)   │
└──────┬───────┘
       │
       │ getGameState()
       ├──────────────────┬──────────────────┬──────────────────┐
       ▼                  ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│     AI      │    │  Collision  │    │  Renderer   │    │   Script    │
│ Controller  │    │   Engine    │    │             │    │  (Orchestr) │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │
       │ newDirection     │ collisionResult  │
       └──────────────────┴──────────────────┘
                          │
                          ▼
                    ┌──────────┐
                    │   Game   │
                    │ (Update) │
                    └──────────┘
```

---

## Module Dependencies

### Dependency Graph
```
script.js
├── game.js (no dependencies)
├── ai.js (no dependencies)
├── collision.js (no dependencies)
├── controls.js
│   └── game.js
└── renderer.js
    └── THREE.js (external)
```

### Import/Export Structure

**game.js**
```javascript
module.exports = { Game };
```

**ai.js**
```javascript
module.exports = { AIController };
```

**collision.js**
```javascript
module.exports = { CollisionDetectionEngine };
```

**controls.js**
```javascript
const { Game } = require('./game.js');
module.exports = { PlayerController };
```

**renderer.js**
```javascript
// THREE.js loaded via CDN in index.html
module.exports = { RenderingEngine };
```

**script.js**
```javascript
const { Game } = require('./game.js');
const { AIController } = require('./ai.js');
const { CollisionDetectionEngine } = require('./collision.js');
const { PlayerController } = require('./controls.js');
const { RenderingEngine } = require('./renderer.js');
```

---

## Design Decisions

### 1. **Why Separate Collision Detection?**
- **Testability**: Collision logic can be unit tested independently
- **Reusability**: Same engine can check player and AI collisions
- **Clarity**: Complex collision rules isolated from game logic
- **Performance**: Can be optimized or replaced without affecting other systems

### 2. **Why AIController as Separate Class?**
- **Modularity**: AI can be swapped or upgraded independently
- **Testing**: AI behavior can be tested in isolation
- **Multiple AIs**: Easy to instantiate multiple AI opponents
- **State Management**: AI state separate from game state

### 3. **Why RenderingEngine Manages Scene?**
- **Encapsulation**: Three.js complexity hidden from game logic
- **Flexibility**: Renderer can be replaced (e.g., Canvas 2D, WebGPU)
- **Performance**: Rendering optimizations contained in one place
- **Separation**: Game logic doesn't depend on graphics library

### 4. **Why Game State Snapshots?**
- **Immutability**: Components receive read-only state
- **Debugging**: Easy to log/inspect state at any point
- **Time Travel**: Could implement replay/undo features
- **Thread Safety**: Prevents race conditions (future multiplayer)

### 5. **Why Frame-Based Updates?**
- **Simplicity**: Easier to reason about than delta-time
- **Determinism**: Same input produces same output
- **Testing**: Predictable behavior for unit tests
- **Networking**: Frame-based easier to synchronize (future multiplayer)

---

## Extension Points

### 1. **Adding New AI Strategies**
```javascript
class AggressiveAI extends AIController {
    calculateAIDirection(gameState) {
        // Override with aggressive behavior
    }
}
```

### 2. **Custom Collision Rules**
```javascript
class PowerUpCollisionEngine extends CollisionDetectionEngine {
    checkCollisions(gameState) {
        const result = super.checkCollisions(gameState);
        // Add power-up collision checks
        return result;
    }
}
```

### 3. **Alternative Renderers**
```javascript
class Canvas2DRenderer {
    constructor(bounds) { /* ... */ }
    draw(gameState) { /* 2D rendering */ }
    clearTrails() { /* ... */ }
}
```

### 4. **Multiple Players**
```javascript
class Game {
    constructor(numPlayers) {
        this.players = Array(numPlayers).fill(null).map(() => ({
            position: { x: 0, y: 0, z: 0 },
            direction: { x: 1, y: 0, z: 0 },
            trail: []
        }));
    }
}
```

### 5. **Network Multiplayer**
```javascript
class NetworkController {
    constructor(game, socket) {
        this.game = game;
        this.socket = socket;
    }
    
    sendState() {
        this.socket.emit('gameState', this.game.getGameState());
    }
    
    receiveState(remoteState) {
        // Merge remote player state
    }
}
```

### 6. **Power-Up System**
```javascript
class PowerUpManager {
    constructor() {
        this.powerUps = [];
    }
    
    spawn(position, type) {
        this.powerUps.push({ position, type, active: true });
    }
    
    checkCollection(gameState) {
        // Check if player/AI collected power-up
    }
}
```

### 7. **Replay System**
```javascript
class ReplayRecorder {
    constructor() {
        this.frames = [];
    }
    
    record(gameState) {
        this.frames.push(JSON.parse(JSON.stringify(gameState)));
    }
    
    playback(frameIndex) {
        return this.frames[frameIndex];
    }
}
```

---

## Testing Strategy

### Unit Tests
- **game.test.js**: Game state management, movement, direction changes
- **ai.test.js**: AI decision-making, whisker detection
- **collision.test.js**: Boundary and trail collision detection

### Test Coverage
- Current: 96.42% statement coverage
- Target: Maintain >95% coverage for all modules

### Test Structure
```javascript
describe('ComponentName', () => {
    describe('methodName', () => {
        it('should handle specific case', () => {
            // Arrange
            // Act
            // Assert
        });
    });
});
```

---

## Build & Deployment

### Build Process
```bash
npm run build  # Browserify bundles all modules into bundle.js
```

### File Structure
```
LightBikes/
├── index.html          # Entry point
├── script.js           # Main orchestrator
├── game.js             # Game logic
├── ai.js               # AI controller
├── collision.js        # Collision detection
├── controls.js         # Input handling
├── renderer.js         # 3D rendering
├── bundle.js           # Built output (generated)
├── *.test.js           # Unit tests
├── package.json        # Dependencies
├── GAME_LOGIC.md       # Game mechanics documentation
└── DESIGN.md           # This file
```

### Deployment
1. Build bundle: `npm run build`
2. Serve static files (index.html, bundle.js)
3. Ensure Three.js CDN accessible

---

## Performance Considerations

### Current Optimizations
- Incremental trail rendering (only new segments)
- Recent trail exclusion in AI whisker checks
- Frame-based updates (no delta-time calculations)

### Future Optimizations
- Trail segment culling (remove distant segments)
- Object pooling for trail segments
- Spatial partitioning for collision detection
- Web Worker for AI calculations
- Instanced rendering for trails

---

## Security Considerations

### Current State
- Client-side only (no server communication)
- No user data storage
- No external API calls (except Three.js CDN)

### Future Considerations
- Input validation for multiplayer
- Anti-cheat for competitive play
- Rate limiting for network requests
- Secure WebSocket connections

---

## Conclusion

This modular architecture provides:
- **Maintainability**: Clear separation of concerns
- **Testability**: Each component independently testable
- **Extensibility**: Easy to add features without breaking existing code
- **Scalability**: Can grow to support multiplayer, power-ups, etc.
- **Readability**: Well-defined interfaces and data flow

The design follows SOLID principles and provides multiple extension points for future development while maintaining a clean, understandable codebase.
