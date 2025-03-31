// Configuration for authorized clients
export const authorizedClients = [
  {
    clientId: 'c910e5d9118d3417234f556887765d73',
    clientSecret: '3dabd8662b412c856230dadca8e2b3ed2821be0249b5478cd446780216da461d',
    name: 'Test Client',
    redirectUris: ['http://did-demo-weld.vercel.app/callback.html'],
    createdAt: new Date().toISOString(),
    active: true
  }
  // Add more clients here if needed
];

// Helper function to get a client by ID
export function getClient(clientId) {
  return authorizedClients.find(client => client.clientId === clientId && client.active);
}

// Helper function to get all active clients (excluding secrets)
export function getAllClients() {
  return authorizedClients
    .filter(client => client.active)
    .map(({ clientSecret, ...client }) => client);
}

// This function isn't needed anymore since we're using hardcoded clients
export function registerClient({ name, redirectUris, description }) {
  console.log('Client registration attempted but disabled:', { name, redirectUris, description });
  return null;
}

const clients = [
  {
    id: 'c910e5d9118d3417234f556887765d73', // This must match what's in callback.html
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

export function getClient(id) {
  if (!id) return null;
  
  // Always compare as strings
  const clientId = String(id);
  
  // Log to help with debugging
  console.log("Looking for client ID:", clientId);
  console.log("Available clients:", clients.map(c => c.id));
  
  return clients.find(client => String(client.id) === clientId) || null;
}