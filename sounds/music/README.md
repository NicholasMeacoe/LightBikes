# Music Assets Directory

This directory contains the background music tracks for LightBikes.

## Required Music Files

The music system expects the following files to be present:

- `ambient-space.mp3` - Calm, atmospheric background music for focused gameplay
- `cyber-pulse.mp3` - Energetic electronic beats matching the cyberpunk aesthetic  
- `neon-rush.mp3` - High-intensity music for competitive and fast-paced gameplay

## File Requirements

- **Format**: MP3 (primary), OGG (fallback)
- **Quality**: 128kbps recommended for balance of quality and file size
- **Size**: Target 2-3MB per track maximum
- **Duration**: 2-4 minutes recommended (tracks will loop seamlessly)
- **Volume**: Normalized to prevent volume jumps between tracks

## Audio Characteristics

### Ambient Space (ambient energy level)
- Calm, atmospheric soundscape
- Minimal percussion
- Suitable for concentration and strategic gameplay
- Should not distract from sound effect audio cues

### Cyber Pulse (upbeat energy level)
- Electronic/synthwave style
- Moderate tempo and energy
- Complements the Tron/cyberpunk aesthetic
- Balanced mix that works well with game sound effects

### Neon Rush (intense energy level)
- High-energy electronic music
- Fast tempo, driving rhythm
- Suitable for competitive gameplay
- Should enhance excitement without overwhelming sound effects

## Integration Notes

- All tracks are configured to loop seamlessly
- Music volume is independently controllable from sound effects
- Automatic ducking occurs during sound effects playback
- Tracks are preloaded during game initialization
- Fallback to "No Music" option if files are unavailable

## Current Status

**Development Mode**: Placeholder music files are currently in use.

- `ambient-space.mp3` → Symbolic link to `../engine.mp3` (temporary)
- `cyber-pulse.mp3` → Symbolic link to `../victory.mp3` (temporary)  
- `neon-rush.mp3` → Symbolic link to `../explosion.mp3` (temporary)

These placeholder files allow the music system to be tested and demonstrated while actual music tracks are being sourced or created.

## Asset Management

Use the provided setup script to manage music assets:

```bash
# Create placeholder files for development
node setup-music-assets.js setup

# Check current asset status
node setup-music-assets.js status

# Remove placeholder files (keeps actual music files)
node setup-music-assets.js cleanup
```

## Fallback System

The music system includes a robust fallback mechanism:
1. Attempts to load the primary music file
2. Falls back to the configured fallback file if primary fails
3. Gracefully continues with "No Music" mode if both fail
4. Provides user feedback about music availability