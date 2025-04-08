import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import User from '@/models/User';
import RefreshToken from '@/models/RefreshToken';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  generateTokenId,
  verifyRefreshToken
} from '@/lib/auth/tokens';

export async function POST(req: NextRequest) {
  try {
    const { refreshToken: token } = await req.json();
    
    if (!token) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }
    
    // Verify the refresh token
    const payload = verifyRefreshToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
    }
    
    await dbConnect();
    
    // Check if token exists and is not revoked
    const storedToken = await RefreshToken.findOne({
      tokenId: payload.tokenId,
      isRevoked: false
    });
    
    if (!storedToken) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
    }
    
    // Get user
    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }
    
    // Revoke the old refresh token
    await RefreshToken.findByIdAndUpdate(storedToken._id, {
      isRevoked: true
    });
    
    // Generate new tokens
    const newTokenId = generateTokenId();
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user, newTokenId);
    
    // Store new refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
    
    await RefreshToken.create({
      userId: user._id,
      tokenId: newTokenId,
      expiresAt,
      isRevoked: false
    });
    
    // Return new tokens
    return NextResponse.json({
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Token refresh failed' },
      { status: 500 }
    );
  }
}
