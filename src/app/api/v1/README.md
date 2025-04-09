# API Documentation

This directory contains the API endpoints for the application. Below is a description of each endpoint and its purpose.

## Promo Opt-in Endpoints

### Public Endpoint

- **`/api/v1/package-promo`**: Public endpoint for handling promo opt-in form submissions
  - **POST**: Create a new promo opt-in record
    - Validates required fields
    - Stores the submission in the database
    - Sends email notifications to admin and customer
    - Sends SMS notification to admin
    - Does not require authentication

### Admin CRUD Endpoints

- **`/api/v1/promo-optins`**: Admin endpoints for managing promo opt-ins

  - **GET**: List all promo opt-ins (protected, requires authentication)
    - Supports filtering by email, promoName, and date range
    - Supports text search
    - Includes pagination
  - **POST**: Create a new promo opt-in (protected, requires authentication)

- **`/api/v1/promo-optins/[id]`**: Admin endpoints for managing a specific promo opt-in
  - **GET**: Get a specific promo opt-in by ID (protected, requires authentication)
  - **PUT**: Update a specific promo opt-in (protected, requires authentication)
  - **DELETE**: Delete a specific promo opt-in (protected, requires authentication)

## Design Decisions

1. **Separation of Public and Admin Endpoints**:

   - The `/api/v1/package-promo` endpoint is designed for public use by the coupon form
   - The `/api/v1/promo-optins` endpoints are designed for admin use with authentication

2. **Direct Database Access**:

   - The `/api/v1/package-promo` endpoint directly uses the PromoOptin model for data storage
   - This avoids unnecessary API calls and maintains backward compatibility with the existing coupon form

3. **Authentication**:

   - Public endpoints do not require authentication
   - Admin endpoints require authentication using NextAuth
   - This ensures that only authorized users can access sensitive data and perform CRUD operations

4. **Notifications**:
   - Email notifications are sent to both admin and customer
   - SMS notifications are sent to admin
   - This ensures that all stakeholders are informed of new submissions
