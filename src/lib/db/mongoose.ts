import mongoose from "mongoose";

// Define the type for the cached connection
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Add mongoose to the NodeJS global type
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

// Use a default value to ensure cached is never undefined
const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

// Initialize global cache if not already set
if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect() {
  // If we already have a connection, just return it
  if (cached.conn) {
    return cached.conn;
  }

  // Get the MongoDB URI from environment variables
  const MONGODB_URI = process.env.MONGODB_URI!;

  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable");
  }

  // If we don't have a promise yet, create one
  if (!cached.promise) {
    // Close any existing connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Connect to MongoDB
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  // Wait for the connection to be established
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
