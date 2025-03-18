import { NextRequest } from "next/server";
import { GET, POST } from "../route";
import * as dbHandler from "@/lib/test/db-handler";
import Product from "@/models/Product";
import User from "@/models/User";
import { withAuth } from "@/middleware/auth";

// Mock the auth middleware
jest.mock("@/middleware/auth", () => ({
  withAuth: jest.fn((req, handler) => handler(req)),
}));

beforeAll(async () => {
  // Set JWT_SECRET for tests
  process.env.JWT_SECRET = "test-secret";

  await dbHandler.connect();

  // Ensure text index is created
  await Product.createIndexes();
});
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe("Products API", () => {
  describe("GET /api/v1/products", () => {
    beforeEach(async () => {
      // Create test products
      await Product.create([
        {
          name: "Bounce House 1",
          description: "A fun bounce house for kids",
          category: "bounce-house",
          price: { base: 100, currency: "USD" },
          rentalDuration: "full-day",
          availability: "available",
          images: [{ url: "https://example.com/image1.jpg" }],
          specifications: [{ name: "Color", value: "Blue" }],
          dimensions: { length: 10, width: 10, height: 8, unit: "ft" },
          capacity: 5,
          ageRange: { min: 3, max: 12 },
          setupRequirements: {
            space: "12x12 ft",
            powerSource: true,
            surfaceType: ["grass", "concrete"],
          },
          features: ["Slide", "Basketball Hoop"],
          safetyGuidelines: "Adult supervision required",
          weatherRestrictions: ["No use in rain or high winds"],
        },
        {
          name: "Water Slide",
          description: "A fun water slide for hot days",
          category: "water-slide",
          price: { base: 150, currency: "USD" },
          rentalDuration: "full-day",
          availability: "available",
          images: [{ url: "https://example.com/image2.jpg" }],
          specifications: [{ name: "Color", value: "Blue/Red" }],
          dimensions: { length: 15, width: 8, height: 10, unit: "ft" },
          capacity: 3,
          ageRange: { min: 5, max: 15 },
          setupRequirements: {
            space: "18x10 ft",
            powerSource: true,
            surfaceType: ["grass"],
          },
          features: ["Double Slide", "Splash Pool"],
          safetyGuidelines: "Adult supervision required",
          weatherRestrictions: ["No use in cold weather"],
        },
        {
          name: "Party Tent",
          description: "A large tent for outdoor parties",
          category: "tent",
          price: { base: 80, currency: "USD" },
          rentalDuration: "full-day",
          availability: "available",
          images: [{ url: "https://example.com/image3.jpg" }],
          specifications: [{ name: "Color", value: "White" }],
          dimensions: { length: 20, width: 20, height: 8, unit: "ft" },
          capacity: 30,
          ageRange: { min: 0, max: 99 },
          setupRequirements: {
            space: "22x22 ft",
            powerSource: false,
            surfaceType: ["grass", "concrete", "asphalt"],
          },
          features: ["Waterproof", "UV Protection"],
          safetyGuidelines: "Secure properly in windy conditions",
          weatherRestrictions: ["No use in severe weather"],
        },
      ]);
    });

    it("should return all products with pagination", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/products");

      const response = await GET(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.products).toHaveLength(3);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.total).toBe(3);
    });

    it("should filter products by category", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/v1/products?category=bounce-house",
      );

      const response = await GET(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.products).toHaveLength(1);
      expect(data.products[0].category).toBe("bounce-house");
    });

    it("should search products by text", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/v1/products?search=water",
      );

      const response = await GET(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.products).toHaveLength(1);
      expect(data.products[0].name).toBe("Water Slide");
    });
  });

  describe("POST /api/v1/products", () => {
    let adminId: string;
    let userId: string;

    beforeEach(async () => {
      // Create admin user
      const admin = await User.create({
        email: "admin@example.com",
        password: "password123",
        name: "Admin User",
        role: "admin",
      });
      adminId = (admin as any)._id.toString();

      // Create regular user
      const user = await User.create({
        email: "user@example.com",
        password: "password123",
        name: "Regular User",
        role: "user",
      });
      userId = (user as any)._id.toString();
    });

    it("should return 403 if user is not admin", async () => {
      // Mock the auth middleware to return a regular user
      (withAuth as jest.Mock).mockImplementationOnce((req, handler) => {
        return handler({
          ...req,
          user: { id: userId, email: "user@example.com", role: "user" },
          json: () => Promise.resolve({ name: "Test Product" }),
        });
      });

      const req = new NextRequest("http://localhost:3000/api/v1/products", {
        method: "POST",
        body: JSON.stringify({
          name: "Test Product",
          // Other required fields...
        }),
      });

      const response = await POST(req);
      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error).toBe("Not authorized to create products");
    });

    it("should return 400 if required fields are missing", async () => {
      // Mock the auth middleware to return an admin user
      (withAuth as jest.Mock).mockImplementationOnce((req, handler) => {
        return handler({
          ...req,
          user: { id: adminId, email: "admin@example.com", role: "admin" },
          json: () => Promise.resolve({ name: "Test Product" }),
        });
      });

      const req = new NextRequest("http://localhost:3000/api/v1/products", {
        method: "POST",
        body: JSON.stringify({
          name: "Test Product",
          // Missing other required fields
        }),
      });

      const response = await POST(req);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain("Missing required fields");
    });

    it("should create a new product successfully", async () => {
      const productData = {
        name: "New Bounce House",
        description: "A brand new bounce house",
        category: "bounce-house",
        price: { base: 120, currency: "USD" },
        rentalDuration: "full-day",
        images: [{ url: "https://example.com/new-image.jpg" }],
        specifications: [{ name: "Color", value: "Green" }],
        dimensions: { length: 12, width: 12, height: 9, unit: "ft" },
        capacity: 6,
        ageRange: { min: 3, max: 12 },
        setupRequirements: {
          space: "14x14 ft",
          powerSource: true,
          surfaceType: ["grass", "concrete"],
        },
        features: ["Slide", "Climbing Wall"],
        safetyGuidelines: "Adult supervision required",
        weatherRestrictions: ["No use in rain or high winds"],
      };

      // Mock the auth middleware to return an admin user
      (withAuth as jest.Mock).mockImplementationOnce((req, handler) => {
        return handler({
          ...req,
          user: { id: adminId, email: "admin@example.com", role: "admin" },
          json: () => Promise.resolve(productData),
        });
      });

      const req = new NextRequest("http://localhost:3000/api/v1/products", {
        method: "POST",
        body: JSON.stringify(productData),
      });

      const response = await POST(req);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.name).toBe("New Bounce House");
      expect(data.slug).toBeDefined();
      expect(data.category).toBe("bounce-house");

      // Verify product was saved to database
      const product = await Product.findOne({ name: "New Bounce House" });
      expect(product).not.toBeNull();
    });
  });
});
