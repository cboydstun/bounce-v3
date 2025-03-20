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
        const { 
            visitorId, 
            currentPage, 
            referrer, 
            pageLoadTime,
            clientError,
            interaction,
            conversionEvent,
            utmParams,
            ...visitorData 
        } = data;
        
        // Get IP address from request
        const ipAddress = getClientIp(req);
        
        // Detect device type
        const userAgent = req.headers.get("user-agent") || "";
        const device = detectDevice(userAgent);
        
        // Get current timestamp
        const now = new Date();
        
        // Check if visitor exists
        let visitor = await Visitor.findOne({ visitorId });
        
        if (visitor) {
            // Update existing visitor
            visitor.lastVisit = now;
            visitor.visitCount += 1;
            
            // Add page visit with duration if provided
            const pageVisit = {
                url: currentPage || "/",
                timestamp: now,
                duration: data.duration
            };
            visitor.visitedPages.push(pageVisit);
            
            // Update session information
            const currentSession = visitor.sessions && visitor.sessions.length > 0 
                ? visitor.sessions[visitor.sessions.length - 1] 
                : null;
                
            // If last session was within 30 minutes, update it, otherwise create a new one
            if (currentSession && 
                ((now.getTime() - new Date(currentSession.startTime).getTime()) < 30 * 60 * 1000) && 
                !currentSession.endTime) {
                // Update existing session
                currentSession.endTime = now;
                currentSession.duration = (now.getTime() - new Date(currentSession.startTime).getTime()) / 1000;
                currentSession.exitPage = currentPage || "/";
                currentSession.pagesViewed += 1;
                currentSession.bounced = currentSession.pagesViewed <= 1;
            } else {
                // Create new session
                const newSession = {
                    startTime: now,
                    pagesViewed: 1,
                    bounced: true // Will be updated as they view more pages
                };
                
                if (!visitor.sessions) {
                    visitor.sessions = [];
                }
                
                visitor.sessions.push(newSession);
            }
            
            // Add interaction if provided
            if (interaction) {
                if (!visitor.interactions) {
                    visitor.interactions = [];
                }
                
                visitor.interactions.push({
                    ...interaction,
                    timestamp: now,
                    page: interaction.page || currentPage || "/"
                });
            }
            
            // Add conversion event if provided
            if (conversionEvent) {
                if (!visitor.conversionEvents) {
                    visitor.conversionEvents = [];
                }
                
                visitor.conversionEvents.push({
                    ...conversionEvent,
                    timestamp: now
                });
                
                // Update funnel stage based on conversion event
                if (conversionEvent.type === "contact_form" && visitor.funnelStage === "visitor") {
                    visitor.funnelStage = "prospect";
                } else if (conversionEvent.type === "booking_started" && 
                          (visitor.funnelStage === "visitor" || visitor.funnelStage === "prospect")) {
                    visitor.funnelStage = "lead";
                } else if (conversionEvent.type === "booking_completed") {
                    visitor.funnelStage = "customer";
                }
            }
            
            // Add page load time if provided
            if (pageLoadTime) {
                if (!visitor.pageLoadTimes) {
                    visitor.pageLoadTimes = [];
                }
                
                visitor.pageLoadTimes.push({
                    url: currentPage || "/",
                    loadTime: pageLoadTime,
                    timestamp: now
                });
            }
            
            // Add client error if provided
            if (clientError) {
                if (!visitor.clientErrors) {
                    visitor.clientErrors = [];
                }
                
                visitor.clientErrors.push({
                    ...clientError,
                    url: clientError.url || currentPage || "/",
                    timestamp: now
                });
            }
            
            // Update UTM parameters if provided
            if (utmParams) {
                visitor.utmSource = utmParams.source || visitor.utmSource;
                visitor.utmMedium = utmParams.medium || visitor.utmMedium;
                visitor.utmCampaign = utmParams.campaign || visitor.utmCampaign;
                visitor.utmTerm = utmParams.term || visitor.utmTerm;
                visitor.utmContent = utmParams.content || visitor.utmContent;
            }
            
            // Update landing page if this is their second page view and we don't have it yet
            if (visitor.visitedPages.length === 2 && !visitor.landingPage) {
                visitor.landingPage = visitor.visitedPages[0].url;
            }
            
            // Update other fields if provided
            if (referrer) visitor.referrer = referrer;
            if (data.screen) visitor.screen = data.screen;
            if (data.browser) visitor.browser = data.browser;
            if (data.os) visitor.os = data.os;
            if (data.timezone) visitor.timezone = data.timezone;
            if (data.language) visitor.language = data.language;
            if (data.hardware) visitor.hardware = data.hardware;
            if (data.network) visitor.network = data.network;
            
            // Calculate engagement score (simple algorithm - can be improved)
            const visitCountScore = Math.min(visitor.visitCount * 5, 40); // Max 40 points
            const pagesViewedScore = Math.min(visitor.visitedPages.length * 2, 30); // Max 30 points
            const conversionScore = visitor.conversionEvents && visitor.conversionEvents.length > 0 ? 
                Math.min(visitor.conversionEvents.length * 10, 30) : 0; // Max 30 points
            
            visitor.engagementScore = visitCountScore + pagesViewedScore + conversionScore;
            
            // Calculate intent score based on product views and conversion events
            let productViewCount = 0;
            let productInteractions = 0;
            
            if (visitor.visitedPages) {
                productViewCount = visitor.visitedPages.filter((p: { url: string }) => p.url.includes('/products/')).length;
            }
            
            if (visitor.interactions) {
                productInteractions = visitor.interactions.filter((i: { type: string; page: string }) => 
                    i.type === 'product_view' || 
                    i.type === 'price_check' || 
                    i.page.includes('/products/')
                ).length;
            }
            
            const productScore = Math.min((productViewCount + productInteractions) * 5, 50); // Max 50 points
            const conversionIntentScore = visitor.conversionEvents && visitor.conversionEvents.length > 0 ? 
                Math.min(visitor.conversionEvents.length * 15, 50) : 0; // Max 50 points
            
            visitor.intentScore = productScore + conversionIntentScore;
            
            // Extract interest categories from product pages
            if (!visitor.interestCategories) {
                visitor.interestCategories = [];
            }
            
            // Extract product categories from URLs
            if (currentPage && currentPage.includes('/products/')) {
                const parts = currentPage.split('/');
                if (parts.length >= 3) {
                    const productSlug = parts[2];
                    // Add to interest categories if not already present
                    if (!visitor.interestCategories.includes(productSlug)) {
                        visitor.interestCategories.push(productSlug);
                    }
                }
            }
            
            await visitor.save();
        } else {
            // Create new visitor
            const newVisitor = {
                visitorId,
                userAgent,
                device,
                ipAddress,
                ...visitorData,
                visitedPages: [{
                    url: currentPage || "/",
                    timestamp: now
                }],
                sessions: [{
                    startTime: now,
                    pagesViewed: 1,
                    bounced: true
                }],
                funnelStage: "visitor",
                landingPage: currentPage || "/"
            };
            
            // Add UTM parameters if provided
            if (utmParams) {
                newVisitor.utmSource = utmParams.source;
                newVisitor.utmMedium = utmParams.medium;
                newVisitor.utmCampaign = utmParams.campaign;
                newVisitor.utmTerm = utmParams.term;
                newVisitor.utmContent = utmParams.content;
            }
            
            // Add referrer if provided
            if (referrer) {
                newVisitor.referrer = referrer;
            }
            
            // Add page load time if provided
            if (pageLoadTime) {
                newVisitor.pageLoadTimes = [{
                    url: currentPage || "/",
                    loadTime: pageLoadTime,
                    timestamp: now
                }];
            }
            
            // Add interaction if provided
            if (interaction) {
                newVisitor.interactions = [{
                    ...interaction,
                    timestamp: now,
                    page: interaction.page || currentPage || "/"
                }];
            }
            
            // Add conversion event if provided
            if (conversionEvent) {
                newVisitor.conversionEvents = [{
                    ...conversionEvent,
                    timestamp: now
                }];
                
                // Update funnel stage based on conversion event
                if (conversionEvent.type === "contact_form") {
                    newVisitor.funnelStage = "prospect";
                } else if (conversionEvent.type === "booking_started") {
                    newVisitor.funnelStage = "lead";
                } else if (conversionEvent.type === "booking_completed") {
                    newVisitor.funnelStage = "customer";
                }
            }
            
            // Add client error if provided
            if (clientError) {
                newVisitor.clientErrors = [{
                    ...clientError,
                    url: clientError.url || currentPage || "/",
                    timestamp: now
                }];
            }
            
            // Extract interest categories from product pages
            if (currentPage && currentPage.includes('/products/')) {
                const parts = currentPage.split('/');
                if (parts.length >= 3) {
                    const productSlug = parts[2];
                    newVisitor.interestCategories = [productSlug];
                }
            }
            
            // Initial engagement and intent scores
            newVisitor.engagementScore = 5; // Starting score
            newVisitor.intentScore = 0;
            
            visitor = await Visitor.create(newVisitor);
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
