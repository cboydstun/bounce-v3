"use client";

import { useState, useEffect } from "react";
import { CheckoutState } from "../utils/checkoutReducer";
import PayPalButton from "../PayPalButton";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface Step5Props {
  state: CheckoutState;
  dispatch: React.Dispatch<any>;
  onPaymentSuccess: (details: any) => void;
}

const Step5_Payment: React.FC<Step5Props> = ({
  state,
  dispatch,
  onPaymentSuccess,
}) => {
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Create the order in the database when the component mounts
  useEffect(() => {
    const createOrder = async () => {
      if (orderCreated || isCreatingOrder || state.orderId) return;

      setIsCreatingOrder(true);
      setOrderError(null);

      try {
        // Prepare order data
        const orderData = {
          customerName: state.customerName,
          customerEmail: state.customerEmail,
          customerPhone: state.customerPhone,
          customerAddress: state.customerAddress,
          customerCity: state.customerCity,
          customerState: state.customerState,
          customerZipCode: state.customerZipCode,
          items: [
            {
              type: "bouncer",
              name: state.bouncerName,
              quantity: 1,
              unitPrice: state.bouncerPrice,
              totalPrice: state.bouncerPrice,
            },
            ...state.extras
              .filter((extra) => extra.selected)
              .map((extra) => ({
                type: "extra",
                name: extra.name,
                quantity: 1,
                unitPrice: extra.price,
                totalPrice: extra.price,
              })),
          ],
          subtotal: state.subtotal,
          taxAmount: state.taxAmount,
          discountAmount: state.discountAmount,
          deliveryFee: state.deliveryFee,
          processingFee: state.processingFee,
          totalAmount: state.totalAmount,
          paymentMethod: "paypal",
          notes: `Delivery: ${state.deliveryDate} ${state.deliveryTime}, Pickup: ${state.pickupDate} ${state.pickupTime}${
            state.deliveryInstructions
              ? `, Instructions: ${state.deliveryInstructions}`
              : ""
          }`,
        };

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
            errorData.error || "Failed to create order. Please try again."
          );
        }

        const order = await response.json();
        
        // Store order ID and number in state
        dispatch({ type: "SET_ORDER_ID", payload: order._id });
        dispatch({ type: "SET_ORDER_NUMBER", payload: order.orderNumber });
        
        setOrderCreated(true);
      } catch (error) {
        console.error("Error creating order:", error);
        setOrderError(
          error instanceof Error
            ? error.message
            : "Failed to create order. Please try again."
        );
      } finally {
        setIsCreatingOrder(false);
      }
    };

    createOrder();
  }, [
    state.customerName,
    state.customerEmail,
    state.customerPhone,
    state.customerAddress,
    state.customerCity,
    state.customerState,
    state.customerZipCode,
    state.bouncerName,
    state.bouncerPrice,
    state.extras,
    state.subtotal,
    state.taxAmount,
    state.discountAmount,
    state.deliveryFee,
    state.processingFee,
    state.totalAmount,
    state.deliveryDate,
    state.deliveryTime,
    state.pickupDate,
    state.pickupTime,
    state.deliveryInstructions,
    state.orderId,
    orderCreated,
    isCreatingOrder,
    dispatch,
  ]);

  // Handle PayPal payment success
  const handlePaymentSuccess = async (details: any) => {
    try {
      // Process payment
      const paymentDetails = {
        transactionId: details.id,
        payerId: details.payer.payer_id,
        payerEmail: details.payer.email_address,
        amount: state.totalAmount,
        currency: "USD",
        status: details.status.toUpperCase(),
      };

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
          errorData.error || "Failed to process payment. Please try again."
        );
      }

      // Call the onPaymentSuccess callback
      onPaymentSuccess(details);
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
  const handlePaymentError = (error: any) => {
    console.error("PayPal payment error:", error);
    dispatch({
      type: "PAYMENT_ERROR",
      payload:
        error instanceof Error
          ? error.message
          : "Payment failed. Please try again.",
    });
  };

  // If payment is complete, show confirmation
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
              <span className="font-medium">${state.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-medium">PayPal</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Status:</span>
              <span className="font-medium text-green-600">Paid</span>
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
            onClick={() => dispatch({ type: "PAYMENT_ERROR", payload: null })}
            className="inline-block px-6 py-3 bg-primary-purple text-white rounded-lg font-medium hover:bg-primary-purple/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Payment</h2>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Order Summary</h3>
          <span className="font-bold text-xl">${state.totalAmount.toFixed(2)}</span>
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
            <PayPalButton
              amount={state.totalAmount}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              disabled={!state.orderId}
            />
          )}
        </div>
      </div>

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
              Your payment information is securely processed by PayPal. We do not
              store your payment details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step5_Payment;
