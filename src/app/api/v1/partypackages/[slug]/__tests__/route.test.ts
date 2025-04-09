import { NextRequest } from "next/server";
import { GET } from "../route";
import * as dbHandler from "@/lib/test/db-handler";
import PartyPackage from "@/models/PartyPackage";

beforeAll(async () => {
  await dbHandler.connect();
  await PartyPackage.createIndexes();
});
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

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
