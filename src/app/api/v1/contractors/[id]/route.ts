import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Contractor from "@/models/Contractor";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ContractorFormData } from "@/types/contractor";

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
        { error: "Not authorized to view contractor details" },
        { status: 401 },
      );
    }

    await dbConnect();

    const contractorId = params.id;

    // Validate contractor ID format
    if (!contractorId || contractorId.length !== 24) {
      return NextResponse.json(
        { error: "Invalid contractor ID format" },
        { status: 400 },
      );
    }

    // Find contractor by ID
    const contractor = await Contractor.findById(contractorId).lean();

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
      { error: "Failed to fetch contractor details" },
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
        { error: "Not authorized to update contractors" },
        { status: 401 },
      );
    }

    await dbConnect();

    const contractorId = params.id;
    const contractorData: ContractorFormData = await request.json();

    // Validate contractor ID format
    if (!contractorId || contractorId.length !== 24) {
      return NextResponse.json(
        { error: "Invalid contractor ID format" },
        { status: 400 },
      );
    }

    // Validate required fields
    if (!contractorData.name || !contractorData.name.trim()) {
      return NextResponse.json(
        { error: "Contractor name is required" },
        { status: 400 },
      );
    }

    if (!contractorData.email || !contractorData.email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contractorData.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Validate emergency contact email if provided
    if (contractorData.emergencyContact?.email) {
      if (!emailRegex.test(contractorData.emergencyContact.email)) {
        return NextResponse.json(
          { error: "Invalid emergency contact email format" },
          { status: 400 },
        );
      }
    }

    // Validate emergency contact phone format if provided
    if (contractorData.emergencyContact?.phone) {
      const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
      if (!phoneRegex.test(contractorData.emergencyContact.phone)) {
        return NextResponse.json(
          { error: "Invalid emergency contact phone format" },
          { status: 400 },
        );
      }
    }

    // Validate profile image URL format if provided
    if (contractorData.profileImage) {
      try {
        new URL(contractorData.profileImage);
      } catch {
        return NextResponse.json(
          { error: "Invalid profile image URL format" },
          { status: 400 },
        );
      }
    }

    // Check if contractor exists
    const existingContractor = await Contractor.findById(contractorId);
    if (!existingContractor) {
      return NextResponse.json(
        { error: "Contractor not found" },
        { status: 404 },
      );
    }

    // Check for duplicate email (excluding current contractor)
    const duplicateContractor = await Contractor.findOne({
      email: contractorData.email.trim().toLowerCase(),
      _id: { $ne: contractorId },
    });

    if (duplicateContractor) {
      return NextResponse.json(
        { error: "A contractor with this email already exists" },
        { status: 400 },
      );
    }

    // Update contractor
    const updatedContractor = await Contractor.findByIdAndUpdate(
      contractorId,
      {
        name: contractorData.name.trim(),
        email: contractorData.email.trim(),
        phone: contractorData.phone?.trim() || undefined,
        skills: contractorData.skills || [],
        businessName: contractorData.businessName?.trim() || undefined,
        profileImage: contractorData.profileImage?.trim() || undefined,
        emergencyContact: contractorData.emergencyContact
          ? {
              name: contractorData.emergencyContact.name?.trim() || "",
              phone: contractorData.emergencyContact.phone?.trim() || "",
              relationship:
                contractorData.emergencyContact.relationship?.trim() || "",
              email: contractorData.emergencyContact.email?.trim() || undefined,
            }
          : undefined,
        isActive: contractorData.isActive !== false, // Default to true
        isVerified: contractorData.isVerified !== false, // Default to true for CRM
        notes: contractorData.notes?.trim() || undefined,
      },
      { new: true, runValidators: true },
    );

    if (!updatedContractor) {
      return NextResponse.json(
        { error: "Failed to update contractor" },
        { status: 500 },
      );
    }

    // Filter out sensitive fields from response
    const responseContractor = {
      _id: updatedContractor._id,
      name: updatedContractor.name,
      email: updatedContractor.email,
      phone: updatedContractor.phone,
      skills: updatedContractor.skills,
      businessName: updatedContractor.businessName,
      profileImage: updatedContractor.profileImage,
      emergencyContact: updatedContractor.emergencyContact,
      isActive: updatedContractor.isActive,
      isVerified: updatedContractor.isVerified,
      notes: updatedContractor.notes,
      createdAt: updatedContractor.createdAt,
      updatedAt: updatedContractor.updatedAt,
    };

    return NextResponse.json(responseContractor);
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
      if (error.message.includes("duplicate key")) {
        return NextResponse.json(
          { error: "A contractor with this email already exists" },
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
  { params }: { params: { id: string } },
) {
  try {
    // Get the session using NextAuth's recommended approach
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Not authorized to deactivate contractors" },
        { status: 401 },
      );
    }

    await dbConnect();

    const contractorId = params.id;

    // Validate contractor ID format
    if (!contractorId || contractorId.length !== 24) {
      return NextResponse.json(
        { error: "Invalid contractor ID format" },
        { status: 400 },
      );
    }

    // Find and deactivate contractor (soft delete)
    const updatedContractor = await Contractor.findByIdAndUpdate(
      contractorId,
      { isActive: false },
      { new: true },
    );

    if (!updatedContractor) {
      return NextResponse.json(
        { error: "Contractor not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Contractor deactivated successfully",
      contractor: {
        _id: updatedContractor._id,
        name: updatedContractor.name,
        email: updatedContractor.email,
        isActive: updatedContractor.isActive,
      },
    });
  } catch (error: unknown) {
    console.error("Error deactivating contractor:", error);
    return NextResponse.json(
      { error: "Failed to deactivate contractor" },
      { status: 500 },
    );
  }
}
