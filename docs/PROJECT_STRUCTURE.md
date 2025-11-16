# Project Structure

## Directory Organization

```
LightBikes/
├── src/                    # Source code
│   ├── core/              # Core game logic
│   │   ├── game.js        # Main game state and logic
│   │   ├── ai.js          # AI controllers
│   │   └── collision.js   # Collision detection
│   │
│   ├── rendering/         # Graphics and visual effects
│   │   ├── renderer.js    # Main rendering engine
│   │   ├── ParticleSystem.js
│   │   ├── GlowEffectManager.js
│   │   └── ...
│   │
│   ├── effects/           # Camera and visual effects
│   │   ├── CameraEffectsManager.js
│   │   ├── CameraShakeController.js
│   │   ├── MotionBlurController.js
│   │   └── ...
│   │
│   ├── ui/                # User interface components
│   │   ├── ModeSelector.js
│   │   ├── CustomizationUI.js
│   │   ├── scoreDisplay.js
│   │   └── ...
│   │
│   ├── audio/             # Audio system
│   │   ├── audio.js       # Main audio manager
│   │   ├── MusicPlayer.js
│   │   └── ...
│   │
│   ├── multiplayer/       # Multiplayer functionality
│   │   ├── MultiplayerGame.js
│   │   ├── NetworkManager.js
│   │   ├── PlayerEntity.js
│   │   └── ...
│   │
│   ├── systems/           # Game systems
│   │   ├── CustomizationManager.js
│   │   ├── LeaderboardSystem.js
│   │   ├── AchievementSystem.js
│   │   ├── PowerUpManager.js
│   │   ├── difficulty.js
│   │   └── ...
│   │
│   └── utils/             # Utility functions
│       ├── controls.js
│       ├── PerformanceMonitor.js
│       ├── ErrorHandler.js
│       └── ...
│
├── server/                # Multiplayer server
│   ├── index.js          # Server entry point
│   ├── GameServer.js
│   ├── GameRoom.js
│   └── ...
│
├── tests/                 # Test files
│   ├── unit/             # Unit tests
│   └── integration/      # Integration tests
│
├── public/                # Public assets
│   ├── index.html        # Main HTML file
│   └── bundle.js         # Compiled JavaScript bundle
│
├── sounds/                # Audio assets
│   ├── music/
│   └── *.mp3
│
├── docs/                  # Documentation
│   ├── DESIGN.md
│   ├── ROADMAP.md
│   └── ...
│
├── scripts/               # Build and utility scripts
│
├── script.js             # Main entry point (for bundling)
├── package.json          # Project configuration
└── README.md             # Project overview
```

## Key Files

- **script.js**: Main entry point that imports all modules and initializes the game
- **public/index.html**: HTML page that loads the game
- **public/bundle.js**: Browserify-compiled bundle of all JavaScript

## Building

```bash
npm run build    # Builds bundle.js from script.js
```

## Running

1. Build the project: `npm run build`
2. Open `public/index.html` in a web browser
3. For multiplayer: `npm run server` then connect clients

## Testing

```bash
npm test         # Run all tests with coverage
```

## Module Organization

### Core (`src/core/`)
Contains the fundamental game logic that everything else depends on.

### Rendering (`src/rendering/`)
All graphics-related code including the main renderer, particle systems, and visual effects.

### Effects (`src/effects/`)
Camera effects and motion-related visual enhancements.

### UI (`src/ui/`)
All user interface components and HUD elements.

### Audio (`src/audio/`)
Complete audio system including music player and sound effects.

### Multiplayer (`src/multiplayer/`)
Networking, synchronization, and multiplayer-specific game logic.

### Systems (`src/systems/`)
High-level game systems like achievements, customization, scoring, etc.

### Utils (`src/utils/`)
Shared utilities, helpers, and cross-cutting concerns like error handling and performance monitoring.
