/**
 * Real-time WebSocket Test Script
 *
 * This script tests the real-time functionality of the mobile API server.
 * It simulates contractor connections and task events to verify the WebSocket system.
 */
declare class RealtimeTestSuite {
  private serverUrl;
  private testContractors;
  private connectedSockets;
  constructor(serverUrl?: string);
  /**
   * Create test contractors in the database
   */
  private createTestContractorsInDB;
  /**
   * Clean up test contractors from database
   */
  private cleanupTestContractorsFromDB;
  /**
   * Initialize test contractors
   */
  private initializeTestContractors;
  /**
   * Connect a contractor to the WebSocket server
   */
  private connectContractor;
  /**
   * Set up event listeners for a contractor socket
   */
  private setupEventListeners;
  /**
   * Test location updates
   */
  private testLocationUpdates;
  /**
   * Test task subscriptions
   */
  private testTaskSubscriptions;
  /**
   * Test heartbeat/ping-pong
   */
  private testHeartbeat;
  /**
   * Test room information (debug)
   */
  private testRoomInfo;
  /**
   * Simulate task events for testing
   */
  private simulateTaskEvents;
  /**
   * Clean up connections
   */
  private cleanup;
  /**
   * Run the complete test suite
   */
  runTests(): Promise<void>;
}
export { RealtimeTestSuite };
//# sourceMappingURL=test-realtime.d.ts.map
