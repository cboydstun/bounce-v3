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

// Define public endpoints that don't require authentication
const publicEndpoints = [
  "/api/v1/package-promo",
  "/api/v1/promo-optins",
  // Removed settings endpoint as we're now using proper NextAuth authentication
];

// Request interceptor for API calls
api.interceptors.request.use(
  async (config) => {
    // Check if the request URL is for a public endpoint
    const isPublicEndpoint = publicEndpoints.some((endpoint) =>
      config.url?.endsWith(endpoint),
    );

    // Skip authentication for public endpoints
    if (isPublicEndpoint) {
      // Add debug header to show this is a public endpoint
      config.headers["X-Auth-Debug"] = "public-endpoint";
      return config;
    }

    if (typeof window !== "undefined") {
      try {
        // Get session from NextAuth.js - ensure we properly await this
        const session = await getSession();
        if (session?.user) {
          // Set the Authorization header with the session token
          // This is used by the NextAuth.js middleware for authentication
          config.headers.Authorization = `Bearer ${session.user.id}`;

          // Also set the user role in a custom header for debugging
          config.headers["X-User-Role"] = session.user.role || "customer";
          config.headers["X-Auth-Debug"] = "nextauth-session";
        } else {
          console.warn(
            `No active session found for request to ${config.url}. Try logging in again.`,
          );
          config.headers["X-Auth-Debug"] = "no-session";

          // Don't try to use localStorage token anymore - rely only on NextAuth
          // This ensures consistent authentication method
        }
      } catch (error) {
        console.error("Error getting session in API interceptor:", error);
        config.headers["X-Auth-Debug"] = "auth-error";
      }
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => response,
  (error: AxiosError<ApiError>) => {
    // Check if this is an authentication error
    if (error.response?.status === 401) {
      console.error("Authentication error:", error.response.data);

      // If we're in the browser, redirect to login on auth errors
      if (typeof window !== "undefined") {
        // Store the current URL to redirect back after login
        const currentPath = window.location.pathname;

        // Only redirect if we're not already on the login page
        if (!currentPath.includes("/login")) {
          console.warn("Authentication failed - Redirecting to login page");

          // Use window.location for a full page reload to clear any stale state
          window.location.href = `/login?from=${encodeURIComponent(currentPath)}&message=${encodeURIComponent("Your session has expired. Please log in again.")}`;

          // Return a clearer error for debugging
          return Promise.reject(
            new Error("Authentication failed - Redirecting to login page"),
          );
        }
      }

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
  includeRetired?: boolean;
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

  if (params?.includeRetired) {
    queryParams.append("includeRetired", "true");
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
  confirmed?: boolean | string; // Support both boolean and string values
  confirmationStatus?: string; // New parameter for specific confirmation status filtering
  limit?: number;
  page?: number;
  deliveryDay?: string;
  includeAllStatuses?: boolean; // New parameter to include all confirmation statuses
}) => {
  const queryParams = new URLSearchParams();

  if (params?.startDate) {
    queryParams.append("startDate", params.startDate);
  }

  if (params?.endDate) {
    queryParams.append("endDate", params.endDate);
  }

  // Handle specific confirmation status filtering
  if (params?.confirmationStatus) {
    queryParams.append("confirmationStatus", params.confirmationStatus);
  }
  // Only include confirmed parameter if includeAllStatuses is not true and no specific status is requested
  else if (params?.confirmed !== undefined && !params?.includeAllStatuses) {
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

  // If includeAllStatuses is true, add a special parameter to tell the API
  // to include all confirmation statuses
  if (params?.includeAllStatuses) {
    queryParams.append("includeAllStatuses", "true");
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
  try {
    const response = await api.post("/api/v1/contacts", contactData);
    return response.data;
  } catch (error) {
    console.error("Error in createContact function:", error);
    throw error;
  }
};

import { ConfirmationStatus } from "@/types/contact";

export const updateContact = async (
  id: string,
  contactData: Partial<{
    bouncer: string;
    email: string;
    phone: string;
    customerName: string;
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

/**
 * Check availability for a product on a specific date using the batch endpoint
 * @param productSlug The slug of the product to check
 * @param date The date to check availability for in YYYY-MM-DD format (Central Time)
 * @returns Availability information including metadata about the date
 */
export const checkBatchProductAvailability = async (
  productSlug: string,
  date: string,
): Promise<{
  [key: string]:
    | {
        available: boolean;
        product: {
          name: string;
          slug: string;
          status: string;
        };
        reason?: string;
      }
    | {
        isBlackoutDate: boolean;
        dateAtCapacity: boolean;
        totalBookings: number;
        maxBookings: number;
      };
}> => {
  const response = await api.post("/api/v1/products/batch-availability", {
    productSlugs: [productSlug],
    date,
  });

  return response.data;
};

/**
 * Check availability for a product across multiple dates using the batch endpoint
 * @param productSlug The slug of the product to check
 * @param dates Array of dates to check availability for in YYYY-MM-DD format (Central Time)
 * @returns Availability information for each date including metadata
 */
export const checkBatchProductAvailabilityMultipleDates = async (
  productSlug: string,
  dates: string[],
): Promise<{
  [key: string]:
    | {
        available: boolean;
        product: {
          name: string;
          slug: string;
          status: string;
        };
        reason?: string;
        date: string;
      }
    | {
        isBlackoutDate: boolean;
        dateAtCapacity: boolean;
        totalBookings: number;
        maxBookings: number;
        date: string;
      };
}> => {
  const response = await api.post("/api/v1/products/batch-availability", {
    productSlugs: [productSlug],
    dates,
  });

  return response.data;
};

// Promo Opt-ins API calls
export const getPromoOptins = async (params?: {
  email?: string;
  promoName?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const queryParams = new URLSearchParams();

  if (params?.email) queryParams.append("email", params.email);
  if (params?.promoName) queryParams.append("promoName", params.promoName);
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);
  if (params?.search) queryParams.append("search", params.search);
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());

  const queryString = queryParams.toString();
  const url = queryString
    ? `/api/v1/promo-optins?${queryString}`
    : "/api/v1/promo-optins";

  const response = await api.get(url);
  return response.data;
};

export const getPromoOptinById = async (id: string) => {
  const response = await api.get(`/api/v1/promo-optins/${id}`);
  return response.data;
};

export const createPromoOptin = async (optinData: {
  name: string;
  email: string;
  phone?: string;
  promoName: string;
  consentToContact: boolean;
}) => {
  const response = await api.post("/api/v1/promo-optins", optinData);
  return response.data;
};

export const updatePromoOptin = async (
  id: string,
  optinData: Partial<{
    name: string;
    email: string;
    phone: string;
    promoName: string;
    consentToContact: boolean;
  }>,
) => {
  const response = await api.put(`/api/v1/promo-optins/${id}`, optinData);
  return response.data;
};

export const deletePromoOptin = async (id: string) => {
  const response = await api.delete(`/api/v1/promo-optins/${id}`);
  return response.data;
};

// Party Packages API calls
export const getPartyPackages = async (params?: { search?: string }) => {
  const queryParams = new URLSearchParams();

  if (params?.search) {
    queryParams.append("search", params.search);
  }

  const queryString = queryParams.toString();
  const url = queryString
    ? `/api/v1/partypackages?${queryString}`
    : "/api/v1/partypackages";

  const response = await api.get(url);
  return response.data;
};

export const getPartyPackageBySlug = async (slug: string) => {
  try {
    const response = await api.get(`/api/v1/partypackages/${slug}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching party package with slug ${slug}:`, error);
    if (axios.isAxiosError(error)) {
      console.error(
        `Status: ${error.response?.status}, Data:`,
        error.response?.data,
      );
    }
    throw error;
  }
};

// Orders API calls
export const getOrders = async (params?: {
  startDate?: string;
  endDate?: string;
  status?: string;
  paymentStatus?: string;
  contactId?: string;
  orderNumber?: string;
  customer?: string;
  taskStatus?: string;
  page?: number;
  limit?: number;
}) => {
  console.log("📡 getOrders API call with params:", params);

  const queryParams = new URLSearchParams();

  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);
  if (params?.status) queryParams.append("status", params.status);
  if (params?.paymentStatus)
    queryParams.append("paymentStatus", params.paymentStatus);
  if (params?.contactId) queryParams.append("contactId", params.contactId);
  if (params?.orderNumber)
    queryParams.append("orderNumber", params.orderNumber);
  if (params?.customer) queryParams.append("customer", params.customer);
  if (params?.taskStatus) queryParams.append("taskStatus", params.taskStatus);
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());

  const queryString = queryParams.toString();
  const url = queryString ? `/api/v1/orders?${queryString}` : "/api/v1/orders";

  console.log("🌐 Making API request to:", url);

  const response = await api.get(url);

  console.log("📥 API response:", {
    ordersCount: response.data.orders?.length || 0,
    pagination: response.data.pagination,
  });

  return response.data;
};

export const getOrderById = async (id: string) => {
  const response = await api.get(`/api/v1/orders/${id}`);
  return response.data;
};

export const createOrder = async (orderData: {
  contactId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  customerZipCode?: string;
  items: Array<{
    type: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  deliveryFee?: number;
  processingFee?: number;
  totalAmount?: number;
  depositAmount?: number;
  balanceDue?: number;
  status?: string;
  paymentStatus?: string;
  paymentMethod: string;
  notes?: string;
  tasks?: string[];
}) => {
  const response = await api.post("/api/v1/orders", orderData);
  return response.data;
};

export const updateOrder = async (
  id: string,
  orderData: Partial<Parameters<typeof createOrder>[0]>,
) => {
  const response = await api.put(`/api/v1/orders/${id}`, orderData);
  return response.data;
};

export const deleteOrder = async (id: string) => {
  const response = await api.delete(`/api/v1/orders/${id}`);
  return response.data;
};

export const createOrderFromContact = async (
  contactId: string,
  orderData: Partial<
    Omit<Parameters<typeof createOrder>[0], "items" | "paymentMethod">
  > & {
    items: Parameters<typeof createOrder>[0]["items"];
    paymentMethod: Parameters<typeof createOrder>[0]["paymentMethod"];
  },
) => {
  // Check if an order already exists for this contact
  const existingOrders = await getOrders({ contactId });
  if (existingOrders.orders && existingOrders.orders.length > 0) {
    throw new Error("An order already exists for this contact");
  }

  // Combine contact ID with order data
  const data = {
    ...orderData,
    contactId,
  };

  // Create the order
  const order = await createOrder(data);

  // Mark the contact as converted
  await updateContact(contactId, { confirmed: "Converted" });

  return order;
};

// Agreement API calls
export const sendAgreement = async (orderId: string) => {
  const response = await api.post(`/api/v1/orders/${orderId}/send-agreement`);
  return response.data;
};

export const getAgreementStatus = async (orderId: string) => {
  const response = await api.get(`/api/v1/orders/${orderId}/send-agreement`);
  return response.data;
};

export const resendAgreement = async (orderId: string) => {
  const response = await api.post(`/api/v1/orders/${orderId}/send-agreement`);
  return response.data;
};

export const overrideDeliveryBlock = async (
  orderId: string,
  reason: string,
) => {
  const response = await api.post(
    `/api/v1/orders/${orderId}/override-delivery-block`,
    {
      reason,
    },
  );
  return response.data;
};

export const downloadSignedAgreement = async (orderId: string) => {
  const response = await api.get(`/api/v1/orders/${orderId}/agreement`, {
    responseType: "blob",
  });
  return response.data;
};

export const getPendingAgreements = async () => {
  const response = await api.get("/api/v1/orders/pending-agreements");
  return response.data;
};

export const syncAgreementStatus = async (orderId: string) => {
  const response = await api.post(`/api/v1/orders/${orderId}/sync-agreement`);
  return response.data;
};

export const syncAllAgreementStatuses = async () => {
  const response = await api.post("/api/v1/orders/sync-all-agreements");
  return response.data;
};

export default api;
