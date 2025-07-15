import React, { useCallback } from "react";
import { ContactFormData } from "@/types/contact";

interface AdditionalServicesSectionProps {
  formData: ContactFormData;
  onChange: (field: keyof ContactFormData, value: boolean) => void;
  className?: string;
}

interface ServiceOption {
  key: keyof ContactFormData;
  label: string;
  description?: string;
}

const SERVICE_OPTIONS: ServiceOption[] = [
  {
    key: "tablesChairs",
    label: "Tables & Chairs",
    description: "Round tables and plastic chairs for seating",
  },
  {
    key: "generator",
    label: "Generator",
    description: "Portable power generator for areas without electricity",
  },
  {
    key: "popcornMachine",
    label: "Popcorn Machine",
    description: "Fresh popcorn maker with supplies",
  },
  {
    key: "cottonCandyMachine",
    label: "Cotton Candy Machine",
    description: "Cotton candy maker with sugar and cones",
  },
  {
    key: "snowConeMachine",
    label: "Snow Cone Machine",
    description: "Shaved ice machine with flavored syrups",
  },
  {
    key: "basketballShoot",
    label: "Basketball Shoot",
    description: "Interactive basketball shooting game",
  },
  {
    key: "slushyMachine",
    label: "Slushy Machine",
    description: "Frozen drink machine with flavors",
  },
  {
    key: "overnight",
    label: "Overnight",
    description: "Keep equipment overnight (additional fee applies)",
  },
];

export const AdditionalServicesSection: React.FC<
  AdditionalServicesSectionProps
> = ({ formData, onChange, className = "" }) => {
  // Memoized handler to prevent unnecessary re-renders
  const handleServiceChange = useCallback(
    (serviceKey: keyof ContactFormData) => {
      return (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(serviceKey, e.target.checked);
      };
    },
    [onChange],
  );

  // Calculate selected services count for summary
  const selectedCount = SERVICE_OPTIONS.reduce((count, option) => {
    return count + (formData[option.key] ? 1 : 0);
  }, 0);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Additional Services
        </h3>
        {selectedCount > 0 && (
          <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
            {selectedCount} selected
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SERVICE_OPTIONS.map((option) => {
          const isChecked = Boolean(formData[option.key]);

          return (
            <label
              key={option.key}
              className={`relative flex items-start p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                isChecked ? "border-blue-500 bg-blue-50" : "border-gray-300"
              }`}
            >
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  name={option.key}
                  checked={isChecked}
                  onChange={handleServiceChange(option.key)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${
                      isChecked ? "text-blue-900" : "text-gray-900"
                    }`}
                  >
                    {option.label}
                  </span>
                  {isChecked && (
                    <svg
                      className="w-4 h-4 text-blue-500"
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
                {option.description && (
                  <p
                    className={`text-xs mt-1 ${
                      isChecked ? "text-blue-700" : "text-gray-500"
                    }`}
                  >
                    {option.description}
                  </p>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {/* Quick selection buttons */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
        <button
          type="button"
          onClick={() => {
            SERVICE_OPTIONS.forEach((option) => {
              if (!formData[option.key]) {
                onChange(option.key, true);
              }
            });
          }}
          className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
        >
          Select All
        </button>
        <button
          type="button"
          onClick={() => {
            SERVICE_OPTIONS.forEach((option) => {
              if (formData[option.key]) {
                onChange(option.key, false);
              }
            });
          }}
          className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          Clear All
        </button>
        {/* Popular combinations */}
        <button
          type="button"
          onClick={() => {
            // Select popular party combo
            const popularServices: (keyof ContactFormData)[] = [
              "tablesChairs",
              "popcornMachine",
              "cottonCandyMachine",
            ];
            popularServices.forEach((service) => {
              onChange(service, true);
            });
          }}
          className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
        >
          Party Combo
        </button>
      </div>

      {/* Summary */}
      {selectedCount > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Selected Services:
          </h4>
          <div className="flex flex-wrap gap-1">
            {SERVICE_OPTIONS.filter((option) => formData[option.key]).map(
              (option) => (
                <span
                  key={option.key}
                  className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md"
                >
                  {option.label}
                  <button
                    type="button"
                    onClick={() => onChange(option.key, false)}
                    className="ml-1 hover:text-blue-600"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </span>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
};
