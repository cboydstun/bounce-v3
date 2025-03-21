"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getContacts, updateContact, deleteContact } from "@/utils/api";
import { Contact as ApiContact, ConfirmationStatus } from "@/types/contact";

interface Contact {
  id: string;
  bouncer: string;
  email: string;
  phone?: string;
  partyDate: string;
  partyZipCode: string;
  message?: string;
  confirmed: ConfirmationStatus;
  createdAt: string;
  tablesChairs?: boolean;
  generator?: boolean;
  popcornMachine?: boolean;
  cottonCandyMachine?: boolean;
  snowConeMachine?: boolean;
  margaritaMachine?: boolean;
  slushyMachine?: boolean;
  overnight?: boolean;
  sourcePage: string;
  // Address information
  streetAddress?: string;
  city?: string;
  state?: string;
  // Party timing
  partyStartTime?: string;
  partyEndTime?: string;
  // Delivery information
  deliveryDay?: string;
  deliveryTime?: string;
  pickupDay?: string;
  pickupTime?: string;
  // Payment and admin information
  paymentMethod?: string;
  discountComments?: string;
  adminComments?: string;
}

type ConfirmationFilter =
  | "all"
  | "confirmed"
  | "pending"
  | "called"
  | "declined"
  | "cancelled";
type DateRangeFilter = "none" | "week" | "month" | "year";

export default function AdminContacts() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<"partyDate" | null>("partyDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Helper functions for date ranges
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  // Initialize with first and last day of current month
  const getCurrentMonthDates = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      startDate: formatDateForInput(start),
      endDate: formatDateForInput(end),
    };
  };

  const { startDate: initialStartDate, endDate: initialEndDate } =
    getCurrentMonthDates();

  const [startDate, setStartDate] = useState<string>(initialStartDate);
  const [endDate, setEndDate] = useState<string>(initialEndDate);
  const [confirmationFilter, setConfirmationFilter] =
    useState<ConfirmationFilter>("all");
  const [dateRangeFilter, setDateRangeFilter] =
    useState<DateRangeFilter>("month");

  const setThisWeek = () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    const end = new Date(now);
    end.setDate(now.getDate() + (6 - now.getDay())); // End of week (Saturday)

    setStartDate(formatDateForInput(start));
    setEndDate(formatDateForInput(end));
    setDateRangeFilter("week");
    setCurrentPage(1);
  };

  const setThisMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setStartDate(formatDateForInput(start));
    setEndDate(formatDateForInput(end));
    setDateRangeFilter("month");
    setCurrentPage(1);
  };

  const setThisYear = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31);

    setStartDate(formatDateForInput(start));
    setEndDate(formatDateForInput(end));
    setDateRangeFilter("year");
    setCurrentPage(1);
  };

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Prepare query parameters for API call
        const params: {
          startDate?: string;
          endDate?: string;
          confirmed?: boolean;
        } = {};

        // Add date filters if set
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        // Add confirmation filter if not "all"
        if (confirmationFilter === "confirmed") {
          params.confirmed = true;
        } else if (confirmationFilter === "pending") {
          params.confirmed = false;
        }

        // Call the API with filters
        const data = await getContacts(params);

        // Map the contacts from the API response
        const mappedContacts = data.contacts.map((contact: ApiContact) => ({
          id: contact._id,
          bouncer: contact.bouncer,
          email: contact.email,
          phone: contact.phone,
          partyDate: contact.partyDate,
          partyZipCode: contact.partyZipCode,
          message: contact.message,
          confirmed: contact.confirmed,
          createdAt: contact.createdAt,
          tablesChairs: contact.tablesChairs,
          generator: contact.generator,
          popcornMachine: contact.popcornMachine,
          cottonCandyMachine: contact.cottonCandyMachine,
          snowConeMachine: contact.snowConeMachine,
          margaritaMachine: contact.margaritaMachine,
          slushyMachine: contact.slushyMachine,
          overnight: contact.overnight,
          sourcePage: contact.sourcePage,
          // Address information
          streetAddress: contact.streetAddress,
          city: contact.city,
          state: contact.state,
          // Party timing
          partyStartTime: contact.partyStartTime,
          partyEndTime: contact.partyEndTime,
          // Delivery information
          deliveryDay: contact.deliveryDay,
          deliveryTime: contact.deliveryTime,
          pickupDay: contact.pickupDay,
          pickupTime: contact.pickupTime,
          // Payment and admin information
          paymentMethod: contact.paymentMethod,
          discountComments: contact.discountComments,
          adminComments: contact.adminComments,
        }));

        setContacts(mappedContacts);

        // Log for debugging
        console.log("Contacts API response:", data);
      } catch (error) {
        setError(error instanceof Error ? error.message : "An error occurred");
        console.error("Error fetching contacts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContacts();
  }, [router, startDate, endDate, confirmationFilter]);

  const handleUpdateStatus = async (
    id: string,
    confirmed: ConfirmationStatus
  ) => {
    try {
      setIsLoading(true);

      // Use the updateContact function from the API client
      await updateContact(id, { confirmed });

      // Update the local state
      setContacts(
        contacts.map((contact) =>
          contact.id === id ? { ...contact, confirmed } : contact
        )
      );
    } catch (error) {
      // Handle authentication errors
      if (error instanceof Error && error.message.includes("401")) {
        localStorage.removeItem("auth_token");
        router.push("/login");
        return;
      }

      setError(
        error instanceof Error ? error.message : "Failed to update status"
      );
      console.error("Error updating status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm("Are you sure you want to delete this contact request?")
    ) {
      return;
    }

    try {
      setIsLoading(true);

      // Use the deleteContact function from the API client
      await deleteContact(id);

      // Update the local state
      setContacts(contacts.filter((contact) => contact.id !== id));
    } catch (error) {
      // Handle authentication errors
      if (error instanceof Error && error.message.includes("401")) {
        localStorage.removeItem("auth_token");
        router.push("/login");
        return;
      }

      setError(
        error instanceof Error ? error.message : "Failed to delete contact"
      );
      console.error("Error deleting contact:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: ConfirmationStatus) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-800";
      case "Called / Texted":
        return "bg-blue-100 text-blue-800";
      case "Declined":
        return "bg-red-100 text-red-800";
      case "Cancelled":
        return "bg-gray-100 text-gray-800";
      case "Pending":
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setDateRangeFilter("none");
    setConfirmationFilter("all");
    setCurrentPage(1);
  };

  // Filter contacts by date range and confirmation status
  const filteredContacts = contacts.filter((contact) => {
    // Date filter
    const partyDate = new Date(contact.partyDate);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    const meetsDateCriteria =
      start && end
        ? partyDate >= start && partyDate <= end
        : start
          ? partyDate >= start
          : end
            ? partyDate <= end
            : true;

    // Confirmation filter
    let meetsConfirmationCriteria = true;
    if (confirmationFilter !== "all") {
      switch (confirmationFilter) {
        case "confirmed":
          meetsConfirmationCriteria = contact.confirmed === "Confirmed";
          break;
        case "pending":
          meetsConfirmationCriteria = contact.confirmed === "Pending";
          break;
        case "called":
          meetsConfirmationCriteria = contact.confirmed === "Called / Texted";
          break;
        case "declined":
          meetsConfirmationCriteria = contact.confirmed === "Declined";
          break;
        case "cancelled":
          meetsConfirmationCriteria = contact.confirmed === "Cancelled";
          break;
        default:
          meetsConfirmationCriteria = true;
      }
    }

    return meetsDateCriteria && meetsConfirmationCriteria;
  });

  // Sort contacts based on current sort column and direction
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    if (sortColumn === "partyDate") {
      const dateA = new Date(a.partyDate).getTime();
      const dateB = new Date(b.partyDate).getTime();
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    }
    return 0;
  });

  // Calculate pagination
  const totalPages = Math.ceil(sortedContacts.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentContacts = sortedContacts.slice(startIndex, endIndex);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">
            Contact Requests
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all contact requests including customer details and
            current status.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0">
          <Link
            href="/admin/contacts/new"
            className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            New Contact
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="mt-4 space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label
              htmlFor="start-date"
              className="block text-sm font-medium text-gray-700"
            >
              Start Date
            </label>
            <input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDateRangeFilter("none");
                setCurrentPage(1);
              }}
              className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="end-date"
              className="block text-sm font-medium text-gray-700"
            >
              End Date
            </label>
            <input
              type="date"
              id="end-date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDateRangeFilter("none");
                setCurrentPage(1);
              }}
              className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={setThisWeek}
              className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                dateRangeFilter === "week"
                  ? "bg-blue-600 text-white ring-blue-600"
                  : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              This Week
            </button>
            <button
              onClick={setThisMonth}
              className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                dateRangeFilter === "month"
                  ? "bg-blue-600 text-white ring-blue-600"
                  : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              This Month
            </button>
            <button
              onClick={setThisYear}
              className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                dateRangeFilter === "year"
                  ? "bg-blue-600 text-white ring-blue-600"
                  : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              This Year
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setConfirmationFilter("all");
                setCurrentPage(1);
              }}
              className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                confirmationFilter === "all"
                  ? "bg-gray-900 text-white ring-gray-900"
                  : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setConfirmationFilter("confirmed");
                setCurrentPage(1);
              }}
              className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                confirmationFilter === "confirmed"
                  ? "bg-green-600 text-white ring-green-600"
                  : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => {
                setConfirmationFilter("pending");
                setCurrentPage(1);
              }}
              className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                confirmationFilter === "pending"
                  ? "bg-yellow-500 text-white ring-yellow-500"
                  : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => {
                setConfirmationFilter("called");
                setCurrentPage(1);
              }}
              className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                confirmationFilter === "called"
                  ? "bg-blue-600 text-white ring-blue-600"
                  : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              Called / Texted
            </button>
            <button
              onClick={() => {
                setConfirmationFilter("declined");
                setCurrentPage(1);
              }}
              className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                confirmationFilter === "declined"
                  ? "bg-red-600 text-white ring-red-600"
                  : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              Declined
            </button>
            <button
              onClick={() => {
                setConfirmationFilter("cancelled");
                setCurrentPage(1);
              }}
              className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                confirmationFilter === "cancelled"
                  ? "bg-gray-600 text-white ring-gray-600"
                  : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              Cancelled
            </button>
            <button
              onClick={resetFilters}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Reset All
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Show</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="rounded border-gray-300 text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-700">entries</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="rounded px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="rounded px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 sm:pl-6"
                      onClick={() => {
                        if (sortColumn === "partyDate") {
                          setSortDirection(
                            sortDirection === "asc" ? "desc" : "asc"
                          );
                        } else {
                          setSortColumn("partyDate");
                          setSortDirection("asc");
                        }
                      }}
                    >
                      Party Date{" "}
                      {sortColumn === "partyDate" && (
                        <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                      )}
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Bouncer Info
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Party Details
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Extras
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Confirmed
                    </th>
                    <th
                      scope="col"
                      className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                    >
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {currentContacts.map((contact) => (
                    <tr key={contact.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">
                        {new Date(contact.partyDate).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <div className="font-medium text-gray-900">
                          {contact.bouncer}
                        </div>
                        <div className="text-gray-500">{contact.email}</div>
                        <div className="text-gray-500">{contact.phone}</div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <div className="font-medium">Location:</div>
                        <div>
                          {contact.streetAddress ? (
                            <>
                              {contact.streetAddress}, {contact.city || ""}{" "}
                              {contact.state || ""}
                            </>
                          ) : (
                            <>Zip: {contact.partyZipCode}</>
                          )}
                        </div>

                        {(contact.partyStartTime || contact.partyEndTime) && (
                          <>
                            <div className="font-medium mt-2">Time:</div>
                            <div>
                              {contact.partyStartTime && (
                                <>Start: {contact.partyStartTime}</>
                              )}
                              {contact.partyStartTime &&
                                contact.partyEndTime && <> - </>}
                              {contact.partyEndTime && (
                                <>End: {contact.partyEndTime}</>
                              )}
                            </div>
                          </>
                        )}

                        {contact.paymentMethod && (
                          <div className="mt-2">
                            <span className="font-medium">Payment: </span>
                            {contact.paymentMethod.charAt(0).toUpperCase() +
                              contact.paymentMethod.slice(1)}
                          </div>
                        )}

                        {contact.message && (
                          <div className="max-w-xs overflow-hidden text-ellipsis mt-2">
                            <span className="font-medium">Note: </span>
                            {contact.message}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <ul>
                          {contact.tablesChairs && <li>Tables & Chairs</li>}
                          {contact.generator && <li>Generator</li>}
                          {contact.popcornMachine && <li>Popcorn Machine</li>}
                          {contact.cottonCandyMachine && (
                            <li>Cotton Candy Machine</li>
                          )}
                          {contact.snowConeMachine && (
                            <li>Snow Cone Machine</li>
                          )}
                          {contact.margaritaMachine && (
                            <li>Margarita Machine</li>
                          )}
                          {contact.slushyMachine && <li>Slushy Machine</li>}
                          {contact.overnight && <li>Overnight</li>}
                        </ul>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <select
                          value={contact.confirmed}
                          onChange={(e) =>
                            handleUpdateStatus(
                              contact.id,
                              e.target.value as ConfirmationStatus
                            )
                          }
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(contact.confirmed)}`}
                          disabled={isLoading}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Called / Texted">
                            Called / Texted
                          </option>
                          <option value="Declined">Declined</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <Link
                          href={`/admin/contacts/${contact.id}/edit`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(contact.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <LoadingSpinner className="w-4 h-4" />
                          ) : (
                            "Delete"
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
