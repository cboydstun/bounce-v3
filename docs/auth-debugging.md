# NextAuth.js Authentication Debugging Guide

This document provides guidance on debugging authentication issues with NextAuth.js, particularly focusing on the differences between development and production environments.

## Table of Contents

1. [Common Issues](#common-issues)
2. [Environment Variables](#environment-variables)
3. [Cookie Settings](#cookie-settings)
4. [Middleware Configuration](#middleware-configuration)
5. [Debugging Tools](#debugging-tools)
6. [Vercel Deployment Considerations](#vercel-deployment-considerations)

## Common Issues

### Authentication Works in Development but Not in Production

This is a common issue with NextAuth.js and typically stems from one of these causes:

1. **Environment Variables**: Missing or incorrect NEXTAUTH_URL or NEXTAUTH_SECRET in production
2. **Cookie Settings**: Secure cookies not working correctly in production
3. **Middleware Conflicts**: Middleware intercepting requests that should be excluded
4. **CORS Issues**: Cross-origin resource sharing problems in production

### Analytics Interference

A specific issue we've identified is that analytics endpoints (like `/api/v1/visitors`) were being intercepted by the authentication middleware, causing redirect loops and 405 Method Not Allowed errors.

## Environment Variables

NextAuth.js requires these environment variables to be properly set:

```
NEXTAUTH_URL=https://your-production-site.com
NEXTAUTH_SECRET=your-secure-secret-key
```

### NEXTAUTH_URL

- Must be the full URL of your site in production
- Should include the protocol (https://) and domain
- Should not include a trailing slash
- Example: `NEXTAUTH_URL=https://bounce-v3-git-nextauth-chris-boydstuns-projects.vercel.app`

### NEXTAUTH_SECRET

- Used to encrypt tokens and cookies
- Should be a secure random string
- Can be generated with: `openssl rand -base64 32`
- Must be the same across all instances of your application

## Cookie Settings

NextAuth.js uses cookies to store session information. In production:

1. **Secure Flag**: Cookies must have the `Secure` flag set (requires HTTPS)
2. **SameSite**: Usually set to `Lax` for best compatibility
3. **HttpOnly**: Should be enabled for security
4. **Domain**: Must match your site's domain

Our updated configuration sets these correctly:

```javascript
cookies: {
  sessionToken: {
    name: "next-auth.session-token",
    options: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },
  },
  // Other cookies...
}
```

## Middleware Configuration

The middleware configuration is critical for ensuring that authentication checks are applied to the right routes.

### Fixed Issues

We've updated the middleware configuration to:

1. **Exclude Analytics Endpoints**: The `/api/v1/visitors` endpoint is now excluded from authentication checks
2. **Specify Protected Routes**: Instead of broadly matching all API routes, we now explicitly list protected routes
3. **Improve Debugging**: Added more detailed logging to help diagnose issues

### Current Configuration

```javascript
export const config = {
  matcher: [
    // Match all admin routes
    "/admin/:path*",
    // Match specific API routes that need protection
    "/api/v1/users/:path*",
    "/api/v1/contacts/:path*",
    "/api/v1/products/admin/:path*",
    "/api/v1/reviews/admin/:path*",
    "/api/v1/blogs/admin/:path*",
  ],
};
```

## Debugging Tools

We've added several debugging tools to help diagnose authentication issues:

### Debug Script

A new script at `scripts/debug-auth.js` can be used to test the authentication flow:

```bash
# Run with default settings
node scripts/debug-auth.js

# Specify URL and credentials
node scripts/debug-auth.js --url=https://your-site.com --email=user@example.com --password=yourpassword
```

This script will:

1. Check environment variables
2. Test cookie settings
3. Attempt to log in
4. Verify session persistence
5. Test access to protected routes

### Debug Logging

We've enhanced logging throughout the authentication system:

- `[AUTH DEBUG]` - Logs from the NextAuth.js configuration
- `[MIDDLEWARE DEBUG]` - Logs from the middleware
- `[AUTH CONTEXT DEBUG]` - Logs from the AuthContext component
- `[LOGIN DEBUG]` - Logs from the login page

These logs will help identify where authentication is failing.

## Vercel Deployment Considerations

When deploying to Vercel, consider these additional points:

1. **Environment Variables**: Set them in the Vercel dashboard under Project Settings > Environment Variables
2. **Preview Deployments**: Each preview deployment gets its own URL, so NEXTAUTH_URL needs to be set accordingly
3. **Serverless Functions**: Vercel uses serverless functions, which can affect how cookies and sessions work
4. **Edge Middleware**: If using Vercel Edge Middleware, there are additional considerations for authentication

### Recommended Vercel Configuration

In your `vercel.json`:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install --include=dev",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

## Troubleshooting Steps

If you're still experiencing issues:

1. **Check Environment Variables**: Verify NEXTAUTH_URL and NEXTAUTH_SECRET are set correctly
2. **Run the Debug Script**: Use `scripts/debug-auth.js` to diagnose issues
3. **Check Browser Console**: Look for errors related to cookies or CORS
4. **Inspect Network Requests**: Check for redirects or 401/403 errors
5. **Verify HTTPS**: Ensure your site is using HTTPS in production
6. **Clear Cookies**: Try clearing browser cookies and testing again
7. **Check Middleware Logs**: Look for middleware logs to see if routes are being intercepted incorrectly

If all else fails, you may need to temporarily disable the middleware for analytics endpoints and gradually re-enable protection for specific routes.
