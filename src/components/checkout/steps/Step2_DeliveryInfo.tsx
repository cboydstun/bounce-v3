"use client";

import { useState } from "react";
import { CheckoutState } from "../utils/types";
import { formatPhoneNumber, isBexarCountyZipCode } from "../utils/validation";

interface Step2Props {
  state: CheckoutState;
  dispatch: React.Dispatch<any>;
}

const Step2_DeliveryInfo: React.FC<Step2Props> = ({ state, dispatch }) => {
  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    // Format phone number if it's the phone field
    if (name === "customerPhone") {
      dispatch({
        type: "SET_CUSTOMER_INFO",
        payload: { [name]: formatPhoneNumber(value) },
      });
    } else {
      dispatch({
        type: "SET_CUSTOMER_INFO",
        payload: { [name]: value },
      });
    }
  };

  // US States for dropdown
  const usStates = [
    { value: "AL", label: "Alabama" },
    { value: "AK", label: "Alaska" },
    { value: "AZ", label: "Arizona" },
    { value: "AR", label: "Arkansas" },
    { value: "CA", label: "California" },
    { value: "CO", label: "Colorado" },
    { value: "CT", label: "Connecticut" },
    { value: "DE", label: "Delaware" },
    { value: "FL", label: "Florida" },
    { value: "GA", label: "Georgia" },
    { value: "HI", label: "Hawaii" },
    { value: "ID", label: "Idaho" },
    { value: "IL", label: "Illinois" },
    { value: "IN", label: "Indiana" },
    { value: "IA", label: "Iowa" },
    { value: "KS", label: "Kansas" },
    { value: "KY", label: "Kentucky" },
    { value: "LA", label: "Louisiana" },
    { value: "ME", label: "Maine" },
    { value: "MD", label: "Maryland" },
    { value: "MA", label: "Massachusetts" },
    { value: "MI", label: "Michigan" },
    { value: "MN", label: "Minnesota" },
    { value: "MS", label: "Mississippi" },
    { value: "MO", label: "Missouri" },
    { value: "MT", label: "Montana" },
    { value: "NE", label: "Nebraska" },
    { value: "NV", label: "Nevada" },
    { value: "NH", label: "New Hampshire" },
    { value: "NJ", label: "New Jersey" },
    { value: "NM", label: "New Mexico" },
    { value: "NY", label: "New York" },
    { value: "NC", label: "North Carolina" },
    { value: "ND", label: "North Dakota" },
    { value: "OH", label: "Ohio" },
    { value: "OK", label: "Oklahoma" },
    { value: "OR", label: "Oregon" },
    { value: "PA", label: "Pennsylvania" },
    { value: "RI", label: "Rhode Island" },
    { value: "SC", label: "South Carolina" },
    { value: "SD", label: "South Dakota" },
    { value: "TN", label: "Tennessee" },
    { value: "TX", label: "Texas" },
    { value: "UT", label: "Utah" },
    { value: "VT", label: "Vermont" },
    { value: "VA", label: "Virginia" },
    { value: "WA", label: "Washington" },
    { value: "WV", label: "West Virginia" },
    { value: "WI", label: "Wisconsin" },
    { value: "WY", label: "Wyoming" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">
        Delivery Information
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer Name */}
        <div className="space-y-2 md:col-span-2">
          <label
            htmlFor="customerName"
            className="block text-lg font-medium text-gray-700"
          >
            👤 Full Name
          </label>
          <input
            type="text"
            id="customerName"
            name="customerName"
            value={state.customerName}
            onChange={handleInputChange}
            placeholder="John Doe"
            className="w-full rounded-lg border-2 border-secondary-blue/20 shadow-sm focus:border-primary-purple focus:ring-primary-purple p-3"
          />
          {state.errors.customerName && (
            <p className="text-red-500 text-sm mt-1">
              {state.errors.customerName}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2 md:col-span-2">
          <label
            htmlFor="customerEmail"
            className="block text-lg font-medium text-gray-700"
          >
            📧 Email Address
          </label>
          <input
            type="email"
            id="customerEmail"
            name="customerEmail"
            value={state.customerEmail}
            onChange={handleInputChange}
            placeholder="your@email.com"
            className="w-full rounded-lg border-2 border-secondary-blue/20 shadow-sm focus:border-primary-purple focus:ring-primary-purple p-3"
          />
          {state.errors.customerEmail && (
            <p className="text-red-500 text-sm mt-1">
              {state.errors.customerEmail}
            </p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2 md:col-span-2">
          <label
            htmlFor="customerPhone"
            className="block text-lg font-medium text-gray-700"
          >
            📞 Phone Number
          </label>
          <input
            type="tel"
            id="customerPhone"
            name="customerPhone"
            value={state.customerPhone}
            onChange={handleInputChange}
            placeholder="(###)-###-####"
            className="w-full rounded-lg border-2 border-secondary-blue/20 shadow-sm focus:border-primary-purple focus:ring-primary-purple p-3"
          />
          {state.errors.customerPhone && (
            <p className="text-red-500 text-sm mt-1">
              {state.errors.customerPhone}
            </p>
          )}
        </div>

        {/* Address */}
        <div className="space-y-2 md:col-span-2">
          <label
            htmlFor="customerAddress"
            className="block text-lg font-medium text-gray-700"
          >
            🏠 Street Address
          </label>
          <input
            type="text"
            id="customerAddress"
            name="customerAddress"
            value={state.customerAddress}
            onChange={handleInputChange}
            placeholder="123 Main St"
            className="w-full rounded-lg border-2 border-secondary-blue/20 shadow-sm focus:border-primary-purple focus:ring-primary-purple p-3"
          />
          {state.errors.customerAddress && (
            <p className="text-red-500 text-sm mt-1">
              {state.errors.customerAddress}
            </p>
          )}
        </div>

        {/* City */}
        <div className="space-y-2">
          <label
            htmlFor="customerCity"
            className="block text-lg font-medium text-gray-700"
          >
            🏙️ City
          </label>
          <input
            type="text"
            id="customerCity"
            name="customerCity"
            value={state.customerCity}
            onChange={handleInputChange}
            placeholder="San Antonio"
            className="w-full rounded-lg border-2 border-secondary-blue/20 shadow-sm focus:border-primary-purple focus:ring-primary-purple p-3"
          />
          {state.errors.customerCity && (
            <p className="text-red-500 text-sm mt-1">
              {state.errors.customerCity}
            </p>
          )}
        </div>

        {/* State */}
        <div className="space-y-2">
          <label
            htmlFor="customerState"
            className="block text-lg font-medium text-gray-700"
          >
            🗺️ State
          </label>
          <select
            id="customerState"
            name="customerState"
            value={state.customerState}
            onChange={handleInputChange}
            className="w-full rounded-lg border-2 border-secondary-blue/20 shadow-sm focus:border-primary-purple focus:ring-primary-purple p-3"
          >
            <option value="">Select a state...</option>
            {usStates.map((state) => (
              <option key={state.value} value={state.value}>
                {state.label}
              </option>
            ))}
          </select>
          {state.errors.customerState && (
            <p className="text-red-500 text-sm mt-1">
              {state.errors.customerState}
            </p>
          )}
        </div>

        {/* Zip Code */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="customerZipCode"
              className="block text-lg font-medium text-gray-700"
            >
              📮 Zip Code
            </label>
            <span className="text-sm text-primary-purple font-medium">
              Bexar County Only
            </span>
          </div>
          <input
            type="text"
            id="customerZipCode"
            name="customerZipCode"
            value={state.customerZipCode}
            onChange={handleInputChange}
            placeholder="78701"
            className={`w-full rounded-lg border-2 ${
              state.customerZipCode && 
              state.customerZipCode.length >= 5 && 
              !isBexarCountyZipCode(state.customerZipCode)
                ? "border-red-300 bg-red-50"
                : "border-secondary-blue/20"
            } shadow-sm focus:border-primary-purple focus:ring-primary-purple p-3`}
          />
          {state.errors.customerZipCode ? (
            <p className="text-red-500 text-sm mt-1">
              {state.errors.customerZipCode}
            </p>
          ) : (
            <p className="text-gray-500 text-sm mt-1">
              We only deliver to Bexar County, TX (San Antonio area)
            </p>
          )}
        </div>
      </div>

      {/* Delivery Instructions */}
      <div className="space-y-2">
        <label
          htmlFor="deliveryInstructions"
          className="block text-lg font-medium text-gray-700"
        >
          📝 Delivery Instructions (Optional)
        </label>
        <textarea
          id="deliveryInstructions"
          name="deliveryInstructions"
          value={state.deliveryInstructions || ""}
          onChange={(e) =>
            dispatch({
              type: "SET_CUSTOMER_INFO",
              payload: { deliveryInstructions: e.target.value },
            })
          }
          placeholder="Any special instructions for delivery (gate code, landmarks, etc.)"
          rows={3}
          className="w-full rounded-lg border-2 border-secondary-blue/20 shadow-sm focus:border-primary-purple focus:ring-primary-purple p-3"
        />
      </div>

      {/* Information Notice */}
      <div className="bg-blue-50 p-4 rounded-md">
        <p className="text-blue-800 text-sm">
          This information will be used for delivery and contact purposes only.
          We'll never share your personal information with third parties.
        </p>
        <p className="text-blue-800 text-sm mt-2 font-medium">
          Please note: We currently only deliver to addresses within Bexar County, TX.
        </p>
      </div>
    </div>
  );
};

export default Step2_DeliveryInfo;
