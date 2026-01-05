# Camera Shake & Motion Blur Design

## Overview

The Camera Shake & Motion Blur system enhances LightBikes' visual impact through dynamic camera effects that respond to gameplay events. The system provides two primary effects: camera shake for collisions and near-misses, and motion blur during high-speed movement. The design prioritizes accessibility with comprehensive configuration options while maintaining seamless integration with the existing Three.js rendering pipeline.

## Architecture

### Core Components

```
CameraEffectsManager
├── CameraShakeController
│   ├── ShakeGenerator (intensity calculation)
│   ├── ShakeAnimator (smooth interpolation)
│   └── NearMissDetector (proximity detection)
├── MotionBlurController
│   ├── BlurRenderer (post-processing)
│   └── SpeedTracker (velocity monitoring)
└── EffectsConfigManager
    ├── AccessibilityHandler (motion preferences)
    └── SettingsStorage (persistence)
```

### Integration Points

The system integrates with existing LightBikes components:
- **RenderingEngine**: Camera manipulation and post-processing pipeline
- **Game**: Event notifications (collisions, speed changes)
- **Collision**: Near-miss detection data
- **Settings**: Configuration persistence and UI integration

## Components and Interfaces

### CameraEffectsManager

Primary orchestrator that coordinates all camera effects and manages their lifecycle.

```javascript
class CameraEffectsManager {
    constructor(camera, renderer, gameState) {
        this.camera = camera;
        this.renderer = renderer;
        this.gameState = gameState;
        this.shakeController = new CameraShakeController(camera);
        this.motionBlurController = new MotionBlurController(renderer);
        this.configManager = new EffectsConfigManager();
    }

    // Event handlers
    onCollision(entity, intensity = 1.0)
    onNearMiss(entity, distance)
    onSpeedChange(entity, newSpeed)
    
    // Configuration
    updateSettings(settings)
    getSettings()
    
    // Lifecycle
    update(deltaTime)
    pause()
    resume()
    destroy()
}
```

### CameraShakeController

Manages camera shake effects with smooth interpolation and configurable intensity.

```javascript
class CameraShakeController {
    constructor(camera) {
        this.camera = camera;
        this.originalPosition = camera.position.clone();
        this.shakeOffset = new THREE.Vector3();
        this.activeShakes = [];
        this.nearMissDetector = new NearMissDetector();
    }

    // Shake triggering
    triggerCollisionShake(intensity, duration = 1.0)
    triggerNearMissShake(distance, duration = 0.3)
    
    // Animation
    update(deltaTime)
    applyShakeOffset()
    
    // Configuration
    setIntensityMultiplier(multiplier) // 0.0 to 2.0
    setEnabled(enabled)
}
```

**Design Rationale**: Separate shake instances allow multiple simultaneous effects (e.g., collision shake while near-miss occurs). The additive approach creates natural-feeling combined effects.

### MotionBlurController

Implements motion blur through Three.js post-processing with performance optimization.

```javascript
class MotionBlurController {
    constructor(renderer) {
        this.renderer = renderer;
        this.composer = new THREE.EffectComposer(renderer);
        this.motionBlurPass = new THREE.MotionBlurPass();
        this.speedTracker = new SpeedTracker();
        this.setupPostProcessing();
    }

    // Blur control
    updateBlurIntensity(speed)
    setEnabled(enabled)
    
    // Performance
    setQuality(quality) // Low, Medium, High
    
    // Integration
    render(scene, camera)
    resize(width, height)
}
```

**Design Rationale**: Uses Three.js EffectComposer for efficient post-processing. Motion blur is applied at the scene level rather than per-object for better performance and visual consistency.

### NearMissDetector

Specialized component for detecting close encounters between entities and obstacles.

```javascript
class NearMissDetector {
    constructor() {
        this.detectionRadius = 1.0; // units
        this.lastNearMiss = 0;
        this.cooldownPeriod = 100; // ms to prevent spam
    }

    // Detection
    checkNearMiss(entity, obstacles)
    calculateDistance(point1, point2)
    
    // Configuration
    setDetectionRadius(radius)
    setCooldownPeriod(ms)
}
```

**Design Rationale**: Separate detector allows fine-tuning of near-miss sensitivity without affecting collision detection. Cooldown prevents excessive shake triggering during extended close encounters.

## Data Models

### ShakeInstance

Represents an individual shake effect with its own lifecycle and properties.

```javascript
class ShakeInstance {
    constructor(intensity, duration, type) {
        this.intensity = intensity;      // 0.0 to 2.0
        this.duration = duration;        // seconds
        this.type = type;               // 'collision' | 'nearMiss'
        this.elapsed = 0;
        this.offset = new THREE.Vector3();
        this.decayFunction = this.createDecayFunction();
    }

    update(deltaTime) {
        this.elapsed += deltaTime;
        const progress = this.elapsed / this.duration;
        
        if (progress >= 1.0) {
            return false; // Effect complete
        }
        
        const currentIntensity = this.intensity * this.decayFunction(progress);
        this.generateOffset(currentIntensity);
        return true;
    }
}
```

### EffectsSettings

Configuration object for all camera effects with validation and defaults.

```javascript
const EffectsSettings = {
    shakeEnabled: true,
    shakeIntensity: 1.0,        // 0.0 to 2.0 multiplier
    motionBlurEnabled: true,
    motionBlurQuality: 'medium', // 'low' | 'medium' | 'high'
    accessibilityMode: false,   // Disables all effects
    respectSystemPreferences: true
};
```

## Error Handling

### Graceful Degradation

The system implements multiple fallback strategies:

1. **WebGL Compatibility**: If post-processing fails, motion blur gracefully disables
2. **Performance Monitoring**: Automatic quality reduction if frame rate drops below 45 FPS
3. **Memory Management**: Effect cleanup prevents memory leaks during long sessions
4. **Settings Validation**: Invalid configurations fall back to safe defaults

### Error Recovery

```javascript
class EffectsErrorHandler {
    handleWebGLError(error) {
        console.warn('Motion blur disabled due to WebGL limitation:', error);
        this.motionBlurController.setEnabled(false);
        this.showUserNotification('Motion blur unavailable on this device');
    }

    handlePerformanceIssue(frameRate) {
        if (frameRate < 45) {
            this.motionBlurController.setQuality('low');
            if (frameRate < 30) {
                this.motionBlurController.setEnabled(false);
            }
        }
    }
}
```

**Design Rationale**: Progressive degradation ensures the game remains playable even when advanced effects aren't supported. User notifications maintain transparency about feature availability.

## Testing Strategy

### Unit Testing

Each component includes comprehensive unit tests:

- **CameraShakeController**: Shake generation, intensity scaling, timing accuracy
- **MotionBlurController**: Post-processing setup, performance monitoring
- **NearMissDetector**: Distance calculations, cooldown behavior
- **EffectsConfigManager**: Settings validation, persistence, accessibility handling

### Integration Testing

Cross-component functionality testing:

- Camera shake coordination with game events
- Motion blur activation during speed changes
- Settings changes affecting all components simultaneously
- Accessibility mode disabling all effects properly

### Performance Testing

Automated performance validation:

- Frame rate monitoring during intensive shake sequences
- Memory usage tracking during extended gameplay
- WebGL resource management verification
- Mobile device compatibility testing

### Accessibility Testing

Compliance with motion sensitivity requirements:

- System preference detection (prefers-reduced-motion)
- Complete effect disabling verification
- Settings persistence across sessions
- Clear UI indication of disabled states

## Implementation Considerations

### Performance Optimization

1. **Effect Pooling**: Reuse ShakeInstance objects to minimize garbage collection
2. **Selective Updates**: Only update active effects, skip disabled components
3. **Quality Scaling**: Automatic quality adjustment based on device capabilities
4. **Efficient Interpolation**: Use optimized easing functions for smooth animations

### Accessibility Integration

The system respects both explicit user preferences and system-level accessibility settings:

```javascript
class AccessibilityHandler {
    constructor() {
        this.systemPreference = this.detectSystemPreference();
        this.userOverride = null;
    }

    detectSystemPreference() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    shouldDisableEffects() {
        return this.userOverride !== null ? 
               this.userOverride : 
               this.systemPreference;
    }
}
```

### Cross-Platform Compatibility

- **Mobile Optimization**: Reduced effect intensity on touch devices
- **WebGL Fallbacks**: Graceful degradation for limited graphics capabilities
- **Browser Compatibility**: Feature detection for post-processing support
- **Performance Scaling**: Automatic adjustment based on device performance

**Design Rationale**: The layered approach to accessibility ensures users have control while respecting system preferences. Performance scaling maintains smooth gameplay across diverse hardware capabilities.