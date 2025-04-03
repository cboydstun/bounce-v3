import axios, { AxiosError, AxiosResponse } from "axios";
import { getSession } from "next-auth/react";

// Use relative URLs for API endpoints when in the browser
// This ensures we're using the Next.js API routes
const baseURL =
  typeof window !== "undefined" ? "" : process.env.API_BASE_URL || "";

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
  async (config) => {
    if (typeof window !== "undefined") {
      try {
        // Get session from NextAuth.js
        const session = await getSession();

        // Debug log for session
        console.log("[API DEBUG] Session in request interceptor:", {
          hasSession: !!session,
          hasUser: !!session?.user,
          hasUserId: !!session?.user?.id,
        });

        if (session?.user?.id) {
          // Use session user ID for authorization
          // Support both formats for backward compatibility
          config.headers.Authorization = `Bearer ${session.user.id}`;

          // Add a custom header for debugging
          config.headers["X-Auth-Debug"] = "nextauth-session";
        } else {
          console.log("[API DEBUG] No session user ID found");

          // Check if we have a token in localStorage (legacy method)
          const token = localStorage.getItem("auth_token");
          if (token) {
            console.log("[API DEBUG] Using legacy token from localStorage");
            config.headers.Authorization = `Bearer ${token}`;
            config.headers["X-Auth-Debug"] = "legacy-token";
          }
        }
      } catch (error) {
        console.error("Error getting session in API interceptor:", error);
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
    // Check if this is an authentication error
    if (error.response?.status === 401) {
      console.log("[API DEBUG] 401 Unauthorized error detected");

      // Don't automatically clear the token on 401 errors
      // This allows the app to try other authentication methods

      // Return a more specific error message for authentication errors
      return Promise.reject(
        new Error("Authentication failed - Please log in again"),
      );
    }

    const errorMessage =
      error.response?.data?.message || "An unexpected error occurred";
    return Promise.reject(new Error(errorMessage));
  },
);

// Don't automatically remove auth tokens from localStorage
// We'll keep them for backward compatibility
// if (typeof window !== "undefined") {
//   localStorage.removeItem("auth_token");
// }

export const updateUserProfile = async (userData: {
  email?: string;
  // Add other fields as needed
}) => {
  const response = await api.put("/api/v1/users/profile", userData);
  return response.data;
};

// Reviews API calls
export const getReviews = async (params?: { placeId?: string }) => {
  const queryParams = new URLSearchParams();

  if (params?.placeId) {
    queryParams.append("placeId", params.placeId);
  }

  const queryString = queryParams.toString();
  const url = queryString
    ? `/api/v1/reviews?${queryString}`
    : "/api/v1/reviews";

  const response = await api.get(url);
  return response.data;
};

export const getReviewById = async (id: string) => {
  const response = await api.get(`/api/v1/reviews/${id}`);
  return response.data;
};

export const createReview = async (reviewData: {
  placeId: string;
  authorName: string;
  rating: number;
  text: string;
  isLocalGuide?: boolean;
  authorUrl?: string;
  profilePhotoUrl?: string;
  language?: string;
}) => {
  const response = await api.post("/api/v1/reviews", reviewData);
  return response.data;
};

export const updateReview = async (
  id: string,
  reviewData: {
    rating?: number;
    text?: string;
    authorName?: string;
    isLocalGuide?: boolean;
    likes?: number;
  },
) => {
  const response = await api.put(`/api/v1/reviews/${id}`, reviewData);
  return response.data;
};

export const deleteReview = async (id: string) => {
  const response = await api.delete(`/api/v1/reviews/${id}`);
  return response.data;
};

// Products API calls
export const getProducts = async (params?: {
  category?: string;
  search?: string;
  availability?: string;
}) => {
  const queryParams = new URLSearchParams();

  if (params?.category) {
    queryParams.append("category", params.category);
  }

  if (params?.search) {
    queryParams.append("search", params.search);
  }

  if (params?.availability) {
    queryParams.append("availability", params.availability);
  }

  const queryString = queryParams.toString();
  const url = queryString
    ? `/api/v1/products?${queryString}`
    : "/api/v1/products";

  const response = await api.get(url);
  return response.data;
};

export const getProductBySlug = async (slug: string) => {
  const response = await api.get(`/api/v1/products/${slug}`);
  return response.data;
};

export const deleteProduct = async (slug: string) => {
  const response = await api.delete(`/api/v1/products/${slug}`);
  return response.data;
};

export const createProduct = async (productData: {
  name: string;
  description: string;
  category: string;
  price: {
    base: number;
    currency: string;
  };
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  capacity: number;
  ageRange: {
    min: number;
    max: number;
  };
  setupRequirements: {
    space: string;
    powerSource: boolean;
    surfaceType: string[];
  };
  safetyGuidelines: string;
  rentalDuration?: "hourly" | "half-day" | "full-day" | "weekend";
  availability?: "available" | "rented" | "maintenance" | "retired";
  features?: string[];
  weatherRestrictions?: string[];
  additionalServices?: Array<{
    name: string;
    price: number;
  }>;
  images?: Array<{
    url: string;
    alt?: string;
    isPrimary?: boolean;
    filename?: string;
    public_id?: string;
  }>;
  specifications?: Array<{
    name: string;
    value: string | number | boolean;
  }>;
  slug?: string;
  maintenanceSchedule?: {
    lastMaintenance?: Date;
    nextMaintenance?: Date;
  };
}) => {
  const response = await api.post("/api/v1/products", productData);
  return response.data;
};

export const updateProduct = async (
  slug: string,
  productData: Partial<Parameters<typeof createProduct>[0]>,
) => {
  const response = await api.put(`/api/v1/products/${slug}`, productData);
  return response.data;
};

// Contacts API calls
export const getContacts = async (params?: {
  startDate?: string;
  endDate?: string;
  confirmed?: boolean;
  limit?: number;
  page?: number;
  deliveryDay?: string; // Add deliveryDay parameter
}) => {
  const queryParams = new URLSearchParams();

  if (params?.startDate) {
    queryParams.append("startDate", params.startDate);
  }

  if (params?.endDate) {
    queryParams.append("endDate", params.endDate);
  }

  if (params?.confirmed !== undefined) {
    queryParams.append("confirmed", params.confirmed.toString());
  }

  if (params?.limit) {
    queryParams.append("limit", params.limit.toString());
  }

  if (params?.page) {
    queryParams.append("page", params.page.toString());
  }

  // Add support for deliveryDay parameter
  if (params?.deliveryDay) {
    queryParams.append("deliveryDay", params.deliveryDay);
  }

  const queryString = queryParams.toString();
  const url = queryString
    ? `/api/v1/contacts?${queryString}`
    : "/api/v1/contacts";

  const response = await api.get(url);
  return response.data;
};

export const getContactById = async (id: string) => {
  const response = await api.get(`/api/v1/contacts/${id}`);
  return response.data;
};

export const createContact = async (contactData: {
  bouncer: string;
  email: string;
  phone?: string;
  partyDate: string;
  partyZipCode: string;
  message?: string;
  confirmed?: boolean;
  tablesChairs?: boolean;
  generator?: boolean;
  popcornMachine?: boolean;
  cottonCandyMachine?: boolean;
  snowConeMachine?: boolean;
  basketballShoot?: boolean;
  slushyMachine?: boolean;
  overnight?: boolean;
  sourcePage: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Allow for additional fields
}) => {
  const response = await api.post("/api/v1/contacts", contactData);
  return response.data;
};

import { ConfirmationStatus } from "@/types/contact";

export const updateContact = async (
  id: string,
  contactData: Partial<{
    bouncer: string;
    email: string;
    phone: string;
    partyDate: string;
    partyZipCode: string;
    message: string;
    confirmed: ConfirmationStatus | boolean; // Support both for backward compatibility
    tablesChairs: boolean;
    generator: boolean;
    popcornMachine: boolean;
    cottonCandyMachine: boolean;
    snowConeMachine: boolean;
    basketballShoot: boolean;
    slushyMachine: boolean;
    overnight: boolean;
    sourcePage: string;
    // Address information
    streetAddress?: string;
    city?: string;
    state?: string;
    // Party timing
    partyStartTime?: string;
    partyEndTime?: string;
    // Delivery information
    deliveryDay?: string;
    deliveryTime?: string;
    pickupDay?: string;
    pickupTime?: string;
    // Payment and admin information
    paymentMethod?: "cash" | "quickbooks" | "paypal" | "free";
    discountComments?: string;
    adminComments?: string;
  }>,
) => {
  const response = await api.put(`/api/v1/contacts/${id}`, contactData);
  return response.data;
};

export const deleteContact = async (id: string) => {
  const response = await api.delete(`/api/v1/contacts/${id}`);
  return response.data;
};

// Legacy function for backward compatibility
export const submitContactForm = async (formData: {
  bouncer?: string;
  email: string;
  partyDate?: string;
  partyZipCode?: string;
  phone?: string;
  message?: string;
  sourcePage?: string;
  tablesChairs?: boolean;
  generator?: boolean;
  popcornMachine?: boolean;
  cottonCandyMachine?: boolean;
  snowConeMachine?: boolean;
  basketballShoot?: boolean;
  slushyMachine?: boolean;
  overnight?: boolean;
  consentToContact?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Allow for additional fields
}) => {
  return createContact({
    ...formData,
    bouncer: formData.bouncer || "Unknown",
    partyDate: formData.partyDate || new Date().toISOString(),
    partyZipCode: formData.partyZipCode || "00000",
    sourcePage: formData.sourcePage || "website",
  });
};

export const checkProductAvailability = async (
  productSlug: string,
  date: string,
): Promise<{
  available: boolean;
  product: {
    name: string;
    slug: string;
    status: string;
  };
  reason?: string;
}> => {
  const response = await api.get(
    `/api/v1/products/availability?slug=${productSlug}&date=${date}`,
  );
  return response.data;
};

export default api;
