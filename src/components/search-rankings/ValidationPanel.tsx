"use client";

import { useState } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import api from "@/utils/api";
import {
  CseValidationResult,
  ValidationGuidance,
  RankingValidationStatus,
} from "@/types/searchRanking";

interface ValidationPanelProps {
  validationStatus?: RankingValidationStatus;
  className?: string;
}

export default function ValidationPanel({
  validationStatus,
  className = "",
}: ValidationPanelProps) {
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const [diagnosticResult, setDiagnosticResult] =
    useState<CseValidationResult | null>(null);
  const [guidance, setGuidance] = useState<ValidationGuidance | null>(null);
  const [showGuidance, setShowGuidance] = useState(false);

  const runDiagnostic = async () => {
    try {
      setIsRunningDiagnostic(true);
      const response = await api.post("/api/v1/search-rankings/validate", {});
      setDiagnosticResult(response.data.diagnostic);
    } catch (error) {
      console.error("Error running diagnostic:", error);
    } finally {
      setIsRunningDiagnostic(false);
    }
  };

  const loadGuidance = async () => {
    try {
      const response = await api.get("/api/v1/search-rankings/validate");
      setGuidance(response.data.guidance);
      setShowGuidance(true);
    } catch (error) {
      console.error("Error loading guidance:", error);
    }
  };

  const hasValidationIssues =
    validationStatus &&
    (!validationStatus.isValid || validationStatus.warnings.length > 0);

  const hasDiagnosticIssues = diagnosticResult && !diagnosticResult.isHealthy;

  return (
    <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Search Results Validation
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={runDiagnostic}
            disabled={isRunningDiagnostic}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isRunningDiagnostic ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Running...
              </>
            ) : (
              "Run Diagnostic"
            )}
          </button>
          <button
            onClick={loadGuidance}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            View Guide
          </button>
        </div>
      </div>

      {/* Current Validation Status */}
      {hasValidationIssues && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Validation Warnings Detected
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc pl-5 space-y-1">
                  {validationStatus?.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diagnostic Results */}
      {diagnosticResult && (
        <div className="mb-6">
          <div
            className={`p-4 rounded-md ${
              diagnosticResult.isHealthy
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                {diagnosticResult.isHealthy ? (
                  <svg
                    className="h-5 w-5 text-green-400"
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
                    className="h-5 w-5 text-red-400"
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
              </div>
              <div className="ml-3">
                <h3
                  className={`text-sm font-medium ${
                    diagnosticResult.isHealthy
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  CSE Configuration{" "}
                  {diagnosticResult.isHealthy ? "Healthy" : "Issues Detected"}
                </h3>
                {!diagnosticResult.isHealthy && (
                  <div className="mt-2">
                    <div className="text-sm text-red-700">
                      <p className="font-medium mb-2">Issues Found:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {diagnosticResult.issues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                    {diagnosticResult.recommendations.length > 0 && (
                      <div className="mt-3 text-sm text-red-700">
                        <p className="font-medium mb-2">Recommendations:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          {diagnosticResult.recommendations.map(
                            (rec, index) => (
                              <li key={index}>{rec}</li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Test Results Details */}
          {diagnosticResult.testResults.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Test Results:
              </h4>
              <div className="bg-gray-50 rounded-md p-3">
                <div className="space-y-2">
                  {diagnosticResult.testResults.map((result, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm text-gray-600">
                        "{result.keyword}"
                      </span>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-sm font-medium ${
                            result.position > 0 && result.position <= 2
                              ? "text-red-600"
                              : result.position > 0
                                ? "text-green-600"
                                : "text-gray-500"
                          }`}
                        >
                          {result.position > 0
                            ? `#${result.position}`
                            : "Not found"}
                        </span>
                        {result.warnings.length > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            {result.warnings.length} warning
                            {result.warnings.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Configuration Guidance */}
      {showGuidance && guidance && (
        <div className="border-t pt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            CSE Configuration Guide
          </h4>

          {/* Checklist */}
          <div className="mb-6">
            <h5 className="text-sm font-medium text-gray-900 mb-3">
              Configuration Checklist:
            </h5>
            <div className="space-y-3">
              {guidance.checklistItems.map((item) => (
                <div key={item.id} className="flex items-start">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-2 h-2 mt-2 rounded-full ${
                        item.priority === "high"
                          ? "bg-red-400"
                          : item.priority === "medium"
                            ? "bg-yellow-400"
                            : "bg-green-400"
                      }`}
                    />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {item.title}
                    </p>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Configuration Steps */}
          <div className="mb-6">
            <h5 className="text-sm font-medium text-gray-900 mb-3">
              Step-by-Step Configuration:
            </h5>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              {guidance.cseConfigurationSteps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>

          {/* Common Issues */}
          <div>
            <h5 className="text-sm font-medium text-gray-900 mb-3">
              Common Issues & Solutions:
            </h5>
            <div className="space-y-4">
              {guidance.commonIssues.map((issue, index) => (
                <div key={index} className="bg-gray-50 rounded-md p-3">
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Issue: {issue.issue}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    Cause: {issue.cause}
                  </p>
                  <p className="text-sm text-green-700 font-medium">
                    Solution: {issue.solution}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Issues State */}
      {!hasValidationIssues && !hasDiagnosticIssues && !showGuidance && (
        <div className="text-center py-6">
          <svg
            className="mx-auto h-12 w-12 text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No validation issues detected
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Run a diagnostic to verify your CSE configuration.
          </p>
        </div>
      )}
    </div>
  );
}
