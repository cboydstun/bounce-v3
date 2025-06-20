import { useState } from "react";
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
  isCheckingRanking: boolean;
}

export default function KeywordManager({
  keywords,
  selectedKeywordId,
  onSelectKeyword,
  onAddKeyword,
  onDeleteKeyword,
  onToggleKeyword,
  onCheckRanking,
  isCheckingRanking,
}: KeywordManagerProps) {
  const [newKeyword, setNewKeyword] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleDeleteKeyword = async (keywordId: string) => {
    if (!confirm("Are you sure you want to delete this keyword?")) {
      return;
    }

    const result = await onDeleteKeyword(keywordId);

    if (!result.success) {
      alert(result.error || "Failed to delete keyword");
    }
  };

  const handleToggleKeyword = async (keywordId: string, isActive: boolean) => {
    const result = await onToggleKeyword(keywordId, isActive);

    if (!result.success) {
      alert(result.error || "Failed to update keyword");
    }
  };

  const handleCheckRanking = async (
    keywordId: string,
    searchDepth?: number,
  ) => {
    const result = await onCheckRanking(keywordId, searchDepth);

    if (!result.success) {
      alert(result.error || "Failed to check ranking");
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium text-gray-900">Keywords</h3>
        <p className="mt-1 text-sm text-gray-500">
          Manage keywords to track in search rankings
        </p>
      </div>

      {/* Add keyword form */}
      <div className="p-4 border-b">
        <form onSubmit={handleAddKeyword}>
          <div className="flex">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Add new keyword"
              className="flex-1 rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              disabled={isAdding}
            />
            <button
              type="submit"
              className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-400"
              disabled={isAdding}
            >
              {isAdding ? (
                <LoadingSpinner className="w-4 h-4 text-white" />
              ) : (
                "Add"
              )}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </form>
      </div>

      {/* Keywords list */}
      <div className="overflow-y-auto max-h-96">
        {keywords.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No keywords added yet
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {keywords.map((keyword) => (
              <li
                key={keyword._id}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${
                  selectedKeywordId === keyword._id ? "bg-indigo-50" : ""
                }`}
                onClick={() => onSelectKeyword(keyword._id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span
                      className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        keyword.isActive ? "bg-green-500" : "bg-gray-300"
                      }`}
                    ></span>
                    <span className="text-sm font-medium text-gray-900">
                      {keyword.keyword}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleKeyword(keyword._id, !keyword.isActive);
                      }}
                      className="text-gray-400 hover:text-gray-500"
                      title={keyword.isActive ? "Disable" : "Enable"}
                    >
                      {keyword.isActive ? (
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteKeyword(keyword._id);
                      }}
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
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Check ranking section */}
      {selectedKeywordId && (
        <div className="p-4 border-t">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Search Depth
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleCheckRanking(selectedKeywordId, 10)}
                  disabled={isCheckingRanking}
                  className="px-3 py-2 text-xs font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                >
                  Quick
                  <div className="text-xs text-gray-500">Top 10</div>
                </button>
                <button
                  onClick={() => handleCheckRanking(selectedKeywordId, 50)}
                  disabled={isCheckingRanking}
                  className="px-3 py-2 text-xs font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                >
                  Standard
                  <div className="text-xs text-gray-500">Top 50</div>
                </button>
                <button
                  onClick={() => handleCheckRanking(selectedKeywordId, 100)}
                  disabled={isCheckingRanking}
                  className="px-3 py-2 text-xs font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                >
                  Deep
                  <div className="text-xs text-gray-500">Top 100</div>
                </button>
              </div>
            </div>

            <button
              onClick={() => handleCheckRanking(selectedKeywordId)}
              disabled={isCheckingRanking}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
            >
              {isCheckingRanking ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2 text-white" />
                  Searching...
                </>
              ) : (
                "Check Ranking (Default: 50)"
              )}
            </button>
          </div>

          <div className="mt-3 text-xs text-gray-500">
            <p>
              <strong>Quick:</strong> 1 API call, fastest
            </p>
            <p>
              <strong>Standard:</strong> Up to 5 API calls, balanced
            </p>
            <p>
              <strong>Deep:</strong> Up to 10 API calls, most thorough
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
