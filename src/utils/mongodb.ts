import mongoose from "mongoose";

if (!process.env.MONGODB_URI) {
    throw new Error("Please add your MONGODB_URI to .env");
}

let isConnected = false;

export const connectToDatabase = async () => {
    if (isConnected) {
        return;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        isConnected = true;
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
};

// Create indexes for our collections
export const createIndexes = async () => {
    const db = mongoose.connection;

    // Ensure indexes exist
    await db.collection("chatsessions").createIndex({ id: 1 }, { unique: true });
    await db.collection("chatsessions").createIndex({ contactInfo: 1 });
    await db.collection("chatsessions").createIndex({ isActive: 1 });
    await db.collection("chatsessions").createIndex({ lastMessageAt: -1 });

    await db.collection("chatmessages").createIndex({ id: 1 }, { unique: true });
    await db.collection("chatmessages").createIndex({ sessionId: 1 });
    await db.collection("chatmessages").createIndex({ timestamp: -1 });
};

// Handle connection errors
mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
    isConnected = false;
});

// Handle disconnection
mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected. Attempting to reconnect...");
    isConnected = false;
});

// Graceful shutdown
process.on("SIGINT", async () => {
    await mongoose.connection.close();
    process.exit(0);
});
