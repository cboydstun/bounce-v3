import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
export declare class TaskController {
  /**
   * GET /api/tasks/available
   * Get available tasks with location and skills filtering
   */
  static getAvailableTasks(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<Response<any, Record<string, any>>>;
  /**
   * GET /api/tasks/my-tasks
   * Get contractor's assigned tasks
   */
  static getMyTasks(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<Response<any, Record<string, any>>>;
  /**
   * POST /api/tasks/:id/claim
   * Claim an available task
   */
  static claimTask(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<Response<any, Record<string, any>>>;
  /**
   * PUT /api/tasks/:id/status
   * Update task status
   */
  static updateTaskStatus(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<Response<any, Record<string, any>>>;
  /**
   * POST /api/tasks/:id/complete
   * Complete a task with optional photos and notes
   */
  static completeTask(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<Response<any, Record<string, any>>>;
  /**
   * GET /api/tasks/:id
   * Get task details by ID
   */
  static getTaskById(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<Response<any, Record<string, any>>>;
}
export default TaskController;
//# sourceMappingURL=taskController.d.ts.map
