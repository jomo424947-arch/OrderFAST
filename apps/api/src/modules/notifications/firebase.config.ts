import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseApp: App | null = null;
let isConfigured = false;

function initFirebase(): void {
  if (firebaseApp || getApps().length > 0) {
    firebaseApp = getApps()[0] || null;
    isConfigured = Boolean(firebaseApp);
    return;
  }

  try {
    let serviceAccount: any = null;

    // 1. Check environment variable FIREBASE_SERVICE_ACCOUNT_KEY
    const envKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (envKey) {
      if (envKey.trim().startsWith('{')) {
        serviceAccount = JSON.parse(envKey);
      } else {
        const resolvedPath = path.resolve(process.cwd(), envKey);
        if (fs.existsSync(resolvedPath)) {
          serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
        }
      }
    }

    // 2. Fallback: check standard file locations
    if (!serviceAccount) {
      const candidatePaths = [
        path.resolve(process.cwd(), 'service-account.json'),
        path.resolve(__dirname, '../../../service-account.json'),
        path.resolve(__dirname, '../../config/service-account.json'),
      ];

      for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
          serviceAccount = JSON.parse(fs.readFileSync(p, 'utf-8'));
          console.log(`[Firebase] Loaded service account from ${p}`);
          break;
        }
      }
    }

    if (serviceAccount && serviceAccount.project_id) {
      firebaseApp = initializeApp({
        credential: cert(serviceAccount),
      });
      isConfigured = true;
      console.log(`✅ [Firebase] Firebase Admin SDK initialized successfully for project: ${serviceAccount.project_id}`);
    } else {
      console.warn('⚠️ [Firebase] No service-account.json found. Mobile Push Notifications (FCM) are running in standby mode.');
    }
  } catch (error) {
    console.error('❌ [Firebase] Failed to initialize Firebase Admin SDK:', error);
    firebaseApp = null;
    isConfigured = false;
  }
}

// Run initialization
initFirebase();

export function isFirebaseConfigured(): boolean {
  return isConfigured && firebaseApp !== null;
}

export function getFirebaseMessaging(): Messaging | null {
  if (!isFirebaseConfigured() || !firebaseApp) return null;
  return getMessaging(firebaseApp);
}
