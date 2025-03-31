/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Disable filesystem operations in serverless environments
  webpack: (config, { isServer, dev }) => {
    // If we're in production and in a serverless environment
    if (!dev && isServer) {
      // Replace native Node.js modules with empty objects
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: require.resolve('crypto-browserify'),
      };
    }
    
    return config;
  },
  
  // Enable CORS for API routes
  async headers() {
    return [
      {
        // Apply these headers to all API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
  
  // Example: Add rewrites if you need to support complex routing
  async rewrites() {
    return [
      // If you have any rewrites, add them here
    ];
  },
};

module.exports = nextConfig;