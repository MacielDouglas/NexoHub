import { createContext, useContext, useEffect, useState, useCallback } from "react";

import i18n, { normalizeLanguage } from "@/i18n";
import { authClient, type Session } from "./auth-client";

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setLanguage: (lang: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
  signOut: async () => {},
  refreshSession: async () => {},
  setLanguage: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const result = await authClient.getSession();
      setSession(result);
      if (result?.user.language) {
        i18n.changeLanguage(normalizeLanguage(result.user.language));
      }
    } catch {
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await authClient.getSession();
      if (cancelled) return;
      setSession(result);
      setIsLoading(false);
      if (result?.user.language) {
        i18n.changeLanguage(normalizeLanguage(result.user.language));
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSignOut() {
    await authClient.signOut();
    setSession(null);
  }

  async function handleSetLanguage(lang: string) {
    const normalized = normalizeLanguage(lang);
    i18n.changeLanguage(normalized);
    const ok = await authClient.updateLanguage(normalized);
    if (ok && session) {
      setSession({
        ...session,
        user: { ...session.user, language: normalized },
      });
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        signOut: handleSignOut,
        refreshSession,
        setLanguage: handleSetLanguage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
