import { NextRequest } from "next/server";
import { GET, POST } from "../route";
import * as dbHandler from "@/lib/test/db-handler";
import Blog from "@/models/Blog";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import { Document } from "mongoose";
import { AuthRequest } from "@/middleware/auth";

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe("Blogs API", () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let adminToken: string; // Declared but only used for token generation
  let userToken: string;
  let userId: string;

  beforeEach(async () => {
    // Create admin user
    const admin = (await User.create({
      email: "admin@example.com",
      password: "password123",
      name: "Admin User",
      role: "admin",
    })) as Document & {
      _id: { toString(): string };
      email: string;
      role: string;
    };

    // Create regular user
    const user = (await User.create({
      email: "user@example.com",
      password: "password123",
      name: "Regular User",
      role: "user",
    })) as Document & {
      _id: { toString(): string };
      email: string;
      role: string;
    };

    userId = user._id.toString();

    // Generate auth tokens
    adminToken = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: "1d" },
    );

    userToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: "1d" },
    );

    // Create test blogs
    await Blog.create([
      {
        title: "Published Blog 1",
        slug: "published-blog-1",
        author: user._id,
        introduction: "Introduction for blog 1",
        body: "Body content for blog 1",
        conclusion: "Conclusion for blog 1",
        categories: ["tech", "news"],
        tags: ["javascript", "react"],
        status: "published",
        publishDate: "2025-01-15T00:00:00.000Z",
        meta: { views: 100, likes: 20, shares: 5 },
      },
      {
        title: "Draft Blog",
        slug: "draft-blog",
        author: user._id,
        introduction: "Introduction for draft blog",
        body: "Body content for draft blog",
        conclusion: "Conclusion for draft blog",
        categories: ["tech"],
        tags: ["typescript"],
        status: "draft",
      },
      {
        title: "Published Blog 2",
        slug: "published-blog-2",
        author: user._id,
        introduction: "Introduction for blog 2",
        body: "Body content for blog 2",
        conclusion: "Conclusion for blog 2",
        categories: ["lifestyle"],
        tags: ["health", "fitness"],
        status: "published",
        publishDate: "2025-02-20T00:00:00.000Z",
        meta: { views: 50, likes: 10, shares: 2 },
      },
    ]);
  });

  describe("GET /api/v1/blogs", () => {
    it("should return only published blogs by default", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/blogs");

      const response = await GET(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.blogs).toHaveLength(2);
      expect(data.blogs[0].status).toBe("published");
      expect(data.blogs[1].status).toBe("published");
    });

    it("should filter blogs by category", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/v1/blogs?category=tech",
      );

      const response = await GET(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.blogs).toHaveLength(1);
      expect(data.blogs[0].title).toBe("Published Blog 1");
    });

    it("should filter blogs by tag", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/v1/blogs?tag=health",
      );

      const response = await GET(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.blogs).toHaveLength(1);
      expect(data.blogs[0].title).toBe("Published Blog 2");
    });

    it("should search blogs by text", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/v1/blogs?search=blog 1",
      );

      const response = await GET(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.blogs).toHaveLength(1);
      expect(data.blogs[0].title).toBe("Published Blog 1");
    });
  });

  describe("POST /api/v1/blogs", () => {
    it("should return 401 if user is not authenticated", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/blogs", {
        method: "POST",
        // No Authorization header
        body: JSON.stringify({
          title: "Test Blog",
          introduction: "Test introduction",
          body: "Test body",
          conclusion: "Test conclusion",
        }),
      });

      const response = await POST(req);
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toBe("Unauthorized - Not authenticated");
    });

    it("should return 400 if required fields are missing", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/blogs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          title: "Test Blog",
          // Missing required fields
        }),
      });

      const response = await POST(req);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain("Missing required fields");
    });

    it("should create a new blog post", async () => {
      const blogData = {
        title: "New Test Blog",
        introduction: "Test introduction",
        body: "Test body content",
        conclusion: "Test conclusion",
        categories: ["test"],
        tags: ["test-tag"],
        status: "draft",
      };

      const req = new NextRequest("http://localhost:3000/api/v1/blogs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(blogData),
      });

      // Mock the auth middleware
      const authReq = req as AuthRequest;
      authReq.user = { id: userId, email: "user@example.com", role: "user" };

      const response = await POST(req);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.title).toBe(blogData.title);
      expect(data.author.toString()).toBe(userId);
      expect(data.slug).toBeDefined();
    });
  });
});
