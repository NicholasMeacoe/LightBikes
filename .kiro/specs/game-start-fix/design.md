# Design Document

## Overview

This design addresses the critical game initialization issue where the canvas fails to render and the mode selector doesn't display, leaving users unable to start the game. The root cause is a timing issue in the initialization sequence where UI elements are created before the DOM is fully ready, and the mode selector may be hidden behind other elements or not properly styled.

## Architecture

### Initialization Flow

```
Page Load
    ↓
Wait for DOM Ready
    ↓
Check WebGL Support
    ↓
Initialize Error Handling
    ↓
Create Rendering Engine
    ↓
Verify Canvas Created
    ↓
Initialize Game Systems
    ↓
Show Mode Selector
    ↓
User Selects Mode
    ↓
Start Game Loop
```

### Component Interactions

1. **DOM Ready Check**: Ensure all initialization waits for DOMContentLoaded
2. **Rendering Engine**: Creates canvas and appends to body immediately
3. **Mode Selector**: Shows with highest z-index, blocks game start until mode selected
4. **UI Controls**: Disabled until mode selector is dismissed
5. **Error Handler**: Catches and displays any initialization failures

## Components and Interfaces

### 1. Initialization Manager

**Purpose**: Coordinate the initialization sequence with proper timing

**Interface**:
```javascript
class InitializationManager {
    constructor()
    async waitForDOMReady()
    async initializeGame()
    handleInitializationError(error)
}
```

**Responsibilities**:
- Wait for DOM to be fully loaded
- Execute initialization steps in correct order
- Verify each step completes successfully
- Handle and display errors

### 2. Canvas Verification System

**Purpose**: Ensure the WebGL canvas is created and visible

**Interface**:
```javascript
class CanvasVerifier {
    verifyCanvasCreated(renderer)
    verifyCanvasVisible(canvas)
    verifyCanvasSize(canvas)
    renderTestFrame(renderer, scene, camera)
}
```

**Responsibilities**:
- Check canvas element exists in DOM
- Verify canvas has non-zero dimensions
- Confirm canvas is visible (not display:none)
- Render a test frame to confirm WebGL works

### 3. Mode Selector Enhancement

**Purpose**: Ensure mode selector displays reliably and blocks game start

**Interface**:
```javascript
class ModeSelector {
    show()
    ensureVisible()
    blockUIControls()
    unblockUIControls()
}
```

**Enhancements**:
- Add z-index verification
- Add visibility check after creation
- Disable other UI controls until mode selected
- Add fallback positioning if centering fails

### 4. Loading Indicator

**Purpose**: Provide visual feedback during initialization

**Interface**:
```javascript
class LoadingIndicator {
    show(message)
    updateProgress(step, message)
    hide()
    showError(error, retryCallback)
}
```

**Responsibilities**:
- Display loading overlay
- Show current initialization step
- Hide when complete
- Transform into error display if needed

## Data Models

### Initialization State

```javascript
{
    domReady: boolean,
    webglSupported: boolean,
    canvasCreated: boolean,
    canvasVisible: boolean,
    renderingEngineReady: boolean,
    gameSystemsReady: boolean,
    modeSelectorShown: boolean,
    currentStep: string,
    errors: Array<Error>
}
```

### Canvas Verification Result

```javascript
{
    exists: boolean,
    visible: boolean,
    hasValidSize: boolean,
    canRender: boolean,
    dimensions: { width: number, height: number },
    errors: Array<string>
}
```

## Error Handling

### Error Types

1. **DOM Not Ready Error**: Page scripts executed before DOM loaded
2. **WebGL Not Supported Error**: Browser doesn't support WebGL
3. **Canvas Creation Error**: Renderer failed to create canvas
4. **Canvas Visibility Error**: Canvas created but not visible
5. **Mode Selector Error**: Mode selector failed to display

### Error Recovery Strategies

1. **DOM Not Ready**: Wait for DOMContentLoaded event, retry initialization
2. **WebGL Not Supported**: Show browser compatibility message, no retry
3. **Canvas Creation**: Show error with browser update suggestion
4. **Canvas Visibility**: Force canvas visibility with inline styles
5. **Mode Selector**: Create fallback simple mode selector

### Error Display

```javascript
{
    title: string,
    message: string,
    technicalDetails: string,
    actionableSteps: Array<string>,
    retryAvailable: boolean,
    retryCallback: function
}
```

## Testing Strategy

### Unit Tests

1. **InitializationManager**
   - Test DOM ready detection
   - Test initialization step sequencing
   - Test error handling for each step

2. **CanvasVerifier**
   - Test canvas existence check
   - Test visibility detection
   - Test size validation
   - Test render capability

3. **ModeSelector**
   - Test show/hide functionality
   - Test z-index application
   - Test UI control blocking
   - Test visibility verification

4. **LoadingIndicator**
   - Test show/hide
   - Test progress updates
   - Test error transformation

### Integration Tests

1. **Full Initialization Flow**
   - Test complete initialization from page load
   - Verify canvas appears
   - Verify mode selector shows
   - Verify user can start game

2. **Error Scenarios**
   - Test initialization with WebGL disabled
   - Test initialization with DOM manipulation errors
   - Test recovery from canvas creation failure

3. **UI Interaction**
   - Test mode selector interaction
   - Test AI count selector (should be disabled until mode selected)
   - Test difficulty selector (should be disabled until mode selected)

### Manual Testing

1. **Visual Verification**
   - Load page and verify canvas is visible
   - Verify mode selector appears centered
   - Verify loading indicator shows during init
   - Verify error messages display correctly

2. **Browser Compatibility**
   - Test in Chrome, Firefox, Safari, Edge
   - Test with WebGL disabled
   - Test on mobile devices

3. **User Flow**
   - Complete full game start flow
   - Test mode selection
   - Test game configuration
   - Test game start

## Implementation Notes

### Critical Fixes

1. **Wrap initialization in DOMContentLoaded**:
   ```javascript
   if (document.readyState === 'loading') {
       document.addEventListener('DOMContentLoaded', () => initializeGame());
   } else {
       initializeGame();
   }
   ```

2. **Verify canvas after creation**:
   ```javascript
   renderingEngine = new RenderingEngine();
   if (!renderingEngine.renderer.domElement.parentNode) {
       throw new Error('Canvas not appended to DOM');
   }
   ```

3. **Force mode selector visibility**:
   ```javascript
   modeSelector.show();
   // Verify it's actually visible
   const element = document.getElementById('mode-selector');
   if (!element || element.offsetParent === null) {
       // Force visibility
       element.style.display = 'block';
       element.style.visibility = 'visible';
   }
   ```

4. **Disable UI controls until mode selected**:
   ```javascript
   const aiSelector = document.getElementById('aiCountSelector');
   const difficultySelector = document.getElementById('difficultySelector');
   aiSelector.style.pointerEvents = 'none';
   difficultySelector.style.pointerEvents = 'none';
   aiSelector.style.opacity = '0.5';
   difficultySelector.style.opacity = '0.5';
   ```

### Performance Considerations

- Loading indicator should be lightweight (CSS only, no heavy animations)
- Canvas verification should be fast (< 100ms)
- Mode selector should appear within 1 second of page load

### Accessibility

- Loading indicator should have aria-live region
- Error messages should be announced to screen readers
- Mode selector should be keyboard navigable
- Focus should be trapped in mode selector until dismissed

## Design Decisions

### Why Wait for DOM Ready?

The current implementation starts initialization immediately when script.js loads, which may be before the DOM is fully parsed. This can cause issues with:
- Canvas not being appended correctly
- UI elements not being found
- Event listeners not attaching properly

**Decision**: Wrap all initialization in a DOM ready check to ensure the page is fully loaded.

### Why Verify Canvas Explicitly?

The RenderingEngine creates a canvas, but there's no verification that it was successfully added to the DOM or is visible. Silent failures can occur.

**Decision**: Add explicit verification steps after canvas creation to catch and report issues early.

### Why Block UI Controls?

The AI count and difficulty selectors are visible and appear clickable, but the game hasn't started yet. This creates confusion.

**Decision**: Disable these controls until the mode selector is dismissed and the game is starting.

### Why Add Loading Indicator?

Users currently see a white screen with no feedback during initialization, making it unclear if the game is loading or broken.

**Decision**: Add a loading indicator that shows progress and transforms into an error display if needed.

## Migration Path

1. **Phase 1**: Add DOM ready check and canvas verification (critical fixes)
2. **Phase 2**: Enhance mode selector visibility and UI control blocking
3. **Phase 3**: Add loading indicator and progress feedback
4. **Phase 4**: Improve error handling and recovery

This phased approach allows us to fix the critical issue first, then enhance the user experience progressively.
