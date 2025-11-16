# Game Features Integration for Online Multiplayer

This document describes the integration of existing game features (game modes, power-ups, and spectator mode) with the online multiplayer system.

## Overview

Task 6 of the online multiplayer implementation integrates three major feature sets:
1. **Game Modes** - Classic, Time Trial, and Arena Shrink modes adapted for multiplayer
2. **Power-Up Synchronization** - Server-authoritative power-up spawning and effects
3. **Spectator Mode** - Allows players to watch ongoing games

## Components

### 1. GameModeManager (server/GameModeManager.js)

Manages different game modes with synchronized server-side logic.

#### Supported Modes

**Classic Mode**
- Last player standing wins
- Standard elimination gameplay
- No special mechanics

**Time Trial Mode**
- Players compete for longest survival time
- Tracks individual survival times
- Winner determined by longest survival when all players crash

**Arena Shrink Mode**
- Arena boundaries shrink over time
- Configurable shrink intervals and amounts
- Broadcasts warnings before shrinking
- Forces player confrontation
- Combines survival time with elimination

#### Key Features

- Mode-specific win conditions
- Real-time state updates
- Synchronized game logic across all clients
- Mode-specific data in game state broadcasts

#### Usage

```javascript
const { GameModeManager, GameModes } = require('./GameModeManager');

// Create mode instance
const mode = GameModeManager.createMode(GameModes.ARENA_SHRINK, gameRoom);

// Initialize
mode.initialize(Date.now());

// Update each frame
mode.update(currentTime, gameState);

// Check win condition
const winResult = mode.checkWinCondition(gameState);
if (winResult) {
    // Game ended
    console.log('Winner:', winResult.winner);
    console.log('Reason:', winResult.reason);
}
```

### 2. PowerUpSynchronizer (server/PowerUpSynchronizer.js)

Server-authoritative power-up management ensuring fair distribution and synchronized effects.

#### Power-Up Types

**Speed Boost**
- 2x speed multiplier
- 3 second duration
- Replaces existing speed boosts

**Shield**
- Protects from one collision
- Permanent until consumed
- Multiple shields can stack

**Trail Eraser**
- Removes last 10 trail segments
- Instant effect
- No duration

**Ghost Mode**
- Pass through trails
- 3 second duration
- Doesn't protect from boundaries

#### Key Features

- Authoritative spawning (server-controlled)
- Fair spawn positioning (distance checks)
- Synchronized collection detection
- Effect application and expiration
- Collision protection integration
- Variety cycling (avoids spawning same type repeatedly)

#### Spawn Configuration

```javascript
{
    maxActivePowerUps: 3,
    spawnInterval: { min: 15000, max: 20000 }, // 15-20 seconds
    minDistanceFromBoundary: 5,
    minDistanceFromPlayers: 3,
    minDistanceFromTrails: 1,
    powerUpLifetime: 30000, // 30 seconds
    collectionRadius: 0.5
}
```

#### Usage

```javascript
const { PowerUpSynchronizer } = require('./PowerUpSynchronizer');

// Create synchronizer
const powerUpSync = new PowerUpSynchronizer(gameRoom);

// Initialize
powerUpSync.initialize();

// Update each frame
powerUpSync.update(currentTime, gameState);

// Check effects
const speedMultiplier = powerUpSync.getSpeedMultiplier(playerId, currentTime);
const isGhost = powerUpSync.isInGhostMode(playerId, currentTime);
const hasShield = powerUpSync.hasShield(playerId, currentTime);

// Consume shield on collision
if (collisionDetected && hasShield) {
    powerUpSync.consumeShield(playerId);
}
```

### 3. SpectatorManager (server/SpectatorManager.js)

Manages spectators who can watch ongoing games without participating.

#### Features

**Camera Modes**
- Free camera - Manual control
- Follow player - Track specific player
- Overview - Bird's eye view

**Spectator Chat**
- Separate from player chat
- Spectator-only communication
- Can be enabled/disabled

**State Updates**
- Throttled updates (~30fps for spectators)
- Full game state visibility
- Real-time game events

#### Configuration

```javascript
{
    maxSpectators: 10,
    spectatorUpdateInterval: 33, // ~30fps
    spectatorChatEnabled: true
}
```

#### Usage

```javascript
const { SpectatorManager } = require('./SpectatorManager');

// Create manager
const spectatorManager = new SpectatorManager(gameRoom);

// Add spectator
const result = spectatorManager.addSpectator(socket, { name: 'Spectator 1' });

// Update spectators
spectatorManager.update(currentTime);

// Notify spectators of events
spectatorManager.notifySpectators('playerEliminated', { playerId: 'player1' });

// Handle game events
spectatorManager.onGameStart();
spectatorManager.onGameEnd(winnerId, finalState);
```

## Integration with GameRoom

All three systems are integrated into the GameRoom class:

```javascript
// Initialization
this.gameModeInstance = GameModeManager.createMode(this.settings.gameMode, this);
this.powerUpSync = new PowerUpSynchronizer(this);
this.spectatorManager = new SpectatorManager(this);

// Game loop update
this.gameModeInstance.update(currentTime, this.gameState);
this.powerUpSync.update(currentTime, this.gameState);
this.spectatorManager.update(currentTime);

// State broadcasting
networkState.modeState = this.gameModeInstance.getModeState(currentTime);
networkState.powerUps = this.powerUpSync.getAllPowerUps();
networkState.effects = this.powerUpSync.getAllEffects(currentTime);

// Collision detection with power-ups
const isGhost = this.powerUpSync.isInGhostMode(playerId, currentTime);
const hasShield = this.powerUpSync.hasShield(playerId, currentTime);

// Speed multiplier in movement
const speedMultiplier = this.powerUpSync.getSpeedMultiplier(playerId, currentTime);
playerState.position.x += playerState.direction.x * this.gameSpeed * speedMultiplier;
```

## Network Protocol

### Game Mode Events

```javascript
// Mode-specific state in game state broadcast
{
    modeState: {
        mode: 'arenaShrink',
        currentSize: 28,
        bounds: { minX: -14, maxX: 14, minZ: -14, maxZ: 14 },
        nextShrinkTime: 1234567890,
        shrinkCount: 1,
        survivalTimes: { player1: 15000, player2: 14500 }
    }
}

// Arena shrink warning
socket.emit('arenaShrinkWarning', {
    timeUntilShrink: 3000,
    currentSize: 30,
    nextSize: 28
});

// Arena shrunk event
socket.emit('arenaShrunk', {
    newSize: 28,
    shrinkCount: 1,
    bounds: { ... }
});
```

### Power-Up Events

```javascript
// Power-up spawned
socket.emit('powerUpSpawned', {
    powerUp: {
        id: 'powerup_1',
        type: 'SPEED_BOOST',
        position: { x: 5, y: 0, z: 5 },
        spawnTime: 1234567890
    }
});

// Power-up collected
socket.emit('powerUpCollected', {
    playerId: 'player1',
    powerUpId: 'powerup_1',
    powerUpType: 'SPEED_BOOST',
    effects: [
        { type: 'SPEED_BOOST', remainingTime: 3000, data: { multiplier: 2.0 } }
    ]
});

// Effect expired
socket.emit('effectExpired', {
    playerId: 'player1',
    effectType: 'SPEED_BOOST'
});

// Shield consumed
socket.emit('shieldConsumed', {
    playerId: 'player1'
});
```

### Spectator Events

```javascript
// Join as spectator
socket.emit('joinAsSpectator', { name: 'Spectator 1' });

// Spectator join success
socket.emit('spectatorJoinSuccess', {
    spectator: { socketId: 'spec1', name: 'Spectator 1', cameraMode: 'free' },
    roomData: { ... }
});

// Spectator game state (throttled to ~30fps)
socket.emit('spectatorGameState', {
    timestamp: 1234567890,
    players: { ... },
    powerUps: [ ... ],
    effects: { ... },
    modeState: { ... }
});

// Spectator camera control
socket.emit('spectatorSetCamera', { mode: 'follow', playerId: 'player1' });
socket.emit('spectatorFollowPlayer', 'player1');

// Spectator chat
socket.emit('spectatorChat', 'Great game!');
```

## Testing

Comprehensive integration tests are provided in `server/game-features-integration.test.js`:

- Game mode creation and initialization
- Win condition checking for each mode
- Arena shrinking mechanics
- Power-up spawning and collection
- Effect application and expiration
- Shield consumption
- Spectator management
- Camera mode changes
- Integration between systems

Run tests:
```bash
npx jest server/game-features-integration.test.js
```

## Requirements Coverage

### Requirement 6.1 (Game Modes)
✅ Classic mode adapted for multiplayer
✅ Time Trial mode with survival tracking
✅ Arena Shrink mode with dynamic boundaries
✅ Synchronized game mode logic across clients
✅ Mode-specific configurations

### Requirement 6.2 (Power-Ups)
✅ Server-side power-up spawning
✅ Synchronized collection detection
✅ Fair power-up distribution
✅ Effect synchronization across clients
✅ Collision protection integration

### Requirement 6.5 (Spectator Mode)
✅ Spectator functionality for waiting players
✅ Multiple camera modes (free, follow, overview)
✅ Spectator chat system
✅ Real-time game state updates
✅ Spectator limit enforcement

## Performance Considerations

- **Game Modes**: Minimal overhead, only active mode updates
- **Power-Ups**: Spatial partitioning for efficient collision detection (not yet implemented but designed for)
- **Spectators**: Throttled updates (30fps vs 60fps for players) to reduce bandwidth
- **Memory**: Object pooling for power-up entities (designed but not critical for server)

## Future Enhancements

1. **Game Modes**
   - Custom mode configurations
   - Mode voting system
   - Hybrid modes (combine mechanics)

2. **Power-Ups**
   - Additional power-up types
   - Power-up rarity system
   - Custom spawn patterns

3. **Spectators**
   - Spectator controls (pause, rewind for replays)
   - Picture-in-picture for multiple players
   - Spectator betting/predictions
   - Replay system integration

## Conclusion

The game features integration successfully adapts existing single-player features for online multiplayer while maintaining server authority and fair gameplay. All systems are fully tested and ready for client-side integration.
