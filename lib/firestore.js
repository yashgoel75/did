import { getAdminDb } from './firebase-admin';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  Timestamp,
  updateDoc
} from 'firebase-admin/firestore';
import crypto from 'crypto';

// Collection names
const AUTH_CODES_COLLECTION = 'authCodes';
const ACCESS_TOKENS_COLLECTION = 'accessTokens';

// Generate a secure random code
export function generateAuthCode() {
  return crypto.randomBytes(32).toString('hex');
}

// Store an authorization code
export async function storeAuthCode(codeData) {
  try {
    // Get the database instance
    const db = getAdminDb();
    
    if (!db) {
      console.error('Firebase Admin not initialized');
      return false;
    }
    
    // Set expiration (10 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    
    const authCode = {
      ...codeData,
      expiresAt: Timestamp.fromDate(expiresAt),
      used: false,
      createdAt: Timestamp.now()
    };
    
    // Always make a string copy of clientId to ensure consistent comparison later
    authCode.clientId = String(authCode.clientId);
    
    // Log what we're storing
    console.log("Storing auth code:", {
      code: authCode.code,
      clientId: authCode.clientId,
      did: authCode.did
    });
    
    // Use the code as the document ID
    await setDoc(doc(db, AUTH_CODES_COLLECTION, authCode.code), authCode);
    
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
    const db = getAdminDb();
    
    if (!db) {
      console.error('Firebase Admin not initialized');
      return null;
    }
    
    const docRef = doc(db, AUTH_CODES_COLLECTION, code);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.log(`Auth code not found: ${code}`);
      return null;
    }
    
    const authCode = docSnap.data();
    
    // Check if expired
    if (authCode.expiresAt && authCode.expiresAt.toDate() < new Date()) {
      console.log(`Auth code expired: ${code}`);
      await deleteDoc(docRef); // Clean up expired code
      return null;
    }
    
    // Check if used
    if (authCode.used) {
      console.log(`Auth code already used: ${code}`);
      return null;
    }
    
    console.log(`Found auth code: ${code} for client: ${authCode.clientId}`);
    
    // Convert Firestore Timestamp to regular Date for compatibility
    return {
      ...authCode,
      clientId: String(authCode.clientId), // Ensure consistent type for comparison
      expiresAt: authCode.expiresAt.toDate().toISOString(),
      createdAt: authCode.createdAt.toDate().toISOString()
    };
  } catch (error) {
    console.error('Error getting auth code:', error);
    return null;
  }
}

// Mark an authorization code as used
export async function markAuthCodeAsUsed(code) {
  try {
    const db = getAdminDb();
    
    if (!db) {
      console.error('Firebase Admin not initialized');
      return false;
    }
    
    const docRef = doc(db, AUTH_CODES_COLLECTION, code);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.log(`Failed to mark auth code as used (not found): ${code}`);
      return false;
    }
    
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
    const db = getAdminDb();
    
    if (!db) {
      console.error('Firebase Admin not initialized');
      return false;
    }
    
    // Set expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const accessToken = {
      ...tokenData,
      expiresAt: Timestamp.fromDate(expiresAt),
      createdAt: Timestamp.now()
    };
    
    // Use the token as the document ID
    await setDoc(doc(db, ACCESS_TOKENS_COLLECTION, accessToken.token), accessToken);
    
    // Also create a reference by DID-client combo for easier lookups
    if (accessToken.did && accessToken.clientId) {
      await setDoc(
        doc(db, 'tokenReferences', `${accessToken.did}_${accessToken.clientId}`), 
        { token: accessToken.token }
      );
    }
    
    console.log(`Stored new access token for DID: ${accessToken.did}`);
    return true;
  } catch (error) {
    console.error('Error storing access token:', error);
    return false;
  }
}

// Get an access token
export async function getAccessToken(token) {
  try {
    const db = getAdminDb();
    
    if (!db) {
      console.error('Firebase Admin not initialized');
      return null;
    }
    
    const docRef = doc(db, ACCESS_TOKENS_COLLECTION, token);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.log(`Access token not found: ${token.substring(0, 10)}...`);
      return null;
    }
    
    const accessToken = docSnap.data();
    
    // Check if expired
    if (accessToken.expiresAt && accessToken.expiresAt.toDate() < new Date()) {
      console.log(`Access token expired: ${token.substring(0, 10)}...`);
      await deleteDoc(docRef); // Clean up expired token
      return null;
    }
    
    // Convert Firestore Timestamp to regular Date for compatibility
    return {
      ...accessToken,
      expiresAt: accessToken.expiresAt.toDate().toISOString(),
      createdAt: accessToken.createdAt.toDate().toISOString()
    };
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

// Log the current state of the store (for debugging)
export async function logStoreState() {
  try {
    const db = getAdminDb();
    
    if (!db) {
      console.error('Firebase Admin not initialized');
      return { authCodes: 0, accessTokens: 0 };
    }
    
    // Count auth codes
    const authCodesQuery = query(collection(db, AUTH_CODES_COLLECTION));
    const authCodesSnapshot = await getDocs(authCodesQuery);
    const authCodesCount = authCodesSnapshot.size;
    
    // Count access tokens
    const accessTokensQuery = query(collection(db, ACCESS_TOKENS_COLLECTION));
    const accessTokensSnapshot = await getDocs(accessTokensQuery);
    const accessTokensCount = accessTokensSnapshot.size;
    
    console.log("Auth codes in store:", authCodesCount);
    console.log("Access tokens in store:", accessTokensCount);
    
    return { authCodes: authCodesCount, accessTokens: accessTokensCount };
  } catch (error) {
    console.error('Error logging store state:', error);
    return { authCodes: 0, accessTokens: 0 };
  }
}

// Get statistics about the store
export async function getStats() {
  return await logStoreState();
}