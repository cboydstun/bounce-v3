/**
 * Types for optimized visitor analytics
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

export interface PageCategoryPerformance {
  category: string;
  visits: number;
  uniqueVisitors: number;
  conversionRate: number;
  bounceRate: number;
  topPages: string[];
}
