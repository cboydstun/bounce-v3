import {
  generateTokenId,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  AccessToken,
  RefreshToken,
} from "../tokens";
import { IUserDocument } from "@/types/user";
import mongoose from "mongoose";

// Mock environment variables
process.env.JWT_SECRET = "test-jwt-secret";

// Mock jsonwebtoken
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn().mockReturnValue("mock-jwt-token"),
  verify: jest.fn().mockImplementation((token, secret) => {
    if (token === "invalid-token" || token.includes("expired")) {
      throw new Error("Invalid token");
    }

    if (token.includes("access")) {
      return {
        userId: "user123",
        email: "test@example.com",
        name: "Test User",
      };
    }

    if (token.includes("refresh")) {
      return {
        userId: "user123",
        tokenId: "token123",
      };
    }

    // Default case for tests that create their own tokens
    try {
      return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    } catch (e) {
      return null;
    }
  }),
}));

// Mock crypto for deterministic testing
jest.mock("crypto", () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue("mock-token-id"),
  }),
}));

// Import jwt after mocking
import jwt from "jsonwebtoken";

describe("Token Utilities", () => {
  // Mock user for testing
  const mockUserId = new mongoose.Types.ObjectId("60d21b4667d0d8992e610c85");
  const mockUser = {
    _id: mockUserId,
    id: mockUserId.toString(),
    email: "test@example.com",
    name: "Test User",
    comparePassword: jest.fn(),
  } as unknown as IUserDocument;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateTokenId", () => {
    it("should generate a token ID", () => {
      const tokenId = generateTokenId();
      expect(tokenId).toBe("mock-token-id");
    });
  });

  describe("generateAccessToken", () => {
    it("should generate an access token for a user document", () => {
      // Spy on jwt.sign
      const signSpy = jest.spyOn(jwt, "sign");

      const token = generateAccessToken(mockUser);

      // Verify jwt.sign was called
      expect(signSpy).toHaveBeenCalled();

      // Check that the first argument to jwt.sign contains the expected properties
      const firstArg = signSpy.mock.calls[0][0];
      expect(firstArg).toHaveProperty("userId");
      expect(firstArg).toHaveProperty("email", mockUser.email);
      expect(firstArg).toHaveProperty("name", mockUser.name);

      // Check other arguments
      expect(signSpy.mock.calls[0][1]).toBe(process.env.JWT_SECRET);
      expect(signSpy.mock.calls[0][2]).toEqual({ expiresIn: "15m" });

      // Verify token is a string
      expect(typeof token).toBe("string");
    });

    it("should generate an access token for an AccessToken object", () => {
      const accessTokenObj: AccessToken = {
        userId: "user123",
        email: "user@example.com",
        name: "User Name",
      };

      const signSpy = jest.spyOn(jwt, "sign");

      const token = generateAccessToken(accessTokenObj);

      expect(signSpy).toHaveBeenCalledWith(
        accessTokenObj,
        process.env.JWT_SECRET!,
        { expiresIn: "15m" },
      );

      expect(typeof token).toBe("string");
    });
  });

  describe("generateRefreshToken", () => {
    it("should generate a refresh token", () => {
      const tokenId = "test-token-id";
      const signSpy = jest.spyOn(jwt, "sign");

      const token = generateRefreshToken(mockUser, tokenId);

      // Verify jwt.sign was called
      expect(signSpy).toHaveBeenCalled();

      // Check that the first argument to jwt.sign contains the expected properties
      const firstArg = signSpy.mock.calls[0][0];
      expect(firstArg).toHaveProperty("userId");
      expect(firstArg).toHaveProperty("tokenId", tokenId);

      // Check other arguments
      expect(signSpy.mock.calls[0][1]).toBe(process.env.JWT_SECRET);
      expect(signSpy.mock.calls[0][2]).toEqual({ expiresIn: "30d" });

      expect(typeof token).toBe("string");
    });
  });

  describe("verifyAccessToken", () => {
    it("should verify a valid access token", () => {
      // Use a token that our mock will recognize as a valid access token
      const token = "valid.access.token";

      // Our mock will return a valid payload for this token
      const result = verifyAccessToken(token);

      expect(result).toEqual({
        userId: "user123",
        email: "test@example.com",
        name: "Test User",
      });

      // Verify jwt.verify was called with correct parameters
      expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET!);
    });

    it("should return null for an invalid token", () => {
      const result = verifyAccessToken("invalid-token");
      expect(result).toBeNull();
      expect(jwt.verify).toHaveBeenCalledWith(
        "invalid-token",
        process.env.JWT_SECRET!,
      );
    });

    it("should return null for an expired token", () => {
      const result = verifyAccessToken("expired.token");
      expect(result).toBeNull();
      expect(jwt.verify).toHaveBeenCalledWith(
        "expired.token",
        process.env.JWT_SECRET!,
      );
    });
  });

  describe("verifyRefreshToken", () => {
    it("should verify a valid refresh token", () => {
      // Use a token that our mock will recognize as a valid refresh token
      const token = "valid.refresh.token";

      // Our mock will return a valid payload for this token
      const result = verifyRefreshToken(token);

      expect(result).toEqual({
        userId: "user123",
        tokenId: "token123",
      });

      // Verify jwt.verify was called with correct parameters
      expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET!);
    });

    it("should return null for an invalid token", () => {
      const result = verifyRefreshToken("invalid-token");
      expect(result).toBeNull();
      expect(jwt.verify).toHaveBeenCalledWith(
        "invalid-token",
        process.env.JWT_SECRET!,
      );
    });
  });
});
