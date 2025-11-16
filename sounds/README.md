# Audio Assets

This directory contains the audio files for the LightBikes game.

## Required Audio Files

### Sound Effects (< 100KB each)
- `turn.mp3` - Brief sound effect for direction changes (< 0.5 seconds)
- `explosion.mp3` - Dramatic collision sound effect (1-2 seconds)
- `victory.mp3` - Victory sound effect played after explosion
- `defeat.mp3` - Defeat sound effect played after explosion

### Background Audio (< 500KB)
- `engine.mp3` - Looping engine sound for continuous gameplay

## Audio Specifications

### Format Requirements
- Primary format: MP3 for broad browser compatibility
- Fallback format: OGG for browsers preferring open formats
- Web-optimized compression for fast loading

### Technical Requirements
- Turn sound: Brief (< 0.5s), distinct characteristics
- Engine sound: Seamless looping, no gaps or clicks
- Explosion sound: Louder than other sounds, 1-2 second duration
- Victory/Defeat sounds: Clearly distinguishable from each other

## Implementation Notes

The AudioManager class will attempt to load these files during initialization.
If files are missing, the game will continue to function normally without audio,
with appropriate error handling and user feedback.

## Placeholder Status

Currently, this directory contains placeholder files for development.
Replace these with actual audio assets for production deployment.