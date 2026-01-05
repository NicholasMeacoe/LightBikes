# Customization System Design

## Overview

The Customization System provides players with comprehensive visual personalization options for their LightBikes experience. The system allows customization of bike colors, trail styles, and arena themes while maintaining gameplay clarity and performance. The design integrates seamlessly with the existing Three.js-based rendering architecture and follows the modular component pattern established in the codebase.

## Architecture

### System Components

The customization system consists of four main components that integrate with the existing game architecture:

1. **CustomizationManager** - Central coordinator for all customization functionality
2. **CustomizationUI** - User interface for accessing and configuring options
3. **ThemeEngine** - Handles arena theme switching and management
4. **PreferenceStorage** - Manages persistence of user preferences

### Integration Points

The system integrates with existing components:
- **RenderingEngine** (`renderer.js`) - Applies visual customizations to 3D objects
- **Game** (`game.js`) - Provides game state for preview functionality
- **Main Orchestrator** (`script.js`) - Coordinates UI events and system initialization

### Data Flow

```
User Input → CustomizationUI → CustomizationManager → RenderingEngine → Visual Output
                                      ↓
                              PreferenceStorage (persistence)
                                      ↓
                              ThemeEngine (arena themes)
```

## Components and Interfaces

### CustomizationManager

**Purpose**: Central coordinator that manages all customization state and applies changes to the rendering system.

**Key Methods**:
```javascript
class CustomizationManager {
    constructor(renderingEngine, preferenceStorage)
    
    // Color management
    setBikeColor(playerId, color)
    setTrailColor(playerId, color)
    
    // Trail style management
    setTrailStyle(playerId, style) // 'solid', 'dashed', 'glowing', 'rainbow'
    
    // Theme management
    setArenaTheme(themeName) // 'classic-grid', 'neon-city', 'space', 'tron-legacy'
    
    // Preview functionality
    enablePreviewMode()
    disablePreviewMode()
    applyPreviewChanges()
    cancelPreviewChanges()
    
    // Persistence
    loadSavedPreferences()
    saveCurrentPreferences()
    resetToDefaults()
}
```

**Design Rationale**: Centralized management ensures consistent state and provides a clean interface for UI components while maintaining separation of concerns.

### CustomizationUI

**Purpose**: Provides intuitive interface for accessing customization options with real-time preview capabilities.

**Key Features**:
- Color picker components with preset and custom color options
- Trail style selector with visual previews
- Arena theme gallery with thumbnail previews
- Real-time preview viewport
- Apply/Cancel/Reset controls

**UI Structure**:
```
Customization Menu
├── Bike Customization
│   ├── Color Picker (with presets)
│   └── Preview Display
├── Trail Customization
│   ├── Color Picker
│   ├── Style Selector (Solid/Dashed/Glowing/Rainbow)
│   └── Preview Display
├── Arena Themes
│   ├── Theme Gallery (thumbnails)
│   └── Full Preview
└── Controls
    ├── Apply Changes
    ├── Cancel Changes
    └── Reset to Defaults
```

**Design Rationale**: Organized sections prevent overwhelming users while preview functionality allows experimentation without commitment.

### ThemeEngine

**Purpose**: Manages arena theme packages and coordinates visual elements for cohesive theme experiences.

**Theme Packages**:

1. **Classic Grid** (default)
   - Grid lines: Cyan (#00FFFF)
   - Background: Dark blue gradient
   - Lighting: Neutral white ambient

2. **Neon City**
   - Grid lines: Hot pink (#FF1493) with glow
   - Background: Purple-black gradient with city silhouette
   - Lighting: Purple ambient with neon highlights

3. **Space**
   - Grid lines: Dim white (#666666)
   - Background: Black with animated starfield
   - Lighting: Cool blue ambient

4. **Tron Legacy**
   - Grid lines: Orange (#FFA500) with authentic glow
   - Background: Black with subtle circuit patterns
   - Lighting: Orange-tinted ambient

**Key Methods**:
```javascript
class ThemeEngine {
    constructor(scene, renderer)
    
    loadTheme(themeName)
    getAvailableThemes()
    generateThemePreview(themeName)
    
    // Theme-specific methods
    updateGridMaterial(theme)
    updateBackground(theme)
    updateLighting(theme)
    updateAmbientEffects(theme)
}
```

**Design Rationale**: Encapsulating theme logic allows for easy addition of new themes while ensuring visual consistency within each theme package.

### PreferenceStorage

**Purpose**: Handles persistence of customization preferences using browser localStorage with graceful error handling.

**Storage Schema**:
```javascript
{
    version: "1.0",
    preferences: {
        bikeColor: "#00FF00",
        trailColor: "#00FF00", 
        trailStyle: "solid",
        arenaTheme: "classic-grid"
    },
    timestamp: "2024-01-01T00:00:00Z"
}
```

**Key Methods**:
```javascript
class PreferenceStorage {
    savePreferences(preferences)
    loadPreferences()
    clearPreferences()
    isStorageAvailable()
    handleStorageError(error)
}
```

**Design Rationale**: Versioned storage schema allows for future migrations while error handling ensures the game remains playable even if storage fails.

## Data Models

### Color System

**Color Representation**: Colors are stored as hex strings (#RRGGBB) for consistency and easy serialization.

**Preset Colors**:
```javascript
const PRESET_COLORS = {
    red: "#FF0000",
    blue: "#0000FF", 
    green: "#00FF00",
    yellow: "#FFFF00",
    purple: "#800080",
    orange: "#FFA500",
    cyan: "#00FFFF",
    white: "#FFFFFF"
};
```

**Color Validation**: Ensures sufficient contrast with arena backgrounds for visibility:
```javascript
function validateColorContrast(color, backgroundColor) {
    const contrast = calculateContrast(color, backgroundColor);
    return contrast >= 3.0; // WCAG AA standard
}
```

### Trail Style System

**Trail Style Definitions**:
```javascript
const TRAIL_STYLES = {
    solid: {
        opacity: 0.8,
        segments: "continuous",
        effects: []
    },
    dashed: {
        opacity: 0.8,
        segments: "alternating", // render every other segment
        effects: []
    },
    glowing: {
        opacity: 0.9,
        segments: "continuous",
        effects: ["emissive", "bloom"]
    },
    rainbow: {
        opacity: 0.8,
        segments: "continuous", 
        effects: ["color-cycle"]
    }
};
```

### Theme Configuration

**Theme Data Structure**:
```javascript
const THEME_CONFIG = {
    "classic-grid": {
        name: "Classic Grid",
        grid: { color: "#00FFFF", opacity: 0.3 },
        background: { 
            type: "gradient",
            colors: ["#000033", "#000066"]
        },
        lighting: {
            ambient: { color: "#FFFFFF", intensity: 0.4 },
            directional: { color: "#FFFFFF", intensity: 0.6 }
        }
    }
    // ... other themes
};
```

## Error Handling

### Storage Errors
- **localStorage unavailable**: Fall back to session-only preferences
- **Storage quota exceeded**: Clear old data and retry
- **Corrupted data**: Reset to defaults with user notification

### Rendering Errors
- **Invalid colors**: Fall back to default colors
- **Theme loading failure**: Revert to classic theme
- **Performance issues**: Disable complex effects automatically

### User Input Validation
- **Color format validation**: Ensure valid hex format
- **Theme availability**: Verify theme exists before applying
- **Contrast checking**: Warn users about low-contrast combinations

## Testing Strategy

### Unit Tests

**CustomizationManager Tests**:
- Color setting and retrieval
- Trail style application
- Theme switching functionality
- Preview mode state management
- Preference persistence integration

**ThemeEngine Tests**:
- Theme loading and application
- Visual element updates
- Error handling for missing themes
- Performance impact measurement

**PreferenceStorage Tests**:
- Save/load functionality
- Error handling scenarios
- Data migration testing
- Storage availability detection

### Integration Tests

**UI Integration**:
- Color picker functionality
- Real-time preview updates
- Apply/cancel workflows
- Menu accessibility

**Rendering Integration**:
- Visual changes applied correctly
- Performance impact within acceptable limits
- Compatibility with existing game modes
- Multi-player color differentiation

### Visual Testing

**Theme Verification**:
- Screenshot comparison for theme consistency
- Color contrast validation
- Visual effect functionality
- Cross-browser compatibility

### Performance Testing

**Benchmarks**:
- Frame rate impact of different trail styles
- Memory usage with theme switching
- Startup time with saved preferences
- Rendering performance across themes

## Performance Considerations

### Rendering Optimization
- **Material Reuse**: Share materials between similar objects to reduce GPU state changes
- **Batch Updates**: Group visual changes to minimize render calls
- **LOD System**: Reduce trail detail at distance for performance
- **Effect Culling**: Disable expensive effects when not visible

### Memory Management
- **Texture Pooling**: Reuse textures across themes where possible
- **Geometry Sharing**: Share base geometries with different materials
- **Cleanup**: Properly dispose of unused materials and textures

### Loading Strategy
- **Lazy Loading**: Load theme assets only when selected
- **Preloading**: Cache commonly used themes
- **Progressive Enhancement**: Start with basic visuals, enhance progressively

## Implementation Notes

### Integration with Existing Systems

**RenderingEngine Integration**:
The CustomizationManager will extend the existing RenderingEngine by adding customization-aware material creation and management methods. This maintains backward compatibility while adding new functionality.

**Game State Integration**:
Customization state is separate from game state to allow changes during gameplay without affecting game logic. The preview system creates a temporary visual state that doesn't impact collision detection or AI behavior.

**Mobile Considerations**:
The UI will be responsive and touch-friendly, with larger touch targets and simplified interfaces for mobile devices. Performance optimizations will be more aggressive on mobile to maintain smooth gameplay.

### Future Extensibility

**Plugin Architecture**: The system is designed to support future customization types (bike models, particle effects, sound themes) through a plugin-based approach.

**Community Content**: The theme system can be extended to support user-generated themes through JSON configuration files.

**Advanced Effects**: The trail style system can accommodate future advanced effects like particle trails or physics-based ribbons.