import Constants from "expo-constants";
import { Platform } from "react-native";

import { getCookie } from "./cookie-store";

function resolveApiUrl(): string {
  if (Platform.OS === "web") {
    return process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
  }

  // Native: derive the backend host from the Metro dev server. This works on
  // both the Android emulator and physical devices, where "localhost" points
  // to the device itself.
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    if (host && host !== "localhost") {
      return `http://${host}:3000`;
    }
  }

  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes("localhost")) {
    return envUrl;
  }

  return Platform.OS === "android"
    ? "http://10.0.2.2:3000"
    : "http://localhost:3000";
}

const API_URL = resolveApiUrl();

export function getBaseUrl(): string {
  return API_URL;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const cookie = await getCookie();

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(cookie ? { Cookie: cookie } : {}),
      ...((options.headers as Record<string, string>) ?? {}),
    },
    credentials: "include",
  });

  return response;
}