# UI Fixes Testing Guide

## Quick Start

### Run All Automated Tests

```bash
npx jest ui-fixes-validation.test.js --verbose
```

**Expected Result:** 38/38 tests pass

## Test Categories

### 1. Automated Unit Tests

**File:** `ui-fixes-validation.test.js`

**Coverage:**
- ✅ Icon display and encoding (4 tests)
- ✅ AI opponent selection (5 tests)
- ✅ Difficulty level selection (5 tests)
- ✅ 3D arena rendering (5 tests)
- ✅ Game initialization (4 tests)
- ✅ UI interactivity (3 tests)
- ✅ Browser compatibility (5 tests)
- ✅ Error handling (4 tests)
- ✅ Integration tests (3 tests)

**Run Command:**
```bash
npx jest ui-fixes-validation.test.js
```

### 2. Manual Browser Tests

#### Icon Rendering Test
**File:** `test-icon-encoding.html`

**What it tests:**
- UTF-8 character encoding
- Emoji support detection
- Icon display (🔊, ⚡, ✨, 💫, 📹, 🎵)
- Fallback text functionality
- Data attributes on buttons

**How to run:**
1. Open `test-icon-encoding.html` in a browser
2. Verify all emojis display correctly
3. Check that charset shows "UTF-8"
4. Click buttons to test data attributes

#### AI Count Selector Test
**File:** `test-ai-count-selector.html`

**What it tests:**
- Button click events
- Visual feedback (active class)
- localStorage persistence
- Data attribute extraction

**How to run:**
1. Open `test-ai-count-selector.html` in a browser
2. Click each AI count button (1-4)
3. Verify green glow appears on active button
4. Check localStorage value updates
5. Reload page to verify persistence

#### Difficulty Selector Test
**File:** `test-difficulty-selector.html`

**What it tests:**
- Difficulty button functionality
- Visual feedback timing (< 100ms)
- localStorage persistence
- Data-level attributes

**How to run:**
1. Open `test-difficulty-selector.html` in a browser
2. Click Easy, Medium, Hard buttons
3. Verify cyan glow on active button
4. Check timing is under 100ms
5. Verify localStorage updates

#### Renderer Initialization Test
**File:** `test-renderer-init.html`

**What it tests:**
- WebGL support detection
- Renderer clear color (0x000033)
- Canvas attachment to DOM
- Scene lighting setup
- 3D rendering (animated cube)

**How to run:**
1. Open `test-renderer-init.html` in a browser
2. Verify all status indicators show "PASS"
3. Confirm green rotating cube is visible
4. Check background is dark blue (not black)

#### Game Initialization Test
**File:** `test-initialization.html`

**What it tests:**
- Full game initialization sequence
- Loading indicator behavior
- Component creation order
- Initialization timing

**How to run:**
1. Open `test-initialization.html` in a browser
2. Watch initialization progress
3. Verify all tests pass
4. Check summary shows passed/failed counts

#### Browser Compatibility Test
**File:** `test-browser-compatibility.html`

**What it tests:**
- Browser detection and version
- Feature support (WebGL, localStorage, etc.)
- Compatibility warnings
- Error message display

**How to run:**
1. Open `test-browser-compatibility.html` in a browser
2. Click "Run Full Compatibility Check"
3. Review browser info and feature results
4. Test warning UI with "Show Warning UI" button
5. Test error UI with "Show Critical Error UI" button

## Cross-Browser Testing

### Recommended Test Matrix

| Browser | Version | Test Files |
|---------|---------|------------|
| Chrome | 90+ | All test files |
| Firefox | 88+ | All test files |
| Safari | 14+ | All test files |
| Edge | 90+ | All test files |

### Testing Checklist

For each browser:

- [ ] Open `test-icon-encoding.html` - verify icons display
- [ ] Open `test-renderer-init.html` - verify 3D rendering
- [ ] Open `test-browser-compatibility.html` - check compatibility
- [ ] Open `index.html` - test full game
- [ ] Click all UI buttons - verify responsiveness
- [ ] Change settings - verify persistence after reload

## Performance Testing

### Frame Rate Test

1. Open `index.html` in browser
2. Open browser DevTools (F12)
3. Go to Performance tab
4. Start recording
5. Play game for 10 seconds
6. Stop recording
7. Verify frame rate is ~60 FPS

### Initialization Time Test

1. Open `test-initialization.html`
2. Check initialization timing in results
3. Should complete in < 2 seconds

### UI Response Time Test

1. Open `test-ai-count-selector.html` or `test-difficulty-selector.html`
2. Click buttons and check timing display
3. Should be < 100ms

## Error Handling Tests

### WebGL Disabled Test

1. Disable WebGL in browser settings:
   - Chrome: `chrome://flags/#disable-webgl`
   - Firefox: `about:config` → `webgl.disabled` = true
2. Open `index.html`
3. Verify error message displays
4. Message should mention WebGL and suggest browser upgrade

### localStorage Disabled Test

1. Disable cookies/storage in browser settings
2. Open `index.html`
3. Change AI count or difficulty
4. Verify game still works (degraded mode)
5. Settings won't persist but game is playable

### Network Error Test

1. Open browser DevTools
2. Go to Network tab
3. Set throttling to "Slow 3G"
4. Open `index.html`
5. Verify loading indicator shows
6. Game should still initialize (Three.js from CDN)

## Persistence Tests

### AI Count Persistence

1. Open `index.html`
2. Select "3 AIs"
3. Reload page (F5)
4. Verify "3 AIs" is still selected

### Difficulty Persistence

1. Open `index.html`
2. Select "Hard" difficulty
3. Reload page (F5)
4. Verify "Hard" is still selected

### Clear Storage Test

1. Open browser DevTools
2. Go to Application/Storage tab
3. Clear localStorage
4. Reload page
5. Verify defaults: 1 AI, Medium difficulty

## Troubleshooting

### Tests Fail in Jest

**Problem:** Automated tests fail

**Solution:**
```bash
# Clear Jest cache
npx jest --clearCache

# Run tests again
npx jest ui-fixes-validation.test.js --verbose
```

### Icons Don't Display

**Problem:** Emojis show as boxes or garbled text

**Possible causes:**
- Browser doesn't support emoji
- Font missing
- Encoding issue

**Solution:**
1. Check `test-icon-encoding.html` for emoji support
2. Verify charset is UTF-8
3. Fallback text should display if emojis fail

### 3D Arena Not Visible

**Problem:** Black screen, no arena

**Possible causes:**
- WebGL not supported
- Renderer not initialized
- Camera positioned incorrectly

**Solution:**
1. Open `test-renderer-init.html` to diagnose
2. Check WebGL support status
3. Verify clear color is 0x000033 (not black)
4. Check browser console for errors

### Settings Don't Persist

**Problem:** AI count or difficulty resets on reload

**Possible causes:**
- localStorage disabled
- Private browsing mode
- Storage quota exceeded

**Solution:**
1. Check browser allows localStorage
2. Exit private/incognito mode
3. Clear some localStorage data
4. Check browser console for storage errors

## Test Results

### Latest Test Run

**Date:** November 16, 2025  
**Automated Tests:** 38/38 PASSED ✅  
**Manual Tests:** All available for browser testing  
**Coverage:** 100% of requirements validated

### Test Files Summary

**Automated:**
- `ui-fixes-validation.test.js` - 38 comprehensive tests

**Manual:**
- `test-icon-encoding.html` - Icon rendering
- `test-ai-count-selector.html` - AI selection
- `test-difficulty-selector.html` - Difficulty selection
- `test-renderer-init.html` - 3D rendering
- `test-initialization.html` - Game initialization
- `test-browser-compatibility.html` - Browser compatibility

**Documentation:**
- `VALIDATION_SUMMARY.md` - Detailed test results
- `TESTING_GUIDE.md` - This guide

## Quick Commands

```bash
# Run all automated tests
npx jest ui-fixes-validation.test.js

# Run with coverage
npx jest ui-fixes-validation.test.js --coverage

# Run in watch mode
npx jest ui-fixes-validation.test.js --watch

# Run verbose output
npx jest ui-fixes-validation.test.js --verbose

# Clear cache and run
npx jest --clearCache && npx jest ui-fixes-validation.test.js
```

## Success Criteria

All tests pass when:

✅ 38/38 automated tests pass  
✅ Icons display correctly in all browsers  
✅ UI buttons respond within 100ms  
✅ 3D arena renders with proper lighting  
✅ Game initializes in < 2 seconds  
✅ Settings persist across page reloads  
✅ Error messages display for unsupported features  
✅ Game runs at 60 FPS  

---

**For detailed test results, see:** `VALIDATION_SUMMARY.md`
