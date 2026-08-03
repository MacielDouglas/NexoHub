import { Platform } from "react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { authClient } from "./auth-client";

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

let configured = false;

function ensureConfigured() {
  if (configured) return;

  if (!GOOGLE_WEB_CLIENT_ID) {
    throw new Error("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID não configurado.");
  }

  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    offlineAccess: true,
    forceCodeForRefreshToken: false,
  });

  configured = true;
}

export async function signInWithGoogleIdToken() {
  if (Platform.OS === "web") {
    return authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });
  }

  ensureConfigured();

  if (Platform.OS === "android") {
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });
  }

  const currentUser = await GoogleSignin.getCurrentUser();
  if (currentUser) {
    await GoogleSignin.signOut().catch(() => undefined);
  }

  const userInfo = await GoogleSignin.signIn();
  const idToken =
    userInfo?.data?.idToken ??
    (userInfo as { idToken?: string | null } | null)?.idToken;

  const accessToken = await GoogleSignin.getTokens()
    .then((tokens) => tokens.accessToken)
    .catch(() => undefined);

  if (!idToken) {
    throw new Error("Google não retornou idToken.");
  }

  return authClient.signIn.social({
    provider: "google",
    idToken: {
      token: idToken,
      accessToken,
    },
  });
}
