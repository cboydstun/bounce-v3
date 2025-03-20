import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Visitor from "@/models/Visitor";
import { getClientIp } from "@/utils/ip";
import { detectDevice } from "@/utils/device";

/**
 * POST /api/v1/visitors
 * Create or update visitor information
 */
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        
        const data = await req.json();
        const { visitorId, ...visitorData } = data;
        
        // Get IP address from request
        const ipAddress = getClientIp(req);
        
        // Detect device type
        const userAgent = req.headers.get("user-agent") || "";
        const device = detectDevice(userAgent);
        
        // Check if visitor exists
        let visitor = await Visitor.findOne({ visitorId });
        
        if (visitor) {
            // Update existing visitor
            visitor.lastVisit = new Date();
            visitor.visitCount += 1;
            visitor.visitedPages.push({
                url: data.currentPage || "/",
                timestamp: new Date()
            });
            
            // Update other fields if provided
            if (data.referrer) visitor.referrer = data.referrer;
            if (data.screen) visitor.screen = data.screen;
            if (data.browser) visitor.browser = data.browser;
            if (data.os) visitor.os = data.os;
            if (data.timezone) visitor.timezone = data.timezone;
            if (data.language) visitor.language = data.language;
            if (data.hardware) visitor.hardware = data.hardware;
            if (data.network) visitor.network = data.network;
            
            await visitor.save();
        } else {
            // Create new visitor
            visitor = await Visitor.create({
                visitorId,
                userAgent,
                device,
                ipAddress,
                ...visitorData,
                visitedPages: [{
                    url: data.currentPage || "/",
                    timestamp: new Date()
                }]
            });
        }
        
        return NextResponse.json({ success: true, visitorId });
    } catch (error) {
        console.error("Error tracking visitor:", error);
        return NextResponse.json(
            { success: false, error: "Failed to track visitor" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/v1/visitors
 * Retrieve visitor information (admin only)
 */
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        
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
        
        // Parse query parameters
        const url = new URL(req.url);
        const limit = parseInt(url.searchParams.get("limit") || "100");
        const page = parseInt(url.searchParams.get("page") || "1");
        const skip = (page - 1) * limit;
        
        // Get total count for pagination
        const total = await Visitor.countDocuments();
        
        // Get visitors with pagination
        const visitors = await Visitor.find()
            .sort({ lastVisit: -1 })
            .skip(skip)
            .limit(limit);
        
        return NextResponse.json({
            success: true,
            visitors,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching visitors:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch visitors" },
            { status: 500 }
        );
    }
}
