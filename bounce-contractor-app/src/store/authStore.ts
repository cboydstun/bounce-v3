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
import { biometricService } from "../services/auth/biometricService";

interface AuthActions {
  // Authentication actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;

  // Profile actions
  updateProfile: (profile: Partial<ContractorProfile>) => Promise<void>;
  updateProfilePhoto: (photoUrl: string) => Promise<void>;
  loadProfile: () => Promise<void>;

  // Token management
  setTokens: (tokens: AuthTokens | null) => void;
  clearAuth: () => void;

  // Biometric authentication
  enableBiometric: (credentials?: {
    email: string;
    password: string;
  }) => Promise<void>;
  disableBiometric: () => Promise<void>;
  authenticateWithBiometric: () => Promise<void>;
  loginWithBiometric: () => Promise<void>;

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
      updateProfile: async (profileData: any) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.put("/contractors/me", profileData);

          if (response.success && response.data) {
            const updatedProfile = response.data;

            // If the API response includes a name field, split it back into firstName/lastName for the user object
            let updatedUser = get().user;
            if (updatedProfile.name && updatedUser) {
              const nameParts = updatedProfile.name.split(" ");
              const firstName = nameParts[0] || "";
              const lastName = nameParts.slice(1).join(" ") || "";

              updatedUser = {
                ...updatedUser,
                firstName,
                lastName,
                email: updatedProfile.email || updatedUser.email,
                phone: updatedProfile.phone || updatedUser.phone,
              };
            }

            set({
              profile: updatedProfile,
              user: updatedUser,
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

      updateProfilePhoto: async (photoUrl: string) => {
        const { user, profile } = get();

        // Optimistically update the UI
        if (user) {
          set({
            user: { ...user, profileImage: photoUrl },
            profile: profile ? { ...profile } : null,
          });
        }

        try {
          // The photo upload is handled by the photoService
          // This method just updates the local state
          // The actual API call is made in the photoService.uploadProfilePhoto
        } catch (error) {
          console.error("Failed to update profile photo:", error);
          // Revert optimistic update on error
          if (user) {
            set({
              user: { ...user, profileImage: user.profileImage },
            });
          }
          throw error;
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
      enableBiometric: async (credentials?: {
        email: string;
        password: string;
      }) => {
        try {
          const { user } = get();

          if (!user) {
            throw new Error(
              "User must be logged in to enable biometric authentication",
            );
          }

          // Use provided credentials or current user data
          const biometricCredentials = {
            username: credentials?.email || user.email,
            password: credentials?.password || "", // Password should be provided for security
            accessToken: get().tokens?.accessToken,
            refreshToken: get().tokens?.refreshToken,
            expiresAt: get().tokens?.expiresAt,
          };

          const result =
            await biometricService.setupBiometric(biometricCredentials);

          if (result.success) {
            set({ biometricEnabled: true });
          } else {
            throw new Error(
              result.error || "Failed to enable biometric authentication",
            );
          }
        } catch (error) {
          console.error("Enable biometric error:", error);
          throw error;
        }
      },

      disableBiometric: async () => {
        try {
          await biometricService.disableBiometric();
          set({ biometricEnabled: false });
        } catch (error) {
          console.error("Disable biometric error:", error);
          throw new Error("Failed to disable biometric authentication");
        }
      },

      authenticateWithBiometric: async () => {
        try {
          const result = await biometricService.authenticateAndGetCredentials({
            reason: "Authenticate to access your account",
            title: "Biometric Login",
            subtitle: "Use your biometric to sign in",
          });

          if (result.success && result.credentials) {
            // Update tokens if available
            if (result.credentials.accessToken) {
              const tokens = {
                accessToken: result.credentials.accessToken,
                refreshToken: result.credentials.refreshToken || "",
                expiresAt:
                  result.credentials.expiresAt ||
                  new Date(
                    Date.now() + APP_CONFIG.JWT_ACCESS_TOKEN_EXPIRY,
                  ).toISOString(),
                tokenType: "Bearer" as const,
              };

              apiClient.setAuthTokens(tokens);
              set({ tokens });
            }

            // Refresh session
            await get().refreshToken();
          } else {
            throw new Error(result.error || "Biometric authentication failed");
          }
        } catch (error) {
          console.error("Biometric authentication error:", error);
          throw error;
        }
      },

      loginWithBiometric: async () => {
        set({ isLoading: true, error: null });

        try {
          const result = await biometricService.authenticateAndGetCredentials({
            reason: "Sign in to your account",
            title: "Biometric Login",
            subtitle: "Use your biometric to sign in quickly",
          });

          if (result.success && result.credentials) {
            // Perform login with stored credentials
            await get().login({
              email: result.credentials.username,
              password: result.credentials.password,
              rememberMe: true,
            });
          } else {
            throw new Error(result.error || "Biometric login failed");
          }
        } catch (error) {
          console.error("Biometric login error:", error);
          const errorMessage =
            (error as any)?.message || "Biometric login failed";
          set({ error: errorMessage, isLoading: false });
          throw error;
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

  // Auto-refresh token before expiry - much less aggressive interval
  let tokenRefreshInterval: NodeJS.Timeout | null = null;
  let lastRefreshCheck = 0;

  const startTokenRefreshInterval = () => {
    if (tokenRefreshInterval) {
      clearInterval(tokenRefreshInterval);
    }

    tokenRefreshInterval = setInterval(
      () => {
        const now = Date.now();

        // Prevent too frequent checks (minimum 10 minutes between checks)
        if (now - lastRefreshCheck < 10 * 60 * 1000) {
          return;
        }

        lastRefreshCheck = now;
        const { tokens, sessionExpiry, isAuthenticated } =
          useAuthStore.getState();

        if (isAuthenticated && tokens && sessionExpiry) {
          const expiryTime = new Date(sessionExpiry).getTime();
          const currentTime = Date.now();
          const timeUntilExpiry = expiryTime - currentTime;

          // Refresh token 10 minutes before expiry (increased from 5 minutes)
          if (timeUntilExpiry <= 10 * 60 * 1000 && timeUntilExpiry > 0) {
            console.log(
              `🔄 [AuthStore] Auto-refreshing token, expires in ${Math.round(timeUntilExpiry / 1000)}s`,
            );
            useAuthStore
              .getState()
              .refreshToken()
              .catch((error) => {
                console.warn(`🔄 [AuthStore] Token refresh failed:`, error);
                // Refresh failed, will be handled by the refresh method
              });
          }
        } else if (!isAuthenticated) {
          // Stop the interval if user is not authenticated
          if (tokenRefreshInterval) {
            clearInterval(tokenRefreshInterval);
            tokenRefreshInterval = null;
          }
        }
      },
      10 * 60 * 1000,
    ); // Check every 10 minutes instead of 5 minutes
  };

  // Start the interval
  startTokenRefreshInterval();
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
