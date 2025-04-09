# Mobile Authentication Integration Guide

This document provides guidance on how to integrate the mobile authentication API with your Ionic application.

## API Endpoints

### Authentication

- **Login**: `POST /api/mobile/auth/login`
- **Refresh Token**: `POST /api/mobile/auth/refresh`
- **Logout**: `POST /api/mobile/auth/logout`

### Protected Routes

All protected API routes are available under `/api/mobile/` and require a valid JWT token in the Authorization header.

## CORS Support

The API now includes proper CORS (Cross-Origin Resource Sharing) support for Ionic applications. This allows your Ionic app to make requests to the API from different origins, including:

- `http://localhost:5173` (Ionic dev server)
- `http://localhost:8100` (Alternative Ionic port)
- `capacitor://localhost` (Capacitor native runtime)
- `http://localhost` (General localhost)

If you need to add additional origins, update the `allowedOrigins` array in `src/lib/cors.ts`.

## Authentication Flow

### 1. Login

**Request:**

```typescript
const response = await fetch("https://satxbounce.com/api/mobile/auth/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: "user@example.com",
    password: "password123",
  }),
});

const data = await response.json();
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### 2. Making Authenticated Requests

Use the access token in the Authorization header:

```typescript
const response = await fetch(
  "https://satxbounce.com/api/mobile/protected-data",
  {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  },
);

const data = await response.json();
```

### 3. Refreshing Tokens

When the access token expires (after 15 minutes), use the refresh token to get a new pair of tokens:

```typescript
const response = await fetch("https://satxbounce.com/api/mobile/auth/refresh", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    refreshToken: "your-refresh-token",
  }),
});

const data = await response.json();
// Store the new tokens
const { accessToken, refreshToken } = data;
```

### 4. Logout

To logout and invalidate the refresh token:

```typescript
await fetch("https://satxbounce.com/api/mobile/auth/logout", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    refreshToken: "your-refresh-token",
  }),
});
```

## Ionic Implementation Example

Here's a modern authentication service for your Ionic app using Capacitor Storage:

```typescript
// src/app/services/auth.service.ts
import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { Storage } from "@capacitor/storage";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private _user = new BehaviorSubject<any>(null);
  private apiUrl = "https://satxbounce.com";

  constructor() {
    this.loadStoredUser();
  }

  async loadStoredUser() {
    const { value } = await Storage.get({ key: "user" });
    if (value) {
      this._user.next(JSON.parse(value));
    }
  }

  get user() {
    return this._user.asObservable();
  }

  get isAuthenticated() {
    return this._user.value !== null;
  }

  async login(email: string, password: string) {
    const response = await fetch(`${this.apiUrl}/api/mobile/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    const data = await response.json();

    // Store tokens and user data
    await Storage.set({ key: "accessToken", value: data.accessToken });
    await Storage.set({ key: "refreshToken", value: data.refreshToken });
    await Storage.set({ key: "user", value: JSON.stringify(data.user) });

    this._user.next(data.user);
    return data.user;
  }

  async logout() {
    const { value: refreshToken } = await Storage.get({ key: "refreshToken" });

    if (refreshToken) {
      try {
        await fetch(`${this.apiUrl}/api/mobile/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        });
      } catch (error) {
        console.error("Logout error:", error);
      }
    }

    // Clear stored data
    await Storage.remove({ key: "accessToken" });
    await Storage.remove({ key: "refreshToken" });
    await Storage.remove({ key: "user" });

    this._user.next(null);
  }

  async refreshToken() {
    const { value: refreshToken } = await Storage.get({ key: "refreshToken" });
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.apiUrl}/api/mobile/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const data = await response.json();

      // Store new tokens
      await Storage.set({ key: "accessToken", value: data.accessToken });
      await Storage.set({ key: "refreshToken", value: data.refreshToken });

      return true;
    } catch (error) {
      console.error("Token refresh error:", error);
      return false;
    }
  }

  async apiRequest(endpoint: string, options: any = {}) {
    const { value: accessToken } = await Storage.get({ key: "accessToken" });

    // Set auth header
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    };

    // Make request
    let response = await fetch(`${this.apiUrl}${endpoint}`, {
      ...options,
      headers,
    });

    // If unauthorized, try to refresh token
    if (response.status === 401) {
      const refreshed = await this.refreshToken();

      if (refreshed) {
        // Retry with new token
        const { value: newToken } = await Storage.get({ key: "accessToken" });
        headers["Authorization"] = `Bearer ${newToken}`;

        response = await fetch(`${this.apiUrl}${endpoint}`, {
          ...options,
          headers,
        });
      } else {
        // If refresh fails, logout
        this.logout();
        throw new Error("Session expired");
      }
    }

    return response;
  }
}
```

## Usage in Ionic Components

```typescript
// Login component
async login() {
  try {
    await this.authService.login(this.email, this.password);
    this.router.navigateByUrl('/dashboard');
  } catch (error) {
    this.errorMessage = error.message;
  }
}

// Making authenticated API calls
async fetchData() {
  try {
    const response = await this.authService.apiRequest('/api/mobile/protected-data');
    const data = await response.json();
    this.protectedData = data;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}
```

## Capacitor Configuration

For Capacitor apps, you may need to configure your app to allow network requests to your API domain:

```typescript
// capacitor.config.ts
import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.example.app",
  appName: "Your App Name",
  webDir: "www",
  server: {
    androidScheme: "https",
    allowNavigation: ["satxbounce.com"],
  },
};

export default config;
```

## Troubleshooting CORS Issues

If you're still experiencing CORS issues:

1. **Check the request origin**: Make sure your app's origin is included in the allowed origins list in `src/lib/cors.ts`.

2. **Verify preflight requests**: For complex requests (with custom headers like Authorization), browsers send a preflight OPTIONS request. Ensure these are being handled correctly.

3. **Network inspection**: Use browser developer tools to inspect the network requests and responses. Look for missing CORS headers in the response.

4. **Capacitor logs**: For native apps, check the Capacitor logs for any network-related errors.

5. **Proxy configuration**: During development, you can use a proxy in your Ionic app to avoid CORS issues:

   ```javascript
   // angular.json (for Angular-based Ionic apps)
   {
     "projects": {
       "app": {
         "architect": {
           "serve": {
             "options": {
               "proxyConfig": "src/proxy.conf.json"
             }
           }
         }
       }
     }
   }
   ```

   ```json
   // src/proxy.conf.json
   {
     "/api": {
       "target": "https://satxbounce.com",
       "secure": true,
       "changeOrigin": true
     }
   }
   ```

## Security Considerations

1. **Secure Storage**: Use Capacitor Secure Storage plugin for storing sensitive information
2. **HTTPS**: Ensure all API requests use HTTPS
3. **Token Expiration**: The access token expires after 15 minutes for security
4. **Token Refresh**: Implement proper token refresh logic to maintain sessions
5. **Error Handling**: Handle authentication errors gracefully
6. **Logout**: Always clear tokens on logout
7. **Certificate Pinning**: Consider implementing certificate pinning for production apps

## Testing

Test your implementation with tools like Postman or Insomnia before integrating with your mobile app. For Capacitor apps, test on both web and native platforms to ensure compatibility.
