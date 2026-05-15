import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

type User = {
  id: number;
  email: string;
  name: string;
  age?: number | null;
  blood_group?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  allergies?: string | null;
  location?: string | null;
  phone?: string | null;
  health_score?: number | null;
};

type SignUpInput = {
  email: string;
  password: string;
  name: string;
  age?: number;
  blood_group?: string;
  height_cm?: number;
  weight_kg?: number;
  allergies?: string;
  location?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: SignUpInput) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("immunotrace_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const savedToken = localStorage.getItem("immunotrace_token");
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${savedToken}` },
        });
        setUser(data.user);
      } catch (_error) {
        localStorage.removeItem("immunotrace_token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("immunotrace_token", data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const signup = async (payload: SignUpInput) => {
    const { data } = await api.post("/auth/signup", payload);
    localStorage.setItem("immunotrace_token", data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("immunotrace_token");
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, token, loading, login, signup, logout }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
