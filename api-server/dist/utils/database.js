import mongoose from "mongoose";
import { logger } from "./logger.js";
class Database {
    static instance;
    isConnected = false;
    constructor() { }
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
    async connect() {
        if (this.isConnected) {
            logger.info("Database already connected");
            return;
        }
        try {
            const mongoUri = process.env.MONGODB_URI;
            if (!mongoUri) {
                throw new Error("MONGODB_URI environment variable is not set");
            }
            await mongoose.connect(mongoUri, {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                bufferCommands: false,
            });
            this.isConnected = true;
            logger.info("Connected to MongoDB successfully");
            // Handle connection events
            mongoose.connection.on("error", (error) => {
                logger.error("MongoDB connection error:", error);
                this.isConnected = false;
            });
            mongoose.connection.on("disconnected", () => {
                logger.warn("MongoDB disconnected");
                this.isConnected = false;
            });
            mongoose.connection.on("reconnected", () => {
                logger.info("MongoDB reconnected");
                this.isConnected = true;
            });
        }
        catch (error) {
            logger.error("Failed to connect to MongoDB:", error);
            this.isConnected = false;
            throw error;
        }
    }
    async disconnect() {
        if (!this.isConnected) {
            return;
        }
        try {
            await mongoose.disconnect();
            this.isConnected = false;
            logger.info("Disconnected from MongoDB");
        }
        catch (error) {
            logger.error("Error disconnecting from MongoDB:", error);
            throw error;
        }
    }
    isConnectionReady() {
        return this.isConnected && mongoose.connection.readyState === 1;
    }
    getConnection() {
        return mongoose.connection;
    }
}
export const database = Database.getInstance();
export default database;
//# sourceMappingURL=database.js.map