import { getAdminDb } from '../../../../lib/firebase-admin';
import { addCorsHeaders } from '../../../../utils/cors';
import { collection, getDocs } from 'firebase-admin/firestore';

export async function GET(req) {
  try {
    const db = getAdminDb();
    
    if (!db) {
      return new Response(
        JSON.stringify({ 
          error: "Firebase Admin not initialized", 
          tips: [
            "Check that FIREBASE_ADMIN_CREDENTIALS is properly set in your environment variables", 
            "Ensure the service account has proper permissions", 
            "Verify that the Firebase project exists and is accessible"
          ]
        }),
        { status: 500, headers: addCorsHeaders() }
      );
    }
    
    // Try a simple Firestore operation
    try {
      // Create a test collection
      const testCollection = collection(db, 'diagnostics');
      
      // Add a test document with the current timestamp
      await db.collection('diagnostics').doc('test').set({
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown'
      });
      
      // Check if we can read it back
      const doc = await db.collection('diagnostics').doc('test').get();
      
      return new Response(
        JSON.stringify({
          status: "Firebase Admin SDK is working correctly",
          timestamp: new Date().toISOString(),
          firebaseConnected: true,
          testDocument: doc.exists ? doc.data() : "Not found",
          environment: process.env.NODE_ENV || 'unknown',
          projectId: process.env.FIREBASE_PROJECT_ID || 'unknown'
        }),
        { status: 200, headers: addCorsHeaders() }
      );
    } catch (firestoreError) {
      console.error("Firestore operation error:", firestoreError);
      
      return new Response(
        JSON.stringify({ 
          error: "Firebase Admin initialized but Firestore operation failed", 
          message: firestoreError.message,
          code: firestoreError.code,
          stack: process.env.NODE_ENV === 'development' ? firestoreError.stack : undefined
        }),
        { status: 500, headers: addCorsHeaders() }
      );
    }
  } catch (error) {
    console.error("Firebase debug endpoint error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
      { status: 500, headers: addCorsHeaders() }
    );
  }
}