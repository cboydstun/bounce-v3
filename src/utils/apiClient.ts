/**
 * Enhanced API client with retry logic and proper error handling
 */

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  timeoutMs?: number;
}

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
  status?: number;
}

/**
 * Sleep utility for delays
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay
 */
const calculateDelay = (
  attempt: number,
  baseDelay: number,
  maxDelay: number,
): number => {
  const delay = baseDelay * Math.pow(2, attempt - 1);
  return Math.min(delay, maxDelay);
};

/**
 * Enhanced fetch with retry logic and timeout handling
 */
export async function fetchWithRetry<T = any>(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {},
): Promise<ApiResponse<T>> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    timeoutMs = 30000,
  } = retryOptions;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle different response types
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        // Try to parse error response
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            console.warn("Failed to parse error response as JSON:", parseError);
          }
        } else {
          // Handle HTML error responses (like 504 Gateway Timeout)
          try {
            const textResponse = await response.text();
            console.warn(
              "Non-JSON error response:",
              textResponse.substring(0, 200),
            );

            if (response.status === 504) {
              errorMessage =
                "Server timeout. Your request may still be processing.";
            } else if (response.status >= 500) {
              errorMessage = "Server error occurred. Please try again.";
            }
          } catch (textError) {
            console.warn("Failed to read error response as text:", textError);
          }
        }

        // For 5xx errors, retry; for 4xx errors, don't retry
        if (response.status >= 500 && attempt < maxRetries) {
          lastError = new Error(errorMessage);
          console.warn(
            `Attempt ${attempt} failed with ${response.status}, retrying...`,
          );

          const delay = calculateDelay(attempt, baseDelay, maxDelay);
          await sleep(delay);
          continue;
        }

        return {
          success: false,
          error: errorMessage,
          status: response.status,
        };
      }

      // Success - parse response
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        return {
          success: true,
          data,
          status: response.status,
        };
      } else {
        return {
          success: false,
          error: "Server returned non-JSON response",
          status: response.status,
        };
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");

      // Handle different types of errors
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          console.warn(`Attempt ${attempt} timed out after ${timeoutMs}ms`);
          lastError = new Error(
            "Request timed out. Your request may still be processing.",
          );
        } else if (error.message.includes("fetch")) {
          console.warn(
            `Attempt ${attempt} failed with network error:`,
            error.message,
          );
          lastError = new Error("Network error. Please check your connection.");
        }
      }

      // Retry on network errors and timeouts
      if (attempt < maxRetries) {
        console.warn(
          `Attempt ${attempt} failed, retrying...`,
          lastError.message,
        );

        const delay = calculateDelay(attempt, baseDelay, maxDelay);
        await sleep(delay);
        continue;
      }
    }
  }

  // All retries exhausted
  return {
    success: false,
    error: lastError?.message || "Request failed after multiple attempts",
  };
}

/**
 * Convenience method for POST requests with retry
 */
export async function postWithRetry<T = any>(
  url: string,
  data: any,
  retryOptions?: RetryOptions,
): Promise<ApiResponse<T>> {
  return fetchWithRetry<T>(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
    retryOptions,
  );
}

/**
 * Convenience method for GET requests with retry
 */
export async function getWithRetry<T = any>(
  url: string,
  retryOptions?: RetryOptions,
): Promise<ApiResponse<T>> {
  return fetchWithRetry<T>(
    url,
    {
      method: "GET",
    },
    retryOptions,
  );
}
