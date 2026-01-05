# Sound Effects Implementation Plan

- [x] 1. Create AudioManager class and basic infrastructure

  - Create `audio.js` file with AudioManager class following CommonJS export pattern
  - Implement constructor with initial state properties (audioContext, sounds, isMuted, etc.)
  - Add basic error handling structure for audio operations
  - _Requirements: 6.1, 6.2, 7.1, 7.2_

- [x] 2. Implement audio initialization and preloading system

  - [x] 2.1 Create audio context initialization with lazy loading

    - Implement `initialize()` method that creates Web Audio API context on first user interaction
    - Add browser compatibility checks and fallback handling
    - _Requirements: 6.5, 6.2_

  - [x] 2.2 Build sound preloading system

    - Create `preloadSounds()` method to load all audio files during initialization
    - Implement error handling for failed audio file loads that doesn't crash the game
    - Add support for MP3/OGG format fallbacks for browser compatibility
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 2.3 Write unit tests for initialization
    - Create `audio.test.js` with mocked Web Audio API
    - Test initialization, preloading, and error handling scenarios
    - _Requirements: 7.4_

- [x] 3. Implement core sound playback functionality

  - [x] 3.1 Create turn sound effect system

    - Implement `playTurnSound()` method with spam prevention (max once per direction change)
    - Add cooldown mechanism to prevent overlapping turn sounds
    - Ensure brief duration (< 0.5 seconds) and distinct audio characteristics
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 3.2 Implement engine background audio

    - Create `startEngineSound()` and `stopEngineSound()` methods for looping engine audio
    - Add smooth looping without gaps and pause/resume functionality
    - Implement audio that starts with game and continues during direction changes
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.3 Build explosion and outcome sound effects

    - Implement `playExplosionSound()` that interrupts engine audio and has 1-2 second duration
    - Create `playVictorySound()` and `playDefeatSound()` methods that play after explosion completes
    - Ensure explosion sound is louder than other game sounds and stops all audio when finished
    - Make victory and defeat sounds clearly distinguishable from each other
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 3.4 Write unit tests for sound playback
    - Test all sound playback methods with mocked audio context
    - Verify spam prevention, looping behavior, and sound sequencing
    - _Requirements: 7.4_

- [x] 4. Implement mute functionality and persistence

  - [x] 4.1 Create mute toggle system

    - Implement `setMuted()` and `getMuted()` methods for mute state management
    - Add functionality to stop all audio when muted and resume appropriate audio when unmuted
    - _Requirements: 5.2, 5.3_

  - [x] 4.2 Add mute button to game interface

    - Create mute toggle button in `index.html` with clear visual indication of mute state
    - Wire button to AudioManager mute functionality through main orchestrator
    - _Requirements: 5.1, 5.5_

  - [x] 4.3 Implement mute state persistence

    - Add localStorage integration to save and restore mute state across sessions
    - Load saved mute state during AudioManager initialization
    - _Requirements: 5.4_

  - [x] 4.4 Write tests for mute functionality
    - Test mute toggle, persistence, and UI integration
    - Mock localStorage for reliable testing
    - _Requirements: 7.4_

- [x] 5. Integrate AudioManager with existing game architecture

  - [x] 5.1 Add AudioManager to main orchestrator

    - Import AudioManager in `script.js` and initialize during game setup
    - Integrate audio state management with existing game loop without blocking updates
    - _Requirements: 7.1, 7.2_

  - [x] 5.2 Connect audio triggers to game events

    - Wire direction changes from controls to turn sound playback
    - Connect game start/pause/resume events to engine audio control
    - Link collision detection to explosion sound and game outcome to victory/defeat sounds
    - _Requirements: 7.3, 1.1, 1.2, 2.1, 2.4, 3.1, 4.1, 4.2_

  - [x] 5.3 Implement game state response handlers

    - Create `handleGameStart()`, `handleGamePause()`, `handleGameResume()`, and `handleGameEnd()` methods
    - Ensure AudioManager responds appropriately to all game state changes
    - _Requirements: 7.3, 2.4_

  - [x] 5.4 Write integration tests
    - Test AudioManager integration with game loop and state management
    - Verify audio triggers work correctly with existing game events
    - _Requirements: 7.4_

- [x] 6. Add audio assets and finalize implementation

  - [x] 6.1 Create audio asset files

    - Add placeholder audio files (turn.mp3, engine.mp3, explosion.mp3, victory.mp3, defeat.mp3) in sounds directory
    - Ensure files are optimized for web delivery (< 100KB for effects, < 500KB for engine loop)
    - _Requirements: 6.3_

  - [x] 6.2 Implement performance optimizations

    - Add concurrent audio playback limits to prevent performance degradation
    - Implement efficient audio buffer management and cleanup
    - _Requirements: 6.4_

  - [x] 6.3 Add comprehensive error handling

    - Ensure graceful handling of all audio loading and playback failures
    - Add browser compatibility fallbacks and autoplay policy compliance
    - _Requirements: 6.2, 6.5_

  - [x] 6.4 Final testing and coverage verification
    - Run full test suite and ensure 95%+ coverage target is maintained
    - Test cross-browser compatibility and performance impact
    - _Requirements: 7.4_
