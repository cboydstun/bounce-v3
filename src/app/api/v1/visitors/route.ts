import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Visitor from "@/models/Visitor";
import { getClientIp } from "@/utils/ip";
import { detectDevice } from "@/utils/device";
import { getLocationFromIp } from "@/utils/geolocation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  categorizePage,
  extractGeographicInterest,
  extractEventTypeInterest,
} from "@/utils/pageCategorizationService";

/**
 * POST /api/v1/visitors
 * Create or update visitor information
 * This endpoint is public and does not require authentication
 * as it's used to track all website visitors
 */
export async function POST(req: NextRequest) {
  try {
    // Connect to database with timeout
    const dbConnectPromise = dbConnect();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Database connection timeout")), 10000),
    );

    await Promise.race([dbConnectPromise, timeoutPromise]);

    // Parse and validate request body
    let data;
    try {
      data = await req.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    // Basic validation
    if (!data || typeof data !== "object") {
      return NextResponse.json(
        { success: false, error: "Request body must be a valid object" },
        { status: 400 },
      );
    }

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

    // Get IP address from request with error handling
    let ipAddress;
    try {
      ipAddress = getClientIp(req);
    } catch (error) {
      console.error("Error getting client IP:", error);
      ipAddress = "unknown";
    }

    // Detect device type with error handling
    const userAgent = req.headers.get("user-agent") || "";
    let device;
    try {
      device = detectDevice(userAgent);
    } catch (error) {
      console.error("Error detecting device:", error);
      device = "Desktop"; // Default fallback
    }

    // Get location data from IP address with error handling
    let locationData = null;
    try {
      locationData = await Promise.race([
        getLocationFromIp(ipAddress),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Geolocation timeout")), 5000),
        ),
      ]);
    } catch (error) {
      console.error("Error getting location data:", error);
      // Continue without location data
    }

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
        duration: data.duration,
      };
      visitor.visitedPages.push(pageVisit);

      // Update session information
      const currentSession =
        visitor.sessions && visitor.sessions.length > 0
          ? visitor.sessions[visitor.sessions.length - 1]
          : null;

      // If last session was within 30 minutes, update it, otherwise create a new one
      if (
        currentSession &&
        now.getTime() - new Date(currentSession.startTime).getTime() <
          30 * 60 * 1000 &&
        !currentSession.endTime
      ) {
        // Update existing session
        currentSession.endTime = now;
        currentSession.duration =
          (now.getTime() - new Date(currentSession.startTime).getTime()) / 1000;
        currentSession.exitPage = currentPage || "/";
        currentSession.pagesViewed += 1;
        currentSession.bounced = currentSession.pagesViewed <= 1;
      } else {
        // Create new session
        const newSession = {
          startTime: now,
          pagesViewed: 1,
          bounced: true, // Will be updated as they view more pages
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
          page: interaction.page || currentPage || "/",
        });
      }

      // Add conversion event if provided
      if (conversionEvent) {
        if (!visitor.conversionEvents) {
          visitor.conversionEvents = [];
        }

        visitor.conversionEvents.push({
          ...conversionEvent,
          timestamp: now,
        });

        // Update funnel stage based on conversion event
        if (
          conversionEvent.type === "contact_form" &&
          visitor.funnelStage === "visitor"
        ) {
          visitor.funnelStage = "prospect";
        } else if (
          conversionEvent.type === "booking_started" &&
          (visitor.funnelStage === "visitor" ||
            visitor.funnelStage === "prospect")
        ) {
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
          timestamp: now,
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
          timestamp: now,
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
      const conversionScore =
        visitor.conversionEvents && visitor.conversionEvents.length > 0
          ? Math.min(visitor.conversionEvents.length * 10, 30)
          : 0; // Max 30 points

      visitor.engagementScore =
        visitCountScore + pagesViewedScore + conversionScore;

      // Calculate intent score based on product views and conversion events
      let productViewCount = 0;
      let productInteractions = 0;

      if (visitor.visitedPages) {
        productViewCount = visitor.visitedPages.filter((p: { url: string }) =>
          p.url.includes("/products/"),
        ).length;
      }

      if (visitor.interactions) {
        productInteractions = visitor.interactions.filter(
          (i: { type: string; page: string }) =>
            i.type === "product_view" ||
            i.type === "price_check" ||
            i.page.includes("/products/"),
        ).length;
      }

      const productScore = Math.min(
        (productViewCount + productInteractions) * 5,
        50,
      ); // Max 50 points
      const conversionIntentScore =
        visitor.conversionEvents && visitor.conversionEvents.length > 0
          ? Math.min(visitor.conversionEvents.length * 15, 50)
          : 0; // Max 50 points

      visitor.intentScore = productScore + conversionIntentScore;

      // Enhanced interest category extraction using the new categorization service
      if (!visitor.interestCategories) {
        visitor.interestCategories = [];
      }

      if (currentPage) {
        // Get page category and interest tags
        const pageCategory = categorizePage(currentPage);
        const geoInterests = extractGeographicInterest(currentPage);
        const eventInterests = extractEventTypeInterest(currentPage);

        // Combine all interest tags
        const allInterests = [
          ...pageCategory.interestTags,
          ...geoInterests,
          ...eventInterests,
        ];

        // Add new interests that aren't already tracked
        allInterests.forEach((interest) => {
          if (!visitor.interestCategories.includes(interest)) {
            visitor.interestCategories.push(interest);
          }
        });

        // Limit interest categories to prevent document bloat (keep most recent 20)
        if (visitor.interestCategories.length > 20) {
          visitor.interestCategories = visitor.interestCategories.slice(-20);
        }
      }

      // Save with error handling
      try {
        await visitor.save();
      } catch (saveError) {
        console.error("Error saving existing visitor:", saveError);
        // Try to save with minimal data if full save fails
        try {
          await Visitor.updateOne(
            { visitorId },
            {
              $set: {
                lastVisit: now,
                visitCount: visitor.visitCount,
              },
            },
          );
        } catch (fallbackError) {
          console.error("Fallback save also failed:", fallbackError);
          throw saveError; // Re-throw original error
        }
      }
    } else {
      // Create new visitor
      const newVisitor = {
        visitorId,
        userAgent,
        device,
        ipAddress,
        location: locationData || undefined,
        ...visitorData,
        visitedPages: [
          {
            url: currentPage || "/",
            timestamp: now,
          },
        ],
        sessions: [
          {
            startTime: now,
            pagesViewed: 1,
            bounced: true,
          },
        ],
        funnelStage: "visitor",
        landingPage: currentPage || "/",
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
        newVisitor.pageLoadTimes = [
          {
            url: currentPage || "/",
            loadTime: pageLoadTime,
            timestamp: now,
          },
        ];
      }

      // Add interaction if provided
      if (interaction) {
        newVisitor.interactions = [
          {
            ...interaction,
            timestamp: now,
            page: interaction.page || currentPage || "/",
          },
        ];
      }

      // Add conversion event if provided
      if (conversionEvent) {
        newVisitor.conversionEvents = [
          {
            ...conversionEvent,
            timestamp: now,
          },
        ];

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
        newVisitor.clientErrors = [
          {
            ...clientError,
            url: clientError.url || currentPage || "/",
            timestamp: now,
          },
        ];
      }

      // Enhanced interest category extraction for new visitors
      if (currentPage) {
        const pageCategory = categorizePage(currentPage);
        const geoInterests = extractGeographicInterest(currentPage);
        const eventInterests = extractEventTypeInterest(currentPage);

        // Combine all interest tags for new visitor
        newVisitor.interestCategories = [
          ...pageCategory.interestTags,
          ...geoInterests,
          ...eventInterests,
        ];
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
      { status: 500 },
    );
  }
}

/**
 * GET /api/v1/visitors
 * Retrieve visitor information (admin only)
 * This endpoint requires authentication as it's only for admin users
 */
export async function GET(req: NextRequest) {
  try {
    // Get the session using NextAuth's recommended approach

    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Not authenticated" },
        { status: 401 },
      );
    }

    await dbConnect();

    // Parse query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const page = parseInt(url.searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    // Parse additional query parameters
    const includeAdmin = url.searchParams.get("includeAdmin") === "true";

    // Build query to exclude admin visitors unless explicitly requested
    const query = includeAdmin
      ? {}
      : {
          visitedPages: {
            $not: {
              $elemMatch: {
                url: /^\/admin/,
              },
            },
          },
        };

    // Get total count for pagination (filtered by query)
    const total = await Visitor.countDocuments(query);

    // Get visitors with pagination (filtered by query)
    const visitors = await Visitor.find(query)
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
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching visitors:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch visitors" },
      { status: 500 },
    );
  }
}
