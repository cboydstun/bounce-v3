import mongoose from "mongoose";
import { NotificationService } from "../dist/services/notificationService.js";
import { logger } from "../dist/utils/logger.js";

// MongoDB connection string - update this to match your environment
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/bounce-v3";

/**
 * Create test notifications for development
 */
async function createTestNotifications() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    logger.info("Connected to MongoDB");

    // Test contractor ID - this should match a real contractor in your system
    const contractorId = "688542f642771ccb99090308";

    // Create various test notifications
    const notifications = [
      {
        contractorId,
        type: "task",
        priority: "high",
        title: "New Task Available",
        message:
          "A new bounce house setup task is available near you. Payment: $75",
        data: {
          taskId: "task-123",
          taskTitle: "Bounce House Setup - Birthday Party",
          taskType: "Setup",
          taskStatus: "pending",
          customerId: "customer-456",
          customerName: "Sarah Johnson",
          scheduledDate: new Date(
            Date.now() + 2 * 60 * 60 * 1000,
          ).toISOString(),
          location: {
            address: "123 Oak Street, San Antonio, TX 78201",
            coordinates: {
              latitude: 29.4241,
              longitude: -98.4936,
            },
          },
          compensation: 75,
          urgency: "normal",
        },
      },
      {
        contractorId,
        type: "system",
        priority: "normal",
        title: "App Update Available",
        message:
          "A new version of the contractor app is available with bug fixes and improvements.",
        data: {
          updateType: "app_update",
          version: "2.1.0",
          actionRequired: false,
        },
      },
      {
        contractorId,
        type: "task",
        priority: "urgent",
        title: "Task Starting Soon",
        message:
          "Your bounce house setup task starts in 30 minutes. Don't forget to bring your tools!",
        data: {
          taskId: "task-124",
          reminderType: "task_start",
          dueDate: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        },
        expiresInHours: 1,
      },
      {
        contractorId,
        type: "personal",
        priority: "low",
        title: "Payment Received",
        message: "You have received payment of $125.00 for completed tasks.",
        data: {
          paymentId: "payment-789",
          amount: 125.0,
          currency: "USD",
          paymentMethod: "Direct Deposit",
          taskId: "task-121",
          taskTitle: "Multiple Task Completion",
          status: "completed",
          transactionDate: new Date().toISOString(),
        },
      },
      {
        contractorId,
        type: "task",
        priority: "critical",
        title: "Emergency Task Assignment",
        message:
          "URGENT: Emergency bounce house pickup needed. Customer equipment malfunction.",
        data: {
          taskId: "task-emergency-001",
          taskTitle: "Emergency Pickup - Equipment Malfunction",
          taskType: "Emergency Pickup",
          taskStatus: "urgent",
          customerId: "customer-emergency",
          customerName: "Emergency Services",
          scheduledDate: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          location: {
            address: "789 Emergency Lane, San Antonio, TX 78205",
            coordinates: {
              latitude: 29.4167,
              longitude: -98.5,
            },
          },
          compensation: 150,
          urgency: "critical",
        },
      },
    ];

    // Create notifications
    const createdNotifications = [];
    for (const notificationData of notifications) {
      try {
        const notification =
          await NotificationService.createNotification(notificationData);
        createdNotifications.push(notification);
        logger.info(`Created notification: ${notification.title}`);
      } catch (error) {
        logger.error(
          `Failed to create notification: ${notificationData.title}`,
          error,
        );
      }
    }

    logger.info(
      `Successfully created ${createdNotifications.length} test notifications`,
    );

    // Get stats
    const stats = await NotificationService.getNotificationStats(contractorId);
    logger.info("Notification stats:", stats);
  } catch (error) {
    logger.error("Error creating test notifications:", error);
  } finally {
    await mongoose.disconnect();
    logger.info("Disconnected from MongoDB");
  }
}

// Run the script
createTestNotifications().catch(console.error);
