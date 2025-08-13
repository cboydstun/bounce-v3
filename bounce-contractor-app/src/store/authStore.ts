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
  login: (
    credentials: LoginCredentials & { _isBiometricLogin?: boolean },
  ) => Promise<void>;
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
  enableBiometric: (credentials: {
    email: string;
    password: string;
  }) => Promise<void>;
  disableBiometric: () => Promise<void>;
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
      login: async (
        credentials: LoginCredentials & { _isBiometricLogin?: boolean },
      ) => {
        set({ isLoading: true, error: null });

        try {
          const isBiometricLogin = credentials._isBiometricLogin || false;
          console.log("🔐 Attempting login:", {
            email: credentials.email,
            isBiometricLogin,
          });

          // Remove internal flag before API call
          const { _isBiometricLogin, ...apiCredentials } = credentials;

          const response = await apiClient.post(
            "/auth/contractor/login",
            apiCredentials,
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

          // Enhanced error handling for biometric context
          if (
            credentials._isBiometricLogin &&
            (error as any)?.message?.includes("No refresh token")
          ) {
            console.warn(
              "🔄 Ignoring refresh token error during biometric login",
            );
            // Don't set error state for this specific case - let the retry logic handle it
            set({ isLoading: false });
            throw new Error(
              "Authentication temporarily unavailable. Please try again.",
            );
          }

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
        const { tokens, isLoading } = get();

        // Don't attempt refresh if we're in the middle of a login process
        if (isLoading) {
          console.log(
            "🔄 [AuthStore] Skipping token refresh during login process",
          );
          return;
        }

        if (!tokens?.refreshToken) {
          console.warn("🔄 [AuthStore] No refresh token available for refresh");
          throw new Error("No refresh token available");
        }

        try {
          console.log("🔄 [AuthStore] Attempting token refresh");
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
            console.log("✅ [AuthStore] Token refresh successful");
          } else {
            throw new Error("Token refresh failed");
          }
        } catch (error) {
          console.error("❌ [AuthStore] Token refresh failed:", error);
          // Only clear auth if we're not in a login process
          if (!isLoading) {
            get().clearAuth();
          }
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
      enableBiometric: async (credentials: {
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

          if (!credentials || !credentials.email || !credentials.password) {
            throw new Error(
              "Email and password are required to enable biometric authentication",
            );
          }

          // Use provided credentials
          const biometricCredentials = {
            username: credentials.email,
            password: credentials.password,
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
          console.log("🔐 Starting biometric login flow");

          const result = await biometricService.authenticateAndGetCredentials({
            reason: "Sign in to your account",
            title: "Biometric Login",
            subtitle: "Use your biometric to sign in quickly",
          });

          if (result.success && result.credentials) {
            console.log(
              "✅ Biometric authentication successful, proceeding with login",
            );

            // Use a flag to indicate this is a biometric login
            const loginCredentials = {
              email: result.credentials.username,
              password: result.credentials.password,
              rememberMe: true,
              _isBiometricLogin: true, // Internal flag
            };

            // Call login with enhanced error handling
            try {
              await get().login(loginCredentials);
            } catch (loginError: any) {
              // Handle specific "No refresh token available" error
              if (loginError.message?.includes("No refresh token available")) {
                console.warn(
                  "🔄 Token refresh attempted during biometric login - this is expected, retrying...",
                );

                // Clear any stale auth state and retry
                get().clearAuth();
                await get().login({
                  email: result.credentials.username,
                  password: result.credentials.password,
                  rememberMe: true,
                });
              } else {
                throw loginError;
              }
            }
          } else {
            throw new Error(result.error || "Biometric login failed");
          }
        } catch (error) {
          console.error("❌ Biometric login error:", error);
          const errorMessage =
            (error as any)?.message || "Biometric login failed";

          // Provide more specific error messages
          let userFriendlyMessage = errorMessage;
          if (errorMessage.includes("No refresh token available")) {
            userFriendlyMessage =
              "Authentication failed. Please try again or use password login.";
          }

          set({ error: userFriendlyMessage, isLoading: false });
          throw error;
        }
      },

      // Session management
      checkAuthStatus: async (): Promise<boolean> => {
        const { tokens, sessionExpiry, isLoading } = get();

        if (!tokens) {
          return false;
        }

        // Don't check auth status during login process
        if (isLoading) {
          console.log(
            "🔍 [AuthStore] Skipping auth status check during login process",
          );
          return true; // Assume valid during login
        }

        // Check if session is expired
        if (sessionExpiry && new Date(sessionExpiry) <= new Date()) {
          try {
            await get().refreshToken();
            return true;
          } catch (error) {
            console.warn(
              "🔍 [AuthStore] Auth status check failed, clearing auth",
            );
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
          console.warn("🔍 [AuthStore] Token verification failed:", error);
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
        const { tokens, sessionExpiry, isAuthenticated, isLoading } =
          useAuthStore.getState();

        // Don't attempt refresh during login processes
        if (isLoading) {
          console.log(
            "🔄 [AuthStore] Skipping auto-refresh during login process",
          );
          return;
        }

        if (isAuthenticated && tokens && sessionExpiry && tokens.refreshToken) {
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
