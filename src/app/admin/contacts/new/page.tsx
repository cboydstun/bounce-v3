"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { createContact } from "@/utils/api";
import { ContactFormData, ConfirmationStatus } from "@/types/contact";
import { ProductWithId } from "@/types/product";
import { ProductSelector } from "@/components/admin/contacts/ProductSelector";
import { FormProgressBar } from "@/components/admin/contacts/FormProgressBar";
import { AdditionalServicesSection } from "@/components/admin/contacts/AdditionalServicesSection";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { useSmartAutoPopulation } from "@/hooks/useSmartAutoPopulation";

export default function NewContact() {
  const router = useRouter();
  const { status } = useSession();
  const [formData, setFormData] = useState<ContactFormData>({
    bouncer: "",
    email: "",
    phone: "",
    partyDate: "",
    partyZipCode: "",
    message: "",
    confirmed: "Pending" as ConfirmationStatus,
    tablesChairs: false,
    generator: false,
    popcornMachine: false,
    cottonCandyMachine: false,
    snowConeMachine: false,
    basketballShoot: false,
    slushyMachine: false,
    overnight: false,
    sourcePage: "admin",
    // Address information
    streetAddress: "",
    city: "",
    state: "Texas",
    // Party timing
    partyStartTime: "",
    partyEndTime: "",
    // Delivery information
    deliveryDay: "",
    deliveryTime: "",
    pickupDay: "",
    pickupTime: "",
    // Payment and admin information
    paymentMethod: undefined,
    discountComments: "",
    adminComments: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithId | null>(
    null,
  );

  // Initialize hooks
  const formPersistence = useFormPersistence(formData);
  const smartAutoPopulation = useSmartAutoPopulation(formData);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Load draft on mount
  useEffect(() => {
    if (status === "authenticated") {
      const draft = formPersistence.loadDraft();
      if (draft) {
        setFormData((prev) => ({ ...prev, ...draft }));
      } else {
        // Apply smart defaults for new forms
        setFormData((prev) => {
          const defaults = smartAutoPopulation.getSmartDefaults(prev);
          return { ...prev, ...defaults };
        });
      }
    }
  }, [status, formPersistence.loadDraft, smartAutoPopulation.getSmartDefaults]);

  // Auto-save form data
  useEffect(() => {
    if (status === "authenticated" && formData.bouncer) {
      formPersistence.saveDraft(formData);
    }
  }, [formData, status, formPersistence.saveDraft]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleInputChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const { name, value, type } = e.target;
      const newValue =
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

      setFormData((prev) => {
        const updates: Partial<ContactFormData> = {
          [name]: newValue,
        };

        // Handle smart auto-population
        if (name === "partyDate" && typeof newValue === "string") {
          const smartUpdates = smartAutoPopulation.getPartyDateUpdates(
            newValue,
            prev,
          );
          Object.assign(updates, smartUpdates);
        } else if (name === "partyStartTime" && typeof newValue === "string") {
          const smartUpdates =
            smartAutoPopulation.getPartyStartTimeUpdates(newValue);
          Object.assign(updates, smartUpdates);
        } else if (name === "partyEndTime" && typeof newValue === "string") {
          const smartUpdates =
            smartAutoPopulation.getPartyEndTimeUpdates(newValue);
          Object.assign(updates, smartUpdates);
        }

        return { ...prev, ...updates };
      });

      formPersistence.markDirty();
    },
    [
      formPersistence.markDirty,
      smartAutoPopulation.getPartyDateUpdates,
      smartAutoPopulation.getPartyStartTimeUpdates,
      smartAutoPopulation.getPartyEndTimeUpdates,
    ],
  );

  const handleBouncerChange = useCallback(
    (value: string) => {
      setFormData((prev) => ({ ...prev, bouncer: value }));
      formPersistence.markDirty();
    },
    [formPersistence.markDirty],
  );

  const handleProductSelect = useCallback((product: ProductWithId | null) => {
    setSelectedProduct(product);
  }, []);

  const handleServiceChange = useCallback(
    (field: keyof ContactFormData, value: boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      formPersistence.markDirty();
    },
    [formPersistence.markDirty],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Check if authenticated
      if (status !== "authenticated") {
        router.push("/login");
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Convert ConfirmationStatus to boolean for the API if needed
        const apiFormData = {
          ...formData,
          confirmed: formData.confirmed === "Confirmed" ? true : false,
        };

        await createContact(apiFormData);

        // Clear draft after successful submission
        formPersistence.clearDraft();

        router.push("/admin/contacts");
        router.refresh();
      } catch (error) {
        // Handle authentication errors
        if (error instanceof Error && error.message.includes("401")) {
          router.push("/login");
          return;
        }

        setError(
          error instanceof Error ? error.message : "Failed to create contact",
        );
        console.error("Error creating contact:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [status, formData, router, formPersistence.clearDraft],
  );

  // Get validation warnings
  const validationWarnings = useMemo(() => {
    return smartAutoPopulation.validateTimeLogic();
  }, [smartAutoPopulation.validateTimeLogic]);

  // Show loading spinner when session is loading or when creating contact
  if (status === "loading" || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  // If not authenticated, don't render anything (will redirect in useEffect)
  if (status !== "authenticated") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Please log in to access this page...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-3">
          <h1 className="text-2xl font-semibold mb-6">New Contact Request</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {/* Validation Warnings */}
          {validationWarnings.length > 0 && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">
                Time Logic Warnings:
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {validationWarnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Auto-save indicator */}
          {formPersistence.lastSaved && (
            <div className="mb-4 text-sm text-gray-500">
              Last saved: {formPersistence.lastSaved.toLocaleTimeString()}
              {formPersistence.isDirty && " • Unsaved changes"}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Selection */}
            <ProductSelector
              value={formData.bouncer}
              onChange={handleBouncerChange}
              onProductSelect={handleProductSelect}
            />

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Party Date
                  <input
                    type="date"
                    name="partyDate"
                    value={formData.partyDate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                  <select
                    name="confirmed"
                    value={String(formData.confirmed || "Pending")}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Called / Texted">Called / Texted</option>
                    <option value="Declined">Declined</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Message
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </label>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Address Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Street Address
                    <input
                      type="text"
                      name="streetAddress"
                      value={formData.streetAddress}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    City
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    State
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Zip Code
                    <input
                      type="text"
                      name="partyZipCode"
                      value={formData.partyZipCode}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Party Timing */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Party Timing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Party Start Time
                    <input
                      type="time"
                      name="partyStartTime"
                      value={formData.partyStartTime}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Party End Time
                    <input
                      type="time"
                      name="partyEndTime"
                      value={formData.partyEndTime}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Delivery Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Delivery Day
                    <input
                      type="date"
                      name="deliveryDay"
                      value={formData.deliveryDay}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Delivery Time
                    <input
                      type="time"
                      name="deliveryTime"
                      value={formData.deliveryTime}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Pickup Day
                    <input
                      type="date"
                      name="pickupDay"
                      value={formData.pickupDay}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Pickup Time
                    <input
                      type="time"
                      name="pickupTime"
                      value={formData.pickupTime}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Payment and Admin Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                Payment and Admin Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Payment Method
                    <select
                      name="paymentMethod"
                      value={formData.paymentMethod || ""}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Select Payment Method</option>
                      <option value="cash">Cash</option>
                      <option value="quickbooks">QuickBooks</option>
                      <option value="paypal">PayPal</option>
                      <option value="free">Free</option>
                    </select>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Discount Comments
                    <textarea
                      name="discountComments"
                      value={formData.discountComments}
                      onChange={handleInputChange}
                      rows={2}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </label>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Admin Comments
                    <textarea
                      name="adminComments"
                      value={formData.adminComments}
                      onChange={handleInputChange}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Additional Services */}
            <AdditionalServicesSection
              formData={formData}
              onChange={handleServiceChange}
            />

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isLoading ? (
                  <LoadingSpinner className="w-5 h-5" />
                ) : (
                  "Create Contact"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar with Progress */}
        <div className="lg:col-span-1">
          <FormProgressBar formData={formData} className="sticky top-6" />
        </div>
      </div>
    </div>
  );
}
