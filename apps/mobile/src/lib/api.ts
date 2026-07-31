import { Platform } from "react-native";

import { getCookie } from "./cookie-store";

const API_URL = Platform.select({
  web: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
  default: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
});

export function getBaseUrl(): string {
  return API_URL;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const cookie = await getCookie();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...((options.headers as Record<string, string>) ?? {}),
    },
    credentials: "include",
  });

  return response;
}