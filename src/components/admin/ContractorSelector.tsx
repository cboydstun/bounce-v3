import React, { useState, useEffect, useRef } from "react";

interface Contractor {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  businessName?: string;
  isActive: boolean;
  isVerified: boolean;
}

interface ContractorSelectorProps {
  selectedContractorIds: string[];
  onContractorsChange: (contractorIds: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

export default function ContractorSelector({
  selectedContractorIds,
  onContractorsChange,
  placeholder = "Search and select contractors...",
  disabled = false,
  error,
}: ContractorSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [selectedContractors, setSelectedContractors] = useState<Contractor[]>(
    [],
  );
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load contractors on component mount
  useEffect(() => {
    loadContractors();
  }, []);

  // Update selected contractors when selectedContractorIds changes
  useEffect(() => {
    if (selectedContractorIds.length > 0 && contractors.length > 0) {
      const selected = contractors.filter((contractor) =>
        selectedContractorIds.includes(contractor._id),
      );
      setSelectedContractors(selected);
    } else {
      setSelectedContractors([]);
    }
  }, [selectedContractorIds, contractors]);

  const loadContractors = async () => {
    try {
      setLoading(true);
      setSearchError(null);

      const response = await fetch(
        "/api/v1/contractors?status=active&limit=100",
      );

      if (!response.ok) {
        throw new Error("Failed to load contractors");
      }

      const data = await response.json();
      setContractors(data.contractors || []);
    } catch (err) {
      console.error("Error loading contractors:", err);
      setSearchError("Failed to load contractors");
      setContractors([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredContractors = contractors.filter((contractor) => {
    if (!searchTerm.trim()) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      contractor.name.toLowerCase().includes(searchLower) ||
      contractor.email.toLowerCase().includes(searchLower) ||
      (contractor.businessName &&
        contractor.businessName.toLowerCase().includes(searchLower)) ||
      (contractor.phone && contractor.phone.includes(searchTerm))
    );
  });

  const handleContractorToggle = (contractor: Contractor) => {
    const isSelected = selectedContractorIds.includes(contractor._id);
    let newSelectedIds: string[];

    if (isSelected) {
      // Remove contractor
      newSelectedIds = selectedContractorIds.filter(
        (id) => id !== contractor._id,
      );
      setSelectedContractors((prev) =>
        prev.filter((c) => c._id !== contractor._id),
      );
    } else {
      // Add contractor
      newSelectedIds = [...selectedContractorIds, contractor._id];
      setSelectedContractors((prev) => [...prev, contractor]);
    }

    onContractorsChange(newSelectedIds);
  };

  const handleRemoveContractor = (contractorId: string) => {
    const newSelectedIds = selectedContractorIds.filter(
      (id) => id !== contractorId,
    );
    setSelectedContractors((prev) =>
      prev.filter((c) => c._id !== contractorId),
    );
    onContractorsChange(newSelectedIds);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  return (
    <div className="space-y-2">
      {/* Selected contractors display */}
      {selectedContractors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedContractors.map((contractor) => (
            <span
              key={contractor._id}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {contractor.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveContractor(contractor._id)}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:text-blue-600 hover:bg-blue-200"
                >
                  <svg
                    className="w-2 h-2"
                    fill="currentColor"
                    viewBox="0 0 8 8"
                  >
                    <path d="M1.41 0L0 1.41 2.59 4 0 6.59 1.41 8 4 5.41 6.59 8 8 6.59 5.41 4 8 1.41 6.59 0 4 2.59 1.41 0z" />
                  </svg>
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full border rounded-md px-3 py-2 ${
              error
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            } ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
          />

          {/* Loading spinner */}
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>

        {/* Error message */}
        {(error || searchError) && (
          <p className="mt-1 text-sm text-red-600">{error || searchError}</p>
        )}

        {/* Dropdown */}
        {isOpen && !loading && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredContractors.length > 0 ? (
              filteredContractors.map((contractor) => {
                const isSelected = selectedContractorIds.includes(
                  contractor._id,
                );
                return (
                  <button
                    key={contractor._id}
                    type="button"
                    onClick={() => handleContractorToggle(contractor)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 ${
                      isSelected ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Handled by button click
                            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {contractor.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {contractor.email}
                              {contractor.businessName &&
                                ` • ${contractor.businessName}`}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        {contractor.isVerified && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Verified
                          </span>
                        )}
                        {!contractor.isActive && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500">
                {searchTerm.trim()
                  ? `No contractors found for "${searchTerm}"`
                  : "No contractors available"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected count */}
      {selectedContractors.length > 0 && (
        <p className="text-xs text-gray-500">
          {selectedContractors.length} contractor
          {selectedContractors.length !== 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}
