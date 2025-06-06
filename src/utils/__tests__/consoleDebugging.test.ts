/**
 * Console Debugging Tests
 * These tests demonstrate how to enable console output for debugging purposes
 * Run with DEBUG_CONSOLE_TESTS=true to see actual console output
 *
 * Usage:
 * - Normal run: npm test consoleDebugging.test.ts (no console output)
 * - Debug run: DEBUG_CONSOLE_TESTS=true npm test consoleDebugging.test.ts (with console output)
 */

const DEBUG_MODE = process.env.DEBUG_CONSOLE_TESTS === "true";

describe("Console Debugging Examples", () => {
  beforeEach(() => {
    // Start with mocked console by default
    global.disableConsoleOutput();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Always reset to mocked state
    global.disableConsoleOutput();
  });

  describe("debugging component behavior", () => {
    test("should demonstrate debugging a component with console output", () => {
      // Enable console output only if in debug mode
      if (DEBUG_MODE) {
        global.enableConsoleOutput();
        console.log("🐛 DEBUG MODE ENABLED - Console output will be visible");
      }

      // Simulate a component that logs debug information
      const debugComponent = (message: string) => {
        console.log(`[DEBUG] Component: ${message}`);
        console.error(`[ERROR] Component error: ${message}`);
        console.warn(`[WARN] Component warning: ${message}`);
        return `Processed: ${message}`;
      };

      // Act
      const result = debugComponent("test data");

      // Assert - Component functionality works regardless of debug mode
      expect(result).toBe("Processed: test data");

      if (DEBUG_MODE) {
        // In debug mode, console output is visible above
        console.log("🐛 DEBUG: Component test completed successfully");
      } else {
        // In normal mode, verify console calls were captured
        expect(console.log).toHaveBeenCalledWith(
          "[DEBUG] Component: test data",
        );
        expect(console.error).toHaveBeenCalledWith(
          "[ERROR] Component error: test data",
        );
        expect(console.warn).toHaveBeenCalledWith(
          "[WARN] Component warning: test data",
        );
      }
    });

    test("should demonstrate debugging async operations", async () => {
      if (DEBUG_MODE) {
        global.enableConsoleOutput();
        console.log("🐛 DEBUG: Testing async operation...");
      }

      // Simulate an async operation with logging
      const asyncOperation = async (data: string) => {
        console.log(`[ASYNC] Starting operation with: ${data}`);

        // Simulate async work
        await new Promise((resolve) => setTimeout(resolve, 10));

        console.log(`[ASYNC] Operation completed for: ${data}`);
        return `Result: ${data}`;
      };

      // Act
      const result = await asyncOperation("test-data");

      // Assert
      expect(result).toBe("Result: test-data");

      if (DEBUG_MODE) {
        console.log("🐛 DEBUG: Async operation test completed");
      } else {
        expect(console.log).toHaveBeenCalledWith(
          "[ASYNC] Starting operation with: test-data",
        );
        expect(console.log).toHaveBeenCalledWith(
          "[ASYNC] Operation completed for: test-data",
        );
      }
    });
  });

  describe("debugging error scenarios", () => {
    test("should demonstrate debugging error handling", () => {
      if (DEBUG_MODE) {
        global.enableConsoleOutput();
        console.log("🐛 DEBUG: Testing error handling...");
      }

      // Simulate error handling with logging
      const errorHandler = (error: Error) => {
        console.error(`[ERROR] Caught error: ${error.message}`);
        console.warn(`[WARN] Applying fallback behavior`);
        console.info(`[INFO] Error handled gracefully`);
        return "fallback-result";
      };

      // Act
      const testError = new Error("Test error message");
      const result = errorHandler(testError);

      // Assert
      expect(result).toBe("fallback-result");

      if (DEBUG_MODE) {
        console.log("🐛 DEBUG: Error handling test completed");
      } else {
        expect(console.error).toHaveBeenCalledWith(
          "[ERROR] Caught error: Test error message",
        );
        expect(console.warn).toHaveBeenCalledWith(
          "[WARN] Applying fallback behavior",
        );
        expect(console.info).toHaveBeenCalledWith(
          "[INFO] Error handled gracefully",
        );
      }
    });
  });

  describe("debugging complex data structures", () => {
    test("should demonstrate debugging with complex objects", () => {
      if (DEBUG_MODE) {
        global.enableConsoleOutput();
        console.log("🐛 DEBUG: Testing complex data structures...");
      }

      const complexData = {
        user: { id: 123, name: "Test User" },
        settings: { theme: "dark", notifications: true },
        metadata: { timestamp: Date.now(), version: "1.0.0" },
      };

      // Simulate processing complex data with logging
      const processData = (data: typeof complexData) => {
        console.log("[PROCESS] Input data:", JSON.stringify(data, null, 2));
        console.log("[PROCESS] User ID:", data.user.id);
        console.log("[PROCESS] Settings:", data.settings);

        const processed = {
          ...data,
          processed: true,
          processedAt: new Date().toISOString(),
        };

        console.log(
          "[PROCESS] Output data:",
          JSON.stringify(processed, null, 2),
        );
        return processed;
      };

      // Act
      const result = processData(complexData);

      // Assert
      expect(result.processed).toBe(true);
      expect(result.user.id).toBe(123);
      expect(result.processedAt).toBeDefined();

      if (DEBUG_MODE) {
        console.log("🐛 DEBUG: Complex data processing test completed");
      } else {
        expect(console.log).toHaveBeenCalledWith("[PROCESS] User ID:", 123);
        expect(console.log).toHaveBeenCalledWith(
          "[PROCESS] Settings:",
          complexData.settings,
        );
      }
    });
  });

  describe("performance debugging", () => {
    test("should demonstrate debugging performance issues", () => {
      if (DEBUG_MODE) {
        global.enableConsoleOutput();
        console.log("🐛 DEBUG: Testing performance monitoring...");
      }

      // Simulate performance monitoring with logging
      const performanceTest = (iterations: number) => {
        const startTime = performance.now();
        console.time("[PERF] Operation duration");
        console.log(`[PERF] Starting ${iterations} iterations...`);

        let result = 0;
        for (let i = 0; i < iterations; i++) {
          result += Math.random();
          if (i % 100 === 0) {
            console.log(`[PERF] Progress: ${i}/${iterations}`);
          }
        }

        console.timeEnd("[PERF] Operation duration");
        const endTime = performance.now();
        const duration = endTime - startTime;

        console.log(
          `[PERF] Completed ${iterations} iterations in ${duration.toFixed(3)}ms`,
        );
        console.log(
          `[PERF] Average time per iteration: ${(duration / iterations).toFixed(6)}ms`,
        );

        return { result, duration, iterations };
      };

      // Act
      const perfResult = performanceTest(500);

      // Assert
      expect(perfResult.iterations).toBe(500);
      expect(perfResult.duration).toBeGreaterThan(0);
      expect(perfResult.result).toBeGreaterThan(0);

      if (DEBUG_MODE) {
        console.log("🐛 DEBUG: Performance test completed");
      } else {
        expect(console.log).toHaveBeenCalledWith(
          "[PERF] Starting 500 iterations...",
        );
        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining("[PERF] Completed 500 iterations"),
        );
      }
    });
  });

  describe("debugging instructions", () => {
    test("should provide clear debugging instructions", () => {
      // This test always shows instructions, regardless of debug mode
      const instructions = [
        "",
        "🐛 DEBUGGING INSTRUCTIONS:",
        "",
        "1. To see console output during tests:",
        "   DEBUG_CONSOLE_TESTS=true npm test consoleDebugging.test.ts",
        "",
        "2. To debug specific test:",
        '   DEBUG_CONSOLE_TESTS=true npm test -- --testNamePattern="debugging component"',
        "",
        "3. To debug in watch mode:",
        "   DEBUG_CONSOLE_TESTS=true npm test -- --watch consoleDebugging.test.ts",
        "",
        "4. Current debug mode:",
        DEBUG_MODE ? "ENABLED ✅" : "DISABLED ❌",
        "",
      ];

      if (DEBUG_MODE) {
        global.enableConsoleOutput();
        instructions.forEach((line) => console.log(line));
      }

      // Always pass this test
      expect(true).toBe(true);
    });
  });
});
