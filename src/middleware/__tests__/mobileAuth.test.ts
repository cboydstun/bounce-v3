import { NextRequest, NextResponse } from 'next/server';
import { withMobileAuth, AuthenticatedRequest } from '../mobileAuth';
import { verifyAccessToken } from '@/lib/auth/tokens';

// Mock the verifyAccessToken function
jest.mock('@/lib/auth/tokens', () => ({
  verifyAccessToken: jest.fn()
}));

describe('Mobile Auth Middleware', () => {
  // Mock handler function
  const mockHandler = jest.fn().mockImplementation((req: AuthenticatedRequest) => {
    return Promise.resolve(
      NextResponse.json({ success: true, user: req.user })
    );
  });

  // Mock console.error to prevent test output pollution
  const originalConsoleError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if Authorization header is missing', async () => {
    // Mock verifyAccessToken to ensure it's not called
    (verifyAccessToken as jest.Mock).mockClear();
    
    // Create a request without Authorization header
    const req = new NextRequest('https://example.com/api/protected');
    
    // Debug: Log the request headers
    console.log('Request headers:', req.headers.get('authorization'));
    
    // Apply the middleware
    const middleware = withMobileAuth(mockHandler);
    const response = await middleware(req);
    
    // Check response
    expect(response.status).toBe(401);
    const data = await response.json();
    
    // Debug: Log the actual response data
    console.log('Response data:', data);
    
    expect(data).toEqual({ error: 'Invalid or expired token' });
    
    // Verify verifyAccessToken was not called
    expect(verifyAccessToken).not.toHaveBeenCalled();
    
    // Verify handler was not called
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('should return 401 if Authorization header does not start with Bearer', async () => {
    // Mock verifyAccessToken to ensure it's not called
    (verifyAccessToken as jest.Mock).mockClear();
    
    // Create headers with invalid Authorization format
    const headers = new Headers();
    headers.set('authorization', 'Invalid token');
    
    // Create request with headers
    const req = new NextRequest('https://example.com/api/protected', {
      headers
    });
    
    // Debug: Log the request headers
    console.log('Request headers (invalid format):', req.headers.get('authorization'));
    
    // Apply the middleware
    const middleware = withMobileAuth(mockHandler);
    const response = await middleware(req);
    
    // Check response
    expect(response.status).toBe(401);
    const data = await response.json();
    
    // Debug: Log the actual response data
    console.log('Response data (invalid format):', data);
    
    expect(data).toEqual({ error: 'Invalid or expired token' });
    
    // Verify verifyAccessToken was not called
    expect(verifyAccessToken).not.toHaveBeenCalled();
    
    // Verify handler was not called
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', async () => {
    // Mock verifyAccessToken to return null (invalid token)
    (verifyAccessToken as jest.Mock).mockReturnValue(null);
    
    // Create headers with valid format but invalid token
    const headers = new Headers();
    headers.set('authorization', 'Bearer invalid-token');
    
    // Create request with headers
    const req = new NextRequest('https://example.com/api/protected', {
      headers
    });
    
    // Apply the middleware
    const middleware = withMobileAuth(mockHandler);
    const response = await middleware(req);
    
    // Check response
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toEqual({ error: 'Invalid or expired token' });
    
    // Verify token was verified with the token from the header
    const token = req.headers.get('authorization')?.split(' ')[1];
    expect(verifyAccessToken).toHaveBeenCalledWith(token);
    
    // Verify handler was not called
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('should add user data to request if token is valid', async () => {
    // Mock user data from token
    const mockUser = {
      userId: 'user123',
      email: 'user@example.com',
      name: 'Test User'
    };
    
    // Mock verifyAccessToken to return valid user data
    (verifyAccessToken as jest.Mock).mockReturnValue(mockUser);
    
    // Create headers with valid token
    const headers = new Headers();
    headers.set('authorization', 'Bearer valid-token');
    
    // Create request with headers
    const req = new NextRequest('https://example.com/api/protected', {
      headers
    });
    
    // Apply the middleware
    const middleware = withMobileAuth(mockHandler);
    await middleware(req);
    
    // Verify handler was called with authenticated request
    expect(mockHandler).toHaveBeenCalled();
    
    // Get the request passed to the handler
    const authenticatedReq = mockHandler.mock.calls[0][0];
    
    // Verify user data was added to request
    expect(authenticatedReq.user).toEqual(mockUser);
  });

  it('should call the handler with authenticated request', async () => {
    // Mock user data from token
    const mockUser = {
      userId: 'user123',
      email: 'user@example.com',
      name: 'Test User'
    };
    
    // Mock verifyAccessToken to return valid user data
    (verifyAccessToken as jest.Mock).mockReturnValue(mockUser);
    
    // Create headers with valid token
    const headers = new Headers();
    headers.set('authorization', 'Bearer valid-token');
    
    // Create request with headers
    const req = new NextRequest('https://example.com/api/protected', {
      headers
    });
    
    // Apply the middleware
    const middleware = withMobileAuth(mockHandler);
    const response = await middleware(req);
    
    // Check response from handler
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ success: true, user: mockUser });
    
    // Verify handler was called
    expect(mockHandler).toHaveBeenCalled();
  });

  it('should handle verification errors gracefully', async () => {
    // Mock verifyAccessToken to throw an error
    (verifyAccessToken as jest.Mock).mockImplementation(() => {
      throw new Error('Verification error');
    });
    
    // Create headers with token
    const headers = new Headers();
    headers.set('authorization', 'Bearer error-token');
    
    // Create request with headers
    const req = new NextRequest('https://example.com/api/protected', {
      headers
    });
    
    // Apply the middleware
    const middleware = withMobileAuth(mockHandler);
    const response = await middleware(req);
    
    const data = await response.json();
    expect(data).toEqual({ error: 'Authentication failed' });
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalled();
    
    // Verify handler was not called
    expect(mockHandler).not.toHaveBeenCalled();
  });
});
