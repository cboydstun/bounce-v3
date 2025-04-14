import {
  CheckoutState,
  CheckoutAction,
  EXTRAS,
  OrderStep,
  steps,
} from "./types";
import { PaymentStatus } from "@/types/order";

// Define the initial state
export const initialState: CheckoutState = {
  currentStep: "delivery",

  // Step 1
  selectedBouncer: "",
  bouncerName: "",
  bouncerPrice: 0,
  deliveryDate: "",
  deliveryTime: "",
  pickupDate: "",
  pickupTime: "",

  // Step 2
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  customerAddress: "",
  customerCity: "",
  customerState: "TX", // Default to Texas
  customerZipCode: "",
  deliveryInstructions: "",

  // Step 3
  extras: EXTRAS.map((extra) => ({
    ...extra,
    selected: false,
  })),

  // Step 4
  subtotal: 0,
  taxAmount: 0,
  deliveryFee: 20, // Default delivery fee
  processingFee: 0,
  discountAmount: 0,
  totalAmount: 0,
  agreedToTerms: false,

  // Step 5
  paymentMethod: "paypal",
  paymentStatus: "Pending",
  orderId: "",
  orderNumber: "",
  paymentComplete: false,
  paymentError: null,

  // Validation
  errors: {},
  isFormValid: false,
};

// Helper function to get the next step
const getNextStep = (currentStep: OrderStep): OrderStep => {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);
  if (currentIndex < steps.length - 1) {
    return steps[currentIndex + 1].id;
  }
  return currentStep;
};

// Helper function to get the previous step
const getPreviousStep = (currentStep: OrderStep): OrderStep => {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);
  if (currentIndex > 0) {
    return steps[currentIndex - 1].id;
  }
  return currentStep;
};

// Define the reducer function
export const checkoutReducer = (
  state: CheckoutState,
  action: CheckoutAction,
): CheckoutState => {
  switch (action.type) {
    case "NEXT_STEP":
      return {
        ...state,
        currentStep: getNextStep(state.currentStep),
        errors: {},
      };

    case "PREVIOUS_STEP":
      return {
        ...state,
        currentStep: getPreviousStep(state.currentStep),
        errors: {},
      };

    case "GO_TO_STEP":
      return {
        ...state,
        currentStep: action.payload,
        errors: {},
      };

    case "SET_BOUNCER":
      return {
        ...state,
        selectedBouncer: action.payload.id,
        bouncerName: action.payload.name,
        bouncerPrice: action.payload.price,
      };

    case "SET_DELIVERY_DATE":
      return {
        ...state,
        deliveryDate: action.payload,
      };

    case "SET_DELIVERY_TIME":
      return {
        ...state,
        deliveryTime: action.payload,
      };

    case "SET_PICKUP_DATE":
      return {
        ...state,
        pickupDate: action.payload,
      };

    case "SET_PICKUP_TIME":
      return {
        ...state,
        pickupTime: action.payload,
      };

    case "SET_CUSTOMER_INFO":
      return {
        ...state,
        ...action.payload,
      };

    case "TOGGLE_EXTRA":
      return {
        ...state,
        extras: state.extras.map((extra) =>
          extra.id === action.payload
            ? { ...extra, selected: !extra.selected }
            : extra,
        ),
      };

    case "UPDATE_PRICES":
      return {
        ...state,
        ...action.payload,
      };

    case "SET_ORDER_ID":
      return {
        ...state,
        orderId: action.payload,
      };

    case "SET_ORDER_NUMBER":
      return {
        ...state,
        orderNumber: action.payload,
      };

    case "TOGGLE_AGREED_TO_TERMS":
      return {
        ...state,
        agreedToTerms: !state.agreedToTerms,
      };

    case "PAYMENT_SUCCESS":
      return {
        ...state,
        paymentComplete: true,
        paymentStatus: "Paid",
        paymentError: null,
      };

    case "PAYMENT_ERROR":
      return {
        ...state,
        paymentError: action.payload,
      };

    case "SET_ERRORS":
      return {
        ...state,
        errors: action.payload,
        isFormValid: Object.keys(action.payload).length === 0,
      };

    case "CLEAR_ERRORS":
      return {
        ...state,
        errors: {},
        isFormValid: true,
      };

    default:
      return state;
  }
};
