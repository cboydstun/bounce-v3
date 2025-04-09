import { NextRequest } from "next/server";
import { GET, POST } from "../route";
import * as dbHandler from "@/lib/test/db-handler";
import PartyPackage from "@/models/PartyPackage";
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
  await PartyPackage.createIndexes();
});
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe("PartyPackages API", () => {
  describe("GET /api/v1/partypackages/[slug]", () => {
    beforeEach(async () => {
      // Create test party packages
      await PartyPackage.create([
        {
          id: "water-fun-package",
          name: "Water Fun Package",
          description: "A complete water party package",
          items: [
            { id: "water-slide-1", name: "Water Slide", quantity: 1 },
            { id: "pool-1", name: "Splash Pool", quantity: 1 },
            { id: "tables-chairs-1", name: "Tables and Chairs", quantity: 2 },
          ],
          totalRetailPrice: 450,
          packagePrice: 350,
          savings: 100,
          savingsPercentage: 22,
          recommendedPartySize: { min: 10, max: 25 },
          ageRange: { min: 5, max: 12 },
          duration: "full-day",
          spaceRequired: "30x20 feet minimum",
          powerRequired: true,
          seasonalRestrictions: "Temperature must be above 75°F",
        },
        {
          id: "bounce-adventure-package",
          name: "Bounce Adventure Package",
          description: "The ultimate bounce house adventure",
          items: [
            { id: "bounce-house-1", name: "Castle Bounce House", quantity: 1 },
            { id: "obstacle-course-1", name: "Obstacle Course", quantity: 1 },
            { id: "tables-chairs-1", name: "Tables and Chairs", quantity: 3 },
          ],
          totalRetailPrice: 550,
          packagePrice: 425,
          savings: 125,
          savingsPercentage: 23,
          recommendedPartySize: { min: 15, max: 30 },
          ageRange: { min: 4, max: 14 },
          duration: "full-day",
          spaceRequired: "40x30 feet minimum",
          powerRequired: true,
        },
      ]);
    });

    it("should return a party package by slug", async () => {
      // Import the GET function from the slug route
      const { GET } = require("../[slug]/route");

      const req = new NextRequest(
        "http://localhost:3000/api/v1/partypackages/water-fun-package",
      );
      // Make sure the slug field is set for testing
      await PartyPackage.updateOne(
        { id: "water-fun-package" },
        { $set: { slug: "water-fun-package" } },
      );

      const params = Promise.resolve({ slug: "water-fun-package" });

      const response = await GET(req, { params });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.name).toBe("Water Fun Package");
      expect(data.id).toBe("water-fun-package");
    });

    it("should return 404 if party package not found", async () => {
      // Import the GET function from the slug route
      const { GET } = require("../[slug]/route");

      const req = new NextRequest(
        "http://localhost:3000/api/v1/partypackages/non-existent-package",
      );
      const params = Promise.resolve({ slug: "non-existent-package" });

      const response = await GET(req, { params });
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBe("Party package not found");
    });
  });

  describe("GET /api/v1/partypackages", () => {
    beforeEach(async () => {
      // Create test party packages
      await PartyPackage.create([
        {
          id: "water-fun-package",
          name: "Water Fun Package",
          description: "A complete water party package",
          items: [
            { id: "water-slide-1", name: "Water Slide", quantity: 1 },
            { id: "pool-1", name: "Splash Pool", quantity: 1 },
            { id: "tables-chairs-1", name: "Tables and Chairs", quantity: 2 },
          ],
          totalRetailPrice: 450,
          packagePrice: 350,
          savings: 100,
          savingsPercentage: 22,
          recommendedPartySize: { min: 10, max: 25 },
          ageRange: { min: 5, max: 12 },
          duration: "full-day",
          spaceRequired: "30x20 feet minimum",
          powerRequired: true,
          seasonalRestrictions: "Temperature must be above 75°F",
        },
        {
          id: "bounce-adventure-package",
          name: "Bounce Adventure Package",
          description: "The ultimate bounce house adventure",
          items: [
            { id: "bounce-house-1", name: "Castle Bounce House", quantity: 1 },
            { id: "obstacle-course-1", name: "Obstacle Course", quantity: 1 },
            { id: "tables-chairs-1", name: "Tables and Chairs", quantity: 3 },
          ],
          totalRetailPrice: 550,
          packagePrice: 425,
          savings: 125,
          savingsPercentage: 23,
          recommendedPartySize: { min: 15, max: 30 },
          ageRange: { min: 4, max: 14 },
          duration: "full-day",
          spaceRequired: "40x30 feet minimum",
          powerRequired: true,
        },
      ]);
    });

    it("should return all party packages", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/partypackages");

      const response = await GET(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.packages).toHaveLength(2);
      expect(data.total).toBe(2);
    });

    it("should search party packages by text", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/v1/partypackages?search=water",
      );

      const response = await GET(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.packages).toHaveLength(1);
      expect(data.packages[0].name).toBe("Water Fun Package");
    });
  });

  describe("POST /api/v1/partypackages", () => {
    let adminId: string;

    beforeEach(async () => {
      // Create admin user
      const admin = await User.create({
        email: "admin@example.com",
        password: "password123",
        name: "Admin User",
        role: "admin",
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      adminId = (admin as any)._id.toString();
    });

    it("should return 401 if user is not authenticated", async () => {
      // Mock the auth middleware to return no user
      (withAuth as jest.Mock).mockImplementationOnce((req, handler) => {
        return handler({
          ...req,
          user: null,
          json: () => Promise.resolve({ name: "Test Package" }),
        });
      });

      const req = new NextRequest(
        "http://localhost:3000/api/v1/partypackages",
        {
          method: "POST",
          body: JSON.stringify({
            name: "Test Package",
            // Other required fields...
          }),
        },
      );

      const response = await POST(req);
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toBe("Unauthorized - Not authenticated");
    });

    it("should create a new party package successfully", async () => {
      const packageData = {
        id: "premium-party-package",
        name: "Premium Party Package",
        description: "Our most luxurious party package",
        items: [
          {
            id: "bounce-house-deluxe",
            name: "Deluxe Bounce House",
            quantity: 1,
          },
          {
            id: "water-slide-premium",
            name: "Premium Water Slide",
            quantity: 1,
          },
          { id: "cotton-candy", name: "Cotton Candy Machine", quantity: 1 },
          {
            id: "tables-chairs-premium",
            name: "Premium Tables and Chairs",
            quantity: 5,
          },
        ],
        totalRetailPrice: 750,
        packagePrice: 550,
        savings: 200,
        savingsPercentage: 27,
        recommendedPartySize: { min: 20, max: 40 },
        ageRange: { min: 3, max: 16 },
        duration: "full-day",
        spaceRequired: "50x40 feet minimum",
        powerRequired: true,
        seasonalRestrictions: "Best for summer events",
      };

      // Mock the auth middleware to return an admin user
      (withAuth as jest.Mock).mockImplementationOnce((req, handler) => {
        return handler({
          ...req,
          user: { id: adminId, email: "admin@example.com", role: "admin" },
          json: () => Promise.resolve(packageData),
        });
      });

      const req = new NextRequest(
        "http://localhost:3000/api/v1/partypackages",
        {
          method: "POST",
          body: JSON.stringify(packageData),
        },
      );

      const response = await POST(req);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.name).toBe("Premium Party Package");
      expect(data.id).toBe("premium-party-package");

      // Verify package was saved to database
      const partyPackage = await PartyPackage.findOne({
        id: "premium-party-package",
      });
      expect(partyPackage).not.toBeNull();
    });
  });
});
