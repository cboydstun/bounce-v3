import {
  register,
  collectDefaultMetrics,
  Counter,
  Histogram,
  Gauge,
} from "prom-client";
import { logger } from "../utils/logger.js";

class MetricsService {
  private isInitialized = false;

  // HTTP Metrics
  public httpRequestsTotal!: Counter<string>;
  public httpRequestDuration!: Histogram<string>;
  public httpRequestsInFlight!: Gauge<string>;

  // Database Metrics
  public dbConnectionsActive!: Gauge<string>;
  public dbQueryDuration!: Histogram<string>;
  public dbQueriesTotal!: Counter<string>;

  // Authentication Metrics
  public authAttemptsTotal!: Counter<string>;
  public authSuccessTotal!: Counter<string>;
  public authFailuresTotal!: Counter<string>;

  // Task Management Metrics
  public tasksTotal!: Gauge<string>;
  public taskOperationsTotal!: Counter<string>;
  public taskCompletionDuration!: Histogram<string>;

  // WebSocket Metrics
  public websocketConnectionsActive!: Gauge<string>;
  public websocketMessagesTotal!: Counter<string>;
  public websocketConnectionDuration!: Histogram<string>;

  // QuickBooks Integration Metrics
  public quickbooksApiCallsTotal!: Counter<string>;
  public quickbooksApiDuration!: Histogram<string>;
  public quickbooksConnectionsActive!: Gauge<string>;

  // Cache Metrics
  public cacheHitsTotal!: Counter<string>;
  public cacheMissesTotal!: Counter<string>;
  public cacheOperationDuration!: Histogram<string>;

  // Error Metrics
  public errorsTotal!: Counter<string>;
  public errorsByType!: Counter<string>;

  constructor() {
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    if (this.isInitialized) {
      return;
    }

    try {
      // Collect default Node.js metrics
      collectDefaultMetrics({
        register,
        prefix: "bounce_api_",
      });

      // HTTP Metrics
      this.httpRequestsTotal = new Counter({
        name: "bounce_api_http_requests_total",
        help: "Total number of HTTP requests",
        labelNames: ["method", "route", "status_code"],
        registers: [register],
      });

      this.httpRequestDuration = new Histogram({
        name: "bounce_api_http_request_duration_seconds",
        help: "Duration of HTTP requests in seconds",
        labelNames: ["method", "route", "status_code"],
        buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
        registers: [register],
      });

      this.httpRequestsInFlight = new Gauge({
        name: "bounce_api_http_requests_in_flight",
        help: "Number of HTTP requests currently being processed",
        registers: [register],
      });

      // Database Metrics
      this.dbConnectionsActive = new Gauge({
        name: "bounce_api_db_connections_active",
        help: "Number of active database connections",
        registers: [register],
      });

      this.dbQueryDuration = new Histogram({
        name: "bounce_api_db_query_duration_seconds",
        help: "Duration of database queries in seconds",
        labelNames: ["operation", "collection"],
        buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5],
        registers: [register],
      });

      this.dbQueriesTotal = new Counter({
        name: "bounce_api_db_queries_total",
        help: "Total number of database queries",
        labelNames: ["operation", "collection", "status"],
        registers: [register],
      });

      // Authentication Metrics
      this.authAttemptsTotal = new Counter({
        name: "bounce_api_auth_attempts_total",
        help: "Total number of authentication attempts",
        labelNames: ["type"],
        registers: [register],
      });

      this.authSuccessTotal = new Counter({
        name: "bounce_api_auth_success_total",
        help: "Total number of successful authentications",
        labelNames: ["type"],
        registers: [register],
      });

      this.authFailuresTotal = new Counter({
        name: "bounce_api_auth_failures_total",
        help: "Total number of failed authentications",
        labelNames: ["type", "reason"],
        registers: [register],
      });

      // Task Management Metrics
      this.tasksTotal = new Gauge({
        name: "bounce_api_tasks_total",
        help: "Total number of tasks by status",
        labelNames: ["status"],
        registers: [register],
      });

      this.taskOperationsTotal = new Counter({
        name: "bounce_api_task_operations_total",
        help: "Total number of task operations",
        labelNames: ["operation", "status"],
        registers: [register],
      });

      this.taskCompletionDuration = new Histogram({
        name: "bounce_api_task_completion_duration_seconds",
        help: "Duration from task assignment to completion",
        buckets: [300, 600, 1800, 3600, 7200, 14400, 28800, 86400],
        registers: [register],
      });

      // WebSocket Metrics
      this.websocketConnectionsActive = new Gauge({
        name: "bounce_api_websocket_connections_active",
        help: "Number of active WebSocket connections",
        registers: [register],
      });

      this.websocketMessagesTotal = new Counter({
        name: "bounce_api_websocket_messages_total",
        help: "Total number of WebSocket messages",
        labelNames: ["type", "direction"],
        registers: [register],
      });

      this.websocketConnectionDuration = new Histogram({
        name: "bounce_api_websocket_connection_duration_seconds",
        help: "Duration of WebSocket connections",
        buckets: [60, 300, 600, 1800, 3600, 7200, 14400],
        registers: [register],
      });

      // QuickBooks Integration Metrics
      this.quickbooksApiCallsTotal = new Counter({
        name: "bounce_api_quickbooks_api_calls_total",
        help: "Total number of QuickBooks API calls",
        labelNames: ["operation", "status"],
        registers: [register],
      });

      this.quickbooksApiDuration = new Histogram({
        name: "bounce_api_quickbooks_api_duration_seconds",
        help: "Duration of QuickBooks API calls",
        labelNames: ["operation"],
        buckets: [0.5, 1, 2, 5, 10, 30],
        registers: [register],
      });

      this.quickbooksConnectionsActive = new Gauge({
        name: "bounce_api_quickbooks_connections_active",
        help: "Number of active QuickBooks connections",
        registers: [register],
      });

      // Cache Metrics
      this.cacheHitsTotal = new Counter({
        name: "bounce_api_cache_hits_total",
        help: "Total number of cache hits",
        labelNames: ["cache_type"],
        registers: [register],
      });

      this.cacheMissesTotal = new Counter({
        name: "bounce_api_cache_misses_total",
        help: "Total number of cache misses",
        labelNames: ["cache_type"],
        registers: [register],
      });

      this.cacheOperationDuration = new Histogram({
        name: "bounce_api_cache_operation_duration_seconds",
        help: "Duration of cache operations",
        labelNames: ["operation", "cache_type"],
        buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
        registers: [register],
      });

      // Error Metrics
      this.errorsTotal = new Counter({
        name: "bounce_api_errors_total",
        help: "Total number of errors",
        labelNames: ["type", "severity"],
        registers: [register],
      });

      this.errorsByType = new Counter({
        name: "bounce_api_errors_by_type_total",
        help: "Total number of errors by specific type",
        labelNames: ["error_type", "component"],
        registers: [register],
      });

      this.isInitialized = true;
      logger.info("Prometheus metrics initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize metrics:", error);
    }
  }

  // Helper methods for common metric operations
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
  ): void {
    this.httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode.toString(),
    });
    this.httpRequestDuration.observe(
      { method, route, status_code: statusCode.toString() },
      duration,
    );
  }

  recordDatabaseQuery(
    operation: string,
    collection: string,
    duration: number,
    success: boolean,
  ): void {
    this.dbQueriesTotal.inc({
      operation,
      collection,
      status: success ? "success" : "error",
    });
    this.dbQueryDuration.observe({ operation, collection }, duration);
  }

  recordAuthAttempt(type: string, success: boolean, reason?: string): void {
    this.authAttemptsTotal.inc({ type });
    if (success) {
      this.authSuccessTotal.inc({ type });
    } else {
      this.authFailuresTotal.inc({ type, reason: reason || "unknown" });
    }
  }

  recordTaskOperation(operation: string, status: string): void {
    this.taskOperationsTotal.inc({ operation, status });
  }

  recordTaskCompletion(durationSeconds: number): void {
    this.taskCompletionDuration.observe(durationSeconds);
  }

  recordWebSocketMessage(
    type: string,
    direction: "inbound" | "outbound",
  ): void {
    this.websocketMessagesTotal.inc({ type, direction });
  }

  recordQuickBooksApiCall(
    operation: string,
    duration: number,
    success: boolean,
  ): void {
    this.quickbooksApiCallsTotal.inc({
      operation,
      status: success ? "success" : "error",
    });
    this.quickbooksApiDuration.observe({ operation }, duration);
  }

  recordCacheOperation(
    operation: "hit" | "miss",
    cacheType: string,
    duration?: number,
  ): void {
    if (operation === "hit") {
      this.cacheHitsTotal.inc({ cache_type: cacheType });
    } else {
      this.cacheMissesTotal.inc({ cache_type: cacheType });
    }

    if (duration !== undefined) {
      this.cacheOperationDuration.observe(
        { operation, cache_type: cacheType },
        duration,
      );
    }
  }

  recordError(
    errorType: string,
    component: string,
    severity: "low" | "medium" | "high" | "critical" = "medium",
  ): void {
    this.errorsTotal.inc({ type: errorType, severity });
    this.errorsByType.inc({ error_type: errorType, component });
  }

  // Gauge setters
  setActiveConnections(
    type: "http" | "websocket" | "database" | "quickbooks",
    count: number,
  ): void {
    switch (type) {
      case "http":
        this.httpRequestsInFlight.set(count);
        break;
      case "websocket":
        this.websocketConnectionsActive.set(count);
        break;
      case "database":
        this.dbConnectionsActive.set(count);
        break;
      case "quickbooks":
        this.quickbooksConnectionsActive.set(count);
        break;
    }
  }

  setTaskCounts(status: string, count: number): void {
    this.tasksTotal.set({ status }, count);
  }

  // Get metrics for /metrics endpoint
  async getMetrics(): Promise<string> {
    try {
      return await register.metrics();
    } catch (error) {
      logger.error("Failed to get metrics:", error);
      return "";
    }
  }

  // Clear all metrics (useful for testing)
  clearMetrics(): void {
    register.clear();
    this.isInitialized = false;
    this.initializeMetrics();
  }

  // Health check for metrics service
  isHealthy(): boolean {
    return this.isInitialized;
  }
}

export const metricsService = new MetricsService();
export default metricsService;
