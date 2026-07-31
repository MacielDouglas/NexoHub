import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const API_URL = Platform.select({
  web: "http://localhost:3000",
  default: "http://localhost:3000",
});

const SESSION_KEY = "nexohub_session";

function getBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_URL || API_URL;
}

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

async function apiFetch(path: string, options: RequestInit = {}) {
  const cookies = await SecureStore.getItemAsync(SESSION_KEY);

  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(cookies ? { Cookie: cookies } : {}),
      ...options.headers,
    },
    credentials: "include",
  });

  const setCookie = response.headers.get("set-cookie");
  if (setCookie) {
    await SecureStore.setItemAsync(SESSION_KEY, setCookie);
  }

  return response;
}

export const authClient = {
  async signInWithGoogle(idToken: string, accessToken: string) {
    const response = await apiFetch("/api/auth/sign-in/social", {
      method: "POST",
      body: JSON.stringify({
        provider: "google",
        idToken: {
          token: idToken,
          accessToken,
        },
      }),
    });

    const data = await response.json();
    return { data, error: response.ok ? null : data };
  },

  async getSession(): Promise<Session | null> {
    try {
      const cookies = await SecureStore.getItemAsync(SESSION_KEY);

      if (!cookies) return null;

      const response = await fetch(`${getBaseUrl()}/api/auth/get-session`, {
        headers: {
          Cookie: cookies,
        },
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          await SecureStore.deleteItemAsync(SESSION_KEY);
        }
        return null;
      }

      const data = await response.json();
      return data as Session;
    } catch {
      return null;
    }
  },

  async updateLanguage(language: string): Promise<boolean> {
    try {
      const response = await apiFetch("/api/user/language", {
        method: "PATCH",
        body: JSON.stringify({ language }),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  async signOut() {
    try {
      const cookies = await SecureStore.getItemAsync(SESSION_KEY);
      await fetch(`${getBaseUrl()}/api/auth/sign-out`, {
        method: "POST",
        headers: {
          Cookie: cookies || "",
        },
        credentials: "include",
      });
    } finally {
      await SecureStore.deleteItemAsync(SESSION_KEY);
    }
  },

  async clearSession() {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  },
};
