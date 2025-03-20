"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  optimizeRoute,
  OptimizedRoute,
} from "../../../utils/routeOptimization";
import RouteMap from "../../../components/RouteMap";
import { Contact } from "../../../types/contact";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getContacts } from "../../../utils/api";

export default function RoutePlannerPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [startAddress, setStartAddress] = useState<string>(
    "20711 Liatris Lane, San Antonio, TX 78259"
  );
  const [startCoordinates, setStartCoordinates] = useState<[number, number]>([
    -98.4936, 29.4241,
  ]);
  const [error, setError] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    // Check for auth token
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/login");
    } else {
      setIsLoading(false);
    }
  }, [router]);

  // Fetch contacts for selected date
  useEffect(() => {
    if (isLoading) return;

    async function fetchContacts() {
      try {
        setError(null);
        // Format date as YYYY-MM-DD
        const formattedDate = selectedDate.toISOString().split("T")[0];

        // Use the API utility instead of direct fetch
        try {
          const data = await getContacts({ deliveryDay: formattedDate });

          if (data.contacts) {
            setContacts(data.contacts);
          } else {
            setContacts([]);
          }
        } catch (error) {
          console.error("Error fetching contacts:", error);
          setError("Failed to fetch contacts. Please try again.");
          setContacts([]);
        }
      } catch (error) {
        console.error("Error formatting date:", error);
        setError("Invalid date selected. Please try again.");
        setContacts([]);
      }
    }

    fetchContacts();
  }, [selectedDate, isLoading]);

  // Optimize route
  async function handleOptimizeRoute() {
    if (contacts.length === 0) {
      setError("No contacts found for selected date");
      return;
    }

    setLoading(true);
    setError(null);
    setOptimizedRoute(null);

    try {
      const result = await optimizeRoute(contacts, startAddress);

      // Update the start coordinates with the geocoded coordinates
      setStartCoordinates(result.startCoordinates);
      console.log("Geocoded start coordinates:", result.startCoordinates);

      setOptimizedRoute(result);
    } catch (error) {
      console.error("Error optimizing route:", error);

      // Display a more user-friendly error message
      if (error instanceof Error) {
        // Check for specific error messages
        if (error.message.includes("San Antonio area")) {
          setError(
            `Address not found in San Antonio area. Please verify all addresses are in San Antonio, TX.`
          );
        } else if (error.message.includes("Could not geocode any addresses")) {
          setError(
            "Could not locate any addresses. Please check that all addresses are complete and in San Antonio, TX."
          );
        } else {
          setError(`Error optimizing route: ${error.message}`);
        }
      } else {
        setError(
          "Error optimizing route. Please check addresses and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  // Show loading state while authentication is being checked
  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Delivery Route Planner</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block mb-2">Delivery Date:</label>
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date | null) => date && setSelectedDate(date)}
            className="border p-2 rounded w-full"
          />
        </div>

        <div>
          <label className="block mb-2">Start Address:</label>
          <input
            type="text"
            value={startAddress}
            onChange={(e) => setStartAddress(e.target.value)}
            className="border p-2 rounded w-full"
          />
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={handleOptimizeRoute}
          disabled={loading || contacts.length === 0}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {loading ? "Optimizing..." : "Optimize Route"}
        </button>

        {contacts.length > 0 ? (
          <span className="ml-4">
            {contacts.length} deliveries found for selected date
          </span>
        ) : (
          <span className="ml-4">No deliveries found for selected date</span>
        )}
      </div>

      {optimizedRoute && (
        <div className="mt-6">
          <div className="bg-gray-100 p-4 rounded mb-4">
            <h2 className="text-xl font-bold mb-2">Route Summary</h2>
            <p>
              Total distance: {(optimizedRoute.totalDistance / 1000).toFixed(2)}{" "}
              km
            </p>
            <p>
              Estimated duration:{" "}
              {Math.round(optimizedRoute.totalDuration / 60)} minutes
            </p>
            <p>Number of stops: {optimizedRoute.deliveryOrder.length}</p>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">Route Map</h2>
            <RouteMap
              contacts={contacts}
              optimizedOrder={optimizedRoute.deliveryOrder}
              routeGeometry={optimizedRoute.routeGeometry}
              startAddress={startAddress}
              startCoordinates={startCoordinates}
            />
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">Delivery Sequence</h2>
            <ol className="list-decimal pl-6">
              <li className="mb-2">
                <strong>Start:</strong> {startAddress}
              </li>
              {optimizedRoute.deliveryOrder.map(
                (contact: Contact, index: number) => (
                  <li key={contact._id} className="mb-2">
                    <strong>{contact.bouncer}</strong>
                    <br />
                    {contact.streetAddress}, {contact.city}, {contact.state}{" "}
                    {contact.partyZipCode}
                    <br />
                    <span className="text-sm text-gray-600">
                      Phone: {contact.phone || "N/A"}
                    </span>
                  </li>
                )
              )}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
