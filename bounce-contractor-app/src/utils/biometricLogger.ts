import { Capacitor } from "@capacitor/core";

export interface BiometricLogEntry {
  timestamp: string;
  level: "debug" | "info" | "warn" | "error";
  category: string;
  message: string;
  data?: any;
  deviceInfo?: any;
}

class BiometricLogger {
  private logs: BiometricLogEntry[] = [];
  private maxLogs = 1000;
  private isDebugMode = false;

  constructor() {
    // Enable debug mode in development
    this.isDebugMode = import.meta.env.MODE === "development";
  }

  /**
   * Enable or disable debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.isDebugMode = enabled;
    this.info(
      "BiometricLogger",
      `Debug mode ${enabled ? "enabled" : "disabled"}`,
    );
  }

  /**
   * Log debug message
   */
  debug(category: string, message: string, data?: any): void {
    if (this.isDebugMode) {
      this.addLog("debug", category, message, data);
      console.debug(`[Biometric:${category}] ${message}`, data || "");
    }
  }

  /**
   * Log info message
   */
  info(category: string, message: string, data?: any): void {
    this.addLog("info", category, message, data);
    console.info(`[Biometric:${category}] ${message}`, data || "");
  }

  /**
   * Log warning message
   */
  warn(category: string, message: string, data?: any): void {
    this.addLog("warn", category, message, data);
    console.warn(`[Biometric:${category}] ${message}`, data || "");
  }

  /**
   * Log error message
   */
  error(category: string, message: string, data?: any): void {
    this.addLog("error", category, message, data);
    console.error(`[Biometric:${category}] ${message}`, data || "");
  }

  /**
   * Log biometric operation start
   */
  async logOperationStart(operation: string, params?: any): Promise<void> {
    const deviceInfo = await this.getDeviceInfo();
    this.info("Operation", `Starting: ${operation}`, {
      operation,
      params,
      deviceInfo,
      platform: Capacitor.getPlatform(),
      isNative: Capacitor.isNativePlatform(),
    });
  }

  /**
   * Log biometric operation result
   */
  logOperationResult(
    operation: string,
    success: boolean,
    result?: any,
    error?: any,
  ): void {
    const level = success ? "info" : "error";
    const message = `${operation} ${success ? "succeeded" : "failed"}`;

    this[level]("Operation", message, {
      operation,
      success,
      result,
      error,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log native plugin call
   */
  logNativeCall(method: string, params?: any): void {
    this.debug("NativeCall", `Calling ${method}`, {
      method,
      params,
      platform: Capacitor.getPlatform(),
      isNative: Capacitor.isNativePlatform(),
    });
  }

  /**
   * Log native plugin response
   */
  logNativeResponse(method: string, response?: any, error?: any): void {
    if (error) {
      this.error("NativeResponse", `${method} failed`, {
        method,
        error: {
          message: error.message,
          code: error.code,
          stack: error.stack,
        },
      });
    } else {
      this.debug("NativeResponse", `${method} succeeded`, {
        method,
        response,
      });
    }
  }

  /**
   * Get all logs
   */
  getLogs(): BiometricLogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: BiometricLogEntry["level"]): BiometricLogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Get logs by category
   */
  getLogsByCategory(category: string): BiometricLogEntry[] {
    return this.logs.filter((log) => log.category === category);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    this.info("Logger", "Logs cleared");
  }

  /**
   * Export logs as JSON string
   */
  exportLogs(): string {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        totalLogs: this.logs.length,
        logs: this.logs,
      },
      null,
      2,
    );
  }

  /**
   * Get device information for debugging
   */
  private async getDeviceInfo(): Promise<any> {
    try {
      return {
        platform: Capacitor.getPlatform(),
        isNative: Capacitor.isNativePlatform(),
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.warn("DeviceInfo", "Failed to get device info", error);
      return {
        platform: "unknown",
        isNative: false,
        error: error?.toString(),
      };
    }
  }

  /**
   * Add log entry
   */
  private addLog(
    level: BiometricLogEntry["level"],
    category: string,
    message: string,
    data?: any,
  ): void {
    const entry: BiometricLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
    };

    this.logs.push(entry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }
}

// Export singleton instance
export const biometricLogger = new BiometricLogger();

// Export utility functions
export const logBiometricOperation = async (
  operation: string,
  fn: () => Promise<any>,
) => {
  await biometricLogger.logOperationStart(operation);

  try {
    const result = await fn();
    biometricLogger.logOperationResult(operation, true, result);
    return result;
  } catch (error) {
    biometricLogger.logOperationResult(operation, false, undefined, error);
    throw error;
  }
};
