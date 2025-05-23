# Console Testing Utilities

This document explains how to use the console testing utilities to manage console output during tests and enable debugging when needed.

## Overview

By default, all console output (`console.log`, `console.error`, `console.warn`, `console.info`, `console.debug`) is mocked during tests to prevent console pollution. This keeps test output clean and focused on test results.

## Global Console Mocking

All console methods are automatically mocked in the test environment via `jest.setup.ts`. This means:

- ✅ Console pollution is eliminated by default
- ✅ Console calls are captured and can be tested with Jest matchers
- ✅ Test output remains clean and readable

## Utility Functions

Three global utility functions are available for managing console output:

### `global.disableConsoleOutput()`

Mocks all console methods to prevent output (default state).

```typescript
// Disable console output (default state)
global.disableConsoleOutput();

console.log("This will not appear in test output");
expect(console.log).toHaveBeenCalledWith("This will not appear in test output");
```

### `global.enableConsoleOutput()`

Restores real console methods to enable actual console output for debugging.

```typescript
// Enable console output for debugging
global.enableConsoleOutput();

console.log("This WILL appear in test output for debugging");
// The above message will be visible in the test runner output

// Remember to disable again after debugging
global.disableConsoleOutput();
```

### `global.restoreOriginalConsole()`

Completely restores the original console object.

```typescript
// Restore original console methods
global.restoreOriginalConsole();
```

## Usage Examples

### Testing Console Output

```typescript
test("should log debug information", () => {
  // Arrange
  const component = new MyComponent();

  // Act
  component.performAction();

  // Assert - Verify console calls were made
  expect(console.log).toHaveBeenCalledWith("[DEBUG] Action performed");
  expect(console.error).toHaveBeenCalledTimes(0);
});
```

### Debugging a Failing Test

```typescript
test("should debug component behavior", () => {
  // Enable console output to see debug information
  global.enableConsoleOutput();

  // Your test code here - console messages will be visible
  const result = myComplexFunction();

  // Disable console output to keep other tests clean
  global.disableConsoleOutput();

  expect(result).toBe(expectedValue);
});
```

### Testing Error Handling

```typescript
test("should handle errors gracefully", () => {
  // Arrange
  const invalidInput = null;

  // Act
  const result = processInput(invalidInput);

  // Assert - Verify error was logged
  expect(console.error).toHaveBeenCalledWith(
    expect.stringContaining("Invalid input"),
  );
  expect(result).toBe(null);
});
```

## Best Practices

### 1. Keep Console Output Disabled by Default

```typescript
describe("MyComponent", () => {
  beforeEach(() => {
    // Ensure clean state
    global.disableConsoleOutput();
  });

  afterEach(() => {
    // Reset to clean state
    global.disableConsoleOutput();
  });
});
```

### 2. Use Console Mocking for Assertions

```typescript
test("should log appropriate messages", () => {
  // Test that console methods are called with expected arguments
  myFunction();

  expect(console.log).toHaveBeenCalledWith("Expected message");
  expect(console.error).not.toHaveBeenCalled();
});
```

### 3. Enable Console Output Only for Debugging

```typescript
test("debugging complex behavior", () => {
  // Only enable when you need to see console output
  global.enableConsoleOutput();

  // Your debugging code here

  // Always disable after debugging
  global.disableConsoleOutput();
});
```

### 4. Test Console Output Patterns

```typescript
test("should log with correct format", () => {
  myLogger.info("user123", "logged in");

  expect(console.log).toHaveBeenCalledWith(
    expect.stringMatching(/\[\d{4}-\d{2}-\d{2}\] user123: logged in/),
  );
});
```

## Common Patterns

### Testing Components with Debug Logging

```typescript
test("PayPal script should log initialization steps", () => {
  // Arrange
  const { result } = renderHook(() => usePayPalScript());

  // Assert - Verify debug logs were called (but not visible in output)
  expect(console.log).toHaveBeenCalledWith(
    expect.stringContaining("[PayPalScript] Initializing"),
  );
});
```

### Debugging Test Failures

```typescript
test("complex integration test", () => {
  // Temporarily enable console for debugging
  global.enableConsoleOutput();

  // Your test code - console messages will help debug issues
  const result = complexIntegrationFunction();

  // Disable console to keep output clean
  global.disableConsoleOutput();

  expect(result).toMatchExpectedBehavior();
});
```

## Migration from Console Pollution

If you have existing tests with console pollution:

1. **No changes needed** - Console mocking is automatic
2. **Add assertions** - Test that console methods are called correctly
3. **Enable debugging** - Use `enableConsoleOutput()` only when debugging

## Troubleshooting

### Console Messages Still Appearing

If you see console messages in test output:

1. Check if `enableConsoleOutput()` was called without corresponding `disableConsoleOutput()`
2. Verify `jest.setup.ts` is properly configured
3. Ensure the test file is using the correct Jest configuration

### Console Assertions Failing

If console assertions fail:

```typescript
// ❌ This might fail if console is not mocked
expect(console.log).toHaveBeenCalled();

// ✅ Ensure console is mocked first
global.disableConsoleOutput();
expect(jest.isMockFunction(console.log)).toBe(true);
```

### Need to See Console Output

For debugging purposes:

```typescript
// Enable console output temporarily
global.enableConsoleOutput();

// Your debugging code here
console.log("Debug information will be visible");

// Always disable after debugging
global.disableConsoleOutput();
```
