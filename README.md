# LightBikes 3D

A high-performance 3D TRON-style light cycle game built with Three.js, featuring single-player and multiplayer modes, AI opponents, particle effects, and dynamic audio.

![Game Preview](docs/preview.png)

## ✨ Features

- **Single-Player Mode**: Face off against intelligent AI opponents with multiple difficulty levels
- **Multiplayer Mode**: Real-time multiplayer battles via WebSocket
- **Advanced Graphics**: Bloom effects, particle systems, and dynamic lighting
- **Immersive Audio**: Dynamic music system with mood-based tracks
- **Multiple Game Modes**: Classic, Elimination, Survival, and Team modes
- **Power-Ups**: Speed boosts, shields, and special abilities
- **Customization**: Vehicle skins, trails, and color schemes
- **Accessibility**: Full keyboard, gamepad, and mobile touch support
- **Anti-Cheat**: Server-side validation and cheat detection

## 🚀 Quick Start

### Prerequisites

- Node.js v18+ or v20+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd LightBikes

# Install dependencies
npm install

# Copy environment template (optional, for AI features)
cp .env.example .env
# Edit .env and add your API keys if needed
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Open browser at http://localhost:3000
```

### Production Build

```bash
# Build optimized bundle
npm run build

# Preview production build
npm run preview
```

### Run Multiplayer Server

```bash
# Start game server
npm run server

# Or with auto-reload during development
npm run server:dev
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- tests/unit/game.test.js

# View coverage report
npm test
# Open coverage/lcov-report/index.html
```

## 📁 Project Structure

```
LightBikes/
├── src/                    # Client-side source code
│   ├── main.js            # Application entry point
│   ├── core/              # Core game logic
│   ├── rendering/         # Graphics and rendering
│   ├── audio/             # Audio system
│   ├── ui/                # User interface
│   ├── multiplayer/       # Multiplayer client
│   ├── systems/           # Game systems (AI, power-ups)
│   └── utils/             # Utilities and helpers
├── server/                # Multiplayer server
│   ├── index.js           # Server entry point
│   ├── GameServer.js      # WebSocket server
│   ├── GameRoom.js        # Room management
│   ├── security.js        # Security middleware
│   └── ...
├── tests/                 # Test files
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
├── public/                # Static assets
├── docs/                  # Documentation
├── .github/               # CI/CD workflows
└── index.html             # Main HTML file
```

## 🛠️ Development

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Gemini API for AI features (optional)
GEMINI_API_KEY=your_api_key_here

# Server configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

**Important**: Never commit `.env` files to version control.

## 🏗️ Architecture

- **Frontend**: Vite + Three.js + Socket.io-client
- **Backend**: Node.js + Socket.io + Express-style middleware
- **Testing**: Jest + jsdom
- **Build Tool**: Vite with code splitting and tree-shaking
- **Security**: Helmet, rate limiting, input validation, Winston logging

### Key Design Patterns

- **Entity Component System** for game objects
- **Event-driven architecture** for multiplayer
- **State management** with centralized game state
- **Anti-cheat validation** on server-side
- **Optimistic updates** with server reconciliation

## 📊 Performance

- Bundle size: < 500KB initial load (gzipped)
- Code splitting for audio and particle systems
- 60 FPS target on modern hardware
- Mobile-optimized rendering pipeline

## 🔒 Security

The server implements multiple security layers:

- **Helmet.js**: Security headers (CSP, HSTS, etc.)
- **Rate Limiting**: Protection against DoS attacks
- **Input Validation**: Sanitization of all user inputs
- **Anti-Cheat**: Server-side movement validation
- **Structured Logging**: Winston for audit trails

See `server/SECURITY.md` for details.

## 🧪 Testing Strategy

- **Unit Tests**: Core game logic, systems, and utilities
- **Integration Tests**: Full game flow and multiplayer
- **Coverage Target**: > 80%
- **CI/CD**: Automated testing on every push

Current status: 70/138 test suites passing (50.7%)

## 🚢 Deployment

### Manual Deployment

```bash
# Build production bundle
npm run build

# Deploy dist/ folder to your hosting service
# Ensure server is running for multiplayer
```

### Docker (Coming Soon)

```bash
docker build -t lightbikes .
docker run -p 3000:3000 lightbikes
```

## 📖 Documentation

- [Project Structure](docs/PROJECT_STRUCTURE.md)
- [Game Logic](docs/GAME_LOGIC.md)
- [Multiplayer Architecture](docs/MULTIPLAYER.md)
- [Audio System](docs/AUDIO.md)
- [Server Security](server/SECURITY.md)
- [Contributing Guidelines](docs/CONTRIBUTING.md)

## 🗺️ Roadmap

### Phase 1: Core Improvements ✅
- [x] Modern build system (Vite)
- [x] Code splitting and optimization
- [x] CI/CD pipeline
- [x] Security hardening
- [x] Linting and formatting

### Phase 2: Testing & Quality 🚧
- [x] Fix test infrastructure
- [ ] Increase test coverage to 80%+
- [ ] Add E2E tests (Playwright)
- [ ] Performance benchmarks

### Phase 3: Features 📋
- [ ] Tournament mode
- [ ] Replay system
- [ ] Spectator mode improvements
- [ ] Custom maps/arenas
- [ ] Achievements and progression
- [ ] Leaderboards

### Phase 4: Polish 🎨
- [ ] Enhanced visual effects
- [ ] More music tracks
- [ ] Better mobile experience
- [ ] Accessibility improvements
- [ ] Internationalization (i18n)

## 🐛 Known Issues

- Mobile touch controls need calibration improvements
- Performance issues on older hardware (< 4GB RAM)
- Trail rendering can be GPU-intensive
- Some tests still failing (being addressed)

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Make sure to run tests and linting before submitting:

```bash
npm test
npm run lint
npm run format
```

## 📜 License

ISC License - see LICENSE file for details.

## 🙏 Acknowledgments

- Three.js team for the excellent 3D library
- Socket.io for real-time communication
- Jest for testing framework
- All contributors and testers

## 📞 Support

- Report bugs via GitHub Issues
- Join our Discord community (coming soon)
- Read the docs at `docs/`

---

Built with ❤️ and ⚡ by the LightBikes team
