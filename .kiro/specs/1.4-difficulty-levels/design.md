# Difficulty Levels Design

## Overview

The difficulty levels feature implements a three-tier system (Easy, Medium, Hard) that adjusts AI behavior and game speed to accommodate players of different skill levels. The system integrates seamlessly with the existing LightBikes architecture while providing persistent user preferences and immediate gameplay impact.

## Architecture

### Core Components

#### DifficultyManager
Central controller that manages difficulty settings and coordinates changes across game systems.

```javascript
class DifficultyManager {
    constructor(game, aiController) {
        this.game = game;
        this.aiController = aiController;
        this.currentDifficulty = 'medium'; // Default
        this.loadFromStorage();
    }
}
```

#### DifficultyConfig
Configuration object that defines parameters for each difficulty level.

```javascript
const DIFFICULTY_CONFIGS = {
    easy: {
        turnThreshold: 15,
        randomTurnChance: 0.05,
        gameSpeed: 0.08,
        description: "Slower AI, more predictable behavior"
    },
    medium: {
        turnThreshold: 10,
        randomTurnChance: 0.02,
        gameSpeed: 0.1,
        description: "Balanced gameplay experience"
    },
    hard: {
        turnThreshold: 8,
        randomTurnChance: 0.01,
        gameSpeed: 0.12,
        description: "Faster AI, more challenging gameplay"
    }
};
```

### Integration Points

#### Game Class Extensions
The existing Game class will be extended to support variable game speed:

```javascript
// In game.js
class Game {
    constructor() {
        this.gameSpeed = 0.1; // Default medium speed
        // ... existing code
    }
    
    setGameSpeed(speed) {
        this.gameSpeed = speed;
    }
    
    updatePositions() {
        // Use this.gameSpeed instead of hardcoded 0.1
        this.player.x += this.player.dx * this.gameSpeed;
        this.player.y += this.player.dy * this.gameSpeed;
        this.ai.x += this.ai.dx * this.gameSpeed;
        this.ai.y += this.ai.dy * this.gameSpeed;
    }
}
```

#### AI Controller Extensions
The AIController will accept configuration parameters:

```javascript
// In ai.js
class AIController {
    calculateAIDirection(gameState, config = {}) {
        const turnThreshold = config.turnThreshold || 10;
        const randomTurnChance = config.randomTurnChance || 0.02;
        
        // Use these parameters in AI decision making
        // ... existing whisker logic with configurable thresholds
    }
}
```

## Components and Interfaces

### DifficultyManager Interface

```javascript
class DifficultyManager {
    // Core functionality
    setDifficulty(level) { /* Apply new difficulty settings */ }
    getCurrentDifficulty() { /* Return current difficulty */ }
    getDifficultyConfig(level) { /* Get config for specific level */ }
    
    // Persistence
    saveToStorage() { /* Save to localStorage */ }
    loadFromStorage() { /* Load from localStorage */ }
    
    // Integration
    applyToGame() { /* Update game speed */ }
    applyToAI() { /* Update AI configuration */ }
}
```

### UI Components

#### DifficultySelector
HTML/CSS component integrated into the existing UI:

```html
<div id="difficulty-selector" class="menu-section">
    <h3>Difficulty Level</h3>
    <div class="difficulty-options">
        <button class="difficulty-btn" data-level="easy">
            <span class="level-name">Easy</span>
            <span class="level-desc">Slower AI, more predictable</span>
        </button>
        <button class="difficulty-btn active" data-level="medium">
            <span class="level-name">Medium</span>
            <span class="level-desc">Balanced gameplay</span>
        </button>
        <button class="difficulty-btn" data-level="hard">
            <span class="level-name">Hard</span>
            <span class="level-desc">Faster AI, more challenging</span>
        </button>
    </div>
</div>
```

## Data Models

### Difficulty Configuration Schema

```javascript
{
    level: string,           // 'easy' | 'medium' | 'hard'
    turnThreshold: number,   // Distance in units (8-15)
    randomTurnChance: number, // Probability 0.01-0.05
    gameSpeed: number,       // Units per frame 0.08-0.12
    description: string      // User-friendly description
}
```

### Storage Schema

```javascript
// localStorage key: 'lightbikes_difficulty'
{
    selectedDifficulty: string, // 'easy' | 'medium' | 'hard'
    timestamp: number          // When last set
}
```

## Error Handling

### Storage Failures
- Graceful degradation when localStorage is unavailable
- Default to medium difficulty if storage read fails
- Silent failure for storage write errors (don't interrupt gameplay)

```javascript
loadFromStorage() {
    try {
        const stored = localStorage.getItem('lightbikes_difficulty');
        if (stored) {
            const data = JSON.parse(stored);
            this.setDifficulty(data.selectedDifficulty);
        }
    } catch (error) {
        console.warn('Failed to load difficulty setting:', error);
        // Continue with default medium difficulty
    }
}
```

### Invalid Difficulty Levels
- Validate difficulty level inputs
- Fall back to medium for invalid values
- Log warnings for debugging

```javascript
setDifficulty(level) {
    if (!DIFFICULTY_CONFIGS[level]) {
        console.warn(`Invalid difficulty level: ${level}, using medium`);
        level = 'medium';
    }
    // ... apply difficulty
}
```

## Testing Strategy

### Unit Tests
- **DifficultyManager**: Test all public methods, storage operations, error handling
- **Configuration Validation**: Ensure all difficulty configs are valid
- **Integration Points**: Test game speed and AI parameter updates

### Integration Tests
- **Game Speed Changes**: Verify entities move at correct speeds
- **AI Behavior Changes**: Confirm AI uses new parameters
- **UI Integration**: Test difficulty selection updates game state

### Test Structure
```javascript
describe('DifficultyManager', () => {
    describe('setDifficulty', () => {
        it('should update game speed for easy difficulty', () => {
            // Test game speed set to 0.08
        });
        
        it('should update AI configuration for hard difficulty', () => {
            // Test AI gets turnThreshold: 8, randomTurnChance: 0.01
        });
    });
    
    describe('persistence', () => {
        it('should save difficulty to localStorage', () => {
            // Test storage operations
        });
    });
});
```

## Implementation Approach

### Phase 1: Core System
1. Create DifficultyManager class with configuration management
2. Extend Game class to support variable speed
3. Modify AI controller to accept configuration parameters
4. Implement localStorage persistence

### Phase 2: UI Integration
1. Add difficulty selector to existing HTML
2. Style difficulty buttons to match current UI
3. Wire up event handlers for difficulty changes
4. Add visual feedback for current selection

### Phase 3: Testing & Polish
1. Comprehensive unit test coverage
2. Integration testing with existing systems
3. User experience testing for immediate feedback
4. Performance validation for all difficulty levels

### Design Decisions & Rationales

#### Configuration-Based Approach
**Decision**: Use configuration objects rather than subclasses for difficulty levels.
**Rationale**: Simpler to maintain, easier to add new difficulties, and allows runtime parameter adjustment.

#### Immediate Application
**Decision**: Apply difficulty changes immediately without requiring game restart.
**Rationale**: Better user experience and allows players to experiment with settings mid-session.

#### Medium as Default
**Decision**: Set Medium difficulty as the default for new players.
**Rationale**: Maintains current game balance while providing easier and harder options.

#### Persistent Storage
**Decision**: Use localStorage for difficulty preferences.
**Rationale**: Provides seamless experience across sessions without requiring user accounts or server storage.

#### Parameter Ranges
**Decision**: Conservative parameter ranges (turnThreshold: 8-15, speed: 0.08-0.12).
**Rationale**: Ensures all difficulties remain playable while providing noticeable differences in challenge level.

This design maintains the existing LightBikes architecture while adding the flexibility needed for multiple difficulty levels. The modular approach allows for easy extension and testing while ensuring immediate user feedback and persistent preferences.