import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// For singleton pattern
let adminDb;

function getAdminDb() {
  // Only initialize on the server side
  if (typeof window === 'undefined') {
    try {
      // Check if Firebase Admin is already initialized
      if (getApps().length === 0) {
        let firebaseConfig = {};
        
        if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
          // Decode and parse the credentials
          try {
            const credentialsJson = Buffer.from(
              process.env.FIREBASE_ADMIN_CREDENTIALS, 
              'base64'
            ).toString();
            
            const serviceAccount = JSON.parse(credentialsJson);
            
            firebaseConfig = {
              credential: cert(serviceAccount)
            };
            
            console.log('Using Firebase Admin with provided service account credentials');
          } catch (error) {
            console.error('Error parsing Firebase Admin credentials:', error);
            
            // Fallback to application default credentials
            firebaseConfig = {
              projectId: process.env.FIREBASE_PROJECT_ID || 'first-f214c'
            };
            
            console.log('Using Firebase Admin with application default credentials');
          }
        } else {
          // Use application default credentials
          firebaseConfig = {
            projectId: process.env.FIREBASE_PROJECT_ID || 'first-f214c'
          };
          
          console.log('Using Firebase Admin with application default credentials');
        }
        
        // Initialize the app
        const adminApp = initializeApp(firebaseConfig);
        adminDb = getFirestore(adminApp);
        console.log('Firebase Admin initialized successfully');
      } else {
        // Get the already initialized app
        const adminApp = getApps()[0];
        adminDb = getFirestore(adminApp);
        console.log('Using existing Firebase Admin instance');
      }
    } catch (error) {
      console.error('Error initializing Firebase Admin:', error);
    }
  }
  
  return adminDb;
}

export { getAdminDb };