import { NextResponse } from 'next/server';

// List of allowed origins
const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',  // Add this line to allow 127.0.0.1
  'http://localhost:3000',
  'http://127.0.0.1:3000',  // Add this for consistency
  'https://did-demo-weld.vercel.app',
  'https://did-green.vercel.app',
  'https://did-hero.vercel.app',
];

export function middleware(request) {
  // Get the origin from the request headers
  const origin = request.headers.get('origin') || '';
  const isAllowedOrigin = allowedOrigins.includes(origin);

  // Only apply CORS middleware to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 204 });
      
      // Set CORS headers for preflight request
      response.headers.set('Access-Control-Allow-Origin', isAllowedOrigin ? origin : '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
      
      return response;
    }
    
    // Handle actual request
    const response = NextResponse.next();
    
    // Add CORS headers to response
    response.headers.set('Access-Control-Allow-Origin', isAllowedOrigin ? origin : '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  }
  
  // Get the response
  const response = NextResponse.next();
  
  // Allow postMessage communication with the client demo app
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  
  return response;
}

// Configure which paths this middleware applies to
export const config = {
  matcher: ['/api/:path*', '/auth/:path*']
};