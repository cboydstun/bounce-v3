import request from 'supertest';
import app from '../../src/app.test.js';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from '../setup/testDatabase.js';
import { TestHelpers } from '../setup/testHelpers.js';
import ContractorAuth from '../../src/models/ContractorAuth.js';

describe('Authentication Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  describe('POST /api/auth/contractor/register', () => {
    it('should register a new contractor successfully', async () => {
      const contractorData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        password: 'SecurePassword123!',
        skills: ['delivery', 'setup'],
      };

      const response = await request(app)
        .post('/api/auth/contractor/register')
        .send(contractorData)
        .expect(201);

      expect(response.body).toHaveProperty('contractor');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Registration successful');
      expect(response.body.contractor.email).toBe(contractorData.email);
      expect(response.body.contractor.name).toBe(contractorData.name);
      expect(response.body.contractor.isVerified).toBe(false);
      expect(response.body.contractor).not.toHaveProperty('password');

      // Verify contractor was saved to database
      const savedContractor = await ContractorAuth.findByEmail(contractorData.email);
      expect(savedContractor).toBeTruthy();
      expect(savedContractor?.isVerified).toBe(false); // Should require email verification
    });

    it('should reject registration with invalid email', async () => {
      const contractorData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'SecurePassword123!',
      };

      const response = await request(app)
        .post('/api/auth/contractor/register')
        .send(contractorData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Validation failed');
    });

    it('should reject registration with weak password', async () => {
      const contractorData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: '123',
      };

      const response = await request(app)
        .post('/api/auth/contractor/register')
        .send(contractorData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Validation failed');
    });

    it('should reject duplicate email registration', async () => {
      const contractorData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePassword123!',
      };

      // First registration
      await request(app)
        .post('/api/auth/contractor/register')
        .send(contractorData)
        .expect(201);

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/contractor/register')
        .send(contractorData)
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('POST /api/auth/contractor/login', () => {
    let testContractor: any;

    beforeEach(async () => {
      testContractor = await TestHelpers.createTestContractor({
        email: 'test@example.com',
        password: 'TestPassword123!',
        isVerified: true,
      });
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
      };

      const response = await request(app)
        .post('/api/auth/contractor/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('contractor');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.contractor.email).toBe(loginData.email);
      expect(response.body.contractor).not.toHaveProperty('password');
    });

    it('should reject login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'TestPassword123!',
      };

      const response = await request(app)
        .post('/api/auth/contractor/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid email or password');
    });

    it('should reject login with invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      };

      const response = await request(app)
        .post('/api/auth/contractor/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid email or password');
    });

    it('should allow login for unverified contractor but mark as unverified', async () => {
      // Create unverified contractor
      await TestHelpers.createTestContractor({
        email: 'unverified@example.com',
        password: 'TestPassword123!',
        isVerified: false,
      });

      const loginData = {
        email: 'unverified@example.com',
        password: 'TestPassword123!',
      };

      const response = await request(app)
        .post('/api/auth/contractor/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('contractor');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.contractor.isVerified).toBe(false);
    });
  });

  describe('POST /api/auth/contractor/refresh', () => {
    let testContractor: any;
    let refreshToken: string;

    beforeEach(async () => {
      testContractor = await TestHelpers.createTestContractor({
        isVerified: true,
      });
      refreshToken = TestHelpers.generateRefreshToken(testContractor._id);
      
      // Add refresh token to contractor
      const contractor = await ContractorAuth.findById(testContractor._id);
      contractor?.refreshTokens.push(refreshToken);
      await contractor?.save();
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/contractor/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(typeof response.body.accessToken).toBe('string');
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/contractor/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid refresh token');
    });

    it('should reject refresh token not in database', async () => {
      // Create a fake token with a different contractor ID to ensure it's not in the database
      const fakeContractorId = '507f1f77bcf86cd799439011'; // Valid ObjectId format but different
      const fakeToken = TestHelpers.generateRefreshToken(fakeContractorId);
      
      const response = await request(app)
        .post('/api/auth/contractor/refresh')
        .send({ refreshToken: fakeToken })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid refresh token');
    });
  });

  describe('POST /api/auth/contractor/logout', () => {
    let testContractor: any;
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      testContractor = await TestHelpers.createTestContractor({
        isVerified: true,
      });
      accessToken = TestHelpers.generateJWTToken(testContractor._id);
      refreshToken = TestHelpers.generateRefreshToken(testContractor._id);
      
      // Add refresh token to contractor
      const contractor = await ContractorAuth.findById(testContractor._id);
      contractor?.refreshTokens.push(refreshToken);
      await contractor?.save();
    });

    it('should logout successfully and invalidate refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/contractor/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Logout successful');

      // Verify refresh token was removed
      const contractor = await ContractorAuth.findById(testContractor._id);
      expect(contractor?.refreshTokens).not.toContain(refreshToken);
    });

    it('should reject logout without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/contractor/logout')
        .send({ refreshToken })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Access token required');
    });

    it('should reject logout with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/contractor/logout')
        .set('Authorization', 'Bearer invalid-token')
        .send({ refreshToken })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid access token');
    });
  });

  describe('POST /api/auth/contractor/forgot-password', () => {
    let testContractor: any;

    beforeEach(async () => {
      testContractor = await TestHelpers.createTestContractor({
        email: 'test@example.com',
        isVerified: true,
      });
    });

    it('should send password reset email for valid email', async () => {
      const response = await request(app)
        .post('/api/auth/contractor/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('If an account with this email exists, a password reset link has been sent.');

      // Verify reset token was set
      const contractor = await ContractorAuth.findById(testContractor._id);
      expect(contractor?.resetPasswordToken).toBeTruthy();
      expect(contractor?.resetPasswordExpires).toBeTruthy();
    });

    it('should return success even for non-existent email (security)', async () => {
      const response = await request(app)
        .post('/api/auth/contractor/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('If an account with this email exists, a password reset link has been sent.');
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/contractor/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Validation failed');
    });
  });

  describe('Protected Route Access', () => {
    let testContractor: any;
    let accessToken: string;

    beforeEach(async () => {
      testContractor = await TestHelpers.createTestContractor({
        isVerified: true,
      });
      accessToken = TestHelpers.generateJWTToken(testContractor._id);
    });

    it('should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/contractors/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('contractor');
      expect(response.body.contractor.contractorId).toBe(testContractor._id);
    });

    it('should reject protected route without token', async () => {
      const response = await request(app)
        .get('/api/contractors/me')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Access token required');
    });

    it('should reject protected route with invalid token', async () => {
      const response = await request(app)
        .get('/api/contractors/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid access token');
    });
  });
});
