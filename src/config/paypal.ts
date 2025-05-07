import { ReactPayPalScriptOptions } from "@paypal/react-paypal-js";

/**
 * PayPal SDK configuration
 */
export const paypalConfig: ReactPayPalScriptOptions = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
  currency: "USD",
  intent: "capture",
  components: "buttons",
  // Enable credit card funding
  "disable-funding": "",
};
