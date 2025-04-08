import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import User from '@/models/User';
import RefreshToken from '@/models/RefreshToken';
import { generateAccessToken, generateRefreshToken, generateTokenId } from '@/lib/auth/tokens';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    // Find user and validate password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Generate tokens
    const tokenId = generateTokenId();
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user, tokenId);
    
    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
    
    await RefreshToken.create({
      userId: user._id,
      tokenId,
      expiresAt,
      isRevoked: false
    });
    
    // Return tokens to client
    return NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Mobile login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
