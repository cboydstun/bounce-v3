import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Task from "@/models/Task";
import TaskPaymentHistory from "@/models/TaskPaymentHistory";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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
        { error: "Not authorized to update task payments" },
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

    const { paymentAmount, reason } = await request.json();

    // Store original payment amount for history tracking
    const originalPaymentAmount = task.paymentAmount;

    // Validate payment amount
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

    // Check if payment amount is actually changing
    if (paymentAmount === originalPaymentAmount) {
      return NextResponse.json(
        { error: "Payment amount is the same as current amount" },
        { status: 400 },
      );
    }

    // Update the payment amount
    task.paymentAmount = paymentAmount;
    const updatedTask = await task.save();

    // Log payment amount change
    try {
      await TaskPaymentHistory.createPaymentChange({
        taskId: (updatedTask._id as mongoose.Types.ObjectId).toString(),
        orderId: updatedTask.orderId,
        previousAmount: originalPaymentAmount || undefined,
        newAmount: paymentAmount || undefined,
        changedBy: session.user.id,
        changedByName:
          session.user.name || session.user.email || "Unknown User",
        reason: reason || undefined,
      });
    } catch (historyError) {
      console.error("Error logging payment change:", historyError);
      // Don't fail the request if history logging fails
    }

    // TODO: Send notification to assigned contractors if task is assigned
    // This would be implemented when the notification system is in place

    return NextResponse.json({
      task: updatedTask,
      message: "Payment amount updated successfully",
    });
  } catch (error: unknown) {
    console.error("Error updating task payment:", error);

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
      { error: "Failed to update task payment" },
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
        { error: "Not authorized to clear task payments" },
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

    const { reason } = await request.json();

    // Store original payment amount for history tracking
    const originalPaymentAmount = task.paymentAmount;

    // Check if payment amount is already null
    if (originalPaymentAmount === null || originalPaymentAmount === undefined) {
      return NextResponse.json(
        { error: "Task payment amount is already cleared" },
        { status: 400 },
      );
    }

    // Clear the payment amount
    task.paymentAmount = undefined;
    const updatedTask = await task.save();

    // Log payment amount clearing
    try {
      await TaskPaymentHistory.createPaymentChange({
        taskId: (updatedTask._id as mongoose.Types.ObjectId).toString(),
        orderId: updatedTask.orderId,
        previousAmount: originalPaymentAmount,
        newAmount: undefined,
        changedBy: session.user.id,
        changedByName:
          session.user.name || session.user.email || "Unknown User",
        reason: reason || "Payment amount cleared",
      });
    } catch (historyError) {
      console.error("Error logging payment clearing:", historyError);
      // Don't fail the request if history logging fails
    }

    return NextResponse.json({
      task: updatedTask,
      message: "Payment amount cleared successfully",
    });
  } catch (error: unknown) {
    console.error("Error clearing task payment:", error);

    return NextResponse.json(
      { error: "Failed to clear task payment" },
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
        { error: "Not authorized to view task payment history" },
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

    // Find the task to ensure it exists
    const task = await Task.findById(resolvedParams.id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Get payment history for this task
    const paymentHistory = await TaskPaymentHistory.findByTaskId(resolvedParams.id);

    return NextResponse.json({
      taskId: resolvedParams.id,
      currentPaymentAmount: task.paymentAmount,
      paymentHistory,
    });
  } catch (error: unknown) {
    console.error("Error fetching task payment history:", error);
    return NextResponse.json(
      { error: "Failed to fetch task payment history" },
      { status: 500 },
    );
  }
}
