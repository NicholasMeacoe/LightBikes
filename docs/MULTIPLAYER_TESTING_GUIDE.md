# Online Multiplayer Testing Guide

## Overview

This document describes the comprehensive testing strategy for the online multiplayer system, covering unit tests, integration tests, and performance testing.

## Test Coverage Summary

### Unit Tests (Completed)

The following components have comprehensive unit test coverage:

1. **NetworkManager.test.js** - Client-side networking (39 tests, 76% coverage)
   - Connection management
   - Room operations (create, join, leave)
   - Input sending and chat
   - Event system
   - Ping monitoring
   - Error handling

2. **server/GameRoom.test.js** - Server-side room management (61 tests, 59% coverage)
   - Player management
   - Game state initialization
   - Game loop and updates
   - Input handling
   - Collision detection
   - Win condition checking
   - State broadcasting

3. **server/AntiCheatValidator.test.js** - Anti-cheat system (38 tests, 28% coverage)
   - Position validation
   - Direction validation
   - Speed validation
   - Teleportation detection
   - Collision bypass detection
   - Violation tracking and response

4. **ClientPrediction.test.js** - Client-side prediction
   - Input application
   - State snapshots
   - Server reconciliation
   - Rollback and replay

5. **LatencyCompensation.test.js** - Latency handling
   - State interpolation
   - Network statistics
   - Ping tracking

## Integration Testing

### Component Integration Tests

The existing unit tests already cover significant integration scenarios:

#### GameRoom + AntiCheatValidator Integration
```javascript
// Example from GameRoom.test.js
describe('Game State Management', () => {
    it('should validate player movements', () => {
        room.initializeGameState();
        const validator = new AntiCheatValidator(room);
        
        const player = room.gameState.players['player1'];
        const result = validator.validatePosition('player1', player.position, Date.now());
        
        expect(result.valid).toBe(true);
    });
});
```

#### NetworkManager + GameRoom Integration
The NetworkManager and GameRoom communicate through Socket.IO events:
- `createRoom` → `roomCreated`
- `joinRoom` → `roomUpdate`
- `input` → `gameState`
- `chat` → `chatMessage`

### Manual Integration Testing

For full end-to-end testing with real WebSocket connections:

1. **Start the server:**
```bash
cd server
node index.js
```

2. **Run the example client:**
```bash
node server/example-client.js
```

3. **Test scenarios:**
   - Multiple clients connecting
   - Room creation and joining
   - Game state synchronization
   - Chat functionality
   - Reconnection handling

## Performance Testing

### Load Testing Approach

#### Connection Performance
Test concurrent connections:
```javascript
// Create multiple clients
const clients = [];
for (let i = 0; i < 100; i++) {
    const client = new NetworkManager({}, {});
    await client.connect('http://localhost:3000');
    clients.push(client);
}

// Measure connection time and server response
```

#### Message Throughput
Test high-frequency message handling:
```javascript
// Send rapid inputs
for (let i = 0; i < 1000; i++) {
    client.sendInput('up', Date.now());
}

// Measure: messages/second, latency, packet loss
```

#### State Synchronization Performance
Test game loop performance:
```javascript
// Measure update rate
const updates = [];
client.onStateUpdate(state => {
    updates.push({ timestamp: Date.now(), frameNumber: state.frameNumber });
});

// After 1 second, verify ~60 updates received
// Calculate average interval (should be ~16.67ms)
```

### Performance Benchmarks

Target metrics for production:

| Metric | Target | Measurement |
|--------|--------|-------------|
| Connection Time | < 500ms | Time from connect() to connected event |
| State Update Rate | 60Hz ± 5Hz | Updates per second |
| Round-trip Latency | < 100ms | Ping measurement |
| Message Throughput | > 1000 msg/s | Messages processed per second |
| Concurrent Players | 100+ | Simultaneous connections |
| Concurrent Rooms | 25+ | Active game rooms |

### Performance Testing Tools

#### Built-in Monitoring
The server includes performance monitoring:
```javascript
const server = new GameServer(3000);
server.start();

// Monitor metrics
setInterval(() => {
    console.log('Active connections:', server.io.sockets.sockets.size);
    console.log('Active rooms:', server.rooms.size);
}, 5000);
```

#### External Tools
- **Artillery** - Load testing HTTP and WebSocket
- **Socket.IO Load Tester** - Specialized WebSocket testing
- **k6** - Modern load testing tool

Example Artillery config:
```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
  engines:
    socketio:
      transports: ["websocket"]

scenarios:
  - name: "Connect and play"
    engine: socketio
    flow:
      - emit:
          channel: "createRoom"
          data:
            maxPlayers: 4
            gameMode: "classic"
      - think: 1
      - emit:
          channel: "input"
          data:
            direction: "up"
            timestamp: "{{ $timestamp }}"
```

## Network Condition Testing

### Latency Simulation
Test with artificial latency:
```javascript
// Add delay to socket messages
const originalEmit = socket.emit;
socket.emit = function(...args) {
    setTimeout(() => {
        originalEmit.apply(socket, args);
    }, 100); // 100ms delay
};
```

### Packet Loss Simulation
Test with dropped messages:
```javascript
const originalEmit = socket.emit;
socket.emit = function(...args) {
    if (Math.random() > 0.1) { // 10% packet loss
        originalEmit.apply(socket, args);
    }
};
```

### Jitter Simulation
Test with variable latency:
```javascript
const originalEmit = socket.emit;
socket.emit = function(...args) {
    const delay = 50 + Math.random() * 100; // 50-150ms
    setTimeout(() => {
        originalEmit.apply(socket, args);
    }, delay);
};
```

## Test Execution

### Running All Tests
```bash
# Run all tests with coverage
npm test

# Run specific test suites
npm test -- NetworkManager.test.js
npm test -- server/GameRoom.test.js
npm test -- server/AntiCheatValidator.test.js
```

### Continuous Integration
Tests are designed to run in CI/CD pipelines:
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
```

## Test Maintenance

### Adding New Tests
When adding new multiplayer features:

1. **Write unit tests first** - Test individual components in isolation
2. **Add integration tests** - Test component interactions
3. **Document test scenarios** - Update this guide with new test cases
4. **Update benchmarks** - Adjust performance targets if needed

### Test Quality Guidelines
- Each test should be independent
- Use descriptive test names
- Mock external dependencies
- Clean up resources in afterEach/afterAll
- Aim for >80% code coverage
- Test both success and failure paths

## Known Limitations

1. **Full E2E Tests** - Require running server, better suited for manual testing
2. **Real Network Conditions** - Simulated in unit tests, real testing needs actual network
3. **Load Testing** - Requires dedicated performance testing environment
4. **Browser Testing** - Client code tested in Node.js environment (jsdom)

## Future Improvements

1. Add automated E2E tests with Playwright/Puppeteer
2. Implement continuous performance monitoring
3. Add chaos engineering tests (random failures)
4. Create visual regression tests for UI components
5. Add security penetration testing
6. Implement A/B testing framework for game balance

## References

- [Socket.IO Testing Guide](https://socket.io/docs/v4/testing/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Artillery Load Testing](https://www.artillery.io/docs)
- [WebSocket Testing Best Practices](https://www.ably.io/topic/websockets-testing)
