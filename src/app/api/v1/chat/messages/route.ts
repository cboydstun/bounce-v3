import { NextRequest, NextResponse } from "next/server";
import { SendMessageRequest, ChatResponse } from "@/types/chat";
import { connectToDatabase } from "@/utils/mongodb";
import { verifyToken } from "@/utils/auth";
import ChatSession from "@/models/ChatSession";
import ChatMessage from "@/models/ChatMessage";

export async function POST(request: NextRequest) {
    try {
        const body: SendMessageRequest = await request.json();

        if (!body.sessionId || !body.content) {
            return NextResponse.json<ChatResponse>(
                {
                    success: false,
                    message: "Session ID and message content are required",
                },
                { status: 400 }
            );
        }

        // Connect to database
        await connectToDatabase();

        // Verify session exists and is active
        const session = await ChatSession.findOne({ id: body.sessionId });
        if (!session) {
            return NextResponse.json<ChatResponse>(
                {
                    success: false,
                    message: "Chat session not found",
                },
                { status: 404 }
            );
        }

        if (!session.isActive) {
            return NextResponse.json<ChatResponse>(
                {
                    success: false,
                    message: "Chat session is no longer active",
                },
                { status: 400 }
            );
        }

        // If it's an admin message, verify authentication
        if (body.isAdmin) {
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

            if (!verifyToken(authHeader)) {
                return NextResponse.json<ChatResponse>(
                    {
                        success: false,
                        message: "Invalid token",
                    },
                    { status: 403 }
                );
            }
        }

        // Create and store message
        const message = new ChatMessage({
            id: crypto.randomUUID(),
            sessionId: body.sessionId,
            content: body.content,
            isAdmin: body.isAdmin || false,
            timestamp: new Date(),
        });
        await message.save();

        // Update session's lastMessageAt
        session.lastMessageAt = message.timestamp;
        await session.save();

        return NextResponse.json<ChatResponse>(
            {
                success: true,
                data: message.toJSON(),
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error sending message:", error);
        return NextResponse.json<ChatResponse>(
            {
                success: false,
                message: "Failed to send message",
            },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get("sessionId");

        if (!sessionId) {
            return NextResponse.json<ChatResponse>(
                {
                    success: false,
                    message: "Session ID is required",
                },
                { status: 400 }
            );
        }

        // Connect to database
        await connectToDatabase();

        // Verify session exists
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

        // Get messages for session
        const messages = await ChatMessage.find({ sessionId })
            .sort({ timestamp: 1 })
            .lean();

        return NextResponse.json<ChatResponse>(
            {
                success: true,
                data: messages,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching messages:", error);
        return NextResponse.json<ChatResponse>(
            {
                success: false,
                message: "Failed to fetch messages",
            },
            { status: 500 }
        );
    }
}
