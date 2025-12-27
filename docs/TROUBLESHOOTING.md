# Troubleshooting Guide

Common issues and solutions for LightBikes.

## Installation Issues

### npm install fails

**Problem:** Dependencies fail to install

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Try with legacy peer deps
npm install --legacy-peer-deps

# Check Node.js version (requires v18+)
node --version
```

### Husky hooks not working

**Problem:** Pre-commit hooks don't run

**Solutions:**
```bash
# Reinstall hooks
npm run prepare

# Make hook executable
chmod +x .husky/pre-commit

# Check Git hooks are enabled
git config core.hooksPath
```

## Build Issues

### Build fails with "Cannot find module"

**Problem:** Missing dependencies

**Solutions:**
```bash
# Install missing dependencies
npm install

# Check if module exists
ls node_modules/MODULE_NAME

# Rebuild
npm run build
```

### Build fails with ESLint errors

**Problem:** Code doesn't pass linting

**Solutions:**
```bash
# Auto-fix issues
npm run lint:fix

# Check specific errors
npm run lint

# Bypass for emergency (not recommended)
git commit --no-verify
```

## Runtime Issues

### Game doesn't load / Black screen

**Problem:** JavaScript errors preventing initialization

**Solutions:**
1. Open browser console (F12)
2. Check for errors
3. Common causes:
   - WebGL not supported
   - Three.js failed to load
   - Initialization error

```bash
# Check browser compatibility
# Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

# Try different browser
# Clear browser cache
# Disable browser extensions
```

### WebGL not available

**Problem:** Browser doesn't support WebGL

**Solutions:**
- Update browser to latest version
- Enable hardware acceleration in browser settings
- Check GPU drivers are up to date
- Try different browser

**Chrome:** `chrome://gpu` - Check WebGL status  
**Firefox:** `about:support` - Check WebGL status

### Performance issues / Low FPS

**Problem:** Game runs slowly

**Solutions:**
```javascript
// Check performance in console
performanceMonitor.getStats()

// Reduce quality settings
// - Disable glow effects
// - Disable particle effects
// - Reduce camera effects
```

**Browser:**
- Close other tabs
- Disable extensions
- Enable hardware acceleration

**System:**
- Close other applications
- Check GPU usage
- Update graphics drivers

### Audio not working

**Problem:** No sound in game

**Solutions:**
1. Check browser audio permissions
2. Unmute browser tab
3. Check system volume
4. Try user interaction (click) to enable audio
5. Check console for audio errors

```javascript
// Check audio context state
audioManager.context.state
// Should be "running", not "suspended"
```

## Test Issues

### Tests fail after changes

**Problem:** Breaking changes in code

**Solutions:**
```bash
# Run specific test
npm test -- path/to/test.test.js

# Run with verbose output
npm test -- --verbose

# Update snapshots if needed
npm test -- --updateSnapshot

# Check test coverage
npm test -- --coverage
```

### Tests timeout

**Problem:** Async operations not completing

**Solutions:**
```javascript
// Increase timeout in test
it('should complete', async () => {
    // ...
}, 10000); // 10 second timeout

// Use fake timers
jest.useFakeTimers();
jest.runAllTimers();
```

## Multiplayer Issues

### Cannot connect to server

**Problem:** WebSocket connection fails

**Solutions:**
```bash
# Check server is running
npm run server

# Check port is available
lsof -i :3000

# Check firewall settings
# Allow port 3000

# Try different port
PORT=3001 npm run server
```

### High latency / Lag

**Problem:** Network delay

**Solutions:**
- Check network connection
- Reduce number of players
- Use local server
- Check server performance

## Development Issues

### Hot reload not working

**Problem:** Changes don't reflect in browser

**Solutions:**
```bash
# Restart dev server
npm run dev

# Clear browser cache
# Hard refresh (Ctrl+Shift+R)

# Check Vite config
# Verify file is in src/
```

### ESLint errors in editor

**Problem:** Editor shows linting errors

**Solutions:**
```bash
# Install ESLint extension for your editor
# VS Code: ESLint extension
# Configure editor to use project ESLint

# Check eslint.config.js exists
ls eslint.config.js
```

## Browser-Specific Issues

### Safari: Game doesn't start

**Problem:** Safari has stricter audio policies

**Solution:** Click anywhere on page before starting game

### Firefox: Performance issues

**Problem:** Firefox WebGL performance

**Solution:**
- Enable WebGL in `about:config`
- Set `webgl.force-enabled` to true
- Update Firefox to latest version

### Mobile: Touch controls not working

**Problem:** Touch events not registered

**Solutions:**
- Ensure touch events are enabled
- Check viewport meta tag
- Test on different mobile browsers
- Check console for touch errors

## Common Error Messages

### "Failed to create WebGL context"

**Cause:** WebGL not available or disabled

**Fix:**
- Enable WebGL in browser settings
- Update graphics drivers
- Try different browser

### "AudioContext was not allowed to start"

**Cause:** Browser autoplay policy

**Fix:** User must interact with page (click) before audio starts

### "Cannot read property 'x' of undefined"

**Cause:** Object not initialized

**Fix:**
- Check initialization order
- Add null checks
- Verify component is created

### "Maximum call stack size exceeded"

**Cause:** Infinite recursion

**Fix:**
- Check for circular dependencies
- Review recursive functions
- Add base cases

## Performance Debugging

### Check FPS
```javascript
// Open console
performanceMonitor.getStats()
// Look for fps value
```

### Check Memory Usage
```javascript
// Chrome DevTools
// Performance tab → Memory
// Look for memory leaks
```

### Profile Performance
```javascript
// Chrome DevTools
// Performance tab → Record
// Play game for 30 seconds
// Stop recording
// Analyze flame graph
```

## Getting More Help

### Collect Debug Information
```bash
# Browser info
navigator.userAgent

# WebGL info
# Visit: https://get.webgl.org/

# System info
# OS, RAM, GPU

# Console errors
# Copy all errors from console
```

### Report an Issue
Include:
1. Description of problem
2. Steps to reproduce
3. Expected vs actual behavior
4. Browser and OS
5. Console errors
6. Screenshots

### Resources
- [README](../README.md) - Project overview
- [CONTRIBUTING](../CONTRIBUTING.md) - Development guide
- [GitHub Issues](https://github.com/YOUR_REPO/issues) - Report bugs
- [Documentation](.) - All docs

## Still Having Issues?

1. Search existing GitHub issues
2. Check documentation
3. Open a new issue with debug info
4. Join Discord (coming soon)

---

**Last Updated:** December 6, 2025
