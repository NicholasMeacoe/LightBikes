# Particle Effects Design Document

## Overview

The Particle Effects system enhances LightBikes with dynamic visual feedback through sparks, explosions, and collection effects. The system integrates seamlessly with the existing Three.js rendering pipeline while maintaining 60 FPS performance through efficient particle pooling and adaptive quality controls.

## Architecture

### Core Components

```
ParticleSystem (Main Controller)
├── ParticlePool (Memory Management)
├── ParticleEmitter (Effect Generation)
├── ParticleRenderer (Visual Output)
└── ParticleSettings (Configuration)
```

### Integration Points

- **RenderingEngine**: Particle rendering integrated into existing Three.js scene
- **Game Loop**: Particle updates synchronized with main animation loop
- **Game State**: Particle effects triggered by game events (crashes, collections, movement)
- **Settings System**: Particle preferences stored in browser localStorage

## Components and Interfaces

### ParticleSystem Class

```javascript
class ParticleSystem {
    constructor(scene, settings = {})
    
    // Core Methods
    update(deltaTime, gameState)
    render()
    
    // Effect Triggers
    emitTrailSparks(position, velocity, color)
    createExplosion(position, intensity)
    createCollectionEffect(position, powerUpType)
    
    // Performance Management
    setQualityLevel(level) // 'low', 'medium', 'high'
    getActiveParticleCount()
    
    // State Management
    pause()
    resume()
    reset()
}
```

### Particle Entity Structure

```javascript
class Particle {
    constructor() {
        this.position = new THREE.Vector3()
        this.velocity = new THREE.Vector3()
        this.acceleration = new THREE.Vector3()
        this.color = new THREE.Color()
        this.size = 0.05
        this.lifetime = 1.0
        this.age = 0
        this.active = false
        this.type = 'trail' // 'trail', 'explosion', 'collection'
    }
}
```

### ParticlePool Implementation

```javascript
class ParticlePool {
    constructor(maxParticles = 200) {
        this.particles = []
        this.activeCount = 0
        this.maxParticles = maxParticles
    }
    
    acquire() // Get available particle
    release(particle) // Return particle to pool
    getActiveParticles() // Get currently active particles
}
```

### ParticleEmitter Configuration

```javascript
const EmitterConfigs = {
    trailSparks: {
        emissionRate: 10, // particles per second
        lifetime: { min: 0.5, max: 1.0 },
        size: { min: 0.03, max: 0.07 },
        velocity: { min: 0.5, max: 1.5 },
        fadeOut: true
    },
    
    explosion: {
        burstCount: 25,
        lifetime: { min: 1.5, max: 2.0 },
        size: { min: 0.1, max: 0.2 },
        velocity: { min: 2.0, max: 4.0 },
        colors: ['#ff4500', '#ff6600', '#ff8800']
    },
    
    collection: {
        burstCount: 15,
        lifetime: 1.0,
        size: { min: 0.05, max: 0.1 },
        velocity: { min: 1.0, max: 2.5 },
        upwardBias: 0.7 // 70% upward velocity
    }
}
```

## Data Models

### Particle Rendering Data

```javascript
// Three.js BufferGeometry for efficient rendering
const particleGeometry = new THREE.BufferGeometry()
const positions = new Float32Array(maxParticles * 3)
const colors = new Float32Array(maxParticles * 3)
const sizes = new Float32Array(maxParticles)
const alphas = new Float32Array(maxParticles)

particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
particleGeometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1))
```

### Settings Data Model

```javascript
const ParticleSettings = {
    enabled: true,
    quality: 'medium', // 'low', 'medium', 'high'
    effects: {
        trailSparks: true,
        explosions: true,
        collections: true
    },
    performance: {
        maxParticles: 200,
        adaptiveQuality: true,
        targetFPS: 60
    }
}
```

## Error Handling

### Performance Degradation Response

```javascript
class PerformanceMonitor {
    constructor(targetFPS = 60) {
        this.targetFPS = targetFPS
        this.frameHistory = []
        this.degradationThreshold = 50 // FPS
    }
    
    checkPerformance() {
        const avgFPS = this.calculateAverageFPS()
        if (avgFPS < this.degradationThreshold) {
            return this.suggestQualityReduction()
        }
        return null
    }
    
    suggestQualityReduction() {
        // Reduce particle count by 25%
        // Disable least important effects
        // Reduce emission rates
    }
}
```

### Graceful Degradation Strategy

1. **Level 1**: Reduce trail spark emission rate by 50%
2. **Level 2**: Disable trail sparks, keep explosions and collections
3. **Level 3**: Reduce explosion particle count by 50%
4. **Level 4**: Disable all particles except essential collision feedback

### Error Recovery

```javascript
try {
    particleSystem.update(deltaTime, gameState)
} catch (error) {
    console.warn('Particle system error:', error)
    particleSystem.reset() // Clear all particles and restart
    particleSystem.setQualityLevel('low') // Reduce quality temporarily
}
```

## Testing Strategy

### Unit Tests

1. **ParticlePool Tests**
   - Particle acquisition and release
   - Pool overflow handling
   - Memory leak prevention

2. **ParticleSystem Tests**
   - Effect triggering accuracy
   - Performance threshold compliance
   - State management (pause/resume/reset)

3. **Particle Physics Tests**
   - Velocity and acceleration calculations
   - Lifetime management
   - Color and size interpolation

### Integration Tests

1. **Rendering Integration**
   - Three.js scene integration
   - Buffer attribute updates
   - Shader compatibility

2. **Game Loop Integration**
   - Update timing accuracy
   - Event trigger responsiveness
   - Performance impact measurement

### Performance Tests

1. **Load Testing**
   - Maximum particle count scenarios
   - Sustained high-activity periods
   - Memory usage monitoring

2. **Quality Adaptation Testing**
   - Automatic quality reduction triggers
   - Performance recovery validation
   - Setting persistence verification

## Implementation Details

### Shader Implementation

```glsl
// Vertex Shader
attribute float size;
attribute float alpha;
varying float vAlpha;

void main() {
    vAlpha = alpha;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
}

// Fragment Shader
varying float vAlpha;
uniform sampler2D particleTexture;

void main() {
    vec4 color = texture2D(particleTexture, gl_PointCoord);
    gl_FragColor = vec4(color.rgb, color.a * vAlpha);
}
```

### Performance Optimizations

1. **Object Pooling**: Reuse particle objects to minimize garbage collection
2. **Batch Rendering**: Update all particles in single buffer operations
3. **Culling**: Skip updates for particles outside camera view
4. **LOD System**: Reduce particle detail at distance
5. **Adaptive Quality**: Automatically adjust settings based on performance

### Memory Management

- Pre-allocate maximum particle arrays at initialization
- Use typed arrays (Float32Array) for better performance
- Implement circular buffer for particle pool
- Clear unused particles immediately when effects end

## Design Rationales

### Three.js Points System Choice
- **Rationale**: Uses GPU-accelerated point sprites for optimal performance
- **Alternative Considered**: Individual mesh instances (rejected due to performance cost)
- **Benefit**: Handles 200+ particles at 60 FPS on target hardware

### Object Pooling Strategy
- **Rationale**: Prevents garbage collection spikes during intense particle activity
- **Implementation**: Pre-allocated pool with circular reuse pattern
- **Benefit**: Consistent frame timing and memory usage

### Adaptive Quality System
- **Rationale**: Maintains playability on varying hardware capabilities
- **Trigger**: Automatic reduction when FPS drops below 50
- **Recovery**: Gradual quality restoration when performance improves

### Effect-Specific Design Decisions

#### Trail Sparks
- **Small Size (0.05 units)**: Subtle enhancement without visual clutter
- **Speed-Proportional Emission**: More dramatic at high speeds, efficient at low speeds
- **Color Matching**: Maintains visual consistency with existing trail system

#### Explosion Effects
- **Radial Burst Pattern**: Intuitive visual representation of collision impact
- **Larger Particles (0.1-0.2 units)**: Ensures visibility during chaotic moments
- **Longer Lifetime (1.5-2.0s)**: Provides satisfying visual feedback duration

#### Collection Effects
- **Upward Bias**: Celebratory feel matching power-up acquisition
- **Color Matching**: Immediate visual association with collected item type
- **Medium Duration (1.0s)**: Clear feedback without screen clutter

### Integration Philosophy
- **Non-Intrusive**: Enhances existing visuals without replacing core elements
- **Performance-First**: Never compromises gameplay smoothness for visual effects
- **Modular Design**: Can be disabled entirely without affecting game functionality
- **Future-Extensible**: Architecture supports additional effect types and customization