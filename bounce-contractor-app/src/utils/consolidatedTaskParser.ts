/**
 * Utility functions for parsing consolidated delivery task data
 */

export interface DeliveryItem {
  quantity: number;
  name: string;
  orderNumber: string;
}

export interface DeliveryStop {
  stopNumber: number;
  address: string;
  estimatedTime: string;
  customerName: string;
  orderNumber: string;
  items: string;
}

export interface RouteMetadata {
  routeSessionId?: string;
  totalStops: number;
  totalDistance: string;
  totalDuration: string;
  startTime?: string;
  endTime?: string;
  totalOrderValue?: string;
}

export interface ParsedConsolidatedTask {
  isConsolidated: boolean;
  items: DeliveryItem[];
  deliverySchedule: DeliveryStop[];
  routeMetadata: RouteMetadata;
  rawSections: {
    items?: string;
    schedule?: string;
    summary?: string;
    metadata?: string;
  };
}

/**
 * Detect if a task is a consolidated delivery route
 */
export const isConsolidatedTask = (task: any): boolean => {
  if (!task) {
    console.log("🔍 isConsolidatedTask: No task provided");
    return false;
  }

  console.log("🔍 isConsolidatedTask: Checking task:", {
    id: task.id,
    title: task.title,
    mobileTitle: task.mobileTitle,
    type: task.type,
    isRouteTask: task.isRouteTask,
    descriptionLength: task.description?.length,
    descriptionPreview: task.description?.substring(0, 100) + "...",
    hasRouteDetails: !!task.routeDetails,
    customersCount: task.customers?.length,
  });

  // PRIORITY 1: Check for mobile route indicators (from backend transformation)
  const isMobileRoute =
    task.isRouteTask ||
    task.mobileTitle?.includes("Multi-Stop Route") ||
    task.routeDetails?.totalStops > 1 ||
    (task.customers && task.customers.length > 1);

  if (isMobileRoute) {
    console.log("✅ Consolidated task detected by mobile route indicators:", {
      isRouteTask: task.isRouteTask,
      mobileTitle: task.mobileTitle,
      totalStops: task.routeDetails?.totalStops,
      customersCount: task.customers?.length,
    });
    return true;
  }

  // PRIORITY 2: Check title pattern for consolidated tasks
  const titlePattern = /Delivery Route - Driver \d+ - \d+ Stops/i;
  const titleMatches = titlePattern.test(task.title || "");
  console.log("🔍 Title pattern match:", titleMatches, "Title:", task.title);

  if (titleMatches) {
    console.log("✅ Consolidated task detected by title pattern");
    return true;
  }

  // PRIORITY 3: Check description for consolidated markers (emoji sections)
  const description = task.description || "";
  const hasItemsSection = description.includes("📦 Items to Deliver:");
  const hasScheduleSection = description.includes("📍 Delivery Schedule:");
  const hasSummarySection = description.includes("📊 Route Summary:");
  const hasCompleteRoute = description.includes("Complete delivery route with");

  console.log("🔍 Description markers:", {
    hasItemsSection,
    hasScheduleSection,
    hasSummarySection,
    hasCompleteRoute,
    descriptionStart: description.substring(0, 50),
  });

  const isConsolidated =
    (hasItemsSection && hasScheduleSection && hasSummarySection) ||
    hasCompleteRoute;

  if (isConsolidated) {
    console.log("✅ Consolidated task detected by description markers");
  } else {
    console.log("❌ Not a consolidated task");
  }

  return isConsolidated;
};

/**
 * Parse consolidated task description into structured data
 */
export const parseConsolidatedTask = (task: any): ParsedConsolidatedTask => {
  const result: ParsedConsolidatedTask = {
    isConsolidated: false,
    items: [],
    deliverySchedule: [],
    routeMetadata: {
      totalStops: 0,
      totalDistance: "",
      totalDuration: "",
    },
    rawSections: {},
  };

  if (!task || !isConsolidatedTask(task)) {
    console.log(
      "🔍 parseConsolidatedTask: Task is not consolidated, returning empty result",
    );
    return result;
  }

  console.log("🔍 parseConsolidatedTask: Starting to parse consolidated task");
  result.isConsolidated = true;
  const description = task.description || "";

  try {
    // PRIORITY 1: Try to use mobile route data if available (from backend transformation)
    if (task.routeDetails || task.customers) {
      console.log("🔍 Using mobile route data for parsing");

      // Use route details from backend transformation
      if (task.routeDetails) {
        result.routeMetadata = {
          totalStops: task.routeDetails.totalStops || 0,
          totalDistance: task.routeDetails.estimatedDistance || "",
          totalDuration: task.routeDetails.estimatedDuration || "",
          startTime: task.routeDetails.startTime,
          endTime: task.routeDetails.endTime,
          routeSessionId: task.routeDetails.routeSessionId,
        };
        console.log("🔍 Used route details:", result.routeMetadata);
      }

      // Convert customers to delivery schedule
      if (task.customers && task.customers.length > 0) {
        result.deliverySchedule = task.customers.map(
          (customer: any, index: number) => ({
            stopNumber: customer.stopNumber || index + 1,
            address: customer.address || "Address not specified",
            estimatedTime: customer.estimatedTime || "TBD",
            customerName: customer.name || "Customer",
            orderNumber: customer.orderNumber || "",
            items: customer.items || "Items not specified",
          }),
        );
        console.log(
          "🔍 Converted customers to delivery schedule:",
          result.deliverySchedule,
        );
      }

      // Create items from customers data
      if (task.customers && task.customers.length > 0) {
        result.items = task.customers.flatMap((customer: any) => {
          if (customer.items && typeof customer.items === "string") {
            // Try to parse items from string like "1x Blue Double Lane Waterslide"
            const itemMatches = customer.items.matchAll(/(\d+)x\s*([^,]+)/g);
            const items = [];
            for (const match of itemMatches) {
              items.push({
                quantity: parseInt(match[1], 10),
                name: match[2].trim(),
                orderNumber: customer.orderNumber || "",
              });
            }
            return items;
          }
          return [];
        });
        console.log("🔍 Extracted items from customers:", result.items);
      }
    }

    // PRIORITY 2: Parse emoji-formatted description if mobile data is insufficient
    if (result.items.length === 0 || result.deliverySchedule.length === 0) {
      console.log("🔍 Falling back to description parsing");

      // Split description into sections
      const sections = description.split(/(?=📦|📍|📊|---)/);
      console.log(
        "🔍 parseConsolidatedTask: Split into sections:",
        sections.length,
      );

      for (const section of sections) {
        if (section.includes("📦 Items to Deliver:")) {
          console.log("🔍 Found items section");
          result.rawSections.items = section;
          const parsedItems = parseItemsSection(section);
          if (parsedItems.length > 0) {
            result.items = parsedItems;
            console.log("🔍 Parsed items from description:", result.items);
          }
        } else if (section.includes("📍 Delivery Schedule:")) {
          console.log("🔍 Found schedule section");
          result.rawSections.schedule = section;
          const parsedSchedule = parseScheduleSection(section);
          if (parsedSchedule.length > 0) {
            result.deliverySchedule = parsedSchedule;
            console.log(
              "🔍 Parsed schedule from description:",
              result.deliverySchedule,
            );
          }
        } else if (section.includes("📊 Route Summary:")) {
          console.log("🔍 Found summary section");
          result.rawSections.summary = section;
          const summaryMetadata = parseRouteSummary(section);
          Object.assign(result.routeMetadata, summaryMetadata);
          console.log("🔍 Parsed summary metadata:", summaryMetadata);
        } else if (section.includes("--- Route Metadata ---")) {
          console.log("🔍 Found metadata section");
          result.rawSections.metadata = section;
          const routeMetadata = parseRouteMetadata(section);
          Object.assign(result.routeMetadata, routeMetadata);
          console.log("🔍 Parsed route metadata:", routeMetadata);
        }
      }
    }

    // FALLBACK: Extract total stops from various sources
    if (result.routeMetadata.totalStops === 0) {
      // Try mobile title first
      if (task.mobileTitle) {
        const mobileMatch = task.mobileTitle.match(
          /Multi-Stop Route \((\d+) customers\)/,
        );
        if (mobileMatch) {
          result.routeMetadata.totalStops = parseInt(mobileMatch[1], 10);
          console.log(
            "🔍 Extracted stops from mobile title:",
            result.routeMetadata.totalStops,
          );
        }
      }

      // Try original title
      if (result.routeMetadata.totalStops === 0) {
        const titleMatch = task.title?.match(/(\d+) Stops/);
        if (titleMatch) {
          result.routeMetadata.totalStops = parseInt(titleMatch[1], 10);
          console.log(
            "🔍 Extracted stops from title:",
            result.routeMetadata.totalStops,
          );
        }
      }

      // Try description
      if (result.routeMetadata.totalStops === 0) {
        const descMatch = description.match(
          /Complete delivery route with (\d+) stops/,
        );
        if (descMatch) {
          result.routeMetadata.totalStops = parseInt(descMatch[1], 10);
          console.log(
            "🔍 Extracted stops from description:",
            result.routeMetadata.totalStops,
          );
        }
      }

      // Use delivery schedule length as final fallback
      if (
        result.routeMetadata.totalStops === 0 &&
        result.deliverySchedule.length > 0
      ) {
        result.routeMetadata.totalStops = result.deliverySchedule.length;
        console.log(
          "🔍 Using delivery schedule length as stops:",
          result.routeMetadata.totalStops,
        );
      }
    }

    console.log("🔍 parseConsolidatedTask: Final result:", {
      isConsolidated: result.isConsolidated,
      itemsCount: result.items.length,
      stopsCount: result.deliverySchedule.length,
      totalStops: result.routeMetadata.totalStops,
      hasDistance: !!result.routeMetadata.totalDistance,
      hasDuration: !!result.routeMetadata.totalDuration,
    });
  } catch (error) {
    console.error("❌ Error parsing consolidated task:", error);
  }

  return result;
};

/**
 * Parse the items section
 */
const parseItemsSection = (section: string): DeliveryItem[] => {
  const items: DeliveryItem[] = [];
  const lines = section.split("\n");

  for (const line of lines) {
    // Match pattern: • 1x Blue Double Lane Waterslide (BB-2025-0234)
    const match = line.match(/•\s*(\d+)x\s*(.+?)\s*\(([^)]+)\)/);
    if (match) {
      items.push({
        quantity: parseInt(match[1], 10),
        name: match[2].trim(),
        orderNumber: match[3].trim(),
      });
    }
  }

  return items;
};

/**
 * Parse the delivery schedule section
 */
const parseScheduleSection = (section: string): DeliveryStop[] => {
  const stops: DeliveryStop[] = [];
  const lines = section.split("\n");

  let currentStop: Partial<DeliveryStop> | null = null;

  for (const line of lines) {
    // Match main stop line: 1. 5610 Tempest Court, Bulverde, Texas 78261 (08:00 AM)
    const stopMatch = line.match(/^(\d+)\.\s*(.+?)\s*\(([^)]+)\)/);
    if (stopMatch) {
      // Save previous stop if exists
      if (currentStop && currentStop.stopNumber) {
        stops.push(currentStop as DeliveryStop);
      }

      currentStop = {
        stopNumber: parseInt(stopMatch[1], 10),
        address: stopMatch[2].trim(),
        estimatedTime: stopMatch[3].trim(),
        customerName: "",
        orderNumber: "",
        items: "",
      };
    }
    // Match customer line: Customer: Unknown Customer | Order: BB-2025-0234
    else if (line.includes("Customer:") && currentStop) {
      const customerMatch = line.match(
        /Customer:\s*([^|]+)\s*\|\s*Order:\s*(.+)/,
      );
      if (customerMatch) {
        currentStop.customerName = customerMatch[1].trim();
        currentStop.orderNumber = customerMatch[2].trim();
      }
    }
    // Match items line: Items: 1x Blue Double Lane Waterslide
    else if (line.includes("Items:") && currentStop) {
      const itemsMatch = line.match(/Items:\s*(.+)/);
      if (itemsMatch) {
        currentStop.items = itemsMatch[1].trim();
      }
    }
  }

  // Don't forget the last stop
  if (currentStop && currentStop.stopNumber) {
    stops.push(currentStop as DeliveryStop);
  }

  return stops;
};

/**
 * Parse the route summary section
 */
const parseRouteSummary = (section: string): Partial<RouteMetadata> => {
  const metadata: Partial<RouteMetadata> = {};
  const lines = section.split("\n");

  for (const line of lines) {
    if (line.includes("Total Distance:")) {
      const match = line.match(/Total Distance:\s*(.+)/);
      if (match) metadata.totalDistance = match[1].trim();
    } else if (line.includes("Estimated Duration:")) {
      const match = line.match(/Estimated Duration:\s*(.+)/);
      if (match) metadata.totalDuration = match[1].trim();
    } else if (line.includes("Start Time:")) {
      const match = line.match(/Start Time:\s*(.+)/);
      if (match) metadata.startTime = match[1].trim();
    } else if (line.includes("End Time:")) {
      const match = line.match(/End Time:\s*(.+)/);
      if (match) metadata.endTime = match[1].trim();
    } else if (line.includes("Total Order Value:")) {
      const match = line.match(/Total Order Value:\s*(.+)/);
      if (match) metadata.totalOrderValue = match[1].trim();
    }
  }

  return metadata;
};

/**
 * Parse the route metadata section
 */
const parseRouteMetadata = (section: string): Partial<RouteMetadata> => {
  const metadata: Partial<RouteMetadata> = {};
  const lines = section.split("\n");

  for (const line of lines) {
    if (line.includes("Route Session:")) {
      const match = line.match(/Route Session:\s*(.+)/);
      if (match) metadata.routeSessionId = match[1].trim();
    } else if (line.includes("Stops:")) {
      const match = line.match(/Stops:\s*(\d+)/);
      if (match) metadata.totalStops = parseInt(match[1], 10);
    } else if (line.includes("Distance:") && !metadata.totalDistance) {
      const match = line.match(/Distance:\s*(.+)/);
      if (match) metadata.totalDistance = match[1].trim();
    } else if (line.includes("Duration:") && !metadata.totalDuration) {
      const match = line.match(/Duration:\s*(.+)/);
      if (match) metadata.totalDuration = match[1].trim();
    }
  }

  return metadata;
};

/**
 * Get the next undelivered stop (for navigation)
 */
export const getNextStop = (
  deliverySchedule: DeliveryStop[],
  completedStops: number[] = [],
): DeliveryStop | null => {
  return (
    deliverySchedule.find(
      (stop) => !completedStops.includes(stop.stopNumber),
    ) || null
  );
};

/**
 * Calculate route progress
 */
export const getRouteProgress = (
  totalStops: number,
  completedStops: number[] = [],
): { completed: number; remaining: number; percentage: number } => {
  const completed = completedStops.length;
  const remaining = totalStops - completed;
  const percentage =
    totalStops > 0 ? Math.round((completed / totalStops) * 100) : 0;

  return { completed, remaining, percentage };
};
