import { OptimizedRoute, DeliveryTimeSlot } from "./routeOptimization";
import { MultiRouteResult } from "./multiDriverOptimization";
import { TaskFormData, TaskType, TaskPriority } from "@/types/task";
import { Order } from "@/types/order";
import { TaskTemplate } from "@/types/taskTemplate";
import { TemplateEngine } from "./templateEngine";
import { formatDateTimeLocalCT, createDateTimeCT } from "./dateUtils";

/**
 * Options for route-to-task conversion
 */
export interface RouteConversionOptions {
  granularity: "individual" | "consolidated"; // Individual tasks per stop or one task per route
  templateId?: string; // Optional template to use
  contractorIds?: string[]; // Contractors to assign
  paymentCalculation: "template" | "custom" | "none"; // How to calculate payments
  customPaymentAmount?: number; // Custom payment amount if selected
  includeRouteMetadata: boolean; // Whether to include route optimization data
  taskPriority: TaskPriority; // Priority for created tasks
  schedulingOffset: number; // Hours to offset from route start time
}

/**
 * Result of route-to-task conversion
 */
export interface RouteConversionResult {
  success: boolean;
  tasksToCreate: TaskFormData[];
  routeMetadata: {
    routeSessionId: string;
    totalStops: number;
    totalDistance: number;
    totalDuration: number;
    driverIndex?: number;
    routeColor?: string;
  };
  errors: string[];
  warnings: string[];
}

/**
 * Result of batch route conversion (multi-driver)
 */
export interface BatchRouteConversionResult {
  success: boolean;
  routeResults: RouteConversionResult[];
  totalTasksToCreate: number;
  errors: string[];
  warnings: string[];
}

/**
 * Utility class for converting optimized routes to task data
 */
export class RouteToTaskConverter {
  /**
   * Convert a single optimized route to task form data
   */
  static async convertSingleRoute(
    route: OptimizedRoute,
    options: RouteConversionOptions,
    template?: TaskTemplate,
  ): Promise<RouteConversionResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const tasksToCreate: TaskFormData[] = [];

    try {
      // Generate unique route session ID
      const routeSessionId = `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Validate route has deliveries
      if (!route.timeSlots || route.timeSlots.length === 0) {
        errors.push("Route has no delivery stops");
        return {
          success: false,
          tasksToCreate: [],
          routeMetadata: {
            routeSessionId,
            totalStops: 0,
            totalDistance: route.totalDistance,
            totalDuration: route.totalDuration,
            driverIndex: route.driverIndex,
            routeColor: route.routeColor,
          },
          errors,
          warnings,
        };
      }

      if (options.granularity === "individual") {
        // Create individual tasks for each stop
        for (let i = 0; i < route.timeSlots.length; i++) {
          const timeSlot = route.timeSlots[i];
          const order = timeSlot.order;

          if (!order) {
            warnings.push(`Stop ${i + 1} has no associated order data`);
            continue;
          }

          try {
            const taskData = await this.createTaskDataFromTimeSlot(
              timeSlot,
              order,
              i + 1,
              route,
              routeSessionId,
              options,
              template,
            );
            tasksToCreate.push(taskData);
          } catch (error) {
            errors.push(
              `Failed to create task for stop ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`,
            );
          }
        }
      } else {
        // Create consolidated task for entire route
        try {
          const consolidatedTask = await this.createConsolidatedTaskData(
            route,
            routeSessionId,
            options,
            template,
          );
          tasksToCreate.push(consolidatedTask);
        } catch (error) {
          errors.push(
            `Failed to create consolidated route task: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }

      return {
        success: errors.length === 0,
        tasksToCreate,
        routeMetadata: {
          routeSessionId,
          totalStops: route.timeSlots.length,
          totalDistance: route.totalDistance,
          totalDuration: route.totalDuration,
          driverIndex: route.driverIndex,
          routeColor: route.routeColor,
        },
        errors,
        warnings,
      };
    } catch (error) {
      errors.push(
        `Route conversion failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return {
        success: false,
        tasksToCreate: [],
        routeMetadata: {
          routeSessionId: `error_${Date.now()}`,
          totalStops: 0,
          totalDistance: 0,
          totalDuration: 0,
        },
        errors,
        warnings,
      };
    }
  }

  /**
   * Convert multiple routes (multi-driver) to task data
   */
  static async convertMultipleRoutes(
    multiRouteResult: MultiRouteResult,
    options: RouteConversionOptions,
    template?: TaskTemplate,
  ): Promise<BatchRouteConversionResult> {
    const routeResults: RouteConversionResult[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Convert each route individually
      for (let i = 0; i < multiRouteResult.routes.length; i++) {
        const route = multiRouteResult.routes[i];

        // Skip empty routes
        if (!route.timeSlots || route.timeSlots.length === 0) {
          warnings.push(`Driver ${i + 1} route is empty, skipping`);
          continue;
        }

        try {
          const routeResult = await this.convertSingleRoute(
            route,
            options,
            template,
          );
          routeResults.push(routeResult);

          // Collect errors and warnings
          errors.push(...routeResult.errors);
          warnings.push(...routeResult.warnings);
        } catch (error) {
          const errorMsg = `Failed to convert route for driver ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`;
          errors.push(errorMsg);
        }
      }

      const totalTasksToCreate = routeResults.reduce(
        (sum, result) => sum + result.tasksToCreate.length,
        0,
      );

      return {
        success: errors.length === 0,
        routeResults,
        totalTasksToCreate,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push(
        `Batch route conversion failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return {
        success: false,
        routeResults: [],
        totalTasksToCreate: 0,
        errors,
        warnings,
      };
    }
  }

  /**
   * Create task data from a single time slot (individual task)
   */
  private static async createTaskDataFromTimeSlot(
    timeSlot: DeliveryTimeSlot,
    order: Order,
    stopNumber: number,
    route: OptimizedRoute,
    routeSessionId: string,
    options: RouteConversionOptions,
    template?: TaskTemplate,
  ): Promise<TaskFormData> {
    // Calculate default scheduled time with offset using Central Time utilities
    const baseTime = timeSlot.timeBlock.start;
    const offsetHours = options.schedulingOffset;

    // Create a new date with the offset applied in Central Time
    const defaultScheduledDateTime = new Date(
      baseTime.getTime() + offsetHours * 60 * 60 * 1000,
    );

    // Base task data with default scheduling
    let taskData: Partial<TaskFormData> = {
      orderId: order._id,
      type: "Delivery" as TaskType,
      priority: options.taskPriority,
      scheduledDateTime: defaultScheduledDateTime,
      assignedContractors: options.contractorIds || [],
    };

    // Use template if provided
    if (template) {
      try {
        // Create route-specific template variables
        const routeVariables = {
          ...order,
          routeNumber: route.driverIndex ? route.driverIndex + 1 : 1,
          driverIndex: route.driverIndex || 0,
          stopNumber,
          stopCount: route.timeSlots.length,
          totalDistance: route.totalDistance,
          estimatedDuration: route.totalDuration,
          routeDate: route.startTime.toISOString().split("T")[0],
          startTime: route.startTime.toTimeString().slice(0, 5),
          endTime: route.endTime.toTimeString().slice(0, 5),
          estimatedArrivalTime: timeSlot.timeBlock.start
            .toTimeString()
            .slice(0, 5),
          travelDistance: timeSlot.travelInfo.distance,
          travelDuration: timeSlot.travelInfo.duration,
        };

        const preview = TemplateEngine.generateTaskPreview(
          template.titlePattern,
          template.descriptionPattern,
          template.paymentRules,
          template.schedulingRules,
          routeVariables as any,
          template.name,
        );

        taskData = {
          ...taskData,
          templateId: template._id,
          title: preview.title,
          description: preview.description,
          type: template.name as TaskType,
          priority: template.defaultPriority as TaskPriority,
        };

        // CRITICAL FIX: Preserve template-generated scheduled date if it's valid and in the future
        if (preview.scheduledDateTime) {
          const templateDate = new Date(preview.scheduledDateTime);
          const currentTime = new Date();

          // Only use template date if it's valid and in the future
          if (!isNaN(templateDate.getTime()) && templateDate > currentTime) {
            taskData.scheduledDateTime = templateDate;
            console.log(
              `Using template-generated date for task: ${preview.scheduledDateTime} (${templateDate.toISOString()})`,
            );
          } else {
            console.warn(
              `Template date is invalid or in the past: ${preview.scheduledDateTime}, using route time slot date instead`,
            );
          }
        }

        // Handle payment calculation
        if (
          options.paymentCalculation === "template" &&
          preview.paymentAmount
        ) {
          taskData.paymentAmount = preview.paymentAmount;
        }
      } catch (error) {
        console.warn(
          `Template processing failed for stop ${stopNumber}:`,
          error,
        );
        // Fall back to manual generation
      }
    }

    // Manual task generation if no template or template failed
    if (!taskData.title) {
      const itemNames = order.items.map((item) => item.name).join(", ");
      taskData.title = `Delivery - Stop ${stopNumber} - ${order.customerName}`;
      taskData.description = `Deliver ${itemNames} to ${order.customerName}\n\nRoute: Driver ${route.driverIndex ? route.driverIndex + 1 : 1}, Stop ${stopNumber} of ${route.timeSlots.length}\nEstimated arrival: ${timeSlot.timeBlock.start.toLocaleTimeString()}\nTravel distance: ${(timeSlot.travelInfo.distance / 1000).toFixed(1)}km`;
    }

    // Handle payment calculation
    if (
      options.paymentCalculation === "custom" &&
      options.customPaymentAmount
    ) {
      taskData.paymentAmount = options.customPaymentAmount;
    } else if (
      options.paymentCalculation === "template" &&
      !taskData.paymentAmount
    ) {
      // Default payment calculation for deliveries
      const payment = 10 + order.totalAmount * 0.1;
      taskData.paymentAmount = Math.round(payment * 100) / 100; // Round to 2 decimal places
    }

    // Add route metadata if requested
    if (options.includeRouteMetadata) {
      // Store route metadata in description or custom fields
      const routeMetadata = {
        routeSessionId,
        stopNumber,
        estimatedArrivalTime: timeSlot.timeBlock.start,
        travelDistance: timeSlot.travelInfo.distance,
        travelDuration: timeSlot.travelInfo.duration,
        routeGeometry: route.routeGeometry,
      };

      // Add metadata to description
      taskData.description += `\n\n--- Route Metadata ---\nRoute Session: ${routeSessionId}\nStop: ${stopNumber}/${route.timeSlots.length}\nTravel: ${(timeSlot.travelInfo.distance / 1000).toFixed(1)}km, ${Math.round(timeSlot.travelInfo.duration / 60)}min`;
    }

    return taskData as TaskFormData;
  }

  /**
   * Create consolidated task data for entire route
   */
  private static async createConsolidatedTaskData(
    route: OptimizedRoute,
    routeSessionId: string,
    options: RouteConversionOptions,
    template?: TaskTemplate,
  ): Promise<TaskFormData> {
    // Get all orders from time slots
    const allOrders = route.timeSlots
      .map((slot) => slot.order)
      .filter((order) => order != null);

    if (allOrders.length === 0) {
      throw new Error("Route has no orders");
    }

    // Use the first order as the primary order for basic task data
    const primaryOrder = allOrders[0];

    // Calculate default scheduled time with offset
    const defaultScheduledDateTime = new Date(
      route.startTime.getTime() + options.schedulingOffset * 60 * 60 * 1000,
    );

    // Aggregate data from all orders
    const allItems = allOrders.flatMap((order) =>
      order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        orderNumber: order.orderNumber,
        customerName: order.customerName || "Unknown Customer",
      })),
    );

    const customerDetails = allOrders.map((order, index) => ({
      stopNumber: index + 1,
      customerName: order.customerName || "Unknown Customer",
      orderNumber: order.orderNumber,
      address:
        `${order.customerAddress || ""}, ${order.customerCity || ""}, ${order.customerState || ""} ${order.customerZipCode || ""}`.trim(),
      items: order.items
        .map((item) => `${item.quantity}x ${item.name}`)
        .join(", "),
      estimatedTime:
        route.timeSlots[index]?.timeBlock.start.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }) || "TBD",
    }));

    const totalOrderValue = allOrders.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0,
    );

    // Base task data with default scheduling
    let taskData: Partial<TaskFormData> = {
      orderId: primaryOrder._id,
      type: "Delivery" as TaskType,
      priority: options.taskPriority,
      scheduledDateTime: defaultScheduledDateTime,
      assignedContractors: options.contractorIds || [],
    };

    // Use template if provided
    if (template) {
      try {
        // Create consolidated route variables with comprehensive data
        const itemsList = allItems
          .map(
            (item) => `• ${item.quantity}x ${item.name} (${item.orderNumber})`,
          )
          .join("\n");

        const deliverySchedule = customerDetails
          .map(
            (customer) =>
              `${customer.stopNumber}. ${customer.address} (${customer.estimatedTime})\n   Customer: ${customer.customerName} | Order: ${customer.orderNumber}\n   Items: ${customer.items}`,
          )
          .join("\n\n");

        const routeVariables = {
          ...primaryOrder,
          routeNumber: route.driverIndex ? route.driverIndex + 1 : 1,
          driverIndex: route.driverIndex || 0,
          stopCount: route.timeSlots.length,
          totalDistance: (route.totalDistance / 1000).toFixed(1), // Convert to km with 1 decimal
          estimatedDuration: Math.round(route.totalDuration / 3600), // Hours
          estimatedDurationMin: Math.round((route.totalDuration % 3600) / 60), // Minutes
          routeDate: route.startTime.toISOString().split("T")[0],
          startTime: route.startTime.toTimeString().slice(0, 5),
          endTime: route.endTime.toTimeString().slice(0, 5),
          customerList: customerDetails
            .map((c) => `${c.stopNumber}. ${c.customerName} (${c.orderNumber})`)
            .join("\n"),
          orderNumbers: allOrders.map((o) => o.orderNumber).join(", "),
          totalOrderValue,
          itemsList,
          deliverySchedule,
        };

        const preview = TemplateEngine.generateTaskPreview(
          template.titlePattern,
          template.descriptionPattern,
          template.paymentRules,
          template.schedulingRules,
          routeVariables as any,
          template.name,
        );

        taskData = {
          ...taskData,
          templateId: template._id,
          title: preview.title,
          description: preview.description,
          type: template.name as TaskType,
          priority: template.defaultPriority as TaskPriority,
        };

        // CRITICAL FIX: Preserve template-generated scheduled date if it's valid and in the future
        if (preview.scheduledDateTime) {
          const templateDate = new Date(preview.scheduledDateTime);
          const currentTime = new Date();

          // Only use template date if it's valid and in the future
          if (!isNaN(templateDate.getTime()) && templateDate > currentTime) {
            taskData.scheduledDateTime = templateDate;
            console.log(
              `Using template-generated date for consolidated route: ${preview.scheduledDateTime} (${templateDate.toISOString()})`,
            );
          } else {
            console.warn(
              `Template date is invalid or in the past: ${preview.scheduledDateTime}, using route start time instead`,
            );
          }
        }

        // Handle payment calculation
        if (
          options.paymentCalculation === "template" &&
          preview.paymentAmount
        ) {
          taskData.paymentAmount = preview.paymentAmount;
        }
      } catch (error) {
        console.warn(
          "Template processing failed for consolidated route:",
          error,
        );
        // Fall back to manual generation
      }
    }

    // FORCE manual task generation for consolidated routes to ensure proper format
    // Override any template-generated title/description that might be incorrect
    taskData.title = `Delivery Route - Driver ${route.driverIndex ? route.driverIndex + 1 : 1} - ${route.timeSlots.length} Stops`;

    // Create comprehensive description with all details
    const itemsSummary = allItems
      .map((item) => `• ${item.quantity}x ${item.name} (${item.orderNumber})`)
      .join("\n");

    const deliverySchedule = customerDetails
      .map(
        (customer) =>
          `${customer.stopNumber}. ${customer.address} (${customer.estimatedTime})\n   Customer: ${customer.customerName} | Order: ${customer.orderNumber}\n   Items: ${customer.items}`,
      )
      .join("\n\n");

    taskData.description = `Complete delivery route with ${route.timeSlots.length} stops

📦 Items to Deliver:
${itemsSummary}

📍 Delivery Schedule:
${deliverySchedule}

📊 Route Summary:
Total Distance: ${(route.totalDistance / 1000).toFixed(1)}km
Estimated Duration: ${Math.round(route.totalDuration / 3600)}h ${Math.round((route.totalDuration % 3600) / 60)}m
Start Time: ${route.startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
End Time: ${route.endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
Total Order Value: $${totalOrderValue.toFixed(2)}`;

    console.log(
      `Generated consolidated task: ${taskData.title}, Payment: $${taskData.paymentAmount}, Orders: ${allOrders.length}`,
    );

    // Handle payment calculation
    if (
      options.paymentCalculation === "custom" &&
      options.customPaymentAmount
    ) {
      taskData.paymentAmount = options.customPaymentAmount;
    } else if (
      options.paymentCalculation === "template" &&
      !taskData.paymentAmount
    ) {
      // Calculate consolidated payment as sum of individual task payments
      const individualPayments = allOrders.map((order) => {
        const payment = 10 + order.totalAmount * 0.1;
        return Math.round(payment * 100) / 100; // Round to 2 decimal places
      });
      const totalPayment = individualPayments.reduce(
        (sum, payment) => sum + payment,
        0,
      );
      taskData.paymentAmount = Math.round(totalPayment * 100) / 100; // Final rounding to ensure 2 decimal places
    } else if (options.paymentCalculation === "none") {
      taskData.paymentAmount = undefined;
    } else {
      // Default: sum of individual payments
      const individualPayments = allOrders.map((order) => {
        const payment = 10 + order.totalAmount * 0.1;
        return Math.round(payment * 100) / 100; // Round to 2 decimal places
      });
      const totalPayment = individualPayments.reduce(
        (sum, payment) => sum + payment,
        0,
      );
      taskData.paymentAmount = Math.round(totalPayment * 100) / 100; // Final rounding to ensure 2 decimal places
    }

    // Add route metadata if requested
    if (options.includeRouteMetadata) {
      const routeMetadata = {
        routeSessionId,
        totalStops: route.timeSlots.length,
        totalDistance: route.totalDistance,
        totalDuration: route.totalDuration,
        routeGeometry: route.routeGeometry,
        orderIds: allOrders.map((o) => o._id),
      };

      // Add metadata to description
      taskData.description += `\n\n--- Route Metadata ---\nRoute Session: ${routeSessionId}\nStops: ${route.timeSlots.length}\nDistance: ${(route.totalDistance / 1000).toFixed(1)}km\nDuration: ${Math.round(route.totalDuration / 3600)}h ${Math.round((route.totalDuration % 3600) / 60)}m`;
    }

    return taskData as TaskFormData;
  }

  /**
   * Validate route conversion options
   */
  static validateConversionOptions(options: RouteConversionOptions): string[] {
    const errors: string[] = [];

    if (!["individual", "consolidated"].includes(options.granularity)) {
      errors.push("Invalid granularity option");
    }

    if (!["template", "custom", "none"].includes(options.paymentCalculation)) {
      errors.push("Invalid payment calculation option");
    }

    if (
      options.paymentCalculation === "custom" &&
      !options.customPaymentAmount
    ) {
      errors.push(
        "Custom payment amount is required when using custom payment calculation",
      );
    }

    if (
      options.customPaymentAmount &&
      (options.customPaymentAmount < 0 ||
        options.customPaymentAmount > 999999.99)
    ) {
      errors.push("Custom payment amount must be between $0 and $999,999.99");
    }

    if (!["High", "Medium", "Low"].includes(options.taskPriority)) {
      errors.push("Invalid task priority");
    }

    if (
      typeof options.schedulingOffset !== "number" ||
      options.schedulingOffset < -24 ||
      options.schedulingOffset > 24
    ) {
      errors.push("Scheduling offset must be between -24 and 24 hours");
    }

    return errors;
  }
}
