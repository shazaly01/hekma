import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "@/lib/api";

type UserRole = "admin" | "editor" | "data_entry" | "viewer" | null;

export interface User {
  id: string;
  email: string;
  role?: UserRole;
  display_name?: string;
  is_super_admin?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: { access_token: string } | null;
  role: UserRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<{ access_token: string } | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const userStr = localStorage.getItem("user");
    if (token && userStr) {
      setSession({ access_token: token });
      const u = JSON.parse(userStr);
      setUser(u);
      setRole(u.role || null);
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setSession({ access_token: data.access_token });
      setUser(data.user);
      setRole(data.user.role as UserRole);
      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.response?.data?.error || "Login failed") };
    }
  };

  const signUp = async (email: string, password: string, _displayName: string) => {
    // Admin-only: create user via protected /auth/register
    try {
      await api.post('/auth/register', { email, password, role: 'viewer' });
      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.response?.data?.error || "Signup failed") };
    }
  };

  const signOut = async () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setUser(null);
    setSession(null);
    setRole(null);
  };

  // Refresh the current user's data and role from the server (e.g. after role change)
  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setSession({ access_token: data.access_token });
      setUser(data.user);
      setRole(data.user.role as UserRole);
    } catch (err) {
      console.warn("Could not refresh user session:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}