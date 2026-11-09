import { Suspense, createContext, lazy, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import servicesApi from "../utils/servicesApi";
import api from "../utils/api";
// Loaded on demand so the public landing bundle stays small
const ServicesAuthModal = lazy(() => import("../components/services/ServicesAuthModal"));
import { translations } from "../utils/servicesTranslations";

/**
 * Centralized Krishna Medicose account.
 *
 * One sign-in (password + e-mail OTP) unlocks every member service: staffing & jobs,
 * doctor collaborations, distributor catalogs, useful links and the Medicine Data bundle.
 * Any component can call `openAuth()` to show the shared sign-in modal.
 */
const AccountContext = createContext(null);

const TOKEN_KEY = "service_token";
const USER_KEY = "service_user";
// Bundle sessions are derived from the account, so they must never outlive it
const DERIVED_KEYS = ["bundle_token", "bundle_user"];

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw && localStorage.getItem(TOKEN_KEY) ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const tokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return !payload.exp || payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

const clearStorage = () => {
  [TOKEN_KEY, USER_KEY, ...DERIVED_KEYS].forEach((k) => localStorage.removeItem(k));
};

export function AccountProvider({ children }) {
  const [user, setUserState] = useState(readStoredUser);
  const [verifying, setVerifying] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));
  const [auth, setAuth] = useState({ open: false, mode: "login", role: null, subRole: null, context: "general", key: 0 });
  const pendingAction = useRef(null);

  const lang = (typeof window !== "undefined" && localStorage.getItem("services_lang")) || "en";
  const t = translations[lang] || translations.en;

  // Persisting setter that accepts a value or an updater function
  const setUser = useCallback((next) => {
    setUserState((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      if (value) localStorage.setItem(USER_KEY, JSON.stringify(value));
      else localStorage.removeItem(USER_KEY);
      return value;
    });
  }, []);

  const signOut = useCallback(async () => {
    const bundleToken = localStorage.getItem("bundle_token");
    clearStorage();
    setUserState(null);
    window.dispatchEvent(new Event("service_auth_change"));
    if (bundleToken) {
      // Best effort: end the dataset session on the server too
      api
        .post("/medicine-bundle/logout", {}, { headers: { Authorization: `Bearer ${bundleToken}` } })
        .catch(() => {});
    }
  }, []);

  const refreshMe = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || tokenExpired(token)) {
      if (token) signOut();
      setVerifying(false);
      return null;
    }
    try {
      const res = await servicesApi.get("/auth/me");
      setUser(res.data);
      return res.data;
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) signOut();
      return null;
    } finally {
      setVerifying(false);
    }
  }, [setUser, signOut]);

  // Validate the stored session once on load
  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  // Keep every tab/component in sync (api interceptors dispatch this on 401)
  useEffect(() => {
    const sync = () => setUserState(readStoredUser());
    const onStorage = (e) => {
      if (e.key === TOKEN_KEY || e.key === USER_KEY) sync();
    };
    window.addEventListener("service_auth_change", sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("service_auth_change", sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  /**
   * Open the shared sign-in / registration modal.
   * @param {object} opts  { mode: 'login'|'register', role, subRole, context, onSuccess }
   */
  const openAuth = useCallback((opts = {}) => {
    pendingAction.current = typeof opts.onSuccess === "function" ? opts.onSuccess : null;
    setAuth((prev) => ({
      open: true,
      mode: opts.mode || "login",
      role: opts.role || null,
      subRole: opts.subRole || null,
      context: opts.context || "general",
      key: prev.key + 1,
    }));
  }, []);

  const closeAuth = useCallback(() => setAuth((prev) => ({ ...prev, open: false })), []);

  /** Run `action` now if signed in, otherwise ask the visitor to sign in first. */
  const requireAccount = useCallback(
    (action, opts = {}) => {
      if (user) {
        action?.(user);
        return true;
      }
      openAuth({ ...opts, onSuccess: action });
      return false;
    },
    [user, openAuth]
  );

  const handleAuthSuccess = useCallback(
    (nextUser) => {
      setUser(nextUser);
      const action = pendingAction.current;
      pendingAction.current = null;
      if (action) setTimeout(() => action(nextUser), 0);
    },
    [setUser]
  );

  const value = useMemo(
    () => ({ user, setUser, verifying, isSignedIn: Boolean(user), openAuth, closeAuth, requireAccount, signOut, refreshMe }),
    [user, setUser, verifying, openAuth, closeAuth, requireAccount, signOut, refreshMe]
  );

  return (
    <AccountContext.Provider value={value}>
      {children}
      {auth.open && (
        <Suspense fallback={null}>
        <ServicesAuthModal
          key={auth.key}
          isOpen={auth.open}
          onClose={closeAuth}
          initialMode={auth.mode}
          initialRole={auth.role}
          initialSubRole={auth.subRole}
          context={auth.context}
          t={t}
          lang={lang}
          onAuthSuccess={handleAuthSuccess}
        />
        </Suspense>
      )}
    </AccountContext.Provider>
  );
}

export const useAccount = () => {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used within an AccountProvider");
  return ctx;
};
