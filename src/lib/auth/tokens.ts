import jwt from 'jsonwebtoken';
import { IUserDocument } from '@/types/user';
import crypto from 'crypto';

// Token types
export interface AccessToken {
  userId: string;
  email: string;
  name?: string;
}

export interface RefreshToken {
  userId: string;
  tokenId: string;
}

// Generate a random token ID for refresh tokens
export function generateTokenId(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Generate an access token (short-lived, 15 minutes)
export function generateAccessToken(user: IUserDocument | AccessToken): string {
  const payload: AccessToken = {
    userId: 'userId' in user 
      ? user.userId 
      : (user._id?.toString() || ''),
    email: user.email,
    name: user.name
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '15m'
  });
}

// Generate a refresh token (long-lived, 30 days)
export function generateRefreshToken(user: IUserDocument, tokenId: string): string {
  const payload: RefreshToken = {
    userId: user._id?.toString() || '',
    tokenId
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '30d'
  });
}

// Verify an access token
export function verifyAccessToken(token: string): AccessToken | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as AccessToken;
  } catch (error) {
    return null;
  }
}

// Verify a refresh token
export function verifyRefreshToken(token: string): RefreshToken | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as RefreshToken;
  } catch (error) {
    return null;
  }
}
