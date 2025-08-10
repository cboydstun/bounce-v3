import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import TaskTemplate from "@/models/TaskTemplate";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { TaskTemplateFormData } from "@/types/taskTemplate";
import { TemplateEngine } from "@/utils/templateEngine";

export async function GET(request: NextRequest) {
  try {
    // Get the session using NextAuth's recommended approach
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Not authorized to view task templates" },
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
    const includeSystem = url.searchParams.get("includeSystem") !== "false";
    const includeInactive = url.searchParams.get("includeInactive") === "true";
    const createdBy = url.searchParams.get("createdBy");
    const search = url.searchParams.get("search");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");

    // Build query
    const query: Record<string, any> = {
      deletedAt: null,
    };

    if (!includeInactive) {
      query.isActive = true;
    }

    if (!includeSystem) {
      query.isSystemTemplate = false;
    }

    if (createdBy) {
      query.createdBy = createdBy;
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const templates = await TaskTemplate.find(query)
      .sort({ isSystemTemplate: -1, name: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalTemplates = await TaskTemplate.countDocuments(query);
    const totalPages = Math.ceil(totalTemplates / limit);

    // Get usage statistics
    const stats = await TaskTemplate.getUsageStats();

    return NextResponse.json({
      templates,
      pagination: {
        currentPage: page,
        totalPages,
        totalTemplates,
        limit,
      },
      stats,
    });
  } catch (error: unknown) {
    console.error("Error fetching task templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch task templates" },
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
        { error: "Not authorized to create task templates" },
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

    const templateData: TaskTemplateFormData = await request.json();

    // Validate required fields
    if (!templateData.name || !templateData.name.trim()) {
      return NextResponse.json(
        { error: "Template name is required" },
        { status: 400 },
      );
    }

    if (!templateData.description || !templateData.description.trim()) {
      return NextResponse.json(
        { error: "Template description is required" },
        { status: 400 },
      );
    }

    if (!templateData.titlePattern || !templateData.titlePattern.trim()) {
      return NextResponse.json(
        { error: "Title pattern is required" },
        { status: 400 },
      );
    }

    if (
      !templateData.descriptionPattern ||
      !templateData.descriptionPattern.trim()
    ) {
      return NextResponse.json(
        { error: "Description pattern is required" },
        { status: 400 },
      );
    }

    if (!templateData.paymentRules) {
      return NextResponse.json(
        { error: "Payment rules are required" },
        { status: 400 },
      );
    }

    if (!templateData.schedulingRules) {
      return NextResponse.json(
        { error: "Scheduling rules are required" },
        { status: 400 },
      );
    }

    // Validate template patterns
    const titleErrors = TemplateEngine.validatePattern(
      templateData.titlePattern,
    );
    if (titleErrors.length > 0) {
      return NextResponse.json(
        { error: `Title pattern errors: ${titleErrors.join(", ")}` },
        { status: 400 },
      );
    }

    const descriptionErrors = TemplateEngine.validatePattern(
      templateData.descriptionPattern,
    );
    if (descriptionErrors.length > 0) {
      return NextResponse.json(
        {
          error: `Description pattern errors: ${descriptionErrors.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Validate priority
    const validPriorities = ["High", "Medium", "Low"];
    if (
      templateData.defaultPriority &&
      !validPriorities.includes(templateData.defaultPriority)
    ) {
      return NextResponse.json(
        { error: "Invalid default priority" },
        { status: 400 },
      );
    }

    // Validate payment rules
    const paymentRules = templateData.paymentRules;
    if (!["fixed", "percentage", "formula"].includes(paymentRules.type)) {
      return NextResponse.json(
        { error: "Invalid payment rule type" },
        { status: 400 },
      );
    }

    // Validate scheduling rules
    const schedulingRules = templateData.schedulingRules;
    if (
      !["eventDate", "deliveryDate", "manual"].includes(
        schedulingRules.relativeTo,
      )
    ) {
      return NextResponse.json(
        { error: "Invalid scheduling relative reference" },
        { status: 400 },
      );
    }

    if (
      !schedulingRules.defaultTime ||
      !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(schedulingRules.defaultTime)
    ) {
      return NextResponse.json(
        { error: "Invalid default time format (use HH:MM)" },
        { status: 400 },
      );
    }

    // Create template
    const newTemplate = new TaskTemplate({
      name: templateData.name.trim(),
      description: templateData.description.trim(),
      isSystemTemplate: false, // User-created templates are never system templates
      isActive: templateData.isActive !== false, // Default to true
      defaultPriority: templateData.defaultPriority || "Medium",
      titlePattern: templateData.titlePattern.trim(),
      descriptionPattern: templateData.descriptionPattern.trim(),
      paymentRules: templateData.paymentRules,
      schedulingRules: templateData.schedulingRules,
      usageCount: 0,
      createdBy: session.user.id,
      createdByName: session.user.name || session.user.email || "Unknown User",
    });

    const savedTemplate = await newTemplate.save();

    return NextResponse.json(savedTemplate, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating task template:", error);

    // Handle validation errors
    if (error instanceof Error) {
      if (error.message.includes("validation failed")) {
        return NextResponse.json(
          { error: `Validation error: ${error.message}` },
          { status: 400 },
        );
      }
      if (error.message.includes("already in use")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    return NextResponse.json(
      { error: "Failed to create task template" },
      { status: 500 },
    );
  }
}
