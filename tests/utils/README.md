# Test Utilities

Reusable mock factories and test helpers for the LightBikes test suite.

## Mock Factories

### createLocalStorageMock()

Creates a properly configured localStorage mock with all required methods.

```javascript
import { createLocalStorageMock } from './testHelpers.js';

beforeEach(() => {
    global.localStorage = createLocalStorageMock();
});

afterEach(() => {
    delete global.localStorage;
});

it('should save to localStorage', () => {
    localStorage.setItem('key', 'value');
    expect(localStorage.getItem('key')).toBe('value');
});
```

### createPerformanceNowMock(startTime)

Creates a controlled performance.now() mock with time progression helpers.

```javascript
import { createPerformanceNowMock } from './testHelpers.js';

let mockNow;

beforeEach(() => {
    mockNow = createPerformanceNowMock(1000);
    global.performance = { now: mockNow };
});

it('should measure elapsed time', () => {
    timer.start();
    mockNow.advance(2000);
    expect(timer.getElapsedTime()).toBe(2000);
});
```

**Helper Methods:**
- `advance(ms)` - Advance time by milliseconds
- `setTime(time)` - Set absolute time value
- `reset()` - Reset to start time

### createMatchMediaMock(matches)

Creates a matchMedia mock for testing media queries.

```javascript
import { createMatchMediaMock } from './testHelpers.js';

beforeEach(() => {
    global.matchMedia = createMatchMediaMock(false);
});

it('should check media query', () => {
    const result = matchMedia('(prefers-reduced-motion: reduce)');
    expect(result.matches).toBe(false);
});
```

### createLoggerMock()

Creates a logger mock with all standard logging methods.

```javascript
import { createLoggerMock } from './testHelpers.js';

it('should log warnings', () => {
    const logger = createLoggerMock();
    logger.warn('message', { data: 'value' });
    expect(logger.warn).toHaveBeenCalledWith('message', { data: 'value' });
});
```

### createDOMElementMock()

Creates a DOM element mock with common methods and properties.

```javascript
import { createDOMElementMock } from './testHelpers.js';

it('should remove element', () => {
    const element = createDOMElementMock();
    element.remove();
    expect(element.remove).toHaveBeenCalled();
});
```

### createEmissiveMaterialSystemMock()

Creates an emissive material system mock for rendering tests.

```javascript
import { createEmissiveMaterialSystemMock } from './testHelpers.js';

it('should update bike material', () => {
    const system = createEmissiveMaterialSystemMock();
    system.updateBikeMaterial('player', 0xFF0000);
    expect(system.updateBikeMaterial).toHaveBeenCalledWith('player', 0xFF0000);
});
```

## Best Practices

### Always Clean Up Mocks

```javascript
afterEach(() => {
    jest.restoreAllMocks();
    delete global.localStorage;
    delete global.performance;
    delete global.matchMedia;
});
```

### Use Controlled Time for Timing Tests

```javascript
// ❌ Bad - non-deterministic
it('should measure time', () => {
    const start = performance.now();
    // ... do something
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

### Mock All External Dependencies

```javascript
// ✅ Good - all dependencies mocked
beforeEach(() => {
    global.localStorage = createLocalStorageMock();
    global.performance = { now: createPerformanceNowMock() };
    global.matchMedia = createMatchMediaMock();
});
```

## Troubleshooting

### "received value must be a mock or spy function"

**Problem:** Mock methods are plain functions instead of jest.fn()

**Solution:** Use the mock factories which create all methods with jest.fn()

```javascript
// ❌ Bad
const mock = {
    method: () => {}
};

// ✅ Good
const mock = createLoggerMock();
```

### Timing tests are flaky

**Problem:** Tests use real time instead of mocked time

**Solution:** Use createPerformanceNowMock() for controlled time

```javascript
const mockNow = createPerformanceNowMock(1000);
global.performance = { now: mockNow };
```

### localStorage tests fail

**Problem:** localStorage not properly mocked

**Solution:** Use createLocalStorageMock() which includes all required methods

```javascript
global.localStorage = createLocalStorageMock();
```
