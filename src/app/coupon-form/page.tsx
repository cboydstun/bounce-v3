"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { usePackageDeals } from "@/contexts/PackageDealsContext";

// Component to handle search params
function CouponFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setVisible: setPackageDealsVisible } = usePackageDeals();
  const [promoName, setPromoName] = useState<string>("General Promotion");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    consentToContact: false,
  });
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const promoParam = searchParams.get("promo");
    if (promoParam) {
      setPromoName(promoParam);
    }
  }, [searchParams]);

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digits
    const numbers = value.replace(/\D/g, "");

    // Format as (###)-###-####
    if (numbers.length >= 10) {
      return `(${numbers.slice(0, 3)})-${numbers.slice(3, 6)}-${numbers.slice(
        6,
        10,
      )}`;
    } else if (numbers.length >= 6) {
      return `(${numbers.slice(0, 3)})-${numbers.slice(3, 6)}-${numbers.slice(
        6,
      )}`;
    } else if (numbers.length >= 3) {
      return `(${numbers.slice(0, 3)})-${numbers.slice(3)}`;
    }
    return numbers;
  };

  const validateForm = (): boolean => {
    const newErrors: {
      name?: string;
      email?: string;
      phone?: string;
      zipCode?: string;
    } = {};
    const emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
    const phoneRegex = /^\(\d{3}\)-\d{3}-\d{4}$/;

    if (!formData.name) newErrors.name = "Full name is required";

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone =
        "Please enter a valid phone number in format (###)-###-####";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name === "phone") {
      setFormData((prev) => ({
        ...prev,
        phone: formatPhoneNumber(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !formData.consentToContact) return;

    setIsSubmitting(true);

    try {
      // Send data to our API
      const response = await fetch("/api/v1/package-promo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          promoName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit form");
      }

      // Use the context method to set visibility
      setPackageDealsVisible();

      // Redirect to the party-packages page
      router.push("/party-packages");
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="w-full max-w-[800px] mx-auto bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-secondary-blue/20 shadow-lg p-8 space-y-6">
        <h1 className="text-3xl font-bold text-primary-purple mb-6 text-center">
          See Our Party Package Deals
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-lg font-medium text-gray-700 mb-2"
            >
              👤 Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full rounded-lg border-2 border-secondary-blue/20 shadow-sm focus:border-primary-purple focus:ring-primary-purple p-3"
              placeholder="Enter your full name"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-lg font-medium text-gray-700 mb-2"
            >
              📧 Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-lg border-2 border-secondary-blue/20 shadow-sm focus:border-primary-purple focus:ring-primary-purple p-3"
              placeholder="your@email.com"
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-lg font-medium text-gray-700 mb-2"
            >
              📞 Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full rounded-lg border-2 border-secondary-blue/20 shadow-sm focus:border-primary-purple focus:ring-primary-purple p-3"
              placeholder="(###)-###-####"
              autoComplete="tel"
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Consent Checkbox */}
          <div className="bg-secondary-blue/5 p-4 rounded-lg">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                id="consentToContact"
                name="consentToContact"
                checked={formData.consentToContact}
                onChange={handleChange}
                className="mt-1 rounded border-2 border-secondary-blue/20 text-primary-purple focus:ring-primary-purple"
              />
              <span className="text-sm text-gray-700">
                I agree to calls, texts, and emails about my party rental
                inquiry 📱
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !formData.consentToContact}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 ${
              formData.consentToContact
                ? "bg-gradient-to-r from-blue-400 to-purple-600 text-white hover:from-blue-500 hover:to-purple-700 shadow-md hover:shadow-lg"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <LoadingSpinner /> Processing...
              </span>
            ) : (
              "See Package Deals 🎉"
            )}
          </button>

          <p className="text-sm text-gray-600 mt-4 text-center">
            By submitting this form, I agree to the privacy policy and terms and
            conditions and give my express written consent to SATX Bounce to be
            contacted via text and phone call, even if this number is a wireless
            number or if I am presently listed on a Do Not Call list. I
            understand that I may be contacted by telephone, email, text message
            or mail regarding marketing services and that I may be called using
            automatic dialing equipment. I understand that I can reply STOP to
            STOP communications at any time. Message and data rates may apply.
            My consent does not require purchase.
          </p>
        </form>
      </div>
    </div>
  );
}

// Loading fallback component
function FormSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="w-full max-w-[800px] mx-auto bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-secondary-blue/20 shadow-lg p-8 space-y-6">
        <div className="h-10 bg-gray-200 rounded animate-pulse mb-6"></div>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-14 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function CouponFormPage() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <CouponFormContent />
    </Suspense>
  );
}
