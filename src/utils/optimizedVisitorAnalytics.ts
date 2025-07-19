import { IVisitor } from "@/types/visitor";
import Visitor from "@/models/Visitor";
import PageAnalytics from "@/models/PageAnalytics";
import {
  categorizePage,
  extractGeographicInterest,
  extractEventTypeInterest,
} from "./pageCategorizationService";

/**
 * Optimized visitor analytics using MongoDB aggregation pipelines
 * Designed to handle large datasets efficiently
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
 */
export async function getOptimizedEngagementMetrics(dateRange?: {
  start: Date;
  end: Date;
}): Promise<OptimizedEngagementMetrics> {
  const matchStage: any = {};

  if (dateRange) {
    matchStage.lastVisit = {
      $gte: dateRange.start,
      $lte: dateRange.end,
    };
  }

  // Exclude admin visitors
  matchStage.visitedPages = {
    $not: {
      $elemMatch: {
        url: /^\/admin/,
      },
    },
  };

  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalVisitors: { $sum: 1 },
        returningVisitors: {
          $sum: { $cond: [{ $gt: ["$visitCount", 1] }, 1, 0] },
        },
        totalVisits: { $sum: "$visitCount" },
        totalPageViews: { $sum: { $size: "$visitedPages" } },
        totalSessionDuration: {
          $sum: {
            $reduce: {
              input: "$sessions",
              initialValue: 0,
              in: { $add: ["$$value", { $ifNull: ["$$this.duration", 0] }] },
            },
          },
        },
        bouncedSessions: {
          $sum: {
            $size: {
              $filter: {
                input: "$sessions",
                cond: { $eq: ["$$this.bounced", true] },
              },
            },
          },
        },
        totalSessions: {
          $sum: { $size: "$sessions" },
        },
      },
    },
  ];

  const [metrics] = await Visitor.aggregate(pipeline);

  // Get top landing pages
  const landingPagesPipeline: any[] = [
    { $match: matchStage },
    { $unwind: "$visitedPages" },
    {
      $group: {
        _id: "$landingPage",
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
      visitors: page.visitors,
      category: category.category,
      subcategory: category.subcategory,
    };
  });

  // Get top exit pages
  const exitPagesPipeline: any[] = [
    { $match: matchStage },
    { $unwind: "$sessions" },
    { $match: { "sessions.exitPage": { $exists: true } } },
    {
      $group: {
        _id: "$sessions.exitPage",
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
      exits: page.exits,
    })),
  };
}

/**
 * Get landing page performance metrics
 */
export async function getLandingPagePerformance(
  limit: number = 20,
  dateRange?: { start: Date; end: Date },
): Promise<LandingPagePerformance[]> {
  const matchStage: any = {};

  if (dateRange) {
    matchStage.lastVisit = {
      $gte: dateRange.start,
      $lte: dateRange.end,
    };
  }

  // Exclude admin visitors
  matchStage.visitedPages = {
    $not: {
      $elemMatch: {
        url: /^\/admin/,
      },
    },
  };

  const pipeline: any[] = [
    { $match: matchStage },
    { $unwind: "$visitedPages" },
    {
      $group: {
        _id: "$visitedPages.url",
        visits: { $sum: 1 },
        uniqueVisitors: { $addToSet: "$visitorId" },
        totalDuration: { $sum: { $ifNull: ["$visitedPages.duration", 0] } },
        devices: { $push: "$device" },
        conversions: {
          $sum: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ["$conversionEvents", []] } }, 0] },
              1,
              0,
            ],
          },
        },
        bounces: {
          $sum: {
            $cond: [{ $eq: [{ $size: "$visitedPages" }, 1] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        url: "$_id",
        visits: 1,
        uniqueVisitors: { $size: "$uniqueVisitors" },
        averageTimeOnPage: {
          $cond: [
            { $gt: ["$visits", 0] },
            { $divide: ["$totalDuration", "$visits"] },
            0,
          ],
        },
        conversionRate: {
          $cond: [
            { $gt: ["$visits", 0] },
            { $multiply: [{ $divide: ["$conversions", "$visits"] }, 100] },
            0,
          ],
        },
        bounceRate: {
          $cond: [
            { $gt: ["$visits", 0] },
            { $multiply: [{ $divide: ["$bounces", "$visits"] }, 100] },
            0,
          ],
        },
        deviceBreakdown: {
          Mobile: {
            $size: {
              $filter: {
                input: "$devices",
                cond: { $eq: ["$$this", "Mobile"] },
              },
            },
          },
          Desktop: {
            $size: {
              $filter: {
                input: "$devices",
                cond: { $eq: ["$$this", "Desktop"] },
              },
            },
          },
          Tablet: {
            $size: {
              $filter: {
                input: "$devices",
                cond: { $eq: ["$$this", "Tablet"] },
              },
            },
          },
        },
      },
    },
    { $sort: { visits: -1 } },
    { $limit: limit },
  ];

  const results = await Visitor.aggregate(pipeline);

  return results.map((result) => {
    const category = categorizePage(result.url);
    return {
      url: result.url,
      category: category.category,
      subcategory: category.subcategory,
      visits: result.visits,
      uniqueVisitors: result.uniqueVisitors,
      bounceRate: result.bounceRate,
      averageTimeOnPage: result.averageTimeOnPage,
      conversionRate: result.conversionRate,
      deviceBreakdown: result.deviceBreakdown,
    };
  });
}

/**
 * Get geographic and event type insights
 */
export async function getGeographicInsights(dateRange?: {
  start: Date;
  end: Date;
}): Promise<GeographicInsights> {
  const matchStage: any = {};

  if (dateRange) {
    matchStage.lastVisit = {
      $gte: dateRange.start,
      $lte: dateRange.end,
    };
  }

  // Exclude admin visitors
  matchStage.visitedPages = {
    $not: {
      $elemMatch: {
        url: /^\/admin/,
      },
    },
  };

  const pipeline: any[] = [
    { $match: matchStage },
    { $unwind: "$visitedPages" },
    {
      $project: {
        visitorId: 1,
        url: "$visitedPages.url",
        hasConversion: {
          $gt: [{ $size: { $ifNull: ["$conversionEvents", []] } }, 0],
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
}
