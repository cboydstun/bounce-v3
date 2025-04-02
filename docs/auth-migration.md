# NextAuth.js Authentication Guide

This document outlines the authentication system for the application, which now exclusively uses NextAuth.js.

## Table of Contents

1. [Overview](#overview)
2. [Key Changes](#key-changes)
3. [Using Authentication in Components](#using-authentication-in-components)
4. [API Authentication](#api-authentication)
5. [Environment Variables](#environment-variables)
6. [Backward Compatibility](#backward-compatibility)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

## Overview

We have completely migrated to NextAuth.js to simplify our codebase, improve security, and provide a consistent authentication experience. The old custom JWT authentication system has been completely removed.

## Key Components

The following components make up our authentication system:

1. **NextAuth.js API Route (`src/app/api/auth/[...nextauth]/route.ts`)**:

   - Handles authentication via CredentialsProvider
   - Connects to MongoDB to verify credentials
   - Creates JWT tokens and manages sessions

2. **API Utility (`src/utils/api.ts`)**:

   - Uses NextAuth.js session for authentication
   - Automatically adds authorization headers to API requests

3. **Auth Context (`src/contexts/AuthContext.tsx`)**:

   - Provides authentication state to the application
   - Uses NextAuth.js session for user data
   - Handles logout functionality

4. **Auth Middleware (`src/middleware/auth.ts`)**:

   - Protects API routes using NextAuth.js tokens
   - Adds user data to request objects

5. **Next.js Middleware (`src/middleware.ts`)**:
   - Protects routes at the application level
   - Redirects unauthenticated users to the login page

## Using Authentication in Components

### Checking Authentication Status

Use the `useSession` hook from NextAuth.js to check authentication status:

```tsx
import { useSession } from "next-auth/react";

function MyComponent() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "unauthenticated") {
    return <div>Please sign in</div>;
  }

  return <div>Welcome, {session.user.email}</div>;
}
```

### Protecting Routes

Use the `useSession` hook with the `required` option to protect routes:

```tsx
import { useSession } from "next-auth/react";

function AdminPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      // This is called if the user is not authenticated
      window.location.href = "/login";
    },
  });

  // If the session is loading or the user is not authenticated,
  // the onUnauthenticated callback will redirect them
  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return <div>Admin Dashboard</div>;
}
```

### Login and Logout

Use the `signIn` and `signOut` functions from NextAuth.js:

```tsx
import { signIn, signOut } from "next-auth/react";

// Login
async function handleLogin() {
  const result = await signIn("credentials", {
    redirect: false,
    email: "user@example.com",
    password: "password123",
    rememberMe: "true",
  });

  if (result?.error) {
    console.error("Login error:", result.error);
  } else {
    // Redirect or update UI
  }
}

// Logout
async function handleLogout() {
  await signOut({ redirect: false });
  // Redirect or update UI
}
```

## API Authentication

### Making Authenticated API Requests

The API utility has been updated to automatically include authentication from the NextAuth.js session. You don't need to manually set tokens anymore:

```tsx
import api from "@/utils/api";

// The request will automatically include authentication if the user is logged in
async function fetchData() {
  const response = await api.get("/api/v1/protected-endpoint");
  return response.data;
}
```

### Protecting API Routes

For API routes that need authentication, use the `withAuth` middleware:

```tsx
import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthRequest } from "@/middleware/auth";

async function handler(req: AuthRequest) {
  // The user is authenticated and available on req.user
  const { id, email } = req.user;

  // Process the request
  return NextResponse.json({ message: "Success" });
}

export const GET = (req: NextRequest) => withAuth(req, handler);
export const POST = (req: NextRequest) => withAuth(req, handler);
```

## Environment Variables

The following environment variables are required for NextAuth.js:

```
# Required for NextAuth.js
NEXTAUTH_URL=https://your-production-site.com
NEXTAUTH_SECRET=your-secure-secret-key

# Database connection
MONGODB_URI=your-mongodb-connection-string
```

- `NEXTAUTH_URL` should be the full URL of your site in production
- `NEXTAUTH_SECRET` is used to encrypt tokens and should be a secure random string
- `JWT_SECRET` is still supported for backward compatibility but will be deprecated

## Authentication Flow

1. User submits credentials on the login page
2. NextAuth.js verifies credentials against the database
3. On successful authentication, NextAuth.js creates a session and JWT token
4. The session is stored in cookies and used for subsequent requests
5. Protected routes and API endpoints check for a valid session

## Testing

The tests have been updated to verify NextAuth.js integration. When writing tests for authenticated components or API routes:

1. Mock the `useSession` hook to return the desired authentication state
2. Mock the `signIn` and `signOut` functions as needed
3. For API tests, mock the `getToken` function to return a valid token

Example:

```tsx
// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
}));

// Mock authenticated session
(useSession as jest.Mock).mockReturnValue({
  data: {
    user: {
      id: "user123",
      email: "test@example.com",
    },
  },
  status: "authenticated",
});
```

## Troubleshooting

If you encounter authentication issues:

1. Check the browser console for error messages
2. Verify that all required environment variables are set
3. Check that cookies are being set correctly (NextAuth.js uses cookies for session management)
4. Use the `/debug-auth` page to diagnose authentication issues
5. Run the `scripts/test-auth.js` script to test the authentication flow

For production issues, check the server logs for detailed error messages from the authentication system.

If you need to debug authentication in production, you can use the `/debug-auth` page and the `scripts/test-auth.js` script to diagnose issues.
