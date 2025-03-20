import { NextRequest } from "next/server";
import { GET, DELETE } from "../route";
import dbConnect from "@/lib/db/mongoose";
import Visitor from "@/models/Visitor";

// Mock the database connection
jest.mock("@/lib/db/mongoose", () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(true),
}));

// Mock the Visitor model
jest.mock("@/models/Visitor", () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));

describe("Visitor API - Single Visitor Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/v1/visitors/[id]", () => {
    it("should return a visitor when found", async () => {
      // Mock data
      const mockVisitor = {
        _id: "visitor-id-123",
        visitorId: "fingerprint-123",
        visitCount: 5,
        firstVisit: new Date("2025-01-01"),
        lastVisit: new Date("2025-03-15"),
      };

      // Mock implementation
      (Visitor.findById as jest.Mock).mockResolvedValue(mockVisitor);

      // Create request
      const req = new NextRequest(
        "http://localhost:3000/api/v1/visitors/visitor-id-123",
      );

      // Call the handler
      const response = await GET(req, { params: { id: "visitor-id-123" } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.visitor).toEqual(mockVisitor);

      // Verify mocks were called correctly
      expect(dbConnect).toHaveBeenCalled();
      expect(Visitor.findById).toHaveBeenCalledWith("visitor-id-123");
    });

    it("should return 404 when visitor is not found", async () => {
      // Mock implementation
      (Visitor.findById as jest.Mock).mockResolvedValue(null);

      // Create request
      const req = new NextRequest(
        "http://localhost:3000/api/v1/visitors/non-existent-id",
      );

      // Call the handler
      const response = await GET(req, { params: { id: "non-existent-id" } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Visitor not found");

      // Verify mocks were called correctly
      expect(dbConnect).toHaveBeenCalled();
      expect(Visitor.findById).toHaveBeenCalledWith("non-existent-id");
    });
  });

  describe("DELETE /api/v1/visitors/[id]", () => {
    it("should delete a visitor when found", async () => {
      // Mock data
      const mockVisitor = {
        _id: "visitor-id-123",
        visitorId: "fingerprint-123",
      };

      // Mock implementation
      (Visitor.findByIdAndDelete as jest.Mock).mockResolvedValue(mockVisitor);

      // Create request
      const req = new NextRequest(
        "http://localhost:3000/api/v1/visitors/visitor-id-123",
        {
          method: "DELETE",
        },
      );

      // Call the handler
      const response = await DELETE(req, { params: { id: "visitor-id-123" } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Visitor deleted successfully");

      // Verify mocks were called correctly
      expect(dbConnect).toHaveBeenCalled();
      expect(Visitor.findByIdAndDelete).toHaveBeenCalledWith("visitor-id-123");
    });

    it("should return 404 when trying to delete a non-existent visitor", async () => {
      // Mock implementation
      (Visitor.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      // Create request
      const req = new NextRequest(
        "http://localhost:3000/api/v1/visitors/non-existent-id",
        {
          method: "DELETE",
        },
      );

      // Call the handler
      const response = await DELETE(req, { params: { id: "non-existent-id" } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Visitor not found");

      // Verify mocks were called correctly
      expect(dbConnect).toHaveBeenCalled();
      expect(Visitor.findByIdAndDelete).toHaveBeenCalledWith("non-existent-id");
    });
  });
});
