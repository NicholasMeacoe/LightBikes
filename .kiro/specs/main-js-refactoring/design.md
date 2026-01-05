# Design Document: Main.js Refactoring

## Overview

This design outlines the refactoring of the monolithic `src/main.js` file (3,294 lines) into a modular, maintainable architecture. The refactoring will be performed incrementally, with each phase independently testable and verifiable. The primary goal is to reduce main.js to under 500 lines while maintaining 100% test pass rate and preserving all existing functionality.

The refactoring follows a phased approach based on the complexity analysis documented in `MAIN_JS_REFACTORING_STATUS.md`, prioritizing high-value, low-complexity extractions first.

## Architecture

### Current Architecture

```
src/main.js (3,294 lines)
├── Imports (45 lines)
├── Global State Variables (50 lines)
├── Helper Functions (800 lines)
│   ├── Multi-AI coordination
│   ├── UI display functions
│   ├── Game mode initialization
│   └── Style injection
├── Game Loop - animate() (354 lines)
├── Event Handlers - setupEventListeners() (159 lines)
├── Initialization - initializeGame() (400 lines)
└── System Initialization (1,486 lines)
```

### Target Architecture

```
src/
├── main.js (< 500 lines) - Bootstrap only
├── initialization/
│   ├── game-state.js (✅ Complete - 60 lines)
│   ├── GameInitializer.js - Orchestrates initialization phases
│   ├── SystemInitializer.js - Initializes game systems
│   └── RecoveryManager.js - Consolidated error handling
├── game-loop/
│   ├── GameLoop.js - Main animation loop
│   ├── AICoordinator.js - Multi-AI coordination logic
│   └── CollisionHandler.js - Collision processing
├── modes/
│   ├── ModeController.js - Base mode controller
│   ├── ClassicMode.js - Classic game mode
│   ├── TimeTrialMode.js - Time trial mode
│   ├── ArenaShrinkMode.js - Arena shrink mode
│   └── MultiplayerMode.js - Local multiplayer mode
├── ui/
│   ├── UIManager.js - Coordinates all UI
│   ├── GameOverUI.js - Game over screens
│   ├── ModeUI.js - Mode-specific UI elements
│   └── StyleManager.js - CSS injection management
└── events/
    └── EventManager.js - Event handler registration
```

## Components and Interfaces

### 1. GameInitializer

**Responsibility:** Orchestrate the game initialization sequence

**Interface:**
```javascript
class GameInitializer {
    constructor(errorHandler, loadingIndicator)
    
    async initialize() // Returns initialization result
    getInitializationState() // Returns current state
    registerPhase(name, initFn, options) // Register init phase
}
```

**Phases:**
1. Error handling setup
2. Browser compatibility check
3. WebGL verification
4. Core game components
5. Rendering engine
6. Canvas verification
7. Event listeners
8. Game systems
9. Mode selector
10. Game loop start

### 2. RecoveryManager

**Responsibility:** Consolidated error handling (merges ErrorHandler, ErrorRecovery, ErrorRecoveryStrategies)

**Interface:**
```javascript
class RecoveryManager {
    constructor()
    
    registerStrategy(componentName, strategy)
    async initializeWithRecovery(componentName)
    handleFeatureRuntimeError(featureName, error, fallback)
    isFeatureDisabled(featureName)
    getStatus() // Returns recovery status
}
```

**Consolidation:**
- Merges 3 separate error handling classes
- Provides unified error recovery interface
- Maintains all existing recovery strategies

### 3. GameLoop

**Responsibility:** Main animation loop and frame coordination

**Interface:**
```javascript
class GameLoop {
    constructor(game, systems)
    
    start() // Start the game loop
    stop() // Stop the game loop
    update(deltaTime) // Update all systems
    setMode(mode) // Switch game mode
}
```

**Dependencies:**
- Game instance
- RenderingEngine
- PerformanceMonitor
- CameraEffectsManager
- GlowEffectManager
- PowerUpManager
- Current game mode controller

### 4. ModeController (Base Class)

**Responsibility:** Base class for game mode controllers

**Interface:**
```javascript
class ModeController {
    constructor(game, systems)
    
    initialize() // Set up mode
    cleanup() // Clean up mode
    update(deltaTime) // Mode-specific update logic
    handleGameOver() // Mode-specific game over
    createUI() // Create mode-specific UI
    destroyUI() // Remove mode-specific UI
}
```

**Subclasses:**
- ClassicMode - Handles classic gameplay with AI
- TimeTrialMode - Handles time trial mode
- ArenaShrinkMode - Handles arena shrink mode
- MultiplayerMode - Handles local multiplayer

### 5. UIManager

**Responsibility:** Coordinate all UI creation and updates

**Interface:**
```javascript
class UIManager {
    constructor()
    
    initialize() // Set up UI components
    updateForMode(mode) // Update UI for game mode
    showGameOver(gameState, mode) // Show game over screen
    hideGameOver() // Hide game over screen
    updateScores(playerScore, aiScore) // Update score display
}
```

**Manages:**
- Score displays
- Game over screens
- Mode-specific UI elements
- Settings panels
- Status indicators

### 6. StyleManager

**Responsibility:** Manage CSS injection for dynamic UI elements

**Interface:**
```javascript
class StyleManager {
    constructor()
    
    addStyles(id, cssText) // Add styles if not present
    removeStyles(id) // Remove styles
    hasStyles(id) // Check if styles exist
}
```

**Purpose:**
- Centralizes all CSS injection
- Prevents duplicate style tags
- Manages style lifecycle

### 7. EventManager

**Responsibility:** Register and manage all event listeners

**Interface:**
```javascript
class EventManager {
    constructor(game, systems)
    
    registerAll() // Register all event listeners
    unregisterAll() // Remove all event listeners
    registerGameControls() // Player controls
    registerUIControls() // UI button handlers
    registerWindowEvents() // Resize, unload, etc.
}
```

**Event Categories:**
- Game controls (keyboard, touch)
- UI controls (buttons, selectors)
- Window events (resize, beforeunload)
- Audio initialization

## Data Models

### InitializationState

```javascript
{
    phase: string,           // Current initialization phase
    completed: string[],     // Completed phases
    errors: Error[],         // Errors encountered
    startTime: number,       // Initialization start time
    endTime: number,         // Initialization end time
    success: boolean         // Overall success status
}
```

### GameLoopState

```javascript
{
    running: boolean,        // Is loop running
    frameCount: number,      // Total frames rendered
    lastFrameTime: number,   // Last frame timestamp
    deltaTime: number,       // Time since last frame
    mode: string,            // Current game mode
    paused: boolean          // Is game paused
}
```

### RecoveryStatus

```javascript
{
    disabledFeatures: string[],  // Features that failed to initialize
    fallbackMode: boolean,        // Is running in fallback mode
    criticalFailures: string[],   // Critical component failures
    recoveryAttempts: Map         // Component -> attempt count
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: File size constraint
*For any* refactored main.js file, the line count should be less than 500 lines
**Validates: Requirements 1.1**

### Property 2: No code duplication
*For any* code block in main.js and extracted modules, no duplicate code blocks should exist between them
**Validates: Requirements 1.5**

### Property 3: State access centralization
*For any* component that needs game state, it should access state only through the GameState module or dependency injection, never through global variables
**Validates: Requirements 2.1, 2.2**

### Property 4: State mutation traceability
*For any* state change in the system, the change should be traceable to a single mutation point in the GameState module
**Validates: Requirements 2.3**

### Property 5: Game loop mode handling
*For any* game mode (Classic, Time Trial, Arena Shrink, Multiplayer), the game loop should correctly handle updates for that mode
**Validates: Requirements 3.4**

### Property 6: Initialization phase error handling
*For any* initialization phase that fails, the system should provide a clear error message and recovery option
**Validates: Requirements 4.2**

### Property 7: LoadingIndicator progress updates
*For any* initialization phase, the LoadingIndicator should be updated with progress information
**Validates: Requirements 4.5**

### Property 8: Event handler delegation
*For any* event handler, it should delegate to game systems rather than containing business logic
**Validates: Requirements 5.3**

### Property 9: Event listener cleanup
*For any* registered event listener, it should be properly removed during cleanup
**Validates: Requirements 5.5**

### Property 10: Consolidation preserves functionality
*For any* consolidated system, all functionality from the original separate systems should be preserved
**Validates: Requirements 6.4**

### Property 11: Test suite pass rate
*For any* refactoring phase, all existing unit and integration tests should pass without modification
**Validates: Requirements 9.1, 9.2**

### Property 12: Code coverage maintenance
*For any* refactored code, the test coverage should remain at or above 96%
**Validates: Requirements 9.3**

### Property 13: No new test failures
*For any* test run after refactoring, no new test failures should be introduced compared to the baseline
**Validates: Requirements 9.4**

### Property 14: Feature preservation
*For any* game feature, it should work exactly as it did before refactoring
**Validates: Requirements 9.5**

### Property 15: Minimal module dependencies
*For any* module, it should have only the minimum necessary dependencies to fulfill its responsibility
**Validates: Requirements 10.1**

### Property 16: No circular dependencies
*For any* pair of modules in the system, there should be no circular dependency between them
**Validates: Requirements 10.2**

### Property 17: Documented module interfaces
*For any* exported function or class, it should have JSDoc documentation describing its interface
**Validates: Requirements 10.3**

### Property 18: Mode transition state isolation
*For any* transition between game modes, no state from the previous mode should leak into the new mode
**Validates: Requirements 8.2**

### Property 19: Mode-specific component initialization
*For any* game mode initialization, only the components required for that mode should be created
**Validates: Requirements 8.4**

## Error Handling

### Initialization Errors

**Strategy:** Fail fast with clear error messages and recovery options

**Error Types:**
1. **DOMNotReadyError** - DOM not loaded before initialization
2. **CanvasCreationError** - WebGL or canvas creation failed
3. **ComponentInitializationError** - Game component failed to initialize
4. **ModeSelectorError** - Mode selector failed to display

**Recovery:**
- Critical errors: Show error UI with reload option
- Non-critical errors: Disable feature and continue
- Fallback mode: Run with reduced features

### Runtime Errors

**Strategy:** Graceful degradation with feature disabling

**Handling:**
1. Catch errors in game loop
2. Log error details
3. Disable failing feature
4. Continue game execution
5. Notify user if appropriate

### Refactoring Errors

**Strategy:** Incremental changes with test verification

**Process:**
1. Run full test suite before changes
2. Make small, focused changes
3. Run tests after each change
4. Revert if tests fail
5. Document any test modifications needed

## Testing Strategy

### Unit Testing

**Approach:** Test each extracted module independently

**Test Categories:**
1. **Module Isolation Tests** - Verify modules work independently
2. **Interface Tests** - Verify module interfaces are correct
3. **Dependency Tests** - Verify dependencies are properly injected
4. **Error Handling Tests** - Verify error scenarios are handled

**Example Tests:**
- GameInitializer phase registration and execution
- RecoveryManager strategy registration and recovery
- GameLoop mode switching and updates
- ModeController initialization and cleanup
- EventManager listener registration and removal

### Integration Testing

**Approach:** Verify modules work together correctly

**Test Scenarios:**
1. **Full Initialization** - Verify complete initialization sequence
2. **Mode Transitions** - Verify switching between all game modes
3. **Error Recovery** - Verify recovery from component failures
4. **Event Flow** - Verify events trigger correct system responses

### Regression Testing

**Approach:** Ensure all existing tests pass

**Process:**
1. Establish baseline - run all tests before refactoring
2. Run tests after each phase
3. Compare results to baseline
4. Investigate any new failures
5. Fix issues or revert changes

**Success Criteria:**
- 100% of existing tests pass
- Code coverage remains ≥ 96%
- No new test failures introduced
- All game features work as before

### Property-Based Testing

**Library:** fast-check (JavaScript property-based testing library)

**Configuration:** Each property test should run minimum 100 iterations

**Test Organization:**
- Each property test should reference its design document property number
- Use comment format: `// Feature: main-js-refactoring, Property N: <property text>`
- Group related property tests in the same test file

**Property Test Examples:**

1. **File Size Property** - Generate random code extractions, verify main.js stays under 500 lines
2. **State Access Property** - Generate random component interactions, verify all state access goes through GameState
3. **Mode Handling Property** - Generate random game mode sequences, verify game loop handles all modes
4. **Event Cleanup Property** - Generate random event registrations, verify all are cleaned up

## Implementation Phases

### Phase 1: State Management ✅ COMPLETE

**Status:** Complete (60 lines extracted)

**Deliverable:** `src/initialization/game-state.js`

**Impact:** Centralized global state references

### Phase 2: Consolidate Error Handling

**Priority:** HIGH (reduces duplication, enables other phases)

**Deliverable:** `src/initialization/RecoveryManager.js`

**Tasks:**
1. Create RecoveryManager class
2. Merge ErrorHandler functionality
3. Merge ErrorRecovery functionality
4. Merge ErrorRecoveryStrategies functionality
5. Update all error handling call sites
6. Remove old error handling files
7. Verify all error handling tests pass

**Estimated Effort:** 3 hours

**Lines Reduced:** ~400 lines from main.js

### Phase 3: Extract UI Setup

**Priority:** MEDIUM (high impact, moderate complexity)

**Deliverables:**
- `src/ui/UIManager.js`
- `src/ui/GameOverUI.js`
- `src/ui/ModeUI.js`
- `src/ui/StyleManager.js`

**Tasks:**
1. Create UIManager class
2. Extract game over UI functions
3. Extract mode-specific UI functions
4. Extract style injection functions
5. Create StyleManager for CSS injection
6. Update main.js to use UIManager
7. Verify all UI tests pass

**Estimated Effort:** 2 hours

**Lines Reduced:** ~600 lines from main.js

### Phase 4: Extract Game Mode Controllers

**Priority:** MEDIUM (improves organization)

**Deliverables:**
- `src/modes/ModeController.js` (base class)
- `src/modes/ClassicMode.js`
- `src/modes/TimeTrialMode.js`
- `src/modes/ArenaShrinkMode.js`
- `src/modes/MultiplayerMode.js`

**Tasks:**
1. Create ModeController base class
2. Extract Classic mode initialization
3. Extract Time Trial mode initialization
4. Extract Arena Shrink mode initialization
5. Extract Multiplayer mode initialization
6. Update mode selector to use controllers
7. Verify all mode tests pass

**Estimated Effort:** 3 hours

**Lines Reduced:** ~500 lines from main.js

### Phase 5: Extract Initialization Logic

**Priority:** MEDIUM (improves clarity)

**Deliverables:**
- `src/initialization/GameInitializer.js`
- `src/initialization/SystemInitializer.js`

**Tasks:**
1. Create GameInitializer class
2. Extract initialization phases
3. Create SystemInitializer for game systems
4. Update main.js to use GameInitializer
5. Verify initialization tests pass

**Estimated Effort:** 4 hours

**Lines Reduced:** ~800 lines from main.js

### Phase 6: Extract Event Handlers

**Priority:** LOW (lower impact)

**Deliverable:** `src/events/EventManager.js`

**Tasks:**
1. Create EventManager class
2. Extract event listener registration
3. Extract event handler functions
4. Update main.js to use EventManager
5. Verify event handling tests pass

**Estimated Effort:** 2 hours

**Lines Reduced:** ~300 lines from main.js

### Phase 7: Extract Game Loop

**Priority:** LOW (highest complexity, defer until other phases complete)

**Deliverables:**
- `src/game-loop/GameLoop.js`
- `src/game-loop/AICoordinator.js`
- `src/game-loop/CollisionHandler.js`

**Tasks:**
1. Create GameLoop class
2. Extract animate() function
3. Extract AI coordination functions
4. Extract collision handling functions
5. Extract UI update functions
6. Update main.js to use GameLoop
7. Verify game loop tests pass

**Estimated Effort:** 6 hours

**Lines Reduced:** ~600 lines from main.js

### Phase 8: Final Bootstrap

**Priority:** FINAL (cleanup)

**Deliverable:** Minimal `src/main.js` (< 500 lines)

**Tasks:**
1. Review remaining main.js code
2. Extract any remaining extractable code
3. Simplify bootstrap logic
4. Add comprehensive documentation
5. Verify final line count < 500
6. Run full test suite
7. Verify code coverage ≥ 96%

**Estimated Effort:** 1 hour

**Final State:** main.js contains only:
- Imports
- GameInitializer instantiation
- Initialization trigger
- Error handling for fatal errors

## Success Metrics

### Quantitative Metrics

1. **File Size:** main.js < 500 lines (currently 3,294)
2. **Test Pass Rate:** 100% of existing tests pass
3. **Code Coverage:** ≥ 96% (maintain current level)
4. **Cyclomatic Complexity:** < 10 for main.js functions
5. **Module Count:** ~15 new modules created
6. **Lines Extracted:** ~2,800 lines moved to modules

### Qualitative Metrics

1. **Maintainability:** Code is easier to understand and modify
2. **Testability:** Each module is independently testable
3. **Modularity:** Clear separation of concerns
4. **Documentation:** All modules have clear documentation
5. **Architecture:** Clean dependency graph with no cycles

## Rollback Strategy

### Per-Phase Rollback

**Trigger:** Test failures or critical issues

**Process:**
1. Identify failing tests
2. Attempt quick fix (< 30 minutes)
3. If fix unsuccessful, revert phase changes
4. Document issue for future attempt
5. Proceed to next phase

### Full Rollback

**Trigger:** Multiple phase failures or critical regression

**Process:**
1. Revert all refactoring changes
2. Return to baseline (current main.js)
3. Analyze root causes
4. Revise refactoring strategy
5. Restart with new approach

## Dependencies

### External Dependencies

- **fast-check:** Property-based testing library
- **jest:** Test framework (already in use)
- **Three.js:** 3D rendering (already in use)

### Internal Dependencies

- All existing game modules (Game, AIController, RenderingEngine, etc.)
- All existing UI components
- All existing test files

### Dependency Management

- No new external dependencies required
- Maintain existing dependency versions
- Ensure no circular dependencies in new modules
- Document all module dependencies clearly

## Timeline

**Total Estimated Effort:** 21 hours

**Phase Breakdown:**
1. State Management: ✅ Complete
2. Consolidate Error Handling: 3 hours
3. Extract UI Setup: 2 hours
4. Extract Game Mode Controllers: 3 hours
5. Extract Initialization Logic: 4 hours
6. Extract Event Handlers: 2 hours
7. Extract Game Loop: 6 hours
8. Final Bootstrap: 1 hour

**Recommended Schedule:**
- Week 1: Phases 2-3 (5 hours)
- Week 2: Phases 4-5 (7 hours)
- Week 3: Phases 6-7 (8 hours)
- Week 4: Phase 8 + buffer (1 hour + testing)

## Risks and Mitigation

### Risk 1: Test Failures

**Probability:** Medium  
**Impact:** High  
**Mitigation:**
- Run tests after each small change
- Maintain test baseline for comparison
- Have rollback plan ready
- Fix issues immediately or revert

### Risk 2: Performance Regression

**Probability:** Low  
**Impact:** Medium  
**Mitigation:**
- Monitor frame rate during testing
- Use PerformanceMonitor to track metrics
- Profile before and after refactoring
- Optimize if regression detected

### Risk 3: Circular Dependencies

**Probability:** Medium  
**Impact:** Medium  
**Mitigation:**
- Design module interfaces carefully
- Use dependency injection
- Run circular dependency detection tools
- Refactor if cycles detected

### Risk 4: Scope Creep

**Probability:** Medium  
**Impact:** Medium  
**Mitigation:**
- Stick to refactoring only (no new features)
- Document any improvements for future work
- Focus on extraction, not enhancement
- Review changes against requirements

### Risk 5: Documentation Drift

**Probability:** Low  
**Impact:** Low  
**Mitigation:**
- Update documentation with each phase
- Add JSDoc comments to all new modules
- Create architecture diagrams
- Review documentation in final phase

## Conclusion

This refactoring will transform the monolithic main.js into a modular, maintainable architecture while preserving all existing functionality. The phased approach minimizes risk by allowing incremental progress with continuous test verification. The focus on consolidation (error handling, music, performance) before extraction (game loop, UI) ensures high-value improvements early in the process.

Success will be measured by achieving a main.js file under 500 lines, maintaining 100% test pass rate, and preserving ≥96% code coverage. The refactored codebase will be easier to understand, test, and extend, setting a solid foundation for future development.
