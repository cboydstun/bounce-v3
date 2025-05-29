import { jwtService } from "../../../src/utils/jwt";

describe("JWT Utilities", () => {
  const testContractorId = "507f1f77bcf86cd799439011";

  describe("generateAccessToken", () => {
    it("should generate a valid access token", () => {
      const payload = {
        contractorId: testContractorId,
        email: "test@example.com",
        name: "Test Contractor",
        isVerified: true,
      };
      const token = jwtService.generateAccessToken(payload);

      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
    });

    it("should generate different tokens for different contractor IDs", () => {
      const payload1 = {
        contractorId: "contractor1",
        email: "test1@example.com",
        name: "Test Contractor 1",
        isVerified: true,
      };
      const payload2 = {
        contractorId: "contractor2",
        email: "test2@example.com",
        name: "Test Contractor 2",
        isVerified: true,
      };
      const token1 = jwtService.generateAccessToken(payload1);
      const token2 = jwtService.generateAccessToken(payload2);

      expect(token1).not.toBe(token2);
    });
  });

  describe("generateRefreshToken", () => {
    it("should generate a valid refresh token", () => {
      const token = jwtService.generateRefreshToken(testContractorId);

      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
    });

    it("should generate different tokens for different contractor IDs", () => {
      const token1 = jwtService.generateRefreshToken("contractor1");
      const token2 = jwtService.generateRefreshToken("contractor2");

      expect(token1).not.toBe(token2);
    });
  });

  describe("verifyAccessToken", () => {
    it("should verify a valid access token", () => {
      const payload = {
        contractorId: testContractorId,
        email: "test@example.com",
        name: "Test Contractor",
        isVerified: true,
      };
      const token = jwtService.generateAccessToken(payload);
      const decoded = jwtService.verifyAccessToken(token);

      expect(decoded).toBeTruthy();
      expect(decoded.contractorId).toBe(testContractorId);
      expect(decoded.email).toBe("test@example.com");
      expect(decoded.name).toBe("Test Contractor");
      expect(decoded.isVerified).toBe(true);
    });

    it("should throw error for invalid token", () => {
      expect(() => {
        jwtService.verifyAccessToken("invalid-token");
      }).toThrow();
    });

    it("should throw error for malformed token", () => {
      expect(() => {
        jwtService.verifyAccessToken("not.a.valid.jwt.token");
      }).toThrow();
    });
  });

  describe("verifyRefreshToken", () => {
    it("should verify a valid refresh token", () => {
      const token = jwtService.generateRefreshToken(testContractorId);
      const decoded = jwtService.verifyRefreshToken(token);

      expect(decoded).toBeTruthy();
      expect(decoded.contractorId).toBe(testContractorId);
      expect(decoded.type).toBe("refresh");
    });

    it("should throw error for invalid refresh token", () => {
      expect(() => {
        jwtService.verifyRefreshToken("invalid-token");
      }).toThrow();
    });
  });

  describe("generateTokenPair", () => {
    it("should generate both access and refresh tokens", () => {
      const payload = {
        contractorId: testContractorId,
        email: "test@example.com",
        name: "Test Contractor",
        isVerified: true,
      };
      const tokenPair = jwtService.generateTokenPair(payload);

      expect(tokenPair).toHaveProperty("accessToken");
      expect(tokenPair).toHaveProperty("refreshToken");
      expect(typeof tokenPair.accessToken).toBe("string");
      expect(typeof tokenPair.refreshToken).toBe("string");
      expect(tokenPair.accessToken).not.toBe(tokenPair.refreshToken);
    });
  });

  describe("extractTokenFromHeader", () => {
    it("should extract token from valid Bearer header", () => {
      const token = "test-token-123";
      const header = `Bearer ${token}`;
      const extracted = jwtService.extractTokenFromHeader(header);

      expect(extracted).toBe(token);
    });

    it("should return null for invalid header format", () => {
      expect(jwtService.extractTokenFromHeader("Invalid header")).toBeNull();
      expect(jwtService.extractTokenFromHeader("Bearer")).toBeNull();
      expect(jwtService.extractTokenFromHeader("Basic token")).toBeNull();
    });

    it("should return null for undefined header", () => {
      expect(jwtService.extractTokenFromHeader(undefined)).toBeNull();
    });
  });
});
