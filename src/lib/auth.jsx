import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { loadAuth, authMessage } from "./firebase.js";

// Who is using the app:
//   - a Firebase account (their own workspace, scoped to their uid), or
//   - the guided tour (a sample workspace that needs no account and works
//     offline — for demos at events), or
//   - nobody yet (landing page, sign-in).
const Ctx = createContext(null);

const TOUR_KEY = "epri.tourMode";
const readTour = () => {
  try {
    return sessionStorage.getItem(TOUR_KEY) === "1";
  } catch {
    return false;
  }
};

const shape = (u) => (u ? { uid: u.uid, email: u.email || "", name: u.displayName || (u.email || "").split("@")[0], photo: u.photoURL || "", verified: !!u.emailVerified, provider: u.providerData?.[0]?.providerId || "password" } : null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [tour, setTour] = useState(readTour);

  useEffect(() => {
    let unsub = () => {};
    let alive = true;
    loadAuth()
      .then(({ auth, sdk }) => {
        if (!alive) return;
        unsub = sdk.onAuthStateChanged(auth, (u) => {
          setUser(shape(u));
          setReady(true);
        });
      })
      .catch(() => setReady(true)); // offline: tour mode still works
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  const run = async (fn) => {
    try {
      const { auth, sdk } = await loadAuth();
      return await fn(auth, sdk);
    } catch (e) {
      throw new Error(authMessage(e));
    }
  };

  const signUp = useCallback((name, email, password) =>
    run(async (auth, sdk) => {
      const cred = await sdk.createUserWithEmailAndPassword(auth, email.trim(), password);
      if (name.trim()) await sdk.updateProfile(cred.user, { displayName: name.trim() });
      sdk.sendEmailVerification(cred.user).catch(() => {});
      // onAuthStateChanged fired before the name was set; refresh it.
      setUser(shape(auth.currentUser));
    }), []);

  const signIn = useCallback((email, password) => run((auth, sdk) => sdk.signInWithEmailAndPassword(auth, email.trim(), password)), []);

  const signInWithGoogle = useCallback(() => run((auth, sdk) => sdk.signInWithPopup(auth, new sdk.GoogleAuthProvider())), []);

  const resetPassword = useCallback((email) => run((auth, sdk) => sdk.sendPasswordResetEmail(auth, email.trim())), []);

  const signOut = useCallback(() => run((auth, sdk) => sdk.signOut(auth)), []);

  const startTour = useCallback(() => {
    try {
      sessionStorage.setItem(TOUR_KEY, "1");
    } catch {
      /* in-memory only */
    }
    setTour(true);
  }, []);
  const endTour = useCallback(() => {
    try {
      sessionStorage.removeItem(TOUR_KEY);
      localStorage.removeItem("epri.tour.workspace");
      localStorage.removeItem("epri.tour.vault");
    } catch {
      /* ignore */
    }
    setTour(false);
  }, []);

  const scope = tour ? "tour" : user ? `u_${user.uid}` : "guest";

  return (
    <Ctx.Provider value={{ user, ready, tour, scope, signUp, signIn, signInWithGoogle, resetPassword, signOut, startTour, endTour }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
