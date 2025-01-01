"use client";

import { useState, useEffect, FormEvent } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export interface ProductFormData {
  name: string;
  description: string;
  category: string;
  price: {
    base: number;
    currency: string;
  };
  availability: "available" | "rented" | "maintenance" | "retired";
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: "feet" | "meters" | "inches";
  };
  capacity: number;
  ageRange: {
    min: number;
    max: number;
  };
  setupRequirements: {
    space: string;
    powerSource: boolean;
    surfaceType: string[];
  };
  features: string[];
  safetyGuidelines: string;
  rentalDuration: "hourly" | "half-day" | "full-day" | "weekend";
  images?: {
    url: string;
    alt?: string;
    isPrimary?: boolean;
  }[];
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  isEdit?: boolean;
}

const CATEGORIES = [
  "Bounce Houses",
  "Water Slides",
  "Obstacle Courses",
  "Interactive Games",
  "Party Packages",
  "Accessories",
];

const SURFACE_TYPES = ["Grass", "Concrete", "Asphalt", "Dirt", "Indoor"];

const RENTAL_DURATIONS = ["hourly", "half-day", "full-day", "weekend"];

const DIMENSION_UNITS = ["feet", "meters", "inches"];

const DEFAULT_FORM_DATA: ProductFormData = {
  name: "",
  description: "",
  category: CATEGORIES[0],
  price: {
    base: 0,
    currency: "USD",
  },
  availability: "available",
  dimensions: {
    length: 0,
    width: 0,
    height: 0,
    unit: "feet",
  },
  capacity: 0,
  ageRange: {
    min: 0,
    max: 0,
  },
  setupRequirements: {
    space: "",
    powerSource: true,
    surfaceType: [SURFACE_TYPES[0]],
  },
  features: [],
  safetyGuidelines: "",
  rentalDuration: "full-day",
  images: [],
};

export default function ProductForm({
  initialData,
  onSubmit,
  isEdit = false,
}: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>(DEFAULT_FORM_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...DEFAULT_FORM_DATA,
        ...initialData,
        price: {
          ...DEFAULT_FORM_DATA.price,
          ...initialData.price,
        },
        dimensions: {
          ...DEFAULT_FORM_DATA.dimensions,
          ...initialData.dimensions,
        },
        ageRange: {
          ...DEFAULT_FORM_DATA.ageRange,
          ...initialData.ageRange,
        },
        setupRequirements: {
          ...DEFAULT_FORM_DATA.setupRequirements,
          ...initialData.setupRequirements,
          surfaceType: initialData.setupRequirements?.surfaceType || [
            SURFACE_TYPES[0],
          ],
        },
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred while saving",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSurfaceTypeChange = (type: string) => {
    const currentTypes = formData.setupRequirements.surfaceType;
    const updatedTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];

    setFormData({
      ...formData,
      setupRequirements: {
        ...formData.setupRequirements,
        surfaceType: updatedTypes,
      },
    });
  };

  const handleFeatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const features = e.target.value
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);
    setFormData({ ...formData, features });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Name
        </label>
        <div className="mt-2">
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            required
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="price"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Price
        </label>
        <div className="mt-2 grid grid-cols-2 gap-4">
          <input
            type="number"
            id="price"
            min="0"
            step="0.01"
            value={formData.price.base}
            onChange={(e) =>
              setFormData({
                ...formData,
                price: { ...formData.price, base: parseFloat(e.target.value) },
              })
            }
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            required
          />
          <select
            value={formData.price.currency}
            onChange={(e) =>
              setFormData({
                ...formData,
                price: { ...formData.price, currency: e.target.value },
              })
            }
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Description
        </label>
        <div className="mt-2">
          <textarea
            id="description"
            rows={4}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            required
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Category
        </label>
        <div className="mt-2">
          <select
            id="category"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="availability"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Availability
        </label>
        <div className="mt-2">
          <select
            id="availability"
            value={formData.availability}
            onChange={(e) =>
              setFormData({
                ...formData,
                availability: e.target.value as ProductFormData["availability"],
              })
            }
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          >
            <option value="available">Available</option>
            <option value="rented">Rented</option>
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium leading-6 text-gray-900">
          Dimensions
        </label>
        <div className="mt-2 grid grid-cols-4 gap-4">
          <input
            type="number"
            placeholder="Length"
            value={formData.dimensions.length}
            onChange={(e) =>
              setFormData({
                ...formData,
                dimensions: {
                  ...formData.dimensions,
                  length: parseFloat(e.target.value),
                },
              })
            }
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            required
          />
          <input
            type="number"
            placeholder="Width"
            value={formData.dimensions.width}
            onChange={(e) =>
              setFormData({
                ...formData,
                dimensions: {
                  ...formData.dimensions,
                  width: parseFloat(e.target.value),
                },
              })
            }
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            required
          />
          <input
            type="number"
            placeholder="Height"
            value={formData.dimensions.height}
            onChange={(e) =>
              setFormData({
                ...formData,
                dimensions: {
                  ...formData.dimensions,
                  height: parseFloat(e.target.value),
                },
              })
            }
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            required
          />
          <select
            value={formData.dimensions.unit}
            onChange={(e) =>
              setFormData({
                ...formData,
                dimensions: {
                  ...formData.dimensions,
                  unit: e.target.value as ProductFormData["dimensions"]["unit"],
                },
              })
            }
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          >
            {DIMENSION_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="capacity"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Capacity (people)
        </label>
        <div className="mt-2">
          <input
            type="number"
            id="capacity"
            min="1"
            value={formData.capacity}
            onChange={(e) =>
              setFormData({ ...formData, capacity: parseInt(e.target.value) })
            }
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium leading-6 text-gray-900">
          Age Range
        </label>
        <div className="mt-2 grid grid-cols-2 gap-4">
          <input
            type="number"
            placeholder="Min Age"
            min="0"
            value={formData.ageRange.min}
            onChange={(e) =>
              setFormData({
                ...formData,
                ageRange: {
                  ...formData.ageRange,
                  min: parseInt(e.target.value),
                },
              })
            }
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            required
          />
          <input
            type="number"
            placeholder="Max Age"
            min="0"
            value={formData.ageRange.max}
            onChange={(e) =>
              setFormData({
                ...formData,
                ageRange: {
                  ...formData.ageRange,
                  max: parseInt(e.target.value),
                },
              })
            }
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium leading-6 text-gray-900">
          Setup Requirements
        </label>
        <div className="mt-2 space-y-4">
          <input
            type="text"
            placeholder="Space Requirements"
            value={formData.setupRequirements.space}
            onChange={(e) =>
              setFormData({
                ...formData,
                setupRequirements: {
                  ...formData.setupRequirements,
                  space: e.target.value,
                },
              })
            }
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            required
          />
          <div>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={formData.setupRequirements.powerSource}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    setupRequirements: {
                      ...formData.setupRequirements,
                      powerSource: e.target.checked,
                    },
                  })
                }
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
              />
              <span className="ml-2 text-sm text-gray-900">
                Requires Power Source
              </span>
            </label>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-700">Surface Types:</p>
            <div className="flex flex-wrap gap-4">
              {SURFACE_TYPES.map((type) => (
                <label key={type} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.setupRequirements.surfaceType.includes(
                      type,
                    )}
                    onChange={() => handleSurfaceTypeChange(type)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  <span className="ml-2 text-sm text-gray-900">{type}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <label
          htmlFor="features"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Features (comma-separated)
        </label>
        <div className="mt-2">
          <input
            type="text"
            id="features"
            value={formData.features.join(", ")}
            onChange={handleFeatureChange}
            placeholder="e.g., LED Lights, Sound System, Basketball Hoop"
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="safetyGuidelines"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Safety Guidelines
        </label>
        <div className="mt-2">
          <textarea
            id="safetyGuidelines"
            rows={4}
            value={formData.safetyGuidelines}
            onChange={(e) =>
              setFormData({ ...formData, safetyGuidelines: e.target.value })
            }
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            required
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="rentalDuration"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Rental Duration
        </label>
        <div className="mt-2">
          <select
            id="rentalDuration"
            value={formData.rentalDuration}
            onChange={(e) =>
              setFormData({
                ...formData,
                rentalDuration: e.target
                  .value as ProductFormData["rentalDuration"],
              })
            }
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          >
            {RENTAL_DURATIONS.map((duration) => (
              <option key={duration} value={duration}>
                {duration
                  .split("-")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-x-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          {isLoading ? (
            <LoadingSpinner className="w-5 h-5" />
          ) : isEdit ? (
            "Update Product"
          ) : (
            "Create Product"
          )}
        </button>
      </div>
    </form>
  );
}
