import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

import { getBaseUrl } from "./api";
import { setAuthClient } from "./cookie-store";

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  plugins: [
    expoClient({
      scheme: "nexohub",
      storage: SecureStore,
      storagePrefix: "nexohub",
    }) as never,
  ],
});

setAuthClient(authClient as { getCookie?: () => Promise<string> });
