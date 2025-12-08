# Test Setup Guide

## Overview

This guide explains the test setup configuration and best practices for writing tests in the LightBikes project.

## Test Setup File: `tests/setup.js`

### What It Provides

1. **Three.js Mocks**: Complete mock implementation of Three.js classes
2. **AudioContext Mock**: Web Audio API mock for music/sound tests
3. **DOM Element Helper**: `global.createMockDOMElement()` for UI tests
4. **Fetch Mock**: Global fetch for loading external resources
5. **Performance API**: Mock `performance.now()` and `requestAnimationFrame()`

### What It DOESN'T Override

- ❌ `document` - Uses JSDOM's native document
- ❌ `window` - Uses JSDOM's native window  
- ❌ `localStorage` - Uses JSDOM's native localStorage

## Best Practices

### ✅ DO: Use JSDOM's Native APIs

```javascript
// Good - uses real JSDOM document
const element = document.createElement('div');
element.id = 'test-element';
document.body.appendChild(element);

// Good - uses real localStorage
localStorage.setItem('key', 'value');
const value = localStorage.getItem('key');
```

### ✅ DO: Mock Specific Methods When Needed

```javascript
// Good - mock specific method
jest.spyOn(document, 'getElementById').mockReturnValue(mockElement);

// Good - mock localStorage method
jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('mock-value');
```

### ✅ DO: Use createMockDOMElement for Complex Mocks

```javascript
// Good - for tests that need controlled mock behavior
const mockButton = global.createMockDOMElement('button', {
    id: 'test-btn',
    className: 'btn-primary',
    dataset: { action: 'submit' }
});

// Verify mock interactions
mockButton.click();
expect(mockButton.click).toHaveBeenCalled();
```

### ❌ DON'T: Override Global Objects

```javascript
// Bad - breaks JSDOM
global.document = { createElement: jest.fn() };

// Bad - causes conflicts
Object.defineProperty(window, 'localStorage', { value: mockStorage });
```

### ❌ DON'T: Create Incomplete Mocks

```javascript
// Bad - missing essential methods
const badMock = {
    addEventListener: jest.fn()
    // Missing removeEventListener, dispatchEvent, etc.
};
```

## Common Test Patterns

### Testing UI Components

```javascript
describe('MyComponent', () => {
    let component;
    let mockElements;

    beforeEach(() => {
        // Create mock elements
        mockElements = {
            container: global.createMockDOMElement('div', { id: 'container' }),
            button: global.createMockDOMElement('button', { id: 'btn' })
        };

        // Mock document.getElementById
        jest.spyOn(document, 'getElementById').mockImplementation(
            (id) => mockElements[id] || null
        );

        component = new MyComponent();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should handle button click', () => {
        mockElements.button.click();
        expect(mockElements.button.click).toHaveBeenCalled();
    });
});
```

### Testing Audio Components

```javascript
describe('AudioComponent', () => {
    let audioContext;

    beforeEach(() => {
        // AudioContext is already mocked globally
        audioContext = new AudioContext();
    });

    it('should create gain node', () => {
        const gainNode = audioContext.createGain();
        expect(audioContext.createGain).toHaveBeenCalled();
        expect(gainNode.gain.value).toBe(1);
    });
});
```

### Testing Async Operations

```javascript
describe('AsyncComponent', () => {
    it('should load data', async () => {
        // fetch is already mocked globally
        const result = await fetch('/api/data');
        const data = await result.arrayBuffer();
        
        expect(fetch).toHaveBeenCalledWith('/api/data');
        expect(data).toBeInstanceOf(ArrayBuffer);
    });
});
```

### Testing Three.js Components

```javascript
describe('3D Component', () => {
    let scene;
    let camera;
    let renderer;

    beforeEach(() => {
        // THREE is already mocked globally
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera();
        renderer = new THREE.WebGLRenderer();
    });

    it('should add object to scene', () => {
        const mesh = new THREE.Mesh();
        scene.add(mesh);
        
        expect(scene.add).toHaveBeenCalledWith(mesh);
    });
});
```

## Troubleshooting

### Issue: "addEventListener is not a function"

**Cause**: Trying to use incomplete mock instead of JSDOM element

**Solution**: Use JSDOM's native document or createMockDOMElement

```javascript
// Before (broken)
const element = { addEventListener: jest.fn() };

// After (fixed)
const element = document.createElement('div');
// or
const element = global.createMockDOMElement('div');
```

### Issue: "localStorage is not defined"

**Cause**: Test environment not properly configured

**Solution**: Ensure jest.config.js has `testEnvironment: 'jsdom'`

```javascript
// jest.config.js
module.exports = {
    testEnvironment: 'jsdom',
    // ...
};
```

### Issue: Async test timeouts

**Cause**: Promises not resolving or async operations hanging

**Solution**: Ensure all async operations are mocked

```javascript
// Mock fetch if component loads data
global.fetch = jest.fn(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'test' })
}));

// Mock timers if component uses setTimeout/setInterval
jest.useFakeTimers();
```

### Issue: "Cannot read property 'x' of undefined"

**Cause**: Mock not returning expected structure

**Solution**: Ensure mocks return complete objects

```javascript
// Before (broken)
jest.spyOn(document, 'getElementById').mockReturnValue(null);

// After (fixed)
jest.spyOn(document, 'getElementById').mockReturnValue(
    global.createMockDOMElement('div', { id: 'test' })
);
```

## Migration Guide

### Migrating from Old Mock Document

If you have tests using the old mock document pattern:

```javascript
// Old pattern (remove this)
const mockDocument = {
    getElementById: jest.fn(),
    createElement: jest.fn()
};
global.document = mockDocument;

// New pattern (use this)
jest.spyOn(document, 'getElementById').mockReturnValue(
    global.createMockDOMElement('div')
);
```

### Migrating from Old Mock localStorage

```javascript
// Old pattern (remove this)
const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn()
};
global.localStorage = mockLocalStorage;

// New pattern (use this)
jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('value');
jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
```

## Available Global Mocks

### THREE (Three.js)
- Scene, WebGLRenderer, PerspectiveCamera
- Geometries: BoxGeometry, SphereGeometry, etc.
- Materials: MeshLambertMaterial, MeshBasicMaterial, etc.
- Mesh, InstancedMesh, Points, LineSegments
- Lights: AmbientLight, DirectionalLight
- Helpers: GridHelper
- Math: Vector3, Euler, Quaternion, Matrix4, Color

### AudioContext
- createGain()
- createBufferSource()
- decodeAudioData()
- resume()
- Properties: currentTime, state, destination

### createMockDOMElement(tagName, options)
Creates a mock DOM element with:
- Standard properties: id, className, style, dataset
- classList: add, remove, contains, toggle
- DOM methods: appendChild, removeChild
- Events: addEventListener, removeEventListener, dispatchEvent
- Interaction: click, focus, blur

### fetch(url, options)
Returns Promise resolving to:
- ok: true
- arrayBuffer(): Promise<ArrayBuffer>

### performance
- now(): Returns 1000 (mocked)

### requestAnimationFrame(callback)
- Calls callback after 16ms (setTimeout)

## Jest Configuration

See `jest.config.js` for full configuration:

```javascript
module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testTimeout: 10000,
    clearMocks: true,
    restoreMocks: true
};
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [JSDOM Documentation](https://github.com/jsdom/jsdom)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)

---

**Last Updated**: 2025-12-08
