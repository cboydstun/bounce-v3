import { NotificationService, } from "./notificationService.js";
import { logger } from "../utils/logger.js";
/**
 * Service that coordinates real-time events and notifications
 */
export class RealtimeService {
    static socketHandlers = null;
    /**
     * Initialize the realtime service with socket handlers
     */
    static initialize(socketHandlers) {
        this.socketHandlers = socketHandlers;
        logger.info("RealtimeService initialized with socket handlers");
    }
    /**
     * Broadcast new task available to relevant contractors
     */
    static async broadcastNewTask(task) {
        try {
            if (!this.socketHandlers) {
                logger.warn("Socket handlers not initialized, skipping task broadcast");
                return;
            }
            // Determine broadcast options based on task properties
            const broadcastOptions = {};
            // Location-based broadcasting if task has location
            if (task.location && task.location.coordinates) {
                const [lng, lat] = task.location.coordinates;
                broadcastOptions.location = {
                    lat,
                    lng,
                    radius: 50, // 50km radius
                };
            }
            // Skills-based broadcasting
            if (task.type) {
                broadcastOptions.skills = [task.type];
            }
            // Broadcast the task event
            await this.socketHandlers.broadcastTaskEvent("task:new", {
                id: task._id,
                orderId: task.orderId,
                type: task.type,
                description: task.description,
                priority: task.priority,
                scheduledDateTime: task.scheduledDateTime,
                location: task.location,
                address: task.address,
            }, broadcastOptions);
            // Create persistent notifications for contractors in the area
            if (broadcastOptions.location) {
                const contractorsInRange = this.socketHandlers
                    .getRoomManager()
                    .getContractorsInLocation(broadcastOptions.location.lat, broadcastOptions.location.lng, broadcastOptions.location.radius);
                if (contractorsInRange.length > 0) {
                    await NotificationService.createBulkNotifications(contractorsInRange, {
                        type: "task",
                        priority: task.priority === "High" ? "high" : "normal",
                        title: `New ${task.type} Task Available`,
                        message: `${task.description.substring(0, 100)}${task.description.length > 100 ? "..." : ""}`,
                        data: {
                            taskId: task._id,
                            orderId: task.orderId,
                            taskType: task.type,
                            location: task.location,
                            address: task.address,
                        },
                        expiresInHours: 24,
                    });
                }
            }
            logger.info(`New task broadcast completed for task: ${task._id}`);
        }
        catch (error) {
            logger.error("Error broadcasting new task:", error);
        }
    }
    /**
     * Broadcast task assignment to contractor
     */
    static async broadcastTaskAssigned(task, contractorId) {
        try {
            if (!this.socketHandlers) {
                logger.warn("Socket handlers not initialized, skipping task assignment broadcast");
                return;
            }
            // Notify the assigned contractor
            await this.socketHandlers.broadcastTaskEvent("task:assigned", {
                id: task._id,
                orderId: task.orderId,
                type: task.type,
                description: task.description,
                priority: task.priority,
                scheduledDateTime: task.scheduledDateTime,
                location: task.location,
                address: task.address,
                status: task.status,
            }, {
                targetContractor: contractorId,
            });
            // Create persistent notification for the assigned contractor
            await NotificationService.createNotification({
                contractorId,
                type: "task",
                priority: "high",
                title: `Task Assigned: ${task.type}`,
                message: `You have been assigned to: ${task.description}`,
                data: {
                    taskId: task._id,
                    orderId: task.orderId,
                    taskType: task.type,
                    scheduledDateTime: task.scheduledDateTime,
                    location: task.location,
                    address: task.address,
                },
            });
            logger.info(`Task assignment broadcast completed for task: ${task._id} to contractor: ${contractorId}`);
        }
        catch (error) {
            logger.error("Error broadcasting task assignment:", error);
        }
    }
    /**
     * Broadcast task claimed to other contractors
     */
    static async broadcastTaskClaimed(task, claimedByContractorId) {
        try {
            if (!this.socketHandlers) {
                logger.warn("Socket handlers not initialized, skipping task claimed broadcast");
                return;
            }
            // Notify other contractors that the task is no longer available
            await this.socketHandlers.broadcastTaskEvent("task:claimed", {
                id: task._id,
                orderId: task.orderId,
                type: task.type,
                description: task.description,
                claimedBy: claimedByContractorId,
                claimedAt: new Date().toISOString(),
            }, {
                excludeContractor: claimedByContractorId,
            });
            // Notify the contractor who claimed it
            await this.socketHandlers.broadcastTaskEvent("task:assigned", {
                id: task._id,
                orderId: task.orderId,
                type: task.type,
                description: task.description,
                priority: task.priority,
                scheduledDateTime: task.scheduledDateTime,
                location: task.location,
                address: task.address,
                status: task.status,
            }, {
                targetContractor: claimedByContractorId,
            });
            // Create notification for the contractor who claimed it
            await NotificationService.createNotification({
                contractorId: claimedByContractorId,
                type: "task",
                priority: "high",
                title: `Task Claimed Successfully`,
                message: `You have successfully claimed: ${task.description}`,
                data: {
                    taskId: task._id,
                    orderId: task.orderId,
                    taskType: task.type,
                    scheduledDateTime: task.scheduledDateTime,
                    location: task.location,
                    address: task.address,
                },
            });
            logger.info(`Task claimed broadcast completed for task: ${task._id} by contractor: ${claimedByContractorId}`);
        }
        catch (error) {
            logger.error("Error broadcasting task claimed:", error);
        }
    }
    /**
     * Broadcast task status update
     */
    static async broadcastTaskStatusUpdate(task, previousStatus, updatedByContractorId) {
        try {
            if (!this.socketHandlers) {
                logger.warn("Socket handlers not initialized, skipping task status update broadcast");
                return;
            }
            // Notify the contractor who updated the status
            await this.socketHandlers.broadcastTaskEvent("task:updated", {
                id: task._id,
                orderId: task.orderId,
                type: task.type,
                description: task.description,
                status: task.status,
                previousStatus,
                updatedAt: new Date().toISOString(),
                updatedBy: updatedByContractorId,
            }, {
                targetContractor: updatedByContractorId,
            });
            // Create notification based on status
            let notificationTitle = "";
            let notificationMessage = "";
            let priority = "normal";
            switch (task.status) {
                case "In Progress":
                    notificationTitle = "Task Started";
                    notificationMessage = `You have started working on: ${task.description}`;
                    priority = "normal";
                    break;
                case "Completed":
                    notificationTitle = "Task Completed";
                    notificationMessage = `You have completed: ${task.description}`;
                    priority = "high";
                    break;
                case "Cancelled":
                    notificationTitle = "Task Cancelled";
                    notificationMessage = `Task has been cancelled: ${task.description}`;
                    priority = "high";
                    break;
                default:
                    notificationTitle = "Task Status Updated";
                    notificationMessage = `Task status changed to ${task.status}: ${task.description}`;
            }
            await NotificationService.createNotification({
                contractorId: updatedByContractorId,
                type: "task",
                priority,
                title: notificationTitle,
                message: notificationMessage,
                data: {
                    taskId: task._id,
                    orderId: task.orderId,
                    taskType: task.type,
                    status: task.status,
                    previousStatus,
                    address: task.address,
                },
            });
            logger.info(`Task status update broadcast completed for task: ${task._id} (${previousStatus} -> ${task.status})`);
        }
        catch (error) {
            logger.error("Error broadcasting task status update:", error);
        }
    }
    /**
     * Broadcast task completion
     */
    static async broadcastTaskCompleted(task, completedByContractorId) {
        try {
            if (!this.socketHandlers) {
                logger.warn("Socket handlers not initialized, skipping task completion broadcast");
                return;
            }
            // Notify the contractor who completed the task
            await this.socketHandlers.broadcastTaskEvent("task:completed", {
                id: task._id,
                orderId: task.orderId,
                type: task.type,
                description: task.description,
                status: task.status,
                completedAt: task.completedAt,
                completedBy: completedByContractorId,
                completionPhotos: task.completionPhotos,
                completionNotes: task.completionNotes,
            }, {
                targetContractor: completedByContractorId,
            });
            // Create completion notification
            await NotificationService.createNotification({
                contractorId: completedByContractorId,
                type: "task",
                priority: "high",
                title: "Task Completed Successfully",
                message: `Congratulations! You have completed: ${task.description}. Task completion has been recorded.`,
                data: {
                    taskId: task._id,
                    orderId: task.orderId,
                    taskType: task.type,
                    completedAt: task.completedAt,
                    completionPhotos: task.completionPhotos,
                },
            });
            logger.info(`Task completion broadcast completed for task: ${task._id} by contractor: ${completedByContractorId}`);
        }
        catch (error) {
            logger.error("Error broadcasting task completion:", error);
        }
    }
    /**
     * Broadcast task cancellation
     */
    static async broadcastTaskCancelled(task, reason, affectedContractorIds) {
        try {
            if (!this.socketHandlers) {
                logger.warn("Socket handlers not initialized, skipping task cancellation broadcast");
                return;
            }
            // Notify all affected contractors
            for (const contractorId of affectedContractorIds) {
                await this.socketHandlers.broadcastTaskEvent("task:cancelled", {
                    id: task._id,
                    orderId: task.orderId,
                    type: task.type,
                    description: task.description,
                    reason,
                    cancelledAt: new Date().toISOString(),
                }, {
                    targetContractor: contractorId,
                });
                // Create cancellation notification
                await NotificationService.createNotification({
                    contractorId,
                    type: "task",
                    priority: "high",
                    title: "Task Cancelled",
                    message: `Task has been cancelled: ${task.description}. Reason: ${reason}`,
                    data: {
                        taskId: task._id,
                        orderId: task.orderId,
                        taskType: task.type,
                        reason,
                        cancelledAt: new Date().toISOString(),
                    },
                });
            }
            logger.info(`Task cancellation broadcast completed for task: ${task._id} affecting ${affectedContractorIds.length} contractors`);
        }
        catch (error) {
            logger.error("Error broadcasting task cancellation:", error);
        }
    }
    /**
     * Broadcast system notification
     */
    static async broadcastSystemNotification(data) {
        try {
            if (!this.socketHandlers) {
                logger.warn("Socket handlers not initialized, skipping system notification broadcast");
                return;
            }
            // Broadcast real-time notification
            const broadcastOptions = {};
            if (data.targetContractor) {
                broadcastOptions.targetContractor = data.targetContractor;
            }
            if (data.targetSkills) {
                broadcastOptions.targetSkills = data.targetSkills;
            }
            await this.socketHandlers.broadcastSystemNotification({
                title: data.title,
                message: data.message,
                priority: data.priority,
                data: data.data,
            }, broadcastOptions);
            // Create persistent notifications
            if (data.targetContractor) {
                // Single contractor notification
                const notificationData = {
                    contractorId: data.targetContractor,
                    type: "system",
                    priority: data.priority,
                    title: data.title,
                    message: data.message,
                    data: data.data,
                };
                if (data.expiresInHours !== undefined) {
                    notificationData.expiresInHours = data.expiresInHours;
                }
                await NotificationService.createNotification(notificationData);
            }
            else if (data.targetSkills && data.targetSkills.length > 0) {
                // Skills-based notification
                const contractorsWithSkills = this.socketHandlers
                    .getRoomManager()
                    .getContractorsWithSkills(data.targetSkills);
                if (contractorsWithSkills.length > 0) {
                    const bulkNotificationData = {
                        type: "system",
                        priority: data.priority,
                        title: data.title,
                        message: data.message,
                        data: data.data,
                    };
                    if (data.expiresInHours !== undefined) {
                        bulkNotificationData.expiresInHours = data.expiresInHours;
                    }
                    await NotificationService.createBulkNotifications(contractorsWithSkills, bulkNotificationData);
                }
            }
            else {
                // Global notification - would need to get all active contractors
                // For now, just broadcast real-time (persistent notifications would be too many)
                logger.info("Global system notification broadcast (real-time only)");
            }
            logger.info(`System notification broadcast completed: ${data.title}`);
        }
        catch (error) {
            logger.error("Error broadcasting system notification:", error);
        }
    }
    /**
     * Send personal notification to a contractor
     */
    static async sendPersonalNotification(contractorId, title, message, data, priority = "normal") {
        try {
            if (!this.socketHandlers) {
                logger.warn("Socket handlers not initialized, skipping personal notification");
                return;
            }
            // Send real-time notification
            await this.socketHandlers.broadcastTaskEvent("notification:personal", {
                title,
                message,
                priority,
                data,
                type: "personal",
            }, {
                targetContractor: contractorId,
            });
            // Create persistent notification
            await NotificationService.createNotification({
                contractorId,
                type: "personal",
                priority,
                title,
                message,
                data,
            });
            logger.info(`Personal notification sent to contractor: ${contractorId}`);
        }
        catch (error) {
            logger.error("Error sending personal notification:", error);
        }
    }
    /**
     * Get connection statistics
     */
    static getConnectionStats() {
        if (!this.socketHandlers) {
            return {
                error: "Socket handlers not initialized",
                totalConnections: 0,
                roomStats: {},
                contractorConnections: [],
            };
        }
        return this.socketHandlers.getConnectionStats();
    }
    /**
     * Check if realtime service is initialized
     */
    static isInitialized() {
        return this.socketHandlers !== null;
    }
}
export default RealtimeService;
//# sourceMappingURL=realtimeService.js.map