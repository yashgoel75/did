/**
 * Utility to add CORS headers to all API responses
 */
export function addCorsHeaders(headers = {}, origin = null) {
  const allowedOrigins = [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://did-green.vercel.app',
    'https://did-demo-weld.vercel.app/'
  ];
  
  // If a specific origin is provided and it's in the allowed list, use it
  // Otherwise, use '*' for development or the default allowed origin for production
  const originValue = origin && allowedOrigins.includes(origin) 
    ? origin 
    : '*';
  
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': originValue,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...headers
  };
}

// Usage in an API route:
// return new Response(
//   JSON.stringify(data),
//   { status: 200, headers: addCorsHeaders() }
// );