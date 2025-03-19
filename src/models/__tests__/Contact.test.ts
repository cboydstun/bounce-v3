import Contact from "../Contact";
import * as dbHandler from "../../lib/test/db-handler";

// Connect to a test database before running any tests
beforeAll(async () => await dbHandler.connect());

// Clear all test data after every test
afterEach(async () => await dbHandler.clearDatabase());

// Close database connection after all tests
afterAll(async () => await dbHandler.closeDatabase());

describe("Contact Model", () => {
  it("should create a valid contact", async () => {
    const contactData = {
      bouncer: "Test Bouncer",
      email: "test@example.com",
      phone: "123-456-7890",
      partyDate: new Date("2025-05-15"),
      partyZipCode: "12345",
      message: "Test message",
      sourcePage: "website",
    };

    const contact = await Contact.create(contactData);
    expect(contact._id).toBeDefined();
    expect(contact.bouncer).toBe("Test Bouncer");
    expect(contact.email).toBe("test@example.com");
    expect(contact.confirmed).toBe(false); // Default value
  });

  it("should fail validation if required fields are missing", async () => {
    const invalidContact = {
      bouncer: "Test Bouncer",
      // Missing email
      partyDate: new Date("2025-05-15"),
      // Missing partyZipCode
      sourcePage: "website",
    };

    await expect(Contact.create(invalidContact)).rejects.toThrow();
  });

  it("should fail validation with invalid email format", async () => {
    const invalidContact = {
      bouncer: "Test Bouncer",
      email: "invalid-email", // Invalid email format
      partyDate: new Date("2025-05-15"),
      partyZipCode: "12345",
      sourcePage: "website",
    };

    await expect(Contact.create(invalidContact)).rejects.toThrow(/valid email/);
  });

  it("should fail validation with invalid phone format", async () => {
    const invalidContact = {
      bouncer: "Test Bouncer",
      email: "test@example.com",
      phone: "123", // Too short for phone regex
      partyDate: new Date("2025-05-15"),
      partyZipCode: "12345",
      sourcePage: "website",
    };

    await expect(Contact.create(invalidContact)).rejects.toThrow(/valid phone/);
  });

  describe("Static Methods", () => {
    beforeEach(async () => {
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
          sourcePage: "website",
        },
        {
          bouncer: "Jane Smith",
          email: "jane@example.com",
          phone: "987-654-3210",
          partyDate: new Date("2025-05-20"),
          partyZipCode: "54321",
          message: "Corporate event",
          sourcePage: "referral",
        },
        {
          bouncer: "Bob Johnson",
          email: "bob@example.com",
          partyDate: new Date("2025-06-10"),
          partyZipCode: "67890",
          sourcePage: "google",
        },
        {
          bouncer: "Alice Brown",
          email: "alice@example.com",
          partyDate: new Date("2025-05-25"),
          partyZipCode: "13579",
          sourcePage: "instagram",
        },
      ]);
    });

    it("should find contacts by email", async () => {
      const contacts = await Contact.findByEmail("jane@example.com");
      expect(contacts).toHaveLength(1);
      expect(contacts[0].bouncer).toBe("Jane Smith");
    });

    it("should find contacts by party date", async () => {
      const contacts = await Contact.findByPartyDate("2025-05-20");
      expect(contacts).toHaveLength(1);
      expect(contacts[0].bouncer).toBe("Jane Smith");
    });

    it("should find contacts by date range", async () => {
      const contacts = await Contact.findByDateRange(
        "2025-05-01",
        "2025-05-31",
      );
      expect(contacts).toHaveLength(2);
      expect(contacts.map((c) => c.bouncer)).toContain("Jane Smith");
      expect(contacts.map((c) => c.bouncer)).toContain("Alice Brown");
    });
  });
});
