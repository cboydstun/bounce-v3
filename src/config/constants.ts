export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const API_ROUTES = {
  PRODUCTS: '/api/v1/products',
  BLOGS: '/api/v1/blogs',
  USERS: '/api/v1/users',
  CONTACTS: '/api/v1/contacts',
} as const;
