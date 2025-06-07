// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, "../.env") });
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { logger } from "./utils/logger.js";
import { database } from "./utils/database.js";
import { socketAuthMiddleware } from "./middleware/socketAuth.js";
import { SocketHandlers } from "./websocket/socketHandlers.js";
import { RealtimeService } from "./services/realtimeService.js";
// Import services
import { cacheService } from "./services/cacheService.js";
import { metricsService } from "./services/metricsService.js";
// Import routes
import authRoutes from "./routes/auth.js";
import contractorRoutes from "./routes/contractors.js";
import taskRoutes from "./routes/tasks.js";
import quickbooksRoutes from "./routes/quickbooks.js";
import healthRoutes from "./routes/health.js";
const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});
// Trust proxy for rate limiting
app.set("trust proxy", 1);
// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ];
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Platform",
    "X-App-Version",
    "X-Request-ID",
  ],
};
app.use(cors(corsOptions));
// Compression middleware
app.use(compression());
// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"), // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);
// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// Metrics middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  // Increment in-flight requests
  metricsService.setActiveConnections("http", 1);
  res.on("finish", () => {
    const duration = (Date.now() - startTime) / 1000;
    // Record HTTP metrics
    metricsService.recordHttpRequest(
      req.method,
      req.route?.path || req.path,
      res.statusCode,
      duration,
    );
    // Decrement in-flight requests
    metricsService.setActiveConnections("http", 0);
  });
  next();
});
// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    timestamp: new Date().toISOString(),
  });
  next();
});
// Metrics endpoint
app.get("/metrics", async (req, res) => {
  try {
    const metrics = await metricsService.getMetrics();
    res.set("Content-Type", "text/plain");
    res.send(metrics);
  } catch (error) {
    logger.error("Failed to get metrics:", error);
    res.status(500).send("Failed to get metrics");
  }
});
// Health check routes
app.use("/health", healthRoutes);
// API routes
app.use("/api/auth", authRoutes);
app.use("/api/contractors", contractorRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/quickbooks", quickbooksRoutes);
// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    code: "ROUTE_NOT_FOUND",
    path: req.originalUrl,
  });
});
// Global error handler
app.use((error, req, res, next) => {
  // Record error metrics
  metricsService.recordError(
    error.name || "UnknownError",
    "express-app",
    "high",
  );
  logger.error("Unhandled error:", {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });
  res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
    ...(process.env.NODE_ENV === "development" && { details: error.message }),
  });
});
// Socket.IO authentication middleware
io.use(socketAuthMiddleware);
// Initialize socket handlers
const socketHandlers = new SocketHandlers(io);
socketHandlers.initializeHandlers();
// Initialize realtime service
RealtimeService.initialize(socketHandlers);
logger.info(
  "WebSocket infrastructure initialized with authentication and real-time services",
);
// Export io for use in other modules
export { io };
// Start server
const PORT = process.env.PORT || 4000;
async function startServer() {
  try {
    // Connect to database
    await database.connect();
    logger.info("Database connected successfully");
    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 API Server running on port ${PORT}`);
      logger.info(
        `📊 Health check available at http://localhost:${PORT}/health`,
      );
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}
// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(() => {
    logger.info("HTTP server closed");
  });
  try {
    await database.disconnect();
    logger.info("Database disconnected");
    await cacheService.disconnect();
    logger.info("Cache disconnected");
  } catch (error) {
    logger.error("Error during shutdown:", error);
  }
  process.exit(0);
});
process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully");
  server.close(() => {
    logger.info("HTTP server closed");
  });
  try {
    await database.disconnect();
    logger.info("Database disconnected");
    await cacheService.disconnect();
    logger.info("Cache disconnected");
  } catch (error) {
    logger.error("Error during shutdown:", error);
  }
  process.exit(0);
});
// Start the server
if (process.env.NODE_ENV !== "test") {
  startServer();
}
export default app;
//# sourceMappingURL=app.js.map
