# LightBikes 3D

A browser-based 3D recreation of the classic light cycle game from TRON, built with Three.js. Race against an AI opponent while leaving a deadly trail of light behind you. Don't crash into the walls, your own trail, or your opponent's trail!

![LightBikes Game](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-ISC-blue.svg)

## 🎮 Features

- **3D Graphics**: Immersive 3D arena rendered with Three.js
- **AI Opponent**: Intelligent AI that adapts to your movements
- **Collision Detection**: Precise collision system for trails and boundaries
- **Responsive Controls**: Keyboard controls with mobile touch support
- **Trail System**: Dynamic light trails that persist throughout the game
- **Game Over Detection**: Automatic detection of collisions and game end states

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd LightBikes

# Install dependencies
npm install

# Build the project
npm run build

# Open index.html in your browser
```

### Development

```bash
# Run tests
npm test

# Run tests with coverage
npm run test

# Build bundle
npm run build
```

## 🎯 How to Play

### Controls

- **Arrow Keys**: Change direction
  - ↑ Up Arrow: Move forward (Z-axis)
  - ↓ Down Arrow: Move backward (Z-axis)
  - ← Left Arrow: Move left (X-axis)
  - → Right Arrow: Move right (X-axis)

### Mobile Controls

Touch the on-screen directional buttons to control your light cycle.

### Objective

- Survive longer than your AI opponent
- Avoid crashing into:
  - Arena boundaries
  - Your own trail
  - The AI's trail
- Force the AI to crash into obstacles

## 🏗️ Architecture

The project follows a modular, component-based architecture with clear separation of concerns:

```
LightBikes/
├── game.js           # Core game logic and state management
├── ai.js             # AI decision-making and pathfinding
├── collision.js      # Collision detection engine
├── renderer.js       # Three.js rendering logic
├── controls.js       # Input handling
├── script.js         # Main orchestrator and game loop
├── index.html        # HTML structure
└── bundle.js         # Browserify output
```

### Key Components

- **Game**: Manages game state, entity positions, and trails
- **AI Controller**: Implements intelligent opponent behavior
- **Collision Engine**: Detects collisions between entities and trails
- **Renderer**: Handles 3D graphics and visual effects
- **Controls**: Processes user input from keyboard and touch

## 🧪 Testing

The project uses Jest for unit testing with jsdom for browser environment simulation.

```bash
# Run all tests
npm test

# View coverage report
open coverage/lcov-report/index.html
```

### Test Coverage

- Game logic tests (`game.test.js`)
- AI behavior tests (`ai.test.js`)
- Collision detection tests (`collision.test.js`)

## 📋 Roadmap

See [ROADMAP.md](ROADMAP.md) for detailed development plans including:

### Phase 1: Quick Wins
- ✅ Core gameplay mechanics
- 🔄 Pause functionality
- 🔄 Score tracking
- 🔄 Sound effects
- 🔄 Difficulty levels

### Phase 2: Gameplay Enhancements
- Power-up system
- Time trial mode
- Arena shrink mode
- Multiple AI opponents

### Phase 3: Visual & Audio Polish
- Particle effects
- Neon glow effects
- Camera shake and motion blur
- Customization system
- Background music

### Phase 4: Multiplayer & Social
- Local multiplayer (split-screen)
- Online multiplayer
- Spectator mode
- Leaderboards and social sharing

### Phase 5: Advanced Features
- 3D arena variations
- Replay system
- Video recording and GIF export
- Mobile optimization
- Accessibility features

### Phase 6: Technical Improvements
- TypeScript migration
- CI/CD pipeline
- E2E testing
- Performance monitoring

## 🛠️ Technical Details

### Dependencies

**Production:**
- Three.js (r128) - 3D graphics library

**Development:**
- Browserify - Module bundler
- Jest - Testing framework
- jest-environment-jsdom - Browser environment for tests

### Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

Requires WebGL support for 3D rendering.

## 📖 Documentation

- [GAME_LOGIC.md](GAME_LOGIC.md) - Detailed game mechanics and logic
- [DESIGN.md](DESIGN.md) - Technical architecture and design patterns
- [ROADMAP.md](ROADMAP.md) - Development roadmap and task breakdown

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Follow existing code style
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📝 License

This project is licensed under the ISC License.

## 🎨 Credits

Inspired by the light cycle sequences from TRON (1982).

## 🐛 Known Issues

- Mobile touch controls may need calibration on some devices
- Performance may vary on older hardware
- Trail rendering can be intensive with long trails

## 📞 Support

For issues, questions, or suggestions, please open an issue on the repository.

---

**Enjoy the game! May your light cycle never crash! 🏍️💡**
