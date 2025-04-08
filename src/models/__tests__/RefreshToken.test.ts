import mongoose from 'mongoose';
import RefreshToken, { IRefreshToken } from '../RefreshToken';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('RefreshToken Model', () => {
  let mongoServer: MongoMemoryServer;

  // Connect to a new in-memory database before running any tests
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  // Clear all test data after each test
  afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  // Disconnect and close the db connection after all tests
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('should create a new refresh token', async () => {
    const userId = new mongoose.Types.ObjectId();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

    const refreshTokenData = {
      userId,
      tokenId: 'test-token-id',
      expiresAt,
      isRevoked: false
    };

    const refreshToken = await RefreshToken.create(refreshTokenData);

    // Check that the refresh token was created correctly
    expect(refreshToken).toBeDefined();
    expect(refreshToken.userId.toString()).toBe(userId.toString());
    expect(refreshToken.tokenId).toBe('test-token-id');
    expect(refreshToken.expiresAt.getTime()).toBe(expiresAt.getTime());
    expect(refreshToken.isRevoked).toBe(false);
    expect(refreshToken.createdAt).toBeDefined();
  });

  it('should require userId', async () => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const refreshTokenData = {
      tokenId: 'test-token-id',
      expiresAt,
      isRevoked: false
    };

    // Attempt to create a refresh token without userId
    let error;
    try {
      await RefreshToken.create(refreshTokenData);
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect((error as Error).name).toBe('ValidationError');
    expect(error as Error).toHaveProperty('errors.userId');
  });

  it('should require tokenId', async () => {
    const userId = new mongoose.Types.ObjectId();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const refreshTokenData = {
      userId,
      expiresAt,
      isRevoked: false
    };

    // Attempt to create a refresh token without tokenId
    let error;
    try {
      await RefreshToken.create(refreshTokenData);
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error as Error).toHaveProperty('name', 'ValidationError');
    expect(error as Error).toHaveProperty('errors.tokenId');
  });

  it('should require expiresAt', async () => {
    const userId = new mongoose.Types.ObjectId();

    const refreshTokenData = {
      userId,
      tokenId: 'test-token-id',
      isRevoked: false
    };

    // Attempt to create a refresh token without expiresAt
    let error;
    try {
      await RefreshToken.create(refreshTokenData);
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error as Error).toHaveProperty('name', 'ValidationError');
    expect(error as Error).toHaveProperty('errors.expiresAt');
  });

  it('should default isRevoked to false', async () => {
    const userId = new mongoose.Types.ObjectId();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const refreshTokenData = {
      userId,
      tokenId: 'test-token-id',
      expiresAt
      // isRevoked is not provided
    };

    const refreshToken = await RefreshToken.create(refreshTokenData);

    expect(refreshToken.isRevoked).toBe(false);
  });

  it('should enforce unique tokenId', async () => {
    const userId = new mongoose.Types.ObjectId();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create first token
    await RefreshToken.create({
      userId,
      tokenId: 'duplicate-token-id',
      expiresAt
    });

    // Try to create second token with same tokenId
    let error;
    try {
      await RefreshToken.create({
        userId,
        tokenId: 'duplicate-token-id',
        expiresAt
      });
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    // MongoDB duplicate key error code
    expect(error as Error).toHaveProperty('code', 11000);
  });

  it('should find a token by tokenId', async () => {
    const userId = new mongoose.Types.ObjectId();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create a token
    await RefreshToken.create({
      userId,
      tokenId: 'findable-token-id',
      expiresAt
    });

    // Find the token
    const foundToken = await RefreshToken.findOne({ tokenId: 'findable-token-id' });

    expect(foundToken).toBeDefined();
    expect(foundToken!.tokenId).toBe('findable-token-id');
  });

  it('should update a token to revoked', async () => {
    const userId = new mongoose.Types.ObjectId();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create a token
    const token = await RefreshToken.create({
      userId,
      tokenId: 'revokable-token-id',
      expiresAt
    });

    // Update to revoked
    await RefreshToken.findByIdAndUpdate(token._id, {
      isRevoked: true
    });

    // Find the token again
    const updatedToken = await RefreshToken.findById(token._id);

    expect(updatedToken).toBeDefined();
    expect(updatedToken!.isRevoked).toBe(true);
  });
});
