import { NextRequest } from "next/server";
import { GET, POST } from "../route";
import * as dbHandler from "@/lib/test/db-handler";
import Contact from "@/models/Contact";
import User from "@/models/User";
import jwt from "jsonwebtoken";

// Mock nodemailer and twilio
jest.mock("nodemailer");
jest.mock("twilio");

// Set environment variables for tests
process.env.EMAIL = "test@example.com";
process.env.PASSWORD = "test-password";
process.env.TWILIO_ACCOUNT_SID = "test-sid";
process.env.TWILIO_AUTH_TOKEN = "test-token";
process.env.TWILIO_PHONE_NUMBER = "+15555555555";
process.env.USER_PHONE_NUMBER = "+15555555556";

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe("Contacts API", () => {
  let userToken: string;

  beforeEach(async () => {
    // Create regular user
    const user = await User.create({
      email: "user@example.com",
      password: "password123",
      name: "Regular User",
      role: "user",
    });

    userToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: "1d" },
    );

    // Create test contacts
    await Contact.create([
      {
        bouncer: "John Doe",
        email: "john@example.com",
        phone: "123-456-7890",
        partyDate: new Date("2025-04-15"),
        partyZipCode: "12345",
        message: "Birthday party",
        confirmed: true,
        tablesChairs: true,
        generator: false,
        sourcePage: "website",
      },
      {
        bouncer: "Jane Smith",
        email: "jane@example.com",
        phone: "987-654-3210",
        partyDate: new Date("2025-05-20"),
        partyZipCode: "54321",
        message: "Corporate event",
        confirmed: false,
        tablesChairs: true,
        generator: true,
        sourcePage: "referral",
      },
      {
        bouncer: "Bob Johnson",
        email: "bob@example.com",
        partyDate: new Date("2025-06-10"),
        partyZipCode: "67890",
        confirmed: false,
        sourcePage: "google",
      },
    ]);
  });

  describe("GET /api/v1/contacts", () => {
    it("should return 401 if user is not authenticated", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/contacts");

      const response = await GET(req);
      expect(response.status).toBe(401);

      const data = await response.json();
      // Accept either error message
      expect([
        "Unauthorized - No token provided",
        "Unauthorized - Invalid token",
      ]).toContain(data.error);
    });

    it("should return all contacts with pagination for authenticated user", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/contacts", {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      const response = await GET(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.contacts).toHaveLength(3);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.total).toBe(3);
    });

    it("should filter contacts by date range", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/v1/contacts?startDate=2025-05-01&endDate=2025-06-30",
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        },
      );

      const response = await GET(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.contacts).toHaveLength(2);
      expect(data.contacts[0].bouncer).toBe("Jane Smith");
      expect(data.contacts[1].bouncer).toBe("Bob Johnson");
    });

    it("should filter contacts by confirmation status", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/v1/contacts?confirmed=true",
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        },
      );

      const response = await GET(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.contacts).toHaveLength(1);
      expect(data.contacts[0].bouncer).toBe("John Doe");
    });
  });

  describe("POST /api/v1/contacts", () => {
    it("should return 400 if required fields are missing", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/contacts", {
        method: "POST",
        body: JSON.stringify({
          bouncer: "Test User",
          // Missing email, partyDate, partyZipCode, sourcePage
        }),
      });

      const response = await POST(req);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain("Missing required fields");
    });

    it("should create a new contact successfully", async () => {
      const contactData = {
        bouncer: "New Contact",
        email: "new@example.com",
        phone: "555-123-4567",
        partyDate: "2025-07-15",
        partyZipCode: "78901",
        message: "New party request",
        confirmed: false,
        tablesChairs: true,
        generator: true,
        popcornMachine: true,
        sourcePage: "instagram",
      };

      const req = new NextRequest("http://localhost:3000/api/v1/contacts", {
        method: "POST",
        body: JSON.stringify(contactData),
      });

      const response = await POST(req);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.bouncer).toBe("New Contact");
      expect(data.email).toBe("new@example.com");

      // Verify contact was saved to database
      const contact = await Contact.findOne({ email: "new@example.com" });
      expect(contact).not.toBeNull();
      expect(contact?.bouncer).toBe("New Contact");
    });
  });
});
