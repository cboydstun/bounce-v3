import { NextRequest, NextResponse } from "next/server";
import { ChatResponse } from "@/types/chat";
import { connectToDatabase } from "@/utils/mongodb";
import { verifyToken } from "@/utils/auth";
import ChatSession, { IChatSession } from "@/models/ChatSession";
import ChatMessage, { IChatMessage } from "@/models/ChatMessage";

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) {
            return NextResponse.json<ChatResponse>(
                {
                    success: false,
                    message: "Unauthorized",
                },
                { status: 401 }
            );
        }

        // Verify JWT token
        if (!verifyToken(authHeader)) {
            return NextResponse.json<ChatResponse>(
                {
                    success: false,
                    message: "Invalid token",
                },
                { status: 403 }
            );
        }

        // Connect to database
        await connectToDatabase();

        // Get all sessions sorted by last message time
        const sessions = await ChatSession.find()
            .sort({ lastMessageAt: -1 })
            .lean();

        // Get latest message for each session
        const sessionsWithMessages = await Promise.all(
            sessions.map(async (session) => {
                const latestMessage = await ChatMessage.findOne({ sessionId: session.id })
                    .sort({ timestamp: -1 })
                    .lean();

                return {
                    ...session,
                    latestMessage: latestMessage || null,
                };
            })
        );

        return NextResponse.json<ChatResponse>(
            {
                success: true,
                data: {
                    sessions: sessionsWithMessages,
                    total: sessions.length,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching admin sessions:", error);
        return NextResponse.json<ChatResponse>(
            {
                success: false,
                message: "Failed to fetch admin sessions",
            },
            { status: 500 }
        );
    }
}

// Update session status (active/inactive)
export async function PATCH(request: NextRequest) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) {
            return NextResponse.json<ChatResponse>(
                {
                    success: false,
                    message: "Unauthorized",
                },
                { status: 401 }
            );
        }

        // Verify JWT token
        if (!verifyToken(authHeader)) {
            return NextResponse.json<ChatResponse>(
                {
                    success: false,
                    message: "Invalid token",
                },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { sessionId, isActive } = body;

        if (sessionId === undefined || isActive === undefined) {
            return NextResponse.json<ChatResponse>(
                {
                    success: false,
                    message: "Session ID and status are required",
                },
                { status: 400 }
            );
        }

        // Connect to database
        await connectToDatabase();

        // Find and update session
        const session = await ChatSession.findOne({ id: sessionId });
        if (!session) {
            return NextResponse.json<ChatResponse>(
                {
                    success: false,
                    message: "Chat session not found",
                },
                { status: 404 }
            );
        }

        session.isActive = isActive;
        await session.save();

        return NextResponse.json<ChatResponse>(
            {
                success: true,
                message: "Session status updated successfully",
                data: session.toJSON(),
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating session status:", error);
        return NextResponse.json<ChatResponse>(
            {
                success: false,
                message: "Failed to update session status",
            },
            { status: 500 }
        );
    }
}
