import mongoose from "mongoose";
import Visitor from "../Visitor";

describe("Visitor Model", () => {
  beforeAll(async () => {
    // Connect to a test database
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/test";
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    // Disconnect after tests
    await mongoose.connection.close();
  });

  it("should validate with booking_submitted interaction type", async () => {
    const visitorData = {
      visitorId: "test-visitor-" + Date.now(),
      userAgent: "test-agent",
      device: "Desktop",
      interactions: [
        {
          type: "booking_submitted",
          page: "/test-page",
          timestamp: new Date(),
        },
      ],
    };

    const visitor = new Visitor(visitorData);
    const validationError = visitor.validateSync();

    expect(validationError).toBeUndefined();
  });
});
