import { Platform } from "react-native";
import { getCookie } from "./cookie-store";

function resolveApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  if (typeof envUrl === "string" && envUrl.length > 0) {
    return envUrl.endsWith("/") ? envUrl.slice(0, -1) : envUrl;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000";
  }

  return "http://localhost:3000";
}

const API_URL = resolveApiUrl();

export function getBaseUrl(): string {
  return API_URL;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  let cookie = "";
  try {
    cookie = await getCookie();
  } catch (error) {
    console.error("[apiFetch] getCookie error:", error);
  }

  console.log("[apiFetch] url:", `${API_URL}${normalizedPath}`);
  console.log("[apiFetch] has cookie:", Boolean(cookie));

  const headers = new Headers(options.headers ?? {});
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (cookie) {
    headers.set("Cookie", cookie);
  }

  const response = await fetch(`${API_URL}${normalizedPath}`, {
    ...options,
    headers,
    credentials: "omit",
  });

  console.log("[apiFetch] status:", response.status, normalizedPath);

  return response;
}
