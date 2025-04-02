# Authentication Debugging Guide

This guide provides instructions for debugging authentication issues in the application, particularly focusing on problems that occur in production but not in development.

## Table of Contents

1. [Common Authentication Issues](#common-authentication-issues)
2. [Debug Logging](#debug-logging)
3. [Debug Page](#debug-page)
4. [Test Script](#test-script)
5. [Environment Variables](#environment-variables)
6. [Cookie Issues](#cookie-issues)
7. [Production Checklist](#production-checklist)

## Common Authentication Issues

Authentication issues that appear in production but not in development are often related to:

1. **Missing Environment Variables**: NEXTAUTH_URL, NEXTAUTH_SECRET, or JWT_SECRET not properly set in production
2. **Cookie Configuration**: Secure cookies requiring HTTPS in production
3. **CORS Issues**: Cross-origin requests being blocked
4. **Database Connection**: Problems connecting to MongoDB in production
5. **Middleware Execution**: Different behavior in production vs development
6. **Token Verification**: Issues with JWT verification

## Debug Logging

We've added extensive debug logging throughout the authentication flow. These logs will help identify where the authentication process is failing.

Key files with debug logging:

- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth API route
- `src/app/login/page.tsx` - Login page component
- `src/middleware.ts` - Next.js middleware
- `src/contexts/AuthContext.tsx` - Auth context provider
- `src/middleware/auth.ts` - API route auth middleware

The logs include:

- Environment variable checks
- Database connection status
- Token creation and verification
- Session management
- Cookie handling

## Debug Page

A special debug page is available at `/debug-auth` that provides real-time information about:

- Current session status
- Environment variables
- Authentication cookies
- LocalStorage items
- Browser information

This page also allows you to:

- Test login/logout functionality
- Check session data
- Verify environment configuration

**Important**: This page displays sensitive information and should be protected or disabled in production after debugging is complete.

## Test Script

A Node.js script is provided to test the authentication flow directly:

```bash
# Run against local development server
node scripts/test-auth.js

# Run against production
node scripts/test-auth.js https://your-production-site.com
```

This script tests:

1. CSRF token generation
2. Login with credentials
3. Session retrieval
4. Logout functionality

## Environment Variables

Ensure these environment variables are properly set in production:

```
# Required for NextAuth.js
NEXTAUTH_URL=https://your-production-site.com
NEXTAUTH_SECRET=your-secure-secret-key

# Alternative to NEXTAUTH_SECRET (only one is needed)
JWT_SECRET=your-secure-secret-key

# Database connection
MONGODB_URI=your-mongodb-connection-string
```

**Note**: In production, `NEXTAUTH_URL` must use HTTPS if your site uses HTTPS.

## Cookie Issues

Common cookie-related issues:

1. **Secure Flag**: In production, cookies are set with `secure: true` which requires HTTPS
2. **Domain Issues**: Ensure cookies are set for the correct domain
3. **SameSite Policy**: NextAuth uses `sameSite: "lax"` which may cause issues with certain cross-origin requests
4. **HttpOnly Flag**: Session cookies are HttpOnly and cannot be accessed by JavaScript

To check cookies in the browser:

1. Open Developer Tools (F12)
2. Go to Application tab (Chrome) or Storage tab (Firefox)
3. Look for Cookies in the sidebar
4. Check for `next-auth.session-token` cookie

## Production Checklist

Before deploying to production, verify:

- [ ] All required environment variables are set
- [ ] Database connection string is correct
- [ ] NEXTAUTH_URL matches your production URL
- [ ] HTTPS is properly configured if using secure cookies
- [ ] JWT secret is strong and secure
- [ ] Session configuration is appropriate for your use case
- [ ] Middleware is correctly configured

## Troubleshooting Steps

If authentication is failing in production:

1. Check server logs for error messages
2. Visit `/debug-auth` to inspect session state and environment variables
3. Run the test script against your production URL
4. Verify cookies are being set correctly
5. Check for CORS errors in the browser console
6. Ensure database connection is working
7. Verify JWT secret is consistent

If you identify missing environment variables or configuration issues, update your deployment configuration and redeploy.
