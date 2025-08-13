import { TaskFormData } from "@/types/task";
import {
  RouteConversionResult,
  BatchRouteConversionResult,
} from "./routeToTaskConverter";

/**
 * Options for batch task creation
 */
export interface BatchTaskCreationOptions {
  rollbackOnFailure: boolean; // Whether to rollback all tasks if any fail
  continueOnError: boolean; // Whether to continue creating tasks if some fail
  maxConcurrency: number; // Maximum number of concurrent task creations
  progressCallback?: (progress: BatchTaskProgress) => void; // Progress callback
}

/**
 * Progress information for batch task creation
 */
export interface BatchTaskProgress {
  total: number;
  completed: number;
  failed: number;
  currentTask?: string;
  percentage: number;
}

/**
 * Result of batch task creation
 */
export interface BatchTaskCreationResult {
  success: boolean;
  createdTasks: any[]; // Array of created task objects
  failedTasks: Array<{
    taskData: TaskFormData;
    error: string;
  }>;
  totalAttempted: number;
  totalCreated: number;
  totalFailed: number;
  errors: string[];
  warnings: string[];
  rollbackPerformed: boolean;
}

/**
 * Utility class for creating multiple tasks in batches
 */
export class BatchTaskCreator {
  /**
   * Create multiple tasks from route conversion results
   */
  static async createTasksFromRouteConversion(
    conversionResult: RouteConversionResult,
    options: BatchTaskCreationOptions = {
      rollbackOnFailure: false,
      continueOnError: true,
      maxConcurrency: 5,
    },
  ): Promise<BatchTaskCreationResult> {
    return this.createTasks(conversionResult.tasksToCreate, options);
  }

  /**
   * Create multiple tasks from batch route conversion results
   */
  static async createTasksFromBatchRouteConversion(
    batchConversionResult: BatchRouteConversionResult,
    options: BatchTaskCreationOptions = {
      rollbackOnFailure: false,
      continueOnError: true,
      maxConcurrency: 5,
    },
  ): Promise<BatchTaskCreationResult> {
    // Flatten all tasks from all routes
    const allTasks: TaskFormData[] = [];
    batchConversionResult.routeResults.forEach((result) => {
      allTasks.push(...result.tasksToCreate);
    });

    return this.createTasks(allTasks, options);
  }

  /**
   * Create multiple tasks with batch processing
   */
  static async createTasks(
    tasksToCreate: TaskFormData[],
    options: BatchTaskCreationOptions,
  ): Promise<BatchTaskCreationResult> {
    const result: BatchTaskCreationResult = {
      success: false,
      createdTasks: [],
      failedTasks: [],
      totalAttempted: tasksToCreate.length,
      totalCreated: 0,
      totalFailed: 0,
      errors: [],
      warnings: [],
      rollbackPerformed: false,
    };

    if (tasksToCreate.length === 0) {
      result.success = true;
      result.warnings.push("No tasks to create");
      return result;
    }

    // Initialize progress
    const progress: BatchTaskProgress = {
      total: tasksToCreate.length,
      completed: 0,
      failed: 0,
      percentage: 0,
    };

    try {
      // Process tasks in batches based on maxConcurrency
      const batches = this.createBatches(tasksToCreate, options.maxConcurrency);

      for (const batch of batches) {
        const batchPromises = batch.map(async (taskData) => {
          try {
            if (options.progressCallback) {
              options.progressCallback({ ...progress });
            }

            const createdTask = await this.createSingleTask(taskData);

            progress.completed++;
            progress.percentage = Math.round(
              (progress.completed / progress.total) * 100,
            );

            if (options.progressCallback) {
              options.progressCallback({ ...progress });
            }

            return { success: true, task: createdTask, taskData };
          } catch (error) {
            progress.failed++;
            progress.percentage = Math.round(
              ((progress.completed + progress.failed) / progress.total) * 100,
            );

            if (options.progressCallback) {
              options.progressCallback({ ...progress });
            }

            const errorMessage =
              error instanceof Error ? error.message : "Unknown error";
            console.error(
              `Task creation failed for task:`,
              taskData,
              "Error:",
              errorMessage,
            );
            return { success: false, error: errorMessage, taskData };
          }
        });

        // Wait for current batch to complete
        const batchResults = await Promise.all(batchPromises);

        // Process batch results
        for (const batchResult of batchResults) {
          if (batchResult.success) {
            result.createdTasks.push(batchResult.task);
            result.totalCreated++;
          } else {
            result.failedTasks.push({
              taskData: batchResult.taskData,
              error: batchResult.error ?? "Unknown error",
            });
            result.totalFailed++;
            result.errors.push(`Failed to create task: ${batchResult.error}`);

            // Check if we should stop on error
            if (!options.continueOnError) {
              result.errors.push("Stopping batch creation due to error");
              break;
            }
          }
        }

        // Check if we should stop due to errors
        if (!options.continueOnError && result.totalFailed > 0) {
          break;
        }
      }

      // Determine if rollback is needed
      const shouldRollback =
        options.rollbackOnFailure && result.totalFailed > 0;

      if (shouldRollback) {
        try {
          await this.rollbackCreatedTasks(result.createdTasks);
          result.rollbackPerformed = true;
          result.errors.push(
            `Rolled back ${result.totalCreated} created tasks due to failures`,
          );
          result.totalCreated = 0;
          result.createdTasks = [];
        } catch (rollbackError) {
          result.errors.push(
            `Rollback failed: ${rollbackError instanceof Error ? rollbackError.message : "Unknown error"}`,
          );
        }
      }

      // Determine overall success
      result.success =
        result.totalFailed === 0 ||
        (options.continueOnError && result.totalCreated > 0);

      // Add summary information
      if (result.totalCreated > 0) {
        result.warnings.push(
          `Successfully created ${result.totalCreated} out of ${result.totalAttempted} tasks`,
        );
      }

      if (result.totalFailed > 0) {
        result.warnings.push(
          `Failed to create ${result.totalFailed} out of ${result.totalAttempted} tasks`,
        );
      }
    } catch (error) {
      result.errors.push(
        `Batch task creation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );

      // Attempt rollback if any tasks were created
      if (options.rollbackOnFailure && result.createdTasks.length > 0) {
        try {
          await this.rollbackCreatedTasks(result.createdTasks);
          result.rollbackPerformed = true;
          result.errors.push(
            `Rolled back ${result.createdTasks.length} created tasks due to batch failure`,
          );
          result.totalCreated = 0;
          result.createdTasks = [];
        } catch (rollbackError) {
          result.errors.push(
            `Rollback failed: ${rollbackError instanceof Error ? rollbackError.message : "Unknown error"}`,
          );
        }
      }
    }

    return result;
  }

  /**
   * Create a single task via API
   */
  private static async createSingleTask(taskData: TaskFormData): Promise<any> {
    const response = await fetch("/api/v1/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      );
    }

    return response.json();
  }

  /**
   * Rollback created tasks by deleting them
   */
  private static async rollbackCreatedTasks(
    createdTasks: any[],
  ): Promise<void> {
    const rollbackPromises = createdTasks.map(async (task) => {
      try {
        const response = await fetch(`/api/v1/tasks/${task._id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          console.warn(
            `Failed to rollback task ${task._id}: HTTP ${response.status}`,
          );
        }
      } catch (error) {
        console.warn(`Failed to rollback task ${task._id}:`, error);
      }
    });

    await Promise.all(rollbackPromises);
  }

  /**
   * Create batches of tasks for concurrent processing
   */
  private static createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Validate batch task creation options
   */
  static validateBatchOptions(options: BatchTaskCreationOptions): string[] {
    const errors: string[] = [];

    if (options.maxConcurrency < 1 || options.maxConcurrency > 20) {
      errors.push("Max concurrency must be between 1 and 20");
    }

    if (options.rollbackOnFailure && options.continueOnError) {
      errors.push("Cannot rollback on failure while continuing on error");
    }

    return errors;
  }

  /**
   * Estimate batch creation time
   */
  static estimateBatchCreationTime(
    taskCount: number,
    options: BatchTaskCreationOptions,
  ): {
    estimatedMinutes: number;
    estimatedSeconds: number;
  } {
    // Assume ~2 seconds per task creation on average
    const avgTaskCreationTime = 2;
    const totalSeconds =
      Math.ceil(taskCount / options.maxConcurrency) * avgTaskCreationTime;

    return {
      estimatedMinutes: Math.floor(totalSeconds / 60),
      estimatedSeconds: totalSeconds % 60,
    };
  }

  /**
   * Get recommended batch options based on task count
   */
  static getRecommendedOptions(taskCount: number): BatchTaskCreationOptions {
    if (taskCount <= 5) {
      return {
        rollbackOnFailure: false,
        continueOnError: true,
        maxConcurrency: taskCount,
      };
    } else if (taskCount <= 20) {
      return {
        rollbackOnFailure: false,
        continueOnError: true,
        maxConcurrency: 5,
      };
    } else {
      return {
        rollbackOnFailure: false,
        continueOnError: true,
        maxConcurrency: 10,
      };
    }
  }
}
