// Firebase Authentication for EPRI accounts.
//
// Config comes from Vite env vars (set them in Vercel → Settings →
// Environment Variables as VITE_FIREBASE_*), falling back to the project
// already used by Cryptic Hub. None of this is secret: the web API key only
// identifies the project; who may sign in is decided by the enabled sign-in
// providers and the authorised-domain list in the Firebase console.
//
// Firebase is loaded on demand, so the landing page never downloads it.

const env = import.meta.env || {};
const BAKED = {
  apiKey: "AIzaSyC3e8T0nsoyey0EA9ozQbt9o5THI4pGzng",
  authDomain: "arikia.firebaseapp.com",
  projectId: "arikia",
  appId: "1:472996212961:web:d6a53311c8d281f97507a0",
  storageBucket: "arikia.firebasestorage.app",
  messagingSenderId: "472996212961",
};

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || BAKED.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || BAKED.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || BAKED.projectId,
  appId: env.VITE_FIREBASE_APP_ID || BAKED.appId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || BAKED.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || BAKED.messagingSenderId,
};

let loading = null;

export function loadAuth() {
  if (!loading) {
    loading = Promise.all([import("firebase/app"), import("firebase/auth")]).then(([app, auth]) => {
      const fb = app.getApps().length ? app.getApp() : app.initializeApp(firebaseConfig);
      const instance = auth.getAuth(fb);
      return { auth: instance, sdk: auth };
    });
  }
  return loading;
}

// Firebase error codes → something a business owner can act on.
const MESSAGES = {
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/missing-password": "Enter your password.",
  "auth/weak-password": "Use at least 8 characters for your password.",
  "auth/email-already-in-use": "There's already an account with that email. Try signing in.",
  "auth/invalid-credential": "Email or password is incorrect.",
  "auth/wrong-password": "Email or password is incorrect.",
  "auth/user-not-found": "Email or password is incorrect.",
  "auth/too-many-requests": "Too many attempts. Wait a few minutes, or reset your password.",
  "auth/network-request-failed": "Can't reach the sign-in service. Check your internet connection.",
  "auth/popup-closed-by-user": "The Google window was closed before signing in.",
  "auth/popup-blocked": "Your browser blocked the Google window. Allow pop-ups and try again.",
  "auth/unauthorized-domain": "This website isn't on the sign-in allow-list yet. Add the domain in Firebase → Authentication → Settings → Authorized domains.",
  "auth/operation-not-allowed": "This sign-in method isn't turned on in Firebase yet.",
  "auth/user-disabled": "This account has been disabled.",
};

export const authMessage = (err) => MESSAGES[err?.code] || "Something went wrong signing in. Please try again.";
