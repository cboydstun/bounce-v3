"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getContactById, updateContact } from "@/utils/api";
import { ContactFormData, ConfirmationStatus } from "@/types/contact";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditContact({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = React.use(params);
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

  useEffect(() => {
    const fetchContact = async () => {
      try {
        setIsLoading(true);

        // Use the getContactById function from the API client
        const contact = await getContactById(resolvedParams.id);

        // Format the date to YYYY-MM-DD for the date input
        const formattedDate = contact.partyDate
          ? new Date(contact.partyDate).toISOString().split("T")[0]
          : "";

        // Handle legacy boolean confirmed values
        let confirmedStatus: ConfirmationStatus;
        if (typeof contact.confirmed === "boolean") {
          confirmedStatus = contact.confirmed ? "Confirmed" : "Pending";
        } else {
          confirmedStatus = contact.confirmed as ConfirmationStatus;
        }

        // Format delivery and pickup dates if they exist
        const formattedDeliveryDay = contact.deliveryDay
          ? new Date(contact.deliveryDay).toISOString().split("T")[0]
          : "";
        const formattedPickupDay = contact.pickupDay
          ? new Date(contact.pickupDay).toISOString().split("T")[0]
          : "";

        setFormData({
          bouncer: contact.bouncer,
          email: contact.email,
          phone: contact.phone || "",
          partyDate: formattedDate,
          partyZipCode: contact.partyZipCode,
          message: contact.message || "",
          confirmed: confirmedStatus,
          tablesChairs: contact.tablesChairs || false,
          generator: contact.generator || false,
          popcornMachine: contact.popcornMachine || false,
          cottonCandyMachine: contact.cottonCandyMachine || false,
          snowConeMachine: contact.snowConeMachine || false,
          overnight: contact.overnight || false,
          basketballShoot: contact.basketballShoot || false,
          slushyMachine: contact.slushyMachine || false,
          sourcePage: contact.sourcePage || "admin",
          // Address information
          streetAddress: contact.streetAddress || "",
          city: contact.city || "",
          state: contact.state || "Texas",
          // Party timing
          partyStartTime: contact.partyStartTime || "",
          partyEndTime: contact.partyEndTime || "",
          // Delivery information
          deliveryDay: formattedDeliveryDay,
          deliveryTime: contact.deliveryTime || "",
          pickupDay: formattedPickupDay,
          pickupTime: contact.pickupTime || "",
          // Payment and admin information
          paymentMethod: contact.paymentMethod,
          discountComments: contact.discountComments || "",
          adminComments: contact.adminComments || "",
        });
      } catch (error) {
        // Handle authentication errors
        if (error instanceof Error && error.message.includes("401")) {
          localStorage.removeItem("auth_token");
          router.push("/login");
          return;
        }

        setError(error instanceof Error ? error.message : "An error occurred");
        console.error("Error fetching contact:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContact();
  }, [resolvedParams.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      // Use the updateContact function from the API client
      await updateContact(resolvedParams.id, formData);

      // Navigate back to contacts list
      router.push("/admin/contacts");
      router.refresh();
    } catch (error) {
      // Handle authentication errors
      if (error instanceof Error && error.message.includes("401")) {
        localStorage.removeItem("auth_token");
        router.push("/login");
        return;
      }

      setError(
        error instanceof Error ? error.message : "Failed to update contact",
      );
      console.error("Error updating contact:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Edit Contact Request</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Bouncer Name
              <input
                type="text"
                name="bouncer"
                value={formData.bouncer}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </label>
          </div>

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
              Party Zip Code
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

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status
              <select
                name="confirmed"
                value={formData.confirmed || "Pending"}
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
          <h3 className="text-lg font-medium">Payment and Admin Information</h3>
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
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Additional Services</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="tablesChairs"
                checked={formData.tablesChairs}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Tables & Chairs</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="generator"
                checked={formData.generator}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Generator</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="popcornMachine"
                checked={formData.popcornMachine}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Popcorn Machine</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="cottonCandyMachine"
                checked={formData.cottonCandyMachine}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Cotton Candy Machine</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="snowConeMachine"
                checked={formData.snowConeMachine}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Snow Cone Machine</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="basketballShoot"
                checked={formData.basketballShoot}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Basketball Shoot</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="slushyMachine"
                checked={formData.slushyMachine}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Slushy Machine</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="overnight"
                checked={formData.overnight}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Overnight</span>
            </label>
          </div>
        </div>

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
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
