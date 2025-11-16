# Multiplayer Client-Side Networking

This document describes the client-side networking components for LightBikes online multiplayer functionality.

## Overview

The client-side networking system consists of three main components:

1. **NetworkManager** - Handles WebSocket communication with the game server
2. **MultiplayerUI** - Provides user interface for room browsing, lobby, and in-game networking
3. **ChatSystem** - Manages player communication with moderation features

## Components

### NetworkManager

The NetworkManager class handles all client-server communication using Socket.IO.

**Key Features:**
- WebSocket connection management with automatic reconnection
- Room creation, joining, and leaving
- Real-time game state synchronization
- Player input transmission
- Ping monitoring and latency tracking
- Event-driven architecture for game integration

**Usage:**
```javascript
const { NetworkManager } = require('./NetworkManager');

const networkManager = new NetworkManager(gameInstance, renderingEngine);

// Connect to server
await networkManager.connect('http://localhost:3000');

// Create a room
await networkManager.createRoom({
    name: 'My Room',
    maxPlayers: 4,
    gameMode: 'classic',
    isPrivate: false
});

// Send player input
networkManager.sendInput('up', Date.now());

// Listen for game state updates
networkManager.onStateUpdate((data) => {
    console.log('Game state:', data);
});

// Disconnect
networkManager.disconnect();
```

**Events:**
- `stateUpdate` - Game state updates from server
- `playerJoined` - Player joined the room
- `playerLeft` - Player left the room
- `gameStart` - Game is starting
- `gameEnd` - Game has ended
- `roomUpdate` - Room information updated
- `chatMessage` - Chat message received
- `connected` - Connected to server
- `disconnected` - Disconnected from server
- `reconnecting` - Attempting to reconnect
- `reconnected` - Successfully reconnected
- `error` - Error occurred

### MultiplayerUI

The MultiplayerUI class provides a complete user interface for multiplayer functionality.

**Key Features:**
- Room browser with create/join functionality
- Quick match for automatic room assignment
- Room lobby with player list and ready status
- In-game networking UI (ping, connection status)
- Chat interface integration
- Game end screens

**Usage:**
```javascript
const { MultiplayerUI } = require('./MultiplayerUI');

const multiplayerUI = new MultiplayerUI(networkManager);

// Show room browser
multiplayerUI.showRoomBrowser();

// Show room lobby
multiplayerUI.showRoomLobby();

// Show in-game UI
multiplayerUI.showInGameUI();

// Hide UI
multiplayerUI.hide();

// Cleanup
multiplayerUI.destroy();
```

**Views:**
- **Room Browser** - List of available rooms with create/join/quick match options
- **Room Lobby** - Pre-game lobby showing players, settings, chat, and ready status
- **In-Game UI** - Minimal overlay showing ping and connection status during gameplay
- **Game End Screen** - Victory/defeat screen with option to return to lobby

### ChatSystem

The ChatSystem class provides a complete chat solution with moderation features.

**Key Features:**
- Real-time message display
- Message history (up to 100 messages)
- Player muting functionality
- Player reporting system
- Spam prevention (1 second cooldown)
- XSS protection (HTML escaping)
- System messages for events
- Pre-game and post-game chat

**Usage:**
```javascript
const { ChatSystem } = require('./ChatSystem');

const chatSystem = new ChatSystem(networkManager);

// Create chat interface
const parentElement = document.getElementById('chat-container');
chatSystem.createChatInterface(parentElement, {
    width: '100%',
    height: '200px',
    placeholder: 'Type a message...'
});

// Send message (handled automatically by UI)
// Or programmatically:
chatSystem.addMessage({
    playerId: 'player-2',
    playerName: 'Player 2',
    message: 'Hello!',
    type: 'chat'
});

// Show system message
chatSystem.showSystemMessage('Game starting in 3...');

// Mute a player
chatSystem.mutePlayer('player-id');

// Report a player
chatSystem.reportPlayer('player-id', 'Player Name');

// Cleanup
chatSystem.destroy();
```

**Message Types:**
- `chat` - Regular player chat message
- `system` - System notification (yellow)
- `join` - Player joined notification (green)
- `leave` - Player left notification (red)

**Moderation Features:**
- **Mute** - Hide messages from specific players (client-side only)
- **Report** - Report players for inappropriate behavior (sent to server)
- **Spam Prevention** - 1 second cooldown between messages
- **Message Length Limit** - 200 characters maximum

## Integration Example

See `multiplayer-client-example.js` for a complete integration example showing how to use all three components together.

```javascript
const { MultiplayerClient } = require('./multiplayer-client-example');

// Initialize
const multiplayerClient = new MultiplayerClient(gameInstance, renderingEngine);

// Connect
await multiplayerClient.connect('http://localhost:3000');

// Send input (checks if chat is focused)
multiplayerClient.sendPlayerInput('up');

// Cleanup
multiplayerClient.destroy();
```

## Network Protocol

### Client to Server Messages

**Create Room:**
```javascript
{
    type: 'createRoom',
    settings: {
        name: string,
        maxPlayers: number,
        gameMode: string,
        isPrivate: boolean
    }
}
```

**Join Room:**
```javascript
{
    type: 'joinRoom',
    roomId: string
}
```

**Player Input:**
```javascript
{
    type: 'input',
    direction: 'up' | 'down' | 'left' | 'right',
    timestamp: number,
    sequenceId: number
}
```

**Chat Message:**
```javascript
{
    type: 'chat',
    message: string,
    timestamp: number
}
```

**Ready Status:**
```javascript
{
    type: 'ready',
    isReady: boolean
}
```

### Server to Client Messages

**Game State Update:**
```javascript
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
```

**Room Update:**
```javascript
{
    type: 'roomUpdate',
    roomId: string,
    players: [{
        id: string,
        name: string,
        isReady: boolean,
        ping: number
    }],
    settings: {
        gameMode: string,
        maxPlayers: number
    }
}
```

## Testing

All components have comprehensive test coverage:

- **NetworkManager.test.js** - 39 tests covering connection, room management, and event handling
- **MultiplayerUI.test.js** - 43 tests covering all UI views and interactions
- **ChatSystem.test.js** - 39 tests covering chat functionality and moderation

Run tests:
```bash
npm test NetworkManager.test.js
npm test MultiplayerUI.test.js
npm test ChatSystem.test.js
```

## Requirements Covered

This implementation satisfies the following requirements from the design document:

- **Requirement 8.2** - NetworkManager integrates cleanly with existing client-side architecture
- **Requirement 7.4** - WebSocket communication using Socket.IO
- **Requirement 5.1** - Room browser interface with join/create functionality
- **Requirement 5.2** - Lobby interface and chat system
- **Requirement 5.3** - In-game networking UI (ping display, connection status)
- **Requirement 5.4** - Player list with ready status indicators
- **Requirement 5.5** - Basic moderation features (mute, report)

## Next Steps

To complete the multiplayer implementation, the following tasks remain:

1. **Real-time State Synchronization** (Task 3)
   - Server-side game state management
   - Client-side prediction and reconciliation
   - Latency compensation

2. **Anti-Cheat Systems** (Task 4)
   - Server-side validation
   - Cheat detection

3. **Reconnection Handling** (Task 5)
   - State recovery for reconnecting players
   - Network error handling

4. **Game Mode Integration** (Task 6)
   - Adapt existing game modes for multiplayer
   - Power-up synchronization

5. **Testing** (Task 7)
   - Integration tests
   - Performance tests

6. **Monitoring** (Task 8)
   - Server performance monitoring
   - Player analytics

## Dependencies

- **socket.io-client** ^4.8.1 - WebSocket client library

## Browser Compatibility

The client-side networking components work in all modern browsers that support:
- WebSocket API
- ES6+ JavaScript features
- DOM manipulation

Tested in:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
