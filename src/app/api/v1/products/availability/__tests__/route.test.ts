import { NextRequest } from "next/server";
import { GET } from "../route";
import * as dbHandler from "@/lib/test/db-handler";
import Product from "@/models/Product";
import Contact from "@/models/Contact";

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe("Product Availability API", () => {
  let productId: string;
  let productSlug: string;

  beforeEach(async () => {
    // Create test product
    const product = await Product.create({
      name: "Test Bounce House",
      description: "A fun bounce house for testing",
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
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    productId = (product as any)._id.toString();
    productSlug = product.slug;

    // Create a product in maintenance
    await Product.create({
      name: "Maintenance Bounce House",
      description: "A bounce house under maintenance",
      category: "bounce-house",
      price: { base: 100, currency: "USD" },
      rentalDuration: "full-day",
      availability: "maintenance",
      images: [{ url: "https://example.com/image2.jpg" }],
      specifications: [{ name: "Color", value: "Red" }],
      dimensions: { length: 10, width: 10, height: 8, unit: "ft" },
      capacity: 5,
      ageRange: { min: 3, max: 12 },
      setupRequirements: {
        space: "12x12 ft",
        powerSource: true,
        surfaceType: ["grass", "concrete"],
      },
      features: ["Slide"],
      safetyGuidelines: "Adult supervision required",
      weatherRestrictions: ["No use in rain or high winds"],
    });

    // Create a booking for the test product
    await Contact.create({
      bouncer: "Test Bounce House",
      email: "test@example.com",
      phone: "123-456-7890",
      partyDate: new Date("2025-04-15"),
      partyZipCode: "12345",
      message: "Birthday party",
      confirmed: "Confirmed",
      sourcePage: "website",
    });
  });

  it("should return 400 if product ID/slug is missing", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/v1/products/availability?date=2025-04-20"
    );

    const response = await GET(req);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("Product ID/slug and date are required");
  });

  it("should return 400 if date is missing", async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/v1/products/availability?productId=${productId}`
    );

    const response = await GET(req);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("Product ID/slug and date are required");
  });

  it("should return 404 if product is not found", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/v1/products/availability?productId=nonexistentid&date=2025-04-20"
    );

    const response = await GET(req);
    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data.error).toBe("Product not found");
  });

  it("should return available=true when product is available on the date", async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/v1/products/availability?productId=${productId}&date=2025-04-20`
    );

    const response = await GET(req);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.available).toBe(true);
    expect(data.product.name).toBe("Test Bounce House");
    expect(data.product.slug).toBe(productSlug);
    expect(data.product.status).toBe("available");
    expect(data.reason).toBeUndefined();
  });

  it("should return available=true when using slug instead of productId", async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/v1/products/availability?slug=${productSlug}&date=2025-04-20`
    );

    const response = await GET(req);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.available).toBe(true);
    expect(data.product.name).toBe("Test Bounce House");
  });

  it("should return available=false when product has a confirmed booking on the date", async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/v1/products/availability?productId=${productId}&date=2025-04-15`
    );

    const response = await GET(req);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.available).toBe(false);
    expect(data.product.name).toBe("Test Bounce House");
    expect(data.reason).toBe("Product is already booked for this date");
  });

  it("should return available=false when product's general status is not available", async () => {
    // Find the maintenance product
    const maintenanceProduct = await Product.findOne({ name: "Maintenance Bounce House" });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const maintenanceProductId = (maintenanceProduct as any)._id.toString();

    const req = new NextRequest(
      `http://localhost:3000/api/v1/products/availability?productId=${maintenanceProductId}&date=2025-04-20`
    );

    const response = await GET(req);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.available).toBe(false);
    expect(data.product.name).toBe("Maintenance Bounce House");
    expect(data.product.status).toBe("maintenance");
    expect(data.reason).toBe("Product is currently maintenance");
  });

  it("should handle invalid date format", async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/v1/products/availability?productId=${productId}&date=invalid-date`
    );

    const response = await GET(req);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("Invalid date format");
  });
});
