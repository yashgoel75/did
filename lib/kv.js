import { kv } from '@vercel/kv';

// Auth codes with 10-minute expiry
export async function storeAuthCode(code, data) {
  return kv.set(`authcode:${code}`, JSON.stringify(data), { ex: 600 }); // 10 minutes
}

export async function getAuthCode(code) {
  const data = await kv.get(`authcode:${code}`);
  return data ? JSON.parse(data) : null;
}

export async function markAuthCodeAsUsed(code) {
  const data = await getAuthCode(code);
  if (!data) return false;
  
  data.used = true;
  return kv.set(`authcode:${code}`, JSON.stringify(data), { ex: 600 });
}

// Access tokens with 7-day expiry (for persistent sessions)
export async function storeAccessToken(token, data) {
  return kv.set(`token:${token}`, JSON.stringify(data), { ex: 604800 }); // 7 days
}

export async function getAccessToken(token) {
  const data = await kv.get(`token:${token}`);
  return data ? JSON.parse(data) : null;
}

// OAuth client storage
export async function storeClient(clientId, data) {
  return kv.set(`client:${clientId}`, JSON.stringify(data));
}

export async function getClient(clientId) {
  const data = await kv.get(`client:${clientId}`);
  return data ? JSON.parse(data) : null;
}

export async function getAllClients() {
  const keys = await kv.keys('client:*');
  if (!keys.length) return [];
  
  const clients = await Promise.all(
    keys.map(async (key) => {
      const data = await kv.get(key);
      return data ? JSON.parse(data) : null;
    })
  );
  
  return clients.filter(client => client && client.active);
}