import { initializeApp, FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Use import.meta.glob to optionally load the local config without breaking the build if it's missing (e.g. on Vercel)
const configFiles = import.meta.glob('../../firebase-applet-config.json', { eager: true });
const localConfig = (Object.values(configFiles)[0] as any)?.default || {};

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || localConfig.apiKey || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || localConfig.authDomain || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || localConfig.projectId || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || localConfig.storageBucket || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || localConfig.messagingSenderId || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || localConfig.appId || '',
};

console.log('Firebase initializing with Project ID:', firebaseConfig.projectId ? firebaseConfig.projectId : '[MISSING]');
if (!firebaseConfig.apiKey) {
  console.error("FIREBASE CONFIGURATION MISSING! Ensure VITE_FIREBASE_API_KEY is set in your deployment environment and rebuild.");
}

const app = initializeApp(firebaseConfig);
const databaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || localConfig.firestoreDatabaseId || '(default)';
export const db = getFirestore(app, databaseId);
export const auth = getAuth(app);

// Connectivity check
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
