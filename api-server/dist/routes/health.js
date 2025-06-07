import express from "express";
import mongoose from "mongoose";
import { cacheService } from "../services/cacheService.js";
import { metricsService } from "../services/metricsService.js";
import { logger } from "../utils/logger.js";
const router = express.Router();
// Basic health check endpoint
router.get("/", (req, res) => {
  const healthCheck = {
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    environment: process.env.NODE_ENV || "development",
  };
  res.status(200).json(healthCheck);
});
// Detailed health check endpoint
router.get("/detailed", async (req, res) => {
  const startTime = Date.now();
  try {
    const healthStatus = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      services: {
        database: await checkDatabaseHealth(),
        cache: await checkCacheHealth(),
        metrics: checkMetricsHealth(),
        external: {
          sendgrid: await checkSendGridHealth(),
          cloudinary: await checkCloudinaryHealth(),
          quickbooks: await checkQuickBooksHealth(),
        },
      },
      system: await getSystemMetrics(),
      performance: await getPerformanceMetrics(),
    };
    // Determine overall health status
    const serviceStatuses = [
      healthStatus.services.database.status,
      healthStatus.services.cache.status,
      healthStatus.services.metrics.status,
    ];
    if (serviceStatuses.includes("unhealthy")) {
      healthStatus.status = "unhealthy";
    } else if (serviceStatuses.includes("degraded")) {
      healthStatus.status = "degraded";
    }
    const responseTime = Date.now() - startTime;
    healthStatus.performance.responseTime = responseTime;
    const statusCode =
      healthStatus.status === "healthy"
        ? 200
        : healthStatus.status === "degraded"
          ? 200
          : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    logger.error("Health check failed:", error);
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Health check failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
// Readiness probe (for Kubernetes)
router.get("/ready", async (req, res) => {
  try {
    // Check critical services
    const dbHealth = await checkDatabaseHealth();
    if (dbHealth.status === "unhealthy") {
      return res.status(503).json({
        status: "not ready",
        reason: "Database not available",
        timestamp: new Date().toISOString(),
      });
    }
    return res.status(200).json({
      status: "ready",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(503).json({
      status: "not ready",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
});
// Liveness probe (for Kubernetes)
router.get("/live", (req, res) => {
  res.status(200).json({
    status: "alive",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
// Individual service health checks
async function checkDatabaseHealth() {
  const startTime = Date.now();
  try {
    const state = mongoose.connection.readyState;
    const responseTime = Date.now() - startTime;
    if (state === 1) {
      // Test with a simple query
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
      }
      return {
        status: "healthy",
        responseTime,
        lastCheck: new Date().toISOString(),
        details: {
          readyState: state,
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          name: mongoose.connection.name,
        },
      };
    } else {
      return {
        status: "unhealthy",
        responseTime,
        lastCheck: new Date().toISOString(),
        error: `Database connection state: ${state}`,
        details: { readyState: state },
      };
    }
  } catch (error) {
    return {
      status: "unhealthy",
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Database check failed",
    };
  }
}
async function checkCacheHealth() {
  const startTime = Date.now();
  try {
    const isHealthy = cacheService.isHealthy();
    const responseTime = Date.now() - startTime;
    if (isHealthy) {
      // Test cache operation
      const testKey = "health-check";
      const testValue = Date.now().toString();
      await cacheService.set(testKey, testValue, { ttl: 10 });
      const retrieved = await cacheService.get(testKey);
      await cacheService.del(testKey);
      return {
        status: retrieved === testValue ? "healthy" : "degraded",
        responseTime,
        lastCheck: new Date().toISOString(),
        details: {
          connected: true,
          testPassed: retrieved === testValue,
        },
      };
    } else {
      return {
        status: "degraded", // Cache is optional, so degraded not unhealthy
        responseTime,
        lastCheck: new Date().toISOString(),
        error: "Cache not connected",
        details: { connected: false },
      };
    }
  } catch (error) {
    return {
      status: "degraded",
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Cache check failed",
    };
  }
}
function checkMetricsHealth() {
  const startTime = Date.now();
  try {
    const isHealthy = metricsService.isHealthy();
    const responseTime = Date.now() - startTime;
    return {
      status: isHealthy ? "healthy" : "degraded",
      responseTime,
      lastCheck: new Date().toISOString(),
      details: { initialized: isHealthy },
    };
  } catch (error) {
    return {
      status: "degraded",
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Metrics check failed",
    };
  }
}
async function checkSendGridHealth() {
  const startTime = Date.now();
  try {
    // For SendGrid, we just check if the API key is configured
    const hasApiKey = !!process.env.SENDGRID_API_KEY;
    const responseTime = Date.now() - startTime;
    return {
      status: hasApiKey ? "healthy" : "degraded",
      responseTime,
      lastCheck: new Date().toISOString(),
      details: { configured: hasApiKey },
    };
  } catch (error) {
    return {
      status: "degraded",
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : "SendGrid check failed",
    };
  }
}
async function checkCloudinaryHealth() {
  const startTime = Date.now();
  try {
    // Check if Cloudinary is configured
    const hasConfig = !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
    const responseTime = Date.now() - startTime;
    return {
      status: hasConfig ? "healthy" : "degraded",
      responseTime,
      lastCheck: new Date().toISOString(),
      details: { configured: hasConfig },
    };
  } catch (error) {
    return {
      status: "degraded",
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Cloudinary check failed",
    };
  }
}
async function checkQuickBooksHealth() {
  const startTime = Date.now();
  try {
    // Check if QuickBooks is configured
    const hasConfig = !!(
      process.env.QUICKBOOKS_CLIENT_ID && process.env.QUICKBOOKS_CLIENT_SECRET
    );
    const responseTime = Date.now() - startTime;
    return {
      status: hasConfig ? "healthy" : "degraded",
      responseTime,
      lastCheck: new Date().toISOString(),
      details: { configured: hasConfig },
    };
  } catch (error) {
    return {
      status: "degraded",
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : "QuickBooks check failed",
    };
  }
}
async function getSystemMetrics() {
  const memUsage = process.memoryUsage();
  return {
    memory: {
      used: memUsage.heapUsed,
      total: memUsage.heapTotal,
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
    },
    cpu: {
      usage: process.cpuUsage().user / 1000000, // Convert to seconds
    },
    disk: {
      available: 0, // Would need additional package to get disk info
      total: 0,
      percentage: 0,
    },
  };
}
async function getPerformanceMetrics() {
  // These would typically come from your metrics service
  // For now, return placeholder values
  return {
    responseTime: 0, // Will be set by the calling function
    averageResponseTime: 150, // Placeholder
    requestsPerMinute: 0, // Placeholder
  };
}
export default router;
//# sourceMappingURL=health.js.map
