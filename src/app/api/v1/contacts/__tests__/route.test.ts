import { NextRequest } from "next/server";
import { GET, POST } from "../route";
import { GET as GET_BY_ID, PUT, PATCH, DELETE } from "../[id]/route";
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
        confirmed: "Confirmed",
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
        confirmed: "Pending",
        tablesChairs: true,
        generator: true,
        sourcePage: "referral",
      },
      {
        bouncer: "Bob Johnson",
        email: "bob@example.com",
        partyDate: new Date("2025-06-10"),
        partyZipCode: "67890",
        confirmed: "Pending",
        sourcePage: "google",
      },
    ]);
  });

  // Helper function to test authentication for list endpoint
  const testListAuthProtection = async () => {
    // Test without authentication
    const reqWithoutAuth = new NextRequest(`http://localhost:3000/api/v1/contacts`);
    const responseWithoutAuth = await GET(reqWithoutAuth);
    expect(responseWithoutAuth.status).toBe(401);
    const dataWithoutAuth = await responseWithoutAuth.json();
    expect(dataWithoutAuth.error).toContain("Unauthorized");

    // Test with authentication
    const options: { headers: HeadersInit } = {
      headers: {
        Authorization: `Bearer ${userToken}`,
        "X-Auth-Type": "nextauth"
      }
    };
    
    const reqWithAuth = new NextRequest(`http://localhost:3000/api/v1/contacts`, options);
    return { reqWithAuth };
  };
  
  // Helper function to test authentication for item endpoints
  const testItemAuthProtection = async (
    method: (req: NextRequest, params: { params: Promise<{ id: string }> }) => Promise<Response>,
    id: string,
    requestBody?: object
  ) => {
    // Create params object
    const params = {
      params: Promise.resolve({ id })
    };
    
    // Test without authentication
    const reqWithoutAuth = new NextRequest(`http://localhost:3000/api/v1/contacts/${id}`);
    const responseWithoutAuth = await method(reqWithoutAuth, params);
    expect(responseWithoutAuth.status).toBe(401);
    const dataWithoutAuth = await responseWithoutAuth.json();
    expect(dataWithoutAuth.error).toContain("Unauthorized");

    // Test with authentication
    const options: { headers: HeadersInit; method?: string; body?: string } = {
      headers: {
        Authorization: `Bearer ${userToken}`,
        "X-Auth-Type": "nextauth"
      }
    };
    
    if (requestBody) {
      // Determine method based on the function being tested
      if (method === PATCH) {
        options.method = 'PATCH';
      } else if (method === PUT) {
        options.method = 'PUT';
      } else if (method === DELETE) {
        options.method = 'DELETE';
      }
      options.body = JSON.stringify(requestBody);
    }
    
    const reqWithAuth = new NextRequest(`http://localhost:3000/api/v1/contacts/${id}`, options);
    return { reqWithAuth, method, params };
  };

  describe("GET /api/v1/contacts", () => {
    it("should return 401 if user is not authenticated", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/contacts");
      const response = await GET(req);
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized - No token provided");
    });

    it("should return all contacts for authenticated user", async () => {
      const { reqWithAuth } = await testListAuthProtection();
      
      const response = await GET(reqWithAuth);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.contacts).toHaveLength(3);
    });

    it("should filter contacts by date range", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/v1/contacts?startDate=2025-05-01&endDate=2025-06-30",
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
            "X-Auth-Type": "nextauth"
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
            "X-Auth-Type": "nextauth"
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

  describe("PUT /api/v1/contacts/[id]", () => {
    it("should require authentication", async () => {
      await testItemAuthProtection(PUT, "123");
    });

    it("should update a contact for authenticated user", async () => {
      // Create a contact to update
      const contact = await Contact.findOne({ email: "john@example.com" });
      if (!contact || !contact._id) {
        throw new Error("Test contact not found");
      }
      
      const { reqWithAuth, method, params } = await testItemAuthProtection(
        PUT,
        contact._id.toString(),
        {
          bouncer: "Updated John Doe",
          confirmed: "Confirmed",
        }
      );
      
      const response = await method(reqWithAuth, params);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.bouncer).toBe("Updated John Doe");
      expect(data.confirmed).toBe("Confirmed");
    });
  });

  describe("PATCH /api/v1/contacts/[id]", () => {
    it("should require authentication", async () => {
      await testItemAuthProtection(PATCH, "123");
    });

    it("should partially update a contact for authenticated user", async () => {
      // Create a contact to update
      const contact = await Contact.findOne({ email: "jane@example.com" });
      if (!contact || !contact._id) {
        throw new Error("Test contact not found");
      }
      
      const { reqWithAuth, method, params } = await testItemAuthProtection(
        PATCH,
        contact._id.toString(),
        {
          confirmed: "Called / Texted",
        }
      );
      
      const response = await method(reqWithAuth, params);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.bouncer).toBe("Jane Smith"); // Unchanged
      expect(data.confirmed).toBe("Called / Texted"); // Changed
    });
  });

  describe("DELETE /api/v1/contacts/[id]", () => {
    it("should require authentication", async () => {
      await testItemAuthProtection(DELETE, "123");
    });

    it("should delete a contact for authenticated user", async () => {
      // Create a contact to delete
      const contact = await Contact.findOne({ email: "bob@example.com" });
      if (!contact || !contact._id) {
        throw new Error("Test contact not found");
      }
      
      const { reqWithAuth, method, params } = await testItemAuthProtection(
        DELETE,
        contact._id.toString()
      );
      
      const response = await method(reqWithAuth, params);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.message).toBe("Contact deleted successfully");
      
      // Verify contact was deleted
      const deletedContact = await Contact.findById(contact?._id);
      expect(deletedContact).toBeNull();
    });
  });

  describe("POST /api/v1/contacts", () => {
    // POST endpoint should remain public - no authentication required
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
        confirmed: "Pending",
        tablesChairs: true,
        generator: true,
        popcornMachine: true,
        basketballShoot: true,
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
