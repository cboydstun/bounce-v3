import { OrderItem, PaymentStatus } from "@/types/order";

// Define the step types
export type OrderStep = "delivery" | "details" | "extras" | "review" | "payment";

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

// Define the extras with their prices
export const EXTRAS = [
  { id: "tablesChairs", name: "Tables & Chairs", price: 25, image: "🪑" },
  { id: "generator", name: "Generator", price: 50, image: "⚡" },
  { id: "popcornMachine", name: "Popcorn Machine", price: 35, image: "🍿" },
  { id: "cottonCandyMachine", name: "Cotton Candy Machine", price: 35, image: "🍭" },
  { id: "snowConeMachine", name: "Snow Cone Machine", price: 35, image: "🧊" },
  { id: "basketballShoot", name: "Basketball Shoot", price: 30, image: "🏀" },
  { id: "slushyMachine", name: "Slushy Machine", price: 40, image: "🥤" },
  { id: "overnight", name: "Overnight Rental", price: 75, image: "🌙" },
];

// Define the checkout state interface
export interface CheckoutState{
  // Current step
  currentStep: OrderStep;
  
  // Step 1: Rental Selection
  selectedBouncer: string;
  bouncerName: string;
  bouncerPrice: number;
  deliveryDate: string;
  deliveryTime: string;
  pickupDate: string;
  pickupTime: string;
  
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
    image: string;
  }[];
  
  // Step 4: Order Review (calculated from above)
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  processingFee: number;
  discountAmount: number;
  totalAmount: number;
  agreedToTerms: boolean;
  
  // Step 5: Payment
  paymentMethod: "paypal";
  paymentStatus: PaymentStatus;
  orderId: string;
  orderNumber: string;
  paymentComplete: boolean;
  paymentError: string | null;
  
  // Form validation
  errors: Record<string, string>;
  isFormValid: boolean;
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
export type StepProps = Step1Props | Step2Props | Step3Props | Step4Props | Step5Props;

// Define action types
export type CheckoutAction =
  | { type: "NEXT_STEP" }
  | { type: "PREVIOUS_STEP" }
  | { type: "GO_TO_STEP"; payload: OrderStep }
  | { type: "SET_BOUNCER"; payload: { id: string; name: string; price: number } }
  | { type: "SET_DELIVERY_DATE"; payload: string }
  | { type: "SET_DELIVERY_TIME"; payload: string }
  | { type: "SET_PICKUP_DATE"; payload: string }
  | { type: "SET_PICKUP_TIME"; payload: string }
  | { type: "SET_CUSTOMER_INFO"; payload: Partial<CheckoutState> }
  | { type: "TOGGLE_EXTRA"; payload: string }
  | { type: "UPDATE_PRICES"; payload: Partial<CheckoutState> }
  | { type: "SET_ORDER_ID"; payload: string }
  | { type: "SET_ORDER_NUMBER"; payload: string }
  | { type: "TOGGLE_AGREED_TO_TERMS" }
  | { type: "PAYMENT_SUCCESS"; payload?: { transactionId: string } }
  | { type: "PAYMENT_ERROR"; payload: string }
  | { type: "SET_ERRORS"; payload: Record<string, string> }
  | { type: "CLEAR_ERRORS" };
