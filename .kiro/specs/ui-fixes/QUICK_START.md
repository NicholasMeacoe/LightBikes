# Quick Start: Fixing LightBikes UI Issues

## Problem Summary

The LightBikes game has 4 critical issues preventing gameplay:

1. **Weird button icons** - Garbled text instead of emojis
2. **AI count selector broken** - Can't select 1-4 AI opponents
3. **Difficulty selector broken** - Can't change Easy/Medium/Hard
4. **Black screen** - No 3D arena visible

## Quick Fix Order

### Fix #1: Character Encoding (5 minutes)

**File:** `index.html`

**Add to `<head>` section (after `<title>`):**
```html
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
```

**Test:** Reload page, check if emoji icons display correctly

---

### Fix #2: Three.js Renderer (15 minutes)

**File:** `renderer.js` or `script.js`

**Find renderer initialization and change:**
```javascript
// OLD (causes black screen):
renderer.setClearColor(0x000000, 1.0);

// NEW (visible background):
renderer.setClearColor(0x000033, 1.0);
```

**Also verify:**
- Canvas is appended to body: `document.body.appendChild(renderer.domElement)`
- Scene has lighting: Add `new THREE.AmbientLight(0xffffff, 0.5)`
- Camera is positioned correctly: `camera.position.set(0, 20, 20)`

**Test:** Reload page, should see dark blue background and arena

---

### Fix #3: AI Count Selector (20 minutes)

**File:** `index.html`

**Add data attributes to buttons:**
```html
<button class="ai-count-btn" data-count="1">1 AI</button>
<button class="ai-count-btn" data-count="2">2 AIs</button>
<button class="ai-count-btn" data-count="3">3 AIs</button>
<button class="ai-count-btn" data-count="4">4 AIs</button>
```

**File:** `script.js`

**Add event listeners (in initialization):**
```javascript
function setupAICountSelector() {
    const buttons = document.querySelectorAll('.ai-count-btn');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active from all
            buttons.forEach(b => b.classList.remove('active'));
            // Add active to clicked
            this.classList.add('active');
            // Update game
            const count = parseInt(this.dataset.count);
            initializeAIControllers(count);
        });
    });
}

// Call during initialization
setupAICountSelector();
```

**Test:** Click buttons, should highlight and change AI count

---

### Fix #4: Difficulty Selector (20 minutes)

**File:** `index.html`

**Add data attributes to buttons:**
```html
<button class="difficulty-btn" data-level="easy">Easy</button>
<button class="difficulty-btn" data-level="medium">Medium</button>
<button class="difficulty-btn" data-level="hard">Hard</button>
```

**File:** `script.js`

**Add event listeners (in initialization):**
```javascript
function setupDifficultySelector() {
    const buttons = document.querySelectorAll('.difficulty-btn');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active from all
            buttons.forEach(b => b.classList.remove('active'));
            // Add active to clicked
            this.classList.add('active');
            // Update difficulty
            const level = this.dataset.level;
            difficultyManager.setDifficulty(level);
        });
    });
}

// Call during initialization
setupDifficultySelector();
```

**Test:** Click buttons, should highlight and change difficulty

---

## Complete Initialization Function

**Add to `script.js`:**

```javascript
function initializeGameUI() {
    // Set up AI count selector
    setupAICountSelector();
    
    // Set up difficulty selector
    setupDifficultySelector();
    
    // Load saved settings
    loadSavedSettings();
    
    console.log('UI initialized successfully');
}

function loadSavedSettings() {
    // Load AI count
    const savedAICount = localStorage.getItem('aiOpponentCount');
    if (savedAICount) {
        const count = parseInt(savedAICount);
        initializeAIControllers(count);
        document.querySelector(`[data-count="${count}"]`)?.classList.add('active');
    }
    
    // Load difficulty
    const savedDifficulty = localStorage.getItem('difficultyLevel');
    if (savedDifficulty) {
        difficultyManager.setDifficulty(savedDifficulty);
        document.querySelector(`[data-level="${savedDifficulty}"]`)?.classList.add('active');
    }
}

// Call after DOM is loaded
window.addEventListener('DOMContentLoaded', initializeGameUI);
```

---

## Testing Checklist

After implementing fixes:

1. **Icons:** ✅ Emojis display correctly
2. **AI Count:** ✅ Can select 1-4 AIs, button highlights
3. **Difficulty:** ✅ Can select Easy/Medium/Hard, button highlights
4. **3D Arena:** ✅ Dark blue background, grid visible
5. **Gameplay:** ✅ Can control bike with arrow keys
6. **Persistence:** ✅ Settings saved after page reload

---

## If Still Not Working

### Check Browser Console

Press F12 and look for errors:

- **WebGL errors:** Browser may not support WebGL
- **Three.js errors:** Library may not be loading
- **JavaScript errors:** Syntax errors in code

### Verify Files

```bash
# Check bundle.js exists and is recent
ls -lh bundle.js

# Rebuild if needed
npm run build

# Check server is running
curl http://localhost:8000/health
```

### Test in Different Browser

- Try Chrome/Chromium
- Try Firefox
- Check if WebGL works: https://get.webgl.org/

---

## Full Spec Location

For complete details, see:
- **Requirements:** `.kiro/specs/ui-fixes/requirements.md`
- **Design:** `.kiro/specs/ui-fixes/design.md`
- **Tasks:** `.kiro/specs/ui-fixes/tasks.md`
- **Summary:** `GAME_ISSUES_SUMMARY.md`

---

## Need Help?

1. Check console for errors (F12)
2. Verify bundle.js is up to date
3. Test WebGL support
4. Review full spec documents
5. Check that all event listeners are attached
