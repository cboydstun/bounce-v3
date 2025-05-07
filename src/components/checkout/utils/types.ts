import {
  OrderItem,
  PaymentStatus,
  OrderStatus,
  PaymentMethod,
  PayPalTransactionDetails,
  TimePreference,
} from "@/types/order";

// Define availability result interface
export interface AvailabilityResult {
  available: boolean;
  reason?: string;
}

// Define the step types
export type OrderStep =
  | "delivery"
  | "details"
  | "extras"
  | "review"
  | "payment";

// Define the step configuration
export interface StepConfig {
  id: OrderStep;
  label: string;
}

// Define the steps array
export const steps: StepConfig[] = [
  { id: "delivery", label: "Rental Selection" },
  { id: "details", label: "Delivery Info" },
  { id: "extras", label: "Add Extras" },
  { id: "review", label: "Review Order" },
  { id: "payment", label: "Payment" },
];

// Define the slushy mixer options
export const SLUSHY_MIXERS = [
  { id: "none", name: "None", price: 0.0 },
  { id: "grape", name: "Grape Kool Aid", price: 19.95 },
  { id: "cherry", name: "Cherry Kool Aid", price: 19.95 },
  { id: "margarita", name: "Margarita", price: 19.95 },
  { id: "strawberry", name: "Strawberry Daiquiri", price: 24.95 },
  { id: "pinacolada", name: "Piña Colada", price: 24.95 },
];

// Define the extras with their prices
export const EXTRAS = [
  { id: "tablesChairs", name: "Tables & Chairs", price: 19.95, image: "🪑" },
  { id: "generator", name: "Generator", price: 49.95, image: "⚡" },
  { id: "popcornMachine", name: "Popcorn Machine", price: 49.95, image: "🍿" },
  {
    id: "cottonCandyMachine",
    name: "Cotton Candy Machine",
    price: 49.95,
    image: "🍭",
  },
  {
    id: "snowConeMachine",
    name: "Snow Cone Machine",
    price: 49.95,
    image: "🧊",
  },
  {
    id: "basketballShoot",
    name: "Basketball Shoot",
    price: 49.95,
    image: "🏀",
  },
  {
    id: "slushyMachineSingle",
    name: "Single Tank Slushy Machine",
    price: 124.95,
    image: "🥤",
  },
  {
    id: "slushyMachineDouble",
    name: "Double Tank Slushy Machine",
    price: 149.95,
    image: "🥤🥤",
  },
  {
    id: "slushyMachineTriple",
    name: "Triple Tank Slushy Machine",
    price: 174.95,
    image: "🥤🥤🥤",
  },
  { id: "overnight", name: "Overnight Rental", price: 49.95, image: "🌙" },
];

// Define a bouncer item interface
export interface BouncerItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  discountedPrice?: number;
  image?: string;
}

// Define a slushy mixer interface
export interface SlushyMixer {
  machineId: string; // Add this field to identify which machine the mixer belongs to
  tankNumber: number;
  mixerId: string;
  name: string;
  price: number;
}

// Define the checkout state interface
export interface CheckoutState {
  // Current step
  currentStep: OrderStep;

  // Step 1: Rental Selection
  selectedBouncers: BouncerItem[];
  // Keep these for backward compatibility during transition
  selectedBouncer: string;
  bouncerName: string;
  bouncerPrice: number;
  // Availability tracking
  availabilityChecks: {
    status: "idle" | "loading" | "success" | "error";
    results: Record<string, AvailabilityResult>;
    lastCheckedDate: string | null;
  };
  deliveryDate: string;
  deliveryTime: string;
  deliveryTimePreference: "flexible" | "specific";
  pickupDate: string;
  pickupTime: string;
  pickupTimePreference: "flexible" | "specific";
  specificTimeCharge: number;

  // Step 2: Delivery Information
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerState: string;
  customerZipCode: string;
  deliveryInstructions?: string;

  // Step 3: Extras
  extras: {
    id: string;
    name: string;
    price: number;
    selected: boolean;
    quantity: number;
    image: string;
  }[];
  slushyMixers: SlushyMixer[];

  // Step 4: Order Review (calculated from above)
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  processingFee: number;
  discountAmount: number;
  totalAmount: number;
  agreedToTerms: boolean;

  // Multiple day rental properties
  rentalDays?: number;
  dayMultiplier?: number;
  overnightFee?: number;

  // Step 5: Payment
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderId: string;
  orderNumber: string;
  paymentComplete: boolean;
  paymentError: string | null;

  // Additional Order fields from Order model
  contactId?: string;
  orderStatus: OrderStatus;
  paypalTransactions: PayPalTransactionDetails[];
  depositAmount: number;
  balanceDue: number;
  tasks: string[];

  // Form validation
  errors: Record<string, string>;
  isFormValid: boolean;

  // Loading state
  isLoading?: boolean;
}

// Define base props for step components
export interface BaseStepProps {
  state: CheckoutState;
  dispatch: React.Dispatch<CheckoutAction>;
}

// Define props for Step1_RentalSelection
export interface Step1Props extends BaseStepProps {
  onAvailabilityError?: (errorMsg: string | null) => void;
}

// Define props for Step2_DeliveryInfo
export interface Step2Props extends BaseStepProps {}

// Define props for Step3_Extras
export interface Step3Props extends BaseStepProps {}

// Define props for Step4_OrderReview
export interface Step4Props extends BaseStepProps {
  onEditStep: (step: OrderStep) => void;
}

// Define props for Step5_Payment
export interface Step5Props extends BaseStepProps {
  onPaymentSuccess: (details: any) => void;
}

// Union type for all step props
export type StepProps =
  | Step1Props
  | Step2Props
  | Step3Props
  | Step4Props
  | Step5Props;

// Define action types
export type CheckoutAction =
  | { type: "NEXT_STEP" }
  | { type: "PREVIOUS_STEP" }
  | { type: "GO_TO_STEP"; payload: OrderStep }
  | {
      type: "SET_BOUNCER";
      payload: { id: string; name: string; price: number };
    }
  | {
      type: "ADD_BOUNCER";
      payload: { id: string; name: string; price: number; image?: string };
    }
  | { type: "REMOVE_BOUNCER"; payload: string }
  | {
      type: "UPDATE_BOUNCER_QUANTITY";
      payload: { id: string; quantity: number };
    }
  | { type: "CALCULATE_BOUNCER_DISCOUNTS" }
  | { type: "SET_DELIVERY_DATE"; payload: string }
  | { type: "SET_DELIVERY_TIME"; payload: string }
  | { type: "SET_DELIVERY_TIME_PREFERENCE"; payload: "flexible" | "specific" }
  | { type: "SET_PICKUP_DATE"; payload: string }
  | { type: "SET_PICKUP_TIME"; payload: string }
  | { type: "SET_PICKUP_TIME_PREFERENCE"; payload: "flexible" | "specific" }
  | { type: "UPDATE_SPECIFIC_TIME_CHARGE" }
  | { type: "SET_CUSTOMER_INFO"; payload: Partial<CheckoutState> }
  | { type: "TOGGLE_EXTRA"; payload: string }
  | { type: "INCREMENT_EXTRA_QUANTITY"; payload: string }
  | { type: "DECREMENT_EXTRA_QUANTITY"; payload: string }
  | { type: "SET_EXTRA_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "UPDATE_PRICES"; payload: Partial<CheckoutState> }
  | { type: "SET_ORDER_ID"; payload: string }
  | { type: "SET_ORDER_NUMBER"; payload: string }
  | { type: "TOGGLE_AGREED_TO_TERMS" }
  | { type: "PAYMENT_SUCCESS"; payload?: { transactionId: string } }
  | { type: "PAYMENT_ERROR"; payload: string }
  | { type: "SET_ERRORS"; payload: Record<string, string> }
  | { type: "CLEAR_ERRORS" }
  // New actions for additional Order fields
  | { type: "SET_CONTACT_ID"; payload: string }
  | { type: "SET_ORDER_STATUS"; payload: OrderStatus }
  | { type: "ADD_PAYPAL_TRANSACTION"; payload: PayPalTransactionDetails }
  | { type: "SET_DEPOSIT_AMOUNT"; payload: number }
  | { type: "UPDATE_BALANCE_DUE" }
  | { type: "ADD_TASK"; payload: string }
  | { type: "REMOVE_TASK"; payload: string }
  | { type: "SET_PAYMENT_METHOD"; payload: PaymentMethod }
  // New actions for cash payment flow
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "CASH_ORDER_SUCCESS" }
  | { type: "ORDER_ERROR"; payload: string }
  // New actions for slushy mixer selection
  | { type: "SELECT_SLUSHY_MIXER"; payload: SlushyMixer }
  | { type: "CLEAR_SLUSHY_MIXERS" }
  // New actions for availability checking
  | { type: "CHECK_AVAILABILITY"; payload: { date: string } }
  | {
      type: "SET_AVAILABILITY_RESULTS";
      payload: { results: Record<string, AvailabilityResult> };
    }
  | { type: "SET_AVAILABILITY_ERROR" };
