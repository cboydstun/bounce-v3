import React from "react";
import { useFormProgress } from "@/hooks/useFormProgress";
import { ContactFormData } from "@/types/contact";

interface FormProgressBarProps {
  formData: ContactFormData;
  className?: string;
}

export const FormProgressBar: React.FC<FormProgressBarProps> = ({
  formData,
  className = "",
}) => {
  const { progress } = useFormProgress(formData);

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Form Progress</h3>
        <span className="text-sm text-gray-500">
          {progress.completedSections}/{progress.totalSections} sections
          complete
        </span>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600">Overall Completion</span>
          <span className="text-xs font-medium text-gray-900">
            {progress.overall}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              progress.overall >= 80
                ? "bg-green-500"
                : progress.overall >= 50
                  ? "bg-yellow-500"
                  : "bg-blue-500"
            }`}
            style={{ width: `${progress.overall}%` }}
          />
        </div>
      </div>

      {/* Section Progress */}
      <div className="space-y-2">
        {progress.sections.map((section) => (
          <div key={section.name} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  section.isComplete
                    ? "bg-green-500"
                    : section.percentage > 0
                      ? "bg-yellow-500"
                      : "bg-gray-300"
                }`}
              />
              <span className="text-xs text-gray-600">{section.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {section.completed}/{section.total}
              </span>
              {section.isComplete && (
                <svg
                  className="w-3 h-3 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Status Messages */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        {progress.isReadyForSubmission ? (
          <div className="flex items-center space-x-2 text-green-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs font-medium">Ready for submission</span>
          </div>
        ) : !progress.requiredFieldsCompleted ? (
          <div className="flex items-center space-x-2 text-red-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs font-medium">Required fields missing</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-yellow-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs font-medium">
              Add more details to improve
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
