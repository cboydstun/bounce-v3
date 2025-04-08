import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Contact from "@/models/Contact";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { withAuth, AuthRequest } from "@/middleware/auth";

// Debug logger function
const debugLog = (message: string, data?: any) => {
  console.log(
    `[CONTACT ID API DEBUG] ${message}`,
    data ? JSON.stringify(data, null, 2) : "",
  );
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Get the session using NextAuth's recommended approach
    debugLog("Getting server session");
    const session = await getServerSession(authOptions);

    // Log session details for debugging
    debugLog("Session result", {
      hasSession: !!session,
      user: session?.user
        ? {
            id: session.user.id,
            email: session.user.email,
          }
        : null,
    });

    // Check if user is authenticated
    if (!session || !session.user) {
      debugLog("No valid session found, returning 401");
      return NextResponse.json(
        { error: "Not authorized to view contacts" },
        { status: 401 },
      );
    }

    await dbConnect();

    // Resolve the params promise
    const resolvedParams = await params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(resolvedParams.id)) {
      return NextResponse.json(
        { error: "Invalid contact ID format" },
        { status: 400 },
      );
    }

    const contact = await Contact.findById(resolvedParams.id);

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json(contact);
  } catch (error: unknown) {
    console.error("Error fetching contact:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact" },
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
    debugLog("Getting server session for PUT");
    const session = await getServerSession(authOptions);

    // Log session details for debugging
    debugLog("Session result for PUT", {
      hasSession: !!session,
      user: session?.user
        ? {
            id: session.user.id,
            email: session.user.email,
          }
        : null,
    });

    // Check if user is authenticated
    if (!session || !session.user) {
      debugLog("No valid session found for PUT, returning 401");
      return NextResponse.json(
        { error: "Not authorized to update contacts" },
        { status: 401 },
      );
    }

    await dbConnect();

    // Resolve the params promise
    const resolvedParams = await params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(resolvedParams.id)) {
      return NextResponse.json(
        { error: "Invalid contact ID format" },
        { status: 400 },
      );
    }

    const contactData = await request.json();

    // Find the contact document and update it manually
    const contactDoc = await Contact.findById(resolvedParams.id);

    if (!contactDoc) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Update all fields from contactData
    Object.keys(contactData).forEach((key) => {
      // Special handling for the confirmed field
      if (key === "confirmed") {
        if (typeof contactData.confirmed === "string") {
          // Ensure it's one of the valid enum values
          const validValues = [
            "Confirmed",
            "Pending",
            "Called / Texted",
            "Declined",
            "Cancelled",
          ];
          if (validValues.includes(contactData.confirmed)) {
            contactDoc.confirmed = contactData.confirmed;
          }
        } else if (typeof contactData.confirmed === "boolean") {
          // Convert boolean to string enum value
          contactDoc.confirmed = contactData.confirmed
            ? "Confirmed"
            : "Pending";
        }
      } else {
        // For all other fields, update directly
        (contactDoc as any)[key] = contactData[key];
      }
    });

    // Save the updated document
    const updatedContact = await contactDoc.save();

    return NextResponse.json(updatedContact);
  } catch (error: unknown) {
    console.error("Error updating contact:", error);
    return NextResponse.json(
      { error: "Failed to update contact" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAuth(request, async (req: AuthRequest) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return NextResponse.json(
          { error: "Not authorized to update contacts" },
          { status: 403 },
        );
      }

      await dbConnect();

      // Resolve the params promise
      const resolvedParams = await params;

      // Validate ID format
      if (!mongoose.Types.ObjectId.isValid(resolvedParams.id)) {
        return NextResponse.json(
          { error: "Invalid contact ID format" },
          { status: 400 },
        );
      }

      const contactData = await request.json();

      // Find the contact document and update it manually
      const contactDoc = await Contact.findById(resolvedParams.id);

      if (!contactDoc) {
        return NextResponse.json(
          { error: "Contact not found" },
          { status: 404 },
        );
      }

      // Update all fields from contactData
      Object.keys(contactData).forEach((key) => {
        // Special handling for the confirmed field
        if (key === "confirmed") {
          if (typeof contactData.confirmed === "string") {
            // Ensure it's one of the valid enum values
            const validValues = [
              "Confirmed",
              "Pending",
              "Called / Texted",
              "Declined",
              "Cancelled",
            ];
            if (validValues.includes(contactData.confirmed)) {
              contactDoc.confirmed = contactData.confirmed;
            }
          } else if (typeof contactData.confirmed === "boolean") {
            // Convert boolean to string enum value
            contactDoc.confirmed = contactData.confirmed
              ? "Confirmed"
              : "Pending";
          }
        } else {
          // For all other fields, update directly
          (contactDoc as any)[key] = contactData[key];
        }
      });

      // Save the updated document
      const updatedContact = await contactDoc.save();

      return NextResponse.json(updatedContact);
    } catch (error: unknown) {
      console.error("Error updating contact:", error);
      return NextResponse.json(
        { error: "Failed to update contact" },
        { status: 500 },
      );
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Get the session using NextAuth's recommended approach
    debugLog("Getting server session for DELETE");
    const session = await getServerSession(authOptions);

    // Log session details for debugging
    debugLog("Session result for DELETE", {
      hasSession: !!session,
      user: session?.user
        ? {
            id: session.user.id,
            email: session.user.email,
          }
        : null,
    });

    // Check if user is authenticated
    if (!session || !session.user) {
      debugLog("No valid session found for DELETE, returning 401");
      return NextResponse.json(
        { error: "Not authorized to delete contacts" },
        { status: 401 },
      );
    }

    await dbConnect();

    // Resolve the params promise
    const resolvedParams = await params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(resolvedParams.id)) {
      return NextResponse.json(
        { error: "Invalid contact ID format" },
        { status: 400 },
      );
    }

    // Find the contact
    const contact = await Contact.findById(resolvedParams.id);

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Delete contact
    await Contact.findByIdAndDelete(resolvedParams.id);

    return NextResponse.json({ message: "Contact deleted successfully" });
  } catch (error: unknown) {
    console.error("Error deleting contact:", error);
    return NextResponse.json(
      { error: "Failed to delete contact" },
      { status: 500 },
    );
  }
}
