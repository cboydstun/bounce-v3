import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// Singleton instance of MongoDB Memory Server
let mongoServer: MongoMemoryServer | null = null;

/**
 * Connect to the in-memory database.
 */
export const connect = async (): Promise<void> => {
  // If we already have a connection, just return
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // Close any existing connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // Create a new MongoDB Memory Server if one doesn't exist
  if (!mongoServer) {
    mongoServer = await MongoMemoryServer.create();
  }

  // Get the URI and connect
  const uri = mongoServer.getUri();

  // Override the MONGODB_URI environment variable for tests
  process.env.MONGODB_URI = uri;

  // Connect to the in-memory database
  await mongoose.connect(uri);
};

/**
 * Drop database, close the connection and stop mongod.
 */
export const closeDatabase = async (): Promise<void> => {
  // Only proceed if we have an active connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }

  // Only stop the server if it exists
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
};

/**
 * Remove all the data for all db collections.
 */
export const clearDatabase = async (): Promise<void> => {
  // Only proceed if we have an active connection
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
};
