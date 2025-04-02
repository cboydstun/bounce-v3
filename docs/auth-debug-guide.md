# Authentication Debugging Guide

This document provides guidance on how to interpret the enhanced logging we've added to diagnose authentication issues in production.

## Overview of Changes

We've added comprehensive logging to three key components of the authentication system:

1. **Middleware** (`src/middleware.ts`)
2. **NextAuth.js Configuration** (`src/app/api/auth/[...nextauth]/route.ts`)
3. **AuthContext** (already had logging in `src/contexts/AuthContext.tsx`)

These changes will help identify exactly where the authentication flow is breaking down.

## How to Interpret the Logs

### Middleware Logs

Look for logs with the prefix `[MIDDLEWARE DEBUG]`. These logs will show:

- Environment variables (NEXTAUTH_URL, partial NEXTAUTH_SECRET)
- Request details (path, method, cookies)
- Token verification attempts and results
- Authentication status and decisions

Key things to look for:

- Is the middleware receiving the session token cookie?
- Is the token verification succeeding or failing?
- What environment variables are set?

### NextAuth.js Logs

Look for logs with the prefix `[AUTH DEBUG]`. These logs will show:

- Environment variables during initialization
- Cookie configuration details
- JWT and session callback execution
- Authentication attempts and results

Key things to look for:

- Are the environment variables correctly set?
- Are the cookies configured properly?
- Are the JWT and session callbacks executing?

### AuthContext Logs

Look for logs with the prefix `[AUTH CONTEXT DEBUG]`. These logs will show:

- Session status changes
- Cookie presence checks
- User state updates
- Logout process

Key things to look for:

- Is the client receiving the session?
- Are the auth cookies present in the browser?
- Is the session verification succeeding?

## Common Issues and Solutions

### 1. Environment Variable Mismatch

**Symptoms:**

- NEXTAUTH_URL doesn't match the actual deployment URL
- Different NEXTAUTH_SECRET values between environments

**Solution:**

- Set NEXTAUTH_URL to match the exact deployment URL
- Ensure NEXTAUTH_SECRET is consistent

### 2. Cookie Configuration Issues

**Symptoms:**

- Cookies not being set
- Cookies not being sent with requests
- SameSite or Secure settings causing issues

**Solution:**

- Adjust cookie settings (sameSite, secure, domain)
- Ensure HTTPS is used in production

### 3. Token Verification Failure

**Symptoms:**

- Token verification fails despite valid session
- JWT callback errors

**Solution:**

- Check secret values
- Verify token format and content

### 4. Cross-Domain Issues

**Symptoms:**

- Authentication works on main domain but not subdomains
- Preview deployments have different behavior

**Solution:**

- Set appropriate cookie domain
- Use SameSite=None with Secure=true for cross-domain

## Next Steps

1. Deploy these changes to production
2. Check the browser console and server logs
3. Look for patterns in the logs that indicate where the authentication is failing
4. Based on the logs, make targeted changes to fix the specific issue

If the logs show that the session token is being created but not recognized by the middleware, focus on the token verification process. If cookies aren't being set at all, focus on the NextAuth.js configuration.
