import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import ContractorAuth from '../../src/models/ContractorAuth.js';
import Task from '../../src/models/Task.js';
import W9Form from '../../src/models/W9Form.js';
import QuickBooksToken from '../../src/models/QuickBooksToken.js';

export interface TestContractor {
  _id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  skills: string[];
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  isVerified: boolean;
  quickbooksConnected: boolean;
}

export interface TestTask {
  _id: string;
  title: string;
  description: string;
  skills: string[];
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  status: 'Pending' | 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled';
  assignedTo?: string;
  estimatedDuration: number;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
}

export class TestHelpers {
  static async createTestContractor(overrides: Partial<TestContractor> = {}): Promise<TestContractor> {
    const defaultContractor = {
      name: 'Test Contractor',
      email: `test${Date.now()}@example.com`,
      phone: '+1234567890',
      password: 'TestPassword123!',
      skills: ['delivery', 'setup'],
      location: {
        type: 'Point' as const,
        coordinates: [-98.4936, 29.4241] as [number, number], // San Antonio coordinates
      },
      isVerified: true,
      quickbooksConnected: false,
      refreshTokens: [],
    };

    const contractorData = { ...defaultContractor, ...overrides };
    
    // Let the Mongoose model handle password hashing via pre-save hook
    const contractor = new ContractorAuth(contractorData);
    await contractor.save();
    
    return {
      _id: contractor._id.toString(),
      ...contractorData,
    };
  }

  static async createTestTask(overrides: Partial<any> = {}): Promise<any> {
    const defaultTask: any = {
      orderId: '507f1f77bcf86cd799439011', // Valid ObjectId
      title: 'Test Task',
      type: 'Delivery',
      description: 'Test task description',
      skills: ['delivery'],
      scheduledDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      priority: 'Medium',
      status: 'Pending',
      assignedContractors: [],
      location: {
        type: 'Point' as const,
        coordinates: [-98.4936, 29.4241] as [number, number], // San Antonio coordinates
      },
      address: '123 Test St, San Antonio, TX 78201',
    };

    const taskData = { ...defaultTask, ...overrides };
    
    // Handle assignedTo field for backward compatibility
    if (taskData.assignedTo) {
      // Ensure assignedTo is a valid ObjectId format
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(taskData.assignedTo)) {
        if (!taskData.assignedContractors.includes(taskData.assignedTo)) {
          taskData.assignedContractors = [...taskData.assignedContractors, taskData.assignedTo];
        }
      } else {
        // Generate a valid ObjectId for test purposes
        const validObjectId = new mongoose.Types.ObjectId().toString();
        taskData.assignedTo = validObjectId;
        taskData.assignedContractors = [...taskData.assignedContractors, validObjectId];
      }
    }
    
    const task = new Task(taskData);
    await task.save();
    
    return {
      _id: task._id.toString(),
      ...taskData,
    };
  }

  static generateJWTToken(contractorId: string, contractorData?: Partial<TestContractor>): string {
    const payload = {
      contractorId,
      email: contractorData?.email || `test${Date.now()}@example.com`,
      name: contractorData?.name || 'Test Contractor',
      isVerified: contractorData?.isVerified ?? true,
    };
    
    return jwt.sign(
      payload,
      process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only',
      { 
        expiresIn: '15m',
        issuer: 'bounce-mobile-api',
        audience: 'bounce-contractors'
      }
    );
  }

  static generateRefreshToken(contractorId: string): string {
    return jwt.sign(
      { contractorId, type: 'refresh' },
      process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only',
      { 
        expiresIn: '7d',
        issuer: 'bounce-mobile-api',
        audience: 'bounce-contractors'
      }
    );
  }

  static async createTestW9Form(contractorId: string, overrides: any = {}): Promise<any> {
    const defaultW9Data = {
      contractorId,
      businessName: 'Test Business',
      taxClassification: 'Individual/sole proprietor',
      taxId: '123456789',
      address: {
        street: '123 Test St',
        city: 'San Antonio',
        state: 'TX',
        zipCode: '78201',
      },
      signature: 'Test Signature',
      dateSigned: new Date(),
      status: 'submitted',
    };

    const w9Data = { ...defaultW9Data, ...overrides };
    
    const w9Form = new W9Form(w9Data);
    await w9Form.save();
    
    return w9Form;
  }

  static async createTestQuickBooksToken(contractorId: string, overrides: any = {}): Promise<any> {
    const defaultTokenData = {
      contractorId,
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      companyId: 'test-company-id',
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      isActive: true,
    };

    const tokenData = { ...defaultTokenData, ...overrides };
    
    const token = new QuickBooksToken(tokenData);
    await token.save();
    
    return token;
  }

  static mockSendGridEmail() {
    // Mock SendGrid email service
    const mockSend = jest.fn().mockResolvedValue([{ statusCode: 202 }]);
    
    jest.doMock('@sendgrid/mail', () => ({
      setApiKey: jest.fn(),
      send: mockSend,
    }));

    return { mockSend };
  }

  static mockCloudinary() {
    // Mock Cloudinary service
    const mockUpload = jest.fn().mockResolvedValue({
      public_id: 'test-image-id',
      secure_url: 'https://res.cloudinary.com/test/image/upload/test-image.jpg',
      width: 800,
      height: 600,
    });

    jest.doMock('cloudinary', () => ({
      v2: {
        config: jest.fn(),
        uploader: {
          upload: mockUpload,
        },
      },
    }));

    return { mockUpload };
  }

  static mockQuickBooks() {
    // Mock QuickBooks service
    const mockCreateVendor = jest.fn().mockResolvedValue({
      Id: 'test-vendor-id',
      Name: 'Test Vendor',
    });

    const mockGetCompanyInfo = jest.fn().mockResolvedValue({
      CompanyName: 'Test Company',
      Country: 'US',
    });

    jest.doMock('node-quickbooks', () => ({
      QuickBooks: jest.fn().mockImplementation(() => ({
        createVendor: mockCreateVendor,
        getCompanyInfo: mockGetCompanyInfo,
      })),
    }));

    return { mockCreateVendor, mockGetCompanyInfo };
  }

  static getAuthHeaders(contractorId: string, contractorData?: Partial<TestContractor>): { Authorization: string } {
    const token = this.generateJWTToken(contractorId, contractorData);
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  static async cleanupTestData(): Promise<void> {
    await Promise.all([
      ContractorAuth.deleteMany({}),
      Task.deleteMany({}),
      W9Form.deleteMany({}),
      QuickBooksToken.deleteMany({}),
    ]);
  }
}
