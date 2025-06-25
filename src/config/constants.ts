export const API_BASE_URL = ""; // Empty string for relative URLs within the same app

export const API_ROUTES = {
  PRODUCTS: "/api/v1/products",
  BLOGS: "/api/v1/blogs",
  USERS: "/api/v1/users",
  CONTACTS: "/api/v1/contacts",
  REVIEWS: "/api/v1/reviews",
  KUDOS: "/api/v1/admin/kudos",
} as const;

// Google Review Configuration
export const GOOGLE_REVIEW_LINK = "https://g.page/r/CRD8_XzLRehLEB0/review";

// Business Information
export const BUSINESS_INFO = {
  name: "SATX Bounce LLC",
  email: process.env.EMAIL || "satxbounce@gmail.com",
  phone: process.env.USER_PHONE_NUMBER || "(512) 210-0194",
  website: "https://www.satxbounce.com",
  owner: "Chris Boydstun",
  ownerTitle: "Owner, SATX Bounce",
} as const;

// Email Signature Template
export const EMAIL_SIGNATURE = `Chris Boydstun
Owner, SATX Bounce
https://www.satxbounce.com <- Book Online!
512-210-0194`;
