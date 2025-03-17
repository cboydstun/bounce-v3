import axios, { AxiosError, AxiosResponse, AxiosRequestConfig } from "axios";
import { API_ROUTES } from "@/config/constants";
import { ChatResponse, CreateSessionRequest, SendMessageRequest, ChatSession, ChatMessage } from "@/types/chat";

// Create API instances for different base URLs
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

export const chatApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_CHAT_API_URL || "http://localhost:3000",
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
const setupInterceptors = (instance: typeof api) => {
  instance.interceptors.request.use(
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
  instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => response,
    (error: AxiosError<ApiError>) => {
      const errorMessage =
        error.response?.data?.message || "An unexpected error occurred";
      return Promise.reject(new Error(errorMessage));
    },
  );
};

// Set up interceptors for both instances
setupInterceptors(api);
setupInterceptors(chatApi);

export const setAuthToken = (token: string | null) => {
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("auth_token", token);
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      chatApi.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      localStorage.removeItem("auth_token");
      delete api.defaults.headers.common.Authorization;
      delete chatApi.defaults.headers.common.Authorization;
    }
  }
};

// Chat API functions
export const createChatSession = async (data: CreateSessionRequest, config?: AxiosRequestConfig) => {
  const response = await chatApi.post<ChatResponse<{ session: ChatSession; message: ChatMessage }>>(
    API_ROUTES.CHAT.SESSIONS,
    data,
    config
  );
  return response.data;
};

export const sendChatMessage = async (data: SendMessageRequest, config?: AxiosRequestConfig) => {
  const response = await chatApi.post<ChatResponse<ChatMessage>>(
    API_ROUTES.CHAT.MESSAGES,
    data,
    config
  );
  return response.data;
};

export const getChatMessages = async (sessionId: string, config?: AxiosRequestConfig) => {
  const response = await chatApi.get<ChatResponse<ChatMessage[]>>(
    `${API_ROUTES.CHAT.MESSAGES}?sessionId=${sessionId}`,
    config
  );
  return response.data;
};

export const getAdminSessions = async (config?: AxiosRequestConfig) => {
  const response = await chatApi.get<ChatResponse<{ sessions: ChatSession[] }>>(
    API_ROUTES.CHAT.ADMIN_SESSIONS,
    config
  );
  return response.data;
};

export const updateSessionStatus = async (sessionId: string, isActive: boolean, config?: AxiosRequestConfig) => {
  const response = await chatApi.patch<ChatResponse<void>>(
    API_ROUTES.CHAT.ADMIN_SESSIONS,
    {
      sessionId,
      isActive,
    },
    config
  );
  return response.data;
};

export default api;
