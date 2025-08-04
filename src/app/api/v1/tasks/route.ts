import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Task from "@/models/Task";
import Order from "@/models/Order";
import Contractor from "@/models/Contractor";
import TaskStatusHistory from "@/models/TaskStatusHistory";
import TaskPaymentHistory from "@/models/TaskPaymentHistory";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { TaskFormData, TaskStatus } from "@/types/task";
import { geocodeAddress } from "@/utils/geocoding";
import { NotificationService } from "@/services/notificationService";
import WebSocketBroadcastService, {
  TaskBroadcastData,
} from "@/services/websocketBroadcastService";

// Helper function to map task priority to notification priority
const getNotificationPriority = (
  taskPriority: string,
): "critical" | "high" | "normal" | "low" => {
  switch (taskPriority) {
    case "High":
      return "high";
    case "Medium":
      return "normal";
    case "Low":
      return "low";
    default:
      return "normal";
  }
};

export async function GET(request: NextRequest) {
  try {
    // Get the session using NextAuth's recommended approach
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Not authorized to view tasks" },
        { status: 401 },
      );
    }

    // Validate that we have a proper user ID
    if (!session.user.id) {
      return NextResponse.json(
        { error: "User session is invalid - missing user ID" },
        { status: 401 },
      );
    }

    // Validate that the user ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json(
        { error: "User session is invalid - invalid user ID format" },
        { status: 401 },
      );
    }

    await dbConnect();

    // Parse query parameters
    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "detailed"; // "detailed" or "summary"
    const status = url.searchParams.get("status");
    const taskType = url.searchParams.get("taskType");
    const priority = url.searchParams.get("priority");
    const contractorId = url.searchParams.get("contractorId");
    const orderId = url.searchParams.get("orderId");
    const search = url.searchParams.get("search");
    const minAmount = url.searchParams.get("minAmount");
    const maxAmount = url.searchParams.get("maxAmount");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");

    // Build query
    const query: Record<string, any> = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by task type
    if (taskType) {
      query.type = taskType;
    }

    // Filter by priority
    if (priority) {
      query.priority = priority;
    }

    // Filter by contractor
    if (contractorId) {
      query.assignedContractors = contractorId;
    }

    // Filter by order
    if (orderId) {
      query.orderId = orderId;
    }

    // Payment amount range filter
    if (minAmount || maxAmount) {
      query.paymentAmount = {};
      if (minAmount) {
        query.paymentAmount.$gte = parseFloat(minAmount);
      }
      if (maxAmount) {
        query.paymentAmount.$lte = parseFloat(maxAmount);
      }
    }

    // Date range filter for scheduled date
    if (startDate || endDate) {
      query.scheduledDateTime = {};
      if (startDate) {
        query.scheduledDateTime.$gte = new Date(startDate);
      }
      if (endDate) {
        query.scheduledDateTime.$lte = new Date(endDate);
      }
    }

    // If type is "summary", return payment statistics
    if (type === "summary") {
      const stats = await Task.getPaymentStats({
        status: status as TaskStatus,
        contractorId: contractorId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      return NextResponse.json({ summary: stats });
    }

    // For detailed view, use aggregation to join with orders and contractors
    const pipeline: any[] = [
      { $match: query },
      // Join with orders
      {
        $lookup: {
          from: "orders",
          localField: "orderId",
          foreignField: "_id",
          as: "order",
        },
      },
      {
        $unwind: {
          path: "$order",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Join with contractors
      {
        $lookup: {
          from: "contractors",
          localField: "assignedContractors",
          foreignField: "_id",
          as: "contractors",
        },
      },
      // Add computed fields
      {
        $addFields: {
          orderNumber: "$order.orderNumber",
          customerName: "$order.customerName",
          customerEmail: "$order.customerEmail",
          eventDate: "$order.eventDate",
          contractorNames: {
            $map: {
              input: "$contractors",
              as: "contractor",
              in: "$$contractor.name",
            },
          },
        },
      },
      // Remove the full order and contractors objects to reduce payload
      {
        $unset: ["order", "contractors"],
      },
      // Sort by scheduled date (newest first)
      { $sort: { scheduledDateTime: -1 } },
    ];

    // Add search functionality
    if (search) {
      pipeline.splice(1, 0, {
        $match: {
          $or: [
            { description: { $regex: search, $options: "i" } },
            { title: { $regex: search, $options: "i" } },
            { "order.orderNumber": { $regex: search, $options: "i" } },
            { "order.customerName": { $regex: search, $options: "i" } },
            { "order.customerEmail": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // Add pagination
    const skip = (page - 1) * limit;
    pipeline.push({ $skip: skip }, { $limit: limit });

    // Execute aggregation
    const tasks = await Task.aggregate(pipeline);

    // Get total count for pagination
    const countPipeline = [...pipeline];
    countPipeline.splice(-2); // Remove skip and limit
    countPipeline.push({ $count: "total" });
    const countResult = await Task.aggregate(countPipeline);
    const totalTasks = countResult[0]?.total || 0;
    const totalPages = Math.ceil(totalTasks / limit);

    return NextResponse.json({
      tasks,
      pagination: {
        currentPage: page,
        totalPages,
        totalTasks,
        limit,
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the session using NextAuth's recommended approach
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Not authorized to create tasks" },
        { status: 401 },
      );
    }

    // Validate that we have a proper user ID
    if (!session.user.id) {
      return NextResponse.json(
        { error: "User session is invalid - missing user ID" },
        { status: 401 },
      );
    }

    // Validate that the user ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json(
        { error: "User session is invalid - invalid user ID format" },
        { status: 401 },
      );
    }

    await dbConnect();

    const taskData: TaskFormData = await request.json();

    // Validate required fields
    if (!taskData.orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );
    }

    if (!taskData.type) {
      return NextResponse.json(
        { error: "Task type is required" },
        { status: 400 },
      );
    }

    if (!taskData.description || !taskData.description.trim()) {
      return NextResponse.json(
        { error: "Task description is required" },
        { status: 400 },
      );
    }

    if (!taskData.scheduledDateTime) {
      return NextResponse.json(
        { error: "Scheduled date/time is required" },
        { status: 400 },
      );
    }

    // Validate order exists
    if (!mongoose.Types.ObjectId.isValid(taskData.orderId)) {
      return NextResponse.json(
        { error: "Invalid order ID format" },
        { status: 400 },
      );
    }

    const order = await Order.findById(taskData.orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Validate task type
    const validTypes = ["Delivery", "Setup", "Pickup", "Maintenance"];
    if (!validTypes.includes(taskData.type)) {
      return NextResponse.json({ error: "Invalid task type" }, { status: 400 });
    }

    // Validate priority
    const validPriorities = ["High", "Medium", "Low"];
    if (taskData.priority && !validPriorities.includes(taskData.priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }

    // Validate scheduled date/time
    const scheduledDate = new Date(taskData.scheduledDateTime);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid scheduled date/time" },
        { status: 400 },
      );
    }

    // Check if scheduled date is in the past
    if (scheduledDate < new Date()) {
      return NextResponse.json(
        { error: "Scheduled date/time cannot be in the past" },
        { status: 400 },
      );
    }

    // Validate payment amount if provided
    if (
      taskData.paymentAmount !== undefined &&
      taskData.paymentAmount !== null
    ) {
      if (
        typeof taskData.paymentAmount !== "number" ||
        taskData.paymentAmount < 0
      ) {
        return NextResponse.json(
          { error: "Payment amount must be a positive number" },
          { status: 400 },
        );
      }
      if (taskData.paymentAmount > 999999.99) {
        return NextResponse.json(
          { error: "Payment amount cannot exceed $999,999.99" },
          { status: 400 },
        );
      }
      // Check for valid monetary value (up to 2 decimal places)
      if (
        Math.round(taskData.paymentAmount * 100) !==
        taskData.paymentAmount * 100
      ) {
        return NextResponse.json(
          { error: "Payment amount must have at most 2 decimal places" },
          { status: 400 },
        );
      }
    }

    // Validate assigned contractors if provided
    if (
      taskData.assignedContractors &&
      taskData.assignedContractors.length > 0
    ) {
      for (const contractorId of taskData.assignedContractors) {
        if (!mongoose.Types.ObjectId.isValid(contractorId)) {
          return NextResponse.json(
            { error: `Invalid contractor ID format: ${contractorId}` },
            { status: 400 },
          );
        }

        const contractor = await Contractor.findById(contractorId);
        if (!contractor) {
          return NextResponse.json(
            { error: `Contractor not found: ${contractorId}` },
            { status: 404 },
          );
        }

        if (!contractor.isActive) {
          return NextResponse.json(
            { error: `Contractor is not active: ${contractor.name}` },
            { status: 400 },
          );
        }
      }
    }

    // Derive address from order if not provided
    let addressToUse = taskData.address;
    if (!addressToUse) {
      const addressParts = [
        order.customerAddress,
        order.customerCity,
        order.customerState,
        order.customerZipCode,
      ].filter(Boolean);

      if (addressParts.length > 0) {
        addressToUse = addressParts.join(", ");
      }
    }

    // Try to geocode the address
    let locationToUse = taskData.location;
    if (addressToUse && !locationToUse) {
      try {
        const geocodedLocation = await geocodeAddress(addressToUse);
        if (geocodedLocation) {
          locationToUse = {
            type: "Point",
            coordinates: geocodedLocation,
          };
          console.log(`Successfully geocoded address: ${addressToUse}`);
        } else {
          console.warn(
            `Could not geocode address: ${addressToUse}. Task will be created without coordinates.`,
          );
        }
      } catch (error) {
        console.warn(
          `Geocoding failed for address: ${addressToUse}. Error:`,
          error,
        );
        // Continue without geocoding - don't block task creation
      }
    }

    // Create task
    const newTask = new Task({
      orderId: taskData.orderId,
      type: taskData.type,
      title: taskData.title?.trim() || undefined,
      description: taskData.description.trim(),
      scheduledDateTime: scheduledDate,
      priority: taskData.priority || "Medium",
      status: taskData.status || "Pending",
      assignedContractors: taskData.assignedContractors || [],
      assignedTo: taskData.assignedTo?.trim() || undefined,
      address: addressToUse,
      location: locationToUse,
      paymentAmount: taskData.paymentAmount || undefined,
      completionPhotos: taskData.completionPhotos || [],
      completionNotes: taskData.completionNotes?.trim() || undefined,
    });

    const savedTask = await newTask.save();

    // Log initial status if not "Pending"
    if (savedTask.status !== "Pending") {
      try {
        await TaskStatusHistory.createStatusChange({
          taskId: (savedTask._id as mongoose.Types.ObjectId).toString(),
          orderId: savedTask.orderId,
          previousStatus: "Pending",
          newStatus: savedTask.status as TaskStatus,
          changedBy: session.user.id,
          changedByName:
            session.user.name || session.user.email || "Unknown User",
          reason: "Initial task creation",
        });
      } catch (historyError) {
        console.error("Error logging initial status:", historyError);
        // Don't fail the request if history logging fails
      }
    }

    // Log initial payment amount if set
    if (savedTask.paymentAmount) {
      try {
        await TaskPaymentHistory.createPaymentChange({
          taskId: (savedTask._id as mongoose.Types.ObjectId).toString(),
          orderId: savedTask.orderId,
          previousAmount: undefined,
          newAmount: savedTask.paymentAmount,
          changedBy: session.user.id,
          changedByName:
            session.user.name || session.user.email || "Unknown User",
          reason: "Initial task creation",
        });
      } catch (historyError) {
        console.error("Error logging initial payment:", historyError);
        // Don't fail the request if history logging fails
      }
    }

    // Create notifications for all active contractors
    try {
      // Get all active and verified contractors
      const activeContractors = await Contractor.find({
        isActive: true,
        isVerified: true,
      }).select("_id");

      const contractorIds = activeContractors.map((c) =>
        (c._id as mongoose.Types.ObjectId).toString(),
      );

      if (contractorIds.length > 0) {
        // Create bulk notifications for all active contractors
        await NotificationService.createBulkNotifications(contractorIds, {
          type: "task",
          priority: getNotificationPriority(savedTask.priority),
          title: `New ${savedTask.type} Task Available`,
          message: `${savedTask.type} task${savedTask.address ? ` in ${savedTask.address}` : ""}${savedTask.paymentAmount ? ` - $${savedTask.paymentAmount}` : ""}`,
          data: {
            taskId: (savedTask._id as mongoose.Types.ObjectId).toString(),
            taskType: savedTask.type,
            address: savedTask.address,
            paymentAmount: savedTask.paymentAmount,
            scheduledDateTime: savedTask.scheduledDateTime,
            priority: savedTask.priority,
            orderId: savedTask.orderId.toString(),
          },
          expiresInHours: 24, // Tasks expire after 24 hours
        });

        console.log(
          `Created notifications for ${contractorIds.length} contractors for new task ${savedTask._id}`,
        );

        // Trigger WebSocket broadcast to notify mobile apps in real-time
        try {
          const taskBroadcastData: TaskBroadcastData = {
            taskId: (savedTask._id as mongoose.Types.ObjectId).toString(),
            orderId: savedTask.orderId.toString(),
            type: savedTask.type as
              | "Delivery"
              | "Setup"
              | "Pickup"
              | "Maintenance",
            title: savedTask.title,
            description: savedTask.description,
            priority: savedTask.priority as "High" | "Medium" | "Low",
            scheduledDateTime: savedTask.scheduledDateTime,
            address: savedTask.address,
            paymentAmount: savedTask.paymentAmount,
            location: savedTask.location,
          };

          const broadcastResult =
            await WebSocketBroadcastService.broadcastNewTask(
              taskBroadcastData,
              contractorIds,
            );

          if (broadcastResult.success) {
            console.log(
              `Successfully broadcasted new task ${savedTask._id} to mobile apps`,
            );
          } else {
            console.warn(
              `Failed to broadcast new task ${savedTask._id}:`,
              broadcastResult.error,
            );
          }
        } catch (broadcastError) {
          // Log error but don't fail the task creation
          console.error(
            "Failed to broadcast new task to mobile apps:",
            broadcastError,
          );
        }
      } else {
        console.log("No active contractors found for notification");
      }
    } catch (notificationError) {
      // Log error but don't fail the task creation
      console.error(
        "Failed to create notifications for new task:",
        notificationError,
      );
    }

    return NextResponse.json(savedTask, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating task:", error);

    // Handle validation errors
    if (error instanceof Error) {
      if (error.message.includes("validation failed")) {
        return NextResponse.json(
          { error: `Validation error: ${error.message}` },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }
}
