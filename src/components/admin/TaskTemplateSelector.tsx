"use client";

import { useState, useEffect } from "react";
import { TaskTemplate } from "@/types/taskTemplate";

interface TaskTemplateSelectorProps {
  selectedTemplateId?: string;
  onTemplateSelect: (template: TaskTemplate | null) => void;
  disabled?: boolean;
  error?: string;
}

export default function TaskTemplateSelector({
  selectedTemplateId,
  onTemplateSelect,
  disabled = false,
  error,
}: TaskTemplateSelectorProps) {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setFetchError(null);

      const response = await fetch(
        "/api/v1/task-templates?includeSystem=true&includeInactive=false",
      );
      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err) {
      setFetchError(
        err instanceof Error ? err.message : "Failed to fetch templates",
      );
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;

    if (!templateId) {
      onTemplateSelect(null);
      return;
    }

    const selectedTemplate = templates.find((t) => t._id === templateId);
    onTemplateSelect(selectedTemplate || null);
  };

  const selectedTemplate = templates.find((t) => t._id === selectedTemplateId);

  return (
    <div>
      <div className="relative">
        <select
          value={selectedTemplateId || ""}
          onChange={handleTemplateChange}
          disabled={disabled || loading}
          className={`w-full border rounded-md px-3 py-2 ${
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          } ${disabled || loading ? "bg-gray-100 cursor-not-allowed" : ""}`}
        >
          <option value="">Manual Task Creation (No Template)</option>
          {loading && <option disabled>Loading templates...</option>}
          {!loading && templates.length === 0 && !fetchError && (
            <option disabled>No templates available</option>
          )}
          {!loading && fetchError && (
            <option disabled>Error loading templates</option>
          )}
          {!loading && templates.length > 0 && (
            <>
              <optgroup label="System Templates">
                {templates
                  .filter((t) => t.isSystemTemplate)
                  .map((template) => (
                    <option key={template._id} value={template._id}>
                      {template.name} - {template.description}
                    </option>
                  ))}
              </optgroup>
              {templates.some((t) => !t.isSystemTemplate) && (
                <optgroup label="Custom Templates">
                  {templates
                    .filter((t) => !t.isSystemTemplate)
                    .map((template) => (
                      <option key={template._id} value={template._id}>
                        {template.name} - {template.description}
                      </option>
                    ))}
                </optgroup>
              )}
            </>
          )}
        </select>

        {loading && (
          <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {fetchError && (
        <p className="mt-1 text-sm text-red-600">
          {fetchError}
          <button
            onClick={fetchTemplates}
            className="ml-2 text-blue-600 hover:text-blue-800 underline"
          >
            Retry
          </button>
        </p>
      )}

      {selectedTemplate && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div className="text-sm text-blue-700">
              <p className="font-medium">
                Using Template: {selectedTemplate.name}
                {selectedTemplate.isSystemTemplate && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    System
                  </span>
                )}
              </p>
              <p className="mt-1">{selectedTemplate.description}</p>
              <p className="mt-2 text-xs">
                <strong>Priority:</strong> {selectedTemplate.defaultPriority} |
                <strong className="ml-2">Payment:</strong>{" "}
                {selectedTemplate.paymentRules.type === "fixed"
                  ? `Fixed $${selectedTemplate.paymentRules.baseAmount?.toFixed(2) || "0.00"}`
                  : selectedTemplate.paymentRules.type === "percentage"
                    ? `${selectedTemplate.paymentRules.percentage || 0}% of order total`
                    : `$${selectedTemplate.paymentRules.baseAmount?.toFixed(2) || "0.00"} + ${selectedTemplate.paymentRules.percentage || 0}%`}{" "}
                |<strong className="ml-2">Scheduling:</strong>{" "}
                {selectedTemplate.schedulingRules.relativeTo === "manual"
                  ? "Manual"
                  : `${
                      selectedTemplate.schedulingRules.offsetDays === 0
                        ? "Same day"
                        : selectedTemplate.schedulingRules.offsetDays > 0
                          ? `${selectedTemplate.schedulingRules.offsetDays} day${selectedTemplate.schedulingRules.offsetDays > 1 ? "s" : ""} after`
                          : `${Math.abs(selectedTemplate.schedulingRules.offsetDays)} day${Math.abs(selectedTemplate.schedulingRules.offsetDays) > 1 ? "s" : ""} before`
                    } ${selectedTemplate.schedulingRules.relativeTo === "eventDate" ? "event" : "delivery"}`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
