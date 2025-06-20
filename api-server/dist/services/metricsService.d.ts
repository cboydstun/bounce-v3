import { Counter, Histogram, Gauge } from "prom-client";
declare class MetricsService {
  private isInitialized;
  httpRequestsTotal: Counter<string>;
  httpRequestDuration: Histogram<string>;
  httpRequestsInFlight: Gauge<string>;
  dbConnectionsActive: Gauge<string>;
  dbQueryDuration: Histogram<string>;
  dbQueriesTotal: Counter<string>;
  authAttemptsTotal: Counter<string>;
  authSuccessTotal: Counter<string>;
  authFailuresTotal: Counter<string>;
  tasksTotal: Gauge<string>;
  taskOperationsTotal: Counter<string>;
  taskCompletionDuration: Histogram<string>;
  websocketConnectionsActive: Gauge<string>;
  websocketMessagesTotal: Counter<string>;
  websocketConnectionDuration: Histogram<string>;
  quickbooksApiCallsTotal: Counter<string>;
  quickbooksApiDuration: Histogram<string>;
  quickbooksConnectionsActive: Gauge<string>;
  cacheHitsTotal: Counter<string>;
  cacheMissesTotal: Counter<string>;
  cacheOperationDuration: Histogram<string>;
  errorsTotal: Counter<string>;
  errorsByType: Counter<string>;
  constructor();
  private initializeMetrics;
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
  ): void;
  recordDatabaseQuery(
    operation: string,
    collection: string,
    duration: number,
    success: boolean,
  ): void;
  recordAuthAttempt(type: string, success: boolean, reason?: string): void;
  recordTaskOperation(operation: string, status: string): void;
  recordTaskCompletion(durationSeconds: number): void;
  recordWebSocketMessage(type: string, direction: "inbound" | "outbound"): void;
  recordQuickBooksApiCall(
    operation: string,
    duration: number,
    success: boolean,
  ): void;
  recordCacheOperation(
    operation: "hit" | "miss",
    cacheType: string,
    duration?: number,
  ): void;
  recordError(
    errorType: string,
    component: string,
    severity?: "low" | "medium" | "high" | "critical",
  ): void;
  setActiveConnections(
    type: "http" | "websocket" | "database" | "quickbooks",
    count: number,
  ): void;
  setTaskCounts(status: string, count: number): void;
  getMetrics(): Promise<string>;
  clearMetrics(): void;
  isHealthy(): boolean;
}
export declare const metricsService: MetricsService;
export default metricsService;
//# sourceMappingURL=metricsService.d.ts.map
