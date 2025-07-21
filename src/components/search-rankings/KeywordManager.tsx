import { useState, useMemo, useCallback } from "react";
import { SearchKeyword } from "@/types/searchRanking";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface KeywordManagerProps {
  keywords: SearchKeyword[];
  selectedKeywordId: string | null;
  onSelectKeyword: (keywordId: string) => void;
  onAddKeyword: (
    keyword: string,
  ) => Promise<{ success: boolean; error?: string }>;
  onDeleteKeyword: (
    keywordId: string,
  ) => Promise<{ success: boolean; error?: string }>;
  onToggleKeyword: (
    keywordId: string,
    isActive: boolean,
  ) => Promise<{ success: boolean; error?: string }>;
  onCheckRanking: (
    keywordId: string,
    searchDepth?: number,
  ) => Promise<{ success: boolean; error?: string }>;
  onBulkCheckRanking?: (
    keywordIds: string[],
    searchDepth?: number,
  ) => Promise<{ success: boolean; error?: string }>;
  isCheckingRanking: boolean;
  queueStatus?: {
    pending: number;
    processing: string | null;
    estimatedTime: number;
  };
  lastRankingDates?: Record<string, Date>; // keywordId -> most recent ranking date
}

type TabType = "all" | "active" | "inactive";
type SortField = "keyword" | "status" | "lastChecked" | "updatedAt";
type SortDirection = "asc" | "desc";

export default function KeywordManager({
  keywords,
  selectedKeywordId,
  onSelectKeyword,
  onAddKeyword,
  onDeleteKeyword,
  onToggleKeyword,
  onCheckRanking,
  onBulkCheckRanking,
  isCheckingRanking,
  queueStatus,
  lastRankingDates,
}: KeywordManagerProps) {
  // State management
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(
    new Set(),
  );
  const [sortField, setSortField] = useState<SortField>("keyword");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [bulkKeywords, setBulkKeywords] = useState("");

  // Filtered and sorted keywords
  const filteredKeywords = useMemo(() => {
    let filtered = keywords;

    // Filter by tab
    if (activeTab === "active") {
      filtered = filtered.filter((k) => k.isActive);
    } else if (activeTab === "inactive") {
      filtered = filtered.filter((k) => !k.isActive);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((k) =>
        k.keyword.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortField === "status") {
        aValue = a.isActive ? "active" : "inactive";
        bValue = b.isActive ? "active" : "inactive";
      } else if (sortField === "lastChecked") {
        // Use the actual last ranking dates for sorting
        aValue = lastRankingDates?.[a._id] || new Date(0); // Use epoch if never checked
        bValue = lastRankingDates?.[b._id] || new Date(0);
      } else {
        aValue = a[sortField as keyof SearchKeyword];
        bValue = b[sortField as keyof SearchKeyword];
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [keywords, activeTab, searchQuery, sortField, sortDirection]);

  // Statistics
  const stats = useMemo(() => {
    const total = keywords.length;
    const active = keywords.filter((k) => k.isActive).length;
    const inactive = total - active;
    const selected = selectedKeywords.size;

    return { total, active, inactive, selected };
  }, [keywords, selectedKeywords]);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSelectAll = () => {
    if (selectedKeywords.size === filteredKeywords.length) {
      setSelectedKeywords(new Set());
    } else {
      setSelectedKeywords(new Set(filteredKeywords.map((k) => k._id)));
    }
  };

  const handleSelectKeyword = (keywordId: string) => {
    const newSelected = new Set(selectedKeywords);
    if (newSelected.has(keywordId)) {
      newSelected.delete(keywordId);
    } else {
      newSelected.add(keywordId);
    }
    setSelectedKeywords(newSelected);
  };

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) {
      setError("Keyword cannot be empty");
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      const result = await onAddKeyword(newKeyword.trim());
      if (result.success) {
        setNewKeyword("");
      } else {
        setError(result.error || "Failed to add keyword");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkKeywords.trim()) return;

    const keywordsToAdd = bulkKeywords
      .split("\n")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    setIsAdding(true);
    let successCount = 0;
    let errorCount = 0;

    for (const keyword of keywordsToAdd) {
      try {
        const result = await onAddKeyword(keyword);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch {
        errorCount++;
      }
    }

    setIsAdding(false);
    setBulkKeywords("");
    setShowImportModal(false);

    if (errorCount > 0) {
      setError(`Added ${successCount} keywords, ${errorCount} failed`);
    } else {
      setError(null);
    }
  };

  const handleBulkAction = async (
    action: "enable" | "disable" | "delete" | "check",
  ) => {
    if (selectedKeywords.size === 0) return;

    const keywordIds = Array.from(selectedKeywords);

    try {
      switch (action) {
        case "enable":
          for (const id of keywordIds) {
            await onToggleKeyword(id, true);
          }
          break;
        case "disable":
          for (const id of keywordIds) {
            await onToggleKeyword(id, false);
          }
          break;
        case "delete":
          if (confirm(`Delete ${keywordIds.length} keywords?`)) {
            for (const id of keywordIds) {
              await onDeleteKeyword(id);
            }
          }
          break;
        case "check":
          if (onBulkCheckRanking) {
            await onBulkCheckRanking(keywordIds, 20);
          }
          break;
      }
      setSelectedKeywords(new Set());
    } catch (err) {
      setError(`Bulk ${action} failed`);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Keyword Manager
            </h3>
            <p className="text-sm text-gray-500">
              {stats.total} total • {stats.active} active • {stats.inactive}{" "}
              inactive
              {stats.selected > 0 && ` • ${stats.selected} selected`}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Import
            </button>
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                showBulkActions
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Bulk Actions
            </button>
          </div>
        </div>

        {/* Search and Add */}
        <div className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <form onSubmit={handleAddKeyword} className="flex">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Add keyword"
              className="px-3 py-2 border border-gray-300 rounded-l-md focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isAdding}
            />
            <button
              type="submit"
              disabled={isAdding}
              className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {isAdding ? <LoadingSpinner className="w-4 h-4" /> : "Add"}
            </button>
          </form>
        </div>

        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-4">
          {[
            { key: "all", label: "All Keywords", count: stats.total },
            { key: "active", label: "Active", count: stats.active },
            { key: "inactive", label: "Inactive", count: stats.inactive },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="p-3 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={
                    selectedKeywords.size === filteredKeywords.length &&
                    filteredKeywords.length > 0
                  }
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Select All</span>
              </label>
              <span className="text-sm text-gray-500">
                {selectedKeywords.size} selected
              </span>
            </div>
            {selectedKeywords.size > 0 && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkAction("enable")}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Enable
                </button>
                <button
                  onClick={() => handleBulkAction("disable")}
                  className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Disable
                </button>
                <button
                  onClick={() => handleBulkAction("check")}
                  className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  disabled={isCheckingRanking}
                >
                  Check Rankings
                </button>
                <button
                  onClick={() => handleBulkAction("delete")}
                  className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Queue Status */}
      {queueStatus && queueStatus.pending > 0 && (
        <div className="p-3 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <LoadingSpinner className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                Processing rankings: {queueStatus.pending} pending
                {queueStatus.processing &&
                  ` • Currently: ${queueStatus.processing}`}
              </span>
            </div>
            <span className="text-xs text-blue-600">
              Est. {Math.round(queueStatus.estimatedTime / 60)}m remaining
            </span>
          </div>
        </div>
      )}

      {/* Keywords Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {showBulkActions && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedKeywords.size === filteredKeywords.length &&
                      filteredKeywords.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
              )}
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("keyword")}
              >
                Keyword{" "}
                {sortField === "keyword" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("status")}
              >
                Status{" "}
                {sortField === "status" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("lastChecked")}
              >
                Last Checked{" "}
                {sortField === "lastChecked" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredKeywords.length === 0 ? (
              <tr>
                <td
                  colSpan={showBulkActions ? 5 : 4}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  {searchQuery
                    ? "No keywords match your search"
                    : "No keywords found"}
                </td>
              </tr>
            ) : (
              filteredKeywords.map((keyword) => (
                <tr
                  key={keyword._id}
                  className={`hover:bg-gray-50 cursor-pointer ${
                    selectedKeywordId === keyword._id ? "bg-indigo-50" : ""
                  }`}
                  onClick={() => onSelectKeyword(keyword._id)}
                >
                  {showBulkActions && (
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedKeywords.has(keyword._id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectKeyword(keyword._id);
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                  )}
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {keyword.keyword}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        keyword.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {keyword.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {lastRankingDates && lastRankingDates[keyword._id]
                      ? formatDate(lastRankingDates[keyword._id])
                      : "Never checked"}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleKeyword(keyword._id, !keyword.isActive);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 text-sm"
                      >
                        {keyword.isActive ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCheckRanking(keyword._id, 20);
                        }}
                        disabled={isCheckingRanking}
                        className="text-blue-600 hover:text-blue-900 text-sm disabled:text-gray-400"
                      >
                        Check
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Delete this keyword?")) {
                            onDeleteKeyword(keyword._id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Rate Limiting Info */}
      <div className="p-4 bg-gray-50 border-t">
        <div className="text-xs text-gray-600">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <strong>Rate Limiting:</strong> 8s between keywords, 4s between
              pages
            </div>
            <div>
              <strong>API Usage:</strong> ~2 calls per keyword (20 positions)
            </div>
            <div>
              <strong>Bulk Estimate:</strong> {stats.active} active keywords ≈{" "}
              {Math.round((stats.active * 8) / 60)}min
            </div>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Import Keywords</h3>
            <textarea
              value={bulkKeywords}
              onChange={(e) => setBulkKeywords(e.target.value)}
              placeholder="Enter keywords, one per line..."
              rows={8}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkImport}
                disabled={isAdding || !bulkKeywords.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
              >
                {isAdding ? <LoadingSpinner className="w-4 h-4" /> : "Import"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
