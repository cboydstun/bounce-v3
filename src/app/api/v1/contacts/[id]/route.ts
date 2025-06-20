import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Contact from "@/models/Contact";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose, { Document } from "mongoose";

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
        { error: "Not authorized to view contact" },
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
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Not authorized to update contact" },
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

    // Check if trying to set status to Confirmed without required fields
    if (
      contactData.confirmed === "Confirmed" ||
      (typeof contactData.confirmed === "boolean" &&
        contactData.confirmed === true)
    ) {
      // Get the values that will be used after update
      const streetAddress =
        contactData.streetAddress !== undefined
          ? contactData.streetAddress
          : contactDoc.streetAddress;

      const partyStartTime =
        contactData.partyStartTime !== undefined
          ? contactData.partyStartTime
          : contactDoc.partyStartTime;

      // Check for null, undefined, or empty strings
      if (
        !streetAddress ||
        streetAddress.trim() === "" ||
        !partyStartTime ||
        partyStartTime.trim() === ""
      ) {
        return NextResponse.json(
          {
            error:
              "Contact cannot be confirmed without street address and party start time",
          },
          { status: 400 },
        );
      }
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
            "Converted",
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
  try {
    // Get the session using NextAuth's recommended approach
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Not authorized to update contact" },
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

    // Check if trying to set status to Confirmed without required fields
    if (
      contactData.confirmed === "Confirmed" ||
      (typeof contactData.confirmed === "boolean" &&
        contactData.confirmed === true)
    ) {
      // Get the values that will be used after update
      const streetAddress =
        contactData.streetAddress !== undefined
          ? contactData.streetAddress
          : contactDoc.streetAddress;

      const partyStartTime =
        contactData.partyStartTime !== undefined
          ? contactData.partyStartTime
          : contactDoc.partyStartTime;

      // Check for null, undefined, or empty strings
      if (
        !streetAddress ||
        streetAddress.trim() === "" ||
        !partyStartTime ||
        partyStartTime.trim() === ""
      ) {
        return NextResponse.json(
          {
            error:
              "Contact cannot be confirmed without street address and party start time",
          },
          { status: 400 },
        );
      }
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
            "Converted",
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
        { error: "Not authorized to delete contact" },
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
