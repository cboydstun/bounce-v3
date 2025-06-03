"use client";

import React, { useState, useEffect } from "react";
import { Contractor, ContractorFormData } from "@/types/contractor";

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [filteredContractors, setFilteredContractors] = useState<Contractor[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [verificationFilter, setVerificationFilter] = useState<
    "all" | "verified" | "unverified"
  >("all");
  const [skillFilter, setSkillFilter] = useState<string[]>([]);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(
    null,
  );
  const [formData, setFormData] = useState<ContractorFormData>({
    name: "",
    email: "",
    phone: "",
    skills: [],
    businessName: "",
    profileImage: "",
    emergencyContact: {
      name: "",
      phone: "",
      relationship: "",
      email: "",
    },
    isActive: true,
    isVerified: true,
    notes: "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadContractors();
  }, []);

  // Filter contractors based on search and filter criteria
  useEffect(() => {
    let filtered = contractors;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (contractor) =>
          contractor.name.toLowerCase().includes(term) ||
          contractor.email.toLowerCase().includes(term) ||
          (contractor.phone && contractor.phone.toLowerCase().includes(term)) ||
          (contractor.businessName &&
            contractor.businessName.toLowerCase().includes(term)),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((contractor) =>
        statusFilter === "active" ? contractor.isActive : !contractor.isActive,
      );
    }

    // Verification filter
    if (verificationFilter !== "all") {
      filtered = filtered.filter((contractor) =>
        verificationFilter === "verified"
          ? contractor.isVerified
          : !contractor.isVerified,
      );
    }

    // Skill filter
    if (skillFilter.length > 0) {
      filtered = filtered.filter(
        (contractor) =>
          contractor.skills &&
          skillFilter.some((skill) => contractor.skills!.includes(skill)),
      );
    }

    setFilteredContractors(filtered);
  }, [contractors, searchTerm, statusFilter, verificationFilter, skillFilter]);

  // Extract unique skills from all contractors
  useEffect(() => {
    const skills = new Set<string>();
    contractors.forEach((contractor) => {
      contractor.skills?.forEach((skill) => skills.add(skill));
    });
    setAvailableSkills(Array.from(skills).sort());
  }, [contractors]);

  const loadContractors = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append("status", "all"); // Get all contractors (active and inactive)
      params.append("limit", "100"); // Get more contractors for client-side filtering

      const response = await fetch(`/api/v1/contractors?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        // Handle new API response format
        if (data.contractors) {
          setContractors(data.contractors);
          setFilteredContractors(data.contractors);
        } else {
          // Fallback for old API format
          setContractors(data);
          setFilteredContractors(data);
        }
      } else {
        console.error("Failed to load contractors");
      }
    } catch (error) {
      console.error("Error loading contractors:", error);
    } finally {
      setLoading(false);
    }
  };

  const openForm = (contractor?: Contractor) => {
    if (contractor) {
      setEditingContractor(contractor);
      setFormData({
        name: contractor.name,
        email: contractor.email,
        phone: contractor.phone || "",
        skills: contractor.skills || [],
        businessName: contractor.businessName || "",
        profileImage: contractor.profileImage || "",
        emergencyContact: contractor.emergencyContact || {
          name: "",
          phone: "",
          relationship: "",
          email: "",
        },
        isActive: contractor.isActive,
        isVerified: contractor.isVerified,
        notes: contractor.notes || "",
      });
    } else {
      setEditingContractor(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        skills: [],
        businessName: "",
        profileImage: "",
        emergencyContact: {
          name: "",
          phone: "",
          relationship: "",
          email: "",
        },
        isActive: true,
        isVerified: true,
        notes: "",
      });
    }
    setSkillInput("");
    setErrors({});
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingContractor(null);
    setErrors({});
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleEmergencyContactChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    const fieldName = name.replace("emergencyContact.", "");

    setFormData((prev) => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact!,
        [fieldName]: value,
      },
    }));
  };

  const addSkill = () => {
    const skill = skillInput.trim();
    if (skill && !formData.skills?.includes(skill)) {
      setFormData((prev) => ({
        ...prev,
        skills: [...(prev.skills || []), skill],
      }));
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills?.filter((skill) => skill !== skillToRemove) || [],
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Contractor name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const url = editingContractor
        ? `/api/v1/contractors/${editingContractor._id}`
        : "/api/v1/contractors";

      const method = editingContractor ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadContractors();
        closeForm();
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.error || "Failed to save contractor" });
      }
    } catch (error) {
      console.error("Error saving contractor:", error);
      setErrors({ submit: "Failed to save contractor" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (contractor: Contractor) => {
    if (!confirm(`Are you sure you want to deactivate ${contractor.name}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/contractors/${contractor._id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadContractors();
      } else {
        console.error("Failed to deactivate contractor");
      }
    } catch (error) {
      console.error("Error deactivating contractor:", error);
    }
  };

  const handleSkillFilterChange = (skill: string) => {
    setSkillFilter((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setVerificationFilter("all");
    setSkillFilter([]);
  };

  const exportToCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Business Name",
      "Skills",
      "Status",
      "Verified",
      "Emergency Contact",
      "Created Date",
      "Notes",
    ];

    const csvData = filteredContractors.map((contractor) => [
      contractor.name,
      contractor.email,
      contractor.phone || "",
      contractor.businessName || "",
      contractor.skills?.join("; ") || "",
      contractor.isActive ? "Active" : "Inactive",
      contractor.isVerified ? "Verified" : "Unverified",
      contractor.emergencyContact?.name || "",
      new Date(contractor.createdAt).toLocaleDateString(),
      contractor.notes || "",
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `contractors-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Contractor Management
          </h1>
          <p className="text-gray-600 mt-1">
            {filteredContractors.length} of {contractors.length} contractors
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            disabled={filteredContractors.length === 0}
          >
            Export CSV
          </button>
          <button
            onClick={() => openForm()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Contractor
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, phone..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "active" | "inactive")
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Verification Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verification
            </label>
            <select
              value={verificationFilter}
              onChange={(e) =>
                setVerificationFilter(
                  e.target.value as "all" | "verified" | "unverified",
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Verification</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Skills Filter */}
        {availableSkills.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Skills
            </label>
            <div className="flex flex-wrap gap-2">
              {availableSkills.map((skill) => (
                <button
                  key={skill}
                  onClick={() => handleSkillFilterChange(skill)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    skillFilter.includes(skill)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Contractors List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredContractors.map((contractor) => (
          <div
            key={contractor._id}
            className={`bg-white border rounded-lg p-4 shadow-sm ${
              !contractor.isActive ? "opacity-60 bg-gray-50" : ""
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-3">
                {contractor.profileImage ? (
                  <img
                    src={contractor.profileImage}
                    alt={`${contractor.name} profile`}
                    className="w-10 h-10 rounded-full object-cover border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {contractor.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-medium text-gray-900">
                    {contractor.name}
                  </h3>
                  {contractor.businessName && (
                    <p className="text-xs text-gray-500">
                      {contractor.businessName}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end space-y-1">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    contractor.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {contractor.isActive ? "Active" : "Inactive"}
                </span>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    contractor.isVerified
                      ? "bg-blue-100 text-blue-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {contractor.isVerified ? "Verified" : "Unverified"}
                </span>
              </div>
            </div>

            {contractor.email && (
              <p className="text-sm text-gray-600 mb-1">
                📧 {contractor.email}
              </p>
            )}

            {contractor.phone && (
              <p className="text-sm text-gray-600 mb-1">
                📞 {contractor.phone}
              </p>
            )}

            {contractor.emergencyContact?.name && (
              <p className="text-sm text-gray-600 mb-2">
                🚨 Emergency: {contractor.emergencyContact.name}
                {contractor.emergencyContact.relationship && (
                  <span className="text-gray-500">
                    {" "}
                    ({contractor.emergencyContact.relationship})
                  </span>
                )}
              </p>
            )}

            {contractor.skills && contractor.skills.length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {contractor.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {contractor.notes && (
              <p className="text-sm text-gray-500 mb-3">{contractor.notes}</p>
            )}

            <div className="flex space-x-2">
              <button
                onClick={() => openForm(contractor)}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                Edit
              </button>
              {contractor.isActive && (
                <button
                  onClick={() => handleDeactivate(contractor)}
                  className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                >
                  Deactivate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {contractors.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            No contractors found. Add your first contractor to get started.
          </p>
        </div>
      )}

      {contractors.length > 0 && filteredContractors.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            No contractors match your current filters. Try adjusting your search
            criteria.
          </p>
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {editingContractor ? "Edit Contractor" : "Add New Contractor"}
              </h2>
              <button
                onClick={closeForm}
                className="text-gray-400 hover:text-gray-600"
                disabled={submitting}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Contractor or company name"
                  disabled={submitting}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="contractor@example.com"
                  disabled={submitting}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(555) 123-4567"
                  disabled={submitting}
                />
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addSkill())
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a skill"
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                    disabled={submitting}
                  >
                    Add
                  </button>
                </div>
                {formData.skills && formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                          disabled={submitting}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Status */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={submitting}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Active
                  </span>
                </label>
              </div>

              {/* Verified Status */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isVerified"
                    checked={formData.isVerified}
                    onChange={handleInputChange}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={submitting}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Verified
                  </span>
                </label>
              </div>

              {/* Business Information Section */}
              <div className="border-t pt-4">
                <h3 className="text-md font-medium text-gray-900 mb-3">
                  Business Information
                </h3>

                {/* Business Name */}
                <div className="mb-4">
                  <label
                    htmlFor="businessName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Business Name
                  </label>
                  <input
                    type="text"
                    id="businessName"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Business or company name"
                    disabled={submitting}
                  />
                </div>

                {/* Profile Image URL */}
                <div className="mb-4">
                  <label
                    htmlFor="profileImage"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Profile Image URL
                  </label>
                  <input
                    type="url"
                    id="profileImage"
                    name="profileImage"
                    value={formData.profileImage}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/profile.jpg"
                    disabled={submitting}
                  />
                  {formData.profileImage && (
                    <div className="mt-2">
                      <img
                        src={formData.profileImage}
                        alt="Profile preview"
                        className="w-16 h-16 rounded-full object-cover border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Emergency Contact Section */}
              <div className="border-t pt-4">
                <h3 className="text-md font-medium text-gray-900 mb-3">
                  Emergency Contact
                </h3>

                {/* Emergency Contact Name */}
                <div className="mb-4">
                  <label
                    htmlFor="emergencyContact.name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Contact Name
                  </label>
                  <input
                    type="text"
                    id="emergencyContact.name"
                    name="emergencyContact.name"
                    value={formData.emergencyContact?.name || ""}
                    onChange={handleEmergencyContactChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Emergency contact name"
                    disabled={submitting}
                  />
                </div>

                {/* Emergency Contact Phone */}
                <div className="mb-4">
                  <label
                    htmlFor="emergencyContact.phone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    id="emergencyContact.phone"
                    name="emergencyContact.phone"
                    value={formData.emergencyContact?.phone || ""}
                    onChange={handleEmergencyContactChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(555) 987-6543"
                    disabled={submitting}
                  />
                </div>

                {/* Emergency Contact Relationship */}
                <div className="mb-4">
                  <label
                    htmlFor="emergencyContact.relationship"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Relationship
                  </label>
                  <input
                    type="text"
                    id="emergencyContact.relationship"
                    name="emergencyContact.relationship"
                    value={formData.emergencyContact?.relationship || ""}
                    onChange={handleEmergencyContactChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Relationship to contractor"
                    disabled={submitting}
                  />
                </div>

                {/* Emergency Contact Email */}
                <div className="mb-4">
                  <label
                    htmlFor="emergencyContact.email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Contact Email
                  </label>
                  <input
                    type="email"
                    id="emergencyContact.email"
                    name="emergencyContact.email"
                    value={formData.emergencyContact?.email || ""}
                    onChange={handleEmergencyContactChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Contact Email"
                    disabled={submitting}
                  />
                </div>
              </div>
              {/* Notes */}
              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes about the contractor"
                  disabled={submitting}
                />
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="text-red-500 text-sm">{errors.submit}</div>
              )}

              {/* Form Actions */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting
                    ? editingContractor
                      ? "Updating..."
                      : "Adding..."
                    : editingContractor
                      ? "Update Contractor"
                      : "Add Contractor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
