/**
 * Test demonstrating the console pollution fix
 * This test verifies that the PayPal script hook no longer pollutes console output
 */

import { renderHook } from "@testing-library/react";
import { usePayPalScript } from "../../hooks/usePayPalScript";
import React from "react";

// Create a proper wrapper for React 19
function Wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(React.Fragment, null, children);
}

describe("Console Pollution Fix Verification", () => {
  beforeEach(() => {
    // Ensure console is mocked (default state)
    global.disableConsoleOutput();

    // Clear any previous mock calls
    jest.clearAllMocks();

    // Set up environment variables
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID = "test-client-id";
  });

  test("should verify PayPal script hook no longer pollutes console output", () => {
    // Arrange - Mock document methods for PayPal script
    const mockScript = document.createElement("script");
    document.createElement = jest.fn().mockReturnValue(mockScript);
    document.head.appendChild = jest.fn();

    // Act - Render the hook that previously caused console pollution
    const { result } = renderHook(() => usePayPalScript(), {
      wrapper: Wrapper,
    });

    // Assert - Verify console methods were called (but output is mocked)
    expect(jest.isMockFunction(console.log)).toBe(true);
    expect(jest.isMockFunction(console.error)).toBe(true);

    // Verify the hook still functions correctly
    expect(result.current.scriptLoaded).toBeDefined();
    expect(result.current.scriptError).toBeDefined();
    expect(result.current.paypal).toBeDefined();

    // Verify console calls were captured but not displayed
    expect(console.log).toHaveBeenCalled();

    // The key difference: No console pollution in test output!
    // Before the fix: Multiple console.log messages would appear
    // After the fix: Console calls are mocked and captured
  });

  test("should demonstrate clean test output with multiple console calls", () => {
    // This test simulates multiple components that use console logging

    // Act - Multiple console calls that would previously pollute output
    console.log("[Component A] Initializing...");
    console.log("[Component B] Loading data...");
    console.error("[Component C] Handling error...");
    console.warn("[Component D] Warning message...");
    console.info("[Component E] Info message...");
    console.debug("[Component F] Debug information...");

    // Assert - All calls are captured but don't pollute output
    expect(console.log).toHaveBeenCalledWith("[Component A] Initializing...");
    expect(console.log).toHaveBeenCalledWith("[Component B] Loading data...");
    expect(console.error).toHaveBeenCalledWith(
      "[Component C] Handling error...",
    );
    expect(console.warn).toHaveBeenCalledWith(
      "[Component D] Warning message...",
    );
    expect(console.info).toHaveBeenCalledWith("[Component E] Info message...");
    expect(console.debug).toHaveBeenCalledWith(
      "[Component F] Debug information...",
    );

    // Verify total call counts
    expect(console.log).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.debug).toHaveBeenCalledTimes(1);
  });

  test("should allow selective debugging when needed", () => {
    // Demonstrate that we can still enable console output for debugging

    // Act - Enable console output for debugging
    global.enableConsoleOutput();

    // This message will actually appear in test output for debugging
    console.log("🐛 DEBUG: This message appears for debugging purposes");

    // Disable console output again
    global.disableConsoleOutput();

    // This message will be mocked and not appear
    console.log("This message is mocked and won't appear");

    // Assert - Verify the debugging capability works
    expect(console.log).toHaveBeenCalledWith(
      "This message is mocked and won't appear",
    );
  });

  test("should maintain test performance with console mocking", () => {
    // Performance test - console mocking should not impact test speed

    const startTime = Date.now();

    // Act - Perform many console operations
    for (let i = 0; i < 1000; i++) {
      console.log(`Log message ${i}`);
      console.error(`Error message ${i}`);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Assert - Operations should complete quickly (mocked calls are fast)
    expect(duration).toBeLessThan(100); // Should complete in under 100ms
    expect(console.log).toHaveBeenCalledTimes(1000);
    expect(console.error).toHaveBeenCalledTimes(1000);
  });
});
