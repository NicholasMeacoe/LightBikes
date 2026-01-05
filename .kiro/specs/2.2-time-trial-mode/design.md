# Time Trial Mode Design

## Overview

Time Trial mode introduces a single-player survival experience to LightBikes, where players compete against time rather than an AI opponent. This mode transforms the competitive nature of the original game into a personal challenge focused on self-improvement and milestone achievements. The design extends the existing game architecture while maintaining the core mechanics that make LightBikes engaging.

## Architecture

### Mode Selection System

The game will implement a mode selection interface that appears before gameplay begins. This system extends the existing Game class with a new initialization path:

```
Game Initialization Flow:
1. Display Mode Selector UI
2. User selects Classic or Time Trial
3. Initialize appropriate game mode
4. Store mode preference in localStorage
5. Begin countdown sequence
```

**Design Decision**: Mode selection is implemented as a pre-game UI rather than a runtime toggle to maintain clear separation between game modes and avoid complex state transitions during gameplay.

### Timer Architecture

The Time Trial mode introduces a precision timing system built on `performance.now()` for accurate millisecond tracking:

```
Timer System Components:
- SurvivalTimer: Core timing logic with pause/resume capability
- TimerDisplay: UI component for MM:SS.SS format rendering
- CountdownTimer: Pre-game 3-2-1-GO sequence controller
- TimerPersistence: Integration with leaderboard storage
```

**Design Decision**: Using `performance.now()` instead of `Date.now()` ensures high-precision timing unaffected by system clock adjustments, critical for fair leaderboard comparisons.

### Game Loop Modifications

Time Trial mode modifies the existing game loop to remove AI components while preserving all collision and movement mechanics:

```
Modified Game Loop:
1. Input Processing (player only)
2. Player Movement Update
3. Trail Management (player only)
4. Collision Detection (boundaries + self-trail)
5. Timer Update (if not paused)
6. Achievement Check
7. Rendering Update
```

**Design Decision**: Rather than creating a separate game loop, we conditionally disable AI-related code paths to maintain consistency and reduce code duplication.

## Components and Interfaces

### ModeSelector Component

```javascript
class ModeSelector {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.selectedMode = localStorage.getItem('lastGameMode') || 'classic';
    }
    
    // Core interface methods
    show()              // Display mode selection UI
    hide()              // Remove mode selection UI
    selectMode(mode)    // Handle mode selection
    getSelectedMode()   // Return current selection
}
```

### SurvivalTimer Component

```javascript
class SurvivalTimer {
    constructor() {
        this.startTime = null;
        this.pausedTime = 0;
        this.isPaused = false;
    }
    
    // Core interface methods
    start()             // Begin timing
    pause()             // Pause timer
    resume()            // Resume from pause
    stop()              // End timing
    getElapsedTime()    // Return current time in milliseconds
    formatTime(ms)      // Convert to MM:SS.SS format
}
```

### LeaderboardSystem Component

```javascript
class LeaderboardSystem {
    constructor() {
        this.storageKey = 'lightbikes_time_trial_scores';
        this.maxEntries = 10;
    }
    
    // Core interface methods
    addScore(timeMs)        // Add new score if it qualifies
    getTopScores()          // Return sorted top 10 scores
    isNewRecord(timeMs)     // Check if score qualifies
    clearScores()           // Reset leaderboard
}
```

### AchievementSystem Component

```javascript
class AchievementSystem {
    constructor() {
        this.milestones = [30, 60, 120, 300, 600]; // seconds
        this.unlockedAchievements = this.loadProgress();
    }
    
    // Core interface methods
    checkMilestone(timeSeconds)     // Check for new achievements
    showAchievement(milestone)      // Display achievement notification
    getProgress()                   // Return achievement status
    saveProgress()                  // Persist to localStorage
}
```

## Data Models

### GameMode Enumeration

```javascript
const GameModes = {
    CLASSIC: 'classic',
    TIME_TRIAL: 'time_trial'
};
```

### Timer State Model

```javascript
const TimerState = {
    startTime: null,        // performance.now() when started
    pausedDuration: 0,      // Total time spent paused (ms)
    isPaused: false,        // Current pause state
    isRunning: false        // Whether timer is active
};
```

### Leaderboard Entry Model

```javascript
const LeaderboardEntry = {
    timeMs: 0,              // Survival time in milliseconds
    timestamp: 0,           // When achieved (Date.now())
    formattedTime: "00:00.00" // Display format
};
```

### Achievement Model

```javascript
const Achievement = {
    milestone: 30,          // Time threshold in seconds
    unlocked: false,        // Whether player has achieved this
    message: "First Steps!" // Display message
};
```

## Error Handling

### Timer Precision Protection

- **Clock Drift**: Timer calculations use elapsed time differences rather than absolute timestamps
- **Negative Time**: Validation ensures elapsed time never goes negative due to system clock changes
- **Overflow Protection**: Maximum timer value capped at 99:59.99 to prevent display issues

### Storage Failure Handling

- **localStorage Unavailable**: Graceful degradation to session-only leaderboards
- **Quota Exceeded**: Automatic cleanup of oldest entries when storage limit reached
- **Corrupted Data**: Validation and reset of malformed leaderboard data

### UI State Management

- **Mode Selection Errors**: Default to Classic mode if invalid selection detected
- **Timer Display Errors**: Fallback to "00:00.00" if formatting fails
- **Achievement Notification Errors**: Silent failure to prevent gameplay interruption

## Testing Strategy

### Unit Testing Coverage

**SurvivalTimer Tests**:
- Start/stop functionality
- Pause/resume accuracy
- Time formatting edge cases
- Performance.now() integration

**LeaderboardSystem Tests**:
- Score insertion and sorting
- localStorage persistence
- Data validation and cleanup
- Top 10 limit enforcement

**ModeSelector Tests**:
- UI state management
- Mode persistence
- Selection validation
- Integration with game initialization

**AchievementSystem Tests**:
- Milestone detection accuracy
- Progress persistence
- Notification timing
- Achievement unlocking logic

### Integration Testing

**Game Mode Switching**:
- Verify AI removal in Time Trial mode
- Confirm timer integration with game loop
- Test pause functionality across modes
- Validate restart behavior

**End-to-End Scenarios**:
- Complete Time Trial session from start to leaderboard
- Achievement unlock during gameplay
- Mode switching between sessions
- Leaderboard persistence across browser sessions

### Performance Testing

**Timer Accuracy**:
- Verify millisecond precision under load
- Test timer behavior during frame drops
- Validate pause/resume accuracy

**Memory Management**:
- Monitor trail segment cleanup in extended sessions
- Test leaderboard storage efficiency
- Verify no memory leaks in timer components

## Implementation Considerations

### Backward Compatibility

The Time Trial implementation maintains full backward compatibility with existing Classic mode functionality. All existing game mechanics, controls, and rendering systems remain unchanged.

### Performance Impact

- **Timer Updates**: Minimal overhead using requestAnimationFrame synchronization
- **UI Rendering**: Timer display updates only when value changes to reduce DOM manipulation
- **Storage Operations**: Leaderboard updates occur only at game end to avoid mid-game performance impact

### Mobile Optimization

- **Touch Controls**: Existing touch control system works unchanged in Time Trial mode
- **Display Scaling**: Timer and achievement displays use responsive CSS for various screen sizes
- **Performance**: No additional mobile-specific optimizations required beyond existing game optimizations

### Future Extensibility

The design provides clear extension points for future enhancements:
- **Multiple Difficulty Levels**: Timer system can integrate with speed multipliers
- **Online Leaderboards**: LeaderboardSystem interface can be extended for server integration
- **Additional Game Modes**: ModeSelector can accommodate new modes with minimal changes
- **Enhanced Achievements**: Achievement system supports additional milestone types and rewards

This architecture ensures Time Trial mode integrates seamlessly with the existing LightBikes codebase while providing a solid foundation for future feature development.