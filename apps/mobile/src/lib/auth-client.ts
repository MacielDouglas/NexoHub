import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

import { apiFetch, getBaseUrl } from "./api";
import { setAuthClient } from "./cookie-store";

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

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  plugins: [
    expoClient({
      scheme: "nexohub",
      storage: SecureStore,
    }) as unknown as never,
  ],
});

setAuthClient(
  authClient as unknown as { getCookie: () => Promise<string> },
);

export async function updateLanguage(language: string): Promise<boolean> {
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