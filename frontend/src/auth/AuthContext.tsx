import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchMe,
  loginJson,
  registerJson,
  type AuthUser,
} from "../api";

const TOKEN_KEY = "saas_token";

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  busy: boolean;
  login: (p: { email: string; password: string }) => Promise<void>;
  register: (p: {
    email: string;
    password: string;
    company_name: string;
  }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY)
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setBusy(false);
      return;
    }
    let cancelled = false;
    setBusy(true);
    fetchMe(token)
      .then(({ user: u }) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = useCallback(
    async (p: { email: string; password: string }) => {
      const { token: t, user: u } = await loginJson(p);
      localStorage.setItem(TOKEN_KEY, t);
      setToken(t);
      setUser(u);
    },
    []
  );

  const register = useCallback(
    async (p: { email: string; password: string; company_name: string }) => {
      const { token: t, user: u } = await registerJson(p);
      localStorage.setItem(TOKEN_KEY, t);
      setToken(t);
      setUser(u);
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      busy,
      login,
      register,
      logout,
    }),
    [token, user, busy, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth outside AuthProvider");
  }
  return ctx;
}
