import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  AuthState,
  User,
  ContractorProfile,
  AuthTokens,
  LoginCredentials,
  RegisterData,
} from "../types/auth.types";
import { ApiError } from "../types/api.types";
import { APP_CONFIG } from "../config/app.config";
import { apiClient } from "../services/api/apiClient";

interface AuthActions {
  // Authentication actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;

  // Profile actions
  updateProfile: (profile: Partial<ContractorProfile>) => Promise<void>;
  loadProfile: () => Promise<void>;

  // Token management
  setTokens: (tokens: AuthTokens | null) => void;
  clearAuth: () => void;

  // Biometric authentication
  enableBiometric: () => Promise<void>;
  disableBiometric: () => void;
  authenticateWithBiometric: () => Promise<void>;

  // Session management
  checkAuthStatus: () => Promise<boolean>;
  extendSession: () => void;

  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;

  // Loading states
  setLoading: (loading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      user: null,
      profile: null,
      tokens: null,
      isLoading: false,
      error: null,
      biometricEnabled: false,
      sessionExpiry: null,

      // Authentication actions
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });

        try {
          console.log("🔐 Attempting login with:", {
            email: credentials.email,
          });

          const response = await apiClient.post(
            "/auth/contractor/login",
            credentials,
          );

          console.log("📡 Login API Response:", response);
          console.log("✅ Response success:", response.success);
          console.log("📦 Response data:", response.data);

          // Check if response has the data directly or wrapped in data field
          const responseData = response.data || response;

          console.log("🔍 Parsed response data:", responseData);
          console.log("🎫 Has accessToken:", !!responseData.accessToken);
          console.log("👤 Has contractor:", !!responseData.contractor);

          if (responseData.accessToken && responseData.contractor) {
            console.log("✅ Login successful! Setting auth state...");
            const { contractor, accessToken, refreshToken } = responseData;

            // Create tokens object
            const tokens: AuthTokens = {
              accessToken,
              refreshToken,
              expiresAt: new Date(
                Date.now() + APP_CONFIG.JWT_ACCESS_TOKEN_EXPIRY,
              ).toISOString(),
              tokenType: "Bearer",
            };

            // Set tokens in API client
            apiClient.setAuthTokens(tokens);

            // Calculate session expiry
            const sessionExpiry = new Date(
              Date.now() + APP_CONFIG.JWT_ACCESS_TOKEN_EXPIRY,
            ).toISOString();

            set({
              isAuthenticated: true,
              user: contractor,
              profile: contractor, // Use contractor data as profile initially
              tokens,
              sessionExpiry,
              isLoading: false,
              error: null,
            });

            // Load full profile data (optional, don't fail login if this fails)
            try {
              await get().loadProfile();
            } catch (profileError) {
              console.warn("Failed to load profile after login:", profileError);
              // Don't fail the login process if profile loading fails
            }
          } else {
            console.error("❌ Invalid response format:", response);
            throw new Error("Invalid login response format");
          }
        } catch (error) {
          console.error("❌ Login error caught:", error);
          console.error("🔍 Error details:", {
            message: (error as any)?.message,
            stack: (error as any)?.stack,
            name: (error as any)?.name,
          });

          const apiError = error as ApiError;
          const errorMessage = apiError.message || "Login failed";

          console.error("💥 Setting error state:", errorMessage);

          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
            user: null,
            profile: null,
            tokens: null,
          });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.post(
            "/auth/contractor/register",
            data,
          );

          if (response.success) {
            set({ isLoading: false, error: null });
            // Registration successful, user needs to verify email
          } else {
            throw new Error(response.message || "Registration failed");
          }
        } catch (error) {
          const apiError = error as ApiError;
          set({
            isLoading: false,
            error: apiError.message,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });

        try {
          const { tokens } = get();
          if (tokens?.refreshToken) {
            // Notify server about logout
            await apiClient.post("/auth/contractor/logout", {
              refreshToken: tokens.refreshToken,
            });
          }
        } catch (error) {
          // Ignore logout errors, proceed with local cleanup
          console.warn("Logout request failed:", error);
        } finally {
          // Clear all auth data
          get().clearAuth();
          set({ isLoading: false });
        }
      },

      refreshToken: async () => {
        const { tokens } = get();

        if (!tokens?.refreshToken) {
          throw new Error("No refresh token available");
        }

        try {
          const response = await apiClient.post("/auth/contractor/refresh", {
            refreshToken: tokens.refreshToken,
          });

          if (response.success && response.data) {
            const newTokens = response.data;
            apiClient.setAuthTokens(newTokens);

            const sessionExpiry = new Date(
              Date.now() + APP_CONFIG.JWT_ACCESS_TOKEN_EXPIRY,
            ).toISOString();

            set({
              tokens: newTokens,
              sessionExpiry,
            });
          } else {
            throw new Error("Token refresh failed");
          }
        } catch (error) {
          // Refresh failed, logout user
          get().clearAuth();
          throw error;
        }
      },

      // Profile actions
      updateProfile: async (profileData: Partial<ContractorProfile>) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.put(
            "/contractors/me",
            profileData,
          );

          if (response.success && response.data) {
            set({
              profile: response.data,
              isLoading: false,
            });
          } else {
            throw new Error(response.message || "Profile update failed");
          }
        } catch (error) {
          const apiError = error as ApiError;
          set({
            isLoading: false,
            error: apiError.message,
          });
          throw error;
        }
      },

      loadProfile: async () => {
        try {
          const response = await apiClient.get("/contractors/me");

          if (response.success && response.data) {
            set({ profile: response.data });
          }
        } catch (error) {
          console.warn("Failed to load profile:", error);
        }
      },

      // Token management
      setTokens: (tokens: AuthTokens | null) => {
        apiClient.setAuthTokens(tokens);

        if (tokens) {
          const sessionExpiry = new Date(
            Date.now() + APP_CONFIG.JWT_ACCESS_TOKEN_EXPIRY,
          ).toISOString();
          set({ tokens, sessionExpiry });
        } else {
          set({ tokens: null, sessionExpiry: null });
        }
      },

      clearAuth: () => {
        apiClient.setAuthTokens(null);
        set({
          isAuthenticated: false,
          user: null,
          profile: null,
          tokens: null,
          sessionExpiry: null,
          error: null,
        });
      },

      // Biometric authentication
      enableBiometric: async () => {
        try {
          // This will be implemented with Capacitor biometric plugin
          set({ biometricEnabled: true });
        } catch (error) {
          throw new Error("Failed to enable biometric authentication");
        }
      },

      disableBiometric: () => {
        set({ biometricEnabled: false });
      },

      authenticateWithBiometric: async () => {
        try {
          // This will be implemented with Capacitor biometric plugin
          const { tokens } = get();
          if (tokens) {
            // Verify biometric and refresh session
            await get().refreshToken();
          }
        } catch (error) {
          throw new Error("Biometric authentication failed");
        }
      },

      // Session management
      checkAuthStatus: async (): Promise<boolean> => {
        const { tokens, sessionExpiry } = get();

        if (!tokens) {
          return false;
        }

        // Check if session is expired
        if (sessionExpiry && new Date(sessionExpiry) <= new Date()) {
          try {
            await get().refreshToken();
            return true;
          } catch (error) {
            get().clearAuth();
            return false;
          }
        }

        // Verify token with server
        try {
          const response = await apiClient.get("/auth/contractor/verify");
          if (response.success) {
            set({ isAuthenticated: true });
            return true;
          } else {
            get().clearAuth();
            return false;
          }
        } catch (error) {
          get().clearAuth();
          return false;
        }
      },

      extendSession: () => {
        const sessionExpiry = new Date(
          Date.now() + APP_CONFIG.JWT_ACCESS_TOKEN_EXPIRY,
        ).toISOString();
        set({ sessionExpiry });
      },

      // Error handling
      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      // Loading states
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        profile: state.profile,
        tokens: state.tokens,
        biometricEnabled: state.biometricEnabled,
        sessionExpiry: state.sessionExpiry,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.tokens) {
          // Restore tokens in API client
          apiClient.setAuthTokens(state.tokens);

          // Check if session is still valid
          state.checkAuthStatus();
        }
      },
    },
  ),
);

// Auth event listeners
if (typeof window !== "undefined") {
  // Listen for auth failure events from API client
  window.addEventListener("auth:failure", () => {
    useAuthStore.getState().clearAuth();
  });

  // Auto-refresh token before expiry
  setInterval(() => {
    const { tokens, sessionExpiry, isAuthenticated } = useAuthStore.getState();

    if (isAuthenticated && tokens && sessionExpiry) {
      const expiryTime = new Date(sessionExpiry).getTime();
      const currentTime = Date.now();
      const timeUntilExpiry = expiryTime - currentTime;

      // Refresh token 5 minutes before expiry
      if (timeUntilExpiry <= 5 * 60 * 1000 && timeUntilExpiry > 0) {
        useAuthStore
          .getState()
          .refreshToken()
          .catch(() => {
            // Refresh failed, will be handled by the refresh method
          });
      }
    }
  }, 60000); // Check every minute
}

// Export selectors for easier access
export const authSelectors = {
  isAuthenticated: (state: AuthStore) => state.isAuthenticated,
  user: (state: AuthStore) => state.user,
  profile: (state: AuthStore) => state.profile,
  tokens: (state: AuthStore) => state.tokens,
  isLoading: (state: AuthStore) => state.isLoading,
  error: (state: AuthStore) => state.error,
  biometricEnabled: (state: AuthStore) => state.biometricEnabled,
};
