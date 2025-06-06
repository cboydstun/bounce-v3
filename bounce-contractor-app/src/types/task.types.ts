import { Coordinates, Address, UploadedFile } from "./api.types";
import { User, ContractorProfile } from "./auth.types";

// Task Core Types
export interface Task {
  id: string;
  orderId: string;
  title: string;
  description: string;
  type: TaskType;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  requiredSkills: string[];
  estimatedDuration: number; // in minutes
  scheduledDate: string;
  scheduledTimeSlot: TimeSlot;
  location: TaskLocation;
  customer: CustomerInfo;
  equipment: Equipment[];
  instructions: TaskInstruction[];
  compensation: TaskCompensation;
  contractor?: ContractorAssignment;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export type TaskType =
  | "delivery_only"
  | "setup_only"
  | "delivery_and_setup"
  | "pickup_only"
  | "pickup_and_teardown"
  | "full_service";

export type TaskCategory =
  | "bounce_house"
  | "water_slide"
  | "combo_unit"
  | "obstacle_course"
  | "interactive_game"
  | "tent"
  | "table_chair"
  | "generator"
  | "other";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type TaskStatus =
  | "draft"
  | "published"
  | "assigned"
  | "accepted"
  | "in_progress"
  | "en_route"
  | "on_site"
  | "completed"
  | "cancelled"
  | "failed";

export interface TimeSlot {
  startTime: string; // ISO string
  endTime: string; // ISO string
  isFlexible: boolean;
  bufferTime?: number; // minutes before/after
}

export interface TaskLocation {
  coordinates: Coordinates;
  address: Address;
  accessInstructions?: string;
  parkingInstructions?: string;
  specialRequirements?: string;
  contactOnArrival: boolean;
  gateCode?: string;
  landmarks?: string;
}

export interface CustomerInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  preferredContactMethod: "phone" | "email" | "text";
  specialInstructions?: string;
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  dimensions: Dimensions;
  weight: number; // in pounds
  powerRequirements?: PowerRequirements;
  setupInstructions?: string;
  safetyNotes?: string;
  images: string[];
  serialNumber?: string;
  condition: EquipmentCondition;
}

export interface Dimensions {
  length: number; // in feet
  width: number; // in feet
  height: number; // in feet
}

export interface PowerRequirements {
  voltage: number;
  amperage: number;
  outlets: number;
  extensionCordLength?: number; // in feet
  generatorRequired: boolean;
}

export type EquipmentCondition = "excellent" | "good" | "fair" | "needs_repair";

export interface TaskInstruction {
  id: string;
  type: InstructionType;
  title: string;
  content: string;
  order: number;
  isRequired: boolean;
  estimatedTime?: number; // in minutes
}

export type InstructionType =
  | "safety"
  | "setup"
  | "operation"
  | "teardown"
  | "customer_interaction"
  | "documentation";

export interface TaskCompensation {
  baseAmount: number;
  bonuses: CompensationBonus[];
  totalAmount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentSchedule: PaymentSchedule;
}

export interface CompensationBonus {
  type: BonusType;
  amount: number;
  description: string;
  conditions?: string;
}

export type BonusType =
  | "distance"
  | "difficulty"
  | "rush"
  | "weekend"
  | "holiday"
  | "customer_rating"
  | "completion_time";

export type PaymentMethod =
  | "direct_deposit"
  | "check"
  | "paypal"
  | "quickbooks";
export type PaymentSchedule = "immediate" | "weekly" | "bi_weekly" | "monthly";

// Contractor Assignment
export interface ContractorAssignment {
  contractorId: string;
  contractor: ContractorProfile;
  assignedAt: string;
  acceptedAt?: string;
  startedAt?: string;
  arrivedAt?: string;
  completedAt?: string;
  rating?: TaskRating;
  notes?: string;
  travelDistance?: number; // in miles
  estimatedTravelTime?: number; // in minutes
}

export interface TaskRating {
  overall: number; // 1-5
  punctuality: number;
  professionalism: number;
  quality: number;
  communication: number;
  customerFeedback?: string;
  contractorFeedback?: string;
}

// Task Progress and Updates
export interface TaskProgress {
  taskId: string;
  status: TaskStatus;
  currentStep: TaskStep;
  completedSteps: TaskStep[];
  estimatedCompletion?: string;
  actualCompletion?: string;
  issues: TaskIssue[];
  photos: TaskPhoto[];
  notes: TaskNote[];
  location?: Coordinates;
  updatedAt: string;
}

export interface TaskStep {
  id: string;
  name: string;
  description: string;
  order: number;
  isRequired: boolean;
  estimatedDuration: number; // in minutes
  status: StepStatus;
  startedAt?: string;
  completedAt?: string;
  photos?: string[];
  notes?: string;
}

export type StepStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "skipped"
  | "failed";

export interface TaskIssue {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  title: string;
  description: string;
  reportedAt: string;
  reportedBy: string; // contractor ID
  resolvedAt?: string;
  resolution?: string;
  photos?: string[];
}

export type IssueType =
  | "equipment_damage"
  | "access_problem"
  | "weather"
  | "customer_unavailable"
  | "safety_concern"
  | "other";

export type IssueSeverity = "low" | "medium" | "high" | "critical";

export interface TaskPhoto {
  id: string;
  file: UploadedFile;
  type: PhotoType;
  caption?: string;
  timestamp: string;
  location?: Coordinates;
  step?: string; // step ID
}

export type PhotoType =
  | "before_setup"
  | "during_setup"
  | "after_setup"
  | "before_teardown"
  | "after_teardown"
  | "issue_documentation"
  | "customer_signature"
  | "damage_report";

export interface TaskNote {
  id: string;
  content: string;
  type: NoteType;
  createdAt: string;
  createdBy: string; // user ID
  isPrivate: boolean;
}

export type NoteType =
  | "general"
  | "safety"
  | "customer"
  | "equipment"
  | "issue";

// Task Filters and Search
export interface TaskFilters {
  status?: TaskStatus[];
  type?: TaskType[];
  category?: TaskCategory[];
  priority?: TaskPriority[];
  dateRange?: {
    start: string;
    end: string;
  };
  location?: {
    coordinates: Coordinates;
    radius: number; // in miles
  };
  compensation?: {
    min: number;
    max: number;
  };
  skills?: string[];
  duration?: {
    min: number; // in minutes
    max: number; // in minutes
  };
}

export interface TaskSearchParams {
  query?: string;
  filters?: TaskFilters;
  sortBy?: TaskSortField;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export type TaskSortField =
  | "created_at"
  | "scheduled_date"
  | "compensation"
  | "distance"
  | "priority"
  | "duration";

// Task Actions
export interface TaskClaimRequest {
  taskId: string;
  estimatedArrival?: string;
  notes?: string;
}

export interface TaskStatusUpdate {
  taskId: string;
  status: TaskStatus;
  location?: Coordinates;
  notes?: string;
  photos?: string[];
  timestamp: string;
}

export interface TaskCompletionData {
  taskId: string;
  completionPhotos: string[];
  customerSignature?: string;
  customerRating?: number;
  customerFeedback?: string;
  contractorNotes?: string;
  issuesEncountered?: TaskIssue[];
  actualDuration: number; // in minutes
  completedAt: string;
}

// Task Statistics
export interface TaskStats {
  total: number;
  completed: number;
  cancelled: number;
  inProgress: number;
  available: number;
  averageRating: number;
  totalEarnings: number;
  averageCompensation: number;
  completionRate: number;
  onTimeRate: number;
}

// Real-time Task Events
export interface TaskEvent {
  type: TaskEventType;
  taskId: string;
  data: any;
  timestamp: string;
  userId?: string;
}

export type TaskEventType =
  | "task_created"
  | "task_assigned"
  | "task_claimed"
  | "task_started"
  | "task_updated"
  | "task_completed"
  | "task_cancelled"
  | "contractor_arrived"
  | "issue_reported"
  | "message_sent";

// Task Templates (for recurring tasks)
export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  type: TaskType;
  category: TaskCategory;
  estimatedDuration: number;
  requiredSkills: string[];
  instructions: TaskInstruction[];
  equipment: Equipment[];
  baseCompensation: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
