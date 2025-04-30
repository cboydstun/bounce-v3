import {
  CheckoutState,
  CheckoutAction,
  EXTRAS,
  OrderStep,
  steps,
} from "./types";
import { PaymentStatus, OrderStatus, PaymentMethod } from "@/types/order";

// Helper function to calculate specific time charge
const calculateSpecificTimeCharge = (
  deliveryTimePreference: "flexible" | "specific",
  pickupTimePreference: "flexible" | "specific",
): number => {
  let charge = 0;

  // $10 charge for specific delivery time
  if (deliveryTimePreference === "specific") {
    charge += 10;
  }

  // Additional $10 charge for specific pickup time
  if (pickupTimePreference === "specific") {
    charge += 10;
  }

  return charge;
};

// Define the initial state
export const initialState: CheckoutState = {
  currentStep: "delivery",

  // Step 1
  selectedBouncers: [],
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
  slushyMixers: [], // Initialize empty array for slushy mixers

  // Step 4
  subtotal: 0,
  taxAmount: 0,
  deliveryFee: 20, // Default delivery fee
  processingFee: 0,
  discountAmount: 0,
  totalAmount: 0,
  agreedToTerms: false,

  // Step 5
  paymentMethod: "paypal" as PaymentMethod,
  paymentStatus: "Pending",
  orderId: "",
  orderNumber: "",
  paymentComplete: false,
  paymentError: null,

  // Additional Order fields
  contactId: undefined,
  orderStatus: "Pending" as OrderStatus,
  paypalTransactions: [],
  depositAmount: 0,
  balanceDue: 0,
  tasks: [],

  // Validation
  errors: {},
  isFormValid: false,

  // Loading state
  isLoading: false,
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
      // For backward compatibility, also update the selectedBouncers array
      return {
        ...state,
        selectedBouncer: action.payload.id,
        bouncerName: action.payload.name,
        bouncerPrice: action.payload.price,
        // Clear existing bouncers and add this one
        selectedBouncers: [
          {
            id: action.payload.id,
            name: action.payload.name,
            price: action.payload.price,
            quantity: 1,
          },
        ],
      };

    case "ADD_BOUNCER":
      // Don't add if already 3 bouncers or if this bouncer is already in the list
      if (
        state.selectedBouncers.length >= 3 ||
        state.selectedBouncers.some((b) => b.id === action.payload.id)
      ) {
        return state;
      }

      // Add the new bouncer to the array with quantity fixed at 1
      return {
        ...state,
        selectedBouncers: [
          ...state.selectedBouncers,
          {
            id: action.payload.id,
            name: action.payload.name,
            price: action.payload.price,
            quantity: 1, // Fixed at 1, cannot be changed
            image: action.payload.image,
          },
        ],
      };

    case "REMOVE_BOUNCER":
      // Remove the bouncer with the specified id
      return {
        ...state,
        selectedBouncers: state.selectedBouncers.filter(
          (bouncer) => bouncer.id !== action.payload,
        ),
      };

    case "UPDATE_BOUNCER_QUANTITY":
      // Update the quantity of the specified bouncer
      return {
        ...state,
        selectedBouncers: state.selectedBouncers.map((bouncer) =>
          bouncer.id === action.payload.id
            ? { ...bouncer, quantity: Math.max(1, action.payload.quantity) }
            : bouncer,
        ),
      };

    case "CALCULATE_BOUNCER_DISCOUNTS":
      // IMPORTANT: Always sort bouncers by price (highest to lowest)
      // to ensure the most expensive bouncer gets full price
      // and cheaper bouncers get the 50% discount
      const sortedBouncers = [...state.selectedBouncers].sort(
        (a, b) => b.price - a.price,
      );

      // Apply discounts: most expensive bouncer (index 0) gets full price,
      // additional bouncers get 50% off
      return {
        ...state,
        selectedBouncers: sortedBouncers.map((bouncer, index) => {
          const discount = index === 0 ? 1 : 0.5;
          return {
            ...bouncer,
            discountedPrice: bouncer.price * discount,
          };
        }),
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
          state.pickupTimePreference,
        ),
      };

    case "SET_PICKUP_TIME_PREFERENCE":
      return {
        ...state,
        pickupTimePreference: action.payload,
        // Reset specific time charge when preferences change
        specificTimeCharge: calculateSpecificTimeCharge(
          state.deliveryTimePreference,
          action.payload,
        ),
      };

    case "UPDATE_SPECIFIC_TIME_CHARGE":
      return {
        ...state,
        specificTimeCharge: calculateSpecificTimeCharge(
          state.deliveryTimePreference,
          state.pickupTimePreference,
        ),
      };

    case "SET_CUSTOMER_INFO":
      return {
        ...state,
        ...action.payload,
      };

    case "TOGGLE_EXTRA":
      // If we're toggling a slushy machine and turning it off, clear the mixers
      const isSlushyMachine = action.payload.includes("slushyMachine");
      const extra = state.extras.find((e) => e.id === action.payload);
      const isDeselecting = extra?.selected;

      // If deselecting a slushy machine, clear only the mixers for this machine
      if (isSlushyMachine && isDeselecting) {
        return {
          ...state,
          extras: state.extras.map((extra) =>
            extra.id === action.payload
              ? { ...extra, selected: !extra.selected }
              : extra,
          ),
          slushyMixers: state.slushyMixers.filter(
            (mixer) => mixer.machineId !== action.payload,
          ), // Clear only mixers for this machine
        };
      }

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
          extra.id === action.payload &&
          extra.id === "tablesChairs" &&
          extra.quantity > 1
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
        orderStatus: "Paid",
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

    // New action handlers for additional Order fields
    case "SET_CONTACT_ID":
      return {
        ...state,
        contactId: action.payload,
      };

    case "SET_ORDER_STATUS":
      return {
        ...state,
        orderStatus: action.payload,
      };

    case "ADD_PAYPAL_TRANSACTION":
      return {
        ...state,
        paypalTransactions: [...state.paypalTransactions, action.payload],
      };

    case "SET_DEPOSIT_AMOUNT":
      return {
        ...state,
        depositAmount: action.payload,
        // Also update balance due
        balanceDue: state.totalAmount - action.payload,
      };

    case "UPDATE_BALANCE_DUE":
      return {
        ...state,
        balanceDue: state.totalAmount - state.depositAmount,
      };

    case "ADD_TASK":
      return {
        ...state,
        tasks: [...state.tasks, action.payload],
      };

    case "REMOVE_TASK":
      return {
        ...state,
        tasks: state.tasks.filter((task) => task !== action.payload),
      };

    case "SET_PAYMENT_METHOD":
      return {
        ...state,
        paymentMethod: action.payload,
      };

    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };

    case "CASH_ORDER_SUCCESS":
      return {
        ...state,
        paymentComplete: true,
        paymentStatus: "Pending",
        orderStatus: "Pending",
        paymentError: null,
      };

    case "ORDER_ERROR":
      return {
        ...state,
        paymentError: action.payload,
      };

    // New actions for slushy mixer selection
    case "SELECT_SLUSHY_MIXER":
      return {
        ...state,
        slushyMixers: [
          ...state.slushyMixers.filter(
            (mixer) =>
              !(
                mixer.machineId === action.payload.machineId &&
                mixer.tankNumber === action.payload.tankNumber
              ),
          ),
          action.payload,
        ],
      };

    case "CLEAR_SLUSHY_MIXERS":
      return {
        ...state,
        slushyMixers: [],
      };

    default:
      return state;
  }
};
