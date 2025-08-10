import { Order, OrderItem } from "@/types/order";
import {
  PaymentRules,
  SchedulingRules,
  TemplateVariables,
  TaskTemplatePreview,
} from "@/types/taskTemplate";
import {
  parsePartyDateCT,
  formatDateCT,
  parseDateFromNotes,
  CENTRAL_TIMEZONE,
} from "./dateUtils";

/**
 * Template Engine for processing task templates with variable substitution
 */
export class TemplateEngine {
  /**
   * Generate template variables from order data
   * @param order Order object
   * @param templateName Name of the template being used
   * @returns Template variables object
   */
  static generateVariables(
    order: Order,
    templateName: string,
  ): TemplateVariables {
    // Generate item names and order items strings
    const itemNames =
      order.items && order.items.length > 0
        ? order.items
            .map((item) => {
              // Extract clean item name
              let cleanName = item.name;
              cleanName = cleanName
                .replace(/\s*\(.*?\)\s*/g, "") // Remove parenthetical descriptions
                .replace(/\s*-.*$/g, "") // Remove dash descriptions
                .replace(/^\d+x?\s*/i, "") // Remove quantity prefixes
                .trim();
              return cleanName;
            })
            .slice(0, 3)
            .join(", ") + (order.items.length > 3 ? ", and more" : "")
        : "Items";

    const orderItems =
      order.items && order.items.length > 0
        ? order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")
        : "No items";

    // Generate address components
    const addressParts = [
      order.customerAddress,
      order.customerCity,
      order.customerState,
      order.customerZipCode,
    ].filter(Boolean);

    const fullAddress =
      addressParts.length > 0 ? addressParts.join(", ") : "Address TBD";

    const deliveryAddress = order.customerAddress || "Address TBD";

    // Format dates
    const eventDate = order.eventDate
      ? formatDateCT(
          typeof order.eventDate === "string"
            ? new Date(order.eventDate)
            : order.eventDate,
        )
      : "TBD";

    const deliveryDate = order.deliveryDate
      ? formatDateCT(
          typeof order.deliveryDate === "string"
            ? new Date(order.deliveryDate)
            : order.deliveryDate,
        )
      : "TBD";

    // Format order total
    const orderTotal = `$${order.totalAmount.toFixed(2)}`;

    // Extract special instructions
    const specialInstructions =
      order.notes && order.notes.trim()
        ? order.notes.length <= 100
          ? order.notes.trim()
          : `${order.notes.trim().substring(0, 97)}...`
        : "";

    return {
      // Order-based variables
      orderNumber: order.orderNumber,
      customerName: order.customerName || "Unknown Customer",
      customerEmail: order.customerEmail || "",
      customerPhone: order.customerPhone || "",
      eventDate,
      deliveryDate,
      deliveryAddress,
      fullAddress,
      orderItems,
      itemNames,
      orderTotal,
      specialInstructions,

      // Template-based variables
      taskType: templateName,
      templateName,
    };
  }

  /**
   * Process a pattern string with variable substitution
   * @param pattern Pattern string with variables in {variableName} format
   * @param variables Template variables object
   * @returns Processed string with variables substituted
   */
  static processPattern(pattern: string, variables: TemplateVariables): string {
    let result = pattern;

    // Replace all variables in the pattern
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, "g");
      result = result.replace(regex, value || "");
    });

    // Clean up any remaining unreplaced variables (show as empty)
    result = result.replace(/\{[^}]+\}/g, "");

    // Clean up extra whitespace and newlines
    result = result
      .replace(/\n\s*\n/g, "\n") // Remove empty lines
      .replace(/\s+\n/g, "\n") // Remove trailing spaces before newlines
      .trim();

    return result;
  }

  /**
   * Calculate payment amount based on payment rules
   * @param rules Payment rules configuration
   * @param orderTotal Total amount of the order
   * @returns Calculated payment amount
   */
  static calculatePayment(rules: PaymentRules, orderTotal: number): number {
    let amount: number;

    switch (rules.type) {
      case "fixed":
        amount = rules.baseAmount || 0;
        break;

      case "percentage":
        amount = orderTotal * ((rules.percentage || 0) / 100);
        break;

      case "formula":
        const baseAmount = rules.baseAmount || 0;
        const percentage = orderTotal * ((rules.percentage || 0) / 100);
        amount = baseAmount + percentage;
        break;

      default:
        amount = 0;
        break;
    }

    // Apply minimum and maximum constraints
    if (rules.minimumAmount !== undefined && amount < rules.minimumAmount) {
      amount = rules.minimumAmount;
    }

    if (rules.maximumAmount !== undefined && amount > rules.maximumAmount) {
      amount = rules.maximumAmount;
    }

    // Ensure exactly 2 decimal places to avoid floating-point precision issues
    return parseFloat(amount.toFixed(2));
  }

  /**
   * Calculate scheduled date/time based on scheduling rules
   * @param rules Scheduling rules configuration
   * @param order Order object with date information
   * @returns Calculated scheduled date/time or null if manual scheduling required
   */
  static calculateScheduling(
    rules: SchedulingRules,
    order: Order,
  ): Date | null {
    if (rules.relativeTo === "manual") {
      return null; // Manual scheduling required
    }

    const now = new Date();
    let baseDate: Date | null = null;

    try {
      // Determine base date based on rules
      if (rules.relativeTo === "deliveryDate" && order.deliveryDate) {
        baseDate = parsePartyDateCT(order.deliveryDate);
      } else if (rules.relativeTo === "eventDate" && order.eventDate) {
        baseDate = parsePartyDateCT(order.eventDate);
      }

      // Fallback logic
      if (!baseDate) {
        if (order.deliveryDate) {
          baseDate = parsePartyDateCT(order.deliveryDate);
        } else if (order.eventDate) {
          baseDate = parsePartyDateCT(order.eventDate);
        } else if (order.notes) {
          // Try to parse date from notes
          baseDate = parseDateFromNotes(order.notes);
        }
      }

      if (!baseDate) {
        console.warn("No suitable base date found for scheduling calculation");
        return null;
      }

      // Apply offset days
      const scheduledDate = new Date(baseDate);
      scheduledDate.setDate(scheduledDate.getDate() + rules.offsetDays);

      // Only proceed if the calculated date is in the future
      if (scheduledDate <= now) {
        console.warn("Calculated scheduled date is in the past");
        return null;
      }

      // Apply default time
      const [hours, minutes] = rules.defaultTime.split(":").map(Number);

      // Create date with specific time in Central Time
      const year = scheduledDate.getFullYear();
      const month = String(scheduledDate.getMonth() + 1).padStart(2, "0");
      const day = String(scheduledDate.getDate()).padStart(2, "0");
      const hoursStr = String(hours).padStart(2, "0");
      const minutesStr = String(minutes).padStart(2, "0");

      // Create date string in Central Time (using -06:00 for CST)
      const centralTimeStr = `${year}-${month}-${day}T${hoursStr}:${minutesStr}:00-06:00`;
      const finalDate = new Date(centralTimeStr);

      // Business hours validation (if enabled)
      if (rules.businessHoursOnly) {
        const dayOfWeek = finalDate.getDay(); // 0 = Sunday, 6 = Saturday
        const hour = finalDate.getHours();

        // Check if it's a weekend
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          console.warn(
            "Scheduled date falls on weekend, but business hours only is enabled",
          );
          // Could adjust to next business day, but for now just warn
        }

        // Check if it's outside business hours (assuming 8 AM - 6 PM)
        if (hour < 8 || hour >= 18) {
          console.warn("Scheduled time is outside business hours");
          // Could adjust time, but for now just warn
        }
      }

      return finalDate;
    } catch (error) {
      console.error("Error calculating scheduled date/time:", error);
      return null;
    }
  }

  /**
   * Format date for datetime-local input in Central Time
   * @param date Date object
   * @returns Formatted string for datetime-local input in Central Time
   */
  static formatDateTimeLocalCT(date: Date): string {
    // Convert to Central Time using toLocaleString
    const centralTimeStr = date.toLocaleString("en-CA", {
      timeZone: CENTRAL_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    // Format: "2025-01-08, 21:30" -> "2025-01-08T21:30"
    const [datePart, timePart] = centralTimeStr.split(", ");
    return `${datePart}T${timePart}`;
  }

  /**
   * Generate a complete task preview from template and order data
   * @param titlePattern Template title pattern
   * @param descriptionPattern Template description pattern
   * @param paymentRules Payment calculation rules
   * @param schedulingRules Scheduling calculation rules
   * @param order Order object
   * @param templateName Template name
   * @returns Complete task preview
   */
  static generateTaskPreview(
    titlePattern: string,
    descriptionPattern: string,
    paymentRules: PaymentRules,
    schedulingRules: SchedulingRules,
    order: Order,
    templateName: string,
  ): TaskTemplatePreview {
    // Generate variables
    const variables = this.generateVariables(order, templateName);

    // Process patterns
    const title = this.processPattern(titlePattern, variables);
    const description = this.processPattern(descriptionPattern, variables);

    // Calculate payment
    const paymentAmount = this.calculatePayment(
      paymentRules,
      order.totalAmount,
    );

    // Calculate scheduling
    const scheduledDate = this.calculateScheduling(schedulingRules, order);
    const scheduledDateTime = scheduledDate
      ? this.formatDateTimeLocalCT(scheduledDate)
      : null;

    return {
      title,
      description,
      paymentAmount,
      scheduledDateTime,
      variables,
    };
  }

  /**
   * Validate a template pattern for syntax errors
   * @param pattern Pattern string to validate
   * @returns Array of validation errors (empty if valid)
   */
  static validatePattern(pattern: string): string[] {
    const errors: string[] = [];

    // Check for unmatched braces
    const openBraces = (pattern.match(/\{/g) || []).length;
    const closeBraces = (pattern.match(/\}/g) || []).length;

    if (openBraces !== closeBraces) {
      errors.push("Unmatched braces in pattern");
    }

    // Check for empty variable names
    const emptyVariables = pattern.match(/\{\s*\}/g);
    if (emptyVariables) {
      errors.push("Empty variable names found");
    }

    // Check for nested braces
    const nestedBraces = pattern.match(/\{[^}]*\{[^}]*\}/g);
    if (nestedBraces) {
      errors.push("Nested braces are not allowed");
    }

    return errors;
  }

  /**
   * Get list of available template variables
   * @returns Array of available variable names with descriptions
   */
  static getAvailableVariables(): Array<{
    name: string;
    description: string;
    example: string;
  }> {
    return [
      {
        name: "orderNumber",
        description: "Order number",
        example: "ORD-2025-001",
      },
      {
        name: "customerName",
        description: "Customer name",
        example: "John Smith",
      },
      {
        name: "customerEmail",
        description: "Customer email",
        example: "john@example.com",
      },
      {
        name: "customerPhone",
        description: "Customer phone",
        example: "(555) 123-4567",
      },
      { name: "eventDate", description: "Event date", example: "Jan 15, 2025" },
      {
        name: "deliveryDate",
        description: "Delivery date",
        example: "Jan 14, 2025",
      },
      {
        name: "deliveryAddress",
        description: "Delivery street address",
        example: "123 Main St",
      },
      {
        name: "fullAddress",
        description: "Complete delivery address",
        example: "123 Main St, Austin, TX 78701",
      },
      {
        name: "orderItems",
        description: "Detailed list of ordered items",
        example: "2x Large Bounce House, 1x Water Slide",
      },
      {
        name: "itemNames",
        description: "Simplified item names",
        example: "Large Bounce House, Water Slide",
      },
      {
        name: "orderTotal",
        description: "Order total amount",
        example: "$299.99",
      },
      {
        name: "specialInstructions",
        description: "Special instructions from order",
        example: "Setup in backyard",
      },
      {
        name: "taskType",
        description: "Task type/template name",
        example: "Delivery",
      },
      {
        name: "templateName",
        description: "Template name",
        example: "Standard Delivery",
      },
    ];
  }
}
