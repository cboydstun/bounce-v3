import { renderHook, act } from "@testing-library/react";
import { usePayPalScript } from "../usePayPalScript";

// Mock the document methods
let mockScripts: HTMLScriptElement[] = [];

describe("usePayPalScript", () => {
  beforeEach(() => {
    // Reset the mocks
    mockScripts = [];

    // Mock document.querySelector
    document.querySelector = jest.fn().mockImplementation((selector) => {
      if (selector === 'script[src*="paypal.com/sdk/js"]') {
        return (
          mockScripts.find((script) =>
            script.src.includes("paypal.com/sdk/js"),
          ) || null
        );
      }
      return null;
    });

    // Mock document.createElement
    document.createElement = jest.fn().mockImplementation((tag) => {
      if (tag === "script") {
        const script = {
          id: "",
          src: "",
          async: false,
          dataset: {},
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        } as unknown as HTMLScriptElement;
        return script;
      }
      // For other tags, create a simple mock
      return { tagName: tag } as any;
    });

    // Mock document.body.appendChild
    document.body.appendChild = jest.fn().mockImplementation((element) => {
      if (element.tagName === "SCRIPT") {
        mockScripts.push(element as HTMLScriptElement);
        // Simulate script load event
        setTimeout(() => {
          const loadEvent = element.addEventListener.mock.calls.find(
            (call: [string, EventListener]) => call[0] === "load",
          );
          if (loadEvent && typeof loadEvent[1] === "function") {
            loadEvent[1]();
          }
        }, 0);
      }
      return element;
    });

    // Mock window.paypal
    window.paypal = {
      Buttons: jest.fn(),
      FUNDING: {
        PAYPAL: "paypal",
        CREDIT: "credit",
        CARD: "card",
      },
      version: "1.0.0", // Mock version property
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should load PayPal script if not already loaded", async () => {
    const { result } = renderHook(() => usePayPalScript());

    // Initially, script is not loaded
    expect(result.current.scriptLoaded).toBe(false);
    expect(result.current.paypal).toBe(null);

    // Wait for script to "load"
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // After loading, script should be loaded
    expect(result.current.scriptLoaded).toBe(true);
    expect(result.current.paypal).toBe(window.paypal);
    expect(document.body.appendChild).toHaveBeenCalled();
  });

  test("should reuse existing script if already loaded", async () => {
    // Simulate script already in DOM
    const existingScript = document.createElement("script");
    existingScript.src = "https://www.paypal.com/sdk/js?client-id=test";
    mockScripts.push(existingScript as HTMLScriptElement);

    const { result } = renderHook(() => usePayPalScript());

    // Script should be immediately loaded
    expect(result.current.scriptLoaded).toBe(true);
    expect(document.body.appendChild).not.toHaveBeenCalled();
  });

  test("should handle script loading error", async () => {
    // Override appendChild to simulate error
    document.body.appendChild = jest.fn().mockImplementation((element) => {
      if (element.tagName === "SCRIPT") {
        mockScripts.push(element as HTMLScriptElement);
        // Simulate script error event
        setTimeout(() => {
          const errorEvent = element.addEventListener.mock.calls.find(
            (call: [string, EventListener]) => call[0] === "error",
          );
          if (errorEvent && typeof errorEvent[1] === "function") {
            errorEvent[1](new Event("error"));
          }
        }, 0);
      }
      return element;
    });

    const mockOnError = jest.fn();
    const { result } = renderHook(() =>
      usePayPalScript({ onError: mockOnError }),
    );

    // Initially, script is not loaded
    expect(result.current.scriptLoaded).toBe(false);

    // Wait for script to "error"
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // After error, script should not be loaded
    expect(result.current.scriptLoaded).toBe(false);
    expect(result.current.scriptError).not.toBe(null);
    expect(mockOnError).toHaveBeenCalled();
  });
});
