import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Task from "@/models/Task";
import TaskStatusHistory from "@/models/TaskStatusHistory";
import TaskPaymentHistory from "@/models/TaskPaymentHistory";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { TaskFormData, TaskStatus } from "@/types/task";
import { geocodeAddress } from "@/utils/geocoding";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Get the session using NextAuth's recommended approach
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Not authorized to update tasks" },
        { status: 401 },
      );
    }

    await dbConnect();

    // Resolve the params promise
    const resolvedParams = await params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(resolvedParams.id)) {
      return NextResponse.json(
        { error: "Invalid task ID format" },
        { status: 400 },
      );
    }

    // Find the task
    const task = await Task.findById(resolvedParams.id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const updateData: Partial<TaskFormData> = await request.json();

    // Store original status and payment amount for history tracking
    const originalStatus = task.status as TaskStatus;
    const originalPaymentAmount = task.paymentAmount;

    // Validate task type if provided
    if (updateData.type) {
      const validTypes = ["Delivery", "Setup", "Pickup", "Maintenance"];
      if (!validTypes.includes(updateData.type)) {
        return NextResponse.json(
          { error: "Invalid task type" },
          { status: 400 },
        );
      }
    }

    // Validate priority if provided
    if (updateData.priority) {
      const validPriorities = ["High", "Medium", "Low"];
      if (!validPriorities.includes(updateData.priority)) {
        return NextResponse.json(
          { error: "Invalid priority" },
          { status: 400 },
        );
      }
    }

    // Validate status if provided
    if (updateData.status) {
      const validStatuses = [
        "Pending",
        "Assigned",
        "In Progress",
        "Completed",
        "Cancelled",
      ];
      if (!validStatuses.includes(updateData.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
    }

    // Validate scheduled date/time if provided
    if (updateData.scheduledDateTime) {
      const scheduledDate = new Date(updateData.scheduledDateTime);
      if (isNaN(scheduledDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid scheduled date/time" },
          { status: 400 },
        );
      }
      updateData.scheduledDateTime = scheduledDate;
    }

    // Validate payment amount if provided
    if ("paymentAmount" in updateData) {
      const paymentAmount = updateData.paymentAmount;
      if (paymentAmount !== null && paymentAmount !== undefined) {
        if (typeof paymentAmount !== "number" || paymentAmount < 0) {
          return NextResponse.json(
            { error: "Payment amount must be a positive number" },
            { status: 400 },
          );
        }
        if (paymentAmount > 999999.99) {
          return NextResponse.json(
            { error: "Payment amount cannot exceed $999,999.99" },
            { status: 400 },
          );
        }
        // Check for valid monetary value (up to 2 decimal places)
        if (Math.round(paymentAmount * 100) !== paymentAmount * 100) {
          return NextResponse.json(
            { error: "Payment amount must have at most 2 decimal places" },
            { status: 400 },
          );
        }
      }
    }

    // Handle address/location updates
    let addressToUse = updateData.address;

    // If no address provided in update, derive from order if needed
    if (!addressToUse && !task.address) {
      const Order = (await import("@/models/Order")).default;
      const order = await Order.findById(task.orderId);
      if (order) {
        const addressParts = [
          order.customerAddress,
          order.customerCity,
          order.customerState,
          order.customerZipCode,
        ].filter(Boolean);

        if (addressParts.length > 0) {
          addressToUse = addressParts.join(", ");
          updateData.address = addressToUse;
        }
      }
    }

    // If address is being updated or derived, try to geocode it
    if (addressToUse && addressToUse !== task.address) {
      if (!updateData.location) {
        try {
          const geocodedLocation = await geocodeAddress(addressToUse);
          if (geocodedLocation) {
            updateData.location = geocodedLocation;
            console.log(
              `Successfully geocoded updated address: ${addressToUse}`,
            );
          } else {
            console.warn(
              `Could not geocode updated address: ${addressToUse}. Task will be updated without new coordinates.`,
            );
          }
        } catch (error) {
          console.warn(
            `Geocoding failed for updated address: ${addressToUse}. Error:`,
            error,
          );
          // Continue without geocoding - don't block task update
        }
      }
    }

    // Prevent updating orderId (should never change)
    if ("orderId" in updateData) {
      delete (updateData as any).orderId;
    }

    // Update task fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key as keyof TaskFormData] !== undefined) {
        if (
          key === "description" ||
          key === "assignedTo" ||
          key === "title" ||
          key === "address" ||
          key === "completionNotes"
        ) {
          // Trim string fields
          (task as any)[key] =
            typeof updateData[key as keyof TaskFormData] === "string"
              ? (updateData[key as keyof TaskFormData] as string).trim()
              : updateData[key as keyof TaskFormData];
        } else if (
          key === "assignedContractors" ||
          key === "completionPhotos"
        ) {
          // Handle array fields
          (task as any)[key] = updateData[key as keyof TaskFormData] || [];
        } else {
          (task as any)[key] = updateData[key as keyof TaskFormData];
        }
      }
    });

    // Handle special field updates
    if ("assignedTo" in updateData) {
      task.assignedTo = updateData.assignedTo?.trim() || undefined;
    }

    if ("assignedContractors" in updateData) {
      task.assignedContractors = updateData.assignedContractors || [];
    }

    if ("title" in updateData) {
      task.title = updateData.title?.trim() || undefined;
    }

    if ("completionPhotos" in updateData) {
      task.completionPhotos = updateData.completionPhotos || [];
    }

    if ("completionNotes" in updateData) {
      task.completionNotes = updateData.completionNotes?.trim() || undefined;
    }

    const updatedTask = await task.save();

    // Log status change if status was updated
    if (updateData.status && updateData.status !== originalStatus) {
      try {
        await TaskStatusHistory.createStatusChange({
          taskId: (updatedTask._id as mongoose.Types.ObjectId).toString(),
          orderId: updatedTask.orderId,
          previousStatus: originalStatus,
          newStatus: updateData.status as TaskStatus,
          changedBy: session.user.id,
          changedByName:
            session.user.name || session.user.email || "Unknown User",
          reason: (updateData as any).statusChangeReason || undefined,
        });
      } catch (historyError) {
        console.error("Error logging status change:", historyError);
        // Don't fail the request if history logging fails
      }
    }

    // Log payment amount change if payment amount was updated
    if (
      "paymentAmount" in updateData &&
      updateData.paymentAmount !== originalPaymentAmount
    ) {
      try {
        await TaskPaymentHistory.createPaymentChange({
          taskId: (updatedTask._id as mongoose.Types.ObjectId).toString(),
          orderId: updatedTask.orderId,
          previousAmount: originalPaymentAmount || undefined,
          newAmount: updateData.paymentAmount || undefined,
          changedBy: session.user.id,
          changedByName:
            session.user.name || session.user.email || "Unknown User",
          reason: (updateData as any).paymentChangeReason || undefined,
        });
      } catch (historyError) {
        console.error("Error logging payment change:", historyError);
        // Don't fail the request if history logging fails
      }
    }

    return NextResponse.json(updatedTask);
  } catch (error: unknown) {
    console.error("Error updating task:", error);

    // Handle validation errors
    if (error instanceof Error) {
      if (error.message.includes("Scheduled date/time cannot be in the past")) {
        return NextResponse.json(
          { error: "Scheduled date/time cannot be in the past" },
          { status: 400 },
        );
      }

      if (error.message.includes("Invalid status transition")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      if (error.message.includes("validation failed")) {
        return NextResponse.json(
          { error: `Validation error: ${error.message}` },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Get the session using NextAuth's recommended approach
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Not authorized to delete tasks" },
        { status: 401 },
      );
    }

    await dbConnect();

    // Resolve the params promise
    const resolvedParams = await params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(resolvedParams.id)) {
      return NextResponse.json(
        { error: "Invalid task ID format" },
        { status: 400 },
      );
    }

    // Find the task
    const task = await Task.findById(resolvedParams.id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Only allow deletion of tasks with "Pending" status
    if (task.status !== "Pending") {
      return NextResponse.json(
        { error: "Only tasks with 'Pending' status can be deleted" },
        { status: 400 },
      );
    }

    // Delete the task
    await Task.findByIdAndDelete(resolvedParams.id);

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error: unknown) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    await dbConnect();

    // Resolve the params promise
    const resolvedParams = await params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(resolvedParams.id)) {
      return NextResponse.json(
        { error: "Invalid task ID format" },
        { status: 400 },
      );
    }

    // Find the task
    const task = await Task.findById(resolvedParams.id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error: unknown) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 },
    );
  }
}
