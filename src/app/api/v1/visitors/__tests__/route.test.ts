import { NextRequest } from "next/server";
import { GET, POST } from "../route";
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
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

describe("Visitors API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/v1/visitors", () => {
    it("should return visitors with pagination", async () => {
      // Mock data
      const mockVisitors = [
        { _id: "1", visitorId: "visitor1", visitCount: 1 },
        { _id: "2", visitorId: "visitor2", visitCount: 2 },
      ];

      // Mock implementation
      (Visitor.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockVisitors),
          }),
        }),
      });

      (Visitor.countDocuments as jest.Mock).mockResolvedValue(10);

      // Create request
      const req = new NextRequest(
        "http://localhost:3000/api/v1/visitors?page=1&limit=2",
      );

      // Call the handler
      const response = await GET(req);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.visitors).toEqual(mockVisitors);
      expect(data.pagination).toEqual({
        total: 10,
        page: 1,
        limit: 2,
        pages: 5,
      });

      // Verify mocks were called correctly
      expect(dbConnect).toHaveBeenCalled();
      expect(Visitor.find).toHaveBeenCalled();
      expect(Visitor.countDocuments).toHaveBeenCalled();
    });
  });

  describe("POST /api/v1/visitors", () => {
    it("should create a new visitor when visitor does not exist", async () => {
      // Mock data
      const mockVisitorData = {
        visitorId: "new-visitor-123",
        currentPage: "/home",
        referrer: "https://google.com",
        browser: { name: "Chrome", version: "91" },
      };

      const mockCreatedVisitor = {
        _id: "new-id",
        visitorId: "new-visitor-123",
        visitCount: 1,
      };

      // Mock implementation
      (Visitor.findOne as jest.Mock).mockResolvedValue(null);
      (Visitor.create as jest.Mock).mockResolvedValue(mockCreatedVisitor);

      // Create request
      const req = new NextRequest("http://localhost:3000/api/v1/visitors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "test-user-agent",
        },
        body: JSON.stringify(mockVisitorData),
      });

      // Call the handler
      const response = await POST(req);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.visitorId).toBe(mockVisitorData.visitorId);

      // Verify mocks were called correctly
      expect(dbConnect).toHaveBeenCalled();
      expect(Visitor.findOne).toHaveBeenCalledWith({
        visitorId: mockVisitorData.visitorId,
      });
      expect(Visitor.create).toHaveBeenCalled();
    });

    it("should update an existing visitor when visitor exists", async () => {
      // Mock data
      const mockVisitorData = {
        visitorId: "existing-visitor-123",
        currentPage: "/about",
        referrer: "https://example.com",
      };

      const mockExistingVisitor = {
        _id: "existing-id",
        visitorId: "existing-visitor-123",
        visitCount: 1,
        lastVisit: new Date("2025-01-01"),
        visitedPages: [],
        save: jest.fn().mockResolvedValue(true),
      };

      // Mock implementation
      (Visitor.findOne as jest.Mock).mockResolvedValue(mockExistingVisitor);

      // Create request
      const req = new NextRequest("http://localhost:3000/api/v1/visitors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "test-user-agent",
        },
        body: JSON.stringify(mockVisitorData),
      });

      // Call the handler
      const response = await POST(req);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.visitorId).toBe(mockVisitorData.visitorId);

      // Verify mocks were called correctly
      expect(dbConnect).toHaveBeenCalled();
      expect(Visitor.findOne).toHaveBeenCalledWith({
        visitorId: mockVisitorData.visitorId,
      });
      expect(mockExistingVisitor.save).toHaveBeenCalled();
      expect(mockExistingVisitor.visitCount).toBe(2); // Should be incremented
      expect(mockExistingVisitor.visitedPages.length).toBe(1); // Should have added a page
    });
  });
});
