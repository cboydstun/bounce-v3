"use client";

import { useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

export default function PayPalTestPage() {
  const [amount, setAmount] = useState(10.0);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string>(
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
  );

  const handleSuccess = (details: any) => {
    setTestResult(JSON.stringify(details, null, 2));
    setTestError(null);
  };

  const handleError = (error: any) => {
    console.error("Payment error:", error);
    setTestError(error instanceof Error ? error.message : String(error));
    setTestResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">PayPal Integration Test Page</h1>

      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">PayPal Configuration</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="col-span-2 md:col-span-1">
            <div className="bg-gray-100 p-4 rounded-md">
              <h3 className="font-medium mb-2">Client ID</h3>
              <p className="mb-1 break-all">
                <span className="font-medium">Current:</span>{" "}
                <span className={clientId ? "text-green-600" : "text-red-600"}>
                  {clientId ? clientId : "Missing"}
                </span>
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This is loaded from your NEXT_PUBLIC_PAYPAL_CLIENT_ID
                environment variable.
              </p>
            </div>
          </div>

          <div className="col-span-2 md:col-span-1">
            <div className="bg-gray-100 p-4 rounded-md">
              <h3 className="font-medium mb-2">Test Configuration</h3>
              <div className="mb-4">
                <label
                  htmlFor="amount"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Test Amount (USD)
                </label>
                <div className="flex items-center">
                  <span className="mr-2">$</span>
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    min="1"
                    step="0.01"
                    className="border border-gray-300 rounded-md px-3 py-2 w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-medium mb-2">PayPal Button Test</h3>
          <PayPalScriptProvider
            options={{
              clientId: clientId,
              currency: "USD",
              intent: "capture",
              components: "buttons",
              // Enable credit card funding
              "disable-funding": "",
            }}
          >
            <div className="w-full my-4">
              <PayPalButtons
                style={{
                  layout: "vertical",
                  color: "gold",
                  shape: "rect",
                  label: "pay",
                  height: 45,
                }}
                forceReRender={[amount]}
                createOrder={(data, actions) => {
                  return actions.order.create({
                    intent: "CAPTURE",
                    purchase_units: [
                      {
                        amount: {
                          value: amount.toFixed(2),
                          currency_code: "USD",
                        },
                        description: "Test Payment",
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

                    handleSuccess(orderDetails);
                  } catch (error) {
                    console.error("Error capturing PayPal order:", error);
                    handleError(error);
                  }
                }}
                onError={(err) => {
                  console.error("PayPal Error:", err);
                  handleError(err);
                }}
                onCancel={() => {
                  setTestError("Payment was cancelled");
                }}
              />
            </div>
          </PayPalScriptProvider>
        </div>

        {testResult && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
            <h3 className="font-medium text-green-800 mb-2">Payment Success</h3>
            <pre className="bg-white p-3 rounded-md text-sm overflow-auto max-h-60">
              {testResult}
            </pre>
          </div>
        )}

        {testError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="font-medium text-red-800 mb-2">Payment Error</h3>
            <p className="text-red-700">{testError}</p>
          </div>
        )}
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Troubleshooting</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>
            Make sure your{" "}
            <code className="bg-gray-100 px-1 py-0.5 rounded">
              NEXT_PUBLIC_PAYPAL_CLIENT_ID
            </code>{" "}
            is correctly set in{" "}
            <code className="bg-gray-100 px-1 py-0.5 rounded">.env.local</code>
          </li>
          <li>Check browser console for any JavaScript errors</li>
          <li>Ensure you're not blocking third-party cookies or scripts</li>
          <li>Try disabling any ad-blockers or privacy extensions</li>
          <li>
            Verify that your PayPal account is properly configured for accepting
            payments
          </li>
          <li>
            If testing in development, make sure you're using a PayPal Sandbox
            account
          </li>
        </ul>
      </div>
    </div>
  );
}
