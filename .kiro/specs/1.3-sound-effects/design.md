# Sound Effects Design Document

## Overview

The sound effects system will add immersive audio feedback to the LightBikes game through a comprehensive Audio Manager that handles all game audio. The system will provide immediate feedback for player actions, environmental audio during gameplay, and dramatic effects for game events while maintaining performance and user control.

The design follows the existing modular architecture pattern, implementing the Audio Manager as a separate class that integrates cleanly with the current game loop and state management system.

## Architecture

### Core Components

#### AudioManager Class
The central component responsible for all audio operations, following the existing architectural patterns:

```javascript
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.isMuted = false;
        this.isInitialized = false;
        this.currentEngine = null;
    }
}
```

#### Audio Context Management
- Uses Web Audio API for precise control and performance
- Lazy initialization to comply with browser autoplay policies
- Graceful fallback for browsers without Web Audio API support

#### Sound Categories
1. **Turn Effects**: Brief directional change feedback
2. **Engine Audio**: Continuous looping background sound
3. **Explosion Effects**: Dramatic collision audio
4. **Victory/Defeat**: Game outcome feedback

### Integration Points

#### Game Loop Integration
The AudioManager integrates with the existing game loop in `script.js`:
- Audio state updates occur after game state updates
- No blocking operations in the main animation loop
- Event-driven audio triggers based on game state changes

#### State Management Integration
- Responds to game state changes from the Game class
- Monitors pause/unpause events
- Tracks collision events and game outcomes
- Maintains audio state independently of game state

## Components and Interfaces

### AudioManager Interface

#### Public Methods
```javascript
// Initialization
initialize()                    // Set up audio context and preload sounds
setMuted(muted)                // Toggle mute state
getMuted()                     // Get current mute state

// Sound Playback
playTurnSound()                // Play direction change effect
startEngineSound()             // Begin looping engine audio
stopEngineSound()              // Stop engine audio
playExplosionSound()           // Play collision effect
playVictorySound()             // Play win effect
playDefeatSound()              // Play loss effect

// State Management
handleGameStart()              // Audio setup for new game
handleGamePause()              // Pause all audio
handleGameResume()             // Resume appropriate audio
handleGameEnd()                // Stop all audio
```

#### Integration with Existing Components

**Game Class Integration**:
- Game class will emit audio events through the orchestrator
- No direct coupling between Game and AudioManager
- Audio triggers based on game state changes

**Controls Integration**:
- Direction change events trigger turn sounds
- No modification to existing control logic required

**Collision Integration**:
- Collision detection triggers explosion sounds
- Victory/defeat determination triggers outcome sounds

### Audio File Management

#### File Structure
```
sounds/
├── turn.mp3           # Direction change effect
├── engine.mp3         # Looping engine sound
├── explosion.mp3      # Collision effect
├── victory.mp3        # Win sound
└── defeat.mp3         # Loss sound
```

#### Format Strategy
- Primary: MP3 for broad compatibility
- Fallback: OGG for browsers preferring open formats
- File size optimization: < 100KB per effect, < 500KB for engine loop

#### Preloading System
```javascript
async preloadSounds() {
    const soundFiles = {
        turn: 'sounds/turn.mp3',
        engine: 'sounds/engine.mp3',
        explosion: 'sounds/explosion.mp3',
        victory: 'sounds/victory.mp3',
        defeat: 'sounds/defeat.mp3'
    };
    
    // Load all sounds with error handling
    // Store in this.sounds object for quick access
}
```

## Data Models

### Audio State Model
```javascript
{
    isMuted: boolean,           // User mute preference
    isInitialized: boolean,     // Audio system ready state
    currentEngine: AudioNode,   // Active engine sound reference
    loadedSounds: Map,          // Preloaded audio buffers
    playbackQueue: Array       // Queued sound effects
}
```

### Sound Configuration Model
```javascript
{
    turn: {
        volume: 0.3,
        maxConcurrent: 1,
        cooldown: 100           // ms between plays
    },
    engine: {
        volume: 0.2,
        loop: true,
        fadeIn: 200,
        fadeOut: 200
    },
    explosion: {
        volume: 0.8,
        priority: 'high',
        interruptOthers: true
    },
    victory: {
        volume: 0.6,
        delay: 500              // ms after explosion
    },
    defeat: {
        volume: 0.4,
        delay: 500
    }
}
```

### Persistence Model
```javascript
// localStorage structure
{
    'lightbikes_audio_muted': boolean,
    'lightbikes_audio_volume': number    // Future enhancement
}
```

## Error Handling

### Audio Loading Failures
- Graceful degradation when audio files fail to load
- Game continues normally without audio
- User notification through console logging (development)
- No blocking of game initialization

### Browser Compatibility Issues
- Feature detection for Web Audio API
- Fallback to HTML5 Audio elements if needed
- Autoplay policy compliance through user interaction detection

### Performance Safeguards
- Maximum concurrent sound limit (5 simultaneous)
- Audio buffer cleanup for memory management
- Automatic context suspension during inactivity

### Error Recovery
```javascript
handleAudioError(error, soundType) {
    console.warn(`Audio error for ${soundType}:`, error);
    // Continue game without audio
    // Mark sound as unavailable
    // Prevent further attempts to play failed sound
}
```

## Testing Strategy

### Unit Testing Approach
Following the existing Jest testing patterns with jsdom environment:

#### AudioManager Tests
```javascript
describe('AudioManager', () => {
    let audioManager;
    
    beforeEach(() => {
        // Mock Web Audio API
        global.AudioContext = jest.fn();
        audioManager = new AudioManager();
    });
    
    describe('initialization', () => {
        it('should initialize audio context on first interaction');
        it('should preload all sound files');
        it('should handle loading failures gracefully');
    });
    
    describe('sound playback', () => {
        it('should play turn sound on direction change');
        it('should prevent turn sound spam');
        it('should loop engine sound during gameplay');
        it('should stop all audio on explosion');
    });
    
    describe('mute functionality', () => {
        it('should mute all sounds when toggled');
        it('should persist mute state to localStorage');
        it('should restore mute state on initialization');
    });
});
```

#### Integration Tests
- Test audio triggers from game events
- Verify proper cleanup on game restart
- Confirm no audio interference with game performance

#### Mock Strategy
- Mock Web Audio API for consistent testing
- Mock localStorage for persistence testing
- Mock audio file loading for reliable test execution

### Performance Testing
- Measure audio initialization impact on game startup
- Verify no frame rate degradation during audio playback
- Test memory usage with extended gameplay sessions

### Browser Compatibility Testing
- Chrome/Chromium (primary target)
- Firefox (Web Audio API differences)
- Safari (autoplay policy variations)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Implementation Notes

### Design Decisions and Rationales

#### Web Audio API Choice
**Decision**: Use Web Audio API instead of HTML5 Audio elements
**Rationale**: 
- Precise timing control for game events
- Better performance for multiple concurrent sounds
- Advanced features like volume control and effects
- Consistent behavior across browsers

#### Lazy Initialization
**Decision**: Initialize audio context only on first user interaction
**Rationale**:
- Complies with browser autoplay policies
- Avoids unnecessary resource usage if user never interacts
- Prevents console warnings in modern browsers

#### Separate Audio Manager Class
**Decision**: Implement as standalone class rather than integrating into existing components
**Rationale**:
- Maintains separation of concerns
- Follows existing architectural patterns
- Easier to test and maintain
- Allows for future audio feature expansion

#### Event-Driven Integration
**Decision**: Use event-based communication rather than direct method calls
**Rationale**:
- Loose coupling with existing game components
- No modification required to existing game logic
- Easy to disable audio system without affecting gameplay
- Consistent with existing component communication patterns

#### Preloading Strategy
**Decision**: Load all audio files during initialization
**Rationale**:
- Eliminates loading delays during gameplay
- Ensures audio availability when needed
- Small file sizes make preloading feasible
- Better user experience with immediate audio feedback

### Performance Considerations
- Audio processing occurs off the main thread where possible
- Minimal impact on game loop performance
- Efficient memory usage through audio buffer reuse
- Automatic cleanup of unused audio resources

### Future Extension Points
- Volume slider controls (individual sound categories)
- Audio effect processing (reverb, filters)
- Dynamic audio based on game intensity
- Spatial audio for 3D positioning
- Custom sound pack support