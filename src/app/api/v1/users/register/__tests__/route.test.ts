import { NextRequest } from "next/server";
import { POST } from "../route";
import * as dbHandler from "@/lib/test/db-handler";
import User from "@/models/User";

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe("Register API", () => {
  it("should return 400 if required fields are missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/users/register", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com" }),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("Email and password are required");
  });

  it("should return 409 if user already exists", async () => {
    // Create a user first
    await User.create({
      email: "existing@example.com",
      password: "password123",
    });

    const req = new NextRequest("http://localhost:3000/api/v1/users/register", {
      method: "POST",
      body: JSON.stringify({
        email: "existing@example.com",
        password: "password123",
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(409);

    const data = await response.json();
    expect(data.error).toBe("User with this email already exists");
  });
});
