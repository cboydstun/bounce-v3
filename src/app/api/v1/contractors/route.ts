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
    const search = searchParams.get("search");
    const status = searchParams.get("status"); // "all", "active", "inactive"
    const verification = searchParams.get("verification"); // "all", "verified", "unverified"
    const skills = searchParams.get("skills"); // comma-separated skill list
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    // Build query object
    const query: any = {};

    // Status filter
    if (status === "active") {
      query.isActive = true;
    } else if (status === "inactive") {
      query.isActive = false;
    }
    // If status is "all" or not provided, don't filter by status

    // Verification filter
    if (verification === "verified") {
      query.isVerified = true;
    } else if (verification === "unverified") {
      query.isVerified = false;
    }
    // If verification is "all" or not provided, don't filter by verification

    // Search filter (name, email, phone, businessName)
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { businessName: searchRegex },
      ];
    }

    // Skills filter
    if (skills && skills.trim()) {
      const skillArray = skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);
      if (skillArray.length > 0) {
        query.skills = { $in: skillArray };
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query with pagination
    const [contractors, total] = await Promise.all([
      Contractor.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Contractor.countDocuments(query),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Filter out sensitive auth fields for CRM display
    const filteredContractors = contractors.map((contractor) => ({
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
    }));

    // Return paginated response
    return NextResponse.json({
      contractors: filteredContractors,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      filters: {
        search,
        status,
        verification,
        skills: skills
          ? skills
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      },
    });
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

    // Check for duplicate email
    const existingContractor = await Contractor.findOne({
      email: contractorData.email.trim().toLowerCase(),
    });

    if (existingContractor) {
      return NextResponse.json(
        { error: "A contractor with this email already exists" },
        { status: 400 },
      );
    }

    // Create new contractor
    const newContractor = new Contractor({
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
    });

    const savedContractor = await newContractor.save();

    // Filter out sensitive fields from response
    const responseContractor = {
      _id: savedContractor._id,
      name: savedContractor.name,
      email: savedContractor.email,
      phone: savedContractor.phone,
      skills: savedContractor.skills,
      businessName: savedContractor.businessName,
      profileImage: savedContractor.profileImage,
      emergencyContact: savedContractor.emergencyContact,
      isActive: savedContractor.isActive,
      isVerified: savedContractor.isVerified,
      notes: savedContractor.notes,
      createdAt: savedContractor.createdAt,
      updatedAt: savedContractor.updatedAt,
    };

    return NextResponse.json(responseContractor, { status: 201 });
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
      if (error.message.includes("duplicate key")) {
        return NextResponse.json(
          { error: "A contractor with this email already exists" },
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
