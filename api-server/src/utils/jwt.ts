import jwt from 'jsonwebtoken';
import { logger } from './logger.js';

export interface JWTPayload {
  contractorId: string;
  email: string;
  name: string;
  isVerified: boolean;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

class JWTService {
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  private accessTokenExpiry: string | number;
  private refreshTokenExpiry: string | number;

  constructor() {
    this.accessTokenSecret = process.env.JWT_SECRET || 'fallback-secret';
    this.refreshTokenSecret = process.env.JWT_SECRET || 'fallback-secret';
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';

    if (!process.env.JWT_SECRET) {
      logger.warn('JWT_SECRET not set in environment variables, using fallback');
    }
  }

  generateAccessToken(payload: JWTPayload): string {
    try {
      return jwt.sign(payload, this.accessTokenSecret, {
        expiresIn: this.accessTokenExpiry,
        issuer: 'bounce-mobile-api',
        audience: 'bounce-contractors',
      });
    } catch (error) {
      logger.error('Error generating access token:', error);
      throw new Error('Failed to generate access token');
    }
  }

  generateRefreshToken(contractorId: string): string {
    try {
      return jwt.sign(
        { contractorId, type: 'refresh' },
        this.refreshTokenSecret,
        {
          expiresIn: this.refreshTokenExpiry,
          issuer: 'bounce-mobile-api',
          audience: 'bounce-contractors',
        }
      );
    } catch (error) {
      logger.error('Error generating refresh token:', error);
      throw new Error('Failed to generate refresh token');
    }
  }

  generateTokenPair(payload: JWTPayload): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload.contractorId),
    };
  }

  verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'bounce-mobile-api',
        audience: 'bounce-contractors',
      }) as jwt.JwtPayload & JWTPayload;

      return {
        contractorId: decoded.contractorId,
        email: decoded.email,
        name: decoded.name,
        isVerified: decoded.isVerified,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      } else {
        logger.error('Error verifying access token:', error);
        throw new Error('Token verification failed');
      }
    }
  }

  verifyRefreshToken(token: string): { contractorId: string; type: string } {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'bounce-mobile-api',
        audience: 'bounce-contractors',
      }) as jwt.JwtPayload & { contractorId: string; type: string };

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return {
        contractorId: decoded.contractorId,
        type: decoded.type,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      } else {
        logger.error('Error verifying refresh token:', error);
        throw new Error('Token verification failed');
      }
    }
  }

  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  getTokenExpiry(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as jwt.JwtPayload;
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch (error) {
      logger.error('Error decoding token for expiry:', error);
      return null;
    }
  }
}

export const jwtService = new JWTService();
export default jwtService;
