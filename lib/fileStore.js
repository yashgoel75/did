import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Define file paths
const DATA_DIR = path.join(process.cwd(), 'data');
const AUTH_CODES_FILE = path.join(DATA_DIR, 'auth_codes.json');
const ACCESS_TOKENS_FILE = path.join(DATA_DIR, 'access_tokens.json');

// Ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Initialize files if they don't exist
  if (!fs.existsSync(AUTH_CODES_FILE)) {
    fs.writeFileSync(AUTH_CODES_FILE, JSON.stringify([]));
  }

  if (!fs.existsSync(ACCESS_TOKENS_FILE)) {
    fs.writeFileSync(ACCESS_TOKENS_FILE, JSON.stringify([]));
  }
} catch (error) {
  console.error('Error initializing data directory:', error);
}

// Helper function to read from file
function readFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return [];
  }
}

// Helper function to write to file
function writeFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing to file ${filePath}:`, error);
    return false;
  }
}

// Helper function to clean expired items
function removeExpired(items, now = new Date()) {
  return items.filter(item => !item.expiresAt || new Date(item.expiresAt) > now);
}

// Log the current state of the store (for debugging)
export function logStoreState() {
  try {
    const authCodes = readFile(AUTH_CODES_FILE);
    const accessTokens = readFile(ACCESS_TOKENS_FILE);
    
    console.log("Auth codes in store:", authCodes.length);
    console.log("Auth codes details:", JSON.stringify(authCodes, null, 2));
    console.log("Access tokens in store:", accessTokens.length);
  } catch (error) {
    console.error('Error logging store state:', error);
  }
}

// Generate a secure random code
export function generateAuthCode() {
  return crypto.randomBytes(32).toString('hex');
}

// Store an authorization code
export function storeAuthCode(codeData) {
  try {
    // Set expiration (10 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    
    const authCode = {
      ...codeData,
      expiresAt: expiresAt.toISOString()
    };
    
    // Read existing codes
    let authCodes = readFile(AUTH_CODES_FILE);
    
    // Clean expired codes
    authCodes = removeExpired(authCodes);
    
    // Add new code
    authCodes.push(authCode);
    
    // Write back to file
    const success = writeFile(AUTH_CODES_FILE, authCodes);
    
    console.log(`Stored new auth code: ${authCode.code} for client: ${authCode.clientId}`);
    return success;
  } catch (error) {
    console.error('Error storing auth code:', error);
    return false;
  }
}

// Get an authorization code
export function getAuthCode(code) {
  try {
    // Read codes from file
    let authCodes = readFile(AUTH_CODES_FILE);
    
    // Clean expired codes
    authCodes = removeExpired(authCodes);
    
    // Write cleaned codes back
    writeFile(AUTH_CODES_FILE, authCodes);
    
    // Find the code
    const authCode = authCodes.find(item => item.code === code && !item.used);
    
    if (authCode) {
      console.log(`Found auth code: ${code} for client: ${authCode.clientId}`);
    } else {
      console.log(`Auth code not found: ${code}`);
      console.log(`Available codes: ${authCodes.map(c => c.code).join(', ')}`);
      console.log(`Used codes: ${authCodes.filter(c => c.used).map(c => c.code).join(', ')}`);
    }
    
    return authCode;
  } catch (error) {
    console.error('Error getting auth code:', error);
    return null;
  }
}

// Mark an authorization code as used
export function markAuthCodeAsUsed(code) {
  try {
    // Read codes from file
    let authCodes = readFile(AUTH_CODES_FILE);
    
    // Find the code
    const index = authCodes.findIndex(item => item.code === code);
    if (index !== -1) {
      authCodes[index].used = true;
      
      // Write updated codes back
      const success = writeFile(AUTH_CODES_FILE, authCodes);
      
      console.log(`Marked auth code as used: ${code}`);
      return success;
    }
    
    console.log(`Failed to mark auth code as used (not found): ${code}`);
    return false;
  } catch (error) {
    console.error('Error marking auth code as used:', error);
    return false;
  }
}

// Generate a secure access token
export function generateToken() {
  return crypto.randomBytes(64).toString('hex');
}

// Store an access token
export function storeAccessToken(tokenData) {
  try {
    // Set expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const accessToken = {
      ...tokenData,
      expiresAt: expiresAt.toISOString()
    };
    
    // Read existing tokens
    let accessTokens = readFile(ACCESS_TOKENS_FILE);
    
    // Clean expired tokens
    accessTokens = removeExpired(accessTokens);
    
    // Add new token
    accessTokens.push(accessToken);
    
    // Write back to file
    const success = writeFile(ACCESS_TOKENS_FILE, accessTokens);
    
    return success;
  } catch (error) {
    console.error('Error storing access token:', error);
    return false;
  }
}

// Get an access token
export function getAccessToken(token) {
  try {
    // Read tokens from file
    let accessTokens = readFile(ACCESS_TOKENS_FILE);
    
    // Clean expired tokens
    accessTokens = removeExpired(accessTokens);
    
    // Write cleaned tokens back
    writeFile(ACCESS_TOKENS_FILE, accessTokens);
    
    // Find the token
    return accessTokens.find(item => item.token === token);
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

// For debugging
export function getStats() {
  try {
    const authCodes = readFile(AUTH_CODES_FILE);
    const accessTokens = readFile(ACCESS_TOKENS_FILE);
    
    return {
      authCodes: authCodes.length,
      accessTokens: accessTokens.length
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return { authCodes: 0, accessTokens: 0 };
  }
}