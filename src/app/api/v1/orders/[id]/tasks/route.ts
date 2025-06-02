import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Task from "@/models/Task";
import Order from "@/models/Order";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { TaskFormData } from "@/types/task";
import { geocodeAddress } from "@/utils/geocoding";

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
        { error: "Invalid order ID format" },
        { status: 400 },
      );
    }

    // Verify order exists
    const order = await Order.findById(resolvedParams.id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Get tasks for this order
    const tasks = await Task.findByOrderId(resolvedParams.id);

    return NextResponse.json(tasks);
  } catch (error: unknown) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    await dbConnect();

    // Resolve the params promise
    const resolvedParams = await params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(resolvedParams.id)) {
      return NextResponse.json(
        { error: "Invalid order ID format" },
        { status: 400 },
      );
    }

    // Verify order exists
    const order = await Order.findById(resolvedParams.id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const taskData: TaskFormData = await request.json();

    // Validate required fields
    if (
      !taskData.type ||
      !taskData.description ||
      !taskData.scheduledDateTime
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: type, description, scheduledDateTime",
        },
        { status: 400 },
      );
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

    // Validate status if provided
    const validStatuses = [
      "Pending",
      "Assigned",
      "In Progress",
      "Completed",
      "Cancelled",
    ];
    if (taskData.status && !validStatuses.includes(taskData.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Validate scheduled date/time
    const scheduledDate = new Date(taskData.scheduledDateTime);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid scheduled date/time" },
        { status: 400 },
      );
    }

    // Validate payment amount if provided
    if ("paymentAmount" in taskData) {
      const paymentAmount = taskData.paymentAmount;
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

    // Get address from order if not provided in task data
    let address = taskData.address;
    if (!address) {
      // Construct address from order's customer information
      const addressParts = [
        order.customerAddress,
        order.customerCity,
        order.customerState,
        order.customerZipCode,
      ].filter(Boolean);

      if (addressParts.length === 0) {
        return NextResponse.json(
          {
            error:
              "No address information available in order. Please add customer address to the order first.",
          },
          { status: 400 },
        );
      }

      address = addressParts.join(", ");
    }

    // Handle location data - try to geocode but don't fail if it doesn't work
    let location = taskData.location;
    if (!location && address) {
      try {
        // Attempt to geocode the address to get coordinates
        const geocodedLocation = await geocodeAddress(address);
        if (geocodedLocation) {
          location = geocodedLocation;
          console.log(`Successfully geocoded address: ${address}`);
        } else {
          console.warn(
            `Could not geocode address: ${address}. Task will be created without coordinates.`,
          );
        }
      } catch (error) {
        console.warn(`Geocoding failed for address: ${address}. Error:`, error);
        // Continue without geocoding - don't block task creation
      }
    }

    // Create new task - only include location if we have valid coordinates
    const taskFields: any = {
      orderId: resolvedParams.id,
      type: taskData.type,
      title: taskData.title?.trim() || undefined,
      description: taskData.description.trim(),
      scheduledDateTime: scheduledDate,
      priority: taskData.priority || "Medium",
      status: taskData.status || "Pending",
      assignedContractors: taskData.assignedContractors || [],
      assignedTo: taskData.assignedTo?.trim() || undefined,
      address: address.trim(),
      paymentAmount: taskData.paymentAmount || undefined,
      completionPhotos: taskData.completionPhotos || [],
      completionNotes: taskData.completionNotes?.trim() || undefined,
    };

    // Only add location if we have valid coordinates
    if (location && location.coordinates && location.coordinates.length === 2) {
      taskFields.location = location;
    }

    const newTask = new Task(taskFields);

    const savedTask = await newTask.save();

    return NextResponse.json(savedTask, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating task:", error);

    // Handle validation errors
    if (error instanceof Error) {
      if (error.message.includes("Scheduled date/time cannot be in the past")) {
        return NextResponse.json(
          { error: "Scheduled date/time cannot be in the past" },
          { status: 400 },
        );
      }

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
