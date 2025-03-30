import { NextResponse } from 'next/server';

// List of allowed origins
const allowedOrigins = [
  'https://did-demo-weld.vercel.app/',
  'https://did-green.vercel.app/',
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
      response.headers.set('Access-Control-Allow-Origin', isAllowedOrigin ? origin : allowedOrigins[0]);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
      
      return response;
    }
    
    // Handle actual request
    const response = NextResponse.next();
    
    // Add CORS headers to response
    response.headers.set('Access-Control-Allow-Origin', isAllowedOrigin ? origin : allowedOrigins[0]);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  }
  
  return NextResponse.next();
}

// Configure which paths this middleware applies to
export const config = {
  matcher: ['/api/:path*']
};