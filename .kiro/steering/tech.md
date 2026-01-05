# LightBikes Technical Stack

## Core Technologies
- **Runtime**: Browser (ES6+)
- **Graphics**: Three.js (WebGL) - loaded via CDN
- **Module System**: CommonJS (Node.js style)
- **Build Tool**: Browserify
- **Testing**: Jest with jsdom environment

## Project Structure
- **Entry Point**: `index.html` loads Three.js CDN and `bundle.js`
- **Main Orchestrator**: `script.js` coordinates all components
- **Modular Architecture**: Separate files for game logic, AI, collision, rendering, controls

## Build System

### Development Commands
```bash
# Run tests with coverage
npm test

# Build bundle for production
npm run build

# Install dependencies
npm install
```

### Build Process
- Browserify bundles all CommonJS modules into `bundle.js`
- Three.js loaded externally via CDN (r128)
- No transpilation - uses native ES6+ features

## Testing Framework
- **Framework**: Jest 29.7.0
- **Environment**: jsdom for DOM simulation
- **Coverage**: Maintains 96%+ statement coverage
- **Test Files**: `*.test.js` pattern
- **Structure**: Describe/it blocks with beforeEach setup

### Test Patterns
```javascript
describe('ComponentName', () => {
    let component;
    
    beforeEach(() => {
        component = new ComponentName();
    });
    
    describe('methodName', () => {
        it('should handle specific case', () => {
            // Arrange, Act, Assert
        });
    });
});
```

## Dependencies
- **Production**: None (Three.js via CDN)
- **Development**: 
  - `browserify` ^17.0.1 - Module bundling
  - `jest` ^29.7.0 - Testing framework
  - `jest-environment-jsdom` ^29.7.0 - DOM simulation

## Architecture Patterns
- **Separation of Concerns**: Each module has single responsibility
- **Dependency Injection**: Components receive dependencies via constructor
- **Game Loop Pattern**: Central animation loop coordinates systems
- **Entity-Component**: Game entities as data objects with controllers

## Performance Considerations
- Frame-based updates (0.1 units per frame)
- Incremental trail rendering (only new segments)
- Object pooling potential for trail segments
- No delta-time calculations for deterministic behavior