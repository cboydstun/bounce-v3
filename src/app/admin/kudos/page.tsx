"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  HeartIcon,
  EnvelopeIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import KudosEmailModal from "@/components/KudosEmailModal";
import toast from "react-hot-toast";

interface EligibleCustomer {
  id: string;
  type: "order" | "contact";
  customerName: string;
  customerEmail: string;
  eventDate: string;
  rentalItems: string[];
  kudosEmailSent: boolean;
  kudosEmailSentAt?: string;
  createdAt: string;
}

export default function AdminKudos() {
  const router = useRouter();
  const { status } = useSession();
  const [customers, setCustomers] = useState<EligibleCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] =
    useState<EligibleCustomer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [statusFilter, setStatusFilter] = useState<"all" | "sent" | "not_sent">(
    "all",
  );
  const [dateRange, setDateRange] = useState(30); // Days

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchEligibleCustomers();
  }, [status, statusFilter, dateRange]);

  const fetchEligibleCustomers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - dateRange);

      const params = new URLSearchParams({
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      });

      if (statusFilter !== "all") {
        params.append(
          "kudosEmailSent",
          statusFilter === "sent" ? "true" : "false",
        );
      }

      const response = await fetch(`/api/v1/admin/kudos?${params}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error(`Failed to fetch customers: ${response.statusText}`);
      }

      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error("Error fetching eligible customers:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch customers",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewKudosEmail = (customer: EligibleCustomer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleEmailSent = (customerId: string) => {
    // Update the customer in the list to reflect that email was sent
    setCustomers((prev) =>
      prev.map((customer) =>
        customer.id === customerId
          ? {
              ...customer,
              kudosEmailSent: true,
              kudosEmailSentAt: new Date().toISOString(),
            }
          : customer,
      ),
    );
    setIsModalOpen(false);
    setSelectedCustomer(null);
    toast.success("Kudos email sent successfully!");
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  // Filter and paginate customers
  const filteredCustomers = customers.filter((customer) => {
    if (statusFilter === "sent") return customer.kudosEmailSent;
    if (statusFilter === "not_sent") return !customer.kudosEmailSent;
    return true;
  });

  const totalPages = Math.ceil(filteredCustomers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentCustomers = filteredCustomers.slice(startIndex, endIndex);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (customer: EligibleCustomer) => {
    if (customer.kudosEmailSent) {
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
          <CheckCircleIcon className="mr-1 h-3 w-3" />
          Sent
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
        <XCircleIcon className="mr-1 h-3 w-3" />
        Not Sent
      </span>
    );
  };

  // Show loading spinner when session is loading or when fetching data
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
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900 flex items-center">
            <HeartIcon className="mr-2 h-6 w-6 text-red-500" />
            Kudos Email System
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Send personalized thank you emails to customers after their events
            to encourage 5-star Google reviews.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label
              htmlFor="date-range"
              className="block text-sm font-medium text-gray-700"
            >
              Event Date Range
            </label>
            <select
              id="date-range"
              value={dateRange}
              onChange={(e) => {
                setDateRange(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setStatusFilter("all");
                setCurrentPage(1);
              }}
              className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                statusFilter === "all"
                  ? "bg-gray-900 text-white ring-gray-900"
                  : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setStatusFilter("not_sent");
                setCurrentPage(1);
              }}
              className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                statusFilter === "not_sent"
                  ? "bg-yellow-500 text-white ring-yellow-500"
                  : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              Not Sent
            </button>
            <button
              onClick={() => {
                setStatusFilter("sent");
                setCurrentPage(1);
              }}
              className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                statusFilter === "sent"
                  ? "bg-green-600 text-white ring-green-600"
                  : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              Sent
            </button>
          </div>

          <button
            onClick={fetchEligibleCustomers}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            Refresh
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
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

      {/* Customer List */}
      <div className="mt-6 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      Customer
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Event Date
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Rental Items
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Kudos Status
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
                  {currentCustomers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-sm text-gray-500"
                      >
                        No eligible customers found for the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    currentCustomers.map((customer) => (
                      <tr key={customer.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="font-medium text-gray-900">
                            {customer.customerName}
                          </div>
                          <div className="text-gray-500">
                            {customer.customerEmail}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <CalendarIcon className="mr-1 h-4 w-4" />
                            {formatDate(customer.eventDate)}
                          </div>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          <div className="max-w-xs">
                            {customer.rentalItems.join(", ")}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          {getStatusBadge(customer)}
                          {customer.kudosEmailSentAt && (
                            <div className="text-xs text-gray-500 mt-1">
                              Sent: {formatDate(customer.kudosEmailSentAt)}
                            </div>
                          )}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          {!customer.kudosEmailSent && (
                            <button
                              onClick={() => handleNewKudosEmail(customer)}
                              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                            >
                              <EnvelopeIcon className="mr-1 h-4 w-4" />
                              Send Kudos
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Kudos Email Modal */}
      {selectedCustomer && (
        <KudosEmailModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          customer={selectedCustomer}
          onEmailSent={handleEmailSent}
        />
      )}
    </div>
  );
}
