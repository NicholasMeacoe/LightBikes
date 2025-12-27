# Test Infrastructure Documentation

This directory contains shared testing utilities, mocks, helpers, and fixtures used across the test suite.

## Directory Structure

```
tests/
├── mocks/           # Mock factories for external dependencies
├── helpers/         # Testing utility functions
├── fixtures/        # Sample data for tests
└── unit/            # Unit test files
```

## Mocks

### `mocks/three.js`
Mock factory for Three.js objects. Provides lightweight mocks without full Three.js dependency.

**Available Mocks:**
- `createMockScene()` - Mock Scene object
- `createMockCamera(type)` - Mock Camera (Perspective/Orthographic)
- `createMockRenderer()` - Mock WebGLRenderer
- `createMockMesh(geometry, material)` - Mock Mesh
- `createMockMaterial(type)` - Mock Material
- `createMockGeometry(type)` - Mock Geometry
- `createMockLight(type)` - Mock Light
- `createMockVector3(x, y, z)` - Mock Vector3
- `createMockColor(r, g, b)` - Mock Color
- `createMockTexture()` - Mock Texture
- `createMockGroup()` - Mock Group
- `createMockRaycaster()` - Mock Raycaster

**Usage:**
```javascript
const { createMockScene, createMockCamera } = require('@mocks/three');

const scene = createMockScene();
const camera = createMockCamera('PerspectiveCamera');
```

### `mocks/audio.js`
Mock factory for Web Audio API. Provides mocks for audio testing.

**Available Mocks:**
- `createMockAudioContext()` - Mock AudioContext
- `createMockAudioBuffer(channels, length, sampleRate)` - Mock AudioBuffer
- `createMockAudioBufferSourceNode()` - Mock AudioBufferSourceNode
- `createMockGainNode()` - Mock GainNode
- `createMockPannerNode()` - Mock PannerNode
- `createMockAnalyserNode()` - Mock AnalyserNode
- `createMockBiquadFilterNode()` - Mock BiquadFilterNode
- `createMockAudioElement()` - Mock HTMLAudioElement

**Usage:**
```javascript
const { createMockAudioContext, createMockGainNode } = require('@mocks/audio');

const audioContext = createMockAudioContext();
const gainNode = createMockGainNode();
```

### `mocks/websocket.js`
Mock factory for WebSocket connections. Provides mocks for network testing.

**Available Mocks:**
- `createMockWebSocket(url)` - Mock WebSocket
- `createMockSocketIO(url)` - Mock Socket.io client socket
- `createMockServerSocket(id)` - Mock Socket.io server socket

**Usage:**
```javascript
const { createMockSocketIO } = require('@mocks/websocket');

const socket = createMockSocketIO('http://localhost:3000');
socket.simulateConnect();
socket.simulateMessage('gameStart', { players: [] });
```

## Helpers

### `helpers/dom.js`
DOM testing utilities for creating and manipulating DOM elements.

**Available Functions:**
- `createElement(tag, attrs, children)` - Create DOM element
- `createContainer(id)` - Create and attach container
- `cleanupContainer(container)` - Remove container
- `cleanupAllContainers()` - Remove all test containers
- `simulateEvent(element, eventType, props)` - Simulate DOM event
- `simulateKeyboardEvent(element, type, key, options)` - Simulate keyboard event
- `simulateMouseEvent(element, type, options)` - Simulate mouse event
- `simulateTouchEvent(element, type, touches)` - Simulate touch event
- `queryElement(container, selector)` - Query with error handling
- `waitForElement(container, selector, timeout)` - Wait for element to appear
- `isVisible(element)` - Check if element is visible
- `createMockCanvasContext()` - Mock canvas 2D context

**Usage:**
```javascript
const { createContainer, cleanupContainer, simulateEvent } = require('@helpers/dom');

let container;
beforeEach(() => {
    container = createContainer('test-container');
});

afterEach(() => {
    cleanupContainer(container);
});

test('button click', () => {
    const button = container.querySelector('button');
    simulateEvent(button, 'click');
});
```

### `helpers/async.js`
Async testing utilities for handling asynchronous operations.

**Available Functions:**
- `waitFor(condition, timeout, interval)` - Wait for condition
- `sleep(ms)` - Wait for time
- `flushPromises()` - Flush pending promises
- `nextTick()` - Wait for next tick
- `nextFrame()` - Wait for animation frame
- `waitFrames(count)` - Wait for multiple frames
- `createDeferred()` - Create deferred promise
- `retry(fn, maxAttempts, delay)` - Retry async operation
- `withTimeout(fn, timeout)` - Run with timeout
- `waitForEvent(emitter, event, timeout)` - Wait for event
- `waitForDOMEvent(element, event, timeout)` - Wait for DOM event
- `advanceTimers(ms)` - Advance Jest timers
- `createAsyncMock(value, delay)` - Create async mock function

**Usage:**
```javascript
const { waitFor, flushPromises } = require('@helpers/async');

test('async operation', async () => {
    const operation = startAsyncOperation();
    await waitFor(() => operation.isComplete(), 1000);
    expect(operation.result).toBe('success');
});
```

## Fixtures

### `fixtures/gameStates.js`
Sample game state objects for various scenarios.

**Available Fixtures:**
- `createBasicGameState()` - Basic game state
- `createGameStateWithTrails()` - Game state with trails
- `createGameOverState(winner)` - Game over state
- `createMultiplayerGameState(playerCount)` - Multiplayer state
- `createGameStateWithPowerUps()` - State with power-ups
- `createTimeTrialGameState()` - Time trial mode state
- `createArenaShrinkGameState()` - Arena shrink mode state
- `createNearCollisionGameState()` - Near collision scenario
- `createBoundaryGameState()` - At boundary scenario

**Usage:**
```javascript
const { createBasicGameState } = require('@fixtures/gameStates');

test('game logic', () => {
    const gameState = createBasicGameState();
    const result = processGameLogic(gameState);
    expect(result).toBeDefined();
});
```

### `fixtures/networkMessages.js`
Sample network message payloads for various scenarios.

**Available Fixtures:**
- `createPlayerJoinMessage(id, name)` - Player join
- `createPlayerLeaveMessage(id, reason)` - Player leave
- `createGameStartMessage(players, mode)` - Game start
- `createGameStateUpdateMessage(state)` - State update
- `createPlayerMoveMessage(id, direction)` - Player move
- `createCollisionMessage(id, type)` - Collision
- `createGameOverMessage(winner, scores)` - Game over
- `createChatMessage(id, message)` - Chat message
- `createPingMessage()` - Ping
- `createPongMessage(timestamp)` - Pong
- And more...

**Usage:**
```javascript
const { createPlayerJoinMessage } = require('@fixtures/networkMessages');

test('handle player join', () => {
    const message = createPlayerJoinMessage('player-1', 'Alice');
    handleNetworkMessage(message);
    expect(getPlayerCount()).toBe(1);
});
```

### `fixtures/audioBuffers.js`
Sample audio buffer data for various scenarios.

**Available Fixtures:**
- `createAudioBufferData(channels, length, sampleRate)` - Audio buffer
- `createSilentBuffer(duration, sampleRate)` - Silent buffer
- `createSineWaveBuffer(freq, duration, sampleRate)` - Sine wave
- `createWhiteNoiseBuffer(duration, sampleRate)` - White noise
- `createBeepBuffer(sampleRate)` - Beep sound
- `createMusicTrackMetadata(id, name, duration)` - Track metadata
- `createPlaylist(trackCount)` - Playlist
- `createAudioSettings()` - Audio settings
- And more...

**Usage:**
```javascript
const { createSineWaveBuffer } = require('@fixtures/audioBuffers');

test('audio playback', () => {
    const buffer = createSineWaveBuffer(440, 1.0, 44100);
    const player = new AudioPlayer(buffer);
    player.play();
    expect(player.isPlaying()).toBe(true);
});
```

## Path Aliases

The following path aliases are configured in `jest.config.js`:

- `@mocks/*` → `tests/mocks/*`
- `@helpers/*` → `tests/helpers/*`
- `@fixtures/*` → `tests/fixtures/*`
- `@/*` → `src/*`

## Best Practices

### 1. Use Mocks for External Dependencies
Always use the provided mocks instead of real Three.js, Web Audio API, or WebSocket objects in unit tests.

### 2. Clean Up After Tests
Always clean up DOM elements, timers, and event listeners in `afterEach` hooks.

```javascript
afterEach(() => {
    cleanupContainer(container);
    jest.clearAllTimers();
});
```

### 3. Use Fixtures for Consistent Test Data
Use fixtures instead of creating test data inline for consistency and maintainability.

### 4. Handle Async Operations Properly
Use the async helpers to properly wait for asynchronous operations.

```javascript
await waitFor(() => component.isReady());
await flushPromises();
```

### 5. Simulate Events Realistically
Use the event simulation helpers to create realistic event objects.

```javascript
simulateKeyboardEvent(element, 'keydown', 'ArrowRight', { code: 'ArrowRight' });
```

## Adding New Utilities

When adding new test utilities:

1. Place them in the appropriate directory (`mocks/`, `helpers/`, or `fixtures/`)
2. Export all functions using `module.exports`
3. Add JSDoc comments for documentation
4. Update this README with usage examples
5. Ensure they follow existing patterns

## Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- tests/unit/MyComponent.test.js

# Run tests in watch mode
npm test -- --watch
```
