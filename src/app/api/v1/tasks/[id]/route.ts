import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Task from "@/models/Task";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { TaskFormData } from "@/types/task";

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

    // Prevent updating orderId (should never change)
    if ("orderId" in updateData) {
      delete (updateData as any).orderId;
    }

    // Update task fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key as keyof TaskFormData] !== undefined) {
        if (key === "description" || key === "assignedTo") {
          // Trim string fields
          (task as any)[key] =
            typeof updateData[key as keyof TaskFormData] === "string"
              ? (updateData[key as keyof TaskFormData] as string).trim()
              : updateData[key as keyof TaskFormData];
        } else {
          (task as any)[key] = updateData[key as keyof TaskFormData];
        }
      }
    });

    // Handle assignedTo field specially (can be set to empty string to clear)
    if ("assignedTo" in updateData) {
      task.assignedTo = updateData.assignedTo?.trim() || undefined;
    }

    const updatedTask = await task.save();

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
