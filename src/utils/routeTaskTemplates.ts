import {
  TaskTemplate,
  PaymentRuleType,
  SchedulingRelativeTo,
} from "@/types/taskTemplate";
import { TaskPriority } from "@/types/task";

/**
 * Route-specific task templates for different delivery scenarios
 */
export const ROUTE_TASK_TEMPLATES = {
  DELIVERY_INDIVIDUAL: {
    name: "Delivery Route - Individual Stop",
    description:
      "Template for individual delivery tasks created from route optimization",
    titlePattern: "Delivery Stop {stopNumber} - {customerName}",
    descriptionPattern: `Deliver {orderItems} to {customerName}

📍 Address: {deliveryAddress}
📅 Event Date: {eventDate}
🚚 Route: Driver {routeNumber}, Stop {stopNumber} of {stopCount}
⏰ Estimated Arrival: {estimatedArrivalTime}
🛣️ Travel: {travelDistance}m, {travelDuration}min from previous stop

Order Details:
- Order Number: {orderNumber}
- Customer: {customerName}
- Phone: {customerPhone}
- Event Date: {eventDate}

Route Information:
- Route Session: {routeSessionId}
- Total Route Distance: {totalDistance}m
- Estimated Route Duration: {estimatedDuration}min`,
    paymentRules: {
      type: "formula" as PaymentRuleType,
      baseAmount: 10,
      percentage: 10,
      minimumAmount: 15,
      maximumAmount: 200,
    },
    schedulingRules: {
      relativeTo: "manual" as SchedulingRelativeTo,
      offsetDays: 0,
      defaultTime: "08:00",
      businessHoursOnly: false,
    },
    defaultPriority: "Medium" as TaskPriority,
    isActive: true,
    isSystemTemplate: true,
  },

  DELIVERY_CONSOLIDATED: {
    name: "Delivery Route - Consolidated",
    description:
      "Template for consolidated delivery tasks covering entire route",
    titlePattern: "Delivery Route - Driver {routeNumber} - {stopCount} Stops",
    descriptionPattern: `Complete delivery route with {stopCount} stops

📦 Items to Deliver:
{itemsList}

📍 Delivery Schedule:
{deliverySchedule}

📊 Route Summary:
Total Distance: {totalDistance}km
Estimated Duration: {estimatedDuration}h {estimatedDurationMin}m
Start Time: {startTime}
End Time: {endTime}
Total Order Value: \${totalOrderValue}

Route Session: {routeSessionId}`,
    paymentRules: {
      type: "formula" as PaymentRuleType,
      baseAmount: 50,
      percentage: 5,
      minimumAmount: 75,
      maximumAmount: 500,
    },
    schedulingRules: {
      relativeTo: "manual" as SchedulingRelativeTo,
      offsetDays: 0,
      defaultTime: "08:00",
      businessHoursOnly: false,
    },
    defaultPriority: "High" as TaskPriority,
    isActive: true,
    isSystemTemplate: true,
  },

  SETUP_DELIVERY_ROUTE: {
    name: "Setup + Delivery Route",
    description: "Template for routes that include both setup and delivery",
    titlePattern: "Setup & Delivery Route - Driver {routeNumber}",
    descriptionPattern: `Setup and delivery route with {stopCount} stops

📅 Route Date: {routeDate}
🚚 Driver {routeNumber}
⏰ Start: {startTime} | End: {endTime}
🛣️ Total Distance: {totalDistance}m

Tasks Include:
- Setup bounce houses/equipment
- Customer walkthrough and safety briefing
- Collect any remaining payments
- Ensure proper anchoring and safety

Customers:
{customerList}

Special Instructions:
- Verify setup location accessibility
- Check power requirements
- Confirm adult supervision present
- Take setup completion photos

Route Session: {routeSessionId}`,
    paymentRules: {
      type: "formula" as PaymentRuleType,
      baseAmount: 75,
      percentage: 8,
      minimumAmount: 100,
      maximumAmount: 600,
    },
    schedulingRules: {
      relativeTo: "manual" as SchedulingRelativeTo,
      offsetDays: 0,
      defaultTime: "07:00",
      businessHoursOnly: false,
    },
    defaultPriority: "High" as TaskPriority,
    isActive: true,
    isSystemTemplate: true,
  },

  PICKUP_ROUTE: {
    name: "Pickup Route",
    description: "Template for pickup routes after events",
    titlePattern: "Pickup Route - Driver {routeNumber} - {stopCount} Stops",
    descriptionPattern: `Equipment pickup route with {stopCount} stops

📅 Pickup Date: {routeDate}
🚚 Driver {routeNumber}
⏰ Start: {startTime} | End: {endTime}
🛣️ Total Distance: {totalDistance}m

Pickup Tasks:
- Deflate and pack bounce houses
- Collect all equipment and accessories
- Inspect for damage
- Clean equipment if necessary

Customers:
{customerList}

Important:
- Verify all equipment collected
- Note any damage on pickup form
- Ensure customer satisfaction
- Leave area clean

Route Session: {routeSessionId}`,
    paymentRules: {
      type: "formula" as PaymentRuleType,
      baseAmount: 40,
      percentage: 5,
      minimumAmount: 50,
      maximumAmount: 300,
    },
    schedulingRules: {
      relativeTo: "eventDate" as SchedulingRelativeTo,
      offsetDays: 1,
      defaultTime: "16:00",
      businessHoursOnly: false,
    },
    defaultPriority: "Medium" as TaskPriority,
    isActive: true,
    isSystemTemplate: true,
  },
};

/**
 * Get the appropriate template for a route type
 */
export function getRouteTemplate(
  routeType: "individual" | "consolidated" | "setup" | "pickup",
): Partial<TaskTemplate> {
  switch (routeType) {
    case "individual":
      return ROUTE_TASK_TEMPLATES.DELIVERY_INDIVIDUAL;
    case "consolidated":
      return ROUTE_TASK_TEMPLATES.DELIVERY_CONSOLIDATED;
    case "setup":
      return ROUTE_TASK_TEMPLATES.SETUP_DELIVERY_ROUTE;
    case "pickup":
      return ROUTE_TASK_TEMPLATES.PICKUP_ROUTE;
    default:
      return ROUTE_TASK_TEMPLATES.DELIVERY_INDIVIDUAL;
  }
}

/**
 * Create route-specific template variables from route and order data
 */
export function createRouteTemplateVariables(
  route: any,
  order: any,
  stopNumber?: number,
): Record<string, any> {
  const baseVariables = {
    // Order variables
    orderNumber: order.orderNumber || "N/A",
    customerName: order.customerName || "Unknown Customer",
    customerPhone: order.customerPhone || "N/A",
    customerEmail: order.customerEmail || "N/A",
    deliveryAddress:
      `${order.customerAddress || ""}, ${order.customerCity || ""}, ${order.customerState || ""} ${order.customerZipCode || ""}`.trim(),
    eventDate: order.eventDate
      ? new Date(order.eventDate).toLocaleDateString()
      : "N/A",
    deliveryDate: order.deliveryDate
      ? new Date(order.deliveryDate).toLocaleDateString()
      : "N/A",
    orderItems: order.items
      ? order.items.map((item: any) => item.name).join(", ")
      : "N/A",
    totalAmount: order.totalAmount || 0,

    // Route variables
    routeNumber: route.driverIndex ? route.driverIndex + 1 : 1,
    driverIndex: route.driverIndex || 0,
    stopCount: route.timeSlots ? route.timeSlots.length : 0,
    totalDistance: Math.round(((route.totalDistance || 0) / 1000) * 10) / 10, // Convert to km with 1 decimal
    estimatedDuration: Math.round((route.totalDuration || 0) / 60), // Convert to minutes
    routeDate: route.startTime
      ? route.startTime.toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    startTime: route.startTime
      ? route.startTime.toTimeString().slice(0, 5)
      : "08:00",
    endTime: route.endTime ? route.endTime.toTimeString().slice(0, 5) : "17:00",

    // Stop-specific variables (for individual tasks)
    stopNumber: stopNumber || 1,
    estimatedArrivalTime: "TBD",
    travelDistance: 0,
    travelDuration: 0,

    // Multi-order variables (for consolidated tasks)
    customerList: "",
    orderNumbers: "",
    totalOrderValue: 0,

    // Metadata
    routeSessionId: `route_${Date.now()}`,
  };

  // Add stop-specific data if available
  if (stopNumber && route.timeSlots && route.timeSlots[stopNumber - 1]) {
    const timeSlot = route.timeSlots[stopNumber - 1];
    baseVariables.estimatedArrivalTime = timeSlot.timeBlock.start
      .toTimeString()
      .slice(0, 5);
    baseVariables.travelDistance =
      Math.round(((timeSlot.travelInfo.distance || 0) / 1000) * 10) / 10;
    baseVariables.travelDuration = Math.round(
      (timeSlot.travelInfo.duration || 0) / 60,
    );
  }

  // Add consolidated route data if available
  if (route.orders && Array.isArray(route.orders)) {
    baseVariables.customerList = route.orders
      .map(
        (o: any, index: number) =>
          `${index + 1}. ${o.customerName} (${o.orderNumber})`,
      )
      .join("\n");
    baseVariables.orderNumbers = route.orders
      .map((o: any) => o.orderNumber)
      .join(", ");
    baseVariables.totalOrderValue = route.orders.reduce(
      (sum: number, o: any) => sum + (o.totalAmount || 0),
      0,
    );
  }

  return baseVariables;
}

/**
 * Generate task title from template pattern and variables
 */
export function generateTaskTitle(
  titlePattern: string,
  variables: Record<string, any>,
): string {
  let title = titlePattern;

  // Replace all template variables
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    title = title.replace(
      new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g"),
      String(value),
    );
  });

  return title;
}

/**
 * Generate task description from template pattern and variables
 */
export function generateTaskDescription(
  descriptionPattern: string,
  variables: Record<string, any>,
): string {
  let description = descriptionPattern;

  // Replace all template variables
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    description = description.replace(
      new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g"),
      String(value),
    );
  });

  return description;
}

/**
 * Calculate payment amount based on template rules and variables
 */
export function calculateRoutePayment(
  paymentRules: any,
  variables: Record<string, any>,
): number {
  const {
    type,
    baseAmount = 0,
    percentage = 0,
    minimumAmount = 0,
    maximumAmount = 999999,
  } = paymentRules;

  let calculatedAmount = 0;

  switch (type) {
    case "fixed":
      calculatedAmount = baseAmount;
      break;
    case "percentage":
      calculatedAmount = (variables.totalAmount || 0) * (percentage / 100);
      break;
    case "formula":
      calculatedAmount =
        baseAmount + (variables.totalAmount || 0) * (percentage / 100);
      break;
    default:
      calculatedAmount = baseAmount;
  }

  // Apply min/max constraints
  calculatedAmount = Math.max(
    minimumAmount,
    Math.min(maximumAmount, calculatedAmount),
  );

  // Round to 2 decimal places
  return Math.round(calculatedAmount * 100) / 100;
}
