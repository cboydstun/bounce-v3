import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import TaskTemplate from "@/models/TaskTemplate";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { TaskTemplateFormData } from "@/types/taskTemplate";
import { TemplateEngine } from "@/utils/templateEngine";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    const { id } = params;

    // Validate template ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid template ID format" },
        { status: 400 },
      );
    }

    // Find template
    const template = await TaskTemplate.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(template);
  } catch (error: unknown) {
    console.error("Error fetching task template:", error);
    return NextResponse.json(
      { error: "Failed to fetch task template" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Get the session using NextAuth's recommended approach
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Not authorized to update task templates" },
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

    const { id } = params;

    // Validate template ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid template ID format" },
        { status: 400 },
      );
    }

    // Find existing template
    const existingTemplate = await TaskTemplate.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    // Check if user can edit this template
    // System templates can only be edited by super admins (for now, allow all authenticated users)
    // In a real implementation, you'd check user roles here
    if (existingTemplate.isSystemTemplate) {
      // For now, prevent editing system templates
      return NextResponse.json(
        { error: "System templates cannot be modified" },
        { status: 403 },
      );
    }

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

    // Update template
    const updatedTemplate = await TaskTemplate.findByIdAndUpdate(
      id,
      {
        name: templateData.name.trim(),
        description: templateData.description.trim(),
        isActive: templateData.isActive !== false,
        defaultPriority: templateData.defaultPriority || "Medium",
        titlePattern: templateData.titlePattern.trim(),
        descriptionPattern: templateData.descriptionPattern.trim(),
        paymentRules: templateData.paymentRules,
        schedulingRules: templateData.schedulingRules,
      },
      { new: true, runValidators: true },
    );

    return NextResponse.json(updatedTemplate);
  } catch (error: unknown) {
    console.error("Error updating task template:", error);

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
      { error: "Failed to update task template" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Get the session using NextAuth's recommended approach
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Not authorized to delete task templates" },
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

    const { id } = params;

    // Validate template ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid template ID format" },
        { status: 400 },
      );
    }

    // Find existing template
    const existingTemplate = await TaskTemplate.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    // Check if user can delete this template
    // System templates cannot be deleted
    if (existingTemplate.isSystemTemplate) {
      return NextResponse.json(
        { error: "System templates cannot be deleted" },
        { status: 403 },
      );
    }

    // Soft delete the template
    const deletedTemplate = await TaskTemplate.softDelete(id, session.user.id);

    if (!deletedTemplate) {
      return NextResponse.json(
        { error: "Failed to delete template" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Template deleted successfully",
      template: deletedTemplate,
    });
  } catch (error: unknown) {
    console.error("Error deleting task template:", error);
    return NextResponse.json(
      { error: "Failed to delete task template" },
      { status: 500 },
    );
  }
}
