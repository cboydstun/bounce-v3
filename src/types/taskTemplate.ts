import { Document, Model } from "mongoose";
import { TaskPriority } from "./task";

/**
 * Payment calculation rule types
 */
export type PaymentRuleType = "fixed" | "percentage" | "formula";

/**
 * Scheduling relative reference points
 */
export type SchedulingRelativeTo = "eventDate" | "deliveryDate" | "manual";

/**
 * Payment calculation rules interface
 */
export interface PaymentRules {
  type: PaymentRuleType;
  baseAmount?: number; // Base amount for fixed or formula types
  percentage?: number; // Percentage of order total (0-100)
  minimumAmount?: number; // Minimum payment amount
  maximumAmount?: number; // Maximum payment amount
}

/**
 * Scheduling rules interface
 */
export interface SchedulingRules {
  relativeTo: SchedulingRelativeTo; // What date to base scheduling on
  offsetDays: number; // Days before (-) or after (+) the reference date
  defaultTime: string; // Default time in HH:MM format (24-hour)
  businessHoursOnly: boolean; // Whether to restrict to business hours
}

/**
 * Template variables available for substitution
 */
export interface TemplateVariables {
  // Order-based variables
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventDate: string;
  deliveryDate: string;
  deliveryAddress: string;
  fullAddress: string;
  orderItems: string;
  itemNames: string;
  orderTotal: string;
  specialInstructions: string;

  // Template-based variables
  taskType: string;
  templateName: string;
}

/**
 * Main TaskTemplate interface
 */
export interface TaskTemplate {
  _id: string; // MongoDB document ID
  name: string; // Template name (e.g., "Installation", "Consultation")
  description: string; // Helper text for admins
  isSystemTemplate: boolean; // true for original 4 hardcoded types
  isActive: boolean; // Whether template is available for use
  defaultPriority: TaskPriority; // Default priority for tasks created with this template

  // Auto-population patterns
  titlePattern: string; // Pattern with variables: "{taskType} for Order #{orderNumber}"
  descriptionPattern: string; // Rich text pattern with variables

  // Calculation rules
  paymentRules: PaymentRules; // Payment calculation configuration
  schedulingRules: SchedulingRules; // Scheduling calculation configuration

  // Usage and metadata
  usageCount: number; // Number of tasks created with this template
  createdBy: string; // Admin user ID who created the template
  createdByName: string; // Admin user name for display

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date; // Soft delete timestamp
}

/**
 * Form data interface for creating/updating task templates
 */
export interface TaskTemplateFormData {
  name: string;
  description: string;
  isActive?: boolean;
  defaultPriority?: TaskPriority;
  titlePattern: string;
  descriptionPattern: string;
  paymentRules: PaymentRules;
  schedulingRules: SchedulingRules;
}

/**
 * Template preview result interface
 */
export interface TaskTemplatePreview {
  title: string;
  description: string;
  paymentAmount: number;
  scheduledDateTime: string | null;
  variables: TemplateVariables;
}

/**
 * Template usage statistics interface
 */
export interface TaskTemplateStats {
  totalActive: number;
  totalSystem: number;
  totalCustom: number;
  totalUsage: number;
  mostUsedTemplates: Array<{
    templateId: string;
    name: string;
    usageCount: number;
  }>;
}

/**
 * Mongoose document interface for TaskTemplate
 */
export interface ITaskTemplateDocument
  extends Omit<TaskTemplate, "_id">,
    Document {}

/**
 * Mongoose model interface for TaskTemplate with static methods
 */
export interface ITaskTemplateModel extends Model<ITaskTemplateDocument> {
  /**
   * Find all active templates
   * @param includeSystem Whether to include system templates
   * @returns Promise resolving to an array of active templates
   */
  findActive(includeSystem?: boolean): Promise<ITaskTemplateDocument[]>;

  /**
   * Find templates by creator
   * @param createdBy The user ID who created the templates
   * @returns Promise resolving to an array of templates
   */
  findByCreator(createdBy: string): Promise<ITaskTemplateDocument[]>;

  /**
   * Get template usage statistics
   * @returns Promise resolving to usage statistics
   */
  getUsageStats(): Promise<TaskTemplateStats>;

  /**
   * Increment usage count for a template
   * @param templateId The template ID
   * @returns Promise resolving to the updated template
   */
  incrementUsage(templateId: string): Promise<ITaskTemplateDocument | null>;

  /**
   * Soft delete a template
   * @param templateId The template ID
   * @param deletedBy The user ID performing the deletion
   * @returns Promise resolving to the deleted template
   */
  softDelete(
    templateId: string,
    deletedBy: string,
  ): Promise<ITaskTemplateDocument | null>;

  /**
   * Create system templates for backward compatibility
   * @param createdBy The user ID creating the system templates
   * @returns Promise resolving to an array of created system templates
   */
  createSystemTemplates(createdBy: string): Promise<ITaskTemplateDocument[]>;
}
