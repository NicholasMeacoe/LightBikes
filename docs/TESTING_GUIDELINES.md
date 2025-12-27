# Testing Guidelines

## Overview

This document provides guidelines for writing and maintaining tests in the LightBikes project.

## Test Structure

### Location
- Unit tests: `tests/unit/`
- Integration tests: `tests/integration/`
- Test utilities: `tests/utils/`

### Naming Convention
- Test files: `<ComponentName>.test.js`
- Test utilities: `<utilityName>.js`

## Using Test Helpers

### Available Mock Factories

Import from `tests/utils/testHelpers.js`:

```javascript
const {
    createLocalStorageMock,
    createPerformanceNowMock,
    createMatchMediaMock,
    createLoggerMock,
    createDOMElementMock,
    createEmissiveMaterialSystemMock
} = require('../utils/testHelpers.js');
```

### localStorage Mock

```javascript
beforeEach(() => {
    global.localStorage = createLocalStorageMock();
});

afterEach(() => {
    delete global.localStorage;
});

it('should save data', () => {
    localStorage.setItem('key', 'value');
    expect(localStorage.getItem('key')).toBe('value');
});
```

### Performance.now Mock

```javascript
let mockNow;

beforeEach(() => {
    mockNow = createPerformanceNowMock(1000);
    global.performance = { now: mockNow };
});

it('should measure time', () => {
    timer.start();
    mockNow.advance(2000);
    expect(timer.getElapsedTime()).toBe(2000);
});
```

**Helper Methods**:
- `advance(ms)` - Advance time by milliseconds
- `setTime(time)` - Set absolute time
- `reset()` - Reset to start time

### matchMedia Mock

```javascript
beforeEach(() => {
    global.window = { matchMedia: createMatchMediaMock(false) };
});

it('should check media query', () => {
    const result = window.matchMedia('(prefers-reduced-motion: reduce)');
    expect(result.matches).toBe(false);
});
```

## Module Mocking

### Correct Path Pattern

All mocks from `tests/unit/` should use relative paths to `src/`:

```javascript
// ✅ Correct
jest.mock('../../src/systems/ThemeEngine.js');
jest.mock('../../src/audio/MusicTrack.js');
jest.mock('../../src/rendering/EmissiveMaterialSystem.js');

// ❌ Incorrect
jest.mock('./ThemeEngine.js');
jest.mock('./MusicTrack.js');
```

### Mock Structure

Always use `jest.fn()` for methods:

```javascript
// ✅ Correct
const mock = {
    method: jest.fn(),
    anotherMethod: jest.fn(() => 'return value')
};

// ❌ Incorrect
const mock = {
    method: () => {},
    anotherMethod: function() { return 'value'; }
};
```

## Test Patterns

### Setup and Teardown

```javascript
describe('ComponentName', () => {
    let component;
    
    beforeEach(() => {
        // Setup mocks
        global.localStorage = createLocalStorageMock();
        
        // Create component
        component = new ComponentName();
    });
    
    afterEach(() => {
        // Cleanup
        jest.restoreAllMocks();
        delete global.localStorage;
    });
    
    it('should do something', () => {
        // Test
    });
});
```

### Deterministic Tests

**Always mock time sources**:

```javascript
// ❌ Bad - non-deterministic
it('should measure time', () => {
    const start = performance.now();
    doSomething();
    const elapsed = performance.now() - start;
    expect(elapsed).toBeGreaterThan(0); // Flaky!
});

// ✅ Good - deterministic
it('should measure time', () => {
    const mockNow = createPerformanceNowMock(1000);
    global.performance = { now: mockNow };
    
    timer.start();
    mockNow.advance(2000);
    expect(timer.getElapsedTime()).toBe(2000);
});
```

### Async Tests

```javascript
it('should handle async operations', async () => {
    const promise = component.asyncMethod();
    await expect(promise).resolves.toBe('expected value');
});

it('should handle errors', async () => {
    const promise = component.failingMethod();
    await expect(promise).rejects.toThrow('Error message');
});
```

## Common Pitfalls

### 1. Mock Not a Jest Function

**Problem**: `expect(received).toHaveBeenCalled()` fails with "not a mock function"

**Solution**: Use `jest.fn()`

```javascript
// ❌ Wrong
const mock = { method: () => {} };

// ✅ Right
const mock = { method: jest.fn() };
```

### 2. Timing Tests Fail Intermittently

**Problem**: Tests use real time and fail randomly

**Solution**: Mock `performance.now()`

```javascript
const mockNow = createPerformanceNowMock();
global.performance = { now: mockNow };
```

### 3. Module Not Found

**Problem**: `Cannot find module './SomeModule.js'`

**Solution**: Use correct relative path

```javascript
// From tests/unit/ to src/
jest.mock('../../src/directory/SomeModule.js');
```

### 4. localStorage Not Working

**Problem**: `localStorage.setItem is not a function`

**Solution**: Use `createLocalStorageMock()`

```javascript
global.localStorage = createLocalStorageMock();
```

## Running Tests

### All Tests
```bash
npm test
```

### Specific File
```bash
npm test -- tests/unit/ComponentName.test.js
```

### With Coverage
```bash
npm test -- --coverage
```

### Watch Mode
```bash
npm test -- --watch
```

## Coverage Goals

- **Statements**: 80%+
- **Branches**: 70%+
- **Functions**: 80%+
- **Lines**: 80%+

## Best Practices

1. **One assertion per test** (when possible)
2. **Descriptive test names** - "should do X when Y"
3. **Arrange-Act-Assert** pattern
4. **Mock external dependencies**
5. **Clean up after tests**
6. **Use test helpers** for common mocks
7. **Make tests deterministic** - no random values or real time
8. **Test edge cases** - null, undefined, empty, boundary values

## Example Test

```javascript
const { createLocalStorageMock } = require('../utils/testHelpers.js');
const { MyComponent } = require('@/systems/MyComponent.js');

describe('MyComponent', () => {
    let component;
    
    beforeEach(() => {
        global.localStorage = createLocalStorageMock();
        component = new MyComponent();
    });
    
    afterEach(() => {
        jest.restoreAllMocks();
        delete global.localStorage;
    });
    
    describe('methodName', () => {
        it('should return expected value when given valid input', () => {
            // Arrange
            const input = 'test';
            
            // Act
            const result = component.methodName(input);
            
            // Assert
            expect(result).toBe('expected');
        });
        
        it('should handle null input gracefully', () => {
            expect(() => component.methodName(null)).not.toThrow();
        });
    });
});
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Test Utilities README](../tests/utils/README.md)
- [Test Remediation Summary](../.kiro/specs/test-remediation/REMEDIATION_SUMMARY.md)
