import { SocketHandlers } from "../websocket/socketHandlers.js";
import { ITaskDocument } from "../models/Task.js";
export interface TaskEventData {
  task: ITaskDocument;
  contractorId?: string;
  previousStatus?: string;
  reason?: string;
}
export interface SystemNotificationData {
  title: string;
  message: string;
  priority: "critical" | "high" | "normal" | "low";
  data?: any;
  targetContractor?: string;
  targetSkills?: string[];
  expiresInHours?: number;
}
/**
 * Service that coordinates real-time events and notifications
 */
export declare class RealtimeService {
  private static socketHandlers;
  /**
   * Initialize the realtime service with socket handlers
   */
  static initialize(socketHandlers: SocketHandlers): void;
  /**
   * Broadcast new task available to relevant contractors
   */
  static broadcastNewTask(task: ITaskDocument): Promise<void>;
  /**
   * Broadcast task assignment to contractor
   */
  static broadcastTaskAssigned(
    task: ITaskDocument,
    contractorId: string,
  ): Promise<void>;
  /**
   * Broadcast task claimed to other contractors
   */
  static broadcastTaskClaimed(
    task: ITaskDocument,
    claimedByContractorId: string,
  ): Promise<void>;
  /**
   * Broadcast task status update
   */
  static broadcastTaskStatusUpdate(
    task: ITaskDocument,
    previousStatus: string,
    updatedByContractorId: string,
  ): Promise<void>;
  /**
   * Broadcast task completion
   */
  static broadcastTaskCompleted(
    task: ITaskDocument,
    completedByContractorId: string,
  ): Promise<void>;
  /**
   * Broadcast task cancellation
   */
  static broadcastTaskCancelled(
    task: ITaskDocument,
    reason: string,
    affectedContractorIds: string[],
  ): Promise<void>;
  /**
   * Broadcast system notification
   */
  static broadcastSystemNotification(
    data: SystemNotificationData,
  ): Promise<void>;
  /**
   * Send personal notification to a contractor
   */
  static sendPersonalNotification(
    contractorId: string,
    title: string,
    message: string,
    data?: any,
    priority?: "critical" | "high" | "normal" | "low",
  ): Promise<void>;
  /**
   * Get connection statistics
   */
  static getConnectionStats(): any;
  /**
   * Check if realtime service is initialized
   */
  static isInitialized(): boolean;
}
export default RealtimeService;
//# sourceMappingURL=realtimeService.d.ts.map
