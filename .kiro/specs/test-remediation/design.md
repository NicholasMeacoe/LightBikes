# Test Remediation Design

## Overview

This design addresses 334 failing tests across the LightBikes test suite. The failures fall into distinct categories: mock configuration issues (40% of failures), timing-related failures (25%), module resolution errors (20%), syntax errors (10%), and test logic issues (5%). The remediation strategy focuses on creating reusable test utilities, fixing systematic issues, and ensuring all tests are deterministic and isolated.

## Architecture

### Test Failure Categories

```
Test Failures (334 total)
├── Mock Configuration Issues (133 failures)
│   ├── localStorage not properly mocked
│   ├── emissiveMaterialSystem methods not jest.fn()
│   ├── matchMedia not mocked
│   └── logger parameter mismatches
├── Timing Issues (84 failures)
│   ├── performance.now() not mocked
│   ├── Real time used instead of controlled time
│   └── Timing precision mismatches
├── Module Resolution (67 failures)
│   ├── Incorrect relative paths
│   ├── Missing module mocks
│   └── Path inconsistencies
├── Syntax Errors (34 failures)
│   ├── Invalid object literal syntax
│   └── Parsing errors
└── Test Logic Issues (16 failures)
    ├── Incorrect assertions
    ├── Wrong expected values
    └── Implementation mismatches
```

### Remediation Strategy

1. **Create Test Utilities**: Build reusable mock factories for common patterns
2. **Fix Systematic Issues**: Address root causes affecting multiple tests
3. **Update Test Logic**: Align assertions with actual implementation
4. **Validate Fixes**: Run tests incrementally to verify fixes
5. **Document Changes**: Record all fixes for future reference

## Components and Interfaces

### 1. Test Utilities Module

**Purpose**: Provide reusable mock factories and test helpers

**Location**: `tests/utils/testHelpers.js`

**Interface**:
```javascript
// Mock Factories
export function createLocalStorageMock()
export function createPerformanceNowMock(startTime = 0)
export function createMatchMediaMock(matches = false)
export function createLoggerMock()
export function createDOMElementMock()

// Test Helpers
export function mockTime(testFn, timeValues)
export function withMockedStorage(testFn)
export function cleanupMocks()
```

**Responsibilities**:
- Provide properly configured Jest mocks
- Ensure mocks have all required methods
- Handle mock cleanup automatically
- Support common test patterns

### 2. LocalStorage Mock Factory

**Purpose**: Create consistent localStorage mocks across all tests

**Implementation**:
```javascript
export function createLocalStorageMock() {
    const store = {};
    return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => { store[key] = value; }),
        removeItem: jest.fn((key) => { delete store[key]; }),
        clear: jest.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
        get length() { return Object.keys(store).length; },
        key: jest.fn((index) => Object.keys(store)[index] || null),
        store // Expose for test inspection
    };
}
```

**Usage Pattern**:
```javascript
beforeEach(() => {
    global.localStorage = createLocalStorageMock();
});

afterEach(() => {
    delete global.localStorage;
});
```

### 3. Performance.now Mock Factory

**Purpose**: Provide controlled time progression for timing tests

**Implementation**:
```javascript
export function createPerformanceNowMock(startTime = 0) {
    let currentTime = startTime;
    const mock = jest.fn(() => currentTime);
    
    mock.advance = (ms) => { currentTime += ms; };
    mock.setTime = (time) => { currentTime = time; };
    mock.reset = () => { currentTime = startTime; };
    
    return mock;
}
```

**Usage Pattern**:
```javascript
let mockPerformanceNow;

beforeEach(() => {
    mockPerformanceNow = createPerformanceNowMock(1000);
    global.performance = { now: mockPerformanceNow };
});

it('should measure elapsed time', () => {
    timer.start();
    mockPerformanceNow.advance(2000);
    expect(timer.getElapsedTime()).toBe(2000);
});
```

### 4. EmissiveMaterialSystem Mock Factory

**Purpose**: Create properly mocked material system for rendering tests

**Implementation**:
```javascript
export function createEmissiveMaterialSystemMock() {
    return {
        updateBikeMaterial: jest.fn(),
        updateTrailMaterialTemplate: jest.fn(),
        getBikeMaterial: jest.fn(() => ({ color: 0xFFFFFF })),
        getTrailMaterial: jest.fn(() => ({ color: 0xFFFFFF })),
        dispose: jest.fn()
    };
}
```

### 5. Module Path Resolver

**Purpose**: Ensure consistent module resolution across test files

**Strategy**:
- All test files in `tests/unit/` should use `../../src/` prefix for source imports
- Mock paths should match actual module locations
- Use absolute paths from project root in jest.mock() calls when possible

**Path Mapping**:
```javascript
// Correct patterns
'../../src/utils/scorePersistence.js'
'../../src/rendering/ThemeEngine.js'
'../../src/audio/MusicTrack.js'
'../../src/audio/MusicConfig.js'

// Mock patterns
jest.mock('../../src/utils/scorePersistence.js', () => ({ ... }))
```

## Data Models

### Test Failure Record

```javascript
{
    testFile: string,
    testName: string,
    failureType: 'mock' | 'timing' | 'module' | 'syntax' | 'logic',
    errorMessage: string,
    rootCause: string,
    fixApplied: string,
    requirementsAddressed: string[]
}
```

### Mock Configuration

```javascript
{
    mockType: string,
    methods: {
        [methodName]: {
            implementation: Function,
            returnValue: any,
            mockType: 'fn' | 'returnValue' | 'implementation'
        }
    },
    cleanup: Function
}
```

## Error Handling

### Mock Configuration Errors

**Problem**: Tests fail with "received value must be a mock or spy function"

**Root Cause**: Mock properties are plain functions instead of jest.fn()

**Solution**:
```javascript
// Before (incorrect)
const mock = {
    method: () => {}
};

// After (correct)
const mock = {
    method: jest.fn()
};
```

### Timing Precision Errors

**Problem**: Tests expect exact time values but get floating-point precision differences

**Root Cause**: performance.now() returns high-precision timestamps

**Solution**:
```javascript
// Before (incorrect)
expect(timer.getElapsedTime()).toBe(2000);

// After (correct) - use mocked time
mockPerformanceNow.setTime(3000);
expect(timer.getElapsedTime()).toBe(2000);
```

### Module Resolution Errors

**Problem**: Tests fail with "Cannot find module"

**Root Cause**: Incorrect relative paths from test file to source file

**Solution**:
```javascript
// Before (incorrect)
jest.mock('./scorePersistence.js')

// After (correct)
jest.mock('../../src/utils/scorePersistence.js')
```

### Syntax Errors

**Problem**: Jest fails to parse test files

**Root Cause**: Invalid object literal syntax or unsupported features

**Solution**:
```javascript
// Before (incorrect)
const mock = {
    warn: jest.fn(),  // Missing proper object syntax
}

// After (correct)
const mock = {
    warn: jest.fn()
};
```

## Testing Strategy

### Incremental Validation

1. **Fix by Category**: Address all failures in one category before moving to next
2. **Run Subset**: Test individual files as they're fixed
3. **Verify No Regression**: Ensure fixes don't break passing tests
4. **Check Coverage**: Confirm coverage remains stable

### Test Execution Pattern

```bash
# Fix individual test file
npm test -- tests/unit/SurvivalTimer.test.js

# Fix category of tests
npm test -- tests/unit/*Timer*.test.js

# Run all tests to verify
npm test

# Check coverage
npm test -- --coverage
```

### Validation Criteria

- All 334 failing tests must pass
- Zero new test failures introduced
- Coverage remains at 79%+ statements, 70%+ branches, 81%+ functions
- Test execution time doesn't increase significantly (< 10% increase)

## Implementation Considerations

### Test Isolation

**Principle**: Each test should be independent and not rely on external state

**Practices**:
- Use beforeEach/afterEach for setup/cleanup
- Mock all external dependencies
- Reset mocks between tests
- Don't share state between tests

### Mock Cleanup

**Principle**: Mocks should be cleaned up to prevent test pollution

**Pattern**:
```javascript
let mockPerformanceNow;

beforeEach(() => {
    mockPerformanceNow = createPerformanceNowMock();
    global.performance = { now: mockPerformanceNow };
});

afterEach(() => {
    jest.restoreAllMocks();
    delete global.performance;
});
```

### Deterministic Tests

**Principle**: Tests should produce same results every time

**Practices**:
- Mock all time sources (Date.now, performance.now)
- Mock all random sources (Math.random)
- Mock all external APIs (fetch, localStorage)
- Use controlled test data

### Performance Considerations

**Test Execution Speed**:
- Mock factories should be lightweight (< 1ms creation time)
- Avoid unnecessary mock complexity
- Use jest.fn() instead of full implementations when possible
- Clean up mocks efficiently

**Memory Usage**:
- Don't accumulate mock data across tests
- Clear mock stores in afterEach
- Avoid creating large test fixtures

## Design Decisions

### Why Create Test Utilities?

**Problem**: Mock setup code is duplicated across 50+ test files

**Decision**: Create centralized test utilities module

**Rationale**:
- Reduces duplication
- Ensures consistency
- Makes tests easier to maintain
- Provides single source of truth for mock patterns

### Why Mock performance.now()?

**Problem**: Timing tests are non-deterministic and fail intermittently

**Decision**: Mock performance.now() with controlled time progression

**Rationale**:
- Makes tests deterministic
- Eliminates timing-related flakiness
- Allows precise control over time progression
- Matches testing best practices

### Why Fix Module Paths?

**Problem**: Tests can't find modules due to incorrect relative paths

**Decision**: Standardize on `../../src/` prefix for all source imports

**Rationale**:
- Consistent pattern across all tests
- Matches actual file structure
- Easy to understand and maintain
- Works with Jest module resolution

### Why Use jest.fn() for All Mock Methods?

**Problem**: Tests fail when trying to use Jest matchers on plain functions

**Decision**: All mock methods must be created with jest.fn()

**Rationale**:
- Enables Jest matchers (toHaveBeenCalled, etc.)
- Provides call tracking
- Supports mockReturnValue and mockImplementation
- Standard Jest testing pattern

## Migration Path

### Phase 1: Create Test Utilities (Tasks 1-3)
- Create testHelpers.js module
- Implement mock factories
- Document usage patterns

### Phase 2: Fix Mock Configuration (Tasks 4-8)
- Update localStorage mocks
- Fix emissiveMaterialSystem mocks
- Fix matchMedia mocks
- Fix logger mocks

### Phase 3: Fix Timing Issues (Tasks 9-11)
- Mock performance.now() in SurvivalTimer tests
- Update time-dependent assertions
- Verify timing precision

### Phase 4: Fix Module Resolution (Tasks 12-16)
- Update scorePersistence imports
- Update ThemeEngine imports
- Update MusicTrack imports
- Fix all module paths

### Phase 5: Fix Syntax and Logic (Tasks 17-22)
- Fix syntax errors
- Update test assertions
- Fix performance test expectations
- Verify all tests pass

### Phase 6: Documentation (Task 23)
- Document all fixes
- Create remediation summary
- Update testing guidelines

## Success Metrics

- **Test Pass Rate**: 100% (3,569/3,569 tests passing)
- **Coverage Maintained**: 79%+ statements, 70%+ branches, 81%+ functions
- **Zero Regressions**: No previously passing tests fail
- **Execution Time**: < 35 seconds total (< 10% increase)
- **Documentation**: All fixes documented with rationale
