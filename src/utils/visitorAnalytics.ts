import { IVisitor } from "@/types/visitor";

/**
 * Calculate the percentage of returning visitors
 */
export function calculateReturningRate(visitors: IVisitor[]): number {
  if (visitors.length === 0) return 0;
  const returningVisitors = visitors.filter((v) => v.visitCount > 1).length;
  return (returningVisitors / visitors.length) * 100;
}

/**
 * Calculate the average time between first and last visit for returning visitors
 */
export function calculateAverageReturnTime(visitors: IVisitor[]): number {
  const returningVisitors = visitors.filter((v) => v.visitCount > 1);
  if (returningVisitors.length === 0) return 0;

  const totalDays = returningVisitors.reduce((sum, visitor) => {
    const firstVisit = new Date(visitor.firstVisit).getTime();
    const lastVisit = new Date(visitor.lastVisit).getTime();
    const daysDifference = (lastVisit - firstVisit) / (1000 * 60 * 60 * 24);
    return sum + daysDifference;
  }, 0);

  return totalDays / returningVisitors.length;
}

/**
 * Group visitors by device type
 */
export function getDeviceBreakdown(visitors: IVisitor[]): {
  Mobile: number;
  Desktop: number;
  Tablet: number;
  percentages: {
    Mobile: number;
    Desktop: number;
    Tablet: number;
  };
} {
  const result = {
    Mobile: 0,
    Desktop: 0,
    Tablet: 0,
    percentages: {
      Mobile: 0,
      Desktop: 0,
      Tablet: 0,
    },
  };

  if (visitors.length === 0) return result;

  visitors.forEach((visitor) => {
    if (visitor.device === "Mobile") result.Mobile++;
    else if (visitor.device === "Desktop") result.Desktop++;
    else if (visitor.device === "Tablet") result.Tablet++;
  });

  // Calculate percentages
  result.percentages.Mobile = (result.Mobile / visitors.length) * 100;
  result.percentages.Desktop = (result.Desktop / visitors.length) * 100;
  result.percentages.Tablet = (result.Tablet / visitors.length) * 100;

  return result;
}

/**
 * Group visitors by referrer source
 */
export function getReferrerBreakdown(visitors: IVisitor[]): {
  [key: string]: number;
} {
  const referrers: { [key: string]: number } = {};

  visitors.forEach((visitor) => {
    const referrer = visitor.referrer || "Direct";

    // Categorize referrers
    let category = "Other";

    if (referrer === "Direct" || referrer === "") {
      category = "Direct";
    } else if (referrer.includes("google")) {
      category = "Google";
    } else if (referrer.includes("facebook") || referrer.includes("fb.com")) {
      category = "Facebook";
    } else if (referrer.includes("instagram")) {
      category = "Instagram";
    } else if (referrer.includes("twitter") || referrer.includes("x.com")) {
      category = "Twitter";
    } else if (referrer.includes("bing")) {
      category = "Bing";
    } else if (referrer.includes("yahoo")) {
      category = "Yahoo";
    } else if (referrer.includes("pinterest")) {
      category = "Pinterest";
    }

    referrers[category] = (referrers[category] || 0) + 1;
  });

  return referrers;
}

/**
 * Get the most visited pages
 */
export function getMostVisitedPages(
  visitors: IVisitor[],
  limit: number = 5,
): {
  page: string;
  visits: number;
  percentage: number;
}[] {
  const pageVisits: { [key: string]: number } = {};
  let totalPageVisits = 0;

  // Count visits for each page
  visitors.forEach((visitor) => {
    visitor.visitedPages.forEach((page: { url: string; timestamp: Date }) => {
      const url = page.url;
      pageVisits[url] = (pageVisits[url] || 0) + 1;
      totalPageVisits++;
    });
  });

  // Convert to array and sort
  const sortedPages = Object.entries(pageVisits)
    .map(([page, visits]) => ({
      page,
      visits,
      percentage: (visits / totalPageVisits) * 100,
    }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, limit);

  return sortedPages;
}

/**
 * Get visitors with multiple visits to the same page (high intent)
 */
export function getHighIntentVisitors(visitors: IVisitor[]): IVisitor[] {
  return visitors.filter((visitor) => {
    // Create a map of page visits
    const pageVisits: { [key: string]: number } = {};

    visitor.visitedPages.forEach((page: { url: string; timestamp: Date }) => {
      const url = page.url;
      pageVisits[url] = (pageVisits[url] || 0) + 1;
    });

    // Check if any page has been visited more than once
    return Object.values(pageVisits).some((count) => count > 1);
  });
}

/**
 * Get visitors with potential suspicious activity
 * (multiple visits from different locations with same fingerprint)
 */
export function getSuspiciousVisitors(visitors: IVisitor[]): IVisitor[] {
  // Group visitors by fingerprint
  const visitorsByFingerprint: { [key: string]: IVisitor[] } = {};

  visitors.forEach((visitor) => {
    const fingerprint = visitor.visitorId;
    if (!visitorsByFingerprint[fingerprint]) {
      visitorsByFingerprint[fingerprint] = [];
    }
    visitorsByFingerprint[fingerprint].push(visitor);
  });

  // Find fingerprints with multiple locations
  const suspicious: IVisitor[] = [];

  Object.values(visitorsByFingerprint).forEach((visitorGroup) => {
    if (visitorGroup.length > 1) {
      // Check if there are different IP addresses or locations
      const uniqueIPs = new Set(
        visitorGroup.map((v) => v.ipAddress).filter(Boolean),
      );
      const uniqueLocations = new Set(
        visitorGroup
          .filter((v) => v.location && v.location.country)
          .map(
            (v) =>
              `${v.location?.country}-${v.location?.region}-${v.location?.city}`,
          ),
      );

      if (uniqueIPs.size > 1 || uniqueLocations.size > 1) {
        suspicious.push(...visitorGroup);
      }
    }
  });

  return suspicious;
}

/**
 * Get browser breakdown
 */
export function getBrowserBreakdown(visitors: IVisitor[]): {
  [key: string]: number;
} {
  const browsers: { [key: string]: number } = {};

  visitors.forEach((visitor) => {
    if (visitor.browser && visitor.browser.name) {
      const browserName = visitor.browser.name;
      browsers[browserName] = (browsers[browserName] || 0) + 1;
    }
  });

  return browsers;
}

/**
 * Get OS breakdown
 */
export function getOSBreakdown(visitors: IVisitor[]): {
  [key: string]: number;
} {
  const operatingSystems: { [key: string]: number } = {};

  visitors.forEach((visitor) => {
    if (visitor.os && visitor.os.name) {
      const osName = visitor.os.name;
      operatingSystems[osName] = (operatingSystems[osName] || 0) + 1;
    }
  });

  return operatingSystems;
}

/**
 * Get location breakdown
 */
export function getLocationBreakdown(visitors: IVisitor[]): {
  countries: { [key: string]: number };
  cities: { [key: string]: number };
} {
  const countries: { [key: string]: number } = {};
  const cities: { [key: string]: number } = {};

  visitors.forEach((visitor) => {
    if (visitor.location) {
      if (visitor.location.country) {
        const country = visitor.location.country;
        countries[country] = (countries[country] || 0) + 1;
      }

      if (visitor.location.city) {
        const city = visitor.location.city;
        cities[city] = (cities[city] || 0) + 1;
      }
    }
  });

  return { countries, cities };
}

/**
 * Calculate engagement metrics
 */
export function getEngagementMetrics(visitors: IVisitor[]): {
  averagePagesPerVisit: number;
  averageVisitCount: number;
  returningRate: number;
} {
  if (visitors.length === 0) {
    return {
      averagePagesPerVisit: 0,
      averageVisitCount: 0,
      returningRate: 0,
    };
  }

  const totalPages = visitors.reduce(
    (sum, visitor) => sum + visitor.visitedPages.length,
    0,
  );
  const totalVisits = visitors.reduce(
    (sum, visitor) => sum + visitor.visitCount,
    0,
  );
  const returningVisitors = visitors.filter((v) => v.visitCount > 1).length;

  return {
    averagePagesPerVisit: totalPages / totalVisits,
    averageVisitCount: totalVisits / visitors.length,
    returningRate: (returningVisitors / visitors.length) * 100,
  };
}

/**
 * Get time-based patterns (hour of day, day of week)
 */
export function getTimePatterns(visitors: IVisitor[]): {
  hourOfDay: number[];
  dayOfWeek: number[];
} {
  // Initialize arrays with zeros
  const hourOfDay = Array(24).fill(0);
  const dayOfWeek = Array(7).fill(0);

  visitors.forEach((visitor) => {
    visitor.visitedPages.forEach((page: { url: string; timestamp: Date }) => {
      if (page.timestamp) {
        const date = new Date(page.timestamp);
        const hour = date.getHours();
        const day = date.getDay();

        hourOfDay[hour]++;
        dayOfWeek[day]++;
      }
    });
  });

  return { hourOfDay, dayOfWeek };
}

/**
 * Get network speed breakdown
 */
export function getNetworkBreakdown(visitors: IVisitor[]): {
  connectionTypes: { [key: string]: number };
  effectiveTypes: { [key: string]: number };
} {
  const connectionTypes: { [key: string]: number } = {};
  const effectiveTypes: { [key: string]: number } = {};

  visitors.forEach((visitor) => {
    if (visitor.network) {
      if (visitor.network.connectionType) {
        const type = visitor.network.connectionType;
        connectionTypes[type] = (connectionTypes[type] || 0) + 1;
      }

      if (visitor.network.effectiveType) {
        const type = visitor.network.effectiveType;
        effectiveTypes[type] = (effectiveTypes[type] || 0) + 1;
      }
    }
  });

  return { connectionTypes, effectiveTypes };
}
