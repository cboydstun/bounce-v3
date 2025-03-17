import { NextRequest, NextResponse } from "next/server";
import { SendMessageRequest, ChatResponse } from "@/types/chat";
import { connectToDatabase } from "@/utils/mongodb";
import { verifyToken } from "@/utils/auth";
import ChatSession from "@/models/ChatSession";
import ChatMessage from "@/models/ChatMessage";

export async function POST(request: NextRequest) {
    try {
        console.log("Sending new chat message...");
        const body: SendMessageRequest = await request.json();
        console.log("Request body:", {
            sessionId: body.sessionId,
            contentLength: body.content?.length || 0,
            isAdmin: body.isAdmin || false
        });

        if (!body.sessionId || !body.content) {
            console.log("Validation error: Missing required fields");
            return NextResponse.json<ChatResponse>(
                {
                    success: false,
                    message: "Session ID and message content are required",
                },
                { status: 400 }
            );
        }

        // Connect to database
        console.log("Connecting to database...");
        await connectToDatabase();
        console.log("Database connection established");

        // Verify session exists and is active
        console.log(`Looking for session with ID: ${body.sessionId}`);
        const session = await ChatSession.findOne({ id: body.sessionId });

        if (!session) {
            console.log(`Session not found: ${body.sessionId}`);
            return NextResponse.json<ChatResponse>(
                {
                    success: false,
                    message: "Chat session not found",
                },
                { status: 404 }
            );
        }

        console.log(`Session found: ${session.id}, Active: ${session.isActive}`);

        if (!session.isActive) {
            console.log(`Attempted to send message to inactive session: ${session.id}`);
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
            console.log("Admin message detected, verifying authentication...");
            const authHeader = request.headers.get("Authorization");
            if (!authHeader) {
                console.log("No authorization header found");
                return NextResponse.json<ChatResponse>(
                    {
                        success: false,
                        message: "Unauthorized",
                    },
                    { status: 401 }
                );
            }

            const isValid = verifyToken(authHeader);
            console.log(`Token validation result: ${isValid ? 'valid' : 'invalid'}`);

            if (!isValid) {
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
        console.log("Creating new message...");
        const messageId = crypto.randomUUID();
        console.log("Generated message ID:", messageId);

        const message = new ChatMessage({
            id: messageId,
            sessionId: body.sessionId,
            content: body.content,
            isAdmin: body.isAdmin || false,
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

        console.log("Message sent successfully");
        return NextResponse.json<ChatResponse>(
            {
                success: true,
                data: message.toJSON(),
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error sending message:", error);

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
                message: "Failed to send message. Please try again later.",
            },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        console.log("Fetching chat messages...");
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get("sessionId");
        console.log("Request for session ID:", sessionId);

        if (!sessionId) {
            console.log("Validation error: Missing session ID");
            return NextResponse.json<ChatResponse>(
                {
                    success: false,
                    message: "Session ID is required",
                },
                { status: 400 }
            );
        }

        // Connect to database
        console.log("Connecting to database...");
        await connectToDatabase();
        console.log("Database connection established");

        // Verify session exists
        console.log(`Looking for session with ID: ${sessionId}`);
        const session = await ChatSession.findOne({ id: sessionId });

        if (!session) {
            console.log(`Session not found: ${sessionId}`);
            return NextResponse.json<ChatResponse>(
                {
                    success: false,
                    message: "Chat session not found",
                },
                { status: 404 }
            );
        }

        console.log(`Session found: ${session.id}`);

        // Get messages for session
        console.log(`Fetching messages for session: ${sessionId}`);
        const messages = await ChatMessage.find({ sessionId })
            .sort({ timestamp: 1 })
            .lean();

        console.log(`Found ${messages.length} messages`);

        return NextResponse.json<ChatResponse>(
            {
                success: true,
                data: messages,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching messages:", error);

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
                message: "Failed to fetch messages. Please try again later.",
            },
            { status: 500 }
        );
    }
}
