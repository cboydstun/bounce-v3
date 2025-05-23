"use client";

import React, { useState, useEffect } from "react";
import { Contractor, ContractorFormData } from "@/types/contractor";

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(
    null,
  );
  const [formData, setFormData] = useState<ContractorFormData>({
    name: "",
    email: "",
    phone: "",
    skills: [],
    isActive: true,
    notes: "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadContractors();
  }, []);

  const loadContractors = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/contractors?active=false"); // Get all contractors
      if (response.ok) {
        const data = await response.json();
        setContractors(data);
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
        email: contractor.email || "",
        phone: contractor.phone || "",
        skills: contractor.skills || [],
        isActive: contractor.isActive,
        notes: contractor.notes || "",
      });
    } else {
      setEditingContractor(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        skills: [],
        isActive: true,
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
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
        <h1 className="text-2xl font-bold text-gray-900">
          Contractor Management
        </h1>
        <button
          onClick={() => openForm()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Contractor
        </button>
      </div>

      {/* Contractors List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {contractors.map((contractor) => (
          <div
            key={contractor._id}
            className={`bg-white border rounded-lg p-4 shadow-sm ${
              !contractor.isActive ? "opacity-60 bg-gray-50" : ""
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-gray-900">{contractor.name}</h3>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  contractor.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {contractor.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            {contractor.email && (
              <p className="text-sm text-gray-600 mb-1">
                📧 {contractor.email}
              </p>
            )}

            {contractor.phone && (
              <p className="text-sm text-gray-600 mb-2">
                📞 {contractor.phone}
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
                  Email
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

              {errors.submit && (
                <p className="text-red-500 text-sm">{errors.submit}</p>
              )}

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting
                    ? "Saving..."
                    : editingContractor
                      ? "Update"
                      : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
