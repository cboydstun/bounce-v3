import {
  CheckoutState,
  CheckoutAction,
  EXTRAS,
  OrderStep,
  steps,
} from "./types";
import { PaymentStatus } from "@/types/order";

// Helper function to calculate specific time charge
const calculateSpecificTimeCharge = (
  deliveryTimePreference: "flexible" | "specific",
  pickupTimePreference: "flexible" | "specific"
): number => {
  let charge = 0;
  
  // $20 charge for specific delivery time
  if (deliveryTimePreference === "specific") {
    charge += 20;
  }
  
  // Additional $20 charge for specific pickup time
  if (pickupTimePreference === "specific") {
    charge += 20;
  }
  
  return charge;
};

// Define the initial state
export const initialState: CheckoutState = {
  currentStep: "delivery",

  // Step 1
  selectedBouncer: "",
  bouncerName: "",
  bouncerPrice: 0,
  deliveryDate: "",
  deliveryTime: "",
  deliveryTimePreference: "flexible",
  pickupDate: "",
  pickupTime: "",
  pickupTimePreference: "flexible",
  specificTimeCharge: 0,

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
    quantity: 1, // Default quantity
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
      
    case "SET_DELIVERY_TIME_PREFERENCE":
      return {
        ...state,
        deliveryTimePreference: action.payload,
        // Reset specific time charge when preferences change
        specificTimeCharge: calculateSpecificTimeCharge(
          action.payload,
          state.pickupTimePreference
        ),
      };
      
    case "SET_PICKUP_TIME_PREFERENCE":
      return {
        ...state,
        pickupTimePreference: action.payload,
        // Reset specific time charge when preferences change
        specificTimeCharge: calculateSpecificTimeCharge(
          state.deliveryTimePreference,
          action.payload
        ),
      };
      
    case "UPDATE_SPECIFIC_TIME_CHARGE":
      return {
        ...state,
        specificTimeCharge: calculateSpecificTimeCharge(
          state.deliveryTimePreference,
          state.pickupTimePreference
        ),
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
      
    case "INCREMENT_EXTRA_QUANTITY":
      return {
        ...state,
        extras: state.extras.map((extra) =>
          extra.id === action.payload && extra.id === "tablesChairs"
            ? { ...extra, quantity: extra.quantity + 1 }
            : extra,
        ),
      };
      
    case "DECREMENT_EXTRA_QUANTITY":
      return {
        ...state,
        extras: state.extras.map((extra) =>
          extra.id === action.payload && extra.id === "tablesChairs" && extra.quantity > 1
            ? { ...extra, quantity: extra.quantity - 1 }
            : extra,
        ),
      };
      
    case "SET_EXTRA_QUANTITY":
      return {
        ...state,
        extras: state.extras.map((extra) =>
          extra.id === action.payload.id && extra.id === "tablesChairs"
            ? { ...extra, quantity: Math.max(1, action.payload.quantity) }
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
