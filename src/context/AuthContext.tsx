import { createContext, useContext, useEffect } from "react";
import type { ReactNode } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { authClient } from "../lib/auth-client";
import type { Id } from "../../convex/_generated/dataModel";

interface AuthContextValue {
  userId: Id<"users"> | null;
  displayName: string | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session } = authClient.useSession();
  const userProfile = useQuery(api.auth.getCurrentUser);
  const storeUser = useMutation(api.auth.storeUser);

  // Create Convex user profile on first login
  useEffect(() => {
    if (session && userProfile === null) {
      void storeUser({ displayName: session.user.name ?? undefined });
    }
  }, [session, userProfile, storeUser]);

  const logout = () => { void authClient.signOut(); };

  return (
    <AuthContext.Provider value={{
      userId: userProfile?._id ?? null,
      displayName: userProfile?.displayName ?? null,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
