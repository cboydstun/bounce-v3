export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""; // Empty string for relative URLs within the same app

export const API_ROUTES = {
  PRODUCTS: "/api/v1/products",
  BLOGS: "/api/v1/blogs",
  USERS: "/api/v1/users",
  CONTACTS: "/api/v1/contacts",
  REVIEWS: "/api/v1/reviews",
} as const;
