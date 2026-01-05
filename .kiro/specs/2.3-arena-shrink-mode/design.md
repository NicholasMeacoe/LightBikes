# Arena Shrink Mode Design

## Overview

The Arena Shrink Mode introduces dynamic battlefield mechanics to LightBikes by progressively reducing the playable area during gameplay. This creates escalating tension and strategic depth as players must adapt to increasingly confined spaces while maintaining their competitive edge.

The design extends the existing game architecture with minimal disruption, adding a new game mode that integrates seamlessly with current systems while providing a distinctly different gameplay experience.

## Architecture

### Core Components

#### ArenaShrinker Class
A new component responsible for managing the shrinking mechanics:
- Tracks current arena dimensions and shrink timing
- Manages the shrink countdown and warning system
- Calculates new boundary positions
- Triggers visual and audio effects
- Integrates with the collision system for dynamic bounds

#### Enhanced Game Class
Extensions to the existing Game class to support dynamic boundaries:
- Add `arenaShrinker` property for shrink mode games
- Modify boundary collision detection to use dynamic bounds
- Add arena size tracking for scoring
- Integrate shrink events with game state management

#### Dynamic Boundary System
A flexible boundary management system:
- Replace static 30x30 boundaries with configurable dynamic bounds
- Provide real-time boundary information to all game systems
- Support smooth boundary transitions with animation
- Maintain backward compatibility with existing game modes

### Integration Points

The design leverages existing architecture patterns:
- **Game Loop Integration**: ArenaShrinker updates occur in the main animation loop
- **Collision System**: Enhanced to query dynamic boundaries instead of static values
- **Rendering Engine**: Extended to visualize current and future boundaries
- **AI System**: Receives dynamic boundary information for pathfinding
- **Audio System**: Plays shrink-related sound effects through existing audio infrastructure

## Components and Interfaces

### ArenaShrinker Interface

```javascript
class ArenaShrinker {
    constructor(initialSize = 30, minSize = 10, shrinkInterval = 5000, shrinkAmount = 1) {
        this.currentSize = initialSize;
        this.minSize = minSize;
        this.shrinkInterval = shrinkInterval;
        this.shrinkAmount = shrinkAmount;
        this.lastShrinkTime = 0;
        this.warningActive = false;
        this.warningStartTime = 0;
        this.isActive = true;
    }

    // Core Methods
    update(currentTime) { /* Update shrink timing and trigger events */ }
    getCurrentBounds() { /* Return current boundary coordinates */ }
    getNextBounds() { /* Return next boundary coordinates for preview */ }
    isWarningActive() { /* Check if warning period is active */ }
    getTimeUntilShrink() { /* Calculate countdown timer value */ }
    
    // Event Methods
    onShrinkWarning() { /* Trigger warning effects */ }
    onShrinkExecute() { /* Execute boundary contraction */ }
    onFinalArena() { /* Handle minimum size reached */ }
}
```

### Enhanced Game Interface

```javascript
class Game {
    constructor(mode = 'classic') {
        // Existing properties...
        this.mode = mode;
        this.arenaShrinker = mode === 'shrink' ? new ArenaShrinker() : null;
        this.dynamicBounds = this.arenaShrinker ? 
            this.arenaShrinker.getCurrentBounds() : 
            { minX: -15, maxX: 15, minZ: -15, maxZ: 15 };
    }

    // Enhanced Methods
    getBounds() { /* Return current boundaries (static or dynamic) */ }
    update() { /* Include arena shrinking in game updates */ }
    getGameState() { /* Include arena info in game state */ }
}
```

### Boundary Management

```javascript
class BoundaryManager {
    static getBounds(game) {
        return game.arenaShrinker ? 
            game.arenaShrinker.getCurrentBounds() : 
            BoundaryManager.getStaticBounds();
    }
    
    static getStaticBounds() {
        return { minX: -15, maxX: 15, minZ: -15, maxZ: 15 };
    }
    
    static isWithinBounds(position, bounds) {
        return position.x >= bounds.minX && position.x <= bounds.maxX &&
               position.z >= bounds.minZ && position.z <= bounds.maxZ;
    }
}
```

## Data Models

### Arena State Model

```javascript
const ArenaState = {
    currentSize: 30,           // Current arena dimension (square)
    minSize: 10,              // Minimum arena size before stopping
    shrinkRate: 1,            // Units to shrink per interval
    shrinkInterval: 5000,     // Milliseconds between shrinks
    timeUntilShrink: 5000,    // Countdown to next shrink
    warningActive: false,     // Whether warning is currently showing
    warningDuration: 2000,    // Warning period length in ms
    gracePeriod: 500,         // Grace period for boundary adjustment
    isAtMinimum: false,       // Whether arena has reached minimum size
    totalShrinks: 0,          // Number of shrinks that have occurred
    survivalTime: 0           // Time survived in shrink mode
};
```

### Boundary Coordinates Model

```javascript
const BoundaryCoordinates = {
    minX: -15,    // Left boundary
    maxX: 15,     // Right boundary  
    minZ: -15,    // Back boundary
    maxZ: 15,     // Front boundary
    center: { x: 0, z: 0 },  // Arena center point
    size: 30      // Current arena dimension
};
```

### Visual Effect State

```javascript
const ShrinkEffects = {
    warningFlash: {
        active: false,
        intensity: 0.0,      // 0.0 to 1.0
        flashRate: 4         // Flashes per second
    },
    shrinkAnimation: {
        active: false,
        progress: 0.0,       // 0.0 to 1.0
        duration: 500,       // Animation length in ms
        startBounds: null,   // Boundary state at animation start
        targetBounds: null   // Target boundary state
    },
    boundaryPreview: {
        visible: false,
        opacity: 0.3,        // Translucent overlay opacity
        nextBounds: null     // Preview boundary coordinates
    }
};
```

## Error Handling

### Boundary Validation
- **Invalid Arena Size**: Prevent arena from shrinking below minimum size
- **Timing Conflicts**: Handle rapid shrink requests gracefully
- **State Synchronization**: Ensure boundary state consistency across systems

### Grace Period Management
- **Player Outside Bounds**: Provide 0.5-second adjustment period when boundaries shrink
- **Collision Detection**: Temporarily disable boundary collisions during grace period
- **Visual Feedback**: Show grace period status to players

### System Integration Errors
- **AI Pathfinding**: Handle cases where AI cannot find valid paths in small arenas
- **Rendering Issues**: Gracefully handle boundary visualization edge cases
- **Audio Failures**: Continue gameplay if sound effects fail to play

### Recovery Mechanisms
```javascript
class ErrorHandler {
    static handleShrinkError(error, arenaShrinker) {
        console.warn('Arena shrink error:', error);
        // Pause shrinking temporarily
        arenaShrinker.isActive = false;
        // Attempt recovery after delay
        setTimeout(() => {
            arenaShrinker.isActive = true;
        }, 1000);
    }
    
    static validateBoundaries(bounds) {
        const minSize = 10;
        if (bounds.maxX - bounds.minX < minSize) {
            throw new Error('Arena too small for safe gameplay');
        }
        return true;
    }
}
```

## Testing Strategy

### Unit Testing Approach

#### ArenaShrinker Tests
- **Timing Logic**: Verify shrink intervals and countdown accuracy
- **Boundary Calculations**: Test boundary position calculations
- **State Transitions**: Validate warning and shrink state changes
- **Edge Cases**: Test minimum size handling and final arena behavior

#### Integration Tests
- **Game Mode Integration**: Test shrink mode activation and deactivation
- **Collision System**: Verify dynamic boundary collision detection
- **AI Behavior**: Test AI adaptation to changing boundaries
- **Visual Effects**: Validate warning and shrink animations

#### Performance Tests
- **Frame Rate Impact**: Measure performance impact of dynamic boundaries
- **Memory Usage**: Monitor memory consumption during extended shrink sessions
- **Timing Precision**: Verify shrink timing accuracy under load

### Test Data Scenarios

#### Standard Gameplay
- Normal shrink progression from 30x30 to 10x10
- Player survival through multiple shrink cycles
- AI vs Player competition in shrinking arena

#### Edge Cases
- Rapid game restarts during shrink cycles
- Players positioned exactly on boundaries during shrink
- Arena reaching minimum size with both players alive

#### Error Conditions
- Invalid arena sizes
- Timing system failures
- Rendering system errors during boundary updates

### Automated Testing Framework

```javascript
describe('ArenaShrinker', () => {
    let arenaShrinker;
    
    beforeEach(() => {
        arenaShrinker = new ArenaShrinker();
    });
    
    describe('shrink timing', () => {
        it('should trigger warning 2 seconds before shrink', () => {
            // Test warning timing accuracy
        });
        
        it('should shrink boundaries every 5 seconds', () => {
            // Test shrink interval consistency
        });
    });
    
    describe('boundary calculations', () => {
        it('should reduce all sides equally', () => {
            // Test symmetric shrinking
        });
        
        it('should stop at minimum size', () => {
            // Test minimum size enforcement
        });
    });
});
```

## Design Decisions and Rationales

### Symmetric Shrinking
**Decision**: Shrink all four boundaries equally by 1 unit per cycle
**Rationale**: Maintains square arena shape and predictable gameplay patterns. Equal shrinking prevents strategic advantages based on arena asymmetry.

### Fixed Shrink Rate
**Decision**: Constant 5-second intervals with 1-unit shrinkage
**Rationale**: Provides predictable progression that players can learn and strategize around. Avoids accelerating shrink rates that could feel unfair.

### Grace Period Implementation
**Decision**: 0.5-second collision immunity when boundaries shrink
**Rationale**: Prevents unfair eliminations when players are positioned near boundaries during shrink events. Maintains competitive fairness while preserving challenge.

### Warning System Design
**Decision**: 2-second warning with visual and audio cues
**Rationale**: Provides sufficient reaction time for strategic repositioning without making the shrinking trivial. Visual prominence ensures accessibility.

### Minimum Arena Size
**Decision**: 10x10 unit minimum with no further shrinking
**Rationale**: Ensures playable space remains available while creating maximum tension. Prevents degenerate gameplay in extremely small spaces.

### Component Integration Approach
**Decision**: Extend existing classes rather than replacing them
**Rationale**: Maintains backward compatibility and leverages existing, tested systems. Reduces implementation complexity and potential for introducing bugs.

### AI Adaptation Strategy
**Decision**: Provide AI with same boundary information as player
**Rationale**: Ensures fair competition and prevents AI from having unfair advantages or disadvantages. Maintains game balance across all skill levels.

### Visual Effect Philosophy
**Decision**: Clear, non-intrusive warnings with smooth animations
**Rationale**: Enhances drama and immersion without compromising gameplay visibility. Ensures accessibility for players with different visual capabilities.

This design provides a comprehensive foundation for implementing Arena Shrink Mode while maintaining the architectural integrity and performance characteristics of the existing LightBikes game.