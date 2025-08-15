"use client";

import { useState, useEffect } from "react";
import { TaskTemplate, TaskTemplateFormData } from "@/types/taskTemplate";

interface TaskTemplateEditModalProps {
  isOpen: boolean;
  template: TaskTemplate | null;
  onClose: () => void;
  onTemplateUpdated: () => void;
}

export default function TaskTemplateEditModal({
  isOpen,
  template,
  onClose,
  onTemplateUpdated,
}: TaskTemplateEditModalProps) {
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

  // Populate form when template changes
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description,
        titlePattern: template.titlePattern,
        descriptionPattern: template.descriptionPattern,
        defaultPriority: template.defaultPriority,
        paymentRules: template.paymentRules,
        schedulingRules: template.schedulingRules,
        isActive: template.isActive,
      });
      setError(null);
    }
  }, [template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/task-templates/${template._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update template");
      }

      onTemplateUpdated();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update template",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
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

  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-medium text-gray-900">
                Edit Task Template
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {template.isSystemTemplate && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                    System Template
                  </span>
                )}
                Created by {template.createdByName}
              </p>
            </div>
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

          {template.isSystemTemplate && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-6">
              <div className="flex">
                <svg
                  className="w-5 h-5 mr-2 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="font-medium">System Template</p>
                  <p className="text-sm">
                    This is a system template. Changes may affect existing
                    functionality.
                  </p>
                </div>
              </div>
            </div>
          )}

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
                {loading ? "Updating..." : "Update Template"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
