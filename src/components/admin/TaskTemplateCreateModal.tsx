"use client";

import { useState } from "react";
import { TaskTemplateFormData } from "@/types/taskTemplate";

interface TaskTemplateCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateCreated: () => void;
}

export default function TaskTemplateCreateModal({
  isOpen,
  onClose,
  onTemplateCreated,
}: TaskTemplateCreateModalProps) {
  const [formData, setFormData] = useState<TaskTemplateFormData>({
    name: "",
    description: "",
    titlePattern: "",
    descriptionPattern: "",
    defaultPriority: "Medium",
    paymentRules: {
      type: "fixed",
      baseAmount: 0,
    },
    schedulingRules: {
      relativeTo: "manual",
      offsetDays: 0,
      defaultTime: "09:00",
      businessHoursOnly: false,
    },
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVariableGuide, setShowVariableGuide] = useState(false);

  const availableVariables = [
    { name: "{orderNumber}", description: "Order number (e.g., ORD-2025-001)" },
    { name: "{customerName}", description: "Customer's full name" },
    { name: "{customerEmail}", description: "Customer's email address" },
    { name: "{customerPhone}", description: "Customer's phone number" },
    { name: "{fullAddress}", description: "Complete customer address" },
    { name: "{eventDate}", description: "Event date and time" },
    { name: "{deliveryDate}", description: "Delivery date and time" },
    { name: "{totalAmount}", description: "Order total amount" },
    { name: "{itemNames}", description: "Comma-separated list of item names" },
    { name: "{orderItems}", description: "Detailed list of ordered items" },
    {
      name: "{specialInstructions}",
      description: "Special instructions or notes",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/task-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create template");
      }

      onTemplateCreated();
      onClose();
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create template",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      titlePattern: "",
      descriptionPattern: "",
      defaultPriority: "Medium",
      paymentRules: {
        type: "fixed",
        baseAmount: 0,
      },
      schedulingRules: {
        relativeTo: "manual",
        offsetDays: 0,
        defaultTime: "09:00",
        businessHoursOnly: false,
      },
      isActive: true,
    });
    setError(null);
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  const updatePaymentRules = (
    updates: Partial<typeof formData.paymentRules>,
  ) => {
    setFormData({
      ...formData,
      paymentRules: { ...formData.paymentRules, ...updates },
    });
  };

  const updateSchedulingRules = (
    updates: Partial<typeof formData.schedulingRules>,
  ) => {
    setFormData({
      ...formData,
      schedulingRules: { ...formData.schedulingRules, ...updates },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-medium text-gray-900">
              Create Task Template
            </h3>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., Custom Delivery"
                  required
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Priority
                </label>
                <select
                  value={formData.defaultPriority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      defaultPriority: e.target.value as any,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                rows={3}
                placeholder="Describe what this template is used for..."
                required
                maxLength={500}
              />
            </div>

            {/* Template Patterns */}
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-medium text-gray-900">
                  Template Patterns
                </h4>
                <button
                  type="button"
                  onClick={() => setShowVariableGuide(!showVariableGuide)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  {showVariableGuide ? "Hide" : "Show"} Variable Guide
                </button>
              </div>

              {showVariableGuide && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                  <h5 className="font-medium text-blue-900 mb-2">
                    Available Variables:
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {availableVariables.map((variable) => (
                      <div key={variable.name} className="flex">
                        <code className="bg-blue-100 px-2 py-1 rounded text-blue-800 mr-2 font-mono text-xs">
                          {variable.name}
                        </code>
                        <span className="text-blue-700">
                          {variable.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title Pattern *
                  </label>
                  <input
                    type="text"
                    value={formData.titlePattern}
                    onChange={(e) =>
                      setFormData({ ...formData, titlePattern: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="e.g., {taskType} for Order #{orderNumber} - {customerName}"
                    required
                    maxLength={300}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description Pattern *
                  </label>
                  <textarea
                    value={formData.descriptionPattern}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        descriptionPattern: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={4}
                    placeholder="e.g., Deliver {orderItems} to {fullAddress}&#10;Customer: {customerName} | Order: {orderNumber}&#10;{specialInstructions}"
                    required
                    maxLength={2000}
                  />
                </div>
              </div>
            </div>

            {/* Payment Rules */}
            <div className="border-t pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Payment Rules
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Type
                  </label>
                  <select
                    value={formData.paymentRules.type}
                    onChange={(e) =>
                      updatePaymentRules({ type: e.target.value as any })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="fixed">Fixed Amount</option>
                    <option value="percentage">
                      Percentage of Order Total
                    </option>
                    <option value="formula">Base Amount + Percentage</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(formData.paymentRules.type === "fixed" ||
                    formData.paymentRules.type === "formula") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Base Amount ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="999999.99"
                        step="0.01"
                        value={formData.paymentRules.baseAmount || ""}
                        onChange={(e) =>
                          updatePaymentRules({
                            baseAmount: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  {(formData.paymentRules.type === "percentage" ||
                    formData.paymentRules.type === "formula") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Percentage (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.paymentRules.percentage || ""}
                        onChange={(e) =>
                          updatePaymentRules({
                            percentage: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="0.00"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Amount ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="999999.99"
                      step="0.01"
                      value={formData.paymentRules.minimumAmount || ""}
                      onChange={(e) =>
                        updatePaymentRules({
                          minimumAmount:
                            parseFloat(e.target.value) || undefined,
                        })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Amount ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="999999.99"
                      step="0.01"
                      value={formData.paymentRules.maximumAmount || ""}
                      onChange={(e) =>
                        updatePaymentRules({
                          maximumAmount:
                            parseFloat(e.target.value) || undefined,
                        })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Scheduling Rules */}
            <div className="border-t pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Scheduling Rules
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule Relative To
                  </label>
                  <select
                    value={formData.schedulingRules.relativeTo}
                    onChange={(e) =>
                      updateSchedulingRules({
                        relativeTo: e.target.value as any,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="manual">Manual Scheduling</option>
                    <option value="eventDate">Event Date</option>
                    <option value="deliveryDate">Delivery Date</option>
                  </select>
                </div>

                {formData.schedulingRules.relativeTo !== "manual" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Offset Days
                      </label>
                      <input
                        type="number"
                        min="-365"
                        max="365"
                        value={formData.schedulingRules.offsetDays}
                        onChange={(e) =>
                          updateSchedulingRules({
                            offsetDays: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Negative for days before, positive for days after
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Default Time
                      </label>
                      <input
                        type="time"
                        value={formData.schedulingRules.defaultTime}
                        onChange={(e) =>
                          updateSchedulingRules({ defaultTime: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.schedulingRules.businessHoursOnly}
                      onChange={(e) =>
                        updateSchedulingRules({
                          businessHoursOnly: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    Business Hours Only
                  </label>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="border-t pt-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="mr-2"
                />
                Template is Active
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Template"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
