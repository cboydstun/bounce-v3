import jwt from "jsonwebtoken";
import { logger } from "./logger.js";
class JWTService {
    _accessTokenSecret = null;
    _refreshTokenSecret = null;
    _accessTokenExpiry = null;
    _refreshTokenExpiry = null;
    _initialized = false;
    constructor() {
        // Don't initialize here - wait for first method call
    }
    initialize() {
        if (this._initialized)
            return;
        this._accessTokenSecret = process.env.JWT_SECRET || "fallback-secret";
        this._refreshTokenSecret = process.env.JWT_SECRET || "fallback-secret";
        this._accessTokenExpiry = this.validateExpiry(process.env.JWT_ACCESS_EXPIRY || "15m");
        this._refreshTokenExpiry = this.validateExpiry(process.env.JWT_REFRESH_EXPIRY || "7d");
        if (!process.env.JWT_SECRET) {
            logger.warn("JWT_SECRET not set in environment variables, using fallback");
        }
        this._initialized = true;
    }
    get accessTokenSecret() {
        this.initialize();
        return this._accessTokenSecret;
    }
    get refreshTokenSecret() {
        this.initialize();
        return this._refreshTokenSecret;
    }
    get accessTokenExpiry() {
        this.initialize();
        return this._accessTokenExpiry;
    }
    get refreshTokenExpiry() {
        this.initialize();
        return this._refreshTokenExpiry;
    }
    validateExpiry(expiry) {
        // If it's a number string, convert to number (seconds)
        if (/^\d+$/.test(expiry)) {
            return parseInt(expiry, 10);
        }
        // For string formats like '15m', '7d', etc., validate and return as-is
        // The ms library will handle these formats when used by jsonwebtoken
        const validFormats = /^\d+[smhdwy]$/;
        if (validFormats.test(expiry)) {
            return expiry;
        }
        logger.warn(`Invalid expiry format: ${expiry}, using default 15m`);
        return "15m";
    }
    generateAccessToken(payload) {
        try {
            const options = {
                expiresIn: this.accessTokenExpiry,
                issuer: "bounce-mobile-api",
                audience: "bounce-contractors",
            };
            return jwt.sign(payload, this.accessTokenSecret, options);
        }
        catch (error) {
            logger.error("Error generating access token:", error);
            throw new Error("Failed to generate access token");
        }
    }
    generateRefreshToken(contractorId) {
        try {
            const options = {
                expiresIn: this.refreshTokenExpiry,
                issuer: "bounce-mobile-api",
                audience: "bounce-contractors",
            };
            return jwt.sign({ contractorId, type: "refresh" }, this.refreshTokenSecret, options);
        }
        catch (error) {
            logger.error("Error generating refresh token:", error);
            throw new Error("Failed to generate refresh token");
        }
    }
    generateTokenPair(payload) {
        return {
            accessToken: this.generateAccessToken(payload),
            refreshToken: this.generateRefreshToken(payload.contractorId),
        };
    }
    verifyAccessToken(token) {
        try {
            const decoded = jwt.verify(token, this.accessTokenSecret, {
                issuer: "bounce-mobile-api",
                audience: "bounce-contractors",
            });
            return {
                contractorId: decoded.contractorId,
                email: decoded.email,
                name: decoded.name,
                isVerified: decoded.isVerified,
            };
        }
        catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error("Access token expired");
            }
            else if (error instanceof jwt.JsonWebTokenError) {
                throw new Error("Invalid access token");
            }
            else {
                logger.error("Error verifying access token:", error);
                throw new Error("Token verification failed");
            }
        }
    }
    verifyRefreshToken(token) {
        try {
            const decoded = jwt.verify(token, this.refreshTokenSecret, {
                issuer: "bounce-mobile-api",
                audience: "bounce-contractors",
            });
            if (decoded.type !== "refresh") {
                throw new Error("Invalid token type");
            }
            return {
                contractorId: decoded.contractorId,
                type: decoded.type,
            };
        }
        catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error("Refresh token expired");
            }
            else if (error instanceof jwt.JsonWebTokenError) {
                throw new Error("Invalid refresh token");
            }
            else {
                logger.error("Error verifying refresh token:", error);
                throw new Error("Token verification failed");
            }
        }
    }
    extractTokenFromHeader(authHeader) {
        if (!authHeader) {
            return null;
        }
        const parts = authHeader.split(" ");
        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return null;
        }
        return parts[1] || null;
    }
    getTokenExpiry(token) {
        try {
            const decoded = jwt.decode(token);
            if (decoded && decoded.exp) {
                return new Date(decoded.exp * 1000);
            }
            return null;
        }
        catch (error) {
            logger.error("Error decoding token for expiry:", error);
            return null;
        }
    }
}
export const jwtService = new JWTService();
export default jwtService;
//# sourceMappingURL=jwt.js.map