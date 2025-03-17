import { NextRequest, NextResponse } from "next/server";
import { CreateSessionRequest, ChatResponse } from "@/types/chat";
import { connectToDatabase } from "@/utils/mongodb";
import { verifyToken } from "@/utils/auth";
import ChatSession from "@/models/ChatSession";
import ChatMessage from "@/models/ChatMessage";

export async function POST(request: NextRequest) {
    try {
        console.log("Creating new chat session...");
        const body: CreateSessionRequest = await request.json();
        console.log("Request body:", body);

        if (!body.contactInfo || !body.initialMessage) {
            console.log("Validation error: Missing required fields");
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
            console.log("Validation error: Invalid contact format", body.contactInfo);
            return NextResponse.json<ChatResponse>(
                {
                    success: false,
                    message: "Invalid contact information format",
                },
                { status: 400 }
            );
        }

        // Connect to database
        console.log("Connecting to database...");
        await connectToDatabase();
        console.log("Database connection established");

        // Create session
        console.log("Creating chat session...");
        const sessionId = crypto.randomUUID();
        console.log("Generated session ID:", sessionId);

        const session = new ChatSession({
            id: sessionId,
            contactInfo: body.contactInfo,
            createdAt: new Date(),
            isActive: true,
            lastMessageAt: new Date(),
        });

        console.log("Saving session to database...");
        await session.save();
        console.log("Session saved successfully");

        // Create initial message
        console.log("Creating initial message...");
        const messageId = crypto.randomUUID();
        console.log("Generated message ID:", messageId);

        const message = new ChatMessage({
            id: messageId,
            sessionId: session.id,
            content: body.initialMessage,
            isAdmin: false,
            timestamp: new Date(),
        });

        console.log("Saving message to database...");
        await message.save();
        console.log("Message saved successfully");

        // Update session's lastMessageAt
        console.log("Updating session lastMessageAt...");
        session.lastMessageAt = message.timestamp;
        await session.save();
        console.log("Session updated successfully");

        console.log("Chat session created successfully");
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

        // More detailed error logging
        if (error instanceof Error) {
            console.error("Error name:", error.name);
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);

            if ('code' in error) {
                console.error("MongoDB error code:", (error).code);
            }
        }

        return NextResponse.json<ChatResponse>(
            {
                success: false,
                message: "Failed to create chat session. Please try again later.",
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
