"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getPromoOptins, deletePromoOptin } from "@/utils/api";

interface PromoOptin {
  id: string;
  name: string;
  email: string;
  phone?: string;
  promoName: string;
  consentToContact: boolean;
  createdAt: string;
}

export default function AdminPromoOptins() {
  const router = useRouter();
  const [promoOptins, setPromoOptins] = useState<PromoOptin[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [promoNameFilter, setPromoNameFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Get the NextAuth session
  const { data: session, status } = useSession();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    // Only fetch data if authenticated
    if (status !== "authenticated") return;

    const fetchPromoOptins = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Prepare query parameters
        const params: {
          email?: string;
          promoName?: string;
          startDate?: string;
          endDate?: string;
          search?: string;
          page: number;
          limit: number;
        } = {
          page: currentPage,
          limit: pageSize,
        };

        if (searchTerm) params.search = searchTerm;
        if (promoNameFilter) params.promoName = promoNameFilter;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        // Call the API
        const data = await getPromoOptins(params);

        // Map the data
        const mappedOptins = data.promoOptins.map((optin: any) => ({
          id: optin._id,
          name: optin.name,
          email: optin.email,
          phone: optin.phone,
          promoName: optin.promoName,
          consentToContact: optin.consentToContact,
          createdAt: optin.createdAt,
        }));

        setPromoOptins(mappedOptins);
        setTotalItems(data.pagination.total);
        setTotalPages(data.pagination.pages);
      } catch (error) {
        if (error instanceof Error && error.message.includes("401")) {
          router.push("/login");
          return;
        }

        setError(error instanceof Error ? error.message : "An error occurred");
        console.error("Error fetching promo opt-ins:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPromoOptins();
  }, [
    router,
    currentPage,
    pageSize,
    searchTerm,
    promoNameFilter,
    startDate,
    endDate,
    status,
  ]);

  const handleDelete = async (id: string) => {
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this promo opt-in?")) {
      return;
    }

    try {
      setIsLoading(true);
      await deletePromoOptin(id);
      setPromoOptins(promoOptins.filter((optin) => optin.id !== id));
    } catch (error) {
      if (error instanceof Error && error.message.includes("401")) {
        router.push("/login");
        return;
      }

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete promo opt-in",
      );
      console.error("Error deleting promo opt-in:", error);
    } finally {
      setIsLoading(false);
    }
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
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">
            Promo Opt-ins
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all promotional opt-ins from customers interested in
            special offers.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0">
          <Link
            href="/admin/promo-optins/new"
            className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            New Opt-in
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mt-4 space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700"
            >
              Search
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Search by name or email"
            />
          </div>

          <div>
            <label
              htmlFor="promo-name"
              className="block text-sm font-medium text-gray-700"
            >
              Promotion
            </label>
            <input
              type="text"
              id="promo-name"
              value={promoNameFilter}
              onChange={(e) => setPromoNameFilter(e.target.value)}
              className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Filter by promotion"
            />
          </div>

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
              onChange={(e) => setStartDate(e.target.value)}
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
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <button
            onClick={() => {
              setSearchTerm("");
              setPromoNameFilter("");
              setStartDate("");
              setEndDate("");
              setCurrentPage(1);
            }}
            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Reset Filters
          </button>

          <button
            onClick={() => {
              setCurrentPage(1);
            }}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
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

      {/* Table */}
      <div className="mt-4 flow-root">
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
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Phone
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Promotion
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Date
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
                  {promoOptins.map((optin) => (
                    <tr key={optin.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {optin.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {optin.email}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {optin.phone || "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {optin.promoName}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(optin.createdAt).toLocaleDateString()}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <Link
                          href={`/admin/promo-optins/${optin.id}/edit`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(optin.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={isLoading}
                        >
                          Delete
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
