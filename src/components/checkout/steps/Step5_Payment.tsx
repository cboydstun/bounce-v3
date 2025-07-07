"use client";

import { useState, useEffect, useRef } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { CheckoutState, Step5Props } from "../utils/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const Step5_Payment: React.FC<Step5Props> = ({
  state,
  dispatch,
  onPaymentSuccess,
  onPaymentInitiation,
}) => {
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // StrictMode-proof guard: prevents double execution in development
  const orderCreationAttempted = useRef(false);
  const componentMountTime = useRef(Date.now());

  // Create the order in the database when the component mounts
  useEffect(() => {
    const createOrder = async () => {
      // StrictMode-proof guard: prevents double execution in development
      if (orderCreationAttempted.current) {
        console.log(
          "Order creation skipped: already attempted (StrictMode protection)",
          {
            attemptedAt: componentMountTime.current,
            timeSinceMount: Date.now() - componentMountTime.current,
          },
        );
        return;
      }

      // Enhanced guards to prevent duplicate order creation
      if (orderCreated || isCreatingOrder || state.orderId) {
        console.log("Order creation skipped:", {
          orderCreated,
          isCreatingOrder,
          orderId: state.orderId,
        });
        return;
      }

      // Additional guard: check if we have minimum required data
      if (
        !state.customerEmail ||
        (!state.selectedBouncers.length && !state.selectedBouncer)
      ) {
        console.log("Order creation skipped: insufficient data", {
          hasEmail: !!state.customerEmail,
          hasBouncers: state.selectedBouncers.length > 0,
          hasLegacyBouncer: !!state.selectedBouncer,
        });
        return;
      }

      // Additional guard: check if we have required customer info
      if (
        !state.customerName ||
        !state.customerAddress ||
        !state.deliveryDate ||
        !state.pickupDate
      ) {
        console.log("Order creation skipped: missing required customer info");
        return;
      }

      // Mark that we've attempted order creation (StrictMode protection)
      orderCreationAttempted.current = true;

      console.log("Creating order for PayPal payment...", {
        strictModeProtection: true,
        componentMountTime: componentMountTime.current,
        currentTime: Date.now(),
      });
      setIsCreatingOrder(true);
      setOrderError(null);

      try {
        // Prepare order data with complete model
        const orderData = {
          // Customer information
          contactId: state.contactId,
          customerName: state.customerName,
          customerEmail: state.customerEmail,
          customerPhone: state.customerPhone,
          customerAddress: state.customerAddress,
          customerCity: state.customerCity,
          customerState: state.customerState,
          customerZipCode: state.customerZipCode,

          // Delivery preferences
          deliveryTimePreference: state.deliveryTimePreference,
          pickupTimePreference: state.pickupTimePreference,
          specificTimeCharge: state.specificTimeCharge,

          // Order items - use the same logic as cash orders
          items: (() => {
            const orderItems = [];

            // Add bouncers
            if (state.selectedBouncers.length > 0) {
              // Use new multi-bouncer selection
              orderItems.push(
                ...state.selectedBouncers.map((bouncer) => ({
                  type: "bouncer",
                  name: bouncer.name,
                  quantity: 1,
                  unitPrice: bouncer.price,
                  totalPrice: bouncer.discountedPrice || bouncer.price,
                })),
              );
            } else if (state.selectedBouncer && state.bouncerName) {
              // Fallback to legacy single bouncer
              orderItems.push({
                type: "bouncer",
                name: state.bouncerName,
                quantity: 1,
                unitPrice: state.bouncerPrice || 0,
                totalPrice: state.bouncerPrice || 0,
              });
            }

            // Add selected extras
            const selectedExtras = state.extras
              .filter((extra) => extra.selected)
              .map((extra) => ({
                type: "extra",
                name: extra.name,
                quantity: extra.id === "tablesChairs" ? extra.quantity : 1,
                unitPrice: extra.price,
                totalPrice:
                  extra.price *
                  (extra.id === "tablesChairs" ? extra.quantity : 1),
              }));
            orderItems.push(...selectedExtras);

            // Add selected mixers
            if (state.slushyMixers) {
              const selectedMixers = state.slushyMixers
                .filter((mixer) => mixer.mixerId !== "none")
                .map((mixer) => ({
                  type: "extra",
                  name: `Mixer (Tank ${mixer.tankNumber}): ${mixer.name}`,
                  quantity: 1,
                  unitPrice: mixer.price,
                  totalPrice: mixer.price,
                }));
              orderItems.push(...selectedMixers);
            }

            return orderItems;
          })(),

          // Financial details
          subtotal: state.subtotal,
          taxAmount: state.taxAmount,
          discountAmount: state.discountAmount,
          deliveryFee: state.deliveryFee,
          processingFee: state.processingFee,
          totalAmount: state.totalAmount,
          depositAmount: state.depositAmount,
          balanceDue: state.balanceDue,

          // Status information
          status: state.orderStatus,
          paymentStatus: state.paymentStatus,
          paymentMethod: state.paymentMethod,

          // Event and delivery dates - FIXED: Now properly setting these fields
          deliveryDate: state.deliveryDate
            ? new Date(
                `${state.deliveryDate}T${state.deliveryTime || "12:00"}:00`,
              )
            : undefined,
          eventDate: state.deliveryDate
            ? new Date(
                `${state.deliveryDate}T${state.deliveryTime || "12:00"}:00`,
              )
            : undefined,

          // Additional information
          tasks: state.tasks,
          notes: `Delivery: ${state.deliveryDate} ${state.deliveryTime}, Pickup: ${state.pickupDate} ${state.pickupTime}${
            state.deliveryInstructions
              ? `, Instructions: ${state.deliveryInstructions}`
              : ""
          }`,
        };

        console.log("Sending order creation request...");

        // Create order
        const response = await fetch("/api/v1/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(orderData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to create order. Please try again.",
          );
        }

        const order = await response.json();

        console.log("Order created successfully:", order.orderNumber);

        // Store order ID and number in state
        dispatch({ type: "SET_ORDER_ID", payload: order._id });
        dispatch({ type: "SET_ORDER_NUMBER", payload: order.orderNumber });

        setOrderCreated(true);
      } catch (error) {
        console.error("Error creating order:", error);
        setOrderError(
          error instanceof Error
            ? error.message
            : "Failed to create order. Please try again.",
        );
      } finally {
        setIsCreatingOrder(false);
      }
    };

    createOrder();
  }, [
    // Simplified dependency array - only essential triggers that should cause order creation
    state.customerEmail,
    state.paymentMethod,
    orderCreated,
    isCreatingOrder,
    state.orderId,
    // Only include these if they're truly essential for determining when to create order
    state.customerName,
    state.customerAddress,
    state.deliveryDate,
    state.pickupDate,
  ]);

  // Handle PayPal payment success
  const handlePaymentSuccess = async (orderId: string) => {
    try {
      // Create PayPal transaction details
      const paymentDetails = {
        transactionId: orderId,
        payerId: "PAYPAL_PAYER", // We don't have this from the new PayPal SDK
        payerEmail: state.customerEmail, // Use customer email as fallback
        amount: state.totalAmount,
        currency: "USD",
        status: "COMPLETED",
      };

      // Add transaction to state
      dispatch({
        type: "ADD_PAYPAL_TRANSACTION",
        payload: {
          transactionId: orderId,
          payerId: "PAYPAL_PAYER",
          payerEmail: state.customerEmail,
          amount: state.totalAmount,
          currency: "USD",
          status: "COMPLETED",
          createdAt: new Date(),
        },
      });

      // Update order status based on payment
      if (state.depositAmount > 0 && state.depositAmount < state.totalAmount) {
        // If this was a deposit payment
        // Note: SET_PAYMENT_STATUS is not defined in CheckoutAction, so we don't dispatch it
        // Instead, we'll rely on the backend to update the payment status
      } else {
        // If this was a full payment
        // Note: SET_PAYMENT_STATUS is not defined in CheckoutAction, so we don't dispatch it
        // Instead, we'll rely on the backend to update the payment status
        dispatch({ type: "SET_ORDER_STATUS", payload: "Paid" });
      }

      // Process payment with backend
      const response = await fetch(`/api/v1/orders/${state.orderId}/payment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentDetails),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to process payment. Please try again.",
        );
      }

      // Call the onPaymentSuccess callback with a compatible format
      onPaymentSuccess({
        id: orderId,
        status: "COMPLETED",
        payer: {
          payer_id: "PAYPAL_PAYER",
          email_address: state.customerEmail,
        },
      });
    } catch (error) {
      console.error("Error processing payment:", error);
      dispatch({
        type: "PAYMENT_ERROR",
        payload:
          error instanceof Error
            ? error.message
            : "Failed to process payment. Please try again.",
      });
    }
  };

  // Handle PayPal payment error
  const handlePaymentError = (error: Error) => {
    console.error("PayPal payment error:", error);
    dispatch({
      type: "PAYMENT_ERROR",
      payload: error.message || "Payment failed. Please try again.",
    });
  };

  // For cash orders, show a different confirmation screen
  if (state.paymentMethod === "cash" && state.paymentComplete) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Order Confirmed!
          </h2>
          <p className="text-gray-600 mb-6">
            Your order has been placed successfully.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Order Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Order Number:</span>
              <span className="font-medium">{state.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-medium">
                ${state.totalAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-medium">Cash on Delivery</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Status:</span>
              <span className="font-medium text-yellow-600">
                Pending (Pay on Delivery)
              </span>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-md">
          <p className="text-yellow-800">
            <strong>Important:</strong> Please have the exact amount of $
            {state.depositAmount > 0
              ? state.depositAmount.toFixed(2)
              : state.totalAmount.toFixed(2)}{" "}
            ready on delivery.
            {state.depositAmount > 0 && (
              <span>
                {" "}
                The remaining balance of ${state.balanceDue.toFixed(2)} will be
                due at pickup.
              </span>
            )}
          </p>
        </div>

        <div className="bg-blue-50 p-4 rounded-md">
          <p className="text-blue-800">
            A confirmation email has been sent to {state.customerEmail}. If you
            have any questions about your order, please contact us at{" "}
            <a href="tel:5122100194" className="font-medium">
              (512) 210-0194
            </a>
            .
          </p>
        </div>

        <div className="text-center mt-6">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-primary-purple text-white rounded-lg font-medium hover:bg-primary-purple/90 transition-colors"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  // If payment is complete (PayPal), show confirmation
  if (state.paymentComplete) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Payment Successful!
          </h2>
          <p className="text-gray-600 mb-6">
            Your order has been placed and payment has been received.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Order Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Order Number:</span>
              <span className="font-medium">{state.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-medium">
                ${state.totalAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-medium">PayPal</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Status:</span>
              <span className="font-medium text-green-600">
                {state.paymentStatus}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Order Status:</span>
              <span className="font-medium text-green-600">
                {state.orderStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-md">
          <p className="text-blue-800">
            A confirmation email has been sent to {state.customerEmail}. If you
            have any questions about your order, please contact us at{" "}
            <a href="tel:5122100194" className="font-medium">
              (512) 210-0194
            </a>
            .
          </p>
        </div>

        <div className="text-center mt-6">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-primary-purple text-white rounded-lg font-medium hover:bg-primary-purple/90 transition-colors"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  // If there's a payment error, show error message
  if (state.paymentError) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Payment Failed
          </h2>
          <p className="text-red-600 mb-6">{state.paymentError}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">What to do next?</h3>
          <p className="text-gray-600 mb-4">
            You can try the following options:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Check your PayPal account balance and try again</li>
            <li>Try a different payment method</li>
            <li>
              Contact us at{" "}
              <a href="tel:5122100194" className="text-primary-purple">
                (512) 210-0194
              </a>{" "}
              for assistance
            </li>
          </ul>
        </div>

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => dispatch({ type: "PAYMENT_ERROR", payload: "" })}
            className="inline-block px-6 py-3 bg-primary-purple text-white rounded-lg font-medium hover:bg-primary-purple/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (state.isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Processing Order
        </h2>
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner className="w-10 h-10" />
          <span className="ml-3 text-lg">Creating your order...</span>
        </div>
      </div>
    );
  }

  // If there's a payment error, show error message
  if (state.paymentError) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Order Failed
          </h2>
          <p className="text-red-600 mb-6">{state.paymentError}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">What to do next?</h3>
          <p className="text-gray-600 mb-4">
            You can try the following options:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Go back and check your order details</li>
            <li>Try a different payment method</li>
            <li>
              Contact us at{" "}
              <a href="tel:5122100194" className="text-primary-purple">
                (512) 210-0194
              </a>{" "}
              for assistance
            </li>
          </ul>
        </div>

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => {
              dispatch({ type: "PAYMENT_ERROR", payload: "" });
              dispatch({ type: "GO_TO_STEP", payload: "review" });
            }}
            className="inline-block px-6 py-3 bg-primary-purple text-white rounded-lg font-medium hover:bg-primary-purple/90 transition-colors"
          >
            Back to Review
          </button>
        </div>
      </div>
    );
  }

  // Default payment page (PayPal)
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Payment</h2>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Order Summary</h3>
          <span className="font-bold text-xl">
            $
            {(state.depositAmount > 0
              ? state.depositAmount
              : state.totalAmount
            ).toFixed(2)}
          </span>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <p className="text-gray-600 mb-4">
            Please complete your payment using PayPal. You will be redirected to
            PayPal to securely process your payment.
          </p>

          {isCreatingOrder ? (
            <div className="flex justify-center items-center py-8">
              <LoadingSpinner className="w-8 h-8" />
              <span className="ml-2">Creating your order...</span>
            </div>
          ) : orderError ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
              <p className="font-medium">Error creating order:</p>
              <p>{orderError}</p>
              <button
                type="button"
                onClick={() => {
                  setOrderError(null);
                  setOrderCreated(false);
                }}
                className="mt-2 text-primary-purple hover:underline"
              >
                Try Again
              </button>
            </div>
          ) : (
            <PayPalScriptProvider
              options={{
                clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
                currency: "USD",
                intent: "capture",
                components: "buttons",
                // Enable credit card funding
                "disable-funding": "",
              }}
            >
              <div className="w-full my-4">
                {!state.orderId ? (
                  <div className="bg-gray-100 p-4 rounded-md text-center text-gray-500">
                    PayPal payment is disabled until order details are
                    confirmed.
                  </div>
                ) : (
                  <PayPalButtons
                    style={{
                      layout: "vertical",
                      color: "gold",
                      shape: "rect",
                      label: "pay",
                      height: 45,
                    }}
                    disabled={!state.orderId}
                    forceReRender={[
                      state.depositAmount > 0
                        ? state.depositAmount
                        : state.totalAmount,
                      state.orderId,
                    ]}
                    createOrder={(data, actions) => {
                      const paymentAmount =
                        state.depositAmount > 0
                          ? state.depositAmount
                          : state.totalAmount;

                      // Call the payment initiation handler if provided
                      if (onPaymentInitiation) {
                        onPaymentInitiation();
                      }

                      return actions.order.create({
                        intent: "CAPTURE",
                        purchase_units: [
                          {
                            amount: {
                              value: paymentAmount.toFixed(2),
                              currency_code: "USD",
                            },
                            description:
                              state.depositAmount > 0
                                ? "Bounce House Rental - Deposit Payment"
                                : "Bounce House Rental - Full Payment",
                          },
                        ],
                        application_context: {
                          shipping_preference: "NO_SHIPPING",
                          user_action: "PAY_NOW",
                        },
                      });
                    }}
                    onApprove={async (data, actions) => {
                      try {
                        if (!actions.order) {
                          throw new Error("PayPal order actions not available");
                        }

                        const orderDetails = await actions.order.capture();

                        // Call the success handler with the order ID
                        handlePaymentSuccess(
                          orderDetails.id ?? "UNKNOWN_ORDER_ID",
                        );
                      } catch (error) {
                        console.error("Error capturing PayPal order:", error);
                        handlePaymentError(
                          error instanceof Error
                            ? error
                            : new Error(String(error)),
                        );
                      }
                    }}
                    onError={(err) => {
                      console.error("PayPal Error:", err);
                      handlePaymentError(
                        err instanceof Error ? err : new Error(String(err)),
                      );
                    }}
                    onCancel={() => {
                      console.log("Payment cancelled by user");
                    }}
                  />
                )}
              </div>
            </PayPalScriptProvider>
          )}
        </div>
      </div>

      {state.depositAmount > 0 && (
        <div className="bg-yellow-50 p-4 rounded-md">
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-yellow-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                <strong>Deposit Payment:</strong> You are paying a deposit of $
                {state.depositAmount.toFixed(2)} now. The remaining balance of $
                {state.balanceDue.toFixed(2)} will be due on the day of
                delivery.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-md">
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-0.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-blue-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-800">
              Your payment information is securely processed by PayPal. We do
              not store your payment details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step5_Payment;
