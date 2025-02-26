"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProductForm from "../ProductForm";
import api from "@/utils/api";
import { API_ROUTES } from "@/config/constants";

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  price: {
    base: number;
    currency: string;
  };
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
  safetyGuidelines: string;
  rentalDuration?: "hourly" | "half-day" | "full-day" | "weekend";
  availability?: "available" | "rented" | "maintenance" | "retired";
  features?: string[];
  weatherRestrictions?: string[];
  additionalServices?: Array<{
    name: string;
    price: number;
  }>;
}

export default function NewProductPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: ProductFormData) => {
    try {
      setError(null);

      const token = localStorage.getItem("auth_token");
      if (!token) {
        setError("Authentication required. Please log in.");
        return;
      }

      // Prepare the product data with required fields
      const productData = {
        ...formData,
        price: {
          base: formData.price.base,
          currency: formData.price.currency || "USD",
        },
        availability: formData.availability || "available",
        rentalDuration: formData.rentalDuration || "full-day",
        setupRequirements: {
          space: formData.setupRequirements.space,
          powerSource: formData.setupRequirements.powerSource || true,
          surfaceType: formData.setupRequirements.surfaceType || [],
        },
        features: formData.features || [],
        weatherRestrictions: formData.weatherRestrictions || [],
        additionalServices: formData.additionalServices || [],
      };

      await api.post(
        `${process.env.NEXT_PUBLIC_API_URL}${API_ROUTES.PRODUCTS}`,
        productData
      );
      router.push("/admin/products");
    } catch (err) {
      console.error("Error creating product:", err);
      if (err instanceof Error) {
        if (err.message.includes("401")) {
          setError("Authentication failed. Please log in again.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to create product");
      }
    }
  };

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{error}</h3>
            {error.toLowerCase().includes("log in") && (
              <div className="mt-2">
                <button
                  onClick={() => router.push("/login")}
                  className="text-sm font-medium text-red-800 underline hover:text-red-600"
                >
                  Go to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Add New Product
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Create a new product by filling out the form below.
        </p>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
        <div className="px-4 py-6 sm:p-8">
          <ProductForm onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}
