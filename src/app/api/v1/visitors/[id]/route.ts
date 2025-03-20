import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Visitor from "@/models/Visitor";

/**
 * GET /api/v1/visitors/[id]
 * Retrieve a specific visitor by ID
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();
        
        // Await params to get the id
        const { id } = await params;
        
        // Only allow this endpoint in development or with proper authentication
        // In production, you would add authentication middleware here
        if (process.env.NODE_ENV !== "development") {
            // Check for authentication
            // This is a simplified example - in production, use proper auth middleware
            const authHeader = req.headers.get("authorization");
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return NextResponse.json(
                    { success: false, error: "Unauthorized" },
                    { status: 401 }
                );
            }
            
            // Verify token logic would go here
            // const token = authHeader.split(" ")[1];
            // const isValid = verifyToken(token);
            // if (!isValid) {
            //     return NextResponse.json(
            //         { success: false, error: "Unauthorized" },
            //         { status: 401 }
            //     );
            // }
        }
        
        const visitor = await Visitor.findById(id);
        
        if (!visitor) {
            return NextResponse.json(
                { success: false, error: "Visitor not found" },
                { status: 404 }
            );
        }
        
        return NextResponse.json({
            success: true,
            visitor
        });
    } catch (error) {
        console.error("Error fetching visitor:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch visitor" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/v1/visitors/[id]
 * Delete a specific visitor by ID (admin only)
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();
        
        // Await params to get the id
        const { id } = await params;
        
        // Only allow this endpoint in development or with proper authentication
        // In production, you would add authentication middleware here
        if (process.env.NODE_ENV !== "development") {
            // Check for authentication
            // This is a simplified example - in production, use proper auth middleware
            const authHeader = req.headers.get("authorization");
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return NextResponse.json(
                    { success: false, error: "Unauthorized" },
                    { status: 401 }
                );
            }
            
            // Verify token logic would go here
            // const token = authHeader.split(" ")[1];
            // const isValid = verifyToken(token);
            // if (!isValid) {
            //     return NextResponse.json(
            //         { success: false, error: "Unauthorized" },
            //         { status: 401 }
            //     );
            // }
        }
        
        const visitor = await Visitor.findByIdAndDelete(id);
        
        if (!visitor) {
            return NextResponse.json(
                { success: false, error: "Visitor not found" },
                { status: 404 }
            );
        }
        
        return NextResponse.json({
            success: true,
            message: "Visitor deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting visitor:", error);
        return NextResponse.json(
            { success: false, error: "Failed to delete visitor" },
            { status: 500 }
        );
    }
}
