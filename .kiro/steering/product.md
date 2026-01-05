# LightBikes Product Overview

LightBikes is a browser-based 3D Tron-style game where players compete against an AI opponent in a light bike arena. Both bikes leave trails behind them, and the objective is to avoid colliding with boundaries, trails, or the opponent.

## Core Gameplay
- **Arena**: 30x30 unit 3D space with grid visualization
- **Movement**: Continuous forward motion with 90-degree turns only
- **Trails**: Semi-transparent boxes left behind each bike
- **Victory Condition**: Last bike standing wins
- **Controls**: Arrow keys for player, AI uses defensive pathfinding

## Key Features
- Real-time 3D graphics using Three.js
- Intelligent AI opponent with whisker-based obstacle detection
- Touch controls for mobile devices
- Collision detection with grace periods
- Game restart functionality

## Target Audience
- Casual gamers looking for quick, skill-based gameplay
- Retro gaming enthusiasts (Tron nostalgia)
- Browser game players (no installation required)

## Technical Approach
- Client-side only (no server required)
- Modular architecture for easy extension
- Comprehensive test coverage (96%+)
- Mobile-friendly responsive design