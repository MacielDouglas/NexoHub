import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import i18n, { normalizeLanguage } from "@/i18n";
import { apiFetch } from "./api";
import { authClient, updateLanguage } from "./auth-client";

export interface Session {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    globalRole: string;
    language?: string | null;
  };
  session: {
    id: string;
    token: string;
    expiresAt: string;
  };
}

interface AuthContextType {
  session: Session | null;
  hasOrganization: boolean;
  organizationRole: string | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setLanguage: (lang: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  hasOrganization: false,
  organizationRole: null,
  isLoading: true,
  signOut: async () => {},
  refreshSession: async () => {},
  setLanguage: async () => {},
});

async function fetchOrganizationState(userId: string): Promise<{
  hasOrganization: boolean;
  role: string | null;
}> {
  try {
    const res = await apiFetch("/api/members");
    if (!res.ok) return { hasOrganization: false, role: null };
    const data = await res.json();
    const members: { userId: string; role: string }[] = data.members ?? [];
    const current = members.find((m) => m.userId === userId);
    return { hasOrganization: true, role: current?.role ?? null };
  } catch {
    return { hasOrganization: false, role: null };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [hasOrganization, setHasOrganization] = useState(false);
  const [organizationRole, setOrganizationRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mounted = useRef(true);

  const loadSession = useCallback(async () => {
    try {
      const { data } = await authClient.getSession();
      if (!mounted.current) return;
      if (data) {
        const sessionData = data as unknown as Session;
        setSession(sessionData);
        if (sessionData.user.language) {
          i18n.changeLanguage(normalizeLanguage(sessionData.user.language));
        }
        const org = await fetchOrganizationState(sessionData.user.id);
        if (!mounted.current) return;
        setHasOrganization(org.hasOrganization);
        setOrganizationRole(org.role);
      } else {
        setSession(null);
        setHasOrganization(false);
        setOrganizationRole(null);
      }
    } catch {
      if (mounted.current) {
        setSession(null);
        setHasOrganization(false);
        setOrganizationRole(null);
      }
    } finally {
      if (mounted.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    mounted.current = true;
    async function load() {
      try {
        const { data } = await authClient.getSession();
        if (cancelled || !mounted.current) return;
        if (data) {
          const sessionData = data as unknown as Session;
          setSession(sessionData);
          if (sessionData.user.language) {
            i18n.changeLanguage(normalizeLanguage(sessionData.user.language));
          }
          const org = await fetchOrganizationState(sessionData.user.id);
          if (cancelled || !mounted.current) return;
          setHasOrganization(org.hasOrganization);
          setOrganizationRole(org.role);
        } else {
          setSession(null);
          setHasOrganization(false);
          setOrganizationRole(null);
        }
      } catch {
        if (!cancelled && mounted.current) {
          setSession(null);
          setHasOrganization(false);
          setOrganizationRole(null);
        }
      } finally {
        if (!cancelled && mounted.current) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
      mounted.current = false;
    };
  }, []);

  async function handleSignOut() {
    await authClient.signOut();
    setSession(null);
    setHasOrganization(false);
    setOrganizationRole(null);
  }

  async function handleSetLanguage(lang: string) {
    const normalized = normalizeLanguage(lang);
    i18n.changeLanguage(normalized);
    const ok = await updateLanguage(normalized);
    if (ok && session) {
      setSession({ ...session, user: { ...session.user, language: normalized } });
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        hasOrganization,
        organizationRole,
        isLoading,
        signOut: handleSignOut,
        refreshSession: loadSession,
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