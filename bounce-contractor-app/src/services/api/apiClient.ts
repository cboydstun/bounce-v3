import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { APP_CONFIG } from "../../config/app.config";
import {
  ApiResponse,
  ApiError,
  ApiRequestConfig,
  NetworkStatus,
} from "../../types/api.types";
import { AuthTokens } from "../../types/auth.types";

class ApiClient {
  private instance: AxiosInstance;
  private authTokens: AuthTokens | null = null;
  private refreshPromise: Promise<AuthTokens> | null = null;
  private networkStatus: NetworkStatus = {
    isOnline: true,
    connectionType: "unknown",
    isSlowConnection: false,
  };

  constructor() {
    this.instance = axios.create({
      baseURL: APP_CONFIG.API_BASE_URL,
      timeout: APP_CONFIG.API_TIMEOUT,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-App-Version": APP_CONFIG.APP_VERSION,
        "X-Platform": this.getPlatform(),
      },
    });

    this.setupInterceptors();
  }

  private getPlatform(): string {
    // This will be determined by Capacitor at runtime
    return "mobile";
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.instance.interceptors.request.use(
      async (config) => {
        // Add auth token if available
        if (this.authTokens?.accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${this.authTokens.accessToken}`;
        }

        // Add request ID for tracking
        if (config.headers) {
          config.headers["X-Request-ID"] = this.generateRequestId();
        }

        return config;
      },
      (error) => {
        console.error("❌ Request Interceptor Error:", error);
        return Promise.reject(this.handleError(error));
      },
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle token refresh for 401 errors
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newTokens = await this.refreshAccessToken();
            if (newTokens) {
              originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
              return this.instance(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.handleAuthFailure();
            return Promise.reject(this.handleError(refreshError));
          }
        }

        return Promise.reject(this.handleError(error));
      },
    );
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async refreshAccessToken(): Promise<AuthTokens | null> {
    if (!this.authTokens?.refreshToken) {
      throw new Error("No refresh token available");
    }

    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();

    try {
      const newTokens = await this.refreshPromise;
      this.setAuthTokens(newTokens);
      return newTokens;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<AuthTokens> {
    const response = await axios.post(
      `${APP_CONFIG.API_BASE_URL}/auth/contractor/refresh`,
      {
        refreshToken: this.authTokens?.refreshToken,
      },
      {
        timeout: APP_CONFIG.API_TIMEOUT,
      },
    );

    if (!response.data.success) {
      throw new Error("Token refresh failed");
    }

    return response.data.data;
  }

  private handleAuthFailure(): void {
    this.authTokens = null;
    // Emit event for auth failure - will be handled by auth store
    window.dispatchEvent(new CustomEvent("auth:failure"));
  }

  private handleError(error: any): ApiError {
    if (error.response) {
      console.log("📡 Server Response Details:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
        config: {
          url: error.response.config?.url,
          method: error.response.config?.method,
          params: error.response.config?.params,
        },
      });
    } else if (error.request) {
      console.log("🌐 Network Request Details:", {
        request: error.request,
        readyState: error.request.readyState,
        status: error.request.status,
        statusText: error.request.statusText,
        responseText: error.request.responseText,
        responseURL: error.request.responseURL,
      });
    } else {
      console.log("⚙️ Request Setup Error:", error.message);
    }

    const apiError: ApiError = {
      code: APP_CONFIG.ERROR_CODES.UNKNOWN_ERROR,
      message: "An unexpected error occurred",
      statusCode: 500,
    };

    if (error.response) {
      // Server responded with error status - PRESERVE the original status code
      const serverResponse = error.response.data;

      // Always use the actual HTTP status code from the response
      apiError.statusCode = error.response.status;

      // Handle different server response formats
      if (serverResponse?.error) {
        // Format: { success: false, error: { code: "...", message: "...", details: {...} } }
        apiError.code =
          serverResponse.error.code ||
          this.getErrorCodeFromStatus(error.response.status);
        apiError.message = serverResponse.error.message || error.message;
        apiError.details = serverResponse.error.details;
      } else if (serverResponse?.message) {
        // Format: { success: false, message: "...", code: "..." }
        apiError.code =
          serverResponse.code ||
          this.getErrorCodeFromStatus(error.response.status);
        apiError.message = serverResponse.message;
        apiError.details = serverResponse.details || serverResponse.errors;
      } else if (typeof serverResponse === "string") {
        // Plain text error response (like HTML error pages)
        apiError.message = `Request failed with status ${error.response.status}`;
        apiError.code = this.getErrorCodeFromStatus(error.response.status);
      } else if (serverResponse === null || serverResponse === undefined) {
        // Empty response body
        apiError.message = `Request failed with status ${error.response.status}`;
        apiError.code = this.getErrorCodeFromStatus(error.response.status);
      } else {
        // Fallback for other response formats - check for direct error field
        apiError.message =
          serverResponse.error ||
          error.message ||
          `Request failed with status ${error.response.status}`;
        apiError.code = this.getErrorCodeFromStatus(error.response.status);
      }
    } else if (error.request) {
      // Network error - no response received
      apiError.code = APP_CONFIG.ERROR_CODES.NETWORK_ERROR;
      apiError.message = "Network error. Please check your connection.";
      apiError.statusCode = 0;
    } else {
      // Request setup error
      apiError.message = error.message;
      apiError.statusCode = 0;
    }

    console.log("🔧 Processed API Error:", apiError);
    return apiError;
  }

  private getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case 400:
        return APP_CONFIG.ERROR_CODES.VALIDATION_ERROR;
      case 401:
      case 403:
        return APP_CONFIG.ERROR_CODES.AUTH_ERROR;
      case 404:
        return "NOT_FOUND";
      case 409:
        return "RESOURCE_CONFLICT";
      case 429:
        return "RATE_LIMIT_EXCEEDED";
      case 500:
      case 502:
      case 503:
      case 504:
        return APP_CONFIG.ERROR_CODES.SERVER_ERROR;
      default:
        return APP_CONFIG.ERROR_CODES.UNKNOWN_ERROR;
    }
  }

  // Public methods
  public setAuthTokens(tokens: AuthTokens | null): void {
    this.authTokens = tokens;
  }

  public getAuthTokens(): AuthTokens | null {
    return this.authTokens;
  }

  public setNetworkStatus(status: NetworkStatus): void {
    this.networkStatus = status;
  }

  public getNetworkStatus(): NetworkStatus {
    return this.networkStatus;
  }

  public async request<T = any>(
    config: ApiRequestConfig,
  ): Promise<ApiResponse<T>> {
    try {
      const axiosConfig: AxiosRequestConfig = {
        method: config.method,
        url: config.url,
        data: config.data,
        params: config.params,
        headers: config.headers,
        timeout: config.timeout || APP_CONFIG.API_TIMEOUT,
      };

      const response: AxiosResponse<ApiResponse<T>> =
        await this.instance.request(axiosConfig);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  public async get<T = any>(
    url: string,
    params?: Record<string, any>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: "GET",
      url,
      params,
    });
  }

  public async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: "POST",
      url,
      data,
    });
  }

  public async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: "PUT",
      url,
      data,
    });
  }

  public async patch<T = any>(
    url: string,
    data?: any,
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: "PATCH",
      url,
      data,
    });
  }

  public async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: "DELETE",
      url,
    });
  }

  // File upload with progress
  public async uploadFile<T = any>(
    url: string,
    file: File | Blob,
    onProgress?: (progress: number) => void,
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.instance.post(
        url,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total,
              );
              onProgress(progress);
            }
          },
        },
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Download file
  public async downloadFile(url: string, filename?: string): Promise<Blob> {
    try {
      const response: AxiosResponse<Blob> = await this.instance.get(url, {
        responseType: "blob",
      });

      // Create download link if filename provided
      if (filename) {
        const downloadUrl = window.URL.createObjectURL(response.data);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      }

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Health check
  public async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get("/health");
      return response.success;
    } catch (error) {
      return false;
    }
  }

  // Test API connectivity with detailed logging
  public async testConnectivity(): Promise<void> {
    console.group("🔍 API Connectivity Test");

    try {
      console.log("Testing basic connectivity to:", APP_CONFIG.API_BASE_URL);

      // Test 1: Basic health check
      console.log("Test 1: Health check...");
      const healthResponse = await this.get("/health");
      console.log("✅ Health check successful:", healthResponse);

      // Test 2: Test with authentication (if available)
      if (this.authTokens?.accessToken) {
        console.log("Test 2: Authenticated request...");
        const authTestResponse = await this.get("/tasks/my-tasks");
        console.log("✅ Authenticated request successful:", authTestResponse);
      } else {
        console.log("⚠️ No auth token available for authenticated test");
      }
    } catch (error) {
      console.error("❌ Connectivity test failed:", error);

      // Additional diagnostics
      console.log("🔧 Running additional diagnostics...");

      // Test direct fetch to see if it's an axios issue
      try {
        const directResponse = await fetch(`${APP_CONFIG.API_BASE_URL}/health`);
        console.log("Direct fetch response:", {
          status: directResponse.status,
          statusText: directResponse.statusText,
          headers: Object.fromEntries(directResponse.headers.entries()),
          url: directResponse.url,
        });

        const responseText = await directResponse.text();
        console.log("Direct fetch response body:", responseText);
      } catch (fetchError) {
        console.error("❌ Direct fetch also failed:", fetchError);
      }
    }

    console.groupEnd();
  }

  // Cancel all pending requests
  public cancelAllRequests(): void {
    // This would require implementing a request cancellation system
    // For now, we'll just clear the auth tokens
    this.authTokens = null;
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export class for testing
export { ApiClient };
