import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import RefreshToken from '@/models/RefreshToken';
import { verifyRefreshToken } from '@/lib/auth/tokens';

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }
    
    // Verify the token to get the tokenId
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json({ success: true }); // Still return success
    }
    
    await dbConnect();
    
    // Revoke the token
    await RefreshToken.updateOne(
      { tokenId: payload.tokenId },
      { isRevoked: true }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: true }); // Still return success
  }
}
