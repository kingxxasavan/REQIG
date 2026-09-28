import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { can, ROLES } from "./rbac.js";
import { deriveKey, encryptJSON, newSalt, unlockEnvelope } from "./crypto.js";
import { generateDemo } from "./demo.js";
import { analyze } from "./analytics.js";
import { uid } from "./format.js";

const PLAIN_KEY = "epri.workspace";
const VAULT_KEY = "epri.vault";
const AUDIT_LIMIT = 300;

const Ctx = createContext(null);

const safeGet = (k) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const safeSet = (k, v) => {
  try {
    if (v == null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch {
    /* storage unavailable — the session still works in memory */
  }
};

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
  safeSet("epri.theme", theme);
  return theme;
}

function initial() {
  const vault = safeGet(VAULT_KEY);
  if (vault) {
    try {
      return { state: null, locked: true, envelope: JSON.parse(vault) };
    } catch {
      /* fall through to plain */
    }
  }
  const plain = safeGet(PLAIN_KEY);
  if (plain) {
    try {
      return { state: JSON.parse(plain), locked: false, envelope: null };
    } catch {
      /* corrupt — start fresh */
    }
  }
  return { state: null, locked: false, envelope: null };
}

export function StoreProvider({ children }) {
  const init = useRef(initial()).current;
  const [state, setState] = useState(init.state);
  const [locked, setLocked] = useState(init.locked);
  const [encrypted, setEncrypted] = useState(!!init.envelope);
  const [toasts, setToasts] = useState([]);
  // The theme attribute is applied synchronously, before React re-renders,
  // so charts reading CSS tokens during render see the new values.
  const [theme, setThemeState] = useState(() => applyTheme(safeGet("epri.theme") || "system"));
  const setTheme = useCallback((t) => setThemeState(applyTheme(t)), []);
  const vault = useRef({ key: null, salt: null, envelope: init.envelope });

  const toast = useCallback((message, level = "info") => {
    const id = uid();
    setToasts((t) => [...t, { id, message, level }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  // Persist on every change: sealed with AES-256-GCM when a passphrase is set.
  useEffect(() => {
    if (locked || !state) return;
    let cancelled = false;
    (async () => {
      if (vault.current.key) {
        const env = await encryptJSON(state, vault.current.key, vault.current.salt);
        if (cancelled) return;
        vault.current.envelope = env;
        safeSet(VAULT_KEY, JSON.stringify(env));
        safeSet(PLAIN_KEY, null);
      } else if (!encrypted) {
        safeSet(PLAIN_KEY, JSON.stringify(state));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state, locked, encrypted]);

  const user = useMemo(() => state?.team?.find((m) => m.id === state.currentUserId) || state?.team?.[0] || null, [state]);
  const role = user?.role || "viewer";
  const allowed = useCallback((perm) => can(role, perm), [role]);

  // Every write goes through here: permission check, then mutation on a
  // copy, then an audit entry.
  const update = useCallback(
    (perm, mutate, action) => {
      if (perm && !can(role, perm)) {
        toast(`${ROLES[role].label} can't do that.`, "critical");
        return false;
      }
      setState((prev) => {
        const next = structuredClone(prev);
        mutate(next);
        if (action) {
          next.audit = [{ id: uid(), at: new Date().toISOString(), user: user?.name || "System", role, action }, ...(next.audit || [])].slice(0, AUDIT_LIMIT);
        }
        return next;
      });
      return true;
    },
    [role, user, toast],
  );

  const replaceState = useCallback((next) => setState(next), []);

  const loadDemo = useCallback((industry) => {
    setState(generateDemo(industry));
  }, []);

  const switchUser = useCallback((id) => {
    setState((prev) => ({ ...prev, currentUserId: id }));
  }, []);

  const enableEncryption = useCallback(
    async (passphrase, data = state) => {
      const salt = newSalt();
      const key = await deriveKey(passphrase, salt);
      vault.current = { key, salt, envelope: null };
      setEncrypted(true);
      const env = await encryptJSON(data, key, salt);
      vault.current.envelope = env;
      safeSet(VAULT_KEY, JSON.stringify(env));
      safeSet(PLAIN_KEY, null);
    },
    [state],
  );

  const disableEncryption = useCallback(() => {
    vault.current = { key: null, salt: null, envelope: null };
    safeSet(VAULT_KEY, null);
    setEncrypted(false);
    safeSet(PLAIN_KEY, JSON.stringify(state));
  }, [state]);

  const lock = useCallback(() => {
    if (!vault.current.key) return;
    vault.current.key = null;
    setState(null);
    setLocked(true);
  }, []);

  const unlock = useCallback(async (passphrase) => {
    const env = vault.current.envelope || JSON.parse(safeGet(VAULT_KEY) || "null");
    if (!env) throw new Error("No encrypted workspace found.");
    const { data, key, salt } = await unlockEnvelope(env, passphrase);
    vault.current = { key, salt, envelope: env };
    setState(data);
    setLocked(false);
  }, []);

  const resetWorkspace = useCallback(() => {
    vault.current = { key: null, salt: null, envelope: null };
    safeSet(VAULT_KEY, null);
    safeSet(PLAIN_KEY, null);
    setEncrypted(false);
    setLocked(false);
    setState(null);
  }, []);

  const analysis = useMemo(() => (state ? analyze(state) : null), [state]);

  const value = {
    state,
    analysis,
    locked,
    encrypted,
    user,
    role,
    allowed,
    update,
    replaceState,
    loadDemo,
    switchUser,
    enableEncryption,
    disableEncryption,
    lock,
    unlock,
    resetWorkspace,
    toast,
    toasts,
    theme,
    setTheme,
    currency: state?.company?.currency || "USD",
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);

export const useTheme = () => {
  const { theme, setTheme } = useContext(Ctx);
  return [theme, setTheme];
};
