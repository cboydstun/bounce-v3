export interface ErrorLog {
  id: string;
  timestamp: Date;
  level: "error" | "warn" | "info" | "debug";
  category: string;
  message: string;
  error?: Error;
  stack?: string;
  context?: Record<string, any>;
  userAgent?: string;
  url?: string;
}

class ErrorLoggerService {
  private logs: ErrorLog[] = [];
  private maxLogs = 100;
  private listeners: Set<(log: ErrorLog) => void> = new Set();
  private isInitialized = false;
  private boundHandlers: {
    unhandledRejection?: (event: PromiseRejectionEvent) => void;
    globalError?: (event: ErrorEvent) => void;
    resourceError?: (event: ErrorEvent) => void;
  } = {};

  constructor() {
    // Only initialize once to prevent duplicate event listeners
    if (!this.isInitialized) {
      this.setupGlobalErrorHandlers();
      this.isInitialized = true;
    }
  }

  private setupGlobalErrorHandlers(): void {
    // Create bound handlers to allow proper cleanup
    this.boundHandlers.unhandledRejection = (event: PromiseRejectionEvent) => {
      this.logError(
        "unhandled-promise",
        "Unhandled Promise Rejection",
        event.reason,
        {
          promise: event.promise,
          type: "unhandledrejection",
        },
      );
    };

    this.boundHandlers.globalError = (event: ErrorEvent) => {
      this.logError("global-error", "Global Error", event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: "error",
      });
    };

    this.boundHandlers.resourceError = (event: ErrorEvent) => {
      if (event.target !== window) {
        const target = event.target as HTMLElement;
        this.logError("resource-error", "Resource Loading Error", null, {
          element: target?.tagName,
          source: (target as any)?.src || (target as any)?.href,
          type: "resource-error",
        });
      }
    };

    // Add event listeners with bound handlers
    window.addEventListener(
      "unhandledrejection",
      this.boundHandlers.unhandledRejection,
    );
    window.addEventListener("error", this.boundHandlers.globalError);
    window.addEventListener("error", this.boundHandlers.resourceError, true);
  }

  public cleanup(): void {
    // Remove event listeners to prevent memory leaks
    if (this.boundHandlers.unhandledRejection) {
      window.removeEventListener(
        "unhandledrejection",
        this.boundHandlers.unhandledRejection,
      );
    }
    if (this.boundHandlers.globalError) {
      window.removeEventListener("error", this.boundHandlers.globalError);
    }
    if (this.boundHandlers.resourceError) {
      window.removeEventListener(
        "error",
        this.boundHandlers.resourceError,
        true,
      );
    }

    this.listeners.clear();
    this.logs = [];
    this.isInitialized = false;
  }

  public logError(
    category: string,
    message: string,
    error?: Error | any,
    context?: Record<string, any>,
  ): void {
    const log: ErrorLog = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level: "error",
      category,
      message,
      error: error instanceof Error ? error : undefined,
      stack: error?.stack || new Error().stack,
      context: {
        ...context,
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
    };

    this.addLog(log);
    console.error(`[${category}] ${message}`, error, context);
  }

  public logWarn(
    category: string,
    message: string,
    context?: Record<string, any>,
  ): void {
    const log: ErrorLog = {
      id: `warn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level: "warn",
      category,
      message,
      context: {
        ...context,
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
    };

    this.addLog(log);
    console.warn(`[${category}] ${message}`, context);
  }

  public logInfo(
    category: string,
    message: string,
    context?: Record<string, any>,
  ): void {
    const log: ErrorLog = {
      id: `info_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level: "info",
      category,
      message,
      context: {
        ...context,
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
    };

    this.addLog(log);
    console.info(`[${category}] ${message}`, context);
  }

  public logDebug(
    category: string,
    message: string,
    context?: Record<string, any>,
  ): void {
    const log: ErrorLog = {
      id: `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level: "debug",
      category,
      message,
      context: {
        ...context,
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
    };

    this.addLog(log);
    console.debug(`[${category}] ${message}`, context);
  }

  private addLog(log: ErrorLog): void {
    this.logs.unshift(log);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Notify listeners
    this.listeners.forEach((listener) => {
      try {
        listener(log);
      } catch (error) {
        console.error("Error in log listener:", error);
      }
    });
  }

  public getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  public getLogsByCategory(category: string): ErrorLog[] {
    return this.logs.filter((log) => log.category === category);
  }

  public getLogsByLevel(level: ErrorLog["level"]): ErrorLog[] {
    return this.logs.filter((log) => log.level === level);
  }

  public clearLogs(): void {
    this.logs = [];
  }

  public onLog(listener: (log: ErrorLog) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  public getSystemInfo(): Record<string, any> {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      localStorage: (() => {
        try {
          return typeof localStorage !== "undefined";
        } catch {
          return false;
        }
      })(),
      sessionStorage: (() => {
        try {
          return typeof sessionStorage !== "undefined";
        } catch {
          return false;
        }
      })(),
      indexedDB: typeof indexedDB !== "undefined",
      serviceWorker: "serviceWorker" in navigator,
      pushManager: "PushManager" in window,
      notification: "Notification" in window,
    };
  }
}

// Create singleton instance
export const errorLogger = new ErrorLoggerService();

// Export for testing
export { ErrorLoggerService };
