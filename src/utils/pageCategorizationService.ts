/**
 * Service for categorizing pages and extracting interest data
 * Optimized for the new landing pages structure
 */

export interface PageCategory {
  category: "location" | "event" | "product" | "general" | "admin";
  subcategory?: string;
  interestTags: string[];
}

/**
 * Categorize a page URL and extract interest data
 */
export function categorizePage(url: string): PageCategory {
  // Remove query parameters and normalize URL
  const cleanUrl = url.split("?")[0].toLowerCase();
  const pathSegments = cleanUrl.split("/").filter(Boolean);

  // Admin pages
  if (cleanUrl.includes("/admin")) {
    return {
      category: "admin",
      subcategory: pathSegments[1] || "dashboard",
      interestTags: [],
    };
  }

  // Location-based landing pages
  const locationPages = [
    "boerne",
    "converse",
    "seguin",
    "schertz",
    "alamo-heights",
    "stone-oak",
    "hollywood-park",
    "bulverde",
  ];

  const locationMatch = pathSegments.find((segment) =>
    locationPages.includes(segment),
  );
  if (locationMatch) {
    return {
      category: "location",
      subcategory: locationMatch,
      interestTags: [
        `location:${locationMatch}`,
        "bounce-house-rental",
        "local-service",
      ],
    };
  }

  // Event-based landing pages
  const eventPages = [
    "church-events",
    "fundraisers",
    "holiday-parties",
    "community-gatherings",
    "graduation-parties",
    "backyard-parties",
    "birthday-parties",
    "school-events",
    "corporate-events",
  ];

  const eventMatch = pathSegments.find((segment) =>
    eventPages.includes(segment),
  );
  if (eventMatch) {
    return {
      category: "event",
      subcategory: eventMatch,
      interestTags: [`event:${eventMatch}`, "party-planning", "event-rental"],
    };
  }

  // Product pages
  if (cleanUrl.includes("/products/")) {
    const productSlug = pathSegments[pathSegments.indexOf("products") + 1];
    const productTags = ["product-view"];

    // Add specific product category tags
    if (productSlug) {
      if (productSlug.includes("water") || productSlug.includes("slide")) {
        productTags.push("water-attraction");
      }
      if (productSlug.includes("bounce") || productSlug.includes("jump")) {
        productTags.push("bounce-house");
      }
      if (productSlug.includes("combo")) {
        productTags.push("combo-unit");
      }
      if (productSlug.includes("obstacle")) {
        productTags.push("obstacle-course");
      }
    }

    return {
      category: "product",
      subcategory: productSlug || "unknown",
      interestTags: productTags,
    };
  }

  // Special pages
  const specialPages: { [key: string]: string[] } = {
    "/contact": ["contact", "inquiry"],
    "/about": ["about", "company-info"],
    "/faq": ["faq", "support"],
    "/privacy-policy": ["legal"],
    "/tos": ["legal"],
    "/blogs": ["blog", "content"],
    "/water-slides": ["water-attraction", "product-category"],
    "/party-packages": ["packages", "bundle-deals"],
  };

  for (const [path, tags] of Object.entries(specialPages)) {
    if (cleanUrl === path || cleanUrl.startsWith(path + "/")) {
      return {
        category: "general",
        subcategory: path.replace("/", ""),
        interestTags: tags,
      };
    }
  }

  // Default categorization
  return {
    category: "general",
    subcategory: pathSegments[0] || "home",
    interestTags: pathSegments.length > 0 ? [pathSegments[0]] : ["home"],
  };
}

/**
 * Extract geographic interest from location pages
 */
export function extractGeographicInterest(url: string): string[] {
  const category = categorizePage(url);

  if (category.category === "location" && category.subcategory) {
    const locationMap: { [key: string]: string[] } = {
      boerne: ["boerne", "kendall-county", "hill-country"],
      converse: ["converse", "bexar-county", "northeast-sa"],
      seguin: ["seguin", "guadalupe-county", "east-sa"],
      schertz: ["schertz", "guadalupe-county", "northeast-sa"],
      "alamo-heights": ["alamo-heights", "bexar-county", "central-sa"],
      "stone-oak": ["stone-oak", "bexar-county", "north-sa"],
      "hollywood-park": ["hollywood-park", "bexar-county", "north-sa"],
      bulverde: ["bulverde", "comal-county", "hill-country"],
    };

    return locationMap[category.subcategory] || [category.subcategory];
  }

  return [];
}

/**
 * Extract event type interest from event pages
 */
export function extractEventTypeInterest(url: string): string[] {
  const category = categorizePage(url);

  if (category.category === "event" && category.subcategory) {
    const eventMap: { [key: string]: string[] } = {
      "church-events": ["religious", "community", "family-friendly"],
      fundraisers: ["charity", "community", "non-profit"],
      "holiday-parties": ["seasonal", "celebration", "family"],
      "community-gatherings": ["community", "social", "neighborhood"],
      "graduation-parties": ["milestone", "celebration", "academic"],
      "backyard-parties": ["casual", "residential", "family"],
      "birthday-parties": ["celebration", "milestone", "family"],
      "school-events": ["educational", "children", "institutional"],
      "corporate-events": ["business", "professional", "team-building"],
    };

    return eventMap[category.subcategory] || [category.subcategory];
  }

  return [];
}

/**
 * Get all possible interest categories for analytics
 */
export function getAllInterestCategories(): string[] {
  return [
    // Geographic
    "boerne",
    "converse",
    "seguin",
    "schertz",
    "alamo-heights",
    "stone-oak",
    "hollywood-park",
    "bulverde",
    "kendall-county",
    "bexar-county",
    "guadalupe-county",
    "comal-county",
    "hill-country",
    "northeast-sa",
    "east-sa",
    "central-sa",
    "north-sa",

    // Event Types
    "religious",
    "charity",
    "seasonal",
    "community",
    "milestone",
    "celebration",
    "family",
    "academic",
    "casual",
    "residential",
    "educational",
    "children",
    "institutional",
    "business",
    "professional",

    // Product Types
    "water-attraction",
    "bounce-house",
    "combo-unit",
    "obstacle-course",
    "product-view",
    "party-planning",
    "event-rental",

    // General
    "contact",
    "inquiry",
    "about",
    "company-info",
    "faq",
    "support",
    "legal",
    "blog",
    "content",
    "packages",
    "bundle-deals",
    "home",
  ];
}
