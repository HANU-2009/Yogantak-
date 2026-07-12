// Export adminAuth variable that will be initialized dynamically if credentials are found
export let adminAuth: any = null;

async function initializeFirebaseAdmin() {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
    try {
      // Dynamic imports prevent Node.js from loading firebase-admin at startup in read-only/serverless environments where it is not needed.
      const { initializeApp, getApps, cert } = await import('firebase-admin/app');
      const { getAuth } = await import('firebase-admin/auth');

      if (!getApps().length) {
        const firebaseApp = initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
          }),
        });
        adminAuth = getAuth(firebaseApp);
        console.log('Firebase Admin SDK initialized successfully.');
      }
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK dynamically:', error);
    }
  } else {
    console.warn('Firebase Admin SDK missing credentials. Authentication via Firebase will not work until .env is populated.');
  }
}

// Start initialization immediately
initializeFirebaseAdmin();
