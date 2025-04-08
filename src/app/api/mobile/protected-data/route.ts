import { NextResponse } from 'next/server';
import { withMobileAuth, AuthenticatedRequest } from '@/middleware/mobileAuth';

async function handler(req: AuthenticatedRequest) {
  // Access authenticated user info
  const { userId, email, name } = req.user;
  
  // Your protected API logic here
  return NextResponse.json({
    message: 'Protected data accessed successfully',
    user: { userId, email, name },
    timestamp: new Date().toISOString()
  });
}

export const GET = withMobileAuth(handler);
export const POST = withMobileAuth(handler);
