import { NextRequest, NextResponse } from 'next/server';

const allowedOrigins = [
  'http://localhost:5173',  // Ionic dev server
  'http://localhost:8100',  // Alternative Ionic port
  'capacitor://localhost',  // Capacitor
  'http://localhost',       // General localhost
  // Add production domains here
  'https://satxbounce.com'
];

export function corsHeaders(req: NextRequest) {
  const origin = req.headers.get('origin') || '';
  const isAllowedOrigin = allowedOrigins.includes(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

export function handleCors(req: NextRequest) {
  // Check if this is a preflight request
  if (req.method === 'OPTIONS') {
    // Return response with CORS headers
    return new NextResponse(null, { 
      status: 204, 
      headers: corsHeaders(req),
    });
  }
  
  return null; // Not a preflight request, continue normal processing
}
