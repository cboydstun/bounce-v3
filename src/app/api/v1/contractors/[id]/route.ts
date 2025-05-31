import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Contractor from "@/models/Contractor";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ContractorFormData } from "@/types/contractor";

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
        { error: "Not authorized to view contractors" },
        { status: 401 },
      );
    }

    await dbConnect();

    // Resolve the params promise
    const resolvedParams = await params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(resolvedParams.id)) {
      return NextResponse.json(
        { error: "Invalid contractor ID format" },
        { status: 400 },
      );
    }

    // Find the contractor
    const contractor = await Contractor.findById(resolvedParams.id);
    if (!contractor) {
      return NextResponse.json(
        { error: "Contractor not found" },
        { status: 404 },
      );
    }

    // Filter out sensitive auth fields for CRM display
    const filteredContractor = {
      _id: contractor._id,
      name: contractor.name,
      email: contractor.email,
      phone: contractor.phone,
      skills: contractor.skills,
      businessName: contractor.businessName,
      profileImage: contractor.profileImage,
      emergencyContact: contractor.emergencyContact,
      isActive: contractor.isActive,
      isVerified: contractor.isVerified,
      notes: contractor.notes,
      createdAt: contractor.createdAt,
      updatedAt: contractor.updatedAt,
      // Hide auth fields: password, refreshTokens, resetPasswordToken, etc.
    };

    return NextResponse.json(filteredContractor);
  } catch (error: unknown) {
    console.error("Error fetching contractor:", error);
    return NextResponse.json(
      { error: "Failed to fetch contractor" },
      { status: 500 },
    );
  }
}

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
        { error: "Not authorized to update contractors" },
        { status: 401 },
      );
    }

    await dbConnect();

    // Resolve the params promise
    const resolvedParams = await params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(resolvedParams.id)) {
      return NextResponse.json(
        { error: "Invalid contractor ID format" },
        { status: 400 },
      );
    }

    // Find the contractor
    const contractor = await Contractor.findById(resolvedParams.id);
    if (!contractor) {
      return NextResponse.json(
        { error: "Contractor not found" },
        { status: 404 },
      );
    }

    const updateData: Partial<ContractorFormData> = await request.json();

    // Validate name if provided
    if (updateData.name !== undefined) {
      if (!updateData.name || !updateData.name.trim()) {
        return NextResponse.json(
          { error: "Contractor name is required" },
          { status: 400 },
        );
      }

      // Check for duplicate name (excluding current contractor)
      const existingContractor = await Contractor.findOne({
        _id: { $ne: resolvedParams.id },
        name: { $regex: new RegExp(`^${updateData.name.trim()}$`, "i") },
      });

      if (existingContractor) {
        return NextResponse.json(
          { error: "A contractor with this name already exists" },
          { status: 400 },
        );
      }
    }

    // Validate email format if provided
    if (updateData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 },
        );
      }
    }

    // Validate emergency contact email if provided
    if (updateData.emergencyContact?.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.emergencyContact.email)) {
        return NextResponse.json(
          { error: "Invalid emergency contact email format" },
          { status: 400 },
        );
      }
    }

    // Validate emergency contact phone format if provided
    if (updateData.emergencyContact?.phone) {
      const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
      if (!phoneRegex.test(updateData.emergencyContact.phone)) {
        return NextResponse.json(
          { error: "Invalid emergency contact phone format" },
          { status: 400 },
        );
      }
    }

    // Validate profile image URL format if provided
    if (updateData.profileImage) {
      try {
        new URL(updateData.profileImage);
      } catch {
        return NextResponse.json(
          { error: "Invalid profile image URL format" },
          { status: 400 },
        );
      }
    }

    // Update contractor fields
    if (updateData.name !== undefined) {
      contractor.name = updateData.name.trim();
    }
    if (updateData.email !== undefined) {
      contractor.email = updateData.email.trim();
    }
    if (updateData.phone !== undefined) {
      contractor.phone = updateData.phone?.trim() || undefined;
    }
    if (updateData.skills !== undefined) {
      contractor.skills = updateData.skills || [];
    }
    if (updateData.isActive !== undefined) {
      contractor.isActive = updateData.isActive;
    }
    if (updateData.isVerified !== undefined) {
      contractor.isVerified = updateData.isVerified;
    }
    if (updateData.notes !== undefined) {
      contractor.notes = updateData.notes?.trim() || undefined;
    }
    if (updateData.businessName !== undefined) {
      contractor.businessName = updateData.businessName?.trim() || undefined;
    }
    if (updateData.profileImage !== undefined) {
      contractor.profileImage = updateData.profileImage?.trim() || undefined;
    }
    if (updateData.emergencyContact !== undefined) {
      if (updateData.emergencyContact) {
        contractor.emergencyContact = {
          name: updateData.emergencyContact.name?.trim() || "",
          phone: updateData.emergencyContact.phone?.trim() || "",
          relationship: updateData.emergencyContact.relationship?.trim() || "",
          email: updateData.emergencyContact.email?.trim() || undefined,
        };
      } else {
        contractor.emergencyContact = undefined;
      }
    }

    const updatedContractor = await contractor.save();

    return NextResponse.json(updatedContractor);
  } catch (error: unknown) {
    console.error("Error updating contractor:", error);

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
      { error: "Failed to update contractor" },
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
        { error: "Not authorized to delete contractors" },
        { status: 401 },
      );
    }

    await dbConnect();

    // Resolve the params promise
    const resolvedParams = await params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(resolvedParams.id)) {
      return NextResponse.json(
        { error: "Invalid contractor ID format" },
        { status: 400 },
      );
    }

    // Find the contractor
    const contractor = await Contractor.findById(resolvedParams.id);
    if (!contractor) {
      return NextResponse.json(
        { error: "Contractor not found" },
        { status: 404 },
      );
    }

    // Instead of hard delete, we'll deactivate the contractor
    // This preserves data integrity for existing task assignments
    contractor.isActive = false;
    await contractor.save();

    return NextResponse.json({
      message: "Contractor deactivated successfully",
      contractor: contractor,
    });
  } catch (error: unknown) {
    console.error("Error deactivating contractor:", error);
    return NextResponse.json(
      { error: "Failed to deactivate contractor" },
      { status: 500 },
    );
  }
}
