import React, { useState, useEffect } from "react";
import { OptimizedRoute } from "@/utils/routeOptimization";
import { MultiRouteResult } from "@/utils/multiDriverOptimization";
import { TaskTemplate } from "@/types/taskTemplate";
import { TaskPriority } from "@/types/task";
import {
  RouteToTaskConverter,
  RouteConversionOptions,
  RouteConversionResult,
  BatchRouteConversionResult,
} from "@/utils/routeToTaskConverter";
import {
  BatchTaskCreator,
  BatchTaskCreationOptions,
  BatchTaskCreationResult,
  BatchTaskProgress,
} from "@/utils/batchTaskCreator";
import ContractorSelector from "./ContractorSelector";
import TaskTemplateSelector from "./TaskTemplateSelector";
import { TaskFormData } from "@/types/task";

// Task Preview Card Component
interface TaskPreviewCardProps {
  task: TaskFormData;
  index: number;
}

const TaskPreviewCard: React.FC<TaskPreviewCardProps> = ({ task, index }) => {
  const [expanded, setExpanded] = useState(false);

  const formatDateTime = (dateTime: Date | string) => {
    const date = typeof dateTime === "string" ? new Date(dateTime) : dateTime;
    return date.toLocaleString();
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "text-red-600 bg-red-50 border-red-200";
      case "Medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Low":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-500">
              #{index + 1}
            </span>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority || "Medium")}`}
            >
              {task.priority || "Medium"}
            </span>
            <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full border border-blue-200">
              {task.type}
            </span>
          </div>
          <h5 className="font-medium text-gray-900 mb-1">
            {task.title || `${task.type} Task`}
          </h5>
        </div>
        {task.paymentAmount && (
          <div className="text-right">
            <span className="text-lg font-semibold text-green-600">
              ${task.paymentAmount.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div>
          <span className="font-medium">Scheduled:</span>{" "}
          {formatDateTime(task.scheduledDateTime)}
        </div>

        {task.address && (
          <div>
            <span className="font-medium">Address:</span> {task.address}
          </div>
        )}

        {task.assignedContractors && task.assignedContractors.length > 0 && (
          <div>
            <span className="font-medium">Assigned to:</span>{" "}
            {task.assignedContractors.length} contractor(s)
          </div>
        )}

        <div>
          <span className="font-medium">Description:</span>
          <div className="mt-1">
            {expanded ? (
              <div className="whitespace-pre-wrap">{task.description}</div>
            ) : (
              <div>{truncateText(task.description)}</div>
            )}
            {task.description.length > 100 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-blue-600 hover:text-blue-800 text-xs mt-1 font-medium"
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface RouteConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTasksCreated: (result: BatchTaskCreationResult) => void;
  singleRoute?: OptimizedRoute; // For single route conversion
  multiRouteResult?: MultiRouteResult; // For multi-route conversion
  routeDate: Date;
  startAddress: string;
}

export default function RouteConversionModal({
  isOpen,
  onClose,
  onTasksCreated,
  singleRoute,
  multiRouteResult,
  routeDate,
  startAddress,
}: RouteConversionModalProps) {
  const [conversionOptions, setConversionOptions] =
    useState<RouteConversionOptions>({
      granularity: "individual",
      paymentCalculation: "template",
      includeRouteMetadata: true,
      taskPriority: "Medium" as TaskPriority,
      schedulingOffset: 0,
    });

  const [batchOptions, setBatchOptions] = useState<BatchTaskCreationOptions>({
    rollbackOnFailure: false,
    continueOnError: true,
    maxConcurrency: 5,
  });

  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(
    null,
  );
  const [selectedContractors, setSelectedContractors] = useState<string[]>([]);
  const [customPaymentAmount, setCustomPaymentAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversionResult, setConversionResult] = useState<
    RouteConversionResult | BatchRouteConversionResult | null
  >(null);
  const [progress, setProgress] = useState<BatchTaskProgress | null>(null);
  const [step, setStep] = useState<
    "options" | "preview" | "creating" | "complete"
  >("options");

  // Calculate estimated task count
  const estimatedTaskCount = React.useMemo(() => {
    if (singleRoute) {
      return conversionOptions.granularity === "individual"
        ? singleRoute.timeSlots.length
        : 1;
    } else if (multiRouteResult) {
      if (conversionOptions.granularity === "individual") {
        return multiRouteResult.routes.reduce(
          (sum, route) => sum + route.timeSlots.length,
          0,
        );
      } else {
        return multiRouteResult.routes.filter(
          (route) => route.timeSlots.length > 0,
        ).length;
      }
    }
    return 0;
  }, [singleRoute, multiRouteResult, conversionOptions.granularity]);

  // Update batch options based on task count
  useEffect(() => {
    const recommendedOptions =
      BatchTaskCreator.getRecommendedOptions(estimatedTaskCount);
    setBatchOptions(recommendedOptions);
  }, [estimatedTaskCount]);

  const handleConversionOptionsChange = (
    field: keyof RouteConversionOptions,
    value: any,
  ) => {
    setConversionOptions((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBatchOptionsChange = (
    field: keyof BatchTaskCreationOptions,
    value: any,
  ) => {
    setBatchOptions((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTemplateSelect = (template: TaskTemplate | null) => {
    setSelectedTemplate(template);
    setConversionOptions((prev) => ({
      ...prev,
      templateId: template?._id,
    }));
  };

  const handleContractorsChange = (contractorIds: string[]) => {
    setSelectedContractors(contractorIds);
    setConversionOptions((prev) => ({
      ...prev,
      contractorIds,
    }));
  };

  const handlePreviewConversion = async () => {
    setError(null);
    setLoading(true);

    try {
      // Validate options
      const validationErrors =
        RouteToTaskConverter.validateConversionOptions(conversionOptions);
      if (validationErrors.length > 0) {
        setError(validationErrors.join(", "));
        return;
      }

      // Update conversion options with form data
      const finalOptions: RouteConversionOptions = {
        ...conversionOptions,
        customPaymentAmount: customPaymentAmount
          ? parseFloat(customPaymentAmount)
          : undefined,
      };

      let result: RouteConversionResult | BatchRouteConversionResult;

      if (singleRoute) {
        result = await RouteToTaskConverter.convertSingleRoute(
          singleRoute,
          finalOptions,
          selectedTemplate || undefined,
        );
      } else if (multiRouteResult) {
        result = await RouteToTaskConverter.convertMultipleRoutes(
          multiRouteResult,
          finalOptions,
          selectedTemplate || undefined,
        );
      } else {
        throw new Error("No route data provided");
      }

      if (!result.success) {
        setError(result.errors.join(", "));
        return;
      }

      setConversionResult(result);
      setStep("preview");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to preview conversion",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTasks = async () => {
    if (!conversionResult) return;

    setError(null);
    setLoading(true);
    setStep("creating");

    try {
      const optionsWithProgress: BatchTaskCreationOptions = {
        ...batchOptions,
        progressCallback: setProgress,
      };

      let creationResult: BatchTaskCreationResult;

      if ("routeResults" in conversionResult) {
        // Batch route conversion result
        creationResult =
          await BatchTaskCreator.createTasksFromBatchRouteConversion(
            conversionResult,
            optionsWithProgress,
          );
      } else {
        // Single route conversion result
        creationResult = await BatchTaskCreator.createTasksFromRouteConversion(
          conversionResult,
          optionsWithProgress,
        );
      }

      if (creationResult.success || creationResult.totalCreated > 0) {
        setStep("complete");
        onTasksCreated(creationResult);
      } else {
        setError(creationResult.errors.join(", "));
        setStep("preview");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create tasks");
      setStep("preview");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setStep("options");
      setConversionResult(null);
      setProgress(null);
      setError(null);
      onClose();
    }
  };

  const renderOptionsStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Conversion Options
        </h3>

        {/* Route Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <h4 className="font-medium text-blue-900 mb-2">Route Summary</h4>
          <div className="text-sm text-blue-800">
            <p>Date: {routeDate.toLocaleDateString()}</p>
            <p>Start: {startAddress}</p>
            {singleRoute && (
              <>
                <p>Stops: {singleRoute.timeSlots.length}</p>
                <p>
                  Distance: {(singleRoute.totalDistance / 1000).toFixed(1)}km
                </p>
                <p>
                  Duration: {Math.round(singleRoute.totalDuration / 3600)}h{" "}
                  {Math.round((singleRoute.totalDuration % 3600) / 60)}m
                </p>
              </>
            )}
            {multiRouteResult && (
              <>
                <p>Drivers: {multiRouteResult.routes.length}</p>
                <p>
                  Total Stops:{" "}
                  {multiRouteResult.routes.reduce(
                    (sum, route) => sum + route.timeSlots.length,
                    0,
                  )}
                </p>
                <p>
                  Total Distance:{" "}
                  {(multiRouteResult.totalDistance / 1000).toFixed(1)}km
                </p>
              </>
            )}
          </div>
        </div>

        {/* Task Granularity */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Task Granularity
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="granularity"
                value="individual"
                checked={conversionOptions.granularity === "individual"}
                onChange={(e) =>
                  handleConversionOptionsChange("granularity", e.target.value)
                }
                className="mr-2"
              />
              <span className="text-sm">
                Individual tasks per delivery stop
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="granularity"
                value="consolidated"
                checked={conversionOptions.granularity === "consolidated"}
                onChange={(e) =>
                  handleConversionOptionsChange("granularity", e.target.value)
                }
                className="mr-2"
              />
              <span className="text-sm">One consolidated task per route</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Estimated tasks to create: {estimatedTaskCount}
          </p>
        </div>

        {/* Task Template */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Task Template (Optional)
          </label>
          <TaskTemplateSelector
            selectedTemplateId={selectedTemplate?._id}
            onTemplateSelect={handleTemplateSelect}
            disabled={loading}
          />
        </div>

        {/* Task Priority */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Task Priority
          </label>
          <select
            value={conversionOptions.taskPriority}
            onChange={(e) =>
              handleConversionOptionsChange(
                "taskPriority",
                e.target.value as TaskPriority,
              )
            }
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Payment Calculation */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Calculation
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="paymentCalculation"
                value="template"
                checked={conversionOptions.paymentCalculation === "template"}
                onChange={(e) =>
                  handleConversionOptionsChange(
                    "paymentCalculation",
                    e.target.value,
                  )
                }
                className="mr-2"
              />
              <span className="text-sm">Use template rules</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="paymentCalculation"
                value="custom"
                checked={conversionOptions.paymentCalculation === "custom"}
                onChange={(e) =>
                  handleConversionOptionsChange(
                    "paymentCalculation",
                    e.target.value,
                  )
                }
                className="mr-2"
              />
              <span className="text-sm">Custom amount per task</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="paymentCalculation"
                value="none"
                checked={conversionOptions.paymentCalculation === "none"}
                onChange={(e) =>
                  handleConversionOptionsChange(
                    "paymentCalculation",
                    e.target.value,
                  )
                }
                className="mr-2"
              />
              <span className="text-sm">No payment amount</span>
            </label>
          </div>

          {conversionOptions.paymentCalculation === "custom" && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Payment Amount ($)
              </label>
              <input
                type="number"
                min="0"
                max="999999.99"
                step="0.01"
                value={customPaymentAmount}
                onChange={(e) => setCustomPaymentAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="0.00"
              />
            </div>
          )}
        </div>

        {/* Contractor Assignment */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assign Contractors (Optional)
          </label>
          <ContractorSelector
            selectedContractorIds={selectedContractors}
            onContractorsChange={handleContractorsChange}
            disabled={loading}
          />
        </div>

        {/* Scheduling Offset */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Scheduling Offset (Hours)
          </label>
          <input
            type="number"
            min="-24"
            max="24"
            value={conversionOptions.schedulingOffset}
            onChange={(e) =>
              handleConversionOptionsChange(
                "schedulingOffset",
                parseInt(e.target.value) || 0,
              )
            }
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
          <p className="text-xs text-gray-500 mt-1">
            Offset task scheduling from route start time (negative for earlier,
            positive for later)
          </p>
        </div>

        {/* Include Route Metadata */}
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={conversionOptions.includeRouteMetadata}
              onChange={(e) =>
                handleConversionOptionsChange(
                  "includeRouteMetadata",
                  e.target.checked,
                )
              }
              className="mr-2"
            />
            <span className="text-sm">
              Include route optimization metadata in task descriptions
            </span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderPreviewStep = () => {
    if (!conversionResult) return null;

    const totalTasks =
      "routeResults" in conversionResult
        ? conversionResult.totalTasksToCreate
        : conversionResult.tasksToCreate.length;

    // Get all tasks to preview
    const tasksToPreview =
      "routeResults" in conversionResult
        ? conversionResult.routeResults.flatMap(
            (result) => result.tasksToCreate,
          )
        : conversionResult.tasksToCreate;

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Task Preview
          </h3>

          {/* Conversion Summary */}
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <h4 className="font-medium text-green-900 mb-2">
              Conversion Summary
            </h4>
            <div className="text-sm text-green-800">
              <p>Tasks to create: {totalTasks}</p>
              {conversionResult.warnings.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium">Warnings:</p>
                  <ul className="list-disc list-inside">
                    {conversionResult.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Task Previews */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">
              Tasks to be Created
            </h4>
            <div className="max-h-96 overflow-y-auto space-y-3 border border-gray-200 rounded-md p-4">
              {tasksToPreview.map((task, index) => (
                <TaskPreviewCard key={index} task={task} index={index} />
              ))}
            </div>
          </div>

          {/* Batch Options */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">
              Batch Creation Options
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Concurrency
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={batchOptions.maxConcurrency}
                  onChange={(e) =>
                    handleBatchOptionsChange(
                      "maxConcurrency",
                      parseInt(e.target.value) || 5,
                    )
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={batchOptions.continueOnError}
                    onChange={(e) =>
                      handleBatchOptionsChange(
                        "continueOnError",
                        e.target.checked,
                      )
                    }
                    className="mr-2"
                  />
                  <span className="text-sm">Continue on error</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={batchOptions.rollbackOnFailure}
                    onChange={(e) =>
                      handleBatchOptionsChange(
                        "rollbackOnFailure",
                        e.target.checked,
                      )
                    }
                    disabled={batchOptions.continueOnError}
                    className="mr-2"
                  />
                  <span className="text-sm">Rollback on failure</span>
                </label>
              </div>
            </div>

            {/* Estimated Time */}
            <div className="mt-3 text-sm text-gray-600">
              {(() => {
                const estimate = BatchTaskCreator.estimateBatchCreationTime(
                  totalTasks,
                  batchOptions,
                );
                return `Estimated creation time: ${estimate.estimatedMinutes}m ${estimate.estimatedSeconds}s`;
              })()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCreatingStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Creating Tasks
        </h3>

        {progress && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-blue-900">
                  Progress
                </span>
                <span className="text-sm text-blue-800">
                  {progress.percentage}%
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                ></div>
              </div>
              <div className="mt-2 text-sm text-blue-800">
                <p>
                  Completed: {progress.completed} / {progress.total}
                </p>
                {progress.failed > 0 && <p>Failed: {progress.failed}</p>}
              </div>
            </div>
          </div>
        )}

        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Creating tasks, please wait...</p>
        </div>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
          <svg
            className="h-6 w-6 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Tasks Created Successfully!
        </h3>
        <p className="text-gray-600">
          Your route has been converted to tasks and contractors have been
          notified.
        </p>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-8 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-medium text-gray-900">
              Convert Route to Tasks
            </h2>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <svg
                className="h-6 w-6"
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

          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex items-center">
              {["options", "preview", "creating", "complete"].map(
                (stepName, index) => (
                  <React.Fragment key={stepName}>
                    <div
                      className={`flex items-center ${
                        step === stepName
                          ? "text-blue-600"
                          : [
                                "options",
                                "preview",
                                "creating",
                                "complete",
                              ].indexOf(step) > index
                            ? "text-green-600"
                            : "text-gray-400"
                      }`}
                    >
                      <div
                        className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${
                          step === stepName
                            ? "border-blue-600 bg-blue-50"
                            : [
                                  "options",
                                  "preview",
                                  "creating",
                                  "complete",
                                ].indexOf(step) > index
                              ? "border-green-600 bg-green-50"
                              : "border-gray-300"
                        }`}
                      >
                        {["options", "preview", "creating", "complete"].indexOf(
                          step,
                        ) > index ? (
                          <svg
                            className="h-4 w-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <span className="text-sm font-medium">
                            {index + 1}
                          </span>
                        )}
                      </div>
                      <span className="ml-2 text-sm font-medium capitalize">
                        {stepName}
                      </span>
                    </div>
                    {index < 3 && (
                      <div
                        className={`flex-1 h-0.5 mx-4 ${
                          [
                            "options",
                            "preview",
                            "creating",
                            "complete",
                          ].indexOf(step) > index
                            ? "bg-green-600"
                            : "bg-gray-300"
                        }`}
                      />
                    )}
                  </React.Fragment>
                ),
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Step Content */}
          <div className="min-h-96">
            {step === "options" && renderOptionsStep()}
            {step === "preview" && renderPreviewStep()}
            {step === "creating" && renderCreatingStep()}
            {step === "complete" && renderCompleteStep()}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            {step === "options" && (
              <>
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePreviewConversion}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 flex items-center"
                >
                  {loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  Preview Tasks
                </button>
              </>
            )}

            {step === "preview" && (
              <>
                <button
                  onClick={() => setStep("options")}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateTasks}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 flex items-center"
                >
                  {loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  Create Tasks
                </button>
              </>
            )}

            {step === "complete" && (
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
