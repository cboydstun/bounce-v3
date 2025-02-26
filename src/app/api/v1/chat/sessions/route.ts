import { NextRequest, NextResponse } from "next/server";
import { CreateSessionRequest, ChatResponse } from "@/types/chat";
import { connectToDatabase } from "@/utils/mongodb";
import { verifyToken } from "@/utils/auth";
import ChatSession from "@/models/ChatSession";
import ChatMessage from "@/models/ChatMessage";

export async function POST(request: NextRequest) {
    try {
        const body: CreateSessionRequest = await request.json();

        if (!body.contactInfo || !body.initialMessage) {
            return NextResponse.json<ChatResponse>(
                {
                    success: false,
                    message: "Contact information and initial message are required",
                },
                { status: 400 }
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\+?[\d\s-]{10,}$/;

        if (!emailRegex.test(body.contactInfo) && !phoneRegex.test(body.contactInfo)) {
            return NextResponse.json<ChatResponse>(
                {
                    success: false,
                    message: "Invalid contact information format",
                },
                { status: 400 }
            );
        }

        // Connect to database
        await connectToDatabase();

        // Create session
        const session = new ChatSession({
            id: crypto.randomUUID(),
            contactInfo: body.contactInfo,
            createdAt: new Date(),
            isActive: true,
            lastMessageAt: new Date(),
        });
        await session.save();

        // Create initial message
        const message = new ChatMessage({
            id: crypto.randomUUID(),
            sessionId: session.id,
            content: body.initialMessage,
            isAdmin: false,
            timestamp: new Date(),
        });
        await message.save();

        // Update session's lastMessageAt
        session.lastMessageAt = message.timestamp;
        await session.save();

        return NextResponse.json<ChatResponse>(
            {
                success: true,
                data: {
                    session: session.toJSON(),
                    message: message.toJSON(),
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating chat session:", error);
        return NextResponse.json<ChatResponse>(
            {
                success: false,
                message: "Failed to create chat session",
            },
            { status: 500 }
        );
    }
}

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

        // Get all sessions with their latest messages
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
                data: sessionsWithMessages,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching chat sessions:", error);
        return NextResponse.json<ChatResponse>(
            {
                success: false,
                message: "Failed to fetch chat sessions",
            },
            { status: 500 }
        );
    }
}
