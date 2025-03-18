import axios, { AxiosError, AxiosResponse } from "axios";
import { LoginCredentials, LoginResponse } from "@/types/user";

// Use relative URLs for API endpoints when in the browser
// This ensures we're using the Next.js API routes
const baseURL = typeof window !== 'undefined' ? '' : process.env.API_BASE_URL || '';

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface ApiResponse<T = Record<string, unknown>> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => response,
  (error: AxiosError<ApiError>) => {
    const errorMessage =
      error.response?.data?.message || "An unexpected error occurred";
    return Promise.reject(new Error(errorMessage));
  },
);

// Helper function to set a cookie
const setCookie = (name: string, value: string, days: number = 1) => {
  if (typeof window === "undefined") return;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  // Set secure and SameSite flags in production
  const isSecure = window.location.protocol === "https:";
  const sameSite = isSecure ? "strict" : "lax";

  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; ${isSecure ? "secure; " : ""
    }samesite=${sameSite}`;

  console.log(`Cookie ${name} set with expiration: ${days} days`);
};

// Helper function to delete a cookie
const deleteCookie = (name: string) => {
  if (typeof window === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

export const setAuthToken = (token: string | null, rememberMe: boolean = false) => {
  if (typeof window !== "undefined") {
    if (token) {
      // Store in localStorage for API requests
      localStorage.setItem("auth_token", token);

      // Set in axios headers
      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      // Store in cookie for middleware authentication
      // Use 30 days expiration if rememberMe is true, otherwise 1 day
      const days = rememberMe ? 30 : 1;
      setCookie("auth_token", token, days);

      console.log(`Auth token set successfully with ${days} day expiration (rememberMe: ${rememberMe})`);
    } else {
      // Remove from localStorage
      localStorage.removeItem("auth_token");

      // Remove from axios headers
      delete api.defaults.headers.common.Authorization;

      // Remove from cookies
      deleteCookie("auth_token");

      console.log("Auth token removed from localStorage and cookie");
    }
  }
};

// Authentication API calls
export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>(
    "/api/v1/users/login",
    credentials,
  );
  const token = response.data.token;

  // Pass the rememberMe preference to setAuthToken
  setAuthToken(token, credentials.rememberMe);

  return response.data;
};

export const register = async (userData: {
  email: string;
  password: string;
}) => {
  const response = await api.post("/api/v1/users/register", userData);
  return response.data;
};

export const getUserProfile = async () => {
  const response = await api.get("/api/v1/users/profile");
  return response.data;
};

export const updateUserProfile = async (userData: {
  email?: string;
  // Add other fields as needed
}) => {
  const response = await api.put("/api/v1/users/profile", userData);
  return response.data;
};

export default api;
