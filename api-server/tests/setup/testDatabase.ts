import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { logger } from "../../src/utils/logger.js";

let mongoServer: MongoMemoryServer;

export const setupTestDatabase = async (): Promise<void> => {
  try {
    // Create in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: "7.0.0",
      },
    });

    const mongoUri = mongoServer.getUri();

    // Connect to the in-memory database
    await mongoose.connect(mongoUri);

    logger.info("Test database connected successfully");
  } catch (error) {
    logger.error("Failed to setup test database:", error);
    throw error;
  }
};

export const teardownTestDatabase = async (): Promise<void> => {
  try {
    // Close all mongoose connections
    await mongoose.disconnect();

    // Stop the in-memory MongoDB instance
    if (mongoServer) {
      await mongoServer.stop();
    }

    // Clear any remaining timers or intervals
    if (global.gc) {
      global.gc();
    }

    logger.info("Test database disconnected successfully");
  } catch (error) {
    logger.error("Failed to teardown test database:", error);
    // Don't throw error to prevent test failures during cleanup
  }
};

export const clearTestDatabase = async (): Promise<void> => {
  try {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }

    logger.debug("Test database cleared");
  } catch (error) {
    logger.error("Failed to clear test database:", error);
    throw error;
  }
};

export const getTestDatabaseConnection = () => {
  return mongoose.connection;
};
