import { OrderStatus, PaymentStatus } from "@/types/order";

export const ORDER_STATUSES: OrderStatus[] = [
  "Pending",
  "Processing",
  "Paid",
  "Confirmed",
  "Cancelled",
  "Refunded",
];

export const PAYMENT_STATUSES: PaymentStatus[] = [
  "Pending",
  "Authorized",
  "Paid",
  "Failed",
  "Refunded",
  "Partially Refunded",
];

export const TASK_STATUSES = [
  "Pending",
  "Assigned",
  "In Progress",
  "Completed",
  "Cancelled",
];

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export const DATE_RANGE_FILTERS = {
  NONE: "none",
  WEEK: "week",
  MONTH: "month",
  YEAR: "year",
  SATURDAY: "saturday",
  WEEKEND: "weekend",
} as const;

export type DateRangeFilter =
  (typeof DATE_RANGE_FILTERS)[keyof typeof DATE_RANGE_FILTERS];

export const VIEW_MODES = {
  TABLE: "table",
  TIMELINE: "timeline",
} as const;

export type ViewMode = (typeof VIEW_MODES)[keyof typeof VIEW_MODES];
