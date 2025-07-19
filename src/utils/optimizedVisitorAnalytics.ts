import { IVisitor } from "@/types/visitor";
import Visitor from "@/models/Visitor";
import {
  categorizePage,
  extractGeographicInterest,
  extractEventTypeInterest,
} from "./pageCategorizationService";

/**
 * Optimized visitor analytics using MongoDB aggregation pipelines
 * Designed to handle large datasets efficiently and legacy data structures
 */

export interface OptimizedEngagementMetrics {
  totalVisitors: number;
  returningVisitors: number;
  averageVisitsPerVisitor: number;
  averagePagesPerVisit: number;
  averageSessionDuration: number;
  bounceRate: number;
  topLandingPages: Array<{
    page: string;
    visitors: number;
    category: string;
    subcategory?: string;
  }>;
  topExitPages: Array<{
    page: string;
    exits: number;
  }>;
}

export interface LandingPagePerformance {
  url: string;
  category: string;
  subcategory?: string;
  visits: number;
  uniqueVisitors: number;
  bounceRate: number;
  averageTimeOnPage: number;
  conversionRate: number;
  deviceBreakdown: {
    Mobile: number;
    Desktop: number;
    Tablet: number;
  };
}

export interface GeographicInsights {
  locationInterests: Array<{
    location: string;
    visitors: number;
    conversionRate: number;
    topPages: string[];
  }>;
  eventTypeInterests: Array<{
    eventType: string;
    visitors: number;
    conversionRate: number;
    topPages: string[];
  }>;
}

/**
 * Get optimized engagement metrics using aggregation
 * Handles both legacy and new visitor document structures
 */
export async function getOptimizedEngagementMetrics(dateRange?: {
  start: Date;
  end: Date;
}): Promise<OptimizedEngagementMetrics> {
  const matchStage: any = {
    // Basic filtering - only include documents with minimum required fields
    visitorId: { $exists: true, $nin: [null, ""] },
  };

  if (dateRange) {
    matchStage.lastVisit = {
      $gte: dateRange.start,
      $lte: dateRange.end,
    };
  }

  // Exclude admin visitors - handle both array and non-array cases
  matchStage.$or = [
    { visitedPages: { $exists: false } },
    { visitedPages: null },
    { visitedPages: { $not: { $elemMatch: { url: /^\/admin/ } } } },
  ];

  const pipeline = [
    { $match: matchStage },
    {
      $addFields: {
        // Normalize fields to ensure consistent data types
        normalizedVisitedPages: {
          $cond: [{ $isArray: "$visitedPages" }, "$visitedPages", []],
        },
        normalizedSessions: {
          $cond: [{ $isArray: "$sessions" }, "$sessions", []],
        },
        normalizedConversionEvents: {
          $cond: [{ $isArray: "$conversionEvents" }, "$conversionEvents", []],
        },
      },
    },
    {
      $group: {
        _id: null,
        totalVisitors: { $sum: 1 },
        returningVisitors: {
          $sum: {
            $cond: [{ $gt: [{ $ifNull: ["$visitCount", 1] }, 1] }, 1, 0],
          },
        },
        totalVisits: { $sum: { $ifNull: ["$visitCount", 1] } },
        totalPageViews: { $sum: { $size: "$normalizedVisitedPages" } },
        totalSessionDuration: {
          $sum: {
            $reduce: {
              input: "$normalizedSessions",
              initialValue: 0,
              in: { $add: ["$$value", { $ifNull: ["$$this.duration", 0] }] },
            },
          },
        },
        bouncedSessions: {
          $sum: {
            $size: {
              $filter: {
                input: "$normalizedSessions",
                cond: { $eq: [{ $ifNull: ["$$this.bounced", false] }, true] },
              },
            },
          },
        },
        totalSessions: {
          $sum: { $size: "$normalizedSessions" },
        },
      },
    },
  ];

  const [metrics] = await Visitor.aggregate(pipeline);

  // Get top landing pages with defensive programming
  const landingPagesPipeline: any[] = [
    { $match: matchStage },
    {
      $addFields: {
        normalizedVisitedPages: {
          $cond: [{ $isArray: "$visitedPages" }, "$visitedPages", []],
        },
        safeLandingPage: { $ifNull: ["$landingPage", "/"] },
      },
    },
    {
      $unwind: {
        path: "$normalizedVisitedPages",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: "$safeLandingPage",
        visitors: { $addToSet: "$visitorId" },
        visits: { $sum: 1 },
      },
    },
    {
      $project: {
        page: "$_id",
        visitors: { $size: "$visitors" },
        visits: 1,
      },
    },
    { $sort: { visitors: -1 } },
    { $limit: 10 },
  ];

  const topLandingPages = await Visitor.aggregate(landingPagesPipeline);

  // Categorize landing pages
  const categorizedLandingPages = topLandingPages.map((page) => {
    const category = categorizePage(page.page || "/");
    return {
      page: page.page || "/",
      visitors: page.visitors || 0,
      category: category.category,
      subcategory: category.subcategory,
    };
  });

  // Get top exit pages with defensive programming
  const exitPagesPipeline: any[] = [
    { $match: matchStage },
    {
      $addFields: {
        normalizedSessions: {
          $cond: [{ $isArray: "$sessions" }, "$sessions", []],
        },
      },
    },
    {
      $unwind: {
        path: "$normalizedSessions",
        preserveNullAndEmptyArrays: true,
      },
    },
    { $match: { "normalizedSessions.exitPage": { $exists: true, $ne: null } } },
    {
      $group: {
        _id: "$normalizedSessions.exitPage",
        exits: { $sum: 1 },
      },
    },
    {
      $project: {
        page: "$_id",
        exits: 1,
      },
    },
    { $sort: { exits: -1 } },
    { $limit: 10 },
  ];

  const topExitPages = await Visitor.aggregate(exitPagesPipeline);

  return {
    totalVisitors: metrics?.totalVisitors || 0,
    returningVisitors: metrics?.returningVisitors || 0,
    averageVisitsPerVisitor:
      metrics?.totalVisitors > 0
        ? metrics.totalVisits / metrics.totalVisitors
        : 0,
    averagePagesPerVisit:
      metrics?.totalVisits > 0
        ? metrics.totalPageViews / metrics.totalVisits
        : 0,
    averageSessionDuration:
      metrics?.totalSessions > 0
        ? metrics.totalSessionDuration / metrics.totalSessions
        : 0,
    bounceRate:
      metrics?.totalSessions > 0
        ? (metrics.bouncedSessions / metrics.totalSessions) * 100
        : 0,
    topLandingPages: categorizedLandingPages,
    topExitPages: topExitPages.map((page) => ({
      page: page.page || "Unknown",
      exits: page.exits || 0,
    })),
  };
}

/**
 * Get landing page performance metrics
 * Handles both legacy and new visitor document structures
 */
export async function getLandingPagePerformance(
  limit: number = 20,
  dateRange?: { start: Date; end: Date },
): Promise<LandingPagePerformance[]> {
  try {
    const baseMatchStage: any = {
      // Only include documents with minimum required fields
      visitorId: { $exists: true, $nin: [null, ""] },
    };

    if (dateRange) {
      baseMatchStage.lastVisit = {
        $gte: dateRange.start,
        $lte: dateRange.end,
      };
    }

    // First, get visitor-level data with page counts for bounce rate calculation
    const visitorDataPipeline: any[] = [
      { $match: baseMatchStage },
      {
        $addFields: {
          normalizedVisitedPages: {
            $cond: [{ $isArray: "$visitedPages" }, "$visitedPages", []],
          },
          normalizedConversionEvents: {
            $cond: [{ $isArray: "$conversionEvents" }, "$conversionEvents", []],
          },
        },
      },
      // Filter out admin visitors and empty page arrays
      {
        $match: {
          normalizedVisitedPages: { $not: { $size: 0 } },
          $nor: [
            { normalizedVisitedPages: { $elemMatch: { url: /^\/admin/ } } },
          ],
        },
      },
      {
        $project: {
          visitorId: 1,
          normalizedVisitedPages: 1,
          normalizedConversionEvents: 1,
          device: {
            $cond: [
              { $in: ["$device", ["Mobile", "Tablet", "Desktop"]] },
              "$device",
              "Desktop",
            ],
          },
          totalPagesViewed: { $size: "$normalizedVisitedPages" },
          hasConversion: { $gt: [{ $size: "$normalizedConversionEvents" }, 0] },
        },
      },
    ];

    const visitorData = await Visitor.aggregate(visitorDataPipeline);

    // Process the data to calculate page-level metrics
    const pageMetrics: {
      [url: string]: {
        visits: number;
        uniqueVisitors: Set<string>;
        totalDuration: number;
        devices: string[];
        conversions: number;
        bounces: number;
      };
    } = {};

    visitorData.forEach((visitor) => {
      if (
        !visitor.normalizedVisitedPages ||
        !Array.isArray(visitor.normalizedVisitedPages)
      ) {
        return;
      }

      const isBounced = visitor.totalPagesViewed === 1;

      visitor.normalizedVisitedPages.forEach((page: any) => {
        if (!page.url || typeof page.url !== "string") {
          return;
        }

        if (!pageMetrics[page.url]) {
          pageMetrics[page.url] = {
            visits: 0,
            uniqueVisitors: new Set(),
            totalDuration: 0,
            devices: [],
            conversions: 0,
            bounces: 0,
          };
        }

        const metrics = pageMetrics[page.url];
        metrics.visits += 1;
        metrics.uniqueVisitors.add(visitor.visitorId);
        metrics.totalDuration += page.duration || 0;
        metrics.devices.push(visitor.device || "Desktop");

        if (visitor.hasConversion) {
          metrics.conversions += 1;
        }

        if (isBounced) {
          metrics.bounces += 1;
        }
      });
    });

    // Convert to final format and sort
    const results = Object.entries(pageMetrics)
      .map(([url, metrics]) => {
        const uniqueVisitorCount = metrics.uniqueVisitors.size;
        const deviceBreakdown = {
          Mobile: metrics.devices.filter((d) => d === "Mobile").length,
          Desktop: metrics.devices.filter((d) => d === "Desktop").length,
          Tablet: metrics.devices.filter((d) => d === "Tablet").length,
        };

        return {
          url,
          visits: metrics.visits,
          uniqueVisitors: uniqueVisitorCount,
          averageTimeOnPage:
            metrics.visits > 0 ? metrics.totalDuration / metrics.visits : 0,
          conversionRate:
            metrics.visits > 0
              ? (metrics.conversions / metrics.visits) * 100
              : 0,
          bounceRate:
            metrics.visits > 0 ? (metrics.bounces / metrics.visits) * 100 : 0,
          deviceBreakdown,
        };
      })
      .sort((a, b) => b.visits - a.visits)
      .slice(0, limit);

    console.log("Executing landing page performance aggregation pipeline...");
    console.log(
      `Landing page performance aggregation completed. Found ${results.length} results.`,
    );

    return results.map((result) => {
      const category = categorizePage(result.url || "/");
      return {
        url: result.url || "/",
        category: category.category,
        subcategory: category.subcategory,
        visits: result.visits || 0,
        uniqueVisitors: result.uniqueVisitors || 0,
        bounceRate: result.bounceRate || 0,
        averageTimeOnPage: result.averageTimeOnPage || 0,
        conversionRate: result.conversionRate || 0,
        deviceBreakdown: result.deviceBreakdown || {
          Mobile: 0,
          Desktop: 0,
          Tablet: 0,
        },
      };
    });
  } catch (error) {
    console.error("Error in getLandingPagePerformance:", error);
    throw error;
  }
}

/**
 * Get geographic and event type insights
 * Handles both legacy and new visitor document structures
 */
export async function getGeographicInsights(dateRange?: {
  start: Date;
  end: Date;
}): Promise<GeographicInsights> {
  const matchStage: any = {
    visitorId: { $exists: true, $nin: [null, ""] },
  };

  if (dateRange) {
    matchStage.lastVisit = {
      $gte: dateRange.start,
      $lte: dateRange.end,
    };
  }

  const pipeline: any[] = [
    { $match: matchStage },
    {
      $addFields: {
        normalizedVisitedPages: {
          $cond: [{ $isArray: "$visitedPages" }, "$visitedPages", []],
        },
        normalizedConversionEvents: {
          $cond: [{ $isArray: "$conversionEvents" }, "$conversionEvents", []],
        },
      },
    },
    // Filter out admin visitors
    {
      $match: {
        $nor: [{ normalizedVisitedPages: { $elemMatch: { url: /^\/admin/ } } }],
      },
    },
    {
      $unwind: {
        path: "$normalizedVisitedPages",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        visitorId: 1,
        url: { $ifNull: ["$normalizedVisitedPages.url", "/"] },
        hasConversion: {
          $gt: [{ $size: "$normalizedConversionEvents" }, 0],
        },
      },
    },
  ];

  const pageVisits = await Visitor.aggregate(pipeline);

  // Process results to extract geographic and event insights
  const locationInsights: {
    [key: string]: {
      visitors: Set<string>;
      conversions: number;
      pages: Set<string>;
    };
  } = {};
  const eventInsights: {
    [key: string]: {
      visitors: Set<string>;
      conversions: number;
      pages: Set<string>;
    };
  } = {};

  pageVisits.forEach((visit) => {
    if (!visit.url || !visit.visitorId) return; // Skip invalid entries

    const geoInterests = extractGeographicInterest(visit.url);
    const eventInterests = extractEventTypeInterest(visit.url);

    geoInterests.forEach((location) => {
      if (!locationInsights[location]) {
        locationInsights[location] = {
          visitors: new Set(),
          conversions: 0,
          pages: new Set(),
        };
      }
      locationInsights[location].visitors.add(visit.visitorId);
      locationInsights[location].pages.add(visit.url);
      if (visit.hasConversion) {
        locationInsights[location].conversions++;
      }
    });

    eventInterests.forEach((eventType) => {
      if (!eventInsights[eventType]) {
        eventInsights[eventType] = {
          visitors: new Set(),
          conversions: 0,
          pages: new Set(),
        };
      }
      eventInsights[eventType].visitors.add(visit.visitorId);
      eventInsights[eventType].pages.add(visit.url);
      if (visit.hasConversion) {
        eventInsights[eventType].conversions++;
      }
    });
  });

  const locationInterests = Object.entries(locationInsights)
    .map(([location, data]) => ({
      location,
      visitors: data.visitors.size,
      conversionRate:
        data.visitors.size > 0
          ? (data.conversions / data.visitors.size) * 100
          : 0,
      topPages: Array.from(data.pages).slice(0, 5),
    }))
    .sort((a, b) => b.visitors - a.visitors);

  const eventTypeInterests = Object.entries(eventInsights)
    .map(([eventType, data]) => ({
      eventType,
      visitors: data.visitors.size,
      conversionRate:
        data.visitors.size > 0
          ? (data.conversions / data.visitors.size) * 100
          : 0,
      topPages: Array.from(data.pages).slice(0, 5),
    }))
    .sort((a, b) => b.visitors - a.visitors);

  return {
    locationInterests,
    eventTypeInterests,
  };
}

/**
 * Get page category performance summary
 * Handles both legacy and new visitor document structures
 */
export async function getPageCategoryPerformance(dateRange?: {
  start: Date;
  end: Date;
}): Promise<
  Array<{
    category: string;
    visits: number;
    uniqueVisitors: number;
    conversionRate: number;
    bounceRate: number;
    topPages: string[];
  }>
> {
  try {
    const landingPages = await getLandingPagePerformance(100, dateRange);

    const categoryMap: {
      [key: string]: {
        visits: number;
        uniqueVisitors: number;
        conversions: number;
        bounces: number;
        pages: Array<{ url: string; visits: number }>;
      };
    } = {};

    landingPages.forEach((page) => {
      if (!categoryMap[page.category]) {
        categoryMap[page.category] = {
          visits: 0,
          uniqueVisitors: 0,
          conversions: 0,
          bounces: 0,
          pages: [],
        };
      }

      const category = categoryMap[page.category];
      category.visits += page.visits;
      category.uniqueVisitors += page.uniqueVisitors;
      category.conversions += Math.round(
        (page.conversionRate / 100) * page.visits,
      );
      category.bounces += Math.round((page.bounceRate / 100) * page.visits);
      category.pages.push({ url: page.url, visits: page.visits });
    });

    return Object.entries(categoryMap)
      .map(([category, data]) => ({
        category,
        visits: data.visits,
        uniqueVisitors: data.uniqueVisitors,
        conversionRate:
          data.visits > 0 ? (data.conversions / data.visits) * 100 : 0,
        bounceRate: data.visits > 0 ? (data.bounces / data.visits) * 100 : 0,
        topPages: data.pages
          .sort((a, b) => b.visits - a.visits)
          .slice(0, 5)
          .map((p) => p.url),
      }))
      .sort((a, b) => b.visits - a.visits);
  } catch (error) {
    console.error("Error in getPageCategoryPerformance:", error);
    throw error;
  }
}
