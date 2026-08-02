import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import i18n, { normalizeLanguage } from "@/i18n";
import { apiFetch } from "./api";
import { authClient } from "./auth-client";

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
    console.log("[auth] /api/members status:", res.status);

    if (!res.ok) {
      const text = await res.text();
      console.log("[auth] /api/members body:", text);
      return { hasOrganization: false, role: null };
    }

    const data = await res.json();
    console.log("[auth] /api/members json:", data);

    const members: { userId: string; role: string }[] = data.members ?? [];
    const current = members.find((member) => member.userId === userId);

    return {
      hasOrganization: true,
      role: current?.role ?? null,
    };
  } catch (error) {
    console.log("[auth] /api/members error:", error);
    return { hasOrganization: false, role: null };
  }
}

async function persistLanguage(language: string): Promise<boolean> {
  try {
    const response = await apiFetch("/api/user/language", {
      method: "PATCH",
      body: JSON.stringify({ language }),
    });

    return response.ok;
  } catch {
    return false;
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
          await i18n.changeLanguage(
            normalizeLanguage(sessionData.user.language),
          );
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
      if (mounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;

    const run = async () => {
      await loadSession();
    };

    void run();

    return () => {
      mounted.current = false;
    };
  }, [loadSession]);

  const handleSignOut = useCallback(async () => {
    await authClient.signOut();
    if (!mounted.current) return;

    setSession(null);
    setHasOrganization(false);
    setOrganizationRole(null);
  }, []);

  const handleSetLanguage = useCallback(
    async (lang: string) => {
      const normalized = normalizeLanguage(lang);
      await i18n.changeLanguage(normalized);

      const ok = await persistLanguage(normalized);

      if (ok && session && mounted.current) {
        setSession({
          ...session,
          user: {
            ...session.user,
            language: normalized,
          },
        });
      }
    },
    [session],
  );

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
