# LightBikes Game - Logic Documentation

## Overview
A 3D Tron-style light bike game where players compete against an AI opponent. Both bikes leave trails behind them, and the objective is to avoid colliding with boundaries, trails, or the opponent.

## Core Game Mechanics

### Game State
- **Bounds**: 30x30 unit arena
- **Frame Rate**: Updates every animation frame
- **Collision Grace Period**: First 10 frames have no collision detection (allows initialization)
- **Movement Speed**: 0.1 units per frame

### Player Controls
- **Arrow Keys**: Change direction (up/down/left/right)
- **Touch Controls**: On-screen buttons for mobile devices
- **Direction Constraint**: Cannot reverse 180° (prevents instant self-collision)

### Collision Detection

#### Boundary Collision
- Triggers when bike position reaches or exceeds bounds (±30 units)
- Check: `x <= -bounds || x >= bounds || z <= -bounds || z >= bounds`

#### Trail Collision
- **Collision Tolerance**: 0.1 units
- **Recent Segment Exclusion**: Last 5 segments excluded for self-collision (prevents immediate crash)
- **Opponent Trail**: All segments checked (no exclusion)
- **Logic**:
  - Player can collide with: old player trail (>5 segments back), any AI trail segment
  - AI can collide with: old AI trail (>5 segments back), any player trail segment

### Trail System
- Trail segment created after each movement
- Stored as position objects: `{ x, y, z }`
- Rendered as semi-transparent boxes (0.1 x 0.5 x 0.5 units)

## AI Behavior

### Whisker System (Obstacle Detection)
- **Whisker Length**: 20 units ahead
- **Directions**: Forward, Left, Right
- **Check Interval**: 0.1 units per step
- **Obstacles Detected**:
  - Arena boundaries
  - Player trail (all segments)
  - AI's own trail (excluding last 10 segments)

### Decision Making
1. **Defensive Mode** (Primary):
   - If forward path < 10 units clear: Turn toward side with more clearance
   - Prevents wall-hugging by turning early

2. **Random Turns**:
   - 2% chance per frame to turn randomly (left or right)
   - Adds unpredictability and prevents repetitive patterns

3. **Turn Logic**:
   - Compare left vs right whisker distances
   - Turn toward direction with more open space
   - 90° turns only (no 180° reversals)

### AI Starting Position
- Position: (0, 0, -10)
- Direction: (1, 0, 0) - moving right
- Positioned away from boundaries to avoid early wall-hugging

## Technical Implementation

### Game Loop
```
1. Check collision (if frameCount >= 10)
   - Boundary check
   - Trail collision check
2. If collision detected: Set gameOver = true, return
3. Increment frameCount
4. Move player (position += direction * 0.1)
5. Add player trail segment
6. Calculate AI direction
7. Move AI
8. Add AI trail segment
```

### Rendering (Three.js)
- **Scene**: Dark blue background (0x000033)
- **Lighting**: Ambient (0.6) + Directional (0.8)
- **Camera**: Follows player at (x, 20, z+15)
- **Materials**: MeshLambertMaterial for proper lighting response
- **Grid**: 60x60 grid helper for arena visualization

## Test Coverage
- **Overall**: 96.42% statement coverage
- **Test Suites**: 68 tests across game.test.js and ai.test.js
- **Key Test Areas**:
  - Initialization
  - Player/AI movement
  - Boundary collision detection
  - Trail collision detection
  - AI behavior (defensive, random, state transitions)
  - Edge cases (empty trails, recent segments)

---

## Future Enhancements

### Gameplay Features
1. **Difficulty Levels**
   - Easy: AI turns at 15 units, 5% random turns
   - Medium: Current settings (10 units, 2% random)
   - Hard: AI turns at 8 units, 1% random, faster speed

2. **Power-ups**
   - Speed boost (temporary 2x speed)
   - Shield (ignore one collision)
   - Trail eraser (remove last 10 trail segments)
   - Ghost mode (pass through trails for 3 seconds)

3. **Multiplayer**
   - Local 2-player mode (split keyboard controls)
   - Online multiplayer via WebSockets
   - Spectator mode

4. **Game Modes**
   - Time Trial: Survive as long as possible
   - Arena Shrink: Boundaries gradually decrease
   - Team Battle: 2v2 with AI teammates
   - Elimination Tournament: Multiple rounds

### AI Improvements
5. **Advanced AI Strategies**
   - Aggressive mode: Chase player when safe
   - Trap setting: Create enclosed spaces
   - Predictive pathing: Anticipate player movement
   - Difficulty scaling: AI learns from player patterns

6. **Multiple AI Opponents**
   - 3-4 bikes in arena simultaneously
   - Different AI personalities (aggressive, defensive, erratic)
   - Team-based AI cooperation

### Visual Enhancements
7. **Graphics & Effects**
   - Particle effects for trail creation
   - Explosion animation on collision
   - Neon glow effects on bikes and trails
   - Motion blur for speed sensation
   - Camera shake on near-misses

8. **Customization**
   - Bike color selection
   - Trail color/style options
   - Arena themes (grid, city, space)
   - Custom bike models

### Audio
9. **Sound Effects**
   - Engine hum (varies with speed)
   - Turn sound effects
   - Collision/explosion sounds
   - Ambient background music
   - Victory/defeat fanfares

### UI/UX
10. **Interface Improvements**
    - Main menu with options
    - Pause functionality
    - Score tracking and leaderboard
    - Replay system (save/watch games)
    - Tutorial mode for new players
    - Mini-map showing full arena

### Technical Enhancements
11. **Performance Optimization**
    - Trail segment culling (remove distant segments)
    - Level of detail (LOD) for distant objects
    - Instanced rendering for trail segments
    - Web Worker for AI calculations

12. **Mobile Optimization**
    - Gyroscope controls (tilt to steer)
    - Haptic feedback on collisions
    - Simplified graphics for lower-end devices
    - Portrait mode support

### Analytics & Progression
13. **Player Statistics**
    - Games played/won
    - Longest survival time
    - Total distance traveled
    - Achievement system
    - Unlockable content

14. **Social Features**
    - Share scores on social media
    - Challenge friends
    - Global leaderboards
    - Replay sharing

### Advanced Features
15. **3D Arena Variations**
    - Multi-level arenas (ramps, bridges)
    - Obstacles in arena (pillars, walls)
    - Moving platforms
    - Gravity zones (affect movement)

16. **Game Recording**
    - Record gameplay to video
    - Screenshot functionality
    - Replay editor (camera angles)
    - GIF export for highlights

### Accessibility
17. **Accessibility Options**
    - Colorblind modes
    - High contrast mode
    - Adjustable game speed
    - Keyboard remapping
    - Screen reader support

### Code Quality
18. **Development Improvements**
    - TypeScript migration for type safety
    - Comprehensive JSDoc documentation
    - E2E testing with Playwright
    - CI/CD pipeline for automated testing
    - Performance profiling and monitoring

---

## Priority Recommendations

### High Priority (Quick Wins)
- Pause functionality
- Score tracking
- Sound effects
- Difficulty levels

### Medium Priority (Enhanced Experience)
- Power-ups
- Visual effects
- Multiple AI opponents
- Replay system

### Low Priority (Long-term Goals)
- Multiplayer
- Advanced AI
- 3D arena variations
- Mobile optimization

---

## Contributing
When implementing enhancements:
1. Maintain test coverage above 95%
2. Add tests for new features
3. Update this documentation
4. Follow existing code style
5. Test on multiple browsers/devices
