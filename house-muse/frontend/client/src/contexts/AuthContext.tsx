import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import * as api from "@/lib/api";

type User = {
  id: number | string;
  username: string;
  email: string;
  [key: string]: unknown;
} | null;

type AuthContextValue = {
  user: User;
  loading: boolean;
  loginWithPassword: (username: string, password: string) => Promise<void>;
  registerWithPassword: (username: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("hm_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .fetchMe()
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem("hm_token"))
      .finally(() => setLoading(false));
  }, []);

  const storeSession = (data: { token: string; user: User }) => {
    localStorage.setItem("hm_token", data.token);
    setUser(data.user);
  };

  const loginWithPassword = async (username: string, password: string) => {
    const res = await api.login({ username, password });
    storeSession(res.data);
  };

  const registerWithPassword = async (username: string, email: string, password: string) => {
    const res = await api.register({ username, email, password });
    storeSession(res.data);
  };

  const loginWithGoogle = async (idToken: string) => {
    const res = await api.googleLogin(idToken);
    storeSession(res.data);
  };

  const signOut = async () => {
    try {
      await api.logout();
    } catch {
      // A stale/expired token shouldn't block local sign-out
    } finally {
      localStorage.removeItem("hm_token");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, loginWithPassword, registerWithPassword, loginWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
