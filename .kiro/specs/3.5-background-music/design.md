# Background Music Design Document

## Overview

The background music system adds atmospheric audio to LightBikes, enhancing immersion through looping music tracks, independent volume controls, and seamless integration with existing sound effects. The system provides multiple track options, smooth transitions, and persistent user preferences while maintaining optimal performance.

## Architecture

### Core Components

#### MusicPlayer Class
- **Purpose**: Central music management and playback control
- **Responsibilities**: 
  - Audio loading and preloading
  - Playback state management (play/pause/stop)
  - Volume control and fade transitions
  - Track switching and selection
  - Integration with game state changes

#### MusicTrack Class
- **Purpose**: Individual music track representation
- **Responsibilities**:
  - Audio file loading and buffering
  - Loop configuration and seamless playback
  - Track metadata (name, duration, energy level)
  - Loading state and error handling

#### MusicSettings Class
- **Purpose**: User preference management
- **Responsibilities**:
  - Volume level persistence
  - Track selection storage
  - Settings validation and defaults
  - Browser storage integration

### Integration Points

#### AudioManager Extension
- Extend existing AudioManager to include music capabilities
- Maintain separation between sound effects and music systems
- Implement audio ducking during sound effect playback
- Coordinate Web Audio API context usage

#### Game State Integration
- Hook into game lifecycle events (start, pause, resume, end)
- Respond to game mode changes
- Handle restart scenarios with appropriate audio transitions

## Components and Interfaces

### MusicPlayer Interface

```javascript
class MusicPlayer {
    constructor(audioManager, settings)
    
    // Core playback methods
    play()
    pause()
    stop()
    
    // Track management
    setTrack(trackId)
    getAvailableTracks()
    getCurrentTrack()
    
    // Volume and effects
    setVolume(level) // 0.0 to 1.0
    getVolume()
    fadeIn(duration = 0.5)
    fadeOut(duration = 0.5)
    duck(level = 0.3, duration = 0.2)
    
    // State management
    isPlaying()
    isPaused()
    getPlaybackState()
    
    // Event handlers
    onGameStart()
    onGamePause()
    onGameResume()
    onGameEnd()
    onSoundEffect(effectType)
}
```

### MusicTrack Interface

```javascript
class MusicTrack {
    constructor(id, url, metadata)
    
    // Loading and initialization
    load()
    preload()
    isLoaded()
    
    // Playback properties
    getId()
    getName()
    getEnergyLevel() // 'ambient', 'upbeat', 'intense'
    getDuration()
    
    // Audio buffer access
    getAudioBuffer()
    createSource()
    
    // Error handling
    getLoadingState() // 'loading', 'loaded', 'error'
    getError()
}
```

### MusicSettings Interface

```javascript
class MusicSettings {
    constructor()
    
    // Volume settings
    setMusicVolume(level)
    getMusicVolume()
    
    // Track selection
    setSelectedTrack(trackId)
    getSelectedTrack()
    
    // Persistence
    save()
    load()
    reset()
    
    // Validation
    validateSettings(settings)
    getDefaults()
}
```

## Data Models

### Track Configuration

```javascript
const MUSIC_TRACKS = {
    'ambient-space': {
        id: 'ambient-space',
        name: 'Ambient Space',
        url: 'assets/music/ambient-space.mp3',
        energyLevel: 'ambient',
        loop: true,
        preload: true
    },
    'cyber-pulse': {
        id: 'cyber-pulse',
        name: 'Cyber Pulse',
        url: 'assets/music/cyber-pulse.mp3',
        energyLevel: 'upbeat',
        loop: true,
        preload: true
    },
    'neon-rush': {
        id: 'neon-rush',
        name: 'Neon Rush',
        url: 'assets/music/neon-rush.mp3',
        energyLevel: 'intense',
        loop: true,
        preload: true
    },
    'none': {
        id: 'none',
        name: 'No Music',
        url: null,
        energyLevel: null,
        loop: false,
        preload: false
    }
};
```

### Settings Schema

```javascript
const MUSIC_SETTINGS_SCHEMA = {
    musicVolume: {
        type: 'number',
        min: 0.0,
        max: 1.0,
        default: 0.7
    },
    selectedTrack: {
        type: 'string',
        enum: ['ambient-space', 'cyber-pulse', 'neon-rush', 'none'],
        default: 'ambient-space'
    },
    fadeInDuration: {
        type: 'number',
        min: 0.1,
        max: 2.0,
        default: 0.5
    },
    fadeOutDuration: {
        type: 'number',
        min: 0.1,
        max: 2.0,
        default: 0.5
    }
};
```

### Playback State Model

```javascript
const PLAYBACK_STATES = {
    STOPPED: 'stopped',
    LOADING: 'loading',
    PLAYING: 'playing',
    PAUSED: 'paused',
    FADING_IN: 'fading_in',
    FADING_OUT: 'fading_out',
    DUCKED: 'ducked',
    ERROR: 'error'
};
```

## Error Handling

### Loading Failures
- **Graceful Degradation**: Continue without music if tracks fail to load
- **Retry Logic**: Attempt reload with exponential backoff
- **User Notification**: Subtle indication of music unavailability
- **Fallback Options**: Switch to working tracks if available

### Playback Errors
- **Audio Context Issues**: Handle browser audio policy restrictions
- **Network Interruptions**: Pause gracefully and attempt resume
- **Format Compatibility**: Provide multiple audio formats (MP3/OGG)
- **Memory Constraints**: Release unused audio buffers

### Browser Compatibility
- **Web Audio API Support**: Detect and handle unsupported browsers
- **Autoplay Policies**: Respect browser autoplay restrictions
- **Mobile Limitations**: Handle iOS Safari audio context requirements
- **Performance Monitoring**: Track audio performance metrics

## Testing Strategy

### Unit Testing
- **MusicPlayer Class**: Test all public methods and state transitions
- **MusicTrack Class**: Test loading, playback, and error scenarios
- **MusicSettings Class**: Test persistence and validation logic
- **Integration Points**: Test AudioManager integration

### Integration Testing
- **Game Lifecycle**: Test music behavior during game state changes
- **Audio Ducking**: Test interaction with sound effects
- **Settings Persistence**: Test cross-session setting retention
- **Performance Impact**: Test frame rate during music playback

### Browser Testing
- **Cross-Browser Compatibility**: Test on Chrome, Firefox, Safari, Edge
- **Mobile Devices**: Test on iOS and Android browsers
- **Audio Format Support**: Test MP3 and OGG fallbacks
- **Autoplay Policies**: Test user interaction requirements

### Performance Testing
- **Memory Usage**: Monitor audio buffer memory consumption
- **Loading Times**: Test preloading impact on game startup
- **CPU Usage**: Monitor audio processing overhead
- **Network Impact**: Test streaming vs preloaded performance

## Implementation Considerations

### Audio Format Strategy
- **Primary Format**: MP3 for broad compatibility
- **Fallback Format**: OGG Vorbis for Firefox optimization
- **Quality Settings**: 128kbps for balance of quality and size
- **File Size Limits**: Target 2-3MB per track maximum

### Performance Optimization
- **Lazy Loading**: Load tracks only when selected
- **Buffer Management**: Release unused audio buffers
- **Fade Optimization**: Use efficient gain node transitions
- **Loop Precision**: Ensure sample-accurate looping

### User Experience Design
- **Immediate Feedback**: Volume changes apply instantly
- **Smooth Transitions**: All audio changes use fade effects
- **Visual Indicators**: Show current track and volume in UI
- **Accessibility**: Provide keyboard navigation for music controls

### Browser Policy Compliance
- **User Interaction**: Require user gesture before audio playback
- **Context Management**: Handle suspended audio contexts
- **Autoplay Detection**: Detect and adapt to autoplay policies
- **Mobile Optimization**: Handle iOS audio context limitations

## Design Decisions and Rationales

### Web Audio API Choice
- **Rationale**: Provides precise control over audio playback, volume, and effects
- **Alternative Considered**: HTML5 Audio API (limited control capabilities)
- **Benefits**: Enables smooth fading, ducking, and seamless looping

### Separate Volume Control
- **Rationale**: Users often want different levels for music vs sound effects
- **Implementation**: Independent gain nodes for music and effects
- **User Benefit**: Customizable audio balance without losing gameplay audio cues

### Track Preloading Strategy
- **Rationale**: Eliminates loading delays during gameplay
- **Trade-off**: Increased initial loading time vs smooth experience
- **Optimization**: Preload only selected track initially, others on demand

### Fade Transition Design
- **Rationale**: Prevents jarring audio cuts that break immersion
- **Duration Choice**: 0.5s for pause/resume, 1.0s for game end (less urgent)
- **Implementation**: Linear gain ramping for smooth perception

### Audio Ducking Implementation
- **Rationale**: Ensures sound effects remain audible during music playback
- **Trigger**: Automatic during explosion and collision sounds
- **Recovery**: Smooth return to normal volume after effect completion

### Settings Persistence
- **Rationale**: User preferences should survive browser sessions
- **Storage**: localStorage for broad compatibility
- **Validation**: Ensure stored settings remain valid across updates

This design provides a robust, user-friendly background music system that enhances the LightBikes experience while maintaining performance and compatibility across different browsers and devices.