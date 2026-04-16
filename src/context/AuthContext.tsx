import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface AuthState {
  userId: Id<"users"> | null;
  displayName: string | null;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => {
    const stored = sessionStorage.getItem("auth");
    return stored ? JSON.parse(stored) : { userId: null, displayName: null };
  });

  const loginMutation = useMutation(api.auth.login);

  const login = useCallback(
    async (username: string, password: string) => {
      const result = await loginMutation({ username, password });
      if (result.success && result.userId) {
        const state = { userId: result.userId, displayName: result.displayName ?? username };
        setAuth(state);
        sessionStorage.setItem("auth", JSON.stringify(state));
        return true;
      }
      return false;
    },
    [loginMutation]
  );

  const logout = useCallback(() => {
    setAuth({ userId: null, displayName: null });
    sessionStorage.removeItem("auth");
  }, []);

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
