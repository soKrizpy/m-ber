import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Support both environment variables (for Vercel/Netlify deployments) and json config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId,
};

// Ensure singleton Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Workspace Scopes for Sheets and Calendar
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/calendar.events');

// In-memory token cache (never stored in localStorage/sessionStorage)
let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Needs user interaction to acquire fresh token
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    console.group('[OAuth Flow: Phase 1] Firebase Auth & Google Token Exchange');
    console.log('[OAuth Flow] Initiating signInWithPopup...', {
      authDomain: auth.config?.authDomain,
      currentOrigin: typeof window !== 'undefined' ? window.location.origin : '',
      currentHost: typeof window !== 'undefined' ? window.location.hostname : '',
    });

    // Run OAuth Redirect URI and Protocol/Port audit before launching popup
    if (typeof window !== 'undefined' && (window as any).verifyOAuthRedirectUriFormat) {
      (window as any).verifyOAuthRedirectUriFormat();
    }

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    console.log('[OAuth Flow] Popup returned user profile:', {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
      hasAccessToken: !!credential?.accessToken,
    });

    if (!credential?.accessToken) {
      console.error('[OAuth Flow: Token Exchange Failure] Google Access Token is missing from credential result.');
      console.groupEnd();
      throw new Error('Gagal mendapatkan token akses dari Google Auth.');
    }

    cachedAccessToken = credential.accessToken;
    console.log('[OAuth Flow: Phase 1 Success] Google OAuth Access Token acquired successfully.');
    console.groupEnd();

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.groupEnd();
    console.group('[OAuth Flow: Phase 1 FAILURE] Firebase Auth Error Detected');
    console.error('Firebase Error Code:', error?.code);
    console.error('Firebase Error Message:', error?.message);
    console.error('Firebase Error CustomData:', error?.customData);
    console.error('Full Error Object:', error);
    console.groupEnd();

    let friendlyMessage = error.message || 'Gagal masuk dengan Google.';
    const host = typeof window !== 'undefined' ? window.location.hostname : 'domain Anda';

    if (error.code === 'auth/unauthorized-domain' || error.message?.includes('unauthorized-domain')) {
      friendlyMessage = `Domain "${host}" belum terdaftar di Authorized Domains Firebase. Buka Firebase Console > Authentication > Settings > Authorized domains, lalu tambahkan "${host}".`;
      if (typeof window !== 'undefined' && (window as any).verifyOAuthRedirectUriFormat) {
        (window as any).verifyOAuthRedirectUriFormat();
      }
    } else if (
      error.code === 'auth/access-denied' ||
      error.message?.includes('access_denied') ||
      error.message?.includes('403')
    ) {
      friendlyMessage =
        'Error 403: access_denied. Aplikasi OAuth Google masih dalam status "Testing". Akun email belum dimasukkan ke daftar "Test Users" di Google Cloud Console, atau status consent screen belum dipublikasikan (Publish App).';
    } else if (error.code === 'auth/popup-blocked') {
      friendlyMessage = 'Jendela pop-up login Google diblokir oleh browser. Harap izinkan pop-up untuk situs ini.';
    } else if (error.code === 'auth/popup-closed-by-user') {
      friendlyMessage = 'Jendela login ditutup sebelum otorisasi selesai.';
    } else if (error.code === 'auth/operation-not-allowed') {
      friendlyMessage = 'Google Sign-in belum diaktifkan di Firebase Console > Authentication > Sign-in method.';
    }

    const enhancedError = new Error(friendlyMessage);
    (enhancedError as any).code = error.code;
    (enhancedError as any).originalError = error;
    throw enhancedError;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
