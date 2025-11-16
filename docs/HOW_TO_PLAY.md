# How to Play LightBikes

## Quick Start - Single Player Mode

### 1. Start the Web Server

The HTTP server is already running! You can access the game at:

**Local Access:**
- http://localhost:8000
- http://127.0.0.1:8000

**Network Access (from other devices on your network):**
- http://mrmpi3.local:8000
- http://YOUR_PI_IP:8000

### 2. Open in Your Browser

Simply open any of the above URLs in a modern web browser:
- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

### 3. Game Controls

**Single Player (vs AI):**
- **Arrow Keys**: Control your light bike
  - ↑ Up
  - ↓ Down
  - ← Left
  - → Right
- **R**: Restart game
- **P**: Pause/Resume

**Touch Controls (Mobile):**
- Tap the on-screen directional buttons

### 4. Game Modes

Click the **Mode** button to select:
- **Classic**: Standard gameplay vs AI
- **Arena Shrink**: Arena gradually shrinks
- **Time Trial**: Race against the clock
- **Survival**: Last as long as possible
- **Multi-AI**: Face multiple AI opponents
- **Local Multiplayer**: 2-player split-screen

## Local Multiplayer (2 Players)

### Controls:
**Player 1 (Green):**
- Arrow Keys (↑ ↓ ← →)

**Player 2 (Blue):**
- WASD Keys
  - W: Up
  - S: Down
  - A: Left
  - D: Right

## Online Multiplayer (Coming Soon)

For online multiplayer, you'll need to:

1. Start the game server:
   ```bash
   node server/index.js
   ```

2. Connect to: http://mrmpi3.local:8000
3. Click "Online Multiplayer" mode
4. Create or join a room

## Customization

Click the **Customize** button to:
- Change bike colors
- Adjust trail styles
- Select themes
- Configure effects intensity

## Settings

Click the **Settings** button to:
- Adjust music volume
- Select background tracks
- Configure camera effects
- Enable/disable motion blur and shake

## Tips

1. **Performance**: For best performance, use Chrome/Chromium
2. **Audio**: Click anywhere on the page to enable audio (browser autoplay policy)
3. **Fullscreen**: Press F11 for fullscreen mode
4. **Mobile**: Works on tablets and phones with touch controls

## Troubleshooting

### Game Won't Load
- Make sure the HTTP server is running
- Check that `bundle.js` exists (run `npm run build` if needed)
- Clear browser cache and reload

### No Audio
- Click on the page to enable audio
- Check browser console for autoplay policy messages
- Ensure music files are in `sounds/music/` directory

### Poor Performance
- Close other browser tabs
- Reduce effects intensity in settings
- Disable camera effects if needed

## Server Management

### Start HTTP Server
```bash
python3 -m http.server 8000
```

### Start Game Server (for online multiplayer)
```bash
node server/index.js
```

### Stop Servers
Press `Ctrl+C` in the terminal running the server

## Accessing from Other Devices

To play from another device on your network:

1. Find your Pi's IP address:
   ```bash
   hostname -I
   ```

2. On the other device, open:
   - http://YOUR_PI_IP:8000

Or use mDNS:
   - http://mrmpi3.local:8000

## Current Server Status

✅ **HTTP Server**: Running on port 8000
- Access at: http://localhost:8000

🎮 **Game Server**: Not running (needed for online multiplayer only)
- Start with: `node server/index.js`
- Will run on port 3000

---

**Enjoy playing LightBikes!** 🏍️💨
