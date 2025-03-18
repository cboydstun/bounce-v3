import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Contact from "@/models/Contact";
import { withAuth, AuthRequest } from "@/middleware/auth";
import mongoose from "mongoose";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (req: AuthRequest) => {
        try {
            // Check if user is authenticated
            if (!req.user) {
                return NextResponse.json(
                    { error: "Not authorized to view contacts" },
                    { status: 403 }
                );
            }

            await dbConnect();

            // Resolve the params promise
            const resolvedParams = await params;

            // Validate ID format
            if (!mongoose.Types.ObjectId.isValid(resolvedParams.id)) {
                return NextResponse.json(
                    { error: "Invalid contact ID format" },
                    { status: 400 }
                );
            }

            const contact = await Contact.findById(resolvedParams.id);

            if (!contact) {
                return NextResponse.json(
                    { error: "Contact not found" },
                    { status: 404 }
                );
            }

            return NextResponse.json(contact);
        } catch (error: unknown) {
            console.error("Error fetching contact:", error);
            return NextResponse.json(
                { error: "Failed to fetch contact" },
                { status: 500 }
            );
        }
    });
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (req: AuthRequest) => {
        try {
            // Check if user is authenticated
            if (!req.user) {
                return NextResponse.json(
                    { error: "Not authorized to update contacts" },
                    { status: 403 }
                );
            }

            await dbConnect();

            // Resolve the params promise
            const resolvedParams = await params;

            // Validate ID format
            if (!mongoose.Types.ObjectId.isValid(resolvedParams.id)) {
                return NextResponse.json(
                    { error: "Invalid contact ID format" },
                    { status: 400 }
                );
            }

            const contactData = await request.json();

            // Find the contact
            const contact = await Contact.findById(resolvedParams.id);

            if (!contact) {
                return NextResponse.json(
                    { error: "Contact not found" },
                    { status: 404 }
                );
            }

            // Update contact
            const updatedContact = await Contact.findByIdAndUpdate(
                resolvedParams.id,
                { $set: contactData },
                { new: true, runValidators: true }
            );

            return NextResponse.json(updatedContact);
        } catch (error: unknown) {
            console.error("Error updating contact:", error);
            return NextResponse.json(
                { error: "Failed to update contact" },
                { status: 500 }
            );
        }
    });
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (req: AuthRequest) => {
        try {
            // Check if user is authenticated and is admin
            if (!req.user || req.user.role !== "admin") {
                return NextResponse.json(
                    { error: "Not authorized to delete contacts" },
                    { status: 403 }
                );
            }

            await dbConnect();

            // Resolve the params promise
            const resolvedParams = await params;

            // Validate ID format
            if (!mongoose.Types.ObjectId.isValid(resolvedParams.id)) {
                return NextResponse.json(
                    { error: "Invalid contact ID format" },
                    { status: 400 }
                );
            }

            // Find the contact
            const contact = await Contact.findById(resolvedParams.id);

            if (!contact) {
                return NextResponse.json(
                    { error: "Contact not found" },
                    { status: 404 }
                );
            }

            // Delete contact
            await Contact.findByIdAndDelete(resolvedParams.id);

            return NextResponse.json({ message: "Contact deleted successfully" });
        } catch (error: unknown) {
            console.error("Error deleting contact:", error);
            return NextResponse.json(
                { error: "Failed to delete contact" },
                { status: 500 }
            );
        }
    });
}
