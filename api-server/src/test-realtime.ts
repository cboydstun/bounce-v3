/**
 * Real-time WebSocket Test Script
 * 
 * This script tests the real-time functionality of the mobile API server.
 * It simulates contractor connections and task events to verify the WebSocket system.
 */

import { io as Client, Socket } from 'socket.io-client';
import dotenv from 'dotenv';
import { jwtService } from './utils/jwt.js';
import { logger } from './utils/logger.js';
import { database } from './utils/database.js';
import ContractorAuth from './models/ContractorAuth.js';

// Load environment variables
dotenv.config();

interface TestContractor {
  id: string;
  name: string;
  email: string;
  skills: string[];
  socket?: Socket | undefined;
  token?: string;
}

class RealtimeTestSuite {
  private serverUrl: string;
  private testContractors: TestContractor[] = [];
  private connectedSockets: Socket[] = [];

  constructor(serverUrl: string = 'http://localhost:4000') {
    this.serverUrl = serverUrl;
  }

  /**
   * Create test contractors in the database
   */
  private async createTestContractorsInDB(): Promise<void> {
    logger.info('🗄️ Creating test contractors in database...');

    // Connect to database if not already connected
    if (!database.isConnectionReady()) {
      await database.connect();
    }

    // Clean up any existing test contractors
    await ContractorAuth.deleteMany({
      email: { $in: ['john@test.com', 'jane@test.com', 'bob@test.com'] }
    });

    // Create test contractors
    for (const contractor of this.testContractors) {
      const newContractor = new ContractorAuth({
        _id: contractor.id,
        name: contractor.name,
        email: contractor.email,
        password: 'testpassword123', // This will be hashed automatically
        skills: contractor.skills,
        isActive: true,
        isVerified: true
      });

      await newContractor.save();
      logger.info(`✅ Created contractor in DB: ${contractor.name} (${contractor.id})`);
    }

    logger.info('🎯 All test contractors created in database');
  }

  /**
   * Clean up test contractors from database
   */
  private async cleanupTestContractorsFromDB(): Promise<void> {
    logger.info('🗑️ Cleaning up test contractors from database...');

    try {
      await ContractorAuth.deleteMany({
        email: { $in: ['john@test.com', 'jane@test.com', 'bob@test.com'] }
      });
      logger.info('✅ Test contractors removed from database');
    } catch (error) {
      logger.warn('⚠️ Error cleaning up test contractors:', error);
    }
  }

  /**
   * Initialize test contractors
   */
  private initializeTestContractors(): void {
    this.testContractors = [
      {
        id: '507f1f77bcf86cd799439011',
        name: 'John Delivery',
        email: 'john@test.com',
        skills: ['Delivery', 'Setup']
      },
      {
        id: '507f1f77bcf86cd799439012',
        name: 'Jane Setup',
        email: 'jane@test.com',
        skills: ['Setup', 'Pickup']
      },
      {
        id: '507f1f77bcf86cd799439013',
        name: 'Bob Maintenance',
        email: 'bob@test.com',
        skills: ['Maintenance', 'Delivery']
      }
    ];

    // Generate JWT tokens for test contractors
    this.testContractors.forEach(contractor => {
      contractor.token = jwtService.generateAccessToken({
        contractorId: contractor.id,
        name: contractor.name,
        email: contractor.email,
        isVerified: true
      });
    });

    logger.info('Test contractors initialized:', {
      count: this.testContractors.length,
      contractors: this.testContractors.map(c => ({ id: c.id, name: c.name, skills: c.skills }))
    });
  }

  /**
   * Connect a contractor to the WebSocket server
   */
  private async connectContractor(contractor: TestContractor): Promise<Socket> {
    return new Promise((resolve, reject) => {
      const socket = Client(this.serverUrl, {
        auth: {
          token: contractor.token
        },
        transports: ['websocket']
      });

      socket.on('connect', () => {
        logger.info(`✅ Contractor ${contractor.name} connected (${socket.id})`);
        contractor.socket = socket;
        this.connectedSockets.push(socket);
        resolve(socket);
      });

      socket.on('connection:established', (data: any) => {
        logger.info(`🎉 Connection established for ${contractor.name}:`, data);
      });

      socket.on('connect_error', (error: any) => {
        logger.error(`❌ Connection failed for ${contractor.name}:`, error.message);
        reject(error);
      });

      socket.on('error', (error: any) => {
        logger.error(`🚨 Socket error for ${contractor.name}:`, error);
      });

      // Set up event listeners for testing
      this.setupEventListeners(socket, contractor);

      // Set connection timeout
      setTimeout(() => {
        if (!socket.connected) {
          reject(new Error(`Connection timeout for ${contractor.name}`));
        }
      }, 5000);
    });
  }

  /**
   * Set up event listeners for a contractor socket
   */
  private setupEventListeners(socket: Socket, contractor: TestContractor): void {
    // Task events
    socket.on('task:new', (data: any) => {
      logger.info(`📋 ${contractor.name} received new task:`, {
        taskId: data.id,
        type: data.type,
        description: data.description.substring(0, 50) + '...'
      });
    });

    socket.on('task:assigned', (data: any) => {
      logger.info(`✅ ${contractor.name} received task assignment:`, {
        taskId: data.id,
        type: data.type
      });
    });

    socket.on('task:claimed', (data: any) => {
      logger.info(`🏃 ${contractor.name} notified task claimed:`, {
        taskId: data.id,
        claimedBy: data.claimedBy
      });
    });

    socket.on('task:updated', (data: any) => {
      logger.info(`🔄 ${contractor.name} received task update:`, {
        taskId: data.id,
        status: data.status,
        previousStatus: data.previousStatus
      });
    });

    socket.on('task:completed', (data: any) => {
      logger.info(`🎯 ${contractor.name} notified task completed:`, {
        taskId: data.id,
        completedBy: data.completedBy
      });
    });

    socket.on('task:cancelled', (data: any) => {
      logger.info(`❌ ${contractor.name} notified task cancelled:`, {
        taskId: data.id,
        reason: data.reason
      });
    });

    // Notification events
    socket.on('notification:system', (data: any) => {
      logger.info(`🔔 ${contractor.name} received system notification:`, {
        title: data.title,
        priority: data.priority
      });
    });

    socket.on('notification:personal', (data: any) => {
      logger.info(`💌 ${contractor.name} received personal notification:`, {
        title: data.title,
        priority: data.priority
      });
    });

    // Location events
    socket.on('contractor:location-updated', (data: any) => {
      logger.info(`📍 ${contractor.name} location updated:`, data.location);
    });

    // Heartbeat
    socket.on('pong', (data: any) => {
      logger.debug(`💓 ${contractor.name} received pong:`, data.timestamp);
    });
  }

  /**
   * Test location updates
   */
  private async testLocationUpdates(): Promise<void> {
    logger.info('\n🧪 Testing location updates...');

    const contractor = this.testContractors[0];
    if (!contractor?.socket) {
      throw new Error('Contractor not connected');
    }

    // Test location update
    const testLocation = {
      lat: 29.4241,
      lng: -98.4936,
      radius: 25
    };

    contractor.socket.emit('contractor:location-update', testLocation);
    logger.info(`📍 Sent location update for ${contractor.name}:`, testLocation);

    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Test task subscriptions
   */
  private async testTaskSubscriptions(): Promise<void> {
    logger.info('\n🧪 Testing task subscriptions...');

    for (const contractor of this.testContractors) {
      if (!contractor?.socket) continue;

      const filters = {
        skills: contractor.skills,
        location: {
          lat: 29.4241,
          lng: -98.4936,
          radius: 50
        }
      };

      contractor.socket.emit('task:subscribe', filters);
      logger.info(`📋 ${contractor.name} subscribed to tasks with filters:`, filters);
    }

    // Wait for confirmations
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Test heartbeat/ping-pong
   */
  private async testHeartbeat(): Promise<void> {
    logger.info('\n🧪 Testing heartbeat...');

    for (const contractor of this.testContractors) {
      if (!contractor?.socket) continue;

      contractor.socket.emit('ping');
      logger.info(`💓 Sent ping from ${contractor.name}`);
    }

    // Wait for pongs
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Test room information (debug)
   */
  private async testRoomInfo(): Promise<void> {
    logger.info('\n🧪 Testing room information...');

    const contractor = this.testContractors[0];
    if (!contractor?.socket) {
      throw new Error('Contractor not connected');
    }

    contractor.socket.on('debug:room-info-response', (data: any) => {
      logger.info(`🏠 Room info for ${contractor.name}:`, {
        contractorRooms: data.contractorRooms,
        roomStats: data.roomStats
      });
    });

    contractor.socket.emit('debug:room-info');

    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Simulate task events for testing
   */
  private async simulateTaskEvents(): Promise<void> {
    logger.info('\n🧪 Simulating task events...');

    // Note: In a real test, you would create actual tasks through the API
    // For this demo, we'll just log what would happen
    logger.info('📝 In a real scenario, you would:');
    logger.info('   1. Create a new task via POST /api/tasks');
    logger.info('   2. Claim the task via POST /api/tasks/:id/claim');
    logger.info('   3. Update task status via PUT /api/tasks/:id/status');
    logger.info('   4. Complete the task via POST /api/tasks/:id/complete');
    logger.info('   5. Each action would trigger real-time events to connected contractors');
  }

  /**
   * Clean up connections
   */
  private cleanup(): void {
    logger.info('\n🧹 Cleaning up connections...');

    this.connectedSockets.forEach(socket => {
      if (socket.connected) {
        socket.disconnect();
      }
    });

    this.connectedSockets = [];
    this.testContractors.forEach(contractor => {
      delete contractor.socket;
    });

    logger.info('✅ Cleanup completed');
  }

  /**
   * Run the complete test suite
   */
  async runTests(): Promise<void> {
    try {
      logger.info('🚀 Starting Real-time WebSocket Test Suite');
      logger.info(`🌐 Server URL: ${this.serverUrl}`);

      // Initialize test data
      this.initializeTestContractors();

      // Create test contractors in database
      await this.createTestContractorsInDB();

      // Connect all test contractors
      logger.info('\n🔌 Connecting test contractors...');
      for (const contractor of this.testContractors) {
        await this.connectContractor(contractor);
        // Small delay between connections
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Wait for all connections to stabilize
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Run tests
      await this.testLocationUpdates();
      await this.testTaskSubscriptions();
      await this.testHeartbeat();
      await this.testRoomInfo();
      await this.simulateTaskEvents();

      // Keep connections alive for a bit to observe any additional events
      logger.info('\n⏳ Keeping connections alive for 10 seconds to observe events...');
      await new Promise(resolve => setTimeout(resolve, 10000));

      logger.info('\n🎉 All tests completed successfully!');

    } catch (error) {
      logger.error('❌ Test suite failed:', error);
      throw error;
    } finally {
      this.cleanup();
      await this.cleanupTestContractorsFromDB();
    }
  }
}

// Run the test suite if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const testSuite = new RealtimeTestSuite();
  
  testSuite.runTests()
    .then(() => {
      logger.info('✅ Test suite completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}

export { RealtimeTestSuite };
