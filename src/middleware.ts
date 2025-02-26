import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    // Get the origin from the request headers
    const origin = request.headers.get("origin") || "";

    // Only allow requests from our development and production origins
    const allowedOrigins = [
        "http://localhost:5173",  // Ionic default dev server
        "http://localhost:5174",  // Additional Ionic dev port
        "http://localhost:5175",  // Just in case another port is used
        "http://localhost:3000",  // Next.js dev server
        "capacitor://localhost",  // Capacitor app
        "http://localhost"        // General localhost
    ];

    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV === "development";

    // Check if the origin is allowed
    let isAllowedOrigin = allowedOrigins.includes(origin);

    // In development, be more permissive with localhost origins
    if (isDevelopment && origin.startsWith("http://localhost:")) {
        isAllowedOrigin = true;
    }

    // If origin is not allowed, return 403
    if (!isAllowedOrigin && origin) {
        return new NextResponse(null, {
            status: 403,
            statusText: "Origin Not Allowed",
        });
    }

    // Handle preflight requests
    if (request.method === "OPTIONS") {
        const response = new NextResponse(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
                "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
                "Access-Control-Max-Age": "86400",
                "Access-Control-Allow-Credentials": "true",
            },
        });
        return response;
    }

    // Handle actual requests
    const response = NextResponse.next();

    // Add CORS headers to the response
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    response.headers.set("Access-Control-Allow-Credentials", "true");

    return response;
}

// Configure which paths should be processed by this middleware
export const config = {
    matcher: "/api/:path*",
};
