import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/tokens';

export type AuthenticatedRequest = NextRequest & {
  user: {
    userId: string;
    email: string;
    name?: string;
  }
};

export function withMobileAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.get('authorization');
      console.log('Middleware - Authorization header:', authHeader);
      
      // Check if Authorization header exists and has correct format
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Middleware - Returning Unauthorized');
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      // Extract token
      const token = authHeader.split(' ')[1];
      
      // Verify token
      const payload = verifyAccessToken(token);
      
      // Check if token is valid
      if (!payload) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      }
      
      // Add user to request
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = {
        userId: payload.userId,
        email: payload.email,
        name: payload.name
      };
      
      // Call the original handler
      return handler(authenticatedReq);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}
