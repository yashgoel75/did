// Client configurations
const clients = [
  {
    id: 'c910e5d9118d3417234f556887765d73',
    name: 'Test Client',
    active: true,
    clientSecret: '3dabd8662b412c856230dadca8e2b3ed2821be0249b5478cd446780216da461d',
    redirectUris: [
      'http://localhost:5500/callback.html',
      'http://127.0.0.1:5500/callback.html',
      'https://did-demo-weld.vercel.app/callback.html'
    ]
  }
];

/**
 * Get a client by ID
 * @param {string} id - The client ID
 * @returns {Object|null} The client object or null if not found
 */
export function getClient(id) {
  if (!id) return null;
  
  // Always compare as strings
  const clientId = String(id);
  
  // Find the client by ID
  return clients.find(client => String(client.id) === clientId) || null;
}

/**
 * Check if a redirect URI is valid for a client
 * @param {string} clientId - The client ID
 * @param {string} redirectUri - The redirect URI to check
 * @returns {boolean} Whether the redirect URI is valid
 */
export function isValidRedirectUri(clientId, redirectUri) {
  const client = getClient(clientId);
  if (!client) return false;
  
  return client.redirectUris.includes(redirectUri);
}

/**
 * Get all active clients
 * @returns {Array} Array of client objects
 */
export function getActiveClients() {
  return clients.filter(client => client.active);
}