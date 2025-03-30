/**
 * Utility to add CORS headers to all API responses
 */
export function addCorsHeaders(headers = {}) {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
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