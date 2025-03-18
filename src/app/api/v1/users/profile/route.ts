import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import User from "@/models/User";
import { withAuth, AuthRequest } from "@/middleware/auth";

export async function GET(request: NextRequest) {
    return withAuth(request, async (req: AuthRequest) => {
        try {
            await dbConnect();

            const user = await User.findById(req.user!.id);

            if (!user) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }

            return NextResponse.json(user);
        } catch (error) {
            console.error("Profile fetch error:", error);
            return NextResponse.json(
                { error: "Failed to fetch profile" },
                { status: 500 }
            );
        }
    });
}

export async function PUT(request: NextRequest) {
    return withAuth(request, async (req: AuthRequest) => {
        try {
            await dbConnect();

            const userData = await req.json();

            // Prevent updating password through this endpoint
            // Password updates should have their own dedicated endpoint with current password verification
            delete userData.password;

            const user = await User.findByIdAndUpdate(
                req.user!.id,
                { $set: userData },
                { new: true, runValidators: true }
            );

            if (!user) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }

            return NextResponse.json(user);
        } catch (error) {
            console.error("Profile update error:", error);
            return NextResponse.json(
                { error: "Failed to update profile" },
                { status: 500 }
            );
        }
    });
}
