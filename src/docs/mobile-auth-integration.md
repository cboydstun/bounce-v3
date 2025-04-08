# Mobile Authentication Integration Guide

This document provides guidance on how to integrate the mobile authentication API with your Ionic application.

## API Endpoints

### Authentication

- **Login**: `POST /api/mobile/auth/login`
- **Refresh Token**: `POST /api/mobile/auth/refresh`
- **Logout**: `POST /api/mobile/auth/logout`

### Protected Routes

All protected API routes are available under `/api/mobile/` and require a valid JWT token in the Authorization header.

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
  }
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

Here's a simple authentication service for your Ionic app:

```typescript
// src/app/services/auth.service.ts
import { Injectable } from "@angular/core";
import { Storage } from "@ionic/storage-angular";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private _user = new BehaviorSubject<any>(null);
  private apiUrl = "https://satxbounce.com";

  constructor(private storage: Storage) {
    this.storage.create();
    this.loadStoredUser();
  }

  async loadStoredUser() {
    const user = await this.storage.get("user");
    if (user) {
      this._user.next(user);
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
    await this.storage.set("accessToken", data.accessToken);
    await this.storage.set("refreshToken", data.refreshToken);
    await this.storage.set("user", data.user);

    this._user.next(data.user);
    return data.user;
  }

  async logout() {
    const refreshToken = await this.storage.get("refreshToken");

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
    await this.storage.remove("accessToken");
    await this.storage.remove("refreshToken");
    await this.storage.remove("user");

    this._user.next(null);
  }

  async refreshToken() {
    const refreshToken = await this.storage.get("refreshToken");
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
      await this.storage.set("accessToken", data.accessToken);
      await this.storage.set("refreshToken", data.refreshToken);

      return true;
    } catch (error) {
      console.error("Token refresh error:", error);
      return false;
    }
  }

  async apiRequest(endpoint: string, options: any = {}) {
    let accessToken = await this.storage.get("accessToken");

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
        accessToken = await this.storage.get("accessToken");
        headers["Authorization"] = `Bearer ${accessToken}`;

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

## Security Considerations

1. **Secure Storage**: Use Ionic Secure Storage to store tokens securely on the device
2. **HTTPS**: Ensure all API requests use HTTPS
3. **Token Expiration**: The access token expires after 15 minutes for security
4. **Token Refresh**: Implement proper token refresh logic to maintain sessions
5. **Error Handling**: Handle authentication errors gracefully
6. **Logout**: Always clear tokens on logout

## Testing

Test your implementation with tools like Postman or Insomnia before integrating with your mobile app.
