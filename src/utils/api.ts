import axios, { AxiosError, AxiosResponse } from "axios";
import { API_BASE_URL } from "../config/constants";

const api = axios.create({
  baseURL: API_BASE_URL,
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

export interface LoginCredentials {
  email: string;
  password: string;
}

export const login = async (credentials: LoginCredentials) => {
  const response = await api.post<{ token: string }>(
    "/api/v1/users/login",
    credentials,
  );
  const token = response.data.token;
  setAuthToken(token);
  return response.data;
};

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

export const setAuthToken = (token: string | null) => {
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("auth_token", token);
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      localStorage.removeItem("auth_token");
      delete api.defaults.headers.common.Authorization;
    }
  }
};

export default api;
