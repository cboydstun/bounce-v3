import { renderHook, act } from "@testing-library/react";
import { usePayPalScript } from "../usePayPalScript";
import React from "react";

// Mock the document methods
let mockScripts: HTMLScriptElement[] = [];

// Create a proper wrapper for React 19
function Wrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

describe("usePayPalScript", () => {
  beforeEach(() => {
    // Reset the mocks
    mockScripts = [];

    // Mock document.querySelector
    document.querySelector = jest.fn().mockImplementation((selector) => {
      if (selector === 'script[data-namespace="paypalSDK"]') {
        return (
          mockScripts.find(
            (script) => script.getAttribute?.("data-namespace") === "paypalSDK",
          ) || null
        );
      }
      return null;
    });

    // Mock document.createElement with a proper Node
    const originalCreateElement = document.createElement;
    document.createElement = jest.fn().mockImplementation((tag) => {
      if (tag === "script") {
        // Create a real script element that JSDOM can handle
        const script = originalCreateElement.call(
          document,
          "script",
        ) as HTMLScriptElement;
        // Add our mock properties and methods
        script.id = "";
        script.src = "";
        script.async = false;
        script.defer = false;

        // Store original methods
        const originalSetAttribute = script.setAttribute.bind(script);
        const originalAddEventListener = script.addEventListener.bind(script);

        // Mock methods
        script.setAttribute = jest.fn().mockImplementation((name, value) => {
          originalSetAttribute(name, value);
        });

        script.addEventListener = jest
          .fn()
          .mockImplementation((event, handler) => {
            originalAddEventListener(event, handler);
          });

        return script;
      }
      // For other tags, use the original implementation
      return originalCreateElement.call(document, tag);
    });

    // Mock document.head.appendChild with proper handling
    const originalHeadAppendChild = document.head.appendChild;
    document.head.appendChild = jest.fn().mockImplementation((element) => {
      if (element.tagName === "SCRIPT") {
        mockScripts.push(element as HTMLScriptElement);

        // Simulate script load event after a short delay
        setTimeout(() => {
          // Directly call the event handler instead of finding it in mock calls
          const event = new Event("load");
          element.dispatchEvent(event);
        }, 10);

        // Return the element to satisfy appendChild's contract
        return element;
      }
      // Use original for non-script elements
      return originalHeadAppendChild.call(document.head, element);
    });

    // Remove window.paypal if it exists
    delete window.paypal;

    // Set up environment variables
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID = "test-client-id";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should load PayPal script if not already loaded", async () => {
    // Ensure PayPal is not already loaded
    delete window.paypal;

    // Create a custom implementation for this test
    const originalHeadAppendChild = document.head.appendChild;
    document.head.appendChild = jest.fn().mockImplementation((element) => {
      if (element.tagName === "SCRIPT") {
        mockScripts.push(element as HTMLScriptElement);

        // Simulate script load event after a short delay
        setTimeout(() => {
          // Set window.paypal before dispatching the load event
          window.paypal = {
            Buttons: jest.fn(),
            FUNDING: {
              PAYPAL: "paypal",
              CREDIT: "credit",
              CARD: "card",
            },
            version: "1.0.0",
          };

          // Dispatch the load event
          const event = new Event("load");
          element.dispatchEvent(event);

          // Manually trigger the useEffect that checks for window.paypal
          // This simulates what happens when the interval in the hook runs
          jest.advanceTimersByTime(100);
        }, 5);

        return element;
      }
      return originalHeadAppendChild.call(document.head, element);
    });

    // Mock timers
    jest.useFakeTimers();

    // Render the hook
    const { result, rerender } = renderHook(() => usePayPalScript(), {
      wrapper: Wrapper,
    });

    // Initially, script is not loaded
    expect(result.current.scriptLoaded).toBe(false);
    expect(result.current.paypal).toBe(null);

    // Run all pending timers
    await act(async () => {
      jest.runAllTimers();
    });

    // Force a re-render to ensure the hook state is updated
    rerender();

    // After loading, script should be loaded
    expect(result.current.scriptLoaded).toBe(true);
    expect(result.current.paypal).toBe(window.paypal);
    expect(document.head.appendChild).toHaveBeenCalled();

    // Restore real timers
    jest.useRealTimers();
  });

  test("should reuse existing script if already loaded", async () => {
    // Set up window.paypal to simulate it's already loaded
    window.paypal = {
      Buttons: jest.fn(),
      FUNDING: {
        PAYPAL: "paypal",
        CREDIT: "credit",
        CARD: "card",
      },
      version: "1.0.0",
    };

    // Simulate script already in DOM
    const existingScript = document.createElement("script");
    existingScript.src = "https://www.paypal.com/sdk/js?client-id=test";
    existingScript.setAttribute("data-namespace", "paypalSDK");
    mockScripts.push(existingScript as HTMLScriptElement);

    const { result } = renderHook(() => usePayPalScript(), {
      wrapper: Wrapper,
    });

    // Script should be immediately loaded since window.paypal exists
    expect(result.current.scriptLoaded).toBe(true);
    expect(document.head.appendChild).not.toHaveBeenCalled();
  });

  test("should handle script loading error", async () => {
    // Ensure PayPal is not already loaded
    delete window.paypal;

    // Override appendChild to simulate error
    document.head.appendChild = jest.fn().mockImplementation((element) => {
      if (element.tagName === "SCRIPT") {
        mockScripts.push(element as HTMLScriptElement);
        // Simulate script error event
        setTimeout(() => {
          // Dispatch an error event
          const errorEvent = new Event("error");
          element.dispatchEvent(errorEvent);
        }, 5);
      }
      return element;
    });

    const mockOnError = jest.fn();
    const { result } = renderHook(
      () => usePayPalScript({ onError: mockOnError }),
      { wrapper: Wrapper },
    );

    // Initially, script is not loaded
    expect(result.current.scriptLoaded).toBe(false);

    // Wait for script to "error"
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    // After error, script should not be loaded
    expect(result.current.scriptLoaded).toBe(false);
    expect(result.current.scriptError).not.toBe(null);
    expect(mockOnError).toHaveBeenCalled();
  });
});
