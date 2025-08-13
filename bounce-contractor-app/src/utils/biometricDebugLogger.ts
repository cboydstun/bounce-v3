import {
  BiometricCredentials,
  BiometricSettings,
} from "../types/biometric.types";

export interface BiometricDebugLog {
  timestamp: string;
  operation: string;
  step: string;
  success: boolean;
  data?: any;
  error?: any;
}

class BiometricDebugLogger {
  private logs: BiometricDebugLog[] = [];
  private maxLogs = 100;

  log(
    operation: string,
    step: string,
    success: boolean,
    data?: any,
    error?: any,
  ) {
    const logEntry: BiometricDebugLog = {
      timestamp: new Date().toISOString(),
      operation,
      step,
      success,
      data: this.sanitizeData(data),
      error: error
        ? {
            message: error.message,
            code: error.code,
            name: error.name,
            stack: error.stack,
          }
        : undefined,
    };

    this.logs.push(logEntry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console log for immediate debugging
    const logLevel = success ? "info" : "error";
    console[logLevel](`[BiometricDebug] ${operation}:${step}`, {
      success,
      data: this.sanitizeData(data),
      error,
    });
  }

  private sanitizeData(data: any): any {
    if (!data) return data;

    // Remove sensitive information from logs
    if (typeof data === "object") {
      const sanitized = { ...data };

      // Remove password and token fields
      if (sanitized.password) sanitized.password = "[REDACTED]";
      if (sanitized.accessToken) sanitized.accessToken = "[REDACTED]";
      if (sanitized.refreshToken) sanitized.refreshToken = "[REDACTED]";

      // For credentials, show structure but not values
      if (sanitized.username) {
        sanitized.username = sanitized.username.substring(0, 3) + "***";
      }

      return sanitized;
    }

    return data;
  }

  getLogs(): BiometricDebugLog[] {
    return [...this.logs];
  }

  getLogsForOperation(operation: string): BiometricDebugLog[] {
    return this.logs.filter((log) => log.operation === operation);
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Helper method to validate credentials structure
  validateCredentials(credentials: any): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!credentials) {
      issues.push("Credentials object is null/undefined");
      return { valid: false, issues };
    }

    if (typeof credentials !== "object") {
      issues.push("Credentials is not an object");
      return { valid: false, issues };
    }

    if (!credentials.username || typeof credentials.username !== "string") {
      issues.push("Missing or invalid username");
    }

    if (!credentials.password || typeof credentials.password !== "string") {
      issues.push("Missing or invalid password");
    }

    if (credentials.username && credentials.username.length < 3) {
      issues.push("Username too short");
    }

    if (credentials.password && credentials.password.length < 6) {
      issues.push("Password too short");
    }

    return { valid: issues.length === 0, issues };
  }

  // Helper method to validate settings structure
  validateSettings(settings: any): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!settings) {
      issues.push("Settings object is null/undefined");
      return { valid: false, issues };
    }

    if (typeof settings !== "object") {
      issues.push("Settings is not an object");
      return { valid: false, issues };
    }

    if (typeof settings.enabled !== "boolean") {
      issues.push("Missing or invalid enabled flag");
    }

    return { valid: issues.length === 0, issues };
  }
}

export const biometricDebugLogger = new BiometricDebugLogger();
