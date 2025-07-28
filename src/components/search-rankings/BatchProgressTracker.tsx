"use client";

import { useState, useEffect, useCallback } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  DetailedBatchStatus,
  BatchKeywordProgress,
} from "@/types/searchRanking";
import api from "@/utils/api";

interface BatchProgressTrackerProps {
  isActive: boolean;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export default function BatchProgressTracker({
  isActive,
  onComplete,
  onError,
}: BatchProgressTrackerProps) {
  const [status, setStatus] = useState<DetailedBatchStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Format time duration in a human-readable format
  const formatDuration = useCallback((milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }, []);

  // Format time remaining estimate
  const formatTimeRemaining = useCallback((milliseconds: number): string => {
    const minutes = Math.ceil(milliseconds / 60000);
    if (minutes < 1) return "< 1 minute";
    if (minutes === 1) return "1 minute";
    if (minutes < 60) return `${minutes} minutes`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours === 1 && remainingMinutes === 0) return "1 hour";
    if (remainingMinutes === 0) return `${hours} hours`;
    return `${hours}h ${remainingMinutes}m`;
  }, []);

  // Fetch batch status
  const fetchStatus = useCallback(async () => {
    if (!isActive) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await api.get(
        "/api/v1/search-rankings/cron?action=status",
      );
      const newStatus = response.data.result as DetailedBatchStatus;

      setStatus(newStatus);
      setLastUpdate(new Date());

      // Check if processing is complete
      if (
        newStatus.pendingBatches === 0 &&
        newStatus.processingBatches === 0 &&
        newStatus.totalBatches > 0
      ) {
        onComplete?.();
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch batch status";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isActive, onComplete, onError]);

  // Set up polling when active
  useEffect(() => {
    if (!isActive) {
      setStatus(null);
      setError(null);
      return;
    }

    // Initial fetch
    fetchStatus();

    // Set up polling every 3 seconds
    const interval = setInterval(fetchStatus, 3000);

    return () => clearInterval(interval);
  }, [isActive, fetchStatus]);

  // Don't render if not active
  if (!isActive) return null;

  // Loading state
  if (isLoading && !status) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <LoadingSpinner className="w-5 h-5 mr-3" />
          <p className="text-sm font-medium text-blue-800">
            Loading batch status...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !status) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg
            className="w-5 h-5 mr-3 text-red-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm font-medium text-red-800">
            Error loading batch status: {error}
          </p>
        </div>
      </div>
    );
  }

  // No status available
  if (!status) return null;

  const overallProgress = status.progress;
  const isProcessing =
    status.processingBatches > 0 || status.pendingBatches > 0;

  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Batch Processing Progress
          </h3>
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Overall Progress</span>
            <span>{overallProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                overallProgress === 100
                  ? "bg-green-500"
                  : isProcessing
                    ? "bg-blue-500"
                    : "bg-gray-400"
              }`}
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-lg text-gray-900">
              {status.processedKeywords}
            </div>
            <div className="text-gray-600">Keywords Processed</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg text-gray-900">
              {status.totalKeywords}
            </div>
            <div className="text-gray-600">Total Keywords</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg text-gray-900">
              {status.completedBatches}
            </div>
            <div className="text-gray-600">Batches Complete</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg text-gray-900">
              {status.totalBatches}
            </div>
            <div className="text-gray-600">Total Batches</div>
          </div>
        </div>

        {/* Time and API Information */}
        {(status.estimatedTimeRemaining || status.apiCallsUsed) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {status.estimatedTimeRemaining && (
                <div className="text-center">
                  <div className="font-medium text-gray-900">
                    {formatTimeRemaining(status.estimatedTimeRemaining)}
                  </div>
                  <div className="text-gray-600">Estimated Remaining</div>
                </div>
              )}
              {status.apiCallsUsed && (
                <div className="text-center">
                  <div className="font-medium text-gray-900">
                    {status.apiCallsUsed}
                  </div>
                  <div className="text-gray-600">API Calls Used</div>
                </div>
              )}
              {status.averageKeywordTime && (
                <div className="text-center">
                  <div className="font-medium text-gray-900">
                    {formatDuration(status.averageKeywordTime)}
                  </div>
                  <div className="text-gray-600">Avg. per Keyword</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Current Batch Details */}
      {status.currentBatch && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900">
              Current Batch: {status.currentBatch.batchId}
            </h4>
            <div className="flex items-center">
              {status.currentBatch.status === "processing" && (
                <LoadingSpinner className="w-4 h-4 mr-2" />
              )}
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  status.currentBatch.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : status.currentBatch.status === "processing"
                      ? "bg-blue-100 text-blue-800"
                      : status.currentBatch.status === "failed"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                }`}
              >
                {status.currentBatch.status}
              </span>
            </div>
          </div>

          {/* Batch Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Batch Progress</span>
              <span>
                {status.currentBatch.processedCount} /{" "}
                {status.currentBatch.totalCount}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    (status.currentBatch.processedCount /
                      status.currentBatch.totalCount) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Keyword Progress */}
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-gray-700 mb-3">
              Keywords in Current Batch:
            </h5>
            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
              {status.currentBatch.keywordProgress.map((keyword) => (
                <div
                  key={keyword.keywordId}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md"
                >
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {keyword.keyword}
                  </span>
                  <div className="flex items-center ml-2">
                    {keyword.status === "processing" && (
                      <LoadingSpinner className="w-3 h-3 mr-2" />
                    )}
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        keyword.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : keyword.status === "processing"
                            ? "bg-blue-100 text-blue-700"
                            : keyword.status === "error"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {keyword.status === "completed"
                        ? "✓"
                        : keyword.status === "processing"
                          ? "..."
                          : keyword.status === "error"
                            ? "✗"
                            : "○"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Batch Timing */}
          {status.currentBatch.startedAt && (
            <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Started:</span>
                <span>
                  {new Date(status.currentBatch.startedAt).toLocaleTimeString()}
                </span>
              </div>
              {status.currentBatch.estimatedCompletion && (
                <div className="flex justify-between mt-1">
                  <span>Est. Completion:</span>
                  <span>
                    {new Date(
                      status.currentBatch.estimatedCompletion,
                    ).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Batch Summary */}
      {status.totalBatches > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Batch Summary
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium text-green-600">
                {status.completedBatches}
              </div>
              <div className="text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-blue-600">
                {status.processingBatches}
              </div>
              <div className="text-gray-600">Processing</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-600">
                {status.pendingBatches}
              </div>
              <div className="text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-red-600">
                {status.failedBatches}
              </div>
              <div className="text-gray-600">Failed</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
