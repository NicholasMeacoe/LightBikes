# Replay System Design

## Overview

The Replay System provides comprehensive recording, playback, and sharing capabilities for LightBikes gameplay sessions. The system captures game state data at 60 FPS during live gameplay and enables full-fidelity replay with independent camera controls, editing tools, and export functionality.

The design integrates seamlessly with the existing LightBikes architecture while maintaining performance during recording and providing smooth playback experiences. The system supports both automatic recording and manual replay management.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Game Loop     │───▶│ Replay Recorder │───▶│ Frame Storage   │
│   (script.js)   │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌─────────────────┐             │
│ Replay UI       │◀───│ Replay Manager  │◀────────────┘
│ Controls        │    │                 │
└─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐    ┌─────────────────┐
                       │ Replay Playback │───▶│ Camera Control  │
                       │                 │    │                 │
                       └─────────────────┘    └─────────────────┘
```

### Component Integration

The replay system integrates with existing LightBikes components:

- **Game State Integration**: Hooks into the existing game loop to capture state without performance impact
- **Renderer Integration**: Reuses existing Three.js rendering pipeline for consistent visual fidelity
- **Storage Integration**: Leverages browser localStorage with fallback to file-based export/import
- **UI Integration**: Extends existing HTML/CSS interface with replay-specific controls

## Components and Interfaces

### 1. ReplayRecorder

**Purpose**: Captures game state data during live gameplay sessions.

**Key Methods**:
```javascript
class ReplayRecorder {
    startRecording(gameInstance)     // Begin capturing frame data
    stopRecording()                  // End recording and finalize replay
    captureFrame(gameState)          // Store single frame snapshot
    isRecording()                    // Check recording status
    getRecordingStats()              // Get current recording metrics
}
```

**Design Decisions**:
- **60 FPS Capture Rate**: Matches game loop frequency for smooth playback
- **Incremental Storage**: Only stores changed data between frames to optimize memory
- **Non-blocking Operation**: Uses requestAnimationFrame timing to avoid gameplay impact
- **Automatic Lifecycle**: Starts/stops with game sessions without manual intervention

### 2. ReplayPlayback

**Purpose**: Recreates recorded gameplay with full visual fidelity and control options.

**Key Methods**:
```javascript
class ReplayPlayback {
    loadReplay(replayData)           // Initialize replay for playback
    play()                           // Start/resume playback
    pause()                          // Pause playback
    stop()                           // Stop and reset to beginning
    seekToFrame(frameNumber)         // Jump to specific frame
    setPlaybackSpeed(multiplier)     // Adjust playback speed
    getCurrentFrame()                // Get current playback position
    getTotalFrames()                 // Get replay duration in frames
}
```

**Design Decisions**:
- **Frame-based Playback**: Uses frame numbers for precise seeking and control
- **Speed Control**: Supports 0.25x to 4x playback speeds with smooth interpolation
- **State Reconstruction**: Rebuilds complete game state from frame data for rendering
- **Renderer Reuse**: Leverages existing rendering engine for consistent visuals

### 3. CameraController

**Purpose**: Provides independent camera control during replay viewing.

**Key Methods**:
```javascript
class CameraController {
    setMode(mode)                    // Switch between camera modes
    updateFreeCamera(input)          // Handle free camera movement
    followPlayer(playerId)           // Track specific player
    setPresetView(preset)            // Apply predefined camera position
    saveCustomPath(keyframes)        // Store custom camera animation
    playCustomPath()                 // Execute saved camera path
}
```

**Camera Modes**:
- **Free Camera**: Full 3D movement with mouse/keyboard controls
- **Player Follow**: Automatic tracking of selected player
- **Overview**: Fixed top-down perspective of entire arena
- **Side View**: Fixed side perspective for tactical analysis
- **Custom Path**: User-defined camera animations

**Design Decisions**:
- **Independent Movement**: Camera operates separately from game state reconstruction
- **Smooth Transitions**: Eased movement between positions and modes
- **Preset System**: Quick access to common viewing angles
- **Path Recording**: Enables cinematic replay creation

### 4. ReplayStorage

**Purpose**: Manages replay file persistence, organization, and sharing.

**Key Methods**:
```javascript
class ReplayStorage {
    saveReplay(replayData, metadata) // Store replay with descriptive info
    loadReplay(replayId)             // Retrieve stored replay
    listReplays()                    // Get all available replays
    deleteReplay(replayId)           // Remove replay from storage
    exportReplay(replayId)           // Generate downloadable file
    importReplay(fileData)           // Load external replay file
    generateShareLink(replayId)      // Create shareable URL
}
```

**Storage Strategy**:
- **Primary**: Browser localStorage for immediate access
- **Secondary**: File export/import for sharing and backup
- **Metadata**: Game info, player names, duration, creation date
- **Compression**: JSON compression for efficient storage

### 5. ReplayEditor

**Purpose**: Provides tools for creating highlights and custom replay experiences.

**Key Methods**:
```javascript
class ReplayEditor {
    markSegmentStart(frameNumber)    // Set highlight start point
    markSegmentEnd(frameNumber)      // Set highlight end point
    createHighlight(segments)        // Generate highlight reel
    saveCustomPath(cameraKeyframes)  // Store camera animation
    exportHighlight(format)          // Export in various formats
    mergeSegments(segments)          // Combine multiple highlights
}
```

**Editing Features**:
- **Segment Selection**: Mark start/end points for highlights
- **Camera Paths**: Record custom camera movements
- **Multi-segment**: Combine multiple highlights into single replay
- **Export Options**: Various formats for different sharing needs

## Data Models

### Frame Data Structure

```javascript
const FrameData = {
    frameNumber: Number,        // Sequential frame identifier
    timestamp: Number,          // Game time in milliseconds
    players: [{
        id: String,             // Player identifier
        position: {x, y, z},    // Current position
        direction: {x, y, z},   // Movement direction
        trail: [{x, y, z}],     // Trail segment positions
        alive: Boolean,         // Player status
        customization: Object   // Visual customizations
    }],
    powerUps: [{
        id: String,             // Power-up identifier
        position: {x, y, z},    // World position
        type: String,           // Power-up type
        active: Boolean         // Availability status
    }],
    gameEvents: [{
        type: String,           // Event type (collision, powerup, etc.)
        timestamp: Number,      // Event time
        data: Object           // Event-specific data
    }],
    arena: {
        bounds: Object,         // Arena boundaries
        theme: String,          // Visual theme
        effects: Object         // Active visual effects
    }
};
```

### Replay Metadata

```javascript
const ReplayMetadata = {
    id: String,                 // Unique replay identifier
    name: String,               // User-friendly name
    createdAt: Date,            // Creation timestamp
    duration: Number,           // Total frames
    gameMode: String,           // Game mode played
    players: [{
        name: String,           // Player name
        type: String,           // Human/AI
        score: Number           // Final score
    }],
    winner: String,             // Winning player
    version: String,            // Game version
    fileSize: Number,           // Storage size in bytes
    tags: [String]              // User-defined tags
};
```

### Camera Path Data

```javascript
const CameraPath = {
    id: String,                 // Path identifier
    name: String,               // User-friendly name
    keyframes: [{
        frame: Number,          // Target frame number
        position: {x, y, z},    // Camera position
        target: {x, y, z},      // Look-at target
        fov: Number,            // Field of view
        transition: String      // Easing type
    }],
    duration: Number,           // Total path duration
    loop: Boolean              // Whether path repeats
};
```

## Error Handling

### Recording Errors

- **Memory Limits**: Automatic cleanup of old frame data when approaching storage limits
- **Performance Impact**: Dynamic quality adjustment if recording affects gameplay FPS
- **Storage Failures**: Graceful degradation with user notification and recovery options
- **Corruption Prevention**: Frame validation and integrity checks during recording

### Playback Errors

- **Missing Data**: Interpolation algorithms for incomplete frame data
- **Version Compatibility**: Migration system for replays from different game versions
- **Rendering Failures**: Fallback to simplified visuals if full fidelity fails
- **Seek Errors**: Boundary checking and safe frame navigation

### Storage Errors

- **Quota Exceeded**: Automatic cleanup suggestions and manual management tools
- **File Corruption**: Validation and repair attempts for damaged replay files
- **Import Failures**: Format detection and conversion for incompatible files
- **Network Issues**: Offline-first design with sync capabilities when available

## Testing Strategy

### Unit Testing

- **ReplayRecorder**: Frame capture accuracy, performance impact measurement
- **ReplayPlayback**: State reconstruction fidelity, playback control precision
- **CameraController**: Movement calculations, mode transitions, path interpolation
- **ReplayStorage**: Data persistence, compression efficiency, metadata handling
- **ReplayEditor**: Segment operations, highlight generation, export functionality

### Integration Testing

- **Recording Integration**: Full gameplay recording with all game modes and features
- **Playback Integration**: Complete replay viewing with all camera modes and controls
- **Storage Integration**: End-to-end save/load cycles with various replay sizes
- **UI Integration**: All replay controls and interfaces working with game UI

### Performance Testing

- **Recording Overhead**: FPS impact measurement during various gameplay scenarios
- **Memory Usage**: Frame data accumulation and cleanup efficiency
- **Playback Performance**: Smooth replay rendering at various speeds and qualities
- **Storage Efficiency**: Compression ratios and access times for different replay sizes

### Compatibility Testing

- **Browser Support**: Cross-browser replay functionality and storage capabilities
- **Device Performance**: Mobile and desktop replay performance characteristics
- **Version Migration**: Replay compatibility across game version updates
- **File Format**: Export/import compatibility with external tools and platforms

## Performance Considerations

### Recording Optimization

- **Differential Compression**: Only store changed data between frames
- **Adaptive Quality**: Reduce capture fidelity if performance impact detected
- **Background Processing**: Use Web Workers for data compression and storage
- **Memory Management**: Circular buffer for active recording with periodic cleanup

### Playback Optimization

- **Frame Caching**: Pre-load upcoming frames for smooth playback
- **LOD System**: Reduce detail for high-speed playback or distant camera views
- **Culling**: Skip rendering of off-screen elements during replay
- **Interpolation**: Smooth frame transitions for sub-frame seeking accuracy

### Storage Optimization

- **Compression**: LZ-string or similar for JSON data compression
- **Chunking**: Split large replays into manageable segments
- **Lazy Loading**: Load replay data on-demand rather than all at once
- **Cleanup**: Automatic removal of temporary data and old replays

This design provides a comprehensive foundation for implementing the replay system while maintaining the existing LightBikes architecture and performance characteristics.