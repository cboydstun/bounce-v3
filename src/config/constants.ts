// API paths without base URLs
export const API_ROUTES = {
  PRODUCTS: "/api/v1/products",
  BLOGS: "/api/v1/blogs",
  USERS: "/api/v1/users",
  CONTACTS: "/api/v1/contacts",
  REVIEWS: "/api/v1/reviews",
  CHAT: {
    SESSIONS: "/api/v1/chat/sessions",
    MESSAGES: "/api/v1/chat/messages",
    ADMIN_SESSIONS: "/api/v1/chat/admin/sessions",
  },
} as const;
