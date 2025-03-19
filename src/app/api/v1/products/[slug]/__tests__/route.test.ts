import { NextRequest } from "next/server";
import { GET, PUT, DELETE } from "../route";
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

describe("Single Product API", () => {
  let productSlug: string;
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
    adminId = admin._id?.toString() || "";

    // Create regular user
    const user = await User.create({
      email: "user@example.com",
      password: "password123",
      name: "Regular User",
      role: "user",
    });
    userId = user._id?.toString() || "";

    // Create test product
    const product = await Product.create({
      name: "Test Bounce House",
      description: "A test bounce house",
      category: "bounce-house",
      price: { base: 100, currency: "USD" },
      rentalDuration: "full-day",
      availability: "available",
      images: [{ url: "https://example.com/image.jpg" }],
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
    });

    productSlug = product.slug;
  });

  describe("GET /api/v1/products/[slug]", () => {
    it("should return 404 if product not found", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/v1/products/non-existent-product",
      );

      const response = await GET(req, {
        params: Promise.resolve({ slug: "non-existent-product" }),
      });
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBe("Product not found");
    });

    it("should return product if found", async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/v1/products/${productSlug}`,
      );

      const response = await GET(req, {
        params: Promise.resolve({ slug: productSlug }),
      });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.slug).toBe(productSlug);
      expect(data.name).toBe("Test Bounce House");
      expect(data.category).toBe("bounce-house");
    });
  });

  describe("PUT /api/v1/products/[slug]", () => {
    it("should return 403 if user is not admin", async () => {
      // Mock the auth middleware to return a regular user
      (withAuth as jest.Mock).mockImplementationOnce((req, handler) => {
        return handler({
          ...req,
          user: { id: userId, email: "user@example.com", role: "user" },
          json: () =>
            Promise.resolve({ price: { base: 120, currency: "USD" } }),
        });
      });

      const req = new NextRequest(
        `http://localhost:3000/api/v1/products/${productSlug}`,
        {
          method: "PUT",
          body: JSON.stringify({
            price: { base: 120, currency: "USD" },
          }),
        },
      );

      const response = await PUT(req, {
        params: Promise.resolve({ slug: productSlug }),
      });
      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error).toBe("Not authorized to update products");
    });

    it("should return 404 if product not found", async () => {
      // Mock the auth middleware to return an admin user
      (withAuth as jest.Mock).mockImplementationOnce((req, handler) => {
        return handler({
          ...req,
          user: { id: adminId, email: "admin@example.com", role: "admin" },
          json: () =>
            Promise.resolve({ price: { base: 120, currency: "USD" } }),
        });
      });

      const req = new NextRequest(
        "http://localhost:3000/api/v1/products/non-existent-product",
        {
          method: "PUT",
          body: JSON.stringify({
            price: { base: 120, currency: "USD" },
          }),
        },
      );

      const response = await PUT(req, {
        params: Promise.resolve({ slug: "non-existent-product" }),
      });
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBe("Product not found");
    });

    it("should update product if user is admin", async () => {
      const updateData = {
        price: { base: 120, currency: "USD" },
        description: "Updated description",
      };

      // Mock the auth middleware to return an admin user
      (withAuth as jest.Mock).mockImplementationOnce((req, handler) => {
        return handler({
          ...req,
          user: { id: adminId, email: "admin@example.com", role: "admin" },
          json: () => Promise.resolve(updateData),
        });
      });

      const req = new NextRequest(
        `http://localhost:3000/api/v1/products/${productSlug}`,
        {
          method: "PUT",
          body: JSON.stringify(updateData),
        },
      );

      const response = await PUT(req, {
        params: Promise.resolve({ slug: productSlug }),
      });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.price.base).toBe(120);
      expect(data.description).toBe("Updated description");

      // Verify product was updated in database
      const product = await Product.findBySlug(productSlug);
      expect(product).not.toBeNull();
      expect(product?.price.base).toBe(120);
      expect(product?.description).toBe("Updated description");
    });
  });

  describe("DELETE /api/v1/products/[slug]", () => {
    it("should return 403 if user is not admin", async () => {
      // Mock the auth middleware to return a regular user
      (withAuth as jest.Mock).mockImplementationOnce((req, handler) => {
        return handler({
          ...req,
          user: { id: userId, email: "user@example.com", role: "user" },
        });
      });

      const req = new NextRequest(
        `http://localhost:3000/api/v1/products/${productSlug}`,
        {
          method: "DELETE",
        },
      );

      const response = await DELETE(req, {
        params: Promise.resolve({ slug: productSlug }),
      });
      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error).toBe("Not authorized to delete products");
    });

    it("should return 404 if product not found", async () => {
      // Mock the auth middleware to return an admin user
      (withAuth as jest.Mock).mockImplementationOnce((req, handler) => {
        return handler({
          ...req,
          user: { id: adminId, email: "admin@example.com", role: "admin" },
        });
      });

      const req = new NextRequest(
        "http://localhost:3000/api/v1/products/non-existent-product",
        {
          method: "DELETE",
        },
      );

      const response = await DELETE(req, {
        params: Promise.resolve({ slug: "non-existent-product" }),
      });
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBe("Product not found");
    });

    it("should delete product if user is admin", async () => {
      // Mock the auth middleware to return an admin user
      (withAuth as jest.Mock).mockImplementationOnce((req, handler) => {
        return handler({
          ...req,
          user: { id: adminId, email: "admin@example.com", role: "admin" },
        });
      });

      const req = new NextRequest(
        `http://localhost:3000/api/v1/products/${productSlug}`,
        {
          method: "DELETE",
        },
      );

      const response = await DELETE(req, {
        params: Promise.resolve({ slug: productSlug }),
      });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.message).toBe("Product deleted successfully");

      // Verify product was deleted from database
      const product = await Product.findBySlug(productSlug);
      expect(product).toBeNull();
    });
  });
});
