# Online Multiplayer Design

## Overview

The online multiplayer system transforms LightBikes from a single-player vs AI game into a competitive multiplayer experience. The architecture uses a client-server model with WebSocket communication for real-time gameplay, authoritative server validation for anti-cheat protection, and sophisticated state synchronization to handle network latency.

The system maintains the existing game's core mechanics while adding networking layers that ensure fair, responsive multiplayer gameplay across different network conditions.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    WebSocket     ┌─────────────────┐
│   Game Client   │ ◄──────────────► │   Game Server   │
│                 │                  │                 │
│ • Renderer      │                  │ • Room Manager  │
│ • Input Handler │                  │ • State Sync    │
│ • Network Mgr   │                  │ • Anti-Cheat    │
│ • Prediction    │                  │ • Matchmaking   │
└─────────────────┘                  └─────────────────┘
```

### Client-Server Communication Model

**Authoritative Server**: The server maintains the canonical game state and validates all client actions. Clients send input commands and receive authoritative state updates.

**Client-Side Prediction**: Clients immediately apply their own inputs locally for responsive controls, then reconcile with server state when updates arrive.

**State Synchronization**: The server broadcasts game state at 60Hz to all clients, including player positions, trail segments, and game events.

### Network Protocol

- **Transport**: WebSocket (Socket.IO) for bidirectional real-time communication
- **Message Format**: JSON for human-readable debugging and easy parsing
- **Update Rate**: 60Hz for game state, immediate for critical events (collisions, game end)
- **Compression**: Socket.IO built-in compression for bandwidth optimization

## Components and Interfaces

### Client-Side Components

#### NetworkManager
```javascript
class NetworkManager {
    constructor(gameInstance, renderingEngine)
    
    // Connection management
    connect(serverUrl)
    disconnect()
    
    // Room operations
    createRoom(settings)
    joinRoom(roomId)
    leaveRoom()
    
    // Game communication
    sendInput(direction, timestamp)
    sendChatMessage(message)
    sendReadyStatus(isReady)
    
    // Event handlers
    onStateUpdate(callback)
    onPlayerJoined(callback)
    onPlayerLeft(callback)
    onGameStart(callback)
    onGameEnd(callback)
}
```

**Design Rationale**: Centralized network communication keeps networking concerns separate from game logic, making the system easier to test and maintain.

#### ClientPrediction
```javascript
class ClientPrediction {
    constructor(gameInstance)
    
    // Prediction management
    applyInput(input, timestamp)
    reconcileWithServer(serverState, timestamp)
    rollbackAndReplay(fromTimestamp)
    
    // State management
    saveSnapshot(timestamp)
    getSnapshot(timestamp)
    clearOldSnapshots(beforeTimestamp)
}
```

**Design Rationale**: Separate prediction system allows for sophisticated lag compensation without complicating the core game logic.

#### MultiplayerUI
```javascript
class MultiplayerUI {
    constructor(networkManager)
    
    // Room interface
    showRoomBrowser()
    showRoomLobby(roomData)
    updatePlayerList(players)
    
    // Game interface
    showLatencyInfo(ping)
    showChatInterface()
    showReconnectionStatus()
    
    // Event handling
    onCreateRoom(callback)
    onJoinRoom(callback)
    onSendChat(callback)
}
```

### Server-Side Components

#### GameServer
```javascript
class GameServer {
    constructor(port)
    
    // Server lifecycle
    start()
    stop()
    
    // Connection management
    onConnection(socket)
    onDisconnection(socket)
    
    // Room management
    createRoom(hostSocket, settings)
    joinRoom(socket, roomId)
    removePlayerFromRoom(socket)
}
```

#### GameRoom
```javascript
class GameRoom {
    constructor(id, settings)
    
    // Player management
    addPlayer(socket, playerData)
    removePlayer(socket)
    handleReconnection(socket, playerId)
    
    // Game lifecycle
    startGame()
    endGame(winner)
    resetGame()
    
    // State management
    updateGameState(deltaTime)
    broadcastState()
    validatePlayerInput(playerId, input)
    
    // Anti-cheat
    validateMovement(playerId, newPosition)
    detectSuspiciousActivity(playerId, action)
}
```

**Design Rationale**: Each room is an isolated game instance, allowing for different game modes and settings while maintaining server performance.

#### AntiCheatValidator
```javascript
class AntiCheatValidator {
    constructor(gameRoom)
    
    // Movement validation
    validatePosition(playerId, position, timestamp)
    validateDirection(playerId, direction, timestamp)
    validateSpeed(playerId, distance, deltaTime)
    
    // Pattern detection
    detectSpeedHacking(playerId, movements)
    detectTeleportation(playerId, positions)
    detectCollisionBypass(playerId, position, trails)
    
    // Action handling
    flagSuspiciousActivity(playerId, violation)
    disconnectCheater(playerId, reason)
}
```

## Data Models

### Network Messages

#### Client to Server Messages
```javascript
// Input command
{
    type: 'input',
    direction: 'up' | 'down' | 'left' | 'right',
    timestamp: number,
    sequenceId: number
}

// Room operations
{
    type: 'createRoom',
    settings: {
        maxPlayers: number,
        gameMode: string,
        isPrivate: boolean
    }
}

{
    type: 'joinRoom',
    roomId: string
}

// Chat message
{
    type: 'chat',
    message: string,
    timestamp: number
}
```

#### Server to Client Messages
```javascript
// Game state update
{
    type: 'gameState',
    timestamp: number,
    players: [{
        id: string,
        position: { x: number, y: number },
        direction: string,
        trail: [{ x: number, y: number }],
        isAlive: boolean
    }],
    gameStatus: 'waiting' | 'playing' | 'ended',
    winner: string | null
}

// Room update
{
    type: 'roomUpdate',
    roomId: string,
    players: [{
        id: string,
        name: string,
        isReady: boolean,
        ping: number
    }],
    settings: object
}
```

### Game State Synchronization

**State Snapshot Structure**:
```javascript
{
    timestamp: number,
    frameNumber: number,
    players: Map<playerId, {
        position: Vector2,
        direction: Direction,
        trail: TrailSegment[],
        isAlive: boolean,
        lastInputTime: number
    }>,
    gamePhase: 'lobby' | 'countdown' | 'playing' | 'ended',
    winner: playerId | null
}
```

**Design Rationale**: Immutable state snapshots enable easy rollback for client prediction and provide clear audit trails for debugging desynchronization issues.

## Error Handling

### Network Error Recovery

#### Connection Loss Handling
- **Automatic Reconnection**: Exponential backoff (1s, 2s, 4s, 8s, max 30s)
- **State Recovery**: Server maintains player state for 30 seconds during disconnection
- **Graceful Degradation**: Show offline mode option if reconnection fails

#### Desynchronization Recovery
- **State Validation**: Client validates received server state against predictions
- **Automatic Correction**: Smooth interpolation to server state when discrepancies detected
- **Manual Resync**: Force full state refresh if automatic correction fails

### Anti-Cheat Error Handling

#### Validation Failures
- **Minor Violations**: Log and correct client state silently
- **Major Violations**: Disconnect player with explanation
- **Repeated Violations**: Temporary ban with escalating duration

#### False Positive Mitigation
- **Tolerance Thresholds**: Allow small discrepancies due to network jitter
- **Context Awareness**: Consider network conditions when validating actions
- **Appeal System**: Log detailed violation data for manual review

## Testing Strategy

### Unit Testing

#### Client-Side Tests
- **NetworkManager**: Mock WebSocket connections, test message handling
- **ClientPrediction**: Test rollback/replay logic with simulated network conditions
- **MultiplayerUI**: Test UI state changes and user interactions

#### Server-Side Tests
- **GameRoom**: Test game state management and player interactions
- **AntiCheatValidator**: Test validation logic with known cheat patterns
- **Matchmaking**: Test room creation, joining, and player management

### Integration Testing

#### Network Communication Tests
- **Message Flow**: Test complete client-server message cycles
- **State Synchronization**: Verify state consistency across multiple clients
- **Error Recovery**: Test reconnection and desynchronization recovery

#### Performance Tests
- **Concurrent Players**: Test server performance with maximum player load
- **Network Latency**: Test gameplay quality under various latency conditions
- **Memory Usage**: Monitor for memory leaks during extended gameplay

### End-to-End Testing

#### Multiplayer Scenarios
- **Room Lifecycle**: Complete flow from room creation to game completion
- **Player Interactions**: Multiple players joining, playing, and leaving
- **Network Conditions**: Test under packet loss, high latency, and jitter

#### Anti-Cheat Testing
- **Cheat Detection**: Verify detection of common cheat patterns
- **False Positive Rate**: Ensure legitimate players aren't incorrectly flagged
- **Performance Impact**: Measure anti-cheat system overhead

### Load Testing

#### Server Capacity
- **Concurrent Rooms**: Test maximum number of simultaneous game rooms
- **Player Connections**: Test maximum concurrent player connections
- **Message Throughput**: Test peak message handling capacity

#### Scalability Testing
- **Horizontal Scaling**: Test multiple server instances with load balancing
- **Database Performance**: Test player data and statistics storage under load
- **CDN Integration**: Test static asset delivery performance

## Performance Considerations

### Network Optimization

#### Bandwidth Management
- **State Compression**: Use delta compression for state updates
- **Selective Updates**: Only send changed data to reduce bandwidth
- **Priority Queuing**: Prioritize critical messages (collisions) over routine updates

#### Latency Compensation
- **Client Prediction**: Immediate input response for smooth controls
- **Lag Compensation**: Server-side rewinding for hit detection
- **Adaptive Update Rates**: Reduce update frequency for high-latency clients

### Server Performance

#### Memory Management
- **Object Pooling**: Reuse message objects to reduce garbage collection
- **State Cleanup**: Regularly clean up old game states and disconnected players
- **Room Lifecycle**: Properly dispose of completed game rooms

#### CPU Optimization
- **Efficient Collision Detection**: Spatial partitioning for large player counts
- **Batch Processing**: Group similar operations for better cache performance
- **Asynchronous Operations**: Non-blocking I/O for database and external services

### Client Performance

#### Rendering Optimization
- **Interpolation**: Smooth movement between network updates
- **Culling**: Don't render off-screen players and trails
- **LOD System**: Reduce detail for distant players

#### Memory Management
- **Trail Segment Pooling**: Reuse trail segment objects
- **Texture Sharing**: Share materials between player bikes
- **Garbage Collection**: Minimize object creation in game loop

## Security Considerations

### Anti-Cheat Measures

#### Server-Side Validation
- **Movement Validation**: Verify all player movements are physically possible
- **Collision Detection**: Authoritative collision detection prevents bypassing
- **Input Rate Limiting**: Prevent input flooding attacks

#### Pattern Detection
- **Statistical Analysis**: Monitor player behavior for impossible patterns
- **Machine Learning**: Adaptive detection of new cheat methods
- **Community Reporting**: Player reporting system with automated review

### Network Security

#### Connection Security
- **Rate Limiting**: Prevent connection flooding and DDoS attacks
- **Input Validation**: Sanitize all client inputs to prevent injection attacks
- **Authentication**: Secure player identification and session management

#### Data Protection
- **Encryption**: TLS encryption for all client-server communication
- **Privacy**: Minimal data collection with clear privacy policies
- **Compliance**: GDPR compliance for EU players

This design provides a robust foundation for online multiplayer functionality while maintaining the responsive, competitive gameplay that makes LightBikes engaging. The architecture balances performance, security, and maintainability to create a scalable multiplayer system.