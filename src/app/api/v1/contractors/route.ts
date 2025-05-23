import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Contractor from "@/models/Contractor";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ContractorFormData } from "@/types/contractor";

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const skill = searchParams.get("skill");
    const activeOnly = searchParams.get("active") !== "false"; // Default to true

    let contractors;

    if (skill) {
      // Filter by skill
      contractors = await Contractor.findBySkill(skill);
    } else if (activeOnly) {
      // Get only active contractors
      contractors = await Contractor.findActive();
    } else {
      // Get all contractors
      contractors = await Contractor.find({}).sort({ name: 1 });
    }

    return NextResponse.json(contractors);
  } catch (error: unknown) {
    console.error("Error fetching contractors:", error);
    return NextResponse.json(
      { error: "Failed to fetch contractors" },
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
        { error: "Not authorized to create contractors" },
        { status: 401 },
      );
    }

    await dbConnect();

    const contractorData: ContractorFormData = await request.json();

    // Validate required fields
    if (!contractorData.name || !contractorData.name.trim()) {
      return NextResponse.json(
        { error: "Contractor name is required" },
        { status: 400 },
      );
    }

    // Validate email format if provided
    if (contractorData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contractorData.email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 },
        );
      }
    }

    // Check for duplicate name
    const existingContractor = await Contractor.findOne({
      name: { $regex: new RegExp(`^${contractorData.name.trim()}$`, "i") },
    });

    if (existingContractor) {
      return NextResponse.json(
        { error: "A contractor with this name already exists" },
        { status: 400 },
      );
    }

    // Create new contractor
    const newContractor = new Contractor({
      name: contractorData.name.trim(),
      email: contractorData.email?.trim() || undefined,
      phone: contractorData.phone?.trim() || undefined,
      skills: contractorData.skills || [],
      isActive: contractorData.isActive !== false, // Default to true
      notes: contractorData.notes?.trim() || undefined,
    });

    const savedContractor = await newContractor.save();

    return NextResponse.json(savedContractor, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating contractor:", error);

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
      { error: "Failed to create contractor" },
      { status: 500 },
    );
  }
}
