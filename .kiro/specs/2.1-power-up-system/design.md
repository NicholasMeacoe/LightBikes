# Power-Up System Design

## Overview

The Power-Up System introduces collectible items that spawn throughout the arena, providing temporary abilities and strategic depth to LightBikes gameplay. The system maintains game balance while adding excitement through four distinct power-up types: Speed Boost, Shield, Trail Eraser, and Ghost Mode.

The design follows the existing modular architecture pattern, implementing the system as a separate `PowerUpManager` class that integrates cleanly with existing game components without disrupting core functionality.

## Architecture

### System Integration

The Power-Up System integrates with existing LightBikes components through well-defined interfaces:

```
PowerUpManager
├── Integrates with Game.js (state management)
├── Integrates with Collision.js (collection detection)
├── Integrates with Renderer.js (3D visualization)
├── Integrates with script.js (orchestration)
└── Provides StatusIndicator (UI feedback)
```

### Design Principles

1. **Separation of Concerns**: Power-up logic isolated in dedicated manager class
2. **Non-Intrusive Integration**: Minimal changes to existing core systems
3. **Balanced Gameplay**: Effects designed to enhance without breaking game balance
4. **Visual Clarity**: Distinct appearances and clear status indicators
5. **Performance Conscious**: Efficient spawning and cleanup mechanisms

## Components and Interfaces

### PowerUpManager Class

**Primary Responsibilities:**
- Spawn and manage power-up entities in the arena
- Handle collection detection and effect application
- Manage active effect timers and cleanup
- Coordinate with rendering system for visual feedback

**Key Methods:**
```javascript
class PowerUpManager {
    constructor(game, renderer, collisionDetector)
    update(deltaTime)                    // Main update loop
    spawnPowerUp()                      // Create new power-up entity
    checkCollections(playerPos, aiPos)   // Detect player-powerup collisions
    applyEffect(player, powerUpType)     // Apply power-up effect to player
    removeExpiredEffects()               // Clean up expired effects
    getActiveEffects(player)             // Get player's active effects
    reset()                             // Clear all power-ups and effects
}
```

**Integration Points:**
- **Game State Access**: Read player positions and modify player properties
- **Collision Detection**: Leverage existing collision system for collection detection
- **Rendering**: Register power-up entities for 3D rendering
- **Audio System**: Trigger sound effects for collections

### Power-Up Entity Structure

Each power-up entity contains:
```javascript
{
    id: string,              // Unique identifier
    type: string,            // 'speed', 'shield', 'eraser', 'ghost'
    position: {x, y, z},     // 3D world position
    appearance: object,      // Visual properties (color, shape, effects)
    spawnTime: number,       // Creation timestamp
    maxLifetime: 30000       // 30 seconds before auto-removal
}
```

### Effect System

Active effects are tracked per player:
```javascript
{
    playerId: string,
    effects: [
        {
            type: string,        // Effect type
            startTime: number,   // When effect was applied
            duration: number,    // Effect duration (-1 for permanent)
            data: object        // Effect-specific data
        }
    ]
}
```

## Data Models

### Power-Up Types Configuration

```javascript
const POWER_UP_TYPES = {
    SPEED_BOOST: {
        type: 'speed',
        appearance: { shape: 'cube', color: 0x0066ff, glow: true },
        effect: { multiplier: 2.0, duration: 3000 },
        spawnWeight: 25
    },
    SHIELD: {
        type: 'shield',
        appearance: { shape: 'sphere', color: 0xffd700, glow: true },
        effect: { protection: 1, duration: -1 },
        spawnWeight: 20
    },
    TRAIL_ERASER: {
        type: 'eraser',
        appearance: { shape: 'diamond', color: 0x9932cc, glow: true },
        effect: { segments: 10, duration: 0 },
        spawnWeight: 30
    },
    GHOST_MODE: {
        type: 'ghost',
        appearance: { shape: 'cube', color: 0xffffff, opacity: 0.7 },
        effect: { phaseThrough: true, duration: 3000 },
        spawnWeight: 25
    }
};
```

### Spawn Configuration

```javascript
const SPAWN_CONFIG = {
    maxActivePowerUps: 3,
    spawnInterval: { min: 15000, max: 20000 },
    minDistanceFromBoundary: 5,
    minDistanceFromPlayers: 3,
    minDistanceFromTrails: 1,
    powerUpLifetime: 30000
};
```

## Error Handling

### Spawn Validation
- **Boundary Checking**: Ensure power-ups spawn at least 5 units from arena edges
- **Collision Avoidance**: Prevent spawning on trails or too close to players
- **Maximum Limit**: Enforce 3 active power-ups maximum
- **Safe Positioning**: Retry spawn location if initial position is invalid

### Effect Application
- **State Validation**: Verify player exists and is active before applying effects
- **Effect Stacking**: Handle multiple effects of same type appropriately
- **Graceful Degradation**: Continue gameplay if effect application fails

### Collection Detection
- **Distance Tolerance**: Use 0.5 unit collection radius for reliable detection
- **Duplicate Prevention**: Ensure each power-up can only be collected once
- **State Consistency**: Maintain consistent state between collection and effect application

### Cleanup and Memory Management
- **Automatic Cleanup**: Remove expired power-ups and effects
- **Game Reset**: Clear all power-ups and effects on game restart
- **Resource Management**: Properly dispose of 3D objects and event listeners

## Testing Strategy

### Unit Testing Approach

**PowerUpManager Tests:**
- Spawn logic validation (positioning, timing, limits)
- Collection detection accuracy
- Effect application and duration management
- Cleanup and memory management
- Integration with existing systems

**Effect System Tests:**
- Individual power-up effect behaviors
- Effect stacking and interaction
- Timer management and expiration
- State persistence across game events

**Integration Tests:**
- End-to-end power-up lifecycle (spawn → collect → apply → expire)
- Interaction with existing collision system
- Rendering integration and visual feedback
- Game state consistency during power-up usage

### Test Coverage Requirements
- Maintain existing 96%+ statement coverage
- Cover all power-up types and their unique behaviors
- Test edge cases (boundary conditions, rapid collections)
- Validate error handling and recovery scenarios

### Performance Testing
- Spawn rate impact on frame rate
- Memory usage with maximum active power-ups
- Collection detection performance with multiple entities
- Effect processing overhead during gameplay

## Visual Design Specifications

### Power-Up Appearances

**Speed Boost (Blue Cube):**
- Geometry: 0.8x0.8x0.8 unit cube
- Material: Emissive blue (#0066ff) with pulsing glow
- Animation: Slow rotation (0.02 rad/frame) on Y-axis
- Particle Effect: Blue sparkles on collection

**Shield (Golden Sphere):**
- Geometry: 0.6 unit radius sphere
- Material: Metallic gold (#ffd700) with rim lighting
- Animation: Gentle floating (0.1 unit vertical oscillation)
- Particle Effect: Golden burst on collection

**Trail Eraser (Purple Diamond):**
- Geometry: Diamond shape (rotated cube)
- Material: Translucent purple (#9932cc) with inner glow
- Animation: Continuous rotation on multiple axes
- Particle Effect: Purple fragments on collection

**Ghost Mode (Translucent White Cube):**
- Geometry: 0.8x0.8x0.8 unit cube
- Material: Semi-transparent white (#ffffff, 70% opacity)
- Animation: Phase in/out opacity (0.4-0.9 range)
- Particle Effect: White wisps on collection

### Status Indicator Design

**UI Layout:**
- Position: Top-right corner of screen
- Background: Semi-transparent dark panel
- Icons: 32x32 pixel representations of power-up types
- Timers: Circular progress indicators for timed effects

**Active Effect Display:**
- Speed Boost: Blue lightning bolt with countdown
- Shield: Golden shield icon (no timer)
- Ghost Mode: Translucent ghost icon with countdown
- Trail Eraser: Instant effect (brief flash notification)

## Performance Considerations

### Optimization Strategies

**Spawn Management:**
- Limit active power-ups to 3 maximum
- Use object pooling for power-up entities
- Batch spawn calculations to reduce per-frame overhead

**Collection Detection:**
- Spatial partitioning for efficient distance calculations
- Early exit conditions for out-of-range entities
- Cache player positions to avoid repeated calculations

**Effect Processing:**
- Separate update loops for different effect types
- Lazy evaluation of effect expiration
- Minimize state changes during effect application

**Rendering Optimization:**
- Instanced rendering for similar power-up types
- Level-of-detail for distant power-ups
- Efficient particle system for collection effects

### Memory Management
- Automatic cleanup of expired entities and effects
- Proper disposal of Three.js objects and materials
- Event listener cleanup on game reset
- Bounded collections to prevent memory leaks

## Integration Timeline

**Phase 1: Core Infrastructure**
- Implement PowerUpManager class structure
- Basic spawn and cleanup systems
- Integration with existing game loop

**Phase 2: Power-Up Types**
- Implement individual power-up effects
- Collection detection and application
- Visual representations and animations

**Phase 3: UI and Feedback**
- Status indicator implementation
- Audio and visual feedback systems
- Polish and user experience refinements

**Phase 4: Testing and Optimization**
- Comprehensive test suite
- Performance optimization
- Balance tuning and edge case handling

This design ensures the Power-Up System enhances LightBikes gameplay while maintaining the existing architecture's integrity and performance characteristics.