import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Visitor from "../Visitor";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Visitor Model", () => {
  it("should create a new visitor successfully", async () => {
    const visitorData = {
      visitorId: "test-fingerprint-123",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      device: "Desktop",
      referrer: "https://example.com",
      screen: {
        width: 1920,
        height: 1080,
        colorDepth: 24,
      },
      browser: {
        name: "Chrome",
        version: "91.0.4472.124",
        engine: "Blink",
      },
      os: {
        name: "Windows",
        version: "10",
      },
      timezone: {
        name: "America/Chicago",
        offset: -6,
      },
      language: "en-US",
    };

    const visitor = await Visitor.create(visitorData);

    expect(visitor._id).toBeDefined();
    expect(visitor.visitorId).toBe(visitorData.visitorId);
    expect(visitor.device).toBe(visitorData.device);
    expect(visitor.visitCount).toBe(1); // Default value
    expect(visitor.visitedPages).toHaveLength(0);
    expect(visitor.firstVisit).toBeInstanceOf(Date);
    expect(visitor.lastVisit).toBeInstanceOf(Date);
  });

  it("should require a visitorId", async () => {
    const visitorWithoutId = {
      userAgent: "Mozilla/5.0",
      device: "Desktop",
    };

    await expect(Visitor.create(visitorWithoutId)).rejects.toThrow();
  });

  it("should update an existing visitor", async () => {
    // Create initial visitor
    const visitor = await Visitor.create({
      visitorId: "update-test-123",
      device: "Mobile",
      userAgent: "Test User Agent",
    });

    // Update visitor
    visitor.visitCount = 2;
    visitor.lastVisit = new Date();
    visitor.visitedPages.push({
      url: "/test-page",
      timestamp: new Date(),
    });

    await visitor.save();

    // Retrieve updated visitor
    const updatedVisitor = await Visitor.findOne({
      visitorId: "update-test-123",
    });

    expect(updatedVisitor).toBeDefined();
    expect(updatedVisitor!.visitCount).toBe(2);
    expect(updatedVisitor!.visitedPages).toHaveLength(1);
    expect(updatedVisitor!.visitedPages[0].url).toBe("/test-page");
  });

  it("should enforce unique visitorId", async () => {
    // Create first visitor
    await Visitor.create({
      visitorId: "unique-test-123",
      device: "Desktop",
      userAgent: "Test User Agent",
    });

    // Try to create another visitor with the same ID
    const duplicateVisitor = {
      visitorId: "unique-test-123",
      device: "Mobile",
      userAgent: "Different User Agent",
    };

    await expect(Visitor.create(duplicateVisitor)).rejects.toThrow();
  });

  it("should exclude visitors who have visited admin pages", async () => {
    // Clear all visitors before this test
    await Visitor.deleteMany({});

    // Create regular visitor
    await Visitor.create({
      visitorId: "regular-visitor-123",
      device: "Desktop",
      userAgent: "Regular User Agent",
      visitedPages: [
        {
          url: "/products",
          timestamp: new Date(),
        },
        {
          url: "/contact",
          timestamp: new Date(),
        },
      ],
    });

    // Create admin visitor
    await Visitor.create({
      visitorId: "admin-visitor-456",
      device: "Desktop",
      userAgent: "Admin User Agent",
      visitedPages: [
        {
          url: "/products",
          timestamp: new Date(),
        },
        {
          url: "/admin/dashboard",
          timestamp: new Date(),
        },
      ],
    });

    // Create visitor with mixed pages
    await Visitor.create({
      visitorId: "mixed-visitor-789",
      device: "Desktop",
      userAgent: "Mixed User Agent",
      visitedPages: [
        {
          url: "/products",
          timestamp: new Date(),
        },
        {
          url: "/admin/visitors",
          timestamp: new Date(),
        },
        {
          url: "/contact",
          timestamp: new Date(),
        },
      ],
    });

    // Query to exclude admin visitors (same query as used in the API)
    const nonAdminVisitors = await Visitor.find({
      visitedPages: {
        $not: {
          $elemMatch: {
            url: /^\/admin/,
          },
        },
      },
    });

    // Should only return the regular visitor
    expect(nonAdminVisitors.length).toBe(1);
    expect(nonAdminVisitors[0].visitorId).toBe("regular-visitor-123");

    // Query to find admin visitors
    const adminVisitors = await Visitor.find({
      "visitedPages.url": /^\/admin/,
    });

    // Should return both admin and mixed visitors
    expect(adminVisitors.length).toBe(2);
    expect(adminVisitors.map((v) => v.visitorId).sort()).toEqual(
      ["admin-visitor-456", "mixed-visitor-789"].sort(),
    );
  });
});
