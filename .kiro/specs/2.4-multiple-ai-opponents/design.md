# Multiple AI Opponents Design

## Overview

This design extends the LightBikes game to support 2-4 AI opponents simultaneously, creating a more challenging multiplayer-style experience. The system maintains the existing single-AI architecture while scaling to handle multiple entities with distinct personalities, colors, and intelligent coordination.

The design focuses on extending the current `Game` and `AIController` classes to support arrays of AI entities while preserving performance and maintaining the existing collision detection and rendering systems.

## Architecture

### Core System Changes

#### Multi-AI Game State Management
The `Game` class will be refactored to manage an array of AI entities instead of a single AI opponent:

```javascript
class Game {
    constructor() {
        this.player = { x: 5, y: 15, direction: 'right', trail: [] };
        this.aiOpponents = []; // Array of AI entities
        this.gameConfig = {
            aiCount: 2, // Configurable 2-4 AI opponents
            personalities: ['aggressive', 'defensive', 'erratic']
        };
    }
}
```

#### AI Entity Structure
Each AI entity will maintain the same structure as the current single AI but with additional personality and color properties:

```javascript
const aiEntity = {
    x: startX,
    y: startY, 
    direction: 'up',
    trail: [],
    personality: 'aggressive', // 'aggressive', 'defensive', 'erratic'
    color: 'red', // 'red', 'blue', 'yellow', 'purple'
    id: 'ai_1' // Unique identifier
};
```

### Component Architecture

#### Enhanced AIController System
The existing `AIController` will be extended to support personality-based decision making:

```javascript
class AIController {
    constructor(personality = 'defensive') {
        this.personality = personality;
        this.whiskerLength = 5;
        this.defensiveMode = personality === 'defensive';
    }
    
    calculateAIDirection(aiEntity, gameState) {
        switch(this.personality) {
            case 'aggressive': return this.aggressiveBehavior(aiEntity, gameState);
            case 'defensive': return this.defensiveBehavior(aiEntity, gameState);
            case 'erratic': return this.erraticBehavior(aiEntity, gameState);
        }
    }
}
```

#### Multi-Entity Collision System
The collision detection will be enhanced to handle multiple moving entities:

```javascript
class CollisionDetector {
    checkAllCollisions(gameState) {
        const entities = [gameState.player, ...gameState.aiOpponents];
        const collisions = [];
        
        entities.forEach(entity => {
            if (this.hasCollision(entity, gameState)) {
                collisions.push(entity.id || 'player');
            }
        });
        
        return collisions;
    }
}
```

## Components and Interfaces

### Game Configuration Interface
A new configuration system will allow players to select the number and types of AI opponents:

```javascript
const GameConfig = {
    aiCount: 2, // 2-4 opponents
    aiPersonalities: ['aggressive', 'defensive'], // Auto-assigned based on count
    colors: ['red', 'blue', 'yellow', 'purple'], // Auto-assigned
    startingPositions: [] // Calculated based on aiCount
};
```

### AI Personality Behaviors

#### Aggressive AI
- Actively pursues the player using pathfinding
- Takes calculated risks to cut off player routes
- Shorter whisker detection for more aggressive movement
- Higher turn frequency when player is nearby

#### Defensive AI  
- Maintains existing defensive behavior as baseline
- Focuses on survival and open space navigation
- Longer whisker detection for safer pathfinding
- Avoids risky maneuvers near other entities

#### Erratic AI
- Implements random turn decisions at regular intervals
- Combines defensive pathfinding with unpredictable movement
- Random direction changes every 20-40 frames
- Creates chaos while maintaining basic collision avoidance

### Color Assignment System
```javascript
class ColorManager {
    static assignColors(aiCount) {
        const availableColors = ['red', 'blue', 'yellow', 'purple'];
        return availableColors.slice(0, aiCount);
    }
    
    static getColorHex(colorName) {
        const colorMap = {
            'red': 0xff0000,
            'blue': 0x0000ff, 
            'yellow': 0xffff00,
            'purple': 0x800080
        };
        return colorMap[colorName];
    }
}
```

### Starting Position Calculator
```javascript
class PositionManager {
    static calculateStartingPositions(aiCount, arenaSize = 30) {
        const positions = [];
        const perimeter = arenaSize - 1;
        
        // Distribute AIs evenly around arena perimeter
        for (let i = 0; i < aiCount; i++) {
            const angle = (i / aiCount) * 2 * Math.PI;
            const x = Math.round(arenaSize/2 + (perimeter/2) * Math.cos(angle));
            const y = Math.round(arenaSize/2 + (perimeter/2) * Math.sin(angle));
            positions.push({ x, y, direction: this.getInitialDirection(angle) });
        }
        
        return positions;
    }
}
```

## Data Models

### Enhanced Game State
```javascript
const gameState = {
    player: {
        x: 15, y: 5, direction: 'up', trail: [],
        color: 'cyan', alive: true
    },
    aiOpponents: [
        {
            id: 'ai_1', x: 5, y: 15, direction: 'right', trail: [],
            personality: 'aggressive', color: 'red', alive: true
        },
        {
            id: 'ai_2', x: 25, y: 15, direction: 'left', trail: [],
            personality: 'defensive', color: 'blue', alive: true  
        }
    ],
    gameConfig: {
        aiCount: 2,
        maxEntities: 5, // player + 4 AIs
        performanceMode: false
    },
    gameStatus: 'playing' // 'playing', 'gameOver', 'victory'
};
```

### AI Coordination State
```javascript
const aiCoordination = {
    lastDecisions: new Map(), // Track recent AI decisions
    conflictResolution: {
        preventIdenticalMoves: true,
        staggerDecisionTiming: false
    },
    performanceMetrics: {
        frameTime: 0,
        aiCalculationTime: 0,
        collisionCheckTime: 0
    }
};
```

## Error Handling

### Entity Management Errors
- **Invalid AI Count**: Validate aiCount is between 2-4, default to 2 if invalid
- **Color Assignment Conflicts**: Ensure unique color assignment, fallback to default colors
- **Starting Position Conflicts**: Validate positions don't overlap, recalculate if needed

### Performance Degradation Handling
- **Frame Rate Monitoring**: Track FPS and reduce AI count if below 45 FPS for 3+ seconds
- **AI Calculation Timeout**: Limit AI decision time to 2ms per entity, use fallback if exceeded
- **Memory Management**: Clean up crashed entity trails to prevent memory leaks

### Collision Detection Edge Cases
- **Simultaneous Crashes**: Handle multiple entities crashing in same frame
- **Entity Removal**: Safely remove crashed entities from all game systems
- **Trail Cleanup**: Remove trails of crashed entities from collision detection

## Testing Strategy

### Unit Testing Approach

#### AI Personality Testing
```javascript
describe('AI Personalities', () => {
    test('Aggressive AI pursues player', () => {
        const aggressiveAI = new AIController('aggressive');
        const gameState = createTestGameState();
        const direction = aggressiveAI.calculateAIDirection(gameState.aiOpponents[0], gameState);
        expect(direction).toMoveTowardPlayer(gameState.player);
    });
    
    test('Erratic AI makes random decisions', () => {
        const erraticAI = new AIController('erratic');
        const decisions = [];
        for(let i = 0; i < 100; i++) {
            decisions.push(erraticAI.calculateAIDirection(testEntity, testState));
        }
        expect(decisions).toHaveRandomVariation();
    });
});
```

#### Multi-Entity Collision Testing
```javascript
describe('Multi-Entity Collisions', () => {
    test('Detects AI vs AI collisions', () => {
        const gameState = createCollisionScenario('ai_vs_ai');
        const collisions = collisionDetector.checkAllCollisions(gameState);
        expect(collisions).toContain('ai_1');
        expect(collisions).toContain('ai_2');
    });
    
    test('Handles simultaneous crashes', () => {
        const gameState = createSimultaneousCrashScenario();
        const result = game.processCollisions(gameState);
        expect(result.crashedEntities).toHaveLength(2);
        expect(result.remainingEntities).toHaveLength(1);
    });
});
```

#### Performance Testing
```javascript
describe('Performance with Multiple AIs', () => {
    test('Maintains 60 FPS with 4 AIs', () => {
        const game = new Game({ aiCount: 4 });
        const frameTime = measureFrameTime(() => {
            game.update();
            game.render();
        });
        expect(frameTime).toBeLessThan(16.67); // 60 FPS = 16.67ms per frame
    });
});
```

### Integration Testing

#### End-to-End Game Flow
- Test complete games with 2, 3, and 4 AI opponents
- Verify victory conditions with multiple survivors
- Test game restart with different AI configurations

#### Cross-Component Integration
- AI decision making with multi-entity collision detection
- Rendering system with multiple colored trails
- Input handling during multi-AI gameplay

### Performance Testing

#### Benchmarking Targets
- **Frame Rate**: Maintain 60 FPS with 4 AIs on mid-range devices
- **AI Decision Time**: <2ms per AI per frame
- **Collision Detection**: <5ms for all entities per frame
- **Memory Usage**: <50MB total game memory footprint

#### Load Testing Scenarios
- Extended gameplay sessions (10+ minutes) with 4 AIs
- Rapid game restarts with different AI configurations
- Maximum trail length scenarios (long games)

## Design Decisions and Rationales

### Array-Based AI Management
**Decision**: Use an array to store AI opponents instead of individual variables
**Rationale**: Enables dynamic AI count configuration and simplifies iteration for updates, collision detection, and rendering

### Personality-Based AI System
**Decision**: Implement distinct AI personalities rather than difficulty levels
**Rationale**: Creates more engaging and varied gameplay experiences while maintaining fair competition between different AI types

### Distributed Starting Positions
**Decision**: Calculate starting positions around arena perimeter based on AI count
**Rationale**: Ensures fair initial placement and prevents clustering that could lead to immediate collisions

### Extended Collision Detection
**Decision**: Enhance existing collision system rather than replacing it
**Rationale**: Maintains proven collision accuracy while adding multi-entity support with minimal risk

### Color-Coded Entity Identification
**Decision**: Assign unique colors to each AI opponent
**Rationale**: Essential for player navigation and strategy in multi-opponent scenarios, improves visual clarity

### Performance-First Architecture
**Decision**: Implement performance monitoring and graceful degradation
**Rationale**: Ensures smooth gameplay experience across different devices and prevents performance issues from compromising game quality

This design maintains the existing LightBikes architecture while scaling effectively to support multiple AI opponents with distinct personalities and behaviors.