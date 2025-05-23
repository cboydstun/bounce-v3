import { useState } from "react";
import { ManagedCompetitor } from "@/types/searchRanking";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface CompetitorManagerProps {
  competitors: ManagedCompetitor[];
  onAddCompetitor: (
    name: string,
    url: string,
    notes?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  onUpdateCompetitor: (
    id: string,
    data: { name?: string; url?: string; notes?: string; isActive?: boolean },
  ) => Promise<{ success: boolean; error?: string }>;
  onDeleteCompetitor: (
    id: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

export default function CompetitorManager({
  competitors,
  onAddCompetitor,
  onUpdateCompetitor,
  onDeleteCompetitor,
}: CompetitorManagerProps) {
  const [newCompetitor, setNewCompetitor] = useState({
    name: "",
    url: "",
    notes: "",
  });
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", url: "", notes: "" });

  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCompetitor.name.trim() || !newCompetitor.url.trim()) {
      setError("Name and URL are required");
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      const result = await onAddCompetitor(
        newCompetitor.name.trim(),
        newCompetitor.url.trim(),
        newCompetitor.notes.trim() || undefined,
      );

      if (result.success) {
        setNewCompetitor({ name: "", url: "", notes: "" });
      } else {
        setError(result.error || "Failed to add competitor");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      err instanceof Error && console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteCompetitor = async (id: string) => {
    if (!confirm("Are you sure you want to delete this competitor?")) {
      return;
    }

    const result = await onDeleteCompetitor(id);

    if (!result.success) {
      alert(result.error || "Failed to delete competitor");
    }
  };

  const handleToggleCompetitor = async (id: string, isActive: boolean) => {
    const result = await onUpdateCompetitor(id, { isActive });

    if (!result.success) {
      alert(result.error || "Failed to update competitor");
    }
  };

  const startEditing = (competitor: ManagedCompetitor) => {
    setEditingId(competitor._id);
    setEditForm({
      name: competitor.name,
      url: competitor.url,
      notes: competitor.notes || "",
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({ name: "", url: "", notes: "" });
  };

  const handleUpdateCompetitor = async (id: string) => {
    if (!editForm.name.trim() || !editForm.url.trim()) {
      alert("Name and URL are required");
      return;
    }

    const result = await onUpdateCompetitor(id, {
      name: editForm.name.trim(),
      url: editForm.url.trim(),
      notes: editForm.notes.trim() || undefined,
    });

    if (result.success) {
      cancelEditing();
    } else {
      alert(result.error || "Failed to update competitor");
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium text-gray-900">Competitors</h3>
        <p className="mt-1 text-sm text-gray-500">
          Manage competitors to track in search rankings
        </p>
      </div>

      {/* Add competitor form */}
      <div className="p-4 border-b">
        <form onSubmit={handleAddCompetitor}>
          <div className="space-y-3">
            <div>
              <label
                htmlFor="competitor-name"
                className="block text-sm font-medium text-gray-700"
              >
                Name
              </label>
              <input
                id="competitor-name"
                type="text"
                value={newCompetitor.name}
                onChange={(e) =>
                  setNewCompetitor({ ...newCompetitor, name: e.target.value })
                }
                placeholder="Competitor name"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                disabled={isAdding}
              />
            </div>

            <div>
              <label
                htmlFor="competitor-url"
                className="block text-sm font-medium text-gray-700"
              >
                URL
              </label>
              <input
                id="competitor-url"
                type="text"
                value={newCompetitor.url}
                onChange={(e) =>
                  setNewCompetitor({ ...newCompetitor, url: e.target.value })
                }
                placeholder="https://example.com"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                disabled={isAdding}
              />
            </div>

            <div>
              <label
                htmlFor="competitor-notes"
                className="block text-sm font-medium text-gray-700"
              >
                Notes (optional)
              </label>
              <textarea
                id="competitor-notes"
                value={newCompetitor.notes}
                onChange={(e) =>
                  setNewCompetitor({ ...newCompetitor, notes: e.target.value })
                }
                placeholder="Additional notes"
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                disabled={isAdding}
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
              disabled={isAdding}
            >
              {isAdding ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2 text-white" />
                  Adding...
                </>
              ) : (
                "Add Competitor"
              )}
            </button>
          </div>

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </form>
      </div>

      {/* Competitors list */}
      <div className="overflow-y-auto max-h-96">
        {competitors.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No competitors added yet
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {competitors.map((competitor) => (
              <li key={competitor._id} className="p-4 hover:bg-gray-50">
                {editingId === competitor._id ? (
                  // Edit form
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        URL
                      </label>
                      <input
                        type="text"
                        value={editForm.url}
                        onChange={(e) =>
                          setEditForm({ ...editForm, url: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Notes
                      </label>
                      <textarea
                        value={editForm.notes}
                        onChange={(e) =>
                          setEditForm({ ...editForm, notes: e.target.value })
                        }
                        rows={2}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdateCompetitor(competitor._id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display view
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span
                          className={`inline-block w-2 h-2 rounded-full mr-2 ${
                            competitor.isActive ? "bg-green-500" : "bg-gray-300"
                          }`}
                        ></span>
                        <span className="text-sm font-medium text-gray-900">
                          {competitor.name}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            handleToggleCompetitor(
                              competitor._id,
                              !competitor.isActive,
                            )
                          }
                          className="text-gray-400 hover:text-gray-500"
                          title={competitor.isActive ? "Disable" : "Enable"}
                        >
                          {competitor.isActive ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => startEditing(competitor)}
                          className="text-blue-400 hover:text-blue-500"
                          title="Edit"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteCompetitor(competitor._id)}
                          className="text-red-400 hover:text-red-500"
                          title="Delete"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 mb-1">
                      <a
                        href={competitor.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        {competitor.url}
                      </a>
                    </div>
                    {competitor.notes && (
                      <div className="text-sm text-gray-500 italic">
                        {competitor.notes}
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
