# LightBikes Multiplayer Server

This directory contains the Node.js server infrastructure for LightBikes online multiplayer functionality.

## Architecture

The server uses a modular architecture with the following components:

### Core Components

- **GameServer** (`GameServer.js`): Main server class that manages WebSocket connections, room lifecycle, and player coordination
- **GameRoom** (`GameRoom.js`): Manages individual multiplayer game sessions with player management and game state
- **MatchmakingService** (`MatchmakingService.js`): Handles player matchmaking, room discovery, and filtering

### Features

- WebSocket-based real-time communication using Socket.IO
- Room-based multiplayer sessions (2-4 players)
- Quick-match and room browser functionality
- Player ready status and host controls
- Chat system for player communication
- Automatic room cleanup and host transfer
- Comprehensive logging system

## Getting Started

### Installation

Dependencies are already installed in the main project. The server uses:
- `socket.io` - WebSocket server
- `socket.io-client` - Client library (for testing)

### Running the Server

```bash
# Start the server
npm run server

# Start with auto-reload (requires nodemon)
npm run server:dev

# Custom port
PORT=8080 npm run server
```

### Environment Variables

- `PORT` - Server port (default: 3000)
- `LOG_LEVEL` - Logging level: error, warn, info, debug (default: info)

## API Events

### Client to Server

- `createRoom` - Create a new game room
- `joinRoom` - Join an existing room
- `leaveRoom` - Leave current room
- `quickMatch` - Find and join a room automatically
- `getRoomList` - Get list of available rooms
- `setReady` - Set player ready status
- `startGame` - Start the game (host only)
- `chat` - Send chat message

### Server to Client

- `connected` - Connection acknowledgment
- `roomCreated` - Room creation success
- `roomJoined` - Room join success
- `roomLeft` - Room leave confirmation
- `playerJoined` - Another player joined
- `playerLeft` - Another player left
- `playerReady` - Player ready status changed
- `gameStarting` - Game countdown started
- `gameStarted` - Game has begun
- `gameEnded` - Game finished
- `gameReset` - Room reset for new game
- `chat` - Chat message received
- `error` - Error occurred

## Room Settings

```javascript
{
  maxPlayers: 2-4,        // Maximum players in room
  gameMode: string,       // 'classic', 'timeTrial', 'arenaShrink'
  isPrivate: boolean      // Private rooms not shown in browser
}
```

## Testing

```bash
# Run all tests including server tests
npm test

# Run only server tests
npm test -- server/
```

## Development

### Adding New Features

1. Implement feature in appropriate component
2. Add corresponding tests
3. Update this README with new events/settings
4. Test with multiple clients

### Debugging

Set `LOG_LEVEL=debug` for verbose logging:

```bash
LOG_LEVEL=debug npm run server
```

## Architecture Decisions

### Why Socket.IO?

- Built-in reconnection handling
- Automatic fallback to long-polling
- Room management out of the box
- Wide browser compatibility

### Why Room-Based Architecture?

- Isolates game sessions for better performance
- Easier to manage player state
- Supports different game modes per room
- Simplifies matchmaking logic

### Why Authoritative Server?

- Prevents cheating through client manipulation
- Ensures consistent game state across clients
- Enables fair collision detection
- Required for competitive multiplayer

## Next Steps

This implementation covers task 1 (server infrastructure and basic networking). Future tasks will add:

- Real-time game state synchronization (task 3)
- Anti-cheat validation (task 4)
- Reconnection handling (task 5)
- Integration with existing game features (task 6)
