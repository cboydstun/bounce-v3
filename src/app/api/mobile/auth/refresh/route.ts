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
import { corsHeaders, handleCors } from '@/lib/cors';

export async function OPTIONS(req: NextRequest) {
  return handleCors(req);
}

export async function POST(req: NextRequest) {
  // Handle preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  
  try {
    const { refreshToken: token } = await req.json();
    
    if (!token) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { 
          status: 400,
          headers: corsHeaders(req)
        }
      );
    }
    
    // Verify the refresh token
    const payload = verifyRefreshToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { 
          status: 401,
          headers: corsHeaders(req)
        }
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
        { 
          status: 401,
          headers: corsHeaders(req)
        }
      );
    }
    
    // Get user
    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { 
          status: 401,
          headers: corsHeaders(req)
        }
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
    
    // Return new tokens with CORS headers
    return NextResponse.json({
      accessToken,
      refreshToken
    }, {
      headers: corsHeaders(req)
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Token refresh failed' },
      { 
        status: 500,
        headers: corsHeaders(req)
      }
    );
  }
}
