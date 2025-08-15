"use client";

import { useState, useEffect } from "react";
import { TaskTemplate } from "@/types/taskTemplate";

interface PreviewData {
  template: {
    _id: string;
    name: string;
    description: string;
    titlePattern: string;
    descriptionPattern: string;
    paymentRules: any;
    schedulingRules: any;
  };
  order: {
    _id: string;
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    eventDate: string;
    deliveryDate: string;
  };
  preview: {
    title: string;
    description: string;
    paymentAmount: number;
    scheduledDateTime: string | null;
    variables: Record<string, string>;
  };
  availableVariables: Array<{
    name: string;
    description: string;
    example: string;
  }>;
}

interface TaskTemplatePreviewModalProps {
  isOpen: boolean;
  template: TaskTemplate | null;
  onClose: () => void;
}

export default function TaskTemplatePreviewModal({
  isOpen,
  template,
  onClose,
}: TaskTemplatePreviewModalProps) {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useSampleData, setUseSampleData] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [availableOrders, setAvailableOrders] = useState<
    Array<{
      _id: string;
      orderNumber: string;
      customerName: string;
      totalAmount: number;
    }>
  >([]);

  // Fetch available orders for preview
  useEffect(() => {
    if (isOpen && !useSampleData) {
      fetchAvailableOrders();
    }
  }, [isOpen, useSampleData]);

  // Generate preview when template or settings change
  useEffect(() => {
    if (isOpen && template) {
      generatePreview();
    }
  }, [isOpen, template, useSampleData, selectedOrderId]);

  const fetchAvailableOrders = async () => {
    try {
      const response = await fetch("/api/v1/orders?limit=20&status=Confirmed");
      if (response.ok) {
        const data = await response.json();
        setAvailableOrders(data.orders || []);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    }
  };

  const generatePreview = async () => {
    if (!template) return;

    setLoading(true);
    setError(null);

    try {
      const requestBody = {
        useSampleData,
        ...(selectedOrderId && !useSampleData && { orderId: selectedOrderId }),
      };

      const response = await fetch(
        `/api/v1/task-templates/${template._id}/preview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate preview");
      }

      const data = await response.json();
      setPreviewData(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate preview",
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDateTime = (dateTimeString: string | null) => {
    if (!dateTimeString) return "Manual scheduling required";

    try {
      const date = new Date(dateTimeString);
      return date.toLocaleDateString("en-US", {
        timeZone: "America/Chicago",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  const formatPaymentRules = (rules: any) => {
    switch (rules.type) {
      case "fixed":
        return `Fixed: ${formatCurrency(rules.baseAmount || 0)}`;
      case "percentage":
        return `${rules.percentage || 0}% of order total`;
      case "formula":
        return `${formatCurrency(rules.baseAmount || 0)} + ${rules.percentage || 0}%`;
      default:
        return "Unknown";
    }
  };

  const formatSchedulingRules = (rules: any) => {
    const offsetText =
      rules.offsetDays === 0
        ? "same day"
        : rules.offsetDays > 0
          ? `${rules.offsetDays} day${rules.offsetDays > 1 ? "s" : ""} after`
          : `${Math.abs(rules.offsetDays)} day${Math.abs(rules.offsetDays) > 1 ? "s" : ""} before`;

    const referenceText =
      rules.relativeTo === "eventDate"
        ? "event"
        : rules.relativeTo === "deliveryDate"
          ? "delivery"
          : "manual";

    if (rules.relativeTo === "manual") {
      return "Manual scheduling";
    }

    return `${offsetText} ${referenceText} at ${rules.defaultTime}`;
  };

  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-full max-w-5xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-medium text-gray-900">
                Template Preview: {template.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                See how this template will generate tasks
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Preview Options */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Preview Options
            </h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={useSampleData}
                    onChange={() => setUseSampleData(true)}
                    className="mr-2"
                  />
                  Use Sample Data
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!useSampleData}
                    onChange={() => setUseSampleData(false)}
                    className="mr-2"
                  />
                  Use Real Order Data
                </label>
              </div>

              {!useSampleData && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Order
                  </label>
                  <select
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                    className="w-full max-w-md border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select an order...</option>
                    {availableOrders.map((order) => (
                      <option key={order._id} value={order._id}>
                        {order.orderNumber} - {order.customerName} (
                        {formatCurrency(order.totalAmount)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={generatePreview}
                disabled={loading || (!useSampleData && !selectedOrderId)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Generating..." : "Generate Preview"}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Preview Results */}
          {previewData && (
            <div className="space-y-6">
              {/* Generated Task Preview */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Generated Task
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Task Title
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                      <p className="text-gray-900 font-medium">
                        {previewData.preview.title || "No title generated"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Task Description
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                      <pre className="text-gray-900 whitespace-pre-wrap text-sm">
                        {previewData.preview.description ||
                          "No description generated"}
                      </pre>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Amount
                      </label>
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                        <p className="text-gray-900 font-medium">
                          {formatCurrency(previewData.preview.paymentAmount)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Scheduled Date/Time
                      </label>
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                        <p className="text-gray-900">
                          {formatDateTime(
                            previewData.preview.scheduledDateTime,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Template Configuration */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Template Configuration
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      Payment Rules
                    </h5>
                    <p className="text-sm text-gray-600">
                      {formatPaymentRules(previewData.template.paymentRules)}
                    </p>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      Scheduling Rules
                    </h5>
                    <p className="text-sm text-gray-600">
                      {formatSchedulingRules(
                        previewData.template.schedulingRules,
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Data Used */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Order Data Used
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">
                      Order Number:
                    </span>
                    <span className="ml-2 text-gray-600">
                      {previewData.order.orderNumber}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Customer:</span>
                    <span className="ml-2 text-gray-600">
                      {previewData.order.customerName}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Total Amount:
                    </span>
                    <span className="ml-2 text-gray-600">
                      {formatCurrency(previewData.order.totalAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Data Source:
                    </span>
                    <span className="ml-2 text-gray-600">
                      {useSampleData ? "Sample Data" : "Real Order"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Variable Values */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Variable Values
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(previewData.preview.variables).map(
                    ([key, value]) => (
                      <div key={key} className="flex">
                        <code className="bg-blue-100 px-2 py-1 rounded text-blue-800 mr-3 font-mono text-xs">
                          {`{${key}}`}
                        </code>
                        <span className="text-gray-600 text-sm truncate">
                          {value || "(empty)"}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* Available Variables Reference */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Available Variables Reference
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {previewData.availableVariables.map((variable) => (
                    <div key={variable.name} className="flex flex-col">
                      <code className="bg-gray-100 px-2 py-1 rounded text-gray-800 font-mono text-xs mb-1">
                        {`{${variable.name}}`}
                      </code>
                      <span className="text-gray-600 text-xs">
                        {variable.description}
                      </span>
                      <span className="text-gray-500 text-xs italic">
                        Example: {variable.example}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end pt-6 border-t mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
