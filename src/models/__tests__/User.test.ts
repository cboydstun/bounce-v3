import mongoose from "mongoose";
import User from "../User";
import { MongoMemoryServer } from "mongodb-memory-server";

describe("User Model", () => {
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

  it("should create a new user with default role", async () => {
    const userData = {
      email: "test@example.com",
      password: "password123",
      name: "Test User",
    };

    const user = await User.create(userData);

    // Check that the user was created correctly
    expect(user).toBeDefined();
    expect(user.email).toBe("test@example.com");
    expect(user.name).toBe("Test User");
    // Default role should be "customer"
    expect(user.role).toBe("customer");
  });

  it("should create a user with admin role", async () => {
    const userData = {
      email: "admin@example.com",
      password: "password123",
      name: "Admin User",
      role: "admin",
    };

    const user = await User.create(userData);

    // Check that the user was created correctly with admin role
    expect(user).toBeDefined();
    expect(user.email).toBe("admin@example.com");
    expect(user.role).toBe("admin");
  });

  it("should create a user with user role", async () => {
    const userData = {
      email: "regularuser@example.com",
      password: "password123",
      name: "Regular User",
      role: "user",
    };

    const user = await User.create(userData);

    // Check that the user was created correctly with user role
    expect(user).toBeDefined();
    expect(user.email).toBe("regularuser@example.com");
    expect(user.role).toBe("user");
  });

  it("should reject invalid role values", async () => {
    const userData = {
      email: "invalid@example.com",
      password: "password123",
      name: "Invalid Role User",
      role: "superadmin", // Invalid role
    };

    // Attempt to create a user with invalid role
    let error;
    try {
      await User.create(userData);
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect((error as Error).name).toBe("ValidationError");
    expect(error as Error).toHaveProperty("errors.role");
  });

  it("should require email", async () => {
    const userData = {
      password: "password123",
      name: "No Email User",
    };

    // Attempt to create a user without email
    let error;
    try {
      await User.create(userData);
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect((error as Error).name).toBe("ValidationError");
    expect(error as Error).toHaveProperty("errors.email");
  });

  it("should require password", async () => {
    const userData = {
      email: "nopassword@example.com",
      name: "No Password User",
    };

    // Attempt to create a user without password
    let error;
    try {
      await User.create(userData);
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect((error as Error).name).toBe("ValidationError");
    expect(error as Error).toHaveProperty("errors.password");
  });

  it("should enforce unique email", async () => {
    // Create first user
    await User.create({
      email: "duplicate@example.com",
      password: "password123",
    });

    // Try to create second user with same email
    let error;
    try {
      await User.create({
        email: "duplicate@example.com",
        password: "password456",
      });
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    // MongoDB duplicate key error code
    expect(error as Error).toHaveProperty("code", 11000);
  });

  it("should hash password before saving", async () => {
    const userData = {
      email: "hashtest@example.com",
      password: "password123",
    };

    const user = await User.create(userData);

    // Password should be hashed, not stored as plaintext
    const password = user.password || "";
    expect(password).not.toBe("password123");
    expect(password.length).toBeGreaterThan(20); // Hashed passwords are longer
  });

  it("should correctly compare passwords", async () => {
    const userData = {
      email: "compare@example.com",
      password: "password123",
    };

    const user = await User.create(userData);

    // Test comparePassword method
    const correctPassword = await user.comparePassword("password123");
    const incorrectPassword = await user.comparePassword("wrongpassword");

    expect(correctPassword).toBe(true);
    expect(incorrectPassword).toBe(false);
  });

  it("should update user role", async () => {
    // Create user with default role
    const user = await User.create({
      email: "roleupdate@example.com",
      password: "password123",
    });

    expect(user.role).toBe("customer");

    // Update to admin role
    await User.findByIdAndUpdate(user._id, {
      role: "admin",
    });

    // Find the user again
    const updatedUser = await User.findById(user._id);

    expect(updatedUser).toBeDefined();
    expect(updatedUser!.role).toBe("admin");
  });

  it("should reject update with invalid role", async () => {
    // Create user
    const user = await User.create({
      email: "invalidroleupdate@example.com",
      password: "password123",
    });

    // Try to update with invalid role
    let error;
    try {
      await User.findByIdAndUpdate(
        user._id,
        { role: "invalidrole" },
        { runValidators: true },
      );
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect((error as Error).name).toBe("ValidationError");
    expect(error as Error).toHaveProperty("errors.role");
  });
});
