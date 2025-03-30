import { db } from './firebase'; // Adjust the path to your firebase.js
import crypto from 'crypto';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  doc 
} from 'firebase/firestore';

// Helper function to clean expired items
function removeExpired(items, now = new Date()) {
  return items.filter(item => !item.expiresAt || new Date(item.expiresAt) > now);
}

// Log the current state of the store (for debugging)
export async function logStoreState() {
  try {
    const authCodesSnapshot = await getDocs(collection(db, 'auth_codes'));
    const accessTokensSnapshot = await getDocs(collection(db, 'access_tokens'));
    
    const authCodes = authCodesSnapshot.docs.map(doc => doc.data());
    const accessTokens = accessTokensSnapshot.docs.map(doc => doc.data());
    
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
export async function storeAuthCode(codeData) {
  try {
    // Set expiration (10 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    
    const authCode = {
      ...codeData,
      expiresAt: expiresAt.toISOString(),
      used: false // Add this field for consistency
    };
    
    const docRef = await addDoc(collection(db, 'auth_codes'), authCode);
    
    console.log(`Stored new auth code: ${authCode.code} for client: ${authCode.clientId}`);
    return true;
  } catch (error) {
    console.error('Error storing auth code:', error);
    return false;
  }
}

// Get an authorization code
export async function getAuthCode(code) {
  try {
    const q = query(
      collection(db, 'auth_codes'), 
      where('code', '==', code),
      where('used', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    const authCodes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filter out expired codes
    const validCodes = removeExpired(authCodes);
    
    const authCode = validCodes[0];
    
    if (authCode) {
      console.log(`Found auth code: ${code} for client: ${authCode.clientId}`);
    } else {
      console.log(`Auth code not found or expired: ${code}`);
    }
    
    return authCode || null;
  } catch (error) {
    console.error('Error getting auth code:', error);
    return null;
  }
}

// Mark an authorization code as used
export async function markAuthCodeAsUsed(code) {
  try {
    const q = query(
      collection(db, 'auth_codes'), 
      where('code', '==', code)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      console.log(`Failed to mark auth code as used (not found): ${code}`);
      return false;
    }
    
    const docRef = doc(db, 'auth_codes', querySnapshot.docs[0].id);
    await updateDoc(docRef, { used: true });
    
    console.log(`Marked auth code as used: ${code}`);
    return true;
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
export async function storeAccessToken(tokenData) {
  try {
    // Set expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const accessToken = {
      ...tokenData,
      expiresAt: expiresAt.toISOString()
    };
    
    const docRef = await addDoc(collection(db, 'access_tokens'), accessToken);
    
    return true;
  } catch (error) {
    console.error('Error storing access token:', error);
    return false;
  }
}

// Get an access token
export async function getAccessToken(token) {
  try {
    const q = query(
      collection(db, 'access_tokens'), 
      where('token', '==', token)
    );
    
    const querySnapshot = await getDocs(q);
    const accessTokens = querySnapshot.docs.map(doc => doc.data());
    
    // Filter out expired tokens
    const validTokens = removeExpired(accessTokens);
    
    return validTokens[0] || null;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

// For debugging
export async function getStats() {
  try {
    const authCodesSnapshot = await getDocs(collection(db, 'auth_codes'));
    const accessTokensSnapshot = await getDocs(collection(db, 'access_tokens'));
    
    return {
      authCodes: authCodesSnapshot.size,
      accessTokens: accessTokensSnapshot.size
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return { authCodes: 0, accessTokens: 0 };
  }
}