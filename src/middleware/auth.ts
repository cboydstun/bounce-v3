import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export interface AuthRequest extends NextRequest {
    user?: {
        id: string;
        email: string;
        role?: string;
    };
}

/**
 * Authentication middleware for Next.js API routes
 * Verifies JWT token and adds user to request object
 */
export async function withAuth(
    req: NextRequest,
    handler: (req: AuthRequest) => Promise<NextResponse>
) {
    try {
        // Get token from header
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Unauthorized - No token provided" },
                { status: 401 }
            );
        }

        const token = authHeader.split(" ")[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
            id: string;
            email: string;
            role?: string;
        };

        // Add user to request
        const authReq = req as AuthRequest;
        authReq.user = decoded;

        // Call the handler
        return await handler(authReq);
    } catch (error) {
        console.error("Auth middleware error:", error);
        return NextResponse.json(
            { error: "Unauthorized - Invalid token" },
            { status: 401 }
        );
    }
}
